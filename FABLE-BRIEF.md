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
