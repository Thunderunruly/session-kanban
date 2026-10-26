# Usage

**English** | [简体中文](使用指南)

## Open the board

Click the **Session Kanban** panel icon in the left sidebar. The first screen is the
**Overview**; switch to **All** for the masonry card list.

## Overview page

- **Stat cards**: session totals, running, active today and todo completion (sessions with
  loaded details only).
- **Activity heatmap**: GitHub-style calendar, switchable between **year / month / week /
  day**; workdays and non-workdays are shaded for the country selected in Settings, with
  three legends (activity, workdays, non-workdays).
- **Year / month / week / day controls** follow the selected scale; the workday highlight
  toggles can be turned off independently.
- **Calendar status row** at the bottom of the heatmap sidebar: refresh icon · country ·
  last refresh date `YYYY/MM/DD` · data source, e.g. `↻ China · 2026/10/26 · Holiday CN`.
  Hover for the full status and workday rule; click the refresh icon to update immediately.

## Tabs

| Tab | Contents |
| --- | --- |
| Overview | Stats and heatmap; aggregates follow the search/scope filters |
| All | Every visible session as masonry cards |
| Running | Sessions currently running |
| With todos | Sessions with unfinished todos (including running ones) |
| Completed | Sessions with no unfinished todos: fully done, no todo list, or details not loaded yet |

The three content tabs together cover every session in **All**; nothing is left only in All.

## Search

The search box filters both the card list and the overview aggregates. It matches titles,
current work, latest reply, task text and the working directory. Clear it to reset.

## Scope filters

- **Team scope** (Scope): when Agent Teams exist, narrow the board to a team's Lead and
  member sessions.
- **Workspace**: narrow to one Workspace (defaults to **All workspaces**; hidden when only
  one exists; the choice is persisted). Child sessions that the host does not account to a
  Workspace directly inherit their parent Session's Workspace, so they are not lost when
  filtering by the parent's workspace.
- Team scope, Workspace, tabs and search **combine**.

## Card contents

- Status dot (running / idle) and relative update time.
- Title (inline rename described below).
- Session relationships: child cards show `↳ kind · parent title`, parent cards show
  `↳ N child sessions`; one family shares the same accent colour on the left edge and dots,
  and the parent title is clickable.
- Current work (running) or latest result (idle), plus the most recent request.
- Todo progress bar and list (up to four items, the rest collapsed).
- Working directory basename and hover actions.

## Card actions

Hover the card footer to reveal:

| Action | Description |
| --- | --- |
| Pin / Unpin | Pinned sessions sort first |
| Rename | Inline edit; sessions owned by subagent routing cannot be renamed — the action is disabled and hovering explains why |
| Fork | Create a new forked session from the latest completed turn |
| Copy Session ID | Copy the full session id |
| Archive | Confirmation required; if the archived session is the one held by the main view, the board reopens afterwards |
| Refresh / New session | Header buttons |

Keyboard: cards are focusable, Enter / Space opens the session; in the rename field Enter
commits and Escape cancels.

## Click handling

- Only clicking the card body opens a session; the footer toolbar does not navigate.
- Pressing and dragging beyond a threshold, or having a text selection, counts as drag or
  selection and does not open the session.
- Parent links, action buttons and the archive confirmation stop propagation themselves.
