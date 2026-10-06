import dieFlaeche from "../presets/die-flaeche.json";
import hagen from "../presets/hagen-aad-fock.json";
import overlayUrl from "../reference/die-flaeche-overlay.jpg";
import { joinOptions, layoutLine, type Layout, type Pins, type Placed } from "./engine";
import type { Params } from "./glyphs";
import { svgString, type Overlay } from "./render";
import type { Join } from "./rules";
import { FLAECHE_1902, type Style } from "./style";

type OverlayRef = { src: string; x: number; y: number; w: number; h: number };
type Preset = {
  name: string;
  text: string;
  style: string;
  styleValues?: Partial<Style>;
  controls: { targetWidth: number | null; interlock: number };
  variant: number;
  pins: Pins;
  overlay?: OverlayRef;
};
type State = {
  text: string;
  interlock: number;
  target: number | null;
  style: Style;
  variant: number;
  pins: Pins;
  ink: string;
  paper: string;
  transparent: boolean;
  overlay: OverlayRef | null;
  showOverlay: boolean;
  opacity: number;
  selected: number | null;
};
type HandleKind = "h" | "w" | "bar" | "foot" | "top";

const BUILTIN = [dieFlaeche, hagen] as unknown as Preset[];
const OVERLAYS: Record<string, string> = { "die-flaeche": overlayUrl };
const KEY = "kairos.state", PRESETS = "kairos.presets", SVGNS = "http://www.w3.org/2000/svg";
const LABEL: Record<string, string> = {
  none: "keine",
  nest: "verschachteln",
  underrun: "unterfahren",
  term: "Strich teilen (Bogen)",
  stem: "Strich teilen (Stamm)",
  leg: "Strich teilen (Füße)",
};

const $ = <T extends HTMLElement = HTMLInputElement>(id: string) => document.getElementById(id) as T;
const JOIN_TYPES = new Set(["none", "nest", "underrun", "share"]), JOIN_SUBS = new Set(["term", "stem", "leg"]);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Pins aus Vorlage oder Speicher prüfen: nur endliche Zahlen und bekannte Verbindungen, sonst null. */
function cleanPins(raw: unknown): Pins | null {
  const p = raw as Pins | null;
  if (!p || typeof p.letters !== "object" || typeof p.joins !== "object" || !p.letters || !p.joins) return null;
  for (const ps of Object.values(p.letters)) if (!ps || typeof ps !== "object" || !Object.values(ps).every(isNum)) return null;
  for (const j of Object.values(p.joins)) {
    if (!j || !JOIN_TYPES.has(j.type) || (j.sub !== undefined && !JOIN_SUBS.has(j.sub)) || (j.bar !== undefined && typeof j.bar !== "boolean")) return null;
  }
  return p;
}

/** Ganze Vorlage prüfen (Import und Speicher); Text wird NFC-normalisiert, damit Pin-Indizes passen. */
function cleanPreset(raw: unknown): Preset | null {
  const p = raw as Preset | null;
  if (!p || typeof p.name !== "string" || typeof p.text !== "string" || !isNum(p.controls?.interlock)) return null;
  if (p.controls.targetWidth !== null && !isNum(p.controls.targetWidth)) return null;
  if (p.styleValues && !Object.values(p.styleValues).every(isNum)) return null;
  if (p.overlay && !(OVERLAYS[p.overlay.src] && [p.overlay.x, p.overlay.y, p.overlay.w, p.overlay.h].every(isNum))) return null;
  const pins = cleanPins(p.pins);
  return pins ? { ...p, text: p.text.normalize("NFC"), variant: isNum(p.variant) ? p.variant : 0, pins } : null;
}
const jkey = (j: Join) => j.sub ?? j.type;

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Browser-Speicher gesperrt: App läuft ohne Speichern */
  }
}

const fromPreset = (p: Preset, keep?: State): State => ({
  text: p.text,
  interlock: p.controls.interlock,
  target: p.controls.targetWidth,
  style: { ...FLAECHE_1902, ...p.styleValues },
  variant: p.variant,
  pins: structuredClone(p.pins),
  ink: keep?.ink ?? "#1d1a17",
  paper: keep?.paper ?? "#ece2cf",
  transparent: keep?.transparent ?? false,
  overlay: p.overlay ?? null,
  showOverlay: false,
  opacity: keep?.opacity ?? 0.5,
  selected: null,
});

let state: State = load(KEY, fromPreset(BUILTIN[0]));
const styleOk = (s: Style | undefined) => !!s && Object.entries(s).every(([k, v]) => (k === "id" ? typeof v === "string" : isNum(v)));
if (typeof state.text !== "string" || !styleOk(state.style) || !cleanPins(state.pins)) state = fromPreset(BUILTIN[0]);
let userPresets: Preset[] = load<unknown[]>(PRESETS, []).map(cleanPreset).filter((p): p is Preset => p !== null);
let variants: Layout[] = [];
let layout: Layout | null = null;

