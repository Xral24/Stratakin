'use strict';
// World constants, block registry, procedural generation and chunk storage.
const CH = 16;            // chunk width
const WH = 104;           // world height
const WORLD_W = 16384;    // wrap period in blocks (walk ~1h to come back around)
const SEA = 46;
const CORE_TOP = 14;      // y < 14 is the Core
const SKY_BASE = 86;      // sky islands float around here
const SKY_SPLIT = 78;     // sky light above this height is computed separately so islands do not shade the ground

const B = {
  AIR: 0, BEDROCK: 1, STONE: 2, DIRT: 3, GRASS: 4, SAND: 5, WATER: 6, LOG: 7, LEAVES: 8, SNOW: 9,
  COPPER: 10, IRON: 11, EMBER: 12, VOID: 13, BASALT: 14, LAVA: 15, CLOUD: 16, GLOWGRASS: 17,
  TORCH: 18, FUSION: 19, GRAVEL: 20, CACTUS: 21, STARMETAL: 22, MOSS: 23, STATUE: 24, PLANKS: 25, BERRY: 26, GLASS: 27, CAMPFIRE: 28, IRONWALL: 29, VOIDWALL: 30, GLOWWORM: 31, BERRYLEAF: 32, DOOR: 33, DOOR_OPEN: 34, PORTAL: 35,
  CHEST: 36, SELENITE: 37, TYCHO: 38, STARSALT: 39, MOONGLOW: 40, AMBER: 41, SULFUR: 42, RINGSHARD: 43, BRINE: 44, CORAL_R: 45, CORAL_B: 46, CORAL_Y: 47, PEARLCORAL: 48, GOLD: 49, DIAMOND: 50, FERN: 51, SELGLASS: 52, INCUBATOR: 53, REGOLITH: 54, DUNE: 55, SALTCRUST: 56, LADDER: 57, TARGET: 58, BALLOON: 59, FORTSTONE: 60, THORN: 61, DEADGATE: 62, RUBBLE: 63, DARKTABLE: 64
};

// name, top colour, side colour, solid, hardness (seconds to mine), drop item id, emissive, fluid
const BLOCKS = [];
function defBlock(id, name, top, side, opts = {}) {
  BLOCKS[id] = Object.assign({ id, name, top: U.hexToRgb(top), side: U.hexToRgb(side), solid: true, hard: 1, drop: null, emissive: false, fluid: false, partial: false, transparent: false }, opts);
}
defBlock(B.AIR, 'Air', '#000000', '#000000', { solid: false, transparent: true });
defBlock(B.BEDROCK, 'Mantle Rock', '#2a2630', '#2a2630', { hard: Infinity });
defBlock(B.STONE, 'Stone', '#979aa0', '#8e9197', { hard: 0.9, drop: 'stone' });
defBlock(B.DIRT, 'Dirt', '#8a6240', '#7e583a', { hard: 0.35, drop: 'dirt' });
defBlock(B.GRASS, 'Grass', '#5fae3f', '#7e583a', { hard: 0.4, drop: 'dirt' });
defBlock(B.SAND, 'Sand', '#dccb8e', '#d1bf83', { hard: 0.35, drop: 'sand' });
defBlock(B.WATER, 'Water', '#2f6fd6', '#2f6fd6', { solid: false, fluid: true, transparent: true });
defBlock(B.LOG, 'Log', '#a07a44', '#75522c', { hard: 0.6, drop: 'wood' });
defBlock(B.LEAVES, 'Leaves', '#4f9c3f', '#479038', { hard: 0.2, drop: 'frond' });
defBlock(B.SNOW, 'Snow', '#eef3f8', '#dbe4ee', { hard: 0.3, drop: 'snow' });
defBlock(B.COPPER, 'Copper Ore', '#9a7a55', '#8f7352', { hard: 1.3, drop: 'copper' });
defBlock(B.IRON, 'Iron Ore', '#b5a79a', '#a89a8d', { hard: 1.4, drop: 'iron' });
defBlock(B.EMBER, 'Ember Ore', '#c9552a', '#b84a24', { hard: 1.2, drop: 'ember' });
defBlock(B.VOID, 'Void Crystal', '#9a4de0', '#8a3fd0', { hard: 1.6, drop: 'void', emissive: true });
defBlock(B.BASALT, 'Basalt', '#45404a', '#3d3842', { hard: 1.4, drop: 'basalt' });
defBlock(B.LAVA, 'Lava', '#ff7a1a', '#ff6a12', { solid: false, fluid: true, emissive: true, transparent: true });
defBlock(B.CLOUD, 'Cloudstone', '#e9ecf6', '#d7dcea', { hard: 0.4, drop: 'cloud' });
defBlock(B.GLOWGRASS, 'Glowgrass', '#d7f5a1', '#d7dcea', { hard: 0.4, drop: 'cloud', emissive: true });
defBlock(B.TORCH, 'Torch', '#ffd36a', '#8a6a3c', { solid: false, hard: 0.05, drop: 'torch', emissive: true, partial: true, transparent: true });
defBlock(B.FUSION, 'Fusion Table', '#7ad7ff', '#3b3f5c', { hard: 1.0, drop: 'fusion' });
defBlock(B.DARKTABLE, 'Dark Fusion Table', '#4a1a6a', '#1a0a26', { hard: Infinity });
defBlock(B.GRAVEL, 'Gravel', '#7d7872', '#746f69', { hard: 0.4, drop: 'gravel' });
defBlock(B.CACTUS, 'Cactus', '#4f9a3a', '#3f8a2f', { hard: 0.4, drop: 'frond' });
defBlock(B.STARMETAL, 'Starmetal', '#c7fbff', '#7ee8f0', { hard: Infinity, emissive: true });
defBlock(B.MOSS, 'Mossy Stone', '#6f8f58', '#7f8580', { hard: 0.9, drop: 'stone' });
defBlock(B.PLANKS, 'Planks', '#b58d58', '#a67f4e', { hard: 0.6, drop: 'planks' });
defBlock(B.BERRY, 'Berry Bush', '#3f8f3a', '#9a2f3f', { hard: 0.25, drop: 'berry' });
defBlock(B.GLASS, 'Glass', '#cfe9f5', '#c4e2f0', { hard: 0.3, drop: 'glass', transparent: true });
defBlock(B.CAMPFIRE, 'Camp Fire', '#7af5ff', '#6a6a70', { solid: false, hard: Infinity, emissive: true, partial: true, transparent: true });
defBlock(B.IRONWALL, 'Iron Wall', '#8f98a6', '#7d8694', { hard: 2.4, drop: 'ironwall' });
defBlock(B.VOIDWALL, 'Voidsteel Wall', '#5a3f8a', '#44306b', { hard: 3.2, drop: 'voidwall', emissive: true });
defBlock(B.GLOWWORM, 'Glowworm', '#d8ff6a', '#a8d040', { solid: false, hard: 0.05, drop: 'glowworm', emissive: true, partial: true, transparent: true });
defBlock(B.BERRYLEAF, 'Berry Leaves', '#6a8f3a', '#8a4a3a', { hard: 0.2, drop: 'berry' });
defBlock(B.DOOR, 'Door', '#9a7646', '#8a6a3c', { hard: 0.8, drop: 'door', partial: true, transparent: true });
defBlock(B.DOOR_OPEN, 'Open Door', '#9a7646', '#8a6a3c', { solid: false, hard: 0.8, drop: 'door', partial: true, transparent: true });
defBlock(B.PORTAL, 'Portal', '#7ad7ff', '#3b3f5c', { hard: Infinity, emissive: true, partial: true, transparent: true });
defBlock(B.STATUE, 'Statue', '#9a9aa0', '#8a8a90', { hard: 0.8, partial: true, transparent: true }); // rendered as an entity; the block only gives it a footprint
defBlock(B.CHEST, 'Chest', '#a0783c', '#7a5a2c', { hard: 0.7, drop: 'chest', partial: true, transparent: true });
// the Moon: selenite (pale crystal in the rock), tycho (blue-grey metal), starsalt (a teal crust on the crater floors), moonglow (the aliens' lamps)
defBlock(B.SELENITE, 'Selenite', '#8e8e97', '#85858e', { hard: 1.5, drop: 'selenite' });
defBlock(B.TYCHO, 'Tycho Ore', '#8e8e97', '#85858e', { hard: 1.7, drop: 'tycho' });
defBlock(B.STARSALT, 'Starsalt', '#5ef0e0', '#3cc0b8', { hard: 0.6, drop: 'starsalt', emissive: true });
defBlock(B.MOONGLOW, 'Moonglow', '#b8ff6a', '#7ad040', { solid: false, hard: 0.3, drop: 'moonlamp', emissive: true, partial: true, transparent: true });
defBlock(B.REGOLITH, 'Regolith', '#a3a3ab', '#8b8b93', { hard: 0.4, drop: 'gravel' });
// Halo: amber in the rock, sulfur crusts, ring shards fallen from the sky, brine pools that eat skin
defBlock(B.AMBER, 'Amber', '#c9a45a', '#b8944e', { hard: 1.3, drop: 'amber' });
defBlock(B.SULFUR, 'Sulfur', '#e8d84a', '#cbb93c', { hard: 0.6, drop: 'sulfur' });
defBlock(B.RINGSHARD, 'Ring Shard', '#fff0c0', '#ffd890', { hard: 1.8, drop: 'ringshard', emissive: true });
defBlock(B.BRINE, 'Brine', '#b8d050', '#a0c040', { solid: false, fluid: true, transparent: true });
defBlock(B.DUNE, 'Dune Sand', '#e2c374', '#d4b468', { hard: 0.35, drop: 'sand' });
defBlock(B.SALTCRUST, 'Salt Crust', '#f0ead8', '#d8d0b8', { hard: 0.5, drop: 'sulfur' });
// the sea floor: coral in three colours and the rare pearl coral
defBlock(B.CORAL_R, 'Red Coral', '#ff5a6a', '#d83a4a', { hard: 0.6, drop: 'coral', partial: true, transparent: true });
defBlock(B.CORAL_B, 'Blue Coral', '#4a7aff', '#3a5ad0', { hard: 0.6, drop: 'coral', partial: true, transparent: true });
defBlock(B.CORAL_Y, 'Gold Coral', '#ffc040', '#e0a030', { hard: 0.6, drop: 'coral', partial: true, transparent: true });
defBlock(B.PEARLCORAL, 'Pearl Coral', '#fff6ff', '#e8dcf0', { hard: 0.9, drop: 'pearl', partial: true, transparent: true, emissive: true });
// treasure and the lost world
defBlock(B.GOLD, 'Gold Ore', '#8e8e97', '#85858e', { hard: 1.6, drop: 'gold' });
defBlock(B.DIAMOND, 'Diamond Ore', '#8e8e97', '#85858e', { hard: 2.2, drop: 'diamond' });
defBlock(B.FERN, 'Fern', '#3f8a33', '#2f7a2a', { solid: false, hard: 0.15, drop: 'frond', partial: true, transparent: true });
defBlock(B.SELGLASS, 'Selenite Glass', '#dff4ff', '#cfeafc', { hard: 0.5, drop: 'selglass', transparent: true });
defBlock(B.FORTSTONE, 'Fortress Stone', '#3a3442', '#2e2836', { hard: Infinity });
defBlock(B.THORN, 'Thorn Wall', '#3a5a22', '#2a4418', { hard: Infinity });
defBlock(B.DEADGATE, 'Dead Gate', '#5a6670', '#46525c', { hard: Infinity });
defBlock(B.RUBBLE, 'Rubble', '#8a7a66', '#6e6050', { hard: Infinity });
defBlock(B.TARGET, 'Target', '#f2ede0', '#f2ede0', { hard: 0.5, drop: 'target' });
defBlock(B.BALLOON, 'Balloon', '#e8323c', '#d42a34', { hard: 0.05, drop: null });
defBlock(B.LADDER, 'Ladder', '#a07a44', '#8a6a3c', { solid: false, hard: 0.3, drop: 'ladder', partial: true, transparent: true });
defBlock(B.INCUBATOR, 'Incubator', '#7ad7ff', '#2c3e50', { hard: Infinity, emissive: true });

