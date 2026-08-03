/**
 * ============================================================
 * 慢帧时光 film — 公共逻辑 V2
 * 首页渲染 / 详情页 / 图片轮播 / 微信复制 / 导购问卷 / 推荐
 * ============================================================
 *
 * 数据来源：js/cameras.js（全局变量 CAMERAS）
 * 管理后台更新时同步修改 cameras.js
 */

/* ================================================================
   全局配置 — 在这里修改
   ================================================================ */

var SITE_CONFIG = {
  wechatId: 'caraharal0213',
  xianyuLink: 'https://m.tb.cn/h.R9xYB8c?tk=kRw7gdBVeTV',
  siteName: '慢帧时光',
  siteSubtitle: 'film camera market',
  // 问卷是否启用
  quizEnabled: true
};

/* ================================================================
   工具函数
   ================================================================ */

function getUrlParam(name) {
  var params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise(function (resolve, reject) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      resolve();
    } catch (err) {
      reject(err);
    }
    document.body.removeChild(textarea);
  });
}

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

function getCameraById(id) {
  for (var i = 0; i < CAMERAS.length; i++) {
    if (CAMERAS[i].id === id) return CAMERAS[i];
  }
  return null;
}

/* ================================================================
   首页逻辑
   ================================================================ */

function renderCameraList() {
  var container = document.getElementById('camera-list');
  if (!container) return;

  if (!CAMERAS || CAMERAS.length === 0) {
    container.innerHTML = '<div class="empty-state">📷<br>暂无在售相机，请稍后再来</div>';
    return;
  }

  var html = '';
  for (var i = 0; i < CAMERAS.length; i++) {
    html += buildCameraCard(CAMERAS[i]);
  }
  container.innerHTML = html;

  var logo = document.getElementById('site-logo');
  if (logo) logo.textContent = SITE_CONFIG.siteName;
  var subtitle = document.getElementById('site-subtitle');
  if (subtitle) subtitle.textContent = SITE_CONFIG.siteSubtitle;
}

function buildCameraCard(cam) {
  var cover = (cam.images && cam.images.length > 0) ? cam.images[0] : 'images/placeholder.svg';
  return (
    '<a class="camera-card" href="detail.html?id=' + encodeURIComponent(cam.id) + '">' +
      '<div class="card-image-wrap">' +
        '<img src="' + cover + '" alt="' + cam.name + '" loading="lazy" ' +
          'onerror="this.src=\'images/placeholder.svg\'">' +
      '</div>' +
      '<div class="card-body">' +
        '<h2 class="card-name">' + cam.name + '</h2>' +
        '<div class="card-model">' + cam.brand + ' ' + cam.model + '</div>' +
        '<div class="card-footer">' +
          '<span class="condition-badge">' + cam.condition + '</span>' +
          '<span class="card-price">' +
            '<span class="price-unit">¥</span>' + cam.price.toLocaleString() +
          '</span>' +
        '</div>' +
      '</div>' +
    '</a>'
  );
}

/* ================================================================
   详情页逻辑
   ================================================================ */

function renderDetail() {
  var cameraId = getUrlParam('id');
  if (!cameraId) { showErrorState('缺少相机 ID 参数'); return; }
  var cam = getCameraById(cameraId);
  if (!cam) { showErrorState('未找到相机：' + cameraId); return; }

  document.title = cam.name + ' - ' + SITE_CONFIG.siteName;
  renderCarousel(cam);
  renderVideo(cam);
  renderInfo(cam);
  renderAccessories(cam);
  renderDescription(cam);
  renderPrice(cam);
  bindActions(cam);
}

function showErrorState(message) {
  var main = document.querySelector('main') || document.body;
  main.innerHTML =
    '<div class="error-state">' +
      '<div class="error-icon">📷</div>' +
      '<h2>相机未找到</h2>' +
      '<p>' + message + '</p>' +
      '<a class="btn btn-wechat" href="index.html" style="display:inline-block;width:auto;padding:12px 32px;">← 返回首页</a>' +
    '</div>';
}

/* ---- 图片轮播 ---- */

