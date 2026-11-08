# Stratakin: handover for the visual redesign

Read this first. It is written for the next Claude session (Fable 5), whose job is the **visual redesign**. Gameplay is in place on Earth; your job is making it look the way Alexander wants it to look, without breaking what plays.

## Who you are working with

Alexander ("Dude") designs the game; Claude builds it. He plays on his **phone** (Android, Chrome), in portrait, and sends screenshots. Talk to him directly and informally. He dislikes AI-sounding writing: no em dashes, no "three things" lists for the sake of it, no templated headers in chat replies. Correct course fast when he says something is off. He often sends a new idea mid-task: fold it in, keep going.

His visual references: **Zelda: Breath of the Wild / Tears of the Kingdom**, **Avatar**, and the **Ocarina of Time Unreal Engine 5 remake of Hyrule Castle Town** (fountain square, half-timbered houses with red roofs, flower boxes, bunting, market stalls, a castle on a hill). Grass should be dense with three heights (lawn, meadow, tall). Village grass is a short carpet. He wants Kin, people, dinosaurs, the player and the towns to look like a real game, not cubes.

## The repo

- `src/` is the source: `index.html`, `style.css`, `js/*.js` (about 10,500 lines, no framework, no dependencies, raw WebGL).
- `tools/build.py` inlines everything into one file: **`./index.html` at the repo root**, which GitHub Pages serves at https://xral24.github.io/stratakin/. Always rebuild before committing.
- `tools/test/` is a Playwright harness (`harness.js`: `open()`, `newGame(seed)`, `ev(fn)`), plus a few sample tests. Screenshots at 390x780 phone size are how changes get checked. Needs `npm i playwright` and Chromium with SwiftShader.
- The game is also published as a private claude.ai artifact (slug `95c42275-5e63-4850-a378-dd4d1b3950d6`, title "Stratakin v2.5"); republish `./index.html` there after pushing, if that tool is available to you.
- Commits are authored as Xral24 (`Xral24@users.noreply.github.com`).

Ship flow that has worked: edit `src/`, `python3 tools/build.py`, run a test or take screenshots, commit, push to `main`, republish the artifact.

## Hard constraints

- **Phone browser.** Everything runs on a mid-range Android phone. Keep draw calls and vertex counts sane; there is a mobile path (`isMobile` in render.js, lower view distance, fewer grass rings). Test at phone size.
- **No image assets.** Every texture, model and sound is generated in code. Kin and people are box models (`KIN.model`, `KIN.buildMesh`, `KIN.decorate`); blocks are coloured in the mesher and painted in the fragment shader.
- **Save size.** Saves live in `localStorage`. Never stamp large structures as recorded block edits. Towns are drawn into chunks as they generate (`Village.overlay`, called from `World.generate`); only the player's own edits are saved. Follow that pattern for anything big.
- **WebGL2 with a WebGL1 fallback.** Shaders are written once and converted (`#version 300 es` prelude); instanced grass is WebGL2 only.

## How the renderer works (render.js)

- Chunks are 16x16 columns, meshed with baked AO and sky exposure; vertex colours carry block colour. Terrain tops are smoothed: corner heights averaged over 4 columns when the step is 2 or less; slopes run under water to the waterline; anything next to a non-soil block stays square (that fixed see-through gaps, do not undo it).
- Fragment shader: derivative normals, warm sun and cool sky light, painted block noise, a faint block grid only within about 4 blocks of the player, sand ripples, a grass carpet with wind waves, haze toward the sun.
- Sky pass: full-screen triangle with gradient, sun, fbm clouds. Water: depth in vertex colour R, Fresnel, sparkle, foam.
- Grass: instanced blades (WebGL2) from a 128x128 heightmap texture around the player; `grassZone()` picks lawn, meadow or tall; inside villages it is lawn.
- Entities (Kin, people, the player, items) are box meshes cached by key via `R.entityMesh(key, buildFn)`.
- `state.gloom` greys the sky, light and haze near untaken Holds (from `Keeps.gloom`).

## Two characters Alexander cares about

These are original characters and must stay that way: do not base them on any existing game character. Give each a silhouette you could recognise from across a square.

