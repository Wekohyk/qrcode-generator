# Weko QR Code — 新艺术玻璃 · 绿色系

> Vue3 + TS + Vite + UnoCSS · 对标草料二维码的精简创作管理工具

## 1. 产品定位

安静、好用的二维码工具：生码、美化、活码、数据。不做过重无代码平台。

气质：**新艺术玻璃 + 绿色系**——雾绿底、磨砂玻璃面板、翠绿点缀；装饰只做角饰与分隔，不抢信息。

（已弃用：炭黑 + 青点缀深色科技风。）

产品名：**Weko QR Code**

## 2. 信息架构

```
落地页（可选）
└─ 控制台
   ├─ 工作台（新建快捷入口）
   ├─ 我的码（列表 / 搜索 / 筛选）
   ├─ 编辑器（内容 + 样式 + 预览）
   ├─ 模板库
   ├─ 数据（扫码趋势 / 来源）
   ├─ API（后期）
   └─ 设置
```

### MVP 页面

| 页面 | 核心 |
|------|------|
| `/` 登录后进工作台 | 快捷新建 + 最近码 |
| `/codes` | 码列表、批量、状态 |
| `/codes/new` `/codes/:id` | 三栏编辑器 |
| `/templates` | 模板选类型 |
| `/analytics` | 扫码量简报 |
| `/settings` | 账号 / 品牌 Logo |

### 生码类型（MVP）

URL · 文本 · 名片 · Wi‑Fi · 图文活码（内容可改、码不变）

## 3. 设计 Token

```ts
// uno.config / theme — 新艺术玻璃 · 绿色
colors: {
  bg: {
    base: '#E8F0E9',       // 雾绿底
    mist: '#F4F8F4',       // 更浅雾面
    raised: 'rgba(255,255,255,0.62)', // 玻璃抬升
    overlay: 'rgba(255,255,255,0.78)',
  },
  border: {
    subtle: 'rgba(36, 90, 58, 0.12)',
    strong: 'rgba(36, 90, 58, 0.22)',
    glass: 'rgba(255,255,255,0.55)',
  },
  text: {
    primary: '#1A2E24',    // 深林
    secondary: '#5A7264',
    muted: '#8AA093',
  },
  accent: {
    DEFAULT: '#2F9B6A',    // 翠绿
    hover: '#3CB87E',
    deep: '#1F6B48',
    muted: 'rgba(47,155,106,0.14)',
    soft: '#A8D5B5',       // 浅绿饰
  },
  ornament: {
    gold: '#C4A574',       // 新艺术细线点缀（少用）
  },
  success: '#2F9B6A',
  warning: '#D4A017',
  danger: '#D46565',
}
```

### 材质与造型

| 项 | 规范 |
|----|------|
| 玻璃 | `backdrop-blur(16–24px)` + 半透明白/浅绿；边 `1px` 高光边 |
| 圆角 | `12` / `16` / `20`（卡片偏柔，忌硬直角） |
| 阴影 | 淡绿调 soft shadow：`0 8px 32px rgba(36,90,58,0.08)` |
| 字号 | 12 / 14 / 16 / 20 / 28 |
| 字重 | 400 / 500 / 600 |
| 间距 | 4 的倍数 |
| 字体 | `Inter, "PingFang SC", "Noto Sans SC", system-ui` |
| 装饰 | 仅角饰藤蔓/叶线 SVG，线宽 1–1.5；不进表格行内 |

## 4. 布局骨架

```
┌────────┬─────────────────────────────┐
│ 56–220 │  Top bar（面包屑 / 搜索 ⌘K） │
│ 侧栏   ├──────────────┬──────────────┤
│ 玻璃   │ 主内容区      │ 右栏（编辑时）│
│        │ 玻璃卡片      │ 玻璃表单     │
└────────┴──────────────┴──────────────┘
```

- 侧栏可折叠到 icon-only（56px）；侧栏本身也是磨砂玻璃
- 编辑器：中栏预览固定在玻璃卡上，可加轻量新艺术线框；右侧配置可滚
- 页面底可用极淡叶形模糊装饰，不挡点击

## 5. 关键规范

**列表页**
- 表头 sticky；行高 56–64；行底透明，靠细分割线
- 码缩略图 40×40，外圈浅绿软边
- 状态：翠绿点正常 / 灰静态 / 琥珀暂停
- 主按钮仅一个：`+ 新建二维码`（accent 实心、白字）

**编辑器**
- 左：类型 Tab（玻璃 pill；选中 `accent-muted` + accent 边）
- 中：实时预览（玻璃卡；码默认经典黑白，可选翠绿模块）
- 右：内容 → 样式 → LOGO → 导出
- 主操作：`生成 / 保存` 翠绿实心

