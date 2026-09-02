const PROFILE_LIMITS = {
  general: {
    pixelWarn: 0.05,
    zoneWarn: 0.08,
    centerRatio: 1.35,
    centerMin: 0.06,
    dhashWarn: 12,
    histWarn: 0.35
  },
  human: {
    pixelWarn: 0.04,
    zoneWarn: 0.06,
    centerRatio: 1.25,
    centerMin: 0.045,
    dhashWarn: 10,
    histWarn: 0.28,
    faceWarn: 0.07
  },
  brand: {
    pixelWarn: 0.07,
    zoneWarn: 0.12,
    zoneFocus: [1, 4, 5, 7],
    centerRatio: 1.55,
    centerMin: 0.10,
    dhashWarn: 13,
    histWarn: 0.32
  },
  product: {
    pixelWarn: 0.05,
    zoneWarn: 0.09,
    centerRatio: 1.4,
    centerMin: 0.07,
    dhashWarn: 14,
    histWarn: 0.38
  }
};

const PROFILE_IDS = ["auto", "general", "human", "brand", "product"];

function avg(nums) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function avgColor(zones, indices) {
  const picked = indices.map((idx) => zones[idx]).filter(Boolean);
  if (!picked.length) return { r: 0, g: 0, b: 0 };
  return {
    r: avg(picked.map((z) => z.r)),
    g: avg(picked.map((z) => z.g)),
    b: avg(picked.map((z) => z.b))
  };
}

function colorDistanceRgb(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function visualBrandScore(item) {
  if (!item.zones || item.zones.length < 9) return 0;
  const corners = [0, 2, 6, 8];
  const focus = [1, 4, 5];
  const cornerLum = avg(corners.map((idx) => item.zones[idx].lum));
  const focusLum = avg(focus.map((idx) => item.zones[idx].lum));
  const lumContrast = Math.abs(focusLum - cornerLum);
  const colDist = colorDistanceRgb(avgColor(item.zones, corners), avgColor(item.zones, focus));
  return lumContrast + colDist * 0.35;
}

function visualBrandLikely(items) {
  if (!items.length) return false;
  const sample = items.slice(0, Math.min(5, items.length));
  const scores = sample.map(visualBrandScore);
  return avg(scores) >= 14;
}

function detectSeriesProfile(items) {
  const text = items.map((item) => item.name).join(" ").toLowerCase();
  if (/\b(mensch|human|person|frau|woman|mann|man|portrait|gesicht|face|charakter|character|anime|figur|figure|comic|manga|cartoon|toon|sprite|avatar|held|heroine|npc)\b/.test(text)) {
    return "human";
  }
  if (/\b(tier|animal|pet|hund|dog|cat|katze|vogel|bird|pferd|horse|fuchs|fox|wolf|drache|dragon|creature|kreatur)\b/.test(text)) {
    return "human";
  }
  if (/\b(produkt|product|flakon|bottle|packaging|mockup|listing|parfum|perfume|box|etikett|label)\b/.test(text)) {
    return "product";
  }
  if (/\b(logo|brand|marke|lounge|lizard|sign|schild|emblem|cover|banner|wordmark|typography|title|schrift)\b/.test(text)) {
    return "brand";
  }
  if (visualBrandLikely(items)) return "brand";
  return "general";
}

function resolveProfile(items, manual) {
  if (manual && manual !== "auto") return manual;
  return detectSeriesProfile(items);
}

function limitsForProfile(profile) {
  return PROFILE_LIMITS[profile] || PROFILE_LIMITS.general;
}

function activeLimits(profile) {
  return { ...LIMITS, ...limitsForProfile(profile) };
}