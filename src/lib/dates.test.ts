import { describe, expect, it } from 'vitest';
import {
  dayBounds,
  formatMonthLabel,
  formatShortDate,
  formatTime,
  monthBounds,
  monthKeyFromDate,
} from './dates';

describe('monthKeyFromDate', () => {
  it('formats a date as YYYY-MM', () => {
    expect(monthKeyFromDate(new Date(2024, 0, 15))).toBe('2024-01');
    expect(monthKeyFromDate(new Date(2024, 11, 1))).toBe('2024-12');
  });

  it('zero-pads single-digit months', () => {
    expect(monthKeyFromDate(new Date(2025, 8, 30))).toBe('2025-09');
  });
});

describe('formatMonthLabel', () => {
  it('renders a human-readable month and year', () => {
    expect(formatMonthLabel('2024-01')).toBe('Jan 2024');
    expect(formatMonthLabel('2024-12')).toBe('Dec 2024');
  });
});

describe('monthBounds', () => {
  it('returns the first instant of the month as start', () => {
    const { start } = monthBounds('2024-03');
    expect(start).toEqual(new Date(2024, 2, 1, 0, 0, 0, 0));
  });

  it('returns an exclusive end at the first instant of the next month', () => {
    const { end } = monthBounds('2024-03');
    expect(end).toEqual(new Date(2024, 3, 1, 0, 0, 0, 0));
  });

  it('rolls the year over for December', () => {
    const { end } = monthBounds('2024-12');
    expect(end).toEqual(new Date(2025, 0, 1, 0, 0, 0, 0));
  });

  it('produces an end strictly after start spanning exactly one month', () => {
    const { start, end } = monthBounds('2024-02');
    expect(end.getTime()).toBeGreaterThan(start.getTime());
    expect(start.getMonth()).toBe(1);
    expect(end.getMonth()).toBe(2);
  });
});

describe('dayBounds', () => {
  it('returns the start of the given day', () => {
    const { start } = dayBounds(6, 24, 2026);
    expect(start).toEqual(new Date(2026, 5, 24, 0, 0, 0, 0));
  });

  it('returns an exclusive end at the start of the next day', () => {
    const { end } = dayBounds(6, 24, 2026);
    expect(end).toEqual(new Date(2026, 5, 25, 0, 0, 0, 0));
  });

  it('rolls into the next month at a month boundary', () => {
    const { end } = dayBounds(1, 31, 2024);
    expect(end).toEqual(new Date(2024, 1, 1, 0, 0, 0, 0));
  });
});

describe('formatShortDate', () => {
  it('formats an epoch-ms timestamp as a short date', () => {
    const ms = new Date(2024, 0, 5, 13, 30, 0, 0).getTime();
    expect(formatShortDate(ms)).toBe('Jan 5, 2024');
  });
});

describe('formatTime', () => {
  it('formats an epoch-ms timestamp as a 12-hour time with meridiem', () => {
    const morning = new Date(2024, 0, 5, 9, 5, 0, 0).getTime();
    expect(formatTime(morning)).toBe('9:05 AM');

    const evening = new Date(2024, 0, 5, 18, 45, 0, 0).getTime();
    expect(formatTime(evening)).toBe('6:45 PM');
  });
});
