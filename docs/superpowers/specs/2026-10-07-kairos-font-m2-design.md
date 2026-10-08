# KAIROS Font – M2: Font-Datei, Ziffern, Zeichen, Ligaturen

| | |
|---|---|
| Datum | 2026-10-07 |
| Projekt | HabUndGutFont (`~/Projekte/HabUndGutFont`) |
| Grundlage | Spec M1 `2026-10-06-kairos-font-design.md` (§3, §4 M2, §9 Ausblick), Versalien `2026-10-07-kairos-versalien.md` |
| Umfang | M2 ohne die schon fertigen Versalien |
| Status | abgenommen (Hagen, 2026-10-08: Merge nach main freigegeben; live auf font.fock.rocks) |

## 1. Ziel

KAIROS Font gibt es als installierbare Schriftdatei (OTF) und als Webfont (WOFF2). Wer „FLÄCHE“ tippt, bekommt im Browser und in Pages denselben verschränkten Schriftzug wie in der App bei Verschränkung 0,5.

Dazu kommen, in App und Font:

- Ziffern, Satzzeichen und Plakat-Zeichen
- die Namens-Ligatur HAGEN AAD FOCK
- das Monogramm HAF

## 2. Ausgangslage

- main `6eda0e5`: Engine, App, 30 Buchstaben (A–Z, ÄÖÜ, ẞ), 61 Tests.
- Formen und Regeln leben in TypeScript (`src/glyphs.ts`, `src/rules.ts`, `src/engine.ts`). Der Font übernimmt sie, statt sie nachzubauen.
- Die Engine verbindet bei Verschränkung 0,5 paarweise (Stand `6eda0e5`):
  - verschachteln: 28 Paare (F vor allen Buchstaben außer X, Y)
  - unterfahren: 8 Paare (E, L, Q, Z vor A, Ä)
  - Bogen- oder Armende in den Stamm: 44 Paare (C, G, T vor Buchstaben mit Stamm links)
  - In Dreierfolgen F + X + Z unterbleibt das Verschachteln in 108 von 900 Fällen, in 24 kürzt die Engine den oberen F-Arm vor dem dritten Buchstaben.

## 3. Entscheidungen

| Thema | Entscheidung |
|---|---|
| Verschmelzen im Font | wie die App bei Verschränkung 0,5: a Verschachteln, b Unterfahren, c Bogen- oder Armende in den Stamm. Kein Stamm- oder Fuß-Teilen, kein Balken-Verbinden |
| Technik | OpenType `calt` mit Glyphen-Varianten und Unterschneidung (GPOS `kern`), aus der Engine erzeugt; keine Paar-Ligaturen |
| Namens-Ligatur | `liga`, immer an: „HAGEN AAD FOCK“ wird zum ausgearbeiteten Schriftzug aus `presets/hagen-aad-fock.json` |
| Monogramm HAF | `dlig` (bedingte Ligaturen): „HAF“ als ganzes Wort wird zum Monogramm, „HAFEN“ bleibt normal; zusätzlich als eigenes Zeichen auf U+E000 |
| Neue Zeichen | Ziffern 0–9; Satz-Grundset `. , : ; ! ? - – ( ) / & ' ’ " „ “ ‚ ‘ « »`; Plakat-Zeichen `€ % @ # + = * § …`; Leerzeichen und geschütztes Leerzeichen |
| Kleinbuchstaben-Eingabe | a–z und äöü zeigen bis M4 die Versalien (Zeichentabelle des Fonts), ß zeigt ẞ |
| Formate | OTF mit CFF-Konturen, WOFF2 |
| Namen im Font | Familie „KAIROS Font“, Schnitt „Regular“, PostScript `KAIROSFont-Regular`, Version 0.2; Glyphennamen nach Adobe Glyph List |
| Maße | 1000 Einheiten je Geviert, Versalhöhe 700, Ascender 760, Descender −240, Zeilenabstand 0 |
| Konturen | wie der Renderer: Skelett, Strich 26, stumpfe Enden, Gehrung (Grenze 4), Überlappungen vereinigt, Band von der Grundlinie bis zur eigenen Höhe beschnitten |
| Werkzeuge | Bun schreibt Geometrie, Varianten, Abstände und Feature-Datei; ein Python-Skript (uv, Abhängigkeiten im Skript nach PEP 723) baut mit fontTools, ufoLib2, ufo2ft, skia-pathops und brotli; Tests mit uharfbuzz |
| Ausgabe | `dist/KAIROSFont-Regular.otf` und `.woff2`, git-ignoriert, Befehl `bun run font` |
| Abnahme | Browser (Testseite mit WOFF2) und Pages bzw. TextEdit mit installiertem OTF. InDesign entfällt: auf diesem Mac nicht installiert (ändert die Abnahme aus Spec M1 §4) |

