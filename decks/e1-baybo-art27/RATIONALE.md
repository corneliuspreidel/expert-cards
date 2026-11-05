# Rationale zum Deck e1-baybo-art27 (Fallprüfung Brandschutz BayBO)

Stand: 5. November 2026, Deck-Version 0.1.1. Methode und Begriffe: `docs/QUESTION_DESIGN.md`.

Dieses Dokument erklärt, **warum** jede Karte im Deck steht, **was** ihre Antwort entscheidet und **wo** sie noch schwach ist. Es ist die Grundlage, um Fragen und Design zu verbessern.

**Öffentlich, daher ohne Lösung.** Hier stehen keine erwarteten Urteile, keine Varianten-IDs und nicht die Lesart der Autor:innen. Die Zuordnung zu den Testvarianten und die erwarteten Urteile liegen in einer internen Begleitdatei außerhalb des Repositorys. Expert:innen sollten dieses Dokument vor der Befragung nicht lesen, weil es zeigt, welche Fragen für die Studie besonders wichtig sind.

## 1. Worum es in der Studie geht

Die Rule Fidelity Study (OEKS, Hochschule München) prüft, ob ausführbare Prüfregeln für digitale Bauanträge das Gesetz richtig umsetzen. Geprüft werden:
- veröffentlichte Expertenregeln (MBO2BIM, OpenBimRL);
- von Sprachmodellen erzeugte Regeln.

Dafür wird jede Regel auf der Original-Engine gegen Varianten eines Testgebäudes ausgeführt. Jede Variante bricht oder erfüllt genau ein Anforderungselement von Art. 25 oder Art. 27 BayBO.

Die Tests zeigen, **wo** Regeln abweichen. Ob eine Abweichung ein Fehler ist, hängt aber an Auslegungsentscheidungen, die oft nicht im Wortlaut stehen. Dieses Deck legt diese Entscheidungen Fachleuten vor. Es hat drei Aufgaben:

1. **Orakel prüfen:** Die Testerwartungen beruhen auf einer Lesart. Bestätigen Fachleute sie, oder müssen Ergebnisse neu bewertet werden? Am wichtigsten ist **C4**, denn an ihr hängt das Hauptmaß der Studie (siehe unten).
2. **Divergenzen klären:** Wo erzeugte Regeln das Gesetz verschieden lesen (Keller, Dachraum), sagen Fachleute, welche Lesart trägt.
3. **Testgebäude validieren:** Ist das Doppelhaus mit Gebäudeklasse 3 und einer Wohnungstrennwand ein sinnvoller Prüffall für Art. 27?

## 2. Aufbau und Gründe dafür

| Teil | Karten | Zweck | Warum in dieser Reihenfolge |
|---|---|---|---|
| Einleitung | 2 Info-Karten | Gebäude beschreiben, Erwartung setzen („es gibt keine erwartete richtige Antwort“) | Fachleute brauchen das Ausgangsgebäude, bevor sie Abweichungen beurteilen. |
| Teil 1 | C1–C9, C8 als Freitext (9 Karten, etwa 15 Min.) | Grundsatzfragen | **Vor** den Fällen, damit die Antwort unabhängig vom konkreten Bauteil gegeben wird und die Fälle die eigene Antwort danach anzeigen können. |
| Info-Karte | „Eindeutige Fälle und Auslegungsfälle“ | Annahmen und „Hängt ab“ erklären | Unmittelbar vor den Fällen, wo sie gebraucht wird. |
| Teil 2 | B1–B19 (Art. 27) | Fallurteile | Art. 27 ist der Kern der Studie und kommt deshalb zuerst. |
| Teil 3 | A1–A11 (Art. 25) | Fallurteile | Einfacher, rein nach Gebäudeklasse; dient vor allem zur Prüfung der Expertenregel für Art. 25. |
| Schluss | Freitext | Abdeckung | Was fehlt? |

