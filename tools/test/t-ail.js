const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame('gal-1'); await h.calm();
  await ev(() => { const p = G.player; const r = KIN.roster('earth', 0, 0, 'Surface', 'Plains', 0); const e = Wild.makeEntity(r[0], 3, p.x + 3, p.y, p.z + 3); Wild.list.push(e); Battle.start(e, false); });
  await page.waitForTimeout(2500);
  await ev(() => { Battle.wildEntity.kin.buffs.ail = { type: 'poison', turns: 2, n: 0 }; const x = [...document.querySelectorAll('#b-actions button.move')][2]; x.click(); });
  for (let i = 0; i < 12; i++) { await page.waitForTimeout(1500); const r = await ev(() => ({ hp: Battle.wildEntity && Battle.wildEntity.kin.hp, log: [...document.querySelectorAll('#b-log div')].map(d => d.textContent).slice(-3), tag: (document.querySelector('.ailtag') || {}).textContent, ready: !document.querySelector('#b-actions button.move[disabled]') })); if (r.ready && i > 1) { console.log(JSON.stringify(r)); break; } }
  await page.screenshot({ path: '/home/claude/ail.png' });
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
