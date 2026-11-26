// Stage exactly what an installation needs, so nothing else can leak into the
// tarball.
//
//   node scripts/stage.mjs && npm pack .pack --pack-destination dist
//
// npm's `files` whitelist cannot remove README.md or LICENSE: npm always packs
// those when they sit next to package.json. Packing a staging directory that
// contains only the runtime avoids the question entirely — the repository keeps
// its README, the profile only receives the plugin.
//
// The staged package.json is the repository one minus the fields that only mean
// something while developing (scripts, devDependencies).

import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), '..'))
const out = join(root, '.pack')

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const runtime = Array.isArray(pkg.files) ? pkg.files : []

/** Fields that only matter in the checkout, not in an installed copy. */
const DEV_ONLY = ['scripts', 'devDependencies']

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

for (const entry of runtime) {
  const target = join(out, entry)
  mkdirSync(dirname(target), { recursive: true })
  copyFileSync(join(root, entry), target)
}

const shipped = { ...pkg }
for (const field of DEV_ONLY) delete shipped[field]
writeFileSync(join(out, 'package.json'), `${JSON.stringify(shipped, null, 2)}\n`, 'utf8')

const listing = [...runtime, 'package.json']
console.log(`staged ${listing.length} file(s) into .pack/`)
for (const name of listing) console.log(`  ${name}`)