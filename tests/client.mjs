// Browser-half contract test: evaluate the built bundle exactly the way the
// DSH shell does (through window.__ModuleLoader__), then mount it into a fake
// sliding context and check the surfaces it claims.
//
//   node tests/client.mjs

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const code = await readFile(join(root, 'lib/client.js'), 'utf8')
const require = createRequire(import.meta.url)

/** Minimal DOM the bundle touches before React renders. */
const styleTags = []
globalThis.window = {
  __ModuleLoader__: {
    rows: [],
    load(row) {
      this.rows.push(row)
    },
  },
  addEventListener() {},
  removeEventListener() {},
}
globalThis.document = {
  querySelector: () => null,
  createElement: () => ({ dataset: {}, textContent: '' }),
  head: { appendChild: (tag) => styleTags.push(tag) },
  documentElement: { lang: 'zh-CN' },
  addEventListener() {},
  removeEventListener() {},
}
Object.defineProperty(globalThis, 'navigator', { value: { language: 'zh-CN' }, configurable: true })

// The bundle is a plain script: run it with a CommonJS-ish scope.
new Function('window', 'document', 'navigator', code)(globalThis.window, globalThis.document, globalThis.navigator)

const rows = globalThis.window.__ModuleLoader__.rows
assert.equal(rows.length, 1, 'the bundle registers exactly one module row')
const [row] = rows
assert.equal(row.id, 'dsh-schedule-calendar', 'the row id is the package name')
assert.equal(typeof row.factory, 'function')

const module = row.factory(require)
assert.equal(typeof module.apply, 'function', 'the factory must export apply')
assert.deepEqual(module.inject, ['slots'], 'the factory must declare its inject list')

const registrations = []
const ctx = {
  slots: {
    inject(name, callback) {
      const dispose = callback()
      return () => (typeof dispose === 'function' ? dispose() : undefined)
    },
    register(spec, component) {
      registrations.push({ spec, component })
      return () => {}
    },
  },
  effect(callback) {
    callback()
  },
  get() {
    return undefined
  },
}

module.apply(ctx)

const names = registrations.map((entry) => entry.spec.name)
assert.deepEqual(
  names.sort(),
  ['main', 'shell.overlay', 'sidebar.panellist'],
  'the plugin claims a sidebar row, a main panel and a frame overlay',
)

const panel = registrations.find((entry) => entry.spec.name === 'sidebar.panellist')
assert.equal(panel.spec.id, 'dsh-schedule-calendar')
assert.equal(typeof panel.spec.label, 'function', 'the sidebar label is resolved lazily for i18n')
assert.equal(typeof panel.component, 'function')

const main = registrations.find((entry) => entry.spec.name === 'main')
assert.equal(main.spec.key, 'dsh-schedule-calendar', 'the main panel key matches the sidebar id')
assert.equal(typeof main.component, 'function')

const overlay = registrations.find((entry) => entry.spec.name === 'shell.overlay')
assert.equal(typeof overlay.component, 'function')
assert.equal(styleTags.length, 1, 'the stylesheet is injected once')
assert.ok(styleTags[0].textContent.includes('.dshc-root'), 'the stylesheet carries the plugin classes')

console.log('client: bundle OK (loader row, exports, three slot claims, stylesheet)')
