import { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { theme } from '@/src/theme';
import { useAppStore } from '@/src/store/appStore';

export default function BookmarksScreen() {
  const router = useRouter();
  const bookmarks = useAppStore((s) => s.bookmarks);
  const removeBookmark = useAppStore((s) => s.removeBookmark);

  const onPressReview = useCallback(() => {
    router.push({ pathname: '/session', params: { mode: 'bookmarks' } });
  }, [router]);

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Bookmarks</Text>
          <Text style={styles.subtitle}>{bookmarks.length} saved</Text>
        </View>

        <Pressable style={styles.reviewButton} onPress={onPressReview} disabled={bookmarks.length === 0}>
          <Text style={styles.reviewButtonText}>{bookmarks.length === 0 ? 'Empty' : 'Review'}</Text>
        </Pressable>
      </View>
    ),
    [bookmarks.length, onPressReview]
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {header}

      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => removeBookmark(item.id)}
            style={styles.cell}
            accessibilityLabel="Bookmarked photo. Long press to remove.">
            <Image source={{ uri: item.uri }} style={styles.thumb} contentFit="cover" transition={120} />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No bookmarks yet</Text>
            <Text style={styles.emptyText}>Swipe up some memories and tap Bookmark to save them for later.</Text>
          </View>
        }
      />
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
  },
  headerLeft: {
    gap: 6,
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  reviewButtonText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  list: {
    paddingBottom: 120,
  },
  row: {
    gap: 10,
    marginBottom: 10,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    backgroundColor: theme.colors.card2,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  empty: {
    paddingTop: 24,
    gap: 10,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    color: theme.colors.textDim,
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 320,
  },
});
