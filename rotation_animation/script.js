const items = [
  "第一段：无障碍设计能让更多用户顺利获取内容。",
  "第二段：键盘可操作是很多无障碍规范中的基础要求。",
  "第三段：自动轮播内容必须允许用户主动暂停或停止。",
  "第四段：颜色不能是唯一信息来源，还要保证足够对比度。",
  "第五段：屏幕阅读器需要能读懂当前区域的用途与状态。",
  "第六段：焦点进入组件时暂停动画，通常更利于阅读和操作。",
  "第七段：尊重减少动态效果偏好，可以降低动画带来的不适。"
];

const track = document.getElementById("carouselTrack");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const toggleBtn = document.getElementById("toggleBtn");
const viewport = document.querySelector(".carousel-viewport");
const statusText = document.getElementById("statusText");


let currentIndex = 1; // 默认中间高亮的逻辑索引
let autoplay = true;
let intervalId = null;
const intervalTime = 3000;
let isAnimating = false;


function mod(n, m) {
  return ((n % m) + m) % m;
}

function createItems() {
  track.innerHTML = "";

  items.forEach((text, index) => {
    const li = document.createElement("li");
    li.className = "carousel-item pos-hidden";
    li.setAttribute("role", "listitem");
    li.dataset.index = index;
    li.textContent = text;
    track.appendChild(li);
  });
}

function render() {
  const allItems = Array.from(track.children);

  const prevIndex = mod(currentIndex - 1, items.length);
  const nextIndex = mod(currentIndex + 1, items.length);
  const incomingIndex = mod(currentIndex + 2, items.length);

  allItems.forEach((item, index) => {
    item.className = "carousel-item pos-hidden";
    item.setAttribute("aria-hidden", "true");

    if (index === prevIndex) {
      item.className = "carousel-item pos-prev";
      item.setAttribute("aria-hidden", "false");
    } else if (index === currentIndex) {
      item.className = "carousel-item pos-current";
      item.setAttribute("aria-hidden", "false");
    } else if (index === nextIndex) {
      item.className = "carousel-item pos-next";
      item.setAttribute("aria-hidden", "false");
    } else if (index === incomingIndex) {
      item.className = "carousel-item pos-incoming";
      item.setAttribute("aria-hidden", "true");
    }
  });

  statusText.textContent = `当前高亮为第 ${currentIndex + 1} 条，共 ${items.length} 条`;
}

function nextSlide() {
  if (isAnimating) return;
  isAnimating = true;

  track.classList.add("is-animating-next");

  setTimeout(() => {
    track.classList.remove("is-animating-next");
    currentIndex = mod(currentIndex + 1, items.length);
    render();
    isAnimating = false;
  }, 450);
}

function stopAutoplay() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function setAutoplayState(shouldPlay) {
  autoplay = shouldPlay;

  if (autoplay) {
    toggleBtn.textContent = "暂停";
    toggleBtn.setAttribute("aria-label", "暂停自动播放");
    toggleBtn.setAttribute("aria-pressed", "false");

    viewport.classList.remove("is-paused"); // ⭐ 新增
    startAutoplay();
  } else {
    toggleBtn.textContent = "继续播放";
    toggleBtn.setAttribute("aria-label", "继续自动播放");
    toggleBtn.setAttribute("aria-pressed", "true");

    viewport.classList.add("is-paused"); // ⭐ 新增
    stopAutoplay();
  }
}

prevBtn.addEventListener("click", () => {
  prevSlide();
  if (autoplay) startAutoplay();
});

nextBtn.addEventListener("click", () => {
  nextSlide();
  if (autoplay) startAutoplay();
});

toggleBtn.addEventListener("click", () => {
  setAutoplayState(!autoplay);
});

viewport.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowUp":
    case "ArrowLeft":
      event.preventDefault();
      prevSlide();
      if (autoplay) startAutoplay();
      break;

    case "ArrowDown":
    case "ArrowRight":
      event.preventDefault();
      nextSlide();
      if (autoplay) startAutoplay();
      break;

    case " ":
    case "Spacebar":
    case "Enter":
      event.preventDefault();
      setAutoplayState(!autoplay);
      break;
  }
});

/* 焦点进入时暂停，离开后恢复 */
viewport.addEventListener("focus", () => {
  stopAutoplay();
  viewport.classList.add("is-paused");
});

viewport.addEventListener("blur", () => {
  viewport.classList.remove("is-paused");
  if (autoplay) startAutoplay();
});

viewport.addEventListener("mouseenter", () => {
  stopAutoplay();
  viewport.classList.add("is-paused");
});

viewport.addEventListener("mouseleave", () => {
  viewport.classList.remove("is-paused");
  if (autoplay) startAutoplay();
});
/* 如果用户偏好减少动态效果，则默认不自动播放 */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function applyMotionPreference() {
  if (prefersReducedMotion.matches) {
    setAutoplayState(false);
  } else {
    setAutoplayState(true);
  }
}

function startAutoplay() {
  if (!autoplay) return;
  stopAutoplay();
  intervalId = setInterval(() => {
    nextSlide();
  }, intervalTime);
}

function prevSlide() {
  currentIndex = mod(currentIndex - 1, items.length);
  render();
}

prefersReducedMotion.addEventListener?.("change", applyMotionPreference);

createItems();
render();
applyMotionPreference();