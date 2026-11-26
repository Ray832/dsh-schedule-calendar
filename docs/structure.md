# 项目导览（docs/structure.md）

> 一页看懂这个仓库里都是什么、哪些会随插件安装、哪些只是开发用。
> 更细的模块职责见 `docs/state.md` §2，规则见 `AGENTS.md`。

## 1. 三种文件，边界很清楚

| 类别 | 路径 | 会不会装进 DSH 的 profile？ |
|---|---|---|
| **运行时本体** | `lib/index.js`、`lib/client.js`、`cordis.patch.yml`、`icon.svg`、`LICENSE`、`package.json` | **会**，正好这 6 个（经 `.pack/` 暂存打包，见下） |
| 开发资产 | `src/`、`tests/`、`scripts/`、`docs/`、`AGENTS.md`、`README*.md`、`CHANGELOG.md` | 不会 |
| 本机中间产物 | `node_modules/`、`lib/client.cjs`、`dist/`、`.pack/`、`.tmp/`、`.npm-cache/` | 不会（且被 `.gitignore` 忽略） |

> **为什么要有 `.pack/`**：npm 无论 `files` 怎么写，都会把 `package.json` 同级的 `README.md` 和
> `LICENSE` 打进 tarball。所以 `scripts/stage.mjs` 先把运行时 5 个文件 + 精简过的 `package.json`
> 复制到 `.pack/`，再 `npm pack .pack`——暂存目录里没有 README，包里就不会有。
> 直接 `npm pack` 会多带 README，**发布只走 `npm run release`**。

## 2. 根目录

| 路径 | 是什么 |
|---|---|
| `package.json` | 包清单：版本、`files` 白名单、`dsh.bundle.patch`、`dsh.client.inject`、脚本 |
| `cordis.patch.yml` | 告诉 DSH 加载器把 `dsh-schedule-calendar` 插进插件树的那一行 YAML |
| `lib/index.js` | **构建产物**：宿主半侧（ESM，node 进程里跑） |
| `lib/client.js` | **构建产物**：浏览器半侧（CJS，外面包了一层 `window.__ModuleLoader__.load`） |
| `lib/client.cjs` | 构建中间物：给 `scripts/wrap.mjs` 套壳用的原始 bundle（git 忽略） |
| `lib/index.js.map` | 宿主的 sourcemap，本地调试用，不进包 |
| `icon.svg` | 插件图标 |
| `LICENSE` | MIT，随包分发 |
| `AGENTS.md` | **工作规则**，DSH 每次会话自动注入（见 ADR 0006） |
| `README.md` / `README.zh.md` | 面向使用者的说明（安装、工具、隐私） |
| `CHANGELOG.md` | 面向使用者的版本变更 |
| `.gitattributes` | 统一行尾为 LF（Windows 上也有意义） |
| `.gitignore` | 忽略 `node_modules/`、`lib/client.cjs`、`dist/`、`.tmp/`、`.research*/`、`.backups/`、`.npm-cache/`、`AGENTS.local.md` |

## 3. `src/` —— 源码（真正的插件）

宿主半侧（node，零 `@deepseek-ai/*` 依赖）：

| 文件 | 职责 |
|---|---|
| `index.ts` | 插件入口 `apply()`：存储、提醒引擎、24+ 条 HTTP 路由、注册工具、装审批门 |
| `tools.ts` | 四个模型工具（add/list/update/delete）+ 注册 + 审批门（含新旧值对比） |
| `tool-schema.ts` | 工具 author DSL → DSH 需要的 raw JSON Schema 编译器 |
| `notify.ts` | `ReminderEngine`：15s 扫描、按档位取提醒、静音时段、snooze |
| `remind.ts` | 提醒三档：档位→分钟数展开、钳制、旧数据迁移、中英文案 |
| `store.ts` | 单文档 `calendar.json`：原子写、revision、损坏文件隔离、旧数据归一 |
| `repeat.ts` | 重复规则展开（每天/每周/每月/工作日/每两周），occurrence key |
| `ai.ts` | 一句话解析日程 / 课表（调 DSH 的模型服务，输出严格 JSON） |
| `ics.ts` | ICS 导入导出 |
| `types.ts` | 两端共享的数据结构 |

浏览器半侧（`src/client/`，React 18）：

