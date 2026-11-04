import { h, rich } from '../ui.js';
import { head, fig } from './common.js';

export const render = (ctx) => h('div', { class: 'card info' },
  ...head(ctx),
  fig(ctx),
  ctx.card.body ? h('p', { class: 'body', html: rich(ctx.card.body) }) : null);

export const answered = () => true;
export const summary = () => '';
