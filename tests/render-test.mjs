// Offline SSR render test for the session-kanban client half.
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const SOURCE = fs.readFileSync(new URL('../client.js', import.meta.url), 'utf8');

let moduleRecord;
globalThis.window = {
  __ModuleLoader__: {
    load(record) {
      moduleRecord = record;
    },
  },
};
vm.runInThisContext(SOURCE);
if (!moduleRecord || moduleRecord.id !== 'dsh-session-kanban') throw new Error('loader id mismatch');

// Shell UI primitives are provided by the module system; render a minimal stand-in.
const primitivesStub = {
  Menu({ open, anchor, items, selectedId, listClassName, align, side }) {
    return React.createElement(
      'div',
      {
        className: 'mock-menu',
        'data-open': open ? 'true' : 'false',
        'data-list-class': listClassName || '',
        'data-align': align || '',
        'data-side': side || '',
      },
      anchor,
      open
        ? React.createElement('div', { className: 'mock-menu-items' }, (items || []).map((item) => React.createElement('span', {
          key: item.id,
          className: item.id === selectedId ? 'mock-menu-item is-selected' : 'mock-menu-item',
        }, item.label)))
        : null,
    );
  },
  SegmentedTabs({ items, value, label }) {
    return React.createElement(
      'div',
      { role: 'tablist', className: 'mock-segmented-tabs', 'aria-label': label },
      (items || []).map((item) => React.createElement('button', {
        key: item.value,
        type: 'button',
        role: 'tab',
        'aria-selected': item.value === value,
      }, item.label)),
    );
  },
  SegmentedControl({ options, value, label, id }) {
    return React.createElement(
      'div',
      { role: 'tablist', className: 'mock-segmented-control', 'aria-label': label, id },
      (options || []).map((option) => React.createElement('button', {
        key: option.value,
        type: 'button',
        role: 'tab',
        'aria-selected': option.value === value,
      }, option.label)),
    );
  },
  Input(props) {
    return React.createElement(
      'span',
      { className: props.className || '' },
      props.icon,
      React.createElement('input', {
        type: props.type || 'text',
        value: props.value,
        placeholder: props.placeholder,
        'aria-label': props['aria-label'],
        onChange: props.onChange,
      }),
    );
  },
  Button({ variant, size, icon, children, ...rest }) {
    return React.createElement('button', { type: 'button', 'data-variant': variant || 'default', ...rest },
      icon, children);
  },
  Checkbox({ label, checked, onChange, className }) {
    return React.createElement(
      'label',
      { className: className || '' },
      React.createElement('input', {
        type: 'checkbox',
        checked: checked === true,
        onChange: (event) => { if (onChange) onChange(event.target.checked); },
      }),
      React.createElement('span', null, label),
    );
  },
  Tooltip({ label, side, align, children }) {
    return React.createElement(
      'span',
      {
        className: 'mock-tooltip',
        'data-tip': label,
        'data-side': side || '',
        'data-align': align || '',
      },
      children,
    );
  },
  IconChevronDownOutlineRegular(props) {
    return React.createElement('span', { className: props && props.className ? props.className : 'icon-chevron' });
  },
  IconSearchOutlineRegular() {
    return React.createElement('span', { className: 'icon-search-stub' });
  },
};

const factoryRequire = (name) => {
  if (name === 'react') return React;
  if (name === '@deepseek-ai/dsh-client-ui-primitives') return primitivesStub;
  throw new Error(`unexpected require: ${name}`);
};
const client = moduleRecord.factory(factoryRequire);
if (typeof client.apply !== 'function') throw new Error('client apply missing');

function fill(template, params) {
  return String(template).replace(/\{(\w+)\}/g, (m, k) => (params && k in params ? String(params[k]) : m));
}

function makeStore(snapshot) {
  return {
    getSnapshot: () => snapshot,
    subscribe: () => () => {},
  };
}

