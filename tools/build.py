# Builds the single-file game (./index.html at the repo root, served by GitHub Pages) from the sources in ./src
# Usage: python3 tools/build.py
import re, json, os, urllib.parse
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); src = os.path.join(root, 'src')
html = open(f'{src}/index.html').read(); css = open(f'{src}/style.css').read()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')
def inline(m):
    js = open(f'{src}/{m.group(1)}').read().replace('</script>', '<\\/script>')
    return '<script>\n' + js + '\n</script>'
html = re.sub(r'<script src="(js/[^"]+)"></script>', inline, html)
man = json.load(open(f'{src}/manifest.json')); man['start_url'] = './index.html'; man['icons'] = [{'src': 'icon-180.png', 'sizes': '180x180', 'type': 'image/png'}]
html = html.replace('<link rel="manifest" href="manifest.json">', '<link rel="manifest" href="data:application/manifest+json,' + urllib.parse.quote(json.dumps(man)) + '">')
open(os.path.join(root, 'index.html'), 'w').write(html)
print('index.html', os.path.getsize(os.path.join(root, 'index.html')), 'bytes')

# model files (Higgsfield GLBs, slimmed) travel with the page: src/assets -> assets/ beside index.html
import shutil as _sh
_a = os.path.join(src, 'assets')
if os.path.isdir(_a):
    _d = os.path.join(root, 'assets'); os.makedirs(_d, exist_ok=True)
    for _f in os.listdir(_a): _sh.copy(os.path.join(_a, _f), os.path.join(_d, _f))
    print('assets', sorted(os.listdir(_d)))
