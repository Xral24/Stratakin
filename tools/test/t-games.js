// the games of the towns: the ringboard thrown through (five hearts must win), a game of draughts played out with the first legal move every turn
// (the champion must beat that), and the first village must have a games hall with stakes on offer
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm(); const out = {}; await ev(() => { R.render = () => {}; }); // nothing of the world needs drawing for this, and a drawn frame takes seconds here
  await ev(() => { window.__res = null; Games.play('ringboard', { champ: 'Marta Steadyhand', stake: 10, skill: 0.3, onEnd: (r) => { window.__res = r; } }); });
  await page.waitForTimeout(900); await page.screenshot({ path: '/home/claude/games-0.png', timeout: 120000 });
  out.ringSteps = await ev(() => { const s = Games.current; let n = 0; for (let i = 0; i < 4000 && !s.over; i++) { if (s.debug.throwAt(0.01, -0.01)) n++; s.debug.step(0.05); } return n; }); // the clock is stepped by hand: a frame here takes seconds out.ring = await ev(() => { const s = Games.current; return { over: s.over, you: s.you.map(q => q.s), them: s.them.map(q => q.s) }; });
  await page.screenshot({ path: '/home/claude/games-1.png', timeout: 120000 });
  await ev(() => document.querySelector('#gamebox .gb-foot .btn').click()); out.ringRes = await ev(() => ({ res: window.__res, open: !!document.getElementById('gamebox'), paused: G.paused }));
  await ev(() => { window.__res = null; Games.play('draughts', { champ: 'Tobin Rook', stake: 40, skill: 0.5, onEnd: (r) => { window.__res = r; } }); });
  await page.waitForTimeout(500); await page.screenshot({ path: '/home/claude/games-2.png', timeout: 120000 });
  let moves = 0; for (; moves < 22; moves++) { const st = await ev(() => { const s = Games.current; if (!s || s.over) return 'over'; if (s.busy || s.side !== 1) return 'wait'; const ms = s.debug.legal(); if (!ms.length) return 'none'; s.debug.play(ms[0]); return 'played'; }); if (st === 'over' || st === 'none') break; if (st === 'wait') moves--; await page.waitForTimeout(st === "played" ? 650 : 250); if (moves === 6) await page.screenshot({ path: '/home/claude/games-3.png', timeout: 120000 }); }
  out.draughts = await ev(() => { const s = Games.current; return s ? { over: s.over, you: s.b.flat().filter(p => p > 0).length, them: s.b.flat().filter(p => p < 0).length } : null; }); out.moves = moves;
  await page.screenshot({ path: '/home/claude/games-4.png', timeout: 120000 });
  await ev(() => { const b = document.querySelector('#gamebox .gb-foot .btn'); if (b) b.click(); }); out.drRes = await ev(() => window.__res);
  // a tap-through of one move by the squares, the way a finger does it
  out.tap = await ev(() => { Games.play('draughts', { champ: 'T R', stake: 1, skill: 0.2 }); const sq = [...document.querySelectorAll('#gamebox .gb-sq')]; const at = (r, c) => sq[r * 8 + c]; const pd = (e) => e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); pd(at(5, 0)); const go = document.querySelectorAll('#gamebox .gb-sq.go').length; const sq2 = [...document.querySelectorAll('#gamebox .gb-sq')]; pd(sq2[4 * 8 + 1]); const s = Games.current; return { go, moved: s.b[4][1] === 1 && s.b[5][0] === 0, side: s.side }; });
  await ev(() => Games.close());
  out.hall = await ev(() => { const v = Village.townList()[0]; const L = Village.layout(v), sh = L.shops.find(s => s.kind === 'games'); const d = Village.shopDef ? Village.shopDef('games', v) : null; return { shop: !!sh, kinds: L.shops.map(s => s.kind), def: d && { title: d.title, keeper: d.keeper, greet: d.greet, stock: d.stock.map(s => s.name + ' / ' + s.stake) } }; });
  console.log(JSON.stringify(out, null, 1)); console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 5).join('\n') : 'none'); await h.close(); })();
