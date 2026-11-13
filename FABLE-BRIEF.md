# Brief for Fable 5: the visual work on Stratakin

Alexander ("Dude") plays on his Android phone, through the Claude artifact "Stratakin v2.5". Everything functional is in place and tested. What's left is how a handful of places look, and that work was saved for you. Below is the list, where to find each place in the standard world, what he asked for, and the house rules.

## Where to find things

New games now default to one shared world, seed "Stratakin" (an empty World box on the start screen). Coordinates below are in that world, so every player sees the same places. To check a spot in the test harness: `h.newGame('Stratakin')`, then `Campaign.sites()`, `Keeps.sites()`, `Sky.sites()`, `Citadel.site()` and `Village.townList()`.

| Place | Where (x, z) | How to reach it in code |
|---|---|---|
| Thornhold, the standard to match | -722, -1018 | `Campaign.sites().fort`, stamped in `js/campaign.js` |
| The Holds (eleven on the surface, one in the Core) | nearest is Blackspire at -924, -707 | `Keeps.sites()`, `stamp()` in `js/keeps.js` |
| Stormspire, the sky fortress | -1162, 686, at y 94 | `Sky.sites()` id `stormspire`, `js/sky.js` |
| The Black Citadel | 950, -1231 | `Citadel.site()`, `js/citadel.js` (appears once all twelve Holds are taken) |
| A city with four quarters | Great Clouddale, 14901, 963 | `Village.townList()` with `size === 'city'`, `layout()` in `js/village.js` |
| Sea villages | type `sea` sites, the ones with the ferry landing | `js/village.js` (sea style, ferry and roost code) |
| The Mining Camp and the mine below it | -559, -447 | `Campaign.sites().mine`, `openShaft()` and the gallery code in `js/campaign.js` |

## The jobs

1. **Sea villages.** He wants them to feel like the Metkayina reef villages in Avatar: The Way of Water. Woven stilt houses over the water, curved organic roofs, walkways and platforms linking them, a reef feel. Keep the ferry landing and the ferryman working (keeper 13, 'station').

2. **The four city quarters.** Cities should read as four distinct districts, each with its own character, not one big block.

3. **The fortresses.** The Holds, Stormspire and the Black Citadel all need bringing up to Thornhold's standard. Right now they're plain walled squares (the Holds), or simpler than Thornhold. Each should feel like a real stronghold of the Kinmaster's: gatehouse, towers, inner keep, banners and dark stone. They have to keep working:
   - the Hold courtyard keeps a dais with the Dark Fusion Table and a clear fighting space;
   - the gate stays at z - 8 (quest pins and the guard muster expect it);
   - Tam is now caged in iron bars in the back corner of the Hold nearest Ysolde's snow camp, at hold x + 5, z + 5 (`cellBlocks()` in `js/campaign.js`), so leave that corner a floor he can stand on.

4. **The mine's look.** The Mining Camp and the galleries below should look like a real working mine: timbering, rails, lamps and ore seams. The shaft ladder must stay one continuous ladder from the gallery floor to the surface (`openShaft()`, repair flag `c.mineShaftFix2`).

5. **The creatures.** He wants every Kin to be beautiful, in the design language of Pokémon, Yu-Gi-Oh! monsters and Beyblade bit-beasts. That means:
   - **silhouettes** you'd know in shadow;
   - **colour** blocked out cleanly with one strong accent;
   - **eyes** with life in them;
   - **the element** readable at a glance;
   - **evolutions** that grow from cute to fearsome.

   Take the style, never a particular creature. Kin are built by a generator (`model(sp, stage)` in `js/kin.js`): a `switch (sp.shape)` over the body shapes, with feature flags in `sp.feat`, colours in `sp.colors` and the element from `dominant(sp.elem, 1)`.
   - **The quadruped is already redone as a sample** (Friday 13 November). Check with him how he felt about it before carrying it further. It has:
     - cub, youngster and adult proportions by stage;
     - one signature per element, on tail, ears and mane: flame tail and mane, fin tail and dorsal fin, leaf crest and flower, rock plates and club tail, plume tail and feather ears, crystal spikes, lightning tail and zigzag ears, smoky mane and glowing tail, radiant ruff and halo;
     - layered eyes: dark base, coloured iris, pupil and two glints, with a brow on adults;
     - hocked hind legs.
   - **Six invented quadruped body plans** followed the same evening, after he asked for creatures that are unique rather than one body re-dressed (his references were Squirtle to Blastoise, Charmander to Charizard, Bulbasaur, Dark Magician and Blue-Eyes White Dragon, for how distinct each design is, never to copy):
     - **Bulwark** (replaced Cairnback, whose stones he found meaningless): a banded pup, then a scaled hunter, then a walking fortress with a shield crest and a mace tail.
     - **Lanternstag:** a slender stag whose antlers are hung with lanterns.
     - **Masker:** a cat behind a carved mask with glowing slits, a conjuror's collar and a second mask on its tail.
     - **Mantlewalker:** wide and flat, with a cape of skin down each side, floating as an adult.
     - **Anvilmaw:** a knuckle-walking forge brute with an anvil jaw and chimneys that breathe its element.
     - **Glyphtail:** a big-eared fox with ribbon tails (one, two, then three) that ring into a glowing glyph circle.

     Mounts (steed, fast, tame, dino) keep the horse-like body. Pick by `(seed % 997) % 6`. Gallery: `t-archgal.js`.
   - **Round two, after his feedback.**
     - **Evolutions change the body,** not just the count of something (he called one, two, three candles or tails "very basic"). Each stage changes proportions and grows new parts: shoulders, manes, capes, a furnace grate, swept-back ears.
     - **Elements change the anatomy,** Eevee-style, through `infuse(A)` on each body's anchor points:
       - **Flame:** a flame crest, flame tail, ember paws and fire horns.
       - **Tide:** a dorsal fin, fork tail, neck frills and webbed feet.
       - **Bloom:** a leaf, leaf collar and flowers.
       - **Stone:** rock plates, boulder shoulders and a nose horn.
       - **Gale:** feather tuft, ruff, wings and plume.
       - **Frost:** crystals, an icicle beard and an ice crown.
       - **Spark:** back bolts, cheek sparks and a bolt tail.
       - **Void:** horns, a smoke mane and a wisp tail.
       - **Light:** a ruff, halo and glowing tail.

       Bulk also varies by element. Gallery: `t-archgal2.js`.
     - **He liked** the Mantlewalker and the Frost Masker best.
   - **Carry that approach across** biped, serpent, bird, blob and the rest: a library of invented body plans per shape, each with its own gimmick and three-stage arc, the element dressing whichever body it gets.
   - **Gallery:** `t-quadgal.js` in the harness renders one per element at every stage. Copy it for the other shapes, and keep bone indices (head 1, legs 2-5, tail 6, wings 7/8) so the animation still works.

