const CACHE = "driftlens-v1-0-0";
const HERO_VERSION = "336";
const DEMO_VERSION = "320";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([
        "./",
        "./index.html",
        "./privacy.html",
        "./css/app.css",
        "./css/sketch-theme.css",
        "./css/sketch-scatter.css",
        "./js/i18n.js",
        "./js/hash.js",
        "./js/perceptual.js",
        "./js/profile.js",
        "./js/series.js",
        "./js/video.js",
        "./js/face.js",
        "./js/analyze.js",
        "./js/compare.js",
        "./js/report.js",
        "./js/hero-bg.js",
        "./js/onboard.js",
        "./js/demo-embed.js",
        "./js/feedback.js",
        "./js/app.js",
        `./assets/hero/hero-01.png?v=${HERO_VERSION}`,
        `./assets/hero/hero-02.png?v=${HERO_VERSION}`,
        `./assets/hero/hero-03.png?v=${HERO_VERSION}`,
        `./assets/hero/hero-04.png?v=${HERO_VERSION}`,
        `./assets/hero/hero-05.png?v=${HERO_VERSION}`,
        `./assets/hero/hero-06.png?v=${HERO_VERSION}`,
        `./assets/hero/hero-07.png?v=${HERO_VERSION}`,
        `./assets/hero/hero-08.png?v=${HERO_VERSION}`,
        `./assets/hero/hero-09.png?v=${HERO_VERSION}`,
        `./assets/hero/hero-10.png?v=${HERO_VERSION}`,
        "./assets/brand/driftlens-dl.png",
        "./assets/brand/driftlens-wordmark.png",
        "./assets/panel/panel-01.png",
        "./assets/panel/panel-02.png",
        "./js/work-panel-bg.js",
        "./assets/sketch/scatter/card-01.png",
        "./assets/sketch/scatter/card-06.png",
        "./assets/sketch/scatter/stroke-1.png",
        "./assets/sketch/scatter/stroke-2.png",
        "./assets/sketch/scatter/stroke-3.png",
        "./assets/sketch/scatter/dim-1024.png",
        "./assets/sketch/scatter/dim-delta.png",
        "./assets/sketch/scatter/graph-drift.png",
        "./assets/sketch/scatter/hatch.png",
        `./assets/demo/01-anchor.jpg?v=${DEMO_VERSION}`,
        `./assets/demo/02-inner-pulse.jpg?v=${DEMO_VERSION}`,
        `./assets/demo/03-butterfly-breath.jpg?v=${DEMO_VERSION}`,
        `./assets/demo/04-orbit-whisper.jpg?v=${DEMO_VERSION}`,
        `./assets/demo/05-leaf-unfolding.jpg?v=${DEMO_VERSION}`,
        `./assets/demo/06-center-bloom-warn.jpg?v=${DEMO_VERSION}`,
        `./assets/demo/07-left-wing-warn.jpg?v=${DEMO_VERSION}`,
        `./assets/demo/08-twilight-warn.jpg?v=${DEMO_VERSION}`,
        `./assets/demo/09-violet-drift-warn.jpg?v=${DEMO_VERSION}`,
        `./assets/demo/10-broken-frame-fail.jpg?v=${DEMO_VERSION}`,
        "./manifest.webmanifest"
      ]).catch(() => {})
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
