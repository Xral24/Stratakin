'use strict';
// Game state, main loop, chunk streaming, progression, save/load.
const G = {
  world: null, player: null, kin: [], box: [], eggs: [], activeIdx: 0, MAX_KIN: 8, xp: 0, trainerLevel: 1,
  stats: null, questState: null, paused: false, running: false, mobile: false, saveTimer: 0, mythicCaught: false, shards: 0,
  SAVE_KEY: 'strata-save-v1', viewR: 4, lastT: 0, questTimer: 0, deathT: 0, secure: {}, respawnPoint: null, worldId: 'earth', worlds: {}, baseSeed: 0,
  villageState: {}, lastVillage: null, fisherSpot: null, fisherTarget: null, founded: [], dayCount: 0, wasNight: null,
};
function freshStats() { return { got: {}, crafted: {}, caught: 0, battlesWon: 0, fused: 0, reachedMines: false, reachedCore: false, heartFound: false, mythicDone: false }; }

G.init = function () {
  this.mobile = ('ontouchstart' in window) && (navigator.maxTouchPoints > 0) && window.innerWidth < 1100;
  const cv = document.getElementById('gl');
  R.init(cv, this.mobile);
  this.viewR = this.mobile ? 3 : 5;
  Controls.init(cv, { touch: this.mobile, onAction: (kind, v) => this.onKey(kind, v) });
  UI.init(this); Battle.init(this); Dialogue.init(); Fishing.init(this);
  KIN.buildUniverse();
  window.addEventListener('resize', () => R.resize());
  UI.showStart(Saves.list(), (id) => this.continueGame(id), (seed, starter, name) => this.newWorld(seed, starter, name));
  document.addEventListener('visibilitychange', () => { if (document.hidden && this.running) this.save(); });
  window.addEventListener('pagehide', () => { if (this.running) this.save(); });
};
G.onKey = function (kind, code) {
  if (kind === 'lock') { if (!code && this.running && !Battle.active && !UI.panelOpen) this.setPaused(true, 'lock'); if (code) this.setPaused(false); return; }
  if (!this.running) return;
  if (code === 'Escape') { if (UI.panelOpen) UI.closePanel(); return; }
  if (Battle.active) return;
  if (code === 'KeyR') this.toggleRide();
  if (code === 'KeyF') this.stealthSnare();
  if (code === 'KeyE') UI.panelOpen === 'craft' ? UI.closePanel() : UI.openPanel('craft');
  if (code === 'KeyQ') UI.panelOpen === 'kin' ? UI.closePanel() : UI.openPanel('kin');
  if (code === 'KeyJ') UI.panelOpen === 'quest' ? UI.closePanel() : UI.openPanel('quest');
  if (code === 'KeyV') this.toggleCamera();
};
G.setPaused = function (v, why) {
  this.paused = v;
  if (v) { Controls.setEnabled(false); if (!this.mobile && why !== 'lock') Controls.unlock(); }
  else { Controls.setEnabled(true); if (!this.mobile && !Controls.locked) Controls.lock(); }
};

// ---------- world setup ----------
G.setupWorld = function (seed, presetId) {
  this.baseSeed = seed >>> 0; this.worldId = presetId || 'earth';
  this.world = new World(seed, PRESETS[this.worldId]);
  if (!this.player) this.player = new Player(this.world); else this.player.world = this.world;
  this.player.autoJump = this.mobile; this.player.gravity = this.world.preset.gravity;
  if (!this.player.onAdd) {
    this.player.onAdd = (item, n) => { const first = !this.stats.got[item]; this.stats.got[item] = (this.stats.got[item] || 0) + n; if (first && this.running && ITEMS[item] && ITEMS[item].desc) this.explain(ITEMS[item].name, ITEMS[item].desc); };
    const origAdd = this.player.add.bind(this.player);
    this.player.add = (item, n = 1) => { origAdd(item, n); this.player.onAdd(item, n); };
  }
  this.world.findSpawn();
  Wild.init(this.world, this.mobile);
  Weather.init(this.world.seed);
  Village.init(this); Hazards.init(this); Campaign.init(this); Npcs.init(this); Camps.init(this); Mer.init(this); Lab.init(this); Avatar.init(this); Combat.init(this); Buddy.init(this); Relics.init(this); Keeps.init(this); Citadel.init(this); Farms.init(this); Sky.init(this);
  Quests.init(this);
};
G.newWorld = function (seed, starterIdx, name) {
  UI.loading(true);
  const slot = Saves.create(name); this.SAVE_KEY = slot.key; this.gameId = slot.id; this.gameName = slot.name;
  setTimeout(() => {
    this.stats = freshStats(); this.questState = null; this.xp = 0; this.trainerLevel = 1; this.mythicCaught = false; this.kin = []; this.box = []; this.eggs = []; this.activeIdx = 0; this.shards = 0; this.village = null; this.secure = {}; this.respawnPoint = null; this.worlds = {}; this.worldId = 'earth';
    this.villageState = {}; this.poiState = {}; this.chests = {}; this.npcState = {}; this.labState = {}; this.amulet = { cd: 0, kind: null, until: 0, charges: 0 }; this.skin = 'ranger'; this.thirdPerson = false; this.lastVillage = null; this.fisherSpot = null; this.fisherTarget = null; this.founded = []; this.dayCount = 0; this.wasNight = null; this.fisherTried = false;
    this.player = null; this.setupWorld(seed, 'earth');
    const w = this.world, s = w.spawn;
    w.ensureAround(Math.floor(s.x / CH), Math.floor(s.z / CH), 4, 999);
    this.village = Village.stamp(s);
    Wild.noSpawn = { x: this.village.x, z: this.village.z, r: 15 };
    const p = this.player; p.x = s.x; p.y = s.y + 0.2; p.z = s.z;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = Math.floor(s.y); y < s.y + 3; y++) { const b = w.getBlock(Math.floor(s.x) + dx, y, Math.floor(s.z) + dz); if (isLeaf(b) || (b === B.LOG && !dx && !dz)) w.setBlock(Math.floor(s.x) + dx, y, Math.floor(s.z) + dz, B.AIR); }
    w.setBlock(Math.floor(s.x) + 1, Math.floor(s.y), Math.floor(s.z) + 1, B.CAMPFIRE); // the magic camp fire: light and resting spot
    this.camp = { x: Math.floor(s.x) + 1, y: Math.floor(s.y), z: Math.floor(s.z) + 1 };
    w.placeSpawnRuin(); this.stats.ruinPlaced = true;
    p.yaw = Math.atan2(-(this.village.x - s.x), -(this.village.z - s.z));
    this.stats.recipes = { earth: [0, 1], moon: [0], halo: [0] };
    const starter = KIN.create(KIN.starters(seed)[starterIdx], 5);
    this.kin.push(starter);
    p.add('torch', 2); p.add('snare', 1); p.add('bread', 1);
    this.start();
    UI.toast(`Welcome to Stratakin. ${KIN.name(starter)} is with you.`, 'good');
    UI.showTutorial();
  }, 30);
};
G.continueGame = function (id) {
  const slot = Saves.get(id); if (!slot) { UI.toast('That game is gone.'); return; }
  this.SAVE_KEY = slot.key; this.gameId = slot.id; this.gameName = slot.name;
  UI.loading(true);
  setTimeout(() => { if (!this.load()) { UI.loading(false); UI.toast('Save could not be read.'); return; } this.start(); UI.toast(`Welcome back to ${slot.name}.`, 'good'); }, 30);
};
// back to the list of games (after saving); a new world is started from there without touching this one
G.toGames = function (startNew) { this.save(); try { if (startNew) sessionStorage.setItem('stratakin-start', 'new'); } catch (e) {} location.reload(); };
G.start = function () {
  const p = this.player, w = this.world;
  w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 2, 99);
  if (this.village && this.worldId === 'earth') { Village.restoreStart(this.village); Wild.noSpawn = { x: this.village.x, z: this.village.z, r: 15 }; w.ensureAround(Math.floor(this.village.x / CH), Math.floor(this.village.z / CH), 1, 99); }
  if (this.worldId !== 'earth' && w.pad) Wild.noSpawn = { x: w.pad.x, z: w.pad.z, r: 10 };
  if (this.camp && this.worldId === 'earth' && w.getBlock(this.camp.x, this.camp.y, this.camp.z) !== B.CAMPFIRE) w.setBlock(this.camp.x, this.camp.y, this.camp.z, B.CAMPFIRE);
  this.meshPass(99);
  UI.loading(false); UI.hideStart();
  this.running = true; this.lastT = performance.now();
  this.setPaused(false);
  this.updateMusic(false);
  requestAnimationFrame((t) => this.loop(t));
};
G.newWorldFromMenu = function () { this.toGames(true); };
G.deleteGame = function (id) { Saves.remove(id); };

G.sfx = function (n) { UI.sfx(n); };
// ---------- dropping items ----------
G.dropItem = function (key, n) {
  const p = this.player; if (!key) return;
  const info = p.itemInfo(key); if (info.obj) return;
  if (info.gear) { UI.toast('Gear stays with you.'); return; }
  const have = p.count(key); const take = Math.min(have, n);
  p.take(key, take); UI.sfx('miss'); UI.toast(`Dropped ${info.name} ×${take}.`); UI.renderHotbar();
};
G.dropSelected = function (n) { this.dropItem(this.player.selected(), n); };
// ---------- stealth snare ----------
G.stealthTarget = function () {
  const p = this.player; let best = null, bd = Infinity;
  for (const e of Wild.list) {
    if (e.chase || e.cool > 0 || e.alert >= 0.98 || e.isBoss || e.lieutenant) continue;
    const reach = 3.2 + Math.min(4, (e.model.radius || 0.6)); // close to its body, not its middle: big Kin can be snared from their side
    const d = Math.hypot(e.x - p.x, e.z - p.z, (e.y - p.y) * 0.7);
    if (d < reach && d - reach < bd) { bd = d - reach; best = e; }
  }
  return best;
};
G.stealthSnare = function () {
  const e = this.stealthTarget(); if (!e || Battle.active) return;
  if (!this.player.has('snare') && !this.player.has('snare2')) { UI.toast('No snares. Craft one: 2 wood, 2 stone.'); return; }
  if (!this.healthyKin().length) { UI.toast('You need an awake Kin with you to set a snare.'); return; }
  Battle.start(e, true, { stealth: true });
};
// ---------- riding ----------
// what a Kin's body lets it carry you through: legs on land, fins in water, wings or hovering in the air
G.rideMode = function (k) {
  const sp = k.sp;
  if (sp.shape === 'fish' || sp.shape === 'serpent') return 'water';
  if (sp.shape === 'bird' || sp.shape === 'floater' || sp.feat.wings) return 'air';
  if (sp.shape === 'quadruped' || sp.shape === 'raptor' || sp.shape === 'horned' || sp.shape === 'longneck') return 'land';
  return null;
};
G.rideRequirement = function (k) {
  const r = k.sp.rarity || 0;
  if (k.sp.tame) return 1;
  const base = { land: 6, water: 10, air: 18 }[this.rideMode(k)];
  if (base == null) return null;
  return base + r * 5 + (k.sp.mythic ? 20 : 0);
};
G.toggleRide = function () {
  const p = this.player;
  if (Battle.active || Dialogue.active()) return;
  if (p.mount) { const was = p.mount; p.mount = null; if (was.borrowed) Camps.horseHome(); else UI.toast('You climb off.'); return; }
  const k = this.activeKin(); if (!k) return;
  if (!(this.stats.camp || {}).rogueTamed && !k.sp.tame && !k.sp.fast) { UI.toast('You do not know how to ride yet. Dusty Hale teaches it, out at his ranch (♞ on the map).'); return; }
  if (this.rideMode(k) === 'land' && !(k.sp.steed || k.sp.fast || k.sp.tame || k.sp.legend || k.sp.apex)) { UI.toast(`${KIN.name(k)} will not carry a rider. Only a few kinds of land Kin ever do: steeds (marked in your Kindex), the dinosaurs, and the legendaries.`); return; }
  const req = this.rideRequirement(k);
  if (req == null) { UI.toast(`${KIN.name(k)} cannot carry you. Legs carry you on land, fins in the water, wings in the air.`); return; }
  if (this.trainerLevel < req) { UI.toast(`${KIN.name(k)} will carry you at trainer level ${req}. You are ${this.trainerLevel}.`); return; }
  if (k.level < 8 && !k.sp.tame) { UI.toast(`${KIN.name(k)} is too young to carry you (Lv 8).`); return; }
  const mode = this.rideMode(k);
  if (!k.tamed && !k.sp.tame) { if (mode === 'water' && !p.inWater) { UI.toast(`Break ${KIN.name(k)} in where it lives: get in the water first.`); return; } Taming.start(k, { onDone: (kk) => this.mountKin(kk) }); return; }
  if (mode === 'water' && !p.inWater) { UI.toast(`${KIN.name(k)} carries you in the water. Get in first.`); return; }
  if (mode === 'air' && this.noKinFlight()) { UI.toast(this.world.preset.airless ? `There is no air here for ${KIN.name(k)} to fly in.` : `No room down here for ${KIN.name(k)} to spread its wings.`); return; }
  p.mount = k; p.mountMode = mode; UI.sfx('util');
  UI.toast(mode === 'air' ? (k.level >= 20 ? `You climb onto ${KIN.name(k)}. Jump, then hold ▲ to climb, hold ▼ to come down, let go to hover. It lands you softly.` : `You climb onto ${KIN.name(k)}. It glides; at Lv 20 it will fly.`) : mode === 'water' ? `You climb onto ${KIN.name(k)}. It floats you; hold ▼ to dive.` : `You climb onto ${KIN.name(k)}.`, 'good');
};
// flying Kin need open sky and air: not in the Mines, not in the Core, not on the airless worlds
G.noKinFlight = function () { const p = this.player, w = this.world; if (w.preset.airless) return true; const L = w.layerAt(Math.floor(p.y), Math.floor(p.x), Math.floor(p.z)); return L === 'Mines' || L === 'Core'; };
G.mountKin = function (k) { const p = this.player; const mode = this.rideMode(k); if (!mode) return; p.mount = k; p.mountMode = mode; UI.sfx('util'); UI.toast(`You climb onto ${KIN.name(k)}.`); };
G.toast = function (m, c) { UI.toast(m, c); };
G.toggleCamera = function () { this.thirdPerson = !this.thirdPerson; UI.toast(this.thirdPerson ? 'Third person. You can see yourself now; V or the menu switches back.' : 'First person.'); };

