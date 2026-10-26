# Wiki 源文件

本目录是 [项目 Wiki](https://github.com/Thunderunruly/session-kanban/wiki) 的源文件（Markdown），
便于版本化维护。`_Sidebar.md` 与 `_Footer.md` 是 GitHub Wiki 的侧边栏与页脚。

## 首次初始化（仅一次）

GitHub 没有创建 Wiki 首页的 API/CLI：仓库 Wiki 必须先由有写权限的人在网页上创建第一页，
之后才能通过 git 推送内容。

1. 打开 <https://github.com/Thunderunruly/session-kanban/wiki>
2. 点击 **Create the first page**
3. 标题填 `Home`，内容随意（会被覆盖），保存
4. 之后执行下面的发布脚本

## 发布

需要本机已登录 GitHub（`gh auth login` 或 git 凭据管理器），然后运行：

```powershell
./publish.ps1
```

脚本会：

1. 克隆 `https://github.com/Thunderunruly/session-kanban.wiki.git` 到临时目录；
2. 用本目录的 `*.md` 页面覆盖（`README.md` 本身不会发布）；
3. 提交并推送。

可用 `-Message "..."` 自定义提交信息。发布前建议先执行仓库测试。
