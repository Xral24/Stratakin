# One-file build for the claude.ai artifact ("Stratakin v2.5", slug 95c42275-5e63-4850-a378-dd4d1b3950d6).
# Inlines style.css and every js/*.js from src/ into dist-single/index.html, with the manifest as a data URL.
# Publish dist-single/index.html to the artifact with publish_files (only index.html changes; the artifact keeps its other files).
import re, json, os, shutil, urllib.parse
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(root, 'src'); out = os.path.join(root, 'dist-single'); os.makedirs(out, exist_ok=True)
html = open(f'{src}/index.html').read()
css = open(f'{src}/style.css').read()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')
def inline(m):
    p = m.group(1); js = open(f'{src}/{p}').read().replace('</script>', '<\\/script>')
    return '<script>\n' + js + '\n</script>'
html = re.sub(r'<script src="(js/[^"]+)"></script>', inline, html)
man = json.load(open(f'{src}/manifest.json'))
man['start_url'] = './index.html'; man['icons'] = [{'src': 'icon-180.png', 'sizes': '180x180', 'type': 'image/png'}]
html = html.replace('<link rel="manifest" href="manifest.json">', '<link rel="manifest" href="data:application/manifest+json,' + urllib.parse.quote(json.dumps(man)) + '">')
open(f'{out}/index.html', 'w').write(html)
shutil.copy(os.path.join(root, 'tools', 'single', 'sw.js'), f'{out}/sw.js')
shutil.copy(f'{src}/icon-180.png', f'{out}/icon-180.png')
print('dist-single/index.html bytes', os.path.getsize(f'{out}/index.html'))
