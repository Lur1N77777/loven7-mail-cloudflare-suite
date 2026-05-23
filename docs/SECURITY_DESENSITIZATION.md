# 脱敏与发布检查

发布到 GitHub 前必须确认：

- 不包含 `.env.production`、`.env.local`、私有 `.env`。
- 不包含 `dist/`、`node_modules/`、`.wrangler/`、本地缓存或截图。
- 不包含个人 Worker API、个人域名、Cloudflare Token、管理员密码、站点密码、JWT。
- `apps/webmail/wrangler.toml` 不能带真实 KV Namespace ID。

## 推荐扫描

在仓库根目录执行：

```bash
rg -n --hidden -S "<你的私有 API>|<你的私有域名>|<你的管理员密码>|<你的 Token 前缀>" . \
  -g '!node_modules/**' -g '!dist/**' -g '!.git/**'
```

如果部署者在本地使用了自己的域名或密钥，也应该把自己的关键词加入扫描。

## 允许出现的内容

- `loven7` 可以作为项目名、localStorage key 前缀或 UI 品牌名。
- `gmail.com`、`paypal.com` 等公开品牌域名可能出现在发件人品牌头像映射里，这不是私人信息。
- `https://your-worker.example.workers.dev` 这类示例占位符可以保留。