// ---------- progression ----------
G.activeKin = function () { const k = this.kin[this.activeIdx]; return (k && k.hp > 0) ? k : this.healthyKin()[0] || null; };
G.healthyKin = function () { return this.kin.filter(k => k.hp > 0); };
G.setActive = function (k) { this.activeIdx = this.kin.indexOf(k); UI.toast(`${KIN.name(k)} leads.`); };
// total xp to reach trainer level L: quadratic early, steeper later (level 100 takes about three and a half times what it used to)
G.trainerXpFor = function (L) { const x = L - 1; return 40 * x * x * (1 + x / 40); };
G.trainerLevelFor = function (xp) { let L = 1; while (L < 1000 && this.trainerXpFor(L + 1) <= xp) L++; return L; };
G.trainerProgress = function () { const L = this.trainerLevel; const a = this.trainerXpFor(L), b = this.trainerXpFor(L + 1); return U.clamp((this.xp - a) / (b - a), 0, 1); };
G.addTrainerXp = function (n) {
  this.xp += n; const L = this.trainerLevelFor(this.xp);
  if (L > this.trainerLevel) { this.trainerLevel = L; UI.sfx('level'); UI.toast(`Trainer level ${L}.` + (L % 4 === 0 ? ' New, stronger Kin have appeared in the wilds.' : ''), 'good'); }
};
G.craft = function (id) {
  const r = RECIPES.find(x => x.id === id); if (!r || (r.when && !r.when(this))) return;
  if (this.darkRecipe(r) && !this.nearDarkTable()) { UI.toast(this.DARK_MSG, 'bad'); return; }
  const p = this.player;
  if (ITEMS[r.out].gear && p.has(r.out)) return;
  for (const k in r.needs) if (p.count(k) < r.needs[k]) return;
  for (const k in r.needs) p.take(k, r.needs[k]);
  p.add(r.out, r.n);
  this.stats.crafted[r.out] = (this.stats.crafted[r.out] || 0) + 1;
  UI.sfx('place');
  if (ITEMS[r.out].block) { const hb = p.hotbar(); p.sel = Math.max(0, hb.indexOf(r.out)); }
  if (!this.stats.revealed) this.stats.revealed = {};
  const seen = this.stats.revealed[r.out] = (this.stats.revealed[r.out] || 0) + 1;
  if (seen <= 2) { UI.openPanel('reveal', { kind: 'item', item: r.out, n: r.n, fromCraft: true }); return true; }
  UI.toast(`Crafted ${ITEMS[r.out].name}${r.n > 1 ? ' ×' + r.n : ''}.`, 'good');
  return false;
};
// ---------- the fusion table grid ----------
// slots: array of 16 entries {kin} | {item} | null. Returns a preview of what the table would make.
G.previewGrid = function (slots) {
  const kins = slots.filter(s => s && s.kin).map(s => s.kin);
  const items = slots.filter(s => s && s.item).map(s => s.item);
  // essences never fuse into Kin: they are tonic ingredients. Minerals and plants tilt a fusion.
  const essences = items.filter(k => k.startsWith('ess_'));
  const nonEss = items.filter(k => !k.startsWith('ess_'));
  const elems = nonEss.filter(k => ITEMS[k].elem).map(k => ITEMS[k].elem);
  // 1. a recipe in the grid always wins; Kin in the grid mark the result
  if (items.length) {
    const counts = {}; for (const it of items) counts[it] = (counts[it] || 0) + 1;
    let best = null;
    for (const r of RECIPES) {
      if (r.when && !r.when(this)) continue;
      if (this.darkRecipe(r) && !this.nearDarkTable()) continue;
      if (ITEMS[r.out].gear && this.player.has(r.out)) continue;
      let ok = true, used = 0; for (const k in r.needs) { if ((counts[k] || 0) < r.needs[k]) { ok = false; break; } used += r.needs[k]; }
      if (!ok) continue;
      const times = Math.min(...Object.keys(r.needs).map(k => Math.floor(counts[k] / r.needs[k])));
      const mult = ITEMS[r.out].gear ? 1 : times;
      const leftover = items.length - used * mult;
      if (!best || leftover < best.leftoverN) best = { kind: 'craft', recipe: r, out: r.out, n: r.n * mult, mult, leftoverN: leftover, leftover: leftover ? leftover + ' item' + (leftover > 1 ? 's' : '') + ' stay in the grid' : '' };
    }
    if (best) {
      if (kins.length) {
        if (kins.length >= this.kin.length) return { kind: 'none', msg: 'You cannot put all of your Kin into a tool. Keep at least one.' };
        // first Kin: +50% scaled by its level; each extra Kin +1%
        const lead = kins.reduce((a, b) => (b.level > a.level ? b : a));
        const power = 1 + 0.5 * Math.min(1.6, 0.6 + lead.level / 25) + 0.01 * (kins.length - 1);
        best.power = +power.toFixed(2); best.mark = KIN.name(lead); best.kins = kins; best.shards = kins.reduce((a, k) => a + KIN.shardsFor(k), 0);
        if (!ITEMS[best.out].gear) best.n = Math.round(best.n * power);
      }
      return best;
    }
  }
  // 2. fusion is a recipe: exactly two particular Kin and the right element stone
  if (kins.some(k => k.sp.noFuse)) return { kind: 'none', msg: `${KIN.name(kins.find(k => k.sp.noFuse))} will not go in a table. It is what it is.` };
  if (kins.length > 4) return { kind: 'none', msg: 'No fusion takes more than four Kin.' };
  if (kins.length >= 2) {
    if (items.some(it => this.DARK.includes(it)) && !this.nearDarkTable()) return { kind: 'none', msg: this.DARK_MSG };
    const rc = KIN.findRecipe(kins.map(k => k.sp));
    if (!rc) return { kind: 'none', msg: `These ${kins.length} do not fuse. Only certain sets do: check the recipes you know.` };
    if (!this.knowsRecipe(rc)) return { kind: 'none', msg: 'Something stirs between them, but you do not know this fusion yet. Someone out there does.' };
    if (rc.alt) { // a fork: the table decides. An ordinary table makes the Light one (Light Stone); the Dark Fusion Table makes the Dark one (Void Stone). The first table you use is the path for good
      const key = rc.body + ':' + rc.i; const chosen = (this.stats.forks || {})[key]; const onDark = this.nearDarkTable();
      const branch = onDark ? 'alt' : 'main'; const need = onDark ? rc.alt.stone : rc.stone; const outSp = onDark ? rc.alt.out : rc.out;
      if (chosen && chosen !== branch) return { kind: 'none', msg: chosen === 'alt' ? `You made ${rc.alt.out.names[0]} on the Dark Fusion Table. This fusion is Dark now, for good: an ordinary table will not take it.` : `You made ${rc.out.names[0]} on an ordinary table. This fusion is Light now, for good: the Dark Table will not take it.` };
      if (!items.includes('stone_' + need)) return { kind: 'none', msg: chosen ? `Right set. It needs a ${need} Stone, the path you chose.` : onDark ? `Right set, and this one forks. On the Dark Fusion Table it comes out Dark: ${rc.alt.out.names[0]}. It needs a Void Stone (3 Void essence and an iron, made here).` : `Right set, and this one forks. On an ordinary table it comes out Light: ${rc.out.names[0]}. It needs a Light Stone. On the Kinmaster's Dark Fusion Table, with a Void Stone, the same pair comes out Dark: ${rc.alt.out.names[0]}. You only get to choose once.` };
      return { kind: 'fusion', kin: KIN.fuseRecipe(rc, kins, branch), n: kins.length, items: 1, recipe: rc, branch, stone: need, fork: !chosen, essNote: !chosen ? `This is a fork. Fuse here and ${outSp.names[0]} is the ${onDark ? 'Dark' : 'Light'} path for good: ${onDark ? rc.out.names[0] : rc.alt.out.names[0]} is gone.` : '' };
    }
    if (!items.includes('stone_' + rc.stone)) return { kind: 'none', msg: `Right pair. It needs a ${rc.stone} Stone on the table too (3 ${rc.stone} essence and an iron).` };
    return { kind: 'fusion', kin: KIN.fuseRecipe(rc, kins), n: kins.length, items: 1, recipe: rc, stone: rc.stone, essNote: '' };
  }
  // 3. one Kin plus materials becomes an object in its shape
  if (kins.length === 1 && items.length) {
    if (this.kin.length === 1) return { kind: 'none', msg: 'You cannot turn your only Kin into an object.' };
    if (!nonEss.length) return { kind: 'none', msg: 'Essences do not fuse or build. Add minerals for a statue, or another Kin to fuse.' };
    const obj = KIN.makeStatue(kins[0], nonEss);
    return { kind: 'statue', obj, kin: kins[0], essNote: essences.length ? 'Essences stay in the grid.' : '' };
  }
  if (kins.length === 1) return { kind: 'none', msg: 'Add another Kin to fuse, or materials to turn this one into a statue (add something burning for a lamp).' };
  // 4. items that match nothing distil into an essence
  if (items.length) {
    if (elems.length) {
      const tally = {}; for (const e of elems) tally[e] = (tally[e] || 0) + 1;
      const top = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
      return { kind: 'distill', out: 'ess_' + top };
    }
    return { kind: 'none', msg: 'Nothing here reacts. Add an ore, an essence or a Kin.' };
  }
  return null;
};
// recipes you know, per planet; you start with two on Earth and quest people teach the rest
// crafting needs a Fusion Table within a few steps
G.nearTable = function () { const p = this.player, w = this.world; const x0 = Math.floor(p.x), y0 = Math.floor(p.y), z0 = Math.floor(p.z); for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) for (let dy = -3; dy <= 3; dy++) if (w.getBlock(x0 + dx, y0 + dy, z0 + dz) === B.FUSION || w.getBlock(x0 + dx, y0 + dy, z0 + dz) === B.DARKTABLE) return true; return false; };
// the Kinmaster's own table, in the throne room at Thornhold: the only one that takes dark materials
G.DARK = ['void', 'ess_Void', 'stone_Void'];
G.nearDarkTable = function () { const p = this.player, w = this.world; const x0 = Math.floor(p.x), y0 = Math.floor(p.y), z0 = Math.floor(p.z); for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) for (let dy = -3; dy <= 3; dy++) if (w.getBlock(x0 + dx, y0 + dy, z0 + dz) === B.DARKTABLE && Keeps.tableOpen(x0 + dx, z0 + dz)) return true; return false; };
G.darkRecipe = function (r) { return Object.keys(r.needs).some(k => this.DARK.includes(k)) || this.DARK.includes(r.out); };
G.DARK_MSG = 'Dark materials will not work on an ordinary table. Only the Kinmaster\'s Dark Fusion Table, in the throne room at Thornhold, takes Void.';
// the party: eight slots, eggs take one each; anything more goes to storage, reached at any Fusion Table
G.partyFull = function () { return this.kin.length + this.eggs.length >= this.MAX_KIN; };
G.addKin = function (k) {
  if (!this.partyFull()) { this.kin.push(k); return 'party'; }
  this.box.push(KIN.serialize(k)); UI.toast(`Your party is full (${this.MAX_KIN}). ${KIN.name(k)} went to storage: swap Kin at any Fusion Table.`); return 'box';
};
// eggs: carried in a party slot, hatch after you have walked far enough with them
G.addEgg = function (sp, from, need) {
  if (this.partyFull()) { UI.toast(`No room for an egg: your party is full (${this.MAX_KIN}). Put a Kin in storage at a Fusion Table and come back.`, 'bad'); return false; }
  // steps to hatch on foot, by rarity (Pokemon eggs take about 1,300 to 30,000 steps; most around 5,000). Early story eggs pass their own short count
  const STEPS = [2500, 4000, 6500, 10000, 16000]; const r = Math.max(0, Math.min(4, sp.rarity || 0));
  this.eggs.push({ id: Date.now() + Math.random(), seed: sp.seed, from: from || '', walked: 0, need: need || STEPS[r], rarity: r, label: sp.eggLabel || null }); UI.sfx('quest');
  return true;
};
// hatch an egg (from the bag or the incubator): into the party if there is room, otherwise into storage
G.hatchEgg = function (e, how) { const sp = KIN.bySeed(e.seed) || KIN.dex('earth')[0]; const k = KIN.create(sp, 5); if (this.kin.length + this.eggs.length < this.MAX_KIN) this.kin.push(k); else this.box.push(KIN.serialize(k)); this.seenDex(k.sp, 'caught'); UI.sfx('caught'); UI.openPanel('reveal', { kind: 'kin', kin: k, parents: [], n: 0, caught: how }); return k; };
G.updateEggs = function (dist) {
  if (!this.eggs.length || !(dist > 0)) return;
  for (const e of this.eggs.slice()) {
    e.walked += dist; const left = e.need - e.walked;
    if (left <= 0) { this.eggs = this.eggs.filter(x => x !== e); this.hatchEgg(e, 'Hatched from the egg you carried.'); }
    else if (Math.floor((e.walked - dist) / 500) < Math.floor(e.walked / 500)) UI.toast(`The egg moves. About ${Math.ceil(left)} more steps.`);
  }
};
G.knowsRecipe = function (rc) { const k = (this.stats.recipes || {})[rc.body] || []; return k.includes(rc.i); };
G.learnRecipe = function (body, from) {
  if (!this.stats.recipes) this.stats.recipes = {}; const known = this.stats.recipes[body] || (this.stats.recipes[body] = []);
  const all = KIN.recipes(body); const next = all.find(rc => !known.includes(rc.i) && (rc.i < 20 || known.includes(rc.i - 20)));
  if (!next) return null; known.push(next.i);
  if (from) UI.toast(next.alt ? `${from} teaches you a forked fusion: ${next.parts.map(sp => sp.names[0]).join(' + ')}. On an ordinary table with a Light Stone it makes ${next.out.names[0]}; on a Dark Fusion Table with a Void Stone it makes ${next.alt.out.names[0]}.` : `${from} teaches you a fusion: ${next.parts.map(sp => sp.names[0]).join(' + ')} + ${next.stone} Stone makes ${next.out.names[0]}.`, 'good');
  if (next.alt && !this.stats.forkTold) { this.stats.forkTold = true; this.explain('A forked fusion', `Some fusions can go two ways, and the table decides. Put the same Kin on an ordinary Fusion Table with a Light Stone and they come out Light: ${next.out.names[0]}. Put them on the Kinmaster's Dark Fusion Table, in one of his Holds, with a Void Stone, and they come out Dark: ${next.alt.out.names[0]}. Whichever table you use first is the path that recipe takes for good. The other Kin is lost to you, so choose with care.`); }
  return next;
};
G.seenDex = function (sp, how) {
  if (!sp || !sp.dex) return; if (!this.stats.dex) this.stats.dex = {}; const prev = this.stats.dex[sp.seed]; if (prev === 'caught') return;
  if (how === 'caught' || !prev) this.stats.dex[sp.seed] = how;
  if (!prev) { const where = sp.fusion ? 'made only by a fusion recipe' : sp.home ? (sp.home.layer === 'Surface' ? 'lives in the ' + sp.home.biome : 'lives in the ' + sp.home.layer.toLowerCase()) : ''; this.explain(`New in your Kindex: #${sp.dex} ${sp.names[0]}`, `${KIN.RARITY[sp.rarity || 0].name[0].toUpperCase() + KIN.RARITY[sp.rarity || 0].name.slice(1)}, ${KIN.dominant(sp.elem, 1)[0]}, ${where}.`); }
};
// a bubble the first time you meet something: what it is and what to do with it
G.explain = function (title, text) { UI.explain(title, text); };
G.fuseGrid = function (slots) {
  const pv = this.previewGrid(slots);
  const p = this.player;
  const kins = slots.filter(s => s && s.kin).map(s => s.kin);
  const items = slots.filter(s => s && s.item).map(s => s.item);
  if (pv.kind === 'fusion') {
    p.take('stone_' + (pv.stone || pv.recipe.stone), 1); // only the stone is used up; anything else stays
    if (pv.recipe.alt) { if (!this.stats.forks) this.stats.forks = {}; this.stats.forks[pv.recipe.body + ':' + pv.recipe.i] = pv.branch; }
    this.seenDex(pv.kin.sp, 'caught');
    const res = pv.kin;
    const firstIdx = Math.min(...kins.map(k => this.kin.indexOf(k)));
    this.returnGear(kins); this.kin = this.kin.filter(k => !kins.includes(k));
    this.kin.splice(Math.min(firstIdx, this.kin.length), 0, res);
    this.activeIdx = U.clamp(this.activeIdx, 0, this.kin.length - 1);
    if (!this.kin[this.activeIdx] || this.kin[this.activeIdx].hp <= 0 || kins.includes(this.kin[this.activeIdx])) this.activeIdx = this.kin.indexOf(res);
    this.stats.fused++;
    if (kins.some(k => k.sp.mythic)) this.mythicCaught = true;
    return { kind: 'fusion', kin: res };
  }
  if (pv.kind === 'statue') {
    for (const it of items) if (!it.startsWith('ess_')) p.take(it, 1);
    const k = kins[0]; this.returnGear([k]);
    this.kin = this.kin.filter(x => x !== k);
    this.activeIdx = U.clamp(this.activeIdx, 0, Math.max(0, this.kin.length - 1));
    p.objects.push(pv.obj);
    this.stats.statues = (this.stats.statues || 0) + 1;
    return { kind: 'statue', obj: pv.obj };
  }
  if (pv.kind === 'craft') {
    const r = pv.recipe;
    for (const k in r.needs) p.take(k, r.needs[k] * pv.mult);
    p.add(r.out, pv.n);
    this.stats.crafted[r.out] = (this.stats.crafted[r.out] || 0) + 1;
    if (pv.kins) {
      this.returnGear(pv.kins); this.kin = this.kin.filter(k => !pv.kins.includes(k));
      this.activeIdx = U.clamp(this.activeIdx, 0, Math.max(0, this.kin.length - 1));
      if (ITEMS[r.out].gear) p.gearPower[r.out] = { power: pv.power, mark: pv.mark, shards: pv.shards };
      else this.shards += pv.shards; // consumables cannot carry a mark, so the Kin's worth is paid out in Shards right away
    }
    return { kind: 'craft', out: r.out, n: pv.n, power: pv.power, mark: pv.mark };
  }
  if (pv.kind === 'distill') {
    for (const it of items) p.take(it, 1);
    p.add(pv.out, 1);
    return { kind: 'craft', out: pv.out, n: 1 };
  }
  return pv;
};
// Dismantling: anything the table made comes apart into its raw materials; a Kin inside becomes Shards.
G.dismantleList = function () {
  const p = this.player, out = [];
  for (const r of RECIPES) {
    const info = ITEMS[r.out];
    if (info.gear) { if (p.has(r.out)) out.push({ key: r.out, name: info.name, col: info.col, gives: r.needs, shards: (p.gearPower[r.out] || {}).shards || 0, mark: (p.gearPower[r.out] || {}).mark, n: 1 }); }
    else if (p.count(r.out) >= r.n) out.push({ key: r.out, name: info.name, col: info.col, gives: r.needs, shards: 0, n: r.n, count: p.count(r.out) });
  }
  for (const o of p.objects) { const gives = {}; for (const it of (o.items || [])) gives[it] = (gives[it] || 0) + 1; out.push({ key: 'obj:' + o.id, name: o.name, col: o.col, gives, shards: o.shards || 0, obj: o, n: 1 }); }
  return out;
};
G.dismantle = function (entry) {
  const p = this.player;
  if (entry.obj) { p.objects = p.objects.filter(o => o !== entry.obj); }
  else { if (!p.take(entry.key, entry.n)) return false; if (ITEMS[entry.key].gear) delete p.gearPower[entry.key]; }
  for (const k in entry.gives) p.add(k, entry.gives[k]);
  this.shards += entry.shards;
  this.stats.dismantled = (this.stats.dismantled || 0) + 1;
  return true;
};
// the bow: tap a Kin a long way off. The arrow takes a chunk of its health, never the last of it, and it comes for you.
// Balloons pop; targets count for archery jobs.
G.shoot = function (pick) {
  const p = this.player;
  const ammo = pick && p.has(pick) ? pick : (this.stats.ammo && p.has(this.stats.ammo)) ? this.stats.ammo : ['arrow_ember', 'arrow', 'arrow_barbed', 'arrow_frost', 'arrow_spark', 'arrow_heavy', 'arrow_void', 'arrow_sleep'].find(a => p.has(a)) || null; if (pick) this.stats.ammo = pick;
  const bw = Combat.bow(); if (!bw) { UI.toast(Combat.anyBow() ? 'Your bow is broken. An armoury will mend it.' : 'You need a bow.', 'bad'); return; }
  if (!ammo) { UI.toast('No arrows. Craft them: 1 wood, 1 stone, 1 frond makes 6.', 'bad'); return; }
  if (this.lastShot && performance.now() - this.lastShot < 600) return; this.lastShot = performance.now();
  p.take(ammo, 1); Combat.use(bw, 1); UI.sfx('place'); UI.renderHotbar();
  { const fh = Combat.arrowHit(ammo, 40); const wall0 = fh && p.raycast(40, false, true); if (fh && (!wall0 || wall0.dist > fh.dist)) { UI.sfx('hit'); const ft = Combat.focusText(); if (ft) UI.toast(ft); return; } }
  const e = Wild.pick(p, 40); const wall = p.raycast(40, false, true); // arrows fly past torches, ladders and plants
  const eD = e ? Math.hypot(e.x - p.x, e.y - p.y, e.z - p.z) : Infinity;
  if (wall && wall.dist < eD) {
    if (wall.id === B.BALLOON) { this.world.setBlock(wall.x, wall.y, wall.z, B.AIR); this.meshPass(99); UI.sfx('caught'); Builds.onShot('balloon', wall, p); return; }
    if (wall.id === B.TARGET && Citadel.onTarget(wall)) return;
    if (wall.id === B.TARGET) { UI.sfx('hit'); Builds.onShot('target', wall, p); return; }
    UI.toast('The arrow thunks into the ground.'); return;
  }
  if (!e) { UI.toast('Missed.'); return; }
  const st = KIN.stats(e.kin); const unaware = (e.alert || 0) < 0.6;
  let bite = ITEMS[ammo].arrow * (unaware ? 2 : 1);
  if (e.isApex || e.isLegend || e.isBoss || e.isLabBoss || e.lieutenant) bite *= 0.35; // the big ones shrug most of it off
  const dmg = Math.max(1, Math.round(st.hp * bite)); const before = e.kin.hp;
  e.kin.hp = Math.max(1, e.kin.hp - dmg); e.alert = 1; e.ringT = 3; e.cool = 0; if (e.sleep) e.sleep = false;
  if (ammo === 'arrow_sleep' || ammo === 'arrow_frost') { e.alert = 0; e.ringT = 0; e.hunt = 0; e.cool = ammo === 'arrow_sleep' ? 12 : 5; }
  this.stats.arrowHits = (this.stats.arrowHits || 0) + 1;
  if (e.high && Math.random() < 0.6) { p.add('feather', 1); setTimeout(() => UI.toast('A Sky Feather spins down to you.', 'good'), 400); }
  const pct = Math.round(e.kin.hp / st.hp * 100);
  UI.sfx('hit'); UI.toast(`${unaware ? 'Clean shot! ' : 'Hit! '}${KIN.name(e.kin)} down to ${pct}% (${before - e.kin.hp} damage). ${e.kin.hp <= 1 ? 'It is barely standing.' : 'It is coming for you.'}`, 'good');
};
// use a consumable from the Bag or by tapping with it held
G.useItem = function (key) {
  const p = this.player; const info = key ? p.itemInfo(key) : null; if (!info || !info.use || !p.has(key)) return false;
  if (info.use === 'warm') { p.take(key, 1); this.warmUntil = performance.now() + 240000; UI.sfx('util'); UI.toast('Warm all the way through. Four minutes before the cold can bite.', 'good'); UI.renderHotbar(); return true; }
  if (info.use === 'player') { if (p.hp >= p.maxHp) { UI.toast('You are at full health.'); return false; } p.take(key, 1); p.hp = p.maxHp; UI.sfx('util'); UI.toast('You feel whole again.', 'good'); UI.renderHotbar(); return true; }
  if (info.use === 'party') { if (!this.kin.some(k => k.hp > 0 && k.hp < KIN.stats(k).hp)) { UI.toast('Nobody needs it right now (fainted Kin need a Revive Tonic).'); return false; } p.take(key, 1); for (const k of this.kin) if (k.hp > 0) k.hp = Math.min(KIN.stats(k).hp, k.hp + KIN.stats(k).hp * 0.5); UI.sfx('util'); UI.toast('Your Kin feel refreshed (fainted ones need a Revive Tonic).', 'good'); UI.renderHotbar(); return true; }
  if (info.use === 'tech') { const k = this.kin[this.activeIdx]; if (!k) return false; UI.openPanel('draught'); return false; }
  if (info.use === 'kin') { UI.openPanel('kin'); UI.toast('Pick the Kin to use it on.'); return false; }
  if (info.use === 'self') { p.take(key, 1); const until = performance.now() + 240000; if (info.lure) { this.lure = { elem: info.lure, until }; this.repelUntil = 0; UI.toast(`${info.lure} Kin will come to you for four minutes.`, 'good'); } else { this.repelUntil = until; this.lure = null; for (const e of Wild.list) if (!e.isBoss && !e.lieutenant && !e.raider) { e.alert = 0; e.hunt = 0; } UI.toast('The wild goes quiet around you for four minutes.', 'good'); } UI.sfx('util'); UI.renderHotbar(); return true; }
  return false;
};
G.returnGear = function (kins) { for (const k of kins) { if (!k.equip) continue; for (const slot in k.equip) if (k.equip[slot]) this.player.add(k.equip[slot], 1); k.equip = null; } };
G.equipKin = function (k, item) {
  const info = ITEMS[item]; if (!info || !info.kinGear || !this.player.has(item)) return false;
  if (!k.equip) k.equip = {};
  const old = k.equip[info.kinGear]; if (old) this.player.add(old, 1);
  this.player.take(item, 1); k.equip[info.kinGear] = item;
  if (k.hp > KIN.stats(k).hp) k.hp = KIN.stats(k).hp;
  UI.sfx('place'); UI.toast(`${KIN.name(k)} wears the ${info.name}.`, 'good'); UI.renderHotbar(); return true;
};
G.unequipKin = function (k, slot) { if (!k.equip || !k.equip[slot]) return false; this.player.add(k.equip[slot], 1); k.equip[slot] = null; k.hp = Math.min(k.hp, KIN.stats(k).hp); UI.sfx('miss'); UI.renderHotbar(); return true; };
G.useTonic = function (item, k) {
  const p = this.player; if (!p.has(item)) return false;
  const info = ITEMS[item];
  if (item === 'tonic_heal') { const mx = KIN.stats(k).hp; if (k.hp <= 0) { UI.toast(`${KIN.name(k)} is fainted. It needs a Revive Tonic.`); return false; } if (k.hp >= mx) { UI.toast(`${KIN.name(k)} is already at full health.`); return false; } k.hp = Math.min(mx, k.hp + mx * 0.6); }
  else if (item === 'tonic_revive') { if (k.hp > 0) { UI.toast(`${KIN.name(k)} is awake already.`); return false; } k.hp = Math.round(KIN.stats(k).hp * 0.5); }
  else if (info.stat) { if (k.iv[info.stat] >= 1.25) { UI.toast(`${KIN.name(k)} cannot grow further that way.`); return false; } const before = KIN.stats(k).hp; k.iv[info.stat] = Math.min(1.25, k.iv[info.stat] + 0.05); const after = KIN.stats(k).hp; if (info.stat === 'hp') k.hp += after - before; }
  p.take(item, 1); UI.sfx('util'); UI.toast(`${info.name} used on ${KIN.name(k)}.`, 'good'); return true;
};
// Traits of the leading Kin apply outside battle.
G.traits = function () { const k = this.activeKin(); return (k && k.sp.traits) || []; };

