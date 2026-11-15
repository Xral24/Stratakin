// the train's films: fix the start station, watch the first train come in, then ride and watch the boarding
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.world.time = 0.42; for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } });
  const a = await ev(() => { const v = Village.active, L = Village.layout(v), rl = L.rail, p = G.player, w = G.world; if (!rl) return 'no rail'; const W = (al, pp) => rl.ax ? [al, rl.line + 0.5 + pp] : [rl.line + 0.5 + pp, al]; const [x, z] = W(rl.along0 + 0.5, 3); p.x = x; p.z = z; p.y = rl.y + 0.05; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 9999); G.meshPass(999);
    G.addRoost({ id: v.id, name: v.name, x: p.x, y: v.y, z: p.z, world: w.preset.id }); return { ok: Village.trainFilm(v), along0: rl.along0, y: rl.y }; });
  console.log('arrive film', JSON.stringify(a));
  const tick = async (secs) => await ev((n) => { for (let i = 0; i < n; i++) Village.update(0.05, G.player, false); return { frozen: G.player.frozen, cut: !!G.cutCam, went: !!window.__went, bubbles: document.querySelectorAll('body > div[style*="fffdf4"]').length }; }, Math.round(secs / 0.05));
  console.log('arrive 3.0s', JSON.stringify(await tick(3.0))); await page.waitForTimeout(4500); await page.screenshot({ path: '/home/claude/film-0.png' });
  console.log('arrive 7.0s', JSON.stringify(await tick(4.0)));
  console.log('board', JSON.stringify(await ev(() => ({ ok: Village.boardTrain(Village.active, () => { window.__went = true; }) }))));
  console.log('board 1.0s', JSON.stringify(await tick(1.0))); await page.waitForTimeout(4500); await page.screenshot({ path: '/home/claude/film-1.png' });
  console.log('board 3.6s', JSON.stringify(await tick(2.6))); await page.waitForTimeout(4500); await page.screenshot({ path: '/home/claude/film-2.png' });
  console.log('board 6.0s', JSON.stringify(await tick(2.4)));
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
