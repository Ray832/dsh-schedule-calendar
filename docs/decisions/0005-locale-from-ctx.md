# 0005 客户端语言取自 `ctx.locale`，不看浏览器环境

- 状态：Accepted
- 日期：2026-11-24
- 相关：`src/client/i18n.ts`、`docs/devlog/2026-11-24-v1.0.0-first-release.md`

## 背景

首版在中文 Windows 上显示英文。原因：`document.documentElement.lang` 不存在，
`navigator.language` 反映的是**操作系统**语言，而 DSH 自己的语言设置是独立状态。

## 决定

1. `dsh.client.inject` 声明 `locale`，插件通过 `ctx.locale.getLocale().active` 取语言。
2. 用 `useSyncExternalStore` 订阅 `ctx.locale.subscribe`，用户切语言时 UI 即时跟随。
3. 词典集中在 `src/client/i18n.ts`，`tests/i18n.mjs` 校验：**词条全部被使用且全部有翻译**。
4. 宿主侧没有 locale 服务，所以宿主的用户可见文案（审批提示、工具描述）一律双语硬编码。

## 后果

- 面板语言与 DSH 设置一致，切换即时生效，不依赖 OS。
- 新增文案必须同时进词典，否则 `tests/i18n.mjs` 红——这是刻意设的门槛。
- 工具 description 是英文（模型侧），审批文案中英各一份（人侧）。

## 替代方案

- 读 `localStorage` / `navigator.language`：与 DSH 设置不同步，已证伪。
- 在宿主注入语言：宿主无此服务，只能双语文案。