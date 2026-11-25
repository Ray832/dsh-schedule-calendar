# 0006 用 AGENTS.md + state + devlog + ADR 四层文档交接工作

- 状态：Accepted
- 日期：2026-11-26
- 相关：`AGENTS.md`、`docs/state.md`、`docs/devlog/`、`scripts/docs-check.mjs`

## 背景

这个项目要长期迭代：一个会话只做一小块，上下文却越滚越长，还要跨对话、跨机器接手。
事实是：**大多数成本不在写代码，而在重新发现"现在是什么状态、为什么是这样、上次踩过什么坑"**。
没有交接物时，新会话只能重读源码 + 重试失败路径，这是最贵的开销。

## 决定

四层，各管一件事，不混用：

| 层 | 文件 | 更新方式 | 何时被读 |
|---|---|---|---|
| 规则 | `AGENTS.md` | 改流程才动 | DSH 每次会话自动注入 |
| 现状 | `docs/state.md` | 覆盖式改写 | 每个会话开头 |
| 历史 | `docs/devlog/YYYY-MM-DD-*.md` + `INDEX.md` | 只追加 | 按关键词/索引检索 |
| 理由 | `docs/decisions/NNNN-*.md` | 新增 | 改对应模块前 |

配套强制手段：

1. `npm run log:new -- "<slug>"` 生成带固定小节（目标/做了什么/为什么/坑/验证/遗留）的日志骨架，
   杜绝"空日志"。
2. `npm run docs:check` 校验：`package.json` 版本 == `state.md` 版本行、每个 devlog 都在 INDEX 里、
   INDEX 没有死链、每篇日志六个小节齐全；并把"最近提交改了 `src/` 但没动 devlog"作为**警告**。
3. `docs:check` 挂在 `npm test` 里 → 收工必过。
4. `AGENTS.md` 里写死 Definition of Done，用清单而不是口号。

## 为什么是这几层而不是一个 CHANGELOG

- `CHANGELOG.md` 是**给用户看的**：只写可感知的变化，不含内部推理、失败尝试、环境坑。
- 单一日志文件会无限增长，读它 = 烧上下文；所以拆成"覆盖式快照 + 追加式历史 + 按需检索"。
- ADR 记录的是**不会因为时间失效的判断**（比如"宿主零 import"），值得单独沉淀；
  devlog 记录的是**过程**，可以过时。

## 后果

- 新会话的冷启动成本压到一页 `state.md`（约 150 行）。
- 每个任务多花几分钟写日志，换掉的是后人（或未来的自己）重新摸索的时间。
- `state.md` 一旦腐化，整套体系失效——所以 `docs:check` 把版本号一致性做成硬检查，
  把"src 变了但日志没动"做成警告。
- 规则写在 `AGENTS.md` 里由 DSH 自动注入，不依赖 agent 主动去读；这是选它而不是 README 的原因
  （DSH 的 `@deepseek-ai/dsh-agent-instructions` 会在项目根发现 `AGENTS.md` 并注入首请求）。

## 替代方案

- 只靠会话历史（`session_search`）：跨机器不可用，且需要上下文才能问对问题。
- 用 issue/PR 当日志：外部可见、但需要联网，离线时不可读，且散落在平台上。
- 让模型每次自动总结：不可控、易漂移，且没有稳定的结构可供脚本校验。