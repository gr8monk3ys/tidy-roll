import { format, subDays } from 'date-fns';

export type OnThisDayState = {
  streakCount: number;
  lastCompletedDayKey?: string;
  lastCompletedAt?: number;
};

export function computeOnThisDayAfterCompletion(previous: OnThisDayState, at: number): OnThisDayState {
  const todayKey = format(new Date(at), 'yyyy-MM-dd');
  const lastKey = previous.lastCompletedDayKey;

  if (lastKey === todayKey) {
    return previous;
  }

  const yesterdayKey = format(subDays(new Date(at), 1), 'yyyy-MM-dd');
  const nextStreak = lastKey === yesterdayKey ? previous.streakCount + 1 : 1;

  return {
    streakCount: nextStreak,
    lastCompletedDayKey: todayKey,
    lastCompletedAt: at,
  };
}

