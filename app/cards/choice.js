// single_choice and multi_choice: large option buttons, optional follow-up text.
import { h, pulse } from '../ui.js';
import { head, prompt, fig, hintEl, lawButton, textField, isEmpty } from './common.js';

function optionButtons(ctx, multi) {
  const { card } = ctx;
  const cur = () => (multi ? ctx.answer.v || [] : ctx.answer.v);
  const buttons = card.options.map((o, i) => {
    const b = h('button', {
      type: 'button', class: 'opt', role: multi ? 'checkbox' : 'radio',
      'data-key': String(i + 1)
    },
    h('span', { class: 'opt-key', 'aria-hidden': 'true' }, String(i + 1)),
    h('span', { class: 'opt-text' }, h('b', {}, o.label), o.detail ? h('span', { class: 'opt-detail' }, o.detail) : null));
    b.addEventListener('click', () => pick(o.id));
    return b;
  });
  function paint(flashId) {
    buttons.forEach((b, i) => {
      const id = card.options[i].id;
      const on = multi ? cur().includes(id) : cur() === id;
      b.setAttribute('aria-checked', String(on));
      b.classList.toggle('sel', on);
      if (on && id === flashId) pulse(b);
    });
  }
  function pick(id) {
    if (multi) {
      let v = [...cur()];
      if (id === 'keine') v = v.includes(id) ? [] : ['keine']; // "none of these" excludes the rest
      else { v = v.filter((x) => x !== 'keine'); v = v.includes(id) ? v.filter((x) => x !== id) : [...v, id]; }
      ctx.set({ v });
    } else {
      ctx.set({ v: id });
    }
    paint(id);
  }
  ctx.keyHandler = (e) => {
    const i = Number(e.key) - 1;
    if (i >= 0 && i < card.options.length) { pick(card.options[i].id); return true; }
    return false;
  };
  paint();
  return h('div', { class: 'opts', role: multi ? 'group' : 'radiogroup', 'aria-label': card.prompt }, buttons);
}

export const render = (ctx) => {
  const multi = ctx.card.type === 'multi_choice';
  const fu = ctx.card.follow_up;
  return h('div', { class: 'card choice' },
    ...head(ctx), prompt(ctx), hintEl(ctx), lawButton(ctx), fig(ctx),
    optionButtons(ctx, multi),
    fu ? textField(ctx, { key: 'note', label: fu.label, rows: 3 }) : null);
};

export const answered = (card, a) => !isEmpty(a && a.v);

export const summary = (card, a) => {
  if (!a || isEmpty(a.v)) return '';
  const label = (id) => (card.options.find((o) => o.id === id) || {}).label || id;
  return Array.isArray(a.v) ? a.v.map(label).join(', ') : label(a.v);
};
