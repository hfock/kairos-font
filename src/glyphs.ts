import { C, L, closed, stroke, type Seg, type Stroke } from "./geom";
import type { Style } from "./style";

export type Params = Record<string, number>;
export type Range = { min: number; def: number; max: number };
export type Dock =
  | { kind: "zone"; armY: number } // freie Zone unter einem Arm (rechts), z. B. F
  | { kind: "foot"; end: number } // verlängerbarer Fuß, endet bei x = end
  | { kind: "terminal"; topEnd: number } // offenes Strichende (C/G-Bogen unten, T-Arm); der Nachbarstamm kommt auf topEnd + armGap + Strich/2
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
/** So weit ragt die tiefste Ecke eines stumpfen Schrägstrichs (Lauf dx, Höhe dy) unter seinen Endpunkt. */
const capDrop = (dx: number, dy: number, s: Style) => (s.stroke / 2) * (dx / Math.hypot(dx, dy));

const glyphA: GlyphDef = {
  char: "A",
  params: { h, w: R(300, 377, 420), bar: R(0, 1, 1), legL: R(0, 0, 200) },
  draw(p, s) {
    const t = cTop(p, s), run = (p.w - s.apexW) / 2, by = barY(p, s);
    const xl = (y: number) => (y / t) * run, xr = (y: number) => p.w - (y / t) * run;
    const foot = -capDrop(run, t, s); // Füße knapp unter die Grundlinie; der Renderer schneidet dort waagrecht ab
    const y0 = p.legL > 0 ? p.legL : foot;
    return [stroke(xl(y0), y0, L(run, t), L(p.w - run, t), L(xr(foot), foot)), stroke(xl(by), by, L(xr(by), by))];
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
    return { ...p, legL: y + capDrop(run, t, s) }; // Schnittkante des Beins liegt schräg
  },
};

/** Umlautpunkte: zwei Quadrate (Kantenlänge = Strich) auf Höhe y. */
const dots = (y: number, x0: number, x1: number, s: Style) => [x0, x1].map((x) => stroke(x - s.stroke / 2, y, L(x + s.stroke / 2, y)));

