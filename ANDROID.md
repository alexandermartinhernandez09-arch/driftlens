# DriftLens — Android (Capacitor)

## Voraussetzungen

1. **Node.js** (LTS) — [nodejs.org](https://nodejs.org)
2. **Android Studio** — [developer.android.com/studio](https://developer.android.com/studio)
3. Im Android Studio SDK: **Android SDK Platform 34+**, Build-Tools

## Einmalig einrichten

```powershell
cd C:\Users\Usuario\Projects\CreatorSeriesCheck
npm install
npm run build:web
npx cap add android
npm run cap:sync
```

**Java 25:** Gradle-Wrapper **9.1** (für Android Studio JBR).  
Debug-APK (nach Build): `C:\AndroidBuild\android\app\outputs\apk\debug\app-debug.apk`

CLI-Build:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
cd android
.\gradlew.bat assembleDebug
```

## Nach Code-Änderungen

```powershell
npm run android
```

Das kopiert die Web-App nach `www/`, synchronisiert mit Android und öffnet Android Studio.

## APK auf dem Handy testen

1. Android Studio → **Run** (grünes Dreieck) mit angeschlossenem Handy (USB-Debugging an)
2. Oder: **Build → Build APK(s)** → APK auf Gerät installieren
3. Oder: fertige APK direkt installieren:  
   `android\app\build\outputs\apk\debug\app-debug.apk`

## Build-Fehler: `notification_bg_low_normal.9.png` / AAPT2

**Kein DriftLens-Bug.** Bekanntes **Windows-Problem** mit Gradle-Transforms + AAPT2 — die AppCompat-Bibliothek liefert die `.9.png`-Dateien, aber Windows/Defender oder zu lange Pfade verhindern, dass sie im Gradle-Cache ankommen.

### Was die Recherche zeigt (Stack Overflow, Reddit, GitHub, Microsoft)

| Ursache | Warum |
|--------|--------|
| **Windows Defender** | Scannt beim Build tausende Dateien → sperrt/löscht Cache-Einträge während AAPT2 liest |
| **Gradle-Cache unter `C:\Users\…\.gradle`** | Transform-Pfade werden sehr lang; AAPT2 meldet „file not found“ obwohl der Build fast fertig ist |
| **Kaputter Transform-Cache** | `work/output/res/…/*.9.png` fehlt — genau der Pfad in deinem Fehler |
| **Long Paths** | Unter 260 Zeichen kann es trotzdem knallen bei verschachtelten Transform-Pfaden |
| **Studio ≠ Terminal** | Studio nutzt oft anderen Gradle-Home oder alten Cache als `gradlew.bat` |

### Fix im Projekt (bereits gesetzt)

| Einstellung | Zweck |
|-------------|--------|
| **`android.aapt2FromMavenOverride`** | **Hauptfix:** AGP 8.8 nutzt AAPT2 aus Maven — auf Windows oft kaputt (`failed to open file`). Fix: SDK-`aapt2.exe` aus `local.properties` → `C:\GradleCache\gradle.properties` (Script legt das an) |
| **`GRADLE_USER_HOME=C:\GradleCache`** | Kurzer Gradle-Pfad (`gradlew.bat` + Studio `serviceDirectoryPath`) |
| **`buildDir=C:/AndroidBuild/...`** | Kurze Build-Pfade |
| **`org.gradle.workers.max=1`** | Weniger Parallel-Konflikte mit Defender |

**Android Studio:** Settings → Build Tools → Gradle → Gradle user home = `C:\GradleCache`

**PowerShell als Administrator:**

```powershell
cd C:\Users\Usuario\Projects\CreatorSeriesCheck
.\scripts\android-windows-fix.ps1
```

Oder manuell: Windows-Sicherheit → Ausschlüsse für `C:\GradleCache`, `.gradle`, Android SDK, Projektordner.

**Android Studio:** Settings → Build Tools → Gradle → **Gradle user home** = `C:\GradleCache`

Dann Studio **komplett schließen**, neu öffnen, Sync, Run.

**CLI-Build:**

```powershell
cd C:\Users\Usuario\Projects\CreatorSeriesCheck\android
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat clean assembleDebug
```

## Google Play

1. Developer-Konto (~25 USD einmalig)
2. Signierter Release-Build (AAB) ✅  
   `C:\AndroidBuild\android\app\outputs\bundle\release\app-release.aab`  
   Schlüssel lokal: `android\driftlens-release.jks` + `android\KEYSTORE_BACKUP.txt` (Backup machen!)
3. Datenschutz-URL (HTTPS) — Inhalt in `privacy.html`, Texte in `docs/store/`
4. Screenshots + Store-Beschreibung (DE/EN) — Vorlagen in `docs/store/google-play-de.md` und `google-play-en.md`

Siehe auch `STORE_PLAN.md`.
