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

1. Deck anlegen: Ordner `decks/<id>/` mit `deck.json` (Vorlage: `decks/e1-baybo-art27/deck.json`, Format: `docs/DECK_SCHEMA.md`) und einen Eintrag in `decks/index.json`.
2. Deck prüfen: `python3 tools/validate_deck.py decks/<id>/deck.json`.
3. Lokal ansehen: `python3 -m http.server 8765` und `http://localhost:8765/?deck=<id>` öffnen.
4. Veröffentlichen: committen und nach `main` pushen. GitHub Pages (Branch `main`, Root) aktualisiert sich in etwa einer Minute.
5. Link verschicken: `https://corneliuspreidel.github.io/expert-cards/?deck=<id>#k=<Einladungscode>`. Pro Expert:in ein eigener Code.

Hinweis für die Einladung: Auf dem iPhone Safari verwenden, auf Android und Desktop Chrome. Nur dort wird Sprache live in Text umgewandelt. In anderen Browsern gibt es eine Sprachnotiz (Firefox) oder den Hinweis auf das Tastatur-Mikrofon (iPhone).

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
