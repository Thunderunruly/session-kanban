# 配置

插件在 **DSH → 设置 → 通用设置** 中注册两行设置，样式与内置 General 行一致。

## 工作日国家/地区

- 默认：**中国**；
- 可选 24 个国家/地区；
- 作用：决定热力图的工作日 / 非工作日标注来源与颜色；
- 中国、日本、韩国、俄罗斯使用各自官方的调休/生产日历数据源，其余国家使用 Nager.Date
  公共假日 + 当地周末规则（详见 [工作日数据源](Data-Sources)）。

## 日历自动更新

- 默认：**1 个月**；
- 可选：1 天 / 1 周 / 1 个月 / 3 个月 / 6 个月 / 1 年；
- 作用：浏览器自动重新获取节假日数据的间隔；热力图侧栏的刷新图标可随时立即更新，不受该间隔
  限制。

## 本地存储键

看板偏好保存在 `localStorage`，均为 `dsh.session-kanban.*` 前缀：

| 键 | 作用 |
| --- | --- |
| `dsh.session-kanban.filter.v2` | 当前 Tab |
| `dsh.session-kanban.heatmap.v1` | 热力图刻度（年/月/周/日）等 |
| `dsh.session-kanban.highlight.v1` | 工作日/非工作日高亮开关 |
| `dsh.session-kanban.scope.v1` | Agent 团队范围选择 |
| `dsh.session-kanban.workspace.v1` | 工作区过滤选择 |
| `dsh.session-kanban.settings.v1` | 工作日国家与自动更新间隔 |
| `dsh.session-kanban.calendar.v2` | 工作日日历缓存（按国家） |

排查问题时可以在浏览器控制台执行
`Object.keys(localStorage).filter((key) => key.startsWith('dsh.session-kanban.'))` 查看这些值，
或用 `localStorage.removeItem(...)` 单独重置某一项。

## 主题

插件不定义独立配色：卡片、下拉、按钮、Tooltip、设置行都复用宿主 token 与原生组件，因此浅色 /
深色主题切换会自动生效。

