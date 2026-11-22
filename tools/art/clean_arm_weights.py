#!/usr/bin/env python3
"""Take the arms' weights off anything that is not an arm: a cape, a coat tail, a cloak hanging behind the hands.

usage: clean_arm_weights.py in.glb out.glb [reach=0.12]

An auto-rig weights by nearness, so a cape that hangs past the hands gets the hands, and flaps out like a wing
when they move. Every vertex further than `reach` (in the mesh's own units) from the bones of an arm (upper arm,
forearm, hand and a little past the wrist) loses its weights on that arm; what is left is scaled back up to one,
and a vertex left with nothing goes to the nearest bone of the body (spine, hips or legs).
Same layout written back, any component type.
"""
import json, struct, sys

import numpy as np

CT = {5121: np.uint8, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}


def seg_dist(p, a, b):
    ab = b - a
    t = np.clip(((p - a) @ ab) / max(1e-12, ab @ ab), 0, 1)
    return np.linalg.norm(p - (a + t[:, None] * ab), axis=1)


def main():
    src, dst = sys.argv[1], sys.argv[2]
    reach = float(sys.argv[3]) if len(sys.argv) > 3 else 0.12
    b = open(src, 'rb').read()
    _, _, total = struct.unpack_from('<III', b, 0)
    o, js, bin_ = 12, None, None
    while o < total:
        ln, ty = struct.unpack_from('<II', b, o)
        if ty == 0x4E4F534A:
            js = json.loads(b[o + 8:o + 8 + ln])
        elif ty == 0x004E4942:
            bin_ = bytearray(b[o + 8:o + 8 + ln])
        o += 8 + ln
    nodes = js['nodes']
    mi = next(i for i, n in enumerate(nodes) if 'mesh' in n and 'skin' in n)
    sk = js['skins'][nodes[mi]['skin']]
    names = [nodes[j].get('name', '').split(':')[-1] for j in sk['joints']]

    def view(i):
        a = js['accessors'][i]
        bv = js['bufferViews'][a['bufferView']]
        dt = np.dtype(CT[a['componentType']])
        n = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a['type']]
        stride = bv.get('byteStride') or dt.itemsize * n
        return a, dt, n, stride, bv.get('byteOffset', 0) + a.get('byteOffset', 0)

    def read(i):
        a, dt, n, stride, off = view(i)
        return np.stack([np.frombuffer(bytes(bin_[off + v * stride:off + v * stride + dt.itemsize * n]), dt) for v in range(a['count'])])

    def write(i, arr):
        a, dt, n, stride, off = view(i)
        arr = arr.astype(dt)
        for v in range(a['count']):
            bin_[off + v * stride:off + v * stride + dt.itemsize * n] = arr[v].tobytes()

    ibm = read(sk['inverseBindMatrices']).astype(np.float64).reshape(-1, 4, 4).transpose(0, 2, 1)
    pos = np.array([np.linalg.inv(m)[:3, 3] for m in ibm])  # each joint where it stands, in the mesh's own space
    J = {n: k for k, n in enumerate(names)}
    arms = {}
    for side in ('Left', 'Right'):
        ks = [J.get(side + p) for p in ('Arm', 'ForeArm', 'Hand')]
        if None in ks:
            sys.exit('no %s arm joints (%s)' % (side, ', '.join(names)))
        a, e, w = pos[ks[0]], pos[ks[1]], pos[ks[2]]
        tip = w + (w - e) * 0.45
        arms[side] = (ks, [(a, e), (e, w), (w, tip)])
    body = [k for k, n in enumerate(names) if not any(n.startswith(s) and n[len(s):] in ('Arm', 'ForeArm', 'Hand') for s in ('Left', 'Right')) and 'Shoulder' not in n and n not in ('head_end', 'headfront')]
    par = {}
    for i, n in enumerate(nodes):
        for c in n.get('children', []):
            par[c] = i
    jset = set(sk['joints'])
    body_segs = []
    for k in body:
        p = par.get(sk['joints'][k])
        if p in jset:
            body_segs.append((k, pos[sk['joints'].index(p)], pos[k]))
        else:
            body_segs.append((k, pos[k], pos[k]))
    moved = 0
    for pr in js['meshes'][nodes[mi]['mesh']]['primitives']:
        at = pr['attributes']
        P = read(at['POSITION']).astype(np.float64)
        Jw = read(at['JOINTS_0']).astype(np.int64)
        wa = js['accessors'][at['WEIGHTS_0']]
        one = 1.0 if wa['componentType'] == 5126 else float(np.iinfo(CT[wa['componentType']]).max)
        W = read(at['WEIGHTS_0']).astype(np.float64) / one
        for side, (ks, segs) in arms.items():
            d = np.min(np.stack([seg_dist(P, a, b2) for a, b2 in segs]), axis=0)
            far = d > reach
            on = np.isin(Jw, ks) & (W > 0)
            hit = far & on.any(1)
            W[hit[:, None] & on] = 0
            moved += int(hit.sum())
        s = W.sum(1)
        empty = s < 0.05
        if empty.any():
            dd = np.stack([seg_dist(P[empty], a, b2) for _, a, b2 in body_segs])
            near = np.array([body_segs[i][0] for i in np.argmin(dd, axis=0)])
            Jw[empty] = 0
            Jw[empty, 0] = near
            W[empty] = 0
            W[empty, 0] = 1
            s = W.sum(1)
        W = W / s[:, None]
        write(at['JOINTS_0'], Jw)
        write(at['WEIGHTS_0'], np.round(W * one) if one != 1.0 else W)
    jb = json.dumps(js, separators=(',', ':')).encode()
    jb += b' ' * ((4 - len(jb) % 4) % 4)
    bb = bytes(bin_) + b'\0' * ((4 - len(bin_) % 4) % 4)
    open(dst, 'wb').write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(jb) + 8 + len(bb)) + struct.pack('<II', len(jb), 0x4E4F534A) + jb + struct.pack('<II', len(bb), 0x004E4942) + bb)
    print('%s: %d vertices let go of an arm they were too far from (reach %.2f)' % (dst, moved, reach))


if __name__ == '__main__':
    main()
