const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', 0); await h.calm(); page.on('crash', () => console.log('PAGE CRASHED')); page.on('close', () => console.log('PAGE CLOSED')); await ev((nr) => { window.__nr = nr; }, !!process.env.NR);
  await ev(() => { const p = G.player; G.repelUntil = performance.now() + 9e7; G.world.time = 0.4; p.add('ship', 1); p.add('spacesuit', 1); G.thirdPerson = true; if (window.__nr) R.render = () => {}; G.boardShip(); });
  await page.waitForTimeout(500); await page.screenshot({ path: '/home/claude/scratch/ship-board.png', timeout: 150000 });
  await page.waitForTimeout(2500); console.log('up', JSON.stringify(await ev(() => ({ flying: G.player.flying, board: !!G.shipBoard }))));
  await ev(() => { const p = G.player; p.y += 10; window.__si = setInterval(() => { p.vy = 0; }, 30); }); await page.waitForTimeout(3000);
  await ev(() => { clearInterval(window.__si); G.stats.flown = { 'out:earth': true }; G.stats.hub = { greeted: true, got: {}, in: {} }; G.shipTravel('moon'); });
  console.log('film', JSON.stringify(await ev(() => ({ cine: Cine.active(), beat: Cine.beat, world: G.worldId }))));
  for (let i = 0; i < 40; i++) { await page.waitForTimeout(3000); const st = await ev(() => ({ cine: Cine.active(), beat: Cine.beat, world: G.worldId })); if (st.world === 'moon' && st.cine && !globalThis.__shot) { globalThis.__shot = 1; await page.waitForTimeout(9000); await page.screenshot({ path: '/home/claude/scratch/ship-arrive.png', timeout: 150000 }); } if (!st.cine) break; }
  await ev(() => { if (Cine.active()) Cine.stop(); }); await page.waitForTimeout(1500);
  console.log('landed', JSON.stringify(await ev(() => ({ world: G.worldId, flying: G.player.flying, park: !!G.shipPark, y: G.player.y | 0 })))); await page.waitForTimeout(2500); await page.screenshot({ path: '/home/claude/scratch/ship-park.png', timeout: 150000 });
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); await h.close(); })();
