const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame('gal-1'); await h.calm();
  await ev(() => document.getElementById('hb-ld').click()); await page.waitForTimeout(40000);
  await page.screenshot({ path: '/home/claude/scratch/v1.png', timeout: 90000 });
  await ev(() => { window.__ldFast = true; document.querySelector('#gamebox .gb-foot .btn.big').click(); }); await page.waitForTimeout(3000);
  await ev(async () => { const S = Linkdown.state; while (S.me.hand.filter(c => c.type === 'kin').length < 2) S.api.drawCard(S.me); await S.api.summon(0, 'def'); S.summoned = false; await S.api.summon(0, 'atk'); });
  await page.waitForTimeout(3000); await page.screenshot({ path: '/home/claude/scratch/v2.png', timeout: 90000 });
  console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
