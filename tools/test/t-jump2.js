const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('fresh-9'); await page.waitForTimeout(2500);
  await ev(() => { R.render = () => {}; G.explain = () => {}; });
  console.log('halo', JSON.stringify(await ev(() => { UI.openPanel('menu'); document.getElementById('m-go-halo').click(); const p = G.player, s = Arena.site(); return { world: G.worldId, kin: G.kin.map(k => k.level), collar: p.has('collar'), d: Math.round(Math.hypot(p.x - s.x, p.z - s.z)), lit: Hub.haloOpen(), now: (Quests.current() || {}).title }; })));
  await page.waitForTimeout(9000); console.log('alive', JSON.stringify(await ev(() => ({ hp: G.player.hp, cine: Cine.active(), dlg: Dialogue.active() }))));
  console.log('pit', JSON.stringify(await ev(() => { UI.openPanel('menu'); document.getElementById('m-go-pit').click(); return { banners: G.stats.arena.banners, rex: G.kin.some(k => k.sp.apex === 'rex'), n: G.kin.length }; })));
  console.log('bout', JSON.stringify(await ev(() => { Arena._start(); return { beast: !!Arena.beast }; })));
  console.log('ERRORS:', h.errors.slice(0, 5).join(' | ') || 'none'); await h.close(); })();
