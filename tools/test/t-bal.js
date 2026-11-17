const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  const list = await ev(() => { R.render = () => {}; G.world.time = 0.35; return Village.townList().map(v => [v.name, v.size, Village.bossLevel(v)]); }); console.log(JSON.stringify(list));
  for (const size of ['hamlet', 'town', 'city']) { const idx = list.findIndex(s => s[1] === size);
    await ev((i) => { const v = Village.townList()[i], p = G.player, w = G.world; p.x = v.x + v.R + 30.5; p.z = v.z + 0.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 4, 99999); p.y = w.groundY(Math.floor(p.x), Math.floor(p.z), 150) + 1.2; for (const e of [...Wild.list]) if (!e.isBoss) Wild.remove(e); G.repelUntil = 0; }, idx);
    await page.waitForTimeout(9000);
    console.log(size, JSON.stringify(await ev((i) => { const v = Village.townList()[i]; return { boss: v.boss && v.boss.kin.level, gang: (v.gang || []).map(g => g.kin.level), wild: Wild.list.filter(e => !e.isBoss && Math.hypot(e.x - v.x, e.z - v.z) < 130).map(e => e.kin.level).sort((a, b) => a - b), toast: [...document.querySelectorAll('.toast')].map(t => t.textContent).filter(t => t.includes('held at')).slice(-1) }; }, idx))); }
  console.log('errors', JSON.stringify(h.errors.slice(0, 4))); await h.close(); })();
