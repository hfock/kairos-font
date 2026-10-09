# Neustift – M4: Kleinbuchstaben

| | |
|---|---|
| Datum | 2026-10-09 |
| Projekt | HabUndGutFont (`~/Projekte/HabUndGutFont`), Schrift „Neustift“ (bis 2026-10-08 „KAIROS Font“) |
| Grundlage | Spec M1 `2026-10-06-kairos-font-design.md` (§3 Kleinbuchstaben-Eingabe, §4 M4), Spec M2 `2026-10-07-kairos-font-m2-design.md` |
| Umfang | a–z, ä ö ü, ß in App und Font, mit Verschränkung |
| Status | freigegeben (Hagen, 2026-10-09) |

## 1. Ziel

Neustift bekommt echte Kleinbuchstaben. Wer „Die Fläche“ oder „Hagen“ tippt, bekommt in der App, im Browser und in Pages Groß- und Kleinbuchstaben im selben Duktus. Auch die Kleinbuchstaben greifen ineinander: Das a schiebt sich unter den T-Arm, f und t teilen ihren Querstrich, der Schwanz des g greift unter den Nachbarn.

## 2. Ausgangslage

- main `f414d82`: 30 Versalien, Ziffern, Satz- und Plakatzeichen, Monogramm; 79 Tests; Font mit 166 Glyphen, 9087 Sollwerte grün; live auf font.fock.rocks.
- Kleinbuchstaben-Eingabe zeigt bis heute die Versalien (Engine `toUpperCase`, Font-Zeichentabelle).
- Der Abstand richtet sich nach der Tinte in jeder Höhe (`gapOffset`). Ein Kleinbuchstabe rückt deshalb schon von selbst unter einen Versal-Arm, wo in seiner Höhe Platz ist.
- Beim Verschachteln setzt die Engine eine neue Höhe nur, wenn der Buchstabe einen Höhenregler hat (`rules.ts`, Satzzeichen-Schutz aus M2). Kleinbuchstaben ohne Höhenregler behalten deshalb ihre Form.
- Der Font-Export hält alle Layouts im Speicher (bis ~2,3 GB Spitze, geparkt in M2). Bei doppelt so vielen Zeichen wird das zu viel.

## 3. Entscheidungen

Von Hagen am 2026-10-09 an Wegwerf-Prototypen gewählt; die Bilder liegen unter `m4/`.

| Thema | Entscheidung |
|---|---|
| x-Höhe | **300** (klein, Jugendstil); Oberlängen enden bündig auf der Versalhöhe 700 (`m4/x-hoehe.png`, Variante C) |
| Unterlänge | **−130**, so tief wie das Komma (`m4/unterlaengen.png`, Variante 1) |
| Bogenform | **rund**: Bögen als Halbkreise wie beim O, U, J (`m4/bogenform.png`, Variante A) |
| a | **einstöckig**: runder Bauch mit Stamm, wie das g (`m4/a-form.png`, Variante A) |
| Verschränkung | **vollständig** (Stufe 3): Versal über klein und klein mit klein (`m4/verschraenkung.png`, Zeile 3) |
| Namenszug, Monogramm | nur **Versalien** lösen aus: „HAGEN AAD FOCK“ → Schriftzug, „HAF“ (dlig) → Monogramm; „Hagen Aad Fock“ bleibt normaler Text |
| Vorgehen | eine Spec, zwei Stufen: 1 Buchstaben, 2 Verschränkung; Sichtprüfung durch Hagen nach jeder Stufe |
| Strich | wie die Versalien: Monoline, Strich 26, stumpfe Enden, Gehrung |
| Font-Maße | unverändert (Ascender 760, Descender −240, Zeilenabstand 0); −130 liegt innerhalb |
| Version | 0.3 |

## 4. Stufe 1: Buchstaben

### 4.1 Maße

- Neuer Stilwert `xHeight: 300` neben `barHigh` und `barLow`.
- Oberlänge = Versalhöhe 700; das t endet bei etwa 470.
- Unterlänge −130 über den vorhandenen Mechanismus `desc` (Renderer-Band wie beim Komma).
- Punkte (i, j, ä, ö, ü): Quadrate mit Kantenlänge = Strich, Mitte 90 über der x-Höhe; bei den Umlauten im Buchstabenfeld wie beim Ä.
- Jeder Kleinbuchstabe hat einen Breitenregler wie die Versalien, aber **keinen Höhenregler**. Beim Verschachteln behält er seine Form.

