const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  console.log(JSON.stringify(await ev(() => { G.repelUntil = performance.now() + 9e6; G.world.time = 0.4; const p = G.player, w = G.world; let n = 0, best = null; for (let dx = -60; dx <= 60; dx++) for (let dz = -60; dz <= 60; dz++) { const x = Math.floor(p.x) + dx, z = Math.floor(p.z) + dz; for (let y = 40; y < 90; y++) if (w.getBlock(x, y, z) === B.LEAVES && w.getBlock(x, y - 1, z) === B.GRASS) { n++; const d = Math.hypot(dx, dz); if (d > 6 && (!best || d < best[3])) best = [x, y, z, d]; } }
    if (best) { p.x = best[0] + 0.5; p.z = best[2] + 4.5; p.y = w.groundY(best[0], best[2] + 4, best[1] + 3) + 1.2; p.yaw = 0; p.pitch = -0.3; }
    return { bushes: n, best, at: G.camp && Math.round(Math.hypot(G.camp.x - p.x, G.camp.z - p.z)) }; })));
  await page.waitForTimeout(14000); await page.screenshot({ path: '/home/claude/scratch/bush.png', timeout: 150000 });
  console.log('errors', JSON.stringify(h.errors.slice(0, 4))); await h.close(); })();
