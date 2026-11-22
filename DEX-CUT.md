# Cutting the Kin to about 150

**Done 22 Nov 2026** (Alexander approved the draft: "do the Kin"). The game now has 159 natural forms: Earth 70 (19 wild lines, the three starter lines, the horse, three dinosaur lines, three great ones), the Moon 45, the Halo 44. How it is built is at the end of this file; the draft he approved follows unchanged.

## The idea
- Today: 235 species per world (705), most with three stages. That's far more than anyone can learn, and far more than we can give proper art.
- Target: about 150 forms across the three worlds, counting every stage the way the first Pokémon games counted 151.
- Fusion stays, so mixing two Kin still makes something new. Fused Kin are built from their parents' bodies in code, so they need no art of their own.
- Every kept line keeps the house rules: it starts from something real, evolves logically, and copies nobody.

## Earth: about 57 forms
Two or three lines per element, leaning on the ones you liked (the two-legged lines, the redesigned fish and floaters).

| Element | Lines kept |
|---|---|
| Flame | ember monkey > torch mandrill > magma gorilla · ember chick > flame kestrel > phoenix |
| Tide | raindrop > fountain sprite > tide moon · froglet > river frog > sumo bullfrog · sea angel > abyssal seraph |
| Bloom | seed pod > sprout > walking oak · sporeling > mushroom knight > fungus elder |
| Stone | pebble > boulder > mountain giant · fossil fry > living fossil |
| Gale | bubble-fin fry > kite-fin flyer > waterspout rider · sail fry > galleon sailfish |
| Frost | snowball imp > snow golem > yeti · arctic fox kit > ice wolf |
| Spark | battery beetle > stag beetle > hercules titan · wind-up bot > coil soldier > thunder mech |
| Void | puppet > marionette > puppeteer · ravenlet > raven > three-eyed raven king |
| Light | prism sprite > crystal knight > radiant paladin · glow fawn > white hart |

Plus the three round starter lines (9 forms) and the foal > colt > warhorse riding line.

## The Lost World: your five
Long-neck (brachiosaur), Triceratops, Raptor, the Tyrannorex (the apex in the clearing) and the Mosasaurus (the Abyssaurus in the sea outside the cliffs). The other dinosaur lines (ankylosaur, stegosaur, parasaur, pachycephalosaur, titanoboa) go.

## The Moon: 14 bodies, one element each (42 forms)
Each body keeps one element instead of appearing in several. The elements are my guesses from what each animal is; change any.

| Body | Stages | Element |
|---|---|---|
| tardigrade | pig > grade > titan | Stone |
| geode | nodule > geode > druse | Stone |
| jerboa | hop > jerb > vault | Gale |
| sickle bird | slice > sickle > scythe | Gale |
| comet | tad > trail > eclipse | Frost |
| ibex | kid > horn > bex | Frost |
| crater crab | pit > crab > caldera | Flame |
| rille wyrm | bead > rille > wyrm | Flame |
| nautilus | bub > bell > naut | Tide |
| snail | whorl > snail > spire | Bloom |
| mochi rabbit | mochi > bun > pestle | Bloom |
| firefly | glow > fly > lamp | Spark |
| tarsier | peep > tarse > clipse | Void |
| moonlet | wane > gibb > plena | Light |

## Halo: 14 bodies, one element each (42 forms)
| Body | Stages | Element |
|---|---|---|
| scarab | grub > roller > bearer | Stone |
| tortoise | hatch > dome > vault | Stone |
| camel | calf > hump > dromed | Flame |
| lamp | wick > lamp > brazier | Flame |
| flamingo | chick > mingo > nimbus | Tide |
| brine shrimp | nip > shrimp > regent | Tide |
| cactus | bud > saguaro > bloom | Bloom |
| dune | ripple > barchan > erg | Gale |
| roadrunner | dash > runner > blaze | Gale |
| halite | cube > cluster > crown | Frost |
| dragonfly | nymph > darner > glint | Spark |
| frilled lizard | frill > ruff > corona | Spark |
| mirage | shimmer > mirage > oasis | Void |
| sundog | whelp > hound > parhel | Light |

## Legends and the big ones
One legend per world plus the story's own: three Earth legends (your pick of the nine), the Old Ones under each world, Umbrarch. Roughly 8.

## Total
Earth about 57, Lost World 5, Moon 42, Halo 42, legends about 8: **about 154**.

## What changes in the code when you approve it
- `LINES`, `NATIVE.moon`, `NATIVE.halo` and `NATIVE.lost` in `js/kin.js` shrink to the kept lines; the dex builds from them.
- Wild spawns, tamers, guards and quests pick from the dex, so they follow on their own; any quest that names a cut species gets a kept one.
- Old saves: a Kin of a cut species becomes the nearest kept species of the same element and family, keeping its level, moves and name.
- Art: each kept form gets a Higgsfield concept picture and a painted skin (about 150 x 2 images); the headline ones get full models.


## How it was built (22 Nov 2026)
- `js/kin.js` `KEPT` is the list: one row a species, `[what it is built on, element, shape, rarity, homes]`. A species lives in several places now (`sp.homes`; `sp.home` is the first, the one the Kindex shows; `KIN.lives(sp, layer, biome)` asks). `keptSpecies(body)` builds them, `habitat()` answers from them.
- `LINES` was **not** cut: every body stays in the code, so old fused Kin still draw and any line can come back by adding a row. An Earth row names its line (`sp.lineRef = [class, element, index]`), a Moon, Halo or Lost World row its native body (`sp.natPick`).
- The three starters are Kindex species like the rest (epic, found rarely: the cinder kitten in the desert and the core, the froglet in the swamp, the hedgehog in the forest). `KIN.starters()` hands out those same species.
- Rideable Kin are named in the table (the horse Trotlet, the Moon's ibex, the Halo's camel, the Lost World's raptor), not drawn by lot.
- The great one of each special place is who it was (same seed): the old generator is kept as `legacyHabitat()` for that and for reading old saves.
- Fusion: still 30 recipes and 5 forks a world. Pairs are dealt from the small pools (never the same pair twice), and a fused Kin is built on the body of one of its parents in its own colours (`inheritBody`), at the Fusion Table and in free fusion, so nothing that was cut comes back through fusion and fusions need no art.
- Old saves (`kinV` 2 to 3, `main.js`): every Kin of a cut species, wherever the save keeps it (party, storage, guards, lab, eggs), becomes the nearest kept species of its world: same element and kind of body if there is one, else same element (`KIN.keptFor`, `KIN.migrateKin`, `KIN.migrateSeed`). Level, moves, nickname, gear and bond stay. Fused Kin and the great ones are untouched.
- Rarity is the species' own now, so each world's table was balanced by hand: every habitat has commons, and the filters other systems use (a rare surface Kin for a quest, a Void rare for a keep, Sky birds, water fish) all still find something. `scratch/dexaudit.js` (in tools/test) lists every habitat and checks them.
- Differences from the draft: the starters are 6 forms, not 9 (the kitten has two, the hedgehog one, and the froglet line is both the Tide starter and a wild line); the three dinosaur lines have three stages each.
