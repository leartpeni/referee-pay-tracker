/** Date helpers working on local calendar dates stored as YYYY-MM-DD strings. */

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Parse YYYY-MM-DD as a local date (not UTC). */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Month key YYYY-MM. */
export function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function monthKeyOf(year: number, monthIndex: number): string {
  return `${year}-${pad(monthIndex + 1)}`;
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKeyOf(d.getFullYear(), d.getMonth());
}

export function formatMonth(key: string, locale?: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export function formatShortMonth(key: string, locale?: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: 'short', year: 'numeric' });
}

export function formatDate(date: string, locale?: string): string {
  return parseISODate(date).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * Basketball season runs September to August.
 * Month index (0-based) on which a new season starts.
 */
export const SEASON_START_MONTH = 8;

/** Start year of the season a date belongs to, e.g. 2026-10-03 -> 2026, 2027-03-01 -> 2026. */
export function seasonStartYear(date: string): number {
  const [y, m] = date.split('-').map(Number);
  return m - 1 >= SEASON_START_MONTH ? y : y - 1;
}

export function seasonLabel(startYear: number): string {
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}`;
}

