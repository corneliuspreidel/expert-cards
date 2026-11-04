// Webhook adapter (optional): POST the answers as JSON to deck.submission.url.
// The endpoint is not part of this repo (e.g. a Cloudflare Worker). The e-mail path stays as fallback.
import { h } from '../ui.js';
import { T } from '../i18n.js';

export function render(ctx) {
  const url = (ctx.deck.submission || {}).url;
  const msg = h('p', { role: 'status' });
  const btn = h('button', {
    type: 'button', class: 'btn primary',
    onclick: async () => {
      btn.disabled = true;
      try {
        const body = JSON.stringify(await ctx.payload(true));
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        if (!r.ok) throw new Error(String(r.status));
        msg.textContent = T.webhookOk;
        ctx.markSent();
      } catch {
        msg.textContent = T.webhookFail;
        btn.disabled = false;
      }
    }
  }, T.webhookSend);
  return h('div', { class: 'submit-steps' },
    h('div', { class: 'step' }, btn, msg),
    h('div', { class: 'step' }, h('button', { type: 'button', class: 'btn', onclick: () => ctx.download() }, T.download)));
}