**Die Fälle sind gemischt**, nicht nach Anforderungselement sortiert. So erkennen Fachleute nicht an der Reihenfolge, worauf ein Fall zielt. Minimalpaare stehen deshalb bewusst nicht nebeneinander.

**Urteil, Sicherheit, Begründung.** Jeder Fall hat drei Urteile: „Erfüllt“, „Nicht erfüllt“ und „Hängt ab“; „Hängt ab“ verlangt eine Begründung. Danach folgt eine überspringbare Sicherheitsangabe. Die Sicherheit trennt eindeutige von knappen Urteilen, ohne „Hängt ab“ zu erzwingen.

**Gemessen werden auch:** Zeit pro Karte und Anzahl der Änderungen. Lange Zeiten und viele Änderungen sind Hinweise auf unklare Formulierungen. Sie werden pro Karte ausgewertet und sind damit ein direktes Werkzeug zur Verbesserung des Decks.

## 3. Das Testgebäude (Einleitungskarte „Das Gebäude“)

- **Was:** Doppelhaus mit zwei Wohnungen, Erd- und Obergeschoss. Es ist das buildingSMART-Duplex-Modell; im Modell ist es *ein* Gebäude mit zwei Nutzungseinheiten. Gebäudeklasse 3 und Wohngebäude, „sofern nicht anders angegeben“. Eine Wohnungstrennwand steht zwischen den Wohnungen, die Außenwände der Längsseiten laufen an beiden Wohnungen vorbei.
- **Warum so:** Das Modell ist offen verfügbar und hat genau die Bauteile, die Art. 27 betrifft. Gebäudeklasse 3 ist gesetzt, weil Art. 27 Abs. 6 Wohngebäude der Gebäudeklassen 1 und 2 ausnimmt; sonst gäbe es nichts zu prüfen. C6 fragt, ob das realistisch ist.
- **Schwächen:**
  - Gebäudeklasse 3 ist eine Testannahme, steht aber in der Einleitung nicht als „Annahme für den Test“. **Verbesserung:** kennzeichnen.
  - Bis Version 0.1.0 nannte die Karte die Außenwände „keine Trennwände“. Das nahm C4 vorweg und wurde in 0.1.1 entfernt.
  - Das Obergeschoss liegt 3,10 m über Gelände. Das ist für die Gebäudeklasse wichtig und sollte am Modell noch einmal geprüft werden.

## 4. Grundsatzfragen (Teil 1)

### C1: Raum ohne Nutzungseinheit als „anders genutzter Raum“ (Art. 27 Abs. 2 Nr. 1)
- **Zweck:** Orakel prüfen. **Typ:** unbestimmter Begriff.
- **Hintergrund:** Ein gemeinsam genutzter Raum, etwa ein Hauswirtschaftsraum, gehört keiner Wohnung an. Ob er „anders genutzt“ im Sinne von Nr. 1 ist, entscheidet, ob seine Wände zu den Wohnungen Trennwände sein müssen.
- **Entscheidet:** die Beurteilung von B1, B6, B11 und B16. Diese vier Fälle setzen einen solchen Raum per Annahme. Fällt C1 anders aus als angenommen, verschieben sich alle vier gemeinsam.
- **Verknüpft:** B1, B6, B11, B16.
- **Schwächen:** Das Beispiel „gemeinsam genutzt“ ist in einem Doppelhaus mit zwei Wohnungen untypisch. Fachleute können die Prämisse ablehnen.
- **Verbesserung:** ein typischeres Beispiel nennen (z. B. Abstellraum, der von außen erschlossen ist), oder nachfragen, ob ein solcher Raum in der Praxis vorkommt.

