// Small DOM helpers. No framework.

export const esc = (t) =>
  String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Light markup for deck texts: ==marked==, **bold**, newline = line break.
// Everything else is escaped, so deck text can never inject HTML.
export function rich(t) {
  return esc(t)
    .replace(/==(.+?)==/g, '<mark>$1</mark>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\n/g, '<br>');
}

// h('button', {class:'btn', onclick: fn, 'aria-label': 'x'}, 'text', child)
// `html` attr sets innerHTML (only pass output of rich() or figure code).
export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

// Soft pick animation for option / verdict buttons (no-op if reduced motion).
export function pulse(el) {
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  el.classList.remove('pop');
  // force reflow so the animation restarts when re-selecting
  void el.offsetWidth;
  el.classList.add('pop');
}

export function modal(title, body, closeLabel) {
  const dlg = h('dialog', { class: 'modal', 'aria-label': title });
  const close = () => { try { dlg.close(); } catch { /* ignore */ } dlg.remove(); };
  dlg.append(
    h('h2', {}, title),
    h('div', { class: 'modal-body' }, body),
    h('button', { class: 'btn primary', onclick: close }, closeLabel)
  );
  dlg.addEventListener('cancel', () => dlg.remove());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  document.body.append(dlg);
  if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  return dlg;
}
