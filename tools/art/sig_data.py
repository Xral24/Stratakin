#!/usr/bin/env python3
"""Write the fused Kin's signature data into the game from the tables: names and effects into kin.js (FSIG), staging into battle.js (SIGFX).
   sig_data.py [game dir = /home/claude/strata]   Only planets whose table AND sync file exist are written."""
import sys, os, json, re
here = os.path.dirname(os.path.abspath(__file__)); game = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/strata'
fs, fx = [], []
for planet in ('earth', 'moon', 'halo', 'tyrant', 'boss'):  # the tyrants' names live in kin.js SIGS by hand: only their staging is written from here
    t, y = f'{here}/sigs/{planet}.json', f'{here}/sigs/{planet}_sync.json'
    if not (os.path.exists(t) and os.path.exists(y)): continue
    sync = json.load(open(y))
    for r in json.load(open(t)):
        i = r['id']; s = r['solid']
        if i.startswith('f_'): fs.append(f"{i}: [{json.dumps(r['name'])}, '{r['flag']}']")
        fx.append(f"{i}: ['{r['stage']}', {s:g}, {round(s * 0.7, 2):g}, {sync.get(i, 0.3):g}]")
def block(path, tag, body):
    s = open(path).read(); a, b = s.index(f'/*{tag}-START'), s.index(f'/*{tag}-END*/'); head = s[a:s.index('*/', a) + 2]
    open(path, 'w').write(s[:a] + head + '\n' + body + '\n  ' + s[b:])
def wrap(items, n=4): return ',\n    '.join(', '.join(items[k:k + n]) for k in range(0, len(items), n))
block(f'{game}/js/kin.js', 'FSIG', '  const FSIG = {\n    ' + wrap(fs) + ' };')
block(f'{game}/js/battle.js', 'FSIGFX', '  Object.assign(SIGFX, {\n    ' + wrap(fx) + ' });')
print(len(fs), 'fused signatures written')
