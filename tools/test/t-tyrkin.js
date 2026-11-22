// Keychain the lizard in the first village, in his model with the great key: standing, then close up.
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await page.setViewportSize({ width: 900, height: 520 }); await h.newGame('look-3', 0); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.player.frozen = true; G.thirdPerson = false; G.world.time = 0.4; });
  await ev(() => { const v = Village.townList()[0]; const p = G.player, w = G.world; p.x = v.x + 0.5; p.z = v.z + 7.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 99999); G.meshPass(9999); });
  await page.waitForTimeout(9000);
  const info = await ev(() => { document.querySelectorAll('body *').forEach(el => { if (el.tagName !== 'CANVAS' && !el.querySelector('canvas')) el.style.visibility = 'hidden'; });
    const b = Wild.list.find(e => e.isBoss); if (!b) return 'no boss'; b.patrol = null; b.x = G.player.x; b.z = G.player.z - 4.2; b.yaw = 0.35; const p = G.player; p.yaw = 0; p.pitch = 0.02; const st = b.glb || b._glb;
    return { name: KIN.name(b.kin), dressed: !!st, model: st && st.name, loaded: GLB.list.join(','), h: GLB.get('keychain') && GLB.get('keychain').height }; });
  console.log(JSON.stringify(info));
  await page.waitForTimeout(6000); await page.screenshot({ path: '/home/claude/scratch/tyrkin-keychain.png', timeout: 200000 });
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); await h.close(); })();
