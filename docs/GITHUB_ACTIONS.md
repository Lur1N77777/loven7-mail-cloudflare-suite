# GitHub Actions 自动构建与自动部署

本仓库已经包含两条 GitHub Actions workflow：

| 文件                                            | 作用                                                            |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `.github/workflows/ci.yml`                      | PR、push 到 `main`、手动运行时自动构建检查                      |
| `.github/workflows/deploy-cloudflare-pages.yml` | push 到 `main` 或手动运行时构建，并在配置 Cloudflare 后自动部署 |

当前生产项目名：

| 站点            | GitHub variable              | 当前值                       |
| --------------- | ---------------------------- | ---------------------------- |
| 管理后台        | `ADMIN_PAGES_PROJECT_NAME`   | `loven7-mail-pwa`            |
| 用户站 / 分享站 | `WEBMAIL_PAGES_PROJECT_NAME` | `cloudmail-webmail`          |
| 用户站线上探针  | `WEBMAIL_RUNTIME_URL`        | `https://email.loven.qzz.io` |

## 1. 自动构建检查

`Build & Validate` 会执行：

```text
repo root     npm run check:cloudflare
apps/admin    npm ci → npm run lint → npm run build
apps/webmail  npm ci → npm run build
```

这条 workflow 不需要任何密钥。别人 fork 仓库后也能直接跑。

`npm run check:cloudflare` 是部署前一致性预检，只检查 Cloudflare Pages 项目名、workflow、Webmail Functions 校验脚本、运行时变量示例和 `SHARE_KV` 绑定说明；不会连接 Cloudflare、不会部署，也不会读取真实密钥。

## 2. 让 AI Agent 帮你配置 Actions 自动部署

如果你使用 Claude Code、Codex、OpenCode、Hermes、OpenClaw 或其他 AI 编程 / 运维 Agent，可以直接复制下面这一段。不要把 Token、密码、Worker API 或密钥写进 Prompt，让 Agent 在需要时通过安全的 secrets/variables 输入流程读取。更短的部署路线见 [`DEPLOYMENT_QUICKSTART.md`](DEPLOYMENT_QUICKSTART.md)。

```text
请帮我为这个 GitHub 仓库配置 GitHub Actions 自动部署流程：https://github.com/Lur1N77777/loven7-mail-cloudflare-suite 。仓库里已经有 .github/workflows/ci.yml 和 .github/workflows/deploy-cloudflare-pages.yml。请先检查两个 workflow 是否存在并解释它们会做什么，然后在 GitHub 仓库的 Actions secrets/variables 中配置自动部署需要的 CLOUDFLARE_API_TOKEN、CLOUDFLARE_ACCOUNT_ID、ADMIN_PAGES_PROJECT_NAME、WEBMAIL_PAGES_PROJECT_NAME。不要把任何 Token、密码、Worker API、KV ID 或个人域名写进代码、README、commit 或日志。配置完成后，请手动触发一次 Deploy to Cloudflare Pages workflow，确认管理后台 apps/admin 和用户站 apps/webmail 都构建成功；如果 Cloudflare Pages 项目不存在，请指导我先创建两个 Pages 项目或用 Cloudflare 控制台创建。最后返回 Actions 运行结果、两个 Pages 项目名、以及我还需要在 Cloudflare Pages 里配置的用户站运行时变量 MAIL_WORKER_BASE_URL、SITE_PASSWORD、SHARE_ENCRYPTION_SECRET、SHARE_ADMIN_CORS_ORIGINS 和 SHARE_KV。
```

`SHARE_KV` 是本项目唯一需要的数据库绑定；不需要 D1、SQL 或迁移脚本。

## 3. 开启 Cloudflare Pages 自动部署

先在 Cloudflare Pages 里准备两个项目：

| 项目            | Root directory | Output directory |
| --------------- | -------------- | ---------------- |
| 管理后台        | `apps/admin`   | `dist`           |
| 用户站 / 分享站 | `apps/webmail` | `dist`           |

