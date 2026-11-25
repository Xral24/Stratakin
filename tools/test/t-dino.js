const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h;
  await page.click('#s-new'); await page.fill('#s-seed', 'gal-1'); await page.waitForTimeout(150); await page.click('[data-jump="lost"]');
  for (let i = 0; i < 40; i++) { await page.waitForTimeout(1500); if (await ev(() => !!G.stats.lostMap)) break; } await page.waitForTimeout(1500);
  const r = await ev(() => { const p = G.player, w = G.world, L = w.lost; G.repelUntil = performance.now() + 9e5; const tx = L.x + 60, tz = L.z + 40; w.ensureAround(Math.floor(tx / 16), Math.floor(tz / 16), 4, 9999); p.x = tx + 0.5; p.z = tz + 0.5; p.y = w.groundY(Math.floor(tx), Math.floor(tz)) + 1.1; Wild.ensureApex(p);
    const rex = Wild.list.find(e => e.isApex); const out = {};
    { const a = Wild.makeEntity(rex.kin.sp, 50, rex.x + 30, rex.y, rex.z, {}), b = Wild.makeEntity(rex.kin.sp, 50, rex.x + 30.5, rex.y, rex.z, {}); a.y = b.y = w.groundY(Math.floor(a.x), Math.floor(a.z)) + 1; a.dazed = b.dazed = 60; Wild.list.push(a, b); for (let i = 0; i < 200; i++) Wild.update(0.05, p, i * 0.05, false); out.apart = +Math.hypot(a.x - b.x, a.z - b.z).toFixed(2); out.r = +(a.model.radius * 0.5).toFixed(2); }
    { let tx = null; for (let dx = -40; dx <= 40 && !tx; dx++) for (let dz = -40; dz <= 40 && !tx; dz++) { const X = Math.floor(p.x) + dx, Z = Math.floor(p.z) + dz, t = w.treeAt(X, Z, w.colInfo(X, Z)); if (t && t.type === 'jungle' && (t.size === 'tree' || t.size === 'big') && w.getBlock(X, w.colInfo(X, Z).h + 2, Z) === B.JLOG) tx = [X, Z, w.colInfo(X, Z).h]; }
      out.tree = tx; if (tx) { const c = Wild.makeEntity(rex.kin.sp, 50, tx[0] - 6.5, tx[2] + 1, tx[1] + 0.5, {}); const res = []; for (const d of [6.5, 4, 3, 2.2, 1.5, 1]) res.push([d, Wild._ground(tx[0] + 0.5 - d, tx[2] + 1, tx[1] + 0.5, c) != null]); out.canStandAtDist = res; } }
    return out; });
  console.log(JSON.stringify(r)); console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
