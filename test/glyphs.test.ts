import { expect, test } from "bun:test";
import { inkPoints, minDist, type Stroke } from "../src/geom";
import { GLYPHS, PLACEHOLDER, defaults, inRange, type GlyphDef, type Params } from "../src/glyphs";
import { barLink, instance } from "../src/rules";
import { FLAECHE_1902 as S } from "../src/style";

const ALL = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜẞ"];
const DIGITS = [..."0123456789"];
const MARKS = [...".,:;!?-–()/&'’\"„“‚‘«»€%@#+=*§…"]; // Spec M2 §3: Satz-Grundset und Plakat-Zeichen
const ink = (st: Stroke[]) => st.flatMap((x) => inkPoints(x, S.stroke / 2));
const kinds = (c: string, p: Partial<Params> = {}) =>
  GLYPHS[c].docks({ ...defaults(GLYPHS[c]), ...p }, S).map((d) => d.kind + ("side" in d ? ":" + d.side : ""));

/** Alle Kombinationen aus Minimal-, Start- und Maximalwert jedes Reglers. */
function variants(g: GlyphDef): Params[] {
  return Object.entries(g.params).reduce<Params[]>(
    (out, [k, r]) => out.flatMap((p) => [...new Set([r.min, r.def, r.max])].map((v) => ({ ...p, [k]: v }))),
    [{}],
  );
}

test("alle Versalien, Umlaute und ẞ sind entworfen", () => {
  expect(ALL.filter((c) => !GLYPHS[c])).toEqual([]);
});

test("Ziffern sowie Satz- und Plakat-Zeichen sind entworfen", () => {
  expect([...DIGITS, ...MARKS].filter((c) => !GLYPHS[c])).toEqual([]);
});

test("Tinte bleibt endlich und im Buchstabenfeld (Höhe, x ≥ linker Bezug)", () => {
  const bad = new Set<string>();
  for (const g of [...[...ALL, ...DIGITS, ...MARKS].map((c) => GLYPHS[c]), PLACEHOLDER])
    for (const p of variants(g)) {
      const top = S.capHeight * (p.h ?? 1), bottom = -(g.desc ?? 0); // Satzzeichen ohne Höhenregler: volle Höhe; Komma mit Unterlänge
      for (const q of ink(g.draw(p, S))) {
        // Füße und Spitzen reichen bis eine Strichstärke über Grund- und Oberkante hinaus, der Renderer schneidet dort waagrecht ab;
        // die waagrechte Schnittkante flacher Beine (X, Y breit und kurz) ragt dabei bis Strich/2 ÷ sin θ ≈ 1,05 Striche vor x = 0
        const ok = Number.isFinite(q.x) && Number.isFinite(q.y) && q.y >= bottom - S.stroke && q.y <= top + S.stroke;
        if (!ok || !(q.x >= -1.1 * S.stroke && q.x < 1000)) bad.add(`${g.char} ${JSON.stringify(p)}`);
      }
    }
  expect([...bad]).toEqual([]);
});

test("Andockstellen der Vorlage-Buchstaben", () => {
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

test("Füße von A, Ä und K reichen knapp unter die Grundlinie (waagrechter Schnitt im Renderer), K-Arm und -Bein sind eigene Striche", () => {
  for (const c of ["A", "Ä", "K"]) {
    const ys = GLYPHS[c].draw(defaults(GLYPHS[c]), S).flatMap((st) => [st.start.y, ...st.segs.map((g) => g.p.y)]);
    expect(Math.min(...ys)).toBeLessThan(0);
    expect(Math.min(...ys)).toBeGreaterThan(-S.stroke / 2);
  }
  expect(GLYPHS.K.draw(defaults(GLYPHS.K), S).length).toBe(3);
});

test("Andockstellen der übrigen Versalien", () => {
  expect(kinds("T")).toEqual(["terminal"]); // Arm mündet in den Nachbarstamm (TH, TE)
  expect(kinds("Z")).toEqual(["foot"]);
  expect(kinds("Q")).toEqual(["foot"]);
  expect(kinds("R")).toEqual(["stem:left", "leg:right", "bar"]);
  expect(kinds("R", { bar: 1 })).toEqual(["stem:left", "bar"]); // Knoten unten: Bein zu flach zum Füße-Teilen
  expect(kinds("U")).toEqual(["stem:left", "stem:right"]);
  expect(kinds("Ü")).toEqual(["stem:left", "stem:right"]);
  expect(kinds("M")).toEqual(["stem:left", "stem:right", "bar"]);
  expect(kinds("W")).toEqual(["stem:left", "stem:right", "bar"]);
  expect(kinds("B")).toEqual(["stem:left", "bar"]);
  expect(kinds("P")).toEqual(["stem:left", "bar"]);
  expect(kinds("ẞ")).toEqual(["stem:left"]);
  for (const c of ["J", "S", "V", "Ö"]) expect(kinds(c)).toEqual([]);
});

test("Knoten auf den Balkenlinien: B P R W X Y oben, M unten; sie verbinden nicht mit Nachbarn", () => {
  const knotY = (c: string) => (GLYPHS[c].docks(defaults(GLYPHS[c]), S).find((d) => d.kind === "bar") as { y: number }).y;
  for (const c of ["B", "P", "R", "W", "X", "Y"]) expect(knotY(c)).toBe(S.barHigh);
  expect(knotY("M")).toBe(S.barLow);
  const i = (c: string) => instance(GLYPHS[c], defaults(GLYPHS[c]), S);
  expect(barLink(i("P"), 0, i("E"), 290, S)).toBeNull();
  expect(barLink(i("H"), 0, i("B"), 300, S)).toBeNull();
});

test("Ö und Ü: Punkt-Quadrate auf der Oberlinie; Ö-Punkte halten armGap Abstand zum Bogen", () => {
  for (const c of ["Ö", "Ü"])
    for (const d of GLYPHS[c].draw(defaults(GLYPHS[c]), S).slice(-2)) {
      expect(d.start.y).toBe(S.capHeight - S.stroke / 2);
      expect((d.segs[0] as { p: { x: number } }).p.x - d.start.x).toBe(S.stroke);
    }
  for (const w of [210, 240, 300]) {
    const st = GLYPHS["Ö"].draw({ h: 1, w }, S);
    expect(minDist(ink(st.slice(0, 1)), 0, ink(st.slice(1)), 0, 100)).toBeGreaterThanOrEqual(S.armGap - 1);
  }
});

test("J: der Haken läuft nie zurück (Anfang nie unter dem Bogenanfang)", () => {
  for (const p of variants(GLYPHS.J)) {
    const [st] = GLYPHS.J.draw(p, S);
    expect(st.start.y).toBeGreaterThanOrEqual((st.segs[0] as { p: { y: number } }).p.y);
  }
});

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
