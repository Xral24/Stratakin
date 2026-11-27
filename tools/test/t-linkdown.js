const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame('gal-1'); await h.calm();
  await ev(() => { const sps = KIN.dex('earth').filter(s => !s.fusion && s.home && (s.rarity||0) <= 2); for (let i = 0; i < 5; i++) G.addKin(KIN.create(sps[i * 7 % sps.length], 12 + i)); G.kin[2].card = { finish: 'rare' }; G.kin[3].card = { finish: 'super' }; G.kin[4].card = { finish: 'ultra' }; });
  await ev(() => { Linkdown.play({ mode: 'stake', champ: 'Pip Hollis', tier: 1, skill: 0.5, villageId: 'x' }); });
  await page.waitForTimeout(800); await page.screenshot({ path: '/home/claude/scratch/ld1.png' });
  // stake the last picked card
  await ev(() => { const el = [...document.querySelectorAll('.ld-pk.on')].pop(); el.click(); });
  await page.waitForTimeout(300); await ev(() => document.querySelector('#gamebox .gb-foot .btn.big').click());
  await page.waitForTimeout(600); await page.screenshot({ path: '/home/claude/scratch/ld2.png' });
  for (let t = 0; t < 5; t++) {
    await ev(() => { const h = document.querySelector('.ld-h'); h.click(); });
    await ev((t) => { document.querySelectorAll('.ld-lane')[t % 3].click(); }, t);
    await ev(() => { const b = [...document.querySelectorAll('#gamebox .gb-foot .btn')].find(b => b.textContent === 'Flip'); b.click(); });
    await page.waitForTimeout(250);
    await ev(() => { const k = [...document.querySelectorAll('#gamebox .gb-foot .btn')].find(b => b.textContent.startsWith('Keep')); if (k) k.click(); });
    if (t === 2) await page.screenshot({ path: '/home/claude/scratch/ld3.png' });
  }
  await page.waitForTimeout(500); await page.screenshot({ path: '/home/claude/scratch/ld4.png' });
  console.log(JSON.stringify(await ev(() => ({ say: document.querySelector('#gamebox .gb-say').textContent, lost: (G.stats.ldLost || []).length, n: G.kin.length, stats: G.stats.linkdown }))));
  console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
