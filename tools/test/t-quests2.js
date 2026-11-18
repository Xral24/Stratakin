const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', 0); await h.calm();
  console.log(JSON.stringify(await ev(() => { R.render = () => {}; const out = {}; const act = () => ['town', 'towns', 'city', 'cities', 'woodfind', 'woodone', 'woodall', 'stones', 'harvest'].filter(id => Quests.isActive(id)); out.start = act();
    G.stats.villageFreed = true; G.questState.arcs = null; for (let i = 0; i < 30; i++) Quests.update(); out.afterVillage = act(); out.hintTown = (() => { try { G.questState.focus = 'land'; return Quests.hintText ? Quests.hintText() : (Quests.hint && Quests.hint()); } catch (e) { return 'ERR ' + e.message; } })();
    const towns = Village.townList().filter(v => v.size === 'town'), cities = Village.townList().filter(v => v.size === 'city'); out.counts = [towns.length, cities.length];
    G.villageState[towns[0].id] = Object.assign(G.villageState[towns[0].id] || {}, { freed: true }); let ev1 = Quests.update().map(e => e.q && e.q.id); out.town = [ev1, act()];
    for (const t of towns.slice(1, 4)) G.villageState[t.id] = Object.assign(G.villageState[t.id] || {}, { freed: true }); ev1 = Quests.update().map(e => e.q && e.q.id); for (const c of cities) G.villageState[c.id] = Object.assign(G.villageState[c.id] || {}, { freed: true }); const e2 = Quests.update().map(e => e.q && e.q.id), e3 = Quests.update().map(e => e.q && e.q.id); out.land = [ev1, e2, e3];
    G.stats.woodSeen = true; const w1 = Quests.update().map(e => e.q && e.q.id); G.stats.woodCaught = { toad: 1 }; const w2 = Quests.update().map(e => e.q && e.q.id); out.wood = [w1, w2, act()]; out.arcs = G.questState.arcs; return out; })));
  console.log('errors', JSON.stringify(h.errors.slice(0, 4))); await h.close(); })();
