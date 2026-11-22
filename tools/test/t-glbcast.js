// The cast's models from files, side by side in a village square: front and side, a few moments of each one's clips.
// NAMES=keychain,stonewall,... (files from /home/claude/stratakin/art/models/slim/<name>.glb). Heights from GLB.CAST.
const { open } = require('./harness');
const fs = require('fs');
(async () => { const h = await open(); const { page, ev } = h;
  await page.setViewportSize({ width: 1000, height: 520 }); console.log('start'); await h.newGame('look-3', 0); await h.calm();
  const names = (process.env.NAMES || 'keychain,stonewall,bigmouth,silas,finch').split(',');
  const dir = process.env.DIR || '/home/claude/stratakin/art/models/slim';
  const files = names.map(n => fs.readFileSync(`${dir}/${n}.glb`).toString('base64'));
  const info = await ev(([names, files, sp]) => {
    const p = G.player; G.repelUntil = performance.now() + 9e7; G.world.time = 0.42; G.thirdPerson = false; p.pitch = -0.1;
    const f = [-Math.sin(p.yaw), 0, -Math.cos(p.yaw)], r = [Math.cos(p.yaw), 0, -Math.sin(p.yaw)], out = [], ents = [];
    names.forEach((n, i) => { const raw = atob(files[i]), u8 = new Uint8Array(raw.length); for (let k = 0; k < raw.length; k++) u8[k] = raw.charCodeAt(k);
      const c = GLB.CAST[n] || {}, m = GLB.fromBuffer(n, u8.buffer, { height: c.height || 2, turn: c.turn || 0, still: c.still }); if (!m) { out.push(n + ': failed'); return; }
      const off = (i - (names.length - 1) / 2) * sp, x = p.x + f[0] * 6 + r[0] * off, z = p.z + f[2] * 6 + r[2] * off, y = G.world.groundY(Math.floor(x), Math.floor(z)) + 1;
      const e = { x, y, z, yaw: Math.atan2(p.x - x, p.z - z), scale: 1, model: { height: c.height || 2, radius: 0.5 } }; GLB.dress(e, n, {}); ents.push(e);
      out.push({ n, tris: m.tris, clips: m.clips, walk: m.walk, base: m.base, keep: m.grp.keep.length, kept: m.grp.keep.map(k => m.g.nodes[m.g.skin.joints[k]].name).join(','), height: +m.height.toFixed(2), stride: +m.stride.toFixed(2), baseYaw: m.baseYaw ? +(m.baseYaw * 57.3).toFixed(1) : 0, hips: m.hips ? m.g.nodes[m.hips.node].name : null, durs: m.g.anims.map(a => +a.dur.toFixed(2)) }); });
    G.extraEnts = ents; window.__ents = ents; window.__yaw0 = ents.map(e => e.yaw); return out; }, [names, files, +(process.env.SP || 2.5)]);
  console.log('loaded'); for (const o of info) console.log(JSON.stringify(o));
  await page.waitForTimeout(3000);
  const shot = async (tag) => { await page.waitForTimeout(1600); await page.screenshot({ path: `/home/claude/scratch/cast-${tag}.png`, timeout: 150000 }); console.log('shot', tag); };
  for (const side of [0, 1]) {
    await ev((side) => { window.__ents.forEach((e, i) => { e.yaw = window.__yaw0[i] + side * Math.PI / 2; }); }, side);
    for (const k of (side ? [0, 1, 2, 3] : [0, 2])) {
      await ev((k) => { for (const e of window.__ents) { const m = GLB.get(e.glb.name), A = m.g.anims; if (m.walk != null) { e.glb.walkAt = A[m.walk].dur * k / 4; e.glb.at = 0; } else if (A.length) { e.glb.at = A[m.base].dur * k / 4; } else e.glb.at = k; } }, k);
      await shot(`${side ? 'side' : 'front'}${k}`);
    }
  }
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); console.log('LOGS:', h.logs.slice(0, 6).join(' | ') || 'none'); await h.close(); })();