// ---------- battle hooks ----------
G.onBattleStart = function (e) {
  UI.lookLabel('');
  this.player.mount = null; UI.setButtons({ ride: false, snare: false });
  this.player.frozen = true; Controls.setEnabled(false); if (!this.mobile) Controls.unlock();
  UI.sfx('alert');
  document.getElementById('hud').classList.add('in-battle');
};
G.onBattleEnd = function (result, wildE, wild, mine, ambush) {
  const p = this.player;
  document.getElementById('hud').classList.remove('in-battle');
  if (mine) mine.buffs = null;
  const st = wild.sp.mythic;
  const baseXp = Math.floor(9 * wild.level * (1 + 0.4 * (wild.stage - 1)) * KIN.RARITY[wild.sp.rarity || 0].xp * (st ? 6 : 1));
  if (result === 'won' || result === 'caught') {
    const xp = result === 'won' ? baseXp : Math.floor(baseXp * 0.6);
    if (mine && mine.hp > 0) {
      for (const o of this.kin) if (o !== mine && o.hp > 0) { const oe = KIN.gainXp(o, Math.floor(xp * 0.25)); for (const ev of oe) if (ev.type === 'level') UI.toast(`${KIN.name(o)} (watching) reached Lv ${ev.level}.`); } // the rest of the party learns a little by watching; the fainted learn nothing
      const evs = KIN.gainXp(mine, xp);
      for (const ev of evs) { if (ev.type === 'peak') this.explain(`${KIN.name(mine)} has peaked`, `Lv ${ev.level} is as far as its kind goes. Only a fusion recipe can take it further.`); if (ev.type === 'level') UI.toast(`${KIN.name(mine)} reached Lv ${ev.level}.`, 'good'); if (ev.type === 'evolve') { UI.toast(`${ev.name}… it evolved into ${KIN.name(mine)}!`, 'good'); UI.sfx('level'); } }
    }
    this.addTrainerXp(xp);
    this.stats.battlesWon++;
    { const dom0 = KIN.dominant(wild.sp.elem, 1)[0]; if (result === 'won') { if (!this.stats.beatElem) this.stats.beatElem = {}; this.stats.beatElem[dom0] = (this.stats.beatElem[dom0] || 0) + 1; } else { if (!this.stats.caughtElem) this.stats.caughtElem = {}; this.stats.caughtElem[dom0] = (this.stats.caughtElem[dom0] || 0) + 1; } }
    if (wildE.isLabBoss) Lab.onBossBeaten();
    if (wildE.lairQuest) Npcs.onLairBeaten(wildE.lairQuest);
    if (wildE.nightQuest) Builds.onBattle(wildE.nightQuest, result);
    if (wildE.kinmaster) Campaign.onBoss(result);
    if (wildE.keepBoss) Keeps.onBattle(wildE.keepBoss, result);
    if (wildE.skyBoss) Sky.onBattle(result);
    if (wildE.finalBoss) Keeps.onFinal(result);
    if (wildE.citadelFirst) Citadel.onBattle(wildE, result);
    if (wildE.thief) Village.thiefCaught(wildE.thief);
    if (wildE.pest) Farms.onBattle(wildE, result);
    if (result === 'won') {
      const dom = KIN.dominant(wild.sp.elem, 1)[0];
      if (Math.random() < ((wild.sp.rarity || 0) >= 2 || wildE.elite ? 1 : 0.6)) { p.add('ess_' + dom, 1); UI.toast(`${dom} Essence collected.`); }
      if (st) { this.stats.mythicDone = true; UI.toast('The Mantlewyrm sinks back into the Starmetal. Next time, bring Void Snares.', 'good'); }
    } else {
      wild.buffs = null; wild.hp = Math.max(1, wild.hp);
      this.stats.caught++; this.seenDex(wild.sp, "caught");
      if (this.addKin(wild) === 'party') UI.toast(`${KIN.name(wild)} joined you (${this.kin.length + this.eggs.length}/${this.MAX_KIN}).`, 'good');
      if (st) { this.stats.mythicDone = true; this.mythicCaught = true; UI.toast('You hold the Mythic of the Core. The Starmetal hums: the sky beyond opens in the next version.', 'good'); }
    }
    Wild.remove(wildE);
    if (wildE.isBoss) { Village.onBossGone(wildE.villageId); Village.freed(wildE.villageId); UI.toast('The village is free.', 'good'); }
    if (wildE.isLegend && !this.stats.lostMap) setTimeout(() => this.giveLostMap('A voice on the wind'), 4000);
    if (wildE.isApex) { if (!this.stats.apex) this.stats.apex = {}; this.stats.apex[wildE.isApex] = result === 'caught' ? true : { back: (this.dayCount || 0) + 10 }; UI.sfx('quest'); UI.toast(result === 'caught' ? `${KIN.name(wild)} is yours. Nobody is going to believe this.` : `${KIN.name(wild)} is beaten, not caught. It will be back in about ten days.`, 'good'); this.addTrainerXp(5000); }
    if (wildE.isLegend) { if (!this.stats.legends) this.stats.legends = {}; this.stats.legends[this.worldId] = true; if (!this.stats.legendBack) this.stats.legendBack = {}; this.stats.legendBack[this.worldId] = result === 'caught' ? 'caught' : (this.dayCount || 0) + 6; if (result !== 'caught') setTimeout(() => UI.toast(`${KIN.name(wild)} limps away. It will be back in about six days, for another chance to catch it.`), 2500); UI.sfx('quest'); UI.toast(`${KIN.name(wild)} is ${result === 'caught' ? 'yours' : 'beaten'}. The portals of ${this.world.preset.name} wake: every arch you hold now reaches the other worlds, and theirs reach here.`, 'good'); this.addTrainerXp(2000); }
    if (wildE.lieutenant) Village.lieutenantDown(wildE.lieutenant);
  } else if (result === 'ran') {
    wildE.alert = 0; wildE.cool = 7;
  } else if (result === 'lost') {
    // the winner comes after you: run, or it knocks you out
    UI.toast('Your Kin are down. RUN!', 'bad');
    wildE.alert = 0; wildE.cool = 999; wildE.chase = { t: 14, hitCd: 0 }; wildE.speed = Math.max(wildE.speed, 3.9); wildE.patrol = null; wildE.sleep = false;
    Wild.chaser = wildE;
  }
  p.frozen = false;
  this.fightGrace = performance.now() + 8000; // a breather: nothing jumps you for eight seconds after a fight
  for (const e of Wild.list) if (!e.isBoss && !e.lieutenant && !e.isLegend && !e.isApex && !e.isLabBoss && !e.chase) { e.alert = 0; e.hunt = 0; }
  Controls.setEnabled(true); if (!this.mobile) Controls.lock();
  this.save();
};
// Death: everything in the bag is lost except gear, objects, Shards, Kin, and what sits in the five secure slots.
G.loseBag = function () {
  const p = this.player; const lost = [];
  for (const [k, n] of [...p.inv]) {
    if (ITEMS[k].gear || ITEMS[k].keep) continue; // gear, rods and the reel stay with you
    const keep = Math.min(n, this.secure[k] || 0);
    if (keep < n) lost.push(`${ITEMS[k].name} ×${n - keep}`);
    if (keep > 0) p.inv.set(k, keep); else p.inv.delete(k);
  }
  if (lost.length) UI.toast('Lost: ' + lost.slice(0, 4).join(', ') + (lost.length > 4 ? '…' : ''), 'bad');
  UI.renderHotbar();
};
G.respawn = function () {
  const p = this.player, w = this.world, s = this.respawnPoint || w.spawn;
  this.loseBag();
  w.ensureAround(Math.floor(s.x / CH), Math.floor(s.z / CH), 1, 99);
  const fx = Math.floor(s.x), fz = Math.floor(s.z), fy = Math.floor(s.y);
  const onFloor = s.y != null && isSolid(w.getBlock(fx, fy - 1, fz)) && w.getBlock(fx, fy, fz) === B.AIR && w.getBlock(fx, fy + 1, fz) === B.AIR;
  p.x = s.x; p.z = s.z; p.y = (onFloor ? fy : w.groundY(fx, fz) + 1) + 0.2; p.vx = p.vy = p.vz = 0; p.hp = p.maxHp; p.dead = false; p.breath = 1; p.fallStart = null;
};

