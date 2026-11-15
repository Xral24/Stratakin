// breaking a Kin in with the balance gauge: start a ride, hold on with a simple hand on the stick, check the win and the fall, take pictures
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; if (process.env.LAND) await page.setViewportSize({ width: 844, height: 390 }); await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.explain = () => {}; G.world.time = 0.42; });
  const mk = await ev(() => { const sp = KIN.species(U.combine(0x40CE, 7), ['Gale'], 0, { primary: 'Gale', shape: 'quadruped', total: 420, rarity: 2 }); sp.fast = true; sp.names = ['Testhoof', 'Testhoof', 'Testhoof']; const k = KIN.create(sp, 14); window.__k = k; const p = G.player; const w = G.world; let best = null; for (let i = 0; i < 60 && !best; i++) { const x = Math.floor(p.x) + 30 + (i % 8) * 6, z = Math.floor(p.z) - 20 + Math.floor(i / 8) * 6; const gy = w.groundY(x, z); if (w.getBlock(x, gy, z) === B.GRASS && w.getBlock(x, gy + 1, z) === B.AIR && w.getBlock(x, gy + 3, z) === B.AIR) best = [x, gy, z]; } if (best) { p.x = best[0] + 0.5; p.z = best[2] + 0.5; p.y = best[1] + 1.05; p.vx = p.vy = p.vz = 0; } w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 9999); G.meshPass(999); G.kin.push(k); p.yaw = 0.6; G.orbit = { yaw: 0.6, pitch: -0.25, idle: 0 }; Taming.start(k, { mode: 'land' }); return { active: Taming.active, need: Taming.state.need, level: Taming.state.level, mount: !!p.mount, frozen: p.frozen }; });
  console.log('start', JSON.stringify(mk));
  // a hand on the stick: push against where the needle is and where it is going
  const ride = (secs, hands) => ev(([n, hands]) => { const p = G.player; let out = null; for (let i = 0; i < n && Taming.active; i++) { const s = Taming.state; Controls.input.mx = hands ? Math.max(-1, Math.min(1, -(2.0 * s.b + 0.6 * s.vb))) : 0; Taming.update(1 / 30, p); } Controls.input.mx = 0; const s = Taming.state; return s ? { t: +s.t.toFixed(2), b: +s.b.toFixed(2), I: +s.I.toFixed(2) } : { ended: true, mount: p.mount ? KIN.name(p.mount) : null, tamed: !!window.__k.tamed, frozen: p.frozen, hp: p.hp }; }, [Math.round(secs * 30), hands]);
  console.log('2s', JSON.stringify(await ride(2, true)));
  await ev(() => { const s = Taming.state; s.b = 0.72; s.vb = 0; s.kickT = 0.8; }); await page.waitForTimeout(9000); await page.screenshot({ path: '/home/claude/tame-0.png' });
  await ev(() => { const s = Taming.state; s.b = -0.45; s.vb = 0; s.ph += 1.3; s.kickT = 0.2; }); await page.waitForTimeout(5000); await page.screenshot({ path: '/home/claude/tame-1.png' });
  await ev(() => { const s = Taming.state; s.b = 0.05; s.vb = 0; s.ph += 1.1; }); await page.waitForTimeout(5000); await page.screenshot({ path: '/home/claude/tame-2.png' });
  if (process.env.QUICK) { console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); return; }
  console.log('to the end', JSON.stringify(await ride(30, true)));
  await page.waitForTimeout(4500); await page.screenshot({ path: '/home/claude/tame-3.png' });
  // again with no hands: thrown
  const again = await ev(() => { const p = G.player; p.mount = null; window.__k.tamed = false; const hp0 = p.hp; Taming.start(window.__k, { mode: 'land' }); return { hp0, active: Taming.active }; }); console.log('again', JSON.stringify(again));
  console.log('no hands', JSON.stringify(await ride(40, false)));
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none', h.logs.slice(0, 3).join(' | ')); await h.close(); })();
