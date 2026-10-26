# Development & Testing

**English** | [简体中文](开发与测试)

## Layout

```
client.js           # client half (single-file ESM bundle, no build step)
index.js            # host projection
cordis.patch.yml    # bundle patch
package.json        # bundle manifest
locale/             # panel title/description dictionaries
tests/              # offline tests
docs/               # screenshots and wiki sources
```

## Offline tests

No browser required:

```powershell
cd tests
pnpm install
node fold-test.mjs      # host projection fold
node render-test.mjs    # client SSR render (zh + en, heatmap, tabs, scope, pagination, relations, workspaces)
```

`react` / `react-dom` are only used by the SSR test; the browser bundle loads `react` from
the host at runtime.

`render-test.mjs` covers:

- panel, sidebar entry and settings-row registration;
- overview stats and heatmap (year/month/week/day, workday shading, source row);
- tab partition semantics (Running / With-todos / Completed cover all sessions);
- search, team scope, workspace filter (including child-session workspace inheritance);
- session relationships (subagent / team member / fork, parent link, child count, family
  accent);
- disabled rename on subagent sessions plus its hover explanation;
- archive visibility, pagination and virtualization behaviour.

## Debugging

- Client changes hot-reload; host changes (`index.js` / `cordis.patch.yml`) need a window
  reload.
- Reset board preferences:

```js
Object.keys(localStorage)
  .filter((key) => key.startsWith('dsh.session-kanban.'))
  .forEach((key) => localStorage.removeItem(key));
```

- If the workday calendar looks wrong, switch the country in Settings or click the refresh
  icon; if needed, remove `dsh.session-kanban.calendar.v2` to refetch.

## Release process (maintainers)

1. Update `client.js` / docs and pass the offline tests.
2. `npm version <patch|minor>` and commit.
3. Tag and push:
   ```sh
   git tag vX.Y.Z
   git push origin main
   git push origin vX.Y.Z
   ```
4. Publish: `npm publish --access public`.
5. Create the GitHub Release, e.g.
   `gh release create vX.Y.Z --title ... --notes ...` with the install command and a change
   summary.
6. Update the [Releases](Releases) wiki page and the wiki sources under `docs/wiki`.

## Contributing

- Run `node fold-test.mjs` and `node render-test.mjs` before committing.
- Prefer host primitives and tokens over custom colours in UI changes.
- When adding settings, shortcuts or behaviour, update the wiki and README as well.
