import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { describe, expect, it } from 'vitest';
import { deleteGame, getAllGames, getRates, getSettings, markGamesPaid, openAppDB, putGame, replaceAll, saveRates } from './index';
import type { Game } from '../types';

let dbCount = 0;
const freshDB = () => openAppDB(`test-db-${++dbCount}`);

const sample: Game = { id: 'a', date: '2026-11-10', category: 'U14', location: 'in_town', fee: 30, paid: false };

const ALL_DEFAULTS = [
  ['U12', 30, 40],
  ['U14', 30, 40],
  ['U16', 30, 40],
  ['U18', 35, 45],
  ['U21 Women', 40, 40],
  ['First League', 40, 40],
  ['Second League', 35, 35],
  ['Superleague Women', 50, 50],
  ['Superleague Men', 140, 140],
  ['Veteran League', 35, 35],
];

describe('database', () => {
  it('seeds default rates and settings', async () => {
    const db = await freshDB();
    const rates = await getRates(db);
    expect(rates.map((r) => [r.category, r.inTown, r.outOfTown])).toEqual(ALL_DEFAULTS);
    expect(await getSettings(db)).toEqual({ homeTown: '', currency: '€' });
  });

  it('upgrading from v1 adds the new categories without touching existing rates or games', async () => {
    const name = `test-db-${++dbCount}`;
    const v1 = await openDB(name, 1, {
      upgrade(db) {
        db.createObjectStore('games', { keyPath: 'id' }).createIndex('by-date', 'date');
        db.createObjectStore('rates', { keyPath: 'category' });
        db.createObjectStore('settings', { keyPath: 'key' });
      },
    });
    await v1.put('rates', { category: 'U12', inTown: 32, outOfTown: 42, order: 0 });
    await v1.put('rates', { category: 'U18', inTown: 35, outOfTown: 45, order: 1 });
    await v1.put('games', sample);
    v1.close();

    const db = await openAppDB(name);
    const rates = await getRates(db);
    expect(rates[0]).toEqual({ category: 'U12', inTown: 32, outOfTown: 42, order: 0 });
    expect(rates.map((r) => r.category)).toEqual([
      'U12',
      'U18',
      'U14',
      'U16',
      'U21 Women',
      'First League',
      'Second League',
      'Superleague Women',
      'Superleague Men',
      'Veteran League',
    ]);
    expect(await getAllGames(db)).toEqual([sample]);
  });

  it('stores, updates and deletes games', async () => {
    const db = await freshDB();
    await putGame(db, sample);
    await putGame(db, { ...sample, notes: 'Final' });
    expect(await getAllGames(db)).toEqual([{ ...sample, notes: 'Final' }]);
    await deleteGame(db, 'a');
    expect(await getAllGames(db)).toEqual([]);
  });

  it('changing rates does not change stored game fees', async () => {
    const db = await freshDB();
    await putGame(db, sample);
    await saveRates(db, [{ category: 'U14', inTown: 99, outOfTown: 99, order: 0 }]);
    expect((await getAllGames(db))[0].fee).toBe(30);
    expect(await getRates(db)).toEqual([{ category: 'U14', inTown: 99, outOfTown: 99, order: 0 }]);
  });

  it('marks unpaid games as paid', async () => {
    const db = await freshDB();
    await putGame(db, sample);
    await putGame(db, { ...sample, id: 'b', paid: true, paidDate: '2026-11-01' });
    const updated = await markGamesPaid(db, ['a', 'b'], '2026-11-20');
    expect(updated.map((g) => g.id)).toEqual(['a']);
    const all = await getAllGames(db);
    expect(all.find((g) => g.id === 'a')).toMatchObject({ paid: true, paidDate: '2026-11-20' });
    expect(all.find((g) => g.id === 'b')).toMatchObject({ paidDate: '2026-11-01' });
  });

  it('replaces all data on import', async () => {
    const db = await freshDB();
    await putGame(db, sample);
    await replaceAll(db, {
      settings: { homeTown: 'Prishtina', currency: '$' },
      rates: [{ category: 'U20', inTown: 50, outOfTown: 60, order: 0 }],
      games: [{ ...sample, id: 'z' }],
    });
    expect((await getAllGames(db)).map((g) => g.id)).toEqual(['z']);
    expect((await getRates(db)).map((r) => r.category)).toEqual(['U20']);
    expect(await getSettings(db)).toEqual({ homeTown: 'Prishtina', currency: '$' });
  });
});

