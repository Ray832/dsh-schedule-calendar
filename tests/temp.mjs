// Throwaway DSH_HOME for the test suites.
//
//   const home = await makeTempHome('dshc-smoke-')
//
// Prefers the OS temp directory. Under the DSH sandbox the session's temp
// directory can exist while refusing new subdirectories (EPERM) — for example
// after it was recreated by something other than the runtime — so the helper
// falls back to this repo's .tmp/tests, which the sandbox always allows. Either
// path is disposable; callers remove it when they finish.

import { mkdirSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), '..'))

export async function makeTempHome(prefix) {
  try {
    return await mkdtemp(join(tmpdir(), prefix))
  } catch (error) {
    if (error.code !== 'EPERM' && error.code !== 'EACCES' && error.code !== 'ENOENT') throw error
    const fallback = join(root, '.tmp', 'tests')
    mkdirSync(fallback, { recursive: true })
    return await mkdtemp(join(fallback, prefix))
  }
}