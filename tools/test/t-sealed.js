const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame('gal-1'); await h.calm();
  const r = await ev(() => { G.shards = 5000; const n0 = G.kin.length + G.box.length; const a = Village.buy({}, { service: 'sealed', price: 900 }); const b = Village.buy({}, { service: 'sealed', price: 900 });
    const k = G.kin[G.kin.length - 1]; return { a, b, shards: G.shards, n: G.kin.length + G.box.length - n0, k: KIN.name(k), rar: k.sp.rarity, card: !!k.card }; });
  console.log(JSON.stringify(r)); await page.waitForTimeout(2500); await page.screenshot({ path: '/home/claude/scratch/sealed.png' });
  console.log('errors', JSON.stringify(h.errors)); await h.close(); })();
