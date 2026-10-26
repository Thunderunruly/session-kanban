# DSH Session Kanban

A local plugin for **DeepSeek Harness (DSH)** that adds a session kanban board to the
Harness Web UI sidebar: every chat session's current work, todo list, and progress at a
glance, one click to jump back into the session.

> 中文说明见下方 [中文文档](#中文文档)。

## Features

- **Sidebar entry** — a panel icon next to the built-in panels; opens a kanban board.
- **Overview home** — session totals, running count, todo completion, and a GitHub-style
  activity heatmap with year / month / week / day scales.
- **Session cards** — current request & latest reply, todo progress bar, updated time,
  working directory, running state; click to open the session.
- **Quick actions** — pin / unpin, inline rename, fork, copy Session ID, archive (with
  confirmation), refresh, new session.
- **Tabs & search** — Overview / All / Running / With-todos / Completed, plus a search box
  that filters both the board and the overview aggregates.
- **Team scope** — filter the board by an Agent Team's member sessions when teams exist.
- **Workday calendar by country** — chooses the working calendar used by the heatmap
  shading; configured in DSH **Settings → General** (`工作日国家/地区`). 24 countries, China
  by default: China uses statutory holidays plus make-up workdays, other countries use
  public holidays with their local weekend rule.
- **Dynamic holiday data** — fetched from public APIs by the browser, cached locally
  (7-day TTL, per country), refreshed automatically and via a manual “更新” button;
  embedded China snapshot 2023–2026 keeps the board usable offline.
- **Native UI pieces** — dropdowns reuse the harness' own `Menu` primitive and settings
  rows match the built-in General rows, so light/dark theme changes apply automatically.
- **Scalable rendering** — masonry columns with `content-visibility` virtualization,
  automatic pagination when scrolling near the bottom, and an incremental detail pump for
  cold sessions.

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

The plugin is a local DSH bundle. In a DSH session, use the plugin manager:

```
install_bundle <absolute path to this folder>
```

or add it to the profile as a linked dependency and let `cordis.patch.yml` insert the row:

```json
"dependencies": {
  "@local/session-kanban-board": "link:F:/path/to/session-kanban"
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

- China calendar: [holiday-cn](https://github.com/NateScarlet/holiday-cn) mirrors
  (`cdn.jsdelivr.net`, then `raw.githubusercontent.com`).
- Other countries: [date.nager.at](https://date.nager.at) public holiday API.
- Requests are made directly by the browser (`fetch`, CORS-enabled public endpoints) and
  results are cached in `localStorage`; no credentials or personal data are sent.

## Notes

- Package name is `@local/session-kanban-board`; sidebar/panel slot id is `session-kanban`.
- Client preferences are stored under `dsh.session-kanban.*` keys in `localStorage`.
- Built as a local/experimental plugin, not an official DeepSeek product.

## 中文文档

DeepSeek Harness（DSH）本地插件：在 Web UI 左侧栏增加「会话看板」，集中展示每个会话的
当前工作、待办清单与完成进度，点击卡片即可跳回对应会话。

- 概览首页：会话总数、进行中数量、待办完成率、GitHub 风格活跃热力图（年/月/周/日）。
- 卡片支持置顶、重命名、分叉、复制 Session ID、归档、刷新、新建会话。
- Tab：概览 / 全部 / 进行中 / 有待办 / 已完成；搜索同时过滤列表与概览统计；有团队时可按团队过滤。
- **工作日国家/地区**在「设置 → 通用设置」中配置，默认中国；中国用法定节假日+调休，
  其他国家用公共假日+当地周末规则。数据由浏览器自动拉取并缓存（7 天 TTL，可按国家分别缓存），
  热力图左下显示数据状态与「更新」按钮；内置 2023–2026 中国数据用于离线兜底。
- 下拉框复用宿主 `Menu` 组件、设置行复用宿主 General 行样式，主题切换自动跟随。

安装：在 DSH 中用插件管理器 `install_bundle <本目录绝对路径>`（或作为 `link:` 依赖加入 profile），
之后重载一次 DSH 窗口即可；此后客户端改动支持热加载。

离线测试：

```powershell
cd tests
pnpm install
node fold-test.mjs
node render-test.mjs
```

数据来源：中国 holiday-cn 镜像；其他国家 date.nager.at；均为 CORS 公开接口，由浏览器直接请求并本地缓存，
不发送任何凭据或个人信息。
