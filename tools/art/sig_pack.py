#!/usr/bin/env python3
"""A planet's fused-Kin signatures: the fetched GIFs and raw sounds -> one small bundle per Kin (assets/sig_<id>.json: { a, b: JPEG atlases as
   data URLs, s: the sound, base64 mp3 }) and the moment in each sound that belongs on the hit (tools/art/sigs/<planet>_sync.json).
   sig_pack.py earth [indir] [outdir]"""
import sys, os, json, math, base64, io, subprocess, struct, re
from PIL import Image
planet = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__))
src = sys.argv[2] if len(sys.argv) > 2 else f'/home/claude/scratch/dl/fsig/{planet}'; out = sys.argv[3] if len(sys.argv) > 3 else '/home/claude/strata/assets'
rows = json.load(open(f'{here}/sigs/{planet}.json')); CELL = 256
def atlas(gif):
    im = Image.open(gif); n = im.n_frames; cols = 4; rws = math.ceil(n / cols); sheet = Image.new('RGB', (cols * CELL, rws * CELL), (0, 0, 0)); m = CELL * 0.5
    mask = Image.new('L', (CELL, CELL)); mp = mask.load()
    for y in range(CELL):
        for x in range(CELL):
            d = math.hypot(x - m + 0.5, y - m + 0.5) / m; mp[x, y] = 255 if d <= 0.86 else int(255 * max(0.0, 1 - (d - 0.86) / 0.14))
    black = Image.new('RGB', (CELL, CELL), (0, 0, 0))
    for i in range(n):
        im.seek(i); a = im.convert('RGBA'); f = Image.new('RGB', a.size, (0, 0, 0)); f.paste(a, (0, 0), a); f = f.resize((CELL, CELL), Image.LANCZOS)
        f = f.point(lambda v: 0 if v < 14 else min(255, int((v - 14) * 255 / 241))); f = Image.composite(f, black, mask); sheet.paste(f, ((i % cols) * CELL, (i // cols) * CELL))
    buf = io.BytesIO(); sheet.save(buf, 'JPEG', quality=80); return n, buf.getvalue()
def sound(raw, dst):
    d = subprocess.run(['ffmpeg', '-v', 'error', '-i', raw, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], capture_output=True).stdout
    s = struct.unpack('<%dh' % (len(d) // 2), d); w = 800; e = [math.sqrt(sum(x * x for x in s[i:i + w]) / max(1, len(s[i:i + w]))) for i in range(0, len(s), w)]; m = max(e) or 1
    on = next(i for i, x in enumerate(e) if x > 0.12 * m) * 0.1; st = max(0, on - 0.03); L = min(1.9, len(e) * 0.1 - st); pk = max(0.0, e.index(max(e)) * 0.1 - st)
    af = f'atrim=start={st:.3f}:duration={L:.2f},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st={max(0, L - 0.45):.2f}:d=0.45'; tmp = '/tmp/_sig.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-ac', '1', '-ar', '32000', '-af', af, tmp], check=True)
    r = subprocess.run(['ffmpeg', '-i', tmp, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    gain = min(30, -1.5 - float(re.search(r'max_volume: ([-\d.]+)', r).group(1)))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', f'volume={gain:.1f}dB', '-c:a', 'libmp3lame', '-b:a', '48k', dst], check=True)
    return round(pk, 2), round(gain, 1)
sync = {}; total = 0; bad = []
for r in rows:
    i = r['id']; ga, gb, rs = f'{src}/sig_{i}_a.gif', f'{src}/sig_{i}_b.gif', f'{src}/raw_{i}.mp3'
    if not (os.path.exists(ga) and os.path.exists(gb)): bad.append(i + ' (pictures)'); continue
    na, ja = atlas(ga); nb, jb = atlas(gb); want = 12 if r['stage'] in ('fly', 'pair', 'volley', 'fall', 'pool') else 16
    if na != want or nb != 16: bad.append(f'{i} (frames {na},{nb})')
    b = {'a': 'data:image/jpeg;base64,' + base64.b64encode(ja).decode(), 'b': 'data:image/jpeg;base64,' + base64.b64encode(jb).decode()}
    if os.path.exists(rs):
        os.makedirs(f'{here}/../../art/sounds/sig', exist_ok=True); dst = f'{here}/../../art/sounds/sig/sig_{i}.mp3'; pk, gain = sound(rs, dst); sync[i] = pk; b['s'] = base64.b64encode(open(dst, 'rb').read()).decode()
        if gain > 18: bad.append(f'{i} (sound very quiet at source, +{gain} dB)')
    else: bad.append(i + ' (no sound)')
    t = json.dumps(b, separators=(',', ':')); open(f'{out}/sig_{i}.json', 'w').write(t); total += len(t)
json.dump(sync, open(f'{here}/sigs/{planet}_sync.json', 'w'), indent=0)
print(planet, len(rows), 'bundles,', total // 1024, 'KB in all,', total // 1024 // max(1, len(rows)), 'KB each'); print('to look at:', '; '.join(bad) if bad else 'nothing')
