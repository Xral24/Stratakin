// Sky showing through the ground along the railway and the station platform of the first village: the sky is made solid magenta,
// the camera walks the platform and the line out through the wall looking down at them, and every shot is kept. count-magenta.py reads them.
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  await ev(() => { const P = WebGL2RenderingContext.prototype; const da = P.drawArrays; P.drawArrays = function (m, f, c) { if (c === 3 && f === 0) return; return da.call(this, m, f, c); }; const cc = P.clearColor; P.clearColor = function (r, g, b, a) { return cc.call(this, 1, 0, 1, a); };
    G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.player.frozen = true; G.thirdPerson = false; G.world.time = 0.3; R.state.shadows = false; for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } });
  const rl = await ev(() => { const v = Village.townList()[0]; if (!v) return null; const L = Village.layout(v), r = L.rail; if (!r) return { none: true, v: { x: v.x, z: v.z, y: v.y, R: v.R } }; return { ax: r.ax, line: r.line, along0: r.along0, sgn: r.sgn, plat: r.plat, plat2: r.plat2, y: r.y, vx: v.x, vz: v.z, R: v.R }; });
  console.log('rail', JSON.stringify(rl)); if (!rl || rl.none) { await h.close(); return; }
  const at = (a, l) => rl.ax ? [a, l] : [l, a]; const shots = [];
  // along the platform and out along the line: from each side of the track, looking across and down at it
  for (let k = -4; k <= 40; k += 4) for (const side of [-1, 1]) { const a = rl.along0 + rl.sgn * k, [x, z] = at(a, rl.line + side * 3.2), [tx, tz] = at(a + rl.sgn * 1.5, rl.line); shots.push({ x, z, tx, tz, up: 2.4, name: `k${k}s${side}` }); }
  if (process.env.VIEWS) { shots.length = 0; for (const [px, pz, tx, tz, up, pitch] of JSON.parse(process.env.VIEWS)) shots.push({ x: px, z: pz, tx, tz, up: up || 1.6, pitch, name: `v${px},${pz}` }); } // absolute places to look from and at
  const lim = +(process.env.N || 99); let i = 0;
  for (const s of shots.slice(0, lim)) { const r = await ev((s) => { const p = G.player, w = G.world; p.x = s.x + 0.5; p.z = s.z + 0.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 99999); G.meshPass(9999); const gy = w.groundY(Math.floor(p.x), Math.floor(p.z), s.y0 || 90); p.y = gy + s.up; p.onGround = true;
      const dx = s.tx + 0.5 - p.x, dz = s.tz + 0.5 - p.z; p.yaw = Math.atan2(-dx, -dz); p.pitch = s.pitch != null ? s.pitch : -0.62; return { y: +p.y.toFixed(1), gy }; }, Object.assign({ y0: rl.y + 8 }, s));
    await page.waitForTimeout(+(process.env.WAIT || 2500)); await ev(() => { const t = document.getElementById('toasts'); if (t) t.innerHTML = ''; });
    await page.screenshot({ path: `/home/claude/holes2-${i}.png`, timeout: 120000 }); console.log(i, s.name, JSON.stringify(r)); i++; }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 4).join('\n') : 'none'); await h.close(); })();
