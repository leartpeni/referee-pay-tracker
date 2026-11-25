import { useId, useMemo, useState, type FormEvent } from 'react';
import type { Game, Location } from '../types';
import { useData } from '../state/DataContext';
import { newId } from '../db';
import { calculateFee, resolveFee } from '../lib/fees';
import { formatDate, todayISO } from '../lib/dates';
import { formatMoney, locationLabel } from '../lib/format';
import { SegmentedControl } from '../components/SegmentedControl';
import { Switch } from '../components/Switch';
import { ConfirmDialog } from '../components/Dialog';
import { IconClose, IconTrash } from '../components/Icons';

interface GameFormProps {
  /** Game to edit; undefined to add a new game. */
  game?: Game;
  titleId: string;
  /** Called after a successful save with the game date. */
  onDone: (date: string) => void;
  onCancel: () => void;
}

const inputClass =
  'block min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-ink placeholder:text-stone-400 focus:border-navy focus:outline-none focus-visible:outline-3 focus-visible:outline-accent';

export function GameForm({ game, titleId, onDone, onCancel }: GameFormProps) {
  const { rateTable, categories, settings, saveGame, removeGame } = useData();
  const ids = useId();
  const editing = !!game;

  const [date, setDate] = useState(game?.date ?? todayISO());
  const [category, setCategory] = useState(game?.category ?? categories[0] ?? 'U12');
  const [location, setLocation] = useState<Location>(game?.location ?? 'in_town');
  const [teams, setTeams] = useState(game?.teams ?? '');
  const [notes, setNotes] = useState(game?.notes ?? '');
  const [paid, setPaid] = useState(game?.paid ?? false);
  const [paidDate, setPaidDate] = useState(game?.paidDate ?? todayISO());
  const [overrideOn, setOverrideOn] = useState(game?.feeOverridden ?? false);
  const [overrideText, setOverrideText] = useState(game?.feeOverridden ? String(game.fee) : '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  // Keep a category that was removed in Settings selectable for old games.
  const categoryOptions = useMemo(() => {
    const list = [...categories];
    if (game && !list.includes(game.category)) list.push(game.category);
    return list.map((c) => ({ value: c, label: c }));
  }, [categories, game]);

  const overrideValue = overrideOn && overrideText.trim() !== '' ? Number(overrideText.replace(',', '.')) : undefined;
  const overrideInvalid = overrideOn && (overrideValue === undefined || !Number.isFinite(overrideValue) || overrideValue < 0);

  const fee = resolveFee({
    rates: rateTable,
    category,
    location,
    override: overrideInvalid ? undefined : overrideValue,
    previous: game,
  });
  const rateFee = calculateFee(rateTable, category, location);
  const keptOldFee =
    editing && !overrideOn && !game.feeOverridden && game.category === category && game.location === location && rateFee !== game.fee;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!date) return setError('Please choose a date.');
    if (overrideInvalid) return setError('Enter a valid amount, or turn off the custom amount.');
    const next: Game = {
      id: game?.id ?? newId(),
      date,
      category,
      location,
      teams: teams.trim() || undefined,
      notes: notes.trim() || undefined,
      fee,
      feeOverridden: overrideOn || undefined,
      paid,
      paidDate: paid ? paidDate || todayISO() : undefined,
    };
    try {
      await saveGame(next);
      onDone(next.date);
    } catch {
      setError('Could not save the game. Please try again.');
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col" aria-labelledby={titleId} noValidate>
      <div className="pt-safe flex items-center justify-between gap-2 border-b border-stone-200 px-4 py-2">
        <h2 id={titleId} className="text-xl font-bold text-navy">
          {editing ? 'Edit game' : 'Add game'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-navy hover:bg-stone-200"
        >
          <IconClose />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
        <div>
          <label htmlFor={`${ids}-date`} className="mb-2 block text-sm font-semibold text-navy">
            Date
          </label>
          <input
            id={`${ids}-date`}
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <SegmentedControl label="Category" options={categoryOptions} value={category} onChange={setCategory} />

        <SegmentedControl
          label="Location"
          options={[
            { value: 'in_town', label: settings.homeTown ? `In ${settings.homeTown}` : 'In town' },
            { value: 'out_of_town', label: 'Out of town' },
          ]}
          value={location}
          onChange={setLocation}
        />

        {/* Live fee preview */}
        <section aria-labelledby={`${ids}-fee`} className="rounded-[18px] bg-navy p-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p id={`${ids}-fee`} className="text-sm text-white/75">
                Fee for this game
              </p>
              <p className="text-3xl font-bold" aria-live="polite">
                {formatMoney(fee, settings.currency)}
              </p>
            </div>
            <p className="text-right text-sm text-white/75">
              {category} · {locationLabel(location)}
            </p>
          </div>
          {!overrideOn && rateFee === undefined && (
            <p className="mt-2 text-sm text-highlight">No rate set for {category}. Add one in Settings or enter a custom amount.</p>
          )}
          {keptOldFee && (
            <p className="mt-2 text-sm text-white/75">
              Kept the amount saved with this game. Current rate is {formatMoney(rateFee ?? 0, settings.currency)}.
            </p>
          )}
          <div className="mt-3 border-t border-white/15 pt-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={overrideOn}
                onChange={(e) => {
                  setOverrideOn(e.target.checked);
                  if (e.target.checked && overrideText === '') setOverrideText(String(fee));
                }}
                className="h-5 w-5 accent-highlight"
              />
              <span className="font-medium">Use a custom amount</span>
            </label>
            {overrideOn && (
              <div className="mt-2">
                <label htmlFor={`${ids}-override`} className="sr-only">
                  Custom amount
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">{settings.currency}</span>
                  <input
                    id={`${ids}-override`}
                    type="text"
                    inputMode="decimal"
                    value={overrideText}
                    onChange={(e) => setOverrideText(e.target.value)}
                    aria-invalid={overrideInvalid}
                    className="min-h-11 w-full rounded-xl border border-white/30 bg-white/10 px-3 text-lg font-semibold text-white focus:outline-none focus-visible:outline-3 focus-visible:outline-highlight"
                  />
                </div>
                {overrideInvalid && <p className="mt-1 text-sm text-highlight">Enter a valid amount.</p>}
              </div>
            )}
          </div>
        </section>

        <div className="rounded-[16px] bg-white p-4 shadow-sm">
          <Switch id={`${ids}-paid`} label="Already paid?" checked={paid} onChange={setPaid} />
          {paid && (
            <div className="mt-3">
              <label htmlFor={`${ids}-paiddate`} className="mb-2 block text-sm font-semibold text-navy">
                Paid on
              </label>
              <input
                id={`${ids}-paiddate`}
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor={`${ids}-teams`} className="mb-2 block text-sm font-semibold text-navy">
            Teams <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id={`${ids}-teams`}
            type="text"
            value={teams}
            onChange={(e) => setTeams(e.target.value)}
            placeholder="e.g. Sharks vs Eagles"
            autoComplete="off"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={`${ids}-notes`} className="mb-2 block text-sm font-semibold text-navy">
            Notes <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id={`${ids}-notes`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800">
            {error}
          </p>
        )}
      </div>

      <div className="pb-safe flex gap-3 border-t border-stone-200 bg-paper px-4 pt-3">
        {editing && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete game"
            className="mb-3 flex min-h-12 w-12 items-center justify-center rounded-xl border border-red-200 text-red-700 hover:bg-red-50"
          >
            <IconTrash />
          </button>
        )}
        <button
          type="submit"
          className="mb-3 min-h-12 flex-1 rounded-xl bg-accent font-semibold text-white hover:bg-accent-dark"
        >
          {editing ? 'Save changes' : `Save game · ${formatMoney(fee, settings.currency)}`}
        </button>
      </div>

      {confirmDelete && game && (
        <ConfirmDialog
          title="Delete this game?"
          message={
            <>
              {game.category} on {formatDate(game.date)} ({formatMoney(game.fee, settings.currency)}). This cannot be undone.
            </>
          }
          confirmLabel="Delete"
          destructive
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            setConfirmDelete(false);
            // The app closes the editor once the game no longer exists.
            await removeGame(game.id);
          }}
        />
      )}
    </form>
  );
}





