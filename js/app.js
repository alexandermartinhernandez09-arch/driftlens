const MAX_IMAGES = 50;
const DEMO_VERSION = "320";
const DEMO_FILES = [
  "01-anchor.jpg",
  "02-inner-pulse.jpg",
  "03-butterfly-breath.jpg",
  "04-orbit-whisper.jpg",
  "05-leaf-unfolding.jpg",
  "06-center-bloom-warn.jpg",
  "07-left-wing-warn.jpg",
  "08-twilight-warn.jpg",
  "09-violet-drift-warn.jpg",
  "10-broken-frame-fail.jpg"
];

const state = {
  lang: "de",
  items: [],
  anchorId: null,
  selectedId: null,
  mode: "blink",
  comparisons: {},
  profile: "general",
  profileManual: "auto",
  profileDetected: "general",
  limits: { ...LIMITS },
  faceGate: false,
  faceGateBusy: false,
  blinkTimer: null,
  blinkOn: true,
  notice: "",
  loadProgress: null
};

const els = {
  heroTitle: document.getElementById("hero-title"),
  heroLead: document.getElementById("hero-lead"),
  heroFeatures: document.getElementById("hero-features"),
  usecasesTitle: document.getElementById("usecases-title"),
  usecaseGrid: document.getElementById("usecase-grid"),
  heroSubjects: document.getElementById("hero-subjects"),
  dropTitle: document.getElementById("drop-title"),
  dropHint: document.getElementById("drop-hint"),
  pickLabel: document.getElementById("btn-pick-label"),
  addLabel: document.getElementById("btn-add-label"),
  dropLimit: document.getElementById("drop-limit"),
  btnLang: document.getElementById("btn-lang"),
  btnExport: document.getElementById("btn-export"),
  btnClear: document.getElementById("btn-clear"),
  emptyNotice: document.getElementById("empty-notice"),
  empty: document.getElementById("empty"),
  work: document.getElementById("work"),
  drop: document.getElementById("drop"),
  btnDemo: document.getElementById("btn-demo"),
  fileInput: document.getElementById("file-input"),
  videoInput: document.getElementById("video-input"),
  fileAdd: document.getElementById("file-add"),
  fileAddVideo: document.getElementById("file-add-video"),
  btnVideoLabel: document.getElementById("btn-video-label"),
  btnAddVideoLabel: document.getElementById("btn-add-video-label"),
  filmTitle: document.getElementById("film-title"),
  inspectTitle: document.getElementById("inspect-title"),
  findingsTitle: document.getElementById("findings-title"),
  filmstrip: document.getElementById("filmstrip"),
  stage: document.getElementById("stage"),
  findings: document.getElementById("findings"),
  verdictBar: document.getElementById("verdict-bar"),
  inspectNote: document.getElementById("inspect-note"),
  blinkWrap: document.getElementById("blink-wrap"),
  sliderWrap: document.getElementById("slider-wrap"),
  blinkLabel: document.getElementById("blink-label"),
  sliderLabel: document.getElementById("slider-label"),
  blinkSpeed: document.getElementById("blink-speed"),
  wipe: document.getElementById("wipe"),
  footOffline: document.getElementById("foot-offline"),
  footPrivacy: document.getElementById("foot-privacy"),
  modeBlink: document.getElementById("mode-blink"),
  modeSlider: document.getElementById("mode-slider"),
  modeHeat: document.getElementById("mode-heat"),
  modeZones: document.getElementById("mode-zones"),
  modeRegion: document.getElementById("mode-region"),
  driftChart: document.getElementById("drift-chart"),
  driftTitle: document.getElementById("drift-title"),
  loadBar: document.getElementById("load-bar")
};

