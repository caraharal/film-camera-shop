/**
 * ============================================================
 * 📍 相机数据文件 — V2（带推荐标签）
 *
 * 数据同步自 data/cameras.json
 * 管理后台每次保存时自动更新此文件
 * ============================================================
 *
 * 新增字段说明：
 *   focalLength  — 焦段，如 "35mm"、"28-70mm"
 *   cameraType   — pocket | slr | rangefinder
 *   skillLevel   — beginner | intermediate | advanced
 *   bestFor      — ["street","portrait","travel","daily","landscape"]
 *   filmFormat   — "135" | "120" | "110"
 */

var CAMERAS = [
  {
    "id": "contax-t2",
    "name": "Contax T2",
    "brand": "Contax",
    "model": "T2",
    "price": 3800,
    "condition": "9成新",
    "images": [
      "images/placeholder.svg",
      "images/placeholder.svg",
      "images/placeholder.svg"
    ],
    "video": "",
    "accessories": [
      "原装镜头盖",
      "原装皮套",
      "原装肩带",
      "说明书"
    ],
    "description": "Contax T2 是康泰时于1990年推出的经典高端口袋胶片机，搭载蔡司 Sonnar 38mm f/2.8 镜头，成像锐利色彩浓郁，被誉为"口袋里的徕卡"。全钛金属机身，自动对焦，光圈优先模式，是胶片摄影爱好者的梦中情机。",
    "focalLength": "38mm",
    "cameraType": "pocket",
    "skillLevel": "intermediate",
    "bestFor": ["street", "daily", "travel"],
    "filmFormat": "135"
  },
  {
    "id": "minolta-x700",
    "name": "Minolta X-700",
    "brand": "Minolta",
    "model": "X-700",
    "price": 680,
    "condition": "8成新",
    "images": [
      "images/placeholder.svg",
      "images/placeholder.svg"
    ],
    "video": "",
    "accessories": [
      "MD 50mm f/1.7 镜头",
      "原装机身盖",
      "背带"
    ],
    "description": "美能达 X-700 是美能达最经典的入门级单反相机，发布于1982年。配备 A 档光圈优先和 P 档程序自动曝光，对新手非常友好。机身轻便，MD 卡口镜头群丰富且价格实惠，是入门胶片摄影的性价比之王。",
    "focalLength": "50mm",
    "cameraType": "slr",
    "skillLevel": "beginner",
    "bestFor": ["portrait", "daily", "travel"],
    "filmFormat": "135"
  },
  {
    "id": "olympus-mju-ii",
    "name": "Olympus µ[mju:]-II",
    "brand": "Olympus",
    "model": "µ[mju:]-II",
    "price": 1200,
    "condition": "95成新",
    "images": [
      "images/placeholder.svg",
      "images/placeholder.svg",
      "images/placeholder.svg"
    ],
    "video": "",
    "accessories": [
      "原装镜头盖",
      "手绳",
      "原装包装盒"
    ],
    "description": "奥林巴斯 µ-II 是经典的口袋胶片机，发布于1997年。搭载 35mm f/2.8 镜头，成像优秀，机身小巧到可以塞进口袋。生活防水设计，滑盖开机即拍，是街头摄影和日常记录的完美搭档。",
    "focalLength": "35mm",
    "cameraType": "pocket",
    "skillLevel": "beginner",
    "bestFor": ["street", "daily", "travel"],
    "filmFormat": "135"
  }
];

/**
 * 📋 添加新相机的模板（复制下面的代码块）
 *
 * {
 *   "id": "新相机的英文ID",
 *   "name": "相机名称",
 *   "brand": "品牌",
 *   "model": "型号",
 *   "price": 价格数字,
 *   "condition": "成色",
 *   "images": ["images/照片1.jpg", "images/照片2.jpg"],
 *   "video": "videos/视频.mp4",
 *   "accessories": ["附件1", "附件2"],
 *   "description": "描述文字...",
 *   "focalLength": "35mm",
 *   "cameraType": "pocket",
 *   "skillLevel": "beginner",
 *   "bestFor": ["street", "daily"],
 *   "filmFormat": "135"
 * }
 */
