/**
 * ============================================================
 * 慢帧时光 film — 管理后台逻辑 V2
 * 手机端优先 · GitHub API 读写 · 图片视频上传
 * ============================================================
 */

/* ================================================================
   全局状态
   ================================================================ */

var ADMIN = {
  token: '',
  repoOwner: '',
  repoName: '',
  branch: 'main',
  cameras: [],
  isSetup: false
};

// localStorage keys
var LS_TOKEN = 'film_camera_shop_token';
var LS_OWNER = 'film_camera_shop_owner';
var LS_REPO  = 'film_camera_shop_repo';

// 预配置（用户名和仓库已填好，只需输入 Token）
var DEFAULT_CONFIG = {
  owner: 'caraharal',
  repo: 'film-camera-shop'
};

/* ================================================================
   工具函数
   ================================================================ */

function showToast(message, duration) {
  duration = duration || 2000;
  var toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(function () {
    toast.classList.remove('show');
  }, duration);
}

/* ================================================================
   初始化
   ================================================================ */

(function initAdmin() {
  // 从 localStorage 加载，回退到默认值
  ADMIN.token = localStorage.getItem(LS_TOKEN) || '';
  ADMIN.repoOwner = localStorage.getItem(LS_OWNER) || DEFAULT_CONFIG.owner;
  ADMIN.repoName = localStorage.getItem(LS_REPO) || DEFAULT_CONFIG.repo;

  if (ADMIN.token) {
    // Token 已配置，显示加载中，然后尝试从 GitHub 加载
    ADMIN.isSetup = true;
    document.getElementById('admin-actions').style.display = 'flex';
    var main = document.getElementById('admin-main');
    main.innerHTML = '<div class="empty-state" style="padding:60px 0">⏳ 加载中...</div>';
    loadCamerasFromGitHub();
  } else {
    // 未配置 token，显示设置表单
    renderSetup();
  }
})();

/** 清除设置，回到初始状态 */
function resetSettings() {
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_OWNER);
  localStorage.removeItem(LS_REPO);
  ADMIN.token = '';
  ADMIN.isSetup = false;
  document.getElementById('admin-actions').style.display = 'none';
  renderSetup();
  showToast('🔄 已重置，请重新输入 Token');
}

/* ================================================================
   页面渲染
   ================================================================ */

/** 首次设置页面 */
function renderSetup() {
  var main = document.getElementById('admin-main');
  main.innerHTML =
    '<div class="admin-setup">' +
      '<h2>🔧 首次设置</h2>' +
      '<p>需要 GitHub Personal Access Token 来保存数据。<br>只给这个仓库的读写权限即可。</p>' +
      '<label>GitHub 用户名</label>' +
      '<input type="text" id="setup-owner" placeholder="你的 GitHub 用户名" value="' + ADMIN.repoOwner + '">' +
      '<label>仓库名</label>' +
      '<input type="text" id="setup-repo" placeholder="仓库名" value="' + ADMIN.repoName + '">' +
      '<label>Personal Access Token</label>' +
      '<textarea id="setup-token" placeholder="ghp_xxxxxxxxxxxx" rows="3"></textarea>' +
      '<p style="font-size:0.8rem;color:var(--accent-tag);margin-top:-8px;margin-bottom:16px">' +
        '在 <a href="https://github.com/settings/tokens" target="_blank" style="color:var(--accent-price)">GitHub Settings → Tokens</a> 创建，勾选 repo 权限' +
      '</p>' +
      '<button class="btn-save-token" onclick="saveSetup()">💾 保存设置</button>' +
    '</div>';
}

