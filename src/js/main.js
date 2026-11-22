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
  this.viewR = this.mobile ? 3 : 5; R.state.landReach = this.viewR * CH; // land is built this far in every direction at the least (more when you stand near the far side of your chunk)
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
  if (code === 'KeyF') { if (Wild.engagedNear(this.player)) this.deployKin(); else this.stealthSnare(); }
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
  Village.init(this); Hazards.init(this); Campaign.init(this); Npcs.init(this); Camps.init(this); Mer.init(this); Lab.init(this); Avatar.init(this); Combat.init(this); Buddy.init(this); Cine.init(this); Wood.init(this); Roads.init(this); Arena.init(this); Garrison.init(this); First.init(this); Breath.init(this); Ruins.init(this); Harvest.init(this); Cast.init(this); Hub.init(this); Side.init(this); Fields.init(this); Felling.init(this); Relics.init(this); Gems.init(this); Keeps.init(this); Citadel.init(this); Farms.init(this); Sky.init(this);
  Quests.init(this);
};
G.newWorld = function (seed, starterIdx, name) {
  UI.loading(true);
  const slot = Saves.create(name); this.SAVE_KEY = slot.key; this.gameId = slot.id; this.gameName = slot.name;
  setTimeout(() => {
    this.stats = freshStats(); this.questState = null; this.xp = 0; this.trainerLevel = 1; this.mythicCaught = false; this.kin = []; this.box = []; this.eggs = []; this.activeIdx = 0; this.shards = 0; this.village = null; this.secure = {}; this.respawnPoint = null; this.worlds = {}; this.worldId = 'earth';
    this.villageState = {}; this.poiState = {}; this.chests = {}; this.npcState = {}; this.labState = {}; this.amulet = { cd: 0, kind: null, until: 0, charges: 0 }; this.skin = 'ranger'; this.thirdPerson = true; this.lastVillage = null; this.fisherSpot = null; this.fisherTarget = null; this.founded = []; this.dayCount = 0; this.wasNight = null; this.fisherTried = false;
    this.player = null; this.setupWorld(seed, 'earth');
    const w = this.world, s = w.spawn;
    w.ensureAround(Math.floor(s.x / CH), Math.floor(s.z / CH), 4, 999);
    this.village = Village.stamp(s);
    Wild.noSpawn = { x: this.village.x, z: this.village.z, r: 15 };
    { /* the camp sits well out from the village, so its smoke is something you see over there and walk towards. Of the spots tried on the far side, the first on plain dry ground wins */
      const v = this.village, a0 = Math.atan2(s.x - v.x, s.z - v.z); let done = false;
      for (const r of [78, 70, 86, 62]) { if (done) break; for (const da of [0, 0.35, -0.35, 0.7, -0.7, 1.1, -1.1]) { const x = Math.floor(v.x + Math.sin(a0 + da) * r), z = Math.floor(v.z + Math.cos(a0 + da) * r); w.ensureAround(Math.floor(x / CH), Math.floor(z / CH), 2, 999);
          let g = w.groundY(x, z, 120); while (g > 2 && (isLeaf(w.getBlock(x, g, z)) || w.getBlock(x, g, z) === B.LOG)) g--; const top = w.getBlock(x, g, z); if ((top !== B.GRASS && top !== B.DIRT && top !== B.SAND) || w.getBlock(x, g + 1, z) === B.WATER) continue;
          let flat = true; for (const [ox, oz] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) { let h = w.groundY(x + ox, z + oz, g + 6); while (h > 2 && (isLeaf(w.getBlock(x + ox, h, z + oz)) || w.getBlock(x + ox, h, z + oz) === B.LOG)) h--; if (Math.abs(h - g) > 2 || w.getBlock(x + ox, h + 1, z + oz) === B.WATER) flat = false; }
          if (!flat) continue; s.x = x + 0.5; s.z = z + 0.5; s.y = g + 1; done = true; break; } }
      w.ensureAround(Math.floor(s.x / CH), Math.floor(s.z / CH), 4, 999); }
    const p = this.player; p.x = s.x; p.y = s.y + 0.2; p.z = s.z;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = Math.floor(s.y); y < s.y + 3; y++) { const b = w.getBlock(Math.floor(s.x) + dx, y, Math.floor(s.z) + dz); if (isLeaf(b) || (b === B.LOG && !dx && !dz)) w.setBlock(Math.floor(s.x) + dx, y, Math.floor(s.z) + dz, B.AIR); }
    for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) for (let y = Math.floor(s.y); y < s.y + 16; y++) { const bb = w.getBlock(Math.floor(s.x) + dx, y, Math.floor(s.z) + dz); if (isLeaf(bb) || bb === B.LOG) w.setBlock(Math.floor(s.x) + dx, y, Math.floor(s.z) + dz, B.AIR); } /* a clearing: no tree within five steps, open sky over the camp: the view from behind your shoulder must not start inside a tree */
    w.setBlock(Math.floor(s.x) + 1, Math.floor(s.y), Math.floor(s.z) + 1, B.CAMPFIRE); // the magic camp fire: light and resting spot
    this.camp = { x: Math.floor(s.x) + 1, y: Math.floor(s.y), z: Math.floor(s.z) + 1 };
    w.placeSpawnRuin(); this.stats.ruinPlaced = true;
    p.yaw = Math.atan2(-(this.village.x - s.x), -(this.village.z - s.z));
    if (this.orbit) { this.orbit.yaw = p.yaw; this.orbit.pitch = p.pitch; }
    this.stats.recipes = { earth: [0, 1], moon: [0], halo: [0] };
    const story = !(starterIdx >= 0); /* the opening: no Kin yet, you choose one by the brook. A card picked on the menu skips it */
    const starter = story ? null : KIN.create(KIN.starters(seed)[starterIdx], 5);
    if (starter) this.kin.push(starter); else { First.begin(); this.stats.first.brook = First.brook(); }
    if (typeof window !== 'undefined' && window.__pickBuild && window.__pickBuild !== 'man') { this.stats.look = Object.assign(this.stats.look || {}, { build: window.__pickBuild }); } /* the body you chose on the way in */
    p.add('torch', 2); if (!story) { p.add('snare', 1); p.add('bread', 1); }
    this.start();
    if (starter) UI.toast(`Welcome to Stratakin. ${KIN.name(starter)} is with you.`, 'good');
    const jump = typeof window !== 'undefined' && window.__jump; if (jump) { window.__jump = null; const f0 = this.frame || 0; const go = () => { if ((this.frame || 0) < f0 + 3) { setTimeout(go, 200); return; } /* wait until the world is actually running */ try { const t = document.getElementById('tutorial'); if (t) t.classList.add('hidden'); if (jump === 'moon') this.designerMoon(); else if (jump === 'lost') this.designerLost(); else this.designerHalo(); } catch (e) { UI.toast('The jump failed: ' + e.message, 'bad'); } }; setTimeout(go, 400); } /* a test start chosen on the way in */
    else UI.showTutorial();
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
// ---------- stealth net ----------
G.stealthTarget = function () {
  const p = this.player; let best = null, bd = Infinity;
  for (const e of Wild.list) {
    if (e.dazed > 0) { const d0 = Math.hypot(e.x - p.x, e.z - p.z, (e.y - p.y) * 0.7); if (d0 < 9 + Math.min(4, (e.model.radius || 0.6)) && d0 - 8 < bd) { bd = d0 - 8; best = e; } continue; }
    if (e.chase || e.cool > 0 || e.alert >= 0.98 || e.isBoss || e.lieutenant) continue;
    const reach = 3.2 + Math.min(4, (e.model.radius || 0.6)); // close to its body, not its middle: big Kin can be snared from their side
    const d = Math.hypot(e.x - p.x, e.z - p.z, (e.y - p.y) * 0.7);
    if (d < reach && d - reach < bd) { bd = d - reach; best = e; }
  }
  return best;
};
G.stealthSnare = function () {
  const e = this.stealthTarget(); if (!e || Battle.active) return;
  if (!this.player.has('snare') && !this.player.has('snare2')) { UI.toast('No nets. Craft one: 2 wood, 2 stone.'); return; }
  if (!this.healthyKin().length) { UI.toast('You need an awake Kin with you to set a snare.'); return; }
  Battle.start(e, true, { stealth: true });
};
// ---------- deploy: send your Kin in against the one that is on you ----------
// Your lead Kin already scraps beside you in the open; Deploy starts the real thing: a battle, Kin against Kin, with the Kin you pick
G.deployKin = function () {
  if (this.kin.length && !this.kin.some(k => k.hp > 0)) { UI.toast('Every Kin you carry has fainted. Rest at a camp fire or give one a tonic, then come back.', 'bad'); return; }
  const p = this.player; if (Battle.active) return;
  const e = Wild.engagedNear(p) || Wild.pick(p); if (!e) { UI.toast('Nothing is on you.'); return; }
  const healthy = this.healthyKin(); if (!healthy.length) { UI.toast('All your Kin are down. Revive them at the Voodoo Hut or with a tonic.', 'bad'); return; }
  if (healthy.length === 1) { this.sendIn(healthy[0], e); return; }
  UI.openPanel('deploy', e);
};
// the knockout beat: a short slow-down and a white flash when something goes down
G.knockout = function (x, y, z) { this.slowT = 0.45; const f = document.getElementById('koflash'); if (f) { f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); } this.shake = Math.max(this.shake || 0, 0.3); };
G.sendIn = function (k, e) {
  if (!k || k.hp <= 0 || !this.kin.includes(k)) return;
  this.stats.buddyOff = false;
  this.activeIdx = this.kin.indexOf(k);
  if (e && e.kin && !e.isFoe && !Battle.active) { UI.closePanel && UI.closePanel(); Battle.start(e, false); if (Battle.active) return; } /* Deploy is the battle: Kin against Kin, on the battle card */
  UI.toast(`${KIN.name(k)} goes in.`); Buddy.rally(e);
};
// ---------- riding ----------
// what a Kin's body lets it carry you through: legs on land, fins in water, wings or hovering in the air
G.rideMode = function (k) {
  const sp = k.sp;
  if (sp.shape === 'fish' || sp.shape === 'serpent') return 'water';
  if (sp.shape === 'bird' || sp.shape === 'floater' || (sp.feat.wings && !KIN.nativeId(sp))) return 'air'; /* the new bodies carry you the way they are built: a wingless one does not fly */
  if (sp.shape === 'quadruped' || sp.shape === 'raptor' || sp.shape === 'horned' || sp.shape === 'longneck') return 'land';
  return null;
};
G.rideRequirement = function (k) {
  const r = k.sp.rarity || 0;
  if (k.sp.tame || k.sp.fast || k.sp.tidal) return 1; // Thunderhoof, the camp horses and the seahorse from the ring in Atlantis: broken in already, anyone they trust can ride them
  const base = { land: 6, water: 10, air: 18 }[this.rideMode(k)];
  if (base == null) return null;
  return base + r * 5 + (k.sp.mythic ? 20 : 0);
};
G.toggleRide = function () {
  const p = this.player;
  if (Battle.active || Dialogue.active() || Taming.active) return;
  if (p.mount) { const was = p.mount; p.mount = null; if (was.borrowed) Camps.horseHome(); else UI.toast('You climb off.'); return; }
  const k = this.activeKin(); if (!k) return;
  if (!(this.stats.camp || {}).rogueTamed && !k.sp.tame && !k.sp.fast && !k.sp.tidal) { UI.toast('You do not know how to ride yet. Dusty Hale teaches it, out at his ranch (♞ on the map).'); return; }
  if (this.rideMode(k) === 'land' && !(k.sp.steed || k.sp.fast || k.sp.tame || k.sp.legend || k.sp.apex)) { UI.toast(`${KIN.name(k)} will not carry a rider. Only a few kinds of land Kin ever do: steeds (marked in your Kindex), the dinosaurs, and the legendaries.`); return; }
  const req = this.rideRequirement(k);
  if (req == null) { UI.toast(`${KIN.name(k)} cannot carry you. Legs carry you on land, fins in the water, wings in the air.`); return; }
  if (this.trainerLevel < req) { UI.toast(`${KIN.name(k)} will carry you at trainer level ${req}. You are ${this.trainerLevel}.`); return; }
  if (k.level < 8 && !k.sp.tame && !k.sp.tidal) { UI.toast(`${KIN.name(k)} is too young to carry you (Lv 8).`); return; }
  const mode = this.rideMode(k);
  if (!k.tamed && !k.sp.tame) { if (mode === 'water' && !p.inWater) { UI.toast(`Break ${KIN.name(k)} in where it lives: get in the water first.`); return; } Taming.start(k, { mode }); return; }
  if (mode === 'water' && !p.inWater) { UI.toast(`${KIN.name(k)} carries you in the water. Get in first.`); return; }
  if (mode === 'air' && this.noKinFlight()) { UI.toast(this.world.preset.airless ? `There is no air here for ${KIN.name(k)} to fly in.` : `No room down here for ${KIN.name(k)} to spread its wings.`); return; }
  p.mount = k; p.mountMode = mode; UI.sfx('util');
  UI.toast(mode === 'air' ? (k.level >= 20 ? `You climb onto ${KIN.name(k)}. Jump, then hold ▲ to climb, hold ▼ to come down, let go to hover. It lands you softly.` : `You climb onto ${KIN.name(k)}. It glides; at Lv 20 it will fly.`) : mode === 'water' ? `You climb onto ${KIN.name(k)}. It floats you; hold ▼ to dive.` : `You climb onto ${KIN.name(k)}.`, 'good');
};
// can your buddy carry you right now? The button only shows when the answer is yes (or when breaking it in is the next step), and says how: Ride, Fly or Swim
G.rideable = function () {
  const p = this.player; const k = this.activeKin(); if (!k || k.hp <= 0 || p.flying) return null;
  if (!(this.stats.camp || {}).rogueTamed && !k.sp.tame && !k.sp.fast && !k.sp.tidal) return null;
  const mode = this.rideMode(k); if (!mode) return null;
  if (mode === 'land' && !(k.sp.steed || k.sp.fast || k.sp.tame || k.sp.legend || k.sp.apex)) return null;
  const req = this.rideRequirement(k); if (req == null || this.trainerLevel < req) return null;
  if (k.level < 8 && !k.sp.tame && !k.sp.tidal) return null;
  if (mode === 'water' && !p.inWater) return null;
  if (mode === 'air' && this.noKinFlight()) return null;
  return { k, mode, label: mode === 'air' ? 'Fly' : mode === 'water' ? 'Swim' : 'Ride' };
};
// flying Kin need open sky and air: not in the Mines, not in the Core, not on the airless worlds
G.noKinFlight = function () { const p = this.player, w = this.world; if (w.preset.airless) return true; const L = w.layerAt(Math.floor(p.y), Math.floor(p.x), Math.floor(p.z)); return L === 'Mines' || L === 'Core'; };
// the saddle: the top of the body's main mass (ears, horns and spines do not count), and the rider's hips, so one sits on the other
function backTop(m) { return seatOf(m).top; }
// the saddle: the top of the mount's torso (its biggest body piece, so a raised neck or a hump does not count) and where along it the middle is
function seatOf(m) { if (m._seat) return m._seat; const bp = m.boxes.filter(b => (b.bone || 0) === 0 && b.k === 'blob' && b.w && b.h && b.d); /* body pieces only: a neck or a mane is a tube or a plate, never the saddle */ if (!bp.length) return (m._seat = { top: m.height * 0.62, zc: 0 }); let big = bp[0]; for (const b of bp) if (b.w * b.h * b.d > big.w * big.h * big.d) big = b; return (m._seat = { top: big.y + big.h, zc: big.z + big.d / 2, w: big.w }); }
function hipOf(m) { if (m._hip != null) return m._hip; const leg = (m.bones || []).find(b => b && b.kind === 'leg'); return (m._hip = leg ? leg.piv[1] : 0.7); }
// where the mount's feet are drawn: on the ground it stands on the visible surface, in the water it sits low like a swimmer
G.mountBase = function (p) { return p.inWater ? p.y - 0.95 : p.y + p.drawLift(); };
// designer shortcuts (in the menu): stand somewhere without making the journey, to look at new work. They only move you
G.designerJump = function (where) {
  const p = this.player, w = this.world; if (Battle.active || Taming.active) return; let x, y = null, z, say;
  if (where === 'atlantis') { if (this.worldId !== 'earth') { UI.toast('Atlantis is on Earth.'); return; } const a = Village.atlantis(); if (!a) { UI.toast('This world has no water deep and wide enough for Atlantis.', 'bad'); return; } x = a.x + 0.5; z = a.z + 15.5; y = a.y + 0.1; say = 'Atlantis. The ring is in front of you, the gates are at the foot of the dome, and the way out is up the falls.'; }
  else if (where === 'lost') { if (this.worldId !== 'earth' || !w.lost) { UI.toast('The Lost World is on Earth.'); return; } x = w.lost.x + 62.5; z = w.lost.z + 0.5; say = 'The Lost World. The tyrant\'s clearing is in the middle: keep out of it unless you mean it.'; }
  else { const s = (this.worldId === 'earth' && this.village) ? { x: this.village.x + 0.5, z: this.village.z + 4.5 } : w.spawn; x = s.x; z = s.z; say = 'Back at the first village.'; }
  p.mount = null; p.flying = false; p.gliding = false; p.vx = p.vy = p.vz = 0; p.fallStart = null; p.frozen = false;
  w.ensureAround(Math.floor(x / CH), Math.floor(z / CH), 2, 9999); if (y == null) y = w.groundY(Math.floor(x), Math.floor(z)) + 1.2;
  p.x = x; p.y = y; p.z = z; p.breath = 1; UI.closePanel(); if (this.meshPass) this.meshPass(80); UI.toast(say, 'good');
};
/* a designer's way to the Moon without playing Earth through. Unlike the other shortcuts this one has to give things, because nobody lasts a minute up there without them:
   the suit, the Starlark, a party of six at level 95, nets and tonics. It also puts the professor's greeting back, so the landing can be watched as often as wanted */