// blocks that light their surroundings, and how far
const LIGHT_R = { [B.TORCH]: 10, [B.CAMPFIRE]: 14, [B.MOONGLOW]: 12, [B.RINGSHARD]: 10, [B.PEARLCORAL]: 8, [B.INCUBATOR]: 9 };
// blocks the sky light passes through when working out how deep a column is
const SKY_CLEAR = { [B.LADDER]: 1, [B.TORCH]: 1, [B.GLASS]: 1, [B.SELGLASS]: 1, [B.CAMPFIRE]: 1, [B.MOONGLOW]: 1, [B.GLOWWORM]: 1, [B.FERN]: 1, [B.PORTAL]: 1, [B.BERRY]: 1, [B.RINGSHARD]: 1 };
const isSolid = (id) => BLOCKS[id].solid;
const isLeaf = (id) => id === B.LEAVES || id === B.BERRYLEAF;
const isOpaque = (id) => BLOCKS[id].solid && !BLOCKS[id].partial && !BLOCKS[id].transparent;

const BIOME = { PLAINS: 0, FOREST: 1, DESERT: 2, SNOW: 3, SWAMP: 4, MOUNTAIN: 5, OCEAN: 6, MARE: 7, HIGHLANDS: 8, CRATER: 9, DUNES: 10, FLATS: 11, MESA: 12, LOSTWORLD: 13 };
const BIOME_NAME = ['Plains', 'Forest', 'Desert', 'Snowfield', 'Swamp', 'Mountains', 'Ocean', 'Mare', 'Highlands', 'Crater', 'Dunes', 'Saltflats', 'Mesa', 'Lost World'];
// World presets: the same generator with different settings. Earth is the default; every other body is a preset.
// villages: how dense the villages are (nc cells across the map) and the id prefix; zoneBase: how hard the wild is before distance; legend: the one creature of the body
const PRESETS = {
  earth: { id: 'earth', name: 'Earth', gravity: 1, water: true, trees: true, skyIslands: true, weather: true, seedXor: 0, arrival: null, villages: { nc: 64, prefix: '', style: 'land' }, fisher: true, founding: true, zoneBase: 0, lostWorld: true, reefs: true },
  moon: { id: 'moon', name: 'the Moon', gravity: 0.38, water: false, trees: false, skyIslands: false, weather: false, seedXor: 0x100D, craters: true, spires: true, flatDay: 0.85, airless: true,
    palette: { [B.GRASS]: ['#a3a3ab', '#8b8b93'], [B.DIRT]: ['#80808a', '#76767f'], [B.STONE]: ['#8e8e97', '#85858e'], [B.SAND]: ['#bcbcc3', '#b0b0b7'], [B.GRAVEL]: ['#6f6f78', '#65656e'], [B.SNOW]: ['#e4e4ea', '#d4d4da'], [B.MOSS]: ['#9d9da6', '#8d8d96'] },
    sky: [0.01, 0.01, 0.03], fogMul: 1, biomes: 'moon', villages: { nc: 96, prefix: 'm', style: 'alien' }, zoneBase: 40, legend: { name: 'Selenaut', level: 180, elem: 'Light', shape: 'floater', zone: 20 }, worms: true, people: 'alien' },
  halo: { id: 'halo', name: 'Halo', gravity: 0.72, water: false, brine: true, brineLevel: 40, trees: false, skyIslands: false, weather: false, seedXor: 0x4A10, craters: false, spires: false, airless: true,
    palette: { [B.GRASS]: ['#d9b96a', '#b9955a'], [B.DIRT]: ['#b08a4c', '#9c7a42'], [B.STONE]: ['#b49a6a', '#a68c5e'], [B.SAND]: ['#e2c374', '#d4b468'], [B.GRAVEL]: ['#9a8458', '#8a7650'], [B.SNOW]: ['#f0ead8', '#d8d0b8'], [B.MOSS]: ['#b4a060', '#a08c54'], [B.BASALT]: ['#5a4a3a', '#4a3c30'] },
    skyNoon: [0.95, 0.78, 0.42], skyNight: [0.08, 0.05, 0.03], skyDusk: [0.98, 0.55, 0.25], fogMul: 0.85, biomes: 'halo', villages: { nc: 80, prefix: 'h', style: 'halo' }, zoneBase: 70, legend: { name: 'Ringwarden', level: 200, elem: 'Spark', shape: 'bird', zone: 30 }, ringfall: true, people: 'halo' },
};
let ACTIVE_PRESET = PRESETS.earth;