### C2: Welche Räume sind im Kellergeschoss „anders genutzt“? (Abs. 2 Nr. 3)
- **Zweck:** Divergenz klären. **Typ:** unbestimmter Begriff.
- **Hintergrund:** Nr. 3 verlangt Trennwände zwischen Aufenthaltsräumen und anders genutzten Räumen im Kellergeschoss. Offen ist, ob damit auch Räume **derselben** Wohnung gemeint sind (Flur, Bad, Hauswirtschaftsraum, Abstellraum) oder nur fremde Räume. Erzeugte Regeln lasen das verschieden: Einige schlossen Räume derselben Wohnung aus, andere ein.
- **Entscheidet:** B4 und B17, und ob die beobachtete Divergenz als Fehler zählt.
- **Verknüpft:** B4, B17.
- **Schwächen:**
  - Die Option „Keiner dieser Räume“ schließt die anderen logisch aus, ist aber zusammen mit ihnen wählbar.
  - Mehrfachauswahl geht nicht in die Kappa-Auswertung ein; sie wird pro Option berichtet.
- **Verbesserung:** „Keiner“ exklusiv machen (Engine-Funktion), oder die Frage in zwei Schritte teilen: zuerst „Auch Räume derselben Wohnung?“ ja/nein/hängt ab, dann welche.

### C3: Welche Feuerwiderstandsfähigkeit meint Abs. 3 Satz 1?
- **Zweck:** Orakel prüfen. **Typ:** Verweis.
- **Hintergrund:** Die Trennwand muss die Feuerwiderstandsfähigkeit „der tragenden und aussteifenden Bauteile des Geschosses“ haben. Das kann die nach Gebäudeklasse **geforderte** oder die tatsächlich **ausgeführte** Klasse sein. Für eine Prüfregel ist das ein grundlegender Unterschied: Sie liest dann entweder eine Tabelle oder das Modell.
- **Entscheidet:** B7 und B13.
- **Verknüpft:** B7, B13.
- **Schwächen:** Das Beispiel im Hinweis (GK 4, tragende Wände feuerbeständig) entspricht keinem Fall im Deck.
- **Verbesserung:** einen Fall ergänzen, in dem die tragenden Bauteile höherwertig ausgeführt sind als gefordert. Erst dieser Fall trennt die beiden Lesarten wirklich.

### C4: Sind Außenwände zwischen zwei Nutzungseinheiten Trennwände? (Abgrenzung Art. 26/27)
- **Zweck:** Orakel prüfen. **Dies ist die wichtigste Frage des Decks.** **Typ:** Geltungsbereich/Abgrenzung.
- **Hintergrund:** Die BayBO regelt Außenwände (Art. 26), Trennwände (Art. 27) und Brandwände (Art. 28) in getrennten Artikeln. Art. 27 sagt nicht ausdrücklich, ob eine Außenwand, an die Räume zweier Wohnungen grenzen, zusätzlich Trennwand sein muss. Regeln, die „Wand zwischen zwei Nutzungseinheiten“ geometrisch erkennen, erfassen solche Außenwände mit. Ob das ein Fehler ist, entscheidet diese Frage.
- **Entscheidet:**
  - **das Hauptmaß der Studie** (den „Außenwand-Fehler“ in den vorab registrierten Studien 1 und 1R);
  - die Beurteilung von B19 und mittelbar von B5.

  Der Auswerteplan legt vorab fest, was bei jeder Antwort passiert: Mehrheit „Art. 26 allein“, Mehrheit „Art. 27 gilt auch“, oder Uneinigkeit bzw. „Hängt ab“.
- **Verknüpft:** B19.
- **Schwächen:**
  - Bis 0.1.0 trugen Einleitung und erste Option eine Begründung für eine der Lesarten. In 0.1.1 sind beide neutral; die Version wird mit jeder Antwort gespeichert.
  - Die Reihenfolge der Optionen ist fest.
  - Die Folgezeilen beschreiben Konsequenzen, keine Rechtsgründe. Fachleute müssen die Begründung selbst liefern.
- **Verbesserung:**
  - die Reihenfolge der Optionen pro Einladungscode rotieren (Engine-Funktion);
  - optional eine Nachfrage „Worauf stützen Sie das?“ als Pflichtfeld nur bei dieser Frage.

