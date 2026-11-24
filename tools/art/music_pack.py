#!/usr/bin/env python3
"""Recorded music: the raw tracks (mp3, as Higgsfield gives them) -> what the game plays (assets/music_<key>.mp4, AAC in an mp4).
   Cuts a finished ending off, fades the two ends so the loop breathes, levels every track to the same loudness.
   music_pack.py <indir> [outdir = /home/claude/strata/assets] [key ...]"""
import sys, subprocess, struct, math, os, glob, re
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else '/home/claude/strata/assets'; only = sys.argv[3:]
for f in sorted(glob.glob(f'{src}/music_*.mp3')):
    key = os.path.basename(f)[6:-4]
    if only and key not in only: continue
    d = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], capture_output=True).stdout
    s = struct.unpack('<%dh' % (len(d) // 2), d); w = 4000  # half-second windows
    e = [math.sqrt(sum(x * x for x in s[i:i + w:5]) / max(1, len(s[i:i + w:5]))) for i in range(0, len(s), w)]; med = sorted(e)[len(e) // 2]; end = len(e)
    while end > 0 and e[end - 1] < 0.3 * med: end -= 1
    L = min(len(s) / 8000, end * 0.5 + 0.4)
    af = f'atrim=duration={L:.2f},afade=t=in:d=0.35,afade=t=out:st={L - 2.2:.2f}:d=2.2,loudnorm=I=-16:TP=-1.5:LRA=11'; dst = f'{out}/music_{key}.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-af', af, '-ar', '44100', '-ac', '2', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', dst], check=True)
    q = [e[int(len(e) * k / 6):int(len(e) * (k + 1) / 6)] for k in range(6)]; shape = ''.join(str(round(9 * (sum(x) / len(x)) / max(e))) for x in q if x)
    print(f'{key}: kept {L:.1f} s of {len(s) / 8000:.1f}, {os.path.getsize(dst) // 1024} KB, loudness by sixths {shape}')