function saveSetup() {
  var owner = document.getElementById('setup-owner').value.trim();
  var repo = document.getElementById('setup-repo').value.trim();
  var token = document.getElementById('setup-token').value.trim();

  if (!owner || !repo || !token) {
    showToast('请填写所有字段', 2000);
    return;
  }

  ADMIN.repoOwner = owner;
  ADMIN.repoName = repo;
  ADMIN.token = token;
  ADMIN.isSetup = true;

  localStorage.setItem(LS_TOKEN, token);
  localStorage.setItem(LS_OWNER, owner);
  localStorage.setItem(LS_REPO, repo);

  document.getElementById('admin-actions').style.display = 'flex';
  showToast('✅ 设置已保存');
  loadCamerasFromGitHub();
}

/** 相机列表 */
function renderCameraList() {
  var main = document.getElementById('admin-main');
  var cameras = ADMIN.cameras;

  var listHtml = '';
  for (var i = 0; i < cameras.length; i++) {
    var cam = cameras[i];
    var cover = (cam.images && cam.images.length > 0) ? cam.images[0] : '';
    var coverStyle = cover ? 'background-image:url(' + cover + ')' : '';
    var hasVideo = cam.video ? ' · 🎬' : '';
    var imgCount = (cam.images && cam.images.length) ? cam.images.length + '张图' : '无图';
    listHtml +=
      '<div class="admin-camera-item" onclick="editCamera(' + i + ')">' +
        '<div class="admin-image-thumb" style="' + coverStyle + ';flex-shrink:0;margin-right:12px">' + (cover ? '' : '📷') + '</div>' +
        '<div class="admin-camera-info">' +
          '<div class="name">' + cam.name + '</div>' +
          '<div class="meta">¥' + cam.price.toLocaleString() + ' · ' + cam.condition + ' · ' + imgCount + hasVideo + '</div>' +
        '</div>' +
        '<div class="admin-camera-actions" onclick="event.stopPropagation()">' +
          '<button class="btn-admin-sm btn-admin-edit" onclick="editCamera(' + i + ')">✎</button>' +
          '<button class="btn-admin-sm btn-admin-delete" onclick="deleteCamera(' + i + ')">✕</button>' +
        '</div>' +
      '</div>';
  }

  main.innerHTML =
    '<div class="admin-camera-list">' +
      '<button class="admin-add-btn" onclick="addCamera()">＋ 添加新相机</button>' +
      listHtml +
      (cameras.length === 0 ? '<p style="text-align:center;color:var(--accent-tag);padding:24px">还没有相机，点击上方按钮添加</p>' : '') +
    '</div>';

  // 绑定发布按钮
  var publishBtn = document.getElementById('btn-publish');
  if (publishBtn) {
    publishBtn.onclick = publishAll;
  }
}

