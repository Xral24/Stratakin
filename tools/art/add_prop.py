#!/usr/bin/env python3
"""Put a hand-held prop back into a rigged GLB: Keychain's great key, Bigmouth's wooden spoon.

usage: add_prop.py in.glb out.glb key|spoon JOINT [dx dz]

Meshy's A-pose step redraws the figure empty-handed, so a staff, a key or a spoon in the source picture is lost.
This builds the prop as plain geometry, standing upright on the ground through the hand of JOINT (RightHand,
LeftHand) as that hand is at rest, and gives every vertex of it to that joint alone, so it moves with the hand and
never bends. Its colour comes from a small painted patch put into an unused corner of the model's own texture
(iron for the key, wood for the spoon). Keep that arm in `still` in GLB.CAST and the prop stays upright.
dx dz nudge it from the middle of the hand, in the mesh's own units.
"""
import io, json, math, struct, sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, __import__('os').path.dirname(__file__))
from inspect_glb import load, accessor  # noqa: E402

CTN = {5121: np.uint8, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}


class Geo:
    def __init__(self):
        self.P, self.N, self.T, self.I = [], [], [], []

    def add(self, P, N, T, I):
        o = len(self.P)
        self.P += list(P); self.N += list(N); self.T += list(T); self.I += [[a + o, b + o, c + o] for a, b, c in I]

    def tube(self, path, radii, seg=12, u0=0.0, u1=1.0, v0=0.0, v1=1.0, cap=True):
        """rings round a path of points (each ring in the plane across the path's direction)"""
        path = [np.array(p, float) for p in path]; n = len(path); P, N, T, I = [], [], [], []
        for k, c in enumerate(path):
            d = path[min(k + 1, n - 1)] - path[max(k - 1, 0)]; d /= np.linalg.norm(d)
            a = np.cross(d, [0, 0, 1.0]); a = np.cross(d, [1.0, 0, 0]) if np.linalg.norm(a) < 1e-3 else a; a /= np.linalg.norm(a); b = np.cross(d, a)
            r = radii[k] if hasattr(radii, '__len__') else radii
            for s in range(seg + 1):
                t = 2 * math.pi * s / seg; nrm = a * math.cos(t) + b * math.sin(t)
                P.append(c + nrm * r); N.append(nrm); T.append([u0 + (u1 - u0) * s / seg, v0 + (v1 - v0) * k / (n - 1)])
        for k in range(n - 1):
            for s in range(seg):
                i0 = k * (seg + 1) + s; i1 = i0 + 1; j0 = i0 + seg + 1; j1 = j0 + 1
                I += [[i0, j0, i1], [i1, j0, j1]]
        start = len(self.P); self.add(P, N, T, I)
        if cap:
            for end, sgn in ((0, -1), (n - 1, 1)):
                c = path[end]; d = (path[min(end + 1, n - 1)] - path[max(end - 1, 0)]); d = d / np.linalg.norm(d) * sgn
                o = len(self.P); ring = start + end * (seg + 1)
                self.P.append(c); self.N.append(d); self.T.append([(u0 + u1) / 2, (v0 + v1) / 2])
                for s in range(seg):
                    a_, b_ = ring + s, ring + s + 1
                    self.I.append([o, a_, b_] if sgn < 0 else [o, b_, a_])

    def box(self, lo, hi, uv=(0.5, 0.5)):
        lo, hi = np.array(lo, float), np.array(hi, float)
        for ax in range(3):
            for sgn in (-1, 1):
                n = np.zeros(3); n[ax] = sgn; u, v = [(1, 2), (2, 0), (0, 1)][ax]
                c = [None] * 4
                for q, (su, sv) in enumerate(((0, 0), (1, 0), (1, 1), (0, 1))):
                    p = np.zeros(3); p[ax] = hi[ax] if sgn > 0 else lo[ax]; p[u] = hi[u] if su else lo[u]; p[v] = hi[v] if sv else lo[v]; c[q] = p
                tri = [[0, 1, 2], [0, 2, 3]] if sgn > 0 else [[0, 2, 1], [0, 3, 2]]
                self.add(c, [n] * 4, [list(uv)] * 4, tri)

    def blob(self, c, r, seg=14, rings=9, u0=0.0, u1=1.0, v0=0.0, v1=1.0):
        """an ellipsoid: centre c, radii r = (rx, ry, rz)"""
        c, r = np.array(c, float), np.array(r, float); P, N, T, I = [], [], [], []
        for k in range(rings + 1):
            ph = math.pi * k / rings
            for s in range(seg + 1):
                th = 2 * math.pi * s / seg; d = np.array([math.sin(ph) * math.cos(th), math.cos(ph), math.sin(ph) * math.sin(th)])
                P.append(c + d * r); nn = d / r; N.append(nn / np.linalg.norm(nn)); T.append([u0 + (u1 - u0) * s / seg, v0 + (v1 - v0) * k / rings])
        for k in range(rings):
            for s in range(seg):
                i0 = k * (seg + 1) + s; i1 = i0 + 1; j0 = i0 + seg + 1; j1 = j0 + 1
                I += [[i0, i1, j0], [i1, j1, j0]]
        self.add(P, N, T, I)


