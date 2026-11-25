import { useMemo } from 'react';
import { useData } from '../state/DataContext';
import { formatShortMonth, seasonLabel, seasonStartYear, todayISO } from '../lib/dates';
import { breakdownByCategory, breakdownByMonth, gamesInSeason, summarize } from '../lib/summary';
import { formatMoney } from '../lib/format';
import { PageHeader } from '../components/PageHeader';

interface EarningsPageProps {
  onOpenSettings: () => void;
}

export function EarningsPage({ onOpenSettings }: EarningsPageProps) {
  const { games, rates, categories, settings } = useData();
  const { currency } = settings;
  const season = seasonStartYear(todayISO());

  const seasonGames = useMemo(() => gamesInSeason(games, season), [games, season]);
  const summary = useMemo(() => summarize(seasonGames), [seasonGames]);
  const byCategory = useMemo(() => breakdownByCategory(seasonGames, categories), [seasonGames, categories]);
  const byMonth = useMemo(() => breakdownByMonth(seasonGames).reverse(), [seasonGames]);
  const maxCategoryTotal = Math.max(1, ...byCategory.map((c) => c.total));

  const card = 'rounded-[18px] bg-white p-5 shadow-sm';

  return (
    <>
      <PageHeader title="Earnings" onOpenSettings={onOpenSettings} />
      <div className="space-y-5 pb-6">
        <section aria-labelledby="season-title" className="rounded-[20px] bg-navy p-5 text-white shadow-sm">
          <h2 id="season-title" className="text-sm font-medium text-white/75">
            Season {seasonLabel(season)} total
          </h2>
          <p className="mt-1 text-4xl font-bold tracking-tight">{formatMoney(summary.total, currency)}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[14px] bg-highlight p-3 text-navy">
              <dt className="text-xs font-semibold">Still owed</dt>
              <dd className="text-xl font-bold">{formatMoney(summary.owed, currency)}</dd>
            </div>
            <div className="rounded-[14px] bg-white/10 p-3">
              <dt className="text-xs font-medium text-white/75">Games</dt>
              <dd className="text-xl font-bold">{summary.count}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="cat-title" className={card}>
          <h2 id="cat-title" className="text-lg font-bold text-navy">
            By category
          </h2>
          {byCategory.length === 0 ? (
            <p className="mt-2 text-muted">No games this season yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {byCategory.map((c) => (
                <li key={c.category}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-navy">{c.category}</span>
                    <span className="text-sm text-muted">
                      {c.count} {c.count === 1 ? 'game' : 'games'} ·{' '}
                      <span className="font-bold text-navy">{formatMoney(c.total, currency)}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(c.total / maxCategoryTotal) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="month-title" className={card}>
          <h2 id="month-title" className="text-lg font-bold text-navy">
            Monthly totals
          </h2>
          {byMonth.length === 0 ? (
            <p className="mt-2 text-muted">No games this season yet.</p>
          ) : (
            <table className="mt-3 w-full text-left">
              <thead>
                <tr className="text-xs text-muted uppercase">
                  <th scope="col" className="py-2 font-semibold">Month</th>
                  <th scope="col" className="py-2 text-right font-semibold">Games</th>
                  <th scope="col" className="py-2 text-right font-semibold">Owed</th>
                  <th scope="col" className="py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {byMonth.map((m) => (
                  <tr key={m.month} className="border-t border-stone-100">
                    <th scope="row" className="py-3 font-semibold text-navy">{formatShortMonth(m.month)}</th>
                    <td className="py-3 text-right text-muted">{m.count}</td>
                    <td className={`py-3 text-right ${m.owed > 0 ? 'font-semibold text-accent' : 'text-muted'}`}>
                      {formatMoney(m.owed, currency)}
                    </td>
                    <td className="py-3 text-right font-bold text-navy">{formatMoney(m.total, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section aria-labelledby="rates-title" className={card}>
          <div className="flex items-center justify-between">
            <h2 id="rates-title" className="text-lg font-bold text-navy">
              Current rates
            </h2>
            <button
              type="button"
              onClick={onOpenSettings}
              className="min-h-11 rounded-xl px-3 text-sm font-semibold text-accent hover:bg-orange-50"
            >
              Edit
            </button>
          </div>
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="text-xs text-muted uppercase">
                <th scope="col" className="py-2 font-semibold">Category</th>
                <th scope="col" className="py-2 text-right font-semibold">In town</th>
                <th scope="col" className="py-2 text-right font-semibold">Out of town</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.category} className="border-t border-stone-100">
                  <th scope="row" className="py-3 font-semibold text-navy">{r.category}</th>
                  <td className="py-3 text-right">{formatMoney(r.inTown, currency)}</td>
                  <td className="py-3 text-right">{formatMoney(r.outOfTown, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}

