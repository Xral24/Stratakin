#!/usr/bin/env python3
"""Look at a GLB from several sides without a game: a contact sheet of orthographic views.

usage: inspect_glb.py out.jpg model.glb [model2.glb ...]

Each model gets one row: front (looking down -z at its +z side), right, back, left, and from above.
Surfaces are drawn by splatting dense samples into a depth buffer, coloured from the base colour texture
when there is one, lit from the camera side so the shape reads. Good enough to catch an extra arm,
a backwards face or a prop fused into a leg before credits go on rigging it.
"""
import io, json, math, struct, sys

import numpy as np
from PIL import Image, ImageDraw

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def load(path):
    b = open(path, 'rb').read()
    magic, ver, total = struct.unpack_from('<III', b, 0)
    assert magic == 0x46546C67, 'not a GLB'
    o, js, bin_ = 12, None, b''
    while o < total:
        ln, ty = struct.unpack_from('<II', b, o)
        chunk = b[o + 8:o + 8 + ln]
        if ty == 0x4E4F534A:
            js = json.loads(chunk)
        elif ty == 0x004E4942:
            bin_ = chunk
        o += 8 + ln
    return js, bin_


def accessor(js, bin_, i):
    a = js['accessors'][i]
    bv = js['bufferViews'][a['bufferView']]
    dt, n = CT[a['componentType']], NC[a['type']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = bv.get('byteStride', 0)
    item = np.dtype(dt).itemsize * n
    if stride and stride != item:
        raw = np.frombuffer(bin_, np.uint8, count=stride * (a['count'] - 1) + item, offset=off)
        rows = np.lib.stride_tricks.as_strided(raw, (a['count'], item), (stride, 1))
        arr = np.frombuffer(rows.copy().tobytes(), dt).reshape(a['count'], n)
    else:
        arr = np.frombuffer(bin_, dt, count=a['count'] * n, offset=off).reshape(a['count'], n)
    arr = arr.astype(np.float64)
    if a.get('normalized'):
        arr = arr / float(np.iinfo(dt).max)
    return arr


def qmat(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def local(n):
    if 'matrix' in n:
        return np.array(n['matrix'], float).reshape(4, 4).T
    m = np.eye(4)
    m[:3, :3] = qmat(n.get('rotation', [0, 0, 0, 1])) @ np.diag(n.get('scale', [1, 1, 1]))
    m[:3, 3] = n.get('translation', [0, 0, 0])
    return m


def geometry(js, bin_):
    """every mesh primitive in world space (rest pose: skins are ignored, the bind pose is what the file stores)"""
    nodes = js.get('nodes', [])
    parent = {}
    for i, n in enumerate(nodes):
        for c in n.get('children', []):
            parent[c] = i

    def world(i):
        m = local(nodes[i])
        while i in parent:
            i = parent[i]
            m = local(nodes[i]) @ m
        return m

    tex_img = None
    P, UV, IX, base = [], [], [], 0
    for ni, n in enumerate(nodes):
        if 'mesh' not in n:
            continue
        W = np.eye(4) if 'skin' in n else world(ni)
        for pr in js['meshes'][n['mesh']]['primitives']:
            at = pr['attributes']
            p = accessor(js, bin_, at['POSITION'])
            p = (np.c_[p, np.ones(len(p))] @ W.T)[:, :3]
            uv = accessor(js, bin_, at['TEXCOORD_0']) if 'TEXCOORD_0' in at else np.full((len(p), 2), -1.0)
            ix = accessor(js, bin_, pr['indices']).astype(np.int64).ravel() if 'indices' in pr else np.arange(len(p))
            P.append(p); UV.append(uv); IX.append(ix + base); base += len(p)
            if tex_img is None and 'material' in pr:
                mat = js['materials'][pr['material']]
                t = mat.get('pbrMetallicRoughness', {}).get('baseColorTexture')
                if t is not None:
                    img = js['images'][js['textures'][t['index']]['source']]
                    bv = js['bufferViews'][img['bufferView']]
                    data = bin_[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
                    tex_img = Image.open(io.BytesIO(data)).convert('RGB')
    return np.concatenate(P), np.concatenate(UV), np.concatenate(IX).reshape(-1, 3), tex_img


VIEWS = [('front', 0.0), ('right', math.pi / 2), ('back', math.pi), ('left', -math.pi / 2), ('top', None)]


def render(P, UV, F, tex, view, size, box):
    """orthographic, the model's up is +y; 'front' looks at the +z face"""
    name, yaw = view
    if yaw is None:  # from above, the front of the model at the bottom of the picture
        R = np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]], float)
    else:
        c, s = math.cos(yaw), math.sin(yaw)
        R = np.array([[c, 0, -s], [0, 1, 0], [s, 0, c]], float)
    Q = P @ R.T  # x right, y up, z towards the viewer
    lo, hi, span = box
    sc = (size * 0.9) / span
    X = (Q[:, 0] - (lo[0] + hi[0]) / 2) * sc + size / 2
    Y = size / 2 - (Q[:, 1] - (lo[1] + hi[1]) / 2) * sc
    Z = Q[:, 2]
    a, b, c3 = F[:, 0], F[:, 1], F[:, 2]
    e1 = np.c_[X[b] - X[a], Y[b] - Y[a]]
    e2 = np.c_[X[c3] - X[a], Y[c3] - Y[a]]
    area = np.abs(e1[:, 0] * e2[:, 1] - e1[:, 1] * e2[:, 0]) / 2
    nrm = np.cross(Q[b] - Q[a], Q[c3] - Q[a])
    ln = np.linalg.norm(nrm, axis=1) + 1e-12
    shade = 0.35 + 0.65 * np.abs(nrm[:, 2]) / ln
    k = np.clip(np.ceil(area * 2.2), 1, 4000).astype(np.int64)
    tri = np.repeat(np.arange(len(F)), k)
    rng = np.random.default_rng(1)
    u, v = rng.random(len(tri)), rng.random(len(tri))
    flip = u + v > 1
    u[flip], v[flip] = 1 - u[flip], 1 - v[flip]
    w = 1 - u - v
    ia, ib, ic = a[tri], b[tri], c3[tri]
    sx = (X[ia] * w + X[ib] * u + X[ic] * v).astype(np.int64)
    sy = (Y[ia] * w + Y[ib] * u + Y[ic] * v).astype(np.int64)
    sz = Z[ia] * w + Z[ib] * u + Z[ic] * v
    ok = (sx >= 0) & (sx < size) & (sy >= 0) & (sy < size)
    sx, sy, sz, tri, u, v, w, ia, ib, ic = sx[ok], sy[ok], sz[ok], tri[ok], u[ok], v[ok], w[ok], ia[ok], ib[ok], ic[ok]
    pix = sy * size + sx
    order = np.lexsort((-sz, pix))  # per pixel, nearest first
    pix, first = np.unique(pix[order], return_index=True)
    sel = order[first]
    if tex is not None:
        T = np.asarray(tex, dtype=np.float64)
        th, tw = T.shape[:2]
        uu = UV[ia[sel], 0] * w[sel] + UV[ib[sel], 0] * u[sel] + UV[ic[sel], 0] * v[sel]
        vv = UV[ia[sel], 1] * w[sel] + UV[ib[sel], 1] * u[sel] + UV[ic[sel], 1] * v[sel]
        tx = np.clip((uu % 1.0) * tw, 0, tw - 1).astype(np.int64)
        ty = np.clip((vv % 1.0) * th, 0, th - 1).astype(np.int64)
        col = T[ty, tx]
        col[uu < -0.5] = 180
    else:
        col = np.full((len(sel), 3), 200.0)
    col = col * (0.55 + 0.45 * shade[tri[sel]])[:, None]
    img = np.full((size * size, 3), 236.0)
    img[pix] = col
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8).reshape(size, size, 3))


