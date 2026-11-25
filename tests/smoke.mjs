// Offline smoke test: load the built host half, mount it into a fake cordis
// context, and call its route family the way the browser half does.
//
//   node tests/smoke.mjs
//
// Uses a throwaway DSH_HOME under the temp directory, so a test never touches
// real data.

import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'

const home = await mkdtemp(join(tmpdir(), 'dshc-smoke-'))
process.env.DSH_HOME = home

const plugin = await import('../lib/index.js')

let registered = null
const tools = []
const ctx = {
  webServer: {
    register(route) {
      registered = route
      return () => {}
    },
  },
  effect(callback) {
    const dispose = callback()
    if (typeof dispose === 'function') dispose()
  },
  inject(deps, callback) {
    if (!deps.includes('tools')) return
    callback({ tools: { register: (definition) => tools.push(definition) } })
  },
  get() {
    return undefined
  },
  logger: { warn: (...args) => console.warn('[warn]', ...args) },
}

assert.equal(typeof plugin.apply, 'function', 'apply must be exported')
assert.deepEqual(plugin.inject, ['webServer'], 'inject must name webServer')

plugin.apply(ctx)
assert.ok(registered !== null, 'the route family must register')
assert.equal(registered.kind, 'prefix')
assert.equal(registered.path, '/api/dsh-calendar')

/**
 * Call one host method through the registered handler.
 * @param {string} method - trailing route segment.
 * @param {unknown} [payload] - JSON body.
 * @returns {Promise<{status: number, body: any}>} the response.
 */
async function call(method, payload) {
  const text = payload === undefined ? '' : JSON.stringify(payload)
  const req = {
    method: payload === undefined ? 'GET' : 'POST',
    url: `/api/dsh-calendar/${method}`,
    headers: { host: '127.0.0.1' },
    socket: { remoteAddress: '127.0.0.1' },
    async *[Symbol.asyncIterator]() {
      if (text !== '') yield Buffer.from(text, 'utf8')
    },
  }
  let body = ''
  const res = {
    statusCode: 0,
    setHeader() {},
    end(responseText) {
      body = responseText
    },
  }
  await registered.handler(req, res)
  return { status: res.statusCode, body: JSON.parse(body) }
}

const ping = await call('ping')
assert.equal(ping.status, 200)
assert.equal(ping.body.ok, true, 'ping must succeed')
assert.ok(ping.body.value.path.startsWith(home), 'the document lives under DSH_HOME')

const initial = await call('state.get')
assert.equal(initial.body.ok, true)
assert.equal(initial.body.value.version, 1)
assert.deepEqual(initial.body.value.events, [])
assert.ok(initial.body.value.term.periods.length >= 8, 'a default bell schedule must exist')

const created = await call('event.save', {
  event: { title: '高数复习', start: '2026-11-05T19:00', end: '2026-11-05T20:30', remindBefore: [10, 0], repeat: { kind: 'weekly', weekdays: [4] } },
})
assert.equal(created.body.ok, true, 'event.save must succeed')
assert.equal(created.body.value.events.length, 1)
const event = created.body.value.events[0]
assert.ok(typeof event.id === 'string' && event.id.length > 0, 'the host assigns the id')
assert.equal(event.source, 'manual')
assert.deepEqual(event.remindBefore, [0, 10], 'lead times are sorted')

const rejected = await call('event.save', { event: { title: '  ', start: '2026-11-05T19:00', end: '2026-11-05T20:00' } })
assert.equal(rejected.body.ok, false)
assert.equal(rejected.body.error.code, 'invalid-title')

const backwards = await call('event.save', { event: { title: 'x', start: '2026-11-05T20:00', end: '2026-11-05T19:00' } })
assert.equal(backwards.body.error.code, 'invalid-time')

const updated = await call('event.save', { event: { ...event, title: '高数第 3 章' } })
assert.equal(updated.body.value.events[0].title, '高数第 3 章')
assert.equal(updated.body.value.events.length, 1, 'a save with an id updates in place')

const settings = await call('settings.update', { patch: { timetableEnabled: true, defaultRemindBefore: 30 } })
assert.equal(settings.body.value.settings.timetableEnabled, true)
assert.equal(settings.body.value.settings.defaultRemindBefore, 30)
assert.equal(settings.body.value.settings.quietHours.enabled, false, 'nested settings survive a flat patch')

const removed = await call('event.delete', { id: event.id })
assert.equal(removed.body.value.events.length, 0)

const course = await call('course.save', {
  course: { name: '高等数学', teacher: '张老师', location: '教三-401', weekday: 1, periods: [1, 2], weeks: { from: 1, to: 16 }, parity: 'odd' },
})
assert.equal(course.body.ok, true, 'course.save must succeed')
assert.equal(course.body.value.courses.length, 1)
assert.deepEqual(course.body.value.courses[0].periods, [1, 2])
assert.equal(course.body.value.courses[0].parity, 'odd')

const badCourse = await call('course.save', { course: { name: 'x', weekday: 9, periods: [1] } })
assert.equal(badCourse.body.error.code, 'invalid-weekday')

const imported = await call('course.import', {
  replace: true,
  courses: [
    { name: '大学物理', weekday: 3, periods: [3, 4], weeks: { from: 1, to: 16 } },
    { name: 'English', weekday: 5, periods: [5] },
  ],
})
assert.equal(imported.body.ok, true, 'course.import must succeed')
assert.equal(imported.body.value.courses.length, 2, 'replace drops the previous table')
assert.deepEqual(imported.body.value.courses[1].weeks, { from: 1, to: 20 }, 'a missing week range defaults to the whole term')