const glyphAE: GlyphDef = {
  ...glyphA,
  char: "Ä",
  draw: (p, s) => [...glyphA.draw(p, s), ...dots(cTop(p, s), p.w / 2 - s.dotOffset, p.w / 2 + s.dotOffset, s)],
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

/** Segel wie beim D: oben schmal (bis a), unten bauchig bis w mit Ecke rb; geschlossen über den Stamm bei x = 0. */
function sail(top: number, bot: number, a: number, w: number, rb: number): Stroke {
  const span = top - bot;
  return closed(
    stroke(a, top, L(0, top), L(0, bot), L(w - rb, bot),
      C(w - rb * (1 - KAPPA), bot, w, bot + rb * (1 - KAPPA), w, bot + rb),
      C(w, bot + rb + 0.4 * span, a + 0.45 * (w - a), top - 0.22 * span, a, top)),
  );
}

const glyphD: GlyphDef = {
  char: "D",
  params: { h, w: R(190, 236, 300), a: R(40, 80, 120) },
  draw: (p, s) => [sail(cTop(p, s), cBot(s), p.a, p.w, 47 * p.h)],
  docks: () => [{ kind: "stem", side: "left", x: 0 }],
  adjust: { right: -17 },
};

const glyphE: GlyphDef = {
  char: "E",
  params: { h, w: R(200, 276, 330), bar: R(0, 0, 1), foot: R(0, 0, 300) },
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
    const drop = capDrop(p.w, j, s); // Fuß knapp unter die Grundlinie; der Renderer schneidet waagrecht ab
    // Arm und Bein als eigene Striche: ihre stumpfen Enden verschwinden im Stamm, nichts ragt links heraus
    return [stroke(0, 0, L(0, inkTop(p, s))), stroke(0.9 * p.w, cTop(p, s), L(0, j)), stroke(0, j, L(p.w * (1 + drop / j), -drop))];
  },
  docks: (p) => [{ kind: "stem", side: "left", x: 0 }, { kind: "leg", side: "right", footX: p.w }], // Fuß wie beim R: KA teilt die Füße
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


/** Knoten auf einer Balkenlinie (Griff „Balken“), verbindet nicht mit Nachbarn. */
const knot = (y: number, x0: number, x1: number): Dock => ({ kind: "bar", y, x0, x1, left: false, right: false });

/** Bauch vom Punkt (a, top) hinab bis zur unteren Ecke (w − rb, bot): rechte Seite des Segels, andersherum gezogen. */
function belly(a: number, top: number, w: number, bot: number, rb: number): Seg[] {
  const span = top - bot;
  return [
    C(a + 0.45 * (w - a), top - 0.22 * span, w, bot + rb + 0.4 * span, w, bot + rb),
    C(w, bot + rb * (1 - KAPPA), w - rb * (1 - KAPPA), bot, w - rb, bot),
  ];
}

/** Runder Bauch am Stamm: oben und unten waagrecht, rechts Rundung mit Radius ≤ halbe Höhe und ≤ halbe Breite. */
function bowl(top: number, bot: number, w: number): Stroke {
  const r = Math.min((top - bot) / 2, w / 2), k = KAPPA * r;
  return closed(
    stroke(0, top, L(w - r, top), C(w - r + k, top, w, top - r + k, w, top - r), L(w, bot + r), C(w, bot + r - k, w - r + k, bot, w - r, bot), L(0, bot)),
  );
}

const glyphB: GlyphDef = {
  char: "B",
  params: { h, w: R(190, 240, 300), bar: R(0, 0, 1) },
  draw(p, s) {
    const t = cTop(p, s), by = barY(p, s), w1 = 0.8 * p.w;
    return [bowl(t, by, w1), sail(by, cBot(s), w1 - Math.min((t - by) / 2, w1 / 2), p.w, 47 * p.h)];
  },
  docks: (p, s) => [{ kind: "stem", side: "left", x: 0 }, knot(barY(p, s), 0, 0.8 * p.w)],
  adjust: { right: -17 },
};

function cup(p: Params, s: Style, left: number): Stroke {
  const b = cBot(s), r = p.w / 2, k = KAPPA * r;
  return stroke(0, left, L(0, b + r), C(0, b + r - k, r - k, b, r, b), C(r + k, b, p.w, b + r - k, p.w, b + r), L(p.w, inkTop(p, s)));
}

const glyphJ: GlyphDef = {
  char: "J",
  params: { h, w: R(150, 190, 260) },
  draw: (p, s) => [cup(p, s, s.barLow * p.h)], // Haken endet auf der unteren Balkenlinie
  docks: () => [], // kein Stamm-Andocken: J + U würde zu „ɯ“
};

/** Zwei Stämme mit flacher Spitze (apexW) auf Höhe vy dazwischen; from = Kante, an der die Diagonalen ansetzen. */
function zigzag(p: Params, s: Style, from: number, vy: number): Stroke {
  const c = p.w / 2, a = s.apexW / 2, to = inkTop(p, s) - from;
  return stroke(0, to, L(0, from), L(c - a, vy), L(c + a, vy), L(p.w, from), L(p.w, to));
}

const glyphM: GlyphDef = {
  char: "M",
  params: { h, w: R(260, 320, 400), bar: R(0, 1, 1) },
  draw: (p, s) => [zigzag(p, s, inkTop(p, s), barY(p, s))],
  docks: (p, s) => [{ kind: "stem", side: "left", x: 0 }, { kind: "stem", side: "right", x: p.w }, knot(barY(p, s), p.w / 2 - s.apexW / 2, p.w / 2 + s.apexW / 2)],
};

const glyphP: GlyphDef = {
  char: "P",
  params: { h, w: R(180, 230, 290), bar: R(0, 0, 1) },
  draw(p, s) {
    return [stroke(0, 0, L(0, inkTop(p, s))), bowl(cTop(p, s), barY(p, s), p.w)];
  },
  docks: (p, s) => [{ kind: "stem", side: "left", x: 0 }, knot(barY(p, s), 0, p.w)],
};

const glyphQ: GlyphDef = {
  char: "Q",
  params: { h, w: R(180, 240, 300), foot: R(0, 0, 300) },
  draw: (p, s) => [...glyphO.draw(p, s), stroke(p.w / 2, cBot(s), L(p.w + 80 + p.foot, cBot(s)))],
  docks: (p) => [{ kind: "foot", end: p.w + 80 + p.foot }],
  reach: (p, end) => ({ ...p, foot: Math.max(0, end - p.w - 80) }),
  adjust: { left: -10 },
};

const glyphR: GlyphDef = {
  char: "R",
  params: { h, w: R(190, 240, 300), bar: R(0, 0, 1) },
  draw(p, s) {
    const by = barY(p, s), drop = capDrop(p.w, by, s);
    return [
      stroke(0, 0, L(0, inkTop(p, s))),
      bowl(cTop(p, s), by, 0.9 * p.w),
      stroke(0, by, L(p.w * (1 + drop / by), -drop)), // Bein wie beim K; Fuß knapp unter die Grundlinie
    ];
  },
  docks: (p, s) => [{ kind: "stem", side: "left", x: 0 }, { kind: "leg", side: "right", footX: p.w }, knot(barY(p, s), 0, 0.9 * p.w)],
};

const glyphS: GlyphDef = {
  char: "S",
  params: { h, w: R(180, 230, 290) },
  draw(p, s) {
    // Kopf wie beim C (Ecke oben links), Fuß wie beim D (Ecke unten rechts), dazwischen ein Schwung, unten bauchiger
    const t = cTop(p, s), b = cBot(s), r = 0.143 * inkTop(p, s), k = KAPPA * r, rb = 47 * p.h, y0 = t - r, y1 = b + rb, span = y0 - y1;
    return [
      stroke(0.85 * p.w, t, L(r, t), C(r - k, t, 0, t - r + k, 0, y0), C(0, y0 - 0.35 * span, p.w, y1 + 0.7 * span, p.w, y1),
        C(p.w, b + rb * (1 - KAPPA), p.w - rb * (1 - KAPPA), b, p.w - rb, b), L(0, b)),
    ];
  },
  docks: () => [],
};

const glyphSZ: GlyphDef = {
  char: "ẞ",
  params: { h, w: R(200, 250, 300) },
  draw(p, s) {
    const t = cTop(p, s), b = cBot(s), wy = s.barHigh * p.h;
    return [stroke(0, 0, L(0, t), L(0.8 * p.w, t), L(0.35 * p.w, wy), ...belly(0.35 * p.w, wy, p.w, b, 47 * p.h), L(0.35 * p.w, b))];
  },
  docks: () => [{ kind: "stem", side: "left", x: 0 }],
};

const glyphT: GlyphDef = {
  char: "T",
  params: { h, w: R(200, 260, 340), top: R(-60, 0, 300) },
  draw(p, s) {
    const t = cTop(p, s);
    return [stroke(0, t, L(p.w + p.top, t)), stroke(p.w / 2, 0, L(p.w / 2, t))];
  },
  // Strich teilen: der rechte Arm mündet oben in den Stamm des Nachbarn (TH, TE); der Arm endet schon dort
  docks: (p, s) => [{ kind: "terminal", topEnd: p.w + p.top - s.armGap - s.stroke / 2 }],
  close: (p) => p,
};

const glyphU: GlyphDef = {
  char: "U",
  params: { h, w: R(180, 240, 300) },
  draw: (p, s) => [cup(p, s, inkTop(p, s))],
  docks: (p) => [{ kind: "stem", side: "left", x: 0 }, { kind: "stem", side: "right", x: p.w }],
};

const glyphUE: GlyphDef = {
  ...glyphU,
  char: "Ü",
  draw: (p, s) => [cup(p, s, inkTop(p, s)), ...dots(cTop(p, s), p.w / 4, (3 * p.w) / 4, s)], // Punkte in der Öffnung
};

const glyphV: GlyphDef = {
  char: "V",
  params: { h, w: R(240, 300, 380) },
  draw(p, s) {
    const top = inkTop(p, s), b = cBot(s), run = (p.w - s.apexW) / 2, d = capDrop(run, top - b, s), x = (-run * d) / (top - b);
    return [stroke(x, top + d, L(run, b), L(p.w - run, b), L(p.w - x, top + d))]; // Enden knapp über die Oberlinie, der Renderer schneidet waagrecht ab
  },
  docks: () => [],
};

const glyphW: GlyphDef = {
  char: "W",
  params: { h, w: R(260, 330, 420), bar: R(0, 0, 1) },
  draw: (p, s) => [zigzag(p, s, 0, barY(p, s))],
  docks: (p, s) => [{ kind: "stem", side: "left", x: 0 }, { kind: "stem", side: "right", x: p.w }, knot(barY(p, s), p.w / 2 - s.apexW / 2, p.w / 2 + s.apexW / 2)],
};

const glyphX: GlyphDef = {
  char: "X",
  params: { h, w: R(200, 260, 340), bar: R(0, 0, 1) },
  draw(p, s) {
    const top = inkTop(p, s), y = barY(p, s), c = p.w / 2, dt = capDrop(c, top - y, s), db = capDrop(c, y, s);
    const xt = (-c * dt) / (top - y), xb = (c * db) / y; // Enden knapp über Ober- und unter Grundlinie
    return [stroke(xt, top + dt, L(c, y), L(p.w + xb, -db)), stroke(p.w - xt, top + dt, L(c, y), L(-xb, -db))];
  },
  docks: (p, s) => [knot(barY(p, s), p.w / 2 - 20, p.w / 2 + 20)],
};

const glyphY: GlyphDef = {
  char: "Y",
  params: { h, w: R(200, 260, 340), bar: R(0, 0, 1) },
  draw(p, s) {
    const top = inkTop(p, s), y = barY(p, s), c = p.w / 2, d = capDrop(c, top - y, s), x = (-c * d) / (top - y);
    return [stroke(x, top + d, L(c, y), L(p.w - x, top + d)), stroke(c, 0, L(c, y))];
  },
  docks: (p, s) => [knot(barY(p, s), p.w / 2 - 20, p.w / 2 + 20)],
};

const glyphZ: GlyphDef = {
  char: "Z",
  params: { h, w: R(200, 250, 320), foot: R(0, 0, 300) },
  draw(p, s) {
    const t = cTop(p, s), b = cBot(s);
    return [stroke(0, t, L(p.w, t), L(0, b), L(p.w + p.foot, b))];
  },
  docks: (p) => [{ kind: "foot", end: p.w + p.foot }],
  reach: (p, end) => ({ ...p, foot: Math.max(0, end - p.w) }),
};

const glyphOE: GlyphDef = {
  ...glyphO,
  char: "Ö",
  params: { h, w: R(210, 240, 300) }, // schmaler ragen die Punkte zu weit über die Flanken
  draw(p, s) {
    // Punkte in den freien oberen Ecken, armGap Luft zum Bogen (halbe Diagonale eines Punkts = Strich/2 · √2)
    const r = p.w / 2, off = Math.sqrt((r + (s.stroke / 2) * (1 + Math.SQRT2) + s.armGap) ** 2 - r ** 2);
    return [...glyphO.draw(p, s), ...dots(cTop(p, s), r - off, r + off, s)];
  },
};

/** Ersatz für noch nicht entworfene Zeichen. */
export const PLACEHOLDER: GlyphDef = {
  char: "?",
  params: { h },
  draw: (p, s) => [closed(stroke(0, cBot(s), L(200, cBot(s)), L(200, cTop(p, s)), L(0, cTop(p, s))))],
  docks: () => [],
};

export const GLYPHS: Record<string, GlyphDef> = Object.fromEntries(
  [glyphA, glyphAE, glyphB, glyphC, glyphD, glyphE, glyphF, glyphG, glyphH, glyphI, glyphJ, glyphK, glyphL, glyphM, glyphN, glyphO, glyphOE, glyphP, glyphQ, glyphR, glyphS, glyphSZ, glyphT, glyphU, glyphUE, glyphV, glyphW, glyphX, glyphY, glyphZ].map((g) => [g.char, g]),
);

export const defaults = (g: GlyphDef): Params => Object.fromEntries(Object.entries(g.params).map(([k, r]) => [k, r.def]));
export const inRange = (g: GlyphDef, p: Params) =>
  Object.entries(g.params).every(([k, r]) => {
    const eps = (r.max - r.min) * 1e-3 + 1e-9;
    return p[k] >= r.min - eps && p[k] <= r.max + eps;
  });