### C5: Notwendige Flure, Art. 27 oder abschließend Art. 34?
- **Zweck:** Orakel prüfen. **Typ:** Ausnahme/Abgrenzung.
- **Hintergrund:** Abs. 2 Nr. 1 nimmt notwendige Flure aus. Offen ist, ob dann gar keine Anforderung aus Art. 27 bleibt.
- **Entscheidet:** B14.
- **Verknüpft:** B14.
- **Hinweise:**
  - Die Fundstelle wurde nach Experten-Feedback von Art. 36 (MBO) auf Art. 34 (BayBO) korrigiert.
  - Die Options-ID heißt weiter `36`, damit Antworten vergleichbar bleiben. Das ist Absicht.
- **Schwächen:** Auch hier ist die Prämisse ein Testkonstrukt: Ein Flur in einer Wohnung, der „keiner Wohnung zugeordnet“ ist.

### C6: Welche Gebäudeklasse hätte das Doppelhaus realistisch?
- **Zweck:** Testmodell validieren. **Typ:** Anwendbarkeit.
- **Hintergrund:** Nach Art. 2 Abs. 3 hängt die Gebäudeklasse an Höhe, Zahl und Fläche der Nutzungseinheiten und daran, ob das Gebäude freistehend ist. Für Wohngebäude der Klassen 1 und 2 nimmt Art. 27 Abs. 6 die Trennwandpflicht aus. Die Fälle setzen deshalb Gebäudeklasse 3. Die Frage macht offen, wie künstlich das ist.
- **Entscheidet:** keine einzelne Fallbewertung. Sie entscheidet, wie das Testgebäude im Paper beschrieben wird: als realistischer Fall oder als gesetzte Testannahme.
- **Verbesserung:** In der Einleitung Gebäudeklasse 3 als „Annahme für den Test“ kennzeichnen (siehe Abschnitt 3).

### C7: Wand zwischen Doppelhaushälften, Trennwand (Art. 27) oder Gebäudeabschlusswand/Brandwand (Art. 28)?
- **Zweck:** Testmodell validieren. **Typ:** Geltungsbereich/Abgrenzung.
- **Hintergrund:** Im Modell ist das Doppelhaus ein Gebäude mit zwei Nutzungseinheiten, daher ist die Mittelwand eine Trennwand. Fachlich sind Doppelhaushälften oft zwei Gebäude. Dann wäre die Mittelwand eine Gebäudeabschlusswand nach Art. 28.
- **Entscheidet:**
  - ob das Testgebäude Art. 27 sachgerecht abbildet;
  - wie die Fälle zu Art. 28 gebaut werden (eine spätere Studie zur Wiederverwendung von Auslegungen über Vorschriften hinweg).
- **Schwächen:** Es gibt keinen Fall, der die Antwort auf das Urteil herunterbricht.

### C9: Ist das Obergeschoss ein „Dachraum“ im Sinne von Abs. 4?
- **Zweck:** Divergenz klären. **Typ:** unbestimmter Begriff.
- **Hintergrund:** Abs. 4 erlaubt in Dachräumen, Trennwände nur bis zur Rohdecke zu führen, wenn die Decke feuerhemmend ist. Einige erzeugte Regeln behandelten das oberste Geschoss als Dachraum, andere nicht. Das Testvokabular definiert „Dachraum“ nicht; die Divergenz kann also auch am Testmodell liegen.
- **Entscheidet:** B3, und ob die beobachtete Divergenz als Fehler zählt.
- **Verknüpft:** B3.
- **Schwächen:** Die Antwort hängt an Dachform und -neigung, die das Deck nicht zeigt. „Hängt ab“ ist deshalb wahrscheinlich.
- **Verbesserung:** Schnittskizze mit Dach zeigen, Dachneigung angeben.

