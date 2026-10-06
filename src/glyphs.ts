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
