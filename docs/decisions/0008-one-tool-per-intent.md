# 0008 一个意图一个工具：新增 update / complete，不改造 add

> **已被 [0009](0009-completion-in-update.md) 部分取代**：`calendar_update` 与
> `calendar_add` 分开的判断仍然有效（upsert 会诱导模型重发整条事件），但
> "完成状态单独成工具"被推翻了——完成是日程的一个字段，不该有两个写入口。

- 状态：Superseded by [0009](0009-completion-in-update.md)（"完成单独成工具"这一部分）
- 日期：2026-11-26
- 相关：`src/tools.ts`、`docs/devlog/2026-11-26-v1.3.0-manual-done-and-reminder-tiers.md`

## 背景

v1.3.0 要给模型两种新能力：改已有日程的字段，以及标记完成。
现有工具是 `calendar_add`（写新事件）/ `calendar_list` / `calendar_delete`。
摆在面前的选择是"把 add 扩展成 upsert"还是"新开工具"。

## 决定

新增两个工具，一个工具对应一个意图：

- `calendar_update` —— 按 id 打补丁（时间、标题、地点、备注、全天、提醒档位）
- `calendar_complete` —— 标记完成 / 取消完成（`done: false`）

`calendar_add` 保持"必须带 title + start"的创建语义，不承担 id 更新。
`calendar_list` 返回 `done` 与提醒摘要，作为这两者的前置查询。

## 为什么

1. **upsert 会诱导重复创建。** add 的必填字段是 title/start，模型在"改时间"时最省力的做法就是重发整条
   事件；一旦忘了带 id，就变成新建一条。分开以后，"改"必须给 id，"建"本来就没有 id，不会混淆。
2. **description 是模型行为的唯一触发器**（见 ADR 0002）。`calendar_complete` 的 description 可以直接写
   "用户说完成了/交了/参加了就调用"，而塞进 update 里的话，这句话会稀释 update 对"改时间"的触发。
3. **审批文案要不一样。** 完成/取消完成是一句话就够（"标记完成：3 条"），字段修改必须并列新旧值
   （`时间/time 2026-12-02 10:00 → 2026-12-03 14:00`）。一个审批门按工具名分派，比在一个工具里猜意图干净。
4. **工具数量不是成本的主要来源。** 每个工具定义约 200 token，五个工具在任何会话里都可接受；
   而一次误建重复事件的代价远高于这 200 token。

## 后果

- 工具总数到 5 个，`calendar_list` 的 description 要同时指向 update / complete / delete 三个下游。
- 审批门按工具名分派四种摘要（add / update / complete / delete），`installApprovalGate` 的 if 链是显式的，
  新增写操作工具时**必须**同时在这里加一支，否则会静默绕过审批——`tests/tools.mjs` 对四个写工具各有一条断言。
- `calendar_update` 的 `done` **不开放**：完成只有一条路径，避免两个工具写同一个字段。

## 替代方案

- 扩展 add 为 upsert：见上，放弃。
- 一个 `calendar_edit` 同时管字段和完成状态：审批文案与触发词都要混合两种意图，放弃。
- 只给 update，不给 complete（用 `calendar_update {done:true}`）：模型对"标记完成"的触发词命中率会下降，
  而这正是用户明确要求的能力。