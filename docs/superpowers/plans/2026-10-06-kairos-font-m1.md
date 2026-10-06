# KAIROS Font – Umsetzungsplan Meilenstein 1

> **Für ausführende Agenten:** PFLICHT-SKILL: superpowers:subagent-driven-development (empfohlen) oder superpowers:executing-plans, um diesen Plan Aufgabe für Aufgabe umzusetzen. Schritte nutzen Checkboxen (`- [ ]`) zum Abhaken.

**Ziel:** Lokale Web-App, die Text im Duktus „Die Fläche“ (Wien um 1902) setzt und Buchstaben automatisch verschachtelt, unterfährt und verbindet – mit Varianten, Handarbeit je Buchstabe und Export als SVG/PNG.

**Architektur:** Jeder Buchstabe ist ein Skelett aus Mittellinien, berechnet aus Reglern. Verbindungsregeln a–e verbinden Nachbarpaare über Andockstellen. Eine Strahlsuche je Wort liefert die besten Varianten, ein Renderer macht daraus SVG, eine Seite ohne Framework bedient alles. Reine Logik (`geom`, `glyphs`, `rules`, `engine`, `render`) ist mit `bun test` abgesichert, die Oberfläche wird im Browser-Fenster geprüft.

**Tech-Stack:** TypeScript ohne Framework; Bun 1.3 als Dev-Server, Bundler und Testrunner; SVG; Python über `uv` nur für das einmalige Overlay-Werkzeug.

**Spec:** `docs/superpowers/specs/2026-10-06-kairos-font-design.md`

**Geprüft:** Der gesamte Code in diesem Plan lief vorab in einem Wegwerf-Prototyp: 37 Tests grün, `tsc` ohne Fehler, Oberfläche im Browser bedient (Auswahl, Griffe, Verbindungs-Menü, Rückgängig, Vorlagen, Overlay). Code also wörtlich übernehmen; Abweichungen nur, wenn ein Schritt scheitert.

## Global Constraints

- Projektordner `~/Projekte/HabUndGutFont` (Git-Repo, Branch `main`, existiert bereits mit Spec und `reference/`). Schrift heißt „KAIROS Font“. GitHub nur auf Wunsch.
- Einheiten: 1000 pro Geviert, Versalhöhe 700, Grundlinie y = 0, y wächst nach oben.
- Keine Laufzeit-Abhängigkeiten. Bun 1.3: `bun --port=3457 ./index.html` (Dev-Server), `bun test`, Typprüfung `bunx tsc --noEmit -p .`.
- M1-Zeichen: A C D E F G H I K L N O Ä. Eingabe wird in Versalien umgewandelt, alles andere wird Platzhalter mit Hinweis.
- Techniken a Verschachteln, b Unterfahren, c Strich teilen, d Balken verbinden, e Breite. Varianten k = 6. Gleiche Eingabe → gleiche Rangliste.
- Oberfläche Deutsch, Desktop-Browser, lokal, ein Nutzer. Export SVG (Striche) und PNG; keine Kontur-Vereinigung.
- Hinweistexte wörtlich: `Zeichen „X“ noch nicht entworfen` · `Zielbreite nicht erreichbar – nächstbeste Breite gezeigt` · `Pin bei „XY“ nicht erfüllbar` · `Vorlage ungültig – ignoriert`.
- Nicht in M1: Kleinbuchstaben, Ziffern, Satzzeichen, Font-Datei, Mehrzeiligkeit, Stapeln/Einschreiben/Überkreuzen, Stil-Varianten, Hosting.
- Commits enden mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Bewusste Abweichungen von der Spec

Am Foto nachgemessen bzw. im Prototyp geklärt; die Spec nannte hier Startwerte oder Skizzen.

| Spec | Plan | Grund |
|---|---|---|
| Strich 24 | 26 | Foto: 19,5 px ≈ 27 Einheiten |
| Mindestabstand ≈ 30 (hart) | hart `armGap` 20; beim Verschachteln/Unterfahren `clearance` 36 | Foto: F-Arm → Ä-Punkt 19, C-Balken → H-Stamm 21; L unter F 37, A-Bein über L-Fuß 39 |
| `skeleton()` liefert SVG-Text, `advance()` | `draw()` liefert Strich-Objekte; Abstände über Tintenprofile; Glyphen-Methoden `cover/reach/close/lift/trimTop` | kein Pfad-Parser, keine Vorschub-Tabellen |
| Suche als dynamische Programmierung | Strahlsuche (32 Pfade) je Wort | prüft auch den übernächsten Buchstaben (F-Arm ↔ Ä-Punkt); liefert dieselbe k-beste Liste |
| Balkenlinie je Buchstabe durch die Suche | Balkenlinie per Griff/Pin; Suche entscheidet nur „Balken verbinden“ | weniger Zustände, Vorlage braucht es nicht |
| Entzerren über vier Blattecken | Drehung um 0,315° | Foto ist frontal: Stämme auf 1 px senkrecht |
| Overlay `{src, x, y, scale}` | `{src, x, y, w, h}`, Vorlagen optional mit `styleValues` | direkt SVG-Maße; Feinheiten-Regler bleiben in Vorlagen erhalten |
| – | Regler „Wortabstand“ unter Feinheiten | Name aus drei Wörtern braucht ihn |

## Dateistruktur

| Datei | Aufgabe | Aufgabe Nr. |
|---|---|---|
| `package.json`, `tsconfig.json`, `.gitignore` | Skripte, Typprüfung (nur `src/`), Ignorierliste | 1 |
| `src/geom.ts` | Striche (`L`, `C`, `stroke`), Abtastung, Tintenpunkte, Profile, Abstände, Pfaddaten | 1 |
| `src/style.ts` | Stil „Fläche 1902“: alle Maße an einer Stelle | 2 |
| `src/glyphs.ts` | 13 Buchstaben + Platzhalter: Regler, Skelett, Andockstellen | 2 |
| `src/rules.ts` | Instanzen, Abstand, Verbindungen a–d, Kollision, Armkürzung, Balkenstück | 3 |
| `src/engine.ts` | Wörter, Strahlsuche, Bewertung (`WEIGHTS`), Pins, Zielbreite (e), Varianten | 4 |
| `src/render.ts` | Layout → SVG (Vorschau mit Klickflächen; Export ohne) | 5 |
| `tools/sheet.ts` | Prüfblätter nach `out/` | 5 |
| `tools/overlay.py` | Referenzfoto drehen, Overlay-Maße ausgeben | 6 |
| `presets/*.json`, `src/assets.d.ts` | mitgelieferte Vorlagen; Typ für Bild-Import | 6 |
| `index.html`, `src/ui.ts`, `.claude/launch.json` | Oberfläche, Start im Browser-Fenster | 7 |
| `README.md` | Befehle und Aufbau | 8 |
| `test/*.test.ts` | Prüfungen je Modul | 1–6 |

---

### Aufgabe 1: Projektgerüst und Geometrie

**Dateien:**
- Neu: `package.json`, `tsconfig.json`, `.gitignore`, `src/geom.ts`
- Test: `test/geom.test.ts`

**Schnittstellen:**
- Verwendet: –
- Liefert: Typen `Pt`, `Seg`, `Stroke`, `Profile`; Konstante `BIN = 10`; Funktionen `L(x, y)`, `C(x1, y1, x2, y2, x, y)`, `stroke(x, y, ...segs)`, `closed(s)`, `shift(s, dx)`, `sample(s, step = 5): Pt[]`, `inkPoints(s, half, step = 5): Pt[]`, `pathData(s): string`, `profile(ink, height): Profile`, `mergeProfiles(parts: {prof, x}[]): Profile`, `gapOffset(l, r, gap, minY = 0): number`, `minDist(a, ax, b, bx, limit): number`.

- [ ] **Schritt 1: Gerüst anlegen**

Im Projektordner `~/Projekte/HabUndGutFont`:

`package.json`
```json
{
  "name": "habundgutfont",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun --port=3457 ./index.html",
    "test": "bun test",
    "typecheck": "bunx tsc --noEmit -p .",
    "sheet": "bun tools/sheet.ts"
  }
}
```

`tsconfig.json` (prüft nur `src/`; Tests und Werkzeuge nutzen Bun-eigene Module)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

`.gitignore`
```
node_modules/
out/
.DS_Store
```

- [ ] **Schritt 2: Fehlschlagenden Test schreiben** – `test/geom.test.ts`

```ts
import { expect, test } from "bun:test";
import { C, L, closed, gapOffset, inkPoints, mergeProfiles, minDist, pathData, profile, sample, shift, stroke } from "../src/geom";

test("sample: gerade Linie in gleichen Schritten, Endpunkte exakt", () => {
  const pts = sample(stroke(0, 0, L(0, 100)), 5);
  expect(pts.length).toBe(21);
  expect(pts[0]).toEqual({ x: 0, y: 0 });
  expect(pts[20]).toEqual({ x: 0, y: 100 });
});

test("sample: Bogen trifft Endpunkt, geschlossener Pfad kehrt zum Start zurück", () => {
  const pts = sample(stroke(0, 0, C(0, 50, 50, 100, 100, 100)));
  expect(pts.at(-1)!.x).toBeCloseTo(100);
  expect(pts.at(-1)!.y).toBeCloseTo(100);
  const sq = sample(closed(stroke(0, 0, L(10, 0), L(10, 10), L(0, 10))));
  expect(sq.at(-1)).toEqual({ x: 0, y: 0 });
});

test("inkPoints: senkrechter Strich ist 2·half breit, stumpfes Ende ragt nicht über", () => {
  const ink = inkPoints(stroke(0, 0, L(0, 100)), 13);
  expect(Math.min(...ink.map((p) => p.x))).toBeCloseTo(-13);
  expect(Math.max(...ink.map((p) => p.x))).toBeCloseTo(13);
  expect(Math.max(...ink.map((p) => p.y))).toBeCloseTo(100);
});

test("profile + gapOffset: zwei Stämme stehen mit genau gap Lichtweite", () => {
  const a = profile(inkPoints(stroke(0, 0, L(0, 700)), 13), 700);
  expect(a.left[5]).toBeCloseTo(-13);
  expect(a.right[5]).toBeCloseTo(13);
  expect(gapOffset(a, a, 56)).toBeCloseTo(56 + 26);
});

test("gapOffset: minY blendet untere Streifen aus", () => {
  const foot = profile(inkPoints(stroke(0, 13, L(300, 13)), 13), 700); // nur unten Tinte
  const stem = profile(inkPoints(stroke(0, 0, L(0, 700)), 13), 700);
  expect(gapOffset(foot, stem, 50, 100)).toBeCloseTo(50 - (-13 - 300)); // keine gemeinsamen Streifen → Rahmen
  expect(gapOffset(foot, stem, 50)).toBeCloseTo(50 + 300 + 13);
});

test("mergeProfiles verschiebt Teile korrekt", () => {
  const a = profile(inkPoints(stroke(0, 0, L(0, 700)), 13), 700);
  const m = mergeProfiles([{ prof: a, x: 0 }, { prof: a, x: 100 }]);
  expect(m.left[3]).toBeCloseTo(-13);
  expect(m.right[3]).toBeCloseTo(113);
  expect(m.maxX).toBeCloseTo(113);
});

test("minDist: findet Lichtweite bis limit, sonst Infinity", () => {
  const a = inkPoints(stroke(0, 0, L(0, 700)), 13);
  expect(minDist(a, 0, a, 40, 20)).toBeCloseTo(14, 0);
  expect(minDist(a, 0, a, 100, 20)).toBe(Infinity);
});

test("pathData + shift", () => {
  const s = stroke(0, 0, L(0, 100), C(0, 150, 50.04, 200, 100, 200));
  expect(pathData(s)).toBe("M0 0L0 100C0 150 50 200 100 200");
  expect(pathData(closed(shift(s, 10)))).toBe("M10 0L10 100C10 150 60 200 110 200Z");
});
```

- [ ] **Schritt 3: Test laufen lassen, er muss scheitern**

Befehl: `bun test test/geom.test.ts`
Erwartet: FAIL, `Cannot find module '../src/geom'`.

- [ ] **Schritt 4: Umsetzen** – `src/geom.ts`

Wichtig: `inkPoints` erzeugt je Mittellinienpunkt einen Querschnitt (±half senkrecht zur Laufrichtung). So ragen stumpfe Strichenden nicht über – Abstände an Armenden und Umlaut-Quadraten stimmen.

