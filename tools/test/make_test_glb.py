# Builds a small skinned, textured, animated GLB to test js/glb.js without a real Higgsfield file.
# A blocky figure: legs, body, head, two arms; five joints (hips > spine > head, armL, armR) with blended weights;
# a 256x256 painted texture with a face; clips 'wave' (right arm and head) and 'idle' (spine sway).
import json, struct, math, io, sys
from PIL import Image, ImageDraw
out = sys.argv[1] if len(sys.argv) > 1 else 'test-man.glb'
P, N, UV, J, W, IX = [], [], [], [], [], []
def box(x0, y0, z0, x1, y1, z1, uvr, weight_fn, segs=6, axis=1):
    # a box split into slices along one axis so blended weights show; uv region uvr = (u0, v0, u1, v1)
    lo = [x0, y0, z0]; hi = [x1, y1, z1]
    for s in range(segs):
        a = lo[axis] + (hi[axis] - lo[axis]) * s / segs; b = lo[axis] + (hi[axis] - lo[axis]) * (s + 1) / segs
        L = lo[:]; H = hi[:]; L[axis] = a; H[axis] = b
        faces = [((1,0,0),[(H[0],L[1],L[2]),(H[0],H[1],L[2]),(H[0],H[1],H[2]),(H[0],L[1],H[2])]), ((-1,0,0),[(L[0],L[1],H[2]),(L[0],H[1],H[2]),(L[0],H[1],L[2]),(L[0],L[1],L[2])]),
                 ((0,1,0),[(L[0],H[1],L[2]),(L[0],H[1],H[2]),(H[0],H[1],H[2]),(H[0],H[1],L[2])]), ((0,-1,0),[(L[0],L[1],H[2]),(L[0],L[1],L[2]),(H[0],L[1],L[2]),(H[0],L[1],H[2])]),
                 ((0,0,1),[(L[0],L[1],H[2]),(H[0],L[1],H[2]),(H[0],H[1],H[2]),(L[0],H[1],H[2])]), ((0,0,-1),[(H[0],L[1],L[2]),(L[0],L[1],L[2]),(L[0],H[1],L[2]),(H[0],H[1],L[2])])]
        for n, q in faces:
            b0 = len(P) // 3
            for k, v in enumerate(q):
                P.extend(v); N.extend(n)
                u = uvr[0] + (uvr[2] - uvr[0]) * (1 if k in (1, 2) else 0); vv = uvr[1] + (uvr[3] - uvr[1]) * (0 if k in (2, 3) else 1)
                if n == (0, 0, 1) and uvr[4] if len(uvr) > 4 else False: pass
                UV.extend([u, vv]); j, w = weight_fn(v); J.extend(j); W.extend(w)
            IX.extend([b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3])
def blend(y, ya, yb, ja, jb):
    t = min(1, max(0, (y - ya) / (yb - ya))); return [ja, jb, 0, 0], [1 - t, t, 0, 0]
# joints: 0 hips, 1 spine, 2 head, 3 armL, 4 armR
box(-0.2, 0.0, -0.12, 0.2, 0.55, 0.12, (0.0, 0.5, 0.5, 1.0), lambda v: ([0, 0, 0, 0], [1, 0, 0, 0]), segs=2)                          # legs (trousers)
box(-0.22, 0.55, -0.14, 0.22, 1.45, 0.14, (0.5, 0.5, 1.0, 1.0), lambda v: blend(v[1], 0.75, 1.15, 0, 1), segs=8)                       # body (shirt)
box(-0.17, 1.48, -0.17, 0.17, 1.84, 0.17, (0.0, 0.0, 0.5, 0.5), lambda v: blend(v[1], 1.45, 1.55, 1, 2), segs=4)                       # head (face)
box(0.22, 1.33, -0.07, 0.75, 1.45, 0.07, (0.5, 0.0, 1.0, 0.5), lambda v: blend(v[0], 0.22, 0.34, 1, 3), segs=8, axis=0)              # left arm
box(-0.75, 1.33, -0.07, -0.22, 1.45, 0.07, (0.5, 0.0, 1.0, 0.5), lambda v: blend(-v[0], 0.22, 0.34, 1, 4), segs=8, axis=0)           # right arm
# texture: face top-left, sleeves top-right, trousers bottom-left, shirt bottom-right, a checker so mapping errors show
img = Image.new('RGB', (256, 256)); d = ImageDraw.Draw(img)
d.rectangle([0, 0, 127, 127], fill=(236, 196, 160)); d.ellipse([34, 44, 54, 64], fill=(30, 30, 40)); d.ellipse([74, 44, 94, 64], fill=(30, 30, 40)); d.arc([44, 70, 84, 100], 20, 160, fill=(150, 40, 40), width=5)
d.rectangle([128, 0, 255, 127], fill=(200, 80, 60)); d.rectangle([0, 128, 127, 255], fill=(60, 70, 140)); d.rectangle([128, 128, 255, 255], fill=(90, 160, 90))
for i in range(8):
    for k in range(8):
        if (i + k) % 2: d.rectangle([128 + i * 16, 128 + k * 16, 128 + i * 16 + 7, 128 + k * 16 + 7], fill=(70, 130, 70))