### C8: Was sollte eine automatische Prüfung unbedingt abdecken? (Freitext)
- **Zweck:** Abdeckung. Sie geht nicht in die Kappa-Auswertung ein und wird qualitativ ausgewertet.
- **Warum am Ende von Teil 1:** Nach den Grundsatzfragen haben Fachleute das Thema präsent, sind aber noch nicht durch die Fälle festgelegt.
- **Verbesserung:** Die Schlusskarte fragt fast dasselbe. Eine der beiden schärfen, etwa C8 auf „typische Fehler in Bauvorlagen“ und den Schluss auf „was in unseren Fällen fehlt“.

## 5. Fälle zu Art. 27 (Teil 2)

Jeder Fall ändert gegenüber dem Ausgangsgebäude genau ein Anforderungselement. In der Tabelle steht, **welches Element** der Fall berührt, nicht wie er zu beurteilen ist. Minimalpaare unterscheiden sich nur im genannten Punkt.

| Fall | Kurz | Berührtes Element | Hängt ab von | Minimalpaar / Bezug | Anmerkung |
|---|---|---|---|---|---|
| B1 | Gemeinsamer HWR, Tür nicht selbstschließend | Abs. 5, Abschluss von Öffnungen (selbstschließend) | C1 | B11, B16 | Prüft, ob Fachleute (und Regeln) die Tür als Teil der Trennwand prüfen. |
| B2 | GK 2, Wohngebäude, keine Trennwand zwischen den Wohnungen | Abs. 6, Ausnahme Wohngebäude GK 1/2 | – | B18, B12 | Prüft die Ausnahme. |
| B3 | Wohnungstrennwand endet unter der Rohdecke | Abs. 4, Führung bis zur Rohdecke bzw. Dachhaut | C9 | – | Abhängig davon, ob das OG ein Dachraum ist. |
| B4 | „Kellergeschoss“, Schlafräume mit Trennwänden abgetrennt | Abs. 2 Nr. 3, Keller | C2 | B17 | Künstliche Annahme: OG gilt als Keller (das Modell hat keinen). |
| B5 | Ausgangsgebäude ohne Änderung | Basis | (C4) | B19 | Prüft das Ausgangsgebäude als Ganzes. Hängt mittelbar an C4, weil es die Außenwände enthält; **nicht** verknüpft. Verbesserung: verknüpfen oder im Text ausdrücklich „alle Wände“ sagen. |
| B6 | Gemeinsamer HWR ohne Trennwände | Abs. 2 Nr. 1, NE zu anders genutztem Raum | C1 | B11 | |
| B7 | GK 4, Wohnungstrennwand nur feuerhemmend | Abs. 3 Satz 1, Feuerwiderstand wie tragende Bauteile | C3 | B13 | Unterscheidet die Lesarten von C3 nur teilweise (siehe C3). |
| B8 | Trennwand ohne Angabe zum raumabschließenden Feuerwiderstand | Abs. 3 Satz 1; Modellbindung | – | B12 | Prüft den Umgang mit **fehlenden Angaben**: nachfordern oder ablehnen. „Hängt ab“ ist hier legitim; der Hinweis fragt danach. |
| B9 | Raum mit erhöhter Brandgefahr, feuerbeständig abgetrennt | Abs. 3 Satz 2, erhöhte Brandgefahr | – | B15 | |
| B10 | Raum mit Explosionsgefahr ohne Trennwände | Abs. 2 Nr. 2 | – | B9 | |
| B11 | Gemeinsamer HWR, vollständig abgetrennt | Abs. 2 Nr. 1 und Abs. 5 | C1 | B1, B6, B16 | Vollständige Ausführung als Bezug für die drei Abweichungen. |
| B12 | Keine Trennwand zwischen den Wohnungen | Abs. 2 Nr. 1, NE zu NE | – | B2, B18 | Grundfall der Vorschrift. |
| B13 | GK 4, alles hochfeuerhemmend | Abs. 3 Satz 1 | C3 | B7 | |
| B14 | Notwendiger Flur ohne Trennwände | Abs. 2 Nr. 1, Ausnahme notwendige Flure | C5 | – | Künstliche Annahme: Flur keiner Wohnung zugeordnet. Hinweis: nur Art. 27 beurteilen. |
| B15 | Raum mit erhöhter Brandgefahr, nur feuerhemmend abgetrennt | Abs. 3 Satz 2 | – | B9 | |
| B16 | Gemeinsamer HWR, Tür ohne Feuerwiderstand | Abs. 5, Abschluss (feuerhemmend) | C1 | B11, B1 | |
| B17 | „Kellergeschoss“, Schlafräume nicht abgetrennt | Abs. 2 Nr. 3 | C2 | B4 | Künstliche Annahme wie B4. |
| B18 | GK 2, kein Wohngebäude, Trennwand fehlt | Abs. 6, Ausnahme greift nicht | – | B2 | Gegenfall zu B2. |
| B19 | Außenwände, an die beide Wohnungen grenzen | Abgrenzung Art. 26/27 | **C4** | B5 | **Gleicher Modellzustand wie B5, mit Absicht.** Fragt gezielt nur nach den Außenwänden und ist die Fallseite von C4. Der Text beschreibt die Außenwände als „nicht als Trennwände ausgeführt“. Das ist eine Tatsache des Modells (keine Trennwand-Eigenschaften), keine Einordnung. |

