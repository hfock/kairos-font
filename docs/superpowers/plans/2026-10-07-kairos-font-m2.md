# KAIROS Font M2 – Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** KAIROS Font als OTF und WOFF2, die beim Tippen verschmilzt wie die App bei Verschränkung 0,5, dazu Ziffern, Satz- und Plakat-Zeichen, Namens-Ligatur und Monogramm HAF; die aufgeschobenen M1-Punkte sind erledigt.

**Architecture:** `src/fontdata.ts` rechnet aus Engine und Glyphen alles, was der Font braucht: Grundglyphen, calt-Varianten (z. B. `F.nest`, `L.short.foot`), Vorschübe, Unterschneidung, die Feature-Datei und Sollwerte für den Test. `tools/export-font.ts` schreibt das nach `build/`. `tools/build_font.py` streicht die Skelette mit skia-pathops wie der Renderer, baut über UFO und ufo2ft OTF und WOFF2; `tools/test_font.py` formt die Sollwörter mit harfbuzz und vergleicht mit der Engine. Die Testseite `font.html` zeigt Webfont und Engine untereinander.

**Tech Stack:** TypeScript mit Bun 1.3 (ohne Framework, ohne Laufzeit-Abhängigkeiten); Python ≥ 3.11 über uv (PEP 723) mit fontTools 4.66 (+ brotli über `fonttools[woff]`), ufo2ft 3.9, ufoLib2 0.18, skia-pathops 0.9, uharfbuzz 0.56; Inkscape-CLI für Prüfblätter.

**Spec:** `docs/superpowers/specs/2026-10-07-kairos-font-m2-design.md` (beruht auf `docs/superpowers/specs/2026-10-06-kairos-font-design.md`)

## Global Constraints

- Verschmelzen im Font wie die App bei Verschränkung 0,5: a Verschachteln, b Unterfahren, c Bogen- oder Armende in den Stamm. Kein Stamm- oder Fuß-Teilen, kein Balken-Verbinden.
- Technik: OpenType `calt` mit Glyphen-Varianten und Unterschneidung (GPOS `kern`), aus der Engine erzeugt; keine Paar-Ligaturen.
- Namens-Ligatur: `liga`, immer an; nur die ganze Folge „HAGEN AAD FOCK“ als eigenständige Wortgruppe (Kleinbuchstaben eingeschlossen); Form aus `presets/hagen-aad-fock.json`.
- Monogramm HAF: `dlig`, „HAF“ nur als ganzes Wort („HAFEN“ bleibt normal); zusätzlich als Zeichen U+E000.
- Neue Zeichen: Ziffern 0–9; Satz-Grundset `. , : ; ! ? - – ( ) / & ' ’ " „ “ ‚ ‘ « »`; Plakat-Zeichen `€ % @ # + = * § …`; Leerzeichen und geschütztes Leerzeichen. Alle Zeichen gibt es in App und Font.
- Kleinbuchstaben-Eingabe: a–z und äöü zeigen bis M4 die Versalien, ß zeigt ẞ.
- Formate: OTF mit CFF-Konturen, WOFF2. Familie „KAIROS Font“, Schnitt „Regular“, PostScript `KAIROSFont-Regular`, Version 0.2; Glyphennamen nach Adobe Glyph List.
- Maße: 1000 Einheiten je Geviert, Versalhöhe 700, Ascender 760, Descender −240, Zeilenabstand 0.
- Konturen wie der Renderer: Skelett, Strich 26, stumpfe Enden, Gehrung (Grenze 4), Überlappungen vereinigt, Band von der Grundlinie bis zur eigenen Höhe beschnitten; `,` `;` `„` `‚` reichen bis −130.
- Werkzeuge: Bun schreibt Geometrie, Varianten, Abstände und Feature-Datei; Python über uv baut mit fontTools, ufoLib2, ufo2ft, skia-pathops und brotli; Tests mit uharfbuzz.
- Ausgabe `dist/KAIROSFont-Regular.otf` und `.woff2`; `build/` und `dist/` git-ignoriert; Befehl `bun run font`.
- Abnahme: Browser (Testseite mit WOFF2) und Pages bzw. TextEdit mit installiertem OTF; kein InDesign.
- Oberfläche, Kommentare und Hinweistexte deutsch; bestehende Hinweistexte bleiben wörtlich.
- Commits enden mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Bewusste Abweichungen von der Spec

Im Prototyp geklärt; der Code in diesem Plan ist dort gelaufen (72 Bun-Tests, 10 Font-Sollwerte, Browser).

| Spec | Plan | Grund |
|---|---|---|
| §4.2 `&` „aus E-Armen und S-Schwung“ | Schleife oben, Bein nach rechts unten, Bauch mit Schwanz bis zur unteren Linie | die „Et“-Form las sich als „Ct“ |
| §4.2 `§` „zwei kleine S übereinander“ | C-Kopf, Ring auf halber Höhe, D-Fuß | zwei S wirkten in der Mitte unruhig |
| §4.2 `€` | Querstriche ragen 40 links über den Bogen, der Bogen ist um 40 eingerückt | die Tinte beginnt bei x = 0 wie bei allen Zeichen |
| Satzzeichen (§4.2) | ohne Höhenregler: verschachtelt (z. B. „F.“) bleiben sie unverändert; kein Höhengriff | Punkte und Striche sollen nicht schrumpfen |
| §5.3 „Für F + X wird der übernächste Buchstabe geprüft“ | X umfasst auch Ziffern und Satzzeichen, die Engine verschachtelt sie ebenso; rund 500 Kontextregeln | gleiches Verhalten wie die App |
| §5.3 Unterschneidung „an der freien Seite `spacing()` gegen alle Grundglyphen“ | gegen die Glyphe, wie die Engine sie beim Setzen hatte: eigene Arm-, Fuß- und Bogenverlängerung zurückgenommen | die Engine setzt einen Buchstaben, bevor seine rechte Verbindung ihn verlängert (sonst steht „ÄC“ in „FLÄCHE“ 8,6 Einheiten zu eng) |
| §5.1 „Werte unter 1 Einheit entfallen“ | ganzzahlig gerundet, Wert 0 entfällt | gleichwertig |
| §7.3 „Positionen auf ±1 Einheit wie die Engine“ | jeder Schritt zwischen Nachbarn auf ±1 | ganzzahlige Vorschübe runden je Schritt, über ein Wort summiert sich das |
| §7.4 „Bildvergleich, höchstens 1 % der Tintenpixel“ | Flächenvergleich mit skia-pathops: was mehr als 1,5 Einheiten abweicht, höchstens 1 % der Tintenfläche | vektorgenau ohne Rasterbild; Rundung um ±1 zählt nicht |
| §5.5 Testseite | Adresse `/font` | Bun benennt die Route nach der Datei |
| §4.3 Monogramm | Startidee umgesetzt; Feinform nach der Sichtprüfung in Task 4 | – |

## Dateistruktur

| Datei | Aufgabe | Task |
|---|---|---|
| `src/engine.ts` | Pin des vorletzten Buchstabens nur, wenn er ihn trägt | 1 |
| `src/render.ts` | Rauten für Verbindungs-Pins, Clip-Band ±10 000 000, Unterlängen, Satzzeichen ohne Höhe | 1, 3 |
| `src/ui.ts` | Rauten durchreichen, Zielbreiten-Höchstwert, Ziehen je Bild, Balken-Häkchen, Höhengriff nur mit Regler | 1, 3 |
| `src/glyphs.ts` | Ziffern, Satz- und Plakat-Zeichen, Monogramm; Feld `desc` | 2–4 |
| `src/fontdata.ts` | neu: Font-Daten aus der Engine | 5 |
| `tools/export-font.ts` | neu: `build/kairos.json`, `build/features.fea` | 5 |
| `tools/build_font.py` | neu: OTF und WOFF2 | 6 |
| `tools/test_font.py` | neu: Prüfung mit harfbuzz | 7 |
| `font.html`, `src/fonttest.ts` | neu: Testseite | 8 |
| `src/assets.d.ts` | Import von `.woff2` | 8 |
| `tools/sheet.ts` | Prüfblätter Ziffern und Zeichen | 2–4 |
| `test/*.test.ts` | Tests | 1–5 |
| `package.json`, `.gitignore`, `README.md` | Befehle, Ignorieren, Doku | 5–9 |

Arbeitsweise in jedem Task: erst die Tests ändern und rot sehen, dann den Code; `bun test` und `bunx tsc --noEmit -p .` müssen grün sein, bevor committet wird. Alle Ersetzungen sind wörtlich; der alte Text kommt in der Datei genau einmal vor.

---

### Task 1: Wartung aus M1: Pin des vorletzten Buchstabens, Clip-Band, Verbindungs-Pins, Ziehen, Zielbreite, Balken-Häkchen

**Dateien:**
- Ändern: `src/engine.ts` (Pin des vorletzten Buchstabens)
- Ändern: `src/render.ts` (Verbindungs-Pins, Clip-Band)
- Ändern: `src/ui.ts` (Rauten durchreichen, Zielbreiten-Höchstwert, Ziehen je Bild, Balken-Häkchen)
- Tests: `test/engine.test.ts`, `test/render.test.ts`

**Schnittstellen:**
- Verbraucht: `conflicts(p, lock)` in `src/engine.ts` (gibt es schon), `Placed`, `Dock`
- Liefert: `RenderOpts.pinnedJoins?: number[]` (Index des linken Buchstabens je gepinnter Grenze); Rauten mit `class="pinj"` nur in der Vorschau

- [ ] **Schritt 1: Tests schreiben**

In `test/engine.test.ts` ersetzen:

```ts
test("Buchstaben-Pin widerspricht Verbindungs-Pin: der Verbindungs-Pin rechts daneben gilt weiter", () => {
```

durch:

```ts
test("verworfener Arm-Pin des vorletzten Buchstabens: kein Folgehinweis, Verbindungs-Pin danach gilt", () => {
  // F4 trägt top 300 (außerhalb des Spielraums) nicht; die Armkürzung vor dem Ä muss trotzdem greifen
  const r = layoutLine("DIE FLÄCHE", opts({ pins: { letters: { 4: { top: 300 } }, joins: { 4: { type: "nest" }, 5: { type: "underrun" } } } }));
  expect(r.warnings).toEqual(["Pin bei „F“ nicht erfüllbar"]);
  expect(r.variants[0].joins[5].type).toBe("underrun");
});

test("Buchstaben-Pin widerspricht Verbindungs-Pin: der Verbindungs-Pin rechts daneben gilt weiter", () => {
```

In `test/render.test.ts` ersetzen:

```ts
  expect(svg).toMatch(/<clipPath id="kairos-zeile"><rect x="-100000" y="0" width="200000" height="700"\/><\/clipPath><g clip-path="url\(#kairos-zeile\)">/);
```

durch:

```ts
  expect(svg).toMatch(/<clipPath id="kairos-zeile"><rect x="-10000000" y="0" width="20000000" height="700"\/><\/clipPath><g clip-path="url\(#kairos-zeile\)">/);
```

In `test/render.test.ts` ersetzen:

```ts
  expect(svg).toMatch(/class="hits"[\s\S]*id="ink"/); // Klickflächen liegen unter der Tinte
});
```

durch:

```ts
  expect(svg).toMatch(/class="hits"[\s\S]*id="ink"/); // Klickflächen liegen unter der Tinte
});

test("Vorschau: Verbindungs-Pins bekommen eine Raute unter der Grenze, Export nicht", () => {
  const svg = svgString(v, S, { ink: "#000", paper: "#fff", interactive: true, pinnedJoins: [4, 7, 3] }); // 3 = Wortgrenze: keine Marke
  expect(svg.match(/class="pinj"/g)!.length).toBe(2);
  const f = v.glyphs.find((g) => g.index === 4)!, l = v.glyphs.find((g) => g.index === 5)!;
  const cx = Math.round(((f.x + f.inst.prof.maxX + l.x + l.inst.prof.minX) / 2) * 10) / 10;
  expect(svg).toContain(`<path class="pinj" d="M${cx} -39L`);
  expect(svgString(v, S, { ink: "#000", paper: null, pinnedJoins: [4] })).not.toContain("pinj");
});

test("Zeilenband reicht auch für sehr lange Zeilen", () => {
  const long = layoutLine("HAGEN AAD FOCK ".repeat(40), { style: S, interlock: 0.5, targetWidth: null, pins: { letters: {}, joins: {} } }).variants[0];
  expect(long.maxX).toBeGreaterThan(100000); // ~560 Zeichen
  const [, bx, bw] = svgString(long, S, { ink: "#000", paper: null }).match(/id="kairos-zeile"><rect x="([-\d.]+)" y="0" width="([\d.]+)"/)!.map(Number);
  expect(bx).toBeLessThanOrEqual(long.minX);
  expect(bx + bw).toBeGreaterThanOrEqual(long.maxX);
});
```

- [ ] **Schritt 2: Tests laufen lassen und Fehlschlag prüfen**

Run: `bun test`
Expected: FAIL in genau diesen Tests:
  - „SVG: ein Gruppe je Buchstabe, ein Pfad je Strich, keine NaN“
  - „Vorschau: Verbindungs-Pins bekommen eine Raute unter der Grenze, Export nicht“
  - „Zeilenband reicht auch für sehr lange Zeilen“
  - „verworfener Arm-Pin des vorletzten Buchstabens: kein Folgehinweis, Verbindungs-Pin danach gilt“

- [ ] **Schritt 3: Code**

In `src/engine.ts` ersetzen:

```ts
    const prevTop = usePins && prev ? o.pins.letters[prev.index]?.top : undefined;
