const feedback = (() => {
  let els = {};
  let copy = null;

  function buildReport(message) {
    const version = document.getElementById("foot-version")?.textContent?.trim() || "unknown";
    return [
      "DriftLens Feedback",
      `Version: ${version}`,
      `Language: ${document.documentElement.lang || "?"}`,
      `Online: ${navigator.onLine}`,
      `Device: ${navigator.userAgent}`,
      "",
      message.trim()
    ].join("\n");
  }

  function mount() {
    els.root = document.getElementById("feedback-dialog");
    els.title = document.getElementById("feedback-title");
    els.lead = document.getElementById("feedback-lead");
    els.textarea = document.getElementById("feedback-text");
    els.meta = document.getElementById("feedback-meta");
    els.notice = document.getElementById("feedback-notice");
    els.send = document.getElementById("feedback-send");
    els.cancel = document.getElementById("feedback-cancel");
    els.btn = document.getElementById("btn-feedback");

    if (els.btn) els.btn.addEventListener("click", () => show());
    if (els.cancel) els.cancel.addEventListener("click", () => hide());
    if (els.send) els.send.addEventListener("click", () => submit());
    if (els.root) {
      els.root.addEventListener("click", (event) => {
        if (event.target === els.root) hide();
      });
    }
  }

  function applyI18n(nextCopy) {
    copy = nextCopy;
    if (els.btn) els.btn.textContent = copy.feedbackBtn;
    if (els.title) els.title.textContent = copy.feedbackTitle;
    if (els.lead) els.lead.textContent = copy.feedbackLead;
    if (els.textarea) els.textarea.placeholder = copy.feedbackPlaceholder;
    if (els.meta) els.meta.textContent = copy.feedbackMeta;
    if (els.send) els.send.textContent = copy.feedbackSend;
    if (els.cancel) els.cancel.textContent = copy.feedbackCancel;
  }

  function show() {
    if (!els.root) return;
    els.notice.textContent = "";
    els.textarea.value = "";
    els.root.classList.remove("hidden");
    els.root.setAttribute("aria-hidden", "false");
    document.body.classList.add("compass-open");
    els.textarea.focus();
  }

  function hide() {
    if (!els.root) return;
    els.root.classList.add("hidden");
    els.root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("compass-open");
  }

  async function submit() {
    if (!copy) return;
    const message = els.textarea.value.trim();
    if (!message) {
      els.notice.textContent = copy.feedbackEmpty;
      els.notice.style.color = "var(--warn)";
      return;
    }
    const report = buildReport(message);
    try {
      await navigator.clipboard.writeText(report);
      els.notice.textContent = copy.feedbackCopied;
      els.notice.style.color = "var(--pass)";
    } catch {
      els.textarea.value = report;
      els.textarea.focus();
      els.textarea.select();
      els.notice.textContent = copy.feedbackCopyFail;
      els.notice.style.color = "var(--warn)";
    }
  }

  function init(nextCopy) {
    mount();
    applyI18n(nextCopy);
  }

  return { init, applyI18n, show };
})();