function renderCarousel(cam) {
  var container = document.getElementById('carousel');
  if (!container) return;
  var images = (cam.images && cam.images.length > 0) ? cam.images : ['images/placeholder.svg'];

  var slidesHtml = '', dotsHtml = '';
  for (var i = 0; i < images.length; i++) {
    slidesHtml +=
      '<div class="carousel-slide">' +
        '<img src="' + images[i] + '" alt="' + cam.name + ' - ' + (i + 1) + '" ' +
          'onerror="this.src=\'images/placeholder.svg\'">' +
      '</div>';
    dotsHtml += '<span class="carousel-dot' + (i === 0 ? ' active' : '') + '" data-index="' + i + '"></span>';
  }

  container.innerHTML =
    '<div class="carousel-track">' + slidesHtml + '</div>' +
    '<div class="carousel-dots">' + dotsHtml + '</div>' +
    '<button class="carousel-arrow prev" aria-label="上一张">‹</button>' +
    '<button class="carousel-arrow next" aria-label="下一张">›</button>';

  initCarouselInteraction(container, images.length);
}

function initCarouselInteraction(carousel, totalSlides) {
  if (totalSlides <= 1) {
    var dots = carousel.querySelector('.carousel-dots');
    if (dots) dots.style.display = 'none';
    return;
  }

  var track = carousel.querySelector('.carousel-track');
  var dotEls = carousel.querySelectorAll('.carousel-dot');
  var prevBtn = carousel.querySelector('.carousel-arrow.prev');
  var nextBtn = carousel.querySelector('.carousel-arrow.next');
  var currentIndex = 0, startX = 0, moveX = 0, isDragging = false, autoplayTimer = null;

  function goToSlide(index, animate) {
    if (index < 0) index = 0;
    if (index >= totalSlides) index = totalSlides - 1;
    currentIndex = index;
    track.style.transition = animate === false ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
    for (var i = 0; i < dotEls.length; i++) {
      dotEls[i].classList.toggle('active', i === currentIndex);
    }
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(function () {
      goToSlide((currentIndex + 1) % totalSlides, true);
    }, 3000);
  }
  function stopAutoplay() { if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } }

  // Touch
  track.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX; moveX = startX; isDragging = true;
    track.style.transition = 'none'; stopAutoplay();
  }, { passive: true });
  track.addEventListener('touchmove', function (e) {
    if (!isDragging) return;
    moveX = e.touches[0].clientX;
    var percent = ((moveX - startX) / carousel.offsetWidth) * 100;
    track.style.transform = 'translateX(' + (-currentIndex * 100 + percent) + '%)';
  }, { passive: true });
  track.addEventListener('touchend', function () {
    if (!isDragging) return; isDragging = false;
    var diff = moveX - startX;
    if (diff < -50 && currentIndex < totalSlides - 1) currentIndex++;
    else if (diff > 50 && currentIndex > 0) currentIndex--;
    goToSlide(currentIndex, true); startAutoplay();
  });

  // Mouse
  track.addEventListener('mousedown', function (e) {
    e.preventDefault(); startX = e.clientX; moveX = startX; isDragging = true;
    track.style.transition = 'none'; stopAutoplay();
  });
  track.addEventListener('mousemove', function (e) {
    if (!isDragging) return; moveX = e.clientX;
    var percent = ((moveX - startX) / carousel.offsetWidth) * 100;
    track.style.transform = 'translateX(' + (-currentIndex * 100 + percent) + '%)';
  });
  track.addEventListener('mouseup', function () {
    if (!isDragging) return; isDragging = false;
    var diff = moveX - startX;
    if (Math.abs(diff) > 50) {
      if (diff < 0 && currentIndex < totalSlides - 1) currentIndex++;
      if (diff > 0 && currentIndex > 0) currentIndex--;
    }
    goToSlide(currentIndex, true); startAutoplay();
  });
  track.addEventListener('mouseleave', function () {
    if (isDragging) { isDragging = false; goToSlide(currentIndex, true); startAutoplay(); }
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', function () { stopAutoplay(); goToSlide(currentIndex - 1, true); startAutoplay(); });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function () { stopAutoplay(); goToSlide(currentIndex + 1, true); startAutoplay(); });
  }
  for (var d = 0; d < dotEls.length; d++) {
    (function (dot, idx) {
      dot.addEventListener('click', function () { stopAutoplay(); goToSlide(idx, true); startAutoplay(); });
    })(dotEls[d], d);
  }

  startAutoplay();
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopAutoplay(); else startAutoplay();
  });
}

