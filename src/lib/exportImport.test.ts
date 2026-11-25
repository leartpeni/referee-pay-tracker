import { describe, expect, it } from 'vitest';
import { buildExport, gamesToCSV, parseImport } from './exportImport';
import type { Game } from '../types';

const g: Game = { id: '1', date: '2026-11-10', category: 'U14', location: 'in_town', teams: 'A, "B"', fee: 30, paid: false };

describe('export / import', () => {
  it('escapes CSV cells', () => {
    const csv = gamesToCSV([g]);
    expect(csv.split('\r\n')[1]).toBe('1,2026-11-10,U14,in_town,"A, ""B""",30,false,false,,');
  });

  it('round-trips a JSON backup', () => {
    const data = buildExport({ homeTown: 'X', currency: '€' }, [{ category: 'U14', inTown: 30, outOfTown: 40, order: 0 }], [g]);
    const parsed = parseImport(JSON.stringify(data));
    expect(parsed.games).toEqual([{ ...g, feeOverridden: undefined, paidDate: undefined, notes: undefined }]);
    expect(parsed.rates).toEqual(data.rates);
    expect(parsed.settings).toEqual(data.settings);
  });

  it('rejects invalid files', () => {
    expect(() => parseImport('nope')).toThrow('not valid JSON');
    expect(() => parseImport('{}')).toThrow('not a Referee Pay Tracker backup');
    const bad = { app: 'referee-pay-tracker', rates: [], games: [{ ...g, date: '10/11/2026' }] };
    expect(() => parseImport(JSON.stringify(bad))).toThrow('invalid date');
  });
});

