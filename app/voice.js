// Microphone button for text fields. Order of preference:
//  1. Web Speech API (Safari: Apple dictation, desktop Chrome: Google) → live text in the field.
//  2. If that is missing or fails (e.g. Chrome/Firefox on iPhone, which are WebKit without speech
//     recognition) → audio memo via MediaRecorder, stored with the answers.
//  3. If that is not possible either → no button, only the hint to use the keyboard's own dictation.
// Failures stay visible (no silent dead button).
import { h } from './ui.js';
import { T } from './i18n.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const CAN_RECORD = !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
// Browsers other than Safari on iOS use WebKit but have no working speech recognition.
const IOS_OTHER = /iP(hone|ad|od)/.test(navigator.userAgent) && /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(navigator.userAgent);
const USE_SR = !!SR && !IOS_OTHER;
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent);
// macOS desktop (not iPhone/iPad): Firefox often reports missing OS mic permission as NotFoundError.
const MAC_DESKTOP = !IOS && /Mac/.test(navigator.platform || navigator.userAgent);

function pickMime() {
  // webm/opus first (Firefox, Chrome); mp4 only as last resort (Safari). Order matters: Firefox may claim mp4 but record nothing.
  const c = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  return c.find((m) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || '';
}

// Firefox on macOS is picky: {audio:true} can fail with NotFoundError when OS permission is off
// or when a constraint set does not match. Try several constraint shapes before giving up.
async function getMicStream() {
  if (!window.isSecureContext) {
    const err = new DOMException('Microphone requires a secure context (HTTPS or localhost).', 'SecurityError');
    throw err;
  }
  const attempts = [
    { audio: true },
    { audio: { echoCancellation: true, noiseSuppression: true } },
    { audio: {} },
  ];
  let lastErr = null;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastErr = err;
      const name = err && err.name;
      // Permission / security failures will not be fixed by different constraints.
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') throw err;
    }
  }
  // Last resort: pick an enumerated input device explicitly (helps some Firefox builds).
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const mic = devices.find((d) => d.kind === 'audioinput' && d.deviceId && d.deviceId !== 'default');
    const any = mic || devices.find((d) => d.kind === 'audioinput' && d.deviceId);
    if (any) {
      return await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { ideal: any.deviceId } } });
    }
  } catch (err) {
    lastErr = err;
  }
  throw lastErr || new DOMException('No microphone found.', 'NotFoundError');
}

function micGetUserMediaMessage(err) {
  const name = (err && err.name) || '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return T.micDenied;
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return MAC_DESKTOP ? T.micNotFoundMac : T.micNotFound;
  }
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return T.micBusy;
  if (name === 'SecurityError') return T.micInsecure;
  return `${T.micError} (${name || 'Fehler'})`;
}

