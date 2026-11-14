const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  const r = await ev(() => { const w = G.world, p = G.player; G.repelUntil = performance.now() + 9e7; G.explain = () => {}; w.time = 0.33; let best = null; const out = [];
    for (const v of Village.townList()) { const L = Village.layout(v), rl = L.rail; if (!rl) continue; const base = rl.ax ? v.x : v.z; let lo = 1e9, hi = -1e9;
      for (let d = v.R + 4; d <= v.R + 38; d++) { const a = base + rl.sgn * d; const [x, z] = rl.ax ? [a, rl.line] : [rl.line, a]; const hh = w.colInfo(U.mod(x, WORLD_W), U.mod(z, WORLD_W)).h; lo = Math.min(lo, hh); hi = Math.max(hi, hh); }
      const rel = (v.y - 1 - lo) - Math.max(0, hi - v.y) * 2; out.push(v.name + ' relief ' + (v.y - 1 - lo) + '/' + (hi - v.y + 1)); if (!best || rel > best.rel) best = { v, rl, rel }; }
    const v = best.v, rl = best.rl; p.x = v.x + 0.5; p.z = v.z + 0.5; p.y = v.y + 2; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 6, 9999); for (let i = 0; i < 4; i++) Village.update(0.5, p, false);
    const base = rl.ax ? v.x : v.z; let ok = 0, n = 0, wr = 0; for (let d = 1; d < 200; d++) { const a = base + rl.sgn * d; const [x, z] = rl.ax ? [a, rl.line] : [rl.line, a]; if (w.getBlock(x, v.y, z) === B.RAIL) { ok++; } let other = 0; for (let y = v.y - 14; y <= v.y + 14; y++) if (y !== v.y && w.getBlock(x, y, z) === B.RAIL) other++; if (other) n++; }
    const mid = base + rl.sgn * (v.R + 22); const [mx, mz] = rl.ax ? [mid, rl.line] : [rl.line, mid]; const side = rl.ax ? [0, 16] : [16, 0];
    p.frozen = true; G.thirdPerson = false; p.x = mx + side[0] + 0.5; p.z = mz + side[1] + 0.5; p.y = v.y + 2; p.yaw = Math.atan2(-(mx - p.x), -(mz - p.z)); p.pitch = -0.2; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 4, 9999); G.meshPass(999);
    return out.slice(0, 8).join('; ') + ' | chosen ' + v.name + ' railsAtLevel=' + ok + ' railsOffLevel=' + n; });
  console.log(r); await page.waitForTimeout(3500); await ev(() => { G.meshPass(999); document.getElementById('toasts').innerHTML = ''; }); await page.waitForTimeout(600); await page.screenshot({ path: (process.env.OUT || '/home/claude/') + 'rail.png' });
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
