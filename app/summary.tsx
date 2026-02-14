import { useCallback, useMemo, useState } from 'react';
import { Alert, ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';

import { theme } from '@/src/theme';
import { useSessionStore } from '@/src/store/sessionStore';
import { useAppStore } from '@/src/store/appStore';

export default function SummaryScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const summary = useSessionStore((s) => (sessionId ? s.summaries[sessionId] : undefined));
  const clearSummary = useSessionStore((s) => s.clearSummary);

  const bumpStats = useAppStore((s) => s.bumpStats);
  const removeBookmark = useAppStore((s) => s.removeBookmark);

  const [deleting, setDeleting] = useState(false);

  const stagedIds = useMemo(() => summary?.deletedAssets.map((a) => a.id) ?? [], [summary?.deletedAssets]);
  const isRemoveFromAlbum = summary?.commit.type === 'removeFromAlbum';

  const onDone = useCallback(() => {
    if (sessionId) clearSummary(sessionId);
    router.replace('/');
  }, [clearSummary, router, sessionId]);

  const doCommit = useCallback(async () => {
    if (!summary) return;
    if (summary.deletedAssets.length === 0) return;
    setDeleting(true);
    try {
      if (summary.commit.type === 'removeFromAlbum') {
        const ok = await MediaLibrary.removeAssetsFromAlbumAsync(stagedIds, summary.commit.albumId);
        if (ok) {
          bumpStats({ removedFromAlbums: summary.deletedAssets.length });
          Alert.alert(
            'Removed',
            `Removed ${summary.deletedAssets.length} item(s) from "${summary.commit.albumTitle}".`
          );
          onDone();
          return;
        }
        Alert.alert('Remove failed', 'Unable to remove those items from the album. Please try again.');
        return;
      }

      const ok = await MediaLibrary.deleteAssetsAsync(stagedIds);
      if (ok) {
        bumpStats({ deleted: summary.deletedAssets.length });
        summary.deletedAssets.forEach((a) => removeBookmark(a.id));
        Alert.alert('Deleted', `Deleted ${summary.deletedAssets.length} item(s).`);
        onDone();
        return;
      }
      Alert.alert('Delete failed', 'Unable to delete those items. Please try again.');
    } catch {
      Alert.alert(
        summary.commit.type === 'removeFromAlbum' ? 'Remove failed' : 'Delete failed',
        summary.commit.type === 'removeFromAlbum'
          ? 'Unable to remove those items from the album. Please try again.'
          : 'Unable to delete those items. Please try again.'
      );
    } finally {
      setDeleting(false);
    }
  }, [bumpStats, onDone, removeBookmark, stagedIds, summary]);

  const onPressCommit = useCallback(() => {
    if (!summary) return;
    if (summary.deletedAssets.length === 0) return;

    if (summary.commit.type === 'removeFromAlbum') {
      Alert.alert(
        'Confirm removal',
        `Remove ${summary.deletedAssets.length} item(s) from "${summary.commit.albumTitle}"? They will stay in your photo library.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', onPress: doCommit },
        ]
      );
      return;
    }

    Alert.alert(
      'Confirm deletion',
      `Delete ${summary.deletedAssets.length} item(s) from your photo library? This can't be undone here.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doCommit },
      ]
    );
  }, [doCommit, summary]);

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
