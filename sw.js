// Money PWA service worker.
// Shell (index.html / navigations) + data (.enc): NETWORK-FIRST — always the
// latest when online, cached fallback when offline. So a UI edit just needs a
// push + reopen; no version bump required. Icons/manifest: cache-first.
const C = 'money-v2';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  const isShell = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  const isData = url.pathname.endsWith('EXPN-state-dashboard.enc');

  if (isShell || isData) {
    // network-first with cache fallback
    e.respondWith(
      fetch(req).then(r => {
        const copy = r.clone();
        caches.open(C).then(c => c.put(req, copy));
        return r;
      }).catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
    );
  } else {
    // static assets: cache-first
    e.respondWith(caches.match(req).then(m => m || fetch(req)));
  }
});
