# (Superseded in part on 23 Nov 2026: the people and the world's objects stay drawn in code; Higgsfield is used for sound, painted attack effects, a few story videos and flat artwork. See PROGRESS.md.)

# Stratakin art plan (agreed with Alexander, 22 Nov 2026)

Started 22 Nov: the ten reference pictures are approved and kept in `art/style/`, the GLB loader is in, and the main cast wear their own models, remade the same evening at the phone's ceiling on Meshy 7 ultra (Finch, Silas, Stonewall, the Kinmaster, Varga, Hask, Garrick, Maren, Brannock, and Keychain and Bigmouth as the Kin they are: a lizard and a toad). The Kindex is cut to about 150 forms (DEX-CUT.md), which is the list Kin art is made from. Credits and job ids: `art/ref/JOBS.md`.

## Quality first (Alexander, 22 Nov 2026)
Never pick the cheapest setting on your own, and never go past what a phone can show either: the target is the most a phone screen can display, worked out, not guessed. For characters that is a 2048 texture (a figure fills about 1,000 pixels of the screen at most, so 2048 is already more than a texel a pixel; 4096 costs four times the memory for nothing you can see) and about 40,000 triangles (under a pixel a triangle at any distance he is met at). The tool for it is Meshy 7 in ultra mode, 50k triangles, A-pose, rigged in the same call (53.5 credits): it won a three-way test on Finch against Tripo H3.1 detailed and Tripo P2 extreme. The first cast went out on Tripo's budget settings (10k faces, standard texture) with textures cut to 1024 on the phone, and he called it out: it looks poor. Use the best settings each tool offers by default (detailed or extreme texture, detailed geometry, full PBR maps, high face counts) and only go cheaper when he says so. The credit limit below still holds.

## Hard credit limit (Alexander, 22 Nov 2026)
**Never spend money.** The budget is the Ultra allowance only: 3,010 credits at the start. Never buy a credit pack, never turn on auto-refill, never upgrade the plan, never accept anything that charges his card. If a step needs more credits than are left, stop and tell him; the answer to spending more is an automatic no. Inside the allowance, use the credits freely and fit everything in. Check `mcp__Higgsfield__balance` before each batch.

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

## Effects
Sword slashes, hit sparks, element bursts (fire, water, light, void...), level-up and catch flashes, dust and splash: Higgsfield makes flat sprite sheets and soft textures for these (an image each, 1 to 2 credits), the code animates them as trails and particles. Added 22 Nov at Alexander's ask.

## Real prices (checked 22 Nov with cost preflights)
- Images: GPT Image 2.6 medium 1k is 1 credit; Nano Banana 2 is 1.5; Nano Banana Pro is 2.
- 3D: Tripo H3.1 image-to-3D, textured, no PBR, 10k faces: **9 credits**. Hunyuan3D v3 LowPoly: 14. Tripo P2 game-ready: 34. Meshy 7 low-poly textured: 38.
- So the budget below came in far cheaper than feared: a finished model is roughly 2 images plus 1 or 2 tries at 9, about 13 to 22 credits.
- A rig with one animation clip (Meshy `3d_rigging`): **8 credits**; 5 with no clip. A finished, walking character is about 2 to 6 for its pictures, 9 for the model and 8 for the rig: roughly 20 to 25.
- Spent so far: 983.5 credits (reference pictures and front views, the first cast on Tripo, the quality test, the eleven-strong cast on Meshy 7 ultra, second clips). Balance 2,026.5 on 22 Nov, night.

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
