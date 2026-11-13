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

5. **The creatures: designed, now yours to polish.** Every Kin has a body of its own (done Friday 13 and the early hours of Saturday 14 November, with him reviewing every sheet). Don't reinvent these; he signed off the ideas. Polish proportions, colour, silhouette and faces, keeping each design's idea.
   - **How it's built.** `LINES` in `js/kin.js` holds the evolution lines by family (`land`, `biped`, `bird`, `serpent`, `floater`, `water` for fish, `legend`, plus `steed`/`steedFull` for horses) and element. Each element has three or four lines of one to three forms; a form is `[shape, plan, name]`. `lineOf(sp)` picks one from the seed (never saved, so old saves follow), `formOf()` gives the body for a stage, and `model()` draws it.
   - **Where each design lives.** Every `plan` is a bespoke design inside its shape's case in `model()`, guarded by a set: `QD` (four-legged, in the quadruped case, including the nine legendaries), `BPD` (bipeds), `BRD` (birds), `SRP` (serpents), `FLT` (floaters, in the `default` case), `FSH` (fish). Round starters are the `BP` sub-switch in the blob case. Each family has its own small kit of helpers at the top of its block (heads, legs, wings, fins, body paths). The six original body plans (bulwark, lanternstag, masker, mantlewalker, anvilmaw, glyphtail) now only appear as some starters.
   - **The rules he set, which every change must keep:**
     - each line starts from something real (an animal, a plant, a thing) and evolves logically: coal into smog into a walking volcano, not coal into a deer;
     - no two forms in an element share a body at the same stage, and starters are all different from each other;
     - every step changes the body, stage 2 to 3 included (stage-3 birds hold their wings open for this reason);
     - Kin, not plain animals: each grows its element (he called the first birds "normal birds" and the peafowl "a normal pheasant" until they did);
     - in the spirit of Pokémon, Yu-Gi-Oh! and Beyblade, never copying a creature (a yellow kangaroo with bolt-tipped ears was pulled for looking like Pikachu).
   - **What he liked:** the round starters, the two-legged lines, the redesigned fish (bubble-fin fry to waterspout rider, galleon sailfish, living fossil) and floaters (raindrop, fountain sprite, tide moon, abyssal seraph).
   - **Sheets:** `tools/test/t-allines.js` (four-legged), `t-bipeds.js`, `t-birds.js`, `t-serps.js`, `t-floats.js`, `t-fish.js`, `t-legends.js`. Each writes one PNG per element to `$OUT`. `t-verts.js` lists parts and vertices per form, heaviest first (World Stag is the top at about 25k).
   - **Not yet checked in the game, only in sheets:** how birds look flying (wings are drawn folded, flight flaps them), riding the new bodies (`seatOf` in `js/main.js` sits the rider on the biggest body blob), and hover heights for floaters and the waterspout rider. Long serpents read small on sheets because the whole body has to fit.

## House rules

- **Commit and push after every piece**, then publish the artifact:
  - The sources are in `src/` in the repo. `python3 tools/build.py` builds the single-file game to `index.html` at the repo root; that file is exactly what gets published.
  - Commit as `git -c user.name=Xral24 -c user.email=xral24@users.noreply.github.com commit`, ending the message with the Co-Authored-By and Claude-Session lines, then `git push -q origin HEAD`.
  - Publish the repo's `index.html` to artifact slug `95c42275-5e63-4850-a378-dd4d1b3950d6` as `index.html`, chaining `base_version` (get the live one with get_artifact first).
  - Add a line to `PROGRESS.md` before `## Still to do` each time.
- **Phone first.** The budget is about 2.3M vertices a frame after the last optimisation pass. Build detail in blocks and in the chunk mesher, not as entities, and check the fps readout stays reasonable.
- **Old saves must keep working.** A place that is already stamped needs a repair flag to restamp, the way `mineShaftFix2` and `pierWays` do.
- **Writing in the game and to him:** direct and informal, no em dashes, no rule-of-three lists, no templated structure. Villagers are humanoid folk. "Indians" stay "Indians".
- **Test harness:** `tools/test/` (Playwright; `npm i playwright`, Chromium with SwiftShader). Run as `ROOT=<repo>/src OUT=/tmp/ node tools/test/t-*.js`. `t-smoke.js` covers every layer, `t-sweep.js` walks every quest pin, `t-sink4.js` checks a Kin stands on the drawn slope, and the creature sheets are listed above. Headless is slow, so give screenshots a few seconds. Filter the console noise with `grep -v "proxy\|fonts\|Allowed\|On the Free\|For details\|connect\|SdkHttp\|Treat this"`.
- **Ground:** the soil is drawn as smooth slopes between block corners. Anything that stands on it should use `R.standY(world, x, z, blockTop, radius)`, which the buddy and wild Kin now do; the player has its own version in `js/player.js`.
- **Gotcha:** in a one-line JS edit, a `//` comment swallows the rest of the line. Use `/* */`.

