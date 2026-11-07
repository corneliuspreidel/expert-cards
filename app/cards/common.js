// Pieces shared by the card renderers.
import { h, rich, modal } from '../ui.js';
import { T } from '../i18n.js';
import { figure } from '../figures/index.js';
import { attachMic } from '../voice.js';

export const isEmpty = (v) => v == null || v === '' || (Array.isArray(v) && v.length === 0);

// eyebrow (Frage 3 von 9), title, chips, prompt
export function head(ctx) {
  const { card, section, idx, n } = ctx;
  const kids = [];
  if (section && idx != null) {
    const label = card.type === 'verdict' ? T.caseOf(idx + 1, n) : T.question(idx + 1, n);
    kids.push(h('p', { class: 'eyebrow' }, `${section.title} · ${label}${!card.title && card.type === 'verdict' ? ` · ${card.id}` : ''}`));
  }
  if (card.title) kids.push(h('h1', { class: 'card-title', tabindex: '-1' }, `${card.id && card.type === 'verdict' ? card.id + ' · ' : ''}${card.title}`));
  if (card.chips && card.chips.length) kids.push(h('ul', { class: 'chips' }, card.chips.map((c) => h('li', {}, c))));
  return kids;
}

// the sentence the expert has to answer
export function prompt(ctx) {
  const text = ctx.card.prompt || (ctx.section && ctx.section.question);
  if (!text) return null;
  const tag = ctx.card.title ? 'p' : 'h1';
  return h(tag, { class: tag === 'h1' ? 'card-title' : 'question', tabindex: tag === 'h1' ? '-1' : null, html: rich(text) });
}

export function fig(ctx) {
  return figure(ctx.card.figure, ctx.deckBase);
}

export function hintEl(ctx) {
  return ctx.card.hint ? h('p', { class: 'hint', html: rich(ctx.card.hint) }) : null;
}

export function lawButton(ctx) {
  const refId = ctx.section && ctx.section.reference;
  const ref = refId && ctx.deck.references && ctx.deck.references[refId];
  if (!ref) return null;
  return h('button', { type: 'button', class: 'linkbtn', onclick: () => modal(ref.title, h('pre', { class: 'law' }, ref.text), T.close) }, T.law);
}

// "hängt mit Frage 4 zusammen" + the expert's own answer
export function related(ctx) {
  const ids = ctx.card.related || [];
  if (!ids.length) return null;
  return h('div', { class: 'related' }, ids.map((id) => {
    const info = ctx.lookup(id);
    if (!info) return null;
    return h('p', {},
      h('b', {}, T.related(info.number)), ' ',
      info.text ? [T.relatedYour, ' ', h('b', {}, info.text)] : T.relatedOpen);
  }));
}

export function assumption(ctx) {
  if (!ctx.card.assumption) return null;
  return h('div', { class: 'assumption' }, h('b', {}, T.assumption + ': '), ctx.card.assumption);
}

export function changes(ctx) {
  const list = ctx.card.changes;
  if (!list || !list.length) return null;
  return h('div', { class: 'changes' },
    h('p', { class: 'eyebrow' }, T.changed),
    h('ul', {}, list.map((c) => h('li', { html: rich(c) }))));
}

/** One clear "your question" block so the ask is hard to miss. */
export function askBlock(ctx) {
  const p = prompt(ctx);
  const hint = hintEl(ctx);
  if (!p && !hint) return null;
  return h('div', { class: 'ask' },
    h('p', { class: 'ask-kicker' }, T.askLabel),
    p, hint);
}

/** Changes block labeled for faster scanning. */
export function changesFresh(ctx) {
  const list = ctx.card.changes;
  if (!list || !list.length) return null;
  return h('div', { class: 'changes changes-delta' },
    h('p', { class: 'eyebrow' }, T.changeLabel),
    h('ul', {}, list.map((c) => h('li', { html: rich(c) }))));
}

// textarea with microphone; value lives in answer[key]
export function textField(ctx, { key = 'note', label, rows = 4, autoGrow = true }) {
  const id = `f-${ctx.card.id}-${key}`;
  const ta = h('textarea', { id, rows, placeholder: T.textPlaceholder, autocomplete: 'off', enterkeyhint: 'enter' });
  ta.value = ctx.answer[key] || '';
  ta.addEventListener('input', () => {
    ctx.set({ [key]: ta.value });
    if (autoGrow) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 400) + 'px'; }
  });
  const mic = attachMic({ textarea: ta, lang: ctx.deck.language === 'de' ? 'de-DE' : ctx.deck.language, cardId: ctx.card.id, audio: ctx.audio });
  ctx.onLeave(mic.stop);
  return h('div', { class: 'field' }, h('label', { for: id }, label), ta, mic.el);
}