function makeContext(snapshot, localeId, workspaceSnapshot = { pinnedSessionIds: ['s-idle'], archivedSessionIds: [] }) {
  const dicts = {};
  let registered = [];
  const ctx = {
    effect(fn, label) {
      const result = fn();
      return typeof result === 'function' ? result : () => {};
    },
    on() {
      return () => {};
    },
    locale: {
      register(ns, value) {
        dicts[ns] = value;
        return () => {};
      },
      bind(ns) {
        return (key, params) => fill((dicts[ns] && dicts[ns][localeId] && dicts[ns][localeId][key]) || key, params);
      },
      subscribe() {
        return () => {};
      },
    },
    slots: {
      inject(name, callback) {
        const result = callback();
        return typeof result === 'function' ? result : () => {};
      },
      register(options, component) {
        registered.push({ options, component });
        return () => {};
      },
    },
    sessions: { list: makeStore(snapshot) },
    remote: {
      session: {
        projections: async () => ({ ok: true, value: { values: { sessionKanban: { request: '远程补齐', reply: '', turn: 1, endKind: '', todos: [], done: 0, total: 0, inProgress: 0 } } } }),
        rename: async () => ({ ok: true, value: { title: 'renamed', seq: 1 } }),
      },
      workspace: {
        pinSession: async () => ({ ok: true, value: { pinnedSessionIds: ['s-idle'] } }),
        unpinSession: async () => ({ ok: true, value: { pinnedSessionIds: [] } }),
      },
    },
    workspaces: { archiveSession: async () => {}, list: makeStore(workspaceSnapshot) },
    uiWorkspace: { openSession() {}, startSession() {} },
  };
  return { ctx, getRegistered: () => registered, dicts };
}

const now = Date.now();
const snapshot = {
  ids: ['s-running', 's-idle', 's-nodetails', 's-alldone', 's-many', 's-many-open'],
  byId: {
    's-running': {
      id: 's-running',
      title: '实现左侧栏会话看板',
      running: true,
      updatedAt: now - 5 * 60 * 1000,
      cwd: 'F:\\GitLab\\rc211',
      projectionValues: {
        sessionKanban: {
          request: '给 DSH 做一个会话看板插件',
          reply: '正在编写 client.js',
          turn: 3,
          endKind: '',
          todos: [
            { content: '调研插件 API', status: 'completed' },
            { content: '实现看板面板', status: 'in_progress' },
            { content: '安装并验证', status: 'pending' },
          ],
          done: 1,
          total: 3,
          inProgress: 1,
        },
      },
    },
    's-idle': {
      id: 's-idle',
      title: '修复 BLE 断连',
      running: false,
      updatedAt: now - 40 * 60 * 1000,
      cwd: 'F:\\GitLab\\ble-fix',
      projectionValues: {
        sessionKanban: {
          request: '修复 BLE 断连问题',
          reply: '已定位到 StateFlow 滞流',
          turn: 8,
          endKind: 'completed',
          todos: [],
          done: 0,
          total: 0,
          inProgress: 0,
        },
      },
    },
    's-nodetails': {
      id: 's-nodetails',
      displayTitle: '旧会话',
      running: false,
      updatedAt: now - 3 * 24 * 60 * 60 * 1000,
      cwd: 'F:\\GitLab\\old',
    },
    's-alldone': {
      id: 's-alldone',
      title: '已全部完成',
      running: false,
      updatedAt: now - 2 * 60 * 60 * 1000,
      cwd: 'F:\\GitLab\\done',
      projectionValues: {
        sessionKanban: {
          request: '把六项任务全部做完',
          reply: '全部完成',
          turn: 4,
          endKind: 'completed',
          todos: [
            { content: '任务 1', status: 'completed' },
            { content: '任务 2', status: 'completed' },
            { content: '任务 3', status: 'completed' },
            { content: '任务 4', status: 'completed' },
            { content: '任务 5', status: 'completed' },
            { content: '任务 6', status: 'completed' },
          ],
          done: 6,
          total: 6,
          inProgress: 0,
        },
      },
    },
    's-many-open': {
      id: 's-many-open',
      title: '六项待办未完成',
      running: false,
      updatedAt: now - 4 * 60 * 60 * 1000,
      cwd: 'F:\\GitLab\\open',
      projectionValues: {
        sessionKanban: {
          request: '处理六项待办',
          reply: '还在进行',
          turn: 2,
          endKind: '',
          todos: [
            { content: '待办 1', status: 'pending' },
            { content: '待办 2', status: 'pending' },
            { content: '待办 3', status: 'pending' },
            { content: '待办 4', status: 'pending' },
            { content: '待办 5', status: 'pending' },
            { content: '待办 6', status: 'pending' },
          ],
          done: 0,
          total: 6,
          inProgress: 0,
        },
      },
    },
    's-many': {
      id: 's-many',
      title: '待办较多',
      running: false,
      updatedAt: now - 3 * 60 * 60 * 1000,
      cwd: 'F:\\GitLab\\many',
      projectionValues: {
        sessionKanban: {
          request: '继续推进剩余工作',
          reply: '正在处理',
          turn: 5,
          endKind: '',
          todos: [
            { content: '已完成 A', status: 'completed' },
            { content: '进行中的任务', status: 'in_progress' },
            { content: '待办 B', status: 'pending' },
            { content: '待办 C', status: 'pending' },
            { content: '待办 D', status: 'pending' },
            { content: '已完成 E', status: 'completed' },
          ],
          done: 2,
          total: 6,
          inProgress: 1,
        },
      },
    },
  },
  phase: 'ready',
};

