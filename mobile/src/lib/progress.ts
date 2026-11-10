/**
 * Saved-progress rules for a review scope (a month, an album, Recents, ...).
 * Pure functions so the paging/resume arithmetic can be unit-tested in Node.
 */

export type StoredProgress = {
  cursor: number;
  after?: string;
  updatedAt: number;
  completed?: boolean;
};

/**
 * Where a session should start. An explicit restart, or reopening a scope that
 * was already finished, starts from the top; otherwise it resumes.
 */
export function startingProgress(
  stored: StoredProgress | undefined,
  restart: boolean
): { cursor: number; after: string | undefined } {
  if (!stored || restart || stored.completed) return { cursor: 0, after: undefined };
  return { cursor: stored.cursor, after: stored.after };
}

/**
 * The paging cursor to save after `reviewedCount` items, the last being `lastAssetId`.
 * expo-media-library's `after` is an asset id on iOS but a numeric offset on Android.
 */
export function pagingCursor(os: string, reviewedCount: number, lastAssetId: string): string {
  return os === 'android' ? String(reviewedCount) : lastAssetId;
}

/**
 * Progress for a scope once `removedIds` have left it (deleted, or removed
 * from the album). The reviewed count drops by the number removed so the
 * remaining items are not skipped, and a cursor pointing at a removed asset
 * falls back to `resumeAfter` (the last reviewed asset that is still there).
 */
export function progressAfterRemoval(
  stored: StoredProgress,
  removedIds: readonly string[],
  resumeAfter: string | undefined,
  os: string,
  now: number
): StoredProgress {
  if (removedIds.length === 0) return stored;
  const cursor = Math.max(0, stored.cursor - removedIds.length);
  let after = stored.after;
  if (after !== undefined) {
    if (os === 'android') after = cursor > 0 ? String(cursor) : undefined;
    else if (removedIds.includes(after)) after = resumeAfter;
  }
  return { ...stored, cursor, after, updatedAt: now };
}
