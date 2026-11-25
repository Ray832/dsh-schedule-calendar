# 0009 完成状态并入 `calendar_update`

- 状态：Accepted
- 日期：2026-11-26
- 取代：[0008](0008-one-tool-per-intent.md)（其中"完成单独成工具"的部分）
- 相关：`src/tools.ts`、`docs/devlog/2026-11-26-v1.3.1-merge-complete-into-update.md`

## 背景

v1.3.0 按"一个意图一个工具"的判据，把"标记完成"做成了 `calendar_complete`，
理由是完成状态的触发词（完成/交了/参加了）需要独立的 description。

用户随后指出：`calendar_update` 已经能改一条日程的所有设置，完成状态**本来就是这条日程的一个字段**，
再单独开一个工具属于冗余——同一个写路径出现了两个入口，模型和人都要多记一份。

## 决定

把完成状态并进 `calendar_update`：

- `PATCH_PARAMETERS` 增加 `done: boolean`（`true` 完成、`false` 取消）；
- 工具从 5 个减到 4 个：`calendar_add` / `calendar_list` / `calendar_update` / `calendar_delete`；
- **触发词仍写在 update 的 description 里**："用户说做完了、交了、参加了、完成了就 `done: true`"；
- 审批门不新增分支：`update` 的摘要会列出 `状态/done: ☐ 未完成 → ✓ 完成`；
  当一次调用**只**改完成状态时，审批标题仍然显示"标记完成 / Mark done"（全为 false 时显示"取消完成 / Reopen"）；
- 结果文案同理：只改完成状态时渲染 `Marked done: …` / `Reopened: …`，混合修改才渲染字段清单。

## 后果

- 写日程信息只有一条工具路径，模型不用在两个工具之间做意图切分。
- 触发词从"独立工具的 description"转移到"update description 里的一段"，命中率靠措辞保证；
  `tests/tools.mjs` 断言 description 里同时出现 `done: true` 与 `done: false`，防止以后被删掉。
- 审批门的分派从四个工具降到三个（add / update / delete），分支更少。
- 代价：`calendar_update` 的 description 变长（现在要覆盖时间、地点、备注、提醒、完成五类），
  但每个工具定义本来就会整体注入，增加的那一句远小于一个额外工具的固定成本。

## 替代方案

- 保留两个工具（v1.3.0 的做法）：功能正确，但同一记录有两个写入口，用户已经判断为冗余。
- 让 `calendar_update` 支持 `done` 的同时删掉 `calendar_complete` 的 description 触发词：
  会把"标记完成"的识别质量压到 update 的通用描述上，所以触发词必须显式保留在 update 里。