G.designerMoon = function () {
  if (Battle.active || Taming.active) return; const p = this.player, LV = 95; UI.closePanel(); if (typeof Cine !== 'undefined' && Cine.active()) Cine.stop(true);
  for (const k of this.kin) { const lv = Math.max(LV, k.level || 1), t = KIN.create(k.sp, lv); k.level = lv; k.stage = t.stage; k.xp = 0; k.status = null; k.hp = KIN.stats(k).hp; }
  const pool = KIN.dex('earth').filter(sp => !sp.mythic && !sp.legend && !sp.noFuse && !sp.fusion && !this.kin.some(k => k.sp === sp)); /* the rest are taken evenly from across this Earth's own animals, so the six are not all of a kind */
  for (let i = 0; this.kin.length < 6 && i < 12 && pool.length; i++) { const sp = pool[Math.floor((i + 0.5) / 6 * pool.length) % pool.length]; if (this.kin.some(k => k.sp === sp)) continue; const k = KIN.create(sp, LV); this.kin.push(k); if (sp.dex) { if (!this.stats.dex) this.stats.dex = {}; this.stats.dex[sp.seed] = 'caught'; } }
  for (const it of ['pick_stone', 'pick_iron', 'axe_iron', 'hatchet', 'shovel']) if (ITEMS[it] && !p.has(it)) p.add(it, 1); const cp = (this.stats.camp = this.stats.camp || {}); cp.pick = Math.max(cp.pick || 0, 2); cp.got_axe_iron = true; /* the tools Garrick and the first village give on Earth: anyone this far along has them */
  for (const [it, n] of [['spacesuit', 1], ['ship', 1], ['glider', 1], ['torch', 4], ['snare2', 20], ['tonic_heal', 10], ['tonic_revive', 5], ['bread', 10]]) if (ITEMS[it] && p.count(it) < n) p.add(it, n - p.count(it));
  this.shards = Math.max(this.shards || 0, 1500); if (this.trainerXpFor) { this.xp = Math.max(this.xp || 0, this.trainerXpFor(40)); this.trainerLevel = this.trainerLevelFor(this.xp); }
  this.stats.lightReturned = true; this.stats.citadel = Object.assign(this.stats.citadel || {}, { profFree: true, lark: true }); if (Quests.skipTo) { Quests.skipTo({ main: 'moonjobs', dark: 'garrison' }); this.questState.focus = 'moonarc'; } (this.stats.hub = this.stats.hub || {}).greeted = false;
  p.mount = null; p.flying = false; p.gliding = false; p.vx = p.vy = p.vz = 0; p.fallStart = null; p.frozen = false; p.hp = p.maxHp;
  if (this.worldId !== 'moon') this.travel('moon'); else { const w = this.world, pd = w.pad; if (pd) { w.ensureAround(Math.floor(pd.x / CH), Math.floor(pd.z / CH), 3, 9999); p.x = pd.x + 2.5; p.z = pd.z + 0.5; p.y = pd.y + 0.2; } }
  if (this.meshPass) this.meshPass(120); UI.renderHotbar(); UI.toast('Test jump: you are on the pad at the Starwell with the suit, the Starlark and six Kin at level 95.', 'good');
};
/* the same for Halo: the kit, six Kin at level 150, the collar, the Starwell lit and the Garrison taken behind you, and you are set down outside the Pit gate */
G.designerHalo = function () {
  if (Battle.active || Taming.active) return; const p = this.player, LV = 150; UI.closePanel(); if (typeof Cine !== 'undefined' && Cine.active()) Cine.stop(true);
  for (const k of this.kin) { const lv = Math.max(LV, k.level || 1), t = KIN.create(k.sp, lv); k.level = lv; k.stage = t.stage; k.xp = 0; k.status = null; k.hp = KIN.stats(k).hp; }
  const pool = KIN.dex('earth').filter(sp => !sp.mythic && !sp.legend && !sp.noFuse && !sp.fusion && !this.kin.some(k => k.sp === sp));
  for (let i = 0; this.kin.length < 6 && i < 12 && pool.length; i++) { const sp = pool[Math.floor((i + 0.5) / 6 * pool.length) % pool.length]; if (this.kin.some(k => k.sp === sp)) continue; this.kin.push(KIN.create(sp, LV)); if (sp.dex) { if (!this.stats.dex) this.stats.dex = {}; this.stats.dex[sp.seed] = 'caught'; } }
  for (const it of ['pick_stone', 'pick_iron', 'axe_iron', 'hatchet', 'shovel']) if (ITEMS[it] && !p.has(it)) p.add(it, 1); const cp = (this.stats.camp = this.stats.camp || {}); cp.pick = Math.max(cp.pick || 0, 2); cp.got_axe_iron = true; /* the tools Garrick and the first village give on Earth: anyone this far along has them */
  for (const [it, n] of [['spacesuit', 1], ['collar', 1], ['ship', 1], ['glider', 1], ['raygun', 1], ['torch', 4], ['snare2', 20], ['tonic_heal', 12], ['tonic_revive', 6], ['bread', 10]]) if (ITEMS[it] && p.count(it) < n) p.add(it, n - p.count(it));
  this.shards = Math.max(this.shards || 0, 2500); if (this.trainerXpFor) { this.xp = Math.max(this.xp || 0, this.trainerXpFor(60)); this.trainerLevel = this.trainerLevelFor(this.xp); }
  this.stats.lightReturned = true; this.stats.citadel = Object.assign(this.stats.citadel || {}, { profFree: true, lark: true }); this.stats.reachedMoon = true; this.stats.garrison = Object.assign(this.stats.garrison || {}, { taken: true, fled: true }); this.stats.lostMap = true;
  const hb = (this.stats.hub = this.stats.hub || {}); hb.greeted = true; hb.lit = true; hb.got = hb.got || {}; hb.in = { reg: true, coil: true, key: true, dust: true };
  if (Quests.skipTo) { Quests.skipTo({ main: 'halo', dark: 'laststand' }); this.questState.focus = 'haloarc'; }
  p.mount = null; p.flying = false; p.gliding = false; p.vx = p.vy = p.vz = 0; p.fallStart = null; p.frozen = false; p.hp = p.maxHp;
  if (this.worldId !== 'halo') this.travel('halo'); const s = Arena.site(), w = this.world; if (s) { const x = s.x + 0.5 + Math.sin(s.ga) * (Arena.R + 12), z = s.z + 0.5 + Math.cos(s.ga) * (Arena.R + 12); w.ensureAround(Math.floor(x / CH), Math.floor(z / CH), 3, 9999); p.x = x; p.z = z; p.y = w.groundY(Math.floor(x), Math.floor(z)) + 1.2; p.yaw = Math.atan2(-(s.x - x), -(s.z - z)); }
  if (this.meshPass) this.meshPass(120); UI.renderHotbar(); UI.toast('Test jump: you are outside the Pit on Halo with the collar and six Kin at level 150. The gate is under the skull.', 'good');
};
/* the Lost World as the story reaches it: Halo done up to the night Umbrarch shrugged your Kin off, the Kinmaster's survey in your hand, the same kit and party as the Halo jump,
   and you are set down on Earth at the outside mouth of the tunnel, facing in, so the way through is yours to walk */
G.designerLost = function () {
  if (Battle.active || Taming.active) return; const p = this.player, LV = 150; UI.closePanel(); if (typeof Cine !== 'undefined' && Cine.active()) Cine.stop(true);
  for (const k of this.kin) { const lv = Math.max(LV, k.level || 1), t = KIN.create(k.sp, lv); k.level = lv; k.stage = t.stage; k.xp = 0; k.status = null; k.hp = KIN.stats(k).hp; }
  const pool = KIN.dex('earth').filter(sp => !sp.mythic && !sp.legend && !sp.noFuse && !sp.fusion && !this.kin.some(k => k.sp === sp));
  for (let i = 0; this.kin.length < 6 && i < 12 && pool.length; i++) { const sp = pool[Math.floor((i + 0.5) / 6 * pool.length) % pool.length]; if (this.kin.some(k => k.sp === sp)) continue; this.kin.push(KIN.create(sp, LV)); if (sp.dex) { if (!this.stats.dex) this.stats.dex = {}; this.stats.dex[sp.seed] = 'caught'; } }
  for (const it of ['pick_stone', 'pick_iron', 'axe_iron', 'hatchet', 'shovel']) if (ITEMS[it] && !p.has(it)) p.add(it, 1); const cp = (this.stats.camp = this.stats.camp || {}); cp.pick = Math.max(cp.pick || 0, 2); cp.got_axe_iron = true;
  for (const [it, n] of [['spacesuit', 1], ['collar', 1], ['ship', 1], ['glider', 1], ['raygun', 1], ['torch', 6], ['snare2', 30], ['tonic_heal', 12], ['tonic_revive', 6], ['bread', 10]]) if (ITEMS[it] && p.count(it) < n) p.add(it, n - p.count(it));
  this.shards = Math.max(this.shards || 0, 2500); if (this.trainerXpFor) { this.xp = Math.max(this.xp || 0, this.trainerXpFor(60)); this.trainerLevel = this.trainerLevelFor(this.xp); }
  this.stats.lightReturned = true; this.stats.citadel = Object.assign(this.stats.citadel || {}, { profFree: true, lark: true }); this.stats.reachedMoon = true; this.stats.garrison = Object.assign(this.stats.garrison || {}, { taken: true, fled: true }); this.stats.lostMap = true;
  const hb = (this.stats.hub = this.stats.hub || {}); hb.greeted = true; hb.lit = true; hb.got = hb.got || {}; hb.in = { reg: true, coil: true, key: true, dust: true };
  this.stats.arena = Object.assign(this.stats.arena || { won: 0 }, { sawKM: true }); /* he has been down the steps and Umbrarch has shrugged off your Kin: the only answer is in the valley */
  if (Quests.skipTo) { Quests.skipTo({ main: 'halo', dark: 'laststand', old: 'rex' }); this.questState.focus = 'old'; }
  p.mount = null; p.flying = false; p.gliding = false; p.vx = p.vy = p.vz = 0; p.fallStart = null; p.frozen = false; p.hp = p.maxHp;
  if (this.worldId !== 'earth') this.travel('earth'); const w = this.world, T = w.lost && w.lostTunnel();
  if (!T) { UI.toast('This Earth has no Lost World.', 'bad'); return; }
  w.ensureAround(Math.floor(T.ax / CH), Math.floor(T.az / CH), 3, 9999); let spot = null;
  for (let k = -6; k <= T.pa && !spot; k++) { const x = T.ax + 0.5 + T.ix * k, z = T.az + 0.5 + T.iz * k, yy = Math.round(T.ya + (T.yb - T.ya) * Math.max(0, k) / T.len); /* the first dry footing on the way in: some valleys are ringed by sea, and the mouth stands a step up out of it */
    for (let dy = -3; dy <= 4; dy++) { const y = yy + dy, b0 = w.getBlock(Math.floor(x), y - 1, Math.floor(z)), b1 = w.getBlock(Math.floor(x), y, Math.floor(z)), b2 = w.getBlock(Math.floor(x), y + 1, Math.floor(z)); if (isSolid(b0) && b0 !== B.WATER && !isSolid(b1) && b1 !== B.WATER && !isSolid(b2) && b2 !== B.WATER) { spot = { x, y, z }; break; } } }
  if (!spot) spot = { x: T.ax + 0.5, y: T.ya + 1.2, z: T.az + 0.5 };
  p.x = spot.x; p.z = spot.z; p.y = spot.y + 0.02; p.yaw = Math.atan2(-T.ix, -T.iz); p.pitch = 0;
  if (this.meshPass) this.meshPass(120); UI.renderHotbar(); UI.toast('Test jump: you are at the mouth of the tunnel into the Lost World with six Kin at level 150. The Tyrannorex is in the clearing at the middle.', 'good');
};
/* and what the Pit asks for, without the asking: five banners so Varga will open every gate, and the Tyrannorex for the day Umbrarch shrugs the others off */
G.designerPit = function () { UI.closePanel(); if (this.worldId !== 'halo') { UI.toast('The Pit is on Halo. Use the Halo jump first.'); return; } const st = (this.stats.arena = this.stats.arena || { won: 0 }), names = (Village.planned ? Village.planned().map(v => v.name) : []).slice(0, 5); st.banners = (st.banners || []).slice(0, 5); for (const n of names) if (st.banners.length < 5 && !st.banners.includes(n)) st.banners.push(n);
  if (!this.kin.some(k => k.sp && k.sp.apex === 'rex')) { const k = KIN.create(KIN.apexSpecies('rex'), 170); if (this.kin.length >= 6) this.kin[5] = k; else this.kin.push(k); this.stats.apex = Object.assign(this.stats.apex || {}, { rex: true }); }
  UI.toast('Five banners hang in the Pit and the Tyrannorex is in your party. Leave it out of the party to see Umbrarch shrug the others off first.', 'good'); };
