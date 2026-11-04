# Plan: reusable expert-review pipeline as a mobile card app (first use: E1, then E8c)

As of 4 Nov 2026. Goal: experts give their judgement in 10–20 minutes, on a phone or a desktop, without an account, installation or our own server infrastructure.

## 1. Principles

- **One card, one decision.** Each case is one screen, answered with one tap. Details are optional.
- **No account.** Name, role and consent on the start screen, nothing else.
- **No server of our own.** Static website on GitHub Pages. Answers are stored in the browser and sent at the end.
- **Interruptible.** Progress is saved automatically on the device; the expert can continue later.
- **No AI tokens at runtime.** Speech input uses the device's own dictation, not an LLM.

## 2. Flow

1. **Start (one screen):** two sentences on what this is about; time needed (about 15 minutes for part 1, 20 more for the cases); name, role (chips) and consent checkbox. Button "Los geht's".
2. **The building (3 small cards, swipeable):** sketch of the duplex, base data, and "what is not mentioned stays as it is".
3. **Part 1, principle questions (9 cards):** a short question, 2–4 large option chips, an optional "Warum?" field.
4. **Part 2 and 3, cases (30 cards):** sketch with the changed element marked, 1–3 bullet points, three large buttons ("Erfüllt", "Nicht erfüllt", "Hängt ab"):
   - After "Erfüllt" or "Nicht erfüllt", the app advances automatically, with a short "Sicher?" chip row (sure, rather sure, unsure) that can be skipped.
   - After "Hängt ab", a reason field opens, with a microphone hint.
   - Cases that depend on a principle question show the hint "hängt mit Frage 4 zusammen", and the expert's own answer to it is displayed.
5. **Progress:** a bar at the top, section dots, and "Später weitermachen" (everything stays saved).
6. **End:** an overview of all answers as a list, each editable by tapping; then "Absenden".

Gestures: swipe or arrow keys for back and forward; the keyboard shortcuts 1/2/3 for the verdict on desktop.

## 3. Speech instead of typing

Three levels, ordered from simplest to most robust:

| Option | How | Cost / risk | Recommendation |
|---|---|---|---|
| **A: dictation on the device keyboard** | Every text field accepts the iOS/Android dictation microphone; we only show a hint ("Tippen Sie aufs Mikrofon Ihrer Tastatur") | Nothing to build, works everywhere, the text arrives directly | **Standard** |
| B: speech recognition in the browser (Web Speech API) | Our own microphone button, live transcription | Chrome/Edge/Safari only, not Firefox; in Chrome the audio goes to Google servers (data protection) | Optional, only with a notice |
| C: record a voice memo, transcribe later | MediaRecorder stores audio; we transcribe it later with Whisper on the 5090 | Best quality, no cloud; but audio files make the upload larger | Optional for long explanations |

Proposal: A as default, C as an additional "Sprachnotiz aufnehmen" button for "Hängt ab" cases. B only if experts want it.

## 4. Sending answers without our own server

| Option | Expert effort | Infrastructure | Data protection | Assessment |
|---|---|---|---|---|
| **1: e-mail with prefilled text** (mailto) plus a backup file to download | One tap on "Per E-Mail senden", then send | None | Fine (regular e-mail to HM) | **Robust, recommended as baseline** |
| 2: form service (Formspree, Getform, Basin) | One tap | Free tier, a third party | US provider, check with HM data protection | Convenient, but data sits with a third party |
| 3: Netlify hosting instead of GitHub Pages, with Netlify Forms | One tap | Free, no code | US provider | Simplest "real" submission |
| 4: Cloudflare Worker + D1 (free tier) | One tap | Tiny backend (~50 lines), EU region selectable | Good if EU | Robust, a little setup |
| 5: Microsoft 365 at HM (Power Automate HTTP trigger to Excel/SharePoint) | One tap | Needs an HM licence (premium connector) | Best (HM-internal) | Ask HM IT |

**Recommendation:**
- Start with option 1 (e-mail plus backup file). It works with GitHub Pages and needs no infrastructure.
- Voice memos (option C) do not fit into an e-mail link. For them, either a backup ZIP to attach, or option 4.
- If HM IT allows it, option 5 is the cleanest choice for data protection.

The answers are a compact JSON block. The e-mail body contains a readable summary and the JSON, which I can import directly.

## 5. Technology

