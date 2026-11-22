const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', 0); await h.calm();
  await ev(() => { G.designerMoon(); }); await page.waitForTimeout(6000);
  await ev(() => { if (Cine.active()) Cine.stop(); }); for (let i = 0; i < 30; i++) { if (!(await ev(() => Dialogue.active()))) break; await ev(() => document.getElementById('dialogue').click()); await page.waitForTimeout(150); }
  const v = await ev(() => { const L = Village.townList(); const p = G.player; let best = null; for (const t of L) { const d = Math.hypot(t.x - p.x, t.z - p.z); if (t.type === 'land' && (!best || d < best.d)) best = { d, x: t.x, y: t.y, z: t.z, name: t.name, style: t.style, id: t.id }; } return best; });
  console.log('vil', JSON.stringify(v));
  await ev((v) => { const p = G.player; G.repelUntil = performance.now() + 9e7; G.world.time = 0.4; p.x = v.x + 0.5; p.z = v.z - 20; G.world.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 99999); p.y = G.world.groundY(Math.floor(p.x), Math.floor(p.z)) + 1; }, v);
  await page.waitForTimeout(5000);
  const c = await ev((v) => { const w = G.world, cnt = {}; for (let dx = -14; dx <= 14; dx++) for (let dz = -14; dz <= 14; dz++) for (let y = v.y - 2; y <= v.y + 8; y++) { const b = w.getBlock(v.x + dx, y, v.z + dz); if (b) cnt[BLOCKS[b].name] = (cnt[BLOCKS[b].name] || 0) + 1; } return cnt; }, v);
  console.log('blocks', JSON.stringify(c));
  await ev((v) => { const p = G.player; G.cutCam = { x: v.x + 0.5, y: v.y + 14, z: v.z - 22, yaw: Math.PI, pitch: -0.5 }; p.x = v.x; p.z = v.z - 22; }, v); await page.waitForTimeout(2500);
  await page.screenshot({ path: '/home/claude/scratch/moonvil.png', timeout: 150000 });
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); await h.close(); })();
