// Engine: state machine start → intro cards → sections → review → submit.
// Knows nothing about any particular study; everything comes from the deck.
import { h, rich, modal } from './ui.js';
import { T, setLang, langMeta } from './i18n.js';
import { makeStore } from './storage.js';
import { cards } from './cards/index.js';
import { adapters } from './submit/index.js';
import { pictogram } from './icons.js';
import { applySkin, skinToggle } from './skin.js';

const app = document.getElementById('app');
let deck, deckBase, steps, lessons, state, store;
let catalog = []; // all decks from decks/index.json (landing catalog)
let editing = false;
let wiping = false; // true while clearing answers — blocks pagehide from re-saving
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
    const id = new URLSearchParams(location.search).get('deck');
    let index = null;
    try { index = await getJson('decks/index.json'); } catch { /* picker is optional */ }
    catalog = (index && Array.isArray(index.decks)) ? index.decks : [];

    // No deck in the URL → English landing page to pick a survey (language then follows the deck).
    if (!id || !/^[\w-]+$/.test(id)) {
      if (!catalog.length) throw new Error('decks/index.json');
      setLang('en');
      document.documentElement.lang = 'en';
      document.title = T.appName;
      applySkin();
      renderLanding();
      return;
    }

    deckBase = `decks/${id}/`;
    deck = await getJson(`${deckBase}deck.json`);
  } catch (e) {
    setLang('en');
    app.replaceChildren(h('main', { class: 'screen' }, h('h1', {}, T.appName), h('p', { class: 'warn' }, T.loadFail), h('p', { class: 'hint' }, String(e.message || e))));
    return;
  }
  const uiLang = setLang(deck.language);
  document.documentElement.lang = uiLang;
  document.title = deck.title;

  const code = (new URLSearchParams(location.hash.slice(1)).get('k') || '').replace(/[^\w-]/g, '').slice(0, 32);
  store = makeStore(deck.id, deck.version, code);
  await store.audio.loadAll();
  steps = buildSteps();
  state = store.load() || { v: 1, deck: { id: deck.id, version: deck.version }, code, person: {}, consent: null, answers: {}, timing: {}, changes: {}, pos: 0, startedAt: null, updatedAt: null, submittedAt: null };
  // Always open on the start screen (name, role, consent). Saved progress shows as “resume” there — same for every deck.
  state.pos = 0;

  window.addEventListener('hashchange', () => location.reload()); // another invite code = another saved state
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { lap(); t0 = 0; } else if (steps[state.pos] && steps[state.pos].kind === 'card') t0 = Date.now();
  });
  window.addEventListener('pagehide', () => {
    if (wiping) return; // restart must not write the old answers back
    lap(); store.flush(state);
  });
  applySkin();
  render();
}

function renderLanding() {
  clearChrome();
  app.replaceChildren();
  const main = h('main', { class: 'screen start landing', id: 'main' },
    h('p', { class: 'eyebrow' }, T.appName),
    h('h1', { tabindex: '-1' }, T.landingTitle),
    h('p', { class: 'lead' }, T.landingLead),
    h('p', { class: 'hint' }, T.landingHint),
    deckCatalog({ landing: true }),
    h('div', { class: 'start-tools' }, skinToggle(() => { applySkin(); renderLanding(); })));
  app.append(main);
  mountFeedbackFab(false);
  main.querySelector('h1').focus({ preventScroll: true });
}

/** Leave the current deck and return to the English survey picker. */
function goLanding() {
  if (store && state) { try { lap(); store.flush(state); } catch { /* ignore */ } }
  const u = new URL(location.href);
  u.searchParams.delete('deck');
  location.assign(u.toString());
}

