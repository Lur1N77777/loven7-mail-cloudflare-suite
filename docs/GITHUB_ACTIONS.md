# GitHub Actions 自动构建与自动部署

本仓库已经包含两条 GitHub Actions workflow：

| 文件 | 作用 |
| --- | --- |
| `.github/workflows/ci.yml` | PR、push 到 `main`、手动运行时自动构建检查 |
| `.github/workflows/deploy-cloudflare-pages.yml` | push 到 `main` 或手动运行时构建，并在配置 Cloudflare 后自动部署 |

## 1. 自动构建检查

`Build & Validate` 会执行：

```text
apps/admin    npm ci → npm run lint → npm run build
apps/webmail  npm ci → npm run build
```

这条 workflow 不需要任何密钥。别人 fork 仓库后也能直接跑。

## 2. 开启 Cloudflare Pages 自动部署

先在 Cloudflare Pages 里准备两个项目：

| 项目 | Root directory | Output directory |
| --- | --- | --- |
| 管理后台 | `apps/admin` | `dist` |
| 用户站 / 分享站 | `apps/webmail` | `dist` |

然后打开 GitHub 仓库：

```text
Settings → Secrets and variables → Actions
```

添加两个 **Repository secrets**：

| Secret | 说明 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token，至少需要 Pages 部署权限 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |

添加两个 **Repository variables**：

| Variable | 示例 | 说明 |
| --- | --- | --- |
| `ADMIN_PAGES_PROJECT_NAME` | `loven7-mail-admin` | 管理后台 Pages 项目名 |
| `WEBMAIL_PAGES_PROJECT_NAME` | `loven7-mail-webmail` | 用户站 Pages 项目名 |

保存后，每次 push 到 `main` 都会自动构建并部署两个 Pages 项目。

## 3. 手动触发部署

在 GitHub 仓库打开：

```text
Actions → Deploy to Cloudflare Pages → Run workflow
```

你可以选择：

- 只部署管理后台
- 只部署用户站
- 两个都部署

## 4. 用户站运行时配置仍在 Cloudflare Pages 里设置

GitHub Actions 只负责构建和上传代码。用户站这些运行时配置仍建议在 Cloudflare Pages 项目设置里管理：

| 名称 | 类型 | 说明 |
| --- | --- | --- |
| `MAIL_WORKER_BASE_URL` | Environment variable | 你的 Cloudflare Temp Mail Worker/API 地址 |
| `SITE_PASSWORD` | Environment variable | 如果上游 Worker 开启站点密码才需要 |
| `SHARE_ENCRYPTION_SECRET` | Environment variable | 分享功能加密密钥，建议 32 字符以上随机字符串 |
| `SHARE_KV` | KV binding | 分享链接、撤回状态、仅新增邮件和隐藏邮件记录 |

这样做的好处是：仓库不会保存 API、密码、Token、KV ID 或个人域名。

## 5. 如果没有配置 Cloudflare 密钥会怎样

`Deploy to Cloudflare Pages` 仍会构建项目，但会跳过部署步骤，并在日志里提示缺少哪些配置。

这适合开源仓库：别人可以先验证构建，通过后再决定是否配置自己的 Cloudflare 自动部署。
