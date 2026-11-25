import { useCallback, useEffect, useRef, useState } from 'react';
import { useData } from './state/DataContext';
import { useHashRoute, type Route } from './lib/router';
import { monthKey, todayISO } from './lib/dates';
import { BottomNav, Sidebar } from './components/Navigation';
import { Dialog } from './components/Dialog';
import { GamesPage } from './pages/GamesPage';
import { GameForm } from './pages/GameForm';
import { EarningsPage } from './pages/EarningsPage';
import { SettingsPage } from './pages/SettingsPage';

type PageName = 'games' | 'earnings' | 'settings';

export default function App() {
  const { loading, error, games } = useData();
  const { route, navigate } = useHashRoute();
  const [month, setMonth] = useState(() => monthKey(todayISO()));

  // Page shown behind the add/edit panel.
  const lastPage = useRef<PageName>('games');
  if (route.name === 'games' || route.name === 'earnings' || route.name === 'settings') lastPage.current = route.name;
  const page: PageName = lastPage.current;

  // Whether the editor was opened from inside the app (so closing can go "back").
  const openedInApp = useRef(false);

  const go = useCallback(
    (to: Route) => {
      openedInApp.current = to.name === 'add' || to.name === 'edit';
      navigate(to);
    },
    [navigate],
  );

  const closeEditor = useCallback(() => {
    if (openedInApp.current) {
      openedInApp.current = false;
      window.history.back();
    } else {
      navigate({ name: lastPage.current });
    }
  }, [navigate]);

  const editingGame = route.name === 'edit' ? games.find((g) => g.id === route.id) : undefined;
  const editorOpen = route.name === 'add' || (route.name === 'edit' && !!editingGame);

  // After saving a new game, show the month it belongs to.
  const onEditorDone = useCallback(
    (date?: string) => {
      if (date) setMonth(monthKey(date));
      closeEditor();
    },
    [closeEditor],
  );

  // Unknown game id (e.g. deleted): fall back to the list.
  useEffect(() => {
    if (!loading && route.name === 'edit' && !editingGame) {
      openedInApp.current = false;
      navigate({ name: lastPage.current }, { replace: true });
    }
  }, [loading, route, editingGame, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted" role="status">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md p-6" role="alert">
        <h1 className="text-xl font-bold text-navy">Storage unavailable</h1>
        <p className="mt-2 text-muted">
          The app could not open its local database ({error}). Private browsing modes may block storage.
        </p>
      </div>
    );
  }

  const openSettings = () => go({ name: 'settings' });

  return (
    <div className="min-h-dvh">
      <button
        type="button"
        onClick={() => document.getElementById('main')?.focus()}
        className="sr-only z-50 rounded-xl bg-navy px-4 py-3 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </button>
      <Sidebar active={editorOpen ? route.name : page} onNavigate={go} />

      <div className="lg:pl-64">
        <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-4 pb-32 outline-none lg:px-8 lg:pb-10">
          {page === 'games' && (
            <GamesPage
              month={month}
              onMonthChange={setMonth}
              onAdd={() => go({ name: 'add' })}
              onEdit={(id) => go({ name: 'edit', id })}
              onOpenSettings={openSettings}
            />
          )}
          {page === 'earnings' && <EarningsPage onOpenSettings={openSettings} />}
          {page === 'settings' && <SettingsPage />}
        </main>
      </div>

      <BottomNav active={editorOpen ? route.name : page} onNavigate={go} />

      {editorOpen && (
        <Dialog
          labelledBy="game-form-title"
          onClose={closeEditor}
          closeOnBackdrop={false}
          className="fixed inset-0 m-0 h-full max-h-full w-full max-w-full bg-paper p-0 text-ink lg:mr-0 lg:ml-auto lg:w-[460px] lg:max-w-[460px] lg:shadow-2xl"
        >
          <GameForm
            key={route.name === 'edit' ? route.id : 'new'}
            game={editingGame}
            titleId="game-form-title"
            onDone={onEditorDone}
            onCancel={closeEditor}
          />
        </Dialog>
      )}
    </div>
  );
}




