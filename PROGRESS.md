# Visual redesign: working notes (Fable)

Working copy: /home/claude/strata (mirrored to this repo's src/ before each commit). Build: `python3 tools/build.py`. Tests/screenshots: /home/claude/strata-test (harness.js), `node shot.js <seed> <out.png>`.

## Architecture decisions

1. **Entity geometry** (`js/geo.js` + MeshBuilder in render.js): entity meshes carry smooth normals and a bone index per vertex. New primitives: `blob` (box-to-ellipsoid with taper), `tube` (path + radii, caps), `fin` (extruded polygon), `box` (kept). A transform stack (`push/rotate/pop`) and `setBone(i)`.
2. **Entity shader** (render.js `EVS/EFS`): aPos/aCol/aNorm/aBone, `uBones[10]` matrices, soft toon ramp + rim light, `uSway` for serpents/fish, optional inverted-hull outline. Chunks keep the old shader.
3. **Bones**: 0 body, 1 head, 2 front-left leg / left arm, 3 front-right / right arm, 4 back-left leg, 5 back-right leg, 6 tail, 7 wing L, 8 wing R, 9 jaw. `model.bones[i] = {piv:[x,y,z], kind}`. Pose is computed per frame in render.js from how far the entity moved (`e._an`), or from `e.anim` when the producer supplies it (player, mount).
4. **Portraits**: rendered with GL into an offscreen FBO and copied to the 2D canvas (`R.renderPortrait`), so they match the in-game look.
5. **Model parts** keep `{x,y,z,w,h,d,c,emis}` boxes for backward compatibility (decorations, hats); new parts add `k: 'blob'|'tube'|'fin'` with their own fields. `KIN.buildMesh` dispatches.

## Order of work
1. geo + shader + animation driver (foundation)  [in progress]
2. Kin shapes: quadruped, biped, bird, serpent, fish, blob, floater, raptor, longneck, horned; apex rex/mosa; markings
3. People: human model, decorations, player avatar, warriors, Indians (riders on mounts)
4. Towns: houses, roofs, half-timbering, streets, plaza, castle; districts; sea towns
5. Fortresses, Citadel
6. World: trees, water edge, sky islands; Highmere/Stormspire/isles
7. Underground: mine galleries, Core lava landscape
8. Ships/train
9. Combat animation
10. Eggs, UI polish

Scope (Alexander, 8 Nov evening): EVERYTHING visible goes to the same standard: Kin, people, towns, and also every block and prop. Grass (he says the current grass is not at the standard, wants it far better), sand, rock, dirt, water, trees, leaves, berries, glowworms, fusion tables (ordinary and dark), torches, chests, tools and items in hand. Terrain materials are a major item, not a touch-up.

## Done (as of 8 Nov, late)
- Foundation: geo primitives (blob, tube, fin/plate, ribbon, rbox, ball, cone), transform stack, bones + Anim, entity shader with cel ramp, rim, outline, hit flash; GL portraits.
- Kin shapes and people (folk model: egg head, leaf ears, mitten hands; decorate() on partHelpers). Villagers, warriors, avatar are humanoid-not-human.
- World materials: chunk shader material classes (grass, sand, rock, earth, snow, wood, leaves, lava, tiles, plaster, cobbles, thatch, slate, dressed stone), relief normals, smooth sloped soil (surfTop/cornerH; props and trunks let the slope through), per-corner water depth, sun shadows (WebGL2), AA, tone curve, fog that takes the sky colour by direction.
- Grass: instanced blades, clumps, zones; height read only from soil texels (no blades on walls); blades under canopies.
- Trees: leaf puffs centred on their leaves; round free-standing logs; palms as one curved trunk + ribbon fronds (PALMLOG); pines, birches, oaks, swamp, jungle; ground props (boulder, mushroom, flowers, pebbles, bush).
- Towns: house() = 7x7, 4 walls high, stone footing, beams, framed windows (glass in a wall), flower boxes, pitched roofs (TILES/SLATE/THATCH wedge blocks; ridge peak, hip corners, apex), gables, chimney, hanging lamp; shop markers drawn as hanging signs; cobbled square and streets; LAMP posts; a well. Walls: PALISADE then MASONRY with battlements and gate arches (upgrade rebuilds the ring). Cities: castle (curtain wall, slits, round towers with slate pyramids, gatehouse, keep, banners), FOUNTAIN/BASIN, market stalls with AWNINGs. Sea villages: stilt houses with thatch, rails, jetty.
- Indian camps: TIPI/LODGE/HIDE, TOTEM, FENCE, FIREPIT.
- Mines: timbered galleries on a grid (y 28 N-S, y 21 E-W) with RAIL, LAMP, CART.
- Targeting outline follows slopes; leaves/bush/fusion tables flagged transparent so nothing behind them is culled (the "holes to the sky" bug).

- Fortress, Core (basalt columns, dripstone, lava underlight), sky isles (cloud slabs, fluffy puffs), Skyroot tree + Tangle cloud maze with its boss, item icons, held item in hand, avatar hair/paint/cape, eggs and incubator, graphics presets.
- Live fights (9 Nov): a wild Kin that notices you turns on you in real time (close, crouch, lunge, rest) instead of opening the card battle. Block/parry with a shield, parry with a timed swing, hit back with swords/axes (a fraction of its health a blow, capped around a seventh), arrows never take the last point. Deploy Kin (top centre button, F key, bare-handed tap) opens the card battle. Common Kin beaten by hand lie dazed 10 s (snare window) then slink off; bosses, legends, apexes, quest Kin and rarity 3+ never drop below 1 hp by steel. Buddy darts in every few seconds for one hit. Warrior stances (wind-up, strike, shield, stagger, kneel), sparks as streaks, swoosh arc, camera kick. Off-hand shield rises while blocking.
- Twin sticks (9 Nov): right stick turns the camera (rate based, curved); jump/crouch/Ride in a column beside it; Deploy and Set snare sit small and see-through at the top centre. Third person and the saddle use an orbit camera (G.orbit): the stick walks relative to the camera, the avatar turns to face the way he walks, snaps to the camera on a tap or a hold (faceCamera), the camera drifts behind after 1.5 s idle on the move. Off while gliding/flying/wings, in battle or talking. Blades near a low camera shrink out of the lens.
- Stations (9 Nov): every planned town's station stands on a plinth two blocks back from its lot with a raised platform, lamps, a track past the door out through its own wall opening and 36 blocks across the land (stampRail), a buffer stop. Once fixed, a tank engine and two coaches wait with idling steam (Village.trainPieces/trainTick); a fare rides out on the coach roof (boardTrain) before the fade. Starship rebuilt (main.js 'ship2').
- Kin wear (9 Nov): KIN.dress(m, wear) builds outfits with the body primitives from landmarks (head bone box, body box; horns ignored for the crown of the head), bound to the head or body bone; buddy, battle and mount meshes key on KIN.wearKey. Old box wear removed from buddy.js.
- Silas Pennywise ('silas' deco: top hat, monocle, moustache, brocade waistcoat, watch chain, cane, purse) and Professor Finch ('scientist' + 'professor': white hair, spectacles, bow tie, pens, wrench).
- Fixes: villagers unstick from props; towns fell crowns of trees they level (op -1); shore smoothing counts water as ground at the surface; tonemap fixed above 1.0 (black/magenta glitter); Deploy flashes; walkers snap up steps.

## Still to do
UI polish, a posed look at warrior stances in a hold, sea-town (stilt) stations if wanted, Kin-vs-Kin live skirmish ideas (your deployed Kin fighting live rather than cards) if wanted. (Old list: train/ships, combat animation, eggs, avatar hair/paint, buddy WEAR cosmetics, Silas and Finch, UI polish (item icons), quality toggles in settings (state.shadows, state.grassQuality, state.dprCap).

## Block ids added this pass
65 NEEDLES, 66 FROND, 67 BIRCHLOG, 68 BOULDER, 69 MUSHROOM, 70 FLOWERS, 71 PEBBLES, 72 PALMLOG, 73 TILES, 74 SLATE, 75 THATCH, 76 PLASTER, 77 BEAM, 78 LAMP, 79 COBBLE, 80 FLOWERBOX, 81 PALISADE, 82 MASONRY, 83 FOUNTAIN, 84 BASIN, 85 AWNING, 86 BANNER, 87 SLIT, 88 TIPI, 89 HIDE, 90 LODGE, 91 FENCE, 92 FIREPIT, 93 TOTEM, 94 RAIL, 95 CART. Blocks drawn as shapes rather than cubes must be `transparent: true` (and `partial` if they do not fill the block), or the mesher culls the faces behind them.
