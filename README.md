# Creator Series Check V2

Lokale QA-App für Bildserien. **11 Gates**, Zonen-Drift, dHash, Serien-Profil. Kein Upload.

Öffnen: `index.html` doppelklicken. Unten: **V2 · 0.2.0** (Strg+F5 zum Aktualisieren).

## Neu in V2

- **11 QA-Gates** statt nur 6 — PASS/WARN/FAIL wie in euren WIW/PADI-QA-Pipelines
- **9-Zonen-Ansicht** — zeigt welches Bildsegment driftet (Compix hat das nicht)
- **Mittelband-Gate** — Mitte vs. Rand (Motiv-Proxy, Veloryn-Inspiration)
- **dHash** — visueller Fingerabdruck neben SHA-256
- **Histogramm-Gate** — Grad-/Licht-Drift
- **Serien-Profil** — erkennt Portrait/Brand/Product aus Dateinamen
- **Drift-Chart** — Balken pro Bild in der Serie
- **PWA** — offline installierbar (`manifest.webmanifest` + `sw.js`)

## Vergleich mit Compix

Compix ist stark bei Blink, Heatmap und Region-Compositing.  
**Wir sind stärker bei strukturierter QA:** klares PASS/WARN/FAIL, Report, Zonen-Gates, Serien-Übersicht.

Compix sagt *wo* es flimmert. Wir sagen *ob die Serie lieferbar ist*.

## Tasten

- `1` Blink · `2` Slider · `3` Heatmap · `4` Zonen
- `A` Anker setzen · Pfeiltasten Bild wechseln

## Geld

Noch frei. Store wenn es im Alltag hält.