function restartFresh() {
  if (!confirm(T.restartConfirm)) return;
  wiping = true;
  store.clear();
  location.reload();
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
    const themes = sec.part_titles || [];
    for (let j = 0; j < k; j++) {
      const chunk = sec.cards.slice(j * per, (j + 1) * per);
      const askable = chunk.filter((c) => c.type !== 'info');
      const byId = [...askable].sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
      const first = byId[0] || chunk[0];
      const last = byId[byId.length - 1] || chunk[chunk.length - 1];
      lessons.push({
        sec: sec.id,
        title: sec.title,
        icon: sec.icon || 'cards',
        theme: themes[j] || null,
        range: first && last ? (first.id === last.id ? first.id : `${first.id}–${last.id}`) : null,
        part: k > 1 ? [j + 1, k] : null,
        steps: chunk.map((c, i) => ({ kind: 'card', card: c, section: sec, idx: j * per + i, n: sec.cards.length }))
      });
    }
  }
  if (deck.closing) {
    const title = deck.closing.title || T.closingTitle;
    lessons.push({
      sec: '_closing', title, icon: deck.closing.icon || 'note', theme: null, range: null, part: null,
      steps: [{ kind: 'card', card: { id: 'closing', type: 'free_text', prompt: deck.closing.free_text_label, label: deck.closing.free_text_label }, section: { title, cards: [] } }]
    });
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
const lessonTheme = (l) => l.theme || (l.part ? T.lessonPartShort(l.part[0], l.part[1]) : l.title);
const lessonName = (l) => (l.theme ? `${l.title}: ${l.theme}` : (l.part ? T.lessonPart(l.part[0], l.part[1], l.title) : l.title));
const toneOf = (icon) => ({ plan: 'plan', compass: 'plan', wall: 'wall', column: 'column', note: 'note', send: 'send' }[icon] || 'cards');
function setTone(icon) {
  app.dataset.tone = toneOf(icon || 'cards');
}
function clearTone() { delete app.dataset.tone; }

// where a lesson is entered: first open question if it was started, else its first card
function lessonEntry(i) {
  const l = lessons[i];
  const c = countable(l);
  const open = c.find((s) => !cardAnswered(s));
  return steps.indexOf(open && c.some(cardAnswered) ? open : l.steps[0]);
}

function sectionLessons(secId) {
  return lessons.map((l, i) => ({ l, i })).filter((x) => x.l.sec === secId);
}
function sectionComplete(secId) {
  return sectionLessons(secId).every(({ l }) => lessonStats(l).done);
}
function isLastOfSection(i) {
  const next = lessons[i + 1];
  return !next || next.sec !== lessons[i].sec;
}
// Remaining minutes for the home screen.
// Prefer the deck's planned duration scaled by open cards; only blend in personal
// pace after several real dwell times (skips / 1-second glances must not shrink ETA to nonsense).
function etaMinutes() {
  const [ans, total] = overall();
  if (!total || ans >= total) return null;
  const left = total - ans;
  const planned = deck.estimated_minutes && Number(deck.estimated_minutes.total);
  const fromDeck = planned > 0 ? Math.max(1, Math.round(planned * (left / total))) : null;

  const times = [];
  for (const st of cardSteps()) {
    if (!st.card || st.card.type === 'info') continue;
    if (!cardAnswered(st)) continue;
    const t = state.timing[st.card.id];
    // 8 s … 8 min: ignore skips and abandoned tabs
    if (t >= 8000 && t <= 8 * 60 * 1000) times.push(t);
  }
  if (times.length < 3 || !fromDeck) return fromDeck;

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  let personal = Math.round((left * avg) / 60000);
  // keep personal estimate in a believable band around the deck plan
  personal = Math.max(Math.round(fromDeck * 0.5), Math.min(Math.round(fromDeck * 2.2), Math.max(1, personal)));
  const w = Math.min(0.7, (times.length - 2) / 10); // more weight to own pace only gradually
  return Math.max(1, Math.round(w * personal + (1 - w) * fromDeck));
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

// Fixed chrome lives on document.body (not #app) so Firefox/macOS keeps bottom:0 on the viewport.
function clearChrome() {
  document.querySelectorAll('nav.bottomnav, .fab-feedback').forEach((el) => el.remove());
  navEl = null;
}

function render() {
  if (!deck || !steps) return renderLanding();
  const st = steps[state.pos];
  clearChrome();
  app.replaceChildren();
  clearTone();
  if (st.kind === 'start') {
    renderStart();
    mountFeedbackFab(false);
    return;
  }
  const bare = st.kind === 'home' || st.kind === 'lessondone';
  primary = null;
  if (st.kind === 'card' && lessons[st.lesson]) setTone(lessons[st.lesson].icon);
  else if (st.kind === 'lessondone' && lessons[st.lesson]) setTone(lessons[st.lesson].icon);
  if (!bare) app.append(topbar(st));
  const main = h('main', { class: `screen ${st.kind}`, id: 'main' });
  app.append(main);
  if (st.kind === 'card') renderCard(main, st);
  else if (st.kind === 'review') renderReview(main);
  else if (st.kind === 'home') renderHome(main);
  else if (st.kind === 'lessondone') renderLessonDone(main, st);
  else renderSubmit(main);
  if (!bare && (st.kind !== 'submit' || !state.submittedAt)) {
    navEl = nav(st);
    document.body.append(navEl);
  }
  mountFeedbackFab(!!navEl);
  attachSwipe(main);
  if (!store.ok) main.prepend(h('p', { class: 'warn' }, T.saveFail));
  const hd = main.querySelector('h1');
  if (hd) hd.focus({ preventScroll: true });
  t0 = Date.now();
}

// Segmented progress inside a round: tap a step to jump (answered or still open).
function stepNav(lesson, current) {
  const curIdx = lesson.steps.indexOf(current);
  const ask = countable(lesson);
  return h('div', { class: 'stepnav', role: 'navigation', 'aria-label': T.stepNav },
    lesson.steps.map((st, i) => {
      const info = st.card.type === 'info';
      const done = info || cardAnswered(st);
      const on = i === curIdx;
      const qi = ask.indexOf(st);
      const label = info ? 'i' : (qi >= 0 ? qLabel(st, qi) : String(i + 1));
      const state = on ? T.stepNow : info ? T.stepInfo : done ? T.stepDone : T.stepOpen;
      return h('button', {
        type: 'button',
        class: `step ${on ? 'on' : ''} ${done ? 'done' : 'open'}${info ? ' info' : ''}`,
        'aria-current': on ? 'step' : null,
        'aria-label': T.stepGo(label, state),
        disabled: on || null,
        onclick: () => go(steps.indexOf(st), editing ? { editing: true } : {})
      }, h('span', { class: 'step-fill', 'aria-hidden': 'true' }), label);
    }));
}

function topbar(st) {
  let label, pct, theme = null, icon = null, track = null;
  if (st.kind === 'card') {
    const l = lessons[st.lesson];
    const p = l.steps.indexOf(st) + 1;
    label = T.topLabel(st.lesson + 1, p, l.steps.length);
    theme = lessonTheme(l);
    icon = l.icon;
    pct = Math.round((p / l.steps.length) * 100);
    track = stepNav(l, st);
  } else {
    label = st.kind === 'review' ? T.review : T.submitTitle;
    pct = 100;
    track = h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '100', 'aria-label': label },
      h('div', { class: 'bar-fill', style: 'width:100%' }));
  }
  return h('header', { class: 'topbar' },
    h('div', { class: 'topbar-row' },
      h('button', {
        type: 'button', class: 'homebtn', onclick: goHome,
        'aria-label': T.laterAria, title: T.laterAria
      }, h('span', { class: 'homebtn-arrow', 'aria-hidden': 'true' }, '←'), T.later),
      h('div', { class: 'topbar-meta' },
        theme ? h('span', { class: 'topbar-theme' }, icon ? pictogram(icon) : null, theme) : null,
        h('span', { class: 'topbar-label' }, label))),
    track);
}

