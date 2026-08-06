import { format } from 'date-fns';

export type MonthKey = `${number}-${string}`; // "YYYY-MM"

export function monthKeyFromDate(d: Date): MonthKey {
  return format(d, 'yyyy-MM') as MonthKey;
}

export function formatMonthLabel(monthKey: MonthKey): string {
  const [y, m] = monthKey.split('-').map((x) => Number(x));
  const date = new Date(y, m - 1, 1);
  return format(date, 'MMM yyyy');
}

export function monthBounds(monthKey: MonthKey): { start: Date; end: Date } {
  const [y, m] = monthKey.split('-').map((x) => Number(x));
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 1, 0, 0, 0, 0); // exclusive end
  return { start, end };
}

export function dayBounds(month: number, day: number, year: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
  return { start, end };
}

export function formatShortDate(ms: number): string {
  return format(new Date(ms), 'MMM d, yyyy');
}

export function formatTime(ms: number): string {
  return format(new Date(ms), 'h:mm a');
}
