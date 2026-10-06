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
