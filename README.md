# DSH Session Kanban

[![npm](https://img.shields.io/npm/v/dsh-session-kanban)](https://www.npmjs.com/package/dsh-session-kanban)

A local plugin for **DeepSeek Harness (DSH)** that adds a session kanban board to the
Harness Web UI sidebar: every chat session's current work, todo list, and progress at a
glance, one click to jump back into the session.

> 中文说明见下方 [中文文档](#中文文档)。

## Screenshots

Overview page — Chinese and English UI:

![Session board overview — 中文](https://raw.githubusercontent.com/Thunderunruly/session-kanban/main/docs/screenshots/overview-zh.png)

![Session board overview — English](https://raw.githubusercontent.com/Thunderunruly/session-kanban/main/docs/screenshots/overview-en.png)

## Features

- **Sidebar entry** — a panel icon next to the built-in panels; opens a kanban board.
- **Overview home** — session totals, running count, todo completion, and a GitHub-style
  activity heatmap with year / month / week / day scales.
- **Session cards** — current request & latest reply, todo progress bar, updated time,
  working directory, running state; click to open the session.
- **Quick actions** — pin / unpin, inline rename, fork, copy Session ID, archive (with
  confirmation), refresh, new session.
- **Tabs & search** — Overview / All / Running / With-todos / Completed, plus a search box
  that filters both the board and the overview aggregates. Running, With-todos and
  Completed cover every visible session: Completed also holds sessions without a todo
  list (or whose details have not loaded yet), so nothing is left only in All.
- **Team scope** — filter the board by an Agent Team's member sessions when teams exist.
- **Workday calendar by country** — chooses the working calendar used by the heatmap
  shading; configured in DSH **Settings → General** (`工作日国家/地区`). 24 countries, China
  by default. Countries with statutory make-up/transfer days or substitute holidays use
  their own datasets: China (holiday-cn), Japan (holiday-jp, incl. substitute and citizens'
  holidays), South Korea (holidays-kr, incl. substitute holidays), and Russia (isdayoff.ru
  production calendar, incl. transferred working weekends). Every other country uses
  public holidays from date.nager.at plus its local weekend rule.
- **Auto-update interval** — a second General row (`日历自动更新`) controls how often the
  calendar is refetched: 1 day / 1 week / 1 month (default) / 3 months / 6 months / 1 year.
- **Dynamic holiday data** — fetched from public APIs by the browser, cached locally per
  country and refetched on the configured interval (or immediately via the refresh icon in
  the heatmap sidebar). That sidebar keeps one compact row — refresh icon · country · last
  refresh date (YYYY/MM/DD) · source name, e.g. `↻ 中国 · 2026/10/26 · Holiday CN` or
  `↻ 日本 · 2026/10/26 · Holiday JP` — and leaves the full status and workday rule in
  tooltips. A dedicated source that is unreachable falls back to Nager.Date per year, and
  the shown source name follows the data actually in use. Embedded China snapshot
  2023–2026 keeps the board usable offline.
- **Native UI pieces** — dropdowns reuse the harness' own `Menu` primitive and size
  themselves to the free space beside the trigger (long lists scroll inside the card,
  opening below or above instead of being clamped over the trigger); card hover actions
  reuse the native Session-row action geometry and `Tooltip` bubble, and settings rows
  match the built-in General rows, so light/dark theme changes apply automatically.
- **Scalable rendering** — masonry columns, automatic pagination when scrolling near the
  bottom, and an incremental detail pump for cold sessions. Cards are laid out at their
  natural height (no intrinsic-size placeholder), so the last rows are never clipped.

## How it works

Two halves in one bundle:

- `index.js` — Host half. Registers the `sessionKanban` session projection, folding
  `user/message`, `assistant/message`, `turn/start`, `turn/end`, and `todo/write` into
  `{ request, reply, turn, endKind, todos, done, inProgress, total }` so cards can render
  without replaying session logs.
- `client.js` — Client half. Registers the sidebar entry (`sidebar.panellist`), the board
  panel (`main`), and the General-settings row (`settings.general.item`), then renders the
  board with React.
- `cordis.patch.yml` — bundle patch that inserts the plugin row into the profile.

## Install

From npm:

```sh
dsh plugin --profile web add dsh-session-kanban
```

From a local checkout, use the DSH plugin manager:

```
install_bundle <absolute path to this folder>
```

or add it to the profile as a linked dependency and let `cordis.patch.yml` insert the row:

```json
"dependencies": {
  "dsh-session-kanban": "link:F:/path/to/session-kanban"
}
```

Then reload the DSH window once so the client bundle enters the boot graph. After that,
client-only changes hot-reload in place.

## Development

Offline verification (no browser needed):

```powershell
cd tests
pnpm install
node fold-test.mjs      # Host projection fold
node render-test.mjs    # Client SSR render (zh + en, heatmap, tabs, scope, pagination)
```

`react` / `react-dom` are installed only for the SSR test; the browser bundle requires the
harness-provided `react` module at runtime.

## Structure

```
client.js           # browser half: sidebar entry, board panel, settings row
index.js            # host half: sessionKanban projection
cordis.patch.yml    # bundle patch inserting the plugin row
package.json        # bundle manifest (dsh.bundle / dsh.client)
locale/             # panel title & description dictionaries
icon.svg            # sidebar icon
tests/              # offline fold / SSR tests
```

## Data sources & privacy

- China: [holiday-cn](https://github.com/NateScarlet/holiday-cn) mirrors
  (`cdn.jsdelivr.net`, then `raw.githubusercontent.com`) — holidays plus make-up workdays.
- Japan: [holiday-jp](https://github.com/holiday-jp/holiday_jp) dataset (from the Cabinet
  Office holiday CSV; includes substitute holidays and citizens' holidays).
- South Korea: [holidays-kr](https://github.com/hyunbinseo/holidays-kr) (includes substitute
  holidays).
- Russia: [isdayoff.ru](https://isdayoff.ru) production calendar — holidays plus transferred
  working days.
- Every other country: [date.nager.at](https://date.nager.at) public holiday API plus the
  country's local weekend rule. National-level only; German states, Canadian provinces,
  Australian states, etc. need a subdivision selector to differ from their national lists.
  Nager.Date has no dataset for the UAE, Saudi Arabia, Israel, Thailand, Malaysia, or India
  yet, so those calendars currently show the weekend rule only until a dedicated source is
  added.
- Requests are made directly by the browser (`fetch`, CORS-enabled public endpoints) and
  results are cached in `localStorage`; no credentials or personal data are sent.

## Notes

- Package name is `dsh-session-kanban` (npm); sidebar/panel slot id is `session-kanban`.
- Client preferences are stored under `dsh.session-kanban.*` keys in `localStorage`.
- Built as a local/experimental plugin, not an official DeepSeek product.

## 中文文档

DeepSeek Harness（DSH）本地插件：在 Web UI 左侧栏增加「会话看板」，集中展示每个会话的
当前工作、待办清单与完成进度，点击卡片即可跳回对应会话。

- 概览首页：会话总数、进行中数量、待办完成率、GitHub 风格活跃热力图（年/月/周/日）。
- 卡片支持置顶、重命名、分叉、复制 Session ID、归档、刷新、新建会话。
- Tab：概览 / 全部 / 进行中 / 有待办 / 已完成；搜索同时过滤列表与概览统计；有团队时可按团队过滤。
  进行中 / 有待办 / 已完成 覆盖全部会话：没有待办清单（或详情尚未加载）的会话归入「已完成」，
  不会只出现在「全部」里。
- **工作日国家/地区**在「设置 → 通用设置」中配置，默认中国。有法定调休/补班或替代休日的国家
  使用各自的专门数据源：中国（holiday-cn，含调休补班）、日本（holiday-jp，含振替休日/国民休日）、
  韩国（holidays-kr，含替代休日）、俄罗斯（isdayoff.ru 生产日历，含调休工作日）；
  其他国家用 date.nager.at 公共假日 + 当地周末规则。**日历自动更新**同为通用设置中的一行，可选
  1 天 / 1 周 / 1 个月（默认）/ 3 个月 / 6 个月 / 1 年。数据由浏览器自动拉取并缓存（按国家分别缓存，
  按设定间隔重新获取，热力图侧栏的刷新图标可随时手动更新），专门源不可达时按年份回退到 Nager.Date，
  侧栏显示实际使用的来源；
  热力图侧栏底部只显示一行「刷新图标 · 国家 · 最近刷新日期（YYYY/MM/DD） · 数据来源」，
  例如 `↻ 中国 · 2026/10/26 · Holiday CN`；悬停可查看数据状态与标注规则，
  内置 2023–2026 中国数据用于离线兜底。
- 下拉框复用宿主 `Menu` 组件，并按触发器上下剩余空间自适应高度/方向（长列表在卡片内部滚动，
  不再被贴到视口底部挡住触发器）；卡片悬停操作按钮沿用宿主会话行的图标尺寸与 `Tooltip` 气泡样式，
  设置行复用宿主 General 行样式，主题切换自动跟随。

安装：`dsh plugin --profile web add dsh-session-kanban`（npm 发布后）；本地开发则在 DSH 中用插件管理器
`install_bundle <本目录绝对路径>`（或作为 `link:` 依赖加入 profile），
之后重载一次 DSH 窗口即可；此后客户端改动支持热加载。

离线测试：

```powershell
cd tests
pnpm install
node fold-test.mjs
node render-test.mjs
```

数据来源：中国 [holiday-cn](https://github.com/NateScarlet/holiday-cn) 镜像（含调休补班）；
日本 [holiday-jp](https://github.com/holiday-jp/holiday_jp)（含振替休日/国民休日）；
韩国 [holidays-kr](https://github.com/hyunbinseo/holidays-kr)（含替代休日）；
俄罗斯 [isdayoff.ru](https://isdayoff.ru) 生产日历（含调休工作日）；其他国家 date.nager.at。
均为 CORS 公开接口，由浏览器直接请求并本地缓存，不发送任何凭据或个人信息。
德国/加拿大/澳大利亚等国的州/省差异需要二级行政区选择器，目前只取各自的国家级公共假日。
Nager.Date 目前没有阿联酋、沙特、以色列、泰国、马来西亚、印度的数据，这些国家暂只按周末规则标注。
