import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Game, Rate, RateTable, Settings } from '../types';
import * as db from '../db';
import { toRateTable } from '../lib/fees';
import { todayISO } from '../lib/dates';

interface DataContextValue {
  loading: boolean;
  error: string | null;
  games: Game[];
  rates: Rate[];
  rateTable: RateTable;
  categories: string[];
  settings: Settings;
  saveGame: (game: Game) => Promise<void>;
  removeGame: (id: string) => Promise<void>;
  togglePaid: (id: string) => Promise<void>;
  markAllPaid: (ids: string[]) => Promise<number>;
  updateRates: (rates: Rate[]) => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  importAll: (data: { settings: Settings; rates: Rate[]; games: Game[] }) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [settings, setSettings] = useState<Settings>(db.DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
      try {
        const d = await db.getDB();
        const [g, r, s] = await Promise.all([db.getAllGames(d), db.getRates(d), db.getSettings(d)]);
        setGames(g);
        setRates(r);
        setSettings(s);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not open the local database.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveGame = useCallback(async (game: Game) => {
    await db.putGame(await db.getDB(), game);
    setGames((prev) => [...prev.filter((g) => g.id !== game.id), game]);
  }, []);

  const removeGame = useCallback(async (id: string) => {
    await db.deleteGame(await db.getDB(), id);
    setGames((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const togglePaid = useCallback(
    async (id: string) => {
      const g = games.find((x) => x.id === id);
      if (!g) return;
      const next: Game = g.paid ? { ...g, paid: false, paidDate: undefined } : { ...g, paid: true, paidDate: todayISO() };
      await saveGame(next);
    },
    [games, saveGame],
  );

  const markAllPaid = useCallback(async (ids: string[]) => {
    const updated = await db.markGamesPaid(await db.getDB(), ids, todayISO());
    const byId = new Map(updated.map((g) => [g.id, g]));
    setGames((prev) => prev.map((g) => byId.get(g.id) ?? g));
    return updated.length;
  }, []);

  const updateRates = useCallback(async (next: Rate[]) => {
    await db.saveRates(await db.getDB(), next);
    setRates([...next].sort((a, b) => a.order - b.order));
  }, []);

  const updateSettings = useCallback(async (next: Settings) => {
    await db.saveSettings(await db.getDB(), next);
    setSettings(next);
  }, []);

  const importAll = useCallback(async (data: { settings: Settings; rates: Rate[]; games: Game[] }) => {
    await db.replaceAll(await db.getDB(), data);
    setGames(data.games);
    setRates([...data.rates].sort((a, b) => a.order - b.order));
    setSettings(data.settings);
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      error,
      games,
      rates,
      rateTable: toRateTable(rates),
      categories: rates.map((r) => r.category),
      settings,
      saveGame,
      removeGame,
      togglePaid,
      markAllPaid,
      updateRates,
      updateSettings,
      importAll,
    }),
    [loading, error, games, rates, settings, saveGame, removeGame, togglePaid, markAllPaid, updateRates, updateSettings, importAll],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}


