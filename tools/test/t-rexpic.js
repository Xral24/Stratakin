const { open } = require('./harness'); const fs = require('fs');
(async () => { const h = await open(); const { ev, page } = h;
  await page.click('#s-new'); await page.fill('#s-seed', 'gal-1'); await page.waitForTimeout(150); await page.click('[data-jump="lost"]');
  for (let i = 0; i < 40; i++) { await page.waitForTimeout(1500); if (await ev(() => !!G.stats.lostMap)) break; } await page.waitForTimeout(1500);
  const urls = await ev((yaws) => { Wild.ensureApex(G.player); const p = G.player, L = G.world.lost; p.x = L.x; p.z = L.z - 12; Wild.ensureApex(p); const e = Wild.list.find(e => e.isApex); const out = []; for (const yw of yaws) { const cv = document.createElement('canvas'); const m = e.model; R.renderPortrait(cv, R.entityMesh('tp' + yw, (mb) => KIN.buildMesh(mb, m)), m, 560, { yaw: yw, pitch: -0.12 }); out.push(cv.toDataURL('image/png')); } return out; }, (process.argv[2] || '1.57,2.6').split(',').map(Number));
  urls.forEach((u, i) => fs.writeFileSync(`/home/claude/scratch/rexpic${i}.png`, Buffer.from(u.split(',')[1], 'base64'))); console.log(urls.length, h.errors.length); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