```ts
export type Pt = { x: number; y: number };
export type Seg = { k: "L"; p: Pt } | { k: "C"; c1: Pt; c2: Pt; p: Pt };
export type Stroke = { start: Pt; segs: Seg[]; closed?: boolean };
/** Je Höhenstreifen (BIN Einheiten) linkester und rechtester Tintenrand; NaN = keine Tinte. */
export type Profile = { left: Float64Array; right: Float64Array; minX: number; maxX: number };

export const BIN = 10;

export const L = (x: number, y: number): Seg => ({ k: "L", p: { x, y } });
export const C = (x1: number, y1: number, x2: number, y2: number, x: number, y: number): Seg => ({
  k: "C",
  c1: { x: x1, y: y1 },
  c2: { x: x2, y: y2 },
  p: { x, y },
});
export const stroke = (x: number, y: number, ...segs: Seg[]): Stroke => ({ start: { x, y }, segs });
export const closed = (s: Stroke): Stroke => ({ ...s, closed: true });

const mv = (p: Pt, dx: number): Pt => ({ x: p.x + dx, y: p.y });
export const shift = (s: Stroke, dx: number): Stroke => ({
  ...s,
  start: mv(s.start, dx),
  segs: s.segs.map((g): Seg => (g.k === "L" ? { k: "L", p: mv(g.p, dx) } : { k: "C", c1: mv(g.c1, dx), c2: mv(g.c2, dx), p: mv(g.p, dx) })),
});

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
function at(a: Pt, g: Seg, t: number): Pt {
  if (g.k === "L") return { x: a.x + (g.p.x - a.x) * t, y: a.y + (g.p.y - a.y) * t };
  const u = 1 - t, k0 = u * u * u, k1 = 3 * u * u * t, k2 = 3 * u * t * t, k3 = t * t * t;
  return { x: k0 * a.x + k1 * g.c1.x + k2 * g.c2.x + k3 * g.p.x, y: k0 * a.y + k1 * g.c1.y + k2 * g.c2.y + k3 * g.p.y };
}

/** Punkte entlang der Mittellinie im Abstand ≤ step. */
export function sample(s: Stroke, step = 5): Pt[] {
  const out: Pt[] = [s.start];
  const segs = s.closed ? [...s.segs, L(s.start.x, s.start.y)] : s.segs;
  let cur = s.start;
  for (const g of segs) {
    const len = g.k === "L" ? dist(cur, g.p) : dist(cur, g.c1) + dist(g.c1, g.c2) + dist(g.c2, g.p);
    const n = Math.max(1, Math.ceil(len / step));
    for (let i = 1; i <= n; i++) out.push(at(cur, g, i / n));
    cur = g.p;
  }
  return out;
}

/** Tintenpunkte: Querschnitt (±half senkrecht zur Laufrichtung) an jedem Mittellinienpunkt. Stumpfe Enden ragen nicht über. */
export function inkPoints(s: Stroke, half: number, step = 5): Pt[] {
  const c = sample(s, step), out: Pt[] = [];
  for (let i = 0; i < c.length; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
    for (const t of [-1, -0.5, 0, 0.5, 1]) out.push({ x: c[i].x + nx * half * t, y: c[i].y + ny * half * t });
  }
  return out;
}

const r1 = (n: number) => String(Math.round(n * 10) / 10);
/** SVG-Pfaddaten mit absoluten Befehlen M, L, C, Z. */
export function pathData(s: Stroke): string {
  let d = `M${r1(s.start.x)} ${r1(s.start.y)}`;
  for (const g of s.segs)
    d += g.k === "L" ? `L${r1(g.p.x)} ${r1(g.p.y)}` : `C${r1(g.c1.x)} ${r1(g.c1.y)} ${r1(g.c2.x)} ${r1(g.c2.y)} ${r1(g.p.x)} ${r1(g.p.y)}`;
  return s.closed ? d + "Z" : d;
}

export function profile(ink: Pt[], height: number): Profile {
  const n = Math.ceil(height / BIN) + 1;
  const left = new Float64Array(n).fill(NaN), right = new Float64Array(n).fill(NaN);
  let minX = Infinity, maxX = -Infinity;
  for (const p of ink) {
    const i = Math.floor(p.y / BIN);
    if (i < 0 || i >= n) continue;
    if (!(left[i] <= p.x)) left[i] = p.x;
    if (!(right[i] >= p.x)) right[i] = p.x;
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
  }
  return { left, right, minX, maxX };
}

/** Profile mehrerer platzierter Teile zu einem Profil vereinen (globale x). */
export function mergeProfiles(parts: { prof: Profile; x: number }[]): Profile {
  const n = parts[0].prof.left.length;
  const left = new Float64Array(n).fill(NaN), right = new Float64Array(n).fill(NaN);
  let minX = Infinity, maxX = -Infinity;
  for (const { prof, x } of parts) {
    for (let i = 0; i < n; i++) {
      const a = prof.left[i] + x, b = prof.right[i] + x;
      if (a === a && !(left[i] <= a)) left[i] = a;
      if (b === b && !(right[i] >= b)) right[i] = b;
    }
    minX = Math.min(minX, prof.minX + x);
    maxX = Math.max(maxX, prof.maxX + x);
  }
  return { left, right, minX, maxX };
}

/** Verschiebung für das rechte Profil, sodass die kleinste waagrechte Lichtweite gap ist (nur Streifen ab minY). */
export function gapOffset(l: Profile, r: Profile, gap: number, minY = 0): number {
  let best = Infinity;
  for (let i = Math.max(0, Math.floor(minY / BIN)); i < l.right.length; i++) {
    const d = r.left[i] - l.right[i];
    if (d < best) best = d; // NaN-Vergleich ist false: leere Streifen zählen nicht
  }
  if (best === Infinity) best = r.minX - l.maxX;
  return gap - best;
}

/** Kleinster Abstand zweier Tintenpunktmengen (a um ax, b um bx verschoben); Infinity, wenn > limit. */
export function minDist(a: Pt[], ax: number, b: Pt[], bx: number, limit: number): number {
  let aLo = Infinity, aHi = -Infinity, bLo = Infinity, bHi = -Infinity;
  for (const p of a) { aLo = Math.min(aLo, p.x + ax); aHi = Math.max(aHi, p.x + ax); }
  for (const p of b) { bLo = Math.min(bLo, p.x + bx); bHi = Math.max(bHi, p.x + bx); }
  const lo = Math.max(aLo, bLo) - limit, hi = Math.min(aHi, bHi) + limit;
  if (lo > hi) return Infinity;
  const grid = new Map<number, Pt[]>();
  const key = (cx: number, cy: number) => cx * 4096 + cy;
  for (const p of a) {
    const x = p.x + ax;
    if (x < lo || x > hi) continue;
    const k = key(Math.floor(x / limit), Math.floor(p.y / limit));
    const cell = grid.get(k);
    if (cell) cell.push({ x, y: p.y });
    else grid.set(k, [{ x, y: p.y }]);
  }
  let best = Infinity;
  for (const q of b) {
    const x = q.x + bx;
    if (x < lo || x > hi) continue;
    const cx = Math.floor(x / limit), cy = Math.floor(q.y / limit);
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++) {
        const cell = grid.get(key(cx + i, cy + j));
        if (!cell) continue;
        for (const p of cell) {
          const d = Math.hypot(p.x - x, p.y - q.y);
          if (d < best) best = d;
        }
      }
  }
  return best <= limit ? best : Infinity;
}
```

- [ ] **Schritt 5: Test laufen lassen, er muss bestehen**

Befehl: `bun test test/geom.test.ts`
Erwartet: `8 pass`, `0 fail`.

- [ ] **Schritt 6: Commit**

```bash
git add package.json tsconfig.json .gitignore src/geom.ts test/geom.test.ts
git commit -m "feat: Projektgerüst und Geometrie (Abtastung, Tintenprofile, Abstände)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Aufgabe 2: Stil und Buchstaben

**Dateien:**
- Neu: `src/style.ts`, `src/glyphs.ts`
- Test: `test/glyphs.test.ts`

**Schnittstellen:**
- Verwendet: aus `geom`: `C`, `L`, `closed`, `stroke`, `Stroke`.
- Liefert:
  - `Style` (Felder `id, capHeight, stroke, barHigh, barLow, gap, wordGap, clearance, armGap, nestGap, nestOverhang, footGap, dotOffset, apexW`), `FLAECHE_1902`.
  - `Params`, `Range`, `Dock` (Arten `zone`, `foot`, `terminal`, `stem`, `leg`, `bar`), `GlyphDef` (`char, params, draw(p, s), docks(p, s)`, optional `adjust, cover, reach, close, lift(p, y, s), trimTop`), `GLYPHS: Record<string, GlyphDef>`, `PLACEHOLDER`, `defaults(g)`, `inRange(g, p)`.

Messwerte (Foto, 1 px ≈ 1,38 Einheiten): Strich 27, obere Balkenlinie 546, untere 154, Buchstabenabstand 56 (I–E 62, H–E 65, Ä–C 54), Wortabstand 104, L unter F: 71 % Höhe, 152 Lücke, F-Arm 97 darüber hinaus; A-Bein endet 65 über der Grundlinie; L-Fuß endet 105 vor dem rechten A-Bein; Ä-Punkte 93 neben der Mitte. D-Bogen und C-Bogen sind an die nachgezogenen Mittellinien angepasst (Abweichung < 6 Einheiten). G, K, N, O haben keine Vorlage: Startideen aus Spec 5.3.

- [ ] **Schritt 1: Fehlschlagenden Test schreiben** – `test/glyphs.test.ts`

```ts
import { expect, test } from "bun:test";
import { inkPoints } from "../src/geom";
import { GLYPHS, PLACEHOLDER, defaults, inRange, type GlyphDef, type Params } from "../src/glyphs";
import { FLAECHE_1902 as S } from "../src/style";

const M1 = [..."ACDEFGHIKLNOÄ"];

/** Start-, Minimal- und Maximalwerte je Regler einzeln, dazu alle auf Minimum bzw. Maximum. */
function variants(g: GlyphDef): Params[] {
  const base = defaults(g), out = [base];
  for (const [k, r] of Object.entries(g.params)) out.push({ ...base, [k]: r.min }, { ...base, [k]: r.max });
  out.push(Object.fromEntries(Object.entries(g.params).map(([k, r]) => [k, r.min])));
  out.push(Object.fromEntries(Object.entries(g.params).map(([k, r]) => [k, r.max])));
  return out;
}

test("alle M1-Zeichen sind entworfen", () => {
  expect(M1.filter((c) => !GLYPHS[c])).toEqual([]);
});

test("Tinte bleibt endlich und im Buchstabenfeld (Höhe, x ≥ linker Bezug)", () => {
  for (const g of [...M1.map((c) => GLYPHS[c]), PLACEHOLDER])
    for (const p of variants(g)) {
      const ink = g.draw(p, S).flatMap((st) => inkPoints(st, S.stroke / 2));
      const top = S.capHeight * p.h;
      for (const q of ink) {
        expect(Number.isFinite(q.x) && Number.isFinite(q.y)).toBe(true);
        expect(q.y).toBeGreaterThanOrEqual(-S.stroke / 2); // schräge Füße dürfen minimal unter die Grundlinie
        expect(q.y).toBeLessThanOrEqual(top + S.stroke / 2);
        expect(q.x).toBeGreaterThanOrEqual(-S.stroke);
        expect(q.x).toBeLessThan(1000);
      }
    }
});

test("Andockstellen der Vorlage-Buchstaben", () => {
  const kinds = (c: string) => GLYPHS[c].docks(defaults(GLYPHS[c]), S).map((d) => d.kind + ("side" in d ? ":" + d.side : ""));
  expect(kinds("F")).toContain("zone");
  expect(kinds("L")).toContain("foot");
  expect(kinds("E")).toContain("foot");
  expect(kinds("C")).toContain("terminal");
  expect(kinds("G")).toContain("terminal");
  expect(kinds("Ä")).toContain("leg:left");
  expect(kinds("H")).toContain("stem:right");
  expect(kinds("N")).toContain("stem:right");
  expect(GLYPHS.I.docks(defaults(GLYPHS.I), S)).toEqual([{ kind: "stem", side: "left", x: 0, solo: true }]);
});

test("Balkenlinien: E/F/H oben, A unten", () => {
  const barY = (c: string) => (GLYPHS[c].docks(defaults(GLYPHS[c]), S).find((d) => d.kind === "bar") as { y: number }).y;
  expect(barY("E")).toBe(S.barHigh);
  expect(barY("F")).toBe(S.barHigh);
  expect(barY("H")).toBe(S.barHigh);
  expect(barY("A")).toBe(S.barLow);
});

test("Ä: zwei Punkt-Quadrate innerhalb der Versalhöhe", () => {
  const strokes = GLYPHS["Ä"].draw(defaults(GLYPHS["Ä"]), S);
  const dots = strokes.slice(-2);
  expect(strokes.length).toBe(4);
  for (const d of dots) {
    expect(d.start.y).toBe(S.capHeight - S.stroke / 2);
    expect((d.segs[0] as { p: { x: number } }).p.x - d.start.x).toBe(S.stroke);
  }
});

test("inRange: Toleranz relativ zum Spielraum", () => {
  expect(inRange(GLYPHS.L, { h: 0.6, foot: 0 })).toBe(true);
  expect(inRange(GLYPHS.L, { h: 0.59, foot: 0 })).toBe(false);
  expect(inRange(GLYPHS.L, { h: 1, foot: 321 })).toBe(false);
});
```

- [ ] **Schritt 2: Test laufen lassen, er muss scheitern**

Befehl: `bun test test/glyphs.test.ts`
Erwartet: FAIL, `Cannot find module '../src/glyphs'`.

- [ ] **Schritt 3: Stil anlegen** – `src/style.ts`

```ts
export interface Style {
  id: string;
  capHeight: number; // Versalhöhe (Tinte), Grundlinie y = 0
  stroke: number; // Strichstärke
  barHigh: number; // obere Balkenlinie (Mittellinie)
  barLow: number; // untere Balkenlinie (Mittellinie)
  gap: number; // Buchstabenabstand = kleinste waagrechte Lichtweite
  wordGap: number; // Wortabstand
  clearance: number; // Lichtweite beim Verschachteln und Unterfahren
  armGap: number; // Mindest-Lichtweite überall (hart); Armende vor Hindernis; Spalt C → Stamm
  nestGap: number; // F-Stamm (Tinte rechts) bis verschachtelter Buchstabe (Tinte links)
  nestOverhang: number; // so weit ragt der F-Mittelarm über den verschachtelten Buchstaben
  footGap: number; // Fußende vor dem rechten A-Bein
  dotOffset: number; // Umlautpunkte: Abstand von der A-Mitte
  apexW: number; // Breite der flachen A-Spitze (Mittellinie)
}

/** Stil „Fläche 1902“, gemessen am Blatt „Die Fläche“ Bd. I S. 97 (1 px ≈ 1,38 Einheiten). */
export const FLAECHE_1902: Style = {
  id: "flaeche-1902",
  capHeight: 700,
  stroke: 26,
  barHigh: 546,
  barLow: 154,
  gap: 56,
  wordGap: 104,
  clearance: 36,
  armGap: 20,
  nestGap: 152,
  nestOverhang: 97,
  footGap: 105,
  dotOffset: 93,
  apexW: 30,
};
```

- [ ] **Schritt 4: Buchstaben anlegen** – `src/glyphs.ts`

Hinweise: `bar` = 0 heißt obere, 1 untere Balkenlinie. Verkürzte Buchstaben (`h` < 1) behalten die Balken anteilig. `lift` gleicht die schräge Schnittkante des A-Beins aus, damit die Lichtweite über dem Fuß wirklich `clearance` ist.

```ts
import { C, L, closed, stroke, type Stroke } from "./geom";
import type { Style } from "./style";

export type Params = Record<string, number>;
export type Range = { min: number; def: number; max: number };
export type Dock =
  | { kind: "zone"; armY: number } // freie Zone unter einem Arm (rechts), z. B. F
  | { kind: "foot"; end: number } // verlängerbarer Fuß, endet bei x = end
  | { kind: "terminal"; topEnd: number } // offenes Bogenende rechts unten; oberer Balken endet bei topEnd
  | { kind: "stem"; side: "left" | "right"; x: number; solo?: boolean } // senkrechter Stamm
  | { kind: "leg"; side: "left" | "right"; footX: number } // schräges Bein, Fuß bei footX
  | { kind: "bar"; y: number; x0: number; x1: number; left: boolean; right: boolean }; // Querbalken

export interface GlyphDef {
  char: string;
  params: Record<string, Range>;
  draw(p: Params, s: Style): Stroke[];
  docks(p: Params, s: Style): Dock[];
  adjust?: { left?: number; right?: number }; // Abstandskorrektur je Seite (Einheiten)
  cover?(p: Params, end: number): Params; // Mittelarm bis end, oberer Arm entsprechend (Verschachteln)
  reach?(p: Params, end: number): Params; // Fuß bis end (Unterfahren)
  close?(p: Params, x: number): Params; // Bogenende bis x (Strich teilen)
  lift?(p: Params, y: number, s: Style): Params; // linkes Bein: tiefste Tinte bei y (Unterfahren)
  trimTop?(p: Params, end: number): Params; // oberen Arm höchstens bis end
}

