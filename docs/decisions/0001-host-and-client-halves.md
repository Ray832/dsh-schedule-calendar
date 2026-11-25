# 0001 一个包、两个半侧；宿主零外部依赖

- 状态：Accepted
- 日期：2026-11-24
- 相关：`docs/devlog/2026-11-24-v1.0.0-first-release.md`

## 背景

DSH 插件同时在两个运行时里执行：宿主 node 进程（`lib/index.js`，裸 ESM 加载）和渲染进程
（`lib/client.cjs`，经 `window.__ModuleLoader__.load` 注入）。两者能用的 API 完全不同，
且宿主半侧不保证能解析 `@deepseek-ai/*` 私有包。

## 决定

1. 单个 npm 包同时提供两个入口：`exports["."]` → `lib/index.js`，`exports["./client"]` → `lib/client.js`。
2. 宿主半侧**只允许** import node 内置模块与相对路径，禁止任何 `@deepseek-ai/*`。
3. 两端唯一的通信方式是 HTTP：`ctx.webServer.register({kind:'prefix', path:'/api/dsh-calendar'})`，
   统一信封 `{ok:true,value}` / `{ok:false,error:{code,message}}`。
4. 客户端 React 从冻结模块表取（`external: react, react/jsx-runtime, react-dom, …`），
   由 `scripts/wrap.mjs` 套 loader 外壳。

## 后果

- 宿主半侧的崩溃面缩到最小：只依赖 node 标准库，跨版本升级不易碎。
- 客户端可以做纯前端热更新（改 `lib/client.cjs` 后刷新页面）。
- 代价：宿主能力（store、工具、提醒）必须逐个显式开成 HTTP 路由，共 24 条；
  路由是唯一契约，改路由 = 改协议，需同步两端。

## 替代方案

- 用 `@deepseek-ai/dsh-client-store` 做跨半侧状态同步：只能在客户端用，宿主侧无对等物，放弃。
- 宿主 import 宿主私有包（如 `@deepseek-ai/dsh-tools`）来注册工具：不需要，工具通过
  context 上的 `ctx.tools` 服务注册，仍然零 import，见 ADR 0002。