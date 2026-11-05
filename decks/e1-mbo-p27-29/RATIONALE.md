# Rationale zum Deck e1-mbo-p27-29 (Fallprüfung Brandschutz nach MBO)

Stand: 5. November 2026, Deck-Version 0.1.0. Methode: `docs/QUESTION_DESIGN.md`. Inhaltliche Begründung jeder Karte: `decks/e1-baybo-art27/RATIONALE.md`. Sie gilt hier unverändert, nur die Fundstellen sind andere.

Wie beim BayBO-Deck gilt: öffentlich, also ohne erwartete Urteile. Expert:innen sollten das Dokument vor der Befragung nicht lesen.

## 1. Wozu ein zweites Deck

Das BayBO-Deck fragt die Auslegung von Art. 25 und 27 BayBO ab. Das ist für Bayern genau, aber nur bayerische Fachleute können es sinnvoll beantworten, und ihre Antworten lassen sich nicht mit anderen Ländern vergleichen. Die Landesbauordnungen folgen in diesen Vorschriften weitgehend der Musterbauordnung (MBO). Ein Deck auf MBO-Grundlage erlaubt deshalb:

1. **Vergleich zwischen Ländern:** Fachleute aus allen Ländern beantworten dieselben Fragen zu demselben Wortlaut.
2. **Vergleich mit Bayern:** Die Antworten lassen sich Karte für Karte neben die des BayBO-Decks legen.
3. **Trennung von Text und Praxis:** Weichen die Antworten ab, obwohl der Wortlaut gleich ist, liegt es an der Auslegungspraxis. Weichen sie dort ab, wo sich der Wortlaut unterscheidet, liegt es am Text.

Die eigentliche Auslegung geht dabei nicht verloren. Die Fragen sind dieselben, nur die Fundstelle ist eine andere. Neu ist eine Karte (L1), die ausdrücklich nach Abweichungen des eigenen Landes fragt.

## 2. Was gleich bleibt (Vergleichbarkeit)

- **Karten-IDs, Reihenfolge, Optionen und Options-IDs** sind identisch mit `e1-baybo-art27` 0.1.1. Die Auswertung kann daher beide Decks über die Karten-ID zusammenführen. Die CSV aus `import_answers.py` enthält die Spalte `deck`.
- **Testgebäude, Fälle, Annahmen und Skizzen** sind identisch.
- **Nur zwei Dinge sind geändert:**
  - die Fundstellen, nach der Zuordnung unten;
  - der angezeigte Gesetzestext: MBO statt BayBO.

**Regel für die Pflege:** Jede inhaltliche Änderung an einer Karte wird in **beiden** Decks gemacht, und beide Versionen werden erhöht. Sonst ist der Vergleich nicht mehr sauber. Am einfachsten wird dieses Deck aus dem BayBO-Deck neu erzeugt (Abschnitt 6).

## 3. Zuordnung der Fundstellen

| Inhalt | BayBO | MBO |
|---|---|---|
| Gebäudeklassen | Art. 2 Abs. 3 | § 2 Abs. 3 |
| Tragende Wände, Stützen | Art. 25 | § 27 |
| Außenwände | Art. 26 | § 28 |
| Trennwände | Art. 27 | § 29 |
| Brandwände | Art. 28 | § 30 |
| Notwendige Flure | Art. 34 | § 36 |

## 4. Wo sich der Wortlaut unterscheidet

Beim Vergleich mit dem BayBO-Deck sind nur Abweichungen an diesen Stellen auf den Text zurückführbar:

| Stelle | BayBO | MBO | Berührte Karten | Bewertung |
|---|---|---|---|---|
| Öffnungen in Trennwänden (Art. 27 Abs. 5 / § 29 Abs. 5) | nur: feuerhemmende, dicht- und selbstschließende Abschlüsse | zusätzlich: Öffnungen nur zulässig, wenn auf die für die Nutzung erforderliche Zahl und Größe beschränkt | B1, B16, B11 | Kein Fall variiert Zahl oder Größe der Öffnungen. Eine Abweichung ist daher nicht zu erwarten, aber möglich, wenn jemand die Tür selbst für unnötig hält. |
| Ausnahme Wohngebäude GK 1/2 (Abs. 6) | gelten nicht **innerhalb** von Wohngebäuden der GK 1 und 2 | gelten nicht **für** Wohngebäude der GK 1 und 2 | B2, B18 | In beiden Fällen geht es um Wände innerhalb des Gebäudes. Die Wortwahl sollte das Urteil nicht ändern, kann aber die Begründung ändern. |
| Tragende Wände (Art. 25 / § 27) | gleicher Inhalt; Querverweis Art. 27 Abs. 4 | Querverweis § 29 Abs. 4 | A1–A11 | inhaltlich gleich |
| Gebäudeklassen (Art. 2 Abs. 3 / § 2 Abs. 3) | entspricht der MBO | – | C6 | vor Versand Wortlaut vergleichen |