/** 编辑表单弹窗 */
function renderFormOverlay(cam, index) {
  var isNew = index === null;
  cam = cam || {
    id: '', name: '', brand: '', model: '', price: '', condition: '9成新',
    images: [], video: '', accessories: [], description: '',
    focalLength: '35mm', cameraType: 'pocket', skillLevel: 'beginner',
    bestFor: [], filmFormat: '135'
  };

  // 辅助函数
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  var bestForLabels = ['street:街头摄影', 'portrait:人像', 'travel:旅行记录', 'daily:日常随拍', 'landscape:风景'];
  var bestForChecks = '';
  for (var b = 0; b < bestForLabels.length; b++) {
    var parts = bestForLabels[b].split(':');
    var checked = cam.bestFor && cam.bestFor.indexOf(parts[0]) !== -1 ? ' checked' : '';
    bestForChecks += '<label><input type="checkbox" value="' + parts[0] + '"' + checked + '>' + parts[1] + '</label>';
  }

  // 图片预览
  var imagesPreviewHtml = '';
  var imgCount = (cam.images && cam.images.length) || 0;
  if (imgCount > 0) {
    for (var i = 0; i < imgCount; i++) {
      var upBtn = i > 0 ? '<button class="img-order-btn img-order-up" onclick="event.stopPropagation();moveFormImage(' + i + ', -1)">▲</button>' : '';
      var downBtn = i < imgCount - 1 ? '<button class="img-order-btn img-order-down" onclick="event.stopPropagation();moveFormImage(' + i + ', 1)">▼</button>' : '';
      imagesPreviewHtml +=
        '<div class="admin-image-thumb" style="background-image:url(' + cam.images[i] + ')" data-img-index="' + i + '">' +
          '<button class="remove-img" onclick="event.stopPropagation();removeFormImage(' + i + ')">✕</button>' +
          upBtn + downBtn +
        '</div>';
    }
  }

  // 视频
  var videoHtml = cam.video
    ? '<div class="admin-video-current">📹 ' + cam.video.split('/').pop() + '<button class="remove-video" onclick="removeFormVideo()">✕</button></div>'
    : '';

  var overlay = document.createElement('div');
  overlay.id = 'admin-form-overlay';
  overlay.className = 'admin-form-overlay';
  overlay.innerHTML =
    '<div class="admin-form-card">' +
      '<div class="admin-form-header">' +
        '<h3>' + (isNew ? '添加新相机' : '编辑：' + esc(cam.name)) + '</h3>' +
        '<button class="quiz-close" onclick="closeForm()">✕</button>' +
      '</div>' +
      '<div class="admin-form-body" id="form-body">' +
        '<label>名称</label>' +
        '<input type="text" id="f-name" value="' + esc(cam.name) + '" placeholder="相机名称">' +
        '<div style="display:flex;gap:8px">' +
          '<div style="flex:1"><label>品牌</label><input type="text" id="f-brand" value="' + esc(cam.brand) + '" placeholder="如 Contax"></div>' +
          '<div style="flex:1"><label>型号</label><input type="text" id="f-model" value="' + esc(cam.model) + '" placeholder="如 T2"></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px">' +
          '<div style="flex:1"><label>价格（元）</label><input type="number" id="f-price" value="' + cam.price + '" placeholder="3800" inputmode="numeric"></div>' +
          '<div style="flex:1"><label>成色</label><select id="f-condition">' +
            '<option value="全新"' + (cam.condition === '全新' ? ' selected' : '') + '>全新</option>' +
            '<option value="98成新"' + (cam.condition === '98成新' ? ' selected' : '') + '>98成新</option>' +
            '<option value="95成新"' + (cam.condition === '95成新' ? ' selected' : '') + '>95成新</option>' +
            '<option value="9成新"' + (cam.condition === '9成新' ? ' selected' : '') + '>9成新</option>' +
            '<option value="85成新"' + (cam.condition === '85成新' ? ' selected' : '') + '>85成新</option>' +
            '<option value="8成新"' + (cam.condition === '8成新' ? ' selected' : '') + '>8成新</option>' +
          '</select></div>' +
        '</div>' +

        '<label>📷 图片</label>' +
        '<div class="admin-images-preview" id="form-images-preview">' + imagesPreviewHtml + '</div>' +
        '<input type="file" id="form-image-input" accept="image/*" capture="environment" multiple style="padding:10px;font-size:0.9rem">' +

        '<label>🎬 视频</label>' +
        '<div id="form-video-area">' + videoHtml + '</div>' +
        '<input type="file" id="form-video-input" accept="video/*" capture="environment" style="padding:10px;font-size:0.9rem">' +

        '<label>焦段</label>' +
        '<select id="f-focalLength">' +
          '<option value="28mm"' + (cam.focalLength === '28mm' ? ' selected' : '') + '>28mm（广角）</option>' +
          '<option value="35mm"' + (cam.focalLength === '35mm' ? ' selected' : '') + '>35mm（经典街拍）</option>' +
          '<option value="38mm"' + (cam.focalLength === '38mm' ? ' selected' : '') + '>38mm</option>' +
          '<option value="40mm"' + (cam.focalLength === '40mm' ? ' selected' : '') + '>40mm</option>' +
          '<option value="50mm"' + (cam.focalLength === '50mm' ? ' selected' : '') + '>50mm（标准）</option>' +
          '<option value="28-70mm"' + (cam.focalLength === '28-70mm' ? ' selected' : '') + '>28-70mm（变焦）</option>' +
          '<option value="35-70mm"' + (cam.focalLength === '35-70mm' ? ' selected' : '') + '>35-70mm（变焦）</option>' +
          '<option value="其他"' + (cam.focalLength === '其他' ? ' selected' : '') + '>其他</option>' +
        '</select>' +

        '<label>机型</label>' +
        '<select id="f-cameraType">' +
          '<option value="pocket"' + (cam.cameraType === 'pocket' ? ' selected' : '') + '>口袋机</option>' +
          '<option value="slr"' + (cam.cameraType === 'slr' ? ' selected' : '') + '>单反</option>' +
          '<option value="rangefinder"' + (cam.cameraType === 'rangefinder' ? ' selected' : '') + '>旁轴</option>' +
        '</select>' +

        '<label>操作难度</label>' +
        '<select id="f-skillLevel">' +
          '<option value="beginner"' + (cam.skillLevel === 'beginner' ? ' selected' : '') + '>新手友好</option>' +
          '<option value="intermediate"' + (cam.skillLevel === 'intermediate' ? ' selected' : '') + '>有一定难度</option>' +
          '<option value="advanced"' + (cam.skillLevel === 'advanced' ? ' selected' : '') + '>需要经验</option>' +
        '</select>' +

        '<label>适合拍摄</label>' +
        '<div class="admin-checkbox-group" id="f-bestFor">' + bestForChecks + '</div>' +

        '<label>底片格式</label>' +
        '<select id="f-filmFormat">' +
          '<option value="135"' + (cam.filmFormat === '135' ? ' selected' : '') + '>135</option>' +
          '<option value="120"' + (cam.filmFormat === '120' ? ' selected' : '') + '>120</option>' +
          '<option value="110"' + (cam.filmFormat === '110' ? ' selected' : '') + '>110</option>' +
        '</select>' +

        '<label>附件（逗号分隔）</label>' +
        '<input type="text" id="f-accessories" value="' + esc((cam.accessories || []).join(', ')) + '" placeholder="镜头盖, 皮套, 肩带">' +

        '<label>机器描述</label>' +
        '<textarea id="f-description" rows="4" placeholder="写一段相机描述...">' + esc(cam.description || '') + '</textarea>' +
      '</div>' +
      '<div class="admin-form-footer">' +
        (isNew ? '' : '<button class="btn btn-admin-delete-big" onclick="deleteCamera(' + index + ')">🗑 删除</button>') +
        '<button class="btn btn-wechat" onclick="' + (isNew ? 'saveNewCamera()' : 'saveEditCamera(' + index + ')') + '">💾 保存并发布</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);

  // 存储正在编辑的图片和视频 base64 数据
  overlay._pendingImages = (cam.images || []).slice();
  overlay._pendingVideoPath = cam.video || '';
  overlay._pendingVideoFile = null;

  // 图片上传监听
  document.getElementById('form-image-input').addEventListener('change', function (e) {
    handleImageSelect(e.target.files, overlay);
  });

  // 视频上传监听
  document.getElementById('form-video-input').addEventListener('change', function (e) {
    handleVideoSelect(e.target.files, overlay);
  });

  // 点击遮罩关闭
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeForm();
  });
}

