import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { theme } from '@/src/theme';
import { formatMonthLabel, monthBounds, monthKeyFromDate, type MonthKey } from '@/src/lib/dates';
import {
  fetchOldestAsset,
  getMediaPermission,
  presentLimitedLibraryPickerIfAvailable,
  requestMediaPermission,
  type MediaPermission,
} from '@/src/lib/media';
import { useAppStore } from '@/src/store/appStore';

function scopeKeyForMonth(monthKey: MonthKey) {
  return `month:${monthKey}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { settings, progressByScope, lastSession, onThisDay } = useAppStore();

  const [perm, setPerm] = useState<MediaPermission | null>(null);
  const [oldestAssetDate, setOldestAssetDate] = useState<Date | null>(null);
  const [allMonths, setAllMonths] = useState<MonthKey[]>([]);
  const [visibleMonths, setVisibleMonths] = useState<MonthKey[]>([]);
  const [monthTotals, setMonthTotals] = useState<Record<string, number>>({});
  const [loadingTotals, setLoadingTotals] = useState<Record<string, boolean>>({});

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [onThisDayDate, setOnThisDayDate] = useState(() => new Date());

  const refreshPerm = useCallback(async () => {
    setPerm(await getMediaPermission());
  }, []);

  useEffect(() => {
    refreshPerm();
  }, [refreshPerm]);

  useFocusEffect(
    useCallback(() => {
      refreshPerm();
    }, [refreshPerm])
  );

  useEffect(() => {
    if (!perm?.granted) return;
    let cancelled = false;
    (async () => {
      const oldest = await fetchOldestAsset();
      if (cancelled) return;
      setOldestAssetDate(oldest ? new Date(oldest.creationTime) : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [perm?.granted]);

  useEffect(() => {
    if (!oldestAssetDate) return;

    const startMonth = new Date(oldestAssetDate.getFullYear(), oldestAssetDate.getMonth(), 1);
    const now = new Date();
    const endMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const months: MonthKey[] = [];
    for (
      let cursor = new Date(endMonth);
      cursor >= startMonth;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)
    ) {
      months.push(monthKeyFromDate(cursor));
    }

    setAllMonths(months);
    setVisibleMonths(months.slice(0, 18));
  }, [oldestAssetDate]);

  const mediaTypes = useMemo(
    () => (settings.includeVideos ? [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video] : [MediaLibrary.MediaType.photo]),
    [settings.includeVideos]
  );

  const ensureMonthTotal = useCallback(
    async (monthKey: MonthKey) => {
      if (monthTotals[monthKey] != null || loadingTotals[monthKey]) return;
      setLoadingTotals((prev) => ({ ...prev, [monthKey]: true }));
      try {
        const { start, end } = monthBounds(monthKey);
        const page = await MediaLibrary.getAssetsAsync({
          first: 1,
          createdAfter: start,
          createdBefore: end,
          sortBy: [['creationTime', false]],
          mediaType: mediaTypes,
        });
        setMonthTotals((prev) => ({ ...prev, [monthKey]: page.totalCount }));
      } catch {
        // ignore
      } finally {
        setLoadingTotals((prev) => ({ ...prev, [monthKey]: false }));
      }
    },
    [loadingTotals, mediaTypes, monthTotals]
  );

  useEffect(() => {
    if (!visibleMonths.length) return;
    visibleMonths.slice(0, 10).forEach((m) => {
      ensureMonthTotal(m);
    });
  }, [ensureMonthTotal, visibleMonths]);

  const onPressStartMonth = useCallback(
    (monthKey: MonthKey, restart: boolean) => {
      router.push({
        pathname: '/session',
        params: { mode: 'month', monthKey, restart: restart ? '1' : '0' },
      });
    },
    [router]
  );

  const onPressResumeLast = useCallback(() => {
    if (!lastSession) return;
    router.push({ pathname: '/session', params: { mode: lastSession.mode, ...lastSession.params } });
  }, [lastSession, router]);

  const onPressOnThisDay = useCallback(
    (d: Date) => {
      const month = String(d.getMonth() + 1);
      const day = String(d.getDate());
      router.push({ pathname: '/session', params: { mode: 'day', month, day } });
    },
    [router]
  );

  const onPressRecents = useCallback(() => {
    router.push({ pathname: '/session', params: { mode: 'recents' } });
  }, [router]);

  const onPressRandom = useCallback(() => {
    router.push({ pathname: '/session', params: { mode: 'random' } });
  }, [router]);

  const onPressAlbums = useCallback(() => {
    router.push({ pathname: '/albums' });
  }, [router]);

  const permissionCard = useMemo(() => {
    if (!perm) {
      return (
        <View style={styles.permissionCard}>
          <ActivityIndicator color={theme.colors.text} />
          <Text style={styles.permissionText}>Checking Photos access...</Text>
        </View>
      );
    }

    if (perm.granted) {
      if (perm.accessPrivileges === 'limited') {
        return (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>Limited access</Text>
            <Text style={styles.permissionText}>
              TidyRoll can only see selected photos. You can expand access anytime.
            </Text>
            <Pressable style={styles.permissionButton} onPress={presentLimitedLibraryPickerIfAvailable}>
              <Text style={styles.permissionButtonText}>Select more photos</Text>
            </Pressable>
          </View>
        );
      }
      return null;
    }

    return (
      <View style={styles.permissionCard}>
        <Text style={styles.permissionTitle}>Photos access needed</Text>
        <Text style={styles.permissionText}>
          We show your photos so you can swipe to keep, delete, or bookmark them. Everything stays on-device.
        </Text>
        <Pressable
          style={styles.permissionButton}
          onPress={async () => {
            if (!perm.canAskAgain) {
              Linking.openSettings();
              return;
            }
            const next = await requestMediaPermission();
            setPerm(next);
          }}>
          <Text style={styles.permissionButtonText}>
            {perm.canAskAgain ? 'Allow Photos Access' : Platform.OS === 'ios' ? 'Enable in Settings' : 'Allow'}
          </Text>
        </Pressable>
      </View>
    );
  }, [perm]);

  const header = (
    <View style={styles.header}>
      <Text style={styles.brand}>tidyroll</Text>
      <Text style={styles.tagline}>Swipe your camera roll clean.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {header}
        {permissionCard}

        {lastSession ? (
          <Pressable onPress={onPressResumeLast} style={styles.resumeCard}>
            <Text style={styles.resumeTitle}>Resume</Text>
            <Text style={styles.resumeText}>{lastSession.title}</Text>
          </Pressable>
        ) : null}

        <View style={styles.modeRow}>
          <Pressable style={styles.modePress} onPress={() => onPressOnThisDay(onThisDayDate)}>
            <LinearGradient
              colors={theme.gradients.onThisDay}
              start={{ x: 0.1, y: 0.1 }}
              end={{ x: 0.9, y: 0.9 }}
              style={styles.modeCard}>
              <Text style={styles.modeTitle}>On This Day</Text>
              <Text style={styles.modeSubtitle}>
                {onThisDayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </Text>
              {onThisDay.streakCount > 0 ? (
                <View style={styles.streakPill}>
                  <Text style={styles.streakText}>{onThisDay.streakCount} day streak</Text>
                </View>
              ) : null}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setShowDatePicker(true);
                }}
                style={styles.modePill}>
                <Text style={styles.modePillText}>Pick date</Text>
              </Pressable>
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.modePress} onPress={onPressRecents}>
            <LinearGradient
              colors={theme.gradients.recents}
              start={{ x: 0.05, y: 0.1 }}
              end={{ x: 0.95, y: 0.95 }}
              style={styles.modeCard}>
              <Text style={styles.modeTitle}>Recents</Text>
              <Text style={styles.modeSubtitle}>Newest first</Text>
              <View style={styles.modePillGhost}>
                <Text style={styles.modePillText}>Start</Text>
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.modeRow}>
          <Pressable style={styles.modePress} onPress={onPressRandom}>
            <LinearGradient
              colors={theme.gradients.random}
              start={{ x: 0.05, y: 0.1 }}
              end={{ x: 0.95, y: 0.95 }}
              style={styles.modeCardSmall}>
              <Text style={styles.modeTitle}>Random</Text>
              <Text style={styles.modeSubtitle}>Shuffle recents</Text>
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.modePress} onPress={onPressAlbums}>
            <LinearGradient
              colors={theme.gradients.albums}
              start={{ x: 0.05, y: 0.1 }}
              end={{ x: 0.95, y: 0.95 }}
              style={styles.modeCardSmall}>
              <Text style={styles.modeTitle}>Albums</Text>
              <Text style={styles.modeSubtitle}>Pick an album</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Month-by-month</Text>
          {allMonths.length > visibleMonths.length ? (
            <Pressable
              onPress={() => setVisibleMonths(allMonths.slice(0, visibleMonths.length + 18))}
              style={styles.morePill}>
              <Text style={styles.morePillText}>Load more</Text>
            </Pressable>
          ) : null}
        </View>

        {!perm?.granted ? (
          <Text style={styles.sectionHint}>Enable Photos access to view months.</Text>
        ) : !allMonths.length ? (
          <View style={styles.monthLoading}>
            <ActivityIndicator color={theme.colors.textDim} />
            <Text style={styles.sectionHint}>Indexing your library...</Text>
          </View>
        ) : (
          <View style={styles.monthList}>
            {visibleMonths.map((m) => {
              const total = monthTotals[m];
              const p = progressByScope[scopeKeyForMonth(m)];
              const reviewed = p?.cursor ?? 0;
              const completed = total != null && reviewed >= total && total > 0;
              const pct = total ? Math.min(100, Math.round((reviewed / total) * 100)) : 0;

              return (
                <Pressable
                  key={m}
                  onPress={() => onPressStartMonth(m, completed)}
                  onLayout={() => ensureMonthTotal(m)}
                  style={styles.monthRow}>
                  <View style={styles.monthRowLeft}>
                    <Text style={styles.monthLabel}>{formatMonthLabel(m)}</Text>
                    <Text style={styles.monthMeta}>
                      {total == null ? '...' : `${reviewed} / ${total}`} {total ? `- ${pct}%` : ''}
                    </Text>
                  </View>

                  <View style={styles.monthRowRight}>
                    {loadingTotals[m] ? <ActivityIndicator color={theme.colors.textDim} /> : null}
                    <View style={[styles.monthBadge, completed ? styles.monthBadgeDone : styles.monthBadgeGo]}>
                      <Text style={styles.monthBadgeText}>{completed ? 'Revisit' : reviewed > 0 ? 'Resume' : 'Start'}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {showDatePicker ? (
          <DateTimePicker
            value={onThisDayDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(e, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) setOnThisDayDate(date);
            }}
          />
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
    paddingBottom: 120,
    gap: theme.spacing.lg,
  },
  header: {
    gap: 6,
  },
  brand: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  tagline: {
    color: theme.colors.textDim,
    fontSize: 14,
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
    fontWeight: '800',
  },
  permissionText: {
    color: theme.colors.textDim,
    fontSize: 13,
    lineHeight: 18,
  },
  permissionButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: theme.colors.text,
  },
  permissionButtonText: {
    color: theme.colors.bg,
    fontWeight: '800',
    fontSize: 13,
  },
  resumeCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    gap: 6,
  },
  resumeTitle: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  resumeText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  modeRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modePress: {
    flex: 1,
  },
  modeCard: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    minHeight: 148,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  modeCardSmall: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    minHeight: 120,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  modeTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  modeSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '700',
  },
  modePill: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  modePillGhost: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  modePillText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  streakPill: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  streakText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  sectionHint: {
    color: theme.colors.textDim,
    fontSize: 13,
  },
  monthLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  morePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  morePillText: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontWeight: '800',
  },
  monthList: {
    gap: 10,
  },
  monthRow: {
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
  monthRowLeft: {
    flex: 1,
    gap: 4,
  },
  monthRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  monthMeta: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontWeight: '700',
  },
  monthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  monthBadgeGo: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: theme.colors.stroke,
  },
  monthBadgeDone: {
    backgroundColor: 'rgba(55, 214, 122, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(55, 214, 122, 0.35)',
  },
  monthBadgeText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
});
