# Architecture

- **Project:** Bible 365 (Divine Light)
- **Stack:** Next.js 16.1.1 (Webpack used for build), Tailwind CSS, Zustand, IndexedDB
- **Data Source:** Local JSON (`public/data/bible-krv.json`) fetched via `BibleService` (offline-first).
- **Build Strategy:** Static Export (`output: export`) for GitHub Pages deployment.
- **Key Components:**
  - `BibleDashboard.tsx` (Main UI Hub)
  - `FullReadingView.tsx` (Standalone Bible Text Viewer)
  - `BibleCard.tsx` (Daily Reading Card)
  - `BibleSearchTab.tsx` (Search UI)
  - `BibleService.ts` (Data fetching & IndexedDB caching)
- **Constraints:**
  - As project path contains Korean characters, **Turbopack build panics**. Must use `--webpack` for production builds.
  - Due to `output: export`, all API routes must have `export const dynamic = 'force-static'`.
