'use strict';
// Gems: bright stones lying about every world, there for the taking, so that simply walking about pays. Most are small and worth a
// shard or a few, lie in little strings that lead you on, and come back in the same places a while after you take them. A footpath has
// more of them, a beach a few, the top of a knoll a better one with a ring of small ones round it. Here and there is a heartstone,
// worth a great deal, and on a beach now and then a strongbox the sea has thrown up: those are found once and never come back.
const Gems = (() => {
  let G = null; const CELL = 14; let cells = new Map(), curWorld = null, live = []; const gone = new Map(); // id -> when a common gem comes back
  const KINDS = {
    glint: { v: 1, col: [0.5, 0.92, 1.0], s: 0.17, back: 6 * 60e3 },
    ember: { v: 3, col: [1.0, 0.66, 0.18], s: 0.21, back: 9 * 60e3 },
    rose: { v: 8, col: [1.0, 0.42, 0.66], s: 0.26, back: 15 * 60e3 },
    heart: { v: 40, col: [0.7, 0.42, 1.0], s: 0.4, once: true },
    box: { v: 0, col: [0.55, 0.38, 0.2], s: 0.36, once: true },
  };
  function init(g) { G = g; cells = new Map(); curWorld = null; live = []; gone.clear(); }
  const taken = () => (G.stats.gemsTaken = G.stats.gemsTaken || {});
  // what lies in one cell of the map: decided by the world's seed, so it is the same every time you come back
  function make(w, cx, cz) {
    const s = w.seed + 4001, out = [], H = (k) => U.hash3(cx, k, cz, s), wid = w.preset.id;
    const px = cx * CELL + 2 + Math.floor(H(2) * (CELL - 4)), pz = cz * CELL + 2 + Math.floor(H(3) * (CELL - 4)); const info = w.colInfo(px, pz);
    if (info.h <= SEA && w.preset.water) return out; if (w.preset.brine && info.h < w.preset.brineLevel) return out;
    if (Village.markers(px, pz, 1).some(m => m.kind === 'village' && Math.hypot(m.x - px, m.z - pz) < 54)) return out; // not in a town: the land's own finds
    const add = (kind, x, z, tag) => out.push({ id: wid + ':' + cx + ':' + cz + ':' + tag, kind, x: x + 0.5, z: z + 0.5, hx: x + 0.5, hz: z + 0.5, y: null, ph: U.hash3(x, 7, z, s) * 6.283 });
    const r = H(1), onPath = w.trailWear ? w.trailWear(px, pz) > 0.3 : false;
    if (U.mod(cx, 7) === 3 && U.mod(cz, 7) === 3 && H(9) < 0.6) add('heart', px, pz, 'h'); // about one to every hundred blocks square, and not in every square
    else if (info.beach && H(8) < 0.05) add('box', px, pz, 'b');
    else if ((info.crag || 0) >= 2.6) { add('rose', px, pz, 'r'); for (let k = 0; k < 4; k++) add('glint', px + Math.round(Math.cos(k * 1.571 + r * 6) * 2), pz + Math.round(Math.sin(k * 1.571 + r * 6) * 2), 'g' + k); }
    else if (r < (onPath ? 0.5 : info.beach ? 0.22 : 0.13)) { // a string of small ones, bending a little, sometimes ending in a better one
      const n = 3 + Math.floor(H(4) * 3), a = H(5) * 6.283;
      for (let k = 0; k < n; k++) { const t = k * 1.5, bend = Math.sin(k * 0.7) * 0.8; add(k === n - 1 && H(6) < 0.3 ? 'ember' : 'glint', Math.round(px + Math.cos(a) * t - Math.sin(a) * bend), Math.round(pz + Math.sin(a) * t + Math.cos(a) * bend), 'g' + k); }
    }
    return out;
  }
  function take(g, K) {
    if (K.once) taken()[g.id] = 1; else gone.set(g.id, performance.now() + K.back);
    let v = K.v, msg = null;
    if (g.kind === 'box') { v = 18 + Math.floor(U.hash3(Math.floor(g.hx), 5, Math.floor(g.hz), 77) * 30); msg = `A strongbox, washed up in the sand. ◆ ${v}.`; }
    else if (g.kind === 'heart') msg = `A heartstone. ◆ ${v}.`;
    g.x = g.hx; g.z = g.hz; g.y = null;
    G.shards += v; G.stats.gems = (G.stats.gems || 0) + 1; UI.sfx(v >= 8 ? 'gemBig' : 'gem'); if (msg) UI.toast(msg, 'good');
  }
  function update(dt, p) {
    const w = G.world; if (w !== curWorld) { curWorld = w; cells = new Map(); }
    const cx0 = Math.floor(p.x / CELL), cz0 = Math.floor(p.z / CELL), now = performance.now(); live = [];
    for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) {
      const k = (cx0 + a) + ',' + (cz0 + b); let arr = cells.get(k); if (!arr) { if (cells.size > 700) cells = new Map(); arr = make(w, cx0 + a, cz0 + b); cells.set(k, arr); }
      for (const g of arr) { const K = KINDS[g.kind]; if (K.once ? taken()[g.id] : (gone.get(g.id) || 0) > now) continue;
        if (g.y == null) { const bx = Math.floor(g.x), bz = Math.floor(g.z), h = w.colInfo(bx, bz).h, over = w.getBlock(bx, h + 1, bz); if (!isSolid(w.getBlock(bx, h, bz)) || isSolid(over) || over === B.WATER || over === B.BRINE || over === B.LAVA) continue; g.y = R.standY(w, g.x, g.z, h + 1, 0.2); } // it lies on the land as the land was made: not in a tree, a wall or a hole
        const dx = p.x - g.x, dz = p.z - g.z, d2 = dx * dx + dz * dz, near = Math.abs(p.y - g.y) < 1.9;
        if (near && d2 < 0.8) { take(g, K); continue; }
        if (near && d2 < 6 && g.kind !== 'box') { const d = Math.sqrt(d2) || 1, sp = Math.min(d, dt * 7); g.x += dx / d * sp; g.z += dz / d * sp; } // close by, it comes to you
        if (d2 < 44 * 44) live.push(g); }
    }
  }
  // a cut stone: a flat table, a crown of facets down to the girdle, a point beneath. Unlit: it glows with its own colour, each facet a different strength of it
  function gemMesh(mb, K) {
    const s = K.s, c = K.col, N = 6, ring = (r, y) => { const o = []; for (let i = 0; i < N; i++) { const a = i / N * 6.283; o.push([Math.cos(a) * r, y, Math.sin(a) * r]); } return o; };
    const tb = ring(s * 0.55, s * 0.95), gd = ring(s, s * 0.35), top = [0, s * 0.95, 0], bot = [0, -s * 0.95, 0]; const sh = (m, w) => [Math.min(1, c[0] * m + w), Math.min(1, c[1] * m + w), Math.min(1, c[2] * m + w)]; const q = (pts, col) => mb.quad(pts, [col, col, col, col], [1, 1, 1, 1], true);
    for (let i = 0; i < N; i++) { const j = (i + 1) % N;
      q([top, tb[j], tb[i], tb[i]], sh(0.9, 0.42));
      q([tb[i], tb[j], gd[j], gd[i]], sh(i % 2 ? 1.0 : 0.78, i % 2 ? 0.12 : 0.02));
      q([gd[i], gd[j], bot, bot], sh(i % 2 ? 0.5 : 0.66, 0)); }
  }
  function boxMesh(mb) {
    const wood = [0.5, 0.33, 0.17], dark = [0.36, 0.23, 0.12], gold = [0.95, 0.76, 0.25];
    mb.box(-0.32, 0, -0.22, 0.32, 0.26, 0.22, wood, 1, false); mb.box(-0.33, 0.26, -0.23, 0.33, 0.36, 0.23, dark, 1, false); // the box and its lid
    for (const x of [-0.2, 0.2]) mb.box(x - 0.035, -0.005, -0.235, x + 0.035, 0.37, 0.235, gold, 1, false); // two bands
    mb.box(-0.05, 0.17, 0.22, 0.05, 0.29, 0.25, gold, 1, true); // the clasp catches the light
  }
  function entities() {
    const t = performance.now() / 1000, out = [];
    for (const g of live) { if (g.y == null) continue; const K = KINDS[g.kind];
      if (g.kind === 'box') out.push({ x: g.x, y: g.y - 0.1, z: g.z, yaw: g.ph, scale: 1, hover: 0, skyMul: 1, noOutline: true, mesh: R.entityMesh('gem:box', boxMesh) });
      else out.push({ x: g.x, y: g.y + 0.36 + Math.sin(t * 2.2 + g.ph) * 0.07, z: g.z, yaw: t * 1.6 + g.ph, scale: 1, hover: 0, skyMul: 1, isFx: true, mesh: R.entityMesh('gem:' + g.kind, (mb) => gemMesh(mb, K)) }); }
    return out;
  }
  return { init, update, entities, KINDS, _make: make };
})();
