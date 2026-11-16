const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  await ev(() => { R.render = () => {}; G.repelUntil = 0; const p = G.player, w = G.world, t = Village.townList()[0]; p.x = t.x + 0.5; p.z = t.z + 12.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 99999); p.y = t.y + 0.05; window.__log = []; });
  for (let i = 0; i < 9; i++) { await page.waitForTimeout(1000); const s = await ev(() => { const b = Village.active && Village.active.boss; return { battle: Battle.active, hailed: b && b.hailed, d: b && +Math.hypot(b.x - G.player.x, b.z - G.player.z).toFixed(1) }; }); console.log(i, JSON.stringify(s)); if (s.battle) break; }
  console.log('ERRORS:', h.errors.slice(0, 3).join(' | ') || 'none'); await h.close(); })();
