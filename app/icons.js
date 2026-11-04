// Small inline SVG pictograms for section/round themes. No external assets.
import { h } from './ui.js';

const ATTR = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

const paths = {
  compass: `<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5 10 14l-2.5-.5L10 9l4.5.5Z"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>`,
  wall: `<path d="M4 20V6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5V20"/><path d="M4 10h16M4 15h16M12 5v15"/>`,
  column: `<path d="M7 20h10M8.5 20V9.5M15.5 20V9.5"/><path d="M6 9.5h12M7.5 6h9"/><path d="M9 6V4.5h6V6"/>`,
  note: `<path d="M7 3.5h7.5L19 8v12.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z"/><path d="M14.5 3.5V8H19M8.5 12h7M8.5 15.5h5"/>`,
  send: `<path d="M4 11.5 20 4l-4.5 16-3.5-6.5L4 11.5Z"/><path d="M12 13.5 20 4"/>`,
  cards: `<rect x="4" y="5" width="12" height="14" rx="1.5"/><path d="M8 5V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-1"/>`,
  chat: `<path d="M5 17.5 4 21l3.6-1.5A8.5 8.5 0 1 0 5 17.5Z"/><path d="M8.5 11h7M8.5 14h4.5"/>`,
  person: `<circle cx="12" cy="8" r="3.5"/><path d="M5.5 19.5c1.8-3.2 4-4.8 6.5-4.8s4.7 1.6 6.5 4.8"/>`
};

export function pictogram(name, label) {
  const inner = paths[name] || paths.cards;
  return h('span', {
    class: 'pict',
    role: label ? 'img' : null,
    'aria-label': label || null,
    'aria-hidden': label ? null : 'true',
    html: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><g ${ATTR}>${inner}</g></svg>`
  });
}
