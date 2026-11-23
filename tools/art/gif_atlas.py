#!/usr/bin/env python3
"""An effect GIF (painted on black) -> a flipbook atlas the game's sprite pass reads.
   gif_atlas.py in.gif out.jpg [cols=4] [cell=256]   prints: cols rows frames
   Black is 'nothing' in the game (the sprites are ADDED to the scene), so near-black is crushed to true black to keep the square from showing."""
import sys, math
from PIL import Image
src, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4; cell = int(sys.argv[4]) if len(sys.argv) > 4 else 256
im = Image.open(src); n = im.n_frames; rows = math.ceil(n / cols)
sheet = Image.new('RGB', (cols * cell, rows * cell), (0, 0, 0))
for i in range(n):
    im.seek(i); a = im.convert('RGBA'); f = Image.new('RGB', a.size, (0, 0, 0)); f.paste(a, (0, 0), a); f = f.resize((cell, cell), Image.LANCZOS)  # these GIFs have a see-through background: lay each frame on black
    f = f.point(lambda v: 0 if v < 14 else min(255, int((v - 14) * 255 / 241)))
    # fade the rim so nothing is cut off square at the edge of the cell
    px = f.load(); m = cell * 0.5
    for y in range(cell):
        for x in range(cell):
            d = math.hypot(x - m + 0.5, y - m + 0.5) / m
            if d > 0.86:
                k = max(0.0, 1 - (d - 0.86) / 0.14); r, g, b = px[x, y]; px[x, y] = (int(r * k), int(g * k), int(b * k))
    sheet.paste(f, ((i % cols) * cell, (i // cols) * cell))
sheet.save(out, quality=88); print(cols, rows, n)
