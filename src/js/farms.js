'use strict';
// Farms along the roads between towns: a fenced field, a farmhouse, a farmer with a problem.
// Something eats the crops at night, a Kin you will not find anywhere else in the wild. Go back after dark,
// beat it or catch it, and the farmer lets you pick from the field once a day, every day you pass.
const Farms = (() => {
  let G = null, tick = 0; const pests = {};
  const NAMES = ['Hollyfield Farm', 'Old Mill Farm', 'Brackenridge', 'Two Oaks Farm', 'Sunny Acre', 'Willowmead', 'Crowfoot Farm', 'Barleyhurst'];
  const FARMERS = ['Farmer Gideon', 'Old Maud', 'Farmer Joss', 'Widow Pell', 'Farmer Abe', 'Hattie Crumb', 'Farmer Lowe', 'Ma Briar'];
  const CROPS = [['berry', 3], ['bread', 1], ['frond', 2], ['berry', 2]];
  function init(game) { G = game; for (const k in pests) delete pests[k]; }
  const onEarth = () => G.world && G.world.preset.id === 'earth';
  const S = () => { if (!G.stats.farms) G.stats.farms = {}; return G.stats.farms; };
  function sites() {
    if (!onEarth()) return []; const st = S(); if (st.sites && st.v === 1) return st.sites;
    const w = G.world, towns = Village.townList(), out = [];
    // between each town and its nearest neighbour, off to one side of the line
    for (const a of towns) {
      let b = null, bd = 1e9; for (const t of towns) { if (t === a) continue; const d = Math.hypot(t.x - a.x, t.z - a.z); if (d < bd) { bd = d; b = t; } }
      if (!b || out.length >= 8) continue;
      for (let tr = 0; tr < 30; tr++) {
        const f = 0.45 + (tr % 5) * 0.03, side = (tr % 2 ? 1 : -1) * (20 + Math.floor(tr / 2) * 6);
        const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1; const x = Math.round(a.x + dx * f - dz / L * side), z = Math.round(a.z + dz * f + dx / L * side);
        let ok = true, sum = 0, n = 0; for (let i = -10; i <= 10 && ok; i += 4) for (let j = -10; j <= 10; j += 4) { const ci = w.colInfo(x + i, z + j); if (ci.h <= SEA + 1 || ci.lost || ci.h > 72) ok = false; sum += ci.h; n++; }
        if (!ok) continue; if (towns.some(t => Math.hypot(t.x - x, t.z - z) < (t.R || 20) + 25)) continue; if (out.some(o => Math.hypot(o.x - x, o.z - z) < 120)) continue;
        if (Keeps.sites().some(k => Math.hypot(k.x - x, k.z - z) < 200)) continue;
        out.push({ id: 'farm' + out.length, x, z, y: Math.round(sum / n), name: NAMES[out.length % NAMES.length], farmer: FARMERS[out.length % FARMERS.length] }); break;
      }
    }
    st.sites = out; st.v = 1; return out;
  }
  // the pest: a species that lives only on this farm, never in the wild
  let pestSet = null;
  function pestPool() { return KIN.dex('earth').filter(sp => !sp.fusion && sp.home && sp.home.layer === 'Surface' && (sp.rarity || 0) === 2 && sp.shape !== 'serpent' && sp.shape !== 'bird'); }
  function pestSpecies(f) { const pool = pestPool(); return pool[U.mod(Math.floor(f.x * 7 + f.z * 13), pool.length)] || pool[0]; }
  function isPest(sp) { if (!onEarth()) return false; if (!pestSet) { pestSet = new Set(sites().map(f => pestSpecies(f)).filter(Boolean).map(sp => sp.seed)); } return pestSet.has(sp.seed); }
  function stamp(f) {
    const w = G.world, set = (x, y, z, b) => w.setBlock(x, y, z, b); const X = f.x, Z = f.z, y0 = f.y;
    w.ensureAround(Math.floor(X / CH), Math.floor(Z / CH), 1, 99);
    for (let dx = -12; dx <= 12; dx++) for (let dz = -12; dz <= 12; dz++) { for (let y = y0 - 3; y < y0; y++) if (!isSolid(w.getBlock(X + dx, y, Z + dz))) set(X + dx, y, Z + dz, B.DIRT); set(X + dx, y0, Z + dz, B.GRASS); for (let y = y0 + 1; y <= y0 + 9; y++) if (w.getBlock(X + dx, y, Z + dz) !== B.AIR) set(X + dx, y, Z + dz, B.AIR); }
    // the field: rows of crops on tilled dirt, a fence round it
    for (let dx = -10; dx <= 2; dx++) for (let dz = -10; dz <= 10; dz++) { const edge = dx === -10 || dx === 2 || Math.abs(dz) === 10; if (edge) { set(X + dx, y0 + 1, Z + dz, (dx + dz) % 2 ? B.PLANKS : B.LOG); continue; } if (dz % 3 === 0) { set(X + dx, y0, Z + dz, B.GRAVEL); continue; } set(X + dx, y0, Z + dz, B.DIRT); set(X + dx, y0 + 1, Z + dz, (dx + dz) % 4 === 0 ? B.BERRY : B.FERN); }
    set(X + 2, y0 + 1, Z, B.AIR); // the field gate
    // the farmhouse
    for (let dx = 5; dx <= 11; dx++) for (let dz = -3; dz <= 3; dz++) { const wall = dx === 5 || dx === 11 || Math.abs(dz) === 3; set(X + dx, y0, Z + dz, B.PLANKS); for (let y = y0 + 1; y <= y0 + 3; y++) set(X + dx, y, Z + dz, wall ? (y === y0 + 2 && (dz === 0 || dx === 8) ? B.GLASS : B.LOG) : B.AIR); set(X + dx, y0 + 4, Z + dz, B.PLANKS); }
    for (let dx = 6; dx <= 10; dx++) for (let dz = -2; dz <= 2; dz++) set(X + dx, y0 + 5, Z + dz, B.PLANKS); set(X + 8, y0 + 6, Z, B.PLANKS);
    set(X + 5, y0 + 1, Z, B.AIR); set(X + 5, y0 + 2, Z, B.AIR); set(X + 8, y0 + 3, Z, B.TORCH); set(X + 4, y0 + 1, Z - 2, B.CHEST);
    // a scarecrow that does not work
    set(X - 4, y0 + 1, Z + 4, B.LOG); set(X - 4, y0 + 2, Z + 4, B.LOG); set(X - 5, y0 + 2, Z + 4, B.PLANKS); set(X - 3, y0 + 2, Z + 4, B.PLANKS); set(X - 4, y0 + 3, Z + 4, B.SNOW);
    G.meshPass(99);
  }
  const night = () => Math.cos(G.world.time * Math.PI * 2) > 0.17;
  function update(dt, p) {
    if (!onEarth()) return; tick += dt; if (tick < 0.5) return; tick = 0; const st = S();
    for (const f of sites()) {
      const d = Math.hypot(f.x - p.x, f.z - p.z); if (d > 120) { if (pests[f.id]) { Wild.remove(pests[f.id]); pests[f.id] = null; } continue; }
      if (!st['stamped_' + f.id] && d < 100) { st['stamped_' + f.id] = true; stamp(f); }
      if (!Campaign.hasPerson('farmer_' + f.id) && st['stamped_' + f.id]) { const n = Campaign.spawnPerson('farmer_' + f.id, f.farmer, 'farmer', f.x + 4, f.z + 1, { body: '#6a5a3a', belly: '#e8c39e', accent: '#c9a84c' }, ['fisher']); n.farm = f.id; }
      // the pest comes out after dark until it has been dealt with
      const done = st['done_' + f.id]; const pe = pests[f.id];
      if (!done && night() && d < 70 && (!pe || !Wild.list.includes(pe))) {
        const sp = pestSpecies(f); if (!sp) continue; const lv = Math.max(4, Math.min(KIN.capOf(sp), (G.trainerLevel || 1) + 3));
        const e = Wild.makeEntity(sp, lv, f.x - 4 + 0.5, f.y + 1, f.z + 0.5, { senseR: 4.5 }); e.pest = f.id; e.speed = 1.8; e.patrol = { ax: f.x - 9, az: f.z - 8, bx: f.x + 1, bz: f.z + 8, period: 16, phase: 0 };
        Wild.list.push(e); pests[f.id] = e;
        if (!st['seen_' + f.id] && d < 40) { st['seen_' + f.id] = true; UI.toast(`Something is in the ${f.name} field, rooting through the crops in the dark.`, 'bad'); }
      } else if (pe && !night() && Wild.list.includes(pe)) { Wild.remove(pe); pests[f.id] = null; }
    }
  }
  function onBattle(e, result) { if (result !== 'won' && result !== 'caught') return; const st = S(); st['done_' + e.pest] = true; pests[e.pest] = null; const f = sites().find(x => x.id === e.pest); UI.toast(`That is the end of it. ${f ? f.farmer : 'The farmer'} will want to hear.`, 'good'); }
  function talk(n, say) {
    const st = S(); const f = sites().find(x => x.id === n.farm); if (!f) return say(['Fine day.']);
    if (!st['done_' + f.id]) return say(['Look at my rows. Chewed to the stalk, every night this week.', 'It comes after dark. Never seen a Kin like it, not in forty years of farming. It does not live anywhere round here, it just turns up for my crops.', 'Come back when the sun is down. Beat it, or take it off my hands, I do not mind which. Do that, and you can pick from my field any day you like.']);
    const day = G.dayCount || 0; if (st['picked_' + f.id] === day) return say(['You have had today\'s pick. Come back tomorrow, there will be more.']);
    if (!st['thanked_' + f.id]) { st['thanked_' + f.id] = true; G.shards += 100; }
    st['picked_' + f.id] = day; const c = CROPS[day % CROPS.length]; G.player.add(c[0], c[1]); G.player.add('berry', 2); UI.renderHotbar && UI.renderHotbar();
    return say([c[0] === 'berry' ? 'Help yourself. A good basket of berries today.' : `Help yourself. Today it is ${c[1]} ${ITEMS[c[0]].name.toLowerCase()}, and some berries besides.`, 'Quiet nights now. You did that.']);
  }
  function mapMarks() { return sites().filter(f => S()['stamped_' + f.id]).map(f => ({ x: f.x, z: f.z, t: '✿', name: f.name })); }
  return { init, sites, update, onBattle, talk, isPest, mapMarks };
})();
