# GitHub Pages — Datenschutz-URL für Google Play

## Ziel-URL

Nach dem Setup:

```
https://DEIN-GITHUB-USER.github.io/driftlens/privacy.html
```

Diese URL in der **Google Play Console** unter Datenschutzrichtlinie eintragen.

## Einmalig einrichten

1. Repo auf GitHub anlegen (öffentlich), z. B. `driftlens`
2. Code pushen (Branch `main`)
3. GitHub → **Settings → Pages → Build and deployment**
   - Source: **GitHub Actions**
4. Nach dem ersten Push auf `main` läuft `.github/workflows/pages.yml` automatisch
5. Unter **Settings → Pages** erscheint die Live-URL

## Lokal pushen (PowerShell)

```powershell
cd C:\Users\Usuario\Projects\CreatorSeriesCheck
git init -b main
git add -A
git commit -m "DriftLens 1.0.0 — app + privacy + GitHub Pages"
git remote add origin https://github.com/DEIN-USER/driftlens.git
git push -u origin main
```

## Was deployed wird

Nur App-Dateien für die Webseite (kein `android/`, kein `node_modules/`):

- `index.html`, `privacy.html`, `css/`, `js/`, `assets/`, `sw.js`, `manifest.webmanifest`

## Store-Texte anpassen

In `docs/store/google-play-de.md` und `google-play-en.md` die Platzhalter-URL durch die echte GitHub-Pages-URL ersetzen.
