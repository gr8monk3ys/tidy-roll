/**
 * Tidy Roll — app controller.
 * Wires the pure session logic (core.js) and filesystem layer (files.js)
 * into the swipe UI. No frameworks, no build step.
 */

import { TidySession, SORTS, formatBytes, KEEP, TOSS } from './core.js';
import {
  supportsFileSystemAccess, pickFolder, scanFolder, executeToss,
  itemURL, rememberFolder, recentFolders, ensurePermission, TRASH_FOLDER,
} from './files.js';
import { demoItems } from './demo.js';

/* ---------- persistence ---------- */

const hasChromeStorage = typeof chrome !== 'undefined' && chrome.storage?.local;

const storage = {
  async get(key, fallback) {
    try {
      if (hasChromeStorage) {
        const found = await chrome.storage.local.get(key);
        if (found[key] !== undefined) return found[key];
      } else {
        const raw = localStorage.getItem(`tidy-roll:${key}`);
        if (raw !== null) return JSON.parse(raw);
      }
    } catch { /* fall through to default */ }
    return fallback;
  },
  async set(key, value) {
    try {
      if (hasChromeStorage) {
        await chrome.storage.local.set({ [key]: value });
      } else {
        localStorage.setItem(`tidy-roll:${key}`, JSON.stringify(value));
      }
    } catch { /* stats & settings are best-effort */ }
  },
};

const DEFAULT_SETTINGS = { mode: 'trash', sort: 'oldest', recursive: false, includeVideos: true };
let settings = { ...DEFAULT_SETTINGS };

/* ---------- state ---------- */

const state = {
  session: null,
  root: null,       // FileSystemDirectoryHandle for the folder being tidied
  folderName: '',
  demo: false,
  executed: false,
};

/* ---------- tiny DOM helpers ---------- */

const $ = (selector) => document.querySelector(selector);

function show(screenId) {
  document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
  $(screenId).classList.add('active');
}

let toastTimer = null;
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function formatDate(ms) {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ---------- home ---------- */

async function refreshRecent() {
  const list = $('#recent-list');
  list.textContent = '';
  const folders = supportsFileSystemAccess() ? await recentFolders() : [];
  $('#recent').classList.toggle('hidden', folders.length === 0);
  for (const entry of folders) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';
    button.append(entry.name);
    button.addEventListener('click', async () => {
      if (await ensurePermission(entry.handle)) {
        startFolderSession(entry.handle);
      } else {
        toast('Permission was not granted');
      }
    });
    li.append(button);
    list.append(li);
  }
}

async function handlePick() {
  if (!supportsFileSystemAccess()) return;
  let handle;
  try {
    handle = await pickFolder();
  } catch {
    return; // picker dismissed
  }
  await rememberFolder(handle);
  startFolderSession(handle);
}

async function startFolderSession(handle) {
  state.root = handle;
  state.folderName = handle.name;
  state.demo = false;
  state.executed = false;
  show('#screen-scanning');
  $('#scan-count').textContent = '0';
  let items;
  try {
    items = await scanFolder(handle, {
      recursive: settings.recursive,
      includeVideos: settings.includeVideos,
      onProgress: (count) => { $('#scan-count').textContent = String(count); },
    });
  } catch (error) {
    show('#screen-home');
    noteHome(`Couldn't read that folder (${error.name}). Try another one.`, true);
    return;
  }
  if (items.length === 0) {
    show('#screen-home');
    noteHome('No photos or videos found there. Try another folder, or turn on “Include subfolders” in settings.', true);
    return;
  }
  beginSession(items);
}

function startDemoSession() {
  state.root = null;
  state.folderName = 'Demo roll';
  state.demo = true;
  state.executed = false;
  beginSession(demoItems());
}

function noteHome(message, isError = false) {
  const note = $('#note-home');
  note.textContent = message;
  note.classList.toggle('error', isError);
  note.classList.remove('hidden');
}

function beginSession(items) {
  const ordered = (SORTS[settings.sort] || SORTS.oldest)(items);
  state.session = new TidySession(ordered);
  $('#hud-folder-name').textContent = state.folderName;
  $('#hud-folder').title = state.folderName;
  show('#screen-deck');
  renderDeck();
  updateHud();
}

/* ---------- deck ---------- */

