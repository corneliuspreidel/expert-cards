// E-mail adapter: mailto: with readable summary + compact JSON, plus a backup file to attach.
// Nothing leaves the device until the expert sends the mail themselves.
import { h } from '../ui.js';
import { T } from '../i18n.js';

export function render(ctx) {
  const sub = ctx.deck.submission || {};
  const to = sub.to && sub.to !== 'PLEASE_SET' ? sub.to : '';
  const copyNote = h('span', { class: 'hint', role: 'status' });
  const text = ctx.report();
  const ta = h('textarea', { class: 'copy', readonly: true, rows: 5, 'aria-label': T.copy });
  ta.value = text;
  // Windows mail clients cut mailto: links at about 2000 characters: there the full text goes to the clipboard
  const shortBody = /Windows/.test(navigator.userAgent) && encodeURIComponent(text).length > 1500;
  const body = shortBody ? T.mailShortBody : text;
  const mailto = `mailto:${encodeURIComponent(to).replace('%40', '@')}?subject=${encodeURIComponent(sub.subject || ctx.deck.title)}&body=${encodeURIComponent(body)}`;
  const copy = async () => { try { await navigator.clipboard.writeText(text); copyNote.textContent = T.copied; return true; } catch { ta.select(); return false; } };
  return h('div', { class: 'submit-steps' },
    !to ? h('p', { class: 'warn' }, T.noRecipient) : null,
    sub.backup_file === false ? null : h('div', { class: 'step' },
      h('p', {}, h('b', {}, T.emailStep1)),
      h('button', { type: 'button', class: 'btn', onclick: () => ctx.download() }, T.download)),
    h('div', { class: 'step' },
      h('p', {}, h('b', {}, T.emailStep2)),
      h('a', { class: 'btn primary', href: mailto, onclick: () => { if (shortBody) copy(); } }, T.openMail),
      shortBody ? h('p', { class: 'hint' }, T.mailShortHint) : null),
    h('div', { class: 'step' },
      h('p', {}, T.emailStep3),
      h('button', {
        type: 'button', class: 'btn',
        onclick: copy
      }, T.copy), copyNote,
      ta),
    h('div', { class: 'step' }, h('button', { type: 'button', class: 'btn primary', onclick: ctx.markSent }, T.sentConfirm)));
}
