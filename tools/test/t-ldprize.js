const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame('gal-1'); await h.calm();
  await ev(() => { const sps = KIN.dex('earth').filter(s => !s.fusion && s.home && (s.rarity||0) == 2 && !KIN.starters(G.baseSeed).some(q => q.seed === s.seed)); for (let i = 0; i < 5; i++) G.addKin(KIN.create(sps[i % sps.length], 60)); });
  async function playGame(o) {
    await ev((o) => Linkdown.play(o), o); await page.waitForTimeout(500);
    if (o.mode === 'stake') await ev(() => { const ids = [...document.querySelectorAll('.ld-pk.on')].map(e => e.dataset.k); for (const id of ids.reverse()) { const k = G.kin.find(x => x.id == id); if (k && Linkdown.stakeable(k)) { document.querySelector(`.ld-pk[data-k="${id}"]`).click(); return; } } });
    await ev(() => document.querySelector('#gamebox .gb-foot .btn.big').click()); await page.waitForTimeout(300);
    for (let t = 0; t < 5; t++) { await ev(() => document.querySelector('.ld-h').click()); await ev((t) => document.querySelectorAll('.ld-lane')[t % 3].click(), t);
      await ev(() => [...document.querySelectorAll('#gamebox .gb-foot .btn')].find(b => b.textContent === 'Flip').click()); await page.waitForTimeout(150);
      await ev(() => { const k = [...document.querySelectorAll('#gamebox .gb-foot .btn')].find(b => b.textContent.startsWith('Keep')); if (k) k.click(); }); }
    const say = await ev(() => document.querySelector('#gamebox .gb-say').textContent); await ev(() => document.querySelector('#gamebox .gb-foot .btn').click()); return say; }
  console.log('1:', await playGame({ mode: 'friendly', champ: 'Pip Hollis', tier: 0, skill: 0.3, villageId: 'vX' }));
  console.log('rec', JSON.stringify(await ev(() => Linkdown.townRec('vX'))), 'prize', await ev(() => KIN.name(Linkdown.prizeFor('vX', 0))));
  const n0 = await ev(() => G.kin.length + G.box.length);
  console.log('2:', await playGame({ mode: 'stake', prize: true, champ: 'Pip Hollis', tier: 0, skill: 0.45, villageId: 'vX' }));
  console.log('rec', JSON.stringify(await ev(() => Linkdown.townRec('vX'))), 'gained', (await ev(() => G.kin.length + G.box.length)) - n0, 'need tier6', await ev(() => Linkdown.need(6)));
  console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
