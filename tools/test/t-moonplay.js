const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('gal-1'); await h.calm();
  for (const body of ['moon', 'halo']) {
    const r0 = await ev((body) => { try { G.travel(body); return 'ok'; } catch (e) { return 'ERR ' + e.message; } }, body); await page.waitForTimeout(9000);
    const r = await ev(() => { const p = G.player; G.repelUntil = 0; const out = { world: G.worldId, y: Math.round(p.y), wild: Wild.list.length, kinds: {} };
      for (const e of Wild.list) { const id = KIN.nativeId(e.kin.sp) || ('line:' + ((KIN.lineOf(e.kin.sp) || [[0, 'legacy']])[0][1])); out.kinds[id] = (out.kinds[id] || 0) + 1; }
      // what the game would hand out here: roster by biome, the steeds, a starter fusion
      const b = G.worldId; const dx = KIN.dex(b); out.steeds = dx.filter(sp => sp.steed).map(sp => sp.names[0] + ':' + (KIN.nativeId(sp) || 'earth-line')); out.village = !!Village.active; out.rare = dx.filter(sp => sp.home && sp.rarity === 3).map(sp => sp.names[0]).slice(0, 4);
      const errs = []; for (const sp of dx.slice(0, 60)) { try { const k = KIN.create(sp, 30); KIN.moves(k); KIN.stats(k); G.rideMode(k); } catch (e) { errs.push(sp.names[0] + ' ' + e.message); } } out.errs = errs.slice(0, 3); return out; });
    console.log(body, r0, JSON.stringify(r)); await ev(() => { for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } }); await page.waitForTimeout(6000); await page.screenshot({ path: '/home/claude/play-' + body + '.png', clip: { x: 0, y: 120, width: 390, height: 480 } });
  }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
