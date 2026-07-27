/**
 * Tidy Roll — core session logic.
 *
 * A TidySession walks a queue of media items and records keep/toss decisions.
 * It is deliberately free of DOM and filesystem concerns so it can be unit
 * tested in Node and reused unchanged in the UI layer. Nothing on disk is
 * touched while a session runs; tossed items are only acted on after the
 * user confirms on the summary screen.
 */

export const KEEP = 'keep';
export const TOSS = 'toss';

export class TidySession {
  /**
   * @param {Array<{id: string, name: string, size: number}>} items
   *   Media items to review. Each must carry a unique `id`, a display
   *   `name`, and a byte `size`. Extra properties are carried through.
   */
  constructor(items) {
    if (!Array.isArray(items)) {
      throw new TypeError('TidySession expects an array of items');
    }
    const seen = new Set();
    for (const item of items) {
      if (!item || typeof item.id !== 'string' || item.id === '') {
        throw new TypeError('every item needs a non-empty string id');
      }
      if (seen.has(item.id)) {
        throw new TypeError(`duplicate item id: ${item.id}`);
      }
      seen.add(item.id);
    }
    this.queue = items.slice();
    this.total = items.length;
    this.kept = [];
    this.tossed = [];
    /** @type {Array<{type: string, item: object}>} */
    this.history = [];
  }

  /** The item currently under review, or null when the session is done. */
  get current() {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  /** The item shown behind the current one (for the card stack). */
  peek(depth = 1) {
    return this.queue[depth] ?? null;
  }

  get remaining() {
    return this.queue.length;
  }

  get reviewed() {
    return this.kept.length + this.tossed.length;
  }

  get done() {
    return this.queue.length === 0;
  }

  /** Bytes that would be reclaimed if all tossed items are removed. */
  get bytesTossed() {
    return this.tossed.reduce((sum, item) => sum + (item.size || 0), 0);
  }

  /** 0..1 share of items decided so far. */
  get progress() {
    return this.total === 0 ? 1 : this.reviewed / this.total;
  }

  /**
   * Record a decision for the current item and advance the queue.
   * @param {'keep'|'toss'} decision
   * @returns {object|null} the decided item, or null if the session is done.
   */
  decide(decision) {
    if (decision !== KEEP && decision !== TOSS) {
      throw new TypeError(`unknown decision: ${decision}`);
    }
    const item = this.queue.shift();
    if (!item) return null;
    (decision === KEEP ? this.kept : this.tossed).push(item);
    this.history.push({ type: decision, item });
    return item;
  }

  /**
   * Defer the current item by moving it to the back of the queue.
   * A no-op when zero or one items remain.
   * @returns {object|null} the skipped item, or null if nothing was skipped.
   */
  skip() {
    if (this.queue.length < 2) return null;
    const item = this.queue.shift();
    this.queue.push(item);
    this.history.push({ type: 'skip', item });
    return item;
  }

  /**
   * Revert the most recent action (decision or skip).
   * @returns {object|null} the item put back under review, or null if
   *   there was nothing to undo.
   */
  undo() {
    const last = this.history.pop();
    if (!last) return null;
    const { type, item } = last;
    if (type === KEEP) {
      this.kept.pop();
      this.queue.unshift(item);
    } else if (type === TOSS) {
      this.tossed.pop();
      this.queue.unshift(item);
    } else {
      // skip: the item was moved to the back of the queue
      this.queue.pop();
      this.queue.unshift(item);
    }
    return item;
  }

  /**
   * Rescue a tossed item from the summary screen; it counts as kept.
   * @returns {boolean} true if the item was found and restored.
   */
  restore(id) {
    const index = this.tossed.findIndex((item) => item.id === id);
    if (index === -1) return false;
    const [item] = this.tossed.splice(index, 1);
    this.kept.push(item);
    return true;
  }

  /** Snapshot of the numbers the UI cares about. */
  stats() {
    return {
      total: this.total,
      remaining: this.remaining,
      reviewed: this.reviewed,
      kept: this.kept.length,
      tossed: this.tossed.length,
      bytesTossed: this.bytesTossed,
      progress: this.progress,
    };
  }
}

/** Sort orders offered in settings. Each returns a NEW array. */
export const SORTS = {
  'oldest': (items) => items.slice().sort((a, b) => (a.lastModified || 0) - (b.lastModified || 0)),
  'newest': (items) => items.slice().sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0)),
  'largest': (items) => items.slice().sort((a, b) => (b.size || 0) - (a.size || 0)),
  'shuffle': (items) => {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  },
};

/** "1.4 MB"-style human byte formatting. */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const rounded = value >= 100 || unit === 0 ? Math.round(value) : value.toFixed(1);
  return `${rounded} ${units[unit]}`;
}

/** File extensions Tidy Roll will offer for review. */
export const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'svg', 'ico', 'jfif',
  'heic', 'heif', 'tif', 'tiff',
]);
export const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'm4v', 'ogv']);

/** Formats browsers generally cannot render; shown as a placeholder card. */
export const UNRENDERABLE_EXTENSIONS = new Set(['heic', 'heif', 'tif', 'tiff', 'mov', 'm4v']);

export function extensionOf(name) {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

/**
 * Decide how a file participates in a session.
 * @returns {'image'|'video'|null} null means: not a media file, ignore it.
 */
export function mediaKind(name, { includeVideos = true } = {}) {
  const ext = extensionOf(name);
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (includeVideos && VIDEO_EXTENSIONS.has(ext)) return 'video';
  return null;
}
