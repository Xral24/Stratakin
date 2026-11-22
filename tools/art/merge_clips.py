#!/usr/bin/env python3
"""Put the clips of one rigged GLB into another rigged from the same model: one file, an idle and a walk.

usage: merge_clips.py base.glb extra.glb out.glb

A Meshy rig carries one clip, so a figure that should both stand and walk is rigged twice from the same model.
The two skeletons have the same joints but never quite the same rest pose: an auto-rigger puts a joint a little
differently each time (a shoulder a few centimetres over, a bone turned by ten or twenty degrees), more on a
bulky figure than a slim one. Copying the extra clip's numbers straight across would bend the base skeleton by
those differences, so the clip is carried over as motion instead (retargeted): at every frame each joint of the
base turns, in the world, by exactly what the same joint of the extra rig turns away from its own rest, and the
hips move by what the extra hips move (scaled to the base's height). Joints the base lacks are dropped; joints the
extra lacks follow their parent.
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


def acc(js, bin_, i):
    a = js['accessors'][i]
    bv = js['bufferViews'][a['bufferView']]
    dt, n = CT[a['componentType']], NC[a['type']]
    item = np.dtype(dt).itemsize * n
    stride = bv.get('byteStride') or item
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    if stride == item:
        arr = np.frombuffer(bin_, dt, count=a['count'] * n, offset=off).reshape(a['count'], n)
    else:
        arr = np.stack([np.frombuffer(bin_, dt, count=n, offset=off + k * stride) for k in range(a['count'])])
    arr = arr.astype(np.float64)
    if a.get('normalized'):
        arr = arr / float(np.iinfo(dt).max)
    return arr


def qmul(a, b):
    ax, ay, az, aw = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    bx, by, bz, bw = b[..., 0], b[..., 1], b[..., 2], b[..., 3]
    return np.stack([aw * bx + ax * bw + ay * bz - az * by,
                     aw * by - ax * bz + ay * bw + az * bx,
                     aw * bz + ax * by - ay * bx + az * bw,
                     aw * bw - ax * bx - ay * by - az * bz], -1)


def qinv(q):
    return q * np.array([-1.0, -1.0, -1.0, 1.0])


def qrot(q, v):
    u, w = q[..., :3], q[..., 3:4]
    t = 2 * np.cross(u, v)
    return v + w * t + np.cross(u, t)


def qnorm(q):
    return q / np.maximum(1e-12, np.linalg.norm(q, axis=-1, keepdims=True))


class Skel:
    def __init__(self, js):
        self.js = js
        self.nodes = js['nodes']
        for nd in self.nodes:
            assert 'matrix' not in nd or nd.get('mesh') is not None or nd.get('skin') is not None, 'node with a matrix in the skeleton'
        self.parent = {}
        for i, nd in enumerate(self.nodes):
            for c in nd.get('children', []):
                self.parent[c] = i
        self.joints = js['skins'][0]['joints']
        self.jname = {self.nodes[j]['name']: j for j in self.joints}
        self.t = {i: np.array(nd.get('translation', [0, 0, 0]), dtype=np.float64) for i, nd in enumerate(self.nodes)}
        self.r = {i: qnorm(np.array(nd.get('rotation', [0, 0, 0, 1]), dtype=np.float64)) for i, nd in enumerate(self.nodes)}
        self.s = {i: float(np.mean(nd.get('scale', [1, 1, 1]))) for i, nd in enumerate(self.nodes)}
        # parents before children
        order, seen = [], set()

        def visit(i):
            if i in seen:
                return
            if i in self.parent:
                visit(self.parent[i])
            seen.add(i); order.append(i)
        for i in range(len(self.nodes)):
            visit(i)
        self.order = order
        jset = set(self.joints)
        self.hips = next(j for j in self.joints if self.parent.get(j) not in jset)

    def world(self, rot=None, tr=None):
        """world rotation, position and scale of every node, with some local rotations / translations replaced"""
        R, P, S = {}, {}, {}
        for i in self.order:
            lr = rot[i] if rot is not None and i in rot else self.r[i]
            lt = tr[i] if tr is not None and i in tr else self.t[i]
            if i in self.parent:
                p = self.parent[i]
                R[i] = qmul(R[p], lr); P[i] = P[p] + S[p] * qrot(R[p], lt); S[i] = S[p] * self.s[i]
            else:
                R[i] = lr; P[i] = lt.copy(); S[i] = self.s[i]
        return R, P, S


def main():
    bp, ep, out = sys.argv[1:4]
    bj, bb = read(bp)
    ej, eb = read(ep)
    B, E = Skel(bj), Skel(ej)
    names_b = [bj['nodes'][j]['name'] for j in B.joints]
    names_e = [ej['nodes'][j]['name'] for j in E.joints]
    common = [n for n in names_b if n in E.jname]
    if len(common) < 0.8 * len(names_b):
        sys.exit('different skeletons:\n %s\n %s' % (names_b, names_e))
    Rb0, Pb0, Sb0 = B.world()
    Re0, Pe0, Se0 = E.world()
    # how different the two rest poses are (for the record: the retarget below makes it not matter)
    wt = max(float(np.linalg.norm(B.t[B.jname[n]] * Sb0[B.parent[B.jname[n]]] - E.t[E.jname[n]] * Se0[E.parent[E.jname[n]]])) /
             max(1e-6, float(np.linalg.norm(B.t[B.jname[n]] * Sb0[B.parent[B.jname[n]]]))) for n in common if B.jname[n] in B.parent)
    wr = max(float(np.degrees(2 * np.arccos(min(1.0, abs(float(np.dot(Rb0[B.jname[n]], Re0[E.jname[n]]))))))) for n in common)
    print('rest poses: bone offsets differ by at most %.1f%% of the bone, joints turned by up to %.1f degrees (retargeted)' % (wt * 100, wr))
    hb, he = B.hips, E.hips
    ground_b = min(float(Pb0[j][1]) for j in B.joints); ground_e = min(float(Pe0[j][1]) for j in E.joints)
    ratio = (float(Pb0[hb][1]) - ground_b) / max(1e-6, float(Pe0[he][1]) - ground_e)
    bin_ = bytearray(bb)

    def put(arr, typ, minmax=False):
        data = np.ascontiguousarray(arr, dtype=np.float32).tobytes()
        while len(bin_) % 4:
            bin_.append(0)
        bj['bufferViews'].append({'buffer': 0, 'byteOffset': len(bin_), 'byteLength': len(data)})
        bin_.extend(data)
        a = {'bufferView': len(bj['bufferViews']) - 1, 'componentType': 5126, 'count': int(arr.shape[0]), 'type': typ}
        if minmax:
            a['min'] = [float(x) for x in np.atleast_1d(arr.min(0))]; a['max'] = [float(x) for x in np.atleast_1d(arr.max(0))]
        bj['accessors'].append(a)
        return len(bj['accessors']) - 1

    bj.setdefault('animations', [])
    for an in ej.get('animations', []):
        ch = {}
        times = None
        for c in an['channels']:
            node = c['target']['node']; path = c['target']['path']
            if path not in ('rotation', 'translation'):
                continue
            s = an['samplers'][c['sampler']]
            tin = acc(ej, eb, s['input'])[:, 0]; val = acc(ej, eb, s['output'])
            ch[(node, path)] = (tin, val, s.get('interpolation', 'LINEAR'))
            times = tin if times is None else np.union1d(times, tin)

        def sample(key, t):
            tin, val, interp = ch[key]
            if t <= tin[0]:
                return val[0].copy()
            if t >= tin[-1]:
                return val[-1].copy()
            k = int(np.searchsorted(tin, t) - 1); k = max(0, min(k, len(tin) - 2))
            if interp == 'STEP':
                return val[k].copy()
            f = (t - tin[k]) / max(1e-9, tin[k + 1] - tin[k])
            a, b = val[k], val[k + 1]
            if key[1] == 'rotation':
                if np.dot(a, b) < 0:
                    b = -b
                return qnorm(a * (1 - f) + b * f)
            return a * (1 - f) + b * f

        n = len(times)
        outR = {B.jname[nm]: np.zeros((n, 4)) for nm in common}
        outT = np.zeros((n, 3))
        for k, t in enumerate(times):
            rot = {nd: qnorm(sample((nd, 'rotation'), t)) for (nd, p) in ch if p == 'rotation'}
            tr = {nd: sample((nd, 'translation'), t) for (nd, p) in ch if p == 'translation'}
            Re, Pe, Se = E.world(rot, tr)
            # base, top down: each joint turned in the world by what its twin turned
            Rb = {}
            for i in B.order:
                par = B.parent.get(i)
                Pr = Rb[par] if par is not None else None
                nm = bj['nodes'][i].get('name')
                if i in outR:
                    e = E.jname[nm]
                    W = qmul(qmul(Re[e], qinv(Re0[e])), Rb0[i])
                    L = qmul(qinv(Pr), W) if Pr is not None else W
                    if k and np.dot(L, outR[i][k - 1]) < 0:
                        L = -L
                    outR[i][k] = L; Rb[i] = W
                else:
                    Rb[i] = qmul(Pr, B.r[i]) if Pr is not None else B.r[i]
            # the hips: the extra hips' travel, in the world, scaled to the base's size, back into the base's parent space
            pe, pb = E.parent[he], B.parent[hb]
            d_world = Se0[pe] * qrot(Re0[pe], tr.get(he, E.t[he]) - E.t[he]) * ratio
            outT[k] = B.t[hb] + qrot(qinv(Rb0[pb]), d_world) / Sb0[pb]
        samplers, chans = [], []
        ti = put(times.reshape(-1, 1), 'SCALAR', True)
        for i, q in outR.items():
            samplers.append({'input': ti, 'output': put(q, 'VEC4'), 'interpolation': 'LINEAR'})
            chans.append({'sampler': len(samplers) - 1, 'target': {'node': i, 'path': 'rotation'}})
        samplers.append({'input': ti, 'output': put(outT, 'VEC3'), 'interpolation': 'LINEAR'})
        chans.append({'sampler': len(samplers) - 1, 'target': {'node': hb, 'path': 'translation'}})
        bj['animations'].append({'name': an.get('name', 'clip'), 'samplers': samplers, 'channels': chans})
        print('added %s: %d frames, %d channels, hips scaled by %.3f' % (an.get('name'), n, len(chans), ratio))
    while len(bin_) % 4:
        bin_.append(0)
    bj['buffers'] = [{'byteLength': len(bin_)}]
    jb = json.dumps(bj, separators=(',', ':')).encode()
    jb += b' ' * ((4 - len(jb) % 4) % 4)
    open(out, 'wb').write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(jb) + 8 + len(bin_)) + struct.pack('<II', len(jb), 0x4E4F534A) + jb + struct.pack('<II', len(bin_), 0x004E4942) + bytes(bin_))
    print('%s: %d clips' % (out, len(bj['animations'])))


if __name__ == '__main__':
    main()