/* ================================================================
   表单操作
   ================================================================ */

function addCamera() {
  renderFormOverlay(null, null);
}

function editCamera(index) {
  renderFormOverlay(ADMIN.cameras[index], index);
}

function closeForm() {
  var overlay = document.getElementById('admin-form-overlay');
  if (overlay) overlay.remove();
}

function removeFormImage(imgIndex) {
  var overlay = document.getElementById('admin-form-overlay');
  if (overlay && overlay._pendingImages) {
    overlay._pendingImages.splice(imgIndex, 1);
    refreshImagePreview(overlay);
  }
}

function moveFormImage(fromIndex, direction) {
  var overlay = document.getElementById('admin-form-overlay');
  if (!overlay || !overlay._pendingImages) return;
  var imgs = overlay._pendingImages;
  var toIndex = fromIndex + direction;
  if (toIndex < 0 || toIndex >= imgs.length) return;
  // 交换
  var tmp = imgs[fromIndex];
  imgs[fromIndex] = imgs[toIndex];
  imgs[toIndex] = tmp;
  refreshImagePreview(overlay);
}

function removeFormVideo() {
  var overlay = document.getElementById('admin-form-overlay');
  if (overlay) {
    overlay._pendingVideoPath = '';
    overlay._pendingVideoFile = null;
    var videoArea = document.getElementById('form-video-area');
    if (videoArea) videoArea.innerHTML = '';
  }
}

