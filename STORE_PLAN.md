# DriftLens — Store-Plan (Stand V3)

## Kurzfassung

**Ja — V3 ist store-tauglich**, wenn wir die Web-App in eine native Hülle packen (Capacitor) und ehrlich vermarkten.

## Unser Plan (Reminder)

| Schritt | Was | Wann |
|--------|-----|------|
| 1 | Lokal bauen & testen (PWA) | ✅ V1–V3 |
| 2 | Android zuerst (Windows-Dev) | ✅ APK auf Gerät |
| 3 | Privacy-Seite + Store-Texte (DE/EN) | ✅ `privacy.html`, `docs/store/` |
| 4 | Developer-Konto Google → erste Beta | Als Nächstes |
| 5 | Pro-Feature hinter In-App-Kauf | vor öffentlichem Launch |
| 6 | Apple später (Mac für Upload) | wenn Android stabil |

## Kosten

| Store | Kosten | Provision |
|-------|--------|-----------|
| **Google Play** | ~25 USD einmalig | ~15 % (Small Business) |
| **Apple App Store** | ~99 USD/Jahr | ~15 % (Small Business Program) |

## Monetarisierung (geplant)

- **Free:** bis 10 Bilder, Basis-Gates, Blink/Slider
- **Pro:** ~7,99–9,99 € einmalig oder ~2,99 €/Monat — 50 Bilder, Video-Frames, Face-Gate, Report

## Technik für Store

1. **Capacitor** — gleiche HTML/JS-App in Android/iOS WebView
2. **Privacy:** „Alles lokal, kein Upload“ — großer Vorteil in Store-Beschreibung
3. **Face-Gate:** MediaPipe-Modell ins App-Bundle — dann offline ohne CDN
4. **Screenshots:** Lizard-Lounge-Serie, Portrait-Serie, Video-Frames

## Was Apple/Google prüfen

- Datenschutzerklärung (auch wenn keine Daten gesendet werden)
- App funktioniert ohne Absturz
- Keine irreführenden Claims („KI erkennt alles“)
- In-App-Kauf korrekt implementiert (Store-Regeln)

## Bewusst getrennte Produkte

| App | Plattform | Status |
|-----|-----------|--------|
| **DriftLens** | Phone + Tablet | V3 — Store-Kandidat #1 |
| ExportCheck | Windows/Desktop | Später |
| FrameGuard (Video-Pro) | Desktop + Phone | V3 lite drin, Vollversion später |

## Nächste Schritte Richtung Store

1. ~~Capacitor-Projekt anlegen~~ ✅
2. ~~Android APK testen auf echtem Gerät~~ ✅
3. ~~Privacy-Seite + Store-Texte (DE/EN)~~ ✅ → `privacy.html`, `docs/store/google-play-de.md`, `docs/store/google-play-en.md`, `docs/store/data-safety.md`
4. **Datenschutz-URL hosten** (HTTPS für Play Console — z. B. GitHub Pages)
5. Developer-Konto Google (~25 USD) → erste Beta (signiertes AAB)
6. Pro-Feature hinter In-App-Kauf
