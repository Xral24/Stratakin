'use strict';
// Dark keeps: the Kinmaster's outposts across Earth, about one for every three villages. Each is a walled square of fortress stone
// held by one of his warlords, with a Dark Fusion Table on a dais in the middle. Beat the warlord and the keep, and its table, are yours.
const Keeps = (() => {
  let G = null, worldRef = null, tick = 0;
  const cache = new Map();
  const NAMES = ['Gloomhold', 'Blackspire', 'Ashkeep', 'Duskwatch', 'Nightrest', 'Grimward', 'Shadeholt', 'Ravenmoor', 'Cinderkeep', 'Hollowfang', 'Mournwall', 'Thornreach', 'Vilegate', 'Soothmark', 'Briarhelm', 'Cragmourn'];
  // the Twelve Holds: eleven in a ring on the surface, nearer ones first, so you meet them as you push out; the twelfth is down in the Core, in the lava
  const RADII = [380, 500, 620, 740, 860, 980, 1100, 1220, 1340, 1460, 1580], COUNT = 11; // eleven on the surface, and one more down in the Core
  function init(game) { G = game; cache.clear(); worldRef = null; }
  const W = () => G.world;
  function onEarth() { return W() && W().preset.id === 'earth'; }
  function sites() {
    if (!onEarth()) return [];
    if (G.stats.holds && G.stats.holdsV === 6) return G.stats.holds;
    const w = W(), out = []; const base = U.hash3(7, 7, 7, w.seed + 0xD4) * Math.PI * 2;
    for (let i = 0; i < COUNT; i++) {
      const a0 = base + i * 2.399; let k = null; // golden-angle spread round the compass
      for (let t = 0; t < 200 && !k; t++) {
        const a = a0 + ((t % 10) - 4.5) * 0.14, r = RADII[i] + Math.floor(t / 10) * 22;
        const x = Math.round(w.spawn.x + Math.cos(a) * r), z = Math.round(w.spawn.z + Math.sin(a) * r);
        const info = w.colInfo(x, z); if (info.lost || info.lostRim || info.h <= SEA + 2 || info.h > 74) continue;
        let sum = 0, sum2 = 0, n = 0, wet = 0;
        for (let dx = -10; dx <= 10; dx += 2) for (let dz = -10; dz <= 10; dz += 2) { const ci = w.colInfo(x + dx, z + dz); if (ci.h <= SEA + 1 || ci.lost) wet++; sum += ci.h; sum2 += ci.h * ci.h; n++; }
        if (wet > (t < 100 ? 0 : 12)) continue; const mean = sum / n; if (sum2 / n - mean * mean > (t < 80 ? 20 : 60)) continue;
        if (Village.markers(x, z, 2).some(m => m.kind === 'village' && Math.hypot(m.x - x, m.z - z) < (t < 140 ? 280 : 200))) continue; // towns keep their blue sky
        const f = (Campaign.sites() || {}).fort; if (f && Math.hypot(f.x - x, f.z - z) < 160) continue;
        if (out.some(o => Math.hypot(o.x - x, o.z - z) < 220)) continue;
        k = { id: 'hold' + i, i, x, z, y: Math.max(SEA + 2, Math.round(mean)), name: NAMES[(i * 5 + Math.floor(U.hash3(i, 93, 1, w.seed) * 16)) % NAMES.length] };
      }
      if (k) out.push(k);
    }
    // anything that found no ground on its bearing: sweep the whole compass for the nearest good spot past the others
    for (let i = 0; out.length < COUNT && i < 400; i++) {
      const a = U.hash3(i, 95, 3, w.seed) * Math.PI * 2, r = 400 + U.hash3(i, 96, 3, w.seed) * 1200;
      const x = Math.round(w.spawn.x + Math.cos(a) * r), z = Math.round(w.spawn.z + Math.sin(a) * r);
      const info = w.colInfo(x, z); if (info.lost || info.lostRim || info.h <= SEA + 2 || info.h > 74) continue;
      let sum = 0, n = 0, wet = 0; for (let dx = -10; dx <= 10; dx += 4) for (let dz = -10; dz <= 10; dz += 4) { const ci = w.colInfo(x + dx, z + dz); if (ci.h <= SEA + 1) wet++; sum += ci.h; n++; }
      if (wet) continue; const f = (Campaign.sites() || {}).fort; if (f && Math.hypot(f.x - x, f.z - z) < 160) continue; if (out.some(o => Math.hypot(o.x - x, o.z - z) < 220)) continue;
      out.push({ id: 'hold' + out.length + 'b', i: out.length, x, z, y: Math.max(SEA + 2, Math.round(sum / n)) });
    }
    out.sort((p, q) => Math.hypot(p.x - w.spawn.x, p.z - w.spawn.z) - Math.hypot(q.x - w.spawn.x, q.z - w.spawn.z));
    { const a = base + 1.1, r = 820; out.push({ id: 'holdcore', core: true, x: Math.round(w.spawn.x + Math.cos(a) * r), z: Math.round(w.spawn.z + Math.sin(a) * r), y: 5 }); }
    const used = new Set(); out.forEach((k, j) => { k.i = k.core ? 9 : j; let ni = Math.floor(U.hash3(j, 93, 1, w.seed) * NAMES.length); while (used.has(ni)) ni = (ni + 1) % NAMES.length; used.add(ni); k.name = NAMES[ni]; });
    G.stats.holds = out; G.stats.holdsV = 6; return out;
  }
  function near(px, pz, r) { return sites().filter(k => Math.hypot(k.x - px, k.z - pz) <= r); }
  function keepFor() { return null; }
  const st = () => { if (!G.stats.keeps) G.stats.keeps = {}; return G.stats.keeps; };
  const taken = (id) => st()[id] === 'taken';
  function stamp(k) {
    const w = W(), set = (x, y, z, b) => w.setBlock(x, y, z, b); const y0 = k.y, X = k.x, Z = k.z;
    w.ensureAround(Math.floor(X / CH), Math.floor(Z / CH), 1, 99);
    if (k.core) { // a basalt island in the lava sea, walled in, under the Core's ceiling
      for (let dx = -13; dx <= 13; dx++) for (let dz = -13; dz <= 13; dz++) { const r = Math.max(Math.abs(dx), Math.abs(dz));
        for (let y = 1; y <= y0 - 1; y++) set(X + dx, y, Z + dz, r <= 11 ? B.BASALT : B.LAVA); set(X + dx, y0, Z + dz, r <= 11 ? B.BASALT : B.AIR); for (let y = y0 + 1; y <= 12; y++) set(X + dx, y, Z + dz, B.AIR); set(X + dx, 13, Z + dz, B.BASALT); }
      const F = B.FORTSTONE;
      for (let d = -8; d <= 8; d++) for (let y = y0 + 1; y <= 11; y++) { set(X + d, y, Z - 8, F); set(X + d, y, Z + 8, F); set(X - 8, y, Z + d, F); set(X + 8, y, Z + d, F); }
      for (let d = -1; d <= 1; d++) for (let y = y0 + 1; y <= y0 + 3; y++) set(X + d, y, Z - 8, B.AIR);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) set(X + i, y0 + 1, Z + 3 + j, F); set(X, y0 + 2, Z + 3, B.DARKTABLE);
      for (const [a, b] of [[-7, -4], [-7, 4], [7, -4], [7, 4]]) set(X + a, y0 + 4, Z + b, B.EMBER);
      for (let z = Z - 7; z <= Z + 1; z++) set(X, y0, z, B.CORAL_R);
      // a basalt causeway out across the lava, toward the nearest island
      for (let d = 12; d <= 40; d++) for (let w2 = -1; w2 <= 1; w2++) { set(X + w2, y0, Z - d, B.BASALT); for (let y = 1; y < y0; y++) set(X + w2, y, Z - d, B.BASALT); for (let y = y0 + 1; y <= 9; y++) if (w.getBlock(X + w2, y, Z - d) !== B.AIR) set(X + w2, y, Z - d, B.AIR); }
      G.meshPass(99); return;
    }
    for (let dx = -11; dx <= 11; dx++) for (let dz = -11; dz <= 11; dz++) {
      for (let y = y0 - 4; y < y0; y++) if (!isSolid(w.getBlock(X + dx, y, Z + dz))) set(X + dx, y, Z + dz, B.STONE);
      const edge = Math.max(Math.abs(dx), Math.abs(dz)); set(X + dx, y0, Z + dz, edge <= 8 ? B.BASALT : B.GRAVEL);
      for (let y = y0 + 1; y <= y0 + 14; y++) if (w.getBlock(X + dx, y, Z + dz) !== B.AIR) set(X + dx, y, Z + dz, B.AIR);
    }
    const F = B.FORTSTONE;
    for (let d = -8; d <= 8; d++) for (let y = y0 + 1; y <= y0 + 6; y++) { set(X + d, y, Z - 8, F); set(X + d, y, Z + 8, F); set(X - 8, y, Z + d, F); set(X + 8, y, Z + d, F); }
    for (let d = -8; d <= 8; d += 2) { set(X + d, y0 + 7, Z - 8, F); set(X + d, y0 + 7, Z + 8, F); set(X - 8, y0 + 7, Z + d, F); set(X + 8, y0 + 7, Z + d, F); } // battlements
    for (const [a, b] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let y = y0 + 1; y <= y0 + 9; y++) set(X + a + i, y, Z + b + j, F); set(X + a, y0 + 10, Z + b, B.VOID); set(X + a, y0 + 11, Z + b, B.TORCH); }
    for (let d = -1; d <= 1; d++) for (let y = y0 + 1; y <= y0 + 3; y++) set(X + d, y, Z - 8, B.AIR); // the gate, open: he wants you to come in
    for (const [a, b] of [[-7, -4], [-7, 4], [7, -4], [7, 4], [-4, 7], [4, 7]]) set(X + a, y0 + 4, Z + b, B.TORCH);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) set(X + i, y0 + 1, Z + 3 + j, F); // the dais
    set(X, y0 + 2, Z + 3, B.DARKTABLE);
    for (let d = -7; d <= 7; d++) set(X, y0, Z - 8 + 1 + (d + 7) % 1, B.BASALT);
    for (let z = Z - 7; z <= Z + 1; z++) set(X, y0, z, B.CORAL_R); // a red carpet up to the dais
    G.meshPass(99);
  }
  // The Hold dressed as a stronghold: a twin-towered gatehouse with a raised portcullis, tall corner towers under dark spires, a wall-walk,
  // ember-lit slots, banners, a keep rising behind the dais, stakes round the outside. Nothing is put on the courtyard floor: the fight
  // needs it, and the back corner at +5, +5 stays clear for a cell. `cap` is the highest block it may use (the Core has a ceiling).
  function dress(k) {
    const w = W(), y0 = k.y, X = k.x, Z = k.z, F = B.FORTSTONE, D = B.BASALT, cap = k.core ? 12 : y0 + 30;
    const set = (x, y, z, b) => { if (y <= cap) w.setBlock(x, y, z, b); };
    const wallTop = k.core ? 11 : y0 + 6;
    // the walls: a footing of basalt, ember slots at head height, a walk behind the parapet
    for (let d = -8; d <= 8; d++) for (const [x, z, ox, oz] of [[X + d, Z - 8, 0, 1], [X + d, Z + 8, 0, -1], [X - 8, Z + d, 1, 0], [X + 8, Z + d, -1, 0]]) {
      if (Math.abs(d) <= 1 && z === Z - 8) continue; // the gate
      set(x, y0 + 1, z, D); if (Math.abs(d) < 7 && Math.abs(d) % 3 === 0 && !(z === Z - 8 && Math.abs(d) < 5)) set(x, y0 + 4, z, B.EMBER);
      if (!k.core && Math.abs(d) <= 6) set(x + ox, y0 + 5, z + oz, D);
    }
    // corner towers: taller, a ring of battlements, a slate spire with a void light, a banner on the two outer faces
    for (const [a, b] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) { const top = k.core ? 11 : y0 + 11;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { for (let y = y0 + 1; y <= top; y++) set(X + a + i, y, Z + b + j, y === y0 + 1 ? D : F); if (!k.core) { if (i || j) { if ((i + j) % 2 !== 0) set(X + a + i, top + 1, Z + b + j, F); } } }
      if (!k.core) { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) set(X + a + i, top + 2, Z + b + j, B.SLATE); set(X + a, top + 3, Z + b, B.SLATE); set(X + a, top + 4, Z + b, B.VOID); set(X + a, top + 1, Z + b, F); }
      set(X + a, top - 2, Z + b + Math.sign(b), B.EMBER); set(X + a + Math.sign(a), top - 2, Z + b, B.EMBER);
      set(X + a, y0 + 6, Z + b + Math.sign(b) * 2, B.BANNER); set(X + a + Math.sign(a) * 2, y0 + 6, Z + b, B.BANNER);
    }
    // the gatehouse: two turrets standing out from the wall either side of the gate, a block of stone bridging them, the portcullis drawn up into it
    const gt = k.core ? 11 : y0 + 9;
    for (const sx of [-1, 1]) { for (let i = 2; i <= 3; i++) for (let j = -10; j <= -8; j++) for (let y = y0 + 1; y <= gt; y++) set(X + sx * i, y, Z + j, y === y0 + 1 ? D : F);
      if (!k.core) { set(X + sx * 2, gt + 1, Z - 10, F); set(X + sx * 3, gt + 1, Z - 8, F); set(X + sx * 3, gt + 1, Z - 10, F); set(X + sx * 2, gt + 1, Z - 8, F); set(X + sx * 2, gt + 2, Z - 9, B.VOID); }
      set(X + sx * 3, y0 + 4, Z - 11, B.EMBER); set(X + sx * 2, y0 + 5, Z - 11, B.BANNER); set(X + sx * 4, y0 + 3, Z - 11, B.TORCH); }
    for (let d = -1; d <= 1; d++) { for (let j = -10; j <= -8; j++) { for (let y = y0 + 1; y <= y0 + 3; y++) if (w.getBlock(X + d, y, Z + j) !== B.AIR) set(X + d, y, Z + j, B.AIR); for (let y = y0 + 5; y <= Math.min(gt - 1, y0 + 7); y++) set(X + d, y, Z + j, F); set(X + d, y0, Z + j, D); }
      set(X + d, y0 + 4, Z - 9, B.IRONWALL); set(X + d, y0 + 4, Z - 10, F); set(X + d, y0 + 4, Z - 8, F); }
    if (!k.core) for (let d = -1; d <= 1; d += 2) set(X + d, y0 + 8, Z - 10, F);
    set(X, y0 + 6, Z - 10, B.EMBER);
    // the keep: a dark tower against the back wall behind the dais, an ember-lit door niche, banners down its face, a spire
    const kt = k.core ? 11 : y0 + 14;
    for (let a = -2; a <= 2; a++) for (let b = 5; b <= 7; b++) for (let y = y0 + 1; y <= kt; y++) set(X + a, y, Z + b, y === y0 + 1 ? D : F);
    for (let y = y0 + 1; y <= y0 + 3; y++) set(X, y, Z + 5, y === y0 + 3 ? B.EMBER : B.BASALT); // the door, shut
    for (const a of [-2, 2]) { set(X + a, y0 + 5, Z + 4, B.BANNER); if (!k.core) set(X + a, y0 + 10, Z + 5, B.EMBER); }
    set(X, y0 + 6, Z + 5, B.EMBER); set(X - 1, y0 + 4, Z + 4, B.TORCH); set(X + 1, y0 + 4, Z + 4, B.TORCH);
    if (!k.core) { for (let a = -3; a <= 3; a++) for (let b = 4; b <= 8; b++) if (Math.abs(a) === 3 || b === 4 || b === 8) { if ((a + b) % 2 === 0) set(X + a, kt + 1, Z + b, F); set(X + a, kt, Z + b, F); } // the keep's head stands out over its walls, battlemented
      for (let r = 2; r >= 0; r--) for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) if (Math.max(Math.abs(a), Math.abs(b)) === r) set(X + a, kt + 1 + (2 - r), Z + 6 + b, B.SLATE);
      set(X, kt + 4, Z + 6, B.VOID);
      // sharpened stakes round the outside, open before the gate; a basalt road up to it
      for (let d = -10; d <= 10; d++) for (const [x, z] of [[X + d, Z - 10], [X + d, Z + 10], [X - 10, Z + d], [X + 10, Z + d]]) { if (z === Z - 10 && Math.abs(d) <= 5) continue; if ((d + 40) % 2 === 0 && w.getBlock(x, y0 + 1, z) === B.AIR) set(x, y0 + 1, z, B.PALISADE); }
      for (let j = -13; j <= -11; j++) for (let d = -1; d <= 1; d++) if (isSolid(w.getBlock(X + d, y0, Z + j))) set(X + d, y0, Z + j, D);
    }
    G.meshPass(99);
  }
  function warlordSpecies(k) {
    const pool = KIN.dex('earth').filter(sp => !sp.fusion && sp.home && (sp.rarity || 0) >= 2 && (sp.rarity || 0) <= 3 && KIN.dominant(sp.elem, 1)[0] === 'Void');
    const any = pool.length ? pool : KIN.dex('earth').filter(sp => !sp.fusion && sp.home && (sp.rarity || 0) === 2);
    return any[Math.floor(U.hash3(k.x, 94, k.z, 0xD4) * any.length)];
  }
  const bosses = {};
  function update(dt, p) {
    if (!onEarth()) return; tick += dt; if (tick < 0.5) return; tick = 0;
    for (const k of near(p.x, p.z, 130)) {
      if (k.core && p.y > CORE_TOP + 8) continue; // the Core hold only wakes when you are down there
      const s = st();
      if (!s['stamped_' + k.id] && Math.hypot(k.x - p.x, k.z - p.z) < 110) { s['stamped_' + k.id] = true; stamp(k); }
      if (s['stamped_' + k.id] && !s['dressed_' + k.id] && Math.hypot(k.x - p.x, k.z - p.z) < 110) { s['dressed_' + k.id] = true; W().ensureAround(Math.floor(k.x / CH), Math.floor(k.z / CH), 1, 99); dress(k); } /* old worlds get the stronghold look once */
      const d = Math.hypot(k.x - p.x, k.z - p.z);
      if (s['stamped_' + k.id] && d < 80 && taken(k.id)) warriors(k);
      if (!taken(k.id) && s['stamped_' + k.id] && d < 70 && !Combat.forHold(k.id).length) muster(k);
      if (!taken(k.id) && d > 150 && Combat.forHold(k.id).length) Combat.clearHold(k.id);
      if (!taken(k.id) && d < 50 && Combat.standingIn(k.id) > 0) continue; // his warriors first; the warlord waits on the dais
      if (!taken(k.id) && d < 50) {
        const b = bosses[k.id];
        if (!b || !Wild.list.includes(b)) {
          const sp = warlordSpecies(k); if (!sp) continue;
          const zl = Wild.zoneLevel(k.x, k.y + 1, k.z, { layer: 'Surface' }, G.trainerLevel || 1);
          const lv = Math.max(14, Math.min(KIN.capOf(sp) + 10, zl + 10));
          const e = Wild.makeEntity(sp, lv, k.x + 0.5, k.y + 1, k.z - 1 + 0.5, { senseR: 6 }); e.keepBoss = k.id; e.elite = true; e.speed = 0; e.patrol = { ax: k.x - 3.5, az: k.z - 1.5, bx: k.x + 4.5, bz: k.z - 1.5, period: 10, phase: 0 };
          Wild.list.push(e); bosses[k.id] = e; if (Combat.forHold(k.id).length) UI.toast('His warriors are down. The warlord comes off the dais with his Kin.', 'bad');
          if (!s['seen_' + k.id]) { s['seen_' + k.id] = true; UI.toast(`${k.name}: one of the Kinmaster's keeps. His warlord holds the Dark Fusion Table inside.`, 'bad'); }
        }
      }
    }
  }
  function onBattle(id, result) {
    if (result !== 'won' && result !== 'caught') return; st()[id] = 'taken'; delete bosses[id]; Combat.clearHold(id);
    const k = sites().find(x => x.id === id); UI.sfx('quest');
    const n = sites().filter(x => taken(x.id)).length; G.stats.crystal = n; const NEED = sites().length;
    UI.toast(`${k ? k.name : 'The hold'} is yours. The spell on its warriors breaks, the clouds over it thin, and a shard of the Binding Crystal is left on the dais (${n} of ${NEED}).`, 'good');
    if (n >= NEED) setTimeout(() => G.explain('The Binding Crystal', 'Every shard. The crystal the Kinmaster used to bind his warriors is whole again in your hands, and it pulls toward him. Take it to the throne room at Thornhold. Sable will know what to do.'), 1500);
    { const surf = sites().filter(x => !x.core); if (surf.every(x => taken(x.id)) && !G.player.has('deepchart')) { G.player.add('deepchart', 1); setTimeout(() => G.explain('The Deep Chart', 'The last surface hold falls, and its freed captain presses a rolled chart into your hands. "He kept this locked up. It is the way down." It shows where to dig to the twelfth Hold, on the lava in the Core, and an older mark beyond it: the Heart, where something enormous sleeps on a bed of Starmetal. Dig anywhere else and you take your chances.'), 2600); } }
    G.addTrainerXp(120); G.shards += 400;
    if (!G.stats.keepTold) { G.stats.keepTold = true; G.explain('A hold taken', 'There are twelve Holds, the Kinmaster\'s fortresses: eleven spread out from home, and one deep in the Core, out on the lava. Each one you take frees the warriors he bound with his crystal, clears the grey sky over it, opens its Dark Fusion Table (the only tables that take Void), and gives you one shard of the Binding Crystal. With all twelve, the crystal is whole, and it will lead you to him.'); }
  }
  // the gloom: grey sky and dim light around every hold you have not taken, fading out over a wide ring
  function gloom(px, pz) {
    if (!onEarth() || G.stats.lightReturned) return 0; let g = typeof Citadel !== 'undefined' ? Citadel.gloom(px, pz) : 0;
    const f = (Campaign.sites() || {}).fort; if (f && !Campaign.C().kinmaster) { const d = Math.hypot(f.x + 40 - px, f.z - pz); if (d < 220) g = 1 - U.clamp((d - 90) / 130, 0, 1); }
    for (const k of sites()) { if (taken(k.id) || k.core) continue; const d = Math.hypot(k.x - px, k.z - pz); if (d < 190) g = Math.max(g, 1 - U.clamp((d - 70) / 120, 0, 1)); }
    return g;
  }
  const WARRIOR_COLS = [{ body: '#3a3448', belly: '#c9b48a', accent: '#7a2aa8', eye: '#c04cff' }, { body: '#2e2a3a', belly: '#a8835a', accent: '#5a2a8a', eye: '#c04cff' }, { body: '#40384a', belly: '#e0b08a', accent: '#8a3ab8', eye: '#c04cff' }];
  function warriors(k) {
    for (let j = 0; j < 3; j++) { const id = 'sb_' + k.id + '_' + j; if (Campaign.hasPerson(id)) continue;
      const pos = [[-5, 2], [5, 2], [-4, -4]][j]; const cols = Object.assign({}, WARRIOR_COLS[j]); if (taken(k.id)) cols.eye = '#ffe08a';
      const n = Campaign.spawnPerson(id, ['Bound Guard', 'Bound Archer', 'Bound Captain'][j], 'spellbound', k.x + pos[0], k.z + pos[1], cols, ['warrior']); n.holdId = k.id; n.yaw = Math.PI; }
  }
  function muster(k) {
    const i = k.i || 0; const lv = Math.min(7, i);
    const plan = [['guard', -3, -5], ['guard', 3, -5], ['shield', 0, -3], ['archer', -6, 5], ['archer', 6, 5], ['axeman', -4, 0], ['axeman', 4, 0], ['captain', 0, 1]];
    const n = Math.min(plan.length, 4 + Math.floor(i * 0.6)); const use = plan.slice(0, n - 1).concat([plan[7]]);
    for (const [kind, ox, oz] of use) { const x = k.x + ox + 0.5, z = k.z + oz + 0.5; Combat.spawn(kind, x, k.y + 1, z, k.id, lv); }
    if (!G.stats.holdFightTold) { G.stats.holdFightTold = true; G.explain('His warriors', 'Inside a hold you fight on foot. Hold a sword or an axe and tap to swing: a sword hits one, an axe cleaves everything in its arc. With a shield in your bag, hold to block; raise it just as a blow lands to parry and stagger them. Your bow works too, and every arrow type has its trick. Catch one from behind and the first hit counts double. No wild Kin come inside these walls. Put them all on their knees and the warlord comes down from the dais with his Kin.'); }
  }
  function inHold(p) { return near(p.x, p.z, 12).some(k => !taken(k.id) && Math.abs(p.y - k.y) < 12); }
  function talkWarrior(n, say) {
    const freed = taken(n.holdId); const k = sites().find(x => x.id === n.holdId) || {};
    // every one of them says something of his own: picked by who he is, and moving on each time you talk to him
    const h = [...String(n.id)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7); n.said = (n.said == null ? h : n.said + 1);
    const DAZED = [
      ['...', 'The crystal... it hums... we hold the gate... we hold the gate...', 'His eyes are glazed and violet. He does not see you at all.'],
      ['Stand back. Nobody passes. Nobody passes.', 'He says it to the air above your head, over and over.'],
      ['I had a farm once. Barley. Or was it...', 'The violet comes back into his eyes. ...No. There is only the hold.'],
      ['The master sees through us. The master sees you now.', 'He smiles without meaning it, and does not move.'],
      ['Cold. So cold in here. Why do I not feel it?', 'He looks at his own hands as if they belonged to someone else.'],
      ['Mind the prisoner. Mind the prisoner. Nobody talks to the prisoner.', 'His eyes slide past you toward the back of the courtyard.'],
      ['We keep the light out. That is the work. Keep the light out.', 'A faint hum comes off him, like a struck bell.'],
      ['Turn round, traveller. While you still choose where you walk.', 'For a moment he almost sounds like himself. Then it is gone.'],
      ['My daughter... she would be grown by now...', 'He blinks hard. The glaze settles back over his eyes.'],
      ['Break the shard on the dais and we are free. Break it. Break it.', 'He whispers it, and then stands straight again as if he never spoke.']];
    if (!freed) return say(DAZED[n.said % DAZED.length]);
    const c = Campaign.C(); const key = 'thanked_' + n.id; const first = !c[key]; c[key] = true;
    if (first) { G.shards += 150; UI.toast('+150 Shards.', 'good'); return say([`I can see. I can SEE. How long was I standing here?`, `He put a shard of that cursed crystal over ${k.name} and we were his. You broke it. Take this, it is all I have on me.`, 'There are other holds. Others like us. Free them.']); }
    if (n.id.endsWith('_2') && !(G.stats.holdDeeds || {})[n.holdId]) return say([`${k.name} is ours again because of you.`, 'The courtyard inside these walls, it should belong to someone who will not let him back in. Eight thousand shards and it is yours to build in. The walls stay as they are: nothing scratches that stone.'], () => { if (G.shards < 8000) { UI.toast('A courtyard deed is 8,000 shards.', 'bad'); return; } G.shards -= 8000; (G.stats.holdDeeds || (G.stats.holdDeeds = {}))[n.holdId] = true; UI.sfx('quest'); UI.toast(`The courtyard of ${k.name} is yours to build in.`, 'good'); });
    return say([`${k.name} is ours again because of you.`, (G.stats.crystal || 0) >= sites().length ? 'The crystal is whole? Then go. End him.' : `${G.stats.crystal || 0} shards of ${sites().length}. Keep going.`]);
  }
  // the end: the whole crystal drags him back to his throne, and he fights with everything he has
  function finalReady() { return sites().length > 0 && (G.stats.crystal || 0) >= sites().length && !G.stats.lightReturned; }
  function onFinal(result) {
    if (result !== 'won' && result !== 'caught') return;
    G.stats.lightReturned = true; Campaign.C().finalDone = true;
    const f = document.getElementById('flash'); f.style.transition = 'opacity 2.5s'; f.style.opacity = 1; setTimeout(() => { f.style.opacity = 0; setTimeout(() => { f.style.transition = ''; }, 2600); }, 900);
    UI.sfx('quest'); G.shards += 5000; G.addTrainerXp(3000);
    if (typeof Weather !== 'undefined') { Weather.state.kind = 'clear'; Weather.state.target = 0; Weather.state.next = 900; }
    setTimeout(() => G.explain('The light comes back', 'With Vexmaw down, the Binding Crystal shatters into light. It sweeps out across the whole kingdom, and every grey sky over every hold burns away. Every bound warrior is free. Earth is free. He is not: he is on his way to the Moon. And somebody is knocking on glass, behind the throne. (+5000 shards)'), 1800);
  }
  // is the dark table at this spot one you have earned?
  function tableOpen(x, z) {
    for (const k of near(x, z, 20)) if (Math.hypot(k.x - x, k.z - z) < 12) return taken(k.id);
    const f = (Campaign.sites() || {}).fort; if (f && Math.hypot(f.x + 72 - x, f.z - z) < 40) return !!Campaign.C().kinmaster;
    return true;
  }
  function mapMarks() { if (!onEarth()) return []; const p = G.player; return Citadel.mapMarks().concat(sites().filter(k => st()['seen_' + k.id] || taken(k.id) || (k.core && G.player.has('deepchart'))).map(k => ({ x: k.x, z: k.z, t: taken(k.id) ? '♜' : '☠', name: k.name + (k.core ? ' (deep in the Core)' : '') + (taken(k.id) ? ' (yours)' : '') }))); }
  return { isTaken: (id) => taken(id), inHold, init, update, onBattle, tableOpen, near, mapMarks, keepFor, sites, gloom, talkWarrior, finalReady, onFinal, COUNT };
})();
