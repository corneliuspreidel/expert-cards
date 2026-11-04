// scale: card.min..card.max (default 1..5) with optional end labels card.labels = [low, high].
import { h } from '../ui.js';
import { head, prompt, fig, hintEl, lawButton, textField } from './common.js';

export const render = (ctx) => {
  const { card } = ctx;
  const min = card.min ?? 1, max = card.max ?? 5;
  const vals = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const btns = vals.map((n) => h('button', { type: 'button', class: 'scale-btn', role: 'radio', onclick: () => { ctx.set({ v: n }); paint(); } }, String(n)));
  const paint = () => btns.forEach((b, i) => { const on = ctx.answer.v === vals[i]; b.setAttribute('aria-checked', String(on)); b.classList.toggle('sel', on); });
  ctx.keyHandler = (e) => {
    const n = Number(e.key);
    if (vals.includes(n)) { ctx.set({ v: n }); paint(); return true; }
    return false;
  };
  paint();
  const [lo, hi] = card.labels || [];
  return h('div', { class: 'card scale' },
    ...head(ctx), prompt(ctx), hintEl(ctx), lawButton(ctx), fig(ctx),
    h('div', { class: 'scale-row', role: 'radiogroup', 'aria-label': card.prompt || '' }, btns),
    lo || hi ? h('div', { class: 'scale-labels' }, h('span', {}, lo || ''), h('span', {}, hi || '')) : null,
    card.follow_up ? textField(ctx, { key: 'note', label: card.follow_up.label, rows: 3 }) : null);
};

export const answered = (card, a) => a && a.v != null;
export const summary = (card, a) => (a && a.v != null ? String(a.v) : '');
