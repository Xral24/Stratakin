#!/usr/bin/env python3
"""Stand a Tripo model square to the front, the way riggers and glTF expect: +y up, facing +z.

usage: face_front.py in.glb out.glb [extra_degrees]

Tripo writes its figure facing +x. With orientation "align_image" it also puts a node matrix on top that turns
the figure to the camera angle of the source picture (a three-quarter view stays three-quarter). Both are undone
here: node matrices are dropped and every position and normal is turned -90 degrees about y (+x becomes +z),
plus extra_degrees if the figure itself leans round. The mesh is also set on y = 0 and centred on x and z.
Only plain, unskinned files (what Tripo makes); a rigged file is turned at load time by the game instead.
"""
import json, math, struct, sys

import numpy as np


def main():
    src, dst = sys.argv[1], sys.argv[2]
    extra = math.radians(float(sys.argv[3])) if len(sys.argv) > 3 else 0.0
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
    assert not js.get('skins'), 'skinned file: turn it in the game instead'
    a = -math.pi / 2 + extra
    c, s = math.cos(a), math.sin(a)
    R = np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])  # about y: +x goes to +z at a = -90 degrees
    for n in js['nodes']:
        for k in ('matrix', 'rotation', 'translation', 'scale'):
            n.pop(k, None)
    done = set()
    allP = []
    for m in js['meshes']:
        for pr in m['primitives']:
            for key in ('POSITION', 'NORMAL'):
                i = pr['attributes'].get(key)
                if i is None or i in done:
                    continue
                done.add(i)
                acc = js['accessors'][i]
                bv = js['bufferViews'][acc['bufferView']]
                assert acc['componentType'] == 5126 and not bv.get('byteStride'), 'expects tight float vec3'
                off = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
                v = np.frombuffer(bytes(bin_[off:off + acc['count'] * 12]), np.float32).reshape(-1, 3).astype(np.float64)
                v = v @ R.T
                if key == 'POSITION':
                    allP.append((i, off, v))
                else:
                    bin_[off:off + acc['count'] * 12] = v.astype(np.float32).tobytes()
    P = np.concatenate([v for _, _, v in allP])
    lo, hi = P.min(0), P.max(0)
    shift = np.array([-(lo[0] + hi[0]) / 2, -lo[1], -(lo[2] + hi[2]) / 2])
    for i, off, v in allP:
        v = v + shift
        bin_[off:off + len(v) * 12] = v.astype(np.float32).tobytes()
        js['accessors'][i]['min'] = v.min(0).tolist()
        js['accessors'][i]['max'] = v.max(0).tolist()
    jb = json.dumps(js, separators=(',', ':')).encode()
    jb += b' ' * ((4 - len(jb) % 4) % 4)
    bb = bytes(bin_) + b'\0' * ((4 - len(bin_) % 4) % 4)
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(jb) + 8 + len(bb)) + struct.pack('<II', len(jb), 0x4E4F534A) + jb + struct.pack('<II', len(bb), 0x004E4942) + bb
    open(dst, 'wb').write(out)
    print('%s: %d bytes, box %.3f x %.3f x %.3f' % (dst, len(out), *(hi - lo)))


if __name__ == '__main__':
    main()
