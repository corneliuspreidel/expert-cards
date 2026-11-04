import { h } from '../ui.js';
import { head, prompt, fig, hintEl, lawButton, textField } from './common.js';

export const render = (ctx) => h('div', { class: 'card free-text' },
  ...head(ctx), prompt(ctx), hintEl(ctx), lawButton(ctx), fig(ctx),
  textField(ctx, { key: 'note', label: ctx.card.label || 'Ihre Antwort', rows: 7 }));

export const answered = (card, a) => !!(a && a.note && a.note.trim());
export const summary = (card, a) => (a && a.note ? a.note.trim() : '');
