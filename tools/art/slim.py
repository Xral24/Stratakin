# Slim a GLB for the phone: cut it to a triangle budget and limit its texture, keeping plain glTF that js/glb.js reads
# (no quantization, no meshopt compression). gltfpack cuts the mesh; the textures are then shrunk here with PIL (JPEG, or PNG where there is transparency).
# usage: python3 tools/art/slim.py in.glb out.glb [triangles=40000] [texture=2048]
# Defaults are the most a phone can show (see ART-PLAN.md, Quality first): 2048 textures, about 40k triangles for a character.
# Only the base colour picture is kept: the game draws no normal or roughness maps yet, so those would be download for nothing.
# needs gltfpack: npm i gltfpack in tools/art (or anywhere on NODE_PATH); falls back to npx.
import sys, os, struct, json, subprocess, shutil
src, dst = sys.argv[1], sys.argv[2]; budget = int(sys.argv[3]) if len(sys.argv) > 3 else 40000; tex = int(sys.argv[4]) if len(sys.argv) > 4 else 2048
def tris(path):
    b = open(path, 'rb').read(); n = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + n]); t = 0
    for m in j.get('meshes', []):
        for p in m['primitives']:
            if p.get('mode', 4) != 4: continue
            t += (j['accessors'][p['indices']]['count'] if 'indices' in p else j['accessors'][p['attributes']['POSITION']]['count']) // 3
    return t
before = tris(src); ratio = min(1.0, budget / max(1, before))
here = os.path.dirname(os.path.abspath(__file__)); local = os.path.join(here, 'node_modules', 'gltfpack', 'cli.js')
cmd = (['node', local] if os.path.exists(local) else ['npx', '-y', 'gltfpack']) + ['-i', src, '-o', dst, '-noq', '-kn']
if ratio < 1: cmd += ['-si', f'{ratio:.4f}', '-sp']
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode != 0: print(r.stdout, r.stderr); sys.exit(1)
# shrink the embedded images and rebuild the binary chunk around them
import io
from PIL import Image
b = open(dst, 'rb').read(); n = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + n]); o = 20 + n; bn = struct.unpack('<I', b[o:o + 4])[0]; binb = b[o + 8:o + 8 + bn]
views = j['bufferViews']; data = [binb[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']] for v in views]
# drop every texture but the base colour: unused maps go from the materials, then any image no texture points at is emptied
for m in j.get('materials', []):
    for k in ('normalTexture', 'occlusionTexture', 'emissiveTexture'):
        m.pop(k, None)
    m.get('pbrMetallicRoughness', {}).pop('metallicRoughnessTexture', None)
used_tex = set()
for m in j.get('materials', []):
    t = m.get('pbrMetallicRoughness', {}).get('baseColorTexture')
    if t is not None: used_tex.add(t['index'])
used_img = {j['textures'][t]['source'] for t in used_tex} if 'textures' in j else set()
import io as _io
from PIL import Image as _Image
_b = _io.BytesIO(); _Image.new('RGB', (1, 1), (128, 128, 255)).save(_b, 'PNG'); TINY = _b.getvalue()
for i, im in enumerate(j.get('images', [])):
    if i not in used_img and 'bufferView' in im: data[im['bufferView']] = TINY; im['mimeType'] = 'image/png'; im['_unused'] = True
for im in j.get('images', []):
    if 'bufferView' not in im or im.pop('_unused', False): continue
    k = im['bufferView']; img = Image.open(io.BytesIO(data[k])); big = max(img.size)
    alpha = img.mode in ('RGBA', 'LA') and img.getextrema()[-1][0] < 255
    if big > tex: img = img.resize((max(1, round(img.size[0] * tex / big)), max(1, round(img.size[1] * tex / big))), Image.LANCZOS)
    buf = io.BytesIO()
    if alpha: img.save(buf, 'PNG', optimize=True); im['mimeType'] = 'image/png'
    else: img.convert('RGB').save(buf, 'JPEG', quality=88, optimize=True); im['mimeType'] = 'image/jpeg'
    data[k] = buf.getvalue()
out = bytearray()
for k, v in enumerate(views):
    while len(out) % 4: out.append(0)
    v['byteOffset'] = len(out); v['byteLength'] = len(data[k]); out.extend(data[k])
while len(out) % 4: out.append(0)
j['buffers'] = [{'byteLength': len(out)}]
js = json.dumps(j, separators=(',', ':')).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
open(dst, 'wb').write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(out)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + bytes(out))
print(f'{os.path.basename(src)}: {before} -> {tris(dst)} triangles, {os.path.getsize(src)//1024} KB -> {os.path.getsize(dst)//1024} KB, textures <= {tex}px')
