const COMPASS_KEY = "driftlens_compass_v1";

const onboard = (() => {
  let step = 0;
  let open = false;
  let els = {};

  function steps(copy) {
    return copy.compassSteps || [];
  }

  function mount() {
    els.root = document.getElementById("compass-dialog");
    els.title = document.getElementById("compass-title");
    els.body = document.getElementById("compass-body");
    els.tip = document.getElementById("compass-tip");
    els.dots = document.getElementById("compass-dots");
    els.prev = document.getElementById("compass-prev");
    els.next = document.getElementById("compass-next");
    els.skip = document.getElementById("compass-skip");
    els.close = document.getElementById("compass-close");
    els.fab = document.getElementById("btn-compass");
    els.headerBtn = document.getElementById("btn-compass-header");

    [els.fab, els.headerBtn].filter(Boolean).forEach((btn) => {
      btn.addEventListener("click", () => show());
    });
    els.prev.addEventListener("click", () => go(step - 1));
    els.next.addEventListener("click", () => {
      const total = steps(window.__compassCopy || { compassSteps: [] }).length;
      if (step >= total - 1) finish(true);
      else go(step + 1);
    });
    els.skip.addEventListener("click", () => finish(true));
    els.close.addEventListener("click", () => hide());
    els.root.addEventListener("click", (event) => {
      if (event.target === els.root) hide();
    });
  }

  function renderStep(copy) {
    window.__compassCopy = copy;
    const list = steps(copy);
    const current = list[step];
    if (!current) return;

    els.title.textContent = current.title;
    els.body.textContent = current.body;
    const kicker = document.getElementById("compass-kicker");
    if (kicker && copy.compassKicker) kicker.textContent = copy.compassKicker;
    els.tip.textContent = current.tip || "";
    els.tip.classList.toggle("hidden", !current.tip);

    els.dots.innerHTML = list
      .map((_, idx) => `<span class="compass-dot${idx === step ? " on" : ""}"></span>`)
      .join("");

    els.prev.disabled = step === 0;
    els.next.textContent = step >= list.length - 1 ? copy.compassDone : copy.compassNext;
    els.skip.textContent = copy.compassSkip;
  }

  function go(index) {
    const copy = window.__compassCopy;
    const list = steps(copy);
    step = Math.max(0, Math.min(index, list.length - 1));
    renderStep(copy);
  }

  function show(startAt) {
    open = true;
    step = startAt || 0;
    els.root.classList.remove("hidden");
    els.root.setAttribute("aria-hidden", "false");
    document.body.classList.add("compass-open");
    renderStep(window.__compassCopy);
  }

  function hide() {
    open = false;
    els.root.classList.add("hidden");
    els.root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("compass-open");
  }

  function finish(remember) {
    if (remember) localStorage.setItem(COMPASS_KEY, "1");
    hide();
  }

  function applyI18n(copy) {
    window.__compassCopy = copy;
    if (els.skip) els.skip.textContent = copy.compassSkip;
    if (open) renderStep(copy);
    if (els.fab) els.fab.setAttribute("aria-label", copy.compassOpen);
    if (els.headerBtn) els.headerBtn.setAttribute("aria-label", copy.compassOpen);
  }

  function maybeAutoOpen(copy) {
    if (localStorage.getItem(COMPASS_KEY)) return;
    window.setTimeout(() => show(0), 600);
  }

  function init(copy) {
    mount();
    applyI18n(copy);
    maybeAutoOpen(copy);
  }

  return { init, applyI18n, show };
})();
