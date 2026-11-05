# Fragen entwerfen: Methode und Checkliste

Dieses Dokument ist das Rückgrat jedes Decks. Es beschreibt, **warum** eine Karte existiert, **was** ihre Antwort entscheidet und **woran** man eine gute Frage erkennt. Wer Fragen oder das Design ändern will, beginnt hier und danach beim Rationale-Dokument des Decks (z. B. `decks/e1-baybo-art27/RATIONALE.md`).

**Grenze, öffentlich:** Das Repository ist öffentlich. Rationale-Dokumente beschreiben Zweck und Aufbau der Fragen. Sie enthalten **keine** erwarteten Antworten, keine Lösungsschlüssel, keine Kennungen, die eine erwartete Antwort verraten (z. B. Varianten-IDs mit „P“/„N“), und nicht die Lesart der Autor:innen. Diese Dinge stehen nur in einer internen Begleitdatei außerhalb des Repositorys.

## 1. Wozu eine Befragung mit expert-cards dient

Ein Test zeigt, **wo** Prüfregeln voneinander oder vom Gesetz abweichen, aber nicht, **welche** Lesart richtig ist. Das können nur Fachleute beurteilen, und ihre Zeit ist knapp. expert-cards macht aus jeder Abweichung, die ein Test aufdeckt, eine kurze Frage:

```
Test deckt eine Abweichung auf
  → sie wird einem Entscheidungstyp zugeordnet (Abschnitt 3)
  → eine Karte fragt genau diese Entscheidung ab
  → die Antwort wird festgehalten (Herkunft, Reifegrad)
  → Regeln und Erwartungen werden neu bewertet bzw. neu erzeugt
```

Jede Karte muss sich auf einen dieser Zwecke zurückführen lassen:

| Zweck | Frage dahinter | Beispiel |
|---|---|---|
| **Orakel prüfen** | Stimmt die Lesart, auf der unsere Testerwartungen beruhen? | C4 Außenwände |
| **Divergenz klären** | Zwei Regeln lesen dieselbe Vorschrift verschieden; welche Lesart trägt? | C2 Keller, C9 Dachraum |
| **Testmodell validieren** | Ist das Testgebäude realistisch und trifft es die Vorschrift überhaupt? | C6 Gebäudeklasse, C7 Doppelhauswand |
| **Abdeckung prüfen** | Fehlt eine Anforderung, die eine Prüfung abdecken muss? | C8, Schlusskarte |
| **Fall beurteilen** | Wie urteilt die Praxis über einen konkreten, minimal veränderten Zustand? | alle A- und B-Fälle |

Eine Karte, die keinem Zweck dient, wird gestrichen.

## 2. Zwei Kartenarten und warum es beide braucht

- **Grundsatzfragen (C):** Sie fragen die Auslegungsentscheidung direkt ab, abstrakt, mit 2–4 Optionen und „Hängt ab“. Ihre Antwort lässt sich auf alle Regeln übertragen, die dieselbe Entscheidung treffen.
- **Fälle (A, B):** Sie zeigen einen konkreten Zustand des Testgebäudes, der sich vom Ausgangsgebäude nur in einem Punkt unterscheidet, und fragen nach dem Urteil („Erfüllt / Nicht erfüllt / Hängt ab“). Ein Fall entspricht genau einer Testvariante.

Erst beide zusammen machen die Antworten belastbar. Eine Grundsatzantwort ohne Fall kann abstrakt anders ausfallen als das Urteil am Bauteil; ein Fallurteil ohne Grundsatzfrage zeigt nicht, **warum** jemand so urteilt. Deshalb ist ein Fall, der von einer Grundsatzfrage abhängt, mit ihr verknüpft (`related`). Die App zeigt dann die eigene frühere Antwort an, und die Auswertung kann prüfen, ob beides zusammenpasst.

## 3. Entscheidungstypen (woher die Fragen kommen)

| Typ | Kennzeichen | Typische Frageform |
|---|---|---|
| Geltungsbereich / Abgrenzung | Welche Vorschrift gilt für ein Bauteil? Oft steht die Antwort nur in der Gliederung des Gesetzes. | „Regelt Art. X das abschließend, oder gilt Art. Y zusätzlich?“ |
| Unbestimmter Begriff | Das Wort steht im Gesetz, seine Bedeutung nicht. | „Gilt Z als ‚anders genutzter Raum‘?“ |
| Verweis | Das Gesetz verweist, das Ziel ist mehrdeutig. | „Gemeint ist die geforderte oder die ausgeführte Klasse?“ |
| Quantifizierung | jede / alle / mindestens eine | Fall mit einer abweichenden Wand |
| Anwendbarkeit, Ausnahmen | Gebäudeklasse, Nutzung, ausgenommene Bauteile | Gegenfall, in dem die Ausnahme greift bzw. nicht greift |
| Modellbindung | Welche Eigenschaft im Modell steht für den Rechtsbegriff? | Fall mit fehlender oder unklarer Angabe |

