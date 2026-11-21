const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', 0); await h.calm(); const SH = process.env.SHOT;
  await ev(() => { window.__r = R.render; R.render = () => {}; G.repelUntil = performance.now() + 9e7; });
  const shot = async (name) => { if (!SH) return; await ev(() => { G.setPaused && G.setPaused(true); R.render = window.__r; }); await page.waitForTimeout(11000); await page.screenshot({ path: '/home/claude/scratch/' + name, timeout: 150000 }); await ev(() => { R.render = () => {}; G.setPaused && G.setPaused(false); }); };
  const camp = (t) => ev((t) => { const p = G.player, w = G.world; w.time = t; G.lastRest = 0; for (const k of G.kin) k.hp = 1; window.__d0 = G.dayCount || 0; G.onInteract ? 0 : 0; const fn = G.handleAct || G.act || null; return { hasCine: typeof Cine.play, night: G.isNightNow() }; }, t);
  // night: sleep to dawn
  console.log('night', JSON.stringify(await camp(0.85)));
  await ev(() => { G.restTo('fire', (slept) => { window.__woke = slept; for (const k of G.kin) k.hp = KIN.stats(k).hp; }); }); await page.waitForTimeout(2600);
  console.log(' mid', JSON.stringify(await ev(() => ({ on: Cine.active(), time: +G.world.time.toFixed(3), lapse: !!G.restLapse, title: (document.querySelector('#cine [data-k="title"]') || {}).textContent })))); await shot('rest-mid.png');
  await page.waitForTimeout(3600); console.log(' end', JSON.stringify(await ev(() => ({ on: Cine.active(), time: +G.world.time.toFixed(3), day: (G.dayCount || 0) - window.__d0, woke: window.__woke, lapse: !!G.restLapse })))); await shot('rest-end.png');
  // day: a couple of hours
  console.log('day', JSON.stringify(await camp(0.5))); await ev(() => { window.__woke = null; G.restTo('fire', (slept) => { window.__woke = slept; }); }); await page.waitForTimeout(800); await ev(() => Cine.stop()); await page.waitForTimeout(300);
  console.log(' skipped', JSON.stringify(await ev(() => ({ time: +G.world.time.toFixed(3), day: (G.dayCount || 0) - window.__d0, woke: window.__woke, lapse: !!G.restLapse }))));
  // just before midnight wraps the day when skipped at once
  console.log('wrap', JSON.stringify(await ev(() => { G.world.time = 0.9; const d = G.dayCount || 0; G.restTo('bed', () => {}); Cine.stop(); return { time: +G.world.time.toFixed(3), days: (G.dayCount || 0) - d }; })));
  console.log('after midnight', JSON.stringify(await ev(() => { G.world.time = 0.1; const d = G.dayCount || 0; G.restTo('bed', () => {}); Cine.stop(); return { time: +G.world.time.toFixed(3), days: (G.dayCount || 0) - d }; })));
  console.log('ERRORS:', h.errors.slice(0, 5).join(' | ') || 'none'); await h.close(); })();
