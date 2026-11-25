// Tool contract: the two model-facing tools must register with schemas the DSH
// registry accepts, write through, and pause `calendar_add` for approval.
//
//   node tests/tools.mjs

import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'

const home = await mkdtemp(join(tmpdir(), 'dshc-tools-'))
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

assert.deepEqual([...registered.keys()].sort(), ['calendar_add', 'calendar_list'], 'both tools register')
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
assert.match(add.description, /after the user has agreed/i, 'the write tool tells the model to agree first')

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

// Malformed input fails with an actionable message instead of writing.
assert.throws(() => add.execute({ events: [{ title: '', start: '2026-11-26T14:00' }] }, {}), /events\[0\]/)
assert.throws(() => list.execute({ from: 'tomorrow', to: '2026-11-27' }, {}), /YYYY-MM-DD/)

// --- approval gate ----------------------------------------------------------

const next = () => 'delegated'
const ask = preExecute({ name: 'calendar_add', arguments: { events: [{ title: '组会', start: '2026-11-26T15:00', end: '2026-11-26T16:00' }] } }, next)
assert.equal(ask.kind, 'ask', 'a write pauses for approval')
assert.match(ask.displayReason, /组会/, 'the prompt names the event')
assert.match(ask.displayReason, /2026-11-26 15:00/, 'the prompt names the time')
assert.match(ask.reason, /1 event/, 'the logged reason counts the events')

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

await rm(home, { recursive: true, force: true })
console.log('tools: registration OK (schema subset, execute, approval gate, truncation)')