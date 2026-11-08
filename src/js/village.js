'use strict';
// Villages. Many of them, spread across the map a good walk apart, each held by a tyrant until you free it. A freed village is under
// your protection: it pays Shards at every dawn, levels up on what it has earned, and can be walled (wood, stone, iron, voidsteel),
// expanded and filled with shops. Station your own Kin as guards: at night raiders come for the walls, and every week the tyrant
// tries to come back. Three kinds of village: land, stilt villages at sea, glass domes on the sea floor. You can also found your own.
// The starter village carries the elder's tutorial; Old Brannock the fisherman on the shore hands out the next targets.
const Village = (() => {
  let G = null, world = null;
  const villages = new Map();   // id -> village record (sites are decided per map cell, deterministically)
  let active = null;            // the village the player is near
  let walkState = null;         // an elder or headman walking up to talk
  let fisher = null;            // the shoreline quest giver
  let CELL = WORLD_W / 64, NC = 64, PREFIX = '', STYLE = 'land'; // cells per body: one candidate village and one hermit each (set in init from the preset)
  const seaLevel = () => world.preset.water ? SEA : world.preset.brine ? world.preset.brineLevel : -99;
  const FOUND = { wood: 40, wall: 36, radius: 14, apart: 70 };
  const WALLS = [
    { name: 'Wood', block: B.PLANKS, bonus: 2, level: 1 },
    { name: 'Stone', block: B.STONE, bonus: 8, level: 2, cost: { shards: 60, items: { stone: 40 } } },
    { name: 'Iron', block: B.IRONWALL, bonus: 16, level: 3, cost: { shards: 150, items: { iron: 24 } } },
    { name: 'Voidsteel', block: B.VOIDWALL, bonus: 28, level: 4, cost: { shards: 400, items: { iron: 16, void: 12 } } },
  ];
  const WALL_SETS = {
    land: WALLS,
    frontier: [{ name: 'Palisade', block: B.LOG, bonus: 3, level: 1 }, WALLS[1], WALLS[2], WALLS[3]],
    alien: [{ name: 'Regolith', block: B.REGOLITH, bonus: 2, level: 1 }, { name: 'Basalt', block: B.BASALT, bonus: 8, level: 2, cost: { shards: 60, items: { stone: 40 } } }, { name: 'Tycho', block: B.IRONWALL, bonus: 18, level: 3, cost: { shards: 150, items: { tycho: 10, iron: 10 } } }, WALLS[3]],
    halo: [{ name: 'Sandstone', block: B.STONE, bonus: 3, level: 1 }, { name: 'Basalt', block: B.BASALT, bonus: 8, level: 2, cost: { shards: 60, items: { stone: 40 } } }, WALLS[2], WALLS[3]],
  };
  const wallSet = (v) => WALL_SETS[v.style] || WALLS;
  const WALL_BLOCKS = new Set([B.PLANKS, B.STONE, B.IRONWALL, B.VOIDWALL, B.TORCH, B.LOG, B.REGOLITH, B.BASALT, B.MOONGLOW, B.RINGSHARD]);
  const LEVELS = [0, 90, 300, 700, 1500]; // lifetime Shards earned for level 1..5
  const EXPAND = { level: 2, cost: { shards: 200, items: { planks: 40 } } };
  const SHOP_BUILD = {
    bakery: { name: 'Bakery', marker: B.EMBER, cost: { shards: 80, items: { planks: 20 } } },
    juice: { name: 'Juice Bar', marker: B.BERRY, cost: { shards: 80, items: { planks: 20, berry: 6 } } },
    trader: { name: 'Trader', marker: B.COPPER, cost: { shards: 100, items: { planks: 20, copper: 2 } } },
    voodoo: { name: 'Voodoo Hut', marker: B.VOID, cost: { shards: 120, items: { planks: 16, void: 2 } } },
    post: { name: 'Trading Post', marker: B.IRON, level: 2, cost: { shards: 120, items: { planks: 24, iron: 2 } } },
    armoury: { name: 'Armoury', marker: B.IRON, level: 2, cost: { shards: 300, items: { planks: 24, iron: 6 } } },
    armourer: { name: 'Armourer', marker: B.GOLD, level: 2, cost: { shards: 300, items: { planks: 24, iron: 6 } } },
    alchemist: { name: 'Alchemist', marker: B.GLOWWORM, level: 2, cost: { shards: 250, items: { planks: 20, glass: 6 } } },
    inn: { name: 'Inn', marker: B.LOG, level: 1, cost: { shards: 150, items: { planks: 30 } } },
    restaurant: { name: 'Restaurant', marker: B.BERRY, level: 1, cost: { shards: 200, items: { planks: 24 } } },
    sanctuary: { name: 'Kin Sanctuary', marker: B.MOONGLOW, level: 2, cost: { shards: 400, items: { planks: 24, glass: 8 } } },
    stables: { name: 'Riding School', marker: B.LOG, level: 2, cost: { shards: 300, items: { planks: 30 } } },
    aerie: { name: 'Flying School', marker: B.CLOUD, level: 2, cost: { shards: 300, items: { planks: 30 } } },
    station: { name: 'Station', marker: B.IRON, level: 1, cost: { shards: 200, items: { planks: 30, iron: 8 } } },
    kinmarket: { name: 'Kin Sale Yard', marker: B.LOG, level: 2, cost: { shards: 400, items: { planks: 30 } } },
    kinshow: { name: 'Kin Show', marker: B.GOLD, level: 2, cost: { shards: 400, items: { planks: 30 } } },
    barber: { name: 'Barber', marker: B.GOLD, level: 2, cost: { shards: 300, items: { planks: 20 } } },
    mirror: { name: 'Mirror Hall', marker: B.GLASS, level: 2, cost: { shards: 300, items: { planks: 20, glass: 8 } } },
    designer: { name: 'House of Zazu', marker: B.BERRYLEAF, level: 2, cost: { shards: 300, items: { planks: 20 } } },
    kinwear: { name: 'Kin Outfitter', marker: B.CLOUD, level: 2, cost: { shards: 300, items: { planks: 20 } } },
    tailor: { name: 'Tailor', marker: B.BERRY, level: 2, cost: { shards: 400, items: { planks: 20 } } },
    enchanter: { name: 'Enchanter', marker: B.VOID, level: 2, cost: { shards: 500, items: { planks: 20, void: 2 } } },
    cartographer: { name: 'Cartographer', marker: B.GLASS, level: 2, cost: { shards: 300, items: { planks: 20 } } },
    daycare: { name: 'Kin Daycare', marker: B.BERRY, level: 2, cost: { shards: 300, items: { planks: 24 } } },
  };
  const SLOTS = [[-11, -11], [11, -11], [-11, 11], [11, 11], [-15, -5], [-15, 5], [15, -5], [15, 5], [-5, -15], [5, -15], [-5, 15], [5, 15]]; // house sites in the expanded ring
  const VILLAGER_LINES = [
    'The bakery\'s bread heals a tired traveller.', 'Kin on the outskirts are stronger. The old paths stay gentle.', 'Void Crystal glows purple below y 22. Bring a torch.',
    'Never swim far without a Breathing Bulb.', 'Sixteen Kin in the table at once. Nobody here has dared.', 'The Core is lava. Suit up first.', 'Berries grow back. Pick them freely.',
    'Sneak up behind a Kin and it never sees you coming.', 'A statue of your best Kin would look fine in our square.', 'They say the Mantlewyrm sleeps on Starmetal.',
    'Every freed village pays its share. Ask the headman.', 'My cousin swears a man once walked straight into an Indian camp at noon. Dressed as one of them, he said. Never told me where he got the clothes.', 'Those Indian camps: every one keeps a strip of its own cloth in a tent. Take one from each and you would have quite a coat. If anyone could sew it.', 'Zazu, in the city, can stitch anything from anything. Even disguises, they say.', 'The Indian camps keep a paddock of Windmanes. Fastest horses I ever saw. They will only carry one of their own, and they always go home.', 'There are villages out on the water, and under it. Nobody here has seen the deep ones.',
    'Found your own village? Table, forty planks, two signs and a wall. People will come.', 'Raiders come at night for the walls. Leave us a guard or two.',
    'The tyrants always try to come back. Strong guards send them packing.', 'Stone walls, then iron. The headman knows the price.',
  ];
  const SHOPS = {
    bakery: { title: 'Bakery', keeper: 'Pell', greet: 'Fresh from the oven. Bread for you, berries for the road.', stock: [{ item: 'bread', price: 10 }, { item: 'berry', price: 3, n: 3 }, { item: 'torch', price: 8, n: 4 }] },
    juice: { title: 'Juice Bar', keeper: 'Mira', greet: 'A smoothie mends a tired party. Tonics too, if you have the Shards.', stock: [{ item: 'smoothie', price: 15 }, { item: 'tonic_heal', price: 12 }, { item: 'tonic_vigor', price: 40 }] },
    voodoo: { title: 'Voodoo Hut', keeper: 'Mama Oyé', greet: 'Fainted Kin do not wake on their own. I wake them, for Shards.', stock: [{ service: 'rest', name: 'Revive and heal the whole party', price: 20 }, { item: 'tonic_revive', price: 25 }, { item: 'tonic_heal', price: 12 }] },
    trader: { title: 'Trader', keeper: 'Oskar', greet: 'Snares, planks, the odd crystal. Shards only. I buy too: ores, crystals, anything you dug up.', sell: true, stock: [{ item: 'snare', price: 12, n: 2 }, { item: 'snare2', price: 45 }, { item: 'planks', price: 6, n: 8 }, { item: 'void', price: 30 }, { item: 'glass', price: 5, n: 4 }, { item: 'snow', price: 9, n: 8 }, { item: 'frond', price: 4, n: 6 }, { item: 'iron', price: 20, n: 2 }, { item: 'copper', price: 14, n: 2 }, { item: 'ember', price: 12, n: 2 }] },
    post: { title: 'Trading Post', keeper: 'Nadia', greet: 'Whatever the travellers bring in, I sell. New stock every two days.', stock: [] },
    armoury: { title: 'Armoury', keeper: 'Bram', greet: 'Blades and axes. Nothing here is for show.', stock: [] },
    armourer: { title: 'Armourer', keeper: 'Hilde', greet: 'Helms, plate, shields. Stand still, I need your size.', stock: [] },
    alchemist: { title: 'Alchemist', keeper: 'Ottoline', greet: 'Tonics, baits, and arrows that do more than stick in things.', stock: [{ item: 'tonic_heal', price: 14 }, { item: 'tonic_revive', price: 28 }, { item: 'tonic_vigor', price: 45 }, { item: 'tonic_might', price: 45 }, { item: 'tonic_swift', price: 45 }, { item: 'bait_berry', price: 10 }, { item: 'bait_glow', price: 25 }] },
    restaurant: { title: 'Restaurant', keeper: 'Chef Anselm', greet: 'Sit, eat. A proper meal stays with you: you will feel it for the next half hour.', stock: [{ service: 'meal', buff: 'hearts', amt: 2, mins: 30, name: 'Hearty Stew: two extra hearts for 30 minutes', price: 40 }, { service: 'meal', buff: 'mine', amt: 2, mins: 30, name: 'Miner\'s Breakfast: dig twice as fast for 30 minutes', price: 35 }, { service: 'meal', buff: 'speed', amt: 1.25, mins: 20, name: 'Swift Salad: quicker on your feet for 20 minutes', price: 30 }, { service: 'meal', buff: 'breath', amt: 2, mins: 30, name: 'Diver\'s Chowder: hold your breath twice as long for 30 minutes', price: 30 }] },
    sanctuary: { title: 'Kin Sanctuary', keeper: 'Sister Imelda', greet: 'Bring me your lead Kin. Here they learn what their element can really do.', stock: [{ service: 'teach', name: 'Teach your lead Kin its element\'s technique', price: 0 }, { service: 'calm', name: 'A day of rest: your whole party healed and calmed', price: 25 }] },
    stables: { title: 'Riding School', keeper: 'Wrangler Tess', greet: 'A Kin that trusts you runs faster under you. We can speed that up.', stock: [{ service: 'trust', name: 'A riding lesson: your lead Kin\'s trust goes up a good way', price: 120 }, { item: 'berry', price: 3, n: 6 }] },
    aerie: { title: 'Flying School', keeper: 'Captain Merrow', greet: 'Gliders, flight snares, and a lesson in reading the wind. And no, a glider will not get you to Highmere. Nothing gets you up there but wings.', stock: [{ service: 'tune', name: 'Tune your glider: it flies further and faster (once)', price: 400 }, { item: 'snare_sky', price: 60, n: 2 }, { item: 'feather', price: 12, n: 3 }] },
    tailor: { title: 'Tailor', keeper: 'Madame Orla', greet: 'New clothes, new you. Cut to measure, worn out of here.', stock: [{ service: 'skin', skin: 'noble', name: 'Noble: velvet and gold thread', price: 600 }, { service: 'skin', skin: 'knight', name: 'Knight: polished plate and a plumed helm', price: 900 }, { service: 'skin', skin: 'corsair', name: 'Corsair: sea coat and a red sash', price: 700 }, { service: 'skin', skin: 'sage', name: 'Sage: robes the colour of dusk', price: 800 }, { service: 'skin', skin: 'duelist', name: 'Duelist: black and silver', price: 1000 }, { service: 'skin', skin: 'royal', name: 'Royal: for those who have freed a kingdom', price: 5000 }] },
    enchanter: { title: 'Enchanter', keeper: 'Magister Vael', greet: 'A word over your armour, a whisper on your blade. It wears off, they always do.', stock: [{ service: 'meal', buff: 'ward', amt: 15, mins: 60, name: 'Ward: fifteen extra armour points for an hour', price: 250 }, { service: 'meal', buff: 'blade', amt: 1.35, mins: 60, name: 'Keen Edge: your sword and axe hit a third harder for an hour', price: 220 }, { service: 'meal', buff: 'luck', amt: 1.3, mins: 30, name: 'Lucky Hand: snares hold better for 30 minutes', price: 300 }, { service: 'meal', buff: 'speed', amt: 1.35, mins: 30, name: 'Fleet Foot: run faster for 30 minutes', price: 120 }] },
    cartographer: { title: 'Cartographer', keeper: 'Pim the Mapper', greet: 'I sell what I have seen, and I have seen a great deal.', stock: [{ service: 'map', what: 'holds', name: 'Map of the Holds: every one of his fortresses, marked', price: 400 }, { service: 'map', what: 'towns', name: 'Map of the Realm: every town and city, named', price: 250 }] },
    daycare: { title: 'Kin Daycare', keeper: 'Nanny Bree', greet: 'Leave them with me while you go about your business. They will come back stronger.', stock: [{ service: 'meal', buff: 'train', amt: 1, mins: 60, name: 'An hour of training: your whole party gains experience every minute you play', price: 180 }, { service: 'calm', name: 'A nap and a snack: your whole party healed', price: 20 }] },
    barber: { title: 'Barber', keeper: 'Fenwick the Barber', greet: 'Sit down. Something bold, or something sensible?', stock: [{ service: 'look', panel: 'barber', name: 'A new cut, a new colour', price: 0 }] },
    mirror: { title: 'Mirror Hall', keeper: 'The Glass Lady', greet: 'Look into it. Now tell it who you would rather be.', stock: [{ service: 'look', panel: 'mirror', name: 'Change your skin tone and your height', price: 0 }] },
    designer: { title: 'House of Zazu', keeper: 'Zazu', greet: 'Darling. DARLING. We must do something about all of this. Paint, capes, colour!', stock: [{ service: 'look', panel: 'designer', name: 'Face paint, a cape, your own colours', price: 0 }, { service: 'stitch', name: 'Stitch a disguise from Indian cloth (a piece from every camp)', price: 800 }] },
    kinwear: { title: 'Kin Outfitter', keeper: 'Pemberton', greet: 'Every Kin deserves to look its best. Scarves, coats, a little hat. Bring your lead Kin closer.', stock: [{ service: 'look', panel: 'kinwear', name: 'Dress your lead Kin', price: 0 }] },
    kinmarket: { title: 'Kin Sale Yard', keeper: 'Auctioneer Briggs', greet: 'Step up, step up! Fresh Kin in the ring every morning, and on the seventh day, the big parade.', stock: [] },
    kinshow: { title: 'Kin Show', keeper: 'Judge Ottilie', greet: 'One entry a day. Bring your lead Kin, groomed and dressed, and let the judges decide.', stock: [{ service: 'show', name: 'Enter your lead Kin in today\'s show', price: 50 }] },
    station: { title: 'Station', keeper: 'Stationmaster Pike', greet: 'All aboard, for the towns whose lines are open.', stock: [] },
    inn: { title: 'Inn', keeper: 'Marta', greet: 'A bed, a meal, and nobody asks where you have been.', stock: [{ service: 'rest', name: 'A bed for the night: your whole party back on its feet', price: 18 }, { item: 'bread', price: 9 }, { item: 'smoothie', price: 14 }, { item: 'broth', price: 12 }] },
  };
  // the same five shops wear different names and stock on other worlds and in the themed villages
  const SHOP_STYLE = {
    alien: {
      bakery: { title: 'Spore Kitchen', keeper: 'Zyx', greet: 'Spore cake. It is bread, to your kind. Eat.', stock: [{ item: 'bread', price: 12 }, { item: 'moonlamp', price: 10, n: 4 }, { item: 'torch', price: 8, n: 4 }] },
      juice: { title: 'Nectar Vat', keeper: 'Oolu', greet: 'The vat mends. Drink, and your Kin drink with you.', stock: [{ item: 'smoothie', price: 16 }, { item: 'tonic_heal', price: 12 }, { item: 'tonic_vigor', price: 40 }, { item: 'starsalt', price: 20, n: 2 }] },
      voodoo: { title: 'Mender\'s Pod', keeper: 'Qa', greet: 'Fainted Kin. I wake them. The price is Shards.', stock: [{ service: 'rest', name: 'Revive and heal the whole party', price: 24 }, { item: 'tonic_revive', price: 28 }, { item: 'tonic_heal', price: 12 }] },
      trader: { title: 'Exchange', keeper: 'Vreek', greet: 'Minerals of your world, minerals of mine. I take both.', sell: true, stock: [{ item: 'snare2', price: 45 }, { item: 'selenite', price: 24, n: 2 }, { item: 'tycho', price: 30, n: 2 }, { item: 'glass', price: 5, n: 4 }, { item: 'iron', price: 20, n: 2 }, { item: 'void', price: 30 }, { item: 'stone', price: 2, n: 16 }] },
      post: { title: 'Drift Market', keeper: 'Ixil', greet: 'What drifts in, I sell. New stock every two days.', stock: [] },
    },
    halo: {
      bakery: { title: 'Dune Oven', keeper: 'Sefa', greet: 'Flatbread from the oven, hot as the sand.', stock: [{ item: 'bread', price: 12 }, { item: 'torch', price: 8, n: 4 }, { item: 'sulfur', price: 8, n: 3 }] },
      juice: { title: 'Brine Bar', keeper: 'Tali', greet: 'Not the brine outside. Mine mends.', stock: [{ item: 'smoothie', price: 16 }, { item: 'tonic_heal', price: 12 }, { item: 'tonic_might', price: 40 }, { item: 'amber', price: 16, n: 2 }] },
      voodoo: { title: 'Sand Healer', keeper: 'Orun', greet: 'The fainted wake under my hands. Shards first.', stock: [{ service: 'rest', name: 'Revive and heal the whole party', price: 24 }, { item: 'tonic_revive', price: 28 }, { item: 'tonic_heal', price: 12 }] },
      trader: { title: 'Caravan Store', keeper: 'Besh', greet: 'Amber, sulfur, ring shards when the sky drops them. I buy anything that shines.', sell: true, stock: [{ item: 'snare2', price: 45 }, { item: 'amber', price: 18, n: 2 }, { item: 'sulfur', price: 10, n: 3 }, { item: 'ringshard', price: 60 }, { item: 'iron', price: 20, n: 2 }, { item: 'void', price: 30 }, { item: 'stone', price: 2, n: 16 }] },
      post: { title: 'Caravanserai', keeper: 'Kadu', greet: 'Caravans leave their odds and ends. New stock every two days.', stock: [] },
    },
    frontier: {
      bakery: { title: 'Biscuit House', keeper: 'Dolly', greet: 'Biscuits and berry pie. Sit a spell.', stock: [{ item: 'bread', price: 10 }, { item: 'berry', price: 3, n: 3 }, { item: 'torch', price: 8, n: 4 }] },
      juice: { title: 'Saloon', keeper: 'Buck', greet: 'Sarsaparilla for you, a tonic for your critters. Mind the doors on the way out.', stock: [{ item: 'smoothie', price: 15 }, { item: 'tonic_heal', price: 12 }, { item: 'tonic_swift', price: 40 }] },
      voodoo: { title: 'Doc\'s', keeper: 'Doc Hattie', greet: 'Fainted Kin, I patch them up. Shards on the counter.', stock: [{ service: 'rest', name: 'Revive and heal the whole party', price: 20 }, { item: 'tonic_revive', price: 25 }, { item: 'tonic_heal', price: 12 }] },
      trader: { title: 'General Store', keeper: 'Clem', greet: 'Rope, planks, snares. I buy ore and gold, if you have any.', sell: true, stock: [{ item: 'snare', price: 12, n: 2 }, { item: 'snare2', price: 45 }, { item: 'planks', price: 6, n: 8 }, { item: 'door', price: 14 }, { item: 'iron', price: 20, n: 2 }, { item: 'copper', price: 14, n: 2 }, { item: 'chest', price: 30 }] },
      post: { title: 'Trading Post', keeper: 'Earl', greet: 'Whatever the wagons bring. New stock every two days.', stock: [] },
    },
    atlantis: {
      bakery: { title: 'Kelp Kitchen', keeper: 'Thal', greet: 'Kelp bread. It keeps, down here.', stock: [{ item: 'bread', price: 10 }, { item: 'coral', price: 8, n: 2 }, { item: 'torch', price: 8, n: 4 }] },
      juice: { title: 'The Drowned Tavern', keeper: 'Pelagos', greet: 'Sea grog for the party and the tales of the deep for free. The big ones are out past the reef.', stock: [{ item: 'smoothie', price: 15 }, { item: 'tonic_heal', price: 12 }, { item: 'tonic_vigor', price: 40 }, { item: 'bait_void', price: 12, n: 2 }] },
      voodoo: { title: 'Tide Healer', keeper: 'Meridia', greet: 'The tide wakes the fainted, with my help. Shards.', stock: [{ service: 'rest', name: 'Revive and heal the whole party', price: 20 }, { item: 'tonic_revive', price: 25 }, { item: 'tonic_heal', price: 12 }] },
      trader: { title: 'Pearl Exchange', keeper: 'Orm', greet: 'Coral, pearls, and whatever the wrecks give up. I pay for coral.', sell: true, stock: [{ item: 'coral', price: 8, n: 3 }, { item: 'pearl', price: 55 }, { item: 'bulb', price: 180 }, { item: 'snare2', price: 45 }, { item: 'glass', price: 5, n: 4 }, { item: 'iron', price: 20, n: 2 }] },
      post: { title: 'Wreck Market', keeper: 'Calyx', greet: 'What the wrecks give up. New stock every two days.', stock: [] },
    },
  };
  // the sale yard: today's ring, new every game day; every seventh day is the parade, with the rarer ones
  function saleStock(v) {
    const day = G.dayCount || 0; const parade = day % 7 === 6; const r = U.rng(U.combine(U.strHash(v.id), day * 31 + 7));
    const pool = KIN.dex('earth').filter(sp => !sp.fusion && sp.home && sp.home.layer !== 'Core' && (sp.rarity || 0) <= (parade ? 3 : 1));
    const out = []; const n = parade ? 6 : 4; const PR = [150, 420, 1600, 6500];
    for (let i = 0; i < n * 4 && out.length < n; i++) { const sp = pool[r.int(pool.length)]; const rar = sp.rarity || 0; if (!parade && rar > 1) continue; if (parade && i < 2 && rar < 2) continue; if (out.some(o => o.seed === sp.seed)) continue;
      const lv = Math.max(2, Math.min(KIN.capOf(sp), Math.round((G.trainerLevel || 1) * (0.6 + r() * 0.5)))); out.push({ service: 'kin', seed: sp.seed, level: lv, name: `${sp.names[0]}, Lv ${lv} · ${KIN.RARITY[rar].name} · from the ${sp.home.layer === 'Surface' ? sp.home.biome : sp.home.layer}`, price: Math.round(PR[rar] * (1 + lv / 40)) }); }
    return out;
  }
  function shopDef(kind, v) {
    if (kind === 'kinmarket' && v) { const d = SHOPS.kinmarket; const parade = (G.dayCount || 0) % 7 === 6; return Object.assign({}, d, { greet: parade ? 'PARADE DAY! The rare ones are in the ring this morning. Bid quick.' : d.greet + ` The parade is in ${6 - ((G.dayCount || 0) % 7)} day${6 - ((G.dayCount || 0) % 7) === 1 ? '' : 's'}.`, stock: saleStock(v) }); } const st = v && SHOP_STYLE[v.style]; const d = (st && st[kind]) || SHOPS[kind]; if (d && typeof Combat !== 'undefined' && world && world.preset.id === 'earth' && ['trader', 'armoury', 'armourer', 'alchemist'].includes(kind)) return Object.assign({}, d, { stock: d.stock.concat(Combat.rack(v, kind)) }); return d; }
  const POST_POOL = [
    { item: 'iron', n: 4, price: 28 }, { item: 'copper', n: 4, price: 22 }, { item: 'void', n: 2, price: 50 }, { item: 'cloud', n: 4, price: 20 }, { item: 'ember', n: 4, price: 18 },
    { item: 'snare2', n: 1, price: 45 }, { item: 'tonic_vigor', n: 1, price: 40 }, { item: 'tonic_might', n: 1, price: 40 }, { item: 'tonic_swift', n: 1, price: 40 }, { item: 'glass', n: 8, price: 12 },
    { item: 'basalt', n: 8, price: 10 }, { item: 'frond', n: 6, price: 9 }, { item: 'snow', n: 6, price: 9 }, { item: 'ironwall', n: 4, price: 30 }, { item: 'tonic_revive', n: 1, price: 25 },
    { item: 'ess_Flame', n: 1, price: 35 }, { item: 'ess_Tide', n: 1, price: 35 }, { item: 'ess_Stone', n: 1, price: 35 }, { item: 'ess_Gale', n: 1, price: 35 }, { item: 'ess_Spark', n: 1, price: 35 },
  ];
  // what travellers dug up: priced by what you can do with it, not what it is made of
  const FINDS = [
    { item: 'bulb', price: 180, level: 2, tale: 'pulled from a drowned chest' }, { item: 'glider', price: 220, level: 2, tale: 'found on a sky island, owner unknown' },
    { item: 'lavasuit', price: 650, level: 3, tale: 'carried up from the Core by a dying man' }, { item: 'voidwall', n: 4, price: 120, level: 3, tale: 'salvaged from a fallen keep' },
    { item: 'snare2', n: 3, price: 110, level: 2, tale: 'a poacher\'s kit' }, { item: 'tonic_revive', n: 2, price: 45, level: 1, tale: 'brewed in a swamp hut' },
    { item: 'fusion', price: 90, level: 2, tale: 'a whole table, hauled out of a ruin' }, { item: 'ess_Void', n: 2, price: 80, level: 3, tale: 'scraped off the walls at y 20' }, { item: 'ess_Light', n: 2, price: 80, level: 3, tale: 'brought down from the clouds' },
  ];
  const BARTERS = [
    { give: { ember: 6 }, get: { snare2: 1 } }, { give: { berry: 10 }, get: { tonic_revive: 1 } }, { give: { copper: 5 }, get: { glass: 8 } }, 
    { give: { void: 3 }, get: { ess_Void: 1 } }, { give: { iron: 6 }, get: { ironwall: 8 } }, { give: { wood: 12 }, get: { ess_Bloom: 1 } }, { give: { snow: 6 }, get: { ess_Frost: 1 } },
    { give: { cloud: 6 }, get: { ess_Light: 1 } }, { give: { stone: 20 }, get: { bread: 3 } }, { give: { sand: 12 }, get: { ess_Tide: 1 } }, { give: { planks: 16 }, get: { tonic_vigor: 1 } },
    { give: { iron: 10, void: 4 }, get: { voidwall: 8 }, level: 3 }, { give: { glass: 12 }, get: { tonic_might: 1 } },
  ];
  // what the trader pays for what you carry: raw things by a table, crafted things by what went into them
  const SELL = { wood: 1, planks: 1, stone: 1, dirt: 0, sand: 1, gravel: 1, snow: 2, basalt: 2, cloud: 6, frond: 1, glass: 2, berry: 1, glowworm: 3, copper: 5, iron: 7, ember: 4, void: 12, torch: 1, bread: 3, smoothie: 5, tonic_heal: 4, tonic_revive: 9, tonic_vigor: 14, tonic_might: 14, tonic_swift: 14, snare: 4, snare2: 15, bait_berry: 1, bait_glow: 2, bait_void: 5, door: 3, ironwall: 8, voidwall: 20, fusion: 25, selenite: 18, tycho: 22, starsalt: 26, coral: 6, pearl: 40, gold: 30, diamond: 90, amber: 14, sulfur: 10, ringshard: 36 };
  function sellValue(item) {
    const info = ITEMS[item]; if (!info || info.gear || info.keep || info.amulet || item.startsWith('obj:')) return 0;
    if (SELL[item] != null) return SELL[item];
    if (item.startsWith('ess_')) return 10;
    const r = RECIPES.find(x => x.out === item);
    if (r) { let v = 0; for (const k in r.needs) v += sellValue(k) * r.needs[k]; return Math.max(1, Math.round(v / r.n * 0.6)); }
    return 1;
  }
  function sell(item, n) {
    const v = sellValue(item); if (!v) return 0;
    const have = G.player.count(item); const take = Math.min(have, n); if (!take) return 0;
    G.player.take(item, take); G.shards += v * take; return v * take;
  }
  const TRAVELLER_LINES = ['Three days in the Mines for this. Trade?', 'Walked here from the far shore. My pack is heavy, my pockets light.', 'The sky islands are quiet this season. I brought something down.', 'I do not take Shards. Bring me what I ask and the thing is yours.'];
  const SKIN = ['#e8c39e', '#c68642', '#8d5524', '#f1d3b3'];
  const CLOTH = ['#c94c4c', '#4c7bc9', '#4cc97a', '#c9a84c', '#9b4cc9', '#4cc9c0', '#c97a4c'];
  const NAME_A = ['Oak', 'Salt', 'Moss', 'Fen', 'Stone', 'Ash', 'Reed', 'Hollow', 'Bright', 'Deep', 'Wind', 'Ember', 'Pearl', 'Kelp', 'Coral', 'Frost', 'Cloud', 'Tide', 'Glass', 'Hawk'];
  const NAME_B = ['mere', 'reach', 'haven', 'ford', 'moor', 'bury', 'stead', 'hold', 'fall', 'rest', 'shore', 'watch', 'well', 'dale', 'gate', 'keep'];
  // every style of village has its own names, people, shopkeepers and tyrants
  const STYLE_NAMES = {
    alien: { a: ['Zo', 'Xel', 'Vu', 'Kri', 'Oma', 'Thu', 'Ixa', 'Nul', 'Qep', 'Yrr', 'Dax', 'Umm'], b: ['nak', 'thi', 'xor', 'ul', 'vash', 'qa', 'rim', 'oth', 'zee', 'kal'], people: ['Zyx', 'Oolu', 'Vreek', 'Qa', 'Ixil', 'Thrum', 'Nuva', 'Kezz', 'Ambo', 'Yll', 'Drath', 'Oxo'], tyrant: ['Xul the Overseer', 'Vrakthi the Overseer', 'Omm the Overseer', 'Zeth the Overseer', 'Quorl the Overseer', 'Ilmek the Overseer'], headman: 'Speaker', elder: 'Speaker' },
    halo: { a: ['Amber', 'Dust', 'Ring', 'Sulfur', 'Brine', 'Gold', 'Mesa', 'Haze', 'Salt', 'Ochre'], b: ['well', 'rest', 'spire', 'step', 'hollow', 'camp', 'ridge', 'pan', 'gate'], people: ['Sefa', 'Orun', 'Tali', 'Besh', 'Mira', 'Kadu', 'Yani', 'Rook', 'Halim', 'Zora', 'Pell', 'Doru'], tyrant: ['Sarrak the Dune King', 'Ozmir the Dune King', 'Kethra the Dune Queen', 'Vodun the Dune King', 'Ashti the Dune Queen'], headman: 'Caravan Master', elder: 'Caravan Master' },
    frontier: { a: ['Dry', 'Red', 'Silver', 'Dead', 'Lone', 'Copper', 'Black', 'Broken', 'Rattle', 'Gold'], b: [' Gulch', ' Creek', ' Springs', ' Flats', ' Pass', ' Ridge', ' Bend', ' Hollow', ' Wells', ' Fork'], people: ['Jeb', 'Dolly', 'Buck', 'Clem', 'Hattie', 'Roy', 'Mabel', 'Cassidy', 'Earl', 'Lou', 'Wyatt', 'Ida'], tyrant: ['Black Jake the Outlaw', 'One-Eye Sal the Outlaw', 'Dutch Harrow the Outlaw', 'Mad Merle the Outlaw', 'Cutter Bell the Outlaw'], headman: 'Sheriff', elder: 'Sheriff' },
    atlantis: { a: ['Nereid', 'Abyss', 'Pearl', 'Coral', 'Triton', 'Tide', 'Kelp', 'Siren', 'Deep', 'Brine'], b: ['hold', 'deep', 'court', 'reach', 'spire', 'well', 'gate', 'vault'], people: ['Nerissa', 'Thal', 'Meridia', 'Orm', 'Calyx', 'Sura', 'Pelagos', 'Isolde', 'Brann', 'Ione', 'Delphin', 'Marrow'], tyrant: ['Vorthal the Drowned', 'Ulmara the Drowned', 'Keth the Drowned', 'Morvane the Drowned'], headman: 'Tide-Warden', elder: 'Tide-Warden' },
  };
  const PEOPLE = ['Tam', 'Lio', 'Wren', 'Sable', 'Juno', 'Bram', 'Odile', 'Pim', 'Rusk', 'Nell', 'Corin', 'Vesna', 'Ilo', 'Marit'];
  const TYRANT = ['Grakor', 'Vashek', 'Morrug', 'Ulnath', 'Skarn', 'Drelk', 'Thozz', 'Vexmar', 'Krull', 'Obrin', 'Zaghul', 'Nerrok'];
  const styleOf = (v) => (v && STYLE_NAMES[v.style]) ? v.style : null;
  const peopleOf = (v) => styleOf(v) ? STYLE_NAMES[v.style].people : PEOPLE;
  const headmanTitle = (v) => styleOf(v) ? STYLE_NAMES[v.style].headman : 'Headman';
  const wd = (d) => U.mod(d + WORLD_W / 2, WORLD_W) - WORLD_W / 2; // shortest delta on the wrapping map
  const dist2d = (ax, az, bx, bz) => Math.hypot(wd(ax - bx), wd(az - bz));
  const FULL = { bakery: true, juice: true, trader: true, voodoo: true };

  function init(game) {
    G = game; world = game.world; villages.clear(); hermits.clear(); active = null; activeHermit = null; walkState = null; fisher = null;
    const vd = world.preset.villages || { nc: 64, prefix: '', style: 'land' }; NC = vd.nc; CELL = WORLD_W / NC; PREFIX = vd.prefix || ''; STYLE = vd.style || 'land';
    PLAN = null; SPECIAL.clear(); LOOK.clear(); towns.clear(); world.overlay = (c) => overlay(c);
  }
  function state(id) {
    if (!G.villageState) G.villageState = {};
    let st = G.villageState[id];
    if (!st) st = G.villageState[id] = { stamped: false, freed: false, bank: 0, income: 0, earned: 0, guards: [], wall: 0, holeCols: [], expanded: false, shops: [], freedDay: null, report: null, postSold: null };
    if (!st.guards) st.guards = []; if (!st.holeCols) st.holeCols = []; if (!st.shops) st.shops = []; if (st.earned == null) st.earned = 0; if (st.wall == null) st.wall = 0;
    return st;
  }
  const isFreed = (id) => !!(G.villageState && G.villageState[id] && G.villageState[id].freed); // read-only, never creates a record
  function nameFor(id, style) { const h = U.combine(0x7177, U.strHash(id)); const t = STYLE_NAMES[style]; if (t) return t.a[h % t.a.length] + t.b[(h >>> 8) % t.b.length]; return NAME_A[h % NAME_A.length] + NAME_B[(h >>> 8) % NAME_B.length]; }
  function levelOf(st) { let l = 1; for (let i = 1; i < LEVELS.length; i++) if ((st.earned || 0) >= LEVELS[i]) l = i + 1; return l; }
  function amenCount(v, st) { const base = v.founded ? (v.signCount || 0) : Object.keys(v.amen).filter(k => v.amen[k]).length; return base + (st.shops || []).length; }
  function incomeFor(v, st) {
    if (v.R) { const L = layout(v); const closed = st.closed || {}; const open = L.shops.filter(sh => sh.kind !== 'elder' && !closed[sh.kind]).length; const base = { start: 20, hamlet: 15, town: 45, city: 110 }[v.starter ? 'start' : v.size] || 15; return base + 8 * open; } // a town pays by its size, and more for every shop you get running
    return 8 + 5 * Math.min(12, amenCount(v, st));
  }
  function hasAmen(v, st, k) { return !!(v.amen && v.amen[k]) || (st.shops || []).some(s => s.kind === k); }
  const curNight = () => (G.dayCount || 0) + (world.time > 0.5 ? 1 : 0); // the night that is coming or just passed, named by the day it dawns into
  const isNight = () => Math.cos(world.time * Math.PI * 2) > 0.17;

  // ---- sites: one candidate per cell, decided by the terrain there ----
  // Earth keeps a fixed map of named places, not a village in every cell: a few hamlets by home, towns further out, cities beyond them
  let PLAN = null, planning = false; const SPECIAL = new Map(), LOOK = new Map();
  const QUOTA = { hamlet: [2, 140, 650], town: [8, 550, 1500], city: [4, 1300, 2300] };
  function plan() {
    if (PLAN) return PLAN; if (world.preset.id !== 'earth') return null;
    planning = true; const cands = [];
    const sx = Math.floor(U.mod(world.spawn.x, WORLD_W) / CELL), sz = Math.floor(U.mod(world.spawn.z, WORLD_W) / CELL); const R = Math.ceil(2400 / CELL);
    for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) { const v = siteFor(sx + dx, sz + dz); if (v && !v.founded) cands.push(v); }
    planning = false; PLAN = new Map();
    const byD = cands.sort((a, b) => a.dist - b.dist); const taken = [];
    const far = (v, r) => taken.every(t => Math.hypot(wd(t.x - v.x), wd(t.z - v.z)) > r);
    for (const size of ['hamlet', 'town', 'city']) { const [n, lo, hi] = QUOTA[size]; let got = 0, sea = 0;
      for (const v of byD) { if (got >= n) break; if (v.dist < lo || v.dist > hi || PLAN.has(v.id) || !far(v, size === 'city' ? 500 : 300)) continue;
        if (size === 'hamlet' && v.type !== 'land') continue; if (v.type !== 'land') { if (sea >= (size === 'town' ? 2 : 1)) continue; sea++; }
        PLAN.set(v.id, size); taken.push(v); got++; } }
    const specs = ['stables', 'aerie', 'sanctuary']; let si = 0; for (const v of byD) if (PLAN.get(v.id) === 'town' && v.type === 'land' && si < specs.length) SPECIAL.set(v.id, specs[si++]);
    const LOOKS = ['barber', 'mirror', 'designer', 'kinwear']; const hosts = byD.filter(v => PLAN.get(v.id) === 'city' && v.type === 'land').concat(byD.filter(v => PLAN.get(v.id) === 'town' && v.type === 'land').reverse());
    byD.filter(v => PLAN.get(v.id) === 'town' && v.type === 'land').slice(0, 2).forEach(v => LOOK.set(v.id, (LOOK.get(v.id) || []).concat('kinmarket')));
    LOOKS.forEach((k, i) => { const h = hosts[i % Math.max(1, hosts.length)]; if (h) LOOK.set(h.id, (LOOK.get(h.id) || []).concat(k)); });
    return PLAN;
  }
  function siteFor(cx, cz) {
    if (!world.preset.villages) return null;
    cx = U.mod(cx, NC); cz = U.mod(cz, NC);
    const id = PREFIX + cx + ',' + cz;
    if (!planning && world.preset.id === 'earth') { const P = plan(); const v0 = villages.has(id) ? villages.get(id) : rawSite(cx, cz, id); if (!v0 || !P.has(id)) return null; v0.size = P.get(id); v0.special = SPECIAL.get(id) || null; v0.looks = LOOK.get(id) || []; if (v0.type === 'land') v0.R = TOWN_R[v0.size]; if (v0.size === 'city' && !/^(Great|Old|High|Port) /.test(v0.name)) v0.name = (v0.type !== 'land' ? 'Port ' : 'Great ') + v0.name; if (v0.size === 'city') v0.tier = Math.max(v0.tier, 4); return v0; }
    return rawSite(cx, cz, id);
  }
  // ================= towns as part of the world =================
  // A town's streets, houses, shops and levelled ground are drawn into each chunk as it is generated, like terrain, so nothing
  // the size of a city ever goes into the save. Only what you change yourself is saved.
  const TOWN_R = { start: 34, hamlet: 24, town: 46, city: 66 };
  const NCH = WORLD_W / CH;
  const TOWN_SHOPS = {
    start: ['elder', 'bakery', 'juice', 'trader', 'voodoo', 'inn', 'restaurant', 'station'],
    hamlet: ['elder', 'bakery', 'trader', 'voodoo', 'station'],
    town: ['elder', 'bakery', 'juice', 'trader', 'voodoo', 'inn', 'restaurant', 'armoury', 'alchemist', 'post', 'daycare', 'station'],
    city: ['elder', 'bakery', 'juice', 'trader', 'voodoo', 'inn', 'restaurant', 'armoury', 'armourer', 'alchemist', 'post', 'sanctuary', 'tailor', 'enchanter', 'cartographer', 'daycare', 'kinmarket', 'kinshow', 'restaurant', 'inn', 'station', 'stables', 'aerie'],
  };
  const towns = new Map(); // id -> layout
  function townList() { const out = []; const st = villages.get('start'); if (st && st.R) out.push(st); if (PLAN) for (const id of PLAN.keys()) { const v = villages.get(id); if (v && v.R) out.push(v); } return out; }
  function layout(v) {
    if (towns.has(v.id)) return towns.get(v.id);
    const R = v.R, vx = v.x, vz = v.z, vy = v.y; const M = MATS[v.style] || MATS.land; MAT = M;
    const buckets = new Map(); const push = (x, y, z, id) => { if (y < 1 || y >= WH) return; const cx = U.mod(Math.floor(x / CH), NCH), cz = U.mod(Math.floor(z / CH), NCH); const k = cx + ',' + cz; let b = buckets.get(k); if (!b) { b = []; buckets.set(k, b); } b.push(U.mod(x, CH), y, U.mod(z, CH), id); };
    const city = v.size === 'city';
    const streets = [0].concat(city ? [-40, -20, 20, 40] : v.size === 'town' ? [-24, 24] : []);
    const onStreet = (dx, dz) => { if (Math.max(Math.abs(dx), Math.abs(dz)) >= R - 4 && Math.max(Math.abs(dx), Math.abs(dz)) <= R - 2) return true; for (const s0 of streets) { if (Math.abs(dx - s0) <= 1 && Math.abs(dz) <= R) return true; if (Math.abs(dz - s0) <= 1 && Math.abs(dx) <= R) return true; } return false; };
    // the ground: levelled across the whole footprint
    for (let dx = -R - 3; dx <= R + 3; dx++) for (let dz = -R - 3; dz <= R + 3; dz++) {
      const x = vx + dx, z = vz + dz; const h = world.colInfo(U.mod(x, WORLD_W), U.mod(z, WORLD_W)).h;
      for (let y = Math.min(h, vy - 2); y <= vy - 2; y++) push(x, y, z, M.under);
      const plaza = Math.abs(dx) <= 6 && Math.abs(dz) <= 6;
      push(x, vy - 1, z, plaza ? (Math.max(Math.abs(dx), Math.abs(dz)) === 6 ? M.plazaEdge : M.plaza) : onStreet(dx, dz) ? M.plaza : M.ground);
      for (let y = vy; y <= Math.max(h, vy) + 10; y++) push(x, y, z, B.AIR);
    }
    // the square: a fountain in the cities, the Fusion Table to one side
    if (city) {
      for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const edge = Math.max(Math.abs(a), Math.abs(b)) === 2; push(vx + a, vy - 1, vz + b, B.STONE); push(vx + a, vy, vz + b, edge ? B.STONE : B.WATER); }
      for (let y = vy; y <= vy + 2; y++) push(vx, y, vz, B.STONE); push(vx, vy + 3, vz, B.WATER); push(vx, vy + 4, vz, M.light);
      push(vx + 5, vy, vz - 5, B.FUSION);
    } else push(vx, vy, vz, B.FUSION);
    // a market street in the cities: stalls under coloured awnings down the west road
    if (city) { const AW = [B.EMBER, B.GOLD, B.BERRYLEAF, B.CLOUD, B.COPPER]; let n = 0; for (let d = 10; d < R - 10; d += 4) for (const sg of [-1, 1]) { const x = vx - d, z = vz + sg * 2; push(x, vy, z, M.post); push(x, vy + 1, z, M.post); push(x, vy, z, B.CHEST); for (let a = -1; a <= 1; a++) push(x + a, vy + 2, z, AW[n % AW.length]); push(x, vy + 2, z + sg, AW[n % AW.length]); n++; } }
    // a castle on a hill at the back of a city, a waterfall down its side
    let castle = null;
    if (city) {
      const cz0 = vz - R + 16, H = 7, hr = 11; castle = { x: vx, z: cz0, y: vy + H, hr };
      for (let a = -hr - 3; a <= hr + 3; a++) for (let b = -hr; b <= hr; b++) { const t = Math.max(Math.abs(a) - hr, 0); const top = vy - 1 + H - t * 2; if (top < vy - 1) continue; for (let y = vy; y <= top; y++) push(vx + a, y, cz0 + b, B.STONE); push(vx + a, top, cz0 + b, t ? B.GRASS : M.plaza); }
      for (let i = 0; i < H; i++) for (let w = -1; w <= 1; w++) { for (let y = vy; y <= vy - 1 + i; y++) push(vx + w, y, cz0 + hr + 1 + (H - 1 - i), B.STONE); push(vx + w, vy - 1 + i, cz0 + hr + 1 + (H - 1 - i), M.plazaEdge); } // steps up the hill
      const K = vy + H; const F = B.STONE;
      for (let a = -6; a <= 6; a++) for (let b = -6; b <= 6; b++) { const wall = Math.abs(a) === 6 || Math.abs(b) === 6; for (let y = K; y <= K + 8; y++) push(vx + a, y, cz0 + b, wall ? F : B.AIR); push(vx + a, K + 9, cz0 + b, wall && (a + b) % 2 ? F : wall ? B.AIR : B.PLANKS); }
      for (const [a, b] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let y = K; y <= K + 13; y++) push(vx + a + i, y, cz0 + b + j, F); push(vx + a, K + 14, cz0 + b, B.GOLD); push(vx + a, K + 15, cz0 + b, M.light); }
      for (let y = K; y <= K + 3; y++) for (let w = -1; w <= 1; w++) push(vx + w, y, cz0 + 6, B.AIR); push(vx, K + 5, cz0 + 6, B.GOLD);
      // the waterfall: a channel off the hilltop, a sheet of water down its east face, a pool at the bottom
      const fx = vx + hr + 1; for (let y = vy; y <= K - 1; y++) for (let b = -1; b <= 1; b++) push(fx, y, cz0 + b, B.WATER);
      for (let a = 1; a <= 4; a++) for (let b = -2; b <= 2; b++) { push(fx + a, vy - 1, cz0 + b, B.STONE); push(fx + a, vy, cz0 + b, a === 4 || Math.abs(b) === 2 ? B.STONE : B.WATER); }
    }
    for (const [a, b] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) { push(vx + a, vy, vz + b, M.post); push(vx + a, vy + 1, vz + b, M.light); }
    // lamps along the streets
    for (const s0 of streets) for (let d = 9; d < R - 3; d += 8) for (const sg of [-1, 1]) { push(vx + s0 + 2 * sg, vy, vz + d * sg, M.post); push(vx + s0 + 2 * sg, vy + 1, vz + d * sg, M.light); push(vx + d * sg, vy, vz + s0 + 2 * sg, M.post); push(vx + d * sg, vy + 1, vz + s0 + 2 * sg, M.light); }
    // lots: a house on every free plot, its door turned to the nearest street
    const lots = [];
    const axis = new Set(); for (const s0 of streets) for (const sg of [-1, 1]) for (let g = s0 + sg * 6; Math.abs(g) + 4 <= R - 5; g += sg * 9) axis.add(g);
    const AX = [...axis].sort((a, b) => a - b);
    for (const gx of AX) for (const gz of AX) {
      if (Math.abs(gx) < 12 && Math.abs(gz) < 12) continue;
      if (castle && Math.abs(gx) <= 21 && gz <= -R + 32) continue;
      let ok = true; for (let a = -4; a <= 4 && ok; a++) for (let b = -4; b <= 4 && ok; b++) if (onStreet(gx + a, gz + b)) ok = false; if (!ok) continue;
      if (lots.some(l => Math.abs(l.x - vx - gx) < 9 && Math.abs(l.z - vz - gz) < 9)) continue;
      let best = null; for (const s0 of streets) { const dX = Math.abs(gx - s0), dZ = Math.abs(gz - s0); if (!best || dX < best.d) best = { d: dX, dir: [Math.sign(s0 - gx) || 1, 0] }; if (dZ < best.d) best = { d: dZ, dir: [0, Math.sign(s0 - gz) || 1] }; }
      lots.push({ x: vx + gx, z: vz + gz, dirX: best.dir[0], dirZ: best.dir[1], dc: Math.hypot(gx, gz) });
    }
    lots.sort((a, b) => a.dc - b.dc);
    const kinds = (TOWN_SHOPS[v.starter ? 'start' : v.size] || TOWN_SHOPS.hamlet).slice(); if (v.special && !kinds.includes(v.special)) kinds.push(v.special); for (const k of (v.looks || [])) if (!kinds.includes(k)) kinds.splice(1, 0, k);
    const shops = [];
    // the station goes by the gate at the far end of the east street; everything else from the square outwards
    const stI = lots.reduce((bi, l, i) => { const d = Math.hypot(l.x - (vx + R - 9), l.z - (vz + 6)); return d < bi[1] ? [i, d] : bi; }, [-1, 1e9])[0];
    const free = lots.map((l, i) => i).filter(i => i !== stI);
    for (const k of kinds) { if (k === 'elder' && castle) { shops.push({ kind: 'elder', x: castle.x, z: castle.z + 2, dirX: 0, dirZ: 1, castle: true, y: castle.y }); continue; } const i = k === 'station' ? stI : free.shift(); if (i == null || i < 0) continue; shops.push(Object.assign({ kind: k }, lots[i])); lots[i].used = true; }
    // building plots: empty lots marked with lamps at the corners, for sale to you
    const nPlots = { start: 1, hamlet: 1, town: 2, city: 3 }[v.starter ? 'start' : v.size] || 1; const plots = [];
    const spare = lots.filter(l => !l.used); for (let i = 0; i < nPlots && spare.length; i++) { const l = spare.splice(Math.floor(spare.length * (0.35 + 0.2 * i)) % spare.length, 1)[0]; l.used = true; l.plot = true; plots.push({ x: l.x, z: l.z, i });
      for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) push(l.x + a, vy - 1, l.z + b, Math.max(Math.abs(a), Math.abs(b)) === 4 ? M.plazaEdge : M.ground);
      for (const [a, b] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) { push(l.x + a, vy, l.z + b, M.post); push(l.x + a, vy + 1, l.z + b, M.light); } }
    // draw the buildings into the overlay by borrowing the house builder
    const sb = world.setBlock, gb = world.getBlock; world.setBlock = (x, y, z, id) => push(x, y, z, id); world.getBlock = () => B.AIR;
    try {
      const build = M.pod ? pod : house;
      for (const sh of shops) if (!sh.castle) build(sh.x, sh.z, vy, sh.dirX, sh.dirZ, sh.kind === 'elder' ? B.GOLD : (SHOP_BUILD[sh.kind] || {}).marker || B.LOG, FURNISH[sh.kind] || null);
      const r = U.rng(U.combine(world.seed, U.strHash(v.id)));
      for (const l of lots) if (!l.used) { if (r() < 0.12) { for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (r() < 0.35 && M.bush) push(l.x + a, vy, l.z + b, M.bush); continue; } build(l.x, l.z, vy, l.dirX, l.dirZ, B.LOG, null); l.home = true; }
    } finally { world.setBlock = sb; world.getBlock = gb; }
    const L = { R, buckets, shops, homes: lots.filter(l => l.home), streets, plots };
    towns.set(v.id, L); return L;
  }
  // called by the world as each chunk is generated: draw any town that touches it
  function overlay(chunk) {
    if (!world || world.preset.id !== 'earth') return;
    const key = U.mod(chunk.cx, NCH) + ',' + U.mod(chunk.cz, NCH);
    for (const v of townList()) {
      const R = v.R + 4; const ccx = Math.floor(U.mod(v.x, WORLD_W) / CH), ccz = Math.floor(U.mod(v.z, WORLD_W) / CH); const cr = Math.ceil(R / CH) + 1;
      const kx = U.mod(chunk.cx, NCH), kz = U.mod(chunk.cz, NCH); const ddx = Math.abs(U.mod(kx - ccx + NCH / 2, NCH) - NCH / 2), ddz = Math.abs(U.mod(kz - ccz + NCH / 2, NCH) - NCH / 2); if (ddx > cr || ddz > cr) continue;
      const ops = layout(v).buckets.get(key); if (!ops) continue;
      const bl = chunk.blocks; for (let i = 0; i < ops.length; i += 4) bl[(ops[i] * CH + ops[i + 2]) * WH + ops[i + 1]] = ops[i + 3];
    }
    if (typeof Sky !== 'undefined') Sky.overlay(chunk);
  }
  function patchLoaded(v) {
    if (v.patched) return; v.patched = true; const L = layout(v);
    for (const c of world.chunks.values()) { const key = U.mod(c.cx, NCH) + ',' + U.mod(c.cz, NCH); const ops = L.buckets.get(key); if (!ops) continue; const bl = c.blocks; for (let i = 0; i < ops.length; i += 4) bl[(ops[i] * CH + ops[i + 2]) * WH + ops[i + 1]] = ops[i + 3]; world.reapplyEdits(c); }
  }
  function rawSite(cx, cz, id) {
    if (villages.has(id)) return villages.get(id);
    const h1 = U.hash3(cx, 71, cz, 0x5EED), h2 = U.hash3(cx, 72, cz, 0x5EED);
    const margin = Math.min(48, Math.floor(CELL * 0.2));
    const x = Math.round(cx * CELL + margin + h1 * (CELL - margin * 2)), z = Math.round(cz * CELL + margin + h2 * (CELL - margin * 2));
    const info = world.colInfo(x, z); const sea = seaLevel();
    let v = null;
    if (info.lost || info.lostRim) { villages.set(id, null); return null; }
    if (info.h > sea + 2 && info.h < 68) {
      let sum = 0, sum2 = 0, n = 0, water = false;
      for (let dx = -11; dx <= 11; dx += 2) for (let dz = -11; dz <= 11; dz += 2) { const ci = world.colInfo(x + dx, z + dz); if (ci.h <= sea + 1 || ci.lost || ci.lostRim) water = true; sum += ci.h; sum2 += ci.h * ci.h; n++; }
      const mean = sum / n, varc = sum2 / n - mean * mean;
      if (!water && varc < (STYLE === 'land' ? 12 : 16)) {
        v = { id, x, z, y: Math.round(mean), type: 'land', style: STYLE };
        // on Earth the dry places get frontier towns: every desert village and some of the plains ones
        if (STYLE === 'land' && (info.biome === BIOME.DESERT || (info.biome === BIOME.PLAINS && U.hash3(cx, 73, cz, 0x5EED) < 0.3))) v.style = 'frontier';
      }
    } else if (world.preset.water && info.h < SEA - 2) {
      let allWater = true, minH = 99;
      for (let dx = -12; dx <= 12; dx += 3) for (let dz = -12; dz <= 12; dz += 3) { const ci = world.colInfo(x + dx, z + dz); if (ci.h > SEA - 2) allWater = false; minH = Math.min(minH, ci.h); }
      if (allWater) v = minH < SEA - 11 ? { id, x, z, y: Math.max(14, Math.round(info.h)), type: 'deep', style: 'deep' } : { id, x, z, y: SEA + 1, type: 'sea', style: 'sea' };
      // a dome in a reef region is Atlantis: bigger, older, sea people
      if (v && v.type === 'deep' && U.vnoise2(x, z, 384, WORLD_W, world.seed + 921) > 0.6) v.style = 'atlantis';
    }
    if (v && dist2d(x, z, world.spawn.x, world.spawn.z) < 120) v = null;
    if (v) { v.name = nameFor(id, v.style); v.dist = dist2d(x, z, world.spawn.x, world.spawn.z); v.tier = Math.floor(v.dist / 300) + (v.style === 'atlantis' ? 2 : 0); v.zoneBase = world.preset.zoneBase || 0; v.npcs = []; v.boss = null; v.elder = null; v.amen = FULL; v.guardEnts = []; }
    villages.set(id, v);
    return v;
  }
  function foundedRecord(f) {
    let v = villages.get(f.id);
    if (!v) { v = { id: f.id, x: f.x, z: f.z, y: f.y, type: 'land', name: f.name, dist: dist2d(f.x, f.z, world.spawn.x, world.spawn.z), tier: 0, npcs: [], boss: null, elder: null, founded: true, amen: f.amen || {}, signCount: f.signCount || 0, wallTier: f.wallTier || 0, guardEnts: [] }; villages.set(f.id, v); const st = state(f.id); st.stamped = true; st.freed = true; if (!st.income) st.income = incomeFor(v, st); }
    return v;
  }
  function recordFor(id) {
    if (villages.get(id)) return villages.get(id);
    if (id === 'start') { if (G.village && world.preset.id === 'earth') restoreStart(G.village); return villages.get('start') || null; }
    const f = (G.founded || []).find(x => x.id === id); if (f) return world.preset.id === 'earth' ? foundedRecord(f) : null;
    const m = /^([a-z]*)(-?\d+),(-?\d+)$/.exec(id); if (m && m[1] === PREFIX) return siteFor(+m[2], +m[3]);
    return null; // a village of another world
  }
  // a village of another world, as much of it as the ledger and the night need: name, type, tier, where it stands
  function metaRecord(id, st) { const m = st.meta; if (!m) return null; return { id, x: m.x, z: m.z, y: m.y, name: m.name, type: m.type, style: m.style, tier: m.tier, zoneBase: m.zoneBase || 0, founded: !!m.founded, npcs: [], guardEnts: [], amen: FULL, offWorld: true }; }
  function remember(v, st) { if (!st.meta) st.meta = { x: v.x, z: v.z, y: v.y, name: v.name, type: v.type, style: v.style || v.type, tier: v.tier, zoneBase: v.zoneBase || 0, founded: !!v.founded, world: world.preset.id }; }
  // the map wraps: keep a village's coordinates in the same frame as the player, so its people and its tyrant stand where you are
  function frame(v, px, pz) {
    const sx = Math.round((px - v.x) / WORLD_W) * WORLD_W, sz = Math.round((pz - v.z) / WORLD_W) * WORLD_W;
    if (!sx && !sz) return;
    v.x += sx; v.z += sz;
    const mv = (o) => { if (!o) return; o.x += sx; o.z += sz; if (o.home) { o.home.x += sx; o.home.z += sz; } if (o.tx != null) { o.tx += sx; o.tz += sz; } if (o.post) { o.post.x += sx; o.post.z += sz; } if (o.patrol) { o.patrol.ax += sx; o.patrol.bx += sx; o.patrol.az += sz; o.patrol.bz += sz; } };
    for (const n of v.npcs || []) mv(n); for (const g of v.guardEnts || []) mv(g); mv(v.boss); for (const e of v.lieus || []) mv(e);
    for (const e of (v.raid && v.raid.raiders) || []) mv(e);
    if (v.signs) for (const k in v.signs) for (const s of v.signs[k]) { s.x += sx; s.z += sz; }
  }
  function allKnownSites(px, pz, cells = 2) {
    const out = [];
    if (!world.preset.villages) return out;
    const cx0 = Math.floor(U.mod(px, WORLD_W) / CELL), cz0 = Math.floor(U.mod(pz, WORLD_W) / CELL);
    for (let dx = -cells; dx <= cells; dx++) for (let dz = -cells; dz <= cells; dz++) { const v = siteFor(cx0 + dx, cz0 + dz); if (v) out.push(v); }
    if (world.preset.id === 'earth') {
      const st = villages.get('start'); if (st && !out.includes(st)) out.push(st);
      for (const f of (G.founded || [])) { const v = foundedRecord(f); if (!out.includes(v)) out.push(v); }
    }
    return out;
  }
  // the fisherman sends you to the nearest tyrant, but a swim counts for more than a walk and a dive for more still
  function nearestUnfreed(px, pz, excludeStart) {
    let best = null, bd = Infinity;
    for (const v of allKnownSites(px, pz, 3)) { if (isFreed(v.id) || (excludeStart && v.id === 'start')) continue; const d = dist2d(v.x, v.z, px, pz) * (v.type === 'sea' ? 1.7 : v.type === 'deep' ? 2.4 : 1); if (d < bd) { bd = d; best = v; } }
    return best;
  }

  // ---- hermits: one cave per cell, somewhere between the villages, each with a job for you ----
  const HERMIT_NAMES = ['Old Varn', 'Mother Isk', 'Brother Tollin', 'Grey Ada', 'Hob', 'Sister Wen', 'Dunmer', 'Quill', 'Mossy Pike', 'Aunt Ferra'];
  const HERMIT_JOBS = [
    { give: { berry: 8 }, get: { tonic_heal: 2 }, shards: 15, line: 'My jam pot is empty. Eight berries and I will share the tonic.' },
    { give: { glowworm: 3 }, get: { torch: 8 }, shards: 10, line: 'Three glowworms. My lamps have gone dark.' },
    { give: { ember: 3 }, get: { snare: 2 }, shards: 20, line: 'Ember Ore for my stove, three lumps. I keep snares I never use.' },
    { give: { iron: 4 }, get: { snare2: 1 }, shards: 30, line: 'Four iron. I have a void snare I am too old to throw.' },
    { give: { frond: 10 }, get: { tonic_vigor: 1 }, shards: 20, line: 'Fronds for my bedding, ten of them.' },
    { give: { stone: 16 }, get: { ess_Stone: 1 }, shards: 15, line: 'Sixteen stone to mend my wall and the essence is yours.' },
    { give: { wood: 10 }, get: { bread: 3 }, shards: 15, line: 'Ten logs for the winter. I bake, when there is wood.' },
    { give: { copper: 3 }, get: { ess_Spark: 1 }, shards: 20, line: 'Copper. Three. Do not ask what for.' },
    { give: { snow: 6 }, get: { ess_Frost: 1 }, shards: 20, line: 'Six snow from the heights, packed tight.' },
    { give: { void: 2 }, get: { tonic_revive: 1 }, shards: 40, line: 'Two void crystals. In return, something that wakes the fainted.' },
    { give: { sand: 10 }, get: { glass: 8 }, shards: 10, line: 'Ten sand. I melt it into windows nobody looks through.' },
    { give: { cloud: 3 }, get: { ess_Light: 1 }, shards: 30, line: 'Cloudstone, from up there. Three pieces.' },
  ];
  const HERMIT_WORLD = {
    moon: { names: ['Old Vruk', 'Mother Zyl', 'Ixthu the Quiet', 'Grey Oom', 'Kelp-Eye', 'Sister Qa', 'Dunmer of the Mare', 'Yrr', 'Thrum', 'Aunt Vexa'],
      jobs: [
        { give: { selenite: 3 }, get: { tonic_heal: 2 }, shards: 25, line: 'Selenite. Three crystals. My lamps have gone pale.' }, { give: { tycho: 2 }, get: { snare2: 1 }, shards: 35, line: 'Tycho ore, two lumps. I keep a snare I cannot throw.' },
        { give: { starsalt: 4 }, get: { tonic_vigor: 1 }, shards: 30, line: 'Starsalt from the crater floors. Four handfuls.' }, { give: { stone: 16 }, get: { ess_Stone: 1 }, shards: 15, line: 'Sixteen stone to mend my wall.' },
        { give: { iron: 4 }, get: { ess_Light: 1 }, shards: 30, line: 'Four iron. Do not ask what for.' }, { give: { void: 2 }, get: { tonic_revive: 1 }, shards: 40, line: 'Two void crystals, and I wake the fainted for you.' },
        { give: { sand: 10 }, get: { glass: 8 }, shards: 10, line: 'Ten sand from the craters. I melt it.' }, { give: { copper: 3 }, get: { ess_Spark: 1 }, shards: 20, line: 'Copper. Three.' },
      ],
      lore: ['Selenite glows pale in the rock, not deep. Tycho is the blue-grey one, lower down.', 'Starsalt crusts the crater floors. The Nectar Vat pays for it.', 'The worms of the Mare hear your feet. Walk the highlands, or walk soft.', 'There is one of us that is not one of us: the Selenaut, far out, in a light no lamp makes. Nothing near it is less than a hundred strong.', 'Sixteen Kin in a table. I saw it done once.', 'A dome of selenite glass over a village and nothing gets in. Nothing.'] },
    halo: { names: ['Old Besh', 'Mother Ashti', 'Halim the Patient', 'Grey Rook', 'Dune-Eye', 'Sister Zora', 'Doru of the Flats', 'Yani', 'Kadu', 'Aunt Sefa'],
      jobs: [
        { give: { amber: 3 }, get: { tonic_heal: 2 }, shards: 25, line: 'Amber. Three pieces. I carve.' }, { give: { sulfur: 4 }, get: { snare2: 1 }, shards: 30, line: 'Sulfur, four lumps, for my stove.' },
        { give: { ringshard: 1 }, get: { tonic_might: 1 }, shards: 80, line: 'A ring shard. One. The sky drops them in the storms.' }, { give: { stone: 16 }, get: { ess_Flame: 1 }, shards: 15, line: 'Sixteen stone. My roof.' },
        { give: { iron: 4 }, get: { ess_Spark: 1 }, shards: 30, line: 'Four iron.' }, { give: { void: 2 }, get: { tonic_revive: 1 }, shards: 40, line: 'Two void crystals, and I wake the fainted.' },
        { give: { sand: 10 }, get: { glass: 8 }, shards: 10, line: 'Ten dune sand. Glass, after.' }, { give: { copper: 3 }, get: { ess_Light: 1 }, shards: 20, line: 'Copper. Three.' },
      ],
      lore: ['Amber sits in the rock under the dunes. Sulfur crusts the flats; do not drink the brine.', 'When the sky whistles, move. The ring drops shards that flatten a house.', 'The Ringwarden roosts on the highest mesa. Nothing that lives near it is under three hundred strong.', 'The Caravan Store pays for ring shards. Sixty, last I asked.', 'Brine eats skin. A Lava Suit keeps it off.'] },
  };
  const hermitWorld = () => HERMIT_WORLD[world.preset.id] || null;
  const HERMIT_LORE = ['The orange-flecked stone is Ember Ore. A few blocks down, never deep.', 'Glowworms sit in the grass at night. Pinch one, add wood: torches.', 'Every tyrant keeps guards on the road. They come at you one by one; bring tonics.', 'Put a Kin in a village as a guard and it grows on the job.', 'There is a village under the sea. Swim down the shaft in its roof.', 'Sixteen Kin in a table. I saw it done once. The ground shook.', 'The Core is lava. The Lava Suit is five iron, three void, four ember.', 'Mountains freeze you without a cloak: fronds, snow, wood.', 'Stand behind a Kin that has not seen you and the snare never misses.'];
  const hermits = new Map();
  function hermitFor(cx, cz) {
    if (!world.preset.villages) return null;
    cx = U.mod(cx, NC); cz = U.mod(cz, NC);
    const id = 'h' + PREFIX + cx + ',' + cz;
    if (hermits.has(id)) return hermits.get(id);
    const h1 = U.hash3(cx, 81, cz, 0x5EED), h2 = U.hash3(cx, 82, cz, 0x5EED);
    const margin = Math.min(24, Math.floor(CELL * 0.12));
    const x = Math.round(cx * CELL + margin + h1 * (CELL - margin * 2)), z = Math.round(cz * CELL + margin + h2 * (CELL - margin * 2));
    const info = world.colInfo(x, z); const sea = seaLevel();
    let h = null;
    if (info.h > sea + 4 && info.h < 70 && !info.lost && !info.lostRim && dist2d(x, z, world.spawn.x, world.spawn.z) > 60) {
      const v = siteFor(cx, cz);
      if (!v || dist2d(v.x, v.z, x, z) > 60) {
        const r = U.combine(0x4E4, cx, cz);
        let best = null; for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const hh = world.colInfo(x + ax * 4, z + az * 4).h; if (!best || hh < best.h) best = { h: hh, ax, az }; } // the mouth faces downhill
        const names = hermitWorld() ? hermitWorld().names : HERMIT_NAMES;
        h = { id, x, z, y: info.h + 1, ax: best.ax, az: best.az, name: names[r % names.length], npcs: null };
      }
    }
    hermits.set(id, h);
    return h;
  }
  function hermitState(id) { if (!G.poiState) G.poiState = {}; if (!G.poiState[id]) G.poiState[id] = { stamped: false, done: {} }; return G.poiState[id]; }
  // a room cut into the hillside: stone walls, a torch, a bed, a stove, two log posts at the mouth
  function stampHermit(h) {
    const ax = h.ax, az = h.az, px = az ? 1 : 0, pz = ax ? 1 : 0; // ax,az points out of the mouth; px,pz runs across it
    const y0 = h.y; const set = (x, y, z, id) => world.setBlock(x, y, z, id);
    for (let d = -4; d <= 2; d++) for (let s = -2; s <= 2; s++) {
      const x = h.x + ax * d + px * s, z = h.z + az * d + pz * s;
      if (d > 0) { for (let y = y0; y <= y0 + 3; y++) { const b = world.getBlock(x, y, z); if (b !== B.AIR && b !== B.WATER) set(x, y, z, B.AIR); } if (!isSolid(world.getBlock(x, y0 - 1, z))) set(x, y0 - 1, z, B.DIRT); continue; }
      const wall = Math.abs(s) === 2 || d === -4;
      for (let y = y0 - 1; y <= y0 + 3; y++) {
        if (y === y0 - 1 || y === y0 + 3) set(x, y, z, B.STONE);
        else set(x, y, z, wall ? B.STONE : B.AIR);
      }
    }
    const moon = world.preset.id === 'moon', halo = world.preset.id === 'halo';
    set(h.x - ax * 3 + px, y0, h.z - az * 3 + pz, moon ? B.REGOLITH : halo ? B.SALTCRUST : B.PLANKS); set(h.x - ax * 3 + px, y0 + 1, h.z - az * 3 + pz, moon ? B.STARSALT : B.SNOW); // the bed
    set(h.x - ax * 3 - px, y0, h.z - az * 3 - pz, halo ? B.SULFUR : B.EMBER); // the stove
    set(h.x - ax * 2, y0 + 2, h.z - az * 2, moon ? B.MOONGLOW : B.TORCH);
    for (const s of [-2, 2]) { const x = h.x + ax * 1 + px * s, z = h.z + az * 1 + pz * s; for (let y = y0; y <= y0 + 1; y++) set(x, y, z, moon ? B.BASALT : halo ? B.STONE : B.LOG); set(x, y0 + 2, z, moon ? B.MOONGLOW : B.TORCH); }
  }
  let activeHermit = null;
  function updateHermits(player, dt) {
    const cx0 = Math.floor(U.mod(player.x, WORLD_W) / CELL), cz0 = Math.floor(U.mod(player.z, WORLD_W) / CELL);
    let near = null, nd = Infinity;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const h = hermitFor(cx0 + dx, cz0 + dz); if (!h) continue; const d = dist2d(h.x, h.z, player.x, player.z); if (d < nd) { nd = d; near = h; } }
    if (!near || nd > 70) { activeHermit = null; return; }
    frame(near, player.x, player.z);
    const st = hermitState(near.id);
    if (!st.stamped) { world.ensureAround(Math.floor(near.x / CH), Math.floor(near.z / CH), 1, 999); stampHermit(near); st.stamped = true; UI.toast(`A hermit's cave. ${near.name} lives here.`); }
    if (!near.npcs) { const gy = standY(near.x - near.ax * 2 + 0.5, near.y, near.z - near.az * 2 + 0.5) ?? near.y; const n = makeNpc(60, 'hermit', near.x - near.ax * 2, near.z - near.az * 2, near.name, null, gy, near.id); n.wander = false; n.hermit = near; near.npcs = [n]; }
    activeHermit = near;
    for (const n of near.npcs) { const dx = player.x - n.x, dz = player.z - n.z; if (Math.hypot(dx, dz) < 6) n.yaw = Math.atan2(dx, dz); n.bob = (n.bob || 0) + dt; }
  }
  function hermitJob(h) { const day = G.dayCount || 0; const jobs = hermitWorld() ? hermitWorld().jobs : HERMIT_JOBS; return jobs[U.combine(U.strHash(h.id), day) % jobs.length]; }
  function talkHermit(n) {
    const h = n.hermit; const st = hermitState(h.id); const day = G.dayCount || 0; const job = hermitJob(h);
    const lores = hermitWorld() ? hermitWorld().lore : HERMIT_LORE;
    const lore = lores[U.combine(U.strHash(h.id), day, 7) % lores.length];
    if (st.done[day]) { Dialogue.show(n.name, ['Done for today. Come back tomorrow, I always need something.', lore]); return; }
    const give = Object.keys(job.give).map(k => `${job.give[k]} ${ITEMS[k].name}`).join(' and '); const get = Object.keys(job.get).map(k => `${job.get[k] > 1 ? job.get[k] + ' ' : ''}${ITEMS[k].name}`).join(', ');
    Dialogue.show(n.name, [job.line, `${give} for ${get} and ${job.shards} Shards. ${lore}`], () => UI.openPanel('shop', { title: n.name, keeper: 'hermit', greet: `${give} for ${get} and ◆ ${job.shards}.`, stock: [{ barter: job.give, item: Object.keys(job.get)[0], n: job.get[Object.keys(job.get)[0]], hermit: h, shards: job.shards }] }));
  }

  // ---- the starter village: placed near spawn ----
  function pickStartSite(spawn) {
    let best = null;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2, d = world.preset.id === 'earth' ? 50 : 34;
      const cx = Math.round(spawn.x + Math.cos(a) * d), cz = Math.round(spawn.z + Math.sin(a) * d);
      let sum = 0, sum2 = 0, n = 0, water = false;
      for (let dx = -11; dx <= 11; dx += 2) for (let dz = -11; dz <= 11; dz += 2) { const info = world.colInfo(cx + dx, cz + dz); if (info.h <= SEA + 1) water = true; sum += info.h; sum2 += info.h * info.h; n++; }
      if (water) continue;
      const mean = sum / n, varc = sum2 / n - mean * mean;
      if (!best || varc < best.varc) best = { x: cx, z: cz, y: Math.round(mean), varc };
    }
    return best;
  }
  function startRecord(x, y, z) { const v = { id: 'start', x, z, y, type: 'land', name: nameFor('start'), dist: 0, tier: 0, npcs: [], boss: null, elder: null, starter: true, amen: FULL, guardEnts: [] }; if (world.preset.id === 'earth') { v.size = 'start'; v.R = TOWN_R.start; } return v; }
  function stamp(spawn) {
    const site = pickStartSite(spawn) || { x: Math.round(spawn.x + 34), z: Math.round(spawn.z), y: Math.round(spawn.y) };
    const v = startRecord(site.x, site.y, site.z);
    villages.set('start', v);
    const st = state('start');
    if (v.R) { st.R = v.R; patchLoaded(v); } else stampLand(v); stampWall(v, st);
    st.stamped = true;
    // a corridor from spawn to the village so it can be seen from camp
    const sx = Math.floor(spawn.x), sz = Math.floor(spawn.z);
    const steps = Math.ceil(Math.hypot(v.x - sx, v.z - sz));
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(sx + (v.x - sx) * i / steps), z = Math.round(sz + (v.z - sz) * i / steps);
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let y = Math.min(v.y, Math.floor(spawn.y)); y < Math.max(v.y, Math.floor(spawn.y)) + 9; y++) { const b = world.getBlock(x + dx, y, z + dz); if (b === B.LOG || isLeaf(b)) world.setBlock(x + dx, y, z + dz, B.AIR); }
    }
    placeFisher(v);
    return { x: v.x, y: v.y, z: v.z };
  }
  // the fisherman's spot: a shoreline column within reach of the first village, water at least two deep just off it
  function placeFisher(v) {
    let spot = null, fallback = null;
    for (let r = 20; r < 700 && !spot; r += 8) for (let a = 0; a < Math.PI * 2 && !spot; a += 0.25) {
      const x = Math.round(v.x + Math.cos(a) * r), z = Math.round(v.z + Math.sin(a) * r);
      const info = world.colInfo(x, z);
      if (info.h < SEA - 1 || info.h > SEA + 2) continue;
      // a shore column: water at least two deep a few blocks further out, in some direction
      for (const b of [a, a + 0.8, a - 0.8, a + 1.6, a - 1.6, a + Math.PI]) {
        const ci = world.colInfo(x + Math.round(Math.cos(b) * 3), z + Math.round(Math.sin(b) * 3));
        if (ci.h < SEA - 1) { spot = { x, z, a: b }; break; }
        if (!fallback && ci.h < SEA) fallback = { x, z, a: b };
      }
    }
    G.fisherSpot = spot || fallback || null;
  }
  function ensureFisher() {
    if (fisher || !G.fisherSpot || !world.preset.fisher) return;
    const s = G.fisherSpot;
    if (dist2d(s.x, s.z, G.player.x, G.player.z) > 160) return; // build the jetty when you get near
    world.ensureAround(Math.floor(s.x / CH), Math.floor(s.z / CH), 1, 99);
    const gy = Math.max(SEA, world.groundY(s.x, s.z));
    const ux = Math.round(Math.cos(s.a)), uz = Math.round(Math.sin(s.a));
    for (let i = 0; i <= 4; i++) {
      const x = s.x + ux * i, z = s.z + uz * i;
      for (let y = gy + 1; y <= gy + 3; y++) { const b = world.getBlock(x, y, z); if (b !== B.AIR && b !== B.WATER) world.setBlock(x, y, z, B.AIR); }
      if (i > 0) world.setBlock(x, gy, z, B.PLANKS);
    }
    world.setBlock(s.x - ux, gy + 1, s.z - uz, B.TORCH);
    { const px = s.x - ux * 3 + (uz ? 2 : 0), pz = s.z - uz * 3 + (ux ? 2 : 0); const py = world.groundY(px, pz, gy + 6); for (let y = py + 1; y <= py + 3; y++) if (world.getBlock(px, y, pz) !== B.AIR) world.setBlock(px, y, pz, B.AIR); if (!isSolid(world.getBlock(px, py, pz))) world.setBlock(px, py, pz, B.STONE); world.setBlock(px, py + 1, pz, B.PORTAL); G.fisherSpot.portal = { x: px, y: py + 1, z: pz }; }
    fisher = makeNpc(99, 'fisher', s.x + ux * 3, s.z + uz * 3, 'Old Brannock', null, gy + 1, 'shore');
    fisher.wander = false; fisher.yaw = Math.atan2(Math.cos(s.a), Math.sin(s.a));
  }

  // ---- stamps ----
  // what each style of village is built from: the ground it levels, the square, the posts and lamps, the houses
  const MATS = {
    land: { ground: B.GRASS, under: B.DIRT, plaza: B.GRAVEL, plazaEdge: B.STONE, post: B.LOG, light: B.TORCH, floor: B.PLANKS, wall: B.PLANKS, window: B.GLASS, roof: B.LOG, eave: B.PLANKS, counter: B.PLANKS, bush: B.BERRY },
    frontier: { ground: B.SAND, under: B.SAND, plaza: B.SAND, plazaEdge: B.PLANKS, post: B.LOG, light: B.TORCH, floor: B.PLANKS, wall: B.PLANKS, window: B.GLASS, roof: B.PLANKS, eave: B.LOG, counter: B.PLANKS, bush: B.CACTUS, boardwalk: true, saloon: true },
    alien: { ground: B.REGOLITH, under: B.DIRT, plaza: B.STARSALT, plazaEdge: B.BASALT, post: B.BASALT, light: B.MOONGLOW, floor: B.REGOLITH, wall: B.SELGLASS, window: B.SELGLASS, roof: B.SELGLASS, eave: B.SELGLASS, counter: B.BASALT, bush: null, pod: true },
    halo: { ground: B.DUNE, under: B.DIRT, plaza: B.SALTCRUST, plazaEdge: B.STONE, post: B.STONE, light: B.RINGSHARD, floor: B.STONE, wall: B.STONE, window: B.GLASS, roof: B.SALTCRUST, eave: B.STONE, counter: B.STONE, bush: B.SULFUR },
  };
  let MAT = MATS.land;
  function stampLand(v) {
    const vx = v.x, vz = v.z, vy = v.y; MAT = MATS[v.style] || MATS.land; const M = MAT;
    const set = (x, y, z, id) => world.setBlock(x, y, z, id);
    for (let dx = -12; dx <= 12; dx++) for (let dz = -12; dz <= 12; dz++) {
      const x = vx + dx, z = vz + dz;
      const edge = Math.max(Math.abs(dx), Math.abs(dz)) > 10;
      for (let y = vy - 4; y <= vy + 10; y++) {
        const b = world.getBlock(x, y, z);
        if (y < vy - 1) { if (!isSolid(b) || isLeaf(b) || b === B.LOG) set(x, y, z, M.under); }
        else if (y === vy - 1) { if (b !== M.ground && !edge) set(x, y, z, M.ground); else if (!isSolid(b) || isLeaf(b) || b === B.LOG) set(x, y, z, M.ground); }
        else if (!edge || isLeaf(b) || b === B.LOG) { if (b !== B.AIR) set(x, y, z, B.AIR); }
      }
    }
    for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) set(vx + dx, vy - 1, vz + dz, (Math.abs(dx) === 3 || Math.abs(dz) === 3) ? M.plazaEdge : M.plaza);
    set(vx, vy, vz, B.FUSION);
    for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) { set(vx + dx, vy, vz + dz, M.post); set(vx + dx, vy + 1, vz + dz, M.light); }
    const build = M.pod ? pod : house;
    build(vx - 9, vz - 9, vy, 1, 0, B.EMBER, furnishBakery);
    build(vx + 9, vz - 9, vy, -1, 0, B.BERRY, furnishJuice);
    build(vx - 9, vz + 9, vy, 1, 0, B.COPPER, furnishTrader);
    build(vx + 9, vz + 9, vy, -1, 0, B.CLOUD, furnishElder);
    build(vx, vz + 10, vy, 0, -1, B.VOID, furnishVoodoo);
    if (M.saloon) { set(vx + 9 - 3, vy, vz - 9, B.DOOR); } // the saloon: swinging doors in the juice bar's doorway
    for (const [dx, dz] of [[-9, -5], [9, -5], [-9, 5], [9, 5], [0, 6]]) { set(vx + dx, vy, vz + dz, M.post); set(vx + dx, vy + 1, vz + dz, M.light); }
    if (M.boardwalk) { // plank walks along the fronts of the houses and a hitching rail by the square
      for (let d = -12; d <= 12; d++) { for (const [x, z] of [[vx - 5, vz + d], [vx + 5, vz + d], [vx + d, vz - 5], [vx + d, vz + 5]]) if (Math.abs(d) > 3 && world.getBlock(x, vy, z) === B.AIR) set(x, vy - 1, z, B.PLANKS); }
      for (let d = -2; d <= 2; d++) { set(vx + d, vy, vz - 4, d % 2 ? B.LOG : B.AIR); }
    }
    set(vx + 5, vy, vz - 5, B.PORTAL); set(vx + 5, vy - 1, vz - 5, M.plazaEdge);
    const r = U.rng(U.combine(world.seed, U.strHash(v.id)));
    if (M.bush) for (let i = 0; i < 14; i++) {
      const a = r() * Math.PI * 2, d = 9 + r() * 3; const x = Math.round(vx + Math.cos(a) * d), z = Math.round(vz + Math.sin(a) * d);
      if (world.getBlock(x, vy - 1, z) === M.ground && world.getBlock(x, vy, z) === B.AIR) set(x, vy, z, M.bush);
    }
  }
  // a 7x7 house: floor, walls with windows, a roof with eaves, a marker over the door and a lamp inside; materials from the style
  function house(hx, hz, vy, dirX, dirZ, marker, furnish) {
    const M = MAT; const set = (x, y, z, id) => world.setBlock(x, y, z, id);
    for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
      set(hx + dx, vy - 1, hz + dz, M.floor);
      const wall = Math.abs(dx) === 3 || Math.abs(dz) === 3;
      for (let y = vy; y <= vy + 2; y++) {
        let id = wall ? M.wall : B.AIR;
        if (wall && y === vy + 1 && ((Math.abs(dx) === 3 && Math.abs(dz) === 1) || (Math.abs(dz) === 3 && Math.abs(dx) === 1))) id = M.window;
        set(hx + dx, y, hz + dz, id);
      }
      set(hx + dx, vy + 3, hz + dz, M.roof);
      for (let y = vy + 4; y <= vy + 7; y++) if (world.getBlock(hx + dx, y, hz + dz) !== B.AIR) set(hx + dx, y, hz + dz, B.AIR);
    }
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) if (Math.abs(dx) === 4 || Math.abs(dz) === 4) set(hx + dx, vy + 3, hz + dz, M.eave);
    set(hx + dirX * 3, vy, hz + dirZ * 3, B.AIR); set(hx + dirX * 3, vy + 1, hz + dirZ * 3, B.AIR); set(hx + dirX * 3, vy + 2, hz + dirZ * 3, marker);
    set(hx, vy + 2, hz, M.light);
    if (furnish) furnish(hx, hz, dirX, dirZ, vy);
  }
  // an alien pod: a hemisphere of selenite glass on a regolith floor, a doorway cut in the rim, a moonglow keystone
  function pod(hx, hz, vy, dirX, dirZ, marker, furnish) {
    const M = MAT; const set = (x, y, z, id) => world.setBlock(x, y, z, id); const R = 3.6;
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
      set(hx + dx, vy - 1, hz + dz, Math.hypot(dx, dz) <= R ? M.floor : world.getBlock(hx + dx, vy - 1, hz + dz));
      for (let dy = 0; dy <= 4; dy++) {
        const d = Math.hypot(dx, dy + 0.5, dz); const y = vy + dy;
        if (d > R + 0.5) { if (world.getBlock(hx + dx, y, hz + dz) !== B.AIR) set(hx + dx, y, hz + dz, B.AIR); continue; }
        set(hx + dx, y, hz + dz, d >= R - 0.5 ? M.wall : B.AIR);
      }
    }
    set(hx, vy + 3, hz, M.light);
    set(hx + dirX * 3, vy, hz + dirZ * 3, B.AIR); set(hx + dirX * 3, vy + 1, hz + dirZ * 3, B.AIR); set(hx + dirX * 3, vy + 2, hz + dirZ * 3, marker);
    set(hx + dirX * 4, vy, hz + dirZ * 4, B.AIR); set(hx + dirX * 4, vy + 1, hz + dirZ * 4, B.AIR);
    if (furnish) furnish(hx, hz, dirX, dirZ, vy);
  }
  const counter = (hx, hz, dirX, dirZ, vy) => { for (let i = -1; i <= 1; i++) world.setBlock(hx - dirX * 1 + (dirZ ? i : 0), vy, hz - dirZ * 1 + (dirX ? i : 0), MAT.counter); };
  const side = (hx, hz, dirX, dirZ, vy, s, lo, hi) => { world.setBlock(hx + (dirZ ? 2 * s : 0), vy, hz + (dirX ? 2 * s : 0), lo); world.setBlock(hx + (dirZ ? 2 * s : 0), vy + 1, hz + (dirX ? 2 * s : 0), hi); };
  function furnishBakery(hx, hz, dx, dz, vy) { counter(hx, hz, dx, dz, vy); side(hx, hz, dx, dz, vy, 1, B.BASALT, B.EMBER); side(hx, hz, dx, dz, vy, -1, B.PLANKS, B.BERRY); }
  function furnishJuice(hx, hz, dx, dz, vy) { counter(hx, hz, dx, dz, vy); side(hx, hz, dx, dz, vy, 1, B.BERRY, B.AIR); side(hx, hz, dx, dz, vy, -1, B.LOG, B.SNOW); }
  function furnishTrader(hx, hz, dx, dz, vy) { counter(hx, hz, dx, dz, vy); side(hx, hz, dx, dz, vy, 1, B.COPPER, B.IRON); side(hx, hz, dx, dz, vy, -1, B.LOG, B.VOID); }
  function furnishElder(hx, hz, dx, dz, vy) { world.setBlock(hx - dx * 2 + (dz ? 1 : 0), vy, hz - dz * 2 + (dx ? 1 : 0), B.PLANKS); world.setBlock(hx - dx * 2 + (dz ? 1 : 0), vy + 1, hz - dz * 2 + (dx ? 1 : 0), B.SNOW); side(hx, hz, dx, dz, vy, -1, B.LOG, B.CLOUD); }
  function furnishVoodoo(hx, hz, dx, dz, vy) { counter(hx, hz, dx, dz, vy); side(hx, hz, dx, dz, vy, 1, B.BASALT, B.VOID); side(hx, hz, dx, dz, vy, -1, B.BASALT, B.EMBER); }
  function furnishPost(hx, hz, dx, dz, vy) { counter(hx, hz, dx, dz, vy); side(hx, hz, dx, dz, vy, 1, B.IRON, B.GLASS); side(hx, hz, dx, dz, vy, -1, B.PLANKS, B.CLOUD); }
  const FURNISH = { bakery: furnishBakery, juice: furnishJuice, trader: furnishTrader, voodoo: furnishVoodoo, post: furnishPost, armoury: furnishTrader, armourer: furnishTrader, alchemist: furnishJuice, inn: furnishBakery, restaurant: furnishBakery, sanctuary: furnishVoodoo, stables: furnishJuice, aerie: furnishPost, station: furnishPost, elder: furnishElder, tailor: furnishJuice, barber: furnishJuice, kinmarket: furnishBakery, kinshow: furnishElder, mirror: furnishPost, designer: furnishJuice, kinwear: furnishBakery, enchanter: furnishVoodoo, cartographer: furnishPost, daycare: furnishBakery };

  // ---- portals: every village has an arch; held villages' arches are dead, yours link up ----
  function portalBlock(v) { return v.type === 'land' ? { x: v.x + 5, y: v.y, z: v.z - 5 } : v.type === 'sea' ? { x: v.x - 3, y: v.y, z: v.z - 2 } : { x: v.x + 4, y: v.y, z: v.z - 4 }; }
  function ensurePortal(v) { if (v.founded || v.R) return; const s = portalBlock(v); const x = s.x, z = s.z; if (world.getBlock(x, s.y, z) !== B.PORTAL) { world.setBlock(x, s.y, z, B.PORTAL); if (!isSolid(world.getBlock(x, s.y - 1, z))) world.setBlock(x, s.y - 1, z, B.STONE); for (let y = s.y + 1; y <= s.y + 2; y++) if (world.getBlock(x, y, z) !== B.AIR) world.setBlock(x, y, z, B.AIR); } }
  function portalSpot(v) { return v.type === 'land' ? { x: v.x + 5.5, y: v.y, z: v.z - 3.5 } : v.type === 'sea' ? { x: v.x - 2.5, y: v.y, z: v.z - 0.5 } : { x: v.x + 4.5, y: v.y, z: v.z - 2.5 }; }
  function portalList(fromId) {
    const out = [];
    for (const id in (G.villageState || {})) { const st = G.villageState[id]; if (!st.freed || id === fromId) continue; const v = recordFor(id); if (!v) continue; out.push({ id, name: v.name, type: v.type, style: v.style, spot: v.founded ? { x: v.x + 0.5, y: v.y, z: v.z + 2.5 } : portalSpot(v) }); }
    if (G.fisherSpot && world.preset.fisher && fromId !== 'shore') { const s = G.fisherSpot; out.push({ id: 'shore', name: 'Brannock\'s shore', type: 'shore', spot: { x: s.x + 0.5, y: null, z: s.z + 0.5 } }); }
    if (world.pad && fromId !== 'pad') out.push({ id: 'pad', name: 'The landing pad', type: 'pad', spot: { x: world.pad.x + 2, y: null, z: world.pad.z } });
    // the other worlds: once a body's legendary is beaten, every arch reaches it and its arches reach back
    const legends = G.stats.legends || {};
    for (const id of ['earth', 'moon', 'halo']) { if (id === world.preset.id) continue; const open = id === 'earth' ? !!(legends.moon || legends.halo) : !!legends[id]; if (open) out.push({ id: 'world:' + id, name: id === 'earth' ? 'Earth' : PRESETS[id].name, type: 'world', world: id, spot: { x: 0, y: null, z: 0 } }); }
    if (world.preset.id === 'earth' && (!G.villageState.start || !G.villageState.start.freed)) return out.filter(d => d.id !== 'start');
    return out.filter(d => d.id !== fromId);
  }
  function portalHere(x, z) {
    if (G.fisherSpot && world.preset.fisher && dist2d(G.fisherSpot.x, G.fisherSpot.z, x, z) < 14) return { v: { id: 'shore', name: 'Brannock\'s shore' } };
    if (world.pad && dist2d(world.pad.x, world.pad.z, x, z) < 8) return { v: { id: 'pad', name: 'The landing pad' } };
    const near = active && dist2d(active.x, active.z, x, z) < 24 ? active : null;
    if (!near) return { err: 'This arch is not in any village you hold.' };
    if (!state(near.id).freed) return { err: 'The arch is dead while the tyrant holds the village.' };
    return { v: near };
  }
  // ---- kits: whole buildings, walls and bridges from the Craft menu, raised where you tap ----
  function placeKit(kind, item, hit, p) {
    const info = ITEMS[item];
    if (!hit) return 'Look at the ground where it should stand.';
    const dx0 = hit.x + 0.5 - p.x, dz0 = hit.z + 0.5 - p.z;
    const [ax, az] = Math.abs(dx0) >= Math.abs(dz0) ? [Math.sign(dx0) || 1, 0] : [0, Math.sign(dz0) || 1]; // away from you
    const px = az ? 1 : 0, pz = ax ? 1 : 0; // across your view
    if (kind === 'dome') { const v = active; if (!v || dist2d(v.x, v.z, hit.x, hit.z) > 22) return 'Stand inside a village you hold.'; const err = raiseDome(v); if (err) return err; G.player.add('kit_dome', 1); return null; } // raiseDome took the kit; placeKit takes one too
    if (kind === 'portal') { const y = hit.y + 1; if (world.getBlock(hit.x, y, hit.z) !== B.AIR || !isSolid(world.getBlock(hit.x, y - 1, hit.z))) return 'Needs a clear spot on solid ground.'; world.setBlock(hit.x, y, hit.z, B.PORTAL); world.setBlock(hit.x, y + 1, hit.z, B.AIR); world.setBlock(hit.x, y + 2, hit.z, B.AIR); return null; }
    if (kind === 'wall') {
      const blk = info.wallBlock;
      for (let s = -3; s <= 3; s++) { const x = hit.x + px * s, z = hit.z + pz * s; const gy = world.groundY(x, z, hit.y + 4); for (let y = gy + 1; y <= gy + 2; y++) world.setBlock(x, y, z, blk); for (let y = gy + 3; y <= gy + 4; y++) if (isLeaf(world.getBlock(x, y, z))) world.setBlock(x, y, z, B.AIR); }
      return null;
    }
    if (kind === 'bridge') {
      const y = hit.y + 1; let len = 0;
      for (let d = 1; d <= 12; d++) { const x = hit.x + ax * d, z = hit.z + az * d; if (isSolid(world.getBlock(x, y - 1, z)) && !isLeaf(world.getBlock(x, y - 1, z)) && d > 1) break; len = d; }
      if (len < 2) return 'Face a gap: a bridge needs somewhere to go.';
      for (let d = 0; d <= len; d++) for (let s = -1; s <= 1; s++) { const x = hit.x + ax * d + px * s, z = hit.z + az * d + pz * s; world.setBlock(x, y - 1, z, B.PLANKS); for (let yy = y; yy <= y + 2; yy++) { const b = world.getBlock(x, yy, z); if (b !== B.AIR && b !== B.WATER) world.setBlock(x, yy, z, B.AIR); } if (Math.abs(s) === 1 && d % 3 === 1) world.setBlock(x, y, z, B.LOG); }
      return null;
    }
    // a house: centred four blocks beyond the tapped spot, door toward you
    const cx = hit.x + ax * 4, cz = hit.z + az * 4;
    let sum = 0, n = 0; for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) { const g = world.groundY(cx + dx, cz + dz, hit.y + 6); if (g <= SEA - 1) return 'Not over water.'; sum += g; n++; }
    const vy = Math.round(sum / n) + 1;
    if (Math.abs(vy - 1 - hit.y) > 3) return 'Too steep here. Find flatter ground.';
    const marker = kind === 'house' ? B.LOG : SHOP_BUILD[kind].marker; MAT = MATS.land;
    house(cx, cz, vy, -ax, -az, marker, kind === 'house' ? null : FURNISH[kind]);
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) for (let y = vy - 1; y > vy - 5; y--) if (!isSolid(world.getBlock(cx + dx, y, cz + dz))) world.setBlock(cx + dx, y, cz + dz, B.DIRT); // fill under the floor
    return null;
  }
  // the wall: a ring of blocks around the village with a gate on each side; height follows the ground
  const wallRadius = (st) => st.R || (st.expanded ? 18 : 12);
  function isGateCol(dx, dz, wr) { return (Math.abs(dx) === wr && Math.abs(dz) <= 1) || (Math.abs(dz) === wr && Math.abs(dx) <= 1); }
  function ringCols(v, st) {
    const wr = wallRadius(st); const out = [];
    for (let dx = -wr; dx <= wr; dx++) for (let dz = -wr; dz <= wr; dz++) if (Math.max(Math.abs(dx), Math.abs(dz)) === wr) out.push([v.x + dx, v.z + dz, isGateCol(dx, dz, wr)]);
    return out;
  }
  function stampWall(v, st) {
    if (v.type !== 'land' || v.founded) return;
    const vy = v.y, blk = wallSet(v)[st.wall || 0].block, wr = wallRadius(st); const M = MATS[v.style] || MATS.land;
    const set = (x, y, z, id) => world.setBlock(x, y, z, id);
    for (const [x, z, gate] of ringCols(v, st)) {
      const gy = world.groundY(x, z, vy + 6);
      for (let y = Math.min(gy, vy) + 1; y <= vy + 6; y++) { const b = world.getBlock(x, y, z); if (b !== B.AIR && b !== B.WATER) set(x, y, z, B.AIR); }
      if (gate) { if (!isSolid(world.getBlock(x, vy - 1, z))) set(x, vy - 1, z, M.floor); continue; }
      const base = Math.min(gy + 1, vy), top = Math.max(vy + 1, gy + 2);
      for (let y = base; y <= top; y++) set(x, y, z, blk);
      const dx = x - v.x, dz = z - v.z;
      if ((Math.abs(dx) === wr && Math.abs(dz) === 2) || (Math.abs(dz) === wr && Math.abs(dx) === 2)) set(x, top + 1, z, M.light);
    }
    for (const [x, z] of st.holeCols) for (let y = vy; y <= vy + 3; y++) if (world.getBlock(x, y, z) !== B.AIR) set(x, y, z, B.AIR);
  }
  function clearWall(v, st) {
    const vy = v.y; const M = MATS[v.style] || MATS.land;
    for (const [x, z] of ringCols(v, st)) for (let y = vy - 1; y <= vy + 4; y++) { const b = world.getBlock(x, y, z); if (WALL_BLOCKS.has(b)) world.setBlock(x, y, z, y === vy - 1 ? M.ground : B.AIR); }
  }
  function setGates(v, st, closed) {
    if (v.type !== 'land' || v.founded) return;
    const blk = wallSet(v)[st.wall || 0].block, vy = v.y;
    for (const [x, z, gate] of ringCols(v, st)) if (gate) for (let y = vy; y <= vy + 1; y++) world.setBlock(x, y, z, closed ? blk : B.AIR);
    v.gatesClosed = closed;
  }
  // level the ground in the band between the old wall and the new one
  function stampExpansion(v) {
    const vy = v.y; const set = (x, y, z, id) => world.setBlock(x, y, z, id); const M = MATS[v.style] || MATS.land;
    for (let dx = -18; dx <= 18; dx++) for (let dz = -18; dz <= 18; dz++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) < 11) continue;
      const x = v.x + dx, z = v.z + dz;
      for (let y = vy - 4; y <= vy + 8; y++) {
        const b = world.getBlock(x, y, z);
        if (y < vy - 1) { if (!isSolid(b) || isLeaf(b) || b === B.LOG) set(x, y, z, M.under); }
        else if (y === vy - 1) { if (b !== M.ground) set(x, y, z, M.ground); }
        else if (b !== B.AIR && b !== M.bush) set(x, y, z, B.AIR);
      }
    }
  }
  function slotDir(dx, dz) { return Math.abs(dx) >= Math.abs(dz) ? [-Math.sign(dx), 0] : [0, -Math.sign(dz)]; }
  function stampShop(v, slot, kind) {
    const [dx, dz] = SLOTS[slot]; const [dirX, dirZ] = slotDir(dx, dz); MAT = MATS[v.style] || MATS.land;
    (MAT.pod ? pod : house)(v.x + dx, v.z + dz, v.y, dirX, dirZ, SHOP_BUILD[kind].marker, FURNISH[kind]);
  }

  // stilt village: plank platforms above the water joined by walkways, four thatched huts around a square with the table
  function seaPlot(v) { return v.type === 'sea' ? { x: v.x + 22, z: v.z, i: 0, pier: true } : null; }
  function stampPier(v) {
    const pl = seaPlot(v); if (!pl) return; const set = (x, y, z, id) => world.setBlock(x, y, z, id); const y0 = SEA + 1;
    for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) { set(pl.x + a, y0 - 1, pl.z + b, B.PLANKS); if (Math.abs(a) === 4 && Math.abs(b) === 4) { const gy = world.groundY(pl.x + a, pl.z + b, y0 - 2); for (let y = gy + 1; y < y0 - 1; y++) set(pl.x + a, y, pl.z + b, B.LOG); set(pl.x + a, y0, pl.z + b, B.LOG); set(pl.x + a, y0 + 1, pl.z + b, B.TORCH); } }
    for (let d = 13; d <= 17; d++) for (let w = -1; w <= 1; w++) set(v.x + d, y0 - 1, v.z + w, B.PLANKS); // a walkway out from the village
  }
  function stampSea(v) {
    const vx = v.x, vz = v.z, vy = v.y; // vy = SEA + 1, the deck level
    const set = (x, y, z, id) => world.setBlock(x, y, z, id);
    const platform = (px, pz, r) => {
      for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
        set(px + dx, vy - 1, pz + dz, B.PLANKS);
        for (let y = vy; y <= vy + 5; y++) if (world.getBlock(px + dx, y, pz + dz) !== B.AIR) set(px + dx, y, pz + dz, B.AIR);
      }
      for (const [dx, dz] of [[-r, -r], [r, -r], [-r, r], [r, r], [0, -r], [0, r], [-r, 0], [r, 0]]) { const gy = world.groundY(px + dx, pz + dz, vy - 2); for (let y = gy + 1; y < vy - 1; y++) set(px + dx, y, pz + dz, B.LOG); }
    };
    const walkway = (ax, az, bx, bz) => { const n = Math.max(Math.abs(bx - ax), Math.abs(bz - az)); for (let i = 0; i <= n; i++) { const x = Math.round(ax + (bx - ax) * i / n), z = Math.round(az + (bz - az) * i / n); set(x, vy - 1, z, B.PLANKS); for (let y = vy; y <= vy + 3; y++) if (world.getBlock(x, y, z) !== B.AIR) set(x, y, z, B.AIR); if (i % 3 === 1) set(x, vy - 2, z, B.LOG); } };
    platform(vx, vz, 4);
    set(vx, vy, vz, B.FUSION); set(vx - 3, vy, vz - 2, B.PORTAL);
    for (const [dx, dz] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) { set(vx + dx, vy, vz + dz, B.LOG); set(vx + dx, vy + 1, vz + dz, B.TORCH); }
    const huts = [[-11, 0, 1, 0, B.EMBER, furnishBakery], [11, 0, -1, 0, B.BERRY, furnishJuice], [0, -11, 0, 1, B.COPPER, furnishTrader], [0, 11, 0, -1, B.VOID, furnishVoodoo]];
    for (const [hx, hz, dirX, dirZ, marker, furnish] of huts) {
      const cx = vx + hx, cz = vz + hz;
      platform(cx, cz, 4);
      for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
        const wall = Math.abs(dx) === 3 || Math.abs(dz) === 3;
        for (let y = vy; y <= vy + 2; y++) { let id = wall ? B.PLANKS : B.AIR; if (wall && y === vy + 1 && ((Math.abs(dx) === 3 && Math.abs(dz) === 1) || (Math.abs(dz) === 3 && Math.abs(dx) === 1))) id = B.GLASS; set(cx + dx, y, cz + dz, id); }
        set(cx + dx, vy + 3, cz + dz, B.LEAVES); // thatch
      }
      set(cx + dirX * 3, vy, cz + dirZ * 3, B.AIR); set(cx + dirX * 3, vy + 1, cz + dirZ * 3, B.AIR); set(cx + dirX * 3, vy + 2, cz + dirZ * 3, marker);
      set(cx, vy + 2, cz, B.TORCH);
      furnish(cx, cz, dirX, dirZ, vy);
      walkway(vx - dirX * 4, vz - dirZ * 4, cx + dirX * 4, cz + dirZ * 4);
    }
  }
  // dome village on the sea floor: a glass hemisphere full of air, a water shaft down through the top to swim in by, small stone huts
  function stampDeep(v) {
    const vx = v.x, vz = v.z, vy = v.y; // vy = floor level inside
    const set = (x, y, z, id) => world.setBlock(x, y, z, id);
    const R = 10;
    for (let dx = -R - 1; dx <= R + 1; dx++) for (let dz = -R - 1; dz <= R + 1; dz++) for (let dy = -3; dy <= R + 1; dy++) {
      const x = vx + dx, y = vy + dy, z = vz + dz;
      const d = Math.hypot(dx, dy, dz);
      const shaft = Math.abs(dx) <= 1 && Math.abs(dz) <= 1;
      if (dy < 0) { if (d <= R + 1) set(x, y, z, shaft && dy >= -2 ? B.WATER : B.SAND); continue; }
      if (d > R + 0.6) continue;
      if (shaft) { set(x, y, z, B.WATER); continue; }
      if (d >= R - 0.5) set(x, y, z, B.GLASS); else set(x, y, z, B.AIR);
    }
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (Math.max(Math.abs(dx), Math.abs(dz)) === 2) set(vx + dx, vy - 1, vz + dz, B.STONE);
    set(vx + 3, vy, vz + 3, B.FUSION); set(vx + 4, vy, vz - 4, B.PORTAL);
    for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3]]) { set(vx + dx, vy, vz + dz, B.LOG); set(vx + dx, vy + 1, vz + dz, B.TORCH); }
    const huts = [[-6, 0, 1, 0, B.EMBER], [6, 0, -1, 0, B.BERRY], [0, -6, 0, 1, B.COPPER], [0, 6, 0, -1, B.VOID]];
    for (const [hx, hz, dirX, dirZ, marker] of huts) {
      const cx = vx + hx, cz = vz + hz;
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
        const wall = Math.abs(dx) === 2 || Math.abs(dz) === 2;
        for (let y = vy; y <= vy + 2; y++) set(cx + dx, y, cz + dz, wall ? B.BASALT : B.AIR);
        set(cx + dx, vy + 3, cz + dz, B.BASALT);
      }
      set(cx + dirX * 2, vy, cz + dirZ * 2, B.AIR); set(cx + dirX * 2, vy + 1, cz + dirZ * 2, B.AIR); set(cx + dirX * 2, vy + 2, cz + dirZ * 2, marker);
      set(cx, vy + 2, cz, B.TORCH);
      set(cx + dirX, vy, cz + dirZ, B.PLANKS);
    }
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2; set(vx + Math.round(Math.cos(a) * (R - 2)), vy, vz + Math.round(Math.sin(a) * (R - 2)), B.VOID); }
  }
  // Atlantis: a wide glass dome on the sea floor in the thick of a reef, coral gardens inside, stone halls lit by pearl coral, a tavern
  function stampAtlantis(v) {
    const vx = v.x, vz = v.z, vy = v.y;
    const set = (x, y, z, id) => world.setBlock(x, y, z, id);
    const R = 14;
    for (let dx = -R - 1; dx <= R + 1; dx++) for (let dz = -R - 1; dz <= R + 1; dz++) for (let dy = -3; dy <= R + 1; dy++) {
      const x = vx + dx, y = vy + dy, z = vz + dz;
      const d = Math.hypot(dx, dy, dz);
      const shaft = Math.abs(dx) <= 1 && Math.abs(dz) <= 1;
      if (dy < 0) { if (d <= R + 1) set(x, y, z, shaft && dy >= -2 ? B.WATER : B.SAND); continue; }
      if (d > R + 0.6) continue;
      if (shaft) { set(x, y, z, B.WATER); continue; }
      if (d >= R - 0.5) set(x, y, z, B.GLASS); else set(x, y, z, B.AIR);
    }
    for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (Math.max(Math.abs(dx), Math.abs(dz)) === 3) set(vx + dx, vy - 1, vz + dz, B.STONE);
    set(vx + 3, vy, vz + 3, B.FUSION); set(vx + 4, vy, vz - 4, B.PORTAL);
    for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3]]) { set(vx + dx, vy, vz + dz, B.STONE); set(vx + dx, vy + 1, vz + dz, B.PEARLCORAL); }
    const huts = [[-9, 0, 1, 0, B.EMBER, 2], [9, 2, -1, 0, B.BERRY, 3], [0, -9, 0, 1, B.COPPER, 2], [0, 9, 0, -1, B.VOID, 2]];
    for (const [hx, hz, dirX, dirZ, marker, r] of huts) {
      const cx = vx + hx, cz = vz + hz;
      for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
        const wall = Math.abs(dx) === r || Math.abs(dz) === r;
        set(cx + dx, vy - 1, cz + dz, B.STONE);
        for (let y = vy; y <= vy + 2; y++) set(cx + dx, y, cz + dz, wall ? (y === vy + 1 && (dx === 0 || dz === 0) ? B.GLASS : B.STONE) : B.AIR);
        set(cx + dx, vy + 3, cz + dz, B.STONE);
      }
      set(cx + dirX * r, vy, cz + dirZ * r, B.AIR); set(cx + dirX * r, vy + 1, cz + dirZ * r, B.AIR); set(cx + dirX * r, vy + 2, cz + dirZ * r, marker);
      set(cx, vy + 2, cz, B.PEARLCORAL);
      if (r === 3) { for (let i = -1; i <= 1; i++) set(cx - dirX * 1 + (dirZ ? i : 0), vy, cz - dirZ * 1 + (dirX ? i : 0), B.PLANKS); set(cx + 2, vy, cz - 2, B.LOG); set(cx - 2, vy, cz - 2, B.LOG); } // the tavern: a bar and two stools
      else set(cx - dirX, vy, cz - dirZ, B.PLANKS);
    }
    const r = U.rng(U.combine(world.seed, U.strHash(v.id), 7));
    for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = 10.5 + r() * 2.2; const x = vx + Math.round(Math.cos(a) * d), z = vz + Math.round(Math.sin(a) * d); if (world.getBlock(x, vy, z) === B.AIR && world.getBlock(x, vy - 1, z) === B.SAND) set(x, vy, z, [B.CORAL_R, B.CORAL_B, B.CORAL_Y, B.PEARLCORAL][r.int(4)]); }
  }
  // the Moon Dome: a shell of selenite glass over a land village, open at the four gates; nothing gets through it
  function stampDome(v, st) {
    const R = wallRadius(st) + 3; const vx = v.x, vz = v.z, vy = v.y;
    for (let dx = -R - 1; dx <= R + 1; dx++) for (let dz = -R - 1; dz <= R + 1; dz++) {
      const hd = Math.hypot(dx, dz); if (hd > R + 0.6) continue;
      const gate = (Math.abs(dx) <= 1 || Math.abs(dz) <= 1) && hd > R - 4; // the four gates stay open
      for (let dy = 0; dy <= R + 1; dy++) {
        const d = Math.hypot(dx, dy, dz); if (d < R - 0.5 || d > R + 0.5) continue;
        const y = vy + dy; if (y >= WH) continue;
        if (gate && dy <= 2) continue;
        const b = world.getBlock(vx + dx, y, vz + dz);
        if (b === B.AIR || isLeaf(b) || b === B.LOG) world.setBlock(vx + dx, y, vz + dz, B.SELGLASS);
      }
    }
    for (const [dx, dz] of [[0, 0], [R - 2, 0], [-R + 2, 0], [0, R - 2], [0, -R + 2]]) { const y = vy + Math.round(Math.sqrt(Math.max(0, R * R - dx * dx - dz * dz))) - 1; if (world.getBlock(vx + dx, y, vz + dz) === B.AIR) world.setBlock(vx + dx, y, vz + dz, B.MOONGLOW); }
  }
  function raiseDome(v) {
    const st = state(v.id);
    if (!st.freed) return 'Free the village first.';
    if (v.type !== 'land') return 'A dome needs land under it.';
    if (st.dome) return 'The dome is already up.';
    if (!G.player.has('kit_dome')) return 'You need a Moon Dome kit: 24 selenite glass, 8 tycho, 8 selenite, crafted on the Moon.';
    G.player.take('kit_dome', 1); st.dome = true; stampDome(v, st); st.holeCols = []; stampWall(v, st);
    if (v.raid && v.raid.state === 'active') endRaid(v, st);
    return null;
  }
  function ensureStamped(v) {
    const st = state(v.id);
    if (st.stamped) return;
    world.ensureAround(Math.floor(v.x / CH), Math.floor(v.z / CH), 2, 999);
    if (v.type === 'land' && v.R) { st.R = v.R; patchLoaded(v); stampWall(v, st); stampRoad(v, st); st.stamped = true; remember(v, st); return; }
    if (v.type === 'land' && (v.size === 'town' || v.size === 'city') && !st.grown) { // a town, or a city: the outer ring built up from the start, with its own shops
      st.grown = true; st.expanded = true; if (v.size === 'city') st.wall = Math.max(st.wall || 0, 1);
      const kinds = v.size === 'city' ? ['armoury', 'armourer', 'alchemist', 'inn', 'post', 'house', 'house', 'house', 'house', 'house', 'house', 'house'] : ['armoury', 'inn', 'alchemist', 'house', 'house', 'house'];
      st.shops = st.shops || []; kinds.forEach((k, i) => { if (k !== 'house') st.shops.push({ slot: i, kind: k }); });
      st.homes = kinds.map((k, i) => k === 'house' ? i : -1).filter(i => i >= 0);
    }
    if (v.type === 'land') { stampLand(v); if (st.expanded) { stampExpansion(v); MAT = MATS[v.style] || MATS.land; for (const sh of (st.shops || [])) stampShop(v, sh.slot, sh.kind); for (const i of (st.homes || [])) { const [dx, dz] = SLOTS[i]; const [dirX, dirZ] = slotDir(dx, dz); (MAT.pod ? pod : house)(v.x + dx, v.z + dz, v.y, dirX, dirZ, B.LOG, null); } } stampWall(v, st); stampRoad(v, st); if (st.dome) stampDome(v, st); } else if (v.type === 'sea') { stampSea(v); stampPier(v); } else if (v.style === 'atlantis') stampAtlantis(v); else stampDeep(v);
    st.stamped = true; remember(v, st);
  }
  // ---- the tyrant's guards: a road in, with a checkpoint and a lieutenant every dozen blocks ----
  function lieuCount(v) { return (v.starter || v.founded) ? 0 : Math.min(8, 1 + v.tier + (v.size === 'city' ? 3 : v.size === 'town' ? 1 : 0)); }
  function approachAxis(v) { const dx = wd(world.spawn.x - v.x), dz = wd(world.spawn.z - v.z); return Math.abs(dx) >= Math.abs(dz) ? [Math.sign(dx) || 1, 0] : [0, Math.sign(dz) || 1]; }
  function checkpointPos(v, st, i) { const [ax, az] = approachAxis(v); const wr = v.type === 'land' ? wallRadius(st) : 9; const d = wr + 8 + 12 * i; return { x: v.x + ax * d, z: v.z + az * d, ax, az, d }; }
  function stampRoad(v, st) {
    const n = lieuCount(v); if (!n) return;
    const [ax, az] = approachAxis(v); const wr = wallRadius(st); const len = wr + 10 + 12 * n;
    for (let d = wr + 1; d <= len; d++) for (let k = -1; k <= 1; k++) {
      const x = v.x + ax * d + (az ? k : 0), z = v.z + az * d + (ax ? k : 0);
      const gy = world.groundY(x, z, v.y + 8); if (gy < SEA) continue;
      world.setBlock(x, gy, z, B.GRAVEL);
      for (let y = gy + 1; y <= gy + 4; y++) if (world.getBlock(x, y, z) !== B.AIR) world.setBlock(x, y, z, B.AIR);
    }
    for (let i = 0; i < n; i++) {
      const c = checkpointPos(v, st, i);
      for (const side of [-1, 1]) for (let k = 2; k <= 4; k++) {
        const x = c.x + (az ? side * k : 0), z = c.z + (ax ? side * k : 0);
        const gy = world.groundY(x, z, v.y + 8); if (gy < SEA) continue;
        for (let y = gy + 1; y <= gy + 2; y++) world.setBlock(x, y, z, B.PLANKS);
        for (let y = gy + 3; y <= gy + 5; y++) if (world.getBlock(x, y, z) !== B.AIR) world.setBlock(x, y, z, B.AIR);
        if (k === 2) world.setBlock(x, gy + 3, z, B.TORCH);
      }
    }
  }
  function ensureLieutenants(v, st, player) {
    const n = lieuCount(v); if (!n || st.freed) { if (v.lieus) clearLieutenants(v); return; }
    if (!v.lieus) v.lieus = [];
    if (!st.lieuDown) st.lieuDown = {};
    for (let i = 0; i < n; i++) {
      const cur = v.lieus[i];
      if (cur && !Wild.list.includes(cur)) v.lieus[i] = null;
      if (st.lieuDown[i]) continue;
      const c = checkpointPos(v, st, i);
      const d = dist2d(c.x, c.z, player.x, player.z);
      if (v.lieus[i]) { if (d > 130) { Wild.remove(v.lieus[i]); v.lieus[i] = null; } continue; }
      if (d > 90 && dist2d(v.x, v.z, player.x, player.z) > 60) continue;
      const rx = Math.floor(U.mod(v.x, WORLD_W) / 256), rz = Math.floor(U.mod(v.z, WORLD_W) / 256);
      const layer = v.type === 'land' ? 'Surface' : 'Water';
      const list = KIN.roster(world.preset.id, rx, rz, layer, BIOME_NAME[world.biomeAt(v.x, v.z)] || 'Plains', Math.min(9, 1 + v.tier)).filter(sp => (sp.rarity || 0) <= 2);
      const sp = list[Math.floor(U.hash3(i, 13, U.strHash(v.id), world.seed) * list.length)];
      let y; const aquatic = v.type !== 'land';
      if (aquatic) y = v.type === 'sea' ? SEA - 1 : v.y + 3; else { const gy = world.groundY(c.x, c.z, v.y + 8); y = gy + 1; }
      const px = c.az ? 1 : 0, pz = c.ax ? 1 : 0; // across the road
      const e = Wild.makeEntity(sp, Math.max(2, bossLevelFor(v) - 2 + i), c.x + 0.5, y, c.z + 0.5, { elite: true, senseR: 5.2 + 0.4 * i, aquatic, patrol: { ax: c.x + 0.5 - px * 2.5, az: c.z + 0.5 - pz * 2.5, bx: c.x + 0.5 + px * 2.5, bz: c.z + 0.5 + pz * 2.5, period: 6 + i, phase: 0 } });
      e.lieutenant = { id: v.id, i }; e.speed = 1.4; e.flying = false; e.siegeAble = true;
      Wild.list.push(e); v.lieus[i] = e;
    }
  }
  function clearLieutenants(v) { if (!v.lieus) return; for (const e of v.lieus) if (e) Wild.remove(e); v.lieus = null; v.siege = null; }
  // one step toward a target, on land or through water
  function chargeMove(e, tx, tz, dt, speed) {
    const dx = tx - e.x, dz = tz - e.z, d = Math.hypot(dx, dz) || 1;
    const step = Math.min(d, speed * dt); const nx = e.x + dx / d * step, nz = e.z + dz / d * step;
    e.yaw = Math.atan2(dx, dz);
    const bx = Math.floor(nx), bz = Math.floor(nz);
    let ny = null;
    for (const dy of [0, 1, -1, 2, -2]) { const yy = Math.floor(e.y) + dy; const b0 = world.getBlock(bx, yy, bz); if (b0 === B.WATER) { ny = yy; break; } if ((b0 === B.AIR || b0 === B.TORCH) && world.getBlock(bx, yy + 1, bz) === B.AIR && isSolid(world.getBlock(bx, yy - 1, bz))) { ny = yy; break; } }
    if (ny == null) { const sx = e.x + (-dz / d) * step, sz = e.z + (dx / d) * step; const b = world.getBlock(Math.floor(sx), Math.floor(e.y), Math.floor(sz)); if (b === B.WATER || b === B.AIR) { e.x = sx; e.z = sz; } return d; }
    e.x = nx; e.z = nz; e.y += (ny - e.y) * Math.min(1, dt * 8); e.aquatic = world.getBlock(bx, Math.floor(e.y), bz) === B.WATER;
    return d;
  }
  // the siege: inside the perimeter of a held village the guards come for you one after another, then the tyrant
  function siege(v, st, player, dt, nd) {
    if (st.freed || nd > 60 || v.starter) { v.siege = null; return; } // Grakor waits in the square: the first fight is yours to pick
    if (!v.siege) {
      v.siege = { t: 0, cleared: false };
      // the perimeter is theirs alone: ordinary wild Kin move off
      for (const e of Wild.list.slice()) if (!e.lieutenant && !e.isBoss && !e.raider && !e.isMythic && !e.isWarden && dist2d(e.x, e.z, v.x, v.z) < 60) Wild.remove(e);
      UI.toast(`${v.name}: the tyrant's guards have seen you.`, 'bad');
    }
    v.siege.t += dt;
    const guards = (v.lieus || []).filter(e => e && Wild.list.includes(e)).sort((a, b) => a.lieutenant.i - b.lieutenant.i);
    const next = guards[0];
    if (next) {
      if (next.chase) return;
      if (!next.siege) { if (v.siege.pause > 0) { v.siege.pause -= dt; return; } next.siege = true; next.patrol = null; next.hitT = 0.3; UI.sfx('alert'); UI.toast(`${KIN.name(next.kin)}, the tyrant's guard, comes for you${guards.length > 1 ? ' (' + (guards.length - 1) + ' more behind it)' : ''}.`, 'bad'); }
      const d = chargeMove(next, player.x, player.z, dt, 3.6);
      if (d < 1.8 && !(next.cool > 0)) { v.siege.pause = 2.5; Battle.start(next, false); }
      return;
    }
    const b = v.boss; if (!b) return;
    if (b.lurk) { if (nd < 32) { b.lurk = false; b.aquatic = true; b.sleep = false; b.senseR = 5.5; b.siege = true; b.patrol = null; b.y = SEA; b.hitT = 0.4; UI.sfx('hurt'); UI.toast(`The water heaves. ${KIN.name(b.kin)} comes up for you!`, 'bad'); } return; }
    if (b.chase) return;
    if (!b.siege) { if (nd > (v.type === 'deep' ? 12 : 40)) return; b.siege = true; b.patrol = null; b.hitT = 0.3; UI.sfx('hurt'); UI.toast(`${KIN.name(b.kin)} comes for you.`, 'bad'); }
    const d = chargeMove(b, player.x, player.z, dt, 3.2);
    if (d < 1.8 && !(b.cool > 0)) Battle.start(b, false);
  }
  function lieutenantDown(info) {
    const v = recordFor(info.id); if (!v) return;
    const st = state(v.id); if (!st.lieuDown) st.lieuDown = {}; st.lieuDown[info.i] = true;
    if (v.lieus) v.lieus[info.i] = null;
    const left = lieuCount(v) - Object.keys(st.lieuDown).length;
    const reward = 10 + 4 * Math.max(2, bossLevelFor(v) - 2 + info.i); G.shards += reward;
    UI.toast(left > 0 ? `The tyrant's guard is down: +${reward} Shards. ${left} more between you and ${v.name}.` : `The road to ${v.name} is clear: +${reward} Shards. Only the tyrant now.`, 'good');
  }

  // ---- people ----
  // people by style: Earth villagers in cloth, fluorescent aliens, veiled dune folk, hatted frontier folk, sea people with fins
  const SKIN_STYLE = { alien: ['#39ff14', '#ff2bd6', '#00f5ff', '#ffe600', '#b026ff', '#00ffb3'], halo: ['#c9955a', '#a8723f', '#e0b47a', '#8a5a30'], atlantis: ['#6fd0c8', '#4aa8b8', '#8fe0d0', '#3f8fa0'], frontier: SKIN };
  const CLOTH_STYLE = { alien: ['#101828', '#1a1030', '#0a2030', '#201028'], halo: ['#e8d8b0', '#d8c090', '#c0a070', '#f0e0c0', '#b89060'], atlantis: ['#2a5a7a', '#1f4a6a', '#3a7a8a', '#204060'], frontier: ['#7a4a2a', '#4a3a2a', '#8a6a3a', '#5a4a4a', '#9a3a2a', '#3a4a6a'] };
  function villagerSpecies(i, role, vid, style) {
    const r = U.rng(U.combine(0x4242, i, U.strHash(vid || 'start')));
    const skins = SKIN_STYLE[style] || SKIN, cloths = CLOTH_STYLE[style] || CLOTH;
    const skin = r.pick(skins), cloth = r.pick(cloths);
    const plain = style && style !== 'frontier' && style !== 'land';
    const body = plain ? cloth : role === 'elder' ? '#f0d090' : role === 'voodoo' ? '#2c3e50' : role === 'fisher' ? '#5b7f95' : role === 'traveller' ? '#6b5a3e' : role === 'hermit' ? '#7a6f5a' : cloth;
    const accent = style === 'alien' ? r.pick(skins) : role === 'elder' ? '#e0b84a' : cloth;
    return { shape: 'biped', feat: { crest: false, ears: false, horns: false, spikes: false, tail: false, wings: false, bigEyes: style === 'alien' }, colors: { body, belly: skin, accent, dark: style === 'alien' ? '#05050f' : style === 'atlantis' ? '#1a3a4a' : '#3a2a20', eye: style === 'alien' ? '#ffffff' : '#222222' }, size: role === 'elder' ? 1.15 : role === 'voodoo' ? 1.1 : 1, gen: 0, names: ['villager'], neon: style === 'alien' };
  }
  function makeNpc(i, role, x, z, name, shop, y, vid, style) {
    style = style || (vid === 'shore' ? 'land' : (world.preset.people || 'land'));
    const sp = villagerSpecies(i, role, vid, style);
    const m = KIN.model(sp, 2);
    if (style === 'alien') KIN.decorate(m, 'alien'); else if (style === 'halo') KIN.decorate(m, 'veil'); else if (style === 'atlantis') KIN.decorate(m, 'merfolk'); else if (style === 'frontier' && role !== 'hermit' && role !== 'traveller') KIN.decorate(m, 'hat');
    if ((role === 'elder' && (style === 'land' || !style)) || role === 'voodoo' || role === 'fisher' || role === 'traveller' || role === 'hermit') KIN.decorate(m, role);
    if (role === 'elder' && style === 'frontier') KIN.decorate(m, 'star');
    const v = vid ? villages.get(vid) : null;
    return { id: i, role, name, shop, shopTitle: shop ? shopDef(shop, v).title : null, x: x + 0.5, y, z: z + 0.5, yaw: Math.random() * 6.28, tx: x + 0.5, tz: z + 0.5, wait: 2 + Math.random() * 4, model: m, scale: 1, hover: 0, mesh: R.entityMesh('npc:' + (vid || '') + ':' + i + ':' + role + ':' + style, (mb) => KIN.buildMesh(mb, m)), skyMul: 1, hidden: false, home: { x: x + 0.5, z: z + 0.5 } };
  }
  // ---- inside a town: shops with their own troubles. Freeing the town opens the gates; some of the shops still need you ----
  const PROBLEMS = {
    bakery: { thief: true, say: ['Freed, yes, and thank you. But something keeps getting into the flour store. Small, fast, gone before I turn round.', 'Catch it, or beat it, and I will open the doors again. It runs round the back of the bakery, mostly. Creep up on it.'] },
    juice: { need: { berry: 12 }, say: ['The presses ran dry while the tyrant sat in the square. Twelve berries and I can start them again.'] },
    trader: { need: { copper: 4, iron: 2 }, say: ['They took my scales and my strongbox. Four copper and two iron and I can trade again.'] },
    inn: { need: { planks: 16, glass: 4 }, say: ['His creatures used my rooms as a den. Sixteen planks and four panes of glass and I can put the beds back.'] },
    restaurant: { need: { berry: 6, frond: 6 }, say: ['A kitchen with no herbs and no fruit is just a room. Six berries, six fronds, and I will feed the whole town.'] },
    armoury: { need: { iron: 10 }, say: ['My forge has been cold for a year. Ten iron to get it going, and you will have the first pick of the rack.'] },
    armourer: { need: { iron: 8, frond: 10 }, say: ['Plate needs iron and padding. Eight iron, ten fronds for the lining.'] },
    alchemist: { need: { glowworm: 5 }, say: ['My lamps went out and my brews with them. Five glowworms, please. They light the stills.'] },
    post: { need: { planks: 20, iron: 2 }, say: ['The traders stopped coming when the tyrant came. Fix my stalls: twenty planks, two iron for the hinges.'] },
    station: { need: { iron: 16, planks: 24 }, say: ['The line has not run since the tyrant came. The rails here are rusted through.', 'Sixteen iron and twenty-four planks to relay our stretch of track. Then this town joins the line, and the train runs between every station that is open.'] },
    sanctuary: { need: { berry: 10, glowworm: 3 }, say: ['The sanctuary garden died while we hid. Ten berries to replant, three glowworms to light the paths, and the Kin will come back to learn.'] },
    stables: { need: { berry: 20 }, say: ['The horses-of-a-sort ran off when the tyrant came. Twenty berries and I can coax enough back to teach again.'] },
    aerie: { need: { feather: 4 }, say: ['My training gliders are in rags. Four Sky Feathers to re-skin them.'] },
  };
  function closures(v, st) {
    if (st.closed) return st.closed; st.closed = {};
    const L = layout(v); const kinds = L.shops.map(s => s.kind).filter(k => PROBLEMS[k] && k !== 'voodoo');
    let pick;
    if (v.starter) pick = ['bakery', 'juice', 'station'];
    else { const r = U.rng(U.strHash(v.id) ^ 0x51); const n = v.size === 'city' ? 4 : v.size === 'town' ? 3 : 2; pick = ['station']; const rest = kinds.filter(k => k !== 'station'); while (pick.length < n + 1 && rest.length) pick.push(rest.splice(r.int(rest.length), 1)[0]); }
    for (const k of pick) if (kinds.includes(k)) st.closed[k] = true;
    return st.closed;
  }
  function shopOf(v, kind) { return layout(v).shops.find(s => s.kind === kind); }
  function populateTown(v) {
    v.npcs = []; const st = state(v.id); const freed = st.freed; const vy = v.y; const L = layout(v); closures(v, st);
    const r = U.rng(U.strHash(v.id) ^ 0x99); const people = peopleOf(v); const sty = styleOf(v) || 'land';
    const pname = (i) => people[(i + r.int(people.length)) % people.length]; const title = headmanTitle(v);
    let i = 0;
    for (const sh of L.shops) {
      const kx = sh.x - sh.dirX * 2, kz = sh.z - sh.dirZ * 2;
      if (sh.kind === 'elder') { v.elder = Object.assign(makeNpc(20, 'elder', sh.castle ? sh.x : sh.x + sh.dirX * 4, sh.castle ? sh.z : sh.z + sh.dirZ * 4, v.starter ? 'Elder Hask' : title + ' ' + pname(7), null, vy, v.id, sty), { hidden: !freed, wander: false }); continue; }
      if (sh.kind === 'voodoo') { v.npcs.push(Object.assign(makeNpc(13, 'voodoo', kx, kz, shopDef('voodoo', v).keeper, 'voodoo', vy, v.id, sty), { hidden: false, wander: false })); continue; }
      v.npcs.push(Object.assign(makeNpc(30 + i++, 'keeper', kx, kz, shopDef(sh.kind, v).keeper, sh.kind, vy, v.id, sty), { hidden: !freed, wander: false, shopAt: sh }));
    }
    const nV = Math.min(24, Math.round(v.R / 2.2));
    for (let j = 0; j < nV; j++) { const s0 = L.streets[r.int(L.streets.length)]; const d = (r() * 2 - 1) * (v.R - 8); const along = r() < 0.5; v.npcs.push(villager0(j, along ? s0 + (r() < 0.5 ? -1 : 1) : d, along ? d : s0 + (r() < 0.5 ? -1 : 1), pname(j), freed, vy, v, sty)); }
    if (v.elder) v.npcs.push(v.elder);
    for (const n of v.npcs) { const gy = standY(n.x, vy, n.z); n.y = gy != null ? gy : vy; n.home = { x: n.x, z: n.z }; }
    v.wanderR = 6; makeTraveller(v); buildGuardEnts(v);
  }
  function villager0(i, dx, dz, nm, freed, vy, v, sty) { return Object.assign(makeNpc(i, 'villager', v.x + dx, v.z + dz, nm, null, vy, v.id, sty), { hidden: !freed }); }
  // the thief that raids the bakery
  function ensureThief(v, st, player) {
    if (!v.R || !st.freed || !(st.closed || {}).bakery) return;
    if (v.thief && Wild.list.includes(v.thief)) return; const sh = shopOf(v, 'bakery'); if (!sh || Math.hypot(player.x - sh.x, player.z - sh.z) > 50) return;
    const pool = KIN.dex('earth').filter(sp => !sp.fusion && sp.home && sp.home.layer === 'Surface' && (sp.rarity || 0) === 1 && sp.shape !== 'serpent');
    const sp = pool[U.strHash(v.id) % pool.length]; const lv = Math.max(3, Math.min(KIN.capOf(sp), (G.trainerLevel || 1) + 1));
    const e = Wild.makeEntity(sp, lv, sh.x + 0.5, v.y, sh.z - sh.dirZ * 6 + 0.5, { senseR: 5.5 }); e.thief = v.id; e.speed = 3.4;
    e.patrol = { ax: sh.x - 5.5, az: sh.z - 5.5, bx: sh.x + 5.5, bz: sh.z + 5.5, period: 7, phase: 0 };
    Wild.list.push(e); v.thief = e;
  }
  // the Kin show: judged on how strong it is for its kind, how much it trusts you, how it is dressed, and how rare it is
  const SHOW_PRIZES = [
    { hair: 'laurel', wear: 'rosette', title: 'Laurelled' }, { hair: 'plume', wear: 'sash', title: 'Grand Champion' },
    { hair: 'topknot', wear: 'laurelk', title: 'Best in Show' }, { hair: 'crownbraid', wear: 'medal', title: 'Breeder Royal' },
  ];
  function enterShow(v) {
    const k = G.kin[G.activeIdx]; if (!k || !v) return false; const st = state(v.id); const day = G.dayCount || 0;
    if (st.showDay === day) { UI.toast('One entry a day. The ring is being swept for tomorrow.'); return false; }
    if (G.shards < 50) { UI.toast('Entry is 50 shards.', 'bad'); return false; } G.shards -= 50; st.showDay = day;
    const cap = KIN.capOf(k.sp); const W = k.wear || {};
    const mine = 40 * (k.level / cap) + 25 * (k.trust || 0) + (W.item ? 12 : 0) + (W.col ? 3 : 0) + 8 * (k.sp.rarity || 0) + 6 * ((k.stage || 1) - 1) + Math.random() * 18;
    const r = U.rng(U.combine(U.strHash(v.id), day)); const tier = Math.min(30, (G.stats.showWins || 0) * 4 + (v.tier || 0) * 2);
    const rivals = [0, 1, 2].map(() => 35 + tier + r() * 30); const place = 1 + rivals.filter(x => x > mine).length;
    const idx = Math.max(0, townList().filter(t => t.size === 'city').findIndex(t => t.id === v.id)); const prize = SHOW_PRIZES[idx % SHOW_PRIZES.length];
    const lines = [`The judges walk round ${KIN.name(k)} twice. They make notes. One of them smiles, or frowns, it is hard to say.`];
    if (place === 1) { G.stats.showWins = (G.stats.showWins || 0) + 1; G.shards += 400; const U0 = G.stats.unlocks || (G.stats.unlocks = {}); const fresh = !U0['hair_' + prize.hair]; U0['hair_' + prize.hair] = true; U0['wear_' + prize.wear] = true; (G.stats.titles || (G.stats.titles = [])).includes(prize.title) || G.stats.titles.push(prize.title);
      lines.push(`First place! ${KIN.name(k)} takes the blue ribbon. 400 shards${fresh ? `, the title "${prize.title}", and something nobody can buy: a new hairstyle for you at the barber and a new show piece for your Kin at the outfitter` : ''}.`); }
    else if (place === 2) { G.shards += 120; lines.push(`Second place. A red ribbon and 120 shards. Next time, perhaps.`); }
    else lines.push(place === 3 ? 'Third. A yellow ribbon and a polite round of applause.' : 'Unplaced. The judges suggest more training, more trust, and perhaps something to wear.');
    lines.push(`Your score: ${Math.round(mine)}. The winning score: ${Math.round(Math.max(mine, ...rivals))}. Level for its kind, trust, dress and rarity all count.`);
    UI.closePanel(); setTimeout(() => Dialogue.show('Judge Ottilie', lines), 200); return true;
  }
  function plotsOf(v) { if (!v) return []; if (v.R) return layout(v).plots || []; const sp = seaPlot(v); return sp ? [sp] : []; }
  function plotPrice(v) { return v.starter || v.size === 'hamlet' ? 2500 : v.size === 'city' ? 15000 : v.type === 'sea' ? 4000 : 6000; }
  const plotKey = (v, i) => v.id + ':' + i;
  function ownsPlotAt(v, x, z) { const own = G.stats.plots || {}; return plotsOf(v).some(pl => own[plotKey(v, pl.i)] && Math.abs(x - pl.x) <= 4 && Math.abs(z - pl.z) <= 4); }
  function buyPlot(v, i) { const own = G.stats.plots || (G.stats.plots = {}); const k = plotKey(v, i); if (own[k]) return false; const free = !G.stats.freeDeed && state(v.id).freed; const price = free ? 0 : plotPrice(v); if (G.shards < price) { UI.toast(`A deed here is ${price.toLocaleString()} shards.`, 'bad'); return false; } G.shards -= price; own[k] = true; if (free) G.stats.freeDeed = true; UI.sfx('quest'); UI.toast(free ? 'The deed is yours, a gift for what you did here. Build whatever you like on it: nobody will stop you.' : 'Signed and sealed. That plot is yours to build on.', 'good'); return true; }
  function thiefCaught(vid) { const v = villages.get(vid); if (!v) return; const st = state(vid); if (st.closed) delete st.closed.bakery; if (st.freed) st.income = incomeFor(v, st); v.thief = null; UI.sfx('quest'); UI.toast(`${v.name}: the flour thief is dealt with. The bakery is open.`, 'good'); }
  function fixShop(n) {
    const v = active; if (!v) return false; const st = state(v.id); const closed = closures(v, st); const k = n.shop; if (!closed[k] || !st.freed) return false;
    const P = PROBLEMS[k]; const need = P.need || {}; const have = Object.keys(need).every(it => G.player.count(it) >= need[it]);
    if (P.thief || !have) { Dialogue.show(n.name, P.say.concat(P.need ? ['You have ' + Object.keys(need).map(it => `${G.player.count(it)}/${need[it]} ${ITEMS[it].name}`).join(', ') + '.'] : [])); return true; }
    Dialogue.show(n.name, ['That is everything. Give me a moment.', k === 'station' ? `There. ${v.name} is back on the line. Any open station, any time.` : 'Open for business. Thank you.'], () => {
      for (const it in need) G.player.take(it, need[it]); delete closed[k]; st.income = incomeFor(v, st); UI.sfx('quest'); G.addTrainerXp(60); setTimeout(() => UI.toast(`${v.name} pays ◆ ${st.income} a day now.`, 'good'), 1500);
      if (k === 'station') { const sh = shopOf(v, 'station'); G.addRoost({ id: v.id, name: v.name, x: sh.x + sh.dirX * 5 + 0.5, y: v.y, z: sh.z + sh.dirZ * 5 + 0.5, world: world.preset.id }); }
    });
    return true;
  }
  function populate(v) {
    if (v.R && v.type === 'land') { populateTown(v); return; }
    v.npcs = []; const st = state(v.id); const freed = st.freed; const vy = v.y;
    const r = U.rng(U.strHash(v.id) ^ 0x99); const people = peopleOf(v); const sty = styleOf(v) || (v.type === 'land' ? 'land' : v.type);
    const pname = (i) => people[(i + r.int(people.length)) % people.length];
    const keeper = (i, shop, dx, dz) => Object.assign(makeNpc(i, 'keeper', v.x + dx, v.z + dz, shopDef(shop, v).keeper, shop, vy, v.id, sty), { hidden: !freed, wander: false });
    const villager = (i, dx, dz) => Object.assign(makeNpc(i, 'villager', v.x + dx, v.z + dz, pname(i), null, vy, v.id, sty), { hidden: !freed });
    const healer = (dx, dz) => Object.assign(makeNpc(13, 'voodoo', v.x + dx, v.z + dz, shopDef('voodoo', v).keeper, 'voodoo', vy, v.id, sty), { hidden: false, wander: false });
    const title = headmanTitle(v);
    if (v.founded) { populateFounded(v); return; }
    if (v.type === 'land') {
      [[-4, -4], [4, -4], [-4, 4], [4, 4], [-6, 0], [6, 0], [0, -7], [-7, -7]].forEach((h, i) => v.npcs.push(villager(i, h[0], h[1])));
      v.npcs.push(keeper(10, 'bakery', -11, -9), keeper(11, 'juice', 11, -9), keeper(12, 'trader', -11, 9), healer(0, 12));
      v.elder = Object.assign(makeNpc(20, 'elder', v.x + 2, v.z + 3, v.starter ? 'Elder Hask' : title + ' ' + pname(7), null, vy, v.id, sty), { hidden: !freed, wander: freed });
      // shops you had built in the expanded ring
      (st.shops || []).forEach((s, i) => { const [dx, dz] = SLOTS[s.slot]; const [dirX, dirZ] = slotDir(dx, dz); const k = s.kind === 'voodoo' ? Object.assign(makeNpc(30 + i, 'voodoo', v.x + dx - dirX * 2, v.z + dz - dirZ * 2, shopDef('voodoo', v).keeper, 'voodoo', vy, v.id, sty), { wander: false }) : Object.assign(makeNpc(30 + i, 'keeper', v.x + dx - dirX * 2, v.z + dz - dirZ * 2, shopDef(s.kind, v).keeper, s.kind, vy, v.id, sty), { hidden: !freed, wander: false }); v.npcs.push(k); if (st.expanded && i < 2) v.npcs.push(villager(40 + i, dx - dirX * 6, dz - dirZ * 6)); });
    } else if (v.type === 'sea') {
      [[-2, -2], [2, 2], [-2, 2], [2, -2]].forEach((h, i) => v.npcs.push(villager(i, h[0], h[1])));
      v.npcs.push(keeper(10, 'bakery', -13, 0), keeper(11, 'juice', 13, 0), keeper(12, 'trader', 0, -13), healer(0, 13));
      v.elder = Object.assign(makeNpc(20, 'elder', v.x + 2, v.z + 2, title + ' ' + pname(7), null, vy, v.id, sty), { hidden: !freed, wander: freed });
    } else if (v.style === 'atlantis') {
      [[-5, 4], [5, -5], [-4, -6], [6, 5], [0, -9], [-8, 0]].forEach((h, i) => v.npcs.push(villager(i, h[0], h[1])));
      v.npcs.push(keeper(10, 'bakery', -9, 0), keeper(11, 'juice', 9, 2), keeper(12, 'trader', 0, -9), healer(0, 9));
      v.elder = Object.assign(makeNpc(20, 'elder', v.x + 5, v.z + 1, title + ' ' + pname(7), null, vy, v.id, sty), { hidden: !freed, wander: freed });
    } else {
      [[-4, 3], [4, -4], [-3, -5]].forEach((h, i) => v.npcs.push(villager(i, h[0], h[1])));
      v.npcs.push(keeper(10, 'bakery', -6, 0), keeper(11, 'juice', 6, 0), keeper(12, 'trader', 0, -6), healer(0, 6));
      v.elder = Object.assign(makeNpc(20, 'elder', v.x + 5, v.z + 1, title + ' ' + pname(7), null, vy, v.id, sty), { hidden: !freed, wander: freed });
    }
    v.npcs.push(v.elder);
    for (const n of v.npcs) { const gy = standY(n.x, vy, n.z); n.y = gy != null ? gy : vy; n.home = { x: n.x, z: n.z }; }
    v.wanderR = v.type === 'land' ? (st.expanded ? 12 : 7) : v.type === 'sea' ? 3 : v.style === 'atlantis' ? 9 : 5;
    makeTraveller(v); buildGuardEnts(v);
  }
  // a village you founded: people for every amenity you built, standing in the doorways under their signs
  function populateFounded(v) {
    v.npcs = []; const vy = v.y; const r = U.rng(U.strHash(v.id) ^ 0x77);
    const spots = [[-3, -2], [3, 2], [-2, 4], [4, -3], [-5, 1], [2, -5], [5, 4], [-4, -5]];
    const n = 3 + Math.min(5, v.signCount || 0);
    for (let i = 0; i < n && i < spots.length; i++) { const [dx, dz] = spots[i]; const gy = standY(v.x + dx + 0.5, vy, v.z + dz + 0.5); if (gy == null) continue; v.npcs.push(makeNpc(i, 'villager', v.x + dx, v.z + dz, PEOPLE[(i + r.int(PEOPLE.length)) % PEOPLE.length], null, gy, v.id)); }
    const signs = v.signs || {};
    let i = 10;
    for (const shop of ['bakery', 'juice', 'trader', 'voodoo', 'post']) {
      for (const s of (signs[shop] || [])) {
        const gy = standY(s.x + 0.5, s.y - 2, s.z + 0.5) ?? standY(s.x + 0.5, vy, s.z + 0.5);
        if (gy == null) continue;
        const np = makeNpc(i++, shop === 'voodoo' ? 'voodoo' : 'keeper', s.x, s.z, SHOPS[shop].keeper, shop, gy, v.id); np.wander = false; v.npcs.push(np);
      }
    }
    const ey = standY(v.x + 2.5, vy, v.z + 1.5) ?? vy;
    v.elder = Object.assign(makeNpc(20, 'elder', v.x + 2, v.z + 1, 'Headman ' + PEOPLE[r.int(PEOPLE.length)], null, ey, v.id), { wander: true });
    v.npcs.push(v.elder);
    for (const np of v.npcs) np.home = { x: np.x, z: np.z };
    v.wanderR = 8;
    makeTraveller(v); buildGuardEnts(v);
  }
  // a traveller passes through on some days with one thing to barter
  function makeTraveller(v) {
    const st = state(v.id); if (!st.freed) return;
    v.npcs = v.npcs.filter(n => n.role !== 'traveller');
    const day = G.dayCount || 0, lvl = levelOf(st);
    const h = U.hash3(day, 9, U.strHash(v.id), 0x7AA);
    if (h > (lvl >= 2 ? 0.55 : 0.35)) return;
    const pool = BARTERS.filter(b => !b.level || b.level <= lvl);
    const offer = pool[Math.floor(U.hash3(day, 10, U.strHash(v.id), 0x7AA) * pool.length)];
    const sold = (st.traded || {})[day];
    if (sold) return;
    const gy = standY(v.x - 1.5, v.y, v.z - 4.5) ?? v.y;
    const t = makeNpc(50, 'traveller', v.x - 2, v.z - 5, 'Traveller', null, gy, v.id); t.wander = false; t.offer = offer; t.day = day;
    v.npcs.push(t);
  }
  function ensureBoss(v, trainerLevel) {
    if (state(v.id).freed || v.boss) return;
    const prim = v.style === 'alien' ? 'Light' : v.style === 'halo' ? 'Flame' : v.style === 'atlantis' ? 'Tide' : v.type === 'land' ? 'Stone' : v.type === 'sea' ? 'Tide' : 'Void';
    const shape = v.style === 'alien' ? 'floater' : v.style === 'halo' ? 'quadruped' : v.style === 'atlantis' ? 'serpent' : 'biped';
    const h = U.combine(0x9001, U.strHash(v.id));
    const sp = KIN.species(h, [prim], 1 + v.tier, { primary: prim, shape, total: 285 + v.tier * 40, neon: world.preset.id !== 'earth' });
    const tn = styleOf(v) ? STYLE_NAMES[v.style].tyrant : null;
    const nm = v.starter ? 'Grakor the Tyrant' : tn ? tn[h % tn.length] : TYRANT[h % TYRANT.length] + ' the Tyrant';
    sp.names = [nm, nm, nm]; sp.feat.horns = true; sp.feat.spikes = true; sp.feat.crest = true; sp.size = 1.25 + v.tier * 0.08; sp.boss = true;
    const kin = KIN.create(sp, bossLevelFor(v));
    const m = KIN.model(sp, 2);
    const bx = v.type === 'deep' ? v.x - 0.5 : v.x + 0.5, bz = v.z + 2.5;
    // at sea the tyrant lurks under the deck and comes up when you reach the platform, however you got there
    const lurk = v.type === 'sea'; const by = lurk ? SEA - 3 : v.y;
    v.boss = { kin, x: bx, y: by, z: bz, yaw: Math.PI, tx: bx, tz: bz, wait: 99, speed: 0, senseR: lurk ? 0 : 5.5, alert: 0, model: m, scale: 1, hover: 0, bob: 0, mesh: R.entityMesh(KIN.meshKey(sp, 2) + ':boss:' + v.id, (mb) => KIN.buildMesh(mb, m)), skyMul: 1, isBoss: true, villageId: v.id, sleep: lurk, aquatic: lurk, lurk, patrol: { ax: bx - 3, az: bz, bx: bx + 3, bz: bz, period: lurk ? 12 : 8, phase: 0 }, skyT: 0, elite: true };
    Wild.list.push(v.boss);
  }
  // touching the table in a village the tyrant still holds brings him down on you
  function tableChallenge() {
    const v = active; if (!v || !v.boss || state(v.id).freed || Battle.active) return false;
    const b = v.boss;
    if (b.lurk) { surfaceBoss(v); return true; }
    b.siege = true; b.patrol = null;
    if (dist2d(b.x, b.z, G.player.x, G.player.z) > 16) return false;
    b.alert = 1; b.cool = 0; const p = G.player; b.x = p.x + (b.x - p.x) * 0.3; b.z = p.z + (b.z - p.z) * 0.3; b.y = standY(b.x, b.y, b.z) ?? b.y; b.yaw = Math.atan2(p.x - b.x, p.z - b.z);
    UI.sfx('hurt'); UI.toast(`${KIN.name(b.kin)} will not have you at the table.`, 'bad');
    Battle.start(b, false); return true;
  }
  // the sea tyrant surfaces: onto the deck, and straight at you
  function surfaceBoss(v) {
    const b = v.boss; if (!b || !b.lurk) return;
    b.lurk = false; b.aquatic = false; b.sleep = false; b.senseR = 5.5; b.x = v.x + 0.5; b.z = v.z + 2.5; b.y = v.y; b.hitT = 0.4; b.cool = 0; b.alert = 1;
    const p = G.player; b.yaw = Math.atan2(p.x - b.x, p.z - b.z);
    UI.sfx('hurt'); UI.toast(`The water heaves. ${KIN.name(b.kin)} hauls itself onto the deck!`, 'bad');
    Battle.start(b, false);
  }
  function bossLevelFor(v) { return Math.max(3, (G.trainerLevel || 1) - 1 + (v.size === 'city' ? 6 : v.size === 'town' ? 2 : 0) + v.tier * 2, (v.zoneBase || 0) + v.tier * 3); }
  function onBossGone(id) { const v = villages.get(id); if (v) v.boss = null; }
  function freed(id) {
    const v = villages.get(id); if (!v) return;
    const st = state(id); if (st.freed) return;
    st.freed = true; st.income = incomeFor(v, st); st.freedDay = curNight(); st.report = null; clearLieutenants(v); remember(v, st);
    for (const n of v.npcs) n.hidden = false;
    G.stats.villagesFreed = (G.stats.villagesFreed || 0) + 1;
    if (v.starter) G.stats.villageFreed = true;
    if (v.elder) { v.elder.wander = false; walkState = { v, stage: (v.starter && !G.stats.elderDone) ? 'approach' : 'approach-headman' }; }
    G.lastVillage = { id: v.id, x: v.x, y: v.y, z: v.z, name: v.name, world: world.preset.id };
    G.respawnPoint = { x: v.x + 0.5, y: v.y, z: v.z + 4.5 };
    if (G.fisherTarget === id) { G.fisherTarget = null; G.stats.fisherDone = (G.stats.fisherDone || 0) + 1; }
    makeTraveller(v);
  }
  // the tyrant takes the village back: doors shut, no pay, the boss waits in the square again
  function retaken(v, st) {
    st.freed = false; st.bank = 0; st.lieuDown = {}; st.report = { night: curNight(), text: 'The tyrant returned and the guards could not hold. The village is his again.' };
    for (const k of st.guards) k.hp = 0;
    for (const n of v.npcs) if (n.role !== 'voodoo') n.hidden = true;
    v.boss = null; v.guardEnts = [];
    if (G.lastVillage && G.lastVillage.id === v.id && G.respawnPoint) { G.respawnPoint = null; }
  }

  // ---- guards ----
  function guardPower(k) { const mx = KIN.stats(k).hp; return k.level * (1 + 0.15 * (k.sp.rarity || 0)) * Math.pow(1.1, k.sp.gen || 0) * (k.hp > 0 ? U.clamp(k.hp / mx, 0.5, 1) : 0); }
  function guardTotal(st) { return (st.guards || []).reduce((a, k) => a + guardPower(k), 0); }
  function guardCap(st) { return 3 + levelOf(st); }
  function wallBonus(v, st) {
    let base;
    if (st.dome) return 1000; // nothing gets through a Moon Dome
    if (v.type === 'sea') base = 6; else if (v.type === 'deep') base = v.style === 'atlantis' ? 20 : 12; else if (v.founded) base = [2, 8, 16, 28][v.wallTier || 0]; else base = wallSet(v)[st.wall || 0].bonus;
    const holes = (st.holeCols || []).length;
    return base * U.clamp(1 - holes / 8, 0, 1);
  }
  function raidTotal(v, st) { return 5 * (bossLevelFor(v) + 1) * (1 + 0.1 * (levelOf(st) - 1)); }
  function tyrantNeed(v) { return 2.5 * bossLevelFor(v); }
  function raidTonight(v, night) { return U.hash3(night, 5, U.strHash(v.id), world.seed) < 0.55; }
  function station(k) {
    const v = active; if (!v) return 'No village here.';
    const st = state(v.id); if (!st.freed) return 'Free the village first.';
    if (st.guards.length >= guardCap(st)) return `${v.name} can post ${guardCap(st)} guards at level ${levelOf(st)}. Raise its level for more.`;
    if (k.hp <= 0) return 'A fainted Kin cannot stand guard.';
    if (G.kin.filter(x => x.hp > 0).length <= 1) return 'Keep at least one Kin that can fight with you.';
    const i = G.kin.indexOf(k); if (i < 0) return 'Not in your bag.';
    G.kin.splice(i, 1); if (G.activeIdx >= G.kin.length) G.activeIdx = 0; if (G.player.mount === k) G.player.mount = null;
    st.guards.push(KIN.serialize(k));
    buildGuardEnts(v);
    return null;
  }
  function recall(i) {
    const v = active; if (!v) return 'No village here.';
    const st = state(v.id); if (!st.guards[i]) return 'Nobody there.';
    if (G.kin.length >= G.MAX_KIN) return 'Your bag is full.';
    const k = KIN.deserialize(st.guards.splice(i, 1)[0]); G.kin.push(k);
    buildGuardEnts(v);
    return null;
  }
  function buildGuardEnts(v) {
    const st = state(v.id); v.guardEnts = [];
    const posts = v.type === 'land' ? (st.expanded ? [[-14, -8], [14, -8], [-14, 8], [14, 8], [0, -14], [0, 14], [-8, 14]] : [[-8, -2], [8, -2], [-8, 6], [8, 6], [0, -9], [-3, 8], [5, 9]]) : [[-2, -2], [2, 2], [2, -2], [-2, 2], [0, 3], [3, 0], [-3, 0]];
    st.guards.forEach((k, i) => {
      const [dx, dz] = posts[i % posts.length];
      const m = KIN.model(k.sp, k.stage);
      const gy = standY(v.x + dx + 0.5, v.y, v.z + dz + 0.5) ?? v.y;
      v.guardEnts.push({ kin: k, idx: i, x: v.x + dx + 0.5, y: gy, z: v.z + dz + 0.5, yaw: Math.atan2(v.x - (v.x + dx), v.z - (v.z + dz)) + Math.PI, post: { x: v.x + dx + 0.5, z: v.z + dz + 0.5 }, model: m, mesh: R.entityMesh(KIN.meshKey(k.sp, k.stage), (mb) => KIN.buildMesh(mb, m)), scale: 1, hover: 0, skyMul: 1, bob: Math.random() * 6, cd: 0, isGuard: true });
    });
  }

  // ---- raids ----
  function updateRaid(v, st, dt, player) {
    const night = isNight();
    if (!st.freed) return;
    if (v.raid && v.raid.state === 'active') {
      v.raid.raiders = v.raid.raiders.filter(e => Wild.list.includes(e) && e.raider);
      if (!night || (!v.raid.raiders.length && v.raid.spawned)) { endRaid(v, st); return; }
      for (const e of v.raid.raiders) raiderMove(v, st, e, dt);
      guardsFight(v, st, dt);
      return;
    }
    if (!night || v.type !== 'land' || st.dome) return;
    const n = curNight();
    if (v.raid && v.raid.night === n) return; // already done tonight
    if (!raidTonight(v, n)) { v.raid = { night: n, state: 'quiet' }; return; }
    startRaid(v, st, n);
  }
  function startRaid(v, st, night) {
    v.raid = { night, state: 'active', raiders: [], breached: false, spawned: false, kills: 0, fallen: 0 };
    setGates(v, st, true);
    const count = Math.min(6, 2 + v.tier + Math.floor((levelOf(st) - 1) / 2));
    const rx = Math.floor(U.mod(v.x, WORLD_W) / 256), rz = Math.floor(U.mod(v.z, WORLD_W) / 256);
    const list = KIN.roster(world.preset.id, rx, rz, 'Surface', BIOME_NAME[world.biomeAt(v.x, v.z)] || 'Plains', Math.min(9, 1 + v.tier)).filter(sp => (sp.rarity || 0) <= 2);
    const wr = wallRadius(st); const bl = bossLevelFor(v);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + U.hash3(night, i, 3, world.seed) * 1.2;
      const x = v.x + 0.5 + Math.cos(a) * (wr + 9), z = v.z + 0.5 + Math.sin(a) * (wr + 9);
      const gy = world.groundY(Math.floor(x), Math.floor(z), v.y + 8);
      const sp = list[Math.floor(U.hash3(night, i, 4, world.seed) * list.length)] || KIN.roster(world.preset.id, rx, rz, 'Surface', 'Plains', 0)[0];
      const e = Wild.makeEntity(sp, bl + Math.floor(U.hash3(night, i, 6, world.seed) * 3), x, gy + 1, z, { elite: true, senseR: 2.4 });
      e.raider = v.id; e.speed = 1.7; e.hammer = 0; e.inside = false; e.flying = false; e.aquatic = false;
      Wild.list.push(e); v.raid.raiders.push(e);
    }
    v.raid.spawned = true;
    UI.sfx('hurt'); UI.toast(`Raiders at the walls of ${v.name}! ${st.guards.length ? 'Your guards move out.' : 'Nobody guards it.'}`, 'bad');
  }
  function endRaid(v, st) {
    const r = v.raid; if (!r || r.state !== 'active') return;
    for (const e of r.raiders) { e.raider = null; e.cool = 3; }
    r.raiders = []; r.state = 'done';
    setGates(v, st, false);
    if (r.breached) { st.report = { night: r.night, text: `Raiders broke in. The village barricaded itself and lost the day's takings.${r.kills ? ' Your guards drove off ' + r.kills + '.' : ''}${r.fallen ? ' ' + r.fallen + ' guard' + (r.fallen > 1 ? 's' : '') + ' fell.' : ''}` }; }
    else st.report = { night: r.night, text: `The raid was beaten off.${r.kills ? ' Your guards drove off ' + r.kills + ' raider' + (r.kills > 1 ? 's' : '') + '.' : ''}${r.fallen ? ' ' + r.fallen + ' guard' + (r.fallen > 1 ? 's' : '') + ' fell.' : ''}` };
    for (const n of v.npcs) if (n.role !== 'voodoo') n.hidden = !st.freed;
    buildGuardEnts(v);
  }
  function colOpen(v, x, z) { const vy = v.y; return !isSolid(world.getBlock(x, vy, z)) && !isSolid(world.getBlock(x, vy + 1, z)); }
  // knock the top block out of a column; a column opened at the wall ring counts as a hole
  function breakAt(v, st, x, z, fromY) {
    for (let y = fromY + 2; y >= fromY; y--) { const b = world.getBlock(x, y, z); if (isSolid(b) && b !== B.TORCH && b !== B.FUSION && !isLeaf(b)) { world.setBlock(x, y, z, B.AIR); break; } }
    const wr = wallRadius(st); const onRing = !v.founded && Math.max(Math.abs(x - v.x), Math.abs(z - v.z)) === wr;
    if (onRing && colOpen(v, x, z) && !st.holeCols.some(c => c[0] === x && c[1] === z) && st.holeCols.length < 12) st.holeCols.push([x, z]);
  }
  // raiders walk at the square; whatever blocks them two high, they hammer through (stamped villages: only the wall ring, so the houses stand)
  function raiderMove(v, st, e, dt) {
    if (e.chase) return;
    const cx = v.x + 0.5, cz = v.z + 0.5; const dx = cx - e.x, dz = cz - e.z, d = Math.hypot(dx, dz) || 1;
    if (d < 5) { breach(v, st, e); return; }
    const ux = dx / d, uz = dz / d;
    const nx = e.x + ux * e.speed * dt, nz = e.z + uz * e.speed * dt;
    e.yaw = Math.atan2(dx, dz);
    const gy = standY(nx, e.y, nz);
    if (gy != null) { e.x = nx; e.z = nz; e.y += (gy - e.y) * Math.min(1, dt * 8); e.hammer = 0; return; }
    const bx = Math.floor(e.x + ux * 0.9), bz = Math.floor(e.z + uz * 0.9);
    const wr = wallRadius(st); const cheb = Math.max(Math.abs(bx - v.x), Math.abs(bz - v.z));
    if (!v.founded && cheb !== wr) { // something other than the wall is in the way: step around it
      const sx = e.x + (-uz) * e.speed * dt * 1.5, sz = e.z + ux * e.speed * dt * 1.5; const sy = standY(sx, e.y, sz);
      if (sy != null) { e.x = sx; e.z = sz; e.y += (sy - e.y) * Math.min(1, dt * 8); } else { const tx = e.x + uz * e.speed * dt * 1.5, tz = e.z - ux * e.speed * dt * 1.5; const ty = standY(tx, e.y, tz); if (ty != null) { e.x = tx; e.z = tz; } }
      return;
    }
    e.hammer += dt; if ((e.hammer % 0.6) < dt) e.hitT = 0.15;
    let target = B.PLANKS; for (let y = Math.floor(e.y) + 2; y >= Math.floor(e.y); y--) { const b = world.getBlock(bx, y, bz); if (isSolid(b) && b !== B.TORCH) { target = b; break; } }
    if (e.hammer > 1.8 + 3 * Math.min(4, BLOCKS[target].hard)) { e.hammer = 0; breakAt(v, st, bx, bz, Math.floor(e.y)); UI.sfx('break'); }
  }
  function breach(v, st, e) {
    e.raider = null; e.cool = 2; e.wait = 1;
    if (!v.raid.breached) { v.raid.breached = true; for (const n of v.npcs) if (n.role !== 'voodoo') n.hidden = true; UI.toast(`Raiders are inside ${v.name}. The villagers barricade their doors: no pay tomorrow.`, 'bad'); }
  }
  function guardsFight(v, st, dt) {
    const r = v.raid; const cx = v.x + 0.5, cz = v.z + 0.5; const wr = wallRadius(st);
    for (const g of v.guardEnts) {
      const k = g.kin; g.cd -= dt; g.bob += dt;
      if (k.hp <= 0) continue;
      let best = null, bd = Infinity;
      for (const e of r.raiders) { const d = Math.hypot(e.x - g.x, e.z - g.z); if (d < bd) { bd = d; best = e; } }
      if (!best) { const dx = g.post.x - g.x, dz = g.post.z - g.z, d = Math.hypot(dx, dz); if (d > 0.4) { g.x += dx / d * Math.min(d, 2.5 * dt); g.z += dz / d * Math.min(d, 2.5 * dt); g.yaw = Math.atan2(dx, dz); g.moving = true; } else g.moving = false; g.y = standY(g.x, g.y, g.z) ?? g.y; continue; }
      const dx = best.x - g.x, dz = best.z - g.z, d = Math.hypot(dx, dz);
      if (d > 1.4) { const sp = 3.2 * dt; g.x += dx / d * Math.min(d, sp); g.z += dz / d * Math.min(d, sp); g.yaw = Math.atan2(dx, dz); g.moving = true; const gy = standY(g.x, g.y, g.z); if (gy != null) g.y += (gy - g.y) * Math.min(1, dt * 8); const ch = Math.max(Math.abs(g.x - cx), Math.abs(g.z - cz)); g.leap = Math.abs(ch - wr) < 1.2 ? 1.1 : 0; continue; }
      g.moving = false; g.leap = 0;
      if (g.cd > 0) continue;
      g.cd = 1.3;
      const pG = guardPower(k), rk = best.kin, pR = rk.level * (1 + 0.15 * (rk.sp.rarity || 0)) * U.clamp(rk.hp / KIN.stats(rk).hp, 0.4, 1);
      Battle.spawnFx(g, best, KIN.dominant(k.sp.elem, 1)[0]);
      best.hitT = 0.3; g.hitT = 0.2;
      if (Math.random() < pG / (pG + pR)) {
        rk.hp -= KIN.stats(rk).hp * 0.5;
        if (rk.hp <= 0) { Wild.remove(best); r.kills++; k.hp = Math.max(1, k.hp - KIN.stats(k).hp * 0.2); KIN.gainXp(k, 10 + rk.level); UI.sfx('caught'); UI.toast(`${KIN.name(k)} drove off a raider.`, 'good'); }
      } else {
        k.hp -= KIN.stats(k).hp * 0.45;
        if (k.hp <= 0) { k.hp = 0; r.fallen++; UI.sfx('down'); UI.toast(`${KIN.name(k)} fell defending ${v.name}. Revive it at the hut.`, 'bad'); }
      }
    }
  }
  // the night resolved on paper, for a village you were not at
  function simulateNight(v, st, night) {
    if (st.dome) { st.report = { night, text: raidTonight(v, night) ? 'Raiders came and beat on the dome until dawn. Nothing came in.' : 'A quiet night under the dome.' }; return false; }
    if (!raidTonight(v, night)) { st.report = { night, text: 'A quiet night.' }; return false; }
    const def = guardTotal(st) + wallBonus(v, st); const atk = raidTotal(v, st) * (0.8 + 0.4 * U.hash3(night, 8, U.strHash(v.id), world.seed));
    if (def >= atk) {
      for (const k of st.guards) if (k.hp > 0) { k.hp = Math.max(1, k.hp - KIN.stats(k).hp * 0.1); KIN.gainXp(k, 8); }
      st.report = { night, text: `Raiders came and the ${st.guards.length ? 'guards and the ' : ''}wall held.` }; return false;
    }
    const holes = 2 + Math.floor(U.hash3(night, 9, U.strHash(v.id), world.seed) * 3);
    if (v.type === 'land' && !v.founded) { const cols = ringCols(v, st).filter(c => !c[2]); for (let i = 0; i < holes && st.holeCols.length < 12; i++) { const c = cols[Math.floor(U.hash3(night, 20 + i, U.strHash(v.id), world.seed) * cols.length)]; if (!st.holeCols.some(h => h[0] === c[0] && h[1] === c[1])) st.holeCols.push([c[0], c[1]]); } if (villages.get(v.id) === v && state(v.id).stamped && (active === v || dist2d(v.x, v.z, G.player.x, G.player.z) < 120)) stampWall(v, st); }
    const alive = st.guards.filter(k => k.hp > 0).sort((a, b) => guardPower(a) - guardPower(b));
    if (alive.length) { alive[0].hp = 0; for (const k of alive.slice(1)) k.hp = Math.max(1, k.hp - KIN.stats(k).hp * 0.3); }
    st.report = { night, text: `Raiders broke through${holes ? ' and tore ' + holes + ' holes in the wall' : ''}. The village barricaded itself: no pay.${alive.length ? ' ' + KIN.name(alive[0]) + ' fell.' : ''}` };
    return true;
  }
  // dawn: every freed village settles the night and pays
  function dawn() {
    const night = curNight(); const out = { paid: 0, sum: 0, lines: [] };
    for (const id in (G.villageState || {})) {
      const st = G.villageState[id]; if (!st.freed) continue;
      const v = recordFor(id) || metaRecord(id, st); if (!v) continue;
      // a freed town stays freed. Every two to four days something hits the walls in the night, and the repairs come out of the takings
      if (v.raid) v.raid.settled = true;
      st.income = incomeFor(v, st);
      st.bank += st.income; st.earned += st.income; out.paid++; out.sum += st.income;
      if (st.upkeepIn == null) st.upkeepIn = 2 + Math.floor(Math.random() * 3);
      if (--st.upkeepIn <= 0) {
        st.upkeepIn = 2 + Math.floor(Math.random() * 3);
        const cut = Math.max(1, Math.round(st.income * (0.45 + Math.random() * 0.45)));
        const what = ['Something tried the east gate in the night', 'A pack of wild Kin went at the north wall', 'Raiders hit the stockade before dawn', 'A storm and a stray Kin brought down a stretch of fence', 'Bandits tested the walls and ran'][Math.floor(Math.random() * 5)];
        st.bank = Math.max(0, st.bank - cut); st.upkeepTotal = (st.upkeepTotal || 0) + cut;
        st.report = { night, text: `${what}. The walls held; the repairs cost ◆ ${cut}, taken from the town's share.` };
        out.lines.push(`${v.name}: ${what.toLowerCase()}. Repairs ◆ ${cut}.`);
      } else st.report = { night, text: 'A quiet night.' };
      for (const n of v.npcs) if (n.role !== 'voodoo') n.hidden = false;
      // (towns used to fall back to their tyrant every seventh night; they do not any more)
      if (false) {
        if (st.dome) out.lines.push(`${v.name}: the tyrant came back and could not get through the dome.`);
        else if (guardTotal(st) >= tyrantNeed(v)) { for (const k of st.guards) if (k.hp > 0) KIN.gainXp(k, 25); out.lines.push(`${v.name}: the tyrant came back and your guards drove him off.`); }
        else { retaken(v, st); out.lines.push(`${v.name}: the tyrant has retaken it. Your guards fell.`); }
      }
      if (v === active) { makeTraveller(v); buildGuardEnts(v); }
    }
    return out;
  }
  function pendingIncome() { let s = 0; for (const id in (G.villageState || {})) if (G.villageState[id].freed) s += G.villageState[id].bank || 0; return s; }
  function collect(v) { const st = state(v.id); const out = st.bank || 0; st.bank = 0; return out; }

  // ---- upgrades bought from the headman ----
  function canPay(cost) { if (!cost) return true; if (G.shards < cost.shards) return false; for (const k in (cost.items || {})) if (!G.player.has(k, cost.items[k])) return false; return true; }
  function pay(cost) { G.shards -= cost.shards; for (const k in (cost.items || {})) G.player.take(k, cost.items[k]); }
  function costText(cost) { return `◆ ${cost.shards}` + Object.keys(cost.items || {}).map(k => ` + ${cost.items[k]} ${ITEMS[k].name}`).join(''); }
  function upgradeWall(v) {
    const st = state(v.id); const next = wallSet(v)[(st.wall || 0) + 1];
    if (!next || v.type !== 'land' || v.founded) return 'No wall to raise here.';
    if (levelOf(st) < next.level) return `${v.name} must reach level ${next.level} first.`;
    if (!canPay(next.cost)) return 'You cannot pay for that yet: ' + costText(next.cost) + '.';
    pay(next.cost); clearWall(v, st); st.wall++; st.holeCols = []; stampWall(v, st);
    return null;
  }
  function repairWall(v) {
    const st = state(v.id); const n = st.holeCols.length; if (!n) return 'The wall is whole.';
    const cost = { shards: 5 * n }; if (!canPay(cost)) return `Repairs cost ◆ ${cost.shards}.`;
    pay(cost); st.holeCols = []; stampWall(v, st); return null;
  }
  function expand(v) {
    const st = state(v.id); if (st.expanded) return 'Already expanded.'; if (v.type !== 'land' || v.founded) return 'Only a land village can push its walls out.';
    if (levelOf(st) < EXPAND.level) return `${v.name} must reach level ${EXPAND.level} first.`;
    if (!canPay(EXPAND.cost)) return 'You cannot pay for that yet: ' + costText(EXPAND.cost) + '.';
    pay(EXPAND.cost); clearWall(v, st); st.expanded = true; st.holeCols = []; stampExpansion(v); stampWall(v, st); populate(v);
    return null;
  }
  function build(v, kind) {
    const st = state(v.id); const def = SHOP_BUILD[kind]; if (!def) return 'Unknown building.';
    if (!st.expanded) return 'Expand the walls first; there is no room inside.';
    if (def.level && levelOf(st) < def.level) return `${v.name} must reach level ${def.level} for a ${def.name}.`;
    const used = st.shops.map(s => s.slot); const slot = SLOTS.findIndex((_, i) => !used.includes(i)); if (slot < 0) return 'No room left for another building.';
    if (!canPay(def.cost)) return 'You cannot pay for that yet: ' + costText(def.cost) + '.';
    pay(def.cost); st.shops.push({ kind, slot }); stampShop(v, slot, kind); st.income = incomeFor(v, st); populate(v);
    return null;
  }
  // the trading post: a rotating shelf, seeded by the village and the two-day period
  function postShop(v) {
    const st = state(v.id); const period = Math.floor((G.dayCount || 0) / 2); const lvl = levelOf(st);
    const r = U.rng(U.combine(0xA057, U.strHash(v.id), period));
    const pool = POST_POOL.slice(); const stock = [];
    for (let i = 0; i < 3 && pool.length; i++) { const e = pool.splice(r.int(pool.length), 1)[0]; stock.push(Object.assign({}, e)); }
    const finds = FINDS.filter(f => f.level <= lvl); if (finds.length) { const f = finds[r.int(finds.length)]; stock.push({ item: f.item, n: f.n || 1, price: f.price, find: f.tale }); }
    if (!st.postSold || st.postSold.period !== period) st.postSold = { period, idx: [] };
    stock.forEach((e, i) => { e.postIdx = i; e.sold = st.postSold.idx.includes(i); });
    const base = shopDef('post', v);
    return Object.assign({}, base, { stock: stock.filter(e => !e.sold), post: v.id, greet: `${base.greet} Next delivery in ${2 - ((G.dayCount || 0) % 2)} day${2 - ((G.dayCount || 0) % 2) === 1 ? '' : 's'}.` });
  }

  // ---- founding your own village ----
  function assessSite(tx, ty, tz, ignoreId) {
    for (const v of allKnownSites(tx, tz, 1)) if (v.id !== ignoreId && dist2d(v.x, v.z, tx, tz) < FOUND.apart) return { near: v };
    const R2 = ignoreId ? 20 : FOUND.radius; let wood = 0, wall = 0; const signs = {}; let signCount = 0; const mats = { wood: 0, stone: 0, iron: 0, void: 0 };
    for (let dx = -R2; dx <= R2; dx++) for (let dz = -R2; dz <= R2; dz++) {
      const x = tx + dx, z = tz + dz; const ring = Math.max(Math.abs(dx), Math.abs(dz)) >= 7;
      const col = world.edits.get(U.mod(x, WORLD_W) * 65536 + U.mod(z, WORLD_W)); if (!col) continue;
      for (const [y, id] of col) {
        if (y < ty - 3 || y > ty + 9) continue;
        if (id === B.PLANKS || id === B.LOG) wood++;
        if (ring && y >= ty && isSolid(id) && !isLeaf(id)) { wall++; if (id === B.PLANKS || id === B.LOG || id === B.DOOR) mats.wood++; else if (id === B.STONE || id === B.BASALT || id === B.MOSS) mats.stone++; else if (id === B.IRONWALL) mats.iron++; else if (id === B.VOIDWALL) mats.void++; }
        if (y >= ty + 1) { const k = id === B.EMBER ? 'bakery' : id === B.BERRY ? 'juice' : id === B.VOID ? 'voodoo' : id === B.COPPER ? 'trader' : id === B.IRON ? 'post' : null; if (k) { if (!signs[k]) signs[k] = []; if (signs[k].length < 3) { signs[k].push({ x, y, z }); signCount++; } } }
      }
    }
    const amen = { bakery: !!signs.bakery, juice: !!signs.juice, trader: !!signs.trader, voodoo: !!signs.voodoo, post: !!signs.post };
    const wallTier = mats.void >= 12 ? 3 : mats.iron >= 18 ? 2 : mats.stone >= 24 ? 1 : 0;
    const ok = wood >= FOUND.wood && wall >= FOUND.wall && amen.bakery && amen.juice;
    return { ok, wood, wall, amen, signs, signCount, wallTier, x: tx, y: ty, z: tz };
  }
  function foundingInfo(table) {
    if (!table || !world.preset.founding) return null;
    const a = assessSite(table.x, table.y, table.z);
    if (a.near) return a.near.founded && dist2d(a.near.x, a.near.z, table.x, table.z) < 3 ? { own: a.near } : null;
    return a;
  }
  function foundVillage(table, name) {
    const a = assessSite(table.x, table.y, table.z);
    if (!a.ok) return null;
    name = (name || '').trim().slice(0, 18) || nameFor('f' + table.x + ',' + table.z);
    const id = 'f' + (G.founded ? G.founded.length + 1 : 1) + ':' + table.x + ',' + table.z;
    const f = { id, x: table.x, y: table.y, z: table.z, name, amen: a.amen, signCount: a.signCount, wallTier: a.wallTier };
    if (!G.founded) G.founded = []; G.founded.push(f);
    const v = foundedRecord(f); v.signs = a.signs; v.signCount = a.signCount; v.wallTier = a.wallTier;
    const st = state(id); st.stamped = true; st.freed = true; st.income = incomeFor(v, st); st.bank = 0; st.freedDay = curNight();
    populateFounded(v);
    active = v; Wild.noSpawn = { x: v.x, z: v.z, r: 15 };
    G.lastVillage = { id: v.id, x: v.x, y: v.y, z: v.z, name: v.name };
    G.respawnPoint = { x: v.x + 0.5, y: v.y, z: v.z + 2.5 };
    G.stats.villagesFounded = (G.stats.villagesFounded || 0) + 1;
    if (v.elder) { v.elder.wander = false; walkState = { v, stage: 'approach-founded' }; }
    return v;
  }
  function refreshFounded(v) {
    const a = assessSite(v.x, v.y, v.z, v.id); if (a.near) return;
    const changed = a.signCount !== (v.signCount || 0) || a.wallTier !== (v.wallTier || 0);
    v.signs = a.signs;
    if (changed || !v.npcs.length) {
      const had = v.npcs.length;
      v.amen = a.amen; v.signCount = a.signCount; v.wallTier = a.wallTier;
      const f = (G.founded || []).find(x => x.id === v.id); if (f) { f.amen = a.amen; f.signCount = a.signCount; f.wallTier = a.wallTier; }
      const st = state(v.id); const inc = incomeFor(v, st);
      if (had && changed) UI.toast(inc !== st.income ? `${v.name} has grown: ◆ ${inc} a day now.` : `${v.name}: the wall is ${['wood', 'stone', 'iron', 'voidsteel'][a.wallTier]} now.`, 'good');
      st.income = inc;
      populateFounded(v);
    }
  }

  // ---- update ----
  let refreshT = 0;
  function update(dt, player, inBattle) {
    if (!world.preset.villages) { active = null; activeHermit = null; return; }
    ensureFisher(); updateHermits(player, dt);
    let near = null, nd = Infinity;
    for (const v of allKnownSites(player.x, player.z, 1)) { const d = dist2d(v.x, v.z, player.x, player.z); if (d < nd) { nd = d; near = v; } }
    if (near && nd < 90) {
      frame(near, player.x, player.z);
      if (!state(near.id).stamped) { ensureStamped(near); UI.toast(`${near.name}: ${near.style === 'atlantis' ? 'a city of the sea people' : near.type === 'sea' ? 'a village on stilts' : near.type === 'deep' ? 'a village under the sea' : near.style === 'alien' ? 'an alien settlement' : near.style === 'frontier' ? 'a frontier town' : near.style === 'halo' ? 'a caravan town' : 'a village'}${state(near.id).freed ? '' : ', held by a tyrant'}.`); }
      if (near.founded) { refreshT -= dt; if (refreshT <= 0 || !near.npcs.length) { refreshT = 4; refreshFounded(near); } }
      else if (!near.npcs.length) { populate(near); ensurePortal(near); }
      if (active && active !== near) { if (active.raid && active.raid.state === 'active') endRaid(active, state(active.id)); clearLieutenants(active); }
      active = near; remember(near, state(near.id));
      Wild.noSpawn = { x: near.x, z: near.z, r: near.type === 'land' ? (near.R ? near.R + 3 : state(near.id).expanded ? 21 : 15) : 16 };
      if (near.R && !near.patched) patchLoaded(near);
      if (nd < 14) {
        if (!G.lastVillage || G.lastVillage.id !== near.id) G.lastVillage = { id: near.id, x: near.x, y: near.y, z: near.z, name: near.name, world: world.preset.id };
        if (state(near.id).freed) { G.respawnPoint = { x: near.x + 0.5, y: near.y, z: near.z + (near.type === 'deep' ? -4.5 : 4.5) }; if (!near.R && near.type !== 'deep' && G.addRoost) G.addRoost({ id: near.id, name: near.name, x: near.x + 0.5, y: near.y, z: near.z + 4.5, world: world.preset.id }); }
      }
      if (nd < 50) ensureBoss(near, G.trainerLevel);
      ensureLieutenants(near, state(near.id), player);
      if (!inBattle && !Dialogue.active() && !UI.panelOpen && !walkState && !player.flying) siege(near, state(near.id), player, dt, nd);
      if (!state(near.id).freed) Wild.noSpawn = { x: near.x, z: near.z, r: 60 };
    } else { if (active) { if (active.raid && active.raid.state === 'active') endRaid(active, state(active.id)); clearLieutenants(active); } active = null; }
    for (const v of villages.values()) if (v && v.boss && !Wild.list.includes(v.boss)) v.boss = null;
    if (fisher) { const dx = wd(player.x - fisher.x), dz = wd(player.z - fisher.z); if (Math.hypot(dx, dz) < 6) fisher.yaw = Math.atan2(dx, dz); }
    if (!active) { if (walkState && !inBattle) elderWalk(dt, player); return; }
    const v = active; const st = state(v.id);
    // raids on freed towns now happen off-screen, as wall repairs at dawn
    if (!inBattle) ensureThief(v, st, player);
    if (v.gatesClosed !== false && !isNight() && !(v.raid && v.raid.state === 'active')) setGates(v, st, false);
    // guards off duty: stand at their posts and watch you
    if (!(v.raid && v.raid.state === 'active')) for (const g of v.guardEnts) { g.bob += dt; const dx = player.x - g.x, dz = player.z - g.z; if (Math.hypot(dx, dz) < 7) g.yaw = Math.atan2(dx, dz); g.moving = false; g.leap = 0; }
    for (const n of v.npcs) {
      if (n.hidden) continue;
      n.bob = (n.bob || 0) + dt;
      if (n === v.elder && walkState) continue;
      if (n.wander === false) { const dx = player.x - n.x, dz = player.z - n.z; if (Math.hypot(dx, dz) < 5) n.yaw = Math.atan2(dx, dz); continue; }
      n.wait -= dt;
      if (n.wait <= 0) { n.wait = 3 + Math.random() * 6; const a = Math.random() * 6.28, r = 2 + Math.random() * 5; n.tx = U.clamp(n.home.x + Math.cos(a) * r, v.x - v.wanderR, v.x + v.wanderR); n.tz = U.clamp(n.home.z + Math.sin(a) * r, v.z - v.wanderR, v.z + v.wanderR); n.moving = true; }
      if (n.moving) {
        const mdx = n.tx - n.x, mdz = n.tz - n.z, md = Math.hypot(mdx, mdz);
        if (md < 0.3) n.moving = false;
        else { const step = Math.min(md, 1.3 * dt); const nx = n.x + mdx / md * step, nz = n.z + mdz / md * step; const gy = standY(nx, n.y, nz); if (gy == null) n.moving = false; else { n.x = nx; n.z = nz; n.y += (gy - n.y) * Math.min(1, dt * 8); n.yaw = Math.atan2(mdx, mdz); } }
      }
    }
    if (walkState && !inBattle) elderWalk(dt, player);
  }
  function standY(x, y, z) {
    const bx = Math.floor(x), bz = Math.floor(z);
    for (const dy of [0, 1, -1, 2, -2]) { const yy = Math.floor(y) + dy; const b0 = world.getBlock(bx, yy, bz), b1 = world.getBlock(bx, yy + 1, bz), below = world.getBlock(bx, yy - 1, bz); if ((b0 === B.AIR || b0 === B.TORCH) && b1 === B.AIR && isSolid(below) && !isLeaf(below)) return yy; }
    return null;
  }
  function elderWalk(dt, player) {
    const v = walkState.v, e = v.elder; if (!e) { walkState = null; return; }
    const strict = v.type !== 'land';
    const moveTo = (tx, tz, speed) => { const dx = tx - e.x, dz = tz - e.z, d = Math.hypot(dx, dz); if (d < 0.4) return true; const step = Math.min(d, speed * dt); const nx = e.x + dx / d * step, nz = e.z + dz / d * step; const gy = standY(nx, e.y, nz); if (gy != null) { e.x = nx; e.z = nz; e.y += (gy - e.y) * Math.min(1, dt * 8); } else if (!strict) { e.x = nx; e.z = nz; } e.yaw = Math.atan2(dx, dz); return false; };
    const dx = player.x - e.x, dz = player.z - e.z, d = Math.hypot(dx, dz);
    const st = state(v.id); const income = st.income || incomeFor(v, st);
    switch (walkState.stage) {
      case 'approach-headman': {
        walkState.t = (walkState.t || 0) + dt;
        if (d > 2.2 && d < 40 && walkState.t < 7) moveTo(player.x - dx / d * 1.8, player.z - dz / d * 1.8, 2.6);
        else if (d <= 2.2 || (d < 40 && walkState.t >= 7)) {
          e.yaw = Math.atan2(dx, dz); walkState.stage = 'done';
          const reward = 80 + v.tier * 40; G.talkNpc = e;
          Dialogue.show(e.name, [`${v.name} is free. The tyrant is gone and the doors are open: ${shopDef('bakery', v).title}, ${shopDef('juice', v).title}, ${shopDef('trader', v).title}, and the ${shopDef('voodoo', v).title}. The arch in the square is yours now: tap it to step to any village you hold${world.preset.id !== 'earth' ? ' on this world' : ''}.`, `From today this village is under your protection. We set aside ${income} Shards for you every dawn; come to me to collect them. And here are ${reward} for the fight.`, 'Leave a Kin or two with us as guards. Raiders come at night for the walls, and the tyrant will try to come back. Talk to me for the village ledger.'], () => { G.shards += reward; UI.toast(`+${reward} Shards. ${v.name} pays ${income} a day.`, 'good'); walkState = null; e.wander = true; });
        } else if (d >= 40) walkState = null;
        break;
      }
      case 'approach-founded': {
        walkState.t = (walkState.t || 0) + dt;
        if (d > 2.2 && d < 40 && walkState.t < 7) moveTo(player.x - dx / d * 1.8, player.z - dz / d * 1.8, 2.6);
        else if (d <= 2.2 || (d < 40 && walkState.t >= 7)) {
          e.yaw = Math.atan2(dx, dz); walkState.stage = 'done'; G.talkNpc = e;
          Dialogue.show(e.name, [`So this is ${v.name}. We saw the lights and came. I will speak for the village, if you will have me.`, `It is yours and under your protection: we set aside ${income} Shards for you every dawn. Build more and more will come: Void Crystal over a door for a healer, Copper for a trader, Iron Ore for a trading post.`, 'Leave guards. Raiders come at night, and a stone or iron wall holds them longer than planks.'], () => { walkState = null; e.wander = true; });
        } else if (d >= 40) walkState = null;
        break;
      }
      case 'approach': {
        if (d > 2.2) moveTo(player.x - dx / d * 1.8, player.z - dz / d * 1.8, 2.6);
        else {
          e.yaw = Math.atan2(dx, dz); walkState.stage = 'talk1'; G.talkNpc = e;
          Dialogue.show(e.name, [
            'Thank you, stranger. Grakor held this village for a whole season and kept us in our homes. You have freed us.',
            'Welcome to Stratakin. The world is layered: sky islands above, these lands, the Mines below, and the Core at the heart of everything.',
            'Kin live in every layer. They can be caught, raised and fused into new ones. Come, I will show you the table.',
          ], () => { walkState.stage = 'lead'; G.player.frozen = true; });
        }
        break;
      }
      case 'lead': {
        const arrived = moveTo(v.x + 0.5, v.z - 2.5, 2.2);
        const p = G.player; const ex = e.x - p.x, ez = e.z - p.z, ed = Math.hypot(ex, ez);
        if (ed > 2.4) { const step = Math.min(ed - 2.2, 2.4 * dt); p.x += ex / ed * step; p.z += ez / ed * step; const gy = standY(p.x, p.y, p.z); if (gy != null) p.y += (gy - p.y) * Math.min(1, dt * 8); }
        p.yaw = Math.atan2(-ex, -ez); p.pitch += (-0.05 - p.pitch) * Math.min(1, dt * 3);
        if (arrived) {
          e.yaw = Math.atan2(v.x + 0.5 - e.x, v.z + 0.5 - e.z); walkState.stage = 'talk2'; G.talkNpc = e;
          Dialogue.show(e.name, [
            'This is a Fusion Table. Tap it. Put two Kin in its grid and they become one, a little above the best of the pair. Put in sixteen and you will make something this village sings about.',
            'Materials craft gear on the same table, and anything it makes can be taken apart again. One Kin with materials becomes a statue, or a lamp if something in it burns.',
            `Take these Shards for what you did. From today ${v.name} is under your protection: we set aside ${income} Shards for you every dawn. Come to me to collect them, and for the village ledger.`,
            'Raiders come at night for the walls, and Grakor will try to come back. Leave a Kin or two with us as guards; the ledger shows what we need. Pell bakes, Mira\'s smoothies mend tired Kin, Oskar trades. Old Brannock on the shore knows where the other tyrants sit.',
          ], () => { G.player.frozen = false; G.shards += 60; UI.toast('+60 Shards from the village.', 'good'); G.stats.elderDone = true; walkState = null; e.wander = true; e.home = { x: v.x + 2.5, z: v.z + 3.5 }; });
        }
        break;
      }
      case 'talk1': case 'talk2': case 'done': break;
      default: walkState = null;
    }
  }
  function pick(player) {
    const eye = player.eye(); const f = U.forwardVec(player.yaw, player.pitch);
    let best = null, bt = 4.5;
    const list = (active ? active.npcs : []).concat(fisher ? [fisher] : [], activeHermit && activeHermit.npcs ? activeHermit.npcs : []);
    for (const n of list) {
      if (n.hidden) continue;
      const h = n.model.height * n.model.scale; const cx = n.x, cy = n.y + h / 2, cz = n.z;
      const ox = eye.x - cx, oy = eye.y - cy, oz = eye.z - cz;
      const b = ox * f[0] + oy * f[1] + oz * f[2], c = ox * ox + oy * oy + oz * oz - Math.max(0.7, h / 2) ** 2;
      const disc = b * b - c; if (disc < 0) continue;
      const t = -b - Math.sqrt(disc); if (t > 0 && t < bt) { bt = t; best = n; }
    }
    return best;
  }
  function dirWord(dx, dz) { const dirs = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']; const ang = Math.atan2(dx, -dz); return dirs[Math.round(((ang / (Math.PI * 2)) + 1) * 8) % 8]; }
  function fisherTarget() {
    let target = G.fisherTarget ? recordFor(G.fisherTarget) : null;
    if (!target || isFreed(target.id)) { target = fisher ? nearestUnfreed(fisher.x, fisher.z, true) : null; G.fisherTarget = target ? target.id : null; }
    return target;
  }
  function talk(n) {
    G.talkNpc = n; // the camera turns to whoever is speaking
    if (n.shop && active && active.R && fixShop(n)) return;
    if (n.shop === 'station') { UI.openPanel('train', {}); return; }
    if (n.shop === 'post') { UI.openPanel('shop', postShop(active)); return; }
    if (n.shop) { UI.openPanel('shop', shopDef(n.shop, active)); return; }
    if (n.role === 'voodoo') { UI.openPanel('shop', shopDef('voodoo', active)); return; }
    if (n.role === 'hermit') { talkHermit(n); return; }
    if (n.role === 'traveller') {
      const o = n.offer; const give = Object.keys(o.give).map(k => `${o.give[k]} ${ITEMS[k].name}`).join(' and '); const get = Object.keys(o.get).map(k => `${o.get[k] > 1 ? o.get[k] + ' ' : ''}${ITEMS[k].name}`).join(', ');
      Dialogue.show(n.name, [U.rng(U.combine(n.day, U.strHash(active.id))).pick(TRAVELLER_LINES), `I have ${get}. Yours for ${give}.`], () => UI.openPanel('shop', { title: 'Traveller', keeper: 'passing through', greet: `${get} for ${give}. Take it or leave it.`, stock: [{ barter: o.give, item: Object.keys(o.get)[0], n: o.get[Object.keys(o.get)[0]], traveller: n }] }));
      return;
    }
    if (n.role === 'fisher') {
      if (typeof Campaign !== 'undefined' && Campaign.fisherHook(n)) return;
      const p = G.player; const target = fisherTarget();
      // (the reel is gone: Brannock hands you a whole rod now, through the campaign)
      if (!target) { Dialogue.show(n.name, ['Every village I know of is free. Keep walking; the world is bigger than my map.', 'The water is never free of fish, mind. Cast far from the villages for the big ones.']); return; }
      const dx = wd(target.x - p.x), dz = wd(target.z - p.z), d = Math.round(Math.hypot(dx, dz));
      const kind = target.type === 'sea' ? 'out on the water, a village on stilts' : target.type === 'deep' ? 'under the sea, a glass dome on the sea floor' : 'inland';
      Dialogue.show(n.name, [
        `Caught anything? Only trouble, lately. There is a village ${kind}, about ${d} blocks to the ${dirWord(dx, dz)}: ${target.name}. A tyrant holds it, like Grakor held yours.`,
        `See the strip at the bottom of your view? That is your compass. The flag ⚑ on it now points at ${target.name}. The star ★ is your own quest, the little house ⌂ is the last village you stood in, and ✦ is your camp fire.`,
        target.type === 'deep' ? 'For the dome you will want a Breathing Bulb, or a fish to ride. Swim down the shaft in its roof. Free them and the village pays you a share, like this one.' : target.type === 'sea' ? 'A long swim. Ride a fish if you have one. Free them and the village pays you a share, like this one.' : 'Free them and the village pays you a share, like this one. The tyrants get stronger the further you go.',
        target.type === 'land' ? `${lieuCount(target) > 1 ? 'His guards hold the road in, ' + lieuCount(target) + ' of them, one checkpoint after another' : 'A guard of his holds the road in'}. Fight through with a bag of tonics, or slip round through the trees to another gate.` : `${lieuCount(target) > 1 ? 'His guards, ' + lieuCount(target) + ' of them, hang in the water on the way in' : 'A guard of his hangs in the water on the way in'}. Fight through with a bag of tonics, or swim wide around them.`,
      ]);
      return;
    }
    if (n.role === 'elder') {
      const v = active; if (!v) return;
      const st = state(v.id);
      if (typeof Npcs !== 'undefined' && Npcs.onElderTalk(v)) { Dialogue.show(n.name, ['A parcel, for me? From the road? Well. Tell them it arrived.']); return; }
      if (!st.freed) { Dialogue.show(n.name, ['The tyrant is back in the square. Beat him and we are yours again.']); return; }
      const inc = collect(v);
      if (inc > 0) { G.shards += inc; UI.sfx('caught'); UI.toast(`${v.name} set aside ◆ ${inc} for you.`, 'good'); }
      UI.openPanel('village', v);
      return;
    }
    Dialogue.show(n.name, [U.rng(Date.now() | 0).pick(VILLAGER_LINES)]);
  }
  function entities() {
    const out = [];
    if (active) {
      for (const n of active.npcs) if (!n.hidden) out.push({ x: n.x, y: n.y, z: n.z, yaw: n.yaw, model: n.model, mesh: n.mesh, scale: 1, hover: n.moving ? Math.abs(Math.sin((n.bob || 0) * 9)) * 0.08 : 0, skyMul: 1 });
      for (const g of active.guardEnts) if (g.kin.hp > 0) out.push({ x: g.x, y: g.y, z: g.z, yaw: g.yaw, model: g.model, mesh: g.mesh, scale: 1, hover: (g.model.hover || 0) + (g.leap || 0) + (g.moving ? Math.abs(Math.sin(g.bob * 9)) * 0.1 : 0) + (g.hitT > 0 ? Math.sin(g.hitT * 60) * 0.08 : 0), skyMul: 1, isMount: true });
      for (const g of active.guardEnts) if (g.hitT > 0) g.hitT -= 0.016;
    }
    if (fisher && world.preset.fisher) out.push({ x: fisher.x, y: fisher.y, z: fisher.z, yaw: fisher.yaw, model: fisher.model, mesh: fisher.mesh, scale: 1, hover: 0, skyMul: 1 });
    if (activeHermit && activeHermit.npcs) for (const n of activeHermit.npcs) out.push({ x: n.x, y: n.y, z: n.z, yaw: n.yaw, model: n.model, mesh: n.mesh, scale: 1, hover: 0, skyMul: 1 });
    return out;
  }
  function buy(shop, entry) {
    if (entry.barter) {
      for (const k in entry.barter) if (!G.player.has(k, entry.barter[k])) { UI.toast(`You need ${entry.barter[k]} ${ITEMS[k].name}.`, 'bad'); return false; }
      for (const k in entry.barter) G.player.take(k, entry.barter[k]);
      G.player.add(entry.item, entry.n || 1); UI.sfx('caught');
      if (entry.traveller && active) { const st = state(active.id); if (!st.traded) st.traded = {}; st.traded[entry.traveller.day] = true; active.npcs = active.npcs.filter(n => n !== entry.traveller); UI.toast('The traveller shoulders the pack and walks on.'); UI.closePanel(); }
      if (entry.hermit) { hermitState(entry.hermit.id).done[G.dayCount || 0] = true; G.shards += entry.shards || 0; UI.toast(`+${entry.shards} Shards. ${entry.hermit.name} is pleased.`, 'good'); UI.closePanel(); }
      return true;
    }
    const price = entry.price; if (G.shards < price) { UI.toast('Not enough Shards.', 'bad'); return false; }
    if (entry.service === 'meal') { if (G.shards < price) { UI.toast('Not enough Shards.', 'bad'); return false; } G.shards -= price; G.addBuff(entry.buff, entry.amt, entry.mins); UI.sfx('caught'); UI.toast(entry.name.split(':')[0] + '. ' + entry.name.split(':')[1].trim() + '.', 'good'); return true; }
    if (entry.service === 'teach') { const k = G.kin[G.activeIdx]; if (!k) return false; if (k.tech) { UI.toast(`${KIN.name(k)} already knows ${k.tech}.`); return false; } const pr = 60 + k.level * 12; if (G.shards < pr) { UI.toast(`Teaching ${KIN.name(k)} costs ${pr} shards.`, 'bad'); return false; } G.shards -= pr; k.tech = KIN.techFor(k); UI.sfx('quest'); UI.toast(`${KIN.name(k)} learned ${k.tech}.`, 'good'); return true; }
    if (entry.service === 'kin') { if (G.shards < price) { UI.toast('Not enough Shards.', 'bad'); return false; } const sp = KIN.bySeed(entry.seed); if (!sp) return false; const st0 = G.stats.boughtKin || (G.stats.boughtKin = {}); const key = (G.dayCount || 0) + ':' + entry.seed; if (st0[key]) { UI.toast('Sold already. Come back tomorrow.'); return false; } G.shards -= price; st0[key] = true; const k = KIN.create(sp, entry.level); const where = G.addKin(k); G.seenDex(k.sp, 'caught'); UI.sfx('caught'); UI.toast(`${KIN.name(k)} is yours${where === 'party' ? '' : ' (sent to storage: your party is full)'}.`, 'good'); return true; }
    if (entry.service === 'show') return Village.enterShow(active);
    if (entry.service === 'mend') return Combat.mend(entry.what);
    if (entry.service === 'stitch') { const P = G.player; if (P.has('painted_cloak')) { UI.toast('You already have it, darling. Wear it with confidence.'); return false; } const have = Object.keys(G.stats.pieces || {}).length, need = Camps.all().length; if (have < need) { UI.toast(`Indian cloth from ${have} of ${need} camps. I need a piece from every one, darling, or it will look like a disguise.`, 'bad'); return false; } if (G.shards < price) { UI.toast(`${price} shards for the stitching.`, 'bad'); return false; } G.shards -= price; P.take('painted_piece', 99); P.add('painted_cloak', 1); UI.sfx('quest'); G.explain('The Indian Cloak', 'Zazu stitches every strip of cloth into one cloak. In it, the Indians take you for one of their own, by day as well as night, for about four minutes per visit. Take their hoard and head for the edge of camp, or stay too long, and someone will stop you and ask who you are. You will not be able to answer. Then run.'); return true; }
    if (entry.service === 'look') { UI.openPanel('look', { kind: entry.panel }); return true; }
    if (entry.service === 'skin') { const b = G.stats.boughtSkins || (G.stats.boughtSkins = {}); if (b[entry.skin]) { G.skin = entry.skin; UI.toast('You change into it.'); return true; } if (G.shards < price) { UI.toast('Not enough Shards.', 'bad'); return false; } G.shards -= price; b[entry.skin] = true; G.skin = entry.skin; UI.sfx('caught'); UI.toast(`${entry.name.split(':')[0]}. Yours, and you are wearing it. Switch any time from the menu.`, 'good'); return true; }
    if (entry.service === 'map') { if (G.shards < price) { UI.toast('Not enough Shards.', 'bad'); return false; } G.shards -= price; if (entry.what === 'holds') { if (!G.stats.keeps) G.stats.keeps = {}; for (const k of Keeps.sites()) G.stats.keeps['seen_' + k.id] = true; } else { G.stats.mapTowns = true; } UI.sfx('caught'); UI.toast('Pim unrolls it and marks your map. Open the Map to see.', 'good'); return true; }
    if (entry.service === 'calm') { if (G.shards < price) return false; G.shards -= price; for (const k of G.kin) k.hp = KIN.stats(k).hp; UI.sfx('caught'); UI.toast('A day in the garden. Your whole party is whole again.', 'good'); return true; }
    if (entry.service === 'trust') { const k = G.kin[G.activeIdx]; if (!k) return false; if ((k.trust || 0) >= 0.98) { UI.toast(`${KIN.name(k)} already trusts you completely.`); return false; } if (G.shards < price) return false; G.shards -= price; k.trust = Math.min(1, (k.trust || 0) + 0.4); UI.sfx('caught'); UI.toast(`A long morning in the ring. ${KIN.name(k)} trusts you more (${Math.round(k.trust * 100)}%).`, 'good'); return true; }
    if (entry.service === 'tune') { const P = G.player; if (!P.has('glider')) { UI.toast('You need a glider first. Old Wren has one.', 'bad'); return false; } if ((P.gearPower.glider || {}).mark === 'Merrow') { UI.toast('Already tuned.'); return false; } if (G.shards < price) return false; G.shards -= price; P.gearPower.glider = { power: 1.3, mark: 'Merrow', shards: 0 }; UI.sfx('quest'); UI.toast('Captain Merrow re-rigs your glider. It flies further and faster now.', 'good'); return true; }
    if (entry.service === 'rest') { if (G.kin.every(k => k.hp >= KIN.stats(k).hp)) { UI.toast('Your party is already whole.'); return false; } G.shards -= price; for (const k of G.kin) k.hp = KIN.stats(k).hp; UI.sfx('caught'); UI.toast('Mama Oyé wakes and mends every Kin.', 'good'); return true; }
    G.shards -= price; G.player.add(entry.item, entry.n || 1); UI.sfx('place');
    if (shop.post && entry.postIdx != null) { const st = state(shop.post); if (st.postSold) st.postSold.idx.push(entry.postIdx); shop.stock.splice(shop.stock.indexOf(entry), 1); }
    return true;
  }
  function wakeDialogue(onDone) {
    const v = G.lastVillage ? villages.get(G.lastVillage.id) : null;
    const healer = !v || !v.founded || v.amen.voodoo;
    const speaker = v ? (healer ? v.npcs.find(n => n.role === 'voodoo') : v.elder) : null; if (speaker) { G.talkNpc = speaker; const p = G.player; speaker.yaw = Math.atan2(p.x - speaker.x, p.z - speaker.z); }
    Dialogue.show(healer ? 'Mama Oyé' : (v.elder ? v.elder.name : 'Headman'), [`You were carried in from the wild${G.lastVillage ? ' to ' + G.lastVillage.name : ''}. Your bag is gone, all but your gear and what you kept safe.`, healer ? 'I have mended your Kin, every one. Out there a Kin at zero does not wake by itself: carry Revive Tonics, or come back and pay me twenty Shards for the whole party.' : 'We have mended your Kin, every one. Out there a Kin at zero does not wake by itself: carry Revive Tonics.'], onDone);
  }
  // the compass flag for the fisherman's quest
  function questTarget() { if (!G.fisherTarget) return null; const v = recordFor(G.fisherTarget); if (!v || isFreed(v.id)) return null; return { x: v.x, z: v.z, name: v.name, type: v.type }; }
  // the ledger: everything the village panel needs
  function ledger(v) {
    const st = state(v.id); const lvl = levelOf(st);
    const next = LEVELS[lvl] != null ? LEVELS[lvl] : null;
    const guards = st.guards.map((k, i) => ({ k, i, power: guardPower(k) }));
    const def = guardTotal(st) + wallBonus(v, st); const raid = raidTotal(v, st); const need = tyrantNeed(v);
    const WS = wallSet(v);
    const wall = v.type === 'land' ? (v.founded ? { name: ['Wood', 'Stone', 'Iron', 'Voidsteel'][v.wallTier || 0], bonus: wallBonus(v, st), founded: true } : { name: WS[st.wall || 0].name, bonus: wallBonus(v, st), holes: st.holeCols.length, next: WS[(st.wall || 0) + 1] || null, repair: 5 * st.holeCols.length }) : { name: v.type === 'sea' ? 'The sea' : 'The deep', bonus: wallBonus(v, st) };
    const nightsToTyrant = null;
    return { st, lvl, next, guards, cap: guardCap(st), def, raid, need, wall, tyrant: bossLevelFor(v), nightsToTyrant, income: incomeFor(v, st), amen: amenCount(v, st), canExpand: v.type === 'land' && !v.founded && !st.expanded && !v.R, canBuild: v.type === 'land' && !v.founded && st.expanded && !v.R, slotsLeft: SLOTS.length - st.shops.length, EXPAND, SHOP_BUILD, costText, canPay, report: st.report, hasPost: hasAmen(v, st, 'post'), dome: !!st.dome, canDome: v.type === 'land' && !st.dome, hasDomeKit: G.player.has('kit_dome') };
  }
  // everything worth a dot on the minimap, near the player
  function markers(px, pz, cells = 1) {
    const out = [];
    for (const v of allKnownSites(px, pz, cells)) out.push({ id: v.id, x: px + wd(v.x - px), z: pz + wd(v.z - pz), kind: 'village', freed: isFreed(v.id), type: v.type, style: v.style, name: v.name });
    if (world.preset.villages) { const cx0 = Math.floor(U.mod(px, WORLD_W) / CELL), cz0 = Math.floor(U.mod(pz, WORLD_W) / CELL); for (let dx = -cells; dx <= cells; dx++) for (let dz = -cells; dz <= cells; dz++) { const h = hermitFor(cx0 + dx, cz0 + dz); if (h) out.push({ x: px + wd(h.x - px), z: pz + wd(h.z - pz), kind: 'hermit' }); } }
    if (G.fisherSpot && world.preset.fisher) out.push({ x: px + wd(G.fisherSpot.x - px), z: pz + wd(G.fisherSpot.z - pz), kind: 'fisher' });
    return out;
  }
  function summaryHtml() {
    const p = G.player; const t = questTarget();
    const freedN = Object.keys(G.villageState || {}).filter(id => G.villageState[id].freed && !id.startsWith('f')).length, foundedN = (G.founded || []).length;
    let s = '';
    if (t) { const dx = wd(t.x - p.x), dz = wd(t.z - p.z); s += `<b>Free ${t.name}</b> · ${Math.round(Math.hypot(dx, dz))}m ${dirWord(dx, dz)}${t.type === 'sea' ? ' · on stilts at sea' : t.type === 'deep' ? ' · a dome on the sea floor' : ''} · follow ⚑<br>`; }
    else if (G.stats.villageFreed) s += 'Ask Old Brannock on the shore where the next tyrant sits.<br>';
    s += `Freed ${freedN} · founded ${foundedN} · ◆ ${pendingIncome()} waiting with the headmen${G.lastVillage ? ' · last visited: ' + G.lastVillage.name : ''}.<br>`;
    s += 'Villages pay at dawn and level up on what they earn. Raiders hit the walls at night and the tyrant returns every seventh night: station guards and raise the walls from the headman\'s ledger.<br>';
    s += 'Found your own: a Fusion Table far from any village, 40 planks or logs built around it, Ember Ore over a doorway (bakery), a Berry bush over another (juice bar), and a wall around the square. Void Crystal adds a healer, Copper a trader, Iron Ore a trading post; each raises the daily pay.';
    return s;
  }
  function restoreStart(def) {
    if (!def) return;
    if (!villages.has('start')) villages.set('start', startRecord(def.x, def.y, def.z));
    const st = state('start'); st.stamped = true;
    if (G.stats && G.stats.villageFreed && !st.freed && !st.retakenOnce) { st.freed = true; st.income = incomeFor(villages.get('start'), st); if (st.freedDay == null) st.freedDay = curNight(); }
    if (!G.fisherSpot && !G.fisherTried) { G.fisherTried = true; placeFisher(villages.get('start')); }
  }
  return { plotsOf, plotPrice, ownsPlotAt, buyPlot, enterShow, thiefCaught, layout, townList, init, stamp, restoreStart, update, pick, talk, entities, buy, sell, sellValue, raiseDome, shopDef, freed, onBossGone, lieutenantDown, tableChallenge, placeKit, portalList, portalHere, markers, wakeDialogue, questTarget, dawn, pendingIncome, foundingInfo, foundVillage, summaryHtml, ledger, station, recall, upgradeWall, repairWall, expand, build, postShop, levelOf, SHOPS, WALLS,
    get def() { return active ? { x: active.x, y: active.y, z: active.z } : null; }, set def(v) { restoreStart(v); }, get active() { return active; }, get boss() { return active ? active.boss : null; }, get elder() { return active ? active.elder : null; }, get walking() { return !!walkState; }, get fisher() { return fisher; } };
})();

