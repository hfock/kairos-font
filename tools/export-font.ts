// Font-Daten aus der Engine nach build/ schreiben: kairos.json (Glyphen, Maße, Unterschneidung, Sollwerte) und features.fea
import { mkdirSync } from "node:fs";
import { fontData } from "../src/fontdata";

const t0 = performance.now();
const local = new Date(Date.now() - new Date().getTimezoneOffset() * 60000); // Ortszeit: Font Book zeigt den Stempel als Version
const data = fontData(`0.2 ${local.toISOString().slice(0, 16)}`);
const build = `${import.meta.dir}/../build`; // im Projektordner, wo build_font.py liest – gleich, aus welchem Ordner der Export läuft
mkdirSync(build, { recursive: true });
await Bun.write(`${build}/kairos.json`, JSON.stringify(data));
await Bun.write(`${build}/features.fea`, data.fea);
console.log(`build/kairos.json: ${data.glyphs.length} Glyphen, ${data.kerning.length} Unterschneidungen, ${Math.round(performance.now() - t0)} ms`);
