// Autosave/resume. State goes to localStorage, audio memos to IndexedDB (with an in-memory fallback).
// Key = deck id + version + invite code, so a new deck version or another code starts fresh.

const NS = 'expert-cards';

function idb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error('no idb'));
    const req = indexedDB.open(`${NS}-audio`, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('audio', { keyPath: 'k' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function makeStore(deckId, version, code) {
  const key = `${NS}:${deckId}@${version}:${code || '-'}`;
  const mem = new Map(); // cardId -> {blob, mime, ms}
  let timer = null;
  let ok = true;

  function load() {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  function flush(state) {
    try { localStorage.setItem(key, JSON.stringify(state)); ok = true; } catch { ok = false; }
    return ok;
  }
  function save(state) {
    clearTimeout(timer);
    timer = setTimeout(() => flush(state), 200);
  }
  function clear() {
    clearTimeout(timer);
    try { localStorage.removeItem(key); } catch { /* ignore */ }
    mem.clear();
    idb().then((db) => {
      const tx = db.transaction('audio', 'readwrite');
      const st = tx.objectStore('audio');
      st.getAllKeys().onsuccess = (e) => e.target.result.filter((k) => k.startsWith(key + '|')).forEach((k) => st.delete(k));
    }).catch(() => {});
  }

  const audio = {
    async loadAll() {
      try {
        const db = await idb();
        await new Promise((resolve) => {
          const req = db.transaction('audio').objectStore('audio').getAll();
          req.onsuccess = () => {
            for (const r of req.result) if (r.k.startsWith(key + '|')) mem.set(r.k.slice(key.length + 1), r);
            resolve();
          };
          req.onerror = () => resolve();
        });
      } catch { /* memory only */ }
    },
    get: (cardId) => mem.get(cardId) || null,
    has: (cardId) => mem.has(cardId),
    all: () => [...mem.entries()],
    set(cardId, blob, mime, ms) {
      const rec = { k: `${key}|${cardId}`, blob, mime, ms };
      mem.set(cardId, rec);
      idb().then((db) => db.transaction('audio', 'readwrite').objectStore('audio').put(rec)).catch(() => {});
    },
    del(cardId) {
      mem.delete(cardId);
      idb().then((db) => db.transaction('audio', 'readwrite').objectStore('audio').delete(`${key}|${cardId}`)).catch(() => {});
    }
  };

  return { key, load, save, flush, clear, audio, get ok() { return ok; } };
}
