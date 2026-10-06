// Prüfblatt: alle Glyphen einzeln plus beste Varianten der Testwörter → out/*.svg (+ PNG, falls Inkscape da ist)
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { layoutLine } from "../src/engine";
import { svgString } from "../src/render";
import { FLAECHE_1902 } from "../src/style";

const INKSCAPE = "/Applications/Inkscape.app/Contents/MacOS/inkscape";
const jobs: [string, string, number][] = [
  ["glyphen", "A C D E F G H I K L N O Ä", 0],
  ["die-flaeche", "DIE FLÄCHE", 0.5],
  ["hagen-aad-fock", "HAGEN AAD FOCK", 0.5],
  ["hagen-aad-fock-wild", "HAGEN AAD FOCK", 1],
];
mkdirSync("out", { recursive: true });
for (const [name, text, interlock] of jobs) {
  const { variants, warnings } = layoutLine(text, { style: FLAECHE_1902, interlock, targetWidth: null, pins: { letters: {}, joins: {} } });
  const file = `out/${name}.svg`;
  await Bun.write(file, svgString(variants[0], FLAECHE_1902, { ink: "#1d1a17", paper: "#ece2cf" }));
  const png = `out/${name}.png`;
  rmSync(png, { force: true }); // kein altes Bild darf als neues durchgehen
  if (!existsSync(INKSCAPE)) console.error(`${png}: Inkscape fehlt – nur SVG geschrieben`);
  else {
    const r = Bun.spawnSync([INKSCAPE, file, "-o", png, "-w", "1600"]);
    if (!r.success || !existsSync(png)) console.error(`${png} fehlgeschlagen:`, r.stderr.toString().trim());
  }
  console.log(file, warnings.join(" · "));
}
