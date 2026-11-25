import type { Summary } from '../types';
import { formatMoney } from '../lib/format';

interface SummaryCardProps {
  label: string;
  summary: Summary;
  currency: string;
}

/** Navy card with total earned, paid, still owed (orange highlight) and number of games. */
export function SummaryCard({ label, summary, currency }: SummaryCardProps) {
  return (
    <section aria-label={label} className="rounded-[20px] bg-navy p-5 text-white shadow-sm">
      <p className="text-sm font-medium text-white/75">{label}</p>
      <p className="mt-1 text-4xl font-bold tracking-tight">{formatMoney(summary.total, currency)}</p>
      <p className="mt-1 text-sm text-white/75">
        {summary.count} {summary.count === 1 ? 'game' : 'games'}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[14px] bg-white/10 p-3">
          <dt className="text-xs font-medium text-white/75">Paid</dt>
          <dd className="text-xl font-bold">{formatMoney(summary.paid, currency)}</dd>
        </div>
        <div className="rounded-[14px] bg-highlight p-3 text-navy">
          <dt className="text-xs font-semibold">Still owed</dt>
          <dd className="text-xl font-bold">{formatMoney(summary.owed, currency)}</dd>
        </div>
      </dl>
    </section>
  );
}