// ---------- travelling between worlds ----------
G.captureWorldState = function () {
  const w = this.world;
  return { edits: w.serializeEdits(), statues: [...w.statues.values()].map(o => { const c = Object.assign({}, o); delete c.model; delete c.mesh; return c; }), time: w.time, regrow: (w.regrow || []).map(r => ({ x: r.x, y: r.y, z: r.z, t: 0, leaf: !!r.leaf, id: r.id })), respawnPoint: this.respawnPoint, village: this.village, pad: w.pad || null, camp: this.camp || null, visited: true };
};
G.restoreWorldState = function (st) {
  const w = this.world;
  if (!st) return;
  w.loadEdits(st.edits || []);
  for (const o of (st.statues || [])) { w.statues.set(o.x + ',' + o.y + ',' + o.z, o); if (o.glow) w.torches.set('s' + o.x + ',' + o.y + ',' + o.z, [o.x + 0.5, o.y + 1, o.z + 0.5, o.radius]); }
  w.time = st.time || 0.3;
  w.regrow = (st.regrow || []).map(r => ({ x: r.x, y: r.y, z: r.z, t: performance.now() + 30000 + Math.random() * 60000, leaf: !!r.leaf, id: r.id }));
  this.respawnPoint = st.respawnPoint || null; this.village = st.village || null; w.pad = st.pad || null; this.camp = st.camp || null;
};
G.travel = function (targetId) {
  const p = this.player;
  this.worlds[this.worldId] = this.captureWorldState();
  for (const c of this.world.chunks.values()) R.freeChunk(c);
  Wild.clear(); Wild.chaser = null;
  this.village = null; this.respawnPoint = null;
  this.setupWorld(this.baseSeed, targetId);
  const w = this.world;
  this.restoreWorldState(this.worlds[targetId]);
  p.flying = false; p.vx = p.vy = p.vz = 0; p.mount = null; p.leftWorld = false;
  if (targetId === 'earth') {
    if (this.pendingWake && this.lastVillage && this.lastVillage.world && this.lastVillage.world !== 'earth') this.lastVillage = null; // the village you last stood in was off-world: camp it is
    const s = this.respawnPoint || w.spawn;
    w.ensureAround(Math.floor(s.x / CH), Math.floor(s.z / CH), 3, 999);
    p.x = s.x; p.z = s.z; p.y = w.groundY(Math.floor(s.x), Math.floor(s.z)) + 1.2;
    if (this.village) { Village.restoreStart(this.village); Wild.noSpawn = { x: this.village.x, z: this.village.z, r: 15 }; }
    if (this.pendingWake) { this.pendingWake = false; if (this.lastVillage && this.respawnPoint) Village.wakeDialogue(); else UI.toast('You black out up there and wake at camp, your Kin whole.', 'bad'); }
    else UI.toast('Home. The village air again.', 'good');
  } else {
    const s = w.spawn;
    w.ensureAround(Math.floor(s.x / CH), Math.floor(s.z / CH), 3, 999);
    if (!w.pad) w.placePad(Math.floor(s.x), Math.floor(s.z));
    p.x = w.pad.x + 2.5; p.z = w.pad.z + 0.5; p.y = w.pad.y + 0.2; p.yaw = Math.PI / 2;
    this.respawnPoint = { x: w.pad.x + 2.5, y: w.pad.y, z: w.pad.z + 0.5 };
    Wild.noSpawn = { x: w.pad.x, z: w.pad.z, r: 10 };
    if (!this.stats.reached) this.stats.reached = {};
    if (targetId === 'moon' && !this.stats.reachedMoon) this.stats.reachedMoon = true;
    if (!this.stats.reached[targetId]) { this.stats.reached[targetId] = true; UI.toast(targetId === 'moon' ? 'The Moon. Low gravity, no air, and villages of people who glow. Mind the Mare: things move under it.' : 'Halo. Amber dunes under a ring that fills the sky. The brine eats skin and the sky drops stones; the caravan towns are glad of visitors.', 'good'); }
    else UI.toast(`Back on ${w.preset.name}.`, 'good');
    if (this.lastVillage && this.lastVillage.world === targetId && (this.villageState[this.lastVillage.id] || {}).freed) { const lv = this.lastVillage; this.respawnPoint = { x: lv.x + 0.5, y: lv.y, z: lv.z + 4.5 }; }
  }
  this.meshPass(99);
  this.save();
};
G.LAND_REACH = 6;
G.landHeight = function () { const p = this.player; return p.y - (this.world.groundY(Math.floor(p.x), Math.floor(p.z), Math.floor(p.y) + 1) + 1); };
G.boardShip = function () {
  const p = this.player;
  if (Battle.active || Dialogue.active()) return;
  if (p.flying) { // within reach of the ground: the ship stops and lowers itself down, no crash
    if (p.autoLand) return;
    if (this.landHeight() > G.LAND_REACH) { UI.toast(`Too high to land. Hold ▼ to get within ${G.LAND_REACH} blocks of the ground.`); return; }
    p.autoLand = true; UI.toast('Landing. Hold ▲ to call it off.');
    return;
  }
  if (!p.has('ship')) return;
  if (p.inWater || p.inLava) { UI.toast('Board from dry ground.'); return; }
  if (this.world.layerAt(Math.floor(p.y), Math.floor(p.x), Math.floor(p.z)) === 'Mines' || p.y < CORE_TOP) { UI.toast('The ship needs open sky. Go up to the surface.'); return; }
  p.flying = true; p.mount = null; p.vy = 4; UI.sfx('fuse'); UI.toast('Starship up. Hold ▲ to climb, hold ▼ to go down. Above the clouds the world lets go.', 'good');
};
// ---------- chunk streaming ----------
G.meshPass = function (budget) {
  const w = this.world, p = this.player;
  const pcx = Math.floor(p.x / CH), pcz = Math.floor(p.z / CH);
  const dirty = [];
  for (const c of w.chunks.values()) {
    if (!c.dirty) continue;
    const d = Math.max(Math.abs(c.cx - pcx), Math.abs(c.cz - pcz));
    if (d > this.viewR) continue;
    // need all neighbours generated for correct seams / AO
    let ok = true;
    for (let dx = -1; dx <= 1 && ok; dx++) for (let dz = -1; dz <= 1; dz++) if (!w.chunks.has((c.cx + dx) + ',' + (c.cz + dz))) { ok = false; break; }
    if (ok) dirty.push([(c.cx - pcx) ** 2 + (c.cz - pcz) ** 2, c]);
  }
  dirty.sort((a, b) => a[0] - b[0]);
  let n = 0;
  for (const [, c] of dirty) { R.buildChunk(w, c); if (++n >= budget) break; }
};
G.streamChunks = function () {
  const w = this.world, p = this.player;
  const pcx = Math.floor(p.x / CH), pcz = Math.floor(p.z / CH);
  w.ensureAround(pcx, pcz, this.viewR + 1, p.flying ? 4 : 2);
  this.meshPass(p.flying ? 4 : (this.mobile ? 2 : 3));
  if ((this.frame & 63) === 0) w.unloadFar(pcx, pcz, this.viewR + 3, (c) => R.freeChunk(c));
};

