const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', 0); await h.calm();
  await ev(() => { window.__nr = 1; R.render = () => {}; G.designerMoon(); }); await page.waitForTimeout(6000);
  await ev(() => { if (Cine.active()) Cine.stop(); while (Dialogue.active && Dialogue.active()) { document.getElementById('dialogue').click(); if (!Dialogue.active()) break; } }); await page.waitForTimeout(1500);
  for (const [dx, dz] of [[60, 20], [-90, 140], [200, -40]]) {
    await ev(() => { if (Dialogue.active()) Dialogue.close && Dialogue.close(); const p = G.player; p.add('ship', 1); G.repelUntil = performance.now() + 9e7; G.boardShip(); }); await page.waitForTimeout(2200);
    const a = await ev(([dx, dz]) => { const p = G.player; p.x += dx; p.z += dz; G.world.ensureAround(Math.floor(p.x / 16), Math.floor(p.z / 16), 3, 99999); const g = G.world.groundY(Math.floor(p.x), Math.floor(p.z), Math.floor(p.y) + 30); p.y = Math.max(p.y, g + 4); return { flying: p.flying, g, y: p.y }; }, [dx, dz]);
    await page.waitForTimeout(400); await ev(() => G.boardShip()); await page.waitForTimeout(400);
    const trace = []; for (let i = 0; i < 12; i++) { await page.waitForTimeout(500); trace.push(await ev(() => { const p = G.player; return [+(p.y.toFixed(1)), p.flying ? 'F' : '-', p.autoLand ? 'A' : '', +(p.vy.toFixed(1)), G.world.groundY(Math.floor(p.x), Math.floor(p.z), Math.floor(p.y) + 1)]; })); }
    const park = await ev(() => G.shipPark ? { y: +G.shipPark.y.toFixed(1), g: G.world.groundY(Math.floor(G.shipPark.x), Math.floor(G.shipPark.z), Math.floor(G.shipPark.y) + 4), gTop: G.world.groundY(Math.floor(G.shipPark.x), Math.floor(G.shipPark.z)) } : null);
    console.log(JSON.stringify(a), JSON.stringify(trace), 'park', JSON.stringify(park));
  }
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); await h.close(); })();
