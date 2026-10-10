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
  const stem = profile(inkPoints(stroke(0, 0, L(0, 700)), 13), 700);
  const foot = profile(inkPoints(stroke(0, 13, L(300, 13)), 13), 700);
  const lShape = mergeProfiles([{ prof: stem, x: 0 }, { prof: foot, x: 0 }]); // L: Stamm + Fuß
  expect(gapOffset(lShape, stem, 50)).toBeCloseTo(50 + 300 + 13); // unten bestimmt der Fuß den Abstand
  expect(gapOffset(lShape, stem, 50, 100)).toBeCloseTo(50 + 13 + 13); // über dem Fuß zählt nur der Stamm
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

test("minDist: zwischengespeichertes Raster rechnet wie alle Paare (Bögen, verschoben, mehrfach abgefragt)", () => {
  const a = inkPoints(stroke(0, -130, C(0, 200, 150, 300, 150, 700)), 13), b = inkPoints(stroke(40, 0, C(-60, 100, -60, 500, 40, 600)), 13);
  const brute = (ax: number, bx: number, limit: number) => {
    let best = Infinity;
    for (const p of a) for (const q of b) best = Math.min(best, Math.hypot(p.x + ax - (q.x + bx), p.y - q.y));
    return best <= limit ? best : Infinity;
  };
  for (const [ax, bx, limit] of [[0, 0, 20], [0, 187.3, 20], [12.5, 190, 20], [0, 240, 100], [-30, 200, 20]])
    expect([ax, bx, limit, minDist(a, ax, b, bx, limit)]).toEqual([ax, bx, limit, brute(ax, bx, limit)]);
});

test("pathData + shift", () => {
  const s = stroke(0, 0, L(0, 100), C(0, 150, 50.04, 200, 100, 200));
  expect(pathData(s)).toBe("M0 0L0 100C0 150 50 200 100 200");
  expect(pathData(closed(shift(s, 10)))).toBe("M10 0L10 100C10 150 60 200 110 200Z");
});
