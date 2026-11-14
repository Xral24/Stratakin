const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-1'); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.world.time = 0.32; Citadel.C().open = true; });
  for (const [nm, which, ox, oz, up, look] of [['storm-a', 'storm', 8, -27, 4, 6], ['storm-b', 'storm', 0, -6, 2, 6]]) {
    await ev(([which, ox, oz, up, look]) => { const p = G.player, w = G.world; let k; if (which === 'storm') k = Sky.sites().find(s => s.id === 'stormspire'); else { const c = Citadel.site(); k = { x: c.x + 17, z: c.z, y: c.y, cit: c }; }
      Keeps.gloom = () => 0; Citadel.gloom = () => 0; Sky.gloom = () => 0; p.frozen = true; G.thirdPerson = false; p.flying = false;
      p.x = k.x + 0.5; p.z = k.z + 0.5; p.y = k.y + 3; w.ensureAround(Math.floor(k.x / CH), Math.floor(k.z / CH), 4, 9999); if (k.cit) for (let i = 0; i < 4; i++) Citadel.update(1, p);
      p.x = k.x + ox + 0.5; p.z = k.z + oz + 0.5; p.y = k.y + up; const tx = k.x + (k.cit && ox > 30 ? 60 : 0); p.yaw = Math.atan2(-(tx - p.x), -(k.z - p.z)); p.pitch = Math.atan2((k.y + look) - p.y, Math.hypot(tx - p.x, oz)) * 0.8; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 4, 9999); G.meshPass(999); document.getElementById('toasts').innerHTML = ''; }, [which, ox, oz, up, look]);
    await page.waitForTimeout(3500); await ev(() => { G.meshPass(999); document.getElementById('toasts').innerHTML = ''; }); await page.waitForTimeout(800); await page.screenshot({ path: (process.env.OUT || '/tmp/') + nm + '.png' }); }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