Alle übrigen Absätze von Art. 27 und § 29 sind wortgleich. Das heißt Abs. 1–4 und die Ausnahme notwendiger Flure in Abs. 2 Nr. 1. Unterschiedliche Antworten auf C1–C5, C9 und die zugehörigen Fälle gehen also auf die Auslegungspraxis zurück, nicht auf den Text.

## 5. Was neu ist

### Einleitungskarte „Worum es geht“
Sie bittet ausdrücklich darum, nach der MBO zu urteilen und Abweichungen des eigenen Landes in der Anmerkung zu nennen. **Warum:** Wer täglich nach seiner LBO prüft, urteilt sonst unbewusst nach ihr. Eine bewusste Abweichung soll sichtbar werden, statt im Urteil unterzugehen.

### L1: Bei welchen Grundsatzfragen entscheidet Ihr Land anders?
- **Zweck:** Abweichungen zwischen Ländern sammeln. **Position:** direkt nach Teil 1, solange die Grundsatzfragen präsent sind.
- **Form:** Mehrfachauswahl über C1–C7 und C9, dazu „Bei keiner“ und „Kann ich nicht beurteilen“, mit Freitext für Land und Fundstelle.
- **Entscheidet:**
  - wie die Antworten zwischen Ländern zu lesen sind (Wortlaut gleich, Praxis anders);
  - Kandidaten für länderspezifische Auslegungen, die in OEKS mit eigenem Geltungsbereich (Land) festgehalten werden müssten.
- **Schwächen:**
  - „Bei keiner“ und „Kann ich nicht beurteilen“ sind wie in C2 nicht exklusiv;
  - die Optionsbeschriftungen sind Kurzfassungen und müssen neutral bleiben (keine Lesart andeuten).

### Feld „Bundesland“
Es fragt, in welchem Land jemand überwiegend arbeitet, und kommt früher als im BayBO-Deck, nicht erst am Ende. **Warum:** Es ist die wichtigste Gruppierungsvariable dieses Decks.

## 6. Pflege und Erzeugung

Das Deck wurde aus `e1-baybo-art27` 0.1.1 mechanisch erzeugt:
1. alle Fundstellen „Art. n“ nach der Tabelle in Abschnitt 3 ersetzt und „BayBO“ durch „MBO“;
2. die Gesetzestexte durch den MBO-Wortlaut ersetzt;
3. die Einleitungskarte und L1 ergänzt;
4. Feld „Bundesland“ und Betreff angepasst.

Danach wurde jede ersetzte Fundstelle geprüft: Es kommen nur noch § 2, § 27, § 28, § 29, § 30 und § 36 vor.

Diese Schritte stehen jetzt in `derive.json` und werden mit `python3 tools/derive_deck.py decks/e1-mbo-p27-29/derive.json` ausgeführt. Ändere `deck.json` dieses Decks nie von Hand, sondern das BayBO-Deck oder `derive.json`, und erzeuge das Deck dann neu. `--check` meldet, ob das MBO-Deck veraltet ist. Hat sich die Version des BayBO-Decks geändert, weist das Skript darauf hin. Dann wird `set.version` in `derive.json` erhöht und `source_version` nachgezogen.

## 7. Grenzen

- **Die MBO ist kein geltendes Recht.** Niemand prüft nach ihr. Die Antworten zeigen, wie Fachleute den Mustertext lesen, geprägt von ihrer LBO.
- **Länder mit eigener Systematik**, etwa abweichende Nummerierung oder zusätzliche Absätze, sind nur über L1 und die Anmerkungen erfasst.
- **Das Testgebäude bleibt dasselbe:** Doppelhaus, Gebäudeklasse 3 als Testannahme. C6 und C7 können zwischen Ländern unterschiedlich ausfallen.
- **Die erwarteten Urteile** der internen Begleitdatei gelten für dieses Deck unverändert. Die Wortlautunterschiede in Abschnitt 4 ändern nach unserer Prüfung keine erwartete Antwort.