function buildCard(item, depth) {
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.depth = String(depth);
  if (depth === 0) card.classList.add('top');

  const media = document.createElement('div');
  media.className = 'card-media';
  card.append(media);

  const showFallback = (label) => {
    media.textContent = '';
    const fallback = document.createElement('div');
    fallback.className = 'no-preview';
    fallback.innerHTML = '<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.9-3.9a1.5 1.5 0 0 0-2.2 0L6 20"/></svg>';
    const text = document.createElement('span');
    text.textContent = label;
    fallback.append(text);
    media.append(fallback);
  };

  if (!item.renderable) {
    showFallback('No preview for this format — judge it by name and date.');
  } else if (item.kind === 'video') {
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.addEventListener('error', () => showFallback('Preview failed to load.'), { once: true });
    itemURL(item).then((url) => { video.src = url; }).catch(() => showFallback('Preview failed to load.'));
    media.append(video);
  } else {
    const img = document.createElement('img');
    img.alt = item.name;
    img.draggable = false;
    img.addEventListener('error', () => showFallback('Preview failed to load.'), { once: true });
    itemURL(item).then((url) => { img.src = url; }).catch(() => showFallback('Preview failed to load.'));
    media.append(img);
  }

  const keepStamp = document.createElement('div');
  keepStamp.className = 'stamp stamp-keep';
  keepStamp.textContent = 'KEEP';
  const tossStamp = document.createElement('div');
  tossStamp.className = 'stamp stamp-toss';
  tossStamp.textContent = 'TOSS';
  card.append(keepStamp, tossStamp);

  const meta = document.createElement('footer');
  meta.className = 'card-meta';
  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = item.name;
  name.title = item.path || item.name;
  const sub = document.createElement('span');
  sub.className = 'sub';
  sub.textContent = `${formatBytes(item.size)} · ${formatDate(item.lastModified)}`;
  meta.append(name, sub);
  card.append(meta);

  return card;
}

function renderDeck() {
  const deck = $('#deck');
  deck.textContent = '';
  const { session } = state;
  if (!session || session.done) return;
  // Bottom-most first so the top card is last in DOM (highest paint order).
  for (let depth = 2; depth >= 0; depth--) {
    const item = depth === 0 ? session.current : session.peek(depth);
    if (!item) continue;
    const card = buildCard(item, depth);
    deck.append(card);
    if (depth === 0) attachDrag(card);
  }
}

function updateHud() {
  const stats = state.session.stats();
  $('#progress-fill').style.width = `${Math.round(stats.progress * 100)}%`;
  const position = Math.min(stats.reviewed + 1, stats.total);
  $('#hud-count').textContent = state.session.done
    ? `${stats.total} of ${stats.total}`
    : `${position} of ${stats.total}`;
  const reclaim = $('#hud-reclaim');
  reclaim.classList.toggle('hidden', stats.tossed === 0);
  $('#hud-reclaim-text').textContent = `${formatBytes(stats.bytesTossed)} to toss`;
}

/* ---------- drag ---------- */

const SWIPE_THRESHOLD = 100;

function attachDrag(card) {
  let startX = 0;
  let startY = 0;
  let dx = 0;
  let dy = 0;
  let dragging = false;
  const keepStamp = card.querySelector('.stamp-keep');
  const tossStamp = card.querySelector('.stamp-toss');

  card.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    dx = 0;
    dy = 0;
    card.classList.add('dragging');
    card.setPointerCapture(event.pointerId);
  });

  card.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    dx = event.clientX - startX;
    dy = event.clientY - startY;
    card.style.transform = `translate(${dx}px, ${dy * 0.35}px) rotate(${dx * 0.05}deg)`;
    keepStamp.style.opacity = String(Math.min(Math.max(dx / SWIPE_THRESHOLD, 0), 1));
    tossStamp.style.opacity = String(Math.min(Math.max(-dx / SWIPE_THRESHOLD, 0), 1));
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    card.classList.remove('dragging');
    if (dx > SWIPE_THRESHOLD) {
      commit(KEEP);
    } else if (dx < -SWIPE_THRESHOLD) {
      commit(TOSS);
    } else {
      card.style.transform = '';
      keepStamp.style.opacity = '0';
      tossStamp.style.opacity = '0';
    }
  };

  card.addEventListener('pointerup', release);
  card.addEventListener('pointercancel', release);
}

/* ---------- decisions ---------- */

function commit(decision) {
  const { session } = state;
  if (!session || session.done) return;
  const deck = $('#deck');
  const topCard = deck.querySelector('.card.top');
  session.decide(decision);

  if (topCard) {
    const stamp = topCard.querySelector(decision === KEEP ? '.stamp-keep' : '.stamp-toss');
    stamp.style.opacity = '1';
    renderDeck();
    deck.append(topCard); // re-attach above the fresh stack for its exit
    topCard.style.zIndex = '10';
    // Force a layout so the fly transition starts from the current position.
    void topCard.offsetWidth;
    topCard.classList.add(decision === KEEP ? 'fly-right' : 'fly-left');
    setTimeout(() => topCard.remove(), 450);
  } else {
    renderDeck();
  }

  updateHud();
  if (session.done) {
    setTimeout(() => finishReview(), 380);
  }
}