def patch(kind, size):
    rng = np.random.default_rng(7 if kind == 'key' else 11)
    if kind == 'key':  # dark iron, a little worn and rusty
        a = np.zeros((size, size, 3)) + np.array([70, 64, 76])
        a += rng.normal(0, 7, (size, size, 1))
        for _ in range(size // 2):
            x, y = rng.integers(0, size, 2); a[max(0, y - 2):y + 3, max(0, x - 2):x + 3] += np.array([26, 8, -6]) * rng.random()
        a[:, ::max(4, size // 12)] += 10
    else:  # turned wood, grain running along the handle
        a = np.zeros((size, size, 3)) + np.array([146, 100, 62])
        g = np.sin(np.linspace(0, 40, size))[None, :, None] * 9 + rng.normal(0, 5, (1, size, 1))
        a += g + rng.normal(0, 3, (size, size, 1))
        for _ in range(4):
            x = rng.integers(0, size); a[:, x:x + 2] -= 22
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGB')


def main():
    src, dst, kind, joint = sys.argv[1:5]
    dx, dz = (float(sys.argv[5]), float(sys.argv[6])) if len(sys.argv) > 6 else (0.0, 0.0)
    js, bin_ = load(src); bin_ = bytearray(bin_)
    node = next(n for n in js['nodes'] if n.get('mesh') is not None and n.get('skin') is not None)
    prim = js['meshes'][node['mesh']]['primitives'][0]; at = prim['attributes']; skin = js['skins'][node['skin']]
    names = [js['nodes'][j]['name'] for j in skin['joints']]; ji = names.index(joint)
    P = accessor(js, bin_, at['POSITION']); N = accessor(js, bin_, at['NORMAL']); T = accessor(js, bin_, at['TEXCOORD_0'])
    J = accessor(js, bin_, at['JOINTS_0']).astype(int); W = accessor(js, bin_, at['WEIGHTS_0']); IX = accessor(js, bin_, prim['indices']).astype(np.int64).ravel()
    W = W / np.maximum(1e-9, W.sum(1, keepdims=True))
    # the hand at rest: the vertices it carries most of
    wj = np.where(J == ji, W, 0).sum(1); hand = P[wj > 0.5]
    if len(hand) < 10: sys.exit('no vertices on ' + joint)
    hc = hand.mean(0); H = P[:, 1].max() - P[:, 1].min(); y0 = P[:, 1].min()
    print(f'{joint} at {hc.round(3)}, figure {H:.2f} tall')
    # a free patch of the texture: cells no triangle's UV box touches
    G = 128; used = np.zeros((G, G), bool); tri = IX.reshape(-1, 3); uv = T[tri]; lo = np.clip(np.floor(uv.min(1) * G).astype(int), 0, G - 1); hi = np.clip(np.floor(uv.max(1) * G).astype(int), 0, G - 1)
    for (a0, b0), (a1, b1) in zip(lo, hi): used[b0:b1 + 1, a0:a1 + 1] = True
    best = None
    for size in (8, 6, 4, 3, 2):
        free = ~used; ok = np.ones((G - size + 1, G - size + 1), bool)
        for i in range(size):
            for k in range(size): ok &= free[i:G - size + 1 + i, k:G - size + 1 + k]
        ys, xs = np.where(ok)
        if len(ys): best = (xs[0], ys[0], size); break
    if not best: sys.exit('no free patch in the texture')
    tex = js['materials'][prim.get('material', 0)]['pbrMetallicRoughness']['baseColorTexture']['index']; img = js['images'][js['textures'][tex]['source']]
    vw = js['bufferViews'][img['bufferView']]; im = Image.open(io.BytesIO(bytes(bin_[vw.get('byteOffset', 0):vw.get('byteOffset', 0) + vw['byteLength']]))).convert('RGB')
    Wd, Hd = im.size; px, py, ps = best[0] * Wd // G, best[1] * Hd // G, best[2] * Wd // G
    im.paste(patch(kind, ps), (px, py)); m = max(2, ps // 10)
    u0, u1, v0, v1 = (px + m) / Wd, (px + ps - m) / Wd, (py + m) / Hd, (py + ps - m) / Hd
    print(f'patch {ps}px at {px},{py}')
    g = Geo(); x, z = hc[0] + dx, hc[2] + dz; s = H / 1.7; out = -1.0 if hc[0] < 0 else 1.0  # away from the body
    if kind == 'key':
        top = y0 + 1.36 * s
        g.tube([[x, y0 + 0.02 * s, z], [x, top, z]], 0.024 * s, 12, u0, u1, v0, v1)
        for yy in (0.34, 1.22, 1.30):  # collars on the shaft
            g.tube([[x, y0 + (yy - 0.02) * s, z], [x, y0 + (yy + 0.02) * s, z]], 0.04 * s, 12, u0, u1, v0, v0 + (v1 - v0) * 0.2)
        # the bow: a ring with a waist, facing the front
        R, r = 0.125 * s, 0.03 * s; cy = top + R - 0.01 * s
        ring = [[x + math.sin(t) * R * (0.82 + 0.18 * abs(math.sin(t))), cy - math.cos(t) * R * 0.92, z] for t in np.linspace(0, 2 * math.pi, 25)]
        g.tube(ring, r, 10, u0, u1, v0, v1, cap=False)
        g.tube([[x - R * 0.74, cy, z], [x + R * 0.74, cy, z]], r * 0.8, 8, u0, u1, v0, v1)
        # the bit: a plate with teeth, pointing away from the body
        t = 0.022 * s; b0 = y0 + 0.05 * s
        g.box([min(x, x + out * 0.15 * s), b0, z - t], [max(x, x + out * 0.15 * s), b0 + 0.2 * s, z + t], (u0 + (u1 - u0) * 0.3, v0 + (v1 - v0) * 0.5))
        for k in (0, 1):
            g.box([min(x + out * 0.15 * s, x + out * 0.2 * s), b0 + (0.0 + k * 0.13) * s, z - t], [max(x + out * 0.15 * s, x + out * 0.2 * s), b0 + (0.07 + k * 0.13) * s, z + t], (u0 + (u1 - u0) * 0.6, v0 + (v1 - v0) * 0.5))
    else:
        top = y0 + 1.5 * s
        g.tube([[x, y0 + 0.02 * s, z], [x, y0 + 0.9 * s, z], [x, top, z]], [0.03 * s, 0.026 * s, 0.022 * s], 12, u0, u1, v0, v1)
        g.blob([x, top + 0.2 * s, z], [0.15 * s, 0.22 * s, 0.05 * s], 16, 10, u0, u1, v0, v1)
    n0 = len(P); gp = np.array(g.P, float); gn = np.array(g.N, float); gt = np.array(g.T, float); gi = np.array(g.I, np.int64) + n0
    gj = np.zeros((len(gp), 4), int); gj[:, 0] = ji; gw = np.zeros((len(gp), 4)); gw[:, 0] = 1
    P2 = np.concatenate([P, gp]); N2 = np.concatenate([N, gn]); T2 = np.concatenate([T, gt]); J2 = np.concatenate([J, gj]); W2 = np.concatenate([W, gw]); I2 = np.concatenate([IX, gi.ravel()])

    def put(arr, comp, typ, target=None, minmax=False):
        while len(bin_) % 4: bin_.append(0)
        raw = np.ascontiguousarray(arr.astype(CTN[comp])).tobytes()
        js['bufferViews'].append({'buffer': 0, 'byteOffset': len(bin_), 'byteLength': len(raw), **({'target': target} if target else {})}); bin_.extend(raw)
        a = {'bufferView': len(js['bufferViews']) - 1, 'componentType': comp, 'count': int(arr.shape[0]), 'type': typ}
        if minmax: a['min'] = [float(v) for v in arr.min(0)]; a['max'] = [float(v) for v in arr.max(0)]
        js['accessors'].append(a); return len(js['accessors']) - 1

    for k in [k for k in at if k not in ('POSITION', 'NORMAL', 'TEXCOORD_0', 'JOINTS_0', 'WEIGHTS_0')]: at.pop(k)  # tangents and the like are not carried over (they would be the wrong length; the game does not read them)
    at['POSITION'] = put(P2, 5126, 'VEC3', 34962, True); at['NORMAL'] = put(N2, 5126, 'VEC3', 34962); at['TEXCOORD_0'] = put(T2, 5126, 'VEC2', 34962)
    at['JOINTS_0'] = put(J2, 5123, 'VEC4', 34962); at['WEIGHTS_0'] = put(W2, 5126, 'VEC4', 34962); prim['indices'] = put(I2, 5125, 'SCALAR', 34963)
    buf = io.BytesIO(); im.save(buf, 'PNG'); raw = buf.getvalue()
    while len(bin_) % 4: bin_.append(0)
    js['bufferViews'].append({'buffer': 0, 'byteOffset': len(bin_), 'byteLength': len(raw)}); bin_.extend(raw); img['bufferView'] = len(js['bufferViews']) - 1; img['mimeType'] = 'image/png'
    while len(bin_) % 4: bin_.append(0)
    js['buffers'] = [{'byteLength': len(bin_)}]
    jb = json.dumps(js, separators=(',', ':')).encode(); jb += b' ' * ((4 - len(jb) % 4) % 4)
    open(dst, 'wb').write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(jb) + 8 + len(bin_)) + struct.pack('<II', len(jb), 0x4E4F534A) + jb + struct.pack('<II', len(bin_), 0x004E4942) + bytes(bin_))
    print(f'{dst}: {kind} added, {len(gp)} vertices, {len(gi)} triangles, on {joint}; the figure with it is {P2[:, 1].max() - P2[:, 1].min():.2f} tall (was {H:.2f})')


if __name__ == '__main__':
    main()
