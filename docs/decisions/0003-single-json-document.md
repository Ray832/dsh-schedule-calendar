# 0003 单文档 JSON 存储 + 原子写 + revision 轮询

- 状态：Accepted
- 日期：2026-11-24
- 相关：`src/store.ts`、`src/index.ts`（`state.rev` 路由）

## 背景

插件要存事件、课表、设置、规划，量级是"几百条"，单用户，单机。
同时要求用户能直接备份/查看（JSON 导出），并且面板开在多个窗口时不能互相踩。

## 决定

1. 全部数据放**一个** JSON 文档：`<DSH_HOME>/storages/dsh-schedule-calendar/calendar.json`。
2. 写路径：150 ms 防抖 → 写 `calendar.json.tmp` → `rename` 覆盖（原子）。
3. 读到损坏文件不做"静默重置"，改名 `calendar.json.broken-<ts>` 保留现场后重建空文档。
4. 内存里的 store 维护单调递增的 `revision`，每次 `update` 自增；暴露 `state.rev` 轻量路由，
   客户端每 6 s 轮询，变了才拉全量 `state.get`。
5. 时间字段一律本地墙钟字符串 `YYYY-MM-DDTHH:mm`。

## 后果

- 备份/恢复 = 拷一个文件；`npm test` 能在临时目录里跑完整读写。
- 没有并发写冲突：单进程单写者，rename 保证不会读到半个文件。
- 代价：数据量增长（>万条）时全量读写会变慢，且不能按字段做部分更新。当前量级不构成问题；
  真到那一步再讨论分片或 SQLite，届时需新 ADR。
- `revision` 是跨窗口一致性的唯一手段，**不要**改成文件 mtime 判断（防抖期间 mtime 会重复）。

## 替代方案

- SQLite（`node:sqlite`）：并发与查询更好，但引入 schema 迁移负担，且文件不再可手改/可读。
- 每个实体一个文件：目录扫描 + 部分损坏处理复杂，收益不明显。