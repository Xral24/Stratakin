'use strict';
// Quest chain down to the Heart, plus a repeatable bounty. Crafting recipes live here too.
const RECIPES = [
  { id: 'torch', out: 'torch', n: 4, needs: { wood: 1, glowworm: 1 } },
  { id: 'torch_ember', out: 'torch', n: 4, needs: { wood: 1, ember: 1 } },
  { id: 'snare', out: 'snare', n: 2, needs: { wood: 2, stone: 2 } },
  { id: 'snare2', out: 'snare2', n: 2, needs: { iron: 1, void: 1 } },
  { id: 'snare_sky', out: 'snare_sky', n: 2, needs: { snare: 2, feather: 3 }, when: G => !!(typeof Campaign !== 'undefined' && Campaign.C().flightSnare) },
  { id: 'fusion', out: 'fusion', n: 1, needs: { stone: 6, copper: 2, ember: 1 } },
  { id: 'tonic_heal', out: 'tonic_heal', n: 1, needs: { berry: 3 } },
  { id: 'tonic_revive', out: 'tonic_revive', n: 1, needs: { berry: 6, ess_Bloom: 1, ess_Light: 1 } },
  { id: 'tonic_vigor', out: 'tonic_vigor', n: 1, needs: { berry: 4, ess_Bloom: 1 } },
  { id: 'tonic_might', out: 'tonic_might', n: 1, needs: { berry: 4, ess_Flame: 1 } },
  { id: 'tonic_swift', out: 'tonic_swift', n: 1, needs: { berry: 4, ess_Gale: 1 } },
  { id: 'tonic_swift2', out: 'tonic_swift', n: 1, needs: { berry: 4, ess_Spark: 1 } },
  { id: 'tonic_vigor2', out: 'tonic_vigor', n: 1, needs: { berry: 4, ess_Tide: 1 } },
  { id: 'tonic_might2', out: 'tonic_might', n: 1, needs: { berry: 4, ess_Stone: 1 } },
  { id: 'planks', out: 'planks', n: 4, needs: { wood: 1 } },
  ...['Flame', 'Tide', 'Bloom', 'Stone', 'Gale', 'Frost', 'Spark', 'Void', 'Light'].map(e => ({ id: 'lure_' + e, out: 'lure_' + e, n: 1, needs: { berry: 3, ['ess_' + e]: 1 }, cat: 'tonics' })),
  { id: 'glass', out: 'glass', n: 4, needs: { sand: 4, ember: 1 } },
  { id: 'ironwall', out: 'ironwall', n: 4, needs: { iron: 2, stone: 2 } },
  { id: 'voidwall', out: 'voidwall', n: 4, needs: { iron: 3, void: 1 } },
  { id: 'door', out: 'door', n: 1, needs: { planks: 4 }, cat: 'blocks' },
  { id: 'ladder', out: 'ladder', n: 4, needs: { planks: 3 }, cat: 'blocks' },
  { id: 'target', out: 'target', n: 2, needs: { planks: 2, frond: 2 }, cat: 'blocks' },
  ...ELEMENTS.map(e => ({ id: 'stone_' + e, out: 'stone_' + e, n: 1, needs: { ['ess_' + e]: 3, iron: 1 } })),
  { id: 'arrow', out: 'arrow', n: 6, needs: { wood: 1, stone: 1, frond: 1 } },
  { id: 'arrow_ember', out: 'arrow_ember', n: 4, needs: { wood: 1, ember: 1, frond: 1 } },
  { id: 'chest', out: 'chest', n: 1, needs: { planks: 8, iron: 1 }, cat: 'blocks' },
  { id: 'kit_house', out: 'kit_house', n: 1, needs: { planks: 20, glass: 4 }, cat: 'builds' },
  { id: 'kit_bakery', out: 'kit_bakery', n: 1, needs: { planks: 24, glass: 4, ember: 2 }, cat: 'builds' },
  { id: 'kit_juice', out: 'kit_juice', n: 1, needs: { planks: 24, glass: 4, berry: 6 }, cat: 'builds' },
  { id: 'kit_trader', out: 'kit_trader', n: 1, needs: { planks: 24, glass: 4, copper: 3 }, cat: 'builds' },
  { id: 'kit_voodoo', out: 'kit_voodoo', n: 1, needs: { planks: 20, basalt: 6, void: 2 }, cat: 'builds' },
  { id: 'kit_post', out: 'kit_post', n: 1, needs: { planks: 24, glass: 4, iron: 3 }, cat: 'builds' },
  { id: 'kit_wall', out: 'kit_wall', n: 1, needs: { planks: 14 }, cat: 'builds' },
  { id: 'kit_wall_stone', out: 'kit_wall_stone', n: 1, needs: { stone: 14 }, cat: 'builds' },
  { id: 'kit_wall_iron', out: 'kit_wall_iron', n: 1, needs: { ironwall: 14 }, cat: 'builds' },
  { id: 'kit_bridge', out: 'kit_bridge', n: 1, needs: { planks: 16, wood: 4 }, cat: 'builds' },
  { id: 'kit_portal', out: 'kit_portal', n: 1, needs: { void: 4, iron: 4, glass: 4, cloud: 2 }, cat: 'builds' },
  { id: 'rod_iron', out: 'rod_iron', n: 1, needs: { rod: 1, iron: 3, copper: 2 }, cat: 'gear' },
  { id: 'rod_void', out: 'rod_void', n: 1, needs: { rod_iron: 1, void: 3, ess_Tide: 1 }, cat: 'gear' },
  { id: 'bait_berry', out: 'bait_berry', n: 4, needs: { berry: 2 }, cat: 'gear' },
  { id: 'tonic_hush', out: 'tonic_hush', n: 1, needs: { frond: 4, snow: 2, glowworm: 1 }, cat: 'tonics' },
  { id: 'bait_glow', out: 'bait_glow', n: 3, needs: { glowworm: 1, berry: 1 }, cat: 'gear' },
  { id: 'bait_void', out: 'bait_void', n: 2, needs: { void: 1, berry: 2 }, cat: 'gear' },
  { id: 'selglass', out: 'selglass', n: 4, needs: { selenite: 1, glass: 4 }, cat: 'blocks' },
  { id: 'moonlamp', out: 'moonlamp', n: 4, needs: { selenite: 1, starsalt: 1 }, cat: 'blocks' },
  { id: 'kit_dome', out: 'kit_dome', n: 1, needs: { selglass: 24, tycho: 8, selenite: 8 }, cat: 'builds' },
  { id: 'reeffins', out: 'reeffins', n: 1, needs: { coral: 8, frond: 4, iron: 1 }, cat: 'gear' },
  { id: 'pick', out: 'pick', n: 1, needs: { diamond: 2, iron: 3, wood: 2 }, cat: 'gear' },
  { id: 'lunarplate', out: 'lunarplate', n: 1, needs: { tycho: 4, selenite: 2 }, cat: 'kin' },
  { id: 'tychofang', out: 'tychofang', n: 1, needs: { tycho: 3, iron: 2 }, cat: 'kin' },
  { id: 'starcharm', out: 'starcharm', n: 1, needs: { starsalt: 4, selenite: 2 }, cat: 'kin' },
  { id: 'amberheart', out: 'amberheart', n: 1, needs: { amber: 4, ringshard: 1 }, cat: 'kin' },
  { id: 'sulfurfang', out: 'sulfurfang', n: 1, needs: { sulfur: 4, iron: 3 }, cat: 'kin' },
  { id: 'ringplate', out: 'ringplate', n: 1, needs: { ringshard: 2, amber: 4, iron: 4 }, cat: 'kin' },
  { id: 'coralcrown', out: 'coralcrown', n: 1, needs: { coral: 6, pearl: 1 }, cat: 'kin' },
  { id: 'diamondfang', out: 'diamondfang', n: 1, needs: { diamond: 2, gold: 2 }, cat: 'kin' },
  { id: 'goldcharm', out: 'goldcharm', n: 1, needs: { gold: 4, diamond: 1 }, cat: 'kin' },
  { id: 'claw', out: 'claw', n: 1, needs: { iron: 2, copper: 2, ember: 1 }, cat: 'kin' },
  { id: 'fang', out: 'fang', n: 1, needs: { copper: 3, ess_Spark: 1 }, cat: 'kin' },
  { id: 'voidfang', out: 'voidfang', n: 1, needs: { iron: 3, void: 2, ess_Void: 1 }, cat: 'kin' },
  { id: 'vest', out: 'vest', n: 1, needs: { iron: 3, frond: 4 }, cat: 'kin' },
  { id: 'plate', out: 'plate', n: 1, needs: { basalt: 6, iron: 2 }, cat: 'kin' },
  { id: 'mantle', out: 'mantle', n: 1, needs: { void: 3, iron: 3, ess_Void: 1 }, cat: 'kin' },
  { id: 'windcharm', out: 'windcharm', n: 1, needs: { frond: 3, cloud: 2 }, cat: 'kin' },
  { id: 'lens', out: 'lens', n: 1, needs: { glass: 2, void: 1 }, cat: 'kin' },
  { id: 'emberheart', out: 'emberheart', n: 1, needs: { ember: 4, ess_Flame: 1 }, cat: 'kin' },
];