## 4. Neue Zeichen

Wie bei den Versalien: Claude konstruiert sie aus dem Formvorrat, Hagen nimmt per Sichtprüfung ab. Alle Zeichen gibt es in App und Font.

### 4.1 Ziffern

Versalziffern in voller Höhe, monoline, Knoten auf den Balkenlinien wie bei den Buchstaben. Startideen:

| Ziffer | Form |
|---|---|
| 0 | schmaler als das O, gleicher Halbkreis oben und unten |
| 1 | Stamm mit kurzer Fahne nach links unten |
| 2 | Kopf wie beim S gespiegelt, Diagonale, Fuß |
| 3 | runder Bauch oben bis zur oberen Linie, Segel unten (wie B ohne Stamm) |
| 4 | Diagonale, Stamm, Querbalken auf der unteren Linie |
| 5 | Arm, Stamm bis zur oberen Linie, darunter Segel wie beim D |
| 6, 9 | Halbkreis-Schleife unten bzw. oben, Schwung zur offenen Seite |
| 7 | Arm und Diagonale |
| 8 | zwei Schleifen, Taille auf der oberen Linie |

### 4.2 Satz- und Plakat-Zeichen

| Zeichen | Startidee |
|---|---|
| `.` `…` | Quadrat (Kantenlänge = Strich) wie die Umlautpunkte, beim Auslassungszeichen drei |
| `,` `;` `„` `‚` | Quadrat mit kurzem schrägem Schwanz; dürfen bis −130 unter die Grundlinie |
| `:` | zwei Quadrate: auf der Grundlinie und auf der unteren Balkenlinie |
| `!` `?` | Stamm bzw. Kopf wie beim S, dazu ein Punkt auf der Grundlinie |
| `-` `–` | waagrechter Strich auf halber Versalhöhe |
| `(` `)` | flache Bögen über die volle Höhe |
| `/` | Diagonale über die volle Höhe |
| `&` | aus E-Armen und S-Schwung |
| `'` `’` `"` `“` `‘` | kurze Striche an der Oberkante |
| `«` `»` | Winkel auf halber Höhe |
| `€` | C-Bogen mit zwei Querstrichen |
| `%` | zwei kleine Ovale und Diagonale |
| `@` | kleines A im O-Oval |
| `#` | zwei Stämme, Querbalken auf beiden Balkenlinien |
| `+` `=` `*` | auf halber Versalhöhe |
| `§` | zwei kleine S übereinander |
| Leerzeichen | so breit, dass die Lichtweite zwischen Wörtern dem Wortabstand der App entspricht (136); geschütztes Leerzeichen gleich breit |

### 4.3 Monogramm HAF

H, A und F teilen sich Striche. Startidee: das A steht im H, sein Querbalken ist der H-Balken; das F hängt am rechten H-Stamm. Volle Versalhöhe, Breite nach Form. Hagen nimmt die Form per Sichtprüfung ab. In der App erscheint es über U+E000.

## 5. Architektur

```
src/glyphs.ts · src/rules.ts · src/engine.ts
        │  tools/export-font.ts (Bun)
        ▼
build/kairos.json   Glyphen als Skelette, Maße, Unterschneidung
build/features.fea  liga, dlig, calt, kern-Ergänzungen
        │  tools/build_font.py (uv run)
        ▼
dist/KAIROSFont-Regular.otf · dist/KAIROSFont-Regular.woff2
```

`bun run font` führt beide Schritte aus. `build/` und `dist/` sind git-ignoriert.

### 5.1 Export (Bun)

- Jede Glyphe mit Startwerten: Mittellinien, Tintenprofil, Vorschub. Linker und rechter Seitenabstand je halber Buchstabenabstand (28) plus Seitenkorrektur (`adjust`).
- **Unterschneidung:** für jedes Paar die Verschiebung, die `spacing()` in der App ergibt, umgerechnet auf Vorschub und Seitenabstände. Werte unter 1 Einheit entfallen.
- **Varianten:** für jedes Paar, das die Engine bei 0,5 verbindet, die neuen Reglerwerte aus `apply()`. Jede Wertekombination wird genau eine Variante.
- **Feature-Datei:** Bun schreibt `features.fea`, damit die Regeln nur in TypeScript leben. Das Python-Skript liest sie nur ein.
- Die JSON-Datei trägt eine Formatversion. Passt sie nicht zum Python-Skript, bricht der Build mit Meldung ab.

### 5.2 Build (Python)