// Simple dialogue box: lines advance on tap/click; the world keeps rendering but the player is held still.
const Dialogue = (() => {
  let el = null, lines = [], idx = 0, onDone = null, speaker = '';
  function init() {
    el = document.getElementById('dialogue');
    const adv = (e) => { e.preventDefault(); next(); };
    el.addEventListener('click', adv); el.addEventListener('touchstart', adv, { passive: false });
    window.addEventListener('keydown', (e) => { if (active() && (e.code === 'Space' || e.code === 'Enter')) next(); });
  }
  function active() { return el && !el.classList.contains('hidden'); }
  function show(who, ls, done) {
    speaker = who; lines = ls; idx = 0; onDone = done || null;
    G.player.frozen = true; Controls.setEnabled(false); if (!G.mobile) Controls.unlock();
    el.classList.remove('hidden'); render();
  }
  function render() { el.innerHTML = `<div class="dlg-who">${speaker}</div><div class="dlg-text">${lines[idx]}</div><div class="dlg-more">${idx < lines.length - 1 ? 'tap to continue' : 'tap to close'} · ${idx + 1}/${lines.length}</div>`; }
  function next() {
    if (!active()) return;
    idx++;
    if (idx < lines.length) { render(); return; }
    el.classList.add('hidden');
    G.player.frozen = false; Controls.setEnabled(true); if (!G.mobile) Controls.lock();
    const cb = onDone; onDone = null; if (cb) cb();
  }
  return { init, show, active };
})();
