# 复制给 Agent 的一键部署指令

把下面整段复制给你使用的编程/运维 Agent，并把尖括号里的内容替换成你自己的信息。

```text
请帮我把这个 GitHub 项目部署到我的 Cloudflare：

GitHub 仓库：<填入本仓库 GitHub 地址>

我已经部署好 Cloudflare Temp Mail / cloudflare_temp_email 官方 Worker，信息如下：
- Worker API 地址：<例如 https://your-temp-mail-worker.workers.dev>
- 管理员密码 x-admin-auth：<你的管理员密码>
- 站点密码 x-custom-auth（如果没有就留空）：<可选>

请完成以下部署：

1. Fork 或 clone 仓库。
2. 在 Cloudflare Pages 创建管理后台项目：
   - 项目名建议：loven7-mail-admin
   - Root directory：apps/admin
   - Build command：npm ci && npm run build
   - Output directory：dist
   - 环境变量先不填 VITE_API_BASE，避免把我的 API 写死；部署后我会在浏览器连接设置里填写 Worker API。
   - 可选：VITE_FRONTEND_LOGIN_BASE 填用户站最终 URL；如果暂时不知道，部署后去后台“系统设置 → 前端登录链接前缀”里保存。

3. 在 Cloudflare Pages 创建用户站/分享站项目：
   - 项目名建议：loven7-mail-webmail
   - Root directory：apps/webmail
   - Build command：npm ci && npm run build
   - Output directory：dist
   - 运行时环境变量：
     - MAIL_WORKER_BASE_URL=<我的 Worker API 地址>
     - SITE_PASSWORD=<如果上游 Worker 有站点密码就填，没有就不设置>
     - SHARE_ENCRYPTION_SECRET=<生成一个 32 字符以上随机字符串>
   - 创建一个 Cloudflare KV Namespace，并绑定到 Pages Functions：
     - Binding name：SHARE_KV
     - Namespace：新建的 KV Namespace

4. 部署完成后：
   - 打开管理后台 URL。
   - 在“连接设置”输入 Worker API 地址和管理员密码，保存一次，确认刷新后不会重复要求输入。
   - 进入“系统设置”，把“前端登录链接前缀”设置为用户站 URL，例如 https://loven7-mail-webmail.pages.dev。
   - 进入“地址管理”，选一个邮箱复制登录链接，确认能打开用户站。
   - 选中多个邮箱创建共享链接，确认用户站能打开，管理后台可以撤回共享链接。

5. 最后请输出：
   - 管理后台 Pages URL
   - 用户站 Pages URL
   - KV Namespace 名称
   - 已设置的环境变量名称（不要输出密码和密钥原文）
   - 你执行过的验证步骤
```

## 给 Agent 的注意事项

- 不要把 `MAIL_WORKER_BASE_URL`、管理员密码、站点密码、`SHARE_ENCRYPTION_SECRET` 提交到 GitHub。
- `apps/admin` 是浏览器前端；敏感凭据应该由用户首次打开后填写并存在自己浏览器里。
- `apps/webmail` 的 Pages Functions 会在服务端读取 `MAIL_WORKER_BASE_URL`、`SITE_PASSWORD`、`SHARE_ENCRYPTION_SECRET`。
- 分享功能必须绑定 `SHARE_KV`，否则分享创建/撤回/管理接口会返回未配置错误。
