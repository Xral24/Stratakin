const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('halo-1');
  await ev(() => { G.player.add('spacesuit', 1); G.player.add('lavasuit', 1); G.travel('halo'); }); await page.waitForTimeout(3000);
  const walk = async (label) => { const r = await ev(async () => { const p = G.player, x0 = p.x, z0 = p.z; window.__inp = true; const t0 = performance.now();
      // read state after a frame
      await new Promise(r => setTimeout(r, 300)); return { world: G.worldId, grav: p.gravity, speedMul: p.speedMul, suit: p.has('stridersuit') }; }); console.log(label, JSON.stringify(r)); };
  await walk('no suit');
  // jump height test: from ground, give jump and track peak
  const jump = async () => ev(async () => { const p = G.player; const y0 = p.y; let peak = y0; p.vy = 8.4 * (p.jumpMul || 1); p.onGround = false; for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 40)); peak = Math.max(peak, p.y); } return +(peak - y0).toFixed(2); });
  console.log('jump no suit', await jump());
  await ev(() => G.player.add('stridersuit', 1)); await page.waitForTimeout(800); await walk('with suit'); console.log('jump suit', await jump()); await ev(() => G.travel('earth')); await page.waitForTimeout(4000); await walk('earth suit'); console.log('jump earth suit', await jump());
  console.log('shop', JSON.stringify(await ev(() => { const s = (Village.shopDef ? null : null); return typeof SHOP_STYLE !== 'undefined' ? null : 'n/a'; })));
  console.log('explained', await ev(() => !!G.stats.heavyTold));
  console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
