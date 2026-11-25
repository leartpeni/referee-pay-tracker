export type Category = string;

export type Location = 'in_town' | 'out_of_town';

export interface Game {
  id: string;
  /** ISO date, YYYY-MM-DD (local calendar date, no time zone). */
  date: string;
  category: Category;
  location: Location;
  teams?: string;
  /** Amount stored at save time. Never recalculated when rates change. */
  fee: number;
  /** True when the fee was entered manually instead of taken from the rates. */
  feeOverridden?: boolean;
  paid: boolean;
  /** ISO date, YYYY-MM-DD. */
  paidDate?: string;
  notes?: string;
}

export interface Rate {
  category: Category;
  inTown: number;
  outOfTown: number;
  /** Display order. */
  order: number;
}

export type RateTable = Record<Category, { inTown: number; outOfTown: number }>;

export interface Settings {
  homeTown: string;
  currency: string;
}

export interface Summary {
  total: number;
  paid: number;
  owed: number;
  count: number;
}

export interface ExportData {
  app: 'referee-pay-tracker';
  version: 1;
  exportedAt: string;
  settings: Settings;
  rates: Rate[];
  games: Game[];
}

