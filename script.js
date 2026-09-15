gsap.registerPlugin(ScrollTrigger);

const navbar = document.getElementById("navbar");
const hamburger = document.getElementById("hamburger");

// Frame boundaries as fractions of total scroll (0 to 1)
const frameRanges = [
  [0.00, 0.14],
  [0.14, 0.28],
  [0.28, 0.42],
  [0.42, 0.56],
  [0.56, 0.70],
  [0.70, 0.84],
  [0.84, 1.00],
];

function fadeAtProgress(el, progress, start, end) {
  const span = end - start;
  const fadeInEnd = start + span * 0.1;
  const fadeOutStart = end - span * 0.1;

  let opacity;
  if (progress < start || progress > end) {
    opacity = 0;
  } else if (progress < fadeInEnd) {
    opacity = (progress - start) / (fadeInEnd - start);
  } else if (progress > fadeOutStart) {
    opacity = 1 - (progress - fadeOutStart) / (end - fadeOutStart);
  } else {
    opacity = 1;
  }
  opacity = Math.max(0, Math.min(1, opacity));
  el.style.opacity = opacity;
}

// ===== IMAGE SEQUENCE SCRUB (scroll-driven) =====
const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");
const frameCount = 300;
const frames = [];
let currentFrame = 0;

function getFramePath(index) {
  const num = String(index + 1).padStart(3, "0");
  return `assets/frames/ezgif-frame-${num}.jpg`;
}

function preloadFrames() {
  let loadedCount = 0;
  for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.src = getFramePath(i);
    img.onload = () => {
      loadedCount++;
      const percent = Math.round((loadedCount / frameCount) * 100);
      document.getElementById("loader-bar").style.width = percent + "%";
      document.getElementById("loader-text").textContent = percent + "%";
      if (loadedCount === 1) {
        resizeCanvas();
        drawFrame(0);
      }
      if (loadedCount === frameCount) {
        setTimeout(() => {
          document.getElementById("loader").style.opacity = "0";
          document.getElementById("loader").style.transition = "opacity 0.8s";
          setTimeout(() => {
            document.getElementById("loader").style.display = "none";
          }, 800);
        }, 300);
        initScrollAnimation();
      }
    };
    frames[i] = img;
  }
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
}

function drawFrame(index) {
  const img = frames[index];
  if (!img || !img.complete) return;
  const scale = Math.max(
    canvas.width / img.naturalWidth,
    canvas.height / img.naturalHeight
  );
  const x = (canvas.width - img.naturalWidth * scale) / 2;
  const y = (canvas.height - img.naturalHeight * scale) / 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
}

function initScrollAnimation() {
  ScrollTrigger.create({
    trigger: ".scroll-container",
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const index = Math.min(
        frameCount - 1,
        Math.floor(self.progress * frameCount)
      );
      if (index !== currentFrame) {
        currentFrame = index;
        drawFrame(currentFrame);
      }
    },
  });
}

window.addEventListener("resize", () => {
  resizeCanvas();
  drawFrame(currentFrame);
});

function initScroll() {
  const frameLogo = document.querySelector(".frame-logo");
  const scrollHint = document.querySelector(".scroll-hint");
  const heroCenter = document.querySelector(".hero-center");
  // Frame 1's own text fades in on load (handled by initHero), so the
  // scroll-driven fade only needs to fade it back OUT near the frame end.
  const scrollFadeContents = document.querySelectorAll(
    ".frame-02 .frame-content, .frame-03 .frame-content, .frame-04 .frame-center, .frame-05 .frame-content, .frame-06 .frame-content, .frame-07 .frame-center"
  );

  ScrollTrigger.create({
    trigger: ".scroll-container",
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      const progress = self.progress;

      // Frame 1 elements: stay visible through the frame, fade out at its end
      const [f1start, f1end] = frameRanges[0];
      if (progress > f1end) {
        heroCenter.style.opacity = 0;
        frameLogo.style.opacity = 0;
        scrollHint.style.opacity = 0;
      } else {
        const fadeOutStart = f1end - (f1end - f1start) * 0.1;
        const op = progress > fadeOutStart
          ? 1 - (progress - fadeOutStart) / (f1end - fadeOutStart)
          : 1;
        heroCenter.style.opacity = op;
        frameLogo.style.opacity = op;
      }
      fadeAtProgress(scrollHint, progress, 0, 0.1);

      // Each remaining frame's text content fades in/out within its own range
      scrollFadeContents.forEach((el) => {
        const frameSection = el.closest(".frame");
        const frameIndex = parseInt(frameSection.dataset.frame, 10) - 1;
        const [start, end] = frameRanges[frameIndex];
        fadeAtProgress(el, progress, start, end);
      });

      // Navbar background on scroll
      if (progress > 0.01) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    },
  });
}

function initHero() {
  gsap.to(".frame-logo", { opacity: 1, duration: 1, delay: 0.2 });
  gsap.to(".hero-headline .line-1", { opacity: 1, y: 0, duration: 1, delay: 0.4 });
  gsap.to(".hero-headline .line-2", { opacity: 1, y: 0, duration: 1, delay: 0.6 });
  gsap.to(".hero-body", { opacity: 1, y: 0, duration: 1, delay: 0.8 });
  gsap.to(".scroll-hint", { opacity: 1, duration: 1, delay: 1.2 });
}

function initHamburger() {
  if (!hamburger) return;
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    document.querySelector(".nav-links").classList.toggle("mobile-open");
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initScroll();
  initHero();
  initHamburger();

  preloadFrames();
});
