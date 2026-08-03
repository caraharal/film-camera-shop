# 慢帧时光 film — 胶片相机集市 V2

胶片相机销售 H5 网页，纯静态，手机端优先，复古胶片视觉风格。

**V2 新增**：📱 手机端管理后台 · 🎯 AI 导购问卷 · 🎬 视频自动转换

---

## 快速开始

### 预览网站

在浏览器打开 `index.html`（推荐用本地服务器）：

```bash
cd film-camera-shop
python3 -m http.server 8000
# 然后打开 http://localhost:8000
```

### 手机端管理后台

1. 手机浏览器打开 `admin.html`
2. 输入 GitHub Token 完成设置
3. 之后就可以在手机上添加/编辑相机、上传图片视频
4. 点击「发布更新」→ 网站自动部署

---

## 文件结构

```
film-camera-shop/
├── index.html              # 首页 — 相机卡片列表 + 导购问卷入口
├── detail.html             # 详情页 — 图片轮播/视频/信息/操作按钮
├── admin.html              # ✨ 管理后台（移动端优先）
├── css/
│   └── style.css           # 全局样式
├── js/
│   ├── cameras.js          # 相机数据（自动生成，勿手动编辑）
│   ├── main.js             # 公共逻辑 + 导购问卷 + 推荐算法
│   └── admin.js            # ✨ 后台逻辑（表单、上传、GitHub API）
├── data/
│   └── cameras.json        # ✨ 相机数据 JSON
├── images/                 # 📍 相机照片放这里
├── videos/                 # 📍 相机视频放这里（.mp4 网页用）
├── tools/
│   └── convert-videos.sh   # 🔧 本地视频批量转 MP4 脚本
├── .github/workflows/
│   └── convert-videos.yml  # ⚙️ 自动转换 MOV → MP4
└── docs/superpowers/specs/ # 设计文档
```

---

## 导购问卷

首页点击「🎯 让相机找到你」横幅进入问卷，6 步选择偏好：

1. 预算范围（¥100-300 / ¥300-600 / ¥600-1000 / ¥1000+）
2. 拍摄类型（街拍/人像/旅行/日常/风景）
3. 便携需求（口袋机/单反/无所谓）
4. 焦段偏好（28mm/35mm/38-40mm/50mm/变焦/帮我选）
5. 胶片经验（新手/玩过一点/老玩家）
6. 品牌偏好（无所谓 / 指定品牌）

根据选择自动匹配推荐你的上架相机，按匹配度排序展示。

---

## 视频转换

### 方式一：本地脚本（一次性批量转换）

```bash
# 先装 ffmpeg（只需要一次）
brew install ffmpeg

# 运行转换脚本
bash tools/convert-videos.sh
```

### 方式二：GitHub Actions 自动转换（推荐）

通过管理后台上传 .MOV 文件后，GitHub Actions 自动将其转为 .mp4。你不需要手动操作。

---

## 部署

### GitHub Pages

1. 在 GitHub 创建仓库 `film-camera-shop`
2. 推送代码到 main 分支
3. Settings → Pages → Source: `main` branch → Save
4. 访问 `https://你的用户名.github.io/film-camera-shop/`

### Vercel

1. 注册 [Vercel](https://vercel.com)，用 GitHub 登录
2. Import 你的 `film-camera-shop` 仓库
3. 自动部署，获得 `xxx.vercel.app` 域名

---

## 管理后台使用

1. **创建 GitHub Token**：GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
   - 选你的 `film-camera-shop` 仓库
   - 权限：Contents (Read & Write)
   - 生成后复制 token

2. **手机打开 admin.html**：输入用户名、仓库名、Token → 保存

3. **管理相机**：添加/编辑/删除，直接拍照上传

4. **发布**：点「发布更新」→ 自动部署

---

## 技术栈

- 纯 HTML + CSS + 原生 JavaScript
- 零外部依赖，零框架
- 移动端优先，响应式设计
- 原生触摸滑动轮播
- GitHub Contents API 读写数据
- GitHub Actions 自动视频转换

---

## 许可证

MIT
