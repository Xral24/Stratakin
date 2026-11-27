const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame('gal-1'); await h.calm();
  await ev(() => { window.__ldFast = true; Linkdown.play({ practice: true, mode: 'friendly', champ: 'Old Vruk', tier: 3, skill: 0.6, world: 'moon' }); }); await page.waitForTimeout(3000);
  await page.screenshot({ path: '/home/claude/scratch/m1.png', timeout: 90000 });
  await ev(() => document.querySelector('#gamebox .gb-foot .btn.big').click()); await page.waitForTimeout(2000);
  const r = await ev(() => { const S = Linkdown.state; const f = S.ai.deck.concat(S.ai.hand).filter(c => c.type === 'kin'); const m = S.me.deck.concat(S.me.hand).filter(c => c.type === 'kin');
    return { foe: f.map(c => KIN.name(c.k) + ':' + (c.k.sp.home && c.k.sp.home.body) + ':' + c.away + ':' + c.atk), me: m.map(c => KIN.name(c.k) + ':' + (c.k.sp.home && c.k.sp.home.body) + ':' + c.away + ':' + c.atk) }; });
  console.log(JSON.stringify(r)); console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
