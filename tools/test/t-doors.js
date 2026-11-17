const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  await ev(() => { window.__r = R.render; R.render = () => {}; G.repelUntil = performance.now() + 9e6; const v = Village.townList()[0], p = G.player, w = G.world; p.x = v.x + 0.5; p.z = v.z + 19.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 4, 99999); p.y = v.y + 0.05; window.__v = v; G.world.time = 0.35; setInterval(() => { if (v.boss) v.boss.fought = true; }, 20);
    window.__scan = () => { const v = window.__v, w = G.world, st = G.villageState[v.id], doors = (st.doors || []).concat(Village.layout(v).doors || []), wr = Village.wallRadiusOf(v); const sides = [0, 0, 0, 0]; for (let a = -wr; a <= wr; a++) { const c = [[v.x + wr, v.z + a], [v.x - wr, v.z + a], [v.x + a, v.z + wr], [v.x + a, v.z - wr]]; c.forEach(([x, z], i) => { const b = w.getBlock(x, v.y, z), b2 = w.getBlock(x, v.y + 1, z); if ((b === B.AIR || b === B.RAIL) && b2 === B.AIR) sides[i]++; }); }
      return { doors: doors.length, shut: doors.filter(d => w.getBlock(d[0], d[1], d[2]) === B.DOOR).length, openCols: sides, freed: !!st.freed, locked: doors[0] && Village.doorLocked(doors[0][0], doors[0][1], doors[0][2]), camp: G.camp && [Math.round(G.camp.x - v.x), Math.round(G.camp.z - v.z)] }; }; });
  await page.waitForTimeout(3000); console.log('held', JSON.stringify(await ev(() => window.__scan())));
  await ev(() => { const b = window.__v.boss; Wild.remove(b); Village.bossBeaten(b); }); await page.waitForTimeout(4500);
  console.log('film', JSON.stringify(await ev(() => window.__scan())));
  await page.waitForTimeout(9000);
  console.log('dawn', JSON.stringify(await ev(() => { const st = G.villageState[window.__v.id]; G.player.x += 400; st.lastVisit = (G.dayCount || 0) - 10; const a = Village.dawn().lines; st.lastVisit = (G.dayCount || 0) - 13; const b = Village.dawn().lines; return { warn: a, lost: b, freed: st.freed, bank: st.bank }; })));
  console.log('errors', JSON.stringify(h.errors.slice(0, 4))); await h.close(); })();
