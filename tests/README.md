# session-kanban offline verification

Two Node scripts check the plugin without a browser:

- `fold-test.mjs` — imports the Host half, captures the registered session projection
  unit, and folds a synthetic Session log (human request, injected context, assistant
  reply, `todo/write`, `turn/start`, `turn/end`). It asserts previews, todo counts,
  turn tracking, the turn/start reset rule, and that unrelated events keep the state
  reference unchanged (the projection registry's performance contract).
- `render-test.mjs` — runs `client.js` through a stubbed `__ModuleLoader__`, captures
  the slot registrations from `apply`, and server-renders the board in zh and en with a
  synthetic session store. It asserts the panel header, cards, current-work text, todo
  progress bar, action buttons, localized sidebar label, and icon markup.

## Run

```powershell
cd tests
pnpm install
node fold-test.mjs
node render-test.mjs
```

`react`/`react-dom` are installed only for the SSR render test; they are not a dependency
of the plugin itself (the browser bundle requires the host's React module).