### 4.2 Formen (Startentwurf, Feinform bei der Sichtprüfung)

| Zeichen | Bau |
|---|---|
| a | runder Bauch (Halbkreise oben und unten), Stamm rechts von der Grundlinie bis zur x-Höhe |
| b | Stamm bis 700, runder Bauch rechts |
| c | runder Bogen, rechts offen; oberes Ende waagrecht (dockt beim „ch“ an) |
| d | runder Bauch, Stamm rechts bis 700 |
| e | runder Bogen mit Querstrich knapp über der halben x-Höhe, rechts unten offen |
| f | Stamm, oben Haken nach rechts bis 700, Querstrich auf x-Höhe |
| g | wie a, rechter Stamm bis −130, Schwanz nach links |
| h | Stamm bis 700, Bogen wie n |
| i | Stamm bis x-Höhe, Punkt |
| j | Stamm bis −130 mit Schwanz nach links, Punkt |
| k | Stamm bis 700, Arm und Bein treffen sich auf halber x-Höhe (Vorbild prüfen) |
| l | Stamm bis 700 |
| m | Stamm, zwei Bögen |
| n | Stamm, Bogen, Stamm |
| o | runder Bauch wie O, Seitenkorrektur wie O (−10) |
| p | Stamm bis −130, runder Bauch rechts |
| q | runder Bauch, Stamm rechts bis −130 |
| r | Stamm, kurzer Bogenansatz oben rechts |
| s | oberer und unterer Bogen mit Schwung, vom S abgeleitet |
| t | Stamm bis ~470, Querstrich auf x-Höhe |
| u | Stamm, Bogen unten wie U, rechter Stamm bis zur Grundlinie |
| v | wie V, flache Spitze |
| w | wie W |
| x | Kreuzung auf halber x-Höhe |
| y | wie v, rechter Arm bis −130 (Vorbild prüfen) |
| z | Arm, Diagonale, Fuß wie Z |
| ä ö ü | a o u mit Punkten |
| ß | Stamm bis 700, oberer Bogen, unteres Segel wie ẞ (Vorbild prüfen) |

### 4.3 Vorbilder

Für k, s, y, z und ß ein Vorlagenblatt aus Rudolf von Larisch, „Beispiele künstlerischer Schrift“ (1900, gemeinfrei; Digitalisat UB Heidelberg, *Deutsche Kunst und Dekoration* 7, 1900/01). Das Blatt dient der Sichtprüfung, es wird nicht nachgezeichnet.

### 4.4 Verhalten

- App: Kleinbuchstaben bleiben klein; ß wird ß (eigene Glyphe), ẞ bleibt der Versal.
- Andere Zeichen (é, ñ …) bleiben Platzhalter mit Hinweis.
- Mitgelieferte Vorlagen (`DIE FLÄCHE`, `HAGEN AAD FOCK`) sind in Versalien und ändern sich nicht.
- Font: Codepunkte a–z, äöü, ß zeigen die neuen Glyphen.
- `liga` (Namenszug) und `dlig` (Monogramm) nur noch für die Versalien-Folge.

### 4.5 Speicher des Exports

Vor den neuen Zeichen: Der Export speichert je Layout nur noch Zeichen, Regler und Position (oder leert den Zwischenspeicher nach Gebrauch). Ziel: Spitze unter 1 GB, Export unter 10 s, Ergebnis byte-gleich zu vorher.

## 5. Stufe 2: Verschränkung

| Verbindung | Beispiele | Technik |
|---|---|---|
| Versal-Arm über klein | „Fa“, „Ta“, „Pa“, „Ya“, „Va“ | kommt aus dem Tintenabstand; beim F verlängert sich der Mittelarm über den Kleinbuchstaben (wie „FL“) |
| Bogenende in den Stamm | „ch“, „ck“ („ich“, „Fläche“) | wie „CH“: oberes Ende des c mündet in den Stamm des Nachbarn |
| Querstrich teilen | „ft“, „tt“, „ff“ („Stift“, „Mitte“, „Kaffee“) | neu: Querstriche von f und t auf x-Höhe laufen zu einem Strich zusammen |
| Unterlänge unter den Nachbarn | „ag“, „ig“, „ey“ („Hagen“, „Tag“) | neu, Unterfahren nach links: der Schwanz von g, j, y verlängert sich unter den vorigen Buchstaben |
| f-Haken kürzen | „fl“, „fh“ („Pflicht“) | wie der gekürzte F-Arm: der Haken endet vor der Oberlänge des Nachbarn |

