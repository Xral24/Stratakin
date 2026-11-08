const { open } = require('./harness');
(async () => {
  const h = await open(); const { page, ev } = h;
  await h.newGame('look-1');
  const r = await ev(() => { const p = G.player, w = G.world; G.repelUntil = performance.now() + 9e5; p.add('glider', 1); G.setPaused && G.setPaused(true);
    const out = {};
    const run = (mz, mx, secs, label, releaseAt) => { const s = w.spawn; p.x = s.x + 0.5; p.z = s.z + 0.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 6, 9999);
      p.y = w.groundY(Math.floor(p.x), Math.floor(p.z)) + 40; p.vx = p.vz = 0; p.vy = -2; p.onGround = false; p.gliding = false; p.frozen = false; p.hp = p.maxHp; p.yaw = 0;
      const y0 = p.y, x0 = p.x, z0 = p.z; let t = 0, landed = null, minS = 99, maxS = 0;
      while (t < secs) { const inp = { mx, mz: typeof mz === 'function' ? mz(t, p) : mz, jump: true, jumpPressed: false, sneak: false };
        p.update(1 / 60, inp); t += 1 / 60; if (p.gliding) { minS = Math.min(minS, p.glideS); maxS = Math.max(maxS, p.glideS); }
        if (p.onGround) { landed = t; break; } }
      out[label] = { t: +t.toFixed(1), drop: +(y0 - p.y).toFixed(1), dist: +Math.hypot(p.x - x0, p.z - z0).toFixed(1), hp: p.hp + '/' + p.maxHp, speed: [+minS.toFixed(1), +maxS.toFixed(1)], msg: p.landMsg, yaw: +p.yaw.toFixed(2) }; p.landMsg = null; };
    run(0, 0, 60, 'cruise');
    run(1, 0, 60, 'dive');
    run(-1, 0, 60, 'brake');
    run(0, 1, 60, 'turn');
    run((t, p) => { const gy = w.groundY(Math.floor(p.x), Math.floor(p.z), Math.floor(p.y)); return p.y - gy < 4 ? -1 : 1; }, 0, 60, 'dive+flare');
    out.wind = Weather.wind(p.x, p.y, p.z);
    return out; });
  console.log(JSON.stringify(r, null, 1));
  // HUD shot
  await ev(() => { const p = G.player, w = G.world; G.stats.glideTold = true; document.querySelectorAll('#explain').forEach(e => e.remove()); G.setPaused && G.setPaused(false); const s = w.spawn; p.x = s.x + 0.5; p.z = s.z + 0.5; p.y = w.groundY(Math.floor(p.x), Math.floor(p.z)) + 25; p.vx = p.vz = 0; p.vy = -2; p.onGround = false; p.frozen = false; Controls.input.touchJump = true; p.pitch = -0.2; });
  await page.waitForTimeout(1200); await page.screenshot({ path: 'glide.png' });
  console.log('ERRORS:', h.errors.length ? h.errors.join('\n') : 'none');
  await h.close();
})().catch(e => { console.error(e); process.exit(1); });