// Returns {el, stop}. `stop` must be called when the card is left.
export function attachMic({ textarea, lang, cardId, audio }) {
  const el = h('div', { class: 'mic-row' });
  let stop = () => {};

  const hint = (text) => h('p', { class: 'hint' }, text);
  const keyboardHint = () => hint(IOS ? T.keyboardHintIos : T.keyboardHint);

  function makeButton(label) {
    const btn = h('button', { type: 'button', class: 'btn mic', 'aria-pressed': 'false' });
    const set = (on, text) => {
      btn.setAttribute('aria-pressed', String(on));
      btn.classList.toggle('on', on);
      btn.textContent = '';
      btn.append(h('span', { class: 'mic-dot', 'aria-hidden': 'true' }), text);
    };
    set(false, label);
    return { btn, set };
  }

  function setupMemo(note) {
    el.replaceChildren();
    const status = h('p', { class: 'mic-status', role: 'status' }, note || '');
    const { btn, set } = makeButton(T.micRec);
    const memo = h('div', { class: 'memo' });
    let mr = null, chunks = [], t0 = 0, stream = null;
    let url = null;
    const showMemo = () => {
      if (url) { URL.revokeObjectURL(url); url = null; }
      memo.replaceChildren();
      const r = audio.get(cardId);
      if (!r) return;
      url = URL.createObjectURL(r.blob);
      memo.append(
        h('p', {}, T.memoSaved(Math.round(r.ms / 1000), `${(r.mime || '').split(';')[0]}, ${Math.max(1, Math.round(r.blob.size / 1024))} KB`)),
        h('audio', { controls: true, src: url, preload: 'metadata', 'aria-label': T.memoPlay }),
        h('button', { type: 'button', class: 'btn small', onclick: () => { audio.del(cardId); showMemo(); } }, T.memoDelete));
    };
    btn.addEventListener('click', async () => {
      if (mr) { mr.stop(); return; }
      status.textContent = T.micStarting;
      try {
        stream = await getMicStream();
      } catch (err) { status.textContent = micGetUserMediaMessage(err); return; }
      const mime = pickMime();
      try {
        try { mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); } catch { mr = new MediaRecorder(stream); }
      } catch (err) { stream.getTracks().forEach((t) => t.stop()); status.textContent = `${T.micError} (${err && err.name || 'Fehler'})`; return; }
      mr.onerror = (e) => { status.textContent = `${T.micError} (${(e.error && e.error.name) || 'Aufnahmefehler'})`; };
      chunks = [];
      t0 = Date.now();
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = mr.mimeType || mime || 'audio/webm';
        const blob = new Blob(chunks, { type });
        const ok = blob.size > 0;
        if (ok) audio.set(cardId, blob, type, Date.now() - t0);
        mr = null;
        status.textContent = ok ? '' : T.memoEmpty;
        set(false, T.micRec);
        showMemo();
      };
      try {
        mr.start(500); // timeslice: chunks arrive while recording, not only at the end
      } catch (err) {
        stream.getTracks().forEach((t) => t.stop());
        mr = null;
        status.textContent = `${T.micError} (${err && err.name || 'Fehler'})`;
        set(false, T.micRec);
        return;
      }
      status.textContent = T.micRecording;
      set(true, T.micStop);
    });
    stop = () => { if (url) URL.revokeObjectURL(url); if (mr) try { mr.stop(); } catch { /* ignore */ } };
    el.append(btn, status, memo, keyboardHint());
    showMemo();
  }

  function setupKeyboardOnly(note) {
    el.replaceChildren();
    if (note) el.append(h('p', { class: 'mic-status', role: 'status' }, note));
    el.append(keyboardHint());
    stop = () => {};
  }

  function fallback(note) {
    // iOS browsers other than Safari block the microphone for web pages: no dead button there
    if (CAN_RECORD && !IOS_OTHER) setupMemo(note); else setupKeyboardOnly(note);
  }

  function setupSpeech() {
    const status = h('p', { class: 'mic-status', role: 'status' });
    const { btn, set } = makeButton(T.mic);
    let rec = null, watchdog = null, failed = false;
    btn.addEventListener('click', () => {
      if (rec) { rec.stop(); return; }
      status.textContent = '';
      failed = false;
      rec = new SR();
      rec.lang = lang || 'de-DE';
      rec.interimResults = true;
      rec.continuous = true;
      const base = textarea.value;
      const started = () => { clearTimeout(watchdog); status.textContent = T.micListening; };
      rec.onstart = started;
      rec.onaudiostart = started;
      rec.onresult = (e) => {
        started();
        let text = '';
        for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
        textarea.value = (base && !/\s$/.test(base) ? base + ' ' : base) + text.trim();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      };
      rec.onerror = (e) => {
        clearTimeout(watchdog);
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        failed = true;
        // permission denied / service missing / network: switch to the memo or keyboard fallback
        fallback(e.error === 'not-allowed' ? T.micDenied : T.micFallback);
      };
      rec.onend = () => {
        clearTimeout(watchdog);
        rec = null;
        if (failed) return;
        set(false, T.mic);
        status.textContent = '';
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      };
      // some browsers expose the API but never start (no prompt, no error)
      watchdog = setTimeout(() => {
        if (!rec) return;
        failed = true;
        try { rec.abort(); } catch { /* ignore */ }
        rec = null;
        fallback(T.micFallback);
      }, 4000);
      try {
        rec.start();
        set(true, T.micStop);
        status.textContent = T.micStarting;
      } catch {
        clearTimeout(watchdog);
        rec = null;
        fallback(T.micFallback);
      }
    });
    stop = () => { clearTimeout(watchdog); if (rec) try { rec.stop(); } catch { /* ignore */ } };
    el.append(btn, status);
  }

  if (USE_SR) setupSpeech();
  else fallback(IOS_OTHER ? T.micNotInThisBrowser : '');
  return { el, stop };
}