G.mountKin = function (k) { const p = this.player; const mode = this.rideMode(k); if (!mode) return; p.mount = k; p.mountMode = mode; UI.sfx('util'); UI.toast(`You climb onto ${KIN.name(k)}.`); };
G.toast = function (m, c) { UI.toast(m, c); };
G.toggleCamera = function () { this.thirdPerson = !this.thirdPerson; if (this.orbit) { if (this.thirdPerson) { this.orbit.yaw = this.player.yaw; this.orbit.pitch = this.player.pitch; } else this.player.yaw = this.orbit.yaw; } UI.toast(this.thirdPerson ? 'Third person. You can see yourself now; V or the menu switches back.' : 'First person.'); };

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
G.nearDarkTable = function () { if (this.player.has('voidshard') && this.nearTable()) return true; const p = this.player, w = this.world; const x0 = Math.floor(p.x), y0 = Math.floor(p.y), z0 = Math.floor(p.z); for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) for (let dy = -3; dy <= 3; dy++) if (w.getBlock(x0 + dx, y0 + dy, z0 + dz) === B.DARKTABLE && Keeps.tableOpen(x0 + dx, z0 + dz)) return true; return false; };
G.darkRecipe = function (r) { return Object.keys(r.needs).some(k => this.DARK.includes(k)) || this.DARK.includes(r.out); };
G.DARK_MSG = 'Dark materials will not work on an ordinary table. Only the Kinmaster\'s Dark Fusion Table at Thornhold takes Void, until you carry a piece of it.';
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
  if (bw === 'raygun') return this.shootRay(bw);
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
  const st = KIN.stats(e.kin); const unaware = !e.chase && (e.alert || 0) < 0.6;
  const bite = ITEMS[ammo].arrow * (unaware ? 2 : 1); const before = e.kin.hp;
  const calm = ammo === 'arrow_sleep' || ammo === 'arrow_frost';
  Wild.strike(e, bite, { arrow: true, keepOne: true, quiet: calm }); // an arrow never takes the last point: it softens, and brings the Kin to you
  if (calm) { Wild.disengage(e, ammo === 'arrow_sleep' ? 12 : 5); e.ringT = 0; if (ammo === 'arrow_sleep') e.sleep = true; }
  this.stats.arrowHits = (this.stats.arrowHits || 0) + 1;
  if (e.high && Math.random() < 0.6) { p.add('feather', 1); setTimeout(() => UI.toast('A Sky Feather spins down to you.', 'good'), 400); }
  const pct = Math.round(e.kin.hp / st.hp * 100);
  UI.sfx('hit'); UI.toast(`${unaware ? 'Clean shot! ' : 'Hit! '}${KIN.name(e.kin)} down to ${pct}% (${before - e.kin.hp} damage). ${e.kin.hp <= 1 ? 'It is barely standing.' : 'It is coming for you.'}`, 'good');
};
/* the ray gun: the bow's job without arrows. A bolt of light to whatever the crosshair is on */
G.shootRay = function (bw) {
  const p = this.player; if (this.lastShot && performance.now() - this.lastShot < 430) return; this.lastShot = performance.now();
  Combat.use(bw, 1); UI.sfx('zap'); UI.renderHotbar(); const eye = p.eye(), f0 = U.forwardVec(p.yaw, p.pitch), from = [eye.x + f0[0] * 0.6, eye.y - 0.25, eye.z + f0[2] * 0.6], to = (d) => [eye.x + f0[0] * d, eye.y + f0[1] * d, eye.z + f0[2] * d];
  { const fh = Combat.arrowHit('ray', 40); const wall0 = fh && p.raycast(40, false, true); if (fh && (!wall0 || wall0.dist > fh.dist)) { Combat.beam(from, to(fh.dist)); UI.sfx('hit'); const ft = Combat.focusText(); if (ft) UI.toast(ft); return; } }
  const e = Wild.pick(p, 40), wall = p.raycast(40, false, true), eD = e ? Math.hypot(e.x - p.x, e.y - p.y, e.z - p.z) : Infinity;
  if (wall && wall.dist < eD) { Combat.beam(from, to(wall.dist));
    if (wall.id === B.BALLOON) { this.world.setBlock(wall.x, wall.y, wall.z, B.AIR); this.meshPass(99); UI.sfx('caught'); Builds.onShot('balloon', wall, p); return; }
    if (wall.id === B.TARGET && Citadel.onTarget(wall)) return; if (wall.id === B.TARGET) { UI.sfx('hit'); Builds.onShot('target', wall, p); return; } return; }
  if (!e) { Combat.beam(from, to(40)); return; }
  Combat.beam(from, to(eD)); const st = KIN.stats(e.kin), unaware = !e.chase && (e.alert || 0) < 0.6, before = e.kin.hp; Wild.strike(e, 0.2 * (unaware ? 2 : 1), { arrow: true, keepOne: true });
  this.stats.arrowHits = (this.stats.arrowHits || 0) + 1; UI.sfx('hit'); UI.toast(`${unaware ? 'Clean shot! ' : 'Hit! '}${KIN.name(e.kin)} down to ${Math.round(e.kin.hp / st.hp * 100)}% (${before - e.kin.hp} damage). ${e.kin.hp <= 1 ? 'It is barely standing.' : 'It is coming for you.'}`, 'good');
};
// use a consumable from the Bag or by tapping with it held
G.useItem = function (key) {
  if (key === 'bread' && this.stats.first && this.stats.first.stage === 1) { UI.toast('That bread is for the Kin. Walk up to one on the brook and tap it.'); return false; }
  const p = this.player; const info = key ? p.itemInfo(key) : null; if (!info || !info.use || !p.has(key)) return false;
  if (info.use === 'warm') { p.take(key, 1); this.warmUntil = performance.now() + 240000; UI.sfx('util'); UI.toast('Warm all the way through. Four minutes before the cold can bite.', 'good'); UI.renderHotbar(); return true; }
  if (info.use === 'bake') { if (p.count(key) < 3) { UI.toast('A loaf takes three handfuls of wheat. You have ' + p.count(key) + '.'); return false; } const w = this.world; let fire = false; for (let dx = -4; dx <= 4 && !fire; dx++) for (let dz = -4; dz <= 4 && !fire; dz++) for (let dy = -2; dy <= 2; dy++) if (w.getBlock(Math.floor(p.x) + dx, Math.floor(p.y) + dy, Math.floor(p.z) + dz) === B.CAMPFIRE) { fire = true; break; } if (!fire) { UI.toast('You need a camp fire to bake at. Any one will do.'); return false; } p.take(key, 3); p.add('bread', 1); UI.sfx('util'); UI.toast('You grind it between two stones, wet it, and bake it on a flat rock by the fire. One loaf.', 'good'); UI.renderHotbar(); return true; }
  if (info.use === 'treat') { const k = this.kin[this.activeIdx] && this.kin[this.activeIdx].hp > 0 ? this.kin[this.activeIdx] : this.kin.find(q => q.hp > 0); if (!k) { UI.toast('No Kin with you to give them to.'); return false; } p.take(key, 1); k.bond = Math.min(1, (k.bond || 0) + 0.03); UI.sfx('util'); UI.toast(`${KIN.name(k)} eats them out of your hand, shells and all.`, 'good'); UI.renderHotbar(); return true; }
  if (info.use === 'star') { const up = this.kin.filter(q => q.hp > 0); if (!up.length) { UI.toast('No Kin on their feet to shake it over.'); return false; } p.take(key, 1); for (const q of up) { q.hp = KIN.stats(q).hp; const evs = KIN.gainXp(q, 30 + (q.level || 1) * 12); for (const ev of evs) if (ev.type === 'level') UI.toast(`${KIN.name(q)} reached Lv ${ev.level}.`, 'good'); } UI.sfx('util'); UI.toast('It settles on them like frost and sinks in. Every Kin with you is mended, and a little sharper for it.', 'good'); UI.renderHotbar(); return true; }
  if (info.use === 'cell') { const gw = (this.stats.gwear = this.stats.gwear || {}); if (p.has('raygun') && (gw.raygun || 0) > 0) { p.take(key, 1); gw.raygun = 0; UI.sfx('zap'); UI.toast('You crack the cell over the ray gun. It drinks the lot and the charge light goes steady.', 'good'); UI.renderHotbar(); return true; } if (p.hp >= p.maxHp) { UI.toast(p.has('raygun') ? 'The ray gun is fully charged, and so are you.' : 'Nothing here that needs the charge.'); return false; } p.take(key, 1); p.hp = p.maxHp; UI.sfx('zap'); UI.toast('You hold it until your teeth hum. You feel whole again.', 'good'); UI.renderHotbar(); return true; }
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
  if (wildE && wildE.bandit) Roads.holdupEnd(result); if (wildE && wildE.pit) Arena.boutEnd(result); if (wildE && wildE.sideFight) Side.fightEnd(wildE, result); if (wildE && wildE.garrison) Garrison.bossEnd(result);
  const baseXp = Math.floor(9 * wild.level * (1 + 0.4 * (wild.stage - 1)) * KIN.RARITY[wild.sp.rarity || 0].xp * (st ? 6 : 1) * (wildE && wildE.isBoss ? 2.5 : 1)); /* throwing a tyrant out teaches a Kin a great deal */
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
    if (wildE.skyBoss || wildE.tangleBoss) Sky.onBattle(result, wildE);
    if (wildE.finalBoss) Keeps.onFinal(result);
    if (wildE.citadelFirst) Citadel.onBattle(wildE, result);
    if (wildE.thief) Village.thiefCaught(wildE.thief);
    if (wildE.pest) Farms.onBattle(wildE, result);
    if (result === 'won') {
      const dom = KIN.dominant(wild.sp.elem, 1)[0];
      if (Math.random() < ((wild.sp.rarity || 0) >= 2 || wildE.elite ? 1 : 0.6)) { p.add('ess_' + dom, 1); UI.toast(`${dom} Essence collected.`); }
      if (st) { this.stats.mythicDone = true; UI.toast('The Mantlewyrm sinks back into the Starmetal. Next time, bring Void Nets.', 'good'); }
    } else {
      wild.buffs = null; wild.hp = Math.max(1, wild.hp);
      this.stats.caught++; this.seenDex(wild.sp, "caught");
      if (wild.sp && wild.sp.wood) Wood.caught(wild);
      if (this.addKin(wild) === 'party') UI.toast(`${KIN.name(wild)} joined you (${this.kin.length + this.eggs.length}/${this.MAX_KIN}).`, 'good');
      if (st) { this.stats.mythicDone = true; this.mythicCaught = true; UI.toast('You hold the Mythic of the Core. The Starmetal hums: the sky beyond opens in the next version.', 'good'); }
    }
    Wild.remove(wildE);
    if (wildE.isBoss) Village.bossBeaten(wildE);
    if (wildE.isLegend && !this.stats.lostMap) setTimeout(() => this.giveLostMap('A voice on the wind'), 4000);
    if (wildE.isApex === 'mosa' && !this.stats.atlTooth) { this.stats.atlTooth = true; this.player.add('abysstooth', 1); setTimeout(() => UI.toast('It left a tooth behind, as long as your forearm. Somebody will want that.', 'good'), 2500); }
    if (wildE.isApex) { if (!this.stats.apex) this.stats.apex = {}; this.stats.apex[wildE.isApex] = result === 'caught' ? true : { back: (this.dayCount || 0) + 10 }; UI.sfx('quest'); UI.toast(result === 'caught' ? `${KIN.name(wild)} is yours. Nobody is going to believe this.` : `${KIN.name(wild)} is beaten, not caught. It will be back in about ten days.`, 'good'); this.addTrainerXp(5000); }
    if (wildE.isLegend) { if (!this.stats.legends) this.stats.legends = {}; this.stats.legends[this.worldId] = true; if (!this.stats.legendBack) this.stats.legendBack = {}; this.stats.legendBack[this.worldId] = result === 'caught' ? 'caught' : (this.dayCount || 0) + 6; if (result !== 'caught') setTimeout(() => UI.toast(`${KIN.name(wild)} limps away. It will be back in about six days, for another chance to catch it.`), 2500); UI.sfx('quest'); UI.toast(`${KIN.name(wild)} is ${result === 'caught' ? 'yours' : 'beaten'}. The portals of ${this.world.preset.name} wake: every arch you hold now reaches the other worlds, and theirs reach here.`, 'good'); this.addTrainerXp(2000); }
    if (wildE.lieutenant) Village.lieutenantDown(wildE.lieutenant);
  } else if (result === 'ran') {
    wildE.alert = 0; wildE.cool = 7;
  } else if (result === 'lost' && !wildE.bandit) {
    // the winner comes after you: run, or it knocks you out
    UI.toast('Your Kin are down. RUN!', 'bad');
    Wild.engage(wildE, false, { rage: true, quiet: true }); wildE.cool = 0;
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
/* where the parked Starlark sits: on the highest ground under her hull, so a slope or a lump of rock never comes up through her */
G.parkY = function (x, z, from) { const w = this.world; let top = -1; for (const [dx, dz] of [[0, 0], [1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5], [1.2, 1.2], [-1.2, 1.2], [1.2, -1.2], [-1.2, -1.2]]) top = Math.max(top, w.groundY(Math.floor(x + dx), Math.floor(z + dz), Math.floor(from))); return top + 1; };
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
  /* the canopy swings up beside you, you climb in, it shuts, and she lifts */
  if (this.shipBoard) return; const f0 = U.forwardVec(p.yaw, 0); this.shipBoard = { t0: performance.now(), x: p.x + f0[0] * 1.6, y: p.y - 0.1, z: p.z + f0[2] * 1.6, yaw: p.yaw + Math.PI / 2 }; this.shipPark = null; p.frozen = true; UI.sfx('place');
  setTimeout(() => { const b = this.shipBoard; if (!b) return; p.x = b.x; p.z = b.z; p.y = b.y + 0.6; }, 700);
  setTimeout(() => { const b = this.shipBoard; if (!b) return; this.shipBoard = null; p.frozen = false; p.yaw = b.yaw - Math.PI; p.flying = true; p.mount = null; p.vy = 4; UI.sfx('fuse'); UI.toast('The Starlark is up. Hold ▲ to climb, hold ▼ to go down. Above the clouds the world lets go.', 'good'); }, 1400);
};
// ---------- chunk streaming ----------
G.meshPass = function (budget) {
  const w = this.world, p = this.player;
  const pcx = Math.floor(p.x / CH), pcz = Math.floor(p.z / CH);
  const dirty = [];
  for (const c of w.chunks.values()) {
    const d = Math.max(Math.abs(c.cx - pcx), Math.abs(c.cz - pcz));
    // detail: the chunks right around you get every pebble and leaf facet; further out they are rebuilt plainer (nobody sees a stud at 30 blocks)
    const lod = d > 1 ? 1 : 0; if (c.mesh && c.lod !== lod && !c.dirty) c.dirty = 'lod'; c.wantLod = lod;
    if (!c.dirty) continue;
    if (d > this.viewR) continue;
    // need all neighbours generated for correct seams / AO
    let ok = true;
    for (let dx = -1; dx <= 1 && ok; dx++) for (let dz = -1; dz <= 1; dz++) if (!w.chunks.has((c.cx + dx) + ',' + (c.cz + dz))) { ok = false; break; }
    if (ok) dirty.push([(c.cx - pcx) ** 2 + (c.cz - pcz) ** 2 + (c.dirty === 'lod' ? 50 : 0), c]);
  }
  dirty.sort((a, b) => a[0] - b[0]);
  let n = 0;
  // a time budget as well as a count: building a chunk is the heaviest thing the game does, and on a phone two in one frame is a visible hitch.
  // At least one per call; then stop once this frame has spent its share (a big budget, as after a teleport, means 'all of them')
  const t0 = performance.now(), ms = budget >= 99 ? 1e9 : (this.mobile ? 6 : 10);
  for (const [, c] of dirty) { R.buildChunk(w, c); if (++n >= budget || performance.now() - t0 > ms) break; }
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
  if (this.slowT > 0) { this.slowT -= dt; dt *= 0.3; } // a knockout beat: the world holds its breath for a moment
  const w = this.world, p = this.player;
  let input = Controls.poll();
  const inBattle = Battle.active;
  if (!this.paused) {
    const t0 = w.time; if (this.restLapse) { const L = this.restLapse; L.t += dt; w.time = (L.from + L.span * U.smooth(Math.min(1, L.t / L.secs))) % 1; if (w.time < t0) L.wrapped = true; } /* asleep: the hours run by in a few seconds */
    else w.time = (w.time + dt / 1500) % 1; // 25-minute days
    if (w.time < t0) this.dayCount = (this.dayCount || 0) + 1;
    const nightNow = Math.cos(w.time * Math.PI * 2) > 0.17;
    if (this.wasNight === true && !nightNow) this.onDawn();
    this.wasNight = nightNow;
    Weather.update(dt); this.stats.playT = (this.stats.playT || 0) + dt; if (((this.frame || 0) & 31) === 0) Lab.tickEggs();
    if (this.buffOn('train')) { this.trainT = (this.trainT || 0) + dt; if (this.trainT >= 60) { this.trainT = 0; for (const k of this.kin) if (k.hp > 0) KIN.gainXp(k, 15 + k.level * 6); } }
    if (!inBattle) {
      // the camera: in first person the look turns you; in third person (and in the saddle) it orbits round you, and the stick walks you relative to it
      if (!this.orbit) this.orbit = { yaw: p.yaw, pitch: p.pitch, idle: 0 };
      const orbit = this.orbitMode(p);
      if (orbit) {
        this.orbit.yaw -= input.lookDX; this.orbit.pitch = U.clamp(this.orbit.pitch - input.lookDY, -1.25, 1.3); p.pitch = this.orbit.pitch;
        this.orbit.idle = (input.lookDX || input.lookDY) ? 0 : this.orbit.idle + dt;
        const m = Math.hypot(input.mx, input.mz);
        if (m > 0.04) {
          const oy = this.orbit.yaw; const ddx = -Math.sin(oy) * input.mz + Math.cos(oy) * input.mx, ddz = -Math.cos(oy) * input.mz - Math.sin(oy) * input.mx;
          const want = Math.atan2(-ddx, -ddz); let d = want - p.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
          p.yaw += d * Math.min(1, dt * 14); // he turns to face the way he walks
          input = Object.assign({}, input, { mx: 0, mz: Math.min(1, m) });
          if (this.orbit.idle > 1.5 && !p.mount) { let od = p.yaw - this.orbit.yaw; while (od > Math.PI) od -= Math.PI * 2; while (od < -Math.PI) od += Math.PI * 2; this.orbit.yaw += od * Math.min(1, dt * 0.8); } // left alone on the move, the camera drifts round behind you
        }
        if (input.mine) this.faceCamera(); // digging or blocking: square up to where the camera looks
      } else { p.yaw -= input.lookDX; p.pitch = U.clamp(p.pitch - input.lookDY, -1.55, 1.55); this.orbit.yaw = p.yaw; this.orbit.pitch = p.pitch; this.orbit.idle = 0; }
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
      if (input.mine && !p.blocking) { const ev = p.mineTick(dt); if (ev) { UI.sfx('break'); if (Felling.isTrunk(ev.broke)) Felling.cut(ev.x, ev.y, ev.z, p);  if (ev.broke === B.CHEST) this.onChestBroken(ev.x, ev.y, ev.z); if (ev.drop) { if (!this.stats.dug) this.stats.dug = {}; this.stats.dug[ev.drop] = (this.stats.dug[ev.drop] || 0) + 1; } } else if (p.mineTarget && (this.frame % 12) === 0) UI.sfx('mine'); }
      else { p.mineTarget = null; p.mineProgress = 0; }
      if (input.placePressed) this.onTap();
      // wild Kin
      Village.update(dt, p, false);
      Fishing.update(dt);
      if (this.village && this.worldId === 'earth') {
        const dv = Math.hypot(p.x - this.village.x, p.z - this.village.z);
        if (this.stats.elderDone && !this.stats.securePrompt && dv > 18 && !Dialogue.active()) { this.stats.securePrompt = true; Dialogue.show('Elder Hask, calling after you', ['One more thing! If the wild beats you, you wake up at the last village you visited, and your bag is gone, all of it, except your gear and the five secure slots.', 'Set the secure slots in your bag: tap the bar at the bottom of the screen. Whatever you put there, you keep. Shards and Kin are safe too. Go well.']); }
      }
      if (w.regrow && w.regrow.length && (this.frame & 31) === 0) { const now = performance.now(); w.regrow = w.regrow.filter(r => { if (now < r.t) return true; if ((r.id === B.LOG || r.id === B.BIRCHLOG || r.id === B.PALMLOG || r.id === B.LEAVES) && !Felling.natural(r.x, r.y, r.z, r.id)) return false; /* a block you built and took away stays gone */ const b = w.getBlock(r.x, r.y, r.z); if (r.id != null) { if (b === B.AIR && !(Math.abs(r.x + 0.5 - p.x) < 0.8 && Math.abs(r.z + 0.5 - p.z) < 0.8 && r.y >= Math.floor(p.y) - 1 && r.y <= Math.floor(p.y) + 2)) { if (r.id === B.GLOWWORM && !isSolid(w.getBlock(r.x, r.y - 1, r.z))) return false; w.setBlock(r.x, r.y, r.z, r.id); } else if (b === B.AIR) { r.t = now + 15000; return true; } } else if (r.leaf) { if (b === B.LEAVES) w.setBlock(r.x, r.y, r.z, B.BERRYLEAF); } else if (b === B.AIR) w.setBlock(r.x, r.y, r.z, B.BERRY); return false; }); }
      const trig = (Dialogue.active() || Village.walking) ? null : Wild.update(dt, p, performance.now() / 1000, false);
      { const tn = this.talkNpc, on = tn && Dialogue.active() && !(typeof Cine !== 'undefined' && Cine.active()); if (this._spoke && this._spoke !== tn) this._spoke.talkOpen = 0; if (tn) { const tt = performance.now() / 1000; tn.talkOpen = on ? Math.abs(Math.sin(tt * 11.5)) * (0.35 + 0.65 * Math.abs(Math.sin(tt * 3.3 + 1))) : 0; this._spoke = tn; } } /* whoever is speaking moves their mouth */
      R.setSeason(this.worldId === 'earth' && !(this.world.colInfo(Math.floor(p.x), Math.floor(p.z)).lost) ? Fields.season() : 1); Cine.update(dt); Wood.update(dt, p); Roads.update(dt, p); Arena.update(dt, p); Garrison.update(dt, p); Buddy.update(dt, p); First.update(dt, p); Breath.update(dt, p); Ruins.update(dt, p); Fields.update(dt, p); Harvest.update(dt, p); Cast.update(dt, p); Hub.update(dt, p); Side.update(dt, p); this.dustTick(dt, p); Gems.update(dt, p); Felling.update(dt); Keeps.update(dt, p); Citadel.update(dt, p); Farms.update(dt, p); Sky.update(dt, p); Combat.update(dt, p, input);
      Wild.ensureHeart(p, this.trainerLevel, this.mythicCaught); Wild.ensureLegend(p); Wild.ensureApex(p);
      if (trig && !trig.e.cool && !Dialogue.active() && !Taming.active && !p.flying && !(this.fightGrace > performance.now()) && !((Keeps.inHold(p) || Citadel.inside(p) || Sky.inFort(p)) && !trig.e.keepBoss && !trig.e.skyBoss)) Wild.engage(trig.e, trig.ambush);
      for (const e of Wild.list) if (e.cool > 0) e.cool -= dt;
      Hazards.update(dt, p, false); Npcs.update(dt, p, false); Campaign.update(dt, p, false); Taming.update(dt, p); if (p.gliding) { this.lastGlide = performance.now(); if (!p.mount && !p.wingsOn && (this.worldId === 'moon' || this.worldId === 'halo') && !(this.stats.glideW = this.stats.glideW || {})[this.worldId]) { this.stats.glideW[this.worldId] = 1; G.explain('Gliding on ' + (this.worldId === 'moon' ? 'the Moon' : 'Halo'), this.worldId === 'moon' ? 'There is no air up here for the wing to bite. It will not carry you anywhere: it lets you down slowly, almost on the spot. Push forward to drop a little faster, pull back to hang a little longer. You cannot stall and you cannot land hard. Somebody up here may know how to sew a wing for this sky.' : 'The air here is thick with dust. The wing is slower and floats longer than at home. Look for the dust devils turning over the pans: the air inside one is rising, and if you circle in it you climb. The riders here do something to their kites to make them quick: ask around.'); } if (!this.stats.glideTold && !p.mount && !p.wingsOn) { this.stats.glideTold = true; G.explain('Gliding', 'Left stick: push sideways to bank and turn. Push forward to dive and pick up speed, pull back to brake. The arrow on the glide compass is the wind: with it behind you, you go far; into it, you barely move over the ground. Coming in to land, pull back a moment before the ground to flare and you touch down soft. Too fast and too steep, and it hurts. Let go of ▲ to drop, best done low.'); } }
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
          if (ev.type === 'bounty') { UI.sfx('quest'); UI.toast(`Bounty ${ev.round - 1} paid: a Cast Net and XP.`, 'good'); }
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
  const orbitCam = !inBattle && this.orbit && this.orbitMode(p);
  let cam = { x: eye.x, y: eye.y, z: eye.z, yaw: orbitCam ? this.orbit.yaw : p.yaw, pitch: orbitCam ? this.orbit.pitch : p.pitch, fov: (this.mobile ? 75 : 70) * Math.PI / 180 };
  if (!inBattle && p.mount) { // riding: the camera sits back and up, further for bigger mounts, so the mount never fills the view
    const mm = KIN.model(p.mount.sp, p.mount.stage); const size = Math.max(mm.height, mm.radius * 1.4);
    const tk = Taming.active ? Math.min(1, Taming.state.t / 0.9) : 0, te = tk * tk * (3 - 2 * tk); // breaking it in: the camera comes in close behind you, so the animal fills the middle of the view behind the gauge
    cam = Avatar.thirdCam(cam, p, w, (4.5 + size * 1.6) * (1 - 0.26 * te), (0.6 + mm.height * 0.45) * (1 - 0.1 * te));
  } else if (p.flying && !inBattle) { cam = Avatar.thirdCam(cam, p, w, 11.5, 0.1); this.camNear = false; } /* in the ship you are always looking at the ship */
  else if (this.thirdPerson && !inBattle) { cam = Avatar.thirdCam(cam, p, w); this.camNear = !!cam.tooNear; }
  if (this.cutCam && !inBattle) cam = Object.assign({}, cam, this.cutCam); // a little film is playing: the camera stands where the film put it
  // tall grass: the camera eases up and back over your shoulder (more when you crouch) so you see over the blades
  { const want = (!inBattle && !p.mount && !p.flying && Wild.inTallGrass()) ? (p.sneak ? 1 : 0.65) : 0; this.grassCamK = U.lerp(this.grassCamK || 0, want, Math.min(1, dt * 3));
    if (this.grassCamK > 0.02 && !this.thirdPerson) { const k = this.grassCamK; const tc = Avatar.thirdCam(cam, p, w, 4.2 * k, 1.35 * k); cam = Object.assign({}, cam, { x: tc.x, y: tc.y, z: tc.z, pitch: cam.pitch - 0.12 * k }); this.grassCamOn = k > 0.25; } else this.grassCamOn = false; }
  if (inBattle && Battle.camera) { const bc = Battle.camera(dt, this.mobile); if (bc) cam = Object.assign(cam, bc); }
  // talking to someone: the camera slides round to their face, a little to one side
  const talking = !inBattle && this.talkNpc && (Dialogue.active() || UI.panelOpen === 'shop' || UI.panelOpen === 'village' || (this.sceneHold || 0) > performance.now());
  this.talkK = U.clamp((this.talkK || 0) + (talking ? dt * 2.5 : -dt * 2.5), 0, 1);
  if (!talking && this.talkK <= 0) this.talkNpc = null;
  if (this.talkK > 0 && this.talkNpc && !this.cutCam) cam = this.talkCamera(cam, this.talkNpc, U.smooth(this.talkK)); /* a film's camera is never pulled off its shot by somebody talking */
  if (this.shake > 0) { const sh = this.shake * 0.12, tt = performance.now() / 1000; cam = Object.assign({}, cam, { x: cam.x + Math.sin(tt * 43) * sh, y: cam.y + Math.sin(tt * 57) * sh * 0.7, z: cam.z + Math.cos(tt * 39) * sh }); }
  const lights = [];
  if (p.holdingTorch()) lights.push([eye.x, eye.y - 0.2, eye.z, 14]); /* a torch in the hand reaches the far wall of a gallery, not just your boots */
  else if (this.traits().includes('Lantern')) lights.push([eye.x, eye.y - 0.2, eye.z, 16]);
  else { const wl = Wood.light(eye); if (wl) lights.push(wl); } /* a Lampwart along: no torch needed */
  const torches = [...w.torches.values()].map(tp => [tp[0], tp[1], tp[2], (tp[0] - p.x) ** 2 + (tp[2] - p.z) ** 2, tp[3]]).sort((a, b) => a[3] - b[3]);
  if (w.heart && p.y < 20 && Math.hypot(w.heart.x - p.x, w.heart.z - p.z) < 48) lights.push([w.heart.x + 0.5, 7, w.heart.z + 0.5, 18]);
  for (let i = 0; i < torches.length && lights.length < 8; i++) lights.push([torches[i][0], torches[i][1], torches[i][2], torches[i][4] || 12]);
  const lines = [];
  if (!inBattle && !this.paused) { const hit = p.raycast(5.5); if (hit && BLOCKS[hit.id].hard !== Infinity && !w.lostKeep(hit.x, hit.z)) lines.push({ data: R.targetLines(w, hit.x, hit.y, hit.z), color: [0, 0, 0, 0.75] }); }
  lines.push(...Wild.rings(p)); lines.push(...Hazards.lines());
  if (!R.state.underwater && !R.state.inCore && p.y >= w.topAt(Math.floor(p.x), Math.floor(p.z)) - 1) { const rl = Weather.rainLines(w, cam, performance.now() / 1000); if (rl) lines.push(rl); const hl = Harvest.lines(cam, performance.now() / 1000); if (hl) lines.push(...hl); const tl = this.thermalLines(performance.now() / 1000); if (tl) lines.push(tl); }
  document.getElementById('flash').style.opacity = Weather.state.flash > 0.6 ? 0.7 : 0;
  const ents = Wild.list.filter(e => !e.ridden); // the one you are sat on is drawn under you, as your mount
  if (Battle.mineEntity && !Battle.net) ents.push(Battle.mineEntity);
  { const sl = typeof Combat !== 'undefined' && Combat.slashEntity ? Combat.slashEntity() : null; if (sl) ents.push(sl); } /* the blade's trail while a swing is going through */
  if (this.extraEnts && this.extraEnts.length) ents.push(...this.extraEnts); /* figures set into the world from outside the usual lists: models from files while they are being tried out */
  ents.push(...Village.entities());
  /* the Starlark. Professor Finch built ships for an observatory before he built them for anyone else, and it shows: a cream hull banded in brass, a
     domed canopy that swings up on its hinge, feathered wings like the bird she is named for, a telescope slung under the nose, three engine bells.
     You climb in and the canopy shuts; from then on it is the ship you see, not him. Parked, the canopy stands open */
  if (this._wasFly === this.worldId && !p.flying && !this.shipPark && !p.dead && !(typeof Cine !== 'undefined' && Cine.active())) { const gy0 = w.groundY(Math.floor(p.x), Math.floor(p.z), p.y + 2); if (Math.abs(gy0 + 1 - p.y) < 3) { this.shipPark = { t0: performance.now(), until: performance.now() + 6000, x: p.x, y: this.parkY(p.x, p.z, p.y + 2), z: p.z, yaw: p.yaw + Math.PI }; const f1 = U.forwardVec(p.yaw + Math.PI / 2, 0), nx = p.x + f1[0] * 2.4, nz = p.z + f1[2] * 2.4, ny = w.groundY(Math.floor(nx), Math.floor(nz), p.y + 2); if (Math.abs(ny - gy0) < 2) { p.x = nx; p.z = nz; p.y = ny + 1.2; } } } /* landed: the canopy swings up, you are standing beside her, and she stays a few breaths before she is stowed */
  this._wasFly = p.flying ? this.worldId : null;
  { const board = this.shipBoard, park = this.shipPark, now2 = performance.now(); if (park && now2 > park.until) this.shipPark = null;
    if (p.flying || board || this.shipPark) { const open = board ? Math.min(1, (now2 - board.t0) / 350) * (now2 - board.t0 > 1050 ? Math.max(0, 1 - (now2 - board.t0 - 1050) / 300) : 1) : this.shipPark ? Math.min(1, (now2 - this.shipPark.t0) / 400) : 0, ok = open > 0.5 ? 1 : 0;
      const sx0 = p.flying ? p.x : board ? board.x : this.shipPark.x, sy0 = p.flying ? p.y - 0.55 : board ? board.y : this.shipPark.y, sz0 = p.flying ? p.z : board ? board.z : this.shipPark.z, syaw = p.flying ? p.yaw + Math.PI : board ? board.yaw : this.shipPark.yaw;
      ents.push({ x: sx0, y: sy0, z: sz0, yaw: syaw, model: { height: 1.8, radius: 3.2 }, mesh: R.entityMesh('starlark2:' + ok, (mb) => {
        const hull = [0.93, 0.9, 0.82], brass = [0.78, 0.58, 0.22], teal = [0.16, 0.5, 0.52], glass = [0.14, 0.24, 0.34], glow = [0.5, 0.96, 1.0], dark = [0.15, 0.16, 0.2], warm = [1, 0.86, 0.5];
        mb.blob(-0.95, 0.0, -2.2, 0.95, 1.05, 2.3, 1, hull, { n: 3 }); mb.blob(-0.6, 0.15, 1.7, 0.6, 0.85, 3.1, 1, hull, { n: 3 }); mb.blob(-0.22, 0.32, 2.9, 0.22, 0.66, 3.5, 1, brass, { n: 2 }); /* body and a brass beak */
        mb.blob(-0.98, 0.42, -2.0, 0.98, 0.6, 2.0, 1, brass, { n: 2 }); mb.blob(-0.64, 0.4, 1.75, 0.64, 0.56, 2.95, 1, brass, { n: 2 }); /* a brass waist band, nose to tail */
        if (ok) { mb.blob(-0.6, 0.78, -0.55, 0.6, 1.0, 1.05, 1, dark, { n: 2 }); mb.push(); mb.translate(0, 1.0, -0.6); mb.rotate(-1.05, 0, 0); mb.blob(-0.62, 0.0, 0.0, 0.62, 0.62, 1.7, 1, glass, { n: 3 }); mb.tube([[-0.6, 0.02, 0.05], [0.6, 0.02, 0.05]], [0.05, 0.05], brass, { segs: 6 }); mb.pop(); mb.box(-0.3, 0.82, -0.3, 0.3, 1.02, 0.3, [0.5, 0.2, 0.16]); } /* canopy up on its hinge, the seat showing */
        else { mb.blob(-0.62, 0.72, -0.6, 0.62, 1.42, 1.15, 1, glass, { n: 3 }); mb.tube([[-0.58, 0.9, 1.0], [0, 1.4, 0.3], [0.58, 0.9, 1.0]], [0.035, 0.035, 0.035], brass, { segs: 5 }); mb.tube([[0, 1.02, 1.12], [0, 1.43, 0.25], [0, 1.2, -0.6]], [0.035, 0.035, 0.035], brass, { segs: 5 }); } /* shut: dark glass in a brass frame */
        for (const sx of [-1, 1]) { for (let k = 0; k < 4; k++) { const z0 = 0.7 - k * 0.55, L = 3.3 - k * 0.42; mb.plate([[sx * 0.8, 0.5 + k * 0.03, z0], [sx * L, 0.42 + k * 0.03, z0 - 1.15], [sx * (L - 0.05), 0.42 + k * 0.03, z0 - 1.55], [sx * 0.8, 0.5 + k * 0.03, z0 - 0.7]], 0.06, k === 3 ? teal : hull); } /* four long feathers a side, the last one teal */
          mb.tube([[sx * 0.8, 0.5, 0.75], [sx * 3.3, 0.42, -0.45]], [0.06, 0.04], brass, { segs: 6, cap0: 'round', cap1: 'round' }); mb.ball(sx * 3.3, 0.44, -0.47, 0.07, sx > 0 ? [0.4, 1, 0.5] : [1, 0.4, 0.35], { emis: true });
          mb.tube([[sx * 0.72, 0.45, -1.3], [sx * 0.72, 0.45, -2.35]], [0.33, 0.4], brass, { segs: 12, cap0: 'round', cap1: 'none' }); mb.tube([[sx * 0.72, 0.45, -2.3], [sx * 0.72, 0.45, -2.42]], [0.33, 0.3], glow, { segs: 12, emis: true, cap0: 'none', cap1: 'flat' }); /* an engine bell each side */
          mb.plate([[sx * 0.2, 0.9, -1.5], [sx * 1.25, 1.35, -2.5], [sx * 1.2, 1.35, -2.9], [sx * 0.2, 0.9, -2.2]], 0.05, k2col(sx)); /* tail feathers, spread */
          mb.tube([[sx * 0.55, 0.1, 0.9], [sx * 0.7, -0.42, 1.0]], [0.05, 0.04], dark, { segs: 5 }); mb.tube([[sx * 0.55, 0.1, -1.0], [sx * 0.7, -0.42, -1.1]], [0.05, 0.04], dark, { segs: 5 }); mb.tube([[sx * 0.7, -0.44, 1.25], [sx * 0.7, -0.44, -1.35]], [0.055, 0.055], dark, { segs: 6, cap0: 'round', cap1: 'round' }); /* skids */
          mb.ball(sx * 0.3, 0.5, 3.02, 0.06, warm, { emis: true }); for (const z of [0.9, 0.3, -0.9]) mb.ball(sx * 0.93, 0.6, z, 0.11, glass); } /* nose lamps and three portholes */
        mb.tube([[0, 0.5, -1.9], [0, 0.5, -2.55]], [0.42, 0.52], brass, { segs: 12, cap0: 'round', cap1: 'none' }); mb.tube([[0, 0.5, -2.5], [0, 0.5, -2.64]], [0.44, 0.4], glow, { segs: 12, emis: true, cap0: 'none', cap1: 'flat' }); /* the big bell in the middle */
        mb.plate([[0, 1.0, -1.2], [0, 1.9, -2.3], [0, 1.9, -2.75], [0, 1.0, -2.2]], 0.06, teal); mb.ball(0, 1.95, -2.5, 0.06, [1, 0.4, 0.3], { emis: true }); /* the fin and its beacon */
        mb.tube([[0, -0.08, 0.5], [0, -0.08, 2.2]], [0.13, 0.1], brass, { segs: 8, cap0: 'round', cap1: 'flat' }); mb.tube([[0, -0.08, 2.2], [0, -0.08, 2.28]], [0.12, 0.12], glass, { segs: 8, cap0: 'none', cap1: 'flat' }); /* his telescope, slung underneath. He would not leave it behind */
        function k2col(sx) { return sx > 0 ? teal : hull; }
      }), scale: 1, hover: p.flying ? Math.sin(performance.now() / 300) * 0.05 : 0, skyMul: 1, isMount: true });
      if (p.flying) { const sp = Math.hypot(p.vx, p.vz, p.vy || 0); if (sp > 1.5 && Math.random() < Math.min(0.9, sp * 0.08)) { const b = U.forwardVec(p.yaw, 0); Hazards.sparks(p.x - b[0] * 2.6, p.y - 0.2, p.z - b[2] * 2.6, 2, [0.5, 0.9, 1.0], 1.2); } } } }
  const showMe = !this.hideMe && !p.flying && !(this.shipBoard && performance.now() - this.shipBoard.t0 > 700) && !Battle.net && (inBattle || (this.thirdPerson && !(this.camNear && !p.mount)) || this.talkK > 0 || !!p.mount || this.grassCamOn); // hideMe: he has gone inside something (a railway carriage)
  if (showMe) { const me = Avatar.entity(p, Math.hypot(p.vx, p.vz) > 0.6); if (p.mount) { const mm = KIN.model(p.mount.sp, p.mount.stage); const st = seatOf(mm); const f = U.forwardVec(p.yaw, 0); const along = 0.5 + st.zc - 0.06; me.x = p.x + f[0] * along; me.z = p.z + f[2] * along; me.y = G.mountBase(p) + st.top - hipOf(me.model) * (me.scale || 1) + 0.1; me._an.cross = 1; /* sat cross-legged on top: fits a pony and a T-rex alike */ me.seatY = hipOf(me.model) * (me.scale || 1); } me.M = null; ents.push(me); this.meEnt = me; } else this.meEnt = null;
  if (p.mount) { const k = p.mount; const m = KIN.dress(KIN.model(k.sp, k.stage), k.wear); const fwd = U.forwardVec(p.yaw, 0); if (!k._an) k._an = { ph: 0, mv: 0, lx: p.x, lz: p.z, ly: p.y, lt: performance.now(), vy: 0, seed: 5, air: 0 }; k._an.swim = p.mountMode === 'water' ? 1 : 0; const mt = { x: p.x + fwd[0] * 0.5, y: G.mountBase(p), z: p.z + fwd[2] * 0.5, yaw: p.yaw + Math.PI, model: m, mesh: R.entityMesh(KIN.meshKey(k.sp, k.stage) + KIN.wearKey(k.wear), (mb) => KIN.buildMesh(mb, m)), scale: 1, hover: 0, skyMul: 1, isMount: true, flying: p.mountMode === 'air' && !p.onGround, _an: k._an }; ents.push(mt); if (Taming.active) Taming.pose(mt, this.meEnt, cam.yaw); /* it bucks, and you with it */ }
  ents.push(...Battle.fxEntities()); ents.push(...Sky.puffEntities()); ents.push(...Wild.dropEntities()); ents.push(...Gems.entities()); ents.push(...Buddy.entities()); ents.push(...First.entities()); ents.push(...Cine.entities()); ents.push(...Wood.entities()); ents.push(...Arena.entities()); ents.push(...Roads.entities()); ents.push(...Garrison.entities()); ents.push(...Sky.entities()); ents.push(...Ruins.entities()); ents.push(...Fields.entities()); ents.push(...Harvest.entities()); ents.push(...Hub.entities()); ents.push(...Side.entities()); ents.push(...Farms.entities()); ents.push(...Felling.entities()); ents.push(...Combat.entities()); ents.push(...Hazards.entities()); ents.push(...Npcs.entities());
  /* in a film the one speaking is whoever stands where the view is put: their mouth works, as it does across a counter */
  { const sa = Cine.speakAt, tt = performance.now() / 1000; for (const e of ents) { if (!e || !e.model) continue; const o = e.src || e, on = !!sa && Math.abs(e.x - sa.x) < 0.9 && Math.abs(e.z - sa.z) < 0.9 && Math.abs(e.y - sa.y) < 3; if (on) { o.talkOpen = Math.abs(Math.sin(tt * 11.5)) * (0.35 + 0.65 * Math.abs(Math.sin(tt * 3.3 + 1))); o._said = true; } else if (o._said) { o._said = false; o.talkOpen = 0; } } }
  if (typeof GLB !== 'undefined') GLB.dressAll(ents); /* the cast who have models from files wear them (see glb.js) */
  for (const o of w.statues.values()) {
    if ((o.x - p.x) ** 2 + (o.z - p.z) ** 2 > 4000) continue;
    if (!o.model) { o.model = KIN.statueModel(o); o.mesh = R.entityMesh('statue:' + o.id, (mb) => KIN.buildMesh(mb, o.model)); }
    const top = w.topAt(o.x, o.z); const sky = o.y >= SKY_SPLIT ? 1 : (o.y >= top ? 1 : Math.max(0, 1 - (top - o.y) * 0.11));
    ents.push({ x: o.x + 0.5, y: o.y, z: o.z + 0.5, yaw: o.yaw || 0, model: o.model, mesh: o.mesh, scale: o.scale || 1, hover: 0, skyMul: sky, isStatue: true });
  }
  for (const e of ents) if (e.isStatue || e.isFx || e.isMount || e.isBuddy || e.isFoe || !e.model) { /* static */ } else if (e.chase || e.dazed > 0 || e.stunT > 0 || e.flee > 0) { /* the live fight sets its own stance */ } else if (e.hitT > 0) { e.hover = (e.model.hover || 0) + Math.sin(e.hitT * 60) * 0.08; } else if (e.breach == null) e.hover = e.model.hover + (e.flying ? Math.sin((e.bob || 0) * 2) * 0.08 : 0);
  const held = (!inBattle && !this.thirdPerson && !p.mount && !p.flying && this.talkK <= 0 && !this.grassCamOn) ? Held.describe(p, dt, input) : null; if (held) { const top = w.topAt(Math.floor(p.x), Math.floor(p.z)); held.skyMul = eye.y >= top ? 1 : Math.max(0.2, 1 - (top - eye.y) * 0.11); }
  R.render(w, p, ents, cam, { lights, lines, held });
  if ((this.frame & 3) === 0) UI.renderHud(dt);
  UI.floatersTick(dt);
  if ((this.frame & 31) === 0 && !inBattle) UI.renderMinimap(p);
  if ((this.frame & 15) === 0) this.updateMusic(inBattle);
  if ((this.frame & 1) === 0) UI.renderSky(cam, this.world, R.state);
  if ((this.frame & 7) === 0) { // the shield button: up whenever a Bound warrior has seen you and there is a shield in your bag
    const foe = !inBattle && !p.mount && Combat.shield() && (Combat.nearestFoe(p, 14) || (Combat.weapon && Combat.weapon())); /* the shield button is there whenever you own a shield and either a foe is near or a weapon is in your hand */ const bb = document.getElementById('btn-block');
    if (bb) { bb.classList.toggle('hidden', !foe); if (!foe && this.blockHeld) { this.blockHeld = false; bb.classList.remove('held'); } }
    if (foe && !this.stats.blockTip) { this.stats.blockTip = true; UI.toast('Your shield: hold 🛡 to raise it and take the blow. Raise it just as he strikes and you parry, leaving him open. Let go to swing back.', 'good'); }
  }
  if ((this.frame & 7) === 0 && !inBattle) {
    const st = this.stealthTarget();
    const lead = this.activeKin();
    const eng = Wild.engagedNear(p);
    if (!this.stats.netTold && (p.has('snare') || p.has('snare2')) && ((eng && eng.dazed > 0) || (st && !eng))) { this.stats.netTold = true; this.explain('Now: the net', (eng && eng.dazed > 0 ? 'It is down and dazed for about ten seconds. ' : 'It has not seen you. ') + 'Tap it, or tap the Net button. Then hold your finger on the ring and draw circles to swing the net open, flick up at the Kin to throw, and as it lands swirl the other way to draw it shut.'); }
    UI.setButtons({ deployLabel: this.kin.some(k => k.hp > 0) ? 'Deploy Kin' : 'No Kin fit · go and heal', deploy: !!eng && !(eng.dazed > 0) && !p.flying, snare: !!st && (p.has('snare') || p.has('snare2')) && !(eng && !(eng.dazed > 0)), ride: !p.flying && (!!p.mount || !!(this._rideable = this.rideable())), rideLabel: p.mount ? 'Off' : (this._rideable ? this._rideable.label : 'Ride'), riding: !!p.mount, ship: p.has('ship') && (p.flying || this.world.layerAt(Math.floor(p.y), Math.floor(p.x), Math.floor(p.z)) !== 'Mines'), flying: p.flying, canLand: p.flying && (p.autoLand || this.landHeight() <= G.LAND_REACH) });
    if (p.mount && !Taming.active && !p.mount.borrowed && (p.mount.hp <= 0 || !this.kin.includes(p.mount))) { p.mount = null; UI.toast('Your mount is down.', 'bad'); } /* while you are breaking one in, it is not yours yet (Thunderhoof, the seahorse in the ring) */
    if (p.mount && !Taming.active && p.mountMode === 'water' && !p.inWater && p.onGround) { p.mount = null; UI.toast('It cannot follow you onto land.'); }
    if (p.mount && !Taming.active && p.mountMode === 'air' && (this.frame & 15) === 0 && this.noKinFlight()) { p.mount = null; UI.toast('No room down here for wings that size. You climb off.'); }
  }
  if ((this.frame & 7) === 0 && !inBattle) { const npc = Village.pick(p); const rn = npc ? null : Npcs.pick(p); const we = (npc || rn) ? null : Wild.pick(p); const hit = (!npc && !we && !rn) ? p.raycast(5.5) : null; const campHit = hit && hit.id === B.CAMPFIRE;
    UI.lookLabel(Side.label(p) ? Side.label(p) : rn ? Npcs.label(rn) + ' · tap' : Ruins.boardNear(p) ? 'Weathered board · tap to read' : Fields.label(p) ? Fields.label(p) : Harvest.label(p) ? Harvest.label(p) : Hub.label(p) ? Hub.label(p) : (hit && Ruins.stoneAt(hit.x, hit.y, hit.z)) ? 'Engraved stone · tap to read' : npc ? `${npc.name}${npc.shop ? ' · ' + (npc.shopTitle || Village.SHOPS[npc.shop].title) : npc.role === 'voodoo' ? ' · healer' : npc.role === 'elder' ? ' · village ledger' : npc.tag ? ' · ' + npc.tag : npc.role === 'traveller' ? ' · has something to trade' : npc.role === 'hermit' ? ' · hermit, has a job for you' : ''} · tap to talk` : we ? `${KIN.name(we.kin)} · Lv ${we.kin.level}${(we.kin.sp.rarity || 0) > 0 ? ' · ' + KIN.RARITY[we.kin.sp.rarity].name : ''}${we.raider ? ' · RAIDER' : we.isBoss ? ' · tyrant' : we.lieutenant ? " · the tyrant's guard" : ''}` : campHit ? 'Camp fire · tap to rest' : (hit && hit.id === B.BOOKS) ? 'Bookshelf · tap to read' : (hit && hit.id === B.STARMETAL) ? (this.worldId === 'moon' ? 'Return pad · tap to fly home' : 'Starmetal') : (hit && hit.id === B.FUSION) ? 'Fusion Table · tap' : (hit && hit.id === B.PORTAL) ? 'Portal · tap to travel' : (hit && hit.id === B.CHEST) ? 'Chest · tap to open' : (hit && hit.id === B.INCUBATOR) ? 'Incubator · tap' : (hit && (hit.id === B.DOOR || hit.id === B.DOOR_OPEN)) ? 'Door · tap' : (hit && hit.id === B.SNOW) ? 'Snow · hold to take (Frost Cloak needs 8)' : (hit && (hit.id === B.IRON || hit.id === B.COPPER || hit.id === B.EMBER || hit.id === B.VOID)) ? BLOCKS[hit.id].name + ' · hold to mine' : ''); }
};
// third person and the saddle orbit the camera round you; the air, the glider, a fight and a chat do not
G.orbitMode = function (p) { return (this.thirdPerson || !!p.mount) && !Battle.active && !p.gliding && !p.flying && !p.wingsOn && !(this.talkK > 0); };
G.faceCamera = function () { const p = this.player; if (this.orbit && this.orbitMode(p)) p.yaw = this.orbit.yaw; };
G.onTap = function () {
  this.faceCamera();
  const p = this.player;
  if (Dialogue.active()) return;
  if (Fishing.active) { Fishing.tap(); return; }
  if (Side.sounding) { Side.soundTap(); return; }
  if (Taming.active) { Taming.tap(); return; }
  const npc = Village.pick(p);
  if (npc) { Village.talk(npc); return; }
  if (First.tap(p)) return;
  { const h0 = p.raycast(5.5); if (h0 && Ruins.read(h0.x, h0.y, h0.z)) return; }
  if (Ruins.tapBoard(p)) return;
  if (Fields.tap(p)) return;
  if (Harvest.tap(p)) return;
  if (Side.tap(p)) return;
  if (Hub.tap(p)) return;
  const rn = Npcs.pick(p);
  if (rn) { Npcs.talk(rn); return; }
  { const be = Buddy.entity; const h0 = p.raycast(5.5); const useBlock = h0 && [B.CAMPFIRE, B.FUSION, B.DARKTABLE, B.CHEST, B.BED, B.DOOR, B.DOOR_OPEN, B.PORTAL, B.INCUBATOR, B.BOOKS].includes(h0.id);
    const buddyFirst = !(useBlock && be && Math.hypot(be.x - p.x, be.z - p.z) > h0.dist - 0.3); // a fire or table right in front of you wins over your Kin standing beside it
    if (buddyFirst && Buddy.pick(p) && !Wild.pick(p)) { Buddy.tap(); return; } }
  { const sel0 = p.selected(); const ai = sel0 && ITEMS[sel0]; if (ai && ai.arrow && Combat.anyBow()) { this.shoot(sel0); return; } }
  const e = (p.selected() && (p.itemInfo(p.selected()) || {}).bow) ? null : Wild.pick(p);
  const hit = p.raycast(5.5);
  // with a weapon in hand, a tap on something you use (the camp fire, a table, a door, a chest, a bed) still uses it; anything else is a swing
  const usable = hit && !e && (hit.id === B.CAMPFIRE || hit.id === B.FUSION || hit.id === B.DARKTABLE || hit.id === B.STARMETAL || hit.id === B.PORTAL || hit.id === B.DOOR || hit.id === B.DOOR_OPEN || hit.id === B.CHEST || hit.id === B.BOOKS || hit.id === B.INCUBATOR || hit.id === B.BED || hit.id === B.THORN || hit.id === B.DEADGATE || hit.id === B.RUBBLE);
  if (Combat.weapon() && !usable && !(e && e.rogue) && !(e && e.dazed > 0)) { Combat.swing(); return; }
  if (e && e.dazed > 0) { if (p.has('snare') || p.has('snare2')) { this.stealthSnare(); } else UI.toast('It is dazed. A net would take it now: 2 wood, 2 stone.'); return; }
  if (e && e.rogue) { const c = Campaign.C(); if (c.ranch !== 2) { UI.toast('Thunderhoof flattens his ears at you. Talk to Dusty Hale first.'); return; } const k = KIN.create(e.kin.sp, e.kin.level); Taming.start(k, { hard: true, ent: e, onDone: (kk) => { kk.tamed = true; this.addKin(kk); Campaign.onRogueTamed(kk); UI.toast('Thunderhoof is yours, and you can ride now. Every Kin still has to be broken in once: press Ride and hold on.', 'good'); } }); return; }
  if (e && (!hit || Math.hypot(e.x - p.x, e.z - p.z, e.y - p.y) < hit.dist + 0.5)) {
    if (e.cool > 0) e.cool = 0;
    Battle.start(e, e.alert < 0.6); return;
  }
  const selInfo = p.selected() ? p.itemInfo(p.selected()) : null;
  if (selInfo && selInfo.bow) { this.shoot(); return; }
  if (hit && (hit.id === B.THORN || hit.id === B.DEADGATE || hit.id === B.RUBBLE) && Campaign.tryGate(hit)) return;
  const interactable = hit && (hit.id === B.CAMPFIRE || hit.id === B.FUSION || hit.id === B.DARKTABLE || hit.id === B.STARMETAL || hit.id === B.PORTAL || hit.id === B.DOOR || hit.id === B.DOOR_OPEN || hit.id === B.CHEST || hit.id === B.INCUBATOR || hit.id === B.BOOKS);
  if (!interactable && selInfo && selInfo.rod) { Fishing.cast(); return; }
  if (!interactable && selInfo && selInfo.use) { this.useItem(p.selected()); return; }
  if (!interactable && selInfo && selInfo.snare) { if (this.stealthTarget()) { this.stealthSnare(); } else UI.toast('Snares work in a fight, or sneak up close behind an unaware Kin and press Throw net.'); return; }
  const ev = p.place();
  if (!ev) return;
  if (ev.interact === 'fusion') { if (ev.dark && !Keeps.tableOpen(ev.x, ev.z)) { UI.toast('The warlord\'s table. It will not answer you until this place is yours.', 'bad'); return; } if (!ev.dark && Village.tableChallenge()) return; if (ev.dark && !this.stats.darkTold) { this.stats.darkTold = true; this.explain('The Dark Fusion Table', 'The Kinmaster\'s own table. It is the only one that takes dark materials: Void Crystal, Void Essence and Void Stones. Every fusion that needs a Void Stone, the Void Net, and anything else made with Void has to be made here.'); } UI.openPanel('fusion', { table: { x: ev.x, y: ev.y, z: ev.z }, dark: !!ev.dark }); if (!ev.dark) UI.openPanel('table', { table: { x: ev.x, y: ev.y, z: ev.z } }); return; } // tapping a table asks what you came for: crafting or Kin
  if (ev.interact === 'portal') { const r = Village.portalHere(ev.x, ev.z); if (r.err) { UI.toast(r.err, 'bad'); return; } UI.openPanel('portal', r.v); return; }
  if (ev.interact === 'chest') { UI.openPanel('chest', { x: ev.x, y: ev.y, z: ev.z }); return; }
  if (ev.interact === 'books') { Books.open('atlantis'); return; }
  if (ev.interact === 'incubator') { if (!Lab.canUse()) { UI.toast('The incubator is dead until its maker is free.', 'bad'); return; } UI.openPanel('incubator'); return; }
  if (ev.interact === 'door') { UI.sfx(ev.open ? 'place' : 'break'); this.meshPass(99); return; }
  if (ev.kit) { const err = Village.placeKit(ev.kit, ev.item, ev.hit, p); if (err) UI.toast(err, 'bad'); else { p.take(ev.item, 1); UI.sfx('fuse'); UI.renderHotbar(); this.meshPass(99); } return; }
  if (ev.interact === 'camp') {
    const now = performance.now();
    if (this.lastRest && now - this.lastRest < 120000) { UI.toast(`The fire is still warm. Rest again in ${Math.ceil((120000 - (now - this.lastRest)) / 1000)}s.`); return; }
    const dark = this.isNightNow(), worn = !this.kin.every(k => k.hp >= KIN.stats(k).hp) || p.hp < p.maxHp;
    if (!worn && !dark) { UI.toast('Your Kin are rested and there is plenty of day left. Come back at dusk and you can sleep the night through.'); return; }
    this.lastRest = now; this.restTo('fire', (slept) => { for (const k of this.kin) k.hp = KIN.stats(k).hp; p.hp = p.maxHp; UI.sfx('caught'); UI.toast(slept ? 'First light. You wake by the fire, and every Kin wakes with you, whole.' : 'A couple of hours by the fire. Every Kin wakes, whole.', 'good'); }); return;
  }
  if (ev.interact === 'starmetal') {
    if (this.worldId !== 'earth') { this.fadeTravel('earth'); return; }
    if (p.has('ship')) { UI.toast('The Heart is quiet. Your ship waits on the surface: select it and tap.'); return; }
    if (this.stats.mythicDone) { if (!this.stats.hollowTold) { this.stats.hollowTold = true; this.explain('The hollow Starmetal', 'The pedestal is hollow. Something was torn out of the middle of it: a heart of living metal, the kind that could drive a ship between worlds. Only one person was down here before you. The Kinmaster has it, and he has had someone build something with it.'); } else UI.toast('Hollow. He took its heart for his ship.'); return; }
    UI.toast('Starmetal. Too heavy to lift while the Mythic sleeps on it.'); return;
  }
  if (ev.placed != null) { UI.sfx('place'); UI.renderHotbar(); p.placedT = 0.18; }
};

// the Starship above the clouds: where to?
G.chooseDestination = function (id) {
  UI.closePanel();
  if (id === 'back') { this.player.flying = true; this.player.y = WH + 10; this.player.vy = -2; return; }
  if (id === this.worldId) { this.player.flying = true; this.player.y = WH + 10; this.player.vy = -2; UI.toast('You are already here. Coming back down.'); return; }
  if (id === 'halo' && !Hub.haloOpen()) { this.player.flying = true; this.player.y = WH + 10; this.player.vy = -2; UI.toast('Halo is too far for the Starlark alone. She needs the Starwell lit behind her: Professor Finch, on the Moon.', 'bad'); return; }
  this.shipTravel(id);
};
/* leaving a world and reaching the next one, as a film: the Starlark seen from outside against the sky she is leaving, a white-out, and then
   the new world turning under her as she comes down to the pad. The first time for each world is the long telling; after that a few seconds */
G.shipTravel = function (target) {
  const p = this.player, from = this.worldId, NAME = { earth: 'Earth', moon: 'the Moon', halo: 'Halo' }, fl = (this.stats.flown = this.stats.flown || {}), firstOut = !fl['out:' + from], firstIn = !fl['in:' + target]; fl['out:' + from] = true; fl['in:' + target] = true;
  const OUT = { earth: ['Below you the lamps are coming on in every town you opened.', 'The Citadel is a dark tooth on the edge of the world, and already small.', 'Ahead there is one black ship, and a whole sky he means to take.'], moon: ['The domes shrink to beads of light on the grey.', 'He said there is nowhere past Halo.', 'You are about to find out.'], halo: ['The ring turns under you, slow as a mill wheel.', 'The Pit is a scratch in the sand from up here.'] };
  const IN = { moon: ['Grey to the edge of everything, and no sound at all.', 'Glass domes with people in them who glow.', 'And one white post where the lights are the wrong colour.'], halo: ['The ring fills half the sky.', 'Rust and sand, and tracks that run out to yards you cannot see.', 'This is where the road stops.'], earth: ['It is greener than you remembered.', 'Somebody down there is mending a net.'] };
  const arr = { orbit: { x: p.x, y: p.y, z: p.z, r: [46, 11], h: [26, 4], a: [0.4, 2.2], ly: 0.5 }, plain: true, secs: firstIn ? 10 : 3.5, title: firstIn ? NAME[target][0].toUpperCase() + NAME[target].slice(1) : null, glow: 'gold', sfx: 'quest', flash: firstIn ? IN[target] : null };
  if (from === 'moon' && this.world.pad && Hub.site()) { const pd = this.world.pad; this.world.ensureAround(Math.floor(pd.x / CH), Math.floor(pd.z / CH), 5, 99999); p.x = pd.x; p.z = pd.z; p.y = pd.y + 3.2; if (this.meshPass) this.meshPass(999); } /* she leaves the Moon from the pad at the Starwell, wherever you climbed aboard */
  p.flying = true; p.vx = p.vy = p.vz = 0;
  const beats = [{ orbit: { x: p.x, y: p.y, z: p.z, r: [8, 11], h: [1.5, 3.5], a: [p.yaw + 2.2, p.yaw + 3.9], ly: 0.5 }, plain: true, secs: firstOut ? 10 : 3, title: firstOut ? 'The Starlark leaves ' + NAME[from] : null, shake: 0.5, sfx: 'fuse', flash: firstOut ? OUT[from] : null },
    { orbit: { x: p.x, y: p.y, z: p.z, r: [11, 40], h: [3.5, -14], a: [p.yaw + 3.9, p.yaw + 4.5], ly: 0.5 }, secs: firstOut ? 3.5 : 1.8, glow: 'gold', shake: 0.8 },
    { run: () => { crossed = true; setTimeout(() => { if (this.worldId === target) return; this.travel(target); const q = this.player; q.flying = true; q.y += 3.2; q.vy = 0; arr.orbit.x = q.x; arr.orbit.y = q.y; arr.orbit.z = q.z; arr.orbit.a = [q.yaw + 0.6, q.yaw + 2.6]; Cine.play([arr], land); }, 0); } }]; /* setting up a world clears any film, so the arrival is a film of its own, started on the far side */ /* the world is swapped between two frames, never in the middle of one */
  let crossed = false; const land = () => { if (this.worldId !== target) { this.travel(target); } const q = this.player; if (this.worldId === target && !q.flying && !this.shipPark) { q.flying = true; } if (q.flying) { const gy = this.world.groundY(Math.floor(q.x), Math.floor(q.z)); q.flying = false; q.vy = 0; this.shipPark = { t0: performance.now(), until: performance.now() + 6000, x: q.x, y: this.parkY(q.x, q.z, gy + 3), z: q.z, yaw: q.yaw + Math.PI }; const f = U.forwardVec(q.yaw + Math.PI / 2, 0); q.x += f[0] * 2.4; q.z += f[2] * 2.4; q.y = this.world.groundY(Math.floor(q.x), Math.floor(q.z)) + 1.2; } };
  if (typeof Cine === 'undefined' || !Cine.play(beats, () => { if (!crossed) { crossed = true; setTimeout(land, 0); } })) { this.fadeTravel(target); } /* skipped before the crossing: go anyway, and land */
};
/* resting passes the time. A short film runs the sky on from now to when you wake, and the world is at that hour when it ends: sleep through the dark and it is dawn, rest by day and a couple of hours have gone */
G.isNightNow = function () { const w = this.world, t = w.time; return !w.preset.flatDay && (t > 0.72 || t < 0.22); };
G.restTo = function (how, done) { const w = this.world, p = this.player, slept = this.isNightNow(), from = w.time, span = slept ? ((0.275 - from) + 1) % 1 : 0.085, day0 = this.dayCount || 0;
  const fin = () => { const L = this.restLapse; this.restLapse = null; w.time = (from + span) % 1; if (from + span >= 1) this.dayCount = day0 + 1; /* however the film ended, skipped or not, the clock lands where it was going */ if (done) done(slept); };
  this.restLapse = { from, span, t: 0, secs: 5.4 };
  const beats = how === 'bed' ? [{ flash: slept ? ['The lamp burns down.', 'First light at the shutters.'] : ['You shut your eyes for a couple of hours.'], secs: 5.4, mood: 'memory' }]
    : [{ orbit: { x: p.x, y: p.y, z: p.z, r: [6.5, 9], h: [1.9, 2.9], a: [p.yaw + 0.5, p.yaw + 2.5], ly: 2.3 }, secs: 5.4, title: slept ? 'The night goes by' : 'A couple of hours go by', mood: null }];
  try { if (!Cine.play(beats, fin)) fin(); } catch (e) { fin(); } };
/* the dust devils that mark Halo's rising air: a loose spiral of grit turning up off the pan, so you can see where to circle */
G.thermalLines = function (time) { if (this.worldId !== 'halo') return null; const p = this.player, L = Player.thermalsNear(p.x, p.z, 110); if (!L.length) return null; const N = 110, out = new Float32Array(L.length * N * 6); let k = 0;
  for (const c of L) { const gy = (c.gy != null ? c.gy : this.world.groundY(Math.floor(c.x), Math.floor(c.z))) + 1; for (let i = 0; i < N; i++) { const f = ((i / N) + time * 0.07) % 1, h = f * 46, a = i * 2.4 + time * 1.6 + h * 0.25, r = 0.7 + f * f * 5.5, x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r, a2 = a + 0.75; out[k++] = x; out[k++] = gy + h; out[k++] = z; out[k++] = c.x + Math.cos(a2) * r; out[k++] = gy + h + 0.9; out[k++] = c.z + Math.sin(a2) * r; } }
  return { data: out, color: [0.42, 0.25, 0.13, 0.85] }; };
/* Halo's air is dust. Without the breather collar it wears you down to your last two hearts and keeps you there */
G.dustTick = function (dt, p) { if (!p.has('collar') && this.stats.garrison && this.stats.garrison.taken) { p.add('collar', 1); UI.toast('Among what you took from the Garrison: Hask\'s breather collar. With it you can stand the dust on Halo.', 'good'); if (UI.renderHotbar) UI.renderHotbar(); }
  if (this.worldId !== 'halo' || p.has('collar') || p.flying || this.shipBoard || (typeof Cine !== 'undefined' && Cine.active()) || Battle.active) { this._dust = 0; return; }
  p.regen = 0; this._dust = (this._dust || 0) + dt; this._dustSay = (this._dustSay || 0) - dt;
  if (this._dust >= 7) { this._dust = 0; if (p.hp > 2) { p.hp -= 1; p.hurtFlash = 0.4; UI.sfx('hurt'); } }
  if (this._dustSay <= 0) { this._dustSay = 40; UI.toast(p.hp > 2 ? 'The air here is dust and it is filling your chest. Nobody lasts on Halo without a breather collar. The Moon garrison\'s commander wears one.' : 'You can barely stand. Get back in the Starlark. The breather collar is on the Moon, round Commander Hask\'s neck.', 'bad'); } };
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
  const go = () => {
    const f = document.getElementById('fade'); f.style.opacity = 1; this.paused = true; Controls.setEnabled(false);
    const arrive = () => {
      f.style.opacity = 1; this.paused = true; Controls.setEnabled(false);
      const p = this.player, w = this.world; w.ensureAround(Math.floor(r.x / CH), Math.floor(r.z / CH), 3, 9999);
      p.x = r.x; p.z = r.z; const gy = w.groundY(Math.floor(r.x), Math.floor(r.z)); p.y = Math.max(Number.isFinite(gy) ? gy + 1 : -1, Number.isFinite(r.y) ? r.y : -1, SEA + 1) + 0.05; p.vx = p.vy = p.vz = 0; p.fallStart = null; p.gliding = false; p.frozen = false;
      Village.trainArrive(Village.active); this.meshPass(999); this.paused = false; Controls.setEnabled(true);
      setTimeout(() => { f.style.opacity = 0; UI.toast(r.tide ? `The Current sets you down in ${r.name}, under the glass.` : r.ferry || (Village.active && Village.active.type === 'sea') ? `The ferry ties up at ${r.name}.` : `The train pulls into ${r.name}.`, 'good'); }, 300);
    };
    setTimeout(() => { const byTrain = !r.tide && !r.ferry && r.type !== 'sea' && r.type !== 'deep' && !!Village.trainOf(here); if (byTrain && Roads.holdup(r, f, arrive)) return; arrive(); }, 1100); /* now and then the train does not get there in one go */
  };
  // where a train stands at the platform you ride out on it first; elsewhere (the old stations) the fade alone
  if (!Village.boardTrain(Village.active, go)) { UI.sfx('quest'); go(); }
};
// ---------- save / load ----------
G.save = function () {
  if (!this.running || !this.world) return false;
  try {
    const data = {
      v: 2, kinV: 3, seed: this.baseSeed, worldId: this.worldId, worlds: Object.assign({}, this.worlds, { [this.worldId]: this.captureWorldState() }), player: this.player.serialize(), kin: this.kin.map(KIN.serialize), box: this.box, eggs: this.eggs, activeIdx: this.activeIdx, xp: this.xp,
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
  let cutMoved = 0;
  if (data.kinV === 2) { /* the Kindex was cut to about 150 forms (22 Nov 2026): a Kin of a species that is gone becomes the nearest kept one of its world, wherever the save keeps it
       (party, storage, village guards, the lab, eggs). Level, moves, nickname, gear and bond stay. Fused Kin and the great ones are untouched */
    const walk = (o, d) => { if (!o || typeof o !== 'object' || d > 9) return; if (Array.isArray(o)) { for (const x of o) walk(x, d + 1); return; }
      if (o.sp && typeof o.sp === 'object' && o.sp.seed != null && o.sp.base && o.level != null) { cutMoved += KIN.migrateKin(o); return; }
      for (const k in o) { if (k === 'edits' || k === 'statues' || k === 'regrow') continue; const v = o[k];
        if (k === 'eggs' && Array.isArray(v)) { for (const e of v) if (e && e.seed != null) e.seed = KIN.migrateSeed(e.seed); }
        else if (k === 'egg' && v && v.seed != null) v.seed = KIN.migrateSeed(v.seed);
        else walk(v, d + 1); } };
    try { walk(data, 0); } catch (err) { console.warn('Kin migration: ' + err.message); }
    data.kinV = 3; }
  this.stats = Object.assign(freshStats(), data.stats || {}); this.questState = data.questState || null; this.xp = data.xp || 0; this.trainerLevel = this.trainerLevelFor(this.xp); this.mythicCaught = !!data.mythicCaught; this.shards = data.shards || 0; this.secure = data.secure || {};
  this.thirdPerson = true; /* every game opens looking over your own shoulder */
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
  if (cutMoved) setTimeout(() => UI.toast(`The Kindex is smaller now: about 150 Kin worth knowing. ${cutMoved} of yours became their nearest kin, with their levels and names.`, 'good'), 1800);
  if (data.kinV !== 2 && data.kinV !== 3) { // the Kindex arrived: the old one-of-a-kind Kin are let go, everywhere; a fresh starter takes their place
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
  if (this.filmMood) { Music.update(this.filmMood); return; } /* a film is playing: it has its own music */
  const p = this.player, w = this.world;
  let mood;
  const layer = w.layerAt(Math.floor(p.y), Math.floor(p.x), Math.floor(p.z));
  const bx = Math.floor(p.x), bz = Math.floor(p.z); const biome = w.biomeAt(bx, bz);
  const night = Math.cos(w.time * Math.PI * 2) > 0.17 && !w.preset.flatDay;
  const wet = Weather.state.intensity > 0.4 && (Weather.state.kind === 'rain' || Weather.state.kind === 'storm');
  const va = Village.active; const inVillage = va && Math.hypot(va.x - p.x, va.z - p.z) < 22 && this.villageState[va.id] && this.villageState[va.id].freed;
  const volcanic = biome === BIOME.MOUNTAIN && p.y >= 64 && U.vnoise2(bx, bz, 256, WORLD_W, w.seed + 611) > 0.6;
  const wc = Wild.chaser; const chased = (Camps.active && Camps.active.alarm > 0) || (wc && wc.chase && !(wc.dazed > 0) && Wild.list.includes(wc) && Math.hypot(wc.x - p.x, wc.z - p.z) < 30);
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
// a block you placed yourself inside a town, a farm or a hold stays yours: you can always take it back
G.ownBlock = function (x, y, z, id) { if (!this.protectedAt({ x, y, z, id })) return; const m = this.stats.myBlocks || (this.stats.myBlocks = {}); const ks = Object.keys(m); if (ks.length > 600) delete m[ks[0]]; m[x + ',' + y + ',' + z] = id; };
G.protectedAt = function (hit) {
  { const m = this.stats.myBlocks, key = hit.x + ',' + hit.y + ',' + hit.z; if (m && m[key] != null) { if (m[key] === hit.id) return null; delete m[key]; } }
  if (hit.y <= 4 && hit.y < CORE_TOP && this.world.preset.id === 'earth') return { kind: 'mantle' }; /* the floor of the Core is the rock of the world: nothing cuts it */
  if (hit.id === B.STONE || hit.id === B.DIRT || hit.id === B.SAND) { const v = Village.active, w = this.world; /* and loose stone, earth or sand lying on the ground beside a Fusion Table was dropped there by somebody: it comes up */
    if (v) { let near = false; for (let dx = -3; dx <= 3 && !near; dx++) for (let dz = -3; dz <= 3 && !near; dz++) for (let dy = -2; dy <= 0; dy++) if (w.getBlock(hit.x + dx, hit.y + dy, hit.z + dz) === B.FUSION) { near = true; break; } /* level with the table or above it, never the ground it stands on */ if (near && !Village.railAt(hit.x, hit.y, hit.z)) return null; } }
  if (Village.railAt(hit.x, hit.y, hit.z)) return { kind: 'rail' };
  if (this.worldId !== 'earth') return null; const p = this.player;
  const kind = p.toolKind(hit.id);
  { const fo = (Campaign.sites() || {}).fort, b = fo && fo.bridge; if (b && (this.stats.camp || {}).bridgeFixed && hit.x >= b.x0 - 1 && hit.x <= b.x1 + 1 && Math.abs(hit.z - b.z) <= 2 && Math.abs(hit.y - b.y) <= 2) return { kind: 'bridge' }; }
  for (const k of Keeps.sites()) if (Math.abs(hit.x - k.x) <= 12 && Math.abs(hit.z - k.z) <= 12 && Math.abs(hit.y - k.y) <= 22) { if ((this.stats.holdDeeds || {})[k.id] && Math.abs(hit.x - k.x) <= 7 && Math.abs(hit.z - k.z) <= 7 && hit.z - k.z <= 0 && hit.id !== B.DARKTABLE) return null; return { kind: 'dark' }; }
  { const cs = Citadel.open() ? Citadel.site() : null; if (cs && hit.x >= cs.x - 8 && hit.x <= cs.x + 94 && Math.abs(hit.z - cs.z) <= 19) return { kind: 'dark' }; }
  { const fo = (Campaign.sites() || {}).fort; if (fo && (this.stats.camp || {}).st_fort && hit.x >= fo.x - 18 && hit.x <= fo.x + 78 && Math.abs(hit.z - fo.z) <= 14) return { kind: 'dark' }; }
  for (const f of Farms.sites()) if (Math.abs(hit.x - f.x) <= 13 && Math.abs(hit.z - f.z) <= 13) { if (hit.id === B.CHEST) return null; return { kind: 'farm', f }; }
  const v = Village.active; if (v && !v.founded) { const R = v.type === 'land' ? (v.R || ((this.villageState[v.id] || {}).expanded ? 18 : 12)) + 3 : v.atlantis ? v.RH + 2 : v.type === 'sea' ? 28 : v.style === 'atlantis' ? 22 : 16;
    if (Math.abs(hit.x - v.x) <= R && Math.abs(hit.z - v.z) <= R) { if (Village.ownsPlotAt(v, hit.x, hit.z)) return null; if (kind === 'hand') return null; return { kind: 'town', v }; } }
  return null;
};
G.onProtectedMine = function (pr, hit) {
  const now = performance.now(); if (this.protT && now - this.protT < 5000) return; this.protT = now;
  const p = this.player; const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
  const bring = (n) => { if (!n) return; n.x = p.x - fx * 1.8; n.z = p.z - fz * 1.8; const gy = this.world.groundY(Math.floor(n.x), Math.floor(n.z), Math.floor(p.y) + 2); if (gy != null) n.y = gy + 1; n.yaw = Math.atan2(p.x - n.x, p.z - n.z); if (n.home) n.home = { x: n.x, z: n.z }; this.talkNpc = n; };
  let who = null, lines;
  if (pr.kind === 'mantle') { UI.sfx('miss'); UI.toast('This is the rock the world stands on. No pick will ever mark it.'); return; }
  if (pr.kind === 'rail') { UI.sfx('miss'); UI.toast('Leave the line alone. Take up the track or the bridge under it and the train never runs again.'); return; }
  if (pr.kind === 'bridge') { UI.sfx('miss'); UI.toast('Leave the bridge standing. It is the only way across, and you paid for it.'); return; }
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
  const gf = typeof GLB !== 'undefined' && GLB.faceOf ? GLB.faceOf(npc) : null; /* in a model from a file his face is where the model has it, not where the old shape had it */
  const fx = npc.x, fy = npc.y + (gf != null ? gf : (npc.faceY || 1.5 * ((npc.model && npc.model.scale) || 1))), fz = npc.z, FD = npc.faceD || 2.6; // eye level of a villager, hats and feathers ignored; a tyrant says how tall he is
  let dx = p.x - npc.x, dz = p.z - npc.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
  const sx = -dz, sz = dx; // to the side
  const w = this.world; const free = (x, y, z) => { const b = w.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)); return !isSolid(b) || BLOCKS[b].partial; };
  let cx = fx, cy = fy + 0.15, cz = fz;
  const clear = (x, y, z) => { for (let u = 0.15; u <= 1; u += 0.17) if (!free(fx + (x - fx) * u, fy + (y - fy) * u, fz + (z - fz) * u)) return false; return true; };
  for (let t = 1; t >= 0.25; t -= 0.1) { const x = fx + (dx * FD + sx * FD * 0.38) * t, z = fz + (dz * FD + sz * FD * 0.38) * t; if (free(x, cy, z) && free(x, cy - 0.5, z) && clear(x, cy, z)) { cx = x; cz = z; break; } } // back off until nothing stands between the camera and the face
  if (cx === fx && cz === fz) { for (let t = 1; t >= 0.25; t -= 0.1) { const x = fx + dx * FD * 0.85 * t, z = fz + dz * FD * 0.85 * t; if (free(x, cy, z) && clear(x, cy, z)) { cx = x; cz = z; break; } } } // straight on, if the side is blocked
  const lx = fx - cx, ly = fy - cy, lz = fz - cz; const hd = Math.hypot(lx, lz) || 1;
  const yaw = Math.atan2(-lx, -lz); let pitch = Math.atan2(ly, hd);
  { /* the face goes in the middle of the screen that is left ABOVE the words, not in the middle of the screen: on a phone held sideways the box of words sits right
       across the centre and covered the face of whoever was speaking. Look down by the angle that lifts the face to that spot */
    const el = document.getElementById('dialogue'), H = window.innerHeight || 1, r = el && el.offsetParent !== null ? el.getBoundingClientRect() : null;
    const topY = r && r.height > 0 ? r.top : H * 0.62, want = U.clamp(topY * 0.5, H * 0.16, H * 0.5), ndc = 1 - 2 * want / H;
    pitch -= Math.atan(ndc * Math.tan(55 * Math.PI / 360)); }
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
