const { open } = require('./harness');
const fs = require('fs');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', 0); await h.calm();
  await ev(() => { G.designerMoon(); }); await page.waitForTimeout(6000);
  await ev(() => { if (Cine.active()) Cine.stop(); }); for (let i = 0; i < 40; i++) { if (!(await ev(() => Dialogue.active()))) break; await ev(() => document.getElementById('dialogue').click()); await page.waitForTimeout(150); }
  const b64 = fs.readFileSync('/home/claude/scratch/test-man.glb').toString('base64');
  const r = await ev((b64) => { const raw = atob(b64), u8 = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) u8[i] = raw.charCodeAt(i);
    const m = GLB.fromBuffer('finch', u8.buffer, { height: 1.95 }); const f = Village.entities().find(e => (e.src || e).name === 'Professor Finch'); if (!f) return { m: !!m, finch: false };
    const p = G.player; G.repelUntil = performance.now() + 9e7; G.world.time = 0.4; p.x = f.x + 3; p.z = f.z + 0.2; p.y = G.world.groundY(Math.floor(p.x), Math.floor(p.z), Math.floor(f.y) + 4) + 1; p.yaw = Math.atan2(-(f.x - p.x), -(f.z - p.z)); p.pitch = -0.08; G.thirdPerson = false;
    window.__f = f; return { m: !!m, finch: true, at: [Math.round(f.x), Math.round(f.y), Math.round(f.z)] }; }, b64);
  console.log('setup', JSON.stringify(r)); await page.waitForTimeout(2500);
  console.log('dressed', JSON.stringify(await ev(() => { const f = Village.entities().find(e => (e.src || e).name === 'Professor Finch'); return { glb: !!(f && f.glb), name: f && f.glb && f.glb.name }; })));
  await page.screenshot({ path: '/home/claude/scratch/glb-finch.png', timeout: 150000 });
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); await h.close(); })();
