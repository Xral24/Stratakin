// The painted Flame attack in a real battle, beside the old one made of balls: pictures of the fireball in flight and of the burst, and whether its sounds came.
const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await page.setViewportSize({ width: 844, height: 420 }); await h.newGame('gal-1'); await h.calm();
  await ev(() => { const p = G.player; const r = KIN.roster('earth', 0, 0, 'Surface', 'Plains', 0); const e = Wild.makeEntity(r[0], 3, p.x + 3, p.y, p.z + 3); Wild.list.push(e); Battle.start(e, false); });
  await page.waitForTimeout(3000); await ev(() => Battle.fxTest('Flame', 'spec', false)); for (let i = 0; i < 40; i++) { await page.waitForTimeout(500); if (await ev(() => R.spriteReady('flame_ball') && R.spriteReady('flame_burst') && UI.sample('fx_flame_hit', 0, 0))) break; }
  console.log('art ready', JSON.stringify(await ev(() => [R.spriteReady('flame_ball'), R.spriteReady('flame_burst'), UI.sample('fx_flame_cast', 0, 0), UI.sample('fx_flame_hit', 0, 0)])));
  const run = async (tag, art, only) => { await ev((art) => { G.fxArt = art; }, art); await page.waitForTimeout(1500); await ev(() => Battle.fxTest('Flame', 'spec', false));
    let got = { ball: only === 'burst', burst: only === 'ball' }; const t0 = Date.now();
    while (Date.now() - t0 < 9000 && !(got.ball && got.burst)) { const st = await ev(() => { const s = Battle.fxSprites() || []; return { s: s.map(x => [x.name, Math.floor(x.frame)]), n: Battle.fxEntities().length, snd: Battle.fxSound }; });
      const ball = st.s.find(x => x[0] === 'flame_ball'), burst = st.s.find(x => x[0] === 'flame_burst');
      if (art && ball && !got.ball) { got.ball = true; await page.screenshot({ path: `/home/claude/scratch/fxart-${tag}-ball.png` }); console.log(tag, 'ball frame', ball[1], 'sound', st.snd); }
      else if (art && burst && burst[1] >= 2 && burst[1] <= 12 && !got.burst) { got.burst = true; await page.screenshot({ path: `/home/claude/scratch/fxart-${tag}-burst.png` }); console.log(tag, 'burst frame', burst[1]); }
      else if (!art && st.n > 20 && !got.ball) { got.ball = true; await page.screenshot({ path: `/home/claude/scratch/fxart-${tag}-ball.png` }); await page.waitForTimeout(260); await page.screenshot({ path: `/home/claude/scratch/fxart-${tag}-burst.png` }); got.burst = true; console.log(tag, 'old effect shot, particles', st.n); }
      await page.waitForTimeout(15); }
    console.log(tag, JSON.stringify(got)); };
  await run('new', true, 'ball'); await run('new', true, 'burst'); await run('old', false);
  console.log('ERRORS:', h.errors.slice(0, 3).join(' | ').slice(0, 400) || 'none', '| LOGS:', h.logs.filter(l => /effect|sound|INVALID|WebGL: /.test(l)).slice(0, 3).join(' | ').slice(0, 300)); await h.close(); })();
