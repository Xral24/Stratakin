const { open } = require('./harness');
(async () => { const h = await open(); await h.newGame('gal-1'); await h.calm();
  const r = await h.ev(() => { const e = Wild.list.find(w => w.kin && !w.isBoss && !w.lieutenant); if (!e) return 'no wild'; const p = G.player; e.x = p.x + 2; e.z = p.z + 2; e.y = p.y; e.chase = e.chase || { hitCd: 1 }; const near = !!Wild.engagedNear(p); G.deployKin(); return { near, battle: !!Battle.active, card: !document.getElementById('battle') ? 'n/a' : !document.getElementById('battle').classList.contains('hidden') }; });
  console.log(JSON.stringify(r)); await h.page.waitForTimeout(1500); await h.page.screenshot({ path: '/home/claude/deploy.png' }); console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
