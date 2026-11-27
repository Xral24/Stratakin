const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame('gal-1'); await h.calm();
  await page.setViewportSize({ width: 412, height: 860 });
  await ev(() => { const sps = KIN.dex('earth').filter(s => !s.fusion && s.home && (s.rarity||0) <= 2); for (let i = 0; i < 5; i++) G.addKin(KIN.create(sps[i * 7 % sps.length], 14 + i * 2)); G.kin[2].card = { finish: 'rare' }; G.kin[3].card = { finish: 'super' }; G.kin[4].card = { finish: 'ultra' }; G.stats.threads = { rally: 1, thunderfall: 1, mend: 1 }; });
  await ev(() => { Linkdown.play({ mode: 'friendly', champ: 'Pip Hollis', tier: 1, skill: 0.5, villageId: 'x' }); });
  await page.waitForTimeout(800); await page.screenshot({ path: '/home/claude/scratch/n1.png' });
  await ev(() => document.querySelector('#gamebox .gb-foot .btn.big').click());
  await page.waitForTimeout(600); await page.screenshot({ path: '/home/claude/scratch/n2.png' });
  // my turn: play the first Kin in attack
  await ev(() => { const S = Linkdown.state; const c = S.me.hand.find(c => c.type === 'kin'); document.querySelector(`[data-h="${c.id}"]`).click(); });
  await page.waitForTimeout(200); await page.screenshot({ path: '/home/claude/scratch/n3.png' });
  await ev(() => [...document.querySelectorAll('#gamebox .gb-foot .btn')][0].click());
  await page.waitForTimeout(150); await page.screenshot({ path: '/home/claude/scratch/n4.png' });
  await page.waitForTimeout(600);
  await ev(() => [...document.querySelectorAll('#gamebox .gb-foot .btn')].pop().click());
  // watch the AI turn in real time, snapping during it
  for (let i = 0; i < 6; i++) { await page.waitForTimeout(450); await page.screenshot({ path: `/home/claude/scratch/n5${i}.png` }); }
  await page.waitForTimeout(3000);
  // then autoplay fast to the end
  await ev(() => { window.__ldFast = true; });
  let res = null, guard = 0, lastSay = '';
  while (!res && guard++ < 80) {
    res = await ev(async () => { const S = Linkdown.state; if (!S) return 'closed'; if (S.result) return S.result; if (S.turn !== 'me' || S.busy) return null;
      const A = S.api, sl = (ms) => new Promise(r => setTimeout(r, ms));
      for (const c of S.me.hand.filter(c => c.type === 'thread')) { const t = Linkdown.THREADS[c.t]; if (t.tgt === 'none') { await A.cast(c.t, null); await sl(20); } }
      if (S.result) return S.result;
      const kc = S.me.hand.filter(c => c.type === 'kin'); if (kc.length && !S.summoned && S.me.field.includes(null)) { const best = kc.sort((a,b)=>b.atk-a.atk)[0]; await A.summon(S.me.hand.filter(c=>c.type==='kin').indexOf(best), best.atk >= best.def ? 'atk' : 'def'); await sl(20); }
      for (const a of A.kinsOf(S.me)) { let g2 = 0; while (g2++ < 4 && a.pos === "atk" && a.swings > 0 && !a.stun && S.me.field.includes(a) && !S.result) { const foes = A.kinsOf(S.ai); if (!foes.length) { await A.attack(A.kinsOf(S.me).indexOf(a), null); } else { const ti = foes.findIndex(d => (d.pos === 'atk' ? d.atk + d.temp : (d.shown ? d.def : 0)) < a.atk + a.temp); if (ti < 0) break; await A.attack(A.kinsOf(S.me).indexOf(a), ti); } await sl(20); } }
      if (S.result) return S.result; A.endTurn(); return null; });
    await page.waitForTimeout(250);
  }
  await page.screenshot({ path: '/home/claude/scratch/n6.png' });
  console.log(JSON.stringify(await ev(() => ({ res: Linkdown.state && Linkdown.state.result, n: Linkdown.state && Linkdown.state.n, lp: Linkdown.state && [Linkdown.state.me.lp, Linkdown.state.ai.lp], say: document.querySelector('#gamebox .gb-say').textContent, th: G.stats.threads, stats: G.stats.linkdown, cd: G.stats.threadCd, ready: ['rally','thunderfall','mend'].map(Linkdown.ready) }))));
  console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
