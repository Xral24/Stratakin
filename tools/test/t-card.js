const { open } = require('./harness'); const fs = require('fs');
(async () => { const h = await open(); const { ev, page } = h;
  await page.click('#s-new'); await page.fill('#s-seed', 'gal-1'); await page.waitForTimeout(150); await page.click('[data-jump="lost"]');
  for (let i = 0; i < 40; i++) { await page.waitForTimeout(1500); if (await ev(() => !!G.stats.lostMap)) break; } await page.waitForTimeout(1500);
  await ev(() => Cards.preload(['assets/card_bg_lost.jpg', 'assets/card_bg_meadow.jpg', 'assets/card_x_rex.jpg']));
  const urls = await ev(() => { const p = G.player, L = G.world.lost; p.x = L.x; p.z = L.z - 12; Wild.ensureApex(p); const rex = Wild.list.find(e => e.isApex).kin; rex.holo = true;
    const out = [], pick = (r) => G.kin.find(k => (k.sp.rarity || 0) === r);
    const list = [[rex, 'Netted in the Lost World, autumn, day 212'], [pick(0) || G.kin[0], 'Caught in a summer meadow, day 3'], [pick(1) || pick(2) || G.kin[1], 'Caught on a riverbank at dusk, day 40'], [Object.assign({}, pick(3) || pick(2) || G.kin[2], { shiny: true, holo: true }), 'A shining one, under a full moon, day 77']];
    out.push(JSON.stringify(list.map(([k]) => [KIN.name(k), k.sp.rarity])));
    for (const [k, w] of list) { const cv = document.createElement('canvas'); Cards.draw(cv, k, { where: w }); out.push(cv.toDataURL('image/png')); }
    return out; });
  console.log(urls.shift()); urls.forEach((u, i) => fs.writeFileSync(`/home/claude/scratch/card${i}.png`, Buffer.from(u.split(',')[1], 'base64'))); console.log(urls.length, JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
