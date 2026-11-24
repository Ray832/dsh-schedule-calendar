// Recurrence expansion: the one place that decides which occurrences exist, so
// the calendar view and the reminder scanner can never disagree.
//
//   node tests/repeat.mjs

import assert from 'node:assert/strict'
import { expandAll, expandEvent, parseStamp, stamp } from '../lib/index.js'

/** A well-formed event with optional overrides. */
function makeEvent(overrides = {}) {
  return {
    id: 'e1',
    title: '高数复习',
    start: '2026-11-02T09:00',
    end: '2026-11-02T10:00',
    allDay: false,
    remindBefore: [10],
    repeat: { kind: 'none' },
    source: 'manual',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

/** Occurrence starts as `YYYY-MM-DD` strings. */
function days(event, from, to) {
  return expandEvent(event, parseStamp(`${from}T00:00`), parseStamp(`${to}T00:00`)).map((item) => stamp(item.start).slice(0, 10))
}

// A single occurrence appears once and only inside its window.
const single = makeEvent()
assert.deepEqual(days(single, '2026-11-01', '2026-11-08'), ['2026-11-02'])
assert.deepEqual(days(single, '2026-11-03', '2026-11-08'), [], 'a one-shot outside the window does not appear')

// Daily repeats stop at `until`.
const daily = makeEvent({ repeat: { kind: 'daily', until: '2026-11-04' } })
assert.deepEqual(days(daily, '2026-11-01', '2026-11-10'), ['2026-11-02', '2026-11-03', '2026-11-04'])

// Weekdays skip the weekend.
const workdays = makeEvent({ repeat: { kind: 'weekdays' } })
assert.deepEqual(days(workdays, '2026-11-02', '2026-11-09'), ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'])

// Weekly on chosen weekdays.
const weekly = makeEvent({ repeat: { kind: 'weekly', weekdays: [1, 4] } })
assert.deepEqual(days(weekly, '2026-11-02', '2026-11-09'), ['2026-11-02', '2026-11-05'])

// Every two weeks keeps the parity of the start week.
const biweekly = makeEvent({ repeat: { kind: 'biweekly', weekdays: [1] } })
assert.deepEqual(
  days(biweekly, '2026-11-02', '2026-11-24'),
  ['2026-11-02', '2026-11-16'],
  'odd weeks only, counting from the start week',
)

// Monthly on the 31st skips months without one.
const monthly = makeEvent({ start: '2026-01-31T09:00', end: '2026-01-31T10:00', repeat: { kind: 'monthly' } })
assert.deepEqual(
  days(monthly, '2026-01-01', '2026-05-01'),
  ['2026-01-31', '2026-03-31'],
  'February and April have no 31st',
)

// The duration is preserved on every occurrence.
const timed = expandEvent(makeEvent({ repeat: { kind: 'daily' } }), parseStamp('2026-11-02T00:00'), parseStamp('2026-11-04T00:00'))
assert.equal(timed.length, 2)
for (const occurrence of timed) {
  assert.equal(occurrence.end.getTime() - occurrence.start.getTime(), 60 * 60_000)
}

// Keys are stable and unique per occurrence.
const keys = timed.map((occurrence) => occurrence.key)
assert.equal(new Set(keys).size, keys.length, 'occurrence keys are unique')
assert.equal(keys[0], 'e1@2026-11-02T09:00', 'the key names the event and the occurrence start')

// A window that starts mid-series still yields the right occurrences.
assert.deepEqual(days(daily, '2026-11-03', '2026-11-05'), ['2026-11-03', '2026-11-04'])

// Several events flatten in ascending order.
const merged = expandAll(
  [makeEvent({ id: 'a', start: '2026-11-03T09:00', end: '2026-11-03T10:00' }), makeEvent({ id: 'b', start: '2026-11-02T09:00', end: '2026-11-02T10:00' })],
  parseStamp('2026-11-01T00:00'),
  parseStamp('2026-11-05T00:00'),
).map((occurrence) => occurrence.event.id)
assert.deepEqual(merged, ['b', 'a'], 'occurrences come back in start order')

// An all-day event keeps its single day.
const allDay = makeEvent({ allDay: true, start: '2026-11-07T00:00', end: '2026-11-07T23:59', repeat: { kind: 'none' } })
assert.deepEqual(days(allDay, '2026-11-01', '2026-11-10'), ['2026-11-07'])

console.log('repeat: expansion OK (single, daily+until, weekdays, weekly, biweekly, monthly, duration, keys)')