class Chunk {
  constructor(cx, cz) {
    this.cx = cx; this.cz = cz;
    this.blocks = new Uint8Array(CH * CH * WH);
    this.tops = new Uint8Array(CH * CH);   // highest non-air, non-leaf block per column below the sky band (for sky light)
    this.topsSky = new Uint8Array(CH * CH); // same for the sky-island band (y >= SKY_SPLIT)
    this.biome = new Uint8Array(CH * CH);
    this.tint = new Float32Array(CH * CH * 3); // grass tint per column
    this.dirty = true;
    this.mesh = null;
    this.generated = false;
  }
  idx(lx, ly, lz) { return (lx * CH + lz) * WH + ly; }
  get(lx, ly, lz) { return this.blocks[(lx * CH + lz) * WH + ly]; }
  set(lx, ly, lz, id) { this.blocks[(lx * CH + lz) * WH + ly] = id; }
  recomputeTop(lx, lz) {
    const base = (lx * CH + lz) * WH;
    let y = SKY_SPLIT - 1;
    for (; y > 0; y--) { const b = this.blocks[base + y]; if (b !== B.AIR && !isLeaf(b) && !SKY_CLEAR[b]) break; }
    this.tops[lx * CH + lz] = y;
    let ys = WH - 1;
    for (; ys >= SKY_SPLIT; ys--) { const b = this.blocks[base + ys]; if (b !== B.AIR && !isLeaf(b) && !SKY_CLEAR[b]) break; }
    this.topsSky[lx * CH + lz] = ys < SKY_SPLIT ? SKY_SPLIT - 1 : ys;
  }
  topFor(lx, y, lz) { return y >= SKY_SPLIT ? this.topsSky[lx * CH + lz] : this.tops[lx * CH + lz]; }
}

