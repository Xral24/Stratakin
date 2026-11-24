// "Finish it" at the net moment: your Kin must be seen to strike before the wild one falls (it used to drop with no attack at all).
const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await page.setViewportSize({ width: 844, height: 420 }); await h.newGame('gal-1'); await h.calm();
  await ev(() => { const p = G.player; const r = KIN.roster('earth', 0, 0, 'Surface', 'Plains', 0); const e = Wild.makeEntity(r[0], 3, p.x + 3, p.y, p.z + 3); Wild.list.push(e); Battle.start(e, false); e.kin.hp = Math.min(e.kin.hp, 6);
    const F = window.__fin = { clicked: 0, moves: 0, fx: 0, polls: 0, over: false, logs: [], tClick: 0, tOver: 0 };
    F.iv = setInterval(() => { const fb = document.querySelector('[data-a="finish"]');
      if (!F.clicked) { if (fb) { fb.click(); F.clicked = 1; F.tClick = performance.now(); return; } const b = [...document.querySelectorAll('button.act.move')].find(x => !x.disabled && /phys|spec/.test(x.textContent)); if (b) { b.click(); F.moves++; } return; }
      if (!Battle.active) { if (!F.over) { F.over = true; F.tOver = performance.now(); clearInterval(F.iv); } return; }
      F.polls++; if (Battle.fxEntities().length + (Battle.fxSprites() || []).length > 0) F.fx++; }, 60); });
  let st = null; const t0 = Date.now(); let shot = false;
  while (Date.now() - t0 < 400000) { st = await ev(() => { const F = window.__fin; return { clicked: F.clicked, moves: F.moves, fx: F.fx, polls: F.polls, over: F.over, dt: Math.round(F.tOver - F.tClick), a: Battle.active }; });
    if (st.clicked && st.fx > 0 && !shot) { shot = true; try { await page.screenshot({ path: '/home/claude/scratch/finish-blow.png', timeout: 20000 }); } catch (e) { /* the picture is a nicety: the headless browser is sometimes too slow for it */ } }
    if (st.over || (!st.a && !st.clicked)) break; await page.waitForTimeout(300); }
  console.log(JSON.stringify(st));
  console.log(st.clicked && st.fx > 0 && st.over && st.dt > 900 ? 'PASS' : 'FAIL'); console.log('errors', JSON.stringify(h.errors || []));
  await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
