// Microphone button for text fields.
//  1. Web Speech API (Safari: Apple dictation, Chrome: Google) → live text in the field.
//  2. No speech recognition but MediaRecorder (e.g. Firefox) → audio memo, stored with the answers.
//  3. Neither → no button, only a hint to use the keyboard's own dictation.
import { h } from './ui.js';
import { T } from './i18n.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const CAN_RECORD = !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

function pickMime() {
  const c = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
  return c.find((m) => window.MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || '';
}

// Returns {el, stop}. `stop` must be called when the card is left.
export function attachMic({ textarea, lang, cardId, audio }) {
  const status = h('p', { class: 'mic-status', role: 'status' });
  const btn = h('button', { type: 'button', class: 'btn mic', 'aria-pressed': 'false' });
  const el = h('div', { class: 'mic-row' });
  let stop = () => {};

  const setBtn = (on, label) => {
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('on', on);
    btn.textContent = '';
    btn.append(h('span', { class: 'mic-dot', 'aria-hidden': 'true' }), label);
  };

  if (SR) {
    let rec = null;
    setBtn(false, T.mic);
    btn.addEventListener('click', () => {
      if (rec) { rec.stop(); return; }
      rec = new SR();
      rec.lang = lang || 'de-DE';
      rec.interimResults = true;
      rec.continuous = true;
      const base = textarea.value;
      rec.onresult = (e) => {
        let text = '';
        for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
        textarea.value = (base && !/\s$/.test(base) ? base + ' ' : base) + text.trim();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      };
      rec.onerror = (e) => {
        status.textContent = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? T.micDenied
          : e.error === 'no-speech' || e.error === 'aborted' ? '' : T.micError;
      };
      rec.onend = () => {
        rec = null;
        setBtn(false, T.mic);
        if (!status.textContent.startsWith(T.micDenied.slice(0, 10))) status.textContent = '';
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      };
      try { rec.start(); status.textContent = T.micListening; setBtn(true, T.micStop); } catch { rec = null; }
    });
    stop = () => { if (rec) try { rec.stop(); } catch { /* ignore */ } };
    el.append(btn, status);
  } else if (CAN_RECORD) {
    let mr = null, chunks = [], t0 = 0, stream = null;
    const memo = h('div', { class: 'memo' });
    const showMemo = () => {
      memo.replaceChildren();
      const r = audio.get(cardId);
      if (!r) return;
      memo.append(
        h('p', {}, T.memoSaved(Math.round(r.ms / 1000))),
        h('button', { type: 'button', class: 'btn small', onclick: () => { audio.del(cardId); showMemo(); } }, T.memoDelete)
      );
    };
    setBtn(false, T.micRec);
    btn.addEventListener('click', async () => {
      if (mr) { mr.stop(); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch { status.textContent = T.micDenied; return; }
      const mime = pickMime();
      mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks = [];
      t0 = Date.now();
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = mr.mimeType || mime || 'audio/webm';
        if (chunks.length) audio.set(cardId, new Blob(chunks, { type }), type, Date.now() - t0);
        mr = null;
        status.textContent = '';
        setBtn(false, T.micRec);
        showMemo();
      };
      mr.start();
      status.textContent = T.micRecording;
      setBtn(true, T.micStop);
    });
    stop = () => { if (mr) try { mr.stop(); } catch { /* ignore */ } };
    el.append(btn, status, memo);
    showMemo();
  } else {
    el.append(h('p', { class: 'hint' }, T.keyboardHint));
  }
  return { el, stop };
}
