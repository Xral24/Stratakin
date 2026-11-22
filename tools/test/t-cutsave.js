// An old save (kinV 2) with Kin of species that were cut: on load each becomes its nearest kept kin, wherever the save keeps it.
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('cut-1', 0); await h.calm();
  const r = await ev(() => { const mk = (el, shape, extra) => Object.assign(KIN.species(987000 + Math.floor(Math.random() * 999), [el], 0, { primary: el, shape }), { home: { body: 'earth', layer: 'Surface', biome: 'Forest' } }, extra || {});
    const a = KIN.create(mk('Void', 'serpent'), 31); a.nick = 'Noodle'; a.stage = 3; const b = KIN.create(mk('Frost', 'quadruped'), 12); const c = KIN.create(mk('Gale', 'quadruped', { steed: true }), 20);
    G.kin.push(a); G.box.push(KIN.serialize(b)); const v = Village.townList()[0], st = G.villageState[v.id] || (G.villageState[v.id] = {}); st.guards = [KIN.serialize(c)]; G.eggs.push({ seed: 123, t: 0 });
    G.save(); const d = JSON.parse(localStorage.getItem(G.SAVE_KEY)); const before = { kinV: d.kinV, kin: d.kin.map(k => k.sp.names[0] + ':' + k.level), box: d.box.map(k => k.sp.names[0]), guards: d.villageState[v.id].guards.map(k => k.sp.names[0]) };
    d.kinV = 2; localStorage.setItem(G.SAVE_KEY, JSON.stringify(d)); const ok = G.load();
    return { before, ok, after: { kin: G.kin.map(k => KIN.name(k) + ':' + k.level + ':st' + k.stage + ':' + k.sp.names[0]), box: G.box.map(k => k.sp.names[0]), guards: (G.villageState[v.id].guards || []).map(k => k.sp.names[0]), eggs: G.eggs.length } }; });
  console.log(JSON.stringify(r, null, 1));
  await page.waitForTimeout(2500); const toast = await ev(() => [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | ')); console.log('toast:', toast.slice(0, 200));
  const a = r.after; const pass = r.ok && a.kin.some(s => /^Noodle:31:st3:Ravlet/.test(s)) && a.box.includes('Snobble') && a.guards.includes('Trotlet');
  console.log(pass ? 'CUTSAVE PASS' : 'CUTSAVE FAIL'); console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); await h.close(); })();
