// Minimal service worker: makes BuildProof installable. It does not cache pages,
// so people always see fresh rankings and videos.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