6. **Evolution lines: the structure is in, the art is yours.** (Built Friday 13 November, after he asked for creatures that start from what they are: an animal, a habitat, a real creature you can recognise. Evolutions may change the body completely, like Magikarp into Gyarados, and lines may be one, two or three stages.)
   - **Where it lives:** `LINES` in `js/kin.js`, by movement class (`land`, `water`) and element. Each line is one to three forms of `[shape, plan, anchor]`:
     - `shape`: the body case in `model()`;
     - `plan`: the quadruped body plan, or a label for the art to come (fish `minnow`/`shark`/`ray`/`seahorse`, serpent `seadragon`);
     - `anchor`: the real creature it should read as, e.g. "ember sprite", "forge-king brute", "ray that learned to walk", "masked conjuror", "reef shark", "sea dragon".
   - **How it works:**
     - `lineOf(sp)` picks a line from the species seed. It is never saved, so old saves get it too.
     - `maxStage(sp)` replaces the old fixed 3.
     - `lookOf()` maps a stage to how grown-up it looks.
     - `formOf()` is what `model()` draws.
     - `maturity()` keeps stats on the same power curve whatever the length; a single-form Kin grows stronger by level.
   - **Behaviour still follows `sp.shape`** (swim, fly, ride), so a line only mixes bodies that move the same way.
   - **What's excluded:** mounts, fusions, dinosaurs, legendaries and the scripted one-offs.
   - **The jobs for you:**
     - the art for the forms that are still the old generic bodies: blob, fish (with real minnow, shark, ray and seahorse bodies), serpent (a proper sea dragon), biped (the masked conjuror);
     - more lines per element, built on real animals and habitats he can recognise at a glance (sea: minnow, seahorse, ray, orca, shark, eel and blends of them);
     - air lines for the birds.
   - **Gallery:** `t-lines.js`.

## House rules

- **Commit and push after every piece**, then publish the artifact:
  - Working copy: `/home/claude/strata`. Sync into the repo with `cp -r strata/. stratakin/src/`, then `python3 tools/build.py` in `/home/claude/stratakin`.
  - Commit as `git -c user.name=Xral24 -c user.email=xral24@users.noreply.github.com commit`, ending the message with the Co-Authored-By and Claude-Session lines, then `git push -q origin HEAD`.
  - Build the single file with `python3 /home/claude/build-single.py`, then publish `/home/claude/stratakin-3files/index.html` to artifact slug `95c42275-5e63-4850-a378-dd4d1b3950d6`, chaining `base_version`.
  - Add a line to `PROGRESS.md` before `## Still to do` each time.
- **Phone first.** The budget is about 2.3M vertices a frame after the last optimisation pass. Build detail in blocks and in the chunk mesher, not as entities, and check the fps readout stays reasonable.
- **Old saves must keep working.** A place that is already stamped needs a repair flag to restamp, the way `mineShaftFix2` and `pierWays` do.
- **Writing in the game and to him:** direct and informal, no em dashes, no rule-of-three lists, no templated structure. Villagers are humanoid folk. "Indians" stay "Indians".
- **Test harness:** `/home/claude/strata-test`, `ROOT=/home/claude/strata node t-*.js`. `t-smoke.js` covers every layer, `t-sweep.js` walks every quest pin, `t-audit*.js` checks camp people stand on the ground, and `t-brief.js` takes a screenshot of each place above. Headless is slow, so give screenshots a few seconds.
