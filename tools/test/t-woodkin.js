const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  const ids = (process.env.IDS || 'toad,hare,stork').split(',');
  await ev(() => { G.repelUntil = performance.now() + 9e6; G.world.time = 0.4; const v = Village.townList()[0], p = G.player; G.villageState[v.id].freed = true; p.x = v.x + 0.5; p.z = v.z + 9.5; G.world.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 99999); p.y = v.y + 0.1; p.yaw = 0; });
  for (const id of ids) { await ev((id) => { Cine.stop(true); const p = G.player, w = G.world, fx = 0, fz = -1, sx = -1, sz = 0, cx = p.x + fx * 5, cz = p.z + fz * 5, sp = KIN.woodSpecies(id), actors = []; for (const tr of [0, 1]) { const off = tr ? 0.8 : -0.8, x = cx + sx * off, z = cz + sz * off, y = w.groundY(Math.floor(x), Math.floor(z), Math.floor(p.y) + 6) + 1; actors.push({ sp, lvl: 5, at: () => ({ x, y, z, yaw: Math.atan2(p.x - x, p.z - z) + 0.6 }) }); }
      Cine.play([{ orbit: { x: cx, y: p.y, z: cz, r: [3.6, 3.6], h: [1.3, 1.3], a: [Math.atan2(p.x - cx, p.z - cz), Math.atan2(p.x - cx, p.z - cz)], ly: 0.7 }, secs: 9999, actors }]); window.__iv && clearInterval(window.__iv); window.__iv = setInterval(() => { Cine.entities().forEach((e, k) => { if (k % 2) e.trickT = performance.now() + 5000; else e.trickT = 0; }); }, 200); }, id);
    await page.waitForTimeout(13000); await page.screenshot({ path: '/home/claude/scratch/woodkin-' + id + '.png', timeout: 150000 }); }
  console.log('errors', JSON.stringify(h.errors.slice(0, 4))); await h.close(); })();
