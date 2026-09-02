const LIMITS = {
  aspectFail: 0.03,
  lightWarn: 18,
  colorWarn: 28,
  pixelWarn: 0.05,
  zoneWarn: 0.08,
  centerRatio: 1.35,
  centerMin: 0.06,
  dhashWarn: 12,
  histWarn: 0.35
};

function pixelDelta(aSample, bSample) {
  if (!aSample || !bSample || aSample.length !== bSample.length) return null;
  let acc = 0;
  const pixels = aSample.length / 4;
  for (let i = 0; i < aSample.length; i += 4) {
    const dr = Math.abs(aSample[i] - bSample[i]);
    const dg = Math.abs(aSample[i + 1] - bSample[i + 1]);
    const db = Math.abs(aSample[i + 2] - bSample[i + 2]);
    acc += (dr + dg + db) / (3 * 255);
  }
  return acc / pixels;
}

function colorDistance(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function centerDrift(anchor, item, globalPixel, limits) {
  const size = SAMPLE;
  const m = Math.floor(size * 0.3);
  let acc = 0;
  let n = 0;
  for (let y = m; y < size - m; y++) {
    for (let x = m; x < size - m; x++) {
      const i = (y * size + x) * 4;
      acc += (
        Math.abs(anchor.sample[i] - item.sample[i]) +
        Math.abs(anchor.sample[i + 1] - item.sample[i + 1]) +
        Math.abs(anchor.sample[i + 2] - item.sample[i + 2])
      ) / (3 * 255);
      n++;
    }
  }
  const centerPx = n ? acc / n : 0;
  const lumDelta = Math.abs(item.center.lum - anchor.center.lum);
  const ratio = globalPixel > 0.001 ? centerPx / globalPixel : centerPx;
  const hot = centerPx >= limits.centerMin && ratio >= limits.centerRatio;
  const status = hot || lumDelta > limits.lightWarn * 0.85 ? "WARN" : "PASS";
  return { centerPx, ratio, lumDelta, status, hot };
}

function compareItems(item, anchor, t, limits, options) {
  options = options || {};
  limits = limits || LIMITS;
  if (!item || !anchor) return null;
  if (item.id === anchor.id) {
    return {
      verdict: "PASS",
      gates: [],
      pixel: 0,
      self: true
    };
  }

  const aspectDelta = Math.abs(item.aspect - anchor.aspect) / anchor.aspect;
  const lumDelta = Math.abs(item.stats.lum - anchor.stats.lum);
  const colDelta = colorDistance(item.stats, anchor.stats);
  const pixel = pixelDelta(item.sample, anchor.sample);
  const sameHash = item.hash === anchor.hash;
  const sameRes = item.width === anchor.width && item.height === anchor.height;
  const sameFormat = item.type === anchor.type;
  const pixelStatus = pixel != null && pixel >= limits.pixelWarn ? "WARN" : "PASS";

  const dDist = hammingHex(anchor.dhash, item.dhash);
  const dhashStatus = dDist <= 3 ? "PASS" : dDist >= limits.dhashWarn ? "WARN" : "PASS";

  const zoneCmp = compareZones(anchor, item, limits);
  const zoneStatus = zoneCmp.status;

  const centerCmp = centerDrift(anchor, item, pixel || 0, limits);
  const centerStatus = centerCmp.status;

  const histDrift = histogramDrift(anchor.histogram, item.histogram);
  const histStatus = histDrift >= limits.histWarn ? "WARN" : "PASS";

  const gates = [
    gate("aspect", aspectDelta > LIMITS.aspectFail ? "FAIL" : "PASS", t.gateAspect, aspectDelta > LIMITS.aspectFail ? t.aspectFail : t.aspectOk, `${(aspectDelta * 100).toFixed(1)} %`),
    gate("res", sameRes ? "PASS" : "WARN", t.gateRes, sameRes ? t.resSame : t.resDiff, `${item.width}×${item.height}`),
    gate("format", sameFormat ? "PASS" : "WARN", t.gateFormat, sameFormat ? t.formatSame : t.formatDiff, prettyType(item.type)),
    gate("hash", "PASS", t.gateHash, sameHash ? t.sameHash : t.hashDiff, item.hash.slice(0, 12)),
    gate("dhash", dhashStatus, t.gateDhash, dhashStatus === "WARN" ? t.dhashWarn : t.dhashOk, `Δ${dDist}`),
    gate("pixel", pixelStatus, t.gatePixel, pixelStatus === "WARN" ? t.pixelWarn : t.pixelOk, pixel == null ? "—" : `${(pixel * 100).toFixed(1)} %`)
  ];

  if (options.faceGate) {
    const faceCmp = compareFaceGate(anchor, item, limits, t);
    if (faceCmp) gates.push(faceCmp.gate);
  }

  gates.push(
    gate("zone", zoneStatus, t.gateZone, zoneStatus === "WARN"
      ? t.zoneWarnDetail.replace("{z}", zoneCmp.hot ? zoneCmp.hot.label : "?").replace("{px}", zoneCmp.pct.toFixed(1))
      : (limits.zoneFocus ? t.zoneOkBrand : t.zoneOk), `${zoneCmp.pct.toFixed(1)} %`),
    gate("center", centerStatus, t.gateCenter, centerStatus === "WARN" ? t.centerWarn : t.centerOk, `${(centerCmp.centerPx * 100).toFixed(1)} %`),
    gate("light", lumDelta > limits.lightWarn ? "WARN" : "PASS", t.gateLight, lumDelta > limits.lightWarn ? t.lightWarn : t.lightOk, `Δ${lumDelta.toFixed(1)}`),
    gate("color", colDelta > limits.colorWarn ? "WARN" : "PASS", t.gateColor, colDelta > limits.colorWarn ? t.colorWarn : t.colorOk, colDelta.toFixed(1)),
    gate("hist", histStatus, t.gateHist, histStatus === "WARN" ? t.histWarn : t.histOk, histDrift.toFixed(2))
  );

  return {
    verdict: worst(gates.map((g) => g.status)),
    gates,
    pixel,
    zoneHot: zoneCmp.hot,
    centerHot: centerCmp.hot,
    dhashDist: dDist,
    histDrift,
    self: false,
    sameHash
  };
}

function seriesVerdict(items, comparisons) {
  const used = items
    .map((item) => comparisons[item.id])
    .filter((cmp) => cmp && !cmp.self);
  if (!used.length) return "PASS";
  return worst(used.map((cmp) => cmp.verdict));
}

function countPixelDrift(items, comparisons, limits) {
  limits = limits || LIMITS;
  return items.filter((item) => {
    const cmp = comparisons[item.id];
    return cmp && !cmp.self && cmp.pixel != null && cmp.pixel >= limits.pixelWarn;
  }).length;
}

function worst(statuses) {
  if (statuses.includes("FAIL")) return "FAIL";
  if (statuses.includes("WARN")) return "WARN";
  return "PASS";
}

function gate(id, status, label, detail, value) {
  return { id, status, label, detail, value };
}

function prettyType(type) {
  return (type || "").replace("image/", "") || "unknown";
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function rasterizeToCanvas(img, cw, ch) {
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cw, ch);
  const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  return ctx.getImageData(0, 0, cw, ch);
}

async function drawHeatmapFull(canvas, anchorUrl, selectedUrl) {
  const [aImg, bImg] = await Promise.all([loadImage(anchorUrl), loadImage(selectedUrl)]);
  const maxSide = 520;
  const cw = Math.min(maxSide, Math.max(aImg.naturalWidth, bImg.naturalWidth));
  const ch = Math.min(maxSide, Math.max(aImg.naturalHeight, bImg.naturalHeight));
  const aData = rasterizeToCanvas(aImg, cw, ch);
  const bData = rasterizeToCanvas(bImg, cw, ch);
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  const out = ctx.createImageData(cw, ch);

  for (let i = 0, p = 0; i < aData.data.length; i += 4, p += 4) {
    const d = (
      Math.abs(aData.data[i] - bData.data[i]) +
      Math.abs(aData.data[i + 1] - bData.data[i + 1]) +
      Math.abs(aData.data[i + 2] - bData.data[i + 2])
    ) / 3;

    if (d < 4) {
      out.data[p] = 6;
      out.data[p + 1] = 8;
      out.data[p + 2] = 14;
    } else {
      const t = Math.min(1, d / 55);
      out.data[p] = Math.round(10 + t * 245);
      out.data[p + 1] = Math.round(t * 160);
      out.data[p + 2] = Math.round(30 - t * 25);
    }
    out.data[p + 3] = 255;
  }

  ctx.putImageData(out, 0, 0);
}

function drawZoneOverlay(canvas, anchor, selected, zoneHot, limits) {
  limits = limits || LIMITS;
  const size = SAMPLE;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const cell = Math.floor(size / GRID);
  ctx.fillStyle = "#0a0b0d";
  ctx.fillRect(0, 0, size, size);

  for (let zy = 0; zy < GRID; zy++) {
    for (let zx = 0; zx < GRID; zx++) {
      const idx = zy * GRID + zx;
      const az = anchor.zones[idx];
      const bz = selected.zones[idx];
      const px = zonePixelDelta(az, bz, anchor.sample, selected.sample, size);
      const inFocus = !limits.zoneFocus || limits.zoneFocus.includes(idx);
      const hot = inFocus && px >= limits.zoneWarn;
      ctx.fillStyle = !inFocus
        ? "rgba(60,65,75,0.35)"
        : hot ? "rgba(232,184,74,0.55)" : "rgba(62,207,142,0.18)";
      ctx.fillRect(zx * cell, zy * cell, cell, cell);
      ctx.strokeStyle = !inFocus ? "#3b4454" : hot ? "#e8b84a" : "#3ecf8e";
      ctx.lineWidth = hot ? 2 : 1;
      ctx.strokeRect(zx * cell + 0.5, zy * cell + 0.5, cell - 1, cell - 1);
      if (inFocus) {
        ctx.fillStyle = hot ? "#fff" : "#8b95a5";
        ctx.font = "9px sans-serif";
        ctx.fillText(`${(px * 100).toFixed(0)}%`, zx * cell + 4, zy * cell + 12);
      }
    }
  }

  if (zoneHot) {
    ctx.strokeStyle = "#c8f542";
    ctx.lineWidth = 2;
    ctx.strokeRect(zoneHot.zx * cell + 1, zoneHot.zy * cell + 1, cell - 2, cell - 2);
  }
}

function countVerdicts(items, comparisons) {
  const counts = { PASS: 0, WARN: 0, FAIL: 0 };
  items.forEach((item) => {
    const cmp = comparisons[item.id];
    if (!cmp || cmp.self) return;
    counts[cmp.verdict] += 1;
  });
  return counts;
}

function sortGates(gates) {
  const order = { FAIL: 0, WARN: 1, PASS: 2 };
  return [...gates].sort((a, b) => order[a.status] - order[b.status]);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function cropRect(img, zoneHot, pad) {
  pad = pad != null ? pad : 0.08;
  const cellW = img.width / GRID;
  const cellH = img.height / GRID;
  const x0 = zoneHot.zx * cellW;
  const y0 = zoneHot.zy * cellH;
  const w = cellW;
  const h = cellH;
  const px = Math.max(0, x0 - w * pad);
  const py = Math.max(0, y0 - h * pad);
  const pw = Math.min(img.width - px, w * (1 + pad * 2));
  const ph = Math.min(img.height - py, h * (1 + pad * 2));
  return { x: px, y: py, w: pw, h: ph };
}

async function drawRegionCrop(canvas, anchorUrl, selectedUrl, zoneHot, labels) {
  if (!zoneHot) throw new Error("no zone");
  const [aImg, bImg] = await Promise.all([loadImage(anchorUrl), loadImage(selectedUrl)]);
  const aRect = cropRect(aImg, zoneHot);
  const bRect = cropRect(bImg, zoneHot);
  const cropW = Math.max(aRect.w, bRect.w);
  const cropH = Math.max(aRect.h, bRect.h);
  const gap = 12;
  const labelH = 22;
  canvas.width = cropW * 2 + gap;
  canvas.height = cropH + labelH;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0a0b0d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#8b95a5";
  ctx.font = "11px sans-serif";
  ctx.fillText(labels.anchor, 4, 14);
  ctx.fillText(labels.series, cropW + gap + 4, 14);
  ctx.drawImage(aImg, aRect.x, aRect.y, aRect.w, aRect.h, 0, labelH, cropW, cropH);
  ctx.drawImage(bImg, bRect.x, bRect.y, bRect.w, bRect.h, cropW + gap, labelH, cropW, cropH);
  ctx.strokeStyle = "#c8f542";
  ctx.lineWidth = 2;
  ctx.strokeRect(0.5, labelH + 0.5, cropW - 1, cropH - 1);
  ctx.strokeRect(cropW + gap + 0.5, labelH + 0.5, cropW - 1, cropH - 1);
}
