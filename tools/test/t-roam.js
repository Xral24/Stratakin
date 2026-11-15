// what he sees walking about: stand on open ground at spots round the start town where the land is at its steepest, facing uphill, at playing height
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  const body = process.env.BODY; if (body) { await ev((b) => { G.travel(b); }, body); await page.waitForTimeout(9000); }
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.player.frozen = true; G.thirdPerson = true; G.world.time = 0.42; for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } });
  const N = +(process.env.N || 8), mode = process.env.MODE || 'steep';
  const spots = await ev((a) => { const w = G.world, p = G.player; const c = Village.def && !a.body ? Village.def : { x: Math.floor(p.x), z: Math.floor(p.z) }; const cand = [];
    for (let i = 0; i < 2600; i++) { const r = 30 + U.hash3(i, 1, 5, 77) * 230, an = U.hash3(i, 2, 5, 77) * 6.283; const x = Math.round(c.x + Math.cos(an) * r), z = Math.round(c.z + Math.sin(an) * r); const I = w.colInfo(x, z); if (I.h < SEA + 1) continue;
      const gx = w.colInfo(x + 2, z).h - w.colInfo(x - 2, z).h, gz = w.colInfo(x, z + 2).h - w.colInfo(x, z - 2).h; const g = Math.hypot(gx, gz) / 4; let water = 0; if (a.mode === 'shore') { for (const [dx, dz] of [[5, 0], [-5, 0], [0, 5], [0, -5]]) if (w.colInfo(x + dx, z + dz).h < SEA) water++; if (!water || I.h > SEA + 2) continue; }
      cand.push([x, z, I.h, a.mode === 'shore' ? water : g, Math.atan2(-gx, -gz)]); }
    cand.sort((u, v) => v[3] - u[3]); const out = []; for (const s of cand) { if (out.length >= a.N) break; if (out.some(o => Math.hypot(o[0] - s[0], o[1] - s[1]) < 26)) continue; out.push(s); } return out; }, { N, mode, body: body || null });
  console.log('spots', JSON.stringify(spots.map(s => [s[0], s[1], s[2], +s[3].toFixed(2)])));
  for (let i = 0; i < spots.length; i++) { const ok = await ev((s) => { const p = G.player, w = G.world; w.ensureAround(Math.floor(s[0] / CH), Math.floor(s[1] / CH), 4, 9999);
      let x = s[0], z = s[1], y = null; for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [0, 2], [-2, 0], [0, -2], [2, 2], [-2, -2]]) { const gy = w.colInfo(s[0] + dx, s[1] + dz).h; let clear = true; for (let yy = gy + 1; yy < gy + 8; yy++) { const b = w.getBlock(s[0] + dx, yy, s[1] + dz); if (b !== B.AIR && isSolid(b)) { clear = false; break; } } if (clear && isSolid(w.getBlock(s[0] + dx, gy, s[1] + dz))) { x = s[0] + dx; z = s[1] + dz; y = gy + 1.02; break; } }
      if (y == null) return false; p.x = x + 0.5; p.z = z + 0.5; p.y = y; p.onGround = true; p.vx = p.vy = p.vz = 0; p.yaw = s[4]; p.pitch = -0.1; if (G.orbit) { G.orbit.yaw = p.yaw; G.orbit.pitch = p.pitch; } G.meshPass(999); return true; }, spots[i]);
    await page.waitForTimeout(ok ? 2400 : 100); await ev(() => { const t = document.getElementById('toasts'); if (t) t.innerHTML = ''; }); await page.screenshot({ path: `/home/claude/roam-${i}.png` }); }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
