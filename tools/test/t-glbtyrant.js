// Keychain in the first village in his model from the file: walking his patrol, then in a fight.
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.player.frozen = true; G.thirdPerson = false; G.world.time = 0.4; });
  await ev(() => { const v = Village.townList()[0]; const p = G.player, w = G.world; p.x = v.x + 0.5; p.z = v.z + 9.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 99999); G.meshPass(9999); });
  await page.waitForTimeout(2500);
  const look = () => ev(() => { const b = Wild.list.find(e => e.isBoss); if (!b) return 'no boss'; const p = G.player, dx = b.x - p.x, dz = b.z - p.z; p.yaw = Math.atan2(-dx, -dz); p.pitch = -0.12; const st = b.glb;
    return { name: KIN.name(b.kin), glbName: b.glbName, dressed: !!st, model: st ? st.name : null, mv: st ? +(st.mv || 0).toFixed(2) : null, walked: st ? +(st.wd || 0).toFixed(2) : null, d: +Math.hypot(dx, dz).toFixed(1), loaded: GLB.list, sayH: b.sayH && +b.sayH.toFixed(2) }; });
  for (let i = 0; i < 3; i++) { console.log(i, JSON.stringify(await look())); await page.waitForTimeout(1200); await page.screenshot({ path: `/home/claude/scratch/tyr-${i}.png`, timeout: 150000 }); }
  console.log('fight', JSON.stringify(await ev(() => { const b = Wild.list.find(e => e.isBoss); const p = G.player; p.frozen = false; p.x = b.x + 3; p.z = b.z + 4; Battle.start(b, false); return Battle.active; })));
  await page.waitForTimeout(3000); await page.screenshot({ path: '/home/claude/scratch/tyr-fight.png', timeout: 150000 });
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); console.log('LOGS:', h.logs.filter(l => /GLB|glb/.test(l)).slice(0, 4).join(' | ') || 'none'); await h.close(); })();
