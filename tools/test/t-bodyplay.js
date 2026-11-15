const { open } = require('./harness');
(async () => { const body = process.env.BODY || 'moon'; const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  await ev((body) => { G.travel(body); }, body); await page.waitForTimeout(9000);
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.player.frozen = true; G.thirdPerson = true; G.world.time = 0.38; for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } });
  const T = await ev(() => { const p = G.player; const ms = Village.markers(p.x, p.z, 10).filter(m => m.kind === 'village').sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z)); return ms.slice(0, 1).map(m => [m.name, m.x, m.z]); });
  const t = T[0];
  const views = process.env.VIEWS ? JSON.parse(process.env.VIEWS) : [[2, 2, -8, -8, -0.03], [14, 3, 4, 3, -0.03], [45, 30, 70, 50, -0.05], [-40, 45, -70, 70, -0.05]];
  for (let i = 0; i < views.length; i++) { await ev((a) => { const p = G.player, w = G.world; const [t, v] = a; p.x = t[1] + 0.5 + v[0]; p.z = t[2] + 0.5 + v[1]; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 4, 9999); for (let k = 0; k < 3; k++) Village.update(0.5, p, false); p.y = w.groundY(Math.floor(p.x), Math.floor(p.z)) + 1.05; p.yaw = Math.atan2(-(t[1] + v[2] - p.x), -(t[2] + v[3] - p.z)); p.pitch = v[4]; G.meshPass(999); }, [t, views[i]]); await page.waitForTimeout(2800); await ev(() => { const t = document.getElementById('toasts'); if (t) t.innerHTML = ''; }); await page.screenshot({ path: `/home/claude/${body}p-${i}.png` }); }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
