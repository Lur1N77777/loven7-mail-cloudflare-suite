# AI Agent 部署指令

这份文档是专门写给 AI Agent 的。适用于 Claude Code、Codex、OpenCode、Hermes、OpenClaw 或其他能操作 GitHub / Cloudflare 的编程运维 Agent。

用户可以把整份文档复制给 Agent，让 Agent 帮忙把 Loven7 Mail Cloudflare Suite 部署到自己的 Cloudflare 账号里。

## 你的任务

把下面这个 GitHub 项目部署到用户自己的 Cloudflare：

```text
https://github.com/Lur1N77777/loven7-mail-cloudflare-suite
```

这是一个基于 Cloudflare Temp Mail / `cloudflare_temp_email` 上游 Worker API 的增强前端套件，包含：

```text
apps/admin    管理后台 PWA
apps/webmail  用户邮箱站 / 分享站，包含 Cloudflare Pages Functions
```

你不需要部署或改造上游 Worker 后端；用户应当已经有可用的 Cloudflare Temp Mail 官方 Worker/API。

## 先向用户确认的信息

开始前，请向用户确认这些值。不要让用户把真实密码写进 GitHub 仓库。

```text
1. Cloudflare 账号是否已登录 / 是否允许你操作 Cloudflare。
2. Cloudflare Temp Mail Worker API 地址：<必填>
3. 管理员密码 x-admin-auth：<管理后台首次连接时需要，通常不用写入 Pages 环境变量>
4. 站点密码 x-custom-auth：<可选，如果上游 Worker 启用了站点密码>
5. 想使用的管理后台 Pages 项目名：<默认 loven7-mail-admin>
6. 想使用的用户站 Pages 项目名：<默认 loven7-mail-webmail>
7. 是否需要分享功能：<推荐需要>
8. 是否有自定义域名：<可选>
```

如果用户没有提供 `SHARE_ENCRYPTION_SECRET`，你应当生成一个 32 字符以上的随机字符串，并只保存到 Cloudflare Pages 环境变量，不要输出完整密钥。

## 安全硬性要求

必须遵守：

1. 不要把用户的 Worker API 私密信息、管理员密码、站点密码、Cloudflare Token、GitHub Token、`SHARE_ENCRYPTION_SECRET` 提交到 GitHub。
2. `apps/admin` 是浏览器前端，默认不要设置 `VITE_API_BASE`，除非用户明确要求写死默认 API。
3. `apps/webmail` 的敏感信息只能放在 Cloudflare Pages 运行时环境变量里。
4. 不要提交 `node_modules/`、`dist/`、`.env.production`、`.wrangler/`。
5. 部署结束后的回复中，只列出环境变量名称，不要回显密码或密钥原文。

## 部署方案

需要创建两个 Cloudflare Pages 项目。

### 1. 部署管理后台 `apps/admin`

Cloudflare Pages 设置：

```text
Project name: loven7-mail-admin（可按用户要求修改）
Root directory: apps/admin
Build command: npm ci && npm run build
Output directory: dist
```

环境变量：

```text
VITE_API_BASE             不设置，推荐留空
VITE_FRONTEND_LOGIN_BASE  可选；如果用户站 URL 已知，可以设置为用户站 URL
VITE_APP_NAME             可选；默认 Loven7-Mail
```

说明：

- 管理员密码不需要写入 Pages 环境变量。
- 部署后用户打开管理后台，在“连接设置”里填写 Worker API 地址和管理员密码。
- 浏览器会缓存连接信息。

### 2. 部署用户站 / 分享站 `apps/webmail`

Cloudflare Pages 设置：

```text
Project name: loven7-mail-webmail（可按用户要求修改）
Root directory: apps/webmail
Build command: npm ci && npm run build
Output directory: dist
```

必须设置的 Pages 运行时环境变量：

```text
MAIL_WORKER_BASE_URL=<用户自己的 Cloudflare Temp Mail Worker/API 地址>
```

可选环境变量：

