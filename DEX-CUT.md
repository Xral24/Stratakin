# Cutting the Kin to about 150: first draft for Alexander

A draft to mark up, not a decision. Nothing in the game has been changed.

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