**Querschnittliche Schwächen in Teil 2:**
- **Künstliche Annahmen:** Vier Fälle hängen an einem gemeinsam genutzten Hauswirtschaftsraum (B1, B6, B11, B16), zwei an einem „Kellergeschoss“ im OG (B4, B17), einer an einem zugeordnet-losen Flur (B14). Wer die Prämisse ablehnt, antwortet „Hängt ab“. Das ist auswertbar, macht aber diese Fälle schwächer als die übrigen. Verbesserung: ein zweites Testmodell mit echtem Keller und echtem gemeinsamem Raum.
- **Türen:** B1 und B16 prüfen Abs. 5 nur am gemeinsamen Raum. Ein Türfall an der Wohnungstrennwand fehlt.
- **Kein Fall für Abs. 1** (raumabschließend „innerhalb von Geschossen“). Er ist durch B8 nur mittelbar berührt.

## 6. Fälle zu Art. 25 (Teil 3)

Art. 25 verlangt für tragende Wände eine Feuerwiderstandsfähigkeit je nach Gebäudeklasse, für Kellergeschosse gesondert. Die Fälle variieren Gebäudeklasse, Keller und die Klasse einer einzelnen Wand.

| Fall | Gebäudeklasse, Keller | Berührtes Element | Bezug / Anmerkung |
|---|---|---|---|
| A1 | GK 2, mit Keller | Keller, GK 1/2 | Minimalpaar zu A10 |
| A2 | GK 4 | GK 4, alle Wände einheitlich | Bezug für A6, A11 |
| A3 | GK 1, mit Keller | **Anwendbarkeit:** oberirdisch in GK 1 | Eine veröffentlichte Expertenregel stellt in GK 1 eine Anforderung, die andere Lesarten nicht stellen. Der Fall macht diese Entscheidung sichtbar. |
| A4 | GK 3 | GK 2/3, eine Wand ohne Feuerwiderstand | Bezug A7 |
| A5 | GK 5 | GK 5, alle einheitlich | Bezug für A9 |
| A6 | GK 4 | **Quantifizierung:** eine Wand höherwertig als gefordert | Regeln unterscheiden sich darin, ob jede Wand die geforderte Klasse erreichen muss oder alle Wände dieselbe Klasse haben müssen. Dieser Fall trennt die beiden Lesarten. |
| A7 | GK 3 | Ausgangsgebäude | Basis |
| A8 | GK 3, mit Keller | Keller, GK 3–5 | |
| A9 | GK 5 | GK 5, eine Wand niedriger | Minimalpaar zu A5 |
| A10 | GK 2, mit Keller | Keller, GK 1/2 | Minimalpaar zu A1 |
| A11 | GK 4 | GK 4, eine Wand niedriger | Minimalpaar zu A2 |