function makeStorage(entries) {
  return {
    store: new Map(entries),
    getItem(key) {
      return this.store.has(key) ? this.store.get(key) : null;
    },
    setItem(key, value) {
      this.store.set(key, String(value));
    },
  };
}

// The board opens on the overview tab, so pin the list tab for the card assertions.
globalThis.window.localStorage = makeStorage([['dsh.session-kanban.filter.v2', 'all']]);

const zh = makeContext(snapshot, 'zh');
client.apply(zh.ctx);
const zhMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(zh.getRegistered()[0].component, { ctx: zh.ctx }));

const expectedZh = [
  '会话看板',
  '6 个会话 · 1 个进行中',
  '实现左侧栏会话看板',
  '运行中',
  '当前工作',
  '实现看板面板',
  '1/3 完成',
  '修复 BLE 断连',
  '空闲',
  '最近进展',
  '已定位到 StateFlow 滞流',
  '最近任务: 修复 BLE 断连问题',
  '旧会话',
  '较旧会话只显示基础信息（详情按最近活动优先加载）。',
  '新建会话',
  '刷新',
  '已完成',
  '概览',
  '搜索标题、任务或目录',
];
for (const needle of expectedZh) {
  if (!zhMarkup.includes(needle)) throw new Error(`zh markup missing: ${needle}`);
}
if (!zhMarkup.includes('style="width:33%"')) throw new Error('progress width missing');
if (!zhMarkup.includes('全部 6 项已完成')) throw new Error('all-done summary missing');
if (!zhMarkup.includes('另有 2 项已完成')) throw new Error('hidden-completed wording missing');
if (!zhMarkup.includes('另有 2 项未显示')) throw new Error('hidden-open wording missing');
if (zhMarkup.includes('还有 2 项')) throw new Error('old hidden wording still present');
if (!zhMarkup.includes('aria-label="归档会话"')) throw new Error('archive action missing');
if (!zhMarkup.includes('aria-label="重命名"')) throw new Error('rename action missing');
if (!zhMarkup.includes('aria-label="分叉会话"')) throw new Error('fork action missing');
if (!zhMarkup.includes('aria-label="复制 Session ID"')) throw new Error('copy action missing');
if (!zhMarkup.includes('aria-label="取消置顶"')) throw new Error('unpin action missing for the pinned card');
if (!zhMarkup.includes('aria-label="置顶会话"')) throw new Error('pin action missing for an unpinned card');
// Hover actions use the native Tooltip primitive (bottom/end, delayed) instead of `title`.
for (const tip of ['归档会话', '重命名', '分叉会话', '复制 Session ID', '置顶会话', '取消置顶']) {
  if (!zhMarkup.includes(`data-tip="${tip}"`)) throw new Error(`native action tooltip missing: ${tip}`);
}
for (const needle of ['data-side="bottom"', 'data-align="end"']) {
  if (!zhMarkup.includes(needle)) throw new Error(`action tooltip placement missing: ${needle}`);
}
if (zhMarkup.includes('title="归档会话"')) throw new Error('legacy title tooltip still rendered for archive');
// Action icons are copied from the shipped Client UI primitives, not redrawn (the
// filter tabs themselves are native SegmentedTabs and carry no icons).
for (const hostPath of [
  'M13.5 2.5H2.5C1.94772',
  'M9.96976 1.70572',
  'M8.85596 2.69971',
  'M1.01503 8.0001',
  'M11.9792 1.53296',
  'M14.5001 8C14.5 9.28552',
]) {
  if (!zhMarkup.includes(hostPath)) throw new Error(`host icon path missing: ${hostPath}`);
}
if (zhMarkup.includes('M6.2 3.2h6.6v6.6')) throw new Error('legacy custom open icon still rendered');
const pinnedTitleAt = zhMarkup.indexOf('修复 BLE 断连');
const runningTitleAt = zhMarkup.indexOf('实现左侧栏会话看板');
if (pinnedTitleAt < 0 || runningTitleAt < 0 || pinnedTitleAt > runningTitleAt) {
  throw new Error('pinned session is not ordered before unpinned sessions');
}

