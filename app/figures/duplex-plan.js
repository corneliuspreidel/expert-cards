// Schematic upper-floor plan of the duplex, ported from the legacy form's plan().
// Highlight modes: base, party, ext, hwr, hwrdoor, flur, keller.
import { esc } from '../ui.js';

const WALLS = [
  // id, x1, y1, x2, y2, groups
  ['top', 20, 20, 620, 20, 'ext'], ['bottom', 20, 330, 620, 330, 'ext'],
  ['left', 20, 20, 20, 330, 'ext'], ['right', 620, 20, 620, 330, 'ext'],
  ['party', 320, 20, 320, 330, 'party'],
  ['amid', 20, 170, 320, 170, 'keller'], ['abed', 170, 20, 170, 170, ''], ['abad', 130, 170, 130, 330, 'keller'],
  ['bmid', 320, 170, 520, 170, 'flur keller'], ['bbed', 470, 20, 470, 170, ''],
  ['hwrtop', 520, 170, 620, 170, 'hwr keller'], ['hwrleft', 520, 170, 520, 330, 'hwr flur keller']
];
const ROOMS = [
  [20, 20, 150, 150, 'Schlafen', ''], [170, 20, 150, 150, 'Schlafen', ''],
  [20, 170, 110, 160, 'Bad', ''], [130, 170, 190, 160, 'Flur', ''],
  [320, 20, 150, 150, 'Schlafen', ''], [470, 20, 150, 150, 'Schlafen', ''],
  [320, 170, 200, 160, 'Flur', 'flur'], [520, 170, 100, 160, 'HWR', 'hwr hwrdoor']
];
const DOORS = [
  ['d1', 135, 165, 170, 'h'], ['d2', 200, 240, 170, 'h'], ['d3', 225, 265, 130, 'v'],
  ['d4', 360, 400, 170, 'h'], ['d5', 478, 512, 170, 'h'], ['hwrdoor', 230, 270, 520, 'v']
];

export function duplexPlan(mode, label) {
  const roomHl = mode === 'hwr' || mode === 'hwrdoor' ? 'hwr' : mode === 'flur' ? 'flur' : '';
  let s = `<svg viewBox="0 0 640 372" role="img" aria-label="${esc(label || 'Schema Obergeschoss')}">`;
  for (const [x, y, w, hh, l, g] of ROOMS) {
    const hl = roomHl && g.split(' ').includes(roomHl);
    s += `<rect class="room${hl ? ' hl' : ''}" x="${x}" y="${y}" width="${w}" height="${hh}"/>`;
    s += `<text class="rl" x="${x + w / 2}" y="${y + hh / 2 + 4}" text-anchor="middle">${l}</text>`;
  }
  for (const [id, x1, y1, x2, y2, g] of WALLS) {
    const groups = g.split(' ');
    const hl = (mode === 'party' && id === 'party') || (mode === 'ext' && groups.includes('ext')) ||
      (mode === 'hwr' && groups.includes('hwr')) || (mode === 'flur' && groups.includes('flur')) ||
      (mode === 'keller' && groups.includes('keller'));
    const thin = groups.includes('ext') || id === 'party' ? '' : ' thin';
    s += `<line class="w${thin}${hl ? ' hl' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  for (const [id, a, b, c, o] of DOORS) {
    const hl = mode === 'hwrdoor' && id === 'hwrdoor';
    s += o === 'h'
      ? `<rect class="door${hl ? ' hl' : ''}" x="${a}" y="${c - 5}" width="${b - a}" height="10"/>`
      : `<rect class="door${hl ? ' hl' : ''}" x="${c - 5}" y="${a}" width="10" height="${b - a}"/>`;
  }
  s += '<text class="rl big" x="170" y="356" text-anchor="middle">Wohnung A</text>' +
    '<text class="rl big" x="470" y="356" text-anchor="middle">Wohnung B</text>';
  if (mode === 'keller') s += '<text class="hlabel" x="320" y="13" text-anchor="middle">als Kellergeschoss ausgewiesen</text>';
  return s + '</svg>';
}
