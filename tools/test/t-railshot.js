const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.player.frozen = true; G.thirdPerson = true; G.world.time = 0.4; for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } });
  const rails = await ev(() => { const w = G.world, v = Village.def; for (let cx = -6; cx <= 6; cx++) for (let cz = -6; cz <= 6; cz++) w.ensureAround(Math.floor(v.x / CH) + cx, Math.floor(v.z / CH) + cz, 1, 9999);
    const out = []; for (let dx = -90; dx <= 90; dx++) for (let dz = -90; dz <= 90; dz++) for (let y = v.y - 2; y <= v.y + 2; y++) if (w.getBlock(v.x + dx, y, v.z + dz) === B.RAIL) { let roof = 0; for (let yy = y + 1; yy < y + 14; yy++) if (w.getBlock(v.x + dx, yy, v.z + dz) !== B.AIR) { roof = 1; break; } out.push([v.x + dx, y, v.z + dz, roof]); }
    return out; });
  rails.sort((a, b) => a[0] - b[0] || a[2] - b[2]); const alongX = rails[rails.length - 1][0] - rails[0][0] > rails[rails.length - 1][2] - rails[0][2];
  const firstRoof = rails.findIndex(r => r[3]); console.log('rails', rails.length, 'alongX', alongX, 'first roofed', firstRoof);
  const picks = [3, 12, Math.max(0, (firstRoof < 0 ? 30 : firstRoof) - 5), Math.min(rails.length - 2, (firstRoof < 0 ? 40 : firstRoof) + 12)];
  for (let i = 0; i < picks.length; i++) { const r = rails[picks[i]];
    await ev((a) => { const p = G.player, w = G.world; p.x = a[0] + 0.5; p.z = a[2] + 0.5; p.y = a[1] + 0.02; p.yaw = a[4] ? -Math.PI / 2 : Math.PI; p.pitch = -0.16; if (G.orbit) { G.orbit.yaw = p.yaw; G.orbit.pitch = p.pitch; } w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 4, 9999); G.meshPass(999); }, [...r, alongX]);
    await page.waitForTimeout(2600); await ev(() => { const t = document.getElementById('toasts'); if (t) t.innerHTML = ''; }); await page.screenshot({ path: `/home/claude/railp-${i}.png` }); }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