Modellbindung ist meist keine Frage an Fachleute, sondern an die Modellierung. Sie taucht nur dort auf, wo die Praxis entscheiden muss, wie mit fehlenden Angaben umzugehen ist.

## 4. Regeln für gute Fragen

**Neutralität (am wichtigsten).** Die Karte darf die Antwort nicht vorwegnehmen.
- Keine Einordnung in Einleitungs- oder Fallkarten, die genau das vorwegnimmt, was eine Grundsatzfrage fragt (Lehre aus Deck 0.1.0: Die Einleitung nannte die Außenwände „keine Trennwände“, und das ist genau Frage C4).
- Alle Optionen in derselben Form: entweder alle mit einer Folgezeile oder keine. Keine Begründung nur bei einer Option.
- Fakten beschreiben, keine Bewertungen. „Die Wand ist feuerhemmend“ statt „die Wand ist ausreichend“.
- Die Reihenfolge der Optionen ist fest. Die eigene Lesart steht nicht systematisch oben; besser wäre eine Rotation pro Einladungscode (noch nicht gebaut).

**Eine Karte, eine Entscheidung.**
- Ein Fall ändert gegenüber dem Ausgangsgebäude genau ein Anforderungselement. Was nicht genannt ist, bleibt gleich.
- Fragt eine Grundsatzfrage zwei Dinge, wird sie geteilt.

**Annahmen kennzeichnen.**
- Künstliche Zustände, die es nur für den Test gibt (z. B. „das Obergeschoss gilt als Kellergeschoss“), stehen im Feld `assumption` und werden als „Annahme für den Test“ angezeigt.
- Wer die Annahme ablehnt, soll „Hängt ab“ wählen und das sagen können. Das ist eine wertvolle Antwort, kein Fehler.

**„Hängt ab“ ist erwünscht.** Es ist die Option, die echte Auslegungsspielräume sichtbar macht. Sie verlangt eine Begründung, und die Auswertung zählt eine Entscheidung als „strittig“, sobald jemand sie wählt.

**Minimalpaare.** Wo möglich, gibt es zu einem Fall einen Gegenfall, der sich nur im geprüften Element unterscheidet (z. B. Tür selbstschließend oder nicht). So lässt sich prüfen, ob Fachleute genau auf dieses Element reagieren.

**Wiederholung mit Absicht.** Ein Fall darf denselben Modellzustand wie ein anderer zeigen, wenn er nach einem bestimmten Bauteil fragt. Das muss im Rationale stehen, sonst wirkt es wie ein Fehler.

**Sprache.** Der Gesetzeswortlaut ist mit Fundstelle zu zitieren; eigene Begriffe sind nach dem Gesetz zu wählen. Nummerierungen müssen zum Land passen (BayBO statt MBO: Art. 34 notwendige Flure, nicht Art. 36).

## 5. Was jede Karte im Rationale braucht

Für jede Karte hält das Rationale-Dokument des Decks fest:

| Feld | Inhalt |
|---|---|
| **Zweck** | Orakel prüfen / Divergenz klären / Testmodell validieren / Abdeckung / Fall |
| **Entscheidungstyp** | aus Abschnitt 3 |
| **Was geprüft wird** | Absatz, Satz, Nummer; bei Fällen das eine geänderte Anforderungselement |
| **Was die Antwort entscheidet** | welche Auswertung, welcher Fall, welches Ergebnis sich mit der Antwort ändert |
| **Verknüpfung** | verknüpfte Karten, Minimalpaar |
| **Bekannte Schwächen** | Mehrdeutigkeit, Annahmen, Reihenfolge, Formulierung |
| **Ideen zur Verbesserung** | konkrete Änderungsvorschläge |

## 6. Checkliste vor einer neuen Runde

- [ ] Jede Karte hat einen Zweck und einen Eintrag im Rationale.
- [ ] Keine Einleitung, kein Hinweis und keine Option nimmt eine Grundsatzfrage vorweg.
- [ ] Optionen haben dieselbe Form.
- [ ] Testannahmen sind als `assumption` markiert.
- [ ] Jeder Fall, der von einer Grundsatzfrage abhängt, ist mit ihr verknüpft.
- [ ] Nummerierung und Fundstellen passen zum Landesrecht.
- [ ] `version` im Deck erhöht, wenn sich Inhalte geändert haben (die Version wird mit jeder Antwort gespeichert; Achtung: Wer mitten im Ausfüllen ist, beginnt nach einer Versionsänderung neu).
- [ ] `python3 tools/validate_deck.py decks/<id>/deck.json` ohne Fehler.
- [ ] Probedurchlauf mit einer Person, die das Deck nicht kennt: Zeit, Verständlichkeit, Stellen mit „Hängt ab“ notieren.
- [ ] Auswerteplan festgeschrieben (mit Datum und Hash), **bevor** die erste Antwort geöffnet wird.
- [ ] Lösungsschlüssel und interne Begleitdatei liegen außerhalb des Repositorys.
