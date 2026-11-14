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

  // ---- evolution lines: what a Kin IS, and what it grows into ----
  // A line is one to three forms. Each form names a body ([shape, plan]) and the real creature it is built on, so Fable (or
  // anyone) knows what each stage should read as. A line may change body plan as it grows (a little fish into a sea dragon,
  // an ember sprite into a forge brute). Behaviour (how it moves, whether it swims, flies or can be ridden) still follows the
  // species' own sp.shape, so lines only mix bodies that move the same way: land with land, water with water.
  // Mounts, fusions, dinosaurs, legendaries and the scripted one-offs keep their single fixed body.
  const LINES = {
    land: { // every evolved form has a body of its own, and each line grows into something that follows from what it was
      Flame: [[['blob', 'ember', 'ember sprite'], ['quadruped', 'salamander', 'salamander'], ['quadruped', 'pyredrake', 'pyre drake']], [['quadruped', 'masker', 'cinder kitten'], ['quadruped', 'jaguar', 'magma jaguar']], [['blob', 'coal', 'coal'], ['blob', 'smog', 'smog'], ['quadruped', 'volcano', 'walking volcano']], [['quadruped', 'lavatoad', 'lava toad']]],
      Tide: [[['blob', 'jelly', 'tidepool jelly'], ['blob', 'manowar', 'man-o\'-war'], ['blob', 'kraken', 'kraken']], [['blob', 'hermit', 'hermit in a shell'], ['quadruped', 'kingcrab', 'king crab']], [['blob', 'bubble', 'bubble with a fish in it'], ['blob', 'puffer', 'pufferfish'], ['blob', 'angler', 'anglerfish']], [['quadruped', 'seaturtle', 'sea turtle']]],
      Bloom: [[['blob', 'seed', 'seed pod'], ['blob', 'sprout', 'sprout'], ['quadruped', 'oak', 'walking oak']], [['blob', 'bulb', 'bulb'], ['blob', 'flytrap', 'flytrap']], [['quadruped', 'glyphtail', 'leaf fox kit'], ['quadruped', 'bramblefox', 'bramble fox']], [['quadruped', 'hedgehog', 'thornback hedgehog']]],
      Stone: [[['blob', 'pebble', 'pebble'], ['blob', 'boulder', 'boulder'], ['quadruped', 'mountain', 'mountain giant']], [['blob', 'geode', 'geode'], ['quadruped', 'scorpion', 'crystal scorpion']], [['quadruped', 'gargoyle', 'gargoyle']], [['quadruped', 'orerhino', 'ore rhino']]],
      Gale: [[['quadruped', 'glyphtail', 'wind fox kit'], ['quadruped', 'windfox', 'wind fox'], ['quadruped', 'skyfox', 'many-tailed sky fox']], [['blob', 'puff', 'puff of cloud'], ['blob', 'stormcloud', 'storm cloud'], ['blob', 'hurricane', 'hurricane']], [['quadruped', 'cloudram', 'cloud ram']], [['quadruped', 'glider', 'glider']]],
      Frost: [[['blob', 'snowball', 'snowball imp'], ['blob', 'snowgolem', 'snow golem'], ['quadruped', 'yeti', 'yeti']], [['quadruped', 'glyphtail', 'arctic fox kit'], ['quadruped', 'icewolf', 'ice wolf']], [['blob', 'icicle', 'icicle'], ['quadruped', 'glacier', 'walking glacier']], [['quadruped', 'walrus', 'walrus']]],
      Spark: [[['blob', 'spark', 'static spark'], ['blob', 'balllightning', 'ball lightning'], ['quadruped', 'tesla', 'tesla walker']], [['quadruped', 'masker', 'static cat'], ['quadruped', 'lynx', 'thunder lynx']], [['blob', 'bug', 'battery beetle'], ['quadruped', 'stagbeetle', 'stag beetle'], ['quadruped', 'hercules', 'hercules titan']], [['quadruped', 'hare', 'lightning hare']]],
      Void: [[['blob', 'wisp', 'shadow wisp'], ['blob', 'shade', 'shade'], ['blob', 'wraith', 'reaper wraith']], [['quadruped', 'masker', 'shadow kitten'], ['quadruped', 'eclipsecat', 'eclipse cat']], [['blob', 'ink', 'ink drop'], ['quadruped', 'tarhound', 'tar hound'], ['quadruped', 'abyssmaw', 'abyss maw']], [['quadruped', 'glyphtail', 'shade fox'], ['quadruped', 'jackal', 'shadow jackal']]],
      Light: [[['quadruped', 'lanternstag', 'glow fawn'], ['quadruped', 'hart', 'white hart']], [['blob', 'mote', 'firefly mote'], ['blob', 'moth', 'lantern moth']], [['blob', 'sunbeam', 'sunbeam'], ['blob', 'corona', 'corona'], ['quadruped', 'sunlion', 'sun lion']], [['quadruped', 'unicorn', 'unicorn']]]
    },
    biped: { // two-legged Kin: each line anchored to a real animal or thing, every form its own body
      Flame: [[['biped', 'embermonkey', 'ember monkey'], ['biped', 'torchmandrill', 'torch mandrill'], ['biped', 'magmagorilla', 'magma gorilla']], [['biped', 'wick', 'candle wick'], ['biped', 'waxgiant', 'wax giant']], [['biped', 'redpanda', 'blaze red panda']]],
      Tide: [[['biped', 'froglet', 'froglet'], ['biped', 'riverfrog', 'river frog'], ['biped', 'sumofrog', 'sumo bullfrog']], [['biped', 'otterpup', 'otter pup'], ['biped', 'shellotter', 'shell-shield otter']], [['biped', 'axolotl', 'axolotl']]],
      Bloom: [[['biped', 'sporeling', 'sporeling'], ['biped', 'mushknight', 'mushroom knight'], ['biped', 'fungelder', 'fungus elder']], [['biped', 'mantisnymph', 'mantis nymph'], ['biped', 'orchidmantis', 'orchid mantis']], [['biped', 'mosssloth', 'moss sloth']]],
      Stone: [[['biped', 'molekit', 'star-nosed mole'], ['biped', 'minermole', 'miner mole'], ['biped', 'drillmole', 'drill mole']], [['biped', 'pangolinpup', 'pangolin pup'], ['biped', 'pangolinknight', 'pangolin knight']], [['biped', 'menhir', 'rune menhir']]],
      Gale: [[['biped', 'batpup', 'bat pup'], ['biped', 'galebat', 'gale bat'], ['biped', 'tempestbat', 'tempest bat lord']], [['biped', 'lemurkid', 'lemur kid'], ['biped', 'skylemur', 'sky lemur']], [['biped', 'gibbon', 'gibbon']]],
      Frost: [[['biped', 'penguinchick', 'floe chick'], ['biped', 'emperor', 'glacier skater'], ['biped', 'icegeneral', 'ice general']], [['biped', 'polarcub', 'polar cub'], ['biped', 'polarbear', 'polar bear']], [['biped', 'stoat', 'stoat']]],
      Spark: [[['biped', 'windupbot', 'wind-up bot'], ['biped', 'coilsoldier', 'coil soldier'], ['biped', 'thundermech', 'thunder mech']], [['biped', 'voltjoey', 'volt joey'], ['biped', 'thunderboxer', 'thunder boxer']], [['biped', 'conductor', 'lightning conductor']]],
      Void: [[['biped', 'puppet', 'puppet'], ['biped', 'marionette', 'marionette'], ['biped', 'puppeteer', 'puppeteer']], [['biped', 'ayeaye', 'aye-aye'], ['biped', 'nightshaman', 'night shaman']], [['biped', 'mimic', 'mimic chest']]],
      Light: [[['biped', 'prismsprite', 'prism sprite'], ['biped', 'crystalknight', 'crystal knight'], ['biped', 'paladin', 'radiant paladin']], [['biped', 'meerkatpup', 'meerkat pup'], ['biped', 'sunsentinel', 'sun sentinel']], [['biped', 'sunbear', 'sun bear']]]
    },
    bird: { // birds: each a real bird, or a legend grown from one
      Flame: [[['bird', 'emberchick', 'ember chick'], ['bird', 'flamekestrel', 'flame kestrel'], ['bird', 'phoenix', 'phoenix']], [['bird', 'emberrobin', 'ember robin'], ['bird', 'firerobin', 'firebreast robin']], [['bird', 'magmavulture', 'magma vulture']]],
      Tide: [[['bird', 'gullchick', 'gull chick'], ['bird', 'seagull', 'sea gull'], ['bird', 'albatross', 'albatross']], [['bird', 'puffling', 'puffling'], ['bird', 'puffin', 'puffin']], [['bird', 'heron', 'heron']]],
      Bloom: [[['bird', 'peachick', 'peachick'], ['bird', 'peafowl', 'peafowl'], ['bird', 'bloompeacock', 'bloom peacock']], [['bird', 'cygnet', 'cygnet'], ['bird', 'lotusswan', 'lotus swan']], [['bird', 'hummingbird', 'hummingbird']]],
      Stone: [[['bird', 'emuchick', 'emu chick'], ['bird', 'rockemu', 'rock emu'], ['bird', 'terrorbird', 'terror bird']], [['bird', 'hornbillchick', 'hornbill chick'], ['bird', 'hornbill', 'great hornbill']], [['bird', 'shoebill', 'shoebill']]],
      Gale: [[['bird', 'eaglet', 'eaglet'], ['bird', 'hawk', 'hawk'], ['bird', 'stormeagle', 'storm eagle']], [['bird', 'swallow', 'swallow'], ['bird', 'swift', 'swift']], [['bird', 'frigatebird', 'frigatebird']]],
      Frost: [[['bird', 'snowowlet', 'snowy owlet'], ['bird', 'snowyowl', 'snowy owl'], ['bird', 'auroraowl', 'aurora owl']], [['bird', 'cranechick', 'crane chick'], ['bird', 'crane', 'red-crowned crane']], [['bird', 'snowgoose', 'snow goose']]],
      Spark: [[['bird', 'zapchick', 'zap chick'], ['bird', 'cockatoo', 'cockatoo'], ['bird', 'thundercockatoo', 'thunder cockatoo']], [['bird', 'kingfisherchick', 'kingfisher chick'], ['bird', 'kingfisher', 'kingfisher']], [['bird', 'lyrebird', 'lyrebird']]],
      Void: [[['bird', 'ravenlet', 'ravenlet'], ['bird', 'raven', 'raven'], ['bird', 'ravenking', 'three-eyed raven king']], [['bird', 'nightjar', 'nightjar'], ['bird', 'potoo', 'potoo']], [['bird', 'cassowary', 'cassowary']]],
      Light: [[['bird', 'squab', 'squab'], ['bird', 'dove', 'white dove'], ['bird', 'sundove', 'sun-crowned dove']], [['bird', 'goldchick', 'gold chick'], ['bird', 'pheasant', 'golden pheasant']], [['bird', 'ibis', 'sacred ibis']]]
    },
    serpent: { // snakes, eels, worms and the dragons that grow from them
      Flame: [[['serpent', 'emberworm', 'ember worm'], ['serpent', 'fireviper', 'horned fire viper'], ['serpent', 'magmawyrm', 'magma wyrm']], [['serpent', 'cindercentipede', 'cinder centipede'], ['serpent', 'magmacentipede', 'magma centipede']], [['serpent', 'flamecobra', 'flame-hood cobra']]],
      Tide: [[['serpent', 'elver', 'elver'], ['serpent', 'moray', 'moray eel'], ['serpent', 'leviathan', 'leviathan']], [['serpent', 'seaslug', 'sea slug'], ['serpent', 'blueslug', 'blue dragon slug']], [['serpent', 'seakrait', 'banded sea krait']]],
      Bloom: [[['serpent', 'inchworm', 'inchworm'], ['serpent', 'vinesnake', 'vine snake'], ['serpent', 'blossomserpent', 'blossom serpent']], [['serpent', 'gardensnail', 'garden snail'], ['serpent', 'mushsnail', 'mushroom-house snail']], [['serpent', 'treepython', 'coiled tree python']]],
      Stone: [[['serpent', 'earthworm', 'earthworm'], ['serpent', 'sandworm', 'sandworm'], ['serpent', 'titanworm', 'titan worm']], [['serpent', 'pebblemillipede', 'pebble millipede'], ['serpent', 'armormillipede', 'armoured millipede']], [['serpent', 'basilisk', 'stone basilisk']]],
      Gale: [[['serpent', 'windribbon', 'wind ribbon'], ['serpent', 'cloudserpent', 'cloud serpent'], ['serpent', 'skydragon', 'sky dragon']], [['serpent', 'flyingsnakelet', 'flying snakelet'], ['serpent', 'paradisesnake', 'paradise flying snake']], [['serpent', 'plumedserpent', 'plumed serpent']]],
      Frost: [[['serpent', 'frostgrub', 'frost grub'], ['serpent', 'icesnake', 'ice snake'], ['serpent', 'glacierwyrm', 'glacier wyrm']], [['serpent', 'icicleel', 'icicle eel'], ['serpent', 'auroraeel', 'aurora eel']], [['serpent', 'whiterattler', 'white rattler']]],
      Spark: [[['serpent', 'wireworm', 'wire worm'], ['serpent', 'electriceel', 'electric eel'], ['serpent', 'thundereel', 'thunder eel-dragon']], [['serpent', 'coilsnake', 'coil snake'], ['serpent', 'teslaserpent', 'tesla serpent']], [['serpent', 'batteryrattler', 'battery rattlesnake']]],
      Void: [[['serpent', 'shadowgrub', 'shadow grub'], ['serpent', 'nightadder', 'night adder'], ['serpent', 'voidwyrm', 'void wyrm']], [['serpent', 'lamprey', 'lamprey'], ['serpent', 'abysslamprey', 'abyssal lamprey']], [['serpent', 'twohead', 'two-headed snake']]],
      Light: [[['serpent', 'glowworm', 'glow-worm'], ['serpent', 'goldencobra', 'golden cobra'], ['serpent', 'suncobra', 'sun cobra']], [['serpent', 'lanterneel', 'lantern eel'], ['serpent', 'beaconeel', 'beacon eel']], [['serpent', 'rainbowboa', 'rainbow boa']]]
    },
    floater: { // things that drift: sparks, lanterns, seeds, kites, snowflakes, eyes, moons
      Flame: [[['floater', 'emberspark', "ember spark"], ['floater', 'firewisp', "fire wisp"], ['floater', 'wisplord', "will-o'-wisp lord"]], [['floater', 'skylantern', "sky lantern"], ['floater', 'dragonlantern', "dragon festival lantern"]], [['floater', 'comet', "comet"]]],
      Tide: [[['floater', 'droplet', "raindrop"], ['floater', 'waterorb', "fountain sprite"], ['floater', 'tidemoon', "tide moon"]], [['floater', 'seaangel', "sea angel"], ['floater', 'greatseaangel', "abyssal seraph"]], [['floater', 'nautilus', "nautilus"]]],
      Bloom: [[['floater', 'seedfluff', "seed fluff"], ['floater', 'dandelion', "dandelion"], ['floater', 'dandelionking', "dandelion king"]], [['floater', 'spore', "spore"], ['floater', 'fungusballoon', "fungus balloon"]], [['floater', 'maplespinner', "maple spinner"]]],
      Stone: [[['floater', 'floatpebble', "floating pebble"], ['floater', 'orbitring', "orbit ring"], ['floater', 'floatisland', "floating island"]], [['floater', 'lodestone', "lodestone"], ['floater', 'lodeorbit', "lodestone orbit"]], [['floater', 'meteorite', "meteorite"]]],
      Gale: [[['floater', 'kite', "kite"], ['floater', 'boxkite', "box kite"], ['floater', 'dragonkite', "dragon kite"]], [['floater', 'balloonlet', "little balloon"], ['floater', 'hotairballoon', "hot-air balloon"]], [['floater', 'windchime', "wind chime"]]],
      Frost: [[['floater', 'snowflake', "snowflake"], ['floater', 'crystalflake', "crystal flake"], ['floater', 'blizzardstar', "blizzard star"]], [['floater', 'frostbreath', "frost breath"], ['floater', 'frostghost', "frost ghost"]], [['floater', 'auroraribbon', "aurora ribbon"]]],
      Spark: [[['floater', 'plasmabead', "plasma bead"], ['floater', 'teslaorb', "tesla orb"], ['floater', 'stormeye', "storm eye"]], [['floater', 'bulbimp', "bulb imp"], ['floater', 'bulbchandelier', "bulb chandelier"]], [['floater', 'magnet', "horseshoe magnet"]]],
      Void: [[['floater', 'floateye', "floating eye"], ['floater', 'eyecluster', "eye cluster"], ['floater', 'watcher', "the watcher"]], [['floater', 'hollowmask', "hollow mask"], ['floater', 'cloakedmask', "cloaked mask"]], [['floater', 'blackhole', "black hole"]]],
      Light: [[['floater', 'halosprite', "halo sprite"], ['floater', 'wingedorb', "winged orb"], ['floater', 'seraph', "seraph of rings"]], [['floater', 'twinkle', "twinkle"], ['floater', 'star', "star"]], [['floater', 'crescentmoon', "crescent moon"]]]
    },
    steed: { _: [[['quadruped', 'steed', 'foal'], ['quadruped', 'steed', 'colt'], ['quadruped', 'steed', 'warhorse']]] },
    steedFull: { _: [[['quadruped', 'steed', 'warhorse']]] },
    legend: { // the legendaries: one grand beast per element, like nothing else in the game
      Flame: [[['quadruped', 'ignivar', 'Ignivar, the fire dragon']]], Tide: [[['quadruped', 'tidekirin', 'the Tide Kirin']]], Bloom: [[['quadruped', 'worldstag', 'the World Stag']]],
      Stone: [[['quadruped', 'runemammoth', 'the Rune Mammoth']]], Gale: [[['quadruped', 'stormgriffin', 'the Storm Griffin']]], Frost: [[['quadruped', 'aurorasabre', 'the Aurora Sabretooth']]],
      Spark: [[['quadruped', 'raiju', 'the Raiju']]], Void: [[['quadruped', 'chimera', 'the Eclipse Chimera']]], Light: [[['quadruped', 'pegasus', 'the Star Pegasus']]], _: [[['quadruped', 'worldstag', 'the World Stag']]] },
    water: { // fish: each a real fish, or the legend it grows into
      Flame: [[['fish', 'emberfry', 'ember fry'], ['fish', 'lionfish', 'lionfish'], ['fish', 'infernolion', 'inferno lionfish']], [['fish', 'betta', 'betta'], ['fish', 'firebetta', 'fire betta']], [['fish', 'fireclown', 'fire clownfish']]],
      Tide: [[['fish', 'minnow', 'minnow'], ['fish', 'reefshark', 'reef shark'], ['fish', 'megalodon', 'megalodon']], [['fish', 'seahorse', 'seahorse'], ['fish', 'greatseahorse', 'great seahorse']], [['fish', 'mantaray', 'manta ray']]],
      Bloom: [[['fish', 'algaefry', 'algae fry'], ['fish', 'koi', 'koi'], ['fish', 'lotuskoi', 'lotus koi dragon']], [['fish', 'seadragonfry', 'seadragon fry'], ['fish', 'leafyseadragon', 'leafy seadragon']], [['fish', 'flowerhorn', 'flowerhorn']]],
      Stone: [[['fish', 'stonefry', 'stonefish fry'], ['fish', 'stonefish', 'stonefish'], ['fish', 'reeftitan', 'reef-rock titan']], [['fish', 'armorfry', 'fossil fry'], ['fish', 'coelacanth', 'living fossil']], [['fish', 'armorcatfish', 'armoured catfish']]],
      Gale: [[['fish', 'flyfry', 'bubble-fin fry'], ['fish', 'flyingfish', 'kite-fin flyer'], ['fish', 'cloudmanta', 'waterspout rider']], [['fish', 'sailfry', 'sail fry'], ['fish', 'sailfish', 'galleon sailfish']], [['fish', 'hatchetfish', 'hatchetfish']]],
      Frost: [[['fish', 'charfry', 'char fry'], ['fish', 'arcticchar', 'arctic char'], ['fish', 'frostpike', 'frost pike']], [['fish', 'icefishfry', 'icefish fry'], ['fish', 'crystalicefish', 'crystal icefish']], [['fish', 'narwhal', 'narwhal']]],
      Spark: [[['fish', 'sparkfry', 'spark fry'], ['fish', 'neontetra', 'neon tetra'], ['fish', 'stormsword', 'storm swordfish']], [['fish', 'torpedofry', 'torpedo fry'], ['fish', 'torpedoray', 'torpedo ray']], [['fish', 'eleccatfish', 'electric catfish']]],
      Void: [[['fish', 'darkfry', 'dark fry'], ['fish', 'viperfish', 'viperfish'], ['fish', 'abyssgulper', 'abyss gulper']], [['fish', 'barreleyefry', 'barreleye fry'], ['fish', 'barreleye', 'barreleye']], [['fish', 'ghostshark', 'ghost shark']]],
      Light: [[['fish', 'glimmerfry', 'glimmer fry'], ['fish', 'butterflyfish', 'butterflyfish'], ['fish', 'sunfish', 'sunfish']], [['fish', 'goldfish', 'goldfish'], ['fish', 'celestialfish', 'celestial goldfish']], [['fish', 'moonfish', 'moonfish']]]
    }
  };
  const LAND_LINE = new Set(['quadruped', 'blob']); // two-legged Kin get lines of their own next, built on two-legged bodies
  const FAM_OF = { biped: 'biped', bird: 'bird', serpent: 'serpent', floater: 'floater', fish: 'water' };
  function lineClass(sp) {
    if (!sp || sp.dino || sp.mythic || sp.neon) return null;
    if (sp.steed || sp.fast || sp.tame) return (sp.evolveAt && sp.evolveAt[0] >= 999) || sp.fast || sp.tame || (sp.rarity || 0) >= 4 ? 'steedFull' : 'steed'; // horses you ride: camp horses, Thunderhoof and the legendary steeds are full-grown
    if ((sp.rarity || 0) >= 4) return LAND_LINE.has(sp.shape) ? 'legend' : FAM_OF[sp.shape] ? 'legend:' + FAM_OF[sp.shape] : null;
    if (LAND_LINE.has(sp.shape)) return 'land'; if (sp.shape === 'biped') return 'biped'; if (sp.shape === 'bird') return 'bird'; if (sp.shape === 'serpent') return 'serpent'; if (sp.shape === 'floater') return 'floater'; if (sp.shape === 'fish') return 'water'; return null; }
  function lineOf(sp) {
    if (sp._line !== undefined) return sp._line; const cls = lineClass(sp); if (!cls) return (sp._line = null);
    const el = dominant(sp.elem || [], 1)[0];
    if (cls.startsWith('legend:')) { const T2 = LINES[cls.slice(7)], o2 = T2 && (T2[el] || T2._); const first = o2 && o2[0]; const one = first ? [first[first.length - 1]] : null; Object.defineProperty(sp, '_line', { value: one, enumerable: false, writable: true }); return one; } // a legendary bird, fish or serpent is the grandest form of its element's first line
    const T = LINES[cls]; const opts = T[el] || T._ || null; if (!opts) return (sp._line = null);
    const pick = opts[((sp.seed >>> 0) % 1009) % opts.length];
    Object.defineProperty(sp, '_line', { value: pick, enumerable: false, writable: true }); return pick; // not saved: worked out again from the species every time
  }
  function maxStage(sp) { const L = lineOf(sp); return L ? L.length : 3; }
  // how grown-up a stage looks (1 young, 2 middle, 3 full): a two-stage line goes young to full, a single form is full-grown
  function lookOf(sp, stage) { const n = maxStage(sp); const st = Math.min(stage || 1, n); return n === 1 ? 3 : n === 2 ? (st === 1 ? 1 : 3) : st; }
  function formOf(sp, stage) { const L = lineOf(sp); if (!L) return { shape: sp.shape, plan: null, anchor: null, look: Math.min(3, stage || 1) }; const f = L[Math.min(stage || 1, L.length) - 1]; return { shape: f[0], plan: f[1], anchor: f[2], look: lookOf(sp, stage) }; }
  // the power that comes with growing up, on the same curve whatever the line's length (a single-form Kin grows into it by level)
  function maturity(k) { const n = maxStage(k.sp); if (n === 1) return k.level >= k.sp.evolveAt[1] ? 2 : k.level >= k.sp.evolveAt[0] ? 1 : 0; return (Math.min(k.stage, n) - 1) * 2 / (n - 1); }
  // ---- individuals ----
  function create(sp, level, rng) {
    const r = rng || U.rng(Math.floor(Math.random() * 1e9));
    const iv = {}; for (const k of STAT_KEYS) iv[k] = 0.92 + r() * 0.16;
    let stage = 1; while (stage < maxStage(sp) && level >= sp.evolveAt[stage - 1]) stage++;
    const k = { id: Math.floor(r() * 1e9), sp, level, xp: 0, iv, stage, hp: 0, status: null, nick: null };
    k.hp = stats(k).hp;
    return k;
  }
  function stats(k) {
    const g = growth(k.level) * (1 + 0.22 * maturity(k)) * Math.pow(1.08, k.sp.gen || 0);
    const s = {};
    for (const key of STAT_KEYS) s[key] = Math.max(1, Math.round(k.sp.base[key] * g * k.iv[key]));
    s.hp = Math.round(s.hp * 2.2);
    if (k.equip) for (const slot in k.equip) { const id = k.equip[slot], it = ITEMS[id]; if (it && it.boost) { const m = it.relic && typeof Relics !== 'undefined' ? Relics.mul(id) : 1; for (const key in it.boost) s[key] = Math.round(s[key] * (1 + it.boost[key] * m)); } }
    return s;
  }
  function name(k) { return k.nick || k.sp.names[lookOf(k.sp, k.stage) - 1] || k.sp.names[0]; }
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
      if (k.stage < maxStage(k.sp) && k.level >= k.sp.evolveAt[k.stage - 1]) {
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
    const form = formOf(sp, stage); const shape = form.shape; stage = form.look; // the body this stage has, drawn as grown-up as it looks
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
    const eyes = (x, y, z, r, o) => LOOK(x, y, z, r, { col: (o && o.col) || C.eye, brow: o && o.brow });
    /* the one eye every Kin shares: a shallow lens, not a ball. White of the eye, an iris dark at the top and bright below, a tall pupil,
       a big glint and a small one (both on the light's side, never mirrored), a dark upper lid. o.brow slants the lid for a fierce look;
       o.glow makes a dark eye with a lit iris; side = the eye faces out sideways (fish). */
    const LOOK = (ex, ey, ez, er, o = {}, side) => {
      let col = o.col || C.eye; { const q = U.hexToRgb(col); if (q[0] + q[1] + q[2] < (q[0] > 1 ? 150 : 0.6)) col = hexMix(C.accent, '#3a2416', 0.4); } /* a plain black eye takes its colour from the Kin's accent */ const glow = !!o.glow; er *= er < 0.06 ? 1.3 : 1.12;
      const pt = (sd, u, v, w) => (w += 0.22, 0) || side ? [sd * (ex + w * er), ey + v * er, ez + u * er] : [sd * ex + u * er, ey + v * er, ez + w * er];
      const el = (sd, u, v, w, hu, hv, hw, c, oo) => { const p = pt(sd, u, v, w); const hx = (side ? hw : hu) * er, hy = hv * er, hz = (side ? hu : hw) * er; blob(p[0] - hx, p[1] - hy, p[2] - hz, p[0] + hx, p[1] + hy, p[2] + hz, 1, c, oo); };
      const deep = hexMix(col, '#0b0a16', 0.55), lite = hexMix(col, '#ffffff', 0.38), gx = side ? 0.3 : -0.3;
      for (const sd of [-1, 1]) {
        const inn = side ? 0 : -sd; /* toward the nose */
        el(sd, 0, 0.04, 0.26, 0.96, 1.16, 0.5, '#f8f6f0', { n: 5 });
        el(sd, inn * 0.1, -0.06, 0.6, 0.68, 0.88, 0.26, glow ? col : deep, { n: 5, emis: glow });
        el(sd, inn * 0.1, -0.42, 0.66, 0.5, 0.42, 0.2, glow ? hexMix(col, '#ffffff', 0.5) : lite, { n: 4, emis: glow });
        el(sd, inn * 0.1, 0.0, 0.8, 0.24, 0.44, 0.1, '#08060e', { n: 4 });
        el(sd, inn * 0.1 + gx, 0.42, 0.84, 0.25, 0.27, 0.08, '#ffffff', { n: 3, emis: true });
        el(sd, inn * 0.1 - gx * 0.9, -0.46, 0.86, 0.11, 0.11, 0.05, '#ffffff', { n: 3, emis: true });
        const arc = [], rr = []; const a0 = o.brow ? 0.8 : 0.3, a1 = o.brow ? 1.2 : 0.3;
        for (let i = 0; i <= 6; i++) { const k = i / 6, a = Math.PI * (0.94 - 0.88 * k); const base = 0.04 + 1.17 * Math.sin(a); const cut = a0 + (a1 - a0) * (inn < 0 ? 1 - k : k); /* k runs -u to +u */
          arc.push(pt(sd, 0.99 * Math.cos(a), o.brow ? Math.min(base, side ? 0.95 : cut) : base, 0.5 + 0.18 * Math.sin(a))); rr.push((i === 0 || i === 6 ? 0.05 : 0.12) * er * (o.brow ? 1.15 : 1)); }
        tube(arc, rr, '#17111f', { segs: 6, cap0: 'round', cap1: 'round' });
        if (o.brow) { const b0 = pt(sd, inn * 1.0, 1.0, 0.52), b1 = pt(sd, -inn * 1.1 + (side ? 1.0 : 0), 1.5, 0.42); if (side) { b0[2] = ez + er * 1.05; b0[1] = ey + er * 1.05; b1[2] = ez - er * 1.05; b1[1] = ey + er * 1.4; }
          tube([b0, [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2 + er * 0.08, (b0[2] + b1[2]) / 2 + (side ? 0 : er * 0.12)], b1], [er * 0.16, er * 0.22, er * 0.14], o.brow, { segs: 8, cap0: 'round', cap1: 'round' }); }
      }
    };
    // a ring of colour round an ellipsoid section (stripes, collars): centre (cx,cy,z), half-sizes hx,hy
    const ring = (cx, cy, z, hx, hy, th, c, o) => { const pts = []; for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2; pts.push([cx + Math.cos(a) * hx, cy + Math.sin(a) * hy, z]); } const rr = pts.map(() => th); tube(pts, rr, c, Object.assign({ cap0: 'none', cap1: 'none', segs: 6 }, o || {})); };
    const BPD = new Set(['embermonkey', 'torchmandrill', 'magmagorilla', 'wick', 'waxgiant', 'redpanda', 'froglet', 'riverfrog', 'sumofrog', 'otterpup', 'shellotter', 'axolotl', 'sporeling', 'mushknight', 'fungelder', 'mantisnymph', 'orchidmantis', 'mosssloth', 'molekit', 'minermole', 'drillmole', 'pangolinpup', 'pangolinknight', 'menhir', 'batpup', 'galebat', 'tempestbat', 'lemurkid', 'skylemur', 'gibbon', 'penguinchick', 'emperor', 'icegeneral', 'polarcub', 'polarbear', 'stoat', 'windupbot', 'coilsoldier', 'thundermech', 'voltjoey', 'thunderboxer', 'conductor', 'puppet', 'marionette', 'puppeteer', 'ayeaye', 'nightshaman', 'mimic', 'prismsprite', 'crystalknight', 'paladin', 'meerkatpup', 'sunsentinel', 'sunbear']);
    const BRD = new Set(['emberchick', 'flamekestrel', 'phoenix', 'emberrobin', 'firerobin', 'magmavulture', 'gullchick', 'seagull', 'albatross', 'puffling', 'puffin', 'heron', 'peachick', 'peafowl', 'bloompeacock', 'cygnet', 'lotusswan', 'hummingbird', 'emuchick', 'rockemu', 'terrorbird', 'hornbillchick', 'hornbill', 'shoebill', 'eaglet', 'hawk', 'stormeagle', 'swallow', 'swift', 'frigatebird', 'snowowlet', 'snowyowl', 'auroraowl', 'cranechick', 'crane', 'snowgoose', 'zapchick', 'cockatoo', 'thundercockatoo', 'kingfisherchick', 'kingfisher', 'lyrebird', 'ravenlet', 'raven', 'ravenking', 'nightjar', 'potoo', 'cassowary', 'squab', 'dove', 'sundove', 'goldchick', 'pheasant', 'ibis']);
    const SRP = new Set(['emberworm', 'fireviper', 'magmawyrm', 'cindercentipede', 'magmacentipede', 'flamecobra', 'elver', 'moray', 'leviathan', 'seaslug', 'blueslug', 'seakrait', 'inchworm', 'vinesnake', 'blossomserpent', 'gardensnail', 'mushsnail', 'treepython', 'earthworm', 'sandworm', 'titanworm', 'pebblemillipede', 'armormillipede', 'basilisk', 'windribbon', 'cloudserpent', 'skydragon', 'flyingsnakelet', 'paradisesnake', 'plumedserpent', 'frostgrub', 'icesnake', 'glacierwyrm', 'icicleel', 'auroraeel', 'whiterattler', 'wireworm', 'electriceel', 'thundereel', 'coilsnake', 'teslaserpent', 'batteryrattler', 'shadowgrub', 'nightadder', 'voidwyrm', 'lamprey', 'abysslamprey', 'twohead', 'glowworm', 'goldencobra', 'suncobra', 'lanterneel', 'beaconeel', 'rainbowboa']);
    const FLT = new Set(['emberspark', 'firewisp', 'wisplord', 'skylantern', 'dragonlantern', 'comet', 'droplet', 'waterorb', 'tidemoon', 'seaangel', 'greatseaangel', 'nautilus', 'seedfluff', 'dandelion', 'dandelionking', 'spore', 'fungusballoon', 'maplespinner', 'floatpebble', 'orbitring', 'floatisland', 'lodestone', 'lodeorbit', 'meteorite', 'kite', 'boxkite', 'dragonkite', 'balloonlet', 'hotairballoon', 'windchime', 'snowflake', 'crystalflake', 'blizzardstar', 'frostbreath', 'frostghost', 'auroraribbon', 'plasmabead', 'teslaorb', 'stormeye', 'bulbimp', 'bulbchandelier', 'magnet', 'floateye', 'eyecluster', 'watcher', 'hollowmask', 'cloakedmask', 'blackhole', 'halosprite', 'wingedorb', 'seraph', 'twinkle', 'star', 'crescentmoon']);
    const FSH = new Set(['emberfry', 'lionfish', 'infernolion', 'betta', 'firebetta', 'fireclown', 'minnow', 'reefshark', 'megalodon', 'seahorse', 'greatseahorse', 'mantaray', 'algaefry', 'koi', 'lotuskoi', 'seadragonfry', 'leafyseadragon', 'flowerhorn', 'stonefry', 'stonefish', 'reeftitan', 'armorfry', 'coelacanth', 'armorcatfish', 'flyfry', 'flyingfish', 'cloudmanta', 'sailfry', 'sailfish', 'hatchetfish', 'charfry', 'arcticchar', 'frostpike', 'icefishfry', 'crystalicefish', 'narwhal', 'sparkfry', 'neontetra', 'stormsword', 'torpedofry', 'torpedoray', 'eleccatfish', 'darkfry', 'viperfish', 'abyssgulper', 'barreleyefry', 'barreleye', 'ghostshark', 'glimmerfry', 'butterflyfish', 'sunfish', 'goldfish', 'celestialfish', 'moonfish']);
    // a level ring round a vertical axis (collars, coils, the bands of a funnel)
    const hring = (cx, cy, cz, r, th, c, o) => { const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16 * Math.PI * 2; pts.push([cx + Math.cos(t) * r, cy, cz + Math.sin(t) * r]); } tube(pts, pts.map(() => th), c, Object.assign({ cap0: 'none', cap1: 'none', segs: 6 }, o || {})); };
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
    let hover = 0, legLen = 0.5, kind = shape, flyer = false, sway = null;
    switch (shape) {
      case 'quadruped': {
        // Redrawn in the spirit of the great creature designs: a clear silhouette, one strong elemental signature, eyes with
        // character, and evolutions you can see. Stage 1 is a cub (big head, big eyes, short legs), stage 2 a lean youngster,
        // stage 3 a proud adult (deep chest held high, long legs, a longer muzzle, a fierce brow, its element in full flower).
        const t = Math.max(0, Math.min(2, (stage || 1) - 1)), el = dominant(sp.elem || [], 1)[0] || 'Stone';
        // ---- the body plans. Mounts (steeds, horses) keep the horse-like body below; every other four-legged Kin is one of
        // six invented creatures, picked by its seed, each with a gimmick of its own and an arc across its three stages.
        const QD = new Set(['salamander', 'pyredrake', 'jaguar', 'volcano', 'lavatoad', 'kingcrab', 'seaturtle', 'oak', 'bramblefox', 'hedgehog', 'mountain', 'scorpion', 'gargoyle', 'orerhino', 'windfox', 'skyfox', 'cloudram', 'glider', 'yeti', 'icewolf', 'glacier', 'walrus', 'tesla', 'lynx', 'stagbeetle', 'hercules', 'hare', 'eclipsecat', 'tarhound', 'abyssmaw', 'jackal', 'hart', 'unicorn', 'sunlion', 'ignivar', 'tidekirin', 'worldstag', 'runemammoth', 'stormgriffin', 'aurorasabre', 'raiju', 'chimera', 'pegasus']);
        const ARCH = ['bulwark', 'lanternstag', 'masker', 'mantlewalker', 'anvilmaw', 'glyphtail'];
        const arch = (sp.steed || sp.fast || sp.tame || sp.dino) ? 'steed' : form.plan && ARCH.includes(form.plan) ? form.plan : ARCH[((sp.seed >>> 0) % 997) % ARCH.length];
        {
          const glw = hexMix(C.accent, '#ffffff', 0.3), pawC = hexMix(C.dark, C.belly, 0.2);
          const look = (ex, ey, ez, er, o = {}) => LOOK(ex, ey, ez, er, o, false); const lookOld = (ex, ey, ez, er, o = {}) => { // layered eyes: dark base, coloured iris, pupil, two glints; an adult's brow
            for (const sd of [-1, 1]) { ball(sd * ex, ey, ez, er, '#16121e', { n: 3 }); ball(sd * (ex + er * 0.04), ey - er * 0.12, ez + er * 0.5, er * 0.62, o.col || C.eye, { emis: !!o.glow, n: 3 });
              ball(sd * (ex + er * 0.05), ey - er * 0.1, ez + er * 0.78, er * 0.3, '#0a0810', { n: 2 }); ball(sd * (ex - er * 0.22), ey + er * 0.34, ez + er * 0.82, er * 0.3, '#ffffff', { emis: true, n: 2 }); ball(sd * (ex + er * 0.3), ey - er * 0.36, ez + er * 0.84, er * 0.13, '#ffffff', { emis: true, n: 2 });
              if (o.brow) blob(sd * ex - er * 1.1, ey + er * 0.88, ez - er * 0.3, sd * ex + er * 1.1, ey + er * 1.18, ez + er * 0.9, 0.5, o.brow, { n: 2 }); } };
          /* Legs are not one leg in four sizes. Each kind is built its own way, the way a horse's leg is not a lion's:
             cat (sharp hock, neat clawed paw), dog (toed paw, a feather of fur behind the foreleg), stout (short, broad flat feet), hare (long hind feet),
             pillar (a column with toenails), hoof and cloven (slim cannon bone, knee, fetlock tuft), spindle (jointed, pointed), drake (scaled shin, claws),
             griffin (talons in front, cat behind). A design can pass o.kind; otherwise its plan decides. */
          const LEGK = { jaguar: 'cat', lynx: 'cat', eclipsecat: 'cat', aurorasabre: 'cat', sunlion: 'cat', chimera: 'cat', bramblefox: 'dog', skyfox: 'dog', icewolf: 'dog', tarhound: 'dog', jackal: 'dog', raiju: 'dog',
            hedgehog: 'stout', glider: 'stout', hare: 'hare', volcano: 'pillar', mountain: 'pillar', glacier: 'pillar', runemammoth: 'pillar', orerhino: 'pillar', abyssmaw: 'pillar', unicorn: 'hoof', tidekirin: 'hoof', pegasus: 'hoof',
            cloudram: 'cloven', worldstag: 'cloven', tesla: 'spindle', ignivar: 'drake', gargoyle: 'drake', stormgriffin: 'griffin' };
          const legsOf = (leg, L, xw, thick, front, back, o = {}) => { // four legs on bones 2..5; front/back z
            const kind0 = o.kind || LEGK[form.plan] || ({ lanternstag: 'cloven', masker: 'cat', bulwark: 'stout', anvilmaw: 'stout' })[arch] || (o.hoof ? 'hoof' : 'dog');
            thick *= ({ cat: 1.15, dog: 1.3, stout: 1.5, hare: 1.2, pillar: 1.15, hoof: 1.12, cloven: 1.12, spindle: 1, drake: 1.4, griffin: 1.25 })[kind0] || 1.3;
            const ivory = '#f1e8d4', LG = [[-xw, front, 2, 0], [xw, front, 3, Math.PI], [-xw, back, 4, Math.PI], [xw, back, 5, 0]];
            for (const [lx, lz, bi, ph] of LG) { const hind = lz < 0; B(bi, 'leg', [lx, leg + 0.06, lz], { phase: ph, len: leg + 0.05 });
              const kd = kind0 === 'griffin' ? (hind ? 'cat' : 'talon') : kind0; const soft = kd === 'cat' || kd === 'dog' || kd === 'stout' || kd === 'hare' || kd === 'drake' || kd === 'talon';
              if (kd === 'pillar') { tube([[lx, leg + 0.1, lz], [lx, leg * 0.5, lz], [lx, 0.05, lz]], [thick, thick * 1.04, thick * 1.28], C.body, { cap0: 'none', cap1: 'flat' }); tube([[lx, 0.16, lz], [lx, 0.05, lz]], [thick * 1.3, thick * 1.34], hexMix(C.body, C.dark, 0.3), { cap0: 'none', cap1: 'none' });
                for (const a of [-1, 0, 1]) ball(lx + a * thick * 0.72, 0.075, lz + thick * (1.16 - Math.abs(a) * 0.22), thick * 0.3, ivory); continue; }
              if (kd === 'spindle') { const kn = [lx * 1.3, leg * 0.62, lz * 1.15]; tube([[lx, leg + 0.1, lz], kn, [lx * 1.12, 0.0, lz * 1.1]], [thick, thick * 0.75, thick * 0.2], C.body, { cap0: 'none', cap1: 'none' }); ball(kn[0], kn[1], kn[2], thick * 1.25, C.accent, { emis: true }); continue; }
              if (kd === 'hoof' || kd === 'cloven') {
                if (hind && o.haunch !== false) blob(lx - thick * 1.1, leg * 0.52, lz - thick * 1.4, lx + thick * 1.1, leg + 0.2, lz + thick * 1.2, 1, C.body, { under: C.belly });
                if (hind) tube([[lx, leg + 0.1, lz], [lx * 1.02, leg * 0.6, lz + 0.07], [lx, leg * 0.34, lz - 0.08], [lx, 0.12, lz - 0.01]], [thick * 1.15, thick * 0.85, thick * 0.55, thick * 0.5], C.body, { cap0: 'none', cap1: 'none' });
                else { tube([[lx, leg + 0.1, lz], [lx, leg * 0.5, lz + 0.035], [lx, 0.12, lz + 0.02]], [thick * 1.08, thick * 0.62, thick * 0.5], C.body, { cap0: 'none', cap1: 'none' }); ball(lx, leg * 0.5, lz + 0.045, thick * 0.74, C.body); }
                cone([lx, 0.2, lz - thick * 0.35], [0, -0.7, -1], thick * 1.9, thick * 0.6, C.belly); /* the fetlock's tuft */
                if (kd === 'hoof') blob(lx - thick * 0.82, 0, lz - thick * 0.7, lx + thick * 0.82, 0.16, lz + thick * 1.0, 0.45, C.dark, { n: 2 });
                else for (const a of [-1, 1]) blob(lx + a * thick * 0.42 - thick * 0.4, 0, lz - thick * 0.6, lx + a * thick * 0.42 + thick * 0.4, 0.15, lz + thick * 1.1, 0.5, C.dark, { n: 2, tap: [1, 0.7] });
                continue; }
              /* the soft-footed kinds share a thigh, a knee and a shin, and differ in how they are hung and what they stand on */
              if (hind && o.haunch !== false) { const hm = kd === 'cat' || kd === 'drake' ? 1.25 : kd === 'hare' ? 1.5 : 1; blob(lx - thick * 1.0 * hm, leg * 0.5, lz - thick * 1.2 * hm, lx + thick * 1.0 * hm, leg + 0.2, lz + thick * 1.1 * hm, 1, C.body, { under: C.belly }); }
              if (!hind && kd !== 'talon') blob(lx - thick * 0.95, leg * 0.6, lz - thick * 0.95, lx + thick * 0.95, leg + 0.18, lz + thick * 0.95, 1, C.body);
              const sock = kd === 'talon' ? '#e8c23a' : kd === 'drake' ? hexMix(C.body, C.dark, 0.55) : kd === 'cat' ? C.body : t >= 1 ? hexMix(C.body, C.dark, 0.38) : C.body;
              const hock = kd === 'cat' ? 0.12 : kd === 'hare' ? 0.14 : kd === 'stout' ? 0.03 : 0.08, sh = kd === 'stout' ? 0.9 : kd === 'cat' ? 0.56 : 0.66;
              if (hind) { tube([[lx, leg + 0.1, lz], [lx * 1.04, leg * 0.58, lz + hock], [lx, leg * 0.26, lz - hock * 0.9]], [thick, thick * 0.8, thick * sh], C.body, { cap0: 'none', cap1: 'round' }); tube([[lx, leg * 0.3, lz - hock * 0.8], [lx, 0.1, lz]], [thick * sh, thick * (sh + 0.04)], sock, { cap0: 'round', cap1: 'none' }); }
              else { tube([[lx, leg + 0.1, lz], [lx * 1.03, leg * 0.48, lz + 0.02], [lx, leg * 0.3, lz + 0.035]], [thick, thick * 0.76, thick * sh], C.body, { cap0: 'none', cap1: 'round' }); tube([[lx, leg * 0.34, lz + 0.035], [lx, 0.1, lz + 0.03]], [thick * sh, thick * (sh + 0.04)], sock, { cap0: 'round', cap1: 'none' }); }
              if (kd === 'dog' && !hind) cone([lx, leg * 0.5, lz - thick * 0.6], [0, -0.5, -1], thick * 1.5, thick * 0.5, C.body); /* a feather of fur behind the foreleg */
              if (kd === 'cat') { blob(lx - thick * 0.9, 0, lz - thick * 0.6, lx + thick * 0.9, Math.max(0.12, thick), lz + thick * 1.2, 0.9, pawC, { n: 2 }); for (const a of [-1, 0, 1]) cone([lx + a * thick * 0.5, thick * 0.3, lz + thick * 1.1], [a * 0.2, -0.5, 1], thick * 0.6, thick * 0.16, ivory); }
              else if (kd === 'stout') { blob(lx - thick * 1.1, 0, lz - thick * 0.8, lx + thick * 1.1, Math.max(0.1, thick * 0.8), lz + thick * 1.4, 0.7, pawC, { n: 2 }); for (const a of [-1.5, -0.5, 0.5, 1.5]) ball(lx + a * thick * 0.45, thick * 0.3, lz + thick * 1.35, thick * 0.3, pawC); }
              else if (kd === 'hare') { const fl = hind ? 3.6 : 1.3; blob(lx - thick * 0.8, 0, lz - thick * 0.7, lx + thick * 0.8, Math.max(0.1, thick * 0.9), lz + thick * fl, 0.8, pawC, { n: 2 }); }
              else if (kd === 'drake') { blob(lx - thick * 0.9, 0, lz - thick * 0.7, lx + thick * 0.9, Math.max(0.12, thick * 0.9), lz + thick * 1.0, 0.7, sock, { n: 2 }); for (const a of [-1, 0, 1]) cone([lx + a * thick * 0.55, thick * 0.4, lz + thick * 0.8], [a * 0.35, -0.45, 1], thick * 1.5, thick * 0.3, ivory); cone([lx, thick * 0.4, lz - thick * 0.5], [0, -0.3, -1], thick * 0.9, thick * 0.25, ivory); }
              else if (kd === 'talon') { for (const a of [-0.55, 0, 0.55]) { const e = [lx + a * thick * 2.2, 0.04, lz + thick * 2.6 * (1 - Math.abs(a) * 0.25)]; tube([[lx, 0.1, lz], e], [thick * 0.5, thick * 0.34], sock, { cap0: 'round', cap1: 'round' }); cone(e, [a * 0.3, -0.5, 1], thick * 0.9, thick * 0.26, '#2a2420'); } cone([lx, 0.08, lz - thick * 0.6], [0, -0.3, -1], thick * 1.0, thick * 0.26, '#2a2420'); }
              else { blob(lx - thick * 0.95, 0, lz - thick * 0.7, lx + thick * 0.95, Math.max(0.13, thick * 1.1), lz + thick * 1.25, 0.85, pawC, { n: 2 }); for (const a of [-1, 0, 1]) ball(lx + a * thick * 0.55, thick * 0.38, lz + thick * 1.2, thick * 0.4, pawC); } }
            bone = 0; legLen = leg + 0.05; };
          // element anatomy: the element does not just colour a Kin, it changes what grows on it. Anchors come from each body plan:
          // A.head (x,y,z of the head's crown), A.hs (head size), A.neck, A.back (y, z0, z1), A.tail (tip), A.jaw, A.feet [[x,z,bone]].
          const bulk = { Stone: 1.12, Flame: 1, Tide: 0.94, Bloom: 1, Gale: 0.9, Frost: 1, Spark: 0.92, Void: 0.96, Light: 0.95 }[el] || 1;
          const kk = [0.75, 1, 1.3][t];
          const infuse = (A) => {
            const [hx, hy, hz] = A.head, hs = A.hs || 1, [by, bz0, bz1] = A.back, nk = A.neck, tl = A.tail, jw = A.jaw;
            const alongBack = (n, fn) => { for (let i = 0; i < n; i++) { const u = n === 1 ? 0.5 : i / (n - 1); fn(bz1 + (bz0 - bz1) * u, u, i); } };
            const onHead = (fn) => { bone = 1; fn(); bone = 0; }, onTail = (fn) => { bone = 6; fn(); bone = 0; };
            if (t <= 1 && arch !== 'mantlewalker' && arch !== 'bulwark') for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * 1.6; cone([Math.sin(a) * 0.08, nk[1] - 0.14, nk[2] + 0.1], [Math.sin(a) * 0.4, -0.7, 0.7], 0.14 + 0.04 * (i === 2), 0.045, C.belly); } // a fluffy chest tuft on the young
            if (el === 'Flame') {
              alongBack(2 + 2 * t, (z, u, i) => cone([0, by - 0.02, z], [0, 1, -0.5], (0.2 + 0.08 * t) * (1 - u * 0.3) * kk, 0.08 * kk, i % 2 ? C.accent : glw, { emis: true })); // a crest of flame down the back
              onTail(() => { for (let i = 0; i < 3; i++) cone(tl, [(i - 1) * 0.4, 1, -0.3], (0.22 + 0.08 * t) * kk, 0.08 * kk, i === 1 ? glw : C.accent, { emis: true }); });
              if (t >= 1) for (const [fx, fz, fb] of A.feet) { bone = fb; ball(fx, 0.1, fz + 0.06, 0.05 * kk, glw, { emis: true, n: 1 }); bone = 0; } // embers at the feet
              if (t === 2) onHead(() => { for (const sd of [-1, 1]) cone([hx + sd * 0.1 * hs, hy, hz - 0.04], [sd * 0.3, 1, -0.6], 0.3 * hs, 0.06 * hs, glw, { emis: true }); }); // horns of fire
            } else if (el === 'Tide') {
              plate([[0, by - 0.04, bz1], [0, by + (0.16 + 0.12 * t) * kk, (bz0 + bz1) / 2 + 0.06], [0, by + 0.02, bz0], [0, by - 0.06, (bz0 + bz1) / 2]], 0.03, C.accent, { edge: glw }); // a dorsal fin
              onTail(() => { for (const sd of [-1, 1]) plate([[tl[0], tl[1], tl[2]], [tl[0] + sd * 0.3 * kk, tl[1] + 0.14 * kk, tl[2] - 0.24 * kk], [tl[0] + sd * 0.08, tl[1], tl[2] - 0.2 * kk]], 0.03, C.accent, { edge: glw }); }); // a forked fin tail
              if (t >= 1) for (const sd of [-1, 1]) plate([[sd * 0.1, nk[1] + 0.12, nk[2]], [sd * (0.3 + 0.1 * t), nk[1] + 0.06, nk[2] - 0.08], [sd * (0.26 + 0.08 * t), nk[1] - 0.12, nk[2] - 0.02], [sd * 0.1, nk[1] - 0.06, nk[2] + 0.04]], 0.025, C.accent, { edge: glw }); // neck frills
              if (t === 2) for (const [fx, fz, fb] of A.feet) { bone = fb; plate([[fx - 0.12, 0.02, fz - 0.06], [fx + 0.12, 0.02, fz - 0.06], [fx, 0.02, fz + 0.24]], 0.02, C.accent); bone = 0; } // webbed feet
            } else if (el === 'Bloom') {
              onHead(() => plate([[hx, hy - 0.02, hz], [hx - 0.12 * kk, hy + 0.22 * kk, hz - 0.06], [hx, hy + 0.34 * kk, hz - 0.1], [hx + 0.1 * kk, hy + 0.2 * kk, hz - 0.04]], 0.03, C.accent)); // a leaf
              if (t >= 1) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; plate([[Math.cos(a) * 0.12, nk[1] + Math.sin(a) * 0.12, nk[2]], [Math.cos(a) * (0.32 + 0.08 * t), nk[1] + Math.sin(a) * (0.3 + 0.08 * t), nk[2] - 0.12], [Math.cos(a + 0.4) * 0.2, nk[1] + Math.sin(a + 0.4) * 0.2, nk[2] - 0.04]], 0.025, i % 2 ? C.accent : hexMix(C.accent, '#2e6b2a', 0.4)); } // a collar of leaves
              if (t === 2) alongBack(4, (z, u, i) => { tube([[0, by - 0.04, z], [0.06 * (i % 2 ? 1 : -1), by + 0.08, z - 0.06]], [0.03, 0.02], '#2e6b2a', { cap0: 'none', cap1: 'round' }); for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2; ball(0.06 * (i % 2 ? 1 : -1) + Math.cos(a) * 0.06, by + 0.12 + Math.sin(a) * 0.06, z - 0.06, 0.045, '#f4a3d2', { n: 2 }); } ball(0.06 * (i % 2 ? 1 : -1), by + 0.12, z - 0.04, 0.035, '#ffe08a', { n: 2 }); }); // flowers along the back
              onTail(() => cone(tl, [0, 0.6, -1], 0.24 * kk, 0.09 * kk, C.accent));
            } else if (el === 'Stone') {
              alongBack(1 + t, (z) => blob(-0.24 * kk, by - 0.08, z - 0.13, 0.24 * kk, by + 0.1 + 0.04 * t, z + 0.13, 0.35, hexMix(C.body, C.dark, 0.45), { n: 2 })); // rock plates
              if (t >= 1) for (const sd of [-1, 1]) blob(sd * 0.26 - 0.13, by - 0.2, bz1 - 0.12, sd * 0.26 + 0.13, by - 0.02, bz1 + 0.14, 0.4, hexMix(C.body, C.dark, 0.45), { n: 2 }); // boulder shoulders
              if (t === 2 && jw) onHead(() => cone([jw[0], jw[1] + 0.12, jw[2]], [0, 1, 0.4], 0.24 * hs, 0.07 * hs, '#f4ecdc')); // a nose horn
              onTail(() => ball(tl[0], tl[1], tl[2], (0.08 + 0.03 * t) * kk, hexMix(C.body, C.dark, 0.45), { n: 2 }));
            } else if (el === 'Gale') {
              onHead(() => { for (let i = 0; i < 3; i++) cone([hx, hy - 0.02, hz - 0.02 * i], [(i - 1) * 0.5, 1, -0.6], (0.2 + 0.06 * t) * hs * (1 - Math.abs(i - 1) * 0.25), 0.05 * hs, i === 1 ? C.belly : C.body); }); // a feather tuft
              if (t >= 1) for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.6; cone([Math.sin(a) * 0.14, nk[1] + Math.cos(a) * 0.08, nk[2]], [Math.sin(a), Math.cos(a) * 0.5, -0.6], (0.18 + 0.06 * t), 0.05, i % 2 ? C.belly : C.body); } // a feather ruff
              if (t === 2) wings(0.24, by - 0.06, (bz0 + bz1) / 2 + 0.1, 0.8);
              onTail(() => { for (let i = 0; i < 5; i++) cone(tl, [(i - 2) * 0.3, 0.3, -1], (0.32 + 0.1 * t) * (1 - Math.abs(i - 2) * 0.15), 0.06, i % 2 ? C.belly : C.body); }); // a plume
            } else if (el === 'Frost') {
              alongBack(2 + 2 * t, (z, u) => cone([0, by - 0.04, z], [0, 1, -0.25], (0.16 + 0.07 * t) * (1 - u * 0.3) * kk, 0.06 * kk, glw, { emis: true })); // ice crystals
              if (t >= 1 && jw) onHead(() => { for (let i = 0; i < 3; i++) cone([jw[0] + (i - 1) * 0.05, jw[1] - 0.04, jw[2] - 0.04], [0, -1, 0.15], (0.12 + 0.05 * t) * (i === 1 ? 1.2 : 1), 0.03, glw, { emis: true }); }); // an icicle beard
              if (t === 2) onHead(() => { for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * 2; cone([hx + Math.sin(a) * 0.12 * hs, hy - 0.02, hz - 0.04], [Math.sin(a) * 0.5, 1, -0.2], (0.18 + 0.1 * (i === 2)) * hs, 0.04 * hs, glw, { emis: true }); } }); // a crown of ice
              onTail(() => cone(tl, [0, 0.4, -1], (0.24 + 0.08 * t) * kk, 0.07 * kk, glw, { emis: true }));
            } else if (el === 'Spark') {
              alongBack(1 + t, (z) => plate([[0, by - 0.02, z + 0.1], [0.02, by + 0.2 * kk, z], [0, by + 0.12 * kk, z - 0.02], [0.02, by + 0.32 * kk, z - 0.12]], 0.03, C.accent, { emis: true })); // bolts on the back
              if (jw) onHead(() => { for (const sd of [-1, 1]) ball(jw[0] + sd * 0.16 * hs, jw[1] + 0.06, jw[2] - 0.08, 0.045 * hs, '#ff7a5a', { emis: true, n: 2 }); }); // cheek sparks
              onTail(() => tube([tl, [tl[0], tl[1] + 0.16 * kk, tl[2] - 0.12 * kk], [tl[0], tl[1] + 0.1 * kk, tl[2] - 0.2 * kk], [tl[0], tl[1] + 0.34 * kk, tl[2] - 0.34 * kk]], [0.05, 0.05, 0.05, 0.015], C.accent, { cap0: 'none', cap1: 'round', segs: 5, emis: t === 2 }));
            } else if (el === 'Void') {
              onHead(() => { if (t === 2) for (const sd of [-1, 1]) curl([hx + sd * 0.1 * hs, hy - 0.02, hz - 0.02], [sd * 0.4, 1, -0.4], 0.32 * hs, 0.05 * hs, C.accent, [sd * 0.3, -0.2, -0.6]); else ball(hx, hy + 0.04, hz - 0.04, 0.05 * hs, C.accent, { emis: true, n: 2 }); });
              if (t >= 1) for (let i = 0; i < 3 + t; i++) plate([[0, nk[1] + 0.06 + i * 0.05, nk[2] - i * 0.06], [-0.07, nk[1] + 0.3 + i * 0.05, nk[2] - 0.16 - i * 0.06], [0.07, nk[1] + 0.26 + i * 0.05, nk[2] - 0.12 - i * 0.06]], 0.03, C.dark, { edge: C.accent }); // a smoke mane
              onTail(() => tube([tl, [tl[0], tl[1] + 0.12 * kk, tl[2] - 0.2 * kk], [tl[0], tl[1] + 0.3 * kk, tl[2] - 0.3 * kk]], [0.05, 0.035, 0.0005], C.accent, { cap0: 'none', cap1: 'none', emis: true }));
            } else if (el === 'Light') {
              if (t >= 1) for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2.8; cone([Math.sin(a) * 0.14, nk[1] + Math.cos(a) * 0.1, nk[2] + 0.04], [Math.sin(a), Math.cos(a) * 0.6, -0.3], 0.16 + 0.06 * t, 0.045, '#fff6d0'); } // a radiant ruff
              if (t === 2) onHead(() => ring(hx, hy + 0.2 * hs, hz - 0.02, 0.18 * hs, 0.06 * hs, 0.03, '#fff3b0', { emis: true })); // a halo
              onTail(() => ball(tl[0], tl[1], tl[2], (0.08 + 0.02 * t) * kk, '#fff3b0', { emis: true, n: 2 }));
            }
          };
          if (QD.has(form.plan)) {
            // Evolved forms with a body of their own: each is drawn from scratch, with its own head, its own legs and its own
            // gimmick, so no two share a face or a frame. The element shows in what each creature is, not in trim added on top.
            const P = form.plan, dk = C.dark, bl = C.belly, bd = C.body, ac = C.accent;
            const H = (y, z) => B(1, 'head', [0, y, z]);
            const nose = (x, y, z, r, c) => ball(x, y, z, r, c || dk, { n: 2 });
            const torso = (w, y0, y1, z0, z1, c, u) => blob(-w, y0, z0, w, y1, z1, 1, c || bd, { under: u || bl });
            const earTri = (sd, x, y, z, w, h, c, lean, inner) => plate([[sd * (x - w * 0.5), y, z], [sd * (x + w * 0.5), y, z - 0.02], [sd * (x + lean), y + h, z - 0.06]], 0.025, c, { edge: inner });
            const tail = (pts, rr, c, o = {}) => { B(6, 'tail', pts[0]); tube(pts, rr, c || bd, Object.assign({ cap0: 'none', cap1: 'round' }, o)); if (o.tip) { bone = 6; o.tip(pts[pts.length - 1]); } bone = 0; return pts[pts.length - 1]; };
            const neck = (a, b, r0, r1, c) => tube([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.02, (a[2] + b[2]) / 2], b], [r0, (r0 + r1) / 2, r1], c || bd, { cap0: 'none', cap1: 'round' });
            const sprawl = (y, xw, zf, zb, th, reach, c) => { // reptile and crab legs: out to the side, then down to a splayed foot
              for (const [sd, lz, bi, ph] of [[-1, zf, 2, 0], [1, zf, 3, Math.PI], [-1, zb, 4, Math.PI], [1, zb, 5, 0]]) { B(bi, 'leg', [sd * xw, y, lz], { phase: ph, len: y });
                tube([[sd * xw, y, lz], [sd * (xw + reach), y * 0.92, lz + 0.02], [sd * (xw + reach * 1.15), 0.07, lz + 0.05]], [th, th * 0.85, th * 0.7], c || bd, { cap0: 'round', cap1: 'none' });
                for (let i = 0; i < 3; i++) cone([sd * (xw + reach * 1.15), 0.04, lz + 0.05], [(i - 1) * 0.6 + sd * 0.2, 0, 1], th * 2.2, th * 0.4, dk); }
              bone = 0; legLen = y; };
            // ---- heads: each family has its own skull, so faces stop repeating ----
            const catHead = (y, z, hs, o = {}) => { H(y - 0.05 * hs, z - 0.12 * hs); // round skull, a short flat muzzle, whisker pads
              blob(-0.21 * hs, y - 0.17 * hs, z - 0.16 * hs, 0.21 * hs, y + 0.16 * hs, z + 0.15 * hs, 1, o.c || bd, { under: bl });
              for (const sd of [-1, 1]) ball(sd * 0.055 * hs, y - 0.08 * hs, z + 0.14 * hs, 0.065 * hs, o.pad || bl, { n: 2 });
              ball(0, y - 0.12 * hs, z + 0.12 * hs, 0.04 * hs, o.pad || bl, { n: 2 });
              plate([[-0.035 * hs, y - 0.02 * hs, z + 0.2 * hs], [0.035 * hs, y - 0.02 * hs, z + 0.2 * hs], [0, y - 0.065 * hs, z + 0.21 * hs]], 0.015, o.nose || '#e48aa0');
              for (const sd of [-1, 1]) earTri(sd, 0.13 * hs, y + 0.1 * hs, z - 0.02 * hs, (o.earW || 0.13) * hs, (o.ear || 0.18) * hs, o.c || bd, 0.04 * hs, o.earIn || bl);
              look(0.085 * hs, y + 0.03 * hs, z + 0.11 * hs, (o.eyeR || 0.055) * hs, { brow: o.brow, col: o.eye, glow: o.glow });
              if (o.tufts) for (const sd of [-1, 1]) cone([sd * 0.17 * hs, y + (0.1 + (o.ear || 0.18)) * hs, z - 0.08 * hs], [sd * 0.2, 1, -0.2], 0.14 * hs, 0.022 * hs, dk);
              if (o.ruff) for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * 2.2; for (const sd of [-1, 1]) cone([sd * 0.17 * hs, y - 0.05 * hs + Math.sin(a) * 0.07 * hs, z - 0.02 * hs], [sd, -0.3 + Math.sin(a) * 0.6, -0.4], 0.16 * hs, 0.04 * hs, bl); }
              if (o.extra) o.extra(); bone = 0; };
            const canHead = (y, z, hs, o = {}) => { const ml = (o.muz || 0.18) * hs * 0.75, ew = o.w || 1; H(y - 0.05 * hs, z - 0.12 * hs); // a wedge skull and a long muzzle
              blob(-0.17 * hs * ew, y - 0.14 * hs, z - 0.15 * hs, 0.17 * hs * ew, y + 0.15 * hs, z + 0.12 * hs, 1, o.c || bd, { under: bl });
              blob(-0.08 * hs, y - 0.13 * hs, z + 0.02 * hs, 0.08 * hs, y + 0.02 * hs, z + 0.08 * hs + ml, 0.85, o.muzC || hexMix(o.c || bd, bl, 0.45), { tap: [0.6, 0.7] });
              nose(0, y - 0.01 * hs, z + 0.08 * hs + ml, 0.036 * hs);
              plate([[-0.05 * hs, y - 0.11 * hs, z + 0.06 * hs + ml * 0.8], [0.05 * hs, y - 0.11 * hs, z + 0.06 * hs + ml * 0.8], [0, y - 0.12 * hs, z + 0.04 * hs]], 0.01, dk);
              for (const sd of [-1, 1]) earTri(sd, 0.1 * hs * ew, y + 0.1 * hs, z - 0.04 * hs, (o.earW || 0.11) * hs, (o.ear || 0.22) * hs, o.c || bd, 0.03 * hs, o.earIn || bl);
              look(0.08 * hs * ew, y + 0.045 * hs, z + 0.08 * hs, (o.eyeR || 0.045) * hs, { brow: o.brow === undefined ? dk : o.brow, col: o.eye, glow: o.glow });
              if (o.extra) o.extra(); bone = 0; };
            const lizHead = (y, z, hs, o = {}) => { H(y, z - 0.15 * hs); // flat and wide, eyes up on bumps, a long grin
              blob(-0.17 * hs, y - 0.08 * hs, z - 0.18 * hs, 0.17 * hs, y + 0.1 * hs, z + 0.26 * hs, 1, bd, { under: bl, tap: [0.7, 0.8] });
              plate([[-0.15 * hs, y - 0.035 * hs, z + 0.02 * hs], [0.15 * hs, y - 0.035 * hs, z + 0.02 * hs], [0, y - 0.03 * hs, z + 0.27 * hs]], 0.012, dk);
              for (const sd of [-1, 1]) { ball(sd * 0.1 * hs, y + 0.09 * hs, z + 0.02 * hs, 0.07 * hs, bd, { n: 2 }); ball(sd * 0.04 * hs, y + 0.06 * hs, z + 0.25 * hs, 0.015 * hs, dk, { n: 1 }); }
              look(0.11 * hs, y + 0.11 * hs, z + 0.05 * hs, 0.05 * hs, { brow: o.brow, glow: o.glow, col: o.eye });
              if (o.horns) for (const sd of [-1, 1]) curl([sd * 0.12 * hs, y + 0.06 * hs, z - 0.12 * hs], [sd * 0.3, 0.5, -1], 0.4 * hs, 0.05 * hs, o.hornC || '#f2e6cc', [0, 0.5, 0]);
              if (o.frill) for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * 2.6; cone([Math.sin(a) * 0.12 * hs, y + Math.cos(a) * 0.06 * hs, z - 0.14 * hs], [Math.sin(a), Math.cos(a) * 0.8, -0.5], o.frill * hs, 0.05 * hs, i % 2 ? ac : glw, { emis: true }); }
              if (o.extra) o.extra(); bone = 0; };
            const bullHead = (y, z, hs, o = {}) => { H(y, z - 0.14 * hs); // broad and heavy, small eyes set wide, ears out sideways
              blob(-0.19 * hs, y - 0.16 * hs, z - 0.18 * hs, 0.19 * hs, y + 0.14 * hs, z + 0.14 * hs, 1, o.c || bd, { under: bl });
              blob(-0.14 * hs, y - 0.2 * hs, z + 0.02 * hs, 0.14 * hs, y + 0.02 * hs, z + (o.muz || 0.3) * hs, 0.85, o.muzC || hexMix(bd, bl, 0.4), { tap: [0.85, 0.85] });
              for (const sd of [-1, 1]) nose(sd * 0.05 * hs, y - 0.08 * hs, z + (o.muz || 0.3) * hs, 0.025 * hs);
              look(0.15 * hs, y + 0.04 * hs, z + 0.06 * hs, 0.04 * hs, { brow: dk, col: o.eye, glow: o.glow });
              if (!o.noEars) for (const sd of [-1, 1]) plate([[sd * 0.16 * hs, y + 0.1 * hs, z - 0.06 * hs], [sd * 0.3 * hs, y + 0.14 * hs, z - 0.1 * hs], [sd * 0.2 * hs, y + 0.04 * hs, z - 0.04 * hs]], 0.02, o.c || bd, { edge: bl });
              if (o.extra) o.extra(); bone = 0; };
            const deerHead = (y, z, hs, o = {}) => { H(y - 0.04 * hs, z - 0.1 * hs); // narrow, a long tapering face, leaf ears held out
              blob(-0.13 * hs, y - 0.1 * hs, z - 0.12 * hs, 0.13 * hs, y + 0.13 * hs, z + 0.1 * hs, 1, o.c || bd, { under: bl });
              blob(-0.08 * hs, y - 0.13 * hs, z, 0.08 * hs, y + 0.03 * hs, z + (o.muz || 0.3) * hs, 0.9, hexMix(o.c || bd, bl, 0.35), { tap: [0.8, 0.75] });
              nose(0, y - 0.04 * hs, z + (o.muz || 0.3) * hs, 0.03 * hs);
              for (const sd of [-1, 1]) plate([[sd * 0.1 * hs, y + 0.08 * hs, z - 0.04 * hs], [sd * 0.3 * hs, y + 0.17 * hs, z - 0.09 * hs], [sd * 0.24 * hs, y + 0.04 * hs, z - 0.04 * hs]], 0.025, o.c || bd, { edge: bl });
              look(0.1 * hs, y + 0.04 * hs, z + 0.06 * hs, 0.045 * hs, { col: o.eye, glow: o.glow, brow: o.brow });
              if (o.extra) o.extra(); bone = 0; };
            const apeHead = (y, z, hs, o = {}) => { H(y - 0.1 * hs, z - 0.1 * hs); // a furred dome round a flat bare face, a heavy brow
              blob(-0.22 * hs, y - 0.2 * hs, z - 0.18 * hs, 0.22 * hs, y + 0.2 * hs, z + 0.14 * hs, 1, o.fur);
              blob(-0.15 * hs, y - 0.17 * hs, z + 0.02 * hs, 0.15 * hs, y + 0.1 * hs, z + 0.2 * hs, 1, o.face);
              blob(-0.17 * hs, y + 0.06 * hs, z + 0.1 * hs, 0.17 * hs, y + 0.13 * hs, z + 0.21 * hs, 0.6, o.fur, { n: 2 });
              look(0.07 * hs, y + 0.02 * hs, z + 0.17 * hs, 0.04 * hs, { col: o.eye, glow: o.glow });
              tube([[-0.08 * hs, y - 0.1 * hs, z + 0.19 * hs], [0, y - 0.12 * hs, z + 0.21 * hs], [0.08 * hs, y - 0.1 * hs, z + 0.19 * hs]], [0.012, 0.012, 0.012], dk, { cap0: 'round', cap1: 'round' });
              for (const sd of [-1, 1]) cone([sd * 0.06 * hs, y - 0.12 * hs, z + 0.2 * hs], [0, 1, 0.2], 0.07 * hs, 0.02 * hs, '#f4f0e6');
              if (o.extra) o.extra(); bone = 0; };
            const hairs = (cx, cy, cz, rx, ry, rz, n, len, r, c, below) => { for (let i = 0; i < n; i++) { const a = i * 2.39996, u = ((i * 0.618) % 1) * (below ? 2 : 1.2) - (below ? 1 : 0.2); const k = Math.sqrt(Math.max(0, 1 - u * u)); const d = [Math.cos(a) * k, u, Math.sin(a) * k]; cone([cx + d[0] * rx, cy + d[1] * ry, cz + d[2] * rz], [d[0], d[1] - 0.5, d[2] - 0.3], len, r, Array.isArray(c) ? c[i % c.length] : c); } };
            const beetle = (k, sh) => { // six jointed legs, a split shell over the back, a small dark head
              for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const z = (0.22 - i * 0.24) * k; const bi = i === 0 ? (sd < 0 ? 2 : 3) : i === 2 ? (sd < 0 ? 4 : 5) : 0;
                if (bi) B(bi, 'leg', [sd * 0.24 * k, 0.3 * k, z], { phase: (i === 0) === (sd < 0) ? 0 : Math.PI, len: 0.3 * k });
                tube([[sd * 0.24 * k, 0.3 * k, z], [sd * 0.5 * k, 0.42 * k, z + 0.04], [sd * 0.62 * k, 0.04, z + 0.12 * (1 - i)]], [0.045 * k, 0.035 * k, 0.02 * k], dk, { cap0: 'round', cap1: 'round' }); bone = 0; }
              const sh2 = hexMix(sh, dk, 0.4);
              for (const sd of [-1, 1]) blob(sd > 0 ? 0.005 : -0.36 * k, 0.26 * k, -0.6 * k, sd > 0 ? 0.36 * k : -0.005, 0.7 * k, 0.12 * k, 1, sh, { under: sh2 });
              tube([[0, 0.69 * k, 0.08 * k], [0, 0.7 * k, -0.24 * k], [0, 0.56 * k, -0.56 * k]], [0.018, 0.018, 0.018], glw, { emis: true, cap0: 'round', cap1: 'round' }); // the seam glows
              blob(-0.27 * k, 0.3 * k, 0.04 * k, 0.27 * k, 0.64 * k, 0.36 * k, 0.9, sh2);
              H(0.42 * k, 0.36 * k); blob(-0.16 * k, 0.3 * k, 0.3 * k, 0.16 * k, 0.52 * k, 0.52 * k, 1, dk);
              look(0.11 * k, 0.45 * k, 0.45 * k, 0.04 * k, { glow: true, col: glw });
              for (const sd of [-1, 1]) tube([[sd * 0.06 * k, 0.5 * k, 0.48 * k], [sd * 0.16 * k, 0.66 * k, 0.6 * k], [sd * 0.24 * k, 0.7 * k, 0.72 * k]], [0.014, 0.012, 0.01], glw, { emis: true, cap0: 'round', cap1: 'round' });
              bone = 0; legLen = 0.3 * k; };
            const spots = (pts, r, c, o) => { for (const [x, y, z] of pts) for (const sd of [-1, 1]) ball(sd * x, y, z, r, c, Object.assign({ n: 2 }, o || {})); };

            if (P === 'salamander') { // FLAME 2: the spark has grown a body: a low, wet-skinned salamander, its back still burning
              torso(0.22, 0.14, 0.46, -0.5, 0.42);
              tube([[0, 0.17, -0.4], [0, 0.15, 0], [0, 0.17, 0.34]], [0.07, 0.08, 0.06], glw, { emis: true, cap0: 'round', cap1: 'round' });
              for (let i = 0; i < 5; i++) cone([0, 0.43, 0.3 - i * 0.18], [0, 1, -0.4], 0.22 - i * 0.025, 0.07, i % 2 ? ac : glw, { emis: true });
              spots([[0.2, 0.33, 0.22], [0.21, 0.3, -0.05], [0.19, 0.31, -0.3]], 0.04, glw, { emis: true, n: 1 });
              lizHead(0.34, 0.6, 1.05, {});
              sprawl(0.24, 0.17, 0.26, -0.3, 0.065, 0.15);
              tail([[0, 0.3, -0.46], [0.12, 0.24, -0.78], [-0.04, 0.18, -1.08], [0.06, 0.2, -1.3]], [0.14, 0.1, 0.06, 0.02], bd, { tip: (p) => { for (let i = 0; i < 3; i++) cone(p, [(i - 1) * 0.5, 1, -0.3], 0.22, 0.06, i === 1 ? glw : ac, { emis: true }); } });
            } else if (P === 'pyredrake') { // FLAME 3: a crawling dragon, horned and frilled with fire, short wings, a molten throat
              torso(0.3, 0.38, 0.88, -0.58, 0.46);
              for (let i = 0; i < 4; i++) blob(-0.2, 0.36, 0.3 - i * 0.22 - 0.08, 0.2, 0.46, 0.3 - i * 0.22 + 0.08, 0.6, bl, { n: 2 });
              tube([[0, 0.5, 0.34], [0, 0.66, 0.6], [0, 0.82, 0.74]], [0.12, 0.1, 0.08], glw, { emis: true, cap0: 'round', cap1: 'round' }); // the furnace in its throat
              neck([0, 0.74, 0.36], [0, 1.02, 0.72], 0.22, 0.14);
              lizHead(1.06, 0.88, 1.25, { horns: true, frill: 0.22, brow: dk, glow: true, eye: glw, extra: () => { for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) cone([sd * 0.16, 0.96 - i * 0.02, 0.88 - i * 0.08], [sd, -0.3, -0.3], 0.12, 0.03, ac); } });
              for (let i = 0; i < 6; i++) cone([0, 0.86 - i * 0.02, 0.3 - i * 0.17], [0, 1, -0.5], 0.3 - i * 0.03, 0.08, i % 2 ? ac : glw, { emis: true });
              wings(0.22, 0.84, 0.1, 0.75, { col: ac });
              sprawl(0.46, 0.24, 0.3, -0.36, 0.1, 0.1);
              tail([[0, 0.62, -0.56], [0.16, 0.48, -0.96], [-0.06, 0.3, -1.3], [0.08, 0.24, -1.6]], [0.22, 0.15, 0.09, 0.03], bd, { tip: (p) => { for (let i = 0; i < 4; i++) cone(p, [(i - 1.5) * 0.4, 1, -0.4], 0.3, 0.07, i % 2 ? glw : ac, { emis: true }); } });
            } else if (P === 'jaguar') { // FLAME 2: the kitten grown long and low, black with spots that glow like coals
              legsOf(0.5, 1, 0.13, 0.065, 0.36, -0.38, {});
              torso(0.19, 0.46, 0.8, -0.56, 0.48);
              for (const [x, y, z] of [[0.17, 0.66, 0.3], [0.19, 0.6, 0.08], [0.18, 0.7, -0.12], [0.17, 0.58, -0.32], [0.12, 0.76, 0.16], [0.13, 0.74, -0.38]]) for (const sd of [-1, 1]) { ball(sd * x, y, z, 0.055, dk, { n: 2 }); ball(sd * (x + 0.015), y, z, 0.032, glw, { emis: true, n: 1 }); }
              neck([0, 0.72, 0.4], [0, 0.86, 0.58], 0.14, 0.12);
              catHead(0.92, 0.68, 1.05, { brow: dk, eye: glw, glow: true, ear: 0.14 });
              tail([[0, 0.72, -0.54], [0, 0.6, -0.86], [0.08, 0.66, -1.14], [0.02, 0.86, -1.3]], [0.06, 0.05, 0.04, 0.025], bd, { tip: (p) => cone(p, [0, 1, -0.2], 0.2, 0.06, glw, { emis: true }) });
            } else if (P === 'volcano') { // FLAME 3: the smog has settled into a little walking volcano: lava runs down its sides
              const R = hexMix(bd, '#3e3432', 0.7), Rd = '#2a2220';
              legsOf(0.24, 1, 0.3, 0.12, 0.3, -0.3, { haunch: false });
              blob(-0.56, 0.18, -0.5, 0.56, 0.76, 0.5, 0.9, R, { under: Rd });
              tube([[0, 0.6, 0], [0, 1.0, 0], [0, 1.34, 0]], [0.46, 0.32, 0.24], R, { cap0: 'none', cap1: 'none' });
              blob(-0.26, 1.28, -0.26, 0.26, 1.4, 0.26, 1, Rd); blob(-0.19, 1.33, -0.19, 0.19, 1.43, 0.19, 1, glw, { emis: true });
              for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.5; tube([[Math.cos(a) * 0.22, 1.34, Math.sin(a) * 0.22], [Math.cos(a + 0.2) * 0.36, 1.04, Math.sin(a + 0.2) * 0.36], [Math.cos(a + 0.1) * 0.5, 0.7, Math.sin(a + 0.1) * 0.5], [Math.cos(a + 0.25) * 0.58, 0.46, Math.sin(a + 0.25) * 0.58]], [0.05, 0.045, 0.04, 0.03], k % 2 ? ac : glw, { emis: true, cap0: 'round', cap1: 'round' }); }
              ball(0.04, 1.6, 0, 0.15, '#8a8484', { n: 2 }); ball(-0.08, 1.84, -0.06, 0.13, '#9a9494', { n: 2 }); ball(0.08, 2.04, -0.12, 0.1, '#aaa4a4', { n: 2 });
              H(0.56, 0.3); look(0.2, 0.58, 0.44, 0.07, { glow: true, col: glw, brow: Rd });
              tube([[-0.16, 0.38, 0.47], [0, 0.34, 0.5], [0.16, 0.38, 0.47]], [0.03, 0.035, 0.03], glw, { emis: true, cap0: 'round', cap1: 'round' }); bone = 0;
            } else if (P === 'lavatoad') { // FLAME single: a fat toad whose warty back is a crust over lava
              const R = hexMix(bd, dk, 0.3);
              blob(-0.42, 0.12, -0.42, 0.42, 0.62, 0.38, 1, R, { under: bl });
              for (const pth of [[[-0.2, 0.6, 0.1], [-0.06, 0.63, -0.04], [-0.14, 0.6, -0.24]], [[0.18, 0.61, 0.04], [0.06, 0.62, -0.14], [0.2, 0.58, -0.3]], [[-0.3, 0.52, -0.1], [-0.36, 0.42, -0.26]], [[0.32, 0.5, 0.0], [0.38, 0.4, -0.18]]]) tube(pth, pth.map(() => 0.028), glw, { emis: true, cap0: 'round', cap1: 'round' });
              for (let i = 0; i < 9; i++) { const a = i * 2.4, rr = 0.2 + (i % 3) * 0.08; ball(Math.cos(a) * rr, 0.6 - rr * 0.3, Math.sin(a) * rr - 0.08, 0.04, R, { n: 2 }); }
              B(1, 'head', [0, 0.5, 0.2]);
              for (const sd of [-1, 1]) ball(sd * 0.2, 0.6, 0.2, 0.1, R, { n: 2 });
              look(0.2, 0.67, 0.25, 0.065, { brow: dk, col: glw, glow: true });
              tube([[-0.32, 0.34, 0.26], [0, 0.29, 0.39], [0.32, 0.34, 0.26]], [0.02, 0.02, 0.02], dk, { cap0: 'round', cap1: 'round' });
              ball(0, 0.22, 0.3, 0.13, glw, { emis: true, n: 2 }); bone = 0; // the glowing throat sac
              for (const sd of [-1, 1]) { B(sd < 0 ? 2 : 3, 'leg', [sd * 0.26, 0.3, 0.24], { phase: sd < 0 ? 0 : Math.PI, len: 0.3 }); tube([[sd * 0.26, 0.3, 0.24], [sd * 0.34, 0.14, 0.32], [sd * 0.36, 0.04, 0.36]], [0.07, 0.06, 0.05], R, { cap0: 'round', cap1: 'none' }); for (let i = 0; i < 3; i++) ball(sd * 0.36 + (i - 1) * 0.06, 0.03, 0.44, 0.035, R, { n: 1 });
                B(sd < 0 ? 4 : 5, 'leg', [sd * 0.34, 0.3, -0.18], { phase: sd < 0 ? Math.PI : 0, len: 0.3 }); blob(sd * 0.36 - 0.14, 0.06, -0.38, sd * 0.36 + 0.14, 0.4, 0.0, 1, R); plate([[sd * 0.4, 0.02, -0.04], [sd * 0.56, 0.02, 0.2], [sd * 0.34, 0.02, 0.18]], 0.025, R); }
              bone = 0; legLen = 0.3;
            } else if (P === 'kingcrab') { // TIDE 2: the hermit leaves its borrowed shell: a spiked king crab with one huge claw
              const sh = hexMix(bd, ac, 0.25), sh2 = hexMix(sh, dk, 0.35);
              blob(-0.52, 0.3, -0.4, 0.52, 0.78, 0.4, 0.9, sh, { under: sh2 });
              for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.4; cone([Math.sin(a) * 0.34, 0.62, Math.cos(a) * 0.16 - 0.04], [Math.sin(a) * 0.4, 1, Math.cos(a) * 0.3], 0.14, 0.04, sh2); }
              for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const z = 0.18 - i * 0.16; const bi = i === 0 ? (sd < 0 ? 2 : 3) : i === 3 ? (sd < 0 ? 4 : 5) : 0; if (bi) B(bi, 'leg', [sd * 0.42, 0.42, z], { phase: (i === 0) === (sd < 0) ? 0 : Math.PI, len: 0.42 });
                tube([[sd * 0.42, 0.42, z], [sd * 0.62, 0.62, z * 1.4 + 0.02], [sd * 0.7, 0.04, z * 2 + 0.04]], [0.08, 0.065, 0.03], sh, { cap0: 'round', cap1: 'round' }); bone = 0; }
              H(0.5, 0.3);
              for (const sd of [-1, 1]) { const k = sd > 0 ? 1.45 : 1; tube([[sd * 0.32, 0.44, 0.3], [sd * 0.5, 0.52, 0.52], [sd * 0.42 * k, 0.46, 0.68]], [0.07, 0.065 * k, 0.06 * k], sh, { cap0: 'round', cap1: 'round' });
                blob(sd * 0.42 * k - 0.11 * k, 0.36, 0.64, sd * 0.42 * k + 0.11 * k, 0.56 * k, 0.86 + 0.08 * k, 0.9, sh, { under: sh2 });
                cone([sd * 0.42 * k, 0.52 * k, 0.86 + 0.06 * k], [-sd * 0.2, 0.3, 1], 0.24 * k, 0.06 * k, sh); cone([sd * 0.42 * k, 0.4, 0.86 + 0.06 * k], [-sd * 0.2, -0.2, 1], 0.2 * k, 0.05 * k, sh2); }
              for (const sd of [-1, 1]) { tube([[sd * 0.1, 0.6, 0.32], [sd * 0.13, 0.84, 0.36]], [0.025, 0.02], sh, { cap0: 'none', cap1: 'none' }); ball(sd * 0.13, 0.88, 0.36, 0.06, '#16121e', { n: 2 }); ball(sd * 0.12, 0.9, 0.41, 0.022, '#ffffff', { emis: true, n: 1 }); }
              bone = 0; legLen = 0.42;
            } else if (P === 'seaturtle') { // TIDE single: an old sea turtle, plated shell, long flippers, a hooked beak
              const shell = hexMix(bd, dk, 0.35), pl = '#e8d9a8';
              blob(-0.46, 0.3, -0.5, 0.46, 0.84, 0.5, 1, shell, { under: pl }); blob(-0.42, 0.22, -0.46, 0.42, 0.42, 0.46, 0.9, pl);
              for (const [x, z] of [[0, 0.22], [0, -0.04], [0, -0.3], [-0.22, 0.08], [0.22, 0.08], [-0.22, -0.2], [0.22, -0.2]]) { const top = 0.84 - (x * x + z * z) * 0.9; blob(x - 0.11, top - 0.05, z - 0.11, x + 0.11, top + 0.035, z + 0.11, 0.45, ac, { n: 2 }); }
              for (const sd of [-1, 1]) { B(sd < 0 ? 2 : 3, 'leg', [sd * 0.36, 0.36, 0.3], { phase: sd < 0 ? 0 : Math.PI, len: 0.36 }); plate([[sd * 0.36, 0.36, 0.34], [sd * 0.82, 0.16, 0.24], [sd * 0.92, 0.04, 0.02], [sd * 0.44, 0.24, 0.16]], 0.04, bd, { edge: dk });
                B(sd < 0 ? 4 : 5, 'leg', [sd * 0.3, 0.3, -0.4], { phase: sd < 0 ? Math.PI : 0, len: 0.3 }); plate([[sd * 0.3, 0.3, -0.38], [sd * 0.52, 0.04, -0.5], [sd * 0.36, 0.04, -0.68], [sd * 0.26, 0.24, -0.5]], 0.035, bd, { edge: dk }); }
              bone = 0; neck([0, 0.48, 0.42], [0, 0.58, 0.66], 0.13, 0.11);
              H(0.6, 0.66); blob(-0.13, 0.5, 0.6, 0.13, 0.74, 0.9, 1, bd, { under: bl }); plate([[-0.07, 0.6, 0.9], [0.07, 0.6, 0.9], [0, 0.52, 0.96]], 0.02, dk);
              look(0.1, 0.66, 0.78, 0.045, { brow: dk }); bone = 0; legLen = 0.3;
            } else if (P === 'oak') { // BLOOM 3: the sprout has become a walking oak: bark body, a canopy for a back, roots for feet
              const bark = '#6b4a2e', bark2 = '#4f3520', leaf = hexMix('#3f8a3a', ac, 0.3);
              for (const [lx, lz, bi, ph] of [[-0.28, 0.3, 2, 0], [0.28, 0.3, 3, Math.PI], [-0.28, -0.3, 4, Math.PI], [0.28, -0.3, 5, 0]]) { B(bi, 'leg', [lx, 0.46, lz], { phase: ph, len: 0.46 });
                tube([[lx, 0.5, lz], [lx * 1.1, 0.26, lz + 0.04], [lx * 1.05, 0.06, lz]], [0.12, 0.1, 0.1], bark, { cap0: 'none', cap1: 'none' });
                for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; tube([[lx, 0.1, lz], [lx + Math.cos(a) * 0.16, 0.03, lz + Math.sin(a) * 0.16]], [0.05, 0.02], bark2, { cap0: 'none', cap1: 'round' }); } }
              bone = 0; legLen = 0.46;
              blob(-0.36, 0.38, -0.46, 0.36, 1.0, 0.46, 0.8, bark, { under: bark2 });
              for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; tube([[Math.cos(a) * 0.35, 0.44, Math.sin(a) * 0.42], [Math.cos(a) * 0.37, 0.96, Math.sin(a) * 0.44]], [0.03, 0.03], bark2, { cap0: 'round', cap1: 'round' }); }
              for (const [x, y, z, r] of [[0, 1.3, -0.04, 0.36], [-0.32, 1.16, 0.06, 0.26], [0.32, 1.18, -0.06, 0.26], [0, 1.2, -0.38, 0.28], [-0.2, 1.48, -0.2, 0.22], [0.2, 1.46, 0.12, 0.22], [0.02, 1.16, 0.3, 0.22]]) ball(x, y, z, r, leaf, { n: 3 });
              for (let i = 0; i < 6; i++) { const a = i * 2.1; ball(Math.cos(a) * 0.34, 1.26 + Math.sin(i * 1.3) * 0.16, Math.sin(a) * 0.3, 0.05, i % 2 ? '#f4a3d2' : '#e8c25a', { n: 2 }); }
              for (const sd of [-1, 1]) { tube([[sd * 0.3, 0.86, 0.1], [sd * 0.56, 1.0, 0.18], [sd * 0.66, 1.16, 0.12]], [0.06, 0.045, 0.03], bark, { cap0: 'none', cap1: 'round' }); ball(sd * 0.68, 1.2, 0.12, 0.13, leaf, { n: 2 }); }
              H(0.78, 0.3); look(0.14, 0.8, 0.44, 0.06, { glow: true, col: '#d6ff8a', brow: bark2 });
              tube([[-0.12, 0.58, 0.45], [0, 0.55, 0.47], [0.12, 0.58, 0.45]], [0.025, 0.03, 0.025], bark2, { cap0: 'round', cap1: 'round' }); bone = 0;
            } else if (P === 'bramblefox') { // BLOOM 2: the kit grown into a fox wrapped in bramble, a tail like a bush in leaf
              legsOf(0.46, 1, 0.12, 0.06, 0.32, -0.32, {});
              torso(0.18, 0.44, 0.76, -0.48, 0.44);
              const vine = '#3f6b2a'; tube([[0.14, 0.62, 0.36], [-0.16, 0.74, 0.14], [0.17, 0.72, -0.1], [-0.15, 0.68, -0.34]], [0.03, 0.03, 0.03, 0.025], vine, { cap0: 'round', cap1: 'round' });
              for (const [x, y, z] of [[0, 0.76, 0.24], [0.06, 0.77, 0.02], [-0.04, 0.74, -0.22], [0.16, 0.72, 0.3], [-0.17, 0.72, -0.02]]) { cone([x, y, z], [x * 2, 1, 0.2], 0.1, 0.025, '#d8c89a'); ball(x + 0.04, y + 0.02, z + 0.04, 0.035, '#c2304a', { n: 1 }); }
              neck([0, 0.66, 0.36], [0, 0.84, 0.54], 0.13, 0.11);
              canHead(0.9, 0.62, 1.0, { muz: 0.24, ear: 0.26, earIn: ac, brow: dk });
              const tp = tail([[0, 0.66, -0.46], [0, 0.66, -0.72], [0, 0.82, -0.98]], [0.12, 0.17, 0.12], bd);
              bone = 6; for (let i = 0; i < 10; i++) { const a = i * 2.4; plate([[0, 0.72 + Math.sin(a) * 0.1, -0.7 - (i % 3) * 0.1], [Math.cos(a) * 0.3, 0.76 + Math.sin(a) * 0.22, -0.84 - (i % 3) * 0.1], [Math.cos(a + 0.4) * 0.14, 0.74 + Math.sin(a + 0.4) * 0.12, -0.76 - (i % 3) * 0.1]], 0.025, i % 2 ? ac : hexMix(ac, '#2e6b2a', 0.4)); } bone = 0;
            } else if (P === 'hedgehog') { // BLOOM single: a hedgehog whose spines are thorns, with roses caught among them
              legsOf(0.14, 1, 0.16, 0.05, 0.2, -0.22, { haunch: false });
              blob(-0.32, 0.12, -0.38, 0.32, 0.6, 0.36, 1, bl);
              blob(-0.37, 0.2, -0.44, 0.37, 0.72, 0.24, 1, hexMix(bd, dk, 0.3));
              for (let i = 0; i < 34; i++) { const a = i * 2.39996, u = ((i * 0.618) % 1) * 1.6 - 0.5; const k = Math.sqrt(Math.max(0, 1 - u * u)); const d = [Math.cos(a) * k, Math.abs(u) * 0.9 + 0.2, Math.sin(a) * k - 0.4]; if (d[2] > 0.5) continue; cone([d[0] * 0.3, 0.46 + d[1] * 0.22, -0.1 + d[2] * 0.28], d, 0.22, 0.035, i % 3 ? '#c8b07a' : ac); }
              for (const [x, y, z] of [[0.18, 0.74, -0.1], [-0.2, 0.7, -0.26], [0.02, 0.8, -0.36]]) { for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2; ball(x + Math.cos(a) * 0.04, y + Math.sin(a) * 0.04, z, 0.035, '#f4a3d2', { n: 1 }); } ball(x, y, z + 0.02, 0.025, '#ffe08a', { n: 1 }); }
              H(0.38, 0.3); cone([0, 0.36, 0.3], [0, -0.15, 1], 0.24, 0.12, bl); nose(0, 0.33, 0.54, 0.035); look(0.12, 0.46, 0.34, 0.045);
              for (const sd of [-1, 1]) ball(sd * 0.16, 0.56, 0.24, 0.05, bl, { n: 2 }); bone = 0;
            } else if (P === 'mountain') { // STONE 3: the boulder has become a mountain on legs: peaks, snow, little pines, a cave for a mouth
              const R = hexMix(bd, '#7a7470', 0.3), Rd = hexMix(R, '#2a2624', 0.4), snow = '#f4f6fa';
              legsOf(0.46, 1, 0.34, 0.15, 0.42, -0.42, { haunch: false, hoof: true });
              blob(-0.56, 0.42, -0.7, 0.56, 1.12, 0.66, 0.7, R, { under: Rd });
              for (const [x, z, h, r] of [[0, -0.1, 0.9, 0.34], [-0.24, -0.44, 0.6, 0.26], [0.26, 0.2, 0.66, 0.26]]) { cone([x, 1.0, z], [0, 1, 0], h, r, R); cone([x, 1.0 + h * 0.62, z], [0, 1, 0], h * 0.38, r * 0.4, snow); }
              for (let i = 0; i < 6; i++) { const a = i * 2.2; cone([Math.cos(a) * 0.46, 0.96 + (i % 2) * 0.06, Math.sin(a) * 0.5 - 0.1], [0, 1, 0], 0.2, 0.06, '#2f5a2e'); }
              H(0.82, 0.72); blob(-0.3, 0.56, 0.54, 0.3, 0.98, 0.94, 0.6, R, { under: Rd });
              blob(-0.17, 0.6, 0.86, 0.17, 0.76, 0.97, 0.8, '#120e0c'); look(0.16, 0.88, 0.9, 0.055, { glow: true, col: '#ffcf5a', brow: Rd }); bone = 0;
            } else if (P === 'scorpion') { // STONE 2: the geode cracked open and walked: a scorpion grown from crystal, its sting a shard
              const sh = bd, sh2 = hexMix(bd, dk, 0.4);
              for (let i = 0; i < 3; i++) blob(-0.26 + i * 0.03, 0.22, 0.24 - i * 0.24 - 0.13, 0.26 - i * 0.03, 0.5 - i * 0.03, 0.24 - i * 0.24 + 0.13, 0.85, i % 2 ? sh2 : sh, { n: 2 });
              for (let i = 0; i < 5; i++) cone([(i % 2 ? 0.08 : -0.08), 0.44, 0.2 - i * 0.14], [(i % 2 ? 0.3 : -0.3), 1, -0.2], 0.2, 0.05, glw, { emis: true });
              for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const z = 0.2 - i * 0.16; const bi = i === 0 ? (sd < 0 ? 2 : 3) : i === 3 ? (sd < 0 ? 4 : 5) : 0; if (bi) B(bi, 'leg', [sd * 0.22, 0.3, z], { phase: (i === 0) === (sd < 0) ? 0 : Math.PI, len: 0.3 });
                tube([[sd * 0.22, 0.3, z], [sd * 0.44, 0.48, z * 1.6], [sd * 0.54, 0.04, z * 2.4 + 0.04]], [0.05, 0.04, 0.022], sh2, { cap0: 'round', cap1: 'round' }); bone = 0; }
              H(0.36, 0.36);
              for (const sd of [-1, 1]) { tube([[sd * 0.18, 0.36, 0.34], [sd * 0.38, 0.42, 0.56], [sd * 0.26, 0.4, 0.78]], [0.06, 0.055, 0.05], sh, { cap0: 'round', cap1: 'round' }); blob(sd * 0.26 - 0.1, 0.32, 0.74, sd * 0.26 + 0.1, 0.5, 0.94, 0.8, sh, { under: sh2 }); cone([sd * 0.26, 0.46, 0.92], [-sd * 0.3, 0.2, 1], 0.2, 0.05, glw, { emis: true }); cone([sd * 0.26, 0.36, 0.92], [-sd * 0.3, -0.2, 1], 0.16, 0.04, glw, { emis: true }); }
              for (let i = 0; i < 4; i++) ball((i - 1.5) * 0.05, 0.48, 0.42, 0.025, glw, { emis: true, n: 1 }); bone = 0;
              tail([[0, 0.4, -0.38], [0, 0.72, -0.62], [0, 1.04, -0.56], [0, 1.2, -0.28], [0, 1.12, -0.04]], [0.12, 0.1, 0.09, 0.07, 0.05], sh, { tip: (p) => { ball(p[0], p[1], p[2], 0.08, sh2, { n: 2 }); cone(p, [0, -0.6, 1], 0.24, 0.06, glw, { emis: true }); } });
              legLen = 0.3;
            } else if (P === 'gargoyle') { // STONE single: a crouching gargoyle, folded wings, horns and fangs, a spade at its tail
              legsOf(0.42, 1, 0.16, 0.08, 0.34, -0.3, {});
              blob(-0.26, 0.44, -0.4, 0.26, 0.92, 0.36, 1, bd, { under: hexMix(bd, dk, 0.3) });
              wings(0.2, 0.9, -0.04, 0.8, { col: hexMix(bd, dk, 0.25), fold: -0.35 });
              neck([0, 0.8, 0.28], [0, 0.96, 0.44], 0.15, 0.13);
              canHead(1.02, 0.52, 1.15, { muz: 0.18, ear: 0.16, brow: dk, eye: '#ff7a3a', glow: true, extra: () => { for (const sd of [-1, 1]) { curl([sd * 0.12, 1.12, 0.46], [sd * 0.3, 1, -0.5], 0.36, 0.05, '#e8e0cc', [0, -0.3, -0.6]); cone([sd * 0.05, 0.92, 0.82], [0, -1, 0.2], 0.1, 0.02, '#f4f0e6'); } } });
              tail([[0, 0.6, -0.38], [0, 0.4, -0.66], [0.08, 0.2, -0.86]], [0.06, 0.05, 0.04], bd, { tip: (p) => plate([[p[0], p[1], p[2]], [p[0] - 0.1, p[1] + 0.06, p[2] - 0.08], [p[0], p[1] + 0.02, p[2] - 0.2], [p[0] + 0.1, p[1] + 0.06, p[2] - 0.08]], 0.03, hexMix(bd, dk, 0.3)) });
            } else if (P === 'orerhino') { // STONE single: a rhino with horns of raw ore and gold running through its hide
              const ore = '#d9a441';
              legsOf(0.46, 1, 0.24, 0.11, 0.4, -0.4, { hoof: true });
              torso(0.34, 0.44, 1.04, -0.62, 0.56);
              for (const sd of [-1, 1]) { blob(sd * 0.3 - 0.12, 0.66, 0.08, sd * 0.3 + 0.12, 1.0, 0.5, 0.5, hexMix(bd, dk, 0.3), { n: 2 }); tube([[sd * 0.33, 0.64, -0.4], [sd * 0.35, 0.78, -0.12], [sd * 0.33, 0.66, 0.1], [sd * 0.3, 0.86, 0.3]], [0.03, 0.03, 0.03, 0.025], ore, { cap0: 'round', cap1: 'round' }); }
              bullHead(0.84, 0.8, 1.15, { muz: 0.36, extra: () => { cone([0, 0.84, 1.18], [0, 1, 0.45], 0.46, 0.09, ore); cone([0, 0.92, 1.0], [0, 1, 0.2], 0.24, 0.06, ore); } });
              tail([[0, 0.9, -0.62], [0, 0.7, -0.74]], [0.04, 0.03], bd, { tip: (p) => cone(p, [0, -1, -0.2], 0.1, 0.04, dk) });
            } else if (P === 'windfox' || P === 'skyfox') { // GALE 2 and 3: the kit grows tails the way the wind grows gusts: two, then five
              const big = P === 'skyfox', n = big ? 5 : 2;
              legsOf(big ? 0.52 : 0.44, 1, 0.11, big ? 0.065 : 0.055, 0.3, -0.32, {});
              torso(big ? 0.19 : 0.16, big ? 0.5 : 0.42, big ? 0.84 : 0.7, -0.46, 0.42);
              neck([0, big ? 0.76 : 0.64, 0.34], [0, big ? 0.96 : 0.82, 0.52], 0.13, 0.11);
              canHead(big ? 1.02 : 0.88, 0.58, big ? 1.1 : 1.0, { muz: 0.22, ear: 0.3, earW: 0.13, brow: big ? dk : null, eye: big ? glw : null, glow: big });
              for (let i = 0; i < 2; i++) for (const sd of [-1, 1]) plate([[sd * 0.12, (big ? 1.02 : 0.88) - 0.04, 0.6], [sd * 0.34, (big ? 1.02 : 0.88) + 0.06 - i * 0.1, 0.34 - i * 0.1], [sd * 0.16, (big ? 1.02 : 0.88) - 0.08, 0.5]], 0.02, bl); // wind streamers off the cheeks
              B(6, 'tail', [0, big ? 0.72 : 0.6, -0.44]);
              for (let i = 0; i < n; i++) { const a = n === 1 ? 0 : (i / (n - 1) - 0.5) * (big ? 2.2 : 0.9); const by = big ? 0.72 : 0.6; const tp = [Math.sin(a) * 0.5, by + 0.3 + Math.cos(a) * 0.16, -0.86];
                tube([[0, by, -0.44], [Math.sin(a) * 0.24, by + 0.08, -0.66], tp], [0.07, 0.11, 0.05], bd, { cap0: 'none', cap1: 'round' }); ball(tp[0], tp[1], tp[2], 0.07, bl, { n: 2 }); }
              bone = 0;
              if (big) { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ball(Math.cos(a) * 0.17, 0.82 + Math.sin(a) * 0.1, 0.4, 0.08, '#f4f8ff', { n: 2 }); } for (const [fx, fz, fb] of [[-0.11, 0.3, 2], [0.11, 0.3, 3], [-0.11, -0.32, 4], [0.11, -0.32, 5]]) { bone = fb; ball(fx, 0.08, fz, 0.1, '#f4f8ff', { n: 2 }); } bone = 0; hover = 0.08; }
            } else if (P === 'cloudram') { // GALE single: a ram whose fleece is cloud, horns curled like a gust
              legsOf(0.46, 1, 0.16, 0.05, 0.34, -0.34, { hoof: true, haunch: false });
              torso(0.24, 0.46, 0.86, -0.46, 0.42, hexMix(bd, dk, 0.3));
              for (let i = 0; i < 16; i++) { const a = i * 2.39996, u = ((i * 0.618) % 1) * 1.4 - 0.4; const k = Math.sqrt(Math.max(0, 1 - u * u)); ball(Math.cos(a) * k * 0.26, 0.68 + u * 0.24, Math.sin(a) * k * 0.4 - 0.02, 0.15, '#f4f8ff', { n: 2 }); }
              H(0.86, 0.46); blob(-0.12, 0.7, 0.42, 0.12, 0.96, 0.72, 1, hexMix(bd, dk, 0.4)); look(0.1, 0.9, 0.62, 0.04, { brow: dk });
              for (const sd of [-1, 1]) { const pts = [], rr = []; for (let k = 0; k <= 10; k++) { const a = k / 10 * 5.2, r = 0.17 * (1 - k / 16); pts.push([sd * (0.14 + 0.025 * k), 0.9 + Math.sin(a) * r, 0.5 - Math.cos(a) * r - 0.0]); rr.push(0.06 * (1 - k / 13)); } tube(pts, rr, ac, { cap0: 'round', cap1: 'round' }); }
              ball(0, 1.0, 0.56, 0.1, '#f4f8ff', { n: 2 }); bone = 0;
              tail([[0, 0.76, -0.46], [0, 0.7, -0.56]], [0.08, 0.06], '#f4f8ff');
            } else if (P === 'glider') { // GALE single: a flying squirrel with skin sails between its legs and a flat feather tail
              legsOf(0.28, 1, 0.15, 0.05, 0.24, -0.26, {});
              torso(0.2, 0.28, 0.6, -0.36, 0.34);
              for (const sd of [-1, 1]) plate([[sd * 0.16, 0.48, 0.26], [sd * 0.58, 0.4, 0.3], [sd * 0.64, 0.34, -0.3], [sd * 0.16, 0.44, -0.28]], 0.025, bl, { edge: hexMix(bd, dk, 0.3) });
              catHead(0.68, 0.42, 1.0, { ear: 0.12, eyeR: 0.075, nose: dk });
              tail([[0, 0.42, -0.34], [0, 0.56, -0.6]], [0.08, 0.06], bd, { tip: (p) => plate([[0, 0.44, -0.36], [-0.18, 0.58, -0.62], [0, 0.72, -0.86], [0.18, 0.58, -0.62]], 0.03, bd, { edge: bl }) });
            } else if (P === 'yeti') { // FROST 3: the snow golem woke up with fur: a yeti, knuckles on the ground, ice for horns
              const fur = '#f2f6fa', fur2 = '#d8e2ec';
              for (const sd of [-1, 1]) { B(sd < 0 ? 2 : 3, 'leg', [sd * 0.38, 1.12, 0.22], { phase: sd < 0 ? 0 : Math.PI, len: 1.0 }); tube([[sd * 0.38, 1.12, 0.22], [sd * 0.46, 0.6, 0.32], [sd * 0.42, 0.14, 0.38]], [0.13, 0.11, 0.1], fur, { cap0: 'round', cap1: 'none' }); blob(sd * 0.42 - 0.11, 0, 0.3, sd * 0.42 + 0.11, 0.18, 0.5, 0.8, bd, { n: 2 });
                B(sd < 0 ? 4 : 5, 'leg', [sd * 0.22, 0.56, -0.24], { phase: sd < 0 ? Math.PI : 0, len: 0.5 }); tube([[sd * 0.22, 0.56, -0.24], [sd * 0.24, 0.28, -0.16], [sd * 0.22, 0.08, -0.2]], [0.14, 0.12, 0.11], fur, { cap0: 'round', cap1: 'none' }); blob(sd * 0.22 - 0.12, 0, -0.26, sd * 0.22 + 0.12, 0.12, 0.0, 0.7, bd, { n: 2 }); }
              bone = 0; legLen = 0.56;
              blob(-0.34, 0.46, -0.44, 0.34, 0.92, 0.04, 1, fur, { under: fur2 }); blob(-0.42, 0.7, -0.14, 0.42, 1.34, 0.42, 1, fur, { under: fur2 });
              hairs(0, 1.0, 0.1, 0.44, 0.34, 0.36, 22, 0.18, 0.05, [fur, fur2], true);
              apeHead(1.4, 0.38, 1.2, { fur, face: hexMix(bd, '#7a8aa0', 0.4), eye: glw, glow: true, extra: () => { for (const sd of [-1, 1]) curl([sd * 0.18, 1.56, 0.34], [sd * 0.6, 0.6, -0.2], 0.34, 0.06, glw, [0, 0.6, 0], { emis: true }); } });
            } else if (P === 'icewolf') { // FROST 2: the arctic kit grown into a wolf with a frozen ruff and ice down its spine
              legsOf(0.54, 1, 0.13, 0.07, 0.38, -0.38, {});
              torso(0.21, 0.52, 0.9, -0.56, 0.48);
              hairs(0, 0.86, 0.42, 0.22, 0.18, 0.12, 18, 0.18, 0.045, ['#f4f8ff', bl], true);
              for (let i = 0; i < 6; i++) cone([0, 0.88, 0.3 - i * 0.16], [0, 1, -0.3], 0.2 - i * 0.02, 0.05, glw, { emis: true });
              neck([0, 0.8, 0.42], [0, 0.98, 0.62], 0.15, 0.13);
              canHead(1.02, 0.72, 1.12, { muz: 0.3, ear: 0.2, brow: dk, eye: glw, glow: true });
              tail([[0, 0.8, -0.56], [0, 0.66, -0.84], [0, 0.6, -1.1]], [0.1, 0.13, 0.06], bd, { tip: (p) => cone(p, [0, -0.2, -1], 0.24, 0.07, glw, { emis: true }) });
            } else if (P === 'glacier') { // FROST 2: the icicle has grown into a walking glacier: a faceted berg on four pillars of ice
              const ice = hexMix(bd, '#ffffff', 0.35), ice2 = hexMix(bd, '#3a6a9a', 0.3);
              legsOf(0.36, 1, 0.32, 0.14, 0.36, -0.36, { hoof: true, haunch: false });
              blob(-0.56, 0.34, -0.64, 0.56, 1.06, 0.6, 0.75, ice, { under: ice2 });
              for (const [x, z, h, r] of [[0, -0.1, 0.7, 0.26], [-0.28, -0.36, 0.5, 0.2], [0.3, -0.3, 0.46, 0.18], [-0.2, 0.18, 0.4, 0.16], [0.24, 0.2, 0.36, 0.15], [0.04, -0.5, 0.36, 0.16]]) { cone([x, 0.9, z], [x * 0.3, 1, z * 0.2], h, r, ice); cone([x, 0.9 + h * 0.55, z], [x * 0.3, 1, z * 0.2], h * 0.45, r * 0.4, '#ffffff'); }
                            for (const pth of [[[-0.5, 0.8, 0.3], [-0.52, 0.6, 0.1], [-0.5, 0.5, -0.2]], [[0.52, 0.86, 0.2], [0.54, 0.66, -0.06], [0.52, 0.56, -0.36]]]) tube(pth, pth.map(() => 0.025), glw, { emis: true, cap0: 'round', cap1: 'round' });
              H(0.78, 0.5); blob(-0.3, 0.66, 0.54, 0.3, 0.86, 0.64, 0.5, ice2); look(0.16, 0.76, 0.6, 0.06, { glow: true, col: glw });
              for (let i = 0; i < 5; i++) cone([(i - 2) * 0.1, 0.56, 0.6], [0, -1, 0.1], 0.14 + (i % 2) * 0.06, 0.035, glw, { emis: true }); bone = 0;
            } else if (P === 'walrus') { // FROST single: a walrus: a great sack of a body, flippers, whiskers, two long tusks
              blob(-0.46, 0.08, -0.62, 0.46, 0.86, 0.48, 1, bd, { under: bl });
              for (const sd of [-1, 1]) { B(sd < 0 ? 2 : 3, 'leg', [sd * 0.38, 0.3, 0.28], { phase: sd < 0 ? 0 : Math.PI, len: 0.3 }); plate([[sd * 0.38, 0.3, 0.3], [sd * 0.62, 0.04, 0.4], [sd * 0.66, 0.02, 0.18], [sd * 0.4, 0.2, 0.18]], 0.035, hexMix(bd, dk, 0.3)); }
              B(6, 'tail', [0, 0.2, -0.6]); for (const sd of [-1, 1]) plate([[0, 0.2, -0.6], [sd * 0.34, 0.04, -0.86], [sd * 0.1, 0.06, -0.8]], 0.035, hexMix(bd, dk, 0.3)); bone = 0;
              H(0.84, 0.4); blob(-0.3, 0.62, 0.2, 0.3, 1.06, 0.58, 1, bd, { under: bl });
              for (const sd of [-1, 1]) { ball(sd * 0.1, 0.72, 0.56, 0.11, bl, { n: 2 }); cone([sd * 0.1, 0.66, 0.58], [sd * 0.05, -1, 0.2], 0.5, 0.045, '#f4ecdc'); for (let i = 0; i < 3; i++) ball(sd * (0.06 + i * 0.04), 0.74 - i * 0.02, 0.66, 0.012, dk, { n: 1 }); }
              look(0.17, 0.92, 0.46, 0.035, { brow: dk }); bone = 0; legLen = 0.3;
            } else if (P === 'tesla') { // SPARK 3: ball lightning learned to hold still: a coil tower on spindle legs, a crackling sphere for a crown
              const metal = '#3a3d48', cu = '#c87a3a';
              legsOf(0.5, 1, 0.28, 0.045, 0.28, -0.28, { haunch: false, hoof: true });
              blob(-0.36, 0.48, -0.36, 0.36, 0.72, 0.36, 0.7, metal, { under: dk });
              tube([[0, 0.7, 0], [0, 1.5, 0]], [0.13, 0.11], metal, { cap0: 'none', cap1: 'none' });
              for (let i = 0; i < 7; i++) hring(0, 0.78 + i * 0.1, 0, 0.16 - i * 0.004, 0.025, cu);
              ball(0, 1.64, 0, 0.2, glw, { emis: true, n: 3 }); hring(0, 1.64, 0, 0.28, 0.02, ac, { emis: true });
              for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; tube([[Math.cos(a) * 0.18, 1.64, Math.sin(a) * 0.18], [Math.cos(a + 0.3) * 0.34, 1.74, Math.sin(a + 0.3) * 0.34], [Math.cos(a) * 0.44, 1.6, Math.sin(a) * 0.44], [Math.cos(a + 0.3) * 0.56, 1.7, Math.sin(a + 0.3) * 0.56]], [0.02, 0.018, 0.015, 0.01], glw, { emis: true, cap0: 'round', cap1: 'round' }); }
              H(0.6, 0.3); blob(-0.24, 0.52, 0.3, 0.24, 0.68, 0.4, 0.6, '#16121e'); look(0.1, 0.6, 0.38, 0.045, { glow: true, col: glw }); bone = 0;
            } else if (P === 'lynx') { // SPARK 2: the static cat as a stocky lynx: tufted ears, a cheek ruff, a stub tail that sparks
              legsOf(0.48, 1, 0.15, 0.08, 0.34, -0.34, {});
              torso(0.23, 0.46, 0.86, -0.48, 0.46);
              for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) plate([[sd * 0.22, 0.8, 0.2 - i * 0.24], [sd * 0.24, 0.66, 0.14 - i * 0.24], [sd * 0.235, 0.68, 0.06 - i * 0.24], [sd * 0.22, 0.54, 0.0 - i * 0.24]], 0.02, ac, { emis: true });
              neck([0, 0.76, 0.4], [0, 0.9, 0.56], 0.16, 0.14);
              catHead(0.96, 0.68, 1.15, { tufts: true, ruff: true, brow: dk, ear: 0.2 });
              tail([[0, 0.78, -0.48], [0, 0.82, -0.6]], [0.08, 0.06], bd, { tip: (p) => plate([[p[0], p[1], p[2]], [p[0] + 0.02, p[1] + 0.14, p[2] - 0.04], [p[0], p[1] + 0.1, p[2] - 0.06], [p[0] + 0.02, p[1] + 0.24, p[2] - 0.12]], 0.03, ac, { emis: true }) });
            } else if (P === 'stagbeetle') { // SPARK 2: the battery beetle grown jaws: a stag beetle with crackling mandibles
              beetle(1, bd);
              bone = 1; for (const sd of [-1, 1]) { curl([sd * 0.1, 0.42, 0.5], [sd * 0.6, 0.5, 1], 0.78, 0.07, ac, [-sd * 1.1, -0.2, 0]); for (let i = 0; i < 2; i++) cone([sd * (0.3 - i * 0.08), 0.5, 0.78 + i * 0.1], [-sd, 0.3, 0.2], 0.1, 0.025, ac); cone([sd * 0.22, 0.52, 0.76], [-sd * 0.4, 0.6, 0.3], 0.12, 0.025, glw, { emis: true }); } bone = 0;
            } else if (P === 'hercules') { // SPARK 3: a hercules beetle the size of a cart: a great horn arching over a smaller one
              const hc = '#e2b84a'; beetle(1.35, hexMix('#2a2430', bd, 0.2));
              curl([0, 0.86, 0.3], [0, 0.4, 1], 1.4, 0.13, hc, [0, -0.7, 0]); for (let i = 0; i < 5; i++) cone([0, 1.02 - i * 0.04, 0.62 + i * 0.18], [0, -1, 0.1], 0.1, 0.03, hc);
              bone = 1; curl([0, 0.66, 0.74], [0, 1, 0.5], 0.56, 0.08, hc, [0, 0, 0.6]); bone = 0;
              for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) ball(sd * 0.3, 0.7, -0.1 - i * 0.22, 0.05, glw, { emis: true, n: 1 });
            } else if (P === 'hare') { // SPARK single: a jackrabbit with lightning in its ears and a cotton tail
              legsOf(0.3, 1, 0.12, 0.05, 0.26, -0.24, {});
              for (const sd of [-1, 1]) blob(sd * 0.14 - 0.12, 0.14, -0.46, sd * 0.14 + 0.12, 0.6, -0.08, 1, bd, { under: bl });
              torso(0.18, 0.3, 0.68, -0.38, 0.32);
              catHead(0.78, 0.46, 1.0, { ear: 0.44, earW: 0.08, eyeR: 0.06, extra: () => { for (const sd of [-1, 1]) plate([[sd * 0.17, 1.2, 0.4], [sd * 0.24, 1.32, 0.38], [sd * 0.18, 1.28, 0.38], [sd * 0.26, 1.42, 0.36]], 0.025, ac, { emis: true }); } });
              tail([[0, 0.46, -0.44], [0, 0.5, -0.5]], [0.04, 0.03], bd, { tip: (p) => ball(p[0], p[1], p[2], 0.11, '#f4f8ff', { n: 2 }) });
            } else if (P === 'eclipsecat') { // VOID 2: the shadow kitten as a long night cat, a crescent moon riding its back
              legsOf(0.52, 1, 0.12, 0.06, 0.36, -0.36, {});
              torso(0.17, 0.5, 0.8, -0.54, 0.46);
              const moon = []; for (let i = 0; i <= 8; i++) { const a = -0.4 + i / 8 * 2.6; moon.push([0, 0.86 + Math.sin(a) * 0.3, -0.06 + Math.cos(a) * 0.3]); } tube(moon, moon.map((_, i) => 0.012 + 0.05 * Math.sin(i / 8 * Math.PI)), '#f2ecff', { emis: true, cap0: 'round', cap1: 'round' });
              for (let i = 0; i < 9; i++) { const a = i * 2.3; ball(Math.cos(a) * 0.17, 0.64 + Math.sin(i) * 0.1, -0.4 + i * 0.09, 0.016, '#ffffff', { emis: true, n: 1 }); }
              neck([0, 0.72, 0.38], [0, 0.88, 0.56], 0.12, 0.11);
              catHead(0.94, 0.64, 1.0, { ear: 0.24, earW: 0.11, eye: glw, glow: true, brow: dk });
              tail([[0, 0.72, -0.52], [0, 0.6, -0.86], [0, 0.9, -1.16], [0.1, 1.16, -1.1]], [0.05, 0.045, 0.035, 0.02], bd);
            } else if (P === 'tarhound') { // VOID 2: the ink drop grown legs: a hound of tar, dripping, glossy, eyes like lamps
              legsOf(0.46, 1, 0.14, 0.07, 0.34, -0.34, {});
              torso(0.2, 0.44, 0.82, -0.5, 0.44, dk, hexMix(dk, bd, 0.3));
              for (let i = 0; i < 8; i++) { const x = ((i * 37) % 10) / 10 * 0.32 - 0.16, z = 0.36 - i * 0.1; tube([[x, 0.48, z], [x, 0.36, z], [x, 0.3 + (i % 3) * 0.04, z]], [0.03, 0.025, 0.012], dk, { cap0: 'none', cap1: 'none' }); ball(x, 0.28 + (i % 3) * 0.04, z, 0.03, dk, { n: 1 }); }
              for (const [x, y, z] of [[0.08, 0.8, 0.2], [-0.1, 0.78, -0.12]]) ball(x, y, z, 0.04, '#ffffff', { emis: true, n: 1 });
              neck([0, 0.72, 0.38], [0, 0.88, 0.56], 0.15, 0.13, dk);
              canHead(0.94, 0.66, 1.1, { c: dk, muzC: hexMix(dk, bd, 0.3), muz: 0.26, ear: 0.18, eye: ac, glow: true, brow: null });
              tail([[0, 0.7, -0.5], [0, 0.56, -0.74], [0, 0.4, -0.86]], [0.08, 0.06, 0.03], dk);
            } else if (P === 'abyssmaw') { // VOID 3: the hound is gone into its own hunger: a walking mouth with a crown of eyes
              legsOf(0.3, 1, 0.34, 0.13, 0.3, -0.3, { haunch: false });
              blob(-0.62, 0.28, -0.6, 0.62, 1.4, 0.58, 1, dk, { under: hexMix(dk, bd, 0.4) });
              H(0.8, 0.3); blob(-0.4, 0.5, 0.42, 0.4, 1.06, 0.62, 1, '#0a0810');
              for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; cone([Math.cos(a) * 0.38, 0.78 + Math.sin(a) * 0.26, 0.56], [-Math.cos(a), -Math.sin(a), 0.4], 0.14, 0.04, '#f4f0e6'); }
              for (const [x, y, z, r] of [[0, 1.36, 0.2, 0.08], [-0.24, 1.3, 0.18, 0.06], [0.24, 1.3, 0.18, 0.06], [-0.4, 1.18, 0.2, 0.05], [0.4, 1.18, 0.2, 0.05], [-0.12, 1.42, 0.0, 0.045], [0.12, 1.42, 0.0, 0.045]]) { ball(x, y, z, r, '#16121e', { n: 2 }); ball(x, y, z + r * 0.6, r * 0.6, ac, { emis: true, n: 2 }); }
              bone = 0;
              for (let i = 0; i < 4; i++) { const a = -0.8 + i * 0.5; tube([[Math.sin(a) * 0.5, 1.2, -0.3], [Math.sin(a) * 0.8, 1.5, -0.5], [Math.sin(a) * 0.7, 1.7, -0.8]], [0.06, 0.04, 0.01], dk, { cap0: 'none', cap1: 'round' }); }
            } else if (P === 'jackal') { // VOID 2: the shade fox as a tall black jackal with gold at its throat and ears
              const gold = '#e2b84a';
              legsOf(0.58, 1, 0.11, 0.05, 0.32, -0.32, {});
              torso(0.16, 0.56, 0.84, -0.44, 0.4);
              neck([0, 0.76, 0.34], [0, 1.04, 0.5], 0.11, 0.09);
              hring(0, 0.86, 0.4, 0.13, 0.03, gold);
              canHead(1.1, 0.56, 1.0, { muz: 0.3, ear: 0.42, earW: 0.1, w: 0.85, brow: dk, eye: gold, glow: true, extra: () => { for (const sd of [-1, 1]) ball(sd * 0.1, 1.24, 0.5, 0.025, gold, { n: 1 }); } });
              tail([[0, 0.76, -0.44], [0, 0.6, -0.62], [0, 0.44, -0.66]], [0.06, 0.07, 0.03], bd);
            } else if (P === 'hart' || P === 'unicorn') { // LIGHT: the fawn grows into a white hart with antlers of light; the unicorn is its rare cousin
              const uni = P === 'unicorn', leg = uni ? 0.74 : 0.66;
              legsOf(leg, 1, 0.14, uni ? 0.07 : 0.055, 0.36, -0.38, { hoof: true });
              torso(uni ? 0.24 : 0.19, leg - 0.02, leg + (uni ? 0.42 : 0.32), -0.54, 0.46);
              neck([0, leg + 0.28, 0.38], [0, leg + 0.7, 0.6], uni ? 0.17 : 0.13, uni ? 0.13 : 0.1);
              deerHead(leg + 0.74, 0.66, uni ? 1.2 : 1.0, { muz: uni ? 0.36 : 0.3, eye: glw, extra: uni ? () => { const pts = [], rr = []; for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push([Math.cos(u * 12) * 0.012, leg + 0.86 + u * 0.4, 0.72 + u * 0.2]); rr.push(0.045 * (1 - u * 0.95)); } tube(pts, rr, '#fff3b0', { emis: true, cap0: 'flat', cap1: 'none' }); } : () => {
                for (const sd of [-1, 1]) { const b = [sd * 0.07, leg + 0.84, 0.62], m = [sd * 0.24, leg + 1.1, 0.52], tp = [sd * 0.3, leg + 1.36, 0.44]; tube([b, m, tp], [0.025, 0.02, 0.012], '#fff3b0', { emis: true, cap0: 'round', cap1: 'round' });
                  for (const [p, d] of [[m, [sd * 0.2, 1, 0.5]], [m, [sd * 0.8, 0.6, -0.3]], [[(b[0] + m[0]) / 2, (b[1] + m[1]) / 2, (b[2] + m[2]) / 2], [0, 1, 0.6]], [tp, [sd * 0.5, 0.8, 0.2]]]) cone(p, d, 0.18, 0.016, '#fff3b0', { emis: true }); } } });
              if (uni) { for (let i = 0; i < 7; i++) { const u = i / 6; plate([[0, leg + 0.38 + u * 0.36, 0.34 + u * 0.24], [-0.06, leg + 0.42 + u * 0.36, 0.2 + u * 0.24], [0.06, leg + 0.3 + u * 0.36, 0.18 + u * 0.24]], 0.025, i % 2 ? '#f4a3d2' : '#a0d8ff'); }
                tail([[0, leg + 0.34, -0.54], [0, leg + 0.2, -0.76], [0, leg - 0.1, -0.86]], [0.07, 0.12, 0.05], '#f4a3d2'); }
              else { for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.4; cone([Math.sin(a) * 0.1, leg + 0.32, 0.46], [Math.sin(a), -0.6, 0.6], 0.16, 0.035, '#fff6d0'); }
                tail([[0, leg + 0.24, -0.54], [0, leg + 0.3, -0.62]], [0.05, 0.04], bd, { tip: (p) => ball(p[0], p[1], p[2], 0.07, '#fff3b0', { emis: true, n: 2 }) }); }
            } else if (P === 'ignivar') { // LEGEND, FLAME: a four-legged fire dragon: lava between its scales, a crown of horns, wings that burn
              const R = hexMix(bd, '#6a1a10', 0.5), lava = '#ffa23a', hot = '#ffd25a';
              legsOf(0.6, 1, 0.24, 0.11, 0.46, -0.5, {}); for (const [fx, fz, fb] of [[-0.24, 0.46, 2], [0.24, 0.46, 3], [-0.24, -0.5, 4], [0.24, -0.5, 5]]) { bone = fb; for (let i = 0; i < 3; i++) cone([fx + (i - 1) * 0.06, 0.06, fz + 0.12], [0, -0.3, 1], 0.12, 0.03, '#2a1a14'); bone = 0; }
              torso(0.32, 0.58, 1.2, -0.72, 0.62, R, '#3a1a14'); for (let i = 0; i < 6; i++) blob(-0.22, 0.56, 0.44 - i * 0.2 - 0.08, 0.22, 0.66, 0.44 - i * 0.2 + 0.08, 0.6, '#e8a03a', { n: 2 });
              for (const pth of [[[-0.3, 1.0, 0.3], [-0.32, 0.8, 0.0], [-0.3, 0.9, -0.3]], [[0.3, 1.02, 0.2], [0.32, 0.84, -0.1], [0.3, 0.96, -0.44]], [[0, 1.2, -0.2], [0.1, 1.18, -0.5]]]) tube(pth, pth.map(() => 0.025), lava, { emis: true, cap0: 'round', cap1: 'round' });
              neck([0, 1.0, 0.5], [0, 1.6, 0.98], 0.24, 0.16, R); for (let i = 0; i < 5; i++) cone([0, 1.1 + i * 0.12, 0.54 + i * 0.1], [0, 1, -0.6], 0.22, 0.05, '#2a1a14');
              lizHead(1.66, 1.12, 1.6, { horns: true, hornC: '#2a1a14', frill: 0.32, brow: '#2a1a14', glow: true, eye: hot, extra: () => { for (let i = 0; i < 5; i++) cone([(i - 2) * 0.08, 1.82, 1.0 - Math.abs(i - 2) * 0.05], [(i - 2) * 0.3, 1, -0.6], 0.26, 0.04, '#2a1a14'); ball(0, 1.56, 1.5, 0.08, hot, { emis: true, n: 2 }); for (let i = 0; i < 5; i++) cone([(i - 2) * 0.07, 1.58, 1.46], [0, -1, 0.2], 0.08, 0.02, '#f4f0e6'); } });
              for (let i = 0; i < 8; i++) cone([0, 1.18 - i * 0.03, 0.3 - i * 0.16], [0, 1, -0.5], 0.3 - i * 0.02, 0.07, i % 2 ? lava : hot, { emis: true });
              wings(0.3, 1.14, 0.1, 1.5, { col: hexMix(lava, R, 0.4), fold: -0.4 }); for (const sd of [-1, 1]) { bone = sd < 0 ? 7 : 8; for (let i = 0; i < 5; i++) cone([sd * (0.6 + i * 0.22), 1.4 + i * 0.06, -0.1 - i * 0.05], [sd * 0.3, 1, -0.3], 0.24, 0.05, i % 2 ? lava : hot, { emis: true }); bone = 0; }
              tail([[0, 0.96, -0.7], [0.2, 0.8, -1.2], [-0.1, 0.6, -1.7], [0.1, 0.56, -2.1]], [0.2, 0.15, 0.09, 0.03], R, { tip: (p) => { for (let i = 0; i < 4; i++) cone(p, [(i - 1.5) * 0.4, 1, -0.5], 0.32, 0.07, i % 2 ? lava : hot, { emis: true }); } });
            } else if (P === 'tidekirin') { // LEGEND, TIDE: a kirin of the sea: a horse-deer with a mane of breaking waves, a coral horn, fins at its fetlocks, ripples where it steps
              const sea = hexMix(bd, '#2a7ac8', 0.4), foam = '#eaf8ff', coral = '#ff8a8a';
              legsOf(0.82, 1, 0.15, 0.065, 0.42, -0.44, { hoof: true }); for (const [fx, fz, fb] of [[-0.15, 0.42, 2], [0.15, 0.42, 3], [-0.15, -0.44, 4], [0.15, -0.44, 5]]) { bone = fb; hring(fx, 0.02, fz, 0.18, 0.015, foam, { emis: true }); hring(fx, 0.02, fz, 0.3, 0.01, foam, { emis: true }); for (const sd of [-1, 1]) plate([[fx, 0.34, fz], [fx + sd * 0.14, 0.42, fz - 0.14], [fx + sd * 0.04, 0.22, fz - 0.1]], 0.015, foam); bone = 0; }
              torso(0.24, 0.8, 1.26, -0.62, 0.52, sea, foam); for (let i = 0; i < 8; i++) { const z = 0.4 - i * 0.14; for (const sd of [-1, 1]) blob(sd * 0.22 - 0.05, 1.0, z - 0.06, sd * 0.22 + 0.05, 1.12, z + 0.06, 0.5, hexMix(sea, foam, 0.3), { n: 1 }); }
              neck([0, 1.16, 0.42], [0, 1.68, 0.7], 0.17, 0.12, sea);
              for (let i = 0; i < 9; i++) { const u = i / 8; curl([0, 1.2 + u * 0.5, 0.36 + u * 0.3], [0, 0.6, -1], 0.36 - u * 0.1, 0.05, i % 2 ? foam : hexMix(sea, foam, 0.5), [0, 0.8, 0.8]); } // a mane of waves curling over
              deerHead(1.74, 0.76, 1.2, { c: sea, muz: 0.34, eye: '#7ae8ff', glow: true, brow: hexMix(sea, '#0a1a3a', 0.5), extra: () => { const b = [0, 1.96, 0.74]; tube([b, [0, 2.2, 0.82], [0, 2.4, 0.78]], [0.04, 0.03, 0.015], coral, { cap0: 'round', cap1: 'round' }); for (const [y, sd] of [[2.12, 1], [2.24, -1], [2.32, 1]]) tube([[0, y, 0.8], [sd * 0.12, y + 0.1, 0.78]], [0.02, 0.008], coral, { cap0: 'round', cap1: 'round' }); for (const sd of [-1, 1]) tube([[sd * 0.06, 1.68, 1.1], [sd * 0.3, 1.6, 1.12], [sd * 0.46, 1.44, 1.0]], [0.012, 0.01, 0.006], foam, { cap0: 'none', cap1: 'none' }); } });
              const tp = []; for (let i = 0; i <= 8; i++) { const u = i / 8; tp.push([Math.sin(u * 5) * 0.12, 1.1 - u * 0.4 + Math.sin(u * 6) * 0.06, -0.62 - u * 0.7]); } B(6, 'tail', tp[0]); for (let k = 0; k < 3; k++) tube(tp.map((p) => [p[0] + (k - 1) * 0.05, p[1] + (k - 1) * 0.04, p[2]]), tp.map((_, i) => 0.05 * (1 - i / 9)), k === 1 ? foam : sea, { cap0: 'none', cap1: 'round', emis: k === 1 }); bone = 0;
              for (let i = 0; i < 8; i++) { const a = i * 0.8; ball(Math.cos(a) * 0.8, 1.2 + (i % 3) * 0.3, Math.sin(a) * 0.9, 0.04, foam, { emis: true, n: 1 }); }
            } else if (P === 'worldstag') { // LEGEND, BLOOM: a stag whose antlers have grown into a whole tree, in fruit, with a bird nesting in it; flowers along its back, vines up its legs
              const bark = '#6b4a2e', leaf = hexMix('#3f8a3a', ac, 0.3), fruit = '#ffd25a';
              legsOf(0.92, 1, 0.16, 0.07, 0.42, -0.46, { hoof: true }); for (const [fx, fz, fb] of [[-0.16, 0.42, 2], [0.16, 0.42, 3], [-0.16, -0.46, 4], [0.16, -0.46, 5]]) { bone = fb; tube([[fx + 0.05, 0.1, fz], [fx - 0.06, 0.34, fz + 0.04], [fx + 0.06, 0.6, fz], [fx - 0.04, 0.84, fz + 0.02]], [0.018, 0.018, 0.018, 0.014], '#3f6b2a', { cap0: 'round', cap1: 'round' }); bone = 0; }
              torso(0.27, 0.9, 1.4, -0.62, 0.52); for (let i = 0; i < 9; i++) { const z = 0.36 - i * 0.12, x = (i % 2 ? 0.08 : -0.08); ball(x, 1.38, z, 0.07, leaf, { n: 2 }); for (let p = 0; p < 5; p++) { const q = p / 5 * Math.PI * 2; ball(x + Math.cos(q) * 0.05, 1.46, z + Math.sin(q) * 0.05, 0.03, i % 3 ? '#f4a3d2' : '#fff6e0', { n: 1 }); } }
              neck([0, 1.26, 0.44], [0, 1.76, 0.66], 0.17, 0.12); deerHead(1.82, 0.72, 1.15, { muz: 0.3, eye: '#ffe08a', brow: bark, extra: () => {
                for (const sd of [-1, 1]) { const b = [sd * 0.08, 2.0, 0.66], m = [sd * 0.34, 2.4, 0.52], tp2 = [sd * 0.5, 2.86, 0.4]; tube([b, m, tp2], [0.05, 0.04, 0.03], bark, { cap0: 'round', cap1: 'round' }); for (const [p, d, l] of [[m, [sd, 0.6, -0.3], 0.4], [m, [sd * 0.2, 1, 0.5], 0.36], [[(b[0] + m[0]) / 2, (b[1] + m[1]) / 2, (b[2] + m[2]) / 2], [sd, 0.3, 0.4], 0.3], [tp2, [sd * 0.3, 1, -0.2], 0.3]]) tube([p, [p[0] + d[0] * l, p[1] + d[1] * l, p[2] + d[2] * l]], [0.03, 0.012], bark, { cap0: 'round', cap1: 'round' }); }
                for (const [x, y, z, r] of [[0, 3.0, 0.4, 0.42], [-0.5, 2.82, 0.44, 0.34], [0.5, 2.84, 0.4, 0.34], [-0.26, 3.2, 0.2, 0.3], [0.28, 3.18, 0.3, 0.3], [0, 2.7, 0.7, 0.26], [-0.7, 2.6, 0.3, 0.24], [0.72, 2.6, 0.28, 0.24]]) ball(x, y, z, r, leaf, { n: 3 });
                for (let i = 0; i < 9; i++) { const a = i * 0.7; ball(Math.cos(a) * 0.6, 2.7 + (i % 3) * 0.2, 0.4 + Math.sin(a) * 0.4, 0.06, fruit, { emis: true, n: 2 }); }
                ball(0.3, 3.34, 0.36, 0.08, '#c8503a', { n: 2 }); cone([0.3, 3.34, 0.44], [0, 0, 1], 0.06, 0.02, '#e8a03a'); } }); // a little bird in the crown
              tail([[0, 1.3, -0.62], [0, 1.36, -0.7]], [0.06, 0.04], bd, { tip: (p) => ball(p[0], p[1], p[2], 0.08, leaf, { n: 2 }) });
            } else if (P === 'runemammoth') { // LEGEND, STONE: a mammoth carved of standing stone, runes glowing down its flanks, tusks of crystal, moss and boulders on its back
              const R = hexMix(bd, '#7a7470', 0.5), R2 = hexMix(R, '#2a2624', 0.4), cr = '#9ae8ff';
              legsOf(0.74, 1, 0.34, 0.19, 0.5, -0.54, { hoof: true, haunch: false });
              blob(-0.56, 0.68, -0.86, 0.56, 1.74, 0.7, 0.75, R, { under: R2 }); blob(-0.5, 1.4, -0.3, 0.5, 1.96, 0.5, 0.8, R, { under: R2 });
              for (const sd of [-1, 1]) for (const pth of [[[sd * 0.56, 1.5, 0.3], [sd * 0.57, 1.3, 0.3], [sd * 0.57, 1.3, 0.1]], [[sd * 0.57, 1.2, -0.1], [sd * 0.57, 1.0, -0.2], [sd * 0.57, 1.2, -0.3]], [[sd * 0.56, 1.5, -0.5], [sd * 0.56, 1.1, -0.5]], [[sd * 0.56, 1.36, -0.4], [sd * 0.56, 1.36, -0.62]]]) tube(pth, pth.map(() => 0.025), cr, { emis: true, cap0: 'round', cap1: 'round' });
              for (const [x, z, r] of [[0.2, -0.3, 0.24], [-0.24, -0.5, 0.2], [0.0, 0.0, 0.18]]) blob(x - r, 1.84, z - r, x + r, 1.84 + r * 1.2, z + r, 0.4, R2, { n: 2 }); for (let i = 0; i < 6; i++) ball(Math.cos(i * 1.7) * 0.36, 1.86, -0.3 + Math.sin(i * 1.7) * 0.4, 0.12, '#5f8a3a', { n: 2 });
              H(1.5, 0.7); blob(-0.38, 1.16, 0.46, 0.38, 1.96, 0.96, 0.8, R, { under: R2 });
              for (const sd of [-1, 1]) { blob(sd > 0 ? 0.3 : -0.78, 1.16, 0.44, sd > 0 ? 0.78 : -0.3, 1.86, 0.58, 1, R2, { n: 2 }); tube([[sd * 0.62, 1.74, 0.59], [sd * 0.7, 1.5, 0.59], [sd * 0.6, 1.3, 0.58]], [0.015, 0.015, 0.015], cr, { emis: true, cap0: 'round', cap1: 'round' }); }
              const tr = []; for (let i = 0; i <= 8; i++) { const u = i / 8; tr.push([0, 1.34 - u * 1.0 + (u > 0.75 ? (u - 0.75) * 1.4 : 0), 0.96 + u * 0.24 - (u > 0.75 ? (u - 0.75) * 0.8 : 0)]); } tube(tr, tr.map((_, i) => 0.13 * (1 - i / 12)), R, { cap0: 'none', cap1: 'round', shade: (p, nx, ny, nz, t) => U.hexToRgb(Math.floor(t * 16) % 2 ? R2 : R) });
              for (const sd of [-1, 1]) { const pts = [], rr = []; for (let i = 0; i <= 10; i++) { const u = i / 10, q = u * Math.PI * 0.95; pts.push([sd * (0.22 + u * 0.2 - u * u * 0.14), 1.3 - Math.sin(q) * 0.52 + u * 0.1, 0.9 + Math.sin(q * 0.75) * 0.6]); rr.push(0.085 * (1 - u * 0.85)); } tube(pts, rr, cr, { emis: true, cap0: 'flat', cap1: 'round' }); } // tusks that sweep down, out and up again
              look(0.3, 1.62, 0.86, 0.06, { brow: R2, col: cr, glow: true }); bone = 0;
              tail([[0, 1.5, -0.86], [0, 1.24, -1.0]], [0.06, 0.04], R, { tip: (p) => cone(p, [0, -1, -0.2], 0.16, 0.06, R2) });
            } else if (P === 'stormgriffin') { // LEGEND, GALE: a griffin: the head, chest, wings and fore-talons of a storm eagle, the hindquarters of a lion
              const white = '#f6f8fa', gold = hexMix(bd, '#c8a060', 0.5), beakC = '#e8c23a', cloud = '#e8eef6';
              legsOf(0.66, 1, 0.18, 0.09, 0.42, -0.5, {}); for (const [fx, fz, fb] of [[-0.18, 0.42, 2], [0.18, 0.42, 3]]) { bone = fb; for (const a of [-0.5, 0, 0.5]) tube([[fx, 0.1, fz], [fx + a * 0.12, 0.03, fz + 0.2]], [0.035, 0.02], beakC, { cap0: 'round', cap1: 'round' }); for (const a of [-0.5, 0, 0.5]) cone([fx + a * 0.12, 0.03, fz + 0.2], [0, -0.4, 1], 0.08, 0.02, '#2a2420'); bone = 0; }
              torso(0.28, 0.66, 1.22, -0.66, 0.5, gold, hexMix(gold, '#ffffff', 0.4)); hairs(0, 1.1, 0.46, 0.28, 0.24, 0.2, 26, 0.18, 0.05, [white, '#e8ecf0'], true);
              neck([0, 1.14, 0.44], [0, 1.6, 0.66], 0.2, 0.15, white); H(1.66, 0.6); ball(0, 1.74, 0.7, 0.22, white, { n: 3 }); blob(-0.07, 1.62, 0.84, 0.07, 1.78, 1.04, 0.7, beakC, { tap: [1, 0.7] }); curl([0, 1.74, 1.02], [0, -0.3, 1], 0.12, 0.05, beakC, [0, -1.6, 0]);
              look(0.13, 1.8, 0.84, 0.05, { brow: '#c8ccd4', col: '#ffcf5a' }); for (let i = 0; i < 6; i++) curl([(i - 2.5) * 0.04, 1.9, 0.62 - i * 0.03], [(i - 2.5) * 0.4, 1, -1], 0.4, 0.03, i % 2 ? white : '#7ac8ff', [0, -0.4, -0.6]); bone = 0;
              for (const sd of [-1, 1]) { B(sd < 0 ? 7 : 8, 'wing', [sd * 0.24, 1.2, 0.2], { side: sd, fold: -0.3 }); for (let i = 0; i < 9; i++) { const u = i / 8, b0 = [sd * (0.24 + u * 0.7), 1.24 + u * 0.7, 0.2 - u * 0.2], len = 0.5 + u * 0.4; plate([[b0[0] - sd * 0.06, b0[1], b0[2]], [b0[0] + sd * 0.2 * u, b0[1] - len, b0[2] - 0.3], [b0[0] + sd * (0.1 + 0.2 * u), b0[1] - len * 0.9, b0[2] - 0.28], [b0[0] + sd * 0.06, b0[1], b0[2]]], 0.015, i % 2 ? white : gold); } tube([[sd * 0.24, 1.2, 0.2], [sd * 0.6, 1.6, 0.1], [sd * 0.94, 1.94, 0.0]], [0.06, 0.05, 0.04], white, { cap0: 'round', cap1: 'round' }); plate([[sd * 0.24, 1.22, 0.16], [sd * 0.94, 1.94, -0.02], [sd * 1.1, 1.1, -0.3], [sd * 0.7, 0.86, -0.3], [sd * 0.3, 0.84, -0.2]], 0.02, gold); for (let i = 0; i < 3; i++) ball(sd * (0.9 + i * 0.12), 1.96 + (i % 2) * 0.08, -0.1, 0.12 - i * 0.02, cloud, { n: 2 }); bone = 0; }
              tail([[0, 1.1, -0.66], [0, 0.8, -0.96], [0, 0.76, -1.3]], [0.05, 0.04, 0.035], gold, { tip: (p) => { for (let i = 0; i < 5; i++) cone(p, [(i - 2) * 0.3, 0.2, -1], 0.3, 0.05, i % 2 ? white : '#7ac8ff'); } });
            } else if (P === 'aurorasabre') { // LEGEND, FROST: a sabretooth of ice: fangs of crystal down to its chest, the aurora rippling down its stripes, a crown of frost
              const white = '#eef6ff', aur = ['#7ae8c8', '#7ab8f8', '#b88af8', '#f88ad8'], ice = '#9ad8ff';
              legsOf(0.62, 1, 0.2, 0.11, 0.44, -0.46, {}); torso(0.3, 0.58, 1.14, -0.62, 0.56, white, '#d8e8f4');
              for (let i = 0; i < 6; i++) for (const sd of [-1, 1]) { const z = 0.36 - i * 0.18; tube([[sd * 0.24, 1.08, z], [sd * 0.31, 0.88, z - 0.04], [sd * 0.29, 0.7, z - 0.02]], [0.03, 0.03, 0.02], aur[i % 4], { emis: true, cap0: 'round', cap1: 'round' }); }
              hairs(0, 1.0, 0.5, 0.3, 0.22, 0.18, 20, 0.2, 0.05, [white, ice], true);
              neck([0, 1.0, 0.5], [0, 1.2, 0.68], 0.22, 0.2, white);
              catHead(1.3, 0.82, 1.5, { c: white, brow: '#a8c0d8', eye: ice, glow: true, ear: 0.12, extra: () => { for (const sd of [-1, 1]) cone([sd * 0.07, 1.16, 1.02], [sd * 0.05, -1, 0.15], 0.46, 0.05, ice, { emis: true, segs: 6 }); for (let i = 0; i < 7; i++) cone([(i - 3) * 0.07, 1.52, 0.76 - Math.abs(i - 3) * 0.04], [(i - 3) * 0.2, 1, -0.3], 0.18 + (i === 3) * 0.14, 0.035, ice, { emis: true, segs: 4 }); } });
              tail([[0, 1.0, -0.62], [0, 0.9, -0.8]], [0.07, 0.05], white, { tip: (p) => cone(p, [0, 0.4, -1], 0.24, 0.06, ice, { emis: true, segs: 4 }) });
              for (let i = 0; i < 6; i++) { const a = i * 1.05; ball(Math.cos(a) * 0.8, 1.0 + (i % 3) * 0.3, Math.sin(a) * 0.8, 0.035, '#ffffff', { emis: true, n: 1 }); }
            } else if (P === 'raiju') { // LEGEND, SPARK: the thunder beast: a wolf of storm, a cloud for a mane split by lightning, its paws throwing sparks, a tail of forked bolts
              const storm = hexMix(bd, '#3a3e58', 0.6), cloud = '#5a6078', bolt = '#ffe45a';
              legsOf(0.62, 1, 0.16, 0.08, 0.42, -0.44, {}); for (const [fx, fz, fb] of [[-0.16, 0.42, 2], [0.16, 0.42, 3], [-0.16, -0.44, 4], [0.16, -0.44, 5]]) { bone = fb; for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; tube([[fx, 0.06, fz], [fx + Math.cos(a) * 0.12, 0.1, fz + Math.sin(a) * 0.12], [fx + Math.cos(a + 0.4) * 0.2, 0.04, fz + Math.sin(a + 0.4) * 0.2]], [0.012, 0.01, 0.006], bolt, { emis: true, cap0: 'round', cap1: 'round' }); } bone = 0; }
              torso(0.24, 0.62, 1.06, -0.58, 0.5, storm, hexMix(storm, '#ffffff', 0.2));
              for (let i = 0; i < 12; i++) { const u = i / 11; ball((i % 2 ? 0.1 : -0.1), 1.06 + Math.sin(u * Math.PI) * 0.3 + (i % 3) * 0.04, 0.6 - u * 1.0, 0.2 - u * 0.06, i % 3 ? cloud : '#6a7088', { n: 2 }); }
              for (let i = 0; i < 4; i++) { const z = 0.5 - i * 0.28; plate([[0, 1.3, z], [0.06, 1.12, z - 0.06], [0.02, 1.14, z - 0.08], [0.08, 0.92, z - 0.16]], 0.02, bolt, { emis: true }); }
              neck([0, 0.96, 0.44], [0, 1.18, 0.64], 0.16, 0.14, storm);
              canHead(1.24, 0.72, 1.3, { c: storm, muzC: hexMix(storm, '#ffffff', 0.2), muz: 0.26, ear: 0.3, eye: bolt, glow: true, brow: '#1a1e2a', extra: () => { for (const sd of [-1, 1]) plate([[sd * 0.12, 1.4, 0.64], [sd * 0.22, 1.56, 0.62], [sd * 0.14, 1.54, 0.62], [sd * 0.26, 1.74, 0.58]], 0.02, bolt, { emis: true }); } });
              B(6, 'tail', [0, 0.96, -0.58]); for (let k = 0; k < 3; k++) { const a = (k - 1) * 0.5; tube([[0, 0.96, -0.58], [Math.sin(a) * 0.16, 1.16, -0.74], [Math.sin(a) * 0.08, 1.1, -0.86], [Math.sin(a) * 0.3, 1.36, -1.04]], [0.04, 0.035, 0.03, 0.01], bolt, { emis: true, cap0: 'none', cap1: 'round' }); } bone = 0;
            } else if (P === 'chimera') { // LEGEND, VOID: the eclipse chimera: a lion of shadow, a goat's head rising from its back, a serpent for a tail, small bat wings
              const black = hexMix(bd, '#1a1620', 0.6), glow2 = glw;
              legsOf(0.6, 1, 0.2, 0.1, 0.44, -0.48, {}); torso(0.3, 0.58, 1.12, -0.62, 0.54, black, hexMix(black, ac, 0.2));
              neck([0, 1.0, 0.46], [0, 1.2, 0.66], 0.22, 0.2, black);
              for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; cone([Math.cos(a) * 0.24, 1.3 + Math.sin(a) * 0.24, 0.66], [Math.cos(a), Math.sin(a), -0.5], 0.36, 0.08, i % 2 ? ac : hexMix(black, ac, 0.4), { emis: i % 2 === 1 }); }
              catHead(1.3, 0.84, 1.4, { c: black, brow: '#0a0810', eye: glow2, glow: true, ear: 0.1, extra: () => { for (const sd of [-1, 1]) cone([sd * 0.07, 1.16, 1.04], [0, -1, 0.1], 0.14, 0.025, '#f4f0e6'); } });
              const gb = [0.12, 1.12, -0.1]; tube([gb, [0.16, 1.42, 0.0], [0.16, 1.6, 0.06]], [0.1, 0.08, 0.07], hexMix(black, '#3a3440', 0.5), { cap0: 'none', cap1: 'round' }); // the goat rises from its back
              blob(0.06, 1.52, -0.02, 0.26, 1.72, 0.28, 1, hexMix(black, '#3a3440', 0.5)); for (const sd of [-1, 1]) { const pts = []; for (let j = 0; j <= 10; j++) { const q = j / 10 * 4.6, r = 0.14 * (1 - j / 14); pts.push([0.16 + sd * (0.06 + j * 0.02), 1.7 + Math.sin(q) * r, 0.08 - Math.cos(q) * r]); } tube(pts, pts.map((_, j) => 0.04 * (1 - j / 12)), '#c8c0b0', { cap0: 'round', cap1: 'round' }); }
              for (const sd of [-1, 1]) { blob(0.16 + sd * 0.06 - 0.03, 1.64, 0.22, 0.16 + sd * 0.06 + 0.03, 1.68, 0.27, 0.6, glow2, { emis: true, n: 1 }); } tube([[0.12, 1.5, 0.22], [0.16, 1.4, 0.26], [0.2, 1.5, 0.22]], [0.015, 0.015, 0.015], '#c8c0b0', { cap0: 'round', cap1: 'round' });
              wings(0.26, 1.08, 0.0, 0.7, { col: hexMix(black, ac, 0.3), fold: -0.6 });
              const tp = []; for (let i = 0; i <= 10; i++) { const u = i / 10; tp.push([Math.sin(u * 5) * 0.16, 1.0 + Math.sin(u * 3.2) * 0.4, -0.62 - u * 0.8]); } B(6, 'tail', tp[0]); tube(tp, tp.map((_, i) => 0.08 * (1 - i * 0.04)), hexMix(black, '#2a5a3a', 0.5), { cap0: 'none', cap1: 'none', shade: (p, nx, ny, nz, t) => U.hexToRgb(Math.floor(t * 12) % 2 ? hexMix(black, '#2a5a3a', 0.5) : ac) });
              const sh = tp[10]; blob(sh[0] - 0.08, sh[1] - 0.06, sh[2] - 0.2, sh[0] + 0.08, sh[1] + 0.06, sh[2] + 0.04, 0.9, hexMix(black, '#2a5a3a', 0.5)); for (const sd of [-1, 1]) ball(sh[0] + sd * 0.05, sh[1] + 0.04, sh[2] - 0.12, 0.022, glow2, { emis: true, n: 1 }); plate([[sh[0] - 0.01, sh[1] - 0.02, sh[2] - 0.2], [sh[0] + 0.01, sh[1] - 0.02, sh[2] - 0.2], [sh[0] + 0.03, sh[1] - 0.03, sh[2] - 0.32], [sh[0] - 0.03, sh[1] - 0.03, sh[2] - 0.32]], 0.008, '#d83a4a'); bone = 0;
            } else if (P === 'pegasus') { // LEGEND, LIGHT: the star pegasus: white as moonlight, a mane and tail of falling stars, great feathered wings raised, stars circling it
              const white = '#fbfaf6', gold = '#ffd25a';
              legsOf(0.84, 1, 0.15, 0.075, 0.42, -0.46, { hoof: true }); for (const [fx, fz, fb] of [[-0.15, 0.42, 2], [0.15, 0.42, 3], [-0.15, -0.46, 4], [0.15, -0.46, 5]]) { bone = fb; for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; cone([fx + Math.cos(a) * 0.06, 0.24, fz + Math.sin(a) * 0.06], [Math.cos(a) * 0.5, -1, Math.sin(a) * 0.5], 0.12, 0.035, gold, { emis: true }); } bone = 0; }
              torso(0.26, 0.82, 1.3, -0.62, 0.54, white, '#f2eee6'); neck([0, 1.2, 0.44], [0, 1.76, 0.72], 0.19, 0.14, white);
              for (let i = 0; i < 9; i++) { const u = i / 8; plate([[0, 1.26 + u * 0.5, 0.36 + u * 0.32], [-0.06, 1.34 + u * 0.5, 0.18 + u * 0.32], [0.06, 1.22 + u * 0.5, 0.16 + u * 0.32]], 0.025, i % 2 ? gold : '#fff3c0', { emis: true }); ball(0, 1.3 + u * 0.5, 0.16 + u * 0.32, 0.025, '#ffffff', { emis: true, n: 1 }); }
              deerHead(1.82, 0.78, 1.3, { c: white, muz: 0.4, eye: '#7ab8f8', brow: '#d8d4cc', extra: () => { ring(0, 2.14, 0.72, 0.16, 0.06, 0.02, gold, { emis: true }); for (const sd of [-1, 1]) plate([[sd * 0.08, 1.96, 0.72], [sd * 0.14, 2.0, 0.7], [sd * 0.1, 2.14, 0.68]], 0.02, white); } });
              for (const sd of [-1, 1]) { B(sd < 0 ? 7 : 8, 'wing', [sd * 0.24, 1.24, 0.24], { side: sd, fold: -0.2 }); tube([[sd * 0.24, 1.24, 0.24], [sd * 0.6, 1.74, 0.14], [sd * 0.9, 2.2, 0.0]], [0.06, 0.05, 0.035], white, { cap0: 'round', cap1: 'round' }); plate([[sd * 0.24, 1.26, 0.2], [sd * 0.9, 2.2, -0.02], [sd * 1.12, 1.2, -0.34], [sd * 0.7, 0.9, -0.34], [sd * 0.3, 0.86, -0.22]], 0.02, '#f2eee6'); for (let i = 0; i < 11; i++) { const u = i / 10, b0 = [sd * (0.28 + u * 0.62), 1.3 + u * 0.88, 0.22 - u * 0.22], len = 0.5 + u * 0.5; plate([[b0[0] - sd * 0.06, b0[1], b0[2]], [b0[0] + sd * 0.24 * u, b0[1] - len, b0[2] - 0.34], [b0[0] + sd * (0.12 + 0.24 * u), b0[1] - len * 0.9, b0[2] - 0.3], [b0[0] + sd * 0.06, b0[1], b0[2]]], 0.015, i % 3 === 2 ? '#fff3c0' : white, { emis: i % 3 === 2 }); } bone = 0; }
              const tp = []; for (let i = 0; i <= 8; i++) { const u = i / 8; tp.push([Math.sin(u * 4) * 0.1, 1.24 - u * 0.5, -0.62 - u * 0.6]); } B(6, 'tail', tp[0]); for (let k = 0; k < 3; k++) tube(tp.map(p => [p[0] + (k - 1) * 0.05, p[1], p[2]]), tp.map((_, i) => 0.05 * (1 - i / 9)), k === 1 ? gold : '#fff3c0', { cap0: 'none', cap1: 'round', emis: true }); bone = 0;
              const star5 = (cx, cy, cz, R) => { const pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? R * 0.45 : R; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, cz]); } for (let i = 0; i < 10; i++) plate([[cx, cy, cz + 0.01], pts[i], pts[(i + 1) % 10]], 0.01, gold, { emis: true }); };
              for (let i = 0; i < 7; i++) { const a = i * 0.9; star5(Math.cos(a) * 1.1, 1.3 + (i % 3) * 0.4, Math.sin(a) * 0.9, 0.07); }
            } else if (P === 'sunlion') { // LIGHT 3: the corona has come down to earth as a lion whose mane is the sun's rays
              legsOf(0.56, 1, 0.16, 0.09, 0.38, -0.4, {});
              torso(0.25, 0.54, 0.96, -0.58, 0.5);
              neck([0, 0.86, 0.42], [0, 1.0, 0.6], 0.2, 0.17);
              for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; cone([Math.cos(a) * 0.2, 1.06 + Math.sin(a) * 0.2, 0.6], [Math.cos(a), Math.sin(a), -0.35], i % 2 ? 0.3 : 0.42, 0.08, i % 2 ? ac : '#ffd25a', { emis: true }); }
              catHead(1.06, 0.76, 1.25, { brow: dk, ear: 0.12, eye: '#ffd25a' });
              tail([[0, 0.86, -0.58], [0, 0.6, -0.84], [0, 0.66, -1.1]], [0.06, 0.05, 0.04], bd, { tip: (p) => { ball(p[0], p[1], p[2], 0.1, '#ffd25a', { emis: true, n: 2 }); } });
            }
          } else if (arch === 'steed') {
            // STEED: the Kin you ride, drawn as a real horse. A foal is all legs, a big head and a fuzzy stub of a mane; a colt is
            // sleek, with a flowing mane and tail; a warhorse is broad in the chest, feathered at the hoof, wears a face-plate and
            // carries its element in full (a burning mane, frost on the fetlocks, a halo, wings on a wind horse).
            const leg = [0.66, 0.7, 0.78][t], L = [0.72, 0.92, 1.0][t], hs = [1.3, 1.05, 1.0][t];
            const maneC = el === 'Flame' ? C.accent : el === 'Frost' ? glw : hexMix(C.dark, C.accent, 0.35);
            blob(-0.27 * bulk, leg - 0.02, -0.56 * L, 0.27 * bulk, leg + [0.36, 0.44, 0.5][t], 0.5 * L, 1, C.body, { under: C.belly, tap: [0.95, 1] }); // the barrel
            if (t >= 1) blob(-0.3 * bulk, leg + 0.04, 0.1, 0.3 * bulk, leg + 0.5 + 0.04 * t, 0.56 * L, 1, C.body, { under: C.belly }); // the chest
            markings(-0.26, leg, -0.54 * L, 0.26, leg + 0.42, 0.48 * L);
            const nb = [0, leg + 0.36, 0.44 * L], ht = [0, leg + [0.86, 0.96, 1.06][t], 0.7 * L];
            tube([nb, [0, (nb[1] + ht[1]) / 2, (nb[2] + ht[2]) / 2 + 0.03], ht], [[0.16, 0.2, 0.23][t], 0.15, 0.12], C.body, { cap0: 'none', cap1: 'round' }); // a long, arched neck
            const mn = t === 0 ? 4 : 7; for (let i = 0; i < mn; i++) { const u = i / (mn - 1); const p0 = [0, nb[1] + 0.12 + (ht[1] - nb[1]) * u, nb[2] - 0.1 + (ht[2] - nb[2]) * u]; plate([[0, p0[1], p0[2] + 0.04], [-0.05, p0[1] + (t === 0 ? 0.06 : 0.12), p0[2] - (t === 0 ? 0.06 : 0.16)], [0.05, p0[1] + (t === 0 ? 0.03 : 0.06), p0[2] - (t === 0 ? 0.08 : 0.2)]], 0.025, maneC, { emis: el === 'Flame' && t === 2 }); } // the mane
            B(1, 'head', ht); const hy = ht[1], hz = ht[2];
            blob(-0.15 * hs, hy - 0.06, hz - 0.08, 0.15 * hs, hy + 0.22 * hs, hz + 0.2, 1, C.body, { under: C.belly });
            blob(-0.11 * hs, hy - 0.16 * hs, hz + 0.08, 0.11 * hs, hy + 0.08 * hs, hz + (0.4 + 0.08 * t) * hs, 0.9, hexMix(C.body, C.belly, 0.35), { tap: [0.85, 0.75] }); // the long horse's face
            for (const sd of [-1, 1]) ball(sd * 0.05 * hs, hy - 0.06 * hs, hz + (0.4 + 0.08 * t) * hs, 0.022, C.dark, { n: 1 }); // nostrils
            look(0.12 * hs, hy + 0.1 * hs, hz + 0.1, [0.09, 0.07, 0.062][t] * hs, { brow: t === 2 ? C.dark : null });
            for (const sd of [-1, 1]) plate([[sd * 0.06 * hs, hy + 0.18 * hs, hz], [sd * 0.14 * hs, hy + 0.2 * hs, hz - 0.02], [sd * 0.1 * hs, hy + 0.38 * hs, hz - 0.04]], 0.025, C.body, { edge: C.belly }); // ears
            if (t >= 1) plate([[0, hy + 0.2 * hs, hz + 0.04], [-0.04, hy + 0.34 * hs, hz - 0.04], [0.04, hy + 0.3 * hs, hz - 0.06]], 0.02, maneC); // a forelock
            if (t === 2) { plate([[-0.1, hy + 0.12, hz + 0.14], [0.1, hy + 0.12, hz + 0.14], [0.08, hy - 0.08, hz + 0.4], [-0.08, hy - 0.08, hz + 0.4]], 0.025, hexMix(C.dark, '#c9c4b8', 0.4), { edge: C.accent }); cone([0, hy + 0.14, hz + 0.16], [0, 0.6, 0.6], 0.16, 0.035, C.accent); } // the war face-plate and its spike
            bone = 0; legsOf(leg, L, 0.15 * bulk, [0.06, 0.075, 0.09][t], 0.36 * L, -0.42 * L, { hoof: true, haunch: t >= 1 });
            if (t === 2) for (const [fx, fz, fb] of [[-0.15, 0.36 * L, 2], [0.15, 0.36 * L, 3], [-0.15, -0.42 * L, 4], [0.15, -0.42 * L, 5]]) { bone = fb; for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; cone([fx + Math.cos(a) * 0.06, 0.24, fz + Math.sin(a) * 0.06], [Math.cos(a) * 0.5, -1, Math.sin(a) * 0.5], 0.12, 0.035, el === 'Frost' ? glw : maneC, { emis: el === 'Frost' || el === 'Flame' }); } bone = 0; } // feathered fetlocks
            if (t === 2) for (const sd of [-1, 1]) plate([[sd * 0.28, leg + 0.4, 0.4 * L], [sd * 0.3, leg + 0.1, 0.32 * L], [sd * 0.3, leg + 0.06, -0.3 * L], [sd * 0.28, leg + 0.38, -0.36 * L]], 0.02, hexMix(C.accent, C.dark, 0.3), { edge: C.accent }); // barding
            B(6, 'tail', [0, leg + 0.36, -0.56 * L]); const tl = [0, leg - [0.06, 0.18, 0.28][t], -(0.72 + 0.14 * t) * L];
            tube([[0, leg + 0.36, -0.56 * L], [0, leg + 0.3, -(0.66 + 0.06 * t) * L], tl], [0.07, [0.07, 0.11, 0.14][t], 0.04], maneC, { cap0: 'none', cap1: 'round', emis: el === 'Flame' && t === 2 }); bone = 0; // the tail: a tuft, then a flowing switch
            infuse({ head: [0, hy + 0.3 * hs, hz], hs, neck: [0, nb[1] + 0.1, nb[2] + 0.12], back: [leg + [0.36, 0.44, 0.5][t], -0.44 * L, 0.3 * L], tail: tl, jaw: [0, hy - 0.1 * hs, hz + 0.34 * hs], feet: [[-0.15, 0.36 * L, 2], [0.15, 0.36 * L, 3], [-0.15, -0.42 * L, 4], [0.15, -0.42 * L, 5]] });
          } else if (arch === 'bulwark') {
            // BULWARK: born a soft, round pup in banded scales; grows into a long scaled hunter; ends as a walking fortress,
            // overlapping plates in ridges, a shield crest on its head and a mace at the end of its tail.
            const leg = [0.26, 0.34, 0.46][t], L = [0.8, 1.06, 1.22][t], plateC = el === 'Frost' ? glw : el === 'Flame' ? '#3a2a26' : hexMix(C.dark, C.body, 0.35);
            blob(-0.36 * bulk, leg - 0.04, -0.56 * L, 0.36 * bulk, leg + [0.56, 0.48, 0.56][t], 0.56 * L, 1, C.body, { under: C.belly, bulge: 0.08 });
            const rows = [3, 5, 6][t]; for (let i = 0; i < rows; i++) { const z = 0.42 * L - i * (0.9 * L / (rows - 1)); const w = (0.36 + 0.04 * t) * bulk * (1 - Math.abs(i - rows / 2) * 0.06);
              blob(-w, leg + 0.18, z - 0.13, w, leg + [0.6, 0.54, 0.66][t] + 0.02, z + 0.11, 0.8, plateC, { n: 2 }); if (el === 'Flame' && i) for (const sx of [-0.5, 0, 0.5]) ball(sx * w, leg + [0.6, 0.54, 0.66][t] - 0.02, z + 0.12, 0.04, glw, { emis: true, n: 1 }); // lava glowing between the plates
              if (t === 2) cone([0, leg + 0.66, z], [0, 1, -0.3], 0.18, 0.06, plateC); } // overlapping plates, and a spiked ridge on the adult
            B(1, 'head', [0, leg + 0.26, 0.56 * L]); const hy = leg + 0.18, hz = 0.56 * L; const hs = [1.25, 1, 0.95][t];
            blob(-0.22 * hs, hy - 0.06, hz - 0.08, 0.22 * hs, hy + 0.3 * hs, hz + 0.28, 1, C.body, { under: C.belly });
            blob(-0.1 * hs, hy - 0.04, hz + 0.18, 0.1 * hs, hy + 0.12 * hs, hz + 0.32 + 0.14 * t, 0.9, hexMix(C.body, C.belly, 0.4), { tap: [0.7, 0.8] }); ball(0, hy + 0.08 * hs, hz + 0.34 + 0.14 * t, 0.035, C.dark, { n: 2 });
            look(0.12 * hs, hy + 0.17 * hs, hz + 0.18, [0.1, 0.08, 0.068][t] * hs, { brow: t === 2 ? plateC : null });
            if (t === 0) for (const sd of [-1, 1]) plate([[sd * 0.1, hy + 0.24 * hs, hz], [sd * 0.3, hy + 0.36 * hs, hz - 0.06], [sd * 0.18, hy + 0.42 * hs, hz - 0.02]], 0.03, C.body, { edge: C.belly }); // a pup's big ears
            if (t === 2) plate([[-0.2, hy + 0.2, hz + 0.14], [0.2, hy + 0.2, hz + 0.14], [0.26, hy + 0.5, hz - 0.08], [0, hy + 0.62, hz - 0.12], [-0.26, hy + 0.5, hz - 0.08]], 0.04, plateC, { edge: C.accent }); // the shield crest
            bone = 0; legsOf(leg, L, 0.24 * bulk, [0.09, 0.1, 0.13][t], 0.38 * L, -0.38 * L);
            B(6, 'tail', [0, leg + 0.18, -0.56 * L]); const tl = [0, leg + 0.06 + 0.04 * t, -(0.86 + 0.14 * t) * L];
            tube([[0, leg + 0.18, -0.56 * L], [0, leg + 0.1, -0.72 * L], tl], [0.12, 0.09, 0.06], C.body, { cap0: 'none', cap1: 'round' }); for (let i = 0; i < 2 + t; i++) ring(0, leg + 0.15 - i * 0.03, -(0.62 + i * 0.1) * L, 0.1 - i * 0.012, 0.1 - i * 0.012, 0.025, plateC);
            if (t === 2) { bone = 6; ball(tl[0], tl[1], tl[2], 0.15, plateC, { n: 2 }); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; cone([tl[0], tl[1], tl[2]], [Math.cos(a), Math.sin(a), -0.3], 0.22, 0.05, plateC); } } // the mace
            bone = 0;
            infuse({ head: [0, hy + 0.32 * hs, hz + 0.06], hs, neck: [0, leg + 0.36, 0.46 * L], back: [leg + 0.6, -0.4 * L, 0.36 * L], tail: tl, jaw: [0, hy + 0.04, hz + 0.3], feet: [[-0.24, 0.38 * L, 2], [0.24, 0.38 * L, 3], [-0.24, -0.38 * L, 4], [0.24, -0.38 * L, 5]] });
          } else if (arch === 'lanternstag') {
            // LANTERNSTAG: a spotted fawn with glowing antler buds; a slender stag with lanterns hung in branching antlers; an elk-king
            // with a flowing mane, heavy shoulders, glowing hooves and a crown of lanterns.
            const leg = [0.5, 0.72, 0.86][t], L = [0.74, 0.92, 1.04][t];
            blob(-0.25 * bulk, leg - 0.02, -0.5 * L, 0.25 * bulk, leg + 0.42, 0.5 * L, 1, C.body, { under: C.belly });
            if (t === 2) blob(-0.3 * bulk, leg + 0.06, 0.04, 0.3 * bulk, leg + 0.56, 0.56 * L, 1, C.body, { under: C.belly }); // heavy shoulders
            if (t === 0) for (let i = 0; i < 6; i++) ball(((i * 37) % 10 / 10 - 0.5) * 0.4, leg + 0.36 + (i % 2) * 0.03, -0.4 * L + i * 0.14 * L, 0.035, '#fff8ea', { n: 1 }); // fawn spots
            const nb = [0, leg + 0.34, 0.42 * L], ht = [0, leg + [0.62, 0.8, 0.92][t], 0.62 * L];
            tube([nb, [0, (nb[1] + ht[1]) / 2, (nb[2] + ht[2]) / 2 + 0.02], ht], [[0.15, 0.17, 0.2][t], 0.13, 0.12], C.body, { cap0: 'none', cap1: 'round' });
            if (t === 2) for (let i = 0; i < 6; i++) { const u = i / 5; plate([[0, nb[1] + 0.1 + (ht[1] - nb[1]) * u, nb[2] - 0.08 + (ht[2] - nb[2]) * u], [-0.05, nb[1] + 0.02 + (ht[1] - nb[1]) * u, nb[2] - 0.3 + (ht[2] - nb[2]) * u], [0.05, nb[1] - 0.04 + (ht[1] - nb[1]) * u, nb[2] - 0.26 + (ht[2] - nb[2]) * u]], 0.025, hexMix(C.body, C.dark, 0.35)); } // a flowing mane
            B(1, 'head', ht); const hy = ht[1], hz = ht[2]; const hs = [1.25, 1, 0.95][t];
            blob(-0.17 * hs, hy - 0.04, hz - 0.08, 0.17 * hs, hy + 0.26 * hs, hz + 0.24, 1, C.body, { under: C.belly });
            blob(-0.1 * hs, hy - 0.02, hz + 0.16, 0.1 * hs, hy + 0.14 * hs, hz + 0.4 + 0.06 * t, 0.9, hexMix(C.body, C.belly, 0.5), { tap: [0.8, 0.85] }); ball(0, hy + 0.11 * hs, hz + 0.42 + 0.06 * t, 0.035, C.dark, { n: 2 });
            look(0.11 * hs, hy + 0.15 * hs, hz + 0.16, [0.09, 0.072, 0.062][t] * hs, { brow: t === 2 ? C.dark : null });
            for (const sd of [-1, 1]) { plate([[sd * 0.12 * hs, hy + 0.2 * hs, hz], [sd * (0.34 + 0.06 * (t === 0)) * hs, hy + 0.3 * hs, hz - 0.08], [sd * 0.18 * hs, hy + 0.3 * hs, hz + 0.02]], 0.025, C.body, { edge: C.belly });
              const ab = [sd * 0.08, hy + 0.26 * hs, hz + 0.02];
              if (t === 0) { cone(ab, [sd * 0.3, 1, -0.1], 0.1, 0.035, C.dark); ball(ab[0] + sd * 0.04, ab[1] + 0.12, ab[2] - 0.01, 0.045, glw, { emis: true, n: 2 }); }
              else { const H = 0.48 + 0.22 * (t - 1); const main = [[ab[0], ab[1], ab[2]], [ab[0] + sd * 0.14, ab[1] + H * 0.5, ab[2] - 0.06], [ab[0] + sd * 0.24, ab[1] + H, ab[2] - 0.14]]; tube(main, [0.035, 0.028, 0.012], C.dark, { cap0: 'none', cap1: 'round' }); const tips = [main[2]];
                for (let k = 0; k < 2 + 2 * (t - 1); k++) { const u = 0.3 + k * (0.6 / (1 + 2 * (t - 1))); const b0 = [ab[0] + sd * 0.24 * u, ab[1] + H * u, ab[2] - 0.14 * u]; const e = [b0[0] + sd * (0.12 + 0.05 * (k % 2)), b0[1] + 0.06, b0[2] + (k % 2 ? 0.12 : -0.14)]; tube([b0, e], [0.022, 0.01], C.dark, { cap0: 'none', cap1: 'round' }); tips.push(e); }
                for (const tp of tips) { tube([tp, [tp[0], tp[1] - 0.08, tp[2]]], [0.006, 0.006], C.dark, { cap0: 'none', cap1: 'none' }); ball(tp[0], tp[1] - 0.13, tp[2], 0.05 + 0.01 * t, glw, { emis: true, n: 2 }); } } }
            bone = 0; legsOf(leg, L, 0.17 * bulk, [0.07, 0.085, 0.1][t], 0.36 * L, -0.38 * L, { hoof: true, haunch: false });
            if (t === 2) for (const [fx, fz] of [[-0.17, 0.36 * L], [0.17, 0.36 * L], [-0.17, -0.38 * L], [0.17, -0.38 * L]]) ring(fx, 0.14, fz, 0.08, 0.08, 0.02, glw, { emis: true }); // glowing hooves
            B(6, 'tail', [0, leg + 0.36, -0.5 * L]); const tl = [0, leg + 0.44 - 0.1 * t, -(0.62 + 0.14 * t) * L];
            tube([[0, leg + 0.36, -0.5 * L], tl], [0.07, 0.03 + 0.03 * t], t === 2 ? hexMix(C.body, C.dark, 0.35) : '#fff8ea', { cap0: 'round', cap1: 'round' }); bone = 0;
            infuse({ head: [0, hy + 0.28 * hs, hz], hs, neck: [0, nb[1] + 0.2, nb[2] + 0.1], back: [leg + 0.42, -0.4 * L, 0.3 * L], tail: tl, jaw: [0, hy + 0.04, hz + 0.3], feet: [[-0.17, 0.36 * L, 2], [0.17, 0.36 * L, 3], [-0.17, -0.38 * L, 4], [0.17, -0.38 * L, 5]] });
          } else if (arch === 'masker') {
            // MASKER: a round kitten in a half-mask; a sleek cat behind a full mask with a conjuror's collar; a tall, long-limbed
            // stalker in a horned mask and a cape, with a second, smaller mask riding the end of its tail.
            const leg = [0.32, 0.46, 0.6][t], L = [0.74, 1.04, 1.16][t]; const maskC = el === 'Frost' ? hexMix(glw, '#ffffff', 0.4) : el === 'Void' ? '#2a2236' : el === 'Flame' ? '#3a2a26' : hexMix('#f4ecdc', C.belly, 0.25);
            blob(-0.27 * bulk, leg - 0.02, -0.6 * L, 0.27 * bulk, leg + [0.46, 0.4, 0.4][t], 0.5 * L, 1, C.body, { under: C.belly, tap: [0.92, 1] });
            const ht = [0, leg + [0.42, 0.5, 0.58][t], 0.54 * L]; tube([[0, leg + 0.3, 0.38 * L], ht], [0.16, 0.14], C.body, { cap0: 'none', cap1: 'round' });
            if (t >= 1) for (const sd of [-1, 1]) plate([[sd * 0.08, leg + 0.3, 0.42 * L], [sd * 0.32, leg + 0.62 + 0.08 * t, 0.36 * L], [sd * 0.24, leg + 0.72 + 0.1 * t, 0.46 * L], [sd * 0.1, leg + 0.5, 0.5 * L]], 0.025, C.accent, { edge: C.dark }); // the conjuror's collar
            if (t === 2) for (const sd of [-1, 1]) plate([[sd * 0.12, leg + 0.48, 0.3 * L], [sd * 0.4, leg + 0.3, -0.1], [sd * 0.36, leg - 0.02, -0.5 * L], [sd * 0.2, leg + 0.3, -0.56 * L], [sd * 0.06, leg + 0.44, -0.2]], 0.02, hexMix(C.accent, C.dark, 0.35), { edge: C.accent }); // the cape
            B(1, 'head', ht); const hy = ht[1], hz = ht[2]; const hs = [1.3, 1, 0.92][t];
            blob(-0.22 * hs, hy - 0.06, hz - 0.12, 0.22 * hs, hy + 0.3 * hs, hz + 0.18, 1, C.body);
            for (const sd of [-1, 1]) plate([[sd * 0.08 * hs, hy + 0.24 * hs, hz], [sd * 0.26 * hs, hy + 0.26 * hs, hz - 0.06], [sd * (0.24 + 0.04 * t) * hs, hy + (0.5 + 0.14 * t) * hs, hz - 0.08 - 0.04 * t]], 0.03, C.body, { edge: C.accent }); // ears, longer each stage
            if (t === 0) { blob(-0.24 * hs, hy + 0.06 * hs, hz + 0.0, 0.24 * hs, hy + 0.25 * hs, hz + 0.17, 1, maskC); LOOK(0.11 * hs, hy + 0.15 * hs, hz + 0.1, 0.07 * hs, { col: glw }); /* a bandit's mask with bright eyes in it */ blob(-0.07, hy - 0.02, hz + 0.16, 0.07, hy + 0.08, hz + 0.24, 0.9, C.belly); } // a kitten's half-mask
            else { blob(-0.2, hy - 0.12, hz + 0.14, 0.2, hy + 0.28, hz + 0.26, 0.95, maskC, { tap: [1, 0.7] });
              for (const sd of [-1, 1]) plate([[sd * 0.035, hy + 0.12, hz + 0.27], [sd * 0.16, hy + 0.17, hz + 0.25], [sd * 0.14, hy + 0.1, hz + 0.26]], 0.014, glw, { emis: true });
              plate([[-0.014, hy + 0.27, hz + 0.265], [0.014, hy + 0.27, hz + 0.265], [0, hy - 0.06, hz + 0.29]], 0.01, C.accent); for (const sd of [-1, 1]) plate([[sd * 0.05, hy + 0.02, hz + 0.28], [sd * 0.13, hy + 0.06, hz + 0.26], [sd * 0.08, hy - 0.06, hz + 0.27]], 0.01, C.accent);
              if (t === 2) for (const sd of [-1, 1]) curl([sd * 0.15, hy + 0.24, hz + 0.2], [sd * 0.3, 1, -0.1], 0.3, 0.035, maskC, [sd * 0.2, -0.1, -0.5]); }
            bone = 0; legsOf(leg, L, 0.16 * bulk, [0.08, 0.08, 0.075][t], 0.36 * L, -0.48 * L);
            B(6, 'tail', [0, leg + 0.3, -0.6 * L]); const tp = t === 0 ? [[0, leg + 0.3, -0.6 * L], [0, leg + 0.44, -0.78 * L], [0, leg + 0.6, -0.84 * L]] : [[0, leg + 0.3, -0.6 * L], [0, leg + 0.5, -0.9 * L], [0, leg + 0.86, -1.0 * L], [0, leg + 1.04 + 0.1 * t, -0.84 * L]];
            tube(tp, t === 0 ? [0.08, 0.09, 0.06] : [0.06, 0.05, 0.045, 0.03], C.body, { cap0: 'none', cap1: 'round' }); const e = tp[tp.length - 1];
            if (t === 2) { plate([[e[0] - 0.08, e[1] + 0.06, e[2] - 0.02], [e[0] + 0.08, e[1] + 0.06, e[2] - 0.02], [e[0], e[1] - 0.1, e[2] + 0.02]], 0.025, maskC, { edge: C.dark }); ball(e[0], e[1] + 0.01, e[2] + 0.02, 0.02, glw, { emis: true, n: 1 }); }
            bone = 0;
            infuse({ head: [0, hy + 0.3 * hs, hz - 0.02], hs, neck: [0, leg + 0.44, 0.46 * L], back: [leg + 0.4, -0.5 * L, 0.3 * L], tail: e, jaw: [0, hy - 0.06, hz + 0.24], feet: [[-0.16, 0.36 * L, 2], [0.16, 0.36 * L, 3], [-0.16, -0.48 * L, 4], [0.16, -0.48 * L, 5]] });
          } else if (arch === 'mantlewalker') {
            // MANTLEWALKER: a round little thing with fin-nubs and huge eyes; a flat walker with a cape of skin down each side;
            // an adult so broad its mantle carries it off the ground, legs tucked up, a row of lights along each edge.
            const leg = [0.3, 0.42, 0.34][t], L = [0.7, 1.0, 1.12][t];
            blob(-0.32 * bulk, leg + 0.02, -0.5 * L, 0.32 * bulk, leg + [0.48, 0.38, 0.34][t], 0.52 * L, 1, C.body, { under: C.belly, tap: [1, 0.85] });
            const span = [0.12, 0.5, 0.86][t];
            for (const sd of [-1, 1]) { plate([[sd * 0.28, leg + 0.28, 0.46 * L], [sd * (0.3 + span), leg + 0.2, 0.3 * L], [sd * (0.32 + span * 1.05), leg + 0.12, -0.05], [sd * (0.3 + span * 0.85), leg + 0.16, -0.4 * L], [sd * 0.28, leg + 0.26, -0.5 * L]], 0.025, C.accent, { edge: glw });
              if (t === 2) for (let i = 0; i < 5; i++) { const u = i / 4; ball(sd * (0.4 + span * (0.55 + 0.45 * Math.sin(u * Math.PI))), leg + 0.2, 0.38 * L - u * 0.84 * L, 0.035, glw, { emis: true, n: 1 }); } }
            if (t === 2) hover = 0.22;
            B(1, 'head', [0, leg + 0.22, 0.52 * L]); const hy = leg + 0.14, hz = 0.52 * L; const hs = [1.25, 1, 1][t];
            blob(-0.28 * hs, hy - 0.04, hz - 0.08, 0.28 * hs, hy + 0.22 * hs, hz + 0.3, 0.9, C.body, { under: C.belly });
            for (const sd of [-1, 1]) curl([sd * 0.22 * hs, hy + 0.06, hz + 0.28], [sd * 0.1, 0.2, 1], (0.1 + 0.12 * t), 0.05, C.accent, [sd * -0.2, 0.6, -0.6]);
            look(0.16 * hs, hy + 0.16 * hs, hz + 0.2, [0.1, 0.07, 0.064][t] * hs, { brow: t === 2 ? C.dark : null, glow: t === 2 });
            bone = 0; legsOf(leg, L, 0.2, [0.08, 0.08, 0.07][t], 0.36 * L, -0.38 * L, { haunch: false });
            B(6, 'tail', [0, leg + 0.2, -0.5 * L]); const tl = [0, leg + 0.3 + 0.1 * t, -(0.8 + 0.5 * t) * L];
            tube([[0, leg + 0.2, -0.5 * L], [0, leg + 0.24, -(0.66 + 0.2 * t) * L], tl], [0.06, 0.04, 0.0005], C.body, { cap0: 'none', cap1: 'none' }); if (t >= 1) for (const sd of [-1, 1]) plate([[tl[0], tl[1], tl[2] + 0.12], [sd * 0.16, tl[1] + 0.04, tl[2] + 0.02], [0, tl[1], tl[2] - 0.06]], 0.02, C.accent, { edge: glw }); bone = 0;
            infuse({ head: [0, hy + 0.22 * hs, hz + 0.04], hs, neck: [0, leg + 0.34, 0.44 * L], back: [leg + 0.36, -0.4 * L, 0.34 * L], tail: tl, jaw: [0, hy, hz + 0.28], feet: [[-0.2, 0.36 * L, 2], [0.2, 0.36 * L, 3], [-0.2, -0.38 * L, 4], [0.2, -0.38 * L, 5]] });
          } else if (arch === 'anvilmaw') {
            // ANVILMAW: a stocky pup with a stub of a jaw; a bruiser with shoulder plates and an anvil for a jaw; a hulking forge-king
            // with horns, armoured knuckles, a furnace grate glowing in its chest and two great exhaust horns on its shoulders.
            const leg = [0.32, 0.44, 0.56][t], L = [0.76, 1.0, 1.12][t];
            blob(-[0.36, 0.46, 0.56][t] * bulk, leg - 0.02, -0.05, [0.36, 0.46, 0.56][t] * bulk, leg + [0.5, 0.7, 0.86][t], 0.58 * L, 1, C.body, { under: C.belly, bulge: 0.08 });
            blob(-0.3 * bulk, leg - 0.06, -0.58 * L, 0.3 * bulk, leg + 0.4, 0.1, 0.9, C.body, { under: C.belly });
            if (t >= 1) for (const sd of [-1, 1]) blob(sd * 0.42 * bulk - 0.16, leg + 0.48 + 0.1 * t, 0.12, sd * 0.42 * bulk + 0.16, leg + 0.66 + 0.16 * t, 0.46 * L, 0.75, hexMix(C.dark, C.body, 0.3), { n: 2 }); // shoulder plates
            if (t === 2) { for (let i = 0; i < 4; i++) blob(-0.2 + i * 0.13 - 0.03, leg + 0.18, 0.56 * L + 0.02, -0.2 + i * 0.13 + 0.03, leg + 0.5, 0.56 * L + 0.08, 0.4, glw, { emis: true, n: 1 }); blob(-0.24, leg + 0.14, 0.56 * L - 0.02, 0.24, leg + 0.54, 0.56 * L + 0.04, 0.3, '#2a2228', { n: 2 }); // the furnace grate
              for (const sd of [-1, 1]) { curl([sd * 0.4 * bulk, leg + 0.86, 0.2], [sd * 0.3, 1, -0.5], 0.5, 0.09, C.dark, [sd * 0.1, -0.3, -0.4]); ball(sd * (0.4 * bulk + 0.12), leg + 1.34, 0.0, 0.08, glw, { emis: true, n: 2 }); } } // exhaust horns
            else { tube([[0, leg + 0.4 + 0.2 * t, 0.06], [0, leg + 0.62 + 0.24 * t, 0.02]], [0.07, 0.06], C.dark, { cap0: 'none', cap1: 'none' }); ball(0, leg + 0.72 + 0.24 * t, 0.0, 0.05, glw, { emis: true, n: 2 }); }
            B(1, 'head', [0, leg + 0.42, 0.58 * L]); const hy = leg + [0.22, 0.3, 0.38][t], hz = 0.58 * L; const hs = [1.2, 1, 1.05][t];
            blob(-0.24 * hs, hy + 0.04, hz - 0.08, 0.24 * hs, hy + 0.32 * hs, hz + 0.24, 0.9, C.body);
            const jl = [0.2, 0.42, 0.5][t]; blob(-0.26 * hs, hy - 0.14 * hs, hz + 0.02, 0.26 * hs, hy + 0.08, hz + jl, [0.85, 0.55, 0.5][t], hexMix(C.dark, C.body, 0.25), { n: 2 }); // the jaw: a stub, then an anvil
            if (t >= 1) for (const sd of [-1, 1]) cone([sd * 0.2 * hs, hy + 0.06, hz + jl - 0.04], [0, 1, 0.1], 0.12 + 0.06 * t, 0.04, '#f4ecdc');
            if (t === 0) look(0.11 * hs, hy + 0.22 * hs, hz + 0.2, 0.08 * hs); else { for (const sd of [-1, 1]) { ball(sd * 0.11, hy + 0.22, hz + 0.22, 0.045, '#16121e', { n: 2 }); ball(sd * 0.11, hy + 0.22, hz + 0.25, 0.03, glw, { emis: true, n: 2 }); } blob(-0.22, hy + 0.27, hz + 0.12, 0.22, hy + 0.34, hz + 0.27, 0.5, C.dark, { n: 2 }); }
            if (t === 2) for (const sd of [-1, 1]) curl([sd * 0.18, hy + 0.34, hz + 0.1], [sd * 0.6, 0.6, 0.2], 0.3, 0.06, '#f4ecdc', [0, 0.3, 0.4]); // horns
            bone = 0; legsOf(leg, L, 0.3 * bulk, [0.11, 0.14, 0.17][t], 0.4 * L, -0.42 * L);
            if (t === 2) for (const sd of [-1, 1]) { bone = sd < 0 ? 2 : 3; blob(sd * 0.3 * bulk - 0.15, 0.04, 0.4 * L - 0.08, sd * 0.3 * bulk + 0.15, 0.24, 0.4 * L + 0.2, 0.7, hexMix(C.dark, C.body, 0.3), { n: 2 }); bone = 0; } // armoured knuckles
            B(6, 'tail', [0, leg + 0.2, -0.58 * L]); const tl = [0, leg + 0.1, -0.78 * L]; tube([[0, leg + 0.2, -0.58 * L], tl], [0.08, 0.06], C.body, { cap0: 'none', cap1: 'round' }); bone = 0;
            infuse({ head: [0, hy + 0.32 * hs, hz + 0.04], hs, neck: [0, leg + 0.5, 0.5 * L], back: [leg + [0.5, 0.7, 0.86][t], -0.4 * L, 0.2 * L], tail: tl, jaw: [0, hy - 0.04, hz + jl], feet: [[-0.3, 0.4 * L, 2], [0.3, 0.4 * L, 3], [-0.3, -0.42 * L, 4], [0.3, -0.42 * L, 5]] });
          } else { // glyphtail
            // GLYPHTAIL: a fluffy kit with one huge brush of a tail; a lean fox with two tails and glyphs lit on its brow and legs;
            // a tall, elegant adult with a ruff, swept-back ears and three tails that sweep up into a ring of light, floating glyphs
            // turning in it. It walks a hand's breadth off the ground.
            const leg = [0.32, 0.48, 0.62][t], L = [0.7, 0.94, 1.06][t]; const hs = [1.35, 1.08, 0.95][t];
            blob(-[0.27, 0.23, 0.22][t] * bulk, leg - 0.02, -0.5 * L, [0.27, 0.23, 0.22][t] * bulk, leg + [0.46, 0.38, 0.38][t], 0.48 * L, 1, C.body, { under: C.belly });
            const ht = [0, leg + [0.42, 0.52, 0.66][t], 0.52 * L]; tube([[0, leg + 0.3, 0.36 * L], ht], [0.14, 0.12], C.body, { cap0: 'none', cap1: 'round' });
            if (t === 2) for (let i = 0; i < 8; i++) { const a = (i / 7 - 0.5) * 2.6; cone([Math.sin(a) * 0.12, leg + 0.4 + Math.cos(a) * 0.08, 0.42 * L], [Math.sin(a), Math.cos(a) * 0.5, -0.4], 0.2, 0.05, C.belly); } // the ruff
            B(1, 'head', ht); const hy = ht[1], hz = ht[2];
            blob(-0.2 * hs, hy - 0.04, hz - 0.1, 0.2 * hs, hy + 0.28 * hs, hz + 0.2, 1, C.body, { under: C.belly });
            blob(-0.08 * hs, hy + 0.0, hz + 0.12, 0.08 * hs, hy + 0.12 * hs, hz + 0.34 + 0.06 * t, 0.9, C.belly, { tap: [0.7, 0.8] }); ball(0, hy + 0.1 * hs, hz + 0.36 + 0.06 * t, 0.032, C.dark, { n: 2 });
            look(0.1 * hs, hy + 0.17 * hs, hz + 0.16, [0.1, 0.075, 0.065][t] * hs, { brow: t === 2 ? C.dark : null, glow: t === 2 });
            for (const sd of [-1, 1]) { if (t < 2) plate([[sd * 0.06 * hs, hy + 0.22 * hs, hz + 0.02], [sd * 0.26 * hs, hy + 0.22 * hs, hz - 0.04], [sd * 0.24 * hs, hy + (0.66 - 0.04 * t) * hs, hz - 0.08], [sd * 0.1 * hs, hy + 0.4 * hs, hz]], 0.03, C.body, { edge: C.accent });
              else plate([[sd * 0.06 * hs, hy + 0.24 * hs, hz], [sd * 0.2 * hs, hy + 0.24 * hs, hz - 0.06], [sd * 0.26 * hs, hy + 0.5 * hs, hz - 0.44], [sd * 0.1 * hs, hy + 0.36 * hs, hz - 0.1]], 0.03, C.body, { edge: C.accent }); } // ears: tall and wide, then swept back
            if (t >= 1) { plate([[-0.02, hy + 0.3 * hs, hz + 0.19], [0.02, hy + 0.3 * hs, hz + 0.19], [0, hy + 0.18 * hs, hz + 0.21]], 0.012, glw, { emis: true }); for (const sd of [-1, 1]) ball(sd * 0.06, hy + 0.27 * hs, hz + 0.19, 0.016, glw, { emis: true, n: 1 }); } // a glyph on the brow
            bone = 0; legsOf(leg, L, 0.14 * bulk, [0.08, 0.07, 0.065][t], 0.34 * L, -0.38 * L);
            if (t >= 1) for (const [fx, fz, fb] of [[-0.14, 0.34 * L, 2], [0.14, 0.34 * L, 3], [-0.14, -0.38 * L, 4], [0.14, -0.38 * L, 5]]) { bone = fb; ring(fx, leg * 0.45, fz, 0.075, 0.03, 0.012, glw, { emis: true }); bone = 0; } // glyph bands on the legs
            if (t === 2) hover = 0.1;
            B(6, 'tail', [0, leg + 0.3, -0.5 * L]); const tb = [0, leg + 0.3, -0.5 * L]; let tl = tb;
            if (t === 0) { const p = [tb, [0, tb[1] + 0.2, tb[2] - 0.28], [0, tb[1] + 0.5, tb[2] - 0.34], [0, tb[1] + 0.72, tb[2] - 0.2]]; tube(p, [0.12, 0.2, 0.18, 0.06], C.body, { cap0: 'none', cap1: 'round' }); ball(p[3][0], p[3][1], p[3][2], 0.08, C.belly, { n: 2 }); tl = p[3]; } // one great brush
            else for (let k = 0; k < t + 1; k++) { const sx = (k - t / 2) * 0.18;
              const path = t === 2 ? [tb, [sx * 1.5, tb[1] + 0.2, tb[2] - 0.3], [sx * 2.4, tb[1] + 0.6, tb[2] - 0.38], [sx * 2, tb[1] + 0.98, tb[2] - 0.3]] : [tb, [sx, tb[1] + 0.12, tb[2] - 0.32], [sx * 1.6, tb[1] + 0.4, tb[2] - 0.52], [sx * 1.8, tb[1] + 0.66, tb[2] - 0.48]];
              tube(path, [0.06, 0.1, 0.09, 0.04], C.body, { cap0: 'none', cap1: 'round' }); ball(path[3][0], path[3][1], path[3][2], 0.06, C.belly, { n: 2 }); tl = path[3]; }
            if (t === 2) { ring(0, tb[1] + 0.66, tb[2] - 0.36, 0.44, 0.44, 0.05, glw, { emis: true }); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; ball(Math.cos(a) * 0.44, tb[1] + 0.66 + Math.sin(a) * 0.44, tb[2] - 0.36, 0.07, C.accent, { emis: true, n: 2 }); } }
            bone = 0;
            infuse({ head: [0, hy + 0.3 * hs, hz], hs, neck: [0, leg + 0.42, 0.44 * L], back: [leg + 0.38, -0.4 * L, 0.3 * L], tail: tl, jaw: [0, hy + 0.02, hz + 0.3], feet: [[-0.14, 0.34 * L, 2], [0.14, 0.34 * L, 3], [-0.14, -0.38 * L, 4], [0.14, -0.38 * L, 5]] });
          }
          if (f.wings && el !== 'Gale' && !QD.has(form.plan) && !(arch === 'steed' && t < 2)) wings(0.28, legLen + 0.4, 0.1, 0.8 + 0.2 * t);
          break;
        }
      }
      case 'biped': {
        if (form.plan && BPD.has(form.plan)) {
          // Two-legged Kin with bodies of their own, each anchored to a real animal or thing and grown along a line that follows
          // from it. Bones: head 1, arms 2/3, legs 4/5, tail 6, wings 7/8.
          const P = form.plan, dk = C.dark, bl = C.belly, bd = C.body, ac = C.accent, glw = hexMix(C.accent, '#ffffff', 0.3);
          const look = (ex, ey, ez, er, o = {}) => LOOK(ex, ey, ez, er, o, false); const lookOld = (ex, ey, ez, er, o = {}) => { for (const sd of [-1, 1]) { ball(sd * ex, ey, ez, er, '#16121e', { n: 3 }); ball(sd * (ex + er * 0.04), ey - er * 0.12, ez + er * 0.5, er * 0.62, o.col || C.eye, { emis: !!o.glow, n: 3 });
            ball(sd * (ex + er * 0.05), ey - er * 0.1, ez + er * 0.78, er * 0.3, '#0a0810', { n: 2 }); ball(sd * (ex - er * 0.22), ey + er * 0.34, ez + er * 0.82, er * 0.3, '#ffffff', { emis: true, n: 2 });
            if (o.brow) blob(sd * ex - er * 1.1, ey + er * 0.88, ez - er * 0.3, sd * ex + er * 1.1, ey + er * 1.18, ez + er * 0.9, 0.5, o.brow, { n: 2 }); } };
          const H = (y, z) => B(1, 'head', [0, y, z || 0]);
          const nose = (x, y, z, r, c) => ball(x, y, z, r, c || dk, { n: 2 });
          const mouth = (y, z, w, c) => tube([[-w, y + 0.015, z - 0.015], [0, y, z], [w, y + 0.015, z - 0.015]], [0.013, 0.013, 0.013], c || dk, { cap0: 'round', cap1: 'round' });
          const legs = (hip, xw, th, c, foot, o = {}) => { // two legs with a knee; feet: paw, boot, web, talon, hoof, root
            th *= 1.25; for (const sd of [-1, 1]) { B(sd < 0 ? 4 : 5, 'leg', [sd * xw, hip, 0], { phase: sd < 0 ? 0 : Math.PI, len: hip });
              if (o.thigh) blob(sd * xw - th * 1.4, hip * 0.5, -th * 1.4, sd * xw + th * 1.4, hip + th * 0.8, th * 1.3, 1, c || bd, { under: bl });
              tube([[sd * xw, hip, 0], [sd * xw * 1.06, hip * 0.5, o.digi ? -0.07 : 0.04], [sd * xw, 0.1, 0]], [th, th * 0.85, th * 0.75], c || bd, { cap0: 'round', cap1: 'none' });
              const fc = o.fc || dk;
              if (foot === 'web') { blob(sd * xw - th, 0, -th, sd * xw + th, 0.1, th, 0.8, fc, { n: 2 }); plate([[sd * xw, 0.02, 0], [sd * xw - th * 2.2, 0.02, th * 3.2], [sd * xw + th * 2.2, 0.02, th * 3.2]], 0.025, fc); }
              else if (foot === 'talon') { for (const a of [-0.5, 0, 0.5]) tube([[sd * xw, 0.08, 0], [sd * xw + a * th * 2, 0.03, th * 2.8]], [th * 0.4, th * 0.25], fc, { cap0: 'round', cap1: 'round' }); }
              else if (foot === 'root') { for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; tube([[sd * xw, 0.1, 0], [sd * xw + Math.cos(a) * th * 2.2, 0.02, Math.sin(a) * th * 2.2]], [th * 0.5, th * 0.2], fc, { cap0: 'none', cap1: 'round' }); } }
              else if (foot === 'boot') blob(sd * xw - th * 1.3, 0, -th * 1.1, sd * xw + th * 1.3, th * 2.4, th * 2.6, 0.5, fc, { n: 2 });
              else if (foot === 'big') blob(sd * xw - th * 1.2, 0, -th * 1.6, sd * xw + th * 1.2, th * 1.3, th * 4.6, 0.7, fc, { n: 2 });
              else blob(sd * xw - th * 1.2, 0, -th * 0.9, sd * xw + th * 1.2, th * 1.4, th * 2.1, 0.7, fc, { n: 2 }); }
            bone = 0; legLen = hip; };
          const arms = (sh, xw, len, th, c, hand, o = {}) => { // two arms hung from the shoulders; hands: paw, fist, claw, fin, wing, none
            for (const sd of [-1, 1]) { B(sd < 0 ? 2 : 3, 'arm', [sd * xw, sh, 0], { phase: sd < 0 ? 0 : Math.PI, side: sd });
              const fw = o.fwd || 0.04, el = [sd * (xw + len * (o.out || 0.3)), sh - len * 0.5, fw], wr = [sd * (xw + len * (o.out || 0.3) * 1.25), sh - len, fw * 2 + 0.04];
              tube([[sd * xw, sh, 0], el, wr], [th * 1.25, th * 1.0, th * 1.1], c || bd, { cap0: 'round', cap1: 'round' }); /* a full upper arm, a forearm that swells toward the hand */
              const hc = o.hc || c || bd;
              if (hand === 'fist') blob(wr[0] - th * 1.8, wr[1] - th * 2.2, wr[2] - th * 1.6, wr[0] + th * 1.8, wr[1] + th * 1.2, wr[2] + th * 1.9, 0.6, hc, { n: 2 });
              else if (hand === 'claw') { ball(wr[0], wr[1], wr[2], th * 1.15, hc, { n: 2 }); for (const a of [-0.5, 0, 0.5]) cone([wr[0] + a * th, wr[1] - th * 0.6, wr[2] + th * 0.5], [a * 0.3, -1, 0.5], th * 2.4, th * 0.35, o.cc || '#f4f0e6'); }
              else if (hand === 'fin') plate([[sd * xw, sh, 0.02], [wr[0] + sd * th, wr[1] - th * 2, wr[2]], [wr[0] - sd * th, wr[1], wr[2] - th]], 0.03, hc);
              else if (hand !== 'none') { ball(wr[0], wr[1], wr[2], th * 1.5, hc, { n: 2 }); ball(wr[0] - sd * th * 0.9, wr[1] + th * 0.2, wr[2] + th * 0.9, th * 0.6, hc); } /* a mitt with a thumb */
              if (o.hand) o.hand(sd, wr); }
            bone = 0; };
          const tail = (pts, rr, c, o = {}) => { B(6, 'tail', pts[0]); tube(pts, rr, c || bd, Object.assign({ cap0: 'none', cap1: 'round' }, o)); if (o.tip) o.tip(pts[pts.length - 1]); bone = 0; };
          const flame = (x, y, z, h, r, dir) => { for (let i = 0; i < 3; i++) cone([x + (i - 1) * r * 0.6, y, z], dir ? [dir[0] + (i - 1) * 0.3, dir[1], dir[2]] : [(i - 1) * 0.3, 1, -0.2], h * (i === 1 ? 1 : 0.7), r, i === 1 ? glw : ac, { emis: true }); };
          const ears = (x, y, z, r, c, inner) => { for (const sd of [-1, 1]) { ball(sd * x, y, z, r, c, { n: 2 }); ball(sd * x, y, z + r * 0.3, r * 0.6, inner || bl, { n: 2 }); } };
          const fur = (cx, cy, cz, rx, ry, rz, n, len, r, c) => { for (let i = 0; i < n; i++) { const a = i * 2.39996, u = ((i * 0.618) % 1) * 2 - 1; const k = Math.sqrt(Math.max(0, 1 - u * u)); const d = [Math.cos(a) * k, u * 0.6, Math.sin(a) * k]; cone([cx + d[0] * rx, cy + d[1] * ry, cz + d[2] * rz], [d[0], d[1] - 0.6, d[2] * 0.6], len, r, Array.isArray(c) ? c[i % c.length] : c); } };

          // ======== FLAME ========
          if (P === 'embermonkey') { // a monkey kit with a heart-shaped face and a tail that burns at the tip
            legs(0.3, 0.1, 0.055, bd, 'paw', { fc: bl }); blob(-0.2, 0.26, -0.16, 0.2, 0.7, 0.16, 1, bd, { under: bl, tap: [0.85, 1] });
            arms(0.62, 0.18, 0.36, 0.05, bd, 'paw', { hc: bl });
            H(0.72); ball(0, 0.94, 0.02, 0.25, bd, { n: 3 }); blob(-0.18, 0.78, 0.08, 0.18, 1.06, 0.26, 1, bl); ball(0, 0.84, 0.24, 0.07, bl, { n: 2 });
            ears(0.25, 0.96, 0, 0.08, bd, bl); look(0.08, 0.95, 0.22, 0.055); mouth(0.8, 0.27, 0.05); flame(0, 1.16, -0.02, 0.22, 0.05); bone = 0;
            tail([[0, 0.36, -0.16], [0, 0.3, -0.36], [0, 0.56, -0.5], [0, 0.82, -0.4]], [0.04, 0.035, 0.03, 0.025], bd, { tip: (p) => { bone = 6; flame(p[0], p[1], p[2], 0.2, 0.05); } });
          } else if (P === 'torchmandrill') { // grown into a mandrill: a red nose ridge, blue cheeks and a mane of fire round the shoulders
            legs(0.46, 0.13, 0.07, bd, 'paw', { thigh: true, fc: dk }); blob(-0.26, 0.42, -0.2, 0.26, 1.02, 0.22, 1, bd, { under: bl, tap: [0.9, 1] });
            arms(0.94, 0.26, 0.6, 0.065, bd, 'paw', { hc: dk });
            for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; cone([Math.cos(a) * 0.22, 1.0, Math.sin(a) * 0.18], [Math.cos(a), 0.6, Math.sin(a)], 0.24, 0.06, i % 2 ? ac : glw, { emis: true }); }
            H(1.06); ball(0, 1.24, 0.02, 0.25, bd, { n: 3 }); blob(-0.07, 1.06, 0.12, 0.07, 1.28, 0.38, 0.9, '#d83a3a'); for (const sd of [-1, 1]) blob(sd * 0.1 - 0.06, 1.06, 0.1, sd * 0.1 + 0.06, 1.24, 0.32, 0.9, '#4a7ad8', { n: 2 });
            look(0.1, 1.3, 0.2, 0.05, { brow: dk, col: '#ffcf5a' }); mouth(1.06, 0.34, 0.05); for (const sd of [-1, 1]) cone([sd * 0.03, 1.06, 0.34], [0, -1, 0.1], 0.06, 0.015, '#f4f0e6'); bone = 0;
            tail([[0, 0.5, -0.2], [0, 0.6, -0.34]], [0.05, 0.035], bd, { tip: (p) => { bone = 6; flame(p[0], p[1], p[2], 0.18, 0.04); } });
          } else if (P === 'magmagorilla') { // a gorilla of cooled rock: the crust has split and the lava shows through, fists like anvils
            const R = hexMix(bd, '#2a2220', 0.65);
            legs(0.46, 0.2, 0.11, R, 'big', { thigh: true, fc: '#2a2220' }); blob(-0.38, 0.44, -0.3, 0.38, 1.1, 0.28, 1, R, { under: '#2a2220' }); blob(-0.5, 0.86, -0.34, 0.5, 1.56, 0.36, 1, R, { under: '#2a2220' });
            for (const pth of [[[-0.2, 1.4, 0.34], [-0.06, 1.2, 0.37], [-0.16, 1.0, 0.33]], [[0.22, 1.36, 0.34], [0.1, 1.16, 0.37], [0.2, 0.96, 0.32]], [[0, 1.06, 0.36], [0.02, 0.86, 0.3]]]) tube(pth, pth.map(() => 0.03), '#ffa23a', { emis: true, cap0: 'round', cap1: 'round' });
            arms(1.4, 0.48, 1.0, 0.13, R, 'fist', { hc: '#2a2220', out: 0.15, hand: (sd, w) => { for (let i = 0; i < 3; i++) ball(w[0] + (i - 1) * 0.08, w[1] - 0.06, w[2] + 0.2, 0.035, '#ffa23a', { emis: true, n: 1 }); } });
            H(1.5, 0.2); blob(-0.24, 1.42, 0.06, 0.24, 1.82, 0.42, 1, R); blob(-0.16, 1.44, 0.26, 0.16, 1.64, 0.46, 1, '#2a2220'); blob(-0.2, 1.66, 0.28, 0.2, 1.74, 0.46, 0.6, R, { n: 2 });
            look(0.08, 1.62, 0.42, 0.04, { glow: true, col: '#ffa23a' }); mouth(1.48, 0.46, 0.08, '#ffa23a'); for (let i = 0; i < 5; i++) cone([(i - 2) * 0.06, 1.8, 0.14 - Math.abs(i - 2) * 0.04], [0, 1, -0.3], 0.2 + (i === 2) * 0.08, 0.05, i % 2 ? ac : '#ffa23a', { emis: true }); bone = 0;
          } else if (P === 'wick') { // a stub of candle that walked off: wax drips, a little flame for a hat
            const wax = '#f4ead2';
            legs(0.14, 0.08, 0.05, wax, 'paw', { fc: wax }); tube([[0, 0.12, 0], [0, 0.8, 0]], [0.2, 0.19], wax, { cap0: 'flat', cap1: 'flat' });
            for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; tube([[Math.cos(a) * 0.19, 0.8, Math.sin(a) * 0.19], [Math.cos(a) * 0.2, 0.62 - (i % 2) * 0.12, Math.sin(a) * 0.2]], [0.035, 0.03], wax, { cap0: 'round', cap1: 'round' }); }
            arms(0.5, 0.18, 0.18, 0.035, wax, 'paw');
            H(0.6); tube([[0, 0.8, 0], [0, 0.9, 0]], [0.012, 0.012], '#2a2220', { cap0: 'none', cap1: 'none' }); blob(-0.07, 0.86, -0.07, 0.07, 1.14, 0.07, 1, '#ffd25a', { emis: true, tap: [1, 0.12] });
            look(0.07, 0.56, 0.18, 0.045); mouth(0.44, 0.2, 0.04); bone = 0;
          } else if (P === 'waxgiant') { // the candle melted and grew: a giant of slumped wax with a crown of candles and a lantern in hand
            const wax = '#f0e2c4', wax2 = '#d8c49e';
            legs(0.4, 0.18, 0.1, wax, 'big', { fc: wax2 }); blob(-0.36, 0.38, -0.3, 0.36, 1.34, 0.3, 0.9, wax, { under: wax2, tap: [0.85, 1] });
            for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; tube([[Math.cos(a) * 0.33, 1.2, Math.sin(a) * 0.28], [Math.cos(a) * 0.36, 0.9 - (i % 3) * 0.14, Math.sin(a) * 0.3]], [0.05, 0.035], wax, { cap0: 'round', cap1: 'round' }); }
            arms(1.16, 0.34, 0.66, 0.09, wax, 'paw', { hand: (sd, w) => { if (sd > 0) { tube([[w[0], w[1], w[2]], [w[0], w[1] - 0.24, w[2] + 0.04]], [0.012, 0.012], '#2a2220', { cap0: 'none', cap1: 'none' }); blob(w[0] - 0.1, w[1] - 0.48, w[2] - 0.06, w[0] + 0.1, w[1] - 0.24, w[2] + 0.14, 0.4, '#3a3230'); ball(w[0], w[1] - 0.36, w[2] + 0.04, 0.07, glw, { emis: true, n: 2 }); } } });
            H(1.3); look(0.12, 1.12, 0.3, 0.06, { brow: wax2 }); mouth(0.94, 0.3, 0.07);
            for (const [x, z, h] of [[0, 0, 0.3], [-0.2, -0.04, 0.2], [0.2, -0.04, 0.22]]) { tube([[x, 1.28, z], [x, 1.28 + h, z]], [0.06, 0.06], wax, { cap0: 'none', cap1: 'flat' }); blob(x - 0.05, 1.3 + h, z - 0.05, x + 0.05, 1.5 + h, z + 0.05, 1, '#ffd25a', { emis: true, tap: [1, 0.12] }); } bone = 0;
          } else if (P === 'redpanda') { // a red panda reared up on its hind legs the way they do when startled, a ringed tail with an ember at the tip
            const rust = hexMix('#c8501e', bd, 0.25), black = '#2a1a14', cream = '#f4ead8';
            legs(0.28, 0.12, 0.06, black, 'paw', { fc: black, thigh: true }); blob(-0.24, 0.26, -0.2, 0.24, 0.94, 0.2, 1, rust, { under: black, tap: [0.85, 1] });
            arms(0.86, 0.22, 0.34, 0.055, black, 'claw', { out: 0.5, fwd: 0.12, cc: cream });
            H(0.94); ball(0, 1.1, 0.02, 0.24, rust, { n: 3 }); blob(-0.16, 0.96, 0.1, 0.16, 1.14, 0.26, 1, cream); nose(0, 1.04, 0.27, 0.03, black);
            for (const sd of [-1, 1]) { blob(sd * 0.11 - 0.05, 1.12, 0.17, sd * 0.11 + 0.05, 1.2, 0.24, 1, cream, { n: 2 }); tube([[sd * 0.1, 1.06, 0.22], [sd * 0.14, 0.96, 0.2]], [0.02, 0.012], '#8a3a1a', { cap0: 'round', cap1: 'round' }); plate([[sd * 0.1, 1.26, 0.0], [sd * 0.26, 1.24, -0.02], [sd * 0.2, 1.4, -0.04]], 0.03, rust, { edge: cream }); }
            look(0.09, 1.1, 0.21, 0.045); mouth(0.99, 0.25, 0.03); bone = 0;
            const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([Math.sin(u * 2.4) * 0.12, 0.34 + u * 0.5, -0.2 - u * 0.36]); }
            B(6, 'tail', pts[0]); for (let i = 0; i < 10; i++) tube([pts[i], pts[i + 1]], [0.09 + 0.02 * Math.sin(i / 10 * Math.PI), 0.09 + 0.02 * Math.sin((i + 1) / 10 * Math.PI)], i % 2 ? '#8a3a1a' : rust, { cap0: 'none', cap1: i === 9 ? 'round' : 'none' });
            flame(pts[10][0], pts[10][1] + 0.04, pts[10][2], 0.2, 0.05); bone = 0;
          // ======== TIDE ========
          } else if (P === 'froglet') { // a froglet that still has a bit of tadpole tail: round, all eyes, webbed feet
            legs(0.14, 0.13, 0.05, bd, 'web', { fc: ac }); blob(-0.28, 0.12, -0.24, 0.28, 0.66, 0.24, 1, bd, { under: bl });
            arms(0.4, 0.24, 0.16, 0.04, bd, 'paw');
            H(0.5); for (const sd of [-1, 1]) ball(sd * 0.14, 0.66, 0.1, 0.11, bd, { n: 2 }); look(0.14, 0.7, 0.16, 0.075); mouth(0.46, 0.24, 0.14); bone = 0;
            tail([[0, 0.24, -0.22], [0, 0.22, -0.4]], [0.07, 0.01], bd, { tip: () => plate([[0, 0.24, -0.22], [0, 0.34, -0.42], [0, 0.12, -0.42]], 0.02, ac) });
          } else if (P === 'riverfrog') { // a lean river frog on long folded legs, a seaweed band round its head, a throat that puffs
            legs(0.42, 0.13, 0.065, bd, 'web', { digi: true, thigh: true, fc: ac }); blob(-0.22, 0.4, -0.2, 0.22, 1.0, 0.2, 1, bd, { under: bl, tap: [0.8, 1] });
            for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) blob(sd * 0.2 - 0.03, 0.6 + i * 0.12, -0.08, sd * 0.2 + 0.03, 0.66 + i * 0.12, 0.08, 0.6, dk, { n: 1 });
            arms(0.92, 0.22, 0.46, 0.05, bd, 'paw', { hand: (sd, w) => { for (const a of [-1, 0, 1]) ball(w[0] + a * 0.04, w[1] - 0.04, w[2] + 0.04, 0.025, ac, { n: 1 }); } });
            H(1.0); blob(-0.22, 0.98, -0.16, 0.22, 1.2, 0.2, 1, bd, { under: bl }); for (const sd of [-1, 1]) ball(sd * 0.14, 1.22, 0.06, 0.08, bd, { n: 2 }); look(0.14, 1.25, 0.1, 0.055, { brow: dk });
            mouth(1.06, 0.2, 0.16); ball(0, 0.98, 0.14, 0.09, hexMix(bl, '#ffffff', 0.3), { n: 2 }); hring(0, 1.14, 0.0, 0.215, 0.025, '#3f6b2a'); tube([[0, 1.14, -0.2], [0.06, 1.0, -0.32], [0, 0.86, -0.36]], [0.025, 0.02, 0.012], '#3f6b2a', { cap0: 'round', cap1: 'round' }); bone = 0;
          } else if (P === 'sumofrog') { // a bullfrog grown to a sumo: a vast belly, a rope belt, warts and a mouth as wide as it is
            legs(0.36, 0.26, 0.12, bd, 'web', { thigh: true, fc: ac }); blob(-0.56, 0.3, -0.46, 0.56, 1.36, 0.48, 1, bd, { under: bl });
            hring(0, 0.56, 0.0, 0.53, 0.06, ac); blob(-0.12, 0.3, 0.4, 0.12, 0.6, 0.52, 0.8, ac, { n: 2 });
            for (let i = 0; i < 10; i++) { const a = i * 2.4, y = 0.9 + (i % 4) * 0.1; ball(Math.cos(a) * 0.5, y, Math.sin(a) * 0.42 - 0.04, 0.035, hexMix(bd, dk, 0.3), { n: 1 }); }
            arms(1.1, 0.54, 0.54, 0.11, bd, 'fist', { out: 0.25 });
            H(1.3, 0.1); for (const sd of [-1, 1]) ball(sd * 0.22, 1.42, 0.24, 0.12, bd, { n: 2 }); look(0.22, 1.46, 0.28, 0.07, { brow: dk });
            tube([[-0.4, 1.12, 0.36], [0, 1.06, 0.48], [0.4, 1.12, 0.36]], [0.025, 0.025, 0.025], dk, { cap0: 'round', cap1: 'round' }); blob(-0.12, 1.36, -0.1, 0.12, 1.48, 0.1, 0.8, dk, { n: 2 }); bone = 0;
          } else if (P === 'otterpup') { // an otter pup standing up, a pebble in its paws, whiskers and a flat tail
            legs(0.2, 0.1, 0.05, bd, 'web', { fc: dk }); blob(-0.2, 0.18, -0.18, 0.2, 0.74, 0.18, 1, bd, { under: bl, tap: [0.8, 1] });
            arms(0.6, 0.16, 0.24, 0.045, bd, 'paw', { fwd: 0.12, out: 0.05, hand: (sd, w) => { if (sd > 0) ball(w[0] - 0.08, w[1], w[2] + 0.04, 0.06, '#9a948a', { n: 2 }); } });
            H(0.74); ball(0, 0.92, 0.02, 0.2, bd, { n: 3 }); blob(-0.12, 0.8, 0.1, 0.12, 0.94, 0.26, 1, bl); ball(0, 0.92, 0.24, 0.035, dk, { n: 2 });
            for (const sd of [-1, 1]) { ball(sd * 0.16, 1.02, -0.02, 0.05, bd, { n: 2 }); for (let i = 0; i < 2; i++) tube([[sd * 0.08, 0.88 - i * 0.03, 0.24], [sd * 0.24, 0.9 - i * 0.05, 0.22]], [0.006, 0.004], '#f4f0e6', { cap0: 'none', cap1: 'none' }); }
            look(0.08, 0.98, 0.18, 0.045); mouth(0.84, 0.25, 0.03); bone = 0;
            tail([[0, 0.24, -0.16], [0, 0.1, -0.4], [0, 0.04, -0.56]], [0.07, 0.06, 0.03], bd);
          } else if (P === 'shellotter') { // a sea otter knight: a scallop shell for a shield, an urchin on a stick, kelp for a sash
            legs(0.4, 0.12, 0.07, bd, 'web', { fc: dk, thigh: true }); blob(-0.26, 0.36, -0.22, 0.26, 1.16, 0.22, 1, bd, { under: bl, tap: [0.8, 1] });
            tube([[0.24, 1.1, 0.1], [0, 0.82, 0.24], [-0.24, 0.52, 0.12]], [0.04, 0.045, 0.04], '#3f6b2a', { cap0: 'round', cap1: 'round' });
            arms(1.04, 0.24, 0.5, 0.065, bd, 'paw', { fwd: 0.1, hand: (sd, w) => { if (sd < 0) { for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.2; plate([[w[0] - 0.06, w[1] - 0.06, w[2] + 0.08], [w[0] - 0.06 + Math.sin(a) * 0.3, w[1] + Math.cos(a) * 0.3 - 0.06, w[2] + 0.12], [w[0] - 0.06 + Math.sin(a + 0.22) * 0.3, w[1] + Math.cos(a + 0.22) * 0.3 - 0.06, w[2] + 0.12]], 0.025, i % 2 ? '#f4d8c0' : '#e8b89a'); } }
              else { tube([[w[0], w[1] - 0.2, w[2]], [w[0], w[1] + 0.3, w[2] + 0.1]], [0.025, 0.025], '#8a6a42', { cap0: 'round', cap1: 'none' }); ball(w[0], w[1] + 0.36, w[2] + 0.12, 0.09, '#4a2a5a', { n: 2 }); for (let i = 0; i < 12; i++) { const u = 1 - 2 * (i + 0.5) / 12, k = Math.sqrt(1 - u * u), a = i * 2.4; cone([w[0] + Math.cos(a) * k * 0.08, w[1] + 0.36 + u * 0.08, w[2] + 0.12 + Math.sin(a) * k * 0.08], [Math.cos(a) * k, u, Math.sin(a) * k], 0.1, 0.012, '#6a3a7a'); } } } });
            H(1.16); ball(0, 1.32, 0.02, 0.22, bd, { n: 3 }); blob(-0.14, 1.2, 0.1, 0.14, 1.34, 0.28, 1, bl); ball(0, 1.32, 0.27, 0.035, dk, { n: 2 }); for (const sd of [-1, 1]) ball(sd * 0.17, 1.44, -0.02, 0.05, bd, { n: 2 });
            look(0.09, 1.38, 0.2, 0.05, { brow: dk }); mouth(1.24, 0.27, 0.035); bone = 0;
            tail([[0, 0.44, -0.2], [0, 0.2, -0.46], [0, 0.06, -0.66]], [0.09, 0.08, 0.04], bd);
          } else if (P === 'axolotl') { // an axolotl on its hind legs: feathery gills fanned out, a grin, a finned tail
            legs(0.3, 0.12, 0.05, bd, 'paw', { fc: bd }); blob(-0.22, 0.26, -0.22, 0.22, 0.96, 0.2, 1, bd, { under: bl, tap: [0.85, 1] });
            arms(0.82, 0.2, 0.3, 0.045, bd, 'paw', { hand: (sd, w) => { for (const a of [-1, 0, 1]) ball(w[0] + a * 0.03, w[1] - 0.04, w[2] + 0.02, 0.02, bd, { n: 1 }); } });
            H(0.94); blob(-0.26, 0.92, -0.16, 0.26, 1.24, 0.22, 1, bd, { under: bl });
            for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const a = 0.5 + i * 0.5; const b = [sd * 0.24, 1.06 + (1 - i) * 0.06, -0.02]; tube([b, [sd * (0.24 + Math.cos(a) * 0.26), 1.06 + Math.sin(a) * 0.24 - 0.12, -0.08]], [0.025, 0.012], ac, { cap0: 'round', cap1: 'round' }); for (let k = 1; k < 4; k++) cone([sd * (0.24 + Math.cos(a) * 0.065 * k), 1.06 + (Math.sin(a) * 0.24 - 0.12) * k / 4 + (1 - i) * 0.06, -0.04], [0, 1, -0.2], 0.06, 0.015, glw); }
            look(0.12, 1.12, 0.18, 0.04); tube([[-0.14, 1.0, 0.18], [0, 0.97, 0.22], [0.14, 1.0, 0.18]], [0.012, 0.012, 0.012], dk, { cap0: 'round', cap1: 'round' }); bone = 0;
            tail([[0, 0.34, -0.2], [0, 0.22, -0.5], [0, 0.18, -0.76]], [0.1, 0.07, 0.02], bd, { tip: () => plate([[0, 0.4, -0.3], [0, 0.4, -0.76], [0, 0.04, -0.74], [0, 0.1, -0.3]], 0.02, ac) });

          // ======== BLOOM ========
          } else if (P === 'sporeling' || P === 'mushknight' || P === 'fungelder') { // a mushroom grows up: a sporeling, then a knight under its cap, then an elder with a forest on its head
            const k = P === 'sporeling' ? 0 : P === 'mushknight' ? 1 : 2, stalk = '#f2ead6', cap = bd, spot = '#fff6e0';
            const hip = [0.14, 0.38, 0.5][k], top = [0.6, 1.16, 1.5][k], cw = [0.36, 0.42, 0.78][k];
            legs(hip, [0.08, 0.12, 0.18][k], [0.05, 0.07, 0.1][k], stalk, k === 2 ? 'root' : 'paw', { fc: k === 2 ? '#6b4a2e' : '#d8ccb0' });
            blob(-0.2 - 0.06 * k, hip - 0.04, -0.18 - 0.05 * k, 0.2 + 0.06 * k, top, 0.18 + 0.05 * k, 1, stalk, { under: '#d8ccb0', tap: [0.85, 1] });
            arms(top - [0.18, 0.3, 0.4][k], 0.18 + 0.06 * k, [0.2, 0.46, 0.56][k], [0.04, 0.06, 0.08][k], stalk, 'paw', { hand: k === 1 ? (sd, w) => { if (sd > 0) { tube([[w[0], w[1] - 0.06, w[2]], [w[0], w[1] + 0.5, w[2] + 0.16]], [0.025, 0.012], '#8a6a42', { cap0: 'round', cap1: 'round' }); plate([[w[0] - 0.08, w[1] + 0.04, w[2] + 0.02], [w[0] + 0.08, w[1] + 0.04, w[2] + 0.02], [w[0], w[1] + 0.02, w[2] + 0.06]], 0.02, '#8a6a42'); } else blob(w[0] - 0.04, w[1] - 0.2, w[2] - 0.14, w[0] + 0.04, w[1] + 0.2, w[2] + 0.2, 1, cap, { under: spot }); } : k === 2 ? (sd, w) => { if (sd > 0) tube([[w[0], w[1] - 0.6, w[2]], [w[0] + 0.02, w[1], w[2] + 0.02], [w[0] - 0.04, w[1] + 0.5, w[2]]], [0.04, 0.035, 0.05], '#6b4a2e', { cap0: 'round', cap1: 'round' }); } : null });
            H(top - 0.1); const cy = top + [0.02, 0.0, 0.04][k];
            blob(-cw, cy - 0.06, -cw * 0.9, cw, cy + cw * [0.9, 0.7, 0.55][k], cw * 0.9, 1, cap, { tap: [1, 0.55] });
            plate(Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return [Math.cos(a) * cw * 0.92, cy - 0.02, Math.sin(a) * cw * 0.84]; }), 0.012, '#c8b48a');
            for (let i = 0; i < 6 + 3 * k; i++) { const a = i * 2.4, rr = (0.3 + (i % 3) * 0.22) * cw; ball(Math.cos(a) * rr, cy + cw * [0.9, 0.7, 0.55][k] * Math.sqrt(1 - (rr / cw) ** 2) * 0.95, Math.sin(a) * rr * 0.9, 0.045 + 0.02 * k, spot, { n: 2 }); }
            const fy = top - [0.2, 0.2, 0.28][k], fz = 0.18 + 0.05 * k; look(0.08 + 0.02 * k, fy, fz, 0.05 + 0.005 * k, { brow: k ? '#b8a888' : null }); mouth(fy - 0.12, fz + 0.04, 0.04);
            if (k === 1) { plate([[-0.18, fy + 0.1, fz + 0.02], [0.18, fy + 0.1, fz + 0.02], [0.16, fy + 0.02, fz + 0.04], [-0.16, fy + 0.02, fz + 0.04]], 0.02, cap); } // a visor of cap
            if (k === 2) { for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 1.8; cone([Math.sin(a) * 0.18, fy - 0.14, fz - 0.02 + Math.cos(a) * 0.04], [Math.sin(a) * 0.2, -1, 0.2], 0.4 + (i % 2) * 0.14, 0.04, i % 2 ? '#5f8a3a' : '#7aa04a'); }
              for (const [x, z, h] of [[-0.4, 0.1, 0.22], [0.3, -0.3, 0.28], [0.1, 0.4, 0.18], [-0.2, -0.44, 0.2]]) { const yy = cy + cw * 0.55 * Math.sqrt(Math.max(0, 1 - (x * x + z * z) / (cw * cw))); tube([[x, yy - 0.04, z], [x, yy + h, z]], [0.03, 0.025], stalk, { cap0: 'none', cap1: 'none' }); blob(x - 0.08, yy + h - 0.02, z - 0.08, x + 0.08, yy + h + 0.08, z + 0.08, 1, cap, { under: spot }); }
              for (let i = 0; i < 8; i++) { const a = i * 2.2; ball(Math.cos(a) * 0.9, cy + 0.3 + (i % 3) * 0.2, Math.sin(a) * 0.7, 0.025, glw, { emis: true, n: 1 }); } }
            bone = 0;
          } else if (P === 'mantisnymph' || P === 'orchidmantis') { // a mantis nymph on two legs, scythe arms folded; grown, its legs bloom into orchid petals
            const big = P === 'orchidmantis', pet = '#f4b8d8', hip = big ? 0.6 : 0.3;
            legs(hip, 0.1, big ? 0.04 : 0.035, bd, 'talon', { digi: true, fc: bd });
            if (big) for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) plate([[sd * 0.1, hip * (0.75 - i * 0.3), 0.0], [sd * 0.3, hip * (0.8 - i * 0.3), -0.06], [sd * 0.28, hip * (0.6 - i * 0.3), 0.06], [sd * 0.12, hip * (0.62 - i * 0.3), 0.04]], 0.02, pet, { edge: '#ffffff' });
            blob(-0.12, hip - 0.04, -0.12, 0.12, hip + 0.3, 0.12, 1, bd, { under: bl });
            blob(-0.16, hip - 0.04, -0.5, 0.16, hip + 0.22, -0.08, 1, bd, { under: bl }); // the abdomen, curled up behind
            tube([[0, hip + 0.26, 0.04], [0, hip + (big ? 0.62 : 0.46), 0.1]], [0.06, 0.05], bd, { cap0: 'none', cap1: 'none' });
            const sh = hip + (big ? 0.6 : 0.44);
            arms(sh, 0.08, big ? 0.36 : 0.24, big ? 0.04 : 0.035, bd, 'none', { fwd: 0.16, out: 0.1, hand: (sd, w) => { tube([[w[0], w[1], w[2]], [w[0], w[1] + (big ? 0.34 : 0.22), w[2] + 0.1]], [0.035, 0.02], bd, { cap0: 'round', cap1: 'round' }); for (let i = 0; i < 3; i++) cone([w[0], w[1] + 0.06 + i * 0.08, w[2] + 0.04], [0, -0.3, 1], 0.06, 0.012, '#f4f0e6'); if (big) plate([[w[0], w[1], w[2]], [w[0] + sd * 0.12, w[1] + 0.18, w[2] - 0.04], [w[0], w[1] + 0.34, w[2] + 0.1]], 0.02, pet); } });
            H(sh + 0.04, 0.1); plate([[-0.18, sh + 0.14, 0.12], [0.18, sh + 0.14, 0.12], [0, sh - 0.12, 0.2]], 0.07, bd);
            for (const sd of [-1, 1]) { ball(sd * 0.16, sh + 0.14, 0.12, 0.07, ac, { emis: true, n: 2 }); ball(sd * 0.17, sh + 0.15, 0.17, 0.025, '#16121e', { n: 1 }); tube([[sd * 0.04, sh + 0.18, 0.14], [sd * 0.12, sh + 0.4, 0.2], [sd * 0.22, sh + 0.5, 0.16]], [0.01, 0.008, 0.006], bd, { cap0: 'none', cap1: 'none' }); }
            if (big) for (let i = 0; i < 2; i++) for (const sd of [-1, 1]) plate([[0, sh + 0.18, 0.08], [sd * (0.22 + i * 0.1), sh + 0.34 + i * 0.08, 0.0], [sd * 0.08, sh + 0.3, 0.04]], 0.02, pet);
            bone = 0;
            if (big) for (const sd of [-1, 1]) plate([[sd * 0.08, hip + 0.2, -0.14], [sd * 0.4, hip + 0.38, -0.36], [sd * 0.3, hip + 0.06, -0.5]], 0.015, hexMix(bd, '#ffffff', 0.4), { edge: pet });
          } else if (P === 'mosssloth') { // a sloth on its hind legs, arms down to its ankles, three long hooks on each hand, moss and flowers on its back
            legs(0.34, 0.16, 0.08, bd, 'paw', { fc: dk }); blob(-0.32, 0.32, -0.28, 0.32, 1.12, 0.26, 1, bd, { under: bl });
            for (let i = 0; i < 9; i++) { const a = i * 2.4; ball(Math.cos(a) * 0.2, 0.6 + (i % 4) * 0.14, -0.22 - Math.abs(Math.sin(a)) * 0.04, 0.09, i % 3 ? '#5f8a3a' : '#7aa04a', { n: 2 }); }
            for (const [y, x] of [[0.9, 0.12], [0.66, -0.14]]) { for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2; ball(x + Math.cos(a) * 0.04, y + Math.sin(a) * 0.04, -0.32, 0.03, '#f4a3d2', { n: 1 }); } }
            arms(1.0, 0.3, 0.86, 0.07, bd, 'none', { out: 0.15, hand: (sd, w) => { for (const a of [-1, 0, 1]) curl([w[0] + a * 0.04, w[1], w[2]], [0, -1, 0.3], 0.22, 0.025, '#e8dcc0', [0, 0, 0.8]); } });
            H(1.1); ball(0, 1.26, 0.04, 0.24, bd, { n: 3 }); blob(-0.18, 1.12, 0.12, 0.18, 1.36, 0.28, 1, bl);
            for (const sd of [-1, 1]) blob(sd * 0.1 - 0.08, 1.18, 0.22, sd * 0.1 + 0.08, 1.3, 0.29, 0.8, dk, { n: 2 }); look(0.1, 1.24, 0.26, 0.035);
            ball(0, 1.16, 0.3, 0.035, dk, { n: 2 }); tube([[-0.06, 1.1, 0.28], [0, 1.08, 0.3], [0.06, 1.1, 0.28]], [0.01, 0.01, 0.01], dk, { cap0: 'round', cap1: 'round' }); bone = 0;

          // ======== STONE ========
          } else if (P === 'molekit' || P === 'minermole' || P === 'drillmole') { // a star-nosed mole, then a miner with a lamp, then a giant with drills for hands
            const k = P === 'molekit' ? 0 : P === 'minermole' ? 1 : 2, pink = '#f4a3b8';
            const hip = [0.2, 0.34, 0.44][k], top = [0.74, 1.12, 1.5][k], w = [0.26, 0.32, 0.46][k];
            legs(hip, 0.1 + 0.04 * k, 0.05 + 0.025 * k, bd, 'paw', { fc: pink });
            blob(-w, hip - 0.06, -w * 0.85, w, top, w * 0.85, 1, bd, { under: bl, tap: [0.75, 1] });
            if (k === 2) for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) cone([sd * 0.42, 1.24 + i * 0.06, -0.1 + i * 0.1], [sd, 1, 0], 0.3, 0.07, glw, { emis: true });
            if (k === 1) { tube([[0.26, 1.0, -0.24], [-0.24, 0.6, -0.26]], [0.025, 0.025], '#8a6a42', { cap0: 'round', cap1: 'round' }); blob(-0.2, 0.5, -0.5, 0.2, 0.86, -0.22, 0.8, '#8a6a42'); for (let i = 0; i < 3; i++) cone([(i - 1) * 0.1, 0.86, -0.36], [0, 1, 0], 0.16, 0.05, glw, { emis: true }); }
            arms(top - [0.3, 0.36, 0.48][k], w - 0.02, [0.24, 0.42, 0.56][k], [0.05, 0.07, 0.1][k], bd, k === 2 ? 'none' : 'none', { out: 0.25, fwd: 0.08, hand: (sd, wr) => {
              if (k === 2) { const L = 0.6; for (let i = 0; i < 6; i++) hring(wr[0], wr[1] - 0.04 - i * L / 7, wr[2] + 0.06, 0.14 * (1 - i / 7), 0.02, '#c8c0b0'); cone([wr[0], wr[1], wr[2] + 0.06], [0, -1, 0.15], L, 0.15, '#9a948a', { segs: 8 }); }
              else { blob(wr[0] - 0.1 - 0.04 * k, wr[1] - 0.12, wr[2] - 0.04, wr[0] + 0.1 + 0.04 * k, wr[1] + 0.04, wr[2] + 0.12, 0.7, pink, { n: 2 }); for (let i = 0; i < 4; i++) cone([wr[0] + (i - 1.5) * 0.05, wr[1] - 0.1, wr[2] + 0.08], [0, -1, 0.3], 0.1 + 0.03 * k, 0.018, '#f4f0e6'); }
              if (k === 1 && sd > 0) { tube([[wr[0], wr[1] - 0.06, wr[2] + 0.04], [wr[0], wr[1] + 0.44, wr[2] + 0.1]], [0.025, 0.025], '#8a6a42', { cap0: 'round', cap1: 'round' }); tube([[wr[0] - 0.22, wr[1] + 0.4, wr[2] + 0.06], [wr[0], wr[1] + 0.48, wr[2] + 0.1], [wr[0] + 0.22, wr[1] + 0.4, wr[2] + 0.06]], [0.015, 0.03, 0.015], '#8a8890', { cap0: 'round', cap1: 'round' }); } } });
            H(top - 0.2, 0.1); const ny = top - [0.3, 0.34, 0.5][k], nz = w * 0.85;
            for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; tube([[0, ny, nz], [Math.cos(a) * 0.08, ny + Math.sin(a) * 0.08, nz + 0.06]], [0.03, 0.015], pink, { cap0: 'none', cap1: 'round' }); } ball(0, ny, nz + 0.02, 0.05, pink, { n: 2 });
            for (const sd of [-1, 1]) ball(sd * 0.1, ny + 0.12, nz - 0.03, 0.02, '#16121e', { n: 1 });
            if (k >= 1) { blob(-w * 0.8, top - 0.12, -w * 0.7, w * 0.8, top + 0.08, w * 0.7, 0.9, k === 2 ? '#8a8890' : '#e2b84a'); tube([[0, top - 0.02, w * 0.6], [0, top - 0.02, w * 0.74]], [0.06, 0.06], '#3a3230', { cap0: 'none', cap1: 'flat' }); ball(0, top - 0.02, w * 0.76, 0.05, '#fff3b0', { emis: true, n: 2 }); }
            bone = 0;
          } else if (P === 'pangolinpup' || P === 'pangolinknight') { // a pangolin up on its hind legs, overlapping scales; grown, the scales are a knight's armour
            const big = P === 'pangolinknight', sc = hexMix(bd, dk, 0.25), hip = big ? 0.42 : 0.2, top = big ? 1.2 : 0.68;
            legs(hip, 0.11, big ? 0.07 : 0.05, bd, 'paw', { fc: dk, thigh: big });
            blob(-0.22 - 0.06 * big, hip - 0.04, -0.2, 0.22 + 0.06 * big, top, 0.2, 1, bl);
            const rows = big ? 6 : 4; for (let r = 0; r < rows; r++) { const y = hip + (top - hip) * (r + 0.4) / rows, n = 7; for (let i = 0; i < n; i++) { const a = Math.PI * (0.15 + 0.7 * i / (n - 1)) + Math.PI, wx = 0.24 + 0.06 * big; blob(Math.cos(a) * wx - 0.07, y - 0.06, Math.sin(a) * 0.2 - 0.07 + 0.02, Math.cos(a) * wx + 0.07, y + 0.06, Math.sin(a) * 0.2 + 0.05, 0.6, r % 2 ? sc : bd, { n: 2 }); } }
            arms(top - 0.14, 0.2 + 0.06 * big, big ? 0.5 : 0.26, big ? 0.06 : 0.04, bd, 'claw', { fwd: 0.06, cc: dk });
            H(top - 0.06, 0.04); blob(-0.14, top - 0.08, -0.04, 0.14, top + 0.16, 0.24, 1, bl); cone([0, top - 0.02, 0.2], [0, -0.2, 1], 0.14, 0.07, bl); nose(0, top - 0.04, 0.34, 0.02);
            for (let i = 0; i < 3; i++) blob(-0.12 + i * 0.01, top + 0.08 + i * 0.03, -0.1 - i * 0.04, 0.12 - i * 0.01, top + 0.2 + i * 0.03, 0.12 - i * 0.04, 0.6, sc, { n: 2 });
            look(0.08, top + 0.06, 0.18, 0.035, { brow: big ? dk : null }); bone = 0;
            tail([[0, hip + 0.06, -0.18], [0, hip * 0.5, -0.46], [0, 0.08, -0.7], [0, 0.06, -0.86]], [0.12, 0.1, 0.07, 0.03], bd, { tip: () => { bone = 6; for (let i = 0; i < 5; i++) blob(-0.09 + i * 0.012, hip * (0.9 - i * 0.18) + 0.02, -0.26 - i * 0.14, 0.09 - i * 0.012, hip * (0.9 - i * 0.18) + 0.12, -0.12 - i * 0.14, 0.6, sc, { n: 2 }); } });
            if (big) { for (const sd of [-1, 1]) blob(sd * 0.3 - 0.1, top - 0.24, -0.12, sd * 0.3 + 0.1, top - 0.04, 0.12, 0.5, sc, { n: 2 }); for (let i = 0; i < 4; i++) cone([0, top + 0.06 - i * 0.12, -0.2], [0, 0.4, -1], 0.14, 0.04, sc); }
          } else if (P === 'menhir') { // a standing stone that woke: runes glowing down its face, stone hands that float beside it, moss on its crown
            blob(-0.32, 0.0, -0.24, 0.32, 1.7, 0.24, 0.55, bd, { under: hexMix(bd, dk, 0.3), tap: [0.8, 1] });
            blob(-0.26, 1.58, -0.2, 0.24, 1.76, 0.16, 0.9, '#5f8a3a');
            for (const pth of [[[0, 1.16, 0.25], [0, 0.96, 0.26]], [[-0.1, 1.06, 0.255], [0.1, 1.06, 0.255]], [[-0.08, 0.8, 0.26], [0.08, 0.66, 0.26], [-0.08, 0.52, 0.26]], [[0, 0.38, 0.26], [0, 0.22, 0.25]]]) tube(pth, pth.map(() => 0.022), glw, { emis: true, cap0: 'round', cap1: 'round' });
            B(2, 'arm', [-0.5, 1.0, 0], { phase: 0, side: -1 }); blob(-0.66, 0.66, -0.1, -0.44, 0.94, 0.12, 0.5, bd); B(3, 'arm', [0.5, 1.0, 0], { phase: Math.PI, side: 1 }); blob(0.44, 0.66, -0.1, 0.66, 0.94, 0.12, 0.5, bd); bone = 0;
            H(1.3); for (const sd of [-1, 1]) blob(sd * 0.11 - 0.07, 1.36, 0.22, sd * 0.11 + 0.07, 1.4, 0.26, 0.6, glw, { emis: true, n: 1 }); bone = 0;
            B(4, 'leg', [-0.12, 0.1, 0], { phase: 0, len: 0.1 }); B(5, 'leg', [0.12, 0.1, 0], { phase: Math.PI, len: 0.1 }); bone = 0; legLen = 0.1; hover = 0.12;

          // ======== GALE ========
          } else if (P === 'batpup' || P === 'galebat' || P === 'tempestbat') { // a bat pup, a gale bat whose arms are wings, then a tempest lord in a cape of storm
            const k = P === 'batpup' ? 0 : P === 'galebat' ? 1 : 2, mem = hexMix(bd, '#2a2430', 0.55);
            const hip = [0.2, 0.42, 0.56][k], top = [0.62, 1.08, 1.4][k], w = [0.22, 0.22, 0.26][k];
            legs(hip, 0.08 + 0.02 * k, 0.04 + 0.015 * k, dk, 'talon', { fc: dk });
            blob(-w, hip - 0.04, -w * 0.85, w, top, w * 0.85, 1, bd, { under: bl, tap: [0.8, 1] });
            if (k >= 1) fur(0, top - 0.04, 0, w, 0.06, w * 0.8, 14, 0.14, 0.04, [bl, bd]);
            const span = [0.4, 0.9, 1.3][k];
            for (const sd of [-1, 1]) { B(sd < 0 ? 2 : 3, 'arm', [sd * w, top - 0.12, 0], { phase: sd < 0 ? 0 : Math.PI, side: sd });
              const sh = [sd * w, top - 0.12, 0], el = [sd * (w + span * 0.45), top + span * 0.15, -0.06], wr = [sd * (w + span * 0.85), top - span * 0.1, -0.1];
              tube([sh, el, wr], [0.04 + 0.01 * k, 0.035, 0.025], dk, { cap0: 'round', cap1: 'round' });
              const tips = [0, 1, 2].map(i => [sd * (w + span * (1.0 - i * 0.26)), top - span * (0.3 + i * 0.26), -0.14 - i * 0.04]); const hipP = [sd * (w + 0.02), hip + 0.12, -0.1];
              for (const tip of tips) tube([wr, tip], [0.016, 0.008], dk, { cap0: 'none', cap1: 'round' });
              plate([sh, el, wr], 0.02, mem); const chain = [tips[0], tips[1], tips[2], hipP];
              for (let i = 0; i < 3; i++) { const a = chain[i], b = chain[i + 1], m = [(a[0] + b[0]) / 2 * 0.86 + wr[0] * 0.14, (a[1] + b[1]) / 2 * 0.86 + wr[1] * 0.14, (a[2] + b[2]) / 2]; plate([wr, a, m], 0.02, mem); plate([wr, m, b], 0.02, mem); }
              plate([sh, wr, hipP], 0.02, mem); }
            bone = 0;
            H(top - 0.04); ball(0, top + 0.08, 0.04, [0.22, 0.2, 0.22][k], bd, { n: 3 });
            for (const sd of [-1, 1]) plate([[sd * 0.08, top + 0.18, 0.02], [sd * 0.26, top + 0.18, -0.02], [sd * [0.26, 0.24, 0.3][k], top + [0.44, 0.4, 0.46][k], -0.06]], 0.025, bd, { edge: bl });
            look(0.09, top + 0.1, 0.2, [0.06, 0.05, 0.045][k], { brow: k ? dk : null, glow: k === 2, col: k === 2 ? glw : null });
            if (k >= 1) plate([[-0.04, top + 0.02, 0.24], [0.04, top + 0.02, 0.24], [0, top + 0.1, 0.25]], 0.02, dk); mouth(top - 0.04, 0.22, 0.05); for (const sd of [-1, 1]) cone([sd * 0.03, top - 0.04, 0.22], [0, -1, 0.1], 0.05, 0.012, '#f4f0e6');
            if (k === 2) { for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; tube([[Math.cos(a) * 0.1, top + 0.3, Math.sin(a) * 0.1], [Math.cos(a + 0.8) * 0.18, top + 0.38, Math.sin(a + 0.8) * 0.18]], [0.02, 0.008], glw, { emis: true, cap0: 'round', cap1: 'round' }); } }
            bone = 0;
            if (k === 2) for (let i = 0; i < 5; i++) plate([[(i - 2) * 0.1, top - 0.1, -0.2], [(i - 2) * 0.16, 0.1, -0.44], [(i - 2) * 0.16 + 0.08, 0.16, -0.4]], 0.02, mem);
          } else if (P === 'lemurkid' || P === 'skylemur') { // a lemur with the big round eyes and the ringed tail; grown, skin sails let it glide
            const big = P === 'skylemur', hip = big ? 0.46 : 0.24, top = big ? 1.06 : 0.66;
            legs(hip, 0.1, big ? 0.06 : 0.045, bd, 'paw', { fc: dk, thigh: true });
            blob(-0.2, hip - 0.04, -0.18, 0.2, top, 0.18, 1, bd, { under: bl, tap: [0.85, 1] });
            arms(top - 0.08, 0.18, big ? 0.5 : 0.3, big ? 0.05 : 0.04, bd, 'paw', { hc: dk });
            if (big) for (const sd of [-1, 1]) plate([[sd * 0.18, top - 0.1, 0], [sd * 0.56, top - 0.36, 0.02], [sd * 0.4, hip, -0.02], [sd * 0.18, hip - 0.02, -0.04]], 0.015, hexMix(bd, bl, 0.4), { edge: dk });
            H(top); ball(0, top + 0.18, 0.02, 0.22, bd, { n: 3 }); blob(-0.16, top + 0.04, 0.1, 0.16, top + 0.28, 0.24, 1, '#f4f0e6'); cone([0, top + 0.08, 0.22], [0, -0.2, 1], 0.1, 0.06, dk); nose(0, top + 0.07, 0.31, 0.025);
            for (const sd of [-1, 1]) blob(sd * 0.09 - 0.07, top + 0.14, 0.16, sd * 0.09 + 0.07, top + 0.28, 0.24, 1, dk, { n: 2 });
            look(0.09, top + 0.21, 0.22, 0.065, { col: '#ffb02a' }); ears(0.2, top + 0.32, -0.02, 0.06, bd, dk);
            if (big) fur(0, top + 0.1, 0, 0.22, 0.1, 0.2, 14, 0.1, 0.03, '#f4f0e6'); bone = 0;
            const pts = [], rr = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([0, hip + 0.1 + u * (big ? 1.2 : 0.8) - u * u * 0.2, -0.18 - u * 0.3 + Math.sin(u * 3) * 0.12]); rr.push(0.05 * (1 - u * 0.4)); }
            B(6, 'tail', pts[0]); for (let i = 0; i < 12; i++) tube([pts[i], pts[i + 1]], [rr[i], rr[i + 1]], i % 2 ? dk : '#f4f0e6', { cap0: 'none', cap1: i === 11 ? 'round' : 'none' }); bone = 0;
          } else if (P === 'gibbon') { // a gibbon: arms longer than it is tall, a white ring round its face, a scarf streaming in the wind
            legs(0.4, 0.1, 0.05, bd, 'paw', { fc: dk }); blob(-0.18, 0.38, -0.16, 0.18, 0.96, 0.16, 1, bd, { under: bl });
            arms(0.92, 0.16, 1.1, 0.045, bd, 'paw', { out: 0.38, hc: dk });
            tube([[0.14, 0.96, 0.08], [-0.14, 0.94, 0.1], [-0.18, 0.98, -0.14], [0.06, 1.04, -0.5], [-0.1, 1.1, -0.8]], [0.05, 0.05, 0.045, 0.04, 0.03], ac, { cap0: 'round', cap1: 'round' });
            H(0.96); ball(0, 1.12, 0.02, 0.19, bd, { n: 3 }); ring(0, 1.12, 0.14, 0.15, 0.15, 0.03, '#f4f0e6'); blob(-0.12, 1.0, 0.1, 0.12, 1.22, 0.2, 1, dk);
            look(0.06, 1.15, 0.18, 0.04); nose(0, 1.07, 0.21, 0.02); mouth(1.02, 0.2, 0.04, '#f4f0e6'); bone = 0;

          // ======== FROST ========
          } else if (P === 'penguinchick' || P === 'emperor' || P === 'icegeneral') { /* a chip of pack ice that hatched: a snowball chick with an iceberg tip on its head, a skater whose flippers and feet have grown blades, then a general in ice armour with a lance */
            const k = P === 'penguinchick' ? 0 : P === 'emperor' ? 1 : 2, black = '#243f73', gold = '#9fe8ff', chick = '#8fc4e8', ice = '#9ff2ff';
            const hip = [0.1, 0.16, 0.22][k], top = [0.7, 1.24, 1.6][k], w = [0.3, 0.3, 0.38][k];
            legs(hip, 0.1 + 0.02 * k, 0.04 + 0.01 * k, '#e8903a', 'web', { fc: '#e8903a' });
            blob(-w, hip - 0.04, -w * 0.9, w, top, w * 0.9, 1, k === 0 ? chick : black, { under: k === 0 ? '#eaf6ff' : '#f4f6fa', tap: [0.75, 1] });
            cone([0, hip + 0.1, -w * 0.82], [0, 0.35, -1], 0.14 + 0.08 * k, 0.05, ice, { emis: true }); /* an icicle for a tail */
            if (k) for (const sd of [-1, 1]) blob(sd * 0.12 - 0.018, 0, -0.08, sd * 0.12 + 0.018, 0.035, 0.26, 0.4, ice, { emis: true }); /* skate blades */
            if (k) { blob(-w * 0.72, hip + 0.04, 0.0, w * 0.72, top - 0.2, w * 0.92, 1, '#f4f6fa'); for (let i = 0; i < 3; i++) { const cy = top - 0.42 - i * 0.17, r = 0.06 - i * 0.012; plate([[0, cy + r * 1.5, w * 0.93], [r, cy, w * 0.95], [0, cy - r * 1.5, w * 0.93], [-r, cy, w * 0.95]], 0.012, ice, { emis: true }); } } /* ice diamonds down the chest */
            else ball(0, hip + 0.3, w * 0.86, 0.045, ice, { emis: true });
            if (k === 0) { cone([0, top + 0.18, -0.02], [0.1, 1, -0.2], 0.3, 0.085, ice, { emis: true }); cone([-0.09, top + 0.17, 0.0], [-0.5, 1, -0.1], 0.16, 0.05, '#eaf6ff'); cone([0.1, top + 0.16, -0.04], [0.6, 1, -0.3], 0.13, 0.045, '#eaf6ff'); } /* the tip of the iceberg */
            arms(top - 0.16, w - 0.02, [0.24, 0.5, 0.6][k], [0.05, 0.06, 0.07][k], k === 0 ? chick : black, 'fin', { out: 0.12, hand: k === 1 ? (sd, wr) => { cone([wr[0], wr[1] + 0.06, wr[2]], [sd * 0.35, -1, -0.15], 0.3, 0.055, ice, { emis: true }); } : k === 2 ? (sd, wr) => { if (sd > 0) { tube([[wr[0], wr[1] - 0.5, wr[2] + 0.04], [wr[0], wr[1] + 1.0, wr[2] + 0.14]], [0.03, 0.025], '#c8d8e8', { cap0: 'round', cap1: 'none' }); cone([wr[0], wr[1] + 1.0, wr[2] + 0.14], [0, 1, 0.1], 0.36, 0.08, ice, { emis: true }); } } : null });
            H(top - 0.1); const hy = top + [0.0, 0.1, 0.12][k];
            ball(0, hy, 0.02, [0.24, 0.2, 0.22][k], k === 0 ? chick : black, { n: 3 }); if (k === 0) { blob(-0.17, hy - 0.15, 0.06, 0.17, hy + 0.08, 0.24, 1, '#f4f8ff'); for (const sd of [-1, 1]) ball(sd * 0.2, hy - 0.07, 0.1, 0.035, ice, { emis: true }); }
            if (k === 1) { for (let i = 0; i < 4; i++) cone([0, hy + 0.15 - i * 0.025, 0.1 - i * 0.075], [0, 1, -0.4 - i * 0.35], 0.13 + i * 0.07, 0.045, ice, { emis: true }); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; cone([Math.cos(a) * 0.17, hy - 0.17, Math.sin(a) * 0.15], [Math.cos(a), -0.5, Math.sin(a)], 0.1, 0.04, '#f4f8ff'); } } /* a swept crest of shards, a ruff of frost */
            if (k) for (const sd of [-1, 1]) blob(sd * 0.16 - 0.05, hy - 0.16, -0.06, sd * 0.16 + 0.05, hy + 0.02, 0.08, 1, gold, { n: 2 });
            cone([0, hy - 0.02, 0.18], [0, -0.15, 1], [0.1, 0.2, 0.26][k], 0.045, k ? '#ffb347' : '#ffcf7a');
            look([0.085, 0.09, 0.1][k], hy + 0.03, [0.19, 0.15, 0.17][k], [0.058, 0.055, 0.045][k], { col: '#2aa8e8', brow: k === 2 ? '#c8d8e8' : null });
            if (k === 2) { blob(-0.2, hy + 0.1, -0.16, 0.2, hy + 0.24, 0.18, 0.8, '#c8d8e8'); for (let i = 0; i < 5; i++) cone([(i - 2) * 0.07, hy + 0.2, 0.02 - Math.abs(i - 2) * 0.04], [0, 1, -0.2], 0.18 + (i === 2) * 0.1, 0.035, ice, { emis: true }); }
            bone = 0;
            if (k === 2) { for (const sd of [-1, 1]) { blob(sd * w - 0.14, top - 0.26, -0.16, sd * w + 0.14, top - 0.04, 0.16, 0.4, '#c8d8e8'); for (let i = 0; i < 3; i++) cone([sd * (w + 0.06), top - 0.06, -0.08 + i * 0.08], [sd, 1, 0], 0.16, 0.035, ice, { emis: true }); }
              for (let i = 0; i < 5; i++) plate([[(i - 2) * 0.12, top - 0.1, -w * 0.8], [(i - 2) * 0.16, 0.12, -w - 0.12], [(i - 2) * 0.16 + 0.12, 0.14, -w - 0.08]], 0.02, '#3a6ab8'); }
          } else if (P === 'polarcub' || P === 'polarbear') { // a polar cub, then the bear on its hind legs, ice grown over its shoulders like pauldrons
            const big = P === 'polarbear', white = '#f2f4f6', hip = big ? 0.56 : 0.22, top = big ? 1.5 : 0.72, w = big ? 0.46 : 0.3;
            legs(hip, w * 0.5, big ? 0.13 : 0.07, white, 'paw', { fc: '#d8dce4', thigh: true });
            blob(-w, hip - 0.06, -w * 0.85, w, top, w * 0.85, 1, white, { under: '#d8dce4' });
            arms(top - 0.12, w - 0.04, big ? 0.82 : 0.32, big ? 0.13 : 0.07, white, 'claw', { out: 0.15, fwd: 0.08, cc: '#3a3230' });
            if (big) for (const sd of [-1, 1]) { for (let i = 0; i < 5; i++) cone([sd * (w - 0.06), top - 0.06, -0.16 + i * 0.08], [sd * 0.8, 1, (i - 2) * 0.2], 0.22 + (i % 2) * 0.1, 0.06, glw, { emis: true }); }
            H(top - 0.06, 0.06); const hy = top + (big ? 0.16 : 0.12); ball(0, hy, 0.06, big ? 0.3 : 0.24, white, { n: 3 });
            blob(-0.12, hy - 0.14, 0.2, 0.12, hy + 0.02, big ? 0.48 : 0.38, 1, '#e8eaee'); nose(0, hy - 0.02, big ? 0.48 : 0.38, 0.045);
            ears(big ? 0.22 : 0.18, hy + (big ? 0.24 : 0.2), 0.0, big ? 0.07 : 0.07, white, '#d8dce4'); look(big ? 0.12 : 0.1, hy + 0.06, big ? 0.3 : 0.24, big ? 0.04 : 0.055, { brow: big ? '#c8ccd4' : null }); mouth(hy - 0.12, big ? 0.44 : 0.35, 0.04); bone = 0;
            tail([[0, hip + 0.1, -w * 0.8], [0, hip + 0.06, -w * 0.9]], [0.07, 0.05], white);
          } else if (P === 'stoat') { // an ermine in its winter coat, standing tall and nosy, black at the tail tip, a red scarf
            legs(0.3, 0.08, 0.04, '#f4f6fa', 'paw', { fc: '#f4f6fa' }); blob(-0.14, 0.28, -0.14, 0.14, 1.14, 0.14, 1, '#f4f6fa', { under: '#e0e4ea' });
            hring(0, 1.04, 0.0, 0.15, 0.04, '#c8302a'); tube([[0.1, 1.02, 0.1], [0.14, 0.86, 0.16], [0.12, 0.76, 0.16]], [0.04, 0.04, 0.03], '#c8302a', { cap0: 'round', cap1: 'round' });
            arms(0.92, 0.12, 0.24, 0.03, '#f4f6fa', 'paw', { fwd: 0.1, out: 0.05 });
            H(1.12); ball(0, 1.24, 0.04, 0.15, '#f4f6fa', { n: 3 }); cone([0, 1.2, 0.14], [0, -0.2, 1], 0.12, 0.08, '#f4f6fa'); nose(0, 1.18, 0.27, 0.025);
            ears(0.12, 1.36, 0.0, 0.045, '#f4f6fa', '#f4c8d0'); look(0.07, 1.27, 0.15, 0.04, { col: '#16121e' }); bone = 0;
            tail([[0, 0.34, -0.12], [0, 0.2, -0.36], [0, 0.26, -0.56]], [0.05, 0.05, 0.04], '#f4f6fa', { tip: (p) => { bone = 6; ball(p[0], p[1], p[2] - 0.06, 0.07, '#16121e', { n: 2 }); } });

          // ======== SPARK ========
          } else if (P === 'windupbot' || P === 'coilsoldier' || P === 'thundermech') { // a wind-up tin toy, a soldier with coils for arms, a mech with a reactor in its chest
            const k = P === 'windupbot' ? 0 : P === 'coilsoldier' ? 1 : 2, metal = hexMix(bd, '#9aa0b0', 0.5), metal2 = hexMix(metal, '#3a3d48', 0.5), cu = '#c87a3a';
            const hip = [0.18, 0.44, 0.62][k], top = [0.66, 1.2, 1.7][k], w = [0.26, 0.26, 0.46][k];
            legs(hip, w * 0.5, [0.05, 0.06, 0.12][k], metal2, 'boot', { fc: metal2 });
            if (k === 0) ball(0, (hip + top) / 2, 0, (top - hip) / 2 + 0.04, metal, { n: 3 }); else blob(-w, hip - 0.04, -w * 0.7, w, top, w * 0.7, 0.55, metal, { under: metal2 });
            ball(0, (hip + top) / 2 + 0.06, w * (k ? 0.7 : 1) * (k ? 1 : 0.95), [0.07, 0.09, 0.14][k], glw, { emis: true, n: 2 });
            if (k === 0) { tube([[0, 0.44, -0.26], [0, 0.44, -0.38]], [0.02, 0.02], cu, { cap0: 'none', cap1: 'none' }); for (const sd of [-1, 1]) blob(sd * 0.04, 0.38, -0.42, sd * 0.16, 0.5, -0.38, 0.6, cu, { n: 2 }); }
            if (k === 2) for (const sd of [-1, 1]) { tube([[sd * 0.34, top, -0.1], [sd * 0.34, top + 0.36, -0.1]], [0.06, 0.05], metal2, { cap0: 'none', cap1: 'none' }); for (let i = 0; i < 4; i++) hring(sd * 0.34, top + 0.06 + i * 0.08, -0.1, 0.08, 0.018, cu); ball(sd * 0.34, top + 0.42, -0.1, 0.08, glw, { emis: true, n: 2 }); }
            arms(top - 0.1, w, [0.24, 0.56, 0.8][k], [0.04, 0.05, 0.11][k], metal2, k === 2 ? 'fist' : 'paw', { out: 0.15, hc: metal, hand: k === 1 ? (sd, wr) => { for (let i = 0; i < 5; i++) hring(wr[0] - sd * 0.06, wr[1] + 0.12 + i * 0.07, wr[2] - 0.04, 0.065, 0.016, cu); ball(wr[0], wr[1], wr[2], 0.05, glw, { emis: true, n: 2 }); } : null });
            H(top); const hy = top + [0.14, 0.14, 0.12][k];
            blob(-[0.2, 0.18, 0.22][k], hy - 0.14, -0.16, [0.2, 0.18, 0.22][k], hy + 0.16, 0.18, 0.5, metal, { under: metal2 });
            blob(-0.15, hy - 0.04, 0.14, 0.15, hy + 0.06, 0.2, 0.6, '#16121e'); for (const sd of [-1, 1]) ball(sd * 0.07, hy + 0.01, 0.2, 0.03, glw, { emis: true, n: 1 });
            tube([[0, hy + 0.16, 0], [0, hy + 0.32, 0]], [0.015, 0.012], metal2, { cap0: 'none', cap1: 'none' }); ball(0, hy + 0.34, 0, 0.04, glw, { emis: true, n: 1 }); bone = 0;
          } else if (P === 'voltjoey' || P === 'thunderboxer') { // a joey, then a boxing kangaroo with gloves full of lightning
            const big = P === 'thunderboxer', hip = big ? 0.42 : 0.2, top = big ? 1.24 : 0.68;
            legs(hip, 0.12, big ? 0.07 : 0.05, bd, 'big', { fc: bd, digi: true, thigh: true });
            blob(-0.22 - 0.04 * big, hip - 0.06, -0.24, 0.22 + 0.04 * big, top, 0.2, 1, bd, { under: bl, tap: [0.75, 1] });
            if (big) hring(0, top + 0.12, 0, 0.2, 0.03, ac); // a headband
            arms(top - 0.14, 0.18 + 0.04 * big, big ? 0.36 : 0.2, big ? 0.05 : 0.035, bd, big ? 'none' : 'paw', { fwd: 0.18, out: 0.05, hand: big ? (sd, wr) => { ball(wr[0], wr[1] + 0.04, wr[2] + 0.06, 0.13, '#c8302a', { n: 3 }); for (let i = 0; i < 3; i++) { const a = i * 2.1; tube([[wr[0] + Math.cos(a) * 0.12, wr[1] + 0.04 + Math.sin(a) * 0.12, wr[2] + 0.06], [wr[0] + Math.cos(a + 0.4) * 0.22, wr[1] + 0.04 + Math.sin(a + 0.4) * 0.2, wr[2] + 0.12]], [0.015, 0.006], glw, { emis: true, cap0: 'round', cap1: 'round' }); } } : null });
            H(top); const hy = top + (big ? 0.16 : 0.14); ball(0, hy, 0.02, big ? 0.17 : 0.18, bd, { n: 3 }); cone([0, hy - 0.04, 0.12], [0, -0.3, 1], big ? 0.16 : 0.12, 0.08, bl); nose(0, hy - 0.08, big ? 0.28 : 0.24, 0.025);
            for (const sd of [-1, 1]) { plate([[sd * 0.05, hy + 0.12, 0.0], [sd * 0.15, hy + 0.12, -0.02], [sd * 0.2, hy + (big ? 0.34 : 0.3), -0.06]], 0.025, bd, { edge: bl }); }
            look(0.08, hy + 0.04, 0.13, 0.045, { brow: big ? dk : null }); bone = 0;
            tail([[0, hip + 0.04, -0.2], [0, hip * 0.5, -0.5], [0, 0.06, -0.8]], [0.1, 0.08, 0.03], bd, { tip: (p) => { if (big) { bone = 6; plate([[p[0], p[1] + 0.04, p[2] + 0.1], [p[0], p[1] + 0.16, p[2] - 0.04], [p[0], p[1] + 0.1, p[2] - 0.06], [p[0], p[1] + 0.26, p[2] - 0.18]], 0.025, ac, { emis: true }); } } });
          } else if (P === 'conductor') { // a lightning conductor come to life: a copper spike for a head, coils banding its thin body, sparks at its fingers
            const cu = '#c87a3a', metal = hexMix(bd, '#3a3d48', 0.5);
            legs(0.6, 0.08, 0.035, metal, 'boot', { fc: metal }); tube([[0, 0.56, 0], [0, 1.4, 0]], [0.12, 0.1], metal, { cap0: 'flat', cap1: 'flat' });
            for (let i = 0; i < 8; i++) hring(0, 0.66 + i * 0.1, 0, 0.125 - i * 0.002, 0.022, cu);
            arms(1.34, 0.12, 0.7, 0.03, metal, 'paw', { out: 0.4, hc: cu, hand: (sd, w) => { for (let i = 0; i < 3; i++) tube([[w[0], w[1], w[2]], [w[0] + sd * 0.06, w[1] - 0.1, w[2] + 0.04 * i], [w[0] + sd * 0.02, w[1] - 0.18, w[2] + 0.06 * i]], [0.012, 0.01, 0.006], glw, { emis: true, cap0: 'round', cap1: 'round' }); } });
            H(1.4); ball(0, 1.52, 0, 0.14, cu, { n: 3 }); cone([0, 1.62, 0], [0, 1, 0], 0.6, 0.05, cu); ball(0, 2.24, 0, 0.05, glw, { emis: true, n: 2 });
            look(0.06, 1.54, 0.11, 0.035, { glow: true, col: glw }); bone = 0;

          // ======== VOID ========
          } else if (P === 'puppet' || P === 'marionette' || P === 'puppeteer') { // a puppet with button eyes; a masked marionette; then the hand that works the strings
            const k = P === 'puppet' ? 0 : P === 'marionette' ? 1 : 2, wood = '#c89a6a', wood2 = '#8a6a42', str = '#e8e2d4';
            if (k < 2) {
              const hip = k ? 0.5 : 0.24, top = k ? 1.12 : 0.66;
              legs(hip, 0.08, k ? 0.035 : 0.04, wood, 'boot', { fc: wood2 }); for (const sd of [-1, 1]) ball(sd * 0.08, hip * 0.5, 0.03, k ? 0.05 : 0.05, wood2, { n: 2 });
              blob(-0.16, hip - 0.04, -0.12, 0.16, top, 0.12, 0.7, k ? bd : wood, { under: k ? dk : wood2 });
              arms(top - 0.06, 0.14, k ? 0.46 : 0.26, k ? 0.03 : 0.035, wood, 'paw', { out: 0.3 });
              if (k) { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; plate([[0, top, 0], [Math.cos(a) * 0.3, top - 0.04, Math.sin(a) * 0.24], [Math.cos(a + 0.4) * 0.26, top - 0.12, Math.sin(a + 0.4) * 0.2]], 0.015, i % 2 ? ac : dk); ball(Math.cos(a + 0.2) * 0.3, top - 0.1, Math.sin(a + 0.2) * 0.24, 0.025, '#e2b84a', { n: 1 }); } }
              H(top); const hy = top + (k ? 0.2 : 0.2); ball(0, hy, 0, k ? 0.17 : 0.2, wood, { n: 3 });
              if (k) { blob(-0.15, hy - 0.16, 0.06, 0.15, hy + 0.14, 0.2, 1, '#f4f0e6'); for (const sd of [-1, 1]) { blob(sd * 0.06 - 0.035, hy + 0.0, 0.18, sd * 0.06 + 0.035, hy + 0.06, 0.21, 0.6, '#16121e', { n: 1 }); ball(sd * 0.06, hy + 0.03, 0.2, 0.015, ac, { emis: true, n: 1 }); } tube([[-0.06, hy - 0.08, 0.19], [0, hy - 0.11, 0.2], [0.06, hy - 0.08, 0.19]], [0.01, 0.01, 0.01], '#16121e', { cap0: 'round', cap1: 'round' }); cone([0, hy + 0.12, 0], [0.4, 1, -0.4], 0.3, 0.08, ac); ball(0.12, hy + 0.38, -0.12, 0.04, '#e2b84a', { n: 1 }); }
              else { for (const sd of [-1, 1]) { ball(sd * 0.08, hy + 0.02, 0.18, 0.05, '#16121e', { n: 2 }); for (let i = 0; i < 4; i++) ball(sd * 0.08 + (i % 2 ? 0.02 : -0.02), hy + 0.02 + (i < 2 ? 0.02 : -0.02), 0.22, 0.008, '#e8e2d4', { n: 1 }); } for (let i = 0; i < 4; i++) tube([[-0.07 + i * 0.045, hy - 0.08, 0.18], [-0.07 + i * 0.045, hy - 0.11, 0.18]], [0.006, 0.006], dk, { cap0: 'none', cap1: 'none' }); tube([[-0.08, hy - 0.095, 0.185], [0.08, hy - 0.095, 0.185]], [0.006, 0.006], dk, { cap0: 'none', cap1: 'none' }); for (let i = 0; i < 6; i++) cone([(i - 2.5) * 0.05, hy + 0.14, -0.04], [(i - 2.5) * 0.2, 1, -0.3], 0.14, 0.03, ac); }
              bone = 0; const by = top + 0.7 + 0.3 * k;
              if (k) { tube([[-0.36, by, 0], [0.36, by, 0]], [0.025, 0.025], wood2, { cap0: 'flat', cap1: 'flat' }); tube([[0, by, -0.2], [0, by, 0.2]], [0.025, 0.025], wood2, { cap0: 'flat', cap1: 'flat' }); }
              for (const [x, y, z] of [[-0.36, top - 0.1, 0.0], [0.36, top - 0.1, 0.0], [0, top + 0.36, 0]]) tube([[x * (k ? 1 : 0.7), y, z], [x * (k ? 1 : 0.7), by + (k ? 0 : 0.3), z]], [0.004, 0.004], str, { cap0: 'none', cap1: 'none' });
            } else { // the puppeteer: tall, cloaked, six hands working the strings of a little puppet that dances in front of it
              const cl = hexMix(bd, dk, 0.45);
              tube([[0, 0.1, 0], [0, 0.9, 0], [0, 1.5, 0.02]], [0.4, 0.28, 0.2], cl, { cap0: 'flat', cap1: 'none' }); legLen = 0.1;
              B(4, 'leg', [-0.12, 0.1, 0], { phase: 0, len: 0.1 }); B(5, 'leg', [0.12, 0.1, 0], { phase: Math.PI, len: 0.1 }); bone = 0;
              for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) { const y = 1.36 - i * 0.24; if (i === 0) B(sd < 0 ? 2 : 3, 'arm', [sd * 0.2, y, 0], { phase: sd < 0 ? 0 : Math.PI, side: sd });
                const wr = [sd * (0.56 - i * 0.04), y + 0.16 - i * 0.08, 0.3]; tube([[sd * 0.2, y, 0], [sd * 0.42, y - 0.04, 0.12], wr], [0.04, 0.035, 0.03], cl, { cap0: 'round', cap1: 'round' }); ball(wr[0], wr[1], wr[2], 0.045, '#f4f0e6', { n: 2 });
                tube([wr, [sd * 0.1 * (i + 1), 0.7 - i * 0.12, 0.62]], [0.004, 0.004], str, { cap0: 'none', cap1: 'none' }); if (i === 0) bone = 0; }
              H(1.5); blob(-0.24, 1.4, -0.2, 0.24, 1.86, 0.24, 1, cl); blob(-0.15, 1.46, 0.12, 0.15, 1.76, 0.26, 1, '#f4f0e6');
              for (const sd of [-1, 1]) { plate([[sd * 0.03, 1.66, 0.26], [sd * 0.12, 1.66, 0.25], [sd * 0.08, 1.6, 0.26]], 0.01, '#16121e'); ball(sd * 0.075, 1.645, 0.265, 0.012, ac, { emis: true, n: 1 }); }
              tube([[-0.07, 1.54, 0.25], [0, 1.5, 0.26], [0.07, 1.54, 0.25]], [0.008, 0.008, 0.008], '#16121e', { cap0: 'round', cap1: 'round' }); bone = 0;
              ball(0, 0.62, 0.62, 0.07, wood, { n: 2 }); blob(-0.05, 0.4, 0.58, 0.05, 0.56, 0.66, 0.7, ac); for (const sd of [-1, 1]) { tube([[sd * 0.04, 0.42, 0.62], [sd * 0.06, 0.22, 0.62]], [0.012, 0.01], wood, { cap0: 'none', cap1: 'round' }); tube([[sd * 0.05, 0.54, 0.62], [sd * 0.16, 0.5, 0.64]], [0.01, 0.008], wood, { cap0: 'none', cap1: 'round' }); }
              for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; cone([Math.cos(a) * 0.38, 0.14, Math.sin(a) * 0.38], [Math.cos(a) * 0.3, -1, Math.sin(a) * 0.3], 0.14, 0.08, cl); }
              hover = 0.08;
            }
          } else if (P === 'ayeaye' || P === 'nightshaman') { // an aye-aye: bat ears, saucer eyes, wild hair, one long finger; grown, a shaman with a bone mask and a staff
            const big = P === 'nightshaman', hip = big ? 0.42 : 0.2, top = big ? 1.06 : 0.6;
            legs(hip, 0.09, big ? 0.05 : 0.04, bd, 'paw', { fc: dk, thigh: true });
            blob(-0.18, hip - 0.04, -0.16, 0.18, top, 0.16, 1, bd, { under: bl }); fur(0, top - 0.1, -0.06, 0.18, 0.2, 0.16, 12, 0.14, 0.03, dk);
            arms(top - 0.06, 0.16, big ? 0.5 : 0.3, 0.035, bd, 'paw', { hc: dk, hand: (sd, w) => { tube([[w[0], w[1], w[2]], [w[0] + sd * 0.02, w[1] - 0.12, w[2] + 0.08], [w[0], w[1] - 0.2, w[2] + 0.1]], [0.012, 0.01, 0.006], dk, { cap0: 'none', cap1: 'round' });
              if (big && sd > 0) { tube([[w[0], w[1] - 0.5, w[2] + 0.04], [w[0], w[1] + 0.6, w[2] + 0.06]], [0.025, 0.025], '#6b4a2e', { cap0: 'round', cap1: 'none' }); ball(w[0], w[1] + 0.66, w[2] + 0.06, 0.07, '#f4f0e6', { n: 2 }); for (let i = 0; i < 4; i++) ball(w[0] + (i - 1.5) * 0.04, w[1] + 0.52, w[2] + 0.1, 0.022, ac, { emis: true, n: 1 }); } } });
            H(top); const hy = top + 0.16; ball(0, hy, 0.02, big ? 0.17 : 0.19, bd, { n: 3 });
            for (const sd of [-1, 1]) plate([[sd * 0.1, hy + 0.06, -0.02], [sd * 0.38, hy + 0.2, -0.06], [sd * 0.3, hy - 0.06, -0.06]], 0.025, dk, { edge: bl });
            if (big) { blob(-0.15, hy - 0.08, 0.06, 0.15, hy + 0.16, 0.2, 0.8, '#f4f0e6'); for (const sd of [-1, 1]) { ball(sd * 0.065, hy + 0.04, 0.18, 0.045, '#16121e', { n: 2 }); ball(sd * 0.065, hy + 0.04, 0.21, 0.025, glw, { emis: true, n: 1 }); } for (let i = 0; i < 5; i++) cone([(i - 2) * 0.06, hy + 0.16, 0.0], [(i - 2) * 0.3, 1, -0.3], 0.2, 0.03, '#f4f0e6'); }
            else { look(0.08, hy + 0.03, 0.15, 0.075, { col: '#ffb02a' }); nose(0, hy - 0.06, 0.2, 0.025); }
            fur(0, hy + 0.1, -0.04, 0.12, 0.08, 0.12, 9, 0.16, 0.025, dk); bone = 0;
            tail([[0, hip + 0.06, -0.16], [0, hip + 0.2, -0.46], [0, hip + 0.5, -0.56]], [0.06, 0.09, 0.05], dk);
          } else if (P === 'mimic') { // a treasure chest with legs: the lid is a jaw, the tongue lolls, eyes glow in the dark inside
            const wood = '#6b4a2e', iron = '#3a3d48', gold = '#e2b84a';
            legs(0.3, 0.2, 0.06, bd, 'talon', { fc: dk });
            blob(-0.42, 0.26, -0.3, 0.42, 0.7, 0.3, 0.3, wood, { n: 2 }); for (const x of [-0.32, 0.32]) blob(x - 0.04, 0.24, -0.32, x + 0.04, 0.72, 0.32, 0.3, iron, { n: 1 });
            blob(-0.2, 0.62, 0.22, 0.2, 0.7, 0.32, 0.4, '#1a0a14');
            for (let i = 0; i < 7; i++) cone([-0.36 + i * 0.12, 0.7, 0.28], [0, 1, 0.2], 0.1, 0.03, '#f4f0e6');
            arms(0.6, 0.42, 0.34, 0.05, bd, 'claw', { out: 0.3, cc: dk });
            H(0.7, -0.3); blob(-0.42, 0.78, -0.32, 0.42, 1.08, 0.28, 0.35, wood, { n: 2 }); for (const x of [-0.32, 0.32]) blob(x - 0.04, 0.76, -0.34, x + 0.04, 1.1, 0.3, 0.3, iron, { n: 1 });
            blob(-0.06, 0.8, 0.26, 0.06, 0.94, 0.32, 0.4, gold, { n: 1 }); for (let i = 0; i < 7; i++) cone([-0.36 + i * 0.12, 0.8, 0.26], [0, -1, 0.2], 0.09, 0.026, '#f4f0e6');
            for (const sd of [-1, 1]) ball(sd * 0.12, 0.74, 0.12, 0.05, ac, { emis: true, n: 2 }); bone = 0;
            tube([[0, 0.66, 0.1], [0, 0.6, 0.36], [0.04, 0.42, 0.44]], [0.07, 0.06, 0.04], '#e04a6a', { cap0: 'round', cap1: 'round' });
            for (let i = 0; i < 4; i++) ball(-0.2 + i * 0.13, 0.7, 0.04 + (i % 2) * 0.06, 0.04, gold, { emis: true, n: 1 });

          // ======== LIGHT ========
          } else if (P === 'prismsprite' || P === 'crystalknight' || P === 'paladin') { // a prism with a face; a knight armoured in crystal; a paladin with wings and a sword of light
            const k = P === 'prismsprite' ? 0 : P === 'crystalknight' ? 1 : 2, cr = hexMix(bd, '#ffffff', 0.4), gold = '#e2b84a';
            if (k === 0) { cone([0, 0.5, 0], [0, 1, 0], 0.5, 0.26, cr, { segs: 6 }); cone([0, 0.5, 0], [0, -1, 0], 0.36, 0.26, cr, { segs: 6 }); ball(0, 0.5, 0, 0.12, glw, { emis: true, n: 2 }); for (let i = 0; i < 3; i++) plate([[0.1, 0.5 + i * 0.04, 0.2], [0.5 + i * 0.1, 0.4 + i * 0.12, 0.3], [0.5 + i * 0.1, 0.36 + i * 0.12, 0.3]], 0.01, ['#ff8a8a', '#ffe45a', '#8ad8ff'][i], { emis: true }); look(0.08, 0.6, 0.16, 0.045); arms(0.56, 0.18, 0.14, 0.03, cr, 'paw'); hover = 0.16; legLen = 0.08; B(4, 'leg', [-0.06, 0.14, 0], { phase: 0, len: 0.1 }); B(5, 'leg', [0.06, 0.14, 0], { phase: Math.PI, len: 0.1 }); bone = 0; }
            else {
              const hip = k === 1 ? 0.5 : 0.66, top = k === 1 ? 1.2 : 1.6, w = k === 1 ? 0.24 : 0.3;
              legs(hip, w * 0.45, k === 1 ? 0.07 : 0.085, cr, 'boot', { fc: k === 2 ? gold : cr, thigh: true });
              blob(-w, hip - 0.04, -w * 0.7, w, top, w * 0.7, 0.8, cr, { under: hexMix(cr, bd, 0.4) });
              for (let i = 0; i < 4; i++) cone([0, hip + 0.2 + i * 0.16, w * 0.68], [0, 0, 1], 0.08, 0.06, glw, { emis: true, segs: 4 });
              for (const sd of [-1, 1]) { blob(sd * w - 0.14, top - 0.2, -0.14, sd * w + 0.14, top + 0.04, 0.14, 0.4, cr); for (let i = 0; i < 3; i++) cone([sd * (w + 0.06), top, -0.06 + i * 0.06], [sd * 0.6, 1, 0], 0.18, 0.05, glw, { emis: true, segs: 4 }); }
              arms(top - 0.1, w + 0.04, k === 1 ? 0.6 : 0.74, 0.06, cr, 'fist', { fwd: 0.1, hc: k === 2 ? gold : cr, hand: (sd, wr) => {
                if (sd < 0) { const r = k === 1 ? 0.28 : 0.32; plate(Array.from({ length: 6 }, (_, i) => { const a = i / 6 * Math.PI * 2 + Math.PI / 6; return [wr[0] - 0.08, wr[1] + Math.sin(a) * r, wr[2] + 0.06 + Math.cos(a) * r * 0.5]; }), 0.03, cr, { edge: gold }); ball(wr[0] - 0.12, wr[1], wr[2] + 0.06, 0.07, glw, { emis: true, n: 2 }); }
                else if (k === 2) { tube([[wr[0], wr[1] - 0.06, wr[2] + 0.04], [wr[0], wr[1] + 0.08, wr[2] + 0.06]], [0.03, 0.03], gold, { cap0: 'round', cap1: 'none' }); tube([[wr[0] - 0.12, wr[1] + 0.08, wr[2] + 0.06], [wr[0] + 0.12, wr[1] + 0.08, wr[2] + 0.06]], [0.025, 0.025], gold, { cap0: 'round', cap1: 'round' }); plate([[wr[0] - 0.05, wr[1] + 0.1, wr[2] + 0.06], [wr[0] + 0.05, wr[1] + 0.1, wr[2] + 0.06], [wr[0] + 0.04, wr[1] + 0.86, wr[2] + 0.1], [wr[0], wr[1] + 0.96, wr[2] + 0.1], [wr[0] - 0.04, wr[1] + 0.86, wr[2] + 0.1]], 0.02, glw, { emis: true }); } } });
              H(top); const hy = top + 0.18; blob(-0.17, hy - 0.16, -0.16, 0.17, hy + 0.18, 0.18, 0.7, cr); blob(-0.14, hy - 0.04, 0.14, 0.14, hy + 0.02, 0.19, 0.6, '#16121e'); for (const sd of [-1, 1]) ball(sd * 0.06, hy - 0.01, 0.19, 0.025, glw, { emis: true, n: 1 });
              cone([0, hy + 0.16, -0.02], [0, 1, -0.3], 0.28, 0.05, glw, { emis: true, segs: 4 });
              if (k === 2) ring(0, hy + 0.36, -0.04, 0.2, 0.2, 0.025, '#fff3b0', { emis: true }); bone = 0;
              if (k === 2) for (const sd of [-1, 1]) { B(sd < 0 ? 7 : 8, 'wing', [sd * 0.16, top - 0.1, -0.2], { side: sd, fold: -0.3 }); for (let i = 0; i < 5; i++) plate([[sd * 0.16, top - 0.1, -0.2], [sd * (0.5 + i * 0.16), top + 0.5 - i * 0.18, -0.34], [sd * (0.44 + i * 0.16), top + 0.3 - i * 0.2, -0.3]], 0.015, i % 2 ? '#fff3b0' : '#ffffff', { emis: true }); bone = 0; }
            }
          } else if (P === 'meerkatpup' || P === 'sunsentinel') { // a meerkat pup on lookout; grown, a sentinel with a sun disc on its brow and a spear
            const big = P === 'sunsentinel', gold = '#e2b84a', hip = big ? 0.36 : 0.18, top = big ? 1.26 : 0.7;
            legs(hip, 0.08, big ? 0.05 : 0.04, bd, 'paw', { fc: dk, thigh: true });
            blob(-0.16, hip - 0.04, -0.14, 0.16, top, 0.14, 1, bd, { under: bl, tap: [0.85, 1] });
            if (big) for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) blob(sd * 0.155 - 0.02, hip + 0.2 + i * 0.12, -0.12, sd * 0.155 + 0.02, hip + 0.24 + i * 0.12, 0.0, 0.6, dk, { n: 1 });
            arms(top - 0.1, 0.13, big ? 0.32 : 0.18, 0.03, bd, 'paw', { fwd: 0.12, out: 0.02, hc: dk, hand: big ? (sd, w) => { if (sd > 0) { tube([[w[0], w[1] - 0.6, w[2]], [w[0], w[1] + 0.7, w[2] + 0.04]], [0.02, 0.02], '#8a6a42', { cap0: 'round', cap1: 'none' }); cone([w[0], w[1] + 0.7, w[2] + 0.04], [0, 1, 0], 0.22, 0.05, gold); } } : null });
            if (big) { hring(0, top - 0.04, 0, 0.16, 0.03, gold); }
            H(top); const hy = top + 0.14; ball(0, hy, 0.02, 0.14, bd, { n: 3 }); cone([0, hy - 0.04, 0.1], [0, -0.3, 1], 0.12, 0.07, bl); nose(0, hy - 0.08, 0.22, 0.02);
            for (const sd of [-1, 1]) blob(sd * 0.065 - 0.05, hy - 0.02, 0.08, sd * 0.065 + 0.05, hy + 0.06, 0.14, 1, dk, { n: 2 }); look(0.065, hy + 0.02, 0.12, 0.035, { col: '#ffb02a' }); ears(0.13, hy + 0.02, -0.02, 0.035, dk, dk);
            if (big) { ring(0, hy + 0.2, -0.02, 0.14, 0.14, 0.025, gold); blob(-0.1, hy + 0.1, -0.03, 0.1, hy + 0.3, 0.0, 1, '#ffd25a', { emis: true }); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; cone([Math.cos(a) * 0.14, hy + 0.2 + Math.sin(a) * 0.14, -0.02], [Math.cos(a), Math.sin(a), 0], 0.08, 0.025, gold); } }
            bone = 0; tail([[0, hip + 0.04, -0.12], [0, hip * 0.4, -0.3], [0, 0.04, -0.46]], [0.04, 0.035, 0.015], bd, { tip: (p) => { bone = 6; ball(p[0], p[1], p[2], 0.03, dk, { n: 1 }); } });
          } else if (P === 'sunbear') { // a sun bear: short velvet coat, a gold crescent blazing on its chest, a long tongue for honey
            const black = hexMix(bd, '#2a2420', 0.7), gold = '#ffd25a';
            legs(0.4, 0.18, 0.1, black, 'paw', { fc: black, thigh: true }); blob(-0.36, 0.36, -0.3, 0.36, 1.3, 0.3, 1, black, { under: hexMix(black, bd, 0.3) });
            const moon = []; for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.15 + 0.7 * i / 8); moon.push([Math.cos(a) * 0.22, 1.14 - Math.sin(a) * 0.18, 0.3]); } tube(moon, moon.map((_, i) => 0.02 + 0.04 * Math.sin(i / 8 * Math.PI)), gold, { emis: true, cap0: 'round', cap1: 'round' });
            arms(1.2, 0.34, 0.66, 0.1, black, 'claw', { out: 0.15, fwd: 0.08 });
            H(1.28); ball(0, 1.46, 0.06, 0.24, black, { n: 3 }); blob(-0.11, 1.32, 0.18, 0.11, 1.46, 0.38, 1, '#c8a070'); nose(0, 1.43, 0.38, 0.04);
            ears(0.2, 1.64, 0.0, 0.06, black, hexMix(black, bd, 0.3)); look(0.09, 1.52, 0.24, 0.035, { col: '#ffb02a' });
            tube([[0, 1.34, 0.34], [0, 1.26, 0.4], [0.02, 1.2, 0.38]], [0.03, 0.025, 0.015], '#e04a6a', { cap0: 'round', cap1: 'round' }); bone = 0;
          }
          break;
        }
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
        if (form.plan && SRP.has(form.plan)) {
          // Serpents with bodies of their own: snakes, eels, worms, centipedes, a snail, dragons grown from them. Bone 1 is the head;
          // the body sways as one.
          const P = form.plan, dk = C.dark, bl = C.belly, bd = C.body, ac = C.accent, glw = hexMix(C.accent, '#ffffff', 0.3);
          kind = 'serpent'; legLen = 0.5;
          const look = (ex, ey, ez, er, o = {}) => LOOK(ex, ey, ez, er, o, false); const lookOld = (ex, ey, ez, er, o = {}) => { for (const sd of [-1, 1]) { ball(sd * ex, ey, ez, er, '#16121e', { n: 3 }); ball(sd * (ex + er * 0.04), ey - er * 0.12, ez + er * 0.5, er * 0.62, o.col || C.eye, { emis: !!o.glow, n: 3 });
            ball(sd * (ex + er * 0.05), ey - er * 0.1, ez + er * 0.78, er * 0.3, '#0a0810', { n: 2 }); ball(sd * (ex - er * 0.22), ey + er * 0.34, ez + er * 0.82, er * 0.3, '#ffffff', { emis: true, n: 2 });
            if (o.brow) blob(sd * ex - er * 1.2, ey + er * 0.8, ez - er * 0.5, sd * ex + er * 1.1, ey + er * 1.2, ez + er * 0.9, 0.5, o.brow, { n: 2 }); } };
          const rgb = (h) => U.hexToRgb(h);
          // the body: a path from the head back to the tail; pose 'wave' (S on the ground), 'raise' (front reared up), 'coil' (wound round itself)
          const body = (o) => { const n = o.n || 18, L = o.L || 2.4, r0 = o.r || 0.2, pts = [], rr = [], z0 = o.z0 == null ? 0.6 : o.z0;
            for (let i = 0; i <= n; i++) { const t = i / n; let x, y, z; const rt = r0 * (o.prof ? o.prof(t) : (t < 0.12 ? 0.8 + t * 1.6 : 1 - Math.pow((t - 0.12) / 0.88, 1.6) * 0.92));
              if (o.pose === 'coil') { if (t < (o.neck || 0.2)) { const u = t / (o.neck || 0.2); x = 0; y = (o.rh || 0.7) * (1 - u) + rt + r0 * 1.6 * u; z = z0 * (1 - u * 0.7); }
                else { const u = (t - (o.neck || 0.2)) / (1 - (o.neck || 0.2)), a = u * Math.PI * 2 * (o.turns || 1.6), rad = 0.16 + u * (o.cr || 0.5); x = Math.sin(a) * rad; z = Math.cos(a) * rad * 0.9 - 0.1; y = rt + (1 - u) * r0 * 1.6; } }
              else { const rs = o.raise || 0; if (t < rs) { const u = t / rs; x = 0; y = rt + (o.rh || 0.6) * (1 - u * u); z = z0 - u * (o.lean || 0.2); }
                else { const u = (t - rs) / (1 - rs); x = Math.sin(u * (o.waves || 2) * Math.PI + (o.ph || 0)) * (o.amp || 0.22) * Math.min(1, u * 4 + (rs ? 1 : 0)); y = rt + (o.lift ? o.lift(u) : 0); z = z0 - (rs ? (o.lean || 0.2) : 0) - u * L; } }
              pts.push([x, y, z]); rr.push(i === n ? 0.0005 : [rt * (o.flat || 1), rt]); }
            const top = rgb(o.c || bd), bel = rgb(o.belly || bl), band = o.band ? rgb(o.band) : null, nb = o.bands || 10;
            tube(pts, rr, o.c || bd, { cap0: o.cap0 || 'round', cap1: 'none', segs: o.segs || 10, emis: !!o.emis, shade: (p, nx, ny, nz, t) => { if (ny < -0.35) return bel; if (band && Math.floor(t * nb * 2) % 2 === 1) return band; if (o.shade) { const c = o.shade(p, nx, ny, nz, t); if (c) return rgb(c); } return top; } });
            return { pts, rr, head: pts[0], r: rr[0][1] }; };
          const along = (b, every, fn) => { for (let i = 1; i < b.pts.length - 1; i += every) { const p = b.pts[i], q = b.pts[i + 1], d = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], dl = Math.hypot(...d) || 1; fn(p, d.map(v => v / dl), b.rr[i][1], i / (b.pts.length - 1)); } };
          const H = (p) => B(1, 'head', p);
          const snakeHead = (h, s, o = {}) => { const [x, y, z] = h; H([x, y, z - 0.05]); // a wedge with eyes set high, a forked tongue; vipers get a brow, cobras a hood
            blob(x - 0.13 * s, y - 0.07 * s, z - 0.1 * s, x + 0.13 * s, y + 0.08 * s, z + (o.len || 0.26) * s, 0.9, o.c || bd, { under: o.belly || bl, tap: [1, 0.8] });
            look(0.085 * s, y + 0.06 * s, z + 0.06 * s, (o.eye || 0.05) * s, { brow: o.brow, col: o.col, glow: o.glow });
            for (const sd of [-1, 1]) ball(x + sd * 0.035 * s, y + 0.04 * s, z + (o.len || 0.26) * s - 0.01, 0.012 * s, dk, { n: 1 });
            if (o.tongue !== false) plate([[x - 0.012, y - 0.03 * s, z + (o.len || 0.26) * s], [x + 0.012, y - 0.03 * s, z + (o.len || 0.26) * s], [x + 0.03, y - 0.04 * s, z + ((o.len || 0.26) + 0.14) * s], [x, y - 0.035 * s, z + ((o.len || 0.26) + 0.1) * s], [x - 0.03, y - 0.04 * s, z + ((o.len || 0.26) + 0.14) * s]], 0.008, '#d83a4a');
            if (o.extra) o.extra(x, y, z, s); bone = 0; };
          const eelHead = (h, s, o = {}) => { const [x, y, z] = h; H([x, y, z - 0.05]); // blunt and round, a wide mouth, small eyes, a crest that runs into the dorsal fin
            blob(x - 0.15 * s, y - 0.12 * s, z - 0.1 * s, x + 0.15 * s, y + 0.12 * s, z + 0.24 * s, 1, o.c || bd, { under: o.belly || bl });
            tube([[x - 0.12 * s, y - 0.04 * s, z + 0.1 * s], [x, y - 0.06 * s, z + 0.24 * s], [x + 0.12 * s, y - 0.04 * s, z + 0.1 * s]], [0.012, 0.012, 0.012], dk, { cap0: 'round', cap1: 'round' });
            look(0.1 * s, y + 0.06 * s, z + 0.1 * s, (o.eye || 0.04) * s, { col: o.col, glow: o.glow, brow: o.brow }); if (o.teeth) for (let i = 0; i < 5; i++) cone([x + (i - 2) * 0.04 * s, y - 0.04 * s, z + 0.2 * s - Math.abs(i - 2) * 0.03 * s], [0, -1, 0.2], 0.06 * s, 0.015 * s, '#f4f0e6');
            if (o.extra) o.extra(x, y, z, s); bone = 0; };
          const wormHead = (h, s, o = {}) => { const [x, y, z] = h; H([x, y, z - 0.05]); // a round end with a ring of a mouth; the big ones have teeth all the way round
            ball(x, y, z + 0.02 * s, 0.2 * s, o.c || bd, { n: 3 }); if (o.teeth) ball(x, y, z + 0.14 * s, 0.13 * s, '#2a1a20', { n: 2 }); else tube([[x - 0.07 * s, y - 0.04 * s, z + 0.17 * s], [x, y - 0.07 * s, z + 0.2 * s], [x + 0.07 * s, y - 0.04 * s, z + 0.17 * s]], [0.014, 0.014, 0.014], '#2a1a20', { cap0: 'round', cap1: 'round' });
            if (o.teeth) for (let i = 0; i < o.teeth; i++) { const a = i / o.teeth * Math.PI * 2; cone([x + Math.cos(a) * 0.15 * s, y + Math.sin(a) * 0.15 * s, z + 0.17 * s], [-Math.cos(a), -Math.sin(a), 0.6], 0.09 * s, 0.022 * s, '#f4f0e6'); }
            if (o.eyes !== false) look(0.09 * s, y + 0.06 * s, z + 0.14 * s, (o.eye || 0.045) * s, { col: o.col, glow: o.glow });
            if (o.extra) o.extra(x, y, z, s); bone = 0; };
          const hood = (h, s, c, inner, o = {}) => { const [x, y, z] = h; bone = 1; const w = (o.w || 0.42) * s, ht = (o.h || 0.5) * s; // the cobra's hood, flared behind the head
            plate([[x, y + 0.04, z - 0.12], [x - w * 0.6, y - ht * 0.1, z - 0.14], [x - w, y - ht * 0.5, z - 0.16], [x - w * 0.6, y - ht, z - 0.14], [x, y - ht * 1.1, z - 0.12], [x + w * 0.6, y - ht, z - 0.14], [x + w, y - ht * 0.5, z - 0.16], [x + w * 0.6, y - ht * 0.1, z - 0.14]], 0.025, c, { edge: inner });
            if (o.mark) o.mark(x, y - ht * 0.5, z - 0.11, w, ht); bone = 0; };
          const legsAlong = (b, every, len, c, th) => along(b, every, (p, d, r) => { for (const sd of [-1, 1]) { const side = [d[2] * sd, 0, -d[0] * sd]; tube([[p[0] + side[0] * r * 0.8, p[1] - r * 0.2, p[2] + side[2] * r * 0.8], [p[0] + side[0] * (r + len * 0.6), p[1] + len * 0.2, p[2] + side[2] * (r + len * 0.6)], [p[0] + side[0] * (r + len), 0.02, p[2] + side[2] * (r + len)]], [th, th * 0.8, th * 0.5], c, { cap0: 'round', cap1: 'round', segs: 5 }); } });
          const finAlong = (b, from, to, h, c, o = {}) => { const i0 = Math.max(1, Math.floor(from * (b.pts.length - 1))), i1 = Math.min(b.pts.length - 2, Math.floor(to * (b.pts.length - 1))); // a fin along the back, one panel per segment
            const top = (i) => { const u = (i - i0) / Math.max(1, i1 - i0); return [b.pts[i][0], b.pts[i][1] + b.rr[i][1] * 0.8 + h * Math.sin(Math.min(1, u * 1.2 + 0.1) * Math.PI) * (o.even ? 1 : 0.75 + 0.25 * Math.sin(u * 9)), b.pts[i][2]]; };
            for (let i = i0; i < i1; i++) { const p0 = [b.pts[i][0], b.pts[i][1] + b.rr[i][1] * 0.7, b.pts[i][2]], p1 = [b.pts[i + 1][0], b.pts[i + 1][1] + b.rr[i + 1][1] * 0.7, b.pts[i + 1][2]]; plate([p0, top(i), top(i + 1), p1], 0.02, c, { edge: o.edge, emis: !!o.emis }); } };
          const spikesAlong = (b, every, len, r, c, o = {}) => along(b, every, (p, d, rr, t) => cone([p[0], p[1] + rr * 0.85, p[2]], [0, 1, -0.3], len * (1 - t * (o.taper == null ? 0.6 : o.taper)), r, c, { emis: !!o.emis, segs: o.segs || 6 }));

          // ======== FLAME ========
          if (P === 'emberworm') { const b = body({ L: 1.1, r: 0.14, amp: 0.12, waves: 2, z0: 0.3, band: hexMix(bd, dk, 0.3), bands: 6 }); spikesAlong(b, 3, 0.14, 0.035, glw, { emis: true }); wormHead(b.head, 0.9, { extra: (x, y, z, s) => { for (let i = 0; i < 3; i++) cone([x + (i - 1) * 0.05, y + 0.18 * s, z - 0.02], [(i - 1) * 0.4, 1, -0.3], 0.16, 0.035, i === 1 ? glw : ac, { emis: true }); } }); }
          else if (P === 'fireviper') { const b = body({ L: 2.0, r: 0.16, amp: 0.26, waves: 2.4, z0: 0.5, band: dk, bands: 9, shade: (p, nx, ny, nz, t) => Math.floor(t * 18) % 4 === 0 && ny > 0.4 ? glw : null }); snakeHead(b.head, 1.1, { brow: dk, col: glw, glow: true, extra: (x, y, z, s) => { for (const sd of [-1, 1]) curl([x + sd * 0.08, y + 0.08, z + 0.04], [sd * 0.2, 1, -0.2], 0.2, 0.04, '#e8dcc0', [0, 0, -0.5]); } }); along(b, 3, (p, d, r, t) => { if (t > 0.2 && t < 0.8) cone([p[0], p[1] + r, p[2]], [0, 1, -0.4], 0.12, 0.035, glw, { emis: true }); }); }
          else if (P === 'magmawyrm') { const R = hexMix(bd, '#2a2220', 0.6); const b = body({ L: 3.0, r: 0.28, raise: 0.25, rh: 0.9, lean: 0.3, amp: 0.36, waves: 2.2, z0: 0.6, c: R, belly: '#3a2a24', shade: (p, nx, ny, nz, t) => (Math.floor(t * 30) % 3 === 0 && Math.abs(nx) > 0.5) ? '#ffa23a' : null });
            spikesAlong(b, 2, 0.34, 0.08, '#1e1a1c'); along(b, 4, (p, d, r) => ball(p[0], p[1] + r * 0.6, p[2], r * 0.3, '#ffa23a', { emis: true, n: 1 }));
            snakeHead(b.head, 1.6, { c: R, belly: '#3a2a24', brow: '#1e1a1c', col: '#ffd25a', glow: true, len: 0.32, tongue: false, extra: (x, y, z, s) => { for (const sd of [-1, 1]) { curl([x + sd * 0.12 * s, y + 0.08 * s, z - 0.02], [sd * 0.4, 1, -0.8], 0.5, 0.06, '#1e1a1c', [0, 0.2, -0.6]); for (let i = 0; i < 3; i++) cone([x + sd * 0.13 * s, y - 0.04 * s, z + (0.04 + i * 0.08) * s], [sd, -0.2, 0], 0.1, 0.03, '#1e1a1c'); } for (let i = 0; i < 4; i++) cone([x + (i - 1.5) * 0.06, y - 0.08 * s, z + 0.4 * s], [0, -1, 0.2], 0.1, 0.022, '#f4f0e6'); ball(x, y - 0.06 * s, z + 0.3 * s, 0.06, '#ffd25a', { emis: true, n: 2 }); } }); }
          else if (P === 'cindercentipede' || P === 'magmacentipede') { const big = P === 'magmacentipede', R = big ? hexMix(bd, '#2a2220', 0.5) : bd; const b = body({ L: big ? 2.4 : 1.4, r: big ? 0.15 : 0.1, amp: 0.2, waves: 2.4, z0: 0.4, n: big ? 22 : 16, c: R, band: big ? '#ffa23a' : hexMix(bd, dk, 0.4), bands: big ? 11 : 8, prof: (t) => 1 - t * 0.5, flat: 1.3 });
            legsAlong(b, 1, big ? 0.26 : 0.16, big ? '#1e1a1c' : dk, big ? 0.022 : 0.016); if (big) spikesAlong(b, 2, 0.16, 0.04, '#ffa23a', { emis: true, taper: 0.3 });
            wormHead(b.head, big ? 0.9 : 0.6, { c: R, eyes: false, extra: (x, y, z, s) => { for (const sd of [-1, 1]) { curl([x + sd * 0.08 * s, y - 0.06 * s, z + 0.1 * s], [sd * 0.4, -0.2, 1], 0.3 * s, 0.04 * s, big ? '#1e1a1c' : dk, [-sd * 0.9, 0, 0]); tube([[x + sd * 0.06 * s, y + 0.14 * s, z + 0.04], [x + sd * 0.2 * s, y + 0.4 * s, z + 0.2 * s], [x + sd * 0.3 * s, y + 0.46 * s, z + 0.1 * s]], [0.018, 0.014, 0.008], big ? '#ffa23a' : ac, { emis: big, cap0: 'none', cap1: 'round' }); ball(x + sd * 0.08 * s, y + 0.1 * s, z + 0.12 * s, 0.04 * s, glw, { emis: true, n: 1 }); } } }); }
          else if (P === 'flamecobra') { const b = body({ L: 2.0, r: 0.17, raise: 0.3, rh: 0.95, amp: 0.3, waves: 1.6, z0: 0.3, band: hexMix(bd, dk, 0.3), bands: 8 }); snakeHead(b.head, 1.15, { brow: dk, col: '#ffd25a' }); hood(b.head, 1.2, bd, ac, { mark: (x, y, z, w, h) => { for (let i = 0; i < 3; i++) cone([x + (i - 1) * w * 0.3, y - h * 0.3, z - 0.02], [(i - 1) * 0.3, 1, 0], h * (i === 1 ? 0.8 : 0.6), w * 0.12, i === 1 ? '#ffd25a' : '#ff7a2a', { emis: true }); } }); }

          // ======== TIDE ========
          else if (P === 'elver') { const b = body({ L: 1.2, r: 0.1, amp: 0.16, waves: 2.6, z0: 0.3, c: hexMix(bd, '#ffffff', 0.35) }); finAlong(b, 0.15, 1, 0.08, hexMix(ac, '#ffffff', 0.3)); eelHead(b.head, 0.7, { eye: 0.07 }); }
          else if (P === 'moray' || P === 'leviathan') { const big = P === 'leviathan'; const b = body({ L: big ? 3.4 : 2.2, r: big ? 0.3 : 0.18, raise: big ? 0.22 : 0.18, rh: big ? 1.0 : 0.5, amp: 0.3, waves: 2, z0: 0.6, shade: (p, nx, ny, nz, t) => (!big && ((Math.floor(p[2] * 9) + Math.floor(p[1] * 9)) % 3 === 0)) ? hexMix(bd, dk, 0.4) : null });
            finAlong(b, 0.08, 1, big ? 0.3 : 0.14, ac, { edge: glw }); eelHead(b.head, big ? 1.7 : 1.0, { teeth: true, brow: big ? dk : null, col: big ? glw : '#e8e2a0', glow: big, extra: big ? (x, y, z, s) => { for (const sd of [-1, 1]) { plate([[x + sd * 0.12 * s, y, z - 0.04], [x + sd * 0.4 * s, y + 0.2 * s, z - 0.24 * s], [x + sd * 0.3 * s, y - 0.1 * s, z - 0.2 * s]], 0.025, ac, { edge: glw }); curl([x + sd * 0.1 * s, y + 0.1 * s, z], [sd * 0.3, 1, -1], 0.4 * s, 0.04 * s, glw, [0, 0, -0.5], { emis: true }); } } : null });
            if (big) along(b, 3, (p, d, r) => { for (const sd of [-1, 1]) plate([[p[0] + sd * r * 0.9, p[1], p[2]], [p[0] + sd * (r + 0.24), p[1] - 0.06, p[2] - 0.14], [p[0] + sd * r * 0.9, p[1] - 0.04, p[2] - 0.18]], 0.02, ac); }); }
          else if (P === 'seaslug' || P === 'blueslug') { const big = P === 'blueslug', blue = '#3a8ad8', silver = '#e8f2ff'; const b = body({ L: big ? 1.6 : 1.0, r: big ? 0.16 : 0.14, amp: 0.1, waves: 1.6, z0: 0.3, c: big ? blue : bd, belly: big ? silver : bl, flat: 1.4, prof: (t) => Math.sin(Math.min(1, 0.2 + t) * Math.PI * 0.8) + 0.1 });
            if (!big) along(b, 2, (p, d, r) => { for (let i = 0; i < 3; i++) cone([p[0] + (i - 1) * r * 0.5, p[1] + r * 0.7, p[2]], [(i - 1) * 0.4, 1, 0], 0.16, 0.035, i % 2 ? ac : glw); });
            else for (const t of [0.2, 0.42, 0.64]) { const i = Math.floor(t * (b.pts.length - 1)), p = b.pts[i], r = b.rr[i][1]; for (const sd of [-1, 1]) for (let k = 0; k < 6; k++) { const a = (k / 5 - 0.5) * 1.6; tube([[p[0] + sd * r, p[1], p[2]], [p[0] + sd * (r + 0.24 * Math.cos(a)), p[1] + 0.06, p[2] + 0.24 * Math.sin(a)]], [0.03, 0.008], k % 2 ? blue : silver, { cap0: 'round', cap1: 'round' }); ball(p[0] + sd * (r + 0.24 * Math.cos(a)), p[1] + 0.06, p[2] + 0.24 * Math.sin(a), 0.02, '#20307a', { n: 1 }); } }
            wormHead(b.head, big ? 0.7 : 0.6, { c: big ? blue : bd, eye: 0.06, extra: (x, y, z, s) => { for (const sd of [-1, 1]) tube([[x + sd * 0.06, y + 0.14 * s, z], [x + sd * 0.12, y + 0.34 * s, z + 0.04]], [0.025, 0.012], big ? silver : ac, { cap0: 'none', cap1: 'round' }); } }); }
          else if (P === 'seakrait') { const b = body({ L: 2.0, r: 0.15, amp: 0.26, waves: 2.2, z0: 0.4, c: '#e8eef6', band: '#20242e', bands: 12, belly: '#f4d870' }); plate([[b.pts[17][0], b.pts[17][1] + 0.12, b.pts[17][2]], [b.pts[18][0], b.pts[18][1] + 0.16, b.pts[18][2] - 0.12], [b.pts[18][0], b.pts[18][1] - 0.1, b.pts[18][2] - 0.12], [b.pts[16][0], b.pts[16][1] - 0.08, b.pts[16][2]]], 0.02, '#20242e'); snakeHead(b.head, 1.0, { c: '#20242e', belly: '#f4d870', col: ac }); }

          // ======== BLOOM ========
          else if (P === 'inchworm') { const b = body({ L: 1.0, r: 0.13, amp: 0.02, waves: 1, z0: 0.3, lift: (u) => Math.sin(u * Math.PI) * 0.3, band: hexMix(bd, '#ffffff', 0.25), bands: 7 }); wormHead(b.head, 0.8, { extra: (x, y, z, s) => { plate([[x, y + 0.16 * s, z], [x - 0.12, y + 0.34 * s, z - 0.06], [x, y + 0.42 * s, z - 0.08], [x + 0.1, y + 0.32 * s, z - 0.04]], 0.02, ac); } }); }
          else if (P === 'vinesnake' || P === 'blossomserpent') { const big = P === 'blossomserpent', vine = '#3f6b2a'; const b = body({ L: big ? 3.0 : 2.0, r: big ? 0.22 : 0.13, raise: big ? 0.25 : 0, rh: 0.8, amp: 0.3, waves: 2.4, z0: 0.5, shade: (p, nx, ny, nz, t) => Math.floor(t * 24) % 3 === 0 ? vine : null });
            along(b, 2, (p, d, r, t) => { const sd = Math.floor(t * 20) % 2 ? 1 : -1; plate([[p[0] + sd * r * 0.8, p[1] + r * 0.4, p[2]], [p[0] + sd * (r + 0.2), p[1] + r * 0.6 + 0.06, p[2] - 0.06], [p[0] + sd * (r + 0.1), p[1] + r * 0.4, p[2] - 0.14]], 0.015, ac);
              if (big && t < 0.8) { for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; ball(p[0] + Math.cos(a) * 0.06, p[1] + r + 0.04 + Math.sin(a) * 0.06, p[2], 0.045, '#f4a3d2', { n: 1 }); } ball(p[0], p[1] + r + 0.04, p[2] + 0.02, 0.035, '#ffe08a', { emis: true, n: 1 }); } });
            snakeHead(b.head, big ? 1.4 : 1.0, { brow: big ? vine : null, len: 0.32, extra: big ? (x, y, z, s) => { for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; plate([[x, y + 0.08 * s, z - 0.06], [x + Math.cos(a) * 0.3, y + 0.08 * s + Math.sin(a) * 0.3, z - 0.12], [x + Math.cos(a + 0.35) * 0.22, y + 0.08 * s + Math.sin(a + 0.35) * 0.22, z - 0.1]], 0.015, k % 2 ? '#f4a3d2' : '#ffd8ec'); } } : null }); }
          else if (P === 'gardensnail' || P === 'mushsnail') { const big = P === 'mushsnail'; const b = body({ L: big ? 1.3 : 0.9, r: big ? 0.16 : 0.12, amp: 0.04, waves: 1, z0: 0.4, c: hexMix(bd, '#c8b48a', 0.5), flat: 1.5, prof: (t) => 1 - t * 0.6 });
            const sh = [0, big ? 0.5 : 0.36, big ? -0.3 : -0.2], R = big ? 0.42 : 0.3; for (let i = 0; i < 4; i++) { const r = R * (1 - i * 0.22); ball(sh[0] + i * 0.02, sh[1] + i * r * 0.5, sh[2] - i * 0.02, r, i % 2 ? ac : hexMix(ac, dk, 0.3), { n: 3 }); }
            if (big) { const top = sh[1] + R * 1.6; tube([[0, top - 0.1, sh[2]], [0, top + 0.24, sh[2]]], [0.08, 0.07], '#f2ead6', { cap0: 'none', cap1: 'none' }); blob(-0.34, top + 0.2, sh[2] - 0.34, 0.34, top + 0.5, sh[2] + 0.34, 1, '#d83a3a', { tap: [1, 0.5] }); for (let i = 0; i < 6; i++) { const a = i * 1.05; ball(Math.cos(a) * 0.2, top + 0.42, sh[2] + Math.sin(a) * 0.2, 0.04, '#fff6e0', { n: 1 }); }
              blob(-0.05, top - 0.04, sh[2] + 0.18, 0.05, top + 0.12, sh[2] + 0.26, 0.4, '#6b4a2e'); ball(0.12, top + 0.08, sh[2] + 0.2, 0.03, '#ffe08a', { emis: true, n: 1 }); }
            wormHead(b.head, big ? 0.7 : 0.6, { c: hexMix(bd, '#c8b48a', 0.5), eyes: false, extra: (x, y, z, s) => { for (const sd of [-1, 1]) { tube([[x + sd * 0.06, y + 0.12 * s, z], [x + sd * 0.12, y + 0.42 * s, z + 0.06]], [0.022, 0.016], hexMix(bd, '#c8b48a', 0.5), { cap0: 'none', cap1: 'none' }); ball(x + sd * 0.12, y + 0.46 * s, z + 0.06, 0.05 * s, '#16121e', { n: 2 }); ball(x + sd * 0.12, y + 0.48 * s, z + 0.1 * s, 0.018, '#ffffff', { emis: true, n: 1 }); } } }); }
          else if (P === 'treepython') { const green = hexMix('#2fa04a', bd, 0.3); const b = body({ pose: 'coil', L: 2.6, r: 0.17, rh: 0.8, z0: 0.3, turns: 1.8, cr: 0.5, c: green, belly: '#e8e24a', shade: (p, nx, ny, nz, t) => (ny > 0.6 && Math.floor(t * 30) % 4 === 0) ? '#f4f4d0' : null }); snakeHead(b.head, 1.1, { c: green, belly: '#e8e24a', col: '#ffcf5a' }); along(b, 4, (p, d, r) => plate([[p[0], p[1] + r * 0.9, p[2]], [p[0] + 0.1, p[1] + r + 0.12, p[2] - 0.04], [p[0], p[1] + r * 0.9, p[2] - 0.12]], 0.015, ac)); }

          // ======== STONE ========
          else if (P === 'earthworm') { const b = body({ L: 1.2, r: 0.12, amp: 0.18, waves: 2.2, z0: 0.3, c: '#d88a8a', band: '#c87070', bands: 12 }); wormHead(b.head, 0.6, { c: '#d88a8a', eye: 0.07 }); }
          else if (P === 'sandworm' || P === 'titanworm') { const big = P === 'titanworm', sand = hexMix(bd, '#c8a870', 0.5); const b = body({ L: big ? 3.2 : 2.0, r: big ? 0.42 : 0.24, raise: 0.3, rh: big ? 1.6 : 0.8, lean: 0.1, amp: 0.3, waves: 1.6, z0: 0.3, c: sand, band: hexMix(sand, dk, 0.25), bands: big ? 14 : 10, belly: hexMix(sand, '#ffffff', 0.2) });
            if (big) along(b, 2, (p, d, r, t) => { if (t > 0.1) for (let k = 0; k < 3; k++) { const a = (k - 1) * 0.6; blob(p[0] + Math.sin(a) * r * 0.8 - 0.1, p[1] + Math.cos(a) * r * 0.8 - 0.06, p[2] - 0.1, p[0] + Math.sin(a) * r * 0.8 + 0.1, p[1] + Math.cos(a) * r * 0.8 + 0.08, p[2] + 0.1, 0.4, '#8a847a', { n: 1 }); } });
            wormHead(b.head, big ? 2.3 : 1.2, { c: sand, eyes: false, teeth: big ? 18 : 10, extra: (x, y, z, s) => { for (let k = 0; k < (big ? 4 : 3); k++) { const a = k / (big ? 4 : 3) * Math.PI * 2 + 0.4; plate([[x + Math.cos(a) * 0.18 * s, y + Math.sin(a) * 0.18 * s, z + 0.12 * s], [x + Math.cos(a) * 0.34 * s, y + Math.sin(a) * 0.34 * s, z + 0.28 * s], [x + Math.cos(a + 0.5) * 0.2 * s, y + Math.sin(a + 0.5) * 0.2 * s, z + 0.16 * s]], 0.02, hexMix(sand, dk, 0.2)); } if (big) for (let k = 0; k < 6; k++) ball(x + Math.cos(k) * 0.1 * s, y + 0.2 * s + (k % 2) * 0.04, z + 0.1 * s - k * 0.02, 0.02 * s, glw, { emis: true, n: 1 }); } }); }
          else if (P === 'pebblemillipede' || P === 'armormillipede') { const big = P === 'armormillipede', R = big ? hexMix(bd, '#6a6470', 0.5) : bd; const b = body({ L: big ? 2.0 : 1.2, r: big ? 0.18 : 0.12, amp: 0.16, waves: 2, z0: 0.3, n: 20, c: R, band: hexMix(R, dk, 0.4), bands: 10, prof: () => 1, flat: 1.15 });
            legsAlong(b, 1, big ? 0.16 : 0.1, dk, big ? 0.018 : 0.012); if (big) along(b, 2, (p, d, r) => { blob(p[0] - r * 1.1, p[1] + r * 0.3, p[2] - 0.08, p[0] + r * 1.1, p[1] + r * 1.2, p[2] + 0.08, 0.5, hexMix(R, '#c8c0b0', 0.3), { n: 1 }); for (const sd of [-1, 1]) cone([p[0] + sd * r, p[1] + r * 0.6, p[2]], [sd, 0.5, 0], 0.12, 0.035, glw, { emis: true, segs: 4 }); });
            wormHead(b.head, big ? 0.8 : 0.55, { c: R, extra: (x, y, z, s) => { for (const sd of [-1, 1]) tube([[x + sd * 0.06, y + 0.14 * s, z + 0.06], [x + sd * 0.2, y + 0.3 * s, z + 0.24 * s]], [0.015, 0.008], dk, { cap0: 'none', cap1: 'round' }); } }); }
          else if (P === 'basilisk') { const R = hexMix(bd, '#7a7470', 0.4); const b = body({ L: 2.4, r: 0.22, raise: 0.25, rh: 0.8, amp: 0.3, waves: 2, z0: 0.4, c: R, shade: (p, nx, ny, nz, t) => ((Math.floor(p[2] * 7) + Math.floor(p[0] * 7)) % 2 === 0 && ny > 0) ? hexMix(R, dk, 0.3) : null });
            spikesAlong(b, 2, 0.22, 0.06, glw, { emis: true, segs: 4 }); snakeHead(b.head, 1.4, { c: R, brow: dk, col: glw, glow: true, eye: 0.06, extra: (x, y, z, s) => { for (let k = 0; k < 5; k++) { const a = (k / 4 - 0.5) * 1.6; cone([x + Math.sin(a) * 0.1, y + 0.1 * s, z - 0.04], [Math.sin(a), 1, -0.6], 0.3, 0.035, '#c8c0b0'); } } }); }

          // ======== GALE ========
          else if (P === 'windribbon') { const b = body({ L: 1.4, r: 0.1, amp: 0.3, waves: 2.6, z0: 0.3, flat: 1.8, lift: (u) => 0.2 + Math.sin(u * 6) * 0.08, c: '#f4f8ff', band: hexMix(ac, '#ffffff', 0.4), bands: 5 }); wormHead(b.head, 0.6, { c: '#f4f8ff', eye: 0.07 }); hover = 0.2; }
          else if (P === 'cloudserpent' || P === 'skydragon') { const big = P === 'skydragon', white = '#f4f8ff'; const b = body({ L: big ? 3.4 : 2.4, r: big ? 0.2 : 0.15, amp: 0.34, waves: 2.6, z0: 0.6, c: big ? hexMix(bd, '#ffffff', 0.2) : white, lift: (u) => 0.3 + Math.sin(u * 7) * 0.18, belly: big ? '#f2d27a' : bl });
            along(b, big ? 2 : 3, (p, d, r, t) => { if (t < 0.92) for (let k = 0; k < 3; k++) ball(p[0] + (k - 1) * r * 0.7, p[1] + r * 0.9, p[2], r * 0.55, white, { n: 2 }); });
            if (big) for (const t of [0.15, 0.6]) { const i = Math.floor(t * (b.pts.length - 1)), p = b.pts[i], r = b.rr[i][1]; for (const sd of [-1, 1]) { tube([[p[0] + sd * r * 0.8, p[1] - r * 0.2, p[2]], [p[0] + sd * (r + 0.16), p[1] - 0.2, p[2] + 0.06], [p[0] + sd * (r + 0.2), p[1] - 0.36, p[2] + 0.1]], [0.04, 0.03, 0.025], hexMix(bd, '#ffffff', 0.2), { cap0: 'round', cap1: 'round' }); for (let k = 0; k < 3; k++) cone([p[0] + sd * (r + 0.2), p[1] - 0.36, p[2] + 0.1], [(k - 1) * 0.5, -0.3, 1], 0.08, 0.015, '#f4f0e6'); } }
            snakeHead(b.head, big ? 1.5 : 1.0, { c: big ? hexMix(bd, '#ffffff', 0.2) : white, len: big ? 0.34 : 0.26, tongue: !big, brow: big ? dk : null, col: big ? glw : null, glow: big, extra: big ? (x, y, z, s) => { for (const sd of [-1, 1]) { curl([x + sd * 0.1 * s, y + 0.08 * s, z - 0.04], [sd * 0.2, 1, -1], 0.5 * s, 0.035 * s, '#f2d27a', [sd * 0.3, 0, -0.4]); tube([[x + sd * 0.06 * s, y - 0.02 * s, z + 0.3 * s], [x + sd * 0.3 * s, y - 0.06 * s, z + 0.24 * s], [x + sd * 0.5 * s, y - 0.2 * s, z + 0.1 * s]], [0.012, 0.01, 0.006], '#f2d27a', { cap0: 'none', cap1: 'none' }); } for (let k = 0; k < 6; k++) ball(x + (k % 2 ? 0.08 : -0.08) * s, y + 0.1 * s - k * 0.02, z - 0.1 * s - k * 0.06, 0.07 * s, white, { n: 2 }); } : null }); hover = 0.3; }
          else if (P === 'flyingsnakelet' || P === 'paradisesnake') { const big = P === 'paradisesnake'; const b = body({ L: big ? 2.2 : 1.3, r: big ? 0.12 : 0.09, amp: 0.3, waves: 3, z0: 0.4, flat: 2.2, lift: (u) => 0.4 + Math.sin(u * 5) * 0.1, c: big ? '#2a2e38' : bd, shade: big ? (p, nx, ny, nz, t) => (ny > 0.3 && Math.floor(t * 24) % 2 === 0) ? (Math.floor(t * 24) % 4 === 0 ? '#e8503a' : '#f2d23a') : null : null });
            if (big) along(b, 3, (p, d, r) => { for (const sd of [-1, 1]) cone([p[0] + sd * r * 2, p[1], p[2]], [sd, 0.1, -0.3], 0.14, 0.03, glw); }); snakeHead(b.head, big ? 0.9 : 0.7, { c: big ? '#2a2e38' : bd, eye: 0.065 }); hover = 0.3; }
          else if (P === 'plumedserpent') { const b = body({ L: 2.6, r: 0.17, amp: 0.3, waves: 2.2, z0: 0.6, lift: (u) => 0.25 + Math.sin(u * 5) * 0.12, c: hexMix(bd, '#2fa04a', 0.4), belly: '#f2d27a', band: hexMix(bd, '#2fa04a', 0.6), bands: 9 });
            along(b, 2, (p, d, r, t) => { if (t < 0.9) for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) plate([[p[0] + sd * r * 0.7, p[1] + r * 0.5, p[2]], [p[0] + sd * (r + 0.3 - k * 0.1), p[1] + r + 0.14 - k * 0.04, p[2] - 0.2], [p[0] + sd * (r + 0.1), p[1] + r * 0.4, p[2] - 0.24]], 0.015, k ? '#e8503a' : ac); });
            snakeHead(b.head, 1.3, { c: hexMix(bd, '#2fa04a', 0.4), belly: '#f2d27a', brow: dk, extra: (x, y, z, s) => { for (let k = 0; k < 9; k++) { const a = (k / 8 - 0.5) * 2.8; plate([[x, y + 0.04 * s, z - 0.08], [x + Math.sin(a) * 0.44, y + 0.04 * s + Math.cos(a) * 0.44, z - 0.24], [x + Math.sin(a + 0.16) * 0.36, y + 0.04 * s + Math.cos(a + 0.16) * 0.36, z - 0.2]], 0.015, k % 3 === 0 ? '#e8503a' : k % 3 === 1 ? ac : '#f2d27a'); } } }); hover = 0.25; }

          // ======== FROST ========
          else if (P === 'frostgrub') { const b = body({ L: 0.9, r: 0.15, amp: 0.08, waves: 1.4, z0: 0.3, c: '#eef6ff', band: '#d0e4f4', bands: 6 }); spikesAlong(b, 2, 0.14, 0.03, glw, { emis: true, segs: 4 }); wormHead(b.head, 0.75, { c: '#eef6ff', eye: 0.065 }); }
          else if (P === 'icesnake' || P === 'glacierwyrm') { const big = P === 'glacierwyrm', ice = hexMix(bd, '#ffffff', 0.35); const b = body({ L: big ? 3.2 : 2.0, r: big ? 0.3 : 0.15, raise: big ? 0.25 : 0, rh: 1.0, amp: 0.3, waves: 2.2, z0: 0.5, c: ice, belly: '#ffffff', shade: (p, nx, ny, nz, t) => ny > 0.5 && Math.floor(t * 20) % 3 === 0 ? glw : null });
            spikesAlong(b, big ? 1 : 2, big ? 0.4 : 0.18, big ? 0.08 : 0.04, glw, { emis: true, segs: 4 }); if (big) along(b, 3, (p, d, r) => { for (const sd of [-1, 1]) cone([p[0] + sd * r * 0.9, p[1] - r * 0.3, p[2]], [sd, -0.4, 0], 0.18, 0.04, glw, { emis: true, segs: 4 }); });
            snakeHead(b.head, big ? 1.7 : 1.0, { c: ice, belly: '#ffffff', col: glw, glow: big, brow: big ? '#c8d8e8' : null, len: big ? 0.32 : 0.26, tongue: !big, extra: (x, y, z, s) => { for (let k = 0; k < (big ? 5 : 3); k++) { const a = (k / ((big ? 5 : 3) - 1) - 0.5) * 1.6; cone([x + Math.sin(a) * 0.08 * s, y + 0.08 * s, z - 0.04], [Math.sin(a), 1, -0.5], (big ? 0.4 : 0.18) * (k === Math.floor((big ? 5 : 3) / 2) ? 1.2 : 1), 0.035 * s, glw, { emis: true, segs: 4 }); } if (big) for (let k = 0; k < 4; k++) cone([x + (k - 1.5) * 0.06 * s, y - 0.08 * s, z + 0.24 * s], [0, -1, 0.1], 0.18, 0.025, glw, { emis: true }); } }); }
          else if (P === 'icicleel' || P === 'auroraeel') { const big = P === 'auroraeel', aur = ['#7ae8c8', '#7ab8f8', '#b88af8', '#f88ad8']; const b = body({ L: big ? 2.4 : 1.4, r: big ? 0.15 : 0.1, amp: 0.3, waves: 2.4, z0: 0.4, c: '#e8f4ff', lift: (u) => big ? 0.25 + Math.sin(u * 5) * 0.1 : 0, shade: big ? (p, nx, ny, nz, t) => ny > 0.2 ? aur[Math.floor(t * 8) % 4] : null : null, emis: false });
            finAlong(b, 0.05, 1, big ? 0.22 : 0.1, big ? '#b8f0ff' : glw, { edge: big ? '#f88ad8' : '#ffffff', emis: big }); eelHead(b.head, big ? 1.0 : 0.7, { c: '#e8f4ff', col: glw, glow: true, eye: 0.06 }); if (big) hover = 0.25; }
          else if (P === 'whiterattler') { const b = body({ L: 2.0, r: 0.16, pose: 'coil', rh: 0.6, turns: 1.6, cr: 0.46, z0: 0.3, c: '#f2f4f6', shade: (p, nx, ny, nz, t) => ny > 0.3 && Math.floor(t * 16) % 2 === 0 ? '#a8b8cc' : null }); const tp = b.pts[b.pts.length - 2]; for (let k = 0; k < 4; k++) blob(tp[0] - 0.05 + k * 0.01, tp[1] + 0.04 + k * 0.06, tp[2] - 0.05, tp[0] + 0.05 - k * 0.01, tp[1] + 0.1 + k * 0.06, tp[2] + 0.05, 0.3, glw, { emis: true, n: 1 }); snakeHead(b.head, 1.1, { c: '#f2f4f6', brow: '#a8b8cc', col: glw }); }

          // ======== SPARK ========
          else if (P === 'wireworm') { const b = body({ L: 1.0, r: 0.1, amp: 0.2, waves: 3, z0: 0.3, c: '#c87a3a', band: '#e8a060', bands: 10 }); wormHead(b.head, 0.6, { c: '#c87a3a', col: glw, glow: true, eye: 0.07, extra: (x, y, z, s) => { for (const sd of [-1, 1]) tube([[x + sd * 0.04, y + 0.12 * s, z], [x + sd * 0.1, y + 0.24 * s, z], [x + sd * 0.06, y + 0.3 * s, z]], [0.012, 0.01, 0.008], glw, { emis: true, cap0: 'none', cap1: 'round' }); } }); }
          else if (P === 'electriceel' || P === 'thundereel') { const big = P === 'thundereel'; const b = body({ L: big ? 3.0 : 2.0, r: big ? 0.22 : 0.15, raise: big ? 0.22 : 0, rh: 0.9, amp: 0.3, waves: 2.2, z0: 0.5, c: hexMix(bd, '#3a3e48', 0.5), belly: '#f2d23a', shade: (p, nx, ny, nz, t) => Math.abs(nx) > 0.7 && Math.floor(t * 30) % 2 === 0 ? glw : null });
            finAlong(b, 0.3, 1, big ? 0.14 : 0.06, glw, { emis: true, even: true }); along(b, big ? 2 : 3, (p, d, r, t) => { if (t > 0.15) plate([[p[0], p[1] + r, p[2] + 0.04], [p[0] + 0.03, p[1] + r + 0.16, p[2]], [p[0], p[1] + r + 0.1, p[2] - 0.02], [p[0] + 0.03, p[1] + r + 0.26, p[2] - 0.08]], 0.02, glw, { emis: true }); });
            eelHead(b.head, big ? 1.5 : 1.0, { c: hexMix(bd, '#3a3e48', 0.5), belly: '#f2d23a', col: glw, glow: true, teeth: big, brow: big ? dk : null, extra: big ? (x, y, z, s) => { for (const sd of [-1, 1]) { curl([x + sd * 0.12 * s, y + 0.08 * s, z - 0.04], [sd * 0.4, 1, -0.6], 0.4 * s, 0.04 * s, glw, [0, 0.4, -0.4], { emis: true }); plate([[x + sd * 0.14 * s, y, z], [x + sd * 0.36 * s, y + 0.2 * s, z - 0.2 * s], [x + sd * 0.3 * s, y - 0.1 * s, z - 0.16 * s]], 0.02, glw, { emis: true }); } } : null }); }
          else if (P === 'coilsnake' || P === 'teslaserpent') { const big = P === 'teslaserpent', cu = '#c87a3a'; const b = body({ pose: 'coil', L: big ? 2.6 : 1.6, r: big ? 0.15 : 0.11, rh: big ? 1.0 : 0.6, turns: big ? 3.2 : 2.4, cr: big ? 0.3 : 0.24, z0: 0.2, c: big ? '#3a3d48' : bd, band: cu, bands: big ? 16 : 10 });
            if (big) { ball(0, b.head[1] + 0.4, b.head[2] - 0.12, 0.14, glw, { emis: true, n: 2 }); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; tube([[Math.cos(a) * 0.14, b.head[1] + 0.4, b.head[2] - 0.12 + Math.sin(a) * 0.14], [Math.cos(a + 0.4) * 0.3, b.head[1] + 0.5, b.head[2] - 0.12 + Math.sin(a + 0.4) * 0.3], [Math.cos(a) * 0.42, b.head[1] + 0.38, b.head[2] - 0.12 + Math.sin(a) * 0.42]], [0.015, 0.012, 0.006], glw, { emis: true, cap0: 'round', cap1: 'round' }); } }
            snakeHead(b.head, big ? 1.2 : 0.9, { c: big ? '#3a3d48' : bd, col: glw, glow: big, brow: big ? cu : null }); }
          else if (P === 'batteryrattler') { const b = body({ L: 2.0, r: 0.16, amp: 0.26, waves: 2.2, z0: 0.4, shade: (p, nx, ny, nz, t) => ny > 0.4 && (Math.floor(t * 14) % 2 === 0) ? hexMix(bd, dk, 0.35) : null }); const tp = b.pts[b.pts.length - 2]; blob(tp[0] - 0.08, tp[1] - 0.02, tp[2] - 0.24, tp[0] + 0.08, tp[1] + 0.14, tp[2], 0.5, '#3a3e48'); blob(tp[0] - 0.081, tp[1] + 0.02, tp[2] - 0.2, tp[0] + 0.081, tp[1] + 0.1, tp[2] - 0.12, 0.5, glw, { emis: true, n: 1 }); tube([[tp[0], tp[1] + 0.06, tp[2] - 0.24], [tp[0], tp[1] + 0.06, tp[2] - 0.3]], [0.03, 0.03], '#c87a3a', { cap0: 'none', cap1: 'flat' }); snakeHead(b.head, 1.1, { brow: dk, col: glw }); }

          // ======== VOID ========
          else if (P === 'shadowgrub') { const b = body({ L: 0.9, r: 0.15, amp: 0.08, waves: 1.4, z0: 0.3, c: hexMix(bd, dk, 0.4), band: dk, bands: 6 }); along(b, 3, (p, d, r) => ball(p[0], p[1] + r * 0.6, p[2], 0.03, glw, { emis: true, n: 1 })); wormHead(b.head, 0.75, { c: hexMix(bd, dk, 0.4), col: glw, glow: true, eye: 0.07 }); }
          else if (P === 'nightadder') { const b = body({ L: 2.0, r: 0.15, amp: 0.26, waves: 2.4, z0: 0.4, c: hexMix(bd, dk, 0.5), shade: (p, nx, ny, nz, t) => ny > 0.5 && Math.floor(t * 16) % 3 === 0 ? glw : null }); along(b, 3, (p, d, r, t) => { if (t < 0.8) tube([[p[0], p[1] + r * 0.8, p[2]], [p[0], p[1] + r + 0.12, p[2] - 0.14], [p[0], p[1] + r + 0.04, p[2] - 0.28]], [0.03, 0.02, 0.004], ac, { emis: true, cap0: 'none', cap1: 'none' }); }); snakeHead(b.head, 1.05, { c: hexMix(bd, dk, 0.5), brow: dk, col: glw, glow: true }); }
          else if (P === 'voidwyrm') { const R = hexMix(bd, '#1a1620', 0.6), pts = [], rr = [], n = 28; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 1.9 + Math.PI * 0.55; pts.push([0, 0.9 + Math.sin(a) * 0.8, Math.cos(a) * 0.8]); rr.push(0.22 * (1 - (i / n) * 0.7)); } // a great ring standing on its edge, biting its own tail
            tube(pts, rr, R, { cap0: 'round', cap1: 'none', segs: 10, shade: (p, nx, ny, nz, t) => U.hexToRgb(Math.floor(t * 28) % 4 === 0 ? glw : Math.abs(nx) > 0.6 ? hexMix(R, ac, 0.3) : R) });
            for (let i = 2; i < n; i += 2) { const p = pts[i], a = i / n * Math.PI * 1.9 + Math.PI * 0.55; cone([0, p[1] + Math.sin(a) * rr[i], p[2] + Math.cos(a) * rr[i]], [0, Math.sin(a), Math.cos(a)], 0.2, 0.05, ac, { emis: true }); }
            const h = pts[0]; snakeHead([h[0], h[1] + 0.04, h[2]], 1.6, { c: R, brow: dk, col: glw, glow: true, len: 0.3, tongue: false, extra: (x, y, z, s) => { for (const sd of [-1, 1]) curl([x + sd * 0.12 * s, y + 0.08 * s, z - 0.04], [sd * 0.5, 1, -0.6], 0.5, 0.05, ac, [sd * 0.3, -0.2, -0.6], { emis: true }); } });
            for (let i = 0; i < 6; i++) { const a = i * 1.05; ball(Math.cos(a) * 0.3, 0.9 + Math.sin(a) * 0.3, 0, 0.04, glw, { emis: true, n: 1 }); } legLen = 0.2; }
          else if (P === 'lamprey' || P === 'abysslamprey') { const big = P === 'abysslamprey'; const b = body({ L: big ? 2.6 : 1.4, r: big ? 0.22 : 0.13, raise: big ? 0.2 : 0, rh: 0.8, amp: 0.26, waves: 2.2, z0: 0.4, c: hexMix(bd, dk, 0.4), shade: (p, nx, ny, nz, t) => (Math.abs(nx) > 0.6 && t < 0.2 && Math.floor(t * 40) % 2 === 0) ? glw : null }); finAlong(b, 0.4, 1, big ? 0.14 : 0.08, ac, { emis: big });
            wormHead(b.head, big ? 1.4 : 0.8, { c: hexMix(bd, dk, 0.4), teeth: big ? 22 : 12, col: glw, glow: true, eye: 0.04, extra: big ? (x, y, z, s) => { for (let k = 0; k < 2; k++) for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + k * 0.25; cone([x + Math.cos(a) * 0.08 * s * (1 + k * 0.4), y + Math.sin(a) * 0.08 * s * (1 + k * 0.4), z + 0.15 * s], [-Math.cos(a), -Math.sin(a), 0.3], 0.05 * s, 0.012 * s, glw, { emis: true }); } } : null }); }
          else if (P === 'twohead') { const R = hexMix(bd, dk, 0.3); const pts = [], rr = [], n = 18; for (let i = 0; i <= n; i++) { const t = i / n; pts.push([Math.sin(t * Math.PI * 2) * 0.3, 0.16, 0.6 - t * 1.2]); rr.push(0.15); } tube(pts, rr, R, { cap0: 'none', cap1: 'none', segs: 10, shade: (p, nx, ny, nz, t) => U.hexToRgb(ny < -0.3 ? bl : Math.floor(t * 12) % 2 ? hexMix(R, ac, 0.3) : R) });
            snakeHead([pts[0][0], pts[0][1], pts[0][2]], 1.0, { c: R, col: glw, glow: true }); bone = 0; const t2 = pts[n]; blob(t2[0] - 0.13, t2[1] - 0.07, t2[2] - 0.26, t2[0] + 0.13, t2[1] + 0.08, t2[2] + 0.1, 0.9, R, { under: bl, tap: [0.8, 1] }); look(0.085, t2[1] + 0.06, t2[2] - 0.06, 0.05, { col: ac, glow: true }); for (const sd of [-1, 1]) { ball(sd * 0.085, t2[1] + 0.06, t2[2] - 0.12, 0.05, '#16121e', { n: 2 }); ball(sd * 0.085, t2[1] + 0.06, t2[2] - 0.15, 0.03, ac, { emis: true, n: 1 }); } }

          // ======== LIGHT ========
          else if (P === 'glowworm') { const b = body({ L: 0.9, r: 0.13, amp: 0.1, waves: 1.6, z0: 0.3, c: '#f2ead6', band: '#e8dcc0', bands: 6 }); const tp = b.pts[b.pts.length - 3]; ball(tp[0], tp[1] + 0.04, tp[2], 0.14, '#fff3b0', { emis: true, n: 2 }); wormHead(b.head, 0.7, { c: '#f2ead6', eye: 0.065 }); }
          else if (P === 'goldencobra' || P === 'suncobra') { const big = P === 'suncobra', gold = '#e2b84a'; const b = body({ L: big ? 2.6 : 2.0, r: big ? 0.2 : 0.16, raise: 0.3, rh: big ? 1.2 : 0.9, amp: 0.3, waves: 1.6, z0: 0.3, c: gold, belly: '#fff3c0', band: big ? '#fff3b0' : hexMix(gold, dk, 0.2), bands: 8 });
            snakeHead(b.head, big ? 1.4 : 1.1, { c: gold, belly: '#fff3c0', brow: big ? '#c8902a' : null, col: big ? '#ffffff' : null, glow: big });
            hood(b.head, big ? 1.4 : 1.15, gold, '#fff3b0', { w: big ? 0.5 : 0.4, mark: (x, y, z, w, h) => { if (big) { ring(x, y + h * 0.1, z - 0.02, w * 0.5, w * 0.5, 0.025, '#ffd25a', { emis: true }); blob(x - w * 0.3, y + h * 0.1 - w * 0.3, z - 0.03, x + w * 0.3, y + h * 0.1 + w * 0.3, z - 0.01, 1, '#ffd25a', { emis: true }); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; cone([x + Math.cos(a) * w * 0.9, y + h * 0.1 + Math.sin(a) * w * 0.9, z - 0.03], [Math.cos(a), Math.sin(a), 0], i % 2 ? 0.14 : 0.24, 0.04, '#ffd25a', { emis: true }); } } else for (const sd of [-1, 1]) { ball(x + sd * w * 0.35, y, z, w * 0.14, '#fff3b0', { n: 2 }); ball(x + sd * w * 0.35, y, z + 0.01, w * 0.07, '#20242e', { n: 1 }); } } }); }
          else if (P === 'lanterneel' || P === 'beaconeel') { const big = P === 'beaconeel'; const b = body({ L: big ? 2.4 : 1.3, r: big ? 0.18 : 0.11, amp: 0.26, waves: 2.2, z0: 0.4, c: hexMix(bd, '#20242e', 0.5), shade: (p, nx, ny, nz, t) => (Math.abs(nx) > 0.6 && Math.floor(t * 20) % 3 === 0) ? '#fff3b0' : null }); finAlong(b, 0.2, 1, big ? 0.14 : 0.07, '#fff3b0', { emis: true });
            eelHead(b.head, big ? 1.3 : 0.8, { c: hexMix(bd, '#20242e', 0.5), col: '#fff3b0', glow: true, eye: 0.05, extra: (x, y, z, s) => { const tp = [x, y + (big ? 0.5 : 0.3) * s, z + 0.24 * s]; tube([[x, y + 0.1 * s, z], [x, y + (big ? 0.5 : 0.32) * s, z + 0.06], tp], [0.02, 0.016, 0.012], hexMix(bd, '#20242e', 0.5), { cap0: 'none', cap1: 'none' }); ball(tp[0], tp[1], tp[2], (big ? 0.12 : 0.07) * s, '#fff3b0', { emis: true, n: 2 }); if (big) for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; cone([tp[0] + Math.cos(a) * 0.14 * s, tp[1] + Math.sin(a) * 0.14 * s, tp[2]], [Math.cos(a), Math.sin(a), 0], 0.1 * s, 0.02 * s, '#ffd25a', { emis: true }); } } }); }
          else if (P === 'rainbowboa') { const rb = ['#e85a5a', '#f2a23a', '#f2d23a', '#5ad87a', '#5aa8e8', '#9a7ae8']; const b = body({ pose: 'coil', L: 2.6, r: 0.18, rh: 0.7, turns: 1.7, cr: 0.5, z0: 0.3, c: '#c8a070', shade: (p, nx, ny, nz, t) => ny > 0.2 ? rb[Math.floor(t * 18 + nx * 2 + 12) % 6] : null }); snakeHead(b.head, 1.1, { c: '#c8a070', col: '#ffffff' }); along(b, 4, (p, d, r) => ball(p[0], p[1] + r + 0.04, p[2], 0.025, '#ffffff', { emis: true, n: 1 })); }
          break;
        }
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
        const BP = form.plan;
        if (BP) { // a starter with a design of its own: what it is should be plain at a glance
          const glw = hexMix(C.accent, '#ffffff', 0.3), dk = C.dark, bel = C.belly, bl = C.belly, bd = C.body, ac = C.accent;
          const face = (y, z, r, x = 0.17, o = {}) => { LOOK(x, y, z, r, o); if (!o.noMouth) plate([[-0.06, y - r * 1.6, z + 0.04], [0.06, y - r * 1.6, z + 0.04], [0, y - r * 2.1, z + 0.05]], 0.01, dk); };
          const feet = (y, x = 0.2, c = dk) => { for (const sd of [-1, 1]) blob(sd * x - 0.1, 0, -0.04, sd * x + 0.1, y, 0.2, 0.7, c, { n: 2 }); };
          if (BP === 'ember') { // a living flame: a teardrop of fire with a crown that licks upward, little arms, a hot core
            blob(-0.36, 0.06, -0.32, 0.36, 0.7, 0.32, 1, C.body, { under: bel, tap: [0.75, 0.6] }); ball(0, 0.32, 0.18, 0.14, glw, { emis: true, n: 2 });
            for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * 1.6; cone([Math.sin(a) * 0.14, 0.6, -0.02], [Math.sin(a) * 0.6, 1, -0.2], 0.46 - Math.abs(i - 2) * 0.1, 0.1, i % 2 ? C.accent : glw, { emis: true }); }
            for (const sd of [-1, 1]) tube([[sd * 0.32, 0.38, 0.04], [sd * 0.48, 0.3, 0.12]], [0.05, 0.035], C.body, { cap0: 'none', cap1: 'round' }); face(0.46, 0.27, 0.07, 0.12); feet(0.08, 0.16, C.accent); legLen = 0.12;
          } else if (BP === 'coal') { // a lump of coal that woke up: dark facets, glowing cracks, stubby feet, two hot eyes
            blob(-0.38, 0.06, -0.3, 0.38, 0.6, 0.3, 0.35, '#2a2426', { n: 2 }); blob(-0.24, 0.42, -0.2, 0.2, 0.76, 0.18, 0.3, '#352e30', { n: 2 }); blob(0.04, 0.3, -0.1, 0.42, 0.62, 0.26, 0.3, '#2f292b', { n: 2 });
            for (const pth of [[[-0.3, 0.18, 0.31], [-0.18, 0.3, 0.32], [-0.22, 0.44, 0.31]], [[0.1, 0.14, 0.31], [0.2, 0.26, 0.32], [0.32, 0.3, 0.3]], [[-0.1, 0.62, 0.19], [0.0, 0.72, 0.16]]]) tube(pth, pth.map(() => 0.018), glw, { cap0: 'round', cap1: 'round', emis: true });
            for (const sd of [-1, 1]) { ball(sd * 0.12, 0.46, 0.3, 0.05, '#16121e', { n: 2 }); ball(sd * 0.12, 0.46, 0.33, 0.032, glw, { emis: true, n: 1 }); } feet(0.1, 0.2, '#2a2426'); legLen = 0.12;
          } else if (BP === 'jelly') { // a tidepool jelly: a soft dome with a frilled rim and trailing tentacles, it bobs in the air
            blob(-0.42, 0.42, -0.42, 0.42, 0.92, 0.42, 1, C.body, { under: bel }); ring(0, 0.44, 0, 0.42, 0.42, 0.04, glw, { emis: true }); ball(0, 0.68, 0, 0.16, glw, { emis: true, n: 2 });
            for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const x = Math.cos(a) * 0.28, z = Math.sin(a) * 0.28; tube([[x, 0.44, z], [x * 1.1, 0.26, z * 1.1], [x * 0.9, 0.08, z * 0.9 + 0.05]], [0.035, 0.03, 0.015], C.accent, { cap0: 'none', cap1: 'round' }); }
            face(0.66, 0.36, 0.07, 0.15); hover = 0.15; legLen = 0.08;
          } else if (BP === 'hermit') { // a hermit in a spiral shell: claws and eye-stalks out of the doorway
            for (let i = 0; i < 4; i++) { const r = 0.36 - i * 0.07; blob(-r, 0.12 + i * 0.16, -0.3 - i * 0.06, r, 0.12 + i * 0.16 + r * 1.3, -0.3 - i * 0.06 + r * 1.6, 1, i % 2 ? C.body : hexMix(C.body, bel, 0.5), { n: 2 }); }
            for (const sd of [-1, 1]) { blob(sd * 0.2 - 0.1, 0.1, 0.18, sd * 0.2 + 0.1, 0.28, 0.42, 0.8, C.accent, { n: 2 }); cone([sd * 0.2, 0.22, 0.42], [sd * 0.3, 0.3, 1], 0.14, 0.04, C.accent); tube([[sd * 0.08, 0.28, 0.24], [sd * 0.1, 0.5, 0.28]], [0.025, 0.02], C.accent, { cap0: 'none', cap1: 'none' }); ball(sd * 0.1, 0.54, 0.28, 0.06, '#16121e', { n: 2 }); ball(sd * 0.1 - sd * 0.01, 0.56, 0.33, 0.025, '#ffffff', { emis: true, n: 1 }); }
            feet(0.08, 0.26, C.accent); legLen = 0.1;
          } else if (BP === 'bubble') { // a bubble with a fish inside it: a clear ball, fins poking through, bubbles trailing up
            blob(-0.4, 0.1, -0.4, 0.4, 0.9, 0.4, 1, hexMix(C.body, '#ffffff', 0.35), { under: bel }); for (const sd of [-1, 1]) plate([[sd * 0.36, 0.5, 0], [sd * 0.56, 0.62, -0.12], [sd * 0.5, 0.36, -0.08]], 0.025, C.accent, { edge: glw });
            plate([[0, 0.86, -0.1], [0, 1.06, -0.24], [0, 0.88, -0.32]], 0.025, C.accent); for (let i = 0; i < 4; i++) ball(0.2 + i * 0.05, 0.9 + i * 0.16, -0.1 - i * 0.04, 0.05 - i * 0.008, '#e8fbff', { emis: true, n: 1 });
            face(0.56, 0.36, 0.09, 0.15); hover = 0.12; legLen = 0.06;
          } else if (BP === 'seed') { // a seed pod: an acorn body under a cap with a stem and one new leaf
            blob(-0.34, 0.08, -0.32, 0.34, 0.66, 0.32, 1, C.body, { under: bel, tap: [0.9, 1] }); blob(-0.4, 0.56, -0.38, 0.4, 0.82, 0.38, 0.85, hexMix(C.dark, '#5a3a22', 0.5), { n: 2 });
            tube([[0, 0.8, 0], [0.04, 0.96, -0.02]], [0.04, 0.03], '#5a3a22', { cap0: 'none', cap1: 'round' }); plate([[0.04, 0.94, -0.02], [0.26, 1.06, -0.06], [0.14, 0.92, 0.0]], 0.02, C.accent);
            face(0.4, 0.3, 0.075, 0.13); feet(0.1, 0.16); legLen = 0.12;
          } else if (BP === 'bulb') { // a bulb with roots for feet and a green shoot on top
            blob(-0.38, 0.14, -0.36, 0.38, 0.74, 0.36, 1, bel, { under: C.body, tap: [0.55, 1] }); for (let i = 0; i < 3; i++) plate([[0, 0.7, 0], [(i - 1) * 0.22, 1.08 + (i === 1 ? 0.12 : 0), -0.04], [(i - 1) * 0.1, 0.86, 0.04]], 0.025, C.accent);
            for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * 2.4; tube([[Math.sin(a) * 0.2, 0.16, Math.cos(a) * 0.1], [Math.sin(a) * 0.36, 0.02, Math.cos(a) * 0.2]], [0.03, 0.012], '#8a6a42', { cap0: 'none', cap1: 'round' }); }
            face(0.42, 0.33, 0.075, 0.14); legLen = 0.06;
          } else if (BP === 'pebble') { // a river pebble with a cushion of moss on its back, sleepy eyes, little stone feet
            blob(-0.44, 0.08, -0.36, 0.44, 0.52, 0.36, 1, C.body, { under: hexMix(C.body, C.dark, 0.3) }); blob(-0.26, 0.44, -0.24, 0.24, 0.58, 0.16, 0.9, '#5f8a3a', { n: 2 });
            for (const sd of [-1, 1]) { blob(sd * 0.16 - 0.07, 0.3, 0.33, sd * 0.16 + 0.07, 0.36, 0.37, 0.7, '#16121e', { n: 1 }); } feet(0.08, 0.24, hexMix(C.body, C.dark, 0.3)); legLen = 0.1;
          } else if (BP === 'geode') { // a rough grey rock split open at the front: crystals glowing inside
            blob(-0.42, 0.06, -0.38, 0.42, 0.72, 0.36, 0.45, '#6a6470', { n: 2 }); blob(-0.3, 0.16, 0.14, 0.3, 0.6, 0.4, 0.6, '#2a2430', { n: 2 });
            for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; cone([Math.cos(a) * 0.1, 0.38 + Math.sin(a) * 0.1, 0.28], [Math.cos(a) * 0.6, Math.sin(a) * 0.6, 1], 0.26, 0.08, glw, { emis: true }); } ball(0, 0.38, 0.34, 0.08, glw, { emis: true, n: 2 });
            for (const sd of [-1, 1]) { ball(sd * 0.26, 0.6, 0.26, 0.05, '#16121e', { n: 2 }); ball(sd * 0.26, 0.61, 0.3, 0.02, '#ffffff', { emis: true, n: 1 }); } feet(0.08, 0.24, '#6a6470'); legLen = 0.1;
          } else if (BP === 'puff') { // a puff of cloud with a face, tufts all round, drifting
            for (const [x, y, z, r] of [[0, 0.5, 0, 0.32], [-0.3, 0.42, -0.04, 0.22], [0.3, 0.42, -0.04, 0.22], [-0.14, 0.7, -0.08, 0.2], [0.16, 0.7, -0.06, 0.2], [0, 0.34, -0.2, 0.22]]) ball(x, y, z, r, '#f4f8ff', { n: 3 });
            face(0.5, 0.3, 0.07, 0.12); for (const sd of [-1, 1]) ball(sd * 0.22, 0.42, 0.28, 0.04, '#ffb0c8', { n: 1 }); hover = 0.2; legLen = 0.06;
          } else if (BP === 'snowball') { // two stacked snowballs come alive: twig arms, an icicle quiff, a carrot of a nose
            ball(0, 0.3, 0, 0.32, '#f4f8ff', { n: 3 }); ball(0, 0.74, 0.02, 0.22, '#f4f8ff', { n: 3 }); for (const sd of [-1, 1]) tube([[sd * 0.26, 0.42, 0.04], [sd * 0.5, 0.56, 0.06], [sd * 0.6, 0.6, 0.02]], [0.025, 0.02, 0.01], '#6b4a2a', { cap0: 'none', cap1: 'round' });
            for (let i = 0; i < 3; i++) cone([(i - 1) * 0.06, 0.92, -0.02], [(i - 1) * 0.4, 1, -0.3], 0.2, 0.04, glw, { emis: true }); cone([0, 0.72, 0.2], [0, 0, 1], 0.14, 0.035, '#ff9a4a');
            face(0.8, 0.18, 0.05, 0.08, { noMouth: true }); legLen = 0.04;
          } else if (BP === 'icicle') { // an icicle on two feet: a spike of clear ice with a face in it
            cone([0, 0.12, 0], [0, 1, 0], 1.0, 0.3, hexMix(C.body, '#ffffff', 0.3)); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; cone([Math.cos(a) * 0.14, 0.16, Math.sin(a) * 0.14], [Math.cos(a), 1.6, Math.sin(a)], 0.4, 0.08, glw, { emis: true }); }
            face(0.42, 0.18, 0.06, 0.09); feet(0.1, 0.14, C.accent); legLen = 0.12;
          } else if (BP === 'spark') { // a spark with a face: a bright core with five points of lightning
            ball(0, 0.5, 0, 0.26, C.body, { n: 3 }); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + Math.PI / 2; cone([Math.cos(a) * 0.2, 0.5 + Math.sin(a) * 0.2, 0], [Math.cos(a), Math.sin(a), 0.05], 0.3, 0.09, i % 2 ? C.accent : glw, { emis: true }); }
            face(0.54, 0.24, 0.06, 0.1); hover = 0.12; legLen = 0.06;
          } else if (BP === 'bug') { // a battery beetle: a split shell, a coiled antenna that glows, six little legs
            blob(-0.3, 0.12, -0.36, 0.3, 0.5, 0.3, 1, C.body, { under: bel }); for (const sd of [-1, 1]) plate([[sd * 0.02, 0.5, 0.28], [sd * 0.32, 0.4, 0.1], [sd * 0.3, 0.32, -0.34], [sd * 0.02, 0.48, -0.36]], 0.025, C.accent, { edge: dk });
            ball(0, 0.36, 0.34, 0.16, dk, { n: 2 }); for (const sd of [-1, 1]) { tube([[sd * 0.06, 0.46, 0.4], [sd * 0.16, 0.66, 0.44], [sd * 0.1, 0.76, 0.4], [sd * 0.18, 0.84, 0.44]], [0.015, 0.015, 0.015, 0.012], glw, { cap0: 'none', cap1: 'round', emis: true }); ball(sd * 0.18, 0.86, 0.44, 0.035, glw, { emis: true, n: 1 }); for (let i = 0; i < 3; i++) tube([[sd * 0.22, 0.2, 0.18 - i * 0.2], [sd * 0.38, 0.04, 0.2 - i * 0.2]], [0.02, 0.015], dk, { cap0: 'none', cap1: 'round' }); }
            for (const sd of [-1, 1]) { ball(sd * 0.08, 0.42, 0.47, 0.035, glw, { emis: true, n: 1 }); } legLen = 0.06;
          } else if (BP === 'wisp') { // a shadow wisp: a little ghost with a long trailing tail and lamp eyes, floating
            blob(-0.3, 0.42, -0.28, 0.3, 0.96, 0.28, 1, C.body, { under: C.dark }); tube([[0, 0.5, -0.1], [0.1, 0.3, -0.3], [-0.06, 0.16, -0.5], [0.08, 0.1, -0.7]], [0.22, 0.14, 0.08, 0.0005], C.body, { cap0: 'none', cap1: 'none' });
            for (const sd of [-1, 1]) { ball(sd * 0.12, 0.72, 0.25, 0.07, '#f2ecff', { emis: true, n: 2 }); ball(sd * 0.12, 0.71, 0.3, 0.035, '#16121e', { n: 2 }); } for (const sd of [-1, 1]) tube([[sd * 0.26, 0.66, 0], [sd * 0.4, 0.56, 0.08]], [0.05, 0.02], C.body, { cap0: 'none', cap1: 'round' }); hover = 0.25; legLen = 0.06;
          } else if (BP === 'ink') { // a drop of ink: a glossy teardrop on curling tentacle feet, one bright highlight
            blob(-0.34, 0.14, -0.32, 0.34, 0.86, 0.32, 1, C.dark, { under: C.body, tap: [0.4, 1] }); ball(-0.14, 0.66, 0.24, 0.045, '#ffffff', { emis: true, n: 2 });
            for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; tube([[Math.cos(a) * 0.2, 0.2, Math.sin(a) * 0.2], [Math.cos(a) * 0.36, 0.07, Math.sin(a) * 0.36], [Math.cos(a + 0.4) * 0.46, 0.08, Math.sin(a + 0.4) * 0.46], [Math.cos(a + 0.7) * 0.44, 0.16, Math.sin(a + 0.7) * 0.44]], [0.08, 0.06, 0.04, 0.02], C.dark, { cap0: 'none', cap1: 'round' }); }
            face(0.44, 0.3, 0.07, 0.13, { glow: true, col: C.accent }); legLen = 0.06;
          } else if (BP === 'mote') { // a firefly mote: a small bug with clear wings and a glowing tail-light
            blob(-0.16, 0.42, -0.1, 0.16, 0.7, 0.24, 1, C.dark, { n: 2 }); ball(0, 0.5, -0.24, 0.2, glw, { emis: true, n: 3 }); for (const sd of [-1, 1]) plate([[sd * 0.08, 0.66, 0.02], [sd * 0.5, 0.84, -0.12], [sd * 0.42, 0.66, -0.3]], 0.015, '#eaf6ff', { edge: C.accent });
            for (const sd of [-1, 1]) tube([[sd * 0.05, 0.68, 0.2], [sd * 0.12, 0.86, 0.3]], [0.012, 0.008], C.dark, { cap0: 'none', cap1: 'round' }); face(0.58, 0.24, 0.05, 0.08, { noMouth: true }); hover = 0.3; legLen = 0.05;
          } else if (BP === 'sunbeam') { // a little sun with a face, rays all round it, floating warm
            ball(0, 0.56, 0, 0.3, C.body, { n: 3 }); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; cone([Math.cos(a) * 0.26, 0.56 + Math.sin(a) * 0.26, -0.04], [Math.cos(a), Math.sin(a), 0], i % 2 ? 0.16 : 0.24, 0.06, i % 2 ? C.accent : glw, { emis: true }); }
            face(0.6, 0.27, 0.06, 0.1); for (const sd of [-1, 1]) ball(sd * 0.2, 0.48, 0.24, 0.04, '#ffb0a0', { n: 1 }); hover = 0.2; legLen = 0.06;
          } else if (BP === 'smog') { // FLAME 2: the coal has caught: a sulky cloud of smoke with a fire glowing in its belly
            const sm = '#5b5458', sm2 = '#3e383c';
            ball(0, 0.56, 0.1, 0.16, glw, { emis: true, n: 2 });
            [[0, 0.62, 0, 0.3], [-0.3, 0.54, -0.04, 0.22], [0.3, 0.56, -0.02, 0.22], [-0.12, 0.84, -0.06, 0.22], [0.16, 0.82, -0.1, 0.2], [0, 0.42, -0.16, 0.22], [0, 0.64, -0.3, 0.22]].forEach(([x, y, z, r], i) => ball(x, y, z, r, i % 2 ? sm : sm2, { n: 3 }));
            for (const sd of [-1, 1]) plate([[sd * 0.04, 0.72, 0.3], [sd * 0.2, 0.7, 0.26], [sd * 0.16, 0.62, 0.29]], 0.02, glw, { emis: true });
            tube([[-0.12, 0.5, 0.28], [0, 0.46, 0.31], [0.12, 0.5, 0.28]], [0.02, 0.025, 0.02], glw, { emis: true, cap0: 'round', cap1: 'round' });
            tube([[0, 0.5, -0.36], [0.1, 0.36, -0.6], [-0.06, 0.3, -0.84]], [0.14, 0.08, 0.01], sm2, { cap0: 'none', cap1: 'none' });
            for (let i = 0; i < 5; i++) { const a = i * 1.3; ball(Math.cos(a) * 0.46, 0.4 + i * 0.12, Math.sin(a) * 0.3, 0.025, glw, { emis: true, n: 1 }); }
            hover = 0.25; legLen = 0.06;
          } else if (BP === 'manowar') { // TIDE 2: the jelly has raised a sail: a man-o'-war, float, crest and long stinging threads
            blob(-0.32, 0.72, -0.38, 0.32, 1.12, 0.38, 1, hexMix(bd, '#ffffff', 0.35), { under: bd });
            plate([[0, 1.06, 0.3], [0, 1.36, 0.18], [0, 1.28, 0.0], [0, 1.44, -0.16], [0, 1.3, -0.3], [0, 1.06, -0.32]], 0.03, ac, { edge: glw });
            for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, r = 0.12 + (i % 3) * 0.07; const x = Math.cos(a) * r, z = Math.sin(a) * r; tube([[x, 0.76, z], [x * 1.3, 0.5, z * 1.3], [x * 1.1, 0.26, z * 1.2 + 0.04], [x * 1.4, 0.04, z * 1.3]], [0.03, 0.025, 0.02, 0.008], i % 2 ? ac : bd, { cap0: 'none', cap1: 'round' }); ball(x * 1.3, 0.5, z * 1.3, 0.025, glw, { emis: true, n: 1 }); }
            face(0.92, 0.36, 0.07, 0.13); legLen = 0.04;
          } else if (BP === 'kraken') { // TIDE 3: the man-o'-war's grandchild: a kraken walking on eight curling arms
            blob(-0.4, 0.66, -0.66, 0.4, 1.46, 0.2, 1, bd, { under: bl }); blob(-0.46, 0.36, -0.12, 0.46, 0.9, 0.46, 1, bd, { under: bl });
            for (const [x, y, z] of [[0.2, 1.2, -0.3], [-0.24, 1.1, -0.4], [0.06, 1.36, -0.46], [-0.1, 1.0, -0.1]]) ball(x, y, z, 0.06, ac, { n: 2 });
            for (const sd of [-1, 1]) { ball(sd * 0.2, 0.72, 0.36, 0.13, '#f4ecdc', { n: 3 }); ball(sd * 0.2, 0.72, 0.46, 0.07, C.eye, { n: 2 }); blob(sd * 0.2 - 0.05, 0.71, 0.5, sd * 0.2 + 0.05, 0.74, 0.53, 0.8, '#0a0810', { n: 1 }); blob(sd * 0.2 - 0.15, 0.82, 0.3, sd * 0.2 + 0.15, 0.88, 0.48, 0.6, dk, { n: 2 }); }
            for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2; const c0 = Math.cos(a), s0 = Math.sin(a); const c1 = Math.cos(a + 0.5), s1 = Math.sin(a + 0.5);
              tube([[c0 * 0.34, 0.42, s0 * 0.34 + 0.1], [c0 * 0.66, 0.14, s0 * 0.66 + 0.1], [c0 * 0.98, 0.07, s0 * 0.98 + 0.1], [c1 * 1.1, 0.26, s1 * 1.1 + 0.1], [c1 * 0.96, 0.36, s1 * 0.96 + 0.1]], [0.13, 0.1, 0.07, 0.04, 0.012], bd, { cap0: 'none', cap1: 'round' });
              for (let k = 1; k < 4; k++) ball(c0 * (0.4 + k * 0.18), 0.06, s0 * (0.4 + k * 0.18) + 0.1, 0.028, bl, { n: 1 }); }
            legLen = 0.1;
          } else if (BP === 'puffer') { // TIDE 2: the fish has left its bubble and puffed up: spines all over, pouting lips
            ball(0, 0.52, 0, 0.42, bl, { n: 3 }); blob(-0.42, 0.56, -0.42, 0.42, 0.94, 0.42, 1, bd);
            for (let i = 0; i < 36; i++) { const u = 1 - 2 * (i + 0.5) / 36, k = Math.sqrt(1 - u * u), a = i * 2.39996; const d = [Math.cos(a) * k, u, Math.sin(a) * k]; if (d[2] > 0.75) continue; cone([d[0] * 0.4, 0.52 + d[1] * 0.4, d[2] * 0.4], d, 0.14, 0.03, d[1] > 0.1 ? ac : bl); }
            for (const sd of [-1, 1]) plate([[sd * 0.38, 0.5, 0.06], [sd * 0.58, 0.62, -0.06], [sd * 0.54, 0.4, -0.1]], 0.025, ac, { edge: glw });
            plate([[0, 0.52, -0.4], [0, 0.76, -0.66], [0, 0.28, -0.66]], 0.03, ac, { edge: glw });
            for (const sd of [-1, 1]) ball(0, 0.46 + sd * 0.035, 0.42, 0.05, '#ff9a9a', { n: 2 });
            face(0.62, 0.34, 0.09, 0.17, { noMouth: true }); hover = 0.12; legLen = 0.06;
          } else if (BP === 'angler') { // TIDE 3: grown dark and deep: an anglerfish, a lamp on a rod, a jaw full of needles
            const dkb = hexMix(bd, dk, 0.55);
            blob(-0.42, 0.34, -0.5, 0.42, 1.0, 0.36, 1, dkb, { under: hexMix(dkb, bl, 0.3) });
            blob(-0.4, 0.14, 0.0, 0.4, 0.52, 0.62, 0.9, dkb, { under: hexMix(dkb, bl, 0.3) }); blob(-0.33, 0.4, 0.2, 0.33, 0.58, 0.6, 0.8, '#1a0a14');
            for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2.4; cone([Math.sin(a) * 0.32, 0.46, 0.4 + Math.cos(a) * 0.18], [0, 1, 0.2], 0.14 + (i % 2) * 0.06, 0.025, '#f4f0e6'); cone([Math.sin(a) * 0.3, 0.66, 0.36 + Math.cos(a) * 0.14], [0, -1, 0.2], 0.1, 0.02, '#f4f0e6'); }
            tube([[0, 0.96, 0.16], [0, 1.24, 0.38], [0, 1.2, 0.66]], [0.025, 0.02, 0.015], dkb, { cap0: 'none', cap1: 'none' }); ball(0, 1.12, 0.7, 0.09, glw, { emis: true, n: 3 });
            for (const sd of [-1, 1]) { ball(sd * 0.2, 0.86, 0.24, 0.05, '#16121e', { n: 2 }); ball(sd * 0.2, 0.86, 0.28, 0.025, glw, { emis: true, n: 1 }); plate([[sd * 0.4, 0.6, -0.1], [sd * 0.66, 0.72, -0.24], [sd * 0.6, 0.46, -0.28]], 0.025, ac, { edge: dkb }); }
            plate([[0, 0.66, -0.48], [0, 0.96, -0.82], [0, 0.4, -0.82]], 0.03, ac, { edge: dkb });
            hover = 0.12; legLen = 0.06;
          } else if (BP === 'sprout') { // BLOOM 2: the seed split its cap: a little sapling on root feet with leaves for arms
            const st = hexMix(bd, '#8a6a42', 0.3);
            blob(-0.24, 0.1, -0.22, 0.24, 0.84, 0.22, 1, bd, { under: bl, tap: [0.8, 1] });
            tube([[0, 0.8, 0], [0.02, 1.08, -0.02], [-0.02, 1.26, 0]], [0.04, 0.035, 0.025], st, { cap0: 'none', cap1: 'round' });
            for (const [p, d] of [[[0.02, 1.04, -0.02], [1, 0.4, 0.1]], [[0.0, 1.14, 0], [-1, 0.5, 0]], [[-0.02, 1.24, 0], [0.2, 1, 0.3]]]) plate([p, [p[0] + d[0] * 0.26, p[1] + d[1] * 0.26 + 0.06, p[2] + d[2] * 0.26], [p[0] + d[0] * 0.3, p[1] + d[1] * 0.3 - 0.04, p[2] + d[2] * 0.3 + 0.04]], 0.02, ac);
            for (const sd of [-1, 1]) plate([[sd * 0.2, 0.5, 0.04], [sd * 0.5, 0.62, 0.02], [sd * 0.46, 0.44, 0.08]], 0.02, ac, { edge: hexMix(ac, '#2e6b2a', 0.4) });
            face(0.6, 0.21, 0.065, 0.1);
            for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) tube([[sd * 0.12, 0.14, 0.02], [sd * (0.16 + i * 0.06), 0.02, (i - 1) * 0.12]], [0.04, 0.015], st, { cap0: 'none', cap1: 'round' });
            legLen = 0.1;
          } else if (BP === 'flytrap') { // BLOOM 2: the bulb opens into a snapping flytrap on a tall stem, teeth along both lips
            const st = '#4f8a3a', inside = '#e04a6a';
            blob(-0.36, 0.0, -0.32, 0.36, 0.3, 0.32, 0.8, '#6b4a2e');
            for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; plate([[0, 0.26, 0], [Math.cos(a) * 0.52, 0.12, Math.sin(a) * 0.5], [Math.cos(a + 0.4) * 0.3, 0.3, Math.sin(a + 0.4) * 0.3]], 0.025, st); }
            tube([[0, 0.24, 0], [0.06, 0.62, -0.04], [0, 0.9, 0.06]], [0.07, 0.06, 0.06], st, { cap0: 'none', cap1: 'none' });
            B(1, 'head', [0, 0.9, 0.06]);
            blob(-0.3, 1.02, -0.14, 0.3, 1.3, 0.48, 1, bd, { under: inside }); blob(-0.28, 0.8, -0.1, 0.28, 0.98, 0.44, 1, bd, { under: inside });
            blob(-0.24, 0.94, 0.0, 0.24, 1.04, 0.42, 1, inside);
            for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.6, x = Math.sin(a) * 0.27, z = 0.16 + Math.cos(a) * 0.3; cone([x, 1.03, z], [x, -0.6, z - 0.1], 0.1, 0.022, '#f4f0e6'); cone([x * 0.95, 0.97, z - 0.02], [x, 0.6, z - 0.1], 0.08, 0.02, '#f4f0e6'); }
            for (const sd of [-1, 1]) { ball(sd * 0.12, 1.3, 0.24, 0.07, '#16121e', { n: 2 }); ball(sd * 0.12, 1.31, 0.3, 0.035, C.eye, { emis: true, n: 1 }); }
            bone = 0; legLen = 0.06;
          } else if (BP === 'boulder') { // STONE 2: the pebble grew into a boulder with stubby arms and a mossy brow
            blob(-0.46, 0.08, -0.42, 0.46, 0.92, 0.42, 0.55, bd, { under: hexMix(bd, dk, 0.3) });
            for (const pth of [[[-0.3, 0.7, 0.36], [-0.18, 0.54, 0.41], [-0.24, 0.36, 0.4]], [[0.3, 0.3, 0.38], [0.36, 0.18, 0.32]]]) tube(pth, pth.map(() => 0.018), dk, { cap0: 'round', cap1: 'round' });
            blob(-0.36, 0.84, -0.3, 0.3, 0.98, 0.2, 0.9, '#5f8a3a'); blob(-0.3, 0.64, 0.26, 0.3, 0.74, 0.44, 0.5, hexMix(bd, dk, 0.2), { n: 2 });
            face(0.56, 0.38, 0.065, 0.14, { noMouth: true });
            tube([[-0.12, 0.38, 0.41], [0, 0.35, 0.43], [0.12, 0.38, 0.41]], [0.02, 0.02, 0.02], dk, { cap0: 'round', cap1: 'round' });
            for (const sd of [-1, 1]) { tube([[sd * 0.42, 0.5, 0.0], [sd * 0.58, 0.36, 0.08]], [0.1, 0.09], bd, { cap0: 'none', cap1: 'none' }); blob(sd * 0.58 - 0.12, 0.2, -0.04, sd * 0.58 + 0.12, 0.42, 0.2, 0.5, bd, { n: 2 }); }
            feet(0.1, 0.24, hexMix(bd, dk, 0.3)); legLen = 0.1;
          } else if (BP === 'stormcloud') { // GALE 2: the puff turned dark: a storm cloud with a scowl, rain falling and bolts hanging
            const g = '#6a7080', g2 = '#4a5060';
            [[0, 0.66, 0, 0.32], [-0.32, 0.58, -0.04, 0.24], [0.32, 0.58, -0.04, 0.24], [-0.14, 0.88, -0.08, 0.24], [0.18, 0.86, -0.1, 0.22], [0, 0.5, -0.2, 0.24]].forEach(([x, y, z, r], i) => ball(x, y, z, r, i % 2 ? g : g2, { n: 3 }));
            for (const sd of [-1, 1]) blob(sd * 0.14 - 0.1, 0.76, 0.26, sd * 0.14 + 0.1, 0.8, 0.32, 0.5, '#2a2e38', { n: 1 });
            face(0.66, 0.29, 0.07, 0.13);
            for (const x of [-0.24, 0.2]) plate([[x, 0.38, 0.06], [x + 0.08, 0.2, 0.08], [x + 0.02, 0.2, 0.08], [x + 0.1, 0.0, 0.1]], 0.025, '#ffe45a', { emis: true });
            for (let i = 0; i < 7; i++) { const x = (i - 3) * 0.1, z = ((i * 37) % 7) / 7 * 0.3 - 0.15; tube([[x, 0.34, z], [x, 0.18, z]], [0.012, 0.012], '#a8d8ff', { cap0: 'round', cap1: 'round' }); }
            hover = 0.3; legLen = 0.06;
          } else if (BP === 'hurricane') { // GALE 3: the storm wound itself up: a living hurricane, a funnel of wind with a calm eye at the top
            for (let i = 0; i < 8; i++) hring(Math.sin(i * 0.7) * 0.04, 0.1 + i * 0.17, 0, 0.1 + i * 0.075, 0.05 + i * 0.006, i % 2 ? '#e8eef6' : '#a8b4c4');
            for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16, a = u * 9 + k * 2.1, r = 0.1 + u * 0.56; pts.push([Math.cos(a) * r, 0.1 + u * 1.3, Math.sin(a) * r]); } tube(pts, pts.map(() => 0.018), '#ffffff', { cap0: 'round', cap1: 'round' }); }
            [[0, 1.5, 0, 0.3], [-0.38, 1.44, 0, 0.24], [0.38, 1.44, 0, 0.24], [0, 1.46, -0.34, 0.24], [0, 1.44, 0.3, 0.22]].forEach(([x, y, z, r], i) => ball(x, y, z, r, i % 2 ? '#d8e0ea' : '#b8c4d4', { n: 3 }));
            face(1.48, 0.48, 0.075, 0.14, { noMouth: true });
            for (let i = 0; i < 5; i++) { const a = i * 1.26, y = 0.4 + i * 0.2, r = 0.3 + i * 0.08; blob(Math.cos(a) * r - 0.04, y - 0.03, Math.sin(a) * r - 0.05, Math.cos(a) * r + 0.04, y + 0.03, Math.sin(a) * r + 0.05, 0.3, i % 2 ? '#8a6a42' : ac, { n: 1 }); }
            legLen = 0.06;
          } else if (BP === 'snowgolem') { // FROST 2: the snowball imp packed itself bigger: a snow golem with ice-block fists
            ball(0, 0.36, 0, 0.36, '#f4f8ff', { n: 3 }); ball(0, 0.88, 0.02, 0.3, '#f4f8ff', { n: 3 }); ball(0, 1.28, 0.04, 0.2, '#f4f8ff', { n: 3 });
            for (const sd of [-1, 1]) { tube([[sd * 0.26, 0.96, 0.02], [sd * 0.5, 0.8, 0.08], [sd * 0.56, 0.58, 0.12]], [0.06, 0.05, 0.05], '#6b4a2a', { cap0: 'none', cap1: 'none' }); blob(sd * 0.56 - 0.13, 0.36, 0.0, sd * 0.56 + 0.13, 0.62, 0.26, 0.3, glw); }
            for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * 2; cone([Math.sin(a) * 0.12, 1.42, 0.04 - Math.cos(a) * 0.04], [Math.sin(a) * 0.4, 1, -0.2], 0.22 + (i === 2) * 0.1, 0.045, glw, { emis: true }); }
            for (const sd of [-1, 1]) ball(sd * 0.08, 1.32, 0.22, 0.035, '#1a1a1e', { n: 2 });
            for (let i = 0; i < 5; i++) ball((i - 2) * 0.045, 1.2 - Math.abs(i - 2) * -0.012, 0.23, 0.018, '#1a1a1e', { n: 1 });
            for (let i = 0; i < 3; i++) ball(0, 0.96 - i * 0.12, 0.32, 0.03, '#1a1a1e', { n: 1 });
            legLen = 0.04;
          } else if (BP === 'balllightning') { // SPARK 2: the spark grew a skin of light: ball lightning, two rings orbiting
            ball(0, 0.6, 0, 0.3, bd, { n: 3 }); ball(0, 0.6, 0, 0.2, glw, { emis: true, n: 2 });
            hring(0, 0.6, 0, 0.44, 0.02, ac, { emis: true }); ring(0, 0.6, 0, 0.42, 0.42, 0.02, glw, { emis: true });
            for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.6; tube([[Math.cos(a) * 0.3, 0.6 + Math.sin(a) * 0.3, 0], [Math.cos(a + 0.2) * 0.42, 0.6 + Math.sin(a + 0.2) * 0.42, 0.06], [Math.cos(a) * 0.5, 0.6 + Math.sin(a) * 0.5, -0.04]], [0.02, 0.015, 0.008], glw, { emis: true, cap0: 'round', cap1: 'round' }); }
            face(0.64, 0.28, 0.065, 0.11); hover = 0.2; legLen = 0.06;
          } else if (BP === 'shade') { // VOID 2: the wisp grew a cloak: a hooded shade, only its eyes showing
            const cl = hexMix(bd, dk, 0.5);
            tube([[0, 0.12, 0], [0, 0.56, 0], [0, 0.92, 0.02]], [0.36, 0.26, 0.18], cl, { cap0: 'flat', cap1: 'none' });
            for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; cone([Math.cos(a) * 0.32, 0.16, Math.sin(a) * 0.32], [Math.cos(a) * 0.3, -1, Math.sin(a) * 0.3], 0.16, 0.08, cl); }
            blob(-0.24, 0.8, -0.2, 0.24, 1.24, 0.24, 1, cl); blob(-0.16, 0.86, 0.06, 0.16, 1.14, 0.26, 1, '#0a0810');
            for (const sd of [-1, 1]) ball(sd * 0.07, 1.0, 0.24, 0.035, glw, { emis: true, n: 2 });
            for (const sd of [-1, 1]) { tube([[sd * 0.22, 0.74, 0.04], [sd * 0.36, 0.6, 0.14]], [0.07, 0.05], cl, { cap0: 'none', cap1: 'none' }); ball(sd * 0.38, 0.58, 0.16, 0.045, '#d8d0e8', { n: 2 }); }
            hover = 0.2; legLen = 0.06;
          } else if (BP === 'wraith') { // VOID 3: the shade grown tall and tattered: a reaper wraith with a bone mask and two scythe arms
            const cl = hexMix(bd, dk, 0.55);
            tube([[0, 0.2, 0], [0, 0.8, 0], [0, 1.3, 0.02]], [0.4, 0.3, 0.2], cl, { cap0: 'flat', cap1: 'none' });
            for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2; cone([Math.cos(a) * 0.36, 0.24, Math.sin(a) * 0.36], [Math.cos(a) * 0.4, -1, Math.sin(a) * 0.4 - 0.3], 0.28 + (i % 3) * 0.1, 0.08, cl); }
            blob(-0.26, 1.2, -0.22, 0.26, 1.66, 0.24, 1, cl); blob(-0.14, 1.28, 0.12, 0.14, 1.56, 0.28, 0.9, '#e8e2d4');
            for (const sd of [-1, 1]) { ball(sd * 0.06, 1.44, 0.27, 0.035, '#0a0810', { n: 2 }); ball(sd * 0.06, 1.44, 0.29, 0.02, ac, { emis: true, n: 1 }); }
            for (const sd of [-1, 1]) { tube([[sd * 0.26, 1.1, 0.02], [sd * 0.5, 0.96, 0.2], [sd * 0.56, 1.16, 0.4]], [0.07, 0.05, 0.035], cl, { cap0: 'none', cap1: 'round' }); plate([[sd * 0.56, 1.16, 0.4], [sd * 0.6, 1.36, 0.3], [sd * 0.62, 1.22, 0.0], [sd * 0.58, 1.12, 0.32]], 0.02, ac, { emis: true }); }
            tube([[0, 0.3, -0.3], [0.1, 0.5, -0.6], [-0.06, 0.4, -0.9]], [0.14, 0.08, 0.01], cl, { cap0: 'none', cap1: 'none' });
            hover = 0.25; legLen = 0.06;
          } else if (BP === 'moth') { // LIGHT 2: the firefly opens into a lantern moth, wings with eyes that glow
            const fz = hexMix(bd, '#ffffff', 0.4);
            ball(0, 0.62, 0.06, 0.18, fz, { n: 3 }); blob(-0.14, 0.42, -0.5, 0.14, 0.7, -0.06, 1, bd);
            for (let i = 0; i < 3; i++) hring(0, 0.56, -0.16 - i * 0.12, 0.14 - i * 0.02, 0.018, ac);
            for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ball(Math.cos(a) * 0.14, 0.66 + Math.sin(a) * 0.12, 0.14, 0.07, '#ffffff', { n: 2 }); }
            for (const sd of [-1, 1]) { B(sd < 0 ? 7 : 8, 'wing', [sd * 0.12, 0.68, 0.0], { side: sd, fold: -0.6 });
              plate([[sd * 0.12, 0.72, 0.08], [sd * 0.62, 1.06, 0.12], [sd * 0.8, 0.86, -0.06], [sd * 0.6, 0.62, -0.06]], 0.02, bd, { edge: ac }); plate([[sd * 0.12, 0.62, -0.04], [sd * 0.56, 0.5, -0.2], [sd * 0.48, 0.3, -0.34], [sd * 0.14, 0.52, -0.18]], 0.02, bd, { edge: ac });
              ball(sd * 0.56, 0.86, 0.06, 0.07, '#16121e', { n: 2 }); ball(sd * 0.56, 0.86, 0.075, 0.045, glw, { emis: true, n: 2 }); ball(sd * 0.4, 0.48, -0.17, 0.04, glw, { emis: true, n: 1 }); }
            bone = 0;
            for (const sd of [-1, 1]) { tube([[sd * 0.05, 0.76, 0.2], [sd * 0.16, 0.98, 0.3], [sd * 0.24, 1.06, 0.26]], [0.012, 0.01, 0.008], dk, { cap0: 'round', cap1: 'round' }); for (let i = 0; i < 4; i++) cone([sd * (0.08 + i * 0.04), 0.84 + i * 0.06, 0.24 + i * 0.015], [sd * 0.3, 0.2, 1], 0.06, 0.012, fz); }
            face(0.62, 0.22, 0.05, 0.08, { noMouth: true }); hover = 0.3; legLen = 0.05;
          } else if (BP === 'corona') { // LIGHT 2: the sunbeam grows a corona: a ring of fire around it and little arms
            ball(0, 0.62, 0, 0.32, bd, { n: 3 }); ring(0, 0.62, -0.08, 0.46, 0.46, 0.04, '#ffd25a', { emis: true });
            for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; cone([Math.cos(a) * 0.46, 0.62 + Math.sin(a) * 0.46, -0.08], [Math.cos(a), Math.sin(a), 0], i % 2 ? 0.18 : 0.28, 0.06, i % 2 ? ac : glw, { emis: true }); }
            for (const sd of [-1, 1]) { tube([[sd * 0.28, 0.5, 0.1], [sd * 0.42, 0.4, 0.2]], [0.05, 0.04], bd, { cap0: 'none', cap1: 'round' }); ball(sd * 0.2, 0.52, 0.26, 0.04, '#ffb0a0', { n: 1 }); }
            face(0.66, 0.29, 0.065, 0.11); hover = 0.2; legLen = 0.06;
          } else { blob(-0.4, 0.06, -0.36, 0.4, 0.76, 0.36, 1, C.body, { under: bel }); face(0.48, 0.32, 0.08, 0.15); feet(0.1); legLen = 0.12; }
          break;
        }
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
        if (form.plan && BRD.has(form.plan)) {
          // Birds with bodies of their own, each a real bird (or a legend grown from one). Bones: head 1, legs 4/5, tail 6, wings 7/8.
          const P = form.plan, dk = C.dark, bl = C.belly, bd = C.body, ac = C.accent, glw = hexMix(C.accent, '#ffffff', 0.3), orange = '#e8a03a';
          flyer = true; hover = 0.1;
          const look = (ex, ey, ez, er, o = {}) => LOOK(ex, ey, ez, er, o, false); const lookOld = (ex, ey, ez, er, o = {}) => { if (er < 0.06) { er *= 1.4; ex = Math.max(ex, er * 1.15); } for (const sd of [-1, 1]) { ball(sd * ex, ey, ez, er, '#16121e', { n: 3 }); ball(sd * (ex + er * 0.04), ey - er * 0.12, ez + er * 0.5, er * 0.62, o.col || C.eye, { emis: !!o.glow, n: 3 });
            ball(sd * (ex + er * 0.05), ey - er * 0.1, ez + er * 0.78, er * 0.3, '#0a0810', { n: 2 }); ball(sd * (ex - er * 0.22), ey + er * 0.34, ez + er * 0.82, er * 0.3, '#ffffff', { emis: true, n: 2 });
            if (o.brow) blob(sd * ex - er * 1.1, ey + er * 0.88, ez - er * 0.3, sd * ex + er * 1.1, ey + er * 1.18, ez + er * 0.9, 0.5, o.brow, { n: 2 }); } };
          const H = (y, z) => B(1, 'head', [0, y, z || 0]);
          const beak = (type, y, z, r, len, c) => { c = c || orange;
            if (type === 'hook') { cone([0, y, z], [0, -0.05, 1], len * 0.7, r, c); curl([0, y + r * 0.2, z + len * 0.5], [0, -0.2, 1], len * 0.5, r * 0.55, c, [0, -1.4, 0]); }
            else if (type === 'duck') blob(-r, y - r * 0.45, z - 0.02, r, y + r * 0.3, z + len, 0.85, c, { tap: [1, 0.9] });
            else if (type === 'big') { blob(-r, y - r, z - 0.04, r, y + r * 0.6, z + len, 0.7, c, { tap: [1, 0.85] }); curl([0, y, z + len - 0.02], [0, -0.2, 1], r * 1.1, r * 0.4, c, [0, -1.4, 0]); }
            else cone([0, y, z], [0, type === 'spear' ? -0.08 : -0.18, 1], len, r, c); };
          const BLEG = { flamekestrel: 'raptor', phoenix: 'raptor', magmavulture: 'raptor', hawk: 'raptor', stormeagle: 'raptor', snowyowl: 'raptor', auroraowl: 'raptor', raven: 'raptor', ravenking: 'raptor', potoo: 'raptor', heron: 'wader', crane: 'wader', ibis: 'wader', shoebill: 'wader', lotusswan: 'wader', emuchick: 'runner', rockemu: 'runner', terrorbird: 'runner', cassowary: 'runner', peafowl: 'runner', bloompeacock: 'runner', pheasant: 'runner', lyrebird: 'runner' };
          const legsB = (hip, xw, c, th, o = {}) => { /* a raptor's feathered trousers and hooked talons, a wader's stilts with a knob of a knee, a runner's thick shanks and three stout toes, a percher's fine feet */
            const bk = o.kind || BLEG[P] || (o.web ? 'web' : 'perch'); th *= bk === 'runner' ? 1.5 : bk === 'raptor' ? 1.3 : bk === 'wader' ? 0.95 : 1.15; const tl = (o.toe || th * 5) * (bk === 'runner' ? 0.8 : 1); if (bk === 'raptor' && !o.thigh) o = Object.assign({ thigh: true }, o);
            for (const sd of [-1, 1]) { B(sd < 0 ? 4 : 5, 'leg', [sd * xw, hip, 0], { phase: sd < 0 ? 0 : Math.PI, len: hip, amp: 0.35 });
              if (o.thigh) blob(sd * xw - th * 2.4, hip * 0.6, -th * 2.4, sd * xw + th * 2.4, hip + th * 2, th * 2.4, 1, o.thighC || bd, { under: bl });
              tube([[sd * xw, hip, 0], [sd * xw, hip * 0.5, -th * 1.5], [sd * xw, 0.05, 0]], [th, th * 0.85, th * 0.8], c, { cap0: 'none', cap1: 'none', segs: 5 });
              if (bk === 'wader' || bk === 'runner') ball(sd * xw, hip * 0.5, -th * 1.5, th * 1.35, c);
              if (bk === 'raptor' || bk === 'runner') for (const a of [-0.55, 0, 0.55]) cone([sd * xw + a * tl * 0.6, 0.03, tl * (1 - Math.abs(a) * 0.3)], [a * 0.3, -0.6, 1], th * 1.5, th * 0.42, '#2a2420'); /* hooked claws */
              for (const a of [-0.55, 0, 0.55]) tube([[sd * xw, 0.05, 0], [sd * xw + a * tl * 0.6, 0.02, tl * (1 - Math.abs(a) * 0.3)]], [th * 0.6, th * 0.35], c, { cap0: 'round', cap1: 'round' });
              tube([[sd * xw, 0.05, 0], [sd * xw, 0.02, -tl * 0.5]], [th * 0.5, th * 0.3], c, { cap0: 'round', cap1: 'round' });
              if (o.web) plate([[sd * xw, 0.025, 0.02], [sd * xw - tl * 0.33, 0.025, tl * 0.84], [sd * xw + tl * 0.33, 0.025, tl * 0.84]], 0.012, c); }
            bone = 0; legLen = hip; };
          const WINGK = { flamekestrel: 'pointed', swallow: 'pointed', swift: 'pointed', hummingbird: 'pointed', kingfisher: 'pointed', kingfisherchick: 'pointed', frigatebird: 'pointed', nightjar: 'pointed', phoenix: 'fingered', magmavulture: 'fingered', hawk: 'fingered', stormeagle: 'fingered', raven: 'fingered', ravenking: 'fingered', hornbill: 'fingered', shoebill: 'fingered', crane: 'fingered', heron: 'fingered', seagull: 'long', albatross: 'long', snowgoose: 'long', lotusswan: 'long', ibis: 'long', puffling: 'paddle', puffin: 'paddle', emuchick: 'paddle', rockemu: 'paddle', terrorbird: 'paddle', cassowary: 'paddle' };
          /* wing shapes: round (songbirds, owls: broad soft tips), pointed (falcons, swifts: a blade), fingered (eagles, vultures: broad with the tips spread like a hand), long (gulls: narrow and far-reaching), paddle (stubby) */
          const WPROF = { round: { tw: 0.9, l0: 0.55, l1: 0.45, wm: 1.6 }, pointed: { tw: 0.1, l0: 0.2, l1: 0.95, wm: 0.95 }, fingered: { tw: 0.6, l0: 0.45, l1: 0.6, wm: 1.3, sp: 0.16 }, long: { tw: 0.35, l0: 0.45, l1: 0.8, wm: 1.0 }, paddle: { tw: 1.0, l0: 0.55, l1: 0.15, wm: 2.0 } };
          const WP = WPROF[WINGK[P] || 'round'];
          const wing = (sd, sh, L, o = {}) => { // a wing held the way a perched bird holds it: shoulder out a little, feathers swept back along the body, tips crossing over the tail; flight flaps it
            B(sd < 0 ? 7 : 8, 'wing', sh, { side: sd, fold: o.fold != null ? Math.max(-0.35, o.fold * 0.2) : -0.2 });
            const k = o.k || 1, c = o.c || bd, back = Math.min(1.1, 0.34 + L * 0.42) * (o.long || 1), out = Math.min(0.22, 0.06 + L * 0.08);
            const el = [sh[0] + sd * out, sh[1] + 0.03, sh[2] - back * 0.12], wr = [sh[0] + sd * out * 1.25, sh[1] - 0.02, sh[2] - back * 0.34];
            tube([sh, el, wr], [0.07 * k, 0.06 * k, 0.045 * k], c, { cap0: 'round', cap1: 'round' });
            blob(Math.min(sh[0], wr[0]) - 0.03, sh[1] - 0.13 * k, wr[2] - 0.05, Math.max(sh[0], wr[0]) + 0.03, sh[1] + 0.07 * k, sh[2] + 0.06, 1, c); /* the shoulder of the wing has flesh on it */
            plate([[sh[0], sh[1] + 0.05, sh[2] + 0.04], el, wr, [wr[0] - sd * 0.02, wr[1] - 0.12, wr[2] + 0.02], [sh[0] + sd * 0.02, sh[1] - 0.14, sh[2] - 0.02]], 0.025, c);
            const n = o.n || 7; for (let i = 0; i < n; i++) { const u = i / (n - 1); const b0 = [sh[0] + sd * (out * (0.4 + 0.85 * u)), sh[1] + 0.02 - 0.1 * (1 - u), sh[2] - back * (0.1 + 0.24 * u)];
              const len = back * (WP.l0 + WP.l1 * u), d0 = [sd * (0.04 - 0.12 * u), -0.12 - 0.1 * (1 - u) + (WP.sp || 0) * u * (i % 2 ? 1 : -0.6), -1], dl = Math.hypot(...d0), d = d0.map(v => v / dl), tip = [b0[0] + d[0] * len, b0[1] + d[1] * len, b0[2] + d[2] * len], w = 0.06 * k * WP.wm;
              plate([[b0[0], b0[1] + w, b0[2]], [tip[0], tip[1] + w * WP.tw * 0.6, tip[2]], [tip[0], tip[1] - w * WP.tw * 0.6, tip[2] + 0.01], [b0[0], b0[1] - w, b0[2]]], 0.024, o.feather ? o.feather(i, n) : i % 2 ? (o.f || c) : (o.f2 || o.f || c), o.tip ? { edge: o.tip, emis: !!o.emis } : { emis: !!o.emis }); }
            bone = 0; };
          const display = (sd, sh, L, o = {}) => { // a wing held open: up = 1 raised in a V over the back, up = 0 spread flat to glide
            B(sd < 0 ? 7 : 8, 'wing', sh, { side: sd, fold: 0 }); const up = o.up == null ? 1 : o.up, k = o.k || 1, c = o.c || bd;
            const el = [sh[0] + sd * L * (0.32 + 0.14 * (1 - up)), sh[1] + L * (0.06 + 0.3 * up), sh[2] - 0.06], wr = [sh[0] + sd * L * (0.6 + 0.36 * (1 - up)), sh[1] + L * (0.06 + 0.56 * up), sh[2] - 0.14];
            tube([sh, el, wr], [0.06 * k, 0.05 * k, 0.035 * k], c, { cap0: 'round', cap1: 'round' });
            const n = o.n || 9; for (let i = 0; i < n; i++) { const u = i / (n - 1); const b0 = u < 0.5 ? [sh[0] + (el[0] - sh[0]) * u * 2, sh[1] + (el[1] - sh[1]) * u * 2, sh[2] + (el[2] - sh[2]) * u * 2] : [el[0] + (wr[0] - el[0]) * (u - 0.5) * 2, el[1] + (wr[1] - el[1]) * (u - 0.5) * 2, el[2] + (wr[2] - el[2]) * (u - 0.5) * 2];
              const len = L * (0.3 + 0.36 * u), d0 = [sd * (0.1 + 0.9 * u * u) * (0.5 + 0.5 * (1 - up)), -0.9 * (1 - u) * up - 0.05 + 0.3 * u * up, -0.5 - 0.5 * (1 - u)], dl = Math.hypot(...d0), d = d0.map(v => v / dl), tip = [b0[0] + d[0] * len * (0.7 + 0.5 * WP.l1), b0[1] + d[1] * len * (0.7 + 0.5 * WP.l1) + (WP.sp || 0) * u * (i % 2 ? 0.5 : -0.3) * L, b0[2] + d[2] * len * (0.7 + 0.5 * WP.l1)], w = (0.05 + 0.6 * L / n) * k * (0.7 + 0.25 * WP.wm), tg = [(wr[0] - sh[0]), (wr[1] - sh[1]), (wr[2] - sh[2])], tl = Math.hypot(...tg), t3 = tg.map(v => v / tl);
              const tw = Math.max(0.12, WP.tw * 0.85); plate([[b0[0] - t3[0] * w, b0[1] - t3[1] * w, b0[2] - t3[2] * w], [tip[0] - t3[0] * w * tw, tip[1] - t3[1] * w * tw, tip[2]], [tip[0] + t3[0] * w * tw, tip[1] + t3[1] * w * tw, tip[2] + 0.01], [b0[0] + t3[0] * w, b0[1] + t3[1] * w, b0[2] + t3[2] * w]], 0.022, o.feather ? o.feather(i, n) : i % 2 ? (o.f || c) : (o.f2 || o.f || c), o.tip ? { edge: o.tip, emis: !!o.emis } : { emis: !!o.emis }); }
            plate([sh, el, wr, [wr[0] - sd * L * 0.12, wr[1] - L * 0.18 * up, wr[2] - 0.1], [sh[0] + sd * L * 0.1, sh[1] - L * 0.12, sh[2] - 0.12]], 0.025, c); bone = 0; };
          const display2 = (x, y, z, L, o) => { for (const sd of [-1, 1]) display(sd, [sd * x, y, z], L, o); };
          const wings2 = (x, y, z, L, o) => { for (const sd of [-1, 1]) wing(sd, [sd * x, y, z], L, o); };
          const fanTail = (b, n, len, spread, c, o = {}) => { B(6, 'tail', b); for (let i = 0; i < n; i++) { const a = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread; const d = [Math.sin(a), o.up || 0.15, -Math.cos(a)], tip = [b[0] + d[0] * len, b[1] + d[1] * len, b[2] + d[2] * len], w = o.w || 0.05;
            plate([[b[0] - w * Math.cos(a), b[1], b[2] - w * Math.sin(a)], [tip[0] - w * 0.7 * Math.cos(a), tip[1], tip[2]], [tip[0] + w * 0.7 * Math.cos(a), tip[1], tip[2]], [b[0] + w * Math.cos(a), b[1], b[2]]], 0.014, Array.isArray(c) ? c[i % c.length] : c, o.edge ? { edge: o.edge, emis: !!o.emis } : { emis: !!o.emis }); if (o.eye) { ball(tip[0], tip[1] + 0.01, tip[2], o.eyeR || 0.05, o.eye, { emis: !!o.emis, n: 2 }); } }
            bone = 0; };
          const egg = (cy, cz, rx, ry, rz, c, u, tap) => blob(-rx, cy - ry, cz - rz, rx, cy + ry, cz + rz, 1, c || bd, { under: u || bl, tap });
          const chick = (c, fluff, beakC, o = {}) => { // a round fluffy chick: the first stage of most bird lines
            legsB(0.14, 0.08, beakC || orange, 0.025); egg(0.42, 0, 0.3, 0.3, 0.3, c, o.u || bl);
            for (let i = 0; i < 10; i++) { const a = i * 2.4, u = ((i * 0.618) % 1) * 1.4 - 0.4, k = Math.sqrt(Math.max(0, 1 - u * u)); cone([Math.cos(a) * k * 0.28, 0.42 + u * 0.28, Math.sin(a) * k * 0.28], [Math.cos(a) * k, u, Math.sin(a) * k], 0.08, 0.03, fluff || c); }
            H(0.62); ball(0, 0.76, 0.06, 0.22, c, { n: 3 }); look(0.1, 0.8, 0.22, 0.06, { col: o.eye, glow: o.glow }); beak(o.beak || 'cone', 0.72, 0.26, 0.05, o.beakL || 0.1, beakC);
            if (o.head) o.head(); bone = 0; wings2(0.26, 0.5, 0.02, 0.32, { c, n: 3, fold: -0.9 });
            fanTail([0, 0.36, -0.28], 3, 0.12, 0.8, c); if (o.after) o.after(); };

          // ======== FLAME ========
          if (P === 'emberchick') chick(bd, glw, orange, { head: () => { for (let i = 0; i < 3; i++) cone([(i - 1) * 0.05, 0.96, 0.04], [(i - 1) * 0.4, 1, -0.2], 0.14, 0.035, i === 1 ? glw : ac, { emis: true }); } });
          else if (P === 'flamekestrel' || P === 'phoenix') { // a falcon of fire, then the phoenix: a crown of flame and a train of burning plumes
            const big = P === 'phoenix', k = big ? 1.25 : 1;
            legsB(0.3, 0.09, '#e8c23a', 0.03 * k); egg(0.6, 0.0, 0.2 * k, 0.24 * k, 0.34 * k, bd, bl, [0.8, 1]);
            H(0.86); ball(0, 0.92, 0.26, 0.15 * k, bd, { n: 3 }); for (const sd of [-1, 1]) tube([[sd * 0.08, 0.9, 0.36], [sd * 0.1, 0.8, 0.34]], [0.02, 0.012], dk, { cap0: 'round', cap1: 'round' });
            look(0.08, 0.95, 0.34, 0.04, { brow: dk, glow: big, col: big ? glw : null }); beak('hook', 0.9, 0.38, 0.035, 0.1, '#3a3230');
            if (big) for (let i = 0; i < 5; i++) cone([(i - 2) * 0.04, 1.04, 0.22 - Math.abs(i - 2) * 0.04], [(i - 2) * 0.3, 1, -0.6], 0.3 - Math.abs(i - 2) * 0.05, 0.04, i % 2 ? ac : glw, { emis: true }); bone = 0;
            if (big) display2(0.18 * k, 0.76, 0.04, 1.0, { c: '#ff7a2a', f: '#ff9a3a', f2: '#ffd25a', emis: true, n: 11, up: 1 }); else wings2(0.18 * k, 0.72, 0.06, 0.8, { c: bd, f: ac, n: 7 });
            if (big) { B(6, 'tail', [0, 0.56, -0.34]); for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.2; const p0 = [0, 0.56, -0.34], p1 = [Math.sin(a) * 0.3, 0.4, -0.9], p2 = [Math.sin(a) * 0.5, 0.5 + (i % 2) * 0.1, -1.5]; tube([p0, p1, p2], [0.03, 0.025, 0.015], i % 2 ? ac : glw, { emis: true, cap0: 'none', cap1: 'round' }); ball(p2[0], p2[1], p2[2], 0.06, glw, { emis: true, n: 2 }); } bone = 0; }
            else fanTail([0, 0.56, -0.32], 5, 0.4, 0.5, [bd, ac], { edge: dk });
          } else if (P === 'emberrobin' || P === 'firerobin') { // a robin whose breast is an ember; grown, the breast burns and its head is crested
            const big = P === 'firerobin', k = big ? 1.2 : 0.9, brown = hexMix(bd, '#6a4a3a', 0.6);
            legsB(0.2, 0.07, '#3a3230', 0.022 * k); egg(0.48, 0, 0.22 * k, 0.24 * k, 0.26 * k, brown, brown); blob(-0.18 * k, 0.32, 0.0, 0.18 * k, 0.66, 0.26 * k, 1, big ? glw : ac, { emis: big });
            H(0.7); ball(0, 0.78, 0.14, 0.16 * k, brown, { n: 3 }); look(0.08, 0.82, 0.26, 0.045); beak('cone', 0.76, 0.28, 0.025, 0.08, '#3a3230');
            if (big) for (let i = 0; i < 3; i++) cone([0, 0.92, 0.1 - i * 0.06], [0, 1, -0.6], 0.18, 0.035, i % 2 ? ac : glw, { emis: true }); bone = 0;
            wings2(0.2 * k, 0.6, 0.02, 0.5 * k, { c: brown, n: 5 }); fanTail([0, 0.5, -0.24], 4, 0.3, 0.5, brown, { up: 0.5 });
          } else if (P === 'magmavulture') { // a vulture with a bare red head, a ruff of ash, wings crusted like cooling lava
            const ash = '#4a4448', lava = '#ffa23a';
            legsB(0.34, 0.12, '#8a8288', 0.04); egg(0.74, -0.04, 0.3, 0.32, 0.38, ash, '#3a3438');
            for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; cone([Math.cos(a) * 0.16, 1.0, 0.12 + Math.sin(a) * 0.1], [Math.cos(a), -0.2, Math.sin(a) * 0.6], 0.16, 0.05, '#e8e2dc'); }
            tube([[0, 1.0, 0.14], [0, 1.16, 0.26], [0, 1.2, 0.36]], [0.06, 0.05, 0.045], '#c84a4a', { cap0: 'none', cap1: 'none' });
            H(1.18, 0.3); ball(0, 1.24, 0.38, 0.1, '#c84a4a', { n: 3 }); look(0.06, 1.28, 0.42, 0.03, { brow: '#8a2a2a' }); beak('hook', 1.22, 0.46, 0.035, 0.16, '#e8e2dc'); bone = 0;
            wings2(0.26, 0.92, 0.04, 1.3, { c: ash, f: ash, f2: '#3a3438', tip: lava, n: 9 });
            for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) tube([[sd * 0.28, 0.9 - i * 0.12, 0.0], [sd * 0.3, 0.84 - i * 0.12, -0.14]], [0.02, 0.015], lava, { emis: true, cap0: 'round', cap1: 'round' });
            fanTail([0, 0.62, -0.4], 6, 0.36, 0.7, ash, { edge: lava });

          // ======== TIDE ========
          } else if (P === 'gullchick') chick('#c8ccd4', '#e0e4ea', '#f2c23a', { beakL: 0.12 });
          else if (P === 'seagull' || P === 'albatross') { // a gull, then an albatross: the same white body, wings that go on and on
            const big = P === 'albatross', grey = hexMix(bd, '#8a94a4', 0.5), white = '#f6f8fa';
            legsB(0.26, 0.1, '#e8c070', 0.03, { web: true }); egg(0.56, 0, 0.22, 0.24, 0.42, white, '#e8ecf0');
            H(0.78, 0.3); ball(0, 0.84, 0.38, 0.15, white, { n: 3 }); look(0.08, 0.88, 0.48, 0.04, { brow: big ? '#6a7484' : null }); beak('hook', 0.84, 0.52, 0.035, big ? 0.24 : 0.16, '#f2c23a');
            if (!big) ball(0, 0.78, 0.6, 0.02, '#d83a3a', { n: 1 }); bone = 0;
            if (big) display2(0.2, 0.72, 0.04, 1.5, { c: grey, f: grey, f2: hexMix(grey, '#3a8ad8', 0.5), tip: '#eaf8ff', n: 13, up: 0.1 }); else wings2(0.2, 0.7, 0.04, 0.9, { c: grey, f: grey, f2: '#2a2e38', n: 7 });
            fanTail([0, 0.56, -0.4], 5, 0.26, 0.5, white);
          } else if (P === 'puffling' || P === 'puffin') { // a puffling all dark fluff; grown, the puffin with its striped orange beak, standing upright
            const big = P === 'puffin', black = '#20242e', white = '#f6f8fa';
            if (!big) chick(black, '#3a3e48', '#3a3e48', { u: '#5a5e68' });
            else { legsB(0.12, 0.1, orange, 0.035, { web: true }); egg(0.56, 0, 0.26, 0.4, 0.24, black, white, [1, 0.85]); blob(-0.2, 0.2, 0.06, 0.2, 0.74, 0.25, 1, white);
              H(0.9); ball(0, 1.02, 0.04, 0.2, black, { n: 3 }); for (const sd of [-1, 1]) blob(sd * 0.12 - 0.07, 0.92, 0.06, sd * 0.12 + 0.07, 1.08, 0.2, 1, white, { n: 2 });
              look(0.1, 1.04, 0.16, 0.035); blob(-0.06, 0.9, 0.18, 0.06, 1.08, 0.36, 0.7, '#e8603a', { tap: [1, 0.6] }); for (let i = 0; i < 2; i++) blob(-0.065, 0.92 + i * 0.04, 0.26 + i * 0.04, 0.065, 0.96 + i * 0.04, 0.28 + i * 0.04, 0.6, i ? '#f2c23a' : '#4a6ab8', { n: 1 }); bone = 0;
              wings2(0.24, 0.8, 0.0, 0.5, { c: black, n: 5, fold: -1.45 }); fanTail([0, 0.3, -0.22], 3, 0.12, 0.6, black); }
          } else if (P === 'heron') { // a grey heron: stilts for legs, an S of a neck, a dagger of a beak, a black plume behind the eye
            const grey = hexMix(bd, '#8a94a4', 0.6), white = '#f2f4f6';
            legsB(0.8, 0.08, '#c8a060', 0.025, { toe: 0.16 }); egg(1.0, 0, 0.18, 0.2, 0.36, grey, white);
            tube([[0, 1.1, 0.24], [0, 1.36, 0.22], [0, 1.5, 0.36], [0, 1.6, 0.34]], [0.06, 0.05, 0.045, 0.045], white, { cap0: 'none', cap1: 'round' });
            H(1.6, 0.34); ball(0, 1.64, 0.36, 0.08, white, { n: 3 }); look(0.05, 1.67, 0.4, 0.025); beak('spear', 1.63, 0.42, 0.03, 0.36, '#e8c23a');
            tube([[0, 1.68, 0.32], [0, 1.68, 0.12], [0, 1.6, -0.06]], [0.015, 0.012, 0.006], '#20242e', { cap0: 'round', cap1: 'round' }); bone = 0;
            wings2(0.17, 1.1, 0.04, 1.0, { c: grey, f: grey, f2: '#3a3e48', n: 8 }); fanTail([0, 0.96, -0.34], 4, 0.18, 0.5, grey); hover = 0;

          // ======== BLOOM ========
          } else if (P === 'peachick') chick(hexMix(bd, '#c8b48a', 0.5), null, '#8a6a42', { head: () => { for (let i = 0; i < 3; i++) { tube([[0, 0.96, 0.04], [(i - 1) * 0.06, 1.08, 0.0]], [0.008, 0.008], dk, { cap0: 'none', cap1: 'none' }); ball((i - 1) * 0.06, 1.1, 0.0, 0.025, ac, { n: 1 }); } } });
          else if (P === 'peafowl' || P === 'bloompeacock') { // a garden that walks like a peafowl: leaf-scale feathers, a crest of buds, a train of leaves; grown, the train opens into a giant flower
            const big = P === 'bloompeacock', green = hexMix('#2f8a52', bd, 0.25), lime = '#8ad05a', pink = '#f47ab8', pale = '#ffd8ec', gold = '#ffd25a', vine = '#3f6b2a';
            legsB(0.36, 0.08, vine, 0.03); egg(0.64, 0, 0.21, 0.25, 0.32, green, lime);
            for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { const a = (i / 5 - 0.5) * 1.8; plate([[Math.sin(a) * 0.17, 0.74 - r * 0.1, 0.22 - r * 0.02], [Math.sin(a) * 0.2 - 0.04, 0.66 - r * 0.1, 0.27 - r * 0.02], [Math.sin(a) * 0.2 + 0.04, 0.66 - r * 0.1, 0.27 - r * 0.02]], 0.015, r % 2 ? lime : hexMix(lime, green, 0.4)); } // leaf scales down the breast
            tube([[0, 0.76, 0.2], [0, 0.98, 0.28], [0, 1.08, 0.3]], [0.08, 0.06, 0.055], green, { cap0: 'none', cap1: 'round' });
            tube([[0.07, 0.8, 0.24], [-0.07, 0.9, 0.3], [0.06, 1.0, 0.32], [-0.04, 1.06, 0.34]], [0.014, 0.014, 0.014, 0.012], vine, { cap0: 'round', cap1: 'round' }); // a vine wound round the neck
            H(1.06, 0.3); ball(0, 1.1, 0.32, 0.1, green, { n: 3 }); for (const sd of [-1, 1]) blob(sd * 0.065 - 0.035, 1.08, 0.3, sd * 0.065 + 0.035, 1.16, 0.4, 0.6, big ? pale : lime, { n: 1 });
            look(0.06, 1.12, 0.38, 0.03, { col: gold, brow: big ? vine : null }); beak('cone', 1.09, 0.41, 0.025, 0.08, gold);
            for (let i = 0; i < (big ? 5 : 3); i++) { const a = (i / ((big ? 5 : 3) - 1) - 0.5) * 1.2, tp = [Math.sin(a) * 0.14, 1.36 + Math.cos(a) * 0.06, 0.22]; tube([[0, 1.16, 0.3], tp], [0.018, 0.014], vine, { cap0: 'none', cap1: 'round' });
              if (big) { for (let p = 0; p < 5; p++) { const q = p / 5 * Math.PI * 2; ball(tp[0] + Math.cos(q) * 0.035, tp[1] + Math.sin(q) * 0.035, tp[2], 0.026, pink, { n: 1 }); } ball(tp[0], tp[1], tp[2] + 0.01, 0.02, gold, { emis: true, n: 1 }); }
              else blob(tp[0] - 0.03, tp[1] - 0.02, tp[2] - 0.03, tp[0] + 0.03, tp[1] + 0.07, tp[2] + 0.03, 1, pink, { tap: [1, 0.3] }); } bone = 0;
            const leafWing = (sd) => { B(sd < 0 ? 7 : 8, 'wing', [sd * 0.18, 0.72, 0.06], { side: sd, fold: -0.2 }); for (let i = 0; i < 4; i++) { const b0 = [sd * 0.2, 0.74 - i * 0.04, 0.06 - i * 0.06], tip = [sd * 0.26, 0.6 - i * 0.05, -0.36 - i * 0.06]; plate([b0, [sd * 0.3, (b0[1] + tip[1]) / 2 + 0.04, (b0[2] + tip[2]) / 2], tip, [sd * 0.18, (b0[1] + tip[1]) / 2 - 0.06, (b0[2] + tip[2]) / 2]], 0.015, i % 2 ? green : lime, { edge: vine }); } bone = 0; };
            leafWing(-1); leafWing(1);
            B(6, 'tail', [0, 0.66, -0.3]);
            if (!big) { for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 0.5, tp = [Math.sin(a) * 0.5, 0.5 + (i % 2) * 0.05, -1.0 - Math.cos(a) * 0.1]; plate([[Math.sin(a) * 0.06 - 0.04, 0.64, -0.3], [tp[0] - 0.06, tp[1], tp[2] + 0.2], tp, [tp[0] + 0.06, tp[1], tp[2] + 0.2], [Math.sin(a) * 0.06 + 0.04, 0.64, -0.3]], 0.015, i % 2 ? green : lime, { edge: vine }); blob(tp[0] - 0.05, tp[1] - 0.04, tp[2] - 0.1, tp[0] + 0.05, tp[1] + 0.06, tp[2] + 0.02, 1, pink, { n: 2 }); } } // a train of long leaves, each ending in a closed bud
            else { const c = [0, 1.08, -0.42]; // the train opens: a flower taller than the bird, two rings of petals round a glowing heart, leaves between
              for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2.9; const d = [Math.sin(a), Math.cos(a), 0]; plate([[c[0] + d[0] * 0.2, c[1] + d[1] * 0.2 - 0.3, c[2] - 0.06], [c[0] + d[0] * 0.95 - d[1] * 0.06, c[1] + d[1] * 0.95 - 0.3 + d[0] * 0.06, c[2] - 0.12], [c[0] + d[0] * 1.15, c[1] + d[1] * 1.15 - 0.3, c[2] - 0.14], [c[0] + d[0] * 0.95 + d[1] * 0.06, c[1] + d[1] * 0.95 - 0.3 - d[0] * 0.06, c[2] - 0.12]], 0.015, i % 2 ? green : lime, { edge: vine }); }
              for (let i = 0; i < 8; i++) { const a = (i / 7 - 0.5) * 2.6, d = [Math.sin(a), Math.cos(a)], w = 0.22; plate([[c[0] + d[0] * 0.16, c[1] + d[1] * 0.16 - 0.3, c[2]], [c[0] + d[0] * 0.6 - d[1] * w, c[1] + d[1] * 0.6 - 0.3 + d[0] * w, c[2] - 0.04], [c[0] + d[0] * 0.9, c[1] + d[1] * 0.9 - 0.3, c[2] - 0.06], [c[0] + d[0] * 0.6 + d[1] * w, c[1] + d[1] * 0.6 - 0.3 - d[0] * w, c[2] - 0.04]], 0.02, pink, { edge: '#c8407a' });
                ball(c[0] + d[0] * 0.66, c[1] + d[1] * 0.66 - 0.3, c[2] + 0.02, 0.05, gold, { emis: true, n: 2 }); }
              for (let i = 0; i < 6; i++) { const a = (i / 5 - 0.5) * 2.2, d = [Math.sin(a), Math.cos(a)], w = 0.12; plate([[c[0], c[1] - 0.3, c[2] + 0.03], [c[0] + d[0] * 0.3 - d[1] * w, c[1] + d[1] * 0.3 - 0.3 + d[0] * w, c[2] + 0.03], [c[0] + d[0] * 0.48, c[1] + d[1] * 0.48 - 0.3, c[2] + 0.03], [c[0] + d[0] * 0.3 + d[1] * w, c[1] + d[1] * 0.3 - 0.3 - d[0] * w, c[2] + 0.03]], 0.015, pale); }
              ball(c[0], c[1] - 0.3, c[2] + 0.06, 0.12, gold, { emis: true, n: 2 }); for (let i = 0; i < 6; i++) { const a = i * 1.05; ball(Math.cos(a) * 0.9, 0.9 + (i % 3) * 0.3, -0.4 + Math.sin(a) * 0.2, 0.025, gold, { emis: true, n: 1 }); } }
            bone = 0; hover = 0; flyer = false;
          } else if (P === 'cygnet' || P === 'lotusswan') { // a grey cygnet; grown, a white swan with a lotus opening on its back
            const big = P === 'lotusswan';
            if (!big) chick('#a8aeb8', '#c8ccd4', '#3a3e48', { beak: 'duck', beakL: 0.1 });
            else { legsB(0.16, 0.12, '#3a3e48', 0.035, { web: true }); egg(0.42, 0, 0.3, 0.26, 0.44, '#f6f8fa', '#e8ecf0', [1, 0.9]);
              tube([[0, 0.5, 0.32], [0, 0.86, 0.4], [0, 1.1, 0.3], [0, 1.16, 0.38]], [0.08, 0.065, 0.055, 0.05], '#f6f8fa', { cap0: 'none', cap1: 'round' });
              H(1.16, 0.38); ball(0, 1.18, 0.4, 0.08, '#f6f8fa', { n: 3 }); blob(-0.04, 1.14, 0.44, 0.04, 1.22, 0.5, 0.6, '#16121e', { n: 1 }); look(0.055, 1.2, 0.44, 0.022); beak('duck', 1.16, 0.48, 0.035, 0.14, '#e8603a'); bone = 0;
              wings2(0.26, 0.56, 0.06, 0.7, { c: '#f6f8fa', f: '#ffffff', f2: '#eef0f4', n: 7, fold: -1.0 });
              for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + r * 0.5; plate([[0, 0.66, -0.06], [Math.cos(a) * (0.26 - r * 0.08), 0.84 + r * 0.06, -0.06 + Math.sin(a) * (0.26 - r * 0.08)], [Math.cos(a + 0.4) * (0.18 - r * 0.06), 0.78 + r * 0.06, -0.06 + Math.sin(a + 0.4) * (0.18 - r * 0.06)]], 0.015, r ? '#f4c8e0' : '#f4a3d2'); }
              ball(0, 0.8, -0.06, 0.06, '#ffe08a', { emis: true, n: 2 }); fanTail([0, 0.5, -0.42], 3, 0.14, 0.6, '#f6f8fa', { up: 0.6 }); }
          } else if (P === 'hummingbird') { // a hummingbird: a jewel of a body, a needle beak, wings that never stop
            legsB(0.16, 0.05, '#3a3230', 0.015); egg(0.5, 0, 0.14, 0.16, 0.26, bd, bl, [0.7, 1]); blob(-0.1, 0.4, 0.06, 0.1, 0.6, 0.2, 1, ac, { emis: true });
            H(0.64, 0.18); ball(0, 0.7, 0.2, 0.11, bd, { n: 3 }); look(0.06, 0.72, 0.28, 0.035); beak('spear', 0.7, 0.3, 0.016, 0.34, '#2a2420'); bone = 0;
            wings2(0.12, 0.6, 0.02, 0.6, { c: hexMix(bd, '#ffffff', 0.4), n: 6, fold: -0.2, long: 1.1 }); fanTail([0, 0.44, -0.24], 5, 0.18, 0.7, bd); hover = 0.4;

          // ======== STONE ========
          } else if (P === 'emuchick') chick('#c8b48a', '#8a6a42', '#3a3230', { after: () => { for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) blob(sd * 0.24 - 0.02, 0.32 + i * 0.12, -0.12, sd * 0.24 + 0.02, 0.36 + i * 0.12, 0.12, 0.6, '#6a4a2e', { n: 1 }); } });
          else if (P === 'rockemu' || P === 'terrorbird') { // an emu grown in stone country: a shaggy runner; then the terror bird, a giant with a hooked axe of a beak
            const big = P === 'terrorbird', shag = hexMix(bd, '#6a5a4a', 0.5), hip = big ? 0.66 : 0.62;
            legsB(hip, 0.14, '#6a6470', big ? 0.06 : 0.045, { thigh: true, thighC: shag, toe: big ? 0.3 : 0.2 });
            egg(hip + 0.3, 0, big ? 0.32 : 0.28, big ? 0.32 : 0.28, big ? 0.48 : 0.36, shag, hexMix(shag, dk, 0.3));
            for (let i = 0; i < 18; i++) { const a = i * 2.4, u = ((i * 0.618) % 1); cone([Math.cos(a) * 0.26, hip + 0.3 + u * 0.2, -0.1 - Math.abs(Math.sin(a)) * 0.24], [Math.cos(a) * 0.3, -1, -0.3], 0.24, 0.05, i % 2 ? shag : hexMix(shag, dk, 0.3)); }
            if (!big) { tube([[0, hip + 0.4, 0.3], [0, hip + 0.8, 0.36], [0, hip + 1.0, 0.4]], [0.07, 0.06, 0.06], hexMix(shag, '#4a6ab8', 0.3), { cap0: 'none', cap1: 'round' }); H(hip + 1.0, 0.4); ball(0, hip + 1.04, 0.44, 0.1, shag, { n: 3 }); look(0.06, hip + 1.08, 0.5, 0.03); beak('duck', hip + 1.02, 0.52, 0.04, 0.1, '#3a3230'); bone = 0; }
            else { tube([[0, hip + 0.44, 0.36], [0, hip + 0.82, 0.5]], [0.12, 0.11], shag, { cap0: 'none', cap1: 'round' }); H(hip + 0.86, 0.5); blob(-0.16, hip + 0.7, 0.42, 0.16, hip + 1.06, 0.72, 1, shag);
              blob(-0.12, hip + 0.66, 0.64, 0.12, hip + 0.98, 1.1, 0.7, '#d8c8a0', { tap: [1, 0.8] }); curl([0, hip + 0.92, 1.06], [0, -0.2, 1], 0.2, 0.06, '#d8c8a0', [0, -1.6, 0]); tube([[-0.11, hip + 0.8, 0.7], [0, hip + 0.78, 1.04], [0.11, hip + 0.8, 0.7]], [0.012, 0.012, 0.012], '#3a3230', { cap0: 'round', cap1: 'round' });
              look(0.12, hip + 0.96, 0.62, 0.035, { brow: dk, col: '#ffcf5a' }); for (let i = 0; i < 4; i++) cone([0, hip + 1.04, 0.46 - i * 0.08], [0, 1, -0.6], 0.14, 0.03, ac); bone = 0; }
            wings2(0.26, hip + 0.42, 0.06, 0.3, { c: shag, n: 4, fold: -1.4 }); hover = 0; flyer = false;
          } else if (P === 'hornbillchick' || P === 'hornbill') { // a hornbill: a beak like a carved horn with a stone casque on top of it
            const big = P === 'hornbill', black = '#20242e', cream = '#f2ead6';
            if (!big) chick(black, '#3a3e48', cream, { beak: 'big', beakL: 0.16, after: () => { bone = 1; blob(-0.04, 0.8, 0.22, 0.04, 0.86, 0.34, 0.6, bd, { n: 1 }); bone = 0; } });
            else { legsB(0.26, 0.1, '#3a3e48', 0.035); egg(0.6, 0, 0.24, 0.26, 0.4, black, cream);
              H(0.86, 0.3); ball(0, 0.92, 0.34, 0.15, black, { n: 3 }); look(0.08, 0.98, 0.44, 0.04, { brow: '#3a3e48', col: '#d83a3a' }); beak('big', 0.9, 0.44, 0.06, 0.42, cream);
              blob(-0.06, 0.98, 0.4, 0.06, 1.14, 0.78, 0.6, bd, { under: hexMix(bd, dk, 0.3), tap: [1, 0.8] }); bone = 0;
              wings2(0.22, 0.74, 0.04, 1.0, { c: black, f: black, f2: cream, n: 8 }); fanTail([0, 0.56, -0.4], 5, 0.6, 0.4, [cream, black], { up: -0.1 }); }
          } else if (P === 'shoebill') { // a shoebill: still as a statue, grey as one, a huge clog of a beak and an unblinking stare
            const grey = hexMix(bd, '#7a8494', 0.6);
            legsB(0.6, 0.1, '#4a4448', 0.035, { toe: 0.22 }); egg(0.98, 0, 0.26, 0.3, 0.32, grey, hexMix(grey, '#ffffff', 0.2), [0.85, 1]);
            H(1.26, 0.1); ball(0, 1.36, 0.12, 0.2, grey, { n: 3 }); for (let i = 0; i < 4; i++) cone([0, 1.5, 0.02 - i * 0.04], [0, 0.4, -1], 0.12, 0.025, grey);
            blob(-0.15, 1.2, 0.18, 0.15, 1.4, 0.62, 0.8, '#c8b490', { tap: [1, 0.8] }); curl([0, 1.36, 0.6], [0, -0.3, 1], 0.12, 0.05, '#c8b490', [0, -1.8, 0]); tube([[-0.14, 1.28, 0.2], [0, 1.26, 0.6], [0.14, 1.28, 0.2]], [0.01, 0.01, 0.01], '#4a4448', { cap0: 'round', cap1: 'round' });
            look(0.13, 1.44, 0.24, 0.035, { col: '#e8e2a0', brow: hexMix(grey, '#2a2e38', 0.4) }); bone = 0;
            wings2(0.24, 1.14, 0.04, 1.1, { c: grey, n: 8 }); fanTail([0, 0.86, -0.3], 4, 0.2, 0.5, grey); hover = 0;

          // ======== GALE ========
          } else if (P === 'eaglet') chick('#f2ece2', '#ffffff', '#3a3230', { beak: 'hook', beakL: 0.12, glow: false });
          else if (P === 'hawk' || P === 'stormeagle') { // a hawk with a barred chest; then an eagle of the storm, white-headed, cloud at its wingtips, lightning in its talons
            const big = P === 'stormeagle', brown = hexMix(bd, '#6a4a2e', 0.5), white = '#f6f8fa', k = big ? 1.25 : 1;
            legsB(0.32, 0.1, '#e8c23a', 0.035 * k, { thigh: true, thighC: brown }); egg(0.66, 0, 0.24 * k, 0.28 * k, 0.36 * k, brown, big ? brown : '#e8dcc8');
            if (!big) for (let i = 0; i < 4; i++) ring(0, 0.5 + i * 0.07, 0.26, 0.14, 0.02, 0.012, brown);
            H(0.94, 0.26); ball(0, 1.0, 0.3, 0.16 * k, big ? white : brown, { n: 3 }); look(0.09, 1.04, 0.42, 0.04, { brow: big ? '#c8ccd4' : dk, col: '#ffcf5a' }); beak('hook', 0.98, 0.46, 0.04, 0.14 * k, '#e8c23a');
            if (big) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; cone([Math.cos(a) * 0.12, 0.9 + Math.sin(a) * 0.06, 0.26], [Math.cos(a), -0.4, -0.3], 0.12, 0.04, white); } bone = 0;
            if (big) { display2(0.22 * k, 0.84, 0.02, 1.2, { c: brown, n: 11, f: brown, f2: hexMix(brown, dk, 0.3), tip: '#ffffff', up: 0.8 }); for (const sd of [-1, 1]) { bone = sd < 0 ? 7 : 8; for (let i = 0; i < 3; i++) ball(sd * (0.8 + i * 0.14), 1.34 + (i % 2) * 0.1, -0.24, 0.12 - i * 0.02, '#e8ecf2', { n: 2 }); bone = 0; } } else wings2(0.22 * k, 0.8, 0.04, 1.0, { c: brown, n: 8, f: brown, f2: hexMix(brown, dk, 0.3) });
            fanTail([0, 0.56, -0.36], 6, big ? 0.5 : 0.38, 0.6, big ? white : [brown, '#c8b48a']);
            if (big) for (const sd of [-1, 1]) { bone = sd < 0 ? 4 : 5; plate([[sd * 0.12, 0.06, 0.2], [sd * 0.14, 0.2, 0.32], [sd * 0.12, 0.14, 0.32], [sd * 0.14, 0.3, 0.44]], 0.02, ac, { emis: true }); bone = 0; }
          } else if (P === 'swallow' || P === 'swift') { // a barn swallow with a forked tail; then a swift, all scythe wings, a dart on the wind
            const big = P === 'swift', navy = hexMix(bd, '#203060', 0.5);
            legsB(0.12, 0.06, '#3a3230', 0.016); egg(0.4, 0, 0.14, 0.15, 0.3, navy, big ? navy : '#f2e2d0', [0.8, 1]); if (!big) blob(-0.08, 0.36, 0.18, 0.08, 0.5, 0.28, 1, '#c8503a', { n: 2 });
            H(0.5, 0.22); ball(0, 0.52, 0.26, 0.11, navy, { n: 3 }); look(0.065, 0.55, 0.33, 0.03); beak('cone', 0.5, 0.36, 0.02, 0.05, '#2a2420'); bone = 0;
            wings2(0.12, 0.46, 0.04, big ? 1.1 : 0.8, { c: navy, n: 7, long: big ? 1.35 : 1.1, fold: -1.35 });
            B(6, 'tail', [0, 0.38, -0.28]); for (const sd of [-1, 1]) plate([[0, 0.38, -0.28], [sd * 0.08, 0.38, -0.32], [sd * (big ? 0.16 : 0.22), 0.36, big ? -0.6 : -0.86]], 0.015, navy); bone = 0; hover = 0.18;
          } else if (P === 'frigatebird') { // a frigatebird: black, all angles, a scarlet throat pouch blown up like a balloon
            const black = '#20242e';
            legsB(0.16, 0.08, '#3a3e48', 0.02); egg(0.46, 0, 0.18, 0.2, 0.36, black, black);
            ball(0, 0.4, 0.24, 0.17, '#e83a3a', { n: 3 });
            H(0.62, 0.26); ball(0, 0.66, 0.3, 0.11, black, { n: 3 }); look(0.065, 0.7, 0.38, 0.03); beak('hook', 0.66, 0.4, 0.025, 0.2, '#8a8e98'); bone = 0;
            wings2(0.16, 0.56, 0.04, 1.6, { c: black, n: 9, long: 0.75, fold: -1.35 });
            B(6, 'tail', [0, 0.42, -0.34]); for (const sd of [-1, 1]) plate([[0, 0.42, -0.34], [sd * 0.06, 0.42, -0.38], [sd * 0.2, 0.4, -0.9]], 0.015, black); bone = 0;

          // ======== FROST ========
          } else if (P === 'snowowlet' || P === 'snowyowl' || P === 'auroraowl') { // an owlet ball of fluff, a snowy owl, then a great owl with the aurora in its wings
            const k = P === 'snowowlet' ? 0 : P === 'snowyowl' ? 1 : 2, white = '#f6f8fa', fleck = '#3a3e48';
            const top = [0.86, 1.1, 1.36][k], w = [0.32, 0.32, 0.4][k];
            legsB(0.12, 0.12, white, 0.04, { thigh: true, thighC: white }); egg((top + 0.12) / 2, 0, w, (top - 0.12) / 2, w * 0.85, white, k === 0 ? '#e0e4ea' : white, [1, 0.9]);
            if (k >= 1) for (let i = 0; i < 14; i++) { const a = (i * 2.4) % (Math.PI * 1.4) - 0.7 + Math.PI, y = 0.3 + ((i * 0.618) % 1) * (top - 0.5); blob(Math.sin(a) * w * 0.96 - 0.025, y - 0.01, Math.cos(a) * w * 0.8 - 0.025, Math.sin(a) * w * 0.96 + 0.025, y + 0.01, Math.cos(a) * w * 0.8 + 0.025, 0.7, fleck, { n: 1 }); }
            H(top - 0.1); const hy = top + 0.06; blob(-w * 0.9, hy - 0.2, -w * 0.7, w * 0.9, hy + 0.18, w * 0.7, 1, white);
            for (const sd of [-1, 1]) { ring(sd * 0.11, hy, w * 0.66, 0.1, 0.1, 0.02, '#e0e4ea'); } look(0.11, hy, w * 0.66, 0.065, { col: '#f2c23a', glow: k === 2 }); beak('hook', hy - 0.08, w * 0.7, 0.03, 0.06, '#3a3e48');
            if (k >= 1) for (const sd of [-1, 1]) cone([sd * 0.18, hy + 0.14, 0.04], [sd * 0.4, 1, -0.2], 0.1, 0.03, white);
            if (k === 0) for (let i = 0; i < 4; i++) cone([(i - 1.5) * 0.06, hy + 0.18, 0], [(i - 1.5) * 0.4, 1, -0.2], 0.08, 0.025, white); bone = 0;
            const aur = (i, n) => ['#7ae8c8', '#7ab8f8', '#b88af8', '#f88ad8'][Math.floor(i / n * 4)];
            if (k === 2) display2(w * 0.9, top - 0.3, 0.0, 1.2, { c: white, n: 12, feather: aur, emis: true, up: 0.45 }); else wings2(w * 0.9, top - 0.3, 0.0, [0.5, 0.9][k], { c: white, n: 7 });
            fanTail([0, 0.3, -w * 0.8], 5, 0.2, 0.7, white); hover = 0.06;
          } else if (P === 'cranechick' || P === 'crane') { // a crane chick; grown, a red-crowned crane, tall as a person, dancing
            const big = P === 'crane', white = '#f6f8fa', black = '#20242e';
            if (!big) chick('#c8b48a', '#e0d0b0', '#8a8288', { beakL: 0.14 });
            else { legsB(0.9, 0.08, black, 0.025, { toe: 0.18 }); egg(1.1, 0, 0.2, 0.22, 0.34, white, white);
              tube([[0, 1.2, 0.2], [0, 1.5, 0.28], [0, 1.74, 0.24], [0, 1.84, 0.3]], [0.06, 0.05, 0.045, 0.045], black, { cap0: 'none', cap1: 'round' });
              H(1.84, 0.3); ball(0, 1.88, 0.32, 0.08, white, { n: 3 }); ball(0, 1.94, 0.3, 0.05, '#d83a3a', { n: 2 }); look(0.05, 1.89, 0.37, 0.022); beak('spear', 1.87, 0.38, 0.025, 0.26, '#a8a49a'); bone = 0;
              wings2(0.18, 1.18, 0.04, 1.2, { c: white, n: 9, f: white, f2: black }); B(6, 'tail', [0, 1.04, -0.32]); for (let i = 0; i < 5; i++) tube([[0, 1.04, -0.32], [(i - 2) * 0.06, 0.94, -0.5], [(i - 2) * 0.08, 0.8, -0.56]], [0.03, 0.025, 0.01], black, { cap0: 'none', cap1: 'round' }); bone = 0; hover = 0; }
          } else if (P === 'snowgoose') { // a snow goose, wings tipped black, honking through the blizzard with ice on its back
            const white = '#f6f8fa';
            legsB(0.2, 0.12, '#e8803a', 0.035, { web: true }); egg(0.52, 0, 0.26, 0.26, 0.4, white, '#e8ecf0');
            tube([[0, 0.62, 0.3], [0, 0.84, 0.38], [0, 0.96, 0.4]], [0.08, 0.065, 0.06], white, { cap0: 'none', cap1: 'round' });
            H(0.96, 0.4); ball(0, 1.0, 0.42, 0.1, white, { n: 3 }); look(0.06, 1.03, 0.48, 0.03); beak('duck', 0.98, 0.5, 0.04, 0.14, '#e8803a'); tube([[-0.035, 0.96, 0.52], [0.035, 0.96, 0.52]], [0.012, 0.012], '#2a2420', { cap0: 'round', cap1: 'round' }); bone = 0;
            wings2(0.26, 0.66, 0.04, 0.9, { c: white, n: 8, f: white, f2: '#20242e' }); for (let i = 0; i < 5; i++) cone([(i - 2) * 0.08, 0.76, -0.1 - Math.abs(i - 2) * 0.06], [0, 1, -0.3], 0.14, 0.035, glw, { emis: true });
            fanTail([0, 0.5, -0.4], 5, 0.18, 0.7, white);

          // ======== SPARK ========
          } else if (P === 'zapchick') chick(bd, glw, '#3a3e48', { head: () => { plate([[0, 0.96, 0.06], [0.02, 1.08, 0.02], [0, 1.04, 0.0], [0.02, 1.18, -0.06]], 0.025, ac, { emis: true }); } });
          else if (P === 'cockatoo' || P === 'thundercockatoo') { // a cockatoo with a crest it raises like a fan; grown, the crest is a crown of lightning
            const big = P === 'thundercockatoo', white = '#f6f8fa', k = big ? 1.2 : 1;
            legsB(0.24, 0.1, '#6a6470', 0.035, { thigh: true, thighC: white }); egg(0.58, 0, 0.24 * k, 0.3 * k, 0.28 * k, white, '#eef0f4', [0.8, 1]);
            H(0.86); ball(0, 0.96, 0.08, 0.18 * k, white, { n: 3 }); look(0.1, 0.98, 0.22, 0.04, { brow: big ? '#c8ccd4' : null, col: big ? glw : null, glow: big }); beak('big', 0.92, 0.22, 0.06, 0.1, '#3a3e48');
            for (const sd of [-1, 1]) ball(sd * 0.12, 0.9, 0.18, 0.04, ac, { n: 2 });
            for (let i = 0; i < (big ? 7 : 5); i++) { const a = (i / ((big ? 7 : 5) - 1) - 0.5) * 1.6; const b = [0, 1.08, 0.04 - i * 0.02]; if (big) plate([b, [Math.sin(a) * 0.14, 1.26, -0.06], [Math.sin(a) * 0.1, 1.22, -0.08], [Math.sin(a) * 0.26, 1.46 + Math.cos(a) * 0.1, -0.2]], 0.025, i % 2 ? ac : glw, { emis: true }); else cone(b, [Math.sin(a), 1, -0.6], 0.3, 0.04, ac); } bone = 0;
            if (big) display2(0.22 * k, 0.74, 0.02, 0.9, { c: white, n: 10, tip: glw, up: 1 }); else wings2(0.22 * k, 0.72, 0.02, 0.8, { c: white, n: 8 }); fanTail([0, 0.42, -0.26], 5, 0.36, 0.5, white);
          } else if (P === 'kingfisherchick' || P === 'kingfisher') { // a kingfisher: an electric-blue back, an orange breast and a beak like a dart
            const big = P === 'kingfisher', blue = hexMix('#2a8ad8', bd, 0.25);
            if (!big) chick(blue, glw, '#2a2420', { u: orange, beak: 'spear', beakL: 0.16 });
            else { legsB(0.14, 0.06, '#e8603a', 0.02); egg(0.46, 0, 0.2, 0.22, 0.28, blue, orange, [0.8, 1]); tube([[0, 0.66, 0.2], [0, 0.62, -0.2]], [0.03, 0.03], glw, { emis: true, cap0: 'round', cap1: 'round' });
              H(0.66, 0.18); ball(0, 0.72, 0.2, 0.15, blue, { n: 3 }); for (const sd of [-1, 1]) blob(sd * 0.12 - 0.04, 0.64, 0.18, sd * 0.12 + 0.04, 0.72, 0.28, 0.8, orange, { n: 1 });
              look(0.08, 0.76, 0.3, 0.035); beak('spear', 0.72, 0.32, 0.035, 0.32, '#2a2420'); bone = 0;
              wings2(0.18, 0.56, 0.02, 0.6, { c: blue, n: 6, tip: glw }); fanTail([0, 0.42, -0.26], 4, 0.14, 0.4, blue); }
          } else if (P === 'lyrebird') { // a lyrebird: plain brown until it raises its tail, two curved lyre feathers strung with lightning between them
            const brown = hexMix(bd, '#6a4a2e', 0.6);
            legsB(0.3, 0.08, '#3a3230', 0.03); egg(0.58, 0, 0.2, 0.22, 0.3, brown, hexMix(brown, '#c8b48a', 0.4));
            H(0.8, 0.22); ball(0, 0.86, 0.26, 0.12, brown, { n: 3 }); look(0.07, 0.9, 0.34, 0.035); beak('cone', 0.85, 0.37, 0.025, 0.07, '#3a3230'); bone = 0;
            wings2(0.18, 0.66, 0.04, 0.55, { c: brown, n: 5 });
            B(6, 'tail', [0, 0.56, -0.28]); for (const sd of [-1, 1]) { const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push([sd * (0.06 + Math.sin(u * 3) * 0.3), 0.56 + u * 1.0, -0.3 - u * 0.24]); } tube(pts, pts.map((_, i) => 0.035 - i * 0.003), hexMix(brown, '#c8b48a', 0.5), { cap0: 'none', cap1: 'round' }); }
            for (let i = 0; i < 6; i++) { const y = 0.8 + i * 0.12, x = Math.sin(((y - 0.56) / 1.0) * 3) * 0.3 + 0.06; tube([[-x, y, -0.3 - (y - 0.56) * 0.24], [0, y + 0.04, -0.32 - (y - 0.56) * 0.24], [x, y, -0.3 - (y - 0.56) * 0.24]], [0.008, 0.008, 0.008], glw, { emis: true, cap0: 'none', cap1: 'none' }); }
            for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 1.2; tube([[0, 0.58, -0.3], [Math.sin(a) * 0.3, 0.9, -0.5], [Math.sin(a) * 0.4, 1.1, -0.56]], [0.015, 0.01, 0.004], '#e8e2d4', { cap0: 'none', cap1: 'none' }); } bone = 0; hover = 0;

          // ======== VOID ========
          } else if (P === 'ravenlet') chick('#2a2430', '#3a3440', '#16121e', { eye: ac });
          else if (P === 'raven' || P === 'ravenking') { // a raven, then a raven king with a third eye and a mantle of shadow feathers
            const big = P === 'ravenking', black = hexMix('#1a1620', bd, 0.15), k = big ? 1.25 : 1;
            legsB(0.24, 0.09, '#16121e', 0.03 * k); egg(0.58, 0, 0.22 * k, 0.26 * k, 0.36 * k, black, black);
            for (let i = 0; i < 8; i++) { const a = (i / 7 - 0.5) * 2.4; cone([Math.sin(a) * 0.14, 0.72, 0.24], [Math.sin(a), -0.6, 0.4], 0.14, 0.035, black); }
            H(0.86, 0.26); ball(0, 0.92, 0.3, 0.15 * k, black, { n: 3 }); look(0.08, 0.96, 0.42, 0.035, { col: ac, glow: big, brow: big ? '#3a3440' : null }); beak('hook', 0.9, 0.44, 0.04, 0.18, '#16121e');
            if (big) { ball(0, 1.06, 0.4, 0.04, '#16121e', { n: 2 }); ball(0, 1.06, 0.43, 0.025, glw, { emis: true, n: 1 }); for (let i = 0; i < 5; i++) cone([(i - 2) * 0.05, 1.08, 0.28 - Math.abs(i - 2) * 0.03], [(i - 2) * 0.2, 1, -0.4], 0.16, 0.025, ac); } bone = 0;
            if (big) display2(0.2 * k, 0.78, 0.02, 1.1, { c: black, n: 12, tip: ac, up: 0.6 }); else wings2(0.2 * k, 0.74, 0.04, 1.0, { c: black, n: 8 });
            fanTail([0, 0.5, -0.36], 6, big ? 0.5 : 0.36, 0.6, black, { edge: big ? ac : null });
            if (big) for (let i = 0; i < 6; i++) { const a = i * 2.1; tube([[Math.cos(a) * 0.3, 0.6, -0.2], [Math.cos(a) * 0.46, 0.5 + (i % 2) * 0.1, -0.4], [Math.cos(a) * 0.5, 0.4, -0.66]], [0.04, 0.025, 0.004], '#2a2430', { cap0: 'none', cap1: 'none' }); }
          } else if (P === 'nightjar' || P === 'potoo') { // a nightjar, mottled like bark; then a potoo: a stump of a bird with a huge mouth and great staring yellow eyes
            const big = P === 'potoo', bark = hexMix(bd, '#6a5a4a', 0.6), mott = hexMix(bark, '#2a2420', 0.4);
            legsB(0.1, 0.08, '#3a3230', 0.02); egg(big ? 0.6 : 0.36, 0, big ? 0.24 : 0.2, big ? 0.5 : 0.22, big ? 0.22 : 0.3, bark, hexMix(bark, '#c8b48a', 0.3), big ? [1, 0.8] : null);
            for (let i = 0; i < 16; i++) { const a = i * 2.4, u = ((i * 0.618) % 1) * 1.6 - 0.8, kk = Math.sqrt(Math.max(0, 1 - u * u)); blob(Math.cos(a) * kk * 0.22 - 0.03, (big ? 0.6 : 0.36) + u * (big ? 0.46 : 0.2) - 0.015, Math.sin(a) * kk * 0.22 - 0.03, Math.cos(a) * kk * 0.22 + 0.03, (big ? 0.6 : 0.36) + u * (big ? 0.46 : 0.2) + 0.015, Math.sin(a) * kk * 0.22 + 0.03, 0.7, mott, { n: 1 }); }
            const hy = big ? 1.14 : 0.56; H(hy - 0.06); blob(-0.18, hy - 0.12, -0.12, 0.18, hy + 0.12, 0.18, 1, bark);
            look(0.1, hy + 0.02, 0.14, big ? 0.075 : 0.045, { col: '#ffd22a', glow: big }); tube([[-0.14, hy - 0.08, 0.14], [0, hy - 0.1, 0.19], [0.14, hy - 0.08, 0.14]], [0.014, 0.014, 0.014], mott, { cap0: 'round', cap1: 'round' });
            if (big) blob(-0.13, hy - 0.16, 0.08, 0.13, hy - 0.08, 0.2, 0.8, '#3a1a20');
            for (const sd of [-1, 1]) tube([[sd * 0.08, hy + 0.1, 0.12], [sd * 0.12, hy + 0.14, 0.2]], [0.008, 0.004], mott, { cap0: 'none', cap1: 'none' }); bone = 0;
            wings2(0.18, big ? 0.9 : 0.42, 0.0, big ? 0.8 : 0.7, { c: bark, n: 7, f: bark, f2: mott, fold: -1.45 }); fanTail([0, big ? 0.24 : 0.3, -0.24], 5, big ? 0.36 : 0.3, 0.4, [bark, mott], { up: big ? -0.6 : 0.1 }); hover = big ? 0 : 0.1;
          } else if (P === 'cassowary') { // a cassowary: black plumage like hair, a blue neck, red wattles, a casque of horn on its head and dagger toes
            const black = hexMix('#16121e', bd, 0.12), blue = '#3a8ad8';
            legsB(0.66, 0.16, '#5a5a6a', 0.06, { thigh: true, thighC: black, toe: 0.26 }); for (const sd of [-1, 1]) { bone = sd < 0 ? 4 : 5; cone([sd * 0.16, 0.04, 0.06], [0, -0.1, 1], 0.24, 0.025, '#e8e2d4'); bone = 0; }
            egg(1.0, -0.04, 0.34, 0.34, 0.46, black, black);
            for (let i = 0; i < 20; i++) { const a = (i * 2.4) % (Math.PI * 2), u = ((i * 0.618) % 1); cone([Math.cos(a) * 0.3, 1.0 + u * 0.24, -0.1 - Math.abs(Math.sin(a)) * 0.3], [Math.cos(a) * 0.3, -1, -0.2], 0.3, 0.04, black); }
            tube([[0, 1.16, 0.3], [0, 1.44, 0.42], [0, 1.62, 0.44]], [0.1, 0.07, 0.06], blue, { cap0: 'none', cap1: 'round' }); for (const sd of [-1, 1]) blob(sd * 0.05 - 0.03, 1.12, 0.38, sd * 0.05 + 0.03, 1.32, 0.48, 1, '#d83a3a', { n: 2 });
            H(1.62, 0.44); ball(0, 1.66, 0.46, 0.1, blue, { n: 3 }); look(0.065, 1.7, 0.52, 0.03, { brow: '#2a4a8a', col: '#ffcf5a' }); beak('cone', 1.64, 0.54, 0.035, 0.12, '#2a2420');
            blob(-0.05, 1.7, 0.36, 0.05, 1.96, 0.56, 0.8, hexMix(ac, '#c8a060', 0.4), { tap: [1, 0.5] }); bone = 0;
            wings2(0.3, 1.06, 0.1, 0.2, { c: black, n: 3, fold: -1.45 }); hover = 0; flyer = false;

          // ======== LIGHT ========
          } else if (P === 'squab') chick('#e8e2ea', '#ffffff', '#c8a0a8');
          else if (P === 'dove' || P === 'sundove') { // a white dove; then a dove crowned with the sun, rays spread behind it like a halo
            const big = P === 'sundove', white = '#fbfaf6', k = big ? 1.2 : 1;
            legsB(0.18, 0.08, '#e88a8a', 0.025); egg(0.5, 0, 0.22 * k, 0.24 * k, 0.32 * k, white, '#f2eee6', [0.85, 1]);
            H(0.74, 0.22); ball(0, 0.8, 0.26, 0.14 * k, white, { n: 3 }); look(0.075, 0.84, 0.36, 0.035); beak('cone', 0.79, 0.38, 0.025, 0.07, '#c8a0a8');
            if (big) { ring(0, 0.96, 0.08, 0.36, 0.36, 0.03, '#ffd25a', { emis: true }); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; cone([Math.cos(a) * 0.36, 0.96 + Math.sin(a) * 0.36, 0.08], [Math.cos(a), Math.sin(a), 0], i % 2 ? 0.14 : 0.24, 0.04, i % 2 ? ac : '#ffd25a', { emis: true }); } } bone = 0;
            if (big) display2(0.2 * k, 0.62, 0.04, 0.9, { c: white, n: 10, tip: '#ffd25a', up: 0.35 }); else wings2(0.2 * k, 0.6, 0.04, 0.8, { c: white, n: 8 });
            fanTail([0, 0.44, -0.3], big ? 9 : 5, big ? 0.5 : 0.3, big ? 1.4 : 0.6, white, { edge: big ? '#ffd25a' : null });
          } else if (P === 'goldchick') chick('#f2d27a', '#ffe8a0', orange);
          else if (P === 'pheasant') { // a golden pheasant: a cape of gold and orange bars, a scarlet body and a tail as long as a spear
            const gold = '#f2c23a', red = hexMix('#d8302a', bd, 0.2);
            legsB(0.24, 0.08, '#c8a060', 0.03); egg(0.54, 0, 0.2, 0.22, 0.34, red, red);
            for (let i = 0; i < 4; i++) ring(0, 0.72 - i * 0.03, 0.18 - i * 0.07, 0.15 - i * 0.01, 0.12, 0.025, i % 2 ? '#e8803a' : '#20242e');
            H(0.78, 0.26); ball(0, 0.84, 0.3, 0.11, gold, { n: 3 }); for (let i = 0; i < 5; i++) cone([0, 0.92, 0.28 - i * 0.04], [0, 0.3, -1], 0.24, 0.035, gold); look(0.065, 0.86, 0.38, 0.03, { col: '#ffe08a' }); beak('cone', 0.82, 0.4, 0.025, 0.06, '#c8a060'); bone = 0;
            wings2(0.18, 0.62, 0.04, 0.6, { c: hexMix('#2a6ab8', bd, 0.3), n: 6 });
            B(6, 'tail', [0, 0.5, -0.32]); for (let i = 0; i < 3; i++) tube([[0, 0.5, -0.32], [(i - 1) * 0.04, 0.42, -0.9], [(i - 1) * 0.06, 0.3, -1.5]], [0.04, 0.03, 0.01], i === 1 ? '#c8a060' : '#8a6a42', { cap0: 'none', cap1: 'round' }); bone = 0; hover = 0;
          } else if (P === 'ibis') { // a sacred ibis: white body, black head bare as a mask, a long curved beak, a sun disc floating above
            const white = '#fbfaf6', black = '#20242e';
            legsB(0.56, 0.08, black, 0.025, { toe: 0.16 }); egg(0.78, 0, 0.22, 0.24, 0.36, white, white);
            tube([[0, 0.9, 0.26], [0, 1.1, 0.3], [0, 1.26, 0.3]], [0.06, 0.05, 0.05], black, { cap0: 'none', cap1: 'round' });
            H(1.26, 0.3); ball(0, 1.3, 0.32, 0.09, black, { n: 3 }); look(0.055, 1.33, 0.38, 0.025); curl([0, 1.28, 0.38], [0, 0.0, 1], 0.42, 0.03, black, [0, -0.8, 0]);
            ring(0, 1.62, 0.3, 0.12, 0.12, 0.02, '#ffd25a', { emis: true }); blob(-0.1, 1.52, 0.28, 0.1, 1.72, 0.32, 1, '#ffd25a', { emis: true }); bone = 0;
            wings2(0.2, 0.86, 0.04, 0.9, { c: white, n: 8, f: white, f2: black }); fanTail([0, 0.72, -0.36], 5, 0.3, 0.5, black, { up: -0.3 }); hover = 0;
          }
          // ---- the spice: what makes each bird a Kin and not just a bird. Element anatomy grown into each design. ----
          { const onH = (fn) => { bone = 1; fn(); bone = 0; }, onT = (fn) => { if (bones[6]) { bone = 6; fn(); bone = 0; } else fn(); };
            const lava = '#ffa23a', hot = '#ffd25a', obs = '#1e1a1c', cyan = '#7ae0ff', foam = '#eaf8ff', ice = '#bfe8ff', bolt = '#ffe45a', shade = '#9a6aff', sun = '#ffd25a', leaf = '#5fae4a', pet = '#f4a3d2';
            const fl = (b, d, h, r, c1, c2) => { for (let i = 0; i < 3; i++) cone(b, [d[0] + (i - 1) * 0.35, d[1], d[2] + (i - 1) * 0.1], h * (i === 1 ? 1 : 0.7), r, i === 1 ? c1 : c2, { emis: true }); };
            const streak = (pts, r, c) => tube(pts, pts.map(() => r), c, { emis: true, cap0: 'round', cap1: 'round' });
            const tufts = (x, y, z, len, c, emis) => { for (const sd of [-1, 1]) curl([sd * x, y, z], [sd * 0.5, 1, -0.6], len, 0.03, c, [sd * 0.3, -0.4, -0.5], { emis: !!emis }); };
            switch (P) {
              // FLAME
              case 'emberchick': for (const sd of [-1, 1]) onH(() => ball(sd * 0.15, 0.7, 0.2, 0.035, hot, { emis: true, n: 1 })); onT(() => fl([0, 0.38, -0.4], [0, 0.5, -1], 0.14, 0.035, hot, lava)); break;
              case 'flamekestrel': onH(() => fl([0, 1.04, 0.22], [0, 0.7, -1], 0.26, 0.04, hot, lava)); for (const sd of [-1, 1]) streak([[sd * 0.2, 0.72, 0.16], [sd * 0.22, 0.6, -0.04], [sd * 0.2, 0.54, -0.24]], 0.02, lava); onT(() => { for (let i = 0; i < 3; i++) cone([(i - 1) * 0.1, 0.6, -0.72], [(i - 1) * 0.3, 0.2, -1], 0.2, 0.04, hot, { emis: true }); }); break;
              case 'phoenix': onH(() => { for (let i = 0; i < 3; i++) { const p2 = [(i - 1) * 0.16, 1.4 + (i === 1) * 0.12, -0.2]; tube([[0, 1.1, 0.22], [(i - 1) * 0.08, 1.3, 0.04], p2], [0.02, 0.015, 0.01], lava, { emis: true, cap0: 'none', cap1: 'none' }); ball(p2[0], p2[1], p2[2], 0.05, hot, { emis: true, n: 2 }); } }); ball(0, 0.56, 0.2, 0.16, hot, { emis: true, n: 2 }); for (let i = 0; i < 6; i++) { const a = i * 1.1; ball(Math.cos(a) * 0.5, 0.6 + (i % 3) * 0.3, Math.sin(a) * 0.4 - 0.2, 0.03, hot, { emis: true, n: 1 }); } break;
              case 'emberrobin': ball(0, 0.5, 0.2, 0.08, hot, { emis: true, n: 2 }); onH(() => { ball(0.02, 0.98, 0.08, 0.06, '#8a8488', { n: 2 }); ball(-0.03, 1.06, 0.04, 0.045, '#9a9498', { n: 2 }); }); break;
              case 'firerobin': for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2.4; cone([Math.sin(a) * 0.12, 0.5 + Math.cos(a) * 0.08, 0.3], [Math.sin(a), Math.cos(a) * 0.6, 0.6], 0.16, 0.04, i % 2 ? lava : hot, { emis: true }); } onT(() => fl([0, 0.6, -0.5], [0, 0.8, -0.8], 0.22, 0.04, hot, lava)); break;
              case 'magmavulture': // obsidian armour with lava in the joins, a bone mask, magma dripping off the hooked beak, smoke rising from the shoulders
                for (const pth of [[[-0.28, 0.9, 0.14], [-0.2, 0.74, 0.3], [-0.26, 0.56, 0.24]], [[0.26, 0.92, 0.1], [0.3, 0.72, 0.0], [0.24, 0.54, -0.2]], [[0.0, 0.48, 0.28], [0.08, 0.62, 0.32], [0.0, 0.78, 0.3]], [[-0.1, 1.02, -0.2], [0.06, 0.96, -0.36]]]) streak(pth, 0.025, lava);
                for (let i = 0; i < 6; i++) { const z = 0.1 - i * 0.12; cone([0, 1.04 - i * 0.03, z], [0, 1, -0.4], 0.24 - i * 0.02, 0.06, obs); }
                for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { ball(sd * 0.3, 1.08 + i * 0.16, -0.06 - i * 0.04, 0.08 - i * 0.015, '#5a5458', { n: 2 }); }
                onH(() => { blob(-0.1, 1.2, 0.36, 0.1, 1.36, 0.47, 0.8, '#efe6d6'); for (const sd of [-1, 1]) { blob(sd * 0.045 - 0.03, 1.27, 0.44, sd * 0.045 + 0.03, 1.32, 0.48, 0.6, obs, { n: 1 }); ball(sd * 0.045, 1.295, 0.48, 0.016, hot, { emis: true, n: 1 }); curl([sd * 0.07, 1.34, 0.36], [sd * 0.4, 1, -0.6], 0.24, 0.035, '#efe6d6', [0, -0.3, -0.5]); } tube([[0, 1.14, 0.58], [0, 1.04, 0.6], [0, 0.98, 0.58]], [0.02, 0.015, 0.006], lava, { emis: true, cap0: 'round', cap1: 'round' }); ball(0, 0.96, 0.58, 0.022, hot, { emis: true, n: 1 }); });
                for (const sd of [-1, 1]) { bone = sd < 0 ? 7 : 8; if (bones[bone]) { for (let i = 0; i < 4; i++) blob(sd * 0.3 - 0.06, 0.94 - i * 0.06, -0.06 - i * 0.14, sd * 0.3 + 0.06, 1.0 - i * 0.06, 0.04 - i * 0.14, 0.4, obs, { n: 1 }); } bone = 0; }
                break;
              // TIDE
              case 'gullchick': onH(() => { for (let i = 0; i < 3; i++) ball((i - 1) * 0.06, 0.98 + (i === 1) * 0.04, 0.02, 0.05, foam, { n: 2 }); }); onT(() => plate([[0, 0.36, -0.3], [0, 0.5, -0.5], [0, 0.26, -0.5]], 0.02, cyan)); break;
              case 'seagull': case 'albatross': { const big = P === 'albatross'; onH(() => { plate([[0, 0.96, 0.36], [0, 1.14 + 0.08 * big, 0.2], [0, 1.08, 0.08], [0, 0.94, 0.24]], 0.02, cyan, { edge: foam }); for (const sd of [-1, 1]) streak([[sd * 0.1, 0.86, 0.46], [sd * 0.13, 0.84, 0.34]], 0.012, cyan); });
                for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) plate([[sd * 0.2, 0.52 + i * 0.08, 0.1 - i * 0.12], [sd * 0.24, 0.58 + i * 0.08, -0.06 - i * 0.12], [sd * 0.22, 0.5 + i * 0.08, -0.08 - i * 0.12]], 0.015, cyan);
                onT(() => { for (const sd of [-1, 1]) plate([[0, 0.56, -0.5], [sd * 0.22, 0.66, -0.78], [sd * 0.06, 0.56, -0.68]], 0.02, cyan, { edge: foam }); });
                if (big) { ball(0, 0.5, 0.24, 0.1, cyan, { emis: true, n: 2 }); hring(0, 0.5, 0.24, 0.14, 0.012, foam, { emis: true }); for (let i = 0; i < 5; i++) { const a = i * 1.3; ball(Math.cos(a) * 0.4, 0.3 + (i % 2) * 0.2, Math.sin(a) * 0.3, 0.035, foam, { emis: true, n: 1 }); } } break; }
              case 'puffin': onH(() => { for (const sd of [-1, 1]) curl([sd * 0.16, 1.06, 0.0], [sd * 0.6, 0.3, -1], 0.34, 0.035, '#f2c23a', [sd * 0.2, -0.6, 0]); }); for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.2; plate([[0, 0.34, 0.27], [Math.sin(a) * 0.17, 0.34 + Math.cos(a) * 0.24, 0.24], [Math.sin(a + 0.2) * 0.17, 0.34 + Math.cos(a + 0.2) * 0.24, 0.24]], 0.02, i % 2 ? '#f4d8c0' : '#e8b89a'); } ball(0, 0.36, 0.3, 0.05, '#f4f8ff', { emis: true, n: 2 }); break;
              case 'heron': onH(() => { for (let i = 0; i < 3; i++) tube([[0, 1.7, 0.3], [0, 1.82 + i * 0.04, 0.14 - i * 0.04], [0, 1.76 + i * 0.06, -0.06 - i * 0.06]], [0.015, 0.012, 0.006], cyan, { cap0: 'none', cap1: 'round' }); cone([0, 1.63, 0.76], [0, -0.08, 1], 0.08, 0.02, cyan, { emis: true }); });
                plate([[0, 1.36, 0.18], [0, 1.5, 0.08], [0, 1.24, 0.12]], 0.015, cyan); for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) hring(sd * 0.08, 0.03, 0.06, 0.12 + i * 0.08, 0.01, foam); break;
              // BLOOM
              case 'peachick': onT(() => { for (let i = 0; i < 3; i++) plate([[0, 0.38, -0.3], [(i - 1) * 0.16, 0.5, -0.5], [(i - 1) * 0.08, 0.42, -0.44]], 0.02, leaf); }); break;
              case 'cygnet': onH(() => { plate([[0, 0.98, 0.06], [-0.14, 1.04, -0.02], [0, 1.08, -0.1], [0.14, 1.04, -0.02]], 0.02, leaf); ball(0, 1.02, 0.0, 0.035, pet, { n: 1 }); }); break;
              case 'lotusswan': for (let i = 0; i < 6; i++) { const a = (i / 5 - 0.5) * 2.4; plate([[0, 0.72, 0.36], [Math.sin(a) * 0.2, 0.66, 0.36 + Math.cos(a) * 0.12], [Math.sin(a + 0.3) * 0.16, 0.6, 0.34 + Math.cos(a + 0.3) * 0.1]], 0.015, leaf); } for (let i = 0; i < 6; i++) { const a = i * 1.1; ball(Math.cos(a) * 0.26, 1.0 + (i % 3) * 0.12, Math.sin(a) * 0.2 - 0.06, 0.022, '#ffe08a', { emis: true, n: 1 }); } break;
              case 'hummingbird': onT(() => { for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * 1.4; plate([[0, 0.44, -0.24], [Math.sin(a) * 0.22, 0.46, -0.24 - Math.cos(a) * 0.3], [Math.sin(a + 0.25) * 0.14, 0.44, -0.24 - Math.cos(a + 0.25) * 0.2]], 0.015, i % 2 ? pet : '#f4c8e0'); } }); onH(() => { for (let i = 0; i < 3; i++) plate([[0, 0.8, 0.18], [(i - 1) * 0.08, 0.94, 0.08], [(i - 1) * 0.03, 0.86, 0.12]], 0.012, pet); }); break;
              // STONE
              case 'emuchick': onH(() => { for (let i = 0; i < 3; i++) blob((i - 1) * 0.07 - 0.04, 0.94, 0.0, (i - 1) * 0.07 + 0.04, 1.0 + (i === 1) * 0.04, 0.08, 0.4, '#9a948a', { n: 1 }); }); break;
              case 'rockemu': case 'terrorbird': { const big = P === 'terrorbird', hip = big ? 0.66 : 0.62; for (let i = 0; i < 4; i++) blob(-0.2 + (i % 2) * 0.04, hip + 0.52 + (i % 2) * 0.02, 0.14 - i * 0.18, 0.2 - (i % 2) * 0.04, hip + 0.64 + (i % 2) * 0.02, 0.28 - i * 0.18, 0.4, '#8a847a', { n: 2 });
                for (let i = 0; i < 3; i++) cone([(i - 1) * 0.14, hip + 0.6, -0.1 - i * 0.12], [(i - 1) * 0.3, 1, -0.3], 0.26, 0.06, glw, { emis: true, segs: 4 });
                onH(() => { if (big) { for (let i = 0; i < 3; i++) cone([0, hip + 1.06, 0.6 - i * 0.1], [0, 1, -0.4], 0.16, 0.04, glw, { emis: true, segs: 4 }); blob(-0.13, hip + 0.86, 0.6, 0.13, hip + 0.9, 0.9, 0.5, '#8a847a', { n: 1 }); } else cone([0, hip + 1.12, 0.42], [0, 1, -0.3], 0.14, 0.035, glw, { emis: true, segs: 4 }); }); break; }
              case 'hornbill': onH(() => { for (let i = 0; i < 3; i++) cone([0, 1.12, 0.48 + i * 0.1], [0, 1, 0.2], 0.12, 0.035, glw, { emis: true, segs: 4 }); }); for (const sd of [-1, 1]) blob(sd * 0.22 - 0.06, 0.66, 0.0, sd * 0.22 + 0.06, 0.82, 0.24, 0.4, '#8a847a', { n: 1 }); break;
              case 'shoebill': onH(() => { for (const pth of [[[-0.15, 1.3, 0.3], [-0.15, 1.24, 0.46]], [[0.15, 1.3, 0.3], [0.15, 1.24, 0.46]]]) streak(pth, 0.012, glw); }); for (let i = 0; i < 4; i++) ball((i % 2 ? 0.1 : -0.12), 1.24 + i * 0.03, -0.1 - i * 0.04, 0.06, '#5f8a3a', { n: 2 }); for (const sd of [-1, 1]) { bone = sd < 0 ? 7 : 8; if (bones[bone]) streak([[sd * 0.26, 1.1, -0.04], [sd * 0.28, 1.02, -0.2], [sd * 0.27, 0.96, -0.12]], 0.012, glw); bone = 0; } break;
              // GALE
              case 'eaglet': onH(() => { curl([0, 0.96, 0.04], [0, 1, -0.4], 0.2, 0.03, cyan, [0.6, -0.4, -0.4]); }); break;
              case 'hawk': case 'stormeagle': onH(() => { for (let i = 0; i < 3; i++) { const a = (i - 1) * 0.5; curl([Math.sin(a) * 0.06, 1.12, 0.22], [Math.sin(a), 1, -0.8], 0.26, 0.03, P === 'stormeagle' ? '#ffffff' : cyan, [Math.sin(a) * 0.5, -0.5, -0.4]); } });
                for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) curl([sd * 0.24, 0.66 + i * 0.1, -0.1], [sd * 0.3, 0.1, -1], 0.4, 0.015, foam, [sd * 0.4, 0.3, 0]);
                if (P === 'stormeagle') for (let i = 0; i < 3; i++) streak([[0.06 * (i - 1), 0.5, 0.34], [0.1 * (i - 1), 0.42, 0.42], [0.06 * (i - 1), 0.34, 0.4]], 0.015, bolt); break;
              case 'swallow': onT(() => { for (const sd of [-1, 1]) tube([[sd * 0.2, 0.36, -0.84], [sd * 0.26, 0.38, -1.06], [sd * 0.2, 0.42, -1.2]], [0.012, 0.01, 0.004], cyan, { cap0: 'none', cap1: 'none' }); }); onH(() => curl([0, 0.62, 0.22], [0, 0.6, -1], 0.16, 0.025, cyan, [0, 0.5, 0])); break;
              case 'swift': for (const sd of [-1, 1]) { bone = sd < 0 ? 7 : 8; if (bones[bone]) { const pts = []; for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push([sd * (0.18 + Math.sin(u * 2.4) * 0.14), 0.52 + u * 0.06, 0.0 - u * 0.7]); } tube(pts, pts.map((_, i) => 0.03 * (1 - i / 7)), cyan, { emis: true, cap0: 'round', cap1: 'none' }); } bone = 0; } onH(() => { for (const sd of [-1, 1]) streak([[sd * 0.06, 0.58, 0.34], [sd * 0.14, 0.6, 0.22]], 0.01, cyan); }); break;
              case 'frigatebird': for (let i = 0; i < 3; i++) hring(0, 0.3 + i * 0.1, 0.24, 0.12 - Math.abs(i - 1) * 0.03, 0.012, '#ffd0d0', { emis: true }); for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) curl([sd * 0.16, 0.6, -0.1 - i * 0.1], [sd * 0.3, 0.1, -1], 0.5, 0.012, foam, [sd * 0.4, 0.4, 0]); break;
              // FROST
              case 'snowowlet': onH(() => { for (let i = 0; i < 3; i++) cone([(i - 1) * 0.08, 1.0, 0.0], [(i - 1) * 0.3, 1, -0.1], 0.14, 0.03, ice, { emis: true, segs: 4 }); }); break;
              case 'snowyowl': case 'auroraowl': { const big = P === 'auroraowl', top = big ? 1.36 : 1.1; onH(() => { tufts(0.2, top + 0.18, 0.02, big ? 0.36 : 0.26, ice, true); for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) cone([sd * (0.08 + i * 0.05), top - 0.14, 0.26 - i * 0.02], [0, -1, 0.1], 0.08 + i * 0.02, 0.018, ice, { emis: true, segs: 4 }); if (big) for (let i = 0; i < 5; i++) cone([(i - 2) * 0.08, top + 0.24, 0.0], [(i - 2) * 0.3, 1, -0.1], 0.2 + (i === 2) * 0.1, 0.035, ice, { emis: true, segs: 4 }); }); break; }
              case 'cranechick': onH(() => cone([0, 1.0, 0.04], [0, 1, -0.2], 0.12, 0.03, ice, { emis: true, segs: 4 })); break;
              case 'crane': onH(() => { for (let i = 0; i < 5; i++) cone([(i - 2) * 0.025, 1.96, 0.3 - Math.abs(i - 2) * 0.02], [(i - 2) * 0.4, 1, -0.3], 0.12 + (i === 2) * 0.06, 0.02, ice, { emis: true, segs: 4 }); for (let i = 0; i < 3; i++) cone([(i - 1) * 0.03, 1.82, 0.36], [0, -1, 0.2], 0.12, 0.012, ice, { emis: true }); }); onT(() => { for (let i = 0; i < 3; i++) cone([(i - 1) * 0.08, 0.8, -0.56], [0, -1, -0.2], 0.16, 0.025, ice, { emis: true, segs: 4 }); }); break;
              case 'snowgoose': onH(() => { blob(-0.09, 1.02, 0.42, 0.09, 1.06, 0.5, 0.5, ice, { n: 1 }); for (let i = 0; i < 3; i++) cone([0, 1.08, 0.4 - i * 0.05], [0, 1, -0.6], 0.14 - i * 0.02, 0.025, ice, { emis: true, segs: 4 }); }); break;
              // SPARK
              case 'cockatoo': onH(() => { for (const sd of [-1, 1]) streak([[sd * 0.15, 0.96, 0.14], [sd * 0.17, 0.9, 0.12], [sd * 0.15, 0.86, 0.14]], 0.012, bolt); }); for (let i = 0; i < 2; i++) streak([[0.04, 0.52 + i * 0.14, 0.26], [-0.03, 0.48 + i * 0.14, 0.27], [0.04, 0.42 + i * 0.14, 0.26]], 0.014, bolt); break;
              case 'thundercockatoo': for (let i = 0; i < 3; i++) streak([[0.05, 0.5 + i * 0.12, 0.32], [-0.04, 0.46 + i * 0.12, 0.33], [0.05, 0.4 + i * 0.12, 0.32]], 0.016, bolt); for (let i = 0; i < 5; i++) { const a = i * 1.26; ball(Math.cos(a) * 0.5, 0.5 + (i % 2) * 0.4, Math.sin(a) * 0.3, 0.025, bolt, { emis: true, n: 1 }); } break;
              case 'kingfisher': onH(() => cone([0, 0.72, 0.64], [0, -0.1, 1], 0.06, 0.012, bolt, { emis: true })); onT(() => plate([[0, 0.44, -0.4], [0.02, 0.56, -0.48], [0, 0.52, -0.5], [0.02, 0.66, -0.6]], 0.02, bolt, { emis: true })); break;
              case 'lyrebird': onH(() => { for (let i = 0; i < 3; i++) streak([[0, 0.96, 0.22 - i * 0.03], [(i - 1) * 0.05, 1.08, 0.16 - i * 0.03], [(i - 1) * 0.08, 1.14, 0.1 - i * 0.03]], 0.008, bolt); }); break;
              // VOID
              case 'ravenlet': onH(() => { for (let i = 0; i < 3; i++) cone([(i - 1) * 0.05, 0.98, 0.02], [(i - 1) * 0.3, 1, -0.4], 0.12, 0.025, shade); }); break;
              case 'raven': onH(() => { blob(-0.11, 0.94, 0.38, 0.11, 1.0, 0.45, 0.6, '#2a2430', { n: 1 }); }); onT(() => { for (let i = 0; i < 3; i++) tube([[(i - 1) * 0.08, 0.5, -0.66], [(i - 1) * 0.14, 0.44, -0.86], [(i - 1) * 0.1, 0.5, -1.0]], [0.04, 0.025, 0.004], shade, { emis: true, cap0: 'none', cap1: 'none' }); }); break;
              case 'nightjar': case 'potoo': for (let i = 0; i < 4; i++) { const sd = i % 2 ? 1 : -1; ball(sd * 0.2, (P === 'potoo' ? 0.5 : 0.34) + Math.floor(i / 2) * 0.14, 0.06, 0.03, shade, { emis: true, n: 1 }); } onH(() => { for (const sd of [-1, 1]) curl([sd * 0.12, P === 'potoo' ? 1.24 : 0.66, 0.0], [sd * 0.5, 1, -0.5], 0.2, 0.025, shade, [0, -0.2, -0.4]); }); break;
              case 'cassowary': onH(() => { for (let i = 0; i < 3; i++) cone([0, 1.9 + i * 0.03, 0.44 - i * 0.06], [0, 1, -0.3], 0.16, 0.03, shade, { emis: true }); }); for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * 2; tube([[Math.sin(a) * 0.3, 1.12, -0.36], [Math.sin(a) * 0.4, 1.04, -0.6], [Math.sin(a) * 0.36, 1.14, -0.78]], [0.04, 0.025, 0.004], shade, { emis: true, cap0: 'none', cap1: 'none' }); } break;
              // LIGHT
              case 'squab': onH(() => ring(0, 1.02, 0.06, 0.1, 0.1, 0.012, sun, { emis: true })); break;
              case 'dove': onH(() => ring(0, 1.0, 0.24, 0.12, 0.12, 0.015, sun, { emis: true })); onT(() => { for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * 0.6; ball(Math.sin(a) * 0.3, 0.48, -0.3 - Math.cos(a) * 0.3, 0.025, sun, { emis: true, n: 1 }); } }); break;
              case 'goldchick': onH(() => { for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * 1.6; cone([Math.sin(a) * 0.1, 0.96, 0.04], [Math.sin(a), 1, -0.2], 0.08, 0.02, sun, { emis: true }); } }); break;
              case 'pheasant': onH(() => { ring(0, 1.04, 0.24, 0.1, 0.1, 0.012, sun, { emis: true }); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; cone([Math.cos(a) * 0.1, 1.04 + Math.sin(a) * 0.1, 0.24], [Math.cos(a), Math.sin(a), 0], 0.06, 0.015, sun, { emis: true }); } }); onT(() => { for (let i = 0; i < 3; i++) ball((i - 1) * 0.06, 0.3, -1.5, 0.03, sun, { emis: true, n: 1 }); }); break;
            } }
          break;
        }
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
        if (form.plan && FSH.has(form.plan)) {
          // Fish with bodies of their own, each a real fish (or the legend it grows into). The tail fin is bone 6 and the body sways.
          const P = form.plan, dk = C.dark, bl = C.belly, bd = C.body, ac = C.accent, glw = hexMix(C.accent, '#ffffff', 0.3);
          hover = 0.15; legLen = 0.5; sway = { amp: 0.05 * s, freq: 4 / s, speed: 7, from: 0.35 * s };
          const look = (ex, ey, ez, er, o = {}) => LOOK(ex, ey, ez, er, o, true); const lookOld = (ex, ey, ez, er, o = {}) => { for (const sd of [-1, 1]) { ball(sd * ex, ey, ez, er, '#16121e', { n: 3 }); ball(sd * (ex + er * 0.5), ey - er * 0.08, ez + er * 0.2, er * 0.62, o.col || C.eye, { emis: !!o.glow, n: 3 });
            ball(sd * (ex + er * 0.78), ey - er * 0.06, ez + er * 0.25, er * 0.3, '#0a0810', { n: 2 }); ball(sd * (ex + er * 0.82), ey + er * 0.3, ez + er * 0.45, er * 0.28, '#ffffff', { emis: true, n: 2 });
            if (o.brow) blob(sd * ex - er * 0.6, ey + er * 0.8, ez - er * 1.1, sd * ex + er * 1.0, ey + er * 1.2, ez + er * 1.1, 0.5, o.brow, { n: 2 }); } };
          const rgb = (h) => U.hexToRgb(h);
          // the body: a tube from snout to tail with a fish's profile; w the half-width, h the half-height
          const fish = (o) => { const n = 12, L = o.L || 1.0, cy = o.cy || 0.5, pts = [], rr = []; const z0 = o.z0 == null ? L * 0.5 : o.z0;
            for (let i = 0; i <= n; i++) { const t = i / n, prof = o.prof ? o.prof(t) : Math.pow(Math.sin(Math.min(1, 0.12 + t * 0.95) * Math.PI), 0.7) * (1 - t * 0.55); pts.push([0, cy + (o.dip ? o.dip(t) : 0), z0 - t * L]); rr.push(i === 0 ? [0.0005, 0.0005] : [Math.max(0.01, (o.w || 0.16) * prof), Math.max(0.01, (o.h || 0.26) * prof)]); }
            const top = rgb(o.c || bd), bel = rgb(o.belly || bl);
            tube(pts, rr, o.c || bd, { cap0: 'none', cap1: 'round', segs: 10, emis: !!o.emis, shade: (p, nx, ny, nz, t) => { if (o.shade) { const c = o.shade(p, nx, ny, nz, t); if (c) return rgb(c); } return ny < -0.3 ? bel : top; } });
            return { pts, rr, cy, L, z0, tail: pts[n], snout: pts[0], at: (t) => { const i = Math.round(t * n); return { p: pts[i], w: rr[i][0], h: rr[i][1] }; } }; };
          const tailFin = (f, type, size, c, o = {}) => { const [x, y, z] = f.tail, S = size || 0.4; B(6, 'tailfin', [x, y, z + 0.04]);
            const pl = (pts) => plate(pts, 0.025, c || ac, { edge: o.edge, emis: !!o.emis });
            if (type === 'fork') pl([[0, y + 0.04, z + 0.06], [0, y + S * 0.9, z - S * 0.7], [0, y + S * 0.3, z - S * 0.45], [0, y, z - S * 0.3], [0, y - S * 0.3, z - S * 0.45], [0, y - S * 0.9, z - S * 0.7], [0, y - 0.04, z + 0.06]]);
            else if (type === 'lunate') pl([[0, y + 0.04, z + 0.06], [0, y + S * 1.1, z - S * 0.5], [0, y + S * 0.5, z - S * 0.32], [0, y, z - S * 0.26], [0, y - S * 0.5, z - S * 0.32], [0, y - S * 1.1, z - S * 0.5], [0, y - 0.04, z + 0.06]]);
            else if (type === 'flow') { for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * 1.6; pl([[0, y, z + 0.04], [0, y + Math.sin(a) * S * 1.2 + 0.08, z - S * 0.8 - Math.cos(a) * S * 0.6], [0, y + Math.sin(a) * S * 1.2 - 0.08, z - S * 0.9 - Math.cos(a) * S * 0.6]]); } }
            else if (type === 'shark') pl([[0, y + 0.04, z + 0.08], [0, y + S * 1.2, z - S * 0.5], [0, y + S * 0.3, z - S * 0.2], [0, y - S * 0.6, z - S * 0.4], [0, y - 0.06, z + 0.06]]);
            else pl([[0, y + 0.06, z + 0.06], [0, y + S * 0.6, z - S * 0.5], [0, y + S * 0.2, z - S * 0.8], [0, y - S * 0.2, z - S * 0.8], [0, y - S * 0.6, z - S * 0.5], [0, y - 0.06, z + 0.06]]); // round
            if (o.extra) o.extra(x, y, z, S); bone = 0; };
          const dorsal = (f, t0, t1, ht, c, o = {}) => { const n = 6, pts = []; for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n, a = f.at(t); pts.push([0, a.p[1] + a.h * 0.85, a.p[2]]); } for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + 1) / n, sh = (u) => ht * (o.shape ? o.shape(u) : Math.sin(Math.min(1, u * 1.3 + 0.05) * Math.PI)); plate([pts[i], [0, pts[i][1] + sh(u0), pts[i][2] - ht * 0.2 * u0], [0, pts[i + 1][1] + sh(u1), pts[i + 1][2] - ht * 0.2 * u1], pts[i + 1]], 0.02, c || ac, { edge: o.edge, emis: !!o.emis }); if (o.spines) cone(pts[i], [0, 1, -0.2], sh(u0) * 1.15, 0.015, o.spines, { emis: !!o.spEmis }); } };
          const belowFin = (f, t0, t1, ht, c, o = {}) => { const a0 = f.at(t0), a1 = f.at(t1); plate([[0, a0.p[1] - a0.h * 0.85, a0.p[2]], [0, a0.p[1] - a0.h - ht * 0.6, a0.p[2] - ht * 0.4], [0, a1.p[1] - a1.h - ht, a1.p[2] - ht * 0.4], [0, a1.p[1] - a1.h * 0.85, a1.p[2]]], 0.02, c || ac, { edge: o.edge, emis: !!o.emis }); };
          const pects = (f, t, len, c, o = {}) => { const a = f.at(t); for (const sd of [-1, 1]) { const b0 = [sd * a.w * 0.9, a.p[1] - a.h * (o.low || 0.3), a.p[2]]; plate([b0, [sd * (a.w + len * (o.out || 0.7)), b0[1] - len * (o.down || 0.2), b0[2] - len * 0.6], [sd * (a.w + len * (o.out || 0.7) * 0.6), b0[1] - len * (o.down || 0.2) - 0.04, b0[2] - len * 0.9], [sd * a.w * 0.9, b0[1] - 0.04, b0[2] - 0.08]], 0.02, c || ac, { edge: o.edge, emis: !!o.emis }); } };
          const eyesAt = (f, t, r, o) => { const a = f.at(t); look(a.w * 0.8, a.p[1] + a.h * 0.25, a.p[2], r, o || {}); };
          const mouthAt = (f, t, o = {}) => { const a = f.at(t); H(); const y = a.p[1] - a.h * (o.low || 0.3), z = a.p[2] + 0.02; tube([[-a.w * 0.75, y + 0.01, z - 0.05], [0, y - (o.frown ? 0.02 : -0.01), z - 0.005], [a.w * 0.75, y + 0.01, z - 0.05]], [0.012, 0.012, 0.012], o.c || '#2a1a20', { cap0: 'round', cap1: 'round' }); if (o.teeth) for (let i = 0; i < o.teeth; i++) { const u = i / (o.teeth - 1) - 0.5; cone([u * a.w * 1.6, y + 0.02, z + 0.01 - Math.abs(u) * 0.06], [0, -1, 0.3], o.toothL || 0.06, 0.015, '#f4f0e6'); } bone = 0; };
          const H = () => { if (!bones[1]) B(1, 'head', [0, 0.5, 0.3]); bone = 1; };
          const fry = (c, o = {}) => { const f = fish({ L: o.L || 0.62, cy: o.cy || 0.42, w: o.w || 0.14, h: o.h || 0.2, c, belly: o.belly || hexMix(c, '#ffffff', 0.5), shade: o.shade, prof: o.prof || ((t) => Math.pow(Math.sin(Math.min(1, 0.18 + t * 0.9) * Math.PI), 0.6) * (1 - t * 0.5)) }); eyesAt(f, o.eyeT || 0.22, o.eyeR || 0.07, { col: o.eye, glow: o.glow }); tailFin(f, o.tail || 'round', o.tailS || 0.22, o.fin || ac); if (o.dorsal !== false) dorsal(f, 0.3, 0.6, o.dh || 0.1, o.fin || ac); pects(f, 0.35, o.pect || 0.12, o.fin || ac); mouthAt(f, 0.13, { frown: !!o.frown }); if (o.after) o.after(f); return f; };
          const stripes = (n, c, w) => (p, nx, ny, nz, t) => (Math.floor(t * n) % 2 === 1 && Math.abs(nx) > (w || 0.2)) ? c : null;

          // ======== FLAME ========
          if (P === 'emberfry') fry('#ff7a2a', { fin: '#ffd25a', h: 0.26, w: 0.18, L: 0.56, prof: (t) => Math.pow(Math.sin(Math.min(1, 0.1 + t * 0.95) * Math.PI), 0.4) * (1 - t * 0.4), dorsal: false, after: (f) => { for (let i = 0; i < 3; i++) cone([0, 0.62, 0.04 - i * 0.08], [0, 1, -0.4], 0.14, 0.03, '#ffd25a', { emis: true }); } });
          else if (P === 'lionfish' || P === 'infernolion') { const big = P === 'infernolion', red = big ? '#d8302a' : hexMix('#c8503a', bd, 0.3), cream = '#f4e8d8', flame = '#ffa23a';
            const f = fish({ L: big ? 1.3 : 1.0, cy: 0.6, w: 0.16, h: 0.26, c: red, belly: cream, shade: stripes(14, cream, 0.3) });
            eyesAt(f, 0.2, 0.07, { brow: dk, col: big ? '#ffd25a' : null, glow: big }); mouthAt(f, 0.06, { frown: true });
            for (let i = 0; i < 13; i++) { const t = 0.18 + i * 0.04, a = f.at(t); const tip = [0, a.p[1] + a.h + (big ? 0.62 : 0.44) * (1 - Math.abs(i - 5) * 0.05), a.p[2] - 0.2]; tube([[0, a.p[1] + a.h * 0.8, a.p[2]], tip], [0.014, 0.006], i % 2 ? red : cream, { cap0: 'none', cap1: 'round', emis: big }); if (big) ball(tip[0], tip[1], tip[2], 0.03, flame, { emis: true, n: 1 }); plate([[0, a.p[1] + a.h * 0.8, a.p[2]], tip, [0, a.p[1] + a.h * 0.8, a.p[2] - 0.08]], 0.01, big ? hexMix(flame, red, 0.5) : hexMix(red, cream, 0.5), { emis: big }); }
            for (const sd of [-1, 1]) for (let i = 0; i < 9; i++) { const a = (i / 8) * 1.6 - 0.2, b0 = [sd * 0.15, 0.54, 0.24]; const tip = [sd * (0.2 + Math.cos(a) * (big ? 0.8 : 0.56)), 0.54 - Math.sin(a) * 0.2 + 0.1, 0.2 - Math.sin(a) * (big ? 0.7 : 0.5)]; plate([b0, tip, [tip[0], tip[1] - 0.06, tip[2] + 0.06]], 0.012, i % 2 ? (big ? flame : red) : cream, { emis: big }); }
            tailFin(f, 'round', 0.3, red, { edge: cream }); }
          else if (P === 'betta' || P === 'firebetta') { const big = P === 'firebetta', c1 = big ? '#ff6a2a' : hexMix('#c83a5a', bd, 0.3), c2 = big ? '#ffd25a' : '#8a3ac8';
            const f = fish({ L: 0.8, cy: 0.62, w: 0.12, h: 0.18, c: c1, belly: hexMix(c1, '#ffffff', 0.2) }); eyesAt(f, 0.2, 0.065, { brow: big ? dk : null }); mouthAt(f, 0.06);
            const flow = (base, dir, len, n, spread) => { for (let i = 0; i < n; i++) { const a = (i / (n - 1) - 0.5) * spread; const tip = [base[0] + dir[0] * len, base[1] + dir[1] * len + Math.sin(a) * len * 0.7, base[2] + dir[2] * len + Math.cos(a) * 0.1]; plate([base, tip, [tip[0], tip[1] - 0.12, tip[2] + 0.1]], 0.012, i % 2 ? c1 : c2, { emis: big }); } };
            dorsal(f, 0.35, 0.95, big ? 0.5 : 0.36, c2, { emis: big }); belowFin(f, 0.4, 0.95, big ? 0.6 : 0.42, c1, { emis: big });
            B(6, 'tailfin', [0, f.tail[1], f.tail[2] + 0.04]); flow([0, f.tail[1], f.tail[2] + 0.04], [0, 0, -1], big ? 0.9 : 0.6, 9, 2.4); bone = 0;
            if (big) { for (const sd of [-1, 1]) curl([sd * 0.06, f.cy + 0.14, 0.26], [sd * 0.4, 1, -0.6], 0.3, 0.03, '#ffd25a', [0, 0, -0.4], { emis: true }); for (let i = 0; i < 3; i++) { const a = (i - 1) * 0.5; plate([[0, f.cy - 0.12, 0.24], [Math.sin(a) * 0.2, f.cy - 0.36, 0.3], [Math.sin(a) * 0.2 + 0.06, f.cy - 0.3, 0.32]], 0.012, '#ffd25a', { emis: true }); } } }
          else if (P === 'fireclown') { const orange = '#ff7a2a', white = '#fbfaf6'; const f = fish({ L: 0.9, cy: 0.55, w: 0.16, h: 0.26, c: orange, belly: orange, shade: (p, nx, ny, nz, t) => (Math.abs(t - 0.2) < 0.05 || Math.abs(t - 0.52) < 0.06 || Math.abs(t - 0.86) < 0.04) ? white : (Math.abs(t - 0.14) < 0.02 || Math.abs(t - 0.27) < 0.02 || Math.abs(t - 0.45) < 0.02 || Math.abs(t - 0.6) < 0.02) ? '#20242e' : null });
            eyesAt(f, 0.15, 0.07); mouthAt(f, 0.05); dorsal(f, 0.3, 0.8, 0.2, orange, { edge: '#20242e' }); pects(f, 0.3, 0.16, orange, { edge: '#20242e' }); tailFin(f, 'round', 0.3, orange, { edge: '#20242e' });
            for (let i = 0; i < 5; i++) cone([0, 0.84 - Math.abs(i - 2) * 0.02, 0.3 - i * 0.12], [0, 1, -0.4], 0.16 + (i === 2) * 0.06, 0.03, i % 2 ? '#ffd25a' : '#ff4a1a', { emis: true }); }

          // ======== TIDE ========
          else if (P === 'minnow') fry(hexMix(bd, '#a8c8e8', 0.4), { fin: hexMix(ac, '#ffffff', 0.3), L: 0.85, h: 0.13, w: 0.1, tail: 'fork', tailS: 0.2, eyeR: 0.055, eyeT: 0.15, shade: (p, nx, ny, nz, t) => Math.abs(nx) > 0.8 && Math.abs(ny) < 0.25 ? '#e8eef6' : null });
          else if (P === 'reefshark' || P === 'megalodon') { const big = P === 'megalodon', grey = big ? hexMix(bd, '#20283a', 0.7) : hexMix(bd, '#6a7a8a', 0.5), white = '#f2f4f6';
            const f = fish({ L: big ? 2.0 : 1.4, cy: 0.6, w: big ? 0.3 : 0.2, h: big ? 0.34 : 0.24, c: grey, belly: white, prof: (t) => Math.pow(Math.sin(Math.min(1, 0.1 + t * 0.95) * Math.PI), 0.55) * (1 - t * 0.7) });
            eyesAt(f, 0.14, big ? 0.06 : 0.05, { brow: big ? '#0a0e18' : null, col: big ? '#e83a3a' : null, glow: big }); mouthAt(f, 0.08, { teeth: big ? 0 : 5, toothL: 0.05, frown: true });
            if (big) { const a = f.at(0.06); blob(-a.w * 0.9, a.p[1] - a.h - 0.22, a.p[2] - 0.3, a.w * 0.9, a.p[1] - a.h * 0.4, a.p[2] + 0.04, 0.8, grey, { under: white }); blob(-a.w * 0.8, a.p[1] - a.h * 0.9, a.p[2] - 0.28, a.w * 0.8, a.p[1] - a.h * 0.3, a.p[2] + 0.02, 0.8, '#3a0a14'); for (let i = 0; i < 9; i++) { const u = i / 8 - 0.5; cone([u * a.w * 1.6, a.p[1] - a.h * 0.3, a.p[2] - 0.02 - Math.abs(u) * 0.2], [0, -1, 0.2], 0.14, 0.03, white); cone([u * a.w * 1.5, a.p[1] - a.h * 0.9, a.p[2] - 0.04 - Math.abs(u) * 0.2], [0, 1, 0.2], 0.12, 0.028, white); } for (let i = 0; i < 6; i++) { const b = f.at(0.2 + i * 0.1); blob(-0.08, b.p[1] + b.h * 0.7, b.p[2] - 0.08, 0.08, b.p[1] + b.h + 0.06, b.p[2] + 0.08, 0.4, '#3a4458', { n: 1 }); } for (const [t, sd] of [[0.3, 1], [0.42, -1], [0.55, 1]]) { const b = f.at(t); tube([[sd * b.w * 0.98, b.p[1] + b.h * 0.4, b.p[2] + 0.08], [sd * b.w * 0.98, b.p[1] - b.h * 0.2, b.p[2] - 0.1]], [0.012, 0.012], '#c8ccd4', { cap0: 'round', cap1: 'round' }); } }
            dorsal(f, 0.32, 0.5, big ? 0.56 : 0.4, grey, { shape: (u) => u < 0.6 ? u / 0.6 : (1 - u) * 1.5 }); for (const sd of [-1, 1]) { const a = f.at(0.32); plate([[sd * a.w * 0.9, a.p[1] - a.h * 0.5, a.p[2]], [sd * (a.w + (big ? 0.6 : 0.4)), a.p[1] - a.h - 0.1, a.p[2] - 0.3], [sd * a.w * 0.9, a.p[1] - a.h * 0.5, a.p[2] - 0.24]], 0.025, grey); }
            for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const a = f.at(0.24 + i * 0.03); tube([[sd * a.w * 0.98, a.p[1] + a.h * 0.1, a.p[2]], [sd * a.w * 0.98, a.p[1] - a.h * 0.4, a.p[2] - 0.02]], [0.008, 0.008], hexMix(grey, dk, 0.5), { cap0: 'none', cap1: 'none' }); }
            tailFin(f, 'shark', big ? 0.6 : 0.42, grey); if (big) { for (let i = 0; i < 4; i++) { const a = f.at(0.5 + i * 0.1); blob(-0.04, a.p[1] - 0.04, a.p[2] - 0.04, 0.04, a.p[1] + 0.04, a.p[2] + 0.04, 0.5, glw, { n: 1 }); } for (let i = 0; i < 3; i++) { const a = f.at(0.2 + i * 0.2); for (const sd of [-1, 1]) tube([[sd * a.w, a.p[1] + a.h * 0.6, a.p[2]], [sd * a.w * 0.9, a.p[1] + a.h * 0.2, a.p[2] - 0.14]], [0.012, 0.012], '#c8c0b0', { cap0: 'none', cap1: 'none' }); } } }
          else if (P === 'seahorse' || P === 'greatseahorse') { const big = P === 'greatseahorse', k = big ? 1.5 : 1, c = big ? hexMix(bd, '#e8a03a', 0.4) : bd; hover = 0.1;
            const pts = [], rr = []; for (let i = 0; i <= 12; i++) { const t = i / 12; const a = t * Math.PI * 1.6; pts.push([0, (0.9 - t * 0.6 + (t > 0.6 ? -Math.sin((t - 0.6) * 6) * 0.08 : 0)) * k, (Math.sin(a) * 0.12 - t * 0.04) * k]); rr.push(0.14 * k * (t < 0.15 ? 0.8 + t : 1 - t * 0.88)); }
            tube(pts, rr, c, { cap0: 'round', cap1: 'none', shade: (p, nx, ny, nz, t) => rgb(Math.floor(t * 24) % 2 && nz > 0 ? hexMix(c, '#ffffff', 0.3) : c) });
            B(6, 'tailfin', pts[12]); const tl = []; for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI * 1.5; tl.push([0, pts[12][1] - 0.04 * k - Math.sin(a) * 0.1 * k, pts[12][2] - 0.04 * k + Math.cos(a) * 0.1 * k - 0.1 * k]); } tube(tl, tl.map((_, i) => 0.03 * k * (1 - i / 9)), c, { cap0: 'none', cap1: 'round' }); bone = 0;
            B(1, 'head', [0, 1.0 * k, 0]); ball(0, 1.02 * k, 0.04, 0.12 * k, c, { n: 3 }); tube([[0, 0.98 * k, 0.12 * k], [0, 0.96 * k, 0.32 * k]], [0.045 * k, 0.03 * k], c, { cap0: 'none', cap1: 'flat' }); look(0.08 * k, 1.04 * k, 0.06 * k, 0.04 * k, { brow: big ? dk : null });
            for (let i = 0; i < (big ? 5 : 3); i++) cone([0, 1.12 * k, 0.02 - i * 0.04], [(i - 2) * 0.1, 1, -0.3], 0.12 * k, 0.025 * k, big ? '#ffd25a' : ac); bone = 0;
            plate([[0, 0.78 * k, -0.08 * k], [0, 0.82 * k, -0.24 * k], [0, 0.62 * k, -0.2 * k]], 0.015, ac); if (big) { for (const sd of [-1, 1]) { plate([[sd * 0.12, 0.8 * k, 0.04], [sd * 0.5, 0.96 * k, -0.04], [sd * 0.4, 0.66 * k, -0.06]], 0.02, '#ffd25a', { edge: ac }); } hring(0, 0.66 * k, 0.04, 0.14 * k, 0.02, '#ffd25a'); } }
          else if (P === 'mantaray') { const dark = '#2a3040', white = '#f2f4f6'; B(1, 'head', [0, 0.5, 0.4]); bone = 0; hover = 0.25;
            blob(-0.34, 0.4, -0.5, 0.34, 0.62, 0.5, 1, dark, { under: white });
            for (const sd of [-1, 1]) { B(sd < 0 ? 7 : 8, 'wing', [sd * 0.3, 0.52, 0], { side: sd, fold: 0 }); plate([[sd * 0.3, 0.56, 0.4], [sd * 1.2, 0.6, -0.1], [sd * 1.0, 0.54, -0.32], [sd * 0.3, 0.52, -0.42]], 0.03, dark); plate([[sd * 0.3, 0.5, 0.4], [sd * 0.3, 0.5, -0.42], [sd * 1.0, 0.52, -0.32], [sd * 1.2, 0.56, -0.1]], 0.03, white); bone = 0; tube([[sd * 0.2, 0.5, 0.46], [sd * 0.24, 0.42, 0.66], [sd * 0.18, 0.36, 0.7]], [0.05, 0.04, 0.03], dark, { cap0: 'none', cap1: 'round' }); }
            look(0.3, 0.56, 0.36, 0.05); for (let i = 0; i < 4; i++) ball((i - 1.5) * 0.12, 0.62, 0.1 - Math.abs(i - 1.5) * 0.06, 0.03, glw, { emis: true, n: 1 }); B(6, 'tailfin', [0, 0.5, -0.5]); tube([[0, 0.5, -0.5], [0, 0.5, -1.2]], [0.03, 0.006], dark, { cap0: 'none', cap1: 'none' }); bone = 0; }

          // ======== BLOOM ========
          else if (P === 'algaefry') fry(hexMix(bd, '#7ac85a', 0.4), { fin: '#5fae4a', L: 0.7, h: 0.2, w: 0.18, prof: (t) => t < 0.35 ? 1 : Math.max(0.12, 1 - (t - 0.35) * 1.6), tail: 'flow', tailS: 0.18, dorsal: false, after: () => plate([[0, 0.62, 0.1], [-0.08, 0.76, 0.04], [0, 0.82, 0.0], [0.08, 0.74, 0.04]], 0.015, '#5fae4a') });
          else if (P === 'koi' || P === 'lotuskoi') { const big = P === 'lotuskoi', white = '#fbfaf6', red = '#e8503a', gold = '#ffd25a';
            const f = fish({ L: big ? 1.8 : 1.1, cy: 0.6, w: big ? 0.2 : 0.16, h: big ? 0.22 : 0.22, c: white, belly: white, shade: (p, nx, ny, nz, t) => (ny > 0 && (Math.sin(t * 14 + nx * 3) > 0.3)) ? red : (ny > 0.5 && Math.sin(t * 9 - 1) > 0.7) ? '#20242e' : null, prof: big ? (t) => (t < 0.1 ? 0.6 + t * 4 : 1 - t * 0.65) : null });
            eyesAt(f, 0.12, big ? 0.06 : 0.055, { brow: big ? '#c8902a' : null, col: big ? gold : null, glow: big }); mouthAt(f, 0.04);
            for (const sd of [-1, 1]) { const a = f.at(0.04); curl([sd * a.w * 0.6, a.p[1] - a.h * 0.4, a.p[2]], [sd * 0.4, -0.4, 1], big ? 0.4 : 0.14, 0.012, big ? gold : red, [sd * 0.6, -0.2, -0.6], { emis: big }); }
            pects(f, 0.25, big ? 0.2 : 0.16, white, { edge: red });
            if (!big) { dorsal(f, 0.3, 0.7, 0.14, white, { edge: red }); tailFin(f, 'fork', 0.3, white, { edge: red }); }
            else { for (let i = 0; i < 9; i++) { const a = f.at(0.15 + i * 0.08); cone([0, a.p[1] + a.h * 0.8, a.p[2]], [0, 1, -0.4], 0.16 - i * 0.008, 0.035, gold, { emis: true }); } // a koi that has climbed the falls: a dragon's whiskers, horns and mane, lotus petals for fins
              B(1, 'head', [0, 0.6, 0.6]); for (const sd of [-1, 1]) curl([sd * 0.08, 0.76, 0.66], [sd * 0.3, 1, -0.8], 0.4, 0.04, gold, [0, 0, -0.4]); bone = 0;
              for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const a = (i / 3 - 0.5) * 1.4, b0 = [sd * 0.18, 0.5, 0.36]; plate([b0, [sd * (0.3 + Math.cos(a) * 0.3), 0.5 - Math.sin(a) * 0.2, 0.26 - Math.sin(a) * 0.2], [sd * (0.24 + Math.cos(a + 0.3) * 0.24), 0.5 - Math.sin(a + 0.3) * 0.16, 0.28 - Math.sin(a + 0.3) * 0.16]], 0.015, i % 2 ? '#f4a3d2' : '#ffd8ec'); }
              B(6, 'tailfin', [0, f.tail[1], f.tail[2] + 0.04]); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; plate([[0, f.tail[1], f.tail[2]], [Math.cos(a) * 0.2, f.tail[1] + Math.sin(a) * 0.3, f.tail[2] - 0.34], [Math.cos(a + 0.4) * 0.14, f.tail[1] + Math.sin(a + 0.4) * 0.22, f.tail[2] - 0.24]], 0.015, i % 2 ? '#f4a3d2' : '#ffd8ec'); } ball(0, f.tail[1], f.tail[2] - 0.06, 0.06, gold, { emis: true, n: 2 }); bone = 0; } }
          else if (P === 'seadragonfry' || P === 'leafyseadragon') { const big = P === 'leafyseadragon', c = hexMix(bd, '#c8a050', 0.4), leaf = hexMix('#7ac85a', ac, 0.3); hover = 0.15;
            const f = fish({ L: big ? 1.3 : 0.8, cy: 0.6, w: 0.07, h: 0.09, c, prof: (t) => (t < 0.25 ? 0.5 : 1 - (t - 0.25)) * 1, dip: (t) => Math.sin(t * Math.PI * 1.4) * 0.1 }); eyesAt(f, 0.26, 0.04);
            const a = f.at(0); tube([[0, a.p[1], a.p[2]], [0, a.p[1] - 0.02, a.p[2] + 0.2]], [0.03, 0.02], c, { cap0: 'none', cap1: 'flat' });
            for (let i = 0; i < (big ? 9 : 4); i++) { const b = f.at(0.2 + i * (big ? 0.08 : 0.16)), up = i % 2 ? 1 : -1; for (let k = 0; k < (big ? 3 : 1); k++) { const ang = (k - 1) * 0.6; plate([[0, b.p[1] + up * b.h, b.p[2]], [Math.sin(ang) * 0.24, b.p[1] + up * (b.h + (big ? 0.34 : 0.18)), b.p[2] - 0.06 + Math.cos(ang) * 0.06], [Math.sin(ang) * 0.12, b.p[1] + up * (b.h + (big ? 0.16 : 0.1)), b.p[2] + 0.06]], 0.015, k % 2 ? leaf : hexMix(leaf, '#2e6b2a', 0.3)); } }
            tailFin(f, 'round', 0.12, leaf); }
          else if (P === 'flowerhorn') { const c = hexMix(bd, '#e85a7a', 0.4); const f = fish({ L: 1.1, cy: 0.6, w: 0.2, h: 0.32, c, belly: hexMix(c, '#f2d23a', 0.4), shade: (p, nx, ny, nz, t) => (Math.abs(nx) > 0.6 && Math.floor(t * 10) % 3 === 1 && ny > -0.2) ? '#20242e' : null });
            const a = f.at(0.12); blob(-0.16, a.p[1] + a.h * 0.4, a.p[2] - 0.16, 0.16, a.p[1] + a.h + 0.3, a.p[2] + 0.12, 1, c); for (let i = 0; i < 6; i++) { const q = i / 6 * Math.PI * 2; plate([[0, a.p[1] + a.h + 0.24, a.p[2]], [Math.cos(q) * 0.16, a.p[1] + a.h + 0.3 + Math.sin(q) * 0.16, a.p[2] + 0.06], [Math.cos(q + 0.5) * 0.12, a.p[1] + a.h + 0.3 + Math.sin(q + 0.5) * 0.12, a.p[2] + 0.06]], 0.015, i % 2 ? '#f4a3d2' : '#ffd8ec'); } ball(0, a.p[1] + a.h + 0.3, a.p[2] + 0.08, 0.05, '#ffe08a', { emis: true, n: 1 });
            eyesAt(f, 0.18, 0.06, { brow: dk, col: '#e8503a' }); mouthAt(f, 0.05, { frown: true }); dorsal(f, 0.3, 0.9, 0.26, c, { edge: '#5fae4a' }); belowFin(f, 0.55, 0.9, 0.22, c, { edge: '#5fae4a' }); pects(f, 0.3, 0.16, '#5fae4a'); tailFin(f, 'round', 0.34, c, { edge: '#5fae4a' }); }

          // ======== STONE ========
          else if (P === 'stonefry') fry(hexMix(bd, '#8a847a', 0.5), { fin: '#6a6470', cy: 0.3, w: 0.22, h: 0.13, frown: true, eyeR: 0.06, pect: 0.2, after: (f) => { for (let i = 0; i < 7; i++) { const a = f.at(0.2 + (i * 0.618 % 1) * 0.5), ang = (i * 2.4) % 2 - 1; ball(ang * a.w * 0.8, a.p[1] + a.h * 0.8, a.p[2], 0.035, '#5a544e', { n: 1 }); } } });
          else if (P === 'stonefish' || P === 'reeftitan') { const big = P === 'reeftitan', rock = hexMix(bd, '#7a7470', 0.5), rock2 = hexMix(rock, '#3a3438', 0.4);
            const f = fish({ L: big ? 1.6 : 1.0, cy: big ? 0.6 : 0.45, w: big ? 0.36 : 0.24, h: big ? 0.34 : 0.22, c: rock, belly: rock2, prof: (t) => Math.pow(Math.sin(Math.min(1, 0.2 + t * 0.85) * Math.PI), 0.5) * (1 - t * 0.6), shade: (p, nx, ny, nz, t) => (Math.sin(p[0] * 30) + Math.sin(p[2] * 24) > 1.2) ? rock2 : null });
            for (let i = 0; i < (big ? 18 : 10); i++) { const t = 0.15 + (i * 0.618 % 1) * 0.6, a = f.at(t), ang = (i * 2.4) % 3 - 1.5; blob(Math.sin(ang) * a.w - 0.05, a.p[1] + Math.cos(ang) * a.h * 0.8 - 0.04, a.p[2] - 0.05, Math.sin(ang) * a.w + 0.05, a.p[1] + Math.cos(ang) * a.h * 0.8 + 0.06, a.p[2] + 0.05, 0.4, i % 3 ? rock2 : '#5f8a3a', { n: 1 }); }
            eyesAt(f, 0.18, big ? 0.06 : 0.05, { brow: rock2, col: big ? glw : '#e8a03a', glow: big }); mouthAt(f, 0.04, { frown: true, low: 0.1, teeth: big ? 8 : 0, toothL: 0.08 });
            for (let i = 0; i < (big ? 8 : 5); i++) { const a = f.at(0.25 + i * 0.07); cone([0, a.p[1] + a.h * 0.8, a.p[2]], [0, 1, -0.2], (big ? 0.26 : 0.16), 0.03, big ? glw : rock2, { emis: big, segs: big ? 4 : 6 }); }
            pects(f, 0.3, big ? 0.3 : 0.2, rock2, { out: 1, down: 0.5 }); tailFin(f, 'round', big ? 0.4 : 0.26, rock2);
            if (big) { const a = f.at(0.4); for (const [x, z, h, c] of [[0.1, 0.1, 0.3, '#e85a7a'], [-0.12, -0.1, 0.26, '#f2a23a'], [0.0, -0.3, 0.34, '#9a6ad8']]) { for (let k = 0; k < 3; k++) tube([[x, a.p[1] + a.h * 0.8, a.p[2] + z], [x + (k - 1) * 0.1, a.p[1] + a.h + h, a.p[2] + z + (k - 1) * 0.04]], [0.03, 0.015], c, { cap0: 'none', cap1: 'round' }); } } }
          else if (P === 'armorcatfish') { const c = hexMix(bd, '#6a5a4a', 0.5); const f = fish({ L: 1.2, cy: 0.4, w: 0.24, h: 0.18, c, belly: hexMix(c, '#c8b48a', 0.4), dip: (t) => -t * 0.04, shade: (p, nx, ny, nz, t) => (Math.sin(p[2] * 30) * Math.sin(p[0] * 30) > 0.5) ? '#f2d27a' : null });
            for (let i = 0; i < 6; i++) { const a = f.at(0.2 + i * 0.1); for (const sd of [-1, 1]) blob(sd * a.w * 0.6 - 0.07, a.p[1] - 0.02, a.p[2] - 0.06, sd * a.w * 0.6 + 0.07, a.p[1] + a.h * 0.9, a.p[2] + 0.06, 0.4, hexMix(c, '#3a3230', 0.3), { n: 1 }); }
            const a = f.at(0.06); ball(0, a.p[1] - a.h * 0.6, a.p[2] + 0.04, 0.08, hexMix(c, '#3a3230', 0.4), { n: 2 }); eyesAt(f, 0.16, 0.05, { col: '#e8a03a' }); for (const sd of [-1, 1]) curl([sd * 0.08, a.p[1] - a.h * 0.4, a.p[2]], [sd * 0.5, -0.2, 0.6], 0.24, 0.014, c, [sd * 0.3, -0.3, -0.4]);
            dorsal(f, 0.25, 0.45, 0.4, c, { spines: '#f2d27a', shape: (u) => u < 0.3 ? u / 0.3 : 1 - (u - 0.3) * 0.6 }); pects(f, 0.22, 0.26, c, { out: 1.1, down: 0.4, edge: '#f2d27a' }); tailFin(f, 'fork', 0.32, c, { edge: '#f2d27a' }); }

          // ======== GALE ========
          else if (P === 'flyfry') { // a fry riding inside a bubble of air, fins folded like leaves, a little whirl of wind on top
            const f = fry(hexMix(bd, '#a8c8e8', 0.3), { fin: '#f4f8ff', L: 0.5, h: 0.13, w: 0.1, cy: 0.5, tail: 'fork', dorsal: false, pect: 0.2, eyeR: 0.06 });
            hring(0, 0.5, 0.0, 0.46, 0.028, '#bfe8ff', { emis: true }); ring(0, 0.5, 0.0, 0.46, 0.46, 0.028, '#bfe8ff', { emis: true }); ring(0, 0.5, 0.0, 0.46, 0.2, 0.02, '#ffffff', { emis: true }); for (let i = 0; i < 6; i++) { const a = i * 1.05; ball(Math.cos(a) * 0.62, 0.5 + Math.sin(a * 1.7) * 0.3, Math.sin(a) * 0.3, 0.05 - (i % 3) * 0.012, '#eaf8ff', { n: 2 }); } ball(-0.2, 0.72, 0.3, 0.05, '#ffffff', { emis: true, n: 1 });
            curl([0, 0.96, 0], [0.2, 1, 0], 0.22, 0.025, '#7ac8ff', [-1.2, -0.2, 0.6]); for (let i = 0; i < 3; i++) ball(0.4 + i * 0.06, 0.3 + i * 0.12, -0.1, 0.03 - i * 0.006, '#eaf8ff', { n: 1 }); hover = 0.3; }
          else if (P === 'flyingfish') { // a flying fish whose four fins are kites: diamond-panelled, with ribbon tails and bows trailing behind
            const blue = hexMix(bd, '#2a5ab8', 0.4), k1 = '#f2d23a', k2 = '#e8503a'; const f = fish({ L: 1.0, cy: 0.8, w: 0.12, h: 0.15, c: blue, belly: '#e8eef6' }); eyesAt(f, 0.12, 0.06, { brow: dk }); mouthAt(f, 0.05); hover = 0.5;
            const kite = (sd, t, span, back, up) => { const a = f.at(t), b0 = [sd * a.w, a.p[1] + up, a.p[2]]; const tip = [sd * (a.w + span), a.p[1] + up + span * 0.25, a.p[2] - back * 0.4], tail = [sd * (a.w + span * 0.5), a.p[1] + up, a.p[2] - back], fore = [sd * (a.w + span * 0.45), a.p[1] + up + 0.04, a.p[2] + back * 0.2], mid = [sd * (a.w + span * 0.5), a.p[1] + up + span * 0.08, a.p[2] - back * 0.38];
              plate([b0, fore, mid], 0.015, k1); plate([fore, tip, mid], 0.015, k2); plate([tip, tail, mid], 0.015, k1); plate([tail, b0, mid], 0.015, k2); tube([b0, tip], [0.01, 0.008], '#3a3230', { cap0: 'none', cap1: 'none' }); tube([fore, tail], [0.01, 0.008], '#3a3230', { cap0: 'none', cap1: 'none' });
              const rib = [tail]; for (let i = 1; i <= 6; i++) rib.push([tail[0] + sd * Math.sin(i) * 0.04, tail[1] - i * 0.04, tail[2] - i * 0.1]); tube(rib, rib.map(() => 0.008), '#3a3230', { cap0: 'none', cap1: 'none' }); for (let i = 2; i < 7; i += 2) plate([[rib[i][0] - 0.05, rib[i][1] + 0.03, rib[i][2]], [rib[i][0] + 0.05, rib[i][1] - 0.03, rib[i][2]], [rib[i][0] + 0.05, rib[i][1] + 0.03, rib[i][2]], [rib[i][0] - 0.05, rib[i][1] - 0.03, rib[i][2]]], 0.012, i % 4 ? k2 : k1); };
            for (const sd of [-1, 1]) { const a = f.at(0.26); B(sd < 0 ? 7 : 8, 'wing', [sd * a.w, a.p[1], a.p[2]], { side: sd, fold: 0 }); kite(sd, 0.26, 0.7, 0.5, 0.04); bone = 0; kite(sd, 0.62, 0.36, 0.3, -0.04); }
            tailFin(f, 'fork', 0.34, blue, { edge: k1 }); }
          else if (P === 'cloudmanta') { // the flyer has learned to ride the storm: a fish-dragon bursting out of the top of a spinning waterspout, spray flying off it
            const sea = '#5ab8e8', foam = '#eaf8ff', blue = hexMix(bd, '#2a5ab8', 0.4); hover = 0.05;
            B(6, 'spin', [0, 0.6, 0], { speed: 2.2 }); for (let i = 0; i < 9; i++) { const r = 0.42 - i * 0.03 + (i > 6 ? (i - 6) * 0.08 : 0); hring(Math.sin(i * 0.8) * 0.03, 0.06 + i * 0.13, 0, r, 0.05, i % 2 ? sea : foam, { emis: i % 2 === 0 }); }
            for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 14; i++) { const u = i / 14, a = u * 10 + k * 2.1, rr = 0.38 - u * 0.2 + (u > 0.7 ? (u - 0.7) * 0.6 : 0); pts.push([Math.cos(a) * rr, 0.06 + u * 1.1, Math.sin(a) * rr]); } tube(pts, pts.map(() => 0.025), '#ffffff', { emis: true, cap0: 'round', cap1: 'round' }); } bone = 0;
            const f = fish({ L: 1.2, cy: 1.4, z0: 0.6, w: 0.16, h: 0.2, c: blue, belly: '#e8eef6', dip: (t) => -t * t * 0.5 });
            eyesAt(f, 0.12, 0.06, { brow: dk, col: '#7ae8ff', glow: true }); mouthAt(f, 0.05, { teeth: 6, toothL: 0.05 });
            for (const sd of [-1, 1]) { const a = f.at(0.1); curl([sd * 0.08, a.p[1] + a.h * 0.6, a.p[2]], [sd * 0.3, 1, -1], 0.3, 0.03, foam, [0, 0, -0.6]); }
            for (const sd of [-1, 1]) { const a = f.at(0.28); B(sd < 0 ? 7 : 8, 'wing', [sd * a.w, a.p[1], a.p[2]], { side: sd, fold: 0 }); for (let i = 0; i < 5; i++) plate([[sd * a.w, a.p[1], a.p[2] - i * 0.04], [sd * (a.w + 0.7 - i * 0.08), a.p[1] + 0.34 - i * 0.1, a.p[2] - 0.2 - i * 0.06], [sd * (a.w + 0.6 - i * 0.08), a.p[1] + 0.24 - i * 0.1, a.p[2] - 0.26 - i * 0.06]], 0.015, i % 2 ? foam : sea, { emis: i % 2 === 0 }); bone = 0; }
            dorsal(f, 0.15, 0.6, 0.22, foam, { edge: sea }); for (let i = 0; i < 10; i++) { const a = i * 0.63; ball(Math.cos(a) * 0.7, 0.3 + (i % 4) * 0.35, Math.sin(a) * 0.6, 0.03, foam, { emis: true, n: 1 }); } }
          else if (P === 'sailfry' || P === 'sailfish') { // a fry with a sail on a mast; grown, a galleon of a fish: two masts, square sails, a crow's nest, a bowsprit for a bill
            const big = P === 'sailfish', blue = hexMix(bd, '#2a4a9a', 0.5), silver = '#e8eef6', canvas = '#f4ecd8', wood = '#8a6a42', gold = '#e2b84a';
            const f = fish({ L: big ? 1.6 : 0.7, cy: big ? 0.55 : 0.45, w: big ? 0.18 : 0.12, h: big ? 0.22 : 0.17, c: blue, belly: silver });
            eyesAt(f, 0.14, big ? 0.05 : 0.06); const a = f.at(0); tube([[0, a.p[1], a.p[2]], [0, a.p[1] + (big ? 0.1 : 0.04), a.p[2] + (big ? 0.6 : 0.16)]], [0.03, 0.008], big ? wood : blue, { cap0: 'none', cap1: 'none' });
            const mast = (t, h, w) => { const b = f.at(t), base = [0, b.p[1] + b.h * 0.8, b.p[2]], top = [0, base[1] + h, base[2]]; tube([base, top], [0.025, 0.018], wood, { cap0: 'none', cap1: 'none' }); for (let r = 0; r < (big ? 2 : 1); r++) { const y0 = base[1] + h * (0.2 + r * 0.42), y1 = y0 + h * 0.36; tube([[-w, y1, top[2]], [w, y1, top[2]]], [0.012, 0.012], wood, { cap0: 'none', cap1: 'none' }); plate([[-w, y1, top[2] + 0.01], [w, y1, top[2] + 0.01], [w * 0.95, y0, top[2] + 0.06], [-w * 0.95, y0, top[2] + 0.06]], 0.015, canvas, { edge: big ? '#c8302a' : blue }); } return top; };
            if (!big) { const tp = mast(0.4, 0.42, 0.12); plate([[0, tp[1], tp[2]], [0.02, tp[1] - 0.04, tp[2] - 0.12], [0, tp[1] - 0.08, tp[2]]], 0.01, '#e8503a'); }
            else { const t1 = mast(0.3, 0.8, 0.26), t2 = mast(0.58, 0.62, 0.2); hring(0, t1[1] - 0.06, t1[2], 0.08, 0.015, wood); plate([[0, t1[1] + 0.02, t1[2]], [0.02, t1[1] - 0.04, t1[2] - 0.22], [0, t1[1] - 0.1, t1[2]]], 0.01, '#c8302a'); tube([[0, a.p[1] + 0.1, a.p[2] + 0.6], t1], [0.005, 0.005], '#c8b48a', { cap0: 'none', cap1: 'none' }); tube([t1, t2], [0.005, 0.005], '#c8b48a', { cap0: 'none', cap1: 'none' });
              for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const b = f.at(0.3 + i * 0.14); ring(sd * b.w * 0.98, b.p[1], b.p[2], 0.04, 0.04, 0.012, gold); ball(sd * b.w * 0.98, b.p[1], b.p[2], 0.03, '#fff3b0', { emis: true, n: 1 }); } }
            pects(f, 0.25, 0.18, blue); tailFin(f, 'lunate', big ? 0.4 : 0.24, blue, { edge: big ? gold : null }); }
          else if (P === 'armorfry') { // a fossil that woke up: a fish skeleton of stone, ribs and spine, a glow where its eye used to be
            const bone2 = '#e8dcc0', stone = hexMix(bd, '#8a847a', 0.5); const sp = []; for (let i = 0; i <= 8; i++) sp.push([0, 0.5 + Math.sin(i * 0.5) * 0.02, 0.18 - i * 0.09]); tube(sp, sp.map((_, i) => 0.04 * (1 - i / 10)), bone2, { cap0: 'none', cap1: 'round' });
            for (let i = 1; i < 6; i++) { const p = sp[i], h = 0.16 * (1 - i * 0.12); for (const sd of [-1, 1]) tube([[0, p[1], p[2]], [sd * h * 0.7, p[1] + h * 0.3, p[2] - 0.02], [sd * h * 0.6, p[1] - h * 0.8, p[2] - 0.04]], [0.022, 0.02, 0.014], bone2, { cap0: 'none', cap1: 'round' }); cone([0, p[1], p[2]], [0, 1, -0.2], h * 0.9, 0.02, bone2); }
            B(1, 'head', [0, 0.5, 0.2]); blob(-0.08, 0.42, 0.16, 0.08, 0.6, 0.38, 0.7, bone2, { under: stone }); for (const sd of [-1, 1]) { ball(sd * 0.07, 0.54, 0.28, 0.04, '#2a2420', { n: 2 }); ball(sd * 0.085, 0.54, 0.29, 0.022, '#ffb02a', { emis: true, n: 1 }); } for (let i = 0; i < 4; i++) cone([(i - 1.5) * 0.04, 0.44, 0.4], [0, 1, 0.3], 0.04, 0.01, bone2); bone = 0;
            B(6, 'tailfin', sp[8]); for (let i = 0; i < 4; i++) { const a = (i / 3 - 0.5) * 1.4; tube([sp[8], [0, sp[8][1] + Math.sin(a) * 0.2, sp[8][2] - 0.16]], [0.012, 0.006], bone2, { cap0: 'none', cap1: 'round' }); } bone = 0;
            for (const [x, y, z] of [[0.08, 0.6, -0.1], [-0.06, 0.4, -0.28], [0.04, 0.66, 0.04]]) blob(x - 0.04, y - 0.03, z - 0.04, x + 0.04, y + 0.03, z + 0.04, 0.4, stone, { n: 1 }); }
          else if (P === 'coelacanth') { // a living fossil: the front of it alive and speckled, the back still stone with the ribs showing, walking the seabed on lobed fins
            const blue = hexMix(bd, '#3a5a8a', 0.5), spot = '#e8eef6', stone = '#8a847a', bone2 = '#e8dcc0', amber = '#ffb02a'; hover = 0.0;
            const f = fish({ L: 1.6, cy: 0.62, w: 0.24, h: 0.3, c: blue, belly: hexMix(blue, '#ffffff', 0.2), shade: (p, nx, ny, nz, t) => t > 0.55 ? (Math.floor(t * 30) % 3 === 0 ? bone2 : stone) : (Math.sin(p[2] * 21 + p[1] * 13) > 0.93) ? spot : null });
            eyesAt(f, 0.14, 0.065, { brow: dk, col: amber, glow: true }); mouthAt(f, 0.04, { frown: true });
            for (const sd of [-1, 1]) { const b = f.at(0.2); for (let i = 0; i < 3; i++) { const c = [sd * (b.w + 0.01), b.p[1] + 0.06, b.p[2] - 0.1 - i * 0.06]; const pts = []; for (let j = 0; j <= 10; j++) { const q = j / 10 * Math.PI * 3, r = 0.1 * (1 - j / 12); pts.push([c[0], c[1] + Math.sin(q) * r, c[2] + Math.cos(q) * r]); } if (i === 1) tube(pts, pts.map((_, j) => 0.02 * (1 - j / 12)), '#c8a070', { cap0: 'round', cap1: 'round' }); } } // an ammonite fossil set in each shoulder
            const lobe = (t, sd, bi, ph) => { const a = f.at(t); const b0 = [sd * a.w * 0.9, a.p[1] - a.h * 0.5, a.p[2]]; B(bi, 'leg', b0, { phase: ph, len: b0[1] }); const knee = [sd * (a.w + 0.18), b0[1] - 0.14, b0[2] + 0.06], foot = [sd * (a.w + 0.22), 0.04, b0[2] + 0.1]; tube([b0, knee, foot], [0.06, 0.05, 0.035], blue, { cap0: 'round', cap1: 'none' }); plate([[foot[0] - 0.1, 0.02, foot[2] - 0.06], [foot[0] + 0.1, 0.02, foot[2] - 0.06], [foot[0] + 0.06, 0.02, foot[2] + 0.12], [foot[0] - 0.06, 0.02, foot[2] + 0.12]], 0.02, hexMix(blue, '#ffffff', 0.25)); bone = 0; };
            lobe(0.3, -1, 2, 0); lobe(0.3, 1, 3, Math.PI); lobe(0.52, -1, 4, Math.PI); lobe(0.52, 1, 5, 0); legLen = 0.4;
            dorsal(f, 0.22, 0.4, 0.24, hexMix(blue, '#ffffff', 0.25), { spines: blue });
            for (let i = 0; i < 5; i++) { const b = f.at(0.6 + i * 0.07); for (const sd of [-1, 1]) tube([[sd * b.w * 0.98, b.p[1] + b.h * 0.6, b.p[2]], [sd * b.w * 1.02, b.p[1], b.p[2] - 0.02], [sd * b.w * 0.98, b.p[1] - b.h * 0.6, b.p[2]]], [0.015, 0.015, 0.015], bone2, { cap0: 'round', cap1: 'round' }); }
            tailFin(f, 'round', 0.34, stone, { edge: bone2, extra: (x, y, z) => { tube([[0, y, z], [0, y, z - 0.3]], [0.04, 0.02], stone, { cap0: 'none', cap1: 'round' }); plate([[0, y, z - 0.3], [0, y + 0.12, z - 0.44], [0, y - 0.12, z - 0.44]], 0.02, bone2); } });
            for (let i = 0; i < 4; i++) ball(0.06 * (i % 2 ? 1 : -1), 1.0 + i * 0.14, 0.5, 0.025 + i * 0.006, '#eaf8ff', { n: 1 }); }
          else if (P === 'hatchetfish') { const silver = '#e8eef6'; const f = fish({ L: 0.8, cy: 0.62, w: 0.08, h: 0.36, c: silver, belly: silver, dip: (t) => -t * 0.1, prof: (t) => (t < 0.6 ? Math.sin(Math.min(1, 0.2 + t * 1.3) * Math.PI * 0.5) : 1 - (t - 0.6) * 2) * (0.6 + 0.4 * (1 - t)), shade: (p, nx, ny, nz, t) => ny < -0.2 && Math.floor(t * 16) % 2 ? '#7ac8ff' : null });
            eyesAt(f, 0.15, 0.07, { col: '#7ac8ff', glow: true }); mouthAt(f, 0.04, { frown: true }); pects(f, 0.25, 0.5, '#f4f8ff', { out: 1.2, down: -0.3 }); tailFin(f, 'fork', 0.22, silver); for (let i = 0; i < 5; i++) { const b = f.at(0.2 + i * 0.1); ball(0, b.p[1] - b.h * 0.9, b.p[2], 0.025, '#7ac8ff', { emis: true, n: 1 }); } hover = 0.3; }

          // ======== FROST ========
          else if (P === 'charfry') fry(hexMix(bd, '#8a9ab8', 0.5), { fin: '#f4f8ff', L: 0.78, h: 0.16, w: 0.12, tail: 'fork', shade: (p, nx, ny, nz, t) => (Math.abs(nx) > 0.5 && Math.floor(t * 10) % 2 && t > 0.15 && t < 0.8) ? '#5a6a8a' : null, after: () => { for (let i = 0; i < 3; i++) cone([0, 0.56, 0.06 - i * 0.12], [0, 1, -0.3], 0.1, 0.025, '#bfe8ff', { emis: true, segs: 4 }); } });
          else if (P === 'arcticchar' || P === 'frostpike') { const big = P === 'frostpike', olive = hexMix(bd, '#5a7a8a', 0.5), belly = big ? '#e8f4ff' : '#e8703a';
            const f = fish({ L: big ? 1.9 : 1.2, cy: 0.6, w: big ? 0.18 : 0.15, h: big ? 0.22 : 0.22, c: olive, belly, prof: big ? (t) => (t < 0.08 ? 0.5 + t * 6 : 1 - t * 0.55) : null, shade: (p, nx, ny, nz, t) => (Math.sin(p[2] * 26) * Math.sin(p[1] * 30) > 0.7 && ny > -0.2) ? (big ? glw : '#f4d8c0') : null });
            eyesAt(f, big ? 0.09 : 0.14, big ? 0.05 : 0.055, { brow: big ? dk : null, col: big ? glw : null, glow: big }); mouthAt(f, 0.04, { teeth: big ? 10 : 0, toothL: 0.07, frown: big });
            if (big) { const a = f.at(0.0); blob(-0.12, a.p[1] - 0.06, a.p[2] - 0.2, 0.12, a.p[1] + 0.06, a.p[2] + 0.1, 0.8, olive, { under: belly }); for (let i = 0; i < 7; i++) { const b = f.at(0.15 + i * 0.1); cone([0, b.p[1] + b.h * 0.85, b.p[2]], [0, 1, -0.3], 0.22 - i * 0.015, 0.04, glw, { emis: true, segs: 4 }); for (const sd of [-1, 1]) cone([sd * b.w * 0.9, b.p[1], b.p[2]], [sd, 0.2, -0.3], 0.1, 0.025, glw, { emis: true, segs: 4 }); } }
            dorsal(f, big ? 0.62 : 0.32, big ? 0.78 : 0.55, big ? 0.24 : 0.18, olive, { edge: big ? glw : '#f4f8ff' }); pects(f, 0.25, 0.16, belly, { edge: '#f4f8ff' }); belowFin(f, 0.62, 0.78, 0.16, belly, { edge: '#f4f8ff' }); tailFin(f, 'fork', big ? 0.44 : 0.32, olive, { edge: big ? glw : null }); }
          else if (P === 'icefishfry' || P === 'crystalicefish') { const big = P === 'crystalicefish', glass = '#d8f0ff';
            const f = fish({ L: big ? 1.3 : 0.7, cy: 0.6, w: big ? 0.14 : 0.1, h: big ? 0.2 : 0.14, c: glass, belly: '#f4fbff', prof: (t) => (t < 0.2 ? 0.7 + t * 1.5 : 1 - (t - 0.2) * 1.05) });
            const a = f.at(0.04); blob(-0.1, a.p[1] - 0.06, a.p[2] - 0.1, 0.1, a.p[1] + 0.04, a.p[2] + (big ? 0.2 : 0.1), 0.8, glass); eyesAt(f, 0.14, big ? 0.06 : 0.065, { col: '#7ac8ff' });
            for (let i = 0; i < 5; i++) { const b = f.at(0.25 + i * 0.12); tube([[0, b.p[1] - b.h * 0.6, b.p[2]], [0, b.p[1] + b.h * 0.6, b.p[2]]], [0.006, 0.006], '#e85a7a', { cap0: 'none', cap1: 'none' }); } // you can see its white blood and bones through it
            if (big) { for (let i = 0; i < 8; i++) { const b = f.at(0.15 + i * 0.09); cone([0, b.p[1] + b.h * 0.8, b.p[2]], [(i % 2 ? 0.3 : -0.3), 1, -0.2], 0.2 - Math.abs(i - 3.5) * 0.02, 0.05, glw, { emis: true, segs: 4 }); } for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) cone([sd * 0.12, 0.56, 0.2 - i * 0.12], [sd, -0.4, -0.4], 0.24, 0.035, glw, { emis: true, segs: 4 }); }
            dorsal(f, 0.3, 0.7, big ? 0.24 : 0.14, '#eaf8ff'); pects(f, 0.25, big ? 0.3 : 0.16, '#eaf8ff', { out: 1 }); tailFin(f, 'fork', big ? 0.36 : 0.22, '#eaf8ff', { edge: glw }); }
          else if (P === 'narwhal') { const grey = hexMix(bd, '#8a94a4', 0.5), spot = hexMix(grey, '#3a3e48', 0.5); const f = fish({ L: 1.8, cy: 0.62, w: 0.3, h: 0.3, c: grey, belly: '#e8eef6', prof: (t) => Math.pow(Math.sin(Math.min(1, 0.22 + t * 0.85) * Math.PI), 0.45) * (1 - t * 0.7), shade: (p, nx, ny, nz, t) => ny > 0 && Math.sin(p[2] * 18) * Math.sin(p[0] * 26) > 0.6 ? spot : null });
            eyesAt(f, 0.1, 0.045); mouthAt(f, 0.03); const a = f.at(0.0); const pts = [], rr = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push([Math.cos(u * 30) * 0.008, a.p[1] + 0.06 + u * 0.12, a.p[2] + u * 1.2]); rr.push(0.05 * (1 - u * 0.9)); } tube(pts, rr, '#f4ecdc', { cap0: 'flat', cap1: 'none' });
            for (const sd of [-1, 1]) { const b = f.at(0.22); plate([[sd * b.w * 0.9, b.p[1] - b.h * 0.4, b.p[2]], [sd * (b.w + 0.3), b.p[1] - b.h - 0.04, b.p[2] - 0.2], [sd * b.w * 0.9, b.p[1] - b.h * 0.5, b.p[2] - 0.2]], 0.025, grey); }
            B(6, 'tailfin', [0, f.tail[1], f.tail[2] + 0.04]); for (const sd of [-1, 1]) plate([[0, f.tail[1], f.tail[2] + 0.06], [sd * 0.4, f.tail[1], f.tail[2] - 0.2], [sd * 0.1, f.tail[1], f.tail[2] - 0.1]], 0.03, grey); bone = 0;
            for (let i = 0; i < 4; i++) cone([0, a.p[1] + 0.3, a.p[2] - 0.2 - i * 0.1], [0, 1, -0.2], 0.12, 0.03, glw, { emis: true, segs: 4 }); }

          // ======== SPARK ========
          else if (P === 'sparkfry') fry(hexMix(bd, '#3a5ad8', 0.4), { fin: '#7ae8ff', L: 0.7, h: 0.15, w: 0.1, tail: 'fork', glow: true, eye: '#7ae8ff', after: (f) => { const b = f.at(0.3); tube([[0.13, b.p[1] + 0.02, b.p[2] + 0.1], [0.14, b.p[1] + 0.02, b.p[2] - 0.2]], [0.02, 0.02], '#7ae8ff', { emis: true, cap0: 'round', cap1: 'round' }); } });
          else if (P === 'neontetra') { const blue = '#3a8af8', red = '#e83a4a'; const f = fish({ L: 0.9, cy: 0.6, w: 0.12, h: 0.18, c: '#c8ccd4', belly: '#f2f4f6', shade: (p, nx, ny, nz, t) => (Math.abs(nx) > 0.6 && ny > 0 && ny < 0.6) ? blue : (Math.abs(nx) > 0.6 && ny < 0 && ny > -0.6 && t > 0.45) ? red : null }); for (const sd of [-1, 1]) tube([[sd * 0.12, 0.62, 0.3], [sd * 0.13, 0.63, 0.0], [sd * 0.1, 0.6, -0.3]], [0.02, 0.022, 0.015], '#7ae8ff', { emis: true, cap0: 'round', cap1: 'round' });
            eyesAt(f, 0.14, 0.065, { col: '#7ae8ff', glow: true }); mouthAt(f, 0.04); dorsal(f, 0.45, 0.6, 0.14, '#e8eef6'); pects(f, 0.3, 0.12, '#e8eef6'); tailFin(f, 'fork', 0.26, '#e8eef6', { edge: '#7ae8ff', emis: true }); }
          else if (P === 'stormsword') { const dark = hexMix(bd, '#20283a', 0.6), silver = '#e8eef6', bolt = '#7ae8ff'; const f = fish({ L: 1.7, cy: 0.62, w: 0.18, h: 0.24, c: dark, belly: silver, shade: (p, nx, ny, nz, t) => (Math.abs(nx) > 0.7 && Math.abs(Math.sin(t * 40)) > 0.94) ? bolt : null });
            eyesAt(f, 0.12, 0.05, { brow: dk, col: bolt, glow: true }); const a = f.at(0); const sw = [0, a.p[1] + 0.04, a.p[2] + 1.0]; tube([[0, a.p[1] + 0.02, a.p[2]], sw], [0.06, 0.008], '#c8ccd4', { cap0: 'none', cap1: 'none' }); for (let i = 0; i < 4; i++) { const u = 0.2 + i * 0.2; tube([[0.02, a.p[1] + 0.06, a.p[2] + u], [0.06, a.p[1] + 0.14, a.p[2] + u + 0.08], [0.02, a.p[1] + 0.1, a.p[2] + u + 0.12], [0.06, a.p[1] + 0.2, a.p[2] + u + 0.2]], [0.01, 0.01, 0.01, 0.006], bolt, { emis: true, cap0: 'none', cap1: 'none' }); } ball(sw[0], sw[1], sw[2], 0.04, bolt, { emis: true, n: 2 });
            dorsal(f, 0.18, 0.4, 0.42, dark, { edge: bolt, emis: false, shape: (u) => u < 0.3 ? u / 0.3 : 1 - (u - 0.3) * 1.2 }); for (const sd of [-1, 1]) { const b = f.at(0.25); plate([[sd * b.w, b.p[1] - b.h * 0.4, b.p[2]], [sd * (b.w + 0.34), b.p[1] - b.h - 0.04, b.p[2] - 0.3], [sd * b.w, b.p[1] - b.h * 0.4, b.p[2] - 0.2]], 0.02, dark, { edge: bolt }); } tailFin(f, 'lunate', 0.5, dark, { edge: bolt }); }
          else if (P === 'torpedofry' || P === 'torpedoray') { const big = P === 'torpedoray', c = hexMix(bd, '#6a5a4a', 0.4), R = big ? 0.6 : 0.36; hover = 0.1;
            blob(-R, 0.3, -R * 0.9, R, 0.3 + R * 0.4, R * 0.9, 1, c, { under: '#f2ead6' }); for (let i = 0; i < (big ? 9 : 5); i++) { const a = i * 2.4, r = R * (0.3 + (i % 3) * 0.2); ball(Math.cos(a) * r, 0.3 + R * 0.38, Math.sin(a) * r * 0.9, 0.04, '#2a2420', { n: 1 }); }
            for (const sd of [-1, 1]) { blob(sd * R * 0.5 - R * 0.2, 0.3 + R * 0.2, -R * 0.1, sd * R * 0.5 + R * 0.2, 0.3 + R * 0.42, R * 0.4, 1, glw, { emis: true }); } // the electric organs, glowing under the skin
            look(R * 0.22, 0.3 + R * 0.44, R * 0.5, 0.05, { col: glw, glow: big }); B(6, 'tailfin', [0, 0.36, -R * 0.9]); tube([[0, 0.36, -R * 0.9], [0, 0.38, -R * 1.8]], [0.08, 0.03], c, { cap0: 'none', cap1: 'round' }); plate([[0, 0.4, -R * 1.5], [0, 0.6, -R * 1.7], [0, 0.4, -R * 1.85]], 0.02, c); bone = 0;
            if (big) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; tube([[Math.cos(a) * R * 0.9, 0.4, Math.sin(a) * R * 0.8], [Math.cos(a + 0.2) * R * 1.2, 0.5, Math.sin(a + 0.2) * R * 1.1], [Math.cos(a) * R * 1.4, 0.42, Math.sin(a) * R * 1.3]], [0.015, 0.012, 0.006], glw, { emis: true, cap0: 'round', cap1: 'round' }); } }
          else if (P === 'eleccatfish') { const c = hexMix(bd, '#8a7a6a', 0.5); const f = fish({ L: 1.3, cy: 0.5, w: 0.24, h: 0.22, c, belly: '#f2ead6', prof: (t) => Math.pow(Math.sin(Math.min(1, 0.22 + t * 0.85) * Math.PI), 0.5) * (1 - t * 0.5), shade: (p, nx, ny, nz, t) => (ny > 0 && Math.sin(p[2] * 18 + p[0] * 10) > 0.8) ? '#3a3230' : null });
            eyesAt(f, 0.1, 0.035); mouthAt(f, 0.03); const a = f.at(0.03); for (let i = 0; i < 6; i++) { const sd = i % 2 ? 1 : -1, k = Math.floor(i / 2); curl([sd * (0.06 + k * 0.04), a.p[1] - a.h * (0.2 + k * 0.2), a.p[2]], [sd * 0.5, -0.3 - k * 0.2, 0.6], 0.3 - k * 0.04, 0.016, c, [sd * 0.3, -0.2, -0.4]); ball(sd * (0.06 + k * 0.04) + sd * 0.2, a.p[1] - a.h * (0.2 + k * 0.2) - 0.1, a.p[2] + 0.1, 0.02, glw, { emis: true, n: 1 }); }
            for (const sd of [-1, 1]) tube([[sd * 0.24, 0.52, 0.2], [sd * 0.25, 0.5, -0.2], [sd * 0.2, 0.48, -0.5]], [0.025, 0.025, 0.015], glw, { emis: true, cap0: 'round', cap1: 'round' }); pects(f, 0.2, 0.18, c); belowFin(f, 0.6, 0.9, 0.12, c); tailFin(f, 'round', 0.3, c); }

          // ======== VOID ========
          else if (P === 'darkfry') fry(hexMix(bd, '#2a2430', 0.6), { fin: ac, eye: glw, glow: true, h: 0.24, w: 0.16, frown: true, prof: (t) => t < 0.3 ? 1 : Math.max(0.1, 1 - (t - 0.3) * 1.4), dorsal: false, after: (f) => { const a = f.at(0.1); tube([[0, a.p[1] + a.h, a.p[2]], [0, a.p[1] + a.h + 0.18, a.p[2] + 0.06], [0, a.p[1] + a.h + 0.14, a.p[2] + 0.18]], [0.01, 0.008, 0.006], hexMix(bd, '#2a2430', 0.6), { cap0: 'none', cap1: 'none' }); ball(0, a.p[1] + a.h + 0.14, a.p[2] + 0.2, 0.035, glw, { emis: true, n: 2 }); for (let i = 0; i < 4; i++) cone([(i - 1.5) * 0.04, a.p[1] - a.h * 0.3, a.p[2] + 0.02], [0, 1, 0.4], 0.05, 0.012, '#f4f0e6'); } });
          else if (P === 'viperfish' || P === 'abyssgulper') { const big = P === 'abyssgulper', black = hexMix('#1a1620', bd, 0.2);
            if (!big) { const f = fish({ L: 1.2, cy: 0.6, w: 0.12, h: 0.18, c: black, belly: hexMix(black, ac, 0.3) }); eyesAt(f, 0.12, 0.06, { col: glw, glow: true }); const a = f.at(0.05); for (let i = 0; i < 4; i++) { const u = i / 3 - 0.5; cone([u * 0.14, a.p[1] - 0.04, a.p[2] + 0.04], [0, 1, 0.5], 0.24 - Math.abs(u) * 0.1, 0.018, '#f4f0e6'); cone([u * 0.12, a.p[1] + 0.06, a.p[2] + 0.04], [0, -1, 0.4], 0.14, 0.015, '#f4f0e6'); }
              for (let i = 0; i < 8; i++) { const b = f.at(0.15 + i * 0.09); ball(0, b.p[1] - b.h * 0.85, b.p[2], 0.022, glw, { emis: true, n: 1 }); } const d = f.at(0.25); tube([[0, d.p[1] + d.h, d.p[2]], [0, d.p[1] + d.h + 0.3, d.p[2] + 0.1], [0, d.p[1] + d.h + 0.24, d.p[2] + 0.34]], [0.012, 0.01, 0.008], black, { cap0: 'none', cap1: 'none' }); ball(0, d.p[1] + d.h + 0.24, d.p[2] + 0.36, 0.04, glw, { emis: true, n: 2 }); tailFin(f, 'fork', 0.26, black, { edge: ac }); }
            else { B(1, 'head', [0, 0.7, 0.2]); blob(-0.44, 0.24, -0.1, 0.44, 1.2, 0.7, 1, black, { under: '#3a1a2a' }); blob(-0.38, 0.32, 0.3, 0.38, 1.0, 0.74, 1, '#1a0814'); // a mouth bigger than the rest of it
              for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; cone([Math.cos(a) * 0.36, 0.66 + Math.sin(a) * 0.32, 0.66], [-Math.cos(a), -Math.sin(a), 0.4], 0.14, 0.025, '#f4f0e6'); }
              look(0.3, 1.06, 0.4, 0.04, { col: glw, glow: true }); bone = 0; const pts = [], rr = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([Math.sin(u * 6) * 0.12, 0.7 + Math.sin(u * 3) * 0.1, -0.1 - u * 1.8]); rr.push(0.3 * (1 - u * 0.95)); } tube(pts, rr, black, { cap0: 'none', cap1: 'none', shade: (p, nx, ny, nz, t) => rgb(Math.floor(t * 12) % 3 === 0 && ny > 0.5 ? ac : black) });
              B(6, 'tailfin', pts[12]); ball(pts[12][0], pts[12][1], pts[12][2], 0.08, glw, { emis: true, n: 2 }); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; cone(pts[12], [Math.cos(a), Math.sin(a), -0.3], 0.14, 0.02, ac, { emis: true }); } bone = 0; } }
          else if (P === 'barreleyefry' || P === 'barreleye') { const big = P === 'barreleye', black = hexMix('#2a2430', bd, 0.3), glass = '#d8f0ff';
            const f = fish({ L: big ? 1.1 : 0.7, cy: 0.6, w: big ? 0.14 : 0.1, h: big ? 0.18 : 0.13, c: black, belly: hexMix(black, '#ffffff', 0.1) });
            const a = f.at(0.12); blob(-0.12, a.p[1] - 0.02, a.p[2] - 0.12, 0.12, a.p[1] + (big ? 0.32 : 0.2), a.p[2] + 0.16, 1, glass); // a transparent head with the eyes inside, looking up
            for (const sd of [-1, 1]) { ball(sd * 0.05, a.p[1] + (big ? 0.16 : 0.1), a.p[2], big ? 0.06 : 0.045, '#3ae87a', { emis: true, n: 2 }); ball(sd * 0.05, a.p[1] + (big ? 0.22 : 0.14), a.p[2], big ? 0.03 : 0.022, '#0a0810', { n: 1 }); }
            for (const sd of [-1, 1]) ball(sd * a.w * 0.9, a.p[1] + 0.02, a.p[2] + 0.12, 0.02, '#16121e', { n: 1 }); mouthAt(f, 0.02);
            pects(f, 0.3, big ? 0.28 : 0.16, hexMix(black, ac, 0.3), { out: 1.1, down: 0.3 }); tailFin(f, 'round', big ? 0.28 : 0.2, hexMix(black, ac, 0.3)); if (big) { dorsal(f, 0.5, 0.7, 0.16, hexMix(black, ac, 0.3)); for (let i = 0; i < 6; i++) { const b = f.at(0.3 + i * 0.1); ball(0, b.p[1] - b.h, b.p[2], 0.02, ac, { emis: true, n: 1 }); } } }
          else if (P === 'ghostshark') { const pale = hexMix(bd, '#c8c0d8', 0.6); const f = fish({ L: 1.2, cy: 0.62, w: 0.18, h: 0.24, c: pale, belly: '#f2ecf4', prof: (t) => Math.pow(Math.sin(Math.min(1, 0.18 + t * 0.9) * Math.PI), 0.5) * Math.pow(1 - t, 1.6) + 0.02 });
            eyesAt(f, 0.1, 0.075, { col: '#3ae8c8', glow: true }); mouthAt(f, 0.03); for (const sd of [-1, 1]) { const b = f.at(0.2); B(sd < 0 ? 7 : 8, 'wing', [sd * b.w, b.p[1], b.p[2]], { side: sd, fold: 0 }); plate([[sd * b.w, b.p[1], b.p[2] + 0.04], [sd * (b.w + 0.6), b.p[1] - 0.04, b.p[2] - 0.2], [sd * (b.w + 0.4), b.p[1] - 0.06, b.p[2] - 0.44], [sd * b.w, b.p[1] - 0.04, b.p[2] - 0.3]], 0.02, pale, { edge: ac }); bone = 0; }
            const d = f.at(0.2); cone([0, d.p[1] + d.h * 0.8, d.p[2]], [0, 1, -0.3], 0.3, 0.03, '#f2ecf4'); dorsal(f, 0.3, 0.9, 0.08, pale, { edge: ac }); B(6, 'tailfin', f.tail); tube([f.tail, [0, f.tail[1], f.tail[2] - 0.6]], [0.02, 0.004], pale, { cap0: 'none', cap1: 'none' }); bone = 0;
            for (let i = 0; i < 5; i++) { const b = f.at(0.15 + i * 0.12); for (const sd of [-1, 1]) tube([[sd * b.w * 0.95, b.p[1] + 0.06, b.p[2]], [sd * b.w * 0.95, b.p[1] - 0.04, b.p[2] - 0.1]], [0.008, 0.008], ac, { emis: true, cap0: 'none', cap1: 'none' }); } }

          // ======== LIGHT ========
          else if (P === 'glimmerfry') fry('#f2e2a0', { fin: '#fff3b0', h: 0.3, w: 0.08, L: 0.5, prof: (t) => Math.pow(Math.sin(Math.min(1, 0.1 + t * 0.95) * Math.PI), 0.35), dh: 0.16, after: (f) => { const a = f.at(0.3); hring(0, a.p[1] + a.h + 0.14, a.p[2], 0.06, 0.012, '#ffd25a', { emis: true }); } });
          else if (P === 'butterflyfish') { const yel = '#f2d23a', white = '#fbfaf6'; const f = fish({ L: 0.9, cy: 0.6, w: 0.1, h: 0.36, c: white, belly: white, prof: (t) => Math.pow(Math.sin(Math.min(1, 0.15 + t * 0.95) * Math.PI), 0.4) * (1 - t * 0.5), shade: (p, nx, ny, nz, t) => t > 0.4 ? yel : (Math.abs(t - 0.2) < 0.03) ? '#20242e' : null });
            const a = f.at(0); tube([[0, a.p[1], a.p[2]], [0, a.p[1] - 0.02, a.p[2] + 0.16]], [0.03, 0.02], white, { cap0: 'none', cap1: 'flat' }); eyesAt(f, 0.2, 0.05); const e = f.at(0.72); for (const sd of [-1, 1]) { ball(sd * e.w * 0.9, e.p[1] + e.h * 0.4, e.p[2], 0.07, '#20242e', { n: 2 }); ball(sd * (e.w * 0.9 + 0.01), e.p[1] + e.h * 0.4, e.p[2], 0.04, '#ffd25a', { emis: true, n: 1 }); } // a false eye near the tail
            dorsal(f, 0.25, 0.9, 0.2, yel, { edge: '#20242e' }); belowFin(f, 0.5, 0.9, 0.18, yel, { edge: '#20242e' }); tailFin(f, 'round', 0.24, yel); hring(0, a.p[1] + 0.5, a.p[2] - 0.3, 0.08, 0.012, '#ffd25a', { emis: true }); }
          else if (P === 'sunfish') { const silver = hexMix(bd, '#c8ccd4', 0.6); const f = fish({ L: 1.1, cy: 0.9, w: 0.2, h: 0.76, c: silver, belly: silver, prof: (t) => Math.pow(Math.sin(Math.min(1, 0.12 + t * 0.95) * Math.PI), 0.35), shade: (p, nx, ny, nz, t) => (Math.sin(p[1] * 14 + p[2] * 8) > 0.9) ? '#fff3b0' : null });
            eyesAt(f, 0.15, 0.08, { col: '#ffd25a' }); mouthAt(f, 0.03); const d = f.at(0.75); plate([[0, d.p[1] + d.h * 0.7, d.p[2] + 0.1], [0, d.p[1] + d.h + 0.6, d.p[2] - 0.2], [0, d.p[1] + d.h * 0.7, d.p[2] - 0.2]], 0.03, silver); plate([[0, d.p[1] - d.h * 0.7, d.p[2] + 0.1], [0, d.p[1] - d.h - 0.6, d.p[2] - 0.2], [0, d.p[1] - d.h * 0.7, d.p[2] - 0.2]], 0.03, silver);
            B(6, 'tailfin', f.tail); for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2.4; plate([[0, f.tail[1] + Math.sin(a) * 0.6, f.tail[2] + 0.1], [0, f.tail[1] + Math.sin(a) * 0.7, f.tail[2] - 0.18], [0, f.tail[1] + Math.sin(a + 0.15) * 0.7, f.tail[2] - 0.18]], 0.02, '#ffd25a', { emis: true }); } bone = 0;
            for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; cone([0.0, 0.9 + Math.sin(a) * 1.0, 0.1 - 0.4 + Math.cos(a) * 1.0 * 0.0 + (Math.cos(a) * 0.6)], [0, Math.sin(a), Math.cos(a)], i % 2 ? 0.16 : 0.26, 0.04, '#ffd25a', { emis: true }); } hover = 0.2; }
          else if (P === 'goldfish' || P === 'celestialfish') { const big = P === 'celestialfish', gold = '#f2a23a', white = '#fbfaf6';
            const f = fish({ L: 0.7, cy: 0.6, w: 0.2, h: 0.24, c: gold, belly: hexMix(gold, white, 0.4), prof: (t) => Math.pow(Math.sin(Math.min(1, 0.15 + t * 0.95) * Math.PI), 0.4) * (1 - t * 0.6) });
            if (!big) eyesAt(f, 0.15, 0.065); else { const a = f.at(0.14); for (const sd of [-1, 1]) { ball(sd * (a.w * 0.8), a.p[1] + a.h * 0.6, a.p[2], 0.08, '#f2ecf4', { n: 2 }); ball(sd * (a.w * 0.8), a.p[1] + a.h * 0.6 + 0.06, a.p[2] + 0.02, 0.05, '#16121e', { n: 2 }); ball(sd * (a.w * 0.8) - sd * 0.01, a.p[1] + a.h * 0.6 + 0.1, a.p[2] + 0.04, 0.02, '#ffffff', { emis: true, n: 1 }); } for (let i = 0; i < 5; i++) { const q = i / 5 * Math.PI * 2; ball(Math.cos(q) * 0.3, a.p[1] + a.h + 0.3 + Math.sin(q) * 0.1, a.p[2] - 0.1 + Math.sin(q) * 0.2, 0.03, '#fff3b0', { emis: true, n: 1 }); } } // eyes that look forever upward, at the stars
            mouthAt(f, 0.04); pects(f, 0.3, 0.14, gold); if (!big) dorsal(f, 0.3, 0.7, 0.2, gold);
            B(6, 'tailfin', [0, f.tail[1], f.tail[2] + 0.04]); for (let i = 0; i < (big ? 9 : 5); i++) { const a = (i / ((big ? 9 : 5) - 1) - 0.5) * (big ? 2.4 : 1.6), len = big ? 0.8 : 0.4; plate([[0, f.tail[1], f.tail[2] + 0.04], [Math.sin(a) * 0.2, f.tail[1] + Math.sin(a) * len * 0.6, f.tail[2] - len], [Math.sin(a + 0.12) * 0.2, f.tail[1] + Math.sin(a + 0.12) * len * 0.6 - 0.08, f.tail[2] - len * 0.9]], 0.012, i % 2 ? gold : (big ? '#fff3b0' : white), { emis: big && i % 2 === 0 }); } bone = 0; }
          else if (P === 'moonfish') { const silver = '#d8dce4', red = '#e8503a'; const f = fish({ L: 1.0, cy: 0.7, w: 0.2, h: 0.5, c: silver, belly: silver, prof: (t) => Math.pow(Math.sin(Math.min(1, 0.12 + t * 0.95) * Math.PI), 0.4) * (1 - t * 0.6), shade: (p, nx, ny, nz, t) => (Math.sin(p[1] * 22) * Math.sin(p[2] * 22) > 0.85) ? '#fbfaf6' : null });
            eyesAt(f, 0.12, 0.07, { col: '#ffd25a' }); mouthAt(f, 0.03); dorsal(f, 0.2, 0.75, 0.42, red, { shape: (u) => u < 0.2 ? u / 0.2 : 1 - (u - 0.2) * 0.9 }); belowFin(f, 0.5, 0.8, 0.2, red); pects(f, 0.3, 0.26, red, { out: 0.6, down: 0 }); tailFin(f, 'lunate', 0.36, red);
            const a = f.at(0.42); const pts = []; for (let i = 0; i <= 10; i++) { const q = Math.PI * 0.2 + i / 10 * Math.PI * 1.2; pts.push([0, a.p[1] + Math.sin(q) * 0.22, a.p[2] + Math.cos(q) * 0.22]); } for (const sd of [-1, 1]) tube(pts.map(p => [sd * (a.w * 0.98), p[1], p[2]]), pts.map((_, i) => 0.012 + 0.03 * Math.sin(i / 10 * Math.PI)), '#fff3c0', { emis: true, cap0: 'round', cap1: 'round' }); }
          break;
        }
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
        ring(0, 0.67, 0, 0.3, 0.19, 0.03, dark); blob(-0.1, 0.6, 0.12, 0.1, 0.74, 0.24, 0.5, hexMix(C.accent, '#000000', 0.15), { n: 2 }); // belt, and the buckle on the front only (it used to poke out of the back too, so from behind he seemed to face you)
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
        for (const sd of [-1, 1]) { B(sd < 0 ? 4 : 5, 'leg', [sd * 0.15, 0.62, 0], { phase: sd < 0 ? 0 : Math.PI, len: 0.6, amp: 0.5 }); tube([[sd * 0.15, 0.64, 0], [sd * 0.16, 0.35, 0]], [0.125, 0.108], dark, { cap0: 'none', cap1: 'round', segs: 6 }); B(sd < 0 ? 6 : 9, 'shin', [sd * 0.16, 0.35, 0], { leg: sd < 0 ? 4 : 5 }); tube([[sd * 0.16, 0.37, 0], [sd * 0.16, 0.12, 0.01]], [0.106, 0.1], dark, { cap0: 'round', cap1: 'none', segs: 6 }); /* a knee: the shin is its own bone, so he can crouch and sit properly */ blob(sd * 0.16 - 0.12, 0, -0.1, sd * 0.16 + 0.12, 0.15, 0.24, 0.55, hexMix(dark, '#000000', 0.3), { n: 2 }); }
        bone = 0; break;
      }
      default: {
        if (form.plan && FLT.has(form.plan)) {
          // Floaters with bodies of their own: things that drift (seeds, lanterns, kites, snowflakes, moons) grown into creatures.
          const P = form.plan, dk = C.dark, bl = C.belly, bd = C.body, ac = C.accent, glw = hexMix(C.accent, '#ffffff', 0.3);
          flyer = true; hover = 0.25; legLen = 0.4;
          const look = (ex, ey, ez, er, o = {}) => LOOK(ex, ey, ez, er, o, false); const lookOld = (ex, ey, ez, er, o = {}) => { for (const sd of [-1, 1]) { ball(sd * ex, ey, ez, er, '#16121e', { n: 3 }); ball(sd * (ex + er * 0.04), ey - er * 0.12, ez + er * 0.5, er * 0.62, o.col || C.eye, { emis: !!o.glow, n: 3 });
            ball(sd * (ex + er * 0.05), ey - er * 0.1, ez + er * 0.78, er * 0.3, '#0a0810', { n: 2 }); ball(sd * (ex - er * 0.22), ey + er * 0.34, ez + er * 0.82, er * 0.3, '#ffffff', { emis: true, n: 2 });
            if (o.brow) blob(sd * ex - er * 1.2, ey + er * 0.8, ez - er * 0.5, sd * ex + er * 1.1, ey + er * 1.2, ez + er * 0.9, 0.5, o.brow, { n: 2 }); } };
          const smile = (y, z, w, c) => tube([[-w, y + w * 0.4, z - 0.01], [0, y, z], [w, y + w * 0.4, z - 0.01]], [0.014, 0.014, 0.014], c || dk, { cap0: 'round', cap1: 'round' });
          const spin = (p, speed) => B(6, 'spin', p, { speed: speed || 1.2 });
          const orbit = (cx, cy, cz, R, n, fn) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; fn(cx + Math.cos(a) * R, cy + Math.sin(a * 2) * R * 0.15, cz + Math.sin(a) * R, a, i); } };
          const star = (cx, cy, cz, R, r, n, c, o = {}) => { const pts = []; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? r : R; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, cz]); } for (let i = 0; i < n * 2; i++) plate([[cx, cy, cz + (o.t || 0.06)], pts[i], pts[(i + 1) % (n * 2)]], 0.02, c, { emis: !!o.emis }); for (let i = 0; i < n * 2; i++) plate([[cx, cy, cz - (o.t || 0.06)], pts[(i + 1) % (n * 2)], pts[i]], 0.02, c, { emis: !!o.emis }); };
          const flake = (cx, cy, cz, R, c, o = {}) => { for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, d = [Math.cos(a), Math.sin(a)]; tube([[cx, cy, cz], [cx + d[0] * R, cy + d[1] * R, cz]], [R * 0.07, R * 0.04], c, { cap0: 'round', cap1: 'round', emis: !!o.emis });
            for (const u of [0.45, 0.72]) for (const sd of [-1, 1]) { const b0 = [cx + d[0] * R * u, cy + d[1] * R * u, cz], a2 = a + sd * 0.8; tube([b0, [b0[0] + Math.cos(a2) * R * 0.28 * (1.1 - u), b0[1] + Math.sin(a2) * R * 0.28 * (1.1 - u), cz]], [R * 0.04, R * 0.025], c, { cap0: 'round', cap1: 'round', emis: !!o.emis }); } } };

          // ======== FLAME ========
          if (P === 'emberspark' || P === 'firewisp' || P === 'wisplord') { const k = P === 'emberspark' ? 0 : P === 'firewisp' ? 1 : 2, R = [0.26, 0.32, 0.4][k], cy = [0.7, 0.9, 1.1][k];
            ball(0, cy, 0, R * 0.55, '#ffd25a', { emis: true, n: 2 }); blob(-R, cy - R, -R, R, cy + R * (1.6 + 0.4 * k), R, 1, '#ff8a2a', { tap: [1, 0.15], emis: true });
            for (let i = 0; i < 3 + 2 * k; i++) { const a = (i / (2 + 2 * k) - 0.5) * 2; cone([Math.sin(a) * R * 0.6, cy + R * 0.6, -0.04], [Math.sin(a) * 0.6, 1, -0.2], R * (1.2 + (i % 2) * 0.4), R * 0.25, i % 2 ? '#ffd25a' : '#ff6a2a', { emis: true }); }
            look(R * 0.36, cy + R * 0.1, R * 0.82, R * 0.2, { col: '#2a1210' }); smile(cy - R * 0.32, R * 0.92, R * 0.18, '#7a2a10');
            if (k >= 1) { spin([0, cy, 0], 0.8); orbit(0, cy, 0, R * 1.8, 3 + k, (x, y, z) => { ball(x, y, z, R * 0.18, '#ffd25a', { emis: true, n: 2 }); cone([x, y, z], [0, 1, 0], R * 0.4, R * 0.12, '#ff8a2a', { emis: true }); }); bone = 0; }
            if (k === 2) { tube([[0, cy - R * 1.1, 0], [0, cy - R * 1.6, 0]], [0.03, 0.03], '#3a3230', { cap0: 'none', cap1: 'none' }); hring(0, cy - R * 1.0, 0, R * 1.1, 0.03, '#3a3230'); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; tube([[Math.cos(a) * R * 1.1, cy - R * 1.0, Math.sin(a) * R * 1.1], [0, cy + R * 2.6, 0]], [0.015, 0.015], '#3a3230', { cap0: 'none', cap1: 'none' }); } ball(0, cy + R * 2.7, 0, 0.06, '#3a3230', { n: 2 }); } // the lord burns inside a cage of iron, like a lantern
          } else if (P === 'skylantern' || P === 'dragonlantern') { const big = P === 'dragonlantern', red = '#d8302a', paper = '#f2c87a', cy = big ? 1.0 : 0.8;
            if (!big) { blob(-0.3, cy - 0.3, -0.3, 0.3, cy + 0.4, 0.3, 0.5, paper, { tap: [0.8, 1] }); ball(0, cy - 0.1, 0, 0.14, '#ffd25a', { emis: true, n: 2 }); hring(0, cy - 0.3, 0, 0.24, 0.02, '#8a6a42'); look(0.11, cy + 0.08, 0.3, 0.06); smile(cy - 0.08, 0.31, 0.05, '#8a3a1a'); }
            else { for (let i = 0; i < 3; i++) { const y = cy - 0.4 + i * 0.5; blob(-0.34 + i * 0.03, y - 0.22, -0.34 + i * 0.03, 0.34 - i * 0.03, y + 0.22, 0.34 - i * 0.03, 1, red); hring(0, y - 0.22, 0, 0.26, 0.025, '#e2b84a'); hring(0, y + 0.22, 0, 0.26, 0.025, '#e2b84a'); ball(0, y, 0, 0.12, '#ffd25a', { emis: true, n: 2 }); }
              B(1, 'head', [0, cy + 0.9, 0.1]); blob(-0.3, cy + 0.66, -0.06, 0.3, cy + 1.06, 0.5, 0.8, red, { under: '#e2b84a' }); for (const sd of [-1, 1]) { curl([sd * 0.18, cy + 1.04, 0.1], [sd * 0.3, 1, -0.6], 0.4, 0.05, '#e2b84a', [0, 0, -0.5]); tube([[sd * 0.1, cy + 0.74, 0.46], [sd * 0.4, cy + 0.6, 0.5], [sd * 0.6, cy + 0.4, 0.4]], [0.014, 0.01, 0.006], '#e2b84a', { cap0: 'none', cap1: 'none' }); }
              look(0.14, cy + 0.94, 0.4, 0.07, { brow: '#7a1a10' }); for (let i = 0; i < 5; i++) cone([(i - 2) * 0.06, cy + 0.72, 0.5], [0, -1, 0.2], 0.06, 0.018, '#f4f0e6'); bone = 0;
              for (let i = 0; i < 8; i++) tube([[(i % 2 ? 0.1 : -0.1), cy - 0.62, 0], [(i - 3.5) * 0.06, cy - 1.0 - (i % 3) * 0.08, 0.02]], [0.012, 0.008], '#e2b84a', { cap0: 'none', cap1: 'round' }); }
          } else if (P === 'comet') { ball(0, 1.0, 0.2, 0.3, '#8a7a72', { n: 3 }); for (let i = 0; i < 5; i++) { const a = i * 1.3; blob(Math.cos(a) * 0.22 - 0.06, 1.0 + Math.sin(a) * 0.22 - 0.05, 0.24, Math.cos(a) * 0.22 + 0.06, 1.0 + Math.sin(a) * 0.22 + 0.05, 0.42, 0.5, '#5a4a44', { n: 1 }); }
            for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 1.2; cone([Math.sin(a) * 0.2, 1.0 + Math.cos(a) * 0.1, 0.0], [Math.sin(a) * 0.3, 0.1 + Math.cos(a) * 0.2, -1], 1.2 - Math.abs(i - 3) * 0.15, 0.14, i % 2 ? '#ffd25a' : '#ff6a2a', { emis: true }); }
            look(0.12, 1.06, 0.44, 0.07, { brow: '#3a2a24', col: '#ffd25a', glow: true }); smile(0.9, 0.48, 0.07, '#ffa23a'); hover = 0.5;

          // ======== TIDE ========
          } else if (P === 'droplet') { // a raindrop that just landed: a crown of splash on its head, rosy cheeks, a puddle ring spreading under it
            const water = hexMix(bd, '#7ac8ff', 0.5), foam = '#eaf8ff', cy = 0.3, R = 0.26;
            blob(-R, cy - R, -R, R, cy + R * 1.7, R, 1, water, { tap: [1, 0.08] }); ball(-R * 0.4, cy + R * 0.5, R * 0.62, R * 0.14, '#ffffff', { emis: true, n: 2 });
            for (const sd of [-1, 1]) { ball(sd * R * 0.36, cy + R * 0.05, R * 0.84, R * 0.2, '#ffffff', { n: 2 }); ball(sd * R * 0.37, cy + R * 0.02, R * 0.98, R * 0.11, '#2a5a9a', { n: 2 }); ball(sd * R * 0.37, cy + R * 0.02, R * 1.06, R * 0.05, '#0a0810', { n: 1 }); ball(sd * R * 0.32, cy + R * 0.1, R * 1.06, R * 0.04, '#ffffff', { emis: true, n: 1 }); ball(sd * R * 0.62, cy - R * 0.22, R * 0.74, R * 0.1, '#ffb0c8', { n: 1 }); }
            smile(cy - R * 0.32, R * 0.96, R * 0.14);
            for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, b0 = [Math.cos(a) * R * 0.3, cy + R * 1.5, Math.sin(a) * R * 0.3]; tube([b0, [b0[0] * 2.2, b0[1] + 0.12, b0[2] * 2.2]], [0.025, 0.014], water, { cap0: 'none', cap1: 'none' }); ball(b0[0] * 2.3, b0[1] + 0.14, b0[2] * 2.3, 0.03, foam, { n: 1 }); }
            for (let i = 0; i < 2; i++) hring(0, 0.03, 0, 0.34 + i * 0.16, 0.014, foam, { emis: true }); blob(-0.32, 0.0, -0.32, 0.32, 0.04, 0.32, 1, water); hover = 0;
          } else if (P === 'waterorb') { // a fountain sprite: a stone basin with a face, a jet of water from its crown falling all round it like hair
            const stone = '#e8e2d4', water = hexMix(bd, '#7ac8ff', 0.5), foam = '#eaf8ff', cy = 0.7;
            blob(-0.36, cy - 0.3, -0.36, 0.36, cy + 0.16, 0.36, 1, stone, { under: '#c8c0b0', tap: [0.55, 1] }); hring(0, cy + 0.14, 0, 0.36, 0.035, '#c8c0b0'); blob(-0.3, cy + 0.08, -0.3, 0.3, cy + 0.16, 0.3, 1, water);
            look(0.12, cy - 0.06, 0.32, 0.06); smile(cy - 0.18, 0.33, 0.06, '#8a8070'); for (const sd of [-1, 1]) ball(sd * 0.24, cy - 0.14, 0.28, 0.035, '#ffb0c8', { n: 1 });
            tube([[0, cy + 0.14, 0], [0, cy + 0.66, 0]], [0.06, 0.04], water, { cap0: 'none', cap1: 'none', emis: true }); ball(0, cy + 0.7, 0, 0.08, foam, { emis: true, n: 2 });
            for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, d = [Math.cos(a), Math.sin(a)]; const pts = [[0, cy + 0.68, 0], [d[0] * 0.22, cy + 0.76, d[1] * 0.22], [d[0] * 0.42, cy + 0.6, d[1] * 0.42], [d[0] * 0.54, cy + 0.24, d[1] * 0.54], [d[0] * 0.58, cy - 0.16, d[1] * 0.58]]; tube(pts, [0.03, 0.03, 0.026, 0.02, 0.012], water, { cap0: 'none', cap1: 'round', emis: i % 2 === 0 }); ball(pts[4][0], pts[4][1] - 0.06, pts[4][2], 0.03, foam, { n: 1 }); }
            ball(0.1, cy - 0.3, 0.3, 0.03, '#e2b84a', { emis: true, n: 1 }); ball(-0.14, cy - 0.32, 0.26, 0.025, '#e2b84a', { emis: true, n: 1 });
          } else if (P === 'tidemoon') { // the tide moon: its top half is the moon, its bottom half is the sea, waves breaking round its middle and a ring of tide orbiting it
            const moon = '#f2ecd0', sea = hexMix(bd, '#2a6ac8', 0.5), foam = '#eaf8ff', cy = 1.2, R = 0.55;
            blob(-R, cy - R, -R, R, cy + R, R, 1, moon, { under: sea, split: 0.35, soft: 0.04, n: 7 });
            for (const [x, y, z, r] of [[0.24, 0.3, 0.38, 0.08], [-0.3, 0.22, 0.34, 0.06], [0.0, 0.42, 0.2, 0.07], [0.36, 0.14, -0.2, 0.06], [-0.2, 0.36, -0.3, 0.07]]) blob(x - r, cy + y - r * 0.3, z - r, x + r, cy + y + r * 0.3, z + r, 1, '#d8d0b0', { n: 2 });
            for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; curl([Math.cos(a) * R * 0.98, cy + 0.02, Math.sin(a) * R * 0.98], [Math.cos(a) * 0.6, 1, Math.sin(a) * 0.6], 0.16, 0.035, foam, [Math.cos(a + 1.6) * 0.8, -1.2, Math.sin(a + 1.6) * 0.8]); }
            for (const sd of [-1, 1]) { blob(sd * 0.2 - 0.08, cy + 0.2, R * 0.82, sd * 0.2 + 0.08, cy + 0.24, R * 0.9, 0.5, '#8a7a50', { n: 1 }); } smile(cy + 0.1, R * 0.92, 0.06, '#8a7a50'); // sleepy closed eyes on the moon half
            for (const sd of [-1, 1]) { ball(sd * 0.18, cy - 0.22, R * 0.86, 0.06, '#f4fbff', { n: 2 }); ball(sd * 0.18, cy - 0.22, R * 0.96, 0.035, '#0a1a3a', { n: 1 }); } // and two bright eyes looking out of the sea
            B(6, 'spin', [0, cy, 0], { speed: 0.6 }); const ring2 = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2; ring2.push([Math.cos(a) * 0.95, cy + Math.sin(a * 2) * 0.06 - 0.1, Math.sin(a) * 0.95]); } tube(ring2, ring2.map((_, i) => 0.04 + 0.02 * Math.sin(i)), sea, { cap0: 'none', cap1: 'none', emis: false });
            for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4, p = [Math.cos(a) * 0.95, cy - 0.04, Math.sin(a) * 0.95]; blob(p[0] - 0.05, p[1] - 0.03, p[2] - 0.05, p[0] + 0.05, p[1] + 0.03, p[2] + 0.05, 1, '#f2a23a', { n: 1 }); } bone = 0;
          } else if (P === 'seaangel') { // a sea angel: a tiny glass angel of the deep, a robe of a body, a heart that glows, two flapping wing-fins and a halo of light
            const glass = hexMix(bd, '#ffffff', 0.6), red = '#ff5a6a', cy = 0.8;
            blob(-0.18, cy - 0.46, -0.16, 0.18, cy + 0.1, 0.16, 1, glass, { tap: [1.3, 0.6] }); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; cone([Math.cos(a) * 0.18, cy - 0.44, Math.sin(a) * 0.16], [Math.cos(a) * 0.3, -1, Math.sin(a) * 0.3], 0.1, 0.05, glass); }
            ball(0, cy - 0.14, 0.04, 0.07, red, { emis: true, n: 2 }); ball(0, cy + 0.22, 0.02, 0.15, glass, { n: 3 });
            for (const sd of [-1, 1]) { ball(sd * 0.06, cy + 0.24, 0.13, 0.035, '#16121e', { n: 2 }); ball(sd * 0.055, cy + 0.255, 0.16, 0.012, '#ffffff', { emis: true, n: 1 }); ball(sd * 0.1, cy + 0.17, 0.12, 0.02, '#ffb0c8', { n: 1 }); }
            hring(0, cy + 0.46, 0, 0.1, 0.018, '#fff3b0', { emis: true });
            for (const sd of [-1, 1]) { B(sd < 0 ? 7 : 8, 'wing', [sd * 0.12, cy, 0], { side: sd, fold: 0 }); plate([[sd * 0.12, cy + 0.04, 0], [sd * 0.4, cy + 0.26, -0.02], [sd * 0.42, cy + 0.06, -0.04], [sd * 0.26, cy - 0.06, -0.02]], 0.015, glass, { edge: ac }); bone = 0; }
          } else if (P === 'greatseaangel') { // the abyssal seraph: three pairs of glass wings, a gown of trailing ribbons, and the head that opens into a crown of glowing hunting hooks
            const glass = hexMix(bd, '#ffffff', 0.6), red = '#ff5a6a', cy = 1.3;
            blob(-0.22, cy - 0.5, -0.2, 0.22, cy + 0.14, 0.2, 1, glass, { tap: [1.1, 0.7] }); ball(0, cy - 0.14, 0.06, 0.1, red, { emis: true, n: 2 }); for (let i = 0; i < 3; i++) hring(0, cy - 0.1 - i * 0.12, 0, 0.21 - i * 0.004, 0.012, glw, { emis: true });
            for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, b0 = [Math.cos(a) * 0.18, cy - 0.48, Math.sin(a) * 0.16]; const pts = [b0]; for (let j = 1; j <= 5; j++) pts.push([b0[0] * (1 + j * 0.2) + Math.sin(j + i) * 0.04, b0[1] - j * 0.14, b0[2] * (1 + j * 0.2) - j * 0.02]); tube(pts, pts.map((_, j) => 0.03 * (1 - j / 6)), glass, { cap0: 'none', cap1: 'none' }); ball(pts[5][0], pts[5][1], pts[5][2], 0.025, glw, { emis: true, n: 1 }); }
            B(1, 'head', [0, cy + 0.2, 0]); ball(0, cy + 0.3, 0.02, 0.17, glass, { n: 3 }); for (const sd of [-1, 1]) { ball(sd * 0.065, cy + 0.32, 0.14, 0.04, '#16121e', { n: 2 }); ball(sd * 0.065, cy + 0.32, 0.17, 0.022, red, { emis: true, n: 1 }); }
            for (let i = 0; i < 6; i++) { const a = (i / 5 - 0.5) * 2.2; curl([Math.sin(a) * 0.1, cy + 0.44, Math.cos(a) * 0.06], [Math.sin(a) * 0.6, 1, Math.cos(a) * 0.3], 0.34, 0.03, glw, [-Math.sin(a) * 0.6, -0.4, 0.2], { emis: true }); }
            for (let i = 0; i < 3; i++) ring(0, cy + 0.6 + i * 0.12, -0.04, 0.18 - i * 0.03, 0.06 - i * 0.01, 0.015, '#fff3b0', { emis: true }); bone = 0;
            for (let p = 0; p < 3; p++) for (const sd of [-1, 1]) { const y = cy + 0.08 - p * 0.24; B(sd < 0 ? 7 : 8, 'wing', [sd * 0.16, cy, 0], { side: sd, fold: 0 }); plate([[sd * 0.16, y + 0.04, 0], [sd * (0.7 - p * 0.12), y + 0.34 - p * 0.04, -0.04 - p * 0.04], [sd * (0.66 - p * 0.12), y + 0.06 - p * 0.04, -0.06 - p * 0.04], [sd * (0.34 - p * 0.06), y - 0.08, -0.04]], 0.015, glass, { edge: p % 2 ? red : glw, emis: true }); bone = 0; }
          } else if (P === 'nautilus') { const shell = '#f2e6d0', stripe = '#c87a4a';
            for (let i = 0; i < 6; i++) { const r = 0.42 * Math.pow(0.78, i), a = i * 1.05; ball(Math.sin(a) * (0.42 - r) * 0.9, 1.0 + Math.cos(a) * (0.42 - r) * 0.9, -0.1, r, i % 2 ? stripe : shell, { n: 3 }); }
            B(1, 'head', [0, 0.9, 0.3]); blob(-0.22, 0.7, 0.18, 0.22, 1.0, 0.44, 1, '#d8a080'); look(0.16, 0.92, 0.36, 0.05, { col: '#f2c23a' });
            for (let i = 0; i < 10; i++) { const a = (i / 9 - 0.5) * 2.4; tube([[Math.sin(a) * 0.14, 0.74, 0.38], [Math.sin(a) * 0.24, 0.5, 0.5], [Math.sin(a) * 0.2, 0.34 - (i % 2) * 0.06, 0.6]], [0.03, 0.02, 0.008], '#d8a080', { cap0: 'none', cap1: 'round' }); } bone = 0; hover = 0.35;

          // ======== BLOOM ========
          } else if (P === 'seedfluff' || P === 'dandelion' || P === 'dandelionking') { const k = P === 'seedfluff' ? 0 : P === 'dandelion' ? 1 : 2, R = [0.3, 0.46, 0.66][k], cy = [0.9, 1.1, 1.4][k], white = '#f6f8fa';
            ball(0, cy, 0, R * 0.36, k === 0 ? '#c8a060' : '#7aa04a', { n: 3 });
            const nseeds = [10, 26, 44][k]; for (let i = 0; i < nseeds; i++) { const u = 1 - 2 * (i + 0.5) / nseeds, kk = Math.sqrt(1 - u * u), a = i * 2.39996, d = [Math.cos(a) * kk, u, Math.sin(a) * kk]; if (k === 0 && d[1] < 0) continue; const tip = [d[0] * R, cy + d[1] * R, d[2] * R]; tube([[d[0] * R * 0.35, cy + d[1] * R * 0.35, d[2] * R * 0.35], tip], [0.008, 0.006], white, { cap0: 'none', cap1: 'none' }); for (let p = 0; p < 4; p++) { const q = p / 4 * Math.PI * 2; cone(tip, [d[0] + Math.cos(q) * 0.5, d[1] + 0.3, d[2] + Math.sin(q) * 0.5], R * 0.2, 0.008, white); } }
            look(R * 0.14, cy + R * 0.04, R * 0.33, R * 0.1, { col: '#3a6a2a' }); smile(cy - R * 0.14, R * 0.36, R * 0.07);
            if (k >= 1) { tube([[0, cy - R * 0.3, 0], [0.06, cy - R * 1.2, -0.04], [0, cy - R * 1.7, 0]], [0.03, 0.025, 0.02], '#5f8a3a', { cap0: 'none', cap1: 'round' }); for (const sd of [-1, 1]) plate([[0.02, cy - R * 1.2, 0], [sd * 0.3, cy - R * 1.0, 0.06], [sd * 0.24, cy - R * 1.3, 0.02]], 0.02, '#5f8a3a'); }
            if (k === 2) for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ball(Math.cos(a) * R * 0.38, cy + R * 0.32, Math.sin(a) * R * 0.38, 0.05, '#ffe08a', { emis: true, n: 1 }); }
          } else if (P === 'spore' || P === 'fungusballoon') { const big = P === 'fungusballoon', cy = big ? 1.2 : 0.8, R = big ? 0.5 : 0.24, cap = hexMix(bd, '#c8604a', 0.4);
            blob(-R, cy - R * 0.4, -R, R, cy + R * 0.9, R, 1, cap, { tap: [1, 0.6] }); for (let i = 0; i < (big ? 10 : 5); i++) { const a = i * 2.4, rr = R * (0.3 + (i % 3) * 0.2); ball(Math.cos(a) * rr, cy + R * 0.86 * Math.sqrt(1 - (rr / R) ** 2) * 0.9, Math.sin(a) * rr, R * 0.1, '#fff6e0', { n: 1 }); }
            plate(Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return [Math.cos(a) * R * 0.95, cy - R * 0.38, Math.sin(a) * R * 0.95]; }), 0.012, '#f2ead6');
            look(R * 0.3, cy + R * 0.1, R * 0.86, R * 0.16); smile(cy - R * 0.14, R * 0.94, R * 0.12);
            if (big) { for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; tube([[Math.cos(a) * R * 0.6, cy - R * 0.4, Math.sin(a) * R * 0.6], [Math.cos(a) * R * 0.5, cy - R * 1.4, Math.sin(a) * R * 0.5]], [0.012, 0.012], '#f2ead6', { cap0: 'none', cap1: 'none' }); } blob(-0.2, cy - R * 1.6, -0.2, 0.2, cy - R * 1.4, 0.2, 0.5, '#8a6a42'); for (let i = 0; i < 8; i++) { const a = i * 0.8; ball(Math.cos(a) * 0.9, cy - 0.3 + (i % 3) * 0.3, Math.sin(a) * 0.7, 0.03, glw, { emis: true, n: 1 }); } }
            else for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; ball(Math.cos(a) * 0.4, cy - 0.1, Math.sin(a) * 0.4, 0.025, glw, { emis: true, n: 1 }); }
          } else if (P === 'maplespinner') { const leaf = hexMix('#d8603a', bd, 0.3); ball(0, 1.0, 0, 0.18, '#8a6a42', { n: 3 }); look(0.07, 1.04, 0.15, 0.045); smile(0.94, 0.17, 0.04);
            spin([0, 1.0, 0], 2.4); for (const sd of [-1, 1]) { plate([[sd * 0.12, 1.04, 0], [sd * 0.4, 1.16, 0.12], [sd * 0.84, 1.14, 0.06], [sd * 0.9, 1.06, -0.06], [sd * 0.5, 1.0, -0.1]], 0.02, leaf, { edge: '#8a3a1a' }); for (let i = 0; i < 4; i++) tube([[sd * 0.16, 1.04, -0.02], [sd * (0.4 + i * 0.12), 1.1, 0.06 - i * 0.04]], [0.006, 0.004], '#8a3a1a', { cap0: 'none', cap1: 'none' }); } bone = 0;

          // ======== STONE ========
          } else if (P === 'floatpebble' || P === 'orbitring' || P === 'floatisland') { const k = P === 'floatpebble' ? 0 : P === 'orbitring' ? 1 : 2, cy = [0.8, 1.0, 1.0][k], rock = hexMix(bd, '#8a847a', 0.4), rock2 = hexMix(rock, dk, 0.3);
            if (k < 2) { blob(-0.28, cy - 0.22, -0.26, 0.28, cy + 0.26, 0.26, 0.5, rock, { under: rock2 }); look(0.11, cy + 0.06, 0.24, 0.06, { brow: k ? rock2 : null }); smile(cy - 0.1, 0.26, 0.05);
              if (k === 1) { spin([0, cy, 0], 0.7); orbit(0, cy, 0, 0.62, 7, (x, y, z, a, i) => blob(x - 0.09, y - 0.07, z - 0.08, x + 0.09, y + 0.08, z + 0.09, 0.4, i % 2 ? rock : rock2, { n: 1 })); bone = 0; hring(0, cy, 0, 0.62, 0.012, glw, { emis: true }); } }
            else { blob(-0.6, cy - 0.06, -0.56, 0.6, cy + 0.12, 0.56, 0.8, '#5f8a3a'); for (let i = 0; i < 3; i++) cone([0, cy, 0], [0, -1, 0], 0.9 - i * 0.2, 0.56 - i * 0.12, i % 2 ? rock2 : rock, { segs: 7 }); // an island torn out of the ground, grass on top, roots and rock below
              tube([[0.18, cy + 0.1, -0.1], [0.18, cy + 0.5, -0.1]], [0.05, 0.04], '#6b4a2e', { cap0: 'none', cap1: 'none' }); for (const [x, y, z, r] of [[0.18, cy + 0.66, -0.1, 0.2], [0.04, cy + 0.6, -0.16, 0.14], [0.3, cy + 0.6, -0.02, 0.14]]) ball(x, y, z, r, '#3f8a3a', { n: 2 });
              tube([[-0.4, cy + 0.08, 0.3], [-0.5, cy - 0.3, 0.32], [-0.48, cy - 0.8, 0.3]], [0.06, 0.05, 0.02], '#7ac8ff', { cap0: 'none', cap1: 'round' }); // a waterfall off the edge
              blob(-0.18, cy + 0.08, 0.26, 0.04, cy + 0.26, 0.42, 0.5, rock); look(0.18, cy - 0.3, 0.42, 0.07, { brow: rock2, col: glw, glow: true }); smile(cy - 0.5, 0.36, 0.08); hover = 0.3; }
          } else if (P === 'lodestone' || P === 'lodeorbit') { const big = P === 'lodeorbit', iron = '#5a5e68', cy = big ? 1.0 : 0.8;
            blob(-0.3, cy - 0.28, -0.26, 0.3, cy + 0.3, 0.26, 0.45, iron, { under: '#3a3d48' }); for (const sd of [-1, 1]) blob(sd * 0.3 - 0.06, cy - 0.12, -0.12, sd * 0.3 + 0.06, cy + 0.12, 0.12, 0.6, sd < 0 ? '#d83a3a' : '#3a6ad8', { n: 1 }); look(0.11, cy + 0.06, 0.26, 0.06, { brow: '#3a3d48' }); smile(cy - 0.12, 0.27, 0.05);
            spin([0, cy, 0], big ? 1.4 : 0.9); orbit(0, cy, 0, big ? 0.7 : 0.48, big ? 10 : 5, (x, y, z, a, i) => { cone([x, y, z], [Math.cos(a + 1.57), 0, Math.sin(a + 1.57)], 0.16, 0.025, '#8a8e98'); }); if (big) orbit(0, cy, 0, 0.5, 6, (x, y, z) => ball(x, y + 0.3, z, 0.05, '#c8c0b0', { n: 1 })); bone = 0;
            if (big) for (const r of [0.6, 0.8]) ring(0, cy, 0, r, r * 0.4, 0.008, glw, { emis: true });
          } else if (P === 'meteorite') { blob(-0.36, 0.7, -0.34, 0.36, 1.32, 0.34, 0.35, '#3a3230', { under: '#1e1a1c' }); for (let i = 0; i < 6; i++) { const a = i * 1.1; blob(Math.cos(a) * 0.3 - 0.06, 1.0 + Math.sin(a) * 0.26 - 0.05, 0.24, Math.cos(a) * 0.3 + 0.06, 1.0 + Math.sin(a) * 0.26 + 0.05, 0.36, 0.5, '#5a4a44', { n: 1 }); }
            for (const pth of [[[-0.2, 1.2, 0.3], [0, 1.08, 0.35], [0.12, 1.2, 0.32]], [[-0.3, 0.86, 0.22], [-0.1, 0.8, 0.3]], [[0.2, 0.82, 0.28], [0.32, 0.96, 0.2]]]) tube(pth, pth.map(() => 0.02), '#ffa23a', { emis: true, cap0: 'round', cap1: 'round' }); look(0.12, 1.02, 0.32, 0.06, { col: '#ffa23a', glow: true, brow: '#1e1a1c' });
            for (let i = 0; i < 5; i++) cone([(i - 2) * 0.1, 1.24, -0.1], [(i - 2) * 0.2, 0.6, -1], 0.6, 0.06, i % 2 ? '#ffa23a' : '#8a8484', { emis: i % 2 === 1 });

          // ======== GALE ========
          } else if (P === 'kite' || P === 'boxkite' || P === 'dragonkite') { const k = P === 'kite' ? 0 : P === 'boxkite' ? 1 : 2, cy = [0.9, 1.1, 1.2][k], paper = hexMix(bd, '#ffffff', 0.3);
            if (k === 0) { plate([[0, cy + 0.4, 0], [0.3, cy, 0], [0, cy - 0.5, 0], [-0.3, cy, 0]], 0.025, paper, { edge: ac }); tube([[0, cy + 0.4, 0.02], [0, cy - 0.5, 0.02]], [0.012, 0.012], '#8a6a42', { cap0: 'none', cap1: 'none' }); tube([[-0.3, cy, 0.02], [0.3, cy, 0.02]], [0.012, 0.012], '#8a6a42', { cap0: 'none', cap1: 'none' }); look(0.1, cy + 0.08, 0.04, 0.06); smile(cy - 0.08, 0.04, 0.05); }
            else if (k === 1) { for (const y of [cy + 0.24, cy - 0.24]) for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4, b = a + Math.PI / 2; plate([[Math.cos(a) * 0.3, y + 0.14, Math.sin(a) * 0.3], [Math.cos(b) * 0.3, y + 0.14, Math.sin(b) * 0.3], [Math.cos(b) * 0.3, y - 0.14, Math.sin(b) * 0.3], [Math.cos(a) * 0.3, y - 0.14, Math.sin(a) * 0.3]], 0.015, i % 2 ? paper : ac); }
              for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; tube([[Math.cos(a) * 0.3, cy + 0.4, Math.sin(a) * 0.3], [Math.cos(a) * 0.3, cy - 0.4, Math.sin(a) * 0.3]], [0.012, 0.012], '#8a6a42', { cap0: 'none', cap1: 'none' }); } look(0.1, cy + 0.26, 0.22, 0.06, { brow: dk }); smile(cy + 0.14, 0.22, 0.05); }
            else { B(1, 'head', [0, cy, 0.2]); blob(-0.34, cy - 0.3, -0.1, 0.34, cy + 0.34, 0.5, 0.6, '#d8302a', { under: '#e2b84a' }); for (const sd of [-1, 1]) { plate([[sd * 0.3, cy + 0.1, 0.1], [sd * 0.62, cy + 0.4, 0.0], [sd * 0.5, cy - 0.1, 0.0]], 0.02, '#e2b84a'); curl([sd * 0.2, cy + 0.32, 0.2], [sd * 0.3, 1, -0.4], 0.4, 0.05, '#e2b84a', [0, 0, -0.4]); }
              look(0.14, cy + 0.1, 0.46, 0.08, { brow: '#7a1a10' }); for (let i = 0; i < 6; i++) cone([(i - 2.5) * 0.08, cy - 0.16, 0.48], [0, -1, 0.1], 0.08, 0.02, '#f4f0e6'); bone = 0; }
            const tl = [[0, cy - (k === 1 ? 0.4 : 0.5), 0]]; for (let i = 1; i <= (k === 2 ? 14 : 8); i++) tl.push([Math.sin(i * 0.9) * 0.1 * i / 4, tl[0][1] - i * (k === 2 ? 0.06 : 0.07), -i * (k === 2 ? 0.14 : 0.06)]);
            B(6, 'tail', tl[0]); tube(tl, tl.map((_, i) => k === 2 ? 0.12 * (1 - i / 16) : 0.008), k === 2 ? '#d8302a' : '#8a6a42', { cap0: 'none', cap1: 'round', shade: k === 2 ? (p, nx, ny, nz, t) => U.hexToRgb(Math.floor(t * 14) % 2 ? '#e2b84a' : '#d8302a') : undefined });
            if (k < 2) for (let i = 2; i < tl.length; i += 2) { const p = tl[i]; plate([[p[0] - 0.08, p[1] + 0.04, p[2]], [p[0] + 0.08, p[1] - 0.04, p[2]], [p[0] + 0.08, p[1] + 0.04, p[2]], [p[0] - 0.08, p[1] - 0.04, p[2]]], 0.015, i % 4 ? ac : paper); } bone = 0; hover = 0.5;
          } else if (P === 'balloonlet' || P === 'hotairballoon') { const big = P === 'hotairballoon', cy = big ? 1.5 : 1.0, R = big ? 0.6 : 0.3, cols = [ac, '#f2d23a', '#e85a5a', '#5aa8e8'];
            for (let i = 0; i < 8; i++) { const a0 = i / 8 * Math.PI * 2, a1 = (i + 1) / 8 * Math.PI * 2; const pts = []; for (let j = 0; j <= 6; j++) { const v = j / 6 * Math.PI - Math.PI / 2, rr = Math.cos(v) * R * (v < 0 ? 0.6 + 0.4 * (1 + Math.sin(v)) : 1); pts.push([Math.cos(a0) * rr, cy + Math.sin(v) * R * 1.1, Math.sin(a0) * rr]); } for (let j = 6; j >= 0; j--) { const v = j / 6 * Math.PI - Math.PI / 2, rr = Math.cos(v) * R * (v < 0 ? 0.6 + 0.4 * (1 + Math.sin(v)) : 1); pts.push([Math.cos(a1) * rr, cy + Math.sin(v) * R * 1.1, Math.sin(a1) * rr]); } for (let j = 0; j < 6; j++) plate([pts[j], pts[j + 1], pts[13 - j - 1], pts[13 - j]], 0.012, cols[i % (big ? 4 : 2)]); }
            ball(0, cy, 0, R * 0.96, cols[0], { n: 3 }); look(R * 0.32, cy + R * 0.1, R * 0.92, R * 0.14); smile(cy - R * 0.24, R * 0.98, R * 0.12);
            if (big) { for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; tube([[Math.cos(a) * R * 0.5, cy - R * 0.9, Math.sin(a) * R * 0.5], [Math.cos(a) * 0.2, cy - R * 1.7, Math.sin(a) * 0.2]], [0.01, 0.01], '#8a6a42', { cap0: 'none', cap1: 'none' }); } blob(-0.22, cy - R * 2.1, -0.22, 0.22, cy - R * 1.7, 0.22, 0.4, '#8a6a42'); ball(0, cy - R * 1.3, 0, 0.08, '#ffa23a', { emis: true, n: 2 }); } else tube([[0, cy - R, 0], [0.04, cy - R - 0.3, 0.02], [0, cy - R - 0.5, 0]], [0.008, 0.006, 0.004], dk, { cap0: 'none', cap1: 'none' });
          } else if (P === 'windchime') { const wood = '#8a6a42'; blob(-0.26, 1.5, -0.26, 0.26, 1.6, 0.26, 0.6, wood); look(0.08, 1.56, 0.25, 0.04); smile(1.53, 0.26, 0.04); B(6, 'spin', [0, 1.5, 0], { speed: 0.5 });
            for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, x = Math.cos(a) * 0.2, z = Math.sin(a) * 0.2, len = 0.4 + (i % 3) * 0.16; tube([[x, 1.5, z], [x, 1.36, z]], [0.004, 0.004], '#c8c0b0', { cap0: 'none', cap1: 'none' }); tube([[x, 1.36, z], [x, 1.36 - len, z]], [0.03, 0.03], '#c8d8e8', { cap0: 'flat', cap1: 'flat' }); }
            tube([[0, 1.5, 0], [0, 0.8, 0]], [0.004, 0.004], '#c8c0b0', { cap0: 'none', cap1: 'none' }); plate([[-0.12, 0.8, 0], [0.12, 0.8, 0], [0.1, 0.5, 0], [-0.1, 0.5, 0]], 0.012, ac); bone = 0; hover = 0.3;

          // ======== FROST ========
          } else if (P === 'snowflake' || P === 'crystalflake' || P === 'blizzardstar') { const k = P === 'snowflake' ? 0 : P === 'crystalflake' ? 1 : 2, cy = [0.9, 1.1, 1.3][k], R = [0.36, 0.56, 0.8][k];
            spin([0, cy, 0], [0.6, 0.5, 0.4][k]); flake(0, cy, -0.02, R, k ? '#9ad8ff' : '#eaf6ff', { emis: k > 0 }); if (k === 2) { flake(0, cy, -0.06, R * 0.7, '#ffffff', { emis: true }); orbit(0, cy, -0.1, R * 1.3, 8, (x, y, z) => flake(x, y, z, 0.1, '#eaf6ff')); } bone = 0;
            ball(0, cy, 0.02, R * 0.26, '#eaf6ff', { n: 3 }); look(R * 0.1, cy + R * 0.03, R * 0.24, R * 0.08, { col: k === 2 ? '#9ad8ff' : null, glow: k === 2 }); smile(cy - R * 0.1, R * 0.26, R * 0.06);
          } else if (P === 'frostbreath' || P === 'frostghost') { const big = P === 'frostghost', cy = big ? 1.1 : 0.8;
            for (const [x, y, z, r] of (big ? [[0, 0.2, 0, 0.36], [-0.3, 0.08, -0.04, 0.24], [0.3, 0.06, -0.04, 0.24], [0, 0.4, -0.08, 0.3]] : [[0, 0.1, 0, 0.24], [-0.18, 0.02, 0, 0.16], [0.18, 0.02, 0, 0.16]])) ball(x, cy + y, z, r, '#eef6ff', { n: 3 });
            look(big ? 0.12 : 0.09, cy + (big ? 0.24 : 0.12), big ? 0.32 : 0.22, big ? 0.06 : 0.05, { col: glw, glow: big }); smile(cy + (big ? 0.06 : 0.0), big ? 0.34 : 0.24, 0.06, '#7a9ab8');
            if (big) { tube([[0, cy - 0.1, -0.1], [0.1, cy - 0.4, -0.3], [-0.06, cy - 0.6, -0.5]], [0.24, 0.12, 0.01], '#eef6ff', { cap0: 'none', cap1: 'none' }); for (const sd of [-1, 1]) { tube([[sd * 0.3, cy + 0.1, 0.0], [sd * 0.54, cy - 0.06, 0.16]], [0.08, 0.04], '#eef6ff', { cap0: 'none', cap1: 'round' }); for (let i = 0; i < 3; i++) cone([sd * (0.56 + i * 0.02), cy - 0.08, 0.16 + (i - 1) * 0.04], [sd * 0.3, -1, 0.3], 0.12, 0.015, glw, { emis: true }); } for (let i = 0; i < 5; i++) cone([(i - 2) * 0.1, cy + 0.6, -0.04], [(i - 2) * 0.3, 1, -0.2], 0.2, 0.03, glw, { emis: true, segs: 4 }); }
            else tube([[0, cy - 0.04, -0.1], [0.06, cy - 0.2, -0.3], [-0.04, cy - 0.3, -0.46]], [0.14, 0.07, 0.01], '#eef6ff', { cap0: 'none', cap1: 'none' });
          } else if (P === 'auroraribbon') { const aur = ['#7ae8c8', '#7ab8f8', '#b88af8', '#f88ad8']; for (let r = 0; r < 4; r++) { const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([Math.sin(u * 4 + r) * 0.5, 0.6 + u * 1.0 + Math.sin(u * 7 + r) * 0.08, Math.cos(u * 3 + r) * 0.3 - r * 0.06]); } for (let i = 0; i < 12; i++) plate([pts[i], pts[i + 1], [pts[i + 1][0], pts[i + 1][1] - 0.2, pts[i + 1][2]], [pts[i][0], pts[i][1] - 0.2, pts[i][2]]], 0.01, aur[r], { emis: true }); }
            ball(0, 1.3, 0.2, 0.16, '#eef6ff', { n: 3 }); look(0.07, 1.33, 0.33, 0.045, { col: aur[1], glow: true }); smile(1.24, 0.35, 0.04); hover = 0.3;

          // ======== SPARK ========
          } else if (P === 'plasmabead' || P === 'teslaorb' || P === 'stormeye') { const k = P === 'plasmabead' ? 0 : P === 'teslaorb' ? 1 : 2, cy = [0.8, 1.0, 1.2][k], R = [0.2, 0.3, 0.42][k];
            if (k < 2) { ball(0, cy, 0, R, hexMix(bd, '#ffffff', 0.4), { n: 3 }); ball(0, cy, 0, R * 0.6, glw, { emis: true, n: 2 }); look(R * 0.36, cy + R * 0.1, R * 0.84, R * 0.2); smile(cy - R * 0.36, R * 0.94, R * 0.16); }
            else { ball(0, cy, 0, R, '#2a2e38', { n: 3 }); ball(0, cy, R * 0.6, R * 0.5, '#f4f8ff', { n: 3 }); ball(0, cy, R * 0.96, R * 0.28, glw, { emis: true, n: 2 }); ball(0, cy, R * 1.12, R * 0.12, '#0a0810', { n: 2 }); blob(-R * 0.6, cy + R * 0.36, R * 0.5, R * 0.6, cy + R * 0.56, R * 0.9, 0.5, '#2a2e38', { n: 2 }); } // one great eye in the storm
            spin([0, cy, 0], 1.6); for (let r = 0; r < k + 1; r++) ring(0, cy, 0, R * (1.4 + r * 0.3), R * (0.5 + r * 0.4), 0.015, glw, { emis: true }); if (k >= 1) orbit(0, cy, 0, R * 1.6, 4 + 2 * k, (x, y, z, a) => tube([[x, y, z], [x + Math.cos(a + 0.6) * 0.14, y + 0.1, z + Math.sin(a + 0.6) * 0.14], [x + Math.cos(a) * 0.24, y - 0.04, z + Math.sin(a) * 0.24]], [0.015, 0.012, 0.006], glw, { emis: true, cap0: 'round', cap1: 'round' })); bone = 0;
            if (k === 2) for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; ball(Math.cos(a) * R * 1.3, cy + Math.sin(a) * R * 1.3, -R * 0.4, R * 0.36, '#4a5060', { n: 2 }); }
          } else if (P === 'bulbimp' || P === 'bulbchandelier') { const big = P === 'bulbchandelier', brass = '#c8a050', glass = '#fff6d0';
            const bulb = (x, y, z, r, face) => { ball(x, y, z, r, glass, { emis: true, n: 3 }); tube([[x, y - r * 0.6, z], [x, y - r * 1.2, z]], [r * 0.45, r * 0.4], brass, { cap0: 'none', cap1: 'flat' }); for (let i = 0; i < 3; i++) hring(x, y - r * 0.7 - i * r * 0.16, z, r * 0.47, r * 0.04, '#8a7030'); if (face) { look(r * 0.34, y + r * 0.1, z + r * 0.84, r * 0.2, { col: '#3a3230' }); smile(y - r * 0.3, z + r * 0.92, r * 0.16, '#8a7030'); } };
            if (!big) { const cy = 0.9; bulb(0, cy + 0.06, 0, 0.26, true); for (let i = 0; i < 3; i++) tube([[(i - 1) * 0.04, cy + 0.02, 0.1], [(i - 1) * 0.06, cy + 0.12, 0.16]], [0.006, 0.006], '#f2a23a', { emis: true, cap0: 'none', cap1: 'none' }); }
            else { const cy = 1.3; ball(0, cy + 0.3, 0, 0.2, brass, { n: 3 }); look(0.08, cy + 0.32, 0.18, 0.05, { col: glw, glow: true }); tube([[0, cy + 0.5, 0], [0, cy + 1.0, 0]], [0.02, 0.02], brass, { cap0: 'none', cap1: 'none' }); hring(0, cy, 0, 0.56, 0.035, brass); spin([0, cy, 0], 0.4);
              for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; tube([[Math.cos(a) * 0.14, cy + 0.24, Math.sin(a) * 0.14], [Math.cos(a) * 0.56, cy, Math.sin(a) * 0.56]], [0.02, 0.02], brass, { cap0: 'none', cap1: 'none' }); bulb(Math.cos(a) * 0.56, cy + 0.3, Math.sin(a) * 0.56, 0.12, false); } bone = 0; for (let i = 0; i < 5; i++) { const a = i * 1.26; tube([[Math.cos(a) * 0.3, cy - 0.04, Math.sin(a) * 0.3], [Math.cos(a) * 0.32, cy - 0.3 - (i % 2) * 0.1, Math.sin(a) * 0.32]], [0.008, 0.008], '#c8d8e8', { cap0: 'none', cap1: 'none' }); ball(Math.cos(a) * 0.32, cy - 0.34 - (i % 2) * 0.1, Math.sin(a) * 0.32, 0.03, '#eaf8ff', { emis: true, n: 1 }); } }
          } else if (P === 'magnet') { const red = '#d83a3a', steel = '#c8ccd4', pts = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * (i / 10); pts.push([Math.cos(a) * 0.3, 1.0 + Math.sin(a) * 0.3, 0]); } tube(pts, pts.map(() => 0.12), red, { cap0: 'none', cap1: 'none' }); for (const sd of [-1, 1]) tube([[sd * 0.3, 1.0, 0], [sd * 0.3, 0.76, 0]], [0.12, 0.12], red, { cap0: 'none', cap1: 'none' }); for (const sd of [-1, 1]) tube([[sd * 0.3, 0.76, 0], [sd * 0.3, 0.6, 0]], [0.12, 0.12], steel, { cap0: 'none', cap1: 'flat' });
            look(0.1, 1.28, 0.1, 0.06); smile(1.16, 0.12, 0.05, '#7a1a1a'); for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) tube([[sd * 0.3, 0.56, 0], [sd * (0.3 - 0.1 - i * 0.04), 0.4 - i * 0.06, 0.06], [0, 0.34 - i * 0.08, 0.08]], [0.008, 0.008, 0.008], glw, { emis: true, cap0: 'none', cap1: 'none' });

          // ======== VOID ========
          } else if (P === 'floateye' || P === 'eyecluster' || P === 'watcher') { const k = P === 'floateye' ? 0 : P === 'eyecluster' ? 1 : 2, cy = [0.9, 1.0, 1.3][k], R = [0.24, 0.26, 0.42][k];
            const eye = (x, y, z, r, iris) => { ball(x, y, z, r, '#f2ecf4', { n: 3 }); ball(x, y, z + r * 0.62, r * 0.55, iris || ac, { emis: true, n: 2 }); ball(x, y, z + r * 0.86, r * 0.28, '#0a0810', { n: 2 }); ball(x - r * 0.2, y + r * 0.3, z + r * 0.88, r * 0.12, '#ffffff', { emis: true, n: 1 }); blob(x - r * 1.05, y + r * 0.3, z - r * 1.05, x + r * 1.05, y + r * 1.05, z + r * 0.9, 1, hexMix(bd, dk, 0.5), { n: 2 }); };
            eye(0, cy, 0, R, k === 2 ? glw : ac);
            if (k === 0) { tube([[0, cy - R, -0.06], [0.06, cy - R - 0.3, -0.16], [-0.04, cy - R - 0.5, -0.24]], [0.08, 0.05, 0.01], hexMix(bd, dk, 0.5), { cap0: 'none', cap1: 'none' }); }
            if (k === 1) { for (const [x, y, z, r] of [[-0.3, 0.16, -0.06, 0.13], [0.3, 0.12, -0.04, 0.14], [-0.16, -0.24, 0.02, 0.1], [0.2, -0.24, 0.0, 0.11], [0.0, 0.34, -0.1, 0.1]]) eye(x, cy + y, z, r); }
            if (k === 2) { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; cone([Math.cos(a) * R, cy + Math.sin(a) * R, -R * 0.2], [Math.cos(a), Math.sin(a), -0.3], 0.4 + (i % 2) * 0.2, 0.08, hexMix(bd, dk, 0.6)); } spin([0, cy, 0], 0.6); orbit(0, cy, 0, R * 2.1, 6, (x, y, z) => eye(x, y, z, 0.1, glw)); bone = 0; for (let i = 0; i < 3; i++) ring(0, cy, -0.1, R * (1.5 + i * 0.25), R * (1.5 + i * 0.25), 0.012, ac, { emis: true }); }
          } else if (P === 'hollowmask' || P === 'cloakedmask') { const big = P === 'cloakedmask', cy = big ? 1.3 : 0.9, bone2 = '#f2ecdc';
            blob(-0.24, cy - 0.3, 0.0, 0.24, cy + 0.3, 0.14, 0.9, bone2); for (const sd of [-1, 1]) { blob(sd * 0.1 - 0.06, cy + 0.02, 0.1, sd * 0.1 + 0.06, cy + 0.12, 0.15, 0.6, '#0a0810', { n: 1 }); ball(sd * 0.1, cy + 0.07, 0.13, 0.025, glw, { emis: true, n: 1 }); } tube([[-0.1, cy - 0.16, 0.13], [0, cy - 0.12, 0.15], [0.1, cy - 0.16, 0.13]], [0.012, 0.012, 0.012], '#0a0810', { cap0: 'round', cap1: 'round' }); for (const sd of [-1, 1]) tube([[sd * 0.14, cy + 0.2, 0.12], [sd * 0.06, cy + 0.16, 0.14]], [0.01, 0.01], ac, { cap0: 'round', cap1: 'round' });
            if (big) { blob(-0.36, cy - 0.3, -0.36, 0.36, cy + 0.42, 0.1, 1, hexMix(bd, dk, 0.5)); tube([[0, cy - 0.2, -0.1], [0, cy - 0.9, -0.1], [0, cy - 1.2, -0.2]], [0.36, 0.28, 0.01], hexMix(bd, dk, 0.5), { cap0: 'none', cap1: 'none' }); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; cone([Math.cos(a) * 0.26, cy - 0.9, Math.sin(a) * 0.26 - 0.1], [Math.cos(a) * 0.3, -1, Math.sin(a) * 0.3], 0.24, 0.06, hexMix(bd, dk, 0.5)); } for (const sd of [-1, 1]) { tube([[sd * 0.3, cy - 0.2, 0.0], [sd * 0.5, cy - 0.4, 0.2]], [0.06, 0.03], hexMix(bd, dk, 0.5), { cap0: 'none', cap1: 'round' }); ball(sd * 0.52, cy - 0.42, 0.22, 0.05, bone2, { n: 2 }); } }
            else for (let i = 0; i < 4; i++) tube([[(i - 1.5) * 0.1, cy - 0.28, 0.04], [(i - 1.5) * 0.12, cy - 0.5, -0.02], [(i - 1.5) * 0.1, cy - 0.66, -0.08]], [0.03, 0.02, 0.004], hexMix(bd, dk, 0.5), { cap0: 'none', cap1: 'none' });
          } else if (P === 'blackhole') { const cy = 1.0; ball(0, cy, 0, 0.26, '#06040a', { n: 3 }); spin([0, cy, 0], 1.0); for (let i = 0; i < 4; i++) hring(0, cy, 0, 0.34 + i * 0.1, 0.03 - i * 0.004, ['#ffd25a', '#ff8a3a', '#b84ac8', '#5a3ac8'][i], { emis: true }); orbit(0, cy, 0, 0.8, 5, (x, y, z) => blob(x - 0.06, y - 0.05, z - 0.06, x + 0.06, y + 0.05, z + 0.06, 0.4, '#5a4a44', { n: 1 })); bone = 0;
            for (const sd of [-1, 1]) { ball(sd * 0.1, cy + 0.06, 0.22, 0.05, '#f2ecf4', { emis: true, n: 2 }); ball(sd * 0.1, cy + 0.06, 0.26, 0.025, '#06040a', { n: 1 }); } ring(0, cy, 0.1, 0.32, 0.32, 0.02, '#ffd25a', { emis: true });

          // ======== LIGHT ========
          } else if (P === 'halosprite' || P === 'wingedorb' || P === 'seraph') { const k = P === 'halosprite' ? 0 : P === 'wingedorb' ? 1 : 2, cy = [0.9, 1.1, 1.4][k], R = [0.22, 0.28, 0.32][k], gold = '#ffd25a', white = '#fbfaf6';
            ball(0, cy, 0, R, white, { n: 3 }); ball(0, cy, 0, R * 0.7, '#fff3c0', { emis: true, n: 2 }); look(R * 0.36, cy + R * 0.1, R * 0.84, R * 0.2, { col: k === 2 ? gold : null, glow: k === 2 }); smile(cy - R * 0.36, R * 0.94, R * 0.16, '#c8a050');
            hring(0, cy + R * 1.4, 0, R * 0.7, 0.025, gold, { emis: true });
            if (k >= 1) for (const sd of [-1, 1]) { B(sd < 0 ? 7 : 8, 'wing', [sd * R * 0.9, cy, -0.04], { side: sd, fold: 0 }); for (let i = 0; i < 5; i++) plate([[sd * R * 0.9, cy + 0.04, -0.04], [sd * (R + 0.3 + i * 0.1), cy + 0.36 - i * 0.12, -0.1], [sd * (R + 0.22 + i * 0.1), cy + 0.22 - i * 0.12, -0.08]], 0.015, i % 2 ? white : '#fff3c0', { emis: true }); bone = 0; }
            if (k === 2) { spin([0, cy, 0], 0.5); for (let r = 0; r < 3; r++) { const rr = 0.6 + r * 0.22; if (r === 1) hring(0, cy, 0, rr, 0.03, gold, { emis: true }); else ring(0, cy, 0, rr, rr * (r === 0 ? 1 : 0.6), 0.03, gold, { emis: true }); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + r; const p = r === 1 ? [Math.cos(a) * rr, cy, Math.sin(a) * rr] : [Math.cos(a) * rr, cy + Math.sin(a) * rr * (r === 0 ? 1 : 0.6), 0]; ball(p[0], p[1], p[2], 0.04, '#f2ecf4', { n: 2 }); ball(p[0], p[1], p[2] + 0.03, 0.02, gold, { emis: true, n: 1 }); } } bone = 0; }
          } else if (P === 'twinkle' || P === 'star') { const big = P === 'star', cy = big ? 1.1 : 0.9, R = big ? 0.56 : 0.3; spin([0, cy, 0], big ? 0.3 : 0.5); star(0, cy, 0, R, R * 0.45, big ? 5 : 4, '#ffe45a', { emis: true, t: R * 0.2 }); bone = 0;
            look(R * 0.2, cy + R * 0.08, R * 0.24, R * 0.12, { col: '#c8902a' }); smile(cy - R * 0.14, R * 0.26, R * 0.1, '#c8902a'); if (big) for (const sd of [-1, 1]) ball(sd * R * 0.3, cy - R * 0.08, R * 0.22, R * 0.07, '#ffb0a0', { n: 1 }); for (let i = 0; i < (big ? 6 : 3); i++) { const a = i * 1.1; star(Math.cos(a) * R * 1.4, cy + Math.sin(a) * R * 1.2, -0.1, 0.06, 0.025, 4, '#fff6c0', { emis: true, t: 0.015 }); }
          } else if (P === 'crescentmoon') { const moon = '#f2ecc8', pts = [], rr = []; for (let i = 0; i <= 16; i++) { const u = i / 16, a = Math.PI * 0.5 + u * Math.PI; pts.push([Math.cos(a) * 0.46, 1.1 + Math.sin(a) * 0.46, 0]); rr.push(0.02 + 0.2 * Math.sin(u * Math.PI)); } tube(pts, rr, moon, { cap0: 'round', cap1: 'round', emis: true }); // a crescent seen side on, its face along the thick of the curve
            const fx = -0.46, fy = 1.1; ball(fx + 0.06, fy + 0.1, 0.16, 0.05, '#16121e', { n: 2 }); ball(fx + 0.07, fy + 0.1, 0.2, 0.025, '#8a7a50', { n: 1 }); ball(fx + 0.05, fy + 0.12, 0.21, 0.012, '#ffffff', { emis: true, n: 1 }); tube([[fx + 0.02, fy - 0.08, 0.17], [fx + 0.1, fy - 0.12, 0.15], [fx + 0.16, fy - 0.08, 0.12]], [0.012, 0.012, 0.012], '#8a7a50', { cap0: 'round', cap1: 'round' }); ball(fx + 0.12, fy - 0.02, 0.15, 0.03, '#f4c8b0', { n: 1 });
            tube([[fx + 0.04, fy + 0.38, 0.0], [fx - 0.1, fy + 0.62, -0.04], [fx + 0.2, fy + 0.72, -0.06]], [0.08, 0.05, 0.02], '#3a4a8a', { cap0: 'none', cap1: 'none' }); ball(fx + 0.22, fy + 0.72, -0.06, 0.04, '#f2ecc8', { n: 1 }); // a nightcap
            for (let i = 0; i < 4; i++) { const a = i * 1.6; star(0.2 + Math.cos(a) * 0.4, 1.1 + Math.sin(a) * 0.4, -0.1, 0.06, 0.025, 4, '#fff6c0', { emis: true, t: 0.015 }); }
          }
          break;
        }
        // floater: a sphere with a face, orbiting stones and a wisp of a tail
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
  // outfits and gear for the folk: hats, beards, masks, packs, tools. Built with the same primitives as the bodies.
  // Landmarks of the folk model: head centre (0, 1.58, 0), radius 0.27 (0.3 tall), crown at 1.88; shoulders at (±0.33, 1.2); hands at (±0.45, 0.55, 0.06); hips 0.62.
  // part helpers bound to a model: everything is in the model's local units (scaled by m.scale); H.bone picks the bone of the next parts
  function partHelpers(m) {
    const s = m.scale; const P = m.boxes; const H = { bone: 0 };
    const S3 = (p) => [p[0] * s, p[1] * s, p[2] * s];
    H.box = (x, y, z, w, h, d, c, emis) => P.push({ x: x * s, y: y * s, z: z * s, w: w * s, h: h * s, d: d * s, c, emis, bone: H.bone });
    H.blob = (x0, y0, z0, x1, y1, z1, round, c, o) => P.push({ k: 'blob', x: Math.min(x0, x1) * s, y: Math.min(y0, y1) * s, z: Math.min(z0, z1) * s, w: Math.abs(x1 - x0) * s, h: Math.abs(y1 - y0) * s, d: Math.abs(z1 - z0) * s, round, c, emis: !!(o && o.emis), o: o || null, bone: H.bone });
    H.ball = (x, y, z, r, c, o) => H.blob(x - r, y - r, z - r, x + r, y + r, z + r, 1, c, o);
    H.tube = (path, radii, c, o) => { const pp = path.map(S3); const rr = radii.map(r => Array.isArray(r) ? [r[0] * s, r[1] * s] : [r * s, r * s]); const mr = Math.max(...rr.map(r => Math.max(r[0], r[1]))); const xs = pp.map(p => p[0]), ys = pp.map(p => p[1]), zs = pp.map(p => p[2]); const x = Math.min(...xs) - mr, y = Math.min(...ys) - mr, z = Math.min(...zs) - mr; P.push({ k: 'tube', path: pp, radii: rr, c, emis: !!(o && o.emis), o: o || null, bone: H.bone, x, y, z, w: Math.max(...xs) + mr - x, h: Math.max(...ys) + mr - y, d: Math.max(...zs) + mr - z }); };
    H.plate = (pts, t, c, o) => { const pp = pts.map(S3); const xs = pp.map(p => p[0]), ys = pp.map(p => p[1]), zs = pp.map(p => p[2]); const x = Math.min(...xs) - t, y = Math.min(...ys) - t, z = Math.min(...zs) - t; P.push({ k: 'plate', pts: pp, t: t * s, c, emis: !!(o && o.emis), o: o || null, bone: H.bone, x, y, z, w: Math.max(...xs) + t - x, h: Math.max(...ys) + t - y, d: Math.max(...zs) + t - z }); };
    H.ring = (cx, cy, cz, hx, hz, th, c, o, ax) => { const pts = []; for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2; pts.push(ax === 'z' ? [cx + Math.cos(a) * hx, cy + Math.sin(a) * hz, cz] : [cx + Math.cos(a) * hx, cy, cz + Math.sin(a) * hz]); } H.tube(pts, pts.map(() => th), c, Object.assign({ cap0: 'none', cap1: 'none', segs: 6 }, o || {})); };
    H.cone = (b, dir, len, r, c, o) => { const l = Math.hypot(dir[0], dir[1], dir[2]) || 1; const u = [dir[0] / l, dir[1] / l, dir[2] / l]; H.tube([b, [b[0] + u[0] * len * 0.5, b[1] + u[1] * len * 0.5, b[2] + u[2] * len * 0.5], [b[0] + u[0] * len, b[1] + u[1] * len, b[2] + u[2] * len]], [r, r * 0.55, 0.0005], c, Object.assign({ cap0: 'flat', cap1: 'none', segs: 6 }, o || {})); };
    H.disc = (x, y, z, r, th, c, o) => H.blob(x - r, y - th / 2, z - r, x + r, y + th / 2, z + r, 1, c, Object.assign({ n: 4 }, o || {}));
    H.faceZ = (x, y) => 0.28 * Math.sqrt(Math.max(0, 1 - (x / 0.27) ** 2 - ((y - 1.58) / 0.3) ** 2)); // the folk face is an ellipsoid: where its surface is at (x, y)
    H.ribbon = (spine, widths, c, o) => { const pp = spine.map(S3); const xs = pp.map(p => p[0]), ys = pp.map(p => p[1]), zs = pp.map(p => p[2]); const mw = Math.max(...widths) * s; P.push({ k: 'ribbon', spine: pp, widths: widths.map(w => w * s), x: Math.min(...xs) - mw, y: Math.min(...ys) - mw, z: Math.min(...zs) - mw, w: Math.max(...xs) - Math.min(...xs) + 2 * mw, h: Math.max(...ys) - Math.min(...ys) + 2 * mw, d: Math.max(...zs) - Math.min(...zs) + 2 * mw, c, emis: !!(o && o.emis), o, bone: H.bone }); };
    H.feather = (x, y, z, len, c, lean) => H.plate([[x, y, z], [x + 0.03 + lean * 0.3, y + len * 0.5, z - 0.02], [x + lean * 0.5, y + len, z - 0.06], [x - 0.03 + lean * 0.5, y + len * 0.5, z - 0.02]], 0.02, c);
    H.done = () => { m.height = Math.max(m.height, ...m.boxes.map(b => b.y + b.h)); return m; };
    return H;
  }
  // outfits and gear for the folk: hats, beards, masks, packs, tools. Built with the same primitives as the bodies.
  // Landmarks of the folk model: head centre (0, 1.58, 0), radius 0.27 (0.3 tall), crown at 1.88; shoulders at (±0.33, 1.2); hands at (±0.45, 0.55, 0.06); hips 0.62.
  function decorate(m, kind) {
    const H = partHelpers(m); const { box, blob, ball, tube, plate, ring, cone, disc, faceZ, feather } = H;
    const setB = (b) => { H.bone = b; };
    const brimHat = (c, band, crownH, crownR, brimR) => { setB(1); disc(0, 1.86, 0, brimR, 0.05, c); blob(-crownR, 1.86, -crownR, crownR, 1.86 + crownH, crownR, 0.55, c, { tap: [1, 0.85] }); if (band) ring(0, 1.93, 0, crownR + 0.01, crownR + 0.01, 0.025, band); setB(0); };
    if (kind === 'elder') {
      setB(1); disc(0, 1.86, 0, 0.5, 0.05, '#3b2a4a'); blob(-0.3, 1.86, -0.3, 0.3, 2.34, 0.3, 0.5, '#3b2a4a', { tap: [1, 0.72] }); ring(0, 1.96, 0, 0.31, 0.31, 0.03, '#e0b84a', { emis: true });
      blob(-0.17, 0.98, 0.18, 0.17, 1.44, 0.34, 0.7, '#e8e4dc', { tap: [0.55, 1.0] }); setB(0); // a long white beard
      ring(0, 1.14, 0.02, 0.28, 0.24, 0.025, '#ffd75a', { emis: true }); ball(0, 1.0, 0.25, 0.07, '#7ad7ff', { emis: true }); // chain and gem
      blob(-0.42, 0.08, -0.3, 0.42, 0.66, 0.3, 0.6, '#8a3fd0', { tap: [0.75, 1.0] }); // genie pants
    } else if (kind === 'voodoo') {
      setB(1); plate([[-0.3, 1.33, 0.22], [-0.34, 1.6, 0.2], [-0.22, 1.86, 0.18], [0.22, 1.86, 0.18], [0.34, 1.6, 0.2], [0.3, 1.33, 0.22], [0.1, 1.24, 0.24], [-0.1, 1.24, 0.24]], 0.09, '#f1e3c0'); // the mask
      ball(-0.12, 1.62, 0.31, 0.06, '#111111', { n: 2 }); ball(0.12, 1.62, 0.31, 0.06, '#111111', { n: 2 }); plate([[-0.04, 1.3, 0.3], [0.04, 1.3, 0.3], [0.03, 1.48, 0.3], [-0.03, 1.48, 0.3]], 0.015, '#c0392b'); plate([[-0.3, 1.5, 0.3], [0.3, 1.5, 0.3], [0.3, 1.46, 0.3], [-0.3, 1.46, 0.3]], 0.015, '#2b6cc0');
      for (let i = 0; i < 5; i++) feather(-0.26 + i * 0.13, 1.86, -0.08, 0.5 + (i % 2) * 0.2, i % 2 ? '#e74c3c' : '#f1c40f', (i - 2) * 0.2); setB(0);
      setB(3); tube([[0.46, 0.2, 0.1], [0.5, 2.05, 0.06]], [0.035, 0.03], '#6b4a2b', { segs: 6 }); ball(0.5, 2.14, 0.06, 0.1, '#a65cff', { emis: true }); setB(0);
    } else if (kind === 'fisher') {
      setB(1); disc(0, 1.86, 0, 0.6, 0.05, '#c9b36a'); tube([[0, 1.86, 0], [0, 2.18, 0]], [0.3, 0.12], '#c9b36a', { segs: 8, cap0: 'none', cap1: 'flat' }); setB(0);
      setB(3); tube([[0.46, 0.4, 0.1], [0.55, 2.6, 0.5]], [0.025, 0.018], '#5a3f22', { segs: 5 }); tube([[0.55, 2.6, 0.5], [0.6, 1.6, 1.2]], [0.006, 0.006], '#e8e8e8', { segs: 3 }); setB(0);
      tube([[-0.68, 0.0, 0.0], [-0.68, 0.34, 0.0]], [0.14, 0.17], '#4c6f8a', { segs: 8, cap0: 'flat', cap1: 'flat' }); // bucket
    } else if (kind === 'miner') { // a hard hat with a lamp, braces, a pick over the shoulder
      setB(1); blob(-0.32, 1.78, -0.32, 0.32, 2.08, 0.32, 0.9, '#e8b830', { tap: [1, 0.8] }); disc(0, 1.84, 0.02, 0.38, 0.04, '#d0a020'); ball(0, 1.92, 0.3, 0.07, '#fff6c0', { emis: true }); setB(0);
      plate([[-0.22, 0.66, 0.2], [-0.14, 0.66, 0.2], [-0.2, 1.22, 0.16], [-0.28, 1.2, 0.16]], 0.03, '#5a3a22'); plate([[0.14, 0.66, 0.2], [0.22, 0.66, 0.2], [0.28, 1.2, 0.16], [0.2, 1.22, 0.16]], 0.03, '#5a3a22');
      setB(3); tube([[0.42, 0.5, -0.3], [0.42, 1.75, -0.32]], [0.035, 0.03], '#7a5a3a', { segs: 6 }); blob(0.14, 1.68, -0.4, 0.72, 1.82, -0.26, 0.4, '#a0a0a8', { n: 2 }); setB(0);
    } else if (kind === 'diver') { // goggles, a tank on the back, fins
      setB(1); ring(-0.11, 1.6, 0.27, 0.09, 0.08, 0.02, '#2a2a30', null, 'z'); ring(0.11, 1.6, 0.27, 0.09, 0.08, 0.02, '#2a2a30', null, 'z'); ring(0, 1.62, 0, 0.29, 0.3, 0.018, '#2a2a30'); setB(0);
      tube([[0, 0.72, -0.32], [0, 1.3, -0.32]], [0.14, 0.14], '#e8b830', { segs: 8, cap0: 'round', cap1: 'round' }); tube([[0, 1.42, -0.32], [0, 1.5, -0.32]], [0.05, 0.05], '#a0a0a8', { segs: 6 });
      plate([[-0.28, 0.02, 0.1], [-0.04, 0.02, 0.1], [-0.02, 0.02, 0.62], [-0.3, 0.02, 0.62]], 0.025, '#2f8a8a'); plate([[0.04, 0.02, 0.1], [0.28, 0.02, 0.1], [0.3, 0.02, 0.62], [0.02, 0.02, 0.62]], 0.025, '#2f8a8a');
    } else if (kind === 'hermit') {
      setB(1); blob(-0.17, 0.95, 0.16, 0.17, 1.44, 0.34, 0.7, '#d9d4c7', { tap: [0.5, 1.0] }); blob(-0.34, 1.3, -0.4, 0.34, 2.02, 0.2, 0.85, '#5a4a3a', { tap: [1, 0.8] }); setB(0); // beard and a deep hood
      setB(3); tube([[0.46, 0.0, 0.14], [0.5, 1.6, 0.1]], [0.03, 0.035], '#8a6a3c', { segs: 5 }); setB(0);
    } else if (kind === 'traveller') {
      blob(-0.3, 0.6, -0.56, 0.3, 1.3, -0.2, 0.45, '#6b4a2b'); tube([[-0.3, 1.38, -0.4], [0.3, 1.38, -0.4]], [0.11, 0.11], '#a8894f', { segs: 8, cap0: 'flat', cap1: 'flat' }); // pack and bedroll
      setB(3); tube([[0.46, 0.0, 0.14], [0.5, 2.0, 0.1]], [0.03, 0.035], '#8a6a3c', { segs: 5 }); setB(0);
      brimHat('#4a3a2a', '#2a1a10', 0.26, 0.28, 0.46);
    } else if (kind === 'alien') { // two antennae with glowing tips, a glowing collar
      setB(1); tube([[-0.14, 1.86, -0.02], [-0.2, 2.26, -0.08]], [0.025, 0.02], '#101828', { segs: 5 }); tube([[0.14, 1.86, -0.02], [0.2, 2.26, -0.08]], [0.025, 0.02], '#101828', { segs: 5 }); ball(-0.21, 2.3, -0.09, 0.075, '#39ff14', { emis: true }); ball(0.21, 2.3, -0.09, 0.075, '#ff2bd6', { emis: true }); setB(0);
      ring(0, 1.26, 0, 0.3, 0.26, 0.035, '#00f5ff', { emis: true });
    } else if (kind === 'veil') { // Halo folk: a long head veil against the dust and a sash
      setB(1); blob(-0.36, 1.05, -0.4, 0.36, 1.92, 0.2, 0.8, '#f0e0c0', { tap: [0.9, 1.0] }); ring(0, 1.8, -0.04, 0.37, 0.33, 0.03, '#c9a45a'); setB(0);
      ring(0, 0.98, 0.02, 0.34, 0.24, 0.035, '#c9a45a');
    } else if (kind === 'merfolk') { // sea people: a fin crest, webbed fins on the arms, scales down the back
      setB(1); plate([[0, 1.84, 0.16], [0, 2.14, 0.0], [0, 2.1, -0.24], [0, 1.82, -0.32]], 0.035, '#6fd0c8', { emis: true }); setB(0);
      setB(2); plate([[-0.42, 1.1, 0], [-0.68, 0.95, -0.05], [-0.66, 0.7, -0.05], [-0.44, 0.75, 0]], 0.025, '#4aa8b8'); setB(3); plate([[0.42, 1.1, 0], [0.68, 0.95, -0.05], [0.66, 0.7, -0.05], [0.44, 0.75, 0]], 0.025, '#4aa8b8'); setB(0);
      for (let i = 0; i < 4; i++) plate([[-0.06, 0.62 + i * 0.16, -0.21], [0.06, 0.62 + i * 0.16, -0.21], [0, 0.74 + i * 0.16, -0.25]], 0.02, '#8fe0d0');
    } else if (kind === 'silas') { // Silas Pennywise: a tall hat with a gold band, a monocle on a chain, a waxed moustache, a brocade waistcoat with a watch chain, a cravat, a cane and a fat purse
      setB(1); disc(0, 1.87, 0, 0.44, 0.04, '#17171f'); blob(-0.29, 1.88, -0.29, 0.29, 2.42, 0.29, 0.4, '#1d1d28', { tap: [1, 1.04] }); ring(0, 1.98, 0, 0.3, 0.3, 0.03, '#d9b24a');
      ring(0.11, 1.6, faceZ(0.11, 1.6) + 0.03, 0.075, 0.075, 0.014, '#d9b24a', null, 'z'); tube([[0.18, 1.56, faceZ(0.18, 1.56) + 0.02], [0.26, 1.42, 0.24], [0.3, 1.3, 0.2]], [0.008, 0.008, 0.008], '#d9b24a', { segs: 4 }); // monocle and chain
      for (const sd of [-1, 1]) tube([[sd * 0.02, 1.49, faceZ(0.02, 1.49) + 0.012], [sd * 0.1, 1.5, faceZ(0.1, 1.5) + 0.012], [sd * 0.17, 1.55, faceZ(0.17, 1.55) + 0.01]], [0.022, 0.018, 0.008], '#2a1a10', { segs: 5, cap0: 'round' }); // the moustache
      setB(0);
      blob(-0.2, 1.2, 0.12, 0.2, 1.34, 0.3, 0.6, '#f1e8d8'); ball(0, 1.26, 0.3, 0.05, '#c9243a'); // cravat and pin
      for (const sd of [-1, 1]) plate([[sd * 0.05, 0.72, 0.29], [sd * 0.32, 0.78, 0.22], [sd * 0.34, 1.2, 0.22], [sd * 0.06, 1.22, 0.29]], 0.02, '#b8963c'); // the waistcoat fronts
      for (const y of [0.85, 0.98, 1.11]) ball(0.0, y, 0.3, 0.025, '#ffe08a');
      tube([[0.02, 1.0, 0.3], [0.15, 0.92, 0.3], [0.28, 0.86, 0.26]], [0.009, 0.009, 0.009], '#ffd75a', { segs: 4 }); ball(0.29, 0.84, 0.26, 0.04, '#ffd75a'); // watch chain and watch
      blob(-0.4, 0.5, 0.02, -0.18, 0.72, 0.26, 0.6, '#5a3a22'); ring(-0.29, 0.7, 0.14, 0.09, 0.1, 0.02, '#c9a45a'); // the purse on the hip
      setB(3); tube([[0.46, 0.55, 0.12], [0.52, 0.0, 0.22]], [0.022, 0.02], '#2a1a10', { segs: 6 }); ball(0.45, 0.58, 0.11, 0.05, '#d9b24a'); setB(0); // the cane
    } else if (kind === 'professor') { // Professor Finch, on top of the scientist's coat: wild white hair, round spectacles, a bow tie, pens in the pocket, a wrench in hand
      setB(1); for (const [x, y, z] of [[-0.26, 1.72, -0.06], [0.26, 1.7, -0.08], [-0.14, 1.84, -0.2], [0.16, 1.86, -0.18], [0, 1.9, -0.26]]) blob(x - 0.1, y - 0.07, z - 0.1, x + 0.1, y + 0.1, z + 0.1, 0.9, '#f2f2ee', { n: 1 });
      for (const sd of [-1, 1]) ring(sd * 0.11, 1.6, faceZ(0.11, 1.6) + 0.03, 0.08, 0.075, 0.012, '#8a7a4a', null, 'z'); tube([[-0.03, 1.6, faceZ(0.03, 1.6) + 0.03], [0.03, 1.6, faceZ(0.03, 1.6) + 0.03]], [0.008, 0.008], '#8a7a4a', { segs: 4 });
      setB(0);
      for (const sd of [-1, 1]) blob(sd * 0.02, 1.2, 0.26, sd * 0.16, 1.3, 0.3, 0.6, '#3a5fb0'); ball(0, 1.25, 0.29, 0.03, '#2a3a70'); // bow tie
      for (let i = 0; i < 3; i++) tube([[-0.24 + i * 0.05, 1.02, 0.29], [-0.24 + i * 0.05, 1.16, 0.29]], [0.012, 0.012], ['#c9243a', '#2a6fc0', '#2a2a30'][i], { segs: 4 }); // pens
      setB(3); tube([[0.46, 0.55, 0.14], [0.5, 0.3, 0.3]], [0.025, 0.02], '#8a8a94', { segs: 6 }); plate([[0.46, 0.3, 0.3], [0.56, 0.22, 0.36], [0.5, 0.12, 0.3], [0.42, 0.18, 0.26]], 0.03, '#8a8a94'); setB(0); // the wrench
    } else if (kind === 'hat') { brimHat('#5a3a22', '#2a1a10', 0.3, 0.28, 0.55);
    } else if (kind === 'star') { ball(-0.2, 1.05, 0.2, 0.06, '#ffd75a', { emis: true });
    } else if (kind === 'warrior') { // war paint, a feathered band, a bead necklace, a spear
      setB(1); for (const sd of [-1, 1]) { const x = sd * 0.16; for (const yy of [1.5, 1.44]) plate([[x - 0.08, yy, faceZ(x - 0.08, yy) + 0.006], [x + 0.08, yy, faceZ(x + 0.08, yy) + 0.006], [x + 0.08, yy - 0.03, faceZ(x + 0.08, yy - 0.03) + 0.006], [x - 0.08, yy - 0.03, faceZ(x - 0.08, yy - 0.03) + 0.006]], 0.01, yy > 1.47 ? '#e0302a' : '#f0e0a0'); }
      ring(0, 1.74, -0.02, 0.3, 0.31, 0.035, '#8a2a1a'); for (let i = 0; i < 3; i++) feather(-0.12 + i * 0.12, 1.78, -0.26, 0.5 + (i % 2) * 0.15, i % 2 ? '#f0e0a0' : '#e0302a', (i - 1) * 0.25); setB(0);
      for (let i = 0; i < 7; i++) { const a = -1.2 + i * 0.4; ball(Math.sin(a) * 0.24, 1.12 - Math.cos(a) * 0.1, Math.cos(a) * 0.22, 0.03, i % 2 ? '#f0e0a0' : '#2a6fc0', { n: 1 }); }
      setB(3); tube([[0.46, 0.0, 0.14], [0.5, 2.3, 0.08]], [0.028, 0.025], '#6b4a2b', { segs: 6 }); plate([[0.5, 2.3, 0.08], [0.56, 2.42, 0.08], [0.5, 2.68, 0.08], [0.44, 2.42, 0.08]], 0.02, '#c8c8d0'); setB(0);
    } else if (kind === 'scientist') { // a long coat, goggles pushed up, a clipboard
      blob(-0.36, 0.26, -0.26, 0.36, 1.3, 0.26, 0.45, '#e8e8f0', { tap: [1.05, 0.9] }); plate([[-0.04, 0.3, 0.27], [0.04, 0.3, 0.27], [0.04, 1.2, 0.26], [-0.04, 1.2, 0.26]], 0.012, '#c8c8d8');
      setB(1); ring(-0.11, 1.8, 0.2, 0.08, 0.07, 0.02, '#3a3a4a', null, 'z'); ring(0.11, 1.8, 0.2, 0.08, 0.07, 0.02, '#3a3a4a', null, 'z'); ball(-0.11, 1.8, 0.2, 0.065, '#7ad7ff', { emis: true, n: 2 }); ball(0.11, 1.8, 0.2, 0.065, '#7ad7ff', { emis: true, n: 2 }); setB(0);
      setB(2); plate([[-0.5, 0.56, 0.12], [-0.3, 0.56, 0.16], [-0.3, 0.9, 0.16], [-0.5, 0.9, 0.12]], 0.02, '#c9a45a'); setB(0);
    } else if (kind === 'lamp') { // a miner's helmet with a lamp
      setB(1); blob(-0.32, 1.78, -0.32, 0.32, 2.06, 0.32, 0.9, '#c9b36a', { tap: [1, 0.8] }); ball(0, 1.9, 0.3, 0.07, '#fff2a0', { emis: true }); setB(0);
    } else if (kind === 'mask') { // a diver's mask and a tank
      setB(1); plate([[-0.22, 1.5, 0.27], [0.22, 1.5, 0.27], [0.24, 1.7, 0.25], [-0.24, 1.7, 0.25]], 0.03, '#9fd8ff', { emis: true }); ring(0, 1.6, 0, 0.29, 0.3, 0.018, '#2a2a30'); setB(0);
      tube([[0, 0.72, -0.32], [0, 1.32, -0.32]], [0.14, 0.14], '#b8bcc4', { segs: 8, cap0: 'round', cap1: 'round' });
    } else if (kind === 'visor') { // a round helmet with a glowing visor, a pack
      setB(1); blob(-0.34, 1.26, -0.34, 0.34, 1.98, 0.34, 0.95, '#e8f0ff'); plate([[-0.24, 1.46, 0.33], [0.24, 1.46, 0.33], [0.26, 1.7, 0.3], [-0.26, 1.7, 0.3]], 0.03, '#7ad7ff', { emis: true }); setB(0);
      blob(-0.22, 0.7, -0.5, 0.22, 1.3, -0.3, 0.4, '#b8c4d8');
    } else if (kind === 'crown') { // a crown and a cape
      setB(1); ring(0, 1.9, -0.02, 0.27, 0.28, 0.05, '#ffd25a', { emis: true }); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; cone([Math.cos(a) * 0.26, 1.92, -0.02 + Math.sin(a) * 0.27], [Math.cos(a) * 0.15, 1, Math.sin(a) * 0.15], 0.2, 0.045, '#ffe08a', { emis: true }); } setB(0);
      plate([[-0.36, 1.22, -0.3], [0.36, 1.22, -0.3], [0.42, 0.25, -0.42], [-0.42, 0.25, -0.42]], 0.03, '#5a1a8a');
    } else if (kind === 'wanderer') { // a satchel on a strap, a scarf
      blob(-0.5, 0.6, -0.14, -0.2, 0.92, 0.2, 0.35, '#6b4a2b'); tube([[0.3, 1.26, 0.1], [-0.32, 0.9, 0.2]], [0.025, 0.025], '#4a3018', { segs: 4 });
      ring(0, 1.25, 0, 0.26, 0.24, 0.06, '#c94c4c'); plate([[-0.12, 1.2, -0.26], [0.0, 1.2, -0.3], [0.04, 0.8, -0.36], [-0.1, 0.8, -0.34]], 0.03, '#c94c4c');
    }
    return H.done();
  }
  // ---- what a Kin wears: scarves, coats, hats and prizes, cut to its own shape and bound to its bones so they move with it ----
  // landmarks come from the parts themselves: the head's box (bone 1) and the body's (bone 0); a shape without a head uses the top of its body
  function landmarks(m) {
    const bb = (pred) => { let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9, n = 0; for (const b of m.boxes) { if (!pred(b)) continue; n++; x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); z0 = Math.min(z0, b.z); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); z1 = Math.max(z1, b.z + b.d); } return n ? { x0, y0, z0, x1, y1, z1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, cz: (z0 + z1) / 2, w: x1 - x0, h: y1 - y0, d: z1 - z0 } : null; };
    const headIdx = m.bones.findIndex(b => b && b.kind === 'head');
    const body = bb(b => (b.bone || 0) === 0) || bb(() => true); let head = headIdx > 0 ? bb(b => b.bone === headIdx) : null;
    if (!head || head.w < 0.08) { // no head of its own: the top of the body's main mass stands in for it (horns and spines do not count)
      const bp = m.boxes.filter(b => (b.bone || 0) === 0); const big = Math.max(...bp.map(b => b.w * b.d)); let t = body.y1; { let tt = -1e9; for (const b of bp) if (b.w * b.d >= big * 0.3) tt = Math.max(tt, b.y + b.h); if (tt > -1e8) t = tt; }
      head = { x0: body.cx - body.w * 0.3, x1: body.cx + body.w * 0.3, y0: t - body.h * 0.35, y1: t, z0: body.cz, z1: body.z1, cx: body.cx, cy: t - body.h * 0.17, cz: body.cz + body.d * 0.25, w: body.w * 0.6, h: body.h * 0.35, d: body.d * 0.5, bone: 0, fake: true }; } else head.bone = headIdx;
    // the crown of the head: the top of its main mass, not of a horn, an ear or a halo. Parts with a small footprint do not count
    if (!head.fake) { const hp = m.boxes.filter(b => b.bone === headIdx); const big = Math.max(...hp.map(b => b.w * b.d)); let t = -1e9, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const b of hp) if (b.w * b.d >= big * 0.3) { t = Math.max(t, b.y + b.h); x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.w); z0 = Math.min(z0, b.z); z1 = Math.max(z1, b.z + b.d); } if (t > -1e8) { head.y1 = t; head.x0 = x0; head.x1 = x1; head.z0 = z0; head.z1 = z1; head.w = x1 - x0; head.d = z1 - z0; head.cx = (x0 + x1) / 2; head.cz = (z0 + z1) / 2; head.h = head.y1 - head.y0; head.cy = (head.y0 + head.y1) / 2; } }
    const hr = Math.max(0.08, Math.max(head.w, head.d) / 2); // the head's radius
    const neck = head.fake ? { x: body.cx, y: body.y1 - body.h * 0.3, z: body.cz + body.d * 0.1 } : { x: head.cx, y: Math.max(head.y0, body.y1 - 0.08), z: head.cz - head.d * 0.15 }; // where a collar sits
    const nr = head.fake ? Math.max(body.w, body.d) * 0.42 : Math.max(0.08, Math.min(hr * 0.95, Math.max(body.w, body.d) * 0.45)); // and how wide
    return { body, head, hr, neck, nr };
  }
  function dress(m, wear) {
    if (!wear || !wear.item || wear.item === 'none') return m;
    const L = landmarks(m); const { body, head, hr, neck, nr } = L; const col = wear.col || '#c94c4c'; const dark = U.rgbToHex(U.hexToRgb(col).map(c => c * 0.6)); // parts carry hex colours
    const gold = '#ffd14d', green = '#4d853d', red = '#c73833', blue = '#4d75cc';
    const H = partHelpers({ scale: 1, boxes: m.boxes, height: m.height }); const { blob, ball, tube, plate, ring, cone, disc, ribbon } = H;
    const discZ = (x, y, z, r, th, c, o) => blob(x - r, y - r, z - th / 2, x + r, y + r, z + th / 2, 1, c, Object.assign({ n: 4 }, o || {})); // a disc standing up, facing forward (a badge on the chest)
    const onHead = () => { H.bone = head.bone; }, onBody = () => { H.bone = 0; };
    const top = head.y1 + 0.005, front = body.z1;
    switch (wear.item) {
      case 'scarf': { onBody(); ring(neck.x, neck.y, neck.z, nr * 1.08, nr * 1.08, nr * 0.24, col); // a wound ring at the neck and a tail hanging down the back
        ribbon([[neck.x + nr * 0.1, neck.y, neck.z - nr * 0.9], [neck.x + nr * 0.3, neck.y - nr * 0.9, neck.z - nr * 1.1], [neck.x + nr * 0.45, neck.y - nr * 1.9, neck.z - nr * 0.95]], [nr * 0.5, nr * 0.55, nr * 0.42], col, { droop: 0.3 }); break; }
      case 'coat': { onBody(); const capY = head.fake ? body.y0 + body.h * 0.78 : Math.min(body.y1 + 0.035, neck.y + 0.03); const t = Math.min(capY - 0.12, body.y0 + body.h * 0.42); blob(body.x0 - 0.03, t, body.z0 - 0.02, body.x1 + 0.03, capY, body.cz + body.d * 0.3, 0.6, col, { n: 3 }); // a little coat over the back and shoulders, up to the neck and no further
        if (!head.fake && neck.y < head.cy) ring(neck.x, neck.y + 0.01, neck.z, nr * 1.12, nr * 1.12, nr * 0.16, dark); ball(body.cx, body.cy + body.h * 0.1, front + 0.015, 0.03, gold); break; }
      case 'hat': { onHead(); disc(head.cx, top + 0.02, head.cz, hr * 1.15, 0.04, dark); blob(head.cx - hr * 0.68, top + 0.03, head.cz - hr * 0.68, head.cx + hr * 0.68, top + 0.03 + hr * 0.95, head.cz + hr * 0.68, 0.55, col, { tap: [1, 0.86] }); ring(head.cx, top + 0.03 + hr * 0.22, head.cz, hr * 0.69, hr * 0.69, 0.022, gold); break; }
      case 'bow': { onHead(); const y = top + hr * 0.12, x = head.cx + hr * 0.35, z = head.cz; for (const sx of [-1, 1]) blob(x + (sx < 0 ? -hr * 0.42 : 0.02), y - hr * 0.16, z - hr * 0.22, x + (sx < 0 ? -0.02 : hr * 0.42), y + hr * 0.16, z + hr * 0.22, 0.7, col, { n: 2 }); ball(x, y, z, hr * 0.12, dark); break; }
      case 'crown': { onHead(); ring(head.cx, top + 0.01, head.cz, hr * 0.72, hr * 0.72, 0.035, gold); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; cone([head.cx + Math.cos(a) * hr * 0.72, top + 0.03, head.cz + Math.sin(a) * hr * 0.72], [0, 1, 0], hr * 0.4, 0.035, gold); } ball(head.cx, top + 0.02 + hr * 0.1, head.cz + hr * 0.72, 0.035, col, { emis: true }); break; }
      case 'collar': { onBody(); ring(neck.x, neck.y, neck.z, nr * 1.05, nr * 1.05, nr * 0.12, col); discZ(neck.x, neck.y - nr * 0.2, neck.z + nr * 1.02, 0.045, 0.02, gold); break; }
      case 'rosette': { onBody(); const y = body.cy + body.h * 0.15; discZ(body.cx, y, front + 0.02, 0.09, 0.03, blue); discZ(body.cx, y, front + 0.045, 0.045, 0.02, gold); // a show rosette on the chest, two tails below
        for (const sx of [-1, 1]) ribbon([[body.cx + sx * 0.03, y - 0.06, front + 0.03], [body.cx + sx * 0.05, y - 0.22, front + 0.03]], [0.035, 0.03], blue, {}); break; }
      case 'sash': { onBody(); ribbon([[body.x1 * 0.75, body.y1 - 0.03, body.cz], [body.x1 * 0.6, body.y1 - 0.05, front + 0.02], [body.cx, body.cy, front + 0.025], [body.x0 * 0.6, body.y0 + body.h * 0.2, front + 0.02]], [0.08, 0.1, 0.11, 0.09], red, {}); ball(body.x0 * 0.55, body.y0 + body.h * 0.2, front + 0.03, 0.04, gold); break; }
      case 'laurelk': { onHead(); ring(head.cx, top + 0.01, head.cz, hr * 0.78, hr * 0.78, 0.03, green); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.3; const x = head.cx + Math.cos(a) * hr * 0.78, z = head.cz + Math.sin(a) * hr * 0.78; plate([[x, top + 0.01, z], [x + Math.cos(a + 1.2) * 0.07, top + 0.05, z + Math.sin(a + 1.2) * 0.07], [x + Math.cos(a + 0.5) * 0.12, top + 0.02, z + Math.sin(a + 0.5) * 0.12]], 0.012, green); } break; }
      case 'medal': { onBody(); const y = body.cy + body.h * 0.05; tube([[neck.x - nr * 0.7, neck.y, neck.z + nr * 0.3], [body.cx, y + 0.02, front + 0.02], [neck.x + nr * 0.7, neck.y, neck.z + nr * 0.3]], [0.018, 0.018, 0.018], red, { segs: 5 }); discZ(body.cx, y - 0.03, front + 0.03, 0.055, 0.02, gold); ball(body.cx, y - 0.03, front + 0.045, 0.02, '#fffbe6', { emis: true }); break; }
    }
    m.height = Math.max(m.height, ...m.boxes.map(b => b.y + b.h));
    return m;
  }
  function wearKey(wear) { return wear && wear.item && wear.item !== 'none' ? ':w' + wear.item + (wear.col || '') : ''; }
  function buildMesh(mb, m) {
    for (const b of m.boxes) {
      mb.setBone(b.bone || 0); const col = U.hexToRgb(b.c); const o = Object.assign({ emis: !!b.emis }, b.o || {});
      if (b.rot) { mb.push(); mb.rotate(b.rot.rx || 0, b.rot.ry || 0, b.rot.rz || 0, b.rot.piv); }
      if (b.k === 'blob' && b.round > 0.01) { const sz = Math.max(b.w, b.h, b.d) / 2; o.n = Math.max(o.n || 0, sz >= 0.26 ? 9 : sz >= 0.1 ? 6 : sz >= 0.04 ? 4 : 3); } /* rounder forms: no visible facets on a body */
      if (b.k === 'tube') { let mr = 0; for (const r of b.radii) mr = Math.max(mr, Array.isArray(r) ? Math.max(r[0], r[1]) : r); o.segs = Math.max(o.segs || 8, mr >= 0.12 ? 14 : mr >= 0.05 ? 10 : 6); }
      if (b.k === 'blob') mb.blob(b.x, b.y, b.z, b.x + b.w, b.y + b.h, b.z + b.d, b.round, col, o);
      else if (b.k === 'tube') mb.tube(b.path, b.radii, col, o);
      else if (b.k === 'plate') mb.plate(b.pts, b.t, col, o);
      else if (b.k === 'ribbon') mb.ribbon(b.spine, b.widths, col, o);
      else mb.box(b.x, b.y, b.z, b.x + b.w, b.y + b.h, b.z + b.d, col, 1, !!b.emis);
      if (b.rot) mb.pop();
    }
    mb.setBone(0);
  }
  // an egg: the shell in the Kin's body colour with its accent in spots, rings or a zigzag by rarity, a glint, resting on a little nest of straw.
  // A hatching egg (crack 0..1) shows a crack growing round it and light inside
  function eggModel(sp, opts = {}) {
    const C = sp.colors || { body: '#e8d6a8', accent: '#b89a60', dark: '#5a4a30' }; const r = Math.max(0, Math.min(4, sp.rarity || 0)); const crack = opts.crack || 0;
    const shell = hexMix(C.body, '#ffffff', 0.25), mark = C.accent, dark = hexMix(C.dark || '#333333', '#000000', 0.2);
    const m = { kind: 'egg', scale: 1, boxes: [], height: 0.62, radius: 0.24, hover: 0, bones: [{ kind: 'body', piv: [0, 0, 0] }] };
    const H = partHelpers(m);
    H.blob(-0.22, 0.06, -0.22, 0.22, 0.6, 0.22, 1, shell, { n: 5, tap: [1, 0.72] });
    const sd = (sp.seed || 1) * 7;
    if (r === 0) for (let i = 0; i < 7; i++) { const a = U.hash3(sd, i, 1, 3) * 6.283, y = 0.16 + U.hash3(sd, i, 2, 3) * 0.34; const rr = 0.215 * (1 - Math.pow(Math.abs(y - 0.33) / 0.3, 2) * 0.6); H.ball(Math.cos(a) * rr, y, Math.sin(a) * rr, 0.035 + U.hash3(sd, i, 3, 3) * 0.02, mark, { n: 1 }); } // spots
    else if (r === 1) for (const y of [0.22, 0.4]) H.ring(0, y, 0, 0.222 * (1 - Math.pow(Math.abs(y - 0.33) / 0.3, 2) * 0.6), 0.222 * (1 - Math.pow(Math.abs(y - 0.33) / 0.3, 2) * 0.6), 0.02, mark); // bands
    else if (r === 2) for (let i = 0; i < 10; i++) { const a0 = i / 10 * 6.283, a1 = (i + 1) / 10 * 6.283; const up = i % 2; const rr = 0.225; H.plate([[Math.cos(a0) * rr, up ? 0.26 : 0.36, Math.sin(a0) * rr], [Math.cos(a1) * rr, up ? 0.36 : 0.26, Math.sin(a1) * rr], [Math.cos(a1) * rr * 0.98, (up ? 0.36 : 0.26) - 0.05, Math.sin(a1) * rr * 0.98], [Math.cos(a0) * rr * 0.98, (up ? 0.26 : 0.36) - 0.05, Math.sin(a0) * rr * 0.98]], 0.006, mark); } // zigzag
    else if (r === 3) { for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; const x = Math.cos(a) * 0.2, z = Math.sin(a) * 0.2; H.plate([[x * 1.05, 0.44, z * 1.05], [x * 0.8 + Math.sin(a) * 0.06, 0.3, z * 0.8 - Math.cos(a) * 0.06], [x * 1.1, 0.2, z * 1.1], [x * 0.8 - Math.sin(a) * 0.06, 0.3, z * 0.8 + Math.cos(a) * 0.06]], 0.006, mark); } } // leaves
    else { for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + 0.3; H.ball(Math.cos(a) * 0.2, 0.33 + Math.sin(i * 1.9) * 0.1, Math.sin(a) * 0.2, 0.03, mark, { n: 1, emis: true }); } H.ring(0, 0.33, 0, 0.228, 0.228, 0.012, mark, { emis: true }); } // the rarest glow
    H.ball(-0.09, 0.48, 0.14, 0.03, '#ffffff', { n: 1, emis: true }); // glint
    if (crack > 0) { const n = Math.floor(2 + crack * 10); const pts = []; for (let i = 0; i <= n; i++) { const a = i / 12 * 6.283 - 0.5; const y = 0.36 + (i % 2 ? 0.04 : -0.03); pts.push([Math.cos(a) * 0.226, y, Math.sin(a) * 0.226]); } for (let i = 0; i < pts.length - 1; i++) H.tube([pts[i], pts[i + 1]], [0.012, 0.012], crack > 0.6 ? '#fff6c0' : dark, { segs: 4, cap0: 'none', cap1: 'none', emis: crack > 0.6 }); }
    // the nest
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283, a2 = a + 0.9; const rr = 0.3; H.tube([[Math.cos(a) * rr, 0.03, Math.sin(a) * rr], [Math.cos(a2) * rr * 0.8, 0.07, Math.sin(a2) * rr * 0.8]], [0.016, 0.012], i % 2 ? '#c9a84c' : '#a8893c', { segs: 4, cap0: 'round', cap1: 'round' }); }
    H.done(); return m;
  }
  function eggPortrait(cv, sp, size) { const key = 'egg:' + sp.seed + ':' + (sp.rarity || 0); const m = eggModel(sp); const mesh = R.entityMesh(key, (mb) => buildMesh(mb, m)); if (!R.renderPortrait(cv, mesh, m, size)) { const ctx = cv.getContext('2d'); cv.width = cv.height = size; ctx.fillStyle = sp.colors.body; ctx.beginPath(); ctx.ellipse(size / 2, size / 2, size * 0.25, size * 0.32, 0, 0, Math.PI * 2); ctx.fill(); } }
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

  return { LINES, lineOf, maxStage, lookOf, formOf, partHelpers, dress, wearKey, E, EI, CHART, STAT_KEYS, STAT_NAMES, growth, xpToNext, dominant, species, speciesForContext, dex, bySeed, HABITATS, capOf, recipes, findRecipe, fuseRecipe, mythicSpecies, legendSpecies, apexSpecies, wardenSpecies, MAX_LEVEL, TECH, techFor, techByName, starters, create, stats, name, moves, effectiveness, gainXp, fuse, fusionLevel, TRAITS, RARITY, roster, buildUniverse, decorate, makeStatue, statueModel, shardsFor, model, buildMesh, meshKey, portrait, serialize, deserialize, UTIL_DESC, eggModel, eggPortrait };
})();
