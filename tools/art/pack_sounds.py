#!/usr/bin/env python3
"""Pack the recorded sounds into one file the game fetches: art/sounds/*.mp3 -> src/assets/sounds.json ({name: base64 mp3}).

usage: pack_sounds.py [out.json]

The artifact host takes no .mp3 assets, and one small file is one fetch for every sound. UI.sample(name) decodes an entry the first time it is asked for.
"""
import base64, glob, json, os, sys
root = os.path.join(os.path.dirname(__file__), '..', '..')
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'src', 'assets', 'sounds.json')
d = {os.path.splitext(os.path.basename(f))[0]: base64.b64encode(open(f, 'rb').read()).decode() for f in sorted(glob.glob(os.path.join(root, 'art', 'sounds', '*.mp3')))}
json.dump(d, open(out, 'w'), separators=(',', ':'))
print(out, len(d), 'sounds', os.path.getsize(out), 'bytes:', ', '.join(d))
