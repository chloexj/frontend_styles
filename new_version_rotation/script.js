// ===============================
// 数据：轮播文本（英文）
// ===============================
const texts = [
  "Focus on your growth, not comparison.",
  "Small steps every day lead to big results.",
  "Consistency is more important than intensity.",
  "Your future is built by what you do today.",
  "Keep going, even when it feels slow."
];

// ===============================
// 获取DOM元素
// ===============================
const carousel = document.getElementById("carousel");
const track = document.getElementById("carouselTrack");
const dotsContainer = document.getElementById("dotNav");
const toggleBtn = document.getElementById("toggleBtn");
const toggleIcon = document.getElementById("toggleIcon");

// ===============================
// 常量
// ===============================
const ITEM_HEIGHT = 40;       // 每一条文本高度，要和CSS一致
const AUTO_INTERVAL = 2200;   // 自动轮播时间
const STEP_DELAY = 120;       // 点击dot逐步跳转时的节奏

// ===============================
// 状态
// realIndex：真实数据索引，范围 0 ~ texts.length - 1
// visualIndex：当前轨道所在位置
// 由于做了“首尾克隆”，所以轨道实际内容是：
// [最后一条克隆, 原始1, 原始2, ..., 原始最后, 第一条克隆]
// 因此初始 visualIndex 应该是 1
// ===============================
let realIndex = 0;
let visualIndex = 1;
let isPlaying = true;
let isHoverPaused = false;
let isJumping = false;
let autoTimer = null;

// ===============================
// 构建带克隆的列表
// 这样才能实现无缝循环
// ===============================
function buildLoopedTexts() {
  return [
    texts[texts.length - 1],
    ...texts,
    texts[0]
  ];
}

