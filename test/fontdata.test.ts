import { expect, test } from "bun:test";
import { fontData, glyphName } from "../src/fontdata";
import { GLYPHS } from "../src/glyphs";

const data = fontData("test");
const byName = new Map(data.glyphs.map((g) => [g.name, g]));

test("jedes Zeichen hat eine Grundglyphe mit genau seinem Codepunkt, HAF liegt auf U+E000", () => {
  for (const c of Object.keys(GLYPHS)) expect(byName.get(glyphName(c))?.unicodes).toEqual([c.codePointAt(0)!]);
  expect(byName.get("A")!.unicodes).toEqual([0x41]);
  expect(byName.get("Adieresis")!.unicodes).toEqual([0xc4]);
  expect(byName.get("uni1E9E")!.unicodes).toEqual([0x1e9e]);
  expect(byName.get("H_A_F")!.unicodes).toEqual([0xe000]);
  expect(byName.get("space")!.advance).toBe(80); // 136 zwischen den Wortkästen (Seitenabstände + 80) – so eng setzt auch die App mindestens; nach der Tinte darf sie weiter setzen
  expect(data.glyphs.map((g) => g.name).filter((n) => !/^[A-Za-z0-9._]+$/.test(n))).toEqual([]); // gültige Glyphennamen (Adobe Glyph List)
}, 20000);

test("Feature-Datei nennt nur vorhandene Glyphen und enthält liga, dlig und calt", () => {
  const names = new Set(byName.keys()), body = data.fea.replace(/^languagesystem.*$/gm, "").replace(/@\w+/g, ""); // Klassennamen zählen nicht
  const used = body.match(/[A-Za-z_][A-Za-z0-9_.]*(?=['\s;\]])/g)!.filter((w) => !["sub", "by", "ignore", "lookup", "feature", "calt", "liga", "dlig"].includes(w));
  const unknown = used.filter((w) => !names.has(w) && !/^[A-Z_]+_LIG$|^NEST_|^UNDERRUN_|^TERM_/.test(w));
  expect([...new Set(unknown)]).toEqual([]);
  for (const f of ["feature liga", "feature dlig", "feature calt"]) expect(data.fea).toContain(f);
});

test("Sollwerte: FLÄCHE mit gekürztem F-Arm, Namens-Ligatur, Monogramm nur als eigenes Wort", () => {
  const words = (t: string, f = {}) => data.expect.find((e) => e.text === t && JSON.stringify(e.features) === JSON.stringify(f))!.words.map((w) => w.map((g) => g.name).join(" "));
  expect(words("FLÄCHE")).toEqual(["F.nest.t40 L.short.foot Adieresis.lift C.term H E"]);
  expect(words("HAGEN AAD FOCK")).toEqual(["H_A_G_E_N_space_A_A_D_space_F_O_C_K"]);
  expect(words("HAF", { dlig: true })).toEqual(["H_A_F"]);
  expect(words("HAFEN", { dlig: true })).toEqual(["H A F.nest E.short N"]);
  for (const e of data.expect) for (const w of e.words) for (const g of w) expect(byName.has(g.name)).toBe(true);
});

test("Kleinbuchstaben haben eigene Glyphen; Namenszug und Monogramm nur in Versalien", () => {
  expect(byName.get("a")!.unicodes).toEqual([0x61]);
  expect(byName.get("A")!.unicodes).toEqual([0x41]);
  expect(byName.get("germandbls")!.unicodes).toEqual([0xdf]);
  expect(byName.get("uni1E9E")!.unicodes).toEqual([0x1e9e]);
  expect(data.fea).toMatch(/@WORD = \[[^\]]*\ba\b[^\]]*\]/); // Kleinbuchstaben blockieren die Ligaturen am Wortrand
  const words = (t: string, f = {}) => data.expect.find((e) => e.text === t && JSON.stringify(e.features) === JSON.stringify(f))?.words.map((w) => w.map((g) => g.name).join(" "));
  expect(words("Hagen Aad Fock")?.[0]).not.toContain("H_A_G_E_N");
  expect(words("haf", { dlig: true })).toEqual(["h a f"]);
  expect(words("Fd")).toEqual(["F.nest.t50 d"]); // schon die Oberlänge des d kürzt den F-Arm
  expect(data.fea).toContain("sub F' d by F.nest.t50;");
});

test("Abgleich verliert nur Folgen, die der Font nicht nachbilden kann", () => {
  // FF…: ein verschachteltes F verschachtelt nicht noch einmal; F0?, FJ?: das ? kürzt den F-Arm nur um 0,12 (unter der Rundungsgrenze 0,5), der Font setzt F.nest
  expect(data.dropped.filter((t) => !t.startsWith("FF"))).toEqual(["F0?", "FJ?"]);
});

test("Sollwerte für Ketten mit Varianten: GLAS, TEAM, OFFEN, AUFTAKT", () => {
  const words = (t: string) => data.expect.find((e) => e.text === t)!.words.map((w) => w.map((g) => g.name).join(" "));
  expect(words("GLAS")).toEqual(["G.term L.foot A.lift S"]); // Endstrich vor einer Fuß-Variante
  expect(words("TEAM")).toEqual(["T E.foot A.lift M"]); // Arm mündet in eine Fuß-Variante
  expect(words("OFFEN")).toEqual(["O F.nest F.short E N"]); // ein verschachteltes F verschachtelt nicht noch einmal
  expect(words("AUFTAKT")).toEqual(["A U F.nest T.short A K T"]); // gekürzter T-Arm, rechts frei
});

test("Unterschneidung: verbundene Paare stehen wie in der Engine, freie Paare mit der Lichtweite der App", () => {
  const k = new Map(data.kerning.map(([l, r, v]) => [`${l} ${r}`, v]));
  const step = (l: string, r: string) => byName.get(l)!.advance + (k.get(`${l} ${r}`) ?? 0);
  const off = data.expect.flatMap((e) => e.words.flatMap((w) => w.slice(1).map((g, i) => [e.text, w[i].name, g.name, step(w[i].name, g.name) - (g.x - w[i].x)] as const)));
  expect(off.filter(([, , , d]) => Math.abs(d) > 1)).toEqual([]); // in jedem Sollwort, auch hinter Varianten (T E.foot, T.short A)
  expect(k.get("H I")).toBeUndefined(); // zwei Stämme: Seitenabstände reichen, keine Unterschneidung nötig
});

test("Export hält keine Layouts fest: Spitze unter 1 GB", () => {
  const r = Bun.spawnSync(["/usr/bin/time", "-l", "bun", "tools/export-font.ts"], { stderr: "pipe", stdout: "pipe" });
  expect(r.success).toBe(true);
  const rss = Number(/(\d+)\s+maximum resident set size/.exec(r.stderr.toString())?.[1]);
  expect(rss).toBeLessThan(1e9);
}, 60000);

test("Strich mit eigener Oberkante: eigener Teil mit eigenem Band (k-Arm bis zur x-Höhe)", () => {
  const k = byName.get("k")!;
  expect(k.parts.map((q) => q.top)).toEqual([700, 300]);
  expect(k.parts[1].strokes.length).toBe(1);
});
