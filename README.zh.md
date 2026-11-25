# dsh-schedule-calendar

给 [DeepSeek Harness](https://deepseek.com) 用的日程插件：日历、提醒、课表和长期任务规划，还能让模型听懂一句话就帮你记下来。

English docs: [README.md](./README.md).

## 功能

左侧栏多一个「日程」页面，里面三个页签：

- **日历**：月视图、周视图、单日议程。新建 / 编辑 / 删除 / 打勾完成，支持每天、工作日、每周、每两周、每月重复。
- **提醒**：到点弹出应用内浮层（可稍后提醒、直接完成），并可同时发系统通知和提示音；支持免打扰时段。
- **课表**（可关闭）：设置学期周数与节次时间，按单双周排课；三种录入方式——粘贴文字让 AI 解析、手动填表、导入教务系统导出的 CSV。
- **长期规划**：一个目标拆成若干里程碑，每个里程碑带截止日和完成状态，自动算整体进度。
- **一句话添加**：在对话框里说「明天下午三点组会，提前十分钟提醒」，或在日历页的快速输入框里直接写一句，不用离开页面。

详细操作步骤见 [docs/usage.zh.md](./docs/usage.zh.md)。

数据只存一份，在 `$DSH_HOME/storages/dsh-schedule-calendar/calendar.json`，跨工作区共享；可导出 ICS 日历文件或 JSON 备份。

界面中英双语，跟随 DSH 的界面语言。

## 安装

目前还没发到 npm，直接从仓库装：

```bash
# 打好的 v1.0.0 标签
dsh plugin --profile <profile> add github:Ray832/dsh-schedule-calendar#v1.0.0

# 或者 Release 页里的打包文件
dsh plugin --profile <profile> add https://github.com/Ray832/dsh-schedule-calendar/releases/download/v1.0.0/dsh-schedule-calendar-1.0.0.tgz

# 或者本地目录，用于开发
dsh plugin --profile <profile> add link:/path/to/dsh-schedule-calendar
```

也可以在界面里：**设置 → 插件 → 安装**，然后启用。

要求 DSH `>=0.2.1-rc.3 <0.3.0`。

### 装完为什么没出现

插件列表是启动时读取的，所以刚装好的插件要重启一次桌面版（或在「设置 → 插件」里启用这个 bundle）才会加载。桌面版运行时会一直占着 profile 的写锁，命令行装不进去，用界面里的插件页安装即可。

判断有没有真的挂上：启动后 `<DSH_HOME>/storages/dsh-schedule-calendar/` 这个目录会被创建，没有这个目录就说明条目没加载。

`npm run doctor` 会把这条链路上的每一步都查一遍，逐行打印 PASS/FAIL：profile 清单、插件列表、能否解析、构建是否比源码新、宿主端有没有挂载过。

### 关于对话里的工具

任何会话里，模型都可以直接读写你的日程，不用回到插件页面：

- **`calendar_list`** —— 按日期区间读日程（含重复日程的每一场），并返回每条日程的 id。凡是答案取决于「你已经排了什么」的问题——「接下来我有哪些安排」「下周有什么」「周四我有空吗」——它都会先调这个工具，而不是凭印象回答。
- **`calendar_add`** —— 写入一条或多条日程。模型会先在对话里跟你确认内容，调用时还会再弹一次授权确认，任何一步拒绝都不会落库。
- **`calendar_delete`** —— 按 `calendar_list` 返回的 id 删除，同样要过授权；授权框会列出即将被删掉的日程名称。删除作用于整条存储的日程，所以重复日程的每一场都会一起消失。

三个工具注册在全局工具层，所有 agent 都能用；写入后日历页会自动刷新（页面轮询一个轻量的版本号）。写入类工具依赖 profile 里的授权服务，没有该服务时会拒绝执行而不是静默改动。

## 隐私

日历数据不会写进对话记录，也不会离开本机。前后端通信用的是插件自己的 `/api/dsh-calendar/*` 路由，并由 DSH 的连接校验拦截，应用外部访问一律拒绝。

## 开发

```bash
npm install
npm run build      # esbuild 生成 lib/index.js 与 lib/client.js
npm run typecheck
node tests/smoke.mjs
```

## 许可

MIT
