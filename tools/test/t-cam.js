const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  const which = process.env.WHICH || 'wild';
  if (which === 'tyrant') { await ev(() => { G.repelUntil = 0; const p = G.player, w = G.world, t = Village.townList()[0]; p.x = t.x + 0.5; p.z = t.z + 12.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 99999); p.y = t.y + 0.05; }); await page.waitForTimeout(6000);
    console.log(JSON.stringify(await ev(() => { G.world.time = 0.4; G.trainerLevel = 40; const v = Village.active, b = v && v.boss; if (!b) return 'no boss'; const p = G.player; p.x = b.x + 4; p.z = b.z + 3; Battle.start(b, false); return 'tyrant'; }))); }
  else console.log(JSON.stringify(await ev(() => { G.world.time = 0.4; G.trainerLevel = 40; const p = G.player; let ws = Wild.list.filter(q => !q.isBoss && !q.aquatic && !q.high); const w = ws[0]; if (!w) return 'none'; p.x = w.x + 1.5; p.z = w.z + 1; p.y = w.y + 0.3; Battle.start(w, false); return KIN.name(w.kin); })));
  await ev(() => { window.__r = R.render; R.render = () => {}; }); await page.waitForTimeout(3000); await ev(() => { R.render = window.__r; }); await page.waitForTimeout(14000);
  console.log(JSON.stringify(await ev(() => { const m = Battle.mineEntity, w = Wild.list.find(q => q === Battle.wildEntity) || Battle.wildEntity; return { active: Battle.active, sep: m && w ? +Math.hypot(m.x - w.x, m.z - w.z).toFixed(1) : null }; })));
  await page.screenshot({ path: `/home/claude/scratch/cam-${which}.png`, timeout: 150000 });
  console.log('ERRORS:', h.errors.slice(0, 3).join(' | ') || 'none'); await h.close(); })();