const en = makeContext(snapshot, 'en');
client.apply(en.ctx);
const enMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(en.getRegistered()[0].component, { ctx: en.ctx }));
for (const needle of ['Session Board', '6 sessions · 1 running', 'Current work', 'Latest result', 'With todos', 'All 6 done']) {
  if (!enMarkup.includes(needle)) throw new Error(`en markup missing: ${needle}`);
}

// Filter tab persistence: a stored tab is restored on the next mount.
globalThis.window.localStorage = makeStorage([['dsh.session-kanban.filter.v2', 'running']]);
const restored = makeContext(snapshot, 'zh');
client.apply(restored.ctx);
const restoredMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(restored.getRegistered()[0].component, { ctx: restored.ctx }));
if (!restoredMarkup.includes('实现左侧栏会话看板')) throw new Error('restored running tab lost the running card');
if (restoredMarkup.includes('修复 BLE 断连')) throw new Error('restored running tab still shows idle cards');
if (!restoredMarkup.includes('aria-selected="true"')) throw new Error('active tab missing');

// An invalid stored value falls back to the default overview tab.
globalThis.window.localStorage.store.set('dsh.session-kanban.filter.v2', 'bogus');
const fallback = makeContext(snapshot, 'zh');
client.apply(fallback.ctx);
const fallbackMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(fallback.getRegistered()[0].component, { ctx: fallback.ctx }));
if (!fallbackMarkup.includes('会话总数')) throw new Error('invalid stored tab did not fall back to overview');
if (fallbackMarkup.includes('<article')) throw new Error('overview fallback rendered list cards');

// "done" tab holds fully completed todo lists only.
globalThis.window.localStorage.store.set('dsh.session-kanban.filter.v2', 'done');
const doneCtx = makeContext(snapshot, 'zh');
client.apply(doneCtx.ctx);
const doneMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(doneCtx.getRegistered()[0].component, { ctx: doneCtx.ctx }));
if (!doneMarkup.includes('已全部完成')) throw new Error('done tab lost the completed session');
if (doneMarkup.includes('实现左侧栏会话看板')) throw new Error('done tab still shows an unfinished session');

// "todos" tab keeps sessions with unfinished todos only.
globalThis.window.localStorage.store.set('dsh.session-kanban.filter.v2', 'todos');
const todosCtx = makeContext(snapshot, 'zh');
client.apply(todosCtx.ctx);
const todosMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(todosCtx.getRegistered()[0].component, { ctx: todosCtx.ctx }));
if (!todosMarkup.includes('实现左侧栏会话看板')) throw new Error('todos tab lost an unfinished session');
if (!todosMarkup.includes('六项待办未完成')) throw new Error('todos tab lost the pending-only session');
if (todosMarkup.includes('已全部完成')) throw new Error('todos tab still shows a fully completed session');

console.log('filter persistence OK');

// Archived Sessions leave every tab and every aggregate count.
globalThis.window.localStorage = makeStorage([['dsh.session-kanban.filter.v2', 'all']]);
const archivedWorkspace = { pinnedSessionIds: [], archivedSessionIds: ['s-idle'] };
const archivedCtx = makeContext(snapshot, 'zh', archivedWorkspace);
client.apply(archivedCtx.ctx);
const archivedMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(archivedCtx.getRegistered()[0].component, { ctx: archivedCtx.ctx }));
if (archivedMarkup.includes('修复 BLE 断连')) throw new Error('archived session still rendered on the board');
if (!archivedMarkup.includes('实现左侧栏会话看板')) throw new Error('archiving removed an unrelated session');
globalThis.window.localStorage = makeStorage([['dsh.session-kanban.filter.v2', 'overview']]);
const archivedOverviewCtx = makeContext(snapshot, 'zh', archivedWorkspace);
client.apply(archivedOverviewCtx.ctx);
const archivedOverviewMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(archivedOverviewCtx.getRegistered()[0].component, { ctx: archivedOverviewCtx.ctx }));
if (!archivedOverviewMarkup.includes('5 个会话 · 1 个进行中')) {
  throw new Error('overview still counts an archived session');
}
console.log('archive visibility OK');

