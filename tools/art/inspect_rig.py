#!/usr/bin/env python3
"""Look at a rigged GLB moving, without a game: frames of its clip from the side and the front.

usage: inspect_rig.py out.jpg model.glb [--frames N] [--clip K] [--fold] [--t0 a --t1 b]

Skins every vertex with its four joint weights (the rig as made), or with --fold the way js/glb.js draws it on the
phone: the skeleton folded into fourteen groups, each vertex on its two strongest. Rows: side view, then front view,
at N moments spread over the clip. Catches a prop that bends with a leg, an arm through the body, feet through the floor.
"""
import math, sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, __import__('os').path.dirname(__file__))
from inspect_glb import load, accessor, local, render  # noqa: E402

MAXG = 14


def quat_slerp(a, b, u):
    d = float(np.dot(a, b))
    if d < 0:
        b, d = -b, -d
    if d > 0.9995:
        q = a + (b - a) * u
    else:
        th = math.acos(d)
        q = (math.sin((1 - u) * th) * a + math.sin(u * th) * b) / math.sin(th)
    return q / np.linalg.norm(q)


def sample(times, vals, interp, t, w):
    n = len(times)
    if interp == 'CUBICSPLINE':
        vals = vals.reshape(n, 3, w)[:, 1, :]
    else:
        vals = vals.reshape(n, w)
    if t <= times[0] or n == 1:
        return vals[0].copy()
    if t >= times[-1]:
        return vals[-1].copy()
    k = int(np.searchsorted(times, t, side='right') - 1)
    u = (t - times[k]) / max(1e-9, times[k + 1] - times[k])
    if interp == 'STEP':
        return vals[k].copy()
    if w == 4:
        return quat_slerp(vals[k], vals[k + 1], u)
    return vals[k] + (vals[k + 1] - vals[k]) * u


def trs(t, r, s):
    from inspect_glb import qmat
    m = np.eye(4)
    m[:3, :3] = qmat(r) @ np.diag(s)
    m[:3, 3] = t
    return m


