# Referee Pay Tracker

An offline-first Progressive Web App for a basketball referee to log the games they referee and track payments.
Everything is stored on the device (IndexedDB). There is no backend and no account.

- React + TypeScript + Vite
- Tailwind CSS v4
- IndexedDB via [`idb`](https://github.com/jakearchibald/idb)
- `vite-plugin-pwa` (manifest + Workbox service worker, works offline)
- Vitest for unit tests

## Requirements

- Node.js 22.12 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). To try it on your phone on the same Wi-Fi, run
`npm run dev -- --host` and open the "Network" URL.

## Test

```bash
npm test          # run once
npm run test:watch
```

Tests cover the fee calculation (`src/lib/fees.test.ts`), monthly / season / category summaries
(`src/lib/summary.test.ts`), CSV/JSON export-import (`src/lib/exportImport.test.ts`) and the IndexedDB layer
(`src/db/db.test.ts`, using `fake-indexeddb`).

## Build

```bash
npm run build     # type-check + production build into dist/
npm run preview   # serve dist/ locally to test the service worker and install prompt
```

The service worker is only active in the production build (`build` + `preview`), not in `npm run dev`.

## Deploy (free hosting)

The app is a static site: deploy the `dist/` folder anywhere. It uses hash URLs (`#/earnings`),
so no server rewrite rules are needed.

### Netlify

1. Push the repository to GitHub.
2. In Netlify: **Add new site > Import an existing project**, pick the repo.
3. Build command: `npm run build`, publish directory: `dist`.

Or drag and drop the `dist/` folder onto https://app.netlify.com/drop.

### GitHub Pages

The site is served from a sub-path (`https://<user>.github.io/<repo>/`), so build with `BASE_PATH`:

```bash
# PowerShell
$env:BASE_PATH="/referee-pay-tracker/"; npm run build
# bash
BASE_PATH=/referee-pay-tracker/ npm run build
```

Then publish `dist/`, e.g. with a GitHub Actions workflow (`.github/workflows/pages.yml`):

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          BASE_PATH: /${{ github.event.repository.name }}/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

In the repository settings, set **Pages > Source** to **GitHub Actions**.

## Install on a phone

The site must be served over HTTPS (Netlify and GitHub Pages both are).

- **Android (Chrome):** open the site, tap the menu (three dots) > **Install app** / **Add to Home screen**.
- **iPhone / iPad (Safari):** open the site, tap **Share** > **Add to Home Screen**.
- **Desktop (Chrome / Edge):** click the install icon in the address bar.

After the first visit the app works fully offline. Updates are downloaded automatically the next time you open it
while online.

**Back up your data:** data lives only in this browser on this device. Use **Settings > Export JSON** regularly
and **Import JSON** to restore on a new phone. Uninstalling the app or clearing site data deletes it.

## How fees work

- Rates are stored in the `rates` table in IndexedDB as `category -> { inTown, outOfTown }` and are edited in
  **Settings**. Defaults: U12/U14/U16 €30 in town / €40 out of town, U18 €35 / €45.
- When a game is saved, the fee is calculated from its category and location and **stored on the game**.
  Changing rates later never changes past games.
- Editing a past game keeps its stored fee unless you change its category or location (then the current rate is
  used).
- Each game can use a custom amount instead of the rate ("Use a custom amount" on the add/edit form).
- The season used on the Earnings screen runs September to August.

## Project structure

```
src/
  components/   Reusable UI (navigation, dialogs, game row, summary card, icons, controls)
  pages/        Screens: Games, GameForm (add/edit), Earnings, Settings
  db/           IndexedDB schema and data access (idb)
  lib/          Pure logic: fees, summaries, dates, formatting, export/import, router
  state/        React context that loads data from IndexedDB and exposes actions
  types/        Shared TypeScript types
public/         Icons (regenerate PNGs from favicon.svg with `npm run generate-pwa-assets`)
```