function paintLoadBar() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function updateLoadBar() {
  const bar = els.loadBar;
  if (!bar) return;
  const progress = state.loadProgress;
  if (!progress?.busy) {
    bar.classList.add("hidden");
    bar.setAttribute("aria-hidden", "true");
    return;
  }
  const pct = progress.total ? Math.round((progress.current / progress.total) * 100) : 0;
  const msg = t().loadingImages
    .replace("{n}", String(progress.current))
    .replace("{total}", String(progress.total));
  bar.classList.remove("hidden");
  bar.setAttribute("aria-hidden", "false");
  const track = bar.querySelector(".load-bar-track");
  const fill = bar.querySelector(".load-bar-fill");
  const textEl = bar.querySelector(".load-bar-text");
  if (fill) fill.style.width = `${pct}%`;
  if (track) track.setAttribute("aria-valuenow", String(pct));
  if (textEl) textEl.textContent = `${pct}% · ${msg}`;
}

function t() {
  return I18N[state.lang];
}

function isFileProtocol() {
  return location.protocol === "file:";
}

let demoEmbedPromise = null;

function ensureDemoEmbed() {
  if (typeof DEMO_B64 !== "undefined") return Promise.resolve();
  if (demoEmbedPromise) return demoEmbedPromise;
  demoEmbedPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "js/demo-embed.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("demo embed load failed"));
    document.head.appendChild(script);
  });
  return demoEmbedPromise;
}

function applyI18n() {
  const copy = t();
  document.documentElement.lang = state.lang;
  document.title = state.lang === "de"
    ? `${copy.brandName} — AI-Bildserien QA`
    : `${copy.brandName} — AI series QA`;
  renderHero(copy);
  els.pickLabel.textContent = copy.pick;
  els.btnDemo.textContent = copy.demo;
  els.addLabel.textContent = copy.add;
  if (els.btnVideoLabel) els.btnVideoLabel.textContent = copy.videoPick;
  if (els.btnAddVideoLabel) els.btnAddVideoLabel.textContent = copy.videoPick;
  els.dropLimit.textContent = copy.dropLimit;
  els.btnExport.textContent = copy.export;
  els.btnClear.textContent = copy.clear;
  els.btnLang.textContent = state.lang.toUpperCase();
  els.filmTitle.textContent = copy.film;
  els.inspectTitle.textContent = copy.inspect;
  els.findingsTitle.textContent = copy.findings;
  els.inspectNote.textContent = copy.inspectNote;
  els.blinkLabel.textContent = copy.blinkSpeed;
  els.sliderLabel.textContent = copy.sliderPos;
  els.footOffline.textContent = copy.offline;
  if (els.footPrivacy) {
    els.footPrivacy.textContent = copy.privacyLink;
    els.footPrivacy.href = state.lang === "en" ? "privacy.html?lang=en" : "privacy.html";
  }
  els.modeBlink.textContent = copy.blink;
  els.modeSlider.textContent = copy.slider;
  els.modeHeat.textContent = copy.heat;
  if (els.modeZones) els.modeZones.textContent = copy.zones;
  if (els.modeRegion) els.modeRegion.textContent = copy.modeRegion;
  if (els.driftTitle) els.driftTitle.textContent = copy.driftChart;
  onboard.applyI18n(copy);
  feedback.applyI18n(copy);
  render();
}

function initOnboard() {
  onboard.init(t());
  feedback.init(t());
}

function renderHero(copy) {
  if (!els.heroTitle) return;
  els.heroTitle.textContent = copy.heroTitle;
  els.heroLead.textContent = copy.heroLead;
  els.dropTitle.textContent = copy.dropTitle;
  els.dropHint.textContent = copy.dropHint;
  els.dropLimit.textContent = copy.dropLimit;
  els.btnDemo.textContent = copy.demo;

  if (els.heroFeatures) {
    els.heroFeatures.innerHTML = copy.features.map((f) => `
      <li>
        <strong>${escapeHtml(f.title)}</strong>
        <span>${escapeHtml(f.desc)}</span>
      </li>
    `).join("");
  }

  if (els.usecasesTitle) els.usecasesTitle.textContent = copy.usecasesTitle;
  if (els.usecaseGrid) {
    const cases = [
      { icon: "◆", title: copy.useLogo, desc: copy.useLogoDesc, tone: "brand" },
      { icon: "◎", title: copy.usePortrait, desc: copy.usePortraitDesc, tone: "human" },
      { icon: "▣", title: copy.useProduct, desc: copy.useProductDesc, tone: "product" },
      { icon: "✦", title: copy.useComic, desc: copy.useComicDesc, tone: "comic" }
    ];
    els.usecaseGrid.innerHTML = cases.map((item) => `
      <article class="usecase ${item.tone}">
        <span class="usecase-icon" aria-hidden="true">${item.icon}</span>
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.desc)}</p>
      </article>
    `).join("");
  }

  if (els.heroSubjects) {
    els.heroSubjects.innerHTML = `
      <strong>${escapeHtml(copy.subjectsTitle)}</strong>
      <p>${escapeHtml(copy.subjectsBody)}</p>
    `;
  }
}

