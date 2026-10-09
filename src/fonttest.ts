// Testseite: Text in der Webfont neben dem Engine-Ergebnis (Spec M2 §5.5)
import fontUrl from "../dist/Neustift-Regular.woff2";
import { layoutLine } from "./engine";
import { svgString } from "./render";
import { FLAECHE_1902 } from "./style";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const PX = 120 / 1000; // Schriftgrad 120 px bei 1000 Einheiten je Geviert: Engine-SVG im selben Maßstab

function update() {
  const text = $<HTMLInputElement>("text").value;
  $("font").textContent = text;
  $("font").classList.toggle("dlig", $<HTMLInputElement>("dlig").checked);
  const v = layoutLine(text, { style: FLAECHE_1902, interlock: 0.5, targetWidth: null, pins: { letters: {}, joins: {} } }).variants[0];
  $("engine").innerHTML = v ? svgString(v, FLAECHE_1902, { ink: "#1d1a17", paper: null }) : "";
  const svg = $("engine").querySelector("svg");
  if (svg) for (const k of ["width", "height"]) svg.setAttribute(k, String(Number(svg.getAttribute(k)) * PX));
}

const face = new FontFace("Neustift", `url(${fontUrl})`);
document.fonts.add(face);
face.load().then(
  () => ($("status").textContent = ""),
  () => ($("status").textContent = "Webfont nicht geladen – erst „bun run font“ ausführen"),
);
$("text").addEventListener("input", update);
$("dlig").addEventListener("change", update);
update();
