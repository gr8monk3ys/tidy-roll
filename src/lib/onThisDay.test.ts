import { describe, expect, it } from 'vitest';

import { computeOnThisDayAfterCompletion, type OnThisDayState } from './onThisDay';

describe('computeOnThisDayAfterCompletion', () => {
  it('starts streak at 1 when no previous completion exists', () => {
    const previous: OnThisDayState = { streakCount: 0 };
    const at = new Date(2026, 1, 20, 9, 30, 0, 0).getTime();

    const next = computeOnThisDayAfterCompletion(previous, at);

    expect(next).toEqual({
      streakCount: 1,
      lastCompletedDayKey: '2026-02-20',
      lastCompletedAt: at,
    });
  });

  it('keeps streak unchanged when called twice on the same day', () => {
    const at = new Date(2026, 1, 20, 11, 0, 0, 0).getTime();
    const previous: OnThisDayState = {
      streakCount: 3,
      lastCompletedDayKey: '2026-02-20',
      lastCompletedAt: at,
    };

    const next = computeOnThisDayAfterCompletion(previous, at + 60_000);

    expect(next).toBe(previous);
  });

  it('increments streak when completion happens the next day', () => {
    const previous: OnThisDayState = {
      streakCount: 3,
      lastCompletedDayKey: '2026-02-19',
      lastCompletedAt: new Date(2026, 1, 19, 12, 0, 0, 0).getTime(),
    };
    const at = new Date(2026, 1, 20, 9, 30, 0, 0).getTime();

    const next = computeOnThisDayAfterCompletion(previous, at);

    expect(next.streakCount).toBe(4);
    expect(next.lastCompletedDayKey).toBe('2026-02-20');
    expect(next.lastCompletedAt).toBe(at);
  });

  it('resets streak when a day is skipped', () => {
    const previous: OnThisDayState = {
      streakCount: 5,
      lastCompletedDayKey: '2026-02-17',
      lastCompletedAt: new Date(2026, 1, 17, 18, 0, 0, 0).getTime(),
    };
    const at = new Date(2026, 1, 20, 9, 30, 0, 0).getTime();

    const next = computeOnThisDayAfterCompletion(previous, at);

    expect(next.streakCount).toBe(1);
    expect(next.lastCompletedDayKey).toBe('2026-02-20');
    expect(next.lastCompletedAt).toBe(at);
  });
});
