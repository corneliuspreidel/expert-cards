// Presentation skin: classic (default) vs fresh (clearer hierarchy, isometric plans).
// Preference is local only — not part of the answers payload.
import { h } from './ui.js';
import { T } from './i18n.js';

const KEY = 'expert-cards-skin';

export function getSkin() {
  try {
    const s = localStorage.getItem(KEY);
    if (s === 'fresh' || s === 'classic') return s;
  } catch { /* ignore */ }
  return 'classic';
}

export function isFresh() {
  return getSkin() === 'fresh';
}

export function applySkin() {
  const s = getSkin();
  document.documentElement.dataset.skin = s;
  document.documentElement.classList.toggle('skin-fresh', s === 'fresh');
  document.documentElement.classList.toggle('skin-classic', s === 'classic');
}

export function setSkin(next) {
  const s = next === 'fresh' ? 'fresh' : 'classic';
  try { localStorage.setItem(KEY, s); } catch { /* ignore */ }
  applySkin();
  return s;
}

export function toggleSkin() {
  return setSkin(getSkin() === 'fresh' ? 'classic' : 'fresh');
}

/** Quiet control: experts keep classic; authors can try the fresh layout. */
export function skinToggle(onChange) {
  const paint = (btn) => {
    const fresh = isFresh();
    btn.setAttribute('aria-pressed', String(fresh));
    btn.title = fresh ? T.skinToClassic : T.skinToFresh;
    btn.replaceChildren(
      h('span', { class: 'skin-dot', 'aria-hidden': 'true' }),
      h('span', { class: 'skin-label' }, fresh ? T.skinFreshOn : T.skinClassicOn));
  };
  const btn = h('button', {
    type: 'button',
    class: 'skin-toggle',
    'aria-label': T.skinToggleAria,
    onclick: () => { toggleSkin(); paint(btn); if (onChange) onChange(); }
  });
  paint(btn);
  return btn;
}