class Rig:
    def __init__(self, path):
        js, bin_ = load(path)
        self.js, self.bin = js, bin_
        nodes = js['nodes']
        self.nodes = nodes
        self.parent = {}
        for i, n in enumerate(nodes):
            for c in n.get('children', []):
                self.parent[c] = i
        self.rest = []
        for n in nodes:
            if 'matrix' in n:
                self.rest.append(None)
            else:
                self.rest.append((np.array(n.get('translation', [0, 0, 0]), float), np.array(n.get('rotation', [0, 0, 0, 1]), float), np.array(n.get('scale', [1, 1, 1]), float)))
        mi = next(i for i, n in enumerate(nodes) if 'mesh' in n and 'skin' in n)
        sk = js['skins'][nodes[mi]['skin']]
        self.joints = sk['joints']
        self.ibm = accessor(js, bin_, sk['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
        P, UV, JN, WT, F = [], [], [], [], []
        base = 0
        self.tex = None
        for pr in js['meshes'][nodes[mi]['mesh']]['primitives']:
            at = pr['attributes']
            p = accessor(js, bin_, at['POSITION'])
            P.append(p)
            UV.append(accessor(js, bin_, at['TEXCOORD_0']) if 'TEXCOORD_0' in at else np.full((len(p), 2), -1.0))
            JN.append(accessor(js, bin_, at['JOINTS_0']).astype(int))
            WT.append(accessor(js, bin_, at['WEIGHTS_0']))
            F.append(accessor(js, bin_, pr['indices']).astype(np.int64).reshape(-1, 3) + base)
            base += len(p)
        self.P, self.UV, self.JN, self.WT, self.F = np.concatenate(P), np.concatenate(UV), np.concatenate(JN), np.concatenate(WT), np.concatenate(F)
        from inspect_glb import geometry
        _, _, _, self.tex = geometry(js, bin_)
        self.anims = []
        for a in js.get('animations', []):
            chs = []
            for c in a['channels']:
                s = a['samplers'][c['sampler']]
                path = c['target']['path']
                if path == 'weights':
                    continue
                chs.append((c['target']['node'], path, accessor(js, bin_, s['input']).ravel(), accessor(js, bin_, s['output']).ravel(), s.get('interpolation', 'LINEAR')))
            dur = max(ch[2][-1] for ch in chs) if chs else 1.0
            self.anims.append((a.get('name', 'clip'), chs, dur))

    def world(self, clip=None, t=0.0, still=()):
        loc = [None if r is None else [r[0].copy(), r[1].copy(), r[2].copy()] for r in self.rest]
        if clip is not None:
            _, chs, dur = self.anims[clip]
            for node, path, times, vals, interp in chs:
                if self.nodes[node].get('name') in still:
                    continue
                w = 4 if path == 'rotation' else 3
                v = sample(times, vals, interp, t % dur if dur > 0 else 0, w)
                loc[node][{'translation': 0, 'rotation': 1, 'scale': 2}[path]] = v
        W = [None] * len(self.nodes)

        def get(i):
            if W[i] is not None:
                return W[i]
            L = local(self.nodes[i]) if loc[i] is None else trs(*loc[i])
            W[i] = L if i not in self.parent else get(self.parent[i]) @ L
            return W[i]
        for i in range(len(self.nodes)):
            get(i)
        return W

    def skinned(self, W, fold=None):
        M = np.stack([W[j] @ self.ibm[k] for k, j in enumerate(self.joints)])
        if fold is None:
            out = np.zeros((len(self.P), 3))
            ph = np.c_[self.P, np.ones(len(self.P))]
            for c in range(4):
                Mi = M[self.JN[:, c]]
                out += self.WT[:, c:c + 1] * np.einsum('vij,vj->vi', Mi, ph)[:, :3]
            return out
        keep, b1, b2, w2 = fold
        G = M[keep]
        ph = np.c_[self.P, np.ones(len(self.P))]
        p1 = np.einsum('vij,vj->vi', G[b1], ph)[:, :3]
        p2 = np.einsum('vij,vj->vi', G[b2], ph)[:, :3]
        return p1 * (1 - w2[:, None]) + p2 * w2[:, None]


def fold_groups(rig):
    """the same choice js/glb.js makes: a humanoid keeps its hips, chest, head and every limb to the foot; anything else by weight"""
    J, nodes, par = rig.joints, rig.nodes, rig.parent
    name = lambda k: nodes[J[k]].get('name', '')
    imp = np.zeros(len(J))
    for c in range(4):
        np.add.at(imp, rig.JN[:, c], rig.WT[:, c])
    jset = {n: k for k, n in enumerate(J)}
    keep = humanoid_keep(rig)
    if keep is None:
        root = next(k for k in range(len(J)) if not any(p in jset for p in ancestors(par, J[k])))
        keep = [root] + [k for k in np.argsort(-imp) if k != root and imp[k] > 0][:MAXG - 1]
    keep = list(keep)
    slot = {k: s for s, k in enumerate(keep)}

    def map_of(k):
        n = J[k]
        while n is not None:
            jk = jset.get(n)
            if jk is not None and jk in slot:
                return slot[jk]
            n = par.get(n)
        return 0
    mp = np.array([map_of(k) for k in range(len(J))])
    nv = len(rig.P)
    acc = np.zeros((nv, len(keep)))
    for c in range(4):
        np.add.at(acc, (np.arange(nv), mp[rig.JN[:, c]]), rig.WT[:, c])
    order = np.argsort(-acc, axis=1)
    b1, b2 = order[:, 0], order[:, 1]
    a1, a2 = acc[np.arange(nv), b1], acc[np.arange(nv), b2]
    w2 = np.where(a2 > 0, a2 / np.maximum(1e-9, a1 + a2), 0)
    return [keep, b1, b2, w2], [name(k) for k in keep]


def ancestors(par, n):
    out = []
    while n in par:
        n = par[n]
        out.append(n)
    return out


def humanoid_keep(rig):
    import re
    J, nodes, par = rig.joints, rig.nodes, rig.parent
    names = [re.sub(r'^.*:', '', nodes[j].get('name', '')) for j in J]
    find = lambda pat: next((k for k, n in enumerate(names) if re.fullmatch(pat, n, re.I)), -1)
    hips, head = find(r'hips|pelvis'), find(r'head')
    limbs = [find(p) for p in (r'left_?arm|leftupperarm', r'left_?fore_?arm|leftlowerarm', r'right_?arm|rightupperarm', r'right_?fore_?arm|rightlowerarm',
                               r'left_?up_?leg|leftupperleg|leftthigh', r'left_?leg|leftlowerleg|leftcalf', r'left_?foot', r'right_?up_?leg|rightupperleg|rightthigh', r'right_?leg|rightlowerleg|rightcalf', r'right_?foot')]
    if hips < 0 or head < 0 or min(limbs) < 0:
        return None
    chain = [jk for jk in (J.index(n) if n in J else -1 for n in ancestors(par, J[head])) if jk >= 0]
    chain = chain[:chain.index(hips)] if hips in chain else chain  # from the neck down to just above the hips
    arm_anc = [J.index(n) for n in ancestors(par, J[limbs[0]]) if n in J]
    chest = next((k for k in arm_anc if k in chain), chain[0] if chain else hips)
    below = chain[chain.index(chest) + 1:] if chest in chain else []
    mid = below[(len(below) - 1) // 2] if below else None
    keep = [hips, chest, head] + limbs + ([mid] if mid is not None else [])
    seen, out = set(), []
    for k in keep:
        if k not in seen:
            seen.add(k); out.append(k)
    return out[:MAXG]


def main():
    args = sys.argv[1:]
    out, path = args[0], args[1]
    opt = lambda k, d: type(d)(args[args.index(k) + 1]) if k in args else d
    frames, clip, fold = opt('--frames', 6), opt('--clip', 0), '--fold' in args
    still = tuple(opt('--still', '').split(',')) if '--still' in args else ()
    rig = Rig(path)
    fd, kept = fold_groups(rig) if fold else (None, None)
    name, chs, dur = rig.anims[clip] if rig.anims else ('rest', [], 1.0)
    t0, t1 = opt('--t0', 0.0), opt('--t1', dur)
    ts = [t0 + (t1 - t0) * k / frames for k in range(frames)]
    poses = [rig.skinned(rig.world(clip if rig.anims else None, t, still), fd) for t in ts]
    allp = np.concatenate(poses)
    lo, hi = allp.min(0), allp.max(0)
    span = max(hi - lo)
    size = 300
    rows = []
    views = (('side', math.pi / 2), ('front', 0.0)) if '--other' not in args else (('other side', -math.pi / 2), ('back', math.pi))
    for vname, yaw in views:
        c, s = math.cos(yaw), math.sin(yaw)
        R = np.array([[c, 0, -s], [0, 1, 0], [s, 0, c]], float)
        Q = allp @ R.T
        box = (Q.min(0), Q.max(0), span)
        cells = [render(p, rig.UV, rig.F, rig.tex, (vname, yaw), size, box) for p in poses]
        row = Image.new('RGB', (size * frames, size), 'white')
        for i, cimg in enumerate(cells):
            row.paste(cimg, (i * size, 0))
            ImageDraw.Draw(row).text((i * size + 4, size - 14), '%s t=%.2f' % (vname, ts[i]), fill=(0, 0, 0))
        rows.append(row)
    head = '%s  clip %s (%.2fs)  %s' % (path.split('/')[-1], name, dur, ('folded: ' + ','.join(kept)) if fold else 'full skinning')
    sheet = Image.new('RGB', (rows[0].width, 20 + sum(r.height for r in rows)), 'white')
    ImageDraw.Draw(sheet).text((4, 4), head, fill=(0, 0, 0))
    y = 20
    for r in rows:
        sheet.paste(r, (0, y)); y += r.height
    sheet.save(out, quality=86)
    print(head)


if __name__ == '__main__':
    main()