// Verlauf: commit() nach jeder abgeschlossenen Änderung merkt den vorigen Stand
let stable = JSON.stringify(state);
const past: string[] = [], future: string[] = [];
function commit() {
  const now = JSON.stringify(state);
  if (now === stable) return;
  past.push(stable);
  if (past.length > 100) past.shift();
  future.length = 0;
  stable = now;
}
function restore(from: string[], to: string[]) {
  const v = from.pop();
  if (!v) return;
  to.push(stable);
  state = JSON.parse(v);
  stable = v;
  syncControls();
  update();
}

function update() {
  const res = layoutLine(state.text, { style: state.style, interlock: state.interlock, targetWidth: state.target, pins: state.pins });
  variants = res.variants;
  state.variant = Math.max(0, Math.min(state.variant, variants.length - 1));
  layout = variants[state.variant] ?? null;
  $("status").textContent = res.warnings.join(" · ");
  renderVariants();
  renderPreview();
  renderLetter();
  save(KEY, state);
}

function renderPreview() {
  const box = $("preview");
  if (!layout) {
    box.innerHTML = "";
    return;
  }
  const ov = state.overlay;
  const overlay: Overlay | null =
    ov && state.showOverlay ? { href: OVERLAYS[ov.src], x: ov.x, y: ov.y, w: ov.w, h: ov.h, opacity: state.opacity } : null;
  box.innerHTML = svgString(layout, state.style, {
    ink: state.ink,
    paper: state.paper,
    interactive: true,
    selected: state.selected,
    pinned: Object.keys(state.pins.letters).map(Number),
    overlay,
  });
  const g = layout.glyphs.find((q) => q.index === state.selected);
  const ink = box.querySelector("#ink") as SVGGraphicsElement;
  if (!g) return;
  const layer = document.createElementNS(SVGNS, "g"); // oberste Ebene, damit Nachbar-Klickflächen die Griffe nicht verdecken
  layer.setAttribute("transform", `translate(${g.x} 0)`);
  ink.appendChild(layer);
  const size = 14 / (ink.getScreenCTM()?.a || 1); // 14 px, egal wie stark die Vorschau verkleinert ist
  for (const h of handles(g)) {
    const r = document.createElementNS(SVGNS, "rect");
    for (const [k, v] of Object.entries({ class: "handle", x: h.x - size / 2, y: h.y - size / 2, width: size, height: size }))
      r.setAttribute(k, String(v));
    r.addEventListener("pointerdown", (e) => drag(e, g, h.kind));
    layer.appendChild(r);
  }
}

/** Griffe in Buchstabenkoordinaten: Höhe, Breite, Balken, Fuß, oberer Arm. */
function handles(g: Placed): { kind: HandleKind; x: number; y: number }[] {
  const s = state.style, p = g.inst.p, { minX, maxX } = g.inst.prof, top = s.capHeight * p.h;
  const out: { kind: HandleKind; x: number; y: number }[] = [{ kind: "h", x: (minX + maxX) / 2, y: top }];
  if ("w" in p) out.push({ kind: "w", x: maxX, y: top / 2 });
  for (const d of g.inst.docks) {
    if (d.kind === "bar" && "bar" in p) out.push({ kind: "bar", x: (d.x0 + d.x1) / 2, y: d.y });
    if (d.kind === "foot") out.push({ kind: "foot", x: d.end, y: s.stroke / 2 });
  }
  if ("top" in p) out.push({ kind: "top", x: p.w + p.top, y: top - s.stroke / 2 });
  return out;
}

function fontPoint(e: PointerEvent) {
  const ink = $("preview").querySelector("#ink") as SVGGraphicsElement;
  return new DOMPoint(e.clientX, e.clientY).matrixTransform(ink.getScreenCTM()!.inverse());
}

