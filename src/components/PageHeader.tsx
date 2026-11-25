import type { ReactNode } from 'react';
import { IconSettings } from './Icons';

interface PageHeaderProps {
  title: ReactNode;
  /** Shown on mobile only (desktop uses the sidebar). */
  onOpenSettings?: () => void;
  children?: ReactNode;
}

export function PageHeader({ title, onOpenSettings, children }: PageHeaderProps) {
  return (
    <header className="pt-safe sticky top-0 z-10 bg-paper/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-2 py-2">
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-navy hover:bg-stone-200 lg:hidden"
          >
            <IconSettings />
          </button>
        )}
      </div>
      {children}
    </header>
  );
}

