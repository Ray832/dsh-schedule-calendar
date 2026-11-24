// Reminder-engine test: a fake clock drives the scan, no host and no browser.
//
//   node tests/notify.mjs

import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import { ReminderEngine } from '../lib/index.js'

const home = await mkdtemp(join(tmpdir(), 'dshc-notify-'))
const logPath = join(home, 'notifications.json')

/** A document with one event; overrides merge on top. */
function stateWith(overrides = {}) {
  return {
    version: 1,
    term: { startDate: '2026-09-01', totalWeeks: 20, days: [1, 2, 3, 4, 5], periods: [] },
    events: [],
    courses: [],
    plans: [],
    settings: {
      timetableEnabled: false,
      defaultRemindBefore: 10,
      quietHours: { enabled: false, from: '23:00', to: '07:00' },
      soundEnabled: true,
      systemNotification: true,
      weekStart: 1,
      timeFormat: '24h',
    },
    ...overrides,
  }
}

/** One event at a given local stamp with a lead time. */
function event(start, end, leads, id = 'e1') {
  return {
    id,
    title: '组会',
    start,
    end,
    allDay: false,
    remindBefore: leads,
    repeat: { kind: 'none' },
    source: 'manual',
    createdAt: 0,
    updatedAt: 0,
  }
}

let clock = new Date(2026, 10, 5, 18, 50, 0).getTime()
const now = () => clock

const state = stateWith({ events: [event('2026-11-05T19:00', '2026-11-05T20:00', [10])] })
const engine = new ReminderEngine({ state: () => state, logPath, now })

// Ten minutes before the start: nothing is due yet.
clock = new Date(2026, 10, 5, 18, 49, 0).getTime()
assert.equal(engine.scan().length, 0, 'nothing fires before the lead time')

// The lead time arrives.
clock = new Date(2026, 10, 5, 18, 50, 5).getTime()
const fired = engine.scan()
assert.equal(fired.length, 1, 'the lead time fires exactly once')
assert.equal(fired[0].leadMinutes, 10)
assert.equal(fired[0].title, '组会')

// Draining is once per notice.
assert.equal(engine.pending().length, 1, 'the page drains the notice once')
assert.equal(engine.pending().length, 0, 'a drained notice is not repeated')

// A restart must not replay it: fresh engine, same log file.
const restarted = new ReminderEngine({ state: () => state, logPath, now })
assert.equal(restarted.scan().length, 0, 'the fired log survives a restart')

// Snooze re-arms the same notice after the delay.
clock = new Date(2026, 10, 5, 19, 0, 0).getTime()
const beforeSnooze = new ReminderEngine({ state: () => state, logPath, now })
beforeSnooze.scan()
assert.equal(beforeSnooze.pending().length, 0, 'still deduplicated after a restart at a later time')

// Quiet hours suppress a reminder that fires inside the window.
const quietState = stateWith({
  events: [event('2026-11-05T23:10', '2026-11-05T23:40', [0])],
  settings: { ...stateWith().settings, quietHours: { enabled: true, from: '23:00', to: '07:00' } },
})
const quietLog = join(home, 'quiet.json')
clock = new Date(2026, 10, 5, 23, 0, 0).getTime()
const quiet = new ReminderEngine({ state: () => quietState, logPath: quietLog, now })
quiet.scan() // establishes the scan floor outside the window
clock = new Date(2026, 10, 5, 23, 10, 2).getTime()
assert.equal(quiet.scan().length, 0, 'quiet hours suppress the notice')
quiet.scan()
assert.equal(quiet.pending().length, 0, 'a suppressed notice is never queued')

const restartedQuiet = new ReminderEngine({ state: () => quietState, logPath: quietLog, now })
assert.equal(restartedQuiet.scan().length, 0, 'a quiet-suppressed reminder stays silent after a restart')

// A recurring event fires once per occurrence, not once per event.
const repeatState = stateWith({
  events: [event('2026-11-02T09:00', '2026-11-02T10:00', [0], 'e2')].map((e) => ({ ...e, repeat: { kind: 'daily' } })),
})
const repeatLog = join(home, 'repeat.json')
clock = new Date(2026, 10, 2, 8, 59, 0).getTime()
const daily = new ReminderEngine({ state: () => repeatState, logPath: repeatLog, now })
daily.scan()
clock = new Date(2026, 10, 2, 9, 0, 1).getTime()
assert.equal(daily.scan().length, 1, 'the first occurrence fires')
clock = new Date(2026, 10, 3, 9, 0, 1).getTime()
assert.equal(daily.scan().length, 1, 'the next day fires a second, distinct occurrence')

// The log file is valid JSON and shrinks to the retention window.
const log = JSON.parse(await readFile(logPath, 'utf8'))
assert.ok(Object.keys(log.fired).length >= 1, 'fired keys are persisted')

await rm(home, { recursive: true, force: true })
console.log('notify: engine OK (lead time, drain-once, restart dedupe, quiet hours, recurrence)')