// ---------- loop ----------
G.frame = 0;
G.loop = function (t) {
  if (!this.running) return;
  requestAnimationFrame((tt) => this.loop(tt));
  let dt = Math.min(0.05, (t - this.lastT) / 1000); this.lastT = t; this.frame++;
  const w = this.world, p = this.player;
  const input = Controls.poll();
  const inBattle = Battle.active;
  if (!this.paused) {
    const t0 = w.time; w.time = (w.time + dt / 1500) % 1; // 25-minute days
    if (w.time < t0) this.dayCount = (this.dayCount || 0) + 1;
    const nightNow = Math.cos(w.time * Math.PI * 2) > 0.17;
    if (this.wasNight === true && !nightNow) this.onDawn();
    this.wasNight = nightNow;
    Weather.update(dt); this.stats.playT = (this.stats.playT || 0) + dt; if (((this.frame || 0) & 31) === 0) Lab.tickEggs();
    if (this.buffOn('train')) { this.trainT = (this.trainT || 0) + dt; if (this.trainT >= 60) { this.trainT = 0; for (const k of this.kin) if (k.hp > 0) KIN.gainXp(k, 15 + k.level * 6); } }
    if (!inBattle) {
      p.yaw -= input.lookDX; p.pitch = U.clamp(p.pitch - input.lookDY, -1.55, 1.55);
      if (input.hotbarDelta) { p.sel += input.hotbarDelta; UI.renderHotbar(); }
      if (input.hotbarSelect >= 0) { p.sel = input.hotbarSelect; UI.renderHotbar(); }
      p.trainerLevel = this.trainerLevel;
      const tr = this.traits();
      p.speedMul = (tr.includes('Swift') ? 1.25 : 1) * (Npcs.active('haste') ? 1.6 : 1); p.mineMul = tr.includes('Miner') ? 1.6 : 1; p.breathMul = tr.includes('Diver') ? 4 : 1;
      p.jumpMul = tr.includes('Climber') ? 1.15 : 1; p.autoJumpTrait = tr.includes('Climber') || !!(p.mount && p.mount.sp.climber); p.lavaMul = tr.includes('Warm') ? 0.5 : 1; p.senseMul = tr.includes('Stalker') ? 0.7 : 1;
      const healMul = tr.includes('Mender') ? 2 : 1;
      const hpBefore = p.hp;
      for (const k of this.kin) if (k !== p.mount && k.trust > 0) k.trust = Math.max(0, k.trust - dt / 21600); // trust drains over six hours of play without riding (only while the game runs)
      { const ox = p.x, oz = p.z; p.update(dt, input); if (this.eggs.length) { const d = Math.hypot(p.x - ox, p.z - oz); if (d < 5) this.updateEggs(p.mount || p.flying ? d * 0.5 : d); } }
      if (p.hp < hpBefore) { UI.sfx('hurt'); const now = performance.now(); if (!this.lastHurtToast || now - this.lastHurtToast > 6000) { this.lastHurtToast = now; const why = { drown: 'You are drowning. Get your head above water.', lava: 'Lava burns. You need a Lava Suit.', fall: 'That was a long fall.', kin: 'It is on you. Run, or you black out.', cold: 'You are freezing. Craft a Frost Cloak: 6 frond, 8 snow, 2 wood. Snow is the white ground here and on mountain tops; mine it, or buy it from a trader.', space: 'No air, no warmth. Get back in the ship, or craft a Space Suit.', brine: 'The brine burns. Get out, or wear a Lava Suit.', worm: 'A worm. Keep moving when the ground shakes, or stay off the Mare.', shard: 'A shard from the ring. When the sky whistles, run.', spear: 'Spears. They do not want you here: run until they turn back.' }[p.lastDamage]; if (why) UI.toast(why, 'bad'); } }
      if (p.landed) { p.landed = false; UI.sfx('place'); UI.toast('Landed. The ship folds up and follows you.', 'good'); }
      if (p.crashed) { p.crashed = false; UI.sfx('down'); UI.toast('You crashed the Starship. You wake at the village; the ship is scrap no longer, it follows you.', 'bad'); const s = this.respawnPoint || w.spawn; w.ensureAround(Math.floor(s.x / CH), Math.floor(s.z / CH), 1, 99); p.x = s.x; p.z = s.z; p.y = w.groundY(Math.floor(s.x), Math.floor(s.z)) + 1.2; p.vx = p.vy = p.vz = 0; p.hp = Math.max(1, p.hp - 3); p.hurtFlash = 0.5; }
      if (p.leftWorld) { p.leftWorld = false; p.y = WH + 24; UI.openPanel('destination'); }
      if (p.dead) {
        const byKin = p.lastDamage === 'kin', cause = p.lastDamage;
        for (const k of this.kin) k.hp = KIN.stats(k).hp;
        p.chill = 0; p.chillTick = 0;
        const localVillage = this.lastVillage && this.lastVillage.world === this.worldId && (this.villageState[this.lastVillage.id] || {}).freed;
        if (this.worldId !== 'earth' && !localVillage) {
          // you black out off-world and wake at the last village on Earth
          this.loseBag(); p.dead = false; p.hp = p.maxHp; p.breath = 1; p.flying = false; p.mount = null;
          this.pendingWake = true; this.fadeTravel('earth');
        } else {
          this.respawn();
          if (byKin || this.respawnPoint) { if (this.lastVillage && this.respawnPoint) Village.wakeDialogue(); else UI.toast('You wake at camp, your Kin whole.', 'bad'); }
          else UI.toast(cause === 'lava' ? 'The lava took you. You wake at camp, your Kin whole. Craft a Lava Suit.' : cause === 'cold' ? 'The cold took you. You wake at camp, your Kin whole. Craft a Frost Cloak.' : 'You wake at camp, your Kin whole.', 'bad');
        }
      }
      // mining / placing
      if (input.mine && !p.blocking && p.cantMine && (!this.cantToastT || performance.now() - this.cantToastT > 2500)) { this.cantToastT = performance.now(); UI.toast(p.toolNeed(p.cantMine), 'bad'); }
      if (input.mine && !p.blocking) { const ev = p.mineTick(dt); if (ev) { UI.sfx('break'); if (ev.broke === B.FUSION) UI.toast('Fusion Table picked up.'); if (ev.broke === B.CHEST) this.onChestBroken(ev.x, ev.y, ev.z); if (ev.drop) { if (!this.stats.dug) this.stats.dug = {}; this.stats.dug[ev.drop] = (this.stats.dug[ev.drop] || 0) + 1; } } else if (p.mineTarget && (this.frame % 12) === 0) UI.sfx('mine'); }
      else { p.mineTarget = null; p.mineProgress = 0; }
      if (input.placePressed) this.onTap();
      // wild Kin
      Village.update(dt, p, false);
      Fishing.update(dt);
      if (this.village && this.worldId === 'earth') {
        const dv = Math.hypot(p.x - this.village.x, p.z - this.village.z);
        if (this.stats.elderDone && !this.stats.securePrompt && dv > 18 && !Dialogue.active()) { this.stats.securePrompt = true; Dialogue.show('Elder Hask, calling after you', ['One more thing! If the wild beats you, you wake up at the last village you visited, and your bag is gone, all of it, except your gear and the five secure slots.', 'Set the secure slots in the Craft menu. Whatever you put there, you keep. Shards and Kin are safe too. Go well.']); }
      }
      if (w.regrow && w.regrow.length && (this.frame & 31) === 0) { const now = performance.now(); w.regrow = w.regrow.filter(r => { if (now < r.t) return true; const b = w.getBlock(r.x, r.y, r.z); if (r.id != null) { if (b === B.AIR && !(Math.abs(r.x + 0.5 - p.x) < 0.8 && Math.abs(r.z + 0.5 - p.z) < 0.8 && r.y >= Math.floor(p.y) - 1 && r.y <= Math.floor(p.y) + 2)) { if (r.id === B.GLOWWORM && !isSolid(w.getBlock(r.x, r.y - 1, r.z))) return false; w.setBlock(r.x, r.y, r.z, r.id); } else if (b === B.AIR) { r.t = now + 15000; return true; } } else if (r.leaf) { if (b === B.LEAVES) w.setBlock(r.x, r.y, r.z, B.BERRYLEAF); } else if (b === B.AIR) w.setBlock(r.x, r.y, r.z, B.BERRY); return false; }); }
      const trig = (Dialogue.active() || Village.walking) ? null : Wild.update(dt, p, performance.now() / 1000, false);
      Buddy.update(dt, p); Keeps.update(dt, p); Citadel.update(dt, p); Farms.update(dt, p); Sky.update(dt, p); Combat.update(dt, p, input);
      Wild.ensureHeart(p, this.trainerLevel, this.mythicCaught); Wild.ensureLegend(p); Wild.ensureApex(p);
      if (trig && !trig.e.cool && !Dialogue.active() && !p.flying && !(this.fightGrace > performance.now()) && !((Keeps.inHold(p) || Citadel.inside(p) || Sky.inFort(p)) && !trig.e.keepBoss && !trig.e.skyBoss)) Battle.start(trig.e, trig.ambush);
      for (const e of Wild.list) if (e.cool > 0) e.cool -= dt;
      Hazards.update(dt, p, false); Npcs.update(dt, p, false); Campaign.update(dt, p, false); Taming.update(dt, p); if (p.gliding) { this.lastGlide = performance.now(); if (!this.stats.glideTold && !p.mount && !p.wingsOn) { this.stats.glideTold = true; G.explain('Gliding', 'Left stick: push sideways to bank and turn. Push forward to dive and pick up speed, pull back to brake. The arrow on the glide compass is the wind: with it behind you, you go far; into it, you barely move over the ground. Coming in to land, pull back a moment before the ground to flare and you touch down soft. Too fast and too steep, and it hurts. Let go of ▲ to drop, best done low.'); } }
      if (p.landMsg) { if (p.landMsg === 'hard') UI.toast('Hard landing. Pull back on the stick just before the ground to flare.', 'bad'); else if (p.landMsg === 'stall') UI.toast('You stalled her and dropped. Brake less: keep a little speed until the flare.', 'bad'); else if (p.landMsg === 'soft' && !this.stats.flareTold) { this.stats.flareTold = true; UI.toast('A clean flare. Feather-soft.', 'good'); } p.landMsg = null; }
      // passive healing
      for (const k of this.kin) { const mx = KIN.stats(k).hp; if (k.hp > 0 && k.hp < mx) k.hp = Math.min(mx, k.hp + mx * 0.012 * healMul * dt); }
      // layer stats
      const layer = w.layerAt(Math.floor(p.y), Math.floor(p.x), Math.floor(p.z));
      if (layer === 'Mines' && p.y < w.topAt(Math.floor(p.x), Math.floor(p.z)) - 6) this.stats.reachedMines = true;
      if (layer === 'Core' && !this.stats.reachedCore) { this.stats.reachedCore = true; UI.toast('You have broken into the Core: a sea of lava under a basalt sky, and the Heart somewhere in the dark. The compass star points at it.', 'good'); }
      if (p.y < 2.5 && (this.frame & 127) === 0) UI.toast('Mantle Rock. The floor of the world; nothing digs through it.');
      if (!this.stats.lostFound && (this.frame & 31) === 0 && w.lost && w.colInfo(Math.floor(p.x), Math.floor(p.z)).lost) { this.stats.lostFound = true; this.stats.lostMap = true; UI.toast('The Lost World. Ferns, old trees, and things that walked here before anything else did.', 'good'); }
      if (w.heart && p.y < 12 && Math.hypot(p.x - w.heart.x, p.z - w.heart.z) < 14) this.stats.heartFound = true;
      this.questTimer += dt;
      if (this.questTimer > 0.5) {
        this.questTimer = 0;
        for (const ev of Quests.update()) {
          if (ev.type === 'quest') { UI.sfx('quest'); UI.toast(`Quest complete: ${ev.q.title}`, 'good'); document.getElementById('quest-dot').classList.remove('hidden'); }
          if (ev.type === 'bounty') { UI.sfx('quest'); UI.toast(`Bounty ${ev.round - 1} paid: a Snare Cube and XP.`, 'good'); }
        }
      }
      Battle.tick(dt); // particle effects outside fights (guards at the walls)
      this.saveTimer += dt; if (this.saveTimer > 45) { this.saveTimer = 0; this.save(); }
    } else {
      Battle.tick(dt);
      Wild.update(dt, p, performance.now() / 1000, true);
      Village.update(dt, p, true);
    }
    this.streamChunks();
  }
  // render
  const eye = p.eye();
  let cam = { x: eye.x, y: eye.y, z: eye.z, yaw: p.yaw, pitch: p.pitch, fov: (this.mobile ? 75 : 70) * Math.PI / 180 };
  if (!inBattle && p.mount) { // riding: the camera sits back and up, further for bigger mounts, so the mount never fills the view
    const mm = KIN.model(p.mount.sp, p.mount.stage); const size = Math.max(mm.height, mm.radius * 1.4);
    cam = Avatar.thirdCam(cam, p, w, 4.5 + size * 1.6, 0.6 + mm.height * 0.45);
  } else if (this.thirdPerson && !inBattle) cam = Avatar.thirdCam(cam, p, w);
  // tall grass: the camera eases up and back over your shoulder (more when you crouch) so you see over the blades
  { const want = (!inBattle && !p.mount && !p.flying && Wild.inTallGrass()) ? (p.sneak ? 1 : 0.65) : 0; this.grassCamK = U.lerp(this.grassCamK || 0, want, Math.min(1, dt * 3));
    if (this.grassCamK > 0.02 && !this.thirdPerson) { const k = this.grassCamK; const tc = Avatar.thirdCam(cam, p, w, 4.2 * k, 1.35 * k); cam = Object.assign({}, cam, { x: tc.x, y: tc.y, z: tc.z, pitch: cam.pitch - 0.12 * k }); this.grassCamOn = k > 0.25; } else this.grassCamOn = false; }
  if (inBattle && Battle.camera) { const bc = Battle.camera(dt, this.mobile); if (bc) cam = Object.assign(cam, bc); }
  // talking to someone: the camera slides round to their face, a little to one side
  const talking = !inBattle && this.talkNpc && (Dialogue.active() || UI.panelOpen === 'shop' || UI.panelOpen === 'village');
  this.talkK = U.clamp((this.talkK || 0) + (talking ? dt * 2.5 : -dt * 2.5), 0, 1);
  if (!talking && this.talkK <= 0) this.talkNpc = null;
  if (this.talkK > 0 && this.talkNpc) cam = this.talkCamera(cam, this.talkNpc, U.smooth(this.talkK));
  if (this.shake > 0) { const sh = this.shake * 0.12, tt = performance.now() / 1000; cam = Object.assign({}, cam, { x: cam.x + Math.sin(tt * 43) * sh, y: cam.y + Math.sin(tt * 57) * sh * 0.7, z: cam.z + Math.cos(tt * 39) * sh }); }
  const lights = [];
  if (p.holdingTorch()) lights.push([eye.x, eye.y - 0.2, eye.z, 9]);
  else if (this.traits().includes('Lantern')) lights.push([eye.x, eye.y - 0.2, eye.z, 11]);
  const torches = [...w.torches.values()].map(tp => [tp[0], tp[1], tp[2], (tp[0] - p.x) ** 2 + (tp[2] - p.z) ** 2, tp[3]]).sort((a, b) => a[3] - b[3]);
  if (w.heart && p.y < 20 && Math.hypot(w.heart.x - p.x, w.heart.z - p.z) < 48) lights.push([w.heart.x + 0.5, 7, w.heart.z + 0.5, 18]);
  for (let i = 0; i < torches.length && lights.length < 8; i++) lights.push([torches[i][0], torches[i][1], torches[i][2], torches[i][4] || 10]);
  const lines = [];
  if (!inBattle && !this.paused) { const hit = p.raycast(5.5); if (hit && BLOCKS[hit.id].hard !== Infinity) lines.push({ data: R.targetLines(w, hit.x, hit.y, hit.z), color: [0, 0, 0, 0.75] }); }
  lines.push(...Wild.rings(p)); lines.push(...Hazards.lines());
  if (!R.state.underwater && !R.state.inCore && p.y >= w.topAt(Math.floor(p.x), Math.floor(p.z)) - 1) { const rl = Weather.rainLines(w, cam, performance.now() / 1000); if (rl) lines.push(rl); }
  document.getElementById('flash').style.opacity = Weather.state.flash > 0.6 ? 0.7 : 0;
  const ents = Wild.list.slice();
  if (Battle.mineEntity) ents.push(Battle.mineEntity);
  ents.push(...Village.entities());
  if (p.flying) ents.push({ x: p.x, y: p.y - 0.85, z: p.z, yaw: p.yaw + Math.PI, model: { height: 1 }, mesh: R.entityMesh('ship', (mb) => { const c = [0.75, 0.9, 0.95], d = [0.35, 0.4, 0.5], g = [0.4, 0.95, 1.0]; mb.box(-0.8, 0, -1.3, 0.8, 0.5, 1.4, c); mb.box(-0.4, 0.5, -0.2, 0.4, 0.9, 0.7, d); mb.box(-2.2, 0.15, -0.9, -0.8, 0.25, 0.1, c); mb.box(0.8, 0.15, -0.9, 2.2, 0.25, 0.1, c); mb.box(-0.6, 0.1, -1.6, -0.2, 0.4, -1.3, g, 1, true); mb.box(0.2, 0.1, -1.6, 0.6, 0.4, -1.3, g, 1, true); mb.box(-0.15, 0.15, 1.4, 0.15, 0.35, 1.9, g, 1, true); }), scale: 1, hover: Math.sin(performance.now() / 300) * 0.05, skyMul: 1, isMount: true });
  const showMe = inBattle || this.thirdPerson || this.talkK > 0 || !!p.mount || this.grassCamOn;
  if (showMe) { const me = Avatar.entity(p, Math.hypot(p.vx, p.vz) > 0.6); if (p.mount) { const mm = KIN.model(p.mount.sp, p.mount.stage); me.y = p.y - 0.75 + mm.height * 0.62; } ents.push(me); }
  if (p.mount) { const k = p.mount; const m = KIN.model(k.sp, k.stage); const fwd = U.forwardVec(p.yaw, 0); if (!k._an) k._an = { ph: 0, mv: 0, lx: p.x, lz: p.z, ly: p.y, lt: performance.now(), vy: 0, seed: 5, air: 0 }; k._an.swim = p.mountMode === 'water' ? 1 : 0; ents.push({ x: p.x + fwd[0] * 0.5, y: p.y - 0.75 + (p.inWater ? -0.2 : 0), z: p.z + fwd[2] * 0.5, yaw: p.yaw + Math.PI, model: m, mesh: R.entityMesh(KIN.meshKey(k.sp, k.stage), (mb) => KIN.buildMesh(mb, m)), scale: 1, hover: 0, skyMul: 1, isMount: true, flying: p.mountMode === 'air' && !p.onGround, _an: k._an }); }
  ents.push(...Battle.fxEntities()); ents.push(...Wild.dropEntities()); ents.push(...Buddy.entities()); ents.push(...Combat.entities()); ents.push(...Hazards.entities()); ents.push(...Npcs.entities());
  for (const o of w.statues.values()) {
    if ((o.x - p.x) ** 2 + (o.z - p.z) ** 2 > 4000) continue;
    if (!o.model) { o.model = KIN.statueModel(o); o.mesh = R.entityMesh('statue:' + o.id, (mb) => KIN.buildMesh(mb, o.model)); }
    const top = w.topAt(o.x, o.z); const sky = o.y >= SKY_SPLIT ? 1 : (o.y >= top ? 1 : Math.max(0, 1 - (top - o.y) * 0.11));
    ents.push({ x: o.x + 0.5, y: o.y, z: o.z + 0.5, yaw: o.yaw || 0, model: o.model, mesh: o.mesh, scale: o.scale || 1, hover: 0, skyMul: sky, isStatue: true });
  }
  for (const e of ents) if (e.isStatue || e.isFx || e.isMount || e.isBuddy || e.isFoe || !e.model) { /* static */ } else if (e.hitT > 0) { e.hover = (e.model.hover || 0) + Math.sin(e.hitT * 60) * 0.08; } else if (e.breach == null) e.hover = e.model.hover + (e.flying ? Math.sin((e.bob || 0) * 2) * 0.08 : 0);
  R.render(w, p, ents, cam, { lights, lines });
  if ((this.frame & 3) === 0) UI.renderHud(dt);
  if ((this.frame & 31) === 0 && !inBattle) UI.renderMinimap(p);
  if ((this.frame & 15) === 0) this.updateMusic(inBattle);
  if ((this.frame & 1) === 0) UI.renderSky(cam, this.world, R.state);
  if ((this.frame & 7) === 0 && !inBattle) {
    const st = this.stealthTarget();
    const lead = this.activeKin();
    UI.setButtons({ snare: !!st && (p.has('snare') || p.has('snare2')), ride: !p.flying && (!!p.mount || !!(lead && this.rideRequirement(lead) != null)), riding: !!p.mount, ship: p.has('ship') && (p.flying || this.world.layerAt(Math.floor(p.y), Math.floor(p.x), Math.floor(p.z)) !== 'Mines'), flying: p.flying, canLand: p.flying && (p.autoLand || this.landHeight() <= G.LAND_REACH) });
    if (p.mount && !p.mount.borrowed && (p.mount.hp <= 0 || !this.kin.includes(p.mount))) { p.mount = null; UI.toast('Your mount is down.', 'bad'); }
    if (p.mount && p.mountMode === 'water' && !p.inWater && p.onGround) { p.mount = null; UI.toast('It cannot follow you onto land.'); }
    if (p.mount && p.mountMode === 'air' && (this.frame & 15) === 0 && this.noKinFlight()) { p.mount = null; UI.toast('No room down here for wings that size. You climb off.'); }
  }
  if ((this.frame & 7) === 0 && !inBattle) { const npc = Village.pick(p); const rn = npc ? null : Npcs.pick(p); const we = (npc || rn) ? null : Wild.pick(p); const hit = (!npc && !we && !rn) ? p.raycast(5.5) : null; const campHit = hit && hit.id === B.CAMPFIRE;
    UI.lookLabel(rn ? Npcs.label(rn) + ' · tap' : npc ? `${npc.name}${npc.shop ? ' · ' + (npc.shopTitle || Village.SHOPS[npc.shop].title) : npc.role === 'voodoo' ? ' · healer' : npc.role === 'elder' ? ' · village ledger' : npc.role === 'traveller' ? ' · has something to trade' : npc.role === 'hermit' ? ' · hermit, has a job for you' : ''} · tap to talk` : we ? `${KIN.name(we.kin)} · Lv ${we.kin.level}${(we.kin.sp.rarity || 0) > 0 ? ' · ' + KIN.RARITY[we.kin.sp.rarity].name : ''}${we.raider ? ' · RAIDER' : we.isBoss ? ' · tyrant' : we.lieutenant ? " · the tyrant's guard" : ''}` : campHit ? 'Camp fire · tap to rest' : (hit && hit.id === B.STARMETAL) ? (this.worldId === 'moon' ? 'Return pad · tap to fly home' : 'Starmetal') : (hit && hit.id === B.FUSION) ? 'Fusion Table · tap' : (hit && hit.id === B.PORTAL) ? 'Portal · tap to travel' : (hit && hit.id === B.CHEST) ? 'Chest · tap to open' : (hit && hit.id === B.INCUBATOR) ? 'Incubator · tap' : (hit && (hit.id === B.DOOR || hit.id === B.DOOR_OPEN)) ? 'Door · tap' : (hit && hit.id === B.SNOW) ? 'Snow · hold to take (Frost Cloak needs 8)' : (hit && (hit.id === B.IRON || hit.id === B.COPPER || hit.id === B.EMBER || hit.id === B.VOID)) ? BLOCKS[hit.id].name + ' · hold to mine' : ''); }
};
G.onTap = function () {
  const p = this.player;
  if (Dialogue.active()) return;
  if (Fishing.active) { Fishing.tap(); return; }
  if (Taming.active) { Taming.tap(); return; }
  const npc = Village.pick(p);
  if (npc) { Village.talk(npc); return; }
  const rn = Npcs.pick(p);
  if (rn) { Npcs.talk(rn); return; }
  if (Buddy.pick(p) && !Wild.pick(p)) { Buddy.tap(); return; }
  { const sel0 = p.selected(); const ai = sel0 && ITEMS[sel0]; if (ai && ai.arrow && Combat.anyBow()) { this.shoot(sel0); return; } }
  if (Combat.weapon() && (Keeps.inHold(p) || Citadel.inside(p) || Sky.inFort(p) || !Wild.pick(p))) { Combat.swing(); return; }
  const e = (p.selected() && (p.itemInfo(p.selected()) || {}).bow) ? null : Wild.pick(p);
  const hit = p.raycast(5.5);
  if (e && e.rogue) { const c = Campaign.C(); if (c.ranch !== 2) { UI.toast('Thunderhoof flattens his ears at you. Talk to Dusty Hale first.'); return; } const k = KIN.create(e.kin.sp, e.kin.level); Taming.start(k, { hard: true, onDone: (kk) => { kk.tamed = true; this.addKin(kk); Campaign.onRogueTamed(kk); UI.toast('Thunderhoof is yours, and you can ride now. Every Kin still has to be broken in once: press Ride and hold on.', 'good'); } }); return; }
  if (e && (!hit || Math.hypot(e.x - p.x, e.z - p.z, e.y - p.y) < hit.dist + 0.5)) {
    if (e.cool > 0) e.cool = 0;
    Battle.start(e, e.alert < 0.6); return;
  }
  const selInfo = p.selected() ? p.itemInfo(p.selected()) : null;
  if (selInfo && selInfo.bow) { this.shoot(); return; }
  if (hit && (hit.id === B.THORN || hit.id === B.DEADGATE || hit.id === B.RUBBLE) && Campaign.tryGate(hit)) return;
  const interactable = hit && (hit.id === B.CAMPFIRE || hit.id === B.FUSION || hit.id === B.DARKTABLE || hit.id === B.STARMETAL || hit.id === B.PORTAL || hit.id === B.DOOR || hit.id === B.DOOR_OPEN || hit.id === B.CHEST || hit.id === B.INCUBATOR);
  if (!interactable && selInfo && selInfo.rod) { Fishing.cast(); return; }
  if (!interactable && selInfo && selInfo.use) { this.useItem(p.selected()); return; }
  if (!interactable && selInfo && selInfo.snare) { if (this.stealthTarget()) { this.stealthSnare(); } else UI.toast('Snares work in a fight, or sneak up close behind an unaware Kin and press Set snare.'); return; }
  const ev = p.place();
  if (!ev) return;
  if (ev.interact === 'fusion') { if (ev.dark && !Keeps.tableOpen(ev.x, ev.z)) { UI.toast('The warlord\'s table. It will not answer you until this place is yours.', 'bad'); return; } if (!ev.dark && Village.tableChallenge()) return; if (ev.dark && !this.stats.darkTold) { this.stats.darkTold = true; this.explain('The Dark Fusion Table', 'The Kinmaster\'s own table. It is the only one that takes dark materials: Void Crystal, Void Essence and Void Stones. Every fusion that needs a Void Stone, the Void Snare, and anything else made with Void has to be made here.'); } UI.openPanel('fusion', { table: { x: ev.x, y: ev.y, z: ev.z }, dark: !!ev.dark }); return; }
  if (ev.interact === 'portal') { const r = Village.portalHere(ev.x, ev.z); if (r.err) { UI.toast(r.err, 'bad'); return; } UI.openPanel('portal', r.v); return; }
  if (ev.interact === 'chest') { UI.openPanel('chest', { x: ev.x, y: ev.y, z: ev.z }); return; }
  if (ev.interact === 'incubator') { if (!Lab.canUse()) { UI.toast('The incubator is dead until its maker is free.', 'bad'); return; } UI.openPanel('incubator'); return; }
  if (ev.interact === 'door') { UI.sfx(ev.open ? 'place' : 'break'); this.meshPass(99); return; }
  if (ev.kit) { const err = Village.placeKit(ev.kit, ev.item, ev.hit, p); if (err) UI.toast(err, 'bad'); else { p.take(ev.item, 1); UI.sfx('fuse'); UI.renderHotbar(); this.meshPass(99); } return; }
  if (ev.interact === 'camp') {
    const now = performance.now();
    if (this.lastRest && now - this.lastRest < 120000) { UI.toast(`The fire is still warm. Rest again in ${Math.ceil((120000 - (now - this.lastRest)) / 1000)}s.`); return; }
    if (this.kin.every(k => k.hp >= KIN.stats(k).hp)) { UI.toast('Your Kin are already rested.'); return; }
    this.lastRest = now; for (const k of this.kin) k.hp = KIN.stats(k).hp; p.hp = p.maxHp; UI.sfx('caught'); UI.toast('You rest by the fire. Every Kin wakes, whole.', 'good'); return;
  }
  if (ev.interact === 'starmetal') {
    if (this.worldId !== 'earth') { this.fadeTravel('earth'); return; }
    if (p.has('ship')) { UI.toast('The Heart is quiet. Your ship waits on the surface: select it and tap.'); return; }
    if (this.stats.mythicDone) { if (!this.stats.hollowTold) { this.stats.hollowTold = true; this.explain('The hollow Starmetal', 'The pedestal is hollow. Something was torn out of the middle of it: a heart of living metal, the kind that could drive a ship between worlds. Only one person was down here before you. The Kinmaster has it, and he has had someone build something with it.'); } else UI.toast('Hollow. He took its heart for his ship.'); return; }
    UI.toast('Starmetal. Too heavy to lift while the Mythic sleeps on it.'); return;
  }
  if (ev.placed != null) { UI.sfx('place'); UI.renderHotbar(); }
};

