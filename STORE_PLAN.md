# DriftLens — Plan

## Ein Weg

1. Kundenfertig machen
2. Signiertes AAB bauen
3. Google Play **Produktion** (kein Beta nötig)
4. Store-Listing + Datenschutz + Screenshots
5. Öffentlicher Launch

## Status

| Schritt | Stand |
|---------|--------|
| 1 Kundenfertig | ✅ 1.0.0 |
| 2 AAB | ✅ signiert (`C:\AndroidBuild\...\app-release.aab`) |
| 3–5 Play Produktion | **als Nächstes** (hochladen in Play Console) |

## Extrem-Check 2026-09-04

| Check | Ergebnis |
|-------|----------|
| Version 1.0.0 synchron (package, Footer, Report, Privacy, Android versionName) | ✅ |
| Origin-Job-Reste entfernt | ✅ |
| Datenschutz-URL live (GitHub Pages) | ✅ |
| AAB vorhanden, versionCode 1 / versionName 1.0.0, `com.driftlens.app` | ✅ |
| Keystore in `.gitignore` | ✅ (committen) |
| Gates (11 + optional Face) | ✅ |
| Alte Docs (PRODUCT.md / QA-Checklist) Versionstext veraltet | ⚠ intern, kein Store-Blocker |

## Links

- Repo: https://github.com/alexandermartinhernandez09-arch/driftlens
- Datenschutz: https://alexandermartinhernandez09-arch.github.io/driftlens/privacy.html
- Store-Texte: `docs/store/`
- AAB: `C:\AndroidBuild\android\app\outputs\bundle\release\app-release.aab`
