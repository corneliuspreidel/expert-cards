// Engine: state machine start → intro cards → sections → review → submit.
// Knows nothing about any particular study; everything comes from the deck.
import { h, rich, modal } from './ui.js';
import { T, setLang } from './i18n.js';
import { makeStore } from './storage.js';
import { cards } from './cards/index.js';
import { adapters } from './submit/index.js';
import { textField } from './cards/common.js';

const app = document.getElementById('app');
let deck, deckBase, steps, lessons, state, store;
let editing = false;
let t0 = 0;
let cleanups = [];
let keyHandler = null;
let navEl = null;
let primary = null; // Enter on the lesson overview / lesson end

// append that skips null/false children (native append would write the text "null")
const put = (el, ...kids) => el.append(...kids.flat().filter((k) => k != null && k !== false));
const now = () => new Date().toISOString();
const stepIndex = (kind) => steps.findIndex((s) => s.kind === kind);
const cardSteps = () => steps.filter((s) => s.kind === 'card');
const homeIdx = () => stepIndex('home');

/* ---------- boot ---------- */

async function getJson(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

async function boot() {
  try {
    let id = new URLSearchParams(location.search).get('deck');
    if (!id || !/^[\w-]+$/.test(id)) id = (await getJson('decks/index.json')).decks[0].id;
    deckBase = `decks/${id}/`;
    deck = await getJson(`${deckBase}deck.json`);
  } catch (e) {
    app.replaceChildren(h('main', { class: 'screen' }, h('h1', {}, T.appName), h('p', { class: 'warn' }, T.loadFail), h('p', { class: 'hint' }, String(e.message || e))));
    return;
  }
  setLang(deck.language);
  document.documentElement.lang = deck.language || 'de';
  document.title = deck.title;

  const code = (new URLSearchParams(location.hash.slice(1)).get('k') || '').replace(/[^\w-]/g, '').slice(0, 32);
  store = makeStore(deck.id, deck.version, code);
  await store.audio.loadAll();
  steps = buildSteps();
  state = store.load() || { v: 1, deck: { id: deck.id, version: deck.version }, code, person: {}, consent: null, answers: {}, timing: {}, changes: {}, pos: 0, startedAt: null, updatedAt: null, submittedAt: null };
  state.pos = state.startedAt && state.consent ? homeIdx() : 0; // like a lesson app: returning experts land on the lesson overview

  window.addEventListener('hashchange', () => location.reload()); // another invite code = another saved state
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { lap(); t0 = 0; } else if (steps[state.pos].kind === 'card') t0 = Date.now();
  });
  window.addEventListener('pagehide', () => { lap(); store.flush(state); });
  render();
}

// Lessons ("Häppchen"): every section is cut into small lessons of about `settings.lesson_size` cards
// (default 6, a section may set its own `lesson_size`). Steps: start, home, [lesson cards, lessondone]*, review, submit.
function buildSteps() {
  const size = (deck.settings && deck.settings.lesson_size) || 6;
  const intro = (deck.intro_cards || []).map((c, i) => ({ kind: 'card', card: { ...c, id: c.id || `intro${i + 1}` }, section: null, before: c.before_section || null }));
  lessons = [];
  for (const sec of deck.sections || []) {
    if (!sec.cards.length) continue;
    const k = Math.ceil(sec.cards.length / (sec.lesson_size || size));
    const per = Math.ceil(sec.cards.length / k);
    for (let j = 0; j < k; j++) {
      lessons.push({
        sec: sec.id, title: sec.title, part: k > 1 ? [j + 1, k] : null,
        steps: sec.cards.slice(j * per, (j + 1) * per).map((c, i) => ({ kind: 'card', card: c, section: sec, idx: j * per + i, n: sec.cards.length }))
      });
    }
  }
  if (deck.closing) {
    const title = deck.closing.title || T.closingTitle;
    lessons.push({ sec: '_closing', title, part: null, steps: [{ kind: 'card', card: { id: 'closing', type: 'free_text', prompt: deck.closing.free_text_label, label: deck.closing.free_text_label }, section: { title, cards: [] } }] });
  }
  if (!lessons.length) lessons.push({ sec: '_intro', title: deck.title, part: null, steps: [] });
  for (const c of [...intro].reverse()) {
    const target = (c.before && lessons.find((l) => l.sec === c.before)) || lessons[0];
    target.steps.unshift(c);
  }
  const s = [{ kind: 'start' }, { kind: 'home' }];
  lessons.forEach((l, i) => {
    l.steps.forEach((st) => { st.lesson = i; s.push(st); });
    s.push({ kind: 'lessondone', lesson: i });
  });
  s.push({ kind: 'review' }, { kind: 'submit' });
  return s;
}

