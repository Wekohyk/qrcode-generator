# 墨码 / InkCode — 深色科技设计方案

> Vue3 + TS + Vite + UnoCSS · 对标草料二维码的精简创作管理工具

## 1. 产品定位

安静、好用的二维码工具：生码、美化、活码、数据。不做过重无代码平台。

气质：**炭黑底 + 青色点缀，安静工具感**。装饰克制，信息优先。

建议产品名（可改）：**墨码 InkCode** / **QR Studio**

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

| 页面                      | 核心               |
| ------------------------- | ------------------ |
| `/` 登录后进工作台        | 快捷新建 + 最近码  |
| `/codes`                  | 码列表、批量、状态 |
| `/codes/new` `/codes/:id` | 三栏编辑器         |
| `/templates`              | 模板选类型         |
| `/analytics`              | 扫码量简报         |
| `/settings`               | 账号 / 品牌 Logo   |

### 生码类型（MVP）

URL · 文本 · 名片 · Wi‑Fi · 图文活码（内容可改、码不变）

## 3. 设计 Token

```ts
// uno.config / theme
colors: {
  bg: {
    base: '#0B0F14',
    raised: '#12181F',
    overlay: '#1A222D',
  },
  border: {
    subtle: '#1E2630',
    strong: '#2A3441',
  },
  text: {
    primary: '#E8EEF5',
    secondary: '#8B9BB0',
    muted: '#5A6A7D',
  },
  accent: {
    DEFAULT: '#22D3EE', // cyan-400
    hover: '#67E8F9',
    muted: 'rgba(34,211,238,0.12)',
  },
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
}
```

- 圆角：`8` / `12`（卡片）
- 字号：12 / 14 / 16 / 20 / 28
- 字重：400 / 500 / 600
- 间距：4 的倍数
- 阴影：几乎不用；靠 border 分层
- 字体：`Inter, "PingFang SC", "Noto Sans SC", system-ui`

## 4. 布局骨架

```
┌────────┬─────────────────────────────┐
│ 56–220 │  Top bar（面包屑 / 搜索 ⌘K） │
│ 侧栏   ├──────────────┬──────────────┤
│        │ 主内容区      │ 右栏（编辑时）│
│        │              │              │
└────────┴──────────────┴──────────────┘
```

- 侧栏可折叠到 icon-only（56px）
- 编辑器：预览居中固定，右侧配置可滚

## 5. 关键规范

**列表页**

- 表头 sticky；行高 56–64
- 码缩略图 40×40
- 状态：绿点正常 / 灰静态 / 琥珀暂停
- 主按钮仅一个：`+ 新建二维码`（accent 实心）

**编辑器**

- 左：类型 Tab（URL / 文本 / 名片 / 表单）
- 中：实时预览（深色卡片，码可用青模块或经典黑白切换）
- 右：内容 → 样式 → LOGO → 导出
- 底栏或右下：`生成 / 保存` 主按钮

**组件**

- Button：primary（cyan 实心深字）/ ghost / danger
- Input：`bg-raised` + `border-subtle`，focus `border-accent`
- Tag / Chip：选中用 `accent-muted` 底 + accent 边
- Table：无斑马纹，靠分割线
- Empty：一句话 + 主按钮，不要插画堆砌

## 6. 动效（克制）

- 150–200ms ease
- 预览码切换：淡入即可
- 禁止大面积 glow / 粒子

## 7. 技术落地建议

```
src/
  styles/tokens.css      # CSS 变量
  layouts/AppShell.vue
  pages/{Workbench,Codes,Editor,Templates,Analytics}.vue
  components/qr/{Preview,StylePicker,TypeTabs}.vue
  composables/useQr.ts   # qrcode 库生成
```

UnoCSS 示例：

```ts
shortcuts: {
  'page': 'min-h-screen bg-bg-base text-text-primary',
  'card': 'bg-bg-raised border border-border-subtle rounded-xl',
  'btn-primary': 'bg-accent text-bg-base font-medium rounded-lg px-4 py-2 hover:bg-accent-hover',
  'input': 'bg-bg-raised border border-border-subtle rounded-lg px-3 py-2 outline-none focus:border-accent',
}
```

码生成：`qrcode` / `uqr`；样式码后期可接 `qr-code-styling`。

## 8. 与草料的差异（刻意砍）

| 草料           | 墨码 MVP             |
| -------------- | -------------------- |
| 无代码业务系统 | 生码 + 活码 + 轻数据 |
| 大量模板方案   | 少量高质量模板       |
| 亮色政务风     | 深色安静工具         |

## 9. 下一步

1. 脚手架：Vite + Vue3 + TS + UnoCSS + Vue Router + Pinia
2. 先做 AppShell + 列表 + 编辑器三页
3. 再接活码 API / 数据