class World {
  constructor(seed, preset) {
    this.preset = preset || PRESETS.earth; ACTIVE_PRESET = this.preset;
    if (this.preset.palette && !this.preset.paletteRgb) { this.preset.paletteRgb = {}; for (const k in this.preset.palette) this.preset.paletteRgb[k] = this.preset.palette[k].map(U.hexToRgb); }
    this.seed = ((seed >>> 0) ^ (this.preset.seedXor || 0)) >>> 0;
    this.chunks = new Map();
    this.edits = new Map();       // wrapped key -> block id (player changes, persist around the wrap)
    this.torches = new Map();     // key -> [x,y,z,(radius)] placed light sources
    this.statues = new Map();     // key -> statue object (a Kin turned into an object)
    this.time = 0.28;             // 0..1 day fraction (0.28 = morning; noon is 0.5)
    const r = U.rng(this.seed ^ 0x5151);
    this.spawn = null;            // set by findSpawn()
    this.heart = null;            // core heart position
    this.heartAngle = r() * Math.PI * 2;
    // the Lost World sits on the far side of the wrap from the origin (where the camp is found), its tunnel on a seeded bearing
    if (this.preset.lostWorld) {
      const a = r() * Math.PI * 2;
      this.lost = { x: Math.round(WORLD_W / 2 + (r() - 0.5) * 400), z: Math.round(WORLD_W / 2 + (r() - 0.5) * 400), inner: 118, rim: 150, angle: a };
    }
  }
  // the Lost World tunnel: a straight cut through the rim, from the outside slope to the plateau floor
  lostTunnel() {
    if (!this.lost || this.lost.tunnel) return this.lost ? this.lost.tunnel : null;
    const L = this.lost;
    // the outside mouth must open onto dry land: turn the bearing until it does
    let best = null;
    for (let k = 0; k < 36; k++) {
      const ang = L.angle + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 18);
      const ux = Math.cos(ang), uz = Math.sin(ang);
      const ax = Math.round(L.x + ux * (L.rim + 6)), az = Math.round(L.z + uz * (L.rim + 6));
      const h = this.colInfo(ax, az).h; const h2 = this.colInfo(Math.round(L.x + ux * (L.rim + 14)), Math.round(L.z + uz * (L.rim + 14))).h;
      if (h > SEA + 2 && h2 > SEA + 2) { best = { ang, ux, uz, ax, az, ya: h }; break; }
      if (!best || h > best.ya) best = { ang, ux, uz, ax, az, ya: h };
    }
    const { ux, uz, ax, az, ya } = best;
    const bx = Math.round(L.x + ux * (L.inner - 4)), bz = Math.round(L.z + uz * (L.inner - 4)); // inside mouth
    const yb = this.colInfo(bx, bz).h;
    L.tunnel = { ax, az, bx, bz, ya, yb, ux, uz };
    return L.tunnel;
  }
  key(cx, cz) { return cx + ',' + cz; }

  // ----- column info -----
  colInfo(x, z) {
    const s = this.seed, P = WORLD_W;
    const temp = U.fbm2(x + 1000, z, 1024, 3, s + 11, P);
    const moist = U.fbm2(x, z + 2000, 1024, 3, s + 23, P);
    const cont = U.fbm2(x, z, 512, 5, s + 37, P);
    const hills = U.fbm2(x, z, 64, 3, s + 41, P);
    let h = 40 + (cont - 0.5) * 48 + (hills - 0.5) * 16;
    let mountain = 0;
    if (cont > 0.64) { mountain = (cont - 0.64) * 160; h += mountain; }
    if (this.preset.craters) {
      // bowls punched into the highlands
      const cr = U.vnoise2(x, z, 48, P, s + 61);
      if (cr > 0.72) h -= (cr - 0.72) * 90;
      h += 6;
    }
    h = Math.round(U.clamp(h, 18, 82));
    let biome;
    if (this.preset.biomes === 'moon') {
      biome = h < 44 ? BIOME.MARE : (U.vnoise2(x, z, 48, P, s + 61) > 0.72 ? BIOME.CRATER : BIOME.HIGHLANDS);
      const sky = 0; return { h, biome, temp, moist, sky };
    }
    if (this.preset.biomes === 'halo') {
      // Halo: amber dunes in long ridges, low salt flats pooled with brine, and flat-topped mesas with sheer sides
      const m = U.vnoise2(x, z, 160, P, s + 63);
      const ridge = 1 - Math.abs(U.vnoise2(x, z, 26, P, s + 65) - 0.5) * 2;
      let hh;
      if (m > 0.66) { biome = BIOME.MESA; hh = 58 + Math.min(1, (m - 0.66) / 0.06) * 14 + (hills - 0.5) * 4; }
      else if (temp < 0.42) { biome = BIOME.FLATS; hh = 38 + (hills - 0.5) * 5 + (cont - 0.5) * 4; }
      else { biome = BIOME.DUNES; hh = 45 + (hills - 0.5) * 12 + ridge * 7 + (cont - 0.5) * 10; }
      h = Math.round(U.clamp(hh, 18, 82));
      return { h, biome, temp, moist, sky: 0 };
    }
    if (this.preset.lostWorld) {
      // the Lost World: a jungle plateau ringed by cliffs on the far side of the world, reached only through a tunnel
      const L = this.lost; const ddx = U.mod(x - L.x + P / 2, P) - P / 2, ddz = U.mod(z - L.z + P / 2, P) - P / 2; const d = Math.hypot(ddx, ddz);
      if (d < L.rim) {
        if (d < L.inner) { h = 56 + Math.round((hills - 0.5) * 10 + (cont - 0.5) * 4); return { h, biome: BIOME.LOSTWORLD, temp: 0.7, moist: 0.9, sky: 0, lost: true }; }
        const t = d < L.rim - 7 ? 1 : (L.rim - d) / 7; // sheer inside, a slope outside
        h = Math.round(U.lerp(h, 80 - Math.round((hills - 0.5) * 4), Math.min(1, t)));
        return { h, biome: BIOME.MOUNTAIN, temp, moist, sky: 0, lostRim: true };
      }
    }
    if (h < SEA - 2) biome = BIOME.OCEAN;
    else if (mountain > 8) biome = BIOME.MOUNTAIN;
    else if (temp < 0.36) biome = BIOME.SNOW;
    else if (temp > 0.62) biome = moist < 0.47 ? BIOME.DESERT : BIOME.SWAMP;
    else biome = moist > 0.5 ? BIOME.FOREST : BIOME.PLAINS;
    if (biome === BIOME.SWAMP && h > SEA - 1 && h < SEA + 3) {
      const pool = U.vnoise2(x, z, 8, P, s + 77);
      if (pool > 0.58) h = SEA - 1;
    }
    // beaches: a wider band of sand along the shore, with low dunes rolling over it
    let beach = false;
    if (this.preset.water && h >= SEA - 2 && h <= SEA + 3 && (biome === BIOME.PLAINS || biome === BIOME.FOREST || biome === BIOME.DESERT || biome === BIOME.OCEAN)) {
      beach = true;
      if (h >= SEA + 1) { const dn = U.vnoise2(x, z, 9, P, s + 81) * 0.7 + U.vnoise2(x, z, 4, P, s + 83) * 0.3; if (dn > 0.6) h += 1; }
    }
    const sky = U.fbm2(x + 777, z - 777, 128, 2, s + 59, P);
    return { h, biome, temp, moist, sky, beach };
  }
  grassTint(biome, temp, moist) {
    switch (biome) {
      case BIOME.DESERT: return [0.78, 0.74, 0.42];
      case BIOME.SNOW: return [0.55, 0.72, 0.6];
      case BIOME.SWAMP: return [0.36, 0.55, 0.3];
      case BIOME.FOREST: return [0.36 + moist * 0.1, 0.7 + temp * 0.1, 0.28];
      case BIOME.MOUNTAIN: return [0.5, 0.62, 0.42];
      case BIOME.MARE: return [0.52, 0.52, 0.56]; case BIOME.HIGHLANDS: return [0.66, 0.66, 0.7]; case BIOME.CRATER: return [0.44, 0.44, 0.5];
      case BIOME.DUNES: return [0.86, 0.74, 0.42]; case BIOME.FLATS: return [0.9, 0.86, 0.7]; case BIOME.MESA: return [0.7, 0.58, 0.36]; case BIOME.LOSTWORLD: return [0.22, 0.6, 0.2];
      default: return [0.46 + temp * 0.25, 0.74, 0.3 + moist * 0.1];
    }
  }
  treeAt(x, z, info) {
    if (!this.preset.trees) return null;
    if (info.h <= SEA || info.h > 72 || info.beach) return null;
    if (info.lost && this.lost && Math.hypot(x - this.lost.x, z - this.lost.z) < 26) return null; // the tyrant's clearing
    const r = U.hash3(x, 99, z, this.seed + 303);
    let p = 0, type = 'oak';
    switch (info.biome) {
      case BIOME.FOREST: p = 0.008 + 0.03 * U.vnoise2(x, z, 48, WORLD_W, this.seed + 371); // thick in patches, open glades between type = U.hash3(x, 98, z, this.seed) < 0.25 ? 'pine' : 'oak'; break;
      case BIOME.PLAINS: p = 0.004; break;
      case BIOME.SNOW: p = 0.02; type = 'pine'; break;
      case BIOME.SWAMP: p = 0.006 + 0.024 * U.vnoise2(x, z, 48, WORLD_W, this.seed + 373); type = 'swamp'; break;
      case BIOME.MOUNTAIN: p = 0.006; type = 'pine'; break;
      case BIOME.DESERT: p = 0.01; type = 'cactus'; break;
      case BIOME.LOSTWORLD: p = 0.01 + 0.03 * U.vnoise2(x, z, 40, WORLD_W, this.seed + 375); type = 'jungle'; break;
      default: return null;
    }
    if (r >= p) return null;
    const hr = U.hash3(x, 97, z, this.seed);
    const height = type === 'pine' ? 6 + Math.floor(hr * 4) : type === 'cactus' ? 1 + Math.floor(hr * 3) : type === 'jungle' ? 7 + Math.floor(hr * 5) : 4 + Math.floor(hr * 3);
    const berries = (type === 'oak' || type === 'swamp' || type === 'jungle') && U.hash3(x, 96, z, this.seed + 17) < 0.45; // nearly half the broadleaf trees carry berries
    return { type, height, berries };
  }

  // ----- generation -----
  generate(chunk) {
    const cx = chunk.cx, cz = chunk.cz, ox = cx * CH, oz = cz * CH;
    const s = this.seed, P = WORLD_W;
    const blocks = chunk.blocks;
    const infos = new Array(20 * 20);
    for (let dx = -2; dx < 18; dx++) for (let dz = -2; dz < 18; dz++) infos[(dx + 2) * 20 + (dz + 2)] = this.colInfo(ox + dx, oz + dz);
    const heart = this.heart;
    for (let lx = 0; lx < CH; lx++) for (let lz = 0; lz < CH; lz++) {
      const x = ox + lx, z = oz + lz;
      const info = infos[(lx + 2) * 20 + (lz + 2)];
      const h = info.h, biome = info.biome;
      chunk.biome[lx * CH + lz] = biome;
      const tint = this.grassTint(biome, info.temp, info.moist);
      const ti = (lx * CH + lz) * 3; chunk.tint[ti] = tint[0]; chunk.tint[ti + 1] = tint[1]; chunk.tint[ti + 2] = tint[2];
      const base = (lx * CH + lz) * WH;
      const hd2 = heart ? (x - heart.x) * (x - heart.x) + (z - heart.z) * (z - heart.z) : 1e9; const inHeart = hd2 < 121; const inMoat = !inHeart && hd2 < 34 * 34; // a lava sea all round the Heart
      const islandN = U.vnoise2(x, z, 32, P, s + 501);
      const ceilN = U.vnoise2(x, z, 16, P, s + 503);
      // core
      blocks[base] = B.BEDROCK;
      for (let y = 1; y < CORE_TOP; y++) {
        let b;
        if (inHeart) {
          if (y <= 4) b = B.BASALT; else if (y >= 12) b = B.BASALT; else b = B.AIR;
          if (y === 5 && x === heart.x && z === heart.z) b = B.STARMETAL;
        } else if (inMoat) {
          b = y <= 6 ? B.LAVA : y >= 12 + Math.floor(ceilN * 2.5) ? B.BASALT : B.AIR;
        } else {
          const island = islandN > 0.6;
          const islandH = island ? 3 + (islandN - 0.6) * 28 : 0;
          if (y <= 3) b = island ? B.BASALT : B.LAVA;
          else if (y <= islandH) b = B.BASALT;
          else if (y >= 11 + Math.floor(ceilN * 2.5)) b = B.BASALT;
          else b = B.AIR;
          if (b === B.BASALT && U.hash3(x, y, z, s + 601) < 0.03) b = B.VOID;
          if (b === B.BASALT && y > 4 && y < 10 && U.hash3(x, y, z, s + 602) < 0.02) b = B.EMBER;
        }
        blocks[base + y] = b;
      }
      // mines + surface
      const topY = Math.min(h, WH - 1);
      for (let y = CORE_TOP; y <= topY; y++) {
        let b = B.STONE;
        const depth = h - y;
        if (biome === BIOME.DESERT) { if (depth < 4) b = B.SAND; }
        else if (this.preset.water && (h <= SEA + 1 || info.beach) && depth < 3) b = (U.hash3(x, 5, z, s) < 0.2 && depth > 0) ? B.GRAVEL : B.SAND;
        else if (this.preset.biomes === 'moon') { if (depth < 2) b = biome === BIOME.MARE ? B.GRAVEL : biome === BIOME.CRATER ? ((depth === 0 && U.hash3(x, 9, z, s + 617) < 0.22) ? B.STARSALT : B.SAND) : B.GRASS; else if (depth < 5) b = B.DIRT; }
        else if (this.preset.biomes === 'halo') {
          if (depth === 0) b = biome === BIOME.DUNES ? B.DUNE : biome === BIOME.FLATS ? (U.hash3(x, 9, z, s + 619) < 0.12 ? B.SULFUR : B.SALTCRUST) : (h > 68 && U.hash3(x, 9, z, s + 621) < 0.2 ? B.BASALT : B.STONE);
          else if (depth < 4) b = biome === BIOME.DUNES ? B.DUNE : biome === BIOME.MESA ? B.STONE : B.DIRT;
        }
        else if (info.lost) { if (depth === 0) b = B.GRASS; else if (depth < 3) b = B.DIRT; }
        else if (depth === 0) {
          if (biome === BIOME.SNOW) b = B.SNOW;
          else if (biome === BIOME.MOUNTAIN) { const volc = U.vnoise2(x, z, 256, P, s + 611) > 0.6; b = volc ? (h >= 76 ? B.LAVA : (U.hash3(x, 8, z, s) < 0.1 ? B.EMBER : B.BASALT)) : (h > 64 ? B.SNOW : B.STONE); }
          else if (biome === BIOME.SWAMP && U.hash3(x, 6, z, s) < 0.3) b = B.MOSS;
          else b = B.GRASS;
        } else if (depth < 3 + Math.floor(U.hash3(x, 7, z, s) * 2)) {
          b = biome === BIOME.MOUNTAIN ? B.STONE : B.DIRT;
        }
        // caves (two tunnel noises + caverns)
        if (y < h - 3 && y >= CORE_TOP) {
          const a = U.vnoise3(x, y, z, 14, P, s + 701);
          if (Math.abs(a - 0.5) < 0.07) {
            const c = U.vnoise3(x, y * 1.4, z, 16, P, s + 702);
            if (Math.abs(c - 0.5) < 0.09) b = B.AIR;
          }
          if (b !== B.AIR && y < 32 && U.vnoise3(x, y, z, 26, P, s + 703) > 0.77) b = B.AIR;
        } else if (y >= h - 3 && y < h && info.h > SEA + 2) {
          // occasional surface cave mouths
          const a = U.vnoise3(x, y, z, 14, P, s + 701);
          if (Math.abs(a - 0.5) < 0.05) {
            const c = U.vnoise3(x, y * 1.4, z, 16, P, s + 702);
            if (Math.abs(c - 0.5) < 0.06) b = B.AIR;
          }
        }
        if (b === B.STONE) {
          const r = U.hash3(x, y, z, s + 801);
          if (this.preset.biomes === 'moon') {
            if (r < 0.012 && y < 52) b = B.SELENITE;
            else if (r < 0.02 && y < 44) b = B.TYCHO;
            else if (r < 0.03 && y < 48) b = B.IRON;
            else if (r < 0.038 && y < 48) b = B.COPPER;
            else if (r < 0.043 && y < 22) b = B.VOID;
          } else if (this.preset.biomes === 'halo') {
            if (r < 0.014 && y < 56) b = B.AMBER;
            else if (r < 0.022 && y < 50) b = B.SULFUR;
            else if (r < 0.032 && y < 48) b = B.IRON;
            else if (r < 0.04 && y < 48) b = B.COPPER;
            else if (r < 0.045 && y < 22) b = B.VOID;
            else if (r < 0.05 && y < 30) b = B.EMBER;
          } else {
            if (r < 0.011 && y < 48) b = B.COPPER;
            else if (r < 0.026 && y < 46) b = B.IRON;
            else if (r < 0.038 && y < 42) b = B.EMBER;
            else if (r < 0.0425 && y < 22) b = B.VOID;
            else if (info.lost && y < 52 && r > 0.9 && r < 0.903) b = B.GOLD;
            else if (y < 20 && U.vnoise3(x, y, z, 9, P, s + 805) > 0.74) b = B.BASALT;
          }
        }
        blocks[base + y] = b;
      }
      // if the mines carved the block directly under the surface, keep it open (cave mouths); water fill
      if (this.preset.water && h < SEA) for (let y = h + 1; y <= SEA; y++) blocks[base + y] = B.WATER;
      if (this.preset.brine && h < this.preset.brineLevel) for (let y = h + 1; y <= this.preset.brineLevel; y++) blocks[base + y] = B.BRINE;
      if (this.preset.ringfall && h >= this.preset.brineLevel && h < WH - 2 && biome !== BIOME.MESA && U.hash3(x, 13, z, s + 931) < 0.0012) blocks[base + h + 1] = B.RINGSHARD;
      // sky islands
      if (this.preset.spires && U.hash3(x, 11, z, s + 777) < 0.004 && h > 30) { const sh = 4 + Math.floor(U.hash3(x, 12, z, s) * 9); for (let y = h + 1; y <= h + sh && y < WH; y++) blocks[base + y] = (y === h + sh) ? B.VOID : (U.hash3(x, y, z, s) < 0.15 ? B.CLOUD : B.BASALT); }
      if (this.preset.skyIslands && info.sky > 0.615) {
        const t = Math.min(8, Math.floor((info.sky - 0.615) * 70) + 1);
        const topI = SKY_BASE + Math.floor(U.vnoise2(x, z, 16, P, s + 901) * 4);
        for (let y = topI - t; y <= topI; y++) {
          if (y < WH) blocks[base + y] = (y === topI) ? B.GLOWGRASS : B.CLOUD;
        }
      }
    }
    // glowworms: fat little lights in the grass of the greener biomes, easy torch fuel
    if (this.preset.id === 'earth') for (let lx = 0; lx < CH; lx++) for (let lz = 0; lz < CH; lz++) {
      const info = infos[(lx + 2) * 20 + (lz + 2)]; const x = ox + lx, z = oz + lz; const h = info.h;
      if (h <= SEA + 1 || info.beach || h >= WH - 2 || (info.biome !== BIOME.FOREST && info.biome !== BIOME.PLAINS && info.biome !== BIOME.SWAMP)) continue;
      if (U.hash3(x, 21, z, s + 909) > 0.008) continue;
      const base = (lx * CH + lz) * WH;
      if (blocks[base + h] === B.GRASS && blocks[base + h + 1] === B.AIR && !this.treeAt(x, z, info)) blocks[base + h + 1] = B.GLOWWORM;
    }
    // coral: scattered over the sea floor, thick in the reef regions, with the odd pearl coral deep in them
    if (this.preset.reefs) for (let lx = 0; lx < CH; lx++) for (let lz = 0; lz < CH; lz++) {
      const info = infos[(lx + 2) * 20 + (lz + 2)]; const x = ox + lx, z = oz + lz; const h = info.h;
      if (h >= SEA - 3 || h < 16) continue;
      const reef = U.vnoise2(x, z, 384, P, s + 921); const dense = reef > 0.6;
      const r = U.hash3(x, 23, z, s + 923);
      if (r > (dense ? 0.14 : 0.0035)) continue;
      const base = (lx * CH + lz) * WH;
      if (blocks[base + h] === B.AIR || blocks[base + h + 1] !== B.WATER) continue;
      const kind = U.hash3(x, 24, z, s + 925);
      blocks[base + h + 1] = (dense && kind < 0.03) ? B.PEARLCORAL : kind < 0.36 ? B.CORAL_R : kind < 0.7 ? B.CORAL_B : B.CORAL_Y;
    }
    // the Lost World: ferns under the canopy, and the tunnel through the rim
    if (this.lost) {
      for (let lx = 0; lx < CH; lx++) for (let lz = 0; lz < CH; lz++) {
        const info = infos[(lx + 2) * 20 + (lz + 2)]; if (!info.lost) continue;
        const x = ox + lx, z = oz + lz; const h = info.h; const base = (lx * CH + lz) * WH;
        if (U.hash3(x, 25, z, s + 941) < 0.14 && blocks[base + h] === B.GRASS && blocks[base + h + 1] === B.AIR && !this.treeAt(x, z, info)) blocks[base + h + 1] = B.FERN;
      }
      const T = this.lostTunnel();
      const near = Math.abs(ox + 8 - T.ax) < 200 && Math.abs(oz + 8 - T.az) < 200;
      if (near) {
        const len = Math.hypot(T.bx - T.ax, T.bz - T.az);
        for (let lx = 0; lx < CH; lx++) for (let lz = 0; lz < CH; lz++) {
          const x = ox + lx, z = oz + lz;
          // distance from the column to the tunnel's centre line, and how far along it we are
          const ix = (T.bx - T.ax) / len, iz = (T.bz - T.az) / len; // inward, from the outer mouth to the plateau
          const px = x + 0.5 - T.ax, pz = z + 0.5 - T.az; const t = U.clamp((px * ix + pz * iz) / len, 0, 1); const cx = T.ax + ix * len * t, cz = T.az + iz * len * t;
          const dd = Math.hypot(x + 0.5 - cx, z + 0.5 - cz); if (dd > 2.9 || t <= 0 || t >= 1.02) continue;
          const fy = Math.round(U.lerp(T.ya, T.yb, t)); const base = (lx * CH + lz) * WH;
          const along = Math.round(len * t);
          if (dd > 2.2) { // the gate at the outer mouth: two stone pillars and a lintel with torches
            if (along >= 2 && along <= 3) { for (let y = fy + 1; y <= fy + 6; y++) blocks[base + y] = B.STONE; if (along === 2) blocks[base + fy + 7] = B.TORCH; }
            continue;
          }
          // 5 high so you can jump the steps (and ride a big mount through), 4 wide
          for (let y = fy + 1; y <= fy + 5; y++) if (y > 0 && y < WH) blocks[base + y] = B.AIR;
          if (along >= 2 && along <= 3) blocks[base + fy + 6] = B.STONE;
          if (blocks[base + fy] === B.AIR || blocks[base + fy] === B.WATER || blocks[base + fy] === B.LEAVES) blocks[base + fy] = B.STONE;
          if (dd > 1.6 && along % 6 === 3) blocks[base + fy + 3] = B.TORCH; // lamps along the walls, off the walkway
        }
      }
    }
    // trees / cacti (may come from neighbouring columns)
    for (let dx = -2; dx < 18; dx++) for (let dz = -2; dz < 18; dz++) {
      const info = infos[(dx + 2) * 20 + (dz + 2)];
      const x = ox + dx, z = oz + dz;
      const tree = this.treeAt(x, z, info);
      if (!tree) continue;
      // require solid ground (no cave mouth)
      const put = (wx, wy, wz, id, onlyAir) => {
        const lx = wx - ox, lz = wz - oz;
        if (lx < 0 || lx >= CH || lz < 0 || lz >= CH || wy < 0 || wy >= WH) return;
        const i = (lx * CH + lz) * WH + wy;
        if (onlyAir && blocks[i] !== B.AIR) return;
        blocks[i] = id;
      };
      const h = info.h;
      if (tree.type === 'cactus') { for (let y = 1; y <= tree.height; y++) put(x, h + y, z, B.CACTUS, true); continue; }
      const th = tree.height;
      for (let y = 1; y <= th; y++) put(x, h + y, z, B.LOG, false);
      if (tree.type === 'pine') {
        for (let ly = 2; ly <= th + 1; ly++) {
          const r = ly >= th ? 0 : ((th - ly) % 2 === 0 ? 1 : 2);
          for (let ax = -r; ax <= r; ax++) for (let az = -r; az <= r; az++) {
            if (Math.abs(ax) === r && Math.abs(az) === r && r === 2) continue;
            put(x + ax, h + ly, z + az, B.LEAVES, true);
          }
        }
      } else {
        const big = tree.type === 'swamp' || tree.type === 'jungle';
        for (let ly = th - 2; ly <= th + 1; ly++) {
          const r = ly < th ? (big ? 3 : 2) : 1;
          for (let ax = -r; ax <= r; ax++) for (let az = -r; az <= r; az++) {
            if (Math.abs(ax) === r && Math.abs(az) === r && (r > 1 || U.hash3(x + ax, ly, z + az, s) < 0.5)) continue;
            const outer = ly < th && (Math.abs(ax) === r || Math.abs(az) === r) && tree.berries && U.hash3(x + ax, ly + 3, z + az, s + 913) < 0.3;
            put(x + ax, h + ly, z + az, outer ? B.BERRYLEAF : B.LEAVES, true);
          }
        }
      }
    }
    if (this.overlay) this.overlay(chunk); // towns are drawn into the world like terrain
    // player edits
    for (let lx = 0; lx < CH; lx++) for (let lz = 0; lz < CH; lz++) {
      const wx = U.mod(ox + lx, WORLD_W), wz = U.mod(oz + lz, WORLD_W);
      const colKey = wx * 65536 + wz; // edits stored per column map to limit lookups
      const col = this.edits.get(colKey);
      if (col) for (const [y, id] of col) {
        blocks[(lx * CH + lz) * WH + y] = id;
        if (LIGHT_R[id]) this.torches.set((ox + lx) + ',' + y + ',' + (oz + lz), [ox + lx + 0.5, y + 0.6, oz + lz + 0.5, LIGHT_R[id]]);
      }
    }
    // torches that are part of generated structures
    for (let lx = 0; lx < CH; lx++) for (let lz = 0; lz < CH; lz++) {
      const base = (lx * CH + lz) * WH;
      for (let y = 1; y < WH; y++) { const id = blocks[base + y]; if (LIGHT_R[id]) this.torches.set((ox + lx) + ',' + y + ',' + (oz + lz), [ox + lx + 0.5, y + 0.6, oz + lz + 0.5, LIGHT_R[id]]); }
    }
    for (let lx = 0; lx < CH; lx++) for (let lz = 0; lz < CH; lz++) chunk.recomputeTop(lx, lz);
    chunk.generated = true;
  }

  // after a town is drawn into chunks that were already loaded: put the player's own changes back on top, relight, remesh
  reapplyEdits(chunk) {
    const ox = chunk.cx * CH, oz = chunk.cz * CH, blocks = chunk.blocks;
    for (let lx = 0; lx < CH; lx++) for (let lz = 0; lz < CH; lz++) {
      const wx = U.mod(ox + lx, WORLD_W), wz = U.mod(oz + lz, WORLD_W); const col = this.edits.get(wx * 65536 + wz);
      if (col) for (const [y, id] of col) blocks[(lx * CH + lz) * WH + y] = id;
      const base = (lx * CH + lz) * WH; for (let y = 1; y < WH; y++) { const id = blocks[base + y]; const k = (ox + lx) + ',' + y + ',' + (oz + lz); if (LIGHT_R[id]) this.torches.set(k, [ox + lx + 0.5, y + 0.6, oz + lz + 0.5, LIGHT_R[id]]); else if (this.torches.has(k)) this.torches.delete(k); }
      chunk.recomputeTop(lx, lz);
    }
    chunk.dirty = true; this.markDirty(chunk.cx - 1, chunk.cz); this.markDirty(chunk.cx + 1, chunk.cz); this.markDirty(chunk.cx, chunk.cz - 1); this.markDirty(chunk.cx, chunk.cz + 1);
  }
  getChunk(cx, cz, create) {
    const k = this.key(cx, cz);
    let c = this.chunks.get(k);
    if (!c && create) { c = new Chunk(cx, cz); this.generate(c); this.chunks.set(k, c); }
    return c;
  }
  getBlock(x, y, z) {
    if (y < 0) return B.BEDROCK; if (y >= WH) return B.AIR;
    const cx = Math.floor(x / CH), cz = Math.floor(z / CH);
    const c = this.chunks.get(cx + ',' + cz);
    if (!c) return B.AIR;
    return c.blocks[((x - cx * CH) * CH + (z - cz * CH)) * WH + y];
  }
  setBlock(x, y, z, id, record = true) {
    if (y < 0 || y >= WH) return;
    const cx = Math.floor(x / CH), cz = Math.floor(z / CH);
    const c = this.getChunk(cx, cz, true);
    const lx = x - cx * CH, lz = z - cz * CH;
    const i = (lx * CH + lz) * WH + y;
    const prev = c.blocks[i];
    c.blocks[i] = id;
    c.recomputeTop(lx, lz);
    c.dirty = true;
    if (lx === 0) this.markDirty(cx - 1, cz); if (lx === CH - 1) this.markDirty(cx + 1, cz);
    if (lz === 0) this.markDirty(cx, cz - 1); if (lz === CH - 1) this.markDirty(cx, cz + 1);
    const tk = x + ',' + y + ',' + z;
    if (LIGHT_R[prev]) this.torches.delete(tk);
    if (LIGHT_R[id]) this.torches.set(tk, [x + 0.5, y + 0.6, z + 0.5, LIGHT_R[id]]);
    if (record) {
      const wx = U.mod(x, WORLD_W), wz = U.mod(z, WORLD_W);
      const colKey = wx * 65536 + wz;
      let col = this.edits.get(colKey);
      if (!col) { col = new Map(); this.edits.set(colKey, col); }
      col.set(y, id);
    }
  }
  markDirty(cx, cz) { const c = this.chunks.get(cx + ',' + cz); if (c) c.dirty = true; }
  topAt(x, z) {
    const cx = Math.floor(x / CH), cz = Math.floor(z / CH);
    const c = this.chunks.get(cx + ',' + cz);
    if (!c) return SEA;
    return c.tops[(x - cx * CH) * CH + (z - cz * CH)];
  }
  // highest solid block at column (ignores leaves/torches), generating the chunk if needed
  groundY(x, z, fromY = SKY_SPLIT - 1) {
    const cx = Math.floor(x / CH), cz = Math.floor(z / CH);
    const c = this.getChunk(cx, cz, true);
    const base = ((x - cx * CH) * CH + (z - cz * CH)) * WH;
    for (let y = Math.min(WH - 1, fromY); y > 0; y--) { const b = c.blocks[base + y]; if (isSolid(b) && !isLeaf(b)) return y; }
    return 0;
  }
  layerAt(y, x, z) {
    if (y < CORE_TOP) return 'Core';
    if (y >= SKY_SPLIT) return 'Sky';
    if (this.getBlock(x, y, z) === B.WATER) return 'Water';
    const top = this.topAt(x, z);
    if (y < top - 3) return 'Mines';
    return 'Surface';
  }
  biomeAt(x, z) {
    const cx = Math.floor(x / CH), cz = Math.floor(z / CH);
    const c = this.chunks.get(cx + ',' + cz);
    if (!c) return BIOME.PLAINS;
    return c.biome[(x - cx * CH) * CH + (z - cz * CH)];
  }
  // nearest block of a type within loaded chunks (scans columns, cheap enough for an occasional hint)
  findNearest(id, px, pz, radius = 48) {
    let best = null, bd = radius * radius;
    const cx0 = Math.floor(px / CH), cz0 = Math.floor(pz / CH), cr = Math.ceil(radius / CH);
    for (let cx = cx0 - cr; cx <= cx0 + cr; cx++) for (let cz = cz0 - cr; cz <= cz0 + cr; cz++) {
      const c = this.chunks.get(cx + ',' + cz); if (!c) continue;
      for (let lx = 0; lx < CH; lx++) for (let lz = 0; lz < CH; lz++) {
        const wx = cx * CH + lx, wz = cz * CH + lz; const d = (wx - px) ** 2 + (wz - pz) ** 2; if (d >= bd) continue;
        const base = (lx * CH + lz) * WH;
        for (let y = 1; y < SKY_SPLIT; y++) if (c.blocks[base + y] === id) { bd = d; best = { x: wx, y, z: wz }; break; }
      }
    }
    return best;
  }
  findSpawn() {
    const r = U.rng(this.seed ^ 0xABCD);
    let fallback = null;
    // spiral outwards so the camp is as close to the origin as a forest allows
    for (let ring = 0; ring <= 24 && !this.spawn; ring++) {
      for (let i = 0; i < 40 && !this.spawn; i++) {
        const a = r() * Math.PI * 2, d = ring * 60 + r() * 60;
        const x = Math.floor(Math.cos(a) * d), z = Math.floor(Math.sin(a) * d);
        const info = this.colInfo(x, z);
        if ((info.h > SEA + 3 || !this.preset.water) && (!this.preset.brine || info.h > this.preset.brineLevel + 3) && info.h < 66 && !info.lost && !info.lostRim) {
          // a small clearing: no trees within two blocks, flat-ish ground
          let clear = true;
          for (let dx = -2; dx <= 2 && clear; dx++) for (let dz = -2; dz <= 2; dz++) { const ci = this.colInfo(x + dx, z + dz); if (this.treeAt(x + dx, z + dz, ci) || Math.abs(ci.h - info.h) > 2) { clear = false; break; } }
          if (!clear) continue;
          if (info.biome === BIOME.FOREST || (this.preset.biomes === 'moon' && info.biome === BIOME.HIGHLANDS) || (this.preset.biomes === 'halo' && info.biome === BIOME.DUNES)) this.spawn = { x: x + 0.5, y: info.h + 1, z: z + 0.5 };
          else if (!fallback && (info.biome === BIOME.PLAINS || this.preset.biomes !== 'earth')) fallback = { x: x + 0.5, y: info.h + 1, z: z + 0.5 };
        }
      }
    }
    if (!this.spawn) this.spawn = fallback;
    if (!this.spawn) { const info = this.colInfo(0, 0); this.spawn = { x: 0.5, y: Math.max(info.h, SEA) + 2, z: 0.5 }; }
    const a = this.heartAngle;
    this.heart = { x: Math.round(this.spawn.x + Math.cos(a) * 1050), z: Math.round(this.spawn.z + Math.sin(a) * 1050) }; // a long way out: you only find it with the Deep Chart
    // the body's one legendary creature: a fixed lair a long way out from the landing pad, in a zone nothing ordinary survives
    if (this.preset.legend) { const la = a + 2.1; const ld = this.preset.id === 'halo' ? 900 : 700; this.legend = { x: Math.round(this.spawn.x + Math.cos(la) * ld), z: Math.round(this.spawn.z + Math.sin(la) * ld), r: 120 }; }
    return this.spawn;
  }
  // The ruin near spawn: a fusion table on a little stone platform with torches.
  placeSpawnRuin() {
    const sx = Math.floor(this.spawn.x) + 5, sz = Math.floor(this.spawn.z) + 4;
    const gy = this.groundY(sx, sz);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      this.setBlock(sx + dx, gy, sz + dz, B.STONE);
      for (let y = gy + 1; y <= gy + 3; y++) if (this.getBlock(sx + dx, y, sz + dz) !== B.AIR) this.setBlock(sx + dx, y, sz + dz, B.AIR);
    }
    this.setBlock(sx, gy + 1, sz, B.FUSION);
    this.setBlock(sx - 1, gy + 1, sz - 1, B.TORCH);
    this.setBlock(sx + 1, gy + 1, sz + 1, B.TORCH);
    this.ruin = { x: sx + 0.5, y: gy + 1, z: sz + 0.5 };
  }
  // a landing pad: basalt platform with a Starmetal return pad in the middle and lights at the corners
  placePad(x, z) {
    const gy = this.groundY(x, z);
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { this.setBlock(x + dx, gy, z + dz, B.BASALT); for (let y = gy + 1; y <= gy + 4; y++) if (this.getBlock(x + dx, y, z + dz) !== B.AIR) this.setBlock(x + dx, y, z + dz, B.AIR); }
    this.setBlock(x, gy + 1, z, B.STARMETAL);
    for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) this.setBlock(x + dx, gy + 1, z + dz, B.TORCH);
    this.setBlock(x, gy, z + 3, B.BASALT); this.setBlock(x, gy + 1, z + 3, B.PORTAL); for (let y = gy + 2; y <= gy + 4; y++) if (this.getBlock(x, y, z + 3) !== B.AIR) this.setBlock(x, y, z + 3, B.AIR);
    this.pad = { x: x + 0.5, y: gy + 1, z: z + 0.5 };
  }
  // ensure chunks exist in radius around a chunk coordinate; returns number generated
  ensureAround(cx, cz, radius, budget) {
    let made = 0;
    const order = [];
    for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) order.push([dx * dx + dz * dz, cx + dx, cz + dz]);
    order.sort((a, b) => a[0] - b[0]);
    for (const [, x, z] of order) {
      if (!this.chunks.has(this.key(x, z))) { this.getChunk(x, z, true); made++; if (made >= budget) break; }
    }
    return made;
  }
  unloadFar(cx, cz, radius, onUnload) {
    for (const [k, c] of this.chunks) {
      if (Math.abs(c.cx - cx) > radius || Math.abs(c.cz - cz) > radius) {
        onUnload(c); this.chunks.delete(k);
        for (const [tk, p] of this.torches) {
          if (Math.floor(p[0] / CH) === c.cx && Math.floor(p[2] / CH) === c.cz) this.torches.delete(tk);
        }
      }
    }
  }
  addStatue(x, y, z, obj, yaw) {
    const k = x + ',' + y + ',' + z;
    obj.yaw = yaw; obj.x = x; obj.y = y; obj.z = z;
    this.statues.set(k, obj);
    this.setBlock(x, y, z, B.STATUE);
    if (obj.glow) this.torches.set('s' + k, [x + 0.5, y + 1, z + 0.5, obj.radius]);
  }
  removeStatue(x, y, z) {
    const k = x + ',' + y + ',' + z;
    const obj = this.statues.get(k); if (!obj) return null;
    this.statues.delete(k); this.torches.delete('s' + k);
    this.setBlock(x, y, z, B.AIR);
    return obj;
  }
  serializeEdits() {
    const out = [];
    for (const [ck, col] of this.edits) for (const [y, id] of col) out.push(ck, y, id);
    return out;
  }
  loadEdits(arr) {
    for (let i = 0; i + 2 < arr.length; i += 3) {
      const ck = arr[i], y = arr[i + 1], id = arr[i + 2];
      let col = this.edits.get(ck); if (!col) { col = new Map(); this.edits.set(ck, col); }
      col.set(y, id);
    }
  }
}