// Back to the lesson overview (everything is already saved).
function goHome() {
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
  const [ansN, ansTotal, doneL, totalL] = overall();
  // Only offer resume when real answers exist — empty “0 of N” would confuse.
  const hasProgress = ansN > 0;
  const consent = h('input', { type: 'checkbox', id: 'consent' });
  consent.checked = !!state.consent;
  const begin = () => {
    if (!consent.checked) return;
    if (!state.startedAt) state.startedAt = now();
    go(homeIdx());
  };
  const continueBtn = h('button', {
    type: 'button', class: 'btn primary big', disabled: !consent.checked, onclick: begin
  }, hasProgress ? T.resumeContinue : T.start);
  consent.addEventListener('change', () => {
    state.consent = consent.checked ? { given: true, at: now() } : null;
    continueBtn.disabled = !consent.checked;
    persist();
  });
  const sub = deck.submission || {};
  const to = sub.to && sub.to !== 'PLEASE_SET' ? sub.to : '';
  const est = deck.estimated_minutes;
  const privacy = h('details', { class: 'privacy' },
    h('summary', {}, T.privacyMore),
    h('p', { class: 'label' }, T.privacyTitle),
    h('ul', {}, T.privacy(to).map((t) => h('li', {}, t))));

  const resumePanel = hasProgress
    ? h('aside', { class: 'resume', role: 'status', 'aria-live': 'polite' },
      h('p', { class: 'resume-kicker' }, T.resumeTitle),
      h('p', { class: 'resume-stat' }, T.resumeInfo(ansN, ansTotal, doneL, totalL)),
      h('div', { class: 'resume-actions' },
        h('div', { class: 'resume-choice' },
          continueBtn,
          h('p', { class: 'hint' }, T.resumeContinueHint)),
        h('div', { class: 'resume-choice' },
          h('button', { type: 'button', class: 'btn big', onclick: restartFresh }, T.restart),
          h('p', { class: 'hint' }, T.restartFreshHint))),
      h('p', { class: 'hint resume-note' }, T.restartHint))
    : continueBtn;

  const lang = langMeta(deck.language, deck.id);
  const main = h('main', { class: 'screen start', id: 'main' },
    h('div', { class: 'start-head' },
      h('p', { class: 'eyebrow' }, deck.owner ? `${deck.owner.name}, ${deck.owner.institution}` : T.appName),
      h('span', { class: 'lang-pill', title: `${T.langLabel}: ${lang.name}` },
        h('span', { class: 'lang-flag', 'aria-hidden': 'true' }, lang.flag),
        h('span', {}, lang.label))),
    h('h1', { tabindex: '-1' }, deck.title),
    deck.subtitle ? h('p', { class: 'lead' }, deck.subtitle) : null,
    h('p', { class: 'landing-back' },
      h('button', { type: 'button', class: 'linkish', onclick: goLanding }, `← ${T.landingBack}`)),
    hasProgress
      ? h('p', { class: 'resume-banner', role: 'status' },
        h('span', { class: 'resume-dot', 'aria-hidden': 'true' }, '●'),
        T.resumeTitle,
        h('span', { class: 'resume-banner-stat' }, T.resumeInfo(ansN, ansTotal, doneL, totalL)))
      : null,
    est ? h('p', {}, T.minutes(est.part1, est.total)) : null,
    state.code ? h('p', { class: 'hint' }, `${T.invite}: `, h('b', {}, state.code)) : null,
    ...identityFields('start'),
    privacy,
    deck.consent_text ? h('p', { class: 'consent-text' }, deck.consent_text) : null,
    h('label', { class: 'check', for: 'consent' }, consent, h('span', {}, T.consentLabel)),
    resumePanel,
    installTip(),
    h('div', { class: 'start-tools' }, skinToggle(() => render())),
    legalLinks());
  app.append(main);
  main.querySelector('h1').focus({ preventScroll: true });
}

