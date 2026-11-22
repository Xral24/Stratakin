// Hask wandering the freed square in his model: how fast he goes, how fast his walk plays, how much he turns per frame. And a picture mid-stride.
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await page.setViewportSize({ width: 1000, height: 520 });
  await h.newGame(process.env.SEED || 'look-3', 0); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.thirdPerson = false; G.world.time = 0.4; });
  const r0 = await ev(() => { const v = Village.townList()[0], p = G.player, w = G.world; p.x = v.x + 0.5; p.z = v.z + 7.5; p.frozen = true; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 99999); G.meshPass(9999);
    const e = v.elder; if (!e) return 'no elder'; e.hidden = false; e.wander = true; e.wait = 0; e.x = v.x + 0.5; e.z = v.z + 1.5; return { name: e.name, at: [e.x, e.z], speed: e.speed }; });
  console.log('elder', JSON.stringify(r0));
  await page.waitForTimeout(4000);
  const samples = [];
  for (let i = 0; i < 40; i++) { samples.push(await ev(() => { const v = Village.townList()[0], e = v.elder, st = e._glb || {}; const p = G.player; p.yaw = Math.atan2(-(e.x - p.x), -(e.z - p.z)); p.pitch = -0.15;
      return { t: performance.now(), x: e.x, z: e.z, yaw: e.yaw, ry: st.ry, mv: st.mv, wt: st.wt, v: st.v, speed: e.speed, moving: e.moving, model: st.name, pace: GLB.pace(e) }; }));
    if (i === 12 || i === 26) await page.screenshot({ path: `/home/claude/scratch/walkpace-${i}.png`, timeout: 200000 }); else await page.waitForTimeout(120); }
  let out = []; for (let i = 1; i < samples.length; i++) { const a = samples[i - 1], b = samples[i], dt = (b.t - a.t) / 1000; if (dt <= 0) continue;
    out.push({ dt: +dt.toFixed(3), v: +(Math.hypot(b.x - a.x, b.z - a.z) / dt).toFixed(2), rate: +(((b.wt || 0) - (a.wt || 0)) / dt).toFixed(2), mv: +(b.mv || 0).toFixed(2), dYaw: +(Math.atan2(Math.sin(b.yaw - a.yaw), Math.cos(b.yaw - a.yaw)) * 57.3).toFixed(0), dRy: b.ry != null && a.ry != null ? +(Math.atan2(Math.sin(b.ry - a.ry), Math.cos(b.ry - a.ry)) * 57.3).toFixed(0) : null, moving: b.moving }); }
  console.log('model', samples[0].model, 'speed', samples[0].speed, 'pace', samples[0].pace);
  for (const o of out) console.log(JSON.stringify(o));
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); await h.close(); })();
