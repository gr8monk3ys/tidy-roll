import { create } from 'zustand';

export type Decision = 'keep' | 'delete' | 'bookmark';

export type SessionAsset = {
  id: string;
  uri: string;
  filename: string;
  mediaType: string;
  width: number;
  height: number;
  creationTime: number;
  modificationTime: number;
  duration: number;
};

export type CommitAction =
  | { type: 'deleteAssets' }
  | { type: 'removeFromAlbum'; albumId: string; albumTitle: string };

export type SessionSummary = {
  sessionId: string;
  title: string;
  scopeKey: string;
  reviewed: number;
  kept: number;
  deleted: number;
  bookmarked: number;
  deletedAssets: SessionAsset[];
  commit: CommitAction;
};

type SessionStore = {
  summaries: Record<string, SessionSummary>;
  setSummary: (summary: SessionSummary) => void;
  clearSummary: (sessionId: string) => void;
};

export const useSessionStore = create<SessionStore>((set) => ({
  summaries: {},
  setSummary: (summary) =>
    set((state) => ({ summaries: { ...state.summaries, [summary.sessionId]: summary } })),
  clearSummary: (sessionId) =>
    set((state) => {
      const next = { ...state.summaries };
      delete next[sessionId];
      return { summaries: next };
    }),
}));
