import { describe, expect, it, vi } from 'vitest';
import { commitStagedDeletes, confirmAndCommit, stageAsset, unstageAsset, type DeleteGateway } from './deleteFlow';

/** An in-memory photo library whose delete can be made to fail part-way. */
function makeLibrary(ids: string[], opts: { failAfter?: number; mode?: 'throw' | 'false' } = {}) {
  const library = new Set(ids);
  const deleteAssets = vi.fn(async (toDelete: string[]) => {
    let done = 0;
    for (const id of toDelete) {
      if (opts.failAfter !== undefined && done >= opts.failAfter) {
        if (opts.mode === 'false') return false;
        throw new Error('delete failed');
      }
      library.delete(id);
      done++;
    }
    return true;
  });
  const assetExists = vi.fn(async (id: string) => library.has(id));
  const gateway: DeleteGateway = { deleteAssets, assetExists };
  return { library, gateway, deleteAssets, assetExists };
}

const asset = (id: string) => ({ id });

describe('staging', () => {
  it('staging and unstaging never touch the library', () => {
    const { library, deleteAssets } = makeLibrary(['a', 'b', 'c']);
    let staged = stageAsset([], asset('a'));
    staged = stageAsset(staged, asset('b'));
    staged = unstageAsset(staged, 'a');
    expect(staged.map((a) => a.id)).toEqual(['b']);
    expect(deleteAssets).not.toHaveBeenCalled();
    expect([...library]).toEqual(['a', 'b', 'c']);
  });

  it('stages newest first and ignores a repeat of the same asset', () => {
    let staged = stageAsset([], asset('a'));
    staged = stageAsset(staged, asset('b'));
    staged = stageAsset(staged, asset('a'));
    expect(staged.map((a) => a.id)).toEqual(['b', 'a']);
  });

  it('does not mutate the list it is given', () => {
    const original = [asset('a')];
    stageAsset(original, asset('b'));
    unstageAsset(original, 'a');
    expect(original).toEqual([asset('a')]);
  });
});

describe('confirmAndCommit', () => {
  it('deletes nothing until the confirmation resolves', async () => {
    const { library, gateway, deleteAssets } = makeLibrary(['a', 'b']);
    let answer: (yes: boolean) => void = () => undefined;
    const confirm = vi.fn(() => new Promise<boolean>((resolve) => (answer = resolve)));

    const pending = confirmAndCommit(['a', 'b'], confirm, gateway);
    await Promise.resolve();
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(deleteAssets).not.toHaveBeenCalled();
    expect(library.size).toBe(2);

    answer(true);
    const result = await pending;
    expect(result).toEqual({ status: 'deleted', deletedIds: ['a', 'b'], remainingIds: [] });
    expect(library.size).toBe(0);
  });

  it('cancel deletes nothing and leaves everything staged', async () => {
    const { library, gateway, deleteAssets, assetExists } = makeLibrary(['a', 'b']);
    const result = await confirmAndCommit(['a', 'b'], async () => false, gateway);
    expect(result).toEqual({ status: 'cancelled', deletedIds: [], remainingIds: ['a', 'b'] });
    expect(deleteAssets).not.toHaveBeenCalled();
    expect(assetExists).not.toHaveBeenCalled();
    expect([...library]).toEqual(['a', 'b']);
  });

  it('treats a confirmation that throws as a cancel', async () => {
    const { library, gateway, deleteAssets } = makeLibrary(['a']);
    const result = await confirmAndCommit(
      ['a'],
      async () => {
        throw new Error('dialog dismissed');
      },
      gateway
    );
    expect(result.status).toBe('cancelled');
    expect(deleteAssets).not.toHaveBeenCalled();
    expect(library.has('a')).toBe(true);
  });

  it('only an explicit true counts as confirmation', async () => {
    const { gateway, deleteAssets } = makeLibrary(['a']);
    const result = await confirmAndCommit(['a'], async () => 'yes' as unknown as boolean, gateway);
    expect(result.status).toBe('cancelled');
    expect(deleteAssets).not.toHaveBeenCalled();
  });

  it('deletes exactly the staged ids, each once, and nothing else', async () => {
    const { library, gateway, deleteAssets } = makeLibrary(['a', 'b', 'c', 'd']);
    const result = await confirmAndCommit(['b', 'c', 'b'], async () => true, gateway);
    expect(deleteAssets).toHaveBeenCalledTimes(1);
    expect(deleteAssets).toHaveBeenCalledWith(['b', 'c']);
    expect(result.deletedIds).toEqual(['b', 'c']);
    expect([...library]).toEqual(['a', 'd']);
  });
});

describe('commitStagedDeletes', () => {
  it('makes no library call for an empty list', async () => {
    const { gateway, deleteAssets } = makeLibrary(['a']);
    expect(await commitStagedDeletes([], gateway)).toEqual({ status: 'deleted', deletedIds: [], remainingIds: [] });
    expect(deleteAssets).not.toHaveBeenCalled();
  });

  it.each(['throw', 'false'] as const)('reports a partial failure (%s) with what was and was not deleted', async (mode) => {
    const { library, gateway } = makeLibrary(['a', 'b', 'c', 'd'], { failAfter: 2, mode });
    const result = await commitStagedDeletes(['a', 'b', 'c', 'd'], gateway);
    expect(result).toEqual({ status: 'partial', deletedIds: ['a', 'b'], remainingIds: ['c', 'd'] });
    // The report matches the library exactly.
    expect(result.remainingIds.every((id) => library.has(id))).toBe(true);
    expect(result.deletedIds.some((id) => library.has(id))).toBe(false);
  });

  it('reports failed, with everything remaining, when nothing was deleted', async () => {
    const { library, gateway } = makeLibrary(['a', 'b'], { failAfter: 0 });
    const result = await commitStagedDeletes(['a', 'b'], gateway);
    expect(result).toEqual({ status: 'failed', deletedIds: [], remainingIds: ['a', 'b'] });
    expect(library.size).toBe(2);
  });

  it('reports deleted when the call fails but every asset is in fact gone', async () => {
    const { gateway } = makeLibrary(['a', 'b'], { failAfter: 2 });
    // 'c' was never in the library, so the delete throws after removing a and b.
    const result = await commitStagedDeletes(['a', 'b', 'c'], gateway);
    expect(result).toEqual({ status: 'deleted', deletedIds: ['a', 'b', 'c'], remainingIds: [] });
  });

  it('never claims a delete it could not verify', async () => {
    const gateway: DeleteGateway = {
      deleteAssets: async () => false,
      assetExists: async (id) => {
        if (id === 'b') throw new Error('lookup failed');
        return false;
      },
    };
    const result = await commitStagedDeletes(['a', 'b'], gateway);
    expect(result).toEqual({ status: 'partial', deletedIds: ['a'], remainingIds: ['b'] });
  });

  it('a retry after a partial failure only targets what is still there', async () => {
    const lib = makeLibrary(['a', 'b', 'c'], { failAfter: 1 });
    const first = await commitStagedDeletes(['a', 'b', 'c'], lib.gateway);
    expect(first.remainingIds).toEqual(['b', 'c']);

    const retryDelete = vi.fn(async (ids: string[]) => {
      ids.forEach((id) => lib.library.delete(id));
      return true;
    });
    const second = await commitStagedDeletes(first.remainingIds, { ...lib.gateway, deleteAssets: retryDelete });
    expect(retryDelete).toHaveBeenCalledWith(['b', 'c']);
    expect(second.status).toBe('deleted');
    expect(lib.library.size).toBe(0);
  });
});
