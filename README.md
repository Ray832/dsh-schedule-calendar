# dsh-schedule-calendar

Calendar, reminders, class timetable and long-term planning for [DeepSeek Harness](https://deepseek.com) — plus one-sentence scheduling through the DSH model.

中文说明见 [README.zh.md](./README.zh.md).

## What it does

| Surface | Left sidebar panel **日程** with three tabs |
|---|---|
| **Calendar** | Month grid, week columns and a day agenda; create, edit, delete and tick events; repeats (daily, weekdays, weekly, every two weeks, monthly) |
| **Reminders** | In-app overlay, operating-system notification and a sound at the lead time you pick; snooze from the popup |
| **Timetable** (optional) | Term weeks, period bell times, odd/even week parity, and three ways in: paste text for the model to parse, fill the grid by hand, or import a CSV export from a teaching system |
| **Long-term plan** | A goal broken into milestones with due dates and progress |
| **One sentence** | Ask the model in chat (“明天下午三点组会，提前十分钟提醒”), or type into the panel's quick box without leaving the calendar |

Data lives in one document under `$DSH_HOME/storages/dsh-schedule-calendar/calendar.json`, shared across workspaces, and can be exported as ICS or a JSON backup.

The interface ships in Chinese and English and follows the DSH page language.

## Install

```bash
dsh plugin --profile <name> add dsh-schedule-calendar
```

Or from the GUI: **Settings → Plugins → install**, then enable the bundle.

Requires DSH `>=0.2.1-rc.3 <0.3.0`.

### After installing into a running desktop app

The bundle list is read at boot, so a freshly installed plugin appears only after
the desktop app restarts (or after the plugin manager enables the bundle). While
the app is running it holds the profile's write lock, which is why the CLI cannot
install into it — use the in-app **Settings → Plugins** page instead.

If the plugin does not appear, check that
`<DSH_HOME>/storages/dsh-schedule-calendar/` was created after startup: the host
half creates that directory when it mounts, so its absence means the entry never
loaded.

### Chat tools

`calendar_add` and `calendar_list` are registered best-effort: a composition
whose presets do not expose a tool registry to host-level plugins simply skips
them, and the panel's quick-add box keeps working with no loss of function.

## Configuration

No configuration is required. The plugin writes its own defaults on first run; settings (timetable on/off, quiet hours, default lead time, notification channel) are edited inside the plugin's own page.

## How it talks to DSH

- **Host half** (`lib/index.js`): a plain cordis function plugin. It owns the document and serves one JSON route family, `/api/dsh-calendar/*`, fenced by `ctx.connection.requestRejection`, so nothing outside the app's own origin can read or write your calendar.
- **Browser half** (`lib/client.js`): registers into `sidebar.panellist` and the keyed `main` slot; it resolves `react` through DSH's frozen module table and ships no third-party runtime.

The two halves share no session state: removing the plugin leaves all existing sessions untouched, and the calendar document is never mixed into conversation history.

## Development

```bash
npm install
npm run build      # esbuild -> lib/index.js + lib/client.js
npm run typecheck
node tests/smoke.mjs
```

`scripts/wrap.mjs` wraps the compiled browser bundle in the `window.__ModuleLoader__.load` factory protocol DSH expects; `tests/smoke.mjs` mounts the host half into a fake cordis context and exercises every route.

## License

MIT