function handleImageSelect(files, overlay) {
  if (!files || files.length === 0) return;

  var loaded = 0;
  for (var i = 0; i < files.length; i++) {
    (function (file) {
      var reader = new FileReader();
      reader.onload = function (e) {
        overlay._pendingImages.push(e.target.result);
        loaded++;
        if (loaded === files.length) refreshImagePreview(overlay);
      };
      reader.readAsDataURL(file);
    })(files[i]);
  }
}

function handleVideoSelect(files, overlay) {
  if (!files || files.length === 0) return;
  var file = files[0];
  overlay._pendingVideoFile = file;
  overlay._pendingVideoPath = 'videos/' + file.name;
  var videoArea = document.getElementById('form-video-area');
  if (videoArea) {
    videoArea.innerHTML =
      '<div class="admin-video-current">📹 ' + file.name + ' (' + formatFileSize(file.size) + ')' +
        '<button class="remove-video" onclick="removeFormVideo()">✕</button></div>';
  }
}

function refreshImagePreview(overlay) {
  var container = document.getElementById('form-images-preview');
  if (!container) return;

  var len = overlay._pendingImages.length;
  var html = '';
  for (var i = 0; i < len; i++) {
    var src = overlay._pendingImages[i];
    var upBtn = i > 0 ? '<button class="img-order-btn img-order-up" onclick="event.stopPropagation();moveFormImage(' + i + ', -1)">▲</button>' : '';
    var downBtn = i < len - 1 ? '<button class="img-order-btn img-order-down" onclick="event.stopPropagation();moveFormImage(' + i + ', 1)">▼</button>' : '';
    html +=
      '<div class="admin-image-thumb" style="background-image:url(' + src + ')" data-img-index="' + i + '">' +
        '<button class="remove-img" onclick="event.stopPropagation();removeFormImage(' + i + ')">✕</button>' +
        upBtn + downBtn +
      '</div>';
  }
  html +=
    '<label class="admin-image-add" for="form-image-input">＋</label>';
  container.innerHTML = html;

  // 重新绑定图片 input（因为 label for 需要）
  var input = document.getElementById('form-image-input');
  if (input) {
    input.value = '';
    input.addEventListener('change', function handler(e) {
      handleImageSelect(e.target.files, overlay);
    }, { once: true });
  }
}

/* ================================================================
   保存逻辑
   ================================================================ */

