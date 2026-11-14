const { open } = require('./harness');
(async () => { const h = await open(); await h.newGame('gal-1');
  const r = await h.ev(() => { const w = G.world, P = WORLD_W, sp = w.spawn; let n = 0, steep = 0, cliff = 0, maxh = 0, land = 0; const byB = {};
    for (let dx = -600; dx <= 600; dx += 3) for (let dz = -600; dz <= 600; dz += 3) { const x = U.mod(Math.round(sp.x + dx), P), z = U.mod(Math.round(sp.z + dz), P); const a = w.colInfo(x, z), b = w.colInfo(U.mod(x + 1, P), z); n++; if (a.h > SEA) { land++; const d = Math.abs(a.h - b.h); if (d >= 2) steep++; if (d >= 4) cliff++; maxh = Math.max(maxh, a.h); byB[a.biome] = (byB[a.biome] || 0) + 1; } }
    // the walk from the spawn to the first village: how many steps of more than one block
    const v = Village.def; let bad = 0, steps = 0; if (v) { const L = Math.hypot(v.x - sp.x, v.z - sp.z); for (let i = 0; i < L; i++) { const x0 = Math.round(sp.x + (v.x - sp.x) * i / L), z0 = Math.round(sp.z + (v.z - sp.z) * i / L), x1 = Math.round(sp.x + (v.x - sp.x) * (i + 1) / L), z1 = Math.round(sp.z + (v.z - sp.z) * (i + 1) / L); steps++; if (Math.abs(w.colInfo(U.mod(x0, P), U.mod(z0, P)).h - w.colInfo(U.mod(x1, P), U.mod(z1, P)).h) > 1) bad++; } }
    return { land, steepPct: +(steep / land * 100).toFixed(1), cliffPct: +(cliff / land * 100).toFixed(2), maxh, byB, walk: { steps, bad } }; });
  console.log(JSON.stringify(r)); await h.close(); })();
