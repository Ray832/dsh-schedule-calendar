// Translation coverage: every t('…') key used by the browser half must have an
// English entry, otherwise the English UI would silently fall back to Chinese.
//
//   node tests/i18n.mjs

import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'client')
const dict = await readFile(join(dir, 'i18n.ts'), 'utf8')

/** Keys declared in the EN object: quoted or bare Chinese identifiers. */
const start = dict.indexOf('const EN:')
const end = dict.indexOf('\n}', start)
assert.ok(start > 0 && end > start, 'the EN dictionary must be findable')

const declared = new Set()
for (const line of dict.slice(start, end).split('\n')) {
  const quoted = /^\s{2}'([^']+)':/.exec(line)
  if (quoted) {
    declared.add(quoted[1])
    continue
  }
  const bare = /^\s{2}([^:\s'"]+):\s/.exec(line)
  if (bare && !bare[1].startsWith('//')) declared.add(bare[1])
}

const used = new Map()
for (const file of await readdir(dir)) {
  if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue
  if (file === 'i18n.ts') continue
  const text = await readFile(join(dir, file), 'utf8')
  for (const match of text.matchAll(/\bt\('([^']*)'/g)) {
    if (!used.has(match[1])) used.set(match[1], file)
  }
}

const missing = [...used.keys()].filter((key) => !declared.has(key))
assert.deepEqual(
  missing.map((key) => `${key} (${used.get(key)})`),
  [],
  'every translated key needs an English entry',
)

// The reverse direction is only a report: unused entries are harmless.
const unused = [...declared].filter((key) => !used.has(key))
console.log(`i18n: ${used.size} keys used, all translated (${declared.size} declared, ${unused.length} unused)`)
