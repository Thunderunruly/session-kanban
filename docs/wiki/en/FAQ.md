# FAQ

**English** | [简体中文](常见问题)

## The Session Kanban icon does not appear after installing

- Reload the DSH window (switching panels is not enough).
- Make sure the plugin is in the current profile:
  `dsh plugin --profile web add dsh-session-kanban`.
- Check the plugin manager for a `dsh-session-kanban` record.

## Archiving jumps back to the “new session” home

Fixed in 1.1.3: if the archived session is the one held by the main view, the board reopens
after the host clears the main view. If it still happens, confirm the version is ≥ 1.1.3 and
fully reload the window.

## Running / With-todos / Completed show fewer sessions than All

- That is the filter semantics: the three content tabs each cover one category, not
  pagination.
- Sessions whose details have not loaded yet are placed in Completed first and move to the
  right tab after loading.
- Team scope or workspace filters also narrow the tab results.

## A child card says “Parent session not visible”

The parent session is archived or not part of the visible catalog. The title is not
clickable in that case, to avoid a failed navigation.

## A subagent session cannot be renamed

Host limitation: sessions owned by subagent routing have their titles managed by that
routing, so the host rejects renames. The plugin disables the action and explains why on
hover.

## Child sessions are missing under a workspace filter

Since 1.1.4 child sessions inherit their parent's workspace. If something is still missing,
check that the parent belongs to that workspace (or that the host directly accounts the
session to another workspace) and report it with environment details.

## The workday shading is wrong

- Check the country in **Settings → General**.
- Click the refresh icon in the heatmap sidebar to refetch.
- Federal countries only support national holidays — see
  [Data Sources](Data-Sources).
- Some countries have no Nager.Date dataset yet and fall back to the weekend rule.

## A dropdown opens in an unexpected direction or size

Dropdowns measure the free space above/below the trigger and choose the direction and max
height automatically; long lists scroll inside the card. If it is still clipped, report the
position and window size.

## The UI does not change after upgrading

- Fully reload the window.
- Confirm the profile installed the new version
  (`dsh plugin --profile web add dsh-session-kanban@latest`).
- Restart DSH if the client bundle is still cached.

## What data is sent?

The plugin only fetches public holiday endpoints from the browser and caches results in
`localStorage`; no credentials, session contents or personal data are sent, and there is no
telemetry. See [Data Sources](Data-Sources).

## How to report an issue

Open a [GitHub Issue](https://github.com/Thunderunruly/session-kanban/issues) with:

- DSH version and plugin version;
- reproduction steps and a screenshot;
- console errors, if any.
