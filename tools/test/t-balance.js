const { open } = require('./harness');
(async () => { const h = await open(); await h.newGame('gal-1'); await h.calm();
  const r = await h.ev(() => { const AIL = { burn: { pct: 0.09, turns: 3 }, frost: { pct: 0.08, turns: 3 }, poison: { pct: 0.05, grow: 0.03, turns: 4 }, shock: { pct: 0, skip: 0.3, turns: 3 }, curse: { pct: 0.08, turns: 3 } };
    const all = KIN.dex('earth').filter(sp => !sp.fusion && sp.home && (sp.rarity || 0) <= 3 && !sp.dino); const rng = U.rng(12345); const pick = () => all[rng.int(all.length)];
    const mk = (sp, lv) => { const k = KIN.create(sp, lv); const n = KIN.maxStage(sp); k.stage = lv >= sp.evolveAt[1] ? Math.min(3, n) : lv >= sp.evolveAt[0] ? Math.min(2, n) : 1; k.hp = KIN.stats(k).hp; k.buffs = null; return k; };
    const fight = (A, B) => { let turns = 0, ail = [0, 0], dmg = [0, 0]; A.buffs = null; B.buffs = null; const ks = [A, B]; const hp0 = [A.hp, B.hp];
      while (A.hp > 0 && B.hp > 0 && turns < 40) { turns++; const order = KIN.stats(A).spd >= KIN.stats(B).spd ? [0, 1] : [1, 0];
        for (const i of order) { const me = ks[i], foe = ks[1 - i]; if (me.hp <= 0 || foe.hp <= 0) continue; const mv = KIN.moves(me).filter(m => m.kind !== 'util' && m.power); if (!mv.length) continue; const m = mv[rng.int(mv.length)];
          if (me.buffs && me.buffs.ail && me.buffs.ail.type === 'shock' && Math.random() < 0.3) continue; if (Math.random() > (m.acc || 0.95)) continue;
          const d = Battle.calcDamage(me, foe, m); const dealt = Math.min(foe.hp, d.dmg); foe.hp -= dealt; dmg[i] += dealt; if (m.drain) me.hp = Math.min(KIN.stats(me).hp, me.hp + Math.round(dealt / 3));
          if (m.ail && foe.hp > 0 && !foe.buffs.ail && Math.random() < (m.ailP || 0.45)) foe.buffs.ail = { type: m.ail, turns: AIL[m.ail].turns, n: 0 }; }
        for (const i of [0, 1]) { const k = ks[i]; const st = k.buffs && k.buffs.ail; if (!st || k.hp <= 0) continue; const a = AIL[st.type]; if (a.pct) { const d = Math.max(1, Math.round(KIN.stats(k).hp * (a.pct + (a.grow || 0) * st.n))); const dd = Math.min(k.hp, d); k.hp -= dd; ail[1 - i] += dd; } st.n++; if (--st.turns <= 0) k.buffs.ail = null; } }
      return { win: A.hp > 0 ? 0 : 1, turns, ail, dmg }; };
    const out = {}; for (const lv of [8, 20, 40]) { const el = {}, rar = {}; let T = 0, n = 0, ailSh = 0, first = 0, short = 0, long = 0, moveAil = 0, moveN = 0;
      for (let g = 0; g < 1500; g++) { const a = mk(pick(), lv), b = mk(pick(), lv); const fa = KIN.stats(a).spd >= KIN.stats(b).spd ? 0 : 1; const r = fight(a, b); n++; T += r.turns; const tot = r.dmg[0] + r.dmg[1] + r.ail[0] + r.ail[1]; ailSh += (r.ail[0] + r.ail[1]) / Math.max(1, tot); if (r.win === fa) first++; if (r.turns <= 2) short++; if (r.turns >= 12) long++;
        [a, b].forEach((k, i) => { const e = KIN.dominant(k.sp.elem, 1)[0]; el[e] = el[e] || [0, 0]; el[e][1]++; if (r.win === i) el[e][0]++; const rr = k.sp.rarity || 0; rar[rr] = rar[rr] || [0, 0]; rar[rr][1]++; if (r.win === i) rar[rr][0]++; for (const m of KIN.moves(k)) { moveN++; if (m.ail) moveAil++; } }); }
      out[lv] = { turns: +(T / n).toFixed(1), ailShare: +(ailSh / n * 100).toFixed(1), firstWins: +(first / n * 100).toFixed(0), short: +(short / n * 100).toFixed(0), long: +(long / n * 100).toFixed(0), movesWithAil: +(moveAil / moveN * 100).toFixed(0), el: Object.fromEntries(Object.entries(el).map(([k, v]) => [k, Math.round(v[0] / v[1] * 100)])), rar: Object.fromEntries(Object.entries(rar).map(([k, v]) => [k, Math.round(v[0] / v[1] * 100)])) }; }
    return out; });
  console.log(JSON.stringify(r, null, 0)); console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 2).join('\n') : 'none'); await h.close(); })();
