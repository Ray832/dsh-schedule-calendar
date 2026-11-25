// Tool contract: the two model-facing tools must register with schemas the DSH
// registry accepts, write through, and pause `calendar_add` for approval.
//
//   node tests/tools.mjs

import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import { makeTempHome } from './temp.mjs'

const home = await makeTempHome('dshc-tools-')
process.env.DSH_HOME = home

const plugin = await import('../lib/index.js')

/** Registered tools, captured from the fake registry. */
const registered = new Map()
/** Captured `tools/pre-execute` listener. */
let preExecute = null

const store = { state: null }

const ctx = {
  webServer: { register: () => () => {} },
  effect(callback) {
    const dispose = callback()
    if (typeof dispose === 'function') dispose()
  },
  inject(deps, callback) {
    if (!deps.includes('tools')) return
    callback({
      tools: {
        register(definition) {
          registered.set(definition.name, definition)
          return () => registered.delete(definition.name)
        },
      },
    })
  },
  on(event, listener) {
    if (event === 'tools/pre-execute') preExecute = listener
    return () => {}
  },
  get() {
    return undefined
  },
  logger: { warn() {}, error() {} },
}

plugin.apply(ctx)

// --- registration -----------------------------------------------------------

assert.deepEqual(
  [...registered.keys()].sort(),
  ['calendar_add', 'calendar_complete', 'calendar_delete', 'calendar_list', 'calendar_update'],
  'all five tools register',
)
assert.equal(typeof preExecute, 'function', 'the approval gate installs a pre-execute listener')

/**
 * Check one schema against the raw subset the registry enforces.
 * Mirrors `checkSchemaNode` in @deepseek-ai/dsh-tools.
 * @param {unknown} node - schema node.
 * @param {string} path - diagnostic path.
 */
function checkSchema(node, path) {
  assert.ok(node !== null && typeof node === 'object' && !Array.isArray(node), `${path} must be an object`)
  const allowed = new Set(['type', 'oneOf', 'properties', 'required', 'additionalProperties', 'items', 'enum', 'const', 'description', 'title', 'default', 'examples'])
  for (const key of Object.keys(node)) {
    assert.ok(allowed.has(key), `${path}.${key} is not a supported keyword`)
  }
  assert.ok(!(node.type !== undefined && node.oneOf !== undefined), `${path} cannot declare type and oneOf`)
  if (node.type === 'object') {
    // Optional in the raw subset; a present value must be a boolean.
    if (node.additionalProperties !== undefined) {
      assert.equal(typeof node.additionalProperties, 'boolean', `${path}.additionalProperties must be a boolean`)
    }
    for (const [key, child] of Object.entries(node.properties ?? {})) checkSchema(child, `${path}.properties.${key}`)
    if (node.required !== undefined) {
      assert.ok(Array.isArray(node.required), `${path}.required must be an array`)
      for (const name of node.required) {
        assert.ok(Object.hasOwn(node.properties ?? {}, name), `${path}.required names undeclared "${name}"`)
      }
    }
  }
  if (node.type === 'array' && node.items !== undefined) checkSchema(node.items, `${path}.items`)
  if (node.oneOf !== undefined) node.oneOf.forEach((branch, index) => checkSchema(branch, `${path}.oneOf[${index}]`))
}

for (const [name, definition] of registered) {
  checkSchema(definition.parameters, `${name}.parameters`)
  checkSchema(definition.output.schema, `${name}.output`)
  assert.equal(typeof definition.output.render, 'function', `${name} renders output`)
  assert.equal(typeof definition.execute, 'function', `${name} executes`)
  assert.equal(typeof definition.description, 'string')
  assert.ok(definition.description.length > 40, `${name} describes when to use it`)
}