function refreshProfile() {
  const detected = detectSeriesProfile(state.items);
  state.profile = resolveProfile(state.items, state.profileManual);
  state.profileDetected = detected;
  state.limits = activeLimits(state.profile);
}

function currentAnchor() {
  return state.items.find((item) => item.id === state.anchorId) || state.items[0] || null;
}

function currentSelected() {
  return state.items.find((item) => item.id === state.selectedId) || null;
}

function compareOptions() {
  return { faceGate: state.faceGate };
}

function recompute() {
  const anchor = currentAnchor();
  refreshProfile();
  state.comparisons = {};
  if (!anchor) return;
  const options = compareOptions();
  state.items.forEach((item) => {
    state.comparisons[item.id] = compareItems(item, anchor, t(), state.limits, options);
  });
}

async function loadDemoAsset(filename) {
  const mime = guessType(filename);

  if (isFileProtocol()) {
    const dataUrl = typeof DEMO_B64 !== "undefined" ? DEMO_B64[filename] : null;
    if (!dataUrl) throw new Error(`demo embed missing: ${filename}`);
    const resp = await fetch(dataUrl);
    const blob = await resp.blob();
    return new File([blob], filename, { type: mime });
  }

  const url = `assets/demo/${filename}?v=${DEMO_VERSION}`;
  try {
    const resp = await fetch(url);
    if (resp.ok) {
      const blob = await resp.blob();
      return new File([blob], filename, { type: blob.type || mime });
    }
  } catch {
    /* fall through to image fallback */
  }

  const img = new Image();
  img.decoding = "async";
  img.src = `assets/demo/${filename}`;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d").drawImage(img, 0, 0);
  const blob = await canvasToBlob(canvas, mime);
  return new File([blob], filename, { type: mime });
}

async function makeDemoFiles() {
  if (isFileProtocol()) await ensureDemoEmbed();
  const copy = t();
  const results = await Promise.allSettled(DEMO_FILES.map((name) => loadDemoAsset(name)));
  return results
    .filter((entry) => entry.status === "fulfilled")
    .map((entry, index) => {
      const file = entry.value;
      const label = copy.demoImage.replace("{n}", String(index + 1).padStart(2, "0"));
      const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".jpg";
      const displayName = `${label}${ext}`;
      return new File([file], displayName, { type: file.type });
    });
}

async function expandIncoming(fileList) {
  const expanded = [];
  for (const file of fileList) {
    if (isVideoFile(file)) {
      state.notice = t().videoExtracting;
      render();
      try {
        const frames = await extractVideoFrames(file);
        frames.forEach((frame) => {
          frame._fromVideo = true;
          expanded.push(frame);
        });
      } catch {
        state.notice = t().skipped;
      }
    } else if (isImageFile(file)) {
      expanded.push(file);
    }
  }
  return expanded;
}

