# expert-cards: working instructions for Claude Code

## What this is

A reusable, static web app for asking domain experts structured questions, one card at a time. It is mobile-first and also works on the desktop. It has no accounts, no backend of its own, and no AI at runtime. It is hosted on GitHub Pages.

- **Engine:** the generic app.
- **Deck:** a JSON file per study under `decks/<deck-id>/deck.json`.

A new study is a new deck, never a code change.

- **First deck:** `decks/e1-baybo-art27`, an expert review of 9 interpretation questions and 30 cases on the Bavarian building code (fire safety).
- **Planned second deck:** E8c, in which experts find seeded errors in interpretation statements shown as OEKS vs. LegalRuleML, with time per card.

Read `docs/PLAN.md` first. It is the agreed plan. Section 9 has the latest decisions.

## Hard rules

1. **Never commit answer keys, expected verdicts or collected answers.** `.gitignore` covers `keys/`, `answers/`, `*KEY*`. The repository is public.
2. **Content lives only in decks.** No study-specific text, case or option in the engine code.
3. **No runtime dependencies on external services** except:
   - the browser's own speech recognition (Web Speech API);
   - the optional submission adapters named in the deck.
   No CDN-loaded frameworks are required to run. Vanilla HTML, CSS and JS, no build step.
4. **Privacy:** the start screen states what is stored, where answers go, and that speech recognition runs through the device or browser provider (Apple or Google). Answers are kept in `localStorage` until submitted. Nothing is sent before the expert taps "Absenden".
5. **Accessibility:**
   - tap targets of at least 48 px;
   - high contrast, light and dark mode;
   - full keyboard use: 1/2/3 for verdicts, arrow keys for navigation, Enter to continue;
   - labels for screen readers;
   - `prefers-reduced-motion` respected.
6. Keep the app small (target < 200 KB without decks). It must work offline once loaded (a simple service worker is fine).

## Architecture (target)

```
index.html            # app shell; loads deck from ?deck=<id> (no param → English landing / catalog)
app/
  engine.js           # state machine: start → intro cards → sections → review → submit
  cards/*.js          # card renderers: info, single_choice, multi_choice, verdict, scale, free_text, ab_compare, find_error
  figures/*.js        # parametric SVG figure templates (duplex-plan, section); image figures via URL
  voice.js            # mic button: Web Speech API live transcription → text field; fallback: MediaRecorder memo
  storage.js          # localStorage autosave/resume, keyed by deck id + version + invite code
  submit/*.js         # adapters: email (mailto + backup JSON download), webhook (optional, e.g. Cloudflare Worker)
  style.css
decks/
  index.json          # list of available decks
  <deck-id>/deck.json # + optional assets/
tools/
  validate_deck.py    # schema and consistency checks before release
  import_answers.py   # parse e-mail bodies / backup JSON files → answers.csv
  agreement.py        # Cohen's/Fleiss' kappa against a key kept OUTSIDE the repo
docs/
  PLAN.md, DECK_SCHEMA.md
reference/legacy-form/fallpruefung_v3.html   # the previous one-page form; reuse its SVG sketch code and texts
```

## UX requirements (from the lead author)

- **"Duolingo-like":** one card per screen, a progress bar, large buttons, auto-advance after a clear verdict, and "Später weitermachen".
- **Start screen:** who the expert is (name, role chips) and consent. Nothing else.
- **Voice:**
  - every free-text field has a visible microphone button;
  - on the iPhone in Safari it uses the built-in (Apple) dictation via `webkitSpeechRecognition`, in Chrome Google's;
  - the text appears live and is editable;
  - if the browser has no speech recognition, the button records an audio memo (MediaRecorder), which goes into the backup file.
- **End:** an editable overview of all answers, then submit.
- **Per-expert invite code** in the URL hash (`#k=AB12`), stored with the answers.
- **Timing:** record time per card and number of changes (disclosed on the start screen).

## Submission (default)

- **E-mail adapter:** `mailto:` with a readable summary and a compact JSON block, plus a "Sicherungsdatei herunterladen" button (JSON, plus audio memos if any). The recipient comes from the deck (`submission.to`; currently `PLEASE_SET`, to be set by the lead author).
- **Webhook adapter:** optional, behind a deck setting. Do not build a backend in this repo for now.

## Deck schema

`decks/e1-baybo-art27/deck.json` is a **draft** that was extracted automatically from the legacy form. Formalise its schema in `docs/DECK_SCHEMA.md` and adjust the deck where needed. Some fields contain small HTML (`changes_html` with `<mark>`): either allow a safe subset (`mark`, `b`, `i`) or convert it to a light markup. Never render untrusted HTML beyond that subset.

## Definition of done for the first release (`v0.1`)

- [ ] E1 deck renders completely on iPhone Safari, Android Chrome and desktop Chrome, Firefox and Safari.
- [ ] Autosave and resume work; the invite code is carried through.
- [ ] Voice: live dictation works in Safari and Chrome; the audio-memo fallback works in Firefox.
- [ ] E-mail submission and backup file work; `tools/import_answers.py` reads both into one CSV.
- [ ] `tools/validate_deck.py` passes for the E1 deck.
- [ ] GitHub Pages deployment works from `main` (root); the README explains "new study in 5 steps".
- [ ] No key, no expected verdict and no answers in the repository.

## Pending input from the lead author

- **Content corrections from a domain expert:** the lead author has them and will paste them into the session. Apply them to the deck only.
- **Submission e-mail address:** for `submission.to`.