const countable = (l) => l.steps.filter((s) => s.card.type !== 'info');
function lessonStats(l) {
  const c = countable(l);
  const answered = c.filter(cardAnswered).length;
  return { total: c.length, answered, done: answered === c.length };
}
const lessonName = (l) => (l.part ? T.lessonPart(l.part[0], l.part[1], l.title) : l.title);
// where a lesson is entered: first open question if it was started, else its first card
function lessonEntry(i) {
  const l = lessons[i];
  const c = countable(l);
  const open = c.find((s) => !cardAnswered(s));
  return steps.indexOf(open && c.some(cardAnswered) ? open : l.steps[0]);
}

/* ---------- state ---------- */

function persist() {
  state.updatedAt = now();
  store.save(state);
}

function lap() {
  const st = steps[state.pos];
  if (st && st.kind === 'card' && t0) {
    const id = st.card.id;
    state.timing[id] = (state.timing[id] || 0) + (Date.now() - t0);
  }
  t0 = Date.now();
}

function go(pos, opts = {}) {
  lap();
  cleanups.forEach((f) => { try { f(); } catch { /* ignore */ } });
  cleanups = [];
  keyHandler = null;
  state.pos = Math.max(0, Math.min(steps.length - 1, pos));
  state.furthest = Math.max(state.furthest || 0, state.pos);
  editing = !!opts.editing;
  persist();
  render();
  window.scrollTo(0, 0);
}

const next = () => { if (editing) go(stepIndex('review')); else go(state.pos + 1); };
const prev = () => {
  if (editing) return go(stepIndex('review'));
  const p = steps[state.pos - 1];
  go(!p || p.kind === 'lessondone' || p.kind === 'home' ? homeIdx() : state.pos - 1);
};

function answerOf(id) { return state.answers[id] || {}; }

function cardAnswered(step) {
  const mod = cards[step.card.type];
  if (!mod || step.card.type === 'info') return true;
  return mod.answered(step.card, state.answers[step.card.id]);
}

function summaryOf(step) {
  const mod = cards[step.card.type];
  return mod ? mod.summary(step.card, state.answers[step.card.id], deck) : '';
}

// for "hängt mit Frage N zusammen"
function lookup(id) {
  const st = steps.find((s) => s.kind === 'card' && s.card.id === id);
  if (!st) return null;
  return { number: (st.idx ?? 0) + 1, text: summaryOf(st) };
}

/* ---------- screens ---------- */

function render() {
  const st = steps[state.pos];
  app.replaceChildren();
  if (st.kind === 'start') return renderStart();
  const bare = st.kind === 'home' || st.kind === 'lessondone';
  primary = null;
  if (!bare) app.append(topbar(st));
  const main = h('main', { class: `screen ${st.kind}`, id: 'main' });
  app.append(main);
  if (st.kind === 'card') renderCard(main, st);
  else if (st.kind === 'review') renderReview(main);
  else if (st.kind === 'home') renderHome(main);
  else if (st.kind === 'lessondone') renderLessonDone(main, st);
  else renderSubmit(main);
  if (!bare && (st.kind !== 'submit' || !state.submittedAt)) { navEl = nav(st); app.append(navEl); }
  attachSwipe(main);
  if (!store.ok) main.prepend(h('p', { class: 'warn' }, T.saveFail));
  const hd = main.querySelector('h1');
  if (hd) hd.focus({ preventScroll: true });
  t0 = Date.now();
}