def main():
    out, paths = sys.argv[1], sys.argv[2:]
    size = 360
    rows = []
    for p in paths:
        js, bin_ = load(p)
        P, UV, F, tex = geometry(js, bin_)
        lo, hi = P.min(0), P.max(0)
        span = max(hi - lo) or 1
        # every view uses the same scale, centred on the box seen from that side
        cells = []
        for view in VIEWS:
            name, yaw = view
            if yaw is None:
                R = np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]], float)
            else:
                c, s = math.cos(yaw), math.sin(yaw)
                R = np.array([[c, 0, -s], [0, 1, 0], [s, 0, c]], float)
            Q = P @ R.T
            cells.append(render(P, UV, F, tex, view, size, (Q.min(0), Q.max(0), span)))
        info = '%s  %d tris  box %.2f x %.2f x %.2f (x,y,z)  tex %s' % (p.split('/')[-1], len(F), *(hi - lo), tex.size if tex else None)
        print(info)
        row = Image.new('RGB', (size * len(VIEWS), size + 22), 'white')
        for i, c in enumerate(cells):
            row.paste(c, (i * size, 22))
        d = ImageDraw.Draw(row)
        d.text((6, 4), info + '   views: ' + ' / '.join(v[0] for v in VIEWS), fill=(0, 0, 0))
        rows.append(row)
    sheet = Image.new('RGB', (rows[0].width, sum(r.height for r in rows)), 'white')
    y = 0
    for r in rows:
        sheet.paste(r, (0, y)); y += r.height
    sheet.save(out, quality=86)


if __name__ == '__main__':
    main()
