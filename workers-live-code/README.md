# Weko QR Code 活码 — Workers + D1 最小示例

## 结构

```
workers-live-code/
  schema.sql       # codes + scans
  wrangler.toml
  src/index.ts     # 扫码跳转 + 管理 API
```

## 本地

```bash
cd workers-live-code
npm i
npx wrangler d1 create weko-qr   # 把返回的 database_id 填进 wrangler.toml
npm run db:init:local
npm run dev
```

管理后台通过 Vite 把 `/live` 代理到 `http://127.0.0.1:8787`。活码二维码只编码返回的 `scan_url`。

## 试一下

```bash
# 创建
curl -X POST http://127.0.0.1:8787/api/codes \
  -H 'content-type: application/json' \
  -d '{"type":"url","title":"官网","payload":{"url":"https://example.com"}}'

# 返回 scan_url，例如 http://127.0.0.1:8787/r/ab12cd34
# 浏览器打开 scan_url → 302 到 example.com

# 改内容（码不变）
curl -X PATCH http://127.0.0.1:8787/api/codes/<id> \
  -H 'content-type: application/json' \
  -d '{"payload":{"url":"https://example.com/new"}}'
```

## 前端编码

二维码内容 = `scan_url`，永远不要把最终业务 URL 写进码里。

## 生产注意

- `/api/*` 必须鉴权
- IP 写入前会做 SHA-256，只存截断后的 `ip_hash`
- 短链用独立子域（如 `q.example.com`），与 views 管理后台分离