function goDeck(id) {
  if (!id || (deck && id === deck.id)) return;
  const u = new URL(location.href);
  u.searchParams.set('deck', id); // keeps the invite code in the hash
  location.assign(u.toString());
}

// Catalog on the English landing page — pick a survey, then the deck start is identity + consent only.
function deckCatalog(opts = {}) {
  if (!catalog.length) return null;
  const currentId = deck && deck.id;
  const myGroup = (catalog.find((d) => d.id === currentId) || {}).group || null;
  const filter = catalog.length >= 5
    ? h('input', {
      type: 'search', class: 'deck-filter',
      placeholder: T.deckFilter, 'aria-label': T.deckFilter, autocomplete: 'off'
    })
    : null;
  const list = h('div', { class: 'deck-list', role: 'list' });
  const empty = h('p', { class: 'hint deck-empty', hidden: true }, T.deckFilterEmpty);
  const paint = () => {
    const q = ((filter && filter.value) || '').trim().toLowerCase();
    const groups = new Map();
    for (const d of catalog) {
      const hay = [d.title, d.label, d.hint, d.id, d.group, d.language].filter(Boolean).join(' ').toLowerCase();
      if (q && !hay.includes(q)) continue;
      const key = d.group || '_other';
      (groups.get(key) || groups.set(key, []).get(key)).push(d);
    }
    const keys = [...groups.keys()].sort((a, b) => {
      if (myGroup && a === myGroup) return -1;
      if (myGroup && b === myGroup) return 1;
      if (a === '_other') return 1;
      if (b === '_other') return -1;
      return a.localeCompare(b, 'en');
    });
    list.replaceChildren();
    empty.hidden = keys.length > 0;
    for (const key of keys) {
      const items = groups.get(key);
      const heading = key === '_other'
        ? T.deckGroupOther
        : (items.find((d) => d.group_title) || {}).group_title || (key === 'e1' ? T.deckGroupE1 : key);
      put(list, h('p', { class: 'deck-group-label' }, heading));
      for (const d of items) {
        const on = d.id === currentId;
        const lm = langMeta(d.language, d.id);
        list.append(h('button', {
          type: 'button',
          class: `deck-row${on ? ' current' : ''}`,
          role: 'listitem',
          'aria-current': on ? 'true' : null,
          onclick: () => goDeck(d.id)
        },
          h('span', { class: 'deck-row-flag', 'aria-hidden': 'true' }, lm.flag),
          h('span', { class: 'deck-row-main' },
            h('span', { class: 'deck-row-title' }, d.label || d.title),
            d.hint ? h('span', { class: 'deck-row-hint' }, d.hint) : null),
          h('span', { class: 'deck-row-meta' },
            h('span', { class: 'deck-badge lang', title: lm.name }, lm.label),
            d.status && d.status !== 'ready' ? h('span', { class: 'deck-badge draft' }, T.deckDraft) : null,
            on ? h('span', { class: 'deck-badge on' }, '✓') : null)));
      }
    }
  };
  paint();
  if (filter) filter.addEventListener('input', paint);
  return h('div', { class: 'field deck-catalog' },
    filter, list, empty,
    h('p', { class: 'hint' }, T.deckCatalogHint));
}

