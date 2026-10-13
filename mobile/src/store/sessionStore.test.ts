import { beforeEach, describe, expect, it } from 'vitest';
import { useSessionStore, type SessionSummary } from './sessionStore';

function makeSummary(sessionId: string, overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    sessionId,
    title: `Session ${sessionId}`,
    scopeKey: `month:2024-01`,
    reviewed: 10,
    kept: 6,
    deleted: 4,
    bookmarked: 0,
    deletedAssets: [],
    commit: { type: 'deleteAssets' },
    ...overrides,
  };
}

beforeEach(() => {
  useSessionStore.setState({ summaries: {} });
});

describe('setSummary', () => {
  it('stores a summary keyed by its sessionId', () => {
    const summary = makeSummary('s1');
    useSessionStore.getState().setSummary(summary);
    expect(useSessionStore.getState().summaries.s1).toEqual(summary);
  });

  it('keeps summaries for different sessionIds independent', () => {
    useSessionStore.getState().setSummary(makeSummary('s1'));
    useSessionStore.getState().setSummary(makeSummary('s2'));
    const { summaries } = useSessionStore.getState();
    expect(Object.keys(summaries).sort()).toEqual(['s1', 's2']);
    expect(summaries.s1.sessionId).toBe('s1');
    expect(summaries.s2.sessionId).toBe('s2');
  });

  it('replaces (not merges) an existing summary for the same sessionId', () => {
    useSessionStore.getState().setSummary(makeSummary('s1', { reviewed: 10, kept: 6, deleted: 4 }));
    useSessionStore.getState().setSummary(makeSummary('s1', { reviewed: 3, kept: 3, deleted: 0 }));
    expect(useSessionStore.getState().summaries.s1).toEqual(
      makeSummary('s1', { reviewed: 3, kept: 3, deleted: 0 })
    );
  });

  it('preserves the commit action and deletedAssets payload', () => {
    const asset = {
      id: 'a1',
      uri: 'file://a1.jpg',
      filename: 'a1.jpg',
      mediaType: 'photo',
      width: 100,
      height: 100,
      creationTime: 1,
      modificationTime: 1,
      duration: 0,
    };
    const summary = makeSummary('s1', {
      commit: { type: 'removeFromAlbum', albumId: 'alb1', albumTitle: 'Vacation' },
      deletedAssets: [asset],
    });
    useSessionStore.getState().setSummary(summary);
    expect(useSessionStore.getState().summaries.s1.commit).toEqual({
      type: 'removeFromAlbum',
      albumId: 'alb1',
      albumTitle: 'Vacation',
    });
    expect(useSessionStore.getState().summaries.s1.deletedAssets).toEqual([asset]);
  });
});

describe('clearSummary', () => {
  it('removes a summary by sessionId', () => {
    useSessionStore.getState().setSummary(makeSummary('s1'));
    useSessionStore.getState().clearSummary('s1');
    expect(useSessionStore.getState().summaries.s1).toBeUndefined();
  });

  it('leaves other summaries untouched', () => {
    useSessionStore.getState().setSummary(makeSummary('s1'));
    useSessionStore.getState().setSummary(makeSummary('s2'));
    useSessionStore.getState().clearSummary('s1');
    const { summaries } = useSessionStore.getState();
    expect(summaries.s1).toBeUndefined();
    expect(summaries.s2).toBeDefined();
  });

  it('is a no-op for an unknown sessionId', () => {
    useSessionStore.getState().setSummary(makeSummary('s1'));
    useSessionStore.getState().clearSummary('does-not-exist');
    expect(Object.keys(useSessionStore.getState().summaries)).toEqual(['s1']);
  });
});