// the Starship above the clouds: where to?
G.chooseDestination = function (id) {
  UI.closePanel();
  if (id === 'back') { this.player.flying = true; this.player.y = WH + 10; this.player.vy = -2; return; }
  if (id === this.worldId) { this.player.flying = true; this.player.y = WH + 10; this.player.vy = -2; UI.toast('You are already here. Coming back down.'); return; }
  this.fadeTravel(id);
};
G.fadeTravel = function (target) {
  const f = document.getElementById('fade'); f.style.opacity = 1; this.paused = true; Controls.setEnabled(false);
  setTimeout(() => { this.travel(target); this.paused = false; Controls.setEnabled(true); setTimeout(() => { f.style.opacity = 0; }, 300); }, 900);
};
// ---------- roosts: every village you hold keeps a big carrier Kin; from one, it flies you to any other you have stood in ----------
G.addRoost = function (r) {
  if (!this.stats.roosts) this.stats.roosts = [];
  if (this.stats.roosts.some(x => x.id === r.id)) return;
  this.stats.roosts.push(r);
  if (this.stats.roosts.length === 2 && !this.stats.roostTold) { this.stats.roostTold = true; this.explain('The train', 'Two stations open. The line runs between every town whose station you have fixed: talk to any stationmaster and pick where to go, for a few shards. Every town you free has a station; every station has its own repairs.'); }
};
G.roostHere = function () {
  const v = Village.active, p = this.player; if (!v || v.type === 'deep') return null;
  const st = this.villageState[v.id]; if (!st || !st.freed) return null;
  const r = (this.stats.roosts || []).find(r => r.id === v.id); if (!r) return null;
  return Math.hypot(r.x - p.x, r.z - p.z) < (v.R ? 16 : 30) ? r : null;
};
G.roostCost = function (r) { const p = this.player; const d = Math.hypot(U.mod(r.x - p.x + WORLD_W / 2, WORLD_W) - WORLD_W / 2, U.mod(r.z - p.z + WORLD_W / 2, WORLD_W) - WORLD_W / 2); return 4 + Math.round(d / 150); };
G.flyTo = function (id) {
  const r = (this.stats.roosts || []).find(x => x.id === id); const here = this.roostHere();
  if (!r || !here || r.id === here.id || (r.world || 'earth') !== this.worldId) return;
  const cost = this.roostCost(r); if (this.shards < cost) { UI.toast(`The fare is ${cost} shards.`, 'bad'); return; }
  this.shards -= cost; UI.closePanel();
  const f = document.getElementById('fade'); f.style.opacity = 1; this.paused = true; Controls.setEnabled(false); UI.sfx('quest');
  setTimeout(() => {
    const p = this.player, w = this.world; w.ensureAround(Math.floor(r.x / CH), Math.floor(r.z / CH), 3, 9999);
    p.x = r.x; p.z = r.z; const gy = w.groundY(Math.floor(r.x), Math.floor(r.z)); p.y = Math.max(Number.isFinite(gy) ? gy + 1 : -1, Number.isFinite(r.y) ? r.y : -1, SEA + 1) + 0.05; p.vx = p.vy = p.vz = 0; p.fallStart = null; p.gliding = false;
    this.meshPass(999); this.paused = false; Controls.setEnabled(true);
    setTimeout(() => { f.style.opacity = 0; UI.toast(`The train pulls into ${r.name}.`, 'good'); }, 300);
  }, 1100);
};
// ---------- save / load ----------
G.save = function () {
  if (!this.running || !this.world) return false;
  try {
    const data = {
      v: 2, kinV: 2, seed: this.baseSeed, worldId: this.worldId, worlds: Object.assign({}, this.worlds, { [this.worldId]: this.captureWorldState() }), player: this.player.serialize(), kin: this.kin.map(KIN.serialize), box: this.box, eggs: this.eggs, activeIdx: this.activeIdx, xp: this.xp,
      stats: this.stats, questState: this.questState, edits: this.world.serializeEdits(), mythicCaught: this.mythicCaught, shards: this.shards, village: this.village, secure: this.secure, respawnPoint: this.respawnPoint, weather: Weather.serialize(),
      villageState: this.villageState, lastVillage: this.lastVillage, fisherSpot: this.fisherSpot, fisherTarget: this.fisherTarget, founded: this.founded, dayCount: this.dayCount, poiState: this.poiState || {}, pin: this.pin || null, chests: this.chests || {}, npcState: this.npcState || {}, labState: this.labState || {}, skin: this.skin || 'ranger', thirdPerson: !!this.thirdPerson, regrow: (this.world.regrow || []).map(r => ({ x: r.x, y: r.y, z: r.z, t: 0, leaf: !!r.leaf, id: r.id })),
      statues: [...this.world.statues.values()].map(o => { const c = Object.assign({}, o); delete c.model; delete c.mesh; return c; }),
    };
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
    if (this.gameId) Saves.touch(this.gameId, data);
    this.saveFailed = false;
    return true;
  } catch (e) { if (!this.saveFailed) { this.saveFailed = true; UI.toast('Could not save: the browser storage is full. Delete an old game from the Games list.', 'bad'); } return false; }
};
G.load = function () {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(this.SAVE_KEY)); } catch (e) { return false; }
  if (!data || !data.seed) return false;
  this.stats = Object.assign(freshStats(), data.stats || {}); this.questState = data.questState || null; this.xp = data.xp || 0; this.trainerLevel = this.trainerLevelFor(this.xp); this.mythicCaught = !!data.mythicCaught; this.shards = data.shards || 0; this.secure = data.secure || {};
  this.villageState = data.villageState || {}; this.poiState = data.poiState || {}; this.pin = data.pin || null; this.chests = data.chests || {}; this.npcState = data.npcState || {}; this.labState = data.labState || {}; this.amulet = { cd: 0, kind: null, until: 0, charges: 0 }; this.skin = data.skin || 'ranger'; this.thirdPerson = !!data.thirdPerson; this.lastVillage = data.lastVillage || null; this.fisherSpot = data.fisherSpot || null; this.fisherTarget = data.fisherTarget || null; this.founded = data.founded || []; this.dayCount = data.dayCount || 0; this.wasNight = null; this.fisherTried = false;
  this.player = null;
  if (data.v >= 2) {
    this.worlds = data.worlds || {};
    this.setupWorld(data.seed, data.worldId || 'earth');
    this.restoreWorldState(this.worlds[this.worldId]);
  } else {
    // old save: everything was Earth
    this.worlds = {}; this.setupWorld(data.seed, 'earth');
    this.restoreWorldState({ edits: data.edits || [], statues: data.statues || [], time: data.time, regrow: data.regrow || [], respawnPoint: data.respawnPoint || null, village: data.village || null });
    const sp = this.world.spawn; this.camp = { x: Math.floor(sp.x) + 1, y: Math.floor(sp.y), z: Math.floor(sp.z) + 1 };
    this.world.setBlock(this.camp.x, this.camp.y, this.camp.z, B.CAMPFIRE);
  }
  Weather.load(data.weather);
  if (this.worldId === 'earth' && !(data.stats || {}).ruinPlaced && this.world.spawn) { this.world.placeSpawnRuin(); setTimeout(() => { this.stats.ruinPlaced = true; }, 0); }
  this.kin = (data.kin || []).map(KIN.deserialize); this.activeIdx = data.activeIdx || 0; this.box = data.box || []; this.eggs = data.eggs || [];
  while (this.kin.length > this.MAX_KIN) this.box.push(KIN.serialize(this.kin.pop())); // the party is eight now
  this.player.load(data.player);
  { const P = this.player, st = data.stats || {}; if (st.villageFreed && !P.has('shovel')) { P.add('shovel', 1); P.add('hatchet', 1); } if (((st.camp || {}).pick || 0) >= 2 && !P.has('axe_iron')) P.add('axe_iron', 1); } // tools arrived after this save was made
  if (data.kinV !== 2) { // the Kindex arrived: the old one-of-a-kind Kin are let go, everywhere; a fresh starter takes their place
    this.kin = []; this.activeIdx = 0; this.box = []; this.eggs = [];
    for (const id in (this.villageState || {})) if (this.villageState[id].guards) this.villageState[id].guards = [];
    for (const id in (this.labState || {})) { this.labState[id].kin = []; this.labState[id].days = []; }
    const st = KIN.create(KIN.starters(this.baseSeed)[0], 5); this.kin.push(st); this.stats.recipes = { earth: [0, 1], moon: [0], halo: [0] }; this.stats.dex = {};
    setTimeout(() => UI.toast(`The Kin have changed. Every Kin now belongs to a species you can find again, and your old ones have gone back to the wild. ${KIN.name(st)} is with you.`, 'good'), 1500);
  }
  Quests.init(this);
  return true;
};

