# Sunday build brief

The big rebuilds saved for when Fable is back. Each one has: what Dude asked for, where it lives in the code now, a plan, and how to know it's done. Paths are under `src/` (working copy `/home/claude/strata`). Build, test, commit, publish exactly as in PROGRESS.md. The design doc "Stratakin Base Set" has the story and rules each of these must match.

Suggested order: fusion-only evolution first (it changes the numbers everything else is tuned on), then episodes and the lock, then the Lost World, then the ending, then the Rustcoats and road challengers. 3D models can run in parallel because they're mostly art.

---

## 1. Evolution only through fusion, level 50 cap

**Asked:** Kin don't evolve by levelling any more. You fuse to evolve. Level cap 50.

**Now:**
- `js/kin.js` ~line 785, `gainXp`: `if (k.stage < maxStage(k.sp) && k.level >= k.sp.evolveAt[k.stage - 1]) { k.stage++ ... }`. This is the levelling evolution to remove.
- `js/kin.js:587` in `create()`: the stage is also derived from level at creation. Wild Kin at high level spawn evolved. Decide: wild Kin keep their natural stage by area, or always stage 1.
- `MAX_LEVEL = 200` (kin.js:56) and `capOf(sp)` (kin.js:769). Halo legendaries sit near 200, and battle, wild and arena levels are all tuned for that range.
- The fusion lab and recipes: `fuseRecipe` (kin.js:355), `fuse` (kin.js ~818), `js/lab.js`. Bond already feeds fusion (`fusionBond` in kin.js, done 28 Nov): the new Kin starts at 70% of the average bond that went in, never bonded for good straight away, and gets up to +4 levels and +8% on every stat when everything that went in was bonded. Keep this when fusion becomes the only way to evolve.
- The "peaked" explainer already says "Only a fusion recipe takes it further" (main.js:614, wild.js:600).

