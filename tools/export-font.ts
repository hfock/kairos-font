// Font-Daten aus der Engine nach build/ schreiben: kairos.json (Glyphen, Maße, Unterschneidung, Sollwerte) und features.fea
import { mkdirSync } from "node:fs";
import { fontData } from "../src/fontdata";

const t0 = performance.now();
const data = fontData(`0.2 ${new Date().toISOString().slice(0, 16)}`);
mkdirSync("build", { recursive: true });
await Bun.write("build/kairos.json", JSON.stringify(data));
await Bun.write("build/features.fea", data.fea);
console.log(`build/kairos.json: ${data.glyphs.length} Glyphen, ${data.kerning.length} Unterschneidungen, ${Math.round(performance.now() - t0)} ms`);
