# Changelog

All notable changes to this plugin are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[semantic versioning](https://semver.org/).

## [1.1.0] — 2026-11-25

### Added

- **The model can schedule from any session.** `calendar_add` writes events and
  `calendar_list` reads them, both registered in the global tool layer so every
  agent inherits them. No need to open the panel to record something.
- **Every write asks first.** A `tools/pre-execute` listener returns `ask` for
  `calendar_add`, so the call pauses at DSH's approval prompt — showing the
  event titles and times — and a refusal writes nothing. The tool description
  also tells the model to agree the events in conversation first.
- **The panel follows chat-side writes.** `state.rev` is a cheap revision stamp;
  the calendar polls it and reloads when a tool has changed the document.

### Fixed

- `calendar_add` and `calendar_list` never appeared, although the plugin claimed
  to register them. Two causes, both now covered by tests: the definitions were
  authored in the tool DSL while the registry takes raw JSON Schema (so
  registration threw and the error was swallowed), and a failed registration was
  invisible. Registration failures are now logged, success is logged with the
  tool names, and `tests/tools.mjs` checks the compiled schemas against the
  registry's accepted subset.

### Notes

- The tools need the profile's approval service (`@deepseek-ai/dsh-user-approval`,
  mounted by the shipped profiles). Without it, `calendar_add` fails closed with
  `APPROVAL_UNAVAILABLE` rather than writing silently.

## [1.0.0] — 2026-11-24

First release.

### Added

- **Calendar** — month grid, week columns and a single-day agenda; create, edit,
  delete and tick events; six-colour palette; several lead times per event.
- **Repeats** — daily, weekdays, chosen weekdays, every two weeks and monthly,
  each with an optional end date. The expansion lives in one module so the
  calendar view and the reminder scanner can never disagree.
- **Reminders** — a 15-second host-side scan, one notice per lead time, an
  in-app card with *Done* and *5 / 10 minutes* snooze, a WebAudio chime, an
  operating-system notification where the environment grants one, quiet hours,
  and a replay of up to five reminders that came due while the app was closed.
  Fired and suppressed keys persist, so a restart never repeats a reminder.
- **Timetable** (optional, switchable) — term week count, bell times per period,
  odd/even week parity, and three ways in: paste text for the model to parse,
  import a CSV, or fill the grid by hand. Kept independent of the calendar on
  purpose.
- **Long-term planning** — a goal with milestones, deadlines and priority;
  progress is derived from the milestones and the plan completes itself.
- **One-sentence scheduling** — a quick-add box that turns a sentence into
  candidate events for confirmation, plus the `calendar_add` and `calendar_list`
  tools for the chat, registered best-effort.
- **Data** — one document under `$DSH_HOME/storages/dsh-schedule-calendar/`,
  written atomically, shared across workspaces; ICS export and import with RRULE
  round-tripping, and a complete JSON backup and restore.
- **Chinese and English UI** that follows the DSH locale service and switches
  without a page reload.

### Fixed

- The panel rendered in English on a Chinese desktop, because the interface read
  `document.documentElement.lang` and `navigator.language` instead of the DSH
  locale. It now injects the locale service.

### Notes

- `npm run doctor` walks the install chain and prints one PASS/FAIL line per
  step: profile manifest, bundle list, resolution, build freshness and mount
  evidence.
- The host half is a plain cordis function plugin with no framework imports; the
  browser half resolves React through the shell's frozen module table.