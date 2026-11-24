#!/usr/bin/env python3
"""Fused Kin signature attacks: the table (tools/art/sigs/<planet>.txt) -> generation requests, eight to a file, and a manifest.
   sig_requests.py earth
   Each row makes three jobs: picture a (the thing itself), picture b (where it lands), and one sound. The request files are fetched by the
   Higgsfield sandbox straight from this repository, so the prompts are written once."""
import sys, json, os
planet = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__)); base = {'earth': 1000, 'moon': 2000, 'halo': 3000, 'tyrant': 4000}[planet]
LOOP = {'fly', 'pair', 'volley', 'fall', 'pool'}
HEAD = 'Game VFX sprite animation, %s, on a pure black background. Hand-painted stylised cartoon look. '
TAIL = ' No text, no character, no creature, no ground, nothing else.'
rows = []
for line in open(f'{here}/sigs/{planet}.txt'):
    if not (line.startswith('f_') or line.startswith('x_')): continue
    p = [x.strip() for x in line.rstrip('\n').split(' | ')]; assert len(p) == 8, line
    rows.append(dict(id=p[0], name=p[1], flag=p[2], stage=p[3], solid=float(p[4]), a=p[5], b=p[6], snd=p[7]))
img, snd, man = [], [], {}
for n, r in enumerate(rows):
    loop = r['stage'] in LOOP; ia, ib, isnd = base + n * 3, base + n * 3 + 1, base + n * 3 + 2
    if loop: pa = HEAD % 'seamless loop' + r['a'] + ' Centred.' + TAIL
    elif r['stage'] == 'close': pa = HEAD % 'plays once' + r['a'] + ' The last frame shows it fully closed, bright, in the centre.' + TAIL
    else: pa = HEAD % 'plays once' + r['a'] + ' Then it fades away, and the last frame is almost empty black.' + TAIL
    pb = HEAD % 'plays once' + r['b'] + ', starting from a small bright point in the centre, then fading, and the last frame is almost empty black. Centred.' + TAIL
    img.append({'index': ia, 'params': {'model': 'gpt_image_2_6', 'output_format': 'gif', 'frame_count': 12 if loop else 16, 'frame_duration_ms': 60 if loop else 50, 'aspect_ratio': '1:1', 'prompt': pa}})
    img.append({'index': ib, 'params': {'model': 'gpt_image_2_6', 'output_format': 'gif', 'frame_count': 16, 'frame_duration_ms': 50, 'aspect_ratio': '1:1', 'prompt': pb}})
    snd.append({'index': isnd, 'params': {'model': 'mirelo_text_to_audio', 'duration': 2, 'prompt': 'Game sound effect: ' + r['snd'] + ', no music, no voice'}})
    man[ia] = f"sig_{r['id']}_a.gif"; man[ib] = f"sig_{r['id']}_b.gif"; man[isnd] = f"raw_{r['id']}.mp3"
os.makedirs(f'{here}/sigs/req', exist_ok=True)
def chunks(L, kind):
    for k in range(0, len(L), 8):
        json.dump({'requests': L[k:k + 8]}, open(f'{here}/sigs/req/{planet}_{kind}_{k // 8:02d}.json', 'w'))
    return (len(L) + 7) // 8
ni, ns = chunks(img, 'img'), chunks(snd, 'snd')
json.dump(man, open(f'{here}/sigs/req/{planet}_manifest.json', 'w'), indent=0)
json.dump(rows, open(f'{here}/sigs/{planet}.json', 'w'), indent=1)
print(planet, len(rows), 'rows;', ni, 'picture batches,', ns, 'sound batches')
