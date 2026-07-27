/**
 * Tidy Roll — filesystem layer.
 *
 * Wraps the File System Access API (Chromium-only). All destructive work
 * happens in executeToss(), which runs only after the user confirms the
 * summary screen. The default mode never deletes anything: tossed files are
 * moved into a "Tidy Roll - Tossed" folder inside the folder being tidied.
 */

import { mediaKind, UNRENDERABLE_EXTENSIONS, extensionOf } from './core.js';

export const TRASH_FOLDER = 'Tidy Roll - Tossed';

export function supportsFileSystemAccess() {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/** Ask the user for a folder with read/write access. Must be user-gesture. */
export function pickFolder() {
  return window.showDirectoryPicker({ mode: 'readwrite', id: 'tidy-roll' });
}

/**
 * Recursively collect media files under `dirHandle`.
 *
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {{recursive?: boolean, includeVideos?: boolean, onProgress?: (count: number) => void}} options
 * @returns {Promise<Array<object>>} session items, one per media file:
 *   { id, name, path, size, lastModified, kind, renderable, handle, parent }
 */
export async function scanFolder(dirHandle, options = {}) {
  const { recursive = false, includeVideos = true, onProgress } = options;
  const items = [];

  async function walk(dir, prefix) {
    for await (const entry of dir.values()) {
      // Skip our own trash folder and hidden/system entries.
      if (entry.name.startsWith('.') || entry.name.startsWith('._')) continue;
      if (entry.kind === 'directory') {
        if (entry.name === TRASH_FOLDER) continue;
        if (recursive) await walk(entry, `${prefix}${entry.name}/`);
        continue;
      }
      const kind = mediaKind(entry.name, { includeVideos });
      if (!kind) continue;
      const file = await entry.getFile();
      items.push({
        id: `${prefix}${entry.name}`,
        name: entry.name,
        path: `${prefix}${entry.name}`,
        size: file.size,
        lastModified: file.lastModified,
        kind,
        renderable: !UNRENDERABLE_EXTENSIONS.has(extensionOf(entry.name)),
        handle: entry,
        parent: dir,
      });
      if (onProgress) onProgress(items.length);
    }
  }

  await walk(dirHandle, '');
  return items;
}

/** Lazily create (and cache) an object URL for an item's file bytes. */
export async function itemURL(item) {
  if (item.url) return item.url;
  const file = await item.handle.getFile();
  item.url = URL.createObjectURL(file);
  return item.url;
}

export function releaseItemURL(item) {
  if (item.url && !item.demo) {
    URL.revokeObjectURL(item.url);
    item.url = null;
  }
}

/** Find a name that does not collide inside `dir` ("pic.jpg" -> "pic (2).jpg"). */
async function availableName(dir, name) {
  const dot = name.lastIndexOf('.');
  const stem = dot === -1 ? name : name.slice(0, dot);
  const ext = dot === -1 ? '' : name.slice(dot);
  let candidate = name;
  for (let n = 2; ; n++) {
    try {
      await dir.getFileHandle(candidate);
    } catch {
      return candidate; // not taken
    }
    candidate = `${stem} (${n})${ext}`;
  }
}

/**
 * Apply the tossed list to disk. Called once, after explicit confirmation.
 *
 * @param {FileSystemDirectoryHandle} rootHandle folder the session ran on
 * @param {Array<object>} tossedItems items from TidySession#tossed
 * @param {'trash'|'delete'} mode 'trash' moves files into TRASH_FOLDER,
 *   'delete' removes them permanently.
 * @param {(done: number, total: number) => void} [onProgress]
 * @returns {Promise<{moved: number, failed: Array<{item: object, error: Error}>}>}
 */
export async function executeToss(rootHandle, tossedItems, mode, onProgress) {
  const failed = [];
  let moved = 0;
  let trashDir = null;
  if (mode === 'trash') {
    trashDir = await rootHandle.getDirectoryHandle(TRASH_FOLDER, { create: true });
  }
  for (const item of tossedItems) {
    try {
      if (mode === 'trash') {
        // Copy bytes into the trash folder, then remove the original.
        // (FileSystemHandle.move() is not yet reliable for local folders.)
        const file = await item.handle.getFile();
        const targetName = await availableName(trashDir, item.name);
        const target = await trashDir.getFileHandle(targetName, { create: true });
        const writable = await target.createWritable();
        await file.stream().pipeTo(writable);
      }
      await item.parent.removeEntry(item.name);
      moved++;
    } catch (error) {
      failed.push({ item, error });
    }
    if (onProgress) onProgress(moved + failed.length, tossedItems.length);
  }
  return { moved, failed };
}

/* ------------------------------------------------------------------ *
 * Recent folders — FileSystemDirectoryHandle objects are structured-
 * cloneable, so we persist them in IndexedDB and re-request permission
 * on the next visit.
 * ------------------------------------------------------------------ */

const DB_NAME = 'tidy-roll';
const STORE = 'recent-folders';
const MAX_RECENT = 5;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: 'name' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(db, mode, run) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const result = run(transaction.objectStore(STORE));
    transaction.oncomplete = () => resolve(result.result ?? result);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function rememberFolder(handle) {
  try {
    const db = await openDB();
    await tx(db, 'readwrite', (store) =>
      store.put({ name: handle.name, handle, savedAt: Date.now() }));
    // Trim to the most recent MAX_RECENT entries.
    const all = await tx(db, 'readonly', (store) => store.getAll());
    if (all.length > MAX_RECENT) {
      all.sort((a, b) => b.savedAt - a.savedAt);
      for (const stale of all.slice(MAX_RECENT)) {
        await tx(db, 'readwrite', (store) => store.delete(stale.name));
      }
    }
    db.close();
  } catch {
    // Recent folders are a convenience; never let them break a session.
  }
}

export async function recentFolders() {
  try {
    const db = await openDB();
    const all = await tx(db, 'readonly', (store) => store.getAll());
    db.close();
    return all.sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

/** Re-arm a stored handle. Returns true when readwrite access is granted. */
export async function ensurePermission(handle) {
  const options = { mode: 'readwrite' };
  if ((await handle.queryPermission(options)) === 'granted') return true;
  return (await handle.requestPermission(options)) === 'granted';
}
