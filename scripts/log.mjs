// Scaffold one devlog entry so a session never ends without a written record.
//
//   npm run log:new -- "一句话主题"
//   node scripts/log.mjs "tool description tuning"
//
// Creates docs/devlog/YYYY-MM-DD-<slug>.md from the six-section template and
// inserts its row at the top of docs/devlog/INDEX.md. Idempotent enough: an
// existing file gets a -2, -3 suffix instead of being overwritten.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), '..'))
const devlogDir = join(root, 'docs', 'devlog')

const topic = process.argv.slice(2).join(' ').trim()
if (topic === '') {
  console.error('usage: npm run log:new -- "<topic>"')
  process.exit(1)
}

/** Local wall-clock date, not UTC: the log is read in the author's timezone. */
function today() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** ASCII slug for the filename; a Chinese topic keeps a stable readable stem. */
function slugify(text) {
  const ascii = text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return ascii === '' ? 'entry' : ascii.slice(0, 60)
}

const date = today()
const slug = slugify(topic)
let name = `${date}-${slug}.md`
for (let n = 2; existsSync(join(devlogDir, name)); n += 1) name = `${date}-${slug}-${n}.md`

const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version

const body = `---
date: ${date}
version: ${version}
tags: []
---

# ${topic}

## 目标

<!-- 这次要解决什么。用户的原话、验收标准。 -->

## 做了什么

<!-- 改动的文件、新增/删除的能力。写路径，不写“改了一些文件”。 -->

## 为什么

<!-- 关键取舍。为什么是这条路而不是另一条。 -->

## 踩到的坑

<!-- 失败的尝试同样要写：试过 X，因为 Y 失败。没有就写“无”。 -->

## 验证

<!-- 跑过的命令、测试套件、真机观察到的证据（日志 seq、磁盘文件、API 返回）。 -->

## 遗留

<!-- 明确没做的、留给下一次的。没有就写“无”。 -->
`

mkdirSync(devlogDir, { recursive: true })
writeFileSync(join(devlogDir, name), body, 'utf8')

const indexPath = join(devlogDir, 'INDEX.md')
const row = `| ${date} | ${version} | ${topic} | [${name}](${name}) |`
if (existsSync(indexPath)) {
  const index = readFileSync(indexPath, 'utf8')
  const header = '| 日期 | 版本 | 主题 | 日志 |'
  const at = index.indexOf(header)
  if (at < 0) {
    console.log(`! could not find the index table in ${indexPath}; add this row by hand:\n${row}`)
  } else {
    const tableStart = index.indexOf('\n', index.indexOf('\n', at) + 1) + 1
    writeFileSync(indexPath, `${index.slice(0, tableStart)}${row}\n${index.slice(tableStart)}`, 'utf8')
    console.log(`index row added to docs/devlog/INDEX.md`)
  }
} else {
  console.log(`! ${indexPath} is missing; create it before committing`)
}

console.log(`created docs/devlog/${name}  (version ${version})`)
console.log('')
console.log('Next:')
console.log('  1. fill in the six sections (a half-finished task still needs the state)')
console.log('  2. update docs/state.md — version, done list, new pitfalls, next step')
console.log('  3. npm run docs:check')