- Je Mittellinie ein skia-pathops-Pfad, gestrichen mit Strich 26, stumpfen Enden und Gehrung (Grenze 4).
- Alle Striche einer Glyphe vereinigt, dann am Band beschnitten:
  - unten an der Grundlinie, oben an der eigenen Höhe
  - Zeichen mit Unterlänge (`,` `;` `„` `‚`) unten erst bei −130
- UFO mit ufoLib2, OTF mit ufo2ft, WOFF2 mit fontTools und brotli.
- Name-Tabelle, Maße und Version laut §3.

### 5.3 Verschmelzen über calt

**Varianten** (Beispiele):

| Rolle | Varianten |
|---|---|
| links verschachtelt | `F.nest` (Mittelarm und oberer Arm verlängert) |
| rechts verschachtelt | `L.short`, `O.short` … (Höhe 0,71), je verschachtelbarem Buchstaben eine |
| links unterfahren | `L.foot`, `E.foot`, `Z.foot`, `Q.foot` |
| rechts unterfahren | `A.lift`, `Adieresis.lift` |
| links Bogenende | `C.term`, `G.term` (unteres Ende bis an den Stamm) |
| Ketten | `L.short.foot`, `E.short.foot`, `C.short.term` … für Buchstaben, die rechts verschachtelt und links verbunden sind |
| gekürzter Arm | `F.nest.t<n>`: oberer Arm wie in der Engine vor dem übernächsten Buchstaben gekürzt, auf 5 Einheiten abgerundet (nie länger als in der Engine) |

Das T braucht keine Variante: Sein Arm endet schon dort, wo der Nachbarstamm hinkommt. Die Unterschneidung setzt den Nachbarn an diese Stelle.

**Reihenfolge der Lookups:**

1. `liga` Namens-Ligatur
2. `dlig` Monogramm
3. `calt`, in dieser Folge:
   1. verschachteln links
   2. verschachteln rechts
   3. unterfahren links
   4. unterfahren rechts
   5. Bogenende
   6. Armkürzung

**Regeln:**

- Ein Paar wird verbunden, wenn die Engine es bei 0,5 einzeln verbinden würde.
- Für F + X wird zusätzlich der übernächste Buchstabe geprüft. Verschachtelt die Engine dort nicht, gilt eine Ausnahme-Regel. Kürzt sie den Arm, gilt eine Kontextregel mit `F.nest.t<n>`.
- Der Font arbeitet gierig von links nach rechts und kennt keine Varianten-Suche. Abweichungen von der besten App-Variante sind erlaubt. Der Wortlisten-Test in §7 hält sie fest.

**Unterschneidung für Varianten:**

- an der verbundenen Seite der Wert aus `apply()`
- an der freien Seite der Wert aus `spacing()` gegen alle Grundglyphen

### 5.4 Namens-Ligatur und Monogramm

- **Namens-Ligatur:**
  - Glyphe `H_A_G_E_N_space_A_A_D_space_F_O_C_K`
  - Form: Engine-Layout der Vorlage `hagen-aad-fock.json` mit ihren Pins, über dieselbe Kontur-Strecke
  - Auslöser: nur die ganze Folge als eigenständige Wortgruppe, Kleinbuchstaben eingeschlossen
- **Monogramm:**
  - Glyphe `H_A_F`, Zeichen U+E000
  - Auslöser: `dlig`, nur wenn vor H und nach F kein Buchstabe steht

### 5.5 App

- Ziffern, Zeichen und Monogramm stehen in `src/glyphs.ts`, ohne Andockstellen; die Abstände kommen aus den Profilen.
- Der Renderer schneidet Zeichen mit Unterlänge nicht an der Grundlinie ab. Der Export-Rahmen schließt Unterlängen ein.
- **Testseite `font.html`** im Dev-Server:
  - Eingabefeld
  - der Text in der Webfont, calt an, dlig per Schalter
  - darunter das Engine-Ergebnis bei 0,5
- Prüfblatt `bun run sheet` zeigt zusätzlich Ziffern und Zeichen.

## 6. Fehlerfälle

| Fall | Verhalten |
|---|---|
| Python-Pakete fehlen, kein Netz | uv meldet den Fehler, der Build bricht ab |
| Formatversion von JSON und Skript passt nicht | Abbruch mit Meldung „Export neu erzeugen“ |
| Glyphe ohne Kontur oder mit offener Kontur | Abbruch, Meldung nennt die Glyphe |
| Feature-Datei kompiliert nicht | Abbruch mit der Meldung von fontTools |
| Zeichen ohne Glyphe im Font | Test schlägt fehl, Liste der fehlenden Zeichen |

