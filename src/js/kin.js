'use strict';
// Kin: procedurally generated creatures. Element weights instead of fixed types, exponential stat growth, evolution and fusion.
const KIN = (() => {
  const E = ELEMENTS; // ['Flame','Tide','Bloom','Stone','Gale','Frost','Spark','Void','Light']
  const EI = {}; E.forEach((e, i) => EI[e] = i);
  // effectiveness chart[attacker][defender]
  const CHART = E.map(() => E.map(() => 1));
  const set = (a, d, v) => { CHART[EI[a]][EI[d]] = v; };
  const strong = { Flame: ['Bloom', 'Frost'], Tide: ['Flame', 'Stone'], Bloom: ['Tide', 'Stone'], Stone: ['Spark', 'Gale'], Gale: ['Bloom', 'Void'], Frost: ['Bloom', 'Gale'], Spark: ['Tide', 'Gale'], Void: ['Spark', 'Light'], Light: ['Void', 'Frost'] };
  for (const a in strong) for (const d of strong[a]) { set(a, d, 1.8); if (CHART[EI[d]][EI[a]] === 1) set(d, a, 0.6); }
  set('Light', 'Void', 1.8); set('Void', 'Light', 1.8);

  const PALETTE = {
    Flame: ['#ff6a1f', '#ffb020', '#c8321a', '#ffe08a'], Tide: ['#2e7fe0', '#55c7e8', '#1b4d9a', '#b8f0ff'], Bloom: ['#4faa3c', '#9ad94c', '#2e6b2a', '#f4a3d2'],
    Stone: ['#9a8468', '#6b5a48', '#c9b79a', '#4a4036'], Gale: ['#dff4ff', '#9fc9e8', '#ffffff', '#6aa6d8'], Frost: ['#bdf0ff', '#6fd1f2', '#eefaff', '#3c8fb8'],
    Spark: ['#ffe24a', '#8a52ff', '#fff6b0', '#4a3a8a'], Void: ['#5a2a9a', '#1d1030', '#c45cff', '#2f2440'], Light: ['#fff1a8', '#ffd25a', '#fffbe6', '#e0a830']
  };
  const SYL = {
    Flame: ['Em', 'Pyr', 'Ash', 'Cin', 'Scor', 'Bla', 'Kil', 'Fla', 'Ign', 'Char', 'Sear', 'Vul'], Tide: ['Aqu', 'Mar', 'Tid', 'Nal', 'Bru', 'Wav', 'Sel', 'Riv', 'Del', 'Mer', 'Oce', 'Surf'],
    Bloom: ['Fer', 'Mos', 'Ver', 'Thal', 'Bry', 'Lea', 'Syl', 'Pet', 'Ros', 'Iv', 'Sap', 'Flor'], Stone: ['Gra', 'Ter', 'Ork', 'Bol', 'Dun', 'Rok', 'Mag', 'Crag', 'Shal', 'Bas', 'Ore', 'Pebb'],
    Gale: ['Zeph', 'Ael', 'Sky', 'Vel', 'Wis', 'Hur', 'Nim', 'Bree', 'Gus', 'Sol', 'Cirr', 'Aer'], Frost: ['Fri', 'Gla', 'Ic', 'Kry', 'Shi', 'Nev', 'Bri', 'Sno', 'Hail', 'Rime', 'Chil', 'Floe'],
    Spark: ['Vol', 'Zap', 'Jol', 'Ele', 'Stat', 'Tes', 'Ark', 'Amp', 'Flash', 'Ohm', 'Zin', 'Boll'], Void: ['Nyx', 'Umb', 'Vox', 'Nul', 'Gloom', 'Rift', 'Sha', 'Dusk', 'Obs', 'Hol', 'Vey', 'Murk'],
    Light: ['Lum', 'Sol', 'Aur', 'Rad', 'Hal', 'Ser', 'Gli', 'Bea', 'Daw', 'Shi', 'Cand', 'Lus']
  };
  const MID = ['a', 'o', 'i', 'e', 'u', 'ra', 'lo', 'ni', 'vu', 'ke', 'mo', 'ty', 'ri', 'da', 'zu', 'pe'];
  const SHAPES = ['quadruped', 'biped', 'serpent', 'blob', 'bird', 'floater'];
  const DINO_SHAPES = ['raptor', 'longneck', 'horned', 'raptor', 'horned', 'serpent'];
  // off-world Kin glow: fluorescent bodies with an even brighter accent, drawn emissive so they shine in the dark
  const NEON = ['#39ff14', '#ff2bd6', '#00f5ff', '#ffe600', '#b026ff', '#ff6ec7', '#7cff00', '#ff9a00', '#00ffb3'];
  const WATER_SHAPES = ['fish', 'fish', 'serpent', 'blob', 'floater'];
  const ENDS = { quadruped: ['ox', 'fang', 'paw', 'hoof', 'mane', 'tusk'], biped: ['kin', 'ling', 'gar', 'mon', 'dor', 'bo'], serpent: ['coil', 'wyrm', 'tail', 'nag', 'ssa', 'vex'], blob: ['blob', 'bulb', 'glop', 'puff', 'mote', 'gum'], bird: ['wing', 'beak', 'ryl', 'swift', 'talon', 'quill'], floater: ['orb', 'wisp', 'gaze', 'halo', 'drift', 'eye'], fish: ['fin', 'gill', 'scale', 'ray', 'jaw', 'maw'], raptor: ['raptor', 'rex', 'claw', 'don', 'saur', 'tooth'], longneck: ['saurus', 'neck', 'docus', 'titan', 'pod', 'lodon'], horned: ['ceros', 'tops', 'horn', 'frill', 'ankyl', 'shield'] };
  const SUFFIX = ['ior', 'ax', 'on', 'eth', 'ius', 'ara'];
  const MOVES = {
    Flame: ['Ember Bite', 'Flare Burst'], Tide: ['Tide Lash', 'Rip Current'], Bloom: ['Thorn Whip', 'Spore Cloud'], Stone: ['Boulder Slam', 'Quake'], Gale: ['Wing Cut', 'Gust'],
    Frost: ['Icicle Jab', 'Blizzard'], Spark: ['Shock Fang', 'Thunderbolt'], Void: ['Shadow Claw', 'Null Wave'], Light: ['Radiant Strike', 'Dawn Beam']
  };
  const UTIL = { quadruped: 'Guard', biped: 'Focus', serpent: 'Coil', blob: 'Mend', bird: 'Dash', floater: 'Mend', fish: 'Dash', raptor: 'Dash', longneck: 'Mend', horned: 'Guard' };
  const UTIL_DESC = { Guard: 'Halves the next hit taken.', Focus: 'Raises Attack and Power for the fight.', Coil: 'Raises Agility for the fight.', Mend: 'Heals 30% of max health.', Dash: 'Raises Speed; strikes first next turn.' };
  const STAT_KEYS = ['hp', 'atk', 'pow', 'spd', 'agi'];
  const STAT_NAMES = { hp: 'Health', atk: 'Attack', pow: 'Power', spd: 'Speed', agi: 'Agility' };
  const ELEM_W = { // stat weight tweaks by element
    Flame: { atk: 0.4, pow: 0.3, spd: 0.2, hp: -0.3 }, Tide: { pow: 0.3, hp: 0.3, agi: 0.1 }, Bloom: { hp: 0.35, pow: 0.2, spd: -0.2 }, Stone: { hp: 0.6, atk: 0.3, spd: -0.6, agi: -0.3 },
    Gale: { spd: 0.6, agi: 0.4, hp: -0.4 }, Frost: { pow: 0.4, hp: 0.1, spd: -0.2 }, Spark: { spd: 0.5, pow: 0.4, hp: -0.3 }, Void: { pow: 0.5, agi: 0.3, hp: -0.1 }, Light: { hp: 0.3, pow: 0.3, agi: 0.2 }
  };
  const SHAPE_W = { quadruped: { atk: 0.25 }, biped: {}, serpent: { spd: 0.2, agi: 0.2, hp: -0.1 }, blob: { hp: 0.6, spd: -0.4 }, bird: { spd: 0.5, agi: 0.3, hp: -0.3 }, floater: { pow: 0.4, agi: 0.3, atk: -0.3 }, fish: { spd: 0.45, agi: 0.35, atk: 0.1, hp: -0.2 }, raptor: { atk: 0.45, spd: 0.4, hp: -0.2 }, longneck: { hp: 0.8, atk: 0.1, spd: -0.5 }, horned: { hp: 0.5, atk: 0.35, agi: -0.3, spd: -0.3 } };
  // layer / biome element biases for wild rosters
  const BIAS = {
    Surface: { Plains: ['Bloom', 'Stone', 'Spark', 'Gale'], Forest: ['Bloom', 'Gale', 'Bloom', 'Spark'], Desert: ['Flame', 'Stone', 'Flame', 'Gale'], Snowfield: ['Frost', 'Gale', 'Frost', 'Stone'], Swamp: ['Tide', 'Bloom', 'Void', 'Tide'], Mountains: ['Stone', 'Gale', 'Frost', 'Spark'], Ocean: ['Tide', 'Tide', 'Frost', 'Gale'], Mare: ['Stone', 'Void', 'Light', 'Frost'], Highlands: ['Stone', 'Light', 'Gale', 'Frost'], Crater: ['Void', 'Spark', 'Stone', 'Light'], Dunes: ['Flame', 'Spark', 'Light', 'Stone'], Saltflats: ['Spark', 'Light', 'Flame', 'Void'], Mesa: ['Stone', 'Flame', 'Gale', 'Spark'], 'Lost World': ['Bloom', 'Stone', 'Flame', 'Bloom', 'Gale'] },
    Water: ['Tide', 'Tide', 'Frost', 'Void'], Mines: ['Stone', 'Spark', 'Void', 'Stone', 'Flame'], Core: ['Flame', 'Void', 'Flame', 'Stone'], Sky: ['Light', 'Gale', 'Spark', 'Light']
  };

  const RARITY = [
    { name: 'common', w: 60, lvl: 0, stat: 0, catch: 1.0, xp: 1.0 },
    { name: 'uncommon', w: 25, lvl: 1, stat: 15, catch: 0.9, xp: 1.15 },
    { name: 'rare', w: 1.5, lvl: 2, stat: 35, catch: 0.75, xp: 1.4 },
    { name: 'epic', w: 0.25, lvl: 4, stat: 60, catch: 0.6, xp: 1.8 },
    { name: 'legendary', w: 0.03, lvl: 10, stat: 130, catch: 0.3, xp: 3.5 },
  ];
  const MAX_LEVEL = 200; // the ceiling: the Halo legendary sits right at it
  function growth(level) { return 1 + 0.06 * level + 0.0015 * level * level; }
  function xpToNext(level) { return Math.floor(20 + 12 * Math.pow(level, 1.4) * (1 + level / 150)); } // steeper the higher you go
  function dominant(elem, n = 2) { return elem.map((w, i) => [w, i]).sort((a, b) => b[0] - a[0]).slice(0, n).filter(x => x[0] > 0.12).map(x => E[x[1]]); }
  function normalize(v) { const s = v.reduce((a, b) => a + b, 0) || 1; return v.map(x => x / s); }
  function hexMix(a, b, t) { return U.rgbToHex(U.mixColor(U.hexToRgb(a), U.hexToRgb(b), t)); }

  function makeName(r, primary, shape, stage) {
    const s1 = r.pick(SYL[primary]);
    const end = r.pick(ENDS[shape]);
    const mid = r.pick(MID);
    const suf = r.pick(SUFFIX);
    const mid2 = r.pick(MID.filter(m => m !== mid));
    return [cap(s1 + mid + end), cap(s1 + mid + mid2 + end), cap(s1 + mid + mid2 + end + suf)];
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  // Build a species deterministically from a seed and a bias list of elements.
  function species(seed, biasList, tier = 0, opts = {}) {
    const r = U.rng(seed);
    const primary = opts.primary || r.pick(biasList);
    let secondary = null;
    if (r.chance(0.45)) { secondary = r.pick(E); if (secondary === primary) secondary = null; }
    const elem = new Array(9).fill(0);
    elem[EI[primary]] = secondary ? 0.65 : 0.85;
    if (secondary) elem[EI[secondary]] = 0.35;
    // small noise so every species is unique
    for (let i = 0; i < 9; i++) elem[i] += r() * 0.05;
    const shape = opts.shape || r.pick(opts.shapes || SHAPES);
    const rarity = opts.rarity || 0;
    const total = (opts.total || (300 + tier * 26 + RARITY[rarity].stat + r() * 40));
    const w = { hp: 1, atk: 1, pow: 1, spd: 1, agi: 1 };
    for (const k in ELEM_W[primary]) w[k] += ELEM_W[primary][k];
    if (secondary) for (const k in ELEM_W[secondary]) w[k] += ELEM_W[secondary][k] * 0.5;
    for (const k in SHAPE_W[shape]) w[k] += SHAPE_W[shape][k];
    if (opts.hpBonus) w.hp += opts.hpBonus;
    for (const k of STAT_KEYS) w[k] = Math.max(0.25, w[k] + (r() - 0.5) * 0.3);
    const ws = STAT_KEYS.reduce((a, k) => a + w[k], 0);
    const base = {}; for (const k of STAT_KEYS) base[k] = Math.round(total * w[k] / ws);
    const names = makeName(r, primary, shape, 1);
    const feat = { horns: r.chance(0.4), wings: shape !== 'bird' && r.chance(0.25), spikes: r.chance(0.35), tail: shape !== 'blob' && r.chance(0.7), ears: r.chance(0.5), crest: r.chance(0.3), bigEyes: r.chance(0.5) };
    if (rarity >= 3) { feat.crest = true; feat.spikes = true; } if (rarity >= 4) { feat.horns = true; feat.wings = shape !== 'bird'; }
    feat.stripes = r.chance(0.22); feat.spots = !feat.stripes && r.chance(0.22); feat.armor = r.chance(0.18); feat.bigTail = feat.tail && r.chance(0.3);
    const dims = { w: 0.82 + r() * 0.42, l: 0.82 + r() * 0.48, h: 0.86 + r() * 0.34 };
    const pal = PALETTE[primary].slice();
    const pal2 = secondary ? PALETTE[secondary] : pal;
    let colors = { body: hexMix(pal[0], pal2[0], secondary ? 0.25 : 0), belly: pal[3], accent: pal2[1], dark: pal[2], eye: secondary ? pal2[2] : '#111111' };
    if (opts.neon) { const n1 = r.pick(NEON); let n2 = r.pick(NEON); if (n2 === n1) n2 = NEON[(NEON.indexOf(n1) + 3) % NEON.length]; colors = { body: hexMix(n1, '#101020', 0.35), belly: n2, accent: n1, dark: hexMix(n1, '#000010', 0.75), eye: '#ffffff' }; }
    return { seed, names, elem: normalize(elem), base, shape, feat, colors, dims, tier, gen: 0, evolveAt: opts.evolveAt || [14, 30], mythic: !!opts.mythic, size: (opts.size || 1) * (rarity >= 4 ? 2.1 : 1 + 0.07 * rarity), rarity, neon: !!opts.neon };
  }

  const SPECIES_SEED = { earth: 0x5A7A0001, moon: 0x5A7A1001, halo: 0x5A7A2001 };
  // ---- the Kindex: a fixed set of species per planet, about 200 each ----
  // Every habitat (a surface biome, or the water, the mines, the core, the sky) has its own species and keeps them.
  // Each area of about a kilometre favours a handful of the habitat's commons, so a forest here has its regulars and a forest
  // over there has slightly different ones. The rare ones are rare.
  const HABITATS = {
    earth: [['Surface', 'Plains'], ['Surface', 'Forest'], ['Surface', 'Desert'], ['Surface', 'Snowfield'], ['Surface', 'Swamp'], ['Surface', 'Mountains'], ['Surface', 'Ocean'], ['Surface', 'Lost World'], ['Water', 'Plains'], ['Mines', 'Plains'], ['Core', 'Plains'], ['Sky', 'Plains']],
    moon: [['Surface', 'Mare'], ['Surface', 'Highlands'], ['Surface', 'Crater'], ['Mines', 'Plains'], ['Core', 'Plains'], ['Sky', 'Plains']],
    halo: [['Surface', 'Dunes'], ['Surface', 'Saltflats'], ['Surface', 'Mesa'], ['Water', 'Plains'], ['Mines', 'Plains'], ['Core', 'Plains'], ['Sky', 'Plains']],
  };
  const PLANET_SIZE = 200;
  const LAYER_HARD = { Surface: 0, Water: 30, Mines: 50, Core: 120, Sky: 140 };
  const BODY_HARD = { earth: 0, moon: 90, halo: 160 };
  const habitatCache = new Map();
  function habitatKey(bodyId, layer, biomeName) {
    if (layer !== 'Surface') biomeName = 'Plains';
    const hs = HABITATS[bodyId] || HABITATS.earth;
    if (!hs.some(h => h[0] === layer && h[1] === biomeName)) { // anything unlisted borrows the nearest habitat
      const alt = hs.find(h => h[0] === layer) || hs[0]; layer = alt[0]; biomeName = alt[1];
    }
    return [bodyId, layer, biomeName];
  }
  function habitat(bodyId, layer, biomeName) {
    const [b, L, bn] = habitatKey(bodyId, layer, biomeName); const key = b + '|' + L + '|' + bn;
    let list = habitatCache.get(key); if (list) return list;
    const hs = HABITATS[b] || HABITATS.earth; const hi = hs.findIndex(h => h[0] === L && h[1] === bn); const n = Math.floor(PLANET_SIZE / hs.length) + (hi < PLANET_SIZE % hs.length ? 1 : 0);
    // about half common, then fewer at each step; legendaries live only in the special places
    const special = L === 'Core' || L === 'Sky' || bn === 'Lost World' || bn === 'Crater';
    const counts = [0, 0, 0, 1, special ? 1 : 0]; counts[2] = Math.max(2, Math.round(n * 0.14)); counts[1] = Math.round(n * 0.3); counts[0] = n - counts[1] - counts[2] - counts[3] - counts[4];
    const bias = L === 'Surface' ? (BIAS.Surface[bn] || BIAS.Surface.Plains) : (BIAS[L] || BIAS.Mines);
    const Li = { Surface: 1, Mines: 2, Core: 3, Sky: 4, Water: 5 }[L] || 1;
    list = [];
    for (let rar = 0; rar < 5; rar++) for (let i = 0; i < counts[rar]; i++) {
      const seed = U.combine(SPECIES_SEED[b] || SPECIES_SEED.earth, Li, 77, rar * 100 + i, U.strHash(bn));
      const sp = species(seed, bias, 0, { rarity: rar, total: 300 + LAYER_HARD[L] + BODY_HARD[b] + RARITY[rar].stat + (bn === 'Lost World' ? 120 : 0) + (i % 5) * 8, shapes: L === 'Water' ? WATER_SHAPES : bn === 'Lost World' ? DINO_SHAPES : SHAPES, neon: b !== 'earth' });
      if (L === 'Surface' && (bn === 'Mountains' || bn === 'Snowfield' || bn === 'Highlands' || bn === 'Mesa') && (sp.shape === 'quadruped' || sp.shape === 'biped')) sp.climber = true;
      if (bn === 'Lost World') { sp.dino = true; sp.size *= 1.25; }
      sp.home = { body: b, layer: L, biome: bn }; sp.dex = 0;
      list.push(sp);
    }
    habitatCache.set(key, list);
    return list;
  }
  // what lives in one place: the area's own commons and uncommons, and the habitat's rare ones
  function roster(bodyId, regionX, regionZ, layer, biomeName) {
    const all = habitat(bodyId, layer, biomeName);
    const by = [0, 1, 2, 3, 4].map(r => all.filter(sp => sp.rarity === r));
    const pickLocal = (arr, k, salt) => { if (arr.length <= k) return arr; const r = U.rng(U.combine(regionX, regionZ, salt, arr[0].seed)); const idx = arr.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = r.int(i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; } return idx.slice(0, k).sort((a, b) => a - b).map(i => arr[i]); };
    return pickLocal(by[0], 4, 11).concat(pickLocal(by[1], 3, 12), by[2], by[3], by[4]);
  }
  function speciesForContext(bodyId, regionX, regionZ, layer, biomeName, tier, index) { return roster(bodyId, regionX, regionZ, layer, biomeName)[index % 3]; }
  // Build every habitat once, in a fixed order: give every species a unique name and a Kindex number.
  const MAX_TIER = 9;
  let universeBuilt = false; const DEX = { earth: [], moon: [], halo: [] };
  function buildUniverse() {
    if (universeBuilt) return; universeBuilt = true;
    const taken = new Map();
    for (const body of ['earth', 'moon', 'halo']) for (const [layer, biome] of HABITATS[body]) {
      for (const sp of habitat(body, layer, biome)) {
        let nm = sp.names[0];
        if (taken.has(nm)) {
          const r = U.rng(sp.seed ^ 0x77);
          let tries = 0;
          do { const extra = r.pick(MID); nm = cap(sp.names[0] + extra); tries++; } while (taken.has(nm) && tries < 20);
          const stem = nm; sp.names = [stem, cap(stem + sp.names[1].slice(sp.names[0].length)), cap(stem + sp.names[2].slice(sp.names[0].length))];
        }
        taken.set(nm, sp.seed);
        DEX[body].push(sp); sp.dex = DEX[body].length;
      }
    }
    for (const body of ['earth', 'moon', 'halo']) {
      const land = DEX[body].filter(sp => sp.home && sp.home.layer === 'Surface' && (sp.shape === 'quadruped' || sp.shape === 'horned' || sp.shape === 'raptor' || sp.shape === 'longneck'));
      const picks = land.filter(sp => sp.rarity >= 1 && sp.rarity <= 2 && sp.home.biome !== 'Lost World'); const r = U.rng(U.combine(SPECIES_SEED[body], 0x57EED));
      for (let i = 0; i < 4 && picks.length; i++) { const sp = picks.splice(r.int(picks.length), 1)[0]; sp.steed = true; }
      for (const sp of land) if (sp.rarity === 4 || (sp.dino && sp.shape === 'raptor' && sp.rarity <= 1)) sp.steed = true;
    }
  }
  // ---- recipe fusions: 30 per planet, each a fixed pair plus an element stone, each with its own species ----
  const RECIPES = {};
  function recipes(body) {
    buildUniverse();
    if (RECIPES[body]) return RECIPES[body];
    const list = []; RECIPES[body] = list;
    const nat = DEX[body].filter(sp => !sp.fusion);
    const pool = (rar) => nat.filter(sp => sp.rarity === rar && sp.home && sp.home.layer !== 'Core' && sp.home.biome !== 'Lost World');
    const commons = pool(0), uncs = pool(1), rares = pool(2);
    const homeCommons = commons.filter(sp => sp.home.layer === 'Surface' && ['Plains', 'Forest', 'Mare', 'Dunes'].includes(sp.home.biome)); // the first two are easy to find
    const r = U.rng(U.combine(SPECIES_SEED[body] || 1, 0xF05E));
    const usedPair = new Set();
    for (let i = 0; i < 30; i++) {
      let a, b;
      for (let t = 0; t < 40; t++) {
        if (i < 2) { a = homeCommons[r.int(homeCommons.length)]; b = homeCommons[r.int(homeCommons.length)]; }
        else if (i < 10) { a = commons[r.int(commons.length)]; b = commons[r.int(commons.length)]; }
        else if (i < 20) { a = (i % 2 ? uncs : commons)[r.int((i % 2 ? uncs : commons).length)]; b = (i % 3 ? uncs : rares)[r.int((i % 3 ? uncs : rares).length)]; }
        else { a = list[i - 20].out; b = (i % 2 ? rares : uncs)[r.int((i % 2 ? rares : uncs).length)]; }
        const key = [a.seed, b.seed].sort().join(':'); if (a !== b && a.home && (!b.home || a.home.biome !== b.home.biome || i >= 20 || i < 2) && !usedPair.has(key)) { usedPair.add(key); break; }
      }
      const parts = [a, b];
      if (i >= 20) { let c; for (let t = 0; t < 20; t++) { c = uncs[r.int(uncs.length)]; if (!parts.includes(c)) break; } parts.push(c); }
      if (i >= 27) { let d; for (let t = 0; t < 20; t++) { d = rares[r.int(rares.length)]; if (!parts.includes(d)) break; } parts.push(d); }
      const elA = dominant(a.elem, 1)[0], elB = dominant(b.elem, 1)[0]; const stone = r.chance(0.5) ? elA : elB;
      const elem = normalize(a.elem.map((v, k) => v * 0.45 + b.elem[k] * 0.35 + (EI[stone] === k ? 0.2 : 0)));
      const tot = Math.max(...STAT_KEYS.map(() => 0), STAT_KEYS.reduce((s, k) => s + a.base[k], 0), STAT_KEYS.reduce((s, k) => s + b.base[k], 0)) + 70 + (i >= 27 ? 130 : i >= 20 ? 70 : i >= 10 ? 30 : 0);
      const out = species(U.combine(a.seed, b.seed, 0xF0), [stone], 0, { primary: dominant(elem, 1)[0], shape: r.chance(0.6) ? a.shape : b.shape, rarity: 3, total: tot, neon: body !== 'earth' });
      out.elem = elem;
      const stem = a.names[0].slice(0, Math.min(3, a.names[0].length)); const tail = b.names[0].slice(-Math.min(4, b.names[0].length)).toLowerCase();
      let nm = cap(stem + tail); if (DEX[body].some(x => x.names[0] === nm)) nm = cap(stem + r.pick(MID) + tail);
      out.names = [nm, cap(nm + r.pick(['ra', 'on', 'ix', 'or'])), cap(nm + r.pick(SUFFIX))];
      out.colors = { body: hexMix(a.colors.body, b.colors.body, 0.5), belly: b.colors.belly, accent: PALETTE[stone][1], dark: a.colors.dark, eye: PALETTE[stone][3] };
      out.feat.crest = true; out.fusion = true; out.recipe = { body, i }; out.size = Math.max(a.size || 1, b.size || 1) * 1.1;
      out.home = null; DEX[body].push(out); out.dex = DEX[body].length;
      if (i >= 27) out.size *= 1.15;
      list.push({ i, body, a, b, parts, stone, out });
    }
    // forks: five recipes per planet go two ways, and the table decides. On an ordinary Fusion Table with a Light Stone the pair
    // comes out Light; on the Kinmaster's Dark Fusion Table with a Void Stone it comes out Dark. Built after the rest so nothing else moves.
    const r2 = U.rng(U.combine(SPECIES_SEED[body] || 1, 0xF07C));
    for (const fi of FORK_AT) {
      const rc = list[fi]; const { a, b } = rc;
      // the light path: the recipe's own output, turned toward Light
      const base = rc.out; rc.stone = 'Light';
      base.elem = normalize(a.elem.map((v, k) => v * 0.3 + b.elem[k] * 0.3 + (EI.Light === k ? 0.4 : 0)));
      base.colors = { body: hexMix(hexMix(a.colors.body, b.colors.body, 0.5), PALETTE.Light[0], 0.4), belly: PALETTE.Light[3], accent: PALETTE.Light[1], dark: hexMix(b.colors.dark, '#ffffff', 0.25), eye: PALETTE.Light[2] };
      base.feat = Object.assign({}, base.feat, { crest: true, wings: true, spikes: false }); base.light = true;
      // the dark path: a second species, turned toward Void
      const elem = normalize(a.elem.map((v, k) => v * 0.3 + b.elem[k] * 0.3 + (EI.Void === k ? 0.4 : 0)));
      const out = species(U.combine(a.seed, b.seed, 0xF1), ['Void'], 0, { primary: 'Void', shape: base.shape === a.shape ? b.shape : a.shape, rarity: 3, total: STAT_KEYS.reduce((t, k) => t + base.base[k], 0), neon: body !== 'earth' });
      out.elem = elem;
      const stem = b.names[0].slice(0, Math.min(3, b.names[0].length)); const tail = a.names[0].slice(-Math.min(4, a.names[0].length)).toLowerCase();
      let nm = cap(stem + tail); if (DEX[body].some(x => x.names[0] === nm)) nm = cap(stem + r2.pick(MID) + tail);
      out.names = [nm, cap(nm + r2.pick(['ra', 'on', 'ix', 'or'])), cap(nm + r2.pick(SUFFIX))];
      out.colors = { body: hexMix(hexMix(a.colors.body, b.colors.body, 0.5), '#1a0a2a', 0.55), belly: hexMix(a.colors.belly, '#2a1040', 0.5), accent: PALETTE.Void[1], dark: '#0a0412', eye: PALETTE.Void[3] };
      out.feat = Object.assign({}, base.feat, { crest: true, horns: true, spikes: true, wings: base.feat.wings }); out.darkPath = true;
      out.fusion = true; out.recipe = { body, i: fi, fork: true }; out.size = base.size; out.home = null;
      DEX[body].push(out); out.dex = DEX[body].length;
      rc.alt = { stone: 'Void', out };
    }
    return list;
  }
  const FORK_AT = [3, 9, 15, 22, 28];
  function findRecipe(sps) {
    const key = sps.map(sp => sp.seed).sort().join(':');
    for (const body of ['earth', 'moon', 'halo']) for (const rc of recipes(body)) if (rc.parts.map(sp => sp.seed).sort().join(':') === key) return rc;
    return null;
  }
  function fuseRecipe(rc, kins, branch) {
    const level = Math.min(MAX_LEVEL, Math.round(kins.reduce((a, k) => a + k.level, 0) / kins.length) + 2 + (kins.length - 2) * 2);
    const k = create(branch === 'alt' && rc.alt ? rc.alt.out : rc.out, level);
    k.iv = {}; for (const key of STAT_KEYS) k.iv[key] = Math.max(...kins.map(x => x.iv[key]));
    k.hp = stats(k).hp;
    return k;
  }
  function dex(body) { buildUniverse(); for (const b of ['earth', 'moon', 'halo']) recipes(b); return DEX[body] || []; }
  function bySeed(seed) { buildUniverse(); for (const b in DEX) { const sp = DEX[b].find(x => x.seed === seed); if (sp) return sp; } return null; }
  function mythicSpecies(worldSeed) {
    const sp = species(U.combine(SPECIES_SEED.earth, 777), ['Void'], 10, { primary: 'Void', shape: 'serpent', total: 760, evolveAt: [999, 999], mythic: true, size: 2.6 });
    sp.elem = normalize([0.35, 0, 0, 0.1, 0, 0, 0, 0.55, 0]);
    sp.names = ['Mantlewyrm', 'Mantlewyrm', 'Mantlewyrm'];
    sp.colors = { body: '#3a1458', belly: '#ff6a1f', accent: '#ff9f2a', dark: '#1a0a2a', eye: '#ffe08a' };
    sp.feat = { horns: true, wings: false, spikes: true, tail: true, ears: false, crest: true, bigEyes: false };
    return sp;
  }
  // one legendary per body: the Selenaut drifting over the Moon's far side, the Ringwarden roosting on Halo's highest mesa
  function legendSpecies(preset) {
    const L = preset.legend;
    const sp = species(U.combine(SPECIES_SEED[preset.id] || 1, 999), [L.elem], 9, { primary: L.elem, shape: L.shape, total: preset.id === 'halo' ? 1150 : 900, evolveAt: [9999, 9999], size: 3.0, neon: true });
    sp.names = [L.name, L.name, L.name]; sp.legend = true; sp.rarity = 4;
    sp.feat = { horns: true, wings: L.shape !== 'bird', spikes: true, tail: true, ears: false, crest: true, bigEyes: false, stripes: false, spots: false, armor: true, bigTail: true };
    if (preset.id === 'moon') { sp.colors = { body: '#dff4ff', belly: '#7ad7ff', accent: '#ffffff', dark: '#405060', eye: '#b026ff' }; sp.elem = normalize([0, 0, 0, 0.1, 0.1, 0.1, 0, 0.25, 0.45]); }
    else { sp.colors = { body: '#ffd25a', belly: '#fff6b0', accent: '#ffe600', dark: '#7a5a22', eye: '#ff2bd6' }; sp.elem = normalize([0.15, 0, 0, 0, 0.2, 0, 0.4, 0, 0.25]); }
    return sp;
  }
  // the Lost World's two giants: the tyrant in the middle of the jungle and the sea-lizard in the water around it
  function apexSpecies(kind) {
    const rex = kind === 'rex';
    const sp = species(U.combine(SPECIES_SEED.earth, rex ? 1001 : 1002), [rex ? 'Flame' : 'Tide'], 9, { primary: rex ? 'Flame' : 'Tide', shape: rex ? 'raptor' : 'serpent', total: rex ? 1500 : 1350, evolveAt: [9999, 9999], size: rex ? 5.2 : 5.8 });
    sp.names = rex ? ['Tyrannorex', 'Tyrannorex', 'Tyrannorex'] : ['Abyssaurus', 'Abyssaurus', 'Abyssaurus'];
    sp.legend = true; sp.apex = kind; sp.rarity = 4; sp.dino = true;
    sp.feat = { horns: !rex, wings: false, spikes: true, tail: true, ears: false, crest: rex, bigEyes: false, stripes: rex, spots: !rex, armor: true, bigTail: true };
    if (rex) { sp.colors = { body: '#4a3a2a', belly: '#c9a46a', accent: '#d8341e', dark: '#1e1610', eye: '#ffcc00' }; sp.elem = normalize([0.5, 0, 0, 0.35, 0, 0, 0, 0.15, 0]); }
    else { sp.colors = { body: '#1f4a5e', belly: '#cfe6dc', accent: '#3fd1c4', dark: '#0a1e28', eye: '#ff4a3a' }; sp.elem = normalize([0, 0.65, 0, 0, 0, 0, 0, 0.35, 0]); }
    return sp;
  }
  function wardenSpecies(worldSeed, i) {
    const sp = species(U.combine(SPECIES_SEED.earth, 778, i), ['Stone'], 7, { primary: 'Stone', shape: 'biped', total: 520 });
    sp.names = ['Core Warden', 'Core Warden', 'Core Warden'];
    sp.feat.horns = true; sp.feat.spikes = true;
    return sp;
  }
  function starters(worldSeed) {
    return [
      species(U.combine(SPECIES_SEED.earth, 1), ['Flame'], 0, { primary: 'Flame', shape: 'quadruped', total: 350, hpBonus: 0.25 }),
      species(U.combine(SPECIES_SEED.earth, 2), ['Tide'], 0, { primary: 'Tide', shape: 'biped', total: 350, hpBonus: 0.15 }),
      species(U.combine(SPECIES_SEED.earth, 3), ['Bloom'], 0, { primary: 'Bloom', shape: 'blob', total: 350, hpBonus: 0.1 }),
    ];
  }

  // ---- individuals ----
  function create(sp, level, rng) {
    const r = rng || U.rng(Math.floor(Math.random() * 1e9));
    const iv = {}; for (const k of STAT_KEYS) iv[k] = 0.92 + r() * 0.16;
    let stage = 1; while (stage < 3 && level >= sp.evolveAt[stage - 1]) stage++;
    const k = { id: Math.floor(r() * 1e9), sp, level, xp: 0, iv, stage, hp: 0, status: null, nick: null };
    k.hp = stats(k).hp;
    return k;
  }
  function stats(k) {
    const g = growth(k.level) * (1 + 0.22 * (k.stage - 1)) * Math.pow(1.08, k.sp.gen || 0);
    const s = {};
    for (const key of STAT_KEYS) s[key] = Math.max(1, Math.round(k.sp.base[key] * g * k.iv[key]));
    s.hp = Math.round(s.hp * 2.2);
    if (k.equip) for (const slot in k.equip) { const id = k.equip[slot], it = ITEMS[id]; if (it && it.boost) { const m = it.relic && typeof Relics !== 'undefined' ? Relics.mul(id) : 1; for (const key in it.boost) s[key] = Math.round(s[key] * (1 + it.boost[key] * m)); } }
    return s;
  }
  function name(k) { return k.nick || k.sp.names[k.stage - 1]; }
  // techniques: a fourth move learned in an incubator, one per element, stronger than anything the wild teaches
  const TECH = {
    Flame: { name: 'Inferno', elem: 'Flame', kind: 'spec', power: 96, acc: 0.85, crit: true, desc: 'Burns hot; crits often.' },
    Tide: { name: 'Riptide', elem: 'Tide', kind: 'phys', power: 84, acc: 0.95, drain: true, desc: 'Heals a third of the damage dealt.' },
    Bloom: { name: 'Regrowth', elem: 'Bloom', kind: 'util', desc: 'Heals half of max health.' },
    Stone: { name: 'Bulwark', elem: 'Stone', kind: 'util', desc: 'Halves the next two hits taken.' },
    Gale: { name: 'Tailwind', elem: 'Gale', kind: 'util', desc: 'Strikes first next turn and dodges better all fight.' },
    Frost: { name: 'Deep Freeze', elem: 'Frost', kind: 'spec', power: 92, acc: 0.9, pierce: true, desc: 'Goes through Guard.' },
    Spark: { name: 'Overload', elem: 'Spark', kind: 'phys', power: 98, acc: 0.8, crit: true, desc: 'Wild and heavy; crits often.' },
    Void: { name: 'Null Field', elem: 'Void', kind: 'spec', power: 86, acc: 0.95, pierce: true, desc: 'Goes through Guard.' },
    Light: { name: 'Radiance', elem: 'Light', kind: 'spec', power: 90, acc: 0.9, drain: true, desc: 'Heals a third of the damage dealt.' },
  };
  function techFor(k) { return TECH[dominant(k.sp.elem, 1)[0]].name; }
  function techByName(nm) { for (const e in TECH) if (TECH[e].name === nm) return TECH[e]; return null; }
  function moves(k) {
    const dom = dominant(k.sp.elem, 2);
    const e1 = dom[0], e2 = dom[1] || dom[0];
    const st = k.stage;
    const out = [
      { name: MOVES[e1][0], elem: e1, kind: 'phys', power: 52 + 10 * st, acc: 0.95 },
      { name: MOVES[e2][1], elem: e2, kind: 'spec', power: 58 + 10 * st, acc: 0.9 },
      { name: UTIL[k.sp.shape], kind: 'util', desc: UTIL_DESC[UTIL[k.sp.shape]] },
    ];
    if (k.tech) { const t = techByName(k.tech); if (t) out.push(Object.assign({}, t, { power: t.power ? t.power + 8 * st : undefined, tech: true })); }
    return out;
  }
  function effectiveness(moveElem, defender) {
    const row = CHART[EI[moveElem]];
    let eff = 0; for (let i = 0; i < 9; i++) eff += defender.sp.elem[i] * row[i];
    return eff;
  }
  // how far each kind can grow: commons stay small, legendaries go big, and fusions sit above everything
  const CAP_RANGE = [[10, 35], [30, 50], [40, 65], [50, 85], [110, 170]];
  const CAP_BODY = { earth: 0, moon: 8, halo: 16 }, CAP_HAB = { Core: 5, Sky: 5 };
  function capOf(sp) {
    if (sp.cap) return sp.cap;
    if (sp.recipe) { const i = sp.recipe.i; const base = i >= 27 ? 180 : i >= 20 ? 160 : i >= 10 ? 140 : 120; return Math.min(MAX_LEVEL, base + (i % 10) * 2 + (CAP_BODY[sp.recipe.body] || 0)); }
    if (sp.legend || sp.apex || sp.mythic) return MAX_LEVEL;
    if (!sp.home) return sp.noFuse ? 60 : 70; // starters and the odd ones
    const [lo, hi] = CAP_RANGE[sp.rarity || 0]; const h = sp.home;
    const t = ((sp.seed >>> 5) % 1000) / 1000; const skew = (sp.rarity || 0) === 0 ? t * t : t; // most commons sit low in their range
    return Math.min(MAX_LEVEL, Math.round(lo + (hi - lo) * skew) + (CAP_BODY[h.body] || 0) + (CAP_HAB[h.layer] || 0) + (h.biome === 'Lost World' ? 15 : 0));
  }
  function gainXp(k, amount) {
    const events = [];
    k.xp += amount;
    const cap = Math.min(MAX_LEVEL, capOf(k.sp));
    if (k.level >= cap) { if (!k.peaked) { k.peaked = true; events.push({ type: 'peak', level: k.level }); } k.xp = 0; return events; }
    while (k.xp >= xpToNext(k.level) && k.level < cap) {
      k.xp -= xpToNext(k.level); k.level++;
      const before = stats(k).hp;
      events.push({ type: 'level', level: k.level });
      if (k.stage < 3 && k.level >= k.sp.evolveAt[k.stage - 1]) {
        k.stage++; events.push({ type: 'evolve', name: name(k) });
      }
      const after = stats(k).hp; k.hp = Math.min(after, k.hp + (after - before));
    }
    if (k.level >= cap) { k.xp = 0; if (!k.peaked) { k.peaked = true; events.push({ type: 'peak', level: k.level }); } }
    return events;
  }
  // ---- fusion ----
  // Traits: perks outside battle, granted when 6+ Kin go into one fusion (two traits from 12+).
  const TRAITS = {
    Lantern: 'Glows like a torch while it leads: caves light up around you.',
    Miner: 'You mine 60% faster while it leads.',
    Climber: 'You climb one-block steps automatically and jump higher.',
    Diver: 'Your breath lasts four times longer underwater.',
    Swift: 'You walk 25% faster.',
    Mender: 'Your whole party heals twice as fast.',
    Stalker: 'Wild Kin notice you from 30% closer.',
    Warm: 'Lava burns you half as much.',
  };
  const ELEM_TRAITS = { Flame: ['Lantern', 'Warm'], Tide: ['Diver', 'Mender'], Bloom: ['Mender', 'Climber'], Stone: ['Miner', 'Warm'], Gale: ['Climber', 'Swift'], Frost: ['Stalker', 'Diver'], Spark: ['Swift', 'Miner'], Void: ['Stalker', 'Lantern'], Light: ['Lantern', 'Swift'] };
  // Predicts the level a fusion of these Kin would produce (median plus a bonus that grows with the square root of the count).
  function fusionLevel(levels) {
    const n = levels.length; const s = levels.slice().sort((a, b) => a - b);
    const median = s[Math.floor((n - 1) / 2)];
    const bonus = (1 + 1.6 * Math.sqrt(n - 1)) * (1 + median / 300); // fusing no longer snowballs at high level
    return Math.min(MAX_LEVEL, Math.round(median + bonus));
  }
  // Fusion of 2..16 Kin plus any number of element items -> a brand new species. Deterministic: same inputs, same result.
  function fuse(kins, elemItems) {
    const n = kins.length;
    const sorted = kins.slice().sort((a, b) => (a.sp.seed - b.sp.seed) || (a.level - b.level));
    const parts = []; for (const k of sorted) parts.push(k.sp.seed | 0, k.level, k.stage, k.sp.gen || 0);
    for (const e of elemItems.map(e => EI[e]).sort((a, b) => a - b)) parts.push(1000 + e);
    const r = U.rng(U.combine(...parts));
    const levels = kins.map(k => k.level);
    const level = fusionLevel(levels);
    const maxL = Math.max(...levels);
    // elements: stronger Kin weigh more; items scale with the batch so they still matter at 16
    const elem = new Array(9).fill(0);
    for (const k of kins) { const w = 0.5 + k.level / (2 * maxL); for (let i = 0; i < 9; i++) elem[i] += k.sp.elem[i] * w; }
    for (const e of elemItems) elem[EI[e]] += 0.22 * Math.max(1, n / 2);
    const nelem = normalize(elem);
    // stats: top-heavy blend of max and median, grown by the size of the batch
    const base = {};
    const countBonus = 1 + 0.025 * (n - 2), itemBonus = 1 + 0.02 * Math.min(8, elemItems.length);
    for (const key of STAT_KEYS) {
      const vals = kins.map(k => k.sp.base[key]).sort((a, b) => a - b);
      base[key] = Math.round((0.55 * vals[n - 1] + 0.45 * vals[Math.floor((n - 1) / 2)]) * countBonus * itemBonus);
    }
    const gen = Math.max(...kins.map(k => k.sp.gen || 0)) + 1;
    const lead = kins.reduce((a, b) => (b.level > a.level ? b : a));
    const others = kins.filter(k => k !== lead);
    const other = others.length ? r.pick(others) : lead;
    const shape = r.chance(0.6) ? lead.sp.shape : other.sp.shape;
    const primary = dominant(nelem, 1)[0];
    const stem = lead.sp.names[0].slice(0, Math.min(3, lead.sp.names[0].length));
    const tail = other.sp.names[0].slice(-Math.min(4, other.sp.names[0].length)).toLowerCase();
    const names = [cap(stem + tail), cap(stem + r.pick(MID) + tail), cap(stem + r.pick(MID) + tail + r.pick(SUFFIX))];
    const feat = {};
    for (const f in lead.sp.feat) { const votes = kins.filter(k => k.sp.feat[f]).length; feat[f] = votes * 2 > n || (votes * 2 === n && r.chance(0.5)); }
    const dims = { w: 0, l: 0, h: 0 }; for (const k of kins) { const d = k.sp.dims || { w: 1, l: 1, h: 1 }; dims.w += d.w / n; dims.l += d.l / n; dims.h += d.h / n; }
    if (n >= 12) { feat.horns = true; feat.crest = true; }
    const pal = PALETTE[primary];
    const colors = { body: hexMix(lead.sp.colors.body, other.sp.colors.body, 0.5), belly: other.sp.colors.belly, accent: hexMix(pal[1], lead.sp.colors.accent, 0.5), dark: lead.sp.colors.dark, eye: n >= 8 ? pal[3] : other.sp.colors.eye };
    const traits = [];
    if (n >= 6) { const dom = dominant(nelem, 2); const pool = []; for (const e of dom) pool.push(...ELEM_TRAITS[e]); traits.push(r.pick(pool)); if (n >= 12) { const rest = pool.filter(t => t !== traits[0]); traits.push(rest.length ? r.pick(rest) : r.pick(Object.keys(TRAITS).filter(t => t !== traits[0]))); } }
    const size = Math.max(...kins.map(k => k.sp.size || 1)) * (n >= 12 ? 1.18 : n >= 6 ? 1.08 : 1);
    const sp = { seed: U.combine(...parts, 99), names, elem: nelem, base, shape, feat, colors, dims, tier: Math.max(...kins.map(k => k.sp.tier)), gen, evolveAt: [Math.max(14, level + 7), Math.max(30, level + 19)], mythic: kins.some(k => k.sp.mythic), size, traits, fusedFrom: n };
    const k = create(sp, level, r);
    k.iv = {}; for (const key of STAT_KEYS) k.iv[key] = Math.max(...kins.map(x => x.iv[key]));
    k.hp = stats(k).hp;
    return k;
  }

  // ---- 3D model: a list of parts in local units, facing +Z, feet at y 0 ----
  // Parts are boxes {x,y,z,w,h,d} (kept for hats, tools and the like), blobs (box rounded toward its ellipsoid), tubes (rings along
  // a path) and plates (flat polygons). Each carries a colour, an emissive flag and a bone index; buildMesh turns them into geometry.
  function model(sp, stage) {
    const s = (sp.size || 1) * (stage === 1 ? 0.78 : stage === 2 ? 1.05 : 1.4) * (1 + 0.04 * Math.min(6, sp.gen || 0));
    const C = sp.colors; const f = sp.feat || {}; const dm = sp.dims || { w: 1, l: 1, h: 1 };
    const SX = s * dm.w, SY = s * dm.h, SZ = s * dm.l, SR = s * Math.sqrt(dm.w * dm.h); // SR: a scale for radii
    const parts = []; let bone = 0; const bones = [];
    const P3 = (p) => [p[0] * SX, p[1] * SY, p[2] * SZ];
    const box = (x, y, z, w, h, d, c, emis) => parts.push({ x: x * SX, y: y * SY, z: z * SZ, w: w * SX, h: h * SY, d: d * SZ, c, emis, bone });
    const blob = (x0, y0, z0, x1, y1, z1, round, c, o) => { const a = Math.min(x0, x1) * SX, b = Math.min(y0, y1) * SY, d = Math.min(z0, z1) * SZ; parts.push({ k: 'blob', x: a, y: b, z: d, w: Math.abs(x1 - x0) * SX, h: Math.abs(y1 - y0) * SY, d: Math.abs(z1 - z0) * SZ, round, c, emis: !!(o && o.emis), o: o || null, bone }); };
    const ball = (x, y, z, r, c, o) => blob(x - r, y - r, z - r, x + r, y + r, z + r, 1, c, o);
    const tube = (path, radii, c, o) => { const pp = path.map(P3); const rr = radii.map(r => Array.isArray(r) ? [r[0] * SR, r[1] * SR] : [r * SR, r * SR]); const mr = Math.max(...rr.map(r => Math.max(r[0], r[1]))); const xs = pp.map(p => p[0]), ys = pp.map(p => p[1]), zs = pp.map(p => p[2]); const x = Math.min(...xs) - mr, y = Math.min(...ys) - mr, z = Math.min(...zs) - mr; parts.push({ k: 'tube', path: pp, radii: rr, c, emis: !!(o && o.emis), o: o || null, bone, x, y, z, w: Math.max(...xs) + mr - x, h: Math.max(...ys) + mr - y, d: Math.max(...zs) + mr - z }); };
    const plate = (pts, t, c, o) => { const pp = pts.map(P3); const xs = pp.map(p => p[0]), ys = pp.map(p => p[1]), zs = pp.map(p => p[2]); const x = Math.min(...xs) - t, y = Math.min(...ys) - t, z = Math.min(...zs) - t; parts.push({ k: 'plate', pts: pp, t: t * s, c, emis: !!(o && o.emis), o: o || null, bone, x, y, z, w: Math.max(...xs) + t - x, h: Math.max(...ys) + t - y, d: Math.max(...zs) + t - z }); };
    const cone = (b, dir, len, r, c, o) => { const l = Math.hypot(dir[0], dir[1], dir[2]) || 1; const u = [dir[0] / l, dir[1] / l, dir[2] / l]; tube([b, [b[0] + u[0] * len * 0.5, b[1] + u[1] * len * 0.5, b[2] + u[2] * len * 0.5], [b[0] + u[0] * len, b[1] + u[1] * len, b[2] + u[2] * len]], [r, r * 0.55, 0.0005], c, Object.assign({ cap0: 'flat', cap1: 'none', segs: 6 }, o || {})); };
    const curl = (b, dir, len, r, c, bend, o) => { // a horn or a tail: a tapering tube that curves as it goes (bend: [bx, by, bz] added to the direction along the length)
      const l = Math.hypot(dir[0], dir[1], dir[2]) || 1; const u = [dir[0] / l, dir[1] / l, dir[2] / l]; const pts = [], rr = []; const n = 4;
      for (let i = 0; i <= n; i++) { const t = i / n; pts.push([b[0] + (u[0] + bend[0] * t) * len * t, b[1] + (u[1] + bend[1] * t) * len * t, b[2] + (u[2] + bend[2] * t) * len * t]); rr.push(i === n ? 0.0005 : r * (1 - t * 0.85)); }
      tube(pts, rr, c, Object.assign({ cap0: 'flat', cap1: 'none', segs: 6 }, o || {}));
    };
    const B = (i, kind, piv, extra) => { bones[i] = Object.assign({ kind, piv: P3(piv) }, extra || {}); bone = i; };
    // eyes: a bright eye with a white glint, looking +z; r is the eye radius
    const eyes = (x, y, z, r, o) => { const col = (o && o.col) || C.eye; const bright = (o && o.bright) != null ? o.bright : true; for (const sd of [-1, 1]) { ball(sd * x, y, z, r, col, { emis: bright, n: 3 }); ball(sd * x + sd * r * 0.25, y + r * 0.32, z + r * 0.78, r * 0.32, '#ffffff', { emis: true, n: 2 }); if (o && o.brow) blob(sd * x - r * 0.9, y + r * 0.95, z - r * 0.5, sd * x + r * 0.9, y + r * 1.25, z + r * 0.75, 0.5, o.brow, { n: 2 }); } };
    // a ring of colour round an ellipsoid section (stripes, collars): centre (cx,cy,z), half-sizes hx,hy
    const ring = (cx, cy, z, hx, hy, th, c, o) => { const pts = []; for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2; pts.push([cx + Math.cos(a) * hx, cy + Math.sin(a) * hy, z]); } const rr = pts.map(() => th); tube(pts, rr, c, Object.assign({ cap0: 'none', cap1: 'none', segs: 6 }, o || {})); };
    // markings over a body ellipsoid given as its box
    const markings = (x0, y0, z0, x1, y1, z1) => {
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hx = (x1 - x0) / 2, hy = (y1 - y0) / 2, hz = (z1 - z0) / 2, cz = (z0 + z1) / 2;
      if (f.stripes) for (let i = 0; i < 3; i++) { const u = -0.45 + i * 0.4; const k = Math.sqrt(Math.max(0.05, 1 - u * u)); ring(cx, cy, cz + u * hz, hx * k + 0.012, hy * k + 0.012, 0.028 + hx * 0.06, C.dark); }
      if (f.spots) for (let i = 0; i < 5; i++) { const u = -0.55 + ((i * 37) % 10) / 10 * 1.1, a = 0.35 + ((i * 53) % 10) / 10 * 2.4 * (i % 2 ? 1 : -1); const k = Math.sqrt(Math.max(0.05, 1 - u * u)); const px = cx + Math.cos(a) * hx * k, py = cy + Math.sin(a) * hy * k, pz = cz + u * hz; const r = 0.06 + hx * 0.12; ball(px, py, pz, r, C.accent, { n: 2 }); }
      if (f.armor) for (let i = 0; i < 3; i++) { const u = -0.5 + i * 0.42; const k = Math.sqrt(Math.max(0.1, 1 - u * u)); blob(cx - hx * 0.75 * k, y1 - 0.06, cz + u * hz - hz * 0.16, cx + hx * 0.75 * k, y1 + 0.05, cz + u * hz + hz * 0.16, 0.45, C.dark, { n: 2 }); }
    };
    const spine = (y, z0, z1, n, r) => { for (let i = 0; i < n; i++) { const z = z0 + (z1 - z0) * (i + 0.5) / n; cone([0, y, z], [0, 1, -0.25], r * 2.6, r, C.accent); } };
    const wings = (sx, sy, sz, len, o) => { // a pair of wings from the shoulders at (±sx, sy, sz), spread sideways; bones 7/8 fold them
      for (const sd of [-1, 1]) { B(sd < 0 ? 7 : 8, 'wing', [sd * sx, sy, sz], { side: sd, fold: (o && o.fold) != null ? o.fold : -1.25 });
        const L = len; const pts = [[sd * sx, sy, sz + 0.1], [sd * (sx + L * 0.4), sy + L * 0.2, sz + 0.08], [sd * (sx + L * 0.78), sy + L * 0.26, sz], [sd * (sx + L), sy + L * 0.22, sz - 0.1], [sd * (sx + L * 0.92), sy + L * 0.04, sz - 0.28 * L], [sd * (sx + L * 0.7), sy - L * 0.04, sz - 0.3 * L], [sd * (sx + L * 0.45), sy - L * 0.08, sz - 0.25 * L], [sd * (sx + L * 0.2), sy - L * 0.1, sz - 0.18 * L]];
        plate(pts, 0.035, (o && o.col) || C.accent, { edge: C.dark });
        tube([[sd * sx, sy, sz + 0.08], [sd * (sx + L * 0.4), sy + L * 0.2, sz + 0.06], [sd * (sx + L * 0.78), sy + L * 0.26, sz]], [0.05, 0.04, 0.025], C.dark, { segs: 5, cap0: 'round', cap1: 'round' });
      } bone = 0;
    };
    let hover = 0, legLen = 0.5, kind = sp.shape, flyer = false, sway = null;
    switch (sp.shape) {
      case 'quadruped': {
        blob(-0.35, 0.44, -0.62, 0.35, 1.0, 0.5, 0.85, C.body, { under: C.belly, bulge: 0.06 }); blob(-0.36, 0.42, 0.05, 0.36, 1.02, 0.6, 1, C.body, { under: C.belly });
        markings(-0.35, 0.44, -0.62, 0.35, 1.0, 0.5);
        tube([[0, 0.82, 0.42], [0, 0.98, 0.62], [0, 1.08, 0.76]], [0.21, 0.19, 0.17], C.body, { cap0: 'none', cap1: 'none' });
        B(1, 'head', [0, 0.95, 0.55]);
        blob(-0.27, 0.9, 0.62, 0.27, 1.38, 1.08, 0.9, C.body); blob(-0.17, 0.9, 1.0, 0.17, 1.14, 1.3, 0.7, C.belly); ball(0, 1.1, 1.3, 0.055, C.dark, { n: 2 });
        eyes(0.18, 1.2, 1.02, f.bigEyes ? 0.1 : 0.075, { brow: f.armor || f.spikes ? C.dark : null });
        if (f.ears) for (const sd of [-1, 1]) plate([[sd * 0.1, 1.3, 0.78], [sd * 0.24, 1.3, 0.74], [sd * 0.28, 1.56, 0.66], [sd * 0.14, 1.5, 0.7]], 0.035, C.body, { edge: C.belly });
        if (f.horns) for (const sd of [-1, 1]) curl([sd * 0.14, 1.34, 0.84], [sd * 0.3, 1, -0.2], 0.42, 0.07, C.accent, [sd * 0.4, -0.3, -0.4]);
        bone = 0;
        legLen = 0.6;
        const legs = [[-0.24, 0.38, 2, 0], [0.24, 0.38, 3, Math.PI], [-0.24, -0.42, 4, Math.PI], [0.24, -0.42, 5, 0]];
        for (const [lx, lz, bi, ph] of legs) { B(bi, 'leg', [lx, 0.62, lz], { phase: ph, len: 0.6 }); tube([[lx, 0.66, lz], [lx, 0.35, lz], [lx, 0.09, lz + 0.02]], [0.11, 0.09, 0.08], C.body, { cap0: 'none', cap1: 'none' }); blob(lx - 0.1, 0, lz - 0.08, lx + 0.1, 0.12, lz + 0.14, 0.6, C.dark, { n: 2 }); }
        bone = 0;
        if (f.tail) { B(6, 'tail', [0, 0.85, -0.6]); if (f.bigTail) tube([[0, 0.8, -0.6], [0, 0.92, -0.9], [0, 1.12, -1.15], [0, 1.3, -1.25]], [0.1, 0.16, 0.13, 0.04], C.accent, { cap0: 'none', cap1: 'round' }); else tube([[0, 0.82, -0.6], [0, 0.95, -0.9], [0, 1.15, -1.12], [0, 1.28, -1.2]], [0.07, 0.055, 0.04, 0.0005], C.accent, { cap0: 'none', cap1: 'none' }); bone = 0; }
        if (f.spikes) spine(1.0, -0.5, 0.35, 4, 0.06);
        if (f.wings) wings(0.3, 0.95, -0.1, 0.95);
        if (f.crest) plate([[0, 1.36, 0.7], [0, 1.6, 0.6], [0, 1.58, 0.84], [0, 1.4, 0.94]], 0.04, C.accent);
        break;
      }
      case 'biped': {
        blob(-0.3, 0.5, -0.26, 0.3, 1.27, 0.26, 1, C.body, { under: C.belly, tap: [1.02, 0.82], split: 0.05, soft: 0.35 });
        markings(-0.3, 0.5, -0.26, 0.3, 1.27, 0.26);
        B(1, 'head', [0, 1.25, 0]);
        blob(-0.33, 1.22, -0.3, 0.33, 1.86, 0.3, 1, C.body); eyes(0.14, 1.55, 0.26, f.bigEyes ? 0.1 : 0.075);
        plate([[-0.07, 1.42, 0.3], [0.07, 1.42, 0.3], [0.05, 1.38, 0.3], [-0.05, 1.38, 0.3]], 0.015, C.dark);
        if (f.ears) for (const sd of [-1, 1]) plate([[sd * 0.2, 1.72, 0.0], [sd * 0.32, 1.7, -0.02], [sd * 0.3, 1.98, -0.08], [sd * 0.16, 1.9, -0.04]], 0.035, C.body, { edge: C.belly });
        if (f.horns) for (const sd of [-1, 1]) curl([sd * 0.17, 1.82, -0.02], [sd * 0.25, 1, 0], 0.36, 0.065, C.accent, [sd * 0.3, -0.2, -0.3]);
        if (f.crest) plate([[0, 1.84, -0.22], [0, 2.14, -0.3], [0, 2.1, 0.0], [0, 1.86, 0.1]], 0.04, C.accent);
        bone = 0;
        for (const sd of [-1, 1]) { B(sd < 0 ? 2 : 3, 'arm', [sd * 0.3, 1.1, 0], { phase: sd < 0 ? 0 : Math.PI, side: sd }); tube([[sd * 0.28, 1.12, 0], [sd * 0.4, 0.88, 0.04], [sd * 0.44, 0.64, 0.1]], [0.085, 0.07, 0.06], C.body, { cap0: 'none', cap1: 'round' }); }
        legLen = 0.5;
        for (const sd of [-1, 1]) { B(sd < 0 ? 4 : 5, 'leg', [sd * 0.14, 0.55, 0], { phase: sd < 0 ? 0 : Math.PI, len: 0.5 }); tube([[sd * 0.13, 0.58, 0], [sd * 0.15, 0.3, 0], [sd * 0.16, 0.1, 0.02]], [0.1, 0.09, 0.085], C.dark, { cap0: 'none', cap1: 'none' }); blob(sd * 0.16 - 0.11, 0, -0.08, sd * 0.16 + 0.11, 0.12, 0.2, 0.55, C.dark, { n: 2 }); }
        bone = 0;
        if (f.tail) { B(6, 'tail', [0, 0.6, -0.25]); tube([[0, 0.6, -0.25], [0, 0.55, -0.55], [0, 0.62, -0.8], [0, 0.72, -0.9]], [0.08, 0.07, 0.05, 0.0005], C.accent, { cap0: 'none', cap1: 'none' }); bone = 0; }
        if (f.wings) wings(0.26, 1.05, -0.18, 0.85);
        if (f.spikes) for (let i = 0; i < 3; i++) cone([0, 1.12 - i * 0.18, -0.28 + i * 0.03], [0, 0.3, -1], 0.16, 0.05, C.accent);
        break;
      }
      case 'serpent': {
        kind = 'serpent'; sway = { amp: 0.12 * s, freq: 2.4 / s, speed: 4.5, from: 0.5 * s };
        const pts = [], rr = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([Math.sin(t * 5.5) * 0.14 * t, 0.26 - t * 0.04 + Math.sin(t * 7) * 0.05 * t, 0.7 - t * 2.6]); rr.push(i === 10 ? 0.0005 : [0.27 * (1 - t * 0.75), 0.24 * (1 - t * 0.78)]); }
        tube(pts, rr, C.body, { cap0: 'none', cap1: 'none', segs: 10, shade: (p, nx, ny, nz, t) => { const band = Math.floor(t * 11) % 2 === 1; const belly = ny < -0.35; const c0 = U.hexToRgb(belly ? C.belly : band ? C.dark : C.body); return c0; } });
        B(1, 'head', [0, 0.3, 0.7]);
        blob(-0.3, 0.06, 0.6, 0.3, 0.56, 1.25, 0.8, C.body, { under: C.belly, tap: [1, 0.9] });
        eyes(0.19, 0.4, 1.05, f.bigEyes ? 0.09 : 0.07, { brow: C.dark });
        plate([[-0.02, 0.2, 1.25], [0.02, 0.2, 1.25], [0.03, 0.17, 1.5], [0, 0.15, 1.58], [-0.03, 0.17, 1.5]], 0.012, '#d83a4a');
        if (f.horns) for (const sd of [-1, 1]) curl([sd * 0.16, 0.54, 0.9], [sd * 0.3, 1, -0.4], 0.35, 0.06, C.accent, [sd * 0.3, -0.1, -0.5]);
        if (f.crest) plate([[0, 0.55, 0.65], [0, 0.85, 0.5], [0, 0.95, 0.2], [0, 0.82, -0.1], [0, 0.6, -0.3], [0, 0.45, 0.0], [0, 0.5, 0.4]], 0.035, C.accent);
        bone = 0;
        if (f.spikes) for (let i = 0; i < 6; i++) { const t = i / 6; cone([Math.sin(t * 5.5) * 0.14 * t, 0.47 - t * 0.22, 0.4 - t * 2.2], [0, 1, -0.3], 0.18 * (1 - t * 0.5), 0.05, C.accent); }
        if (f.wings) wings(0.2, 0.42, 0.25, 0.8, { fold: -0.6 });
        legLen = 0.5; break;
      }
      case 'blob': {
        kind = 'blob'; bones[0] = { kind: 'body', piv: [0, 0, 0] };
        blob(-0.55, 0.0, -0.52, 0.55, 1.04, 0.52, 1, C.body, { under: C.dark, tap: [0.86, 0.74], split: -0.4, soft: 0.25, n: 7 });
        markings(-0.55, 0.0, -0.52, 0.55, 1.04, 0.52);
        eyes(0.2, 0.62, 0.42, f.bigEyes ? 0.12 : 0.09);
        plate([[-0.1, 0.42, 0.5], [0.1, 0.42, 0.5], [0.06, 0.34, 0.5], [-0.06, 0.34, 0.5]], 0.012, C.dark);
        for (const sd of [-1, 1]) blob(sd * 0.28 - 0.12, 0, -0.05, sd * 0.28 + 0.12, 0.1, 0.25, 0.6, C.dark, { n: 2 });
        if (f.horns) for (const sd of [-1, 1]) curl([sd * 0.24, 0.98, 0.0], [sd * 0.3, 1, -0.1], 0.34, 0.07, C.accent, [sd * 0.3, -0.2, -0.3]);
        if (f.crest) plate([[0, 1.0, -0.2], [0, 1.32, -0.3], [0, 1.3, 0.0], [0, 1.02, 0.15]], 0.04, C.accent);
        if (f.spikes) for (let i = 0; i < 4; i++) cone([-0.38 + i * 0.25, 1.0 - Math.abs(i - 1.5) * 0.04, -0.1], [(i - 1.5) * 0.3, 1, -0.1], 0.2, 0.05, C.accent);
        if (f.wings) wings(0.45, 0.65, -0.15, 0.7);
        legLen = 0.35; break;
      }
      case 'bird': {
        flyer = true; hover = 0.1;
        blob(-0.24, 0.5, -0.45, 0.24, 1.0, 0.34, 1, C.body, { under: C.belly, tap: [0.9, 0.95], split: -0.1 });
        markings(-0.24, 0.5, -0.45, 0.24, 1.0, 0.34);
        B(1, 'head', [0, 0.95, 0.25]);
        ball(0, 1.12, 0.36, 0.22, C.body); eyes(0.14, 1.18, 0.5, f.bigEyes ? 0.08 : 0.06);
        cone([0, 1.08, 0.52], [0, -0.15, 1], 0.28, 0.07, C.accent); // beak
        if (f.crest) plate([[0, 1.3, 0.3], [0, 1.58, 0.2], [0, 1.52, 0.4], [0, 1.34, 0.45]], 0.035, C.accent);
        if (f.horns) for (const sd of [-1, 1]) curl([sd * 0.12, 1.3, 0.3], [sd * 0.2, 1, -0.3], 0.26, 0.045, C.accent, [sd * 0.2, 0, -0.4]);
        bone = 0;
        wings(0.22, 0.88, -0.05, 1.0, { col: C.accent });
        B(6, 'tail', [0, 0.75, -0.42]); plate([[-0.06, 0.78, -0.42], [0.06, 0.78, -0.42], [0.22, 0.72, -0.9], [0.08, 0.7, -0.98], [-0.08, 0.7, -0.98], [-0.22, 0.72, -0.9]], 0.03, C.accent, { edge: C.dark }); bone = 0;
        legLen = 0.3;
        for (const sd of [-1, 1]) { B(sd < 0 ? 4 : 5, 'leg', [sd * 0.09, 0.55, -0.05], { phase: sd < 0 ? 0 : Math.PI, len: 0.3, amp: 0.35 }); tube([[sd * 0.09, 0.56, -0.05], [sd * 0.1, 0.28, -0.03], [sd * 0.1, 0.06, 0]], [0.04, 0.035, 0.03], C.dark, { cap0: 'none', cap1: 'none', segs: 5 }); for (const tz of [-0.6, 0, 0.6]) tube([[sd * 0.1, 0.05, 0], [sd * 0.1 + tz * 0.08, 0.02, 0.14 - Math.abs(tz) * 0.06]], [0.025, 0.012], C.dark, { segs: 4, cap0: 'none', cap1: 'none' }); }
        bone = 0; break;
      }
      case 'fish': {
        hover = 0.15; sway = { amp: 0.05 * s, freq: 4 / s, speed: 7, from: 0.35 * s };
        blob(-0.21, 0.22, -0.52, 0.21, 0.78, 0.5, 1, C.body, { under: C.belly, tap: [1, 0.95], split: -0.2 });
        markings(-0.21, 0.22, -0.52, 0.21, 0.78, 0.5);
        eyes(0.17, 0.56, 0.32, f.bigEyes ? 0.09 : 0.07); plate([[-0.06, 0.4, 0.5], [0.06, 0.4, 0.5], [0.04, 0.35, 0.5], [-0.04, 0.35, 0.5]], 0.012, C.dark);
        B(6, 'tailfin', [0, 0.5, -0.5]); plate([[0, 0.42, -0.5], [0, 0.58, -0.5], [0, 0.95, -0.95], [0, 0.6, -0.8], [0, 0.5, -0.78], [0, 0.4, -0.8], [0, 0.08, -0.95]], 0.03, C.accent, { edge: C.dark }); bone = 0;
        plate([[0, 0.72, 0.15], [0, 1.05, -0.05], [0, 1.0, -0.35], [0, 0.78, -0.4]], 0.03, C.accent, { edge: C.dark }); // dorsal
        for (const sd of [-1, 1]) plate([[sd * 0.18, 0.4, 0.1], [sd * 0.5, 0.36, -0.05], [sd * 0.52, 0.3, -0.25], [sd * 0.2, 0.36, -0.15]], 0.025, C.accent, { edge: C.dark });
        if (f.horns) for (const sd of [-1, 1]) curl([sd * 0.12, 0.74, 0.38], [sd * 0.2, 1, 0.2], 0.24, 0.04, C.accent, [sd * 0.2, 0, -0.3]);
        if (f.spikes) for (let i = 0; i < 3; i++) cone([0, 0.76, 0.3 - i * 0.28], [0, 1, 0], 0.17, 0.04, C.dark);
        legLen = 0.5; break;
      }
      case 'raptor': { // a lean hunter: horizontal body, long balancing tail, big back legs, tiny arms, a jaw that opens
        blob(-0.3, 0.72, -0.62, 0.3, 1.3, 0.5, 0.9, C.body, { under: C.belly, bulge: 0.05, split: -0.05 }); blob(-0.33, 0.68, -0.68, 0.33, 1.36, -0.12, 1, C.body, { under: C.belly });
        markings(-0.3, 0.72, -0.62, 0.3, 1.3, 0.5);
        tube([[0, 1.1, 0.4], [0, 1.28, 0.58], [0, 1.34, 0.72]], [0.2, 0.18, 0.16], C.body, { cap0: 'none', cap1: 'none' });
        B(1, 'head', [0, 1.25, 0.6]);
        blob(-0.25, 1.1, 0.6, 0.25, 1.55, 1.1, 0.72, C.body); blob(-0.2, 1.12, 1.05, 0.2, 1.42, 1.48, 0.55, C.body, { under: C.belly, split: -0.3 });
        eyes(0.21, 1.4, 0.92, f.bigEyes ? 0.085 : 0.065, { brow: C.dark }); for (const sd of [-1, 1]) ball(sd * 0.09, 1.34, 1.46, 0.025, C.dark, { n: 2 });
        for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) cone([sd * 0.16, 1.13, 1.08 + i * 0.1], [sd * 0.05, -1, 0.05], 0.08, 0.024, '#f4f0e0', { segs: 4 });
        B(9, 'jaw', [0, 1.14, 0.95]); blob(-0.18, 1.0, 0.92, 0.18, 1.14, 1.44, 0.5, C.belly, { n: 2 }); for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) cone([sd * 0.13, 1.13, 1.1 + i * 0.11], [sd * 0.05, 1, 0.05], 0.07, 0.022, '#f4f0e0', { segs: 4 });
        if (f.crest) plate([[0, 1.5, 0.7], [0, 1.8, 0.62], [0, 1.78, 0.9], [0, 1.54, 1.0]], 0.04, C.accent);
        if (f.horns) for (const sd of [-1, 1]) curl([sd * 0.15, 1.5, 0.75], [sd * 0.3, 1, -0.3], 0.3, 0.05, C.accent, [sd * 0.3, -0.2, -0.4]);
        bone = 0;
        for (const sd of [-1, 1]) { B(sd < 0 ? 2 : 3, 'arm', [sd * 0.27, 1.0, 0.28], { phase: sd < 0 ? 0 : Math.PI, side: sd, amp: 0.2 }); tube([[sd * 0.26, 1.0, 0.28], [sd * 0.32, 0.86, 0.42], [sd * 0.36, 0.76, 0.52]], [0.05, 0.045, 0.035], C.body, { cap0: 'none', cap1: 'round', segs: 6 }); }
        legLen = 0.85;
        for (const sd of [-1, 1]) { B(sd < 0 ? 4 : 5, 'leg', [sd * 0.28, 0.95, -0.22], { phase: sd < 0 ? 0 : Math.PI, len: 0.9 }); blob(sd * 0.28 - 0.16, 0.52, -0.5, sd * 0.28 + 0.16, 1.05, -0.02, 1, C.body); tube([[sd * 0.3, 0.6, -0.25], [sd * 0.31, 0.32, -0.12], [sd * 0.31, 0.1, -0.02]], [0.12, 0.1, 0.09], C.dark, { cap0: 'none', cap1: 'none' }); blob(sd * 0.31 - 0.14, 0, -0.16, sd * 0.31 + 0.14, 0.12, 0.3, 0.5, C.dark, { n: 2 }); for (const tz of [-1, 0, 1]) cone([sd * 0.31 + tz * 0.09, 0.05, 0.28], [tz * 0.3, -0.1, 1], 0.14, 0.03, '#e8e4d8', { segs: 4 }); }
        bone = 0;
        B(6, 'tail', [0, 1.05, -0.62]); tube([[0, 1.05, -0.6], [0, 1.08, -1.1], [0, 1.08, -1.6], [0, 1.02, -2.05], [0, 0.98, -2.35]], [0.2, 0.16, 0.11, 0.06, 0.0005], C.body, { cap0: 'none', cap1: 'none', shade: (p, nx, ny, nz, t) => U.hexToRgb(ny < -0.4 ? C.belly : (f.stripes && Math.floor(t * 8) % 2) ? C.dark : C.body) }); bone = 0;
        if (f.spikes) spine(1.32, -0.6, 0.4, 5, 0.06);
        if (f.wings) wings(0.3, 1.15, -0.2, 1.0);
        break;
      }
      case 'longneck': { // a tall browser: barrel body, pillar legs, a long neck and a small head high up
        blob(-0.5, 0.62, -0.85, 0.5, 1.52, 0.75, 0.9, C.body, { under: C.belly, bulge: 0.04 });
        markings(-0.5, 0.62, -0.85, 0.5, 1.52, 0.75);
        legLen = 0.7;
        const legs = [[-0.3, 0.45, 2, 0], [0.3, 0.45, 3, Math.PI], [-0.3, -0.55, 4, Math.PI], [0.3, -0.55, 5, 0]];
        for (const [lx, lz, bi, ph] of legs) { B(bi, 'leg', [lx, 0.75, lz], { phase: ph, len: 0.7, amp: 0.4 }); tube([[lx, 0.8, lz], [lx, 0.4, lz], [lx, 0.08, lz]], [0.16, 0.14, 0.14], C.body, { cap0: 'none', cap1: 'none' }); blob(lx - 0.17, 0, lz - 0.16, lx + 0.17, 0.1, lz + 0.18, 0.5, C.dark, { n: 2 }); }
        bone = 0;
        B(1, 'head', [0, 1.3, 0.6]);
        tube([[0, 1.25, 0.55], [0, 1.75, 0.9], [0, 2.3, 1.08], [0, 2.75, 1.12]], [0.24, 0.19, 0.15, 0.13], C.body, { cap0: 'none', cap1: 'none', shade: (p, nx, ny, nz) => ny < -0.4 ? U.hexToRgb(C.belly) : null });
        blob(-0.17, 2.66, 1.0, 0.17, 2.96, 1.5, 0.75, C.body, { under: C.belly, split: -0.3 }); eyes(0.14, 2.86, 1.22, 0.055);
        if (f.crest) plate([[0, 2.95, 1.05], [0, 3.15, 0.95], [0, 3.12, 1.2], [0, 2.97, 1.28]], 0.035, C.accent);
        bone = 0;
        B(6, 'tail', [0, 1.15, -0.85]); tube([[0, 1.15, -0.8], [0, 1.2, -1.4], [0, 1.15, -2.0], [0, 1.05, -2.5], [0, 1.0, -2.75]], [0.22, 0.17, 0.11, 0.06, 0.0005], C.body, { cap0: 'none', cap1: 'none', shade: (p, nx, ny) => ny < -0.4 ? U.hexToRgb(C.belly) : null }); bone = 0;
        if (f.spikes) spine(1.5, -0.8, 0.6, 7, 0.06);
        if (f.wings) wings(0.45, 1.3, -0.1, 1.1);
        break;
      }
      case 'horned': { // a low tank: wide body, a bony frill behind the head and horns on the brow
        blob(-0.5, 0.42, -0.75, 0.5, 1.12, 0.55, 0.85, C.body, { under: C.belly, bulge: 0.05 });
        markings(-0.5, 0.42, -0.75, 0.5, 1.12, 0.55);
        legLen = 0.5;
        const legs = [[-0.33, 0.35, 2, 0], [0.33, 0.35, 3, Math.PI], [-0.33, -0.5, 4, Math.PI], [0.33, -0.5, 5, 0]];
        for (const [lx, lz, bi, ph] of legs) { B(bi, 'leg', [lx, 0.6, lz], { phase: ph, len: 0.5, amp: 0.45 }); tube([[lx, 0.62, lz], [lx, 0.3, lz], [lx, 0.08, lz]], [0.14, 0.12, 0.12], C.body, { cap0: 'none', cap1: 'none' }); blob(lx - 0.15, 0, lz - 0.14, lx + 0.15, 0.1, lz + 0.16, 0.5, C.dark, { n: 2 }); }
        bone = 0;
        B(1, 'head', [0, 0.85, 0.5]);
        blob(-0.34, 0.58, 0.5, 0.34, 1.16, 1.15, 0.7, C.body, { under: C.belly, split: -0.3 }); blob(-0.18, 0.62, 1.1, 0.18, 0.92, 1.42, 0.5, C.dark, { n: 3 });
        eyes(0.3, 0.95, 0.95, 0.065, { brow: C.dark });
        plate([[-0.6, 0.78, 0.4], [-0.66, 1.1, 0.36], [-0.55, 1.45, 0.3], [-0.3, 1.68, 0.26], [0, 1.74, 0.24], [0.3, 1.68, 0.26], [0.55, 1.45, 0.3], [0.66, 1.1, 0.36], [0.6, 0.78, 0.4]], 0.1, C.accent, { edge: C.dark }); // the frill
        if (f.spikes) for (let i = 0; i < 5; i++) { const a = Math.PI * (0.15 + i * 0.175); cone([Math.cos(a) * 0.62, 0.78 + Math.sin(a) * 0.9, 0.3], [Math.cos(a), Math.sin(a), -0.1], 0.18, 0.05, C.belly); }
        for (const sd of [-1, 1]) curl([sd * 0.22, 1.1, 0.95], [sd * 0.25, 0.7, 1], 0.45, 0.065, C.belly, [sd * 0.1, 0.3, 0]); curl([0, 0.98, 1.3], [0, 0.7, 1], 0.3, 0.06, C.belly, [0, 0.3, 0]);
        bone = 0;
        B(6, 'tail', [0, 0.7, -0.75]); tube([[0, 0.7, -0.7], [0, 0.72, -1.0], [0, 0.66, -1.25], [0, 0.6, -1.4]], [0.14, 0.1, 0.06, 0.0005], C.body, { cap0: 'none', cap1: 'none' }); bone = 0;
        if (f.wings) wings(0.45, 1.0, -0.2, 1.0);
        break;
      }
      case 'human': { // the folk of Stratakin: not humans. Big egg heads, long leaf ears that twitch, round noses, four thick fingers, stocky legs and big boots
        kind = 'human';
        const skin = C.belly, cloth = C.body, dark = C.dark, hair = sp.hair || hexMix(C.dark, '#2a1a10', 0.5), skin2 = hexMix(skin, '#c8604a', 0.22);
        blob(-0.32, 0.6, -0.21, 0.32, 1.26, 0.21, 0.7, cloth, { tap: [1.0, 0.9], bulge: 0.05, n: 4 });
        ring(0, 0.67, 0, 0.3, 0.19, 0.03, dark); blob(-0.12, 0.6, -0.2, 0.12, 0.74, 0.2, 0.5, hexMix(C.accent, '#000000', 0.15), { n: 2 }); // belt and buckle
        tube([[0, 1.18, 0], [0, 1.36, 0]], [0.09, 0.09], skin, { cap0: 'none', cap1: 'none', segs: 6 });
        B(1, 'head', [0, 1.3, 0]);
        blob(-0.27, 1.28, -0.28, 0.27, 1.88, 0.28, 0.92, skin, { n: 5, tap: [0.86, 1.0] }); // egg head: narrower jaw, wide crown
        if (!sp.bald) { blob(-0.29, 1.56, -0.31, 0.29, 1.92, 0.19, 0.9, hair, { n: 4, tap: [0.98, 0.92] }); blob(-0.12, 1.84, 0.02, 0.1, 2.02, 0.27, 0.9, hair, { n: 3 }); } // cap and a quiff
        for (const sd of [-1, 1]) {
          ball(sd * 0.105, 1.6, 0.22, 0.078, '#ffffff', { n: 3, emis: true }); ball(sd * 0.105, 1.6, 0.272, 0.042, C.eye === '#222222' ? '#3a5a8a' : C.eye, { n: 2 }); ball(sd * 0.105, 1.6, 0.3, 0.022, '#111111', { n: 2 }); ball(sd * 0.085, 1.63, 0.306, 0.012, '#ffffff', { n: 2, emis: true });
          blob(sd * 0.105 - 0.075, 1.7, 0.2, sd * 0.105 + 0.075, 1.735, 0.27, 0.6, hair, { n: 2 }); // brow
        }
        ball(0, 1.5, 0.3, 0.065, skin2, { n: 3 }); // the nose
        plate([[-0.06, 1.41, 0.265], [0.06, 1.41, 0.265], [0.04, 1.385, 0.268], [-0.04, 1.385, 0.268]], 0.012, hexMix(skin, '#5a1a1a', 0.55));
        for (const sd of [-1, 1]) { B(sd < 0 ? 7 : 8, 'ear', [sd * 0.27, 1.6, 0], { side: sd, phase: sd }); plate([[sd * 0.25, 1.52, 0.02], [sd * 0.27, 1.66, 0.04], [sd * 0.5, 1.78, -0.02], [sd * 0.46, 1.7, -0.03], [sd * 0.3, 1.5, 0.0]], 0.035, skin, { edge: skin2 }); plate([[sd * 0.3, 1.56, 0.02], [sd * 0.31, 1.64, 0.03], [sd * 0.43, 1.72, 0.0], [sd * 0.4, 1.66, -0.01]], 0.01, skin2); }
        B(1, 'head', [0, 1.3, 0]); bone = 0;
        for (const sd of [-1, 1]) { B(sd < 0 ? 2 : 3, 'arm', [sd * 0.34, 1.18, 0], { phase: sd < 0 ? 0 : Math.PI, side: sd }); tube([[sd * 0.31, 1.2, 0], [sd * 0.41, 0.9, 0.0]], [0.095, 0.08], cloth, { cap0: 'round', cap1: 'none', segs: 6 }); tube([[sd * 0.41, 0.9, 0.0], [sd * 0.45, 0.62, 0.05]], [0.075, 0.07], skin, { cap0: 'none', cap1: 'none', segs: 6 }); ball(sd * 0.45, 0.55, 0.06, 0.095, skin, { n: 3 }); ball(sd * 0.39, 0.55, 0.12, 0.045, skin, { n: 2 }); }
        legLen = 0.6;
        for (const sd of [-1, 1]) { B(sd < 0 ? 4 : 5, 'leg', [sd * 0.15, 0.62, 0], { phase: sd < 0 ? 0 : Math.PI, len: 0.6, amp: 0.5 }); tube([[sd * 0.15, 0.64, 0], [sd * 0.16, 0.35, 0], [sd * 0.16, 0.12, 0.01]], [0.125, 0.105, 0.1], dark, { cap0: 'none', cap1: 'none', segs: 6 }); blob(sd * 0.16 - 0.12, 0, -0.1, sd * 0.16 + 0.12, 0.15, 0.24, 0.55, hexMix(dark, '#000000', 0.3), { n: 2 }); }
        bone = 0; break;
      }
      default: { // floater: a sphere with a face, orbiting stones and a wisp of a tail
        flyer = true; hover = 0.25;
        blob(-0.36, 0.56, -0.36, 0.36, 1.28, 0.36, 1, C.body, { under: C.dark, split: -0.5, soft: 0.2 });
        markings(-0.36, 0.56, -0.36, 0.36, 1.28, 0.36);
        eyes(0.14, 0.98, 0.3, f.bigEyes ? 0.11 : 0.085); plate([[-0.09, 0.8, 0.36], [0.09, 0.8, 0.36], [0.06, 0.74, 0.36], [-0.06, 0.74, 0.36]], 0.012, C.dark);
        B(6, 'spin', [0, 0.95, 0], { speed: 1.4 }); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ball(Math.cos(a) * 0.62, 1.0 + Math.sin(a * 2) * 0.15, Math.sin(a) * 0.62, 0.09, C.accent, { emis: true, n: 2 }); } bone = 0;
        if (f.horns) for (const sd of [-1, 1]) curl([sd * 0.2, 1.22, 0.0], [sd * 0.3, 1, -0.1], 0.3, 0.06, C.accent, [sd * 0.3, -0.2, -0.3]);
        if (f.crest) plate([[0, 1.26, -0.15], [0, 1.56, -0.25], [0, 1.52, 0.05], [0, 1.28, 0.18]], 0.04, C.accent);
        if (f.tail) tube([[0, 0.6, -0.2], [0, 0.4, -0.45], [0, 0.3, -0.7]], [0.1, 0.06, 0.0005], C.dark, { cap0: 'none', cap1: 'none' });
        if (f.wings) wings(0.3, 1.0, -0.1, 0.7);
        legLen = 0.4;
      }
    }
    if (sp.mythic || sp.neon) for (const b of parts) if (b.c === C.accent || b.c === C.belly || b.c === C.eye) b.emis = true;
    if (!bones[0]) bones[0] = { kind: 'body', piv: [0, 0, 0], runPitch: sp.shape === 'raptor' ? 0.08 : 0 };
    const height = Math.max(...parts.map(b => b.y + b.h));
    const radius = Math.max(...parts.map(b => Math.max(Math.abs(b.x), Math.abs(b.x + b.w), Math.abs(b.z), Math.abs(b.z + b.d))));
    return { boxes: parts, scale: s, hover, height, radius, bones, legLen: legLen * SY, kind, flyer, sway };
  }
  // A Kin turned into an object: material comes from the items, glow from anything burning. The Kin's level makes it bigger and brighter.
  const MATERIALS = [
    ['void', { name: 'Crystal', body: '#8a4de0', light: '#c89bff', dark: '#4a2a80' }],
    ['iron', { name: 'Iron', body: '#b8bcc4', light: '#e6e9ee', dark: '#6f747c' }],
    ['copper', { name: 'Copper', body: '#c98a4f', light: '#e8b47c', dark: '#7a4f2a' }],
    ['cloud', { name: 'Marble', body: '#eef0f6', light: '#ffffff', dark: '#b8bcc8' }],
    ['basalt', { name: 'Basalt', body: '#45404a', light: '#6a6470', dark: '#26222a' }],
    ['snow', { name: 'Ice', body: '#bfe8ff', light: '#eafaff', dark: '#6fb0d0' }],
    ['wood', { name: 'Wooden', body: '#8a6a3c', light: '#b58d58', dark: '#5e4324' }],
    ['stone', { name: 'Stone', body: '#9a9aa0', light: '#c4c4ca', dark: '#64646a' }],
  ];
  const GLOW_ITEMS = ['ember', 'torch', 'ess_Flame', 'ess_Light', 'ess_Spark'];
  // currency returned when a Kin dissolved into an object is dismantled
  function shardsFor(kin) { return Math.round(kin.level * 6 * (1 + 0.3 * (kin.stage - 1)) * Math.pow(1.08, kin.sp.gen || 0)); }
  function makeStatue(kin, items) {
    const counts = {}; for (const it of items) counts[it] = (counts[it] || 0) + 1;
    let mat = MATERIALS[MATERIALS.length - 1][1];
    for (const [key, m] of MATERIALS) if (counts[key]) { mat = m; break; }
    const glow = items.some(it => GLOW_ITEMS.includes(it));
    const nm = name(kin);
    const radius = glow ? Math.round(8 + kin.level / 4 + Math.min(6, items.length) * 0.5) : 0;
    const sp = JSON.parse(JSON.stringify(kin.sp));
    const C = kin.sp.colors;
    sp.colors = glow ? { body: mat.body, belly: mat.light, accent: C.accent, dark: mat.dark, eye: '#fff4c0' } : { body: mat.body, belly: mat.light, accent: mat.dark, dark: mat.dark, eye: mat.dark };
    sp.statueGlow = glow; sp.mythic = false; sp.traits = [];
    const scale = 0.85 + Math.min(1.2, kin.level / 50);
    return {
      id: Math.floor(Math.random() * 1e9), kind: 'statue', name: glow ? `${mat.name} Lamp of ${nm}` : `${mat.name} Statue of ${nm}`,
      col: glow ? '#ffd36a' : mat.body, desc: glow ? `A lamp in the shape of ${nm}, Lv ${kin.level}. Lights ${radius} blocks around it.` : `A ${mat.name.toLowerCase()} statue of ${nm}, Lv ${kin.level}.`,
      sp, stage: kin.stage, level: kin.level, glow, radius, scale, material: mat.name, items: items.slice(), shards: shardsFor(kin),
    };
  }
  function statueModel(obj) {
    const m = model(obj.sp, obj.stage);
    for (const b of m.boxes) { b.emis = obj.glow && (b.c === obj.sp.colors.accent || b.c === obj.sp.colors.eye); }
    m.hover = 0;
    return m;
  }
  // outfit extras for important villagers: the elder's hat, chain and genie pants; the voodoo healer's mask, feathers and staff
  function decorate(m, kind) {
    const s = m.scale; const add = (x, y, z, w, h, d, c, emis) => m.boxes.push({ x: x * s, y: y * s, z: z * s, w: w * s, h: h * s, d: d * s, c, emis });
    if (kind === 'elder') {
      add(-0.5, 1.85, -0.45, 1.0, 0.08, 0.9, '#3b2a4a'); add(-0.3, 1.9, -0.28, 0.6, 0.42, 0.56, '#3b2a4a'); add(-0.32, 2.05, -0.3, 0.64, 0.08, 0.6, '#e0b84a', true); // hat with a gold band
      add(-0.32, 1.1, 0.2, 0.64, 0.07, 0.07, '#ffd75a', true); add(-0.06, 0.95, 0.2, 0.12, 0.16, 0.08, '#7ad7ff', true); // chain and gem
      add(-0.42, 0.0, -0.25, 0.34, 0.6, 0.5, '#8a3fd0'); add(0.08, 0.0, -0.25, 0.34, 0.6, 0.5, '#8a3fd0'); // genie pants
    } else if (kind === 'voodoo') {
      add(-0.36, 1.25, 0.2, 0.72, 0.7, 0.14, '#f1e3c0'); add(-0.22, 1.6, 0.33, 0.14, 0.14, 0.04, '#111111'); add(0.08, 1.6, 0.33, 0.14, 0.14, 0.04, '#111111'); // mask and eye holes
      add(-0.06, 1.35, 0.33, 0.12, 0.2, 0.03, '#c0392b'); add(-0.3, 1.45, 0.33, 0.6, 0.05, 0.03, '#2b6cc0'); // mask paint
      for (let i = 0; i < 5; i++) add(-0.3 + i * 0.15, 1.9, -0.1, 0.06, 0.5 + (i % 2) * 0.2, 0.06, i % 2 ? '#e74c3c' : '#f1c40f'); // feathers
      add(0.42, 0.0, 0.1, 0.08, 2.1, 0.08, '#6b4a2b'); add(0.36, 2.05, 0.04, 0.2, 0.2, 0.2, '#a65cff', true); // staff
    } else if (kind === 'fisher') {
      add(-0.55, 1.85, -0.5, 1.1, 0.06, 1.0, '#c9b36a'); add(-0.28, 1.9, -0.26, 0.56, 0.3, 0.52, '#c9b36a'); // wide straw hat
      add(0.4, 0.2, 0.3, 0.06, 2.6, 0.06, '#5a3f22'); add(0.43, 2.6, 0.3, 0.02, 0.3, 1.2, '#e8e8e8'); // rod and line
      add(-0.7, 0.0, -0.2, 0.3, 0.35, 0.3, '#4c6f8a'); // bucket
    } else if (kind === 'miner') { // a hard hat with a lamp, braces, and a pick over the shoulder
      add(-0.34, 1.86, -0.34, 0.68, 0.22, 0.68, '#e8b830'); add(-0.4, 1.84, -0.4, 0.8, 0.05, 0.8, '#d0a020'); add(-0.08, 1.9, 0.33, 0.16, 0.12, 0.08, '#fff6c0', true);
      add(-0.3, 0.9, 0.24, 0.08, 0.8, 0.04, '#5a3a22'); add(0.22, 0.9, 0.24, 0.08, 0.8, 0.04, '#5a3a22');
      add(0.36, 0.6, -0.3, 0.07, 1.2, 0.07, '#7a5a3a'); add(0.12, 1.72, -0.34, 0.52, 0.12, 0.12, '#a0a0a8'); add(0.6, 1.62, -0.34, 0.08, 0.2, 0.12, '#a0a0a8');
    } else if (kind === 'diver') { // goggles, a tank on the back, fins
      add(-0.3, 1.5, 0.3, 0.6, 0.14, 0.08, '#2a2a30'); add(-0.24, 1.52, 0.36, 0.18, 0.1, 0.04, '#7ad7ff', true); add(0.06, 1.52, 0.36, 0.18, 0.1, 0.04, '#7ad7ff', true);
      add(-0.16, 0.8, -0.38, 0.32, 0.7, 0.18, '#e8b830'); add(-0.06, 1.5, -0.36, 0.12, 0.14, 0.12, '#a0a0a8');
      add(-0.36, 0.0, 0.1, 0.26, 0.05, 0.5, '#2f8a8a'); add(0.1, 0.0, 0.1, 0.26, 0.05, 0.5, '#2f8a8a');
    } else if (kind === 'hermit') {
      add(-0.34, 1.05, 0.2, 0.68, 0.5, 0.1, '#d9d4c7'); add(-0.1, 0.7, 0.22, 0.2, 0.4, 0.08, '#d9d4c7'); // a long grey beard
      add(-0.5, 1.5, -0.5, 1.0, 0.5, 1.0, '#5a4a3a'); // a deep hood
      add(0.42, 0.0, 0.2, 0.07, 1.6, 0.07, '#8a6a3c'); // a stick
    } else if (kind === 'traveller') {
      add(-0.34, 0.75, -0.5, 0.68, 0.8, 0.3, '#6b4a2b'); add(-0.25, 1.4, -0.45, 0.5, 0.25, 0.22, '#a8894f'); // pack and bedroll
      add(0.42, 0.0, 0.2, 0.07, 2.0, 0.07, '#8a6a3c'); // walking stick
      add(-0.4, 1.85, -0.4, 0.8, 0.07, 0.8, '#4a3a2a'); add(-0.26, 1.9, -0.26, 0.52, 0.22, 0.52, '#4a3a2a'); // travelling hat
    } else if (kind === 'alien') { // two antennae with glowing tips, a glowing collar
      add(-0.22, 1.85, -0.05, 0.05, 0.4, 0.05, '#101828'); add(0.17, 1.85, -0.05, 0.05, 0.4, 0.05, '#101828'); add(-0.27, 2.22, -0.1, 0.15, 0.15, 0.15, '#39ff14', true); add(0.12, 2.22, -0.1, 0.15, 0.15, 0.15, '#ff2bd6', true);
      add(-0.34, 1.26, -0.3, 0.68, 0.08, 0.6, '#00f5ff', true);
    } else if (kind === 'veil') { // Halo folk: a long head veil against the dust and a sash
      add(-0.36, 1.8, -0.35, 0.72, 0.1, 0.7, '#f0e0c0'); add(-0.36, 1.1, -0.36, 0.1, 0.75, 0.72, '#f0e0c0'); add(0.26, 1.1, -0.36, 0.1, 0.75, 0.72, '#f0e0c0'); add(-0.3, 1.1, -0.4, 0.6, 0.75, 0.1, '#f0e0c0');
      add(-0.32, 0.95, 0.2, 0.64, 0.1, 0.08, '#c9a45a');
    } else if (kind === 'merfolk') { // sea people: a fin crest, webbed fins on the arms, scales down the back
      add(-0.05, 1.8, -0.3, 0.1, 0.35, 0.55, '#6fd0c8', true); add(-0.6, 0.8, -0.05, 0.12, 0.4, 0.3, '#4aa8b8'); add(0.48, 0.8, -0.05, 0.12, 0.4, 0.3, '#4aa8b8');
      for (let i = 0; i < 3; i++) add(-0.06, 0.6 + i * 0.22, -0.3, 0.12, 0.12, 0.1, '#8fe0d0');
    } else if (kind === 'hat') { // a wide-brimmed hat
      add(-0.55, 1.84, -0.55, 1.1, 0.06, 1.1, '#5a3a22'); add(-0.28, 1.88, -0.3, 0.56, 0.3, 0.58, '#5a3a22'); add(-0.3, 1.9, -0.32, 0.6, 0.06, 0.62, '#2a1a10');
    } else if (kind === 'star') { // the sheriff's star
      add(-0.26, 1.0, 0.21, 0.14, 0.14, 0.05, '#ffd75a', true);
    } else if (kind === 'warrior') { // war paint, a feathered band and a spear
      add(-0.3, 1.5, 0.24, 0.6, 0.05, 0.03, '#e0302a'); add(-0.3, 1.38, 0.24, 0.6, 0.05, 0.03, '#f0e0a0'); add(-0.32, 1.75, -0.28, 0.64, 0.08, 0.56, '#8a2a1a');
      for (let i = 0; i < 3; i++) add(-0.2 + i * 0.15, 1.83, -0.3, 0.06, 0.45 + (i % 2) * 0.15, 0.06, i % 2 ? '#f0e0a0' : '#e0302a');
      add(0.42, 0.0, 0.1, 0.06, 2.5, 0.06, '#6b4a2b'); add(0.38, 2.5, 0.06, 0.14, 0.3, 0.14, '#c8c8d0'); // spear
    } else if (kind === 'scientist') { // a long coat, goggles pushed up, a clipboard
      add(-0.34, 0.3, -0.3, 0.68, 1.0, 0.6, '#e8e8f0'); add(-0.3, 1.75, -0.3, 0.6, 0.12, 0.6, '#3a3a4a'); add(-0.22, 1.76, 0.26, 0.14, 0.12, 0.06, '#7ad7ff', true); add(0.08, 1.76, 0.26, 0.14, 0.12, 0.06, '#7ad7ff', true);
      add(0.4, 0.9, 0.1, 0.06, 0.4, 0.3, '#c9a45a');
    } else if (kind === 'lamp') { // a miner's helmet with a lamp
      add(-0.34, 1.84, -0.32, 0.68, 0.14, 0.64, '#c9b36a'); add(-0.1, 1.88, 0.3, 0.2, 0.14, 0.1, '#fff2a0', true);
    } else if (kind === 'mask') { // a diver's mask and a tank
      add(-0.3, 1.45, 0.24, 0.6, 0.26, 0.06, '#9fd8ff', true); add(-0.2, 0.8, -0.42, 0.4, 0.7, 0.2, '#b8bcc4');
    } else if (kind === 'visor') { // a round helmet with a glowing visor
      add(-0.36, 1.26, -0.32, 0.72, 0.66, 0.64, '#e8f0ff'); add(-0.28, 1.4, 0.3, 0.56, 0.3, 0.05, '#7ad7ff', true); add(-0.2, 0.75, -0.42, 0.4, 0.6, 0.18, '#b8c4d8');
    } else if (kind === 'crown') { // a crown and a cape
      add(-0.3, 1.85, -0.28, 0.6, 0.12, 0.56, '#ffd25a', true); for (let i = 0; i < 4; i++) add(-0.28 + i * 0.17, 1.97, -0.28, 0.1, 0.16, 0.1, '#ffe08a', true);
      add(-0.36, 0.3, -0.36, 0.72, 1.1, 0.1, '#5a1a8a');
    } else if (kind === 'wanderer') { // a satchel, a scarf
      add(-0.42, 0.7, -0.42, 0.3, 0.35, 0.2, '#6b4a2b'); add(-0.34, 1.22, -0.32, 0.68, 0.12, 0.64, '#c94c4c');
    }
    m.height = Math.max(m.height, ...m.boxes.map(b => b.y + b.h));
    return m;
  }
  function buildMesh(mb, m) {
    for (const b of m.boxes) {
      mb.setBone(b.bone || 0); const col = U.hexToRgb(b.c); const o = Object.assign({ emis: !!b.emis }, b.o || {});
      if (b.rot) { mb.push(); mb.rotate(b.rot.rx || 0, b.rot.ry || 0, b.rot.rz || 0, b.rot.piv); }
      if (b.k === 'blob') mb.blob(b.x, b.y, b.z, b.x + b.w, b.y + b.h, b.z + b.d, b.round, col, o);
      else if (b.k === 'tube') mb.tube(b.path, b.radii, col, o);
      else if (b.k === 'plate') mb.plate(b.pts, b.t, col, o);
      else mb.box(b.x, b.y, b.z, b.x + b.w, b.y + b.h, b.z + b.d, col, 1, !!b.emis);
      if (b.rot) mb.pop();
    }
    mb.setBone(0);
  }
  function meshKey(sp, stage) { return sp.seed + ':' + stage + ':' + (sp.gen || 0) + ':' + sp.names[0]; }

  // ---- portrait: the real mesh, drawn by the renderer into a small canvas ----
  function portrait(cv, sp, stage, size, mdl, key) {
    const m = mdl || model(sp, stage);
    const k = key || (mdl ? 'pm:' + U.strHash(JSON.stringify(mdl.boxes.map(b => [b.k || 'b', b.x, b.y, b.z, b.w, b.h, b.d, b.c, b.emis ? 1 : 0, b.path ? b.path.length : 0]))) : meshKey(sp, stage));
    const mesh = R.entityMesh(k, (mb) => buildMesh(mb, m));
    if (!R.renderPortrait(cv, mesh, m, size)) { const ctx = cv.getContext('2d'); cv.width = cv.height = size; ctx.fillStyle = sp.colors.body; ctx.beginPath(); ctx.arc(size / 2, size / 2, size * 0.3, 0, Math.PI * 2); ctx.fill(); }
  }

  function serialize(k) { return { id: k.id, sp: k.sp, level: k.level, xp: k.xp, iv: k.iv, stage: k.stage, hp: k.hp, nick: k.nick, equip: k.equip || null, tech: k.tech || null, wear: k.wear || null, trust: k.trust || 0, tamed: k.tamed || false }; }
  function deserialize(d) { return Object.assign({ status: null }, d); }

  return { E, EI, CHART, STAT_KEYS, STAT_NAMES, growth, xpToNext, dominant, species, speciesForContext, dex, bySeed, HABITATS, capOf, recipes, findRecipe, fuseRecipe, mythicSpecies, legendSpecies, apexSpecies, wardenSpecies, MAX_LEVEL, TECH, techFor, techByName, starters, create, stats, name, moves, effectiveness, gainXp, fuse, fusionLevel, TRAITS, RARITY, roster, buildUniverse, decorate, makeStatue, statueModel, shardsFor, model, buildMesh, meshKey, portrait, serialize, deserialize, UTIL_DESC };
})();