const R = (min: number, def: number, max: number): Range => ({ min, def, max });
const KAPPA = 0.5523; // Viertelkreis als kubischer Bogen
const h = R(0.6, 1, 1); // Höhe als Anteil der Versalhöhe
const inkTop = (p: Params, s: Style) => s.capHeight * p.h;
const cTop = (p: Params, s: Style) => inkTop(p, s) - s.stroke / 2; // Mittellinie oben
const cBot = (s: Style) => s.stroke / 2; // Mittellinie unten
const barY = (p: Params, s: Style) => (p.bar ? s.barLow : s.barHigh) * p.h;

const glyphA: GlyphDef = {
  char: "A",
  params: { h, w: R(300, 377, 420), bar: R(0, 1, 1), legL: R(0, 0, 200) },
  draw(p, s) {
    const t = cTop(p, s), run = (p.w - s.apexW) / 2, by = barY(p, s);
    const xl = (y: number) => (y / t) * run, xr = (y: number) => p.w - (y / t) * run;
    return [stroke(xl(p.legL), p.legL, L(run, t), L(p.w - run, t), L(p.w, 0)), stroke(xl(by), by, L(xr(by), by))];
  },
  docks(p, s) {
    const t = cTop(p, s), run = (p.w - s.apexW) / 2, by = barY(p, s);
    return [
      { kind: "leg", side: "left", footX: 0 },
      { kind: "leg", side: "right", footX: p.w },
      { kind: "bar", y: by, x0: (by / t) * run, x1: p.w - (by / t) * run, left: true, right: true },
    ];
  },
  lift(p, y, s) {
    const t = cTop(p, s), run = (p.w - s.apexW) / 2;
    return { ...p, legL: y + (s.stroke / 2) * (run / Math.hypot(run, t)) }; // Schnittkante des Beins liegt schräg
  },
};

const glyphAE: GlyphDef = {
  ...glyphA,
  char: "Ä",
  draw(p, s) {
    const y = cTop(p, s), cx = p.w / 2, d = s.stroke / 2;
    const dot = (x: number) => stroke(x - d, y, L(x + d, y)); // Quadrat: Strichlänge = Strichstärke
    return [...glyphA.draw(p, s), dot(cx - s.dotOffset), dot(cx + s.dotOffset)];
  },
};

function bowlC(p: Params, s: Style): Stroke {
  const t = cTop(p, s), b = cBot(s), r = 0.143 * inkTop(p, s), y0 = t - r;
  return stroke(p.w, t, L(r, t), C(r * (1 - KAPPA), t, 0, t - r * (1 - KAPPA), 0, y0), C(0, y0 - 0.66 * (y0 - b), 0.5 * p.wb, b, p.wb, b));
}

const glyphC: GlyphDef = {
  char: "C",
  params: { h, w: R(180, 226, 280), wb: R(150, 200, 330) },
  draw: (p, s) => [bowlC(p, s)],
  docks: (p) => [{ kind: "terminal", topEnd: p.w }],
  close: (p, x) => ({ ...p, wb: x }),
};

const glyphD: GlyphDef = {
  char: "D",
  params: { h, w: R(190, 236, 300), a: R(40, 80, 120) },
  draw(p, s) {
    const t = cTop(p, s), b = cBot(s), rb = 47 * p.h, span = t - b;
    return [
      closed(
        stroke(p.a, t, L(0, t), L(0, b), L(p.w - rb, b),
          C(p.w - rb * (1 - KAPPA), b, p.w, b + rb * (1 - KAPPA), p.w, b + rb),
          C(p.w, b + rb + 0.4 * span, p.a + 0.45 * (p.w - p.a), t - 0.22 * span, p.a, t)),
      ),
    ];
  },
  docks: () => [{ kind: "stem", side: "left", x: 0 }],
  adjust: { right: -17 },
};

const glyphE: GlyphDef = {
  char: "E",
  params: { h, w: R(200, 265, 330), bar: R(0, 0, 1), foot: R(0, 0, 300) },
  draw(p, s) {
    const t = cTop(p, s), b = cBot(s), by = barY(p, s);
    return [stroke(p.w, t, L(0, t), L(0, b), L(p.w + p.foot, b)), stroke(0, by, L(0.8 * p.w, by))];
  },
  docks: (p, s) => [
    { kind: "stem", side: "left", x: 0 },
    { kind: "foot", end: p.w + p.foot },
    { kind: "bar", y: barY(p, s), x0: 0, x1: 0.8 * p.w, left: true, right: true },
  ],
  reach: (p, end) => ({ ...p, foot: Math.max(0, end - p.w) }),
};

const glyphF: GlyphDef = {
  char: "F",
  params: { h, w: R(200, 265, 330), bar: R(0, 0, 1), arm: R(0, 0, 200), top: R(-100, 0, 200) },
  draw(p, s) {
    const t = cTop(p, s), by = barY(p, s);
    return [stroke(p.w + p.top, t, L(0, t), L(0, 0)), stroke(0, by, L(0.8 * p.w + p.arm, by))];
  },
  docks: (p, s) => [
    { kind: "stem", side: "left", x: 0 },
    { kind: "zone", armY: barY(p, s) },
    { kind: "bar", y: barY(p, s), x0: 0, x1: 0.8 * p.w + p.arm, left: true, right: true },
  ],
  cover: (p, end) => ({ ...p, arm: Math.max(0, end - 0.8 * p.w), top: Math.max(0, 1.26 * end - p.w) }),
  trimTop: (p, end) => ({ ...p, top: Math.max(-100, Math.min(p.top, end - p.w)) }),
};

const glyphG: GlyphDef = {
  char: "G",
  params: { h, w: R(180, 226, 280), wb: R(150, 200, 330), bar: R(0, 1, 1) },
  draw(p, s) {
    const c = bowlC(p, s), by = barY(p, s);
    return [{ ...c, segs: [...c.segs, L(p.wb, by), L(0.55 * p.wb, by)] }];
  },
  docks: (p, s) => [
    { kind: "terminal", topEnd: p.w },
    { kind: "bar", y: barY(p, s), x0: 0.55 * p.wb, x1: p.wb, left: false, right: true },
  ],
  close: (p, x) => ({ ...p, wb: x }),
};

const glyphH: GlyphDef = {
  char: "H",
  params: { h, w: R(190, 243, 300), bar: R(0, 0, 1) },
  draw(p, s) {
    const top = inkTop(p, s), by = barY(p, s);
    return [stroke(0, 0, L(0, top)), stroke(p.w, 0, L(p.w, top)), stroke(0, by, L(p.w, by))];
  },
  docks: (p, s) => [
    { kind: "stem", side: "left", x: 0 },
    { kind: "stem", side: "right", x: p.w },
    { kind: "bar", y: barY(p, s), x0: 0, x1: p.w, left: true, right: true },
  ],
};

const glyphI: GlyphDef = {
  char: "I",
  params: { h },
  draw: (p, s) => [stroke(0, 0, L(0, inkTop(p, s)))],
  docks: () => [{ kind: "stem", side: "left", x: 0, solo: true }],
};

const glyphK: GlyphDef = {
  char: "K",
  params: { h, w: R(180, 230, 280) },
  draw(p, s) {
    const j = s.barHigh * p.h; // Arme treffen sich auf der oberen Balkenlinie
    return [stroke(0, 0, L(0, inkTop(p, s))), stroke(0.9 * p.w, cTop(p, s), L(0, j), L(p.w, 0))];
  },
  docks: () => [{ kind: "stem", side: "left", x: 0 }],
};

const glyphL: GlyphDef = {
  char: "L",
  params: { h, foot: R(0, 0, 320) },
  draw: (p, s) => [stroke(0, inkTop(p, s), L(0, cBot(s)), L(200 + p.foot, cBot(s)))],
  docks: (p) => [{ kind: "stem", side: "left", x: 0 }, { kind: "foot", end: 200 + p.foot }],
  reach: (p, end) => ({ ...p, foot: Math.max(0, end - 200) }),
};

const glyphN: GlyphDef = {
  char: "N",
  params: { h, w: R(190, 243, 300) },
  draw: (p, s) => [stroke(0, 0, L(0, inkTop(p, s)), L(p.w, 0), L(p.w, inkTop(p, s)))],
  docks: (p) => [{ kind: "stem", side: "left", x: 0 }, { kind: "stem", side: "right", x: p.w }],
};

const glyphO: GlyphDef = {
  char: "O",
  params: { h, w: R(180, 240, 300) },
  draw(p, s) {
    const t = cTop(p, s), b = cBot(s), r = p.w / 2, k = KAPPA * r;
    return [
      closed(
        stroke(0, b + r, L(0, t - r), C(0, t - r + k, r - k, t, r, t), C(r + k, t, p.w, t - r + k, p.w, t - r),
          L(p.w, b + r), C(p.w, b + r - k, r + k, b, r, b), C(r - k, b, 0, b + r - k, 0, b + r)),
      ),
    ];
  },
  docks: () => [],
  adjust: { left: -10, right: -10 },
};

/** Ersatz für noch nicht entworfene Zeichen. */
export const PLACEHOLDER: GlyphDef = {
  char: "?",
  params: { h },
  draw: (p, s) => [closed(stroke(0, cBot(s), L(200, cBot(s)), L(200, cTop(p, s)), L(0, cTop(p, s))))],
  docks: () => [],
};

export const GLYPHS: Record<string, GlyphDef> = Object.fromEntries(
  [glyphA, glyphAE, glyphC, glyphD, glyphE, glyphF, glyphG, glyphH, glyphI, glyphK, glyphL, glyphN, glyphO].map((g) => [g.char, g]),
);

export const defaults = (g: GlyphDef): Params => Object.fromEntries(Object.entries(g.params).map(([k, r]) => [k, r.def]));
export const inRange = (g: GlyphDef, p: Params) =>
  Object.entries(g.params).every(([k, r]) => {
    const eps = (r.max - r.min) * 1e-3 + 1e-9;
    return p[k] >= r.min - eps && p[k] <= r.max + eps;
  });
```

- [ ] **Schritt 5: Test laufen lassen, er muss bestehen**

Befehl: `bun test test/glyphs.test.ts`
Erwartet: `6 pass`, `0 fail`.

- [ ] **Schritt 6: Commit**

```bash
git add src/style.ts src/glyphs.ts test/glyphs.test.ts
git commit -m "feat: Stil Fläche 1902 und 13 Buchstaben als Skelette" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Aufgabe 3: Verbindungsregeln

**Dateien:**
- Neu: `src/rules.ts`
- Test: `test/rules.test.ts`

**Schnittstellen:**
- Verwendet: aus `geom`: `BIN, L, gapOffset, inkPoints, minDist, profile, stroke, Profile, Pt, Stroke`. Aus `glyphs`: `inRange, Dock, GlyphDef, Params`. `Style`.
- Liefert:
  - Typen `JoinType = "none" | "nest" | "underrun" | "share"`, `Join = { type; sub?: "term" | "stem" | "leg"; bar?: boolean }`, `Inst = { def, p, strokes, ink, prof, docks }`, `Applied = { lp, rp, dx }`.
  - Funktionen `instance(def, p, s): Inst`, `dock(inst, kind, side?)`, `spacing(l, r, gap, minY = 0): number`, `joinsFor(l, r): Join[]` (immer zuerst `none`), `apply(j, l, rDef, rp0, s): Applied | null`, `lightGap(a, ax, b, bx, limit)`, `collides(a, ax, b, bx, s): boolean`, `trimTop(f, fx, o, ox, s): Inst`, `barLink(l, lx, r, rx, s): Stroke | null`.

Regeln:
- **a nest:** Rechter Buchstabe wird auf `(Balken − Strich/2 − clearance)/700` gekürzt. Seine linke Tinte steht bei `Strich/2 + nestGap`. Der Mittelarm (`cover`) ragt `nestOverhang` darüber.
- **b underrun:** Linkes A-Bein wird angehoben (`lift`). Abstand wird nur über Streifen oberhalb des Fußes gemessen. Der Fuß (`reach`) endet `footGap` vor dem rechten Bein.
- **c share:**
  - `term`: Bogenende auf den Nachbarstamm, oberer Balken `armGap` davor.
  - `stem`: gemeinsamer Stamm, nicht bei Einzelstrich-I.
  - `leg`: Füße treffen sich.
- **d barLink:** Verbindungsstück zwischen Balken auf gleicher Linie, Lücke ≤ `wordGap`.

- [ ] **Schritt 1: Fehlschlagenden Test schreiben** – `test/rules.test.ts`

