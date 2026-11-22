const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', 0); await h.calm();
  const m = await ev(() => { const S = typeof Campaign.sites === 'function' ? Campaign.sites() : Campaign.sites; const m = S.mine; const p = G.player; G.repelUntil = performance.now() + 9e7; G.world.time = 0.45; p.x = m.x + 12; p.z = m.z + 0.5; G.world.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 99999); p.y = G.world.groundY(Math.floor(p.x), Math.floor(p.z)) + 1; return { x: m.x, z: m.z, h: G.world.colInfo(m.x, m.z).h }; });
  let bot = null; for (let i = 0; i < 30 && bot == null; i++) { await page.waitForTimeout(1000); bot = await ev((m) => { const w = G.world; for (let y = m.h - 3; y > 8; y--) if (w.getBlock(m.x + 2, y, m.z - 3) === B.BEAM && w.getBlock(m.x + 2, y - 1, m.z - 3) !== B.BEAM) return y; return null; }, m); }
  console.log('bottom', bot); if (bot == null) { await h.close(); return; }
  await ev((m) => { const w = G.world; let bottom = null; for (let y = m.h - 3; y > 8; y--) if (w.getBlock(m.x + 2, y, m.z - 3) === B.BEAM && w.getBlock(m.x + 2, y - 1, m.z - 3) !== B.BEAM) { bottom = y; break; }
    const p = G.player; p.x = m.x - 4 + 0.5; p.z = m.z + 0.5; p.y = bottom + 0.05; p.vy = 0; p.yaw = -Math.PI / 2; p.pitch = -0.1; p.add('torch', 1); const i = p.hotbar().indexOf('torch'); if (i >= 0) p.sel = i; G.thirdPerson = true; if (G.meshPass) G.meshPass(999); }, m);
  await page.waitForTimeout(3000); await page.screenshot({ path: '/home/claude/scratch/minecam-1.png', timeout: 150000 });
  await ev(() => { G.player.yaw = 0.3; }); await page.waitForTimeout(1500); await page.screenshot({ path: '/home/claude/scratch/minecam-2.png', timeout: 150000 });
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); await h.close(); })();
