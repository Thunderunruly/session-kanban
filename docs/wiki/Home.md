# DSH Session Kanban Wiki

DSH Session Kanban 是 **DeepSeek Harness（DSH）** 的会话看板插件：在 Web UI 左侧栏增加一块看板，
集中展示每个会话当前在做什么、最近结果、待办进度、运行状态与最近活跃时间，点击卡片即可跳回对应
会话，并带一个可切换年/月/周/日的活跃热力图。

- npm：[`dsh-session-kanban`](https://www.npmjs.com/package/dsh-session-kanban)
- 仓库：[Thunderunruly/session-kanban](https://github.com/Thunderunruly/session-kanban)
- 版本记录：[Releases](https://github.com/Thunderunruly/session-kanban/releases)
- English docs：[README.md](https://github.com/Thunderunruly/session-kanban/blob/main/README.md)

## 快速开始

```sh
dsh plugin --profile web add dsh-session-kanban
```

安装后重载一次 DSH 窗口，点击左侧栏的「会话看板」图标即可打开看板。更多方式见
[安装](Installation)。

## 文档导航

| 页面 | 内容 |
| --- | --- |
| [安装](Installation) | npm / 本地目录安装、升级、卸载、验证 |
| [使用指南](Usage) | 概览页、Tab、过滤、会话关系、卡片操作 |
| [配置](Configuration) | 工作日国家、日历自动更新、本地存储键 |
| [架构](Architecture) | 宿主投影、客户端注册、数据流与渲染 |
| [工作日数据源](Data-Sources) | 各国节假日来源、回退策略、已知限制 |
| [开发与测试](Development) | 离线测试、调试、发版流程 |
| [常见问题](FAQ) | 排查清单与常见疑问 |
| [版本记录](Releases) | 每个版本的变化与安装命令 |

## 功能一览

- **概览首页**：会话总数、进行中数量、待办完成率、活跃热力图（年 / 月 / 周 / 日），按国家标注
  工作日与非工作日。
- **会话卡片**：当前工作、最近结果、待办进度、工作目录、运行状态与更新时间。
- **Tab 与搜索**：概览 / 全部 / 进行中 / 有待办 / 已完成；三个内容 tab 覆盖全部可见会话，
  搜索同时过滤列表与概览统计。
- **过滤**：Agent 团队范围、工作区过滤（默认全部工作区，子会话沿父会话继承工作区）。
- **会话关系**：子代理 / 团队成员 / 分叉子会话显示关系标签与父会话链接，同一家族共享强调色。
- **快捷操作**：置顶、重命名、分叉、复制 Session ID、归档、刷新、新建会话。
- **原生外观**：复用宿主 `Menu` / `Tooltip` / `Button` 与 General 设置行样式，自动跟随主题。

## 截图

![概览页 — 中文界面](https://raw.githubusercontent.com/Thunderunruly/session-kanban/main/docs/screenshots/overview-zh.png)

![概览页 — 英文界面](https://raw.githubusercontent.com/Thunderunruly/session-kanban/main/docs/screenshots/overview-en.png)