```ts
import { expect, test } from "bun:test";
import { GLYPHS, defaults } from "../src/glyphs";
import { apply, barLink, collides, instance, joinsFor, lightGap, trimTop, type Inst, type Join } from "../src/rules";
import { FLAECHE_1902 as S } from "../src/style";

const inst = (c: string, p = {}) => instance(GLYPHS[c], { ...defaults(GLYPHS[c]), ...p }, S);
/** Regel anwenden und beide Buchstaben neu vermessen. */
function join(j: Join, a: string, b: string): { l: Inst; r: Inst; dx: number } {
  const res = apply(j, inst(a), GLYPHS[b], defaults(GLYPHS[b]), S)!;
  expect(res).not.toBeNull();
  return { l: instance(GLYPHS[a], res.lp, S), r: instance(GLYPHS[b], res.rp, S), dx: res.dx };
}

test("joinsFor: welche Verbindungen an welchem Paar möglich sind", () => {
  const types = (a: string, b: string) => joinsFor(inst(a), inst(b)).map((j) => j.sub ?? j.type);
  expect(types("F", "L")).toEqual(["none", "nest"]);
  expect(types("L", "Ä")).toEqual(["none", "underrun"]);
  expect(types("C", "H")).toEqual(["none", "term"]);
  expect(types("H", "E")).toEqual(["none", "stem"]);
  expect(types("A", "A")).toEqual(["none", "leg"]);
  expect(types("H", "I")).toEqual(["none"]); // I ist ein einzelner Stamm: würde verschwinden
  expect(types("D", "I")).toEqual(["none"]);
});

test("a Verschachteln: L ≈ 70 % hoch, Lichtweite ≥ Mindestabstand, Mittelarm ragt über", () => {
  const { l, r, dx } = join({ type: "nest" }, "F", "L");
  expect(r.p.h).toBeCloseTo((S.barHigh - S.stroke / 2 - S.clearance) / S.capHeight);
  expect(r.p.h).toBeCloseTo(0.71, 2);
  expect(dx + r.prof.minX).toBeCloseTo(S.stroke / 2 + S.nestGap);
  expect(lightGap(l, 0, r, dx, 100)).toBeGreaterThanOrEqual(S.clearance - 3);
  const armEnd = 0.8 * l.p.w + l.p.arm;
  expect(armEnd).toBeCloseTo(dx + r.prof.minX + S.nestOverhang);
});

test("b Unterfahren: A-Bein endet über dem Fuß, Fuß läuft unter A", () => {
  const { l, r, dx } = join({ type: "underrun" }, "L", "Ä");
  expect(r.p.legL).toBeGreaterThan(S.stroke + S.clearance); // schräge Schnittkante ausgeglichen
  expect(lightGap(l, 0, r, dx, 100)).toBeGreaterThanOrEqual(S.clearance - 1);
  const footEnd = 200 + l.p.foot;
  expect(footEnd).toBeCloseTo(dx + r.p.w - S.footGap);
  expect(footEnd).toBeGreaterThan(dx + r.prof.minX + 2 * S.stroke);
});

test("c Strich teilen: C-Bogen endet auf dem H-Stamm (< 0,5 Einheiten), oben bleibt armGap", () => {
  const { l, dx } = join({ type: "share", sub: "term" }, "C", "H");
  expect(Math.abs(l.p.wb - dx)).toBeLessThan(0.5); // H-Stamm liegt bei dx + 0
  expect(dx - S.stroke / 2 - l.p.w).toBeCloseTo(S.armGap);
  expect(join({ type: "share", sub: "stem" }, "H", "E").dx).toBe(GLYPHS.H.params.w.def);
  expect(join({ type: "share", sub: "leg" }, "A", "A").dx).toBe(GLYPHS.A.params.w.def);
});

test("d Balken verbinden: AA mit gemeinsamen Füßen bekommt ein Verbindungsstück auf der unteren Linie", () => {
  const a = inst("A"), dx = a.p.w;
  const link = barLink(a, 0, a, dx, S)!;
  expect(link.start.y).toBe(S.barLow);
  expect(link.start.x).toBeLessThan((link.segs[0] as { p: { x: number } }).p.x);
  expect(barLink(inst("H"), 0, a, 400, S)).toBeNull(); // H oben, A unten
});

test("Kollision: Berührung erkannt, normaler Abstand frei", () => {
  const i = inst("I");
  expect(collides(i, 0, i, 30, S)).toBe(true);
  expect(collides(i, 0, i, 26 + S.gap, S)).toBe(false);
});

test("trimTop: oberer F-Arm endet armGap vor dem Nachbarn", () => {
  const f = inst("F", { top: 200 }), i = inst("I");
  const t = trimTop(f, 0, i, 400, S);
  expect(t.p.w + t.p.top).toBeCloseTo(400 - S.stroke / 2 - S.armGap, 0);
  expect(trimTop(f, 0, i, 2000, S)).toBe(f);
});
```

- [ ] **Schritt 2: Test laufen lassen, er muss scheitern**

Befehl: `bun test test/rules.test.ts`
Erwartet: FAIL, `Cannot find module '../src/rules'`.

- [ ] **Schritt 3: Umsetzen** – `src/rules.ts`

```ts
import { BIN, L, gapOffset, inkPoints, minDist, profile, stroke, type Profile, type Pt, type Stroke } from "./geom";
import { inRange, type Dock, type GlyphDef, type Params } from "./glyphs";
import type { Style } from "./style";

export type JoinType = "none" | "nest" | "underrun" | "share";
export type Join = { type: JoinType; sub?: "term" | "stem" | "leg"; bar?: boolean };
/** Ein Buchstabe mit festen Reglerwerten, fertig vermessen (Koordinaten lokal, x = 0 am linken Bezug). */
export type Inst = { def: GlyphDef; p: Params; strokes: Stroke[]; ink: Pt[]; prof: Profile; docks: Dock[] };

export function instance(def: GlyphDef, p: Params, s: Style): Inst {
  const strokes = def.draw(p, s);
  const ink = strokes.flatMap((st) => inkPoints(st, s.stroke / 2));
  return { def, p, strokes, ink, prof: profile(ink, s.capHeight), docks: def.docks(p, s) };
}

export function dock<K extends Dock["kind"]>(i: Inst, kind: K, side?: "left" | "right") {
  return i.docks.find((d) => d.kind === kind && (side === undefined || ("side" in d && d.side === side))) as
    | Extract<Dock, { kind: K }>
    | undefined;
}

/** Abstand für „keine Verbindung“: kleinste waagrechte Lichtweite = gap (+ Seitenkorrektur). */
export function spacing(l: Inst, r: Inst, gap: number, minY = 0): number {
  return gapOffset(l.prof, r.prof, gap + (l.def.adjust?.right ?? 0) + (r.def.adjust?.left ?? 0), minY);
}

/** Alle an dieser Grenze möglichen Verbindungen (Balken-Variante kommt in der Engine dazu). */
export function joinsFor(l: Inst, r: Inst): Join[] {
  const out: Join[] = [{ type: "none" }];
  if (dock(l, "zone") && l.def.cover) out.push({ type: "nest" });
  if (dock(l, "foot") && l.def.reach && dock(r, "leg", "left") && r.def.lift) out.push({ type: "underrun" });
  const stemL = dock(r, "stem", "left");
  if (dock(l, "terminal") && l.def.close && stemL) out.push({ type: "share", sub: "term" });
  if (dock(l, "stem", "right") && stemL && !stemL.solo) out.push({ type: "share", sub: "stem" });
  if (dock(l, "leg", "right") && dock(r, "leg", "left")) out.push({ type: "share", sub: "leg" });
  return out;
}

export type Applied = { lp: Params; rp: Params; dx: number };

/** Regel anwenden: neue Regler für links und rechts plus Verschiebung dx des rechten Buchstabens. */
export function apply(j: Join, l: Inst, rDef: GlyphDef, rp0: Params, s: Style): Applied | null {
  let lp = l.p, rp = rp0, dx: number;
  if (j.type === "nest") {
    rp = { ...rp, h: (dock(l, "zone")!.armY - s.stroke / 2 - s.clearance) / s.capHeight };
    const inkLeft = s.stroke / 2 + s.nestGap;
    dx = inkLeft - instance(rDef, rp, s).prof.minX;
    lp = l.def.cover!(lp, inkLeft + s.nestOverhang);
  } else if (j.type === "underrun") {
    const minY = s.stroke + s.clearance;
    rp = rDef.lift!(rp, minY, s);
    const r = instance(rDef, rp, s);
    dx = spacing(l, r, s.gap, minY);
    const end = dx + dock(r, "leg", "right")!.footX - s.footGap;
    if (end < dx + r.prof.minX + 2 * s.stroke) return null;
    lp = l.def.reach!(lp, end);
  } else {
    const r = instance(rDef, rp, s);
    if (j.type === "none") dx = spacing(l, r, s.gap);
    else if (j.sub === "term") {
      const stem = dock(r, "stem", "left")!.x;
      dx = dock(l, "terminal")!.topEnd + s.armGap + s.stroke / 2 - stem;
      lp = l.def.close!(lp, dx + stem);
    } else if (j.sub === "stem") dx = dock(l, "stem", "right")!.x - dock(r, "stem", "left")!.x;
    else dx = dock(l, "leg", "right")!.footX - dock(r, "leg", "left")!.footX;
  }
  return inRange(l.def, lp) && inRange(rDef, rp) ? { lp, rp, dx } : null;
}

/** Kleinste Lichtweite zwischen zwei platzierten Buchstaben (Infinity, wenn > limit). */
export const lightGap = (a: Inst, ax: number, b: Inst, bx: number, limit: number) => minDist(a.ink, ax, b.ink, bx, limit);

/** Harte Regel: Tinte verschiedener Buchstaben bleibt mindestens armGap auseinander (3 Einheiten Messtoleranz). */
export const collides = (a: Inst, ax: number, b: Inst, bx: number, s: Style) => lightGap(a, ax, b, bx, s.armGap) < s.armGap - 3;

/** Oberen Arm (F) vor dem Buchstaben o kürzen, sodass armGap Luft bleibt. */
export function trimTop(f: Inst, fx: number, o: Inst, ox: number, s: Style): Inst {
  if (!f.def.trimTop) return f;
  const top = s.capHeight * f.p.h;
  let obstacle = Infinity;
  for (let i = Math.floor((top - s.stroke) / BIN); i <= Math.floor(top / BIN) && i < o.prof.left.length; i++)
    if (o.prof.left[i] + ox < obstacle) obstacle = o.prof.left[i] + ox;
  if (obstacle === Infinity) return f;
  const p = f.def.trimTop(f.p, obstacle - s.armGap - fx);
  return p.top === f.p.top ? f : instance(f.def, p, s);
}

/** Verbindungsstück zwischen zwei Querbalken auf gleicher Linie (globale Koordinaten), sonst null. */
export function barLink(l: Inst, lx: number, r: Inst, rx: number, s: Style): Stroke | null {
  const a = dock(l, "bar"), b = dock(r, "bar");
  if (!a || !b || !a.right || !b.left || Math.abs(a.y - b.y) > 0.5) return null;
  const x0 = lx + a.x1, x1 = rx + b.x0;
  return x1 > x0 && x1 - x0 <= s.wordGap ? stroke(x0, a.y, L(x1, a.y)) : null;
}
```

- [ ] **Schritt 4: Test laufen lassen, er muss bestehen**

Befehl: `bun test test/rules.test.ts`
Erwartet: `7 pass`, `0 fail`.

- [ ] **Schritt 5: Commit**

```bash
git add src/rules.ts test/rules.test.ts
git commit -m "feat: Verbindungsregeln (verschachteln, unterfahren, Strich teilen, Balken verbinden)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Aufgabe 4: Engine (Suche, Bewertung, Pins, Zielbreite)

**Dateien:**
- Neu: `src/engine.ts`
- Test: `test/engine.test.ts`

**Schnittstellen:**
- Verwendet:
  - aus `geom`: `gapOffset, mergeProfiles, shift, Profile, Stroke`
  - aus `glyphs`: `GLYPHS, PLACEHOLDER, defaults, GlyphDef, Params`
  - aus `rules`: `apply, barLink, collides, instance, joinsFor, trimTop, Inst, Join`
  - `Style`
- Liefert:
  - `Pins = { letters: Record<number, Params>; joins: Record<number, Join> }` (Schlüssel = Zeichenindex im Text; Grenze i liegt zwischen Zeichen i und i+1)
  - `Options = { style, interlock, targetWidth: number | null, pins, variants? }`
  - `Placed = { index, char, inst, x }`
  - `Layout = { glyphs, extras, joins, minX, maxX, width, score }`
  - `Result = { variants, warnings }`
  - `WEIGHTS`
  - `layoutLine(text, o): Result`
  - `joinOptions(v, i): Join[]`

Bewertung, kleiner ist besser:
- Verbindungskosten `WEIGHTS[art] − gain × Verschränkung`. Bei Verschränkung 0,5 lohnen sich `nest`, `underrun` und `term`; `stem`, `leg` und Balken nicht.
- Dazu Breite, Bündigkeit oben/unten und Rhythmus der Senkrechten, gering gewichtet.

Pins:
- Gepinnte Werte dürfen von Regeln nicht verändert werden.
- Passt kein Pin, wird ohne Pins neu gesucht, mit dem Hinweis „nicht erfüllbar“.

Zielbreite: Die Breiten der Buchstaben werden im Spielraum angepasst, die Verbindungen bleiben fest. Bis zu 4 Runden.

- [ ] **Schritt 1: Fehlschlagenden Test schreiben** – `test/engine.test.ts`

```ts
import { expect, test } from "bun:test";
import { joinOptions, layoutLine, type Options } from "../src/engine";
import { FLAECHE_1902 } from "../src/style";

const opts = (o: Partial<Options> = {}): Options => ({ style: FLAECHE_1902, interlock: 0.5, targetWidth: null, pins: { letters: {}, joins: {} }, ...o });
/** Verbindungen einer Variante als Kurzschrift je Grenze, z. B. { 4: "nest" }. */
const kinds = (v: { joins: Record<number, { type: string; sub?: string; bar?: boolean }> }) =>
  Object.fromEntries(Object.entries(v.joins).map(([i, j]) => [i, (j.sub ?? j.type) + (j.bar ? "+bar" : "")]));

test("Referenztest DIE FLÄCHE: FL verschachtelt, LÄ unterfahren, CH geteilt, Rest ohne", () => {
  const best = layoutLine("DIE FLÄCHE", opts()).variants[0];
  // D0 I1 E2 _3 F4 L5 Ä6 C7 H8 E9
  expect(kinds(best)).toEqual({ 0: "none", 1: "none", 4: "nest", 5: "underrun", 6: "none", 7: "term", 8: "none" });
  const bar = (i: number) => best.glyphs.find((g) => g.index === i)!.inst.p.bar;
  expect([2, 4, 8, 9].map(bar)).toEqual([0, 0, 0, 0]);
  expect(bar(6)).toBe(1);
});

test("HAGEN AAD FOCK: eine Variante mit FO verschachtelt und CK geteilt", () => {
  const { variants } = layoutLine("HAGEN AAD FOCK", opts());
  expect(variants.length).toBe(6);
  // H0 A1 G2 E3 N4 _5 A6 A7 D8 _9 F10 O11 C12 K13
  expect(variants.some((v) => kinds(v)[10] === "nest" && kinds(v)[12] === "term")).toBe(true);
});

test("Verschränkung: 0 = keine Verbindungen, 1 = AA mit Füßen und Balken", () => {
  expect(Object.values(kinds(layoutLine("DIE FLÄCHE", opts({ interlock: 0 })).variants[0]))).toEqual(Array(7).fill("none"));
  expect(kinds(layoutLine("HAGEN AAD FOCK", opts({ interlock: 1 })).variants[0])[6]).toBe("leg+bar");
});

test("gleiche Eingabe → identische Rangliste", () => {
  const a = layoutLine("HAGEN AAD FOCK", opts()), b = layoutLine("HAGEN AAD FOCK", opts());
  expect(a.variants.map(kinds)).toEqual(b.variants.map(kinds));
  expect(a.variants.map((v) => v.score)).toEqual(b.variants.map((v) => v.score));
});

test("Pins: erzwungene Verbindung und fester Reglerwert", () => {
  const forced = layoutLine("DIE FLÄCHE", opts({ pins: { letters: {}, joins: { 4: { type: "none" } } } })).variants[0];
  expect(kinds(forced)[4]).toBe("none");
  const tall = layoutLine("DIE FLÄCHE", opts({ pins: { letters: { 5: { h: 1 } }, joins: {} } })).variants[0];
  expect(kinds(tall)[4]).toBe("none"); // volles L passt nicht unter den F-Arm
});

test("unerfüllbarer Pin → Hinweis, Satz trotzdem da", () => {
  const r = layoutLine("DIE FLÄCHE", opts({ pins: { letters: {}, joins: { 0: { type: "nest" } } } }));
  expect(r.warnings.some((w) => w.includes("nicht erfüllbar"))).toBe(true);
  expect(r.variants.length).toBeGreaterThan(0);
});

