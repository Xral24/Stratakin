const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame(process.argv[2] || 'gal-1'); await h.calm();
  const r = await ev(() => { const w = G.world, p = G.player, R = 700, cells = new Map(), X0 = Math.floor(p.x), Z0 = Math.floor(p.z); const ty = (x, z) => { const hh = w.colInfo(U.mod(x, WORLD_W), U.mod(z, WORLD_W)).h; return hh >= SEA ? hh + 1 : SEA + 2; };
    for (let x = X0 - R; x <= X0 + R; x++) for (let z = Z0 - R; z <= Z0 + R; z++) if (w.trackAt(x, z)) cells.set(x + ',' + z, ty(x, z));
    const hist = {}, ex = []; let wet = 0; for (const [k, y] of cells) { const [x, z] = k.split(',').map(Number); let worst = 0; for (const [a, b] of [[1, 0], [0, 1], [1, 1], [1, -1]]) { const y2 = cells.get((x + a) + ',' + (z + b)); if (y2 != null) worst = Math.max(worst, Math.abs(y2 - y)); } hist[worst] = (hist[worst] || 0) + 1; if (worst >= 2 && ex.length < 12) ex.push([x, z, y, w.colInfo(x, z).h, worst]); if (y === SEA + 2) wet++; }
    return { SEA, n: cells.size, wet, hist, ex }; });
  console.log(JSON.stringify(r)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