const QUESTS = [
  { id: 'village', title: 'Free the Village', desc: 'Grakor the Tyrant holds the village by your camp and keeps its people shut in their homes. A fresh starter can take it; a second Kin makes it safe. Tap the blue camp fire to revive and heal everyone if it goes wrong.', hint: 'Free the village: beat Grakor in the square', check: G => G.stats.villageFreed ? 1 : 0, reward: { items: { snare: 1, shovel: 1, hatchet: 1 }, xp: 40 } },
  { id: 'timber', title: 'Timber', desc: 'The village gave you a hatchet and a shovel. Your hands only pick plants and berries; the hatchet cuts wood. Hold your finger (or left mouse) on a tree trunk until it gives: the whole tree comes down and every log in it is yours. Collect 6 wood.', hint: 'Fell a tree: hold your finger on the trunk', check: G => G.stats.got.wood / 6, reward: { items: { snare: 1 }, xp: 10 } },
  { id: 'foreman', title: 'The Mining Camp', desc: 'A Snare Cube needs stone, and stone needs a pick: no shovel will bite it. There is a mining camp out past the village: a headframe over a shaft, and a crew. Find Foreman Garrick (⛏ on the map) and ask for a pick.', hint: 'Talk to Foreman Garrick at the Mining Camp', check: G => (G.stats.camp || {}).pick ? 1 : 0, reward: { xp: 25 } },
  { id: 'snare', title: 'Snare Cube', desc: 'Dig two stone blocks with the stone pick (slow, hard work: stone takes about five times longer than dirt) and craft a Snare Cube at a Fusion Table. There is one in the foreman\'s hut.', hint: 'Craft a Snare Cube at a table (2 wood, 2 stone)', check: G => (G.stats.crafted.snare || 0) >= 1 ? 1 : 0, reward: { xp: 15 } },
  { id: 'catch', title: 'First Kin', desc: 'Find a wild Kin. Weaken it in battle, then set a snare. Sneak up from behind for a bonus.', hint: 'Catch a wild Kin', check: G => G.stats.caught >= 1 ? 1 : 0, reward: { items: { snare: 2 }, xp: 20 } },
  { id: 'ember', title: 'A Warm Glow', desc: 'It is dark down a mine. Pick a Glowworm out of the grass (fat little lights in the plains, forests and swamps, brightest at night), or dig an Ember Ore.', hint: 'Pick 1 Glowworm (glowing in the grass)', check: G => Math.min(1, (G.stats.got.glowworm || 0) + (G.stats.got.ember || 0)), reward: { xp: 15 } },
  { id: 'torch', title: 'Light the Dark', desc: 'Craft torches at a Fusion Table (1 wood + 1 glowworm, or 1 wood + 1 ember). The mining camp has a table in the foreman\'s hut.', hint: 'Craft torches', check: G => (G.stats.crafted.torch || 0) >= 1 ? 1 : 0, reward: { items: { snare: 1 }, xp: 15 } },
  { id: 'mines', title: 'Into the Mines', desc: 'Climb down the shaft at the mining camp (the ladder is on the side) to the gallery at the bottom. Ore shows in the walls: copper brown-green, iron pale, ember orange, void purple.', hint: 'Go down the shaft into the Mines', check: G => G.stats.reachedMines ? 1 : 0, reward: { xp: 30 } },
  { id: 'ironpick', title: 'A Proper Pick', desc: 'Garrick will make you an iron pick for six copper and four iron. With it you can break void crystal, gold and diamond.', hint: 'Bring Garrick 6 copper and 4 iron', check: G => ((G.stats.camp || {}).pick || 0) >= 2 ? 1 : 0, reward: { xp: 50 } },
  { id: 'party', title: 'Company', desc: 'Catch Kin until you have 4. Different layers and biomes have different Kin, and every area has its regulars.', hint: 'Have 4 Kin', check: G => G.kin.length / 4, reward: { items: { snare: 2 }, xp: 30 } },
  { id: 'fuse', title: 'Fuse two Kin', desc: 'Fusing Kin is not the same as crafting: it takes two particular Kin and an element stone, and makes a new Kin. You already know two Kin recipes (tap the table, choose Fuse Kin, and they are listed under the slots). Catch the pair, craft the stone (3 essences and an iron), put all three on the table. Quest people teach you more.', hint: 'Fuse a Kin recipe: tap the table, choose Fuse Kin', check: G => G.stats.fused >= 1 ? 1 : 0, reward: { xp: 60 , items: { draught: 1 } } },
  { id: 'fisher', title: 'Old Brannock', desc: 'The old fisherman on the shore by the village has a rod for you, if you ask. Catch your first fish and go back and tell him.', hint: 'Get a rod from Brannock, catch a fish, tell him', check: G => ((G.stats.camp || {}).rod || 0) >= 2 ? 1 : 0, reward: { xp: 60 } },
  { id: 'diver', title: 'Under the Water', desc: 'Nobody breathes under water, not even on a fish. Marisol the diver (◍ on the map) makes Breathing Bulbs, if you bring the makings, and she has a favour to ask.', hint: 'Get a bulb from Marisol and dive for her chest', check: G => (G.stats.camp || {}).bulbDone ? 1 : 0, reward: { xp: 90 } },
  { id: 'ranch', title: 'Hale\'s Ranch', desc: 'You cannot ride a Kin you have not broken in, and nobody will teach you but Dusty Hale (♞ on the map). He needs a paddock built first, and there is a wild one nobody can stay on.', hint: 'Build Hale\'s paddock and ride out Thunderhoof', check: G => (G.stats.camp || {}).rogueTamed ? 1 : 0, reward: { xp: 120 , items: { draught: 1 } } },
  { id: 'frost', title: 'Lost in the Snow', desc: 'Up in the snowfields a woman called Ysolde has a camp, and a brother who has not come home. The cold up there kills. Find her, then find him.', hint: 'Find Ysolde\'s camp in the snow, and her brother', check: G => ((G.stats.camp || {}).frost || 0) >= 4 ? 1 : 0, reward: { xp: 150 } },
  { id: 'glider', title: 'The Nest', desc: 'Old Wren the hermit lives under the tallest peak around, and a sky Kin nests on a pillar of rock beside it. You can only reach the pillar one way: from the peak, on a glider. Bring the egg down and walk it until it hatches.', hint: 'Get Old Wren\'s glider and glide to the nest', check: G => (G.stats.camp || {}).skyEgg ? 1 : 0, reward: { xp: 200 } },
  { id: 'kinmaster', title: 'The Kinmaster', desc: 'Grakor had a letter on him, sealed in purple: every tyrant answers to someone. The Kinmaster, in his fortress Thornhold, out past the hills (♜). Getting in will take everything you have learned: a Flame Kin to burn his thorns, the glider, the bulb, a Spark Kin and a Stone Kin. His walls cannot be broken.', hint: 'Get through Thornhold and face the Kinmaster', check: G => (G.stats.camp || {}).kinmaster ? 1 : 0, reward: { xp: 400, items: { snare2: 3 } } },
  { id: 'void', title: 'Deep Crystal', desc: 'Void Crystal glows purple below y 22. You need the iron pick for it. Bring one back.', hint: 'Mine a Void Crystal (below y 22)', check: G => Math.min(1, G.stats.got.void || 0), reward: { items: { snare2: 2 }, xp: 40 } },
  { id: 'lavasuit', title: 'Suit Up', desc: 'Under the basalt the Core is so hot it cooks you where you stand. Only Garrick knows how to make a Lava Suit that keeps the heat off. Ask him.', hint: 'Get a Lava Suit from Garrick', check: G => G.player.has('lavasuit') ? 1 : 0, reward: { xp: 60 } },
  { id: 'core', title: 'The Core', desc: 'Dig through the basalt ceiling beneath the Mines (below y 14), anywhere you like. Where you come out is luck: a lava lake, a cave, a seam of ore. Expect Flame and Void Kin far above your level.', hint: 'Reach the Core (y below 14)', check: G => G.stats.reachedCore ? 1 : 0, reward: { xp: 80 } },
  { id: 'job', title: 'Odd Jobs', desc: 'People sit by little fires all over the world, and the Moon and Halo too, each with a job: fetch this, beat that, carry a parcel, clear a den. Yellow dots on the map. Some of them pay in amulets, which nobody sells.', hint: 'Do a job for someone on the road', check: G => (G.stats.questsDone || 0) >= 1 ? 1 : 0, reward: { xp: 120 } },
  { id: 'lab', title: 'The Splice', desc: 'Somewhere out there an apprentice waits by a tent: her master is shut in his own lab with the thing he made. Find her, follow ⚗ to the hatch, and beat or cage what is down there. The incubator is the reward: Kin grow fast in it and learn techniques.', hint: 'Find the apprentice by the tent and rescue the maker', check: G => (G.stats.labDone || 0) >= 1 ? 1 : 0, reward: { xp: 400 , items: { draught: 1 } } },
  { id: 'skyroot', title: 'The Skyroot', desc: 'The elder of the first village you freed told you about a tree taller than the hills, the Skyroot (🌳 on the map), with a ladder nailed up its trunk. The folk who climbed it came back talking about the Tangle: scraps of cloud on rope bridges one block wide, climbing and dropping and doubling back, and something nesting at the far end. Climb it, cross it, beat what lives there.', hint: 'Climb the Skyroot and cross the Tangle', check: G => ((G.stats.sky || {}).tangleDone) ? 1 : 0, reward: { xp: 250, items: { windcharm: 1, tonic_heal: 2 } } },
  { id: 'sky', title: 'Highmere', desc: 'Captain Merrow at the Flying School says there is a city above the clouds, Highmere, and no glider and no train will get you there. Only wings. Raise a flying Kin to level 20 (you need trainer level 18 to ride one), then fly it up to the city (☁ on the map).', hint: 'Fly a level 20 Kin up to Highmere', check: G => (G.stats.sky || {}).seen_highmere ? 1 : 0, reward: { xp: 150 } },
  { id: 'lost', title: 'The Lost World', desc: 'People by the fires talk about a dinosaur someone caught. Barnaby Quill keeps it in his menagerie (🦎 on the map). Ask him where it came from, then find the two people out in the trapper country who each have half a map. Your Kindex will read it. Then follow 🦖.', hint: 'Find the dinosaur, then the two halves of the map', check: G => G.stats.lostFound ? 1 : 0, reward: { xp: 500 } },
  { id: 'abyss', title: 'Abyssaurus', desc: 'Something circles the deep water outside the Lost World cliffs, level 160, and comes up for air now and then. A water mount helps.', hint: 'Beat or cage Abyssaurus in the sea by the Lost World', check: G => (G.stats.apex || {}).mosa ? 1 : 0, reward: { xp: 5000 } },
  { id: 'rex', title: 'The Tyrant', desc: 'In the clearing at the middle of the Lost World stands Tyrannorex, level 170. Beating it is not enough: it limps off and comes back in about ten days. Cage it. Your snare strength is twice your trainer level, and nothing above twice that will stay caged: you need trainer level 43 to have any chance, and more like 70 for real odds.', hint: 'Cage Tyrannorex in the Lost World', check: G => (G.stats.apex || {}).rex === true ? 1 : 0, reward: { xp: 5000 , items: { draught: 1 } } },
  { id: 'holds', title: 'The Twelve Holds', desc: 'The Kinmaster bound his warriors with a crystal and broke it into twelve shards, one in each of his Holds: eleven under grey skies out across Earth, one on the lava in the Core. Take every hold: fight his warriors on foot, then beat the warlord\'s Kin. Each one gives you a shard.', hint: 'Take the Holds (☠ on the map)', check: G => (G.stats.crystal || 0) / Math.max(1, Keeps.sites().length), reward: { xp: 3000 } },
  { id: 'storm', title: 'Stormspire', desc: 'Lady Aurelle of Highmere says the Storm Warden, one of the Kinmaster\'s own, holds a fortress on the clouds far out from the city, and his storm creeps closer. Fly there, beat his warriors on foot, then his Kin.', hint: 'Take Stormspire (⛈ on the map)', check: G => (G.stats.sky || {}).fortTaken ? 1 : 0, reward: { xp: 800 , items: { draught: 1 } } },
  { id: 'citadel', title: 'The Black Citadel', desc: 'The whole crystal knows where he is. Sable at Thornhold will read it for you. Then the Citadel: glide the chasm, burn the thorns, wake the dead gate, swim the flooded hall, break the rubble, shoot the three targets, and end him.', hint: 'End the Kinmaster in the Black Citadel', check: G => G.stats.lightReturned ? 1 : 0, reward: { xp: 6000 } },
  { id: 'scientist', title: 'The Prisoner', desc: 'Someone was knocking on glass behind the throne in the Black Citadel. Go back and let them out.', hint: 'Free the prisoner in the Citadel', check: G => (G.stats.citadel || {}).profFree ? 1 : 0, reward: { xp: 400 } },
  { id: 'ship', title: 'The Starlark', desc: 'Professor Finch built the Kinmaster\'s ships. He kept one back: the Starlark, a prototype. He is finishing it at Garrick\'s forge at the Mining Camp. Bring him 14 iron, 4 gold, 3 diamond, 4 void crystal, 6 ember ore and 8 glass, all at once.', hint: 'Bring Professor Finch his materials (Mining Camp)', check: G => G.player.has('ship') ? 1 : 0, reward: { xp: 600 } },
  { id: 'moon', title: 'Beyond', desc: 'Wear the Space Suit the Starmetal gave you: the Moon has no air. Board the Starship on the surface (select it, tap). Hold jump to climb. Above the clouds, the world lets go of you and asks where to. Mind what you fly into.', hint: 'Fly the Starship above the clouds', check: G => (G.stats.reachedMoon || (G.stats.reached || {}).moon) ? 1 : 0, reward: { xp: 400 } },
  { id: 'halo', title: 'The Ringed World', desc: 'Fly the Starship above the clouds and choose Halo: amber dunes under a ring that fills the sky, brine that burns, stones that fall. Caravan towns to free, amber and sulfur to dig, and ring shards for wings.', hint: 'Fly to Halo', check: G => (G.stats.reached || {}).halo ? 1 : 0, reward: { xp: 600 } },
  { id: 'moonjobs', title: 'Moonfolk', desc: 'The Moon has its own people by its own fires, out on the grey between the domes. They do not trust you yet. Do three of their jobs before anyone tells you where the Selenaut sleeps.', hint: 'Do 3 jobs for people on the Moon', check: G => ((G.stats.jobsBy || {}).moon || 0) / 3, reward: { xp: 600, items: { snare2: 3 } } },
  { id: 'moonfree', title: 'Under the Dome', desc: 'Every alien town on the Moon has a tyrant in its square, the same as on Earth. Free one and its people will open the dome to you and keep your Kin fed.', hint: 'Free a village on the Moon', check: G => Object.values(G.villageState || {}).some(st => st.freed && st.meta && st.meta.world === 'moon') ? 1 : 0, reward: { xp: 800 } },
  { id: 'halojobs', title: 'Caravan Work', desc: 'The caravan people on Halo pay well and talk even better. Three jobs for them and someone will mention the Ringwarden on the high mesa.', hint: 'Do 3 jobs for people on Halo', check: G => ((G.stats.jobsBy || {}).halo || 0) / 3, reward: { xp: 900, items: { snare2: 3, wings: 1 } } },
  { id: 'legend', title: 'Legend', desc: 'With the Tyrannorex in your bag, the old ones notice. Every world beyond Earth has one creature at a level even it does not reach: the Selenaut over the Moon, the Ringwarden on Halo. ✶ on the map. Beat or cage one, and you will hear what still sleeps under Earth.', hint: 'Beat or cage a world\'s legendary (✶ on the map)', check: G => Object.keys(G.stats.legends || {}).length ? 1 : 0, reward: { xp: 2000 } },
  { id: 'heart', title: 'The Heart', desc: 'The Deep Chart marks a chamber far out in the Core with a pedestal of Starmetal, on an island in a lava sea nobody can cross on foot or on a Kin. Halo Wings would do it. Inside, two Wardens patrol in step: find the gap.', hint: 'Find the Heart chamber', check: G => G.stats.heartFound ? 1 : 0, reward: { xp: 100 } },
  { id: 'mythic', title: 'Mantlewyrm', desc: 'The Mythic sleeps on the Starmetal in the Heart. The hardest thing on Earth: catch it (bring Void Snares and a strong, evolved team) or defeat it.', hint: 'Catch or defeat the Mantlewyrm', check: G => G.stats.mythicDone ? 1 : 0, reward: { xp: 500 } },
];