/** Griff ziehen: Wert wird als Pin festgehalten, Engine rechnet live neu. */
function drag(e: PointerEvent, start: Placed, kind: HandleKind) {
  e.preventDefault();
  e.stopPropagation();
  const i = start.index, def = start.inst.def, s = state.style;
  const clamp = (k: string, v: number) => Math.min(def.params[k].max, Math.max(def.params[k].min, v));
  const move = (ev: PointerEvent) => {
    const g = layout?.glyphs.find((q) => q.index === i);
    if (!g) return;
    const pt = fontPoint(ev), x = pt.x - g.x, p = g.inst.p;
    let v: Params;
    if (kind === "h") v = { h: clamp("h", pt.y / s.capHeight) };
    else if (kind === "w") v = { w: clamp("w", p.w + x - g.inst.prof.maxX) };
    else if (kind === "bar") v = { bar: pt.y < s.capHeight / 2 ? 1 : 0 };
    else if (kind === "foot") {
      const end = g.inst.docks.find((d) => d.kind === "foot") as { end: number };
      v = { foot: clamp("foot", p.foot + x - end.end) };
    } else v = { top: clamp("top", x - p.w) };
    state.pins.letters[i] = { ...state.pins.letters[i], ...v };
    update();
  };
  const up = () => {
    removeEventListener("pointermove", move);
    removeEventListener("pointerup", up);
    commit();
  };
  addEventListener("pointermove", move);
  addEventListener("pointerup", up);
}

function renderLetter() {
  const g = layout?.glyphs.find((q) => q.index === state.selected);
  $("letter").classList.toggle("on", !!g);
  if (!g || !layout) return;
  $("letterName").textContent = `Buchstabe „${g.char}“`;
  joinSelect($<HTMLSelectElement>("joinLeft"), g.index - 1);
  joinSelect($<HTMLSelectElement>("joinRight"), g.index);
  $("barRight").checked = !!(state.pins.joins[g.index]?.bar ?? layout.joins[g.index]?.bar);
  $("barRight").disabled = joinOptions(layout, g.index).length === 0;
}

/** Auswahlliste der möglichen Verbindungen an einer Grenze; Auswahl = Pin. */
function joinSelect(sel: HTMLSelectElement, boundary: number) {
  const opts = layout ? joinOptions(layout, boundary) : [];
  const auto = layout?.joins[boundary];
  sel.disabled = opts.length === 0;
  sel.innerHTML =
    `<option value="auto">automatisch${auto ? ` (${LABEL[jkey(auto)]})` : ""}</option>` +
    opts.map((j) => `<option value="${jkey(j)}">${LABEL[jkey(j)]}</option>`).join("");
  const pin = state.pins.joins[boundary];
  sel.value = pin ? jkey(pin) : "auto";
  sel.onchange = () => {
    if (sel.value === "auto") delete state.pins.joins[boundary];
    else state.pins.joins[boundary] = { ...opts.find((j) => jkey(j) === sel.value)!, bar: state.pins.joins[boundary]?.bar ?? false };
    update();
    commit();
  };
}

function renderVariants() {
  $("variants").replaceChildren(
    ...variants.map((_, k) => {
      const b = document.createElement("button");
      b.textContent = String(k + 1);
      b.className = k === state.variant ? "on" : "";
      b.onclick = () => {
        state.variant = k;
        update();
        commit();
      };
      return b;
    }),
  );
}

function syncControls() {
  $("text").value = state.text;
  $("interlock").value = String(state.interlock);
  $("targetFree").checked = state.target === null;
  $("target").disabled = state.target === null;
  $("target").value = String(state.target ?? Math.round(layout?.width ?? 2400));
  for (const k of ["stroke", "barHigh", "barLow", "wordGap"] as const) $(k).value = String(state.style[k]);
  $("overlay").checked = state.showOverlay;
  $("overlay").disabled = !state.overlay;
  $("opacity").value = String(state.opacity);
  $("inkColor").value = state.ink;
  $("paperColor").value = state.paper;
  $("transparent").checked = state.transparent;
}

// --- Bedienung -------------------------------------------------------------

$("preview").addEventListener("click", (e) => {
  const hit = (e.target as Element).closest("[data-i]");
  state.selected = hit ? Number(hit.getAttribute("data-i")) : null;
  renderPreview();
  renderLetter();
  save(KEY, state);
});

$("text").addEventListener("input", () => {
  state.text = $("text").value.normalize("NFC"); // „Ä“ als A + Trema (NFD) würde sonst zerfallen
  state.pins = { letters: {}, joins: {} }; // Positionen verschieben sich beim Tippen
  state.selected = null;
  state.variant = 0;
  state.overlay = null;
  state.showOverlay = false;
  syncControls();
  update();
  commit();
});

const sliders: [string, (v: number) => void][] = [
  ["interlock", (v) => (state.interlock = v)],
  ["target", (v) => (state.target = v)],
  ["stroke", (v) => (state.style = { ...state.style, stroke: v })],
  ["barHigh", (v) => (state.style = { ...state.style, barHigh: v })],
  ["barLow", (v) => (state.style = { ...state.style, barLow: v })],
  ["wordGap", (v) => (state.style = { ...state.style, wordGap: v })],
  ["opacity", (v) => (state.opacity = v)],
];
for (const [id, set] of sliders) {
  $(id).addEventListener("input", () => {
    set(Number($(id).value));
    update();
  });
  $(id).addEventListener("change", commit);
}

