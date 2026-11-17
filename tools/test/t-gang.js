const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  const list = await ev(() => { window.__r = R.render; R.render = () => {}; G.repelUntil = performance.now() + 9e6; return Village.townList().map(v => [v.name, v.size, v.starter ? 1 : 0]); }); console.log(JSON.stringify(list));
  const idx = list.findIndex(v => v[1] === (process.env.SIZE || 'town')); if (idx < 0) { console.log('no such place'); await h.close(); return; }
  await ev((i) => { const v = Village.townList()[i], p = G.player, w = G.world; p.x = v.x + 0.5; p.z = v.z + 14.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 99999); p.y = v.y + 0.05; G.stats.tyrantMet = { Grakor: 1 }; window.__v = v; }, idx);
  await page.waitForTimeout(3000);
  console.log('gang', JSON.stringify(await ev(() => { const v = window.__v, b = v.boss; return { active: Village.active && Village.active.name, boss: b && KIN.name(b.kin), gang: (v.gang || []).map(g => KIN.name(g.kin)), d: b && Math.round(Math.hypot(b.x - G.player.x, b.z - G.player.z)) }; })));
  await ev(() => { const b = window.__v.boss, p = G.player; p.x = b.x + 1; p.z = b.z + 9; p.y = b.y + 0.1; }); await page.waitForTimeout(1800);
  console.log('talk', JSON.stringify(await ev(() => ({ scene: window.__v.boss.scene && window.__v.boss.scene.stage, dlg: document.getElementById('dialogue').textContent.slice(0, 160) }))));
  if (process.env.SHOT) { await ev(() => { R.render = window.__r; }); await page.waitForTimeout(12000); await page.screenshot({ path: '/home/claude/scratch/gang.png', timeout: 150000 }); await ev(() => { R.render = () => {}; }); }
  const seen = []; for (let i = 0; i < 6; i++) { const t = await ev(() => { const d = document.getElementById('dialogue'); const s = Dialogue.active() ? d.textContent.slice(0, 200) : null; if (s) d.click(); return s; }); if (!t) break; seen.push(t); await page.waitForTimeout(350); } console.log('lines', JSON.stringify(seen));
  await page.waitForTimeout(2600);
  console.log('fight', JSON.stringify(await ev(() => { const b = window.__v.boss; return { battle: Battle.active, hp: b.kin.hp, max: b.kin.maxHp || (b.kin.stats && b.kin.stats.hp), plan: b.plan }; })));
  for (let n = 0; n < 3; n++) { const r = await ev(() => { const v = window.__v, b = v.boss; if (!b) return null; if (Battle.active && Battle.end) try { Battle.end('flee'); } catch (e) {} Wild.remove(b); Village.bossBeaten(b); return { out: KIN.name(b.kin), next: v.boss && KIN.name(v.boss.kin), turn: v.boss && v.boss.turn, left: (v.gang || []).length, met: G.stats.tyrantMet, toast: [...document.querySelectorAll('.toast')].map(t => t.textContent).slice(-2) }; }); console.log('beat', JSON.stringify(r)); if (!r || !r.next) break; await page.waitForTimeout(600); }
  console.log('errors', JSON.stringify(h.errors.slice(0, 4))); await h.close(); })();