**Plan:**
- Remove the level-up stage bump.
- Make stage 2 and 3 forms come from fusing two of the same line, or line plus element item: the recipe system already supports forks.
- Rescale levels to a 50 cap. Multiply wild, tyrant, arena and quest levels by about 0.25, or remap through one curve function, so the progression feel stays.
- Stats keep scaling with stage so fusing is the big power jump.
- Save migration: existing Kin above 50 clamp to 50 and keep their stage.
- Wild Kin (Dude's call, 28 Nov): nearly everything wild is stage 1. Evolved forms do turn up now and then, but rarely, and they're shy: they keep their distance, bolt when you come close, and are harder to catch (lower link chance). Seeing one should feel like an event.

**Done when:**
- A Kin levelled from 1 to 50 never changes stage.
- Fusing two stage-1 Kin of a line gives its stage 2.
- Old saves load with every Kin at 50 or under.
- The level numbers on Earth, Moon and Halo still rise sensibly.

## 2. Episodes, and Kin locked until their episode

**Asked:** Every segment of the story works like a Pokémon episode: a little story, a new Kin met. Kin only become catchable once you've done the episode that introduces them, in order. Six commons are open from the start. Earth has 20 episodes (season one), the Moon 6, Halo 6. The first is The Dry Spell. The full episode list is in the doc.

**Now:**
- Quests are a flat list in `js/quests.js` (ids like `rex`, `abyss`, `kinmaster`, `moonfree`).
- `js/campaign.js` places the sites.
- Wild spawning is in `js/wild.js` and picks from `KIN.dex(world)` by habitat.

**Plan:**
- Add `G.stats.episode` per world and an EPISODES table (id, title, Kin introduced, steps, unlock).
- In `wild.js` filter spawns to species unlocked so far, plus the six open commons.
- Episode steps reuse existing quest machinery where possible: talk, fetch, fight, link.
- The quest panel shows the current episode with its title card.

**Done when:**
- A new save only meets the six commons.
- Finishing The Dry Spell unlocks its Kin in the wild.
- Episode order is enforced.
- An old save is given every episode it has already effectively passed.

## 3. The Lost World rework

**Asked:**
- **Dinosaurs can't be linked.** They aren't woven, so they never go on a cartridge.
- **The Tyrannorex starts as an egg.** It's guarded or left by the mother, nobody knows where she went. Stealing it feels wrong, and that's said out loud. You incubate it, raise it as a buddy, and it grows fast.
- **Raptors:** three or four jump you at the egg. Baby raptors can be befriended by bringing meat. A certain trader sells the meat, which takes a couple of days. There's a pen and a whistle, and you can ride a raptor.
- **Triceratops:** you can befriend one.
- **Brachiosaurus:** from its back you look over the dome and spot the Mosasaurus.
- **Hidden treasure chests** around the Lost World.
- **The Abyssaurus:** befriending it at the end gives one of the missing keys to the Loom.
- **Damage:** Kin vs dinosaur stays as it is, ×0.7 Kin into dino and ×0.45 dino into Kin, and Umbrarch counts as ancient (battle.js, arena.js).

**Now:**
- `world.lost` is built in `js/world.js:228`.
- The dino species are `KIN.dinoSpecies` (kin.js:421, rex and abyss).
- The quests are `rex` and `abyss` in quests.js:108-109, and quests.js:286 has a gate using `G.stats.lostMap`.
- The story currently says link the Tyrannorex. That has to change everywhere at once: quests, arena.js:138 toast, the doc.

**Plan:**
- Add a new buddy-like follower type for dinos, alongside `buddy.js` but not a Kin: no cartridge, its own growth timer.
- Egg item, incubation, hatch, then baby, juvenile and adult, with the adult able to fight in the arena finale.
- Raptor pen as a buildable spot with a whistle item to call your raptor. Riding reuses the existing mount code.
- Brachiosaurus lookout: a camera beat from its back that marks the Mosasaurus on the map.
- Chests: reuse `G.chests`.

**Done when:**
- No dinosaur can ever be linked.
- The egg can be taken, raised and fights Umbrarch.
- A raptor can be befriended, penned, whistled and ridden.
- The Abyssaurus gives a Loom key.

## 4. The ending rewrite

**Asked:**
- **The order:** Earth, then the Moon, then Halo. The Umbrarch break happens at the Halo Pit.
- **Umbrarch:** it divorces the Kinmaster over his goal, then he reunites with it.
- **The edition-two hook:** a hand reaching out of the Loom, a black, purple and blue liquid pool on the seafloor. Nobody has come out since his daughter fell in. The lava mine and Earth's core come into it.
- **After the Loom opens:** another 20 Kin come out on Earth.

The full version is in the doc's story section and its open questions.

**Now:**
- `js/arena.js:107-140` has the Umbrarch fight and the Tyrant toast.
- `js/quests.js` has the `kinmaster` quest.
- `js/cine.js` and `js/film.js` handle cutscenes.

**Plan:**
- Rewrite the finale beats to the doc order.
- Add the Loom-opening event that adds the 20 new Earth species to the unlocked set (ties into item 2).
- Add the closing scene with the hand from the pool.

**Done when:** the last fight plays in the doc's order, the hook scene plays, and the 20 new Kin appear afterwards.

## 5. Rustcoats, road challengers, rescue and black market

**Asked:**
- **Rustcoats:** a Team Rocket kind of gang who break the Hearth Truce. They fight with Black Link tech.
- **Losing to them:** they rip your weakest unbonded Kin off its cartridge and take it.
- **Getting it back:** a rescue window first. After that, the black-market back room behind the Kin Sale Yard sells it back.
- **Road challengers:** Oren the Bow, the rival kid, and air patrols that challenge you when the skies aren't clear.
- **Side quests:** RuneScape-style ones are an option.

**Now:**
- Only Linkdown knows the Rustcoats, through the Black Link Thread.
- The Kin Sale Yard is `kinmarket` in village.js.
- Losing Kin at the table already has the buy-back pattern (`G.stats.ldLost`, `Linkdown.buyBack`). Copy that for the black market.

**Plan:**
- A Rustcoat squad entity on the roads, using `roads.js` and `wild.js` spawning.
- Their battle uses the normal battle with a loss hook.
- Taken Kin go to `G.stats.rustTaken` with a timer: the rescue camp is marked on the map while the timer runs, then the Kin moves to the back room at a markup.
- Challengers are NPC battles at road points, gated by episode.

**Done when:**
- A loss to Rustcoats takes the weakest unbonded Kin, never a bonded one or your starter.
- The rescue fight gets it back.
- After the window it can be bought behind the Sale Yard.

## 6. 3D Kin models from the turnarounds

**Asked:** Turn the turnaround sheets into real 3D Kin.

**Now:**
- There are 98 Earth turnarounds plus 2 or 3 per evolution in `art/turnarounds/`, and 60 more in `art/turnarounds_moonhalo/`.
- `js/glb.js` already loads GLB models (what Higgsfield's 3D generation makes) with skeletons and animation, but only for the human cast, and it's switched off (`CAST_ON = false`, glb.js:235).
- Kin today are procedural meshes from `KIN` species data.

**Plan:**
1. Price one Kin model with Higgsfield `generate_3d` from its turnaround first. The credit limit is 3,000 total and about 306 are left, so check the cost before batching.
2. Extend `glb.js` so a species seed can map to a model file, loaded the same way as the cast.
3. Fall back to the procedural mesh when there's no model.
4. Do the three starter lines first, test on the phone for frame rate, then decide how many more.

**Done when:** at least one starter line is shown in 3D in the world and in battle, with the procedural Kin unchanged for everything else, and no frame-rate drop on Dude's phone.

---

## Small open choices to ask Dude

- The away-from-home rule on the Linkdown table is 75%. Real fights use half. Should the table match?