- **Single page:** HTML, CSS and vanilla JS, no build step, no framework, under 200 KB; it works offline once loaded.
- **Content in a separate file** (`deck_e1.json`): cases, questions, sketch types and hints. Content corrections are made only there, with no code change.
- **Reuse:** the same card engine can show other decks, e.g. `deck_e8c.json` for the OEKS vs. LegalRuleML review study (with timing per card, which E8c needs anyway).
- **Per-expert link:** `…/?deck=e1#k=AB12`. The code identifies the invitation, so we can match answers without asking for a name.
- **Measurement:** time per card and the number of changes are stored with the answers (useful for E8c; disclosed on the start page).
- **Accessibility:** large tap targets (min. 48 px), high contrast, dark mode, keyboard operation, screen-reader labels.
- **Language:** German first; the deck file is prepared for English.

## 6. GitHub setup

1. Private or public repository, e.g. `oeks-expert-review`. The content is not secret, but must not contain the solution key.
2. Enable GitHub Pages (branch `main`, root). The link then reads `https://<user>.github.io/oeks-expert-review/`.
3. **Never** commit the solution key (`E1_KEY_do_not_share.csv`) to the repository.
4. Pin a version per round (tag `e1-v1`), so that answers can be traced to the content version.

## 7. Steps and effort

| Step | Who | Effort |
|---|---|---|
| 1. Incorporate the expert feedback on content into `deck_e1.json` | Cornelius provides the feedback; I implement it | short |
| 2. Build the card engine (mobile first) with sketches from the current form | Claude (Sonnet) | about half a day of agent work |
| 3. Submission option 1 (mailto plus backup file) and import script on our side | Claude | short |
| 4. Test on iPhone, Android and desktop (Safari, Chrome, Firefox) | Cornelius plus 1 test person | 30 min |
| 5. Create the repository and enable Pages | Cornelius (or I prepare everything as a ZIP) | 10 min |
| 6. Pilot with 1 expert, then the round with 2+ experts | Cornelius | – |
| Optional: voice memo (C), backend option 4 or 5, E8c deck | Claude | depending on choice |

## 8. Open decisions

1. Submission: e-mail as baseline, or directly a backend (Cloudflare, or HM via Power Automate)?
2. Voice: is device dictation enough, or do we also want voice memos?
3. Should the expert's content corrections be incorporated now? Please send the feedback.
4. Public or private repository?


## 9. Update 4 Nov, 12:15: reusable framework, effort, voice

**Framework instead of a one-off page ("expert-cards")**
- **Engine:** a single static web app, generic.
- **Deck:** a JSON/YAML file describing one study (texts, cards, options, figures, settings). A new study means a new deck, with no code changes.
- **Card types:** info; single choice; multiple choice; verdict (meets / does not meet / depends); scale; free text; A/B comparison; review (find the error, with a timer). Each card can carry a figure (SVG template with parameters, or an image file), a "related to card X" link and optional follow-ups.
- **Submission adapters:** e-mail plus backup file (default, works with GitHub Pages alone); optional Cloudflare Worker or HM Power Automate. Selected in the deck.
- **Tools:**
  - `validate_deck.py`, which checks a deck before release;
  - `import_answers.py`, which reads e-mails and backup files into a CSV;
  - `agreement.py`, which computes Cohen's/Fleiss' kappa against a key that is kept outside the repository.
- **GitHub template repository:** for a new study, "Use this template", put the deck in `decks/`, enable Pages, send the link. One repository can also host several decks (`?deck=e1`, `?deck=e8c`).

**Effort, realistically**
- First usable version (engine, E1 deck with sketches, mailto plus backup, local saving, import script): about 2–3 hours of agent work.
- Plus a test on iPhone, Android and desktop (30 min by you), and fixes after the test.
- The earlier "half a day" included polish and the conversion of all sketches; it is not a large project.

**Voice: a microphone button directly in the interface**
- Text fields get their own microphone button. It uses the browser's built-in speech recognition (Web Speech API):
  - on the iPhone in Safari, that is Apple's dictation, which people already have;
  - in Chrome, it is Google's.
- The text appears live in the field and can be corrected.
- If a browser has no speech recognition (e.g. Firefox), the same button records an audio memo instead.
  - E-mail cannot carry it directly; it goes into the backup file the expert attaches.
  - Or it goes through the optional backend.
- Notice on the start page: speech recognition runs through the device or browser provider (Apple or Google).
- Hosting note: free GitHub Pages needs a public repository (private only with a paid plan). The deck is then publicly readable; the solution key never goes in.