function collectFormData() {
  var bestForChecks = document.querySelectorAll('#f-bestFor input[type="checkbox"]:checked');
  var bestFor = [];
  for (var i = 0; i < bestForChecks.length; i++) {
    bestFor.push(bestForChecks[i].value);
  }

  var accessoriesRaw = document.getElementById('f-accessories').value;
  var accessories = accessoriesRaw
    ? accessoriesRaw.split(',').map(function(s) { return s.trim(); }).filter(Boolean)
    : [];

  return {
    id: document.getElementById('f-name').value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9一-鿿-]/g, ''),
    name: document.getElementById('f-name').value.trim(),
    brand: document.getElementById('f-brand').value.trim(),
    model: document.getElementById('f-model').value.trim(),
    price: parseInt(document.getElementById('f-price').value, 10) || 0,
    condition: document.getElementById('f-condition').value,
    images: [], // 会在 save 时填充
    video: '',  // 会在 save 时填充
    accessories: accessories,
    description: document.getElementById('f-description').value.trim(),
    focalLength: document.getElementById('f-focalLength').value,
    cameraType: document.getElementById('f-cameraType').value,
    skillLevel: document.getElementById('f-skillLevel').value,
    bestFor: bestFor,
    filmFormat: document.getElementById('f-filmFormat').value
  };
}

function saveNewCamera() {
  var overlay = document.getElementById('admin-form-overlay');
  var cam = collectFormData();
  cam.id = cam.id || ('camera-' + Date.now());

  showSaving();
  uploadFormAssets(cam, overlay, function (savedCam) {
    ADMIN.cameras.push(savedCam);
    closeForm();
    renderCameraList();
    showToast('✅ 已添加，正在发布...');
    hideSaving();
    publishAll();
  });
}

function saveEditCamera(index) {
  var overlay = document.getElementById('admin-form-overlay');
  var cam = collectFormData();
  cam.id = ADMIN.cameras[index].id;

  showSaving();
  uploadFormAssets(cam, overlay, function (savedCam) {
    ADMIN.cameras[index] = savedCam;
    closeForm();
    renderCameraList();
    showToast('✅ 已更新，正在发布...');
    hideSaving();
    publishAll();
  });
}

function deleteCamera(index) {
  if (!confirm('确定删除「' + ADMIN.cameras[index].name + '」？')) return;
  ADMIN.cameras.splice(index, 1);
  closeForm();
  renderCameraList();
  showToast('🗑 已删除，正在发布...');
  publishAll();
}

/* ================================================================
   上传资源（图片 + 视频 -> GitHub）
   ================================================================ */

function uploadFormAssets(cam, overlay, callback) {
  var pendingImages = overlay._pendingImages || [];
  var pendingVideoPath = overlay._pendingVideoPath || '';
  var pendingVideoFile = overlay._pendingVideoFile || null;

  var imagePaths = [];
  var uploadsRemaining = 0;
  var hasStarted = false;

  function tryFinish() {
    if (hasStarted && uploadsRemaining === 0) {
      cam.images = imagePaths;
      cam.video = pendingVideoPath;
      callback(cam);
    }
  }

  // 处理图片：区分已有路径（字符串）和新上传（base64）
  uploadsRemaining = pendingImages.length + (pendingVideoFile ? 1 : 0);
  hasStarted = true;

  if (uploadsRemaining === 0) {
    cam.images = imagePaths;
    cam.video = pendingVideoPath;
    callback(cam);
    return;
  }

  // 上传图片
  for (var i = 0; i < pendingImages.length; i++) {
    (function (imgData, idx) {
      if (imgData.indexOf('data:') === 0) {
        // 新上传的 base64 图片
        var ext = imgData.indexOf('image/png') !== -1 ? '.png' : '.jpg';
        var filename = 'images/' + cam.id + '-' + Date.now() + '-' + idx + ext;
        var base64Content = imgData.split(',')[1];
        uploadToGitHub(filename, base64Content, '添加图片: ' + filename, function () {
          imagePaths[idx] = filename;
          uploadsRemaining--;
          tryFinish();
        }, function () {
          // 上传失败，保留 base64 作为临时显示
          imagePaths[idx] = imgData;
          uploadsRemaining--;
          tryFinish();
        });
      } else {
        // 已有路径
        imagePaths[idx] = imgData;
        uploadsRemaining--;
        tryFinish();
      }
    })(pendingImages[i], i);
  }

  // 上传视频
  if (pendingVideoFile) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var base64Content = e.target.result.split(',')[1];
      var filename = 'videos/' + pendingVideoFile.name;
      uploadToGitHub(filename, base64Content, '上传视频: ' + filename, function () {
        uploadsRemaining--;
        tryFinish();
      }, function () {
        showToast('⚠ 视频上传失败（可能超过大小限制）');
        uploadsRemaining--;
        tryFinish();
      });
    };
    reader.readAsDataURL(pendingVideoFile);
  }
}

