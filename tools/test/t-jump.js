const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', 0); await h.calm(); const SH = process.env.SHOT;
  await ev((SH) => { if (!SH) R.render = () => {}; }, SH);
  console.log('menu', JSON.stringify(await ev(() => { UI.openPanel('menu'); const b = document.getElementById('m-go-moon'), b2 = document.getElementById('m-go-hearts'); const r = { moon: !!b, hearts: !!b2 }; b.click(); return r; })));
  await page.waitForTimeout(1500);
  console.log('landed', JSON.stringify(await ev(() => { const p = G.player, s = Hub.site(); return { world: G.worldId, panel: UI.panelOpen, kin: G.kin.map(k => KIN.name(k) + ' ' + k.level + ' s' + k.stage + ' ' + Math.round(k.hp)), items: ['spacesuit', 'ship', 'glider', 'snare2', 'tonic_heal'].map(i => p.count(i)), shards: G.shards, lvl: G.trainerLevel, atPad: +Math.hypot(p.x - G.world.pad.x, p.z - G.world.pad.z).toFixed(1), hub: !!s, hp: p.hp }; })));
  await page.waitForTimeout(3500);
  console.log('greet', JSON.stringify(await ev(() => ({ cine: Cine.active(), greeted: G.stats.hub.greeted, text: ((document.querySelector('#cine [data-k="text"]') || {}).textContent || '').slice(0, 40) }))));
  if (SH) { await page.waitForTimeout(20000); await page.screenshot({ path: '/home/claude/scratch/jump-greet.png', timeout: 150000 }); }
  await ev(() => Cine.stop()); await page.waitForTimeout(500);
  console.log('hearts', JSON.stringify(await ev(() => { UI.openPanel('menu'); document.getElementById('m-go-hearts').click(); const P = G.player; return { panel: UI.panelOpen, items: Hub.PARTS.map(q => P.count(q.item)) }; })));
  console.log('seat all', JSON.stringify(await ev(() => { const s = Hub.site(), P = G.player; for (const q of Hub.PARTS) { P.x = s.x + q.at[0] + 0.5 + 1.6; P.z = s.z + q.at[1] + 0.5; P.y = s.y + 1.05; Hub.tap(P); } return { lit: !!G.stats.hub.lit, halo: Hub.haloOpen(), cine: Cine.active() }; })));
  await ev(() => Cine.stop()); await page.waitForTimeout(300);
  console.log('again', JSON.stringify(await ev(() => { G.designerMoon(); return { world: G.worldId, kin: G.kin.length, greeted: G.stats.hub.greeted, lit: !!G.stats.hub.lit }; })));
  console.log('wild near pad', JSON.stringify(await ev(() => { const k = G.kin[0]; return { lead: KIN.name(k), lv: k.level, save: typeof G.save === 'function' ? !!G.save() : null }; })));
  console.log('ERRORS:', h.errors.slice(0, 5).join(' | ') || 'none'); await h.close(); })();