const Quests = (() => {
  let G = null;
  // three arcs that run side by side: the journey (your tools, the people, the worlds), the Dark Arc (the Kinmaster), and the Old Ones (the great Kin)
  const ARC_OF = { kinmaster: 'dark', holds: 'dark', storm: 'dark', citadel: 'dark', scientist: 'dark', ship: 'dark', heart: 'old', mythic: 'old', lost: 'old', abyss: 'old', rex: 'old', legend: 'old' };
  const AFTER = { storm: 'sky', kinmaster: 'glider', heart: 'legend', moon: 'ship', legend: 'ship' };
  const ARCS = { main: { name: 'The Journey', col: '#4fb0ff' }, dark: { name: 'The Dark Arc', col: '#b07aff' }, old: { name: 'The Old Ones', col: '#ffc94a' } };
  const arcList = (a) => QUESTS.filter(q => (ARC_OF[q.id] || 'main') === a);
  function init(game) { G = game; if (!G.questState) G.questState = { index: 0, bounty: { need: 3, done: 0, round: 1 } }; }
  function doneIds() { const out = new Set(); const A = G.questState.arcs || {}; for (const a in ARCS) arcList(a).slice(0, A[a] || 0).forEach(q => out.add(q.id)); return out; }
  function isDone(id) { return doneIds().has(id); }
  function migrate() { // older saves had one long chain: walk each arc forward over everything already true, quietly
    const st = G.questState; st.arcs = { main: 0, dark: 0, old: 0 }; st.focus = st.focus || 'main';
    for (let pass = 0; pass < 3; pass++) for (const a in ARCS) { const L = arcList(a); while (st.arcs[a] < L.length) { const q = L[st.arcs[a]]; let ok = false; try { ok = q.check(G) >= 1; } catch (e) { ok = false; } if (!ok || (AFTER[q.id] && !isDone(AFTER[q.id]))) break; st.arcs[a]++; } }
  }
  function arcCurrent(a) { if (!G.questState.arcs) migrate(); const q = arcList(a)[G.questState.arcs[a]]; return q || null; }
  // some quests wait on an item rather than a quest: the Heart only shows itself to someone holding the Deep Chart
  const NEEDS_ITEM = { heart: ['wings', 'the Halo Wings (finish the caravan jobs on Halo)'], mythic: ['wings', 'the Halo Wings'] };
  function gated(q) { if (!q) return null; if (AFTER[q.id] && !isDone(AFTER[q.id])) return AFTER[q.id]; const ni = NEEDS_ITEM[q.id]; if (ni && G && G.player && !G.player.has(ni[0])) return ni[1]; return null; }
  function current() {
    if (!G.questState.arcs) migrate(); const f = G.questState.focus || 'main';
    for (const a of [f, 'main', 'dark', 'old']) { const q = arcCurrent(a); if (q && !gated(q)) return q; }
    return null;
  }
  function isActive(id) { for (const a in ARCS) { const q = arcCurrent(a); if (q && q.id === id && !gated(q)) return true; } return false; }
  function update() {
    if (!G.questState.arcs) migrate();
    const events = [];
    for (const a in ARCS) {
      const q = arcCurrent(a); if (!q || gated(q)) continue;
      let p = 0; try { p = q.check(G); } catch (e) { p = 0; }
      if (p >= 1) { G.questState.arcs[a]++; G.questState.index = (G.questState.index || 0) + 1; giveReward(q.reward); events.push({ type: 'quest', q, arc: a }); }
    }
    const b = G.questState.bounty;
    if (G.stats.battlesWon - (b.base || 0) >= b.need) {
      b.base = G.stats.battlesWon; b.round++; b.need = 3 + b.round;
      giveReward({ items: { snare: 1 }, xp: 20 * b.round });
      events.push({ type: 'bounty', round: b.round });
    }
    return events;
  }
  function giveReward(r) {
    if (!r) return;
    if (r.items) for (const k in r.items) G.player.add(k, r.items[k]);
    if (r.xp) G.addTrainerXp(r.xp);
  }
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  // you already hold both Kin of a known recipe: the quest points at the table, not the hunt
  function pairReady() { const body = G.world.preset.id; const known = ((G.stats.recipes || {})[body]) || []; const have = new Set(G.kin.map(k => k.sp.seed)); return KIN.recipes(body).some(rc => known.includes(rc.i) && rc.parts.every(sp => have.has(sp.seed))); }
  function dirTo(dx, dz) { const ang = Math.atan2(dx, -dz); return dirs[Math.round(((ang / (Math.PI * 2)) + 1) * 8) % 8]; }
  let treeHint = { t: 0, text: '' };
  function hintText() {
    const q = current();
    if (!q) return 'Three worlds, a dome, a legend. Whatever is left is yours to find.';
    let t = q.hint;
    if (q.id === 'village' && (Village.def || G.village)) { const v = Village.def || G.village, dx = v.x - G.player.x, dz = v.z - G.player.z; t += ` · ${Math.round(Math.hypot(dx, dz))}m ${dirTo(dx, dz)}`; }
    if (q.id === 'fuse' || q.id === 'snare') {
      const b = G.world.findNearest(B.FUSION, G.player.x, G.player.z, 80);
      const hs = q.id === 'fuse' && Wild.haunts && !pairReady() ? Wild.haunts() : [];
      if (hs.length) { const pl = G.player; hs.sort((a, c) => Math.hypot(a.x - pl.x, a.z - pl.z) - Math.hypot(c.x - pl.x, c.z - pl.z)); const h = hs[0]; t = `Catch ${/^[aeiou]/i.test(h.name) ? 'an' : 'a'} ${h.name} (${h.biome}) · ${Math.round(Math.hypot(h.x - pl.x, h.z - pl.z))}m ${dirTo(h.x - pl.x, h.z - pl.z)}`; }
      else if (b && q.id === 'fuse') t += ` · table ${Math.round(Math.hypot(b.x - G.player.x, b.z - G.player.z))}m ${dirTo(b.x - G.player.x, b.z - G.player.z)}`;
    }
    if (q.id === 'timber' || q.id === 'ember' || q.id === 'void') {
      const now = performance.now();
      if (now - treeHint.t > 2000) {
        treeHint.t = now;
        const id = q.id === 'timber' ? B.LOG : q.id === 'ember' ? B.GLOWWORM : B.VOID;
        const b = G.world.findNearest(id, G.player.x, G.player.z, q.id === 'timber' ? 64 : q.id === 'ember' ? 80 : 40) || (q.id === 'ember' ? G.world.findNearest(B.EMBER, G.player.x, G.player.z, 40) : null);
        treeHint.text = b ? ` · ${Math.round(Math.hypot(b.x - G.player.x, b.z - G.player.z))}m ${dirTo(b.x - G.player.x, b.z - G.player.z)}${b.y < G.player.y - 3 ? ', below you' : ''}` : (q.id === 'timber' ? ' · none nearby, explore' : q.id === 'ember' ? ' · none in sight, walk the grass at night' : ' · none in sight, dig deeper');
      }
      t += treeHint.text;
    }
    // every quest with a place on the map: distance and direction, the ★ on the compass points the same way
    if (!['village', 'fuse', 'snare', 'timber', 'ember', 'void'].includes(q.id)) {
      const tg = target();
      if (tg) { const wd = (d) => U.mod(d + WORLD_W / 2, WORLD_W) - WORLD_W / 2; const dx = wd(tg.x - G.player.x), dz = wd(tg.z - G.player.z); const d = Math.round(Math.hypot(dx, dz)); t += d < 6 ? ` · here${tg.note ? ' · ' + tg.note : ''}` : ` · ★ ${d}m ${dirTo(dx, dz)}${tg.note ? ' · ' + tg.note : ''}`; }
      else if (tg === null && NOTE[q.id]) t += ' · ' + NOTE[q.id]();
    }
    return t;
  }
  // quests with no single spot to go to still say what to do
  const NOTE = {
    catch: () => 'any wild Kin near you will do', party: () => 'any wild Kin near you will do', mines: () => 'dig straight down where you stand',
    suit: () => G.player.has('lavasuit') ? 'done' : `iron ${G.player.count('iron')}/5 · void ${G.player.count('void')}/3 · ember ${G.player.count('ember')}/4`,
    moon: () => G.player.has('ship') ? (G.player.has('spacesuit') ? 'board the Nightwing (Ship button) and climb' : 'you need the Space Suit') : 'Professor Finch has to finish the Starlark first',
    halo: () => G.player.has('ship') ? 'Ship, climb above the clouds, choose Halo' : 'you need the Starship', ship: () => 'bring Professor Finch his materials at the Mining Camp',
    lost: () => 'do jobs for the people by the fires (yellow dots on the map)', legend: () => G.worldId === 'earth' ? 'take the Starship to the Moon or Halo; the ✶ shows on your radar there' : 'the ✶ is beaten for now; try the other world',
    moonjobs: () => G.worldId === 'moon' ? 'yellow dots on the radar' : 'fly the Starship to the Moon', halojobs: () => G.worldId === 'halo' ? 'yellow dots on the radar' : 'fly the Starship to Halo',
    moonfree: () => G.worldId === 'moon' ? 'red dots on the radar are held towns' : 'fly the Starship to the Moon', wings: () => `ring shard ${G.player.count('ringshard')}/3 · amber ${G.player.count('amber')}/6 · sulfur ${G.player.count('sulfur')}/4 · cloud ${G.player.count('cloud')}/4`,
    rex: () => G.stats.lostMap ? 'follow 🦖 to the Lost World tunnel' : 'you need the Lost World map', abyss: () => G.stats.lostMap ? 'the deep water outside the Lost World cliffs' : 'you need the Lost World map',
  };
  // where the current quest points, for the compass
  let targetCache = { t: 0, v: null, id: null };
  function target() {
    const q = current(); if (!q || !G.world) return null;
    const now = performance.now();
    if (targetCache.id === q.id && now - targetCache.t < 2000) return targetCache.v;
    targetCache = { t: now, id: q.id, v: computeTarget(q) };
    return targetCache.v;
  }
  function computeTarget(q) {
    const p = G.player;
    { const ct = Campaign.target(q.id); if (ct) return ct; }
    if (q.id === 'fisher' && G.fisherSpot) return { x: G.fisherSpot.x, z: G.fisherSpot.z, note: 'Old Brannock' };
    if (q.id === 'village' && (Village.def || G.village)) { const v = Village.def || G.village; return { x: v.x, z: v.z }; }
    if (q.id === 'timber') { const b = G.world.findNearest(B.LOG, p.x, p.z, 64); return b ? { x: b.x, z: b.z } : null; }
    if (q.id === 'ember') { const b = G.world.findNearest(B.GLOWWORM, p.x, p.z, 80) || G.world.findNearest(B.EMBER, p.x, p.z, 40); return b ? { x: b.x, z: b.z } : null; }
    if (q.id === 'void') { const b = G.world.findNearest(B.VOID, p.x, p.z, 40); return b ? { x: b.x, z: b.z } : null; }
    if (q.id === 'fuse' && !pairReady()) { const hs = Wild.haunts ? Wild.haunts() : []; if (hs.length) { hs.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z)); return { x: hs[0].x, z: hs[0].z }; } }
    if (q.id === 'fuse' || q.id === 'snare') { const b = G.world.findNearest(B.FUSION, p.x, p.z, 80); return b ? { x: b.x, z: b.z } : null; }
    if (q.id === 'skyroot' && typeof Sky !== 'undefined') { const k = Sky.sites().find(x => x.kind === 'tree'); if (k) return { x: k.x, z: k.z, note: 'the Skyroot' }; }
    if ((q.id === 'sky' || q.id === 'storm') && typeof Sky !== 'undefined') { const k = Sky.sites().find(x => x.kind === (q.id === 'sky' ? 'city' : 'fort')); if (k) return { x: k.x, z: k.z, note: k.name }; }
    if ((q.id === 'heart' || q.id === 'mythic') && G.world.heart && p.has('deepchart')) return { x: G.world.heart.x, z: G.world.heart.z, note: 'the Heart' };
    if (q.id === 'catch' || q.id === 'party') { let best = null, bd = 60; for (const e of Wild.list) { if (e.isBoss || e.lieutenant || e.isLegend || e.isApex) continue; const d = Math.hypot(e.x - p.x, e.z - p.z); if (d < bd) { bd = d; best = e; } } return best ? { x: best.x, z: best.z, note: KIN.name(best.kin) } : null; }
    if (q.id === 'suit') { const b = G.world.findNearest(B.IRON, p.x, p.z, 40); return b ? { x: b.x, z: b.z, note: b.y < p.y - 3 ? 'iron ore, below you' : 'iron ore' } : null; }
    if ((q.id === 'moonjobs' && G.worldId === 'moon') || (q.id === 'halojobs' && G.worldId === 'halo')) q = { id: 'job' };
    if (q.id === 'moonfree' && G.worldId === 'moon') { let best = null, bd = Infinity; for (const m of Village.markers(p.x, p.z, 2)) { if (m.kind !== 'village' || m.freed) continue; const d = Math.hypot(m.x - p.x, m.z - p.z); if (d < bd) { bd = d; best = m; } } return best ? { x: best.x, z: best.z, note: best.name } : null; }
    if ((q.id === 'rex' || q.id === 'abyss') && G.world.lost && G.stats.lostMap) {
      const L = G.world.lost, inside = Math.hypot(p.x - L.x, p.z - L.z) < L.inner;
      if (q.id === 'rex') { if (inside) return { x: L.x, z: L.z, note: 'Tyrannorex' }; const T = G.world.lostTunnel(); return { x: T.ax, z: T.az, note: 'the tunnel' }; }
      const s = Wild.apexSea(); return s ? { x: s.x, z: s.z, note: 'Abyssaurus' } : null;
    }
    if (q.id === 'job') { const ws = Npcs.mapMarks(p, 400).filter(m => m.kind === 'wanderer'); let best = null, bd = Infinity; for (const m of ws) { const d = Math.hypot(m.x - p.x, m.z - p.z); if (d < bd) { bd = d; best = m; } } return best ? { x: best.x, z: best.z, note: best.name } : null; }
    if (q.id === 'lab' && G.world.preset.villages) { const L = Lab.state; const m = Lab.mapMarks(p); const tent = m.find(x => x.kind === 'tent'), lab = m.find(x => x.kind === 'lab'); if (L.told && lab && !L.rescued) return { x: lab.x, z: lab.z, note: 'the hatch' }; return tent ? { x: tent.x, z: tent.z, note: 'the apprentice' } : null; }
    if (q.id === 'lost' && G.world.lost && G.stats.lostMap) { const T = G.world.lostTunnel(); return { x: T.ax, z: T.az, note: 'the tunnel' }; }
    if (q.id === 'legend' && G.world.legend && (G.stats.apex || {}).rex === true && !(G.stats.legends || {})[G.worldId]) return { x: G.world.legend.x, z: G.world.legend.z, note: G.world.preset.legend.name };
    return null;
  }
  return { init, current, update, hintText, target, RECIPES, QUESTS, ARCS, ARC_OF, arcList, arcCurrent, gated, isDone, isActive, AFTER };
})();
