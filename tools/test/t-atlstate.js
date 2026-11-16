const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  for (const t of [0.97, 0.5]) { const s = await ev((t) => { const a = Village.atlantis(), p = G.player, w = G.world; G.player.frozen = true; w.time = t; p.x = a.x + 38; p.z = a.z + 0.5; p.y = a.y + 0.05; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 4, 99999); G.meshPass(9999); return 1; }, t);
    await page.waitForTimeout(12000);
    const r = await ev(() => { const s = R.state; return { time: G.world.time, inAtl: s.inAtl, dayLight: s.dayLight, sun: s.sun, sunAmt: s.sunAmt, shadowOn: s.shadowOn, shadows: s.shadows, skyPass: s.skyPass, lean: s.autoLean, amb: s.ambient, tint: s.tint, fog: s.fogColor }; }); console.log(JSON.stringify(r)); }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 4).join('\n') : 'none'); await h.close(); })();
