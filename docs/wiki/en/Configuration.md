# Configuration

**English** | [简体中文](配置)

The plugin registers two rows in **DSH → Settings → General**, styled like the built-in
General rows.

## Workday calendar

- Default: **China**.
- 24 countries/regions are available.
- Controls the source and colours of the workday / non-workday shading in the heatmap.
- China, Japan, South Korea and Russia use their own official holiday or production
  calendars; other countries use Nager.Date public holidays plus the local weekend rule — see
  [Data Sources](Data-Sources).

## Auto-update calendar

- Default: **1 month**.
- Options: 1 day / 1 week / 1 month / 3 months / 6 months / 1 year.
- The browser refetches holiday data on this interval; the refresh icon in the heatmap
  sidebar updates immediately at any time.

## localStorage keys

Board preferences live in `localStorage` under the `dsh.session-kanban.*` prefix:

| Key | Purpose |
| --- | --- |
| `dsh.session-kanban.filter.v2` | Active tab |
| `dsh.session-kanban.heatmap.v1` | Heatmap scale (year/month/week/day) and related state |
| `dsh.session-kanban.highlight.v1` | Workday / non-workday highlight toggles |
| `dsh.session-kanban.scope.v1` | Agent Team scope selection |
| `dsh.session-kanban.workspace.v1` | Workspace filter selection |
| `dsh.session-kanban.settings.v1` | Workday country and auto-update interval |
| `dsh.session-kanban.calendar.v2` | Cached holiday data per country |

For troubleshooting, inspect or reset them in the browser console:

```js
Object.keys(localStorage).filter((key) => key.startsWith('dsh.session-kanban.'));
localStorage.removeItem('dsh.session-kanban.calendar.v2');
```

## Theme

The plugin defines no custom colours: cards, dropdowns, buttons, tooltips and settings rows
reuse host tokens and primitives, so light/dark theme switches apply automatically.
