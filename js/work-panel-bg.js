const workPanelBg = (() => {
  const PANEL_VERSION = "1";
  const PATHS = [
    `assets/panel/panel-01.png?v=${PANEL_VERSION}`,
    `assets/panel/panel-02.png?v=${PANEL_VERSION}`
  ];
  const HOLD_MS = 6000;
  const TRANS_MS = 2200;
  const BAKE_ZOOM = 1.08;

  let canvas = null;
  let ctx = null;
  let raf = null;
  let running = false;
  let w = 0;
  let h = 0;
  let slides = [];
  let slideIndex = 0;
  let phaseStart = 0;
  let inTransition = false;
  let transFrom = 0;
  let transTo = 0;
  let resizeObs = null;

  async function loadBitmap(src) {
    const img = new Image();
    img.decoding = "async";
    img.src = src.split("?")[0];
    if (img.decode) await img.decode();
    else await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    return img;
  }

  async function loadSlides() {
    const results = await Promise.allSettled(
      PATHS.map(async (src) => {
        const source = await loadBitmap(src);
        return { source, baked: null };
      })
    );
    return results.filter((r) => r.status === "fulfilled").map((r) => r.value);
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
    bctx.drawImage(source, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    return baked;
  }

  function rebuildBakes() {
    if (!w || !h || !slides.length) return;
    slides.forEach((slide) => {
      slide.baked = bakeFrame(slide.source, w, h);
    });
  }

  function resize() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (slides.length) rebuildBakes();
  }

  function bakedAt(index) {
    return slides[index]?.baked || null;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function drawBaked(baked, zoom, alpha) {
    if (!baked || alpha <= 0) return;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const drawW = w * zoom;
    const drawH = h * zoom;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(baked, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
    ctx.restore();
  }

  function drawShatter(from, to, p, cx, cy) {
    const cols = 5;
    const rows = 4;
    const outW = w * 1.04;
    const outH = h * 1.04;
    const inW = w * 1.02;
    const inH = h * 1.02;
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

  function drawSlides(t) {
    if (!slides.length) return;
    const current = bakedAt(slideIndex);
    if (!current) return;

    if (!inTransition) {
      drawBaked(current, 1.02, 1);
      if (t - phaseStart >= HOLD_MS) {
        inTransition = true;
        transFrom = slideIndex;
        transTo = (slideIndex + 1) % slides.length;
        phaseStart = t;
      }
      return;
    }

    const rawP = Math.min(1, (t - phaseStart) / TRANS_MS);
    drawShatter(bakedAt(transFrom), bakedAt(transTo), easeInOutCubic(rawP), w * 0.5, h * 0.5);
    if (rawP >= 1) {
      slideIndex = transTo;
      inTransition = false;
      phaseStart = t;
    }
  }

  function tick(t) {
    if (!running || !ctx) return;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#010103";
    ctx.fillRect(0, 0, w, h);
    drawSlides(t);
    raf = requestAnimationFrame(tick);
  }

  async function start() {
    if (running || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    canvas = document.getElementById("film-art-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d", { alpha: false });
    slides = await loadSlides();
    if (slides.length < 2) return;
    slideIndex = 0;
    inTransition = false;
    phaseStart = performance.now();
    resize();
    running = true;
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    if (typeof ResizeObserver !== "undefined") {
      resizeObs = new ResizeObserver(resize);
      resizeObs.observe(canvas);
    }
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    if (resizeObs) {
      resizeObs.disconnect();
      resizeObs = null;
    }
    canvas = null;
    ctx = null;
    slides = [];
  }

  return { start, stop };
})();
