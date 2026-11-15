// footpaths: how long they take to lay out, and what one looks like from where he walks
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.player.frozen = true; G.thirdPerson = true; G.world.time = 0.42; for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } });
  const info = await ev(() => { const w = G.world, v = Village.def; const t0 = performance.now(); w.trailWear(v.x, v.z); const ms = performance.now() - t0; const out = [];
    for (const r of [45, 80, 130, 200]) { let best = null; for (let a = 0; a < 6.283; a += 1.5 / r) { const x = Math.round(v.x + Math.cos(a) * r), z = Math.round(v.z + Math.sin(a) * r); if (w.trailWear(x, z) > 0.9 && w.colInfo(x, z).h > SEA + 1 && !out.some(o => Math.hypot(o[0] - x, o[1] - z) < 30)) { best = [x, z]; break; } }
      if (best) { let nx = null; for (let a = 0; a < 6.283; a += 0.1) { const x = Math.round(best[0] + Math.cos(a) * 9), z = Math.round(best[1] + Math.sin(a) * 9); if (w.trailWear(x, z) > 0.8 && Math.hypot(x - v.x, z - v.z) > Math.hypot(best[0] - v.x, best[1] - v.z)) { nx = [x, z]; break; } } out.push([best[0], best[1], nx ? nx[0] : best[0] + 1, nx ? nx[1] : best[1]]); } }
    return { ms: Math.round(ms), spots: out }; });
  console.log(JSON.stringify(info));
  for (let i = 0; i < info.spots.length; i++) { await ev((s) => { const p = G.player, w = G.world; w.ensureAround(Math.floor(s[0] / CH), Math.floor(s[1] / CH), 4, 9999); p.x = s[0] + 0.5; p.z = s[1] + 0.5; p.y = w.colInfo(s[0], s[1]).h + 1.02; p.onGround = true; p.yaw = Math.atan2(-(s[2] - s[0]), -(s[3] - s[1])); p.pitch = -0.22; if (G.orbit) { G.orbit.yaw = p.yaw; G.orbit.pitch = p.pitch; } G.meshPass(999); }, info.spots[i]);
    await page.waitForTimeout(2400); await ev(() => { const t = document.getElementById('toasts'); if (t) t.innerHTML = ''; }); await page.screenshot({ path: `/home/claude/trail-${i}.png` }); }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
