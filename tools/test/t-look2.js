// The look of the world, for comparing against art/style: the first village square and the open country outside it, phone portrait, HUD hidden.
// TAG names the pictures (/home/claude/scratch/world-<TAG>-village.png, -country.png); ROOT picks which copy of the game to serve; TIME the hour (0.4 = mid-morning).
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await page.setViewportSize({ width: 390, height: 700 }); await h.newGame(process.env.SEED || 'look-3', 0); await h.calm();
  const tag = process.env.TAG || 'now', time = +(process.env.TIME || 0.4);
  await ev((time) => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.player.frozen = true; G.thirdPerson = false; G.world.time = time; Weather.state.kind = 'clear'; Weather.state.intensity = 0;
    document.querySelectorAll('body *').forEach(el => { if (el.tagName !== 'CANVAS' && !el.querySelector('canvas')) el.style.visibility = 'hidden'; }); }, time);
  const at = async (name, fn) => { await ev(fn); await ev(() => { const p = G.player, w = G.world; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 4, 99999); G.meshPass(9999); }); await page.waitForTimeout(7000); await ev((time) => { G.world.time = time; }, time); await page.waitForTimeout(2500);
    await page.screenshot({ path: `/home/claude/scratch/world-${tag}-${name}.png`, timeout: 200000 }); console.log('shot', name); };
  await at('village', () => { const v = Village.townList()[0], p = G.player; const b = Wild.list.find(e => e.isBoss); if (b) { Wild.remove(b); v.boss = null; } p.x = v.x + 0.5; p.z = v.z + 10.5; p.y = G.world.groundY(Math.floor(p.x), Math.floor(p.z)) + 1; p.yaw = 0; p.pitch = -0.05; });
  await at('country', () => { const v = Village.townList()[0], p = G.player; p.x = v.x + 130.5; p.z = v.z + 118.5; p.y = G.world.groundY(Math.floor(p.x), Math.floor(p.z)) + 1; p.yaw = Math.atan2(-(v.x - p.x), -(v.z - p.z)) + Math.PI; p.pitch = -0.1; });
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); await h.close(); })();
