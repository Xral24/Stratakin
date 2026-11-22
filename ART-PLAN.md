# Stratakin art plan (agreed with Alexander, 22 Nov 2026)

Nothing here has been started. Alexander says go before any of it is built.

## The look
Benchmark is the latest Zelda. The look comes mostly from lighting, colour and shapes, so the renderer does most of the work and Higgsfield supplies the 2D art and a small number of 3D models.

Surface rule, all three worlds:
- On top everything is smooth and organic: grass, sand, regolith, Halo dunes, snow, roads, paths, banks. Trees, rocks and props are never boxes.
- The moment you dig, it is cubes. Mines, caves and dug holes keep the Minecraft feel.
- Lava and the Core stay cubes too, but with softened edges, not raw sharp blocks.
- Any square lump left standing on the surface is a bug (the cubes outside the first village, the blocks around Zorim on the Moon).

## Order of work
1. **Reference pictures** on Higgsfield: one per place on Earth, the Moon and Halo, one per main character, and a Kin sheet per world. Alexander approves them and they become the style guide.
2. **Renderer upgrade** in our own engine (no move to three.js: the game is too big to port safely): toon shading, rim light, soft glow, haze, a proper smooth ground mesh over the voxels, and a loader for Higgsfield's GLB files (static and skinned).
3. **Textures** for every world's materials from Higgsfield.
4. **Kin**: cut the dex to about 150 forms across the three worlds, evolutions included (like the original 151). Fusion stays for variety. Each Kin gets a Higgsfield concept picture and painted skin; the bodies are built in code from the concept. The Lost World keeps five dinosaurs only: long-neck, Triceratops, T-Rex (Tyrannorex), Raptor, Mosasaurus (Abyssaurus).
5. **Headline 3D models** from Higgsfield: about 20 Kin (starters, the five dinos, Umbrarch, legends), about 12 main characters (Finch, Kinmaster, the three tyrants, Varga, Hask, Garrick and the cast), the house type of each world (Earth houses, Moon pods, Halo huts) and the Starlark.
6. **Everything else in code** with the new textures and the reference pictures: every town on Earth, the Moon and Halo, the Starwell, the Pit, the Garrison, the Citadel, Atlantis, Highmere, the Skyroot, roads, rails, trees, rocks and props. The big landmarks are too large for image-to-3D, so they cost time, not credits.

## Budget (credits, rough)
| Item | Credits |
|---|---|
| Reference pictures | 150 to 300 |
| Textures, all three worlds | 300 to 600 |
| 150 Kin: concept picture and skin each | 600 to 1,200 |
| About 20 headline Kin models | 600 to 2,200 |
| About 12 characters, house types, Starlark | 550 to 2,000 |
| **Total** | **about 2,200 to 6,300** |

That's one to two months of Ultra (3,000 credits, $129 a month plus VAT). Images cost 2 credits (4 in 4K). The price of one 3D model on Higgsfield is not published; the first test model pins it and this table gets redone. Subscription credits reset monthly; top-up packs are about $5 per 100 and expire after 90 days. Start on Plus or Ultra 3,000, not 9,000.

## Setup before starting
- Higgsfield subscription without watermarks.
- Add Higgsfield in Claude as a custom connector: https://mcp.higgsfield.ai/mcp, then sign in.
- Switch on network access for Claude's workspace so generated files can be downloaded into the project (it may only take effect in a new chat).
- Opus can do all of it; Fable is welcome for the renderer upgrade.
