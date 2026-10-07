# KAIROS Font (Projekt HabUndGutFont)

Display-Schrift im Duktus der Wiener Moderne um 1902 (Vorlage: Schriftzug „DIE FLÄCHE“, *Die Fläche* Bd. I S. 97) und eine Werkstatt, die Text zu ineinandergreifenden Schriftzügen setzt.

- Spec: `docs/superpowers/specs/2026-10-06-kairos-font-design.md`
- Plan M1: `docs/superpowers/plans/2026-10-06-kairos-font-m1.md`
- Übrige Versalien (M2, Teil 1): `docs/superpowers/specs/2026-10-07-kairos-versalien.md`
- Spec M2 (Font-Datei, Ziffern, Zeichen, Ligaturen): `docs/superpowers/specs/2026-10-07-kairos-font-m2-design.md`

## Befehle

| Befehl | Wirkung |
|---|---|
| `bun run dev` | App auf http://localhost:3457, Font-Probe auf http://localhost:3457/font (nach `bun run font`) |
| `bun test` | alle Prüfungen |
| `bun run typecheck` | TypeScript prüfen |
| `bun run sheet` | Prüfblätter nach `out/` (PNG, wenn Inkscape installiert ist) |
| `bun run font` | Font bauen und prüfen: `dist/KAIROSFont-Regular.otf` und `.woff2` (braucht uv; beim ersten Mal Netz für die Python-Pakete) |
| `uv run tools/overlay.py` | Referenz-Overlay neu erzeugen, Werte für `presets/die-flaeche.json` ausgeben |

## Aufbau

| Datei | Aufgabe |
|---|---|
| `src/geom.ts` | Striche, Abtastung, Tintenprofile, Abstände |
| `src/style.ts` | Stil „Fläche 1902“ (alle Maße) |
| `src/glyphs.ts` | Buchstaben als Skelette mit Reglern und Andockstellen |
| `src/rules.ts` | Verbindungen a–e, Kollision, Armkürzung |
| `src/engine.ts` | Strahlsuche, Bewertung (`WEIGHTS`), Pins, Zielbreite |
| `src/presets.ts` | Prüfung von Vorlagen und Browser-Speicher |
| `src/render.ts` | Layout → SVG |
| `src/fontdata.ts` | Font-Daten aus der Engine: Glyphen, calt-Varianten, Unterschneidung, Feature-Datei, Sollwerte |
| `src/ui.ts` + `index.html` | Oberfläche |
| `src/fonttest.ts` + `font.html` | Font-Probe: Webfont neben dem Engine-Ergebnis |
| `presets/` | mitgelieferte Vorlagen |
| `tools/` | Prüfblatt (`sheet.ts`), Referenz-Overlay (`overlay.py`), Font-Export (`export-font.ts`), Font-Build (`build_font.py`), Font-Prüfung (`test_font.py`) |

## Font benutzen

- Installieren: `dist/KAIROSFont-Regular.otf` per Doppelklick in die Schriftsammlung. Für eine neue Fassung die alte „KAIROS Font“ dort vorher entfernen, sonst zeigt macOS weiter die alte aus dem Zwischenspeicher.
- Verbindungen (`calt`) und der Schriftzug „HAGEN AAD FOCK“ (`liga`) sind immer an. Zeigt ein Programm keine Verbindungen, die kontextbedingten Varianten in seinen Typografie-Einstellungen einschalten.
- Monogramm HAF: „HAF“ als eigenes Wort mit bedingten Ligaturen (`dlig`, in macOS „Seltene Ligaturen“) oder das Zeichen U+E000.

## Bekannte Grenzen

- Wortabstand: das Leerzeichen ist fest. Die App setzt Wörter nach der Tinte, der Font nach den Glyphenkästen; an offenen Seiten (etwa „AUF ALLE“, „DA VOR“) steht der Font bis zu ~170 Einheiten weiter.
- Verbindungen: der Font entscheidet von links nach rechts, die Engine sucht die beste Lösung; selten weicht das ab (etwa „VARIATIONSKOEFFIZIENT“). Zweimal verschachteln (FF vor manchen Satzzeichen) kann der Font nicht.
