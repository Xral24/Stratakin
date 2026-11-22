const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', 0); await h.calm();
  await ev(() => { G.designerMoon(); }); await page.waitForTimeout(6000);
  await ev(() => { if (Cine.active()) Cine.stop(); }); for (let i = 0; i < 40; i++) { if (!(await ev(() => Dialogue.active()))) break; await ev(() => document.getElementById('dialogue').click()); await page.waitForTimeout(150); }
  for (let i = 0; i < 20; i++) { if (await ev(() => !!(GLB.get('finch') && GLB.get('finch').mesh && GLB.get('finch').mesh.texReady))) break; await page.waitForTimeout(500); }
  const r = await ev(() => { const m = GLB.get('finch'); const f = Village.entities().find(e => (e.src || e).name === 'Professor Finch'); if (!f) return { m: !!m, finch: false };
    const p = G.player; G.repelUntil = performance.now() + 9e7; G.world.time = 0.4; const d = 3.2, a = (f.src || f).yaw || 0; p.x = f.x + Math.sin(a) * d; p.z = f.z + Math.cos(a) * d; p.y = G.world.groundY(Math.floor(p.x), Math.floor(p.z), Math.floor(f.y) + 4) + 1; p.yaw = Math.atan2(-(f.x - p.x), -(f.z - p.z)); p.pitch = -0.1; G.thirdPerson = false;
    (f.src || f).yaw = Math.atan2(p.x - f.x, p.z - f.z);
    return { loaded: !!m, tris: m && m.tris, tex: m && m.mesh.texReady, keep: m && m.grp.keep.length, spine: m && m.spine.length }; });
  console.log('finch', JSON.stringify(r)); await page.waitForTimeout(2500); await page.screenshot({ path: '/home/claude/scratch/finch-1.png', timeout: 150000 });
  await ev(() => { const f = Village.entities().find(e => (e.src || e).name === 'Professor Finch'); (f.src || f).talkOpen = 0.8; window.__talk = setInterval(() => { (f.src || f).talkOpen = 0.8; }, 100); }); await page.waitForTimeout(1800); await page.screenshot({ path: '/home/claude/scratch/finch-2.png', timeout: 150000 });
  await ev(() => { clearInterval(window.__talk); G.thirdPerson = true; if (G.orbit) { G.orbit.yaw = G.player.yaw; G.orbit.pitch = -0.2; } }); await page.waitForTimeout(2200); await page.screenshot({ path: '/home/claude/scratch/finch-3.png', timeout: 150000 });
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); await h.close(); })();