function handleSkip() {
  const { session } = state;
  if (!session) return;
  if (!session.skip()) {
    toast('Nothing to skip to — this is the last one');
    return;
  }
  renderDeck();
  updateHud();
}

function handleUndo() {
  const { session } = state;
  if (!session) return;
  if (!session.undo()) {
    toast('Nothing to undo');
    return;
  }
  renderDeck();
  updateHud();
}

/* ---------- summary ---------- */

function finishReview() {
  const { session } = state;
  if (session.tossed.length === 0) {
    completeSession({ moved: 0, failed: [] });
    return;
  }
  renderSummary();
  show('#screen-summary');
}

function renderSummary() {
  const { session } = state;
  const count = session.tossed.length;
  const bytes = formatBytes(session.bytesTossed);
  $('#summary-title').textContent = `${count} to toss · ${bytes}`;

  const sub = $('#summary-sub');
  if (state.demo) {
    sub.textContent = 'This is the demo roll — nothing on your computer will be touched.';
  } else if (settings.mode === 'trash') {
    sub.textContent = `They'll move into a “${TRASH_FOLDER}” folder inside “${state.folderName}”. Nothing is deleted until you empty it yourself.`;
  } else {
    sub.textContent = 'They will be deleted permanently when you confirm.';
  }

  const grid = $('#summary-grid');
  grid.textContent = '';
  for (const item of session.tossed) {
    const tile = document.createElement('figure');
    tile.className = 'summary-tile';
    tile.style.margin = '0';
    if (item.renderable && item.kind === 'image') {
      const img = document.createElement('img');
      img.className = 'thumb';
      img.alt = item.name;
      itemURL(item).then((url) => { img.src = url; }).catch(() => {});
      tile.append(img);
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'thumb-fallback';
      fallback.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.9-3.9a1.5 1.5 0 0 0-2.2 0L6 20"/></svg>';
      tile.append(fallback);
    }
    const caption = document.createElement('figcaption');
    caption.textContent = `${item.name} · ${formatBytes(item.size)}`;
    caption.title = item.path || item.name;
    tile.append(caption);

    const restore = document.createElement('button');
    restore.className = 'restore';
    restore.title = 'Keep this one after all';
    restore.setAttribute('aria-label', `Keep ${item.name}`);
    restore.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>';
    restore.addEventListener('click', () => {
      state.session.restore(item.id);
      if (state.session.tossed.length === 0) {
        completeSession({ moved: 0, failed: [] });
      } else {
        renderSummary();
      }
    });
    tile.append(restore);
    grid.append(tile);
  }

  const confirm = $('#btn-confirm');
  if (state.demo) {
    confirm.textContent = 'Finish the demo';
  } else if (settings.mode === 'trash') {
    confirm.textContent = count === 1 ? 'Move 1 file to the Tossed folder' : `Move ${count} files to the Tossed folder`;
  } else {
    confirm.textContent = count === 1 ? 'Delete 1 file forever' : `Delete ${count} files forever`;
  }
  $('#danger-note').classList.toggle('hidden', state.demo || settings.mode !== 'delete');
  $('#exec').classList.add('hidden');
}

async function handleConfirm() {
  const { session } = state;
  if (state.demo) {
    completeSession({ moved: session.tossed.length, failed: [] });
    return;
  }
  if (settings.mode === 'delete') {
    const sure = window.confirm(`Delete ${session.tossed.length} file(s) permanently? This cannot be undone.`);
    if (!sure) return;
  }
  $('#btn-confirm').disabled = true;
  $('#btn-cancel').disabled = true;
  const exec = $('#exec');
  exec.classList.remove('hidden');
  const fill = $('#exec-fill');
  const text = $('#exec-text');
  const verb = settings.mode === 'trash' ? 'Moving' : 'Deleting';
  let result;
  try {
    result = await executeToss(state.root, session.tossed, settings.mode, (done, total) => {
      fill.style.width = `${Math.round((done / total) * 100)}%`;
      text.textContent = `${verb} ${done} of ${total}…`;
    });
  } catch (error) {
    text.textContent = `Something went wrong (${error.name}). No further files were touched.`;
    $('#btn-confirm').disabled = false;
    $('#btn-cancel').disabled = false;
    return;
  }
  state.executed = true;
  completeSession(result);
}

/* ---------- done ---------- */

