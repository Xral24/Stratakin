'use strict';
// Items, inventory and first-person player physics / block interaction.
const ELEMENTS = ['Flame', 'Tide', 'Bloom', 'Stone', 'Gale', 'Frost', 'Spark', 'Void', 'Light'];
const ELEM_COLOR = { Flame: '#ff7a2a', Tide: '#3aa0ff', Bloom: '#5fd04a', Stone: '#b0906a', Gale: '#bfe8ff', Frost: '#9fe6ff', Spark: '#ffe34a', Void: '#a65cff', Light: '#fff1a8' };

const ITEMS = {
  wood: { name: 'Wood', block: B.LOG, col: '#8a6a3c', desc: 'Logs from trees. Builds and crafts.' },
  stone: { name: 'Stone', block: B.STONE, col: '#8d8d93', desc: 'Plain stone. Place it to build.' },
  dirt: { name: 'Dirt', block: B.DIRT, col: '#7a5536', desc: 'Dirt. Cheap building block.' },
  sand: { name: 'Sand', block: B.SAND, col: '#dccb8e', desc: 'Beach sand.' },
  gravel: { name: 'Gravel', block: B.GRAVEL, col: '#7d7872', desc: 'Loose gravel.' },
  snow: { name: 'Snow', block: B.SNOW, col: '#eef3f8', elem: 'Frost', desc: 'Packed snow. Frost ingredient at the Fusion Table.' },
  basalt: { name: 'Basalt', block: B.BASALT, col: '#45404a', desc: 'Dark stone from the deep.' },
  cloud: { name: 'Cloudstone', block: B.CLOUD, col: '#e9ecf6', elem: 'Light', desc: 'Stone from the sky islands. Light ingredient.' },
  frond: { name: 'Frond', col: '#3f8a33', elem: 'Bloom', desc: 'Leaves and fibres. Bloom ingredient.' },
  planks: { name: 'Planks', block: B.PLANKS, col: '#b58d58', desc: 'Building planks.' },
  glass: { name: 'Glass', block: B.GLASS, col: '#cfe9f5', crafted: true, desc: 'Sand melted with ember. See-through: windows.' },
  ironwall: { name: 'Iron Wall', block: B.IRONWALL, col: '#8f98a6', crafted: true, desc: 'Riveted iron. Raiders hate it. Wall blocks for a village you found.' },
  voidwall: { name: 'Voidsteel Wall', block: B.VOIDWALL, col: '#5a3f8a', crafted: true, desc: 'Iron quenched in void crystal. The strongest wall there is, and it glows.' },
  door: { name: 'Door', block: B.DOOR, col: '#9a7646', crafted: true, desc: 'Tap to open or shut. Shut doors count as wall; raiders have to break them.' },
  kit_house: { name: 'House kit', kit: 'house', col: '#b58d58', crafted: true, desc: 'A whole plank house with windows and a door. Tap flat ground a few steps away.' },
  kit_bakery: { name: 'Bakery kit', kit: 'bakery', col: '#ff6a2a', crafted: true, desc: 'A bakery, Ember sign over the door. Counts toward a village of your own.' },
  kit_juice: { name: 'Juice Bar kit', kit: 'juice', col: '#c8334a', crafted: true, desc: 'A juice bar, Berry sign over the door. Counts toward a village of your own.' },
  kit_trader: { name: 'Trader kit', kit: 'trader', col: '#c98a4f', crafted: true, desc: 'A trader\'s shop, Copper sign over the door.' },
  kit_voodoo: { name: 'Voodoo Hut kit', kit: 'voodoo', col: '#9a4de0', crafted: true, desc: 'A healer\'s hut, Void sign over the door. Mama Oyé wakes fainted Kin.' },
  kit_post: { name: 'Trading Post kit', kit: 'post', col: '#b5a79a', crafted: true, desc: 'A trading post, Iron sign over the door. Rotating stock from travellers.' },
  kit_wall: { name: 'Wall kit (wood)', kit: 'wall', wallBlock: B.PLANKS, col: '#a67f4e', crafted: true, desc: 'Seven blocks of two-high plank wall, across your view where you tap.' },
  kit_wall_stone: { name: 'Wall kit (stone)', kit: 'wall', wallBlock: B.STONE, col: '#979aa0', crafted: true, desc: 'Seven blocks of two-high stone wall. Raiders take longer on it.' },
  kit_wall_iron: { name: 'Wall kit (iron)', kit: 'wall', wallBlock: B.IRONWALL, col: '#8f98a6', crafted: true, desc: 'Seven blocks of two-high iron wall. Raiders take all night on it.' },
  kit_portal: { name: 'Portal kit', kit: 'portal', col: '#7ad7ff', crafted: true, desc: 'A portal arch. Placed in a village you hold, it joins the portal network.' },
  reel: { name: 'Reel', col: '#8f98a6', keep: true, desc: 'Old Brannock\'s spare reel. Three wood and two fronds make a fishing rod of it.' },
  rod: { name: 'Fishing Rod', col: '#8a6a3c', crafted: true, keep: true, rod: 1, desc: 'Hold it, face the water, tap to cast. Tap again when the marker is in the glow.' },
  rod_iron: { name: 'Iron Rod', col: '#b5a79a', crafted: true, keep: true, rod: 2, desc: 'A stiffer rod: rarer fish, a wider catch zone.' },
  rod_void: { name: 'Void Rod', col: '#9a4de0', crafted: true, keep: true, rod: 3, desc: 'Strung with void. The biggest things in the deep take it.' },
  tonic_hush: { name: 'Hush Tonic', col: '#9fb8c8', use: 'self', crafted: true, desc: 'Drink it and the ordinary wild Kin leave you alone for four minutes: none spawn, none follow. Tyrants, their guards and raiders still come.' },
  bait_berry: { name: 'Berry Bait', col: '#c8334a', crafted: true, desc: 'Used up on a cast. Uncommon fish bite more.' },
  bait_glow: { name: 'Glow Bait', col: '#d8ff6a', crafted: true, desc: 'Used up on a cast. Rare fish come to the light.' },
  bait_void: { name: 'Void Bait', col: '#9a4de0', crafted: true, desc: 'Used up on a cast. Epic and legendary fish answer it.' },
  bow: { name: 'Bow', col: '#8a5a2c', keep: true, bow: true, desc: 'The castle-builder\'s bow. Hold it and tap a Kin up to 40 blocks away: each arrow takes a big bite out of its health before the fight starts. Uses arrows.' },
  arrow: { name: 'Arrow', col: '#c9b48a', arrow: 0.22, crafted: true, desc: 'Takes about a fifth of a wild Kin\'s health. Twice that if it never saw you. Needs a bow.' },
  arrow_ember: { name: 'Ember Arrow', col: '#ff7a3a', arrow: 0.34, crafted: true, desc: 'Burns. Takes about a third of a wild Kin\'s health. Needs a bow.' },
  target: { name: 'Target', block: B.TARGET, col: '#e04040', crafted: true, desc: 'A bullseye. Set a few up and shoot at them from a distance. Archery jobs ask for them.' },
  broth: { name: 'Warm Broth', col: '#d8903a', use: 'warm', desc: 'From Ysolde. Drink it and the cold cannot touch you for four minutes. Campfires warm you too.' },
  mapA: { name: 'Half a Map', col: '#c9a46a', keep: true, desc: 'Torn, with lines on it that mean nothing yet. Someone else has the other half.' },
  mapB: { name: 'Half a Map', col: '#b8945a', keep: true, desc: 'Torn, with lines on it that mean nothing yet. Someone else has the other half.' },
  ladder: { name: 'Ladder', block: B.LADDER, col: '#a07a44', crafted: true, desc: 'Place it against a wall and climb: ▲ or push forward to go up, hold ▼ to go down. Stack them for a shaft.' },
  chest: { name: 'Chest', block: B.CHEST, col: '#a0783c', crafted: true, desc: 'Place it and tap it: whatever you store inside stays there, safe, even if the wild beats you. Build as many as you like.' },
  kit_bridge: { name: 'Bridge kit', kit: 'bridge', col: '#b58d58', crafted: true, desc: 'A plank bridge with rails, from where you tap straight ahead until it meets ground, up to twelve blocks.' },
  claw: { name: 'Claw Band', kinGear: 'weapon', boost: { atk: 0.12 }, col: '#c9a84c', crafted: true, desc: 'Kin weapon: Attack +12%.' },
  fang: { name: 'Spark Fang', kinGear: 'weapon', boost: { atk: 0.08, spd: 0.08 }, col: '#ffe34a', crafted: true, desc: 'Kin weapon: Attack +8%, Speed +8%.' },
  voidfang: { name: 'Void Fang', kinGear: 'weapon', boost: { atk: 0.15, pow: 0.1 }, col: '#9a4de0', crafted: true, desc: 'Kin weapon: Attack +15%, Power +10%.' },
  vest: { name: 'Scale Vest', kinGear: 'armor', boost: { hp: 0.15 }, col: '#8fb08a', crafted: true, desc: 'Kin armour: Health +15%.' },
  plate: { name: 'Basalt Plate', kinGear: 'armor', boost: { hp: 0.1, atk: 0.05 }, col: '#45404a', crafted: true, desc: 'Kin armour: Health +10%, Attack +5%.' },
  mantle: { name: 'Void Mantle', kinGear: 'armor', boost: { hp: 0.2, pow: 0.08 }, col: '#5a3f8a', crafted: true, desc: 'Kin armour: Health +20%, Power +8%.' },
  windcharm: { name: 'Wind Charm', kinGear: 'charm', boost: { spd: 0.15, agi: 0.05 }, col: '#e9ecf6', crafted: true, desc: 'Kin charm: Speed +15%, Agility +5%.' },
  lens: { name: 'Focus Lens', kinGear: 'charm', boost: { pow: 0.15 }, col: '#cfe9f5', crafted: true, desc: 'Kin charm: Power +15%.' },
  emberheart: { name: 'Ember Heart', kinGear: 'charm', boost: { atk: 0.06, pow: 0.06, hp: 0.06 }, col: '#ff6a2a', crafted: true, desc: 'Kin charm: Attack, Power and Health +6%.' },
  // the Moon
  selenite: { name: 'Selenite', col: '#dff4ff', elem: 'Light', desc: 'Pale crystal from the Moon\'s rock. Glows a little. Light ingredient; melts with glass into selenite glass.' },
  tycho: { name: 'Tycho Ore', col: '#9fb4d0', elem: 'Stone', desc: 'Blue-grey metal from under the Moon\'s highlands. Harder than iron.' },
  starsalt: { name: 'Starsalt', col: '#5ef0e0', elem: 'Frost', desc: 'A teal crust from the crater floors. The aliens drink it.' },
  moonlamp: { name: 'Moonglow Lamp', block: B.MOONGLOW, col: '#b8ff6a', crafted: true, desc: 'The aliens\' light: a block that glows green-white. Works anywhere, air or none.' },
  selglass: { name: 'Selenite Glass', block: B.SELGLASS, col: '#dff4ff', crafted: true, desc: 'Glass with selenite melted through it: see-through, faintly bright, and the stuff of Moon Domes.' },
  kit_dome: { name: 'Moon Dome kit', kit: 'dome', col: '#7ad7ff', crafted: true, desc: 'Raises a dome of selenite glass over a land village you hold. Nothing gets in: no raiders, no tyrant, ever. Use it from the headman\'s ledger or tap the ground inside the village.' },
  lunarplate: { name: 'Lunar Plate', kinGear: 'armor', boost: { hp: 0.25, pow: 0.1 }, col: '#9fb4d0', crafted: true, desc: 'Kin armour of tycho: Health +25%, Power +10%.' },
  tychofang: { name: 'Tycho Fang', kinGear: 'weapon', boost: { atk: 0.22, spd: 0.06 }, col: '#9fb4d0', crafted: true, desc: 'Kin weapon: Attack +22%, Speed +6%.' },
  starcharm: { name: 'Starsalt Charm', kinGear: 'charm', boost: { hp: 0.08, atk: 0.08, pow: 0.08, spd: 0.08, agi: 0.08 }, col: '#5ef0e0', crafted: true, desc: 'Kin charm: everything +8%.' },
  // Halo
  amber: { name: 'Amber', col: '#e8b85a', elem: 'Flame', desc: 'Warm golden resin-stone from under Halo\'s dunes. Flame ingredient.' },
  sulfur: { name: 'Sulfur', col: '#e8d84a', elem: 'Spark', desc: 'Yellow crust from Halo\'s salt flats. Burns. Spark ingredient.' },
  ringshard: { name: 'Ring Shard', col: '#fff0c0', elem: 'Light', desc: 'A piece of Halo\'s ring, fallen from the sky. Light that you can hold.' },
  wings: { name: 'Halo Wings', col: '#fff0c0', gear: true, keep: true, desc: 'Wings of ring shard and amber. Jump in the air to open them: hold ▲ to climb, hold ▼ to come down, let go and you hang still. They fly where nothing else does: in caves, over the lava of the Core, on the airless Moon and Halo. Silent: wild Kin, warriors and camps do not notice you overhead. About a minute of flight, then land and let them rest.' },
  amberheart: { name: 'Amber Heart', kinGear: 'charm', boost: { pow: 0.18, hp: 0.06 }, col: '#e8b85a', crafted: true, desc: 'Kin charm: Power +18%, Health +6%.' },
  sulfurfang: { name: 'Sulfur Fang', kinGear: 'weapon', boost: { atk: 0.18, pow: 0.12 }, col: '#e8d84a', crafted: true, desc: 'Kin weapon: Attack +18%, Power +12%.' },
  ringplate: { name: 'Ring Plate', kinGear: 'armor', boost: { hp: 0.3, atk: 0.1 }, col: '#fff0c0', crafted: true, desc: 'Kin armour of ring shard: Health +30%, Attack +10%.' },
  // the sea floor, and treasure
  coral: { name: 'Coral', col: '#ff5a6a', elem: 'Tide', desc: 'Branches of coral from the sea floor. Tide ingredient; the sea people trade in it.' },
  pearl: { name: 'Pearl', col: '#fff6ff', elem: 'Light', desc: 'From the pearl coral deep in the reefs. Worth a lot to the right trader.' },
  coralcrown: { name: 'Coral Crown', kinGear: 'charm', boost: { pow: 0.1, agi: 0.1 }, col: '#ff5a6a', crafted: true, desc: 'Kin charm: Power +10%, Agility +10%.' },
  reeffins: { name: 'Reef Fins', col: '#4a7aff', gear: true, desc: 'You swim nearly twice as fast and your air lasts twice as long.' },
  gold: { name: 'Gold', col: '#ffd040', elem: 'Light', desc: 'Gold. The traders pay well, and it charms Kin.' },
  diamond: { name: 'Diamond', col: '#9ff6ff', elem: 'Frost', desc: 'The hardest, clearest thing there is. Makes the best fang and the best pick.' },
  diamondfang: { name: 'Diamond Fang', kinGear: 'weapon', boost: { atk: 0.3, spd: 0.05 }, col: '#9ff6ff', crafted: true, desc: 'Kin weapon: Attack +30%, Speed +5%.' },
  goldcharm: { name: 'Gold Charm', kinGear: 'charm', boost: { hp: 0.1, atk: 0.1, pow: 0.1, spd: 0.1, agi: 0.1 }, col: '#ffd040', crafted: true, desc: 'Kin charm: everything +10%.' },
  pick: { name: 'Diamond Pick', col: '#9ff6ff', gear: true, desc: 'You mine twice as fast, through anything.' },
  shovel: { name: 'Shovel', col: '#b08850', gear: true, keep: true, desc: 'From the village you freed. Digs grass, dirt, sand, gravel and snow. Without it your hands can only pick plants, berries and leaves.' },
  hatchet: { name: 'Hatchet', col: '#a07040', gear: true, keep: true, desc: 'From the village you freed. Chops logs and planks. An iron axe from Foreman Garrick cuts twice as fast.' },
  axe_iron: { name: 'Iron Axe', col: '#d0c8b8', gear: true, keep: true, desc: 'From Foreman Garrick, with the iron pick. Logs and planks come down twice as fast as with the hatchet.' },
  pick_stone: { name: 'Stone Pick', col: '#9a9a9a', gear: true, keep: true, desc: 'From Foreman Garrick. Stone gives way to it; copper, iron and ember ore slowly. Void, gold and diamond barely at all.' },
  pick_iron: { name: 'Iron Pick', col: '#d8d0c0', gear: true, keep: true, desc: 'From Foreman Garrick. Breaks everything on Earth, void crystal, gold and diamond included.' },
  berry: { name: 'Berries', col: '#c8334a', desc: 'Sweet and red. Tonics come from them, and bushes grow back.' },
  glowworm: { name: 'Glowworm', col: '#d8ff6a', elem: 'Light', desc: 'A fat little worm that glows in the grass at night. One worm and one wood make four torches.' },
  draught: { name: 'Sage\'s Draught', col: '#b07aff', use: 'tech', keep: false, desc: 'Cannot be made, only won. Give it to your lead Kin and it forgets its fourth move and learns any technique you choose, from any element.' },
  bread: { name: 'Bread', col: '#d9a65b', use: 'player', desc: 'Restores all your health.' },
  smoothie: { name: 'Smoothie', col: '#ff8fb8', use: 'party', desc: 'Every Kin recovers half its health.' },
  tonic_heal: { name: 'Heal Tonic', col: '#ff5f7a', use: 'kin', desc: 'One Kin recovers 60% of its health. Does not wake a fainted Kin.' },
  tonic_revive: { name: 'Revive Tonic', col: '#ffd0f0', use: 'kin', desc: 'Wakes a fainted Kin with half its health.' },
  tonic_vigor: { name: 'Vigor Tonic', col: '#5fd06a', use: 'kin', stat: 'hp', desc: 'Permanently raises one Kin\'s Health by 5% (up to +25%).' },
  tonic_might: { name: 'Might Tonic', col: '#ff8a3a', use: 'kin', stat: 'atk', desc: 'Permanently raises one Kin\'s Attack by 5% (up to +25%).' },
  tonic_swift: { name: 'Swift Tonic', col: '#ffe34a', use: 'kin', stat: 'spd', desc: 'Permanently raises one Kin\'s Speed by 5% (up to +25%).' },
  copper: { name: 'Copper', col: '#c98a4f', elem: 'Spark', desc: 'Copper ore. Spark ingredient.' },
  iron: { name: 'Iron', col: '#b5a79a', elem: 'Stone', desc: 'Iron ore. Stone ingredient.' },
  ember: { name: 'Ember Ore', col: '#ff6a2a', elem: 'Flame', desc: 'Warm glowing ore. Flame ingredient, fuels torches.' },
  void: { name: 'Void Crystal', col: '#9a4de0', elem: 'Void', desc: 'Deep crystal (below y 22). Void ingredient.' },
  torch: { name: 'Torch', block: B.TORCH, col: '#ffd36a', light: true, crafted: true, desc: 'Hold it to see in the dark, or place it.' },
  fusion: { name: 'Fusion Table', block: B.FUSION, col: '#7ad7ff', crafted: true, desc: 'Place it, then tap it to fuse Kin.' },
  snare: { name: 'Snare Cube', col: '#7fe0c0', snare: 0.40, desc: 'Unfolds into a crystal cage. Weaken a Kin first.' },
  deepchart: { name: 'The Deep Chart', col: '#6a4a8a', keep: true, desc: 'An old miner\'s chart of the Core. It marks where to dig down to the twelfth Hold, out on the lava, and one older mark further on: the Heart, the Starmetal chamber where something enormous sleeps. Your compass follows it.' },
  painted_piece: { name: 'Indian Cloth', col: '#c96a3a', keep: true, desc: 'A strip of painted cloth from an Indian camp. One of the pieces of something. Somebody in a town might know what.' },
  painted_cloak: { name: 'Indian Cloak', col: '#c9643a', gear: true, keep: true, desc: 'Stitched by Zazu from a piece out of every Indian camp. Walk into a camp in broad daylight and nobody looks twice, for a few minutes. Take their hoard and try to leave, and someone will ask who you are.' },
  snare_sky: { name: 'Flight Snare', col: '#9fd8ff', snare: 0.55, desc: 'A light cage on a long cord, for the birds that never come down. Only works thrown from the air: off the glider or the back of a flier. Tap the bird as you pass.' },
  feather: { name: 'Sky Feather', col: '#e8f4ff', desc: 'Shed by the high flyers. Shoot one with the bow, or beat one, and feathers come down.' },
  snare2: { name: 'Void Snare', col: '#c07fe0', snare: 0.66, desc: 'A stronger snare laced with void crystal.' },
  bulb: { name: 'Breathing Bulb', col: '#9fd8ff', gear: true, desc: 'Breathe underwater for two minutes.' },
  glider: { name: 'Glider', col: '#f0d090', gear: true, desc: 'Hold ▲ while falling to glide. Stick sideways turns, forward dives, back brakes. Pull back just before the ground to flare and land soft.' },
  lavasuit: { name: 'Lava Suit', col: '#ff9050', gear: true, desc: 'Keeps the heat of the Core off you. Without it the heat down there wears you down, the way the cold does on the peaks. It does not make lava safe: nothing does. Stay out of it.' },
  voidshard: { name: 'Void Shard', col: '#8a4ad8', gear: true, desc: 'A splinter of the Kinmaster\'s own table. Carry it and every Fusion Table you stand at takes dark materials: Void Crystal, Void Essence and Void Stones.' },
  frostcloak: { name: 'Frost Cloak', col: '#bfe3ff', gear: true, desc: 'Keeps the cold out. Without it, snowfields and mountain tops slow you, then freeze you.' },
  spacesuit: { name: 'Space Suit', col: '#e8f0ff', gear: true, desc: 'Air and warmth beyond the sky. Without it the Moon freezes you in moments.' },
  ship: { name: 'Starlark', col: '#c7fbff', gear: true, desc: 'Professor Finch\'s prototype, finished at Garrick\'s forge. Tap it on the surface to board; hold ▲ to climb, hold ▼ to go down. Climb above the clouds to leave the world.' },
};
for (const e of ELEMENTS) ITEMS['ess_' + e] = { name: e + ' Essence', col: ELEM_COLOR[e], elem: e, desc: 'Left behind by ' + e + ' Kin. Three of them and an iron make a ' + e + ' Stone.' };
for (const e of ELEMENTS) ITEMS['stone_' + e] = { name: e + ' Stone', col: ELEM_COLOR[e], crafted: true, desc: 'A fusion stone. A fusion recipe needs its two Kin and the right stone, together on the table.' };
for (const e of ELEMENTS) ITEMS['lure_' + e] = { name: e + ' Lure', col: ELEM_COLOR[e], use: 'self', lure: e, crafted: true, desc: 'Drink it and ' + e + ' Kin come to you for four minutes, twice as often and far more of them.' };
const HOTBAR_ORDER = ['torch', 'snare', 'snare2', 'snare_sky', 'bread', 'smoothie', 'tonic_revive', 'tonic_heal', 'tonic_vigor', 'tonic_might', 'tonic_swift', 'wood', 'planks', 'glass', 'door', 'ladder', 'chest', 'ironwall', 'voidwall', 'kit_house', 'kit_bakery', 'kit_juice', 'kit_trader', 'kit_voodoo', 'kit_post', 'kit_wall', 'kit_wall_stone', 'kit_wall_iron', 'kit_bridge', 'kit_portal', 'kit_dome', 'rod', 'rod_iron', 'rod_void', 'tonic_hush', 'moonlamp', 'selglass', 'stone', 'dirt', 'sand', 'gravel', 'snow', 'basalt', 'cloud', 'fusion', 'berry', 'glowworm', 'frond', 'copper', 'iron', 'ember', 'void', 'selenite', 'tycho', 'starsalt', 'amber', 'sulfur', 'ringshard', 'coral', 'pearl', 'gold', 'diamond', ...ELEMENTS.map(e => 'ess_' + e), 'bulb', 'glider', 'lavasuit'];

