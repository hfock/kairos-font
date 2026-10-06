import { expect, test } from "bun:test";
import dieFlaeche from "../presets/die-flaeche.json";
import { cleanPins, cleanPreset, cleanState, type State } from "../src/presets";
import { FLAECHE_1902 } from "../src/style";

const KNOWN = new Set(["die-flaeche"]);
const valid: State = {
  text: "DIE FLÄCHE", interlock: 0.5, target: null, style: { ...FLAECHE_1902 }, variant: 0, pins: { letters: {}, joins: {} },
  ink: "#1d1a17", paper: "#ece2cf", transparent: false, overlay: null, showOverlay: false, opacity: 0.5, selected: null,
};

test("cleanPins: nur endliche Zahlen und bekannte Verbindungen", () => {
  expect(cleanPins({ letters: { 1: { w: 300 } }, joins: { 4: { type: "nest", bar: false } } })).not.toBeNull();
  expect(cleanPins({ letters: { 1: { w: "300" } }, joins: {} })).toBeNull();
  expect(cleanPins({ letters: {}, joins: { 4: { type: "warp" } } })).toBeNull();
  expect(cleanPins({ letters: {}, joins: { 4: { type: "share", sub: "leg", bar: "ja" } } })).toBeNull();
  for (const bad of [null, 5, "x", [], { letters: [] }]) expect(cleanPins(bad)).toBeNull();
});

test("cleanPreset: gültige Vorlage bleibt, Text wird NFC, Kaputtes wird abgelehnt", () => {
  expect(cleanPreset(dieFlaeche, KNOWN)?.name).toBe("DIE FLÄCHE");
  expect(cleanPreset({ ...dieFlaeche, text: "FLÄCHE" }, KNOWN)?.text).toBe("FLÄCHE");
  expect(cleanPreset({ ...dieFlaeche, variant: 1.5 }, KNOWN)?.variant).toBe(0);
  expect(cleanPreset({ ...dieFlaeche, overlay: { ...dieFlaeche.overlay, src: "toString" } }, KNOWN)).toBeNull();
  expect(cleanPreset({ ...dieFlaeche, controls: { targetWidth: "breit", interlock: 0.5 } }, KNOWN)).toBeNull();
  for (const bad of [null, 5, "x", [], {}]) expect(cleanPreset(bad, KNOWN)).toBeNull();
});

test("cleanState: gültiger Stand bleibt, kaputter Speicher führt zum Standard statt zum Absturz", () => {
  expect(cleanState(valid, KNOWN)).toEqual(valid);
  expect(cleanState({ ...valid, ink: '"/><script>' }, KNOWN)).toBeNull();
  expect(cleanState({ ...valid, overlay: { src: "constructor", x: 0, y: 0, w: 1, h: 1 } }, KNOWN)).toBeNull();
  expect(cleanState({ ...valid, style: { ...FLAECHE_1902, capHeight: "700" } }, KNOWN)).toBeNull();
  for (const bad of [null, 5, "x", [], {}, { text: "DIE" }]) expect(cleanState(bad, KNOWN)).toBeNull();
});
