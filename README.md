# expert-cards

Strukturierte Expertenbefragungen als Kartenstapel: eine Karte pro Frage, am Handy oder am Desktop. Es gibt keine Konten, keinen eigenen Server und keine KI zur Laufzeit. Gehostet wird über GitHub Pages.

*Structured expert elicitation as a card deck, mobile-first, static, reusable for any study.*

## Prinzip

- **Engine:** die allgemeine Web-App, für alle Studien gleich.
- **Deck:** eine Datei pro Studie (`decks/<id>/deck.json`) mit Texten, Karten, Antwortoptionen und Skizzen.

Für eine neue Befragung legt man ein neues Deck an, am Code ändert sich nichts.

## Status

Version 0.1 läuft. Live unter `https://corneliuspreidel.github.io/expert-cards/` (Pages aus `main`, Root). Plan: `docs/PLAN.md`, Arbeitsanweisungen für Claude Code: `CLAUDE.md`, Deck-Format: `docs/DECK_SCHEMA.md`.

Erstes Deck: `decks/e1-baybo-art27`. Es enthält die Fallprüfung zum Brandschutz nach BayBO (Art. 25 und 27) aus der Rule Fidelity Study (OEKS) der Hochschule München.

## Neue Studie in 5 Schritten

1. Deck anlegen: Ordner `decks/<id>/` mit `deck.json` (Vorlage: `decks/e1-baybo-art27/deck.json`, Format: `docs/DECK_SCHEMA.md`). Danach den Start-Katalog aktualisieren: `python3 tools/sync_decks_index.py` (schreibt `decks/index.json` aus allen Ordnern; optionale Felder wie `group`, `label`, `hint` bleiben erhalten).
2. Rationale schreiben: `decks/<id>/RATIONALE.md`, warum jede Karte existiert und was ihre Antwort entscheidet (Methode und Checkliste: `docs/QUESTION_DESIGN.md`; ohne erwartete Antworten). Dann das Deck prüfen: `python3 tools/validate_deck.py decks/<id>/deck.json`.
   Soll es dieselbe Studie in einer zweiten Fassung geben (z. B. MBO statt BayBO), wird das zweite Deck mit `tools/derive_deck.py` aus dem ersten erzeugt; nach dem Sync dieselbe `group` in `decks/index.json` setzen – dann erscheinen Chips und der Katalog auf der Startseite.
3. Lokal ansehen: `python3 -m http.server 8765` und `http://localhost:8765/?deck=<id>` öffnen.
4. Veröffentlichen: committen und nach `main` pushen. GitHub Pages (Branch `main`, Root) aktualisiert sich in etwa einer Minute.
5. Link verschicken (pro Expert:in ein eigener Code):

   `https://corneliuspreidel.github.io/expert-cards/?deck=<id>#k=<Einladungscode>`

   **Ein Klick reicht für die Teilnahme.** „Wie eine App“ auf dem Home-Bildschirm geht auf dem iPhone leider nicht mit einem Klick aus der Mail (Apple-Vorgabe); optional `?install=1` in den Link setzen, dann öffnet sich der kurze Hinweis dazu:

   `…/expert-cards/?deck=<id>&install=1#k=<Code>`

### Kurz-Mail an Expert:innen (Vorlage)

```
Betreff: Kurze Expertenbefragung BayBO – Ihr Link

Guten Tag …,

bitte öffnen Sie diesen Link (ein Klick genügt):

https://corneliuspreidel.github.io/expert-cards/?deck=e1-baybo-art27#k=IHRECODE

Auf dem iPhone bitte in Safari öffnen, auf Android in Chrome.
Zwischenspeichern passiert nur auf Ihrem Gerät; absenden erst am Ende per E-Mail.

Optional (App-Gefühl): Link öffnen → unten „Auf dem Home-Bildschirm ablegen“ –
iPhone: Teilen → Zum Home-Bildschirm; Android: Menü → App installieren.

Vielen Dank
…
```

Hinweis: Live-Diktat funktioniert in Safari (iPhone) und Chrome (Android/Desktop). Sonst Sprachnotiz bzw. Tastatur-Mikrofon.

## Antworten auswerten

Die Antworten kommen per E-Mail (lesbarer Text plus JSON-Block) und, wenn angehängt, als Sicherungsdatei.

```bash
# alle Mails (.eml/.txt) und Sicherungsdateien (.json) aus einem Ordner einlesen
python3 tools/import_answers.py eingang/ --deck decks/<id>/deck.json --out answers/answers.csv
# optional: Sprachnotizen lokal mit Whisper transkribieren (pip install faster-whisper)
python3 tools/import_answers.py eingang/ --deck decks/<id>/deck.json --transcribe
# Übereinstimmung; der Schlüssel liegt AUSSERHALB des Repositorys
python3 tools/agreement.py answers/answers.csv --key ~/studien/e1/schluessel.csv
```

`answers/` ist in `.gitignore`. `agreement.py` verweigert einen Schlüssel innerhalb eines Git-Repositorys.

**Wichtig:** Lösungsschlüssel und eingegangene Antworten gehören nie ins Repository. Es ist öffentlich.

## Lizenz

Code: MIT. Deck-Inhalte: CC BY 4.0, sofern im Deck nicht anders angegeben.