const add = registered.get('calendar_add')
const list = registered.get('calendar_list')
const update = registered.get('calendar_update')
const complete = registered.get('calendar_complete')
const del = registered.get('calendar_delete')
assert.match(add.description, /after the user has agreed/i, 'the write tool tells the model to agree first')
assert.match(list.description, /what is coming up/i, 'the list tool names the questions it answers')
assert.match(list.description, /ids that calendar_update/i, 'the list tool points at the tools that need ids')
assert.match(del.description, /calendar_list first/i, 'the delete tool says where ids come from')
assert.match(del.description, /cannot be undone/i, 'the delete tool warns about permanence')
assert.match(update.description, /calendar_list first/i, 'the update tool says where ids come from')
assert.match(update.description, /calendar_complete instead/i, 'the update tool sends completion elsewhere')
assert.match(complete.description, /done/i, 'the complete tool names the state it sets')
assert.match(list.description, /already done/i, 'the list tool reports completion')

// --- execution --------------------------------------------------------------

const created = await add.execute({ events: [{ title: '小组讨论', start: '2026-11-26T14:00', end: '2026-11-26T15:00', remindBefore: [5] }] }, {})
assert.equal(created.created.length, 1)
assert.equal(created.created[0].title, '小组讨论')
assert.ok(created.created[0].id.length > 0, 'the host assigns an id')

const rendered = add.output.render({}, created)
assert.equal(rendered[0].type, 'text')
assert.match(rendered[0].text, /小组讨论/)
assert.match(rendered[0].text, /2026-11-26 14:00/, 'times render readably')

const listed = await list.execute({ from: '2026-11-26', to: '2026-11-26' }, {})
assert.equal(listed.events.length, 1)
assert.equal(listed.events[0].title, '小组讨论')
assert.equal(listed.events[0].id, created.created[0].id, 'the list hands back ids so a delete can name one')

