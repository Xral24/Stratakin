const { open } = require('./harness');
(async () => { const h = await open(); const { ev } = h; await h.newGame(process.env.SEED || 'Stratakin');
  const r = await ev(() => { const p = G.player, w = G.world, st = G.questState; G.paused = true; p.add('wings', 1); p.add('deepchart', 1);
    const full = {}; for (const a in Quests.ARCS) full[a] = Quests.arcList(a).length; if (!st.arcs) Quests.current();
    const rows = [];
    const go = (x, z) => { p.x = x + 0.5; p.z = z + 0.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 2, 999); p.y = w.groundY(Math.floor(p.x), Math.floor(p.z)) + 1; const errs = [];
      for (let i = 0; i < 3; i++) for (const [n, f] of [['camp', () => Campaign.update(0.6, p, false)], ['keeps', () => Keeps.update(0.6, p)], ['village', () => Village.update(0.6, p)], ['wild', () => Wild.update(0.1, p, 1, false)], ['quests', () => Quests.update()]]) { try { f(); } catch (e) { errs.push(n + ': ' + e.message); } }
      return errs; };
    for (const a of ['main', 'dark', 'old']) { const L = Quests.arcList(a);
      for (let i = 0; i < L.length; i++) { for (const b in full) st.arcs[b] = b === a ? i : full[b]; st.focus = a; const q = L[i];
        let t = null, hint = ''; try { hint = Quests.hintText(); t = Quests.target(); } catch (e) { rows.push(a + ' ' + q.id + ' THROWS ' + e.message); continue; }
        if (Quests.current() !== q) { rows.push(a + ' ' + q.id + ' not current (gated: ' + Quests.gated(q) + ')'); continue; }
        if (!t) { rows.push(a + ' ' + q.id + ' · no pin'); continue; }
        if (!isFinite(t.x) || !isFinite(t.z)) { rows.push(a + ' ' + q.id + ' BAD PIN ' + JSON.stringify(t)); continue; }
        const d = Math.round(Math.hypot(t.x - p.x, t.z - p.z));
        const errs = go(t.x, t.z); const gy = w.groundY(Math.floor(t.x), Math.floor(t.z)); const top = w.getBlock(Math.floor(t.x), gy + 1, Math.floor(t.z));
        rows.push(`${a} ${q.id} · ${t.note || ''} · ${Math.round(t.x)},${Math.round(t.z)} gy ${gy}${top === B.WATER ? ' WATER' : ''}${errs.length ? ' ERR ' + errs.slice(0, 2).join(' | ') : ''}`); } }
    return rows; });
  console.log(r.join('\n')); console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 5).join('\n') : 'none'); await h.close(); })();