- **Silas Pennywise**, the merchant (`campaign.js`, job `merchant`; also sells the bridge repair and the Sovereign's Crown relic). Not human, not an animal: his own species, a Glimmerkin. Lanky and stooped, long fingers, mossy-green skin with copper freckles, a tall stovepipe hat with a shard of crystal tucked in the band, a teal waistcoat hung with coin chains, a ledger under one arm and an abacus on his belt. He talks like a showman and he is the face of shards in this game.
- **Professor Aldous Finch**, the scientist (`citadel.js`): wiry and tall, a singed coat with too many pockets, brass goggles on his forehead, a mechanical brace on one arm from five years building ships at knifepoint, white tufts of hair that stick out sideways.

## The Indians (`camps.js`)

The camp people are called **Indians**, in code comments, toasts, items and anywhere else they appear. This is Alexander's decision: he has Native American ancestry, it is his game, and he does not want them renamed to something "safer" (an earlier pass called them "the Painted"; that has been reverted). Do not rename them.

What he wants is a proper, good-looking Indian people, drawn with care: camps of tipis around a fire, a chief's lodge with the hoard, totems, a corral with the Duststrider, warriors on foot and mounted riders on fast Kin (riders are scaled-up warriors for now, there are no mounts drawn). Make them look strong and impressive. They speak their own language (the invented lines in `camps.js` when a disguised player is caught), and towns hold the Indian Cloak, stitched from a piece out of every camp.

## What to redesign (Alexander's wish list, roughly in his order)

1. **Kin.** `kin.js` `model()` / `buildMesh()` / `decorate()`. Procedural species: shapes (biped, quadruped, bird, floater, serpent, raptor, blob...), feature flags (horns, wings, spikes, tail, crest...), colours. They must read at a distance ("ooh, look at that one"). Dinosaurs (Lost World, the T-Rex `apexSpecies('rex')`, the mosasaur) especially. Kin wear (scarf, coat, hat, crown, show rosettes) is drawn by `buddy.js` `WEAR`.
2. **People.** `campaign.js` `personModel`, `village.js` `makeNpc`, `combat.js` `warriorModel` (the Kinmaster's spellbound warriors), `avatar.js` (the player: skins, hair, face paint, capes, height from `G.stats.look`).
3. **Towns and cities.** `village.js`: `layout()` generates streets, the plaza, lots and houses through `house()`/`pod()`, shops by kind with `SHOP_BUILD` markers and `FURNISH`. Cities add a fountain, a market street of stalls and a castle on a hill with a waterfall. All of these are blocky placeholders in the right places; make them Castle Town. Houses are all the same 7x7 box now: vary them (half-timbering, roofs, sizes, flower boxes, signs per shop type).
4. **Fortresses.** The twelve Holds (`keeps.js` `stamp`, one in the Core on a lava island), Thornhold (`campaign.js` `stampFort`), the Black Citadel (`citadel.js` `stamp`). Grey, menacing; the gloom radius is part of the mood.
5. **The world.** Trees and coral (`world.js` tree generation), water edges, sky islands. Grass and terrain already got a pass; keep its look.
6. **Underground: the Mines, the lava and the Core.** Alexander's words: it needs to be a proper mine, not just blocks. When you dig, rock is rock, but everything around it should look real, the same Zelda-like treatment as the surface: timbered galleries, rails and carts, lanterns, wet glinting walls and ore veins that read as veins at the Mining Camp shaft; then the Core as a landscape of its own, with lava seas that glow and move, basalt columns, heat haze and embers in the air. The Core Hold (`keeps.js`, `k.core`, a walled basalt island on the lava) and the Heart chamber with the Starmetal pedestal and the sleeping Mantlewyrm (`world.js` `heart`, about 1050 blocks from spawn) are the two set pieces down there. The Core Hold is found with the Deep Chart (given when the eleven surface Holds are free) and reached on foot along its causeway. The Heart sits on an island in a lava sea you can only cross on Halo Wings, so it is one of the last things in the game. The Lava Suit only keeps the heat off (like the Frost Cloak with cold); lava itself always hurts. Dig anywhere else and you land wherever you land.
7. **Ships and the train.** The Starlark (player ship, `main.js` ship entity), the Kinmaster's Nightwing, and the train: today a station fare fades you to the other station (`G.flyTo`); a visible train on rails between stations would be the dream.
8. **Combat feel.** Sword swings, blocks and warrior wind-ups have no animation yet (`combat.js`).
9. **UI polish** where it helps; it is functional HTML panels (`ui.js`, `style.css`).

## Added after this brief was first written (all gameplay, all tested)

- **Wear.** Swords, axes, spears, bows, shields, armour and tools (shovel, hatchet, iron axe, iron and diamond picks) wear out with use and break; a broken piece stays in the bag but does nothing until mended. The first stone pick and the fishing rods never wear. State is `G.stats.gwear`; logic in `combat.js` (`lifeOf`, `cond`, `use`, `mend`); tools wear in `player.js` `wearTool`. The armoury mends blades, bows and tools, the armourer armour and shields, any trader tools. Hotbar slots show a small condition bar (`.wearbar`); restyle it if you like, keep it.
- **Indian camps (`camps.js`).** The hoard (refilled nightly), a weapon tent (plain arrows, an Indian Spear and an Indian Bow, refilled nightly), a horse paddock of three Windmanes, the Duststrider corral, twelve warriors of whom four are mounted riders. Only the Tyrannorex scares them off (17 seconds' grace once you step down). In Indian dress (the Indian Warrior skin, or the Indian Cloak) you can borrow a Windmane as a getaway; get down and it gallops home, it is never yours. The Indian Cloak: a piece of cloth hidden in one tent of every camp, stitched by Zazu, about four minutes of daytime disguise; take something and head for the edge and a warrior stops you, speaks in their own tongue, asks who you are, and the chase starts. To draw: the riders on actual mounts, the Windmanes (piebald, bay, black, dun), tipis, the chief's lodge, totems.

- **Eggs and the incubator.** Eggs hatch on foot by steps (2,500 for common up to 16,000 for the rarest, early story eggs shorter) or in the lab incubator on play time (about 40 minutes common, 2 hours rare, 5 hours legendary, three eggs at a time; `lab.js` `putEgg`/`tickEggs`, `main.js` `addEgg`/`hatchEgg`). The incubator takes eggs only, never Kin. Eggs need proper, beautiful models: speckled, glowing by element, wobbling as they get close, a real hatch moment. Right now they are just a line in a panel.
- **The sky (`sky.js`).** Highmere, a sky city on a cloud platform about 560 out (plaza with a wind-fountain, eight houses, a spire, Lady Aurelle, Fennick the Windtrader, Captain Ilse); Stormspire, the Storm Warden's evil sky fortress about 1350 out, with its own grey storm, warriors, then his Kin; six small cloud isles, each with one odd person and a fetch job. No train goes up there on purpose: you fly or glide up and glide back down. Drawn into chunks like the towns (`Sky.overlay`). Make Highmere airy and beautiful and Stormspire menacing; the isles want character (kites, a lamp, a telescope, a smuggler's crates).

- **Halo Wings.** Earned at the end of the Halo caravan jobs. They fly where nothing else does (Mines, the Core over lava, the airless Moon and Halo, where flying Kin cannot: `G.noKinFlight`), hover still, and are silent: wild Kin, hold warriors and Indian camps barely notice you overhead. About 60 seconds of flight, recharging on the ground (shown on the breath bar). Give them a beautiful amber-and-ring-shard look when open.

- **Story order** (`quests.js`, three parallel arcs; `AFTER` and `NEEDS_ITEM` gate across them). Main: village, timber, foreman, snare, catch, ember, torch, mines, iron pick, party, fuse, fisher, diver, ranch, frost, glider, void, lava suit, core, job, lab, Highmere, then Moon and Halo after the ship. Kinmaster: kinmaster (after glider), the Twelve Holds, Stormspire (after Highmere), the Citadel, Finch, the ship. Old Ones: Lost World, Abyssaurus, the Tyrant, Legend (after the ship), the Heart (after Legend and the Halo Wings), Mantlewyrm.

- **Fourth moves.** The Sanctuary teaches a Kin its element's technique (the fourth move). Sage's Draught, which can only be won (quests: Fusion, Hale's Ranch, the Splicer's Lab, Stormspire, the Tyrant; Brother Halloway on his cloud), swaps the lead Kin's fourth move for any technique from any element (`ui.js` `renderDraught`).
- **Town defences.** The random wall-repair bills shrink with defences: each wall upgrade and each stationed guard (up to two) takes a quarter off; iron walls and two guards and there are no bills. In preset towns a wall upgrade does not stamp a new ring (their walls are part of `layout()`), so please show the upgrade on the town's own walls: stone facing, then iron bands and a gatehouse.

## Still to do on Earth, and best done inside your town redesign

These two touch `village.js` `layout()`, which is exactly what you are rebuilding, so they belong in your pass rather than being bolted on first:
1. **City districts.** The four cities should have proper quarters: a market quarter, a craft quarter (armoury, armourer, enchanter, tailor), a noble quarter up by the castle, and a harbour or river quarter where it fits. Shops go in their quarter, not just round the plaza.
2. **Sea towns.** They still use the old layout (`type: 'sea'`). Give them the new treatment: piers and boardwalks on stilts, houses over the water, the pier plots (`seaPlot`, `stampPier`) you can buy, no stone building on the water.

The Moon and Halo are parked for now: Earth only.

## Systems you must not break

- Quest arcs (`quests.js`): The Journey, The Dark Arc, The Old Ones, run in parallel with gates in `AFTER`.
- Tools and mining tiers (`player.js` `toolKind`/`toolMul`), protection of towns, farms and fortresses (`main.js` `G.protectedAt`), building plots and deeds (`village.js` `plotsOf`/`buyPlot`).
- Towns as overlays (`Village.overlay`, `layout`, `patchLoaded`, `World.reapplyEdits`). If you change `layout()` the town changes for everyone, which is fine, but keep it deterministic.
- Holds (`keeps.js`), the Citadel finale and Professor Finch (`citadel.js`), relics and wear (`relics.js`), on-foot combat and the armoury (`combat.js`), buffs (`G.addBuff`), the companion Kin (`buddy.js`), glider flight (`player.js` gliding block, `weather.js` wind), farms (`farms.js`), Kin shows and sale yards (`village.js` `enterShow`, `saleStock`).
- The Moon and Halo still use the older village system and portals; only Earth was reworked. Leave them unless asked.

## Known rough edges

- City layouts are bigger towns with a fountain, stalls and a castle; no distinct districts yet.
- Sea and underwater towns still use the old stilt and dome layouts.
- No full Earth playthrough has been run end to end since the big restructure; some quest steps may need checking.
- The Moon's story beyond "the Kinmaster fled there" is not written yet.
