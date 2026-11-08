const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3');
  const r = await ev(() => { const st = Village.townList(); return st.map(v => `${v.name} ${v.size} R${v.R} shops:${Village.layout(v).shops.map(s => s.kind).join(',')} homes:${Village.layout(v).homes.length}`).slice(0, 4); });
  console.log(r);
  for (const [nm, up, pitch, back, yaw] of [['start-air', 45, -0.8, 40, 0], ['start-street', 1.6, -0.08, 20, 0]]) {
    await ev(([up, pitch, back, yaw]) => { const p = G.player, w = G.world, v = G.village; G.repelUntil = performance.now() + 9e5; p.frozen = true; w.time = 0.33; p.x = v.x + 0.5; p.z = v.z + back; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 5, 9999); for (let i = 0; i < 3; i++) Village.update(0.5, p, false); p.y = v.y + up; p.yaw = yaw; p.pitch = pitch; G.meshPass(999); }, [up, pitch, back, yaw]);
    await page.waitForTimeout(2500); await page.screenshot({ path: nm + '.png' }); }
  console.log(await ev(() => { const v = G.village; const rec = Village.townList()[0]; return { npcs: (Village.active || {}).npcs ? Village.active.npcs.length : 'n/a', closed: JSON.stringify((G.villageState[(Village.active || {}).id] || {}).closed) }; }));
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
