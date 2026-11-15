/**
 * The staged-delete flow, free of React/Expo imports so the only destructive
 * path in the app stays unit-testable in Node.
 *
 * Swiping left only ever *stages* an asset. Nothing reaches the photo library
 * until `confirmAndCommit` has been given an explicit yes.
 */

/** Adds `asset` to the front of the staged list; staging the same asset twice is a no-op. */
export function stageAsset<T extends { id: string }>(staged: readonly T[], asset: T): T[] {
  if (staged.some((a) => a.id === asset.id)) return [...staged];
  return [asset, ...staged];
}

export function unstageAsset<T extends { id: string }>(staged: readonly T[], assetId: string): T[] {
  return staged.filter((a) => a.id !== assetId);
}

export type DeleteGateway = {
  /** Deletes the assets. May resolve false or throw, including after deleting only some of them. */
  deleteAssets: (ids: string[]) => Promise<boolean>;
  /** Whether the asset is still in the library. */
  assetExists: (id: string) => Promise<boolean>;
};

export type CommitResult = {
  /** `partial` = some assets are gone and some are still in the library. */
  status: 'deleted' | 'partial' | 'failed';
  deletedIds: string[];
  remainingIds: string[];
};

/**
 * Deletes `ids` and reports exactly which ones are gone. When the delete call
 * fails, the library is re-checked instead of assuming nothing happened: the
 * platform can fail part-way through, and the caller must not keep offering
 * (or counting) assets that no longer exist.
 */
export async function commitStagedDeletes(ids: readonly string[], gateway: DeleteGateway): Promise<CommitResult> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return { status: 'deleted', deletedIds: [], remainingIds: [] };

  let ok = false;
  try {
    ok = await gateway.deleteAssets(unique);
  } catch {
    ok = false;
  }
  if (ok) return { status: 'deleted', deletedIds: unique, remainingIds: [] };

  const stillThere = await Promise.all(
    unique.map(async (id) => {
      try {
        return await gateway.assetExists(id);
      } catch {
        // Can't tell: never claim a delete that wasn't verified.
        return true;
      }
    })
  );
  const deletedIds = unique.filter((_, i) => !stillThere[i]);
  const remainingIds = unique.filter((_, i) => stillThere[i]);
  const status = remainingIds.length === 0 ? 'deleted' : deletedIds.length === 0 ? 'failed' : 'partial';
  return { status, deletedIds, remainingIds };
}

export type CommitOutcome = CommitResult | { status: 'cancelled'; deletedIds: []; remainingIds: string[] };

/**
 * The single entry point for deleting staged assets: asks `confirm` first and
 * touches the library only on an explicit `true`.
 */
export async function confirmAndCommit(
  ids: readonly string[],
  confirm: () => Promise<boolean>,
  gateway: DeleteGateway
): Promise<CommitOutcome> {
  const unique = [...new Set(ids)];
  let confirmed = false;
  try {
    confirmed = (await confirm()) === true;
  } catch {
    confirmed = false;
  }
  if (!confirmed) return { status: 'cancelled', deletedIds: [], remainingIds: unique };
  return commitStagedDeletes(unique, gateway);
}
