// Parametric SVG figure templates. A deck refers to them by name:
//   "figure": {"template": "duplex-plan", "highlight": "party", "caption": "…"}
//   "figure": {"template": "section", "params": {…}, "caption": "…"}
// Image figures: {"image": "assets/foo.svg", "alt": "…", "caption": "…"} (relative to the deck folder).
import { h } from '../ui.js';
import { T } from '../i18n.js';
import { duplexPlan } from './duplex-plan.js';
import { section } from './section.js';

const templates = {
  'duplex-plan': (fig, label) => duplexPlan(fig.highlight || 'base', label),
  section: (fig, label) => section(fig.params || {}, label)
};

export function figure(fig, deckBase) {
  if (!fig) return null;
  const wrap = h('figure', {
    class: `fig fig-panel${fig.template === 'duplex-plan' ? ' plan-hl' : ''}`
  });
  const label = fig.alt || fig.caption || '';
  wrap.append(h('p', { class: 'fig-kicker', 'aria-hidden': 'true' }, T.whereLabel));
  if (fig.image) {
    wrap.append(h('img', { src: `${deckBase}${fig.image}`, alt: label, loading: 'lazy' }));
  } else if (templates[fig.template]) {
    const holder = h('div');
    holder.innerHTML = templates[fig.template](fig, label);
    wrap.append(...holder.childNodes);
  } else {
    return null;
  }
  if (fig.caption) wrap.append(h('figcaption', {}, fig.caption));
  return wrap;
}

export const figureTemplates = Object.keys(templates);