**Schwächen in Teil 3:**
- Die A-Fälle haben **keine Titel**, die B-Fälle schon. Verbesserung: kurze Titel ergänzen (z. B. „GK 4, eine Wand feuerbeständig“).
- Keine A-Karte ist mit einer Grundsatzfrage verknüpft. Für A3 (Anwendbarkeit GK 1) und A6 (Quantifizierung) könnte eine eigene Grundsatzfrage die Begründung sichtbar machen.
- Aussteifende Wände und Stützen (Art. 25 gilt auch für sie) kommen nicht vor.

## 7. Was die Antworten in der Studie entscheiden

| Antwort | Wirkung in der Studie |
|---|---|
| C4, B19 | Hauptmaß der Studien 1 und 1R (Außenwand-Fehler); vorab festgelegte Umwertung |
| C1, B1/B6/B11/B16 | Erwartungen für den gemeinsamen Raum; Genauigkeit der Regeln |
| C2, B4/B17 | ob die Keller-Divergenz erzeugter Regeln ein Fehler ist |
| C9, B3 | ob die Dachraum-Divergenz ein Fehler ist |
| C3, B7/B13 | ob Regeln die geforderte oder die ausgeführte Klasse lesen müssen |
| C5, B14 | Ausnahme notwendige Flure |
| C6, C7 | Beschreibung und Gültigkeit des Testgebäudes; Aufbau der Art.-28-Fälle |
| A3, A6 | Bewertung der veröffentlichten Expertenregel zu Art. 25 |
| alle Fälle | Übereinstimmung zwischen Fachleuten (Fleiss' Kappa) und mit den Testerwartungen (Cohen's Kappa); umstrittene Entscheidungen |
| Zeit, Änderungen, „Hängt ab“ pro Karte | Hinweise auf unklare Karten für die nächste Deck-Version |

Eine Entscheidung gilt als **strittig**, wenn die Antworten auf ihre Grundsatzfrage oder einen verknüpften Fall auseinandergehen oder jemand „Hängt ab“ wählt. Übereinstimmung heißt geteilte Lesart, nicht Richtigkeit.

## 8. Offene Verbesserungen (Sammelliste)

| Nr. | Was | Wo | Art |
|---|---|---|---|
| 1 | Gebäudeklasse 3 in der Einleitung als Testannahme kennzeichnen | Einleitung | Deck |
| 2 | Optionsreihenfolge pro Einladungscode rotieren | C4 (und alle C) | Engine |
| 3 | „Keiner“ in C2 exklusiv, oder C2 in zwei Schritten | C2 | Engine/Deck |
| 4 | Fall mit höherwertig ausgeführten tragenden Bauteilen ergänzen | C3 | Deck + Testmodell |
| 5 | B5 mit C4 verknüpfen oder „alle Wände“ ausdrücklich machen | B5 | Deck |
| 6 | Titel für A1–A11 | Teil 3 | Deck |
| 7 | Schnitt mit Dachform für C9/B3 | C9, B3 | Figur |
| 8 | C8 und Schlusskarte voneinander abgrenzen | C8, Schluss | Deck |
| 9 | Türfall an der Wohnungstrennwand | Teil 2 | Deck + Testmodell |
| 10 | Testmodell mit echtem Keller und echtem gemeinsamem Raum | B1–B17 | Testmodell |
| 11 | Pflicht-Begründung bei C4 | C4 | Deck |
| 12 | Grundsatzfragen zu Art. 25 (Anwendbarkeit GK 1, Quantifizierung) | Teil 3 | Deck |

Inhaltliche Änderungen erhöhen `version`. Antworten aus verschiedenen Versionen werden getrennt berichtet, wenn sich die geänderte Karte unterscheidet.
