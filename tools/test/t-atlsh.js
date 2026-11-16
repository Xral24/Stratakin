const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.player.frozen = true; G.thirdPerson = false; for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } });
  await ev(() => { const a = Village.atlantis(), p = G.player, w = G.world; w.time = 0.5; p.x = a.x + 38; p.z = a.z + 0.5; p.y = a.y + 0.05; p.yaw = -Math.PI / 2; p.pitch = 0; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 5, 99999); for (let k = 0; k < 5; k++) Village.update(0.05, p, false); G.meshPass(9999); });
  await page.waitForTimeout(9000); await page.screenshot({ path: '/home/claude/sh-0.png', timeout: 150000 });
  await ev(() => { const a = Village.atlantis(), p = G.player, w = G.world; w.time = 0.97; p.x = a.x + 9.5; p.z = a.z + 13.5; p.yaw = Math.atan2(-(25 - 9), -(10 - 13)); p.pitch = 0.05; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 5, 99999); G.meshPass(9999); });
  await page.waitForTimeout(9000); await page.screenshot({ path: '/home/claude/sh-1.png', timeout: 150000 });
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 4).join('\n') : 'none'); await h.close(); })();
