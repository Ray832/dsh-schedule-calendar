// Guard the handoff documents so they cannot rot quietly.
//
//   npm run docs:check
//
// Hard checks fail the run: file presence, package.json/doc version agreement,
// devlog structure, index agreement, ADR structure.
// Soft checks only warn: sources changed without a devlog entry in the same
// change set. Exit code 1 means at least one hard check failed.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), '..'))
const rel = (path) => path.slice(root.length + 1).replaceAll('\\', '/')

const checks = []
const warnings = []
/** Record one hard check. */
function check(label, ok, detail = '') {
  checks.push({ label, ok, detail })
}
/** Record one soft finding. */
function warn(text) {
  warnings.push(text)
}
/** Read a file with line endings normalized, or null when it does not exist. */
function read(path) {
  // CRLF is what a Windows editor (and some tooling) writes; structure checks
  // should not care which one a file happens to use.
  return existsSync(path) ? readFileSync(path, 'utf8').replaceAll('\r\n', '\n') : null
}

const statePath = join(root, 'docs', 'state.md')
const devlogDir = join(root, 'docs', 'devlog')
const indexPath = join(devlogDir, 'INDEX.md')
const decisionsDir = join(root, 'docs', 'decisions')
const decisionsIndex = join(decisionsDir, 'README.md')

// --- the four documents exist ------------------------------------------------
for (const path of ['AGENTS.md', 'docs/state.md', 'docs/devlog/INDEX.md', 'docs/decisions/README.md']) {
  check(`${path} exists`, existsSync(join(root, path)))
}

// --- the rulebook stays small enough to be injected -------------------------
// DSH injects AGENTS.md into the first request of every session with a 64 KiB
// budget per chain; a rulebook nobody can afford to load is a rulebook nobody
// reads.
const agentsPath = join(root, 'AGENTS.md')
if (existsSync(agentsPath)) {
  const bytes = Buffer.byteLength(readFileSync(agentsPath, 'utf8'), 'utf8')
  check('AGENTS.md fits the 64 KiB injection budget', bytes < 65536, `${(bytes / 1024).toFixed(1)} KiB`)
  if (bytes > 16384) warn('AGENTS.md is past 16 KiB — move detail into docs/state.md instead')
}

// --- version agreement -------------------------------------------------------
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const state = read(statePath)
const stateVersion = state?.match(/当前版本[：:]\s*\*{0,2}(\d+\.\d+\.\d+)/)?.[1]
check(
  'docs/state.md records the package version',
  stateVersion === pkg.version,
  stateVersion === undefined ? 'no “当前版本：X.Y.Z” line' : `state ${stateVersion} / package ${pkg.version}`,
)

// --- devlog structure --------------------------------------------------------
const REQUIRED_SECTIONS = ['## 目标', '## 做了什么', '## 为什么', '## 验证', '## 遗留']
const entries = existsSync(devlogDir)
  ? readdirSync(devlogDir)
      .filter((name) => name.endsWith('.md') && name !== 'INDEX.md' && !name.startsWith('_'))
      .sort()
  : []

