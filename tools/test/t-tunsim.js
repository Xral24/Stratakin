const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h;
  await page.click('#s-new'); await page.fill('#s-seed', process.argv[2] || 'gal-1'); await page.waitForTimeout(150); await page.click('[data-jump="lost"]'); await page.waitForTimeout(7000);
  const r = await ev((lat0) => { const p = G.player, w = G.world, T = w.lostTunnel(), out = []; G.running = false; G.repelUntil = performance.now() + 9e5;
    const k0 = T.pb - 8; p.x = T.ax + 0.5 + T.ix * k0 - T.iz * lat0; p.z = T.az + 0.5 + T.iz * k0 + T.ix * lat0; p.y = Math.round(T.ya + (T.yb - T.ya) * k0 / T.len) + 1.1; p.vx = p.vy = p.vz = 0; p.yaw = Math.atan2(-T.ix, -T.iz); p.frozen = false; p.flying = false; p.mount = null;
    w.ensureAround(Math.floor(p.x / 16), Math.floor(p.z / 16), 3, 9999);
    const kk = () => { const px = p.x - T.ax - 0.5, pz = p.z - T.az - 0.5; return [+(px * T.ix + pz * T.iz).toFixed(2), +(-px * T.iz + pz * T.ix).toFixed(2), +p.y.toFixed(2)]; };
    const base = Object.assign({}, Controls.poll()); let last = -99, stuck = 0, jump = false;
    for (let i = 0; i < 900; i++) { const inp = Object.assign({}, base, { mx: 0, mz: 1, jump, sneak: false, mine: false, place: false, lookX: 0, lookY: 0 }); p.yaw = Math.atan2(-T.ix, -T.iz); p.update(0.033, inp);
      if (i % 15 === 0) { const s = kk(); out.push(s.join(' ') + (jump ? ' J' : '')); if (Math.abs(s[0] - last) < 0.03) stuck++; else stuck = 0; last = s[0]; if (stuck >= 2) jump = true; if (stuck >= 6 || s[0] > T.len + 14) break; } }
    const s = kk(), names = {}; for (const n in B) names[B[n]] = n; const ahead = []; for (let d = 0; d <= 2; d++) { const x = Math.floor(p.x + T.ix * d), z = Math.floor(p.z + T.iz * d); const col = []; for (let y = Math.floor(p.y) - 1; y <= Math.floor(p.y) + 3; y++) col.push(names[w.getBlock(x, y, z)]); ahead.push(col.join(',')); }
    return { T: { pb: T.pb, len: T.len }, out, end: s, ahead }; }, Number(process.argv[3] || 0));
  console.log(JSON.stringify(r.T)); console.log(r.out.join(' | ')); console.log('END', r.end, '\n' + r.ahead.join('\n')); console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
