const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h;
  for (const seed of [process.env.SEED || 'look-3']) { await h.newGame(seed); await h.calm();
  const out = await ev(() => { const w = G.world, v = Village.def; const p = G.player; p.frozen = true; p.x = v.x + 0.5; p.z = v.z + 0.5;
    const res = { v: [v.x, v.y, v.z, v.size, v.R], bad: [] };
    for (let cx = -6; cx <= 6; cx++) for (let cz = -6; cz <= 6; cz++) w.ensureAround(Math.floor(v.x / CH) + cx, Math.floor(v.z / CH) + cz, 1, 9999);
    let n = 0; for (let dx = -90; dx <= 90; dx++) for (let dz = -90; dz <= 90; dz++) for (let y = v.y - 2; y <= v.y + 2; y++) { const x = v.x + dx, z = v.z + dz; if (w.getBlock(x, y, z) !== B.RAIL) continue; n++;
      const s = R.surfaceAt(w, x + 0.5, z + 0.5); let roof = 0; for (let yy = y + 1; yy < y + 14; yy++) if (w.getBlock(x, yy, z) !== B.AIR) { roof = yy - y; break; }
      let mx = -99; for (const [ox, oz] of [[0.02, 0.02], [0.98, 0.02], [0.02, 0.98], [0.98, 0.98], [0.5, 0.5]]) { const t = R.surfaceAt(w, x + ox, z + oz); if (t != null && t - y > mx) mx = t - y; }
      const below = w.getBlock(x, y - 1, z);
      if (mx > -90 && !roof) res.bad.push([dx, dz, y - v.y, +mx.toFixed(2), roof, below]); }
    res.n = n; return res; });
  console.log(seed, JSON.stringify(out.v), 'rails', out.n, 'bad', out.bad.length); console.log(JSON.stringify(out.bad.slice(0, 60))); }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