// ===============================
// 初始化
// ===============================
function init() {
  const loopedTexts = buildLoopedTexts();

  // 生成文本节点
  loopedTexts.forEach((text, index) => {
    const item = document.createElement("div");
    item.className = "carousel-item";

    // 标记克隆节点，方便调试
    if (index === 0 || index === loopedTexts.length - 1) {
      item.dataset.clone = "true";
    }

    item.textContent = text;
    track.appendChild(item);
  });

  // 生成真实小圆点
  texts.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = "dot-btn";
    dot.type = "button";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Go to message ${index + 1}`);
    dot.setAttribute("aria-selected", index === 0 ? "true" : "false");
    dot.tabIndex = 0;

    dot.addEventListener("click", () => jumpTo(index));

    dot.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        jumpTo(index);
      }
    });

    dotsContainer.appendChild(dot);
  });

  // 初始位置：第一条真实内容位于中间
  setTrackPosition(false);
  renderClasses();
  updateDots();
  updateToggleButtonUI();
}

// ===============================
// 设置轨道位置
// 因为要显示3行，并让当前项始终位于中间
// 所以位置公式是：(visualIndex - 1) * ITEM_HEIGHT
// ===============================
function setTrackPosition(withAnimation = true) {
  if (withAnimation) {
    track.style.transition = "transform 0.38s ease";
  } else {
    track.style.transition = "none";
  }

  const offset = (visualIndex - 1) * ITEM_HEIGHT;
  track.style.transform = `translateY(-${offset}px)`;
}

// ===============================
// 更新文本高亮类名
// 这里只看视觉位置：中间是active，上下是dim
// ===============================
function renderClasses() {
  const items = track.querySelectorAll(".carousel-item");

  items.forEach((item, index) => {
    item.classList.remove("is-active", "is-dim");

    if (index === visualIndex) {
      item.classList.add("is-active");
    } else if (index === visualIndex - 1 || index === visualIndex + 1) {
      item.classList.add("is-dim");
    } else {
      item.classList.add("is-dim");
    }
  });
}

// ===============================
// 更新右侧小圆点
// 这里只和真实索引 realIndex 绑定
// ===============================
function updateDots() {
  const dots = dotsContainer.querySelectorAll(".dot-btn");

  dots.forEach((dot, index) => {
    const active = index === realIndex;
    dot.classList.toggle("active", active);
    dot.setAttribute("aria-selected", active ? "true" : "false");
  });
}

// ===============================
// 更新按钮图标
// ===============================
function updateToggleButtonUI() {
  const actuallyRunning = isPlaying && !isHoverPaused && !isJumping;
  toggleIcon.textContent = actuallyRunning ? "⏸" : "▶";
  toggleBtn.setAttribute(
    "aria-label",
    actuallyRunning ? "Pause autoplay" : "Resume autoplay"
  );
}

// ===============================
// 统一刷新UI
// ===============================
function renderUI() {
  renderClasses();
  updateDots();
  updateToggleButtonUI();
}

// ===============================
// 下一条
// 无缝逻辑：
// 1. 正常往下滚
// 2. 如果滚到了最后那个“第一条克隆”
//    等动画结束后，瞬间跳回真正第一条
// ===============================
function next() {
  // ===============================
  // 如果当前已经是最后一条
  // 则不要再走“克隆节点无缝回跳”
  // 直接重置成第一条的状态
  // 效果等同于点击第一个小圆点
  // ===============================
  if (realIndex === texts.length - 1) {
    realIndex = 0;
    visualIndex = 1; // 第一条真实内容的位置

    // 直接拉回第一条状态，不做过渡动画
    setTrackPosition(false);
    renderUI();

    // 恢复后续正常动画
    requestAnimationFrame(() => {
      track.style.transition = "transform 0.38s ease";
    });

    return;
  }

  // ===============================
  // 普通情况：正常下一条
  // ===============================
  visualIndex += 1;
  realIndex += 1;

  setTrackPosition(true);
  renderUI();
}

// ===============================
// 上一条
// 如果滚到最前面的“最后一条克隆”
// 动画结束后瞬间跳到真正最后一条
// ===============================
function prev() {
  visualIndex -= 1;
  realIndex = (realIndex - 1 + texts.length) % texts.length;

  setTrackPosition(true);
  renderUI();

  // 到了开头克隆节点
  if (visualIndex === 0) {
    const handle = () => {
      track.removeEventListener("transitionend", handle);

      // 瞬间跳到真正最后一条
      visualIndex = texts.length;
      setTrackPosition(false);
      renderUI();

      track.offsetHeight;
      track.style.transition = "transform 0.38s ease";
    };

    track.addEventListener("transitionend", handle, { once: true });
  }
}

// ===============================
// 自动播放控制
// ===============================
function startAuto() {
  stopAuto();
  autoTimer = setInterval(() => {
    next();
  }, AUTO_INTERVAL);
}

function stopAuto() {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
}

function syncAutoplay() {
  const shouldRun = isPlaying && !isHoverPaused && !isJumping;

  if (shouldRun) {
    startAuto();
  } else {
    stopAuto();
  }

  updateToggleButtonUI();
}

// ===============================
// 逐步跳转到某个目标项
// 保留“经过中间过程”的感觉
// 这里按线性方向切换，不瞬移
// ===============================
function jumpTo(targetRealIndex) {
  if (targetRealIndex === realIndex || isJumping) return;

  isJumping = true;
  syncAutoplay();

  const direction = targetRealIndex > realIndex ? 1 : -1;

  function step() {
    if (realIndex === targetRealIndex) {
      isJumping = false;
      syncAutoplay();
      return;
    }

    if (direction === 1) {
      next();
    } else {
      prev();
    }

    setTimeout(step, STEP_DELAY);
  }

  step();
}

// ===============================
// 播放/暂停按钮
// ===============================
toggleBtn.addEventListener("click", () => {
  isPlaying = !isPlaying;
  syncAutoplay();
});

// ===============================
// 只有hover到“文本框”才暂停
// 不再绑定到整个component
// 这样hover按钮不会触发暂停
// ===============================
carousel.addEventListener("mouseenter", () => {
  isHoverPaused = true;
  carousel.classList.add("is-hovering");
  syncAutoplay();
});

carousel.addEventListener("mouseleave", () => {
  isHoverPaused = false;
  carousel.classList.remove("is-hovering");
  syncAutoplay();
});

// ===============================
// 键盘支持
// 当焦点在文本框时：
// ArrowDown / ArrowRight -> 下一条
// ArrowUp / ArrowLeft -> 上一条
// Space / Enter -> 播放暂停
// ===============================
carousel.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" || event.key === "ArrowRight") {
    event.preventDefault();
    if (!isJumping) {
      stopAuto();
      next();
      syncAutoplay();
    }
  }

  if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
    event.preventDefault();
    if (!isJumping) {
      stopAuto();
      prev();
      syncAutoplay();
    }
  }

  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    isPlaying = !isPlaying;
    syncAutoplay();
  }
});

// ===============================
// 初始化
// ===============================
init();
syncAutoplay();