const afterDelete = await call('course.delete', { id: imported.body.value.courses[0].id })
assert.equal(afterDelete.body.value.courses.length, 1)

const plan = await call('plan.save', {
  plan: {
    title: '期末复习',
    due: '2026-12-20',
    priority: 'high',
    milestones: [{ title: '第 1-3 章' }, { title: '第 4-6 章' }, { title: '两套真题' }],
  },
})
assert.equal(plan.body.ok, true, 'plan.save must succeed')
assert.equal(plan.body.value.plans.length, 1)
const saved = plan.body.value.plans[0]
assert.equal(saved.milestones.length, 3)
assert.equal(saved.status, 'active')

const ticked = await call('plan.milestone', { planId: saved.id, milestoneId: saved.milestones[0].id, done: true })
assert.equal(ticked.body.value.plans[0].milestones[0].done, true)
assert.equal(ticked.body.value.plans[0].status, 'active', 'one milestone does not finish the plan')

for (const milestone of saved.milestones.slice(1)) {
  const next = await call('plan.milestone', { planId: saved.id, milestoneId: milestone.id, done: true })
  assert.equal(next.body.ok, true)
}
const finished = await call('state.get')
assert.equal(finished.body.value.plans[0].status, 'done', 'the plan finishes with its last milestone')

const planDeleted = await call('plan.delete', { id: saved.id })
assert.equal(planDeleted.body.value.plans.length, 0)

const seeded = await call('event.save', {
  event: {
    title: '线性代数',
    start: '2026-11-06T10:00',
    end: '2026-11-06T11:30',
    location: '教二-101',
    repeat: { kind: 'weekly', weekdays: [5] },
  },
})
assert.equal(seeded.body.ok, true)

const ics = await call('io.export.ics')
assert.equal(ics.body.ok, true)
assert.ok(ics.body.value.text.includes('BEGIN:VCALENDAR'), 'the export is an iCalendar document')
assert.ok(ics.body.value.text.includes('SUMMARY:线性代数'), 'the title survives the export')
assert.ok(ics.body.value.text.includes('RRULE:FREQ=WEEKLY;BYDAY=FR'), 'weekly recurrence exports as an RRULE')
assert.equal(ics.body.value.count, 1)

const reimported = await call('io.import.ics', { text: ics.body.value.text })
assert.equal(reimported.body.ok, true, 'the exported document imports again')
assert.equal(reimported.body.value.added, 1)
assert.equal(reimported.body.value.state.events.length, 2, 'import merges instead of replacing')
const roundTripped = reimported.body.value.state.events[1]
assert.equal(roundTripped.title, '线性代数')
assert.equal(roundTripped.start, '2026-11-06T10:00')
assert.equal(roundTripped.location, '教二-101')
assert.equal(roundTripped.repeat.kind, 'weekly')
assert.deepEqual(roundTripped.repeat.weekdays, [5])
assert.equal(roundTripped.source, 'import')

const backup = await call('io.backup')
assert.equal(backup.body.ok, true)
const parsedBackup = JSON.parse(backup.body.value.json)
assert.equal(parsedBackup.version, 1)
assert.equal(parsedBackup.events.length, 2)

const restored = await call('io.restore', { json: backup.body.value.json })
assert.equal(restored.body.ok, true)
assert.equal(restored.body.value.state.events.length, 2)
assert.equal(restored.body.value.state.courses.length, 1, 'a restore keeps the rest of the document')

const badJson = await call('io.restore', { json: '{oops' })
assert.equal(badJson.body.error.code, 'invalid-json')

const missing = await call('nope')
assert.equal(missing.status, 404, 'an unknown method must 404')

// Model-facing tools: registered through the ctx.inject scope, then executed.
assert.equal(tools.length, 3, 'three tools register when the composition exposes a registry')
const toolNames = tools.map((tool) => tool.name).sort()
assert.deepEqual(toolNames, ['calendar_add', 'calendar_delete', 'calendar_list'])
const add = tools.find((tool) => tool.name === 'calendar_add')
const added = await add.execute({ events: [{ title: '小组讨论', start: '2026-11-09T14:00', end: '2026-11-09T15:00', remindBefore: [5] }] }, {})
assert.equal(added.created.length, 1)
assert.equal(added.created[0].title, '小组讨论')
const rendered = add.output.render({}, added)
assert.equal(rendered[0].type, 'text')
assert.ok(rendered[0].text.includes('小组讨论'), 'the tool renders a readable line')

const list = tools.find((tool) => tool.name === 'calendar_list')
const listed = await list.execute({ from: '2026-11-09', to: '2026-11-09' }, {})
assert.ok(listed.events.length >= 1, 'the list tool sees the event just added')

// Without a model service the parse routes answer a code, never a crash.
const noModel = await call('parse.events', { text: '明天开会' })
assert.equal(noModel.body.ok, false)
assert.equal(noModel.body.error.code, 'no-model')

// The document must be durable and readable after the debounce window.
await new Promise((resolve) => setTimeout(resolve, 400))
const onDisk = JSON.parse(await readFile(join(home, 'storages', 'dsh-schedule-calendar', 'calendar.json'), 'utf8'))
assert.equal(onDisk.version, 1)
assert.equal(onDisk.settings.timetableEnabled, true, 'settings persist to disk')

await rm(home, { recursive: true, force: true })
console.log('smoke: host half OK (route fence, state, event CRUD, settings, persistence)')
