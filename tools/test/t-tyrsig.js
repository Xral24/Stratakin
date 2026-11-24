// The tyrants' own attacks: the first village's tyrant has one, and its picture and sound arrive; then each kind's, stopped in a battle.
const { open } = require('./harness');
const IDS = (process.argv[2] || 'x_tyr_liz,x_tyr_toad,x_tyrant').split(',');
(async () => { const h = await open(); const { ev, page } = h; await page.setViewportSize({ width: 844, height: 420 }); await h.newGame('gal-1'); await h.calm();
  const boss = await ev(() => { const out = []; for (const e of Wild.list) if (e.isBoss) out.push({ name: KIN.name(e.kin), nat: KIN.nativeId(e.kin.sp), lvl: e.kin.level, stage: e.kin.stage, moves: KIN.moves(e.kin).map(m => m.name + (m.sig ? '★' : '') + (m.power ? ' ' + m.power : '')) }); return out; });
  console.log('bosses in the world now:', JSON.stringify(boss).slice(0, 700));
  await ev(() => { const p = G.player; const r = KIN.roster('earth', 0, 0, 'Surface', 'Plains', 0); const e = Wild.makeEntity(r[0], 3, p.x + 3, p.y, p.z + 3); Wild.list.push(e); Battle.start(e, false); });
  await page.waitForTimeout(2500); await ev((ids) => { for (const id of ids) Battle.sigArt(id); }, IDS);
  for (let i = 0; i < 80; i++) { await page.waitForTimeout(700); if (await ev((ids) => ids.every(id => Battle.sigReady(id) && UI.sample('sig_' + id, 0, 0)), IDS)) break; }
  console.log('ready', JSON.stringify(await ev((ids) => ids.map(id => [id, Battle.sigReady(id), UI.sample('sig_' + id, 0, 0)]), IDS)));
  for (const id of IDS) for (const [j, t] of [[0, 0.4], [1, 0.8]]) { const s = await ev(([id, t]) => { Battle.fxAt(id, t); return { n: (Battle.fxSprites() || []).map(x => x.name.replace('sig_' + id + '_', '') + ':' + Math.floor(x.frame)), snd: Battle.fxSound }; }, [id, t]);
    await page.waitForTimeout(2500); try { await page.screenshot({ path: `/home/claude/scratch/tyrsig-${id}-${j}.png`, clip: { x: 0, y: 0, width: 844, height: 250 }, timeout: 90000 }); } catch (e) { console.log('shot failed', id, j); } console.log(id, j, JSON.stringify(s)); }
  await ev(() => Battle.fxAt(null)); console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