**组件**
- Button：primary（翠绿实心）/ ghost（玻璃边）/ danger
- Input：半透明白底 + `border-subtle`，focus `border-accent` + 淡绿光晕
- Tag / Chip：选中 `accent-muted` + accent 边
- Table：无斑马纹；hover 行浅雾绿
- Empty：一句话 + 主按钮；可放一枚极简叶形线稿，勿堆插画

## 6. 动效（克制）

- 180–220ms ease-out
- 玻璃卡出现：轻微上浮 + 透明度
- 预览码切换：淡入
- 禁止大面积粒子 / 强 glow；仅 focus 时 1–2px 淡绿光晕

## 7. 技术落地建议

```
src/
  assets/style/tokens.css      # CSS 变量（含 blur / glass）
  layouts/AppShell.vue
  pages/{Workbench,Codes,Editor,Templates,Analytics}.vue
  components/qr/{Preview,StylePicker,TypeTabs}.vue
  components/ornament/ArtFrame.vue   # 可选角饰
  composables/useQr.ts
```

UnoCSS 示例：

```ts
shortcuts: {
  'page': 'min-h-screen bg-bg-base text-text-primary',
  'glass': 'bg-bg-raised border border-border-subtle backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(36,90,58,0.08)]',
  'btn-primary': 'bg-accent text-white font-medium rounded-xl px-4 py-2 hover:bg-accent-hover',
  'input': 'bg-white/50 border border-border-subtle rounded-xl px-3 py-2 outline-none focus:border-accent',
}
```

码生成：`qrcode` / `uqr`；样式码后期可接 `qr-code-styling`。

## 8. 与草料的差异（刻意砍）

| 草料 | Weko QR Code MVP |
|------|----------|
| 无代码业务系统 | 生码 + 活码 + 轻数据 |
| 大量模板方案 | 少量高质量模板 |
| 亮色政务风 | 新艺术玻璃 · 绿色系 |

## 9. 和草料的边界（再强调）

活码 = 短链网关 + 可改 payload；不做草料级无代码业务搭建。

## 10. 活码架构（Cloudflare Workers + D1）

> 完整可跑示例见：`workers-live-code/`

### 10.1 原理

二维码只编码**固定短链**，不写最终业务地址：

```text
https://q.example.com/r/{short_key}
        │
        ▼
   Worker GET /r/:key
        │  1. 查 D1 codes
        │  2. waitUntil 写 scans
        │  3. type=url → 302
        │     type=text/page → 渲染 H5
        ▼
   目标页 / 展示页
```

管理端改 `payload_json` 即可换内容，**码面不变**。

### 10.2 部署分层

| 层 | Cloudflare | 职责 |
|----|------------|------|
| 管理后台 | Pages（Vue3） | 列表 / 编辑器 / 数据 |
| 扫码入口 | Workers | `/r/:key` 跳转与轻量页 |
| 配置与日志 | D1 | `codes` + `scans` |
| 文件 | R2（可选） | Logo、图文附件 |

推荐用 Node 语法写 Worker（`nodejs_compat` + Hono 亦可），**不要**把完整 Express 进程硬搬上去。

### 10.3 数据表（摘要）

```sql
codes(id, short_key, type, payload_json, status, ...)
scans(id, code_id, ts, ua, country, ip_hash, ...)
```

`type`：`url` | `text` | `vcard` | `wifi` | `page`

### 10.4 API（最小）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/r/:key` | 扫码入口 |
| POST | `/api/codes` | 创建活码 |
| PATCH | `/api/codes/:id` | 更新内容/状态 |
| GET | `/api/codes/:id` | 详情 |
| GET | `/api/codes/:id/stats` | 扫码统计 |

生产环境 `/api/*` **必须鉴权**（JWT 或 Cloudflare Access）。

### 10.5 前端约定

```ts
// 生成二维码时只编码短链
const scanUrl = `${SHORT_BASE}/r/${shortKey}`
await QRCode.toDataURL(scanUrl)
```

### 10.6 本地启动

```bash
cd workers-live-code
npm i
npx wrangler d1 create weko-qr   # 填 database_id 到 wrangler.toml
npm run db:init:local
npm run dev
```

详见 `workers-live-code/README.md`。

## 11. 视觉参考

| 文件 | 说明 |
|------|------|
| `02-list-weko-qr.png` | 列表 · Weko QR Code |
| `03-editor-weko-qr.png` | 编辑器 · Weko QR Code |

旧稿（InkCode 命名 / 深色科技）仅作存档，**不再作为实现依据**。

## 12. 下一步

1. 脚手架：Vite + Vue3 + TS + UnoCSS + Vue Router + Pinia  
2. AppShell（玻璃侧栏）+ 列表 + 编辑器三页  
3. 对接本 Worker 活码 API  
4. 短链自定义域 + API 鉴权  
