# 0004 所有模型写入都必须过审批门

- 状态：Accepted
- 日期：2026-11-25（add）、2026-11-26 扩展到 delete
- 相关：`src/tools.ts` 的 `installApprovalGate`

## 背景

模型可以"判断该加一条日程"，但判断错、时间理解错、抓错 id 都会直接改用户的真实计划。
删除尤其不可逆。

## 决定

1. 任何**写**操作（`calendar_add`、`calendar_delete`；将来 `calendar_update`）都必须经过
   `tools/pre-execute` waterfall：返回 `{kind:'ask', reason, displayReason}` 触发 `approval.request()`。
2. 只读操作（`calendar_list`）不审批——审批疲劳会让用户无脑点允许。
3. 审批文案必须**列出人看得懂的条目**（名字 + 时间），绝不能只有 id；
   超过 5 条截断并标 `…N more`。
4. 文案双语（宿主没有 locale 服务）：`写入日程 / Add to calendar`、`删除日程 / Delete from calendar`。
5. 拒绝路径（`rejected` / `cancelled` / `unavailable`）返回结构化失败，不得退化成"静默成功"。

## 后果

- 用户在允许前一定会看到要改什么；误删不可逆但不会"无声"发生。
- 每次写操作多一次交互，是有意付出的成本。批量删除也一次授权、多条列明。
- 审计可追：`approval/asked` 与 `approval/decided` 都在 session log 里，事后能还原谁批准了什么。

## 替代方案

- 只对删除审批、添加直接写：误加一条日程同样是用户的时间成本，放弃。
- 用 `displayReason` 只给一行摘要：信息不足，用户等于盲签，放弃。