test("Kleinbuchstaben werden in M1 zu Versalien, unbekannte Zeichen zu Platzhaltern", () => {
  expect(layoutLine("die fläche", opts()).variants.map(kinds)).toEqual(layoutLine("DIE FLÄCHE", opts()).variants.map(kinds));
  const r = layoutLine("ÜBER", opts());
  expect(r.warnings).toContain("Zeichen „Ü“ noch nicht entworfen");
  expect(r.variants[0].glyphs[0].inst.def.char).toBe("?");
});

test("e Zielbreite: erreichbar → passt auf ±2, unerreichbar → Hinweis", () => {
  const natural = layoutLine("DIE FLÄCHE", opts()).variants[0].width;
  const fit = layoutLine("DIE FLÄCHE", opts({ targetWidth: natural + 120 }));
  expect(Math.abs(fit.variants[0].width - (natural + 120))).toBeLessThanOrEqual(2);
  expect(fit.warnings).toEqual([]);
  const far = layoutLine("DIE FLÄCHE", opts({ targetWidth: natural * 3 }));
  expect(far.warnings).toContain("Zielbreite nicht erreichbar – nächstbeste Breite gezeigt");
});

test("joinOptions: Wortgrenze hat keine Optionen", () => {
  const v = layoutLine("DIE FLÄCHE", opts()).variants[0];
  expect(joinOptions(v, 2)).toEqual([]); // E | Leerzeichen
  expect(joinOptions(v, 4).map((j) => j.type)).toEqual(["none", "nest"]);
});
```

- [ ] **Schritt 2: Test laufen lassen, er muss scheitern**

Befehl: `bun test test/engine.test.ts`
Erwartet: FAIL, `Cannot find module '../src/engine'`.

- [ ] **Schritt 3: Umsetzen** – `src/engine.ts`

```ts
import { gapOffset, mergeProfiles, shift, type Profile, type Stroke } from "./geom";
import { GLYPHS, PLACEHOLDER, defaults, type GlyphDef, type Params } from "./glyphs";
import { apply, barLink, collides, instance, joinsFor, trimTop, type Inst, type Join } from "./rules";
import type { Style } from "./style";

export type Pins = { letters: Record<number, Params>; joins: Record<number, Join> };
export type Options = { style: Style; interlock: number; targetWidth: number | null; pins: Pins; variants?: number };
/** index = Position des Zeichens im Text (Leerzeichen mitgezählt). */
export type Placed = { index: number; char: string; inst: Inst; x: number };
export type Layout = { glyphs: Placed[]; extras: Stroke[]; joins: Record<number, Join>; minX: number; maxX: number; width: number; score: number };
export type Result = { variants: Layout[]; warnings: string[] };

/** Alle Gewichte an einer Stelle. Verbindungskosten bei Verschränkung 0; davon wird gain × Verschränkung abgezogen. */
export const WEIGHTS = { nest: 0.2, underrun: 0.2, term: 0.2, stem: 1.0, leg: 0.6, bar: 0.6, gain: 1.0, width: 0.2, flush: 0.3, rhythm: 0.2 };
const BEAM = 32;
const CODE: Record<string, string> = { none: "-", nest: "N", underrun: "U", term: "T", stem: "S", leg: "L" };

type Letter = { index: number; char: string; def: GlyphDef };
type Node = { placed: Placed[]; joins: Record<number, Join>; extras: Stroke[]; cost: number; key: string };

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function joinCost(j: Join, interlock: number): number {
  const g = WEIGHTS.gain * interlock;
  const base = j.type === "none" ? null : j.type === "share" ? WEIGHTS[j.sub!] : WEIGHTS[j.type as "nest" | "underrun"];
  return (base === null ? 0 : base - g) + (j.bar ? WEIGHTS.bar - g : 0);
}

/** Text in Wörter aus Buchstaben zerlegen; M1: Versalien, unbekannte Zeichen → Platzhalter. */
function words(text: string, warn: Set<string>): Letter[][] {
  const out: Letter[][] = [];
  let cur: Letter[] = [];
  [...text].forEach((raw, index) => {
    const char = raw === "ß" ? raw : raw.toUpperCase();
    if (char.trim() === "") {
      if (cur.length) out.push(cur);
      cur = [];
      return;
    }
    const def = GLYPHS[char];
    if (!def) warn.add(`Zeichen „${char}“ noch nicht entworfen`);
    cur.push({ index, char, def: def ?? PLACEHOLDER });
  });
  if (cur.length) out.push(cur);
  return out;
}

const conflicts = (p: Params, lock?: Params) => !!lock && Object.entries(lock).some(([k, v]) => Math.abs(p[k] - v) > 1e-6);

/** Alle Fortsetzungen eines Teil-Layouts um den Buchstaben cur. */
function expand(n: Node, cur: Letter, o: Options, usePins: boolean, force = false): Node[] {
  const s = o.style, out: Node[] = [];
  const last = n.placed[n.placed.length - 1], prev = n.placed[n.placed.length - 2];
  const pin = usePins ? o.pins.joins[last.index] : undefined;
  const lockL = usePins ? o.pins.letters[last.index] : undefined;
  const lockR = usePins ? o.pins.letters[cur.index] : undefined;
  const rp0 = { ...defaults(cur.def), ...lockR };
  const options = force ? [{ type: "none" } as Join] : joinsFor(last.inst, instance(cur.def, rp0, s));
  for (const j of options) {
    if (pin && (pin.type !== j.type || pin.sub !== j.sub)) continue;
    const res = apply(j, last.inst, cur.def, rp0, s);
    if (!res || conflicts(res.lp, lockL) || conflicts(res.rp, lockR)) continue;
    const rx = last.x + res.dx, r = instance(cur.def, res.rp, s);
    const l = trimTop(res.lp === last.inst.p ? last.inst : instance(last.inst.def, res.lp, s), last.x, r, rx, s);
    const p = prev && trimTop(prev.inst, prev.x, r, rx, s);
    if (!force && j.type !== "share" && collides(l, last.x, r, rx, s)) continue;
    if (!force && prev && collides(p!, prev.x, r, rx, s)) continue;
    for (const bar of [false, true]) {
      if (pin?.bar !== undefined && pin.bar !== bar) continue;
      const link = bar && (j.type === "none" || j.type === "share") ? barLink(l, last.x, r, rx, s) : null;
      if (bar && !link) continue;
      const jb: Join = { ...j, bar };
      const placed = n.placed.slice(0, -2);
      if (prev) placed.push({ ...prev, inst: p! });
      placed.push({ ...last, inst: l }, { index: cur.index, char: cur.char, inst: r, x: rx });
      out.push({
        placed,
        joins: { ...n.joins, [last.index]: jb },
        extras: link ? [...n.extras, link] : n.extras,
        cost: n.cost + joinCost(jb, o.interlock),
        key: n.key + CODE[j.sub ?? j.type] + (bar ? "+" : ""),
      });
    }
  }
  return out;
}

function prune(nodes: Node[]): Node[] {
  const seen = new Set<string>();
  return nodes
    .sort((a, b) => a.cost - b.cost || cmp(a.key, b.key))
    .filter((n) => !seen.has(n.key) && !!seen.add(n.key))
    .slice(0, BEAM);
}

/** Strahlsuche über die Buchstabengrenzen eines Worts. */
function searchWord(word: Letter[], o: Options, warn: Set<string>): Node[] {
  const s = o.style, first = word[0];
  const p0 = { ...defaults(first.def), ...o.pins.letters[first.index] };
  let beam: Node[] = [{ placed: [{ index: first.index, char: first.char, inst: instance(first.def, p0, s), x: 0 }], joins: {}, extras: [], cost: 0, key: "" }];
  for (let k = 1; k < word.length; k++) {
    let next = beam.flatMap((n) => expand(n, word[k], o, true));
    if (!next.length) {
      warn.add(`Pin bei „${word[k - 1].char}${word[k].char}“ nicht erfüllbar`);
      next = beam.flatMap((n) => expand(n, word[k], o, false));
    }
    if (!next.length) next = beam.flatMap((n) => expand(n, word[k], o, false, true));
    beam = prune(next);
  }
  return beam;
}

function extent(placed: Placed[]) {
  let minX = Infinity, maxX = -Infinity;
  for (const g of placed) {
    minX = Math.min(minX, g.x + g.inst.prof.minX);
    maxX = Math.max(maxX, g.x + g.inst.prof.maxX);
  }
  return { minX, maxX, width: maxX - minX };
}

/** Anteil der Wortbreite mit Tinte an Ober- und Unterkante (0..1). */
function flush(n: Node, s: Style, minX: number, width: number): number {
  const res = 5, cells = Math.max(1, Math.ceil(width / res));
  const top = new Uint8Array(cells), bottom = new Uint8Array(cells);
  for (const g of n.placed)
    for (const p of g.inst.ink) {
      const row = p.y >= s.capHeight - s.stroke / 2 ? top : p.y <= s.stroke / 2 ? bottom : null;
      if (row) row[Math.min(cells - 1, Math.max(0, Math.floor((g.x + p.x - minX) / res)))] = 1;
    }
  const sum = (a: Uint8Array) => a.reduce((t, v) => t + v, 0);
  return (sum(top) + sum(bottom)) / (2 * cells);
}

/** Ungleichmäßigkeit der Abstände zwischen Senkrechten (Variationskoeffizient). */
function rhythm(n: Node): number {
  const xs = n.placed
    .flatMap((g) => g.inst.docks.flatMap((d) => (d.kind === "stem" ? [g.x + d.x] : [])))
    .sort((a, b) => a - b);
  const gaps = xs.slice(1).map((x, i) => x - xs[i]).filter((d) => d > 5);
  if (gaps.length < 2) return 0;
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  return Math.sqrt(gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length) / mean;
}

function finalScore(n: Node, s: Style): number {
  const { minX, width } = extent(n.placed);
  return n.cost + WEIGHTS.width * (width / s.capHeight) + WEIGHTS.flush * (1 - flush(n, s, minX, width)) + WEIGHTS.rhythm * rhythm(n);
}

/** Wörter mit Wortabstand nebeneinandersetzen. */
function assemble(parts: Node[], score: number, s: Style): Layout {
  const glyphs: Placed[] = [], extras: Stroke[] = [], joins: Record<number, Join> = {};
  let prev: Profile | null = null;
  for (const n of parts) {
    const local = mergeProfiles(n.placed.map((g) => ({ prof: g.inst.prof, x: g.x })));
    const offset: number = prev ? gapOffset(prev, local, s.wordGap) : 0;
    glyphs.push(...n.placed.map((g) => ({ ...g, x: g.x + offset })));
    extras.push(...n.extras.map((e) => shift(e, offset)));
    Object.assign(joins, n.joins);
    prev = mergeProfiles(n.placed.map((g) => ({ prof: g.inst.prof, x: g.x + offset })));
  }
  return { glyphs, extras, joins, ...extent(glyphs), score };
}

/** Regel e: Breiten im Spielraum anpassen, bis die Zeile die Zielbreite hat (Verbindungen bleiben fest). */
function fitWidth(v: Layout, ws: Letter[][], o: Options, warn: Set<string>): Layout {
  const target = o.targetWidth!;
  let cur = v;
  for (let it = 0; it < 4 && Math.abs(target - cur.width) > 1; it++) {
    const delta = target - cur.width;
    const flex = cur.glyphs.filter((g) => g.inst.def.params.w && o.pins.letters[g.index]?.w === undefined);
    const room = flex.map((g) => (delta > 0 ? g.inst.def.params.w.max - g.inst.p.w : g.inst.p.w - g.inst.def.params.w.min));
    const total = room.reduce((a, b) => a + b, 0);
    if (total < 1) break;
    const ratio = Math.min(1, Math.abs(delta) / total) * Math.sign(delta);
    const letters = { ...o.pins.letters };
    flex.forEach((g, i) => (letters[g.index] = { ...letters[g.index], w: g.inst.p.w + ratio * room[i] }));
    const pins: Pins = { letters, joins: { ...cur.joins, ...o.pins.joins } };
    cur = assemble(ws.map((w) => searchWord(w, { ...o, pins }, new Set())[0]), v.score, o.style);
  }
  if (Math.abs(target - cur.width) > 2) warn.add("Zielbreite nicht erreichbar – nächstbeste Breite gezeigt");
  return cur;
}

/** Eine Zeile setzen: beste Varianten (Rangliste) plus Hinweise. */
export function layoutLine(text: string, o: Options): Result {
  const warn = new Set<string>(), s = o.style, count = o.variants ?? 6;
  const ws = words(text, warn);
  if (!ws.length) return { variants: [], warnings: [] };
  let combos: { parts: Node[]; score: number; key: string }[] = [{ parts: [], score: 0, key: "" }];
  for (const w of ws) {
    const cands = searchWord(w, o, warn)
      .map((n) => ({ n, score: finalScore(n, s) }))
      .sort((a, b) => a.score - b.score || cmp(a.n.key, b.n.key))
      .slice(0, count);
    combos = combos
      .flatMap((c) => cands.map((x) => ({ parts: [...c.parts, x.n], score: c.score + x.score, key: `${c.key}|${x.n.key}` })))
      .sort((a, b) => a.score - b.score || cmp(a.key, b.key))
      .slice(0, count);
  }
  let variants = combos.map((c) => assemble(c.parts, c.score, s));
  if (o.targetWidth) variants = variants.map((v) => fitWidth(v, ws, o, warn));
  return { variants, warnings: [...warn] };
}

/** Mögliche Verbindungen an der Grenze nach Zeichen i (leer an Wortgrenzen). */
export function joinOptions(v: Layout, i: number): Join[] {
  const k = v.glyphs.findIndex((g) => g.index === i), a = v.glyphs[k], b = v.glyphs[k + 1];
  return a && b && b.index === i + 1 ? joinsFor(a.inst, b.inst) : [];
}
```

- [ ] **Schritt 4: Test laufen lassen, er muss bestehen**

Befehl: `bun test test/engine.test.ts`
Erwartet: `9 pass`, `0 fail`. Laufzeit der ganzen Datei unter 1 s; im Prototyp brauchte eine Zeile 4–15 ms.

- [ ] **Schritt 5: Commit**

```bash
git add src/engine.ts test/engine.test.ts
git commit -m "feat: Engine mit Strahlsuche, Bewertung, Pins und Zielbreite" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Aufgabe 5: Renderer, Prüfblätter und erste Sichtprüfung mit Hagen

**Dateien:**
- Neu: `src/render.ts`, `tools/sheet.ts`
- Test: `test/render.test.ts`

**Schnittstellen:**
- Verwendet: `pathData` (geom), `Layout` (engine), `Style`.
- Liefert:
  - `Overlay = { href, x, y, w, h, opacity }`
  - `RenderOpts = { ink, paper: string | null, margin?, interactive?, selected?, pinned?, overlay? }`
  - `svgString(l, s, o): string`
    - Schrift liegt in der gespiegelten Gruppe `#ink`.
    - Je Buchstabe eine Gruppe `[data-i]`.
    - Klickflächen `class="hit"` und Auswahl `class="sel"` nur bei `interactive`.