// Overview is the default home: aggregate cards plus a Year/Month/Week/Day heatmap.
globalThis.window.localStorage = makeStorage([['dsh.session-kanban.filter.v2', 'overview']]);
const overviewCtx = makeContext(snapshot, 'zh');
client.apply(overviewCtx.ctx);
const overviewMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(overviewCtx.getRegistered()[0].component, { ctx: overviewCtx.ctx }));
for (const needle of [
  '概览', '会话总数', '今日活跃', '待办完成', '活跃分布',
  '年份', '高亮工作日', '高亮非工作日',
  // The working-calendar note is one compact row now: refresh icon, country, source.
  'class="skb-heat-calendar"',
  'skb-heat-calendar-country">China',
  'aria-label="更新工作日日历"',
  'href="https://github.com/NateScarlet/holiday-cn"',
  '>Holiday CN</a>',
  // The workday rule and the calendar status stay available as tooltips.
  'data-tip="更新工作日日历"',
  '工作日按中国法定节假日与调休标注',
  '使用内置日历数据',
  '搜索标题、任务或目录',
]) {
  if (!overviewMarkup.includes(needle)) throw new Error(`overview markup missing: ${needle}`);
}
if (!overviewMarkup.includes('6 个会话 · 1 个进行中')) {
  throw new Error('overview lost the session totals');
}

// The compact calendar row follows the active UI language too.
const overviewEnCtx = makeContext(snapshot, 'en');
client.apply(overviewEnCtx.ctx);
const overviewEnMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(overviewEnCtx.getRegistered()[0].component, { ctx: overviewEnCtx.ctx }));
for (const needle of ['>Holiday CN</a>', 'aria-label="Refresh workday calendar"']) {
  if (!overviewEnMarkup.includes(needle)) throw new Error(`en overview markup missing: ${needle}`);
}

// A cached calendar shows its last refresh date in the same row as YYYY/MM/DD.
const fetchedAt = new Date(2026, 9, 26, 12, 0, 0).getTime();
globalThis.window.localStorage = makeStorage([
  ['dsh.session-kanban.filter.v2', 'overview'],
  ['dsh.session-kanban.calendar.v2', JSON.stringify({
    countries: { CN: { fetchedAt, years: { 2026: { off: ['2026-01-01'], work: [] } } } },
  })],
]);
const cacheDateCtx = makeContext(snapshot, 'zh');
client.apply(cacheDateCtx.ctx);
const cacheDateMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(cacheDateCtx.getRegistered()[0].component, { ctx: cacheDateCtx.ctx }));
if (!cacheDateMarkup.includes('skb-heat-calendar-date')) throw new Error('calendar refresh date element missing');
if (!cacheDateMarkup.includes('>2026/10/26</span>')) throw new Error('cached calendar refresh date missing');

// Each country shows the source that actually seeded its calendar: China, Japan,
// Korea, and Russia have dedicated datasets; everyone else uses Nager.Date.
const sourceCases = [
  ['CN', 'cn', 'Holiday CN', 'https://github.com/NateScarlet/holiday-cn'],
  ['JP', 'jp', 'Holiday JP', 'https://github.com/holiday-jp/holiday_jp'],
  ['KR', 'kr', 'Holiday KR', 'https://github.com/hyunbinseo/holidays-kr'],
  ['RU', 'ru', 'isdayoff', 'https://isdayoff.ru'],
  ['US', 'nager', 'Nager.Date', 'https://date.nager.at'],
];
const sourceYear = new Date().getFullYear();
for (const [code, sourceId, sourceName, sourceUrl] of sourceCases) {
  globalThis.window.localStorage = makeStorage([
    ['dsh.session-kanban.filter.v2', 'overview'],
    ['dsh.session-kanban.settings.v1', JSON.stringify({ country: code, refresh: '30d' })],
    ['dsh.session-kanban.calendar.v2', JSON.stringify({
      countries: {
        [code]: {
          fetchedAt: Date.now(),
          years: { [sourceYear]: { off: [`${sourceYear}-01-01`], work: [] } },
          source: sourceId,
        },
      },
    })],
  ]);
  const sourceCtx = makeContext(snapshot, 'zh');
  client.apply(sourceCtx.ctx);
  const sourceMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(sourceCtx.getRegistered()[0].component, { ctx: sourceCtx.ctx }));
  if (!sourceMarkup.includes(`>${sourceName}</a>`)) throw new Error(`calendar source name missing for ${code}: ${sourceName}`);
  if (!sourceMarkup.includes(`href="${sourceUrl}"`)) throw new Error(`calendar source link missing for ${code}: ${sourceUrl}`);
}
// Restore the default settings used by the settings-row checks below.
globalThis.window.localStorage.store.delete('dsh.session-kanban.settings.v1');