function topbar(st) {
  let label, pct;
  if (st.kind === 'card') {
    const l = lessons[st.lesson];
    const p = l.steps.indexOf(st) + 1;
    label = T.topLabel(st.lesson + 1, p, l.steps.length);
    pct = Math.round(((p - 1) / l.steps.length) * 100);
  } else { label = st.kind === 'review' ? T.review : T.submitTitle; pct = 100; }
  return h('header', { class: 'topbar' },
    h('div', { class: 'topbar-row' },
      h('span', { class: 'topbar-label' }, label),
      h('button', { type: 'button', class: 'linkbtn', onclick: later }, T.later)),
    h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': label },
      h('div', { class: 'bar-fill', style: `width:${pct}%` })));
}

// "Später weitermachen": everything is saved already; go back to the lesson overview
function later() {
  lap(); store.flush(state);
  go(homeIdx());
}

function nav(st) {
  const answeredNow = st.kind !== 'card' || cardAnswered(st);
  const label = editing ? T.toReview : (st.kind === 'card' ? (answeredNow ? T.next : T.skip) : st.kind === 'review' ? T.submit : T.next);
  const nextBtn = h('button', { type: 'button', class: `btn ${answeredNow || st.kind !== 'card' ? 'primary' : ''}`, onclick: () => (st.kind === 'review' ? go(stepIndex('submit')) : next()) }, label);
  return h('nav', { class: 'bottomnav', 'aria-label': 'Navigation' },
    editing ? h('span') : h('button', { type: 'button', class: 'btn', onclick: prev }, T.back),
    st.kind === 'submit' ? null : nextBtn);
}

function updateNav() {
  const st = steps[state.pos];
  if (!navEl || st.kind !== 'card') return;
  const fresh = nav(st);
  navEl.replaceWith(fresh);
  navEl = fresh;
}

function makeCtx(st) {
  const ctx = {
    deck, deckBase, state, card: st.card, section: st.section, idx: st.idx, n: st.n, editing,
    audio: store.audio, lookup, next, prev,
    get answer() { return state.answers[st.card.id] || {}; },
    set(patch) {
      const a = state.answers[st.card.id] || (state.answers[st.card.id] = {});
      if ('v' in patch && a.v !== undefined && JSON.stringify(a.v) !== JSON.stringify(patch.v)) {
        state.changes[st.card.id] = (state.changes[st.card.id] || 0) + 1;
      }
      for (const [k, v] of Object.entries(patch)) { if (v == null || v === '') delete a[k]; else a[k] = v; }
      persist();
      updateNav();
    },
    onLeave: (f) => cleanups.push(f),
    set keyHandler(f) { keyHandler = f; }
  };
  return ctx;
}

function renderCard(main, st) {
  const mod = cards[st.card.type];
  if (!mod) { main.append(h('p', { class: 'warn' }, T.unsupportedCard)); return; }
  main.append(mod.render(makeCtx(st)));
}

function renderStart() {
  const hasProgress = !!state.startedAt && (state.furthest || 0) > 0;
  const consent = h('input', { type: 'checkbox', id: 'consent' });
  consent.checked = !!state.consent;
  const go1 = h('button', { type: 'button', class: 'btn primary big', disabled: !consent.checked }, hasProgress ? T.resume : T.start);
  consent.addEventListener('change', () => {
    go1.disabled = !consent.checked;
    state.consent = consent.checked ? { given: true, at: now() } : null;
    persist();
  });
  go1.addEventListener('click', () => {
    if (!state.startedAt) state.startedAt = now();
    go(homeIdx());
  });
  const sub = deck.submission || {};
  const to = sub.to && sub.to !== 'PLEASE_SET' ? sub.to : '';
  const est = deck.estimated_minutes;
  const main = h('main', { class: 'screen start', id: 'main' },
    h('p', { class: 'eyebrow' }, deck.owner ? `${deck.owner.name}, ${deck.owner.institution}` : T.appName),
    h('h1', { tabindex: '-1' }, deck.title),
    deck.subtitle ? h('p', { class: 'lead' }, deck.subtitle) : null,
    est ? h('p', {}, T.minutes(est.part1, est.total)) : null,
    state.code ? h('p', { class: 'hint' }, `${T.invite}: `, h('b', {}, state.code)) : null,
    hasProgress ? h('div', { class: 'resume' },
      h('p', {}, T.resumeInfo(...overall())),
      h('button', { type: 'button', class: 'linkbtn', onclick: () => { if (confirm(T.restartConfirm)) { store.clear(); location.reload(); } } }, T.restart)) : null,
    ...identityFields('start'),
    h('section', { class: 'privacy' }, h('h2', {}, T.privacyTitle), h('ul', {}, T.privacy(to).map((t) => h('li', {}, t)))),
    deck.consent_text ? h('p', { class: 'consent-text' }, deck.consent_text) : null,
    h('label', { class: 'check', for: 'consent' }, consent, h('span', {}, T.consentLabel)),
    go1, legalLinks());
  app.append(main);
  main.querySelector('h1').focus({ preventScroll: true });
}

