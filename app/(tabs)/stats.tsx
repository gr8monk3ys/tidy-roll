import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/src/theme';
import { useAppStore } from '@/src/store/appStore';
import { getMediaPermission, presentLimitedLibraryPickerIfAvailable, type MediaPermission } from '@/src/lib/media';

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const stats = useAppStore((s) => s.stats);
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const clearBookmarks = useAppStore((s) => s.clearBookmarks);
  const resetStats = useAppStore((s) => s.resetStats);

  const onPressResetStats = useCallback(() => {
    Alert.alert('Reset stats?', 'This will clear your all-time stats on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetStats },
    ]);
  }, [resetStats]);

  const onPressClearBookmarks = useCallback(() => {
    Alert.alert('Clear bookmarks?', 'This will remove all saved bookmarks on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearBookmarks },
    ]);
  }, [clearBookmarks]);

  const [perm, setPerm] = useState<MediaPermission | null>(null);

  const refreshPerm = useCallback(async () => {
    setPerm(await getMediaPermission());
  }, []);

  useEffect(() => {
    refreshPerm();
  }, [refreshPerm]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Stats & Settings</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>All-time</Text>
        <StatRow label="Reviewed" value={stats.reviewed} />
        <StatRow label="Kept" value={stats.kept} />
        <StatRow label="Bookmarked" value={stats.bookmarked} />
        <StatRow label="Deleted" value={stats.deleted} />
        <StatRow label="Removed from albums" value={stats.removedFromAlbums ?? 0} />

        <View style={styles.divider} />

        <Pressable style={styles.dangerButton} onPress={onPressResetStats}>
          <Text style={styles.dangerButtonText}>Reset stats</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Preferences</Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Text style={styles.toggleLabel}>Include videos</Text>
            <Text style={styles.toggleHint}>Shows videos in sessions (can slow down swiping).</Text>
          </View>
          <Switch
            value={settings.includeVideos}
            onValueChange={(v) => setSettings({ includeVideos: v })}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(55,214,122,0.6)' }}
            thumbColor={theme.colors.text}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Text style={styles.toggleLabel}>Haptics</Text>
            <Text style={styles.toggleHint}>Vibration feedback when you swipe.</Text>
          </View>
          <Switch
            value={settings.hapticsEnabled}
            onValueChange={(v) => setSettings({ hapticsEnabled: v })}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(0,209,255,0.55)' }}
            thumbColor={theme.colors.text}
          />
        </View>

        <View style={styles.divider} />

        <Pressable style={styles.dangerButton} onPress={onPressClearBookmarks}>
          <Text style={styles.dangerButtonText}>Clear bookmarks</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Photos Permission</Text>
        <Text style={styles.permissionText}>
          {perm
            ? perm.granted
              ? perm.accessPrivileges === 'limited'
                ? 'Access: limited'
                : 'Access: granted'
              : 'Access: not granted'
            : 'Checking...'}
        </Text>

        {perm?.granted && perm.accessPrivileges === 'limited' ? (
          <Pressable style={styles.primaryButton} onPress={presentLimitedLibraryPickerIfAvailable}>
            <Text style={styles.primaryButtonText}>Select more photos</Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.secondaryButton} onPress={() => Linking.openSettings()}>
          <Text style={styles.secondaryButtonText}>Open Settings</Text>
        </Pressable>
      </View>
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
  title: {
    color: theme.colors.text,
    fontSize: 22,
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
  cardTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
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
  divider: {
    height: 1,
    backgroundColor: theme.colors.stroke,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  toggleLeft: {
    flex: 1,
    gap: 4,
  },
  toggleLabel: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  toggleHint: {
    color: theme.colors.textDim,
    fontSize: 12,
    lineHeight: 16,
  },
  dangerButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.35)',
    backgroundColor: 'rgba(255,77,77,0.10)',
  },
  dangerButtonText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  permissionText: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontWeight: '700',
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
  secondaryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
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
});
