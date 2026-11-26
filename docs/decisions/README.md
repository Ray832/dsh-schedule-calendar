# 架构决策记录（ADR）

一条 ADR 只回答一个问题：**当时为什么这样定**。它不描述现状（那在 `docs/state.md`），
也不记录过程（那在 `docs/devlog/`）。一旦决定被推翻，**不删旧的**，把状态改成
`Superseded by NNNN` 并新建一条。

| 编号 | 决定 | 状态 |
|---|---|---|
| [0001](0001-host-and-client-halves.md) | 一个包两个半侧，宿主零外部依赖，两端只通过 HTTP 通信 | Accepted |
| [0002](0002-raw-json-schema-tools.md) | 工具必须编译成 raw JSON Schema，注册在全局层 | Accepted |
| [0003](0003-single-json-document.md) | 单文档 JSON + 原子写 + revision 轮询 | Accepted |
| [0004](0004-approval-gated-writes.md) | 所有模型写入都过审批门，文案列具体条目 | Accepted |
| [0005](0005-locale-from-ctx.md) | 客户端语言取自 `ctx.locale`，不看浏览器环境 | Accepted |
| [0006](0006-docs-and-logging.md) | AGENTS.md + state + devlog + ADR 四层文档交接 | Accepted |
| [0007](0007-reminder-tiers.md) | 提醒用三档表达，分钟数组只是派生 | Accepted |
| [0008](0008-one-tool-per-intent.md) | 一个意图一个工具：新增 update / complete，不改造 add | Superseded by 0009 |
| [0009](0009-completion-in-update.md) | 完成状态并入 `calendar_update`，工具回到四个 | Accepted |
| [0010](0010-runtime-only-package.md) | 发布包只装插件本体（5 个文件 + package.json） | Accepted |

## 什么时候该写一条

- 选择了一条**以后改起来很贵**的路（数据模型、进程边界、依赖取舍）。
- 出现了"看起来多余但必须如此"的代码——不写理由，后人一定会"优化"掉它。
- 试过另一条路并且失败，失败原因不会因为时间失效。

模板：

```markdown
# NNNN 一句话决定

- 状态：Proposed | Accepted | Superseded by NNNN
- 日期：YYYY-MM-DD
- 相关：相关文件或 devlog

## 背景
## 决定
## 后果
## 替代方案
```