| 文件 | 职责 |
|---|---|
| `index.tsx` | 注册三个 slot：侧栏入口、主面板、全屏提醒浮层 |
| `Page.tsx` | 面板外壳：标签页、6 秒轮询 `state.rev` 同步、统一 mutate |
| `CalendarView.tsx` | 月/周/日视图；日议程每行可勾选完成 |
| `EventEditor.tsx` | 新建/编辑弹窗 |
| `ReminderField.tsx` | 三档提醒控件（编辑器、设置页共用） |
| `Timetable.tsx` | 课表格子与课程编辑 |
| `Plan.tsx` | 长期规划（目标 + 里程碑 + 进度） |
| `Settings.tsx` | 设置页（课表开关、默认提醒档、静音、通知、数据导入导出） |
| `QuickAdd.tsx` | 一句话添加的输入框与预览 |
| `NoticeHost.tsx` | 提醒浮层（完成 / 关闭 / 稍后提醒） |
| `i18n.ts` | 中英词条 + `useT()` |
| `api.ts` / `dates.ts` / `csv.ts` / `io.ts` / `css.ts` / `Icon.tsx` | 请求、日期、CSV、导入导出、样式、图标 |

## 4. `tests/` —— 不依赖 DSH 的离线测试

| 文件 | 覆盖 |
|---|---|
| `smoke.mjs` | 把宿主半侧挂进假 cordis 上下文，逐条跑路由 |
| `tools.mjs` | 工具 schema、执行、审批文案、完成与更新往返 |
| `notify.mjs` | 提醒引擎（假时钟）：档位梯子、完成不提醒、长 snooze |
| `remind.mjs` | 档位展开、钳制、旧数据迁移、文案 |
| `repeat.mjs` | 重复规则展开 |
| `client.mjs` | 浏览器 bundle 的 loader 行、导出、slot 声明 |
| `i18n.mjs` | 词条是否都被使用且都有翻译 |
| `temp.mjs` | 临时 DSH_HOME（`%TEMP%` 不可写时回退到 `.tmp/tests`） |

## 5. `scripts/` —— 开发与发布脚本

| 文件 | 用途 |
|---|---|
| `wrap.mjs` | 给 client bundle 套 `window.__ModuleLoader__.load` 外壳 |
| `doctor.mjs` | 11 项安装链路自检（`npm run doctor`） |
| `docs-check.mjs` | 交接文档一致性（`npm run docs:check`，`npm test` 的第一步） |
| `log.mjs` | 生成 devlog 骨架并登记索引（`npm run log:new`） |
| `stage.mjs` | 把运行时文件暂存到 `.pack/`，供 `npm pack` 打出只有本体的包 |
| `gh-token.ps1` | 从 Windows 凭据库取推送 token（本机唯一可行路径） |

## 6. `docs/` —— 交接文档

| 路径 | 用途 |
|---|---|
| `state.md` | **现状快照**，每个会话先读它 |
| `devlog/` | 只追加的开发日志 + `INDEX.md` 索引 |
| `decisions/` | ADR：为什么这样设计 |
| `usage.md` / `usage.zh.md` | 详细使用说明 |
| `structure.md` | 本页 |

## 7. 本机中间产物（不提交、不进包）

| 路径 | 内容 | 能不能删 |
|---|---|---|
| `node_modules/` | 依赖（esbuild、typescript、类型包） | 能，`npm install` 可重建 |
| `.pack/` | 发布暂存目录（`scripts/stage.mjs` 每次重建） | 能，随时可删 |
| `.npm-cache/` | 本项目专用的 npm 缓存 | 能，但下次安装会变慢 |
| `dist/` | `npm pack` 出来的历史 tarball | 能，任何版本都能从对应 commit 重新打 |
| `.tmp/` | 一次性脚本、探针、解析中间件 | 能，随时可删 |
| `.research*/`、`.backups/` | 早期调研与 profile 备份 | 能，属于历史遗留 |

## 8. 一次改动的典型路径

```bash
# 改代码
edit src/...            # 宿主或浏览器半侧
npm run build           # esbuild → lib/index.js + lib/client.js（套壳）
npm run typecheck
npm test                # docs:check + 6 个离线套件

# 留痕
npm run log:new -- "这次做了什么"
# 填六小节 → 改 docs/state.md → npm run docs:check

# 发布
npm run release         # build + test + stage（.pack/）+ npm pack 到 dist/
git tag vX.Y.Z && git push --tags
```