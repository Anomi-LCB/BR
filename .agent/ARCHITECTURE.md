# Architecture

- **Project:** Bible 365 (Divine Light)
- **Stack:** Next.js 16.1.1, Tailwind CSS, Zustand, IndexedDB
- **Data Source:** Local JSON (`public/data/bible-krv.json`) fetched via `BibleService` (offline-first).
- **Key Components:**
  - `BibleDashboard.tsx` (Main UI Hub)
  - `FullReadingView.tsx` (Standalone Bible Text Viewer)
  - `BibleCard.tsx` (Daily Reading Card)
  - `BibleSearchTab.tsx` (Search UI)
  - `BibleService.ts` (Data fetching & IndexedDB caching)
