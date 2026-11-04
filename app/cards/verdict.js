// verdict: case with three big buttons. After a clear verdict a short "how sure?" row appears
// and the app advances by itself (unless the expert is editing from the overview or adds a note).
import { h } from '../ui.js';
import { T } from '../i18n.js';
import { head, prompt, fig, hintEl, lawButton, related, assumption, changes, textField } from './common.js';

const AUTO_MS = 1800;

export const render = (ctx) => {
  const { card, deck } = ctx;
  const vopts = deck.verdict_options;
  const copts = deck.confidence_options || [];
  const autoOn = !ctx.editing && (deck.settings ? deck.settings.auto_advance !== false : true);
  let timer = null;
  const cancel = () => { clearTimeout(timer); timer = null; };
  ctx.onLeave(cancel);

  const confRow = h('div', { class: 'conf', role: 'radiogroup', 'aria-label': T.sure }, h('span', { class: 'conf-q' }, T.sure));
  const confBtns = copts.map((c) => {
    const b = h('button', { type: 'button', class: 'chipbtn', role: 'radio', onclick: () => { cancel(); ctx.set({ conf: c.id }); paint(); if (autoOn) timer = setTimeout(ctx.next, 350); } }, c.label);
    confRow.append(b);
    return b;
  });
  const reasonBox = h('div', { class: 'reason' });
  const noteBox = h('div', { class: 'reason' });
  const addNote = h('button', { type: 'button', class: 'linkbtn', onclick: () => { cancel(); showNote(true); addNote.hidden = true; } }, T.addNote);

  const vbtns = vopts.map((o, i) => {
    const b = h('button', { type: 'button', class: `verdict-btn v-${o.id}`, role: 'radio', 'data-key': String(i + 1), onclick: () => pick(o) },
      h('span', { class: 'opt-key', 'aria-hidden': 'true' }, String(i + 1)), o.label);
    return b;
  });

  function showNote(force) {
    if (noteBox.childElementCount === 0 && (force || ctx.answer.note)) {
      noteBox.append(textField(ctx, { key: 'note', label: T.noteLabel, rows: 3 }));
    }
  }
  function paint() {
    const v = ctx.answer.v;
    const opt = vopts.find((o) => o.id === v);
    vbtns.forEach((b, i) => {
      const on = vopts[i].id === v;
      b.setAttribute('aria-checked', String(on));
      b.classList.toggle('sel', on);
    });
    const clear = opt && !opt.requires_reason;
    confRow.hidden = !clear;
    addNote.hidden = !clear || noteBox.childElementCount > 0;
    confBtns.forEach((b, i) => {
      const on = copts[i].id === ctx.answer.conf;
      b.setAttribute('aria-checked', String(on));
      b.classList.toggle('sel', on);
    });
    if (opt && opt.requires_reason && reasonBox.childElementCount === 0) {
      reasonBox.append(textField(ctx, { key: 'reason', label: T.reasonLabel, rows: 4 }));
    }
    reasonBox.hidden = !(opt && opt.requires_reason);
  }
  function pick(o) {
    cancel();
    const changed = ctx.answer.v !== o.id;
    ctx.set(o.requires_reason ? { v: o.id, conf: null } : { v: o.id });
    paint();
    if (!o.requires_reason && autoOn && (changed || !ctx.answer.conf)) timer = setTimeout(ctx.next, AUTO_MS);
  }
  ctx.keyHandler = (e) => {
    const i = Number(e.key) - 1;
    if (i >= 0 && i < vopts.length) { pick(vopts[i]); return true; }
    return false;
  };
  // typing or tapping inside notes/reason keeps the card open
  const root = h('div', { class: 'card verdict', onfocusin: cancel },
    ...head(ctx), assumption(ctx), changes(ctx), fig(ctx), related(ctx), prompt(ctx), hintEl(ctx), lawButton(ctx),
    h('div', { class: 'verdicts', role: 'radiogroup', 'aria-label': ctx.section && ctx.section.question || '' }, vbtns),
    confRow, reasonBox, addNote, noteBox);
  showNote(false);
  paint();
  return root;
};

export const answered = (card, a) => !!(a && a.v);

export const summary = (card, a, deck) => {
  if (!a || !a.v) return '';
  const v = (deck.verdict_options.find((o) => o.id === a.v) || {}).label || a.v;
  const c = a.conf && (deck.confidence_options || []).find((o) => o.id === a.conf);
  return c ? `${v} (${c.label})` : v;
};
