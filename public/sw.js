// Self-destructing cleanup worker: deletes all caches and unregisters on
// activate. Bump SW_VERSION to force browsers to reinstall (byte change) so the
// cleanup re-runs on devices that may hold a stale caching worker/bundle.
const SW_VERSION = "2026-07-14-element-audio";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  console.log("[sw] cleanup", SW_VERSION);
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))))
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach((c) => c.navigate(c.url)))
      .then(() => self.registration.unregister())
  );
});
