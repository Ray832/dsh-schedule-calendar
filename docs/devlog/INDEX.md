# 开发日志索引

**只追加到一张表，不重写历史条目。** 新条目加到最上面。
读法：先扫这张表定位，再读那一篇；不要通读整个目录。

`docs/state.md` 是现状快照，比这里重要；这里回答"当时发生了什么、为什么"。

| 日期 | 版本 | 主题 | 日志 |
|---|---|---|---|
| 2026-11-26 | 1.3.1 | v1.3.1 merge complete into update | [2026-11-26-v1.3.1-merge-complete-into-update.md](2026-11-26-v1.3.1-merge-complete-into-update.md) |
| 2026-11-26 | 1.3.0 | v1.3.0 手动完成与提醒三档 | [2026-11-26-v1.3.0-manual-done-and-reminder-tiers.md](2026-11-26-v1.3.0-manual-done-and-reminder-tiers.md) |
| 2026-11-26 | — | 建立日志与交接体系（AGENTS.md / state / devlog / ADR / docs:check） | [2026-11-26-docs-logging-system.md](2026-11-26-docs-logging-system.md) |
| 2026-11-26 | 1.2.0 | `calendar_delete`，问安排必须读日程，真机验证删除链 | [2026-11-26-v1.2.0-delete-tool.md](2026-11-26-v1.2.0-delete-tool.md) |
| 2026-11-25 | 1.1.0 | 模型经审批写入日程；工具静默不注册的根因 | [2026-11-25-v1.1.0-model-writes-events.md](2026-11-25-v1.1.0-model-writes-events.md) |
| 2026-11-24 | 1.0.0 | 从零做出日历/提醒/课表/规划并装机；Windows 环境与 Git 推送的坑 | [2026-11-24-v1.0.0-first-release.md](2026-11-24-v1.0.0-first-release.md) |

## 写新日志

```bash
npm run log:new -- "一句话主题"      # 生成 docs/devlog/YYYY-MM-DD-<slug>.md
npm run docs:check                   # 校验结构、索引、版本一致
```

小节是固定的：**目标 / 做了什么 / 为什么 / 踩到的坑 / 验证 / 遗留**。
中途放弃的任务也要写，写清"半成品在哪、下一步接什么"。
