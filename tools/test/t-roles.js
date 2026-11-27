const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame('gal-1'); await h.calm();
  await page.setViewportSize({ width: 412, height: 860 });
  console.log(JSON.stringify(await ev(() => { const out = { count: {}, ex: {} }; for (const b of ['earth','moon','halo']) for (const sp of KIN.dex(b)) { const r = KIN.roleOf(sp); out.count[r] = (out.count[r] || 0) + 1;
      if (!out.ex[r] && !sp.fusion && b === 'earth') { const k = KIN.create(sp, 30); const s = KIN.stats(k); out.ex[r] = [KIN.name(k), s.hp, s.atk, s.pow, s.def, s.spd, s.agi, Linkdown.atkdef(k)]; } }
    // damage check: same attacker into each role
    const att = KIN.create(KIN.dex('earth')[3], 30), mv = KIN.moves(att)[0]; out.dmg = {}; for (const r in out.ex) { const sp = KIN.dex('earth').find(s => KIN.roleOf(s) === r && !s.fusion); const d = KIN.create(sp, 30); let t = 0; for (let i = 0; i < 40; i++) t += Battle.calcDamage(att, d, mv).dmg; out.dmg[r] = [Math.round(t / 40), KIN.stats(d).hp]; }
    return out; })));
  await ev(() => { const sps = KIN.dex('earth').filter(s => !s.fusion && s.home); const seen = new Set(); for (const sp of sps) { const r = KIN.roleOf(sp); if (seen.has(r) || seen.size >= 4) continue; seen.add(r); G.addKin(KIN.create(sp, 20)); } UI.openPanel('kin'); });
  await page.waitForTimeout(800); await page.screenshot({ path: '/home/claude/scratch/r1.png' });
  await ev(() => document.querySelectorAll('.kcard')[1].click()); await page.waitForTimeout(800); await page.screenshot({ path: '/home/claude/scratch/r2.png' });
  console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