然后打开 GitHub 仓库：

```text
Settings → Secrets and variables → Actions
```

添加两个 **Repository secrets**：

| Secret                  | 说明                                          |
| ----------------------- | --------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API Token，至少需要 Pages 部署权限 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID                         |

添加两个 **Repository variables**：

| Variable                     | 示例                         | 说明                                               |
| ---------------------------- | ---------------------------- | -------------------------------------------------- |
| `ADMIN_PAGES_PROJECT_NAME`   | `loven7-mail-pwa`            | 管理后台 Pages 项目名                              |
| `WEBMAIL_PAGES_PROJECT_NAME` | `cloudmail-webmail`          | 用户站 Pages 项目名                                |
| `WEBMAIL_RUNTIME_URL`        | `https://email.loven.qzz.io` | 用户站生产域名，用于部署后运行 `/api/runtime` 探针 |
| `VITE_FRONTEND_LOGIN_BASE`   | `https://email.loven.qzz.io` | 管理后台构建时使用的用户站登录链接前缀             |

保存后，每次 push 到 `main` 都会自动构建并部署两个 Pages 项目。当前正式仓库会在部署前校验这些设置；如果选择部署但缺少 Cloudflare secret 或项目名变量，workflow 会失败，避免出现“构建成功但没有上线”的绿色假象。

## 4. 手动触发部署

在 GitHub 仓库打开：

```text
Actions → Deploy to Cloudflare Pages → Run workflow
```

你可以选择：

- 只部署管理后台
- 只部署用户站
- 两个都部署

## 5. 用户站运行时配置仍在 Cloudflare Pages 里设置

GitHub Actions 只负责构建和上传代码。用户站这些运行时配置仍建议在 Cloudflare Pages 项目设置里管理：

| 名称                        | 类型                 | 说明                                                                                     |
| --------------------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| `MAIL_WORKER_BASE_URL`      | Environment variable | 你的 Cloudflare Temp Mail Worker/API 地址                                                |
| `SITE_PASSWORD`             | Environment variable | 如果上游 Worker 开启站点密码才需要                                                       |
| `SHARE_ENCRYPTION_SECRET`   | Environment variable | 分享功能加密密钥，建议 32 字符以上随机字符串                                             |
| `SHARE_ADMIN_CORS_ORIGINS`  | Environment variable | 后台与用户站分开部署时必填，填写管理后台页面 origin，例如 `https://your-admin.pages.dev` |
| `SHARE_PUBLIC_CORS_ORIGINS` | Environment variable | 可选，公开分享 API 额外跨源来源；默认留空，只允许同源分享页                              |
| `SHARE_KV`                  | KV binding           | 分享链接、撤回状态、仅新增邮件和隐藏邮件记录                                             |

这样做的好处是：仓库不会保存 API、密码、Token、KV ID 或个人域名。

> 注意：`SHARE_ADMIN_CORS_ORIGINS` 配在**用户站 Pages 项目**上，值是“管理后台页面所在 origin”，不是用户站地址。不要设置为 `*`。

## 6. 部署后自动检查用户站运行时

如果设置了 `WEBMAIL_RUNTIME_URL`，用户站部署完成后 workflow 会运行：

```bash
npm run check:cloudflare:runtime
```

它会检查页面 HTML、`/api/runtime`、分享 KV、分享加密密钥、上游 Worker 基本连通性和假登录错误映射。探针不会输出任何 secret 原文。

## 7. 如果没有配置 Cloudflare 密钥会怎样

在正式仓库 `Lur1N77777/loven7-mail-cloudflare-suite` 的 `main` 分支上，只要 workflow 选择部署，缺少 Cloudflare 部署配置就会失败。

其他 fork 或复用仓库可以继续先跑构建检查，再按自己的 Cloudflare 项目补齐 secrets 和 variables。

完整生产运维流程见 [`OPERATIONS_RUNBOOK.md`](OPERATIONS_RUNBOOK.md)。