$("targetFree").addEventListener("change", () => {
  state.target = $("targetFree").checked ? null : Math.round(layout?.width ?? 2400);
  syncControls();
  update();
  commit();
});
$("overlay").addEventListener("change", () => {
  state.showOverlay = $("overlay").checked;
  update();
  commit();
});
// Farbfelder heißen inkColor/paperColor: die id "ink" gehört der Schriftgruppe im SVG
for (const [id, key] of [["inkColor", "ink"], ["paperColor", "paper"]] as const) {
  $(id).addEventListener("input", () => {
    state[key] = $(id).value;
    update();
  });
  $(id).addEventListener("change", commit);
}
$("transparent").addEventListener("change", () => {
  state.transparent = $("transparent").checked;
  save(KEY, state);
  commit();
});
$("barRight").addEventListener("change", () => {
  const i = state.selected;
  if (i === null || !layout) return;
  const cur = state.pins.joins[i] ?? layout.joins[i] ?? { type: "none" };
  state.pins.joins[i] = { ...cur, bar: $("barRight").checked };
  update();
  commit();
});
$("resetLetter").addEventListener("click", () => {
  const i = state.selected;
  if (i === null) return;
  delete state.pins.letters[i];
  delete state.pins.joins[i];
  delete state.pins.joins[i - 1];
  update();
  commit();
});

addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    if (e.shiftKey) restore(future, past);
    else restore(past, future);
    return;
  }
  if (document.activeElement === $("text")) return;
  const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
  if (step && variants[state.variant + step]) {
    state.variant += step;
    update();
    commit();
  }
});

// --- Vorlagen ----------------------------------------------------------------

const presets = () => [...BUILTIN, ...userPresets];
const escapeHtml = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
function renderPresets() {
  $<HTMLSelectElement>("preset").innerHTML =
    `<option value="">Vorlagen …</option>` + presets().map((p, k) => `<option value="${k}">${escapeHtml(p.name)}</option>`).join("");
}
function usePreset(p: Preset) {
  state = fromPreset(p, state);
  syncControls();
  update();
  commit();
}
const toPreset = (name: string): Preset => ({
  name,
  text: state.text,
  style: state.style.id,
  styleValues: { stroke: state.style.stroke, barHigh: state.style.barHigh, barLow: state.style.barLow, wordGap: state.style.wordGap },
  controls: { targetWidth: state.target, interlock: state.interlock },
  variant: state.variant,
  pins: structuredClone(state.pins),
  ...(state.overlay ? { overlay: state.overlay } : {}),
});
$("preset").addEventListener("change", () => {
  const sel = $<HTMLSelectElement>("preset"), p = presets()[Number(sel.value)];
  sel.value = "";
  if (p) usePreset(p);
});
$("savePreset").addEventListener("click", () => {
  const name = prompt("Name der Vorlage", state.text)?.trim();
  if (!name) return;
  userPresets = [...userPresets.filter((p) => p.name !== name), toPreset(name)];
  save(PRESETS, userPresets);
  renderPresets();
});
$("exportPreset").addEventListener("click", () =>
  download(`${slug(state.text)}.json`, new Blob([JSON.stringify(toPreset(state.text), null, 2)], { type: "application/json" })),
);
$("importPreset").addEventListener("change", async () => {
  const input = $("importPreset"), file = input.files?.[0];
  if (!file) return;
  try {
    const p = cleanPreset(JSON.parse(await file.text()));
    if (!p) throw new Error("Format");
    userPresets = [...userPresets.filter((q) => q.name !== p.name), p];
    save(PRESETS, userPresets);
    renderPresets();
    usePreset(p);
  } catch {
    $("status").textContent = "Vorlage ungültig – ignoriert";
  } finally {
    input.value = "";
  }
});

// --- Export ------------------------------------------------------------------

function download(name: string, blob: Blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const slug = (t: string) =>
  t.trim().toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "kairos";
const exportSvg = () => (layout ? svgString(layout, state.style, { ink: state.ink, paper: state.transparent ? null : state.paper }) : null);

$("exportSvg").addEventListener("click", () => {
  const t = exportSvg();
  if (t) download(`${slug(state.text)}.svg`, new Blob([t], { type: "image/svg+xml" }));
});
$("exportPng").addEventListener("click", async () => {
  const t = exportSvg();
  if (!t) return;
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([t], { type: "image/svg+xml" }));
  await img.decode();
  const scale = Number($<HTMLSelectElement>("pngScale").value), c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(img.src);
  c.toBlob((b) => b && download(`${slug(state.text)}.png`, b), "image/png");
});

renderPresets();
update();
syncControls();