/* ================================================================
   GitHub API
   ================================================================ */

function githubApiBase() {
  return 'https://api.github.com/repos/' + ADMIN.repoOwner + '/' + ADMIN.repoName;
}

function githubHeaders() {
  return {
    'Authorization': 'token ' + ADMIN.token,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };
}

/** 从 GitHub 加载 cameras.json */
function loadCamerasFromGitHub() {
  if (!ADMIN.isSetup) {
    // 降级到本地数据
    ADMIN.cameras = (typeof CAMERAS !== 'undefined' && CAMERAS) ? JSON.parse(JSON.stringify(CAMERAS)) : [];
    renderCameraList();
    return;
  }

  var xhr = new XMLHttpRequest();
  xhr.open('GET', githubApiBase() + '/contents/data/cameras.json?ref=' + ADMIN.branch);
  xhr.setRequestHeader('Authorization', 'token ' + ADMIN.token);
  xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');

  xhr.onload = function () {
      if (xhr.status === 200) {
        var resp = JSON.parse(xhr.responseText);
        var content = atob(resp.content);
        try {
          ADMIN.cameras = JSON.parse(decodeURIComponent(escape(content)));
        } catch (e) {
          ADMIN.cameras = JSON.parse(content);
        }
        renderCameraList();
      } else if (xhr.status === 401 || xhr.status === 403) {
        showToast('⚠ Token 已失效，请重新设置');
        resetSettings();
      } else {
        ADMIN.cameras = (typeof CAMERAS !== 'undefined' && CAMERAS) ? JSON.parse(JSON.stringify(CAMERAS)) : [];
        renderCameraList();
      }
    };
  xhr.onerror = function () {
    ADMIN.cameras = (typeof CAMERAS !== 'undefined' && CAMERAS) ? JSON.parse(JSON.stringify(CAMERAS)) : [];
    renderCameraList();
    showToast('⚠ 无法连接 GitHub，使用本地数据');
  };

  xhr.timeout = 15000;
  xhr.ontimeout = function () {
    ADMIN.cameras = (typeof CAMERAS !== 'undefined' && CAMERAS) ? JSON.parse(JSON.stringify(CAMERAS)) : [];
    renderCameraList();
    showToast('⚠ 连接超时，使用本地数据');
  };

  xhr.send();
}

/** 上传文件到 GitHub */
function uploadToGitHub(path, base64Content, commitMsg, onSuccess, onError) {
  // 先检查文件是否已存在（获取 sha）
  var checkXhr = new XMLHttpRequest();
  checkXhr.open('GET', githubApiBase() + '/contents/' + path + '?ref=' + ADMIN.branch);
  checkXhr.setRequestHeader('Authorization', 'token ' + ADMIN.token);
  checkXhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
  checkXhr.timeout = 15000;

  function doUpload(sha) {
    var body = JSON.stringify({
      message: commitMsg,
      content: base64Content,
      branch: ADMIN.branch,
      sha: sha
    });

    var putXhr = new XMLHttpRequest();
    putXhr.open('PUT', githubApiBase() + '/contents/' + path);
    putXhr.setRequestHeader('Authorization', 'token ' + ADMIN.token);
    putXhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    putXhr.setRequestHeader('Content-Type', 'application/json');
    putXhr.timeout = 30000;

    putXhr.onload = function () {
      if (putXhr.status === 201 || putXhr.status === 200) {
        if (onSuccess) onSuccess();
      } else {
        console.error('GitHub upload failed:', putXhr.status);
        if (onError) onError();
      }
    };
    putXhr.onerror = function () { if (onError) onError(); };
    putXhr.ontimeout = function () { if (onError) onError(); };
    putXhr.send(body);
  }

  checkXhr.onload = function () {
    var sha = null;
    if (checkXhr.status === 200) {
      sha = JSON.parse(checkXhr.responseText).sha;
    }
    doUpload(sha);
  };

  checkXhr.onerror = function () { doUpload(null); };
  checkXhr.ontimeout = function () { doUpload(null); };
  checkXhr.send();
}

