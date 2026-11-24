// Wrap the compiled CommonJS browser bundle in the loader factory the DSH
// shell executes. Run after esbuild produced lib/client.cjs.
//
// The shell calls `factory(require)` and reads `module.exports`; the baseline
// module table answers `react` and friends synchronously.

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const code = await readFile(join(root, 'lib/client.cjs'), 'utf8')

const wrapper = `window.__ModuleLoader__.load({
	id: ${JSON.stringify(pkg.name)},
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
${code}
		return module.exports;
	}
});
`

await writeFile(join(root, 'lib/client.js'), wrapper, 'utf8')
console.log(`built lib/client.js (${pkg.name}@${pkg.version}, ${wrapper.length} bytes)`)
