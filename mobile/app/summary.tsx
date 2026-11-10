import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';

import { theme } from '@/src/theme';
import { useSessionStore } from '@/src/store/sessionStore';
import { useAppStore } from '@/src/store/appStore';
import { formatBytes, sumKnownSizes, type SizeTotal } from '@/src/lib/bytes';
import { assetExists, getAssetFileSize } from '@/src/lib/media';
import { confirmAndCommit } from '@/src/lib/deleteFlow';
import { progressAfterRemoval } from '@/src/lib/progress';

/** Resolves true only when the destructive button is pressed; Cancel or dismissing resolves false. */
function confirmAsync(title: string, message: string, confirmLabel: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

export default function SummaryScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const summary = useSessionStore((s) => (sessionId ? s.summaries[sessionId] : undefined));
  const clearSummary = useSessionStore((s) => s.clearSummary);
  const setSummary = useSessionStore((s) => s.setSummary);

  const bumpStats = useAppStore((s) => s.bumpStats);
  const removeBookmark = useAppStore((s) => s.removeBookmark);

  const [deleting, setDeleting] = useState(false);
  const commitInFlight = useRef(false);

  const stagedIds = useMemo(() => summary?.deletedAssets.map((a) => a.id) ?? [], [summary?.deletedAssets]);
  const isRemoveFromAlbum = summary?.commit.type === 'removeFromAlbum';

  // Measure staged deletes up front: sizes can't be read once the assets are gone.
  // Album removals free no space, so they are never measured.
  const [sizeTotal, setSizeTotal] = useState<SizeTotal | null>(null);
  const sizePromise = useRef<Promise<SizeTotal> | null>(null);
  const sizeById = useRef(new Map<string, number>());
  useEffect(() => {
    if (isRemoveFromAlbum || stagedIds.length === 0) {
      sizePromise.current = null;
      setSizeTotal(null);
      return;
    }
    let cancelled = false;
    const pending = sumKnownSizes(stagedIds, async (id) => {
      // Sizes survive a partial delete: what's already gone can't be measured again.
      const known = sizeById.current.get(id);
      if (known != null) return known;
      const size = await getAssetFileSize(id);
      if (size != null) sizeById.current.set(id, size);
      return size;
    });
    sizePromise.current = pending;
    pending.then((total) => {
      if (!cancelled) setSizeTotal(total);
    });
    return () => {
      cancelled = true;
    };
  }, [isRemoveFromAlbum, stagedIds]);

  const onDone = useCallback(() => {
    if (sessionId) clearSummary(sessionId);
    router.replace('/');
  }, [clearSummary, router, sessionId]);

  // The reviewed count and paging cursor were saved while the removed items
  // were still in the scope; bring them back in line so nothing is skipped.
  const syncProgress = useCallback(
    (removedIds: string[]) => {
      if (!summary) return;
      const { progressByScope, setScopeProgress } = useAppStore.getState();
      const stored = progressByScope[summary.scopeKey];
      if (!stored) return;
      setScopeProgress(
        summary.scopeKey,
        progressAfterRemoval(stored, removedIds, summary.resumeAfter, Platform.OS, Date.now())
      );
    },
    [summary]
  );

  const doRemoveFromAlbum = useCallback(async () => {
    if (!summary || summary.commit.type !== 'removeFromAlbum') return;
    setDeleting(true);
    try {
      const ok = await MediaLibrary.removeAssetsFromAlbumAsync(stagedIds, summary.commit.albumId);
      if (ok) {
        bumpStats({ removedFromAlbums: summary.deletedAssets.length });
        syncProgress(stagedIds);
        Alert.alert(
          'Removed',
          `Removed ${summary.deletedAssets.length} item(s) from "${summary.commit.albumTitle}".`
        );
        onDone();
        return;
      }
      Alert.alert('Remove failed', 'Unable to remove those items from the album. Please try again.');
    } catch {
      Alert.alert('Remove failed', 'Unable to remove those items from the album. Please try again.');
    } finally {
      setDeleting(false);
    }
  }, [bumpStats, onDone, stagedIds, summary, syncProgress]);

  const onPressDelete = useCallback(async () => {
    if (!summary || commitInFlight.current) return;
    commitInFlight.current = true;
    const total = stagedIds.length;
    try {
      const result = await confirmAndCommit(
        stagedIds,
        async () => {
          const yes = await confirmAsync(
            'Confirm deletion',
            `Delete ${total} item(s) from your photo library? This can't be undone here.`,
            'Delete'
          );
          if (yes) setDeleting(true);
          return yes;
        },
        {
          deleteAssets: async (ids) => {
            // Sizes can't be read once the assets are gone, so finish measuring first.
            if (sizePromise.current) await sizePromise.current;
            return MediaLibrary.deleteAssetsAsync(ids);
          },
          assetExists,
        }
      );
      if (result.status === 'cancelled') return;

      if (result.deletedIds.length > 0) {
        const bytes = result.deletedIds.reduce((sum, id) => sum + (sizeById.current.get(id) ?? 0), 0);
        bumpStats({ deleted: result.deletedIds.length, bytesReclaimed: bytes });
        result.deletedIds.forEach((id) => removeBookmark(id));
        syncProgress(result.deletedIds);
      }

      if (result.status === 'deleted') {
        Alert.alert('Deleted', `Deleted ${result.deletedIds.length} item(s).`);
        onDone();
        return;
      }

      if (result.status === 'partial') {
        // Keep only what is still in the library staged, so a retry (or leaving)
        // reflects reality instead of the original list.
        const remaining = new Set(result.remainingIds);
        const deletedAssets = summary.deletedAssets.filter((a) => remaining.has(a.id));
        setSummary({ ...summary, deletedAssets, deleted: deletedAssets.length });
        Alert.alert(
          'Some items were not deleted',
          `Deleted ${result.deletedIds.length} of ${total} item(s). ${result.remainingIds.length} could not be deleted and are still in your library. They remain staged so you can try again.`
        );
        return;
      }

      Alert.alert('Delete failed', 'Nothing was deleted. Your photos are still in your library. Please try again.');
    } finally {
      commitInFlight.current = false;
      setDeleting(false);
    }
  }, [bumpStats, onDone, removeBookmark, setSummary, stagedIds, summary, syncProgress]);

  const onPressCommit = useCallback(() => {
    if (!summary) return;
    if (summary.deletedAssets.length === 0) return;

    if (summary.commit.type === 'removeFromAlbum') {
      Alert.alert(
        'Confirm removal',
        `Remove ${summary.deletedAssets.length} item(s) from "${summary.commit.albumTitle}"? They will stay in your photo library.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', onPress: doRemoveFromAlbum },
        ]
      );
      return;
    }

    onPressDelete();
  }, [doRemoveFromAlbum, onPressDelete, summary]);

  if (!summary) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.card}>
          <Text style={styles.title}>Session summary</Text>
          <Text style={styles.textDim}>Nothing to show.</Text>
          <Pressable onPress={onDone} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Session complete</Text>
          <Text style={styles.textDim}>{summary.title}</Text>
        </View>
        <Pressable onPress={onDone} style={styles.closePill}>
          <Text style={styles.closePillText}>Done</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Reviewed</Text>
          <Text style={styles.statValue}>{summary.reviewed}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Kept</Text>
          <Text style={styles.statValue}>{summary.kept}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Bookmarked</Text>
          <Text style={styles.statValue}>{summary.bookmarked}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{isRemoveFromAlbum ? 'To remove' : 'To delete'}</Text>
          <Text style={styles.statValue}>{summary.deleted}</Text>
        </View>
        {!isRemoveFromAlbum && summary.deletedAssets.length ? (
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Space to free</Text>
            <Text style={styles.statValue}>{sizeTotal ? formatBytes(sizeTotal.bytes) : 'Measuring...'}</Text>
          </View>
        ) : null}
        {sizeTotal && sizeTotal.unknown > 0 ? (
          <Text style={styles.textDim}>
            {sizeTotal.unknown} item(s) couldn&apos;t be measured (e.g. stored only in iCloud) and aren&apos;t counted.
          </Text>
        ) : null}
      </View>

      {summary.deletedAssets.length ? (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{isRemoveFromAlbum ? 'Staged for removal' : 'Staged for deletion'}</Text>
            {deleting ? (
              <View style={styles.loadingInline}>
                <ActivityIndicator color={theme.colors.textDim} />
                <Text style={styles.textDim}>{isRemoveFromAlbum ? 'Removing...' : 'Deleting...'}</Text>
              </View>
            ) : null}
          </View>

          <FlatList
            data={summary.deletedAssets.slice(0, 24)}
            keyExtractor={(i) => i.id}
            numColumns={4}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => (
              <View style={styles.thumbWrap}>
                <Image source={{ uri: item.uri }} style={styles.thumb} contentFit="cover" transition={120} />
              </View>
            )}
          />

          <Pressable
            style={[styles.commitButton, isRemoveFromAlbum ? styles.commitButtonRemove : styles.commitButtonDelete]}
            onPress={onPressCommit}
            disabled={deleting}>
            <Text style={styles.commitButtonText}>
              {isRemoveFromAlbum ? 'Remove' : 'Delete'} {summary.deletedAssets.length}
            </Text>
          </Pressable>

          {isRemoveFromAlbum ? (
            <Text style={styles.textDim}>Items stay in your photo library.</Text>
          ) : (
            <Text style={styles.textDim}>
              iOS may ask for an additional confirmation before deleting from Photos.
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isRemoveFromAlbum ? 'No removals staged' : 'No deletes staged'}</Text>
          <Text style={styles.textDim}>
            {isRemoveFromAlbum ? 'Nice. Nothing to remove this session.' : 'Nice. Nothing to delete this session.'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  textDim: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  closePill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  closePillText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  card: {
    backgroundColor: theme.colors.card2,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    padding: theme.spacing.lg,
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontWeight: '700',
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  grid: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  gridRow: {
    gap: 8,
    marginBottom: 8,
  },
  thumbWrap: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    backgroundColor: theme.colors.card,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  commitButton: {
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commitButtonDelete: {
    backgroundColor: 'rgba(255,77,77,0.16)',
    borderColor: 'rgba(255,77,77,0.45)',
  },
  commitButtonRemove: {
    backgroundColor: 'rgba(255,209,102,0.14)',
    borderColor: 'rgba(255,209,102,0.42)',
  },
  commitButtonText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  loadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.text,
  },
  primaryButtonText: {
    color: theme.colors.bg,
    fontSize: 12,
    fontWeight: '900',
  },
});
