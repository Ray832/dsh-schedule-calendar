# 0010 发布包只装插件本体

- 状态：Accepted
- 日期：2026-11-26
- 相关：`package.json`（`files`、`release`）、`scripts/stage.mjs`、`docs/state.md` §1

## 背景

v1.x 的 `files` 除了运行时必需的文件，还带了 `README.md`、`README.zh.md`、`CHANGELOG.md` 和一个 `LICENSE`。
用户装插件时 DSH 会把整个包拉进 profile 的 `node_modules`——每次安装都多出只对开发者和 GitHub 读者有用的文档。

用户明确要求：安装只需要插件本体，开发规则、测试、文档、缓存都不该进去。

## 决定

两步走，因为单靠 `files` 做不到。

**第一步：`files` 只列运行时文件**

| 文件 | 谁需要它 |
|---|---|
| `lib/index.js` | 宿主半侧入口（`main` / `exports["."]`） |
| `lib/client.js` | 浏览器半侧入口（`dsh.client` 的 loader） |
| `cordis.patch.yml` | `dsh.bundle.patch` 指向的装配补丁，没有它插件不会被挂载 |
| `icon.svg` | `package.json.icon`，插件列表与详情页的图标 |
| `LICENSE` | MIT 要求许可声明随软件分发 |

**第二步：从暂存目录打包**

`files` 白名单**无法**排除 `README.md` 与 `LICENSE`——npm 把这两类文件列为"无论如何都打包"，
只要它们和 `package.json` 同级就一定会进 tarball（`CHANGELOG.md` 不受此限，已被排除）。
所以 `scripts/stage.mjs` 把上面 5 个文件加一份精简过的 `package.json` 复制到 `.pack/`
（去掉 `scripts`、`devDependencies`），再执行 `npm pack .pack --pack-destination dist`。
`.pack/` 里没有 README，tarball 里就不会有。

`npm run release` 已包含这一步。

## 后果

- 安装包正好 6 个条目：`package.json` + 上表 5 个文件。
- **插件库/详情页看不到 README**：卡片只有名称、description、icon。完整说明在仓库首页。这是有意接受的代价。
- 包里没有 `CHANGELOG.md`、`AGENTS.md`、`docs/`、`tests/`、`scripts/`、`src/`、`dist/` 或任何缓存。
- 多了一个构建步骤和一份"精简的 package.json"：装好的包里不再有 `scripts`/`devDependencies`，
  与仓库里的清单**不完全一致**。要排查"装上去的到底是哪个版本"，看 `npm view`/tarball 里的版本号即可。
- 从源码目录直接 `npm pack`（不经暂存）仍然会带 README——发布必须走 `npm run release`。

## 替代方案

- 只用 `.npmignore` 排除：黑名单对"新增文件"不安全，且同样拦不住 README，放弃。
- 把仓库 README 改名成非 README 名字：GitHub 首页就没有 README 了，代价远大于收益，放弃。
- 打包后手动改 tarball 删条目：等价于自己写 tar，出错面更大，且 npm 之后的 integrity 都失去意义，放弃。
- 连 `LICENSE` 也不发：违反 MIT 的"许可声明须随副本"，放弃。