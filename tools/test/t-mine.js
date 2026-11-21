const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', 0); await h.calm(); const SH = process.env.SHOT;
  console.log('surface', JSON.stringify(await ev((SH) => { if (!SH) R.render = () => {}; const p = G.player, w = G.world, x = Math.floor(p.x), z = Math.floor(p.z); G.repelUntil = performance.now() + 9e7; return { cave: w.caveK(p.x, p.y, p.z), layer: w.layerAt(Math.floor(p.y), x, z), h: w.colInfo(x, z).h, y: Math.round(p.y) }; }, SH)));
  console.log('room', JSON.stringify(await ev(() => { const p = G.player, w = G.world, x0 = Math.floor(p.x) + 30, z0 = Math.floor(p.z), y0 = 29; w.ensureAround(Math.floor(x0 / CH), Math.floor(z0 / CH), 2, 99999);
    for (let x = x0 - 7; x <= x0 + 7; x++) for (let z = z0 - 9; z <= z0 + 9; z++) for (let y = y0; y <= y0 + 5; y++) w.setBlock(x, y, z, B.AIR);
    for (let x = x0 - 7; x <= x0 + 7; x++) for (let z = z0 - 9; z <= z0 + 9; z++) { w.setBlock(x, y0 - 1, z, (x * 7 + z * 3) % 5 === 0 ? B.IRON_ORE : B.STONE); if ((x + z) % 6 === 0 && Math.abs(x - x0) < 6) w.setBlock(x, y0, z, (x & 1) ? B.COPPER_ORE : B.IRON_ORE); }
    p.x = x0 + 0.5; p.z = z0 + 6.5; p.y = y0 + 0.05; p.vy = 0; p.yaw = 0; p.pitch = -0.12; G.thirdPerson = false; p.add('torch', 1); const i = p.hotbar().indexOf('torch'); if (i >= 0) p.sel = i; if (G.meshPass) G.meshPass(999);
    return { cave: w.caveK(p.x, p.y, p.z), layer: w.layerAt(Math.floor(p.y), Math.floor(p.x), Math.floor(p.z)), torch: p.holdingTorch(), sel: p.selected && p.selected() }; })));
  await page.waitForTimeout(1500);
  console.log('state', JSON.stringify(await ev(() => ({ amb: R.state.ambient, fog: R.state.fogColor.map(v => +v.toFixed(3)), near: R.state.fogNear, far: R.state.fogFar, sky: R.state.skyPass, cave: R.state.caveK, lights: R.state.lights.length }))));
  console.log('shallow', JSON.stringify(await ev(() => { const p = G.player, w = G.world, out = []; const x = Math.floor(p.x), z = Math.floor(p.z), h = w.colInfo(x, z).h; for (const d of [1, 3, 5, 8, 12]) out.push([d, +w.caveK(p.x, h - d, p.z).toFixed(2)]); return { h, top: w.topAt(x, z), out }; })));
  if (SH) { await ev(() => { const p = G.player; window.__si = setInterval(() => { p.hp = 9999; p.vx = p.vz = 0; }, 30); }); await ev((t) => { G.world.time = t; }, +(process.env.TIME || 0.5)); await page.waitForTimeout(26000); await page.screenshot({ path: '/home/claude/scratch/mine-' + SH + '.png', timeout: 150000 }); }
  console.log('ERRORS:', h.errors.slice(0, 5).join(' | ') || 'none'); await h.close(); })();
