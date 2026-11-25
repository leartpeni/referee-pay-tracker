import type { Category, Game, Summary } from '../types';
import { monthKey, seasonStartYear } from './dates';
import { roundMoney } from './fees';

export function summarize(games: Game[]): Summary {
  let total = 0;
  let paid = 0;
  for (const g of games) {
    total += g.fee;
    if (g.paid) paid += g.fee;
  }
  total = roundMoney(total);
  paid = roundMoney(paid);
  return { total, paid, owed: roundMoney(total - paid), count: games.length };
}

export function gamesInMonth(games: Game[], key: string): Game[] {
  return games.filter((g) => monthKey(g.date) === key);
}

export function gamesInSeason(games: Game[], startYear: number): Game[] {
  return games.filter((g) => seasonStartYear(g.date) === startYear);
}

export function monthlySummary(games: Game[], key: string): Summary {
  return summarize(gamesInMonth(games, key));
}

export function seasonSummary(games: Game[], startYear: number): Summary {
  return summarize(gamesInSeason(games, startYear));
}

export interface CategoryBreakdown extends Summary {
  category: Category;
}

/** Per-category totals, ordered by the given category order, then any unknown categories alphabetically. */
export function breakdownByCategory(games: Game[], categoryOrder: Category[] = []): CategoryBreakdown[] {
  const groups = new Map<Category, Game[]>();
  for (const g of games) {
    const list = groups.get(g.category) ?? [];
    list.push(g);
    groups.set(g.category, list);
  }
  const rank = (c: Category) => {
    const i = categoryOrder.indexOf(c);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...groups.entries()]
    .map(([category, list]) => ({ category, ...summarize(list) }))
    .sort((a, b) => rank(a.category) - rank(b.category) || a.category.localeCompare(b.category));
}

export interface MonthBreakdown extends Summary {
  month: string;
}

/** Per-month totals (YYYY-MM), oldest first. */
export function breakdownByMonth(games: Game[]): MonthBreakdown[] {
  const groups = new Map<string, Game[]>();
  for (const g of games) {
    const key = monthKey(g.date);
    const list = groups.get(key) ?? [];
    list.push(g);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .map(([month, list]) => ({ month, ...summarize(list) }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/** Newest first; same date keeps a stable order by id. */
export function sortNewestFirst(games: Game[]): Game[] {
  return [...games].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

