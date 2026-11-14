const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3');
  for (const [nm, up, pitch, dx, dz, yaw] of [['q-old', 9, -0.3, -20, -12, 0], ['q-garden', 9, -0.3, 20, -12, 0], ['q-merchant', 9, -0.3, -20, 44, 0], ['q-craft', 9, -0.3, 20, 44, 0]]) {
    const r = await ev(([up, pitch, dx, dz, yaw]) => { const p = G.player, w = G.world; const v = Village.markers(p.x, p.z, 10).filter(m => m.kind === 'village' && /^Great /.test(m.name))[0]; if (!v) return 'none';
      G.repelUntil = performance.now() + 9e5; p.frozen = true; w.time = 0.33; p.x = v.x + 0.5 + dx; p.z = v.z + dz; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 5, 9999); for (let i = 0; i < 3; i++) Village.update(0.5, p, false);
      const rec = Village.active; p.y = (rec ? rec.y : w.groundY(Math.floor(p.x), Math.floor(p.z)) + 1) + up; p.yaw = yaw; p.pitch = pitch; G.thirdPerson = false; G.meshPass(999); const L = rec && Village.layoutOf ? Village.layoutOf(rec) : null; return v.name; }, [up, pitch, dx, dz, yaw]);
    console.log(nm, r); await page.waitForTimeout(3000); await page.screenshot({ path: (process.env.OUT || '/tmp/') + nm + '.png' }); }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
