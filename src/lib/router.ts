import { useCallback, useEffect, useState } from 'react';

export type Route =
  | { name: 'games' }
  | { name: 'earnings' }
  | { name: 'settings' }
  | { name: 'add' }
  | { name: 'edit'; id: string };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '');
  const [first, second] = path.split('/');
  switch (first) {
    case 'earnings':
      return { name: 'earnings' };
    case 'settings':
      return { name: 'settings' };
    case 'add':
      return { name: 'add' };
    case 'edit':
      return second ? { name: 'edit', id: decodeURIComponent(second) } : { name: 'games' };
    default:
      return { name: 'games' };
  }
}

export function routeToHash(route: Route): string {
  return route.name === 'edit' ? `#/edit/${encodeURIComponent(route.id)}` : `#/${route.name}`;
}

/** Minimal hash router: works offline and on static hosts (GitHub Pages) without server rewrites. */
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to: Route, options?: { replace?: boolean }) => {
    if (options?.replace) window.location.replace(routeToHash(to));
    else window.location.hash = routeToHash(to);
  }, []);

  return { route, navigate };
}


