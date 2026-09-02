# Creator Series Check — V2

**Version:** 0.2.0  
**Status:** QA-Gate-Engine · lokal · PWA-fähig

## Was V2 kann (neu gegenüber V1.1)

| Feature | Compix | Wir (V2) |
|---|---|---|
| Blink / Slider / Heatmap | Ja | Ja |
| Bis 50 Bilder | Ja | 40 (V2.1 → 50) |
| Pixel-Lock | Ja | Ja (letterbox) |
| Region-Extraktion / Compositor | Ja | Nein (V3) |
| **Strukturierte QA-Gates (PASS/WARN/FAIL)** | Nein | **Ja — 11 Gates** |
| **9-Zonen-Drift** | Nein | **Ja** |
| **Mittelband-Motiv-Gate** | Nein | **Ja** |
| **dHash (visueller Fingerabdruck)** | Nein | **Ja** |
| **Histogramm-Gate** | Nein | **Ja** |
| **Serien-Profil (Veloryn-DNA)** | Nein | **Ja** |
| **Drift-Chart pro Serie** | Nein | **Ja** |
| **QA-Report JSON/HTML** | Nein | **Ja** |
| PWA offline | Ja | Ja (sw.js) |
| Gesichtserkennung | Nein | Nein (ehrlich) |

## 11 QA-Gates

1. Seitenverhältnis (FAIL > 3 %)
2. Auflösung (WARN)
3. Format (WARN)
4. SHA-256 (Info)
5. dHash-Struktur (WARN)
6. Pixel gesamt (WARN ab Profil-Schwelle)
7. 9-Zonen-Drift (WARN — welche Zone am heißesten)
8. Mittelband/Motiv (WARN — Mitte driftet stärker als Rand)
9. Helligkeit (WARN)
10. Farbe (WARN)
11. Histogramm (WARN)

## Serien-Profile (aus Veloryn `contextType`, portiert)

Erkannt aus Dateinamen:

- **human** — Portrait/Motiv, strengere Mittelband- und Pixel-Schwellen
- **brand** — Logo/Brand/Lounge, strengere Zonen
- **product** — Produktmockups
- **general** — Standard

## DNA-Quellen

| Quelle | Was wir übernommen haben |
|---|---|
| WIW / PADI | SHA-256, PASS/WARN/FAIL, Report-Manifest |
| CEG | Gate-Matrix-Architektur, Schwellen pro Profil |
| Veloryn | `contextType()` Regex → Serien-Profil |
| TAC | Before/after Inspektion (Blink/Slider) |
| Compix | Blink, Heatmap, Pixel-Lock — plus QA-Schicht darüber |

## Bewusst nicht in V2

- Gesichts-/Kleidungs-KI (kein Modell lokal vorhanden)
- Region-Compositor / GIF-Export (Compix-Stärke — V3)
- Invariant Engine / CEG-Semantik auf Pixeln

## Nächste Schritte

- **V2.1:** 50 Bilder, Median-Anker-Vorschlag
- **V3:** FrameGuard (Video), optional MediaPipe-Gesicht lokal
