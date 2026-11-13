const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame('smoke-7');
  const spots = await ev(() => { const s = []; const v = Village.townList(); s.push(['start', G.world.spawn.x, G.world.spawn.z, null]); s.push(['city', v.find(t => t.size === 'city').x, v.find(t => t.size === 'city').z, null]);
    const c = Camps.all()[0]; if (c) s.push(['camp', c.x, c.z, null]); const k = Keeps.sites()[0]; s.push(['hold', k.x, k.z - 20, null]); const f = Farms && Farms.all ? null : null;
    const S = Sky.sites(); s.push(['highmere', S[0].x, S[0].z, S[0].y + 2]); s.push(['stormspire', S[1].x, S[1].z - 25, S[1].y + 2]); const kc = Keeps.sites().find(x => x.core); s.push(['corehold', kc.x, kc.z - 25, 8]); return s; });
  for (const [name, x, z, y] of spots) {
    await ev(([x, z, y]) => { const p = G.player; p.x = x + 0.5; p.z = z + 0.5; G.world.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 2, 9999); p.y = y != null ? y : G.world.groundY(Math.floor(p.x), Math.floor(p.z)) + 1.5; p.vy = 0; p.hp = p.maxHp; }, [x, z, y]);
    await page.waitForTimeout(2500);
    const r = await ev(() => ({ y: Math.round(G.player.y), hp: G.player.hp, layer: G.world.layerAt(Math.floor(G.player.y), Math.floor(G.player.x), Math.floor(G.player.z)) }));
    console.log(name, JSON.stringify(r), 'errors so far:', h.errors.length);
  }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 5).join('\n') : 'none'); await h.close(); })();