for (const name of entries) {
  const text = read(join(devlogDir, name)) ?? ''
  const missing = REQUIRED_SECTIONS.filter((heading) => !text.includes(heading))
  check(`devlog ${name}: required sections`, missing.length === 0, missing.join(', '))

  const front = text.match(/^---\n([\s\S]*?)\n---/)
  check(`devlog ${name}: frontmatter`, front !== null)
  if (front !== null) {
    const date = front[1].match(/^date:\s*(\d{4}-\d{2}-\d{2})$/m)?.[1]
    const version = front[1].match(/^version:\s*(\S+)$/m)?.[1]
    check(`devlog ${name}: frontmatter date`, date !== undefined && name.startsWith(date), date ?? 'missing')
    check(`devlog ${name}: frontmatter version`, /^\d+\.\d+\.\d+$/.test(version ?? ''), version ?? 'missing')
  }
  if (!/## 踩到的坑/.test(text)) warn(`devlog ${name} has no “## 踩到的坑” section`)
}

// --- index agreement ---------------------------------------------------------
const index = read(indexPath)
if (index !== null) {
  const linked = new Set(
    [...index.matchAll(/\]\(([^)/]+\.md)\)/g)].map((hit) => hit[1]),
  )
  for (const name of entries) {
    check(`INDEX.md links ${name}`, linked.has(name))
  }
  for (const name of linked) {
    check(`INDEX.md target ${name} exists`, existsSync(join(devlogDir, name)))
  }
  const listedInOrder = [...linked].filter((name) => entries.includes(name))
  const dates = listedInOrder.map((name) => name.slice(0, 10))
  const descending = dates.every((date, at) => at === 0 || dates[at - 1] >= date)
  check('INDEX.md lists newest first', descending, descending ? '' : dates.join(' > '))
}

// --- ADR structure -----------------------------------------------------------
const adrs = existsSync(decisionsDir)
  ? readdirSync(decisionsDir).filter((name) => /^\d{4}-.+\.md$/.test(name)).sort()
  : []
check('docs/decisions holds at least one ADR', adrs.length > 0, `${adrs.length} found`)

for (const name of adrs) {
  const text = read(join(decisionsDir, name)) ?? ''
  const missing = ['## 背景', '## 决定', '## 后果'].filter((heading) => !text.includes(heading))
  check(`ADR ${name}: required sections`, missing.length === 0, missing.join(', '))
  check(`ADR ${name}: status line`, /状态[：:]\s*(Proposed|Accepted|Superseded)/.test(text))
  check(`ADR ${name}: date line`, /日期[：:]\s*\d{4}-\d{2}-\d{2}/.test(text))
}

const decisionsText = read(decisionsIndex)
if (decisionsText !== null) {
  const linked = new Set([...decisionsText.matchAll(/\]\((\d{4}-[^)/]+\.md)\)/g)].map((hit) => hit[1]))
  for (const name of adrs) check(`decisions/README.md links ${name}`, linked.has(name))
  for (const name of linked) check(`decisions/README.md target ${name} exists`, existsSync(join(decisionsDir, name)))
}

// --- soft: sources changed more recently than the handoff documents ----------
// mtime instead of git status on purpose: node cannot spawn git under the DSH
// sandbox (EPERM), and a fresh clone gives every file the same stamp, which
// stays quiet.
const ONE_MINUTE = 60_000
/** Every regular file under a directory, recursively. */
function filesUnder(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...filesUnder(full))
    else out.push(full)
  }
  return out
}
const newest = (paths) => Math.max(0, ...paths.map((path) => statSync(path).mtimeMs))
const sourceFiles = [...filesUnder(join(root, 'src')), join(root, 'package.json')]
const handoffFiles = [...filesUnder(devlogDir), statePath, join(root, 'AGENTS.md')]
const sourceAt = newest(sourceFiles)
const handoffAt = newest(handoffFiles)
if (sourceAt > handoffAt + ONE_MINUTE) {
  warn(
    `sources were touched after the handoff documents (${new Date(sourceAt).toISOString()}) — ` +
      'update docs/state.md and add a devlog entry',
  )
}

// --- report ------------------------------------------------------------------
let failed = 0
for (const item of checks) {
  console.log(`${item.ok ? 'PASS' : 'FAIL'}  ${item.label}${item.detail === '' ? '' : `  —  ${item.detail}`}`)
  if (!item.ok) failed += 1
}
for (const text of warnings) console.log(`WARN  ${text}`)

console.log('')
console.log(
  failed === 0
    ? `Handoff documents are consistent (${entries.length} devlog entries, ${adrs.length} ADRs).`
    : `${failed} check(s) failed.`,
)
process.exit(failed === 0 ? 0 : 1)