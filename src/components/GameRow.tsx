import { useRef, useState, type PointerEvent } from 'react';
import type { Game } from '../types';
import { formatDate } from '../lib/dates';
import { formatMoney, locationLabel } from '../lib/format';
import { CategoryBadge, PaidTag } from './Badges';
import { IconCheck, IconTrash, IconUndo } from './Icons';

interface GameRowProps {
  game: Game;
  currency: string;
  onOpen: () => void;
  onTogglePaid: () => void;
  onDelete: () => void;
}

const THRESHOLD = 80;

/**
 * A game in the list.
 * - Tap the row to edit.
 * - The check button toggles paid/unpaid.
 * - On touch screens: swipe right toggles paid, swipe left asks to delete.
 */
export function GameRow({ game, currency, onOpen, onTogglePaid, onDelete }: GameRowProps) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const horizontal = useRef(false);
  const suppressClick = useRef(false);

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    horizontal.current = false;
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (!horizontal.current) {
      if (Math.abs(my) > 10 && Math.abs(my) > Math.abs(mx)) {
        start.current = null; // vertical scroll, give up
        return;
      }
      if (Math.abs(mx) > 10) {
        horizontal.current = true;
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    }
    if (horizontal.current) setDx(Math.max(-140, Math.min(140, mx)));
  };

  const finish = () => {
    if (horizontal.current) {
      // Ignore the click the browser may fire right after a swipe.
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 100);
      if (dx > THRESHOLD) onTogglePaid();
      else if (dx < -THRESHOLD) onDelete();
    }
    start.current = null;
    horizontal.current = false;
    setDragging(false);
    setDx(0);
  };

  const clickGuard = (fn: () => void) => () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    fn();
  };

  const teams = game.teams?.trim();

  return (
    <li className="relative overflow-hidden rounded-[16px]">
      {/* Swipe backgrounds */}
      <div aria-hidden="true" className="absolute inset-0 flex">
        <div
          className={`flex flex-1 items-center gap-2 pl-5 font-semibold text-white ${game.paid ? 'bg-orange-700' : 'bg-emerald-700'}`}
          style={{ opacity: dx > 0 ? 1 : 0 }}
        >
          {game.paid ? <IconUndo size={20} /> : <IconCheck size={20} />}
          {game.paid ? 'Mark unpaid' : 'Mark paid'}
        </div>
        <div
          className="absolute inset-0 flex items-center justify-end gap-2 bg-red-700 pr-5 font-semibold text-white"
          style={{ opacity: dx < 0 ? 1 : 0 }}
        >
          Delete
          <IconTrash size={20} />
        </div>
      </div>

      <div
        className={`relative flex items-stretch bg-white shadow-sm ${dragging ? '' : 'transition-transform duration-200'}`}
        style={{ transform: `translateX(${dx}px)`, touchAction: 'pan-y' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
      >
        <button
          type="button"
          onClick={clickGuard(onOpen)}
          className="flex min-h-[72px] min-w-0 flex-1 items-center gap-3 rounded-l-[16px] py-3 pl-3 text-left"
          aria-label={`Edit ${game.category} game on ${formatDate(game.date)}, ${formatMoney(game.fee, currency)}, ${game.paid ? 'paid' : 'unpaid'}`}
        >
          <CategoryBadge category={game.category} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="font-semibold text-navy">{formatDate(game.date)}</span>
              <span className="text-sm text-muted">· {locationLabel(game.location)}</span>
            </span>
            {teams ? (
              <span className="block truncate text-sm text-muted">{teams}</span>
            ) : (
              <span className="block text-sm text-stone-400">No teams entered</span>
            )}
          </span>
          <span className="flex flex-col items-end gap-1">
            <span className="font-bold text-navy">{formatMoney(game.fee, currency)}</span>
            <PaidTag paid={game.paid} />
          </span>
        </button>
        <button
          type="button"
          onClick={clickGuard(onTogglePaid)}
          aria-label={game.paid ? 'Mark as unpaid' : 'Mark as paid'}
          aria-pressed={game.paid}
          className="flex w-14 shrink-0 items-center justify-center rounded-r-[16px]"
        >
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
              game.paid ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-stone-300 text-stone-400 hover:border-emerald-600 hover:text-emerald-700'
            }`}
          >
            <IconCheck size={20} strokeWidth={3} />
          </span>
        </button>
      </div>
    </li>
  );
}


