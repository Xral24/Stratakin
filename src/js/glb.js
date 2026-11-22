/* GLB: binary glTF models (what Higgsfield makes) read into the game.
   A model becomes one entity mesh: positions, normals, texture coordinates, its base colour texture, and when it has a skeleton,
   up to fourteen bone groups the entity shader moves (each vertex follows its two strongest groups, blended). A skeleton with more
   joints than that is folded: the joints that carry the most of the mesh keep a group of their own, the rest ride with their nearest kept
   ancestor (fingers with the hand, toes with the foot). Poses come from the file's own animation clips; without a clip the model stands
   in its rest pose. Everything is normalised to stand on y = 0, centred, at the height asked for, facing +z like every entity. */
const GLB = (() => {
  const registry = new Map(), pending = new Map();
  const CT = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
  const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
  const NORM = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 };
  const MAXG = 14;
  // ---- small column-major 4x4 helpers ----
  const I4 = () => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; };
  function mul(a, b, o) { o = o || new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; }
  function compose(t, q, s, o) { o = o || new Float32Array(16); const [x, y, z, w] = q, x2 = x + x, y2 = y + y, z2 = z + z, xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
    o[0] = (1 - (yy + zz)) * s[0]; o[1] = (xy + wz) * s[0]; o[2] = (xz - wy) * s[0]; o[3] = 0; o[4] = (xy - wz) * s[1]; o[5] = (1 - (xx + zz)) * s[1]; o[6] = (yz + wx) * s[1]; o[7] = 0;
    o[8] = (xz + wy) * s[2]; o[9] = (yz - wx) * s[2]; o[10] = (1 - (xx + yy)) * s[2]; o[11] = 0; o[12] = t[0]; o[13] = t[1]; o[14] = t[2]; o[15] = 1; return o; }
  function slerp(a, b, t, o) { let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3], s = 1; if (d < 0) { d = -d; s = -1; } let k0, k1; if (d > 0.9995) { k0 = 1 - t; k1 = t * s; } else { const th = Math.acos(d), sn = Math.sin(th); k0 = Math.sin((1 - t) * th) / sn; k1 = Math.sin(t * th) / sn * s; }
    for (let i = 0; i < 4; i++) o[i] = a[i] * k0 + b[i] * k1; const l = Math.hypot(o[0], o[1], o[2], o[3]) || 1; for (let i = 0; i < 4; i++) o[i] /= l; return o; }
  const xf = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
  const xn = (m, x, y, z) => { const a = m[0] * x + m[4] * y + m[8] * z, b = m[1] * x + m[5] * y + m[9] * z, c = m[2] * x + m[6] * y + m[10] * z, l = Math.hypot(a, b, c) || 1; return [a / l, b / l, c / l]; };

  // ---- reading the file ----
  function parse(buf) {
    const dv = new DataView(buf); if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('not a GLB file');
    const len = Math.min(dv.getUint32(8, true), buf.byteLength); let off = 12, json = null, bin = null;
    while (off + 8 <= len) { const cl = dv.getUint32(off, true), ct = dv.getUint32(off + 4, true), st = off + 8;
      if (ct === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, st, cl))); else if (ct === 0x004E4942) bin = new Uint8Array(buf, st, cl);
      off = st + cl + ((4 - cl % 4) % 4); }
    if (!json) throw new Error('GLB without JSON');
    const view = (i) => { const v = json.bufferViews[i]; return { d: new DataView(bin.buffer, bin.byteOffset + (v.byteOffset || 0), v.byteLength), stride: v.byteStride || 0, bytes: () => new Uint8Array(bin.buffer, bin.byteOffset + (v.byteOffset || 0), v.byteLength).slice() }; };
    const acc = (i, asInt) => { const a = json.accessors[i], n = NC[a.type], count = a.count, ct = a.componentType, size = CT[ct], out = asInt ? new Uint32Array(count * n) : new Float32Array(count * n);
      if (a.bufferView == null) return out;
      const { d, stride } = view(a.bufferView), base = a.byteOffset || 0, st = stride || size * n, k = a.normalized && !asInt ? 1 / NORM[ct] : 1;
      const rd = ct === 5126 ? (o) => d.getFloat32(o, true) : ct === 5125 ? (o) => d.getUint32(o, true) : ct === 5123 ? (o) => d.getUint16(o, true) : ct === 5122 ? (o) => d.getInt16(o, true) : ct === 5121 ? (o) => d.getUint8(o) : (o) => d.getInt8(o);
      for (let v = 0; v < count; v++) for (let c = 0; c < n; c++) out[v * n + c] = rd(base + v * st + c * size) * k;
      return out; };
    // the node tree, its rest transforms and its world matrices at rest
    const nodes = (json.nodes || []).map((nd, i) => ({ i, name: nd.name || 'node' + i, kids: nd.children || [], parent: -1, mesh: nd.mesh, skin: nd.skin,
      t: nd.translation ? nd.translation.slice() : [0, 0, 0], r: nd.rotation ? nd.rotation.slice() : [0, 0, 0, 1], s: nd.scale ? nd.scale.slice() : [1, 1, 1], m: nd.matrix ? Float32Array.from(nd.matrix) : null }));
    for (const nd of nodes) for (const c of nd.kids) if (nodes[c]) nodes[c].parent = nd.i;
    const order = []; { const seen = new Set(), walk = (i) => { if (seen.has(i)) return; seen.add(i); order.push(i); for (const c of nodes[i].kids) walk(c); }; for (const nd of nodes) if (nd.parent < 0) walk(nd.i); }
    const restWorld = new Array(nodes.length); for (const i of order) { const nd = nodes[i], L = nd.m || compose(nd.t, nd.r, nd.s); restWorld[i] = nd.parent < 0 ? L : mul(restWorld[nd.parent], L); }
    // the skin (one per model; a second skin's mesh is drawn rigid)
    const skinIdx = nodes.find(n => n.mesh != null && n.skin != null) ? nodes.find(n => n.mesh != null && n.skin != null).skin : null;
    let skin = null; if (skinIdx != null && json.skins && json.skins[skinIdx]) { const sk = json.skins[skinIdx], J = sk.joints, ibm = sk.inverseBindMatrices != null ? acc(sk.inverseBindMatrices) : null;
      skin = { joints: J, ibm: J.map((_, k) => ibm ? ibm.slice(k * 16, k * 16 + 16) : I4()) }; }
    // the meshes, merged into one
    const P = [], N = [], T = [], C = [], JW = [], IX = []; let texImg = null, hasNormals = true;
    for (const nd of nodes) { if (nd.mesh == null || !json.meshes[nd.mesh]) continue; const skinned = skin && nd.skin === skinIdx, W = restWorld[nd.i];
      for (const pr of json.meshes[nd.mesh].primitives) { if (pr.mode != null && pr.mode !== 4) continue; const at = pr.attributes; if (at.POSITION == null) continue;
        const pos = acc(at.POSITION), nrm = at.NORMAL != null ? acc(at.NORMAL) : null, uv = at.TEXCOORD_0 != null ? acc(at.TEXCOORD_0) : null, jn = skinned && at.JOINTS_0 != null ? acc(at.JOINTS_0, true) : null, wt = skinned && at.WEIGHTS_0 != null ? acc(at.WEIGHTS_0) : null;
        if (!nrm) hasNormals = false;
        const mat = json.materials && pr.material != null ? json.materials[pr.material] : null, pbr = (mat && mat.pbrMetallicRoughness) || {}, bcf = pbr.baseColorFactor || [1, 1, 1, 1];
        let useTex = false; if (pbr.baseColorTexture && json.textures) { const src = json.textures[pbr.baseColorTexture.index].source; if (texImg == null) texImg = src; useTex = src === texImg && !!uv; }
        const v0 = P.length / 3, nv = pos.length / 3;
        for (let v = 0; v < nv; v++) {
          const p = skinned ? [pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]] : xf(W, pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); P.push(p[0], p[1], p[2]);
          const n = nrm ? (skinned ? [nrm[v * 3], nrm[v * 3 + 1], nrm[v * 3 + 2]] : xn(W, nrm[v * 3], nrm[v * 3 + 1], nrm[v * 3 + 2])) : [0, 1, 0]; N.push(n[0], n[1], n[2]);
          if (useTex) T.push(uv[v * 2], uv[v * 2 + 1]); else T.push(-1, -1); /* a part with no texture keeps its own flat colour */
          C.push(Math.min(255, bcf[0] * 255) | 0, Math.min(255, bcf[1] * 255) | 0, Math.min(255, bcf[2] * 255) | 0, 250);
          if (jn && wt) JW.push(jn[v * 4], jn[v * 4 + 1], jn[v * 4 + 2], jn[v * 4 + 3], wt[v * 4], wt[v * 4 + 1], wt[v * 4 + 2], wt[v * 4 + 3]); else JW.push(-1, 0, 0, 0, 0, 0, 0, 0);
        }
        if (pr.indices != null) { const ix = acc(pr.indices, true); for (let k = 0; k < ix.length; k++) IX.push(ix[k] + v0); } else for (let k = 0; k < nv; k++) IX.push(v0 + k);
      } }
    if (!P.length) throw new Error('GLB has no triangles');
    if (!hasNormals) { // smooth normals from the triangles
      const n = new Float32Array(P.length); for (let k = 0; k < IX.length; k += 3) { const a = IX[k] * 3, b = IX[k + 1] * 3, c = IX[k + 2] * 3, ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2], fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx; for (const o of [a, b, c]) { n[o] += fx; n[o + 1] += fy; n[o + 2] += fz; } }
      for (let k = 0; k < n.length; k += 3) { const l = Math.hypot(n[k], n[k + 1], n[k + 2]) || 1; N[k] = n[k] / l; N[k + 1] = n[k + 1] / l; N[k + 2] = n[k + 2] / l; } }
    // the texture's bytes, if it is inside the file
    let image = null; if (texImg != null && json.images && json.images[texImg]) { const im = json.images[texImg];
      if (im.bufferView != null) image = { bytes: view(im.bufferView).bytes(), mime: im.mimeType || 'image/png' };
      else if (im.uri && im.uri.startsWith('data:')) { const b64 = im.uri.slice(im.uri.indexOf(',') + 1), raw = atob(b64), u8 = new Uint8Array(raw.length); for (let k = 0; k < raw.length; k++) u8[k] = raw.charCodeAt(k); image = { bytes: u8, mime: im.uri.slice(5, im.uri.indexOf(';')) }; } }
    // the clips
    const anims = (json.animations || []).map((a, k) => { const ch = (a.channels || []).filter(c => c.target && c.target.node != null && c.target.path !== 'weights').map(c => { const s = a.samplers[c.sampler]; return { node: c.target.node, path: c.target.path, times: acc(s.input), vals: acc(s.output), interp: s.interpolation || 'LINEAR' }; });
      let dur = 0; for (const c of ch) dur = Math.max(dur, c.times[c.times.length - 1] || 0); return { name: a.name || 'clip' + k, ch, dur: dur || 1 }; });
    return { nodes, order, restWorld, skin, P: Float32Array.from(P), N: Float32Array.from(N), T: Float32Array.from(T), C: Uint8Array.from(C), JW, IX: Uint32Array.from(IX), image, anims };
  }

  // ---- folding the skeleton into the shader's fourteen groups ----
  function groups(g) {
    const nv = g.P.length / 3, bone = new Float32Array(nv), bone2 = new Float32Array(nv * 2);
    if (!g.skin) return { bone, bone2, keep: [], map: [] };
    const J = g.skin.joints, jset = new Map(J.map((n, k) => [n, k])), imp = new Float64Array(J.length);
    for (let v = 0; v < nv; v++) for (let k = 0; k < 4; k++) { const j = g.JW[v * 8 + k], w = g.JW[v * 8 + 4 + k]; if (j >= 0 && j < J.length) imp[j] += w; }
    const isRoot = (k) => { let p = g.nodes[J[k]].parent; while (p >= 0) { if (jset.has(p)) return false; p = g.nodes[p].parent; } return true; };
    const keep = []; const root = J.findIndex((_, k) => isRoot(k)); if (root >= 0) keep.push(root);
    const byImp = J.map((_, k) => k).filter(k => k !== root).sort((a, b) => imp[b] - imp[a]); for (const k of byImp) { if (keep.length >= MAXG) break; if (imp[k] > 0) keep.push(k); }
    const slot = new Map(keep.map((k, s) => [k, s])), map = J.map((_, k) => { let n = J[k]; while (n >= 0) { const jk = jset.get(n); if (jk != null && slot.has(jk)) return slot.get(jk); n = g.nodes[n].parent; } return 0; });
    for (let v = 0; v < nv; v++) { const acc2 = new Map(); for (let k = 0; k < 4; k++) { const j = g.JW[v * 8 + k], w = g.JW[v * 8 + 4 + k]; if (j < 0 || w <= 0 || j >= J.length) continue; const s = map[j]; acc2.set(s, (acc2.get(s) || 0) + w); }
      const best = [...acc2.entries()].sort((a, b) => b[1] - a[1]); if (!best.length) continue; bone[v] = best[0][0];
      if (best.length > 1) { const w1 = best[0][1], w2 = best[1][1]; bone2[v * 2] = best[1][0]; bone2[v * 2 + 1] = w2 / (w1 + w2); } }
    return { bone, bone2, keep, map };
  }

  // ---- posing: local transforms from a clip at time t, world matrices down the tree, then each group's skinning matrix ----
  function sample(ch, t, out) { const T = ch.times, n = T.length, w = ch.path === 'rotation' ? 4 : 3, cub = ch.interp === 'CUBICSPLINE', at = (k) => cub ? (k * 3 + 1) * w : k * w;
    if (t <= T[0] || n === 1) { for (let c = 0; c < w; c++) out[c] = ch.vals[at(0) + c]; return out; } if (t >= T[n - 1]) { for (let c = 0; c < w; c++) out[c] = ch.vals[at(n - 1) + c]; return out; }
    let k = 0; while (k < n - 2 && T[k + 1] <= t) k++; const u = (t - T[k]) / (T[k + 1] - T[k] || 1), a = [], b = []; for (let c = 0; c < w; c++) { a[c] = ch.vals[at(k) + c]; b[c] = ch.vals[at(k + 1) + c]; }
    if (ch.interp === 'STEP') { for (let c = 0; c < w; c++) out[c] = a[c]; return out; } if (w === 4) return slerp(a, b, u, out); for (let c = 0; c < w; c++) out[c] = a[c] + (b[c] - a[c]) * u; return out; }
  function posed(model, clip, t, nod) {
    const g = model.g, nodes = g.nodes, T = model._T || (model._T = nodes.map(n => n.t.slice())), R = model._R || (model._R = nodes.map(n => n.r.slice())), S = model._S || (model._S = nodes.map(n => n.s.slice()));
    for (let i = 0; i < nodes.length; i++) { const n = nodes[i]; T[i][0] = n.t[0]; T[i][1] = n.t[1]; T[i][2] = n.t[2]; R[i][0] = n.r[0]; R[i][1] = n.r[1]; R[i][2] = n.r[2]; R[i][3] = n.r[3]; S[i][0] = n.s[0]; S[i][1] = n.s[1]; S[i][2] = n.s[2]; }
    if (clip) { const tt = clip.dur > 0 ? t % clip.dur : 0; for (const ch of clip.ch) sample(ch, tt, ch.path === 'translation' ? T[ch.node] : ch.path === 'rotation' ? R[ch.node] : S[ch.node]); }
    if (!clip && model.spine && model.spine.length) { const tt = t * 1.0, a = Math.sin(tt * 1.7) * 0.022, b = Math.sin(tt * 0.9 + 1.3) * 0.016; /* standing, breathing: the spine leans a touch forward and back and side to side */
      for (const j of model.spine) { const q = R[j], sx = Math.sin(a / model.spine.length), cx = Math.cos(a / model.spine.length), sz = Math.sin(b / model.spine.length), cz = Math.cos(b / model.spine.length);
        let x = q[0], y = q[1], z = q[2], w = q[3]; [x, y, z, w] = [w * sx + x * cx, y * cx + z * sx, z * cx - y * sx, w * cx - x * sx]; R[j] = [x * cz + y * sz, y * cz - x * sz, w * sz + z * cz, w * cz - z * sz]; } }
    if (nod && model.head != null) { const q = R[model.head], a = nod * 0.5, sx = Math.sin(a), cx = Math.cos(a), x = q[0], y = q[1], z = q[2], w = q[3]; R[model.head] = [w * sx + x * cx, y * cx + z * sx, z * cx - y * sx, w * cx - x * sx]; } /* a nod on top of whatever the clip is doing */
    const Wm = model._W || (model._W = nodes.map(() => new Float32Array(16))), L = model._L || (model._L = new Float32Array(16));
    for (const i of g.order) { const n = nodes[i]; if (n.m) L.set(n.m); else compose(T[i], R[i], S[i], L); if (n.parent < 0) Wm[i].set(L); else mul(Wm[n.parent], L, Wm[i]); }
    return Wm; }
  function pose(e, now) {
    const st = e.glb, model = st && registry.get(st.name); if (!model) return null;
    const mats = st._mats || (st._mats = new Float32Array(16 * MAXG)), out = st._out || (st._out = { mats, sway: [0, 0, 0, 0] });
    const g = model.g; if (!g.skin) { mats.set(model.Nm, 0); return out; }
    const clip = pickClip(model, st), t = st.at != null ? st.at : ((now - (st.t0 || 0)) / 1000) * (st.speed || 1); /* at: hold the clip at one moment (a film, a photograph) */
    const Wm = posed(model, clip, t, st.nod ? Math.sin(now / 95) * 0.08 * st.nod : 0), tmp = model._tmp || (model._tmp = new Float32Array(16));
    for (let s = 0; s < model.grp.keep.length; s++) { const k = model.grp.keep[s]; mul(Wm[g.skin.joints[k]], g.skin.ibm[k], tmp); mul(model.Nm, tmp, model._tmp2 || (model._tmp2 = new Float32Array(16))); mats.set(model._tmp2, s * 16); }
    return out; }
  function pickClip(model, st) { const A = model.g.anims; if (!A.length || st.clip === false) return null; const want = st.clip; /* clip false: the rest pose */ if (want == null) return A[0]; if (typeof want === 'number') return A[want] || A[0];
    const w = String(want).toLowerCase(); return A.find(a => a.name.toLowerCase().includes(w)) || A[0]; }

  // ---- building and registering a model ----
  function build(name, buf, opts = {}) {
    const g = parse(buf), grp = groups(g), nv = g.P.length / 3;
    // where it stands at rest, through its own skeleton, so it can be set on y = 0 at the height asked for
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9; const restM = g.skin ? grp.keep.map(k => mul(g.restWorld[g.skin.joints[k]], g.skin.ibm[k])) : null;
    for (let v = 0; v < nv; v++) { let p = [g.P[v * 3], g.P[v * 3 + 1], g.P[v * 3 + 2]]; if (restM && restM[grp.bone[v]]) p = xf(restM[grp.bone[v]], p[0], p[1], p[2]); if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; if (p[2] < z0) z0 = p[2]; if (p[2] > z1) z1 = p[2]; }
    const H = Math.max(1e-4, y1 - y0), s = (opts.height || H) / H, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, turn = opts.turn || 0, cs = Math.cos(turn), sn = Math.sin(turn);
    const Nm = new Float32Array([cs * s, 0, -sn * s, 0, 0, s, 0, 0, sn * s, 0, cs * s, 0, 0, 0, 0, 1]); const off = xf(Nm, -cx, -y0, -cz); Nm[12] = off[0]; Nm[13] = off[1]; Nm[14] = off[2];
    const rad = Math.hypot((x1 - x0) / 2, y1 - y0, (z1 - z0) / 2) * s;
    const mesh = R.glbUpload({ P: g.P, N: g.N, T: g.T, C: g.C, bone: grp.bone, bone2: grp.bone2, IX: g.IX, image: g.image, maxTex: opts.maxTex || (G.mobile ? 1024 : 2048) }); if (mesh) mesh.rad = rad;
    let head = null; if (g.skin) { const hk = g.skin.joints.find(n => /head/i.test(g.nodes[n].name) && !/top|end|nub/i.test(g.nodes[n].name)); head = hk == null ? null : hk; }
    const spine = g.skin ? g.skin.joints.filter(n => /spine|chest/i.test(g.nodes[n].name)) : [];
    const model = { name, g, grp, Nm, mesh, height: (y1 - y0) * s, head, spine, clips: g.anims.map(a => a.name), tris: g.IX.length / 3 };
    registry.set(name, model); return model; }
  function fromBuffer(name, buf, opts) { try { return build(name, buf, opts); } catch (err) { console.warn('GLB ' + name + ': ' + err.message); return null; } }
  function load(name, url, opts) { if (registry.has(name)) return Promise.resolve(registry.get(name)); if (pending.has(name)) return pending.get(name);
    const p = fetch(url).then(r => { if (!r.ok) throw new Error(r.status + ' ' + url); return r.arrayBuffer(); }).then(b => fromBuffer(name, b, opts)).catch(err => { console.warn('GLB ' + name + ' not loaded: ' + err.message); return null; });
    pending.set(name, p); return p; }
  function get(name) { return registry.get(name) || null; }
  /* dress an entity in a loaded model: it keeps its own model data (height, radius) for everything else, only its look changes */
  function dress(e, name, st = {}) { const m = registry.get(name); if (!m || !m.mesh) return false; e.glb = Object.assign(e.glb && e.glb.name === name ? e.glb : { name, t0: performance.now() }, st); return true; }
  /* the cast: who wears a model from a file, and where the file is. A name here with no file yet is ignored, so nothing is fetched that is not
     shipped. Each figure is dressed by its name as it is drawn; its own box model stays for portraits, collisions and everything else */
  const CAST = {
    finch: { names: ['Professor Finch', 'Professor Aldous Finch'], file: 'assets/finch.glb', height: 1.95, turn: -Math.PI / 2, clip: false }, /* Tripo made him facing +x; his rig's idle clip was fitted sideways, so he breathes in code instead */
  };
  const byName = new Map(); for (const [k, c] of Object.entries(CAST)) for (const n of c.names) byName.set(n, k);
  let booted = false;
  /* where a file is served: beside the page (GitHub Pages, the installed app), or at its asset address where the page is hosted as an artifact (the build writes that map) */
  const where = (file) => (typeof window !== 'undefined' && window.STRATAKIN_ASSETS && window.STRATAKIN_ASSETS[file]) || file;
  function boot() { if (booted) return; booted = true; for (const [k, c] of Object.entries(CAST)) if (c.file) load(k, where(c.file), { height: c.height, turn: c.turn || 0 }); }
  function dressAll(ents) { if (!booted) boot(); if (!registry.size) return;
    for (const e of ents) { if (!e) continue; const o = e.src || e, k = byName.get(o.name || e.name); if (!k || !registry.has(k)) continue;
      const st = o._glb || (o._glb = { name: k, t0: performance.now() - Math.random() * 5000, clip: CAST[k].clip }); st.nod = (o.talkOpen || 0) > 0.05 ? 1 : 0; /* talking: the head nods along with the words */ e.glb = st; } }
  const meshFor = (e) => { const m = e.glb && registry.get(e.glb.name); return m && m.mesh ? m.mesh : e.mesh; };
  return { parse, fromBuffer, load, get, dress, pose, dressAll, meshFor, CAST, get list() { return [...registry.keys()]; } };
})();