/** 生成 cameras.js 内容 */
function generateCamerasJs() {
  return '/**\n' +
    ' * ============================================================\n' +
    ' * 📍 相机数据文件 — 由管理后台自动生成\n' +
    ' * 请勿手动编辑此文件\n' +
    ' * ============================================================\n' +
    ' */\n\n' +
    'var CAMERAS = ' + JSON.stringify(ADMIN.cameras, null, 2) + ';\n';
}

/** 发布：提交 cameras.json + cameras.js 到 GitHub */
function publishAll() {
  if (!ADMIN.isSetup) {
    showToast('⚠ 请先完成 GitHub 设置');
    return;
  }

  showSaving();

  var jsonContent = btoa(unescape(encodeURIComponent(JSON.stringify(ADMIN.cameras, null, 2))));
  var jsContent = btoa(unescape(encodeURIComponent(generateCamerasJs())));

  var filesToPublish = [
    { path: 'data/cameras.json', content: jsonContent, msg: '更新相机数据' },
    { path: 'js/cameras.js', content: jsContent, msg: '同步 cameras.js' }
  ];

  var completed = 0;
  var hasError = false;

  function checkDone() {
    completed++;
    if (completed === filesToPublish.length) {
      hideSaving();
      if (hasError) {
        showToast('⚠ 发布部分失败，请检查网络后重试');
      } else {
        showPublishSuccess();
      }
    }
  }

  for (var i = 0; i < filesToPublish.length; i++) {
    (function (file) {
      uploadToGitHub(file.path, file.content, file.msg,
        function () { checkDone(); },
        function () { hasError = true; checkDone(); }
      );
    })(filesToPublish[i]);
  }
}

/** 发布成功提示 */
function showPublishSuccess() {
  var main = document.getElementById('admin-main');
  main.innerHTML =
    '<div class="admin-publish-success">' +
      '<div class="icon">🚀</div>' +
      '<h2>发布成功！</h2>' +
      '<p>GitHub Actions 正在自动处理...<br>1-2 分钟后网站将自动更新。</p>' +
      '<p style="font-size:0.85rem;color:var(--accent-tag)">' +
        'GitHub Pages: <a href="https://' + ADMIN.repoOwner + '.github.io/' + ADMIN.repoName + '/" target="_blank" style="color:var(--accent-price)">' +
        ADMIN.repoOwner + '.github.io/' + ADMIN.repoName + '/</a>' +
      '</p>' +
      '<button class="btn btn-wechat" style="margin-top:16px" onclick="loadCamerasFromGitHub()">← 返回管理</button>' +
      '<a class="btn btn-xianyu" style="display:block;margin-top:8px" href="index.html" target="_blank">预览网站 →</a>' +
    '</div>';
}

/* ================================================================
   UI 辅助
   ================================================================ */

function showSaving() {
  var existing = document.getElementById('admin-saving');
  if (existing) existing.remove();
  var div = document.createElement('div');
  div.id = 'admin-saving';
  div.className = 'admin-saving';
  div.innerHTML = '<div class="admin-saving-inner"><div class="admin-saving-spinner"></div><div>保存中...</div></div>';
  document.body.appendChild(div);
}

function hideSaving() {
  var div = document.getElementById('admin-saving');
  if (div) div.remove();
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
