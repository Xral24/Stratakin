const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', 0); await h.calm();
  await ev(() => { R.render = () => {}; const p = G.player, w = G.world, x0 = Math.floor(p.x) + 30, z0 = Math.floor(p.z), y0 = 29; G.repelUntil = performance.now() + 9e7; w.ensureAround(Math.floor(x0 / CH), Math.floor(z0 / CH), 2, 99999);
    for (let x = x0 - 2; x <= x0 + 12; x++) for (let z = z0 - 2; z <= z0 + 2; z++) { for (let y = y0; y <= y0 + 2; y++) w.setBlock(x, y, z, B.AIR); w.setBlock(x, y0 + 3, z, B.STONE); w.setBlock(x, y0 - 1, z, x > x0 + 3 && x < x0 + 9 ? B.DIRT : B.STONE); }
    p.x = x0 + 0.5; p.z = z0 + 0.5; p.y = y0 + 0.01; p.vy = 0; p.yaw = -Math.PI / 2; window.__x0 = x0; });
  await page.waitForTimeout(800);
  const tr = []; await ev(() => { G.input = G.input || {}; window.__walk = setInterval(() => { const p = G.player; p.x += 0.06; }, 16); });
  for (let i = 0; i < 14; i++) { await page.waitForTimeout(250); tr.push(await ev(() => { const p = G.player; return [+(p.x - window.__x0).toFixed(1), +(p.eye().y - p.y).toFixed(2), +p.y.toFixed(2)]; })); }
  console.log(JSON.stringify(tr)); console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); await h.close(); })();
