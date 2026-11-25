import type { Category, Location, Rate, RateTable } from '../types';

export const DEFAULT_RATES: Rate[] = [
  { category: 'U12', inTown: 30, outOfTown: 40, order: 0 },
  { category: 'U14', inTown: 30, outOfTown: 40, order: 1 },
  { category: 'U16', inTown: 30, outOfTown: 40, order: 2 },
  { category: 'U18', inTown: 35, outOfTown: 45, order: 3 },
  { category: 'U21 Women', inTown: 40, outOfTown: 40, order: 4 },
  { category: 'First League', inTown: 40, outOfTown: 40, order: 5 },
  { category: 'Second League', inTown: 35, outOfTown: 35, order: 6 },
  { category: 'Superleague Women', inTown: 50, outOfTown: 50, order: 7 },
  { category: 'Superleague Men', inTown: 140, outOfTown: 140, order: 8 },
  { category: 'Veteran League', inTown: 35, outOfTown: 35, order: 9 },
];

export function toRateTable(rates: Rate[]): RateTable {
  const table: RateTable = {};
  for (const r of rates) table[r.category] = { inTown: r.inTown, outOfTown: r.outOfTown };
  return table;
}

/** Fee for a category + location from the rate table. Returns undefined if the category has no rate. */
export function calculateFee(rates: RateTable, category: Category, location: Location): number | undefined {
  const rate = rates[category];
  if (!rate) return undefined;
  return location === 'in_town' ? rate.inTown : rate.outOfTown;
}

export interface ResolveFeeInput {
  rates: RateTable;
  category: Category;
  location: Location;
  /** Manually entered fee; when defined it always wins. */
  override?: number;
  /** The game as it was stored before editing (if editing). */
  previous?: { category: Category; location: Location; fee: number; feeOverridden?: boolean };
}

/**
 * Decide the fee to store when a game is saved.
 * - A manual override always wins.
 * - When editing a game whose category and location did not change (and was not overridden),
 *   the stored fee is kept, so later rate changes never alter past games.
 * - Otherwise the fee is calculated from the current rates (0 if the category has no rate).
 */
export function resolveFee({ rates, category, location, override, previous }: ResolveFeeInput): number {
  if (override !== undefined && Number.isFinite(override)) return roundMoney(Math.max(0, override));
  if (previous && !previous.feeOverridden && previous.category === category && previous.location === location) {
    return previous.fee;
  }
  return calculateFee(rates, category, location) ?? 0;
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

