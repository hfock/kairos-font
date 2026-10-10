// Font-Daten aus der Engine (Spec M2 §5): Glyphen samt calt-Varianten, Vorschübe, Unterschneidung, Feature-Datei und Sollwerte.
import hagen from "../presets/hagen-aad-fock.json";
import { layoutLine, type Layout, type Pins } from "./engine";
import { shift, type Stroke } from "./geom";
import { GLYPHS, PLACEHOLDER, cutTop, defaults, type Params } from "./glyphs";
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
  "\uE000": "H_A_F",
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
  top: i.def.desc && !i.def.top ? S.capHeight : cutTop(i.def, i.p, S),
});

type Glyph = { name: string; char: string; inst: Inst; role: { left: boolean; right: boolean } }; // left: steht links in einer Verbindung (rechte Seite verbunden); right: steht rechts (linke Seite verbunden)
const opts = { style: S, interlock: 0.5, targetWidth: null, pins: { letters: {}, joins: {} } };
/** Gesetzte Folge, schlank: nur Regler statt Instanzen (Tinte, Profil) – sonst hält der Export Gigabytes fest. */
type Laid = Pick<Layout, "joins"> & { glyphs: { index: number; char: string; x: number; p: Params }[] };
const laid = new Map<string, Laid>(); // jede Folge nur einmal setzen: die Sollwerte brauchen die Paare und Dreierfolgen noch einmal
const best = (text: string) => {
  if (!laid.has(text)) {
    const { joins, glyphs } = layoutLine(text, opts).variants[0];
    laid.set(text, { joins, glyphs: glyphs.map(({ index, char, x, inst }) => ({ index, char, x, p: inst.p })) });
  }
  return laid.get(text)!;
};
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
  const sweep: string[] = []; // Abgleich (Spec §7.1): alle Paare und F-Dreierfolgen werden Sollwerte
  const record = (type: string, l: Glyph, r: Glyph, dx: number) => {
    const j = { l, r, dx };
    joins.push(j);
    const dl = defaults(GLYPHS[l.char]); // links verbunden heißt: die eigene rechte Seite wurde verlängert (T bleibt frei)
    if (OWN_RIGHT.some((k) => k in dl && Math.abs(l.inst.p[k] - dl[k]) > 1e-6)) l.role.left = true;
    if (r !== reg.get(keyOf(r.char, defaults(GLYPHS[r.char])))) r.role.right = true;
    if (type === "underrun") rules.under.push(j);
    if (type === "share") rules.term.push(j);
    return j;
  };
  for (const a of chars)
    for (const b of chars) {
      sweep.push(a + b); // auch ohne mögliche Verbindung: prüft die Unterschneidung der freien Seiten
      if (joinsFor(base(a).inst, base(b).inst).length < 2) continue; // nur „keine“ möglich
      const v = best(a + b), j = v.joins[0], [ga, gb] = v.glyphs;
      if (j.type === "none") continue;
      const l = glyph(a, ga.p), r = glyph(b, gb.p);
      record(j.type, l, r, gb.x - ga.x);
      if (j.type === "nest") (fNest = l), rules.nestX.set(b, r);
    }

  // Dreierfolgen F + X + Z: verschachtelt die Engine trotzdem, kürzt sie den oberen F-Arm, verbindet X weiter?
  for (const x of rules.nestX.keys())
    for (const z of chars) {
      sweep.push("F" + x + z);
      const v = best("F" + x + z), [gF, gX, gZ] = v.glyphs, [jFX, jXZ] = [v.joins[0], v.joins[1]];
      const fn = glyphName("F"), xn = glyphName(x), zn = glyphName(z);
      if (jFX.type !== "nest") {
        rules.skip.push([fn, xn, zn]);
        continue;
      }
      let f = fNest!;
      if (gF.p.top < fNest!.inst.p.top - 0.5) {
        const t = floor5(gF.p.top);
        f = glyph("F", { ...gF.p, top: t }, `F.nest.t${t < 0 ? "m" + -t : t}`); // Glyphennamen ohne Minus
        rules.trim.push([xn, zn, f]);
      }
      // X.short, oder X.short.foot / X.short.term, wenn X rechts weiter verbindet; ein zweites Verschachteln kann der Font nicht
      const further = jXZ.type === "underrun" || jXZ.type === "share";
      const gx = further ? glyph(x, gX.p) : rules.nestX.get(x)!;
      record("nest", f, gx, gX.x - gF.x);
      if (further) record(jXZ.type, gx, glyph(z, gZ.p), gZ.x - gX.x);
    }

  // Unterschneidung: freie Seiten gegeneinander mit dem Abstand „keine Verbindung“, verbundene Paare mit dem Engine-Abstand
  const all = [...reg.values()];
  const leftFree = all.filter((g) => !g.role.left), rightFree = all.filter((g) => !g.role.right);
  const kern = new Map<string, [string, string, number]>();
  for (const l of leftFree)
    for (const r of rightFree) kern.set(`${l.name} ${r.name}`, [l.name, r.name, kernFor(l.inst, r.inst, spacing(l.inst, placed(r), S.gap))]);
  for (const j of joins) {
    // bleibt der rechte Partner unverändert (TH, CH), gilt der Abstand auch für seine links freien Varianten (E.foot, F.nest …)
    const rs = j.r === base(j.r.char) ? all.filter((g) => g.char === j.r.char && !g.role.right) : [j.r];
    for (const r of rs) kern.set(`${j.l.name} ${r.name}`, [j.l.name, r.name, kernFor(j.l.inst, r.inst, j.dx)]);
  }

  // Glyphen: Grundzeichen, Varianten, Leerzeichen, Namens-Ligatur, .notdef
  const notdef = instance(PLACEHOLDER, defaults(PLACEHOLDER), S);
  const glyphs: FontGlyph[] = [
    { name: ".notdef", unicodes: [], advance: advance(notdef), parts: [part(notdef, ox(notdef))] },
    ...all.map((g) => ({ name: g.name, unicodes: g === base(g.char) ? unicodes(g.char) : [], advance: advance(g.inst), parts: [part(g.inst, ox(g.inst))] })),
    { name: "space", unicodes: [0x20], advance: S.wordGap - S.gap, parts: [] },
    { name: "uni00A0", unicodes: [0xa0], advance: S.wordGap - S.gap, parts: [] },
    nameLigature(),
  ];
  const fea = features(reg, fNest!, rules);
  return {
    format: FORMAT,
    info: { family: "Neustift", style: "Regular", version, unitsPerEm: 1000, capHeight: S.capHeight, ascender: 760, descender: -240, stroke: S.stroke },
    glyphs,
    kerning: [...kern.values()].filter(([, , v]) => v !== 0),
    fea,
    expect: expectations(reg, fNest!, sweep),
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
function features(reg: Map<string, Glyph>, fNest: Glyph, r: Rules): string {
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
    "  ignore sub @FNEST F';", // ein verschachteltes F verschachtelt nicht noch einmal
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
  const partner = (c: string) => `[${[...reg.values()].filter((g) => g.char === c && !g.role.right).map((g) => g.name).join(" ")}]`; // Grundglyphe samt links freier Varianten
  out.push(`lookup TERM_LEFT {\n${uniq(termLeft.map((j) => `  sub ${input(j.l)}' ${partner(j.r.char)} by ${j.l.name};`)).join("\n")}\n} TERM_LEFT;`);
  out.push(`feature calt {\n  lookup NEST_LEFT;\n  lookup NEST_RIGHT;\n  lookup UNDERRUN_LEFT;\n  lookup UNDERRUN_RIGHT;\n  lookup TERM_LEFT;\n} calt;`);
  return out.join("\n") + "\n";
}

const TESTS: [string, Record<string, boolean>][] = [
  ["FLÄCHE", {}], ["fläche", {}], ["DIE FLÄCHE", {}], ["HAGEN AAD FOCK", {}], ["HAF", { dlig: true }], ["HAF", {}], ["HAFEN", { dlig: true }],
  ["WIENER WERKSTÄTTE", {}], ["THEATER", {}], ["ZAUBER", {}], ["GLAS", {}], ["TEAM", {}], ["OFFEN", {}], ["AUFTAKT", {}],
];

/** Sollwerte: Glyphenfolge und Ursprünge je Wort wie die Engine; bei einem Wort zusätzlich die Striche für den Flächenvergleich.
 *  Dazu der Abgleich (Spec §7.1) über alle Paare und F-Dreierfolgen, ohne Striche; Folgen mit einer Glyphe, die der Font nicht haben kann (?), entfallen. */
function expectations(reg: Map<string, Glyph>, fNest: Glyph, sweep: string[]): Expect[] {
  const find = (c: string, p: Params) => {
    const q = c === "F" && p.top < fNest.inst.p.top - 0.5 ? { ...p, top: floor5(p.top) } : p; // gekürzter Arm: abgerundete Variante
    const k = c + JSON.stringify(Object.keys(GLYPHS[c].params).map((x) => Math.round(q[x] * 100) / 100));
    return reg.get(k)?.name ?? `?${c}`;
  };
  const entry = (text: string, features: Record<string, boolean>): Expect => {
    const upper = text.toUpperCase();
    if (upper === hagen.text) return { text, features, words: [[{ name: NAME_LIG, x: 0 }]], parts: null };
    if (upper === "HAF" && features.dlig) return { text, features, words: [[{ name: "H_A_F", x: 0 }]], parts: null };
    const gs = best(text).glyphs.map((g) => ({ ...g, inst: instance(GLYPHS[g.char], g.p, S) })), words: ExpectGlyph[][] = [];
    let start = 0;
    gs.forEach((g, i) => {
      const o = g.x - ox(g.inst);
      if (i === 0 || g.index !== gs[i - 1].index + 1) words.push([]), (start = o);
      words[words.length - 1].push({ name: find(g.char, g.p), x: o - start });
    });
    const o0 = gs[0].x - ox(gs[0].inst);
    return { text, features, words, parts: words.length === 1 ? gs.map((g) => part(g.inst, g.x - o0)) : null };
  };
  const swept = sweep.map((text) => ({ ...entry(text, {}), parts: null })).filter((e) => !e.words.flat().some((g) => g.name.startsWith("?")));
  return [...TESTS.map(([text, features]) => entry(text, features)), ...swept];
}
