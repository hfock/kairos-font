import { gapOffset, mergeProfiles, shift, type Profile, type Stroke } from "./geom";
import { GLYPHS, PLACEHOLDER, defaults, inRange, type GlyphDef, type Params } from "./glyphs";
import { apply, barLink, collides, instance, joinsFor, trimTop, type Inst, type Join } from "./rules";
import type { Style } from "./style";

export type Pins = { letters: Record<number, Params>; joins: Record<number, Join> };
export type Options = { style: Style; interlock: number; targetWidth: number | null; pins: Pins; variants?: number };
/** index = Position des Zeichens im Text (Leerzeichen mitgezählt). */
export type Placed = { index: number; char: string; inst: Inst; x: number };
export type Layout = { glyphs: Placed[]; extras: Stroke[]; joins: Record<number, Join>; minX: number; maxX: number; width: number; score: number };
export type Result = { variants: Layout[]; warnings: string[] };

/** Alle Gewichte an einer Stelle. Verbindungskosten bei Verschränkung 0; davon wird gain × Verschränkung abgezogen. */
export const WEIGHTS = { nest: 0.2, underrun: 0.2, term: 0.2, stem: 1.0, leg: 0.6, bar: 0.6, gain: 1.0, width: 0.2, flush: 0.3, rhythm: 0.2, deviation: 5 };
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

/** Text in Wörter aus Buchstaben zerlegen; Versalien, unbekannte Zeichen → Platzhalter. */
function words(text: string, warn: Set<string>): Letter[][] {
  const out: Letter[][] = [];
  let cur: Letter[] = [];
  [...text].forEach((raw, index) => {
    const char = raw === "ß" ? "ẞ" : raw.toUpperCase(); // toUpperCase macht aus ß zwei Buchstaben
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
  const pinL = usePins ? o.pins.letters[last.index] : undefined;
  const lockL = pinL && !conflicts(last.inst.p, pinL) ? pinL : undefined; // schon an der linken Grenze verworfen (Hinweis steht dort)
  const lockR = usePins ? o.pins.letters[cur.index] : undefined;
  const rp0 = { ...defaults(cur.def), ...lockR };
  if (!inRange(cur.def, rp0)) return []; // Pin außerhalb des Spielraums (Vorlage/Speicher): wie unerfüllbar behandeln – sonst riesige Striche
  const options = force ? [{ type: "none" } as Join] : joinsFor(last.inst, instance(cur.def, rp0, s));
  for (const j of options) {
    if (pin && (pin.type !== j.type || pin.sub !== j.sub)) continue;
    const res = apply(j, last.inst, cur.def, rp0, s);
    if (!res) continue;
    // Ein gepinnter oberer Arm gilt: Regeln verlängern ihn nicht, die Armkürzung lässt ihn stehen
    const lp = lockL?.top === undefined ? res.lp : { ...res.lp, top: lockL.top };
    if (conflicts(lp, lockL) || conflicts(res.rp, lockR) || !inRange(last.inst.def, lp)) continue;
    const rx = last.x + res.dx, r = instance(cur.def, res.rp, s);
    const l0 = lp === last.inst.p ? last.inst : instance(last.inst.def, lp, s);
    const l = lockL?.top === undefined ? trimTop(l0, last.x, r, rx, s) : l0;
    const prevTop = usePins && prev ? o.pins.letters[prev.index]?.top : undefined;
    const p = prev && (prevTop === undefined ? trimTop(prev.inst, prev.x, r, rx, s) : prev.inst);
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
  let p0 = { ...defaults(first.def), ...o.pins.letters[first.index] };
  if (!inRange(first.def, p0)) {
    warn.add(`Pin bei „${first.char}“ nicht erfüllbar`); // Wert außerhalb des Spielraums, z. B. aus einer bearbeiteten Vorlage
    p0 = defaults(first.def);
  }
  let beam: Node[] = [{ placed: [{ index: first.index, char: first.char, inst: instance(first.def, p0, s), x: 0 }], joins: {}, extras: [], cost: 0, key: "" }];
  for (let k = 1; k < word.length; k++) {
    let next = beam.flatMap((n) => expand(n, word[k], o, true));
    if (!next.length) {
      warn.add(`Pin bei „${word[k - 1].char}${word[k].char}“ nicht erfüllbar`);
      next = beam.flatMap((n) => expand(n, word[k], { ...o, pins: { letters: o.pins.letters, joins: {} } }, true));
      if (!next.length) next = beam.flatMap((n) => expand(n, word[k], o, false));
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

/** Regel e: Breiten im Spielraum anpassen, bis die Zeile die Zielbreite hat. Verbindungen und Pins bleiben so, wie die Variante sie hat. */
function fitWidth(v: Layout, ws: Letter[][], o: Options): Layout {
  const target = o.targetWidth!;
  let cur = v, step = 1;
  for (let it = 0; it < 8 && Math.abs(target - cur.width) > 1; it++) {
    const delta = target - cur.width;
    const flex = cur.glyphs.filter((g) => g.inst.def.params.w && o.pins.letters[g.index]?.w === undefined);
    const room = flex.map((g) => (delta > 0 ? g.inst.def.params.w.max - g.inst.p.w : g.inst.p.w - g.inst.def.params.w.min));
    const total = room.reduce((a, b) => a + b, 0);
    if (total < 1) break;
    const ratio = Math.min(1, Math.abs(delta) / total) * Math.sign(delta) * step;
    // gepinnte Regler so festhalten, wie die Variante sie tatsächlich hat – ein unerfüllbarer Pin blockiert sonst jede Runde
    const letters: Record<number, Params> = {};
    for (const g of cur.glyphs) {
      const lock = o.pins.letters[g.index];
      if (lock) letters[g.index] = Object.fromEntries(Object.keys(lock).map((k) => [k, g.inst.p[k]]));
    }
    flex.forEach((g, i) => (letters[g.index] = { ...letters[g.index], w: g.inst.p.w + ratio * room[i] }));
    const lost = new Set<string>();
    const next = assemble(ws.map((w) => searchWord(w, { ...o, pins: { letters, joins: cur.joins } }, lost)[0]), v.score, o.style);
    if (lost.size) {
      step /= 2; // Schritt zu groß: eine Verbindung würde reißen – kleiner weiter
      continue;
    }
    cur = next;
  }
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
  if (o.targetWidth && variants.length) {
    const t = o.targetWidth;
    variants = variants
      .map((v) => fitWidth(v, ws, o))
      .map((v) => ({ ...v, score: v.score + WEIGHTS.deviation * (Math.abs(t - v.width) / s.capHeight) }))
      .sort((a, b) => a.score - b.score); // stabil: Gleichstände behalten ihre Rangfolge
    if (Math.abs(t - variants[0].width) > 2) warn.add("Zielbreite nicht erreichbar – nächstbeste Breite gezeigt");
  }
  return { variants, warnings: [...warn] };
}

/** Mögliche Verbindungen an der Grenze nach Zeichen i (leer an Wortgrenzen). */
export function joinOptions(v: Layout, i: number): Join[] {
  const k = v.glyphs.findIndex((g) => g.index === i), a = v.glyphs[k], b = v.glyphs[k + 1];
  return a && b && b.index === i + 1 ? joinsFor(a.inst, b.inst) : [];
}
