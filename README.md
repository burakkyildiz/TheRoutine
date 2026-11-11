# the routine.

A minimal daily discipline tracker. Next.js App Router, TypeScript, Tailwind CSS, Lucide icons, and locally bundled Geist. No account, backend, analytics, or required environment variables.

## Run locally

Requires Node.js 22.18+ (Node 24 LTS recommended) and npm.

```sh
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

```sh
npm test           # Date, reset, and saved-data validation tests
npm run typecheck  # TypeScript checks
npm run build     # Production build
npm start         # Serve the production build
```

The production script uses Next.js's supported Webpack builder. This avoids a Turbopack child-process/port restriction encountered in the local execution environment.

## Your daily routine

Click a routine to complete or uncheck it. Use its three-dot button to edit or remove it; removal asks for confirmation. Add routines with **+ add routine**. Names, order, and completion states are saved immediately to LocalStorage under `the-routine:v1`. Removing every item leaves an empty list, including after a reload.

**Data is specific to this browser, device, and website origin. It does not automatically sync across devices.** Clearing browser/site data removes saved routines. Private browsing may clear data when the session ends. If storage is blocked or full, the app keeps working in memory and shows a warning with a retry action. If saved data is malformed, it is retained under `the-routine:v1:recovery` before replacement.

Open tabs receive browser storage events. Mutations read the latest saved state to reduce stale-tab overwrites. LocalStorage is not transactional: truly simultaneous changes in different tabs can still use last-write-wins behavior.

## Daily reset

The saved document contains a version, a local `YYYY-MM-DD` date, and ordered items with stable IDs. On load, if the saved date differs from the browser's local date, only completion flags are cleared. Custom names, IDs, order, and deletions remain intact, even after several days away.

While open, the app schedules a check at local midnight and at least every minute to account for clock/timezone changes. Focus, page restoration, and visibility events catch up after device sleep or background-tab throttling. Every edit also checks the date first. Calendar components use local time rather than `toISOString()` / UTC; the next midnight is calculated with calendar arithmetic to accommodate daylight-saving changes.

Server rendering and initial hydration use the same loading state. LocalStorage is read only on the client. The date is also formatted on the client, avoiding server/client timezone mismatches.

## Consistency chain

Choose a 7, 14, 30, or 60-day goal, or select **∞** for an open-ended chain. A day adds a link only when every routine is completed. The link appears immediately in the interface; at the next local calendar day, the result is written into the local chain history. Missed days are recorded too, so the app can show the current and best streak without erasing the routine itself.

The first release of this feature is browser-local and does not send notifications. Mobile reminders will be added with the native mobile app.

## Deploy to Vercel

1. Push this directory to a Git repository.
2. Import that repository in Vercel and select the **Next.js** framework preset.
3. Keep the default install/build settings (`npm install`, `npm run build`). No environment variables are needed.
4. Deploy.

Alternatively, run `npx vercel` from this directory, then `npx vercel --prod` when ready. A stable production URL retains this browser's data across deployments. Preview URLs and different custom domains have separate storage.

## Structure

- `app/`: page, layout, and responsive styles.
- `components/`: tracker, routine row, and native accessible dialog.
- `lib/routine.ts`: data types, validation, calendar logic, and chain history.
- `lib/routine-store.ts`: browser persistence, reset scheduling, and cross-tab updates.
- `tests/`: focused regression tests for persistence and reset invariants.
- `docs/the-routine-prompt.md`: original project brief.
