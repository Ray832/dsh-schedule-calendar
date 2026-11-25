# 当前状态（docs/state.md）

> 这是**覆盖式**更新的现状快照，不是历史。历史在 `docs/devlog/`，设计理由在 `docs/decisions/`。
> 每个会话开始读这一页就够开工；改动完成后必须回来更新它。

- 当前版本：**1.2.0**
- 最后更新：2026-11-26（Asia/Shanghai）
- 状态：**可发布、可用**。宿主与客户端都已在本机 DSH 加载并实测通过。
- 一句话：给 DSH 加日历 + 提醒 + 课表 + 长期规划，并让模型能经审批写入日程。

---

## 1. 它是怎么跑起来的

一个 npm 包，两个半侧：

| 半侧 | 产物 | 运行位置 | 约束 |
|---|---|---|---|
| Host | `lib/index.js`（ESM，约 600 行入口） | DSH 宿主 node 进程 | 零 `@deepseek-ai/*` import；提供 HTTP 路由 + 工具 + 提醒轮询 |
| Client | `lib/client.cjs`（CJS + `window.__ModuleLoader__`） | 浏览器 / 渲染进程 | 只能从冻结模块表取 React 18；语言走 `ctx.locale` |

装配：`package.json` 的 `dsh.bundle.patch` → `cordis.patch.yml` → `- insert: [{id: schedule-calendar, name: dsh-schedule-calendar}]`。

宿主 API 全走 HTTP：`ctx.webServer.register({kind:'prefix', path:'/api/dsh-calendar'})`，
信封 `{ok:true,value}` / `{ok:false,error:{code,message}}`，业务错误也返回 HTTP 200，
权限拒绝才 403（`ctx.connection.requestRejection`），请求体上限 4 MB。

UI 占三个 slot：`sidebar.panellist`（入口）、`main`（面板本体）、`shell.overlay`（弹窗提醒）。

---

## 2. 代码地图（改之前先看这里）

宿主半侧：

| 文件 | 行数 | 职责 |
|---|---|---|
| `src/index.ts` | 605 | 插件入口：store/engine/router/tools/审批门/24 条路由 |
| `src/tools.ts` | 400 | 三个工具定义（add/list/delete）+ `registerCalendarTools` + `installApprovalGate` |
| `src/tool-schema.ts` | 204 | 工具 author DSL → raw JSON Schema 编译器 + 校验 |
| `src/notify.ts` | 279 | `ReminderEngine`：15s tick、12h 回看、30min 过期、静音时段 |
| `src/ai.ts` | 258 | 一句话解析：`parseEvents` / `parseCourses`（纯规则，不调模型） |
| `src/ics.ts` | 219 | ICS 导入导出 |
| `src/store.ts` | 211 | 单文档存储、`revision` 计数器、原子写 |
| `src/types.ts` | 138 | 全部数据结构 |
| `src/repeat.ts` | 137 | 重复展开 `expandEvent` / `expandAll`，occurrence key `${eventId}@${stamp}` |

客户端半侧（`src/client/`）：`index.tsx`（注册）· `Page.tsx`（外壳 + 6s 轮询 `state.rev`）·
`CalendarView` · `EventEditor` · `Timetable`（最大，513 行）· `Plan` · `Settings` · `QuickAdd` ·
`NoticeHost`（提醒浮层）· `i18n.ts`（289 行，165 条词条）· `api.ts` · `dates.ts` · `csv.ts` · `io.ts` · `css.ts` · `Icon.tsx`。

配套：`scripts/wrap.mjs`（给 client bundle 套 loader 壳）、`scripts/doctor.mjs`（11 项自检）、
`tests/` 六个套件（smoke/tools/notify/repeat/client/i18n）。

---

## 3. 数据

- 单文档：`<DSH_HOME>/storages/dsh-schedule-calendar/calendar.json`
  （本机：`C:\Users\Asus\.dsh\storages\dsh-schedule-calendar\calendar.json`）
- 写入：150 ms 防抖 → 写 `.tmp` → rename；损坏文件改名 `calendar.json.broken-<ts>` 保留现场。
- `revision` 每次 `update` 自增，客户端 6 s 轮询 `state.rev` 做跨窗口同步。
- 时间一律**本地墙钟字符串** `YYYY-MM-DDTHH:mm`，无时区、无 epoch。
- 日程与课表**完全独立**，互不引用（用户明确要求）。

