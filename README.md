# Repwise

Repwise is a mobile-first, local-first workout tracking Progressive Web App. It is designed for fast set entry in the gym, clear previous-session context, reliable offline storage, and manual backups without an account or backend.

## Features

- Create, edit, archive, restore, search, and filter exercises.
- Create a custom exercise directly from the active-workout picker and add it to the current workout immediately.
- Create reusable workout templates with ordered exercises and set, repetition, and rest targets.
- Start an empty workout or a workout from a template.
- Record weight, repetitions, duration, warm-up state, and completion per set.
- Automatically start a configurable rest timer after each completed set, with a gentle sound and vibration alert when supported.
- Restore an unfinished workout after refresh or browser restart.
- Compare the current exercise with its most recent prior session.
- Finish workouts with explicit incomplete-set cleanup.
- Review workout summaries, history, notes, personal records, and progress charts.
- Switch between best weight, estimated 1RM, volume, and repetition trends.
- Store kilograms canonically while displaying kilograms or pounds.
- Use light, dark, or system appearance.
- Use English, Simplified Chinese, or automatic device-language selection.
- Follow the built-in bilingual guide for installation, daily workout recording, progress, templates, and backups.
- Preview, merge, or transactionally replace local data from a validated JSON backup.
- Install the PWA and use its core features offline after the first successful visit.

## Technology

- **React and TypeScript** provide the component UI and typed domain model.
- **Vite** provides the development server, optimized production build, and route-level code splitting.
- **React Router** uses hash routing so direct navigation works on GitHub Pages.
- **Dexie and IndexedDB** persist exercises, templates, workouts, sets, and settings locally.
- **Recharts** renders progress charts from completed workout records.
- **vite-plugin-pwa** generates the manifest and offline service worker.
- **Vitest, React Testing Library, and fake-indexeddb** test calculations, repositories, backups, and key set-entry behaviour.

## Local development

Node.js 24 and pnpm 11 are recommended.

```bash
corepack enable
pnpm install
pnpm run dev
```

The development server prints the local URL. IndexedDB data belongs to the browser profile and origin used to open that URL.

## Validation

```bash
pnpm run typecheck
pnpm run lint
pnpm run format
pnpm run test
```

## Production build

```bash
pnpm run build
pnpm run preview
```

For a project-site subpath, provide the path at build time:

```bash
BASE_PATH=/mobile-fitness-tracker/ pnpm run build
```

The GitHub Actions workflow determines this path automatically from `GITHUB_REPOSITORY`. User/organization Pages repositories ending in `.github.io` use `/`; other repositories use `/<repository-name>/`.

## Architecture

- `src/db` owns the Dexie schema, seeding, and persistence operations.
- `src/services` contains pure workout calculations, progression analysis, personal records, validation, and backup logic.
- `src/components` contains reusable layout, form, exercise, template, and workout UI.
- `src/i18n` contains the language provider, translation dictionary, and default-exercise translations.
- `src/pages` composes data queries and feature components for each route.
- `src/types` defines persisted entities and transfer formats.
- `src/styles` defines semantic design tokens and responsive component styles.

Historical workouts store their own workout-exercise and set snapshots. Editing a template or exercise library entry does not rewrite completed set history. Deleting a workout removes its related workout exercises and sets in one IndexedDB transaction but preserves exercise definitions.

## Data storage and backups

All application data is stored locally in IndexedDB. No account, cloud database, analytics service, or backend is used. Clearing browser or site data can permanently remove records, so regular exports are recommended.

Use **Settings → Export JSON** to download a complete backup. During import, Repwise validates records, IDs, timestamps, and relationships before showing add, update, conflict, invalid, and skipped counts. **Merge backup** preserves local-only records and selects the newest valid `updatedAt` value for matching IDs; equal-timestamp differences are surfaced as blocking conflicts. **Replace all** updates every table inside one transaction. Failed validation or execution leaves the current database unchanged.

The repeatable physical-device release checks are documented in [`docs/mobile-pwa-qa-checklist.md`](docs/mobile-pwa-qa-checklist.md).

## GitHub Pages deployment

The deployment workflow is `.github/workflows/deploy.yml` and runs on pushes to `main` or manual dispatch. It installs the frozen pnpm lockfile, type-checks, tests, builds, uploads the `dist` artifact, and deploys it with the official GitHub Pages actions.

1. Create a GitHub repository for this project and push the `main` branch.
2. Open the repository on GitHub.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **GitHub Actions** as the source.
5. Push to `main` or run **Deploy Repwise to GitHub Pages** manually from the Actions tab.
6. Open the URL shown by the successful `deploy` job.

For a repository named `mobile-fitness-tracker`, the project-site URL has the form `https://ACCOUNT.github.io/mobile-fitness-tracker/`. A repository named `ACCOUNT.github.io` is served from `https://ACCOUNT.github.io/`.

The production deployment is available at <https://daniel-kai-wang.github.io/repwise-fitness-tracker/>.

## Language

Repwise follows the device language by default. Open **Settings → Language** to choose **English**, **中文**, or return to automatic device-language selection. The preference is stored with the rest of the local app settings and is included in JSON backups.

## Install on iPhone

1. Open the deployed HTTPS URL in Safari.
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. Confirm the app name.
5. Open Repwise from the new home-screen icon.

## Install on Android

1. Open the deployed HTTPS URL in Chrome.
2. Open the browser menu.
3. Tap **Install app** or **Add to Home screen**.
4. Confirm the installation.

## Known limitations

- There is no cloud sync or multi-device account.
- Data belongs to one browser profile and origin.
- Browser storage clearing can remove all records.
- Backup export and cross-device transfer are manual.
- Backup conflicts with the same ID and identical `updatedAt` timestamp require source-file resolution before merge.
- Completed workouts require an explicit edit mode; edits intentionally rewrite the local historical snapshot and derived analytics.
- Rest-timer deadlines persist locally and recover after refresh or backgrounding. Sound and vibration alerts require the page or installed PWA to remain open, and vibration depends on browser and device support.
- GitHub Pages deployment requires a GitHub repository and one-time Pages source configuration.