- Querstrich teilen und Unterlänge kosten wie Verschachteln (`WEIGHTS` 0,2): sie greifen bei Verschränkung 0,5 von selbst und kommen in den Font.
- Stämme teilen (etwa „nn“) wie bei den Versalien nur in der App bei höherer Verschränkung, nicht im Font.
- Jede Verbindung lässt sich je Grenze anpinnen oder abwählen (bestehende Pins und Verbindungs-Menü).

## 6. Font und Export

- Kleinbuchstaben als eigene Grundglyphen mit eigenen Codepunkten, Glyphennamen nach Adobe Glyph List (`a` … `z`, `adieresis`, `germandbls`).
- `calt`: bestehende Lookups gelten auch für Kleinbuchstaben; neue Lookups für Querstrich teilen, Unterlänge nach links und f-Haken kürzen, erzeugt aus der Engine wie in M2.
- Unterschneidung wie in M2 aus der Engine, jetzt für alle Paare samt Kleinbuchstaben.
- Sollwerte: alle Zeichenpaare und F-Dreierfolgen (wie M2) samt Kleinbuchstaben; feste Sollwörter dazu: „Tafel“, „Stift“, „Hagen“, „ich“, „Die Fläche“, „Pflicht“, „Kaffee“.
- Ausrollen: `bun run web`, dann `stacks/neustift` auf cfv-prod (README dort); Karte auf fock.rocks ergänzen.

## 7. Tests und Abnahme

**Automatisch** (`bun test`, `bun run font`):

- Jeder Kleinbuchstabe: Tinte im Feld zwischen −130 und 700, x-Höhe 300 bei den Buchstaben ohne Ober- und Unterlänge, Punkte mit Mindestabstand (`armGap`) zur Tinte, Andockstellen vorhanden.
- Eingabe: „Neustift“ ergibt N + Kleinbuchstaben, „ß“ ergibt ß, „ẞ“ bleibt ẞ.
- Engine (Stufe 2): „Stift“ verbindet f und t über den Querstrich, „ich“ verbindet c und h, „Hagen“ verlängert den g-Schwanz unter das a, „Tafel“ setzt das a unter den T-Arm.
- Font: alle Sollwerte mit harfbuzz gegen die Engine; „Hagen Aad Fock“ ergibt keinen Namenszug, „HAGEN AAD FOCK“ schon.
- Export-Speicher: Spitze unter 1 GB (gemessen mit `/usr/bin/time -l`).

**Sichtprüfung durch Hagen:**

- nach Stufe 1: Prüfblatt `out/glyphen-klein.png` und Wörter in der App; Änderungen je Buchstabe in einer Anpassungsrunde
- nach Stufe 2: Testseite (`/font`) mit „Tafel Stift Hagen“ und „Die Fläche“, dann Pages mit installiertem OTF

## 8. Nicht in M4

- Kleinbuchstaben-Varianten (zweistöckiges a als Stilsatz) — M5
- Stapeln und Einschreiben kleiner Versalien (Techniken f, g) — eigene Spec
- Mehrzeiligkeit (M3)
- Akzente außer äöü (é, ñ …)

## 9. Risiken

| Risiko | Abhilfe |
|---|---|
| Doppelt so viele Zeichen sprengen Export-Zeit und Speicher | §4.5 zuerst; Messung als Test |
| Neue Verbindungen kollidieren mit Punkten (i, j, ä) | Kollisionsprüfung der Engine wie bei den Ä-Punkten; Tests für „fi“, „ti“, „fä“ |
| Kleine x-Höhe macht Oberlängen-Paare eng („ll“, „fl“) | f-Haken kürzen; Sichtprüfung nach Stufe 1 |
| calt im Font wird gierig, die Engine sucht | wie in M2 bekannt; Sollwerte zeigen die Abweichungen |
