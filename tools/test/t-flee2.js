const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h;
  for (const dir of [+process.env.DIR || 0]) { await h.newGame('look-3'); await h.calm();
  await ev(() => { G.repelUntil = 0; const p = G.player, w = G.world, t = Village.townList()[0]; p.x = t.x + 0.5; p.z = t.z + 12.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 99999); p.y = t.y + 0.05; });
  await page.waitForTimeout(1500);
  const a = await ev((dir) => { const v = Village.active, b = v && v.boss; if (!b) return null; window.__b = b; R.render = () => {}; const p = G.player; const o = [[5, 0], [-5, 0], [0, 5], [0, -5]][dir]; p.x = b.x + o[0]; p.z = b.z + o[1]; window.__y0 = b.y; window.__bad = 0; window.__maxy = b.y; window.__n = 0;
    const iv = setInterval(() => { const e = window.__b; if (!Village.entities().includes(e)) { clearInterval(iv); return; } window.__n++; window.__maxy = Math.max(window.__maxy, e.y); const id = G.world.getBlock(Math.floor(e.x), Math.floor(e.y + 0.6), Math.floor(e.z)); if (id && BLOCKS[id].solid) window.__bad++; }, 50);
    Wild.remove(b); Village.onBossGone(v.id); Village.freed(v.id); return { y: b.y }; }, dir);
  await page.waitForTimeout(6500);
  const s = await ev(() => { const b = window.__b, p = G.player; return { d: +Math.hypot(b.x - p.x, b.z - p.z).toFixed(1), climb: +(window.__maxy - window.__y0).toFixed(1), inWall: window.__bad, samples: window.__n, gone: !Village.entities().includes(b) }; });
  console.log(dir, JSON.stringify(s)); }
  console.log('ERRORS:', h.errors.slice(0, 3).join(' | ') || 'none'); await h.close(); })();
