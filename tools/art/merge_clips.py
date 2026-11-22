#!/usr/bin/env python3
"""Put the clips of one rigged GLB into another rigged from the same model: one file, an idle and a walk.

usage: merge_clips.py base.glb extra.glb out.glb

A Meshy rig carries one clip, so a figure that should both stand and walk is rigged twice from the same uploaded
model. The two skeletons come out alike (same joints, same rest pose); this checks that, then copies the extra
file's animations into the base file, joint by joint by name. Channels for joints the base lacks are dropped.
"""
import json, struct, sys

import numpy as np

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def read(path):
    b = open(path, 'rb').read()
    _, _, total = struct.unpack_from('<III', b, 0)
    o, js, bin_ = 12, None, b''
    while o < total:
        ln, ty = struct.unpack_from('<II', b, o)
        if ty == 0x4E4F534A:
            js = json.loads(b[o + 8:o + 8 + ln])
        elif ty == 0x004E4942:
            bin_ = b[o + 8:o + 8 + ln]
        o += 8 + ln
    return js, bin_


def acc_bytes(js, bin_, i):
    a = js['accessors'][i]
    bv = js['bufferViews'][a['bufferView']]
    item = np.dtype(CT[a['componentType']]).itemsize * NC[a['type']]
    stride = bv.get('byteStride') or item
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    if stride == item:
        return bin_[off:off + item * a['count']]
    return b''.join(bin_[off + k * stride:off + k * stride + item] for k in range(a['count']))


def main():
    bp, ep, out = sys.argv[1:4]
    bj, bb = read(bp)
    ej, eb = read(ep)
    bname = {n.get('name'): i for i, n in enumerate(bj['nodes'])}
    # the two skeletons must agree, or the clips would bend the wrong limbs
    bj_j = [bj['nodes'][j]['name'] for j in bj['skins'][0]['joints']]
    ej_j = [ej['nodes'][j]['name'] for j in ej['skins'][0]['joints']]
    if bj_j != ej_j:
        sys.exit('different skeletons:\n %s\n %s' % (bj_j, ej_j))
    # two rigs of one model differ by millimetres and a few degrees (a hand by ten or so): close enough to share clips
    wt, wr = 0.0, 0.0
    for nm in bj_j:
        a, b = bj['nodes'][bname[nm]], next(n for n in ej['nodes'] if n.get('name') == nm)
        ta, tb = np.array(a.get('translation', [0, 0, 0])), np.array(b.get('translation', [0, 0, 0]))
        wt = max(wt, float(np.max(np.abs(ta - tb))) / max(1e-6, float(np.linalg.norm(ta)), 0.05 * float(np.linalg.norm(ta)) + 1e-6))
        qa, qb = np.array(a.get('rotation', [0, 0, 0, 1])), np.array(b.get('rotation', [0, 0, 0, 1]))
        wr = max(wr, float(np.degrees(2 * np.arccos(min(1.0, abs(float(np.dot(qa, qb))))))))
    print('rest poses: bone offsets differ by at most %.1f%% of the bone, rotations by %.1f degrees' % (wt * 100, wr))
    if wt > 0.2 or wr > 25:
        sys.exit('rest poses differ too much to share clips')
    bin_ = bytearray(bb)
    bj.setdefault('animations', [])
    for an in ej.get('animations', []):
        samplers, chans, smap = [], [], {}
        for c in an['channels']:
            nm = ej['nodes'][c['target']['node']].get('name')
            if nm not in bname:
                continue
            si = c['sampler']
            if si not in smap:
                s = an['samplers'][si]
                new = {}
                for key in ('input', 'output'):
                    data = acc_bytes(ej, eb, s[key])
                    while len(bin_) % 4:
                        bin_.append(0)
                    bj['bufferViews'].append({'buffer': 0, 'byteOffset': len(bin_), 'byteLength': len(data)})
                    bin_.extend(data)
                    a = dict(ej['accessors'][s[key]])
                    a['bufferView'] = len(bj['bufferViews']) - 1
                    a.pop('byteOffset', None)
                    bj['accessors'].append(a)
                    new[key] = len(bj['accessors']) - 1
                samplers.append({'input': new['input'], 'output': new['output'], 'interpolation': s.get('interpolation', 'LINEAR')})
                smap[si] = len(samplers) - 1
            chans.append({'sampler': smap[si], 'target': {'node': bname[nm], 'path': c['target']['path']}})
        bj['animations'].append({'name': an.get('name', 'clip'), 'samplers': samplers, 'channels': chans})
        print('added %s: %d channels' % (an.get('name'), len(chans)))
    while len(bin_) % 4:
        bin_.append(0)
    bj['buffers'] = [{'byteLength': len(bin_)}]
    jb = json.dumps(bj, separators=(',', ':')).encode()
    jb += b' ' * ((4 - len(jb) % 4) % 4)
    open(out, 'wb').write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(jb) + 8 + len(bin_)) + struct.pack('<II', len(jb), 0x4E4F534A) + jb + struct.pack('<II', len(bin_), 0x004E4942) + bytes(bin_))
    print('%s: %d clips' % (out, len(bj['animations'])))


if __name__ == '__main__':
    main()
