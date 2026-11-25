// Reminder-tier contract: a tier is what the user picks, the lead-minute list
// is what the engine and the ICS export consume, and an old document still
// keeps the lead times it was written with.
//
//   node tests/remind.mjs

import assert from 'node:assert/strict'
import { cleanReminderPlan, describeLead, describePlan, eventLeads, normalize, planFromLeads, reminderLeads } from '../lib/index.js'

// --- tier → lead minutes ----------------------------------------------------

assert.deepEqual(reminderLeads({ kind: 'short', hours: 2, minutes: 30 }), [150], 'short adds hours and minutes')
assert.deepEqual(reminderLeads({ kind: 'short', hours: 0, minutes: 0 }), [0], 'zero means at the start')
assert.deepEqual(reminderLeads({ kind: 'mid', days: 3 }), [3 * 1440], 'mid counts whole days')
assert.deepEqual(reminderLeads({ kind: 'none' }), [], 'no tier means no reminder')
assert.deepEqual(reminderLeads(undefined), [], 'a missing tier means no reminder')

// The long tier walks back from startDays and always keeps the day itself.
assert.deepEqual(
  reminderLeads({ kind: 'long', startDays: 15, everyDays: 7 }),
  [15 * 1440, 8 * 1440, 1 * 1440, 0],
  'long repeats every N days and ends on the day',
)
assert.deepEqual(
  reminderLeads({ kind: 'long', startDays: 4, everyDays: 1 }),
  [4 * 1440, 3 * 1440, 2 * 1440, 1 * 1440, 0],
  'every day means every day',
)
assert.ok(reminderLeads({ kind: 'long', startDays: 15, everyDays: 1 }).length <= 40, 'the ladder is bounded')

// --- clamping ---------------------------------------------------------------

assert.deepEqual(cleanReminderPlan({ kind: 'short', hours: 99, minutes: -5 }), { kind: 'short', hours: 24, minutes: 0 }, 'short clamps')
assert.deepEqual(cleanReminderPlan({ kind: 'mid', days: 0 }), { kind: 'mid', days: 1 }, 'mid never goes below a day')
assert.deepEqual(cleanReminderPlan({ kind: 'mid', days: 99 }), { kind: 'mid', days: 15 }, 'mid stops at 15 days')
assert.deepEqual(
  cleanReminderPlan({ kind: 'long', startDays: 1, everyDays: 5 }),
  { kind: 'long', startDays: 5, everyDays: 5 },
  'a long ladder starts no earlier than one interval',
)
assert.deepEqual(
  cleanReminderPlan({ kind: 'long', startDays: 15, everyDays: 4 }),
  { kind: 'long', startDays: 15, everyDays: 3 },
  'only 1/3/5/7 are accepted, and 3 is the fallback',
)
assert.deepEqual(cleanReminderPlan({ kind: 'nonsense' }), { kind: 'none' }, 'an unknown tier is no reminder')
assert.deepEqual(cleanReminderPlan(undefined), { kind: 'none' })

// --- legacy migration -------------------------------------------------------

assert.deepEqual(planFromLeads([10]), { kind: 'short', hours: 0, minutes: 10 }, 'a short lead becomes the short tier')
assert.deepEqual(planFromLeads([90]), { kind: 'short', hours: 1, minutes: 30 }, 'hours and minutes split')
assert.deepEqual(planFromLeads([2 * 1440]), { kind: 'mid', days: 2 }, 'a multi-day lead becomes the mid tier')
assert.deepEqual(planFromLeads([90, 10]), { kind: 'short', hours: 0, minutes: 10 }, 'the earliest lead wins')
assert.deepEqual(planFromLeads([]), { kind: 'none' }, 'no leads is no tier')
assert.deepEqual(planFromLeads([40 * 1440]), { kind: 'mid', days: 15 }, 'a far lead stops at the mid ceiling')

// A pre-tier document keeps its lead list untouched until the event is saved.
const legacyState = normalize({
  version: 1,
  events: [
    { id: 'old', title: '旧日程', start: '2026-11-05T19:00', end: '2026-11-05T20:00', allDay: false, remindBefore: [10, 0], source: 'manual', createdAt: 0, updatedAt: 0 },
  ],
  settings: { defaultRemindBefore: 30 },
})
assert.deepEqual(legacyState.events[0].remindBefore, [10, 0], 'a legacy event keeps every lead it had, in its own order')
assert.equal(legacyState.events[0].reminder, undefined, 'and gains no tier behind the user is back')
assert.deepEqual(eventLeads(legacyState.events[0]), [0, 10], 'the engine still sorts and dedupes it')
assert.deepEqual(legacyState.settings.defaultReminder, { kind: 'short', hours: 0, minutes: 30 }, 'the legacy default lead becomes a tier')
assert.equal(legacyState.settings.defaultRemindBefore, 30, 'the legacy field still reads back')

// A tiered document has its lead list rewritten from the tier.
const tieredState = normalize({
  version: 1,
  events: [
    {
      id: 'new',
      title: '新日程',
      start: '2026-11-05T19:00',
      end: '2026-11-05T20:00',
      allDay: false,
      reminder: { kind: 'long', startDays: 4, everyDays: 1 },
      remindBefore: [10],
      source: 'manual',
      createdAt: 0,
      updatedAt: 0,
    },
  ],
  settings: {},
})
assert.deepEqual(
  tieredState.events[0].remindBefore,
  [0, 1440, 2880, 4320, 5760],
  'the derived list follows the stored tier, not the stale array',
)

// --- what the engine reads --------------------------------------------------

assert.deepEqual(eventLeads({ reminder: { kind: 'mid', days: 1 } }), [1440], 'a tiered event is read from its tier')
assert.deepEqual(eventLeads({ remindBefore: [30, 10, 10] }), [10, 30], 'a legacy event is read from its list, sorted and deduped')
assert.deepEqual(eventLeads({}), [], 'no reminder at all')

// --- wording ----------------------------------------------------------------

assert.equal(describeLead(0), '准时')
assert.equal(describeLead(30), '30 分钟')
assert.equal(describeLead(90), '1 小时 30 分钟')
assert.equal(describeLead(2880), '2 天')
assert.equal(describeLead(90, 'en'), '1 hour 30 min')
assert.equal(describeLead(0, 'en'), 'at start')

assert.equal(describePlan({ kind: 'none' }), '不提醒')
assert.equal(describePlan({ kind: 'short', hours: 2, minutes: 0 }), '提前 2 小时')
assert.equal(describePlan({ kind: 'mid', days: 3 }), '提前 3 天')
assert.equal(describePlan({ kind: 'long', startDays: 15, everyDays: 3 }, 'zh'), '提前 15 天起，每 3 天一次')
assert.equal(describePlan({ kind: 'mid', days: 1 }, 'en'), 'lead 1 day')

console.log('remind: tiers OK (short/mid/long expansion, clamping, legacy migration, wording)')