```

durch:

```ts
    const pinP = usePins && prev ? o.pins.letters[prev.index] : undefined;
    const prevTop = pinP && !conflicts(prev!.inst.p, pinP) ? pinP.top : undefined; // wie lockL: nur ein Pin, den der Buchstabe wirklich trägt
```

In `src/render.ts` ersetzen:

```ts
  pinned?: number[];
  overlay?: Overlay | null;
```

durch:

```ts
  pinned?: number[];
  pinnedJoins?: number[]; // Grenzen mit Verbindungs-Pin, Index des linken Buchstabens
  overlay?: Overlay | null;
```

In `src/render.ts` ersetzen:

```ts
      out.push(`</g>`);
    }
    out.push(`</g>`);
  }
```

durch:

```ts
      out.push(`</g>`);
    }
    // Verbindungs-Pins: Raute unter der Grenze zwischen zwei Buchstaben
    for (const i of o.pinnedJoins ?? []) {
      const a = l.glyphs.find((g) => g.index === i), b = l.glyphs.find((g) => g.index === i + 1);
      if (!a || !b) continue;
      const cx = r1((a.x + a.inst.prof.maxX + b.x + b.inst.prof.minX) / 2), cy = -m / 2;
      out.push(`<path class="pinj" d="M${cx} ${cy - 9}L${cx + 9} ${cy}L${cx} ${cy + 9}L${cx - 9} ${cy}Z" fill="#b03a2e" stroke="none"/>`);
    }
    out.push(`</g>`);
  }
```

In `src/render.ts` ersetzen:

```ts
<rect x="-100000" y="0" width="200000" height="${H}"/>
```

durch:

```ts
<rect x="-10000000" y="0" width="20000000" height="${H}"/>
```

In `src/ui.ts` ersetzen:

```ts
import type { Params } from "./glyphs";
```

durch:

```ts
import type { Dock, Params } from "./glyphs";
```

In `src/ui.ts` ersetzen:

```ts
  $("status").textContent = res.warnings.join(" · ");
```

durch:

```ts
  $("status").textContent = res.warnings.join(" · ");
  $("target").max = String(Math.max(8000, 600 * [...state.text].length)); // ~600 Einheiten je Zeichen reichen für jede Breite
```

In `src/ui.ts` ersetzen:

```ts
    pinned: Object.keys(state.pins.letters).map(Number),
    overlay,
```

durch:

```ts
    pinned: Object.keys(state.pins.letters).map(Number),
    pinnedJoins: Object.keys(state.pins.joins).map(Number),
    overlay,
