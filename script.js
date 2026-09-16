gsap.registerPlugin(ScrollTrigger);

// ============================================================
// CONFIG — change frameCount and frameName to match your files
// ============================================================
const FRAME_COUNT = 100;           // total frames you extracted
const FRAME_PREFIX = "ezgif-frame-"; // filename prefix
const FRAME_EXT = ".jpg";           // file extension
const FRAME_PATH = "assets/frames/"; // folder path

// Frame text ranges — 7 sections across 0 to 1
const frameRanges = [
  [0.00, 0.14], // Frame 01 — Hero
  [0.14, 0.28], // Frame 02 — AM Reveal
  [0.28, 0.42], // Frame 03 — AM Benefits
  [0.42, 0.56], // Frame 04 — Transition
  [0.56, 0.70], // Frame 05 — PM Reveal
  [0.70, 0.84], // Frame 06 — PM Benefits
  [0.84, 1.00], // Frame 07 — CTA
];

// ============================================================
// ELEMENTS
// ============================================================
const navbar    = document.getElementById("navbar");
const hamburger = document.getElementById("hamburger");
const canvas    = document.getElementById("hero-canvas");
const ctx       = canvas.getContext("2d");
const loader    = document.getElementById("loader");
const loaderBar = document.getElementById("loader-bar");
const loaderTxt = document.getElementById("loader-text");

// ============================================================
// CANVAS / IMAGE SEQUENCE
// ============================================================
const frames = new Array(FRAME_COUNT);
let currentFrame = 0;
let sequenceReady = false;

function getFramePath(i) {
  // i is 0-based → file names start at 001
  const num = String(i + 1).padStart(3, "0");
  return `${FRAME_PATH}${FRAME_PREFIX}${num}${FRAME_EXT}`;
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = window.innerWidth  * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width  = window.innerWidth  + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
}

function drawFrame(index) {
  const img = frames[index];
  if (!img || !img.complete || !img.naturalWidth) return;
  const scale = Math.max(
    canvas.width  / img.naturalWidth,
    canvas.height / img.naturalHeight
  );
  const x = (canvas.width  - img.naturalWidth  * scale) / 2;
  const y = (canvas.height - img.naturalHeight * scale) / 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
}

function preloadFrames() {
  resizeCanvas();
  let loaded = 0;

  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    frames[i] = img;

    img.onload = () => {
      loaded++;
      const pct = Math.round((loaded / FRAME_COUNT) * 100);
      loaderBar.style.width = pct + "%";
      loaderTxt.textContent = pct + "%";

      // Draw very first frame immediately so there's something to see
      if (loaded === 1) drawFrame(0);

      if (loaded === FRAME_COUNT) {
        sequenceReady = true;
        hideLoader();
        initScrollAnimation();
      }
    };

    img.onerror = () => {
      // count errors so we don't get stuck if a frame is missing
      loaded++;
      if (loaded === FRAME_COUNT) {
        sequenceReady = true;
        hideLoader();
        initScrollAnimation();
      }
    };

    img.src = getFramePath(i);
  }
}

function hideLoader() {
  setTimeout(() => {
    loader.style.transition = "opacity 0.8s ease";
    loader.style.opacity = "0";
    setTimeout(() => { loader.style.display = "none"; }, 800);
  }, 300);
}

// ============================================================
// SCROLL — IMAGE SEQUENCE
// ============================================================
function initScrollAnimation() {
  ScrollTrigger.create({
    trigger: ".scroll-container",
    start: "top top",
    end: "bottom bottom",
    scrub: true,           // direct 1-to-1, no easing lag
    onUpdate: (self) => {
      if (!sequenceReady) return;
      const index = Math.min(
        FRAME_COUNT - 1,
        Math.floor(self.progress * FRAME_COUNT)
      );
      if (index !== currentFrame) {
        currentFrame = index;
        drawFrame(currentFrame);
      }
    },
  });
}

// ============================================================
// SCROLL — TEXT OVERLAYS
// ============================================================
function fadeAtProgress(el, progress, start, end) {
  const span = end - start;
  const fadeInEnd    = start + span * 0.12;
  const fadeOutStart = end   - span * 0.12;

  let opacity;
  if (progress <= start || progress >= end) {
    opacity = 0;
  } else if (progress < fadeInEnd) {
    opacity = (progress - start) / (fadeInEnd - start);
  } else if (progress > fadeOutStart) {
    opacity = 1 - (progress - fadeOutStart) / (end - fadeOutStart);
  } else {
    opacity = 1;
  }
  el.style.opacity = Math.max(0, Math.min(1, opacity));
}

function initTextScroll() {
  const frameLogo  = document.querySelector(".frame-logo");
  const scrollHint = document.querySelector(".scroll-hint");
  const heroCenter = document.querySelector(".hero-center");

  const scrollFadeEls = document.querySelectorAll(
    ".frame-02 .frame-content," +
    ".frame-03 .frame-content," +
    ".frame-04 .frame-center," +
    ".frame-05 .frame-content," +
    ".frame-06 .frame-content," +
    ".frame-07 .frame-center"
  );

  ScrollTrigger.create({
    trigger: ".scroll-container",
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      const p = self.progress;
      const [f1s, f1e] = frameRanges[0];

      // Frame 01 — stays visible, fades out at section end
      if (p > f1e) {
        heroCenter.style.opacity = "0";
        frameLogo.style.opacity  = "0";
      } else {
        const fadeOutStart = f1e - (f1e - f1s) * 0.12;
        const op = p > fadeOutStart
          ? 1 - (p - fadeOutStart) / (f1e - fadeOutStart)
          : 1;
        heroCenter.style.opacity = op;
        frameLogo.style.opacity  = op;
      }
      fadeAtProgress(scrollHint, p, 0, 0.08);

      // Frames 02–07
      scrollFadeEls.forEach((el) => {
        const section = el.closest(".frame");
        const idx     = parseInt(section.dataset.frame, 10) - 1;
        const [s, e]  = frameRanges[idx];
        fadeAtProgress(el, p, s, e);
      });

      // Navbar
      navbar.classList.toggle("scrolled", p > 0.01);
    },
  });
}

// ============================================================
// HERO ENTRANCE ANIMATION
// ============================================================
function initHero() {
  // Start hidden via CSS (opacity:0 set in stylesheet)
  gsap.to(".frame-logo",             { opacity: 1, duration: 1.0, delay: 0.3 });
  gsap.to(".hero-headline .line-1",  { opacity: 1, y: 0, duration: 1.0, delay: 0.5 });
  gsap.to(".hero-headline .line-2",  { opacity: 1, y: 0, duration: 1.0, delay: 0.7 });
  gsap.to(".hero-body",              { opacity: 1, y: 0, duration: 1.0, delay: 0.9 });
  gsap.to(".scroll-hint",            { opacity: 1, duration: 1.0, delay: 1.3 });
}

// ============================================================
// HAMBURGER MENU
// ============================================================
function initHamburger() {
  if (!hamburger) return;
  const navLinks = document.getElementById("nav-links");
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("mobile-open");
  });
}

// ============================================================
// RESIZE
// ============================================================
window.addEventListener("resize", () => {
  resizeCanvas();
  drawFrame(currentFrame);
});

// ============================================================
// INIT
// ============================================================
window.addEventListener("DOMContentLoaded", () => {
  initHero();
  initTextScroll();
  initHamburger();
  preloadFrames(); // starts loading all frames + shows loader progress
});
