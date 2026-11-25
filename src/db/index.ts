import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Game, Rate, Settings } from '../types';
import { DEFAULT_RATES } from '../lib/fees';

export const DB_NAME = 'referee-pay-tracker';
export const DB_VERSION = 2;

export const DEFAULT_SETTINGS: Settings = { homeTown: '', currency: '€' };

interface SettingsRow extends Settings {
  key: 'app';
}

export interface RefereeDB extends DBSchema {
  games: { key: string; value: Game; indexes: { 'by-date': string } };
  rates: { key: string; value: Rate };
  settings: { key: 'app'; value: SettingsRow };
}

export type DB = IDBPDatabase<RefereeDB>;

export function openAppDB(name = DB_NAME): Promise<DB> {
  return openDB<RefereeDB>(name, DB_VERSION, {
    async upgrade(db, oldVersion, _newVersion, tx) {
      if (oldVersion < 1) {
        const games = db.createObjectStore('games', { keyPath: 'id' });
        games.createIndex('by-date', 'date');
        const rates = db.createObjectStore('rates', { keyPath: 'category' });
        for (const r of DEFAULT_RATES) void rates.put(r);
        db.createObjectStore('settings', { keyPath: 'key' });
        void tx.objectStore('settings').put({ key: 'app', ...DEFAULT_SETTINGS });
        return;
      }
      if (oldVersion < 2) {
        // v2 added league categories. Add any that are missing; never overwrite rates the user already has.
        const rates = tx.objectStore('rates');
        const existing = await rates.getAll();
        const names = new Set(existing.map((r) => r.category.toLowerCase()));
        let order = existing.reduce((max, r) => Math.max(max, r.order), -1) + 1;
        for (const r of DEFAULT_RATES) {
          if (!names.has(r.category.toLowerCase())) await rates.put({ ...r, order: order++ });
        }
      }
    },
  });
}

let dbPromise: Promise<DB> | null = null;
export function getDB(): Promise<DB> {
  dbPromise ??= openAppDB();
  return dbPromise;
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------- Games ----------

export async function getAllGames(db: DB): Promise<Game[]> {
  return db.getAll('games');
}

export async function putGame(db: DB, game: Game): Promise<Game> {
  await db.put('games', game);
  return game;
}

export async function deleteGame(db: DB, id: string): Promise<void> {
  await db.delete('games', id);
}

/** Mark the given games as paid in a single transaction. Returns the updated games. */
export async function markGamesPaid(db: DB, ids: string[], paidDate: string): Promise<Game[]> {
  const tx = db.transaction('games', 'readwrite');
  const updated: Game[] = [];
  for (const id of ids) {
    const g = await tx.store.get(id);
    if (g && !g.paid) {
      const next = { ...g, paid: true, paidDate };
      await tx.store.put(next);
      updated.push(next);
    }
  }
  await tx.done;
  return updated;
}

// ---------- Rates ----------

export async function getRates(db: DB): Promise<Rate[]> {
  const rates = await db.getAll('rates');
  return rates.sort((a, b) => a.order - b.order);
}

/** Replace the whole rate table (handles renames/removals). */
export async function saveRates(db: DB, rates: Rate[]): Promise<void> {
  const tx = db.transaction('rates', 'readwrite');
  await tx.store.clear();
  for (const r of rates) await tx.store.put(r);
  await tx.done;
}

// ---------- Settings ----------

export async function getSettings(db: DB): Promise<Settings> {
  const row = await db.get('settings', 'app');
  if (!row) return { ...DEFAULT_SETTINGS };
  const { key: _key, ...settings } = row;
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function saveSettings(db: DB, settings: Settings): Promise<void> {
  await db.put('settings', { key: 'app', ...settings });
}

// ---------- Backup ----------

/** Replace all data with the imported data in a single transaction. */
export async function replaceAll(db: DB, data: { settings: Settings; rates: Rate[]; games: Game[] }): Promise<void> {
  const tx = db.transaction(['games', 'rates', 'settings'], 'readwrite');
  const games = tx.objectStore('games');
  const rates = tx.objectStore('rates');
  await games.clear();
  await rates.clear();
  for (const g of data.games) await games.put(g);
  for (const r of data.rates) await rates.put(r);
  await tx.objectStore('settings').put({ key: 'app', ...data.settings });
  await tx.done;
}