- [ ] **Schritt 1: Fehlschlagenden Test schreiben** – `test/render.test.ts`

```ts
import { expect, test } from "bun:test";
import { layoutLine } from "../src/engine";
import { svgString } from "../src/render";
import { FLAECHE_1902 as S } from "../src/style";

const v = layoutLine("DIE FLÄCHE", { style: S, interlock: 0.5, targetWidth: null, pins: { letters: {}, joins: {} } }).variants[0];

test("SVG: ein Gruppe je Buchstabe, ein Pfad je Strich, keine NaN", () => {
  const svg = svgString(v, S, { ink: "#000", paper: "#fff" });
  expect(svg.startsWith("<svg")).toBe(true);
  expect(svg.match(/data-i=/g)!.length).toBe(9);
  const strokes = v.glyphs.reduce((n, g) => n + g.inst.strokes.length, 0) + v.extras.length;
  expect(svg.match(/<path /g)!.length).toBe(strokes);
  expect(svg).not.toContain("NaN");
  expect(svg).toContain(`viewBox="${Math.round((v.minX - 60) * 10) / 10} -60 `);
});

test("Export ohne Bedienelemente; transparent ohne Papier", () => {
  const svg = svgString(v, S, { ink: "#000", paper: null });
  expect(svg).not.toContain("<rect");
  expect(svg).not.toContain('class="hit"');
});

test("Vorschau: Klickflächen, Auswahl, Pin-Marke, Overlay", () => {
  const svg = svgString(v, S, {
    ink: "#000", paper: "#fff", interactive: true, selected: 4, pinned: [5],
    overlay: { href: "x.jpg", x: -73, y: -66, w: 2400, h: 830, opacity: 0.5 },
  });
  expect(svg).toContain('class="sel"');
  expect(svg.match(/class="hit"/g)!.length).toBe(8);
  expect(svg).toContain('class="pin"');
  expect(svg).toContain('<image href="x.jpg"');
});
```

- [ ] **Schritt 2: Test laufen lassen, er muss scheitern**

Befehl: `bun test test/render.test.ts`
Erwartet: FAIL, `Cannot find module '../src/render'`.

- [ ] **Schritt 3: Umsetzen** – `src/render.ts`

```ts
import { pathData } from "./geom";
import type { Layout } from "./engine";
import type { Style } from "./style";

export type Overlay = { href: string; x: number; y: number; w: number; h: number; opacity: number };
export type RenderOpts = {
  ink: string;
  paper: string | null; // null = transparent
  margin?: number;
  interactive?: boolean; // Klickflächen + Auswahl (nur Vorschau, nie Export)
  selected?: number | null;
  pinned?: number[];
  overlay?: Overlay | null;
};

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Layout → SVG-Text. Schriftkoordinaten (y nach oben) liegen in der gespiegelten Gruppe #ink. */
export function svgString(l: Layout, s: Style, o: RenderOpts): string {
  const m = o.margin ?? 60, H = s.capHeight;
  const [x, y, w, h] = [l.minX - m, -m, l.width + 2 * m, H + 2 * m].map(r1);
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">`];
  if (o.paper) out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${o.paper}"/>`);
  const ov = o.overlay;
  if (ov) out.push(`<image href="${ov.href}" x="${ov.x}" y="${ov.y}" width="${ov.w}" height="${ov.h}" opacity="${ov.opacity}" preserveAspectRatio="none"/>`);
  out.push(`<g id="ink" transform="matrix(1 0 0 -1 0 ${H})" fill="none" stroke="${o.ink}" stroke-width="${s.stroke}" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4">`);
  for (const g of l.glyphs) {
    const { minX, maxX } = g.inst.prof, top = r1(H * g.inst.p.h);
    out.push(`<g data-i="${g.index}" transform="translate(${r1(g.x)} 0)">`);
    if (o.interactive) {
      const sel = g.index === o.selected;
      out.push(`<rect class="${sel ? "sel" : "hit"}" x="${r1(minX)}" y="0" width="${r1(maxX - minX)}" height="${top}" fill="${sel ? "#c9a227" : "transparent"}" fill-opacity="${sel ? 0.18 : 0}" stroke="none" pointer-events="all"/>`);
      if (o.pinned?.includes(g.index)) out.push(`<circle class="pin" cx="${r1((minX + maxX) / 2)}" cy="${-m / 2}" r="8" fill="#b03a2e" stroke="none"/>`);
    }
    for (const st of g.inst.strokes) out.push(`<path d="${pathData(st)}"/>`);
    out.push(`</g>`);
  }
  for (const e of l.extras) out.push(`<path d="${pathData(e)}"/>`);
  out.push(`</g></svg>`);
  return out.join("");
}
```

- [ ] **Schritt 4: Test laufen lassen, er muss bestehen**

Befehl: `bun test`
Erwartet: alle Dateien grün (`33 pass`, `0 fail`).

- [ ] **Schritt 5: Prüfblatt-Werkzeug** – `tools/sheet.ts`

```ts
// Prüfblatt: alle Glyphen einzeln plus beste Varianten der Testwörter → out/*.svg (+ PNG, falls Inkscape da ist)
import { mkdirSync, existsSync } from "node:fs";
import { layoutLine } from "../src/engine";
import { svgString } from "../src/render";
import { FLAECHE_1902 } from "../src/style";

const INKSCAPE = "/Applications/Inkscape.app/Contents/MacOS/inkscape";
const jobs: [string, string, number][] = [
  ["glyphen", "A C D E F G H I K L N O Ä", 0],
  ["die-flaeche", "DIE FLÄCHE", 0.5],
  ["hagen-aad-fock", "HAGEN AAD FOCK", 0.5],
  ["hagen-aad-fock-wild", "HAGEN AAD FOCK", 1],
];
mkdirSync("out", { recursive: true });
for (const [name, text, interlock] of jobs) {
  const { variants, warnings } = layoutLine(text, { style: FLAECHE_1902, interlock, targetWidth: null, pins: { letters: {}, joins: {} } });
  const file = `out/${name}.svg`;
  await Bun.write(file, svgString(variants[0], FLAECHE_1902, { ink: "#1d1a17", paper: "#ece2cf" }));
  if (existsSync(INKSCAPE)) Bun.spawnSync([INKSCAPE, file, "-o", `out/${name}.png`, "-w", "1600"]);
  console.log(file, warnings.join(" · "));
}
```

Befehl: `bun run sheet`
Erwartet:
- Vier Zeilen `out/….svg`, ohne Hinweise.
- Daneben PNGs, wenn Inkscape unter `/Applications/Inkscape.app` liegt.

- [ ] **Schritt 6: Selbst ansehen**

Die vier PNGs mit dem Read-Werkzeug öffnen und prüfen:

1. `out/die-flaeche.png`: L ist kurz unter dem F-Mittelarm, der L-Fuß läuft unter dem Ä, das linke A-Bein endet über dem Fuß, der C-Bogen mündet in den H-Stamm. Die Balken von E, F und H liegen oben, der des A unten. Die Ä-Punkte sitzen innerhalb der Oberkante.
2. `out/hagen-aad-fock.png`: Das O ist unter das F geschoben, C→K und G→E sind geteilt.
3. `out/hagen-aad-fock-wild.png`: Bei AA treffen sich die Füße, ein Balken läuft durch beide.
4. `out/glyphen.png`: Alle 13 Formen sind vollständig, ohne Ausreißer über oder unter der Zeile.

- [ ] **Schritt 7: CHECKPOINT – Hagen zeigt und fragt**

Die PNGs mit `SendUserFile` schicken. Dazu die Frage: „Passen die Formen? Besonders G, K, N und O, die keine Vorlage haben.“
- Ändert Hagen Formen: nur `draw()` bzw. Regler-Startwerte in `src/glyphs.ts` anpassen. Danach `bun test` (muss grün bleiben) und `bun run sheet`, erneut zeigen.
- Weiter erst nach Hagens „passt“.

- [ ] **Schritt 8: Commit**

```bash
git add src/render.ts test/render.test.ts tools/sheet.ts src/glyphs.ts
git commit -m "feat: SVG-Renderer und Prüfblätter" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Aufgabe 6: Referenz-Overlay und Vorlagen

**Dateien:**
- Neu:
  - `tools/overlay.py`
  - `reference/die-flaeche-overlay.jpg` (erzeugt)
  - `presets/die-flaeche.json`
  - `presets/hagen-aad-fock.json`
  - `src/assets.d.ts`
- Test: `test/presets.test.ts`

**Schnittstellen:**
- Verwendet: `layoutLine`, `Pins` (engine), `FLAECHE_1902`.
- Liefert:
  - Vorlagenformat `{ name, text, style, styleValues?, controls: { targetWidth, interlock }, variant, pins: { letters, joins }, overlay?: { src, x, y, w, h } }`.
  - `reference/die-flaeche-overlay.jpg`.
  - Modultyp für `*.jpg`-Importe.

- [ ] **Schritt 1: Fehlschlagenden Test schreiben** – `test/presets.test.ts`

```ts
import { expect, test } from "bun:test";
import dieFlaeche from "../presets/die-flaeche.json";
import hagen from "../presets/hagen-aad-fock.json";
import { layoutLine, type Pins } from "../src/engine";
import { FLAECHE_1902 } from "../src/style";

for (const p of [dieFlaeche, hagen]) {
  test(`Vorlage „${p.name}“ lässt sich ohne Hinweise setzen`, () => {
    const r = layoutLine(p.text, { style: FLAECHE_1902, interlock: p.controls.interlock, targetWidth: p.controls.targetWidth, pins: p.pins as unknown as Pins });
    expect(r.warnings).toEqual([]);
    expect(r.variants.length).toBeGreaterThan(0);
  });
}

test("DIE FLÄCHE bringt Overlay-Maße mit", () => {
  const o = dieFlaeche.overlay;
  expect(o.src).toBe("die-flaeche");
  for (const v of [o.x, o.y, o.w, o.h]) expect(Number.isFinite(v)).toBe(true);
});

test("HAGEN AAD FOCK: AA mit gemeinsamen Füßen und durchgehendem Balken", () => {
  const v = layoutLine(hagen.text, { style: FLAECHE_1902, interlock: hagen.controls.interlock, targetWidth: null, pins: hagen.pins as unknown as Pins }).variants[0];
  expect(v.joins[6]).toEqual({ type: "share", sub: "leg", bar: true });
  expect(v.extras.length).toBe(1);
});
```

- [ ] **Schritt 2: Test laufen lassen, er muss scheitern**

Befehl: `bun test test/presets.test.ts`
Erwartet: FAIL, `Cannot find module '../presets/die-flaeche.json'`.

- [ ] **Schritt 3: Overlay-Werkzeug** – `tools/overlay.py`

```python
# /// script
# dependencies = ["pillow", "numpy"]
# ///
"""Referenz-Overlay: Schriftzug-Ausschnitt geraderichten und auf Schrifteinheiten ausrichten.

Schreibt reference/die-flaeche-overlay.jpg und gibt die Overlay-Werte für presets/die-flaeche.json aus.
Aufruf (im Projektordner): uv run tools/overlay.py
"""
import json

import numpy as np
from PIL import Image

SRC, DST = "reference/die-flaeche-schriftzug.jpg", "reference/die-flaeche-overlay.jpg"
CAP = 700  # Versalhöhe in Schrifteinheiten


def stems(img):
    """Senkrechte Striche: (Mitte x, Tinte oben y, Tinte unten y, Breite px), von links nach rechts."""
    dark = np.asarray(img.convert("L")) < 110
    h, w = dark.shape
    runs = np.zeros(w, dtype=int)
    for x in range(w):
        best = cur = 0
        for v in dark[:, x]:
            cur = cur + 1 if v else 0
            best = max(best, cur)
        runs[x] = best
    groups = []
    for x in np.where(runs > 0.5 * h)[0]:
        if groups and x - groups[-1][-1] <= 2:
            groups[-1].append(x)
        else:
            groups.append([x])
    out = []
    for g in groups:
        c = (g[0] + g[-1]) / 2
        ys = np.where(dark[:, int(c)])[0]
        out.append((c, ys.min(), ys.max(), len(g)))
    return [s for s in out if s[3] >= 15]  # schmale Treffer (Bogenteile) verwerfen


im = Image.open(SRC).convert("RGB")
s = stems(im)
(x0, _, b0, _), (x1, _, b1, _) = s[0], s[-1]  # D-Stamm und letzter E-Stamm
angle = float(np.degrees(np.arctan2(b1 - b0, x1 - x0)))  # Grundlinie fällt nach rechts → gegen den Uhrzeiger drehen
im = im.rotate(angle, resample=Image.BICUBIC, fillcolor=(222, 205, 175))
im.save(DST, quality=90)

d_x, top, bottom, _ = stems(im)[0]  # D-Stamm nach dem Drehen
k = CAP / (bottom - top + 1)  # Einheiten pro Pixel
print(json.dumps({
    "angle": round(angle, 3),
    "overlay": {"src": "die-flaeche", "x": round(-d_x * k, 1), "y": round(-top * k, 1),
                "w": round(im.width * k, 1), "h": round(im.height * k, 1)},
}, indent=2))
```

Befehl (im Projektordner): `uv run tools/overlay.py`
Erwartet: JSON mit `"angle": 0.315` und `overlay` ≈ `{"x": -73.2, "y": -66.3, "w": 2421.7, "h": 835.3}`. Datei `reference/die-flaeche-overlay.jpg` existiert.

- [ ] **Schritt 4: Vorlagen und Bild-Typ anlegen**

`presets/die-flaeche.json`: In `overlay` genau die Werte aus Schritt 3 eintragen. Die folgenden Werte sind die im Prototyp gemessenen.
```json
{
  "name": "DIE FLÄCHE",
  "text": "DIE FLÄCHE",
  "style": "flaeche-1902",
  "controls": { "targetWidth": null, "interlock": 0.5 },
  "variant": 0,
  "pins": { "letters": {}, "joins": {} },
  "overlay": { "src": "die-flaeche", "x": -73.2, "y": -66.3, "w": 2421.7, "h": 835.3 }
}
```

`presets/hagen-aad-fock.json`: Erste Fassung der ausgearbeiteten Vorlage. Die Feinarbeit mit Hagen folgt in Aufgabe 8. Index-Schema `H0 A1 G2 E3 N4 _5 A6 A7 D8 _9 F10 O11 C12 K13`, Grenze 6 = A|A.
```json
{
  "name": "HAGEN AAD FOCK",
  "text": "HAGEN AAD FOCK",
  "style": "flaeche-1902",
  "controls": { "targetWidth": null, "interlock": 0.5 },
  "variant": 0,
  "pins": {
    "letters": {},
    "joins": {
      "2": { "type": "share", "sub": "term", "bar": false },
      "6": { "type": "share", "sub": "leg", "bar": true },
      "10": { "type": "nest", "bar": false },
      "12": { "type": "share", "sub": "term", "bar": false }
    }
  }
}
```

