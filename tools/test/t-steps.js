// how steep the generated land is: the share of neighbouring columns that differ by 0, 1, 2, 3, 4+ blocks, per world
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  const run = async (label) => { const r = await ev(() => { const w = G.world; const c = [0, 0, 0, 0, 0, 0, 0, 0, 0], worst = []; let land = 0;
      for (let k = 0; k < 14; k++) { const X = Math.floor(U.hash3(k, 1, 7, 99) * WORLD_W), Z = Math.floor(U.hash3(k, 2, 7, 99) * WORLD_W); const N = 120; const g = new Int16Array((N + 1) * (N + 1)); const lw = new Uint8Array((N + 1) * (N + 1));
        for (let a = 0; a <= N; a++) for (let b = 0; b <= N; b++) { const i = w.colInfo(X + a, Z + b); g[a * (N + 1) + b] = i.h; lw[a * (N + 1) + b] = (i.lostRim || i.h < SEA - 1) ? 0 : 1; }
        for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) { if (!lw[a * (N + 1) + b]) continue; land++; const d = Math.max(Math.abs(g[a * (N + 1) + b] - g[(a + 1) * (N + 1) + b]), Math.abs(g[a * (N + 1) + b] - g[a * (N + 1) + b + 1])); c[Math.min(8, d)]++; if (d >= 4 && worst.length < 6) worst.push([X + a, Z + b, d]); } }
      return { pct: c.map(v => +(100 * v / land).toFixed(2)), worst }; });
    console.log(label, 'step% 0..8+:', JSON.stringify(r.pct), 'worst', JSON.stringify(r.worst)); };
  await run('earth');
  for (const body of (process.env.BODIES || 'moon,halo').split(',').filter(Boolean)) { await ev((b) => { G.travel(b); }, body); await page.waitForTimeout(9000); await run(body); }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
