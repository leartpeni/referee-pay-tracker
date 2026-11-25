import { describe, expect, it } from 'vitest';
import type { Game } from '../types';
import {
  breakdownByCategory,
  breakdownByMonth,
  monthlySummary,
  seasonSummary,
  sortNewestFirst,
  summarize,
} from './summary';
import { seasonLabel, seasonStartYear, shiftMonth } from './dates';

let n = 0;
const game = (p: Partial<Game>): Game => ({
  id: `g${++n}`,
  date: '2026-11-10',
  category: 'U14',
  location: 'in_town',
  fee: 30,
  paid: false,
  ...p,
});

const games: Game[] = [
  game({ date: '2026-08-30', category: 'U12', fee: 30, paid: true }), // previous season
  game({ date: '2026-09-05', category: 'U18', fee: 45, paid: true }),
  game({ date: '2026-11-02', category: 'U14', fee: 30, paid: true }),
  game({ date: '2026-11-15', category: 'U18', fee: 35 }),
  game({ date: '2026-11-28', category: 'U16', fee: 40 }),
  game({ date: '2027-03-12', category: 'U14', fee: 30.5, paid: true }),
  game({ date: '2027-09-01', category: 'U12', fee: 30 }), // next season
];

describe('summarize', () => {
  it('returns zeros for no games', () => {
    expect(summarize([])).toEqual({ total: 0, paid: 0, owed: 0, count: 0 });
  });

  it('totals paid and owed amounts', () => {
    expect(summarize(games)).toEqual({ total: 240.5, paid: 135.5, owed: 105, count: 7 });
  });

  it('avoids floating point drift', () => {
    const s = summarize([game({ fee: 0.1 }), game({ fee: 0.2, paid: true })]);
    expect(s.total).toBe(0.3);
    expect(s.owed).toBe(0.1);
  });
});

describe('monthlySummary', () => {
  it('only counts games in the given month', () => {
    expect(monthlySummary(games, '2026-11')).toEqual({ total: 105, paid: 30, owed: 75, count: 3 });
  });

  it('returns zeros for an empty month', () => {
    expect(monthlySummary(games, '2026-10')).toEqual({ total: 0, paid: 0, owed: 0, count: 0 });
  });
});

describe('seasonSummary', () => {
  it('season runs September to August', () => {
    expect(seasonStartYear('2026-08-31')).toBe(2025);
    expect(seasonStartYear('2026-09-01')).toBe(2026);
    expect(seasonStartYear('2027-08-31')).toBe(2026);
    expect(seasonLabel(2026)).toBe('2026/27');
  });

  it('totals the 2026/27 season', () => {
    expect(seasonSummary(games, 2026)).toEqual({ total: 180.5, paid: 105.5, owed: 75, count: 5 });
  });
});

describe('breakdowns', () => {
  it('groups by category in the configured order', () => {
    const result = breakdownByCategory(games, ['U12', 'U14', 'U16', 'U18']);
    expect(result.map((r) => [r.category, r.count, r.total])).toEqual([
      ['U12', 2, 60],
      ['U14', 2, 60.5],
      ['U16', 1, 40],
      ['U18', 2, 80],
    ]);
  });

  it('puts unknown categories last', () => {
    const result = breakdownByCategory([game({ category: 'Senior' }), game({ category: 'U12' })], ['U12']);
    expect(result.map((r) => r.category)).toEqual(['U12', 'Senior']);
  });

  it('groups by month, oldest first', () => {
    const result = breakdownByMonth(games);
    expect(result.map((r) => [r.month, r.count, r.total])).toEqual([
      ['2026-08', 1, 30],
      ['2026-09', 1, 45],
      ['2026-11', 3, 105],
      ['2027-03', 1, 30.5],
      ['2027-09', 1, 30],
    ]);
  });
});

describe('helpers', () => {
  it('sorts newest first', () => {
    expect(sortNewestFirst(games)[0].date).toBe('2027-09-01');
    expect(sortNewestFirst(games).at(-1)?.date).toBe('2026-08-30');
  });

  it('shifts months across years', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });
});

