# Verification — 3 November 2026

## Automated checks

- `npm test`: 16 passing tests covering CRUD persistence, stable IDs/order, same-day reload, midnight while open, several days away, local versus UTC dates, DST, focus after sleep, edits after midnight, empty saved lists, invalid storage, failed writes/retry, and cross-tab updates.
- `npm run typecheck`: passed.
- `npm run build`: passed with the configured Webpack builder; `/` is statically prerendered.
- Dependency installation audit: no known vulnerabilities reported.

The initial Turbopack build encountered a local process/port permission error. The standard build script now uses `next build --webpack` and passes.

## Browser checks

Tested the local Next.js application in the in-app browser:

- Completed two routines, reloaded, and confirmed both remained checked.
- Unchecked a completed routine and confirmed the progress updated.
- Added a custom routine, edited its name, reloaded, and confirmed the edited name persisted in its original position.
- Removed the custom test routine through the confirmation dialog; confirmed removal after reload.
- Checked the production output using `npm start`.
- Checked the mobile layout with a 390 × 844 viewport; no horizontal overflow. Opened the add dialog and verified the input and controls fit.
- Production browser console: no captured warnings or errors.

Midnight, sleep, malformed storage, write failure, and cross-tab scenarios use controlled clock/storage tests rather than changing the operating system clock or real browser data. Mobile checks use a browser viewport, not a physical handset.

## Review

Reviewed the client storage → validation → mutation → persistence → rendering flow, calendar reset scheduling, native dialog controls, keyboard actions, and React hydration behavior using the security/user-impact and React review skills. No verified findings remain in the reviewed scope. User-entered names render as React text. The application has no authentication, server writes, external API calls, or analytics.

LocalStorage remains browser/device/origin-specific and is not transactional across simultaneous tabs. A last-write-wins limitation is documented in the README. These checks preceded the Vercel release. See [AGENTS.md](../AGENTS.md) for the live URL and deployment record.
