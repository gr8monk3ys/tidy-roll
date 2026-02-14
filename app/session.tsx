import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';

import { theme } from '@/src/theme';
import { dayBounds, formatMonthLabel, formatShortDate, formatTime, monthBounds, type MonthKey } from '@/src/lib/dates';
import { fetchOldestAsset, getMediaPermission, type MediaPermission } from '@/src/lib/media';
import { useAppStore, type BookmarkAsset, type SessionMode } from '@/src/store/appStore';
import { SwipeCard } from '@/src/components/SwipeCard';
import { useSessionStore, type SessionAsset, type SessionSummary } from '@/src/store/sessionStore';
import { ShareError, shareAssetById } from '@/src/lib/share';

type Mode =
  | { mode: 'month'; monthKey: MonthKey; restart: boolean }
  | { mode: 'day'; month: number; day: number }
  | { mode: 'recents' }
  | { mode: 'random' }
  | { mode: 'album'; albumId: string; albumTitle: string; albumAction: 'delete' | 'remove' }
  | { mode: 'bookmarks' };

const PAGE_SIZE = 60;

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function assetToBookmarkAsset(a: MediaLibrary.Asset): BookmarkAsset {
  return {
    id: a.id,
    uri: a.uri,
    filename: a.filename,
    mediaType: a.mediaType,
    width: a.width,
    height: a.height,
    creationTime: a.creationTime,
    modificationTime: a.modificationTime,
    duration: a.duration,
  };
}

function assetToSessionAsset(a: MediaLibrary.Asset): SessionAsset {
  return {
    id: a.id,
    uri: a.uri,
    filename: a.filename,
    mediaType: a.mediaType,
    width: a.width,
    height: a.height,
    creationTime: a.creationTime,
    modificationTime: a.modificationTime,
    duration: a.duration,
  };
}

function scopeKeyForMode(m: Mode): string {
  switch (m.mode) {
    case 'month':
      return `month:${m.monthKey}`;
    case 'day':
      return `day:${String(m.month).padStart(2, '0')}-${String(m.day).padStart(2, '0')}`;
    case 'recents':
      return 'recents';
    case 'random':
      return 'random';
    case 'album':
      return `album:${m.albumId}`;
    case 'bookmarks':
      return 'bookmarks';
  }
}

