# MADAR (مدار)

A bilingual (English & Arabic RTL) daily productivity web app: **Task Manager + Pomodoro Timer + Habit Tracker** in one place — zero backend, zero build step.

## Live Demo

- **Live Page**: [https://kareeem7.github.io/madar--/](https://kareeem7.github.io/madar--/)

## Running Locally

- **Direct (`file://`)**: Open `index.html` directly in your browser — works completely out of the box.
- **Static Server** (required for PWA installation and Service Worker offline support): Serve the folder with any static server, for example:
  ```bash
  npx serve .
  # or
  python -m http.server 8080
  ```

## File Structure

```text
index.html            App shell — sidebar + top bar + <main id="view"> + scripts
manifest.webmanifest  PWA manifest
sw.js                 Service Worker (cache-first, full offline support)
css/
  tokens.css          Design tokens (light/dark themes, comfort/compact density)
  base.css            Reset + layout shell + components (buttons, modals, toasts, command palette)
  views.css           Per-view styles
js/
  util.js             General utilities + local date helpers + AR/EN i18n dictionary
  store.js            Central state store + persistence + migration + IndexedDB + seed data
  ui.js               Toast / Modal (focus trap) / Menu / Drag-and-drop via Pointer Events
  tasks.js            Natural-language quick-add parser + task logic + Undo + recurrence
  pomodoro.js         Timer engine (endsAt-based) + Web Audio ambient sound synthesizer
  habits.js           Habit logic + streaks + daily logs + notes
  commands.js         Quick Add + Command Palette (Ctrl+K) + keyboard shortcuts
  app.js              Router + navigation + theme/language controller + Onboarding + bootstrap
  views/              today / tasks / board / calendar / focus / habits / stats / notes / settings
```

## Architecture Overview

- **Single Store** (`S` in `js/store.js`) using a `subscribe(fn)` + `emit(scope)` pattern. Every change flows through `emit` → debounced save (`300ms`) to `madar:state` in `localStorage` → listeners re-render only the active screen (skipping re-renders while typing in an input or when a modal is open).
- **Router**: Hash-based in `js/app.js` — `ROUTES = {key: {fn, n, i}}` table, where `refreshView()` executes the view function and updates navigation state and page title.
- **Classic Scripts**: Loaded manually in order at the end of `<body>` (runs cleanly from `file://` without ES module/CORS issues). Each file defines global functions in order: `util` → `store` → `ui` → domain → `views` → `commands` → `app`.
- **Data & Storage**: `localStorage` for state and settings, `IndexedDB` (`madar-db/sessions`) for focus session history, automatic weekly backups (`madar:backup:{date}`), and cross-tab sync via the `storage` event.

## How to Add a New View

1. Create `js/views/myview.js` with a `renderMyView()` function that renders into `$('#view')`.
2. Register it in `ROUTES` inside `js/app.js`: `myview: {fn: renderMyView, n: () => t('myview'), i: 'bi-icon'}`.
3. Add its translation key to `I18N` in `js/util.js`, include its `<script>` tag in `index.html`, and add it to `ASSETS` in `sw.js`.
4. Have it listen for state updates via the appropriate scope names in `RERENDER`.

## How to Add a Task Field

1. Add it to `newTaskObj` in `js/tasks.js` with a default value.
2. Add safe initialization in `migrate()` inside `js/store.js` (to preserve existing users' data).
3. Display or edit it in `taskRow()` (`js/views/today.js`) and `openTaskEditor()` (`js/views/tasks.js`).

## Future Cloud Sync (Supabase — Conceptual)

- A `profiles(state jsonb, updated_at)` table to sync `S` as a unit, and a `sessions(id, task_id, type, started_at, ...)` table for focus session history.
- **Strategy**: Local-first — the app writes locally first, then runs a debounced upsert (`push`), and pulls on reconnect with Last-Write-Wins conflict resolution per item based on `updatedAt`. Realtime subscriptions replace cross-tab `storage` events across devices.

## Migration — Preserving User Data

`migrate()` starts from `emptyState()` and merges saved state on top (per-level spread), automatically populating newly added fields while protecting required arrays and objects. Bump `version` on schema changes and write the migration logic inside `migrate()` based on `s.version`.

## Next Steps — Top 5 Improvements

1. Cloud sync (Supabase) + optional user sign-in.
2. Google Calendar integration (import meetings as blocks on the day timeline).
3. Home screen widgets (today's rings + quick focus button).
4. Gradual natural reminder sounds scaled by priority.
5. AI integration to automatically split large tasks into subtasks.

## Note on React

The project intentionally uses Vanilla JS + Bootstrap (CSS/Icons) only: React requires a build step (Vite/npm), which breaks the "opens from `file://`" requirement and the "no external JS libraries" rule. If React is needed later, migrate each `render*` function into a component and the Store into Zustand/Reducer using the same scope names — the contracts are already ready.
