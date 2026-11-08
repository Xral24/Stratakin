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

## Done
(nothing yet)
