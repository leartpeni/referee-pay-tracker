import { useMemo, useState } from 'react';
import type { Game } from '../types';
import { useData } from '../state/DataContext';
import { formatMonth, formatDate, monthKey, shiftMonth, todayISO } from '../lib/dates';
import { gamesInMonth, sortNewestFirst, summarize } from '../lib/summary';
import { formatMoney } from '../lib/format';
import { PageHeader } from '../components/PageHeader';
import { SummaryCard } from '../components/SummaryCard';
import { GameRow } from '../components/GameRow';
import { ConfirmDialog } from '../components/Dialog';
import { IconCheckAll, IconChevronLeft, IconChevronRight, IconPlus } from '../components/Icons';

type Filter = 'all' | 'unpaid' | 'paid';

interface GamesPageProps {
  month: string;
  onMonthChange: (month: string) => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onOpenSettings: () => void;
}

export function GamesPage({ month, onMonthChange, onAdd, onEdit, onOpenSettings }: GamesPageProps) {
  const { games, settings, togglePaid, removeGame, markAllPaid } = useData();
  const [filter, setFilter] = useState<Filter>('all');
  const [toDelete, setToDelete] = useState<Game | null>(null);
  const [confirmMarkAll, setConfirmMarkAll] = useState(false);
  const [status, setStatus] = useState('');

  const monthGames = useMemo(() => sortNewestFirst(gamesInMonth(games, month)), [games, month]);
  const summary = useMemo(() => summarize(monthGames), [monthGames]);
  const visible = useMemo(
    () => monthGames.filter((g) => (filter === 'all' ? true : filter === 'paid' ? g.paid : !g.paid)),
    [monthGames, filter],
  );
  const unpaid = monthGames.filter((g) => !g.paid);
  const isCurrentMonth = month === monthKey(todayISO());
  const { currency } = settings;

  const chip = (value: Filter, label: string, count: number) => (
    <label
      className={`flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent ${
        filter === value ? 'border-navy bg-navy text-white' : 'border-stone-300 bg-white text-navy hover:border-navy'
      }`}
    >
      <input type="radio" name="filter" value={value} checked={filter === value} onChange={() => setFilter(value)} className="sr-only" />
      {label}
      <span className={filter === value ? 'text-white/75' : 'text-muted'}>{count}</span>
    </label>
  );

  return (
    <>
      <PageHeader title="Games" onOpenSettings={onOpenSettings}>
        <div className="flex items-center justify-between gap-2 pb-3">
          <button
            type="button"
            onClick={() => onMonthChange(shiftMonth(month, -1))}
            aria-label="Previous month"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-navy shadow-sm hover:bg-stone-100"
          >
            <IconChevronLeft />
          </button>
          <div className="flex flex-col items-center">
            <p className="text-lg font-semibold text-navy" aria-live="polite">
              {formatMonth(month)}
            </p>
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={() => onMonthChange(monthKey(todayISO()))}
                className="min-h-8 px-2 text-sm font-semibold text-accent underline-offset-2 hover:underline"
              >
                Back to this month
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => onMonthChange(shiftMonth(month, 1))}
            aria-label="Next month"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-navy shadow-sm hover:bg-stone-100"
          >
            <IconChevronRight />
          </button>
        </div>
      </PageHeader>

      <div className="space-y-5 pb-6">
        <SummaryCard label={`Earned in ${formatMonth(month)}`} summary={summary} currency={currency} />

        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="sr-only">Filter games</legend>
          {chip('all', 'All', monthGames.length)}
          {chip('unpaid', 'Unpaid', unpaid.length)}
          {chip('paid', 'Paid', monthGames.length - unpaid.length)}
        </fieldset>

        {unpaid.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmMarkAll(true)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-emerald-600/50 bg-emerald-50 px-4 font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            <IconCheckAll size={20} />
            Mark all unpaid as paid ({unpaid.length})
          </button>
        )}

        <p className="sr-only" role="status">
          {status}
        </p>

        {visible.length > 0 ? (
          <>
            <ul className="space-y-2" aria-label="Games">
              {visible.map((g) => (
                <GameRow
                  key={g.id}
                  game={g}
                  currency={currency}
                  onOpen={() => onEdit(g.id)}
                  onTogglePaid={async () => {
                    await togglePaid(g.id);
                    setStatus(`${g.category} game on ${formatDate(g.date)} marked ${g.paid ? 'unpaid' : 'paid'}.`);
                  }}
                  onDelete={() => setToDelete(g)}
                />
              ))}
            </ul>
            <p className="hidden text-center text-sm text-muted [@media(pointer:coarse)]:block">
              Swipe right to mark paid, left to delete.
            </p>
          </>
        ) : (
          <div className="rounded-[20px] border border-dashed border-stone-300 p-8 text-center">
            <p className="font-semibold text-navy">
              {monthGames.length === 0 ? 'No games this month' : filter === 'paid' ? 'No paid games' : 'Nothing owed'}
            </p>
            {monthGames.length === 0 && (
              <button
                type="button"
                onClick={onAdd}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-5 font-semibold text-white hover:bg-accent-dark"
              >
                <IconPlus size={20} />
                Add a game
              </button>
            )}
          </div>
        )}
      </div>

      {toDelete && (
        <ConfirmDialog
          title="Delete this game?"
          message={
            <>
              {toDelete.category} on {formatDate(toDelete.date)} ({formatMoney(toDelete.fee, currency)}). This cannot be undone.
            </>
          }
          confirmLabel="Delete"
          destructive
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            await removeGame(toDelete.id);
            setToDelete(null);
            setStatus('Game deleted.');
          }}
        />
      )}

      {confirmMarkAll && (
        <ConfirmDialog
          title="Mark all as paid?"
          message={
            <>
              {unpaid.length} unpaid {unpaid.length === 1 ? 'game' : 'games'} in {formatMonth(month)} totalling{' '}
              {formatMoney(summary.owed, currency)} will be marked as paid today.
            </>
          }
          confirmLabel="Mark as paid"
          onCancel={() => setConfirmMarkAll(false)}
          onConfirm={async () => {
            const n = await markAllPaid(unpaid.map((g) => g.id));
            setConfirmMarkAll(false);
            setStatus(`${n} games marked paid.`);
          }}
        />
      )}
    </>
  );
}