class Player {
  constructor(world) {
    this.world = world;
    this.x = 0; this.y = 0; this.z = 0; this.vx = 0; this.vy = 0; this.vz = 0;
    this.yaw = 0; this.pitch = 0;
    this.onGround = false; this.inWater = false; this.inLava = false; this.underwater = false; this.gliding = false;
    this.hp = 10; this.maxHp = 10; this.breath = 1; this.hurtFlash = 0;
    this.inv = new Map(); this.objects = []; this.gearPower = {}; this.sel = 0; this.sneak = false; this.autoJump = false;
    this.mineTarget = null; this.mineProgress = 0; this.fallStart = null;
    this.W = 0.3; this.H = 1.8; this.EYE = 1.62;
    this.mount = null; this.flying = false; this.gravity = 1; this.frozen = false; this.lavaTick = 0; this.speedMul = 1; this.mineMul = 1; this.breathMul = 1; this.jumpMul = 1; this.lavaMul = 1; this.autoJumpTrait = false; this.senseMul = 1;
  }
  // ---- inventory ----
  add(item, n = 1) { this.inv.set(item, (this.inv.get(item) || 0) + n); }
  count(item) { return this.inv.get(item) || 0; }
  has(item, n = 1) { return this.count(item) >= n; }
  take(item, n = 1) { const c = this.count(item); if (c < n) return false; if (c - n <= 0) this.inv.delete(item); else this.inv.set(item, c - n); return true; }
  hotbar() { return HOTBAR_ORDER.filter(k => this.count(k) > 0 && !ITEMS[k].gear).concat(this.objects.map(o => 'obj:' + o.id)); }
  // display info for an inventory key (plain item or unique object)
  itemInfo(key) {
    if (key && key.startsWith('obj:')) { const o = this.objects.find(x => 'obj:' + x.id === key); return o ? { name: o.name, col: o.col, block: B.STATUE, obj: o, desc: o.desc } : { name: '?', col: '#888' }; }
    return ITEMS[key];
  }
  countKey(key) { return key && key.startsWith('obj:') ? 1 : this.count(key); }
  selected() { const hb = this.hotbar(); if (!hb.length) return null; this.sel = U.clamp(this.sel, 0, hb.length - 1); return hb[this.sel]; }
  holdingTorch() { return this.selected() === 'torch'; }

