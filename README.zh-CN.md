# DSH 会话看板

[![npm version](https://img.shields.io/npm/v/dsh-session-kanban?color=cb3837&logo=npm)](https://www.npmjs.com/package/dsh-session-kanban)
[![npm downloads](https://img.shields.io/npm/dm/dsh-session-kanban)](https://www.npmjs.com/package/dsh-session-kanban)
[![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Thunderunruly/session-kanban?style=social)](https://github.com/Thunderunruly/session-kanban)

[English](https://github.com/Thunderunruly/session-kanban/blob/main/README.md) | **简体中文**

**DeepSeek Harness（DSH）** 的会话看板插件：在 Web UI 左侧栏增加一块看板，集中展示每个会话
当前在做什么、最近结果、待办进度、运行状态与最近活跃时间，点击卡片即可跳回对应会话。

## 截图

_概览页，中文界面。_

![会话看板概览 — 中文界面](https://raw.githubusercontent.com/Thunderunruly/session-kanban/main/docs/screenshots/overview-zh.png)

_概览页，英文界面。_

![会话看板概览 — 英文界面](https://raw.githubusercontent.com/Thunderunruly/session-kanban/main/docs/screenshots/overview-en.png)

## 目录

- [功能](#功能)
- [环境要求](#环境要求)
- [安装](#安装)
- [使用](#使用)
- [配置](#配置)
- [实现原理](#实现原理)
- [工作日日历数据源](#工作日日历数据源)
- [隐私](#隐私)
- [开发](#开发)
- [项目结构](#项目结构)
- [已知限制](#已知限制)
- [许可证](#许可证)

## 功能

- **侧栏入口**：内置面板旁新增一个图标，点击打开会话看板。
- **概览首页**：会话总数、进行中数量、待办完成率，以及 GitHub 风格活跃热力图（年 / 月 /
  周 / 日），并按所选国家标注工作日与非工作日。
- **会话卡片**：当前工作与最近结果、待办进度条、更新时间、工作目录、运行状态；点击卡片
  （或按 Enter / 空格）打开会话。
- **快捷操作**：置顶 / 取消置顶、行内重命名、分叉、复制 Session ID、归档（需确认）、刷新、
  新建会话。子代理路由持有的会话无法重命名（按钮禁用）；若归档的是主视图当前持有的会话，
  归档后会自动重新打开看板，而不是跳回「新对话」首页。
- **Tab 与搜索**：概览 / 全部 / 进行中 / 有待办 / 已完成，外加一个同时过滤列表与概览统计的
  搜索框。三个内容 tab 覆盖全部可见会话：已完成是兜底分类（全部完成、没有待办清单或详情
  尚未加载），因此不会出现只存在于「全部」里的会话。
- **会话关系**：子代理 / 团队成员 / 分叉产生的子会话卡片会显示关系标签，并可点击父会话
  标题直接跳转；父会话卡片显示当前视图内可见的子会话数量。同一个父会话家族共享一种强调色
  （父会话与子会话的左侧色边、关系行圆点同色），瀑布流里被打散也能对上是哪一家的子会话。
- **过滤**：Agent 团队范围（有团队时可用）与工作区过滤（默认「全部工作区」，只有一个工作区
  时自动隐藏，选择会记忆）可与 tab、搜索叠加生效。
- **自适应下拉**：选项框复用宿主 `Menu` 组件，按触发器上下剩余空间自动选择展开方向与高度，
  长列表在卡片内部滚动。
- **原生外观**：卡片悬停操作沿用宿主会话行的图标几何与 `Tooltip` 气泡，设置行复用 General
  行样式，浅色 / 深色主题自动跟随。
- **可扩展渲染**：瀑布流列、滚动接近底部时自动分页、为冷会话增量加载详情；卡片按自然高度
  布局，最后一行不会被裁切。

## 环境要求

- **DeepSeek Harness（DSH）**，需支持 Web UI 与插件（开发与验证基于 DSH `0.2.1-rc.3`
  桌面端 profile）。
- 插件包为 ESM（`"type": "module"`），运行时直接复用宿主提供的 `react`，不打包额外依赖。
- `node` + `pnpm` 仅离线测试需要。

## 安装

从 npm 安装到 DSH profile：

```sh
dsh plugin --profile web add dsh-session-kanban
```

安装后重载一次 DSH 窗口，让客户端 bundle 进入启动图；此后客户端改动支持热加载。

### 从本地目录安装

在 DSH 插件管理器里执行：

```
install_bundle <本目录绝对路径>
```

或者把目录作为 `link:` 依赖加入 profile，由 `cordis.patch.yml` 自动插入插件行：

```json
"dependencies": {
  "dsh-session-kanban": "link:F:/path/to/session-kanban"
}
```

安装后同样重载一次窗口。

## 使用

1. 点击左侧栏的 **会话看板** 面板图标打开看板。
2. **概览** 页展示会话总数、待办完成率与活跃热力图；热力图可在 **年 / 月 / 周 / 日** 之间
   切换，工作日国家在设置中选择。
3. 切到 **全部** 查看瀑布流卡片列表；每张卡片显示当前工作、最近结果、待办、工作目录与
   更新时间。
4. **点击卡片**跳回对应会话；悬停卡片底部可执行置顶、重命名、分叉、复制 Session ID、归档。
5. 用 tab、Agent 团队范围、工作区过滤和搜索框收窄列表，所有过滤条件会叠加。
6. 热力图侧栏底部保留一行紧凑状态：刷新图标 · 国家 · 最近刷新日期（`YYYY/MM/DD`）· 数据来源，
   例如 `↻ 中国 · 2026/10/26 · Holiday CN`；悬停可查看完整状态与标注规则，点击刷新图标可
   立即更新。

## 配置

设置项注册在 **DSH → 设置 → 通用设置**：

| 设置 | 默认值 | 可选值 | 作用 |
| --- | --- | --- | --- |
| **工作日国家/地区** | 中国 | 24 个国家/地区 | 决定热力图工作日 / 非工作日的标注来源 |
| **日历自动更新** | 1 个月 | 1 天 / 1 周 / 1 个月 / 3 个月 / 6 个月 / 1 年 | 浏览器重新获取节假日数据的间隔 |

看板偏好（tab、搜索范围、工作区过滤、热力图刻度、高亮开关）保存在 `localStorage` 的
`dsh.session-kanban.*` 键下，重载后自动恢复。

## 实现原理

一个 bundle 里包含宿主端与客户端两半：

- **`index.js`** — 宿主端。注册 `sessionKanban` 会话投影，把 `user/message`、
  `assistant/message`、`turn/start`、`turn/end`、`todo/write` 折叠为
  `{ request, reply, turn, endKind, todos, done, inProgress, total }`，卡片无需重放会话日志
  即可渲染。
- **`client.js`** — 客户端。注册侧栏入口（`sidebar.panellist`）、看板主面板（`main`）与
  通用设置行（`settings.general.item`），并用 React 基于宿主 `Menu` / `Tooltip` / `Button`
  原语渲染看板。
- **`cordis.patch.yml`** — bundle patch，把插件行插入 profile。

## 工作日日历数据源

节假日数据由浏览器直接从公开、支持 CORS 的接口拉取，并按国家缓存在 `localStorage`。专门源
不可达时按年份回退到 Nager.Date，界面显示的来源名称与当前实际使用的数据一致。

| 国家/地区 | 数据源 | 说明 |
| --- | --- | --- |
| 中国 | [holiday-cn](https://github.com/NateScarlet/holiday-cn) 镜像（jsDelivr，其次 raw.githubusercontent.com） | 法定节假日、调休补班与调整后的周末 |
| 日本 | [holiday-jp](https://github.com/holiday-jp/holiday_jp) | 内阁府节假日，含振替休日与国民休日 |
| 韩国 | [holidays-kr](https://github.com/hyunbinseo/holidays-kr) | 含替代休日 |
| 俄罗斯 | [isdayoff.ru](https://isdayoff.ru) | 生产日历，含调休工作日 |
| 其他国家 | [date.nager.at](https://date.nager.at) | 公共假日 + 当地周末规则 |

内置 2023–2026 中国数据快照，离线时看板仍可用。

## 隐私

- 仅由浏览器向上述公开接口发起请求。
- 结果缓存在 `localStorage`；不发送任何凭据、会话内容或个人信息。
- 插件不包含遥测。

## 开发

离线测试，无需浏览器：

```powershell
cd tests
pnpm install
node fold-test.mjs      # 宿主投影折叠
node render-test.mjs    # 客户端 SSR 渲染（zh + en、热力图、tab、范围、分页）
```

`react` / `react-dom` 仅供 SSR 测试使用；浏览器 bundle 运行时使用宿主提供的 `react`。
项目没有构建步骤，`client.js` 以单文件模块 bundle 直接加载。

## 项目结构

```
client.js           # 客户端：侧栏入口、看板面板、设置行
index.js            # 宿主端：sessionKanban 投影
cordis.patch.yml    # 插入插件行的 bundle patch
package.json        # bundle 清单（dsh.bundle / dsh.client）
locale/             # 面板标题与描述词典
icon.svg            # 侧栏图标
docs/screenshots/   # README 截图
tests/              # 离线折叠 / SSR 测试
```

## 已知限制

- 节假日数据目前只到**国家级**。德国、加拿大、澳大利亚、西班牙、瑞士等联邦制国家的州/省
  节假日不一致，需要二级行政区选择器，暂未实现。
- Nager.Date 目前没有阿联酋、沙特、以色列、泰国、马来西亚、印度的数据集，这些国家暂时只按
  周末规则标注，等待后续接入专门数据源。
- 这是本地 / 实验性插件，不是 DeepSeek 官方产品。

## 许可证

[MIT](LICENSE) © Thunderunruly