png = io.BytesIO(); img.save(png, 'PNG'); png = png.getvalue()
# nodes: world positions of the joints at rest
jw = [(0, 0.9, 0), (0, 1.2, 0), (0, 1.6, 0), (0.25, 1.45, 0), (-0.25, 1.45, 0)]; parent = [-1, 0, 1, 1, 1]
local = [tuple(jw[i][k] - (jw[parent[i]][k] if parent[i] >= 0 else 0) for k in range(3)) for i in range(5)]
def ibm(p): return [1,0,0,0, 0,1,0,0, 0,0,1,0, -p[0],-p[1],-p[2],1]
def quat(ax, ang): s = math.sin(ang / 2); return [ax[0] * s, ax[1] * s, ax[2] * s, math.cos(ang / 2)]
times = [0.0, 0.25, 0.5, 0.75, 1.0]
wave_arm = sum([quat((0, 0, 1), a) for a in [0, -1.1, -1.4, -1.1, 0]], []); wave_head = sum([quat((0, 1, 0), a) for a in [0, 0.35, 0, -0.35, 0]], [])
idle_spine = sum([quat((0, 0, 1), a) for a in [0, 0.06, 0, -0.06, 0]], [])
blob = bytearray(); views = []; accs = []
def add(data, fmt, count, comp, typ, target=None, mn=None, mx=None):
    while len(blob) % 4: blob.append(0)
    off = len(blob); blob.extend(struct.pack('<' + fmt * (len(data)), *data)); v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(blob) - off}
    if target: v['target'] = target
    views.append(v); a = {'bufferView': len(views) - 1, 'componentType': comp, 'count': count, 'type': typ}
    if mn is not None: a['min'] = mn; a['max'] = mx
    accs.append(a); return len(accs) - 1
nv = len(P) // 3
aP = add(P, 'f', nv, 5126, 'VEC3', 34962, [min(P[i::3]) for i in range(3)], [max(P[i::3]) for i in range(3)]); aN = add(N, 'f', nv, 5126, 'VEC3', 34962); aT = add(UV, 'f', nv, 5126, 'VEC2', 34962)
aJ = add(J, 'H', nv, 5123, 'VEC4', 34962); aW = add(W, 'f', nv, 5126, 'VEC4', 34962); aI = add(IX, 'I', len(IX), 5125, 'SCALAR', 34963); aB = add(sum([ibm(p) for p in jw], []), 'f', 5, 5126, 'MAT4')
aTime = add(times, 'f', 5, 5126, 'SCALAR', None, [0.0], [1.0]); aWA = add(wave_arm, 'f', 5, 5126, 'VEC4'); aWH = add(wave_head, 'f', 5, 5126, 'VEC4'); aIS = add(idle_spine, 'f', 5, 5126, 'VEC4')
while len(blob) % 4: blob.append(0)
imgOff = len(blob); blob.extend(png); views.append({'buffer': 0, 'byteOffset': imgOff, 'byteLength': len(png)}); imgView = len(views) - 1
while len(blob) % 4: blob.append(0)
names = ['Hips', 'Spine', 'Head', 'LeftArm', 'RightArm']
nodes = [{'name': 'Armature', 'children': [1]}] + [{'name': names[i], 'translation': list(local[i]), 'children': [k + 1 for k in range(5) if parent[k] == i]} for i in range(5)] + [{'name': 'Body', 'mesh': 0, 'skin': 0}]
for n in nodes:
    if 'children' in n and not n['children']: del n['children']
gltf = {'asset': {'version': '2.0', 'generator': 'stratakin test'}, 'scene': 0, 'scenes': [{'nodes': [0, 6]}], 'nodes': nodes,
  'meshes': [{'primitives': [{'attributes': {'POSITION': aP, 'NORMAL': aN, 'TEXCOORD_0': aT, 'JOINTS_0': aJ, 'WEIGHTS_0': aW}, 'indices': aI, 'material': 0}]}],
  'materials': [{'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'metallicFactor': 0}}], 'textures': [{'source': 0, 'sampler': 0}], 'samplers': [{}],
  'images': [{'bufferView': imgView, 'mimeType': 'image/png'}], 'skins': [{'joints': [1, 2, 3, 4, 5], 'inverseBindMatrices': aB, 'skeleton': 1}],
  'animations': [{'name': 'wave', 'samplers': [{'input': aTime, 'output': aWA}, {'input': aTime, 'output': aWH}], 'channels': [{'sampler': 0, 'target': {'node': 5, 'path': 'rotation'}}, {'sampler': 1, 'target': {'node': 3, 'path': 'rotation'}}]},
                 {'name': 'idle', 'samplers': [{'input': aTime, 'output': aIS}], 'channels': [{'sampler': 0, 'target': {'node': 2, 'path': 'rotation'}}]}],
  'buffers': [{'byteLength': len(blob)}], 'bufferViews': views, 'accessors': accs}
js = json.dumps(gltf).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(blob), 0x004E4942) + bytes(blob)
open(out, 'wb').write(glb); print(out, len(glb), 'bytes,', nv, 'verts,', len(IX) // 3, 'tris')