// ---------- music: one mood per situation ----------
G.updateMusic = function (inBattle) {
  if (!UI.soundOn || !Music.enabled) return;
  const p = this.player, w = this.world;
  let mood;
  const layer = w.layerAt(Math.floor(p.y), Math.floor(p.x), Math.floor(p.z));
  const bx = Math.floor(p.x), bz = Math.floor(p.z); const biome = w.biomeAt(bx, bz);
  const night = Math.cos(w.time * Math.PI * 2) > 0.17 && !w.preset.flatDay;
  const wet = Weather.state.intensity > 0.4 && (Weather.state.kind === 'rain' || Weather.state.kind === 'storm');
  const va = Village.active; const inVillage = va && Math.hypot(va.x - p.x, va.z - p.z) < 22 && this.villageState[va.id] && this.villageState[va.id].freed;
  const volcanic = biome === BIOME.MOUNTAIN && p.y >= 64 && U.vnoise2(bx, bz, 256, WORLD_W, w.seed + 611) > 0.6;
  const chased = (Camps.active && Camps.active.alarm > 0) || (Wild.chaser && Wild.chaser.chase);
  if (inBattle) mood = 'battle';
  else if (chased) mood = 'danger';
  else if (inVillage && this.worldId === 'moon') mood = 'alien';
  else if (this.worldId === 'halo') mood = inVillage ? 'village' : 'halo';
  else if (this.worldId !== 'earth') mood = 'moon';
  else if (biome === BIOME.LOSTWORLD) mood = 'jungle';
  else if (p.mount && p.mountMode === 'air' && !p.onGround && !p.inWater) mood = 'fly';
  else if (p.mount && p.mountMode === 'water' && p.inWater) mood = 'swim';
  else if (p.mount && p.mountMode === 'land' && !p.inWater) mood = 'ride';
  else if (p.underwater) mood = 'deep';
  else if (p.inWater || layer === 'Water') mood = 'water';
  else if (layer === 'Core' || p.inLava || volcanic) mood = p.inLava || layer === 'Core' ? 'fire' : 'volcano';
  else if (layer === 'Mines') mood = 'mines';
  else if (biome === BIOME.SNOW || (biome === BIOME.MOUNTAIN && p.y >= 66)) mood = 'cold';
  else if (layer === 'Sky' || p.y >= SKY_BASE) mood = 'sky';
  else if (inVillage) mood = 'village';
  else if (wet) mood = 'rain';
  else if (night) mood = 'night';
  else mood = 'land';
  Music.update(mood);
  Music.duck(!!UI.panelOpen || this.paused);
};

