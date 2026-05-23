# 发布到 GitHub

本项目已经整理成干净 Git 仓库，默认分支为 `main`。如果 `gh auth status` 正常，推荐直接用脚本发布。

## 方式一：GitHub CLI 一键发布（推荐）

先登录：

```bash
gh auth login -h github.com
```

然后执行：

```powershell
cd D:\files\Aitest4\loven7-mail-pwa\open-source
.\scripts\publish-github.ps1 -RepoName loven7-mail-cloudflare-suite
```

或 Git Bash / macOS / Linux：

```bash
cd /path/to/open-source
bash scripts/publish-github.sh loven7-mail-cloudflare-suite
```

成功后脚本会输出 GitHub 仓库 URL。

## 方式二：推送到你已创建的空仓库

如果你已经在 GitHub 网页创建了空仓库，例如：

```text
https://github.com/<owner>/loven7-mail-cloudflare-suite.git
```

执行：

```bash
cd D:\files\Aitest4\loven7-mail-pwa\open-source
git remote add origin https://github.com/<owner>/loven7-mail-cloudflare-suite.git
git push -u origin main
```

## 方式三：使用 Git bundle 导入

如果不能直接访问当前工作目录，可以使用发布目录中的：

```text
open-source-release-*/loven7-mail-cloudflare-suite.git.bundle
```

导入：

```bash
git clone loven7-mail-cloudflare-suite.git.bundle loven7-mail-cloudflare-suite
cd loven7-mail-cloudflare-suite
git remote add origin https://github.com/<owner>/loven7-mail-cloudflare-suite.git
git push -u origin main
```

## 方式四：GitHub 网页上传源码 ZIP

发布目录里也有：

```text
open-source-release-*/loven7-mail-cloudflare-suite-source.zip
```

这个 ZIP 是 `git archive` 生成的源码快照，不包含 `.git` 历史。适合 GitHub 网页直接上传，但推荐优先用 Git CLI 或 bundle 保留提交历史。

## 发布后必须确认

发布后打开 GitHub 仓库确认：

- `README.md` 顶部说明基于 Cloudflare Temp Mail / `cloudflare_temp_email` 上游接口。
- `apps/admin` 和 `apps/webmail` 都存在。
- `docs/AGENT_DEPLOY_PROMPT.md` 存在，可以复制给 Agent 部署。
- 仓库没有 `node_modules/`、`dist/`、`.env.production`、`.wrangler/`。
- 仓库搜索不应出现你的私人 API、私人域名、管理员密码、Token、KV ID。