async function addFiles(fileList) {
  const expanded = await expandIncoming([...fileList]);
  const skipped = [...fileList].length - expanded.length;
  const room = MAX_IMAGES - state.items.length;
  const take = expanded.slice(0, Math.max(0, room));
  const overflow = expanded.length > take.length;
  const total = take.length;

  if (!total) {
    if (skipped) state.notice = t().skipped;
    if (overflow) state.notice = t().tooMany;
    render();
    return;
  }

  state.loadProgress = { current: 0, total, busy: true };
  state.notice = t().loadingImages.replace("{n}", "0").replace("{total}", String(total));
  render();
  updateLoadBar();
  await paintLoadBar();

  for (let i = 0; i < take.length; i++) {
    const file = take[i];
    state.loadProgress.current = i + 1;
    state.notice = t().loadingImages
      .replace("{n}", String(i + 1))
      .replace("{total}", String(total));
    updateLoadBar();
    await paintLoadBar();

    try {
      const item = await analyzeFile(file, {
        faceGate: state.faceGate,
        fromVideo: !!file._fromVideo
      });
      const duplicate = state.items.some(
        (existing) => existing.hash === item.hash && existing.name === item.name && existing.size === item.size
      );
      if (duplicate) {
        revokeItemUrls(item);
        continue;
      }

      state.items.push(item);
      if (!state.anchorId) state.anchorId = item.id;
      recompute();
      if (!state.selectedId || state.selectedId === state.anchorId) {
        const driftPick = pickHighestDrift();
        state.selectedId = driftPick?.id
          || state.items.find((entry) => entry.id !== state.anchorId)?.id
          || state.items[0]?.id
          || null;
      }
      render();
    } catch {
      state.notice = t().skipped;
      render();
    }
  }

  state.loadProgress = null;
  updateLoadBar();
  state.notice = "";
  if (overflow) state.notice = t().tooMany;
  else if (skipped) state.notice = t().skipped;
  render();
}

