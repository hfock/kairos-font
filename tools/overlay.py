# /// script
# dependencies = ["pillow", "numpy"]
# ///
"""Referenz-Overlay: Schriftzug-Ausschnitt geraderichten und auf Schrifteinheiten ausrichten.

Schreibt reference/die-flaeche-overlay.jpg und gibt die Overlay-Werte für presets/die-flaeche.json aus.
Aufruf (im Projektordner): uv run tools/overlay.py
"""
import json

import numpy as np
from PIL import Image

SRC, DST = "reference/die-flaeche-schriftzug.jpg", "reference/die-flaeche-overlay.jpg"
CAP = 700  # Versalhöhe in Schrifteinheiten


def stems(img):
    """Senkrechte Striche: (Mitte x, Tinte oben y, Tinte unten y, Breite px), von links nach rechts."""
    dark = np.asarray(img.convert("L")) < 110
    h, w = dark.shape
    runs = np.zeros(w, dtype=int)
    for x in range(w):
        best = cur = 0
        for v in dark[:, x]:
            cur = cur + 1 if v else 0
            best = max(best, cur)
        runs[x] = best
    groups = []
    for x in np.where(runs > 0.5 * h)[0]:
        if groups and x - groups[-1][-1] <= 2:
            groups[-1].append(x)
        else:
            groups.append([x])
    out = []
    for g in groups:
        c = (g[0] + g[-1]) / 2
        ys = np.where(dark[:, int(c)])[0]
        out.append((c, ys.min(), ys.max(), len(g)))
    return [s for s in out if s[3] >= 15]  # schmale Treffer (Bogenteile) verwerfen


im = Image.open(SRC).convert("RGB")
s = stems(im)
(x0, _, b0, _), (x1, _, b1, _) = s[0], s[-1]  # D-Stamm und letzter E-Stamm
angle = float(np.degrees(np.arctan2(b1 - b0, x1 - x0)))  # Grundlinie fällt nach rechts → gegen den Uhrzeiger drehen
im = im.rotate(angle, resample=Image.BICUBIC, fillcolor=(222, 205, 175))
im.save(DST, quality=90)

d_x, top, bottom, _ = stems(im)[0]  # D-Stamm nach dem Drehen
k = CAP / (bottom - top + 1)  # Einheiten pro Pixel
print(json.dumps({
    "angle": round(angle, 3),
    "overlay": {"src": "die-flaeche", "x": round(-d_x * k, 1), "y": round(-top * k, 1),
                "w": round(im.width * k, 1), "h": round(im.height * k, 1)},
}, indent=2))
