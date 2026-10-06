import { pathData } from "./geom";
import type { Layout } from "./engine";
import type { Style } from "./style";

export type Overlay = { href: string; x: number; y: number; w: number; h: number; opacity: number };
export type RenderOpts = {
  ink: string;
  paper: string | null; // null = transparent
  margin?: number;
  interactive?: boolean; // Klickflächen + Auswahl (nur Vorschau, nie Export)
  selected?: number | null;
  pinned?: number[];
  overlay?: Overlay | null;
};

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Layout → SVG-Text. Schriftkoordinaten (y nach oben) liegen gespiegelt in Gruppen; die Tinte in #ink. */
export function svgString(l: Layout, s: Style, o: RenderOpts): string {
  const m = o.margin ?? 60, H = s.capHeight;
  const [x, y, w, h] = [l.minX - m, -m, l.width + 2 * m, H + 2 * m].map(r1);
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">`];
  if (o.paper) out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${o.paper}"/>`);
  const ov = o.overlay;
  if (ov) out.push(`<image href="${ov.href}" x="${ov.x}" y="${ov.y}" width="${ov.w}" height="${ov.h}" opacity="${ov.opacity}" preserveAspectRatio="none"/>`);
  const flip = `transform="matrix(1 0 0 -1 0 ${H})"`;
  if (o.interactive) {
    // Klickflächen liegen unter aller Tinte: ein Klick auf einen Strich trifft immer dessen eigenen Buchstaben
    out.push(`<g class="hits" ${flip}>`);
    for (const g of l.glyphs) {
      const { minX, maxX } = g.inst.prof, top = r1(H * g.inst.p.h), sel = g.index === o.selected;
      out.push(`<g data-i="${g.index}" transform="translate(${r1(g.x)} 0)">`);
      out.push(`<rect class="${sel ? "sel" : "hit"}" x="${r1(minX)}" y="0" width="${r1(maxX - minX)}" height="${top}" fill="${sel ? "#c9a227" : "transparent"}" fill-opacity="${sel ? 0.18 : 0}" stroke="none" pointer-events="all"/>`);
      if (o.pinned?.includes(g.index)) out.push(`<circle class="pin" cx="${r1((minX + maxX) / 2)}" cy="${-m / 2}" r="8" fill="#b03a2e" stroke="none"/>`);
      out.push(`</g>`);
    }
    out.push(`</g>`);
  }
  out.push(`<g id="ink" ${flip} fill="none" stroke="${o.ink}" stroke-width="${s.stroke}" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4">`);
  for (const g of l.glyphs) {
    out.push(`<g data-i="${g.index}" transform="translate(${r1(g.x)} 0)">`);
    for (const st of g.inst.strokes) out.push(`<path d="${pathData(st)}"/>`);
    out.push(`</g>`);
  }
  for (const e of l.extras) out.push(`<path d="${pathData(e)}"/>`);
  out.push(`</g></svg>`);
  return out.join("");
}
