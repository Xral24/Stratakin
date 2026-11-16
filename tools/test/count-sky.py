# counts pixels of the flat sky colour showing through the ground (the colour is passed in, or found as the colour of the top-left pixel of shot 0 when SKY=auto)
import sys
from PIL import Image
pre, n = sys.argv[1], int(sys.argv[2]); ref = tuple(int(v) for v in sys.argv[3].split(',')) if len(sys.argv) > 3 else (140, 177, 214)
tot = 0
for i in range(n):
    try: im = Image.open(f'{pre}{i}.png').convert('RGB')
    except Exception: continue
    w, h = im.size; px = im.load(); c = 0; sx = sy = 0
    for y in range(0, h):
        for x in range(0, w):
            r, g, b = px[x, y]
            if abs(r - ref[0]) <= 3 and abs(g - ref[1]) <= 3 and abs(b - ref[2]) <= 3: c += 1; sx += x; sy += y
    tot += c
    print(i, c, (sx // c, sy // c) if c else '')
print('total', tot)