// ---------- portals ----------
G.portalTo = function (dest) {
  const p = this.player, w = this.world;
  if (dest.world && dest.world !== this.worldId) { UI.closePanel(); UI.toast(`The arch takes you to ${PRESETS[dest.world].name}.`, 'good'); this.fadeTravel(dest.world); return; }
  const wd = (d) => U.mod(d + WORLD_W / 2, WORLD_W) - WORLD_W / 2;
  const x = p.x + wd(dest.spot.x - p.x), z = p.z + wd(dest.spot.z - p.z);
  UI.closePanel();
  const f = document.getElementById('fade'); f.style.opacity = 1; this.paused = true; Controls.setEnabled(false);
  setTimeout(() => {
    w.ensureAround(Math.floor(x / CH), Math.floor(z / CH), 3, 999);
    p.x = x; p.z = z; p.vx = p.vy = p.vz = 0; p.mount = null; p.flying = false;
    Wild.clear(); Wild.chaser = null;
    for (let i = 0; i < 3; i++) Village.update(0.05, p, false); // stamps the village if this is the first visit, so the deck is there to land on
    const gy = dest.spot.y != null && isSolid(w.getBlock(Math.floor(x), dest.spot.y - 1, Math.floor(z))) && w.getBlock(Math.floor(x), dest.spot.y, Math.floor(z)) === B.AIR ? dest.spot.y : w.groundY(Math.floor(x), Math.floor(z)) + 1;
    p.y = gy + 0.2;
    this.meshPass(99); this.paused = false; Controls.setEnabled(true);
    UI.sfx('fuse'); UI.toast(`${dest.name}.`, 'good');
    setTimeout(() => { f.style.opacity = 0; }, 300);
    this.save();
  }, 700);
};

// ---------- chests: storage that survives anything ----------
// the old map: the Lost World is on nobody's chart until somebody gives you theirs
G.giveLostMap = function (from) {
  if (this.stats.lostMap) return false;
  this.stats.lostMap = true; UI.sfx('quest');
  Dialogue.show(from, ['Here. An old map, older than me. There is a ring of cliffs on the far side of the world with a jungle inside, and things in it that walked here before anything else did.', 'There is one way in, a tunnel through the rock. I have marked it. It is a long road; take a mount and plenty of tonics.'], () => UI.toast('The Lost World is on your map and your compass now: 🦖.', 'good'));
  return true;
};
// towns and farms are not yours to dig up: the first knock on a wall brings someone running
G.protectedAt = function (hit) {
  if (this.worldId !== 'earth') return null; const p = this.player;
  const kind = p.toolKind(hit.id);
  for (const k of Keeps.sites()) if (Math.abs(hit.x - k.x) <= 12 && Math.abs(hit.z - k.z) <= 12 && Math.abs(hit.y - k.y) <= 16) { if ((this.stats.holdDeeds || {})[k.id] && Math.abs(hit.x - k.x) <= 7 && Math.abs(hit.z - k.z) <= 7 && hit.id !== B.DARKTABLE) return null; return { kind: 'dark' }; }
  { const cs = Citadel.open() ? Citadel.site() : null; if (cs && hit.x >= cs.x - 8 && hit.x <= cs.x + 94 && Math.abs(hit.z - cs.z) <= 19) return { kind: 'dark' }; }
  { const fo = (Campaign.sites() || {}).fort; if (fo && (this.stats.camp || {}).st_fort && hit.x >= fo.x - 18 && hit.x <= fo.x + 78 && Math.abs(hit.z - fo.z) <= 14) return { kind: 'dark' }; }
  for (const f of Farms.sites()) if (Math.abs(hit.x - f.x) <= 13 && Math.abs(hit.z - f.z) <= 13) { if (hit.id === B.CHEST) return null; return { kind: 'farm', f }; }
  const v = Village.active; if (v && !v.founded) { const R = v.type === 'land' ? (v.R || ((this.villageState[v.id] || {}).expanded ? 18 : 12)) + 3 : v.type === 'sea' ? 28 : v.style === 'atlantis' ? 22 : 16;
    if (Math.abs(hit.x - v.x) <= R && Math.abs(hit.z - v.z) <= R) { if (Village.ownsPlotAt(v, hit.x, hit.z)) return null; if (kind === 'hand') return null; return { kind: 'town', v }; } }
  return null;
};
G.onProtectedMine = function (pr, hit) {
  const now = performance.now(); if (this.protT && now - this.protT < 5000) return; this.protT = now;
  const p = this.player; const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
  const bring = (n) => { if (!n) return; n.x = p.x - fx * 1.8; n.z = p.z - fz * 1.8; const gy = this.world.groundY(Math.floor(n.x), Math.floor(n.z), Math.floor(p.y) + 2); if (gy != null) n.y = gy + 1; n.yaw = Math.atan2(p.x - n.x, p.z - n.z); if (n.home) n.home = { x: n.x, z: n.z }; this.talkNpc = n; };
  let who = null, lines;
  if (pr.kind === 'dark') { UI.sfx('miss'); UI.toast('The stone does not even scratch. Whatever the Kinmaster built here, he built it to keep out exactly you. Find the way in.', 'bad'); return; }
  if (pr.kind === 'farm') {
    who = Campaign.getPerson('farmer_' + pr.f.id); bring(who);
    lines = ['Oi! Not my fences, not my field, not my house. Put that down.', 'You want something from this farm, you ask me.'];
  } else {
    const v = pr.v; const st = this.villageState[v.id] || {}; const big = v.size === 'town' || v.size === 'city';
    const npcs = (v.npcs || []).filter(n => !n.hidden && n.role !== 'keeper'); let best = null, bd = 1e9; for (const n of npcs) { if (!big && n !== v.elder) continue; const d = Math.hypot(n.x - p.x, n.z - p.z); if (d < bd) { bd = d; best = n; } }
    who = best || v.elder || npcs[0]; bring(who);
    lines = big ? [st.freed ? 'Hey! HEY. Hands off the walls. This is a town, not a quarry.' : 'Halt! What do you think you are doing to our walls?', 'Try that again and you will spend the night in the cells. If you want to build here, buy a plot: the governor sells deeds.'] : ['Whoa, whoa! What are you doing? Those are people\'s homes.', 'You want stone, there is a whole hillside out past the gate.'];
  }
  UI.sfx('miss'); Dialogue.show(who ? who.name : 'A voice behind you', lines);
};
// meals and the like: a buff runs on play time, not the clock on the wall
G.addBuff = function (k, amt, mins) { if (!this.stats.buffs) this.stats.buffs = {}; this.stats.buffs[k] = { amt, until: (this.stats.playT || 0) + mins * 60 }; };
G.buffOn = function (k) { const b = (this.stats.buffs || {})[k]; return b && b.until > (this.stats.playT || 0) ? b : null; };
G.buffMul = function (k) { const b = this.buffOn(k); return b ? b.amt : 1; };
G.buffText = function () { const B0 = this.stats.buffs || {}; const now = this.stats.playT || 0; const ic = { hearts: '❤', mine: '⛏', speed: '»', breath: '◌', ward: '⛨', blade: '⚔', luck: '✣', train: '★' }; return Object.keys(B0).filter(k => B0[k].until > now).map(k => `${ic[k] || k} ${Math.ceil((B0[k].until - now) / 60)}m`).join(' '); };
G.damageMul = function () { return (typeof Npcs !== 'undefined' && this.amulet && Npcs.active('skin')) ? 0.5 : 1; };
G.chestKey = function (x, y, z) { return `${this.worldId}:${U.mod(x, WORLD_W)},${y},${U.mod(z, WORLD_W)}`; };
G.chestAt = function (x, y, z, create) { if (!this.chests) this.chests = {}; const k = this.chestKey(x, y, z); if (!this.chests[k] && create) this.chests[k] = { items: {} }; return this.chests[k] || null; };
G.chestStore = function (chest, item, n) { const p = this.player; const info = p.itemInfo(item); if (!info || info.gear || info.obj || item.startsWith('obj:')) return 0; const take = Math.min(p.count(item), n); if (take <= 0) return 0; p.take(item, take); chest.items[item] = (chest.items[item] || 0) + take; return take; };
G.chestTake = function (chest, item, n) { const have = chest.items[item] || 0; const take = Math.min(have, n); if (take <= 0) return 0; if (Camps.active) Camps.onTake(chest, item); if (have - take <= 0) delete chest.items[item]; else chest.items[item] = have - take; this.player.add(item, take); return take; };
G.onChestBroken = function (x, y, z) {
  const k = this.chestKey(x, y, z); const c = this.chests && this.chests[k]; if (!c) return;
  let n = 0; for (const it in c.items) { this.player.add(it, c.items[it]); n += c.items[it]; }
  delete this.chests[k];
  if (n) UI.toast(`The chest comes apart; ${n} things go back in your bag.`);
};

// ---------- the talk camera ----------
G.talkCamera = function (cam, npc, k) {
  const p = this.player;
  const fx = npc.x, fy = npc.y + 1.5 * (npc.model.scale || 1), fz = npc.z; // eye level of a villager, hats and feathers ignored
  let dx = p.x - npc.x, dz = p.z - npc.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
  const sx = -dz, sz = dx; // to the side
  const w = this.world; const free = (x, y, z) => { const b = w.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)); return !isSolid(b) || BLOCKS[b].partial; };
  let cx = fx, cy = fy + 0.15, cz = fz;
  const clear = (x, y, z) => { for (let u = 0.15; u <= 1; u += 0.17) if (!free(fx + (x - fx) * u, fy + (y - fy) * u, fz + (z - fz) * u)) return false; return true; };
  for (let t = 1; t >= 0.25; t -= 0.1) { const x = fx + (dx * 2.6 + sx * 1.0) * t, z = fz + (dz * 2.6 + sz * 1.0) * t; if (free(x, cy, z) && free(x, cy - 0.5, z) && clear(x, cy, z)) { cx = x; cz = z; break; } } // back off until nothing stands between the camera and the face
  if (cx === fx && cz === fz) { for (let t = 1; t >= 0.25; t -= 0.1) { const x = fx + dx * 2.2 * t, z = fz + dz * 2.2 * t; if (free(x, cy, z) && clear(x, cy, z)) { cx = x; cz = z; break; } } } // straight on, if the side is blocked
  const lx = fx - cx, ly = fy - cy, lz = fz - cz; const hd = Math.hypot(lx, lz) || 1;
  const yaw = Math.atan2(-lx, -lz), pitch = Math.atan2(ly, hd);
  let dy = yaw - cam.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
  return { x: U.lerp(cam.x, cx, k), y: U.lerp(cam.y, cy, k), z: U.lerp(cam.z, cz, k), yaw: cam.yaw + dy * k, pitch: U.lerp(cam.pitch, pitch, k), fov: U.lerp(cam.fov, 55 * Math.PI / 180, k) };
};

// ---------- villages: dawn, guards, founding ----------
G.onDawn = function () {
  const r = Village.dawn();
  for (const line of Lab.dawn()) UI.toast(line, 'good');
  if (r.paid) UI.toast(`Dawn. ${r.paid} village${r.paid > 1 ? 's' : ''} set aside ◆ ${r.sum} for you.`, 'good');
  for (const line of r.lines.slice(0, 3)) UI.toast(line, 'bad');
  if (this.lastVillage && !(this.villageState[this.lastVillage.id] || {}).freed) this.respawnPoint = null;
};
G.stationGuard = function (k) { const err = Village.station(k); if (err) { UI.toast(err, 'bad'); return false; } UI.sfx('place'); UI.toast(`${KIN.name(k)} stands guard at ${Village.active.name}.`, 'good'); return true; };
G.recallGuard = function (i) { const err = Village.recall(i); if (err) { UI.toast(err, 'bad'); return false; } UI.sfx('caught'); return true; };
G.foundVillage = function (table, name) {
  const v = Village.foundVillage(table, name);
  if (!v) { UI.toast('The site is not ready yet.', 'bad'); return null; }
  UI.sfx('quest'); UI.toast(`${v.name} is founded. People are already arriving.`, 'good');
  this.save();
  return v;
};
G.villageAction = function (v, action, arg) {
  const err = action === 'wall' ? Village.upgradeWall(v) : action === 'repair' ? Village.repairWall(v) : action === 'expand' ? Village.expand(v) : action === 'build' ? Village.build(v, arg) : action === 'dome' ? Village.raiseDome(v) : 'Unknown action.';
  if (err) { UI.toast(err, 'bad'); return false; }
  UI.sfx('fuse'); UI.renderHotbar(); this.meshPass(99); this.save(); return true;
};

window.addEventListener('DOMContentLoaded', () => {
  try { G.init(); } catch (e) { document.body.innerHTML = `<div style="color:#fff;padding:20px;font-family:sans-serif"><h2>Stratakin could not start</h2><p>${e.message}</p><p>This game needs WebGL. Try another browser or device.</p></div>`; console.error(e); }
});
