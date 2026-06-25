# Cloudflare Pages 部署说明

## 项目结构

```text
apps/admin    管理后台 PWA
apps/webmail  用户站 / 分享站，包含 Pages Functions
```

建议在 Cloudflare Pages 创建两个独立项目，分别指向不同 Root directory。

如果你只想看最短路径，先读 [DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md)。这份文档保留更多部署细节和排错说明。

推荐项目名：

| 站点            | Project name          |
| --------------- | --------------------- |
| 管理后台        | `loven7-mail-admin`   |
| 用户站 / 分享站 | `loven7-mail-webmail` |

当前这个仓库已经在生产环境复用了已有 Pages 项目：

| 站点            | 当前生产 Project name | 生产域名                     |
| --------------- | --------------------- | ---------------------------- |
| 管理后台        | `loven7-mail-pwa`     | `https://mail.loven7.cc.cd`  |
| 用户站 / 分享站 | `cloudmail-webmail`   | `https://email.loven.qzz.io` |

如果你已经有旧的 Pages 项目，不需要为了本仓库强制改名。部署前显式设置项目名即可：

```powershell
$env:ADMIN_PAGES_PROJECT_NAME="loven7-mail-pwa"
$env:WEBMAIL_PAGES_PROJECT_NAME="cloudmail-webmail"
```

不设置时脚本会使用上表的文档默认值；如果账号里不存在这些默认项目，部署会失败或部署到错误目标。

## 部署前本地预检

在仓库根目录运行：

```bash
npm run check:cloudflare
```

预检会确认 Pages 项目名、GitHub Actions、Webmail Functions 检查脚本、运行时变量示例和 `SHARE_KV` 绑定说明保持一致。它不访问 Cloudflare、不部署、不读取真实密钥；如果提示缺少 `CLOUDFLARE_API_TOKEN` 或 `CLOUDFLARE_ACCOUNT_ID`，表示本地预检通过但实际部署前仍需要配置 Cloudflare 认证。

预览分支部署前建议指定分支并确认 preview runtime：

```powershell
$env:CF_PAGES_BRANCH="preview"
$env:WEBMAIL_PREVIEW_RUNTIME_CONFIRMED="1"
npm run check:cloudflare
```

只有确认用户站 Preview 环境已经配置 `MAIL_WORKER_BASE_URL`、可选 `SITE_PASSWORD`、`SHARE_ENCRYPTION_SECRET`、`SHARE_ADMIN_CORS_ORIGINS` 和 `SHARE_KV` 后，才设置 `WEBMAIL_PREVIEW_RUNTIME_CONFIRMED=1`。

## 管理后台 apps/admin

| 项               | 值                        |
| ---------------- | ------------------------- |
| Root directory   | `apps/admin`              |
| Build command    | `npm ci && npm run build` |
| Output directory | `dist`                    |

管理后台可以不配置任何环境变量。首次打开后输入自己的 Worker API 地址和管理员密码，保存一次即可。

## 用户站 apps/webmail

| 项               | 值                        |
| ---------------- | ------------------------- |
| Root directory   | `apps/webmail`            |
| Build command    | `npm ci && npm run build` |
| Output directory | `dist`                    |

运行时变量：

```text
MAIL_WORKER_BASE_URL=https://your-worker.example.workers.dev
SITE_PASSWORD=可选
SHARE_ENCRYPTION_SECRET=建议 32 字符以上随机字符串
SHARE_ADMIN_CORS_ORIGINS=https://your-admin-pages.example
SHARE_PUBLIC_CORS_ORIGINS=可选，默认留空
```

KV 绑定：

```text
Binding name: SHARE_KV
Type: KV Namespace
```

KV 是本项目唯一需要的数据库能力。它只保存分享链接和访客隐藏状态；不需要 D1、SQL、迁移脚本或表结构。

`apps/admin/wrangler.toml` 和 `apps/webmail/wrangler.toml` 只作为本地参考，里面不能提交真实 KV Namespace ID。`npm --prefix apps/webmail run deploy` 默认会临时忽略用户站本地 `wrangler.toml`，避免本地配置覆盖 Cloudflare Pages 控制台里的 Functions 运行时变量和 KV 绑定。只有你明确想用本地 `wrangler.toml` 替换 Pages 项目绑定时，才设置 `WEBMAIL_USE_LOCAL_WRANGLER_CONFIG=1`，并在本地把示例 KV 配置改成自己的 ID。

