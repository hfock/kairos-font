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
