#!/usr/bin/env python3
"""Make a held prop rigid: every vertex inside a region follows one joint, fully.

usage: rigid_prop.py in.glb out.glb JOINT "expression in x, y, z"
   e.g. rigid_prop.py keychain-rig.glb keychain-fixed.glb RightHand "x < -0.28"

An auto-rig weights by nearness, so a key that reaches the ground gets the leg it hangs beside, and bends when
the leg swings. The region is in the skinned mesh's own coordinates (what inspect_rig's joint colouring shows).
Joint and weight data are rewritten in place: same layout, any component type.
"""
import json, struct, sys

import numpy as np

CT = {5121: np.uint8, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}


def main():
    src, dst, joint, expr = sys.argv[1:5]
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
    names = [nodes[j].get('name', '') for j in sk['joints']]
    if joint not in names:
        sys.exit('no joint %s; joints: %s' % (joint, ', '.join(names)))
    jk = names.index(joint)

    def view(i):
        a = js['accessors'][i]
        bv = js['bufferViews'][a['bufferView']]
        dt = np.dtype(CT[a['componentType']])
        n = {'VEC3': 3, 'VEC4': 4}[a['type']]
        stride = bv.get('byteStride') or dt.itemsize * n
        off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        return a, dt, n, stride, off

    def read(i):
        a, dt, n, stride, off = view(i)
        out = np.zeros((a['count'], n), dt)
        for v in range(a['count']):
            out[v] = np.frombuffer(bytes(bin_[off + v * stride:off + v * stride + dt.itemsize * n]), dt)
        return out

    def write(i, arr):
        a, dt, n, stride, off = view(i)
        arr = arr.astype(dt)
        for v in range(a['count']):
            bin_[off + v * stride:off + v * stride + dt.itemsize * n] = arr[v].tobytes()

    moved = 0
    for pr in js['meshes'][nodes[mi]['mesh']]['primitives']:
        at = pr['attributes']
        P = read(at['POSITION']).astype(np.float64)
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        sel = np.asarray(eval(expr, {'np': np}, {'x': x, 'y': y, 'z': z}), bool)
        J = read(at['JOINTS_0'])
        W = read(at['WEIGHTS_0'])
        wa = js['accessors'][at['WEIGHTS_0']]
        one = 1.0 if wa['componentType'] == 5126 else float(np.iinfo(CT[wa['componentType']]).max)
        J[sel] = 0
        J[sel, 0] = jk
        W[sel] = 0
        W[sel, 0] = one
        write(at['JOINTS_0'], J)
        write(at['WEIGHTS_0'], W)
        moved += int(sel.sum())
    jb = json.dumps(js, separators=(',', ':')).encode()
    jb += b' ' * ((4 - len(jb) % 4) % 4)
    bb = bytes(bin_) + b'\0' * ((4 - len(bin_) % 4) % 4)
    open(dst, 'wb').write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(jb) + 8 + len(bb)) + struct.pack('<II', len(jb), 0x4E4F534A) + jb + struct.pack('<II', len(bb), 0x004E4942) + bb)
    print('%s: %d vertices now follow %s only' % (dst, moved, joint))


if __name__ == '__main__':
    main()
