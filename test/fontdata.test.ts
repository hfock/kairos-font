import { expect, test } from "bun:test";
import { fontData, glyphName } from "../src/fontdata";
import { GLYPHS } from "../src/glyphs";

const data = fontData("test");
const byName = new Map(data.glyphs.map((g) => [g.name, g]));

test("jedes Zeichen hat eine Grundglyphe; Kleinbuchstaben zeigen die Versalien, ß zeigt ẞ, HAF liegt auf U+E000", () => {
  for (const c of Object.keys(GLYPHS)) expect(byName.get(glyphName(c))?.unicodes).toContain(c.codePointAt(0)!);
  expect(byName.get("A")!.unicodes).toEqual([0x41, 0x61]);
  expect(byName.get("Adieresis")!.unicodes).toEqual([0xc4, 0xe4]);
  expect(byName.get("uni1E9E")!.unicodes).toEqual([0x1e9e, 0xdf]);
  expect(byName.get("H_A_F")!.unicodes).toEqual([0xe000]);
  expect(byName.get("space")!.advance).toBe(80); // Lichtweite zwischen Wörtern wie der Wortabstand der App (136)
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

test("Unterschneidung: verbundene Paare stehen wie in der Engine, freie Paare mit der Lichtweite der App", () => {
  const k = new Map(data.kerning.map(([l, r, v]) => [`${l} ${r}`, v]));
  const step = (l: string, r: string) => byName.get(l)!.advance + (k.get(`${l} ${r}`) ?? 0);
  const fl = data.expect.find((e) => e.text === "FLÄCHE")!.words[0];
  for (let i = 1; i < fl.length; i++) expect(Math.abs(step(fl[i - 1].name, fl[i].name) - (fl[i].x - fl[i - 1].x))).toBeLessThanOrEqual(1);
  expect(k.get("H I")).toBeUndefined(); // zwei Stämme: Seitenabstände reichen, keine Unterschneidung nötig
});