## Agent 自动部署可行性

如果用户已经有上游 Cloudflare Temp Mail Worker，Agent 可以自动完成基础设施部署：创建 Pages、设置运行时变量、创建并绑定 KV、触发部署和检查 `/api/runtime`。

仍然建议用户在管理后台网页里手动填写 Worker API 地址和管理员密码。这样管理员凭据只保存在当前浏览器本地，不会进入 Prompt、仓库、Actions 日志或构建产物。

## Deploy to Cloudflare 按钮可行性

Cloudflare 官方 `Deploy to Cloudflare` 按钮现在适合 Workers 模板。官方限制里明确说明：Pages applications are not supported。

因此，本仓库当前不能直接使用下面这种按钮作为真实的一键部署入口：

```md
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Lur1N77777/loven7-mail-cloudflare-suite)
```

原因有三个：

1. 本仓库推荐目标是 Cloudflare Pages，而不是 Workers。
2. 仓库包含 `apps/admin` 和 `apps/webmail` 两个独立 Pages 项目；官方按钮不会一次创建两个 Pages 项目。
3. 用户站需要运行时变量、secret 和 `SHARE_KV` 绑定；这些配置必须落在用户自己的 Cloudflare 账号里，不能写进公开仓库。

如果以后一定要做官方同款按钮，建议另开一个 Workers 部署模板：

1. 把 `apps/admin` 改造成 Workers Static Assets 应用，或继续保留为手动 Pages 项目。
2. 把 `apps/webmail` 的 Pages Functions 路由迁移为 Worker 路由，并使用 Workers Static Assets 托管前端资源。
3. 在 Worker `wrangler.toml` / `package.json` 里声明 `SHARE_KV`、`MAIL_WORKER_BASE_URL`、`SHARE_ENCRYPTION_SECRET` 等绑定说明。
4. 为 Admin 和 Webmail 分别提供 Deploy to Cloudflare 按钮；官方按钮对 monorepo 和多 Workers 应用仍有限制，通常不能一次部署两个应用。

在完成这类迁移前，请使用 [部署速查](DEPLOYMENT_QUICKSTART.md) 里的 Agent 自动部署指令或 Cloudflare Pages 控制台步骤。

## Preview 环境注意事项

Cloudflare Pages 的 Production 和 Preview 环境是分开的。Production 已经配置好的 secret、环境变量或 KV 绑定，不代表 Preview 自动可用。

如果你部署到 `preview` 分支，请在用户站 Pages 项目里分别确认 Preview 环境：

| 项                         | Preview 环境也需要吗             | 说明                                                             |
| -------------------------- | -------------------------------- | ---------------------------------------------------------------- |
| `MAIL_WORKER_BASE_URL`     | 是                               | 不配置时用户站登录会提示“邮箱 API 未配置”。                      |
| `SITE_PASSWORD`            | 上游 Worker 开启站点密码时是     | Production 配了不代表 Preview 自动可用。                         |
| `SHARE_ENCRYPTION_SECRET`  | 使用分享功能时是                 | 可以为 Preview 生成独立随机值。                                  |
| `SHARE_ADMIN_CORS_ORIGINS` | 管理后台和用户站不同 origin 时是 | 填 Preview 管理后台 origin。                                     |
| `SHARE_KV`                 | 使用分享功能时是                 | 建议 Preview 用独立 KV Namespace，避免污染 Production 分享数据。 |

修改 Preview runtime 后需要重新部署 Preview 分支。部署后优先使用只读诊断接口确认：

```bash
curl -s https://你的用户站-preview域名/api/runtime
```

`/api/runtime` 只返回 boolean 检查结果、`missing` 缺失项和 `hints` 修复提示，不输出 `MAIL_WORKER_BASE_URL`、`SITE_PASSWORD`、`SHARE_ENCRYPTION_SECRET`、KV ID 或任何 secret 原文。必需项缺失时 `ok=false`；`SITE_PASSWORD` 和 `SHARE_ADMIN_CORS_ORIGINS` 属于可选/按场景提示项，不会单独让 `ok=false`。

