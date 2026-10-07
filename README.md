# KAIROS Font (Projekt HabUndGutFont)

Display-Schrift im Duktus der Wiener Moderne um 1902 (Vorlage: Schriftzug „DIE FLÄCHE“, *Die Fläche* Bd. I S. 97) und eine Werkstatt, die Text zu ineinandergreifenden Schriftzügen setzt.

- Spec: `docs/superpowers/specs/2026-10-06-kairos-font-design.md`
- Plan M1: `docs/superpowers/plans/2026-10-06-kairos-font-m1.md`
- Übrige Versalien (M2, Teil 1): `docs/superpowers/specs/2026-10-07-kairos-versalien.md`

## Befehle

| Befehl | Wirkung |
|---|---|
| `bun run dev` | App auf http://localhost:3457 |
| `bun test` | alle Prüfungen |
| `bun run typecheck` | TypeScript prüfen |
| `bun run sheet` | Prüfblätter nach `out/` (PNG, wenn Inkscape installiert ist) |
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
| `src/ui.ts` + `index.html` | Oberfläche |
| `presets/` | mitgelieferte Vorlagen |
| `tools/` | Prüfblatt (`sheet.ts`), Referenz-Overlay (`overlay.py`) |
