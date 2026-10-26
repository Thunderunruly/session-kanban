# Architecture

**English** | [简体中文](架构)

## Bundle layout

```
client.js           # client half: sidebar entry, board panel, settings rows, styles
index.js            # host half: sessionKanban projection
cordis.patch.yml    # bundle patch inserting the plugin row into the profile
package.json        # bundle manifest (dsh.bundle / dsh.client)
locale/             # panel title and description dictionaries
icon.svg            # sidebar icon
```

## Host half (index.js)

Registers the `sessionKanban` session projection, folding these events into the minimal
state a card needs:

- `user/message`, `assistant/message`
- `turn/start`, `turn/end`
- `todo/write`

Projection values:

```
{ request, reply, turn, endKind, todos, done, inProgress, total }
```

The client can therefore render cards without replaying session logs.

## Client half (client.js)

Registers:

- `sidebar.panellist` — the sidebar entry and icon;
- `main` — the board page;
- `settings.general.item` — the Workday calendar and Auto-update rows.

Rendering is based on host UI primitives (`Button` / `Menu` / `Tooltip` / `Input` /
`SegmentedTabs`, …) without extra UI dependencies.

## Data flow

- **Session list**: `ctx.sessions.list` supplies titles, running state, update time, parent
  session and other basics.
- **Detail projections**: sessions whose projection values are not part of the list are
  fetched with `ctx.remote.session.projections`; requests are ordered by recent activity,
  run serially and are budgeted to 200 sessions to avoid flooding large catalogs.
- **Workspaces**: `ctx.workspaces.list` supplies `items` (including each workspace's
  `sessionIds`), `archivedSessionIds` and `pinnedSessionIds`.
- **Preferences**: `localStorage` — see [Configuration](Configuration).

## Rendering

- Three masonry columns (responsive); cards lay out at their natural height (no
  `content-visibility` placeholders);
- Automatic pagination (60 per page) when scrolling near the bottom;
- Tabs only change filters; overview aggregates, heatmap and header counts follow the
  current filter result.

## Relationships and workspace inheritance

- Subagent, team member and fork sessions link to their parent through the host's
  `parentSession`.
- The client resolves relations and a per-family accent colour along the parent chain; a
  parent and all of its children share one colour.
- Workspace membership prefers the host registry's direct accounting; sessions without a
  direct entry inherit their parent's workspace, so the workspace filter never hides child
  sessions. Cycles are guarded and direct accounting wins.

## Navigation

- Open a session: `ctx.uiWorkspace.openSession`.
- Archive: `ctx.workspaces.archiveSession`; if the target is the session retained by the
  main view, the host clears the main view, and the plugin reopens the board afterwards via
  `ctx.get('layout').selectPanel(PANEL_ID)`.
- Fork: `ctx.uiWorkspace.forkSession`, then opens the child session.
