// Simple offline support: network first, fall back to cache. Everything same-origin and GET is cached
// as it is used, so a deck works offline once it has been opened. Bump CACHE to drop old files.
const CACHE = 'expert-cards-v17';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'app/style.css', 'app/engine.js', 'app/ui.js', 'app/i18n.js', 'app/i18n.en.js', 'app/storage.js', 'app/voice.js', 'app/icons.js',
  'app/cards/index.js', 'app/cards/common.js', 'app/cards/info.js', 'app/cards/choice.js', 'app/cards/verdict.js', 'app/cards/scale.js', 'app/cards/free_text.js',
  'app/figures/index.js', 'app/figures/duplex-plan.js', 'app/figures/section.js', 'app/submit/index.js', 'app/submit/email.js', 'app/submit/webhook.js', 'decks/index.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    // no-cache: always revalidate with the server, so deck corrections show up at once (offline falls back to the cache)
    fetch(req, { cache: 'no-cache' }).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
