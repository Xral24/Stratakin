const { open } = require('./harness'); const fs = require('fs');
(async () => { const h = await open(); const { ev, page } = h;
  await page.click('#s-new'); await page.fill('#s-seed', 'gal-1'); await page.waitForTimeout(150); await page.click('[data-jump="lost"]');
  for (let i = 0; i < 40; i++) { await page.waitForTimeout(1500); if (await ev(() => !!G.stats.lostMap)) break; } await page.waitForTimeout(1500);
  await ev(() => Cards.preload(Object.values(Cards.BG).concat(['assets/card_x_rex.jpg'])));
  const urls = await ev(() => { const p = G.player, L = G.world.lost; p.x = L.x; p.z = L.z - 12; Wild.ensureApex(p); const rex = Wild.list.find(e => e.isApex).kin; rex.holo = true;
    const out = [], pick = (r) => G.kin.find(k => (k.sp.rarity || 0) === r);
    const base = pick(3) || pick(2) || G.kin[2];
    const mk = (id, o) => Object.assign({}, base, { id }, o);
    const list = [[mk(101, { pose: 'stride' }), 'Caught in the long grass, day 9', { finish: 'normal', first: true }], [mk(2202, { skin: 'dusk', pose: 'roar' }), 'Caught on a riverbank at dusk, day 40', { finish: 'rare', time: 'dusk' }], [mk(30303, { skin: 'tide', pose: 'crouch' }), 'Caught by the sea, day 58', { finish: 'super' }], [mk(4440, { skin: 'gilded', pose: 'glance' }), 'Caught on a peak at night, day 77', { finish: 'secret', time: 'night' }]];
    out.push(JSON.stringify(list.map(([k]) => [KIN.name(k), k.sp.rarity])));
    for (const [k, w, o] of list) { const cv = document.createElement('canvas'); Cards.draw(cv, k, Object.assign({ where: w }, o)); out.push(cv.toDataURL('image/png')); }
    return out; });
  console.log(urls.shift()); urls.forEach((u, i) => fs.writeFileSync(`/home/claude/scratch/card${i}.png`, Buffer.from(u.split(',')[1], 'base64'))); console.log(urls.length, JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