/* ---- 视频 ---- */
function renderVideo(cam) {
  var section = document.getElementById('video-section');
  if (!section) return;
  if (!cam.video) { section.classList.add('empty'); return; }
  section.classList.remove('empty');
  var poster = (cam.images && cam.images[0]) ? cam.images[0] : '';
  section.innerHTML =
    '<h3>📹 实拍视频</h3>' +
    '<video src="' + cam.video + '" controls preload="metadata" poster="' + poster + '">您的浏览器不支持视频播放</video>';
}

/* ---- 机器信息 ---- */
function renderInfo(cam) {
  var section = document.getElementById('info-section');
  if (!section) return;
  var headerTitle = document.getElementById('page-header-title');
  if (headerTitle) headerTitle.textContent = cam.name;

  var metaExtra = '';
  if (cam.focalLength) metaExtra += '<span class="meta-divider">|</span><span>' + cam.focalLength + '</span>';
  if (cam.cameraType) {
    var typeLabels = { pocket: '口袋机', slr: '单反', rangefinder: '旁轴' };
    metaExtra += '<span class="meta-divider">|</span><span>' + (typeLabels[cam.cameraType] || cam.cameraType) + '</span>';
  }

  section.innerHTML =
    '<h1 class="info-name">' + cam.name + '</h1>' +
    '<div class="info-meta">' +
      '<span class="condition-badge">' + cam.condition + '</span>' +
      '<span class="meta-divider">|</span>' +
      '<span>' + cam.brand + '</span>' +
      '<span class="meta-divider">|</span>' +
      '<span>' + cam.model + '</span>' +
      metaExtra +
    '</div>';
}

/* ---- 附件 ---- */
function renderAccessories(cam) {
  var section = document.getElementById('accessories-section');
  if (!section) return;
  if (!cam.accessories || cam.accessories.length === 0) { section.style.display = 'none'; return; }
  var itemsHtml = '';
  for (var i = 0; i < cam.accessories.length; i++) {
    itemsHtml += '<li>' + cam.accessories[i] + '</li>';
  }
  section.innerHTML = '<h3>📦 附件清单</h3><ul class="accessories-list">' + itemsHtml + '</ul>';
}

/* ---- 描述 ---- */
function renderDescription(cam) {
  var section = document.getElementById('description-section');
  if (!section) return;
  if (!cam.description) { section.style.display = 'none'; return; }
  section.innerHTML = '<h3>📝 机器描述</h3><p>' + cam.description + '</p>';
}

/* ---- 价格 ---- */
function renderPrice(cam) {
  var section = document.getElementById('price-section');
  if (!section) return;
  section.innerHTML = '<span class="price-tag"><span class="currency">¥</span>' + cam.price.toLocaleString() + '</span>';
}

/* ---- 操作按钮 ---- */
function bindActions(cam) {
  var wechatBtn = document.getElementById('btn-wechat');
  if (wechatBtn) {
    wechatBtn.addEventListener('click', function () {
      copyToClipboard(SITE_CONFIG.wechatId).then(function () {
        showToast('✅ 微信号已复制：「' + SITE_CONFIG.wechatId + '」，请打开微信添加');
      }).catch(function () {
        showToast('⚠ 复制失败，请手动添加微信：' + SITE_CONFIG.wechatId, 3000);
      });
    });
  }
  var xianyuBtn = document.getElementById('btn-xianyu');
  if (xianyuBtn) {
    xianyuBtn.addEventListener('click', function () {
      window.open(SITE_CONFIG.xianyuLink, '_blank');
    });
  }
}

/* ================================================================
   ✨ 导购问卷系统
   ================================================================ */

