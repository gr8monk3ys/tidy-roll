import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';

import { theme } from '@/src/theme';
import { getMediaPermission, requestMediaPermission, type MediaPermission } from '@/src/lib/media';

export default function AlbumsScreen() {
  const router = useRouter();

  const [perm, setPerm] = useState<MediaPermission | null>(null);
  const [albums, setAlbums] = useState<MediaLibrary.Album[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getMediaPermission();
      setPerm(p);
      if (!p.granted) {
        setAlbums(null);
        return;
      }
      const list = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
      list.sort((a, b) => (b.assetCount ?? 0) - (a.assetCount ?? 0));
      setAlbums(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const header = (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>Albums</Text>
        <Text style={styles.subtitle}>Pick an album to clean</Text>
      </View>
      <Pressable onPress={() => router.back()} style={styles.closePill}>
        <Text style={styles.closePillText}>Close</Text>
      </Pressable>
    </View>
  );

  const permissionCard = useMemo(() => {
    if (!perm) return null;
    if (perm.granted) return null;
    return (
      <View style={styles.permissionCard}>
        <Text style={styles.permissionTitle}>Photos access needed</Text>
        <Text style={styles.permissionText}>Allow Photos access to browse albums.</Text>
        <Pressable
          style={styles.primaryButton}
          onPress={async () => {
            const next = await requestMediaPermission();
            setPerm(next);
            if (next.granted) load();
          }}>
          <Text style={styles.primaryButtonText}>Allow Photos Access</Text>
        </Pressable>
      </View>
    );
  }, [load, perm]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {header}

        {permissionCard}

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={theme.colors.textDim} />
            <Text style={styles.loadingText}>Loading albums...</Text>
          </View>
        ) : null}

        {albums ? (
          <View style={styles.list}>
            {albums.map((a) => (
              <Pressable
                key={a.id}
                style={styles.row}
                onPress={() => {
                  Alert.alert(
                    a.title || 'Album',
                    'Choose what a left swipe means in this album.',
                    [
                      {
                        text: 'Remove from album',
                        onPress: () => {
                          router.back();
                          router.push({
                            pathname: '/session',
                            params: {
                              mode: 'album',
                              albumId: a.id,
                              albumTitle: a.title || 'Album',
                              albumAction: 'remove',
                            },
                          });
                        },
                      },
                      {
                        text: 'Delete from library',
                        style: 'destructive',
                        onPress: () => {
                          router.back();
                          router.push({
                            pathname: '/session',
                            params: {
                              mode: 'album',
                              albumId: a.id,
                              albumTitle: a.title || 'Album',
                              albumAction: 'delete',
                            },
                          });
                        },
                      },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {a.title || 'Untitled'}
                  </Text>
                  <Text style={styles.rowMeta}>{a.assetCount ?? 0} items</Text>
                </View>
                <Text style={styles.rowCta}>Start</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scroll: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerLeft: {
    gap: 6,
    flex: 1,
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
  permissionCard: {
    backgroundColor: theme.colors.card2,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    padding: theme.spacing.lg,
    gap: 10,
  },
  permissionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  permissionText: {
    color: theme.colors.textDim,
    fontSize: 13,
    lineHeight: 18,
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  row: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    backgroundColor: theme.colors.card2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  rowLeft: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  rowMeta: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontWeight: '700',
  },
  rowCta: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
