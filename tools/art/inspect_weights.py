#!/usr/bin/env python3
"""Which joint moves each part of a rigged GLB: front and side views coloured by each vertex's strongest joint, with a 0.1 grid.
usage: inspect_weights.py model.glb out.jpg   (the grid is in the mesh's own coordinates, the ones rigid_prop.py takes)"""
import sys, math, numpy as np
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from inspect_rig import Rig
from inspect_glb import render
from PIL import Image, ImageDraw
rig = Rig(sys.argv[1]); out = sys.argv[2]
names = [rig.nodes[j]['name'] for j in rig.joints]
dom = rig.JN[np.arange(len(rig.P)), np.argmax(rig.WT, axis=1)]
rng = np.random.default_rng(3); pal = (rng.random((len(names), 3)) * 200 + 40).astype(np.uint8)
# fake texture: one pixel per joint, UV pointing at it
tex = Image.fromarray(pal.reshape(1, -1, 3)); UV = np.c_[(dom + 0.5) / len(names), np.full(len(dom), 0.5)]
P = rig.P; lo, hi = P.min(0), P.max(0); span = max(hi - lo)
cells = []
for vn, yaw in (('front', 0.0), ('side', math.pi / 2)):
    c, s = math.cos(yaw), math.sin(yaw); R = np.array([[c, 0, -s], [0, 1, 0], [s, 0, c]]); Q = P @ R.T
    cells.append(render(P, UV, rig.F, tex, (vn, yaw), 600, (Q.min(0), Q.max(0), span)))
img = Image.new('RGB', (1400, 600), 'white'); img.paste(cells[0], (0, 0)); img.paste(cells[1], (600, 0))
d = ImageDraw.Draw(img)
used = sorted(set(dom.tolist()))
for i, j in enumerate(used):
    d.rectangle((1210, 10 + i * 22, 1230, 28 + i * 22), fill=tuple(int(x) for x in pal[j])); d.text((1236, 12 + i * 22), names[j], fill=(0, 0, 0))
# grid lines every 0.1 in x on the front view
sc = 600 * 0.9 / span
for xv in np.arange(-0.5, 0.51, 0.1):
    X = (xv - (lo[0] + hi[0]) / 2) * sc + 300; d.line((X, 0, X, 600), fill=(255, 0, 0) if abs(xv) < 1e-6 else (200, 200, 255)); d.text((X + 2, 2), '%.1f' % xv, fill=(0, 0, 255))
for yv in np.arange(0, 2.01, 0.2):
    Y = 300 - (yv - (lo[1] + hi[1]) / 2) * sc; d.line((0, Y, 600, Y), fill=(200, 200, 255)); d.text((2, Y - 12), '%.1f' % yv, fill=(0, 0, 255))
img.save(out, quality=88)
