import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { ExportData, Rate } from '../types';
import { useData } from '../state/DataContext';
import { buildExport, downloadFile, gamesToCSV, parseImport } from '../lib/exportImport';
import { todayISO } from '../lib/dates';
import { PageHeader } from '../components/PageHeader';
import { ConfirmDialog } from '../components/Dialog';
import { IconDownload, IconTrash, IconUpload } from '../components/Icons';

interface DraftRate {
  category: string;
  inTown: string;
  outOfTown: string;
}

const inputClass =
  'block min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-ink focus:border-navy focus:outline-none focus-visible:outline-3 focus-visible:outline-accent';
const card = 'rounded-[18px] bg-white p-5 shadow-sm';
const primaryBtn = 'min-h-11 rounded-xl bg-navy px-5 font-semibold text-white hover:bg-navy-700 disabled:opacity-50';
const secondaryBtn =
  'flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 font-semibold text-navy hover:border-navy';

const toDraft = (rates: Rate[]): DraftRate[] =>
  rates.map((r) => ({ category: r.category, inTown: String(r.inTown), outOfTown: String(r.outOfTown) }));

const parseAmount = (s: string) => {
  const n = Number(s.replace(',', '.'));
  return s.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : undefined;
};

export function SettingsPage() {
  const { rates, settings, games, updateRates, updateSettings, importAll } = useData();
  const ids = useId();

  // ----- Rates -----
  const [draft, setDraft] = useState<DraftRate[]>(() => toDraft(rates));
  const [newCategory, setNewCategory] = useState('');
  const [rateMsg, setRateMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [toRemove, setToRemove] = useState<string | null>(null);
  useEffect(() => setDraft(toDraft(rates)), [rates]);

  const ratesDirty = JSON.stringify(draft) !== JSON.stringify(toDraft(rates));

  const setRateField = (i: number, field: 'inTown' | 'outOfTown', value: string) =>
    setDraft((d) => d.map((r, j) => (j === i ? { ...r, [field]: value } : r)));

  const saveRates = async () => {
    const next: Rate[] = [];
    for (const [i, r] of draft.entries()) {
      const inTown = parseAmount(r.inTown);
      const outOfTown = parseAmount(r.outOfTown);
      if (inTown === undefined || outOfTown === undefined) {
        setRateMsg({ ok: false, text: `Enter valid amounts for ${r.category}.` });
        return;
      }
      next.push({ category: r.category, inTown, outOfTown, order: i });
    }
    await updateRates(next);
    setRateMsg({ ok: true, text: 'Rates saved. Existing games keep their amounts.' });
  };

  const addCategory = (e: FormEvent) => {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    if (draft.some((r) => r.category.toLowerCase() === name.toLowerCase())) {
      setRateMsg({ ok: false, text: `${name} already exists.` });
      return;
    }
    setDraft((d) => [...d, { category: name, inTown: '', outOfTown: '' }]);
    setNewCategory('');
    setRateMsg({ ok: true, text: `${name} added. Enter its rates and save.` });
  };

  const usedCount = (category: string) => games.filter((g) => g.category === category).length;

  // ----- General -----
  const [homeTown, setHomeTown] = useState(settings.homeTown);
  const [currency, setCurrency] = useState(settings.currency);
  const [generalMsg, setGeneralMsg] = useState('');
  useEffect(() => {
    setHomeTown(settings.homeTown);
    setCurrency(settings.currency);
  }, [settings]);

  const saveGeneral = async (e: FormEvent) => {
    e.preventDefault();
    await updateSettings({ homeTown: homeTown.trim(), currency: currency.trim() || '€' });
    setGeneralMsg('Saved.');
  };

  // ----- Data -----
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<ExportData | null>(null);
  const [dataMsg, setDataMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const exportJSON = () => {
    const data = buildExport(settings, rates, games);
    downloadFile(`referee-pay-${todayISO()}.json`, JSON.stringify(data, null, 2), 'application/json');
  };
  const exportCSV = () => downloadFile(`referee-games-${todayISO()}.csv`, gamesToCSV(games), 'text/csv;charset=utf-8');

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPendingImport(parseImport(await file.text()));
      setDataMsg(null);
    } catch (err) {
      setDataMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not read the file.' });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const msg = (m: { ok: boolean; text: string } | null) =>
    m && (
      <p role="status" className={`mt-3 text-sm font-medium ${m.ok ? 'text-emerald-800' : 'text-red-700'}`}>
        {m.text}
      </p>
    );

  return (
    <>
      <PageHeader title="Settings" />
      <div className="space-y-5 pb-6">
        {/* Rates */}
        <section aria-labelledby={`${ids}-rates`} className={card}>
          <h2 id={`${ids}-rates`} className="text-lg font-bold text-navy">
            Rates per game
          </h2>
          <p className="mt-1 text-sm text-muted">Changing rates only affects games you save from now on.</p>

          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-[6.5rem_1fr_1fr_2.75rem] items-end gap-2 text-xs font-semibold text-muted uppercase">
              <span>Category</span>
              <span>In town ({settings.currency})</span>
              <span>Out of town ({settings.currency})</span>
              <span className="sr-only">Remove</span>
            </div>
            {draft.map((r, i) => (
              <div key={r.category} className="grid grid-cols-[6.5rem_1fr_1fr_2.75rem] items-center gap-2">
                <span className="text-sm leading-tight font-bold break-words text-navy">
                  {r.category}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label={`${r.category} in town rate`}
                  value={r.inTown}
                  onChange={(e) => setRateField(i, 'inTown', e.target.value)}
                  aria-invalid={parseAmount(r.inTown) === undefined}
                  className={inputClass}
                />
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label={`${r.category} out of town rate`}
                  value={r.outOfTown}
                  onChange={(e) => setRateField(i, 'outOfTown', e.target.value)}
                  aria-invalid={parseAmount(r.outOfTown) === undefined}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setToRemove(r.category)}
                  disabled={draft.length <= 1}
                  aria-label={`Remove ${r.category}`}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-red-700 hover:bg-red-50 disabled:opacity-30"
                >
                  <IconTrash size={20} />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={addCategory} className="mt-4 flex gap-2">
            <label htmlFor={`${ids}-newcat`} className="sr-only">
              New category name
            </label>
            <input
              id={`${ids}-newcat`}
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category, e.g. U20"
              maxLength={24}
              className={inputClass}
            />
            <button type="submit" className={`${secondaryBtn} shrink-0`}>
              Add
            </button>
          </form>

          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={saveRates} disabled={!ratesDirty} className={primaryBtn}>
              Save rates
            </button>
            {ratesDirty && (
              <button type="button" onClick={() => setDraft(toDraft(rates))} className="min-h-11 px-3 font-semibold text-muted hover:text-navy">
                Discard
              </button>
            )}
          </div>
          {msg(rateMsg)}
        </section>

        {/* General */}
        <section aria-labelledby={`${ids}-general`} className={card}>
          <h2 id={`${ids}-general`} className="text-lg font-bold text-navy">
            General
          </h2>
          <form onSubmit={saveGeneral} className="mt-4 space-y-4">
            <div>
              <label htmlFor={`${ids}-town`} className="mb-2 block text-sm font-semibold text-navy">
                Home town
              </label>
              <input
                id={`${ids}-town`}
                type="text"
                value={homeTown}
                onChange={(e) => setHomeTown(e.target.value)}
                placeholder="Shown as the in-town label"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor={`${ids}-currency`} className="mb-2 block text-sm font-semibold text-navy">
                Currency symbol
              </label>
              <input
                id={`${ids}-currency`}
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                maxLength={4}
                className={`${inputClass} max-w-28`}
              />
            </div>
            <button type="submit" className={primaryBtn}>
              Save
            </button>
            {generalMsg && (
              <p role="status" className="text-sm font-medium text-emerald-800">
                {generalMsg}
              </p>
            )}
          </form>
        </section>

        {/* Data */}
        <section aria-labelledby={`${ids}-data`} className={card}>
          <h2 id={`${ids}-data`} className="text-lg font-bold text-navy">
            Your data
          </h2>
          <p className="mt-1 text-sm text-muted">
            Everything is stored only on this device. Export a backup regularly, especially before changing phones.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button type="button" onClick={exportCSV} className={secondaryBtn}>
              <IconDownload size={20} /> Export CSV
            </button>
            <button type="button" onClick={exportJSON} className={secondaryBtn}>
              <IconDownload size={20} /> Export JSON
            </button>
            <label className={`${secondaryBtn} cursor-pointer has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent`}>
              <IconUpload size={20} /> Import JSON
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                onChange={(e) => onPickFile(e.target.files?.[0])}
                className="sr-only"
              />
            </label>
          </div>
          {msg(dataMsg)}
        </section>
      </div>

      {toRemove && (
        <ConfirmDialog
          title={`Remove ${toRemove}?`}
          message={
            usedCount(toRemove) > 0
              ? `${usedCount(toRemove)} saved games use ${toRemove}. They keep their category and amount, but you can no longer pick it for new games.`
              : `${toRemove} will no longer be available for new games.`
          }
          confirmLabel="Remove"
          destructive
          onCancel={() => setToRemove(null)}
          onConfirm={() => {
            setDraft((d) => d.filter((r) => r.category !== toRemove));
            setRateMsg({ ok: true, text: `${toRemove} removed. Save rates to apply.` });
            setToRemove(null);
          }}
        />
      )}

      {pendingImport && (
        <ConfirmDialog
          title="Replace all data?"
          message={`The backup contains ${pendingImport.games.length} games and ${pendingImport.rates.length} categories. All data currently on this device will be replaced.`}
          confirmLabel="Replace"
          destructive
          onCancel={() => setPendingImport(null)}
          onConfirm={async () => {
            const data = pendingImport;
            setPendingImport(null);
            try {
              await importAll(data);
              setDataMsg({ ok: true, text: `Imported ${data.games.length} games.` });
            } catch {
              setDataMsg({ ok: false, text: 'Import failed. Your data was not changed.' });
            }
          }}
        />
      )}
    </>
  );
}

