const { open } = require('./harness');
const fs = require('fs');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', 0); await h.calm();
  const b64 = fs.readFileSync(process.env.GLB || '/home/claude/scratch/test-man.glb').toString('base64');
  const info = await ev((b64) => { const raw = atob(b64), u8 = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) u8[i] = raw.charCodeAt(i);
    const m = GLB.fromBuffer('test', u8.buffer, { height: 1.9 }); if (!m) return 'failed';
    const p = G.player; G.repelUntil = performance.now() + 9e7; G.world.time = 0.42; G.thirdPerson = false;
    const f = U.forwardVec(p.yaw, 0), x = p.x + f[0] * 3.2, z = p.z + f[2] * 3.2, y = G.world.groundY(Math.floor(x), Math.floor(z)) + 1;
    const e = { x, y, z, yaw: Math.atan2(p.x - x, p.z - z), scale: 1, model: { height: 1.9, radius: 0.4 } }; GLB.dress(e, 'test', { clip: 'wave' }); G.extraEnts = [e]; window.__e = e; p.pitch = -0.12;
    return { tris: m.tris, clips: m.clips, keep: m.grp.keep.length, head: m.head, height: +m.height.toFixed(2), rad: +m.mesh.rad.toFixed(2), image: !!m.g.image }; }, b64);
  console.log('model', JSON.stringify(info)); await page.waitForTimeout(2500);
  console.log('tex', JSON.stringify(await ev(() => ({ ready: GLB.get('test').mesh.texReady, w: GLB.get('test').mesh.texW }))));
  for (const [k, t] of [[0, 0], [1, 0.25], [2, 0.5]]) { await ev((t) => { window.__e.glb.at = t; }, t); await page.waitForTimeout(900); await page.screenshot({ path: `/home/claude/scratch/glb-${k}.png`, timeout: 150000 }); }
  await ev(() => { window.__e.glb.clip = 'idle'; window.__e.glb.nod = 1; window.__e.glb.at = null; G.thirdPerson = true; if (G.orbit) { G.orbit.yaw = G.player.yaw; } }); await page.waitForTimeout(1500); await page.screenshot({ path: '/home/claude/scratch/glb-3.png', timeout: 150000 });
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); await h.close(); })();
