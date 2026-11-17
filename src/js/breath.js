// Breath you can see. In the snow and on the high mountain every breath shows. Run hard for a while and you pant a little cloud anywhere.
// Whatever you ride or fly snorts the same way when it is working or cold. Puffs are left behind in the world, not stuck to the screen.
const Breath = (() => {
  let G = null, cv = null, g = null, W = 0, H = 0, DPR = 1, puffs = [], cold = false, coldT = 0, run = 0, tMe = 1, tMount = 0.6, force = false;
  function init(game) { G = game; puffs = []; run = 0; if (!cv) { cv = document.createElement('canvas'); cv.id = 'breath'; cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;'; const gl = document.getElementById('gl'); gl.parentNode.insertBefore(cv, gl.nextSibling); g = cv.getContext('2d'); } }
  function fit() { const w = window.innerWidth, h = window.innerHeight, d = Math.min(2, window.devicePixelRatio || 1); if (w !== W || h !== H || d !== DPR) { W = w; H = h; DPR = d; cv.width = Math.round(w * d); cv.height = Math.round(h * d); } }
  function puff(x, y, z, dx, dy, dz, size, a) { if (puffs.length > 40) puffs.shift(); puffs.push({ x, y, z, vx: dx, vy: dy, vz: dz, t: 0, life: 1.5 + Math.random() * 0.5, s: size, a }); }
  function update(dt, p) { if (!cv) return; fit(); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
    const w = G.world, live = !G.paused && !Battle.active && !p.inWater && p.hp > 0;
    coldT -= dt; if (coldT <= 0) { coldT = 0.6; const b = w.biomeAt ? w.biomeAt(Math.floor(p.x), Math.floor(p.z)) : null; cold = G.worldId === 'earth' && (b === BIOME.SNOW || (b === BIOME.MOUNTAIN && p.y >= 66)) && !(w.getBlock(Math.floor(p.x), Math.floor(p.y + 1), Math.floor(p.z)) === B.WATER); if (force) cold = true; }
    const sp = Math.hypot(p.vx, p.vz), riding = !!p.mount, air = G.worldId === 'earth' || G.worldId === 'halo' || G.worldId === 'lost';
    /* how winded you are: builds while you run on your own legs, drains when you ease off */
    if (!riding && !p.flying && sp > 4.6) run = Math.min(14, run + dt); else run = Math.max(0, run - dt * 1.6); const winded = run > 6;
    if (live && air) { const f = U.forwardVec(p.yaw, 0);
      if (cold || winded) { tMe -= dt; if (tMe <= 0) { tMe = winded ? 0.85 : 3.1; const e = p.eye(), n = cold ? 3 : 2; /* out of the mouth: just below the eyes and a hand in front, drifting on ahead and up */
          for (let i = 0; i < n; i++) puff(e.x + f[0] * 0.42 + (Math.random() - 0.5) * 0.05, e.y - 0.2 + (Math.random() - 0.5) * 0.04, e.z + f[2] * 0.42 + (Math.random() - 0.5) * 0.05, f[0] * (0.7 + i * 0.25) + p.vx * 0.6, 0.16 + Math.random() * 0.1, f[2] * (0.7 + i * 0.25) + p.vz * 0.6, 0.07, cold ? 0.42 : 0.2); } }
      if (riding) { const work = sp > 3.5 || p.flying; if (cold || work) { tMount -= dt; if (tMount <= 0) { tMount = cold && !work ? 2.6 : 1.15; const mm = KIN.model(p.mount.sp, p.mount.stage), hb = mm.bones && mm.bones[1], pv = hb && hb.piv ? hb.piv : [0, mm.height * 0.7, mm.height * 0.4], hx = p.x + f[0] * (pv[2] + mm.height * 0.22), hz = p.z + f[2] * (pv[2] + mm.height * 0.22), hy = p.y + (mm.hover || 0) + pv[1] - mm.height * 0.06, rx = -f[2], rz = f[0], k = Math.max(0.6, Math.min(2.2, mm.height * 0.6));
            /* a snort: one from each nostril, down and forward, then it rolls up */
            for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) puff(hx + rx * sd * 0.09 * k, hy, hz + rz * sd * 0.09 * k, f[0] * (1.1 + i * 0.5) + rx * sd * 0.35 + p.vx * 0.7, -0.15 + i * 0.1, f[2] * (1.1 + i * 0.5) + rz * sd * 0.35 + p.vz * 0.7, 0.09 * k, cold ? 0.45 : 0.24); } } } }
    for (let i = puffs.length - 1; i >= 0; i--) { const q = puffs[i]; q.t += dt; if (q.t >= q.life) { puffs.splice(i, 1); continue; } const dr = Math.exp(-dt * 2.2); q.vx *= dr; q.vz *= dr; q.vy += (0.22 - q.vy) * Math.min(1, dt * 1.5); q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      const u = q.t / q.life, size = q.s * (1 + u * 4.5), a = R.project(q.x, q.y, q.z), b = R.project(q.x, q.y + size, q.z); if (!a || !a.on || !b) continue; const r = Math.min(H * 0.13, Math.max(2, Math.abs(a.y - b.y))), al = q.a * Math.sin(Math.min(1, u * 5) * Math.PI / 2) * (1 - u) * (1 - u);
      const gr = g.createRadialGradient(a.x, a.y, 0, a.x, a.y, r); gr.addColorStop(0, `rgba(240,246,252,${al})`); gr.addColorStop(0.55, `rgba(232,240,250,${al * 0.5})`); gr.addColorStop(1, 'rgba(232,240,250,0)'); g.fillStyle = gr; g.beginPath(); g.arc(a.x, a.y, r, 0, 6.3); g.fill(); } }
  return { init, update, get n() { return puffs.length; }, get cold() { return cold; }, test(v, c) { run = v; force = !!c; } };
})();