// Links to imprint / privacy statement, taken from the deck (`legal`). Nothing study-specific in the engine.
function legalLinks() {
  const l = deck.legal;
  if (!l || (!l.privacy_url && !l.imprint_url)) return null;
  const a = (href, text) => h('a', { href, target: '_blank', rel: 'noopener' }, text);
  return h('p', { class: 'legal hint' }, l.note || T.legalNote, ' ',
    l.privacy_url ? a(l.privacy_url, T.legalPrivacy) : null, l.privacy_url && l.imprint_url ? ' · ' : null,
    l.imprint_url ? a(l.imprint_url, T.legalImprint) : null);
}

function overall() {
  const st = lessons.map(lessonStats);
  return [st.reduce((a, x) => a + x.answered, 0), st.reduce((a, x) => a + x.total, 0), st.filter((x) => x.done).length, st.length];
}

function renderHome(main) {
  const stats = lessons.map(lessonStats);
  const [ans, total] = overall();
  const cur = stats.findIndex((x) => !x.done);
  const pct = total ? Math.round((ans / total) * 100) : 0;
  const act = () => (cur < 0 ? go(stepIndex('review')) : go(lessonEntry(cur)));
  primary = act;
  put(main, 
    h('p', { class: 'eyebrow' }, deck.title),
    h('h1', { tabindex: '-1' }, T.homeTitle),
    h('p', { class: 'lead' }, T.homeProgress(ans, total)),
    h('div', { class: 'bar thick', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': T.homeProgress(ans, total) },
      h('div', { class: 'bar-fill', style: `width:${pct}%` })),
    h('button', { type: 'button', class: 'btn primary big', onclick: act },
      cur < 0 ? T.homeToReview : (ans ? T.homeContinue : T.homeStart)(lessonName(lessons[Math.max(cur, 0)]))),
    h('p', { class: 'hint saved' }, T.homeSaved));
  let group = null, ul = null;
  lessons.forEach((l, i) => {
    if (l.sec !== group) { group = l.sec; main.append(h('h2', {}, l.title)); ul = h('ul', { class: 'lessons' }); main.append(ul); }
    const s = stats[i];
    const state_ = s.done ? 'done' : i === cur ? 'current' : s.answered ? 'started' : '';
    const title = l.part ? T.lessonPartShort(l.part[0], l.part[1]) : l.title;
    ul.append(h('li', {}, h('button', { type: 'button', class: `lesson ${state_}`, onclick: () => go(lessonEntry(i)) },
      h('span', { class: 'badge', 'aria-hidden': 'true' }, s.done ? '✓' : String(i + 1)),
      h('span', { class: 'lesson-main' },
        h('span', { class: 'lesson-title' }, T.lessonN(i + 1), ' · ', title),
        h('span', { class: 'lesson-meta' }, s.done ? T.lessonMetaDone(s.total) : s.answered ? T.lessonMetaPart(s.answered, s.total) : T.lessonMetaNew(s.total))))));
  });
  const open = total - ans;
  put(main, h('h2', {}, T.homeEndTitle), h('ul', { class: 'lessons' }, h('li', {},
    h('button', { type: 'button', class: `lesson ${cur < 0 ? 'current' : ''}`, onclick: () => go(stepIndex('review')) },
      h('span', { class: 'badge', 'aria-hidden': 'true' }, '★'),
      h('span', { class: 'lesson-main' },
        h('span', { class: 'lesson-title' }, T.homeReviewTile),
        h('span', { class: 'lesson-meta' }, T.openCount(open)))))),
    h('button', { type: 'button', class: 'linkbtn', onclick: () => go(0) }, T.homeAbout),
    legalLinks());
}

function renderLessonDone(main, st) {
  const i = st.lesson, l = lessons[i], s = lessonStats(l);
  const last = i === lessons.length - 1;
  const min = Math.max(1, Math.round(l.steps.reduce((a, x) => a + (state.timing[x.card.id] || 0), 0) / 60000));
  const [ans, total, doneN, n] = overall();
  const firstOpen = countable(l).find((x) => !cardAnswered(x));
  const act = last ? () => go(stepIndex('review')) : () => go(lessonEntry(i + 1));
  primary = act;
  put(main, 
    h('div', { class: `celebrate ${s.done ? '' : 'part'}`, 'aria-hidden': 'true' }, s.done ? '✓' : '…'),
    h('h1', { tabindex: '-1' }, s.done ? T.lessonDoneTitle(i + 1) : T.lessonEndTitle(i + 1)),
    h('p', { class: 'lead' }, T.lessonStats(s.answered, s.total, min)),
    h('div', { class: 'bar thick', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(total ? Math.round((ans / total) * 100) : 0), 'aria-label': T.lessonsDone(doneN, n) },
      h('div', { class: 'bar-fill', style: `width:${total ? Math.round((ans / total) * 100) : 0}%` })),
    h('p', { class: 'hint' }, T.lessonsDone(doneN, n)),
    firstOpen ? h('div', { class: 'warn' }, h('p', {}, T.lessonOpen(s.total - s.answered)),
      h('button', { type: 'button', class: 'btn small', onclick: () => go(steps.indexOf(firstOpen)) }, T.lessonShowOpen)) : null,
    h('div', { class: 'done-actions' },
      h('button', { type: 'button', class: 'btn primary big', onclick: act }, last ? T.homeToReview : T.lessonNext(lessonName(lessons[i + 1]))),
      h('button', { type: 'button', class: 'btn big', onclick: () => go(homeIdx()) }, T.lessonPause)),
    h('button', { type: 'button', class: 'linkbtn', onclick: () => go(state.pos - 1) }, T.back));
}

function identityFields(at) {
  return (deck.identity_fields || []).filter((f) => (f.at || 'start') === at).map((f) => {
    const val = state.person[f.id] ?? '';
    const set = (v) => { state.person[f.id] = v; persist(); };
    if (f.type === 'choice') {
      const group = h('div', { class: 'chipset', role: 'radiogroup', 'aria-label': f.label });
      const btns = f.options.map((o) => h('button', { type: 'button', class: 'chipbtn', role: 'radio', onclick: () => { set(o); paint(); } }, o));
      const paint = () => btns.forEach((b, i) => { const on = state.person[f.id] === f.options[i]; b.setAttribute('aria-checked', String(on)); b.classList.toggle('sel', on); });
      group.append(...btns);
      paint();
      return h('div', { class: 'field' }, h('p', { class: 'label' }, f.label, f.required ? '' : ` (${T.optional})`), group);
    }
    const input = h('input', { id: `id-${f.id}`, type: f.type === 'number' ? 'number' : 'text', inputmode: f.type === 'number' ? 'numeric' : null, autocomplete: f.id === 'name' ? 'name' : 'off' });
    input.value = val;
    input.addEventListener('input', () => set(input.value));
    return h('div', { class: 'field' }, h('label', { for: input.id }, f.label, f.required ? '' : ` (${T.optional})`), input);
  });
}

function renderReview(main) {
  const sections = [];
  let open = 0;
  const list = (title, sts) => {
    const items = sts.map((st) => {
      const done = cardAnswered(st);
      if (!done) open++;
      const a = answerOf(st.card.id);
      const label = st.card.title ? `${st.card.id} · ${st.card.title}` : (st.card.prompt || st.card.id);
      const text = summaryOf(st);
      return h('li', {},
        h('button', { type: 'button', class: `row ${done ? '' : 'open'}`, onclick: () => go(steps.indexOf(st), { editing: true }) },
          h('span', { class: 'row-status', 'aria-hidden': 'true' }, done ? '✓' : '○'),
          h('span', { class: 'row-main' },
            h('span', { class: 'row-label' }, label),
            h('span', { class: 'row-answer' }, done ? (text || T.emptyAnswer) : T.open,
              st.card.type !== 'free_text' && a.note ? ` · „${a.note.slice(0, 80)}${a.note.length > 80 ? '…' : ''}“` : '',
              a.reason ? ` · „${a.reason.slice(0, 80)}${a.reason.length > 80 ? '…' : ''}“` : '',
              store.audio.has(st.card.id) ? ' · 🎙' : ''))));
    });
    sections.push(h('section', {}, h('h2', {}, title), h('ul', { class: 'rows' }, items)));
  };
  const answerable = cardSteps().filter((s) => s.card.type !== 'info');
  const groups = new Map();
  for (const st of answerable) { const t = st.section ? st.section.title : ''; (groups.get(t) || groups.set(t, []).get(t)).push(st); }
  for (const [t, sts] of groups) list(t, sts);
  const extra = identityFields('end');
  put(main, 
    h('h1', { tabindex: '-1' }, T.review),
    h('p', { class: 'lead' }, T.reviewIntro),
    h('p', { class: open ? 'warn' : 'ok', role: 'status' }, T.openCount(open)),
    ...sections,
    extra.length ? h('section', {}, h('h2', {}, T.moreAboutYou), ...extra) : null,
    feedbackBox());
}

// Optional, collapsed feedback about the app itself (not about the study content).
function feedbackBox() {
  if (deck.settings && deck.settings.app_feedback === false) return null;
  const ctx = makeCtx({ kind: 'card', card: { id: '_feedback', type: 'free_text' }, section: null });
  const chips = h('div', { class: 'chipset', role: 'radiogroup', 'aria-label': T.fbRating });
  const btns = T.fbOptions.map(([id, label]) => h('button', { type: 'button', class: 'chipbtn', role: 'radio', onclick: () => { ctx.set({ v: ctx.answer.v === id ? null : id }); paint(); } }, label));
  const paint = () => btns.forEach((b, i) => { const on = ctx.answer.v === T.fbOptions[i][0]; b.setAttribute('aria-checked', String(on)); b.classList.toggle('sel', on); });
  chips.append(...btns);
  paint();
  const d = h('details', { class: 'feedback' },
    h('summary', {}, T.fbTitle),
    h('p', { class: 'hint' }, T.fbIntro),
    chips,
    textField(ctx, { key: 'note', label: T.fbLabel, rows: 3 }));
  if (ctx.answer.v || ctx.answer.note) d.open = true;
  return d;
}

/* ---------- submission ---------- */

async function payload(withAudio = true) {
  lap();
  const p = {
    format: 'expert-cards/answers@1',
    deck: { id: deck.id, version: deck.version },
    code: state.code || null,
    person: state.person,
    consent: state.consent,
    startedAt: state.startedAt, updatedAt: state.updatedAt, submittedAt: state.submittedAt,
    answers: state.answers, timing_ms: state.timing, changes: state.changes
  };
  if (withAudio) {
    p.audio = [];
    for (const [card, rec] of store.audio.all()) {
      const data = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1] || ''); fr.readAsDataURL(rec.blob); });
      p.audio.push({ card, mime: rec.mime, ms: rec.ms, base64: data });
    }
  }
  return p;
}