var QUIZ_STEPS = [
  {
    id: 'budget',
    title: '你的预算范围是？',
    key: 'budget',
    options: [
      { value: '0-300',  label: '¥100-300' },
      { value: '300-600',label: '¥300-600' },
      { value: '600-1000',label: '¥600-1000' },
      { value: '1000+',  label: '¥1000+' }
    ]
  },
  {
    id: 'usage',
    title: '主要拍什么？',
    key: 'usage',
    options: [
      { value: 'street',  label: '街头摄影' },
      { value: 'portrait',label: '人像' },
      { value: 'travel',  label: '旅行记录' },
      { value: 'daily',   label: '日常随拍' },
      { value: 'landscape',label: '风景' }
    ]
  },
  {
    id: 'portability',
    title: '对便携性有要求吗？',
    key: 'portability',
    options: [
      { value: 'pocket',  label: '必须口袋机，随身带' },
      { value: 'slr',     label: '可接受单反大小' },
      { value: 'any',     label: '无所谓' }
    ]
  },
  {
    id: 'focal',
    title: '偏好什么焦段？',
    key: 'focal',
    options: [
      { value: '28mm',  label: '28mm（广角）' },
      { value: '35mm',  label: '35mm（经典街拍）' },
      { value: '38mm',  label: '38-40mm' },
      { value: '50mm',  label: '50mm（标准）' },
      { value: 'zoom',  label: '变焦更方便' },
      { value: 'any',   label: '不太懂，帮我选' }
    ]
  },
  {
    id: 'skill',
    title: '你的胶片机经验？',
    key: 'skill',
    options: [
      { value: 'beginner',     label: '纯新手，没摸过' },
      { value: 'intermediate', label: '玩过一点' },
      { value: 'advanced',     label: '老玩家' }
    ]
  },
  {
    id: 'brand',
    title: '有品牌偏好吗？',
    key: 'brand',
    options: [
      { value: '',     label: '无所谓' },
      { value: 'Contax',  label: 'Contax' },
      { value: 'Olympus', label: 'Olympus' },
      { value: 'Minolta', label: 'Minolta' },
      { value: 'Canon',   label: 'Canon' },
      { value: 'Nikon',   label: 'Nikon' },
      { value: 'Pentax',  label: 'Pentax' }
    ]
  }
];

var quizAnswers = {};
var quizCurrentStep = 0;

/** 渲染问卷面板 */
function renderQuizPanel() {
  var panel = document.getElementById('quiz-panel');
  if (!panel) return;

  quizAnswers = {};
  quizCurrentStep = 0;

  var stepsHtml = '';
  for (var s = 0; s < QUIZ_STEPS.length; s++) {
    stepsHtml += '<div class="quiz-step-indicator-dot" data-step="' + s + '">' + (s + 1) + '</div>';
  }

  panel.innerHTML =
    '<div class="quiz-overlay">' +
      '<div class="quiz-card">' +
        '<div class="quiz-header">' +
          '<button class="quiz-close" id="quiz-close">✕</button>' +
          '<h2 class="quiz-title">🎯 让相机找到你</h2>' +
          '<div class="quiz-steps" id="quiz-steps">' + stepsHtml + '</div>' +
        '</div>' +
        '<div class="quiz-body" id="quiz-body"></div>' +
        '<div class="quiz-footer">' +
          '<button class="btn btn-quiz-back" id="quiz-back" style="display:none">← 上一步</button>' +
          '<button class="btn btn-quiz-next" id="quiz-next">开始</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  // Bind events
  document.getElementById('quiz-close').addEventListener('click', closeQuiz);
  document.getElementById('quiz-back').addEventListener('click', prevStep);
  document.getElementById('quiz-next').addEventListener('click', nextStep);

  renderStep(0);
}

