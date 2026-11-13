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
    land: { // three-stage lines change body at BOTH steps, the way the great ones do (a lizard that becomes a dragon)
      Tide: [[['blob', null, 'tidepool jelly'], ['quadruped', 'glyphtail', 'river otter'], ['quadruped', 'mantlewalker', 'manta that rides the air over the shallows']], [['quadruped', 'glyphtail', 'otter kit'], ['quadruped', 'mantlewalker', 'ray that learned to walk']]],
      Flame: [[['blob', null, 'ember sprite'], ['quadruped', 'glyphtail', 'fire fox'], ['quadruped', 'anvilmaw', 'forge-king brute']], [['quadruped', 'masker', 'cinder kitten'], ['quadruped', 'anvilmaw', 'furnace hound']]],
      Bloom: [[['blob', null, 'seed pod'], ['quadruped', 'lanternstag', 'sapling fawn'], ['quadruped', 'bulwark', 'ancient walking grove']], [['quadruped', 'bulwark', 'moss-backed pangolin']]],
      Stone: [[['blob', null, 'pebble'], ['quadruped', 'bulwark', 'scaled burrower'], ['quadruped', 'anvilmaw', 'mountain brute']], [['quadruped', 'anvilmaw', 'quarry bulldog'], ['quadruped', 'bulwark', 'walking fortress']]],
      Gale: [[['quadruped', 'glyphtail', 'wind fox kit'], ['quadruped', 'lanternstag', 'cloud deer'], ['quadruped', 'mantlewalker', 'sky manta']], [['quadruped', 'lanternstag', 'cloud deer']]],
      Frost: [[['quadruped', 'masker', 'snow kitten'], ['quadruped', 'masker', 'ice lynx in a crystal mask']], [['blob', null, 'snowball imp'], ['quadruped', 'masker', 'ice lynx'], ['quadruped', 'bulwark', 'glacier fortress']]],
      Spark: [[['blob', null, 'static spark'], ['quadruped', 'glyphtail', 'bolt fox'], ['quadruped', 'mantlewalker', 'storm ray']], [['quadruped', 'mantlewalker', 'storm ray']]],
      Void: [[['blob', null, 'shadow wisp'], ['biped', null, 'masked conjuror']], [['quadruped', 'masker', 'shadow kitten'], ['quadruped', 'masker', 'phantom cat'], ['quadruped', 'mantlewalker', 'night wraith on a cape of shadow']]],
      Light: [[['quadruped', 'lanternstag', 'glow fawn'], ['quadruped', 'lanternstag', 'lantern stag'], ['quadruped', 'glyphtail', 'halo fox that walks on light']], [['blob', null, 'firefly mote'], ['quadruped', 'glyphtail', 'halo fox']]]
    },
    water: {
      Tide: [[['fish', 'minnow', 'river minnow'], ['fish', 'shark', 'reef shark'], ['serpent', 'seadragon', 'sea dragon']], [['fish', 'seahorse', 'seahorse'], ['fish', 'ray', 'ray']]],
      _: [[['fish', 'minnow', 'minnow'], ['fish', 'shark', 'shark']], [['fish', 'ray', 'ray']]]
    }
  };
  const LAND_LINE = new Set(['quadruped', 'biped', 'blob']);
  function lineClass(sp) { if (!sp || sp.steed || sp.fast || sp.tame || sp.dino || sp.mythic || sp.neon || sp.fusedFrom || (sp.rarity || 0) >= 4) return null; if (LAND_LINE.has(sp.shape)) return 'land'; if (sp.shape === 'fish') return 'water'; return null; }
  function lineOf(sp) {
    if (sp._line !== undefined) return sp._line; const cls = lineClass(sp); if (!cls) return (sp._line = null);
    const el = dominant(sp.elem || [], 1)[0]; const T = LINES[cls]; const opts = T[el] || T._ || null; if (!opts) return (sp._line = null);
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
    let hover = 0, legLen = 0.5, kind = shape, flyer = false, sway = null;
    switch (shape) {
      case 'quadruped': {
        // Redrawn in the spirit of the great creature designs: a clear silhouette, one strong elemental signature, eyes with
        // character, and evolutions you can see. Stage 1 is a cub (big head, big eyes, short legs), stage 2 a lean youngster,
        // stage 3 a proud adult (deep chest held high, long legs, a longer muzzle, a fierce brow, its element in full flower).
        const t = Math.max(0, Math.min(2, (stage || 1) - 1)), el = dominant(sp.elem || [], 1)[0] || 'Stone';
        // ---- the body plans. Mounts (steeds, horses) keep the horse-like body below; every other four-legged Kin is one of
        // six invented creatures, picked by its seed, each with a gimmick of its own and an arc across its three stages.
        const ARCH = ['bulwark', 'lanternstag', 'masker', 'mantlewalker', 'anvilmaw', 'glyphtail'];
        const arch = (sp.steed || sp.fast || sp.tame || sp.dino) ? 'steed' : form.plan && ARCH.includes(form.plan) ? form.plan : ARCH[((sp.seed >>> 0) % 997) % ARCH.length];
        if (arch !== 'steed') {
          const glw = hexMix(C.accent, '#ffffff', 0.3), pawC = hexMix(C.dark, C.belly, 0.2);
          const look = (ex, ey, ez, er, o = {}) => { // layered eyes: dark base, coloured iris, pupil, two glints; an adult's brow
            for (const sd of [-1, 1]) { ball(sd * ex, ey, ez, er, '#16121e', { n: 3 }); ball(sd * (ex + er * 0.04), ey - er * 0.12, ez + er * 0.5, er * 0.62, o.col || C.eye, { emis: !!o.glow, n: 3 });
              ball(sd * (ex + er * 0.05), ey - er * 0.1, ez + er * 0.78, er * 0.3, '#0a0810', { n: 2 }); ball(sd * (ex - er * 0.22), ey + er * 0.34, ez + er * 0.82, er * 0.3, '#ffffff', { emis: true, n: 2 }); ball(sd * (ex + er * 0.3), ey - er * 0.36, ez + er * 0.84, er * 0.13, '#ffffff', { emis: true, n: 2 });
              if (o.brow) blob(sd * ex - er * 1.1, ey + er * 0.88, ez - er * 0.3, sd * ex + er * 1.1, ey + er * 1.18, ez + er * 0.9, 0.5, o.brow, { n: 2 }); } };
          const legsOf = (leg, L, xw, thick, front, back, o = {}) => { // four legs on bones 2..5; front/back z; a hock on the hind legs
            const LG = [[-xw, front, 2, 0], [xw, front, 3, Math.PI], [-xw, back, 4, Math.PI], [xw, back, 5, 0]];
            for (const [lx, lz, bi, ph] of LG) { const hind = lz < 0; B(bi, 'leg', [lx, leg + 0.06, lz], { phase: ph, len: leg + 0.05 });
              if (hind && o.haunch !== false) blob(lx - thick * 1.0, leg * 0.5, lz - thick * 1.2, lx + thick * 1.0, leg + 0.2, lz + thick * 1.1, 1, C.body, { under: C.belly });
              const sock = t >= 1 ? hexMix(C.body, C.dark, 0.38) : C.body; // from the youngster on, darker 'socks' below the knee: legs read as legs
              if (hind) { tube([[lx, leg + 0.1, lz], [lx * 1.04, leg * 0.58, lz + 0.08], [lx, leg * 0.26, lz - 0.07]], [thick, thick * 0.78, thick * 0.62], C.body, { cap0: 'none', cap1: 'round' }); tube([[lx, leg * 0.3, lz - 0.06], [lx, 0.1, lz]], [thick * 0.64, thick * 0.66], sock, { cap0: 'round', cap1: 'none' }); }
              else { tube([[lx, leg + 0.1, lz], [lx * 1.03, leg * 0.48, lz + 0.02], [lx, leg * 0.3, lz + 0.035]], [thick, thick * 0.74, thick * 0.66], C.body, { cap0: 'none', cap1: 'round' }); tube([[lx, leg * 0.34, lz + 0.035], [lx, 0.1, lz + 0.03]], [thick * 0.66, thick * 0.66], sock, { cap0: 'round', cap1: 'none' }); }
              if (o.hoof) blob(lx - thick * 0.7, 0, lz - thick * 0.6, lx + thick * 0.7, 0.14, lz + thick * 0.8, 0.4, C.dark, { n: 2 });
              else blob(lx - thick * 0.85, 0, lz - thick * 0.6, lx + thick * 0.85, 0.13, lz + thick * 1.3, 0.7, pawC, { n: 2 }); }
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
          if (arch === 'bulwark') {
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
            if (t === 0) { blob(-0.23 * hs, hy + 0.1 * hs, hz + 0.02, 0.23 * hs, hy + 0.23 * hs, hz + 0.2, 1, maskC); for (const sd of [-1, 1]) ball(sd * 0.1 * hs, hy + 0.165 * hs, hz + 0.2, 0.035 * hs, glw, { emis: true, n: 1 }); blob(-0.07, hy - 0.02, hz + 0.16, 0.07, hy + 0.08, hz + 0.24, 0.9, C.belly); } // a kitten's half-mask
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
          if (f.wings && el !== 'Gale') wings(0.28, legLen + 0.4, 0.1, 0.8 + 0.2 * t);
          break;
        }
        const hs = [1.3, 1.08, 0.95][t], leg = [0.4, 0.55, 0.7][t], L = [0.82, 1.0, 1.14][t], lift = [0, 0.04, 0.1][t];
        const glow = hexMix(C.accent, '#ffffff', 0.25), paw = hexMix(C.dark, C.belly, 0.25);
        // body: a deep chest and a smaller haunch, the chest a touch higher as it grows (a proud stance)
        blob(-0.36, leg - 0.02 + lift * 0.5, -0.05, 0.36, leg + 0.6 + lift, 0.66 * L, 1, C.body, { under: C.belly, bulge: 0.06 });
        blob(-0.33, leg - 0.04, -0.66 * L, 0.33, leg + 0.5, 0.12, 0.9, C.body, { under: C.belly, bulge: 0.05 });
        markings(-0.34, leg, -0.6 * L, 0.34, leg + 0.56, 0.6 * L);
        const nb = [0, leg + 0.42 + lift, 0.5 * L], ht = [0, leg + 0.6 + lift + 0.05 * t, 0.6 * L + 0.06];
        tube([nb, [0, (nb[1] + ht[1]) / 2 + 0.02, (nb[2] + ht[2]) / 2], ht], [0.25, 0.22, 0.2], C.body, { cap0: 'none', cap1: 'round' });
        // head
        B(1, 'head', ht); const hx = ht[1], hz = ht[2];
        blob(-0.27 * hs, hx - 0.02 * hs, hz - 0.1 * hs, 0.27 * hs, hx + 0.46 * hs, hz + 0.36 * hs, 1, C.body, { under: C.belly });
        const mz = hz + 0.3 * hs, ml = (0.14 + 0.1 * t) * hs;
        blob(-0.13 * hs, hx + 0.03 * hs, mz - 0.06, 0.13 * hs, hx + 0.22 * hs, mz + ml, 0.95, t ? hexMix(C.body, C.belly, 0.55) : C.belly, { tap: [0.8, 0.85] }); // a muzzle that narrows to the nose
        ball(0, hx + 0.2 * hs, mz + ml - 0.01, 0.055 * hs, C.dark, { n: 2 }); if (t === 2) blob(-0.1 * hs, hx + 0.02 * hs, mz, 0.1 * hs, hx + 0.08 * hs, mz + ml * 0.8, 0.8, hexMix(C.body, C.dark, 0.3), { n: 2 }); // and a jaw on the adult
        { // eyes with life in them: a coloured iris, a dark pupil, a big glint and a small one; the adult's brow comes down
          const er = [0.12, 0.098, 0.088][t] * hs, ey = hx + 0.29 * hs, ez = hz + 0.27 * hs, ex = 0.155 * hs;
          for (const sd of [-1, 1]) { ball(sd * ex, ey, ez, er, '#16121e', { n: 3 }); ball(sd * (ex + er * 0.04), ey - er * 0.12, ez + er * 0.5, er * 0.62, C.eye, { emis: el === 'Void' || el === 'Spark' || el === 'Light', n: 3 });
            ball(sd * (ex + er * 0.05), ey - er * 0.1, ez + er * 0.78, er * 0.3, '#0a0810', { n: 2 }); ball(sd * (ex - er * 0.22), ey + er * 0.34, ez + er * 0.82, er * 0.3, '#ffffff', { emis: true, n: 2 }); ball(sd * (ex + er * 0.3), ey - er * 0.36, ez + er * 0.84, er * 0.13, '#ffffff', { emis: true, n: 2 });
            if (t === 2) blob(sd * ex - er * 1.1, ey + er * 0.88, ez - er * 0.3, sd * ex + er * 1.1, ey + er * 1.18, ez + er * 0.9, 0.5, C.dark, { n: 2 }); } }
        if (t >= 1) for (const sd of [-1, 1]) plate([[sd * 0.24 * hs, hx + 0.16 * hs, hz + 0.1 * hs], [sd * 0.36 * hs, hx + 0.08 * hs, hz + 0.02 * hs], [sd * 0.3 * hs, hx + 0.22 * hs, hz + 0.04 * hs]], 0.03, C.accent); // cheek tufts
        // ears, shaped by the element
        for (const sd of [-1, 1]) {
          const eb = [sd * 0.13 * hs, hx + 0.42 * hs, hz + 0.06 * hs], es = [0.36, 0.3, 0.27][t] * hs;
          if (el === 'Spark') plate([[eb[0], eb[1], eb[2]], [eb[0] + sd * es * 0.45, eb[1] + es * 0.35, eb[2] - 0.02], [eb[0] + sd * es * 0.25, eb[1] + es * 0.5, eb[2] - 0.04], [eb[0] + sd * es * 0.7, eb[1] + es, eb[2] - 0.08], [eb[0] + sd * es * 0.12, eb[1] + es * 0.45, eb[2] - 0.04]], 0.035, C.body, { edge: C.dark });
          else if (el === 'Tide') plate([[eb[0], eb[1] - 0.04, eb[2]], [eb[0] + sd * es * 0.9, eb[1] + es * 0.15, eb[2] - es * 0.4], [eb[0] + sd * es * 0.55, eb[1] + es * 0.45, eb[2] - es * 0.2], [eb[0] + sd * es * 0.15, eb[1] + es * 0.3, eb[2]]], 0.03, C.accent, { edge: C.body });
          else if (el === 'Gale') for (let k = 0; k < 3; k++) cone([eb[0], eb[1], eb[2] - 0.02 * k], [sd * (0.5 + 0.3 * k), 1, -0.4 - 0.2 * k], es * (1 - 0.2 * k), 0.06 * hs, k ? C.belly : C.body);
          else plate([[eb[0] - sd * 0.03, eb[1], eb[2] + 0.03], [eb[0] + sd * es * 0.38, eb[1], eb[2] - 0.02], [eb[0] + sd * es * 0.32, eb[1] + es, eb[2] - 0.08], [eb[0] + sd * es * 0.06, eb[1] + es * 0.5, eb[2]]], 0.035, C.body, { edge: el === 'Void' ? C.accent : C.belly });
        }
        if (f.horns || (t === 2 && (el === 'Stone' || el === 'Void'))) for (const sd of [-1, 1]) curl([sd * 0.15 * hs, hx + 0.4 * hs, hz + 0.16 * hs], [sd * 0.3, 1, -0.3], (0.3 + 0.14 * t) * hs, 0.07 * hs, el === 'Void' ? C.accent : C.dark, [sd * 0.3, -0.25, -0.5]);
        if (f.crest || el === 'Bloom') plate([[0, hx + 0.44 * hs, hz + 0.18 * hs], [-0.04, hx + (0.66 + 0.06 * t) * hs, hz + 0.02], [0.05, hx + (0.6 + 0.08 * t) * hs, hz - 0.08], [0, hx + 0.44 * hs, hz]], 0.035, el === 'Bloom' ? C.accent : C.accent); // a leaf or a crest
        if (el === 'Frost' && t === 2) for (const a of [-0.5, 0, 0.5]) cone([a * 0.16 * hs, hx + 0.44 * hs, hz + 0.08 * hs], [a * 0.6, 1, -0.2], 0.3 * hs, 0.05 * hs, glow, { emis: true });
        if (el === 'Light' && t === 2) ring(0, hx + 0.72 * hs, hz + 0.12 * hs, 0.2 * hs, 0.07 * hs, 0.022, '#fff3b0', { emis: true }); // a halo
        bone = 0;
        // the element across the body
        if (el === 'Flame' && t >= 1) for (let k = 0; k < 3 + t; k++) { const u = k / (2 + t); cone([0, nb[1] + 0.08 + (ht[1] - nb[1]) * u, nb[2] + (ht[2] - nb[2]) * u - 0.1], [0, 1, -0.7], (0.32 + 0.08 * t) * (1 - u * 0.35), 0.1, k % 2 ? C.accent : glow, { emis: true }); } // a mane of flame
        if (el === 'Tide') plate([[0, leg + 0.58 + lift, 0.3 * L], [0, leg + 0.82 + lift + 0.06 * t, 0.05], [0, leg + 0.62, -0.3 * L], [0, leg + 0.5, -0.1]], 0.035, C.accent, { edge: C.body }); // a dorsal fin
        if (el === 'Stone') for (let k = 0; k < 2 + t; k++) { const z = 0.4 * L - k * (0.75 * L / (1 + t)); blob(-0.22, leg + 0.5 + lift * 0.5, z - 0.12, 0.22, leg + 0.68 + lift * 0.5 + 0.03 * t, z + 0.12, 0.45, C.dark, { n: 2 }); } // rock plates
        if (el === 'Frost' || f.spikes) for (let k = 0; k < 2 + t; k++) { const z = 0.35 * L - k * (0.7 * L / (1 + t)); cone([0, leg + 0.55 + lift * 0.5, z], [0, 1, -0.3], 0.18 + 0.05 * t, 0.06, el === 'Frost' ? glow : C.accent, { emis: el === 'Frost' }); }
        if (el === 'Bloom' && t >= 1) { const fx = 0, fy = nb[1] + 0.02, fz = nb[2] + 0.12; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; ball(fx + Math.cos(a) * 0.09, fy + Math.sin(a) * 0.09, fz + 0.06, 0.06, '#f4a3d2', { n: 2 }); } ball(fx, fy, fz + 0.09, 0.045, '#ffe08a', { n: 2 }); }
        if (el === 'Void' && t >= 1) for (let k = 0; k < 4; k++) plate([[0, nb[1] + 0.1 + k * 0.06, nb[2] - 0.05 - k * 0.04], [-0.06, nb[1] + 0.34 + k * 0.05, nb[2] - 0.2 - k * 0.05], [0.06, nb[1] + 0.3 + k * 0.05, nb[2] - 0.16 - k * 0.04]], 0.03, C.dark, { edge: C.accent }); // a smoky mane
        if (el === 'Light' && t >= 1) for (let k = 0; k < 7; k++) { const a = (k / 6 - 0.5) * 2.4; cone([Math.sin(a) * 0.18, nb[1] + 0.06 + Math.cos(a) * 0.1, nb[2] + 0.08], [Math.sin(a), Math.cos(a) * 0.6, -0.4], 0.16 + 0.04 * t, 0.05, '#fff6d0'); } // a radiant ruff
        if (el === 'Spark' && t >= 1) for (const sd of [-1, 1]) ball(sd * 0.2 * hs, hx + 0.12 * hs, hz + 0.3 * hs, 0.05 * hs, '#ff7a5a', { emis: true, n: 2 }); // cheek sparks
        if (f.wings || (el === 'Gale' && t === 2)) wings(0.3, leg + 0.52 + lift, 0.15, 0.7 + 0.25 * t);
        // legs: a muscled upper leg, a slim lower leg, a big paw
        legLen = leg + 0.05;
        const legs = [[-0.22, 0.44 * L, 2, 0], [0.22, 0.44 * L, 3, Math.PI], [-0.22, -0.46 * L, 4, Math.PI], [0.22, -0.46 * L, 5, 0]];
        for (const [lx, lz, bi, ph] of legs) { const back = lz < 0; B(bi, 'leg', [lx, leg + 0.06, lz], { phase: ph, len: leg + 0.05 });
          if (back) blob(lx - 0.13, leg * 0.55, lz - 0.16, lx + 0.13, leg + 0.2, lz + 0.14, 1, C.body, { under: C.belly }); // the haunch
          if (back) tube([[lx, leg + 0.1, lz], [lx * 1.04, leg * 0.58, lz + 0.09], [lx, leg * 0.26, lz - 0.07], [lx, 0.1, lz + 0.01]], [0.15, 0.11, 0.085, 0.09], C.body, { cap0: 'none', cap1: 'none' }); // a hock, bent back like a real hind leg
          else tube([[lx, leg + 0.1, lz], [lx * 1.03, leg * 0.48, lz + 0.02], [lx, leg * 0.2, lz + 0.04], [lx, 0.1, lz + 0.03]], [0.14, 0.1, 0.085, 0.09], C.body, { cap0: 'none', cap1: 'none' });
          blob(lx - 0.11, 0, lz - 0.08, lx + 0.11, 0.13, lz + 0.17, 0.7, paw, { n: 2 }); }
        bone = 0;
        // the tail: every element its own
        B(6, 'tail', [0, leg + 0.36, -0.62 * L]); const tb = [0, leg + 0.36, -0.62 * L];
        if (el === 'Flame') { tube([tb, [0, tb[1] + 0.1, tb[2] - 0.25], [0, tb[1] + 0.32, tb[2] - 0.42]], [0.08, 0.06, 0.05], C.body, { cap0: 'none', cap1: 'round' }); for (let k = 0; k < 3; k++) cone([0, tb[1] + 0.32, tb[2] - 0.42], [(k - 1) * 0.35, 1, -0.2], 0.28 + 0.06 * t - k % 2 * 0.06, 0.09, k === 1 ? glow : C.accent, { emis: true }); }
        else if (el === 'Tide') { tube([tb, [0, tb[1] + 0.02, tb[2] - 0.3], [0, tb[1] + 0.06, tb[2] - 0.55]], [0.1, 0.07, 0.04], C.body, { cap0: 'none', cap1: 'round' }); for (const sd of [-1, 1]) plate([[0, tb[1] + 0.06, tb[2] - 0.5], [sd * 0.32, tb[1] + 0.2, tb[2] - 0.78], [sd * 0.08, tb[1] + 0.06, tb[2] - 0.7]], 0.03, C.accent, { edge: C.body }); }
        else if (el === 'Spark') { const zz = [[0, tb[1], tb[2]], [0, tb[1] + 0.22, tb[2] - 0.2], [0, tb[1] + 0.14, tb[2] - 0.3], [0, tb[1] + 0.44, tb[2] - 0.5], [0, tb[1] + 0.36, tb[2] - 0.6], [0, tb[1] + 0.7, tb[2] - 0.78]]; tube(zz, [0.07, 0.06, 0.06, 0.07, 0.07, 0.02], C.accent, { cap0: 'none', cap1: 'round', segs: 5 }); }
        else if (el === 'Stone') { tube([tb, [0, tb[1] - 0.04, tb[2] - 0.3], [0, tb[1] - 0.02, tb[2] - 0.5]], [0.1, 0.08, 0.07], C.body, { cap0: 'none', cap1: 'none' }); ball(0, tb[1], tb[2] - 0.58, 0.13 + 0.03 * t, C.dark, { n: 2 }); }
        else if (el === 'Gale') for (let k = 0; k < 4; k++) cone([0, tb[1], tb[2]], [(k - 1.5) * 0.35, 0.5, -1], 0.55 + 0.1 * t - Math.abs(k - 1.5) * 0.08, 0.07, k % 2 ? C.belly : C.body);
        else if (el === 'Frost') { tube([tb, [0, tb[1] + 0.1, tb[2] - 0.3]], [0.08, 0.06], C.body, { cap0: 'none', cap1: 'round' }); cone([0, tb[1] + 0.1, tb[2] - 0.3], [0, 0.6, -1], 0.36 + 0.08 * t, 0.08, glow, { emis: true }); }
        else if (el === 'Void') tube([tb, [0, tb[1] + 0.16, tb[2] - 0.3], [0, tb[1] + 0.1, tb[2] - 0.6], [0, tb[1] + 0.3, tb[2] - 0.85]], [0.09, 0.08, 0.05, 0.0005], C.accent, { cap0: 'none', cap1: 'none', emis: true });
        else if (el === 'Light') { tube([tb, [0, tb[1] + 0.2, tb[2] - 0.32], [0, tb[1] + 0.42, tb[2] - 0.44]], [0.08, 0.07, 0.06], C.body, { cap0: 'none', cap1: 'round' }); ball(0, tb[1] + 0.48, tb[2] - 0.46, 0.1 + 0.02 * t, '#fff3b0', { emis: true, n: 2 }); }
        else { tube([tb, [0, tb[1] + 0.12, tb[2] - 0.3], [0, tb[1] + 0.34, tb[2] - 0.5]], [0.08, 0.06, 0.03], C.accent, { cap0: 'none', cap1: 'round' }); cone([0, tb[1] + 0.34, tb[2] - 0.5], [0, 1, -0.5], 0.2, 0.08, C.accent); } // Bloom: a leaf tip
        bone = 0;
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
