const heroBg = (() => {
  const HERO_VERSION = "336";
  const HERO_PATHS = [
    `assets/hero/hero-01.png?v=${HERO_VERSION}`,
    `assets/hero/hero-02.png?v=${HERO_VERSION}`,
    `assets/hero/hero-03.png?v=${HERO_VERSION}`,
    `assets/hero/hero-04.png?v=${HERO_VERSION}`,
    `assets/hero/hero-05.png?v=${HERO_VERSION}`,
    `assets/hero/hero-06.png?v=${HERO_VERSION}`,
    `assets/hero/hero-07.png?v=${HERO_VERSION}`,
    `assets/hero/hero-08.png?v=${HERO_VERSION}`,
    `assets/hero/hero-09.png?v=${HERO_VERSION}`,
    `assets/hero/hero-10.png?v=${HERO_VERSION}`
  ];
  const HOLD_MS = 5200;
  const BAKE_ZOOM = 1.14;
  const TRANSITIONS = [
    { id: "fade", ms: 1400 },
    { id: "shatter", ms: 2200 },
    { id: "shatter", ms: 2200 },
    { id: "zoom", ms: 1600 },
    { id: "shatter", ms: 2200 },
    { id: "flipX", ms: 1700 },
    { id: "shatter", ms: 2200 },
    { id: "slide", ms: 1500 },
    { id: "shatter", ms: 2200 },
    { id: "rotate", ms: 1800 }
  ];

  let canvas = null;
  let ctx = null;
  let raf = null;
  let running = false;
  let w = 0;
  let h = 0;
  let mode = "cards";
  let slides = [];
  let cards = [];
  let bakeTimer = null;
  let baking = false;

  let slideIndex = 0;
  let phaseStart = 0;
  let inTransition = false;
  let transFrom = 0;
  let transTo = 0;
  let transType = "fade";
  let transMs = 1600;

  function makeCards(count) {
    cards = [];
    for (let i = 0; i < count; i++) {
      cards.push({
        x: Math.random(),
        y: Math.random(),
        z: 0.2 + Math.random() * 0.8,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.002,
        drift: (Math.random() - 0.5) * 0.00025,
        aspect: 0.65 + Math.random() * 0.5,
        tint: i % 3 === 0 ? "#7fa828" : i % 3 === 1 ? "#4a6888" : "#3a7a52"
      });
    }
  }

  async function loadBitmap(src) {
    async function fromImage(url) {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      if (img.decode) {
        await img.decode();
      } else {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      }
      return img;
    }

    if (location.protocol === "file:") {
      return fromImage(src.split("?")[0]);
    }

    try {
      const resp = await fetch(src);
      if (resp.ok) {
        const blob = await resp.blob();
        return await createImageBitmap(blob);
      }
    } catch {
      /* http fallback below */
    }
    return fromImage(src.split("?")[0]);
  }

  async function loadSlides() {
    const results = await Promise.all(
      HERO_PATHS.map(async (src) => {
        try {
          const source = await loadBitmap(src);
          return { source, baked: null };
        } catch {
          return null;
        }
      })
    );
    return results.filter(Boolean);
  }

  function bakeFrame(source, cw, ch) {
    const baked = document.createElement("canvas");
    baked.width = cw;
    baked.height = ch;
    const bctx = baked.getContext("2d");
    if (!bctx) return baked;

    const iw = source.naturalWidth || source.width;
    const ih = source.naturalHeight || source.height;
    const scale = Math.max(cw / iw, ch / ih) * BAKE_ZOOM;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    bctx.imageSmoothingEnabled = true;
    bctx.imageSmoothingQuality = "high";
    bctx.filter = "brightness(1.1) saturate(1.08) contrast(1.06)";
    bctx.drawImage(source, dx, dy, dw, dh);
    bctx.filter = "none";
    return baked;
  }

  function rebuildBakes() {
    if (!w || !h || !slides.length) return;
    baking = true;
    for (const slide of slides) {
      slide.baked = bakeFrame(slide.source, w, h);
    }
    baking = false;
  }

  function scheduleBake() {
    if (bakeTimer) clearTimeout(bakeTimer);
    bakeTimer = setTimeout(() => {
      bakeTimer = null;
      rebuildBakes();
    }, 120);
  }

  function resize() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextW = canvas.clientWidth;
    const nextH = canvas.clientHeight;
    if (nextW === w && nextH === h && canvas.width === Math.floor(nextW * dpr)) return;

    w = nextW;
    h = nextH;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (mode === "slides" && slides.length) scheduleBake();
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function transitionFor(index) {
    return TRANSITIONS[index % TRANSITIONS.length];
  }

  function bakedAt(index) {
    const slide = slides[index];
    return slide?.baked || null;
  }

  function drawBaked(baked, zoom, alpha, transform = {}) {
    if (!baked || alpha <= 0) return;

    const cx = transform.cx ?? w * 0.5;
    const cy = transform.cy ?? h * 0.5;
    const drawW = w * zoom;
    const drawH = h * zoom;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";
    ctx.translate(cx + (transform.tx ?? 0), cy + (transform.ty ?? 0));
    ctx.rotate(transform.rotation ?? 0);
    ctx.scale(transform.scaleX ?? 1, transform.scaleY ?? 1);
    ctx.translate(-cx, -cy);
    ctx.drawImage(baked, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
    ctx.restore();
  }

  function drawShatter(from, to, p, cx, cy) {
    const cols = 5;
    const rows = 4;
    const outZoom = 1.04;
    const inZoom = 1.02;
    const outW = w * outZoom;
    const outH = h * outZoom;
    const inW = w * inZoom;
    const inH = h * inZoom;
    const tileSrcW = from.width / cols;
    const tileSrcH = from.height / rows;
    const outTileW = outW / cols;
    const outTileH = outH / rows;
    const inTileW = inW / cols;
    const inTileH = inH / rows;
    const outX = cx - outW / 2;
    const outY = cy - outH / 2;
    const inX = cx - inW / 2;
    const inY = cy - inH / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const seed = col * 17 + row * 31;
        const angle = (seed % 360) * (Math.PI / 180);
        const jitter = 0.08 + (seed % 11) * 0.018;

        if (p < 0.58) {
          const fp = easeOutCubic(Math.min(1, p / 0.58));
          const dist = fp * w * jitter;
          const tx = outX + col * outTileW + outTileW / 2 + Math.cos(angle) * dist;
          const ty = outY + row * outTileH + outTileH / 2 + Math.sin(angle) * dist;
          ctx.save();
          ctx.globalAlpha = 1 - fp;
          ctx.translate(tx, ty);
          ctx.rotate(fp * ((seed % 7) - 3) * 0.05);
          ctx.drawImage(
            from,
            col * tileSrcW,
            row * tileSrcH,
            tileSrcW,
            tileSrcH,
            -outTileW / 2,
            -outTileH / 2,
            outTileW,
            outTileH
          );
          ctx.restore();
        }

        if (to && p > 0.42) {
          const tp = easeOutCubic(Math.min(1, (p - 0.42) / 0.58));
          const dist = (1 - tp) * w * jitter * 0.85;
          const tx = inX + col * inTileW + inTileW / 2 + Math.cos(angle + Math.PI) * dist;
          const ty = inY + row * inTileH + inTileH / 2 + Math.sin(angle + Math.PI) * dist;
          ctx.save();
          ctx.globalAlpha = tp;
          ctx.translate(tx, ty);
          ctx.rotate((1 - tp) * ((seed % 5) - 2) * 0.06);
          ctx.drawImage(
            to,
            col * tileSrcW,
            row * tileSrcH,
            tileSrcW,
            tileSrcH,
            -inTileW / 2,
            -inTileH / 2,
            inTileW,
            inTileH
          );
          ctx.restore();
        }
      }
    }
  }

  function drawTransition(fromIdx, toIdx, type, rawP) {
    const from = bakedAt(fromIdx);
    const to = bakedAt(toIdx);
    if (!from) return;

    const p = easeInOutCubic(rawP);
    const cx = w * 0.5;
    const cy = h * 0.5;

    switch (type) {
      case "fade":
        drawBaked(from, 1.04, 1 - p, {});
        if (to) drawBaked(to, 1.02, p, {});
        break;

      case "rotate": {
        const out = easeOutCubic(Math.min(1, p * 1.35));
        const inn = easeOutCubic(Math.max(0, (p - 0.08) / 0.92));
        drawBaked(from, 1.04, 1 - out, {
          rotation: -out * 0.05,
          scaleX: 1 - out * 0.05,
          scaleY: 1 - out * 0.05
        });
        if (to) {
          drawBaked(to, 1.02, inn, {
            rotation: (1 - inn) * 0.22,
            scaleX: 0.86 + inn * 0.14,
            scaleY: 0.86 + inn * 0.14
          });
        }
        break;
      }

      case "flipX":
        if (p < 0.5) {
          const hp = easeInOutCubic(p * 2);
          drawBaked(from, 1.04, 1, { cx, cy, scaleX: Math.max(0.001, 1 - hp) });
        } else if (to) {
          const hp = easeInOutCubic((p - 0.5) * 2);
          drawBaked(to, 1.02, 1, { cx, cy, scaleX: Math.max(0.001, hp) });
        }
        break;

      case "flipY":
        if (p < 0.5) {
          const hp = easeInOutCubic(p * 2);
          drawBaked(from, 1.04, 1, { cx, cy, scaleY: Math.max(0.001, 1 - hp) });
        } else if (to) {
          const hp = easeInOutCubic((p - 0.5) * 2);
          drawBaked(to, 1.02, 1, { cx, cy, scaleY: Math.max(0.001, hp) });
        }
        break;

      case "zoom":
        drawBaked(from, 1.04 + p * 0.06, 1 - p, {
          scaleX: 1 + p * 0.04,
          scaleY: 1 + p * 0.04
        });
        if (to) {
          drawBaked(to, 1.14 - p * 0.1, p, {
            scaleX: 1.1 - p * 0.1,
            scaleY: 1.1 - p * 0.1
          });
        }
        break;

      case "slide": {
        const out = easeOutCubic(p);
        const inn = easeOutCubic(p);
        drawBaked(from, 1.04, 1 - out * 0.85, { tx: -out * w * 0.07 });
        if (to) drawBaked(to, 1.02, inn, { tx: (1 - inn) * w * 0.09 });
        break;
      }

      case "shatter":
        drawShatter(from, to, p, cx, cy);
        break;

      default:
        drawBaked(from, 1.04, 1, {});
    }
  }

  function beginTransition(t) {
    inTransition = true;
    transFrom = slideIndex;
    transTo = (slideIndex + 1) % slides.length;
    const spec = transitionFor(transFrom);
    transType = spec.id;
    transMs = spec.ms;
    phaseStart = t;
  }

  function drawSlides(t) {
    if (!slides.length) return;

    const current = bakedAt(slideIndex);
    if (!current) return;

    if (!inTransition) {
      const elapsed = t - phaseStart;
      const ken = 1.02 + (elapsed / HOLD_MS) * 0.05;
      drawBaked(current, ken, 1, {});
      if (elapsed >= HOLD_MS) beginTransition(t);
      return;
    }

    const elapsed = t - phaseStart;
    const rawP = Math.min(1, elapsed / transMs);
    drawTransition(transFrom, transTo, transType, rawP);

    if (rawP >= 1) {
      slideIndex = transTo;
      inTransition = false;
      phaseStart = t;
    }
  }

  function roundRect(c, x, y, width, height, radius) {
    c.beginPath();
    c.moveTo(x + radius, y);
    c.arcTo(x + width, y, x + width, y + height, radius);
    c.arcTo(x + width, y + height, x, y + height, radius);
    c.arcTo(x, y + height, x, y, radius);
    c.arcTo(x, y, x + width, y, radius);
    c.closePath();
  }

  function drawCard(f, t) {
    const cx = w * 0.5;
    const cy = h * 0.48;
    const depth = 0.35 + f.z * 0.65;
    const px = cx + (f.x - 0.5) * w * 1.1 * depth;
    const py = cy + (f.y - 0.5) * h * 0.85 * depth + Math.sin(t * 0.0004 + f.rot * 3) * 8 * depth;
    const fw = 72 + f.z * 110;
    const fh = fw * f.aspect;
    const rot = f.rot + t * f.spin;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    ctx.globalAlpha = 0.1 + f.z * 0.18;
    ctx.fillStyle = "rgba(255, 252, 246, 0.72)";
    ctx.strokeStyle = f.tint;
    ctx.lineWidth = 1.2 + f.z;
    roundRect(ctx, -fw / 2, -fh / 2, fw, fh, 10);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawCards(t) {
    cards.sort((a, b) => a.z - b.z);
    cards.forEach((f) => {
      f.x += f.drift;
      f.y += Math.sin(t * 0.0003 + f.rot) * 0.00008;
      if (f.x < -0.15) f.x = 1.15;
      if (f.x > 1.15) f.x = -0.15;
      drawCard(f, t);
    });
  }

  function tick(t) {
    if (!running || !ctx) return;
    ctx.clearRect(0, 0, w, h);
    if (mode === "slides") drawSlides(t);
    else drawCards(t);
    raf = requestAnimationFrame(tick);
  }

  async function start() {
    if (running || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    canvas = document.getElementById("hero-canvas");
    if (!canvas) return;

    ctx = canvas.getContext("2d", { alpha: true, desynchronized: true })
      || canvas.getContext("2d");

    slides = await loadSlides();
    mode = slides.length ? "slides" : "cards";
    if (mode === "cards") makeCards(14);
    else {
      slideIndex = 0;
      inTransition = false;
      phaseStart = performance.now();
    }

    resize();
    if (mode === "slides") rebuildBakes();

    running = true;
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    const emptyEl = document.getElementById("empty");
    if (mode === "slides" && emptyEl) emptyEl.classList.add("hero-slides-active");
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    if (bakeTimer) clearTimeout(bakeTimer);
    window.removeEventListener("resize", resize);
    const emptyEl = document.getElementById("empty");
    if (emptyEl) emptyEl.classList.remove("hero-slides-active");
    canvas = null;
    ctx = null;
    cards = [];
    slides = [];
    bakeTimer = null;
    baking = false;
  }

  return { start, stop };
})();
