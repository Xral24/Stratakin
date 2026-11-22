#!/usr/bin/env python3
"""Take the rig off a GLB: the mesh as it stands at rest, its texture, nothing else.

usage: strip_skin.py in.glb out.glb [--base-only]

A Meshy model comes rigged with one clip. To give it a second clip (a walk for a figure rigged with an idle, or the
other way round) the same mesh goes back to the rigger, and a rigger wants a plain model, not one with a skeleton
already in it. Every vertex is put where the skin holds it at rest (so a rest pose that differs from the bind pose
is baked in), joints, weights, skins and animations are dropped, and the mesh hangs on a single node with no
transform. With --base-only the normal and roughness pictures go as well (the rigger does not need them).
"""
import json, struct, sys

import numpy as np

sys.path.insert(0, __import__('os').path.dirname(__file__))
from inspect_glb import load, accessor  # noqa: E402


def mat_of(nd):
    if 'matrix' in nd:
        return np.array(nd['matrix'], dtype=np.float64).reshape(4, 4).T
    t = np.array(nd.get('translation', [0, 0, 0]), dtype=np.float64)
    x, y, z, w = nd.get('rotation', [0, 0, 0, 1])
    s = np.array(nd.get('scale', [1, 1, 1]), dtype=np.float64)
    R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                  [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                  [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    M = np.eye(4); M[:3, :3] = R * s[None, :]; M[:3, 3] = t
    return M


def main():
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    base_only = '--base-only' in sys.argv
    src, dst = a[0], a[1]
    js, bin_ = load(src)
    nodes = js['nodes']
    parent = {}
    for i, nd in enumerate(nodes):
        for c in nd.get('children', []):
            parent[c] = i
    world = {}

    def W(i):
        if i in world:
            return world[i]
        M = mat_of(nodes[i])
        if i in parent:
            M = W(parent[i]) @ M
        world[i] = M
        return M

    out_bin = bytearray()
    views, accs = [], []

    def add(arr, comp, typ, target=None, minmax=False):
        nonlocal out_bin
        while len(out_bin) % 4:
            out_bin += b'\0'
        raw = arr.tobytes()
        v = {'buffer': 0, 'byteOffset': len(out_bin), 'byteLength': len(raw)}
        if target:
            v['target'] = target
        views.append(v); out_bin += raw
        acc = {'bufferView': len(views) - 1, 'componentType': comp, 'count': int(arr.shape[0]), 'type': typ}
        if minmax:
            acc['min'] = [float(x) for x in arr.min(0)]; acc['max'] = [float(x) for x in arr.max(0)]
        accs.append(acc)
        return len(accs) - 1

    prims = []
    for ni, nd in enumerate(nodes):
        if nd.get('mesh') is None:
            continue
        skin = js['skins'][nd['skin']] if nd.get('skin') is not None else None
        if skin:
            J = skin['joints']
            ibm = accessor(js, bin_, skin['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1) if 'inverseBindMatrices' in skin else np.tile(np.eye(4), (len(J), 1, 1))
            jm = np.stack([W(j) @ ibm[k] for k, j in enumerate(J)])
            off = np.abs(jm - np.eye(4)[None]).max()
            print(f'node {ni}: rest differs from bind by at most {off:.4f}')
        for p in js['meshes'][nd['mesh']]['primitives']:
            at = p['attributes']
            P = accessor(js, bin_, at['POSITION'])
            N = accessor(js, bin_, at['NORMAL']) if 'NORMAL' in at else None
            if skin:
                jn = accessor(js, bin_, at['JOINTS_0']).astype(int)
                wt = accessor(js, bin_, at['WEIGHTS_0'])
                wt = wt / np.maximum(1e-9, wt.sum(1, keepdims=True))
                M = np.einsum('vk,vkij->vij', wt, jm[jn])
            else:
                M = np.tile(W(ni), (len(P), 1, 1))
            P4 = np.concatenate([P, np.ones((len(P), 1))], 1)
            Pn = np.einsum('vij,vj->vi', M, P4)[:, :3]
            na = {'POSITION': add(Pn.astype(np.float32), 5126, 'VEC3', 34962, True)}
            if N is not None:
                Nn = np.einsum('vij,vj->vi', M[:, :3, :3], N)
                Nn /= np.maximum(1e-9, np.linalg.norm(Nn, axis=1, keepdims=True))
                na['NORMAL'] = add(Nn.astype(np.float32), 5126, 'VEC3', 34962)
            if 'TEXCOORD_0' in at:
                na['TEXCOORD_0'] = add(accessor(js, bin_, at['TEXCOORD_0']).astype(np.float32), 5126, 'VEC2', 34962)
            q = {'attributes': na, 'mode': p.get('mode', 4)}
            if 'indices' in p:
                ix = accessor(js, bin_, p['indices']).astype(np.uint32).ravel()
                q['indices'] = add(ix, 5125, 'SCALAR', 34963)
            if 'material' in p:
                q['material'] = p['material']
            prims.append(q)

    mats = json.loads(json.dumps(js.get('materials', [])))
    if base_only:
        for m in mats:
            for k in ('normalTexture', 'occlusionTexture', 'emissiveTexture'):
                m.pop(k, None)
            m.get('pbrMetallicRoughness', {}).pop('metallicRoughnessTexture', None)
    used_tex = sorted({m['pbrMetallicRoughness']['baseColorTexture']['index'] for m in mats if 'baseColorTexture' in m.get('pbrMetallicRoughness', {})}
                      | ({k['index'] for m in mats for k in [m.get('normalTexture'), m.get('occlusionTexture'), m.get('emissiveTexture'), m.get('pbrMetallicRoughness', {}).get('metallicRoughnessTexture')] if k} if not base_only else set()))
    tex_map, textures, images, img_map = {}, [], [], {}
    for t in used_tex:
        tx = dict(js['textures'][t]); src_i = tx['source']
        if src_i not in img_map:
            im = js['images'][src_i]
            vw = js['bufferViews'][im['bufferView']]
            data = bin_[vw.get('byteOffset', 0):vw.get('byteOffset', 0) + vw['byteLength']]
            while len(out_bin) % 4:
                out_bin += b'\0'
            views.append({'buffer': 0, 'byteOffset': len(out_bin), 'byteLength': len(data)}); out_bin += data
            images.append({'bufferView': len(views) - 1, 'mimeType': im.get('mimeType', 'image/png')})
            img_map[src_i] = len(images) - 1
        tx['source'] = img_map[src_i]
        textures.append(tx); tex_map[t] = len(textures) - 1
    for m in mats:
        for holder in (m, m.get('pbrMetallicRoughness', {})):
            for k, v in list(holder.items()):
                if k.endswith('Texture') and isinstance(v, dict) and 'index' in v:
                    v['index'] = tex_map[v['index']]
    out = {'asset': {'version': '2.0', 'generator': 'stratakin strip_skin.py'}, 'scene': 0, 'scenes': [{'nodes': [0]}],
           'nodes': [{'name': 'mesh', 'mesh': 0}], 'meshes': [{'primitives': prims}], 'materials': mats,
           'textures': textures, 'images': images, 'samplers': js.get('samplers', [{}]) or [{}],
           'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(out_bin)}]}
    for t in out['textures']:
        if 'sampler' in t and t['sampler'] >= len(out['samplers']):
            t.pop('sampler')
    jb = json.dumps(out, separators=(',', ':')).encode()
    while len(jb) % 4:
        jb += b' '
    while len(out_bin) % 4:
        out_bin += b'\0'
    total = 12 + 8 + len(jb) + 8 + len(out_bin)
    with open(dst, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(jb), 0x4E4F534A)); f.write(jb)
        f.write(struct.pack('<II', len(out_bin), 0x004E4942)); f.write(bytes(out_bin))
    ys = np.concatenate([accessor(out, bytes(out_bin), q['attributes']['POSITION']) for q in prims])
    print(f'{dst}: {sum(accs[q["indices"]]["count"] // 3 for q in prims if "indices" in q)} tris, height {ys[:, 1].max() - ys[:, 1].min():.3f}, {len(images)} images, {total / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