function reportText() {
  const lines = [`${deck.title}`, `${T.invite}: ${state.code || '-'}`];
  for (const f of deck.identity_fields || []) if (state.person[f.id]) lines.push(`${f.label}: ${state.person[f.id]}`);
  let sec = null;
  for (const st of cardSteps()) {
    if (st.card.type === 'info') continue;
    const t = st.section ? st.section.title : '';
    if (t !== sec) { sec = t; lines.push('', `## ${t}`); }
    const a = answerOf(st.card.id);
    const parts = [summaryOf(st) || '–'];
    if (st.card.type !== 'free_text' && a.note) parts.push(`Anmerkung: ${a.note}`);
    if (a.reason) parts.push(`Begründung: ${a.reason}`);
    if (store.audio.has(st.card.id)) parts.push('(Sprachnotiz in Sicherungsdatei)');
    lines.push(`${st.card.id}: ${parts.join(' | ')}`);
  }
  const fb = answerOf('_feedback');
  if (fb.v || fb.note) {
    lines.push('', '## Feedback zur App', [fb.v, fb.note].filter(Boolean).join(' | '));
  }
  // compact JSON block (no audio) for import_answers.py
  const compact = {
    format: 'expert-cards/answers@1', deck: { id: deck.id, version: deck.version }, code: state.code || null,
    person: state.person, startedAt: state.startedAt, updatedAt: state.updatedAt,
    answers: state.answers, timing_ms: state.timing, changes: state.changes
  };
  lines.push('', '---BEGIN EXPERT-CARDS JSON---', JSON.stringify(compact), '---END EXPERT-CARDS JSON---');
  return lines.join('\n');
}

