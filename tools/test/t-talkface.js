// Whoever is speaking keeps his face clear of the words: Keychain's first speech in the village, then Elder Hask, on a phone held sideways and upright.
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; const land = !process.env.PORTRAIT; await page.setViewportSize(land ? { width: 844, height: 390 } : { width: 390, height: 780 }); await h.newGame('look-3', 0);
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.world.time = 0.4; });
  await ev(() => { const v = Village.townList()[0]; const p = G.player, w = G.world; p.x = v.x + 0.5; p.z = v.z + 9.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 99999); G.meshPass(9999); });
  await page.waitForTimeout(12000);
  const face = (who) => ev((who) => { const d = document.getElementById('dialogue'), r = d && d.offsetParent !== null ? d.getBoundingClientRect() : null; const n = G.talkNpc; if (!n) return { who, talk: false, dlg: !!r };
    const fy = (GLB.faceOf(n) != null ? GLB.faceOf(n) : (n.faceY || 1.5)); const q = R.project(n.x, n.y + fy, n.z); return { who, name: n.name || (n.kin && KIN.name(n.kin)), glb: !!(n._glb), faceY: q && Math.round(q.y), dlgTop: r && Math.round(r.top), dlgBottom: r && Math.round(r.bottom), H: innerHeight, clear: !!(q && r && q.y < r.top - 20) }; }, who);
  console.log(JSON.stringify(await face('keychain'))); await page.screenshot({ path: `/home/claude/scratch/talk-keychain-${land ? 'land' : 'port'}.png`, timeout: 200000 });
  await ev(() => { if (Dialogue.active()) Dialogue.close && Dialogue.close(); const v = Village.townList()[0], e = v.elder, p = G.player; if (Battle.active) Battle.abort(); if (v.boss) { Wild.remove(v.boss); v.boss = null; } e.hidden = false; e.x = p.x; e.z = p.z - 2.2; e.yaw = 0; G.talkNpc = e; Dialogue.show(e.name, ['Thank you, stranger. Keychain held this village for a whole season and kept us in our homes. You have freed us.']); });
  await page.waitForTimeout(9000);
  console.log(JSON.stringify(await face('hask'))); await page.screenshot({ path: `/home/claude/scratch/talk-hask-${land ? 'land' : 'port'}.png`, timeout: 200000 });
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ').slice(0, 500) || 'none'); await h.close(); })();
