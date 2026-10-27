# Release Notes

**English** | [简体中文](版本记录)

Full notes and source archives for every release are on
[GitHub Releases](https://github.com/Thunderunruly/session-kanban/releases); published
versions are listed on the
[npm package](https://www.npmjs.com/package/dsh-session-kanban).

| Version | Highlights |
| --- | --- |
| [v1.1.5](https://github.com/Thunderunruly/session-kanban/releases/tag/v1.1.5) | Forked sessions are treated as independent top-level sessions (no parent relation, no child-session count and no "parent session not visible"); archived parents of real child sessions keep their title with an "archived" marker |
| [v1.1.4](https://github.com/Thunderunruly/session-kanban/releases/tag/v1.1.4) | Hover explanation for disabled actions (subagent rename); workspace filter inherits child sessions through the parent chain |
| [v1.1.3](https://github.com/Thunderunruly/session-kanban/releases/tag/v1.1.3) | Session relationship cards (relation kind, parent link, child count, family accent); board reopens after archiving the main-view session |
| [v1.1.2](https://github.com/Thunderunruly/session-kanban/releases/tag/v1.1.2) | Workspace filter; host default `md` header buttons; disabled rename for subagent sessions; clipped last cards fixed; stray heatmap scrollbar hidden |
| [v1.1.1](https://github.com/Thunderunruly/session-kanban/releases/tag/v1.1.1) | Tabs classify every session (Running / With-todos / Completed cover all); detail budget raised from 80 to 200 |
| [v1.1.0](https://github.com/Thunderunruly/session-kanban/releases/tag/v1.1.0) | Multi-country workday calendars (CN/JP/KR/RU); calendar auto-update interval; compact calendar row; adaptive dropdowns; native hover actions and header buttons; archived sessions hidden from tabs and counts |
| [v1.0.0](https://www.npmjs.com/package/dsh-session-kanban/v/1.0.0) | First stable release: sidebar board, overview stats and heatmap, cards and quick actions, tabs and search |

## Install a specific version

```sh
dsh plugin --profile web add dsh-session-kanban@1.1.4
```

## Upgrade

```sh
dsh plugin --profile web add dsh-session-kanban@latest
```

Reload the DSH window after upgrading.