/** 渲染当前步骤 */
function renderStep(stepIndex) {
  quizCurrentStep = stepIndex;
  var step = QUIZ_STEPS[stepIndex];
  var body = document.getElementById('quiz-body');
  var backBtn = document.getElementById('quiz-back');
  var nextBtn = document.getElementById('quiz-next');

  // Update step indicators
  var dots = document.querySelectorAll('.quiz-step-indicator-dot');
  for (var d = 0; d < dots.length; d++) {
    dots[d].classList.toggle('active', d === stepIndex);
    dots[d].classList.toggle('done', d < stepIndex);
  }

  // Back button
  backBtn.style.display = stepIndex === 0 ? 'none' : 'inline-flex';
  nextBtn.textContent = stepIndex === QUIZ_STEPS.length - 1 ? '🔍 查看推荐结果' : '下一步 →';

  // Render options
  var prevAnswer = quizAnswers[step.key];
  var optionsHtml = '<div class="quiz-options">';
  for (var o = 0; o < step.options.length; o++) {
    var opt = step.options[o];
    var isSelected = prevAnswer === opt.value;
    optionsHtml +=
      '<button class="quiz-option' + (isSelected ? ' selected' : '') + '" ' +
        'data-value="' + opt.value + '">' +
        opt.label +
      '</button>';
  }
  optionsHtml += '</div>';
  body.innerHTML = '<p class="quiz-question">' + step.title + '</p>' + optionsHtml;

  // Bind option clicks
  var optionEls = body.querySelectorAll('.quiz-option');
  for (var i = 0; i < optionEls.length; i++) {
    optionEls[i].addEventListener('click', function () {
      var parent = this.parentElement;
      var siblings = parent.querySelectorAll('.quiz-option');
      for (var s = 0; s < siblings.length; s++) siblings[s].classList.remove('selected');
      this.classList.add('selected');
      quizAnswers[step.key] = this.getAttribute('data-value');
    });
  }
}

function nextStep() {
  var step = QUIZ_STEPS[quizCurrentStep];
  if (!quizAnswers[step.key]) {
    showToast('请先选择一个选项', 1500);
    return;
  }
  if (quizCurrentStep < QUIZ_STEPS.length - 1) {
    renderStep(quizCurrentStep + 1);
  } else {
    showResults();
  }
}

function prevStep() {
  if (quizCurrentStep > 0) {
    renderStep(quizCurrentStep - 1);
  }
}

function closeQuiz() {
  var panel = document.getElementById('quiz-panel');
  if (panel) panel.innerHTML = '';
}

/** 推荐算法 */
function computeRecommendations() {
  var results = [];

  for (var i = 0; i < CAMERAS.length; i++) {
    var cam = CAMERAS[i];
    var score = 0;

    // 1. 预算匹配
    if (quizAnswers.budget) {
      var inRange = false;
      var slightlyOver = false;
      switch (quizAnswers.budget) {
        case '0-300':   inRange = cam.price <= 300; slightlyOver = cam.price <= 360; break;
        case '300-600': inRange = cam.price >= 300 && cam.price <= 600; slightlyOver = cam.price <= 720; break;
        case '600-1000':inRange = cam.price >= 600 && cam.price <= 1000; slightlyOver = cam.price <= 1200; break;
        case '1000+':   inRange = cam.price >= 1000; slightlyOver = cam.price >= 800; break;
      }
      if (inRange) score += 3;
      else if (slightlyOver) score += 1;
      else continue; // 超出太多，过滤
    }

    // 2. 拍摄类型匹配
    if (quizAnswers.usage && cam.bestFor) {
      if (cam.bestFor.indexOf(quizAnswers.usage) !== -1) score += 2;
    }

    // 3. 便携需求匹配
    if (quizAnswers.portability && quizAnswers.portability !== 'any') {
      if (cam.cameraType === quizAnswers.portability) score += 2;
    }

    // 4. 焦段匹配
    if (quizAnswers.focal && quizAnswers.focal !== 'any') {
      if (cam.focalLength && cam.focalLength.indexOf(quizAnswers.focal.replace('mm','')) !== -1) score += 2;
      // 变焦匹配
      if (quizAnswers.focal === 'zoom' && cam.focalLength && cam.focalLength.indexOf('-') !== -1) score += 2;
    }

    // 5. 经验匹配
    if (quizAnswers.skill && cam.skillLevel) {
      if (cam.skillLevel === quizAnswers.skill) score += 1;
    }

    // 6. 品牌偏好
    if (quizAnswers.brand && quizAnswers.brand !== '') {
      if (cam.brand === quizAnswers.brand) score += 3;
    }

    if (score >= 3) {
      results.push({ camera: cam, score: score });
    }
  }

  // 按分数降序
  results.sort(function (a, b) { return b.score - a.score; });
  return results;
}

