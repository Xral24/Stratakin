const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame('gal-1'); await h.calm();
  console.log('starter', await ev(() => KIN.name(G.player.kin ? G.player.kin[0] : (G.kin || [])[0] || G.party[0])).catch(e => 'n/a'));
  console.log('names', JSON.stringify(await ev(() => KIN.dex('earth').slice(0, 14).map(s => s.names.join('>')))));
  await ev(() => { const p = G.player; const r = KIN.roster('earth', 0, 0, 'Surface', 'Plains', 0); const e = Wild.makeEntity(r[0], 3, p.x + 3, p.y, p.z + 3); Wild.list.push(e); Battle.start(e, false); });
  await page.waitForTimeout(2500);
  const shots = (process.env.SHOTS || 'Flame,Spark,Frost,Tide').split(',');
  for (const el of ['Flame', 'Tide', 'Bloom', 'Stone', 'Gale', 'Frost', 'Spark', 'Void', 'Light']) {
    const T = await ev((el) => Battle.fxTest(el, 'spec', false), el); 
    if (shots.includes(el)) { await page.waitForTimeout(Math.max(120, T * 1000 + 120)); await page.screenshot({ path: `/home/claude/fx-${el}.png` }); }
    await page.waitForTimeout(1300);
  }
  await ev(() => Battle.fxTest('Flame', 'phys', false)); await page.waitForTimeout(330); await page.screenshot({ path: '/home/claude/fx-phys.png' }); await page.waitForTimeout(900);
  await ev(() => Battle.fxTest('Void', 'spec', true)); await page.waitForTimeout(600); await ev(() => Battle.fxTest('Mend', 'util')); await page.waitForTimeout(900); await ev(() => Battle.fxTest('Gale', 'spec', false, false)); await page.waitForTimeout(900);
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
