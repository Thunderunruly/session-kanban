# Installation

**English** | [简体中文](安装)

## Requirements

- **DeepSeek Harness (DSH)** with the Web UI and plugin support. Developed and verified
  against DSH `0.2.1-rc.3` (desktop profile).
- The package is ESM (`"type": "module"`) and reuses the host-provided `react` at runtime;
  no extra runtime dependency is bundled.
- `node` + `pnpm` are only needed for the offline tests, not for normal use.

## Install from npm

```sh
dsh plugin --profile web add dsh-session-kanban
```

**Reload the DSH window once** so the client bundle enters the boot graph. After that,
client-only changes hot-reload.

Install a specific version:

```sh
dsh plugin --profile web add dsh-session-kanban@1.1.4
```

Upgrade to latest:

```sh
dsh plugin --profile web add dsh-session-kanban@latest
```

## Install from a local checkout

Use the DSH plugin manager:

```
install_bundle <absolute path to this folder>
```

Or add the folder as a linked dependency and let the bundled `cordis.patch.yml` insert the
plugin row into the profile:

```json
"dependencies": {
  "dsh-session-kanban": "link:F:/path/to/session-kanban"
}
```

Reload the window once after installing.

## Verify

1. A **Session Kanban** panel icon appears in the left sidebar.
2. Clicking it opens the overview page (stat cards + activity heatmap).
3. **Settings → General** shows the “Workday calendar” and “Auto-update calendar” rows.

## Uninstall

Remove `dsh-session-kanban` from the profile dependencies and reload the window; the entry,
settings rows and styles are removed with it. Board preferences in `localStorage`
(`dsh.session-kanban.*`) are not cleared automatically.

## Upgrade notes

- See [Releases](Releases) for version changes.
- If the UI does not change after upgrading, fully reload the window (switching panels is
  not enough).
- Coming from earlier 1.1.x versions requires no manual cache cleanup.