`src/assets.d.ts`
```ts
declare module "*.jpg" {
  const url: string;
  export default url;
}
```

- [ ] **Schritt 5: Test laufen lassen, er muss bestehen**

Befehl: `bun test`
Erwartet: `37 pass`, `0 fail`.

- [ ] **Schritt 6: Commit**

```bash
git add tools/overlay.py reference/die-flaeche-overlay.jpg presets src/assets.d.ts test/presets.test.ts
git commit -m "feat: Referenz-Overlay und Vorlagen DIE FLÄCHE, HAGEN AAD FOCK" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Aufgabe 7: Oberfläche

**Dateien:**
- Neu: `index.html`, `src/ui.ts`, `.claude/launch.json`

**Schnittstellen:**
- Verwendet: `layoutLine`, `joinOptions`, `Layout`, `Pins`, `Placed` (engine); `Params` (glyphs); `svgString`, `Overlay` (render); `Join` (rules); `FLAECHE_1902`, `Style`; die Vorlagen-JSONs; `reference/die-flaeche-overlay.jpg` (Bun bündelt den Import als Datei-URL).
- Liefert: lauffähige Seite. Speicherschlüssel `kairos.state` (letzter Stand) und `kairos.presets` (eigene Vorlagen).

Verhalten:
- **Verlauf:** `commit()` läuft nach jeder abgeschlossenen Änderung und merkt den vorigen Stand. ⌘Z / ⇧⌘Z laufen über `restore`.
- **Text ändern:** löscht alle Pins, weil sich die Positionen verschieben, und blendet das Overlay aus.
- **Griffe:** liegen in einer eigenen obersten SVG-Ebene, sonst verdecken die Klickflächen der Nachbarn sie. Sie haben immer 14 px Bildschirmgröße.
- **Ziehen eines Griffs:** setzt einen Pin (`h`, `w`, `bar`, `foot`, `top`), die Vorschau rechnet live neu.

- [ ] **Schritt 1: Seite** – `index.html`

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>KAIROS Font</title>
    <style>
      :root { --ink: #1d1a17; --line: #cdbfa4; --accent: #8a5a12; --muted: #6b6152; }
      * { box-sizing: border-box; }
      body { margin: 0; font: 14px/1.4 system-ui, sans-serif; color: var(--ink); background: #f6f1e7; }
      header, footer { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; padding: 10px 16px; }
      header { border-bottom: 1px solid var(--line); }
      footer { border-top: 1px solid var(--line); }
      main { display: grid; grid-template-columns: 1fr 270px; min-height: calc(100vh - 120px); }
      #stage { padding: 16px; overflow: auto; }
      #preview svg { display: block; width: 100%; height: auto; max-height: 62vh; }
      #preview [data-i] { cursor: pointer; }
      .handle { fill: #fff; stroke: var(--accent); stroke-width: 2px; vector-effect: non-scaling-stroke; cursor: grab; }
      aside { display: flex; flex-direction: column; gap: 10px; padding: 12px 16px; border-left: 1px solid var(--line); }
      label { display: flex; flex-direction: column; gap: 2px; font-size: 12px; color: var(--muted); }
      label.row { flex-direction: row; align-items: center; gap: 6px; }
      #text { width: min(520px, 60vw); padding: 6px 8px; font: 600 18px system-ui, sans-serif; letter-spacing: 0.08em; }
      #variants { display: inline-flex; gap: 4px; }
      #variants button { min-width: 32px; }
      #variants button.on { background: var(--ink); color: #fff; }
      #letter { display: none; flex-direction: column; gap: 6px; padding: 8px; border: 1px solid var(--line); border-radius: 4px; }
      #letter.on { display: flex; }
      #status { min-height: 1.4em; margin-top: 8px; color: var(--accent); }
    </style>
  </head>
  <body>
    <header>
      <input id="text" aria-label="Text" />
      <select id="preset" aria-label="Vorlagen"></select>
      <button id="savePreset">Als Vorlage speichern</button>
      <button id="exportPreset">Vorlage exportieren</button>
      <label class="row">Vorlage importieren <input id="importPreset" type="file" accept="application/json" /></label>
    </header>
    <main>
      <section id="stage">
        <div id="preview"></div>
        <div id="status" role="status"></div>
      </section>
      <aside>
        <label class="row"><input id="targetFree" type="checkbox" /> Zielbreite frei</label>
        <label>Zielbreite <input id="target" type="range" min="800" max="8000" step="10" /></label>
        <label>Verschränkung (brav ↔ wild) <input id="interlock" type="range" min="0" max="1" step="0.05" /></label>
        <details>
          <summary>Feinheiten</summary>
          <label>Strich <input id="stroke" type="range" min="14" max="44" step="1" /></label>
          <label>Balken oben <input id="barHigh" type="range" min="420" max="640" step="2" /></label>
          <label>Balken unten <input id="barLow" type="range" min="60" max="280" step="2" /></label>
          <label>Wortabstand <input id="wordGap" type="range" min="40" max="400" step="2" /></label>
        </details>
        <label class="row"><input id="overlay" type="checkbox" /> Original drüber</label>
        <label>Deckkraft <input id="opacity" type="range" min="0.1" max="1" step="0.05" /></label>
        <label class="row">Tinte <input id="ink" type="color" /> Papier <input id="paper" type="color" /></label>
        <div id="letter">
          <strong id="letterName"></strong>
          <label>Verbindung links <select id="joinLeft"></select></label>
          <label>Verbindung rechts <select id="joinRight"></select></label>
          <label class="row"><input id="barRight" type="checkbox" /> Balken nach rechts verbinden</label>
          <button id="resetLetter">Zurücksetzen</button>
        </div>
      </aside>
    </main>
    <footer>
      <span>Varianten</span>
      <span id="variants"></span>
      <span style="flex: 1"></span>
      <label class="row"><input id="transparent" type="checkbox" /> transparent</label>
      <select id="pngScale" aria-label="PNG-Größe">
        <option value="0.5">PNG 1×</option>
        <option value="1" selected>PNG 2×</option>
        <option value="2">PNG 4×</option>
      </select>
      <button id="exportPng">PNG</button>
      <button id="exportSvg">SVG</button>
    </footer>
    <script type="module" src="./src/ui.ts"></script>
  </body>
</html>
```

- [ ] **Schritt 2: Logik** – `src/ui.ts`

```ts
import dieFlaeche from "../presets/die-flaeche.json";
import hagen from "../presets/hagen-aad-fock.json";
import overlayUrl from "../reference/die-flaeche-overlay.jpg";
import { joinOptions, layoutLine, type Layout, type Pins, type Placed } from "./engine";
import type { Params } from "./glyphs";
import { svgString, type Overlay } from "./render";
import type { Join } from "./rules";
import { FLAECHE_1902, type Style } from "./style";

type OverlayRef = { src: string; x: number; y: number; w: number; h: number };
type Preset = {
  name: string;
  text: string;
  style: string;
  styleValues?: Partial<Style>;
  controls: { targetWidth: number | null; interlock: number };
  variant: number;
  pins: Pins;
  overlay?: OverlayRef;
};
type State = {
  text: string;
  interlock: number;
  target: number | null;
  style: Style;
  variant: number;
  pins: Pins;
  ink: string;
  paper: string;
  transparent: boolean;
  overlay: OverlayRef | null;
  showOverlay: boolean;
  opacity: number;
  selected: number | null;
};
type HandleKind = "h" | "w" | "bar" | "foot" | "top";

const BUILTIN = [dieFlaeche, hagen] as unknown as Preset[];
const OVERLAYS: Record<string, string> = { "die-flaeche": overlayUrl };
const KEY = "kairos.state", PRESETS = "kairos.presets", SVGNS = "http://www.w3.org/2000/svg";
const LABEL: Record<string, string> = {
  none: "keine",
  nest: "verschachteln",
  underrun: "unterfahren",
  term: "Strich teilen (Bogen)",
  stem: "Strich teilen (Stamm)",
  leg: "Strich teilen (Füße)",
};

const $ = <T extends HTMLElement = HTMLInputElement>(id: string) => document.getElementById(id) as T;
const jkey = (j: Join) => j.sub ?? j.type;

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Browser-Speicher gesperrt: App läuft ohne Speichern */
  }
}

const fromPreset = (p: Preset, keep?: State): State => ({
  text: p.text,
  interlock: p.controls.interlock,
  target: p.controls.targetWidth,
  style: { ...FLAECHE_1902, ...p.styleValues },
  variant: p.variant,
  pins: structuredClone(p.pins),
  ink: keep?.ink ?? "#1d1a17",
  paper: keep?.paper ?? "#ece2cf",
  transparent: keep?.transparent ?? false,
  overlay: p.overlay ?? null,
  showOverlay: false,
  opacity: keep?.opacity ?? 0.5,
  selected: null,
});

let state: State = load(KEY, fromPreset(BUILTIN[0]));
if (typeof state.text !== "string" || !state.style?.capHeight || !state.pins?.letters) state = fromPreset(BUILTIN[0]);
let userPresets: Preset[] = load(PRESETS, []);
let variants: Layout[] = [];
let layout: Layout | null = null;

// Verlauf: commit() nach jeder abgeschlossenen Änderung merkt den vorigen Stand
let stable = JSON.stringify(state);
const past: string[] = [], future: string[] = [];
function commit() {
  const now = JSON.stringify(state);
  if (now === stable) return;
  past.push(stable);
  if (past.length > 100) past.shift();
  future.length = 0;
  stable = now;
}
function restore(from: string[], to: string[]) {
  const v = from.pop();
  if (!v) return;
  to.push(stable);
  state = JSON.parse(v);
  stable = v;
  syncControls();
  update();
}

function update() {
  const res = layoutLine(state.text, { style: state.style, interlock: state.interlock, targetWidth: state.target, pins: state.pins });
  variants = res.variants;
  state.variant = Math.max(0, Math.min(state.variant, variants.length - 1));
  layout = variants[state.variant] ?? null;
  $("status").textContent = res.warnings.join(" · ");
  renderVariants();
  renderPreview();
  renderLetter();
  save(KEY, state);
}

function renderPreview() {
  const box = $("preview");
  if (!layout) {
    box.innerHTML = "";
    return;
  }
  const ov = state.overlay;
  const overlay: Overlay | null =
    ov && state.showOverlay ? { href: OVERLAYS[ov.src], x: ov.x, y: ov.y, w: ov.w, h: ov.h, opacity: state.opacity } : null;
  box.innerHTML = svgString(layout, state.style, {
    ink: state.ink,
    paper: state.paper,
    interactive: true,
    selected: state.selected,
    pinned: Object.keys(state.pins.letters).map(Number),
    overlay,
  });
  const g = layout.glyphs.find((q) => q.index === state.selected);
  const ink = box.querySelector("#ink") as SVGGraphicsElement;
  if (!g) return;
  const layer = document.createElementNS(SVGNS, "g"); // oberste Ebene, damit Nachbar-Klickflächen die Griffe nicht verdecken
  layer.setAttribute("transform", `translate(${g.x} 0)`);
  ink.appendChild(layer);
  const size = 14 / (ink.getScreenCTM()?.a || 1); // 14 px, egal wie stark die Vorschau verkleinert ist
  for (const h of handles(g)) {
    const r = document.createElementNS(SVGNS, "rect");
    for (const [k, v] of Object.entries({ class: "handle", x: h.x - size / 2, y: h.y - size / 2, width: size, height: size }))
      r.setAttribute(k, String(v));
    r.addEventListener("pointerdown", (e) => drag(e, g, h.kind));
    layer.appendChild(r);
  }
}

/** Griffe in Buchstabenkoordinaten: Höhe, Breite, Balken, Fuß, oberer Arm. */
function handles(g: Placed): { kind: HandleKind; x: number; y: number }[] {
  const s = state.style, p = g.inst.p, { minX, maxX } = g.inst.prof, top = s.capHeight * p.h;
  const out: { kind: HandleKind; x: number; y: number }[] = [{ kind: "h", x: (minX + maxX) / 2, y: top }];
  if ("w" in p) out.push({ kind: "w", x: maxX, y: top / 2 });
  for (const d of g.inst.docks) {
    if (d.kind === "bar" && "bar" in p) out.push({ kind: "bar", x: (d.x0 + d.x1) / 2, y: d.y });
    if (d.kind === "foot") out.push({ kind: "foot", x: d.end, y: s.stroke / 2 });
  }
  if ("top" in p) out.push({ kind: "top", x: p.w + p.top, y: top - s.stroke / 2 });
  return out;
}

function fontPoint(e: PointerEvent) {
  const ink = $("preview").querySelector("#ink") as SVGGraphicsElement;
  return new DOMPoint(e.clientX, e.clientY).matrixTransform(ink.getScreenCTM()!.inverse());
}

/** Griff ziehen: Wert wird als Pin festgehalten, Engine rechnet live neu. */
function drag(e: PointerEvent, start: Placed, kind: HandleKind) {
  e.preventDefault();
  e.stopPropagation();
  const i = start.index, def = start.inst.def, s = state.style;
  const clamp = (k: string, v: number) => Math.min(def.params[k].max, Math.max(def.params[k].min, v));
  const move = (ev: PointerEvent) => {
    const g = layout?.glyphs.find((q) => q.index === i);
    if (!g) return;
    const pt = fontPoint(ev), x = pt.x - g.x, p = g.inst.p;
    let v: Params;
    if (kind === "h") v = { h: clamp("h", pt.y / s.capHeight) };
    else if (kind === "w") v = { w: clamp("w", p.w + x - g.inst.prof.maxX) };
    else if (kind === "bar") v = { bar: pt.y < s.capHeight / 2 ? 1 : 0 };
    else if (kind === "foot") {
      const end = g.inst.docks.find((d) => d.kind === "foot") as { end: number };
      v = { foot: clamp("foot", p.foot + x - end.end) };
    } else v = { top: clamp("top", x - p.w) };
    state.pins.letters[i] = { ...state.pins.letters[i], ...v };
    update();
  };
  const up = () => {
    removeEventListener("pointermove", move);
    removeEventListener("pointerup", up);
    commit();
  };
  addEventListener("pointermove", move);
  addEventListener("pointerup", up);
}

function renderLetter() {
  const g = layout?.glyphs.find((q) => q.index === state.selected);
  $("letter").classList.toggle("on", !!g);
  if (!g || !layout) return;
  $("letterName").textContent = `Buchstabe „${g.char}“`;
  joinSelect($<HTMLSelectElement>("joinLeft"), g.index - 1);
  joinSelect($<HTMLSelectElement>("joinRight"), g.index);
  $("barRight").checked = !!(state.pins.joins[g.index]?.bar ?? layout.joins[g.index]?.bar);
  $("barRight").disabled = joinOptions(layout, g.index).length === 0;
}

/** Auswahlliste der möglichen Verbindungen an einer Grenze; Auswahl = Pin. */
function joinSelect(sel: HTMLSelectElement, boundary: number) {
  const opts = layout ? joinOptions(layout, boundary) : [];
  const auto = layout?.joins[boundary];
  sel.disabled = opts.length === 0;
  sel.innerHTML =
    `<option value="auto">automatisch${auto ? ` (${LABEL[jkey(auto)]})` : ""}</option>` +
    opts.map((j) => `<option value="${jkey(j)}">${LABEL[jkey(j)]}</option>`).join("");
  const pin = state.pins.joins[boundary];
  sel.value = pin ? jkey(pin) : "auto";
  sel.onchange = () => {
    if (sel.value === "auto") delete state.pins.joins[boundary];
    else state.pins.joins[boundary] = { ...opts.find((j) => jkey(j) === sel.value)!, bar: state.pins.joins[boundary]?.bar ?? false };
    update();
    commit();
  };
}

function renderVariants() {
  $("variants").replaceChildren(
    ...variants.map((_, k) => {
      const b = document.createElement("button");
      b.textContent = String(k + 1);
      b.className = k === state.variant ? "on" : "";
      b.onclick = () => {
        state.variant = k;
        update();
        commit();
      };
      return b;
    }),
  );
}

function syncControls() {
  $("text").value = state.text;
  $("interlock").value = String(state.interlock);
  $("targetFree").checked = state.target === null;
  $("target").disabled = state.target === null;
  $("target").value = String(state.target ?? Math.round(layout?.width ?? 2400));
  for (const k of ["stroke", "barHigh", "barLow", "wordGap"] as const) $(k).value = String(state.style[k]);
  $("overlay").checked = state.showOverlay;
  $("overlay").disabled = !state.overlay;
  $("opacity").value = String(state.opacity);
  $("ink").value = state.ink;
  $("paper").value = state.paper;
  $("transparent").checked = state.transparent;
}

// --- Bedienung -------------------------------------------------------------

$("preview").addEventListener("click", (e) => {
  const hit = (e.target as Element).closest("[data-i]");
  state.selected = hit ? Number(hit.getAttribute("data-i")) : null;
  renderPreview();
  renderLetter();
  save(KEY, state);
});

$("text").addEventListener("input", () => {
  state.text = $("text").value;
  state.pins = { letters: {}, joins: {} }; // Positionen verschieben sich beim Tippen
  state.selected = null;
  state.variant = 0;
  state.overlay = null;
  state.showOverlay = false;
  syncControls();
  update();
  commit();
});

const sliders: [string, (v: number) => void][] = [
  ["interlock", (v) => (state.interlock = v)],
  ["target", (v) => (state.target = v)],
  ["stroke", (v) => (state.style = { ...state.style, stroke: v })],
  ["barHigh", (v) => (state.style = { ...state.style, barHigh: v })],
  ["barLow", (v) => (state.style = { ...state.style, barLow: v })],
  ["wordGap", (v) => (state.style = { ...state.style, wordGap: v })],
  ["opacity", (v) => (state.opacity = v)],
];
for (const [id, set] of sliders) {
  $(id).addEventListener("input", () => {
    set(Number($(id).value));
    update();
  });
  $(id).addEventListener("change", commit);
}

$("targetFree").addEventListener("change", () => {
  state.target = $("targetFree").checked ? null : Math.round(layout?.width ?? 2400);
  syncControls();
  update();
  commit();
});
$("overlay").addEventListener("change", () => {
  state.showOverlay = $("overlay").checked;
  update();
  commit();
});
for (const id of ["ink", "paper"] as const) {
  $(id).addEventListener("input", () => {
    state[id] = $(id).value;
    update();
  });
  $(id).addEventListener("change", commit);
}
$("transparent").addEventListener("change", () => {
  state.transparent = $("transparent").checked;
  save(KEY, state);
  commit();
});
$("barRight").addEventListener("change", () => {
  const i = state.selected;
  if (i === null || !layout) return;
  const cur = state.pins.joins[i] ?? layout.joins[i] ?? { type: "none" };
  state.pins.joins[i] = { ...cur, bar: $("barRight").checked };
  update();
  commit();
});
$("resetLetter").addEventListener("click", () => {
  const i = state.selected;
  if (i === null) return;
  delete state.pins.letters[i];
  delete state.pins.joins[i];
  delete state.pins.joins[i - 1];
  update();
  commit();
});

addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    if (e.shiftKey) restore(future, past);
    else restore(past, future);
    return;
  }
  if (document.activeElement === $("text")) return;
  const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
  if (step && variants[state.variant + step]) {
    state.variant += step;
    update();
    commit();
  }
});

// --- Vorlagen ----------------------------------------------------------------

const presets = () => [...BUILTIN, ...userPresets];
const escapeHtml = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
function renderPresets() {
  $<HTMLSelectElement>("preset").innerHTML =
    `<option value="">Vorlagen …</option>` + presets().map((p, k) => `<option value="${k}">${escapeHtml(p.name)}</option>`).join("");
}
function usePreset(p: Preset) {
  state = fromPreset(p, state);
  syncControls();
  update();
  commit();
}
const toPreset = (name: string): Preset => ({
  name,
  text: state.text,
  style: state.style.id,
  styleValues: { stroke: state.style.stroke, barHigh: state.style.barHigh, barLow: state.style.barLow, wordGap: state.style.wordGap },
  controls: { targetWidth: state.target, interlock: state.interlock },
  variant: state.variant,
  pins: structuredClone(state.pins),
  ...(state.overlay ? { overlay: state.overlay } : {}),
});
$("preset").addEventListener("change", () => {
  const sel = $<HTMLSelectElement>("preset"), p = presets()[Number(sel.value)];
  sel.value = "";
  if (p) usePreset(p);
});
$("savePreset").addEventListener("click", () => {
  const name = prompt("Name der Vorlage", state.text)?.trim();
  if (!name) return;
  userPresets = [...userPresets.filter((p) => p.name !== name), toPreset(name)];
  save(PRESETS, userPresets);
  renderPresets();
});
$("exportPreset").addEventListener("click", () =>
  download(`${slug(state.text)}.json`, new Blob([JSON.stringify(toPreset(state.text), null, 2)], { type: "application/json" })),
);
$("importPreset").addEventListener("change", async () => {
  const input = $("importPreset"), file = input.files?.[0];
  if (!file) return;
  try {
    const p = JSON.parse(await file.text()) as Preset;
    const ok = typeof p.name === "string" && typeof p.text === "string" && typeof p.controls?.interlock === "number" &&
      typeof p.pins?.letters === "object" && typeof p.pins?.joins === "object";
    if (!ok) throw new Error("Format");
    userPresets = [...userPresets.filter((q) => q.name !== p.name), p];
    save(PRESETS, userPresets);
    renderPresets();
    usePreset(p);
  } catch {
    $("status").textContent = "Vorlage ungültig – ignoriert";
  } finally {
    input.value = "";
  }
});

// --- Export ------------------------------------------------------------------

function download(name: string, blob: Blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const slug = (t: string) =>
  t.trim().toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "kairos";
const exportSvg = () => (layout ? svgString(layout, state.style, { ink: state.ink, paper: state.transparent ? null : state.paper }) : null);

$("exportSvg").addEventListener("click", () => {
  const t = exportSvg();
  if (t) download(`${slug(state.text)}.svg`, new Blob([t], { type: "image/svg+xml" }));
});
$("exportPng").addEventListener("click", async () => {
  const t = exportSvg();
  if (!t) return;
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([t], { type: "image/svg+xml" }));
  await img.decode();
  const scale = Number($<HTMLSelectElement>("pngScale").value), c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(img.src);
  c.toBlob((b) => b && download(`${slug(state.text)}.png`, b), "image/png");
});

renderPresets();
update();
syncControls();
```

