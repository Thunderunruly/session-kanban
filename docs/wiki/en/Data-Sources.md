# Data Sources

**English** | [简体中文](数据源)

Workday/non-workday shading comes from public holiday data fetched directly by the browser.
Data is **cached per country** in `localStorage` and refetched on the auto-update interval;
the refresh icon in the heatmap sidebar updates immediately.

## Sources

| Country/region | Source | Notes |
| --- | --- | --- |
| China | [holiday-cn](https://github.com/NateScarlet/holiday-cn) mirrors (jsDelivr, then raw.githubusercontent.com) | Public holidays, make-up workdays and adjusted weekends |
| Japan | [holiday-jp](https://github.com/holiday-jp/holiday_jp) | Cabinet Office holidays, substitute holidays and citizens' holidays |
| South Korea | [holidays-kr](https://github.com/hyunbinseo/holidays-kr) | Includes substitute holidays |
| Russia | [isdayoff.ru](https://isdayoff.ru) | Production calendar with transferred working days |
| Other countries | [date.nager.at](https://date.nager.at) | Public holidays plus the local weekend rule |

## Fallback and cache

- If a dedicated source is unreachable, the board falls back to Nager.Date **per year**; the
  source name shown in the UI follows the data actually in use.
- The cache stores `{ years, fetchedAt, source }` per country; caches without a `source`
  field are refreshed once.
- An embedded China snapshot for 2023–2026 keeps the board usable offline.

## Status row

```
↻ China · 2026/10/26 · Holiday CN
```

Refresh icon (click to update now) · country · last refresh date (YYYY/MM/DD) · data source.
Hover for the full status and shading rule.

## Known limitations

- Data is **national-level**. Countries whose states/provinces differ (Germany, Canada,
  Australia, Spain, Switzerland, …) would need a subdivision selector, which is not
  implemented; only national public holidays are shown.
- Nager.Date currently has no dataset for the UAE, Saudi Arabia, Israel, Thailand, Malaysia
  or India, so those calendars fall back to the weekend rule only.
- State/province holidays in some countries (e.g. the US, UK) are not part of the national
  lists.

## Privacy

- Only the browser requests the public CORS endpoints listed above.
- Results are cached locally in `localStorage`.
- No credentials, session contents or personal data are sent; the plugin has no telemetry.
