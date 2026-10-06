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

test("d Balken verbinden: Grenze ist der Buchstabenabstand, nicht der Wortabstand", () => {
  const a = inst("A");
  expect(barLink(a, 0, a, a.p.w, { ...S, wordGap: 40 })).not.toBeNull(); // Füße treffen sich: Lücke 51,8 ≤ 56
  expect(barLink(a, 0, a, a.p.w + 100, S)).toBeNull(); // Lücke 151,8 > 56
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