async function download() {
  const blob = new Blob([JSON.stringify(await payload(true), null, 1)], { type: 'application/json' });
  const name = `${deck.id}_${state.code || 'anon'}_${new Date().toISOString().slice(0, 10)}.json`;
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

function markSent() {
  if (!confirm(T.sentAsk)) return;
  state.submittedAt = now();
  persist(); store.flush(state);
  render();
}

function renderSubmit(main) {
  if (state.submittedAt) {
    put(main, h('h1', { tabindex: '-1' }, T.doneTitle), h('p', {}, T.doneBody),
      h('button', { type: 'button', class: 'btn', onclick: () => go(stepIndex('review')) }, T.doneAgain),
      h('button', { type: 'button', class: 'linkbtn', onclick: () => { state.submittedAt = null; persist(); store.flush(state); render(); } }, T.notSentYet),
      legalLinks());
    return;
  }
  const adapter = adapters[(deck.submission || {}).mode] || adapters.email;
  put(main, h('h1', { tabindex: '-1' }, T.submitTitle), h('p', { class: 'lead' }, T.submitIntro),
    adapter.render({ deck, report: reportText, payload, download, markSent }), legalLinks());
}

/* ---------- input: keyboard + swipe ---------- */

function onKey(e) {
  if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector('dialog[open]')) return;
  const tag = (e.target.tagName || '').toLowerCase();
  const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
  const st = steps && steps[state.pos];
  if (!st || st.kind === 'start') return;
  if (typing) return;
  const bare = st.kind === 'home' || st.kind === 'lessondone';
  if (bare && (e.key === 'ArrowRight' || (e.key === 'Enter' && tag !== 'button' && tag !== 'a'))) { e.preventDefault(); if (primary) primary(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); if (st.kind !== 'home') prev(); }
  else if (bare) return;
  else if (e.key === 'ArrowRight') { e.preventDefault(); if (st.kind === 'review') go(stepIndex('submit')); else if (st.kind !== 'submit') next(); }
  else if (e.key === 'Enter' && tag !== 'button' && tag !== 'a') { e.preventDefault(); if (st.kind === 'review') go(stepIndex('submit')); else if (st.kind === 'card') next(); }
  else if (keyHandler && keyHandler(e)) e.preventDefault();
}

function attachSwipe(el) {
  let x0 = 0, y0 = 0;
  el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) < 80 || Math.abs(dy) > 50 || /textarea|input/i.test(e.target.tagName)) return;
    const st = steps[state.pos];
    if (st.kind !== 'card') return;
    if (dx < 0) next(); else prev();
  }, { passive: true });
}

boot();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  // after the first visit the app and the opened deck are cached, so a later offline start works
  navigator.serviceWorker.register('sw.js')
    .then(() => navigator.serviceWorker.ready)
    .then(() => navigator.serviceWorker.controller || new Promise((res) => {
      navigator.serviceWorker.addEventListener('controllerchange', res, { once: true });
      setTimeout(res, 3000);
    }))
    .then(() => deckBase && fetch(`${deckBase}deck.json`, { cache: 'no-cache' }))
    .catch(() => {});
}
