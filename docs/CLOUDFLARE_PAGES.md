# Cloudflare Pages 部署说明

## 项目结构

```text
apps/admin    管理后台 PWA
apps/webmail  用户站 / 分享站，包含 Pages Functions
```

建议在 Cloudflare Pages 创建两个独立项目，分别指向不同 Root directory。

## 管理后台 apps/admin

| 项 | 值 |
| --- | --- |
| Root directory | `apps/admin` |
| Build command | `npm ci && npm run build` |
| Output directory | `dist` |

管理后台可以不配置任何环境变量。首次打开后输入自己的 Worker API 地址和管理员密码，保存一次即可。

## 用户站 apps/webmail

| 项 | 值 |
| --- | --- |
| Root directory | `apps/webmail` |
| Build command | `npm ci && npm run build` |
| Output directory | `dist` |

运行时变量：

```text
MAIL_WORKER_BASE_URL=https://your-worker.example.workers.dev
SITE_PASSWORD=可选
SHARE_ENCRYPTION_SECRET=建议 32 字符以上随机字符串
```

KV 绑定：

```text
Binding name: SHARE_KV
Type: KV Namespace
```

## 连接管理后台与用户站

管理后台会用“前端登录链接前缀”生成 `/?JWT=...` 登录链接，也会用该 URL 调用用户站的 `/api/share/admin/*` 管理共享链接。

部署用户站后，在管理后台：

1. 打开“系统设置”。
2. 找到“前端登录链接前缀”。
3. 填入用户站 URL，例如 `https://your-webmail.pages.dev`。
4. 保存。

## 常见问题

### 分享接口提示 SHARE_KV is not configured

用户站 Pages 没有绑定 KV Namespace。去 Cloudflare Pages 的 Settings → Functions → KV namespace bindings 绑定 `SHARE_KV`。

### 分享接口提示 SHARE_ENCRYPTION_SECRET is not configured

用户站 Pages 没有设置 `SHARE_ENCRYPTION_SECRET`。添加一个随机长字符串后重新部署。

### 用户站打不开邮件

检查 `MAIL_WORKER_BASE_URL` 是否是官方 Temp Mail Worker/API 的根地址，不要填管理后台 Pages URL。

### 后台刷新后不记住配置

同一个浏览器、同一个稳定域名才会共享本地缓存。不要每次使用随机预览域名测试。
