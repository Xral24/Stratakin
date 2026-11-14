const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-1'); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.stats.holdsTold = true; G.stats.holdFightTold = true; G.explain = () => {}; G.world.time = 0.32; });
  const core = process.argv[2] === 'core';
  for (const [nm, ox, oz, up] of [['hold-a', 12, -30, 9], ['hold-b', -24, 22, 12], ['hold-c', 0, -5, 2]]) {
    await ev(([ox, oz, up, core]) => { const p = G.player, w = G.world; const ks = Keeps.sites(); const k = core ? ks.find(k => k.core) : ks.find(k => !k.core); Keeps.gloom = () => 0; p.frozen = true; G.thirdPerson = false;
      p.x = k.x + 0.5; p.z = k.z + 0.5; p.y = k.y + 2; w.ensureAround(Math.floor(k.x / CH), Math.floor(k.z / CH), 3, 9999); for (let i = 0; i < 4; i++) Keeps.update(1, p);
      p.x = k.x + ox + 0.5; p.z = k.z + oz + 0.5; p.y = k.y + up; p.yaw = Math.atan2(-(k.x - p.x), -(k.z - p.z)); p.pitch = Math.atan2((k.y + 6) - p.y, Math.hypot(ox, oz)) * 0.8; G.meshPass(999); document.getElementById('toasts').innerHTML = ''; }, [ox, oz, up, core]);
    await page.waitForTimeout(3500); await page.screenshot({ path: (process.env.OUT || '/tmp/') + nm + '.png' }); }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
