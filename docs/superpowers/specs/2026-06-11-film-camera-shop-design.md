# 慢帧时光 Film — 胶片相机销售 H5 网页设计文档

## 概述

纯前端 H5 手机网页，用于展示和销售二手胶片相机。复古胶片视觉风格，移动端优先。

- **站点名称**：慢帧时光 film
- **目标用户**：胶片相机爱好者、潜在买家
- **主要功能**：浏览相机列表 → 查看详情 → 微信联系 / 闲鱼跳转

---

## 文件结构

```
film-camera-shop/
├── index.html           # 首页 - 相机列表
├── detail.html          # 详情页（URL 参数 ?id=xxx 区分机型）
├── css/
│   └── style.css        # 全局样式（移动端优先，含噪点纹理）
├── js/
│   ├── cameras.js       # 📍 相机数据文件（用户主要修改此文件）
│   └── main.js          # 公共逻辑：路由解析、图片轮播、微信复制
├── images/              # 📍 用户放置相机图片
├── videos/              # 📍 用户放置相机视频
└── README.md            # 使用说明
```

---

## 数据模型

`js/cameras.js` — 全局数组 `CAMERAS`，每项结构：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识，用于 URL 参数，如 `contax-t2` |
| name | string | 显示名称 |
| brand | string | 品牌 |
| model | string | 型号 |
| price | number | 价格（元），纯数字 |
| condition | string | 成色标签，如"9成新" |
| images | string[] | 图片路径数组，相对于项目根目录 |
| video | string | 视频文件路径 |
| accessories | string[] | 附件清单 |
| description | string | 详细描述文本 |

`js/main.js` — 全局配置 `SITE_CONFIG`：微信号、闲鱼链接。

---

## 视觉设计

### 配色

| 用途 | 色值 | 说明 |
|------|------|------|
| 页面背景 | #F5F0E8 | 米白/旧纸色 |
| 卡片/次级背景 | #EDE4D6 | 浅黄褐 |
| 标题文字 | #5C3D2E | 深咖色 |
| 正文文字 | #6B5A4E | 中褐色 |
| 价格强调 | #A0523D | 暗红/铁锈红 |
| 成色标签 | #C4A882 | 棕褐色 |
| 按钮主色 | #5C3D2E | 深咖（与标题一致） |
| 点缀线/分隔 | #D4C5B2 | 浅棕 |

### 字体

- 标题/名称：Noto Serif SC（Google Fonts，思源宋体）
- 正文：系统默认（`-apple-system, sans-serif`）

### 做旧质感

- CSS `background-image` 生成颗粒噪点叠层覆盖全页
- 卡片使用多重 `box-shadow` 模拟冲印相纸边缘
- 微圆角 `border-radius: 4px` 配合阴影

### 布局要点

- 最大宽度 480px，居中显示（超小屏撑满）
- 所有触摸目标 ≥ 44px（符合移动端交互标准）
- 首页卡片垂直排列，间距 16px

---

## 页面功能

### 首页 (index.html)

1. **顶部 Logo 区**：网站名"慢帧时光" + 副标题 + 装饰分隔线
2. **相机卡片列表**：从 `CAMERAS` 数组动态渲染
   - 封面图（取 `images[0]`）
   - 名称 + 型号
   - 成色标签（色块）
   - 价格（红色大字）
3. **点击卡片** → 跳转 `detail.html?id={id}`
4. **底部声明**：支持验机 · 不满意可退

### 详情页 (detail.html)

1. **顶部导航**：返回按钮
2. **图片轮播**：
   - 原生 JS 实现，支持手指左右滑动（touchstart/move/end）
   - CSS `transform: translateX()` 驱动位移
   - 底部圆点指示器
   - 自动播放（3秒间隔，手动滑动时暂停）
3. **视频播放区**：HTML5 `<video>` 标签，带 controls
4. **机器信息**：品牌、型号、成色
5. **附件清单**：列表形式
6. **详细描述**：段落文本
7. **价格大字展示**
8. **两个操作按钮**：
   - 「微信咨询」→ 复制微信号到剪贴板 + Toast 提示
   - 「查看样片（闲鱼）」→ 新窗口打开闲鱼链接
9. **底部声明**：支持验机，不满意可退

### 错误处理

- ID 不存在时 → 显示"相机未找到"提示，提供返回首页链接
- 缺少 ID 参数时 → 同上

---

## 技术约束

- 纯 HTML + CSS + 原生 JS，零依赖
- 图片使用 `images/placeholder.jpg` 占位
- 所有浏览器兼容（Chrome、Safari、微信内置浏览器）
- 点击复制功能使用 `navigator.clipboard.writeText()`，失败降级到 `document.execCommand('copy')`

---

## 部署

- 所有文件为静态资源，可直接托管到 GitHub Pages、Vercel、Netlify
- README.md 中包含详细部署步骤

---

## 预填相机数据

| 机型 | 成色 | 价格 | 占位图 |
|------|------|------|--------|
| Contax T2 | 9成新 | ¥3,800 | placeholder |
| Minolta X-700 | 8成新 | ¥680 | placeholder |
| Olympus µ[mju:]-II | 95成新 | ¥1,200 | placeholder |
