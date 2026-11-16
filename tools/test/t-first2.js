const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'Stratakin', -1);
  await ev(() => { G.world.time = 0.4; G.repelUntil = performance.now() + 600000; G.stats.first.stage = 1; });
  await page.waitForTimeout(4000);
  const shots = { maren: () => { const p = G.player, m = First.maren; p.x = m.x + 3.2; p.z = m.z + 1; p.yaw = Math.atan2(-(m.x - p.x), -(m.z - p.z)); p.pitch = -0.05; },
    brook: () => { const p = G.player, b = G.stats.first.brook; if (!b) return 'none'; const x = b.x + Math.cos(b.a) * 9 - Math.sin(b.a) * 2.5, z = b.z - Math.sin(b.a) * 9 - Math.cos(b.a) * 2.5; p.x = x; p.z = z; p.y = G.world.groundY(Math.floor(x), Math.floor(z), G.camp.y + 8) + 1.3; p.vy = 0; p.yaw = Math.atan2(-(b.x - p.x), -(b.z - p.z)); p.pitch = -0.3; },
    kin: () => { const p = G.player, e = First.three[0]; p.flying = false; p.x = e.x + 3; p.z = e.z + 0.5; p.y = e.y + 0.3; p.yaw = Math.atan2(-(e.x - p.x), -(e.z - p.z)); p.pitch = -0.1; } };
  for (const k of (process.env.ONLY || 'maren,brook,kin').split(',')) { const r = await page.evaluate(`(${shots[k].toString()})()`); await page.waitForTimeout(14000); await page.screenshot({ path: `/home/claude/scratch/first-${k}.png`, timeout: 150000 }); console.log(k, r || 'ok'); }
  console.log('ERRORS:', h.errors.slice(0, 3).join(' | ') || 'none'); await h.close(); })();