function isStandaloneApp() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

// Short, platform-aware tip: experts can pin the study like an app (no App Store).
function installTip() {
  if (isStandaloneApp()) return null;
  const ua = navigator.userAgent || '';
  const ios = /iPad|iPhone|iPod/i.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const steps = ios ? T.installIosSteps : android ? T.installAndroidSteps : T.installOtherSteps;
  const tip = h('details', { class: 'install-tip' },
    h('summary', {},
      h('span', { class: 'install-ico', 'aria-hidden': 'true' }, pictogram('home')),
      h('span', { class: 'install-sum' }, T.installTitle),
      h('span', { class: 'install-chev', 'aria-hidden': 'true' }, '›')),
    h('p', { class: 'hint install-lead' }, T.installLead),
    h('ol', { class: 'install-steps' }, steps.map((t) => h('li', {}, t))));
  // Invite mails can use ?install=1 so the tip opens immediately.
  if (new URLSearchParams(location.search).get('install') === '1') tip.open = true;
  // Chrome/Android: one-tap install when the browser offers it
  if (android || !ios) {
    const btn = h('button', { type: 'button', class: 'btn small install-btn', hidden: true }, T.installBtn);
    tip.append(btn);
    const onPrompt = (e) => {
      e.preventDefault();
      btn.hidden = false;
      tip.open = true;
      btn.onclick = async () => {
        try {
          await e.prompt();
          await e.userChoice;
        } catch { /* ignore */ }
        btn.hidden = true;
      };
      window.removeEventListener('beforeinstallprompt', onPrompt);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
  }
  return tip;
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

// Short label for a question chip on the home overview (card id if short, else running number).
function qLabel(st, i) {
  const id = st.card.id;
  if (id && id.length <= 4 && !/^intro|_/.test(id)) return id;
  return String(i + 1);
}

function qTrack(lessonIdx) {
  const cards = countable(lessons[lessonIdx]);
  if (!cards.length) return null;
  const nextOpen = cards.find((st) => !cardAnswered(st));
  return h('div', { class: 'qtrack', role: 'group', 'aria-label': T.qTrackLabel(lessonIdx + 1) },
    cards.map((st, i) => {
      const done = cardAnswered(st);
      const next = st === nextOpen;
      const label = qLabel(st, i);
      return h('button', {
        type: 'button',
        class: `qchip ${done ? 'done' : 'open'}${next ? ' next' : ''}`,
        'aria-label': (done ? T.qDone : T.qOpen)(label),
        onclick: () => go(steps.indexOf(st))
      },
        done ? h('span', { class: 'qmark', 'aria-hidden': 'true' }, '✓') : null,
        label);
    }));
}

function renderHome(main) {
  const stats = lessons.map(lessonStats);
  const [ans, total] = overall();
  const cur = stats.findIndex((x) => !x.done);
  const pct = total ? Math.round((ans / total) * 100) : 0;
  const eta = etaMinutes();
  const act = () => (cur < 0 ? go(stepIndex('review')) : go(lessonEntry(cur)));
  primary = act;
  put(main,
    h('div', { class: 'home-top' },
      h('p', { class: 'eyebrow' }, deck.title),
      h('div', { class: 'home-tools' },
        skinToggle(() => render()),
        h('button', {
          type: 'button', class: 'iconbtn aboutbtn',
          onclick: () => go(0),
          'aria-label': T.homeAbout, title: T.homeAbout
        }, pictogram('person')))),
    h('h1', { tabindex: '-1' }, T.homeTitle),
    h('p', { class: 'lead' }, T.homeProgress(ans, total)),
    eta ? h('p', { class: 'hint eta', title: T.homeEtaDetail }, T.homeEta(eta)) : null,
    h('div', { class: 'bar thick', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': T.homeProgress(ans, total) },
      h('div', { class: 'bar-fill', style: `width:${pct}%` })),
    h('button', { type: 'button', class: 'btn primary big', onclick: act },
      cur < 0 ? T.homeToReview : (ans ? T.homeContinue : T.homeStart)(lessonName(lessons[Math.max(cur, 0)]))),
    h('p', { class: 'hint saved' }, T.homeSaved));

  let group = null, section = null, secAns = 0, secTotal = 0, secIcon = 'cards';
  const flushSec = () => {
    if (!section) return;
    const head = section.querySelector('.sec-head');
    if (head) {
      const sealed = secTotal > 0 && secAns === secTotal;
      if (sealed) {
        section.classList.add('sealed');
        head.append(h('span', { class: 'sec-seal', title: T.secSeal }, '✓ ', T.secSeal));
      } else {
        head.append(h('span', { class: 'sec-progress' }, T.homeSecProgress(secAns, secTotal)));
      }
    }
    main.append(section);
  };
  lessons.forEach((l, i) => {
    if (l.sec !== group) {
      flushSec();
      group = l.sec;
      secAns = 0; secTotal = 0;
      secIcon = l.icon || 'cards';
      section = h('section', { class: `sec-block tone-${toneOf(secIcon)}` },
        h('div', { class: 'sec-head' },
          h('h2', {}, pictogram(secIcon), h('span', {}, l.title))),
        h('ul', { class: 'lessons path' }));
    }
    const s = stats[i];
    secAns += s.answered; secTotal += s.total;
    const state_ = s.done ? 'done' : i === cur ? 'current' : s.answered ? 'started' : '';
    const theme = lessonTheme(l);
    const lpct = s.total ? Math.round((s.answered / s.total) * 100) : 0;
    const metaBits = [
      s.done ? T.lessonMetaDone(s.total) : s.answered ? T.lessonMetaPart(s.answered, s.total) : T.lessonMetaNew(s.total),
      l.range || null
    ].filter(Boolean);
    const ul = section.querySelector('.lessons');
    ul.append(h('li', { class: `lesson-card ${state_}` },
      h('button', { type: 'button', class: 'lesson-go', onclick: () => go(lessonEntry(i)), 'aria-label': `${T.lessonN(i + 1)}: ${theme}. ${T.lessonOpenGo}` },
        h('span', { class: 'badge', 'aria-hidden': 'true' }, s.done ? '✓' : pictogram(l.icon || 'cards')),
        h('span', { class: 'lesson-main' },
          h('span', { class: 'lesson-kicker' }, T.lessonN(i + 1), l.part ? ` · ${T.lessonPartShort(l.part[0], l.part[1])}` : ''),
          h('span', { class: 'lesson-title' }, theme),
          h('span', { class: 'lesson-meta' }, metaBits.join(' · '))),
        h('span', { class: 'lesson-bar', 'aria-hidden': 'true' },
          h('span', { class: 'lesson-bar-fill', style: `width:${lpct}%` }))),
      qTrack(i)));
  });
  flushSec();

  const open = total - ans;
  put(main, h('section', { class: `sec-block tone-send${cur < 0 ? ' sealed' : ''}` },
    h('div', { class: 'sec-head' }, h('h2', {}, pictogram('send'), h('span', {}, T.homeEndTitle)),
      cur < 0 ? h('span', { class: 'sec-seal' }, '✓ ', T.secSeal) : null),
    h('ul', { class: 'lessons' }, h('li', { class: `lesson-card ${cur < 0 ? 'current' : ''}` },
      h('button', { type: 'button', class: 'lesson-go', onclick: () => go(stepIndex('review')) },
        h('span', { class: 'badge', 'aria-hidden': 'true' }, pictogram('send')),
        h('span', { class: 'lesson-main' },
          h('span', { class: 'lesson-title' }, T.homeReviewTile),
          h('span', { class: 'lesson-meta' }, T.openCount(open))))))),
    legalLinks());
}

function renderLessonDone(main, st) {
  const i = st.lesson, l = lessons[i], s = lessonStats(l);
  const last = i === lessons.length - 1;
  const [ans, total, doneN, n] = overall();
  const allDone = ans === total && total > 0;
  const secEnd = isLastOfSection(i) && s.done && sectionComplete(l.sec);
  const firstOpen = countable(l).find((x) => !cardAnswered(x));
  const min = Math.max(1, Math.round(l.steps.reduce((a, x) => a + (state.timing[x.card.id] || 0), 0) / 60000));
  const act = allDone || last
    ? () => go(stepIndex('review'))
    : () => go(lessonEntry(i + 1));
  primary = act;

  // Milestone: whole section finished, or everything finished
  if (s.done && (allDone || secEnd)) {
    const nextSec = lessons[i + 1];
    put(main,
      h('div', { class: 'celebrate', 'aria-hidden': 'true' }, '✓'),
      h('h1', { tabindex: '-1' }, allDone ? T.allDoneTitle : T.sectionDoneTitle),
      h('p', { class: 'lead' }, allDone ? T.allDoneLead(total) : T.sectionDoneLead(l.title)),
      h('p', { class: 'hint' }, allDone ? T.allDoneHint : T.sectionDoneHint),
      h('div', { class: 'bar thick', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(total ? Math.round((ans / total) * 100) : 0) },
        h('div', { class: 'bar-fill', style: `width:${total ? Math.round((ans / total) * 100) : 0}%` })),
      h('p', { class: 'hint' }, T.lessonsDone(doneN, n)),
      h('div', { class: 'done-actions' },
        h('button', { type: 'button', class: 'btn primary big', onclick: act },
          allDone ? T.allDoneGo : (nextSec ? T.sectionNext(lessonName(nextSec)) : T.homeToReview)),
        h('button', { type: 'button', class: 'btn big', onclick: () => go(homeIdx()) }, T.lessonPause)),
      h('button', { type: 'button', class: 'linkbtn', onclick: () => go(state.pos - 1) }, T.back));
    return;
  }

  put(main,
    h('div', { class: `celebrate ${s.done ? '' : 'part'}`, 'aria-hidden': 'true' },
      s.done ? '✓' : pictogram(l.icon || 'cards')),
    h('h1', { tabindex: '-1' }, s.done ? T.lessonDoneTitle(i + 1) : T.lessonEndTitle(i + 1)),
    h('p', { class: 'lead' }, lessonTheme(l)),
    h('p', { class: 'hint' }, T.lessonStats(s.answered, s.total, min)),
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
    open === 0 ? h('div', { class: 'done-banner', role: 'status' },
      h('div', { class: 'celebrate small', 'aria-hidden': 'true' }, '✓'),
      h('p', { class: 'lead' }, T.allDoneTitle),
      h('p', { class: 'hint' }, T.reviewDoneBanner)) : null,
    h('h1', { tabindex: '-1' }, T.review),
    h('p', { class: 'lead' }, T.reviewIntro),
    h('p', { class: open ? 'warn' : 'ok', role: 'status' }, T.openCount(open)),
    ...sections,
    extra.length ? h('section', {}, h('h2', {}, T.moreAboutYou), ...extra) : null,
    feedbackBox());
}

function feedbackEnabled() {
  if (!deck || !state) return false; // landing / boot — no deck yet
  return !(deck.settings && deck.settings.app_feedback === false);
}

function feedbackContext() {
  const st = steps[state.pos];
  if (!st) return { kind: 'unknown' };
  if (st.kind === 'card') return { kind: 'card', card: st.card.id, lesson: st.lesson + 1 };
  return { kind: st.kind };
}

function toast(msg) {
  document.querySelectorAll('.toast').forEach((el) => el.remove());
  const el = h('div', { class: 'toast', role: 'status' }, msg);
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 280); }, 2200);
}

