// Schematic building section, ported from the legacy form's section().
// Params: k (basement yes/no), hl ('og' | 'kg'), og / kg (wall rating labels), x (label of the changed wall).
import { esc } from '../ui.js';

export function section(p, label) {
  const top = 34, h = 96, g = top + 2 * h + 6;
  let s = `<svg viewBox="0 0 640 ${p.k ? 330 : 250}" role="img" aria-label="${esc(label || 'Schema Schnitt')}">`;
  const lv = [['OG', top], ['EG', top + h]];
  if (p.k) lv.push(['KG', g + 2]);
  for (const [n, y] of lv) {
    s += `<rect class="slab" x="30" y="${y - 6}" width="580" height="6"/>`;
    s += `<text class="rl big" x="8" y="${y + h / 2}">${n}</text>`;
  }
  s += `<rect class="slab" x="30" y="${p.k ? g + 2 + h - 2 : g - 6}" width="580" height="6"/>`;
  s += `<line class="ground" x1="0" y1="${g}" x2="640" y2="${g}"/><text class="rl" x="636" y="${g - 6}" text-anchor="end">Gelände</text>`;
  const xs = [40, 320, 600];
  for (const [n, y] of lv) {
    xs.forEach((x, i) => {
      const hl = (p.hl === 'og' && n === 'OG' && i === 0) || (p.hl === 'kg' && n === 'KG' && i === 0);
      s += `<line class="w${hl ? ' hl' : ''}" x1="${x}" y1="${y}" x2="${x}" y2="${y + h - 8}"/>`;
    });
    const lab = esc(n === 'KG' ? p.kg : p.og);
    s += `<text class="rl" x="180" y="${y + h / 2 + 4}" text-anchor="middle">${lab}</text>` +
      `<text class="rl" x="460" y="${y + h / 2 + 4}" text-anchor="middle">${lab}</text>`;
  }
  if (p.hl) {
    const y = p.hl === 'og' ? top : g + 2;
    s += `<text class="hlabel" x="54" y="${y + 18}">${esc(p.x)}</text>`;
  }
  return s + '</svg>';
}
