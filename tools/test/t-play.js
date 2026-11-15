const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.player.frozen = true; try { G.player.inv.clear(); } catch (e) {} for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } });
  // [dx, dz from village centre, yaw, pitch, time of day, third person]
  // [dx, dz from village centre, look-at dx, look-at dz, pitch, time of day]
  const views = (process.env.VIEWS ? JSON.parse(process.env.VIEWS) : [[3, 4, -8, -8, -0.02, 0.4], [0.5, 24, 0, 0, -0.02, 0.4], [-11, -11, -20, -20, 0.1, 0.4], [-3, -3, 9, 9, 0.0, 0.74]]);
  for (let i = 0; i < views.length; i++) { await ev((a) => { const p = G.player, w = G.world, v = Village.def || G.__v; G.__v = v; G.world.time = a[5]; G.thirdPerson = true; p.x = v.x + a[0] + 0.5; p.z = v.z + a[1] + 0.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 4, 9999); let gy = w.groundY(Math.floor(p.x), Math.floor(p.z)); p.y = gy + 1.05; p.yaw = Math.atan2(-(v.x + a[2] - p.x), -(v.z + a[3] - p.z)); p.pitch = a[4]; G.meshPass(999); }, views[i]); await page.waitForTimeout(3000); await ev(() => { const t = document.getElementById('toasts'); if (t) t.innerHTML = ''; }); await page.screenshot({ path: `/home/claude/play-${i}.png` }); }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