function clearAll() {
  stopBlink();
  state.items.forEach(revokeItemUrls);
  state.items = [];
  state.anchorId = null;
  state.selectedId = null;
  state.comparisons = {};
  state.profile = "general";
  state.profileManual = "auto";
  state.profileDetected = "general";
  state.limits = { ...LIMITS };
  state.faceGate = false;
  state.faceGateBusy = false;
  state.notice = "";
  state.loadProgress = null;
  updateLoadBar();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function applyMedianAnchor() {
  const suggested = suggestMedianAnchor(state.items);
  if (!suggested) return;
  const item = state.items.find((entry) => entry.id === suggested);
  state.anchorId = suggested;
  if (state.selectedId === suggested) {
    state.selectedId = state.items.find((other) => other.id !== suggested)?.id || suggested;
  }
  recompute();
  state.notice = item ? t().anchorSuggested.replace("{name}", item.name) : "";
  render();
}

async function toggleFaceGate(enabled) {
  if (enabled === state.faceGate) return;
  state.faceGate = enabled;
  if (!state.items.length) {
    render();
    return;
  }
  if (enabled) {
    state.faceGateBusy = true;
    state.notice = t().faceLoading;
    render();
    try {
      await ensureFaceDetector();
      for (const item of state.items) {
        const res = await fetch(item.url);
        const blob = await res.blob();
        const bitmap = await createImageBitmap(blob);
        await enrichFaceData(item, bitmap);
        bitmap.close();
      }
    } catch {
      state.faceGate = false;
      state.notice = t().faceLoadError;
      state.faceGateBusy = false;
      render();
      return;
    }
    state.faceGateBusy = false;
  }
  recompute();
  state.notice = "";
  render();
}

function renderLoadingShell() {
  const copy = t();
  const progress = state.loadProgress;
  const pct = progress?.total ? Math.round((progress.current / progress.total) * 100) : 0;
  els.verdictBar.innerHTML = `
    <span class="counts">${escapeHtml(state.notice || copy.loadingImages.replace("{n}", "0").replace("{total}", "0"))}</span>
    <div class="load-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
      <span style="width:${pct}%"></span>
    </div>
  `;
  els.filmstrip.innerHTML = "";
  els.stage.innerHTML = `<div class="stage-loading">${escapeHtml(state.notice || "")}</div>`;
  if (els.driftChart) els.driftChart.innerHTML = "";
  if (els.findings) els.findings.innerHTML = "";
}

function render() {
  const hasItems = state.items.length > 0;
  const loading = !!state.loadProgress?.busy;
  els.empty.classList.toggle("hidden", hasItems || loading);
  els.empty.toggleAttribute("hidden", hasItems || loading);
  els.empty.setAttribute("aria-hidden", hasItems || loading ? "true" : "false");
  els.work.classList.toggle("hidden", !hasItems && !loading);
  els.btnExport.classList.toggle("hidden", !hasItems);
  els.btnClear.classList.toggle("hidden", !hasItems && !loading);
  if (els.emptyNotice) {
    if (!hasItems && !loading && state.notice) {
      els.emptyNotice.textContent = state.notice;
      els.emptyNotice.classList.remove("hidden");
    } else {
      els.emptyNotice.textContent = "";
      els.emptyNotice.classList.add("hidden");
    }
  }
  if (hasItems) {
    heroBg.stop();
    workPanelBg.start();
  } else if (!loading) {
    workPanelBg.stop();
    heroBg.start();
  } else {
    workPanelBg.stop();
  }
  if (!hasItems && !loading) return;
  if (loading && !hasItems) {
    renderLoadingShell();
    return;
  }
  renderVerdict();
  renderFilm();
  renderDriftChart();
  renderInspect();
  renderFindings();
}

function renderDriftChart() {
  if (!els.driftChart) return;
  const anchor = currentAnchor();
  els.driftChart.innerHTML = "";
  if (!anchor || state.items.length < 2) return;

  state.items.forEach((item) => {
    const cmp = state.comparisons[item.id];
    if (!cmp || cmp.self) return;
    const pct = cmp.pixel != null ? cmp.pixel * 100 : 0;
    const bar = document.createElement("button");
    bar.type = "button";
    bar.className = `drift-bar ${cmp.verdict.toLowerCase()}${item.id === state.selectedId ? " on" : ""}`;
    bar.title = item.name;
    bar.innerHTML = `
      <span class="drift-fill" style="height:${Math.min(100, pct * 8)}%"></span>
      <span class="drift-val">${pct.toFixed(0)}%</span>
    `;
    bar.addEventListener("click", () => {
      state.selectedId = item.id;
      render();
    });
    els.driftChart.appendChild(bar);
  });
}

function pickHighestDrift() {
  const anchor = currentAnchor();
  if (!anchor || state.items.length < 2) return null;
  let best = null;
  let bestPixel = -1;
  state.items.forEach((item) => {
    if (item.id === anchor.id) return;
    const cmp = state.comparisons[item.id];
    if (!cmp || cmp.pixel == null) return;
    if (cmp.pixel > bestPixel) {
      bestPixel = cmp.pixel;
      best = item;
    }
  });
  return best;
}

function renderVerdict() {
  const copy = t();
  const series = seriesVerdict(state.items, state.comparisons);
  const counts = countVerdicts(state.items, state.comparisons);
  const driftCount = countPixelDrift(state.items, state.comparisons, state.limits);
  const driftHint = driftCount > 0
    ? `<span class="counts drift-hint">${escapeHtml(copy.driftHint.replace("{n}", driftCount))}</span>`
    : "";
  const profileBadge = state.items.length
    ? `<label class="profile-picker counts">
        <span>${escapeHtml(copy.profileLabel)}</span>
        <select id="profile-select" class="profile-select" aria-label="${escapeHtml(copy.profileLabel)}">
          ${PROFILE_IDS.map((id) => `<option value="${id}"${state.profileManual === id ? " selected" : ""}>${escapeHtml(profileLabel(copy, id))}</option>`).join("")}
        </select>
        <span class="profile-active">${escapeHtml(profileDisplayLabel(copy, state.profileManual, state.profileDetected || state.profile))}</span>
      </label>`
    : "";
  const tools = state.items.length >= 3
    ? `<button type="button" class="btn btn-small" id="btn-median-anchor">${escapeHtml(copy.suggestAnchor)}</button>`
    : "";
  const faceToggle = `<label class="face-toggle counts" title="${escapeHtml(copy.faceGateHint)}">
      <input type="checkbox" id="face-gate-toggle"${state.faceGate ? " checked" : ""}${state.faceGateBusy ? " disabled" : ""} />
      ${escapeHtml(copy.faceGate)}
    </label>`;
  els.verdictBar.innerHTML = `
    <span class="badge ${series.toLowerCase()}">${copy.series} ${copy[series.toLowerCase()]}</span>
    <span class="counts">${state.items.length} ${copy.images} · ${counts.FAIL} FAIL · ${counts.WARN} WARN · ${counts.PASS} PASS</span>
    <button type="button" class="btn btn-small" id="btn-new-series">${escapeHtml(copy.clear)}</button>
    ${profileBadge}
    ${tools}
    ${faceToggle}
    ${driftHint}
    ${state.notice ? `<span class="counts">${escapeHtml(state.notice)}</span>` : ""}
    ${state.loadProgress?.busy ? `
      <div class="load-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round((state.loadProgress.current / state.loadProgress.total) * 100)}">
        <span style="width:${Math.round((state.loadProgress.current / state.loadProgress.total) * 100)}%"></span>
      </div>` : ""}
  `;
  const profileSelect = document.getElementById("profile-select");
  if (profileSelect) {
    profileSelect.addEventListener("change", (event) => {
      state.profileManual = event.target.value;
      recompute();
      render();
    });
  }
  const medianBtn = document.getElementById("btn-median-anchor");
  if (medianBtn) {
    medianBtn.addEventListener("click", () => applyMedianAnchor());
  }
  const newSeriesBtn = document.getElementById("btn-new-series");
  if (newSeriesBtn) {
    newSeriesBtn.addEventListener("click", clearAll);
  }
  const faceToggleInput = document.getElementById("face-gate-toggle");
  if (faceToggleInput) {
    faceToggleInput.addEventListener("change", (event) => {
      toggleFaceGate(event.target.checked);
    });
  }
}

function renderFilm() {
  const copy = t();
  els.filmstrip.innerHTML = "";
  state.items.forEach((item) => {
    const cmp = state.comparisons[item.id];
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card";
    if (item.id === state.selectedId) card.classList.add("selected");
    if (item.id === state.anchorId) card.classList.add("anchor");
    if (cmp && !cmp.self) card.classList.add(cmp.verdict.toLowerCase());
    const role = item.id === state.anchorId ? copy.setAnchor : (cmp ? cmp.verdict : "");
    const px = cmp && !cmp.self && cmp.pixel != null ? ` · ${(cmp.pixel * 100).toFixed(1)}% px` : "";
    card.innerHTML = `
      <img alt="" src="${item.thumbUrl || item.url}" loading="lazy" decoding="async" />
      <span class="meta">
        <span class="name">${escapeHtml(item.name)}</span>
        ${item.width}×${item.height} · ${role}${px}
      </span>
    `;
    card.addEventListener("click", () => {
      state.selectedId = item.id;
      render();
    });
    card.addEventListener("dblclick", () => {
      state.anchorId = item.id;
      if (state.selectedId === item.id) {
        state.selectedId = state.items.find((other) => other.id !== item.id)?.id || item.id;
      }
      recompute();
      render();
    });
    els.filmstrip.appendChild(card);
  });
}

function renderInspect() {
  const copy = t();
  const anchor = currentAnchor();
  const selected = currentSelected();
  stopBlink();
  els.stage.innerHTML = "";
  els.blinkWrap.classList.toggle("hidden", state.mode !== "blink");
  els.sliderWrap.classList.toggle("hidden", state.mode !== "slider");

  document.querySelectorAll(".mode").forEach((btn) => {
    btn.classList.toggle("on", btn.dataset.mode === state.mode);
  });

  if (!anchor) return;
  if (!selected || selected.id === anchor.id) {
    const img = document.createElement("img");
    img.src = anchor.url;
    img.alt = anchor.name;
    els.stage.appendChild(img);
    const note = document.createElement("div");
    note.className = "stage-empty";
    note.textContent = copy.noCompare;
    els.stage.appendChild(note);
    return;
  }

  if (state.mode === "heat") {
    renderHeatmapAsync(anchor, selected);
    return;
  }

  if (state.mode === "zones") {
    const canvas = document.createElement("canvas");
    canvas.className = "zone-canvas";
    const cmp = state.comparisons[selected.id];
    drawZoneOverlay(canvas, anchor, selected, cmp ? cmp.zoneHot : null, state.limits);
    els.stage.appendChild(canvas);
    appendPixelBadge(cmp);
    return;
  }

  if (state.mode === "region") {
    renderRegionAsync(anchor, selected);
    return;
  }

  const cmp = state.comparisons[selected.id];
  const a = document.createElement("img");
  const b = document.createElement("img");
  a.src = anchor.url;
  b.src = selected.url;
  a.alt = anchor.name;
  b.alt = selected.name;
  els.stage.appendChild(a);
  els.stage.appendChild(b);
  appendPixelBadge(cmp);

  if (state.mode === "slider") {
    b.classList.add("wipe-top");
    applyWipe();
    return;
  }

  startBlink(a, b);
}

async function renderRegionAsync(anchor, selected) {
  const copy = t();
  const cmp = state.comparisons[selected.id];
  if (!cmp || !cmp.zoneHot) {
    els.stage.innerHTML = `<div class="stage-empty">${escapeHtml(copy.noCompare)}</div>`;
    return;
  }
  els.stage.innerHTML = `<div class="stage-loading">${escapeHtml(copy.heatLoading)}</div>`;
  try {
    const canvas = document.createElement("canvas");
    canvas.className = "region-canvas";
    await drawRegionCrop(canvas, anchor.url, selected.url, cmp.zoneHot, {
      anchor: copy.setAnchor,
      series: copy.film
    });
    els.stage.innerHTML = "";
    els.stage.appendChild(canvas);
    appendPixelBadge(cmp);
  } catch {
    els.stage.innerHTML = `<div class="stage-empty">${escapeHtml(copy.heatError)}</div>`;
  }
}

async function renderHeatmapAsync(anchor, selected) {
  const copy = t();
  const cmp = state.comparisons[selected.id];
  els.stage.innerHTML = `<div class="stage-loading">${escapeHtml(copy.heatLoading)}</div>`;
  try {
    const canvas = document.createElement("canvas");
    canvas.className = "heat-canvas";
    await drawHeatmapFull(canvas, anchor.url, selected.url);
    els.stage.innerHTML = "";
    els.stage.appendChild(canvas);
    appendPixelBadge(cmp);
  } catch {
    els.stage.innerHTML = `<div class="stage-empty">${escapeHtml(copy.heatError)}</div>`;
  }
}

function appendPixelBadge(cmp) {
  if (!cmp || cmp.self) return;
  const wrap = document.createElement("div");
  wrap.className = "badge-row";
  if (cmp.pixel != null) {
    const pct = (cmp.pixel * 100).toFixed(1);
    const level = cmp.pixel >= state.limits.pixelWarn ? "warn" : "pass";
    const px = document.createElement("div");
    px.className = `pixel-badge ${level}`;
    px.textContent = `${t().pixelBadge} ${pct}%`;
    wrap.appendChild(px);
  }
  const warnCount = cmp.gates.filter((g) => g.status === "WARN").length;
  const failCount = cmp.gates.filter((g) => g.status === "FAIL").length;
  if (warnCount || failCount) {
    const gates = document.createElement("div");
    gates.className = `pixel-badge ${failCount ? "fail" : "warn"}`;
    gates.textContent = `${t().gatesBadge} ${failCount ? failCount + " FAIL" : warnCount + " WARN"}`;
    wrap.appendChild(gates);
  }
  els.stage.appendChild(wrap);
}

function applyWipe() {
  const top = els.stage.querySelector(".wipe-top");
  if (!top) return;
  const pct = 100 - Number(els.wipe.value);
  top.style.clipPath = `inset(0 ${pct}% 0 0)`;
}

function startBlink(a, b) {
  const tick = () => {
    state.blinkOn = !state.blinkOn;
    a.style.opacity = state.blinkOn ? "1" : "0";
    b.style.opacity = state.blinkOn ? "0" : "1";
  };
  a.style.opacity = "1";
  b.style.opacity = "0";
  state.blinkOn = true;
  state.blinkTimer = window.setInterval(tick, Number(els.blinkSpeed.value));
}

function stopBlink() {
  if (state.blinkTimer) {
    window.clearInterval(state.blinkTimer);
    state.blinkTimer = null;
  }
}

function renderFindings() {
  const copy = t();
  const selected = currentSelected();
  const cmp = selected ? state.comparisons[selected.id] : null;
  els.findings.innerHTML = "";
  if (!cmp || cmp.self) {
    els.findings.innerHTML = `<div class="finding"><p>${escapeHtml(copy.emptyFindings)}</p></div>`;
    return;
  }
  sortGates(cmp.gates).forEach((gate) => {
    const node = document.createElement("article");
    node.className = `finding ${gate.status.toLowerCase()}`;
    node.innerHTML = `
      <strong>${escapeHtml(gate.label)} · ${copy[gate.status.toLowerCase()]} · ${escapeHtml(gate.value)}</strong>
      <p>${escapeHtml(gate.detail)}</p>
    `;
    els.findings.appendChild(node);
  });
}

async function onFiles(files) {
  if (!files || !files.length) return;
  await addFiles(files);
}

function bind() {
  els.btnLang.addEventListener("click", () => {
    state.lang = state.lang === "de" ? "en" : "de";
    recompute();
    applyI18n();
  });
  els.btnClear.addEventListener("click", clearAll);
  els.btnExport.addEventListener("click", () => {
    const report = buildReport(state, t());
    downloadJSON(report);
    downloadHTML(report, t());
  });
  els.fileInput.addEventListener("change", (event) => {
    onFiles(event.target.files);
    event.target.value = "";
  });
  els.fileAdd.addEventListener("change", (event) => {
    onFiles(event.target.files);
    event.target.value = "";
  });
  if (els.videoInput) {
    els.videoInput.addEventListener("change", (event) => {
      onFiles(event.target.files);
      event.target.value = "";
    });
  }
  if (els.fileAddVideo) {
    els.fileAddVideo.addEventListener("change", (event) => {
      onFiles(event.target.files);
      event.target.value = "";
    });
  }
  els.btnDemo.addEventListener("click", async () => {
    state.notice = t().demoLoading;
    render();
    try {
      const files = await makeDemoFiles();
      if (files.length < 2) throw new Error("demo incomplete");
      clearAll();
      await addFiles(files);
      if (state.items.length < 2) throw new Error("demo analyze failed");
      state.notice = t().demoLoaded;
    } catch {
      state.notice = t().demoError;
    }
    render();
  });
  ["dragenter", "dragover"].forEach((name) => {
    els.drop.addEventListener(name, (event) => {
      event.preventDefault();
      els.drop.classList.add("over");
    });
  });
  ["dragleave", "drop"].forEach((name) => {
    els.drop.addEventListener(name, () => els.drop.classList.remove("over"));
  });
  els.drop.addEventListener("drop", async (event) => {
    event.preventDefault();
    const files = await collectDroppedFiles(event.dataTransfer);
    onFiles(files);
  });
  document.querySelectorAll(".mode").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mode = btn.dataset.mode;
      renderInspect();
    });
  });
  els.blinkSpeed.addEventListener("input", () => {
    if (state.mode === "blink") renderInspect();
  });
  els.wipe.addEventListener("input", applyWipe);
  document.addEventListener("keydown", (event) => {
    if (!state.items.length) return;
    if (event.key === "1") state.mode = "blink";
    if (event.key === "2") state.mode = "slider";
    if (event.key === "3") state.mode = "heat";
    if (event.key === "4") state.mode = "zones";
    if (event.key === "5") state.mode = "region";
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const index = state.items.findIndex((item) => item.id === state.selectedId);
      const next = event.key === "ArrowRight" ? index + 1 : index - 1;
      const item = state.items[(next + state.items.length) % state.items.length];
      state.selectedId = item.id;
    }
    if (event.key.toLowerCase() === "a" && state.selectedId) {
      state.anchorId = state.selectedId;
      recompute();
    }
    render();
  });
}

applyI18n();
bind();
initOnboard();
