const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', 0); await h.calm();
  await ev(() => { const p = G.player; R.render = () => {}; G.repelUntil = performance.now() + 9e7; p.add('ship', 1); p.add('spacesuit', 1); p.flying = true; p.y += 12; G.shipTravel('moon'); });
  let last = ''; for (let i = 0; i < 70; i++) { await page.waitForTimeout(500); const st = JSON.stringify(await ev(() => ({ cine: Cine.active(), beat: Cine.beat, world: G.worldId, fly: G.player.flying, park: !!G.shipPark, y: G.player.y | 0, frozen: !!G.player.frozen }))); if (st !== last) { console.log(i * 0.5, st); last = st; } }
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); await h.close(); })();
