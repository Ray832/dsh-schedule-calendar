# Usage

The plugin lives under **Schedule** in the left sidebar. Three tabs, and a gear
in the top-right corner for settings.

## Calendar

- `‹ Today ›` moves the view; `M / W / D` switches month, week and day.
- Click a day to select it, double-click to create an event there.
- Click an event to edit its title, time, place, note, color, lead times and repeat rule.
- Repeats: daily, weekdays, chosen weekdays, every two weeks, monthly. An empty
  "repeat until" means it never ends.
- Editing a repeating event changes **every occurrence**; per-occurrence edits are not supported yet.

## One sentence

The input above the calendar:

```
team meeting tomorrow at 3pm, remind me 10 minutes before
English listening every Mon/Wed/Fri at 8am until the end of December
lab report due next Wednesday (all day)
```

Press Parse; the model returns candidates and nothing is written until you
confirm. If it looks wrong, rephrase and parse again.

## Scheduling from a conversation

You do not have to come back to the panel. Just say it in chat:

```
put the group meeting next Wednesday at 2pm in my calendar, remind me 10 minutes before
split the final revision into three stages two weeks apart and put them in the calendar
```

The model restates what it is about to write, then an approval prompt lists the
titles and times. Nothing is written unless you allow it; declining or closing
the prompt leaves the calendar untouched. A few seconds later the calendar page
reloads itself.

You can also ask "what's on next week" — the model reads it with
`calendar_list`, including every occurrence of repeating events.

## Reminders

- Each event can carry several lead times (on time, 5, 10, 30, 60 minutes).
- A due reminder appears in the bottom-right: **Done** ticks the event,
  **In 5 min / In 10 min** snoozes it.
- Sound and system notifications are switches in Settings; when the environment
  refuses notification permission the page says so and the in-app card still works.
- Quiet hours stay silent; those reminders are recorded as handled, so a restart
  does not replay them.
- Reminders that came due while the app was closed are replayed on the next start,
  up to five, marked as missed.

## Timetable

Off by default. Turn on "Enable the timetable" in Settings.

1. **Configure the term**: first Monday of week 1, number of weeks, and the bell
   times for each period (twelve by default, add or remove as you like).
2. **Add courses**, three ways:
   - Import → paste text copied from your school system → *Parse this text with AI*;
   - Import → choose a CSV file (column order is shown in the dialog);
   - Click an empty cell and fill it in by hand.
3. `‹ This week ›` switches weeks; courses outside a week and the wrong parity are hidden.

The timetable and the calendar are independent on purpose: courses never appear
in the calendar grid.

## Long-term plans

The **Plans** tab → *New goal*: name, description, due date, priority, then
milestones each with their own due date. Ticking milestones moves the progress
bar; the plan completes itself when the last one is done.

## Data and migration

Settings → Data: export/import ICS (works with phone calendars, Google Calendar,
Outlook), and export/restore a complete JSON backup that also carries the
timetable, plans and settings.

There is exactly one data file:
`<DSH_HOME>/storages/dsh-schedule-calendar/calendar.json`, shared across workspaces.

## When something is wrong

```bash
npm run doctor
```

It checks the profile manifest, the bundle list, resolution, build freshness and
whether the host half has ever mounted — one PASS/FAIL line per step.
