'use strict';
// Chopping a tree. Cut any trunk block and the whole tree above the cut comes down in one piece: it creaks over away from you,
// hits the ground with a thump and a burst of leaves, and every log in it is wood in your bag. Cut low and you take the lot;
// cut higher and a stump stays. Felled trees grow back in a few minutes like everything else that grows.
const Felling = (() => {
  let G = null; const falls = []; let serial = 0;
  function init(game) { G = game; for (const f of falls) R.dropEntityMesh(f.key); falls.length = 0; }
  const TRUNK = (b) => b === B.LOG || b === B.BIRCHLOG || b === B.PALMLOG;
  const CROWN = (b) => isLeaf(b) || b === B.FROND || b === B.BERRY;
  const key = (a, b, c) => a + ',' + b + ',' + c;
  // every block of the tree that owns the trunk block at (x, y, z): the generator's own tree when one is rooted near enough to hold this
  // block, else whatever hangs together with it (a tree you planted, or one already half cut)
  function treeOf(w, x, y, z) {
    for (let r = 0; r <= 3; r++) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
      const rx = x + dx, rz = z + dz; const info = w.colInfo(U.mod(rx, WORLD_W), U.mod(rz, WORLD_W)); const tree = w.treeAt(rx, rz, info); if (!tree) continue;
      const set = new Map(); w.plantTree((bx, by, bz, id) => set.set(key(bx, by, bz), { x: bx, y: by, z: bz, id }), rx, info.h, rz, tree, w.seed);
      if (set.has(key(x, y, z)) && [...set.values()].filter(b => CROWN(w.getBlock(b.x, b.y, b.z))).length >= 3) return { root: { x: rx, y: info.h, z: rz }, blocks: [...set.values()], type: tree.type };
    }
    const seen = new Set([key(x, y, z)]), out = [{ x, y, z, id: w.getBlock(x, y, z) }], stack = [[x, y, z]]; let n = 0;
    while (stack.length && n++ < 400) {
      const [cx, cy, cz] = stack.pop(); const cur = w.getBlock(cx, cy, cz);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
        if (!dx && !dy && !dz) continue; const nx = cx + dx, ny = cy + dy, nz = cz + dz; const k = key(nx, ny, nz); if (seen.has(k)) continue;
        if (Math.abs(nx - x) > 5 || Math.abs(nz - z) > 5 || ny < y - 1) continue;
        const b = w.getBlock(nx, ny, nz); if (!((TRUNK(b) && dy === 1 && !dx && !dz && !CROWN(cur)) || (CROWN(b) && (TRUNK(cur) || CROWN(cur))))) continue; // a trunk only climbs: logs side by side are a wall, not a tree
        seen.add(k); out.push({ x: nx, y: ny, z: nz, id: b }); stack.push([nx, ny, nz]);
      }
    }
    // logs with no crown are something you built (a wall, a fence, a hut): taking one out takes out that one block, nothing more
    if (out.filter(b => CROWN(b.id)).length < 3) return null;
    return { root: { x, y: y - 1, z }, blocks: out, type: 'wild' };
  }
  // the cut: the trunk block at (x, y, z) has just been taken out by the player; the rest of the tree above it comes down
  function cut(x, y, z, player) {
    const w = G.world; const t = treeOf(w, x, y, z); if (!t) return false;
    const parts = []; for (const b of t.blocks) { if (b.x === x && b.y === y && b.z === z) continue; const id = w.getBlock(b.x, b.y, b.z); if (TRUNK(id) ? b.y >= y : CROWN(id)) parts.push({ x: b.x, y: b.y, z: b.z, id }); }
    if (!parts.length) return false;
    // what it is worth: a wood for every log, a berry or two off a berry tree
    let wood = 0, berries = 0; for (const b of parts) { if (TRUNK(b.id)) wood++; else if (b.id === B.BERRYLEAF && Math.random() < 0.5) berries++; else if (b.id === B.BERRY) berries += 2; }
    if (wood) player.add('wood', wood); if (berries) player.add('berry', Math.min(12, berries));
    const now = performance.now(); w.regrow = w.regrow || [];
    for (const b of parts) { w.setBlock(b.x, b.y, b.z, B.AIR); w.regrow.push({ x: b.x, y: b.y, z: b.z, t: now + 240000 + Math.random() * 30000, id: b.id === B.BERRY ? B.BERRY : b.id }); }
    // the fall: hinged at the foot of the cut, toppling away from whoever swung the axe
    const hx = x + 0.5, hy = y + 1, hz = z + 0.5; let dx = hx - player.x, dz = hz - player.z; const dl = Math.hypot(dx, dz); // hinged on the stump top; the piece is built a block lower than it stood so it sits on the stump as it goes, no gap where the cut block was
    if (dl < 0.01) { const a = Math.random() * 6.283; dx = Math.cos(a); dz = Math.sin(a); } else { dx /= dl; dz /= dl; }
    let top = y; for (const b of parts) top = Math.max(top, b.y + 1);
    const k = 'fall:' + (++serial); const grassTint = tintAt(w, x, z);
    const mesh = R.entityMesh(k, (mb) => build(mb, parts, hx, hy, hz, grassTint, t.type));
    falls.push({ key: k, mesh, x: hx, y: hy - 1, z: hz, dx, dz, t: 0, dur: 0.75 + 0.045 * (top - y), height: top - y, hit: false, model: { height: top - y, radius: 3 }, skyMul: 1, isFx: true, noOutline: false });
    UI.sfx('break'); if (G.stats && !G.stats.timberTold) { G.stats.timberTold = true; G.explain('Timber', 'Cut any trunk block and the whole tree above it comes down; every log in it is wood in your bag. Cut low to take it all, or higher and leave a stump. Trees grow back in a few minutes.'); }
    return true;
  }
  function tintAt(w, x, z) { const c = w.chunks.get(Math.floor(x / CH) + ',' + Math.floor(z / CH)); if (!c || !c.tint) return [0.36, 0.62, 0.26]; const i = (U.mod(x, CH) * CH + U.mod(z, CH)) * 3; return [c.tint[i], c.tint[i + 1], c.tint[i + 2]]; }
  // the mesh of the falling piece, in coordinates around the hinge: round logs like the standing ones, leaf puffs grouped the way the mesher groups them
  function build(mb, parts, hx, hy, hz, tint, type) {
    const trunkSet = new Set(); for (const b of parts) if (TRUNK(b.id)) trunkSet.add(key(b.x, b.y, b.z));
    for (const b of parts) {
      if (!TRUNK(b.id)) continue;
      const birch = b.id === B.BIRCHLOG, palm = b.id === B.PALMLOG; const base = birch ? [0.9, 0.88, 0.84] : palm ? [0.62, 0.5, 0.32] : [0.5, 0.36, 0.2];
      const rr = birch ? 0.4 : palm ? 0.36 : 0.5; const lx = b.x + 0.5 - hx, ly = b.y - hy, lz = b.z + 0.5 - hz;
      const below = trunkSet.has(key(b.x, b.y - 1, b.z)), above = trunkSet.has(key(b.x, b.y + 1, b.z));
      const seed = b.x * 7 + b.z * 13 + b.y;
      mb.tube([[lx, ly, lz], [lx, ly + 1, lz]], [rr, rr], base, { segs: 8, cap0: below ? 'none' : 'flat', cap1: above ? 'none' : 'flat', shade: (p, nx, ny, nz) => { const seg = Math.floor(Math.atan2(nx, nz) * 1.27 + 8); const kk = U.hash3(seg, seed, 3, 5); if (birch) return kk < 0.22 ? [0.25, 0.22, 0.2] : [0.9 * (0.94 + kk * 0.1), 0.88 * (0.94 + kk * 0.1), 0.84]; const m = 0.78 + kk * 0.4; return [base[0] * m, base[1] * m, base[2] * m]; } });
    }
    // leaves: one puff per 2x2x2 cell of leaf blocks, sized to the blocks in it
    const cells = new Map();
    for (const b of parts) { if (!(isLeaf(b.id) || b.id === B.FROND)) continue; const ck = key(b.x & ~1, b.y & ~1, b.z & ~1); let c = cells.get(ck); if (!c) cells.set(ck, c = { n: 0, sx: 0, sy: 0, sz: 0, x0: 9, x1: -9, y0: 9, y1: -9, z0: 9, z1: -9, id: b.id }); c.n++; c.sx += b.x; c.sy += b.y; c.sz += b.z; c.x0 = Math.min(c.x0, b.x & 1); c.x1 = Math.max(c.x1, b.x & 1); c.y0 = Math.min(c.y0, b.y & 1); c.y1 = Math.max(c.y1, b.y & 1); c.z0 = Math.min(c.z0, b.z & 1); c.z1 = Math.max(c.z1, b.z & 1); if (b.id === B.BERRYLEAF) c.berry = true; }
    for (const [ck, c] of cells) {
      const cx = c.sx / c.n + 0.5 - hx, cy = c.sy / c.n + 0.5 - hy, cz = c.sz / c.n + 0.5 - hz;
      const h0 = U.hash3(c.sx, c.sy, c.sz, 61), h1 = U.hash3(c.sx, c.sy, c.sz, 62), h2 = U.hash3(c.sx, c.sy, c.sz, 63);
      const rs = 0.94 + h0 * 0.14; const rx = (0.66 + (c.x1 - c.x0) * 0.5) * rs, ry = (0.56 + (c.y1 - c.y0) * 0.44) * rs, rz = (0.66 + (c.z1 - c.z0) * 0.5) * rs;
      let col; if (c.id === B.NEEDLES) { const nv = 0.9 + h1 * 0.2; col = [0.19 * nv, 0.42 * nv, 0.3 * nv]; } else { const warm = c.berry ? 0.25 : 0; col = [tint[0] * (0.9 + warm), tint[1] * 1.02, tint[2] * 0.72]; }
      const hue = (h2 - 0.5) * 0.16; col = [col[0] * (1 + hue), col[1], col[2] * (1 - hue)];
      mb.blob(cx - rx, cy - ry, cz - rz, cx + rx, cy + ry, cz + rz, 0.9, [col[0] * 1.08, col[1] * 1.06, col[2]], { n: c.n >= 4 ? 3 : 2, under: [col[0] * 0.5, col[1] * 0.56, col[2] * 0.62], split: 0.05, soft: 0.7 });
      if (c.berry) for (let i = 0; i < 2; i++) { const a = U.hash3(c.sx, c.sy, c.sz, 64 + i) * 6.283; mb.ball(cx + Math.cos(a) * rx * 0.85, cy + ry * 0.3, cz + Math.sin(a) * rz * 0.85, 0.08, [0.9, 0.15, 0.22], { n: 2 }); }
    }
  }
  function update(dt) {
    for (let i = falls.length - 1; i >= 0; i--) {
      const f = falls[i]; f.t += dt;
      if (!f.hit && f.t >= f.dur) { // the thump
        f.hit = true; UI.sfx('hit'); G.shake = Math.max(G.shake || 0, 0.25 + 0.03 * f.height);
        const reach = Math.max(1, f.height * 0.8); const lx = f.x + f.dx * reach, lz = f.z + f.dz * reach; const gy = G.world.groundY(Math.floor(lx), Math.floor(lz), Math.floor(f.y) + 4);
        Hazards.puff(lx, (gy == null ? f.y : gy + 1) + 0.3, lz, 14, [0.42, 0.62, 0.3]); Hazards.puff(lx, (gy == null ? f.y : gy + 1) + 0.2, lz, 6, [0.6, 0.5, 0.36]);
      }
      if (f.t > f.dur + 0.9) { R.dropEntityMesh(f.key); falls.splice(i, 1); }
    }
  }
  // the model matrix of each falling piece: hinge at the foot of the cut, tipping over about the axis across the fall direction, a little bounce at the end
  function entities() {
    const out = [];
    for (const f of falls) {
      const u = Math.min(1, f.t / f.dur); let th = 1.5 * u * u; // it starts slow and gathers speed, like a thing falling
      if (f.t > f.dur) { const s = f.t - f.dur; th = 1.5 + 0.06 * Math.sin(s * 16) * Math.exp(-s * 7); }
      const ax = f.dz, az = -f.dx; const c = Math.cos(th), s = Math.sin(th), t1 = 1 - c; // rotation about the horizontal axis (ax, 0, az)
      const M = new Float32Array([
        c + ax * ax * t1, az * s, ax * az * t1, 0,
        -az * s, c, ax * s, 0,
        ax * az * t1, -ax * s, c + az * az * t1, 0,
        f.x, f.y, f.z, 1]);
      const fade = f.t > f.dur + 0.5 ? Math.max(0, 1 - (f.t - f.dur - 0.5) / 0.4) : 1;
      out.push({ x: f.x, y: f.y, z: f.z, yaw: 0, scale: 1, hover: 0, model: f.model, mesh: f.mesh, M, skyMul: 1, alpha: fade < 1 ? fade : undefined, isFx: fade < 1 });
    }
    return out;
  }
  return { init, cut, update, entities, isTrunk: TRUNK };
})();
