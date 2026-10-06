import { expect, test } from "bun:test";
import { layoutLine } from "../src/engine";
import { svgString } from "../src/render";
import { FLAECHE_1902 as S } from "../src/style";

const v = layoutLine("DIE FLÄCHE", { style: S, interlock: 0.5, targetWidth: null, pins: { letters: {}, joins: {} } }).variants[0];

test("SVG: ein Gruppe je Buchstabe, ein Pfad je Strich, keine NaN", () => {
  const svg = svgString(v, S, { ink: "#000", paper: "#fff" });
  expect(svg.startsWith("<svg")).toBe(true);
  expect(svg.match(/data-i=/g)!.length).toBe(9);
  const strokes = v.glyphs.reduce((n, g) => n + g.inst.strokes.length, 0) + v.extras.length;
  expect(svg.match(/<path /g)!.length).toBe(strokes);
  expect(svg).not.toContain("NaN");
  expect(svg).toContain(`viewBox="${Math.round((v.minX - 60) * 10) / 10} -60 `);
  expect(svg).toContain('<g id="ink" transform="matrix(1 0 0 -1 0 700)"'); // y-Achse gespiegelt
  expect(svg).toMatch(/<clipPath id="kairos-zeile"><rect x="[^"]+" y="0" width="[^"]+" height="700"\/><\/clipPath><g clip-path="url\(#kairos-zeile\)">/);
});

test("Export ohne Bedienelemente; transparent ohne Papier", () => {
  const svg = svgString(v, S, { ink: "#000", paper: null });
  expect(svg).not.toMatch(/<rect [^>]*fill=/); // kein Papier, keine Klickflächen (das Zeilenband hat keine Füllung)
  expect(svg).not.toContain('class="hit"');
});

test("Vorschau: Klickflächen, Auswahl, Pin-Marke, Overlay", () => {
  const svg = svgString(v, S, {
    ink: "#000", paper: "#fff", interactive: true, selected: 4, pinned: [5],
    overlay: { href: "x.jpg", x: -73, y: -66, w: 2400, h: 830, opacity: 0.5 },
  });
  expect(svg).toContain('class="sel"');
  expect(svg.match(/class="hit"/g)!.length).toBe(8);
  expect(svg).toContain('class="pin"');
  expect(svg).toContain('<image href="x.jpg"');
  expect(svg).not.toContain("NaN");
  expect(svg).toMatch(/<g data-i="4"[^>]*><rect class="sel"/); // Auswahl sitzt beim richtigen Buchstaben
  expect(svg).toMatch(/<g data-i="5"[^>]*><rect class="hit"[^>]*\/><circle class="pin"/);
  expect(svg).toMatch(/class="hits"[\s\S]*id="ink"/); // Klickflächen liegen unter der Tinte
});
