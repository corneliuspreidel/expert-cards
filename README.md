# expert-cards

Strukturierte Expertenbefragungen als Kartenstapel: eine Karte pro Frage, am Handy oder am Desktop. Es gibt keine Konten, keinen eigenen Server und keine KI zur Laufzeit. Gehostet wird über GitHub Pages.

*Structured expert elicitation as a card deck, mobile-first, static, reusable for any study.*

## Prinzip

- **Engine:** die allgemeine Web-App, für alle Studien gleich.
- **Deck:** eine Datei pro Studie (`decks/<id>/deck.json`) mit Texten, Karten, Antwortoptionen und Skizzen.

Für eine neue Befragung legt man ein neues Deck an, am Code ändert sich nichts.

## Status

In Aufbau. Der Plan steht in `docs/PLAN.md`, die Arbeitsanweisungen für Claude Code in `CLAUDE.md`.

Erstes Deck: `decks/e1-baybo-art27`. Es enthält die Fallprüfung zum Brandschutz nach BayBO (Art. 25 und 27) aus der Rule Fidelity Study (OEKS) der Hochschule München.

## Neue Studie in 5 Schritten (Ziel)

1. Repository als Vorlage verwenden (Template).
2. Deck anlegen: `decks/<id>/deck.json`.
3. Deck prüfen: `python tools/validate_deck.py decks/<id>/deck.json`.
4. GitHub Pages aktivieren (Branch `main`, Root).
5. Link verschicken: `https://<user>.github.io/expert-cards/?deck=<id>#k=<Einladungscode>`.

**Wichtig:** Lösungsschlüssel und eingegangene Antworten gehören nie ins Repository. Es ist öffentlich.

## Lizenz

Code: MIT. Deck-Inhalte: CC BY 4.0, sofern im Deck nicht anders angegeben.