/** 展示推荐结果 */
function showResults() {
  var panel = document.getElementById('quiz-panel');
  if (!panel) return;

  var results = computeRecommendations();

  var bodyHtml = '<h3 style="text-align:center;color:var(--text-title);margin-bottom:16px">为你找到 ' + results.length + ' 台相机</h3>';

  if (results.length === 0) {
    bodyHtml += '<p style="text-align:center;color:var(--accent-tag);padding:24px">没有精确匹配的，试试放宽条件？<br><a href="javascript:void(0)" onclick="document.getElementById(\'quiz-panel\').innerHTML=\'\';renderStep(0);" style="color:var(--accent-price)">重新选择</a></p>';
  } else {
    bodyHtml += '<div class="quiz-results">';
    for (var r = 0; r < results.length; r++) {
      var item = results[r];
      var label = r === 0 ? '🏆 最推荐' : (r === 1 ? '👍 也适合你' : '');
      bodyHtml +=
        '<div class="quiz-result-item">' +
          (label ? '<div class="quiz-result-label">' + label + '</div>' : '') +
          buildCameraCard(item.camera) +
        '</div>';
    }
    bodyHtml += '</div>';
    bodyHtml += '<p style="text-align:center;margin-top:12px"><a href="index.html" onclick="document.getElementById(\'quiz-panel\').innerHTML=\'\'" style="color:var(--accent-price)">查看全部相机 →</a></p>';
  }

  panel.innerHTML =
    '<div class="quiz-overlay">' +
      '<div class="quiz-card quiz-card-results">' +
        '<div class="quiz-header">' +
          '<button class="quiz-close" onclick="document.getElementById(\'quiz-panel\').innerHTML=\'\'">✕</button>' +
          '<h2 class="quiz-title">📷 推荐结果</h2>' +
        '</div>' +
        '<div class="quiz-body" style="max-height:65vh;overflow-y:auto">' + bodyHtml + '</div>' +
        '<div class="quiz-footer">' +
          '<button class="btn btn-quiz-back" onclick="renderStep(0)" style="display:inline-flex">🔄 重新选择</button>' +
          '<button class="btn btn-wechat" onclick="document.getElementById(\'quiz-panel\').innerHTML=\'\'">关闭</button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

/* ================================================================
   页面初始化
   ================================================================ */

(function init() {
  // 等待 CAMERAS 就绪（可能从 JSON 异步加载）
  function ready() {
    var path = window.location.pathname;
    if (path.indexOf('detail.html') !== -1) {
      renderDetail();
    } else {
      renderCameraList();
      // 渲染问卷入口（如果启用且有相机数据）
      if (SITE_CONFIG.quizEnabled && CAMERAS && CAMERAS.length > 0) {
        renderQuizBanner();
      }
    }
  }

  // 如果 CAMERAS 还未定义（可能从 JSON 异步加载），等待
  if (typeof CAMERAS !== 'undefined' && CAMERAS.length > 0) {
    ready();
  } else {
    // 轮询等待 cameras.js 加载
    var checkCount = 0;
    var checkInterval = setInterval(function () {
      checkCount++;
      if (typeof CAMERAS !== 'undefined') {
        clearInterval(checkInterval);
        ready();
      } else if (checkCount > 50) {
        clearInterval(checkInterval);
        console.error('CAMERAS data not loaded');
        ready(); // 继续，让各个渲染函数处理空数据
      }
    }, 100);
  }
})();

/** 渲染首页问卷入口横幅 */
function renderQuizBanner() {
  var container = document.getElementById('quiz-banner');
  if (!container) return;
  container.innerHTML =
    '<div class="quiz-banner" id="quiz-banner-trigger">' +
      '<div class="quiz-banner-text">' +
        '<span class="quiz-banner-icon">🎯</span>' +
        '<span>不知道选哪台？让相机找到你</span>' +
      '</div>' +
      '<span class="quiz-banner-arrow">→</span>' +
    '</div>';
  container.style.display = 'block';
  document.getElementById('quiz-banner-trigger').addEventListener('click', renderQuizPanel);
}
