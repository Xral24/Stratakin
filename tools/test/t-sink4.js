const { open } = require('./harness');
(async () => { const h = await open(); const { ev } = h; await h.newGame('sink-1'); await h.calm();
  // find a spot where the drawn slope is well above the block top, put the buddy there, and see where it stands
  const r = await ev(() => { const w = G.world, p = G.player; let best = null;
    for (let i = 0; i < 4000 && !best; i++) { const x = Math.floor(p.x) + ((i * 37) % 60) - 30 + 0.5, z = Math.floor(p.z) + ((i * 53) % 60) - 30 + 0.5; const gy = w.groundY(Math.floor(x), Math.floor(z)); if (gy == null) continue; const s = R.surfaceAt(w, x + 0.3, z); if (s != null && s - (gy + 1) > 0.3) best = { x, z, top: gy + 1, s }; }
    if (!best) return 'no slope found'; p.x = best.x - 1.6; p.z = best.z; p.y = best.top + 0.2; p.yaw = Math.PI / 2; return JSON.stringify(best); });
  console.log(r); await h.page.waitForTimeout(2500);
  console.log(await ev(() => { const e = Buddy.entity, w = G.world; let mx = -1e9; for (const [ox, oz] of [[0, 0], [0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]]) { const s = R.surfaceAt(w, e.x + ox, e.z + oz); if (s != null) mx = Math.max(mx, s); } return 'buddy y=' + e.y.toFixed(2) + ' highest ground under it=' + mx.toFixed(2) + ' block top=' + (w.groundY(Math.floor(e.x), Math.floor(e.z)) + 1); }));
  await h.close(); })();