## 7. Tests und Abnahme M2

**Automatisch** (`bun test` und `uv run tools/test_font.py`):

1. **Export:**
   - Jedes Zeichen aus §3 hat eine Glyphe.
   - Die calt-Tabelle stimmt mit `joinsFor()` und `apply()` der Engine überein.
2. **Font:**
   - Die Zeichentabelle deckt §3 ab, Kleinbuchstaben eingeschlossen.
   - Jede Kontur ist geschlossen, nichts überlappt.
   - Die Konturen bleiben im Band, Unterlängen wie in §5.2.
3. **Formung mit uharfbuzz, Wortliste mit Sollwerten:**
   - „FLÄCHE“ ergibt `F.nest.t40 L.short.foot Adieresis.lift C.term H E` (oberer F-Arm vor dem Ä-Punkt gekürzt wie in der Engine: 40,64 → 40), Positionen auf ±1 Einheit wie die Engine.
   - „fläche“ ergibt dasselbe wie „FLÄCHE“.
   - „HAGEN AAD FOCK“ ergibt die Namens-Ligatur.
   - „HAF“ ergibt mit dlig das Monogramm, ohne dlig H A F; „HAFEN“ mit dlig bleibt normal.
   - „DIE FLÄCHE“, „WIENER WERKSTÄTTE“, „THEATER“, „ZAUBER“: Verbindungen wie die gierige Engine.
4. **Bildvergleich:** Font-Rendering gegen App-Rendering derselben Wörter. Abweichung höchstens 1 % der Tintenpixel.

**Sichtprüfung durch Claude:** Prüfblatt der neuen Zeichen, Screenshot der Testseite.

**Abnahme durch Hagen:**

- Ziffern, Zeichen und Monogramm per Sichtprüfung
- Testseite im Browser: „FLÄCHE“ und „HAGEN AAD FOCK“ erscheinen verschmolzen
- Pages: OTF in der Schriftsammlung installiert, „FLÄCHE“ getippt erscheint verschmolzen

## 8. Aus M1 mitnehmen

Aufgeschobene Punkte, die in M2 erledigt werden:

| Punkt | Lösung |
|---|---|
| Bei einem verworfenen oberen Arm liest die Engine den Pin des vorletzten Buchstabens roh (`prevTop`): falscher Hinweis, ein Verbindungs-Pin geht verloren | derselbe Schutz wie beim linken Buchstaben |
| Das Clip-Band (±100 000) schneidet Zeilen über ~440 Zeichen ab | Band ±10 000 000 |
| Gepinnte Verbindungen sind in der Vorschau nicht markiert (Spec M1 5.6) | Marke an der Grenze, wie bei Buchstaben-Pins |
| Ziehen an Griffen rechnet bei jeder Mausbewegung neu und ruckelt mit Zielbreite | höchstens einmal je Bildschirmbild (`requestAnimationFrame`) |
| Der Zielbreiten-Regler endet bei 8000 | Höchstwert wächst mit der Zeile |
| „Balken nach rechts verbinden“ bleibt anklickbar, wenn der Nachbar keinen passenden Balken hat | nur anklickbar, wenn die Verbindung möglich ist |

Bleibt offen bis M3 (Rechteck, Mehrzeiligkeit): Regel e nutzt einen gemeinsamen Schritt für alle Breiten, ein enges Paar bremst die ganze Zeile.

## 9. Nicht in M2

- Kleinbuchstaben (M4)
- Rechteck, Mehrzeiligkeit, Name als Block (M3)
- Stilsets, „wildes“ Verschmelzen mit Stamm- und Fuß-Teilen, Varianten-Knoten, variabler Font (M5)
- Hinting, Test unter Windows, InDesign-Test, Veröffentlichung

## 10. Risiken

| Risiko | Umgang |
|---|---|
| Der gierige Font weicht von der Varianten-Suche der App ab | Wortliste mit Sollwerten; Abweichungen in der Testausgabe |
| Pages wendet `calt` nicht von selbst an | Typografie-Fenster in TextEdit; der Browser bleibt zweite Abnahme |
| Gehrungsspitzen und Beschnitt in skia-pathops weichen vom SVG ab | Bildvergleich Font gegen App (§7.4) |
| macOS hält eine alte Fontversion im Zwischenspeicher | Version je Build hochzählen, Hinweis zum Neuinstallieren in Font Book |
| Erster Build braucht Netz für die Python-Pakete | einmal installieren, danach aus dem uv-Zwischenspeicher |
| Viele Kontextregeln für F + X + Z | Regeln werden erzeugt, nicht geschrieben; Test zählt sie |