async function completeSession(result) {
  const { session } = state;
  const stats = session.stats();
  const failedCount = result.failed.length;
  const tossedOk = result.moved;
  const bytesOk = session.tossed
    .filter((item) => !result.failed.some((failure) => failure.item.id === item.id))
    .reduce((sum, item) => sum + (item.size || 0), 0);

  $('#done-reviewed').textContent = String(stats.reviewed);
  $('#done-tossed').textContent = String(state.demo ? stats.tossed : tossedOk);
  $('#done-bytes').textContent = formatBytes(state.demo ? stats.bytesTossed : bytesOk);

  const note = $('#done-note');
  const again = $('#btn-again');
  again.textContent = 'Tidy another folder';
  if (state.demo) {
    $('#done-title').textContent = 'That was the demo!';
    note.textContent = 'Nothing on your computer was touched. Ready for the real thing?';
    again.textContent = 'Tidy a real folder';
  } else if (stats.tossed === 0) {
    $('#done-title').textContent = "Everything's a keeper!";
    note.textContent = `You went through ${stats.reviewed} item(s) and kept them all. Sometimes the roll is just good.`;
  } else {
    $('#done-title').textContent = 'Nice tidying!';
    let message = settings.mode === 'trash'
      ? `Tossed files are in “${TRASH_FOLDER}” inside “${state.folderName}” — empty it whenever you're ready.`
      : 'Tossed files were deleted permanently.';
    if (failedCount > 0) {
      message += ` ${failedCount} file(s) couldn't be processed (locked or permission denied).`;
    }
    note.textContent = message;
  }
  note.classList.remove('hidden');
  show('#screen-done');

  if (!state.demo && stats.reviewed > 0) {
    const lifetime = await storage.get('lifetime', { reviewed: 0, tossed: 0, bytes: 0 });
    lifetime.reviewed += stats.reviewed;
    lifetime.tossed += tossedOk;
    lifetime.bytes += bytesOk;
    await storage.set('lifetime', lifetime);
  }
  state.session = null;
}

/* ---------- settings ---------- */

function openSettings() {
  const dialog = $('#settings-modal');
  dialog.querySelector(`input[name="mode"][value="${settings.mode}"]`).checked = true;
  $('#set-sort').value = settings.sort;
  $('#set-recursive').checked = settings.recursive;
  $('#set-videos').checked = settings.includeVideos;
  dialog.showModal();
}

async function saveSettings() {
  const dialog = $('#settings-modal');
  settings = {
    mode: dialog.querySelector('input[name="mode"]:checked').value,
    sort: $('#set-sort').value,
    recursive: $('#set-recursive').checked,
    includeVideos: $('#set-videos').checked,
  };
  await storage.set('settings', settings);
  toast('Settings saved');
  // Mode affects the summary copy if it is on screen.
  if (state.session && $('#screen-summary').classList.contains('active')) {
    renderSummary();
  }
}

/* ---------- wiring ---------- */

function activeScreenIs(id) {
  return $(id).classList.contains('active');
}

document.addEventListener('keydown', (event) => {
  if ($('#settings-modal').open) return;
  if (!activeScreenIs('#screen-deck') || !state.session) return;
  if (event.repeat && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  switch (event.key) {
    case 'ArrowLeft': event.preventDefault(); commit(TOSS); break;
    case 'ArrowRight': event.preventDefault(); commit(KEEP); break;
    case 'ArrowDown': event.preventDefault(); handleSkip(); break;
    case 'z': case 'Z': handleUndo(); break;
  }
});

window.addEventListener('beforeunload', (event) => {
  if (state.session && !state.demo && state.session.reviewed > 0 && !state.executed) {
    event.preventDefault();
  }
});

$('#btn-pick').addEventListener('click', handlePick);
$('#btn-demo').addEventListener('click', startDemoSession);
$('#btn-toss').addEventListener('click', () => commit(TOSS));
$('#btn-keep').addEventListener('click', () => commit(KEEP));
$('#btn-skip').addEventListener('click', handleSkip);
$('#btn-undo').addEventListener('click', handleUndo);
$('#btn-finish').addEventListener('click', finishReview);
$('#btn-confirm').addEventListener('click', handleConfirm);
$('#btn-cancel').addEventListener('click', () => {
  $('#btn-confirm').disabled = false;
  $('#btn-cancel').disabled = false;
  completeSession({ moved: 0, failed: [] });
});
$('#btn-again').addEventListener('click', () => {
  show('#screen-home');
  $('#note-home').classList.add('hidden');
  refreshRecent();
});
$('#btn-settings').addEventListener('click', openSettings);
$('#btn-save-settings').addEventListener('click', saveSettings);

/* ---------- boot ---------- */

(async function boot() {
  settings = { ...DEFAULT_SETTINGS, ...(await storage.get('settings', {})) };
  if (!supportsFileSystemAccess()) {
    $('#btn-pick').disabled = true;
    noteHome('Folder access needs a Chromium browser (Chrome, Edge, Brave, Arc, Opera). You can still try the demo roll.');
  }
  refreshRecent();

  // ?demo=1 jumps straight into the demo (used by docs screenshots too).
  const params = new URLSearchParams(location.search);
  if (params.get('demo') === '1') startDemoSession();
})();