function saveFeedback({ tag, text, rating }) {
  const note = (text || '').trim();
  if (!tag && !note && !rating) return false;
  const a = state.answers._feedback || (state.answers._feedback = {});
  if (rating) a.v = rating;
  const entry = { at: now(), ...feedbackContext(), tag: tag || null, text: note || null };
  a.log = Array.isArray(a.log) ? a.log : [];
  a.log.push(entry);
  const line = [tag && (T.fbTags.find((x) => x[0] === tag) || [])[1], note].filter(Boolean).join(': ');
  if (line) a.note = a.note ? `${a.note}\n• ${line}` : `• ${line}`;
  persist();
  store.flush(state);
  return true;
}

function openFeedback() {
  if (!feedbackEnabled()) return;
  document.querySelector('dialog.fb-sheet')?.remove();
  let tag = null;
  let rating = answerOf('_feedback').v || null;
  const ta = h('textarea', {
    class: 'fb-text', rows: 3, placeholder: T.fbPlaceholder,
    maxlength: '500', autocomplete: 'off', enterkeyhint: 'done'
  });
  const tagBtns = T.fbTags.map(([id, label]) => h('button', {
    type: 'button', class: 'chipbtn', role: 'radio',
    onclick: () => { tag = tag === id ? null : id; paint(); }
  }, label));
  const rateBtns = T.fbOptions.map(([id, label]) => h('button', {
    type: 'button', class: 'chipbtn', role: 'radio',
    onclick: () => { rating = rating === id ? null : id; paint(); }
  }, label));
  const paint = () => {
    tagBtns.forEach((b, i) => {
      const on = tag === T.fbTags[i][0];
      b.classList.toggle('sel', on);
      b.setAttribute('aria-checked', String(on));
    });
    rateBtns.forEach((b, i) => {
      const on = rating === T.fbOptions[i][0];
      b.classList.toggle('sel', on);
      b.setAttribute('aria-checked', String(on));
    });
  };
  paint();
  const close = () => { try { dlg.close(); } catch { /* ignore */ } dlg.remove(); };
  const save = () => {
    if (!saveFeedback({ tag, text: ta.value, rating })) { close(); return; }
    close();
    toast(T.fbSaved);
    // refresh fab state if still on same screen
    const fab = document.querySelector('.fab-feedback');
    if (fab) fab.classList.add('has');
  };
  const dlg = h('dialog', { class: 'fb-sheet', 'aria-label': T.fbTitle });
  dlg.append(
    h('div', { class: 'fb-sheet-inner' },
      h('div', { class: 'fb-grab', 'aria-hidden': 'true' }),
      h('h2', {}, T.fbTitle),
      h('p', { class: 'hint' }, T.fbIntro),
      h('p', { class: 'label' }, T.fbTagLabel),
      h('div', { class: 'chipset', role: 'radiogroup', 'aria-label': T.fbTagLabel }, tagBtns),
      h('p', { class: 'label' }, T.fbRating),
      h('div', { class: 'chipset', role: 'radiogroup', 'aria-label': T.fbRating }, rateBtns),
      h('label', { class: 'label', for: 'fb-note' }, T.fbLabel),
      Object.assign(ta, { id: 'fb-note' }),
      h('div', { class: 'fb-actions' },
        h('button', { type: 'button', class: 'btn', onclick: close }, T.fbCancel),
        h('button', { type: 'button', class: 'btn primary', onclick: save }, T.fbSave))));
  dlg.addEventListener('cancel', close);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  document.body.append(dlg);
  if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  setTimeout(() => ta.focus(), 50);
}

