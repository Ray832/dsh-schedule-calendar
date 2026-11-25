# AGENTS.md — dsh-schedule-calendar 工作约定

本文件是 DSH 在**每次会话首次请求时自动加载**的项目级规则（项目根 = 含 `.git` 的目录），
也是这个仓库对 agent 的唯一强制入口。目标是两件事：

1. **省 token**——新会话不必重新读源码就能知道"现在到哪一步了"；
2. **可交接**——任何一次改动，无论成功、失败还是中途放弃，都留下后人能看懂的说明。

---

## 0. 开工前（按顺序，不要跳步）

1. 读 `docs/state.md`（≤200 行）。**这就是上下文缓存**：当前版本、已完成、已知坑、下一步。
2. 只在需要时读历史，**不要通读 devlog**：
   - 定位：看 `docs/devlog/INDEX.md` 的表，或 `grep -il "<关键词>" docs/devlog/*.md`
   - 改动某模块前，读 `docs/decisions/` 里相关的 ADR，弄清"为什么是这个设计"
3. `npm run docs:check` 确认基线是绿的。

> 跨会话交接的打开方式：新开一个会话，第一句说
> 「继续 dsh-schedule-calendar，读 docs/state.md 后再动手」即可。

---

## 1. 收工前必须留下什么（Definition of Done）

一个任务只有同时满足下面全部条件才算完成：

- [ ] `npm run build && npm run typecheck && npm test` 全绿
- [ ] 新增 `docs/devlog/YYYY-MM-DD-<slug>.md`（用 `npm run log:new -- "<slug>"` 生成）
- [ ] 更新 `docs/state.md`：版本、已完成项、新踩的坑、下一步
- [ ] 在 `docs/devlog/INDEX.md` 补一行
- [ ] 对外行为变了 → 更新 `CHANGELOG.md`；用法变了 → 更新 `docs/usage.md` 与 `docs/usage.zh.md`
- [ ] 做了不可逆的架构选择 → 在 `docs/decisions/` 新增 ADR
- [ ] `npm run docs:check` 通过

**任务中途被打断也要写日志**：写清"做到哪、半成品在哪、下一步接什么"，比不写强得多。

---

## 2. 四类文档各管什么（不要混用）

| 位置 | 写什么 | 更新方式 | 谁读 |
|---|---|---|---|
| `AGENTS.md` | 规则本身 | 改流程时才动 | 每个会话，自动加载 |
| `docs/state.md` | 当前事实快照 | **覆盖式**改写 | 每个会话开头 |
| `docs/devlog/` | 每次工作的过程与结论 | **只追加，不改写历史** | 需要追溯时按关键词检索 |
| `docs/decisions/` | 为什么这样设计（长期有效） | 新增，旧的可标 Superseded | 改动该模块前 |
| `CHANGELOG.md` | 用户能感知的变化 | 按版本追加 | 用户 / 外部读者 |

写日志的硬要求：

- 日期一律 `YYYY-MM-DD`；时间用本机本地时间并注明时区（Asia/Shanghai）。
- 写**为什么**，不只写做了什么；失败的尝试同样要记（"试过 X，因为 Y 失败"能省掉后人一次试错）。
- 引用具体路径、命令、row id、commit sha，不写"改了一些文件"这种废话。
- 不写个人隐私、token、密码。

---

## 3. 环境与构建（Windows，都是踩过的坑）

- **esbuild**：走 npm script 会 `EPERM spawn`。直接调
  `node_modules/@esbuild/win32-x64/esbuild.exe src/index.ts --bundle ...`。
- **npm**：一律加 `--cache E:/Dsh_Schedule/.npm-cache`。
- **热重载**：宿主半侧 `lib/index.js` 改完自动 HMR 重载；客户端 `lib/client.cjs` 需刷新页面
  （除非 `pnpm run dev:web` 在跑）。
- **锁**：桌面应用运行时持有 profile 的 `package.json.lock`；改 profile 文件需 `danger-full-access`，
  改完要重启应用才生效（bundle 列表是启动时快照）。
- **推送**：代理走 `127.0.0.1:7897`，`-c http.sslBackend=openssl`，临时 askpass 脚本传 token，
  推完立刻删除。细节见 `docs/devlog/2026-11-26-v1.2.0-delete-tool.md`。

---

## 4. 架构红线（破了会静默失效，最难查）

- 宿主 `lib/index.js` **零 `@deepseek-ai/*` import**，只用 node 内置和相对路径。
- 工具定义必须是 **raw JSON Schema**（`assertSupportedJsonSchema` 会拒 DSL），
  DSL→raw 的编译在 `src/tool-schema.ts`。
- **所有写操作必须过审批门**：`tools/pre-execute` 返回 `{kind:'ask'}`，且 prompt 里要写出
  人看得懂的条目（不是裸 id）。
- 客户端只能 `window.__ModuleLoader__.load({id, factory})`，React 从冻结模块表取；
  语言走 `ctx.locale`，**不是** `navigator.language`。
- 数据是单文档 `calendar.json`：150ms 防抖 + tmp 文件 rename 原子写；损坏文件改名
  `.broken-<ts>` 而不是丢弃。
- **工具描述是模型行为的唯一触发器**：想让模型多做一件事，先改 `description`，再改代码。
- 时间一律用本地墙钟字符串 `YYYY-MM-DDTHH:mm`，不用 epoch。

---

## 5. 版本与发布

- 语义化版本；`npm run release` = build + test + `npm pack` 到 `dist/`。
- 发布顺序：改版本号 → `CHANGELOG.md` → `docs/state.md` → `git tag vX.Y.Z` → push →
  GitHub Release（tarball 也从 `dist/` 上传）。
- `docs:check` 会校验 `package.json` 版本与 `docs/state.md` 的版本行一致。