- [ ] **Schritt 3: Start-Eintrag fürs Browser-Fenster** – `.claude/launch.json`

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "kairos", "runtimeExecutable": "bun", "runtimeArgs": ["run", "dev"], "port": 3457 }
  ]
}
```

- [ ] **Schritt 4: Typprüfung und Bündeln**

Befehle:
- `bunx tsc --noEmit -p .` – erwartet: keine Ausgabe, Exit-Code 0.
- `bun build ./index.html --outdir out/build` – erwartet: `index.html`, eine `index-*.js` und `die-flaeche-overlay-*.jpg`.

- [ ] **Schritt 5: Im Browser-Fenster prüfen**

`preview_start` mit `kairos` aufrufen (läuft auf Port 3457), dann nacheinander:
1. Beim Laden erscheint „DIE FLÄCHE“ wie in `out/die-flaeche.png`. Varianten 1–6 sind da, keine Konsolenfehler.
2. „Original drüber“ an: Das Foto liegt darunter, D-I-E decken sich.
3. Klick auf L: Das Feld „Buchstabe „L““ zeigt links „automatisch (verschachteln)“ und rechts „automatisch (unterfahren)“. Griffe sind sichtbar.
4. „Verbindung links“ auf „keine“: Das L steht in voller Höhe neben dem F.
5. Klick auf eine freie Fläche, dann ⌘Z: Das L ist wieder verschachtelt, `localStorage["kairos.state"]` hat leere Pins.
6. Vorlage „HAGEN AAD FOCK“ wählen: Bei AA treffen sich die Füße und der Balken läuft durch, das O liegt unter dem F.
7. Erstes A wählen, Breiten-Griff ziehen: Pin `{"1":{"w":…}}` ist gesetzt. ⌘Z entfernt ihn.
8. „Zielbreite frei“ aus, Regler bewegen: Die Zeile wird breiter oder schmaler, am Anschlag kommt ein Hinweis.
9. Text „ÜBER“ eintippen: Hinweis `Zeichen „Ü“ noch nicht entworfen`, Platzhalter-Kasten.
10. Text „DIE FLÄCHE“ zurück. „SVG“ und „PNG“ laden je eine Datei `die-flaeche.*` herunter.
11. Neu laden: Der letzte Stand ist wieder da.

- [ ] **Schritt 6: Commit**

```bash
git add index.html src/ui.ts .claude/launch.json
git commit -m "feat: Oberfläche mit Varianten, Griffen, Verbindungs-Menü, Overlay, Vorlagen und Export" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Aufgabe 8: Abnahme M1 mit Hagen

**Dateien:**
- Ändern (nur bei Bedarf): `src/glyphs.ts`, `src/style.ts` (Startwerte), `presets/hagen-aad-fock.json`
- Neu: `README.md`

- [ ] **Schritt 1: Kalibrieren gegen das Original**

Ausgangslage: Im Prototyp deckten sich D-I-E fast exakt. Ab F lag alles 30–50 Einheiten zu weit links, weil das erste E im Original breiter ist (287 statt 265).

Vorgehen:
1. App mit Vorlage DIE FLÄCHE öffnen, „Original drüber“ an, Screenshot machen.
2. Weicht ein Stamm um mehr als eine Strichstärke (26) vom Foto ab, nur einen Startwert ändern. Zuerst `glyphE.params.w` in `src/glyphs.ts`: `R(200, 265, 330)` → `R(200, 276, 330)`. Sonst `wordGap` in `src/style.ts`.
3. Danach `bun test` (der Referenztest muss grün bleiben) und einen neuen Screenshot.
4. Höchstens drei Runden. Den Screenshot mit `SendUserFile` an Hagen schicken.

- [ ] **Schritt 2: HAGEN AAD FOCK mit Hagen ausarbeiten**

1. Vorlage öffnen. Hagen formt per Griffen und Verbindungs-Menü, Claude bedient nach Ansage.
2. Ergebnis über „Vorlage exportieren“ speichern und die heruntergeladene JSON als `presets/hagen-aad-fock.json` übernehmen. `name` bleibt „HAGEN AAD FOCK“.
3. Prüfen: `bun test`. Der Test „AA mit gemeinsamen Füßen …“ prüft die erste Fassung; ändert Hagen die AA-Verbindung, diesen Test an die neue Fassung anpassen.

- [ ] **Schritt 3: README** – `README.md`

```markdown
# KAIROS Font (Projekt HabUndGutFont)

Display-Schrift im Duktus der Wiener Moderne um 1902 (Vorlage: Schriftzug „DIE FLÄCHE“, *Die Fläche* Bd. I S. 97) und eine Werkstatt, die Text zu ineinandergreifenden Schriftzügen setzt.

- Spec: `docs/superpowers/specs/2026-10-06-kairos-font-design.md`
- Plan M1: `docs/superpowers/plans/2026-10-06-kairos-font-m1.md`

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
| `src/render.ts` | Layout → SVG |
| `src/ui.ts` + `index.html` | Oberfläche |
| `presets/` | mitgelieferte Vorlagen |
```

- [ ] **Schritt 4: Gesamtprüfung**

Befehle:
- `bun test` – erwartet: alle grün.
- `bunx tsc --noEmit -p .` – erwartet: keine Fehler.

Danach im Browser-Fenster die Punkte 1, 6 und 10 aus Aufgabe 7, Schritt 5 wiederholen.

- [ ] **Schritt 5: Abnahme durch Hagen (Spec Abschnitt 10)**

Screenshots von DIE FLÄCHE (mit Original) und HAGEN AAD FOCK (Engine-Ergebnis und Vorlage) mit `SendUserFile` schicken. M1 ist abgenommen, wenn Hagen beide als gelungen bestätigt.

- [ ] **Schritt 6: Commit**

```bash
git add README.md src presets test
git commit -m "chore: Abnahme M1 – Kalibrierung, ausgearbeitete Namensvorlage, README" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Abdeckung der Spec

| Spec | Aufgabe |
|---|---|
| 2 Referenzmerkmale 1–10 | 2 (Formen, Maße), 3 (Regeln), 5 (Sichtprüfung) |
| 3 Entscheidungen M1 | 2, 4, 7 |
| 5.1 Einheiten | 2 |
| 5.2 Module | 1–7 |
| 5.3 Glyphen-Modell, Startideen G K N O | 2, Checkpoint 5 |
| 5.4 Regeln a–e | 3 (a–d), 4 (e) |
| 5.5 Suche, Bewertung, Gleichstand | 4 |
| 5.6 Pins | 4, 7 |
| 5.7 Vorlagen | 6, 7, 8 |
| 5.8 Renderer | 5 |
| 6 UI | 7 |
| 7 Fehlerfälle | 4 (Hinweise), 7 (Vorlage ungültig, Speicher gesperrt) |
| 8 Technik | 1, 7 |
| 10 Tests 1–6 | 2 (1), 3 (2, 3), 4 (4, 5, 6) |
| 10 Sichtprüfung, Abnahme | 5, 7, 8 |
| 12 Risiken | Checkpoint 5 (Formen), Kalibrierung 8 |
