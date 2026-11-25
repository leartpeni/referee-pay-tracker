import type { ExportData, Game, Location, Rate, Settings } from '../types';

function csvCell(value: string | number | boolean | undefined): string {
  if (value === undefined) return '';
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function gamesToCSV(games: Game[]): string {
  const header = ['id', 'date', 'category', 'location', 'teams', 'fee', 'fee_overridden', 'paid', 'paid_date', 'notes'];
  const rows = games.map((g) =>
    [g.id, g.date, g.category, g.location, g.teams, g.fee, g.feeOverridden ?? false, g.paid, g.paidDate, g.notes]
      .map(csvCell)
      .join(','),
  );
  return [header.join(','), ...rows].join('\r\n') + '\r\n';
}

export function buildExport(settings: Settings, rates: Rate[], games: Game[]): ExportData {
  return {
    app: 'referee-pay-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    rates,
    games,
  };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const optStr = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v : undefined);

/** Validate and normalise an imported JSON backup. Throws an Error with a readable message if invalid. */
export function parseImport(text: string): ExportData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('The file is not valid JSON.');
  }
  if (!isObj(raw) || raw.app !== 'referee-pay-tracker') {
    throw new Error('This file is not a Referee Pay Tracker backup.');
  }
  if (!Array.isArray(raw.games) || !Array.isArray(raw.rates)) {
    throw new Error('The backup is missing games or rates.');
  }

  const rates: Rate[] = raw.rates.map((r, i) => {
    if (!isObj(r) || typeof r.category !== 'string' || !r.category.trim()) throw new Error(`Rate ${i + 1} is invalid.`);
    const inTown = Number(r.inTown);
    const outOfTown = Number(r.outOfTown);
    if (!Number.isFinite(inTown) || !Number.isFinite(outOfTown)) throw new Error(`Rate for ${r.category} is invalid.`);
    return { category: r.category.trim(), inTown, outOfTown, order: Number.isFinite(Number(r.order)) ? Number(r.order) : i };
  });

  const games: Game[] = raw.games.map((g, i) => {
    if (!isObj(g)) throw new Error(`Game ${i + 1} is invalid.`);
    const fee = Number(g.fee);
    if (typeof g.id !== 'string' || !g.id) throw new Error(`Game ${i + 1} has no id.`);
    if (typeof g.date !== 'string' || !DATE_RE.test(g.date)) throw new Error(`Game ${i + 1} has an invalid date.`);
    if (typeof g.category !== 'string' || !g.category) throw new Error(`Game ${i + 1} has no category.`);
    if (g.location !== 'in_town' && g.location !== 'out_of_town') throw new Error(`Game ${i + 1} has an invalid location.`);
    if (!Number.isFinite(fee)) throw new Error(`Game ${i + 1} has an invalid fee.`);
    const paidDate = optStr(g.paidDate);
    return {
      id: g.id,
      date: g.date,
      category: g.category,
      location: g.location as Location,
      teams: optStr(g.teams),
      fee,
      feeOverridden: g.feeOverridden === true || undefined,
      paid: g.paid === true,
      paidDate: paidDate && DATE_RE.test(paidDate) ? paidDate : undefined,
      notes: optStr(g.notes),
    };
  });

  const s = isObj(raw.settings) ? raw.settings : {};
  const settings: Settings = {
    homeTown: typeof s.homeTown === 'string' ? s.homeTown : '',
    currency: typeof s.currency === 'string' && s.currency ? s.currency : '€',
  };

  return { app: 'referee-pay-tracker', version: 1, exportedAt: String(raw.exportedAt ?? ''), settings, rates, games };
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

