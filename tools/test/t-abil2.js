const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame('gal-1'); await h.calm();
  await ev(() => { document.getElementById('hb-ld').click(); }); await page.waitForTimeout(3000);
  await ev(() => { window.__ldFast = true; document.querySelector('#gamebox .gb-foot .btn.big').click(); }); await page.waitForTimeout(2000);
  const r = await ev(async () => { const S = Linkdown.state, out = {}; const all = S.me.deck.concat(S.me.hand).filter(c => c.type === 'kin'); const foeK = S.ai.deck.concat(S.ai.hand).filter(c => c.type === 'kin');
    const put = (sd, c, i, pos) => { for (const arr of [sd.deck, sd.hand]) { const j = arr.indexOf(c); if (j >= 0) arr.splice(j, 1); } c.pos = pos; c.swings = pos === 'atk' ? 1 : 0; c.shown = true; sd.field[i] = c; };
    const reset = () => { S.me.field = [null, null, null]; S.ai.field = [null, null, null]; S.ai.trap = null; S.me.lp = 5000; S.ai.lp = 5000; S.busy = false; };
    // striker pierce
    reset(); const a = all[0], d = foeK[0]; a.role = 'striker'; a.atk = 2000; a.temp = 0; a.k = Object.assign({}, a.k, { bonded: false }); d.role = 'allrounder'; d.def = 1200; d.k = Object.assign({}, d.k, { bonded: false }); put(S.me, a, 0, 'atk'); put(S.ai, d, 0, 'def');
    await S.api.attack(0, 0); out.striker = [S.ai.lp, S.ai.field.filter(Boolean).length];
    // racer dodge
    reset(); const a2 = all[1], d2 = foeK[1]; a2.role = 'bruiser'; a2.atk = 1500; a2.temp = 0; d2.role = 'racer'; d2.atk = 800; d2.dodged = false; d2.k = Object.assign({}, d2.k, { bonded: false }); put(S.me, a2, 0, 'atk'); put(S.ai, d2, 0, 'atk');
    await S.api.attack(0, 0); out.racer = [S.ai.lp, S.ai.field.filter(Boolean).length];
    // bonded hold fast + bruiser
    reset(); const a3 = all[2], d3 = foeK[2]; a3.role = 'bruiser'; a3.atk = 1500; a3.temp = 0; a3.swings = 2; d3.role = 'allrounder'; d3.atk = 1000; d3.k = Object.assign({}, d3.k, { bonded: true }); d3.held = false; put(S.me, a3, 0, 'atk'); put(S.ai, d3, 0, 'atk'); a3.swings = 2;
    await S.api.attack(0, 0); out.hold = [S.ai.lp, S.ai.field.filter(Boolean).length]; await S.api.attack(0, 0); out.hold2 = [S.ai.lp, S.ai.field.filter(Boolean).length];
    return out; });
  console.log(JSON.stringify(r)); console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
