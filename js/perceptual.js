const GRID = 3;

function grayAt(data, size, x, y) {
  const i = (y * size + x) * 4;
  return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
}

function computeDHash(sampleData, size) {
  const gw = 9;
  const gh = 8;
  const gray = [];
  for (let y = 0; y < gh; y++) {
    const row = [];
    for (let x = 0; x < gw; x++) {
      const sx = Math.floor((x / (gw - 1)) * (size - 1));
      const sy = Math.floor((y / (gh - 1)) * (size - 1));
      row.push(grayAt(sampleData, size, sx, sy));
    }
    gray.push(row);
  }
  let bits = "";
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw - 1; x++) {
      bits += gray[y][x] < gray[y][x + 1] ? "1" : "0";
    }
  }
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

function hammingHex(a, b) {
  if (!a || !b || a.length !== b.length) return 64;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    const n = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    dist += (n & 1) + ((n >> 1) & 1) + ((n >> 2) & 1) + ((n >> 3) & 1);
  }
  return dist;
}

function zoneGridStats(sampleData, size) {
  const cell = Math.floor(size / GRID);
  const zones = [];
  for (let zy = 0; zy < GRID; zy++) {
    for (let zx = 0; zx < GRID; zx++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      const x0 = zx * cell;
      const y0 = zy * cell;
      for (let y = y0; y < y0 + cell && y < size; y++) {
        for (let x = x0; x < x0 + cell && x < size; x++) {
          const i = (y * size + x) * 4;
          r += sampleData[i];
          g += sampleData[i + 1];
          b += sampleData[i + 2];
          n++;
        }
      }
      if (!n) continue;
      r /= n;
      g /= n;
      b /= n;
      zones.push({
        zx,
        zy,
        r,
        g,
        b,
        lum: 0.2126 * r + 0.7152 * g + 0.0722 * b,
        label: `${zx + 1}/${zy + 1}`
      });
    }
  }
  return zones;
}

function centerBandStats(sampleData, size) {
  const m = Math.floor(size * 0.3);
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = m; y < size - m; y++) {
    for (let x = m; x < size - m; x++) {
      const i = (y * size + x) * 4;
      r += sampleData[i];
      g += sampleData[i + 1];
      b += sampleData[i + 2];
      n++;
    }
  }
  if (!n) return { r: 0, g: 0, b: 0, lum: 0 };
  r /= n;
  g /= n;
  b /= n;
  return { r, g, b, lum: 0.2126 * r + 0.7152 * g + 0.0722 * b };
}

function luminanceHistogram(sampleData, size, bins) {
  const hist = new Array(bins).fill(0);
  const count = size * size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const lum = grayAt(sampleData, size, x, y);
      const bin = Math.min(bins - 1, Math.floor((lum / 255) * bins));
      hist[bin]++;
    }
  }
  return hist.map((v) => v / count);
}

function histogramDrift(h1, h2) {
  if (!h1 || !h2 || h1.length !== h2.length) return 1;
  let chi = 0;
  for (let i = 0; i < h1.length; i++) {
    const a = h1[i];
    const b = h2[i];
    const m = (a + b) / 2 || 0.0001;
    chi += ((a - b) ** 2) / m;
  }
  return chi / h1.length;
}

function zonePixelDelta(aZone, bZone, sampleA, sampleB, size) {
  const cell = Math.floor(size / GRID);
  const x0 = aZone.zx * cell;
  const y0 = aZone.zy * cell;
  let acc = 0;
  let n = 0;
  for (let y = y0; y < y0 + cell && y < size; y++) {
    for (let x = x0; x < x0 + cell && x < size; x++) {
      const i = (y * size + x) * 4;
      acc += (
        Math.abs(sampleA[i] - sampleB[i]) +
        Math.abs(sampleA[i + 1] - sampleB[i + 1]) +
        Math.abs(sampleA[i + 2] - sampleB[i + 2])
      ) / (3 * 255);
      n++;
    }
  }
  return n ? acc / n : 0;
}

function compareZones(anchor, item, limits) {
  if (!anchor.zones || !item.zones) return { worst: 0, hot: null, status: "PASS", pct: 0 };
  const focus = limits.zoneFocus || null;
  let worst = 0;
  let hot = null;
  anchor.zones.forEach((az, idx) => {
    if (focus && !focus.includes(idx)) return;
    const bz = item.zones[idx];
    if (!bz) return;
    const px = zonePixelDelta(az, bz, anchor.sample, item.sample, SAMPLE);
    const col = colorDistance(az, bz);
    if (px > worst) {
      worst = px;
      hot = { ...az, px, col };
    }
  });
  const status = worst >= limits.zoneWarn ? "WARN" : "PASS";
  return { worst, hot, status, pct: worst * 100 };
}

function enrichSample(sampleData, size) {
  return {
    dhash: computeDHash(sampleData, size),
    zones: zoneGridStats(sampleData, size),
    center: centerBandStats(sampleData, size),
    histogram: luminanceHistogram(sampleData, size, 16)
  };
}
