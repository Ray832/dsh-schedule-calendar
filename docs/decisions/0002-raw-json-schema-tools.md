# 0002 工具必须是 raw JSON Schema，注册在全局层

- 状态：Accepted
- 日期：2026-11-25
- 相关：`docs/devlog/2026-11-25-v1.1.0-model-writes-events.md`

## 背景

用户要求"模型在任意 session 判断后写入日程"。DSH 的工具注册表
（`@deepseek-ai/dsh-tools`）`register(definition)` 接受的是 **raw JSON Schema**，
内部用 `assertSupportedJsonSchema` 校验一个受限子集；而 DSH 另一套 author DSL 是给人写顺手用的，
两者形状不同。

## 决定

1. 三个工具（`calendar_add` / `calendar_list` / `calendar_delete`）在 `src/tools.ts` 里用
   author DSL 书写，再由 `src/tool-schema.ts` 编译成 raw JSON Schema 后注册。
2. 编译结果在**注册前**先用本地 `validateRawSchema` 校验，失败立即抛出而不是交给注册表。
3. 注册失败必须 `logger.error`，成功打 `tools registered: …`；
   `tests/tools.mjs` 断言工具真的出现在注册表里。
4. 注册到**全局层**（`view()` 从 `layers.global` 起），而不是某个 agent preset。
5. 每个工具都要 `output.schema` + `output.render`，返回值由管线按 schema 校验。

## 后果

- 模型在**任何**会话都能看到这三个工具，符合"任意 session 可写入"的诉求。
- DSL→raw 的编译层必须与 DSH 版本同步演进；升级 DSH 时优先跑 `tests/tools.mjs`。
- 曾因缺少该编译层出现"工具静默不存在"（见 devlog v1.1.0），此后再不允许静默失败。

## 替代方案

- 直接手写 raw JSON Schema：少一层，但 `parameters` 的嵌套对象/枚举写起来冗长易错，且没有编译期检查。
- 只注册到某个 preset：不满足"任何 session"，放弃。