---

## 4. 工具与审批（v1.1–v1.2 的核心）

三个工具注册在**全局层**，所有 agent 都能看到：

- `calendar_add` — 写事件，必须过审批
- `calendar_list` — 读事件，返回 id（删改的前提）
- `calendar_delete` — 按 id 删，必须过审批

链路：`tools/pre-execute`（waterfall）→ 返回 `{kind:'ask', reason, displayReason}` →
`approval.request()` → `allowed-once` / `rejected` / `cancelled` / `unavailable`。
审计事件 `approval/asked`、`approval/decided` 落在 session log 里。
审批文案是双语且**列具体条目**（`· 学术会议 — 2026-12-02 10:00`），不是裸 id。

> 关键认知：**模型的触发完全靠 tool description**。想让模型多调一次工具，改 description，别指望 prompt。

---

## 5. 已完成

- v1.0.0 — 日历、事件增删改、重复规则、提醒（浮层 + 系统通知 + 声音）、课表（AI 粘贴 / 手动 / CSV）、
  长期规划（目标 + 里程碑 + 进度）、ICS 导入导出、JSON 备份、中英双语、单文档存储。
- v1.1.0 — 模型可在任意 session 经审批写入日程（`calendar_add` / `calendar_list`）。
- v1.2.0 — `calendar_delete`；`calendar_list` 返回 id 并明确"何时该调用"。
- 2026-11-26 — 建立日志/交接体系（本文件、`AGENTS.md`、`docs/devlog/`、`docs/decisions/`、`docs:check`）。

---

## 6. 待办 / 明确没做

- [ ] 把 `.tmp/timetable.csv`（28 门课，来自 2026 学年度第一学期陆志博课程表）导入插件——
  解析早已完成，**是用户还没决定要不要导入**。
- [ ] GitHub 上为 v1.1.0 / v1.2.0 打 tag 与 Release（用户未要求，别自作主张）。
- [ ] 发布到 npm（未要求）。
- [ ] 工具层目前只有 add/list/delete；`calendar_update`、`calendar_search` 未做。
- [ ] 课表与日历仍独立；若要联动需新 ADR。

---

## 7. 已知坑（新踩到的往上加）

1. 工具定义写成 author DSL → 注册表 `assertSupportedJsonSchema` 抛错，被 try/catch 吞掉，
   **表现是"工具静默不存在"**。现在 `tools.ts` 注册失败会 `logger.error` 并有 `tests/tools.mjs` 兜着。
2. 客户端语言曾按 `navigator.language` 判断 → 中文系统显示英文。已改 `ctx.locale`。
3. 静音时段被抑制的提醒重启后会重放 → 已持久化 `recorded` 标记并补了回归测试。
4. 改 `lib/index.js` 后宿主自动 HMR；改 `lib/client.cjs` **必须刷新页面**。
5. 桌面应用运行中持有 profile `package.json.lock`，CLI 装插件会卡住；bundle 列表是启动快照。
6. esbuild 经 npm script 会 `EPERM spawn`；直接调 `node_modules/@esbuild/win32-x64/esbuild.exe`。
7. Git 推送：旧代理已死，用 7897 + openssl backend + 临时 askpass，推完删脚本。

---

## 8. 怎么验证

```bash
npm run typecheck                 # tsc --noEmit
npm test                          # 6 套：smoke/tools/notify/repeat/client/i18n
npm run doctor                    # 11 项环境与包结构自检
npm run docs:check                # 状态/日志/索引一致性
npm run release                   # build + test + pack 到 dist/
```

注意：本机 `npm run build` 里的 esbuild 会 EPERM，需要按 `AGENTS.md` §3 直接调二进制。

---

## 9. 文档地图

| 文件 | 用途 |
|---|---|
| `AGENTS.md` | 工作规则（DSH 自动加载） |
| `docs/state.md` | 本页，现状快照 |
| `docs/devlog/INDEX.md` | 历史索引，先看表再决定读哪篇 |
| `docs/decisions/` | ADR：为什么这样设计 |
| `CHANGELOG.md` | 用户可感知的变化 |
| `README.md` / `README.zh.md` | 安装与使用 |
| `docs/usage.md` / `docs/usage.zh.md` | 详细用法 |