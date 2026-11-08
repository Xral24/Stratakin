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

## What to redesign (Alexander's wish list, roughly in his order)

1. **Kin.** `kin.js` `model()` / `buildMesh()` / `decorate()`. Procedural species: shapes (biped, quadruped, bird, floater, serpent, raptor, blob...), feature flags (horns, wings, spikes, tail, crest...), colours. They must read at a distance ("ooh, look at that one"). Dinosaurs (Lost World, the T-Rex `apexSpecies('rex')`, the mosasaur) especially. Kin wear (scarf, coat, hat, crown, show rosettes) is drawn by `buddy.js` `WEAR`.
2. **People.** `campaign.js` `personModel`, `village.js` `makeNpc`, `combat.js` `warriorModel` (the Kinmaster's spellbound warriors), `avatar.js` (the player: skins, hair, face paint, capes, height from `G.stats.look`).
3. **Towns and cities.** `village.js`: `layout()` generates streets, the plaza, lots and houses through `house()`/`pod()`, shops by kind with `SHOP_BUILD` markers and `FURNISH`. Cities add a fountain, a market street of stalls and a castle on a hill with a waterfall. All of these are blocky placeholders in the right places; make them Castle Town. Houses are all the same 7x7 box now: vary them (half-timbering, roofs, sizes, flower boxes, signs per shop type).
4. **Fortresses.** The twelve Holds (`keeps.js` `stamp`, one in the Core on a lava island), Thornhold (`campaign.js` `stampFort`), the Black Citadel (`citadel.js` `stamp`). Grey, menacing; the gloom radius is part of the mood.
5. **The world.** Trees and coral (`world.js` tree generation), water edges, mines, lava and the Core, sky islands. Grass and terrain already got a pass; keep its look.
6. **Ships and the train.** The Starlark (player ship, `main.js` ship entity), the Kinmaster's Nightwing, and the train: today a station fare fades you to the other station (`G.flyTo`); a visible train on rails between stations would be the dream.
7. **Combat feel.** Sword swings, blocks and warrior wind-ups have no animation yet (`combat.js`).
8. **UI polish** where it helps; it is functional HTML panels (`ui.js`, `style.css`).

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
