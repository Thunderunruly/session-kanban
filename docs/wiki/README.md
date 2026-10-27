# Wiki 源文件

本目录是 [项目 Wiki](https://github.com/Thunderunruly/session-kanban/wiki) 的源文件（Markdown），
便于版本化维护。Wiki 为中英双语：

- 根目录：**中文**页面（中文文件名，如 `首页.md`、`安装.md`）＋ `_Sidebar.md` / `_Footer.md`；
- `en/`：**英文**页面（英文文件名，如 `Home.md`、`Installation.md`），发布时放到 Wiki 根目录。

每页顶部带语言切换链接（`English | 简体中文`）。`README.md` 本身不会发布到 Wiki。

## 首次初始化（仅一次）

GitHub 没有创建 Wiki 首页的 API/CLI：仓库 Wiki 必须先由有写权限的人在网页上创建第一页，
之后才能通过 git 推送内容。当前仓库已完成初始化。

## 发布

需要本机已登录 GitHub（`gh auth login` 或 git 凭据管理器），然后运行：

```powershell
./publish.ps1
```

脚本会：

1. 克隆 `https://github.com/Thunderunruly/session-kanban.wiki.git` 到临时目录；
2. 复制根目录中文页面（`README.md` 除外）与 `en/` 下的英文页面；
3. 提交并推送。

可用 `-Message "..."` 自定义提交信息。发布前建议先执行仓库测试。

如果直连 `github.com` 被重置/超时而本机有本地代理，使用 `-Proxy`：

```powershell
./publish.ps1 -Proxy http://127.0.0.1:7897
```