function mountFeedbackFab(aboveNav) {
  if (!feedbackEnabled()) return;
  const fb = answerOf('_feedback');
  const has = !!(fb.note || (fb.log && fb.log.length));
  document.body.append(h('button', {
    type: 'button',
    class: `fab-feedback${has ? ' has' : ''}${aboveNav ? ' above-nav' : ''}`,
    'aria-label': T.fbFab,
    title: T.fbFab,
    onclick: openFeedback
  }, pictogram('chat'), h('span', { class: 'fab-label', 'aria-hidden': 'true' }, T.fbFabShort)));
}

// Light hint on the review screen; the FAB is the main entry.
function feedbackBox() {
  if (!feedbackEnabled()) return null;
  return h('p', { class: 'hint feedback-hint' },
    T.fbReviewHint, ' ',
    h('button', { type: 'button', class: 'linkbtn', onclick: openFeedback }, T.fbFab));
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
    if (st.card.type !== 'free_text' && a.note) parts.push(`${T.reportNote}: ${a.note}`);
    if (a.reason) parts.push(`${T.reportReason}: ${a.reason}`);
    if (store.audio.has(st.card.id)) parts.push(T.reportVoice);
    lines.push(`${st.card.id}: ${parts.join(' | ')}`);
  }
  const fb = answerOf('_feedback');
  if (fb.v || fb.note || (fb.log && fb.log.length)) {
    lines.push('', `## ${T.reportFeedbackTitle}`);
    if (fb.v) lines.push(`${T.reportOverall}: ${fb.v}`);
    if (fb.note) lines.push(fb.note);
    else if (fb.log) for (const e of fb.log) {
      const bits = [e.kind === 'card' ? e.card : e.kind, e.tag, e.text].filter(Boolean);
      if (bits.length) lines.push(`• ${bits.join(' · ')}`);
    }
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
