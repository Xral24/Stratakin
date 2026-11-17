const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  await ev(() => { window.__r = R.render; R.render = () => {}; G.repelUntil = performance.now() + 9e6; G.world.time = 0.35; });
  const cs = () => ev(() => ({ on: Cine.active(), beat: Cine.beat, title: (document.querySelector('#cine [data-k=title]') || {}).textContent, who: (document.querySelector('#cine [data-k=who]') || {}).textContent, panel: UI.panelOpen || null }));
  const tap = () => ev(() => document.getElementById('cine').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  // a hold
  console.log('keep', JSON.stringify(await ev(() => { const k = Keeps.sites()[0]; try { Keeps.onBattle(k.id, 'won'); return k.name; } catch (e) { return 'ERR ' + e.message; } })));
  await page.waitForTimeout(1600); console.log(' film', JSON.stringify(await cs())); await ev(() => Cine.stop()); await page.waitForTimeout(2500); console.log(' after', JSON.stringify(await cs())); await ev(() => { UI.closePanel && UI.closePanel(); });
  // Thornhold
  console.log('thorn', await ev(() => { try { Campaign.onBoss('won'); return 'ok'; } catch (e) { return 'ERR ' + e.message; } }));
  await page.waitForTimeout(1900); console.log(' film', JSON.stringify(await cs())); await tap(); await page.waitForTimeout(1200); await tap(); await page.waitForTimeout(1200); console.log(' beat2', JSON.stringify(await cs())); await ev(() => Cine.stop()); await page.waitForTimeout(600); await ev(() => { const d = document.getElementById('dialogue'); for (let i = 0; i < 6; i++) if (Dialogue.active()) d.click(); UI.closePanel && UI.closePanel(); });
  // the Citadel throne
  console.log('throne', await ev(() => { try { const p = G.player; G.stats.citadel = Object.assign(G.stats.citadel || {}, { throne: { x: p.x + 4, y: p.y, z: p.z } }); Citadel.talk({ x: p.x + 2, y: p.y, z: p.z, name: 'The Kinmaster' }, () => {}); return 'ok'; } catch (e) { return 'ERR ' + e.message; } }));
  await page.waitForTimeout(800); console.log(' film', JSON.stringify(await cs())); for (let i = 0; i < 3; i++) { await tap(); await page.waitForTimeout(1100); } console.log(' flash', JSON.stringify(await cs()), await ev(() => (document.querySelector('#cine [data-k=memo]') || {}).textContent.slice(0, 60))); await ev(() => Cine.stop(true));
  console.log('errors', JSON.stringify(h.errors.slice(0, 5))); await h.close(); })();
