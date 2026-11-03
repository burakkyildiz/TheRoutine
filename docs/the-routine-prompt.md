# Project: The Routine

Build a minimal, modern, responsive daily routine tracker called **The Routine**.

This is a personal application intended for a single user. It should be extremely simple, visually appealing, fast, and distraction-free.

## 1. Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Lucide React for icons
- LocalStorage for data persistence
- Vercel for deployment

Avoid unnecessary dependencies, backend services, and overengineering.

## 2. Design & Theme

Create a premium, minimalist interface inspired by modern productivity applications.

**Visual direction:**
- Dark mode by default.
- Near-black background (#0D0D0D).
- Off-white typography.
- Subtle gray borders and muted secondary text.
- Clean, modern typography (Geist or Inter).
- Generous whitespace.
- Smooth, subtle animations.
- Minimal icons.
- Rounded corners, but not overly rounded.
- Mobile-first responsive design.

The interface should feel calm, elegant, and focused.

Avoid colorful dashboards, unnecessary cards, gradients, and excessive visual effects.

## 3. Main Screen

Display the application name prominently:

**the routine.**

Underneath, display the current date and a subtle subtitle such as:

*show up. every day.*

Display the default routine items vertically:

1. pray
2. train
3. eat
4. study
5. sleep
6. repeat

Each item should have a checkbox or a custom circular completion indicator on the left.

Clicking an item should mark it as completed.

Completed items should:
- Display a checked indicator.
- Have slightly faded text with a subtle strikethrough.
- Animate smoothly when toggled.
- Remain in their original positions.

Clicking an already completed item should undo its completion.

Include a minimal daily progress indicator, such as `3 / 6 completed`, along with a thin progress bar.

## 4. Routine Management (CRUD)

The user must be able to:

- Add new routine items.
- Edit existing item names.
- Delete existing items.
- Mark items as completed or incomplete.

Keep the editing interface minimal.

Use a small `+ add routine` control below the list.

Editing and deleting should be accessible through a subtle menu or icon next to each item.

Routine items must maintain a consistent order.

All modifications must persist after refreshing the page.

## 5. Daily Reset Logic

This is a critical feature.

**Every new day, routine completion states must reset automatically.**

Requirements:

- All checkboxes become unchecked when the local calendar date changes.
- Routine item names and their order must remain unchanged.
- Custom additions, edits, and deletions must persist.
- Do not require the user to manually reset anything.
- Reset must work even if the user has not opened the application for several days.
- If the application remains open across midnight, the UI should update automatically.
- Use the browser's local calendar date, not UTC, to determine the day.

Implement this reliably using LocalStorage and date comparison.

There is no need for a backend cron job.

## 6. Data Persistence

Use LocalStorage.

Persist:
- Routine items with stable unique IDs.
- Routine item order.
- Daily completion states.
- Last active date, if needed for reset logic.

Default routine items should only be initialized when no saved routine exists.

Do not overwrite existing user data on refresh or deployment.

Handle invalid or missing LocalStorage data gracefully.

## 7. User Experience

- Responsive on desktop, tablet, and mobile.
- Large enough touch targets on mobile.
- Accessible buttons and keyboard interactions.
- Smooth checkbox transitions.
- Clean empty state when all items are removed.
- Minimal confirmation for destructive actions.
- No unnecessary pages or navigation.

The entire application should primarily live on a single screen.

## 8. Authentication

This is a personal, single-user MVP.

Do not implement registration, user profiles, or authentication.

No database is required for the first version.

LocalStorage-based data is sufficient. Note in the README that data is device/browser-specific and does not automatically sync across devices.

## 9. Code Quality

- Use clean, maintainable TypeScript.
- Split components logically without overengineering.
- Create reusable components where appropriate.
- Avoid unnecessary state management libraries.
- Ensure LocalStorage access is safe with Next.js client-side rendering.
- Avoid hydration errors.
- Keep the project structure simple and understandable.
- Follow common Next.js and React best practices.

## 10. Deployment

Make the application ready for Vercel deployment.

- Ensure the production build succeeds.
- No required environment variables for the MVP.
- Add a concise README with local development and Vercel deployment instructions.
- Include a brief explanation of the daily reset implementation.

## 11. Final Expectations

Implement a fully functional application, not just a visual mockup.

Verify:
- Tasks can be completed and unchecked.
- Tasks can be added, edited, and deleted.
- Changes persist after reload.
- Completion states reset on the next calendar day.
- Custom routine items remain after daily reset.
- The UI works on mobile.
- The production build succeeds.

**Design philosophy:**

Less is more.

The Routine should feel like a beautifully designed personal discipline tracker, not a complex task management application.

The goal is simple:

**open → complete routine → come back tomorrow → repeat.**
