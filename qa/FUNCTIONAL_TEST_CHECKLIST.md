# Creator Series Check — Funktionstest V0.1.0

Nicht als PASS markieren, wenn ein Punkt offen bleibt.

## Status (V1.1)

- [ ] Pixel ≥ 5 % → WARN (nicht mehr PASS)
- [ ] Serie wird gelb wenn irgendein Bild Pixel-WARN hat
- [ ] Thumbnails zeigen `X.X% px`
- [ ] Pixel-Badge oben rechts im Vergleich
- [ ] Heatmap deutlich schärfer als V1
- [ ] Beim Laden wird das Bild mit größter Drift ausgewählt
- [ ] Befunde: WARN/FAIL stehen oben
- [ ] Footer zeigt **V1.1 · 0.1.1**

## Laden

- [ ] Eine einzelne JPG öffnen
- [ ] Mehrere Bilder auf einmal wählen
- [ ] Ordner per Drag & Drop (Chrome/Edge)
- [ ] Nicht-Bilder werden übersprungen
- [ ] Ab 41 Bildern erscheint die 40er-Grenze

## Anker

- [ ] Erstes Bild ist Anker
- [ ] Doppelklick setzt einen neuen Anker
- [ ] Taste A setzt die Auswahl als Anker
- [ ] Anker hat die limette Umrandung

## Vergleich

- [ ] Blink wechselt zwischen Anker und Auswahl
- [ ] Tempo-Regler ändert das Blinken
- [ ] Slider teilt das Bild
- [ ] Heatmap zeigt Abweichung, ohne Dateien hochzuladen
- [ ] Pfeiltasten wechseln die Auswahl

## Status

- [ ] Anderes Seitenverhältnis > 3 % → FAIL
- [ ] Andere Auflösung → WARN
- [ ] Gleiche Datei (Hash) wird als identisch erkannt
- [ ] Pixel-% steht im Befund, ändert den Serienstatus nicht
- [ ] DE/EN wechselt Texte

## Report

- [ ] JSON wird lokal heruntergeladen
- [ ] HTML-Report öffnet sich lokal
- [ ] Report enthält SHA-256 und `uploaded: false`

## Grenzen (sichtbar)

- [ ] Hinweis zur Posenempfindlichkeit ist in der Oberfläche
- [ ] Kein Netzwerkaufruf beim Vergleich (DevTools Network)