```text
SITE_PASSWORD=<如果上游 Worker 启用了 x-custom-auth，就设置；否则不设置>
```

分享功能需要：

```text
SHARE_ENCRYPTION_SECRET=<生成或使用用户提供的 32 字符以上随机字符串>
```

分享功能还必须绑定 KV Namespace：

```text
Binding name: SHARE_KV
Type: KV Namespace
Namespace: 新建或用户指定的 KV Namespace
```

建议 KV Namespace 名称：

```text
loven7-mail-share-kv
```

## 如果使用 Wrangler / CLI

如果你有 Cloudflare CLI 权限，可以用等价流程完成部署；如果没有权限，就输出 Cloudflare 控制台里需要填写的设置。

示例流程：

```bash
git clone https://github.com/Lur1N77777/loven7-mail-cloudflare-suite.git
cd loven7-mail-cloudflare-suite

# 验证管理后台能构建
cd apps/admin
npm ci
npm run build
cd ../..

# 验证用户站能构建
cd apps/webmail
npm ci
npm run build
cd ../..
```

实际 Pages 项目的创建、环境变量、KV 绑定可以通过 Cloudflare Dashboard、Wrangler、Cloudflare API 或用户提供的 Cloudflare MCP 完成。

## 部署后配置

两个 Pages 都部署完成后：

1. 打开管理后台 URL。
2. 在“连接设置”中输入：
   - Worker API 地址
   - 管理员密码
   - 站点密码（如果有）
3. 进入“系统设置”。
4. 找到“前端登录链接前缀”。
5. 填入用户站 URL，例如：

```text
https://loven7-mail-webmail.pages.dev
```

6. 保存。

## 验证步骤

部署完成后必须验证：

1. 管理后台能打开。
2. 管理后台能通过用户提供的 Worker API 和管理员密码登录。
3. 地址管理能加载邮箱地址。
4. 复制某个邮箱登录链接后，能打开用户站。
5. 用户站能显示该邮箱邮件。
6. 如果启用分享功能：
   - 管理后台能创建单邮箱分享链接。
   - 管理后台能创建多邮箱分享链接。
   - 用户站能打开分享链接。
   - 管理后台能撤回分享链接。
7. 刷新管理后台后，不应反复要求重新输入连接设置，除非用户清除了浏览器站点数据。

## 最终回复给用户的格式

完成后，请用这个格式回复用户：

```text
部署完成：

管理后台：<admin Pages URL>
用户站 / 分享站：<webmail Pages URL>
GitHub 仓库：https://github.com/Lur1N77777/loven7-mail-cloudflare-suite

已配置：
- apps/admin Pages 项目
- apps/webmail Pages 项目
- MAIL_WORKER_BASE_URL
- SITE_PASSWORD（如果用户提供了）
- SHARE_ENCRYPTION_SECRET（不回显原文）
- SHARE_KV KV Namespace（如果启用分享）

已验证：
- 管理后台可打开
- 用户站可打开
- 管理后台可连接 Worker API
- 邮箱登录链接可打开用户站
- 分享链接功能可用（如果启用）

注意：请妥善保存 Cloudflare 和 GitHub 凭据，不要把密码或 token 发到公开仓库。
```

## 常见失败处理

### `MAIL_WORKER_BASE_URL is not configured`

用户站 Pages 没有设置 `MAIL_WORKER_BASE_URL`。设置后重新部署。

### `SHARE_KV is not configured`

用户站 Pages 没有绑定 KV Namespace。绑定名必须是：

```text
SHARE_KV
```

### `SHARE_ENCRYPTION_SECRET is not configured`

用户站 Pages 没有设置分享加密密钥。生成一个 32 字符以上随机字符串并设置。

### 用户站无法读取邮件

检查 `MAIL_WORKER_BASE_URL` 是否是 Worker/API 根地址，不是管理后台 URL，也不是用户站 URL。

### 管理后台复制出来的登录链接域名不对

进入管理后台“系统设置”，把“前端登录链接前缀”改成用户站 URL。
