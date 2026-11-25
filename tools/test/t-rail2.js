const { open } = require('./harness');
(async () => { const h = await open(); const { ev } = h; await h.newGame('gal-1'); await h.calm();
  const r = await ev(() => { const w = G.world, p = G.player, R = 700, X0 = Math.floor(p.x), Z0 = Math.floor(p.z), names = {}; for (const n in B) names[B[n]] = n; const out = [];
    for (let x = X0 - R; x <= X0 + R && out.length < 3; x++) for (let z = Z0 - R; z <= Z0 + R && out.length < 3; z++) if (w.trackAt(x, z)) { const hh = w.colInfo(U.mod(x, WORLD_W), U.mod(z, WORLD_W)).h; if (hh !== SEA) continue; w.ensureAround(x >> 4, z >> 4, 1, 999); const col = (X, Z) => { const a = []; for (let y = SEA - 1; y <= SEA + 3; y++) a.push(names[w.getBlock(X, y, Z)]); return a.join(','); }; out.push({ at: [x, z], col: col(x, z), nb: [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => w.trackAt(x + a, z + b)).map(([a, b]) => w.colInfo(x + a, z + b).h + ':' + col(x + a, z + b)) }); x += 20; }
    return out; });
  console.log(JSON.stringify(r, null, 1)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