```

In `src/ui.ts` ersetzen:

```ts
  const clamp = (k: string, v: number) => Math.min(def.params[k].max, Math.max(def.params[k].min, v));
  const move = (ev: PointerEvent) => {
    const g = layout?.glyphs.find((q) => q.index === i);
```

durch:

```ts
  const clamp = (k: string, v: number) => Math.min(def.params[k].max, Math.max(def.params[k].min, v));
  // höchstens einmal je Bildschirmbild neu setzen: mit Zielbreite dauert ein Durchlauf bis ~90 ms
  let frame = 0, last: PointerEvent | null = null;
  const move = (ev: PointerEvent) => {
    last = ev;
    if (!frame) frame = requestAnimationFrame(step);
  };
  const step = () => {
    frame = 0;
    const ev = last!;
    const g = layout?.glyphs.find((q) => q.index === i);
```

In `src/ui.ts` ersetzen:

```ts
  const up = () => {
    removeEventListener("pointermove", move);
```

durch:

```ts
  const up = () => {
    if (frame) {
      cancelAnimationFrame(frame);
      step(); // letzte Position nicht verlieren
    }
    removeEventListener("pointermove", move);
```

In `src/ui.ts` ersetzen:

```ts
  // Balken verbinden geht nur, wenn der eigene Balken bis an die rechte Seite reicht (Knoten von B M P R W X Y verbinden nie)
  $("barRight").disabled = joinOptions(layout, g.index).length === 0 || !g.inst.docks.some((d) => d.kind === "bar" && d.right);
```

durch:

```ts
  // Balken verbinden nur, wenn beide Balken bis an die Grenze reichen und auf derselben Linie liegen (Knoten von B M P R W X Y verbinden nie)
  const bar = (q: Placed | undefined, side: "left" | "right") =>
    q?.inst.docks.find((d): d is Extract<Dock, { kind: "bar" }> => d.kind === "bar" && d[side]);
  const a = bar(g, "right"), b = bar(layout.glyphs.find((q) => q.index === g.index + 1), "left");
  $("barRight").disabled = !a || !b || Math.abs(a.y - b.y) > 0.5;
```

- [ ] **Schritt 4: Tests und Typen prüfen**

Run: `bun test && bunx tsc --noEmit -p .`
Expected: `64 pass`, `0 fail`; tsc ohne Ausgabe (Exit 0)

- [ ] **Schritt 5: Browser-Prüfung der Oberfläche**

`bun run dev` starten, http://localhost:3457 öffnen (oder mit den eingebauten Browser-Werkzeugen; geht das nicht: DONE_WITH_CONCERNS melden, der Controller prüft). Erwartet:
- Vorlage „HAGEN AAD FOCK“ laden: unter den vier gepinnten Grenzen je eine rote Raute (`document.querySelectorAll('.pinj').length === 4`).
- `document.getElementById('target').max` ist `"8400"` (14 Zeichen × 600).
- Text „PE AA“: P auswählen → Häkchen „Balken nach rechts verbinden“ gesperrt; erstes A auswählen → anklickbar.
- Höhengriff eines Buchstabens ziehen: die Vorschau folgt, nach dem Loslassen steht der Pin auf der letzten Position; keine Fehler in der Konsole.

- [ ] **Schritt 6: Commit**

```bash
git add src/engine.ts src/render.ts src/ui.ts test/engine.test.ts test/render.test.ts
git commit -m "fix: Pin des vorletzten Buchstabens, Verbindungs-Pins markiert, Ziehen je Bild, Zielbreite wächst mit, Balken-Häkchen nur wenn möglich

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Ziffern 0–9

**Dateien:**
- Ändern: `src/glyphs.ts` (Import `Pt`, Abschnitt „Ziffern (M2)“ vor dem Platzhalter, Zeichentabelle `GLYPHS`)
- Ändern: `tools/sheet.ts` (Prüfblatt „ziffern“)
- Tests: `test/glyphs.test.ts`

**Schnittstellen:**
- Verbraucht: Helfer in `src/glyphs.ts`: `R`, `h`, `KAPPA`, `inkTop`, `cTop`, `cBot`, `capDrop`, `belly`, `glyphO`
- Liefert: `GLYPHS["0"]` … `GLYPHS["9"]`; modulinterne Helfer `mapPts(st, f)`, `head2(p, s, y)` (Task 3 nutzt beide)

- [ ] **Schritt 1: Tests schreiben**

In `test/glyphs.test.ts` ersetzen:

```ts
const ALL = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜẞ"];
```

durch:

```ts
const ALL = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜẞ"];
const DIGITS = [..."0123456789"];
```

In `test/glyphs.test.ts` ersetzen:

```ts
test("Tinte bleibt endlich und im Buchstabenfeld (Höhe, x ≥ linker Bezug)", () => {
  const bad = new Set<string>();
  for (const g of [...ALL.map((c) => GLYPHS[c]), PLACEHOLDER])
```

durch:

```ts
test("Ziffern sind entworfen", () => {
  expect(DIGITS.filter((c) => !GLYPHS[c])).toEqual([]);
});

test("Tinte bleibt endlich und im Buchstabenfeld (Höhe, x ≥ linker Bezug)", () => {
  const bad = new Set<string>();
  for (const g of [...[...ALL, ...DIGITS].map((c) => GLYPHS[c]), PLACEHOLDER])
```

- [ ] **Schritt 2: Tests laufen lassen und Fehlschlag prüfen**

Run: `bun test`
Expected: FAIL in genau diesen Tests:
  - „Tinte bleibt endlich und im Buchstabenfeld (Höhe, x ≥ linker Bezug)“
  - „Ziffern sind entworfen“

- [ ] **Schritt 3: Code**

In `src/glyphs.ts` ersetzen:

```ts
import { C, L, closed, stroke, type Seg, type Stroke } from "./geom";
```

durch:

```ts
import { C, L, closed, stroke, type Pt, type Seg, type Stroke } from "./geom";
```

In `src/glyphs.ts` ersetzen:

```ts
/** Ersatz für noch nicht entworfene Zeichen. */
```

durch:

```ts
// ── Ziffern (M2) ──

/** Strich Punkt für Punkt abbilden (verschieben, um 180° drehen). */
const mapPts = (st: Stroke, f: (q: Pt) => Pt): Stroke => ({
  ...st,
  start: f(st.start),
  segs: st.segs.map((g): Seg => (g.k === "L" ? { k: "L", p: f(g.p) } : { k: "C", c1: f(g.c1), c2: f(g.c2), p: f(g.p) })),
});

const glyph0: GlyphDef = { ...glyphO, char: "0", params: { h, w: R(160, 200, 240) } };

const glyph1: GlyphDef = {
  char: "1",
  params: { h, w: R(60, 90, 140) },
  draw: (p, s) => [stroke(p.w, 0, L(p.w, inkTop(p, s))), stroke(0, s.barHigh * p.h, L(p.w, cTop(p, s)))], // Fahne von der oberen Balkenlinie
  docks: () => [],
};

/** Kopf mit Ecke oben rechts (gespiegelter S-Kopf), rechts hinab bis y. */
function head2(p: Params, s: Style, y: number): Seg[] {
  const t = cTop(p, s), r = 0.143 * inkTop(p, s), k = KAPPA * r;
  return [L(p.w - r, t), C(p.w - r + k, t, p.w, t - r + k, p.w, t - r), L(p.w, y)];
}

const glyph2: GlyphDef = {
  char: "2",
  params: { h, w: R(180, 230, 290) },
  draw: (p, s) => [stroke(0, cTop(p, s), ...head2(p, s, s.barHigh * p.h), L(0, cBot(s)), L(p.w, cBot(s)))],
  docks: () => [],
};

const glyph3: GlyphDef = {
  char: "3",
  params: { h, w: R(180, 230, 290) },
  draw(p, s) {
    const t = cTop(p, s), y = s.barHigh * p.h, w1 = 0.82 * p.w, r = (t - y) / 2, k = KAPPA * r, a = 0.35 * p.w;
    // ein Strich: Bauch oben, Taille nach links, spitz umkehren in den Segel-Bauch unten
    return [
      stroke(0, t, L(w1 - r, t), C(w1 - r + k, t, w1, t - r + k, w1, t - r), C(w1, y + r - k, w1 - r + k, y, w1 - r, y), L(a, y),
        ...belly(a, y, p.w, cBot(s), 47 * p.h), L(0, cBot(s))),
    ];
  },
  docks: () => [],
};

const glyph4: GlyphDef = {
  char: "4",
  params: { h, w: R(200, 250, 300) },
  draw(p, s) {
    const xs = 0.72 * p.w, y = s.barLow * p.h;
    return [stroke(xs, 0, L(xs, inkTop(p, s))), stroke(xs, cTop(p, s), L(0, y), L(p.w, y))]; // Querbalken auf der unteren Linie
  },
  docks: () => [],
};

const glyph5: GlyphDef = {
  char: "5",
  params: { h, w: R(180, 230, 290) },
  draw(p, s) {
    const t = cTop(p, s), b = cBot(s), y = s.barHigh * p.h, a = 0.3 * p.w;
    return [stroke(0.85 * p.w, t, L(0, t), L(0, y), L(a, y), ...belly(a, y, p.w, b, 47 * p.h), L(0, b))];
  },
  docks: () => [],
};

/** 6: Kopf wie beim C, Schleife unten bis zur oberen Balkenlinie. */
function six(p: Params, s: Style): Stroke {
  const t = cTop(p, s), b = cBot(s), rc = 0.143 * inkTop(p, s), kc = KAPPA * rc, r = p.w / 2, k = KAPPA * r, yk = s.barHigh * p.h;
  return stroke(0.85 * p.w, t, L(rc, t), C(rc - kc, t, 0, t - rc + kc, 0, t - rc), L(0, b + r),
    C(0, b + r - k, r - k, b, r, b), C(r + k, b, p.w, b + r - k, p.w, b + r), L(p.w, yk - r),
    C(p.w, yk - r + k, r + k, yk, r, yk), C(r - k, yk, 0, yk - r + k, 0, yk - r));
}

const glyph6: GlyphDef = { char: "6", params: { h, w: R(180, 230, 280) }, draw: (p, s) => [six(p, s)], docks: () => [] };

const glyph9: GlyphDef = {
  char: "9",
  params: { h, w: R(180, 230, 280) },
  draw: (p, s) => [mapPts(six(p, s), (q) => ({ x: p.w - q.x, y: inkTop(p, s) - q.y }))], // 6 um 180° gedreht: Schleife oben bis zur unteren Linie
  docks: () => [],
};

const glyph7: GlyphDef = {
  char: "7",
  params: { h, w: R(180, 230, 290) },
  draw(p, s) {
    const t = cTop(p, s), x0 = 0.3 * p.w, d = capDrop(p.w - x0, t, s);
    return [stroke(0, t, L(p.w, t), L(x0 - ((p.w - x0) * d) / t, -d))];
  },
  docks: () => [],
};

const glyph8: GlyphDef = {
  char: "8",
  params: { h, w: R(180, 230, 290) },
  draw(p, s) {
    const t = cTop(p, s), b = cBot(s), y = s.barHigh * p.h, w1 = 0.8 * p.w, x1 = (p.w - w1) / 2, r1 = (t - y) / 2, k1 = KAPPA * r1;
    const r = p.w / 2, k = KAPPA * r;
    return [
      closed(stroke(x1 + r1, t, L(x1 + w1 - r1, t), C(x1 + w1 - r1 + k1, t, x1 + w1, t - r1 + k1, x1 + w1, t - r1),
        C(x1 + w1, y + r1 - k1, x1 + w1 - r1 + k1, y, x1 + w1 - r1, y), L(x1 + r1, y),
        C(x1 + r1 - k1, y, x1, y + r1 - k1, x1, y + r1), C(x1, t - r1 + k1, x1 + r1 - k1, t, x1 + r1, t))),
      closed(stroke(0, b + r, L(0, y - r), C(0, y - r + k, r - k, y, r, y), C(r + k, y, p.w, y - r + k, p.w, y - r),
        L(p.w, b + r), C(p.w, b + r - k, r + k, b, r, b), C(r - k, b, 0, b + r - k, 0, b + r))),
    ];
  },
  docks: () => [],
};

/** Ersatz für noch nicht entworfene Zeichen. */
```

In `src/glyphs.ts` ersetzen:

```ts
  [glyphA, glyphAE, glyphB, glyphC, glyphD, glyphE, glyphF, glyphG, glyphH, glyphI, glyphJ, glyphK, glyphL, glyphM, glyphN, glyphO, glyphOE, glyphP, glyphQ, glyphR, glyphS, glyphSZ, glyphT, glyphU, glyphUE, glyphV, glyphW, glyphX, glyphY, glyphZ].map((g) => [g.char, g]),
```

durch:

```ts
  [
    glyphA, glyphAE, glyphB, glyphC, glyphD, glyphE, glyphF, glyphG, glyphH, glyphI, glyphJ, glyphK, glyphL, glyphM, glyphN, glyphO, glyphOE,
    glyphP, glyphQ, glyphR, glyphS, glyphSZ, glyphT, glyphU, glyphUE, glyphV, glyphW, glyphX, glyphY, glyphZ,
    glyph0, glyph1, glyph2, glyph3, glyph4, glyph5, glyph6, glyph7, glyph8, glyph9,
  ].map((g) => [g.char, g]),
```

In `tools/sheet.ts` ersetzen:

```ts
  ["wiener-werkstaette", "WIENER WERKSTÄTTE", 0.5],
```

durch:

```ts
  ["wiener-werkstaette", "WIENER WERKSTÄTTE", 0.5],
  ["ziffern", "0 1 2 3 4 5 6 7 8 9", 0],
```

- [ ] **Schritt 4: Tests und Typen prüfen**

Run: `bun test && bunx tsc --noEmit -p .`
Expected: `65 pass`, `0 fail`; tsc ohne Ausgabe (Exit 0)

- [ ] **Schritt 5: Prüfblatt ansehen**

`bun run sheet` → `out/ziffern.png` öffnen. Erwartet: 0 schmaler als O; 1 mit Fahne von der oberen Balkenlinie; 2, 3, 5 mit Knoten auf der oberen Linie; 3 mit spitzer Taille; 4 mit Balken auf der unteren Linie; 6 und 9 gedreht gleich; 8 mit kleiner Schleife oben.

- [ ] **Schritt 6: Commit**

```bash
git add src/glyphs.ts test/glyphs.test.ts tools/sheet.ts
git commit -m "feat: Ziffern 0–9

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: Satz- und Plakat-Zeichen, Unterlängen im Renderer

**Dateien:**
- Ändern: `src/glyphs.ts` (Feld `desc` in `GlyphDef`, Abschnitt „Satz- und Plakatzeichen (M2)“, Zeichentabelle)
- Ändern: `src/render.ts` (Rahmen mit Unterlängen, Zeichen mit Unterlänge außerhalb des Bands, Höhe `?? 1`)
- Ändern: `src/ui.ts` (Höhengriff nur bei Höhenregler)
- Ändern: `tools/sheet.ts` (Prüfblatt „zeichen“)
- Tests: `test/glyphs.test.ts`, `test/render.test.ts`, `test/engine.test.ts` (Platzhalter jetzt „~“, weil „@“ entworfen ist)

**Schnittstellen:**
- Verbraucht: `mapPts`, `head2` aus Task 2; `glyphA`, `glyphO`, `bowlC`, `capDrop`
- Liefert: `GlyphDef.desc?: number` (Unterlänge, `,` `;` `„` `‚` = 130); Satzzeichen haben `params: {}` (kein `h`): Renderer, Oberfläche und Test lesen die Höhe als `p.h ?? 1`

- [ ] **Schritt 1: Tests schreiben**

In `test/glyphs.test.ts` ersetzen:

```ts
const DIGITS = [..."0123456789"];
```

durch:

```ts
const DIGITS = [..."0123456789"];
const MARKS = [...".,:;!?-–()/&'’\"„“‚‘«»€%@#+=*§…"]; // Spec M2 §3: Satz-Grundset und Plakat-Zeichen
```

In `test/glyphs.test.ts` ersetzen:

```ts
test("Ziffern sind entworfen", () => {
  expect(DIGITS.filter((c) => !GLYPHS[c])).toEqual([]);
});
```

durch:

```ts
test("Ziffern sowie Satz- und Plakat-Zeichen sind entworfen", () => {
  expect([...DIGITS, ...MARKS].filter((c) => !GLYPHS[c])).toEqual([]);
});
```

In `test/glyphs.test.ts` ersetzen:

```ts
  for (const g of [...[...ALL, ...DIGITS].map((c) => GLYPHS[c]), PLACEHOLDER])
    for (const p of variants(g)) {
      const top = S.capHeight * p.h;
```

durch:

```ts
  for (const g of [...[...ALL, ...DIGITS, ...MARKS].map((c) => GLYPHS[c]), PLACEHOLDER])
    for (const p of variants(g)) {
      const top = S.capHeight * (p.h ?? 1), bottom = -(g.desc ?? 0); // Satzzeichen ohne Höhenregler: volle Höhe; Komma mit Unterlänge
```

In `test/glyphs.test.ts` ersetzen:

```ts
        const ok = Number.isFinite(q.x) && Number.isFinite(q.y) && q.y >= -S.stroke && q.y <= top + S.stroke;
```

durch:

```ts
        const ok = Number.isFinite(q.x) && Number.isFinite(q.y) && q.y >= bottom - S.stroke && q.y <= top + S.stroke;
```

An das Ende von `test/glyphs.test.ts` anhängen:

```ts

test("Punkt: Quadrat in Strichstärke auf der Grundlinie; Komma und tiefe Anführungszeichen mit Unterlänge 130", () => {
  const ys = (c: string) => ink(GLYPHS[c].draw(defaults(GLYPHS[c]), S)).map((q) => q.y), xs = (c: string) => ink(GLYPHS[c].draw(defaults(GLYPHS[c]), S)).map((q) => q.x);
  expect([Math.min(...ys(".")), Math.max(...ys(".")), Math.min(...xs(".")), Math.max(...xs("."))]).toEqual([0, S.stroke, 0, S.stroke]);
  for (const c of [",", ";", "„", "‚"]) {
    expect(GLYPHS[c].desc).toBe(130);
    expect(Math.min(...ys(c))).toBeLessThan(-S.stroke); // reicht wirklich unter die Grundlinie
    expect(Math.min(...ys(c))).toBeGreaterThanOrEqual(-130);
  }
  for (const c of [...".:!?-–'\"’‘“«»…"]) expect(GLYPHS[c].desc).toBeUndefined();
});
```

In `test/render.test.ts` ersetzen:

```ts
test("Export ohne Bedienelemente; transparent ohne Papier", () => {
```

durch:

```ts
test("Komma mit Unterlänge: liegt außerhalb des Zeilenbands, der Rahmen reicht 130 tiefer", () => {
  const c = layoutLine("WIEN, 12.", { style: S, interlock: 0.5, targetWidth: null, pins: { letters: {}, joins: {} } }).variants[0];
  const svg = svgString(c, S, { ink: "#000", paper: null });
  expect(svg).toContain(`viewBox="${Math.round((c.minX - 60) * 10) / 10} -60 `);
  expect(svg).toMatch(/viewBox="[^"]+ 950"/); // 700 + 2 × 60 + 130
  const band = svg.indexOf('clip-path="url(#kairos-zeile)"'), comma = svg.indexOf('data-i="4"'), close = svg.indexOf("</g>", svg.lastIndexOf('data-i="8"'));
  expect(comma).toBeGreaterThan(close); // Komma (Index 4) erst nach dem Band
  expect(band).toBeGreaterThan(0);
});

test("Export ohne Bedienelemente; transparent ohne Papier", () => {
```

In `test/engine.test.ts` ersetzen:

```ts
  const r = layoutLine("@ÜBER", opts());
  expect(r.warnings).toEqual(["Zeichen „@“ noch nicht entworfen"]);
```

durch:

```ts
  const r = layoutLine("~ÜBER", opts());
  expect(r.warnings).toEqual(["Zeichen „~“ noch nicht entworfen"]);
```

- [ ] **Schritt 2: Tests laufen lassen und Fehlschlag prüfen**

Run: `bun test`
Expected: FAIL in genau diesen Tests:
  - „Komma mit Unterlänge: liegt außerhalb des Zeilenbands, der Rahmen reicht 130 tiefer“
  - „Punkt: Quadrat in Strichstärke auf der Grundlinie; Komma und tiefe Anführungszeichen mit Unterlänge 130“
  - „Tinte bleibt endlich und im Buchstabenfeld (Höhe, x ≥ linker Bezug)“
  - „Ziffern sowie Satz- und Plakat-Zeichen sind entworfen“

- [ ] **Schritt 3: Code**

In `src/glyphs.ts` ersetzen:

```ts
  adjust?: { left?: number; right?: number }; // Abstandskorrektur je Seite (Einheiten)
```

durch:

```ts
  adjust?: { left?: number; right?: number }; // Abstandskorrektur je Seite (Einheiten)
  desc?: number; // Unterlänge: Tinte reicht bis −desc unter die Grundlinie (Komma, tiefe Anführungszeichen)
```

In `src/glyphs.ts` ersetzen:

```ts
/** Ersatz für noch nicht entworfene Zeichen. */
```

durch:

```ts
// ── Satz- und Plakatzeichen (M2) ──

const moveBy = (dx: number, dy: number) => (q: Pt): Pt => ({ x: q.x + dx, y: q.y + dy });

const square = (x: number, y: number, s: Style) => stroke(x - s.stroke / 2, y, L(x + s.stroke / 2, y)); // Punkt: Quadrat um (x, y)

const mid = (s: Style) => s.capHeight / 2; // halbe Versalhöhe, für Striche und Zeichen in der Mitte

const fixed: Record<string, Range> = {}; // Satzzeichen: keine Regler, die Form bleibt auch verschachtelt

const glyphPeriod: GlyphDef = { char: ".", params: fixed, draw: (_p, s) => [square(s.stroke / 2, s.stroke / 2, s)], docks: () => [] };

/** Komma: Punkt auf der Grundlinie, Schwanz schräg nach links unten (Unterlänge). */
const comma = (x: number, s: Style) => [square(x, s.stroke / 2, s), stroke(x + 7, s.stroke / 2, L(x - 19, -117))];

const glyphComma: GlyphDef = { char: ",", params: fixed, desc: 130, draw: (_p, s) => comma(s.stroke / 2 + 19, s), docks: () => [] };

const glyphColon: GlyphDef = {
  char: ":",
  params: fixed,
  draw: (_p, s) => [square(s.stroke / 2, s.stroke / 2, s), square(s.stroke / 2, s.barLow, s)],
  docks: () => [],
};

const glyphSemicolon: GlyphDef = {
  char: ";",
  params: fixed,
  desc: 130,
  draw: (_p, s) => [...comma(s.stroke / 2 + 19, s), square(s.stroke / 2 + 19, s.barLow, s)],
  docks: () => [],
};

const glyphExclam: GlyphDef = {
  char: "!",
  params: fixed,
  draw: (_p, s) => [stroke(s.stroke / 2, s.barLow, L(s.stroke / 2, s.capHeight)), square(s.stroke / 2, s.stroke / 2, s)], // Stamm endet auf der unteren Linie
  docks: () => [],
};

const glyphQuestion: GlyphDef = {
  char: "?",
  params: { h, w: R(160, 200, 260) },
  draw(p, s) {
    const c = p.w / 2;
    return [stroke(0, cTop(p, s), ...head2(p, s, s.barHigh * p.h), L(c, mid(s) * p.h), L(c, s.barLow * p.h)), square(c, s.stroke / 2, s)];
  },
  docks: () => [],
};

const glyphHyphen: GlyphDef = { char: "-", params: fixed, draw: (_p, s) => [stroke(0, mid(s), L(140, mid(s)))], docks: () => [] };

const glyphEndash: GlyphDef = { char: "–", params: fixed, draw: (_p, s) => [stroke(0, mid(s), L(280, mid(s)))], docks: () => [] };

/** Klammer: flacher Bogen über die ganze Höhe, Enden über Ober- und Grundlinie hinaus (der Renderer schneidet waagrecht). */
function paren(s: Style, w: number): Stroke {
  const H = s.capHeight, m = H / 2, e = 10;
  return stroke(w, H + e, C(0.35 * w, H, 0, m + 0.3 * H, 0, m), C(0, m - 0.3 * H, 0.35 * w, 0, w, -e));
}

const glyphParenLeft: GlyphDef = { char: "(", params: fixed, draw: (_p, s) => [paren(s, 110)], docks: () => [] };

const glyphParenRight: GlyphDef = {
  char: ")",
  params: fixed,
  draw: (_p, s) => [mapPts(paren(s, 110), (q) => ({ x: 110 - q.x, y: q.y }))],
  docks: () => [],
};

const glyphSlash: GlyphDef = {
  char: "/",
  params: fixed,
  draw(_p, s) {
    const w = 220, H = s.capHeight, d = capDrop(w, H, s), x = (w * d) / H;
    return [stroke(-x, -d, L(w + x, H + d))];
  },
  docks: () => [],
};

/** Hohes Häkchen (gerade) für ' und ". */
const tick = (x: number, s: Style) => stroke(x, s.barHigh, L(x, s.capHeight));

/** Komma-förmiges Anführungszeichen oben („9“); gedreht ergibt es die „6“. */
const quote9 = (x: number, s: Style) => [square(x, s.capHeight - s.stroke / 2, s), stroke(x + 7, s.capHeight - s.stroke / 2, L(x - 19, s.barHigh))];

const quote6 = (x: number, s: Style) => quote9(x, s).map((st) => mapPts(st, (q) => ({ x: 2 * x - q.x, y: s.capHeight + s.barHigh - q.y })));

const glyphQuoteSingle: GlyphDef = { char: "'", params: fixed, draw: (_p, s) => [tick(s.stroke / 2, s)], docks: () => [] };

const glyphQuoteDbl: GlyphDef = { char: '"', params: fixed, draw: (_p, s) => [tick(s.stroke / 2, s), tick(s.stroke / 2 + 56, s)], docks: () => [] };

const glyphQuoteRight: GlyphDef = { char: "’", params: fixed, draw: (_p, s) => quote9(32, s), docks: () => [] };

const glyphQuoteLeft: GlyphDef = { char: "‘", params: fixed, draw: (_p, s) => quote6(13, s), docks: () => [] };

const glyphQuoteDblLeft: GlyphDef = { char: "“", params: fixed, draw: (_p, s) => [...quote6(13, s), ...quote6(13 + 66, s)], docks: () => [] };

const glyphQuoteSingleBase: GlyphDef = { char: "‚", params: fixed, desc: 130, draw: (_p, s) => comma(32, s), docks: () => [] };

const glyphQuoteDblBase: GlyphDef = { char: "„", params: fixed, desc: 130, draw: (_p, s) => [...comma(32, s), ...comma(32 + 66, s)], docks: () => [] };

/** Winkel für Guillemets: Spitze links auf halber Höhe. */
const chevron = (x: number, s: Style) => stroke(x + 90, mid(s) + 100, L(x, mid(s)), L(x + 90, mid(s) - 100));

const glyphGuillemetLeft: GlyphDef = { char: "«", params: fixed, draw: (_p, s) => [chevron(0, s), chevron(90, s)], docks: () => [] };

const glyphGuillemetRight: GlyphDef = {
  char: "»",
  params: fixed,
  draw: (_p, s) => [chevron(0, s), chevron(90, s)].map((st) => mapPts(st, (q) => ({ x: 180 - q.x, y: q.y }))),
  docks: () => [],
};

const glyphEllipsis: GlyphDef = {
  char: "…",
  params: fixed,
  draw: (_p, s) => [0, 1, 2].map((i) => square(s.stroke / 2 + i * 70, s.stroke / 2, s)),
  docks: () => [],
};

/** Liegendes Oval zwischen y und t (Halbkreise links und rechts), linke Kante bei x. */
function loop(x: number, w: number, y: number, t: number): Stroke {
  const r = (t - y) / 2, k = KAPPA * r;
  return closed(stroke(x + r, t, L(x + w - r, t), C(x + w - r + k, t, x + w, t - r + k, x + w, t - r), C(x + w, y + r - k, x + w - r + k, y, x + w - r, y),
    L(x + r, y), C(x + r - k, y, x, y + r - k, x, y + r), C(x, t - r + k, x + r - k, t, x + r, t)));
}

const glyphAmpersand: GlyphDef = {
  char: "&",
  params: { h, w: R(240, 300, 360) },
  draw(p, s) {
    // Schleife oben bis zur oberen Linie, Bein nach rechts unten, Bauch links mit Schwanz bis zur unteren Linie
    const t = cTop(p, s), y = s.barHigh * p.h, yl = s.barLow * p.h, b = cBot(s), w = p.w, x1 = 30, w1 = 160, r = (t - y) / 2;
    const lx = x1 + 30, ly = y + r - Math.sqrt(r * r - (lx - x1 - r) ** 2); // Bein beginnt auf der Schleife
    const run = w - lx, d = capDrop(run, ly, s);
    return [
      loop(x1, w1, y, t),
      stroke(lx, ly, L(w + (run * d) / ly, -d)),
      stroke(x1 + w1 - 0.6 * r, y + 6, C(x1 + w1 - 120, y - 110, 0, 0.6 * y + 90, 0, 0.48 * y), C(0, 0.2 * y, 50, b, 140, b), C(220, b, w - 20, yl - 90, w - 10, yl)),
    ];
  },
  docks: () => [],
};

const glyphEuro: GlyphDef = {
  char: "€",
  params: { h, w: R(200, 240, 290) },
  draw(p, s) {
    const y1 = 0.42 * inkTop(p, s), y2 = 0.58 * inkTop(p, s), x = 40; // Querstriche ragen links 40 über den Bogen
    return [mapPts(bowlC({ ...p, wb: p.w }, s), moveBy(x, 0)), stroke(0, y1, L(x + 0.6 * p.w, y1)), stroke(0, y2, L(x + 0.6 * p.w, y2))];
  },
  docks: () => [],
};

/** Kleines stehendes Oval (Prozent). */
function oval(x: number, y0: number, y1: number, w: number): Stroke {
  const r = w / 2, k = KAPPA * r;
  return closed(stroke(x, y0 + r, L(x, y1 - r), C(x, y1 - r + k, x + r - k, y1, x + r, y1), C(x + r + k, y1, x + w, y1 - r + k, x + w, y1 - r),
    L(x + w, y0 + r), C(x + w, y0 + r - k, x + r + k, y0, x + r, y0), C(x + r - k, y0, x, y0 + r - k, x, y0 + r)));
}

const glyphPercent: GlyphDef = {
  char: "%",
  params: fixed,
  draw(_p, s) {
    const H = s.capHeight, w = 300, d = capDrop(w, H, s), x = (w * d) / H, b = s.stroke / 2;
    return [oval(0, s.barHigh - 100, H - b, 90), oval(w - 90, b, s.barLow + 100, 90), stroke(-x, -d, L(w + x, H + d))];
  },
  docks: () => [],
};

const glyphAt: GlyphDef = {
  char: "@",
  params: fixed,
  draw(_p, s) {
    const a = glyphA.draw({ h: 0.42, w: 150, bar: 1, legL: 0 }, s).map((st) => mapPts(st, moveBy(75, 0.29 * s.capHeight)));
    return [...glyphO.draw({ h: 1, w: 300 }, s), ...a]; // kleines A mittig im O-Oval
  },
  docks: () => [],
};

const glyphNumber: GlyphDef = {
  char: "#",
  params: fixed,
  draw(_p, s) {
    const H = s.capHeight, w = 260;
    return [stroke(70, 0, L(70, H)), stroke(w - 70, 0, L(w - 70, H)), stroke(0, s.barLow, L(w, s.barLow)), stroke(0, s.barHigh, L(w, s.barHigh))];
  },
  docks: () => [],
};

const glyphPlus: GlyphDef = {
  char: "+",
  params: fixed,
  draw: (_p, s) => [stroke(110, mid(s) - 110, L(110, mid(s) + 110)), stroke(0, mid(s), L(220, mid(s)))],
  docks: () => [],
};

const glyphEqual: GlyphDef = {
  char: "=",
  params: fixed,
  draw: (_p, s) => [stroke(0, mid(s) - 55, L(220, mid(s) - 55)), stroke(0, mid(s) + 55, L(220, mid(s) + 55))],
  docks: () => [],
};

const glyphAsterisk: GlyphDef = {
  char: "*",
  params: fixed,
  draw(_p, s) {
    const c = 100, r = 100;
    return [0, 60, 120].map((deg) => {
      const a = (deg * Math.PI) / 180, dx = r * Math.sin(a), dy = r * Math.cos(a);
      return stroke(c - dx, mid(s) - dy, L(c + dx, mid(s) + dy));
    });
  },
  docks: () => [],
};

const glyphSection: GlyphDef = {
  char: "§",
  params: fixed,
  draw(_p, s) {
    // Kopf wie beim C links hinab in einen Ring auf halber Höhe, aus dem Ring rechts hinab in den Fuß wie beim D
    const H = s.capHeight, t = H - s.stroke / 2, b = s.stroke / 2, w = 200, c = mid(s), R0 = w / 2, k = KAPPA * R0, r = 0.143 * H, kr = KAPPA * r, rb = 47;
    return [
      stroke(0.85 * w, t, L(r, t), C(r - kr, t, 0, t - r + kr, 0, t - r), L(0, c)),
      closed(stroke(0, c, C(0, c + k, R0 - k, c + R0, R0, c + R0), C(R0 + k, c + R0, w, c + k, w, c), C(w, c - k, R0 + k, c - R0, R0, c - R0), C(R0 - k, c - R0, 0, c - k, 0, c))),
      stroke(w, c, L(w, b + rb), C(w, b + rb * (1 - KAPPA), w - rb * (1 - KAPPA), b, w - rb, b), L(0, b)),
    ];
  },
  docks: () => [],
};

/** Ersatz für noch nicht entworfene Zeichen. */
```

In `src/glyphs.ts` ersetzen:

```ts
    glyph0, glyph1, glyph2, glyph3, glyph4, glyph5, glyph6, glyph7, glyph8, glyph9,
  ].map((g) => [g.char, g]),
```

durch:

```ts
    glyph0, glyph1, glyph2, glyph3, glyph4, glyph5, glyph6, glyph7, glyph8, glyph9,
    glyphPeriod, glyphComma, glyphColon, glyphSemicolon, glyphExclam, glyphQuestion, glyphHyphen, glyphEndash,
    glyphParenLeft, glyphParenRight, glyphSlash, glyphAmpersand, glyphQuoteSingle, glyphQuoteRight, glyphQuoteDbl,
    glyphQuoteDblBase, glyphQuoteDblLeft, glyphQuoteSingleBase, glyphQuoteLeft, glyphGuillemetLeft, glyphGuillemetRight,
    glyphEuro, glyphPercent, glyphAt, glyphNumber, glyphPlus, glyphEqual, glyphAsterisk, glyphSection, glyphEllipsis,
  ].map((g) => [g.char, g]),
```

In `src/render.ts` ersetzen:

```ts
  const m = o.margin ?? 60, H = s.capHeight;
  const [x, y, w, h] = [l.minX - m, -m, l.width + 2 * m, H + 2 * m].map(r1);
```

durch:

```ts
  const m = o.margin ?? 60, H = s.capHeight, desc = Math.max(0, ...l.glyphs.map((g) => g.inst.def.desc ?? 0)); // Unterlängen im Rahmen
  const [x, y, w, h] = [l.minX - m, -m, l.width + 2 * m, H + 2 * m + desc].map(r1);
```

In `src/render.ts` ersetzen:

```ts
      const { minX, maxX } = g.inst.prof, top = r1(H * g.inst.p.h), sel = g.index === o.selected;
```

durch:

```ts
      const { minX, maxX } = g.inst.prof, top = r1(H * (g.inst.p.h ?? 1)), sel = g.index === o.selected;
```

In `src/render.ts` ersetzen:

```ts
  const clips = new Set<number>();
  for (const g of l.glyphs) {
    // kürzere Buchstaben zusätzlich an der eigenen Oberkante abschneiden (schräge Enden V X Y, Gehrungsspitzen M N);
    // die Kennung hängt nur an der Höhe, so stören sich auch mehrere eingebettete SVGs nicht
    const top = r1(H * g.inst.p.h), id = Math.round(top * 10), clip = top < H && g.inst.ink.some((q) => q.y > top + 0.5);
```

durch:

```ts
  const clips = new Set<number>(), glyph = (g: Layout["glyphs"][number], attr = "") =>
    `<g data-i="${g.index}" transform="translate(${r1(g.x)} 0)"${attr}>${g.inst.strokes.map((st) => `<path d="${pathData(st)}"/>`).join("")}</g>`;
  for (const g of l.glyphs) {
    if (g.inst.def.desc) continue; // Zeichen mit Unterlänge liegen außerhalb des Bands (unten)
    // kürzere Buchstaben zusätzlich an der eigenen Oberkante abschneiden (schräge Enden V X Y, Gehrungsspitzen M N);
    // die Kennung hängt nur an der Höhe, so stören sich auch mehrere eingebettete SVGs nicht
    const top = r1(H * (g.inst.p.h ?? 1)), id = Math.round(top * 10), clip = top < H && g.inst.ink.some((q) => q.y > top + 0.5); // Satzzeichen ohne Höhenregler: volle Höhe
```

In `src/render.ts` ersetzen:

```ts
    out.push(`<g data-i="${g.index}" transform="translate(${r1(g.x)} 0)"${clip ? ` clip-path="url(#kairos-h${id})"` : ""}>`);
    for (const st of g.inst.strokes) out.push(`<path d="${pathData(st)}"/>`);
    out.push(`</g>`);
  }
  for (const e of l.extras) out.push(`<path d="${pathData(e)}"/>`);
  out.push(`</g></g></svg>`);
```

durch:

```ts
    out.push(glyph(g, clip ? ` clip-path="url(#kairos-h${id})"` : ""));
  }
  for (const e of l.extras) out.push(`<path d="${pathData(e)}"/>`);
  out.push(`</g>`);
  for (const g of l.glyphs) if (g.inst.def.desc) out.push(glyph(g)); // Komma, tiefe Anführungszeichen: ohne Beschnitt
  out.push(`</g></svg>`);
```

In `src/ui.ts` ersetzen:

```ts
  const s = state.style, p = g.inst.p, has = g.inst.def.params, { minX, maxX } = g.inst.prof, top = s.capHeight * p.h;
  const out: { kind: HandleKind; x: number; y: number }[] = [{ kind: "h", x: (minX + maxX) / 2, y: top }];
```

durch:

```ts
  const s = state.style, p = g.inst.p, has = g.inst.def.params, { minX, maxX } = g.inst.prof, top = s.capHeight * (p.h ?? 1);
  const out: { kind: HandleKind; x: number; y: number }[] = has.h ? [{ kind: "h", x: (minX + maxX) / 2, y: top }] : []; // Satzzeichen: kein Höhengriff
```

In `tools/sheet.ts` ersetzen:

```ts
  ["ziffern", "0 1 2 3 4 5 6 7 8 9", 0],
```

durch:

```ts
  ["ziffern", "0 1 2 3 4 5 6 7 8 9", 0],
  ["zeichen", ". , : ; ! ? - – ( ) / & ' ’ \" „ “ ‚ ‘ « » € % @ # + = * § …", 0],
```

- [ ] **Schritt 4: Tests und Typen prüfen**

Run: `bun test && bunx tsc --noEmit -p .`
Expected: `67 pass`, `0 fail`; tsc ohne Ausgabe (Exit 0)

- [ ] **Schritt 5: Prüfblatt ansehen**

`bun run sheet` → `out/zeichen.png`. Erwartet: Komma und tiefe Anführungszeichen reichen unter die Grundlinie und sind nicht abgeschnitten; „&“ mit Schleife und Bein; „§“ mit C-Kopf, Ring und D-Fuß; „#“ mit Balken auf beiden Balkenlinien.

- [ ] **Schritt 6: Commit**

```bash
git add src/glyphs.ts src/render.ts src/ui.ts test/engine.test.ts test/glyphs.test.ts test/render.test.ts tools/sheet.ts
git commit -m "feat: Satz- und Plakat-Zeichen, Unterlängen im Renderer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 4: Monogramm HAF und Sichtprüfung der neuen Zeichen

**Dateien:**
- Ändern: `src/glyphs.ts` (Abschnitt „Monogramm (M2)“, Zeichentabelle)
- Ändern: `tools/sheet.ts` (Monogramm im Prüfblatt „zeichen“)
- Tests: `test/glyphs.test.ts`

**Schnittstellen:**
- Verbraucht: `cTop`, `inkTop`, `capDrop`, `R`, `h` aus `src/glyphs.ts`
- Liefert: `GLYPHS["\uE000"]` – Monogramm HAF (Zeichen U+E000), Task 5 nennt es `H_A_F`

- [ ] **Schritt 1: Tests schreiben**

In `test/glyphs.test.ts` ersetzen:

```ts
const MARKS = [...".,:;!?-–()/&'’\"„“‚‘«»€%@#+=*§…"]; // Spec M2 §3: Satz-Grundset und Plakat-Zeichen
```

durch:

```ts
const MARKS = [...".,:;!?-–()/&'’\"„“‚‘«»€%@#+=*§…"]; // Spec M2 §3: Satz-Grundset und Plakat-Zeichen
const HAF = "\uE000";
```

In `test/glyphs.test.ts` ersetzen:

```ts
test("Ziffern sowie Satz- und Plakat-Zeichen sind entworfen", () => {
  expect([...DIGITS, ...MARKS].filter((c) => !GLYPHS[c])).toEqual([]);
});
```

durch:

```ts
test("Ziffern, Satz- und Plakat-Zeichen und das Monogramm sind entworfen", () => {
  expect([...DIGITS, ...MARKS, HAF].filter((c) => !GLYPHS[c])).toEqual([]);
});
```

In `test/glyphs.test.ts` ersetzen:

```ts
  for (const g of [...[...ALL, ...DIGITS, ...MARKS].map((c) => GLYPHS[c]), PLACEHOLDER])
```

durch:

```ts
  for (const g of [...[...ALL, ...DIGITS, ...MARKS, HAF].map((c) => GLYPHS[c]), PLACEHOLDER])
```

An das Ende von `test/glyphs.test.ts` anhängen:

```ts

test("Monogramm HAF: zwei H-Stämme über die volle Höhe, gemeinsamer Balken auf der unteren Linie, F-Arme rechts", () => {
  const g = GLYPHS[HAF], p = defaults(g), st = g.draw(p, S);
  const vertical = (x: number) => st.some((q) => q.start.x === x && q.start.y === 0 && (q.segs[0] as { p: { x: number; y: number } }).p.x === x && (q.segs[0] as { p: { y: number } }).p.y === S.capHeight);
  expect(vertical(0) && vertical(p.w)).toBe(true);
  expect(st.some((q) => q.start.y === S.barLow && q.start.x === 0)).toBe(true);
  expect(Math.max(...ink(st).map((q) => q.x))).toBeGreaterThan(p.w + 200);
});
```

- [ ] **Schritt 2: Tests laufen lassen und Fehlschlag prüfen**

Run: `bun test`
Expected: FAIL in genau diesen Tests:
  - „Monogramm HAF: zwei H-Stämme über die volle Höhe, gemeinsamer Balken auf der unteren Linie, F-Arme rechts“
  - „Tinte bleibt endlich und im Buchstabenfeld (Höhe, x ≥ linker Bezug)“
  - „Ziffern, Satz- und Plakat-Zeichen und das Monogramm sind entworfen“

- [ ] **Schritt 3: Code**

In `src/glyphs.ts` ersetzen:

```ts
/** Ersatz für noch nicht entworfene Zeichen. */
```

durch:

```ts
// ── Monogramm (M2) ──

/** Monogramm HAF: A im H (A-Querbalken = H-Balken auf der unteren Linie), F-Arme am rechten H-Stamm. */
const glyphHAF: GlyphDef = {
  char: "\uE000",
  params: { h, w: R(240, 300, 380) },
  draw(p, s) {
    const top = inkTop(p, s), t = cTop(p, s), y = s.barLow * p.h, yh = s.barHigh * p.h, run = (p.w - s.apexW) / 2, d = capDrop(run, t, s);
    return [
      stroke(0, 0, L(0, top)),
      stroke(p.w, 0, L(p.w, top)),
      stroke((-run * d) / t, -d, L(run, t), L(p.w - run, t), L(p.w + (run * d) / t, -d)),
      stroke(0, y, L(p.w, y)),
      stroke(p.w, t, L(p.w + 265, t)),
      stroke(p.w, yh, L(p.w + 212, yh)),
    ];
  },
  docks: () => [],
};

/** Ersatz für noch nicht entworfene Zeichen. */
```

In `src/glyphs.ts` ersetzen:

```ts
    glyphEuro, glyphPercent, glyphAt, glyphNumber, glyphPlus, glyphEqual, glyphAsterisk, glyphSection, glyphEllipsis,
```

durch:

```ts
    glyphEuro, glyphPercent, glyphAt, glyphNumber, glyphPlus, glyphEqual, glyphAsterisk, glyphSection, glyphEllipsis, glyphHAF,
```

In `tools/sheet.ts` ersetzen:

```ts
  ["zeichen", ". , : ; ! ? - – ( ) / & ' ’ \" „ “ ‚ ‘ « » € % @ # + = * § …", 0],
```

durch:

```ts
  ["zeichen", ". , : ; ! ? - – ( ) / & ' ’ \" „ “ ‚ ‘ « » € % @ # + = * § … \uE000", 0],
```

- [ ] **Schritt 4: Tests und Typen prüfen**

Run: `bun test && bunx tsc --noEmit -p .`
Expected: `68 pass`, `0 fail`; tsc ohne Ausgabe (Exit 0)

- [ ] **Schritt 5: Sichtprüfung durch Hagen (Controller)**

`bun run sheet` → `out/ziffern.png` und `out/zeichen.png`; dazu ein Probeblatt mit Wörtern (z. B. „WIEN, 12. MÄRZ 1902“, „PREIS: 12,50 € – 30% RABATT!“, „„KUNST“ & ‚LEBEN‘ «JA»“, „§ 7 (KAIROS) / NR. #48 + 2 = 50*“). Der Controller zeigt Hagen die Blätter und fragt nach Änderungen an Ziffern, Zeichen und Monogramm. Gewünschte Änderungen setzt ein Implementierer vor Task 5 um; Tests bleiben grün.

- [ ] **Schritt 6: Commit**

```bash
git add src/glyphs.ts test/glyphs.test.ts tools/sheet.ts
git commit -m "feat: Monogramm HAF

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 5: Font-Daten aus der Engine (Export)

**Dateien:**
- Neu: `src/fontdata.ts` (Font-Daten aus der Engine)
- Neu: `tools/export-font.ts` (schreibt `build/kairos.json` und `build/features.fea`)
- Ändern: `.gitignore` (`build/`, `dist/`)
- Tests: neu `test/fontdata.test.ts`

**Schnittstellen:**
- Verbraucht: `GLYPHS`, `PLACEHOLDER`, `defaults` (glyphs); `layoutLine`, `Layout`, `Pins` (engine); `instance`, `joinsFor`, `spacing`, `Inst` (rules); `shift`, `Stroke` (geom); `presets/hagen-aad-fock.json`
- Liefert: `FORMAT = 1`; `glyphName(c: string): string`; `fontData(version: string): FontData` mit `glyphs: { name, unicodes, advance, parts: { strokes, bottom, top }[] }[]`, `kerning: [links, rechts, wert][]`, `fea: string`, `expect: { text, features, words: { name, x }[][], parts }[]`; Dateien `build/kairos.json`, `build/features.fea`

- [ ] **Schritt 1: Tests schreiben**

Neue Datei `test/fontdata.test.ts`:

```ts
import { expect, test } from "bun:test";
import { fontData, glyphName } from "../src/fontdata";
import { GLYPHS } from "../src/glyphs";

const data = fontData("test");
const byName = new Map(data.glyphs.map((g) => [g.name, g]));

test("jedes Zeichen hat eine Grundglyphe; Kleinbuchstaben zeigen die Versalien, ß zeigt ẞ, HAF liegt auf U+E000", () => {
  for (const c of Object.keys(GLYPHS)) expect(byName.get(glyphName(c))?.unicodes).toContain(c.codePointAt(0)!);
  expect(byName.get("A")!.unicodes).toEqual([0x41, 0x61]);
  expect(byName.get("Adieresis")!.unicodes).toEqual([0xc4, 0xe4]);
  expect(byName.get("uni1E9E")!.unicodes).toEqual([0x1e9e, 0xdf]);
  expect(byName.get("H_A_F")!.unicodes).toEqual([0xe000]);
  expect(byName.get("space")!.advance).toBe(80); // Lichtweite zwischen Wörtern wie der Wortabstand der App (136)
  expect(data.glyphs.map((g) => g.name).filter((n) => !/^[A-Za-z0-9._]+$/.test(n))).toEqual([]); // gültige Glyphennamen (Adobe Glyph List)
}, 20000);

test("Feature-Datei nennt nur vorhandene Glyphen und enthält liga, dlig und calt", () => {
  const names = new Set(byName.keys()), body = data.fea.replace(/^languagesystem.*$/gm, "").replace(/@\w+/g, ""); // Klassennamen zählen nicht
  const used = body.match(/[A-Za-z_][A-Za-z0-9_.]*(?=['\s;\]])/g)!.filter((w) => !["sub", "by", "ignore", "lookup", "feature", "calt", "liga", "dlig"].includes(w));
  const unknown = used.filter((w) => !names.has(w) && !/^[A-Z_]+_LIG$|^NEST_|^UNDERRUN_|^TERM_/.test(w));
  expect([...new Set(unknown)]).toEqual([]);
  for (const f of ["feature liga", "feature dlig", "feature calt"]) expect(data.fea).toContain(f);
});

test("Sollwerte: FLÄCHE mit gekürztem F-Arm, Namens-Ligatur, Monogramm nur als eigenes Wort", () => {
  const words = (t: string, f = {}) => data.expect.find((e) => e.text === t && JSON.stringify(e.features) === JSON.stringify(f))!.words.map((w) => w.map((g) => g.name).join(" "));
  expect(words("FLÄCHE")).toEqual(["F.nest.t40 L.short.foot Adieresis.lift C.term H E"]);
  expect(words("HAGEN AAD FOCK")).toEqual(["H_A_G_E_N_space_A_A_D_space_F_O_C_K"]);
  expect(words("HAF", { dlig: true })).toEqual(["H_A_F"]);
  expect(words("HAFEN", { dlig: true })).toEqual(["H A F.nest E.short N"]);
  for (const e of data.expect) for (const w of e.words) for (const g of w) expect(byName.has(g.name)).toBe(true);
});

test("Unterschneidung: verbundene Paare stehen wie in der Engine, freie Paare mit der Lichtweite der App", () => {
  const k = new Map(data.kerning.map(([l, r, v]) => [`${l} ${r}`, v]));
  const step = (l: string, r: string) => byName.get(l)!.advance + (k.get(`${l} ${r}`) ?? 0);
  const fl = data.expect.find((e) => e.text === "FLÄCHE")!.words[0];
  for (let i = 1; i < fl.length; i++) expect(Math.abs(step(fl[i - 1].name, fl[i].name) - (fl[i].x - fl[i - 1].x))).toBeLessThanOrEqual(1);
  expect(k.get("H I")).toBeUndefined(); // zwei Stämme: Seitenabstände reichen, keine Unterschneidung nötig
});
```

- [ ] **Schritt 2: Tests laufen lassen und Fehlschlag prüfen**

Run: `bun test`
Expected: Fehler beim Laden: `Cannot find module '../src/fontdata'`

- [ ] **Schritt 3: Code**

In `.gitignore` ersetzen:

```text
out/
```

durch:

```text
out/
build/
dist/
```

Neue Datei `src/fontdata.ts`:

```ts
// Font-Daten aus der Engine (Spec M2 §5): Glyphen samt calt-Varianten, Vorschübe, Unterschneidung, Feature-Datei und Sollwerte.
import hagen from "../presets/hagen-aad-fock.json";
import { layoutLine, type Layout, type Pins } from "./engine";
import { shift, type Stroke } from "./geom";
import { GLYPHS, PLACEHOLDER, defaults, type Params } from "./glyphs";
import { instance, joinsFor, spacing, type Inst } from "./rules";
import { FLAECHE_1902 as S } from "./style";

export const FORMAT = 1;
export type FontPart = { strokes: Stroke[]; bottom: number; top: number }; // Mittellinien in Font-Koordinaten, Beschnitt-Band
export type FontGlyph = { name: string; unicodes: number[]; advance: number; parts: FontPart[] };
export type ExpectGlyph = { name: string; x: number }; // x: Ursprung relativ zum Wortanfang
export type Expect = { text: string; features: Record<string, boolean>; words: ExpectGlyph[][]; parts: FontPart[] | null };
export type FontData = {
  format: number;
  info: { family: string; style: string; version: string; unitsPerEm: number; capHeight: number; ascender: number; descender: number; stroke: number };
  glyphs: FontGlyph[];
  kerning: [string, string, number][];
  fea: string;
  expect: Expect[];
};

const NAMES: Record<string, string> = {
  Ä: "Adieresis", Ö: "Odieresis", Ü: "Udieresis", ẞ: "uni1E9E",
  "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
  ".": "period", ",": "comma", ":": "colon", ";": "semicolon", "!": "exclam", "?": "question", "-": "hyphen", "–": "endash",
  "(": "parenleft", ")": "parenright", "/": "slash", "&": "ampersand", "'": "quotesingle", "’": "quoteright", '"': "quotedbl",
  "„": "quotedblbase", "“": "quotedblleft", "‚": "quotesinglbase", "‘": "quoteleft", "«": "guillemotleft", "»": "guillemotright",
  "€": "Euro", "%": "percent", "@": "at", "#": "numbersign", "+": "plus", "=": "equal", "*": "asterisk", "§": "section", "…": "ellipsis",
  "": "H_A_F",
};
/** Glyphenname nach Adobe Glyph List; A–Z heißen wie ihr Zeichen. */
export const glyphName = (c: string) => NAMES[c] ?? c;
/** Zeichentabelle: Kleinbuchstaben zeigen bis M4 die Versalien, ß zeigt ẞ. */
const unicodes = (c: string) => [...new Set([c, c.toLowerCase()])].map((x) => x.codePointAt(0)!);

const NAME_LIG = "H_A_G_E_N_space_A_A_D_space_F_O_C_K";
const SB = S.gap / 2; // Seitenabstand je Seite: halber Buchstabenabstand
const lsb = (i: Inst) => SB + (i.def.adjust?.left ?? 0);
const rsb = (i: Inst) => SB + (i.def.adjust?.right ?? 0);
const ox = (i: Inst) => lsb(i) - i.prof.minX; // Verschiebung Engine → Font: die Tinte beginnt beim linken Seitenabstand
const advance = (i: Inst) => Math.round(i.prof.maxX - i.prof.minX + lsb(i) + rsb(i));
/** Unterschneidung, damit r im Font dort steht, wo die Engine es um dx neben l setzt (mit gerundetem Vorschub gerechnet). */
const kernFor = (l: Inst, r: Inst, dx: number) => Math.round(dx - ox(r) + ox(l) - advance(l));
const part = (i: Inst, dx: number): FontPart => ({
  strokes: i.strokes.map((st) => shift(st, dx)),
  bottom: -(i.def.desc ?? 0),
  top: i.def.desc ? S.capHeight : S.capHeight * (i.p.h ?? 1),
});

type Glyph = { name: string; char: string; inst: Inst; role: { left: boolean; right: boolean } }; // left/right: diese Seite ist verbunden
const opts = { style: S, interlock: 0.5, targetWidth: null, pins: { letters: {}, joins: {} } };
const best = (text: string) => layoutLine(text, opts).variants[0];
const floor5 = (v: number) => Math.floor(v / 5) * 5;
/** Regler, die erst die eigene rechte Verbindung ändert (Arm, Fuß, Bogenende): beim Setzen neben den linken Nachbarn galten noch die Startwerte. */
const OWN_RIGHT = ["arm", "top", "foot", "wb"];
const placed = (g: { char: string; inst: Inst }) => {
  const d = defaults(GLYPHS[g.char]), p = { ...g.inst.p };
  for (const k of OWN_RIGHT) if (k in d) p[k] = d[k];
  return instance(GLYPHS[g.char], p, S);
};

/** Alle Font-Daten aus der Engine. */
export function fontData(version: string): FontData {
  const chars = Object.keys(GLYPHS);
  const reg = new Map<string, Glyph>();
  const keyOf = (c: string, p: Params) => c + JSON.stringify(Object.keys(GLYPHS[c].params).map((k) => Math.round(p[k] * 100) / 100));
  /** Glyphe für Zeichen c mit Reglern p; Varianten heißen nach den geänderten Reglern. */
  function glyph(c: string, p: Params, name?: string): Glyph {
    const k = keyOf(c, p);
    const known = reg.get(k);
    if (known) return known;
    const d = defaults(GLYPHS[c]), changed = (q: string) => q in d && Math.abs(p[q] - d[q]) > 1e-6;
    const n0 = name ?? [glyphName(c), changed("h") && "short", (changed("arm") || changed("top")) && "nest", changed("foot") && "foot", changed("legL") && "lift", changed("wb") && "term"]
      .filter(Boolean).join(".");
    // gleiche Rolle, andere Werte (E-Fuß vor A kürzer als vor Ä): durchnummerieren
    const taken = (x: string) => [...reg.values()].some((g) => g.name === x);
    let n = n0;
    for (let i = 1; taken(n); i++) n = `${n0}.${i}`;
    const g: Glyph = { name: n, char: c, inst: instance(GLYPHS[c], p, S), role: { left: false, right: false } };
    reg.set(k, g);
    return g;
  }
  const base = (c: string) => glyph(c, defaults(GLYPHS[c]));
  chars.forEach(base);

  // Paare: was die Engine bei Verschränkung 0,5 aus zwei Zeichen macht
  type Join = { l: Glyph; r: Glyph; dx: number };
  const joins: Join[] = [], rules = { nestX: new Map<string, Glyph>(), under: [] as Join[], term: [] as Join[], skip: [] as string[][], trim: [] as [string, string, Glyph][] };
  let fNest: Glyph | null = null;
  const record = (type: string, l: Glyph, r: Glyph, dx: number) => {
    const j = { l, r, dx };
    joins.push(j);
    if (l !== reg.get(keyOf(l.char, defaults(GLYPHS[l.char])))) l.role.left = true;
    if (r !== reg.get(keyOf(r.char, defaults(GLYPHS[r.char])))) r.role.right = true;
    if (type === "underrun") rules.under.push(j);
    if (type === "share") rules.term.push(j);
    return j;
  };
  for (const a of chars)
    for (const b of chars) {
      if (joinsFor(base(a).inst, base(b).inst).length < 2) continue; // nur „keine“ möglich
      const v = best(a + b), j = v.joins[0], [ga, gb] = v.glyphs;
      if (j.type === "none") continue;
      const l = glyph(a, ga.inst.p), r = glyph(b, gb.inst.p);
      record(j.type, l, r, gb.x - ga.x);
      if (j.type === "nest") (fNest = l), rules.nestX.set(b, r);
    }

  // Dreierfolgen F + X + Z: verschachtelt die Engine trotzdem, kürzt sie den oberen F-Arm, verbindet X weiter?
  for (const x of rules.nestX.keys())
    for (const z of chars) {
      const v = best("F" + x + z), [gF, gX, gZ] = v.glyphs, [jFX, jXZ] = [v.joins[0], v.joins[1]];
      const fn = glyphName("F"), xn = glyphName(x), zn = glyphName(z);
      if (jFX.type !== "nest") {
        rules.skip.push([fn, xn, zn]);
        continue;
      }
      let f = fNest!;
      if (gF.inst.p.top < fNest!.inst.p.top - 0.5) {
        const t = floor5(gF.inst.p.top);
        f = glyph("F", { ...gF.inst.p, top: t }, `F.nest.t${t < 0 ? "m" + -t : t}`); // Glyphennamen ohne Minus
        rules.trim.push([xn, zn, f]);
      }
      // X.short, oder X.short.foot / X.short.term, wenn X rechts weiter verbindet; ein zweites Verschachteln kann der Font nicht
      const further = jXZ.type === "underrun" || jXZ.type === "share";
      const gx = further ? glyph(x, gX.inst.p) : rules.nestX.get(x)!;
      record("nest", f, gx, gX.x - gF.x);
      if (further) record(jXZ.type, gx, glyph(z, gZ.inst.p), gZ.x - gX.x);
    }

  // Unterschneidung: freie Seiten gegeneinander mit dem Abstand „keine Verbindung“, verbundene Paare mit dem Engine-Abstand
  const all = [...reg.values()];
  const leftFree = all.filter((g) => !g.role.left), rightFree = all.filter((g) => !g.role.right);
  const kern = new Map<string, [string, string, number]>();
  for (const l of leftFree)
    for (const r of rightFree) kern.set(`${l.name} ${r.name}`, [l.name, r.name, kernFor(l.inst, r.inst, spacing(l.inst, placed(r), S.gap))]);
  for (const j of joins) kern.set(`${j.l.name} ${j.r.name}`, [j.l.name, j.r.name, kernFor(j.l.inst, j.r.inst, j.dx)]);

  // Glyphen: Grundzeichen, Varianten, Leerzeichen, Namens-Ligatur, .notdef
  const notdef = instance(PLACEHOLDER, defaults(PLACEHOLDER), S);
  const glyphs: FontGlyph[] = [
    { name: ".notdef", unicodes: [], advance: advance(notdef), parts: [part(notdef, ox(notdef))] },
    ...all.map((g) => ({ name: g.name, unicodes: g === base(g.char) ? unicodes(g.char) : [], advance: advance(g.inst), parts: [part(g.inst, ox(g.inst))] })),
    { name: "space", unicodes: [0x20], advance: S.wordGap - S.gap, parts: [] },
    { name: "uni00A0", unicodes: [0xa0], advance: S.wordGap - S.gap, parts: [] },
    nameLigature(),
  ];
  const fea = features(chars, reg, fNest!, rules);
  return {
    format: FORMAT,
    info: { family: "KAIROS Font", style: "Regular", version, unitsPerEm: 1000, capHeight: S.capHeight, ascender: 760, descender: -240, stroke: S.stroke },
    glyphs,
    kerning: [...kern.values()].filter(([, , v]) => v !== 0),
    fea,
    expect: expectations(reg, fNest!),
  };
}

/** Namens-Ligatur: Engine-Layout der Vorlage HAGEN AAD FOCK als eine Glyphe. */
function nameLigature(): FontGlyph {
  const v = layoutLine(hagen.text, { style: S, interlock: hagen.controls.interlock, targetWidth: null, pins: hagen.pins as unknown as Pins }).variants[hagen.variant];
  const x0 = SB - v.minX;
  return {
    name: NAME_LIG,
    unicodes: [],
    advance: Math.round(v.width + 2 * SB),
    parts: [...v.glyphs.map((g) => part(g.inst, g.x + x0)), { strokes: v.extras.map((e) => shift(e, x0)), bottom: 0, top: S.capHeight }],
  };
}

type Rules = { nestX: Map<string, Glyph>; under: { l: Glyph; r: Glyph }[]; term: { l: Glyph; r: Glyph }[]; skip: string[][]; trim: [string, string, Glyph][] };

/** Feature-Datei: liga (Name), dlig (HAF), calt (verschachteln, unterfahren, Bogenende) in dieser Reihenfolge. */
function features(chars: string[], reg: Map<string, Glyph>, fNest: Glyph, r: Rules): string {
  const word = [...reg.values()].filter((g) => /^[A-ZÄÖÜẞ0-9]$/.test(g.char)).map((g) => g.name);
  const seq = (t: string) => [...t].map((c) => (c === " " ? "space" : glyphName(c)));
  const marked = (t: string) => seq(t).map((n) => n + "'").join(" ");
  const out = ["languagesystem DFLT dflt;", "languagesystem latn dflt;", "", `@WORD = [${word.join(" ")}];`, ""];
  out.push(`lookup NAME_LIG {\n  sub ${seq(hagen.text).join(" ")} by ${NAME_LIG};\n} NAME_LIG;`);
  out.push(`lookup HAF_LIG {\n  sub H A F by H_A_F;\n} HAF_LIG;`);
  for (const [feat, text, lig] of [["liga", hagen.text, "NAME_LIG"], ["dlig", "HAF", "HAF_LIG"]]) {
    const m = marked(text).split(" ");
    out.push(`feature ${feat} {\n  ignore sub @WORD ${m.join(" ")};\n  ignore sub ${m.join(" ")} @WORD;\n  sub ${m[0]} lookup ${lig} ${m.slice(1).join(" ")};\n} ${feat};`);
  }
  // calt-Lookups
  const nestX = [...r.nestX.keys()].map(glyphName);
  const fnests = [...new Set([fNest, ...r.trim.map(([, , f]) => f)])].map((g) => g.name);
  out.push(`@FNEST = [${fnests.join(" ")}];`);
  out.push(`lookup NEST_LEFT {\n${[
    ...r.skip.map(([f, x, z]) => `  ignore sub ${f}' ${x} ${z};`),
    ...r.trim.map(([x, z, f]) => `  sub F' ${x} ${z} by ${f.name};`),
    `  sub F' [${nestX.join(" ")}] by ${fNest.name};`,
  ].join("\n")}\n} NEST_LEFT;`);
  const changed = [...r.nestX].filter(([c, g]) => g.name !== glyphName(c));
  out.push(`lookup NEST_RIGHT {\n${changed.map(([c, g]) => `  sub @FNEST ${glyphName(c)}' by ${g.name};`).join("\n")}\n} NEST_RIGHT;`);
  const uniq = (xs: string[]) => [...new Set(xs)];
  const input = (g: Glyph) => glyphName(g.char) + (g.inst.p.h < 1 ? ".short" : ""); // so heißt die Glyphe, wenn der Lookup sie sieht
  out.push(`lookup UNDERRUN_LEFT {\n${uniq(r.under.map((j) => `  sub ${input(j.l)}' ${glyphName(j.r.char)} by ${j.l.name};`)).join("\n")}\n} UNDERRUN_LEFT;`);
  out.push(`lookup UNDERRUN_RIGHT {\n${uniq(r.under.map((j) => `  sub ${j.l.name} ${glyphName(j.r.char)}' by ${j.r.name};`)).join("\n")}\n} UNDERRUN_RIGHT;`);
  const termLeft = r.term.filter((j) => j.l.name !== input(j.l)); // T bleibt T: nur Unterschneidung
  out.push(`lookup TERM_LEFT {\n${uniq(termLeft.map((j) => `  sub ${input(j.l)}' ${glyphName(j.r.char)} by ${j.l.name};`)).join("\n")}\n} TERM_LEFT;`);
  out.push(`feature calt {\n  lookup NEST_LEFT;\n  lookup NEST_RIGHT;\n  lookup UNDERRUN_LEFT;\n  lookup UNDERRUN_RIGHT;\n  lookup TERM_LEFT;\n} calt;`);
  return out.join("\n") + "\n";
}

const TESTS: [string, Record<string, boolean>][] = [
  ["FLÄCHE", {}], ["fläche", {}], ["DIE FLÄCHE", {}], ["HAGEN AAD FOCK", {}], ["HAF", { dlig: true }], ["HAF", {}], ["HAFEN", { dlig: true }],
  ["WIENER WERKSTÄTTE", {}], ["THEATER", {}], ["ZAUBER", {}],
];

/** Sollwerte: Glyphenfolge und Ursprünge je Wort wie die Engine; bei einem Wort zusätzlich die Striche für den Flächenvergleich. */
function expectations(reg: Map<string, Glyph>, fNest: Glyph): Expect[] {
  const find = (c: string, p: Params) => {
    const q = c === "F" && p.top < fNest.inst.p.top - 0.5 ? { ...p, top: floor5(p.top) } : p; // gekürzter Arm: abgerundete Variante
    const k = c + JSON.stringify(Object.keys(GLYPHS[c].params).map((x) => Math.round(q[x] * 100) / 100));
    return reg.get(k)?.name ?? `?${c}`;
  };
  return TESTS.map(([text, features]) => {
    const upper = text.toUpperCase();
    if (upper === hagen.text) return { text, features, words: [[{ name: NAME_LIG, x: 0 }]], parts: null };
    if (upper === "HAF" && features.dlig) return { text, features, words: [[{ name: "H_A_F", x: 0 }]], parts: null };
    const v: Layout = best(text), words: ExpectGlyph[][] = [];
    let start = 0;
    v.glyphs.forEach((g, i) => {
      const o = g.x - ox(g.inst);
      if (i === 0 || g.index !== v.glyphs[i - 1].index + 1) words.push([]), (start = o);
      words[words.length - 1].push({ name: find(g.char, g.inst.p), x: o - start });
    });
    const o0 = v.glyphs[0].x - ox(v.glyphs[0].inst);
    return { text, features, words, parts: words.length === 1 ? v.glyphs.map((g) => part(g.inst, g.x - o0)) : null };
  });
}
```

Neue Datei `tools/export-font.ts`:

```ts
// Font-Daten aus der Engine nach build/ schreiben: kairos.json (Glyphen, Maße, Unterschneidung, Sollwerte) und features.fea
import { mkdirSync } from "node:fs";
import { fontData } from "../src/fontdata";

const t0 = performance.now();
const data = fontData(`0.2 ${new Date().toISOString().slice(0, 16)}`);
mkdirSync("build", { recursive: true });
await Bun.write("build/kairos.json", JSON.stringify(data));
await Bun.write("build/features.fea", data.fea);
console.log(`build/kairos.json: ${data.glyphs.length} Glyphen, ${data.kerning.length} Unterschneidungen, ${Math.round(performance.now() - t0)} ms`);
```

- [ ] **Schritt 4: Tests und Typen prüfen**

Run: `bun test && bunx tsc --noEmit -p .`
Expected: `72 pass`, `0 fail`; tsc ohne Ausgabe (Exit 0)

- [ ] **Schritt 5: Export laufen lassen**

`bun tools/export-font.ts` → Ausgabe etwa `build/kairos.json: 166 Glyphen, 4846 Unterschneidungen, 3000 ms`. `build/features.fea` enthält `feature liga`, `feature dlig` und `feature calt` mit den Lookups `NEST_LEFT`, `NEST_RIGHT`, `UNDERRUN_LEFT`, `UNDERRUN_RIGHT`, `TERM_LEFT`.

- [ ] **Schritt 6: Commit**

```bash
git add .gitignore src/fontdata.ts test/fontdata.test.ts tools/export-font.ts
git commit -m "feat: Font-Daten aus der Engine (Glyphen, calt, Unterschneidung, Sollwerte)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 6: Font-Build mit Python (OTF und WOFF2)

**Dateien:**
- Neu: `tools/build_font.py` (uv-Skript mit Abhängigkeiten im Kopf, PEP 723)
- Ändern: `package.json` (Befehl `font`)

**Schnittstellen:**
- Verbraucht: `build/kairos.json` (Format 1), `build/features.fea`
- Liefert: `dist/KAIROSFont-Regular.otf`, `dist/KAIROSFont-Regular.woff2`; Python-Namen `BUILD`, `DIST`, `outline(parts, stroke) -> pathops.Path` (Task 7 importiert sie)

- [ ] **Schritt 1: Code**

In `package.json` ersetzen:

```json
    "sheet": "bun tools/sheet.ts"
```

durch:

```json
    "sheet": "bun tools/sheet.ts",
    "font": "bun tools/export-font.ts && uv run tools/build_font.py"
```

Neue Datei `tools/build_font.py`:

```python
# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools[woff]>=4.66", "ufo2ft>=3.9", "ufoLib2>=0.18", "skia-pathops>=0.9"]
# ///
"""KAIROS Font bauen: build/kairos.json + build/features.fea → dist/KAIROSFont-Regular.otf und .woff2 (Spec M2 §5.2)."""
import json
import sys
from pathlib import Path

import pathops
import ufo2ft
import ufoLib2
from fontTools.pens.basePen import BasePen

FORMAT = 1
ROOT = Path(__file__).resolve().parent.parent
BUILD, DIST = ROOT / "build", ROOT / "dist"


class CubicPen(BasePen):
    """Reicht Konturen weiter; quadratische Segmente aus skia-pathops werden exakt kubisch (CFF kennt nur kubische)."""

    def __init__(self, out):
        super().__init__(None)
        self.out = out

    def _moveTo(self, p):
        self.out.moveTo(p)

    def _lineTo(self, p):
        self.out.lineTo(p)

    def _curveToOne(self, a, b, c):
        self.out.curveTo(a, b, c)

    def _closePath(self):
        self.out.closePath()

    def _endPath(self):
        self.out.endPath()


def centerline(st: dict) -> pathops.Path:
    p = pathops.Path()
    p.moveTo(st["start"]["x"], st["start"]["y"])
    for g in st["segs"]:
        if g["k"] == "L":
            p.lineTo(g["p"]["x"], g["p"]["y"])
        else:
            p.cubicTo(g["c1"]["x"], g["c1"]["y"], g["c2"]["x"], g["c2"]["y"], g["p"]["x"], g["p"]["y"])
    if st.get("closed"):
        p.close()
    return p


def outline(parts: list, stroke: float) -> pathops.Path:
    """Wie der Renderer: Strich mit stumpfen Enden und Gehrung (Grenze 4), vereinigt, je Teil auf sein Band beschnitten."""
    out = pathops.Path()
    for part in parts:
        ink = pathops.Path()
        for st in part["strokes"]:
            p = centerline(st)
            p.stroke(stroke, pathops.LineCap.BUTT_CAP, pathops.LineJoin.MITER_JOIN, 4)
            ink.addPath(p)
        band = pathops.Path()
        b, t = part["bottom"], part["top"]
        band.moveTo(-1e5, b)
        band.lineTo(1e5, b)
        band.lineTo(1e5, t)
        band.lineTo(-1e5, t)
        band.close()
        out.addPath(pathops.op(ink, band, pathops.PathOp.INTERSECTION))
    out.simplify(clockwise=False)  # Überlappungen vereinigen, Außenkonturen gegen den Uhrzeigersinn (CFF)
    return out


def build() -> None:
    data = json.loads((BUILD / "kairos.json").read_text())
    if data.get("format") != FORMAT:
        sys.exit("build/kairos.json hat ein anderes Format – Export neu erzeugen: bun tools/export-font.ts")
    info = data["info"]
    ufo = ufoLib2.Font()
    i = ufo.info
    i.familyName, i.styleName, i.postscriptFontName = info["family"], info["style"], "KAIROSFont-Regular"
    i.versionMajor, i.versionMinor = 0, 2
    i.openTypeNameUniqueID = f"KAIROSFont-Regular {info['version']}"  # je Build neu: macOS erkennt die neue Fassung
    i.unitsPerEm, i.capHeight, i.xHeight = info["unitsPerEm"], info["capHeight"], info["capHeight"]
    i.ascender, i.descender = info["ascender"], info["descender"]
    i.openTypeOS2TypoAscender, i.openTypeOS2TypoDescender, i.openTypeOS2TypoLineGap = info["ascender"], info["descender"], 0
    i.openTypeHheaAscender, i.openTypeHheaDescender, i.openTypeHheaLineGap = info["ascender"], info["descender"], 0
    i.openTypeOS2WinAscent, i.openTypeOS2WinDescent = info["ascender"], -info["descender"]
    for g in data["glyphs"]:
        glyph = ufo.newGlyph(g["name"])
        glyph.width = g["advance"]
        glyph.unicodes = g["unicodes"]
        if g["parts"]:
            path = outline(g["parts"], info["stroke"])
            if path.area == 0:
                sys.exit(f"Glyphe ohne Kontur: {g['name']}")
            path.draw(CubicPen(glyph.getPen()))
    ufo.glyphOrder = [g["name"] for g in data["glyphs"]]
    for first, second, value in data["kerning"]:
        ufo.kerning[(first, second)] = value
    ufo.features.text = (BUILD / "features.fea").read_text()
    otf = ufo2ft.compileOTF(ufo, removeOverlaps=False)  # Konturen sind schon vereinigt
    DIST.mkdir(exist_ok=True)
    otf.save(DIST / "KAIROSFont-Regular.otf")
    otf.flavor = "woff2"
    otf.save(DIST / "KAIROSFont-Regular.woff2")
    print(f"dist/KAIROSFont-Regular.otf + .woff2: {len(data['glyphs'])} Glyphen")


if __name__ == "__main__":
    build()
```

- [ ] **Schritt 2: Tests und Typen prüfen**

Run: `bun test && bunx tsc --noEmit -p .`
Expected: `72 pass`, `0 fail`; tsc ohne Ausgabe (Exit 0)

- [ ] **Schritt 3: Font bauen**

`bun run font` (beim ersten Mal lädt uv die Pakete aus dem Netz). Erwartet: `dist/KAIROSFont-Regular.otf + .woff2: 166 Glyphen`, OTF etwa 46 KB, WOFF2 etwa 18 KB. Schnellprobe: `uv run --no-project --with uharfbuzz python -c "import uharfbuzz as hb; f = hb.Font(hb.Face(hb.Blob.from_file_path('dist/KAIROSFont-Regular.otf'))); b = hb.Buffer(); b.add_str('FLÄCHE'); b.guess_segment_properties(); hb.shape(f, b, {}); print([f.glyph_to_string(i.codepoint) for i in b.glyph_infos])"` → `['F.nest.t40', 'L.short.foot', 'Adieresis.lift', 'C.term', 'H', 'E']`.

- [ ] **Schritt 4: Commit**

```bash
git add package.json tools/build_font.py
git commit -m "feat: Font-Build OTF und WOFF2

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 7: Font-Prüfung mit harfbuzz

**Dateien:**
- Neu: `tools/test_font.py`
- Ändern: `package.json` (`font` prüft zum Schluss)

**Schnittstellen:**
- Verbraucht: `BUILD`, `DIST`, `outline` aus `tools/build_font.py`; `expect` aus `build/kairos.json`
- Liefert: `uv run tools/test_font.py` endet mit `✓ Font in Ordnung` und Code 0, sonst Liste der Fehler und Code 1

- [ ] **Schritt 1: Code**

In `package.json` ersetzen:

```json
"font": "bun tools/export-font.ts && uv run tools/build_font.py"
```

durch:

```json
"font": "bun tools/export-font.ts && uv run tools/build_font.py && uv run tools/test_font.py"
```

Neue Datei `tools/test_font.py`:

```python
# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools[woff]>=4.66", "ufo2ft>=3.9", "ufoLib2>=0.18", "skia-pathops>=0.9", "uharfbuzz>=0.50"]
# ///
"""Font prüfen (Spec M2 §7): Zeichentabelle, Konturen, Formung mit harfbuzz, Tintenfläche gegen die Engine."""
import json
import sys
from pathlib import Path

import pathops
import uharfbuzz as hb
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

sys.path.insert(0, str(Path(__file__).parent))
from build_font import BUILD, DIST, outline  # noqa: E402  gleiche Strich-Strecke wie der Build

OTF = DIST / "KAIROSFont-Regular.otf"
fails: list[str] = []


def check(ok: bool, msg: str) -> None:
    if not ok:
        fails.append(msg)


def ink(glyphset, name: str, x: float = 0) -> pathops.Path:
    p = pathops.Path()
    glyphset[name].draw(TransformPen(p.getPen(), (1, 0, 0, 1, x, 0)))
    return p


def grow(p: pathops.Path, d: float) -> pathops.Path:
    """Fläche um d Einheiten nach allen Seiten erweitert."""
    edge, out = pathops.Path(), pathops.Path()
    edge.addPath(p)
    edge.stroke(2 * d, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4)
    edge.convertConicsToQuads()  # runde Ecken kommen als Kegelschnitte, simplify kennt nur Quadrate und Kubische
    out.addPath(p)
    out.addPath(edge)
    out.simplify()
    return out


def shape(font: hb.Font, text: str, features: dict) -> list[list[tuple[str, int]]]:
    """Glyphen je Wort mit Ursprung (Vorschübe samt Unterschneidung)."""
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, features)
    words, cur, x = [], [], 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = font.glyph_to_string(info.codepoint)
        if name == "space":
            words, cur = words + [cur] if cur else words, []
        else:
            cur.append((name, x))
        x += pos.x_advance
    return words + [cur] if cur else words


def main() -> None:
    data = json.loads((BUILD / "kairos.json").read_text())
    otf = TTFont(OTF)
    glyphset, cmap = otf.getGlyphSet(), otf.getBestCmap()

    # 1 Zeichentabelle deckt alle Zeichen ab, Kleinbuchstaben eingeschlossen
    missing = sorted(hex(u) for g in data["glyphs"] for u in g["unicodes"] if u not in cmap)
    check(not missing, f"Zeichen fehlen in der Zeichentabelle: {missing}")

    # 2 Konturen: nichts überlappt, alles im Band
    for g in data["glyphs"]:
        if not g["parts"]:
            continue
        p, u = ink(glyphset, g["name"]), ink(glyphset, g["name"])
        u.simplify()
        check(abs(u.area - p.area) <= 0.005 * p.area + 1, f"{g['name']}: Konturen überlappen")
        _, ymin, _, ymax = p.bounds
        bottom, top = min(q["bottom"] for q in g["parts"]), max(q["top"] for q in g["parts"])
        check(bottom - 1 <= ymin and ymax <= top + 1, f"{g['name']}: Kontur verlässt das Band ({ymin:.0f}…{ymax:.0f})")

    # 3 Formung mit harfbuzz: Glyphenfolge und Schritte wie die Engine; 4 Tintenfläche gegen die Engine
    font = hb.Font(hb.Face(hb.Blob.from_file_path(str(OTF))))
    for e in data["expect"]:
        got = shape(font, e["text"], e["features"])
        names, want = [[n for n, _ in w] for w in got], [[g["name"] for g in w] for w in e["words"]]
        check(names == want, f"„{e['text']}“ {e['features']}: {names} statt {want}")
        for gw, ww in zip(got, e["words"]):
            for (n1, x1), (n2, x2), a, b in zip(gw, gw[1:], ww, ww[1:]):
                check(abs((x2 - x1) - (b["x"] - a["x"])) <= 1, f"„{e['text']}“ {n1}→{n2}: Schritt {x2 - x1} statt {b['x'] - a['x']:.1f}")
        if e["parts"]:
            want_ink, got_ink = outline(e["parts"], data["info"]["stroke"]), pathops.Path()
            for name, x in got[0]:
                got_ink.addPath(ink(glyphset, name, x))
            got_ink.simplify()
            # Rundung auf ganze Einheiten verschiebt Kanten um bis zu 1; gezählt wird, was mehr als 1,5 Einheiten abweicht
            diff = pathops.op(want_ink, grow(got_ink, 1.5), pathops.PathOp.DIFFERENCE).area + pathops.op(got_ink, grow(want_ink, 1.5), pathops.PathOp.DIFFERENCE).area
            check(diff <= 0.01 * want_ink.area, f"„{e['text']}“: Tintenfläche weicht um {diff / want_ink.area:.2%} ab")

    print(f"{len(data['glyphs'])} Glyphen, {len(data['kerning'])} Unterschneidungen, {len(data['expect'])} Sollwerte geprüft")
    if fails:
        print("\n".join(f"✗ {f}" for f in fails))
        sys.exit(1)
    print("✓ Font in Ordnung")


if __name__ == "__main__":
    main()
```

- [ ] **Schritt 2: Tests und Typen prüfen**

Run: `bun test && bunx tsc --noEmit -p .`
Expected: `72 pass`, `0 fail`; tsc ohne Ausgabe (Exit 0)

- [ ] **Schritt 3: Prüfung laufen lassen**

`bun run font` → letzte Zeilen `166 Glyphen, 4846 Unterschneidungen, 10 Sollwerte geprüft` und `✓ Font in Ordnung`. Gegenprobe: in `build/kairos.json` einen Unterschneidungswert eines Paars aus „FLÄCHE“ um 10 ändern, nur `uv run tools/build_font.py && uv run tools/test_font.py` laufen lassen → Fehler „Schritt … statt …“; danach `bun run font` stellt alles wieder her.

- [ ] **Schritt 4: Commit**

```bash
git add package.json tools/test_font.py
git commit -m "test: Font-Prüfung mit harfbuzz

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 8: Testseite font.html

**Dateien:**
- Neu: `font.html`, `src/fonttest.ts`
- Ändern: `src/assets.d.ts` (Import von `.woff2`)
- Ändern: `package.json` (`dev` mit beiden Seiten)

**Schnittstellen:**
- Verbraucht: `dist/KAIROSFont-Regular.woff2` (Task 6), `layoutLine`, `svgString`, `FLAECHE_1902`
- Liefert: Seite http://localhost:3457/font (Bun benennt die Route nach der Datei)

- [ ] **Schritt 1: Code**

In `package.json` ersetzen:

```json
"dev": "bun --port=3457 ./index.html"
```

durch:

```json
"dev": "bun --port=3457 ./index.html ./font.html"
```

An das Ende von `src/assets.d.ts` anhängen:

```ts
declare module "*.woff2" {
  const url: string;
  export default url;
}
```

Neue Datei `font.html`:

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>KAIROS Font – Probe</title>
    <style>
      body { margin: 0; padding: 16px; font: 14px/1.4 system-ui, sans-serif; color: #1d1a17; background: #f6f1e7; }
      header { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
      #text { width: min(520px, 80vw); padding: 6px 8px; font: 600 18px system-ui, sans-serif; letter-spacing: 0.08em; }
      h2 { margin: 20px 0 6px; font-size: 12px; font-weight: 600; color: #6b6152; text-transform: uppercase; letter-spacing: 0.1em; }
      #font { font-family: "KAIROS Font"; font-size: 120px; line-height: 1.15; white-space: pre; overflow-x: auto; }
      #font.dlig { font-variant-ligatures: common-ligatures discretionary-ligatures contextual; }
      #engine svg { display: block; }
      #status { color: #8a5a12; min-height: 1.4em; }
    </style>
  </head>
  <body>
    <header>
      <input id="text" value="DIE FLÄCHE" aria-label="Text" />
      <label><input id="dlig" type="checkbox" /> bedingte Ligaturen (HAF)</label>
    </header>
    <div id="status"></div>
    <h2>Font (WOFF2, calt und liga an)</h2>
    <div id="font"></div>
    <h2>Engine (Verschränkung 0,5)</h2>
    <div id="engine"></div>
    <script type="module" src="./src/fonttest.ts"></script>
  </body>
</html>
```

Neue Datei `src/fonttest.ts`:

```ts
// Testseite: Text in der Webfont neben dem Engine-Ergebnis (Spec M2 §5.5)
import fontUrl from "../dist/KAIROSFont-Regular.woff2";
import { layoutLine } from "./engine";
import { svgString } from "./render";
import { FLAECHE_1902 } from "./style";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const PX = 120 / 1000; // Schriftgrad 120 px bei 1000 Einheiten je Geviert: Engine-SVG im selben Maßstab

function update() {
  const text = $<HTMLInputElement>("text").value;
  $("font").textContent = text;
  $("font").classList.toggle("dlig", $<HTMLInputElement>("dlig").checked);
  const v = layoutLine(text, { style: FLAECHE_1902, interlock: 0.5, targetWidth: null, pins: { letters: {}, joins: {} } }).variants[0];
  $("engine").innerHTML = v ? svgString(v, FLAECHE_1902, { ink: "#1d1a17", paper: null }) : "";
  const svg = $("engine").querySelector("svg");
  if (svg) for (const k of ["width", "height"]) svg.setAttribute(k, String(Number(svg.getAttribute(k)) * PX));
}

const face = new FontFace("KAIROS Font", `url(${fontUrl})`);
document.fonts.add(face);
face.load().then(
  () => ($("status").textContent = ""),
  () => ($("status").textContent = "Webfont nicht geladen – erst „bun run font“ ausführen"),
);
$("text").addEventListener("input", update);
$("dlig").addEventListener("change", update);
update();
```

- [ ] **Schritt 2: Tests und Typen prüfen**

Run: `bun test && bunx tsc --noEmit -p .`
Expected: `72 pass`, `0 fail`; tsc ohne Ausgabe (Exit 0)

- [ ] **Schritt 3: Browser-Prüfung**

Erst `bun run font`, dann `bun run dev`, http://localhost:3457/font öffnen. Erwartet: „DIE FLÄCHE“ in der Webfont verschmolzen wie darunter in der Engine; „HAGEN AAD FOCK“ erscheint als ausgearbeiteter Schriftzug; mit Häkchen „bedingte Ligaturen“ wird „HAF“ zum Monogramm, „HAFEN“ bleibt normal; keine Fehler in der Konsole. Die App unter http://localhost:3457 läuft unverändert.

- [ ] **Schritt 4: Commit**

```bash
git add font.html package.json src/assets.d.ts src/fonttest.ts
git commit -m "feat: Testseite für die Webfont

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 9: README und Abnahme durch Hagen

**Dateien:**
- Ändern: `README.md` (Befehle, Aufbau)
- Ändern (nach Abnahme, Controller): `docs/superpowers/specs/2026-10-07-kairos-font-m2-design.md` Status „abgenommen“

**Schnittstellen:**
- Verbraucht: alles aus Aufgaben 1–8
- Liefert: Doku; Abnahme

- [ ] **Schritt 1: Code**

In `README.md` ersetzen:

```markdown
| `bun run dev` | App auf http://localhost:3457 |
```

durch:

```markdown
| `bun run dev` | App auf http://localhost:3457, Font-Probe auf http://localhost:3457/font |
```

In `README.md` ersetzen:

```markdown
| `bun run sheet` | Prüfblätter nach `out/` (PNG, wenn Inkscape installiert ist) |
```

durch:

```markdown
| `bun run sheet` | Prüfblätter nach `out/` (PNG, wenn Inkscape installiert ist) |
| `bun run font` | Font bauen und prüfen: `dist/KAIROSFont-Regular.otf` und `.woff2` (braucht uv; beim ersten Mal Netz für die Python-Pakete) |
```

In `README.md` ersetzen:

```markdown
| `src/render.ts` | Layout → SVG |
```

durch:

```markdown
| `src/render.ts` | Layout → SVG |
| `src/fontdata.ts` | Font-Daten aus der Engine: Glyphen, calt-Varianten, Unterschneidung, Feature-Datei, Sollwerte |
```

In `README.md` ersetzen:

```markdown
| `src/ui.ts` + `index.html` | Oberfläche |
```

durch:

```markdown
| `src/ui.ts` + `index.html` | Oberfläche |
| `src/fonttest.ts` + `font.html` | Font-Probe: Webfont neben dem Engine-Ergebnis |
```

In `README.md` ersetzen:

```markdown
| `tools/` | Prüfblatt (`sheet.ts`), Referenz-Overlay (`overlay.py`) |
```

durch:

```markdown
| `tools/` | Prüfblatt (`sheet.ts`), Referenz-Overlay (`overlay.py`), Font-Export (`export-font.ts`), Font-Build (`build_font.py`), Font-Prüfung (`test_font.py`) |
```

- [ ] **Schritt 2: Tests und Typen prüfen**

Run: `bun test && bunx tsc --noEmit -p .`
Expected: `72 pass`, `0 fail`; tsc ohne Ausgabe (Exit 0)

- [ ] **Schritt 3: Abnahme durch Hagen (Controller)**

1. Testseite (Task 8) mit Hagen: „DIE FLÄCHE“ und „HAGEN AAD FOCK“ erscheinen verschmolzen.
2. Pages: `dist/KAIROSFont-Regular.otf` per Doppelklick in der Schriftsammlung installieren (bei einer früheren Fassung vorher entfernen), in Pages „KAIROS Font“ wählen, „FLÄCHE“ tippen → verschmolzen wie in der App. Wendet Pages calt nicht an: in TextEdit unter Format → Schrift → Schriften einblenden → Typografie „Kontextbedingte Varianten“ einschalten.
3. Nach dem Ja: Status der Spec auf „abgenommen (Hagen, Datum)“ setzen und committen.

- [ ] **Schritt 4: Commit**

```bash
git add README.md
git commit -m "docs: README für Font-Build und Testseite

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
