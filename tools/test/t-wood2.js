const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', 0); await h.calm();
  // a wood creature in a fight: one touch, then the net
  console.log('fight', JSON.stringify(await ev(() => { R.render = () => {}; G.repelUntil = performance.now() + 9e6; const p = G.player; p.add('snare', 5); const e = Wild.makeEntity(KIN.woodSpecies('toad'), 4, p.x + 3, p.y, p.z + 3, { plain: true }); e.woodKin = 'toad'; Wild.list.push(e); Battle.start(e, false); return { hp: e.kin.hp, max: KIN.stats(e.kin).hp, active: Battle.active }; })));
  await page.waitForTimeout(2600);
  console.log(' buttons', JSON.stringify(await ev(() => [...document.querySelectorAll('#b-actions button')].map(b => b.textContent.slice(0, 40)))));
  await page.evaluate(() => { const b = [...document.querySelectorAll('#b-actions button')].find(b => !/net|run|swap|item|bag/i.test(b.textContent)); if (b) b.click(); }); await page.waitForTimeout(3500);
  console.log(' after hit', JSON.stringify(await ev(() => ({ log: [...document.querySelectorAll('#b-log div, #b-log p')].map(d => d.textContent).slice(-3), buttons: [...document.querySelectorAll('#b-actions button')].map(b => b.textContent.slice(0, 30)) }))));
  await page.evaluate(() => { const b = [...document.querySelectorAll('#b-actions button')].find(b => /finish/i.test(b.textContent)); if (b) b.click(); }); await page.waitForTimeout(6000); await ev(() => { const d = document.getElementById('dialogue'); for (let i = 0; i < 5; i++) if (Dialogue.active()) d.click(); UI.closePanel && UI.closePanel(); });
  // the five uses
  console.log('uses', JSON.stringify(await ev(() => { const p = G.player, mk = (id) => KIN.create(KIN.woodSpecies(id), 5), out = {}; if (Battle.active) return 'still fighting';
    const t0 = p.count ? p.count('tonic_heal') : (p.inv.tonic_heal || 0); G.kin.push(mk('tort'), mk('cock'), mk('moth'), mk('fox'), mk('spider')); G.stats.brewDay = -1; for (let i = 0; i < 30; i++) Wood.update(1, p); out.tonic = (p.count ? p.count('tonic_heal') : (p.inv.tonic_heal || 0)) - t0; out.toasts = [...document.querySelectorAll('.toast')].map(t => t.textContent).filter(t => /Weathercock|Brewback/.test(t)).slice(-2);
    const v = Village.townList()[0]; out.has = ['moth', 'fox', 'spider'].map(k => Wood.has(k)); out.marks = !!Wood.site(); return out; })));
  // Maren's telling
  console.log('maren', JSON.stringify(await ev(() => { G.stats.villageFreed = true; G.stats.first = Object.assign(G.stats.first || {}, { stage: 3, healed: true, toldStones: true, toldSeal: true }); try { const m = First.maren; if (!m) return 'no maren'; if (m.onTalk) m.onTalk(); else Village.talk(m); } catch (e) { return 'ERR ' + e.message; } return { dlg: document.getElementById('dialogue').textContent.slice(0, 140), known: !!G.stats.woodKnown }; })));
  console.log('errors', JSON.stringify(h.errors.slice(0, 5))); await h.close(); })();
