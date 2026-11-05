# Deck schema (`expert-cards/deck@0.1`)

One study = one `decks/<deck-id>/deck.json`. Listed in `decks/index.json`. The engine contains no study text. `tools/validate_deck.py` checks everything below.

## Top level

| Field | Type | Notes |
|---|---|---|
| `schema` | string | `expert-cards/deck@0.1` |
| `id`, `version`, `language` | string | `id` matches the folder name; `version` is part of the storage key and is stored with the answers |
| `title`, `subtitle` | string | |
| `owner` | `{name, institution}` | shown on the start screen |
| `estimated_minutes` | `{part1, total}` | |
| `consent_text` | string | shown above the consent checkbox |
| `identity_fields` | list | `{id, label, type: text\|number\|choice, options?, required?, at?}`; `at: "end"` moves the field from the start screen to the overview |
| `references` | map | `{<ref-id>: {title, text}}`, e.g. statute text; sections point to them |
| `intro_cards` | list of `info` cards | optional `before_section: <section id>` puts the card at the start of that section's first lesson; otherwise it opens lesson 1 |
| `sections` | list | `{id, title, icon?, part_titles?, reference?, question?, cards[]}`; `question` is the default prompt for `verdict` cards. Optional `icon` (`plan`, `wall`, `column`, `note`, `send`, `cards`; `compass` still accepted as alias of `plan`) and `part_titles` (one short theme label per lesson chunk) give the home overview a clear topic per round |
| `verdict_options` | list | `{id, label, requires_reason?}` |
| `confidence_options` | list | `{id, label}`; shown after a clear verdict |
| `closing` | `{free_text_label, title?, icon?}` | last card, free text |
| `legal` | `{privacy_url?, imprint_url?, note?}` | links shown on the start and submit screens (data protection, imprint of the responsible institution) |
| `submission` | `{mode: email\|webhook, to, subject, backup_file, url?}` | `to: "PLEASE_SET"` is accepted by the validator only with `--allow-placeholder` |
| `settings` | `{auto_advance?: bool, app_feedback?: bool, lesson_size?: int}` | optional; `auto_advance` and `app_feedback` default `true`. `lesson_size` (default 6) is the target cards per round. `app_feedback` (default `true`) shows a discreet FAB + quick sheet on every screen after start; entries go into answer `_feedback` (`v`, `note`, `log[]` with card context) and are sent with the normal submission |

## Cards

Common fields: `id` (unique in the deck), `type`, `title`, `prompt`, `hint`, `figure`, `related` (list of card ids), `assumption`, `follow_up`.

| `type` | Extra fields | Answer stored |
|---|---|---|
| `info` | `body` | none |
| `single_choice` | `options[{id,label,detail}]`, `follow_up{label}` | `{v: option-id, note}` |
| `multi_choice` | same; an option with id `keine` excludes the others | `{v: [ids], note}` |
| `verdict` | `changes[]` (bullets), `chips[]`, `assumption` | `{v, conf, reason, note}` |
| `scale` | `min`, `max`, `labels[low, high]`, `follow_up` | `{v: number, note}` |
| `free_text` | `label` | `{note}` |
| `ab_compare`, `find_error` | planned for E8c, not implemented yet | |

## Text markup

Deck texts are plain text with a tiny markup, never HTML: `==marked==`, `**bold**`, newline = line break. Everything else is escaped.

## Figures

`{"template": "duplex-plan", "highlight": "base|party|ext|hwr|hwrdoor|flur|keller", "caption": "…"}`
`{"template": "section", "params": {"k": bool, "hl": "og|kg", "og": "label", "kg": "label", "x": "label"}, "caption": "…"}`
`{"image": "assets/x.svg", "alt": "…", "caption": "…"}` (path relative to the deck folder)

## Answers (backup file / e-mail JSON block)

`expert-cards/answers@1`: `{deck:{id,version}, code, person, consent, startedAt, updatedAt, submittedAt, answers, timing_ms, changes, audio[]}`. The e-mail JSON block omits `audio`. Answer keys and collected answers never go into this repository.
