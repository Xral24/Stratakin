const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', 0); await h.calm();
  await ev(() => { const p = G.player; G.repelUntil = performance.now() + 9e7; p.add('ship', 1); p.add('spacesuit', 1); G.travel('moon'); G.world.time = 0.4; const q = G.player; q.flying = true; q.y += 3.2; q.vy = 0; Cine.play([{ orbit: { x: q.x, y: q.y, z: q.z, r: [16, 16], h: [6, 6], a: [q.yaw + 1.3, q.yaw + 1.3], ly: 0.5 }, secs: 900, plain: true, title: 'The Moon', flash: ['Grey to the edge of everything, and no sound at all.'] }], () => {}); });
  await page.waitForTimeout(30000); await page.screenshot({ path: '/home/claude/scratch/ship-arrive.png', timeout: 150000 });
  await ev(() => { Cine.stop(); const q = G.player; const gy = G.world.groundY(Math.floor(q.x), Math.floor(q.z)); q.flying = false; G.shipPark = { t0: performance.now() - 2000, until: performance.now() + 9e6, x: q.x, y: gy + 0.5, z: q.z, yaw: q.yaw + Math.PI }; q.x += 3.5; q.z += 3.5; q.y = G.world.groundY(Math.floor(q.x), Math.floor(q.z)) + 1.2; q.yaw = Math.atan2(3.5, 3.5); q.pitch = -0.1; G.thirdPerson = true; });
  await page.waitForTimeout(16000); await page.screenshot({ path: '/home/claude/scratch/ship-park.png', timeout: 150000 });
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); await h.close(); })();
