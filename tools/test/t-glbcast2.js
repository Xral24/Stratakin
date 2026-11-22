// Silas at a stall in his own model, then a fight with Keychain: his face on the battle card comes from his model.
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.thirdPerson = false; G.world.time = 0.42; const p = G.player, f = [-Math.sin(p.yaw), 0, -Math.cos(p.yaw)];
    const n = Campaign.spawnPerson('silas', 'Silas Pennywise', 'merchant', Math.floor(p.x + f[0] * 4), Math.floor(p.z + f[2] * 4), { body: '#232334', belly: '#d8a060', accent: '#e0b84a', dark: '#17171f' }, ['silas']); n.yaw = Math.atan2(p.x - n.x, p.z - n.z); p.pitch = -0.05; });
  await page.waitForTimeout(4000);
  console.log('silas', JSON.stringify(await ev(() => { const n = Campaign.getPerson('silas'); return { glb: n && n._glb ? n._glb.name : null, loaded: GLB.list }; })));
  await page.screenshot({ path: '/home/claude/scratch/c2-silas.png', timeout: 150000 });
  await ev(() => { const v = Village.townList()[0]; const p = G.player, w = G.world; p.x = v.x + 0.5; p.z = v.z + 9.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 99999); G.meshPass(9999); });
  await page.waitForTimeout(3000);
  console.log('fight', JSON.stringify(await ev(() => { const b = Wild.list.find(e => e.isBoss); if (!b) return 'no boss'; const p = G.player; p.x = b.x + 3; p.z = b.z + 4; Battle.start(b, false); return { on: Battle.active, glb: b.glb && b.glb.name }; })));
  await page.waitForTimeout(3500); await page.screenshot({ path: '/home/claude/scratch/c2-fight.png', timeout: 150000 });
  console.log('card', JSON.stringify(await ev(() => [...document.querySelectorAll('canvas.bpic')].map(c => c.dataset.k))));
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); console.log('LOGS:', h.logs.filter(l => !/GPU stall/.test(l)).slice(0, 4).join(' | ') || 'none'); await h.close(); })();