// Settings -> General carries the working-calendar country and auto-refresh rows.
const settingsRegistrations = overviewCtx.getRegistered()
  .filter((item) => item && item.options && item.options.name === 'settings.general.item');
if (settingsRegistrations.length !== 2) throw new Error(`expected 2 settings rows, got ${settingsRegistrations.length}`);
const countryRegistration = settingsRegistrations.find((item) => item.options.id === 'session-kanban-country');
const refreshRegistration = settingsRegistrations.find((item) => item.options.id === 'session-kanban-refresh');
if (!countryRegistration) throw new Error('settings country registration missing');
if (!refreshRegistration) throw new Error('settings refresh registration missing');
if (countryRegistration.options.order !== 25 || refreshRegistration.options.order !== 26) throw new Error('settings row order mismatch');
const settingsMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(countryRegistration.component, { ctx: overviewCtx.ctx }));
for (const needle of ['工作日国家/地区', 'skb-select', 'aria-haspopup="menu"', 'China', 'skb-menu-list', 'data-align="end"', 'data-side="bottom"']) {
  if (!settingsMarkup.includes(needle)) throw new Error(`country settings row missing: ${needle}`);
}
const refreshMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(refreshRegistration.component, { ctx: overviewCtx.ctx }));
for (const needle of ['日历自动更新', '默认 1 个月', '1 个月', 'skb-select', 'aria-haspopup="menu"', 'data-align="end"']) {
  if (!refreshMarkup.includes(needle)) throw new Error(`refresh settings row missing: ${needle}`);
}
// A stored auto-refresh interval is restored in the settings row.
globalThis.window.localStorage.store.set('dsh.session-kanban.settings.v1', JSON.stringify({ country: 'CN', refresh: '90d' }));
const refreshStoredCtx = makeContext(snapshot, 'zh');
client.apply(refreshStoredCtx.ctx);
const storedRegistration = refreshStoredCtx.getRegistered()
  .find((item) => item && item.options && item.options.id === 'session-kanban-refresh');
const storedMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(storedRegistration.component, { ctx: refreshStoredCtx.ctx }));
if (!storedMarkup.includes('3 个月')) throw new Error('stored auto-refresh interval not restored');
globalThis.window.localStorage.store.delete('dsh.session-kanban.settings.v1');
console.log('settings rows OK');
// Filter tabs / heat scale / search / header actions are the harness primitives now.
if (!overviewMarkup.includes('mock-segmented-tabs')) throw new Error('filter tabs are not native SegmentedTabs');
if (!overviewMarkup.includes('mock-segmented-control')) throw new Error('heat scale is not native SegmentedControl');
if (!overviewMarkup.includes('placeholder="搜索标题、任务或目录"')) throw new Error('search is not the native Input');
if (!overviewMarkup.includes('aria-label="会话筛选"')) throw new Error('tabs aria label missing');
if (overviewMarkup.includes('skb-tab"')) throw new Error('custom tab markup still rendered');
if (overviewMarkup.includes('skb-search"')) throw new Error('custom search input still rendered');
console.log('native controls OK');
// Default scale is the year: one cell per day of the current year, with 12 month labels.
const currentYear = new Date().getFullYear();
const expectedYearCells = new Date(currentYear, 1, 29).getMonth() === 1 ? 366 : 365;
const yearCells = (overviewMarkup.match(/class="skb-heat-cell lvl-/g) || []).length;
if (yearCells !== expectedYearCells) throw new Error(`year heatmap expected ${expectedYearCells} cells, got ${yearCells}`);
const monthLabels = (overviewMarkup.match(/class="skb-heat-month"/g) || []).length;
if (monthLabels !== 12) throw new Error(`year heatmap expected 12 month labels, got ${monthLabels}`);

// Workday/non-workday highlight toggles mark the China statutory calendar cells.
globalThis.window.localStorage = makeStorage([
  ['dsh.session-kanban.filter.v2', 'overview'],
  ['dsh.session-kanban.highlight.v1', JSON.stringify({ workday: true, offday: true })],
]);
const highlightCtx = makeContext(snapshot, 'zh');
client.apply(highlightCtx.ctx);
const highlightMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(highlightCtx.getRegistered()[0].component, { ctx: highlightCtx.ctx }));
if (!highlightMarkup.includes('is-workday')) throw new Error('workday highlight missing');
if (!highlightMarkup.includes('is-offday')) throw new Error('non-workday highlight missing');
// The highlight is a separate palette (green/amber legend rows), not a cell outline ring.
if (!highlightMarkup.includes('skb-heat-swatch is-workday lvl-')) throw new Error('workday palette legend missing');
if (!highlightMarkup.includes('skb-heat-swatch is-offday lvl-')) throw new Error('non-workday palette legend missing');
if (highlightMarkup.includes('inset 0 0 0 1.5px')) throw new Error('outline-ring highlight still present');

// The heatmap scale is persisted too: a stored "day" scale restores 24 hour buckets.
globalThis.window.localStorage = makeStorage([
  ['dsh.session-kanban.filter.v2', 'overview'],
  ['dsh.session-kanban.heatmap.v1', 'day'],
]);
const dayCtx = makeContext(snapshot, 'zh');
client.apply(dayCtx.ctx);
const dayMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(dayCtx.getRegistered()[0].component, { ctx: dayCtx.ctx }));
if (!dayMarkup.includes('skb-heat-hours')) throw new Error('hour heatmap missing');
const hourCells = (dayMarkup.match(/class="skb-heat-cell lvl-/g) || []).length;
if (hourCells !== 24) throw new Error(`hour heatmap expected 24 cells, got ${hourCells}`);
console.log('overview heatmap OK');

// Large catalogs render only the first page; offscreen sessions stay out of the DOM.
globalThis.window.localStorage.store.set('dsh.session-kanban.filter.v2', 'all');
const bigIds = Array.from({ length: 70 }, (_, index) => `s-big-${index}`);
const bigById = {};
for (let index = 0; index < bigIds.length; index += 1) {
  bigById[bigIds[index]] = {
    id: bigIds[index],
    title: `会话 ${index}`,
    running: false,
    updatedAt: now - index * 1000,
    cwd: 'F:\\GitLab\\big',
    projectionValues: {
      sessionKanban: {
        request: '', reply: '', turn: 1, endKind: '', todos: [], done: 0, total: 0, inProgress: 0,
      },
    },
  };
}
const bigCtx = makeContext({ ids: bigIds, byId: bigById, phase: 'ready' }, 'zh');
client.apply(bigCtx.ctx);
const bigMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(bigCtx.getRegistered()[0].component, { ctx: bigCtx.ctx }));
const bigCardCount = (bigMarkup.match(/<article /g) || []).length;
if (bigCardCount !== 60) throw new Error(`virtualized render expected 60 cards, got ${bigCardCount}`);
const masonryColumns = (bigMarkup.match(/class="skb-col"/g) || []).length;
if (masonryColumns !== 3) throw new Error(`masonry layout expected 3 columns, got ${masonryColumns}`);
if (!bigMarkup.includes('已显示 60/70 个会话')) throw new Error('virtualized counter missing');
if (!bigMarkup.includes('滚动到底部自动加载更多')) throw new Error('auto-load hint missing');
if (bigMarkup.includes('加载更多</button>')) throw new Error('manual load-more button still rendered');
if (bigMarkup.includes('会话 60')) throw new Error('offscreen session rendered eagerly');
if (bigMarkup.includes('会话 69')) throw new Error('last session rendered eagerly');
console.log('virtualized rendering OK');

// Agent Team scope: the board narrows to one team's sessions on demand.
globalThis.window.localStorage = makeStorage([
  ['dsh.session-kanban.filter.v2', 'all'],
  ['dsh.session-kanban.scope.v1', 'all'],
]);
const teamLeadId = 's-team-lead';
const kanbanValue = (request, reply) => ({
  request, reply, turn: 1, endKind: 'completed', todos: [], done: 0, total: 0, inProgress: 0,
});
const teamSnapshot = {
  ids: ['s-team-lead', 's-team-a', 's-team-b', 's-plain'],
  byId: {
    's-team-lead': {
      id: 's-team-lead',
      title: '团队 Lead 会话',
      running: true,
      updatedAt: now - 1000,
      cwd: 'F:\\GitLab\\team',
      projectionValues: {
        sessionKanban: kanbanValue('带团队做看板', '正在协调'),
        agentTeam: {
          members: [
            { id: 's-team-lead', name: 'lead', role: 'lead', phase: 'active' },
            { id: 's-team-a', name: 'worker-a', role: 'teammate', phase: 'active' },
            { id: 's-team-b', name: 'worker-b', role: 'teammate', phase: 'active' },
          ],
          tasks: [],
        },
      },
    },
    's-team-a': {
      id: 's-team-a',
      parentId: 's-team-lead',
      title: '队友 A 会话',
      running: false,
      updatedAt: now - 2000,
      cwd: 'F:\\GitLab\\team',
      projectionValues: { sessionKanban: kanbanValue('A 的任务', '完成 A') },
    },
    's-team-b': {
      id: 's-team-b',
      parentId: 's-team-lead',
      title: '队友 B 会话',
      running: false,
      updatedAt: now - 3000,
      cwd: 'F:\\GitLab\\team',
      projectionValues: { sessionKanban: kanbanValue('B 的任务', '完成 B') },
    },
    's-plain': {
      id: 's-plain',
      title: '普通会话',
      running: false,
      updatedAt: now - 4000,
      cwd: 'F:\\GitLab\\plain',
      projectionValues: { sessionKanban: kanbanValue('普通请求', '普通回复') },
    },
  },
  phase: 'ready',
};
const teamAllCtx = makeContext(teamSnapshot, 'zh');
client.apply(teamAllCtx.ctx);
const teamAllMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(teamAllCtx.getRegistered()[0].component, { ctx: teamAllCtx.ctx }));
if (!teamAllMarkup.includes('全部会话')) throw new Error('scope selector missing');
if (!teamAllMarkup.includes('aria-haspopup="menu"')) throw new Error('scope selector is not a native menu');
if (!teamAllMarkup.includes('普通会话')) throw new Error('all-sessions scope lost a plain session');

