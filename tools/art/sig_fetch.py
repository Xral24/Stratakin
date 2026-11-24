#!/usr/bin/env python3
"""Fetch finished signature jobs by index. stdin lines: '<index> <HHMMSS> <job id>'.  sig_fetch.py earth 20261124 [outdir]"""
import sys, json, os, subprocess
planet, day = sys.argv[1], sys.argv[2]; out = sys.argv[3] if len(sys.argv) > 3 else f'/home/claude/scratch/dl/fsig/{planet}'
here = os.path.dirname(os.path.abspath(__file__)); man = json.load(open(f'{here}/sigs/req/{planet}_manifest.json')); os.makedirs(out, exist_ok=True)
U = 'https://d8j0ntlcm91z4.cloudfront.net/user_3MStP8inDTZqzXdo8y7jmI6IYMU/hf_'
ok = 0
for line in sys.stdin:
    p = line.split()
    if len(p) != 3: continue
    name = man[p[0]]; ext = name.rsplit('.', 1)[1]; dst = f'{out}/{name}'
    subprocess.run(['curl', '-sf', '-o', dst, f'{U}{day}_{p[1]}_{p[2]}.{ext}'])
    if os.path.exists(dst) and os.path.getsize(dst) > 2000: ok += 1
    else: print('FAILED', line.strip())
print(ok, 'fetched;', len([f for f in os.listdir(out)]), 'files in', out)
