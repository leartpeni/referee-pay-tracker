import type { Route } from '../lib/router';
import { IconChart, IconList, IconPlus, IconSettings, IconWhistle } from './Icons';

interface NavProps {
  active: Route['name'];
  onNavigate: (to: Route) => void;
}

/** Mobile bottom bar: Games, large centred Add, Earnings. Hidden on desktop. */
export function BottomNav({ active, onNavigate }: NavProps) {
  const item = (name: 'games' | 'earnings', label: string, Icon: typeof IconList) => {
    const current = active === name;
    return (
      <button
        type="button"
        onClick={() => onNavigate({ name })}
        aria-current={current ? 'page' : undefined}
        className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
          current ? 'text-accent' : 'text-muted'
        }`}
      >
        <Icon size={24} />
        {label}
      </button>
    );
  };

  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex max-w-xl items-end px-4">
        {item('games', 'Games', IconList)}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={() => onNavigate({ name: 'add' })}
            aria-label="Add game"
            className="-mt-6 mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-orange-900/25 hover:bg-accent-dark"
          >
            <IconPlus size={30} strokeWidth={2.5} />
          </button>
        </div>
        {item('earnings', 'Earnings', IconChart)}
      </div>
    </nav>
  );
}

/** Desktop left sidebar. Hidden below 1024px. */
export function Sidebar({ active, onNavigate }: NavProps) {
  const link = (name: 'games' | 'earnings' | 'settings', label: string, Icon: typeof IconList) => {
    const current = active === name;
    return (
      <li>
        <button
          type="button"
          onClick={() => onNavigate({ name })}
          aria-current={current ? 'page' : undefined}
          className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-4 font-semibold ${
            current ? 'bg-white/12 text-white' : 'text-white/75 hover:bg-white/8 hover:text-white'
          }`}
        >
          <Icon size={22} />
          {label}
        </button>
      </li>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-navy p-5 text-white lg:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
          <IconWhistle size={22} />
        </span>
        <span className="text-lg leading-tight font-bold">Referee Pay Tracker</span>
      </div>
      <button
        type="button"
        onClick={() => onNavigate({ name: 'add' })}
        className="mb-6 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent font-semibold hover:bg-accent-dark"
      >
        <IconPlus size={20} strokeWidth={2.5} />
        Add game
      </button>
      <nav aria-label="Main">
        <ul className="space-y-1">
          {link('games', 'Games', IconList)}
          {link('earnings', 'Earnings', IconChart)}
          {link('settings', 'Settings', IconSettings)}
        </ul>
      </nav>
    </aside>
  );
}

