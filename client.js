window.__ModuleLoader__.load({
  id: 'dsh-session-kanban',
  factory(require) {
    const React = require('react');
    const primitives = require('@deepseek-ai/dsh-client-ui-primitives');
    const Menu = primitives.Menu;
    const IconChevronDown = primitives.IconChevronDownOutlineRegular;
    const IconSearch = primitives.IconSearchOutlineRegular;
    const SegmentedTabs = primitives.SegmentedTabs;
    const SegmentedControl = primitives.SegmentedControl;
    const Input = primitives.Input;
    const Button = primitives.Button;
    const Checkbox = primitives.Checkbox;
    const { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } = React;
    const h = React.createElement;

    const NS = 'session.kanban';
    const PANEL_ID = 'session-kanban';
    const PROJECTION_KEY = 'sessionKanban';
    const TODOS_SHOWN = 4;
    const REFRESH_CONCURRENCY = 3;
    const FILTERS = ['overview', 'all', 'running', 'todos', 'done'];
    const FILTER_STORAGE_KEY = 'dsh.session-kanban.filter.v2';
    const HEAT_STORAGE_KEY = 'dsh.session-kanban.heatmap.v1';
    const HIGHLIGHT_STORAGE_KEY = 'dsh.session-kanban.highlight.v1';
    const SCOPE_STORAGE_KEY = 'dsh.session-kanban.scope.v1';
    const HEAT_SCALES = ['year', 'month', 'week', 'day'];
    const HOLIDAY_YEARS = [2023, 2024, 2025, 2026];
    const SETTINGS_STORAGE_KEY = 'dsh.session-kanban.settings.v1';
    const SETTINGS_EVENT = 'dsh-session-kanban:settings-changed';
    const CALENDAR_CACHE_KEY = 'dsh.session-kanban.calendar.v2';
    const CALENDAR_TTL_MS = 7 * 24 * 60 * 60 * 1000;
    const HOLIDAY_CN_SOURCES = [
      (year) => `https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master/${year}.json`,
      (year) => `https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/${year}.json`,
    ];
    const NAGER_URL = (year, code) => `https://date.nager.at/api/v3/PublicHolidays/${year}/${code}`;

    // Supported workday calendars. `weekend` holds local weekend weekday indexes
    // (0 = Sunday); China additionally uses holiday-cn, which also carries the
    // State Council make-up workdays, while every other country uses the public
    // holidays from date.nager.at with its own weekend rule.
    const COUNTRIES = [
      { code: 'CN', zh: '中国', en: 'China', weekend: [0, 6] },
      { code: 'US', zh: '美国', en: 'United States', weekend: [0, 6] },
      { code: 'GB', zh: '英国', en: 'United Kingdom', weekend: [0, 6] },
      { code: 'DE', zh: '德国', en: 'Germany', weekend: [0, 6] },
      { code: 'FR', zh: '法国', en: 'France', weekend: [0, 6] },
      { code: 'JP', zh: '日本', en: 'Japan', weekend: [0, 6] },
      { code: 'KR', zh: '韩国', en: 'South Korea', weekend: [0, 6] },
      { code: 'SG', zh: '新加坡', en: 'Singapore', weekend: [0, 6] },
      { code: 'CA', zh: '加拿大', en: 'Canada', weekend: [0, 6] },
      { code: 'AU', zh: '澳大利亚', en: 'Australia', weekend: [0, 6] },
      { code: 'IN', zh: '印度', en: 'India', weekend: [0, 6] },
      { code: 'BR', zh: '巴西', en: 'Brazil', weekend: [0, 6] },
      { code: 'RU', zh: '俄罗斯', en: 'Russia', weekend: [0, 6] },
      { code: 'IT', zh: '意大利', en: 'Italy', weekend: [0, 6] },
      { code: 'ES', zh: '西班牙', en: 'Spain', weekend: [0, 6] },
      { code: 'NL', zh: '荷兰', en: 'Netherlands', weekend: [0, 6] },
      { code: 'SE', zh: '瑞典', en: 'Sweden', weekend: [0, 6] },
      { code: 'CH', zh: '瑞士', en: 'Switzerland', weekend: [0, 6] },
      { code: 'AE', zh: '阿联酋', en: 'United Arab Emirates', weekend: [0, 6] },
      { code: 'SA', zh: '沙特阿拉伯', en: 'Saudi Arabia', weekend: [5, 6] },
      { code: 'IL', zh: '以色列', en: 'Israel', weekend: [5, 6] },
      { code: 'TH', zh: '泰国', en: 'Thailand', weekend: [0, 6] },
      { code: 'MY', zh: '马来西亚', en: 'Malaysia', weekend: [0, 6] },
      { code: 'MX', zh: '墨西哥', en: 'Mexico', weekend: [0, 6] },
    ];
    const COUNTRY_MAP = new Map(COUNTRIES.map((item) => [item.code, item]));
    const DEFAULT_COUNTRY = 'CN';

    // Embedded fallback snapshot of China statutory holidays and make-up workdays
    // (holiday-cn, which mirrors the State Council announcements). The browser refreshes
    // this from the network, caches the result, and keeps the embedded years as an
    // offline fallback so the board never depends on one hard-coded dataset.
    const EMBEDDED_HOLIDAYS = {
      2023: {
        off: ['2022-12-31', '2023-01-01', '2023-01-02', '2023-01-21', '2023-01-22', '2023-01-23', '2023-01-24', '2023-01-25', '2023-01-26', '2023-01-27', '2023-04-05', '2023-04-29', '2023-04-30', '2023-05-01', '2023-05-02', '2023-05-03', '2023-06-22', '2023-06-23', '2023-06-24', '2023-09-29', '2023-09-30', '2023-10-01', '2023-10-02', '2023-10-03', '2023-10-04', '2023-10-05', '2023-10-06'],
        work: ['2023-01-28', '2023-01-29', '2023-04-23', '2023-05-06', '2023-06-25', '2023-10-07', '2023-10-08'],
      },
      2024: {
        off: ['2024-01-01', '2024-02-10', '2024-02-11', '2024-02-12', '2024-02-13', '2024-02-14', '2024-02-15', '2024-02-16', '2024-02-17', '2024-04-04', '2024-04-05', '2024-04-06', '2024-05-01', '2024-05-02', '2024-05-03', '2024-05-04', '2024-05-05', '2024-06-10', '2024-09-15', '2024-09-16', '2024-09-17', '2024-10-01', '2024-10-02', '2024-10-03', '2024-10-04', '2024-10-05', '2024-10-06', '2024-10-07'],
        work: ['2024-02-04', '2024-02-18', '2024-04-07', '2024-04-28', '2024-05-11', '2024-09-14', '2024-09-29', '2024-10-12'],
      },
      2025: {
        off: ['2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', '2025-02-01', '2025-02-02', '2025-02-03', '2025-02-04', '2025-04-04', '2025-04-05', '2025-04-06', '2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04', '2025-05-05', '2025-05-31', '2025-06-01', '2025-06-02', '2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04', '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08'],
        work: ['2025-01-26', '2025-02-08', '2025-04-27', '2025-09-28', '2025-10-11'],
      },
      2026: {
        off: ['2026-01-01', '2026-01-02', '2026-01-03', '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23', '2026-04-04', '2026-04-05', '2026-04-06', '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05', '2026-06-19', '2026-06-20', '2026-06-21', '2026-09-25', '2026-09-26', '2026-09-27', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'],
        work: ['2026-01-04', '2026-02-14', '2026-02-28', '2026-05-09', '2026-09-20', '2026-10-10'],
      },
    };

    let holidayIndex = null;

    function countryConfig(code) {
      return COUNTRY_MAP.get(code) || COUNTRY_MAP.get(DEFAULT_COUNTRY);
    }

    /** Best-effort UI language for country names (the host sets `<html lang>`). */
    function countryName(code) {
      const config = countryConfig(code);
      let language = '';
      try {
        language = (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang) || '';
      } catch (error) {
        language = '';
      }
      return language.toLowerCase().startsWith('zh') ? config.zh : config.en;
    }

    function readStoredSettings() {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) || 'null');
        const code = parsed && typeof parsed.country === 'string' ? parsed.country : DEFAULT_COUNTRY;
        return { country: COUNTRY_MAP.has(code) ? code : DEFAULT_COUNTRY };
      } catch (error) {
        return { country: DEFAULT_COUNTRY };
      }
    }

    function persistSettings(next) {
      try {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ country: next.country }));
      } catch (error) {
        /* storage may be unavailable */
      }
    }

    function emitSettingsChanged() {
      try {
        window.dispatchEvent(new Event(SETTINGS_EVENT));
      } catch (error) {
        /* no window in SSR tests */
      }
    }

    function buildHolidayIndex(country, years) {
      const off = new Set();
      const work = new Set();
      const knownYears = new Set();
      for (const [year, data] of Object.entries(years || {})) {
        if (!data || typeof data !== 'object') continue;
        knownYears.add(Number(year));
        for (const day of (Array.isArray(data.off) ? data.off : [])) {
          if (typeof day === 'string') off.add(day);
        }
        for (const day of (Array.isArray(data.work) ? data.work : [])) {
          if (typeof day === 'string') work.add(day);
        }
      }
      return { off, work, years: knownYears, weekend: new Set(countryConfig(country).weekend) };
    }

    /** Merge network-cached years over the embedded China snapshot and swap the live index. */
    function installHolidays(country, years) {
      const base = country === 'CN' ? EMBEDDED_HOLIDAYS : {};
      holidayIndex = buildHolidayIndex(country, { ...base, ...(years || {}) });
    }

    function readStoredCalendar(country) {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(CALENDAR_CACHE_KEY) || 'null');
        if (!parsed || typeof parsed !== 'object') return null;
        if (parsed.countries && typeof parsed.countries === 'object') {
          const entry = parsed.countries[country];
          if (!entry || typeof entry !== 'object' || !entry.years || typeof entry.years !== 'object') return null;
          return { fetchedAt: Number(entry.fetchedAt) || 0, years: entry.years };
        }
        // v1 shape held China-only data under { fetchedAt, years }.
        if (country === 'CN' && parsed.years && typeof parsed.years === 'object') {
          return { fetchedAt: Number(parsed.fetchedAt) || 0, years: parsed.years };
        }
        return null;
      } catch (error) {
        return null;
      }
    }

    function persistCalendar(country, years, fetchedAt) {
      try {
        let countries = {};
        try {
          const parsed = JSON.parse(window.localStorage.getItem(CALENDAR_CACHE_KEY) || 'null');
          if (parsed && typeof parsed === 'object' && parsed.countries && typeof parsed.countries === 'object') {
            countries = { ...parsed.countries };
          }
        } catch (error) {
          /* start a fresh cache */
        }
        countries[country] = { fetchedAt, years };
        window.localStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify({ countries }));
      } catch (error) {
        /* storage may be unavailable; the in-memory index still updates */
      }
    }

    /**
     * Fetch one year of a country's holiday calendar. China comes from holiday-cn
     * (which also carries make-up workdays); every other country comes from
     * date.nager.at public holidays and only contributes off days.
     */
    async function fetchHolidayYear(year, country) {
      if (country === 'CN') {
        for (const source of HOLIDAY_CN_SOURCES) {
          try {
            const response = await fetch(source(year), {
              credentials: 'omit',
              cache: 'no-store',
              referrerPolicy: 'no-referrer',
            });
            if (!response.ok) continue;
            const data = await response.json();
            const off = [];
            const work = [];
            for (const day of (Array.isArray(data && data.days) ? data.days : [])) {
              if (!day || typeof day.date !== 'string') continue;
              if (day.isOffDay) off.push(day.date);
              else work.push(day.date);
            }
            if (off.length === 0 && work.length === 0) continue;
            return { off, work };
          } catch (error) {
            /* try the next mirror */
          }
        }
        return null;
      }
      try {
        const response = await fetch(NAGER_URL(year, country), {
          credentials: 'omit',
          cache: 'no-store',
          referrerPolicy: 'no-referrer',
        });
        if (!response.ok) return null;
        const data = await response.json();
        const off = [];
        for (const day of (Array.isArray(data) ? data : [])) {
          if (day && typeof day.date === 'string') off.push(day.date);
        }
        return off.length > 0 ? { off, work: [] } : null;
      } catch (error) {
        return null;
      }
    }

    /** Years worth refreshing: current, next, and the two before it. */
    function calendarYearsToFetch() {
      const current = new Date().getFullYear();
      const years = [];
      for (const year of [current, current + 1, current - 1, current - 2]) {
        if (year >= 2023) years.push(year);
      }
      return years;
    }

    const initialSettings = readStoredSettings();
    const initialCalendar = readStoredCalendar(initialSettings.country);
    installHolidays(initialSettings.country, initialCalendar ? initialCalendar.years : null);

    let calendarRefreshPromise = null;
    let calendarRefreshCountry = null;

    /**
     * Fetch and cache the working calendar of the country selected in Settings.
     * Concurrent callers for the same country share one refresh; a fresh cache
     * returns immediately without touching the network.
     */
    async function refreshHolidayCalendar(force) {
      const country = readStoredSettings().country;
      const cached = readStoredCalendar(country);
      if (!force && cached && Date.now() - cached.fetchedAt < CALENDAR_TTL_MS) {
        return {
          country,
          source: 'cache',
          updatedAt: cached.fetchedAt,
          years: Object.keys(cached.years).length,
          failed: false,
        };
      }
      if (calendarRefreshPromise && calendarRefreshCountry === country) return calendarRefreshPromise;
      const promise = (async () => {
        try {
          const results = {};
          for (const year of calendarYearsToFetch()) {
            const data = await fetchHolidayYear(year, country);
            if (data) results[year] = data;
          }
          if (Object.keys(results).length === 0) {
            return {
              country,
              source: cached ? 'cache' : 'embedded',
              updatedAt: cached ? cached.fetchedAt : 0,
              years: cached ? Object.keys(cached.years).length : 0,
              failed: true,
            };
          }
          const merged = { ...((cached && cached.years) || {}), ...results };
          installHolidays(country, merged);
          persistCalendar(country, merged, Date.now());
          return {
            country,
            source: 'network',
            updatedAt: Date.now(),
            years: Object.keys(merged).length,
            failed: false,
          };
        } catch (error) {
          return {
            country,
            source: cached ? 'cache' : 'embedded',
            updatedAt: cached ? cached.fetchedAt : 0,
            years: cached ? Object.keys(cached.years).length : 0,
            failed: true,
          };
        }
      })();
      calendarRefreshPromise = promise;
      calendarRefreshCountry = country;
      try {
        return await promise;
      } finally {
        if (calendarRefreshPromise === promise) {
          calendarRefreshPromise = null;
          calendarRefreshCountry = null;
        }
      }
    }
    const DETAIL_BUDGET = 80;
    const PAGE_SIZE = 60;
    const MIN_CARD_WIDTH = 320;
    const GRID_GAP = 14;
    const EMPTY_WORKSPACE_SNAPSHOT = { pinnedSessionIds: [] };

    // ---------------------------------------------------------------- locale
    const zh = {
      'panel.title': '会话看板',
      'panel.subtitle': '{total} 个会话 · {running} 个进行中',
      'action.refresh': '刷新',
      'action.newSession': '新建会话',
      'action.open': '打开会话',
      'action.pin': '置顶会话',
      'action.unpin': '取消置顶',
      'action.rename': '重命名',
      'action.fork': '分叉会话',
      'action.copyId': '复制 Session ID',
      'action.archive': '归档会话',
      'action.archiveConfirm': '确认归档',
      'action.archiveCancel': '取消',
      'search.placeholder': '搜索标题、任务或目录',
      'action.loadMore': '加载更多',
      'list.loaded': '已显示 {shown}/{total} 个会话',
      'list.autoLoadHint': '滚动到底部自动加载更多',
      'tab.overview': '概览',
      'tabs.label': '会话筛选',
      'heat.scaleLabel': '热力图刻度',
      'scope.label': '范围',
      'scope.all': '全部会话',
      'scope.teamOption': '{title}（{n} 人团队）',
      'overview.sessions': '会话总数',
      'overview.sessionsSub': '全部可见会话',
      'overview.running': '运行中',
      'overview.runningSub': '正在执行任务',
      'overview.today': '今日活跃',
      'overview.todaySub': '今天有更新的会话',
      'overview.todos': '待办完成',
      'overview.todosSub': '仅统计已加载详情的会话',
      'overview.heatTitle': '活跃分布',
      'overview.heatHint': '按每个会话的最近活动时间统计',
      'heat.scale.year': '年',
      'heat.scale.month': '月',
      'heat.scale.week': '周',
      'heat.scale.day': '日',
      'heat.yearLabel': '年份',
      'heat.monthLabel': '月份',
      'heat.weekLabel': '周',
      'heat.dayLabel': '日期',
      'heat.weekday.mon': '一',
      'heat.weekday.wed': '三',
      'heat.weekday.fri': '五',
      'heat.less': '少',
      'heat.more': '多',
      'heat.dayCount': '{date} · {count} 个会话',
      'heat.hourCount': '{hour}:00 · {count} 个会话',
      'heat.dayTotal': '当日共 {count} 个活跃会话',
      'heat.kind.work': '工作日',
      'heat.kind.off': '非工作日',
      'heat.highlightWorkday': '高亮工作日',
      'heat.highlightOffday': '高亮非工作日',
      'heat.legend.default': '活跃度',
      'heat.legend.workday': '工作日',
      'heat.legend.offday': '非工作日',
      'heat.holidayNote': '工作日按中国法定节假日与调休标注（自动更新，来源 holiday-cn）',
      'heat.calendar.refresh': '更新',
      'heat.calendar.refreshing': '更新中…',
      'heat.calendar.loading': '正在更新日历数据…',
      'heat.calendar.network': '日历已更新（{country} · {years} 年 · {time}）',
      'heat.calendar.cache': '使用缓存日历（{country} · {time}）',
      'heat.calendar.embedded': '使用内置日历数据（{country}）',
      'heat.calendar.error': '日历更新失败，使用本地数据（{country}）',
      'settings.country.label': '工作日国家/地区',
      'settings.country.hint': '影响看板热力图的工作日/非工作日标注：中国使用法定节假日与调休，其他国家使用公共假日与当地周末规则。',
      'heat.meta.year': '{year} 年',
      'heat.meta.month': '{year} 年 {month} 月',
      'heat.meta.week': '{start} – {end}',
      'heat.meta.day': '{date}',
      'filter.all': '全部',
      'filter.running': '进行中',
      'filter.todos': '有待办',
      'filter.done': '已完成',
      'status.running': '运行中',
      'status.idle': '空闲',
      'work.current': '当前工作',
      'work.result': '最近进展',
      'work.recent': '最近任务',
      'work.none': '暂无工作记录',
      'work.turn': '第 {turn} 轮',
      'todo.title': '待办',
      'todo.done': '{done}/{total} 完成',
      'todo.none': '暂无待办清单',
      'todo.allDone': '全部 {total} 项已完成',
      'todo.moreDone': '另有 {n} 项已完成',
      'todo.moreHidden': '另有 {n} 项未显示',
      'meta.untitled': '未命名会话',
      'meta.pinned': '已置顶',
      'rename.label': '会话标题',
      'rename.empty': '标题不能为空',
      'rename.failed': '重命名失败：{message}',
      'pin.failed': '置顶操作失败：{message}',
      'fork.failed': '分叉失败：{message}',
      'copy.done': '已复制 Session ID',
      'copy.failed': '复制失败：{message}',
      'meta.updated': '{time}更新',
      'state.loading': '正在读取会话…',
      'state.empty': '还没有会话',
      'state.emptyHint': '新建一个会话后，看板会显示它的当前工作、待办清单和完成进度。',
      'state.error': '无法读取会话列表',
      'state.errorHint': '请检查连接后重试；看板会在连接恢复后自动刷新。',
      'state.noMatch': '没有匹配的会话',
      'state.noMatchHint': '换个关键词，或清空搜索查看全部会话。',
      'state.retry': '重试',
      'state.partial': '较旧会话只显示基础信息（详情按最近活动优先加载）。',
      'archive.failed': '归档失败：{message}',
      'time.justNow': '刚刚',
      'time.minutes': '{n} 分钟前',
      'time.hours': '{n} 小时前',
      'time.days': '{n} 天前',
      'time.months': '{n} 个月前',
    };

    const en = {
      'panel.title': 'Session Board',
      'panel.subtitle': '{total} sessions · {running} running',
      'action.refresh': 'Refresh',
      'action.newSession': 'New session',
      'action.open': 'Open session',
      'action.pin': 'Pin session',
      'action.unpin': 'Unpin session',
      'action.rename': 'Rename',
      'action.fork': 'Fork session',
      'action.copyId': 'Copy Session ID',
      'action.archive': 'Archive session',
      'action.archiveConfirm': 'Confirm archive',
      'action.archiveCancel': 'Cancel',
      'search.placeholder': 'Search title, task, or folder',
      'action.loadMore': 'Load more',
      'list.loaded': 'Showing {shown}/{total} sessions',
      'list.autoLoadHint': 'Scroll to the bottom to load more',
      'tab.overview': 'Overview',
      'tabs.label': 'Session filters',
      'heat.scaleLabel': 'Heatmap scale',
      'scope.label': 'Scope',
      'scope.all': 'All sessions',
      'scope.teamOption': '{title} ({n}-member team)',
      'overview.sessions': 'Sessions',
      'overview.sessionsSub': 'All visible sessions',
      'overview.running': 'Running',
      'overview.runningSub': 'Working right now',
      'overview.today': 'Active today',
      'overview.todaySub': 'Updated since midnight',
      'overview.todos': 'Todos done',
      'overview.todosSub': 'Sessions with loaded details only',
      'overview.heatTitle': 'Activity',
      'overview.heatHint': 'By each session last activity time',
      'heat.scale.year': 'Year',
      'heat.scale.month': 'Month',
      'heat.scale.week': 'Week',
      'heat.scale.day': 'Day',
      'heat.yearLabel': 'Year',
      'heat.monthLabel': 'Month',
      'heat.weekLabel': 'Week',
      'heat.dayLabel': 'Date',
      'heat.weekday.mon': 'M',
      'heat.weekday.wed': 'W',
      'heat.weekday.fri': 'F',
      'heat.less': 'Less',
      'heat.more': 'More',
      'heat.dayCount': '{date} · {count} sessions',
      'heat.hourCount': '{hour}:00 · {count} sessions',
      'heat.dayTotal': '{count} active sessions that day',
      'heat.kind.work': 'workday',
      'heat.kind.off': 'non-workday',
      'heat.highlightWorkday': 'Highlight workdays',
      'heat.highlightOffday': 'Highlight non-workdays',
      'heat.legend.default': 'Activity',
      'heat.legend.workday': 'Workdays',
      'heat.legend.offday': 'Non-workdays',
      'heat.holidayNote': 'Workdays follow China statutory holidays and make-up days (auto-updated from holiday-cn)',
      'heat.calendar.refresh': 'Refresh',
      'heat.calendar.refreshing': 'Updating…',
      'heat.calendar.loading': 'Updating calendar…',
      'heat.calendar.network': 'Calendar updated ({country} · {years} years · {time})',
      'heat.calendar.cache': 'Cached calendar ({country} · {time})',
      'heat.calendar.embedded': 'Built-in calendar data ({country})',
      'heat.calendar.error': 'Calendar update failed, using local data ({country})',
      'settings.country.label': 'Workday calendar',
      'settings.country.hint': 'Controls the workday/offday shading: China uses statutory holidays plus make-up workdays; other countries use public holidays and their local weekend rule.',
      'heat.meta.year': '{year}',
      'heat.meta.month': '{month}/{year}',
      'heat.meta.week': '{start} – {end}',
      'heat.meta.day': '{date}',
      'filter.all': 'All',
      'filter.running': 'Running',
      'filter.todos': 'With todos',
      'filter.done': 'Done',
      'status.running': 'Running',
      'status.idle': 'Idle',
      'work.current': 'Current work',
      'work.result': 'Latest result',
      'work.recent': 'Recent task',
      'work.none': 'No work recorded yet',
      'work.turn': 'Turn {turn}',
      'todo.title': 'Todos',
      'todo.done': '{done}/{total} done',
      'todo.none': 'No todo list',
      'todo.allDone': 'All {total} done',
      'todo.moreDone': '{n} more done',
      'todo.moreHidden': '{n} more hidden',
      'meta.untitled': 'Untitled session',
      'meta.pinned': 'Pinned',
      'rename.label': 'Session title',
      'rename.empty': 'Title cannot be empty',
      'rename.failed': 'Rename failed: {message}',
      'pin.failed': 'Could not update pin: {message}',
      'fork.failed': 'Could not fork: {message}',
      'copy.done': 'Session ID copied',
      'copy.failed': 'Could not copy: {message}',
      'meta.updated': 'updated {time}',
      'state.loading': 'Loading sessions…',
      'state.empty': 'No sessions yet',
      'state.emptyHint': 'Start a session and the board shows its current work, todos, and progress.',
      'state.error': 'Could not read the session list',
      'state.errorHint': 'Check the connection and retry; the board refreshes automatically after a reconnect.',
      'state.noMatch': 'No matching sessions',
      'state.noMatchHint': 'Try another keyword, or clear the search to see all sessions.',
      'state.retry': 'Retry',
      'state.partial': 'Older sessions show basic information only; details load for the most recently active sessions first.',
      'archive.failed': 'Could not archive: {message}',
      'time.justNow': 'just now',
      'time.minutes': '{n}m ago',
      'time.hours': '{n}h ago',
      'time.days': '{n}d ago',
      'time.months': '{n}mo ago',
    };

    // ------------------------------------------------------------- utilities
    function fill(template, params) {
      if (typeof template !== 'string') return String(template == null ? '' : template);
      if (!params) return template;
      return template.replace(/\{(\w+)\}/g, (match, key) => (
        Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match
      ));
    }

    function baseName(path) {
      if (!path) return '';
      const text = String(path).replace(/[\\/]+$/, '');
      const cut = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\'));
      return cut >= 0 ? text.slice(cut + 1) : text;
    }

    function remoteErrorText(result) {
      if (result && result.ok === false && result.error) {
        return String(result.error.message || result.error.code || '');
      }
      return '';
    }

    /* The selected filter tab is a browser preference: keep it across panel switches,
       page reloads, and app restarts. Invalid or unavailable storage falls back to the
       overview tab, which is the board's home. */
    function readStoredFilter() {
      try {
        const stored = window.localStorage.getItem(FILTER_STORAGE_KEY);
        return FILTERS.includes(stored) ? stored : 'overview';
      } catch (error) {
        return 'overview';
      }
    }

    function persistFilter(value) {
      try {
        window.localStorage.setItem(FILTER_STORAGE_KEY, value);
      } catch (error) {
        /* storage may be unavailable (private mode); the tab still works for this view */
      }
    }

    function readStoredHeatScale() {
      try {
        const stored = window.localStorage.getItem(HEAT_STORAGE_KEY);
        if (stored === 'hours') return 'day';
        return HEAT_SCALES.includes(stored) ? stored : 'year';
      } catch (error) {
        return 'year';
      }
    }

    function persistHeatScale(value) {
      try {
        window.localStorage.setItem(HEAT_STORAGE_KEY, value);
      } catch (error) {
        /* storage may be unavailable; the scale still works for this view */
      }
    }

    function readStoredHighlight() {
      try {
        const stored = JSON.parse(window.localStorage.getItem(HIGHLIGHT_STORAGE_KEY) || 'null');
        if (stored && typeof stored === 'object') {
          return { workday: stored.workday === true, offday: stored.offday === true };
        }
      } catch (error) {
        /* ignore malformed storage */
      }
      return { workday: false, offday: false };
    }

    function persistHighlight(value) {
      try {
        window.localStorage.setItem(HIGHLIGHT_STORAGE_KEY, JSON.stringify(value));
      } catch (error) {
        /* storage may be unavailable */
      }
    }

    function readStoredScope() {
      try {
        const stored = window.localStorage.getItem(SCOPE_STORAGE_KEY);
        return stored && stored.length > 0 ? stored : 'all';
      } catch (error) {
        return 'all';
      }
    }

    function persistScope(value) {
      try {
        window.localStorage.setItem(SCOPE_STORAGE_KEY, value);
      } catch (error) {
        /* storage may be unavailable; the scope still works for this view */
      }
    }

    function relativeTime(timestamp, t) {
      if (!timestamp) return '';
      const diff = Date.now() - Number(timestamp);
      if (!Number.isFinite(diff) || diff < 0) return t('time.justNow');
      if (diff < 60000) return t('time.justNow');
      const minutes = Math.floor(diff / 60000);
      if (minutes < 60) return t('time.minutes', { n: minutes });
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return t('time.hours', { n: hours });
      const days = Math.floor(hours / 24);
      if (days < 30) return t('time.days', { n: days });
      return t('time.months', { n: Math.floor(days / 30) });
    }

    async function mapLimit(items, limit, worker) {
      if (!items.length) return;
      const width = Math.max(1, Math.min(limit, items.length));
      let cursor = 0;
      const runners = [];
      for (let slot = 0; slot < width; slot += 1) {
        runners.push((async () => {
          for (;;) {
            const index = cursor;
            if (index >= items.length) return;
            cursor += 1;
            await worker(items[index]);
          }
        })());
      }
      await Promise.all(runners);
    }

    const DAY_MS = 24 * 60 * 60 * 1000;

    function startOfDay(time) {
      const date = new Date(time);
      date.setHours(0, 0, 0, 0);
      return date;
    }

    function addDays(time, days) {
      const date = new Date(time);
      date.setDate(date.getDate() + days);
      return date;
    }

    function dayKeyOf(time) {
      const date = new Date(time);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function shortDate(time) {
      const date = new Date(time);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }

    /** Monday 00:00 of the week containing `time`. */
    function mondayStart(time) {
      const date = startOfDay(time);
      const weekday = (date.getDay() + 6) % 7;
      date.setDate(date.getDate() - weekday);
      return date.getTime();
    }

    /** `work` or `off` for the configured country, falling back to its weekend rule. */
    function workdayKind(time) {
      const key = dayKeyOf(time);
      if (holidayIndex.off.has(key)) return 'off';
      if (holidayIndex.work.has(key)) return 'work';
      const weekday = new Date(time).getDay();
      return holidayIndex.weekend.has(weekday) ? 'off' : 'work';
    }

    function daysInYear(year) {
      return new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;
    }

    /** Bucket sessions by local calendar day for an explicit [start, start+days) range. */
    function buildCalendarCells(rows, startTime, days) {
      const start = startOfDay(startTime).getTime();
      const counts = new Map();
      for (const row of rows) {
        if (!row.updatedAt) continue;
        const key = dayKeyOf(row.updatedAt);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      const cells = [];
      for (let index = 0; index < days; index += 1) {
        const time = addDays(start, index).getTime();
        const key = dayKeyOf(time);
        cells.push({ time, key, count: counts.get(key) || 0, kind: workdayKind(time) });
      }
      return cells;
    }

    /** Bucket one selected day's activity by local hour. */
    function buildHourlyCells(rows, dayTime) {
      const start = startOfDay(dayTime).getTime();
      const end = addDays(start, 1).getTime();
      const counts = new Array(24).fill(0);
      let total = 0;
      for (const row of rows) {
        if (!row.updatedAt || row.updatedAt < start || row.updatedAt >= end) continue;
        counts[new Date(row.updatedAt).getHours()] += 1;
        total += 1;
      }
      return { cells: counts.map((count, hour) => ({ hour, count })), total, start };
    }

    /** Column index where each month starts, for the year heatmap's month header. */
    function monthLabelsFor(cells, offset) {
      const labels = [];
      let lastMonth = -1;
      cells.forEach((cell, index) => {
        const month = new Date(cell.time).getMonth();
        if (month === lastMonth) return;
        lastMonth = month;
        labels.push({ month, column: Math.floor((index + offset) / 7) });
      });
      return labels;
    }

    function heatLevelOf(count, max) {
      if (!count) return 0;
      if (!max) return 1;
      return Math.max(1, Math.min(4, Math.ceil((count / max) * 4)));
    }

    /** Rough card height used to aim the shortest masonry column at its next card. */
    function estimateCardHeight(row) {
      let height = 32 + 18 + 8 + 22 + 12 + 62 + 12 + 33;
      if (row.total > 0) {
        height += 16 + 8 + 5 + 8;
        height += 18 + Math.min(row.total, TODOS_SHOWN) * 22 + (row.total > TODOS_SHOWN ? 18 : 0);
      } else {
        height += 18;
      }
      return height;
    }

    function projectionOf(row) {
      const values = row && row.projectionValues;
      if (!values || typeof values !== 'object') return null;
      const work = values[PROJECTION_KEY];
      return work && typeof work === 'object' ? work : null;
    }

    function buildRow(entry, t, overlayValues, pinned) {
      const work = projectionOf(entry)
        || (overlayValues && overlayValues[PROJECTION_KEY] && typeof overlayValues[PROJECTION_KEY] === 'object'
          ? overlayValues[PROJECTION_KEY]
          : null);
      const todos = work && Array.isArray(work.todos) ? work.todos : [];
      const running = entry.running === true;
      const inProgress = todos.find((todo) => todo && todo.status === 'in_progress') || null;
      const completed = work && Number.isFinite(Number(work.done))
        ? Number(work.done)
        : todos.filter((todo) => todo && todo.status === 'completed').length;
      const total = work && Number.isFinite(Number(work.total)) ? Number(work.total) : todos.length;
      const request = work && typeof work.request === 'string' ? work.request : '';
      const reply = work && typeof work.reply === 'string' ? work.reply : '';
      const turn = work && Number.isFinite(Number(work.turn)) ? Number(work.turn) : 0;
      const endKind = work && typeof work.endKind === 'string' ? work.endKind : '';
      const currentWork = running
        ? (inProgress && inProgress.content ? inProgress.content : request)
        : (reply || request);
      const title = typeof entry.title === 'string' && entry.title
        ? entry.title
        : (typeof entry.displayTitle === 'string' && entry.displayTitle !== entry.id ? entry.displayTitle : '');
      const teamProjection = (entry.projectionValues && entry.projectionValues.agentTeam)
        || (overlayValues && overlayValues.agentTeam)
        || null;
      let team = null;
      if (teamProjection && Array.isArray(teamProjection.members) && teamProjection.members.length > 0) {
        const members = [];
        for (const member of teamProjection.members) {
          if (!member || typeof member.id !== 'string') continue;
          members.push({
            id: member.id,
            name: typeof member.name === 'string' ? member.name : '',
            role: member.role === 'lead' ? 'lead' : 'teammate',
          });
        }
        if (members.some((member) => member.role === 'lead' && member.id === entry.id)) {
          team = { id: entry.id, members, size: members.length };
        }
      }
      return {
        sessionId: entry.id,
        title,
        running,
        blank: entry.blank === true,
        updatedAt: Number(entry.updatedAt) || 0,
        cwd: typeof entry.cwd === 'string' ? entry.cwd : '',
        origin: entry.origin,
        todos,
        completed,
        total,
        progressPct: total ? Math.min(100, Math.round((completed / total) * 100)) : 0,
        inProgress,
        request,
        reply,
        turn,
        endKind,
        currentWork,
        hasDetails: work != null,
        pinned: pinned === true,
        parentId: typeof entry.parentId === 'string' ? entry.parentId : '',
        team,
        statsText: turn > 0 ? t('work.turn', { turn }) : '',
      };
    }

    // ----------------------------------------------------------------- icons
    // Icon geometry is copied from the shipped Client UI primitives (16px grid,
    // regular stroke width 1) so board actions read the same as the native
    // Session row menu: pin / edit / archive / open / refresh / new chat.
    function hostIcon(size, children) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        'aria-hidden': true,
        focusable: false,
        strokeWidth: 1,
        style: { display: 'block' },
      }, children);
    }

    function IconRefresh() {
      return hostIcon(14, [
        h('path', {
          key: 'arc',
          d: 'M14.5001 8C14.5 9.28552 14.1188 10.5422 13.4045 11.611C12.6903 12.6799 11.6752 13.5129 10.4875 14.0049C9.29982 14.4968 7.99295 14.6255 6.73212 14.3747C5.4713 14.124 4.31314 13.505 3.4041 12.596C2.49514 11.687 1.87614 10.5288 1.62537 9.26798C1.37459 8.00716 1.50331 6.70028 1.99525 5.51261C2.48719 4.32494 3.32025 3.30981 4.3891 2.59557C5.45795 1.88134 6.71458 1.50008 8.0001 1.5C9.9001 1.5 11.7001 2.3 13.0001 3.6L14.5001 5.1',
          stroke: 'currentColor',
        }),
        h('path', { key: 'head', d: 'M14.4999 1.5V5.1H10.8999', stroke: 'currentColor' }),
      ]);
    }

    function IconNewChat() {
      return hostIcon(14, [
        h('path', {
          key: 'bubble',
          d: 'M2.37091 11.2501C1.58745 9.89288 1.32067 8.29835 1.61969 6.76006C1.91872 5.22177 2.76342 3.8433 3.99826 2.87846C5.2331 1.91362 6.77494 1.42737 8.33988 1.50925C9.90482 1.59113 11.3875 2.23562 12.5149 3.32406C13.6425 4.41269 14.3387 5.87206 14.4754 7.4334C14.612 8.99474 14.18 10.5529 13.2587 11.8209C12.3375 13.0888 10.9891 13.9813 9.46194 14.3337C8.18691 14.628 6.85895 14.5294 5.64989 14.0605C5.1712 13.8748 4.76962 13.4932 4.26534 13.3967C3.67413 13.2835 2.95257 13.5598 2.03794 14.3337',
          stroke: 'currentColor',
        }),
        h('path', { key: 'v', d: 'M8 5V11', stroke: 'currentColor' }),
        h('path', { key: 'h', d: 'M5 8H11', stroke: 'currentColor' }),
      ]);
    }

    function IconArchive() {
      return hostIcon(14, [
        h('path', {
          key: 'lid',
          d: 'M13.5 2.5H2.5C1.94772 2.5 1.5 2.94772 1.5 3.5V4.5C1.5 5.05228 1.94772 5.5 2.5 5.5H13.5C14.0523 5.5 14.5 5.05228 14.5 4.5V3.5C14.5 2.94772 14.0523 2.5 13.5 2.5Z',
          stroke: 'currentColor',
        }),
        h('path', {
          key: 'box',
          d: 'M2.5 5.5V13.5C2.5 13.7652 2.60536 14.0196 2.79289 14.2071C2.98043 14.3946 3.23478 14.5 3.5 14.5H12.5C12.7652 14.5 13.0196 14.3946 13.2071 14.2071C13.3946 14.0196 13.5 13.7652 13.5 13.5V5.5',
          stroke: 'currentColor',
        }),
        h('path', { key: 'slot', d: 'M6.5 9.5H9.5', stroke: 'currentColor' }),
      ]);
    }

    function IconPin(props) {
      const filled = Boolean(props && props.filled);
      return hostIcon(14, [
        h('path', {
          key: 'body',
          d: 'M9.96976 1.70572L13.1554 3.93629L10.9019 8.12317L11.5158 11.605L10.7192 12.7427L2.52767 7.00693L3.3243 5.86922L6.80612 5.25528L9.96976 1.70572Z',
          fill: filled ? 'currentColor' : undefined,
          stroke: 'currentColor',
          strokeLinejoin: 'round',
        }),
        h('path', {
          key: 'needle',
          d: 'M6.05285 9.47511C6.27284 9.16094 6.70586 9.08458 7.02003 9.30457C7.3342 9.52455 7.41055 9.95757 7.19057 10.2717L3.98587 14.4708L3.21223 13.9291L6.05285 9.47511Z',
          fill: 'currentColor',
        }),
      ]);
    }

    function IconRename() {
      return hostIcon(14, [
        h('path', {
          key: 'box',
          d: 'M8.85596 2.69971H4.19971C3.37141 2.69971 2.69992 3.37146 2.69971 4.19971V11.8003C2.69992 12.6285 3.37141 13.3003 4.19971 13.3003H11.8003C12.6283 13.2999 13.3001 12.6283 13.3003 11.8003V7.89893H14.3003V11.8003C14.3001 13.1806 13.1806 14.2999 11.8003 14.3003H4.19971C2.81913 14.3003 1.69992 13.1808 1.69971 11.8003V4.19971C1.69992 2.81918 2.81913 1.69971 4.19971 1.69971H8.85596V2.69971Z',
          fill: 'currentColor',
        }),
        h('path', { key: 'pen', d: 'M7.7849 8.23878L13.888 2.13574', stroke: 'currentColor' }),
      ]);
    }

    function IconBoard() {
      return hostIcon(20, [
        h('path', { key: 'frame', d: 'M2.6 3.4h10.8v9.2H2.6z', stroke: 'currentColor' }),
        h('path', { key: 'c1', d: 'M5.2 6h1.9', stroke: 'currentColor' }),
        h('path', { key: 'c2', d: 'M5.2 8.6h1.9', stroke: 'currentColor' }),
        h('path', { key: 'c3', d: 'M9.1 6h1.9', stroke: 'currentColor' }),
        h('path', { key: 'c4', d: 'M9.1 8.6h1.9', stroke: 'currentColor' }),
      ]);
    }

    // Tab icons: same geometry as the shipped Client UI primitives.
    function IconOverview() {
      return hostIcon(14, [
        h('path', {
          key: 'gauge',
          d: 'M3.4041 13.096C2.49514 12.187 1.87614 11.0288 1.62537 9.76798C1.37459 8.50716 1.50331 7.20028 1.99525 6.01261C2.48719 4.82494 3.32025 3.80981 4.3891 3.09557C5.45795 2.38134 6.71458 2.00008 8.0001 2C9.28563 2.00008 10.5423 2.38134 11.6111 3.09557C12.68 3.80981 13.513 4.82494 14.005 6.01261C14.4969 7.20028 14.6256 8.50716 14.3748 9.76798C14.1241 11.0288 13.5051 12.187 12.5961 13.096',
          stroke: 'currentColor',
        }),
        h('path', { key: 'needle', d: 'M8 8.49994L11.6114 4.88855', stroke: 'currentColor' }),
        h('path', {
          key: 'hub',
          d: 'M8 9.75C8.69036 9.75 9.25 9.19036 9.25 8.5C9.25 7.80964 8.69036 7.25 8 7.25C7.30964 7.25 6.75 7.80964 6.75 8.5C6.75 9.19036 7.30964 9.75 8 9.75Z',
          fill: 'currentColor',
        }),
      ]);
    }

    function IconAll() {
      return hostIcon(14, [
        h('path', {
          key: 'rows',
          d: 'M6 3.5h7.5M6 8h7.5M6 12.5h7.5',
          stroke: 'currentColor',
          strokeLinecap: 'round',
        }),
        h('path', {
          key: 'bullets',
          d: 'M2.6 3.5h.01M2.6 8h.01M2.6 12.5h.01',
          stroke: 'currentColor',
          strokeLinecap: 'round',
        }),
      ]);
    }

    function IconRunning() {
      return hostIcon(14, [
        h('path', {
          key: 'arc',
          d: 'M12.596 12.596C11.687 13.5049 10.5288 14.1239 9.26798 14.3747C8.00716 14.6255 6.70028 14.4968 5.51261 14.0048C4.32494 13.5129 3.30981 12.6798 2.59557 11.611C1.88134 10.5421 1.50008 9.2855 1.5 7.99998C1.50008 6.71446 1.88134 5.45783 2.59557 4.38898C3.30981 3.32013 4.32494 2.48707 5.51261 1.99513C6.70028 1.50319 8.00716 1.37447 9.26798 1.62524C10.5288 1.87602 11.687 2.49502 12.596 3.40398',
          stroke: 'currentColor',
        }),
      ]);
    }

    function IconTodos() {
      return hostIcon(14, [
        h('path', {
          key: 'c1',
          d: 'M3.75 6.25C4.7165 6.25 5.5 5.4665 5.5 4.5C5.5 3.5335 4.7165 2.75 3.75 2.75C2.7835 2.75 2 3.5335 2 4.5C2 5.4665 2.7835 6.25 3.75 6.25Z',
          stroke: 'currentColor',
        }),
        h('path', { key: 'l1', d: 'M7.5 4.5H13.5', stroke: 'currentColor' }),
        h('path', {
          key: 'c2',
          d: 'M3.75 13.25C4.7165 13.25 5.5 12.4665 5.5 11.5C5.5 10.5335 4.7165 9.75 3.75 9.75C2.7835 9.75 2 10.5335 2 11.5C2 12.4665 2.7835 13.25 3.75 13.25Z',
          stroke: 'currentColor',
        }),
        h('path', { key: 'l2', d: 'M7.5 11.5H13.5', stroke: 'currentColor' }),
      ]);
    }

    function IconDone() {
      return hostIcon(14, [
        h('path', {
          key: 'check',
          d: 'M12.5303 6.53027L8.80273 10.2578C8.54967 10.5109 8.31796 10.7439 8.10645 10.9141C7.88375 11.0932 7.616 11.2602 7.27344 11.3145C7.09229 11.3431 6.90771 11.3431 6.72656 11.3145C6.384 11.2602 6.11625 11.0932 5.89355 10.9141C5.68204 10.7439 5.45033 10.5109 5.19727 10.2578L3.46973 8.53027L4.53027 7.46973L6.25781 9.19727C6.53457 9.47402 6.70036 9.63859 6.83398 9.74609C6.95637 9.84453 6.98241 9.83644 6.96094 9.83301C6.98679 9.83709 7.01321 9.83709 7.03906 9.83301C7.01759 9.83644 7.04363 9.84453 7.16602 9.74609C7.29964 9.63859 7.46543 9.47402 7.74219 9.19727L11.4697 5.46973L12.5303 6.53027Z',
          fill: 'currentColor',
        }),
        h('path', {
          key: 'circle',
          d: 'M14.5996 8C14.5996 4.35492 11.6451 1.40039 8 1.40039C4.35492 1.40039 1.40039 4.35492 1.40039 8C1.40039 11.6451 4.35492 14.5996 8 14.5996C11.6451 14.5996 14.5996 11.6451 14.5996 8ZM15.9004 8C15.9004 12.363 12.363 15.9004 8 15.9004C3.63695 15.9004 0.0996094 12.363 0.0996094 8C0.0996094 3.63695 3.63695 0.0996094 8 0.0996094C12.363 0.0996094 15.9004 3.63695 15.9004 8Z',
          fill: 'currentColor',
        }),
      ]);
    }

    function IconFork() {
      return hostIcon(14, [
        h('path', {
          key: 'upper',
          d: 'M1.01503 8.0001L5.6964 8.0001C6.41913 8.0001 6.78049 8.0001 7.12115 7.91951C7.4232 7.84804 7.71233 7.73014 7.97821 7.57C8.27809 7.38939 8.5364 7.13669 9.05303 6.63129L11.3281 4.40564',
          stroke: 'currentColor',
        }),
        h('path', {
          key: 'lower',
          d: 'M1.01221 7.9999L5.6964 7.9999C6.41913 7.9999 6.78049 7.9999 7.12115 8.08049C7.4232 8.15196 7.71233 8.26986 7.97821 8.43C8.27809 8.61061 8.5364 8.86331 9.05303 9.36871L11.3281 11.5944',
          stroke: 'currentColor',
        }),
        h('circle', { key: 'top', cx: 12.4502, cy: 3.3079, r: 1.56962, stroke: 'currentColor' }),
        h('circle', { key: 'bottom', cx: 12.4502, cy: 12.6921, r: 1.56962, stroke: 'currentColor' }),
      ]);
    }

    function IconCopy() {
      return hostIcon(14, [
        h('rect', {
          key: 'sheet',
          x: 1.52075,
          y: 4.07373,
          width: 10.3932,
          height: 10.3932,
          rx: 2,
          stroke: 'currentColor',
        }),
        h('path', {
          key: 'back',
          d: 'M11.9792 1.53296C13.36 1.53296 14.4792 2.65225 14.4792 4.03296V9.42847C14.4792 10.3756 13.9521 11.1987 13.1755 11.6228V10.3298C13.3652 10.0787 13.4792 9.7674 13.4792 9.42847V4.03296C13.4792 3.20453 12.8077 2.53296 11.9792 2.53296H6.58374C6.27966 2.53301 5.99684 2.6235 5.7605 2.77905H4.42358C4.85652 2.03463 5.66056 1.53304 6.58374 1.53296H11.9792Z',
          fill: 'currentColor',
        }),
      ]);
    }

    // ----------------------------------------------------------------- style
    const CSS = `
.skb-page{height:100%;min-height:0;display:flex;flex-direction:column;gap:16px;padding:28px 28px 32px;box-sizing:border-box;overflow-y:auto;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit}
.skb-inner{width:100%;max-width:1120px;margin:0 auto;display:flex;flex-direction:column;gap:16px;min-height:100%}
.skb-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;flex:none}
.skb-head-main{min-width:0}
.skb-title{margin:0;font-size:20px;line-height:28px;font-weight:500;letter-spacing:.01em}
.skb-subtitle{margin:4px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.skb-head-actions{display:flex;align-items:center;gap:8px;flex:none}
.skb-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;height:36px;padding:0 14px;border-radius:var(--dsw-radius-md,8px);border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:22px;cursor:pointer;transition:background .15s,border-color .15s,opacity .15s}
.skb-btn:hover{background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-2))}
.skb-btn-ghost{border-color:var(--dsw-alias-border-l3,var(--dsw-alias-border-l1))}
.skb-btn-primary{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base))}
.skb-btn-primary:hover{background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-brand-primary));opacity:1}
.skb-btn[disabled]{opacity:.55;cursor:default}
.skb-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;flex:none}
.skb-scope{display:flex;align-items:center;gap:8px;min-width:0}
.skb-scope-label{flex:none;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.skb-select,.skb-date-input{height:36px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:22px;cursor:pointer;border:none;display:inline-flex;align-items:center;gap:12px;padding:0 14px;box-sizing:border-box;min-width:0}
.skb-select:hover{background:var(--dsw-alias-interactive-bg-hover)}
.skb-select:focus-visible,.skb-date-input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.skb-select[disabled]{opacity:.5;cursor:default}
.skb-select-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skb-select-chevron{flex:none}
.skb-select--block{width:100%;justify-content:space-between}
.skb-select--scope{max-width:280px}
.skb-select--platform{flex:none;white-space:nowrap}
/* Long option lists (teams, countries, weeks) scroll inside a bounded menu instead of
   stretching to the full viewport height; the shell's scrollable list already makes the
   viewport scroll, this only caps the surface height. */
.skb-menu-list{max-height:min(400px,calc(100vh - 120px))}
.skb-date-input{width:100%;cursor:default;color-scheme:inherit}
.skb-search-field{width:236px;max-width:100%}
.skb-overview{display:flex;flex-direction:column;gap:14px;min-width:0}
.skb-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}
.skb-stat{display:flex;flex-direction:column;gap:6px;min-width:0;padding:14px 16px;border-radius:12px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.skb-stat-label{font-size:12px;line-height:17px;color:var(--dsw-alias-label-secondary)}
.skb-stat-value{font-size:24px;line-height:30px;font-weight:600;font-variant-numeric:tabular-nums}
.skb-stat-sub{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary)}
.skb-panel{display:flex;flex-direction:column;gap:14px;min-width:0;padding:16px;border-radius:12px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.skb-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.skb-panel-title{display:flex;flex-direction:column;gap:2px;min-width:0}
.skb-panel-title strong{font-size:14px;line-height:20px;font-weight:600}
.skb-panel-title span{font-size:11.5px;line-height:17px;color:var(--dsw-alias-label-secondary)}
.skb-scale{width:100%}
.skb-heat-body{display:flex;align-items:flex-start;gap:6px;min-width:0}
.skb-heat-days{display:flex;flex-direction:column;gap:3px;flex:none;width:18px}
.skb-heat-day{height:13px;font-size:10px;line-height:13px;color:var(--dsw-alias-label-secondary);text-align:right}
.skb-heat-scroll{flex:1;min-width:0;overflow-x:auto;padding-bottom:4px}
.skb-heat-grid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,13px);gap:3px;width:max-content}
.skb-heat-cell{width:13px;height:13px;border-radius:3px;background:var(--dsw-alias-bg-layer-2);box-sizing:border-box;flex:none}
.skb-heat-cell.is-pad{background:transparent}
.skb-heat-cell.lvl-1{background:var(--dsw-alias-brand-primary);opacity:.22}
.skb-heat-cell.lvl-2{background:var(--dsw-alias-brand-primary);opacity:.4}
.skb-heat-cell.lvl-3{background:var(--dsw-alias-brand-primary);opacity:.65}
.skb-heat-cell.lvl-4{background:var(--dsw-alias-brand-primary);opacity:1}
.skb-heat-week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
.skb-heat-week-cell{display:flex;flex-direction:column;gap:6px;align-items:center;min-width:0}
.skb-heat-week-cell .skb-heat-cell{width:100%;height:52px;border-radius:5px}
.skb-heat-daylabel{font-size:10px;line-height:13px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.skb-heat-hours{display:grid;grid-template-columns:repeat(24,minmax(0,1fr));gap:3px}
.skb-heat-hours .skb-heat-cell{width:100%;height:38px;border-radius:4px}
.skb-heat-hours-wrap{display:flex;flex-direction:column;gap:4px;min-width:0}
.skb-heat-hour-labels{display:grid;grid-template-columns:repeat(24,minmax(0,1fr));gap:3px;font-size:10px;line-height:13px;color:var(--dsw-alias-label-secondary)}
.skb-heat-legend{display:flex;flex-direction:column;align-items:flex-end;gap:4px;font-size:11px;line-height:14px;color:var(--dsw-alias-label-secondary)}
.skb-heat-legend-row{display:flex;align-items:center;gap:5px}
.skb-heat-legend-label{min-width:48px;text-align:right}
.skb-heat-swatch{width:12px;height:12px;border-radius:3px;background:var(--dsw-alias-bg-layer-2);flex:none}
.skb-heat-swatch.lvl-1{background:var(--dsw-alias-brand-primary);opacity:.22}
.skb-heat-swatch.lvl-2{background:var(--dsw-alias-brand-primary);opacity:.4}
.skb-heat-swatch.lvl-3{background:var(--dsw-alias-brand-primary);opacity:.65}
.skb-heat-swatch.lvl-4{background:var(--dsw-alias-brand-primary);opacity:1}
.skb-heat-swatch.is-workday{background:var(--dsw-alias-state-success-primary)}
.skb-heat-swatch.is-workday.lvl-0{opacity:.12}
.skb-heat-swatch.is-workday.lvl-1{opacity:.3}
.skb-heat-swatch.is-workday.lvl-2{opacity:.48}
.skb-heat-swatch.is-workday.lvl-3{opacity:.72}
.skb-heat-swatch.is-workday.lvl-4{opacity:1}
.skb-heat-swatch.is-offday{background:var(--dsw-alias-state-warn-primary)}
.skb-heat-swatch.is-offday.lvl-0{opacity:.14}
.skb-heat-swatch.is-offday.lvl-1{opacity:.32}
.skb-heat-swatch.is-offday.lvl-2{opacity:.52}
.skb-heat-swatch.is-offday.lvl-3{opacity:.76}
.skb-heat-swatch.is-offday.lvl-4{opacity:1}
.skb-heat-meta{font-size:11.5px;line-height:17px;color:var(--dsw-alias-label-secondary)}
.skb-heat-layout{display:flex;align-items:flex-start;gap:18px;flex-wrap:wrap;min-width:0}
.skb-heat-side{display:flex;flex-direction:column;gap:12px;flex:none;width:216px;max-width:100%;min-width:0}
.skb-heat-main{display:flex;flex-direction:column;gap:10px;flex:1 1 320px;min-width:0}
.skb-heat-field{display:flex;flex-direction:column;gap:4px;min-width:0}
.skb-heat-field-label{font-size:11.5px;line-height:16px;color:var(--dsw-alias-label-secondary)}
.skb-heat-note{margin:0;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary)}
.skb-heat-calendar{display:flex;flex-direction:column;gap:2px;align-items:flex-start}
.skb-link-btn{border:0;background:none;padding:0;font:inherit;font-size:11px;line-height:16px;color:var(--dsw-alias-brand-primary);cursor:pointer;text-decoration:underline}
.skb-link-btn:hover{opacity:.8}
.skb-link-btn[disabled]{opacity:.5;cursor:default}
.skb-settings-row{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}
.skb-settings-text{display:flex;flex:1;flex-direction:column;min-width:0}
.skb-settings-label{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:20px}
.skb-settings-hint{color:var(--dsw-alias-label-secondary);margin-top:4px;font-size:12px;line-height:18px}
.skb-heat-months{position:relative;height:14px;margin-bottom:4px}
.skb-heat-month{position:absolute;top:0;font-size:10px;line-height:14px;color:var(--dsw-alias-label-secondary)}
.skb-heat-grid.is-month{grid-template-rows:repeat(7,18px);gap:4px}
.skb-heat-grid.is-month .skb-heat-cell{width:18px;height:18px;border-radius:4px}
.skb-heat-body.is-month .skb-heat-days{gap:4px}
.skb-heat-body.is-month .skb-heat-day{height:18px;line-height:18px}
.skb-heat-cell.is-workday{background:var(--dsw-alias-state-success-primary)}
.skb-heat-cell.is-workday.lvl-0{opacity:.12}
.skb-heat-cell.is-workday.lvl-1{opacity:.3}
.skb-heat-cell.is-workday.lvl-2{opacity:.48}
.skb-heat-cell.is-workday.lvl-3{opacity:.72}
.skb-heat-cell.is-workday.lvl-4{opacity:1}
.skb-heat-cell.is-offday{background:var(--dsw-alias-state-warn-primary)}
.skb-heat-cell.is-offday.lvl-0{opacity:.14}
.skb-heat-cell.is-offday.lvl-1{opacity:.32}
.skb-heat-cell.is-offday.lvl-2{opacity:.52}
.skb-heat-cell.is-offday.lvl-3{opacity:.76}
.skb-heat-cell.is-offday.lvl-4{opacity:1}
.skb-heat-side .skb-scale{width:100%}
.skb-grid{display:flex;align-items:flex-start;gap:14px;min-width:0}
.skb-col{display:flex;flex-direction:column;gap:14px;flex:1 1 0;min-width:0}
.skb-grid-wrap{display:flex;flex-direction:column;gap:12px;min-width:0}
.skb-more{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;width:100%;padding:10px 0}
.skb-more-text{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.skb-more-hint{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);opacity:.8}
.skb-card{display:flex;flex-direction:column;gap:12px;min-width:0;padding:16px;border-radius:12px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);cursor:pointer;transition:border-color .15s,box-shadow .15s;content-visibility:auto;contain-intrinsic-size:auto 260px}
.skb-card:hover{border-color:var(--dsw-alias-border-l2);box-shadow:0 6px 18px rgba(0,0,0,.08)}
.skb-card:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.skb-card.is-running{border-color:var(--dsw-alias-state-success-primary)}
.skb-card-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.skb-card-top-left{display:flex;align-items:center;gap:8px;min-width:0}
.skb-pin{display:inline-flex;flex:none;color:var(--dsw-alias-label-secondary)}
.skb-status{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:500;color:var(--dsw-alias-label-secondary)}
.skb-status.is-running{color:var(--dsw-alias-state-success-primary)}
.skb-dot{width:7px;height:7px;flex:none;border-radius:50%;background:currentColor}
.skb-status.is-running .skb-dot{animation:skb-pulse 1.6s ease-in-out infinite}
@keyframes skb-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
.skb-time{flex:none;font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.skb-card-title{margin:0;font-size:15px;line-height:22px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skb-title-input{box-sizing:border-box;width:100%;height:28px;padding:0 8px;border-radius:var(--dsw-radius-sm,6px);border:1px solid var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:15px;font-weight:600;line-height:22px;outline:none}
.skb-turn{font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.skb-label{font-size:11px;line-height:16px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--dsw-alias-label-secondary)}
.skb-work{display:flex;flex-direction:column;gap:4px;min-width:0}
.skb-work-text{margin:0;font-size:13px;line-height:19px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-word}
.skb-work-sub{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;word-break:break-word}
.skb-todos{display:flex;flex-direction:column;gap:8px;min-width:0}
.skb-todo-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.skb-todo-count{flex:none;font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.skb-bar{height:5px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}
.skb-bar-fill{height:100%;border-radius:999px;background:var(--dsw-alias-brand-primary);transition:width .3s ease}
.skb-todo-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;min-width:0}
.skb-todo{display:flex;align-items:flex-start;gap:7px;min-width:0;font-size:12.5px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.skb-todo-glyph{flex:none;width:14px;text-align:center;line-height:18px;font-size:11px}
.skb-todo-text{min-width:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;word-break:break-word}
.skb-todo.is-in_progress{color:var(--dsw-alias-label-primary);font-weight:500}
.skb-todo.is-in_progress .skb-todo-glyph{color:var(--dsw-alias-brand-primary)}
.skb-todo.is-completed{opacity:.72}
.skb-todo.is-completed .skb-todo-text{text-decoration:line-through}
.skb-todo.is-completed .skb-todo-glyph{color:var(--dsw-alias-state-success-primary)}
.skb-todo-more{font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.skb-todo-empty{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.skb-todo-alldone{display:flex;align-items:center;gap:6px;margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-state-success-primary)}
.skb-card-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:8px;border-top:1px solid var(--dsw-alias-border-l1)}
.skb-cwd{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-secondary)}
.skb-actions{display:flex;align-items:center;gap:4px;flex:none;opacity:0;transition:opacity .15s}
.skb-card:hover .skb-actions,.skb-card:focus-within .skb-actions{opacity:1}
.skb-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:1px solid transparent;border-radius:var(--dsw-radius-sm,6px);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;transition:background .15s,color .15s}
.skb-icon-btn:hover{background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-2));color:var(--dsw-alias-label-primary)}
.skb-icon-btn.is-active{color:var(--dsw-alias-brand-primary)}
.skb-icon-btn[disabled]{opacity:.5;cursor:default}
.skb-icon-btn.is-danger:hover{color:var(--dsw-alias-state-error-primary)}
.skb-confirm{display:flex;align-items:center;gap:6px}
.skb-confirm-text{font-size:11.5px;color:var(--dsw-alias-state-warn-primary);white-space:nowrap}
.skb-confirm .skb-btn{height:26px;padding:0 9px;font-size:12px}
.skb-state{display:flex;flex:1;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:64px 24px;border:1px dashed var(--dsw-alias-border-l1);border-radius:12px;color:var(--dsw-alias-label-secondary);text-align:center}
.skb-state-title{margin:0;font-size:14px;line-height:20px;font-weight:600;color:var(--dsw-alias-label-primary)}
.skb-state-hint{margin:0;max-width:440px;font-size:12.5px;line-height:19px}
.skb-skeleton-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.skb-skeleton{height:198px;border-radius:12px;border:1px solid var(--dsw-alias-border-l1);background:linear-gradient(90deg,var(--dsw-alias-bg-layer-1) 0%,var(--dsw-alias-bg-layer-2) 50%,var(--dsw-alias-bg-layer-1) 100%);background-size:200% 100%;animation:skb-shimmer 1.4s linear infinite}
@keyframes skb-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.skb-note{margin:0;font-size:11.5px;line-height:17px;color:var(--dsw-alias-label-secondary)}
.skb-error-box{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:9px;border:1px solid var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-layer-1);font-size:12.5px;line-height:18px;color:var(--dsw-alias-state-error-primary)}
.skb-error-box .skb-btn{margin-left:auto}
.skb-notice-box{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:9px;border:1px solid var(--dsw-alias-state-success-primary);background:var(--dsw-alias-bg-layer-1);font-size:12.5px;line-height:18px;color:var(--dsw-alias-state-success-primary)}
.skb-footer-note{margin:0;padding-top:2px;font-size:11px;line-height:17px;color:var(--dsw-alias-label-secondary)}
@media (hover:none){.skb-actions{opacity:1}}
@media (prefers-reduced-motion:reduce){.skb-status.is-running .skb-dot,.skb-skeleton{animation:none}.skb-card,.skb-bar-fill,.skb-actions{transition:none}}
`;

    // ------------------------------------------------------------ component
    function SessionBoardPage(props) {
      const ctx = props.ctx;
      const t = useMemo(() => ctx.locale.bind(NS), [ctx]);
      const sessions = ctx.sessions;
      const [query, setQuery] = useState('');
      const [filter, setFilter] = useState(readStoredFilter);
      const [scope, setScope] = useState(readStoredScope);
      const [heatScale, setHeatScale] = useState(readStoredHeatScale);
      const [heatYear, setHeatYear] = useState(() => new Date().getFullYear());
      const [heatMonthStart, setHeatMonthStart] = useState(() => {
        const now = new Date();
        now.setDate(1);
        now.setHours(0, 0, 0, 0);
        return now.getTime();
      });
      const [heatWeekStart, setHeatWeekStart] = useState(() => mondayStart(Date.now()));
      const [heatDay, setHeatDay] = useState(() => startOfDay(Date.now()).getTime());
      const [highlight, setHighlight] = useState(readStoredHighlight);
      const [calendarTick, setCalendarTick] = useState(0);
      const [calendarLoading, setCalendarLoading] = useState(false);
      const [calendarInfo, setCalendarInfo] = useState(() => {
        const country = readStoredSettings().country;
        const cached = readStoredCalendar(country);
        return cached
          ? { country, source: 'cache', updatedAt: cached.fetchedAt, years: Object.keys(cached.years).length, failed: false }
          : { country, source: 'embedded', updatedAt: 0, years: 0, failed: false };
      });
      const [localeTick, setLocaleTick] = useState(0);
      const [refreshing, setRefreshing] = useState(false);
      const [archiveTarget, setArchiveTarget] = useState(null);
      const [busyId, setBusyId] = useState(null);
      const [errorText, setErrorText] = useState(null);
      const [notice, setNotice] = useState(null);
      const [editingId, setEditingId] = useState(null);
      const [draftTitle, setDraftTitle] = useState('');
      const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
      const [columnCount, setColumnCount] = useState(3);
      const [gridNode, setGridNode] = useState(null);
      const pageRef = useRef(null);
      const [overlayTick, setOverlayTick] = useState(0);
      const overlayRef = useRef(new Map());
      const pumpRef = useRef({ running: false, queue: [], seen: new Set() });
      const mountedRef = useRef(true);
      const editingRef = useRef(null);
      const renameBusyRef = useRef(false);
      const noticeTimerRef = useRef(null);
      const rowCacheRef = useRef(new WeakMap());

      const subscribeSessions = useCallback((notify) => sessions.list.subscribe(notify), [sessions]);
      const getSessionsSnapshot = useCallback(() => sessions.list.getSnapshot(), [sessions]);
      const sessionSnapshot = useSyncExternalStore(subscribeSessions, getSessionsSnapshot, getSessionsSnapshot);

      const workspacesStore = ctx.workspaces && ctx.workspaces.list ? ctx.workspaces.list : null;
      const subscribeWorkspaces = useCallback((notify) => (
        workspacesStore ? workspacesStore.subscribe(notify) : () => {}
      ), [workspacesStore]);
      const getWorkspacesSnapshot = useCallback(() => (
        workspacesStore ? workspacesStore.getSnapshot() : EMPTY_WORKSPACE_SNAPSHOT
      ), [workspacesStore]);
      const workspaceSnapshot = useSyncExternalStore(
        subscribeWorkspaces,
        getWorkspacesSnapshot,
        getWorkspacesSnapshot,
      );
      const pinnedIds = useMemo(() => {
        const value = workspaceSnapshot && workspaceSnapshot.pinnedSessionIds;
        return Array.isArray(value) ? value : [];
      }, [workspaceSnapshot]);
      const pinnedOrder = useMemo(() => new Map(pinnedIds.map((id, index) => [id, index])), [pinnedIds]);

      const boundT = useMemo(() => {
        void localeTick;
        return (key, params) => fill(t(key), params);
      }, [t, localeTick]);

      useEffect(() => {
        const off = ctx.locale.subscribe(() => { setLocaleTick((value) => value + 1); });
        return () => { if (typeof off === 'function') off(); };
      }, [ctx]);

      /** Refresh the working calendar for the country selected in Settings. */
      const refreshCalendar = useCallback(async (force) => {
        setCalendarLoading(true);
        const info = await refreshHolidayCalendar(force);
        if (!mountedRef.current) return;
        if (info.country !== readStoredSettings().country) return;
        if (info.source === 'network') setCalendarTick((value) => value + 1);
        setCalendarInfo(info);
        setCalendarLoading(false);
      }, []);

      useEffect(() => {
        refreshCalendar(false);
      }, [refreshCalendar]);

      useEffect(() => {
        const onChange = () => {
          const next = readStoredSettings().country;
          const cached = readStoredCalendar(next);
          installHolidays(next, cached ? cached.years : null);
          setCalendarTick((value) => value + 1);
          setCalendarInfo(cached
            ? { country: next, source: 'cache', updatedAt: cached.fetchedAt, years: Object.keys(cached.years).length, failed: false }
            : { country: next, source: 'embedded', updatedAt: 0, years: 0, failed: false });
          refreshCalendar(false);
        };
        window.addEventListener(SETTINGS_EVENT, onChange);
        return () => window.removeEventListener(SETTINGS_EVENT, onChange);
      }, [refreshCalendar]);

      const rows = useMemo(() => {
        void overlayTick;
        const snapshot = sessionSnapshot || {};
        const byId = snapshot.byId || {};
        const ids = Array.isArray(snapshot.ids) ? snapshot.ids : [];
        const overlay = overlayRef.current;
        const built = [];
        for (const id of ids) {
          const entry = byId[id];
          if (!entry) continue;
          const fallback = overlay.get(id);
          const pinned = pinnedOrder.has(id);
          const overlayValues = fallback || null;
          const cache = rowCacheRef.current;
          const cached = cache.get(entry);
          if (cached && cached.values === overlayValues
            && cached.pinned === pinned && cached.boundT === boundT) {
            built.push(cached.row);
            continue;
          }
          const row = buildRow(entry, boundT, overlayValues, pinned);
          cache.set(entry, { values: overlayValues, pinned, boundT, row });
          built.push(row);
        }
        built.sort((left, right) => {
          if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
          if (left.pinned) {
            const leftIndex = pinnedOrder.get(left.sessionId);
            const rightIndex = pinnedOrder.get(right.sessionId);
            if (leftIndex !== rightIndex) return (leftIndex ?? 0) - (rightIndex ?? 0);
          }
          return right.updatedAt - left.updatedAt;
        });
        return built;
      }, [sessionSnapshot, overlayTick, boundT, pinnedOrder]);

      const teamInfo = useMemo(() => {
        const teams = [];
        const memberOf = new Map();
        for (const row of rows) {
          if (!row.team) continue;
          teams.push({
            id: row.team.id,
            title: row.title,
            size: row.team.size,
            updatedAt: row.updatedAt,
            memberIds: row.team.members.map((member) => member.id),
          });
          for (const member of row.team.members) memberOf.set(member.id, row.team.id);
        }
        const teamIds = new Set(teams.map((team) => team.id));
        for (const row of rows) {
          if (memberOf.has(row.sessionId)) continue;
          if (row.parentId && teamIds.has(row.parentId)) memberOf.set(row.sessionId, row.parentId);
        }
        teams.sort((left, right) => right.updatedAt - left.updatedAt);
        return { teams, memberOf };
      }, [rows]);

      const scopedRows = useMemo(() => {
        if (scope === 'all') return rows;
        return rows.filter((row) => teamInfo.memberOf.get(row.sessionId) === scope);
      }, [rows, scope, teamInfo]);

      // Search applies to every tab, including the overview (which then aggregates only
      // the matching sessions). An empty query keeps the whole scoped catalog.
      const searchedRows = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return scopedRows;
        return scopedRows.filter((row) => (
          [row.title, row.request, row.reply, row.currentWork, row.cwd, baseName(row.cwd)]
            .join('\n')
            .toLowerCase()
            .includes(needle)
        ));
      }, [scopedRows, query]);

      useEffect(() => {
        if (scope === 'all') return;
        if (teamInfo.teams.some((team) => team.id === scope)) return;
        const phase = sessionSnapshot && sessionSnapshot.phase;
        if (teamInfo.teams.length === 0 && phase !== 'ready') return;
        setScope('all');
        persistScope('all');
      }, [scope, teamInfo, sessionSnapshot]);

      const runPump = useCallback(async () => {
        const pump = pumpRef.current;
        if (pump.running) return;
        pump.running = true;
        try {
          while (pump.queue.length && mountedRef.current) {
            const sessionId = pump.queue.shift();
            let values = null;
            try {
              const result = await ctx.remote.session.projections({ sessionId });
              if (result && result.ok === true && result.value
                && result.value.values && typeof result.value.values === 'object') {
                values = result.value.values;
              }
            } catch (error) {
              values = null;
            }
            if (!mountedRef.current) return;
            if (values) {
              overlayRef.current.set(sessionId, values);
              setOverlayTick((value) => value + 1);
            } else {
              pump.seen.delete(sessionId);
            }
          }
        } finally {
          pump.running = false;
        }
      }, [ctx]);

      const enqueueMissing = useCallback(() => {
        const pump = pumpRef.current;
        const snapshot = sessions.list.getSnapshot() || {};
        const ids = Array.isArray(snapshot.ids) ? snapshot.ids : [];
        const byId = snapshot.byId || {};
        const active = new Set(ids);
        for (const id of [...overlayRef.current.keys()]) {
          if (!active.has(id)) overlayRef.current.delete(id);
        }
        for (const id of [...pump.seen]) {
          if (!active.has(id)) pump.seen.delete(id);
        }
        const missing = [];
        for (const id of ids) {
          const entry = byId[id];
          if (!entry) continue;
          if (projectionOf(entry) != null) continue;
          if (overlayRef.current.has(id)) continue;
          if (pump.seen.has(id)) continue;
          missing.push(id);
        }
        if (!missing.length) return;
        missing.sort((left, right) => (byId[right].updatedAt || 0) - (byId[left].updatedAt || 0));
        const remaining = DETAIL_BUDGET - overlayRef.current.size - pump.queue.length;
        if (remaining <= 0) return;
        for (const id of missing.slice(0, remaining)) {
          pump.seen.add(id);
          pump.queue.push(id);
        }
        void runPump();
      }, [sessions, runPump]);

      const refreshAll = useCallback(() => {
        setRefreshing(true);
        pumpRef.current.seen.clear();
        overlayRef.current.clear();
        setOverlayTick((value) => value + 1);
        enqueueMissing();
        setTimeout(() => {
          if (mountedRef.current) setRefreshing(false);
        }, 600);
      }, [enqueueMissing]);

      useEffect(() => {
        mountedRef.current = true;
        enqueueMissing();
        let timer = null;
        const offStore = sessions.list.subscribe(() => {
          if (timer != null) clearTimeout(timer);
          timer = setTimeout(() => {
            timer = null;
            enqueueMissing();
          }, 300);
        });
        const offReset = ctx.on('connection/reset', () => {
          pumpRef.current.seen.clear();
          enqueueMissing();
        });
        return () => {
          mountedRef.current = false;
          if (timer != null) clearTimeout(timer);
          if (typeof offStore === 'function') offStore();
          if (typeof offReset === 'function') offReset();
        };
      }, [ctx, sessions, enqueueMissing]);

      const runningCount = scopedRows.filter((row) => row.running).length;
      const filtered = useMemo(() => (
        searchedRows.filter((row) => {
          if (filter === 'running' && !row.running) return false;
          if (filter === 'todos' && !(row.total > 0 && row.completed < row.total)) return false;
          if (filter === 'done' && !(row.total > 0 && row.completed >= row.total)) return false;
          return true;
        })
      ), [searchedRows, filter]);

      const tabs = [
        { value: 'overview', label: boundT('tab.overview') },
        { value: 'all', label: boundT('filter.all') },
        { value: 'running', label: boundT('filter.running') },
        { value: 'todos', label: boundT('filter.todos') },
        { value: 'done', label: boundT('filter.done') },
      ].map((tab) => ({
        ...tab,
        id: `session-kanban-tab-${tab.value}`,
        panelId: `session-kanban-panel-${tab.value}`,
      }));

      const heatPeriod = useMemo(() => {
        if (heatScale === 'year') {
          const start = new Date(heatYear, 0, 1).getTime();
          const days = daysInYear(heatYear);
          return { kind: 'year', cells: buildCalendarCells(searchedRows, start, days), start, days };
        }
        if (heatScale === 'month') {
          const anchor = new Date(heatMonthStart);
          const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1).getTime();
          const days = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
          return { kind: 'month', cells: buildCalendarCells(searchedRows, start, days), start, days };
        }
        if (heatScale === 'week') {
          const start = mondayStart(heatWeekStart);
          return { kind: 'week', cells: buildCalendarCells(searchedRows, start, 7), start, days: 7 };
        }
        return { kind: 'day', hourly: buildHourlyCells(searchedRows, heatDay), start: startOfDay(heatDay).getTime(), days: 1 };
      }, [searchedRows, heatScale, heatYear, heatMonthStart, heatWeekStart, heatDay, calendarTick]);

      const overview = useMemo(() => {
        let todoTotal = 0;
        let todoDone = 0;
        let detailCount = 0;
        for (const row of searchedRows) {
          if (!row.hasDetails) continue;
          detailCount += 1;
          todoTotal += row.total;
          todoDone += row.completed;
        }
        const todayKey = dayKeyOf(Date.now());
        let activeToday = 0;
        for (const row of searchedRows) {
          if (row.updatedAt && dayKeyOf(row.updatedAt) === todayKey) activeToday += 1;
        }
        return { todoTotal, todoDone, detailCount, activeToday };
      }, [searchedRows]);

      const yearOptions = useMemo(() => {
        void calendarTick;
        const current = new Date().getFullYear();
        const years = new Set();
        for (let year = current; year >= current - 4; year -= 1) years.add(year);
        for (const year of holidayIndex.years) years.add(year);
        for (const year of HOLIDAY_YEARS) years.add(year);
        for (const row of scopedRows) {
          if (!row.updatedAt) continue;
          const year = new Date(row.updatedAt).getFullYear();
          if (year >= 2000 && year <= current + 1) years.add(year);
        }
        return Array.from(years).sort((left, right) => right - left);
      }, [scopedRows, calendarTick]);

      const monthOptions = useMemo(() => {
        const now = new Date();
        const options = [];
        for (let back = 0; back < 36; back += 1) {
          const date = new Date(now.getFullYear(), now.getMonth() - back, 1);
          options.push({ value: date.getTime(), year: date.getFullYear(), month: date.getMonth() });
        }
        return options;
      }, []);

      const weekOptions = useMemo(() => {
        const options = [];
        let start = mondayStart(Date.now());
        for (let back = 0; back < 52; back += 1) {
          options.push({ value: start, start });
          start = addDays(start, -7).getTime();
        }
        return options;
      }, []);

      /** Overview tab: aggregate cards plus a Year/Month/Week/Day activity heatmap. */
      const renderOverview = () => {
        const stats = [
          {
            id: 'sessions',
            label: boundT('overview.sessions'),
            value: String(searchedRows.length),
            sub: boundT('overview.sessionsSub'),
          },
          {
            id: 'running',
            label: boundT('overview.running'),
            value: String(runningCount),
            sub: boundT('overview.runningSub'),
          },
          {
            id: 'today',
            label: boundT('overview.today'),
            value: String(overview.activeToday),
            sub: boundT('overview.todaySub'),
          },
          {
            id: 'todos',
            label: boundT('overview.todos'),
            value: overview.todoTotal ? `${overview.todoDone}/${overview.todoTotal}` : '—',
            sub: boundT('overview.todosSub'),
          },
        ];

        const scaleTabs = [
          { id: 'year', label: boundT('heat.scale.year') },
          { id: 'month', label: boundT('heat.scale.month') },
          { id: 'week', label: boundT('heat.scale.week') },
          { id: 'day', label: boundT('heat.scale.day') },
        ];

        const highlightClass = (kind) => {
          if (kind === 'work' && highlight.workday) return ' is-workday';
          if (kind === 'off' && highlight.offday) return ' is-offday';
          return '';
        };
        const dayTitle = (cell) => `${fill(boundT('heat.dayCount'), { date: cell.key, count: cell.count })} · ${boundT(cell.kind === 'work' ? 'heat.kind.work' : 'heat.kind.off')}`;
        const countryLabel = countryName(calendarInfo.country || readStoredSettings().country);
        const calendarStatus = calendarLoading
          ? boundT('heat.calendar.loading')
          : calendarInfo.source === 'network'
            ? fill(boundT('heat.calendar.network'), {
              country: countryLabel,
              years: calendarInfo.years || 0,
              time: shortDate(calendarInfo.updatedAt),
            })
            : calendarInfo.source === 'cache'
              ? fill(boundT('heat.calendar.cache'), { country: countryLabel, time: shortDate(calendarInfo.updatedAt) })
              : fill(boundT(calendarInfo.failed ? 'heat.calendar.error' : 'heat.calendar.embedded'), { country: countryLabel });

        let periodControl;
        if (heatScale === 'year') {
          periodControl = h(KanbanSelect, {
            key: 'period',
            className: 'skb-select--block',
            value: String(heatYear),
            ariaLabel: boundT('heat.yearLabel'),
            align: 'end',
            options: yearOptions.map((year) => ({
              id: String(year),
              label: fill(boundT('heat.meta.year'), { year }),
            })),
            onSelect: (id) => setHeatYear(Number(id)),
          });
        } else if (heatScale === 'month') {
          const anchor = new Date(heatMonthStart);
          const value = String(new Date(anchor.getFullYear(), anchor.getMonth(), 1).getTime());
          periodControl = h(KanbanSelect, {
            key: 'period',
            className: 'skb-select--block',
            value,
            ariaLabel: boundT('heat.monthLabel'),
            align: 'end',
            options: monthOptions.map((option) => ({
              id: String(option.value),
              label: fill(boundT('heat.meta.month'), { year: option.year, month: option.month + 1 }),
            })),
            onSelect: (id) => setHeatMonthStart(Number(id)),
          });
        } else if (heatScale === 'week') {
          const value = String(mondayStart(heatWeekStart));
          periodControl = h(KanbanSelect, {
            key: 'period',
            className: 'skb-select--block',
            value,
            ariaLabel: boundT('heat.weekLabel'),
            align: 'end',
            options: weekOptions.map((option) => ({
              id: String(option.value),
              label: fill(boundT('heat.meta.week'), {
                start: shortDate(option.start),
                end: shortDate(addDays(option.start, 6).getTime()),
              }),
            })),
            onSelect: (id) => setHeatWeekStart(Number(id)),
          });
        } else {
          periodControl = h('input', {
            key: 'period',
            type: 'date',
            className: 'skb-date-input',
            value: dayKeyOf(heatDay),
            'aria-label': boundT('heat.dayLabel'),
            onChange: (event) => {
              const text = event.target.value;
              if (!text) return;
              const parsed = new Date(`${text}T00:00:00`);
              if (Number.isNaN(parsed.getTime())) return;
              setHeatDay(startOfDay(parsed.getTime()).getTime());
            },
          });
        }

        const periodLabel = heatScale === 'year'
          ? boundT('heat.yearLabel')
          : heatScale === 'month'
            ? boundT('heat.monthLabel')
            : heatScale === 'week' ? boundT('heat.weekLabel') : boundT('heat.dayLabel');

        let heatmap;
        let metaText;
        if (heatPeriod.kind === 'year' || heatPeriod.kind === 'month') {
          const max = Math.max(...heatPeriod.cells.map((cell) => cell.count), 0);
          const offset = (new Date(heatPeriod.cells[0].time).getDay() + 6) % 7;
          const gridCells = [];
          for (let index = 0; index < offset; index += 1) {
            gridCells.push(h('div', { key: `pad-${index}`, className: 'skb-heat-cell is-pad', 'aria-hidden': true }));
          }
          for (const cell of heatPeriod.cells) {
            gridCells.push(h('div', {
              key: cell.key,
              className: `skb-heat-cell lvl-${heatLevelOf(cell.count, max)}${highlightClass(cell.kind)}`,
              title: dayTitle(cell),
            }));
          }
          const grid = h('div', {
            key: 'grid',
            className: `skb-heat-grid${heatPeriod.kind === 'month' ? ' is-month' : ''}`,
          }, gridCells);
          const weekdayColumn = h('div', { key: 'days', className: 'skb-heat-days' }, [
            h('div', { key: 0, className: 'skb-heat-day' }, boundT('heat.weekday.mon')),
            h('div', { key: 1, className: 'skb-heat-day' }, ''),
            h('div', { key: 2, className: 'skb-heat-day' }, boundT('heat.weekday.wed')),
            h('div', { key: 3, className: 'skb-heat-day' }, ''),
            h('div', { key: 4, className: 'skb-heat-day' }, boundT('heat.weekday.fri')),
            h('div', { key: 5, className: 'skb-heat-day' }, ''),
            h('div', { key: 6, className: 'skb-heat-day' }, ''),
          ]);
          if (heatPeriod.kind === 'year') {
            heatmap = h('div', { key: 'heat', className: 'skb-heat-body' }, [
              weekdayColumn,
              h('div', { key: 'scroll', className: 'skb-heat-scroll' }, [
                h('div', { key: 'months', className: 'skb-heat-months' }, monthLabelsFor(heatPeriod.cells, offset).map((label) => h('span', {
                  key: label.month,
                  className: 'skb-heat-month',
                  style: { left: `${label.column * 16}px` },
                }, `${label.month + 1}`))),
                grid,
              ]),
            ]);
            metaText = fill(boundT('heat.meta.year'), { year: heatYear });
          } else {
            heatmap = h('div', { key: 'heat', className: 'skb-heat-body is-month' }, [
              weekdayColumn,
              h('div', { key: 'scroll', className: 'skb-heat-scroll' }, grid),
            ]);
            const anchor = new Date(heatMonthStart);
            metaText = fill(boundT('heat.meta.month'), {
              year: anchor.getFullYear(),
              month: anchor.getMonth() + 1,
            });
          }
        } else if (heatPeriod.kind === 'week') {
          const max = Math.max(...heatPeriod.cells.map((cell) => cell.count), 0);
          heatmap = h('div', { key: 'week', className: 'skb-heat-week' }, heatPeriod.cells.map((cell) => h('div', {
            key: cell.key,
            className: 'skb-heat-week-cell',
          }, [
            h('div', {
              key: 'cell',
              className: `skb-heat-cell lvl-${heatLevelOf(cell.count, max)}${highlightClass(cell.kind)}`,
              title: dayTitle(cell),
            }),
            h('div', { key: 'label', className: 'skb-heat-daylabel' }, shortDate(cell.time)),
          ])));
          metaText = fill(boundT('heat.meta.week'), {
            start: shortDate(heatPeriod.start),
            end: shortDate(addDays(heatPeriod.start, 6).getTime()),
          });
        } else {
          const hourMax = Math.max(...heatPeriod.hourly.cells.map((cell) => cell.count), 0);
          heatmap = h('div', { key: 'day', className: 'skb-heat-hours-wrap' }, [
            h('div', { key: 'cells', className: 'skb-heat-hours' }, heatPeriod.hourly.cells.map((cell) => h('div', {
              key: cell.hour,
              className: `skb-heat-cell lvl-${heatLevelOf(cell.count, hourMax)}`,
              title: fill(boundT('heat.hourCount'), { hour: cell.hour, count: cell.count }),
            }))),
            h('div', { key: 'labels', className: 'skb-heat-hour-labels' }, heatPeriod.hourly.cells.map((cell) => h('div', {
              key: cell.hour,
            }, cell.hour % 6 === 0 ? String(cell.hour) : ''))),
          ]);
          metaText = `${dayKeyOf(heatPeriod.start)} · ${fill(boundT('heat.dayTotal'), { count: heatPeriod.hourly.total })}`;
        }

        return h('div', { key: 'overview', className: 'skb-overview' }, [
          h('div', { key: 'stats', className: 'skb-stats' }, stats.map((stat) => h('div', {
            key: stat.id,
            className: 'skb-stat',
          }, [
            h('div', { key: 'label', className: 'skb-stat-label' }, stat.label),
            h('div', { key: 'value', className: 'skb-stat-value' }, stat.value),
            h('div', { key: 'sub', className: 'skb-stat-sub' }, stat.sub),
          ]))),
          h('section', { key: 'heat', className: 'skb-panel' }, [
            h('div', { key: 'head', className: 'skb-panel-head' }, [
              h('div', { key: 'title', className: 'skb-panel-title' }, [
                h('strong', { key: 'name' }, boundT('overview.heatTitle')),
                h('span', { key: 'hint' }, boundT('overview.heatHint')),
              ]),
            ]),
            h('div', { key: 'layout', className: 'skb-heat-layout' }, [
              h('aside', { key: 'side', className: 'skb-heat-side' }, [
                h(SegmentedControl, {
                  key: 'scale',
                  id: 'session-kanban-heat-scale',
                  className: 'skb-scale',
                  label: boundT('heat.scaleLabel'),
                  value: heatScale,
                  options: scaleTabs.map((scale) => ({ value: scale.id, label: scale.label })),
                  onChange: (next) => {
                    setHeatScale(next);
                    persistHeatScale(next);
                  },
                }),
                h('div', { key: 'period', className: 'skb-heat-field' }, [
                  h('span', { key: 'label', className: 'skb-heat-field-label' }, periodLabel),
                  periodControl,
                ]),
                h(Checkbox, {
                  key: 'workday',
                  className: 'skb-check',
                  label: boundT('heat.highlightWorkday'),
                  checked: highlight.workday,
                  onChange: (checked) => {
                    const next = { ...highlight, workday: checked };
                    setHighlight(next);
                    persistHighlight(next);
                  },
                }),
                h(Checkbox, {
                  key: 'offday',
                  className: 'skb-check',
                  label: boundT('heat.highlightOffday'),
                  checked: highlight.offday,
                  onChange: (checked) => {
                    const next = { ...highlight, offday: checked };
                    setHighlight(next);
                    persistHighlight(next);
                  },
                }),
                h('p', { key: 'note', className: 'skb-heat-note' }, boundT('heat.holidayNote')),
                h('div', { key: 'calendar', className: 'skb-heat-calendar' }, [
                  h('span', { key: 'text', className: 'skb-heat-note' }, calendarStatus),
                  h('button', {
                    key: 'refresh',
                    type: 'button',
                    className: 'skb-link-btn',
                    disabled: calendarLoading,
                    onClick: () => refreshCalendar(true),
                  }, calendarLoading ? boundT('heat.calendar.refreshing') : boundT('heat.calendar.refresh')),
                ]),
              ]),
              h('div', { key: 'main', className: 'skb-heat-main' }, [
                heatmap,
                h('div', { key: 'legend', className: 'skb-heat-legend' }, [
                  h('div', { key: 'base', className: 'skb-heat-legend-row' }, [
                    h('span', { key: 'label', className: 'skb-heat-legend-label' }, boundT('heat.legend.default')),
                    h('span', { key: 'less' }, boundT('heat.less')),
                    [0, 1, 2, 3, 4].map((level) => h('span', { key: `s${level}`, className: `skb-heat-swatch lvl-${level}` })),
                    h('span', { key: 'more' }, boundT('heat.more')),
                  ]),
                  highlight.workday
                    ? h('div', { key: 'workday', className: 'skb-heat-legend-row' }, [
                      h('span', { key: 'label', className: 'skb-heat-legend-label' }, boundT('heat.legend.workday')),
                      h('span', { key: 'less' }, boundT('heat.less')),
                      [0, 1, 2, 3, 4].map((level) => h('span', { key: `s${level}`, className: `skb-heat-swatch is-workday lvl-${level}` })),
                      h('span', { key: 'more' }, boundT('heat.more')),
                    ])
                    : null,
                  highlight.offday
                    ? h('div', { key: 'offday', className: 'skb-heat-legend-row' }, [
                      h('span', { key: 'label', className: 'skb-heat-legend-label' }, boundT('heat.legend.offday')),
                      h('span', { key: 'less' }, boundT('heat.less')),
                      [0, 1, 2, 3, 4].map((level) => h('span', { key: `s${level}`, className: `skb-heat-swatch is-offday lvl-${level}` })),
                      h('span', { key: 'more' }, boundT('heat.more')),
                    ])
                    : null,
                ]),
                h('div', { key: 'meta', className: 'skb-heat-meta' }, metaText),
              ]),
            ]),
          ]),
        ]);
      };
      const visibleRows = filtered.slice(0, visibleLimit);
      const hasMoreRows = filtered.length > visibleRows.length;

      // Masonry: measure the available width, then distribute cards onto the
      // currently shortest column. Earlier assignments never change when the next
      // page is appended, so already-rendered cards keep their place.
      useEffect(() => {
        if (!gridNode) return undefined;
        const measure = () => {
          const width = gridNode.clientWidth || 0;
          if (!width) return;
          const next = Math.max(1, Math.floor((width + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP)));
          setColumnCount((current) => (current === next ? current : next));
        };
        measure();
        if (typeof ResizeObserver === 'function') {
          const observer = new ResizeObserver(measure);
          observer.observe(gridNode);
          return () => observer.disconnect();
        }
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
      }, [gridNode]);

      const columns = useMemo(() => {
        const count = Math.max(1, columnCount);
        const buckets = [];
        for (let index = 0; index < count; index += 1) buckets.push({ rows: [], height: 0 });
        for (const row of visibleRows) {
          let target = 0;
          for (let index = 1; index < buckets.length; index += 1) {
            if (buckets[index].height < buckets[target].height) target = index;
          }
          buckets[target].rows.push(row);
          buckets[target].height += estimateCardHeight(row) + GRID_GAP;
        }
        return buckets.map((bucket) => bucket.rows);
      }, [visibleRows, columnCount]);

      useEffect(() => {
        if (!hasMoreRows) return undefined;
        const page = pageRef.current;
        const grow = () => {
          if (page) {
            if (page.scrollTop + page.clientHeight >= page.scrollHeight - 480) {
              setVisibleLimit((value) => value + PAGE_SIZE);
            }
            return;
          }
          if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 480) {
            setVisibleLimit((value) => value + PAGE_SIZE);
          }
        };
        grow();
        const targets = [page, window].filter(Boolean);
        for (const target of targets) target.addEventListener('scroll', grow, { passive: true });
        window.addEventListener('resize', grow);
        return () => {
          for (const target of targets) target.removeEventListener('scroll', grow);
          window.removeEventListener('resize', grow);
        };
      }, [hasMoreRows, filtered.length, visibleLimit]);

      const openSession = useCallback((sessionId) => {
        try {
          ctx.uiWorkspace.openSession(sessionId);
        } catch (error) {
          /* the host navigation reports its own failures */
        }
      }, [ctx]);

      const startSession = useCallback(() => {
        try {
          ctx.uiWorkspace.startSession();
        } catch (error) {
          /* the host composer reports its own failures */
        }
      }, [ctx]);

      const archiveSession = useCallback(async (sessionId) => {
        setBusyId(sessionId);
        setErrorText(null);
        try {
          await ctx.workspaces.archiveSession(sessionId);
          setArchiveTarget(null);
        } catch (error) {
          setArchiveTarget(null);
          const message = error && error.message ? String(error.message) : String(error);
          setErrorText(fill(boundT('archive.failed'), { message }));
        } finally {
          setBusyId(null);
        }
      }, [ctx, boundT]);

      const beginRename = useCallback((row) => {
        editingRef.current = row.sessionId;
        setEditingId(row.sessionId);
        setDraftTitle(row.title || '');
        setErrorText(null);
      }, []);

      const endRename = useCallback(() => {
        editingRef.current = null;
        setEditingId(null);
      }, []);

      const submitRename = useCallback(async (row) => {
        if (editingRef.current !== row.sessionId) return;
        if (renameBusyRef.current) return;
        const next = String(draftTitle || '').trim();
        if (!next) {
          setErrorText(boundT('rename.empty'));
          return;
        }
        if (next === (row.title || '')) {
          endRename();
          return;
        }
        renameBusyRef.current = true;
        setBusyId(row.sessionId);
        setErrorText(null);
        try {
          const result = await ctx.remote.session.rename({ sessionId: row.sessionId, title: next });
          if (result && result.ok === false) throw new Error(remoteErrorText(result));
          endRename();
        } catch (error) {
          const message = error && error.message ? String(error.message) : String(error);
          setErrorText(fill(boundT('rename.failed'), { message }));
        } finally {
          renameBusyRef.current = false;
          setBusyId(null);
        }
      }, [ctx, draftTitle, boundT, endRename]);

      const togglePin = useCallback(async (row) => {
        setBusyId(row.sessionId);
        setErrorText(null);
        try {
          const service = ctx.workspaces;
          const useService = service
            && typeof service.pinSession === 'function'
            && typeof service.unpinSession === 'function';
          if (useService) {
            if (row.pinned) await service.unpinSession(row.sessionId);
            else await service.pinSession(row.sessionId);
          } else {
            const result = row.pinned
              ? await ctx.remote.workspace.unpinSession({ sessionId: row.sessionId })
              : await ctx.remote.workspace.pinSession({ sessionId: row.sessionId });
            if (!result || result.ok !== true) throw new Error(remoteErrorText(result));
          }
        } catch (error) {
          const message = error && error.message ? String(error.message) : String(error);
          setErrorText(fill(boundT('pin.failed'), { message }));
        } finally {
          setBusyId(null);
        }
      }, [ctx, boundT]);

      const showNotice = useCallback((text) => {
        setNotice(text);
        if (noticeTimerRef.current != null) clearTimeout(noticeTimerRef.current);
        noticeTimerRef.current = setTimeout(() => {
          noticeTimerRef.current = null;
          if (mountedRef.current) setNotice(null);
        }, 1800);
      }, []);

      useEffect(() => () => {
        if (noticeTimerRef.current != null) clearTimeout(noticeTimerRef.current);
      }, []);

      const forkSession = useCallback(async (row) => {
        setBusyId(row.sessionId);
        setErrorText(null);
        try {
          let childId = null;
          if (ctx.uiWorkspace && typeof ctx.uiWorkspace.forkSession === 'function') {
            await ctx.uiWorkspace.forkSession(row.sessionId, (createdId) => { childId = createdId; });
          } else {
            childId = await ctx.sessions.fork({ sessionId: row.sessionId, increaseTitle: true });
          }
          if (childId) ctx.uiWorkspace.openSession(childId);
        } catch (error) {
          const message = error && error.message ? String(error.message) : String(error);
          setErrorText(fill(boundT('fork.failed'), { message }));
        } finally {
          setBusyId(null);
        }
      }, [ctx, boundT]);

      const copySessionId = useCallback(async (row) => {
        try {
          const text = String(row.sessionId);
          let copied = false;
          if (typeof navigator !== 'undefined' && navigator.clipboard
            && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(text);
            copied = true;
          } else if (typeof document !== 'undefined' && typeof document.execCommand === 'function') {
            const area = document.createElement('textarea');
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.position = 'fixed';
            area.style.top = '-1000px';
            area.style.opacity = '0';
            document.body.appendChild(area);
            area.select();
            copied = document.execCommand('copy');
            document.body.removeChild(area);
          }
          if (!copied) throw new Error('clipboard unavailable');
          showNotice(boundT('copy.done'));
        } catch (error) {
          const message = error && error.message ? String(error.message) : String(error);
          setErrorText(fill(boundT('copy.failed'), { message }));
        }
      }, [boundT, showNotice]);

      const onCardKeyDown = useCallback((event, sessionId) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openSession(sessionId);
        }
      }, [openSession]);

      const todoStatusRank = (todo) => {
        if (!todo) return 2;
        if (todo.status === 'in_progress') return 0;
        if (todo.status === 'pending') return 1;
        return 2;
      };

      const renderTodo = (todo, index) => {
        const status = todo && todo.status === 'completed'
          ? 'completed'
          : todo && todo.status === 'in_progress' ? 'in_progress' : 'pending';
        const glyph = status === 'completed' ? '✓' : status === 'in_progress' ? '◐' : '○';
        return h('li', { key: `todo-${index}`, className: `skb-todo is-${status}` }, [
          h('span', { key: 'g', className: 'skb-todo-glyph' }, glyph),
          h('span', {
            key: 't',
            className: 'skb-todo-text',
            title: todo && todo.content ? String(todo.content) : '',
          }, todo && todo.content ? String(todo.content) : ''),
        ]);
      };

      const renderCard = (row) => {
        const orderedTodos = row.todos
          .map((todo, index) => ({ todo, index }))
          .sort((left, right) => (
            todoStatusRank(left.todo) - todoStatusRank(right.todo) || left.index - right.index
          ))
          .map((entry) => entry.todo);
        const allDone = row.total > 0 && row.completed >= row.total;
        const visibleTodos = allDone ? [] : orderedTodos.slice(0, TODOS_SHOWN);
        const hiddenTodos = Math.max(0, row.total - visibleTodos.length);
        const visibleSet = new Set(visibleTodos);
        const hiddenItems = allDone ? [] : row.todos.filter((todo) => !visibleSet.has(todo));
        const hiddenAllDone = hiddenItems.length > 0
          && hiddenItems.length === hiddenTodos
          && hiddenItems.every((todo) => todo && todo.status === 'completed');
        const isBusy = busyId === row.sessionId;
        const confirming = archiveTarget === row.sessionId;
        const timeText = relativeTime(row.updatedAt, boundT);
        return h('article', {
          key: row.sessionId,
          className: `skb-card${row.running ? ' is-running' : ''}`,
          role: 'button',
          tabIndex: 0,
          'aria-label': row.title || boundT('meta.untitled'),
          onClick: () => openSession(row.sessionId),
          onKeyDown: (event) => onCardKeyDown(event, row.sessionId),
        }, [
          h('div', { key: 'top', className: 'skb-card-top' }, [
            h('div', { key: 'left', className: 'skb-card-top-left' }, [
              row.pinned
                ? h('span', { key: 'pin', className: 'skb-pin', title: boundT('meta.pinned') },
                  h(IconPin, { filled: true }))
                : null,
              h('span', {
                key: 'status',
                className: `skb-status${row.running ? ' is-running' : ''}`,
              }, [
                h('span', { key: 'dot', className: 'skb-dot' }),
                row.running ? boundT('status.running') : boundT('status.idle'),
              ]),
            ]),
            h('span', { key: 'time', className: 'skb-time' },
              timeText ? boundT('meta.updated', { time: timeText }) : ''),
          ]),
          editingId === row.sessionId
            ? h('input', {
              key: 'title-input',
              className: 'skb-title-input',
              value: draftTitle,
              maxLength: 60,
              autoFocus: true,
              'aria-label': boundT('rename.label'),
              onClick: (event) => event.stopPropagation(),
              onKeyDown: (event) => {
                event.stopPropagation();
                if (event.key === 'Enter') {
                  event.preventDefault();
                  submitRename(row);
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  endRename();
                }
              },
              onBlur: () => submitRename(row),
              onChange: (event) => setDraftTitle(event.target.value),
            })
            : h('h2', {
              key: 'title',
              className: 'skb-card-title',
              title: row.title || boundT('meta.untitled'),
            }, row.title || boundT('meta.untitled')),
          row.running && row.statsText
            ? h('div', { key: 'turn', className: 'skb-turn' }, row.statsText)
            : null,
          h('section', { key: 'work', className: 'skb-work' }, [
            h('div', { key: 'label', className: 'skb-label' },
              row.running ? boundT('work.current') : boundT('work.result')),
            h('p', { key: 'text', className: 'skb-work-text' }, row.currentWork || boundT('work.none')),
            !row.running && row.request && row.request !== row.currentWork
              ? h('p', { key: 'sub', className: 'skb-work-sub' },
                `${boundT('work.recent')}: ${row.request}`)
              : null,
          ]),
          h('section', { key: 'todos', className: 'skb-todos' }, [
            h('div', { key: 'head', className: 'skb-todo-head' }, [
              h('span', { key: 'label', className: 'skb-label' }, boundT('todo.title')),
              row.total > 0
                ? h('span', { key: 'count', className: 'skb-todo-count' },
                  boundT('todo.done', { done: row.completed, total: row.total }))
                : null,
            ]),
            row.total > 0
              ? h('div', {
                key: 'bar',
                className: 'skb-bar',
                role: 'progressbar',
                'aria-valuemin': 0,
                'aria-valuemax': row.total,
                'aria-valuenow': row.completed,
              }, [h('div', { key: 'fill', className: 'skb-bar-fill', style: { width: `${row.progressPct}%` } })])
              : null,
            row.total > 0
              ? (allDone
                ? h('p', { key: 'alldone', className: 'skb-todo-alldone' },
                  `✓ ${boundT('todo.allDone', { total: row.total })}`)
                : h('ul', { key: 'list', className: 'skb-todo-list' }, visibleTodos.map(renderTodo)))
              : h('p', { key: 'empty', className: 'skb-todo-empty' }, boundT('todo.none')),
            !allDone && hiddenTodos > 0
              ? h('div', { key: 'more', className: 'skb-todo-more' },
                boundT(hiddenAllDone ? 'todo.moreDone' : 'todo.moreHidden', { n: hiddenTodos }))
              : null,
          ]),
          h('footer', { key: 'foot', className: 'skb-card-foot' }, [
            h('span', { key: 'cwd', className: 'skb-cwd', title: row.cwd }, baseName(row.cwd)),
            h('div', { key: 'actions', className: 'skb-actions' }, confirming
              ? [
                h('span', { key: 'text', className: 'skb-confirm-text' }, boundT('action.archiveConfirm')),
                h('div', { key: 'confirm', className: 'skb-confirm' }, [
                  h('button', {
                    key: 'yes',
                    type: 'button',
                    className: 'skb-btn skb-btn-ghost',
                    disabled: isBusy,
                    onClick: (event) => {
                      event.stopPropagation();
                      archiveSession(row.sessionId);
                    },
                  }, isBusy ? '…' : boundT('action.archiveConfirm')),
                  h('button', {
                    key: 'no',
                    type: 'button',
                    className: 'skb-btn skb-btn-ghost',
                    disabled: isBusy,
                    onClick: (event) => {
                      event.stopPropagation();
                      setArchiveTarget(null);
                    },
                  }, boundT('action.archiveCancel')),
                ]),
              ]
              : [
                h('button', {
                  key: 'pin',
                  type: 'button',
                  className: `skb-icon-btn${row.pinned ? ' is-active' : ''}`,
                  title: row.pinned ? boundT('action.unpin') : boundT('action.pin'),
                  'aria-label': row.pinned ? boundT('action.unpin') : boundT('action.pin'),
                  disabled: isBusy,
                  onClick: (event) => {
                    event.stopPropagation();
                    togglePin(row);
                  },
                }, h(IconPin, { filled: row.pinned })),
                h('button', {
                  key: 'rename',
                  type: 'button',
                  className: 'skb-icon-btn',
                  title: boundT('action.rename'),
                  'aria-label': boundT('action.rename'),
                  disabled: isBusy,
                  onClick: (event) => {
                    event.stopPropagation();
                    beginRename(row);
                  },
                }, h(IconRename)),
                h('button', {
                  key: 'fork',
                  type: 'button',
                  className: 'skb-icon-btn',
                  title: boundT('action.fork'),
                  'aria-label': boundT('action.fork'),
                  disabled: isBusy,
                  onClick: (event) => {
                    event.stopPropagation();
                    forkSession(row);
                  },
                }, h(IconFork)),
                h('button', {
                  key: 'archive',
                  type: 'button',
                  className: 'skb-icon-btn is-danger',
                  title: boundT('action.archive'),
                  'aria-label': boundT('action.archive'),
                  disabled: isBusy,
                  onClick: (event) => {
                    event.stopPropagation();
                    setArchiveTarget(row.sessionId);
                  },
                }, h(IconArchive)),
                h('button', {
                  key: 'copy',
                  type: 'button',
                  className: 'skb-icon-btn',
                  title: boundT('action.copyId'),
                  'aria-label': boundT('action.copyId'),
                  disabled: isBusy,
                  onClick: (event) => {
                    event.stopPropagation();
                    copySessionId(row);
                  },
                }, h(IconCopy)),
              ]),
          ]),
        ]);
      };

      const phase = sessionSnapshot && sessionSnapshot.phase;
      const loading = scopedRows.length === 0 && phase !== 'ready' && phase !== 'error';
      const failed = scopedRows.length === 0 && phase === 'error';
      const partial = scopedRows.length > 0 && scopedRows.some((row) => !row.hasDetails);

      let body;
      if (loading) {
        body = h('div', { key: 'loading', className: 'skb-skeleton-grid' }, [
          h('div', { key: 'a', className: 'skb-skeleton' }),
          h('div', { key: 'b', className: 'skb-skeleton' }),
          h('div', { key: 'c', className: 'skb-skeleton' }),
        ]);
      } else if (failed) {
        body = h('div', { key: 'error', className: 'skb-state' }, [
          h('p', { key: 'title', className: 'skb-state-title' }, boundT('state.error')),
          h('p', { key: 'hint', className: 'skb-state-hint' }, boundT('state.errorHint')),
        ]);
      } else if (scopedRows.length === 0) {
        body = h('div', { key: 'empty', className: 'skb-state' }, [
          h(IconBoard, { key: 'icon' }),
          h('p', { key: 'title', className: 'skb-state-title' }, boundT('state.empty')),
          h('p', { key: 'hint', className: 'skb-state-hint' }, boundT('state.emptyHint')),
          h('button', {
            key: 'new',
            type: 'button',
            className: 'skb-btn skb-btn-primary',
            onClick: startSession,
          }, boundT('action.newSession')),
        ]);
      } else if (filter === 'overview') {
        body = query.trim() && searchedRows.length === 0
          ? h('div', { key: 'nomatch', className: 'skb-state' }, [
            h('p', { key: 'title', className: 'skb-state-title' }, boundT('state.noMatch')),
            h('p', { key: 'hint', className: 'skb-state-hint' }, boundT('state.noMatchHint')),
          ])
          : renderOverview();
      } else if (filtered.length === 0) {
        body = h('div', { key: 'nomatch', className: 'skb-state' }, [
          h('p', { key: 'title', className: 'skb-state-title' }, boundT('state.noMatch')),
          h('p', { key: 'hint', className: 'skb-state-hint' }, boundT('state.noMatchHint')),
        ]);
      } else {
        body = h('div', { key: 'grid-wrap', className: 'skb-grid-wrap' }, [
          h('div', { key: 'grid', className: 'skb-grid', ref: setGridNode }, columns.map((columnRows, index) => h('div', {
            key: `col-${index}`,
            className: 'skb-col',
          }, columnRows.map(renderCard)))),
          hasMoreRows
            ? h('div', { key: 'more', className: 'skb-more' }, [
              h('span', { key: 'text', className: 'skb-more-text' },
                boundT('list.loaded', { shown: visibleRows.length, total: filtered.length })),
              h('span', { key: 'hint', className: 'skb-more-hint' }, boundT('list.autoLoadHint')),
            ])
            : null,
        ]);
      }

      return h('div', { className: 'skb-page', 'data-plugin': PANEL_ID, ref: pageRef }, [
        h('div', { key: 'inner', className: 'skb-inner' }, [
          h('header', { key: 'head', className: 'skb-head' }, [
            h('div', { key: 'main', className: 'skb-head-main' }, [
              h('h1', { key: 'title', className: 'skb-title' }, boundT('panel.title')),
              h('p', { key: 'sub', className: 'skb-subtitle' },
                boundT('panel.subtitle', { total: scopedRows.length, running: runningCount })),
            ]),
            h('div', { key: 'actions', className: 'skb-head-actions' }, [
              h(Button, {
                key: 'refresh',
                variant: 'outline',
                size: 'sm',
                icon: h(IconRefresh, { key: 'icon' }),
                disabled: refreshing,
                title: boundT('action.refresh'),
                onClick: () => refreshAll(),
              }, boundT('action.refresh')),
              h(Button, {
                key: 'new',
                variant: 'primary',
                size: 'sm',
                icon: h(IconNewChat, { key: 'icon' }),
                title: boundT('action.newSession'),
                onClick: startSession,
              }, boundT('action.newSession')),
            ]),
          ]),
          h('div', { key: 'toolbar', className: 'skb-toolbar' }, [
            teamInfo.teams.length > 0
              ? h('div', { key: 'scope', className: 'skb-scope' }, [
                h('span', { key: 'label', className: 'skb-scope-label' }, boundT('scope.label')),
                h(KanbanSelect, {
                  key: 'select',
                  className: 'skb-select--scope',
                  value: scope,
                  ariaLabel: boundT('scope.label'),
                  options: [
                    { id: 'all', label: boundT('scope.all') },
                    ...teamInfo.teams.map((team) => ({
                      id: team.id,
                      label: fill(boundT('scope.teamOption'), {
                        title: team.title || boundT('meta.untitled'),
                        n: team.size,
                      }),
                    })),
                  ],
                  onSelect: (value) => {
                    setScope(value);
                    persistScope(value);
                    setVisibleLimit(PAGE_SIZE);
                  },
                }),
              ])
              : null,
            h(SegmentedTabs, {
              key: 'tabs',
              label: boundT('tabs.label'),
              value: filter,
              items: tabs,
              onChange: (next) => {
                setFilter(next);
                persistFilter(next);
                setVisibleLimit(PAGE_SIZE);
              },
            }),
            h(Input, {
              key: 'search',
              className: 'skb-search-field',
              type: 'search',
              icon: h(IconSearch, { key: 'icon' }),
              value: query,
              placeholder: boundT('search.placeholder'),
              'aria-label': boundT('search.placeholder'),
              onChange: (event) => {
                setQuery(event.target.value);
                setVisibleLimit(PAGE_SIZE);
              },
            }),
          ]),
          errorText
            ? h('div', { key: 'action-error', className: 'skb-error-box' }, [
              h('span', { key: 'text' }, errorText),
              h('button', {
                key: 'dismiss',
                type: 'button',
                className: 'skb-btn skb-btn-ghost',
                onClick: () => setErrorText(null),
              }, '×'),
            ])
            : null,
          notice
            ? h('div', { key: 'notice', className: 'skb-notice-box' }, [
              h('span', { key: 'text' }, notice),
            ])
            : null,
          partial && filter !== 'overview'
            ? h('p', { key: 'partial', className: 'skb-note' }, boundT('state.partial'))
            : null,
          body,
        ]),
      ]);
    }

    function SessionBoardIcon(props) {
      const size = Number(props && props.size) > 0 ? Number(props.size) : 18;
      return h('svg', {
        viewBox: '0 0 16 16',
        width: size,
        height: size,
        'aria-hidden': true,
        focusable: false,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style: { display: 'block' },
      }, [
        h('rect', { key: 'frame', x: 2.1, y: 2.6, width: 11.8, height: 10.8, rx: 2.2 }),
        h('rect', { key: 'a', x: 4.2, y: 4.8, width: 2.4, height: 3.2, rx: 0.8, fill: 'currentColor', stroke: 'none' }),
        h('rect', { key: 'b', x: 6.8, y: 4.8, width: 2.4, height: 5.6, rx: 0.8, fill: 'currentColor', stroke: 'none', opacity: 0.55 }),
        h('rect', { key: 'c', x: 9.4, y: 4.8, width: 2.4, height: 2.2, rx: 0.8, fill: 'currentColor', stroke: 'none' }),
      ]);
    }

    /** Theme-native dropdown: a trigger button plus the shell's own Menu surface. */
    function KanbanSelect(props) {
      const [open, setOpen] = useState(false);
      const options = Array.isArray(props.options) ? props.options : [];
      const active = options.find((option) => option.id === props.value) || options[0];
      const className = ['skb-select', props.className || ''].filter(Boolean).join(' ');
      const anchor = h('button', {
        type: 'button',
        className,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-label': props.ariaLabel || undefined,
        disabled: props.disabled === true,
        onClick: () => {
          if (props.disabled === true) return;
          setOpen((value) => !value);
        },
      }, [
        h('span', { key: 'label', className: 'skb-select-label' }, active ? active.label : ''),
        h(IconChevronDown, { key: 'chevron', className: 'skb-select-chevron', size: 16 }),
      ]);
      return h(Menu, {
        open,
        onClose: () => setOpen(false),
        items: options.map((option) => ({ id: option.id, label: option.label })),
        selectedId: props.value,
        onSelect: (id) => {
          setOpen(false);
          if (props.onSelect) props.onSelect(id);
        },
        align: props.align || 'start',
        portal: true,
        listClassName: 'skb-menu-list',
        anchor,
      });
    }

    /** One additive row inside Settings → General: the working-calendar country. */
    function CountrySettingRow(props) {
      const { ctx } = props;
      const t = ctx.locale.bind(NS);
      const [country, setCountry] = useState(() => readStoredSettings().country);
      const [localeTick, setLocaleTick] = useState(0);
      useEffect(() => {
        const off = ctx.locale.subscribe(() => setLocaleTick((value) => value + 1));
        return () => { if (typeof off === 'function') off(); };
      }, [ctx]);
      useEffect(() => {
        const sync = () => setCountry(readStoredSettings().country);
        window.addEventListener(SETTINGS_EVENT, sync);
        return () => window.removeEventListener(SETTINGS_EVENT, sync);
      }, []);
      void localeTick;
      const boundT = (key, params) => fill(t(key), params);
      const onChange = (next) => {
        persistSettings({ country: next });
        const cached = readStoredCalendar(next);
        installHolidays(next, cached ? cached.years : null);
        emitSettingsChanged();
        setCountry(next);
      };
      return h('div', { className: 'skb-settings-row' }, [
        h('div', { key: 'text', className: 'skb-settings-text' }, [
          h('span', { key: 'label', className: 'skb-settings-label' }, boundT('settings.country.label')),
          h('span', { key: 'hint', className: 'skb-settings-hint' }, boundT('settings.country.hint')),
        ]),
        h(KanbanSelect, {
          key: 'select',
          className: 'skb-select--platform',
          value: country,
          options: COUNTRIES.map((item) => ({ id: item.code, label: countryName(item.code) })),
          ariaLabel: boundT('settings.country.label'),
          onSelect: onChange,
        }),
      ]);
    }

    // ----------------------------------------------------------------- apply
    const inject = ['slots', 'locale', 'sessions', 'remote', 'remote.session', 'remote.workspace', 'uiWorkspace', 'workspaces'];

    function apply(ctx) {
      ctx.effect(() => {
        if (typeof document === 'undefined') return () => {};
        const tag = document.createElement('style');
        tag.dataset.plugin = 'dsh-session-kanban';
        tag.dataset.pluginCss = 'dsh-session-kanban/panel.css';
        tag.textContent = CSS;
        document.head.appendChild(tag);
        return () => {
          if (tag.parentNode) tag.parentNode.removeChild(tag);
        };
      }, 'session-kanban: styles');
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'session-kanban: dictionaries');
      const t = ctx.locale.bind(NS);
      refreshHolidayCalendar(false).catch(() => {});

      ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: PANEL_ID,
        locale: NS,
        inject: () => ({ ctx }),
      }, SessionBoardPage));

      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 20,
        locale: NS,
        label: () => t('panel.title'),
        inject: () => ({ ctx }),
      }, SessionBoardIcon));

      ctx.slots.inject('settings.general.item', () => ctx.slots.register({
        name: 'settings.general.item',
        id: 'session-kanban-country',
        order: 25,
        locale: NS,
        inject: () => ({ ctx }),
      }, CountrySettingRow));
    }

    return { inject, apply };
  },
});