如果线上版本还没有 `/api/runtime`，可以使用旧的只读分享探针确认：

```bash
curl -i https://你的用户站-preview域名/api/share/__probe__
```

配置正常时应返回 `share_not_found`；如果返回 `share_kv_not_configured` 或 `share_secret_not_configured`，说明 Preview 的分享 runtime 仍未补齐。

如果登录探针或页面登录提示 `mail_worker_not_configured` / “邮箱 API 未配置”，说明 Preview 还缺 `MAIL_WORKER_BASE_URL`。如果 Production 正常但 Preview 失败，优先检查 Preview 环境，而不是代码。

也可以运行内置线上探针。它会优先读取 `/api/runtime`；如果线上版本还没部署该接口，才退回到无效分享 token 和假账号探针。脚本不读取任何 secret，也不会输出 secret 原文：

```powershell
$env:WEBMAIL_RUNTIME_URL="https://email.loven.qzz.io"
npm run check:cloudflare:runtime
```

探针会同时检查：

- 页面 HTML 是否可访问。
- `/api/runtime` 是否返回运行时配置诊断，确认 `MAIL_WORKER_BASE_URL`、`SHARE_KV` 和 `SHARE_ENCRYPTION_SECRET` 等必需项。
- `/api/share/<missing-token>` 是否返回 `share_not_found`，用于确认 `SHARE_KV` 和 `SHARE_ENCRYPTION_SECRET`。
- `/api/session` 假账号登录是否返回 `invalid_login`，用于确认 `MAIL_WORKER_BASE_URL` 和可选 `SITE_PASSWORD` 基本可用；如果 `/api/runtime` 已明确缺少 `MAIL_WORKER_BASE_URL`，脚本会跳过假登录，避免无意义请求上游 Worker。

## 连接管理后台与用户站

管理后台会用“前端登录链接前缀”生成 `/?JWT=...` 登录链接，也会用该 URL 调用用户站的 `/api/share/admin/*` 管理共享链接。

如果管理后台和用户站不在同一个 origin，需要在用户站 Pages 的运行时变量里设置：

```text
SHARE_ADMIN_CORS_ORIGINS=https://your-admin-pages.example
```

这里填写的是“管理后台页面所在 origin”，不是用户站地址。公开分享接口默认只允许同源分享页调用；只有刻意把分享 API 提供给其他前端时才设置 `SHARE_PUBLIC_CORS_ORIGINS`。

部署用户站后，在管理后台：

1. 打开“系统设置”。
2. 找到“前端登录链接前缀”。
3. 填入用户站 URL，例如 `https://your-webmail.pages.dev`。
4. 保存。

## 常见问题

### 分享接口提示 SHARE_KV is not configured

用户站 Pages 没有绑定 KV Namespace。去 Cloudflare Pages 的 Settings → Functions → KV namespace bindings 绑定 `SHARE_KV`。

如果只有 Preview 报错，请切到 Cloudflare Pages 的 Preview 环境绑定 `SHARE_KV`，并重新部署 Preview 分支。建议 Preview 使用独立 KV Namespace，避免污染 Production 分享数据。

### 分享接口提示 SHARE_ENCRYPTION_SECRET is not configured

用户站 Pages 没有设置 `SHARE_ENCRYPTION_SECRET`。添加一个随机长字符串后重新部署。

### 用户站打不开邮件

检查 `MAIL_WORKER_BASE_URL` 是否是官方 Temp Mail Worker/API 的根地址，不要填管理后台 Pages URL。

如果只有 Preview 打不开邮件，请检查 Preview 环境是否单独配置了 `MAIL_WORKER_BASE_URL`；如果上游 Worker 启用了站点密码，也要单独配置 Preview `SITE_PASSWORD`。修改后需要重新部署 Preview 分支。

### 后台刷新后不记住配置

同一个浏览器、同一个稳定域名才会共享本地缓存。不要每次使用随机预览域名测试。

## 生产运维 Runbook

日常发布、Direct Upload 应急发布、发布后验证和回滚步骤集中记录在 [`OPERATIONS_RUNBOOK.md`](OPERATIONS_RUNBOOK.md)。维护生产环境时优先按 runbook 操作。
