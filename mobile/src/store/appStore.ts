import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, subDays } from 'date-fns';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MediaTypeValue } from 'expo-media-library';

export type AppSettings = {
  includeVideos: boolean;
  hapticsEnabled: boolean;
};

export type BookmarkAsset = {
  id: string;
  uri: string;
  filename: string;
  mediaType: MediaTypeValue;
  width: number;
  height: number;
  creationTime: number;
  modificationTime: number;
  duration: number;
};

export type ScopeProgress = {
  cursor: number;
  after?: string;
  updatedAt: number;
  completed?: boolean;
};

export type SessionMode = 'month' | 'day' | 'recents' | 'random' | 'album' | 'bookmarks';

export type LastSession = {
  mode: SessionMode;
  title: string;
  params: Record<string, string>;
  updatedAt: number;
};

export type OnThisDayState = {
  streakCount: number;
  lastCompletedDayKey?: string; // yyyy-MM-dd in local time
  lastCompletedAt?: number; // epoch ms
};

export type AppStats = {
  reviewed: number;
  kept: number;
  bookmarked: number;
  deleted: number;
  removedFromAlbums: number;
};

type AppState = {
  settings: AppSettings;
  bookmarks: BookmarkAsset[];
  progressByScope: Record<string, ScopeProgress>;
  lastSession?: LastSession;
  onThisDay: OnThisDayState;
  stats: AppStats;

  setSettings: (settings: Partial<AppSettings>) => void;
  addBookmark: (asset: BookmarkAsset) => void;
  removeBookmark: (assetId: string) => void;
  clearBookmarks: () => void;

  setScopeProgress: (scopeKey: string, progress: ScopeProgress) => void;
  clearScopeProgress: (scopeKey: string) => void;

  setLastSession: (session: LastSession | undefined) => void;
  markOnThisDayCompleted: (at: number) => void;

  bumpStats: (delta: Partial<AppStats>) => void;
  resetStats: () => void;
};

const DEFAULT_SETTINGS: AppSettings = {
  includeVideos: false,
  hapticsEnabled: true,
};

const DEFAULT_STATS: AppStats = {
  reviewed: 0,
  kept: 0,
  bookmarked: 0,
  deleted: 0,
  removedFromAlbums: 0,
};

const DEFAULT_ON_THIS_DAY: OnThisDayState = {
  streakCount: 0,
  lastCompletedDayKey: undefined,
  lastCompletedAt: undefined,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      bookmarks: [],
      progressByScope: {},
      lastSession: undefined,
      onThisDay: DEFAULT_ON_THIS_DAY,
      stats: DEFAULT_STATS,

      setSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),

      addBookmark: (asset) =>
        set((state) => {
          if (state.bookmarks.some((b) => b.id === asset.id)) return state;
          return { bookmarks: [asset, ...state.bookmarks] };
        }),

      removeBookmark: (assetId) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== assetId),
        })),

      clearBookmarks: () => set({ bookmarks: [] }),

      setScopeProgress: (scopeKey, progress) =>
        set((state) => ({
          progressByScope: { ...state.progressByScope, [scopeKey]: progress },
        })),

      clearScopeProgress: (scopeKey) =>
        set((state) => {
          const next = { ...state.progressByScope };
          delete next[scopeKey];
          return { progressByScope: next };
        }),

      setLastSession: (session) => set({ lastSession: session }),

      markOnThisDayCompleted: (at) =>
        set((state) => {
          const todayKey = format(new Date(at), 'yyyy-MM-dd');
          const lastKey = state.onThisDay.lastCompletedDayKey;
          if (lastKey === todayKey) return state;

          const yesterdayKey = format(subDays(new Date(at), 1), 'yyyy-MM-dd');
          const nextStreak = lastKey === yesterdayKey ? state.onThisDay.streakCount + 1 : 1;

          return {
            onThisDay: {
              streakCount: nextStreak,
              lastCompletedDayKey: todayKey,
              lastCompletedAt: at,
            },
          };
        }),

      bumpStats: (delta) =>
        set((state) => ({
          stats: {
            reviewed: (state.stats.reviewed ?? 0) + (delta.reviewed ?? 0),
            kept: (state.stats.kept ?? 0) + (delta.kept ?? 0),
            bookmarked: (state.stats.bookmarked ?? 0) + (delta.bookmarked ?? 0),
            deleted: (state.stats.deleted ?? 0) + (delta.deleted ?? 0),
            removedFromAlbums: (state.stats.removedFromAlbums ?? 0) + (delta.removedFromAlbums ?? 0),
          },
        })),

      resetStats: () => set({ stats: DEFAULT_STATS }),
    }),
    {
      name: 'tidyroll:v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      merge: (persisted, current) => {
        const p = (persisted as Partial<AppState>) ?? {};
        return {
          ...current,
          ...p,
          settings: { ...current.settings, ...(p.settings ?? {}) },
          onThisDay: { ...current.onThisDay, ...(p.onThisDay ?? {}) },
          stats: { ...current.stats, ...(p.stats ?? {}) },
        };
      },
      partialize: (state) => ({
        settings: state.settings,
        bookmarks: state.bookmarks,
        progressByScope: state.progressByScope,
        lastSession: state.lastSession,
        onThisDay: state.onThisDay,
        stats: state.stats,
      }),
    }
  )
);