globalThis.window.localStorage.store.set('dsh.session-kanban.scope.v1', teamLeadId);
const teamScopedCtx = makeContext(teamSnapshot, 'zh');
client.apply(teamScopedCtx.ctx);
const teamScopedMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(teamScopedCtx.getRegistered()[0].component, { ctx: teamScopedCtx.ctx }));
for (const needle of ['团队 Lead 会话', '队友 A 会话', '队友 B 会话']) {
  if (!teamScopedMarkup.includes(needle)) throw new Error(`team scope lost: ${needle}`);
}
if (!teamScopedMarkup.includes('团队 Lead 会话（3 人团队）')) throw new Error('team scope trigger label missing');
if (teamScopedMarkup.includes('普通会话')) throw new Error('team scope leaked a non-team session');
console.log('team scope OK');

// Registration shape and localized sidebar label.
const registrations = zh.getRegistered();
const main = registrations.find((entry) => entry.options.name === 'main');
const panel = registrations.find((entry) => entry.options.name === 'sidebar.panellist');
if (!main || main.options.key !== 'session-kanban') throw new Error('main registration wrong');
if (!panel || panel.options.id !== 'session-kanban' || panel.options.order !== 20) throw new Error('panellist registration wrong');
if (panel.options.label() !== '会话看板') throw new Error(`side label wrong: ${panel.options.label()}`);

const icon = registrations.find((entry) => entry.options.name === 'sidebar.panellist').component;
const iconMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(icon, { size: 18, active: true }));
if (!iconMarkup.startsWith('<svg') || !iconMarkup.includes('width="18"')) throw new Error('icon markup wrong');

console.log('client SSR render OK');
console.log('zh markup bytes:', zhMarkup.length, '| en markup bytes:', enMarkup.length);
console.log('inline zh sample:', zhMarkup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 220));
