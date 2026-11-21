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
  let fisher = null; const loose = []; /* folk who belong to no settlement, like the net-maker at your camp */            // the shoreline quest giver
  let CELL = WORLD_W / 64, NC = 64, PREFIX = '', STYLE = 'land'; // cells per body: one candidate village and one hermit each (set in init from the preset)
  const seaLevel = () => world.preset.water ? SEA : world.preset.brine ? world.preset.brineLevel : -99;
  const FOUND = { wood: 40, wall: 36, radius: 14, apart: 70 };
  const WALLS = [
    { name: 'Palisade', block: B.PALISADE, bonus: 2, level: 1 },
    { name: 'Stone', block: B.MASONRY, bonus: 8, level: 2, cost: { shards: 60, items: { stone: 40 } } },
    { name: 'Iron', block: B.IRONWALL, bonus: 16, level: 3, cost: { shards: 150, items: { iron: 24 } } },
    { name: 'Voidsteel', block: B.VOIDWALL, bonus: 28, level: 4, cost: { shards: 400, items: { iron: 16, void: 12 } } },
  ];
  const WALL_SETS = {
    land: WALLS,
    frontier: [{ name: 'Palisade', block: B.PALISADE, bonus: 3, level: 1 }, WALLS[1], WALLS[2], WALLS[3]],
    alien: [{ name: 'Regolith', block: B.REGOLITH, bonus: 2, level: 1 }, { name: 'Basalt', block: B.BASALT, bonus: 8, level: 2, cost: { shards: 60, items: { stone: 40 } } }, { name: 'Tycho', block: B.IRONWALL, bonus: 18, level: 3, cost: { shards: 150, items: { tycho: 10, iron: 10 } } }, WALLS[3]],
    halo: [{ name: 'Sandstone', block: B.HALOWALL, bonus: 3, level: 1 }, { name: 'Basalt', block: B.BASALT, bonus: 8, level: 2, cost: { shards: 60, items: { stone: 40 } } }, WALLS[2], WALLS[3]],
  };
  const wallSet = (v) => WALL_SETS[v.style] || WALLS;
  const WALL_BLOCKS = new Set([B.PLANKS, B.STONE, B.MASONRY, B.PALISADE, B.IRONWALL, B.VOIDWALL, B.TORCH, B.LOG, B.REGOLITH, B.BASALT, B.MOONGLOW, B.RINGSHARD, B.GATE]);
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
    games: { name: 'Games Hall', marker: B.GOLD, level: 1, cost: { shards: 250, items: { planks: 24 } } },
    kinmarket: { name: 'Kin Sale Yard', marker: B.LOG, level: 2, cost: { shards: 400, items: { planks: 30 } } },
    kinshow: { name: 'Kin Show', marker: B.GOLD, level: 2, cost: { shards: 400, items: { planks: 30 } } },
    barber: { name: 'Barber', marker: B.GOLD, level: 2, cost: { shards: 300, items: { planks: 20 } } },
    mirror: { name: 'Mirror Hall', marker: B.SELENITE, level: 2, cost: { shards: 300, items: { planks: 20, glass: 8 } } },
    designer: { name: 'House of Zazu', marker: B.BERRYLEAF, level: 2, cost: { shards: 300, items: { planks: 20 } } },
    kinwear: { name: 'Kin Outfitter', marker: B.CLOUD, level: 2, cost: { shards: 300, items: { planks: 20 } } },
    tailor: { name: 'Tailor', marker: B.BERRY, level: 2, cost: { shards: 400, items: { planks: 20 } } },
    enchanter: { name: 'Enchanter', marker: B.VOID, level: 2, cost: { shards: 500, items: { planks: 20, void: 2 } } },
    cartographer: { name: 'Cartographer', marker: B.SELENITE, level: 2, cost: { shards: 300, items: { planks: 20 } } },
    daycare: { name: 'Kin Daycare', marker: B.BERRY, level: 2, cost: { shards: 300, items: { planks: 24 } } },
  };
  const SLOTS = [[-11, -11], [11, -11], [-11, 11], [11, 11], [-15, -5], [-15, 5], [15, -5], [15, 5], [-5, -15], [5, -15], [-5, 15], [5, 15]]; // house sites in the expanded ring
  const VILLAGER_LINES = [
    'The bakery\'s bread heals a tired traveller.', 'Kin on the outskirts are stronger. The old paths stay gentle.', 'Void Crystal glows purple below y 22. Bring a torch.',
    'Never swim far without a Breathing Bulb.', 'Sixteen Kin in the table at once. Nobody here has dared.', 'The Core is lava. Suit up first.', 'Berries grow back. Pick them freely.',
    'Sneak up behind a Kin and it never sees you coming.', 'A statue of your best Kin would look fine in our square.', 'They say the Mantlewyrm sleeps on Starmetal.',
    'Every freed village pays its share. Ask the headman.', 'My cousin swears a man once walked straight into an Indian camp at noon. Dressed as one of them, he said. Never told me where he got the clothes.', 'Those Indian camps: every one keeps a strip of its own cloth in a tent. Take one from each and you would have quite a coat. If anyone could sew it.', 'Zazu, in the city, can stitch anything from anything. Even disguises, they say.', 'The Indian camps keep a paddock of Windmanes. Fastest horses I ever saw. They will only carry one of their own, and they always go home.', 'There are villages out on the water, and under it. Nobody here has seen the deep ones.',
    'Found your own village? Table, forty planks, two signs and a wall. People will come.', 'Raiders come at night for the walls. Leave us a guard or two.',
    'Stay away too long and the tyrants walk back in. Show your face now and then.', 'Stone walls, then iron. The headman knows the price.',
  ];
  const SHOPS = {
    bakery: { title: 'Bakery', keeper: 'Pell', greet: 'Fresh from the oven. Bread for you, berries for the road.', stock: [{ item: 'bread', price: 10 }, { item: 'berry', price: 3, n: 3 }, { item: 'torch', price: 8, n: 4 }] },
    juice: { title: 'Juice Bar', keeper: 'Mira', greet: 'A smoothie mends a tired party. Tonics too, if you have the Shards.', stock: [{ item: 'smoothie', price: 15 }, { item: 'tonic_heal', price: 12 }, { item: 'tonic_vigor', price: 40 }] },
    voodoo: { title: 'Voodoo Hut', keeper: 'Mama Oyé', greet: 'Fainted Kin do not wake on their own. I wake them, for Shards.', stock: [{ service: 'rest', name: 'Revive and heal the whole party', price: 20 }, { item: 'tonic_revive', price: 25 }, { item: 'tonic_heal', price: 12 }] },
    trader: { title: 'Trader', keeper: 'Oskar', greet: 'Snares, planks, the odd crystal. Shards only. I buy too: ores, crystals, anything you dug up.', sell: true, stock: [{ item: 'snare', price: 12, n: 2 }, { item: 'snare2', price: 45 }, { item: 'planks', price: 6, n: 8 }, { item: 'void', price: 30 }, { item: 'glass', price: 5, n: 4 }, { item: 'snow', price: 9, n: 8 }, { item: 'frond', price: 4, n: 6 }, { item: 'iron', price: 20, n: 2 }, { item: 'copper', price: 14, n: 2 }, { item: 'ember', price: 12, n: 2 }] },
    games: { title: 'Games Hall', keeper: 'The champion', greet: '', stock: [] },
    post: { title: 'Trading Post', keeper: 'Nadia', greet: 'Whatever the travellers bring in, I sell. New stock every two days.', stock: [] },
    armoury: { title: 'Armoury', keeper: 'Bram', greet: 'Blades and axes. Nothing here is for show.', stock: [] },
    armourer: { title: 'Armourer', keeper: 'Hilde', greet: 'Helms, plate, shields. Stand still, I need your size.', stock: [] },
    alchemist: { title: 'Alchemist', keeper: 'Ottoline', greet: 'Tonics, baits, and arrows that do more than stick in things.', stock: [{ item: 'tonic_heal', price: 14 }, { item: 'tonic_revive', price: 28 }, { item: 'tonic_vigor', price: 45 }, { item: 'tonic_might', price: 45 }, { item: 'tonic_swift', price: 45 }, { item: 'bait_berry', price: 10 }, { item: 'bait_glow', price: 25 }] },
    restaurant: { title: 'Restaurant', keeper: 'Chef Anselm', greet: 'Sit, eat. A proper meal stays with you: you will feel it for the next half hour.', stock: [{ service: 'meal', buff: 'hearts', amt: 2, mins: 30, name: 'Hearty Stew: two extra hearts for 30 minutes', price: 40 }, { service: 'meal', buff: 'mine', amt: 2, mins: 30, name: 'Miner\'s Breakfast: dig twice as fast for 30 minutes', price: 35 }, { service: 'meal', buff: 'speed', amt: 1.25, mins: 20, name: 'Swift Salad: quicker on your feet for 20 minutes', price: 30 }, { service: 'meal', buff: 'breath', amt: 2, mins: 30, name: 'Diver\'s Chowder: hold your breath twice as long for 30 minutes', price: 30 }] },
    sanctuary: { title: 'Kin Sanctuary', keeper: 'Sister Imelda', greet: 'Bring me your lead Kin. Here they learn what their element can really do.', stock: [{ service: 'teach', name: 'Teach your lead Kin a fourth move: its element\'s technique', price: 0 }, { service: 'calm', name: 'A day of rest: your whole party healed and calmed', price: 25 }] },
    stables: { title: 'Riding School', keeper: 'Wrangler Tess', greet: 'A Kin that trusts you runs faster under you. We can speed that up.', stock: [{ service: 'trust', name: 'A riding lesson: your lead Kin\'s trust goes up a good way', price: 120 }, { item: 'berry', price: 3, n: 6 }] },
    aerie: { title: 'Flying School', keeper: 'Captain Merrow', greet: 'Gliders, flight nets, and a lesson in reading the wind. And no, a glider will not get you to Highmere. Nothing gets you up there but wings.', stock: [{ service: 'tune', name: 'Tune your glider: it flies further and faster (once)', price: 400 }, { item: 'snare_sky', price: 60, n: 2 }, { item: 'feather', price: 12, n: 3 }] },
    tailor: { title: 'Tailor', keeper: 'Madame Orla', greet: 'New clothes, new you. Cut to measure, worn out of here.', stock: [{ service: 'skin', skin: 'noble', name: 'Noble: velvet and gold thread', price: 600 }, { service: 'skin', skin: 'knight', name: 'Knight: polished plate and a plumed helm', price: 900 }, { service: 'skin', skin: 'corsair', name: 'Corsair: sea coat and a red sash', price: 700 }, { service: 'skin', skin: 'sage', name: 'Sage: robes the colour of dusk', price: 800 }, { service: 'skin', skin: 'duelist', name: 'Duelist: black and silver', price: 1000 }, { service: 'skin', skin: 'royal', name: 'Royal: for those who have freed a kingdom', price: 5000 }] },
    enchanter: { title: 'Enchanter', keeper: 'Magister Vael', greet: 'A word over your armour, a whisper on your blade. It wears off, they always do.', stock: [{ service: 'meal', buff: 'ward', amt: 15, mins: 60, name: 'Ward: fifteen extra armour points for an hour', price: 250 }, { service: 'meal', buff: 'blade', amt: 1.35, mins: 60, name: 'Keen Edge: your sword and axe hit a third harder for an hour', price: 220 }, { service: 'meal', buff: 'luck', amt: 1.3, mins: 30, name: 'Lucky Hand: nets hold better for 30 minutes', price: 300 }, { service: 'meal', buff: 'speed', amt: 1.35, mins: 30, name: 'Fleet Foot: run faster for 30 minutes', price: 120 }] },
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
      trader: { title: 'Exchange', keeper: 'Vreek', greet: 'Minerals of your world, minerals of mine. I take both.', sell: true, stock: [{ item: 'raygun', price: 700 }, { item: 'snare2', price: 45 }, { item: 'selenite', price: 24, n: 2 }, { item: 'tycho', price: 30, n: 2 }, { item: 'glass', price: 5, n: 4 }, { item: 'iron', price: 20, n: 2 }, { item: 'void', price: 30 }, { item: 'stone', price: 2, n: 16 }] },
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
      trader: { title: 'General Store', keeper: 'Clem', greet: 'Rope, planks, nets. I buy ore and gold, if you have any.', sell: true, stock: [{ item: 'snare', price: 12, n: 2 }, { item: 'snare2', price: 45 }, { item: 'planks', price: 6, n: 8 }, { item: 'door', price: 14 }, { item: 'iron', price: 20, n: 2 }, { item: 'copper', price: 14, n: 2 }, { item: 'chest', price: 30 }] },
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
  /* how you ride between places is the world's own: a steam train on Earth, the Glide on the Moon (a pod on a beam of light), the Rig on Halo (an armoured scrap hauler) */
  SHOP_STYLE.alien.station = { title: 'Glide Dock', keeper: 'Dockmind Ssa', greet: 'The Glide makes no sound. Stand behind the light until it stops.', stock: [] };
  SHOP_STYLE.halo.station = { title: 'Rig Yard', keeper: 'Rigmaster Dhak', greet: 'The Rig leaves when the stacks are hot. Hold on to something that is bolted down.', stock: [] };
  const RIDE = () => world && world.preset.id === 'moon' ? 'Glide' : world && world.preset.id === 'halo' ? 'Rig' : 'train';
  // the sale yard: today's ring, new every game day; every seventh day is the parade, with the rarer ones
  function saleStock(v) {
    const day = G.dayCount || 0; const parade = day % 7 === 6; const r = U.rng(U.combine(U.strHash(v.id), day * 31 + 7));
    const pool = KIN.dex('earth').filter(sp => !sp.fusion && sp.home && sp.home.layer !== 'Core' && (sp.rarity || 0) <= (parade ? 3 : 1));
    const out = []; const n = parade ? 6 : 4; const PR = [150, 420, 1600, 6500];
    for (let i = 0; i < n * 4 && out.length < n; i++) { const sp = pool[r.int(pool.length)]; const rar = sp.rarity || 0; if (!parade && rar > 1) continue; if (parade && i < 2 && rar < 2) continue; if (out.some(o => o.seed === sp.seed)) continue;
      const lv = Math.max(2, Math.min(KIN.capOf(sp), Math.round((G.trainerLevel || 1) * (0.6 + r() * 0.5)))); out.push({ service: 'kin', seed: sp.seed, level: lv, name: `${sp.names[0]}, Lv ${lv} · ${KIN.RARITY[rar].name} · from the ${sp.home.layer === 'Surface' ? sp.home.biome : sp.home.layer}`, price: Math.round(PR[rar] * (1 + lv / 40)) }); }
    return out;
  }
  // ---- every town has its own game and its own champion, and you play them for shards. The stake goes down before the first move; the winner takes both ----
  const GAME_ORDER = ['draughts', 'chess', 'tide', 'ringboard'], CHAMPS = ['Marta Steadyhand', 'Tobin Rook', 'Old Hesper', 'Ines Quill', 'Garrick Stone', 'Wenna Vale', 'Dorrit Crane', 'Osric Thorn', 'Liesel Marsh', 'Cato Finch'];
  function gameOf(v) { if (v.atlantis) return { kind: 'tide', champ: 'Tidemaster Oan', skill: 0.95, stakes: [100, 400, 1500] }; const h = U.strHash(v.id), near = v.starter ? -1 : (PLANNED || []).filter(t => t.type === 'land').sort((a, b) => a.dist - b.dist).findIndex(t => t.id === v.id);
    const wid = world.preset.id, own = wid === 'moon' ? ['moonshot', 'signal'] : wid === 'halo' ? ['hoops', 'bones'] : null; /* each world plays its own games: nobody on the Moon has seen a draughts board */
    return { kind: own ? own[h % own.length] : v.starter ? 'ringboard' : GAME_ORDER[Math.max(0, near) % GAME_ORDER.length], champ: own ? peopleOf(v)[h % peopleOf(v).length] : CHAMPS[h % CHAMPS.length], skill: U.clamp(0.22 + (v.tier || 0) * 0.14, 0.22, 1), stakes: [10, 40, 150].map(x => x * (1 + Math.min(4, v.tier || 0))) }; }
  function gameStats(v) { const gs = G.stats.games || (G.stats.games = {}); return gs[v.id] || (gs[v.id] = { won: 0, lost: 0, day: -1, n: 0 }); }
  function gamesDef(v) { const g = gameOf(v), K = Games.KINDS[g.kind], st = gameStats(v), first = g.champ.split(' ')[0];
    const greet = st.won >= 3 ? `Champion of ${v.name}. That is you now, and I have not forgotten it. Sit down.` : st.won + st.lost === 0 ? `${K.blurb} I match whatever you put down. I do not lose often.` : `You have had ${st.won} off me. I have had ${st.lost} off you. Sit down.`;
    return { title: `${K.name} · ${v.name}`, keeper: g.champ, greet, stock: g.stakes.map((stake, i) => ({ service: 'game', game: g.kind, stake, skill: g.skill, champ: g.champ, name: `${i === 0 ? 'A friendly game' : i === 1 ? 'A proper game' : 'For the title'}: ${stake} shards a side`, sub: i === 2 ? `Beat ${first} three times and the town calls you champion` : 'Winner takes both stakes', price: stake, btn: 'Play' })) }; }
  // the market stalls of Atlantis: small, one thing each, a little under what the halls ask
  const ATL_STALL_DEF = {
    stall_plums: { title: 'Sea Plums', keeper: 'Halia', greet: 'Off the kelp beds this morning. They do not keep, so eat them today.', stock: [{ item: 'berry', price: 3, n: 4 }, { item: 'smoothie', price: 14 }] },
    stall_bait: { title: 'Hook and Line', keeper: 'Corran', greet: 'You fish from the top of the water. We think that is very funny. Bait?', stock: [{ item: 'bait_berry', price: 9 }, { item: 'bait_glow', price: 22 }, { item: 'bait_void', price: 11, n: 2 }] },
    stall_shells: { title: 'Shell Stall', keeper: 'Maren', greet: 'Everything on this table was alive once and did not mind. Pearls are at the back.', stock: [{ item: 'coral', price: 7, n: 3 }, { item: 'pearl', price: 52 }, { item: 'glass', price: 5, n: 4 }] },
    stall_lamps: { title: 'Lamp Stall', keeper: 'Tavish', greet: 'It is never dark here, so I sell to people who are leaving. That would be you.', stock: [{ item: 'torch', price: 7, n: 4 }, { item: 'bulb', price: 175 }] },
    stall_rolls: { title: 'Kelp Rolls', keeper: 'Dorrie', greet: 'Hot. Well, warm. Nothing is hot down here.', stock: [{ item: 'bread', price: 9 }] },
    stall_tonics: { title: 'Tide Tonics', keeper: 'Lune', greet: 'One at a time. Somebody always mixes them and then I have to explain it to the healer.', stock: [{ item: 'tonic_heal', price: 12 }, { item: 'tonic_swift', price: 40 }, { item: 'tonic_might', price: 40 }, { item: 'tonic_vigor', price: 40 }] },
    stall_nets: { title: 'The Net Maker', keeper: 'Pike', greet: 'A cast net is a fishing net with opinions. Mine hold.', stock: [{ item: 'snare', price: 11, n: 2 }, { item: 'snare2', price: 44 }] },
    stall_curios: { title: 'Wreck Curios', keeper: 'Senna', greet: 'All of it came down in a ship. I do not ask whose.', stock: [{ item: 'iron', price: 19, n: 2 }, { item: 'copper', price: 13, n: 2 }, { item: 'chest', price: 28 }] },
  };
  // the stalls on a town square: cheap, plain, the same three trades everywhere and a different face behind each
  const TOWN_STALL_DEF = {
    stall_fruit: { title: 'Fruit Barrow', greet: 'Picked this morning. The bruised ones are cheaper, and there are no bruised ones.', stock: [{ item: 'berry', price: 3, n: 4 }, { item: 'bread', price: 9 }, { item: 'smoothie', price: 14 }] },
    stall_tackle: { title: 'Hook and Bait', greet: 'Fish do not care what you paid for the bait. I do.', stock: [{ item: 'bait_berry', price: 9 }, { item: 'bait_glow', price: 22 }, { item: 'snare', price: 11, n: 2 }] },
    stall_sundry: { title: 'Odds and Ends', greet: 'If it is not on the table I have not got it. If it is on the table, the price is the price.', stock: [{ item: 'torch', price: 7, n: 4 }, { item: 'planks', price: 6, n: 8 }, { item: 'door', price: 13 }, { item: 'chest', price: 28 }] },
  };
  const STALL_NAMES = ['Annis', 'Corwin', 'Hobb', 'Petra', 'Wat', 'Ysolt', 'Garth', 'Mabel', 'Tam', 'Oriel', 'Dunstan', 'Ffion'];
  function shopDef(kind, v) {
    if (TOWN_STALL_DEF[kind] && !(v && v.atlantis)) return Object.assign({}, TOWN_STALL_DEF[kind], { keeper: STALL_NAMES[(U.strHash((v ? v.id : 's') + kind) >>> 0) % STALL_NAMES.length] });
    if (v && v.atlantis && ATL_STALL_DEF[kind]) return ATL_STALL_DEF[kind];
    if (v && v.atlantis && kind === 'armoury') return atlForge(v);
    if (kind === 'games' && v && typeof Games !== 'undefined') return gamesDef(v);
    if (v && v.atlantis && kind === 'daycare') return Object.assign({}, SHOPS.daycare, { title: 'The Hatchery', keeper: 'Brood-keeper Thal', greet: 'Foals in the tank, yours in the pens. Leave them with me while you see the city. They come back stronger.' });
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
    { item: 'ess_Void', n: 2, price: 80, level: 3, tale: 'scraped off the walls at y 20' }, { item: 'ess_Light', n: 2, price: 80, level: 3, tale: 'brought down from the clouds' },
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
  const CLOTH = ['#8a3b32', '#3f5f86', '#5f7a3a', '#a8873a', '#6a4a7a', '#7a6a55', '#9a5a2e', '#4a6a66']; /* madder, woad, moss, ochre, plum, undyed wool, russet, teal: what a dye pot gives, not what a paint box does */
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
  const TYRANT = ['Keychain', 'Vashek', 'Stonewall', 'Ulnath', 'Skarn', 'Drelk', 'Thozz', 'Vexmar', 'Krull', 'Bigmouth', 'Zaghul', 'Nerrok'];
  const styleOf = (v) => (v && STYLE_NAMES[v.style]) ? v.style : null;
  const peopleOf = (v) => styleOf(v) ? STYLE_NAMES[v.style].people : PEOPLE;
  const headmanTitle = (v) => styleOf(v) ? STYLE_NAMES[v.style].headman : 'Headman';
  const wd = (d) => U.mod(d + WORLD_W / 2, WORLD_W) - WORLD_W / 2; // shortest delta on the wrapping map
  const dist2d = (ax, az, bx, bz) => Math.hypot(wd(ax - bx), wd(az - bz));
  const FULL = { bakery: true, juice: true, trader: true, voodoo: true };

  function init(game) {
    G = game; world = game.world; villages.clear(); hermits.clear(); active = null; activeHermit = null; walkState = null; if (filmEl) { filmEl.remove(); filmEl = null; } film = null; fisher = null; loose.length = 0;
    const vd = world.preset.villages || { nc: 64, prefix: '', style: 'land' }; NC = vd.nc; CELL = WORLD_W / NC; PREFIX = vd.prefix || ''; STYLE = vd.style || 'land';
    PLAN = null; PLANNED = null; TRAILS = null; ATL = null; world.atlantis = null; SPECIAL.clear(); LOOK.clear(); towns.clear(); LIFE.clear(); world.overlay = (c) => overlay(c); world.trailWear = (x, z) => trailWear(x, z); world.trackAt = (x, z) => trackAt(x, z);
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
  const AWAY = 12; /* days a freed place can go without seeing you before its tyrants walk back in */
  function incomeFor(v, st) {
    if (!v.founded) return 0; /* a place you freed owes you nothing by the day: it thanked you once, properly. Only a village you founded yourself pays */
    if (v.R) { const L = layout(v); const closed = st.closed || {}; const open = L.shops.filter(sh => sh.kind !== 'elder' && !closed[sh.kind]).length; const base = { start: 20, hamlet: 15, town: 45, city: 110 }[v.starter ? 'start' : v.size] || 15; return base + 8 * open; } // a town pays by its size, and more for every shop you get running
    return 8 + 5 * Math.min(12, amenCount(v, st));
  }
  function hasAmen(v, st, k) { return !!(v.amen && v.amen[k]) || (st.shops || []).some(s => s.kind === k); }
  const curNight = () => (G.dayCount || 0) + (world.time > 0.5 ? 1 : 0); // the night that is coming or just passed, named by the day it dawns into
  const isNight = () => Math.cos(world.time * Math.PI * 2) > 0.17;

  // ---- sites: one candidate per cell, decided by the terrain there ----
  // Earth keeps a fixed map of named places, not a village in every cell: a few hamlets by home, towns further out, cities beyond them
  let PLAN = null, planning = false; const SPECIAL = new Map(), LOOK = new Map();
  // ---- Atlantis: one city under the sea in every Earth world. It is not one of the ordinary sites: the plan looks over all the deep water
  // within reach of where you start and puts it on the best stretch of it, deep and wide enough for the dome ----
  const ATL_RH = 58, ATL_RV = 19; let ATL = null; // twice the ground it had: a market, a canal round it, four great houses and their gardens, and a ring of homes under the low of the glass
  function findAtlantis() {
    const sx = world.spawn.x, sz = world.spawn.z; let best = null;
    const ring = (x, z, r, n) => { let hi = -1, sum = 0; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + r; const c = world.colInfo(Math.round(x + Math.cos(a) * r), Math.round(z + Math.sin(a) * r)); if (c.lost || c.lostRim) return null; hi = Math.max(hi, c.h); sum += c.h; } return { hi, mean: sum / n }; };
    for (let dx = -2240; dx <= 2240; dx += 64) for (let dz = -2240; dz <= 2240; dz += 64) {
      const d = Math.hypot(dx, dz); if (d < 420 || d > 2250) continue;
      const x = Math.round(sx + dx), z = Math.round(sz + dz); const c = world.colInfo(x, z); if (c.lost || c.lostRim || c.h > SEA - 9) continue;
      const a = ring(x, z, 32, 8); if (!a || a.hi > SEA - 6) continue; const b = ring(x, z, 64, 14); if (!b || b.hi > SEA - 4) continue; // open water over the whole of it
      const depth = SEA - (c.h + a.mean * 2 + b.mean * 2) / 5; // how much water stands over the place
      const score = Math.min(depth, 24) * 3 - Math.abs(d - 800) / 40 - (b.hi > SEA - 8 ? 6 : 0); // deep first, then not too far to swim to
      if (!best || score > best.score) best = { x, z, h: c.h, score, d, depth };
    }
    return best;
  }
  const QUOTA = { hamlet: [2, 140, 650], town: [8, 550, 1500], city: [4, 1300, 2300] };
  function plan() {
    if (PLAN) return PLAN; if (!world.preset.villages) return null; /* the Moon and Halo keep a fixed map of hamlets, towns and cities just as Earth does */
    planning = true; const cands = [];
    const sx = Math.floor(U.mod(world.spawn.x, WORLD_W) / CELL), sz = Math.floor(U.mod(world.spawn.z, WORLD_W) / CELL); const R = Math.ceil(2400 / CELL);
    for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) { const v = siteFor(sx + dx, sz + dz); if (v && !v.founded) cands.push(v); }
    planning = false; PLAN = new Map(); const taken = [];
    { let a = null; try { a = world.preset.id === 'earth' ? findAtlantis() : null; } catch (e) { console.warn('no Atlantis:', e.message); } ATL = null; world.atlantis = null;
      if (a) { const cx = Math.floor(U.mod(a.x, WORLD_W) / CELL), cz = Math.floor(U.mod(a.z, WORLD_W) / CELL), id = PREFIX + cx + ',' + cz; // it takes the place of whatever that stretch of sea would have held
        const v = { id, x: a.x, z: a.z, y: U.clamp(Math.round(a.h), 20, SEA - ATL_RV - 5), type: 'deep', style: 'atlantis', atlantis: true, RH: ATL_RH, RV: ATL_RV, name: 'Atlantis', dist: a.d, tier: Math.max(4, Math.floor(a.d / 300) + 2), zoneBase: world.preset.zoneBase || 0, npcs: [], boss: null, elder: null, amen: FULL, guardEnts: [] };
        villages.set(id, v); ATL = v; world.atlantis = { id, x: v.x, y: v.y, z: v.z, RH: ATL_RH, RV: ATL_RV };
        const i = cands.findIndex(c => c.id === id); if (i >= 0) cands.splice(i, 1); PLAN.set(id, 'city'); taken.push(v); } }
    const byD = cands.sort((a, b) => a.dist - b.dist);
    const far = (v, r) => taken.every(t => Math.hypot(wd(t.x - v.x), wd(t.z - v.z)) > r);
    for (const size of ['hamlet', 'town', 'city']) { const [n, lo, hi] = QUOTA[size]; let got = 0, sea = 0;
      for (const v of byD) { if (got >= n) break; if (v.dist < lo || v.dist > hi || PLAN.has(v.id) || !far(v, size === 'city' ? 500 : 300)) continue;
        if (size === 'hamlet' && v.type !== 'land') continue; if (v.type !== 'land') { if (sea >= (size === 'town' ? 2 : 1)) continue; sea++; }
        PLAN.set(v.id, size); taken.push(v); got++; } }
    { const seen = new Set(), PRE = ['Far ', 'Upper ', 'Lower ', 'New ']; let k = 0; for (const v of taken) { if (v.atlantis) continue; if (seen.has(v.name)) v.name = (PLAN.get(v.id) === 'city' ? 'Old ' : PRE[k++ % 4]) + v.name; seen.add(v.name); } } /* a small pool of names off Earth: no two places on the map share one */
    PLANNED = taken.slice();
    const specs = ['stables', 'aerie', 'sanctuary']; let si = 0; for (const v of byD) if (PLAN.get(v.id) === 'town' && v.type === 'land' && si < specs.length) SPECIAL.set(v.id, specs[si++]);
    const LOOKS = ['barber', 'mirror', 'designer', 'kinwear']; const hosts = byD.filter(v => PLAN.get(v.id) === 'city' && v.type === 'land').concat(byD.filter(v => PLAN.get(v.id) === 'town' && v.type === 'land').reverse());
    byD.filter(v => PLAN.get(v.id) === 'town' && v.type === 'land').slice(0, 2).forEach(v => LOOK.set(v.id, (LOOK.get(v.id) || []).concat('kinmarket')));
    LOOKS.forEach((k, i) => { const h = hosts[i % Math.max(1, hosts.length)]; if (h) LOOK.set(h.id, (LOOK.get(h.id) || []).concat(k)); });
    return PLAN;
  }
  // ---- footpaths: the places of the map are joined by trails, the kind you find in a wood. Nothing is laid: the grass is beaten short and
  // browner along them and a little mud shows through. Each trail finds its own way over the land: round water, up the easy side of a hill.
  let TRAILS = null, PLANNED = null, trailBusy = false;
  function buildTrails() {
    const T = { cells: new Map(), n: 0, track: new Map() }; TRAILS = T; if (!world.preset.villages) return T;
    plan(); const st = villages.get('start') || pickStartSite(world.spawn); const pts = (PLANNED || []).filter(v => v.type === 'land').map(v => ({ x: v.x, z: v.z, R: v.R || TOWN_R[PLAN.get(v.id)] || 12 })); if (st) pts.unshift({ x: st.x, z: st.z, R: st.R || TOWN_R.start });
    if (pts.length < 2) return T;
    const D = (a, b) => Math.hypot(wd(a.x - b.x), wd(a.z - b.z)); const edges = new Map(); const add = (i, j) => { if (i !== j) edges.set(Math.min(i, j) + ':' + Math.max(i, j), [Math.min(i, j), Math.max(i, j)]); };
    const inT = [0]; while (inT.length < pts.length) { let best = null; for (const i of inT) for (let j = 0; j < pts.length; j++) { if (inT.includes(j)) continue; const d = D(pts[i], pts[j]); if (!best || d < best[0]) best = [d, i, j]; } add(best[1], best[2]); inT.push(best[2]); } // a tree first, so every place is reached
    for (let i = 0; i < pts.length; i++) { const o = pts.map((p, j) => [D(pts[i], p), j]).filter(e => e[1] !== i).sort((a, b) => a[0] - b[0]); for (const e of o.slice(0, 2)) if (e[0] < 1000) add(i, e[1]); } // then each place to its two nearest, which closes the loops: you can walk the circuit
    const gate = (P, Q) => { const dx = Q.x - P.x, dz = Q.z - P.z, r = P.R + 3; return Math.abs(dx) > Math.abs(dz) ? { x: P.x + Math.sign(dx) * r, z: P.z } : { x: P.x, z: P.z + Math.sign(dz) * r }; }; // a trail leaves by the gate that faces where it is going
    for (const [i, j] of edges.values()) { const A = pts[i], B = { x: A.x + wd(pts[j].x - A.x), z: A.z + wd(pts[j].z - A.z), R: pts[j].R }; routeTrail(T, gate(A, B), gate(B, A)); }
    // the railway: beyond each station's short level run the line is laid on the land itself, from town to town, finding its way as the trails do. A tree of lines, so every station is on it
    const stn = []; for (const v of [villages.get('start') || (st ? startRecord(st.x, st.y, st.z) : null)].concat((PLANNED || []).filter(v => v.type === 'land').map((v) => { try { return siteFor(Math.floor(U.mod(v.x, WORLD_W) / CELL), Math.floor(U.mod(v.z, WORLD_W) / CELL)) || v; } catch (e) { return v; } }))) { if (!v || !v.R) continue; try { const rl = layout(v).rail; if (!rl) continue; const d = v.R + 9; stn.push(rl.ax ? { x: v.x + rl.sgn * d, z: rl.line } : { x: rl.line, z: v.z + rl.sgn * d }); } catch (e) { /* a place without a station */ } }
    const inR = [0]; while (stn.length > 1 && inR.length < stn.length) { let best = null; for (const i of inR) for (let j = 0; j < stn.length; j++) { if (inR.includes(j)) continue; const d = D(stn[i], stn[j]); if (!best || d < best[0]) best = [d, i, j]; } inR.push(best[2]); const A = stn[best[1]], Bq = { x: A.x + wd(stn[best[2]].x - A.x), z: A.z + wd(stn[best[2]].z - A.z) }; routeTrail(T, A, Bq, pts); }
    return T;
  }
  function routeTrail(T, A, B, rail) {
    const G = 12, ti = Math.round((B.x - A.x) / G), tj = Math.round((B.z - A.z) / G), M = 12; const i0 = Math.min(0, ti) - M, i1 = Math.max(0, ti) + M, j0 = Math.min(0, tj) - M, j1 = Math.max(0, tj) + M, W = i1 - i0 + 1, N = W * (j1 - j0 + 1);
    const hs = new Float32Array(N).fill(-1), mul = new Float32Array(N), g = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), done = new Uint8Array(N); const id = (i, j) => (j - j0) * W + (i - i0);
    const look = (k, i, j) => { if (hs[k] >= 0) return; const wx = Math.round(A.x + i * G), wz = Math.round(A.z + j * G), c = world.colInfo(wx, wz); hs[k] = c.h; mul[k] = c.h < SEA + 1 ? 9 : (c.biome === BIOME.MOUNTAIN || c.h > SEA + 28) ? 4 : 1; if (rail && rail.some(p => Math.hypot(wd(p.x - wx), wd(p.z - wz)) < p.R + 6)) mul[k] = 30; }; // a railway goes round the towns it is not calling at
    const heap = []; const push = (f, k) => { heap.push([f, k]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let p = 0; for (;;) { let c = p * 2 + 1; if (c >= heap.length) break; if (c + 1 < heap.length && heap[c + 1][0] < heap[c][0]) c++; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; p = c; } } return top; };
    const s0 = id(0, 0), goal = id(ti, tj); look(s0, 0, 0); g[s0] = 0; push(0, s0);
    while (heap.length) { const [, k] = pop(); if (done[k]) continue; done[k] = 1; if (k === goal) break; const i = (k % W) + i0, j = Math.floor(k / W) + j0;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { if (!a && !b) continue; const ni = i + a, nj = j + b; if (ni < i0 || ni > i1 || nj < j0 || nj > j1) continue; const nk = id(ni, nj); if (done[nk]) continue; look(nk, ni, nj);
        const c = g[k] + Math.hypot(a, b) * G * mul[nk] + Math.abs(hs[nk] - hs[k]) * 5; if (c < g[nk]) { g[nk] = c; from[nk] = k; push(c + Math.hypot(ti - ni, tj - nj) * G, nk); } } }
    if (from[goal] < 0 && goal !== s0) return;
    let line = []; for (let k = goal; k >= 0; k = from[k]) { line.push([A.x + ((k % W) + i0) * G, A.z + (Math.floor(k / W) + j0) * G]); if (k === s0) break; } line.reverse(); line[0] = [A.x, A.z]; line[line.length - 1] = [B.x, B.z];
    if (rail && line.length > 2) { /* a railway is surveyed, not wandered: the stepped path the search hands back is pulled into long straights first, so the line bends where the land makes it and nowhere else. It used to wriggle left and right every dozen blocks */
      const keep = new Uint8Array(line.length); keep[0] = keep[line.length - 1] = 1; const stack = [[0, line.length - 1]];
      while (stack.length) { const [i0, i1] = stack.pop(); const p = line[i0], q = line[i1], L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; let far = 0, at = -1; for (let i = i0 + 1; i < i1; i++) { const d = Math.abs((line[i][0] - p[0]) * (q[1] - p[1]) - (line[i][1] - p[1]) * (q[0] - p[0])) / L; if (d > far) { far = d; at = i; } } if (far > 9 && at > 0) { keep[at] = 1; stack.push([i0, at], [at, i1]); } }
      const o = line.filter((_, i) => keep[i]); line = [o[0]]; for (let i = 0; i + 1 < o.length; i++) { const p = o[i], q = o[i + 1], n = Math.max(1, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / 24)); for (let t = 1; t <= n; t++) line.push([p[0] + (q[0] - p[0]) * t / n, p[1] + (q[1] - p[1]) * t / n]); } }
    for (let r = 0; r < 3; r++) { const o = [line[0]]; for (let i = 0; i + 1 < line.length; i++) { const p = line[i], q = line[i + 1]; o.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]); } o.push(line[line.length - 1]); line = o; } // rounded off: a trail has no corners
    if (rail) { const cells = []; for (let i = 0; i + 1 < line.length; i++) { const p = line[i], q = line[i + 1], d = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(1, Math.ceil(d / 0.5)); for (let t = 0; t <= n; t++) { const x = Math.round(p[0] + (q[0] - p[0]) * t / n + 0.137), z = Math.round(p[1] + (q[1] - p[1]) * t / n + 0.137), l = cells[cells.length - 1]; /* the little offset keeps a line that runs along a half-block from flicking between two columns */ if (!l || l[0] !== x || l[1] !== z) cells.push([x, z]); } }
      for (let pass = 0; pass < 2; pass++) for (let i = 1; i + 1 < cells.length; i++) { const a = cells[i - 1], c = cells[i + 1]; if (Math.max(Math.abs(a[0] - c[0]), Math.abs(a[1] - c[1])) <= 1) cells.splice(i, 1); } // one column wide, each touching only the one before and the one after, so the rails can run through them as a curve
      for (let pass = 0; pass < 3; pass++) for (let i = 1; i + 1 < cells.length; i++) { const a = cells[i - 1], b = cells[i], c = cells[i + 1]; if (a[0] === c[0] && b[0] !== a[0] && Math.abs(a[1] - c[1]) === 2) b[0] = a[0]; else if (a[1] === c[1] && b[1] !== a[1] && Math.abs(a[0] - c[0]) === 2) b[1] = a[1]; } /* a single column stepping out of line and back is pulled straight: that was the zigzag */
      for (const [x, z] of cells) T.track.set(U.mod(x, WORLD_W) * 65536 + U.mod(z, WORLD_W), 1); return; }
    const NCL = WORLD_W / 8; const put = (x, z) => { const xm = U.mod(x, WORLD_W), zm = U.mod(z, WORLD_W), k = Math.floor(xm / 8) * 4096 + Math.floor(zm / 8); let arr = T.cells.get(k); if (!arr) { arr = []; T.cells.set(k, arr); } arr.push(xm, zm); T.n++; };
    for (let i = 0; i + 1 < line.length; i++) { const p = line[i], q = line[i + 1], d = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(1, Math.ceil(d / 0.9)); for (let t = 0; t < n; t++) { const x = p[0] + (q[0] - p[0]) * t / n, z = p[1] + (q[1] - p[1]) * t / n; const wob = (U.vnoise2(x, z, 23, WORLD_W, world.seed + 975) - 0.5) * 7; const ux = (q[1] - p[1]) / (d || 1), uz = -(q[0] - p[0]) / (d || 1); put(x + ux * wob, z + uz * wob); } } // and it wanders a little either side of its line
  }
  function trackAt(x, z) { if (!TRAILS) trailWear(x, z); return !!(TRAILS && TRAILS.track && TRAILS.track.size && TRAILS.track.has(U.mod(x, WORLD_W) * 65536 + U.mod(z, WORLD_W))); }
  function trailWear(x, z) {
    if (!TRAILS) { if (trailBusy || planning || !world.spawn) return 0; trailBusy = true; try { buildTrails(); } catch (e) { console.warn('trails off:', e.message); TRAILS = { cells: new Map(), n: 0 }; } finally { trailBusy = false; } }
    const C = TRAILS.cells; if (!C.size) return 0; const xm = U.mod(x, WORLD_W), zm = U.mod(z, WORLD_W), NCL = WORLD_W / 8, cx = Math.floor(xm / 8), cz = Math.floor(zm / 8); let d2 = 99;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const arr = C.get(U.mod(cx + a, NCL) * 4096 + U.mod(cz + b, NCL)); if (!arr) continue; for (let i = 0; i < arr.length; i += 2) { const dx = wd(arr[i] - xm), dz = wd(arr[i + 1] - zm), q = dx * dx + dz * dz; if (q < d2) d2 = q; } }
    if (d2 > 20) return 0; const d = Math.sqrt(d2) + (U.vnoise2(x, z, 5, WORLD_W, world.seed + 977) - 0.5) * 1.4; return 1 - U.clamp((d - 0.6) / 2.0, 0, 1); // about three blocks wide, ragged at the edges
  }
  function siteFor(cx, cz) {
    if (!world.preset.villages) return null;
    cx = U.mod(cx, NC); cz = U.mod(cz, NC);
    const id = PREFIX + cx + ',' + cz;
    if (!planning) { const P = plan(); const v0 = villages.has(id) ? villages.get(id) : rawSite(cx, cz, id); if (!v0 || !P.has(id)) return null; v0.size = P.get(id); v0.special = SPECIAL.get(id) || null; v0.looks = LOOK.get(id) || []; if (v0.type === 'land') v0.R = TOWN_R[v0.size]; if (v0.size === 'city' && !v0.atlantis && !/^(Great|Old|High|Port) /.test(v0.name)) v0.name = (v0.type !== 'land' ? 'Port ' : 'Great ') + v0.name; if (v0.size === 'city') v0.tier = Math.max(v0.tier, 4); return v0; }
    return rawSite(cx, cz, id);
  }
  // ================= towns as part of the world =================
  // A town's streets, houses, shops and levelled ground are drawn into each chunk as it is generated, like terrain, so nothing
  // the size of a city ever goes into the save. Only what you change yourself is saved.
  const TOWN_R = { start: 34, hamlet: 40, town: 50, city: 66 }; // only the place you start in is small: the next one along is already a proper village, bigger than home
  const NCH = WORLD_W / CH;
  const TOWN_SHOPS = {
    start: ['elder', 'bakery', 'juice', 'trader', 'voodoo', 'games', 'inn', 'restaurant', 'station'],
    hamlet: ['elder', 'bakery', 'juice', 'trader', 'voodoo', 'games', 'inn', 'restaurant', 'armoury', 'alchemist', 'station'],
    town: ['elder', 'bakery', 'juice', 'trader', 'voodoo', 'games', 'inn', 'restaurant', 'armoury', 'alchemist', 'post', 'daycare', 'station'],
    city: ['elder', 'bakery', 'juice', 'trader', 'voodoo', 'inn', 'restaurant', 'armoury', 'armourer', 'alchemist', 'post', 'sanctuary', 'tailor', 'enchanter', 'cartographer', 'daycare', 'kinmarket', 'kinshow', 'games', 'restaurant', 'inn', 'station', 'stables', 'aerie'],
  };
  const towns = new Map(); // id -> layout
  function townList() { const out = []; const st = villages.get('start'); if (st && st.R) out.push(st); if (PLAN) for (const id of PLAN.keys()) { const v = villages.get(id); if (v && v.R) out.push(v); } return out; }
  function layout(v) {
    if (towns.has(v.id)) return towns.get(v.id);
    const R = v.R, vx = v.x, vz = v.z, vy = v.y; const M = MATS[v.style] || MATS.land; MAT = M;
    const buckets = new Map(); const push = (x, y, z, id) => { if (y < 1 || y >= WH) return; if (M.pod && (id === B.BARREL || id === B.CRATE || id === B.PLANTER || id === B.FLOWERS || id === B.FERN || id === B.BERRY)) id = B.AIR; /* nothing grows in a pot on the Moon, and nobody up there coopers a barrel */ const cx = U.mod(Math.floor(x / CH), NCH), cz = U.mod(Math.floor(z / CH), NCH); const k = cx + ',' + cz; let b = buckets.get(k); if (!b) { b = []; buckets.set(k, b); } b.push(U.mod(x, CH), y, U.mod(z, CH), id); };
    const mill = v.size !== 'city' && M.houses && R >= 34; // towns keep a corner of open meadow for a windmill on a knoll
    const city = v.size === 'city'; ROOF_OVR = city || v.size === 'town' ? 'tiles' : 'thatch'; VST = city ? null : villageStyle(vx, vz, v.size === 'town');
    const streets = [0].concat(city ? [-40, -20, 20, 40] : v.size === 'town' ? [-24, 24] : []);
    const onStreet = (dx, dz) => { if (Math.max(Math.abs(dx), Math.abs(dz)) >= R - 4 && Math.max(Math.abs(dx), Math.abs(dz)) <= R - 2) return true; for (const s0 of streets) { if (Math.abs(dx - s0) <= 1 && Math.abs(dz) <= R) return true; if (Math.abs(dz - s0) <= 1 && Math.abs(dx) <= R) return true; } return false; };
    // the ground: levelled across the whole footprint. The air above is cleared to the height of the tallest nearby natural column plus
    // a canopy, so trees rooted on higher ground just outside a column cannot leave their leaves hanging over the town
    const RB = R + 9, W2 = 2 * RB + 1, hN = new Int16Array(W2 * W2); // natural heights, six blocks beyond the footprint: a tree rooted out there can still reach in
    for (let dx = -RB; dx <= RB; dx++) for (let dz = -RB; dz <= RB; dz++) hN[(dx + RB) * W2 + (dz + RB)] = world.colInfo(U.mod(vx + dx, WORLD_W), U.mod(vz + dz, WORLD_W)).h;
    const hMax = (dx, dz) => { let m = 0; for (let a = -6; a <= 6; a++) for (let b = -6; b <= 6; b++) { const v0 = hN[(dx + a + RB) * W2 + (dz + b + RB)]; if (v0 > m) m = v0; } return m; };
    for (let dx = -R - 3; dx <= R + 3; dx++) for (let dz = -R - 3; dz <= R + 3; dz++) {
      const x = vx + dx, z = vz + dz; const h = hN[(dx + RB) * W2 + (dz + RB)], hm = hMax(dx, dz);
      for (let y = Math.min(h, vy - 2); y <= vy - 2; y++) push(x, y, z, M.under);
      const plaza = Math.abs(dx) <= 6 && Math.abs(dz) <= 6;
      push(x, vy - 1, z, plaza ? (Math.max(Math.abs(dx), Math.abs(dz)) === 6 ? M.plazaEdge : M.plaza) : onStreet(dx, dz) ? M.plaza : (city && M === MATS.land && Math.max(Math.abs(dx), Math.abs(dz)) < R - 4) ? QUARTERS[quarterOf(dx, dz)].ground : M.ground);
      for (let y = vy; y <= Math.max(hm, vy) + 14; y++) push(x, y, z, B.AIR); // a pine is up to fourteen blocks of trunk and needles
    }
    world.fellCrowns(vx - R - 3, vz - R - 3, vx + R + 3, vz + R + 3, (x, y, z) => push(x, y, z, -1)); // and the crowns of the trees that stood here do not stay hanging beyond the edge (-1: clear only if it is tree)
    // the square: a fountain in the cities, the Fusion Table to one side
    const stalls = [];
    if (city) {
      for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { push(vx + a, vy - 1, vz + b, B.MASONRY); if (Math.hypot(a, b) <= 2.5) push(vx + a, vy, vz + b, (a || b) ? B.BASIN : B.FOUNTAIN); }
      push(vx + 5, vy, vz - 5, B.FUSION);
    } else {
      push(vx, vy, vz, B.FUSION); if (M.houses) push(vx + 3, vy, vz - 6, B.SIGNPOST);
      // the town well, off to one side of the square: a stone kerb round the water, two posts and a little tiled roof
      const wx0 = vx - 4, wz0 = vz + 4;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { push(wx0 + a, vy - 1, wz0 + b, M.plazaEdge); push(wx0 + a, vy, wz0 + b, (a || b) ? B.MASONRY : B.WATER); }
      for (const a of [-1, 1]) for (let y = vy + 1; y <= vy + 2; y++) push(wx0 + a, y, wz0, B.LOG);
      for (let b = -1; b <= 1; b++) { push(wx0 - 1, vy + 3, wz0 + b, B.TILES); push(wx0, vy + 4, wz0 + b, B.TILES); push(wx0 + 1, vy + 3, wz0 + b, B.TILES); }
      push(wx0, vy + 3, wz0, B.BEAM); // the windlass beam under the ridge
      // market stalls on the square, in the hamlets and the towns: two posts, a counter with what is for sale on it, an awning, and somebody behind it. The first village has none: it is the small one
      if (!v.starter) for (const [k, sx, sz, fx, fz] of (v.size === 'town' ? [['stall_fruit', 4, -5, 0, 1], ['stall_tackle', -4, -5, 0, 1], ['stall_sundry', 5, 4, -1, 0]] : [['stall_fruit', 4, -5, 0, 1], ['stall_tackle', -4, -5, 0, 1]])) { const x = vx + sx, z = vz + sz, ax = Math.abs(fz), az = Math.abs(fx); // (fx, fz): the way it faces; (ax, az): along the counter
        for (const a of [-1, 1]) { push(x + ax * a, vy, z + az * a, M.post); push(x + ax * a, vy + 1, z + az * a, M.post); }
        push(x, vy, z, M.counter); push(x, vy + 1, z, k === 'stall_fruit' ? B.BERRY : k === 'stall_tackle' ? B.PEBBLES : B.FLOWERS);
        for (let a = -1; a <= 1; a++) push(x + ax * a, vy + 2, z + az * a, B.AWNING);
        stalls.push({ kind: k, x, z, fx, fz }); }
    }
    // a market street in the cities: stalls under coloured awnings down the west road
    if (city) { for (let d = 10; d < R - 10; d += 4) for (const sg of [-1, 1]) { const x = vx - d, z = vz + sg * 2; // each stall: two posts, a counter with wares between them, an awning over all three
      for (const a of [-1, 1]) { push(x + a, vy, z, M.post); push(x + a, vy + 1, z, M.post); }
      push(x, vy, z, B.CHEST); push(x, vy, z + sg, (d / 4) % 2 ? B.BERRY : B.PEBBLES);
      for (let a = -1; a <= 1; a++) push(x + a, vy + 2, z, B.AWNING); } }
    // a castle on a hill at the back of a city, a waterfall down its side
    let castle = null;
    if (city) {
      const cz0 = vz - R + 16, H = 7, hr = 11; castle = { x: vx, z: cz0, y: vy + H, hr };
      for (let a = -hr - 3; a <= hr + 3; a++) for (let b = -hr; b <= hr; b++) { const t = Math.max(Math.abs(a) - hr, 0); const top = vy - 1 + H - t * 2; if (top < vy - 1) continue; for (let y = vy; y <= top; y++) push(vx + a, y, cz0 + b, B.STONE); push(vx + a, top, cz0 + b, t ? B.GRASS : M.plaza); }
      for (let i = 0; i < H; i++) for (let w = -1; w <= 1; w++) { for (let y = vy; y <= vy - 1 + i; y++) push(vx + w, y, cz0 + hr + 1 + (H - 1 - i), B.STONE); push(vx + w, vy - 1 + i, cz0 + hr + 1 + (H - 1 - i), M.plazaEdge); } // steps up the hill
      const K = vy + H; const F = B.MASONRY, RF = B.SLATE;
      // the curtain wall, radius 7, four high with battlements; arrow slits in the middle of each side; a walkway on the inside
      for (let a = -7; a <= 7; a++) for (let b = -7; b <= 7; b++) {
        const m = Math.max(Math.abs(a), Math.abs(b)); if (m < 7) { for (let y = K; y <= K + 16; y++) push(vx + a, y, cz0 + b, B.AIR); continue; }
        const along = Math.abs(a) === 7 ? b : a;
        for (let y = K; y <= K + 3; y++) push(vx + a, y, cz0 + b, (y === K + 2 && Math.abs(along) % 3 === 0 && Math.abs(along) < 6) ? B.SLIT : F);
        if (along % 2 === 0) push(vx + a, K + 4, cz0 + b, F); // merlons
      }
      for (let a = -6; a <= 6; a++) for (let b = -6; b <= 6; b++) if (Math.max(Math.abs(a), Math.abs(b)) === 6) push(vx + a, K + 2, cz0 + b, B.PLANKS); // the walkway behind the parapet
      // round corner towers, 3x3, nine high, each under a slate pyramid; a banner on the face of each toward the town
      for (const [a, b] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]) {
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { for (let y = K - 1; y <= K + 8; y++) push(vx + a + i, y, cz0 + b + j, (y === K + 6 && (i === 0 || j === 0) && (i !== 0 || j !== 0)) ? B.SLIT : F); push(vx + a + i, K + 9, cz0 + b + j, (i === 0 && j === 0) ? F : ((i + j) % 2 ? F : B.AIR)); }
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) push(vx + a + i, K + 10, cz0 + b + j, RF); push(vx + a, K + 11, cz0 + b, RF); // the roof: a pyramid of slate
        push(vx + a, K + 12, cz0 + b, M.light);
        if (b > 0) push(vx + a, K + 5, cz0 + b + 2, B.BANNER);
      }
      // the gatehouse on the south wall: an arch three wide and four high between two square turrets, a portcullis beam, banners
      for (let w = -1; w <= 1; w++) for (let y = K; y <= K + 3; y++) push(vx + w, y, cz0 + 7, B.AIR);
      for (let w = -1; w <= 1; w++) { push(vx + w, K + 4, cz0 + 7, F); push(vx + w, K + 5, cz0 + 7, (w === 0) ? B.AIR : F); } push(vx, K + 5, cz0 + 7, F); push(vx, K + 6, cz0 + 7, F);
      for (const w of [-2, 2]) { for (let y = K; y <= K + 6; y++) { push(vx + w, y, cz0 + 7, F); push(vx + w, y, cz0 + 8, F); } push(vx + w, K + 7, cz0 + 7, F); push(vx + w, K + 7, cz0 + 8, M.light); push(vx + w, K + 3, cz0 + 9, B.BANNER); }
      for (let w = -2; w <= 2; w++) { push(vx + w, K - 1, cz0 + 8, M.plaza); }
      // the keep: 7 by 6, two storeys of dressed stone with framed windows, a slate roof pitched along x, a door toward the gate
      for (let a = -3; a <= 3; a++) for (let b = -5; b <= 0; b++) {
        const wall = Math.abs(a) === 3 || b === -5 || b === 0; const win = (Math.abs(a) === 3 && (b === -1 || b === -4)) || ((b === -5 || b === 0) && Math.abs(a) === 1);
        for (let y = K; y <= K + 5; y++) push(vx + a, y, cz0 + b, wall ? ((win && (y === K + 1 || y === K + 4)) ? B.GLASS : F) : B.AIR);
        push(vx + a, K + 2, cz0 + b, wall ? F : B.PLANKS); // the first floor
        push(vx + a, K + 6, cz0 + b, F); // the wall head
      }
      push(vx, K, cz0, B.AIR); push(vx, K + 1, cz0, B.AIR); push(vx, K + 2, cz0, B.GOLD); // the door (the gold lintel marks the elder's house)
      for (let a = -4; a <= 4; a++) for (let b = -6; b <= 1; b++) push(vx + a, K + 6 + (4 - Math.abs(a)), cz0 + b, RF); // the roof: ridge along z at a = 0, eaves one block out and one step down
      for (let a = -3; a <= 3; a++) for (const b of [-5, 0]) for (let y = K + 7; y < K + 7 + (3 - Math.abs(a)); y++) push(vx + a, y, cz0 + b, F); // the gables
      push(vx, K + 10, cz0 - 2, M.light); push(vx, K + 4, cz0 - 2, M.lamp || M.light);
      push(vx - 2, K + 9, cz0 - 5, F); push(vx - 2, K + 10, cz0 - 5, F); push(vx - 2, K + 11, cz0 - 5, F); // a chimney
      // the courtyard: cobbles, a lamp either side of the keep door, and the steps down to the gate
      for (let a = -6; a <= 6; a++) for (let b = -6; b <= 6; b++) if (!(Math.abs(a) <= 3 && b <= 0 && b >= -5)) push(vx + a, K - 1, cz0 + b, M.plaza);
      for (const a of [-2, 2]) push(vx + a, K, cz0 + 2, M.lamp || M.light);
      // the waterfall: a channel off the hilltop, a sheet of water down its east face, a pool at the bottom
      const fx = vx + hr + 1; for (let y = vy; y <= K - 1; y++) for (let b = -1; b <= 1; b++) push(fx, y, cz0 + b, B.WATER);
      for (let a = 1; a <= 4; a++) for (let b = -2; b <= 2; b++) { push(fx + a, vy - 1, cz0 + b, B.STONE); push(fx + a, vy, cz0 + b, a === 4 || Math.abs(b) === 2 ? B.STONE : B.WATER); }
    }
    const lamp = (x, z) => { if (M.lamp) push(x, vy, z, M.lamp); else { push(x, vy, z, M.post); push(x, vy + 1, z, M.light); } };
    for (const [a, b] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) lamp(vx + a, vz + b);
    if (M.houses && !city) { // the four pockets of green between the square and the first houses: a great old tree, a windmill, a kitchen garden, a woodyard; flowers in the grass between
      { const tx = vx + 9, tz = vz - 9; for (let y = vy; y <= vy + 6; y++) push(tx, y, tz, B.LOG); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { push(tx + a, vy, tz + b, B.LOG); push(tx + a * 2, vy + 5, tz + b * 2, B.LOG); push(tx + a, vy + 5, tz + b, B.LOG); }
        for (let a = -5; a <= 5; a++) for (let b = -5; b <= 5; b++) for (let c = -2; c <= 3; c++) { const dd = (a * a + b * b) / 22 + (c * c) / (c < 0 ? 5 : 9.5); if (dd <= 1 && (dd > 0.25 || c > 0) && !(a === 0 && b === 0 && c <= 0)) push(tx + a, vy + 7 + c, tz + b, B.LEAVES); }
        for (const [a, b] of [[2, 1], [-2, 1], [1, -2], [-1, 2], [2, -1], [-2, -2]]) push(tx + a, vy, tz + b, B.FLOWERS); }
      { const ox = vx - 9, oz = vz - 9; for (const [a, b] of [[-1, -1], [1, 1]]) { push(ox + a, vy, oz + b, B.LOG); push(ox + a, vy + 1, oz + b, B.LOG); for (let p = -1; p <= 1; p++) for (let q = -1; q <= 1; q++) for (let c = 2; c <= 3; c++) if (c === 2 || (!p || !q)) push(ox + a + p, vy + c, oz + b + q, B.LEAVES); } push(ox + 1, vy, oz - 1, B.PLANTER); push(ox - 1, vy, oz + 1, B.CRATE); } // two apple trees
      { const gx = vx + 9, gz = vz + 9; for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const edge = Math.abs(a) === 2 || Math.abs(b) === 2; if (edge) { if (!(a === 0 && b === -2)) push(gx + a, vy, gz + b, B.FENCE); } else { push(gx + a, vy - 1, gz + b, B.DIRT); push(gx + a, vy, gz + b, (a + b) % 2 ? B.BERRY : B.FERN); } } }
      { const wx0 = vx - 9, wz0 = vz + 9; for (const [a, b, h] of [[0, 0, 2], [1, 0, 1], [0, 1, 1], [-1, 0, 1]]) for (let y = 0; y < h; y++) push(wx0 + a, vy + y, wz0 + b, B.LOG); push(wx0 + 2, vy, wz0 - 1, B.BARREL); push(wx0 - 1, vy, wz0 - 2, B.CRATE); push(wx0 + 1, vy, wz0 + 2, B.PLANTER); }
      for (let dx = -11; dx <= 11; dx++) for (let dz = -11; dz <= 11; dz++) { const m = Math.max(Math.abs(dx), Math.abs(dz)); if (m < 8 || onStreet(dx, dz) || (Math.abs(dx) >= 7 && Math.abs(dz) >= 7)) continue; if (Math.abs(dx) > 10 || Math.abs(dz) > 10) continue; const h = U.hash3(vx + dx, 21, vz + dz, 0x51); if (h < 0.2) push(vx + dx, vy, vz + dz, h < 0.12 ? B.FLOWERS : B.FERN); }
    }
    if (mill) { // the windmill stands by itself on a grassy knoll in the north-west meadow, clear of every roof, sails to the town
      const mx = vx - 20, mz = vz - 20;
      for (let a = -7; a <= 7; a++) for (let b = -7; b <= 7; b++) { const r = Math.hypot(a, b); const up = r < 4.2 ? 2 : r < 6.2 ? 1 : 0; for (let k = 1; k <= up; k++) push(mx + a, vy - 1 + k, mz + b, k === up ? M.ground : B.DIRT); if (!up && r < 7.5 && U.hash3(mx + a, 22, mz + b, 0x52) < 0.3) push(mx + a, vy, mz + b, B.FLOWERS); else if (up === 1 && U.hash3(mx + a, 23, mz + b, 0x53) < 0.2) push(mx + a, vy + 1, mz + b, B.FLOWERS); }
      const y0 = vy + 2;
      for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const q = a * a + b * b; if (q > 5) continue; for (let y = 0; y < 8; y++) { if (y >= 5 && q > 4) continue; push(mx + a, y0 + y, mz + b, y < 2 ? B.MASONRY : B.PLASTER); } }
      push(mx + 2, y0, mz, B.BEAM); push(mx + 2, y0 + 1, mz, B.BEAM); push(mx + 2, y0 + 3, mz, B.GLASS); push(mx - 2, y0 + 3, mz, B.GLASS); push(mx, y0 + 4, mz - 2, B.GLASS);
      push(mx, y0 + 5, mz + 3, B.SAILS);
      push(mx + 3, vy + 2, mz + 1, B.BARREL); push(mx + 3, vy + 2, mz - 1, B.CRATE); push(mx + 4, vy + 1, mz + 2, B.PLANTER);
      for (let k = 4; k <= 8; k++) push(mx + k, vy - 1, mz, B.GRAVEL); // a worn path up to the door
    }
    if (M === MATS.alien) for (let d = -5; d <= 5; d++) { push(vx + d, vy + 2, vz - 6, B.GLOWLINE); push(vx + d, vy + 2, vz + 6, B.GLOWLINE); push(vx - 6, vy + 2, vz + d, B.GLOWLINE); push(vx + 6, vy + 2, vz + d, B.GLOWLINE); }
    if (M.houses || M === MATS.halo) { // the square is dressed for a fair: bunting round its four sides, pots at the inner corners, and in a town two stalls with their wares
      for (let d = -5; d <= 5; d++) { push(vx + d, vy + 2, vz - 6, B.BUNTING); push(vx + d, vy + 2, vz + 6, B.BUNTING); push(vx - 6, vy + 2, vz + d, B.BUNTING); push(vx + 6, vy + 2, vz + d, B.BUNTING); }
      if (M.houses) for (const [a, b] of [[5, 5], [5, -5], [-5, -5]]) push(vx + a, vy, vz + b, B.PLANTER);
      if (!city) for (const [sx, sz, wares] of [[4, -3, B.CRATE], [-4, -3, B.BARREL]]) { const x = vx + sx, z = vz + sz;
        push(x, vy, z, B.CHEST); push(x + Math.sign(sx) * 2, vy, z, wares); push(x, vy, z - 1, wares === B.CRATE ? B.BARREL : B.CRATE);
        for (let a = -1; a <= 1; a++) push(x + a, vy + 2, z, B.AWNING); }
    }
    // lamps along the streets
    for (const s0 of streets) for (let d = 9; d < R - 3; d += 8) for (const sg of [-1, 1]) { lamp(vx + s0 + 2 * sg, vz + d * sg); lamp(vx + d * sg, vz + s0 + 2 * sg); }
    // lots: a house on every free plot, its door turned to the nearest street
    const lots = [];
    const axis = new Set(); for (const s0 of streets) for (const sg of [-1, 1]) for (let g = s0 + sg * 6; Math.abs(g) + 4 <= R - 5; g += sg * 9) axis.add(g);
    const AX = [...axis].sort((a, b) => a - b);
    for (const gx of AX) for (const gz of AX) {
      if (Math.abs(gx) < 12 && Math.abs(gz) < 12) continue;
      if (castle && Math.abs(gx) <= 21 && gz <= -R + 32) continue;
      if (mill && gx <= -15 && gz <= -15) continue; // the mill's meadow
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
    for (const k of kinds) { if (k === 'elder' && castle) { shops.push({ kind: 'elder', x: castle.x, z: castle.z + 2, dirX: 0, dirZ: 1, castle: true, y: castle.y }); continue; } const i = k === 'station' ? stI : free.shift(); if (i == null || i < 0) continue; const sh = Object.assign({ kind: k }, lots[i]); if (k === 'station') { sh.lot = { x: sh.x, z: sh.z }; sh.x -= sh.dirX * 2; sh.z -= sh.dirZ * 2; sh.raised = true; } shops.push(sh); lots[i].used = true; }
    // building plots: empty lots marked with lamps at the corners, for sale to you
    const nPlots = { start: 1, hamlet: 1, town: 2, city: 3 }[v.starter ? 'start' : v.size] || 1; const plots = [];
    const spare = lots.filter(l => !l.used); for (let i = 0; i < nPlots && spare.length; i++) { const l = spare.splice(Math.floor(spare.length * (0.35 + 0.2 * i)) % spare.length, 1)[0]; l.used = true; l.plot = true; plots.push({ x: l.x, z: l.z, i });
      for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) push(l.x + a, vy - 1, l.z + b, Math.max(Math.abs(a), Math.abs(b)) === 4 ? M.plazaEdge : M.ground);
      for (const [a, b] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) lamp(l.x + a, l.z + b); }
    // the railway: the track runs past the station's door, out through the wall and away across the land; a raised platform lies between the door and the track
    let rail = null;
    { const sh = shops.find(x => x.kind === 'station');
      if (sh && sh.lot && (sh.dirX || sh.dirZ)) {
        const dX = sh.dirX, dZ = sh.dirZ, c = sh.lot; const ax = dZ !== 0; // the door faces along z: the track runs along x
        const line = ax ? c.z + dZ * 4 : c.x + dX * 4, along0 = ax ? c.x : c.z, sgn = ax ? (Math.sign(c.x - vx) || 1) : (Math.sign(c.z - vz) || 1);
        const at = (a, l) => ax ? [a, l] : [l, a]; const base = ax ? vx : vz;
        rail = { ax, line, along0, sgn, plat: ax ? c.z + dZ * 3 : c.x + dX * 3, plat2: ax ? c.z + dZ * 2 : c.x + dX * 2, y: vy, sh: { x: sh.x, z: sh.z } };
        for (let a = along0 - 3 * sgn; (a - base) * sgn <= R + 3; a += sgn) { const [x, z] = at(a, line); push(x, vy - 1, z, M === MATS.land || !M.plazaEdge ? B.GRAVEL : M.plazaEdge); push(x, vy, z, B.RAIL); push(x, vy + 1, z, B.AIR); push(x, vy + 2, z, B.AIR); }
        { const [x, z] = at(along0 - 4 * sgn, line); push(x, vy, z, B.BEAM); } // the buffer stop at the dead end, under the station's own eave
        for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) if (Math.abs(dx) === 4 || Math.abs(dz) === 4) push(sh.x + dx, vy, sh.z + dz, M.plazaEdge); // the plinth the station stands on
        for (let k = -3; k <= 7; k++) { const a = along0 + sgn * k; const [x1, z1] = at(a, rail.plat), [x2, z2] = at(a, rail.plat2); push(x1, vy, z1, M.plazaEdge); push(x2, vy, z2, M.plaza); } // the platform runs from the station front out toward the gate
        for (const k of [-3, 7]) { const [x, z] = at(along0 + sgn * k, rail.plat2); push(x, vy + 1, z, M.lamp || M.light); }
      }
    }
    // the quarters: a landmark on a spare lot near the middle of each, and its own clutter on the open ground
    const quartered = city && M === MATS.land; const marks = [];
    if (quartered) {
      const hsh = (x, z, k) => U.hash3(x, k, z, 0x51);
      for (const q of ['old', 'garden', 'merchant', 'craft']) { const sx = q === 'old' || q === 'merchant' ? -1 : 1, sz = q === 'old' || q === 'garden' ? -1 : 1;
        const cand = lots.filter(l => !l.used && Math.sign(l.x - vx) === sx && Math.sign(l.z - vz) === sz).sort((a, b) => Math.hypot(a.x - vx - sx * 30, a.z - vz - sz * 30) - Math.hypot(b.x - vx - sx * 30, b.z - vz - sz * 30))[0]; if (!cand) continue;
        cand.used = true; cand.landmark = q; marks.push({ q, x: cand.x, z: cand.z }); const lx = cand.x, lz = cand.z;
        if (q === 'old') { // a statue on a stepped plinth, a banner pole at each corner
          for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) { push(lx + a, vy - 1, lz + b, B.COBBLE); const m = Math.max(Math.abs(a), Math.abs(b)); if (m <= 2) push(lx + a, vy, lz + b, B.MASONRY); if (m <= 1) push(lx + a, vy + 1, lz + b, B.MASONRY); }
          push(lx, vy + 2, lz, B.MASONRY); push(lx, vy + 3, lz, B.STATUE);
          for (const [a, b] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) { for (let y = vy; y <= vy + 3; y++) push(lx + a, y, lz + b, B.MASONRY); push(lx + a, vy + 4, lz + b, M.light); push(lx + a, vy + 2, lz + b + (b > 0 ? 1 : -1), B.BANNER); }
        } else if (q === 'garden') { // a pond in a little park: water lilies of fern at the edge, a tree, a bench of fence
          for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) { const d = Math.hypot(a, b * 1.2); if (d <= 2.8) { push(lx + a, vy - 2, lz + b, B.SAND); push(lx + a, vy - 1, lz + b, B.WATER); } else { push(lx + a, vy - 1, lz + b, B.GRASS); if (d < 3.8 && hsh(lx + a, lz + b, 3) < 0.5) push(lx + a, vy, lz + b, hsh(lx + a, lz + b, 4) < 0.5 ? B.FLOWERS : B.FERN); } }
          for (let y = vy; y <= vy + 3; y++) push(lx - 4, y, lz - 4, B.LOG); for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (let y = 3; y <= 5; y++) if (Math.hypot(a, b, (y - 4) * 1.3) <= 2.4 && !(a === 0 && b === 0 && y === 3)) push(lx - 4 + a, vy + y, lz - 4 + b, B.LEAVES);
          push(lx + 4, vy, lz + 3, B.FENCE); push(lx + 4, vy, lz + 2, B.FENCE); push(lx + 3, vy, lz + 4, M.lamp || M.light);
        } else if (q === 'merchant') { // a covered market: posts, a striped awning roof, counters heaped with goods
          for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) push(lx + a, vy - 1, lz + b, B.PLANKS);
          for (const [a, b] of [[-3, -3], [3, -3], [-3, 3], [3, 3], [0, -3], [0, 3], [-3, 0], [3, 0]]) for (let y = vy; y <= vy + 2; y++) push(lx + a, y, lz + b, B.BEAM);
          for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) push(lx + a, vy + 3, lz + b, B.AWNING);
          for (const [a, b, id] of [[-2, -1, B.CHEST], [-2, 0, B.BERRY], [-2, 1, B.CHEST], [2, -1, B.PEBBLES], [2, 0, B.CHEST], [2, 1, B.BERRY], [0, -2, B.CHEST], [0, 2, B.CHEST]]) push(lx + a, vy, lz + b, id);
          push(lx, vy + 2, lz, M.lamp || M.light);
        } else { // a working yard: a forge fire, a cart, timber stacked along a fence
          for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) { push(lx + a, vy - 1, lz + b, B.GRAVEL); if (Math.max(Math.abs(a), Math.abs(b)) === 4 && !(Math.abs(a) <= 1 && b === 4 * cand.dirZ) && !(Math.abs(b) <= 1 && a === 4 * cand.dirX)) push(lx + a, vy, lz + b, B.FENCE); }
          push(lx, vy, lz, B.FIREPIT); push(lx - 1, vy - 1, lz, B.COBBLE); push(lx + 1, vy - 1, lz, B.COBBLE); push(lx + 2, vy, lz - 2, B.CART);
          for (let a = -3; a <= -1; a++) { push(lx + a, vy, lz - 3, B.LOG); push(lx + a, vy, lz - 2, B.LOG); if (a > -3) push(lx + a, vy + 1, lz - 3, B.LOG); }
          push(lx - 2, vy, lz + 3, B.CHEST); push(lx + 3, vy, lz + 3, B.PEBBLES); push(lx + 3, vy, lz, M.lamp || M.light);
        }
      }
      // clutter on the open ground, never on a street or a lot
      const lotAt = (x, z) => lots.some(l => Math.abs(l.x - x) <= 5 && Math.abs(l.z - z) <= 5);
      for (let dx = -R + 6; dx <= R - 6; dx++) for (let dz = -R + 6; dz <= R - 6; dz++) {
        if ((Math.abs(dx) <= 7 && Math.abs(dz) <= 7) || onStreet(dx, dz) || (castle && Math.abs(dx) <= 21 && dz <= -R + 32)) continue; const x = vx + dx, z = vz + dz; if (lotAt(x, z)) continue;
        let near = false; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (onStreet(dx + a, dz + b)) near = true; if (near) continue; // keep the street edge clear to walk
        const q = quarterOf(dx, dz), h = hsh(x, z, 9), k = hsh(x, z, 10);
        if (q === 'garden') { if (h < 0.16) push(x, vy, z, k < 0.55 ? B.FLOWERS : k < 0.8 ? B.FERN : B.BERRY); }
        else if (q === 'old') { if (h < 0.012) push(x, vy, z, M.lamp || M.light); }
        else if (q === 'merchant') { if (h < 0.03) push(x, vy, z, k < 0.6 ? B.CHEST : B.PEBBLES); }
        else if (h < 0.035) push(x, vy, z, k < 0.5 ? B.LOG : k < 0.8 ? B.PEBBLES : B.CART);
      }
    }
    // draw the buildings into the overlay by borrowing the house builder
    const sb = world.setBlock, gb = world.getBlock; world.setBlock = (x, y, z, id) => push(x, y, z, id); world.getBlock = () => B.AIR; DOORCOL = [];
    try {
      const build = (M.pod || M.hut) ? pod : house;
      const qs = (x, z) => { QSTYLE = quartered ? QUARTERS[quarterOf(x - vx, z - vz)].house : null; };
      for (const sh of shops) if (!sh.castle) { qs(sh.x, sh.z); build(sh.x, sh.z, vy + (sh.raised && rail ? 1 : 0), sh.dirX, sh.dirZ, sh.kind === 'elder' ? B.GOLD : (SHOP_BUILD[sh.kind] || {}).marker || B.LOG, FURNISH[sh.kind] || null); }
      const r = U.rng(U.combine(world.seed, U.strHash(v.id)));
      for (const l of lots) if (!l.used) { if (r() < 0.12) { for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (r() < 0.35 && M.bush) push(l.x + a, vy, l.z + b, M.bush); continue; } qs(l.x, l.z); build(l.x, l.z, vy, l.dirX, l.dirZ, null, null); l.home = true; }
    } finally { world.setBlock = sb; world.getBlock = gb; QSTYLE = null; ROOF_OVR = null; VST = null; }
    const L = { R, buckets, shops, homes: lots.filter(l => l.home), streets, plots, rail, marks, stalls, doors: DOORCOL || [] }; DOORCOL = null;
    towns.set(v.id, L); return L;
  }
  // ---- Atlantis in the world: drawn into each chunk as it is generated, the way a town is, so none of it goes into the save. The blocks only say
  // where you can walk and what stops you. None of them is drawn as a block: the mesher draws the whole city as smooth shapes from world.atlantis.
  // From the middle out: the falls coming down through the eye of the dome, the ring pool they fall into, the market ring, eight halls, the homes
  // and coral beds, and four gates in the foot of the dome where the sea stands like a wall ----
  const ATL_HALLS = [['armoury', 'The Tideforge'], ['trader', 'Pearl Exchange'], ['bakery', 'Kelp Kitchen'], ['juice', 'The Drowned Tavern'], ['voodoo', 'Tide Healer'], ['fusing', 'The Fusing Hall'], ['elder', 'The Speaker\'s Hall'], ['station', 'The Current']];
  // the city in rings. The falls and the ring pool; the eight halls of the market; a canal all the way round, fed by four rills that run out from the spires;
  // beyond the canal the four great houses (school, archive, hatchery, the tide tables) with a garden or a court between each pair; and round the edge, under the low of the glass, the homes
  const ATL_CIVIC = [['school', 'The Shell School'], ['archive', 'The Archive'], ['daycare', 'The Hatchery'], ['games', 'The Tide Tables']];
  const ATL_COURTS = ['kelp', 'statue', 'kelp', 'clock', 'park', 'park', 'park', 'park'];
  const ATL_POOL = 10.4, ATL_FALLS = 2.6, ATL_HALL_AT = 25, ATL_CANAL0 = 33, ATL_CANAL1 = 35.8, ATL_CIVIC_AT = 46, ATL_CIVIC_R = 7.5, ATL_COURT_AT = 43.5, ATL_HOME_AT = 51.5, ATL_HOME_R = 4.0, ATL_SPRING = 19.6, ATL_RILL_END = 29.6;
  const ATL_STALLS = ['stall_plums', 'stall_bait', 'stall_shells', 'stall_lamps', 'stall_rolls', 'stall_tonics', 'stall_nets', 'stall_curios'];
  function atlLayout() {
    const A = ATL; if (!A) return null; if (A._lay) return A._lay; const D = Math.PI / 180, at = (deg, r) => ({ a: deg * D, x: Math.round(Math.cos(deg * D) * r), z: Math.round(Math.sin(deg * D) * r) });
    const halls = ATL_HALLS.map((h, i) => Object.assign({ kind: h[0], name: h[1] }, at(22.5 + i * 45, ATL_HALL_AT)));
    const civic = ATL_CIVIC.map((c, i) => Object.assign({ kind: c[0], name: c[1], R: ATL_CIVIC_R }, at(45 + i * 90, ATL_CIVIC_AT))); // each at the end of a rill, a footbridge either side of where the rill runs into the canal
    const courts = ATL_COURTS.map((k, i) => Object.assign({ kind: k }, at(i < 4 ? 22.5 + i * 90 : 67.5 + (i - 4) * 90, ATL_COURT_AT)));
    const pods = []; for (let q = 0; q < 4; q++) for (const d of [9, 32, 58, 81]) pods.push(Object.assign({ R: ATL_HOME_R, i: pods.length }, at(q * 90 + d, ATL_HOME_AT)));
    const stalls = ATL_STALLS.map((k, i) => Object.assign({ kind: k, i }, at((i % 2 ? 56.25 : 33.75) + (i >> 1) * 90, 14.2))); // the market: two stalls in each quarter, clear of the avenues, the spires and the hall doors
    const trees = []; for (let i = 0; i < 4; i++) { const c = Math.cos(i * 90 * D), s = Math.sin(i * 90 * D); for (const r of [20.5, 30.6, 39.5, 43.75, 48, 53.5]) for (const sd of [-3.6, 3.6]) trees.push({ x: Math.round(c * r - s * sd), z: Math.round(s * r + c * sd), k: trees.length }); } // coral in pearl tubs down both sides of each avenue
    const boats = []; for (let q = 0; q < 4; q++) for (const d of [20, 70]) boats.push({ a: (q * 90 + d) * D, k: boats.length });
    const spires = []; for (let i = 0; i < 4; i++) spires.push(Object.assign({ h: 12 }, at(45 + i * 90, 15.5)));
    const rills = [0, 1, 2, 3].map(i => ({ a: (45 + i * 90) * D, c: Math.cos((45 + i * 90) * D), s: Math.sin((45 + i * 90) * D) }));
    const bridges = []; for (let i = 0; i < 4; i++) bridges.push({ a: i * 90 * D, w: 2.6, wide: true }); for (let i = 0; i < 4; i++) for (const o of [-6, 6]) bridges.push({ a: (45 + i * 90 + o) * D, w: 1.3 }); for (const b of bridges) { b.c = Math.cos(b.a); b.s = Math.sin(b.a); }
    const L = { halls, civic, courts, pods, spires, rills, bridges, stalls, trees, boats, gates: [[1, 0], [0, 1], [-1, 0], [0, -1]], pool: ATL_POOL, falls: ATL_FALLS, canal: [ATL_CANAL0, ATL_CANAL1], spring: ATL_SPRING, rillEnd: ATL_RILL_END };
    A._lay = L; Object.assign(world.atlantis, L); return L;
  }
  function stampAtl(chunk) {
    const A = ATL; if (!A) return; const ox = chunk.cx * CH, oz = chunk.cz * CH, RH = A.RH, RV = A.RV, vy = A.y;
    if (Math.abs(wd(ox + 8 - A.x)) > RH + 20 || Math.abs(wd(oz + 8 - A.z)) > RH + 20) return;
    const L = atlLayout(), bl = chunk.blocks;
    const inside = (dx, dy, dz) => (dx * dx + dz * dz) / (RH * RH) + (dy * dy) / (RV * RV) <= 1;
    for (let lx = 0; lx < CH; lx++) for (let lz = 0; lz < CH; lz++) {
      const dx = wd(ox + lx - A.x), dz = wd(oz + lz - A.z), r = Math.hypot(dx, dz), base = (lx * CH + lz) * WH;
      if (r > RH + 8.5) continue;
      let gate = null; for (const g of L.gates) { const along = dx * g[0] + dz * g[1], across = Math.abs(dx * g[1] - dz * g[0]); if (along > 0 && across <= 2.5) { gate = { along, across }; break; } }
      const pool = r <= ATL_POOL, falls = r <= ATL_FALLS;
      // water in the floor: the canal ring, two deep, crossed by slabs where the ways go over it; and the four rills, one deep, from the foot of each spire out to the canal
      const canal = r >= ATL_CANAL0 - 0.1 && r <= ATL_CANAL1 + 0.1, bridge = canal && L.bridges.some(b => dx * b.c + dz * b.s > 0 && Math.abs(dz * b.c - dx * b.s) <= (b.wide ? b.w : b.w + 0.71)); // a footbridge is drawn as one straight slab, so every square it lies on is solid
      // a rill is water only where a whole square of it lies inside the channel as it is drawn, so you never sink through floor you can see. u runs out along it, a is how far off its line
      let rill = false, spring = false; if (!canal && r > 16 && r < ATL_CANAL0) for (const q of L.rills) { const u = dx * q.c + dz * q.s, a = Math.abs(dz * q.c - dx * q.s); if (u <= 0 || a > 2.2) continue; if (Math.hypot(u - ATL_SPRING, a) <= 1.2) spring = true; else if (a <= 1.0 && u >= ATL_SPRING + 1.0 && u <= ATL_RILL_END - 0.71) rill = true; break; }
      const floorY = pool ? vy - 4 : canal ? vy - 3 : rill ? vy - 2 : vy - 1;
      if (r > RH + 2.2) { // outside the dome: only the way in to each gate is touched. Whatever seabed stands over it is taken away, so you can always swim down to the door
        if (gate) for (let y = vy; y <= SEA; y++) if (bl[base + y] !== B.WATER) bl[base + y] = B.WATER;
        continue; }
      for (let y = floorY - 1; y > 2; y--) { const b = bl[base + y]; if (y < floorY - 4 && b !== B.AIR && b !== B.WATER && isSolid(b) && !isTreeBlock(b)) break; bl[base + y] = B.STONE; } // a plinth under the floor, down to whatever ground there is
      bl[base + floorY] = B.ATLAN;
      if (r > RH + 0.5) { for (let y = vy; y <= SEA; y++) bl[base + y] = B.WATER; continue; } // a step of the floor runs on outside the glass, with open water over it, so the seabed never leans in against the dome
      if (pool) for (let y = vy - 3; y < vy; y++) bl[base + y] = B.WATER; // the ring pool: three deep, its top level with the floor
      if (canal) { bl[base + vy - 2] = B.WATER; bl[base + vy - 1] = bridge ? B.ATLAN : B.WATER; }
      if (rill) bl[base + vy - 1] = B.WATER;
      for (let y = vy; y <= SEA; y++) { const dy = y - vy; // air under the glass, the glass, the sea over it
        bl[base + y] = !inside(dx, dy, dz) ? B.WATER : (inside(dx + 1, dy, dz) && inside(dx - 1, dy, dz) && inside(dx, dy, dz + 1) && inside(dx, dy, dz - 1) && inside(dx, dy + 1, dz)) ? B.AIR : B.AGLASS; }
      if (falls) { for (let y = vy; y <= SEA; y++) bl[base + y] = B.WATER; continue; } // the falls: the sea comes down through the eye of the dome in one column, and you can swim down it
      if (gate && gate.across <= 1.5 && gate.along > RH - 3) for (let dy = 0; dy <= 3; dy++) if (bl[base + vy + dy] === B.AGLASS) bl[base + vy + dy] = B.AIR; // a gate: the glass is left out and the sea stands in the gap
      if (pool || canal || rill) continue;
      if (spring) { bl[base + vy] = B.ATLAN; continue; } // the basin the rill rises in
      for (const h of L.halls) { const hx = dx - h.x, hz = dz - h.z, hr = Math.hypot(hx, hz); if (hr > 5.45) continue;
        const dirX = -Math.cos(h.a), dirZ = -Math.sin(h.a), fwd = hx * dirX + hz * dirZ, side = Math.abs(hx * dirZ - hz * dirX); // toward the middle of the city is the front
        const door = fwd > 2 && side <= 1.55;
        if (hr > 4.3) { for (let dy = 0; dy <= 4; dy++) bl[base + vy + dy] = door && dy <= 3 ? B.AIR : B.ATLAN; }
        else if (hx === 0 && hz === 0) { bl[base + vy + 4] = B.ALIGHT; if (h.kind === 'fusing') bl[base + vy] = B.FUSION; }
        else if (h.kind !== 'fusing' && h.kind !== 'elder' && h.kind !== 'station' && fwd > 0.4 && fwd <= 1.5 && side <= 2.5) bl[base + vy] = B.ATLAN; // the counter
        bl[base + vy + 5] = B.ATLAN; }
      for (const h of L.civic) { const hx = dx - h.x, hz = dz - h.z, hr = Math.hypot(hx, hz); if (hr > h.R) continue; // the great houses: half as wide again as a hall, a storey higher
        const dirX = -Math.cos(h.a), dirZ = -Math.sin(h.a), fwd = hx * dirX + hz * dirZ, sd = hx * dirZ - hz * dirX, side = Math.abs(sd), door = fwd > 3 && side <= 1.55;
        if (hx === 0 && hz === 0) bl[base + vy + 5] = B.ALIGHT;
        if (hr > h.R - 1.15) { for (let dy = 0; dy <= 5; dy++) bl[base + vy + dy] = door && dy <= 3 ? B.AIR : B.ATLAN; }
        else if ((h.kind === 'games' && fwd > -2.6 && fwd <= -1.5 && side <= 3.2) || (h.kind === 'daycare' && fwd > -3.95 && fwd <= -2.85 && side <= 2.9)) bl[base + vy] = B.ATLAN; // the counter, at the back
        else if (h.kind === 'daycare' && hr <= 2.3) { bl[base + vy] = B.ATLAN; bl[base + vy + 1] = B.ATLAN; bl[base + vy + 2] = B.ATLAN; } // the tank
        else if (h.kind === 'archive' && hr <= 1.3) bl[base + vy] = B.ATLAN; // the map table
        else if (h.kind === 'archive' && hr > h.R - 2.2 && fwd < -3.6) { bl[base + vy] = B.ATLAN; bl[base + vy + 1] = B.ATLAN; } // the rack of rolls along the back wall
        else if (h.kind === 'school' && hr > h.R - 2.3 && sd > 0 && Math.abs(fwd) <= 2.6) { bl[base + vy] = B.BOOKS; bl[base + vy + 1] = B.BOOKS; } // the shelf of books, along the wall on your left as you come in
        else if (h.kind === 'archive' && ((Math.abs(hx) === 4 && hz === 0) || (hx === 0 && Math.abs(hz) === 4))) bl[base + vy] = B.ATLAN; // four plinths, a thing of the old city on each
        bl[base + vy + 6] = B.ATLAN; }
      for (const c of L.courts) { if (c.kind !== 'statue' && c.kind !== 'clock') continue; if (Math.hypot(dx - c.x, dz - c.z) <= 1.3) { bl[base + vy] = B.ATLAN; bl[base + vy + 1] = B.ATLAN; } } // what stands in the middle of a court stands on a block you cannot walk through
      for (const q of L.pods) { const hx = dx - q.x, hz = dz - q.z, hr = Math.hypot(hx, hz); if (hr > q.R + 0.1) continue; // a home: one round room, four high, big enough to live in
        const dirX = -Math.cos(q.a), dirZ = -Math.sin(q.a), fwd = hx * dirX + hz * dirZ, sd = hx * dirZ - hz * dirX, side = Math.abs(sd);
        if (hr > q.R - 0.95) { for (let dy = 0; dy <= 3; dy++) bl[base + vy + dy] = (fwd > 1 && side <= 1.05 && dy <= 2) ? B.AIR : B.ATLAN; }
        else if (hx === 0 && hz === 0) bl[base + vy + 3] = B.ALIGHT;
        else if (fwd >= -2.3 && fwd <= -1.2 && sd >= -0.2 && sd <= 1.9) bl[base + vy] = B.ATLAN; // the bed, along the back wall
        else if (Math.hypot(fwd - 0.7, sd + 1.5) < 0.71) bl[base + vy] = B.ATLAN; // the table
        if (bl[base + vy + 4] === B.AIR) bl[base + vy + 4] = B.ATLAN; }
      for (const t of L.stalls) if (dx === t.x && dz === t.z) bl[base + vy] = B.ATLAN; // the counter of a market stall
      for (const t of L.trees) if (dx === t.x && dz === t.z && bl[base + vy] === B.AIR) bl[base + vy] = B.ATLAN; // the tub a coral stands in
      for (const sp of L.spires) if (dx === sp.x && dz === sp.z) { for (let dy = 0; dy < sp.h; dy++) bl[base + vy + dy] = B.ATLAN; bl[base + vy + sp.h] = B.ALIGHT; }
      // coral beds out among the homes, and a pearl light in each: off the avenues, clear of every door
      if (r > 47.5 && r < 56.5 && !gate && bl[base + vy] === B.AIR && !L.pods.some(q => Math.hypot(dx - q.x, dz - q.z) < q.R + 2.2) && !L.trees.some(q => Math.abs(dx - q.x) < 2 && Math.abs(dz - q.z) < 2) && !L.civic.some(q => Math.hypot(dx - q.x, dz - q.z) < q.R + 2) && !L.courts.some(q => Math.hypot(dx - q.x, dz - q.z) < 8.5)) { const a = Math.atan2(dz, dx), bed = Math.sin(a * 16) > 0.2 && Math.abs(r - 53.6) < 1.9 + Math.sin(a * 40) * 0.7; const hq = U.hash3(ox + lx, 31, oz + lz, 0xA71);
        if (bed && hq < 0.5) bl[base + vy] = hq < 0.035 ? B.PEARLCORAL : [B.CORAL_R, B.CORAL_B, B.CORAL_Y][Math.floor(hq * 60) % 3]; }
    }
  }
  // called by the world as each chunk is generated: draw any town that touches it
  function overlay(chunk) {
    if (!world || !world.preset.villages) return;
    if (!PLAN && world.spawn && !planning && !trailBusy) { try { plan(); } catch (e) { console.warn('plan:', e.message); } }
    const key = U.mod(chunk.cx, NCH) + ',' + U.mod(chunk.cz, NCH);
    for (const v of townList()) {
      const R = v.R + 4; const ccx = Math.floor(U.mod(v.x, WORLD_W) / CH), ccz = Math.floor(U.mod(v.z, WORLD_W) / CH); const cr = Math.ceil(R / CH) + 1;
      const kx = U.mod(chunk.cx, NCH), kz = U.mod(chunk.cz, NCH); const ddx = Math.abs(U.mod(kx - ccx + NCH / 2, NCH) - NCH / 2), ddz = Math.abs(U.mod(kz - ccz + NCH / 2, NCH) - NCH / 2); if (ddx > cr || ddz > cr) continue;
      const ops = layout(v).buckets.get(key); if (!ops) continue;
      const bl = chunk.blocks; for (let i = 0; i < ops.length; i += 4) { const j = (ops[i] * CH + ops[i + 2]) * WH + ops[i + 1]; if (ops[i + 3] === -1) { if (isTreeBlock(bl[j])) bl[j] = B.AIR; } else bl[j] = ops[i + 3]; }
    }
    if (ATL) stampAtl(chunk);
    if (typeof Sky !== 'undefined') Sky.overlay(chunk);
    if (typeof Arena !== 'undefined') Arena.overlay(chunk);
    if (typeof Garrison !== 'undefined') Garrison.overlay(chunk);
    if (typeof Hub !== 'undefined') Hub.overlay(chunk);
  }
  function patchLoaded(v) {
    if (v.patched) return; v.patched = true; const L = layout(v);
    for (const c of world.chunks.values()) { const key = U.mod(c.cx, NCH) + ',' + U.mod(c.cz, NCH); const ops = L.buckets.get(key); if (!ops) continue; const bl = c.blocks; for (let i = 0; i < ops.length; i += 4) { const j = (ops[i] * CH + ops[i + 2]) * WH + ops[i + 1]; if (ops[i + 3] === -1) { if (isTreeBlock(bl[j])) bl[j] = B.AIR; } else bl[j] = ops[i + 3]; } world.reapplyEdits(c); }
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
    { give: { ember: 3 }, get: { snare: 2 }, shards: 20, line: 'Ember Ore for my stove, three lumps. I keep nets I never use.' },
    { give: { iron: 4 }, get: { snare2: 1 }, shards: 30, line: 'Four iron. I have a void net I am too old to throw.' },
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
        { give: { selenite: 3 }, get: { tonic_heal: 2 }, shards: 25, line: 'Selenite. Three crystals. My lamps have gone pale.' }, { give: { tycho: 2 }, get: { snare2: 1 }, shards: 35, line: 'Tycho ore, two lumps. I keep a net I cannot throw.' },
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
  const HERMIT_LORE = ['The orange-flecked stone is Ember Ore. A few blocks down, never deep.', 'Glowworms sit in the grass at night. Pinch one, add wood: torches.', 'Every tyrant keeps guards on the road. They come at you one by one; bring tonics.', 'Put a Kin in a village as a guard and it grows on the job.', 'There is a village under the sea. Swim down the shaft in its roof.', 'Sixteen Kin in a table. I saw it done once. The ground shook.', 'The Core is lava. The Lava Suit is five iron, three void, four ember.', 'Mountains freeze you without a cloak: fronds, snow, wood.', 'Stand behind a Kin that has not seen you and the net never misses.'];
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
    if (v.R) { st.R = v.R; patchLoaded(v); } else stampLand(v); stampWall(v, st); if (v.R) stampRail(v, st);
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
    if (world.preset.id !== 'earth') { const px = s.x - ux * 3 + (uz ? 2 : 0), pz = s.z - uz * 3 + (ux ? 2 : 0); const py = world.groundY(px, pz, gy + 6); for (let y = py + 1; y <= py + 3; y++) if (world.getBlock(px, y, pz) !== B.AIR) world.setBlock(px, y, pz, B.AIR); if (!isSolid(world.getBlock(px, py, pz))) world.setBlock(px, py, pz, B.STONE); world.setBlock(px, py + 1, pz, B.PORTAL); G.fisherSpot.portal = { x: px, y: py + 1, z: pz }; }
    clearFisherPortal();
    fisher = makeNpc(99, 'fisher', s.x + ux * 3, s.z + uz * 3, 'Old Brannock', null, gy + 1, 'shore');
    fisher.wander = false; fisher.yaw = Math.atan2(Math.cos(s.a), Math.sin(s.a));
  }

  // ---- stamps ----
  // what each style of village is built from: the ground it levels, the square, the posts and lamps, the houses
  const MATS = {
    land: { ground: B.GRASS, under: B.DIRT, plaza: B.COBBLE, plazaEdge: B.STONE, post: B.LOG, light: B.TORCH, lamp: B.LAMP, floor: B.PLANKS, wall: B.PLASTER, window: B.GLASS, roof: B.TILES, eave: B.PLANKS, counter: B.PLANKS, bush: B.BERRY,
      houses: [{ wall: B.PLASTER, base: B.MASONRY, beam: B.BEAM, roofs: [B.TILES, B.TILES, B.SLATE] }, { wall: B.PLASTER, base: B.BRICK, beam: B.BEAM, roofs: [B.TILES] }, { wall: B.BRICK, base: B.MASONRY, beam: null, roofs: [B.TILES, B.SLATE] }, { wall: B.PLASTER, base: B.BRICK, beam: B.BEAM, roofs: [B.TILES, B.THATCH] }, { wall: B.MASONRY, base: B.MASONRY, beam: null, roofs: [B.SLATE, B.TILES] }, { wall: B.PLANKS, base: B.MASONRY, beam: B.BEAM, roofs: [B.THATCH, B.TILES] }] },
    frontier: { ground: B.SAND, under: B.SAND, plaza: B.SAND, plazaEdge: B.PLANKS, post: B.LOG, light: B.TORCH, lamp: B.LAMP, floor: B.PLANKS, wall: B.PLANKS, window: B.GLASS, roof: B.THATCH, eave: B.LOG, counter: B.PLANKS, bush: B.CACTUS, boardwalk: true, saloon: true,
      houses: [{ wall: B.PLANKS, base: B.PLANKS, beam: B.LOG, roofs: [B.THATCH, B.THATCH, B.PLANKS] }] },
    alien: { ground: B.REGOLITH, under: B.DIRT, plaza: B.STARSALT, plazaEdge: B.BASALT, post: B.BASALT, light: B.MOONGLOW, floor: B.REGOLITH, wall: B.SELGLASS, window: B.SELGLASS, roof: B.SELGLASS, eave: B.SELGLASS, counter: B.BASALT, bush: null, pod: true },
    halo: { ground: B.DUNE, under: B.DIRT, plaza: B.SALTCRUST, plazaEdge: B.STONE, post: B.HALOWALL, light: B.RINGSHARD, floor: B.STONE, wall: B.HALOWALL, window: B.GLASS, roof: B.SALTROOF, eave: B.HALOWALL, counter: B.HALOWALL, bush: B.SULFUR, hut: true },
  };
  let MAT = MATS.land;
  // A city is four quarters, split by the two great streets through the square. Each has its own houses, its own ground and a landmark.
  let QSTYLE = null; let ROOF_OVR = null; let VST = null;
  // one builder's hand per place: every house in a village is timber-framed under the same two limewashes on the same footing; a town adds the odd house built in brick
  function villageStyle(vx, vz, town) { const k = U.hash3(vx, 40, vz, 0x60), k2 = U.hash3(vx, 41, vz, 0x61); const T = [B.HALFTIMBER, B.HALFTIMBER_W, B.HALFTIMBER_O]; const i = Math.floor(k * 3); const base = k2 < 0.6 ? B.MASONRY : B.BRICK; const roofs = [B.TILES, B.TILES, B.SLATE];
    return { main: { wall: T[i], base, beam: B.BEAM, roofs }, alt: { wall: T[(i + 1 + Math.floor(k2 * 2)) % 3], base, beam: B.BEAM, roofs }, other: { wall: B.BRICK, base: B.MASONRY, beam: null, roofs: [B.TILES] }, brick: town ? 0.88 : 1.01 }; }
  const QUARTERS = {
    old: { name: 'the Old Quarter', ground: B.MASONRY, house: { wall: B.MASONRY, base: B.MASONRY, beam: null, roofs: [B.SLATE] } },          // north-west: dressed stone under slate, paved
    garden: { name: 'the Garden Quarter', ground: B.GRASS, house: { wall: B.PLASTER, base: B.MASONRY, beam: B.BEAM, roofs: [B.THATCH] } },   // north-east: thatched cottages among flowers
    merchant: { name: "the Merchants' Quarter", ground: B.COBBLE, house: { wall: B.PLASTER, base: B.MASONRY, beam: B.BEAM, roofs: [B.TILES] } }, // south-west: half-timbered under red tile, cobbled
    craft: { name: 'the Craft Quarter', ground: B.GRAVEL, house: { wall: B.PLANKS, base: B.MASONRY, beam: B.LOG, roofs: [B.SLATE, B.PLANKS] } }, // south-east: board houses, yards and woodpiles
  };
  const quarterOf = (dx, dz) => dz < 0 ? (dx < 0 ? 'old' : 'garden') : (dx < 0 ? 'merchant' : 'craft');
  function stampLand(v) {
    const vx = v.x, vz = v.z, vy = v.y; MAT = MATS[v.style] || MATS.land; const M = MAT;
    const set = (x, y, z, id) => world.setBlock(x, y, z, id);
    for (let dx = -12; dx <= 12; dx++) for (let dz = -12; dz <= 12; dz++) {
      const x = vx + dx, z = vz + dz;
      const edge = Math.max(Math.abs(dx), Math.abs(dz)) > 10;
      for (let y = vy - 4; y <= vy + 10; y++) {
        const b = world.getBlock(x, y, z);
        if (y < vy - 1) { if (!isSolid(b) || isLeaf(b) || isTrunk(b)) set(x, y, z, M.under); }
        else if (y === vy - 1) { if (b !== M.ground && !edge) set(x, y, z, M.ground); else if (!isSolid(b) || isLeaf(b) || isTrunk(b)) set(x, y, z, M.ground); }
        else if (!edge || isLeaf(b) || isTrunk(b)) { if (b !== B.AIR) set(x, y, z, B.AIR); }
      }
    }
    for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) set(vx + dx, vy - 1, vz + dz, (Math.abs(dx) === 3 || Math.abs(dz) === 3) ? M.plazaEdge : M.plaza);
    set(vx, vy, vz, B.FUSION); if (M.houses && world.preset.id === 'earth') set(vx - 2, vy, vz + 3, B.SIGNPOST);
    if (M === MATS.alien || M === MATS.halo) { const L = M === MATS.alien ? B.GLOWLINE : B.BUNTING; for (let d = -3; d <= 3; d++) { set(vx + d, vy + 2, vz - 4, L); set(vx + d, vy + 2, vz + 4, L); set(vx - 4, vy + 2, vz + d, L); set(vx + 4, vy + 2, vz + d, L); } } // lamps strung round the square on the Moon, pennants on Halo
    const lamp = (x, z) => { if (M.lamp) set(x, vy, z, M.lamp); else { set(x, vy, z, M.post); set(x, vy + 1, z, M.light); } };
    for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) lamp(vx + dx, vz + dz);
    const build = (M.pod || M.hut) ? pod : house;
    ROOF_OVR = 'thatch'; VST = M === MATS.land ? villageStyle(vx, vz, false) : null;
    DOORCOL = [];
    build(vx - 9, vz - 9, vy, 1, 0, B.EMBER, furnishBakery);
    build(vx + 9, vz - 9, vy, -1, 0, B.BERRY, furnishJuice);
    build(vx - 9, vz + 9, vy, 1, 0, B.COPPER, furnishTrader);
    build(vx + 9, vz + 9, vy, -1, 0, B.CLOUD, furnishElder);
    build(vx, vz + 10, vy, 0, -1, B.VOID, furnishVoodoo);
    { const st0 = state(v.id); st0.doors = (st0.doors || []).concat(DOORCOL); DOORCOL = null; }
    ROOF_OVR = null; VST = null;
    if (M.saloon) { set(vx + 9 - 3, vy, vz - 9, B.DOOR); } // the saloon: swinging doors in the juice bar's doorway
    for (const [dx, dz] of [[-9, -5], [9, -5], [-9, 5], [9, 5], [0, 6]]) lamp(vx + dx, vz + dz);
    if (M.boardwalk) { // plank walks along the fronts of the houses and a hitching rail by the square
      for (let d = -12; d <= 12; d++) { for (const [x, z] of [[vx - 5, vz + d], [vx + 5, vz + d], [vx + d, vz - 5], [vx + d, vz + 5]]) if (Math.abs(d) > 3 && world.getBlock(x, vy, z) === B.AIR) set(x, vy - 1, z, B.PLANKS); }
      for (let d = -2; d <= 2; d++) { set(vx + d, vy, vz - 4, d % 2 ? B.LOG : B.AIR); }
    }
    if (world.preset.id !== 'earth') { set(vx + 5, vy, vz - 5, B.PORTAL); set(vx + 5, vy - 1, vz - 5, M.plazaEdge); }
    const r = U.rng(U.combine(world.seed, U.strHash(v.id)));
    if (M.bush) for (let i = 0; i < 14; i++) {
      const a = r() * Math.PI * 2, d = 9 + r() * 3; const x = Math.round(vx + Math.cos(a) * d), z = Math.round(vz + Math.sin(a) * d);
      if (world.getBlock(x, vy - 1, z) === M.ground && world.getBlock(x, vy, z) === B.AIR) set(x, vy, z, M.bush);
    }
  }
  // a town house, 7x7 and four walls high: a stone footing, plastered or planked walls with timber at the corners, a beam between the
  // floors and round the door, framed windows on both floors with flower boxes under the lower ones, a pitched roof with its ridge along
  // the door's axis and eaves all round, a gable at each end, a chimney on the back gable, a lamp hung from the ceiling, and the shop's
  // marker over the door (drawn as a hanging sign). Each house picks its own style and roof from the town's list, so a street is not a row of copies.
  let DOORCOL = null; /* where the front doors are, gathered as the houses go up */
  function house(hx, hz, vy, dirX, dirZ, marker, furnish) {
    const M = MAT; const set = (x, y, z, id) => world.setBlock(x, y, z, id);
    const styles = M.houses || [{ wall: M.wall, base: M.wall, beam: null, roofs: [M.roof] }];
    const h1 = U.hash3(hx, 11, hz, 0x4a), h2 = U.hash3(hx, 12, hz, 0x4b); const st = QSTYLE || (VST && M === MATS.land ? (h1 < 0.68 ? VST.main : h1 < VST.brick ? VST.alt : VST.other) : styles[Math.floor(h1 * styles.length)]); let roof = st.roofs[Math.floor(h2 * st.roofs.length)]; if (M === MATS.land && !QSTYLE) { if (ROOF_OVR === 'thatch') roof = B.THATCH; else if (ROOF_OVR === 'tiles' && roof === B.THATCH) roof = B.TILES; } // villages are thatched; towns and cities go under tile and slate
    const beam = st.beam; const alongX = dirX !== 0; const sgn = alongX ? dirX : dirZ; // the ridge runs along the door's axis; the door is at a = 3 * sgn
    const A = (dx, dz) => alongX ? dx : dz, Bc = (dx, dz) => alongX ? dz : dx;
    const WALL = beam && st.wall === B.PLASTER ? B.HALFTIMBER : st.wall; const framed = WALL === B.HALFTIMBER || WALL === B.HALFTIMBER_O || WALL === B.HALFTIMBER_W; // plaster between timbers is drawn as one timber-framed wall: posts, rails and braces across the limewash
    const WT = 3; // the top wall row
    const lvl = (b) => vy + WT + (4 - Math.abs(b)); // the roof block's height across the house: eaves at the wall top, the ridge four higher
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
      const x = hx + dx, z = hz + dz; const a = A(dx, dz), b = Bc(dx, dz); const inside = Math.abs(dx) <= 3 && Math.abs(dz) <= 3;
      for (let y = vy; y <= vy + 10; y++) if (world.getBlock(x, y, z) !== B.AIR) set(x, y, z, B.AIR);
      if (inside) {
        set(x, vy - 1, z, M.floor);
        const wall = Math.abs(dx) === 3 || Math.abs(dz) === 3, corner = Math.abs(dx) === 3 && Math.abs(dz) === 3;
        const lowWin = (Math.abs(dx) === 3 && Math.abs(dz) === 1) || (Math.abs(dz) === 3 && Math.abs(dx) === 1);
        const highWin = (Math.abs(dx) === 3 && Math.abs(dz) === 2) || (Math.abs(dz) === 3 && Math.abs(dx) === 2);
        const doorway = a === 3 * sgn && b === 0, doorPost = a === 3 * sgn && Math.abs(b) === 1;
        for (let y = vy; y <= vy + WT; y++) {
          let id = B.AIR;
          if (wall) {
            id = y === vy && !framed ? st.base : WALL; // a framed house is limewash to the ground: more of the wall shows under a deep thatch
            if (beam && (corner || y === vy + 2 || (doorPost && y <= vy + 1))) id = beam;
            if ((lowWin && y === vy + 1) || (highWin && y === vy + 3)) id = M.window;
            if (doorway) { id = y === vy + 2 ? (marker || beam || WALL) : y > vy + 2 ? WALL : B.AIR; if (y === vy && DOORCOL) DOORCOL.push([x, vy, z]); }
          }
          set(x, y, z, id);
        }
        if (Math.abs(dx) <= 2 && Math.abs(dz) <= 2) set(x, vy + WT + 1, z, M.floor); // the ceiling: the attic is its own dark space under the roof
        if (Math.abs(a) === 3 && Math.abs(b) <= 2) { // the gable: a triangle of wall under the roof, a beam along its foot and up its middle, a little window
          for (let y = vy + WT + 1; y < lvl(b); y++) set(x, y, z, beam && !framed && (y === vy + WT + 1 || b === 0) ? beam : (b === 0 && y === vy + WT + 3) ? M.window : WALL);
          if (a === -3 * sgn && b === -2) { const land = M === MATS.land; for (let y = vy + WT + 1; y <= vy + WT + 5; y++) set(x, y, z, land ? (st.wall === B.MASONRY ? B.MASONRY : st.wall === B.BRICK ? B.BRICK : B.PLASTER) : M === MATS.halo ? B.HALOWALL : B.MASONRY); if (land) set(x, vy + WT + 6, z, B.CHIMNEY); } // the chimney, up through the back gable: a brick stack, a cap, clay pots
        }
      }
      if (!(a === -3 * sgn && b === -2)) set(x, lvl(b), z, roof); // the roof: a wedge at every spot but the chimney's
    }
    // window boxes under the lower windows, outside the walls
    for (const [wa, wb] of [[1, 4], [-1, 4], [1, -4], [-1, -4], [4, 1], [4, -1], [-4, 1], [-4, -1]]) {
      const dx = alongX ? wa : wb, dz = alongX ? wb : wa; if (U.hash3(hx + dx, 13, hz + dz, 0x4c) < 0.4) continue;
      if (world.getBlock(hx + dx, vy + 1, hz + dz) === B.AIR) set(hx + dx, vy + 1, hz + dz, B.FLOWERBOX);
    }
    if (M.lamp) set(hx, vy + WT, hz, M.lamp); else set(hx, vy + 2, hz, M.light);
    if (furnish) furnish(hx, hz, dirX, dirZ, vy);
    // the front of the house is lived in: an awning over a shop's door, bunting under the eaves of some homes, and barrels, crates or potted plants by the wall
    if ((M.houses && world.preset.id === 'earth') || M === MATS.halo) { const halo = M === MATS.halo; const F = (b, y, id) => { const x = hx + (alongX ? 4 * sgn : b), z = hz + (alongX ? b : 4 * sgn); set(x, y, z, id); }; const hd = (n) => U.hash3(hx, 20 + n, hz, 0x4d);
      if (marker && furnish) { for (let b = -1; b <= 1; b++) F(b, vy + 2, B.AWNING); }
      else if (!halo && hd(5) < 0.4) { for (const b of [-1, 1]) { F(b, vy, B.FENCE); F(b, vy + 1, B.FENCE); F(b, vy + 2, roof); } F(0, vy + 3, roof); } // a little gabled porch over the door on two posts
      else if (halo && hd(5) < 0.5) { for (let b = -1; b <= 1; b++) F(b, vy + 2, B.AWNING); } // on Halo half the homes shade their door with cloth
      else if (hd(0) < 0.45) { for (let b = -2; b <= 2; b++) F(b, vy + 3, B.BUNTING); }
      for (const [b, n] of [[-2, 1], [2, 2], [-3, 3], [3, 4]]) { const k = hd(n); const lim = Math.abs(b) === 2 ? 0.7 : 0.35; if (k < lim) F(b, vy, (halo ? [B.BARREL, B.CRATE, B.CRATE, B.BARREL, B.BARREL, B.CRATE, B.BARREL] : [B.BARREL, B.CRATE, B.PLANTER, B.PLANTER, B.BARREL, B.CRATE, B.PLANTER])[Math.floor(k / lim * 7)]); }
    }
  }
  // an alien pod: a hemisphere of selenite glass on a regolith floor, a doorway cut in the rim, a moonglow keystone
  function pod(hx, hz, vy, dirX, dirZ, marker, furnish) {
    const M = MAT; const set = (x, y, z, id) => world.setBlock(x, y, z, id); const R = 3.6;
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
      set(hx + dx, vy - 1, hz + dz, Math.hypot(dx, dz) <= R ? M.floor : world.getBlock(hx + dx, vy - 1, hz + dz));
      for (let dy = 0; dy <= 4; dy++) {
        const d = Math.hypot(dx, dy + 0.5, dz); const y = vy + dy;
        if (d > R + 0.5) { if (world.getBlock(hx + dx, y, hz + dz) !== B.AIR) set(hx + dx, y, hz + dz, B.AIR); continue; }
        set(hx + dx, y, hz + dz, d >= R - 0.5 ? (dy === 0 && M === MATS.alien ? B.BASALT : M.wall) : B.AIR); // a Moon pod sits on a dark course of basalt
      }
    }
    set(hx, vy + 3, hz, M.light);
    if (M.hut) { set(hx, vy + 4, hz, B.IRONWALL); set(hx, vy + 5, hz, M.light); } /* a Halo hut: a scrap cap on the crown with the shard light on it; the renderer finds the hut by this and draws it whole */
    if (M === MATS.alien) { set(hx, vy + 4, hz, B.BASALT); set(hx, vy + 5, hz, B.MOONGLOW); const px = dirZ, pz = dirX; for (const sd of [-1, 1]) { set(hx + dirX * 4 + px * sd * 2, vy, hz + dirZ * 4 + pz * sd * 2, B.BASALT); set(hx + dirX * 4 + px * sd * 2, vy + 1, hz + dirZ * 4 + pz * sd * 2, B.MOONGLOW); } } // a bulb on the crown and one each side of the door
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
  const FURNISH = { bakery: furnishBakery, juice: furnishJuice, trader: furnishTrader, voodoo: furnishVoodoo, post: furnishPost, armoury: furnishTrader, armourer: furnishTrader, alchemist: furnishJuice, inn: furnishBakery, restaurant: furnishBakery, sanctuary: furnishVoodoo, stables: furnishJuice, aerie: furnishPost, station: furnishPost, games: furnishBakery, elder: furnishElder, tailor: furnishJuice, barber: furnishJuice, kinmarket: furnishBakery, kinshow: furnishElder, mirror: furnishPost, designer: furnishJuice, kinwear: furnishBakery, enchanter: furnishVoodoo, cartographer: furnishPost, daycare: furnishBakery };

  // ---- portals: every village has an arch; held villages' arches are dead, yours link up ----
  function portalBlock(v) { return v.type === 'land' ? { x: v.x + 5, y: v.y, z: v.z - 5 } : v.type === 'sea' ? { x: v.x - 3, y: v.y, z: v.z - 2 } : { x: v.x + 4, y: v.y, z: v.z - 4 }; }
  // an Earth town built before the trains may still have its old portal standing: take it down
  function clearPortal(v) { if (world.preset.id !== 'earth') return; for (let dx = -8; dx <= 8; dx++) for (let dz = -8; dz <= 8; dz++) for (let dy = -2; dy <= 3; dy++) if (world.getBlock(v.x + dx, v.y + dy, v.z + dz) === B.PORTAL) world.setBlock(v.x + dx, v.y + dy, v.z + dz, B.AIR); }
  function ensurePortal(v) { if (v.founded || v.R || world.preset.id === 'earth') { clearPortal(v); return; } const s = portalBlock(v); const x = s.x, z = s.z; if (world.getBlock(x, s.y, z) !== B.PORTAL) { world.setBlock(x, s.y, z, B.PORTAL); if (!isSolid(world.getBlock(x, s.y - 1, z))) world.setBlock(x, s.y - 1, z, B.STONE); for (let y = s.y + 1; y <= s.y + 2; y++) if (world.getBlock(x, y, z) !== B.AIR) world.setBlock(x, y, z, B.AIR); } }
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
    const wr = wallRadius(st); const out = []; const rl = v.R ? layout(v).rail : null;
    const railGate = (dx, dz) => { if (!rl) return false; return rl.ax ? (dx === rl.sgn * wr && Math.abs(v.z + dz - rl.line) <= 1) : (dz === rl.sgn * wr && Math.abs(v.x + dx - rl.line) <= 1); }; // the track goes out through its own opening
    // every opening is a proper gateway: a tall pier each side of it, the mark of its head at the middle, a light on the wall beyond each pier.
    // Where the railway leaves beside the road they share a pier, and where the two openings touch they are one wide gate
    const role = new Map();
    for (let s = 0; s < 4; s++) { const P = (a) => s === 0 ? [wr, a] : s === 1 ? [-wr, a] : s === 2 ? [a, wr] : [a, -wr], g = (a) => { const [dx, dz] = P(a); return Math.abs(a) < wr && (isGateCol(dx, dz, wr) || railGate(dx, dz)); };
      for (let a = -wr + 1; a < wr; a++) { if (!g(a) || g(a - 1)) continue; let b = a; while (g(b + 1)) b++;
        for (let q = a; q <= b; q++) role.set(P(q).join(), 'gate'); role.set(P(Math.floor((a + b) / 2)).join(), 'mark');
        for (const [q, r] of [[a - 1, 'post'], [b + 1, 'post'], [a - 2, 'light'], [b + 2, 'light']]) { if (Math.abs(q) > wr || g(q)) continue; const k = P(q).join(); if (r === 'post' || !role.has(k)) role.set(k, r); } } }
    for (let dx = -wr; dx <= wr; dx++) for (let dz = -wr; dz <= wr; dz++) if (Math.max(Math.abs(dx), Math.abs(dz)) === wr) { const r = role.get(dx + ',' + dz); out.push([v.x + dx, v.z + dz, r === 'gate' || r === 'mark', r]); }
    return out;
  }
  // the line beyond the wall: dead level at the station's height for a good way, as a railway is. Low ground gets an embankment, a
  // real drop gets a stone viaduct on piers (water too), a rise gets a cutting. It never steps up or down.
  function stampRail(v, st) {
    if (v.type !== 'land' || !v.R) return; const rl = layout(v).rail; if (!rl) return; const wr = wallRadius(st); st.railLevel = true;
    const base = rl.ax ? v.x : v.z, ty = v.y, set = (x, y, z, id) => world.setBlock(x, y, z, id);
    { const a0 = base + rl.sgn * wr, x0 = rl.ax ? a0 : rl.line, z0 = rl.ax ? rl.line : a0; set(x0, ty - 1, z0, B.GRAVEL); set(x0, ty, z0, B.RAIL); set(x0, ty + 1, z0, B.AIR); set(x0, ty + 2, z0, B.AIR); } /* the one block under the wall's own opening: it used to be left bare, a gap in the line right at the gate */
    for (let d = wr + 1; d <= wr + 8; d++) { // a short level run out of the station; from there the line lies on the land (see buildTrails)
      const a = base + rl.sgn * d; const col = (k) => rl.ax ? [a, rl.line + k] : [rl.line + k, a]; const [x, z] = col(0);
      for (let y = ty - 14; y <= ty + 14; y++) if (y !== ty && world.getBlock(x, y, z) === B.RAIL) set(x, y, z, B.AIR); // a line laid before this stepped with the land: lift it
      const gy = world.groundY(x, z, ty - 1), drop = (ty - 1) - (gy == null ? ty - 20 : gy); const pier = d % 5 === 0;
      for (const k of [-1, 0, 1]) { const [x2, z2] = col(k);
        for (let y = ty; y <= ty + 4; y++) { const bl = world.getBlock(x2, y, z2); if (bl !== B.AIR && !(k === 0 && y === ty)) set(x2, y, z2, B.AIR); } // a cutting through anything that stands in the way
        const g2 = world.groundY(x2, z2, ty - 1); const low = g2 == null ? ty - 20 : g2;
        if (drop <= 3) { for (let y = low + 1; y <= ty - 1 - (k ? 1 : 0); y++) set(x2, y, z2, B.GRAVEL); if (k === 0) set(x2, ty - 1, z2, B.GRAVEL); else if (low >= ty - 1 && isSolid(world.getBlock(x2, ty - 1, z2))) { /* level ground or a cutting floor: leave it */ } } // an embankment, its shoulders a step lower
        else { set(x2, ty - 1, z2, k ? B.MASONRY : B.GRAVEL); if (k) set(x2, ty - 2, z2, B.MASONRY); // a viaduct: a stone deck with a parapet course, piers down to the ground every fifth block, an arch sprung between them
          if (pier) for (let y = Math.max(low + 1, ty - 40); y <= ty - 2; y++) set(x2, y, z2, B.MASONRY); else if (d % 5 === 1 || d % 5 === 4) set(x2, ty - 3, z2, B.MASONRY); if (k === 0) set(x2, ty - 2, z2, B.MASONRY); }
      }
      set(x, ty, z, B.RAIL);
      for (const k of [-3, -2, -1, 0, 1, 2, 3]) { const [x2, z2] = col(k); const top = Math.abs(k) === 3 ? ty + 5 : ty + 18; for (let y = ty; y <= top; y++) { const bl = world.getBlock(x2, y, z2); if (isLeaf(bl) || isTrunk(bl)) set(x2, y, z2, B.AIR); } } // no tree stands in the line or hangs its crown over it: a trunk cut off at the rails used to leave its top in the air
    }
  }
  function stampWall(v, st) {
    if (v.type !== 'land' || v.founded) return;
    const vy = v.y, blk = wallSet(v)[st.wall || 0].block, wr = wallRadius(st); const M = MATS[v.style] || MATS.land;
    const set = (x, y, z, id) => world.setBlock(x, y, z, id);
    const masonry = !(blk === B.PALISADE || blk === B.LOG || blk === B.REGOLITH); // stone and metal walls stand three high with battlements; a palisade is two posts tall
    const H = masonry ? 3 : 2;
    for (const [x, z, gate, role] of ringCols(v, st)) {
      const gy = world.groundY(x, z, vy + 6);
      for (let y = Math.min(gy, vy) + 1; y <= vy + 7; y++) { const b = world.getBlock(x, y, z); if (b !== B.AIR && b !== B.WATER) set(x, y, z, B.AIR); }
      const dx = x - v.x, dz = z - v.z; const along = Math.abs(dx) === wr ? dz : dx; const corner = Math.abs(dx) === wr && Math.abs(dz) === wr;
      if (gate) { // the gateway: a floor under it, nothing in it for four blocks up (a train's chimney goes under), and the mark its head is drawn from
        if (!isSolid(world.getBlock(x, vy - 1, z))) set(x, vy - 1, z, M.floor);
        if (role === 'mark') set(x, vy + 4, z, B.GATE);
        continue;
      }
      const lightCol = role === 'light', pier = role === 'post';
      const base = Math.min(gy + 1, vy), top = pier ? vy + 4 : Math.max(vy + H - 1, gy + H);
      const post = !masonry && (lightCol || corner || pier); // in a palisade the piers of the gates, the corners and the posts that carry the lamps are single stout logs
      for (let y = base; y <= top; y++) set(x, y, z, post ? B.LOG : blk);
      if (masonry && !pier) { if (corner) { for (let y = top + 1; y <= top + 3; y++) set(x, y, z, blk); } else if (along % 2 === 0) set(x, top + 1, z, blk); } // battlements, and a taller pier at each corner
      if (lightCol) set(x, top + (masonry && along % 2 === 0 ? 2 : 1), z, M.light);
    }
    for (const [x, z] of st.holeCols) for (let y = vy; y <= vy + 4; y++) if (world.getBlock(x, y, z) !== B.AIR) set(x, y, z, B.AIR);
  }
  /* what a stone or metal wall wears over its blocks: a round turret under a pointed roof at each corner, a peaked cap on every merlon, a sloped foot
     along the outside. The blocks are all still there underneath; this is drawn over them, and redrawn when the wall is rebuilt or breached */
  function wallDress(v) { const st = state(v.id); if (v.type !== 'land' || v.founded || typeof Sky === 'undefined' || !Sky.kit) return null; const blk = wallSet(v)[st.wall || 0].block; if (blk === B.PALISADE || blk === B.LOG || blk === B.REGOLITH) return null;
    const wr = wallRadius(st), key = 'walldress4:' + v.style + ':' + v.id + ':' + blk + ':' + wr + ':' + (st.holeCols || []).length, now = performance.now(); if (v._wd && v._wd.key === key) return v._wd.mesh; if (v._wdTry && now - v._wdTry < 1000) return null; v._wdTry = now;
    const cols = ringCols(v, st), vy = v.y, found = []; for (const [x, z, gate, role] of cols) { if (gate) continue; let top = vy + 9; while (top > vy - 2 && world.getBlock(x, top, z) !== blk) top--; if (top <= vy - 2) continue; let base = top; while (world.getBlock(x, base - 1, z) === blk) base--; found.push([x - v.x, z - v.z, base - vy, top + 1 - vy, role, world.getBlock(x, top + 1, z) === B.AIR]); }
    if (found.length < cols.length * 0.5) return null; /* the land is not all loaded yet */
    const M = MATS[v.style] || MATS.land, c0 = BLOCKS[blk].side, col = [c0[0], c0[1], c0[2]], r0 = (BLOCKS[M.roof] || BLOCKS[B.SLATE]).top, rf = [r0[0], r0[1], r0[2]];
    if (v.style === 'halo') { /* Halo: the wall is a scrapyard stood on end. Plates of rust, steel and old paint welded over the stone, no two the same height, a rail through the middle, spikes along the top, a lookout on stilts under a rag roof at each corner, tusks on the gate posts */
      const mesh = R.entityMesh(key, (mb) => { const K = Sky.kit(mb), PAL = [[0.5, 0.26, 0.15], [0.62, 0.34, 0.16], [0.4, 0.41, 0.44], [0.33, 0.3, 0.3], [0.22, 0.5, 0.5], [0.8, 0.66, 0.26], [0.78, 0.74, 0.66], [0.44, 0.2, 0.14]], steel = [0.36, 0.37, 0.4], bone = [0.9, 0.86, 0.74], wood = [0.4, 0.28, 0.17], up = [0, 1, 0], U4 = [up, up, up, up];
        const plate = (cx, cz, nx, nz, y0, y1, sd) => { const h = (n) => U.hash3(cx * 7 + nx, n, cz * 7 + nz, sd), c = h(1) < 0.8 ? K.sh([PAL[0], PAL[1], PAL[2], PAL[3], PAL[7]][Math.floor(h(1) / 0.8 * 5)], 0.8 + 0.3 * h(2)) : K.sh(PAL[4 + Math.floor((h(1) - 0.8) / 0.2 * 3)], 0.7 + 0.15 * h(2)), tx = -nz * 0.56, tz = nx * 0.56, fx = cx + nx * 0.57, fz = cz + nz * 0.57, j0 = h(3) * 0.7, j1 = h(4) * 0.7, ln = (h(5) - 0.5) * 0.14, nn = [nx, 0, nz];
          K.q([[fx + tx, y0 - 0.25, fz + tz], [fx - tx, y0 - 0.25, fz - tz], [fx - tx + nx * ln, y1 + 0.1 + j0, fz - tz + nz * ln], [fx + tx + nx * ln, y1 + 0.1 + j1, fz + tz + nz * ln]], c, false, [nn, nn, nn, nn]);
          if (h(6) < 0.4) { const c2 = K.sh(PAL[Math.floor(h(7) * PAL.length)], 0.9), a = y0 + 0.4 + h(8) * (y1 - y0 - 1.2), w = 0.3 + h(9) * 0.2, o = (h(10) - 0.5) * 0.3, gx = cx + nx * 0.62, gz = cz + nz * 0.62, wx = -nz, wz = nx; K.q([[gx + wx * (o + w), a, gz + wz * (o + w)], [gx + wx * (o - w), a, gz + wz * (o - w)], [gx + wx * (o - w), a + 0.75, gz + wz * (o - w)], [gx + wx * (o + w), a + 0.8, gz + wz * (o + w)]], c2, false, [nn, nn, nn, nn]); } }; /* and a patch over a patch */
        for (const [dx, dz, y0, y1, role, open] of found) { const corner = Math.abs(dx) === wr && Math.abs(dz) === wr, nx = Math.abs(dx) === wr ? Math.sign(dx) : 0, nz = nx ? 0 : Math.sign(dz);
          if (corner) { for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) plate(dx, dz, a, b, y0, y1 - 0.4, 11);
            const py = y1 + 0.15; for (const [a, b] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) mb.box(dx + a * 1.15 - 0.09, y0 - 0.3, dz + b * 1.15 - 0.09, dx + a * 1.15 + 0.09, py + 2.5, dz + b * 1.15 + 0.09, wood); /* the stilts */
            mb.box(dx - 1.4, py, dz - 1.4, dx + 1.4, py + 0.16, dz + 1.4, wood); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (a === -Math.sign(dx) || b === -Math.sign(dz)) continue; const c = K.sh(PAL[(Math.abs(dx + a * 3 + dz + b) | 0) % PAL.length], 0.9), tx = -b * 1.3, tz = a * 1.3, fx = dx + a * 1.4, fz = dz + b * 1.4, nn = [a, 0, b]; K.q([[fx + tx, py + 0.1, fz + tz], [fx - tx, py + 0.1, fz - tz], [fx - tx, py + 0.95, fz - tz], [fx + tx, py + 1.1, fz + tz]], c, false, [nn, nn, nn, nn]); } /* a breastwork of plate on the two outward sides */
            K.hat(dx, dz, py + 2.4, 2.1, 1.1, [[0.7, 0.24, 0.18], [0.84, 0.6, 0.22], [0.2, 0.48, 0.5]][Math.abs(dx + dz * 2) % 3 | 0], 4); mb.box(dx - 0.04, py + 3.4, dz - 0.04, dx + 0.04, py + 5.1, dz + 0.04, steel); { const f = [0.12, 0.12, 0.14]; K.q([[dx, py + 5.05, dz], [dx, py + 4.3, dz], [dx + 1.2, py + 4.55, dz + 0.3], [dx + 1.2, py + 4.55, dz + 0.3]], f, false); K.q([[dx, py + 4.3, dz], [dx, py + 5.05, dz], [dx + 1.2, py + 4.55, dz + 0.3], [dx + 1.2, py + 4.55, dz + 0.3]], f, false); } continue; }
          plate(dx, dz, nx, nz, y0, y1, 12); plate(dx, dz, -nx, -nz, y0, y1, 13); const cc = K.sh(PAL[3], 0.8); K.q([[dx - 0.56, y1 + 0.03, dz - 0.56], [dx + 0.56, y1 + 0.03, dz - 0.56], [dx + 0.56, y1 + 0.03, dz + 0.56], [dx - 0.56, y1 + 0.03, dz + 0.56]], cc, false, U4);
          { const ry = y0 + 1.5, o = 0.64; mb.box(dx + nx * o - (nx ? 0.05 : 0.5), ry, dz + nz * o - (nz ? 0.05 : 0.5), dx + nx * o + (nx ? 0.05 : 0.5), ry + 0.14, dz + nz * o + (nz ? 0.05 : 0.5), steel); } /* the rail that ties it together */
          const hs = U.hash3(dx, 21, dz, 14); if (role === 'post') { for (const sd of [-1, 1]) { mb.push(); mb.translate(dx + nx * 0.5, y1 + 0.2, dz + nz * 0.5); mb.rotate(nx ? 0 : -0.5 * nz, 0, nx ? 0.5 * -nx : 0); K.drum(sd * 0.0, 0, 0, 1.7, 0.2, 0.02, bone, { N: 6, course: 9, flat: true }); mb.pop(); break; } }
          else if (open && hs < 0.4) K.drum(dx + (hs - 0.2) * 1.2 * (nx ? 0 : 1), dz + (hs - 0.2) * 1.2 * (nx ? 1 : 0), y1, y1 + 0.7 + hs, 0.08, 0.01, steel, { N: 5, course: 9, flat: true }); } });
      v._wd = { key, mesh }; return mesh; }
    const mesh = R.entityMesh(key, (mb) => { const K = Sky.kit(mb), dk = K.sh(col, 0.78), up = [0, 1, 0], U4 = [up, up, up, up];
      for (const [dx, dz, y0, y1, role, open] of found) { const corner = Math.abs(dx) === wr && Math.abs(dz) === wr, along = Math.abs(dx) === wr ? dz : dx;
        if (corner) { K.drum(dx, dz, y0 - 0.3, y0 + 1.1, 1.14, 0.95, dk, { N: 10, course: 0.7, seed: dx + dz * 3 }); K.drum(dx, dz, y0 + 1.1, y1 - 0.5, 0.95, 0.9, col, { N: 10, seed: dx * 3 + dz }); K.drum(dx, dz, y1 - 0.5, y1 - 0.1, 0.9, 1.16, dk, { N: 10, course: 0.5 }); K.cap(K.circ(dx, dz, 1.16, 10), y1 - 0.1, dk, true); K.drum(dx, dz, y1 - 0.1, y1 + 0.45, 1.16, 1.16, col, { N: 10, course: 0.6, skip: (i) => i % 2 === 1 }); K.drum(dx, dz, y1 - 0.1, y1 + 0.9, 0.8, 0.76, col, { N: 10, seed: 5 }); K.hat(dx, dz, y1 + 0.9, 1.25, 2.4, rf, 10); continue; }
        const nx = Math.abs(dx) === wr ? Math.sign(dx) : 0, nz = nx ? 0 : Math.sign(dz), tx = -nz * 0.5, tz = nx * 0.5, fx = dx + nx * 0.5, fz = dz + nz * 0.5, c = K.sh(dk, 0.9 + 0.2 * U.hash3(dx, 7, dz, 91)), l = Math.hypot(1.3, 0.34), nn = [nx * 1.3 / l, 0.34 / l, nz * 1.3 / l];
        K.q([[fx + tx + nx * 0.34, y0 - 0.2, fz + tz + nz * 0.34], [fx - tx + nx * 0.34, y0 - 0.2, fz - tz + nz * 0.34], [fx - tx, y0 + 1.1, fz - tz], [fx + tx, y0 + 1.1, fz + tz]], c, false, [nn, nn, nn, nn]); /* the sloped foot */
        if (open && role !== 'post' && along % 2 === 0) { const A = [dx, y1 + 0.42, dz], h = 0.56, C = [[dx - h, y1, dz - h], [dx + h, y1, dz - h], [dx + h, y1, dz + h], [dx - h, y1, dz + h]], cc = K.sh(col, 1.06); for (let i = 0; i < 4; i++) K.q([C[i], C[(i + 1) % 4], A, A], cc, false, U4); } } });
    v._wd = { key, mesh }; return mesh; }
  function clearWall(v, st) {
    const vy = v.y; const M = MATS[v.style] || MATS.land;
    for (const [x, z] of ringCols(v, st)) for (let y = vy - 1; y <= vy + 7; y++) { const b = world.getBlock(x, y, z); if (WALL_BLOCKS.has(b)) world.setBlock(x, y, z, y === vy - 1 ? M.ground : B.AIR); }
  }
  /* in a town or a city each of them holds his own thing, and it comes back the moment he is out: Keychain has the shop keys, Stonewall the gates and the station, Bigmouth has everyone shut indoors cooking for him */
  const PARTSAY = { Keychain: 'His keys went with him. The shops are open again.', Stonewall: 'The bars are off the gates and the station is clear.', Bigmouth: 'The kitchens are their own again. People are coming out of their houses.' };
  function partOf(st) { const out = st.gangOut || [], on = !st.freed && out.length > 0 && (st.gangNames || []).length > 1; return { on, shops: on && out.includes('Keychain'), gates: on && out.includes('Stonewall'), homes: on && out.includes('Bigmouth') }; }
  function applyPart(v, st) { const P = partOf(st); if (!P.on) return; let L = null; try { L = v.R ? layout(v) : null; } catch (e) { L = null; }
    for (const n of v.npcs) { if (n.role === 'voodoo' || n === v.elder || n.asleep) continue; const trade = n.role === 'keeper' || n.role === 'banker' || !!n.shop; n.hidden = trade ? !(n.shop === 'station' ? P.gates : P.shops) : !P.homes; }
    for (const [x, y, z] of doorsOf(v)) { const shop = !!(L && L.shops.some(sh => Math.abs(x - (sh.x + (sh.dirX || 0) * 3)) <= 1 && Math.abs(z - (sh.z + (sh.dirZ || 0) * 3)) <= 1)); if ((shop ? P.shops : P.homes) && world.getBlock(x, y, z) === B.DOOR) world.setBlock(x, y, z, B.AIR); }
    if (P.gates && !v.partGates) { v.partGates = true; setGates(v, st, false); if (G.meshPass) G.meshPass(99); } }
  /* a Moon pod or a Halo hut has an open doorway, not a door. They are found by the lamp on the crown, and while a tyrant holds the town the doorway is shut with a hatch: the dome is drawn closed */
  function podDoors(v) { if (v._pods) return v._pods; const out = []; if (world.preset.id === 'earth') return (v._pods = out); const M = MATS[v.style] || MATS.land, R = (v.R || 16) + 6, y0 = Math.round(v.y || 60); let seen = false;
    for (let x = Math.floor(v.x - R); x <= v.x + R; x++) for (let z = Math.floor(v.z - R); z <= v.z + R; z++) for (let y = y0; y <= y0 + 9; y++) { const b = world.getBlock(x, y, z); if (b !== B.BASALT && b !== B.IRONWALL) continue; if (world.getBlock(x, y + 1, z) !== M.light || world.getBlock(x, y - 1, z) !== M.light) continue; seen = true; const vy = y - 4;
      for (const [a, c] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const d0 = world.getBlock(x + a * 3, vy, z + c * 3); if ((d0 === B.AIR || d0 === B.DOOR || d0 === B.DOOR_OPEN) && world.getBlock(x + a * 4, vy, z + c * 4) === B.AIR) { out.push([x + a * 3, vy, z + c * 3], [x + a * 3, vy + 1, z + c * 3]); break; } } }
    if (seen) v._pods = out; return out; }
  function doorsOf(v) { const st = state(v.id); let out = st.doors || []; if (v.R) { try { out = out.concat(layout(v).doors || []); } catch (e) { /* no plan */ } } const pd = podDoors(v); if (pd.length) out = out.concat(pd); return out; }
  function setDoors(v, shut) { for (const [x, y, z] of doorsOf(v)) { const b = world.getBlock(x, y, z); if (shut ? b === B.AIR : (b === B.DOOR || b === B.DOOR_OPEN)) world.setBlock(x, y, z, shut ? B.DOOR : B.AIR); } v.doorsShut = shut; }
  function doorLocked(x, y, z) { const v = active; if (!v || state(v.id).freed || !v.doorsShut) return null; return doorsOf(v).some(d => d[0] === x && d[2] === z && Math.abs(d[1] - y) <= 1) ? (v.boss && v.boss.kin ? KIN.name(v.boss.kin) : 'the tyrant') : null; }
  function setGates(v, st, closed) {
    if (v.type !== 'land' || v.founded) return;
    const blk = wallSet(v)[st.wall || 0].block, vy = v.y;
    const rl = v.R ? layout(v).rail : null, onLine = (x, z) => !!rl && (rl.ax ? z === rl.line : x === rl.line) && ((rl.ax ? x - v.x : z - v.z) * rl.sgn > 0); /* the block of track in its own opening stays down when the gates open or shut: they used to wipe it, which left one sleeper missing at the wall */
    /* while a tyrant holds the place only one gate stands open, the one on the side you come from. The rest are barred, and so is every front door */
    const held = !st.freed && (world.preset.id === 'earth' || v.R) && !partOf(st).gates, wr = wallRadius(st), tg = v.starter && G.camp ? G.camp : world.spawn || { x: v.x, z: v.z + 1 }, tx = wd(tg.x - v.x), tz = wd(tg.z - v.z), side = Math.abs(tx) > Math.abs(tz) ? (tx > 0 ? 0 : 1) : (tz > 0 ? 2 : 3);
    const sideOf = (x, z) => { const dx = x - v.x, dz = z - v.z; return dx === wr ? 0 : dx === -wr ? 1 : dz === wr ? 2 : 3; };
    for (const [x, z, gate] of ringCols(v, st)) if (gate) { const shut = closed || (held && sideOf(x, z) !== side); for (let y = vy; y <= vy + 1; y++) world.setBlock(x, y, z, shut ? (y === vy && onLine(x, z) ? B.RAIL : blk) : (y === vy && onLine(x, z) ? B.RAIL : B.AIR)); }
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
        if (y < vy - 1) { if (!isSolid(b) || isLeaf(b) || isTrunk(b)) set(x, y, z, M.under); }
        else if (y === vy - 1) { if (b !== M.ground) set(x, y, z, M.ground); }
        else if (b !== B.AIR && b !== M.bush) set(x, y, z, B.AIR);
      }
    }
  }
  function slotDir(dx, dz) { return Math.abs(dx) >= Math.abs(dz) ? [-Math.sign(dx), 0] : [0, -Math.sign(dz)]; }
  function stampShop(v, slot, kind) {
    const [dx, dz] = SLOTS[slot]; const [dirX, dirZ] = slotDir(dx, dz); MAT = MATS[v.style] || MATS.land;
    ((MAT.pod || MAT.hut) ? pod : house)(v.x + dx, v.z + dz, v.y, dirX, dirZ, SHOP_BUILD[kind].marker, FURNISH[kind]);
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
    const piles = (px, pz, r) => { for (const [dx, dz] of [[-r, -r], [r, -r], [-r, r], [r, r], [0, -r], [0, r], [-r, 0], [r, 0]]) { const gy = world.groundY(px + dx, pz + dz, vy - 2); for (let y = gy + 1; y < vy - 1; y++) set(px + dx, y, pz + dz, B.LOG); } };
    const platform = (px, pz, r) => {
      for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
        set(px + dx, vy - 1, pz + dz, B.PLANKS);
        for (let y = vy; y <= vy + 8; y++) if (world.getBlock(px + dx, y, pz + dz) !== B.AIR) set(px + dx, y, pz + dz, B.AIR);
      }
      piles(px, pz, r);
    };
    const walkway = (ax, az, bx, bz) => { const n = Math.max(Math.abs(bx - ax), Math.abs(bz - az)); const ux = Math.sign(bx - ax), uz = Math.sign(bz - az); for (let i = 0; i <= n; i++) { const x = ax + ux * i, z = az + uz * i; set(x, vy - 1, z, B.PLANKS); for (let y = vy; y <= vy + 3; y++) if (world.getBlock(x, y, z) !== B.AIR) set(x, y, z, B.AIR); if (i % 3 === 1) { const gy = world.groundY(x, z, vy - 2); for (let y = gy + 1; y < vy - 1; y++) set(x, y, z, B.LOG); } if (i % 3 === 1 && i > 0 && i < n) { for (const s0 of [-1, 1]) { const rx = x + (uz ? s0 : 0), rz = z + (ux ? s0 : 0); set(rx, vy, rz, B.PALISADE); } } } }; // piles under it every third plank, a rail of posts along both sides
    // A reef village: round decks over the water, woven houses under swept sail roofs, root arches over the square, coral below.
    const clearAir = (x, z, top) => { for (let y = vy; y <= top; y++) if (world.getBlock(x, y, z) !== B.AIR) set(x, y, z, B.AIR); };
    const deck = (px, pz, r, cut) => { for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) { if (Math.abs(dx) + Math.abs(dz) > cut) { if (world.getBlock(px + dx, vy - 1, pz + dz) === B.PLANKS && !keepPlank(px + dx, pz + dz)) set(px + dx, vy - 1, pz + dz, B.AIR); continue; } set(px + dx, vy - 1, pz + dz, B.PLANKS); clearAir(px + dx, pz + dz, vy + 10); }
      for (const [dx, dz] of [[-r, 0], [r, 0], [0, -r], [0, r], [-(cut - r), -(cut - r)], [cut - r, -(cut - r)], [-(cut - r), cut - r], [cut - r, cut - r]]) { const gy = world.groundY(px + dx, pz + dz, vy - 2); for (let y = gy + 1; y < vy - 1; y++) set(px + dx, y, pz + dz, B.LOG); } };
    const keepPlank = (x, z) => (Math.abs(x - vx) <= 1 || Math.abs(z - vz) <= 1) || (x >= vx + 13 && Math.abs(z - vz) <= 4); // walkways and the jetty cross the cut corners
    // a sail roof: a dome of sail blocks whose peak sits off-centre (px, pz), swept up toward it; rr the reach, ht the rise
    const sailRoof = (cx, cz, rr, ht, px, pz, y0) => { px = Math.round(px); pz = Math.round(pz); // a tent of sail: square rings stepping in and up to a peak that may sit off-centre (px, pz)
      for (let dx = -rr; dx <= rr; dx++) for (let dz = -rr; dz <= rr; dz++) { const k = Math.max(Math.abs(dx), Math.abs(dz)); set(cx + px + dx, y0 + rr - k, cz + pz + dz, B.SAIL); }
      return y0 + rr; };
    const reef = (px, pz, r, n, seed) => { for (let i = 0; i < n; i++) { const a = U.hash3(seed, i, 7) * Math.PI * 2, d = 1 + U.hash3(seed, i, 11) * r; const x = Math.round(px + Math.cos(a) * d), z = Math.round(pz + Math.sin(a) * d); const gy = world.groundY(x, z, vy - 2); if (gy == null || gy >= vy - 2 || world.getBlock(x, gy + 1, z) !== B.WATER) continue; const k = U.hash3(seed, i, 13); set(x, gy + 1, z, k < 0.36 ? B.CORAL_R : k < 0.7 ? B.CORAL_B : B.CORAL_Y); } };
    deck(vx, vz, 5, 8);
    set(vx, vy, vz, B.FUSION); set(vx - 3, vy, vz - 2, B.PORTAL);
    for (const [dx, dz] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) set(vx + dx, vy, vz + dz, B.LAMP);
    for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) { const edge = (Math.abs(dx) === 5 || Math.abs(dz) === 5 || Math.abs(dx) + Math.abs(dz) === 8) && Math.abs(dx) + Math.abs(dz) <= 8; if (edge && Math.abs(dx) > 1 && Math.abs(dz) > 1 && !(Math.abs(dx) === 4 && Math.abs(dz) === 4) && !(Math.abs(dx) >= 4 && Math.abs(dz) >= 4)) set(vx + dx, vy, vz + dz, B.FENCE); } // a rail round the square, open toward the walkways and the corner decks
    set(vx - 2, vy, vz - 4, B.CHEST); set(vx + 3, vy, vz + 4, B.PEBBLES);
    const huts = [[-11, 0, 1, 0, B.EMBER, furnishBakery], [11, 0, -1, 0, B.BERRY, furnishJuice], [0, -11, 0, 1, B.COPPER, furnishTrader], [0, 11, 0, -1, B.VOID, furnishVoodoo]];
    for (const [hx, hz, dirX, dirZ, marker, furnish] of huts) {
      const cx = vx + hx, cz = vz + hz;
      for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) clearAir(cx + dx, cz + dz, vy + 11); // (an older gabled house may stand here)
      deck(cx, cz, 4, 6);
      // a woven house, eight-sided: woven walls with open window slots, posts by the door, a sail roof swept up and back to a curved spar
      for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
        const wall = Math.abs(dx) === 3 || Math.abs(dz) === 3, corner = Math.abs(dx) === 3 && Math.abs(dz) === 3;
        for (let y = vy; y <= vy + 2; y++) { let id = wall && !corner ? B.WEAVE : B.AIR; if (id === B.WEAVE && y === vy + 1 && ((Math.abs(dx) === 3 && Math.abs(dz) === 1) || (Math.abs(dz) === 3 && Math.abs(dx) === 1))) id = B.AIR; if (id === B.WEAVE && (Math.abs(dx) === 2 || Math.abs(dz) === 2) && (Math.abs(dx) === 3 || Math.abs(dz) === 3) && Math.abs(dx) + Math.abs(dz) === 5) id = B.BEAM; set(cx + dx, y, cz + dz, id); }
      }
      const top = sailRoof(cx, cz, 5, 4, -dirX, -dirZ, vy + 3);
      const px = cx - dirX, pz = cz - dirZ; set(px, top + 1, pz, B.BEAM); set(px - dirX, top + 2, pz - dirZ, B.BEAM); set(px - dirX * 2, top + 2, pz - dirZ * 2, B.BEAM); // the spar, curving back off the peak
      set(cx + dirX * 3, vy, cz + dirZ * 3, B.AIR); set(cx + dirX * 3, vy + 1, cz + dirZ * 3, B.AIR); set(cx + dirX * 3, vy + 2, cz + dirZ * 3, marker);
      set(cx, vy + 2, cz, B.LAMP);
      furnish(cx, cz, dirX, dirZ, vy);
      walkway(vx - dirX * 5, vz - dirZ * 5, cx + dirX * 4, cz + dirZ * 4);
      reef(cx, cz, 6, 9, v.x * 31 + v.z + hx * 7 + hz);
    }
    // corner decks between the houses, each under its own little sail: nets and pots to the north, a place to sit to the south
    for (const [sx, sz, a, b] of [[-1, -1, B.CHEST, B.PEBBLES], [1, 1, B.FLOWERBOX, B.CHEST], [-1, 1, B.PEBBLES, B.FLOWERBOX]]) {
      const cx = vx + sx * 8, cz = vz + sz * 8; deck(cx, cz, 2, 3);
      for (const [dx, dz] of [[5, 5], [5, 6], [6, 5]]) { set(vx + sx * dx, vy - 1, vz + sz * dz, B.PLANKS); clearAir(vx + sx * dx, vz + sz * dz, vy + 4); }
      for (const [dx, dz] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) if (!(dx === -sx * 2 || dz === -sz * 2)) { set(cx + dx, vy, cz + dz, B.BEAM); set(cx + dx, vy + 1, cz + dz, B.BEAM); set(cx + dx, vy + 2, cz + dz, B.BEAM); }
      set(cx - sx * 2, vy + 2, cz, B.BEAM); set(cx, vy + 2, cz - sz * 2, B.BEAM);
      sailRoof(cx, cz, 3, 2, 0, 0, vy + 3); set(cx + sx, vy, cz + sz, a); set(cx + sx, vy, cz - sz, b);
      reef(cx, cz, 5, 6, v.x * 17 + v.z + sx * 3 + sz);
    }
    reef(vx, vz, 9, 14, v.x + v.z * 13);
    // a jetty running on east past the juice bar, with a lamp at its end
    for (let i = 0; i <= 7; i++) { const x = vx + 15 + i; for (const w of [-1, 0, 1]) { set(x, vy - 1, vz + w, B.PLANKS); for (let y = vy; y <= vy + 3; y++) if (world.getBlock(x, y, vz + w) !== B.AIR) set(x, y, vz + w, B.AIR); } if (i % 3 === 1) for (const w of [-1, 1]) { const gy = world.groundY(x, vz + w, vy - 2); for (let y = gy + 1; y < vy - 1; y++) set(x, y, vz + w, B.LOG); set(x, vy, vz + w, B.PALISADE); } }
    set(vx + 22, vy, vz, B.LAMP);
    // the ferry landing: a stage off the north side of the jetty, posts at its corners, a lamp; the ferry ties up beyond it
    for (let x = vx + 15; x <= vx + 20; x++) for (let z = vz - 4; z <= vz - 2; z++) { set(x, vy - 1, z, B.PLANKS); for (let y = vy; y <= vy + 3; y++) if (world.getBlock(x, y, z) !== B.AIR) set(x, y, z, B.AIR); }
    for (const [x, z] of [[vx + 15, vz - 4], [vx + 20, vz - 4]]) { const gy = world.groundY(x, z, vy - 2); for (let y = gy + 1; y < vy - 1; y++) set(x, y, z, B.LOG); set(x, vy, z, B.FENCE || B.PALISADE); }
    set(vx + 15, vy + 1, vz - 4, B.LAMP);
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
        if (b === B.AIR || isLeaf(b) || isTrunk(b)) world.setBlock(vx + dx, y, vz + dz, B.SELGLASS);
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
    if (v.atlantis) { if (!st.stamped || !st.freed) { st.stamped = true; st.freed = true; if (st.freedDay == null) st.freedDay = G.dayCount || 0; remember(v, st); } return; } /* Atlantis is part of the world, like a town, and nobody has ever held it but its own people */
    if (st.stamped && v.type === 'sea' && !st.reef1) { st.reef1 = true; world.ensureAround(Math.floor(v.x / CH), Math.floor(v.z / CH), 2, 999); stampSea(v); remember(v, st); return; } /* villages stamped before the reef look get it once */
    if (st.stamped) return;
    world.ensureAround(Math.floor(v.x / CH), Math.floor(v.z / CH), 2, 999);
    if (v.type === 'land' && v.R) { st.R = v.R; patchLoaded(v); stampWall(v, st); stampRoad(v, st); stampRail(v, st); st.stamped = true; remember(v, st); return; }
    if (v.type === 'land' && (v.size === 'town' || v.size === 'city') && !st.grown) { // a town, or a city: the outer ring built up from the start, with its own shops
      st.grown = true; st.expanded = true; if (v.size === 'city') st.wall = Math.max(st.wall || 0, 1);
      const kinds = v.size === 'city' ? ['armoury', 'armourer', 'alchemist', 'inn', 'post', 'house', 'house', 'house', 'house', 'house', 'house', 'house'] : ['armoury', 'inn', 'alchemist', 'house', 'house', 'house'];
      st.shops = st.shops || []; kinds.forEach((k, i) => { if (k !== 'house') st.shops.push({ slot: i, kind: k }); });
      st.homes = kinds.map((k, i) => k === 'house' ? i : -1).filter(i => i >= 0);
    }
    if (v.type === 'land') { stampLand(v); if (st.expanded) { stampExpansion(v); MAT = MATS[v.style] || MATS.land; for (const sh of (st.shops || [])) stampShop(v, sh.slot, sh.kind); for (const i of (st.homes || [])) { const [dx, dz] = SLOTS[i]; const [dirX, dirZ] = slotDir(dx, dz); ((MAT.pod || MAT.hut) ? pod : house)(v.x + dx, v.z + dz, v.y, dirX, dirZ, B.LOG, null); } } stampWall(v, st); stampRoad(v, st); if (st.dome) stampDome(v, st); } else if (v.type === 'sea') { stampSea(v); stampPier(v); st.reef1 = true; } else if (v.style === 'atlantis') stampAtlantis(v); else stampDeep(v);
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
      const e = Wild.makeEntity(sp, Math.max(2, bossLevelFor(v) - 2 + i), c.x + 0.5, y, c.z + 0.5, { elite: true, wear: { item: 'bound' }, senseR: 5.2 + 0.4 * i, aquatic, patrol: { ax: c.x + 0.5 - px * 2.5, az: c.z + 0.5 - pz * 2.5, bx: c.x + 0.5 + px * 2.5, bz: c.z + 0.5 + pz * 2.5, period: 6 + i, phase: 0 } });
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
    if (st.freed || nd > 60 || v.starter) { v.siege = null; return; } // Keychain waits in the square: the first fight is yours to pick
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
  const SKIN_STYLE = { alien: ['#39ff14', '#ff2bd6', '#00f5ff', '#ffe600', '#b026ff', '#00ffb3'], halo: ['#c9955a', '#a8723f', '#e0b47a', '#8a5a30'], atlantis: ['#6fd0c8', '#4aa8b8', '#8fe0d0', '#3f8fa0'], sea: ['#58c2b4', '#3fa3a6', '#7ad4c2', '#4d9cbd', '#66b6d4', '#8fdcc8'], frontier: SKIN }; // sea: the reef folk, the colours of shallow water
  const CLOTH_STYLE = { alien: ['#101828', '#1a1030', '#0a2030', '#201028'], halo: ['#e8d8b0', '#d8c090', '#c0a070', '#f0e0c0', '#b89060'], atlantis: ['#2a5a7a', '#1f4a6a', '#3a7a8a', '#204060'], sea: ['#d9c08a', '#e8dcc0', '#c96a4a', '#e0a04a', '#b8935a', '#d87a5a'], frontier: ['#7a4a2a', '#4a3a2a', '#8a6a3a', '#5a4a4a', '#9a3a2a', '#3a4a6a'] };
  function villagerSpecies(i, role, vid, style) {
    const r = U.rng(U.combine(0x4242, i, U.strHash(vid || 'start')));
    const skins = SKIN_STYLE[style] || SKIN, cloths = CLOTH_STYLE[style] || CLOTH;
    const skin = r.pick(skins), cloth = r.pick(cloths);
    const plain = style && style !== 'frontier' && style !== 'land' && style !== 'sea';
    const body = plain ? cloth : role === 'banker' ? '#22202a' : role === 'elder' ? '#b9a070' : role === 'voodoo' ? '#2c3e50' : role === 'fisher' ? '#5b7f95' : role === 'traveller' ? '#6b5a3e' : role === 'hermit' ? '#7a6f5a' : cloth;
    const accent = style === 'alien' ? r.pick(skins) : role === 'elder' ? '#c9a64a' : cloth;
    const build = role === 'banker' ? 'stout' : role === 'elder' || role === 'voodoo' || role === 'hermit' ? 'man' : r.pick(['man', 'woman', 'stout', 'woman', 'slim', 'man']), hairVar = build === 'woman' ? r.pick([3, 3, 2]) : r.pick([0, 1, 2, 0]), hairCol = style === 'alien' ? null : role === 'elder' ? '#d8d8dc' : r.pick(['#3a2a1a', '#1a1410', '#6a4a22', '#b8862e', '#8a3a1a', '#d8c070', '#4a4a52', '#2a1a2a']); /* each villager: a build, a head of hair and its colour, all from the same roll every time */
    return { build, hairVar, hair: hairCol || undefined, shape: 'human', feat: { crest: false, ears: false, horns: false, spikes: false, tail: false, wings: false, bigEyes: style === 'alien' }, colors: { body, belly: skin, accent, dark: style === 'alien' ? '#05050f' : style === 'atlantis' ? '#1a3a4a' : '#3a2a20', eye: style === 'alien' ? '#ffffff' : '#222222' }, size: role === 'elder' ? 1.15 : role === 'voodoo' ? 1.1 : 1, gen: 0, names: ['villager'], neon: style === 'alien' };
  }
  /* Mr Crowe: holds the notes on half the town and pays, promptly, for small errands. One a morning, so he is pocket money and not a mine */
  const ERRANDS = [{ item: 'wood', n: 8, pay: 10, say: 'logs' }, { item: 'berry', n: 6, pay: 10, say: 'berries' }, { item: 'planks', n: 6, pay: 12, say: 'planks' }, { item: 'glass', n: 2, pay: 14, say: 'panes of glass' }, { item: 'bread', n: 2, pay: 9, say: 'loaves' }, { item: 'wheat', n: 6, pay: 11, say: 'handfuls of wheat' }, { item: 'corn', n: 4, pay: 11, say: 'cobs of maize' }, { item: 'sunseed', n: 6, pay: 10, say: 'handfuls of sunflower seed' }];
  const ERR_W = { moon: [{ item: 'selenite', n: 4, pay: 40, say: 'pieces of selenite' }, { item: 'starsalt', n: 4, pay: 36, say: 'crusts of starsalt' }, { item: 'stardust', n: 4, pay: 60, say: 'measures of Stardust' }, { item: 'tycho', n: 3, pay: 44, say: 'lumps of Tycho ore' }], halo: [{ item: 'amber', n: 4, pay: 50, say: 'pieces of amber' }, { item: 'sulfur', n: 6, pay: 44, say: 'crusts of sulfur' }, { item: 'stormcell', n: 2, pay: 90, say: 'Storm Cells' }, { item: 'iron', n: 4, pay: 48, say: 'bars of iron' }] };
  function bankerTalk(n) { const st = (G.stats.crowe = G.stats.crowe || { met: 0, i: 0, next: 0 }), now = Date.now(), wid = world.preset.id, off = wid !== 'earth', iw = (st.iw = st.iw || {}), list = off ? ERR_W[wid] || ERRANDS : ERRANDS, idx = off ? (iw[wid] || 0) : st.i, e = list[idx % list.length], say = (lines, done) => { G.talkNpc = n; Dialogue.show('Mr Crowe', lines, done); };
    if (!off && typeof Fields !== 'undefined' && Fields.wanted()) return say(['I hear things. I heard about a cart. I do not do business with people who are being talked about. Settle it.']);
    if (!off && st.met && st.i >= 1 && !G.player.has('bandana') && !st.maskShown) { st.maskShown = 1; return say(['You deliver. So I will mention a thing that is not on any shelf.', 'A bandit\'s mask. Came off a man who no longer needs it. Anyone in one of those is a bandit as far as a town is concerned, and whatever he does, the bandits answer for it. Thirty shards, and I never had it.'], () => UI.openPanel('shop', { title: 'Under the counter', keeper: 'Mr Crowe', greet: 'I never had it. You never bought it.', stock: [{ item: 'bandana', price: 30, n: 1 }] })); }
    if (!off && !st.met) { st.met = 1; return say(['Crowe. Pennington Crowe. I hold the notes on half this town and I mean to hold the rest.', 'I pay for errands. Fair coin, promptly, and no questions about where a thing came from.', `This morning I want ${e.n} ${e.say}. Bring them and there are ${e.pay} shards in it for you.`]); }
    if (off && !(st.metW = st.metW || {})[wid]) { st.metW[wid] = 1; st.met = 1; return say(wid === 'moon' ? ['You. Do not stand there with your mouth open, you will let the air out.', 'Crowe. Yes, the same one. Where there is a note to be held there is a Crowe to hold it, and nobody up here had so much as heard of interest until I arrived.', 'The hat stays on. I had the suit cut round it.', `Business. I want ${e.n} ${e.say}. ${e.pay} shards. Things cost more up here and so do you.`] : ['Ah. My best courier. I wondered how long the dust would keep you.', 'They trade in scrap and teeth down here. Teeth. I have opened a ledger anyway, and I already hold the notes on two rigs and a well.', 'The goggles are a concession. The hat is not negotiable.', `Business. I want ${e.n} ${e.say}. ${e.pay} shards, and I will not ask whose mast they came off.`]); }
    if (now < st.next) return say(off ? ['Nothing more today. A Crowe pays once a morning on any world you care to name.'] : ['Nothing more today. I do not pay twice for the same morning.', 'Come back when the sun has been round.']);
    if (G.player.count(e.item) >= e.n) return say([`${e.n} ${e.say}. Counted, and correct. I do like a person who delivers.`], () => { G.player.take(e.item, e.n); G.shards += e.pay; if (off) iw[wid] = idx + 1; else st.i++; st.next = Date.now() + 8 * 60000; UI.sfx('gift'); UI.toast(`Mr Crowe paid you ${e.pay} shards.`, 'good'); });
    say([`${e.n} ${e.say}. That is what I want, and ${e.pay} shards is what it is worth to me.`, 'You have not got them. Off you go.']); }
  let holdArm = null;
  function makeNpc(i, role, x, z, name, shop, y, vid, style, kid) {
    style = style || (vid === 'shore' ? 'land' : (world.preset.people || 'land'));
    const sp = villagerSpecies(i, role, vid, style);
    const child = role === 'villager' && (kid === true || (kid !== false && U.strHash((vid || 's') + ':' + i + ':kid') % 4 === 0)); if (child) { sp.build = 'slim'; sp.hairVar = U.strHash((vid || 's') + ':' + i) % 3; } /* one villager in four is a child */
    const m = KIN.model(sp, 2);
    if (style === 'alien') KIN.decorate(m, 'alien'); else if (style === 'halo') KIN.decorate(m, 'veil'); else if (style === 'atlantis') KIN.decorate(m, 'merfolk'); else if (style === 'sea') KIN.decorate(m, 'reef'); else if (style === 'frontier' && role !== 'hermit' && role !== 'traveller') KIN.decorate(m, 'hat');
    if ((role === 'elder' && (style === 'land' || !style)) || role === 'voodoo' || role === 'fisher' || role === 'traveller' || role === 'hermit') KIN.decorate(m, role);
    if (role === 'elder' && style === 'frontier') KIN.decorate(m, 'star');
    { /* everyday dress, the same on the same person every time */ const hh = U.strHash((vid || 's') + ':' + i + ':garb'), tint = CLOTH[(hh >> 3) % CLOTH.length];
      if (role === 'banker') { KIN.decorate(m, 'banker'); if (world.preset.id !== 'earth' && KIN.tyrSuit) KIN.tyrSuit(m, world.preset.id === 'moon' ? 'moon' : 'halo'); } /* the same man on every world: the hat and the tails, with the Moon's breather rig or Halo's goggles over the top */
      else if ((style === 'land') && (role === 'villager' || role === 'keeper') && !child) KIN.decorate(m, role === 'keeper' ? (hh % 2 ? 'garb1' : 'garb4') : sp.build === 'woman' ? ['garb5', 'garb1', 'garb3', 'garb0'][hh % 4] : ['garb0', 'garb2', 'garb3', 'garb4', 'garb2', 'garb0'][hh % 6], tint);
      else if (style === 'land' && child && hh % 2) KIN.decorate(m, 'garb0', tint);
      else if (style === 'frontier' && (role === 'villager' || role === 'keeper')) KIN.decorate(m, 'west' + (hh % 3), CLOTH_STYLE.frontier[(hh >> 3) % 6]);
      else if (style === 'atlantis' && (role === 'villager' || role === 'keeper' || role === 'elder')) KIN.decorate(m, 'atl' + (role === 'elder' ? 0 : hh % 3));
      else if (style === 'alien' && (role === 'villager' || role === 'keeper' || role === 'elder') && !child) KIN.decorate(m, 'moon' + (role === 'elder' ? 1 : role === 'keeper' ? (hh % 2 ? 0 : 2) : hh % 3));
      else if (style === 'halo' && (role === 'villager' || role === 'keeper' || role === 'elder') && !child) KIN.decorate(m, 'halo' + (role === 'elder' ? 0 : hh % 3));
      else if (role === 'explorer' || (role === 'traveller' && style === 'land' && hh % 2)) KIN.decorate(m, 'explorer'); }
    if (child) KIN.childify(m, 1.32);
    const v = vid ? villages.get(vid) : null;
    return { id: i, role, name, shop, shopTitle: shop ? shopDef(shop, v).title : null, x: x + 0.5, y, z: z + 0.5, yaw: Math.random() * 6.28, tx: x + 0.5, tz: z + 0.5, wait: 2 + Math.random() * 4, model: m, child, scale: child ? 0.64 : role === 'elder' ? 1 : 0.93 + (U.strHash((vid || 's') + ':' + i) % 100) / 100 * 0.14, hover: 0, mesh: R.entityMesh('npc3:' + (vid || '') + ':' + i + ':' + role + ':' + style + (child ? ':k' : '') + (role === 'banker' ? ':' + world.preset.id : ''), (mb) => KIN.buildMesh(mb, m)), skyMul: 1, hidden: false, home: { x: x + 0.5, z: z + 0.5 } };
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
    station: { need: { iron: 16, planks: 24 }, get say() { const r = RIDE(); return r === 'Glide' ? ['The Glide has not run since the three came up from Earth. The beam here is dark.', 'Sixteen iron and twenty-four planks to relight our stretch. Then this place joins the line, and the Glide runs between every dock that is open.'] : r === 'Rig' ? ['The Rig has not hauled since the three came with their keys. The sand has the rails.', 'Sixteen iron and twenty-four planks to dig out our stretch. Then this place joins the line, and the Rig runs between every yard that is open.'] : ['The line has not run since the tyrant came. The rails here are rusted through.', 'Sixteen iron and twenty-four planks to relay our stretch of track. Then this town joins the line, and the train runs between every station that is open.']; } },
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
    const r = U.rng(U.strHash(v.id) ^ 0x99); const people = peopleOf(v); const sty = styleOf(v) || (v.type === 'sea' ? 'sea' : 'land');
    const pname = (i) => people[(i + r.int(people.length)) % people.length]; const title = headmanTitle(v);
    let i = 0;
    for (const sh of L.shops) {
      const kx = sh.x - sh.dirX * 2, kz = sh.z - sh.dirZ * 2;
      if (sh.kind === 'elder') { v.elder = Object.assign(makeNpc(20, 'elder', sh.castle ? sh.x : sh.x + sh.dirX * 4, sh.castle ? sh.z : sh.z + sh.dirZ * 4, v.starter ? 'Elder Hask' : title + ' ' + pname(7), null, vy, v.id, sty), { hidden: !freed, wander: false }); continue; }
      if (sh.kind === 'voodoo') { v.npcs.push(Object.assign(makeNpc(13, 'voodoo', kx, kz, shopDef('voodoo', v).keeper, 'voodoo', vy, v.id, sty), { hidden: false, wander: false })); continue; }
      v.npcs.push(Object.assign(makeNpc(30 + i++, 'keeper', kx, kz, shopDef(sh.kind, v).keeper, sh.kind, vy, v.id, sty), { hidden: !freed, wander: false, shopAt: sh }));
    }
    (L.stalls || []).forEach((t, k) => v.npcs.push(Object.assign(makeNpc(60 + k, 'keeper', t.x - t.fx, t.z - t.fz, shopDef(t.kind, v).keeper, t.kind, vy, v.id, sty), { hidden: !freed, wander: false }))); // behind the counter, looking out over the square
    const nV = Math.min(24, Math.round(v.R / 2.2));
    for (let j = 0; j < nV; j++) { const s0 = L.streets[r.int(L.streets.length)]; const d = (r() * 2 - 1) * (v.R - 8); const along = r() < 0.5; v.npcs.push(villager0(j, along ? s0 + (r() < 0.5 ? -1 : 1) : d, along ? d : s0 + (r() < 0.5 ? -1 : 1), pname(j), freed, vy, v, sty)); }
    for (let k = 0; k < (v.starter ? 0 : v.size === 'hamlet' ? 1 : 2); k++) v.npcs.push(Object.assign(makeNpc(80 + k, 'villager', v.x + (k ? -1 : 1) * (v.R - 7), v.z, 'Watchman ' + pname(k + 3), null, vy, v.id, sty, false), { hidden: !freed, watch: true })); // the watch walks from gate to gate, and is the only one about after dark
    if (world.preset.id !== 'earth' || sty === 'land') v.npcs.push(Object.assign(makeNpc(61, 'banker', v.x - 3, v.z + 4, 'Mr Crowe', null, vy, v.id, 'land'), { hidden: !freed, wander: false, tag: 'pays for errands', onTalk: bankerTalk })); /* the man in the top hat, on the square */
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
      for (const it in need) G.player.take(it, need[it]); delete closed[k]; st.income = incomeFor(v, st); UI.sfx('quest'); G.addTrainerXp(60); if (st.income) setTimeout(() => UI.toast(`${v.name} pays ◆ ${st.income} a day now.`, 'good'), 1500);
      if (k === 'station') { const sh = shopOf(v, 'station'); G.addRoost({ id: v.id, name: v.name, x: sh.x + sh.dirX * 5 + 0.5, y: v.y, z: sh.z + sh.dirZ * 5 + 0.5, world: world.preset.id }); setTimeout(() => { try { trainFilm(v); } catch (e) { console.warn(e); } }, 600); /* and the first train comes in */ }
    });
    return true;
  }
  // ---- the people of Atlantis: who stands where, what they say, the forge, and the ring under the falls ----
  const atlS = () => { if (!G.stats.atl) G.stats.atl = { best: 0, rides: 0 }; return G.stats.atl; };
  function populateAtlantis(v) {
    const L = atlLayout(), vy = v.y, sty = 'atlantis'; v.npcs = []; const people = peopleOf(v); const pname = (i) => people[i % people.length];
    const put = (n, x, z, o) => { n.x = v.x + x + 0.5; n.z = v.z + z + 0.5; n.tx = n.x; n.tz = n.z; n.yaw = Math.atan2(-x, -z); return Object.assign(n, { hidden: false }, o || {}); }; // everyone faces the middle of the city
    L.halls.forEach((h, i) => { const bx = h.x + Math.cos(h.a) * 1.7, bz = h.z + Math.sin(h.a) * 1.7; // behind the counter, at the back of the hall
      if (h.kind === 'voodoo') v.npcs.push(put(makeNpc(13, 'voodoo', 0, 0, shopDef('voodoo', v).keeper, 'voodoo', vy, v.id, sty), bx, bz, { wander: false }));
      else if (h.kind === 'elder') { v.elder = put(makeNpc(20, 'elder', 0, 0, 'Speaker Nerissa', null, vy, v.id, sty), h.x - Math.cos(h.a) * 7.6, h.z - Math.sin(h.a) * 7.6, { wander: false, atl: 'speaker' }); }
      else if (h.kind === 'fusing') v.npcs.push(put(makeNpc(21, 'keeper', 0, 0, 'Hallkeeper Ione', null, vy, v.id, sty), h.x - Math.cos(h.a) * 2.2 + Math.sin(h.a) * 1.6, h.z - Math.sin(h.a) * 2.2 - Math.cos(h.a) * 1.6, { wander: false, atl: 'hall' }));
      else if (h.kind === 'station') v.npcs.push(put(makeNpc(15, 'keeper', 0, 0, 'Tidewarden ' + pname(5), 'station', vy, v.id, sty), bx, bz, { wander: false, ferry: true }));
      else v.npcs.push(put(makeNpc(10 + i, 'keeper', 0, 0, shopDef(h.kind, v).keeper, h.kind, vy, v.id, sty), bx, bz, { wander: false })); });
    v.npcs.push(put(makeNpc(22, 'keeper', 0, 0, 'Ringmaster Delphin', null, vy, v.id, sty), 0, 12.4, { wander: false, atl: 'ring' }));
    // the great houses: who keeps each, and who is in it
    L.civic.forEach((h, i) => { const c = Math.cos(h.a), s = Math.sin(h.a), back = (d, sd) => [h.x + c * d - s * (sd || 0), h.z + s * d + c * (sd || 0)]; // d: towards the back wall, sd: along it
      if (h.kind === 'school') { v.npcs.push(put(makeNpc(40, 'keeper', 0, 0, 'Teacher Thessaly', null, vy, v.id, sty), ...back(4.4), { wander: false, atl: 'teacher' }));
        [[1.2, -2.2], [1.2, 0], [1.2, 2.2], [-1.0, -1.3], [-1.0, 1.3]].forEach(([d, sd], k) => v.npcs.push(Object.assign(put(makeNpc(60 + k, 'villager', 0, 0, ['Nim', 'Oda', 'Pell', 'Suri', 'Tam'][k], null, vy, v.id, sty, true), ...back(d, sd), { wander: false, atl: 'pupil' }), { yaw: Math.atan2(c, s) }))); } // the class, in two rows, looking at the teacher
      else if (h.kind === 'archive') v.npcs.push(put(makeNpc(41, 'keeper', 0, 0, 'Archivist Merope', null, vy, v.id, sty), ...back(-3.4, 1.8), { wander: false, atl: 'archive' })); // inside the door, to one side
      else if (h.kind === 'daycare') v.npcs.push(put(makeNpc(42, 'keeper', 0, 0, shopDef('daycare', v).keeper, 'daycare', vy, v.id, sty), ...back(4.7), { wander: false }));
      else if (h.kind === 'games') v.npcs.push(put(makeNpc(43, 'keeper', 0, 0, shopDef('games', v).keeper, 'games', vy, v.id, sty), ...back(3.6), { wander: false })); });
    L.courts.forEach((q, i) => { const c = Math.cos(q.a), s = Math.sin(q.a);
      if (q.kind === 'kelp') v.npcs.push(put(makeNpc(44 + i, 'villager', 0, 0, i ? 'Gardener Lir' : 'Gardener Soraya', null, vy, v.id, sty, false), q.x - Math.round(c * 5), q.z - Math.round(s * 5), { wander: false, atl: 'garden' }));
      else if (q.kind === 'park') { /* nobody keeps a park: whoever lives nearest sits in it */ }
      else if (q.kind === 'statue') { v.npcs.push(put(makeNpc(48, 'villager', 0, 0, 'Old Pelagia', null, vy, v.id, sty, false), q.x - Math.round(c * 4), q.z - Math.round(s * 4), { wander: false, atl: 'statue' }));
        for (let k = 0; k < 3; k++) v.npcs.push(put(makeNpc(65 + k, 'villager', 0, 0, ['Kip', 'Wren', 'Juno'][k], null, vy, v.id, sty, true), q.x + Math.round(Math.cos(k * 2.1) * 3), q.z + Math.round(Math.sin(k * 2.1) * 3), { atl: 'child', speed: 2.6, playAt: { x: v.x + q.x + 0.5, z: v.z + q.z + 0.5, r: 4.6 } })); } // children playing round the statue
      else v.npcs.push(put(makeNpc(49, 'villager', 0, 0, 'Clockwinder Orrin', null, vy, v.id, sty, false), q.x - Math.round(c * 4), q.z - Math.round(s * 4), { wander: false, atl: 'clock' })); });
    // somebody lives in every home, and is out in front of it or along the lane by day
    L.pods.forEach((q, i) => { const d = i % 2 ? 0.9 : 6; v.npcs.push(put(makeNpc(70 + i, 'villager', 0, 0, pname(i + 9), null, vy, v.id, sty, false), q.x - Math.round(Math.cos(q.a) * d), q.z - Math.round(Math.sin(q.a) * d), i % 2 ? { atl: 'home', homeI: i, wander: false, indoors: true } : { atl: 'home', homeI: i })); }); // every other one is at home when you call
    L.stalls.forEach((t, i) => v.npcs.push(put(makeNpc(90 + i, 'keeper', 0, 0, shopDef(t.kind, v).keeper, t.kind, vy, v.id, sty), t.x + Math.round(Math.cos(t.a) * 1.45), t.z + Math.round(Math.sin(t.a) * 1.45), { wander: false }))); // behind the counter, looking in at the pool
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * Math.PI * 2 + 0.2, r = i % 2 ? 12.6 + (i % 3) * 0.5 : i % 4 === 2 ? 28.6 : 20.4; v.npcs.push(put(makeNpc(i, 'villager', 0, 0, pname(i + 2), null, vy, v.id, sty), Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r))); } // and the market has its crowd
    v.npcs.push(v.elder);
    for (const n of v.npcs) { n.y = vy; n.home = { x: n.x, z: n.z }; }
    v.wanderR = 56; buildGuardEnts(v); // each keeps to the few steps round where they belong; the box only stops them at the glass
  }
  // the seahorse in the ring. Skerry is a great seahorse, Isla's; once she is yours, another takes her place
  function ringSpecies(spare) {
    const key = spare ? '_ring2' : '_ring1'; if (atlLayout()[key]) return atlLayout()[key];
    let sp = null; for (let s = spare ? 0x7B31 : 0x5EA1, n = 0; n < 60; s++, n++) { if ((((s >>> 0) % 1009) % 3) !== 1) continue; const c = KIN.species(s, ['Tide'], 0, { primary: 'Tide', shape: 'fish', total: 440, rarity: 2 }); if (!sp) sp = c; const f = KIN.formOf(c, 2); if (f && f.plan === 'greatseahorse') { sp = c; break; } }
    const nm = spare ? 'Brine' : 'Skerry'; sp.names = [nm, nm, nm]; sp.noFuse = true; sp.dex = 0; sp.tidal = true; // tidal: broken in already, by the ring
    sp.colors = spare ? { body: '#3a6fb8', belly: '#cfe4ff', accent: '#9fe0ff', dark: '#1c3a66', eye: '#1a1a1a' } : { body: '#2f93a8', belly: '#c4f0e6', accent: '#ffd25a', dark: '#16485a', eye: '#1a1a1a' };
    return (atlLayout()[key] = sp);
  }
  function atlRide(v) {
    const a = atlS(), p = G.player, spare = !!a.tamed, sp = ringSpecies(spare); const k = KIN.create(sp, Math.max(15, (G.trainerLevel || 1) + 3)); k.stage = Math.max(k.stage || 1, KIN.maxStage(sp)); k.tamed = true;
    const cx = v.x + 0.5, cz = v.z + 0.5, R = 6.4; let th = Math.PI / 2, paid = 0, won = 0; const day = G.dayCount || 0; if (a.day !== day) { a.day = day; a.today = 0; } const half = (a.today || 0) >= 5; a.today = (a.today || 0) + 1; a.rides = (a.rides || 0) + 1;
    const place = () => { p.x = cx + Math.cos(th) * R; p.z = cz + Math.sin(th) * R; p.y = v.y - 0.2; p.yaw = Math.PI - th; p.vx = p.vy = p.vz = 0; p.inWater = true; if (G.orbit) { G.orbit.yaw = p.yaw; G.orbit.pitch = -0.32; } };
    place();
    Taming.start(k, { endless: true, mode: 'water', noHurt: true, level: 0.15, ramp: 0.03, quiet: true, leap: 3.2,
      label: (s) => Math.floor(s.t) + '<small>' + (won ? '◆ ' + won : a.best ? 'best ' + Math.floor(a.best) : 'hold on') + '</small>',
      drive: (s, dt) => { th += dt * (0.45 + 0.22 * Math.min(3, s.I || 0)); place(); // round the falls, faster as she warms up
        const n = Math.floor(s.t / 5); if (n > paid) { paid = n; const g = Math.max(1, Math.round((n + 1) * (half ? 0.5 : 1))); won += g; G.shards += g; UI.sfx(n % 4 === 0 ? 'gemBig' : 'gem'); } },
      onFall: (secs) => { const first = !a.tamed && secs >= 20, record = secs > (a.best || 0) + 0.5 && (a.best || 0) > 0; a.best = Math.max(a.best || 0, secs); a.gems = (a.gems || 0) + won;
        if (record) { const b = 10; G.shards += b; won += b; }
        UI.toast(`${Math.floor(secs)} on ${sp.names[0]}.${won ? ' ◆ ' + won + ' won' + (record ? ', a new best' : '') + '.' : ' Nothing yet: the ring pays from five.'}${half && won ? ' Half pay after five rides a day.' : ''}`, won ? 'good' : undefined);
        if (first) { a.tamed = true; const mine = KIN.create(sp, k.level); mine.stage = k.stage; mine.tamed = true; const where = G.addKin(mine); if (G.seenDex) { try { G.seenDex(sp, 'caught'); } catch (e) { /* not in the book */ } }
          setTimeout(() => Dialogue.show('Ringmaster Delphin', ['Twenty. On Skerry. I have stood at this ring for thirty years and I have not once paid that out.', `She is coming with you, then. That is the rule, and it is older than I am${where === 'party' ? '' : ' (she is in your storage: your party is full)'}. She will carry you anywhere there is water, and under it.`, 'Go and see the Speaker. She will want to know who Skerry chose.']), 900); } } });
  }
  function atlTalk(n) {
    const a = atlS(), v = active;
    if (n.atl === 'ring') {
      if (!a.met) { a.met = true; return Dialogue.show(n.name, ['The ring is the oldest thing in the city. You get on, she goes round the falls, and she does her best to put you in the water.', a.tamed ? 'Brine has the ring now. Every five you last, I pay, and I pay more the longer you stay.' : 'That one is Skerry. Nobody has stayed on her to twenty since the girl she belonged to. Do it and she leaves with you.', 'Lean against her with the stick. It costs nothing to try and it does not hurt, you only get wet.'], () => atlRide(v)); }
      return Dialogue.show(n.name, [a.best ? `Your best is ${Math.floor(a.best)}. ${a.tamed ? 'Brine is feeling lively.' : a.best >= 12 ? 'Skerry noticed. Twenty and she is yours.' : 'Twenty, and Skerry is yours.'} Up you get.` : 'Up you get.'], () => atlRide(v)); }
    if (n.atl === 'teacher') { const read = Books.count('atlantis'), all = Books.total('atlantis');
      if (read >= all && !a.prize) { a.prize = true; G.shards += 60; UI.sfx('caught'); return Dialogue.show(n.name, ['All six. The little ones take a year over that shelf.', 'There is a prize for finishing it. Sixty shards out of the school jar. Do not tell the Speaker I counted a land-walker as a pupil.']); }
      const LESS = [['Sit at the back. Today is the Falls.', 'The sea comes in at the eye of the roof and goes out again through the floor of the ring pool. If it ever stopped we would have a day of air left. So we do not let it stop.', 'Who can tell me what makes the air? Yes. The kelp. Thank a gardener on your way home.'],
        ['Sit down, we have started. Today is the Old Ones.', 'There are three, and one of them is under us right now. It is asleep. It has been asleep since before there was an island.', 'When it turns over the ground shakes. That is all an earthquake is: something very old getting comfortable.'],
        ['Quiet, please. Today is the Concord.', 'A Kin does not carry you because you are strong. It carries you because it has decided to. The Concord was a crystal that let each feel what the other meant.', 'We do not have it any more. We have manners, which is slower.']];
      return Dialogue.show(n.name, LESS[(G.dayCount || 0) % LESS.length].concat([read ? `You have read ${read} of the ${all} on the shelf.` : 'The shelf is along the wall. The books are for children. You will manage.'])); }
    if (n.atl === 'pupil') return Dialogue.show(n.name, [['Shh. She can hear whispering through glass.', 'Have you been up? Is it true the sky has no roof on it?', 'I am going to ride Skerry when I am big. Everybody says that.', 'I licked the glass once. It tastes of nothing.', 'A is for Air. I know all of it. Ask me one.'][(n.id || 0) % 5]]);
    if (n.atl === 'child') return Dialogue.show(n.name, [['You cannot catch me. Nobody can. I am Skerry.', 'We are playing Falls. You have to be the sea.', 'Is that a land scarf? Can I have it?'][(n.id || 0) % 3]]);
    if (n.atl === 'archive') return Dialogue.show(n.name, ['Four things came down with us from the old city. Look as long as you like. Do not touch.', 'A splinter of the Concord, from before it was bent. It still hums when a Kin you trust is standing near.', 'The old city itself, cast in gold by somebody who missed it. Every tower is where it was.', 'A child\'s saddle. There is no name on the card. Everybody knows whose it is.', a.told ? 'And the first Fusion Table, in small. He made it as a toy for her before he ever made a real one.' : 'And the first Fusion Table, in small. A man made it as a toy for his daughter. Ask the Speaker which man.', 'The table in the middle is the sea as we know it. Rose is reef. The green is the Lost World, and the dark cut beside it is where the big ones live. The glass bead is us.']);
    if (n.atl === 'garden') { const day = G.dayCount || 0; if (a.kelpDay !== day) { a.kelpDay = day; G.player.add('berry', 3); UI.sfx('caught'); return Dialogue.show(n.name, ['Every breath you take down here came out of these beds. The kelp does the work and we do the weeding.', 'Sea plums are ripe. Take three. They are berries to you, I think.']); }
      return Dialogue.show(n.name, ['You have had today\'s plums. Come back when the lamps have been round once.', 'If the beds ever go brown, run for the Falls and swim. That is the whole of the drill.']); }
    if (n.atl === 'statue') return Dialogue.show(n.name, ['That is Isla, and that is Skerry under her. I was at school with one of them.', 'She used to ride round the falls standing up. The Ringmaster will tell you nobody can. He was not there.', a.tamed ? 'They say Skerry went with a land-walker. Good. She waited long enough.' : 'Skerry is still in the ring. She has thrown everybody since.']);
    if (n.atl === 'clock') { const t = world.time || 0, night = t > 0.75 || t < 0.22; return Dialogue.show(n.name, ['There is no sun down here, so we keep the tide instead. The pearl goes round the hoop once for every tide up above.', night ? 'It is night on the land now. You would not know it from here, and the children use that against their mothers.' : 'It is day on the land now. The light in the Falls is the only way you would know.', 'I wind it every morning. If I stop, nothing happens for about a week. Then everybody is late for everything.']); }
    if (n.atl === 'home') { if (n.indoors) { const IN = ['Come in, come in. Mind the rug, it is older than the canal.', 'You can sit. Not on the bed. On the stool.', 'Everybody asks about the cap. Yes, it is glass. No, it has never cracked.', 'I keep the chest locked. There is nothing in it. It is the principle.', 'This was my mother\'s house and her mother\'s. We have moved the table twice.', 'If you are after the school, it is the big house with the gold band. This is just my kitchen.', 'Tell the children outside you are not a fish. They have a bet on.', 'I was about to eat. There is enough for one and a half.']; return Dialogue.show(n.name, [IN[((n.homeI || 0) >> 1) % IN.length]]); } const LINES = ['The lamp over every door is a different colour. That is how the little ones find their way home.', 'You are the land-walker. My youngest wants to know if rain is real.', 'Mind the canal. It is not deep, but it is always colder than you expect.', 'The Tide Tables took forty shards off my husband last night. He says he was unlucky. He was outplayed.', 'I was born under this roof. I have seen the sky twice. It is very large and nobody is in charge of it.', 'The hatchery had six foals this spring. Go and look, they let you.', 'If you are going up, take the Current. Swimming the Falls is for show-offs and seahorses.', 'We do not lock doors down here. Where would a thief go?'];
      return Dialogue.show(n.name, [LINES[(n.homeI || 0) % LINES.length]]); }
    if (n.atl === 'hall') return Dialogue.show(n.name, ['This is the fusing hall. Every Fusion Table on the land was made on this floor and given away, back when we still went up into the light.', 'The one who kept it was called the Kinmaster. It was only a job then.', a.told ? 'You know the rest. The table still works. He never came back for it.' : 'Ask the Speaker about him. It is hers to tell.']);
    if (n.atl === 'speaker') {
      const fled = !!G.stats.lightReturned;
      if (!a.tamed) { a.spoke = true; return Dialogue.show(n.name, ['A land-walker, in Atlantis. Nobody finds this city unless the sea lets them, so sit down before you fall down.', 'You have met the Bound, and the man who binds them. You call him the Kinmaster. That was a title here once, and an honest one.', 'I will tell you who he was. First the city wants to know who you are. The seahorse in the ring is called Skerry, and she has thrown every rider for thirty years.', 'Stay on her to a count of twenty. Then come back to me.']); }
      if (!a.told) return Cine.tell(n.name, n, { 3: [{ orbit: { x: n.x, y: n.y, z: n.z, r: [16, 24], h: [5, 11], a: [0.4, 1.5], ly: 3 }, secs: 13, mood: 'memory', flash: ['The old city stood in the shallows, in the light.', 'One night the Mantlewyrm turned over in its sleep.', 'The seabed dropped, and the city went down with it.', 'Skerry came back to the ring. Isla did not.'] }], 5: [{ flash: ['He bent the Concord until it stopped asking.', 'He bound Kin first. Then people.', 'We cast him out, and sank the city where he has never looked.'], mood: 'dread' }] }, ['Twenty, on Skerry. I did not think I would see that again.', 'His name is Calder. He kept the fusing hall, and that is all Kinmaster ever meant. He is my brother.', 'He had a daughter, Isla. She rode before she could walk, and Skerry was hers. I taught her.', 'The old city stood in the shallows, in the light. One night the Mantlewyrm turned over in its sleep, far under the Earth. The seabed dropped and the city went with it. Skerry came back to the ring. Isla did not.', 'We live by trust down here. You earn a Kin and it carries you. Calder said trust had just killed his child, and that anything able to drown a city in its sleep must never be left free again.', 'He took the Concord, the crystal that lets a rider and a Kin feel each other, and he bent it until it stopped asking. That is his Binding Crystal. He bound Kin first. Then people. We cast him out, and we sank this city where he has never looked.', 'He does not want a throne. An Old One sleeps under every world: the Mantlewyrm here, the Selenaut over the Moon, the Ringwarden on Halo. He means to chain them all and fuse them into one beast that answers to him alone. Then nothing wakes unless he allows it.', fled ? 'You broke his crystal on Earth, and he ran for the Moon. He is after the Selenaut now.' : 'He is still gathering what he needs on Earth. When that fails him he will go up, to the Moon first.', 'You are why he is wrong. Skerry carried you because she chose to. Go to the Tideforge. Brann will tell you about the trident, and what it takes to make one.'], () => { a.told = true; UI.sfx('quest'); UI.toast('The Tideforge will deal with you now.', 'good'); });
      return Dialogue.show(n.name, [G.player.has('sp_trident') ? 'You carry the trident. It cuts a Binding, any Binding. Calder knows that better than anyone alive. He helped forge the last one.' : 'Brann, at the Tideforge. The trident takes a piece of each world, and the first is a tooth from the Abyssaurus, out in the deep by the Lost World.', 'And ride when your head is too full. It is what the ring is for.']); }
  }
  // the Tideforge: what Atlantis makes that nobody on the land can. It deals with riders the Speaker has spoken for
  function atlForge(v) {
    const a = atlS(), stock = []; if (typeof Combat !== 'undefined') { const m = Combat.rack(v, 'armoury')[0]; if (m) stock.push(m); }
    if ((G.stats.apex || {}).mosa && !G.stats.atlTooth) { G.stats.atlTooth = true; G.player.add('abysstooth', 1); }
    const no = (item, sub) => ({ service: 'locked', locked: true, icon: item, name: ITEMS[item].name, sub, price: 0, btn: 'Not yet' });
    if (a.told) stock.push({ item: 'sp_storm', price: 4800 }); else stock.push(no('sp_storm', 'The forge arms riders the Speaker has spoken for. Stay on Skerry to twenty, then hear Nerissa out.'));
    if (!G.player.has('sp_trident')) stock.push(a.told ? { barter: { abysstooth: 1, selenite: 8, ringshard: 3 }, item: 'sp_trident', n: 1 } : no('sp_trident', 'Brann does not talk about the trident to strangers.'));
    stock.push({ item: 'tidelung', price: 3500 });
    return { title: 'The Tideforge', keeper: 'Brann', greet: !a.told ? 'Tidesteel does not go up to the land with just anyone. The lung I will sell you: nobody should drown on my doorstep.' : G.player.has('sp_trident') ? 'There it is. Mind where you point it.' : 'The trident is three tines and each one is tipped with a piece of a different world: a tooth from the Abyssaurus, selenite off the Moon, a shard of the ring over Halo. Bring me all of it and I will forge it while you wait.', stock };
  }
  function populate(v) {
    if (v.atlantis) { populateAtlantis(v); return; }
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
      { const fm = keeper(13, 'station', 17.5, -2.5); fm.name = 'Ferryman ' + pname(13); fm.ferry = true; v.npcs.push(fm); }
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
    if (world.preset.id !== 'earth' || (v.type === 'land' && sty !== 'frontier')) v.npcs.push(Object.assign(makeNpc(61, 'banker', v.x - 4, v.z + 5, 'Mr Crowe', null, vy, v.id, world.preset.id !== 'earth' ? 'land' : sty), { hidden: !freed, wander: false, tag: 'pays for errands', onTalk: bankerTalk }));
    if (v.type === 'land' || world.preset.id !== 'earth') { v.npcs.push(keeper(15, 'games', 3, -3)); [[-6, 6], [7, -6], [-7, -3], [3, 8]].forEach((h, i) => v.npcs.push(villager(40 + i, h[0], h[1]))); } // somebody to play against, and enough people about that the place is not empty
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
  // ---- what a tyrant says. Each of them wants something small and particular and is a little ridiculous about it; that is what you remember him by.
  // hail: once, when he first sees you. taunts: now and then while you stand about. fight: as it starts. beaten: his last word on the way out
  const VOICE = {
    sly: { hail: ['Every door in {t} locks from the outside now. I counted them. Twice.', 'I never hurt a soul in {t}. I only keep the keys. People are so much tidier indoors.', 'The mayor\'s sash fits me better than it ever fitted him. Say it does.', 'I know which key opens which door in {t} by the sound. Go on, test me. No, don\'t.'],
      taunts: ['Looking for a key? I have all of them.', 'Jingle, jingle.', 'You could knock. Nobody is allowed to answer.', 'I locked the bakery last. The smell was distracting.'], fight: 'Fine. But I am holding the keys while we do this.', beaten: 'Take them, take them! Half of them never fitted anything anyway.' },
    grim: { hail: ['I broke the old wall of {t} with this. Then I made them build me a better one.', 'The Kinmaster said hold {t}. Nobody said for how long. So: for good.', 'I was part of a mountain once. They cut a road through it. Now I stand in theirs.', 'Nobody in {t} has laughed since I came. I do not see why that is my fault.'],
      taunts: ['Still here.', 'I can stand like this for a year. I have.', 'Say what you came to say.', 'The square is mine. The rest I am only borrowing.'], fight: 'Good. Talking wears me out.', beaten: 'Hm. Tell them the wall was well built. That part was me.' },
    glee: { hail: ['{t} bakes for me now! Four pies a day. Five on feast days, and I have made every day a feast day.', 'They gave me these medals so I would stop singing. I did not stop singing!', 'A guest! I have not had a guest since I ate the welcome mat.', 'Do you know what {t} is famous for? Me! As of this spring.'],
      taunts: ['Ha! Ha ha! Sorry. I thought of something.', 'Is that food? You would tell me if that was food.', 'I gave myself this medal for patience. Hurry up.', 'La la laaa. That one is about me.'], fight: 'Oh, a game! I love a game. I always win. I am the only one who plays.', beaten: 'Well! That was the best afternoon I have had in {t}. Same time next year?' },
    alien: { hail: ['I came down on {t} the way night does. Nobody saw me arrive. Nobody sees much of anything now.', 'The lamps of {t} burn for me. I count them from above, and I know who is still awake.', 'I do not want {t}. I want it quiet. They turned out to be the same thing.'],
      taunts: ['Shh.', 'You are very loud for something so small.', 'I was nearly asleep. It has been ninety years.'], fight: 'Then I will make you quiet as well.', beaten: 'So loud. All of you. Keep it, then. I am going up where there is nobody.' },
    halo: { hail: ['The ground under {t} was mine when it still ran like water. I have only come back for it.', 'I ran the whole ring round once to see if it ended. It does not. So I stopped here.', 'They built {t} on my back while I slept. I woke up. That is the whole story.'],
      taunts: ['Mind the cracks. They are warm.', 'I can wait. I waited for the rock to cool.', 'Hff.'], fight: 'Come on, then. I have not had a proper run at anything in an age.', beaten: 'Hff. Good run. The ground is yours until it melts again.' },
    atlantis: { hail: ['I was small enough to swim in through the gate once. They fed me. That was their mistake.', 'A city under glass. A bowl with the lid on. Somebody had to be the big fish.'],
      taunts: ['Closer. I see badly.', 'Everything in here tastes of pearl.'], fight: 'At last, something that came in from outside.', beaten: 'Open the gate, then. I have outgrown the place anyway.' },
  };
  // the tyrants are few and you keep meeting them. Each world has its handful; a village is held by one of them, and when you throw him out of one he turns up in another, remembering you. pal: which of his kind's colours he always wears
  const CAST = { earth: [{ name: 'Keychain', mood: 0, pal: 0 }, { name: 'Stonewall', mood: 1, pal: 1 }, { name: 'Bigmouth', mood: 2, pal: 2 }] };
  function castOf(v, h) { const tn = styleOf(v) && STYLE_NAMES[v.style] && STYLE_NAMES[v.style].tyrant; if (v.style === 'atlantis') return { name: tn[0], mood: 1, pal: 0, full: true };
    if (tn && (v.style === 'alien' || v.style === 'halo') && !v.R) { const i = h % 2; return { name: tn[i], mood: i, pal: i, full: true }; } if (tn && !v.R) return null; /* the Moon's and Halo's planned places are held by the same three as Earth's, in the dress of the place. Only the small post by the landing pad keeps a local master */ // the other peoples keep their own
    if (v.type !== 'land') return null; if (v.starter) return CAST.earth[0]; for (let k = 0; k < 3; k++) { const c = CAST.earth[(h + k) % 3]; if (metCount(c.name) <= LAST_AT || state(v.id).tyrant === c.name) return c; } return null; } // one who has made his last stand holds nowhere else; when all three have, the villages left are held by lesser names
  const LAST_AT = 3; // beaten this many times, the next meeting is his last
  /* the first thing each says when you find him on another world: he did not expect you to follow, and he has opinions about the place */
  const ARRIVE = { moon: { sly: 'You. Up here. Do you know what a key costs on the Moon? I had the whole ring recut for these doors.', grim: 'Hm. Less weight up here. The walls weigh the same. So do I.', glee: 'You came all this way! Look at my suit! It squeaks when I laugh. Listen!' },
    halo: { sly: 'The far side of the sky, and still you. These are not keys any more. They are whatever I could file down from the wreck.', grim: 'Sand in the mortar. Sand in everything. This wall holds anyway.', glee: 'My favourite guest, on the hottest rock there is! I have a new song. It is mostly coughing.' } };
  const LAST = { sly: ['This is the last ring I have. One key on it. You are not getting it.', 'There. The last key. I never did find out what it opens.'], grim: ['No more walls after this one. So this one holds.', 'Hm. Good. I was tired of standing.'], glee: ['The last feast! I saved you a seat. It is the one in front of my fist.', 'Best party I ever lost. Keep the medals. I made them myself anyway.'] };
  const WK = () => world && world.preset.id !== 'earth' ? '@' + world.preset.id : ''; /* the three are met afresh on each world: what they remember of you up there starts from nothing */
  const metCount = (name) => (G.stats.tyrantMet && G.stats.tyrantMet[name + WK()]) || 0;
  const AGAIN = {
    sly: [['You. I had new keys cut after the last time. Better keys.', 'Three villages now. I am running out of rings, and out of patience.', 'I have started locking the doors from the inside as well. In case of you.'], 'Keep this one. There is always another village, and I always have a key.'],
    grim: [['You moved me once. Once.', 'I have thought about our last meeting. I did not enjoy thinking.', 'Every wall I build, you walk through. I am beginning to take it personally.'], 'Hm. The next wall will be thicker. You will see it.'],
    glee: [['My favourite guest! I wrote a song about losing to you. It has nine verses.', 'You again! I told everyone here you would come. Nobody listens when I sing it.', 'Oh good, it is you. I was getting bored of winning.'], 'Same time next village? Wonderful!'],
    alien: [['You followed me. Across all that silence. Why would you do that?', 'Again the loud one. I am beginning to hear you in my sleep.'], 'There is always somewhere quieter. I will find it. You will find me.'],
    halo: [['You. I ran half the ring to be rid of you.', 'Round and round. We keep meeting because the ring has no end. I checked.'], 'Hff. Further round, then. I will see you when the ring brings you.'],
    atlantis: [['Back again? Nothing ever leaves this bowl.'], 'Open the gate, then. I have outgrown the place anyway.'] };
  /* what each says as he goes, the first time you throw him out of somewhere. It points on: at the others, at the Kinmaster, at the shard he wears */
  const PART = { sly: ['Keep it. The Kinmaster cut these keys, not me. He has the pattern for every lock there is, and he knows your face now.', 'One ring gone. Stonewall has the walls and Bigmouth has the larder, and neither of them gives things back.', 'You think this shard on my chest is a medal. It is a leash. Pull hard enough on mine and somebody feels it at the other end.'],
    grim: ['Hm. The wall was good. You were better. I will tell him so, and he will not like hearing it.', 'I hold what I am told to hold. The one who tells me has not lost yet. Remember that when you meet him.', 'Go on. Keychain will lie about this and Bigmouth will sing about it. I will just remember it.'],
    glee: ['Oh, well played! I shall put it in the song. The Kinmaster hates the song. That is how I know it is good.', 'Off I go! Tell Keychain I lost first, he will be so pleased. Tell Stonewall nothing, he sulks.', 'Take the lot! It was never mine. Nothing is, we are all on the same string. Mind who is holding the other end.'] };
  /* a town is held by two of them and a city by all three. What the first says about the company he has brought, and what the next says when it is his turn */
  const GANGSAY = { sly: (o) => o.length > 1 ? `And look who I brought. ${o[0]} and ${o[1]}. Three of us, one of you. I have done the sum twice.` : `There are two of us this time. ${o[0]} is right there. What are you going to do about that?`,
    grim: (o) => o.length > 1 ? `Three of us. ${o[0]}. ${o[1]}. Me. Count them.` : `Two of us now. ${o[0]} and me. You will not move two.`,
    glee: (o) => o.length > 1 ? `Everybody came! ${o[0]}, ${o[1]} and me! We have never all lost on the same day. Shall we find out?` : `I brought a friend! ${o[0]}! Two of us! Is that not cheating? I do hope so.` };
  const TURN = { sly: ['Useless. I plan for a week and they send muscle first. Fine. My turn, and I brought keys.', 'You again, and already past the first of us. I had new keys cut after the last time.'], grim: ['He talks. I do not. My turn.', 'You moved me once. You have just moved him. That is enough moving for one day.'], glee: ['My go! My go! I have been waiting so nicely!', 'Oh, it IS you! I told them you would get past the first one. Now me, now me!'] };
  /* every time you meet one of them again he has a plan. It is never a good plan */
  const PLANS = { sly: [['I have dug a pit, right under where you are standing. Straw over the top. Step forward, would you?', 'He steps forward to point at it. The straw gives way under him.'], ['A cage. On a rope. Over your head. Do not look up.', 'The other end of the rope was tied to his own tail.'], ['I swapped your net for a bag with a hole in it while you slept. Check. Go on.', 'He has been carrying the bag himself all morning. His keys are gone through the hole.']],
    grim: [['I built a wall between us. You cannot reach me.', 'He built it behind himself. He turns to check, and walks into it.'], ['I have lifted the millstone every morning. For you.', 'He lifts it. It comes down on his foot.'], ['I stood here all night so you could not slip past.', 'He is half asleep on his feet when it starts.']],
    glee: [['I baked you a pie! It is full of bees. Surprise! Oh. I said it out loud.', 'He has eaten half of it already. He is humming, and not on purpose.'], ['Fireworks! All pointed at you! Somebody light them. No, the OTHER end.', 'They go off the wrong way. He claps anyway, a bit singed.'], ['I hired a band to play so loud you cannot think!', 'They play his song about losing to you. All nine verses. It puts him right off.']] };
  /* The same three on every world, and on each one they are more themselves. Keychain cannot bear a place whose doors he did not lock. Stonewall
     takes every strange wall as a personal slight. Bigmouth has been there a week and is therefore the leading expert. One table per world:
     first words, what he mutters, what he says on meeting again, on leaving, his plan and how it goes wrong, his turn in a gang, his last stand */
  const WV = {
    moon: {
      sly: { hail: ["You. Up here. Do you know what a key costs on the Moon? I had the whole ring recut for these doors.", "Every door in {t} seals itself. By itself! I did not lock a single one. I have never felt so useless.", "I counted the airlocks in {t}. Forty. Forty doors, and each one wants a different key and gives a little hiss."],
        taunts: ["Jingle. It does not carry up here. I checked.", "These doors open when you walk at them. Disgusting.", "I keep the spare air. Ask nicely. No.", "My tail does not fit the suit. Do not look at it."], fight: "Fine. But mind the suit. It is rented.",
        again: [["You again. I changed every seal in the dome after last time. They all still hiss at me.", "I have started locking the airlocks from both sides. I was stuck in one for a day. It was worth it.", "Three domes. Three! There are keys floating about up here that I have never even met."], "Keep it. There is always another dome, and somewhere in this suit I have its key."],
        part: ["Take it. He had these cut for the Moon before any of us came up. He plans further ahead than you walk.", "One dome gone. Stonewall has the gates and Bigmouth has the kitchens, and up here neither of them can run. Nor can I.", "There is a white post outside the big city where nobody jingles at all. That is where his real locks are."],
        plans: [["I have let the air out of the square. Slowly. You will not notice until... is anyone else dizzy?", "He let it out of his own suit. He sits down very carefully."], ["A trapdoor. Under you. It opens onto nothing at all. Stand still.", "With so little weight he cannot push the lever down. He hangs off it, kicking."], ["I have swapped your Kin's air for laughing gas.", "He tested it first. He is still giggling, and he hates it."]],
        gang: (o) => o.length > 1 ? `All three of us, sealed in one dome with you. ${o[0]} and ${o[1]} are just there. I have counted the air. It is enough for three.` : `Two of us this time. ${o[0]} is right there, fogging up. What are you going to do about that?`,
        turn: ["They send the heavy one first, even up here where nothing is heavy. My turn. I brought the good keys.", "Past the first of us already. I had the seals changed. It did not help him."], last: ["Last dome. Last key. It is the one for my own suit, and you are not having it.", "There. Take it. I never liked the suit. Mind the tail flap."] },
      grim: { hail: ["Hm. Less weight up here. The walls weigh the same. So do I.", "They build with glass in {t}. A wall you can see through is not a wall. I am fixing that.", "I stamped my foot in {t} to make a point. I came down some time later. The point stands."],
        taunts: ["Still here.", "Glass. Hm.", "I do not float. I choose not to.", "The square is mine. The dome I am only borrowing."], fight: "Good. The suit makes talking worse.",
        again: [["You moved me on Earth. Up here I weigh less. That should have made it easier for you. It did not make it easier for me.", "I built a wall round this dome. Then I saw the dome was already a wall. I do not want to talk about it.", "Every time. Hm. I have begun to plan for losing. I plan badly."], "Hm. The next dome has thicker glass. I asked."],
        part: ["Hm. Glass held longer than I thought. Not long enough. I will tell him, and he will look at me the way he does.", "I hold what I am told to hold. The man who tells me is up here too. You will know the place. It shoots.", "Go on. Keychain will say the door stuck. Bigmouth will sing. I will stand somewhere else."],
        plans: [["I have piled every rock on the Moon in front of this gate.", "They weigh almost nothing. A child has already pushed them over."], ["I will jump on you. From there.", "He jumps. He is still on his way up when it starts."], ["I painted the glass black so you could not see me.", "He painted it from the inside. He has not found the door since."]],
        gang: (o) => o.length > 1 ? `Three of us. ${o[0]}. ${o[1]}. Me. Up here that is still three.` : `Two. ${o[0]} and me. You will not float two.`,
        turn: ["He talks. It fogs his helmet. My turn.", "You moved him. Up here that is not hard. Try me."], last: ["No more domes behind me. So I do not step back.", "Hm. Good. The suit was tight."] },
      glee: { hail: ["You came all this way! Look at my suit! It squeaks when I laugh. Listen!", "Welcome to the Moon! I am practically from here. I have been here since Tuesday. Ask me anything!", "{t} bakes with spores! Nobody told me what a spore was until the fourth pie. I have decided not to mind."],
        taunts: ["Squeak! That was the suit.", "The Moon is made of crust. I am an expert. I licked it.", "I sing in the helmet. It is like having a choir of me!", "Mind the big step. They are all big steps!"], fight: "Oh good! I float beautifully when I am hit!",
        again: [["You again! I have been here weeks longer than you now. I know everything about the Moon. It is the grey one!", "My favourite guest! I wrote a Moon verse for the song. It rhymes 'crater' with 'later'. Twice!", "Did you know there is no sound out there? I sang for an hour before anyone told me. Best audience I ever had."], "Same time next dome? I will bring the pie. It floats!"],
        part: ["Well played! As the local expert I can tell you that was not supposed to happen. Off I pop!", "Tell Keychain I lost first again, he keeps a tally. Tell the man at the white post nothing. He does not like singing.", "Take it all! Up here it weighs nothing anyway. Mind the one in black. He has stopped laughing at my jokes, and he never started."],
        plans: [["I baked a Moon pie! It is full of bees! In little suits! Oh. I said it again.", "The bees are fine. He has been stung through the glove four times."], ["I will sing so loud your helmet cracks!", "He fogs his own up on the first note and walks into the fountain."], ["Watch this! A jump right over your head, to land behind you. Very frightening!", "He goes over. He keeps going. Somebody fetches him back with a pole."]],
        gang: (o) => o.length > 1 ? `Everybody came up! ${o[0]}, ${o[1]} and me! As the Moon expert I say we cannot possibly all lose. Shall we see?` : `I brought ${o[0]}! He does not like it up here. I love it up here! Two of us!`,
        turn: ["My go! I have been floating so patiently!", "Oh, it IS you! I told them you would come. I am the expert. Now me!"], last: ["The last party on the Moon! I saved you the seat nearest the airlock.", "Best one yet. Keep the medals. They are biscuit, mostly."] } },
    halo: {
      sly: { hail: ["The far side of the sky, and still you. These are not keys any more. They are whatever I could file down from the wreck.", "Nothing in {t} locks. The doors are curtains. How do you lock a curtain? I have tried. I have tried pins.", "Sand in every keyhole in {t}. I oil them at dawn and by noon they grind like teeth."],
        taunts: ["Jingle. Crunch. That is the sand.", "A curtain. For a door. Animals.", "I have locked the water. That, at least, has a tap.", "Do not touch the goggles. They are holding my face on."], fight: "Fine. Quickly. I am getting sand in the ring.",
        again: [["You. I had a lock made for this gate out of a wagon axle. It weighs more than I do. It works. Mostly.", "I have been reduced to padlocking the lids of barrels. Barrels. This is what you have done to me.", "Three worlds. I have dropped keys on three worlds because of you."], "Keep it. There is another yard down the line, and the Rig only runs on time while I hold the switch keys."],
        part: ["Take the place. He told us Halo was the end of the road. He did not say whose.", "One yard gone. Stonewall is welding himself a new wall and Bigmouth has found the stew pots. You will meet them. You always do.", "Go and look at the ring of ribs outside the big city. There is a man in the top row who does not clap. These keys were his."],
        plans: [["I have buried a cage under the sand, exactly where you are standing. Do not move.", "He forgot where. He is in it. Only his goggles show."], ["I have greased the whole square. You will slide straight out of the gate.", "The grease is full of sand now. He has made a very good road."], ["I let a Pit beast loose behind you. Do not turn round.", "It is behind him. It is licking his hat."]],
        gang: (o) => o.length > 1 ? `${o[0]} and ${o[1]} are here as well. Three of us, one of you, and nowhere left to send for a fourth.` : `Two of us. ${o[0]} is over there, complaining. Do the sum.`,
        turn: ["They send the loud one first because he does not mind the heat. My turn. Mind the keys, they are hot.", "You are past him already. I told them a curtain would not hold you."], last: ["Last yard on the last world. Last key. It is a spoon I filed down. It is still mine.", "There. It never opened anything. I liked carrying it."] },
      grim: { hail: ["Sand in the mortar. Sand in everything. This wall holds anyway.", "They build with scrap in {t}. It rattles when the wind gets up. I have stood against it all night to keep it quiet.", "A dune climbed my wall in {t} while I slept. It is on this side now. I am not speaking to it."],
        taunts: ["Still here. Warmer.", "It rattles. I know it rattles.", "I do not sweat. That is condensation.", "The yard is mine. The sand comes and goes."], fight: "Good. Standing is hot work.",
        again: [["You moved me on Earth and you moved me on the Moon. Here the ground moves as well. I have nothing left to stand on but spite.", "I welded this wall myself. I did not know how to weld. It shows.", "Hm. Again. I have stopped unpacking."], "Hm. The next wall I will bolt to the bedrock. If there is any."],
        part: ["Hm. It was a bad wall. It was the best one here. He will say nothing about it, and that is worse.", "I hold what I am told to hold. He is out of worlds to send me to. Think about what that makes him.", "Go on. Keychain will blame the sand. Bigmouth will claim he let you win. I will be at the next gate."],
        plans: [["I have stood so long in this spot that the sand has set round my feet. You will not shift me.", "He cannot shift either. It starts with him stuck to the knees."], ["I pushed the dune up against the gate. Nobody gets in.", "It is on his side of the gate. He has been digging since dawn."], ["I am wearing every plate of scrap in the yard. Nothing gets through.", "He cannot lift his arms. He falls over, slowly, with a great deal of noise."]],
        gang: (o) => o.length > 1 ? `Three. ${o[0]}. ${o[1]}. Me. Last time we count.` : `Two. ${o[0]} and me. The sand is on our side. I think.`,
        turn: ["He sings. In this heat. My turn.", "You moved him. He moves if you clap. Try me."], last: ["There is no wall behind this one. There is no world behind this one.", "Hm. Then I am done standing. Good."] },
      glee: { hail: ["My favourite guest, on the hottest rock there is! I have a new song. It is mostly coughing.", "Welcome to Halo! I got here before you, so I am the expert. Ask me anything. The answer is sand!", "I know all about {t}. I have been here nine whole days. That ring in the sky? Mine. I saw it first."],
        taunts: ["As the expert here: it is hot.", "I know a short cut. It is longer, but there is stew.", "The goggles are so I look clever. Is it working?", "I was here first! Nine days! Ten tomorrow!"], fight: "Oh, lovely! Local rules! I just made them up!",
        again: [["You again! Did you get lost? I never get lost here, I am the expert. I simply stand still until someone finds me.", "Ask me anything about Halo! The brine? Delicious. Do not drink it. I found out both of those the same afternoon.", "I have been here so long they have named a stew after me. It is called No, Not Him Again."], "Same time next yard? I know the way! It is that way. Or that way!"],
        part: ["Well played! As the leading expert on Halo I can confirm that you won. I have been here longer, so I lost first!", "Off I go! Tell Keychain his curtain idea was good, it will ruin his day. Tell Stonewall the dune says hello.", "Take it! Go and see the Pit. There is a man there in black who does not laugh. I did my whole act. Nothing. Mind him."],
        plans: [["I baked you a sand pie! It is full of scorpions! Surprise! Oh, bother.", "He has kept one as a pet. It rides on his hat and stings him whenever he hits a high note."], ["I know this ground. There is quicksand right where you are. I am the expert!", "There is not. There is some where he is. He goes down singing."], ["I have trained a Pit beast to sit on you! Watch! Sit! SIT!", "It sits on him. It seems very fond of him."]],
        gang: (o) => o.length > 1 ? `All three of us! ${o[0]}, ${o[1]} and me, the expert! I have explained Halo to them. They did not thank me.` : `I brought ${o[0]}! I am showing him round. I know all the places. This is one of them!`,
        turn: ["My go! Expert coming through! Mind the expert!", "Oh, it IS you! I told them you would get past him. I know everything here. Now me!"], last: ["The last feast, on the last world! As the expert I chose the menu. It is sand.", "Best party I ever lost. Keep the medals. Nine days! It felt like ten."] } } };
  const wvOf = (key) => { const w = world && WV[world.preset.id]; return (w && w[key]) || null; }, TURNS = (key) => (wvOf(key) || {}).turn || TURN[key], GANGS = (key) => (wvOf(key) || {}).gang || GANGSAY[key], PLANSOF = (key) => (wvOf(key) || {}).plans || PLANS[key];
  function tyrantVoice(v, mood, h, force) { const out = tyrantVoiceE(v, mood, h, force), cast = out.cast, key = ['sly', 'grim', 'glee'][mood % 3], W = cast && !cast.full ? wvOf(key) : null; if (!W) return out;
    const met = metCount(cast.name), f = (t) => t.replace(/\{t\}/g, v.name || 'this place'); out.taunts = W.taunts.map(f); out.fight = W.fight;
    if (out.last) { out.hail = W.last[0]; out.beaten = W.last[1]; } else if (met > 0) { out.hail = W.again[0][Math.min(met - 1, W.again[0].length - 1)]; out.beaten = W.again[1]; } else { out.hail = f(W.hail[(h >>> 5) % W.hail.length]); out.beaten = W.part[h % 3]; } return out; }
  function tyrantVoiceE(v, mood, h, force) { const cast = force || castOf(v, h), met = cast ? metCount(cast.name) : 0; if (cast && !cast.full && met >= LAST_AT) { const key = ['sly', 'grim', 'glee'][mood % 3], V = VOICE[key], f = (t) => t.replace(/\{t\}/g, v.name || 'this place'); return { hail: LAST[key][0], taunts: V.taunts.map(f), fight: 'No running this time.', beaten: LAST[key][1], cast, last: true }; }
    if (cast && met > 0) { const key = !cast.full ? ['sly', 'grim', 'glee'][mood % 3] : v.style === 'alien' ? 'alien' : v.style === 'halo' ? 'halo' : v.style === 'atlantis' ? 'atlantis' : ['sly', 'grim', 'glee'][mood % 3], A = AGAIN[key], V = VOICE[key], f = (t) => t.replace(/\{t\}/g, v.name || 'this place'); return { hail: A[0][Math.min(met - 1, A[0].length - 1)], taunts: V.taunts.map(f), fight: f(V.fight), beaten: A[1], cast }; }
    const out = tyrantVoice0(v, mood, h, cast); out.cast = cast; if (cast && !cast.full && WK() && ARRIVE[world.preset.id]) out.hail = ARRIVE[world.preset.id][['sly', 'grim', 'glee'][mood % 3]]; if (cast && !v.starter) out.beaten = PART[['sly', 'grim', 'glee'][mood % 3]] && (!styleOf(v) || !cast.full) ? PART[['sly', 'grim', 'glee'][mood % 3]][h % 3] : AGAIN[v.style === 'alien' ? 'alien' : v.style === 'halo' ? 'halo' : v.style === 'atlantis' ? 'atlantis' : ['sly', 'grim', 'glee'][mood % 3]][1]; if (v.starter) out.beaten = 'Take them, take them! This is one village. There are others, and I have keys for those too.'; return out; }
  function tyrantVoice0(v, mood, h, cast) { const key = cast && !cast.full ? ['sly', 'grim', 'glee'][mood % 3] : v.style === 'alien' ? 'alien' : v.style === 'halo' ? 'halo' : v.style === 'atlantis' ? 'atlantis' : ['sly', 'grim', 'glee'][mood % 3], V = VOICE[key], f = (t) => t.replace(/\{t\}/g, v.name || 'this place');
    if (v.starter) return { hail: 'Ah. The one from the camp. Every key in this village is on this ring, and not one of them is for you.', taunts: V.taunts.map(f), fight: f(V.fight), beaten: 'Take them, take them! And tell the Kinmaster nothing. He will hear of it anyway. He always does.' };
    return { hail: f(V.hail[(h >>> 5) % V.hail.length]), taunts: V.taunts.map(f), fight: f(V.fight), beaten: f(V.beaten) }; }
  // he speaks when he first sees you, and again now and then while you hang about
  // how each of them holds his face at rest, what it does the moment he sees you, and while he talks. bl/br: brows up or down, tl/tr: their tilt (1 a scowl, -1 worry), lid: eyes shut, jaw: mouth open
  const FACE = { sly: { bl: -0.5, br: 1.0, tl: 0.5, tr: -0.25, lid: 0.42, jaw: 0 }, grim: { bl: -0.9, br: -0.9, tl: 0.9, tr: 0.9, lid: 0.3, jaw: 0 }, glee: { bl: 0.7, br: 0.7, tl: -0.3, tr: -0.3, lid: 0.62, jaw: 0.55 } };
  const SPOT = { bl: 1.3, br: 1.3, tl: -0.2, tr: -0.2, lid: 0, jaw: 0.7 };
  function tyrantFace(b, dt) { const base = FACE[['sly', 'grim', 'glee'][(b.kin.sp.tyrMood || 0) % 3]], now = performance.now(), f = b.face || (b.face = Object.assign({}, base)); let T = base;
    if (b.spotT > 0) { b.spotT -= dt; T = SPOT; } const talking = b.speakUntil && now < b.speakUntil, k = Math.min(1, dt * (T === SPOT ? 16 : 7));
    for (const key of ['bl', 'br', 'tl', 'tr', 'lid']) f[key] += (T[key] - f[key]) * k; if (talking) { f.br += Math.sin(now / 310) * 0.02; f.bl += Math.sin(now / 420 + 1) * 0.02; }
    const jaw = talking ? Math.max(T.jaw * 0.4, 0.18 + 0.5 * Math.abs(Math.sin(now / 95)) * (0.6 + 0.4 * Math.sin(now / 530))) : T.jaw + (T === base && base.jaw ? Math.sin(now / 160) * 0.18 : 0); // the merry one is always laughing a little
    f.jaw = (f.jaw || 0) + (jaw - (f.jaw || 0)) * Math.min(1, dt * 18); b.jawOpen = f.jaw; }
  function tyrantTalk(v, player, dt) { const b = v.boss; if (!b || !b.persona) return; tyrantFace(b, dt); if (b.sleep || state(v.id).freed || Battle.active) return; const d = Math.hypot(b.x - player.x, b.z - player.z);
    // once he has had his say there is no walking away from it: step inside the reach of his voice and when he has finished speaking he comes for you. Every tyrant, the first one included
    if (b.fightAt && performance.now() > b.fightAt && d < 22 && !b.lurk) { b.fightAt = 0; b.patrol = null; b.alert = 1; b.cool = 0; const p = player; if (d > 5) { b.x = p.x + (b.x - p.x) * (4.5 / d); b.z = p.z + (b.z - p.z) * (4.5 / d); b.y = standY(b.x, b.y, b.z) ?? b.y; } b.yaw = Math.atan2(p.x - b.x, p.z - b.z); Battle.start(b, false); return; }
    if (b.scene) return sceneTick(v, b, player, dt);
    if (d > 13) { if (d > 30) b.fought = false; if (d < 42 && !b.warned && !b.fought && G.kin && G.kin.length) { b.warned = true; const best = Math.max(...G.kin.map(k => k.level || 1)); if (best + 5 < b.kin.level) UI.toast(`${KIN.name(b.kin)} is level ${b.kin.level}. Your best Kin is level ${best}. Once you step into the square there is no walking away.`, 'bad'); } return; } // get right away from him and he will have his say again before he comes for you
    if (b.fought || b.lurk || Dialogue.active() || UI.panelOpen || player.flying || player.mount) return;
    /* you have walked into his reach, and that is that. You stop. The view goes to him. He turns, looks straight at you, says his piece with his whole face, throws his head back and laughs, and then it is the fight. There is no walking off in the middle */
    if (!b.hailed) b.persona = tyrantVoice(v, b.kin.sp.tyrMood || 0, b.vh, b.cast0); /* he may have met you somewhere else since he was put here */
    const line = !b.hailed ? b.persona.hail : b.persona.taunts[(b.tauntI = ((b.tauntI || 0) + 1)) % b.persona.taunts.length];
    b.hailed = true; b.fought = true; b.patrol = null; b.spotT = 0.6; b.scene = { stage: 'talk', x: b.x, z: b.z, t: 0 }; player.frozen = true; player.vx = player.vz = 0;
    const hgt = b.model ? b.model.height : 2; b.faceY = hgt * 0.8; b.faceD = 2.2 + hgt * 0.75 + ((v.gang || []).length ? 3.2 + (v.gang.length - 1) * 1.6 : 0); /* with company the view stands further back, so you see who he has brought */ G.talkNpc = b; G.sceneHold = performance.now() + 60000; if (typeof UI !== 'undefined') UI.sfx('whistle');
    const key = ['sly', 'grim', 'glee'][(b.kin.sp.tyrMood || 0) % 3], cst = b.persona.cast, met = cst ? metCount(cst.name) : 0, others = (v.gang || []).map(g => g.persona && g.persona.cast ? g.persona.cast.name : 'the other one');
    let lines = b.tauntI ? [line] : [line, b.persona.taunts[0]]; /* the first time he has more to say */
    if (!b.tauntI && b.turn && cst && !cst.full) lines = [TURNS(key)[met > 0 ? 1 : 0]]; /* the second or third of a gang, stepping up */
    if (!b.tauntI && others.length && GANGS(key) && !b.turn) lines.push(GANGS(key)(others));
    if (!b.tauntI && cst && !cst.full && met > 0 && !b.persona.last && PLANSOF(key)) { const pl = PLANSOF(key)[(met - 1 + (b.vh >>> 7)) % PLANSOF(key).length]; lines.push(pl[0]); b.plan = pl[1]; } /* and this time he has a plan */
    Dialogue.show(b.kin.sp.names ? KIN.name(b.kin) : 'The tyrant', lines, () => { if (!b.scene) return; b.scene.stage = 'laugh'; b.scene.t = 0; UI.sfx('laugh'); say(b.x, b.y + hgt + 0.5, b.z, b.persona.laugh || 'Ha! Ha! Haaa!', 1.7, b); const el = bubbles[bubbles.length - 1].el; el.style.font = '900 19px/1.2 system-ui,sans-serif'; el.style.background = '#2a1f33'; el.style.color = '#ffd9a0'; el.style.border = '2px solid #b070ff'; }); }
  function sceneTick(v, b, player, dt) { const sc = b.scene, now = performance.now(); if (!b._an && typeof Anim !== 'undefined') b._an = Anim.fresh(b, now); sc.t += dt; b.x = sc.x; b.z = sc.z; b.yaw = Math.atan2(player.x - b.x, player.z - b.z); b.alert = 0; b.sus = 0; player.frozen = true; player.vx = player.vz = 0; G.talkNpc = b;
    if (sc.stage === 'talk') { b.speakUntil = now + 220; if (!Dialogue.active() && sc.t > 0.5) { sc.stage = 'laugh'; sc.t = 0; } /* however the box was closed, he still gets his laugh */ if (b._an) b._an.nod = Math.sin(now / 520) * 0.06; return; }
    /* the laugh: head right back, jaw wide, shoulders going */
    const u = Math.min(1, sc.t / 0.25), out = Math.max(0, (sc.t - 1.35) / 0.3); b.jawOpen = (0.75 + 0.25 * Math.abs(Math.sin(now / 70))) * (1 - out); if (b.face) { b.face.jaw = b.jawOpen; b.face.lid = 0.75; b.face.bl = -0.25; b.face.br = -0.25; }
    if (b._an) { b._an.nod = (-0.62 * u + Math.sin(now / 62) * 0.07) * (1 - out); b._an.lean = -0.12 * u * (1 - out); } b.hover = (b.model.hover || 0) + Math.abs(Math.sin(now / 62)) * 0.05 * (1 - out);
    if (sc.t > 1.7) { b.scene = null; b.hover = b.model.hover || 0; if (b._an) { b._an.nod = 0; b._an.lean = 0; } player.frozen = false; G.sceneHold = 0; b.alert = 1; b.cool = 0;
      if (b.plan) { UI.sfx('hurt'); UI.toast(b.plan, 'good'); const k = b.kin; if (k && k.hp > 1) k.hp = Math.max(1, Math.round(k.hp * 0.85)); b.plan = null; } /* the plan goes off, on him: he starts the fight a little the worse for it */
      Battle.start(b, false); } }
  /* who holds this place. A village has one of the three, a town two, a city all three. Kept once it is settled, so the same faces are there when you come back */
  function gangOf(v, lead) { const st = state(v.id); if (!lead || lead.full || v.starter || v.type !== 'land' || !(world.preset.id === 'earth' || v.R)) return lead ? [lead] : [];
    const n = v.size === 'city' ? 3 : v.size === 'town' ? 2 : 1; if (!st.gangNames) { st.gangNames = [lead.name].concat(CAST.earth.filter(c => c.name !== lead.name && metCount(c.name) <= LAST_AT).slice(0, n - 1).map(c => c.name)); remember(v, st); }
    return st.gangNames.map(nm => CAST.earth.find(c => c.name === nm)).filter(Boolean); }
  function ensureBoss(v, trainerLevel) {
    if (state(v.id).freed || v.boss) return; const st = state(v.id), h0 = U.combine(0x9001, U.strHash(v.id)), lead = castOf(v, h0);
    const roster = gangOf(v, lead).filter(c => !(st.gangOut || []).includes(c.name));
    if (roster.length <= 1 && (!roster[0] || roster[0] === lead) && !(st.gangOut || []).length) { v.boss = buildBoss(v, null, 0); v.gang = []; Wild.list.push(v.boss); return; }
    if (!roster.length) return; v.boss = buildBoss(v, roster[0], 0); v.boss.turn = (st.gangOut || []).length > 0; v.gang = roster.slice(1).map((c, i) => buildBoss(v, c, i + 1)); Wild.list.push(v.boss); }
  function buildBoss(v, force, slot) {
    const prim = v.style === 'alien' ? 'Light' : v.style === 'halo' ? 'Flame' : v.style === 'atlantis' ? 'Tide' : v.type === 'land' ? 'Stone' : v.type === 'sea' ? 'Tide' : 'Void';
    const h = U.combine(0x9001, U.strHash(v.id)); const own0 = force || castOf(v, h), three = !!(own0 && !own0.full); /* one of the three: his own body wherever he is */
    const shape = three ? 'biped' : v.style === 'alien' ? 'floater' : v.style === 'halo' ? 'quadruped' : v.style === 'atlantis' ? 'serpent' : 'biped';
    const sp = KIN.species(force ? U.combine(h, 77 + U.strHash(force.name)) : h, [prim], 1 + v.tier, { primary: prim, shape, total: 285 + v.tier * 40, neon: world.preset.id !== 'earth' });
    const tn = styleOf(v) ? STYLE_NAMES[v.style].tyrant : null;
    const cast = force || castOf(v, h), nm = v.starter ? 'Keychain' : cast ? cast.name : tn ? tn[h % tn.length] : TYRANT[h % TYRANT.length] + ' the Tyrant';
    const md = cast ? cast.mood : (h >>> 3) % 3;
    if (shape === 'biped' && v.type === 'land' && md !== 1) { const c = md === 0 ? [['#3f8a6a', '#e6dc9a', '#17392e'], ['#5a7fa0', '#e8e2b4', '#1c2f44'], ['#8a8a3a', '#f0e6a8', '#35360f']] : [['#9a7438', '#efdfae', '#3f2a12'], ['#6f8a3c', '#eee8b0', '#28340f'], ['#a05a4a', '#f2d6b8', '#40201a']], q = c[(cast ? 0 : h) % 3];
      sp.colors = { body: q[0], belly: q[1], dark: q[2], accent: '#b070ff', eye: md === 0 ? '#ffd24a' : '#c58bff' }; sp.natId = md === 0 ? 'x_tyr_liz' : 'x_tyr_toad'; KIN.nativize(sp); } // each of them is a creature of his own: the sly one a lizard up on his hind legs, the merry one a toad, the grim one the ape of rock
    else if (shape === 'biped') { const PAL = prim === 'Tide' ? [['#4d6470', '#aebfba', '#1f2c33'], ['#56707a', '#c4cfc0', '#222f36']] : prim === 'Void' ? [['#4a4358', '#a79fb0', '#1c1824'], ['#3f4a55', '#9aa6ab', '#191f25']] : [['#8a7a66', '#d8c8a4', '#3a322a'], ['#96785a', '#e0c698', '#40301f'], ['#7f7468', '#cdbfa6', '#352f2a'], ['#8f6f5e', '#dcc0a0', '#3d2c26']], c = PAL[(cast ? cast.pal : h) % PAL.length];
      sp.colors = { body: c[0], belly: c[1], dark: c[2], accent: '#b070ff', eye: '#c58bff' }; sp.natId = 'x_tyrant'; KIN.nativize(sp); } // a tyrant who walks on two legs is a shape of his own, not one of the wild Kin grown large
    else { const PL = shape === 'floater' ? ['x_tyr_moon', [['#9fb6d8', '#e8f0ff', '#2a3350', '#7df0ff'], ['#b8a8dc', '#f0eaff', '#33284f', '#ffd27a'], ['#8fcfc4', '#e6fff8', '#1f3d40', '#ff9ad8']]] : shape === 'quadruped' ? ['x_tyr_halo', [['#5a3526', '#d08a4a', '#241410', '#ff7a1e'], ['#4a3030', '#c9785a', '#1e1212', '#ffb020'], ['#3f3a36', '#b89070', '#191614', '#ff5a2a']]] : ['x_tyr_sea', [['#2f6a5c', '#d8e6b8', '#12302a', '#ffd84a'], ['#3a5f86', '#dfe8d0', '#152a40', '#5affd0'], ['#6a4a7a', '#ead8e0', '#2a1a36', '#ff8ab0']]], c = PL[1][(cast ? cast.pal : h) % PL[1].length];
      sp.colors = { body: c[0], belly: c[1], dark: c[2], accent: c[3], eye: '#c58bff' }; sp.natId = PL[0]; KIN.nativize(sp); } // and so are the Moon's, the Halo's and the one under the sea
    sp.tyrMood = cast ? cast.mood : (h >>> 3) % 3; // the sly one, the grim one or the merry one. Keychain is sly
    sp.names = [nm, nm, nm]; sp.feat.horns = true; sp.feat.spikes = true; sp.feat.crest = true; sp.size = 1.5 + v.tier * 0.08; sp.boss = true; sp.colors = Object.assign({}, sp.colors, { eye: '#c58bff' }); // the eyes of the Bound are the colour of the crystal
    const lastStand = cast && !cast.full && metCount(cast.name) >= LAST_AT; if (cast && !force) state(v.id).tyrant = cast.name; if (lastStand) { sp.size *= 1.12; sp.names = sp.names.map(() => cast.name + ', at the last'); }
    const kin = KIN.create(sp, Math.min(bossLevelFor(v) + (lastStand ? 4 : 0) + (slot || 0) * 2, world.preset.id === 'earth' ? Math.max(50, bossLevelFor(v)) : 199)); /* in a gang each is a little stronger than the one before */
    const m0 = KIN.model(sp, 2); if (sp.natId === 'x_tyr_liz' || sp.natId === 'x_tyr_toad') m0.noCrown = true; // those two wear crowns of their own
    const m1 = sp.natId === 'x_tyr_toad' ? m0 : KIN.dress(m0, { item: 'tyrant' }), suit = three && world.preset.id !== 'earth' ? world.preset.id : null, m = suit && KIN.tyrSuit ? KIN.tyrSuit(m1, suit) : m1; /* same three, dressed for where they are: a pressure rig on the Moon, road leathers on Halo */ // the toad has no neck to strap anything to: his shard is pinned on with the medals // crowned in iron, the shard of the Binding on its chest
    const bx = (v.type === 'deep' ? v.x - 0.5 : v.x + 0.5) + (slot === 1 ? 2.7 : slot === 2 ? -2.7 : 0), bz = v.z + 2.5 - (slot ? 1.5 : 0);
    // at sea the tyrant lurks under the deck and comes up when you reach the platform, however you got there
    const lurk = v.type === 'sea'; const by = lurk ? SEA - 3 : v.y;
    const e = { kin, x: bx, y: by, z: bz, yaw: Math.PI, tx: bx, tz: bz, wait: 99, speed: 0, senseR: lurk ? 0 : 5.5, alert: 0, model: m, scale: 1, hover: 0, bob: 0, mesh: R.entityMesh(KIN.meshKey(sp, 2) + ':tyrant:' + world.preset.id + ':' + v.id + (force ? ':' + force.name : ''), (mb) => KIN.buildMesh(mb, m)), skyMul: 1, isBoss: true, villageId: v.id, sleep: lurk, aquatic: lurk, lurk, patrol: { ax: bx - 3, az: bz, bx: bx + 3, bz: bz, period: lurk ? 12 : 8, phase: 0 }, skyT: 0, elite: true };
    e.persona = tyrantVoice(v, sp.tyrMood || 0, h, force); e.vh = h; e.cast0 = force || null; e.sayH = (m.height || 2.4) + 0.35;
    return e;
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
  /* how strong the one who holds a place is. On Earth it is a ladder, the way gyms are, and each rung is three or four above the last so the climb never has a wall in it: the home village 3, the two hamlets 6 and 9, the eight towns 12 up to 33, the four cities 38, 42, 46 and 50. Which rung a place gets depends on how many of its kind you have already freed. Settled the first time it is asked, so a place does not get harder behind your back */
  function bossLevelFor(v) { if (world.preset.id === 'earth' && v.type === 'land' && !v.founded) { const st = state(v.id); if (st.bossLvl) return st.bossLvl; let cities = 0, towns = 0, hams = 0; for (const o of townList()) if (!o.starter && state(o.id).freed) { if (o.size === 'city') cities++; else if (o.size === 'town') towns++; else hams++; }
      const lvl = v.starter ? 3 : v.size === 'city' ? Math.min(50, 38 + cities * 4) : v.size === 'town' ? Math.min(31, 10 + towns * 3) : Math.min(8, 5 + hams * 3); /* one ladder for the whole of Earth, each rung a step from the last: home 3, hamlets 5 and 8, towns 10 to 31, Thornhold 36, cities 38 to 50 (54 with the gang), the five holds 56 to 72, Stormspire 76, the Citadel 82 and 88 */ if (st.stamped) st.bossLvl = lvl; return lvl; }
    if (v.R && v.type === 'land' && !v.founded && (world.preset.id === 'moon' || world.preset.id === 'halo')) { const st = state(v.id); if (st.bossLvl) return st.bossLvl; let cities = 0, towns = 0, hams = 0; for (const o of townList()) if (state(o.id).freed) { if (o.size === 'city') cities++; else if (o.size === 'town') towns++; else hams++; } /* the same climb as Earth's, starting where Earth's leaves off: the Moon from 90, Halo from 126 */
      const b0 = world.preset.id === 'moon' ? 90 : 126, lvl = v.size === 'city' ? Math.min(b0 + 33, b0 + 24 + cities * 3) : v.size === 'town' ? Math.min(b0 + 19, b0 + 5 + towns * 2) : Math.min(b0 + 2, b0 + hams * 2); /* Moon: hamlets 90, towns 96 to 110, cities 114 to 123. Halo: hamlets 126, towns 132 to 146, cities 150 to 159. Each gang member adds 2 */ if (st.stamped) st.bossLvl = lvl; return lvl; }
    return bossLevelFor0(v); }
  function bossLevelFor0(v) { return Math.max(3, (G.trainerLevel || 1) - 1 + (v.size === 'city' ? 6 : v.size === 'town' ? 2 : 0) + v.tier * 2, (v.zoneBase || 0) + v.tier * 3); }
  /* a beaten tyrant is not dead and not caught: he legs it. He turns, bolts away from you, and is gone in dust past the wall. The Moon one lifts off, the sea one dives */
  const runners = [];
  /* one of them is beaten. He says his piece and goes. If he brought company the next one steps up, and the place is only free when the last is out */
  function bossBeaten(b) { const v = villages.get(b.villageId); if (!v) return; const st = state(v.id), cst = b.persona && b.persona.cast, nm = b.kin ? KIN.name(b.kin) : 'The tyrant';
    if (b.persona && b.persona.beaten) { say(b.x, b.y + (b.sayH || 3.2), b.z, b.persona.beaten, 6, b); const el = bubbles[bubbles.length - 1].el; el.style.font = '700 15px/1.3 system-ui,sans-serif'; el.style.maxWidth = '78vw'; el.style.background = '#2a1f33'; el.style.color = '#f6eaff'; el.style.border = '2px solid #b070ff'; UI.toast(`${nm}: "${b.persona.beaten}"`); }
    if (cst) { G.stats.tyrantMet = G.stats.tyrantMet || {}; G.stats.tyrantMet[cst.name + WK()] = (G.stats.tyrantMet[cst.name + WK()] || 0) + 1; st.gangOut = (st.gangOut || []).concat([cst.name]); }
    const next = (v.gang || []).shift(); onBossGone(v.id, 2.4);
    if (next) { remember(v, st); next.turn = true; next.persona = tyrantVoice(v, next.kin.sp.tyrMood || 0, next.vh, next.cast0); v.boss = next; Wild.list.push(next); next.fought = false; next.hailed = false; applyPart(v, st); if (G.meshPass) G.meshPass(99); UI.toast(`${nm} is out. ${cst && PARTSAY[cst.name] ? PARTSAY[cst.name] + ' ' : ''}${KIN.name(next.kin)} is still standing.`, 'good'); return; }
    freed(v.id, nm); UI.toast(`${v.name} is free.`, 'good'); }
  function onBossGone(id, hold) { const v = villages.get(id); if (!v) return; const b = v.boss; v.boss = null; if (!b || !b.model) return; b.runHold = hold || 0;
    const p = G.player; let dx = b.x - p.x, dz = b.z - p.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
    const shape = b.kin && b.kin.sp ? b.kin.sp.shape : ''; b.sleep = false; b.sus = 0;
    runners.push({ e: b, dx, dz, t: 0, up: shape === 'floater' ? 1 : shape === 'serpent' ? -1 : 0, y0: Math.floor(b.y), s0: b.scale || 1, wob: Math.random() * 6 }); }
  function runTick(dt) { for (let i = runners.length - 1; i >= 0; i--) { const r = runners[i], e = r.e; r.t += dt; if (e.runHold > 0) { e.runHold -= dt; r.t = 0; e.yaw = Math.atan2(G.player.x - e.x, G.player.z - e.z); continue; } /* he stands there and says it to your face first */
      const go = r.t < 0.45 ? 0 : Math.min(1, (r.t - 0.45) * 2.2), sp = (r.up ? 4.5 : 7.5) * go, sw = Math.sin(r.t * 5 + r.wob) * 0.35 * go; /* a beat of standing there first, then off, weaving a bit */
      /* he keeps to open ground: every fifth of a second he looks a few steps ahead and takes the clear way nearest the one he is on, never back at you. Houses, walls, carts, you and your Kin all get gone round */
      if (!r.up) { r.look = (r.look || 0) - dt; if (r.look <= 0) { r.look = 0.18; const p = G.player, h0 = Math.atan2(r.dx, r.dz), fy = Math.floor(e.y); let best = null, bs = 1e9;
          for (const o of [0, 0.45, -0.45, 0.9, -0.9, 1.4, -1.4, 2.0, -2.0, 2.6, -2.6]) { const hx = Math.sin(h0 + o), hz = Math.cos(h0 + o); let ok = true;
            for (const st of [1.1, 2.3, 3.6]) { const cx = e.x + hx * st, cz = e.z + hz * st, g = world.groundY(Math.floor(cx), Math.floor(cz), fy + 2) + 1; if (g > fy + 1 || g > r.y0 + 1 || g < fy - 3) { ok = false; break; } /* never up onto a roof: thatch comes down low enough to step on */ if (Math.hypot(cx - p.x, cz - p.z) < 2.6) { ok = false; break; } }
            if (!ok) continue; const ax = e.x - p.x, az = e.z - p.z, al = Math.hypot(ax, az) || 1, toward = -(hx * ax + hz * az) / al; const sc = Math.abs(o) + (toward > 0.2 && al < 9 ? 4 : 0); if (sc < bs) { bs = sc; best = [hx, hz]; } }
          if (best) { r.tx = best[0]; r.tz = best[1]; r.stuck = 0; } else { r.stuck = (r.stuck || 0) + 1; if (r.stuck > 3 && r.t < 3.2) r.t = 3.2; } }
        if (r.tx !== undefined) { const k = Math.min(1, dt * 9); r.dx += (r.tx - r.dx) * k; r.dz += (r.tz - r.dz) * k; const l = Math.hypot(r.dx, r.dz) || 1; r.dx /= l; r.dz /= l; } }
      const sw2 = r.up ? sw : sw * 0.25, vx = r.dx + -r.dz * sw2, vz = r.dz + r.dx * sw2; e.x += vx * sp * (r.stuck ? 0.2 : 1) * dt; e.z += vz * sp * (r.stuck ? 0.2 : 1) * dt; if (go > 0) e.yaw = Math.atan2(vx, vz);
      if (r.up) e.y += r.up * (r.up > 0 ? 3.2 : 1.6) * go * dt; else { const gy = world.groundY(Math.floor(e.x), Math.floor(e.z), Math.floor(e.y) + 3) + 1; if (gy <= r.y0 + 1.01) e.y += (gy - e.y) * Math.min(1, dt * 10); }
      const out = Math.max(0, (r.t - (r.up ? 2.3 : 3.2)) / 0.6); e.scale = r.s0 * (1 - out * out);
      if (!r.up && go > 0 && (G.frame & 3) === 0 && typeof Hazards !== 'undefined') Hazards.puff(e.x, e.y + 0.2, e.z, 1, [0.72, 0.66, 0.52]);
      if (out >= 1) { if (typeof Hazards !== 'undefined') Hazards.puff(e.x, e.y + 1, e.z, 12, r.up > 0 ? [0.8, 0.9, 1.0] : [0.72, 0.66, 0.52]); runners.splice(i, 1); } } }
  /* the little film when a place is freed. He says his last and runs; then the view lifts over the roofs, the light comes up gold, the gates swing open and the people come out of their houses. It comes down again beside you in time to watch the elder walk up. About ten seconds, and you cannot be hurt while it plays */
  let film = null, filmEl = null;
  function filmEnd() { if (!film) return; const p = G.player; p.frozen = false; G.cutCam = null; G.filmMood = null; document.body.classList.remove('cine-on'); if (film.third != null) G.thirdPerson = film.third; if (filmEl) { filmEl.remove(); filmEl = null; } if (film.ws && !walkState) walkState = film.ws; film = null; }
  function filmTick(dt) { const f = film, v = f.v, p = G.player; f.t += dt; if (f.t < 0) return; const u = f.t;
    if (!f.on) { f.on = true; f.third = G.thirdPerson; G.thirdPerson = true; p.vx = p.vz = 0; UI.sfx('quest'); G.filmMood = 'free'; document.body.classList.add('cine-on'); try { setGates(v, state(v.id), false); } catch (e) { /* no gates here */ } try { setDoors(v, false); } catch (e) { /* no doors here */ } if (G.meshPass) G.meshPass(99);
      filmEl = document.createElement('div'); filmEl.style.cssText = 'position:fixed;inset:0;z-index:45;pointer-events:none'; filmEl.innerHTML = '<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 38%,rgba(255,236,170,.95),rgba(255,200,90,.55) 45%,rgba(255,170,60,0) 80%);opacity:0"></div><div style="position:absolute;left:0;right:0;top:0;height:11vh;background:#000"></div><div style="position:absolute;left:0;right:0;bottom:0;height:11vh;background:#000"></div><div style="position:absolute;left:0;right:0;bottom:13vh;text-align:center;font:800 22px/1.2 system-ui,sans-serif;color:#fff3c8;text-shadow:0 2px 8px #000;opacity:0"></div>'; document.body.appendChild(filmEl); filmEl.children[3].textContent = v.name + ' is free'; }
    p.frozen = true; p.vx = p.vz = 0; G.repelUntil = Math.max(G.repelUntil || 0, performance.now() + 4000);
    if (filmEl) { filmEl.children[0].style.opacity = String(u < 0.5 ? u * 1.3 : Math.max(0, 0.65 - (u - 0.5) * 0.24)); filmEl.children[3].style.opacity = String(u < 0.8 ? 0 : u < 4.6 ? Math.min(1, (u - 0.8) * 2) : Math.max(0, 1 - (u - 4.6) * 2)); }
    const look = (cx, cy, cz, lx, ly, lz) => { G.cutCam = { x: cx, y: cy, z: cz, yaw: Math.atan2(-(lx - cx), -(lz - cz)), pitch: Math.atan2(ly - cy, Math.hypot(lx - cx, lz - cz)) }; };
    if (u < 5) { if (!Dialogue.active()) { G.talkNpc = null; G.sceneHold = 0; } const k = U.smooth(Math.min(1, u / 5)), tight = v.type !== 'land' ? 0.55 : 1, a = f.a0 + 0.5 - k * 0.9, r = (15 + k * 9) * tight, h = (7 + k * 9) * tight; /* under a dome or on a deck the view keeps closer in */ look(v.x + Math.sin(a) * r, v.y + h, v.z + Math.cos(a) * r, v.x, v.y + 1.5, v.z); /* up and round over the square */
      return; }
    if (f.ws && !walkState && !f.sent) { f.sent = true; walkState = f.ws; } /* the elder sets out as the view comes down, so you watch the whole of his walk */
    const e = v.elder && f.ws ? v.elder : null; if (!e) { if (u > 6.5) filmEnd(); return; }
    const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz) || 1, sx = -dz / d, sz = dx / d; p.yaw = Math.atan2(-dx, -dz);
    /* down among the houses for the second half: a spot off to one side that can see both of you, him walking up and you waiting. It is chosen once, from a ring of places round the two of you, and the first with a clear line to both heads wins. If the street is too tight for any of them the view stays up over the roofs */
    if (!f.spot) { const see = (ax, ay, az, bx, by, bz) => { const n = Math.ceil(Math.hypot(bx - ax, by - ay, bz - az) * 2); for (let i = 1; i < n; i++) { const k = i / n, b = world.getBlock(Math.floor(ax + (bx - ax) * k), Math.floor(ay + (by - ay) * k), Math.floor(az + (bz - az) * k)); if (b !== B.AIR && isSolid(b)) return false; } return true; };
      const mx = p.x + dx * 0.45, mz = p.z + dz * 0.45; f.spot = 'high';
      let stalls = []; try { stalls = (v.R ? layout(v).stalls : null) || []; } catch (er) { stalls = []; }
      for (const [side, back, up] of [[5.5, -2.5, 3.4], [-5.5, -2.5, 3.4], [4, -4.5, 3.8], [-4, -4.5, 3.8], [7, 0, 4], [-7, 0, 4], [3, -6, 4.8], [-3, -6, 4.8], [0, -6.5, 5.5]]) { const cx = p.x + sx * side + dx / d * back, cz = p.z + sz * side + dz / d * back, cy = p.y + up; if (world.getBlock(Math.floor(cx), Math.floor(cy), Math.floor(cz)) !== B.AIR) continue; if (stalls.some(t => Math.hypot(t.x - cx, t.z - cz) < 3.5)) continue; /* not sat on a market awning */ if (see(cx, cy, cz, p.x, p.y + 1.6, p.z) && see(cx, cy, cz, e.x, e.y + 1.6, e.z) && see(cx, cy, cz, mx, p.y + 1.4, mz)) { f.spot = [cx, cy, cz]; break; } } }
    if (f.spot === 'high') { const a = f.a0 - 0.4 + (u - 5) * 0.05; look(v.x + Math.sin(a) * 20, v.y + 13, v.z + Math.cos(a) * 20, p.x + dx * 0.5, p.y + 1, p.z + dz * 0.5); }
    else look(f.spot[0], f.spot[1], f.spot[2], p.x + dx * 0.45, p.y + 1.3, p.z + dz * 0.45);
    if (u > 12.5 || d < 2.6 || Dialogue.active() || !walkState) filmEnd(); }
  function freed(id, tyr0) {
    const v = villages.get(id); if (!v) return;
    const st = state(id); if (st.freed) return;
    st.freed = true; st.income = incomeFor(v, st); st.freedDay = curNight(); st.report = null; clearLieutenants(v); remember(v, st);
    for (const n of v.npcs) n.hidden = false;
    G.stats.villagesFreed = (G.stats.villagesFreed || 0) + 1; { const fw = (G.stats.freedW = G.stats.freedW || {}), wk = world.preset.id, sz = v.size || 'village'; fw[wk] = fw[wk] || {}; fw[wk][sz] = (fw[wk][sz] || 0) + 1; } /* how many places of each size are free on each world, for the Moon's and Halo's own chapters */
    if (v.starter) G.stats.villageFreed = true;
    const tyrant = tyr0 || (v.boss ? (v.boss.title || v.boss.name || (v.boss.kin ? KIN.name(v.boss.kin) : null)) : null);
    if (v.boss && v.boss.persona && v.boss.persona.cast) { const nm0 = v.boss.persona.cast.name; G.stats.tyrantMet = G.stats.tyrantMet || {}; G.stats.tyrantMet[nm0 + WK()] = (G.stats.tyrantMet[nm0 + WK()] || 0) + 1; }
    if (v.boss && v.boss.persona) { say(v.boss.x, v.boss.y + 3.2, v.boss.z, v.boss.persona.beaten, 7); const el = bubbles[bubbles.length - 1].el; el.style.font = '700 14px/1.3 system-ui,sans-serif'; el.style.maxWidth = '74vw'; el.style.background = '#2a1f33'; el.style.color = '#f6eaff'; el.style.border = '2px solid #b070ff'; if (typeof UI !== 'undefined' && UI.toast) UI.toast(`${tyrant}: "${v.boss.persona.beaten}"`); }
    const p0 = G.player, canFilm = !p0.flying && !p0.mount && Math.hypot(p0.x - v.x, p0.z - v.z) < 45; /* every place a tyrant held gets its film: Earth, the Moon, the Halo, the stilt villages and the ones under the sea */
    if (v.elder) { v.elder.wander = false; const ws = { v, tyrant, stage: (v.starter && !G.stats.elderDone) ? 'approach' : 'approach-headman' }; if (canFilm) film = { v, t: -2.3, ws, a0: Math.atan2(p0.x - v.x, p0.z - v.z) }; else walkState = ws; }
    else if (canFilm) film = { v, t: -2.3, ws: null, a0: Math.atan2(p0.x - v.x, p0.z - v.z) };
    if (v.elder) { /* the thanks are his to give */ }
    else { // no headman here: whoever is nearest says thank you, straight away
      const n = v.npcs.filter(n => !n.hidden).sort((a, b) => Math.hypot(a.x - G.player.x, a.z - G.player.z) - Math.hypot(b.x - G.player.x, b.z - G.player.z))[0];
      setTimeout(() => Dialogue.show(n ? n.name : v.name, [`You did it! ${tyrant ? tyrant + ' had' : 'That tyrant had'} us under his boot for so long. ${v.name} is free, and the doors are open again. Thank you.`]), 900);
    }
    G.lastVillage = { id: v.id, x: v.x, y: v.y, z: v.z, name: v.name, world: world.preset.id };
    G.respawnPoint = { x: v.x + 0.5, y: v.y, z: v.z + 4.5 };
    if (G.fisherTarget === id) { G.fisherTarget = null; G.stats.fisherDone = (G.stats.fisherDone || 0) + 1; }
    makeTraveller(v);
  }
  // the tyrant takes the village back: doors shut, no pay, the boss waits in the square again
  function retaken(v, st) {
    st.freed = false; st.bank = 0; st.lieuDown = {}; st.gangOut = []; v.partGates = false; st.retakenOnce = true; st.lastVisit = null; v.doorsShut = null; v.gatesClosed = null; st.report = { night: curNight(), text: 'Nobody had seen you in a long while. They walked back in through the open gate.' };
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
      if (!best) { const dx = g.post.x - g.x, dz = g.post.z - g.z, d = Math.hypot(dx, dz); if (d > 0.4) { const nx = g.x + dx / d * Math.min(d, 2.5 * dt), nz = g.z + dz / d * Math.min(d, 2.5 * dt); const gy = standY(nx, g.y, nz); if (gy != null) { g.x = nx; g.z = nz; g.y = gy; } g.yaw = Math.atan2(dx, dz); g.moving = gy != null; } else g.moving = false; unstick(g); continue; }
      const dx = best.x - g.x, dz = best.z - g.z, d = Math.hypot(dx, dz);
      if (d > 1.4) { const sp = 3.2 * dt; const nx = g.x + dx / d * Math.min(d, sp), nz = g.z + dz / d * Math.min(d, sp); const gy = standY(nx, g.y, nz); if (gy != null) { g.x = nx; g.z = nz; g.y += (gy - g.y) * Math.min(1, dt * 8); } g.yaw = Math.atan2(dx, dz); g.moving = true; const ch = Math.max(Math.abs(g.x - cx), Math.abs(g.z - cz)); g.leap = Math.abs(ch - wr) < 1.2 ? 1.1 : 0; continue; }
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
    if (v.type === 'land' && !v.founded) { const cols = ringCols(v, st).filter(c => !c[2] && c[3] !== 'post'); for (let i = 0; i < holes && st.holeCols.length < 12; i++) { const c = cols[Math.floor(U.hash3(night, 20 + i, U.strHash(v.id), world.seed) * cols.length)]; if (!st.holeCols.some(h => h[0] === c[0] && h[1] === c[1])) st.holeCols.push([c[0], c[1]]); } if (villages.get(v.id) === v && state(v.id).stamped && (active === v || dist2d(v.x, v.z, G.player.x, G.player.z) < 120)) stampWall(v, st); }
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
      if (!st.income) st.report = { night, text: 'A quiet night.' }; else if (--st.upkeepIn <= 0) {
        st.upkeepIn = 2 + Math.floor(Math.random() * 3);
        const prot = Math.min(4, (st.wall || 0) + Math.min(2, (st.guards || []).length)); // stone wall 1, iron wall 2, each guard 1 (two count)
        const cut = prot >= 4 ? 0 : Math.max(1, Math.round(st.income * (0.45 + Math.random() * 0.45) * (1 - prot / 4)));
        const what = ['Something tried the east gate in the night', 'A pack of wild Kin went at the north wall', 'Raiders hit the stockade before dawn', 'A storm and a stray Kin brought down a stretch of fence', 'Bandits tested the walls and ran'][Math.floor(Math.random() * 5)];
        st.bank = Math.max(0, st.bank - cut); st.upkeepTotal = (st.upkeepTotal || 0) + cut;
        st.report = { night, text: cut ? `${what}. The walls held; the repairs cost ◆ ${cut}, taken from the town's share.${prot ? ' Better walls and more guards would have saved some of that.' : ' Stone walls and a guard or two would cut this.'}` : `${what}. Iron walls and two guards: not a scratch. No repairs.` };
        out.lines.push(cut ? `${v.name}: ${what.toLowerCase()}. Repairs ◆ ${cut}.` : `${v.name}: ${what.toLowerCase()}. No damage.`);
      } else st.report = { night, text: 'A quiet night.' };
      for (const n of v.npcs) if (n.role !== 'voodoo') n.hidden = false;
      /* nobody comes back while you keep an eye on a place. Leave it AWAY days and they do, and it is all to do again. Three days before, word reaches you */
      if (!v.founded && !v.atlantis && world.preset.id === (st.meta && st.meta.world || world.preset.id)) { if (st.lastVisit == null) st.lastVisit = G.dayCount || 0; const gone = (G.dayCount || 0) - st.lastVisit;
        if (gone >= AWAY) { retaken(v, st); out.lines.push(`${v.name} has been retaken. You were away ${gone} days.`); continue; }
        if (gone >= AWAY - 3 && !st.awayWarned) { st.awayWarned = 1; out.lines.push(`Word from ${v.name}: strangers on the road, asking after you. Show your face there within ${AWAY - gone} days.`); } }
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
    pay(next.cost); clearWall(v, st); st.wall++; st.holeCols = []; stampWall(v, st); // the ring comes down and goes up again in the new material, battlements and all
    return null;
  }
  function designerWall(v, n) { const st = state(v.id); if (v.type !== 'land' || v.founded || !wallSet(v)[n]) return false; clearWall(v, st); st.wall = n; st.holeCols = []; stampWall(v, st); return true; } // for looking at a wall in each of its materials without paying for it: the tests use it
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
  // ---- town life: where people go, and how they get there ----
  // Every town has places: the square, the well, each shop's door, each home's door, the ends of the streets by the gates. Somebody with nothing to keep
  // picks a place that suits the hour, finds the way to it along the streets, walks there, stays a while, and picks another. Two who end up at the same
  // place talk. Children play instead. At dusk people drift to the square and the taverns, at night they go home, and the streets are empty till morning.
  const LIFE = new Map(); // town id -> { spots, grid of where you can walk, the clock }
  const lifeBuilt = (v) => !!(v.R && v.type === 'land' && !v.founded); // a planned town, with streets and a layout
  const lifeTown = (v) => !!(v && (lifeBuilt(v) || v.atlantis || (v.npcs && v.npcs.length > 2 && v.type !== 'sea'))); // everywhere people live, they have somewhere to go: towns, cities, Atlantis, and the plain villages of every world
  function lifeOf(v) {
    let L = LIFE.get(v.id); if (L) return L;
    const built = lifeBuilt(v), half = (v.atlantis ? v.RH : built ? v.R : 16) + 6, W = half * 2 + 1;
    L = { W, ox: v.x - half, oz: v.z - half, grid: new Int8Array(W * W).fill(-1), g: new Float32Array(W * W), from: new Int32Array(W * W), mark: new Int32Array(W * W), run: 0, clock: 0, fresh: 0, talk: 0, hail: 0, queue: 0, spots: null };
    const streets = built ? layout(v).streets : null, R = v.R;
    L.cost = !built ? () => 1 : (x, z) => { const dx = x - v.x, dz = z - v.z, m = Math.max(Math.abs(dx), Math.abs(dz)); if (m <= 6 || (m >= R - 4 && m <= R - 2)) return 1; for (const s0 of streets) if (Math.abs(dx - s0) <= 1 || Math.abs(dz - s0) <= 1) return 1; return 3; }; // people keep to the streets unless the short way is much shorter
    L.spots = lifeSpots(v); LIFE.set(v.id, L); return L;
  }
  function lifeSpots(v) {
    const S = [], add = (kind, x, z, o) => { if (world.getBlock(Math.floor(x), v.y, Math.floor(z)) === undefined) { S.push(Object.assign({ kind, x: Math.floor(x) + 0.5, z: Math.floor(z) + 0.5, by: null }, o || {})); return; } /* that part of the town is not loaded yet: take the place on trust */ for (const [ax, az] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [2, 0], [0, 2], [-2, 0], [0, -2]]) { const px = Math.floor(x) + ax + 0.5, pz = Math.floor(z) + az + 0.5; if (roomAt(px, v.y, pz) == null) continue; S.push(Object.assign({ kind, x: px, z: pz, by: null }, o || {})); return; } }; // somewhere near that you can actually stand
    if (v.atlantis) { const A = atlLayout(), P = (q, d) => [v.x + q.x - Math.cos(q.a) * d, v.z + q.z - Math.sin(q.a) * d], C = (q) => [v.x + q.x + 0.5, v.z + q.z + 0.5];
      for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283 + 0.22; add('square', v.x + Math.cos(a) * 12.5, v.z + Math.sin(a) * 12.5, { face: [v.x + 0.5, v.z + 0.5] }); } // round the pool, watching the falls
      A.stalls.forEach(t => add('shop', ...P(t, 1.7), { face: C(t) })); A.halls.forEach(h => add('shop', ...P(h, 6.8), { face: C(h), eve: h.kind === 'juice' || h.kind === 'bakery' }));
      A.civic.forEach(h => add('shop', ...P(h, h.R + 1.8), { face: C(h) })); A.courts.forEach(c => { add('well', ...P(c, 3.4), { face: C(c) }); add('well', v.x + c.x + Math.sin(c.a) * 3.6, v.z + c.z - Math.cos(c.a) * 3.6, { face: C(c) }); });
      A.bridges.forEach(b => { if (!b.wide) add('gate', v.x + Math.cos(b.a) * 34.4, v.z + Math.sin(b.a) * 34.4, { face: [v.x + Math.cos(b.a + 0.2) * 34.4, v.z + Math.sin(b.a + 0.2) * 34.4] }); }); // stopped on a footbridge, looking along the canal
      A.pods.forEach((q, i) => add('home', ...P(q, 5.6), { face: C(q), i }));
    } else if (!lifeBuilt(v)) { // a plain village: round the middle of it, in front of whoever keeps a shop, at their own doors, and out at the edge looking away
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + 0.3; add('square', v.x + Math.cos(a) * 3.4, v.z + Math.sin(a) * 3.4, { face: [v.x + 0.5, v.z + 0.5] }); }
      let hi = 0; for (const n of v.npcs) { const dx = n.x - v.x, dz = n.z - v.z, d = Math.hypot(dx, dz) || 1; if (n.role === 'keeper' || n.role === 'voodoo') { for (const o of [-0.9, 0.9]) add('shop', n.x - dx / d * 2.2 - dz / d * o, n.z - dz / d * 2.2 + dx / d * o, { face: [n.x, n.z], eve: n.shop === 'juice' || n.shop === 'games' }); } else if (n.role === 'villager') add('home', n.x + dx / d * 2.5, n.z + dz / d * 2.5, { face: [n.x + dx / d * 6, n.z + dz / d * 6], i: hi++ }); }
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + 0.9, rr = 11 + (k % 2) * 3; add('gate', v.x + Math.cos(a) * rr, v.z + Math.sin(a) * rr, { face: [v.x + Math.cos(a) * 30, v.z + Math.sin(a) * 30] }); }
    } else { const L = layout(v), R = v.R, city = v.size === 'city';
      for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283 + 0.3; add('square', v.x + Math.cos(a) * (city ? 5 : 4.2), v.z + Math.sin(a) * (city ? 5 : 4.2), { face: [v.x + 0.5, v.z + 0.5] }); }
      if (city) for (let k = 0; k < 4; k++) add('well', v.x + [4, -4, 0, 0][k], v.z + [0, 0, 4, -4][k], { face: [v.x + 0.5, v.z + 0.5] }); // the fountain
      else for (const [a, b] of [[-2, 4], [-4, 2], [-6, 4], [-4, 6]]) add('well', v.x + a, v.z + b, { face: [v.x - 3.5, v.z + 4.5] });
      for (const sh of L.shops) { if (sh.castle) continue; add('shop', sh.x + sh.dirX * 5, sh.z + sh.dirZ * 5, { face: [sh.x + 0.5, sh.z + 0.5], eve: sh.kind === 'juice' || sh.kind === 'inn' || sh.kind === 'restaurant' || sh.kind === 'games' }); if (sh.kind !== 'station') add('shop', sh.x + sh.dirX * 5 - sh.dirZ * 2, sh.z + sh.dirZ * 5 + sh.dirX * 2, { face: [sh.x + 0.5, sh.z + 0.5], eve: sh.kind === 'juice' || sh.kind === 'inn' || sh.kind === 'restaurant' || sh.kind === 'games' }); }
      L.homes.forEach((l, i) => add('home', l.x + l.dirX * 5, l.z + l.dirZ * 5, { face: [l.x + 0.5, l.z + 0.5], i }));
      for (const s0 of L.streets) for (const sg of [-1, 1]) { add('gate', v.x + s0, v.z + sg * (R - 7), { face: [v.x + s0 + 0.5, v.z + sg * R] }); add('gate', v.x + sg * (R - 7), v.z + s0, { face: [v.x + sg * R, v.z + s0 + 0.5] }); }
      if (city) for (let d = 10; d < R - 10; d += 4) for (const sg of [-1, 1]) add('shop', v.x - d, v.z + sg, { face: [v.x - d + 0.5, v.z + sg * 2 + 0.5] }); // the market stalls down the west road
      for (const t of (L.stalls || [])) for (const o of [0, 1]) add('shop', t.x + t.fx * 2 + Math.abs(t.fz) * o, t.z + t.fz * 2 + Math.abs(t.fx) * o, { face: [t.x + 0.5, t.z + 0.5] }); // and the ones on the square
    }
    return S;
  }
  // the way from one square to another: A* over the squares you can stand on, eight ways, never cutting a corner. Squares are looked at once and remembered
  function lifePath(L, v, x0, z0, x1, z1) {
    const W = L.W, ox = L.ox, oz = L.oz, G = L.grid;
    const ok = (x, z) => { if (x < ox || z < oz || x >= ox + W || z >= oz + W) return 0; const i = (x - ox) * W + (z - oz); let w = G[i]; if (w < 0) w = G[i] = roomAt(x + 0.5, v.y, z + 0.5) != null ? L.cost(x, z) : 0; return w; };
    const sx = Math.floor(x0), sz = Math.floor(z0), tx = Math.floor(x1), tz = Math.floor(z1); if (!ok(tx, tz)) return null; if (sx === tx && sz === tz) return [];
    if (sx < ox || sz < oz || sx >= ox + W || sz >= oz + W) return null;
    const run = ++L.run, g = L.g, from = L.from, mark = L.mark, hk = [], hv = [], s = (sx - ox) * W + (sz - oz), t = (tx - ox) * W + (tz - oz);
    const push = (k, val) => { let i = hk.length; hk.push(k); hv.push(val); while (i > 0) { const p = (i - 1) >> 1; if (hk[p] <= k) break; hk[i] = hk[p]; hv[i] = hv[p]; i = p; } hk[i] = k; hv[i] = val; };
    const pop = () => { const top = hv[0], k = hk.pop(), val = hv.pop(), n = hk.length; if (n) { let i = 0; for (;;) { let c = i * 2 + 1; if (c >= n) break; if (c + 1 < n && hk[c + 1] < hk[c]) c++; if (hk[c] >= k) break; hk[i] = hk[c]; hv[i] = hv[c]; i = c; } hk[i] = k; hv[i] = val; } return top; };
    const est = (i) => { const dx = Math.abs(Math.floor(i / W) + ox - tx), dz = Math.abs(i % W + oz - tz); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
    g[s] = 0; mark[s] = run; from[s] = -1; push(est(s), s); let left = 9000;
    while (hk.length && left-- > 0) { const cur = pop(); if (cur === t) break; if (mark[cur] === -run) continue; mark[cur] = -run; const cx = Math.floor(cur / W) + ox, cz = cur % W + oz, gc = g[cur];
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { if (!a && !b) continue; const nx = cx + a, nz = cz + b, w = ok(nx, nz); if (!w) continue; if (a && b && (!ok(cx + a, cz) || !ok(cx, cz + b))) continue;
        const ni = (nx - ox) * W + (nz - oz); if (mark[ni] === -run) continue; const ng = gc + w * (a && b ? 1.414 : 1); if (mark[ni] === run && g[ni] <= ng) continue; g[ni] = ng; mark[ni] = run; from[ni] = cur; push(ng + est(ni), ni); } }
    if (mark[t] !== run && mark[t] !== -run) return null;
    const out = []; for (let i = t, n = 0; i !== s && i >= 0 && n < 600; i = from[i], n++) out.push([Math.floor(i / W) + ox + 0.5, i % W + oz + 0.5]); out.reverse();
    const thin = []; for (let i = 0; i < out.length; i++) { const a = thin[thin.length - 1], b = out[i], c = out[i + 1]; if (a && c && Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) < 1e-6 && thin.length > 0 && (b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1]) > 0) continue; thin.push(b); } // a straight run is one leg
    return thin;
  }
  // what people say in passing. Short, and never the same pair twice running
  const SAY_HAIL = { dawn: ['Morning.', 'You are up early.', 'Morning. Mind the cart.'], day: ['Afternoon.', 'You again.', 'Nice Kin.', 'Mind how you go.', 'Lost? The square is that way.', 'You are the one who beat him. Good.'], dusk: ['Evening.', 'Gates shut at dark.', 'Long day?', 'Evening. The tavern is open.'] };
  const SAY_CHAT = [['Bread was late again.', 'It always is.'], ['Seen the champion play?', 'Lost ten shards finding out.'], ['Rain by night.', 'My knees say the same.'], ['Was it on time today?', 'It was not.'], ['That is the one who beat the tyrant.', 'Looks shorter up close.'], ['Your boy was on my roof.', 'He says it was your roof first.'], ['Prices at the trader.', 'Do not start.'], ['Any news off the road?', 'Mud. Mostly mud.'], ['I heard a Kin talk once.', 'You heard the tavern.'], ['Wall wants mending.', 'It has wanted mending since my father.']];
  const SAY_ATL = [['Tide is late.', 'The clock is late. The tide is the tide.'], ['The canal is cold today.', 'It is cold every day.'], ['A land-walker. In the market.', 'Do not stare.'], ['Six foals this spring.', 'I counted seven.'], ['Oan took forty off my husband.', 'Oan takes forty off everybody.'], ['Is it night up there?', 'Who would know.'], ['The kelp wants thinning.', 'Tell a gardener, not me.'], ['Skerry looked at me.', 'She looks at everyone. She is deciding.']];
  const SAY_WATCH = ['All quiet.', 'Gates are shut. Mind yourself.', 'You should be abed.', 'Nothing stirring. I like it that way.'];
  const SAY_KID = ['Tag!', 'Not it!', 'You are the tyrant.', 'I am always the tyrant.', 'Race you to the well.', 'No fair!', 'Again!', 'Wait for me!'], SAY_KID_ATL = ['Tag!', 'Not it!', 'You be the sea.', 'I am Skerry!', 'Race you to the falls.', 'No fair!', 'Again!', 'Wait for me!'];
  function lifeSay(L, n, text, secs) { if (!text || bubbles.filter(b => b.soft).length >= 3) return; const p = G.player; if (Math.hypot(p.x - n.x, p.z - n.z) > 16) return; say(n.x, n.y + 2.05 * (n.scale || 1), n.z, text, secs || 2.6, n); }
  const lifeTurn = (n, tx, tz, dt) => { const want = Math.atan2(tx - n.x, tz - n.z); let d = want - n.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); n.yaw += d * Math.min(1, dt * 7); };
  function lifePick(n, v, L, night) {
    const A = n.act || {}, S = L.spots, kid = !!n.child; if (A.spot && A.spot.by === n) A.spot.by = null;
    if (!n.homeSpot) { const hs = S.filter(s => s.kind === 'home'); n.homeSpot = hs.length ? hs[(n.id * 7 + 3) % hs.length] : null; n.pace = kid ? 2.5 : 1.15 + ((n.id * 37) % 10) * 0.045; }
    const t = world.time || 0, dusk = t > 0.7 && !night, r = Math.random(); let spot = null;
    if (n.watch) { const gs = S.filter(s => s.kind === 'gate'); if (gs.length) { n.beat = ((n.beat == null ? n.id * 3 : n.beat) + 1) % gs.length; spot = gs[n.beat]; } }
    else if (night && n.homeSpot) spot = n.homeSpot;
    else if (!kid && r < (dusk ? 0.34 : 0.24)) { let best = null, bd = 1e9; for (const m of v.npcs) { if (m === n || m.hidden || m.child || m.role !== 'villager' || m.wander === false || !m.act || m.act.kind !== 'stay' || m.act.mate || m.act.until - L.clock < 5) continue; const d = Math.hypot(m.x - n.x, m.z - n.z) * (0.6 + Math.random() * 0.8); if (d > 3 && d < bd) { bd = d; best = m; } }
      if (best) { const a = Math.atan2(n.z - best.z, n.x - best.x); for (const da of [0, 0.8, -0.8, 1.6, -1.6, 3.14]) { const px = Math.floor(best.x + Math.cos(a + da) * 1.6) + 0.5, pz = Math.floor(best.z + Math.sin(a + da) * 1.6) + 0.5; if (roomAt(px, v.y, pz) != null) { spot = { kind: 'join', x: px, z: pz, face: [best.x, best.z] }; best.act.until = Math.max(best.act.until, L.clock + 14); break; } } } }
    if (spot) { /* chosen */ } else if (kid && n.playAt) { const a = Math.random() * 6.283, d = 1.5 + Math.random() * n.playAt.r; spot = { kind: 'play', x: Math.floor(n.playAt.x + Math.cos(a) * d) + 0.5, z: Math.floor(n.playAt.z + Math.sin(a) * d) + 0.5 }; }
    else if (!spot) { const kind = kid ? (r < 0.55 ? 'square' : r < 0.8 ? 'well' : 'gate') : dusk ? (r < 0.45 ? 'eve' : r < 0.8 ? 'square' : 'home') : (r < 0.38 ? 'shop' : r < 0.6 ? 'square' : r < 0.72 ? 'well' : r < 0.82 ? 'gate' : r < 0.92 ? 'visit' : 'home');
      const pool = S.filter(s => s !== A.spot && !s.by && (s.bad || 0) < 3 && (kind === 'eve' ? s.eve : kind === 'visit' ? (s.kind === 'home' && s !== n.homeSpot) : kind === 'home' ? s === n.homeSpot : s.kind === kind));
      if (pool.length) { let tot = 0; const ws = pool.map(s => { const w = 1 / (8 + Math.hypot(s.x - n.x, s.z - n.z)); tot += w; return w; }); let q = Math.random() * tot; for (let i = 0; i < pool.length; i++) { q -= ws[i]; if (q <= 0) { spot = pool[i]; break; } } spot = spot || pool[0]; } }
    if (!spot) { n.act = { kind: 'stay', until: L.clock + 2 + Math.random() * 3 }; return; }
    const path = lifePath(L, v, n.x, n.z, spot.x, spot.z);
    if (!path && spot === n.homeSpot) { const hs = S.filter(s => s.kind === 'home' && s !== spot && (s.bad || 0) < 2); n.homeTry = (n.homeTry || 0) + 1; if (hs.length) n.homeSpot = hs[(n.id + n.homeTry * 5) % hs.length]; } // no way to that door: sleep somewhere else
    if (!path) { spot.bad = (spot.bad || 0) + 1; n.act = { kind: 'stay', until: L.clock + 2 + Math.random() * 4, spot: A.spot }; n.fails = (n.fails || 0) + 1; if (n.fails > 6) { n.fails = 0; unstick(n); } return; }
    n.fails = 0; if (spot.kind !== 'play' && spot.kind !== 'join' && !n.watch) spot.by = n; n.act = { kind: 'go', spot, path, pi: 0, stuck: 0, bed: night && spot === n.homeSpot };
  }
  function lifeStep(n, v, L, dt, player, night) {
    let A = n.act; if (!A) { n.act = A = { kind: 'stay', until: L.clock + Math.random() * 4 }; }
    if (G.talkNpc === n) { n.moving = false; lifeTurn(n, player.x, player.z, dt); return; } // while you are talking to them they stand and face you
    if (A.kind === 'go' && night && !A.bed && n.homeSpot && !n.watch && L.queue < 2) { L.queue++; lifePick(n, v, L, true); return; }
    if (A.kind === 'stay') { n.moving = false;
      const dp = Math.hypot(player.x - n.x, player.z - n.z);
      if (dp < 2.8) { lifeTurn(n, player.x, player.z, dt); if (!n.child && L.clock > L.hail && L.clock > (n.hailed || 0)) { const t = world.time || 0, pool = n.watch && night ? SAY_WATCH : SAY_HAIL[t < 0.36 ? 'dawn' : t > 0.68 ? 'dusk' : 'day']; L.hail = L.clock + 9; n.hailed = L.clock + 50; if (Math.random() < 0.7) { let line = v.atlantis && Math.random() < 0.4 ? 'Land-walker.' : pool[Math.floor(Math.random() * pool.length)]; if (line === L.lastHail) line = pool[(pool.indexOf(line) + 1) % pool.length]; L.lastHail = line; lifeSay(L, n, line, 2.4); } } }
      else if (A.mate && !A.mate.hidden && Math.hypot(A.mate.x - n.x, A.mate.z - n.z) < 3.2) lifeTurn(n, A.mate.x, A.mate.z, dt);
      else if (A.spot && A.spot.face) lifeTurn(n, A.spot.face[0], A.spot.face[1], dt);
      if (A.lines && L.clock >= A.next) { const ln = A.lines.shift(); lifeSay(L, ln[0], ln[1], 2.8); A.next = L.clock + 3.1; if (!A.lines.length) A.lines = null; }
      if (L.clock >= A.until && !A.lines) { if (night && A.spot && A.spot === n.homeSpot) { n.asleep = true; n.hidden = true; A.spot.by = null; n.act = null; return; } if (L.queue < 2) { L.queue++; lifePick(n, v, L, night); } }
      return; }
    const wp = A.path[A.pi]; if (!wp) { lifeArrive(n, v, L, night); return; }
    const mdx = wp[0] - n.x, mdz = wp[1] - n.z, md = Math.hypot(mdx, mdz); if (md < 0.3) { A.pi++; if (A.pi >= A.path.length) lifeArrive(n, v, L, night); return; }
    if (A.wpi !== A.pi) { A.wpi = A.pi; A.best = md; A.bt = L.clock; } else if (md < A.best - 0.08) { A.best = md; A.bt = L.clock; } else if (L.clock - A.bt > 2.5) { if (A.spot && A.spot.by === n) A.spot.by = null; n.moving = false; n.act = { kind: 'stay', until: L.clock + 0.4 + Math.random() }; return; } // sliding along something and getting no nearer: stop, and find another way
    const step = Math.min(md, (n.pace || 1.3) * dt), ux = mdx / md, uz = mdz / md; let went = false; n.moving = true;
    for (const ang of (n.side ? [0, n.side * 0.9, n.side * 1.7, -n.side * 0.9] : [0, 0.9, -0.9, 1.7, -1.7])) { const c = Math.cos(ang), sn = Math.sin(ang), vx = ux * c - uz * sn, vz = ux * sn + uz * c; const gy = roomAt(n.x + vx * (step + 0.25), n.y, n.z + vz * (step + 0.25)); if (gy == null) continue;
      { let crowd = false; const qx = n.x + vx * (step + 0.2), qz = n.z + vz * (step + 0.2); for (const m of v.npcs) { if (m === n || m.hidden || Math.abs(m.y - n.y) > 1.5) continue; const d1 = Math.hypot(m.x - qx, m.z - qz); if (d1 < 0.8 && d1 < Math.hypot(m.x - n.x, m.z - n.z)) { crowd = true; break; } } if (crowd) continue; }
      n.x += vx * step; n.z += vz * step; n.y += (gy - n.y) * Math.min(1, dt * 8); lifeTurn(n, n.x + vx, n.z + vz, dt * 1.6); n.side = ang ? Math.sign(ang) : 0; went = true; break; }
    if (went) A.stuck = 0; else { n.moving = false; n.side = 0; A.stuck += dt; if (A.stuck > 1.4) { const bx = Math.floor(n.x + ux * 0.8), bz = Math.floor(n.z + uz * 0.8); if (roomAt(bx + 0.5, v.y, bz + 0.5) == null && bx >= L.ox && bz >= L.oz && bx < L.ox + L.W && bz < L.oz + L.W) L.grid[(bx - L.ox) * L.W + (bz - L.oz)] = 0; if (A.spot && A.spot.by === n) A.spot.by = null; n.act = { kind: 'stay', until: L.clock + 0.6 + Math.random() * 1.5 }; } } // the way is shut: remember it, and think again
  }
  function lifeArrive(n, v, L, night) {
    const A = n.act, sp = A.spot, kid = !!n.child; n.moving = false;
    const dur = kid ? 0.8 + Math.random() * 2.4 : A.bed ? 1.5 + Math.random() * 3 : sp.kind === 'shop' ? 7 + Math.random() * 10 : sp.kind === 'square' ? 9 + Math.random() * 16 : sp.kind === 'gate' ? 4 + Math.random() * 6 : 6 + Math.random() * 10;
    const S = { kind: 'stay', spot: sp, until: L.clock + dur }; n.act = S;
    if (kid) { if (Math.random() < 0.2 && L.clock > (L.kidSay || 0)) { L.kidSay = L.clock + 7; lifeSay(L, n, (v.atlantis ? SAY_KID_ATL : SAY_KID)[Math.floor(Math.random() * SAY_KID.length)], 1.8); } return; }
    if (night) return;
    // somebody already here, with time on their hands: stop and talk
    for (const m of v.npcs) { if (m === n || m.hidden || m.child || !m.act || m.act.kind !== 'stay' || m.act.mate || m.wander === false) continue; if (Math.hypot(m.x - n.x, m.z - n.z) > 3.4) continue;
      S.mate = m; m.act.mate = n; const until = L.clock + 9 + Math.random() * 6; S.until = Math.max(S.until, until); m.act.until = Math.max(m.act.until, until);
      if (L.clock > L.talk && Math.hypot(G.player.x - n.x, G.player.z - n.z) < 18) { L.talk = L.clock + 14; /* near enough for you to overhear */ const pool = v.atlantis ? SAY_ATL : SAY_CHAT, pr = pool[Math.floor(Math.random() * pool.length)]; S.lines = [[n, pr[0]], [m, pr[1]]]; S.next = L.clock + 0.9; } break; }
  }
  function lifeTick(v, dt, player) {
    const L = lifeOf(v); L.clock += dt; L.queue = 0; const night = isNight() || !!(v.raid && v.raid.state === 'active');
    if (L.clock > L.fresh) { L.fresh = L.clock + 45; L.grid.fill(-1); for (const s of L.spots) { s.bad = 0; if (s.by && (s.by.hidden || !v.npcs.includes(s.by))) s.by = null; } } // what you have built or dug since is found out within the minute
    if (!night) for (const n of v.npcs) if (n.asleep) { n.asleep = false; n.hidden = false; if (n.homeSpot) { n.x = n.homeSpot.x; n.z = n.homeSpot.z; } n.act = { kind: 'stay', until: L.clock + Math.random() * 12 }; } // morning: out of the door, one at a time
    L.night = night; return L;
  }
  function update(dt, player, inBattle) {
    if (runners.length) runTick(dt); if (film) { if (inBattle) filmEnd(); else filmTick(dt); }
    if (!world.preset.villages) { active = null; activeHermit = null; return; }
    ensureFisher(); updateHermits(player, dt);
    let near = null, nd = Infinity;
    for (const v of allKnownSites(player.x, player.z, 1)) { const d = dist2d(v.x, v.z, player.x, player.z); if (d < nd) { nd = d; near = v; } }
    if (near && nd < 90) {
      frame(near, player.x, player.z);
      if (state(near.id).stamped && near.type === 'sea' && !state(near.id).reef1) { ensureStamped(near); if (G.meshPass) G.meshPass(99); }
      if (near.atlantis && !state(near.id).stamped) { ensureStamped(near); atlS().seen = true; UI.sfx('quest'); UI.toast('Atlantis. A city under glass on the floor of the sea, lit like day. Swim down the falls through the eye of the dome, or in at one of the four gates at its foot.', 'good'); }
      if (!state(near.id).stamped) { ensureStamped(near); UI.toast(`${near.name}: ${near.style === 'atlantis' ? 'a city of the sea people' : near.type === 'sea' ? 'a village on stilts' : near.type === 'deep' ? 'a village under the sea' : near.style === 'alien' ? 'an alien settlement' : near.style === 'frontier' ? 'a frontier town' : near.style === 'halo' ? 'a caravan town' : 'a village'}${state(near.id).freed ? '' : near.type === 'land' && world.preset.id === 'earth' ? `, held at level ${bossLevelFor(near)}. The wild Kin round it are his, and nearly as strong` : ', held by a tyrant'}.`); }
      if (state(near.id).stamped && !near._tableOk && !near.founded && !near.atlantis) { near._tableOk = true; /* a table that was dug up before tables were made fast goes back where it stood, and the one in your bag goes with it */
        const vx = near.x, vy = near.y, vz = near.z; let found = false; for (let dx = -8; dx <= 8 && !found; dx++) for (let dz = -8; dz <= 8 && !found; dz++) for (let dy = -2; dy <= 3; dy++) if (world.getBlock(vx + dx, vy + dy, vz + dz) === B.FUSION) { found = true; break; }
        if (!found && world.getBlock(vx, vy, vz) !== undefined) { const off = near.type === 'deep' || near.style === 'atlantis' ? [3, 3] : near.size === 'city' ? [5, -5] : [0, 0]; world.setBlock(vx + off[0], vy, vz + off[1], B.FUSION); if (G.player.has('fusion')) G.player.take('fusion', 1); UI.toast(`The Fusion Table is back in ${near.name}.`, 'good'); if (G.meshPass) G.meshPass(99); } }
      if (near.founded) { refreshT -= dt; if (refreshT <= 0 || !near.npcs.length) { refreshT = 4; refreshFounded(near); } }
      else if (!near.npcs.length) { populate(near); ensurePortal(near); }
      if (!near.portalChecked) { near.portalChecked = true; clearPortal(near); }
      if (active && active !== near) { if (active.raid && active.raid.state === 'active') endRaid(active, state(active.id)); clearLieutenants(active); }
      active = near; remember(near, state(near.id));
      Wild.noSpawn = { x: near.x, z: near.z, r: near.atlantis ? near.RH + 8 : near.type === 'land' ? (near.R ? near.R + 3 : state(near.id).expanded ? 21 : 15) : 16 };
      if (near.R && !near.patched) patchLoaded(near);
      if (near.R && near.type === 'land' && state(near.id).stamped && !state(near.id).railLevel) { stampRail(near, state(near.id)); if (G.meshPass) G.meshPass(99); } /* lines laid before they were levelled */
      if (nd < (near.atlantis ? near.RH - 2 : 14)) {
        if (!G.lastVillage || G.lastVillage.id !== near.id) G.lastVillage = { id: near.id, x: near.x, y: near.y, z: near.z, name: near.name, world: world.preset.id };
        if (state(near.id).freed) { G.respawnPoint = { x: near.x + 0.5, y: near.y, z: near.z + (near.atlantis ? 14.5 : near.type === 'deep' ? -4.5 : 4.5) }; if (near.atlantis && G.addRoost) G.addRoost({ id: near.id, name: 'Atlantis', x: near.x + 0.5, y: near.y, z: near.z + 15.5, world: world.preset.id, ferry: true, tide: true }); /* the Current carries you there and back once you have stood in the city */ if (!near.R && near.type !== 'deep' && G.addRoost) G.addRoost(near.type === 'sea' ? { id: near.id, name: near.name, x: near.x + 17.5, y: near.y, z: near.z - 3, world: world.preset.id, ferry: true } : { id: near.id, name: near.name, x: near.x + 0.5, y: near.y, z: near.z + 4.5, world: world.preset.id }); }
      }
      if (nd < 50) { ensureBoss(near, G.trainerLevel); tyrantTalk(near, player, dt); }
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
    if (st.freed) { st.lastVisit = G.dayCount || 0; st.awayWarned = 0; }
    if (!st.freed && st.stamped && v.doorsShut == null && v.type === 'land' && (world.preset.id === 'earth' || v.R) && !v.founded) setDoors(v, true); /* shut in their own homes: that is what he has done to them */
    if (!st.freed && (st.gangOut || []).length && (v.partT = (v.partT || 0) - dt) <= 0) { v.partT = 1; applyPart(v, st); }
    // guards off duty: stand at their posts and watch you
    if (!(v.raid && v.raid.state === 'active')) for (const g of v.guardEnts) { g.bob += dt; const dx = player.x - g.x, dz = player.z - g.z; if (Math.hypot(dx, dz) < 7) g.yaw = Math.atan2(dx, dz); g.moving = false; g.leap = 0; if (((g.bob * 2) | 0) !== (((g.bob - dt) * 2) | 0)) unstick(g); }
    const life = lifeTown(v) ? lifeTick(v, dt, player) : null;
    for (const n of v.npcs) {
      if (n.hidden) continue;
      n.bob = (n.bob || 0) + dt;
      if (((n.bob * 2) | 0) !== (((n.bob - dt) * 2) | 0)) unstick(n); // twice a second: nobody stands in a lamp post
      if (n === v.elder && walkState) continue;
      if (n.wander === false) { const dx = player.x - n.x, dz = player.z - n.z; if (Math.hypot(dx, dz) < 5) n.yaw = Math.atan2(dx, dz); continue; }
      if (life && n.role === 'villager') { lifeStep(n, v, life, dt, player, life.night); continue; }
      n.wait -= dt;
      if (n.wait <= 0) { n.wait = 3 + Math.random() * 6; const a = Math.random() * 6.28, r = 2 + Math.random() * 5; n.tx = U.clamp(n.home.x + Math.cos(a) * r, v.x - v.wanderR, v.x + v.wanderR); n.tz = U.clamp(n.home.z + Math.sin(a) * r, v.z - v.wanderR, v.z + v.wanderR); n.moving = true; }
      if (n.moving) {
        const mdx = n.tx - n.x, mdz = n.tz - n.z, md = Math.hypot(mdx, mdz);
        if (md < 0.3) n.moving = false;
        else { const step = Math.min(md, (n.speed || 1.3) * dt), ux = mdx / md, uz = mdz / md; let went = false; /* a post or a corner in the way: step round it instead of standing against it */
          for (const ang of (n.side ? [0, n.side * 0.9, n.side * 1.7, -n.side * 0.9] : [0, 0.9, -0.9, 1.7, -1.7])) { const c = Math.cos(ang), sn = Math.sin(ang), vx = ux * c - uz * sn, vz = ux * sn + uz * c; const gy = roomAt(n.x + vx * (step + 0.25), n.y, n.z + vz * (step + 0.25)); if (gy == null) continue;
            { let crowd = false; const qx = n.x + vx * (step + 0.2), qz = n.z + vz * (step + 0.2); for (const m of v.npcs) { if (m === n || m.hidden || Math.abs(m.y - n.y) > 1.5) continue; const d1 = Math.hypot(m.x - qx, m.z - qz); if (d1 < 0.85 && d1 < Math.hypot(m.x - n.x, m.z - n.z)) { crowd = true; break; } } if (crowd) continue; } /* someone is standing there: go round them too */
            n.x += vx * step; n.z += vz * step; n.y += (gy - n.y) * Math.min(1, dt * 8); n.yaw = Math.atan2(vx, vz); n.side = ang ? Math.sign(ang) : 0; went = true; break; }
          if (!went) { n.moving = false; n.side = 0; n.wait = Math.min(n.wait, 0.8); } }
      }
    }
    /* nobody walks through anybody: two people too close step apart, and they give you room as well */
    { const ppl = v.npcs.filter(n => !n.hidden); for (let i = 0; i < ppl.length; i++) { const a = ppl[i];
        for (let j = i + 1; j < ppl.length; j++) { const b = ppl[j]; if (Math.abs(a.y - b.y) > 1.5) continue; let dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz); if (d >= 0.8) continue; if (d < 0.01) { dx = 1; dz = 0; d = 1; } const push = (0.8 - d) / 2 * Math.min(1, dt * 6), ux = dx / d, uz = dz / d;
          if (a.wander !== false && !(a === v.elder && walkState) && roomAt(a.x - ux * push, a.y, a.z - uz * push) != null) { a.x -= ux * push; a.z -= uz * push; }
          if (b.wander !== false && !(b === v.elder && walkState) && roomAt(b.x + ux * push, b.y, b.z + uz * push) != null) { b.x += ux * push; b.z += uz * push; } }
        if (a.wander !== false && !(a === v.elder && walkState) && Math.abs(a.y - player.y) < 1.5) { const dx = a.x - player.x, dz = a.z - player.z, d = Math.hypot(dx, dz); if (d < 0.7 && d > 0.01) { const push = (0.7 - d) * Math.min(1, dt * 6); if (roomAt(a.x + dx / d * push, a.y, a.z + dz / d * push) != null) { a.x += dx / d * push; a.z += dz / d * push; } } } } }
    if (walkState && !inBattle) elderWalk(dt, player);
    tickBubbles(); trainTick(dt, player);
  }
  // someone standing inside a prop (a lamp post, a fence, a flower box: the props came after the villagers' homes were set) steps to the nearest clear square, and his home moves with him
  /* room for a body, not just a point: the square ahead and a shoulder's width to each side */
  function roomAt(x, y, z) { const g = standY(x, y, z); if (g == null) return null; for (const [ox, oz] of [[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]]) { const g2 = standY(x + ox, y, z + oz); if (g2 == null || Math.abs(g2 - g) > 1.1) return null; } return g; }
  /* the railway belongs to everyone: the track, its bed, its embankment and its viaduct, from the station out to the end of the line */
  function railAt(x, y, z) { for (const v of townList()) { if (v.type !== 'land' || Math.abs(x - v.x) + Math.abs(z - v.z) > 140) continue; const st = state(v.id); if (!st.stamped && v !== active) continue; const rl = layout(v).rail; if (!rl) continue;
      const k = (rl.ax ? z : x) - rl.line, base = rl.ax ? v.x : v.z, d = ((rl.ax ? x : z) - base) * rl.sgn, d0 = (rl.along0 - base) * rl.sgn - 3; if (Math.abs(k) <= 1 && d >= d0 && d <= wallRadius(st) + 36 && y <= v.y && y >= v.y - 42) return v; } return null; }
  function unstick(n) {
    if (standY(n.x, n.y, n.z) != null) return;
    for (const r of [1, 1.5, 2.2]) for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; const nx = Math.floor(n.x + Math.cos(a) * r) + 0.5, nz = Math.floor(n.z + Math.sin(a) * r) + 0.5; const gy = standY(nx, n.y, nz); if (gy != null) { n.x = nx; n.z = nz; n.y = gy; if (n.home && standY(n.home.x, n.y, n.home.z) == null) n.home = { x: nx, z: nz }; return; } }
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
        else if (d <= 2.2 || walkState.far || (d < 40 && walkState.t >= 7)) {
          e.yaw = Math.atan2(dx, dz); walkState.stage = 'done';
          const reward = v.size === 'city' ? 450 : v.size === 'town' ? 220 : 100; G.talkNpc = e;
          Dialogue.show(e.name, [`Thank you! ${walkState.tyrant ? walkState.tyrant + ' kept' : 'That tyrant kept'} us shut in our own homes. We never thought anyone would stand up to him.`, `${v.name} is free. The doors are open again: ${shopDef('bakery', v).title}, ${shopDef('juice', v).title}, ${shopDef('trader', v).title}, and the ${shopDef('voodoo', v).title}. ${world.preset.id !== 'earth' ? 'The arch in the square is yours now: tap it to step to any village you hold on this world.' : 'The station (or the ferry) will take you to any village you hold once its line is running.'}`, `We passed a hat round every door. Here are ${reward} Shards. It is all of it and it is yours, once and gladly.`, `They will not be back while you are about. But stay away ${AWAY} days and they will hear of it, and we will be shut indoors again. Look in on us. Talk to me for the village ledger.`], () => { G.shards += reward; UI.toast(`+${reward} Shards from ${v.name}.`, 'good'); walkState = null; e.wander = true; });
        } else if (d >= 40) { walkState.t = 99; walkState.far = true; }
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
            'Thank you, stranger. Keychain held this village for a whole season and kept us in our homes. You have freed us.',
            'Welcome to Stratakin. The world is layered: sky islands above, these lands, the Mines below, and the Core at the heart of everything.',
            'Kin live in every layer, and the wild ones will come at you. Meet them with your own blade and shield if you like, or send a Kin of yours in. A Kin always hits harder than steel, and the great ones only fall to Kin.',
            'Catch them, raise them, and the right pairs can be fused into new ones. Come, I will show you the table.',
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
            'This is a Fusion Table. Tap it. A fusion is a recipe: two particular Kin and an element stone, and out of them comes a third, better than either. The table lists the recipes you know. Quest folk teach more, and so do the tyrants when they fall.',
            'Materials craft gear on the same table, swords, shields and bows among them, and anything it makes can be taken apart again. It also keeps your spare Kin: eight walk with you, the rest wait in the table.',
            `Take these Shards for what you did. Every house put something in. It is a thank you, not a wage: ${v.name} is free and means to stay that way.`,
            `Keychain will not show his face here while you are about. Stay away ${AWAY} days, though, and he will hear of it. Look in on us. Pell bakes, Mira's smoothies mend tired Kin, Oskar trades. Old Brannock on the shore knows where the other tyrants sit.`,
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
    const list = (active ? active.npcs : []).concat(fisher ? [fisher] : [], activeHermit && activeHermit.npcs ? activeHermit.npcs : [], loose);
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
  function clearFisherPortal() { const fp = G.fisherSpot && G.fisherSpot.portal; if (!fp || world.preset.id !== 'earth') return; if (world.getBlock(fp.x, fp.y, fp.z) === B.PORTAL) world.setBlock(fp.x, fp.y, fp.z, B.AIR); G.fisherSpot.portal = null; }
  function fisherTarget() {
    let target = G.fisherTarget ? recordFor(G.fisherTarget) : null;
    if (!target || isFreed(target.id)) { target = fisher ? nearestUnfreed(fisher.x, fisher.z, true) : null; G.fisherTarget = target ? target.id : null; }
    return target;
  }
  const CHILD_LINES = [
    'Is that your Kin? Does it bite? Can I hold it? I will be careful.',
    'I saw a wild one by the well this morning. It looked right at me and I did not even run.',
    'When I am big I am going to have eight Kin. All of them the fast kind.',
    'Mine is going to be a fire one. Ma says not in the house.',
    'Do yours sleep? Where do they sleep? Do they dream?',
    'My brother says the ones in the mines have no eyes. He has never been in the mines.',
    'I found an egg once. It was a stone. I kept it anyway.',
    'You smell like outside. Did you come a long way?',
    'I am not allowed past the fence. I have been past the fence.',
    'If you hold very still the little ones come up and look at you. I counted to forty once.',
  ];
  const CHILD_LINES2 = [
    'Bring it back to show me when it gets big. Promise.',
    'The elder says they choose you. I am waiting to be chosen. It is taking ages.',
    'I know where the berries are. I am not telling. All right, by the old wall.',
    'Do not tell anyone I said that.',
    'I have to go. I am meant to be fetching water. That was a while ago.',
    'Can it do a trick? Any trick. That was a good trick.',
    'They say the Moon has Kin with lights on. I want one of those too.',
    'You can have my lucky stone if you want. No, wait. I need it.',
  ];
  function talk(n) {
    G.talkNpc = n; // the camera turns to whoever is speaking
    if (n.onTalk) { n.onTalk(n); return; }
    if (n.role === 'keeper' && n.shop && typeof Fields !== 'undefined' && world.preset.id === 'earth' && active) { /* a hold-up: only in a mask, only what is out on the counter (the rest is locked away the moment they see you), and the shop keeps its shutters down the day after. Whoever's mask it was answers for it, and every job done in it adds two more days to that */
      const hk = active.id + ':' + n.shop, HU = (G.stats.heldUp = G.stats.heldUp || {}), day = G.dayCount || 0, mk = Fields.masked();
      if ((HU[hk] || 0) > day) { Dialogue.show(n.name, ['Shutters are down. We were held up, and I am not opening again until tomorrow.']); return; }
      if (mk) { if (!holdArm || holdArm.n !== n || performance.now() > holdArm.t) { holdArm = { n, t: performance.now() + 7000 }; UI.toast(`${n.name} has seen the mask and gone white. Speak again to hold the place up, or put the mask away.`, 'bad'); return; }
        holdArm = null; const def = shopDef(n.shop, active), pool = (def.stock || []).filter(e => e.item && !e.barter && !e.service && ITEMS[e.item]), loot = [], got = []; while (loot.length < 2 && pool.length) loot.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); /* whatever two things happened to be out on the counter that day */ for (const e of loot) { G.player.add(e.item, 1); got.push(ITEMS[e.item].name); } HU[hk] = day + 2; const until = (cur) => Math.min(day + 8, Math.max(cur || 0, day) + 2); if (mk === 'ind') G.stats.shunInd = until(G.stats.shunInd); else G.stats.shunRail = until(G.stats.shunRail); UI.sfx('caught'); UI.renderHotbar();
        Dialogue.show(n.name, ['Take it. Take what is on the counter. Everything else went under the floor the moment you came through that door.', got.length ? `(You sweep up ${got.join(' and ')}.)` : '(The counter is bare.)'], () => UI.toast(mk === 'ind' ? 'The town will blame the Indians. Their camps are closed to you for longer now.' : 'The town will blame the bandits. The trains are closed to you for longer now.', 'bad')); return; } }
    { const wn = typeof Fields !== 'undefined' && world.preset.id === 'earth' ? Fields.wanted() : null; if (wn && (n.role === 'keeper' || n.role === 'voodoo' || n.role === 'elder')) { Dialogue.show(n.name, [`Were you the one who emptied ${wn.owner}'s cart at ${wn.name}? Word came up the road ahead of you.`, n.role === 'elder' ? 'You are not welcome in this town until you have squared it with the farmer. Thirty shards, I hear, or wait it out.' : 'I am not serving you. Square it with the farmer, or come back in a couple of days when tempers have cooled.']); return; } }
    if (n.atl) { atlTalk(n); return; }
    if (n.shop && active && active.R && fixShop(n)) return;
    if (n.shop === 'station') { UI.openPanel('train', {}); return; }
    if (n.shop === 'post') { UI.openPanel('shop', postShop(active)); return; }
    if (n.shop) { UI.openPanel('shop', shopDef(n.shop, active)); return; }
    if (n.role === 'voodoo') { UI.openPanel('shop', shopDef('voodoo', active)); return; }
    if (n.role === 'hermit') { talkHermit(n); return; }
    if (n.child) { n.talks = (n.talks || 0) + 1; const day = (G.dayCount || 0) * 7 + n.talks; const r = U.rng(U.combine(U.strHash((active ? active.id : 'v') + ':' + n.id), day)); /* something new each time you ask, and each day */ /* children say what children say: what they saw, what they want, what they were told not to do */
      Dialogue.show(n.name, [r.pick(CHILD_LINES), r.pick(CHILD_LINES2)]); return; }
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
        `Caught anything? Only trouble, lately. There is a village ${kind}, about ${d} blocks to the ${dirWord(dx, dz)}: ${target.name}. A tyrant holds it, like Keychain held yours. Level ${bossLevelFor(target)} or near it, they say, so train for that.`,
        `See the strip at the bottom of your view? That is your compass. The flag ⚑ on it now points at ${target.name}. The star ★ is your own quest, the little house ⌂ is the last village you stood in, and ✦ is your camp fire.`,
        target.type === 'deep' ? 'For the dome you will want a Breathing Bulb, or a fish to ride. Swim down the shaft in its roof. Free them and the village pays you a share, like this one.' : target.type === 'sea' ? 'A long swim. Ride a fish if you have one. Free them and the village pays you a share, like this one.' : 'Free them and the village pays you a share, like this one. The tyrants get stronger the further you go.',
        target.type === 'land' ? `${lieuCount(target) > 1 ? 'His guards hold the road in, ' + lieuCount(target) + ' of them, one checkpoint after another' : 'A guard of his holds the road in'}. Fight through with a bag of tonics, or slip round through the trees to another gate.` : `${lieuCount(target) > 1 ? 'His guards, ' + lieuCount(target) + ' of them, hang in the water on the way in' : 'A guard of his hangs in the water on the way in'}. Fight through with a bag of tonics, or swim wide around them.`,
      ]);
      return;
    }
    if (n.role === 'elder') {
      const v = active; if (!v) return;
      if (v.starter && world.preset.id === 'earth' && (G.stats.garrison || {}).taken && !G.stats.haskHome) { G.stats.haskHome = true; G.talkNpc = n; return Dialogue.show(n.name, ['Sit down a minute. I heard what post you took, up there, and I heard whose.', 'Corwin. My brother. We were boys in this square. He wanted a uniform and somebody to tell him he was right, and one day a man in a mask came through who was happy to do both.', 'Forty years. I told people he drowned. It was easier.', 'They say you put him out of his own gate and he walked. He always could take a beating. Thank you for not making it worse than that.'], () => { G.shards += 120; UI.toast('Elder Hask presses 120 shards on you and will not hear a word about it.', 'good'); }); }
      const st = state(v.id);
      if (typeof Npcs !== 'undefined' && Npcs.onElderTalk(v)) { Dialogue.show(n.name, ['A parcel, for me? From the road? Well. Tell them it arrived.']); return; }
      if (!st.freed) { Dialogue.show(n.name, ['The tyrant is back in the square. Beat him and we are yours again.']); return; }
      if (typeof Sky !== 'undefined' && Sky.rootHint && Sky.rootHint(n, v)) return; // the first freed elder tells you about the Skyroot
      const inc = collect(v);
      if (inc > 0) { G.shards += inc; UI.sfx('caught'); UI.toast(`${v.name} set aside ◆ ${inc} for you.`, 'good'); }
      UI.openPanel('village', v);
      return;
    }
    const an = (w) => (/^[aeiou]/i.test(w) ? 'An ' : 'A ') + w;
    { const hs = (typeof Wild !== 'undefined' && Wild.haunts) ? Wild.haunts() : []; const p = G.player;
      const ls = (typeof Wild !== 'undefined' && Wild.leads) ? Wild.leads() : [];
      if ((hs.length || ls.length) && Math.random() < 0.75) {
        // whoever you ask knows about one of the Kin you are after; go round the people in town and you hear about each of them
        G.stats.hintTurn = (G.stats.hintTurn || 0) + 1; const all = hs.map(h => ['haunt', h]).concat(ls.map(l => ['lead', l])); const [kind, pick] = all[G.stats.hintTurn % all.length];
        if (kind === 'lead') { const l = pick; const where = { Forest: 'deep in the woods', Plains: 'far out on the grass', Desert: 'out in the dunes', Swamp: 'in the marsh', Snowfield: 'up in the snowfields', Mountains: 'high on the peaks', Ocean: 'on the open sea' }[l.biome] || 'out in the wilds';
          if (l.x == null) { Dialogue.show(n.name, [`${an(l.name)}? Rare as anything. ${l.layer === 'Mines' ? 'The miners say they have seen one down in the Mines, in the dark galleries.' : l.layer === 'Water' ? 'Fishermen talk of one in the deep water, out past the shallows.' : l.layer === 'Sky' ? 'Only up in the sky, they say, among the cloud islands.' : 'Only in the deepest places, they say.'} Take nets and patience.`]); return; }
          const dx = wd(l.x - p.x), dz = wd(l.z - p.z), d = Math.round(Math.hypot(dx, dz) / 50) * 50;
          Dialogue.show(n.name, [U.rng(Date.now() | 0).pick([`${an(l.name)}? I saw one once, ${where}, a good ${d} blocks ${dirWord(dx, dz)} of here. You don't see them often, mind.`, `People say the ${l.name}s keep ${where}, about ${d} blocks to the ${dirWord(dx, dz)}. A rare thing. Go when you have time to wait.`])]); return; }
        const h = pick; const dx = wd(h.x - p.x), dz = wd(h.z - p.z), d = Math.round(Math.hypot(dx, dz) / 10) * 10;
        const where = h.biome === 'Forest' ? 'in the trees' : h.biome === 'Plains' ? 'out on the open grass' : h.biome === 'Desert' ? 'out on the sand' : h.biome === 'Swamp' ? 'down in the marsh' : h.biome === 'Snowfield' ? 'up in the snow' : h.biome === 'Mountains' ? 'up on the slopes' : 'out there';
        G.stats.hauntTold = G.stats.hauntTold || {}; G.stats.hauntTold[h.sp.seed] = true;
        Dialogue.show(n.name, [U.rng(Date.now() | 0).pick([`${an(h.name)}? I see a couple of them ${where}, about ${d} blocks ${dirWord(dx, dz)} of here. Always the same spot.`, `You want ${/^[aeiou]/i.test(h.name) ? 'an' : 'a'} ${h.name}? There's a pair that keeps ${where}, ${d} blocks or so to the ${dirWord(dx, dz)}. My cousin swears they never leave it.`, `${h.name}s, you say. Go ${dirWord(dx, dz)}, maybe ${d} blocks, ${where}. That's where they always are.`])]); return; } }
    Dialogue.show(n.name, [U.rng(Date.now() | 0).pick(VILLAGER_LINES)]);
  }
  // ---- the train: a little tank engine and two coaches waiting at the platform of every open station, steam idling; it pulls out when you buy a fare ----
  function trainMesh(kind) {
    const wid = world.preset.id;
    if (wid === 'moon') return R.entityMesh('glide:' + kind, (mb) => { /* the Glide: three white pods with no wheels, a band of lit glass, a cold light underneath where it rides the beam. Forward is +z */
      const hull = [0.92, 0.94, 0.97], trimc = [0.62, 0.68, 0.78], glow = [0.5, 0.98, 1.0], glass = [0.1, 0.16, 0.24], lit = [0.75, 1.0, 1.0], nose = kind === 'loco', tail = kind === 'brown';
      mb.blob(-0.46, 0.5, -1.22, 0.46, 1.5, 1.22, 0.5, hull, { n: 3, tap: nose ? [1, 1] : [1, 1] });
      if (nose) { mb.blob(-0.4, 0.55, 1.0, 0.4, 1.3, 1.85, 0.5, hull, { n: 3 }); mb.blob(-0.3, 0.95, 1.25, 0.3, 1.32, 1.8, 0.5, glass, { n: 2 }); mb.ball(0, 0.72, 1.82, 0.07, lit, { emis: true }); }
      if (tail) { mb.blob(-0.4, 0.55, -1.8, 0.4, 1.3, -1.0, 0.5, hull, { n: 3 }); mb.plate([[0, 1.45, -1.0], [0, 1.45, -1.7], [0, 1.95, -1.75], [0, 1.6, -1.1]], 0.04, trimc); }
      for (const sx of [-1, 1]) { mb.box(Math.min(sx * 0.44, sx * 0.475), 0.98, -0.95, Math.max(sx * 0.44, sx * 0.475), 1.22, 0.95, lit, 1, true); mb.box(Math.min(sx * 0.44, sx * 0.47), 0.72, -1.1, Math.max(sx * 0.44, sx * 0.47), 0.78, 1.1, trimc); }
      mb.box(-0.3, 0.36, -1.05, 0.3, 0.44, 1.05, glow, 1, true); mb.box(-0.36, 0.44, -1.1, 0.36, 0.52, 1.1, trimc); });
    if (wid === 'halo') return R.entityMesh('rig:' + kind, (mb) => { /* the Rig: a hauler welded out of whatever would hold, a plough and tusks in front, two stacks behind, a caged wagon and a flatbed under sail. Forward is +z */
      const iron = [0.17, 0.17, 0.2], rust = [0.5, 0.26, 0.15], rust2 = [0.62, 0.34, 0.16], steel = [0.4, 0.41, 0.44], dark = [0.1, 0.1, 0.12], bone = [0.9, 0.86, 0.74], fire = [1.0, 0.55, 0.15], cloth = [0.72, 0.24, 0.18];
      const wheels = (zs, r) => { for (const z of zs) for (const sx of [-1, 1]) { mb.tube([[sx * 0.2, r, z], [sx * 0.36, r, z]], [r, r], dark, { segs: 10, cap0: 'flat', cap1: 'flat' }); mb.tube([[sx * 0.36, r, z], [sx * 0.52, r, z]], [0.07, 0.01], steel, { segs: 6, cap0: 'flat', cap1: 'round' }); } }; /* spiked hubs */
      mb.box(-0.42, 0.34, -1.2, 0.42, 0.5, 1.2, iron);
      if (kind === 'loco') { mb.tube([[0, 0.98, -0.2], [0, 0.98, 1.1]], [0.4, 0.36], rust, { segs: 10, cap0: 'flat', cap1: 'flat' }); for (const z of [0.1, 0.6]) mb.tube([[0, 0.98, z - 0.03], [0, 0.98, z + 0.03]], [0.42, 0.42], steel, { segs: 10 });
        mb.box(-0.46, 0.5, -1.15, 0.46, 1.55, -0.2, rust2); mb.box(-0.3, 1.12, -0.21, 0.3, 1.24, -0.17, [1, 0.8, 0.4], 1, true); mb.box(-0.5, 1.55, -1.2, 0.5, 1.62, -0.15, steel); /* the cab: a slit to see through */
        for (const sx of [-1, 1]) { mb.tube([[sx * 0.3, 1.5, -0.9], [sx * 0.34, 2.35, -0.95]], [0.09, 0.07], dark, { segs: 8, cap0: 'none', cap1: 'none' }); mb.ball(sx * 0.34, 2.38, -0.95, 0.07, fire, { emis: true }); mb.box(Math.min(sx * 0.47, sx * 0.5), 0.7, -1.0, Math.max(sx * 0.47, sx * 0.5), 1.2, -0.45, steel); }
        mb.plate([[-0.62, 0.95, 1.2], [0.62, 0.95, 1.2], [0.36, 0.1, 1.75], [-0.36, 0.1, 1.75]], 0.05, steel); /* the plough */
        for (const sx of [-1, 1]) mb.tube([[sx * 0.3, 0.75, 1.15], [sx * 0.55, 0.95, 1.6], [sx * 0.42, 1.35, 1.95]], [0.09, 0.07, 0.01], bone, { segs: 6, cap0: 'none', cap1: 'round' }); /* tusks */
        for (const x of [-0.4, -0.13, 0.13, 0.4]) mb.tube([[x, 0.2, 1.7], [x, 0.14, 1.95]], [0.04, 0.005], steel, { segs: 5, cap0: 'flat', cap1: 'round' });
        wheels([-0.75, -0.05, 0.7], 0.3); }
      else if (kind === 'green') { mb.box(-0.45, 0.5, -1.15, 0.45, 1.4, 1.15, rust); for (const [z0, c] of [[-1.0, steel], [-0.3, rust2], [0.45, [0.22, 0.5, 0.5]]]) for (const sx of [-1, 1]) mb.box(Math.min(sx * 0.45, sx * 0.49), 0.6 + (z0 + 1) * 0.1, z0, Math.max(sx * 0.45, sx * 0.49), 1.25, z0 + 0.6, c); /* plate over plate */
        for (const z of [-0.7, 0, 0.7]) for (const sx of [-1, 1]) mb.box(Math.min(sx * 0.49, sx * 0.5), 0.95, z - 0.13, Math.max(sx * 0.49, sx * 0.5), 1.08, z + 0.13, [1, 0.8, 0.4], 1, true);
        mb.plate([[-0.6, 1.5, -1.2], [0.6, 1.5, -1.2], [0.5, 1.72, 1.2], [-0.5, 1.72, 1.2]], 0.03, cloth); for (const z of [-1.1, 1.1]) for (const sx of [-1, 1]) mb.tube([[sx * 0.44, 1.4, z], [sx * 0.5, 1.62, z]], [0.03, 0.03], steel, { segs: 5 });
        wheels([-0.75, 0.75], 0.27); }
      else { for (const sx of [-1, 1]) mb.box(Math.min(sx * 0.42, sx * 0.47), 0.5, -1.15, Math.max(sx * 0.42, sx * 0.47), 0.85, 1.15, rust2); mb.box(-0.42, 0.5, -1.2, 0.42, 0.85, -1.12, steel);
        for (const [x, z] of [[-0.18, 0.6], [0.2, 0.2], [-0.1, -0.2]]) mb.tube([[x, 0.5, z], [x, 1.0, z]], [0.17, 0.17], [0.36, 0.24, 0.14], { segs: 8, cap0: 'flat', cap1: 'flat' }); /* barrels */
        mb.tube([[0, 0.5, -0.75], [0, 2.5, -0.75]], [0.05, 0.035], steel, { segs: 6, cap0: 'none', cap1: 'round' }); mb.plate([[0, 2.4, -0.72], [0, 1.1, -0.72], [0, 1.25, 0.75], [0, 1.9, 0.2]], 0.02, [0.84, 0.72, 0.5]); /* a patched sail, for when the stacks are cold */
        wheels([-0.75, 0.75], 0.27); } });
    return R.entityMesh('train:' + kind, (mb) => {
      const iron = [0.16, 0.17, 0.2], red = [0.6, 0.13, 0.12], brass = [0.85, 0.68, 0.3], dark = [0.1, 0.1, 0.12], glass = [0.62, 0.8, 0.9], gold = [1.0, 0.86, 0.45], lit = [1.0, 0.9, 0.62];
      const wheels = (zs, r) => { for (const z of zs) for (const sx of [-1, 1]) { mb.tube([[sx * 0.16, r, z], [sx * 0.24, r, z]], [r, r], dark, { segs: 10, cap0: 'flat', cap1: 'flat' }); mb.tube([[sx * 0.2, r, z], [sx * 0.26, r, z]], [r * 0.5, r * 0.5], brass, { segs: 8, cap0: 'flat', cap1: 'flat' }); } };
      if (kind === 'loco') { // forward is +z: smokebox and cowcatcher at the front, the cab at the back
        mb.box(-0.42, 0.3, -1.15, 0.42, 0.44, 1.2, iron);
        mb.tube([[0, 0.9, -0.3], [0, 0.9, 1.05]], [0.37, 0.37], red, { segs: 12, cap0: 'flat', cap1: 'flat' });
        mb.tube([[0, 0.9, 1.05], [0, 0.9, 1.25]], [0.37, 0.33], iron, { segs: 12, cap0: 'flat', cap1: 'flat' });
        for (const z of [0.0, 0.5]) mb.tube([[0, 0.9, z - 0.02], [0, 0.9, z + 0.02]], [0.39, 0.39], brass, { segs: 12 }); // boiler bands
        mb.tube([[0, 1.2, 0.8], [0, 1.78, 0.8]], [0.1, 0.13], dark, { segs: 10, cap0: 'none', cap1: 'none' }); mb.tube([[0, 1.78, 0.8], [0, 1.9, 0.8]], [0.17, 0.15], brass, { segs: 10, cap0: 'flat', cap1: 'flat' }); // chimney
        mb.ball(0, 1.3, 0.2, 0.17, brass); // steam dome
        mb.box(-0.45, 0.44, -1.15, 0.45, 1.5, -0.3, red); mb.blob(-0.5, 1.5, -1.25, 0.5, 1.66, -0.2, 0.5, dark, { n: 2 }); // cab and its roof
        mb.box(-0.3, 0.95, -1.17, 0.3, 1.35, -1.13, glass); for (const sx of [-1, 1]) mb.box(Math.min(sx * 0.47, sx * 0.44), 0.95, -0.95, Math.max(sx * 0.47, sx * 0.44), 1.35, -0.5, glass);
        mb.plate([[-0.45, 0.32, 1.25], [0.45, 0.32, 1.25], [0.22, 0.08, 1.6], [-0.22, 0.08, 1.6]], 0.03, iron);
        mb.plate([[-0.45, 0.32, 1.25], [-0.22, 0.08, 1.6], [-0.22, 0.08, 1.6], [-0.45, 0.32, 1.25]], 0.02, iron);
        mb.ball(0, 1.1, 1.3, 0.1, gold, { emis: true }); // headlamp
        mb.box(-0.47, 0.44, -1.3, 0.47, 0.52, -1.15, iron); // the back step
        wheels([-0.8, -0.2, 0.45], 0.26); wheels([0.98], 0.17);
        for (const sx of [-1, 1]) mb.box(Math.min(sx * 0.27, sx * 0.27) - 0.03, 0.24, -0.8, Math.max(sx * 0.27, sx * 0.27) + 0.03, 0.29, 0.45, iron); // coupling rods
      } else {
        const body = kind === 'green' ? [0.17, 0.4, 0.26] : [0.5, 0.27, 0.15], trim = [0.86, 0.8, 0.62];
        mb.box(-0.42, 0.3, -1.2, 0.42, 0.42, 1.2, iron);
        mb.box(-0.45, 0.42, -1.15, 0.45, 1.45, 1.15, body);
        mb.box(-0.46, 0.72, -1.16, 0.46, 0.78, 1.16, trim); // the waist line
        mb.blob(-0.5, 1.45, -1.25, 0.5, 1.68, 1.25, 0.45, dark, { n: 2 }); // the roof
        for (const z of [-0.8, -0.27, 0.27, 0.8]) for (const sx of [-1, 1]) mb.box(Math.min(sx * 0.47, sx * 0.44), 0.85, z - 0.17, Math.max(sx * 0.47, sx * 0.44), 1.25, z + 0.17, lit, 1, true);
        for (const z of [-1.16, 1.16]) mb.box(-0.26, 0.5, z - 0.02, 0.26, 1.3, z + 0.02, dark);
        for (const sx of [-1, 1]) for (const z of [-1.3, 1.3]) mb.tube([[sx * 0.4, 0.45, z], [sx * 0.4, 1.3, z]], [0.025, 0.025], brass, { segs: 6 }); // handrails at the doors
        wheels([-0.78, 0.78], 0.22);
      }
    });
  }
  const trains = new Map(); // town id -> { run }
  function trainOf(v) {
    if (!v || !v.R || v.type !== 'land') return null; const rl = layout(v).rail; if (!rl) return null;
    if (!(G.stats.roosts || []).some(r => r.id === v.id)) return null; // the line only runs once the station is fixed
    return rl;
  }
  function trainPieces(v) {
    const rl = trainOf(v); if (!rl) return [];
    const run = trains.get(v.id); const off = run ? run.off : 0; const yaw = rl.ax ? (rl.sgn > 0 ? Math.PI / 2 : -Math.PI / 2) : (rl.sgn > 0 ? 0 : Math.PI);
    const out = []; let i = 0;
    for (const [kind, d] of [['loco', 4.9], ['green', 2], ['brown', -0.9]]) { const a = rl.along0 + 0.5 + rl.sgn * (d + off); const [x, z] = rl.ax ? [a, rl.line + 0.5] : [rl.line + 0.5, a];
      out.push({ x, y: rl.y + 0.15, z, yaw, scale: 1, hover: run ? Math.sin(run.t * 30 + i) * 0.01 : 0, skyMul: 1, model: { height: 1.9, radius: 0.5 }, mesh: trainMesh(kind), isTrain: true, kind }); i++; }
    return out;
  }
  function trainTick(dt, player) {
    const v = active; const rl = trainOf(v); if (!rl) return;
    const run = trains.get(v.id); const pieces = trainPieces(v); const loco = pieces[0];
    const chim = { x: loco.x + Math.sin(loco.yaw) * 0.8, y: loco.y + 1.9, z: loco.z + Math.cos(loco.yaw) * 0.8 };
    if (!run) { // idling: a wisp now and then, if anyone is near enough to see it
      if (world.preset.id !== 'moon' && Math.hypot(player.x - loco.x, player.z - loco.z) < 45) { v.puffT = (v.puffT || 0) - dt; if (v.puffT <= 0) { v.puffT = 1.4 + Math.random() * 1.2; Hazards.smoke(chim.x, chim.y, chim.z, 1, [0.8, 0.8, 0.84], 0.22); } }
      return;
    }
    run.t += dt;
    if (run.arrive) { const k = Math.min(1, run.t / (run.dur - 0.8)), e = 1 - Math.pow(1 - k, 2.4); run.off = run.from * (1 - e); } // it comes in from down the line and slows to a stand at the platform
    else { const mt = Math.max(0, run.t - (run.wait || 0)); run.off += Math.min(6.5, mt * 3.2) * dt; } // it stands while you board, then gathers way
    const moving = run.arrive ? run.t < run.dur - 0.8 : run.t > (run.wait || 0);
    run.puffT -= dt; if (run.puffT <= 0) { run.puffT = moving ? Math.max(0.08, 0.3 - Math.max(0, run.t - (run.wait || 0)) * 0.06) : 0.9; const wd_ = world.preset.id; if (wd_ !== 'moon') Hazards.smoke(chim.x, chim.y + (wd_ === 'halo' ? 0.5 : 0), chim.z - 0, moving ? 2 : 1, wd_ === 'halo' ? [0.2, 0.19, 0.2] : [0.78, 0.78, 0.8], moving ? 0.4 : 0.25); if (moving && wd_ !== 'moon' && ((run.t * 4) | 0) !== (((run.t - dt) * 4) | 0)) UI.sfx('place'); }
    if (run.whistle != null && run.t >= run.whistle) { run.whistle = null; UI.sfx(world.preset.id === 'moon' ? 'glide' : world.preset.id === 'halo' ? 'righorn' : 'whistle'); }
    for (const ln of run.lines || []) if (!ln.said && run.t >= ln.t) { ln.said = true; const q = ln.at(); say(q[0], q[1], q[2], ln.text, ln.secs || 2.4); }
    const car = pieces[1], p = G.player;
    if (run.rider) { // the little film of getting aboard: he walks to the carriage, steps up, sits down; then it takes him away
      const tw = 1.3, sx = run.start[0], sz = run.start[1];
      const side = run.cam ? run.cam.side : 1, doorX = car.x + (rl.ax ? 0 : side * 0.8), doorZ = car.z + (rl.ax ? side * 0.8 : 0); // the carriage door, on the platform side
      if (run.t < tw) { const k = run.t / tw, e = k * k * (3 - 2 * k); p.x = sx + (doorX - sx) * e; p.z = sz + (doorZ - sz) * e; p.y = run.y0; p.yaw = Math.atan2(-(doorX - sx), -(doorZ - sz)); const d = Math.hypot(doorX - sx, doorZ - sz) || 1; p.vx = (doorX - sx) / d * 2.2; p.vz = (doorZ - sz) / d * 2.2; p.vy = 0; G.hideMe = false; } // walking to it: the legs go
      else { p.x = car.x; p.z = car.z; p.y = car.y + 1.3; p.vx = p.vy = p.vz = 0; G.hideMe = true; } // through the door and into a seat: he is inside now, and the carriage takes him with it
      p.onGround = true; p.frozen = true; }
    if (run.cam) { const tg = run.arrive ? { x: run.cam.lx, y: run.cam.ly - 1.2, z: run.cam.lz } : (run.t < 1.3 ? p : car), /* coming in, the camera holds on the platform and lets the train roll into the picture; leaving, it follows the carriage */ tx = tg.x, ty = (tg.y || 0) + (tg === p ? 1.0 : 1.2), tz = tg.z; const c = run.cam; c.lx += (tx - c.lx) * Math.min(1, dt * 4); c.ly += (ty - c.ly) * Math.min(1, dt * 4); c.lz += (tz - c.lz) * Math.min(1, dt * 4);
      G.cutCam = { x: c.x, y: c.y, z: c.z, yaw: Math.atan2(-(c.lx - c.x), -(c.lz - c.z)), pitch: Math.atan2(c.ly - c.y, Math.hypot(c.lx - c.x, c.lz - c.z)) }; } // the camera stands on the platform and turns its head to watch
    if (run.t >= run.dur && run.done) { const cb = run.done; run.done = null; if (run.arrive) trains.delete(v.id); cb(); } // a train that has left stays gone until the journey is over
  }
  // ---- the train's little films: words over people's heads, and a camera that stands still and watches ----
  const bubbles = [];
  function say(x, y, z, text, secs, on) { const el = document.createElement('div'); el.textContent = text; el.style.cssText = 'position:fixed;z-index:30;max-width:52vw;padding:6px 11px;border-radius:13px;background:#fffdf4;color:#2a2318;font:600 13px/1.25 system-ui,sans-serif;box-shadow:0 2px 7px rgba(0,0,0,.4);transform:translate(-50%,-100%);pointer-events:none;white-space:normal;text-align:center;width:max-content;'; if (on) { el.style.font = '600 12px/1.2 system-ui,sans-serif'; el.style.padding = '4px 9px'; el.style.opacity = '0.95'; el.style.zIndex = '6'; } document.body.appendChild(el); bubbles.push({ x, y, z, el, on: on || null, soft: !!on, until: performance.now() + secs * 1000 }); } // on: somebody the words stay over as they move
  function tickBubbles() { const now = performance.now(); for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; if (now > b.until || (b.on && b.on.hidden)) { b.el.remove(); bubbles.splice(i, 1); continue; } const q = b.on ? R.project(b.on.x, b.on.y + (b.on.sayH || 2.05 * (b.on.scale || 1)), b.on.z) : R.project(b.x, b.y, b.z); if (!q || !q.on) { b.el.style.display = 'none'; continue; } b.el.style.display = ''; b.el.style.left = q.x + 'px'; b.el.style.top = (q.y - 6) + 'px'; } }
  function filmCam(v, rl, p) { // a place to stand and watch from: somewhere round the carriage with a clear sight of it and of the engine, on his side of the line if there is one
    const W = (al, pp) => rl.ax ? [al, rl.line + 0.5 + pp] : [rl.line + 0.5 + pp, al], car = W(rl.along0 + 0.5 + rl.sgn * 2, 0), eng = W(rl.along0 + 0.5 + rl.sgn * 4.9, 0);
    const perpOf = rl.ax ? p.z - (rl.line + 0.5) : p.x - (rl.line + 0.5), side0 = perpOf >= 0 ? 1 : -1;
    const open = (x, y, z) => { const b = world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)); return b === B.AIR || (!isSolid(b) && b !== B.LAMP && b !== B.FENCE && b !== B.PALISADE && !isLeaf(b)); }; // nothing in the way, not even a fence or a lamp post
    const sees = (x, y, z, t) => { const tx = t[0], ty = rl.y + 1.3, tz = t[1], d = Math.hypot(tx - x, ty - y, tz - z), n = Math.ceil(d / 0.4); for (let i = 0; i < n - 2; i++) { const k = i / n; if (!open(x + (tx - x) * k, y + (ty - y) * k, z + (tz - z) * k)) return false; } return true; };
    let best = null;
    for (const hgt of [2.4, 3.6]) for (const dist of [7.5, 6, 4.5]) for (let k = 0; k < 16; k++) { const ang = k / 16 * 6.283, x = car[0] + Math.cos(ang) * dist, z = car[1] + Math.sin(ang) * dist, y = rl.y + hgt; if (!open(x, y, z) || !open(x, y - 1, z)) continue;
      const pp = rl.ax ? z - (rl.line + 0.5) : x - (rl.line + 0.5); if (Math.abs(pp) < 2.2) continue; // not on the track itself: the train has to get past
      const sc = (sees(x, y, z, car) ? 4 : 0) + (sees(x, y, z, eng) ? 2 : 0) + ((pp >= 0 ? 1 : -1) === side0 ? 1 : 0) + dist * 0.1 - (hgt > 3 ? 0.3 : 0); if (sc >= 4 && (!best || sc > best.sc)) best = { sc, x, y, z, side: pp >= 0 ? 1 : -1 }; }
    if (!best) { const [x, z] = W(rl.along0 + 0.5 + rl.sgn * 2, side0 * 3); best = { x, y: rl.y + 5.5, z, side: side0 }; } // nowhere clear: look down on it from above the platform
    return { x: best.x, y: best.y, z: best.z, lx: car[0], ly: rl.y + 1.3, lz: car[1], side: best.side };
  }
  // every ride: you see yourself walk to the carriage and sit down, the whistle goes, the train rolls away with you, and then the dark and the journey
  function boardTrain(v, done) {
    if (typeof Fields !== 'undefined' && Fields.shunRail()) { UI.toast('The stationmaster shakes his head. Men in black neckerchiefs have been asking up and down the line for somebody of your build. No train for you until it blows over.', 'bad'); return false; }
    const rl = trainOf(v); if (!rl) return false; const p = G.player, cam = filmCam(v, rl, p), W = (al, pp) => rl.ax ? [al, rl.line + 0.5 + pp] : [rl.line + 0.5 + pp, al];
    const carA = rl.along0 + 0.5 + rl.sgn * 2, st = W(carA, cam.side * 2.6), yaw = rl.ax ? (rl.sgn > 0 ? Math.PI / 2 : -Math.PI / 2) : (rl.sgn > 0 ? 0 : Math.PI), lo = W(rl.along0 + 0.5 + rl.sgn * 4.9, 0);
    trains.set(v.id, { t: 0, off: 0, wait: 2.1, dur: 5.6, puffT: 0, rider: true, cam, start: st, y0: rl.y + 0.05, whistle: 1.75, lines: [{ t: 1.5, at: () => [lo[0], rl.y + 3.3, lo[1]], text: 'All aboard!', secs: 1.8 }], done: () => { done(); } });
    p.frozen = true; p.wasThird = G.thirdPerson; G.thirdPerson = true; p.x = st[0]; p.z = st[1]; p.y = rl.y + 0.05; p.yaw = yaw + Math.PI;
    UI.sfx('quest'); return true;
  }
  // the first time, when a station is put right: the train comes in, and the town says what it thinks
  function trainFilm(v) {
    const rl = trainOf(v); if (!rl || trains.has(v.id)) return false; if (typeof UI !== 'undefined' && UI.closePanel) { try { UI.closePanel(); } catch (e) {} } const p = G.player, cam = filmCam(v, rl, p);
    const folk = (v.npcs || []).filter(n => !n.hidden && n.y != null && Math.hypot(n.x - cam.lx, n.z - cam.lz) < 9).sort((a, b) => Math.hypot(a.x - cam.x, a.z - cam.z) - Math.hypot(b.x - cam.x, b.z - cam.z)).slice(0, 3), W = (al, pp) => rl.ax ? [al, rl.line + 0.5 + pp] : [rl.line + 0.5 + pp, al];
    const spot = (i) => () => { const n = folk[i]; if (n) return [n.x, n.y + 2.4, n.z]; const [x, z] = W(rl.along0 + 0.5 + rl.sgn * (i * 2 - 1), cam.side * 2.4); return [x, rl.y + 2.4, z]; };
    p.frozen = true; p.wasThird = G.thirdPerson; G.thirdPerson = true;
    trains.set(v.id, { t: 0, off: 30, from: 30, dur: 6.2, puffT: 0, arrive: true, cam, whistle: 0.5, lines: [{ t: 0.9, at: spot(0), text: RIDE() === 'Glide' ? 'Look. The beam is lit!' : RIDE() === 'Rig' ? 'Hear that? That is her horn!' : 'Listen. That is her whistle!' }, { t: 2.6, at: spot(1), text: 'The line is open again.' }, { t: 4.3, at: spot(2), text: `First ${RIDE()} into ${v.name} in years.` }],
      done: () => { p.frozen = false; if (p.wasThird != null) { G.thirdPerson = p.wasThird; p.wasThird = null; } G.cutCam = null; UI.toast(`${v.name} station is open. Talk to the stationmaster to ride.`, 'good'); } });
    return true;
  }
  function trainArrive(v) { const p = G.player; if (p.wasThird != null) { G.thirdPerson = p.wasThird; p.wasThird = null; } G.cutCam = null; G.hideMe = false; trains.delete(v.id); }
  function ferryMesh() {
    return R.entityMesh('ferry', (mb) => {
      const hull = [0.42, 0.27, 0.16], trim = [0.86, 0.82, 0.72], red = [0.62, 0.15, 0.13], dark = [0.12, 0.11, 0.1], glass = [0.62, 0.8, 0.9], brass = [0.85, 0.68, 0.3];
      // the hull: long along z, narrowing to a bow at +z
      mb.box(-0.9, 0.0, -2.2, 0.9, 0.7, 1.4, hull); mb.box(-0.6, 0.05, 1.4, 0.6, 0.7, 2.2, hull); mb.box(-0.3, 0.1, 2.2, 0.3, 0.7, 2.6, hull);
      mb.box(-0.95, 0.65, -2.25, 0.95, 0.78, 1.45, trim); mb.box(-1.0, 0.25, -2.2, 1.0, 0.35, 1.4, red);
      // the deckhouse with windows, a funnel, a mast
      mb.box(-0.65, 0.78, -1.6, 0.65, 1.75, 0.4, trim); mb.box(-0.68, 1.15, -1.3, 0.68, 1.45, 0.1, glass); mb.box(-0.75, 1.75, -1.7, 0.75, 1.85, 0.5, red);
      mb.tube([[0, 1.85, -0.9], [0, 2.7, -0.9]], [0.18, 0.2], dark, { segs: 10, cap0: 'flat', cap1: 'flat' }); mb.tube([[0, 2.45, -0.9], [0, 2.6, -0.9]], [0.205, 0.205], red, { segs: 10, cap0: 'none', cap1: 'none' });
      mb.tube([[0, 0.78, 1.2], [0, 3.0, 1.2]], [0.05, 0.04], dark, { segs: 6, cap0: 'flat', cap1: 'flat' }); mb.ball(0, 3.05, 1.2, 0.08, brass, { n: 2 });
      // a lifebuoy on the deckhouse wall
      mb.tube([[0.66, 1.3, -0.6], [0.72, 1.3, -0.6]], [0.18, 0.18], [0.95, 0.4, 0.3], { segs: 10, cap0: 'flat', cap1: 'flat' });
    });
  }
  function ferryPieces(v) {
    if (!v || v.type !== 'sea' || !isFreed(v.id)) return [];
    const t = performance.now() / 1000; const m = ferryMesh();
    return [{ x: v.x + 17.5, y: SEA + 0.5 + Math.sin(t * 1.1) * 0.06, z: v.z - 6.6, yaw: Math.PI / 2 + Math.sin(t * 0.7) * 0.02, model: { height: 3, radius: 2.4 }, mesh: m, scale: 1, hover: 0, skyMul: 1 }];
  }
  function entities() {
    const out = [];
    if (active) out.push(...trainPieces(active), ...ferryPieces(active));
    if (active && (active.style === 'halo' || G.wallDressOn)) { const wm = wallDress(active); /* parked: not yet checked by eye, and the Moon and Halo are to get shapes of their own */ if (wm) out.push({ x: active.x + 0.5, y: active.y, z: active.z + 0.5, yaw: 0, scale: 1, hover: 0, skyMul: 1, isStatue: true, noOutline: true, mesh: wm }); }
    if (active) {
      for (const n of active.npcs) if (!n.hidden) out.push({ x: n.x, y: n.y, z: n.z, yaw: n.yaw, model: n.model, mesh: n.mesh, scale: n.scale || 1, hover: 0, skyMul: 1, src: n });
      if (active.gang && !state(active.id).freed) for (const g of active.gang) { g.yaw = Math.atan2(G.player.x - g.x, G.player.z - g.z); g.y = standY(g.x, g.y, g.z) ?? g.y; out.push(g); } /* the ones waiting their turn stand behind the first and watch you */
      for (const g of active.guardEnts) if (g.kin.hp > 0) out.push({ x: g.x, y: g.y, z: g.z, yaw: g.yaw, model: g.model, mesh: g.mesh, scale: 1, hover: (g.model.hover || 0) + (g.leap || 0) + (g.hitT > 0 ? Math.sin(g.hitT * 60) * 0.08 : 0), skyMul: 1, isMount: true, src: g });
      for (const g of active.guardEnts) if (g.hitT > 0) g.hitT -= 0.016;
    }
    for (const r of runners) out.push(r.e); /* the creature itself, so its legs and face keep going */
    for (const n of loose) if (!n.hidden) out.push({ x: n.x, y: n.y + (n.lift || 0), z: n.z, yaw: n.yaw, model: n.model, mesh: n.mesh, scale: 1, hover: 0, skyMul: 1, src: n });
    if (fisher && world.preset.fisher) out.push({ x: fisher.x, y: fisher.y, z: fisher.z, yaw: fisher.yaw, model: fisher.model, mesh: fisher.mesh, scale: 1, hover: 0, skyMul: 1, src: fisher });
    if (activeHermit && activeHermit.npcs) for (const n of activeHermit.npcs) out.push({ x: n.x, y: n.y, z: n.z, yaw: n.yaw, model: n.model, mesh: n.mesh, scale: 1, hover: 0, skyMul: 1, src: n });
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
    if (entry.service === 'locked') { UI.toast(entry.sub || 'Not yet.'); return false; }
    if (entry.service === 'game') { const v = active, st = gameStats(v), day = G.dayCount || 0, first = entry.champ.split(' ')[0]; if (st.day !== day) { st.day = day; st.n = 0; }
      if (st.n >= 5) { UI.toast(`${first} has played enough for one day. Come back tomorrow.`); return false; } if (G.shards < entry.stake) { UI.toast('You have not got the stake.', 'bad'); return false; }
      G.shards -= entry.stake; st.n++; UI.closePanel(); // the stake is on the table before the first move: walk away and it stays there
      Games.play(entry.game, { champ: entry.champ, stake: entry.stake, skill: entry.skill, onEnd: (res) => {
        if (res === 'win') { G.shards += entry.stake * 2; st.won++; if (entry.game === 'signal') G.stats.signalWon = (G.stats.signalWon || 0) + 1; UI.sfx('caught'); UI.toast(`${entry.stake} shards off ${first}.`, 'good'); if (st.won === 3) UI.toast(`They chalk your name over the board: champion of ${v.name}.`, 'good'); }
        else if (res === 'draw') { G.shards += entry.stake; UI.toast('A draw. You take your stake back.'); } else { st.lost++; UI.toast(`${first} takes your ${entry.stake} shards.`, 'bad'); }
        if (G.save) G.save(); } });
      return true; }
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
    if (entry.service === 'rest' && /\bbed\b/i.test(entry.name || '')) { /* a bed is a night's sleep: the hours go by and you wake in the morning */ if (G.kin.every(k => k.hp >= KIN.stats(k).hp) && !G.isNightNow()) { UI.toast('Nobody is tired and it is broad day. The bed will keep until dark.'); return false; } if (G.shards < price) { UI.toast('Not enough Shards.', 'bad'); return false; } G.shards -= price; if (UI.closePanel) UI.closePanel(); G.restTo('bed', (slept) => { for (const k of G.kin) k.hp = KIN.stats(k).hp; G.player.hp = G.player.maxHp; UI.sfx('caught'); UI.toast(slept ? 'Morning. Clean sheets, and every Kin up and whole.' : 'A couple of hours with your boots off. Every Kin is whole again.', 'good'); }); return true; }
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
    const nightsToTyrant = null, daysLeft = (!v.founded && st.freed && st.lastVisit != null) ? Math.max(0, AWAY - ((G.dayCount || 0) - st.lastVisit)) : null;
    return { daysLeft, st, lvl, next, guards, cap: guardCap(st), def, raid, need, wall, tyrant: bossLevelFor(v), nightsToTyrant, income: incomeFor(v, st), amen: amenCount(v, st), canExpand: v.type === 'land' && !v.founded && !st.expanded && !v.R, canBuild: v.type === 'land' && !v.founded && st.expanded && !v.R, slotsLeft: SLOTS.length - st.shops.length, EXPAND, SHOP_BUILD, costText, canPay, report: st.report, hasPost: hasAmen(v, st, 'post'), dome: !!st.dome, canDome: v.type === 'land' && !st.dome, hasDomeKit: G.player.has('kit_dome') };
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
    s += 'A village is held by one tyrant, a town by two, a city by all three. A place you free thanks you once and stays free while you look in on it: stay away twelve days and they walk back in. Raiders still hit the walls at night; station guards from the headman\'s ledger. Only a village you founded yourself pays you by the day.<br>';
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
  // which quarter of a city a spot is in (null in the square, on the castle hill, or outside a city)
  function quarterAt(v, x, z) { if (!v || !v.R || v.size !== 'city' || (MATS[v.style] || MATS.land) !== MATS.land) return null; const dx = x - v.x, dz = z - v.z, m = Math.max(Math.abs(dx), Math.abs(dz)); if (m > v.R - 4 || m <= 7 || (Math.abs(dx) <= 14 && dz <= -v.R + 28)) return null; return QUARTERS[quarterOf(dx, dz)].name; }
  return { gameOf, bossLevel: (v) => bossLevelFor(v), doorLocked, bossBeaten, makeNpc, addLoose: (n) => { if (!loose.includes(n)) loose.push(n); }, dropLoose: (n) => { const i = loose.indexOf(n); if (i >= 0) loose.splice(i, 1); }, designerWall, wallRadiusOf: (v) => wallRadius(state(v.id)), atlantis: () => { if (world && world.preset.id === 'earth') plan(); return ATL; }, planned: () => { plan(); return (PLANNED || []).map(v => siteFor(Math.floor(U.mod(v.x, WORLD_W) / CELL), Math.floor(U.mod(v.z, WORLD_W) / CELL)) || v); }, railAt, quarterAt, plotsOf, plotPrice, ownsPlotAt, buyPlot, enterShow, thiefCaught, layout, townList, init, stamp, restoreStart, update, pick, talk, entities, buy, boardTrain, trainArrive, trainFilm, trainOf, sell, sellValue, raiseDome, shopDef, freed, onBossGone, lieutenantDown, tableChallenge, placeKit, portalList, portalHere, markers, wakeDialogue, questTarget, dawn, pendingIncome, foundingInfo, foundVillage, summaryHtml, ledger, station, recall, upgradeWall, repairWall, expand, build, postShop, levelOf, SHOPS, WALLS,
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
