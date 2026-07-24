import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore, type AppStats, type BookmarkAsset } from './appStore';

// The store persists to AsyncStorage, whose native implementation assumes a
// browser/RN runtime (it touches `window`). Stub it with an in-memory mock so
// the store's actions can be exercised under Node/vitest without triggering
// unhandled rejections from the real module. vi.mock calls are hoisted above
// imports by vitest, so this applies before appStore.ts pulls in the real module.
vi.mock('@react-native-async-storage/async-storage', () => {
  const memory = new Map<string, string>();
  return {
    default: {
      getItem: vi.fn(async (key: string) => memory.get(key) ?? null),
      setItem: vi.fn(async (key: string, value: string) => {
        memory.set(key, value);
      }),
      removeItem: vi.fn(async (key: string) => {
        memory.delete(key);
      }),
    },
  };
});

const DEFAULT_SETTINGS = { includeVideos: false, hapticsEnabled: true };
const DEFAULT_STATS: AppStats = {
  reviewed: 0,
  kept: 0,
  bookmarked: 0,
  deleted: 0,
  removedFromAlbums: 0,
};

function makeBookmark(id: string): BookmarkAsset {
  return {
    id,
    uri: `file://${id}.jpg`,
    filename: `${id}.jpg`,
    mediaType: 'photo',
    width: 100,
    height: 100,
    creationTime: 1000,
    modificationTime: 1000,
    duration: 0,
  };
}

beforeEach(() => {
  useAppStore.setState({
    settings: DEFAULT_SETTINGS,
    bookmarks: [],
    progressByScope: {},
    lastSession: undefined,
    onThisDay: { streakCount: 0, lastCompletedDayKey: undefined, lastCompletedAt: undefined },
    stats: DEFAULT_STATS,
  });
});

describe('setSettings', () => {
  it('merges partial settings into existing settings', () => {
    useAppStore.getState().setSettings({ includeVideos: true });
    expect(useAppStore.getState().settings).toEqual({ includeVideos: true, hapticsEnabled: true });
  });
});

describe('addBookmark / removeBookmark / clearBookmarks', () => {
  it('adds a bookmark to the front of the list', () => {
    useAppStore.getState().addBookmark(makeBookmark('a'));
    useAppStore.getState().addBookmark(makeBookmark('b'));
    expect(useAppStore.getState().bookmarks.map((b) => b.id)).toEqual(['b', 'a']);
  });

  it('does not add a duplicate bookmark for the same asset id', () => {
    useAppStore.getState().addBookmark(makeBookmark('a'));
    useAppStore.getState().addBookmark(makeBookmark('a'));
    expect(useAppStore.getState().bookmarks).toHaveLength(1);
  });

  it('removes a bookmark by id', () => {
    useAppStore.getState().addBookmark(makeBookmark('a'));
    useAppStore.getState().addBookmark(makeBookmark('b'));
    useAppStore.getState().removeBookmark('a');
    expect(useAppStore.getState().bookmarks.map((b) => b.id)).toEqual(['b']);
  });

  it('clears all bookmarks', () => {
    useAppStore.getState().addBookmark(makeBookmark('a'));
    useAppStore.getState().clearBookmarks();
    expect(useAppStore.getState().bookmarks).toEqual([]);
  });
});

describe('setScopeProgress / clearScopeProgress', () => {
  it('stores progress under its scope key', () => {
    useAppStore.getState().setScopeProgress('month:2024-01', { cursor: 5, updatedAt: 123 });
    expect(useAppStore.getState().progressByScope['month:2024-01']).toEqual({ cursor: 5, updatedAt: 123 });
  });

  it('removes progress for a scope key without touching others', () => {
    useAppStore.getState().setScopeProgress('month:2024-01', { cursor: 5, updatedAt: 123 });
    useAppStore.getState().setScopeProgress('recents', { cursor: 2, updatedAt: 456 });
    useAppStore.getState().clearScopeProgress('month:2024-01');
    expect(useAppStore.getState().progressByScope).toEqual({
      recents: { cursor: 2, updatedAt: 456 },
    });
  });
});

describe('markOnThisDayCompleted', () => {
  it('starts a streak of 1 on the first completion', () => {
    const day1 = new Date(2026, 0, 1).getTime();
    useAppStore.getState().markOnThisDayCompleted(day1);
    expect(useAppStore.getState().onThisDay.streakCount).toBe(1);
  });

  it('increments the streak when completed on the consecutive day', () => {
    const day1 = new Date(2026, 0, 1).getTime();
    const day2 = new Date(2026, 0, 2).getTime();
    useAppStore.getState().markOnThisDayCompleted(day1);
    useAppStore.getState().markOnThisDayCompleted(day2);
    expect(useAppStore.getState().onThisDay.streakCount).toBe(2);
  });

  it('resets the streak to 1 when a day is skipped', () => {
    const day1 = new Date(2026, 0, 1).getTime();
    const day3 = new Date(2026, 0, 3).getTime();
    useAppStore.getState().markOnThisDayCompleted(day1);
    useAppStore.getState().markOnThisDayCompleted(day3);
    expect(useAppStore.getState().onThisDay.streakCount).toBe(1);
  });

  it('is a no-op when completed again on the same day', () => {
    const morning = new Date(2026, 0, 1, 9, 0).getTime();
    const evening = new Date(2026, 0, 1, 21, 0).getTime();
    useAppStore.getState().markOnThisDayCompleted(morning);
    useAppStore.getState().markOnThisDayCompleted(evening);
    const state = useAppStore.getState().onThisDay;
    expect(state.streakCount).toBe(1);
    expect(state.lastCompletedAt).toBe(morning);
  });
});

describe('bumpStats', () => {
  it('adds a partial delta onto existing stats', () => {
    useAppStore.getState().bumpStats({ reviewed: 1, kept: 1 });
    useAppStore.getState().bumpStats({ reviewed: 1, bookmarked: 1 });
    expect(useAppStore.getState().stats).toEqual({
      reviewed: 2,
      kept: 1,
      bookmarked: 1,
      deleted: 0,
      removedFromAlbums: 0,
    });
  });

  it('supports negative deltas for undo flows', () => {
    useAppStore.getState().bumpStats({ reviewed: 1, kept: 1 });
    useAppStore.getState().bumpStats({ reviewed: -1, kept: -1 });
    expect(useAppStore.getState().stats).toEqual(DEFAULT_STATS);
  });

  it('resetStats restores the default stats', () => {
    useAppStore.getState().bumpStats({ reviewed: 5, deleted: 3 });
    useAppStore.getState().resetStats();
    expect(useAppStore.getState().stats).toEqual(DEFAULT_STATS);
  });
});

describe('setLastSession', () => {
  it('stores and clears the last session pointer', () => {
    useAppStore.getState().setLastSession({
      mode: 'recents',
      title: 'Recents',
      params: {},
      updatedAt: 1,
    });
    expect(useAppStore.getState().lastSession?.mode).toBe('recents');

    useAppStore.getState().setLastSession(undefined);
    expect(useAppStore.getState().lastSession).toBeUndefined();
  });
});
