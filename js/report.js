function buildReport(state, t) {
  const { items, anchorId, comparisons, lang, profile, limits } = state;
  const anchor = items.find((item) => item.id === anchorId);
  const generatedAt = new Date().toISOString();
  const series = seriesVerdict(items, comparisons);

  return {
    product: "DriftLens",
    version: "1.0.0",
    language: lang,
    generatedAt,
    offline: true,
    uploaded: false,
    seriesVerdict: series,
    profile: profile || "general",
    faceGate: !!state.faceGate,
    limits,
    note: t.inspectNote,
    anchor: anchor ? publicItem(anchor) : null,
    images: items.map((item) => {
      const cmp = comparisons[item.id];
      return {
        ...publicItem(item),
        dhash: item.dhash,
        role: item.id === anchorId ? "anchor" : "series",
        verdict: cmp ? cmp.verdict : null,
        gates: cmp ? cmp.gates : [],
        pixelDifference: cmp && cmp.pixel != null ? Number((cmp.pixel * 100).toFixed(2)) : null,
        dhashDistance: cmp && cmp.dhashDist != null ? cmp.dhashDist : null,
        histogramDrift: cmp && cmp.histDrift != null ? Number(cmp.histDrift.toFixed(3)) : null,
        zoneHot: cmp && cmp.zoneHot ? cmp.zoneHot.label : null
      };
    })
  };
}

function publicItem(item) {
  return {
    name: item.name,
    type: item.type,
    bytes: item.size,
    width: item.width,
    height: item.height,
    aspect: Number(item.aspect.toFixed(4)),
    sha256: item.hash
  };
}

function downloadJSON(report) {
  downloadBlob(
    new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    `series-check-${stamp()}.json`
  );
}

function downloadHTML(report, t) {
  const rows = report.images.map((image) => `
    <tr>
      <td>${escapeHtml(image.name)}</td>
      <td>${image.role}</td>
      <td>${image.verdict || "—"}</td>
      <td>${image.width}×${image.height}</td>
      <td>${image.pixelDifference == null ? "—" : image.pixelDifference + "%"}</td>
      <td><code>${image.sha256.slice(0, 16)}</code></td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="${report.language}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(t.reportTitle)}</title>
  <style>
    body { font-family: Segoe UI, system-ui, sans-serif; background: #111; color: #eee; padding: 24px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border-bottom: 1px solid #333; text-align: left; padding: 8px; font-size: 14px; }
    .PASS { color: #3ecf8e; } .WARN { color: #e8b84a; } .FAIL { color: #ef5b5b; }
    code { font-size: 12px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(t.reportTitle)}</h1>
  <p>Serie: <strong class="${report.seriesVerdict}">${report.seriesVerdict}</strong> · ${report.generatedAt}</p>
  <p>${escapeHtml(report.note)}</p>
  <table>
    <thead><tr><th>Datei</th><th>Rolle</th><th>Status</th><th>Maß</th><th>Pixel</th><th>Check</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  downloadBlob(new Blob([html], { type: "text/html" }), `series-check-${stamp()}.html`);
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
