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
