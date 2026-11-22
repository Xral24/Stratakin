// The cast's models up close, the way the player meets them: NAMES side by side at DIST metres, eye level, daylight, HUD hidden.
// NAMES=finch,silas (files from DIR, default /home/claude/strata/assets). One frontal shot (and a three-quarter one with TURN=1).
const { open } = require('./harness');
const fs = require('fs');
(async () => { const h = await open(); const { page, ev } = h;
  await page.setViewportSize({ width: +(process.env.W || 1000), height: +(process.env.H || 520) }); console.log('start'); await h.newGame('look-3', 0); await h.calm();
  const spec = (process.env.NAMES || 'finch,silas').split(',').map(x => x.split(':')), names = spec.map(x => x[0]), heights = spec.map(x => +x[1] || 0); /* name or name:height for things that are not in the cast */
  const dir = process.env.DIR || '/home/claude/strata/assets';
  const files = names.map(n => fs.readFileSync(`${dir}/${n}.glb`).toString('base64'));
  const info = await ev(([names, files, sp, dist, heights]) => {
    const p = G.player; G.repelUntil = performance.now() + 9e7; G.world.time = 0.40; G.thirdPerson = false; p.pitch = -0.04;
    document.querySelectorAll('body *').forEach(el => { if (el.tagName !== 'CANVAS' && !el.querySelector('canvas')) el.style.visibility = 'hidden'; });
    const f = [-Math.sin(p.yaw), 0, -Math.cos(p.yaw)], r = [Math.cos(p.yaw), 0, -Math.sin(p.yaw)], out = [], ents = [];
    const gy = G.world.groundY(Math.floor(p.x + f[0] * dist), Math.floor(p.z + f[2] * dist)) + 1;
    names.forEach((n, i) => { const raw = atob(files[i]), u8 = new Uint8Array(raw.length); for (let k = 0; k < raw.length; k++) u8[k] = raw.charCodeAt(k);
      const c = heights[i] ? { height: heights[i] } : (GLB.CAST[n] || {}), m = GLB.fromBuffer(n, u8.buffer, { height: c.height || 2, turn: c.turn || 0, still: c.still }); if (!m) { out.push(n + ': failed'); return; }
      const off = (i - (names.length - 1) / 2) * sp, x = p.x + f[0] * dist + r[0] * off, z = p.z + f[2] * dist + r[2] * off, y = gy;
      const e = { x, y, z, yaw: Math.atan2(p.x - x, p.z - z) + (+(window.__turn0 || 0)), scale: 1, model: { height: c.height || 2, radius: 0.5 } }; GLB.dress(e, n, {}); ents.push(e); out.push(n + ' ' + m.tris); });
    p.y = gy + 1.62 - 1.0; G.extraEnts = ents; window.__ents = ents; window.__yaw0 = ents.map(e => e.yaw); return out; }, [names, files, +(process.env.SP || 1.4), +(process.env.DIST || 3.2), heights]);
  console.log('loaded', info.join(' | '));
  await page.waitForTimeout(2500);
  const tag = process.env.TAG || 'close';
  for (const turn of (process.env.TURN ? [0, 1] : [0])) {
    await ev((turn) => { window.__ents.forEach((e, i) => { e.yaw = window.__yaw0[i] + turn * 0.6; if (e.glb) e.glb.at = 0.3; }); }, turn);
    await page.waitForTimeout(1500); await page.screenshot({ path: `/home/claude/scratch/${tag}-${turn}.png`, timeout: 200000 }); console.log('shot', turn); }
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); console.log('LOGS:', h.logs.slice(0, 6).join(' | ') || 'none'); await h.close(); })();
