// Install doctor: why is the plugin not showing up?
//
//   node scripts/doctor.mjs [--profile desktop]
//
// Reads this machine's DSH profile and checks every step between "the package
// exists" and "the plugin is running". Exit code 1 means at least one check
// failed.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), '..'))
const args = process.argv.slice(2)
const profileIndex = args.indexOf('--profile')
const profileName = profileIndex >= 0 ? (args[profileIndex + 1] ?? 'desktop') : 'desktop'
const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
const profile = join(home, 'profiles', profileName)
const pkgName = 'dsh-schedule-calendar'

/** Every source file under a directory. */
function sources(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...sources(full))
    else if (/\.tsx?$/.test(entry.name)) out.push(full)
  }
  return out
}

const checks = []
/** Record one check. */
function check(label, ok, detail = '') {
  checks.push({ label, ok, detail })
}

check('DSH home exists', existsSync(home), home)
check(`profile "${profileName}" exists`, existsSync(profile), profile)

let manifest = null
const manifestPath = join(profile, 'package.json')
if (existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    check('profile manifest is readable', true, manifestPath)
  } catch (error) {
    check('profile manifest is readable', false, String(error))
  }
}

if (manifest !== null) {
  const dep = manifest.dependencies?.[pkgName]
  check('declared in profile dependencies', dep !== undefined, dep ?? 'missing — install it from Settings → Plugins')
  const bundles = manifest.dsh?.profile?.bundles ?? []
  const at = bundles.indexOf(pkgName)
  check('listed in dsh.profile.bundles', at >= 0, at >= 0 ? `position ${at + 1}/${bundles.length}` : 'missing — enable the bundle')
}

const installed = join(profile, 'node_modules', pkgName)
check('resolvable from the profile', existsSync(installed), installed)

const hostBuilt = join(root, 'lib', 'index.js')
const clientBuilt = join(root, 'lib', 'client.js')
check('host half built', existsSync(hostBuilt), existsSync(hostBuilt) ? '' : 'run `npm run build`')
check('browser half built', existsSync(clientBuilt), existsSync(clientBuilt) ? '' : 'run `npm run build`')

if (existsSync(clientBuilt)) {
  const newest = Math.max(0, ...sources(join(root, 'src')).map((file) => statSync(file).mtimeMs))
  const built = statSync(clientBuilt).mtimeMs
  check('build is newer than the sources', built >= newest, built >= newest ? '' : 'stale build — run `npm run build`')
}

const dataDir = join(home, 'storages', pkgName)
const dataFile = join(dataDir, 'calendar.json')
check(
  'plugin data directory exists',
  existsSync(dataDir),
  existsSync(dataDir) ? dataDir : 'not yet — restart DSH after enabling the bundle',
)
check('calendar document exists', existsSync(dataFile), existsSync(dataFile) ? dataFile : 'written on the first saved change')

let failed = 0
for (const item of checks) {
  console.log(`${item.ok ? 'PASS' : 'FAIL'}  ${item.label}${item.detail === '' ? '' : `  —  ${item.detail}`}`)
  if (!item.ok) failed += 1
}
console.log(failed === 0 ? '\nAll checks passed.' : `\n${failed} check(s) failed.`)
process.exit(failed === 0 ? 0 : 1)