function titleForMode(m: Mode): string {
  switch (m.mode) {
    case 'month':
      return formatMonthLabel(m.monthKey);
    case 'day': {
      const d = new Date(2000, m.month - 1, m.day);
      return `On This Day - ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }
    case 'recents':
      return 'Recents';
    case 'random':
      return 'Random';
    case 'album':
      return m.albumTitle || 'Album';
    case 'bookmarks':
      return 'Bookmarks';
  }
}

function parseMode(params: Record<string, string | string[] | undefined>): Mode {
  const mode = String(params.mode ?? 'recents') as Mode['mode'];
  if (mode === 'month') {
    return {
      mode,
      monthKey: String(params.monthKey ?? '') as MonthKey,
      restart: String(params.restart ?? '0') === '1',
    };
  }
  if (mode === 'day') {
    return {
      mode,
      month: Number(params.month ?? 1),
      day: Number(params.day ?? 1),
    };
  }
  if (mode === 'album') {
    const albumActionRaw = String(params.albumAction ?? 'delete');
    return {
      mode,
      albumId: String(params.albumId ?? ''),
      albumTitle: String(params.albumTitle ?? 'Album'),
      albumAction: albumActionRaw === 'remove' ? 'remove' : 'delete',
    };
  }
  if (mode === 'bookmarks') return { mode };
  if (mode === 'random') return { mode };
  return { mode: 'recents' };
}

export default function SessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const parsed = useMemo(() => parseMode(params), [params]);

  const sessionId = useRef(makeId()).current;

  const settings = useAppStore((s) => s.settings);
  const bookmarks = useAppStore((s) => s.bookmarks);
  const addBookmark = useAppStore((s) => s.addBookmark);
  const bumpStats = useAppStore((s) => s.bumpStats);
  const setScopeProgress = useAppStore((s) => s.setScopeProgress);
  const setLastSession = useAppStore((s) => s.setLastSession);
  const markOnThisDayCompleted = useAppStore((s) => s.markOnThisDayCompleted);

  const setSummary = useSessionStore((s) => s.setSummary);

  const scopeKey = useMemo(() => scopeKeyForMode(parsed), [parsed]);
  const title = useMemo(() => titleForMode(parsed), [parsed]);

  const mediaTypes = useMemo(
    () =>
      settings.includeVideos
        ? [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video]
        : [MediaLibrary.MediaType.photo],
    [settings.includeVideos]
  );

  const restart = parsed.mode === 'month' ? parsed.restart : false;
  const albumAction = parsed.mode === 'album' ? parsed.albumAction : 'delete';
  const albumId = parsed.mode === 'album' ? parsed.albumId : undefined;
  const albumTitle = parsed.mode === 'album' ? parsed.albumTitle : undefined;

  const initialProgress = useMemo(() => {
    const p = useAppStore.getState().progressByScope[scopeKey];
    const cursor = parsed.mode === 'month' && restart ? 0 : p?.cursor ?? 0;
    const after = parsed.mode === 'month' && restart ? undefined : p?.after;
    return { cursor, after };
  }, [parsed.mode, restart, scopeKey]);
  const [baseCursor, setBaseCursor] = useState<number>(initialProgress.cursor);
  const [baseAfter, setBaseAfter] = useState<string | undefined>(initialProgress.after);

  const [perm, setPerm] = useState<MediaPermission | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [index, setIndex] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);

  const [kept, setKept] = useState(0);
  const [bookmarkedCount, setBookmarkedCount] = useState(0);
  const [deletedAssets, setDeletedAssets] = useState<MediaLibrary.Asset[]>([]);

  const historyRef = useRef<
    { decision: 'keep' | 'bookmark' | 'delete'; asset: MediaLibrary.Asset; prevAfter?: string }[]
  >([]);
  const afterRef = useRef<string | undefined>(baseAfter);

  const [metadataOpen, setMetadataOpen] = useState(false);
  const [assetInfo, setAssetInfo] = useState<MediaLibrary.AssetInfo | null>(null);
  const [assetInfoLoading, setAssetInfoLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const currentAsset = assets[index];

  const reviewedCount = useMemo(() => {
    // For paged modes, index starts at 0 and baseCursor is previous progress.
    if (parsed.mode === 'month' || parsed.mode === 'recents' || parsed.mode === 'album') return baseCursor + index;
    return index;
  }, [baseCursor, index, parsed.mode]);

  useEffect(() => {
    // Capture progress at session start; do not react to later progress updates.
    setBaseCursor(initialProgress.cursor);
    setBaseAfter(initialProgress.after);
    afterRef.current = initialProgress.after;
    setIndex(parsed.mode === 'day' || parsed.mode === 'bookmarks' ? initialProgress.cursor : 0);
  }, [initialProgress.after, initialProgress.cursor, parsed.mode]);

  useEffect(() => {
    setLastSession({
      mode: parsed.mode as SessionMode,
      title,
      params:
        parsed.mode === 'month'
          ? { monthKey: parsed.monthKey, restart: parsed.restart ? '1' : '0' }
          : parsed.mode === 'day'
            ? { month: String(parsed.month), day: String(parsed.day) }
            : parsed.mode === 'album'
              ? { albumId: parsed.albumId, albumTitle: parsed.albumTitle, albumAction: parsed.albumAction }
              : {},
      updatedAt: Date.now(),
    });
  }, [parsed, setLastSession, title]);

  const refreshPerm = useCallback(async () => {
    setPerm(await getMediaPermission());
  }, []);

  useEffect(() => {
    refreshPerm();
  }, [refreshPerm]);

  const updateProgress = useCallback(
    (nextReviewedCount: number, nextAfter?: string, completed?: boolean) => {
      afterRef.current = nextAfter;
      setScopeProgress(scopeKey, {
        cursor: nextReviewedCount,
        after: nextAfter,
        updatedAt: Date.now(),
        completed,
      });
    },
    [scopeKey, setScopeProgress]
  );

  const fetchPage = useCallback(
    async (after?: string) => {
      if (parsed.mode === 'month') {
        const { start, end } = monthBounds(parsed.monthKey);
        return await MediaLibrary.getAssetsAsync({
          first: PAGE_SIZE,
          after,
          createdAfter: start,
          createdBefore: end,
          sortBy: [['creationTime', false]],
          mediaType: mediaTypes,
        });
      }
      if (parsed.mode === 'album') {
        return await MediaLibrary.getAssetsAsync({
          first: PAGE_SIZE,
          after,
          album: parsed.albumId,
          sortBy: [['creationTime', false]],
          mediaType: mediaTypes,
        });
      }
      // recents
      return await MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        after,
        sortBy: [['creationTime', false]],
        mediaType: mediaTypes,
      });
    },
    [mediaTypes, parsed]
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getMediaPermission();
      setPerm(p);
      if (!p.granted) {
        setAssets([]);
        setTotalCount(0);
        setHasNextPage(false);
        return;
      }

      if (parsed.mode === 'bookmarks') {
        // Build from persisted bookmark list.
        const deck: MediaLibrary.Asset[] = bookmarks.map((b) => ({
          id: b.id,
          uri: b.uri,
          filename: b.filename,
          mediaType: b.mediaType,
          width: b.width,
          height: b.height,
          creationTime: b.creationTime,
          modificationTime: b.modificationTime,
          duration: b.duration,
        }));
        setAssets(deck);
        setTotalCount(deck.length);
        setHasNextPage(false);
        setEndCursor(undefined);
        setIndex(Math.min(baseCursor, Math.max(0, deck.length)));
        return;
      }

      if (parsed.mode === 'random') {
        const page = await MediaLibrary.getAssetsAsync({
          first: 500,
          sortBy: [['creationTime', false]],
          mediaType: mediaTypes,
        });
        const deck = [...page.assets].sort(() => Math.random() - 0.5);
        setAssets(deck);
        setTotalCount(deck.length);
        setHasNextPage(false);
        setEndCursor(undefined);
        setIndex(0);
        return;
      }

      if (parsed.mode === 'day') {
        const oldest = await fetchOldestAsset();
        const startYear = oldest ? new Date(oldest.creationTime).getFullYear() : new Date().getFullYear();
        const endYear = new Date().getFullYear();

        const deck: MediaLibrary.Asset[] = [];
        for (let y = endYear; y >= startYear; y--) {
          const { start, end } = dayBounds(parsed.month, parsed.day, y);
          let after: string | undefined = undefined;
          // Fetch all assets for that day.
          for (;;) {
            const page = await MediaLibrary.getAssetsAsync({
              first: 200,
              after,
              createdAfter: start,
              createdBefore: end,
              sortBy: [['creationTime', false]],
              mediaType: mediaTypes,
            });
            deck.push(...page.assets);
            if (!page.hasNextPage) break;
            after = page.endCursor ?? after;
            if (!after) break;
          }
        }

        deck.sort((a, b) => b.creationTime - a.creationTime);

        setAssets(deck);
        setTotalCount(deck.length);
        setHasNextPage(false);
        setEndCursor(undefined);
        setIndex(Math.min(baseCursor, Math.max(0, deck.length)));
        return;
      }

      // paged modes
      const page = await fetchPage(baseAfter);
      setAssets(page.assets);
      setTotalCount(page.totalCount);
      setHasNextPage(page.hasNextPage);
      setEndCursor(page.endCursor ?? undefined);
      afterRef.current = baseAfter;

      const completed = baseCursor >= page.totalCount && page.totalCount > 0;
      updateProgress(baseCursor, baseAfter, completed);
    } finally {
      setLoading(false);
    }
  }, [baseAfter, baseCursor, bookmarks, fetchPage, mediaTypes, parsed, updateProgress]);

  useEffect(() => {
    loadInitial();
    // Reset decision state when mode changes.
    setKept(0);
    setBookmarkedCount(0);
    setDeletedAssets([]);
    historyRef.current = [];
    setMetadataOpen(false);
    setAssetInfo(null);
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading) return;
    if (!(parsed.mode === 'month' || parsed.mode === 'recents' || parsed.mode === 'album')) return;
    if (!hasNextPage) return;

    setLoadingMore(true);
    try {
      const page = await fetchPage(endCursor);
      setAssets((prev) => [...prev, ...page.assets]);
      setHasNextPage(page.hasNextPage);
      setEndCursor(page.endCursor ?? endCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [endCursor, fetchPage, hasNextPage, loading, loadingMore, parsed.mode]);

  useEffect(() => {
    if (!(parsed.mode === 'month' || parsed.mode === 'recents' || parsed.mode === 'album')) return;
    if (loading || loadingMore) return;
    if (index >= assets.length - 10 && hasNextPage) loadMore();
  }, [assets.length, hasNextPage, index, loadMore, loading, loadingMore, parsed.mode]);

  const finishSession = useCallback(() => {
    const commit =
      parsed.mode === 'album' && albumAction === 'remove' && albumId && albumTitle
        ? { type: 'removeFromAlbum' as const, albumId, albumTitle }
        : { type: 'deleteAssets' as const };

    const summary: SessionSummary = {
      sessionId,
      title,
      scopeKey,
      reviewed: reviewedCount,
      kept,
      bookmarked: bookmarkedCount,
      deleted: deletedAssets.length,
      deletedAssets: deletedAssets.map(assetToSessionAsset),
      commit,
    };
    setSummary(summary);
    updateProgress(
      reviewedCount,
      parsed.mode === 'month' || parsed.mode === 'recents' || parsed.mode === 'album' ? afterRef.current : undefined,
      true
    );
    if (parsed.mode === 'day' && reviewedCount > 0) {
      markOnThisDayCompleted(Date.now());
    }
    router.replace({ pathname: '/summary', params: { sessionId } });
  }, [
    bookmarkedCount,
    deletedAssets,
    kept,
    albumAction,
    albumId,
    albumTitle,
    markOnThisDayCompleted,
    parsed.mode,
    reviewedCount,
    router,
    scopeKey,
    sessionId,
    setSummary,
    title,
    updateProgress,
  ]);

  useEffect(() => {
    if (loading) return;
    if (totalCount === 0) return;
    if (reviewedCount >= totalCount) {
      finishSession();
    }
  }, [finishSession, loading, reviewedCount, totalCount]);

  useEffect(() => {
    if (!assets.length) return;
    const nextUris = assets
      .slice(index, index + 4)
      .map((a) => a.uri)
      .filter((u): u is string => typeof u === 'string' && u.length > 0);
    if (!nextUris.length) return;
    ExpoImage.prefetch(nextUris, 'memory-disk').catch(() => undefined);
  }, [assets, index]);

  const triggerHaptics = useCallback(
    async (kind: 'success' | 'warning') => {
      if (!settings.hapticsEnabled) return;
      try {
        if (kind === 'success') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        else await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        // ignore
      }
    },
    [settings.hapticsEnabled]
  );

  const decide = useCallback(
    async (decision: 'keep' | 'bookmark' | 'delete') => {
      const a = currentAsset;
      if (!a) return;

      historyRef.current.push({ decision, asset: a, prevAfter: afterRef.current });

      if (decision === 'keep') {
        setKept((x) => x + 1);
        bumpStats({ reviewed: 1, kept: 1 });
        await triggerHaptics('success');
      } else if (decision === 'bookmark') {
        if (parsed.mode !== 'bookmarks') addBookmark(assetToBookmarkAsset(a));
        setBookmarkedCount((x) => x + 1);
        bumpStats({ reviewed: 1, bookmarked: 1 });
        await triggerHaptics('success');
      } else {
        setDeletedAssets((prev) => [a, ...prev]);
        bumpStats({ reviewed: 1 });
        await triggerHaptics('warning');
      }

      const nextIndex = index + 1;
      setIndex(nextIndex);

      const nextReviewed = (parsed.mode === 'month' || parsed.mode === 'recents' || parsed.mode === 'album')
        ? baseCursor + nextIndex
        : nextIndex;
      const nextAfter = (parsed.mode === 'month' || parsed.mode === 'recents' || parsed.mode === 'album') ? a.id : undefined;
      updateProgress(nextReviewed, nextAfter, totalCount > 0 && nextReviewed >= totalCount);
    },
    [
      addBookmark,
      baseCursor,
      bumpStats,
      currentAsset,
      index,
      parsed.mode,
      totalCount,
      triggerHaptics,
      updateProgress,
    ]
  );

  const undo = useCallback(() => {
    const last = historyRef.current.pop();
    if (!last) return;

    setIndex((i) => Math.max(0, i - 1));

    if (last.decision === 'keep') {
      setKept((x) => Math.max(0, x - 1));
      bumpStats({ reviewed: -1, kept: -1 });
    } else if (last.decision === 'bookmark') {
      setBookmarkedCount((x) => Math.max(0, x - 1));
      bumpStats({ reviewed: -1, bookmarked: -1 });
    } else {
      setDeletedAssets((prev) => prev.filter((x) => x.id !== last.asset.id));
      bumpStats({ reviewed: -1 });
    }

    const nextIndex = Math.max(0, index - 1);
    const nextReviewed = (parsed.mode === 'month' || parsed.mode === 'recents' || parsed.mode === 'album')
      ? baseCursor + nextIndex
      : nextIndex;
    updateProgress(nextReviewed, last.prevAfter, false);
  }, [baseCursor, bumpStats, index, parsed.mode, updateProgress]);

  const openMetadata = useCallback(async () => {
    const a = currentAsset;
    if (!a) return;
    setMetadataOpen(true);
    setAssetInfo(null);
    setAssetInfoLoading(true);
    try {
      const info = await MediaLibrary.getAssetInfoAsync(a.id, { shouldDownloadFromNetwork: false });
      setAssetInfo(info);
    } catch {
      setAssetInfo(null);
    } finally {
      setAssetInfoLoading(false);
    }
  }, [currentAsset]);

  const onShare = useCallback(async () => {
    if (!currentAsset) return;
    setSharing(true);
    try {
      await shareAssetById(currentAsset.id);
    } catch (e) {
      const message =
        e instanceof ShareError
          ? e.message
          : 'Could not export this item. If it is stored in iCloud, try again on Wi-Fi.';
      Alert.alert('Share failed', message);
    } finally {
      setSharing(false);
    }
  }, [currentAsset]);

  const header = (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.headerPill}>
        <Text style={styles.headerPillText}>Back</Text>
      </Pressable>

      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.headerSub}>
          {totalCount ? `${Math.min(reviewedCount + 1, totalCount)} / ${totalCount}` : '...'}
        </Text>
      </View>

      <View style={styles.headerRight}>
        <Pressable onPress={openMetadata} style={styles.headerPill} disabled={!currentAsset}>
          <Text style={styles.headerPillText}>Info</Text>
        </Pressable>
        <Pressable onPress={undo} style={styles.headerPill} disabled={historyRef.current.length === 0}>
          <Text style={styles.headerPillText}>Undo</Text>
        </Pressable>
      </View>
    </View>
  );

  if (!perm) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={theme.colors.textDim} />
          <Text style={styles.loadingText}>Checking Photos access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!perm.granted) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.blocked}>
          <Text style={styles.blockedTitle}>Photos access required</Text>
          <Text style={styles.blockedText}>
            Enable Photos access to start swiping. You can grant access from system Settings.
          </Text>
          <Pressable onPress={() => Linking.openSettings()} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Open Settings</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      {header}

      <View style={styles.deck}>
        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator color={theme.colors.text} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : totalCount === 0 ? (
          <View style={styles.loadingCenter}>
            <Text style={styles.blockedTitle}>Nothing here</Text>
            <Text style={styles.blockedText}>No photos found for this mode.</Text>
            <Pressable onPress={() => router.back()} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Go back</Text>
            </Pressable>
          </View>
        ) : currentAsset ? (
          <SwipeCard
            uri={currentAsset.uri}
            onSwipeLeft={() => decide('delete')}
            onSwipeRight={() => decide('keep')}
            onLongPress={openMetadata}
            leftLabel={parsed.mode === 'album' && albumAction === 'remove' ? 'REMOVE' : 'DELETE'}
            leftColor={parsed.mode === 'album' && albumAction === 'remove' ? theme.colors.yellow : theme.colors.red}
            rightLabel="KEEP"
            rightColor={theme.colors.green}
          />
        ) : (
          <View style={styles.loadingCenter}>
            <ActivityIndicator color={theme.colors.textDim} />
            <Text style={styles.loadingText}>Wrapping up...</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[
            styles.actionBtn,
            parsed.mode === 'album' && albumAction === 'remove' ? styles.actionRemove : styles.actionDelete,
          ]}
          onPress={() => decide('delete')}
          disabled={!currentAsset}>
          <Text style={styles.actionText}>
            {parsed.mode === 'album' && albumAction === 'remove' ? 'Remove' : 'Delete'}
          </Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.actionBookmark]} onPress={() => decide('bookmark')} disabled={!currentAsset}>
          <Text style={styles.actionText}>Bookmark</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.actionKeep]} onPress={() => decide('keep')} disabled={!currentAsset}>
          <Text style={styles.actionText}>Keep</Text>
        </Pressable>
      </View>

      {metadataOpen ? (
        <View style={styles.metaOverlay}>
          <Pressable style={styles.metaBackdrop} onPress={() => setMetadataOpen(false)} />
          <View style={styles.metaSheet}>
            <View style={styles.metaHeader}>
              <Text style={styles.metaTitle}>Photo details</Text>
              <Pressable onPress={() => setMetadataOpen(false)} style={styles.headerPill}>
                <Text style={styles.headerPillText}>Close</Text>
              </Pressable>
            </View>

            {assetInfoLoading ? (
              <View style={styles.metaLoading}>
                <ActivityIndicator color={theme.colors.textDim} />
                <Text style={styles.metaText}>Loading metadata...</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.metaContent}>
                {currentAsset ? (
                  <>
                    <Text style={styles.metaLabel}>Date</Text>
                    <Text style={styles.metaValue}>{formatShortDate(currentAsset.creationTime)}</Text>

                    <Text style={styles.metaLabel}>Time</Text>
                    <Text style={styles.metaValue}>{formatTime(currentAsset.creationTime)}</Text>

                    <Text style={styles.metaLabel}>Type</Text>
                    <Text style={styles.metaValue}>{currentAsset.mediaType}</Text>

                    <Text style={styles.metaLabel}>Filename</Text>
                    <Text style={styles.metaValue}>{currentAsset.filename}</Text>

                    <Text style={styles.metaLabel}>Dimensions</Text>
                    <Text style={styles.metaValue}>
                      {currentAsset.width} x {currentAsset.height}
                    </Text>

                    {currentAsset.mediaType === 'video' ? (
                      <>
                        <Text style={styles.metaLabel}>Duration</Text>
                        <Text style={styles.metaValue}>{Math.round(currentAsset.duration)}s</Text>
                      </>
                    ) : null}

                    {assetInfo?.location ? (
                      <>
                        <Text style={styles.metaLabel}>Location</Text>
                        <Text style={styles.metaValue}>
                          {assetInfo.location.latitude.toFixed(5)}, {assetInfo.location.longitude.toFixed(5)}
                        </Text>
                      </>
                    ) : null}

                    {assetInfo?.isNetworkAsset ? (
                      <>
                        <Text style={styles.metaLabel}>iCloud</Text>
                        <Text style={styles.metaValue}>Stored in iCloud (not downloaded)</Text>
                      </>
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.metaText}>No active photo.</Text>
                )}
              </ScrollView>
            )}

            <View style={styles.metaActions}>
              <Pressable style={styles.primaryButton} onPress={onShare} disabled={!currentAsset || sharing}>
                <Text style={styles.primaryButtonText}>{sharing ? 'Sharing...' : 'Share'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  headerPill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerPillText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  headerSub: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontWeight: '700',
  },
  deck: {
    flex: 1,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 6,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  actionDelete: {
    backgroundColor: 'rgba(255,77,77,0.14)',
    borderColor: 'rgba(255,77,77,0.45)',
  },
  actionBookmark: {
    backgroundColor: 'rgba(178,141,255,0.14)',
    borderColor: 'rgba(178,141,255,0.45)',
  },
  actionKeep: {
    backgroundColor: 'rgba(55,214,122,0.14)',
    borderColor: 'rgba(55,214,122,0.45)',
  },
  actionRemove: {
    backgroundColor: 'rgba(255,209,102,0.14)',
    borderColor: 'rgba(255,209,102,0.45)',
  },
  blocked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: theme.spacing.xl,
  },
  blockedTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  blockedText: {
    color: theme.colors.textDim,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 320,
  },
  primaryButton: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: theme.colors.text,
  },
  primaryButtonText: {
    color: theme.colors.bg,
    fontSize: 12,
    fontWeight: '900',
  },
  secondaryButton: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  metaOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  metaBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  metaSheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    padding: theme.spacing.lg,
    gap: 12,
    maxHeight: '70%',
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  metaLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  metaContent: {
    gap: 8,
    paddingBottom: 24,
  },
  metaLabel: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 6,
  },
  metaValue: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  metaText: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontWeight: '700',
  },
  metaActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 6,
  },
});