  gearMul(item) { const g = this.gearPower[item]; return g ? g.power : 1; }
  // ---- physics ----
  solidAt(x, y, z) { return isSolid(this.world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z))); }
  collides(x, y, z) {
    const w = this.W;
    for (let bx = Math.floor(x - w); bx <= Math.floor(x + w); bx++)
      for (let bz = Math.floor(z - w); bz <= Math.floor(z + w); bz++)
        for (let by = Math.floor(y); by <= Math.floor(y + this.H - 0.001); by++)
          if (isSolid(this.world.getBlock(bx, by, bz))) return true;
    return false;
  }
  blockInBody(id) {
    const w = this.W;
    for (let bx = Math.floor(this.x - w); bx <= Math.floor(this.x + w); bx++)
      for (let bz = Math.floor(this.z - w); bz <= Math.floor(this.z + w); bz++)
        for (let by = Math.floor(this.y); by <= Math.floor(this.y + this.H - 0.001); by++)
          if (this.world.getBlock(bx, by, bz) === id) return true;
    return false;
  }
  moveAxis(axis, amt) {
    const step = 0.08;
    let remaining = amt;
    while (Math.abs(remaining) > 1e-6) {
      const d = Math.abs(remaining) > step ? Math.sign(remaining) * step : remaining;
      const nx = this.x + (axis === 0 ? d : 0), ny = this.y + (axis === 1 ? d : 0), nz = this.z + (axis === 2 ? d : 0);
      if (this.collides(nx, ny, nz)) return true;
      this.x = nx; this.y = ny; this.z = nz; remaining -= d;
    }
    return false;
  }
  update(dt, input) {
    if (this.frozen) return;
    const w = this.world;
    if (this.flying) { this.updateFlight(dt, input); return; }
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    const feet = w.getBlock(Math.floor(this.x), Math.floor(this.y + 0.3), Math.floor(this.z));
    const eye = w.getBlock(Math.floor(this.x), Math.floor(this.y + this.EYE), Math.floor(this.z));
    this.inWater = this.blockInBody(B.WATER) || this.blockInBody(B.BRINE);
    this.inLava = this.blockInBody(B.LAVA);
    this.inBrine = this.blockInBody(B.BRINE);
    this.underwater = eye === B.WATER || eye === B.BRINE;
    const inFluid = this.inWater || this.inLava;
    // movement intent
    const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
    const fwd = [-sy, -cy], right = [cy, -sy];
    let mx = fwd[0] * input.mz + right[0] * input.mx, mz = fwd[1] * input.mz + right[1] * input.mx;
    const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
    this.sneak = !!input.sneak;
    let speed = (this.sneak ? 1.7 : 4.4) * this.speedMul * (typeof G !== 'undefined' && G.buffMul ? G.buffMul('speed') : 1) * (1 - 0.55 * (this.chill || 0));
    if (this.inLava) speed = 1.2; else if (this.inWater) speed = 2.6 * (this.has('reeffins') ? 1.8 : 1);
    const mountShape = this.mount ? (this.mountMode || 'land') : null; // 'land' | 'water' | 'air'
    const ride = this.mount ? 1 + 0.3 * (this.mount.trust || 0) : 1; // trust: two hours under you to full stride; it fades if you leave it alone
    if (mountShape === 'land' && !inFluid) speed *= (this.mount.sp.fast ? 3.2 : 1.8) * ride;
    else if (mountShape === 'water' && this.inWater) speed = 6.5 * ride;
    else if (mountShape === 'air' && !inFluid) speed *= 1.3;
    if (this.blocking && typeof Combat !== 'undefined') { const sh = Combat.shield(); if (sh) speed *= sh.slow; }
    // gliding
    const wasGliding = this.gliding && !this.wingsOn;
    this.gliding = false;
    const birdFly = mountShape === 'air' && (this.mount.level >= 20 || this.mount.tamed);
    // Halo Wings: a jump in the air opens them, and then you fly like a bird mount
    // about a minute of flight, then they need to rest: they recharge on the ground, twice as fast as they drain
    if (this.wingE == null) this.wingE = 60;
    if (this.has('wings') && !inFluid && !this.onGround && !mountShape && input.jumpPressed && !this.wingsOn && this.vy < 2) { if (this.wingE > 3) this.wingsOn = true; else if (typeof UI !== 'undefined') UI.toast('Your wings are spent. Land and let them rest.'); }
    if (this.wingsOn) { this.wingE -= dt; if (this.wingE <= 10 && this.wingE + dt > 10 && typeof UI !== 'undefined') UI.toast('Ten seconds of wing left. Find somewhere to land.', 'bad'); if (this.wingE <= 0) { this.wingE = 0; this.wingsOn = false; if (typeof UI !== 'undefined') UI.toast('Your wings fold. You drop.', 'bad'); } }
    else if (this.onGround) this.wingE = Math.min(60, this.wingE + dt * 2);
    if (this.onGround || inFluid || mountShape) this.wingsOn = false;
    if (!inFluid && !this.onGround && (birdFly || this.wingsOn)) {
      // a flying mount: jump climbs, sneak descends, neither hovers; the stick steers in every direction and landing is soft
      this.gliding = true; this.fallStart = null;
      const ty = input.jump ? 3.2 : input.sneak ? -3.6 : this.wingsOn ? 0 : -0.5; // wings hang still in the air; a bird drifts down
      this.vy += (ty - this.vy) * Math.min(1, 6 * dt);
      const accel = 8; this.vx += (mx * speed - this.vx) * Math.min(1, accel * dt); this.vz += (mz * speed - this.vz) * Math.min(1, accel * dt);
    }
    else if (!inFluid && !this.onGround && (this.vy < -1 || wasGliding) && (input.jump || mountShape === 'air') && (this.has('glider') || mountShape === 'air')) {
      // the glider: the stick steers left and right, forward dives for speed, back brakes and flares; the wind carries you
      this.gliding = true; this.fallStart = null;
      const gm = mountShape === 'air' ? 1 : this.gearMul('glider');
      if (!wasGliding) { this.glideS = Math.max(5.5, Math.min(9, Math.hypot(this.vx, this.vz))); this.vy = Math.max(this.vy, -3); }
      this.yaw -= input.mx * 1.3 * dt;
      const fy = Math.sin(this.yaw), fc = Math.cos(this.yaw);
      const dive = Math.max(0, input.mz), brake = Math.max(0, -input.mz);
      const cruise = 7.5 * gm, top = 14.5 * gm;
      const target = dive > 0.05 ? cruise + (top - cruise) * dive : brake > 0.05 ? cruise + (2.4 - cruise) * brake : cruise;
      const rate = dive > 0.05 ? 6.5 : brake > 0.05 ? 7.5 : 2.2;
      let sp = this.glideS || cruise; sp += U.clamp(target - sp, -rate * dt, rate * dt); this.glideS = sp;
      let sink = 1.55 / Math.sqrt(gm) + 4.2 * dive;
      sink -= brake * U.clamp((sp - 4) / 5, 0, 1) * 3.3; // the flare: speed traded for lift, only while you have speed to trade
      if (sp < 3.8) sink += (3.8 - sp) * 2.4; // too slow: she stalls and drops
      this.vy += (-sink - this.vy) * Math.min(1, 4 * dt);
      const wd = typeof Weather !== 'undefined' && Weather.wind ? Weather.wind(this.x, this.y, this.z) : { x: 0, z: 0 };
      this.vx = -fy * sp + wd.x; this.vz = -fc * sp + wd.z;
      this.glideImpact = { s: sp, vy: this.vy };
    } else {
      const accel = this.onGround || inFluid ? 14 : 5;
      this.vx += (mx * speed - this.vx) * Math.min(1, accel * dt);
      this.vz += (mz * speed - this.vz) * Math.min(1, accel * dt);
    }
    this.glideT = this.gliding ? 0.6 : Math.max(0, (this.glideT || 0) - dt);
    // vertical
    if (inFluid) {
      this.vy += -6 * dt;
      if (input.jump) this.vy += 18 * dt;
      if (mountShape === 'water' && this.inWater && !input.sneak && this.underwater) this.vy += 22 * dt; // floats like a boat
      this.vy = U.clamp(this.vy, -3, 3.2);
      this.fallStart = null;
    } else {
      const ladder = this.blockInBody(B.LADDER);
      if (ladder) { // climb: jump or push forward goes up, sneak goes down, let go and you hold on
        const up = input.jump || input.mz > 0.3; this.vy = up ? 3.4 : input.sneak ? -3 : 0; this.fallStart = null; this.onGround = false;
      } else if (!this.gliding) this.vy -= 25 * this.gravity * dt;
      if (this.vy < -40) this.vy = -40;
      if (input.jumpPressed && this.onGround) { this.vy = 8.4 * this.jumpMul * (mountShape === 'quadruped' ? 1.25 : 1) * (this.mount && this.mount.sp.climber && mountShape === 'land' ? 1.45 : 1); this.onGround = false; }
      if (!this.onGround && this.vy < 0 && this.fallStart == null) this.fallStart = this.y;
    }
    // integrate
    const hitX = this.moveAxis(0, this.vx * dt);
    const hitZ = this.moveAxis(2, this.vz * dt);
    if ((hitX || hitZ) && this.inWater && ml > 0.3) {
      // climb out of the water onto the bank
      const ahead = [this.x + mx * 0.7, this.y, this.z + mz * 0.7];
      if (this.collides(ahead[0], this.y + 0.1, ahead[2])) { if (!this.collides(ahead[0], this.y + 1.05, ahead[2])) this.vy = 6.5; else if (!this.collides(ahead[0], this.y + 1.75, ahead[2])) this.vy = 8; } // a ledge up to a block above the water: haul yourself up
    }
    if ((hitX || hitZ) && this.onGround && !this.sneak && ml > 0.2 && !this.mount) {
      const ax = this.x + mx * 0.55, az = this.z + mz * 0.55, fy = Math.floor(this.y + 0.01);
      const b = w.getBlock(Math.floor(ax), fy, Math.floor(az));
      if (R.isSoil(b) && w.getBlock(Math.floor(ax), fy + 1, Math.floor(az)) !== undefined && !this.collides(this.x, fy + 1.02, this.z) && !this.collides(ax, fy + 1.02, az)) {
        this.y = fy + 1.001; this.stepLag = Math.min(1.2, (this.stepLag || 0) + 1); this.vy = 0; // the camera eases up over a moment instead of popping
        if (hitX) this.moveAxis(0, this.vx * dt); if (hitZ) this.moveAxis(2, this.vz * dt);
      }
    }
    if ((hitX || hitZ) && this.onGround && (this.autoJump || this.autoJumpTrait) && !this.sneak && ml > 0.3) {
      // auto jump over one-block steps
      const ahead = [this.x + mx * 0.7, this.y, this.z + mz * 0.7];
      if (this.collides(ahead[0], this.y, ahead[2]) && !this.collides(ahead[0], this.y + 1.05, ahead[2])) { this.vy = 8.0; this.onGround = false; }
    }
    if (hitX) this.vx = 0; if (hitZ) this.vz = 0;
    { let want = 0; this.slopeK = 0; if (this.onGround && !this.inWater) { const below = w.getBlock(Math.floor(this.x), Math.floor(this.y - 0.05), Math.floor(this.z)); if (R.isSoil(below)) { let s = R.surfaceAt(w, this.x, this.z); if (s != null) { let lo = s; for (const [ox, oz] of [[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]]) { const t = R.surfaceAt(w, this.x + ox, this.z + oz); if (t == null) continue; if (t > s) s = t; if (t < lo) lo = t; } this.slopeK = U.clamp((s - lo) * 2.5, 0, 1); want = U.clamp(s - this.y, -0.85, 0.85); } } } // the highest of the ground under his boots, so a slope never swallows a foot (or a crouch)
      this.visLift = (this.visLift || 0) + (want - (this.visLift || 0)) * Math.min(1, dt * 14); this.stepLag = (this.stepLag || 0) * Math.exp(-dt * 10); }
    const wasFalling = this.vy < 0;
    const hitY = this.moveAxis(1, this.vy * dt);
    if (hitY) {
      if (wasFalling && this.gliding && !mountShape && this.glideImpact) {
        const im = this.glideImpact; const hard = im.s > 10.5 && im.vy < -2.6, stall = im.s < 3.6 && im.vy < -4.4;
        if (hard) { this.damage(Math.max(1, Math.floor((im.s - 9) / 1.4)), 'fall'); this.landMsg = 'hard'; }
        else if (stall) { this.damage(1, 'fall'); this.landMsg = 'stall'; }
        else this.landMsg = im.s < 6.5 ? 'soft' : 'ok';
        this.glideImpact = null;
      }
      if (wasFalling) {
        this.onGround = true;
        if (this.fallStart != null && !inFluid) {
          const dist = this.fallStart - this.y;
          if (dist > 4.5 && !(this.mount && (this.mount.sp.climber || mountShape === 'air')) && !(this.glideT > 0)) this.damage(Math.floor(dist - 3.5), 'fall');
        }
        this.fallStart = null;
      }
      this.vy = 0;
    } else if (this.vy !== 0) this.onGround = false;
    // sneaking: do not walk off edges
    if (this.sneak && this.onGround && !this.collides(this.x, this.y - 0.1, this.z)) {
      // stepped off: nudge back
      this.x -= this.vx * dt * 1.2; this.z -= this.vz * dt * 1.2; this.vx = 0; this.vz = 0;
    }
    // a mount stays near the surface without a bulb, and nothing on wings goes above the clouds: that is what ships are for
    if (mountShape === 'water' && !this.has('bulb') && this.y < SEA - 1.1) { this.y = SEA - 1.1; if (this.vy < 0) this.vy = 0; if (!this.warnedBulb) { this.warnedBulb = true; if (typeof UI !== 'undefined') UI.toast('Your Kin will not take you under: you would drown. Marisol makes Breathing Bulbs.'); } }
    if (mountShape === 'air' && this.y > SKY_BASE - 4) { this.y = SKY_BASE - 4; if (this.vy > 0) this.vy = 0; }
    if (this.mount) this.mount.trust = Math.min(1, (this.mount.trust || 0) + dt / 7200);
    // breath
    if (this.underwater) {
      const max = (this.has('bulb') ? 120 * this.gearMul('bulb') : 20) * this.breathMul * (this.has('reeffins') ? 2 : 1) * (typeof G !== 'undefined' && G.buffMul ? G.buffMul('breath') : 1);
      this.breath -= dt / max;
      if (this.breath <= 0) { this.breath = 0; this.lavaTick += dt; if (this.lavaTick > 1) { this.lavaTick = 0; this.damage(1, 'drown'); } }
    } else { this.breath = Math.min(1, this.breath + dt * 0.5); }
    if (this.inLava) { if (!this.lavaTouch) { this.lavaTouch = true; this.damage(Math.ceil(6 * this.lavaMul), 'lava'); } this.lavaTick += dt; if (this.lavaTick > 0.2 / this.lavaMul) { this.lavaTick = 0; this.damage(3, 'lava'); } } else this.lavaTouch = false;
    if (this.inBrine && !this.has('lavasuit')) { this.brineTick = (this.brineTick || 0) + dt; if (this.brineTick > 0.7) { this.brineTick = 0; this.damage(1, 'brine'); } } else this.brineTick = 0;
    this.updateChill(dt);
    if (this.y < -2) { this.y = 3; }
    // out-of-world safety: if stuck inside a block (chunk loaded late), push up
    if (this.collides(this.x, this.y, this.z)) { this.y += 0.5; this.vy = 0; }
    // regen
    if (this.hp < this.maxHp) { this.regen = (this.regen || 0) + dt; if (this.regen > 6) { this.regen = 0; this.hp = Math.min(this.maxHp, this.hp + 1); } }
  }
  // ship flight: fast, free movement; hitting anything at speed is a crash
  updateFlight(dt, input) {
    const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
    const fwd = [-sy, -cy], right = [cy, -sy];
    const speed = 13;
    let mx = fwd[0] * input.mz + right[0] * input.mx, mz = fwd[1] * input.mz + right[1] * input.mx;
    if (this.autoLand && input.jump) this.autoLand = false; // ▲ calls the landing off
    if (this.autoLand) { mx = mz = 0; } // landing: the ship holds still over its spot and lowers itself
    this.vx += (mx * speed - this.vx) * Math.min(1, (this.autoLand ? 5 : 3) * dt); this.vz += (mz * speed - this.vz) * Math.min(1, (this.autoLand ? 5 : 3) * dt);
    const ty = this.autoLand ? -3 : input.jump ? 7 : input.sneak ? -7 : 0;
    this.vy += (ty - this.vy) * Math.min(1, 3 * dt);
    const hsp = Math.hypot(this.vx, this.vz);
    const hx = this.moveAxis(0, this.vx * dt), hz = this.moveAxis(2, this.vz * dt), hy = this.moveAxis(1, this.vy * dt);
    // touching down is a landing, however fast you came down; only flying into something sideways at speed is a crash
    if (hy && this.vy < 0) { const auto = this.autoLand; this.autoLand = false; this.fallStart = null; if (hsp > 7.5 && !auto) { this.crashed = true; this.flying = false; this.vx = this.vy = this.vz = 0; return; } this.flying = false; this.landed = true; this.vx = this.vy = this.vz = 0; this.onGround = true; return; }
    if ((hx || hz) && hsp > 6 && !this.autoLand) { this.crashed = true; this.flying = false; this.vx = this.vy = this.vz = 0; return; }
    if (hx) this.vx = 0; if (hz) this.vz = 0; if (hy) this.vy = 0;
    this.onGround = false; this.fallStart = null; this.breath = 1;
    if (this.y >= WH + 30) this.leftWorld = true;
  }
  // cold: snowfields, mountain tops and the airless Moon chill you, slow you, then take your health, unless you wear the right suit
  coldHere() {
    const w = this.world;
    if (this.flying) return null;
    if (typeof G !== 'undefined' && G.warmUntil > performance.now() && !w.preset.airless) return null; // warm broth
    if (!w.preset.airless) { const bx0 = Math.floor(this.x), by0 = Math.floor(this.y), bz0 = Math.floor(this.z); for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) for (let dy = -2; dy <= 1; dy++) if (w.getBlock(bx0 + dx, by0 + dy, bz0 + dz) === B.CAMPFIRE) return null; }
    if (w.preset.airless) return this.has('spacesuit') ? null : 'space';
    if (w.preset.id === 'earth' && this.y < CORE_TOP + 1) return this.has('lavasuit') ? null : 'heat'; // the Core: heat, not cold
    if (this.has('frostcloak')) return null;
    const bx = Math.floor(this.x), bz = Math.floor(this.z);
    if (this.y < w.topAt(bx, bz) - 4) return null; // underground is out of the wind
    if (this.y >= SKY_BASE + 6) return 'cold';
    // inside a town's walls you are among houses and hearths: never cold there
    if (typeof Village !== 'undefined' && Village.active) { const v = Village.active; const R = (v.R || 12) + 4; if (Math.hypot(v.x - this.x, v.z - this.z) < R) return null; }
    // otherwise it is the snow itself that chills you: most of the ground around you has to be snow. Grass, stone and paths
    // at the edge of a snowfield or on a high green slope are not cold
    const biome = w.biomeAt(bx, bz); if (biome !== BIOME.SNOW && biome !== BIOME.MOUNTAIN) return null;
    let snowy = 0; for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const t = w.groundY(bx + dx * 2, bz + dz * 2, Math.floor(this.y) + 3); if (w.getBlock(bx + dx * 2, t, bz + dz * 2) === B.SNOW) snowy++; }
    return snowy >= 10 ? 'cold' : null;
  }
  updateChill(dt) {
    const kind = this.coldHere();
    const rate = kind === 'space' ? 1 / 3 : kind === 'cold' ? 1 / 8 : kind === 'heat' ? 1 / 6 : 0;
    const shelter = this.mount && this.mount.sp.climber ? 0.5 : 1;
    this.chill = U.clamp((this.chill || 0) + (kind ? rate * (kind === 'heat' ? 1 : shelter * this.lavaMul) : -1 / 2) * dt, 0, 1);
    this.coldKind = kind;
    if (this.chill >= 1) { this.chillTick = (this.chillTick || 0) + dt; const every = kind === 'space' ? 1.5 : 3 / this.lavaMul; if (this.chillTick > every) { this.chillTick = 0; this.damage(1, kind); } }
    else this.chillTick = 0;
  }
  damage(n, cause) {
    if (typeof G !== 'undefined' && G.damageMul) n = Math.ceil(n * G.damageMul());
    if (typeof Combat !== 'undefined' && Combat.armourCut) n = Combat.armourCut(n, cause);
    if (n <= 0) return;
    this.hp -= n; this.hurtFlash = 0.4; this.lastDamage = cause;
    if (this.hp <= 0) { this.hp = 0; this.dead = true; }
  }
  eye() { return { x: this.x, y: this.y + this.EYE - (this.sneak ? 0.25 : 0) + this.drawLift(), z: this.z }; }
  drawLift() { return (this.visLift || 0) - (this.stepLag || 0); } // how far the drawn figure and camera sit from the collision height: on the smoothed surface, easing over steps
  // ---- block targeting (DDA raycast) ----
  raycast(maxDist = 6, hitFluids = false, solidOnly = false) {
    const e = this.eye();
    const [dx, dy, dz] = U.forwardVec(this.yaw, this.pitch);
    let x = Math.floor(e.x), y = Math.floor(e.y), z = Math.floor(e.z);
    const stepX = Math.sign(dx), stepY = Math.sign(dy), stepZ = Math.sign(dz);
    const tDeltaX = dx !== 0 ? Math.abs(1 / dx) : Infinity, tDeltaY = dy !== 0 ? Math.abs(1 / dy) : Infinity, tDeltaZ = dz !== 0 ? Math.abs(1 / dz) : Infinity;
    let tMaxX = dx > 0 ? (x + 1 - e.x) / dx : dx < 0 ? (e.x - x) / -dx : Infinity;
    let tMaxY = dy > 0 ? (y + 1 - e.y) / dy : dy < 0 ? (e.y - y) / -dy : Infinity;
    let tMaxZ = dz > 0 ? (z + 1 - e.z) / dz : dz < 0 ? (e.z - z) / -dz : Infinity;
    let face = [0, 0, 0], t = 0;
    for (let i = 0; i < 200; i++) {
      const id = this.world.getBlock(x, y, z);
      if (id !== B.AIR && (isSolid(id) || (!solidOnly && BLOCKS[id].partial) || (hitFluids && BLOCKS[id].fluid))) return { x, y, z, id, face, dist: t };
      if (tMaxX < tMaxY && tMaxX < tMaxZ) { x += stepX; t = tMaxX; tMaxX += tDeltaX; face = [-stepX, 0, 0]; }
      else if (tMaxY < tMaxZ) { y += stepY; t = tMaxY; tMaxY += tDeltaY; face = [0, -stepY, 0]; }
      else { z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; face = [0, 0, -stepZ]; }
      if (t > maxDist) return null;
    }
    return null;
  }
  // returns event when a block breaks
  // tools: hands are fine for soil and wood, slow on stone, hopeless on ore; picks come from the miners
  // what each tool does: hands pick plants; the shovel digs soil; the axe cuts wood; picks break stone, and only the right pick breaks the deeper ores.
  // Stone with the first pick is slow work (about five times a shovelful of dirt); each better pick is a lot quicker.
  toolKind(id) {
    if ([B.LEAVES, B.BERRY, B.BERRYLEAF, B.FERN, B.GLOWWORM, B.TORCH, B.MOONGLOW, B.BALLOON, B.CACTUS, B.CORAL_R, B.CORAL_B, B.CORAL_Y, B.GLASS, B.SELGLASS, B.DOOR, B.DOOR_OPEN, B.CHEST, B.LADDER, B.TARGET, B.STATUE, B.FUSION, B.DARKTABLE, B.NEEDLES, B.FROND, B.MUSHROOM, B.FLOWERS, B.PEBBLES].includes(id)) return 'hand';
    if ([B.DIRT, B.GRASS, B.SAND, B.SNOW, B.GRAVEL, B.CLOUD, B.GLOWGRASS, B.REGOLITH, B.DUNE, B.SALTCRUST].includes(id)) return 'soil';
    if ([B.LOG, B.BIRCHLOG, B.PALMLOG, B.PLANKS].includes(id)) return 'wood';
    return 'stone';
  }
  // a tool you own that is not broken (the first stone pick and the rods never wear)
  tool(k) { return this.has(k) && !(typeof Combat !== 'undefined' && Combat.broken && Combat.broken(k)); }
  pickTier() { return this.tool('pick') ? 3 : this.tool('pick_iron') ? 2 : this.has('pick_stone') ? 1 : 0; }
  // which tool took the wear for breaking this block
  wearTool(id) {
    if (typeof Combat === 'undefined' || !Combat.use) return; const kind = this.toolKind(id); if (kind === 'hand') return;
    if (kind === 'soil') { if (this.tool('shovel')) Combat.use('shovel'); else { const t = this.pickTier(); if (t === 3) Combat.use('pick'); else if (t === 2) Combat.use('pick_iron'); } return; }
    if (kind === 'wood') { if (this.tool('axe_iron')) Combat.use('axe_iron'); else if (this.tool('hatchet')) Combat.use('hatchet'); return; }
    const t = this.pickTier(); if (t === 3) Combat.use('pick'); else if (t === 2) Combat.use('pick_iron');
  }
  toolMul(id) {
    const tier = this.pickTier();
    const kind = this.toolKind(id);
    if (kind === 'hand') return 1;
    if (kind === 'soil') return this.tool('shovel') ? (tier === 3 ? 2 * this.gearMul('pick') : 1) : tier ? 0.35 : 0; // a pick scrapes soil, slowly; bare hands cannot
    if (kind === 'wood') { const ct = typeof Combat !== 'undefined' ? Combat.chopTier() : 0; return Math.max(this.tool('axe_iron') ? 2 : this.tool('hatchet') ? 1 : 0, ct); }
    const need = [B.VOID, B.GOLD, B.DIAMOND, B.BASALT, B.TYCHO, B.RINGSHARD, B.PEARLCORAL].includes(id) ? 2 : [B.COPPER, B.IRON, B.EMBER, B.SELENITE, B.AMBER].includes(id) ? 1 : 0;
    const table = [[0, 0, 0], [0.5, 0.28, 0], [1.8, 1.4, 0.9], [3.6, 3, 2.5]];
    return table[tier][need] * (tier === 3 ? this.gearMul('pick') : 1);
  }
  toolNeed(id) { // why it will not break, in a sentence
    const kind = this.toolKind(id);
    const brk = (k) => this.has(k) && !this.tool(k);
    if (kind === 'soil' && brk('shovel')) return 'Your shovel is broken. A trader or an armoury will mend it.';
    if (kind === 'wood' && (brk('axe_iron') || brk('hatchet'))) return 'Your axe is broken. A trader or an armoury will mend it.';
    if (kind === 'stone' && (brk('pick') || brk('pick_iron'))) return 'Your pick is broken and the stone pick will not touch this. A trader or an armoury will mend it.';
    if (kind === 'soil') return 'Your hands cannot dig that. Free the village by your camp and its people will give you a shovel.';
    if (kind === 'wood') return 'You need an axe to cut wood. Free the village by your camp: they will give you a hatchet.';
    const tier = this.pickTier();
    if (!tier) return 'Stone needs a pick. Foreman Garrick at the Mining Camp (⛏ on the map) has one for you.';
    return 'Too hard for this pick. Garrick makes an iron pick for six copper and four iron.';
  }
  mineTick(dt) {
    const hit = this.raycast(5.5);
    if (!hit || BLOCKS[hit.id].hard === Infinity) { this.mineTarget = null; this.mineProgress = 0; return null; }
    const key = hit.x + ',' + hit.y + ',' + hit.z;
    if (this.mineTarget !== key) { this.mineTarget = key; this.mineProgress = 0; }
    if (typeof G !== 'undefined' && G.protectedAt) { const pr = G.protectedAt(hit); if (pr) { this.mineProgress = 0; this.mineTarget = null; this.cantMine = null; G.onProtectedMine(pr, hit); return null; } }
    const tm = this.toolMul(hit.id);
    if (tm <= 0) { this.mineProgress = 0; this.cantMine = hit.id; return null; }
    this.cantMine = null;
    this.mineProgress += dt * this.mineMul * tm * (typeof G !== 'undefined' && G.buffMul ? G.buffMul('mine') : 1) / BLOCKS[hit.id].hard;
    if (this.mineProgress >= 1) {
      this.mineProgress = 0; this.mineTarget = null;
      const drop = BLOCKS[hit.id].drop;
      if (hit.id === B.BERRY) { this.world.setBlock(hit.x, hit.y, hit.z, B.AIR); this.add('berry', 2 + (Math.random() < 0.5 ? 1 : 0)); (this.world.regrow = this.world.regrow || []).push({ x: hit.x, y: hit.y, z: hit.z, t: performance.now() + 150000 }); return { broke: hit.id, drop: 'berry', x: hit.x, y: hit.y, z: hit.z }; }
      if (hit.id === B.BERRYLEAF) { this.world.setBlock(hit.x, hit.y, hit.z, B.LEAVES); this.add('berry', 1 + (Math.random() < 0.5 ? 1 : 0)); (this.world.regrow = this.world.regrow || []).push({ x: hit.x, y: hit.y, z: hit.z, t: performance.now() + 240000, leaf: true }); return { broke: hit.id, drop: 'berry', x: hit.x, y: hit.y, z: hit.z }; }
      if (hit.id === B.STATUE) { const obj = this.world.removeStatue(hit.x, hit.y, hit.z); if (obj) this.objects.push(obj); return { broke: hit.id, x: hit.x, y: hit.y, z: hit.z }; }
      this.wearTool(hit.id);
      this.world.setBlock(hit.x, hit.y, hit.z, B.AIR);
      if (drop) this.add(drop, 1);
      // everything that grows, grows back: logs, leaves, cactus, glowworms
      const regrowAfter = { [B.LOG]: 240000, [B.BIRCHLOG]: 240000, [B.PALMLOG]: 240000, [B.LEAVES]: 180000, [B.CACTUS]: 240000, [B.GLOWWORM]: 300000 }[hit.id];
      if (regrowAfter && ((hit.id !== B.LOG && hit.id !== B.BIRCHLOG && hit.id !== B.PALMLOG && hit.id !== B.LEAVES) || typeof Felling === 'undefined' || Felling.natural(hit.x, hit.y, hit.z, hit.id))) (this.world.regrow = this.world.regrow || []).push({ x: hit.x, y: hit.y, z: hit.z, t: performance.now() + regrowAfter, id: hit.id });
      return { broke: hit.id, drop, x: hit.x, y: hit.y, z: hit.z };
    }
    return null;
  }
  // tap: interact or place. Returns an event describing what happened.
  place() {
    const hit = this.raycast(5.5);
    if (!hit) return null;
    if (hit.id === B.FUSION) return { interact: 'fusion', x: hit.x, y: hit.y, z: hit.z };
    if (hit.id === B.DARKTABLE) return { interact: 'fusion', dark: true, x: hit.x, y: hit.y, z: hit.z };
    if (hit.id === B.STARMETAL) return { interact: 'starmetal' };
    if (hit.id === B.CAMPFIRE) return { interact: 'camp' };
    if (hit.id === B.PORTAL) return { interact: 'portal', x: hit.x, y: hit.y, z: hit.z };
    if (hit.id === B.CHEST) return { interact: 'chest', x: hit.x, y: hit.y, z: hit.z };
    if (hit.id === B.INCUBATOR) return { interact: 'incubator', x: hit.x, y: hit.y, z: hit.z };
    if (hit.id === B.DOOR || hit.id === B.DOOR_OPEN) { this.world.setBlock(hit.x, hit.y, hit.z, hit.id === B.DOOR ? B.DOOR_OPEN : B.DOOR); return { interact: 'door', open: hit.id === B.DOOR }; }
    const item = this.selected();
    const info = item ? this.itemInfo(item) : null;
    if (info && info.kit) return { kit: info.kit, item, hit };
    if (!item || !info.block) return { nothing: true };
    const px = hit.x + hit.face[0], py = hit.y + hit.face[1], pz = hit.z + hit.face[2];
    { const hh = this.world.heart; if (hh && py < 12 && this.world.preset.id === 'earth') { const d2 = (px - hh.x) ** 2 + (pz - hh.z) ** 2; if (d2 >= 121 && d2 < 34 * 34) { if (typeof UI !== 'undefined') UI.toast('The heat off the lava sea warps anything you set down here. Only wings will get you across.', 'bad'); return null; } } }
    if (py < 1 || py >= WH) return null;
    const cur = this.world.getBlock(px, py, pz);
    if (cur !== B.AIR && cur !== B.WATER) return null;
    // do not place inside the player
    const w = this.W;
    const overlaps = px + 1 > this.x - w && px < this.x + w && pz + 1 > this.z - w && pz < this.z + w && py + 1 > this.y && py < this.y + this.H;
    if (info.obj) {
      // statues need a solid floor and two free blocks
      if (!isSolid(this.world.getBlock(px, py - 1, pz)) || overlaps) return null;
      const yaw = Math.atan2(this.x - (px + 0.5), this.z - (pz + 0.5));
      this.objects = this.objects.filter(o => o !== info.obj);
      this.world.addStatue(px, py, pz, info.obj, yaw);
      return { placed: B.STATUE, x: px, y: py, z: pz };
    }
    if (overlaps && isSolid(info.block)) return null;
    this.world.setBlock(px, py, pz, info.block);
    this.take(item, 1);
    return { placed: info.block, x: px, y: py, z: pz };
  }
  serialize() {
    return { x: this.x, y: this.y, z: this.z, yaw: this.yaw, pitch: this.pitch, hp: this.hp, inv: [...this.inv], sel: this.sel, objects: this.objects, gearPower: this.gearPower };
  }
  load(d) {
    this.x = d.x; this.y = d.y; this.z = d.z; this.yaw = d.yaw || 0; this.pitch = d.pitch || 0; this.hp = d.hp ?? 10;
    this.inv = new Map(d.inv || []); this.sel = d.sel || 0; this.objects = d.objects || []; this.gearPower = d.gearPower || {};
  }
}
