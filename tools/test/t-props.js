// Generated world models standing in the first village beside the code-built ones: NAMES=cottage:7,oak:9 (name:height in metres), files from DIR.
const { open } = require('./harness');
const fs = require('fs');
(async () => { const h = await open(); const { page, ev } = h; await page.setViewportSize({ width: 844, height: 420 }); await h.newGame('look-3', 0); await h.calm();
  const items = (process.env.NAMES || 'cottage:7,oak:9').split(',').map(s => s.split(':')), dir = process.env.DIR || '/home/claude/stratakin/art/models/world';
  const files = items.map(([n]) => fs.readFileSync(`${dir}/${n}.glb`).toString('base64'));
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.player.frozen = true; G.thirdPerson = false; G.world.time = 0.4; Weather.state.kind = 'clear'; Weather.state.intensity = 0;
    document.querySelectorAll('body *').forEach(el => { if (el.tagName !== 'CANVAS' && !el.querySelector('canvas')) el.style.visibility = 'hidden'; });
    const v = Village.townList()[0], p = G.player, w = G.world; const b = Wild.list.find(e => e.isBoss); if (b) { b.patrol = null; b.x += 60; } p.x = v.x + 0.5; p.z = v.z + 13.5; p.yaw = 0; p.pitch = 0.06; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 4, 99999); G.meshPass(9999); });
  await page.waitForTimeout(6000);
  const info = await ev(([items, files]) => { const v = Village.townList()[0], p = G.player, out = [], ents = [];
    items.forEach(([n, hh], i) => { const raw = atob(files[i]), u8 = new Uint8Array(raw.length); for (let k = 0; k < raw.length; k++) u8[k] = raw.charCodeAt(k);
      const m = GLB.fromBuffer('w_' + n, u8.buffer, { height: +hh }); if (!m) { out.push(n + ' failed'); return; }
      const x = v.x + 0.5 + (i ? 7.5 : -7), z = v.z - (i ? 4 : 6), y = G.world.groundY(Math.floor(x), Math.floor(z)) + 1; const e = { x, y, z, yaw: i ? 0.4 : -0.5, scale: 1, model: { height: +hh, radius: 3 } }; GLB.dress(e, 'w_' + n, { clip: false, walk: false }); ents.push(e); out.push(n + ' ' + m.tris); });
    G.extraEnts = ents; return out; }, [items, files]);
  console.log(info.join(' | ')); await page.waitForTimeout(5000);
  await ev(() => { const v = Village.townList()[0], p = G.player; if (Dialogue.active() && Dialogue.close) Dialogue.close(); G.talkNpc = null; p.frozen = true; p.x = v.x + 0.5; p.z = v.z + 17.5; p.y = G.world.groundY(Math.floor(p.x), Math.floor(p.z)) + 1; p.yaw = 0; p.pitch = 0.08; for (const e of Wild.list) if (e.isBoss) { e.x = v.x + 40; e.z = v.z - 40; } }); await page.waitForTimeout(5000);
  await page.screenshot({ path: `/home/claude/scratch/props-${process.env.TAG || 'a'}.png`, timeout: 200000 }); console.log('ERRORS:', h.errors.slice(0, 3).join(' | ').slice(0, 400) || 'none'); await h.close(); })();
