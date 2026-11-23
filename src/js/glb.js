/* GLB: binary glTF models (what Higgsfield makes) read into the game.
   A model becomes one entity mesh: positions, normals, texture coordinates, its base colour texture, and when it has a skeleton,
   up to fourteen bone groups the entity shader moves (each vertex follows its two strongest groups, blended). A skeleton with more
   joints than that is folded: the joints that carry the most of the mesh keep a group of their own, the rest ride with their nearest kept
   ancestor (fingers with the hand, toes with the foot). Poses come from the file's own animation clips; without a clip the model stands
   in its rest pose. Everything is normalised to stand on y = 0, centred, at the height asked for, facing +z like every entity. */
const GLB = (() => {
  const registry = new Map(), pending = new Map(), failed = new Set();
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
  const qmul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
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
    const hum = humanoid(g), keep = hum ? hum.slice() : []; if (!keep.length) { const root = J.findIndex((_, k) => isRoot(k)); if (root >= 0) keep.push(root);
      const byImp = J.map((_, k) => k).filter(k => k !== root).sort((a, b) => imp[b] - imp[a]); for (const k of byImp) { if (keep.length >= MAXG) break; if (imp[k] > 0) keep.push(k); } }
    const slot = new Map(keep.map((k, s) => [k, s])), map = J.map((_, k) => { let n = J[k]; while (n >= 0) { const jk = jset.get(n); if (jk != null && slot.has(jk)) return slot.get(jk); n = g.nodes[n].parent; } return 0; });
    for (let v = 0; v < nv; v++) { const acc2 = new Map(); for (let k = 0; k < 4; k++) { const j = g.JW[v * 8 + k], w = g.JW[v * 8 + 4 + k]; if (j < 0 || w <= 0 || j >= J.length) continue; const s = map[j]; acc2.set(s, (acc2.get(s) || 0) + w); }
      const best = [...acc2.entries()].sort((a, b) => b[1] - a[1]); if (!best.length) continue; bone[v] = best[0][0];
      if (best.length > 1) { const w1 = best[0][1], w2 = best[1][1]; bone2[v * 2] = best[1][0]; bone2[v * 2 + 1] = w2 / (w1 + w2); } }
    return { bone, bone2, keep, map, chest: hum ? J[hum[1]] : null };
  }

  /* a figure on two legs keeps what a walk needs: hips, chest, head, both arms to the forearm, both legs to the foot, and the middle of the back.
     Hands ride with the forearm (and whatever they hold), shoulders with the chest, the neck with the chest, toes with the foot.
     Picked by name, as the riggers name them (Hips, LeftUpLeg, LeftForeArm...); anything else is folded by weight instead */
  function humanoid(g) {
    const J = g.skin.joints, nm = J.map(n => g.nodes[n].name.replace(/^.*:/, '')), find = (re) => nm.findIndex(n => re.test(n));
    const hips = find(/^(hips|pelvis)$/i), head = find(/^head$/i);
    const limbs = [/^left_?arm$|^leftupperarm$/i, /^left_?fore_?arm$|^leftlowerarm$/i, /^right_?arm$|^rightupperarm$/i, /^right_?fore_?arm$|^rightlowerarm$/i,
      /^left_?up_?leg$|^leftupperleg$|^leftthigh$/i, /^left_?leg$|^leftlowerleg$|^leftcalf$/i, /^left_?foot$/i, /^right_?up_?leg$|^rightupperleg$|^rightthigh$/i, /^right_?leg$|^rightlowerleg$|^rightcalf$/i, /^right_?foot$/i].map(find);
    if (hips < 0 || head < 0 || limbs.some(k => k < 0)) return null;
    const up = (n) => { const out = []; let p = g.nodes[n].parent; while (p >= 0) { out.push(p); p = g.nodes[p].parent; } return out; };
    let chain = up(J[head]).map(n => J.indexOf(n)).filter(k => k >= 0); const hi = chain.indexOf(hips); if (hi >= 0) chain = chain.slice(0, hi); /* the neck down to just above the hips */
    const chest = up(J[limbs[0]]).map(n => J.indexOf(n)).find(k => chain.includes(k)) ?? (chain[0] ?? hips), below = chain.slice(chain.indexOf(chest) + 1), mid = below.length ? below[(below.length - 1) >> 1] : null;
    return [...new Set([hips, chest, head, ...limbs, ...(mid != null ? [mid] : [])])].slice(0, MAXG); }

  // ---- posing: local transforms from up to two clips (what it does standing, and its walk laid over the top as fast as it is going),
  //      world matrices down the tree, then each group's skinning matrix ----
  function sample(ch, t, out) { const T = ch.times, n = T.length, w = ch.path === 'rotation' ? 4 : 3, cub = ch.interp === 'CUBICSPLINE', at = (k) => cub ? (k * 3 + 1) * w : k * w;
    if (t <= T[0] || n === 1) { for (let c = 0; c < w; c++) out[c] = ch.vals[at(0) + c]; return out; } if (t >= T[n - 1]) { for (let c = 0; c < w; c++) out[c] = ch.vals[at(n - 1) + c]; return out; }
    let k = 0; while (k < n - 2 && T[k + 1] <= t) k++; const u = (t - T[k]) / (T[k + 1] - T[k] || 1), a = [], b = []; for (let c = 0; c < w; c++) { a[c] = ch.vals[at(k) + c]; b[c] = ch.vals[at(k + 1) + c]; }
    if (ch.interp === 'STEP') { for (let c = 0; c < w; c++) out[c] = a[c]; return out; } if (w === 4) return slerp(a, b, u, out); for (let c = 0; c < w; c++) out[c] = a[c] + (b[c] - a[c]) * u; return out; }
  function restInto(nodes, T, R, S) { for (let i = 0; i < nodes.length; i++) { const n = nodes[i]; T[i][0] = n.t[0]; T[i][1] = n.t[1]; T[i][2] = n.t[2]; R[i][0] = n.r[0]; R[i][1] = n.r[1]; R[i][2] = n.r[2]; R[i][3] = n.r[3]; S[i][0] = n.s[0]; S[i][1] = n.s[1]; S[i][2] = n.s[2]; } }
  /* still: joints that keep their rest pose whatever the clip does (the arm that holds a key as long as he is, which no walk was made for) */
  function clipInto(clip, t, T, R, S, still) { const tt = clip.dur > 0 ? ((t % clip.dur) + clip.dur) % clip.dur : 0; for (const ch of clip.ch) { if (still && still.has(ch.node)) continue; sample(ch, tt, ch.path === 'translation' ? T[ch.node] : ch.path === 'rotation' ? R[ch.node] : S[ch.node]); } }
  /* a walk clip walks on the spot, but some carry the hips forward as well: that travel is taken out (the game moves the figure itself), the bob up and down stays */
  function pinHips(model, t) { const h = model.hips; if (!h) return; const r = h.rest, d0 = t[0] - r[0], d1 = t[1] - r[1], d2 = t[2] - r[2], A = h.A, B = h.Ai;
    const up = A[1] * d0 + A[4] * d1 + A[7] * d2; /* only how far it rose, in the file's own up */ t[0] = r[0] + B[3] * up; t[1] = r[1] + B[4] * up; t[2] = r[2] + B[5] * up; }
  function posed(model, clip, t, nod, walk, wt, ww) {
    const g = model.g, nodes = g.nodes, mk = (k, f) => model[k] || (model[k] = nodes.map(f));
    const T = mk('_T', n => n.t.slice()), R = mk('_R', n => n.r.slice()), S = mk('_S', n => n.s.slice());
    restInto(nodes, T, R, S);
    if (clip) { clipInto(clip, t, T, R, S, model.still);
      if (model.hips && model.lockYaw !== false && clip === g.anims[model.base]) { /* an idle never turns the figure round: whatever the actor did with his hips about the upright (Silas's patter is played half turned away, Varga's idle looks over his shoulder), it is taken out, so he faces where the game faces him; the twist above the hips stays */
        const h = model.hips, q = R[h.node], r0 = g.nodes[h.node].r, dq = qmul(q, [-r0[0], -r0[1], -r0[2], r0[3]]), u = h.up, pr = dq[0] * u[0] + dq[1] * u[1] + dq[2] * u[2], l = Math.hypot(pr, dq[3]) || 1;
        const nq = qmul([-u[0] * pr / l, -u[1] * pr / l, -u[2] * pr / l, dq[3] / l], q); q[0] = nq[0]; q[1] = nq[1]; q[2] = nq[2]; q[3] = nq[3]; } }
    else if (model.spine && model.spine.length) { const tt = t * 1.0, a = Math.sin(tt * 1.7) * 0.022, b = Math.sin(tt * 0.9 + 1.3) * 0.016; /* standing, breathing: the spine leans a touch forward and back and side to side */
      for (const j of model.spine) { const q = R[j], sx = Math.sin(a / model.spine.length), cx = Math.cos(a / model.spine.length), sz = Math.sin(b / model.spine.length), cz = Math.cos(b / model.spine.length);
        let x = q[0], y = q[1], z = q[2], w = q[3]; [x, y, z, w] = [w * sx + x * cx, y * cx + z * sx, z * cx - y * sx, w * cx - x * sx]; R[j] = [x * cz + y * sz, y * cz - x * sz, w * sz + z * cz, w * cz - z * sz]; } }
    if (walk && ww > 0.001) { const T2 = mk('_T2', n => n.t.slice()), R2 = mk('_R2', n => n.r.slice()), S2 = mk('_S2', n => n.s.slice()); restInto(nodes, T2, R2, S2); clipInto(walk, wt, T2, R2, S2, model.still); if (model.hips) pinHips(model, T2[model.hips.node]);
      for (let i = 0; i < nodes.length; i++) { const a = T[i], b = T2[i], c = S[i], d = S2[i]; for (let k = 0; k < 3; k++) { a[k] += (b[k] - a[k]) * ww; c[k] += (d[k] - c[k]) * ww; } slerp(R[i], R2[i], ww, R[i]); } }
    if (nod && model.head != null) { const q = R[model.head], a = nod * 0.5, sx = Math.sin(a), cx = Math.cos(a), x = q[0], y = q[1], z = q[2], w = q[3]; R[model.head] = [w * sx + x * cx, y * cx + z * sx, z * cx - y * sx, w * cx - x * sx]; } /* a nod on top of whatever the clip is doing */
    const Wm = model._W || (model._W = nodes.map(() => new Float32Array(16))), L = model._L || (model._L = new Float32Array(16));
    for (const i of g.order) { const n = nodes[i]; if (n.m) L.set(n.m); else compose(T[i], R[i], S[i], L); if (n.parent < 0) Wm[i].set(L); else mul(Wm[n.parent], L, Wm[i]); }
    return Wm; }
  /* how fast a figure is going over the ground, and the walk clip's own clock. The clip plays at its natural pace times how much faster
     or slower the figure is going than the walk was acted (v0), held between 0.55 and 1.6 of it: past that the feet slide a little
     rather than the legs whirring. Shadow and colour passes both ask in the same frame; only one of them counts */
  function motion(st, e, now, model) {
    if (st.lt == null) { st.lt = now; st.lx = e.x; st.lz = e.z; st.mv = 0; st.v = 0; st.wt = Math.random() * 3; return; }
    const ms = now - st.lt; if (ms < 10) return; st.lt = now; const dt = Math.min(0.25, ms / 1000), dx = e.x - st.lx, dz = e.z - st.lz; st.lx = e.x; st.lz = e.z;
    const d = Math.hypot(dx, dz); if (d > 2.5) return; /* carried off somewhere else at once: not a step */
    const sc = e.scale || 1; st.v += (d / dt - st.v) * Math.min(1, dt * 6);
    const want = Math.min(1, st.v / (0.45 * sc)); st.mv += (want - st.mv) * Math.min(1, dt * 6);
    if (st.mv > 0.01) st.wt += dt * Math.max(0.55, Math.min(1.6, st.v / Math.max(0.05, (model.v0 || 1) * sc))); }
  function pose(e, now) {
    const st = e.glb, model = st && registry.get(st.name); if (!model) return null;
    const mats = st._mats || (st._mats = new Float32Array(16 * MAXG)), out = st._out || (st._out = { mats, sway: [0, 0, 0, 0] });
    const g = model.g; if (!g.skin) { mats.set(model.Nm, 0); return out; }
    if (st._now === now && st._for === e) return out; st._now = now; st._for = e; /* drawn twice a frame, posed once */
    const clip = pickClip(model, st), t = st.at != null ? st.at : ((now - (st.t0 || 0)) / 1000) * (st.speed || 1); /* at: hold the clip at one moment (a film, a photograph) */
    let walk = null, wt = 0, ww = 0; if (model.walk != null && st.walk !== false && st.at == null) { motion(st, e, now, model); walk = g.anims[model.walk]; ww = st.mv || 0; wt = st.wt || 0; }
    if (st.walkAt != null) { walk = g.anims[model.walk] || null; ww = 1; wt = st.walkAt; } /* a test can hold the walk at one moment too */
    const Wm = posed(model, clip, t, st.nod ? Math.sin(now / 95) * 0.08 * st.nod : 0, walk, wt, ww), tmp = model._tmp || (model._tmp = new Float32Array(16));
    for (let s = 0; s < model.grp.keep.length; s++) { const k = model.grp.keep[s]; mul(Wm[g.skin.joints[k]], g.skin.ibm[k], tmp); mul(model.Nm, tmp, model._tmp2 || (model._tmp2 = new Float32Array(16))); mats.set(model._tmp2, s * 16); }
    return out; }
  /* which clip it plays standing: the one asked for by name or number, else its own idle; a file whose only clip is a walk stands in its rest pose and breathes */
  function pickClip(model, st) { const A = model.g.anims; if (!A.length || st.clip === false) return null; const want = st.clip, base = model.base != null ? A[model.base] : null;
    if (want == null) return base; if (typeof want === 'number') return A[want] || base;
    const w = String(want).toLowerCase(); return A.find(a => a.name.toLowerCase().includes(w)) || base; }

  // ---- building and registering a model ----
  function build(name, buf, opts = {}) {
    const g = parse(buf), grp = groups(g), nv = g.P.length / 3;
    // where it stands at rest, through its own skeleton, so it can be set on y = 0 at the height asked for
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9; const restM = g.skin ? grp.keep.map(k => mul(g.restWorld[g.skin.joints[k]], g.skin.ibm[k])) : null;
    for (let v = 0; v < nv; v++) { let p = [g.P[v * 3], g.P[v * 3 + 1], g.P[v * 3 + 2]]; if (restM && restM[grp.bone[v]]) p = xf(restM[grp.bone[v]], p[0], p[1], p[2]); if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; if (p[2] < z0) z0 = p[2]; if (p[2] > z1) z1 = p[2]; }
    const H = Math.max(1e-4, y1 - y0), s = (opts.height || H) / H, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, turn = opts.turn || 0, cs = Math.cos(turn), sn = Math.sin(turn);
    const Nm = new Float32Array([cs * s, 0, -sn * s, 0, 0, s, 0, 0, sn * s, 0, cs * s, 0, 0, 0, 0, 1]); const off = xf(Nm, -cx, -y0, -cz); Nm[12] = off[0]; Nm[13] = off[1]; Nm[14] = off[2];
    const rad = Math.hypot((x1 - x0) / 2, y1 - y0, (z1 - z0) / 2) * s;
    const mesh = R.glbUpload({ P: g.P, N: g.N, T: g.T, C: g.C, bone: grp.bone, bone2: grp.bone2, IX: g.IX, image: g.image, maxTex: opts.maxTex || 2048 }); if (mesh) mesh.rad = rad;
    let head = null; if (g.skin) { const hk = g.skin.joints.find(n => /head/i.test(g.nodes[n].name) && !/top|end|nub/i.test(g.nodes[n].name)); head = hk == null ? null : hk; }
    const spine = g.skin ? g.skin.joints.filter(n => /spine|chest/i.test(g.nodes[n].name)) : [];
    const isWalk = (a) => /walk|strut|run|jog|march|waddle/i.test(a.name), walkI = g.anims.findIndex(isWalk), baseI = g.anims.findIndex(a => !isWalk(a));
    const still = opts.still && opts.still.length ? new Set(g.nodes.filter(n => opts.still.includes(n.name.replace(/^.*:/, ''))).map(n => n.i)) : null;
    const model = { name, g, grp, Nm, mesh, height: (y1 - y0) * s, head, spine, clips: g.anims.map(a => a.name), tris: g.IX.length / 3, walk: walkI >= 0 ? walkI : null, base: baseI >= 0 ? baseI : null, hips: null, stride: 0.8 * (y1 - y0) * s, still, lockYaw: opts.lockYaw };
    if (g.skin) { const J = g.skin.joints, hn = J.find(n => /hips|pelvis/i.test(g.nodes[n].name)) ?? J.find(n => !J.includes(g.nodes[n].parent));
      if (hn != null) { const p = g.nodes[hn].parent, W = p >= 0 ? g.restWorld[p] : I4(), A = [W[0], W[1], W[2], W[4], W[5], W[6], W[8], W[9], W[10]], Ai = inv3(A); if (Ai) { const ul = Math.hypot(Ai[3], Ai[4], Ai[5]) || 1; model.hips = { node: hn, rest: g.nodes[hn].t.slice(), A, Ai, up: [Ai[3] / ul, Ai[4] / ul, Ai[5] / ul] }; } } }
    if (model.walk != null && g.skin) { /* how fast the walk was acted: a clip holds several steps (Meshy's take three or four a loop), so count the left
         foot's swings as well as how far it reaches; a planted foot slides back by the step while it is down, about three fifths of each cycle */
      const fk = g.skin.joints.find(n => /foot/i.test(g.nodes[n].name) && /left|^l[_.]|[_.]l$/i.test(g.nodes[n].name) && !/toe|end/i.test(g.nodes[n].name)), clip = g.anims[model.walk];
      if (fk != null) { const N = 120, zs = []; for (let k = 0; k < N; k++) { const Wm = posed(model, null, 0, 0, clip, clip.dur * k / N, 1); zs.push(xf(Nm, Wm[fk][12], Wm[fk][13], Wm[fk][14])[2]); }
        const lo = Math.min(...zs), hi = Math.max(...zs), R = hi - lo, mid = (lo + hi) / 2; let cyc = 0, up = zs[0] > mid; for (const z of zs) { if (!up && z > mid + R * 0.2) { up = true; cyc++; } else if (up && z < mid - R * 0.2) up = false; }
        if (R > 0.05 * model.height) { model.cycles = Math.max(1, cyc); model.stride = R / 0.6; model.v0 = model.cycles * model.stride / clip.dur; } }
      /* better, where the clip shows it: the speed a planted foot slides back under the body is exactly the speed the figure must travel for that
         foot to stay put on the ground. Both feet, every moment one is down (within 3% of the height of its lowest), the middle of those speeds */
      const feet = g.skin.joints.filter(n => /foot/i.test(g.nodes[n].name) && !/toe|end/i.test(g.nodes[n].name)).slice(0, 2);
      if (feet.length === 2) { const N = 240, dt = clip.dur / N, ys = feet.map(() => []), zs2 = feet.map(() => []);
        for (let k = 0; k < N; k++) { const Wm = posed(model, null, 0, 0, clip, dt * k, 1); feet.forEach((f, i) => { const q = xf(Nm, Wm[f][12], Wm[f][13], Wm[f][14]); ys[i].push(q[1]); zs2[i].push(q[2]); }); }
        const sp = []; feet.forEach((f, i) => { const lo = Math.min(...ys[i]); for (let k = 0; k < N; k++) { if (ys[i][k] > lo + 0.03 * model.height) continue; const a = zs2[i][(k + N - 1) % N], b = zs2[i][(k + 1) % N]; if (Math.abs(b - a) > 0.5 * model.height) continue; sp.push(-(b - a) / (2 * dt)); } });
        const fwd = sp.filter(v => v > 0).sort((a, b) => a - b); if (fwd.length > N * 0.25) { model.vFoot = fwd[fwd.length >> 1]; model.v0 = model.vFoot; } }
      if (!model.v0) model.v0 = 1.1 * model.height / 1.8; }
    registry.set(name, model); return model; }
  function inv3(a) { const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = a, c0 = m4 * m8 - m5 * m7, c1 = m5 * m6 - m3 * m8, c2 = m3 * m7 - m4 * m6, det = m0 * c0 + m1 * c1 + m2 * c2; if (Math.abs(det) < 1e-12) return null; const k = 1 / det;
    /* column-major in and out: a = [col0, col1, col2]; returns B with B·(A·v) = v */
    return [c0 * k, (m2 * m7 - m1 * m8) * k, (m1 * m5 - m2 * m4) * k, c1 * k, (m0 * m8 - m2 * m6) * k, (m2 * m3 - m0 * m5) * k, c2 * k, (m1 * m6 - m0 * m7) * k, (m0 * m4 - m1 * m3) * k]; }
  function fromBuffer(name, buf, opts) { try { return build(name, buf, opts); } catch (err) { console.warn('GLB ' + name + ': ' + err.message); return null; } }
  function load(name, url, opts) { if (registry.has(name)) return Promise.resolve(registry.get(name)); if (pending.has(name)) return pending.get(name);
    const p = fetch(url).then(r => { if (!r.ok) throw new Error(r.status + ' ' + url); return r.arrayBuffer(); }).then(b => { const m = fromBuffer(name, b, opts); if (!m) failed.add(name); return m; }).catch(err => { failed.add(name); console.warn('GLB ' + name + ' not loaded: ' + err.message); return null; });
    pending.set(name, p); return p; }
  function get(name) { return registry.get(name) || null; }
  /* dress an entity in a loaded model: it keeps its own model data (height, radius) for everything else, only its look changes */
  function dress(e, name, st = {}) { const m = registry.get(name); if (!m || !m.mesh) return false; e.glb = Object.assign(e.glb && e.glb.name === name ? e.glb : { name, t0: performance.now() }, st); return true; }
  /* the cast: who wears a model from a file, and where the file is. A name here with no file yet is ignored, so nothing is fetched that is not
     shipped. Each figure is dressed by its name as it is drawn; its own box model stays for portraits, collisions and everything else */
  const CAST = {
    finch: { names: ['Professor Finch', 'Professor Aldous Finch'], file: 'assets/finch.glb', face: 0.9, height: 1.95 }, /* rigged square to the front, with a calm idle of his own */
    silas: { names: ['Silas Pennywise'], file: 'assets/silas.glb', face: 0.74, height: 2.1 }, /* the hat is in the height; his idle is the patter of a man selling you something */
    keychain: { names: ['Keychain'], pre: true, file: 'assets/keychain.glb', face: 0.84, height: 2.35, still: ['RightShoulder', 'RightArm', 'RightForeArm', 'RightHand'] }, /* the three tyrants on Earth (village.js names them glbName) are Kin, not men: your Kin fights a Kin. Keychain is a lizard in his coat and crown of keys; the great key in his right hand is put back by tools/art/add_prop.py and that arm does not swing, so it stays upright */
    stonewall: { names: ['Stonewall'], pre: true, file: 'assets/stonewall.glb', face: 0.9, height: 2.9 },
    bigmouth: { names: ['Bigmouth'], pre: true, file: 'assets/bigmouth.glb', face: 0.74, height: 2.82, still: ['LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand'] }, /* a toad in his apron; the height counts the spoon in his left hand, which stands taller than he does */
    kinmaster: { names: ['The Kinmaster'], file: 'assets/kinmaster.glb', face: 0.86, height: 2.3 }, /* the rest of the main cast, made from their own pictures (art/ref 10 to 15) */
    varga: { names: ['Pit Boss Varga'], file: 'assets/varga.glb', face: 0.88, height: 2.0 },
    hask: { names: ['Elder Hask'], pre: true, file: 'assets/hask.glb', face: 0.82, height: 1.9 }, /* an idle and an old man's walk in one file: he wanders the square once it is free */
    garrick: { names: ['Foreman Garrick'], file: 'assets/garrick.glb', height: 1.95 },
    maren: { names: ['Maren'], pre: true, file: 'assets/maren.glb', height: 1.75 },
    brannock: { names: ['Old Brannock'], pre: true, file: 'assets/brannock.glb', height: 1.85 },
  };
  const byName = new Map(); for (const [k, c] of Object.entries(CAST)) for (const n of c.names) byName.set(n, k);
  /* where a file is served: beside the page (GitHub Pages, the installed app), or at its asset address where the page is hosted as an artifact (the build writes that map) */
  const where = (file) => (typeof window !== 'undefined' && window.STRATAKIN_ASSETS && window.STRATAKIN_ASSETS[file]) || file;
  /* each file is fetched the moment someone who wears it comes into view, and the people round the first village (pre) a moment after
     the game starts, so they are waiting before they are met. Until his file has arrived a figure is not drawn at all (a second at most), rather than
     shown in his old shape and swapped; if the file cannot be had, he keeps his old shape */
  const ready = (k) => { const m = registry.get(k); return !!(m && m.mesh && (!m.mesh.texWait || m.mesh.texReady || m.mesh.texFailed)); };
  const since = new Map(); /* when each file was asked for: one that has not come in eight seconds shows the old shape until it does */
  /* THE CAST WEARS ITS CODE-BUILT SHAPES AGAIN (Alexander, 23 Nov 2026): the generated models looked AI-made and clashed with a world drawn in code.
     One switch: with CAST_ON false nobody is dressed from a file, nothing is fetched, and faces, paces and portraits fall back to the old shapes.
     The table, the loader and the tools all stay, and the files are kept in art/models/slim7 (not shipped). */
  const CAST_ON = false;
  const want = (k) => { const c = CAST[k]; if (!CAST_ON || !c || !c.file || registry.has(k) || pending.has(k)) return; since.set(k, performance.now()); load(k, where(c.file), { height: c.height, turn: c.turn || 0, still: c.still }); };
  let preloadAt = 0;
  function dressAll(ents) {
    const now = performance.now(); if (!preloadAt) preloadAt = now + 2500; else if (preloadAt > 0 && now > preloadAt) { preloadAt = -1; for (const k of Object.keys(CAST)) if (CAST[k].pre) want(k); } /* only the first village's people ahead of time; the rest when they are first in view */
    let n = 0;
    for (let i = 0; i < ents.length; i++) { const e = ents[i]; if (!e) continue; const o = e.src || e, k0 = CAST_ON ? byName.get(o.glbName || o.name || e.name) : null, k = k0 && CAST[k0].file ? k0 : null; /* a cast entry with no file yet: drawn as before */
      const ok = k && ready(k); if (k && !ok) { want(k); if (!failed.has(k) && now - (since.get(k) || now) < 8000) continue; } /* on its way (the file, or its picture): not drawn yet */
      if (ok) { const c = CAST[k], st = o._glb || (o._glb = { name: k, t0: now - Math.random() * 5000, clip: c.clip, walk: c.walk }); st.nod = (o.talkOpen || 0) > 0.05 ? 1 : 0; /* talking: the head nods along with the words */ e.glb = st;
        { /* he turns like a person, not a weathervane: a patrol's about-turn, or a step round a post, swings him round over a third of a second instead of
             snapping him the other way in one frame (that snapping, back and forth, was the shiver). Only how he is drawn: the game's own yaw is left alone (render.js draws st.ry) */
          const dtY = st.yt ? Math.min(0.1, (now - st.yt) / 1000) : 0; st.yt = now; const aim = e.yaw;
          if (st.ry == null || !dtY || dtY >= 0.1) st.ry = aim; else { const d = Math.atan2(Math.sin(aim - st.ry), Math.cos(aim - st.ry)); st.ry += d * Math.min(1, dtY * 7); } }
        if (o._glbH !== k) { o._glbH = k; o.sayH = registry.get(k).height * (o.scale || 1) + 0.3; } /* his words float over the model's head, not the old one's */
        const md = registry.get(k); if (md.walk != null && md.v0 && o._glbPace !== k) { o._glbPace = k; const pace = md.v0 * (o.scale || 1); /* he goes about at the pace his walk was acted at, so his feet keep to the ground: Stonewall plods, Hask shuffles */
          if (o.patrol) { const p = o.patrol, span = Math.hypot(p.bx - p.ax, p.bz - p.az); if (span > 0.5) { p.period = Math.max(p.period, 2 * span / pace); p.rest = Math.max(p.rest || 0, 1.6); } }
          if (o.wander !== false && !o.isBoss) o.speed = Math.max(0.3, Math.min(1.6, pace)); } }
      ents[n++] = e; }
    ents.length = n; }
  /* a small picture of a figure in his model, for the cards that show who you are facing; false until the model and its texture are in */
  function portrait(cv, name, size) { const m = registry.get(name); if (!m || !m.mesh || !m.mesh.texReady || typeof R === 'undefined' || !R.renderPortrait) return false;
    return R.renderPortrait(cv, m.mesh, { height: m.height }, size, { glb: { name, clip: false, at: 0, walk: false }, yaw: -0.35, pitch: -0.12 }); }
  const meshFor = (e) => { const m = e.glb && registry.get(e.glb.name); return m && m.mesh ? m.mesh : e.mesh; };
  /* how high his face is above his feet, in a model from a file (null if he wears none): `face` in the cast entry is the fraction of the model's height
     (a crown, a hat or a spoon taller than he is all sit above it); nine tenths if it does not say */
  function faceOf(o) { if (!CAST_ON) return null; const k = o && (o._glb ? o._glb.name : byName.get(o.glbName || o.name)), c = k && CAST[k], md = c && c.file ? registry.get(k) : null; return md && ready(k) ? md.height * (o.scale || 1) * (c.face || 0.9) : null; }
  /* how fast someone in a model from a file walks without his feet sliding (metres a second), or null if he has no such model or it has no walk */
  function pace(o) { if (!CAST_ON) return null; const k = o && (o._glb ? o._glb.name : byName.get(o.glbName || o.name)), md = k && CAST[k] && CAST[k].file ? registry.get(k) : null; return md && md.walk != null && md.v0 ? md.v0 * (o.scale || 1) : null; }
  return { parse, fromBuffer, load, get, dress, pose, dressAll, meshFor, portrait, pace, faceOf, CAST, want, get list() { return [...registry.keys()]; } };
})();