const listText = list.output.render({}, listed)[0].text
assert.match(listText, /\[id: /, 'the rendered list exposes the id')

assert.equal(listed.events[0].done, false, 'a new event starts open')
assert.match(listText, /open/, 'the rendered list says whether an event is open')

// --- update -----------------------------------------------------------------

const patched = update.execute(
  {
    events: [
      {
        id: created.created[0].id,
        start: '2026-11-27T09:00',
        end: '2026-11-27T10:00',
        location: '教三-401',
        reminder: { kind: 'mid', days: 3 },
      },
    ],
  },
  {},
)
assert.equal(patched.updated.length, 1)
assert.ok(patched.updated[0].changed.includes('time'), 'the result names the changed time')
assert.ok(patched.updated[0].changed.includes('reminder'), 'the result names the changed reminder')
assert.match(update.output.render({}, patched)[0].text, /Updated: 小组讨论/)

const afterUpdate = list.execute({ from: '2026-11-27', to: '2026-11-27' }, {})
assert.equal(afterUpdate.events.length, 1, 'the event moved to its new day')
assert.equal(afterUpdate.events[0].start, '2026-11-27T09:00')
assert.equal(afterUpdate.events[0].reminder, 'lead 3 days', 'the list reports the stored tier')

assert.throws(() => update.execute({ events: [{ id: created.created[0].id }] }, {}), /changes nothing/)
assert.throws(() => update.execute({ events: [{ start: '2026-11-27T09:00' }] }, {}), /needs an id/)

// --- completion -------------------------------------------------------------

const marked = complete.execute({ ids: [created.created[0].id] }, {})
assert.equal(marked.updated[0].done, true)
assert.match(complete.output.render({}, marked)[0].text, /Marked done: 小组讨论/)

const doneList = list.execute({ from: '2026-11-27', to: '2026-11-27' }, {})
assert.equal(doneList.events[0].done, true, 'the list reports the completion')
assert.match(list.output.render({}, doneList)[0].text, /done/)

const reopened = complete.execute({ ids: [created.created[0].id], done: false }, {})
assert.equal(reopened.updated[0].done, false, 'done: false puts it back')
assert.match(complete.output.render({}, reopened)[0].text, /Reopened: 小组讨论/)

// Malformed input fails with an actionable message instead of writing.
assert.throws(() => add.execute({ events: [{ title: '', start: '2026-11-26T14:00' }] }, {}), /events\[0\]/)
assert.throws(() => list.execute({ from: 'tomorrow', to: '2026-11-27' }, {}), /YYYY-MM-DD/)
assert.throws(() => del.execute({ ids: [] }, {}), /non-empty array/)

// --- approval gate ----------------------------------------------------------

const next = () => 'delegated'
const ask = preExecute({ name: 'calendar_add', arguments: { events: [{ title: '组会', start: '2026-11-26T15:00', end: '2026-11-26T16:00' }] } }, next)
assert.equal(ask.kind, 'ask', 'a write pauses for approval')
assert.match(ask.displayReason, /组会/, 'the prompt names the event')
assert.match(ask.displayReason, /2026-11-26 15:00/, 'the prompt names the time')
assert.match(ask.reason, /1 event/, 'the logged reason counts the events')

// A delete names what disappears, resolved from the document, not from the id.
const deleteAsk = preExecute({ name: 'calendar_delete', arguments: { ids: [created.created[0].id] } }, next)
assert.equal(deleteAsk.kind, 'ask', 'a delete pauses for approval')
assert.match(deleteAsk.displayReason, /删除日程/, 'the prompt says it is a delete')
assert.match(deleteAsk.displayReason, /小组讨论/, 'the prompt names the event about to disappear')
assert.match(deleteAsk.reason, /Delete 1 event/, 'the logged reason says delete')

// An unknown id still asks, showing the raw id rather than failing open.
const unknownAsk = preExecute({ name: 'calendar_delete', arguments: { ids: ['no-such-id'] } }, next)
assert.equal(unknownAsk.kind, 'ask')
assert.match(unknownAsk.displayReason, /no-such-id/)

const updateAsk = preExecute(
  { name: 'calendar_update', arguments: { events: [{ id: created.created[0].id, start: '2026-11-28T09:00', end: '2026-11-28T10:00' }] } },
  next,
)
assert.equal(updateAsk.kind, 'ask', 'an update pauses for approval')
assert.match(updateAsk.displayReason, /修改日程/, 'the prompt says it is an update')
assert.match(updateAsk.displayReason, /2026-11-27 09:00.*2026-11-28 09:00/s, 'the prompt shows old and new time')
assert.match(updateAsk.reason, /Update 1 event/, 'the logged reason says update')

const completeAsk = preExecute({ name: 'calendar_complete', arguments: { ids: [created.created[0].id] } }, next)
assert.equal(completeAsk.kind, 'ask', 'a completion pauses for approval')
assert.match(completeAsk.displayReason, /标记完成/, 'the prompt says it marks done')
assert.match(completeAsk.displayReason, /小组讨论/, 'the prompt names the event')

const reopenAsk = preExecute({ name: 'calendar_complete', arguments: { ids: [created.created[0].id], done: false } }, next)
assert.match(reopenAsk.displayReason, /取消完成/, 'reopening says so')

const passthrough = preExecute({ name: 'calendar_list', arguments: {} }, next)
assert.equal(passthrough, 'delegated', 'a read is not gated')

const empty = preExecute({ name: 'calendar_add', arguments: {} }, next)
assert.equal(empty.kind, 'ask', 'even an empty write asks before it fails')
assert.match(empty.displayReason, /Add to calendar/)

// The gate covers a large batch without exploding the prompt.
const batch = preExecute(
  {
    name: 'calendar_add',
    arguments: { events: Array.from({ length: 9 }, (_, index) => ({ title: `课程 ${index}`, start: '2026-11-26T09:00' })) },
  },
  next,
)
assert.match(batch.displayReason, /9/)
assert.match(batch.displayReason, /…4 more/, 'the prompt truncates the list')

// --- delete ----------------------------------------------------------------

const removed = del.execute({ ids: [created.created[0].id] }, {})
assert.equal(removed.deleted.length, 1)
assert.equal(removed.deleted[0].title, '小组讨论')
assert.match(del.output.render({}, removed)[0].text, /Deleted: 小组讨论/)

const afterDelete = list.execute({ from: '2026-11-26', to: '2026-11-26' }, {})
assert.equal(afterDelete.events.length, 0, 'the deleted event is gone from the list')

const again = del.execute({ ids: [created.created[0].id] }, {})
assert.equal(again.deleted.length, 0, 'deleting an unknown id reports nothing removed, without throwing')

await rm(home, { recursive: true, force: true })
console.log('tools: registration OK (five tools, schema subset, list ids and done state, update, complete, delete, approval gate, truncation)')