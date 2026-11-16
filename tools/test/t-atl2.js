// Atlantis, the bigger city: can you walk to everything, do the shelf, the teacher and a stall work, is anybody standing in a wall
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  await ev(() => { R.render = () => {}; G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; });
  const r = await ev(() => { const a = Village.atlantis(), p = G.player, w = G.world; p.x = a.x + 0.5; p.z = a.z + 16.5; p.y = a.y + 0.05; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 5, 99999); for (let k = 0; k < 5; k++) Village.update(0.05, p, false);
    const v = Village.active, L = w.atlantis, vy = a.y, blk = (x, y, z) => w.getBlock(a.x + x, y, a.z + z), sol = (x, y, z) => { const b = blk(x, y, z); return b !== B.AIR && b !== B.WATER && b !== undefined && isSolid(b); };
    const walk = (x, z) => sol(x, vy - 1, z) && !sol(x, vy, z) && !sol(x, vy + 1, z) && blk(x, vy, z) !== B.WATER;
    const seen = new Set(['0,16']), q = [[0, 16]]; while (q.length) { const [x, z] = q.pop(); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz, k = nx + ',' + nz; if (seen.has(k) || Math.hypot(nx, nz) > 60 || !walk(nx, nz)) continue; seen.add(k); q.push([nx, nz]); } }
    const near = (x, z) => { for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (seen.has((Math.round(x) + dx) + ',' + (Math.round(z) + dz))) return true; return false; };
    const miss = [];
    L.civic.forEach(c => { if (!near(c.x - Math.cos(c.a) * 3.5, c.z - Math.sin(c.a) * 3.5)) miss.push('inside ' + c.kind); });
    L.courts.forEach((c, i) => { if (!near(c.x - Math.cos(c.a) * 3.5, c.z - Math.sin(c.a) * 3.5)) miss.push('court ' + i + ' ' + c.kind); });
    L.pods.forEach((c, i) => { if (!near(c.x - Math.cos(c.a) * 1.2, c.z - Math.sin(c.a) * 1.2)) miss.push('home ' + i); });
    L.halls.forEach((c) => { if (!near(c.x - Math.cos(c.a) * 2.8, c.z - Math.sin(c.a) * 2.8)) miss.push('hall ' + c.kind); });
    L.stalls.forEach((c) => { if (!near(c.x - Math.cos(c.a) * 1.6, c.z - Math.sin(c.a) * 1.6)) miss.push('stall ' + c.kind); });
    L.gates.forEach((g, i) => { if (!near(g[0] * 54, g[1] * 54)) miss.push('gate ' + i); });
    const stuck = v.npcs.filter(n => { const x = Math.floor(n.x) - a.x, z = Math.floor(n.z) - a.z; return sol(x, vy, z) || sol(x, vy + 1, z); }).map(n => n.name);
    const wet = v.npcs.filter(n => w.getBlock(Math.floor(n.x), vy - 1, Math.floor(n.z)) === B.WATER).map(n => n.name);
    const cut = v.npcs.filter(n => !seen.has((Math.floor(n.x) - a.x) + ',' + (Math.floor(n.z) - a.z))).map(n => n.name);
    let books = 0, rill = 0; for (let dx = -58; dx <= 58; dx++) for (let dz = -58; dz <= 58; dz++) { if (blk(dx, vy, dz) === B.BOOKS) books++; const rr = Math.hypot(dx, dz); if (rr > 16 && rr < 32.8 && blk(dx, vy - 1, dz) === B.WATER) rill++; }
    return { walkable: seen.size, miss, stuck, wet, cut, npcs: v.npcs.length, books, rillWater: rill }; });
  console.log(JSON.stringify(r));
  const b = await ev(() => { const out = {}; out.open = Books.open('atlantis'); const box = document.getElementById('bookbox'); out.covers = box.querySelectorAll('.bk-cover').length; out.head = box.querySelector('.bk-head').textContent;
    const n = Books.total('atlantis'); for (let i = 0; i < n; i++) { box.querySelectorAll('.bk-cover')[i].click(); let guard = 0; while (guard++ < 30) { const nx = box.querySelector('[data-p="1"]'); if (!nx) break; const last = /Close/.test(nx.textContent); if (i === 0 && guard === 1) out.first = box.querySelector('.bk-page').textContent.slice(0, 90); nx.click(); if (last) break; } }
    out.read = Books.count('atlantis'); out.head2 = box.querySelector('.bk-head').textContent; Books.close(); out.closed = !document.getElementById('bookbox');
    const v = Village.active, t = v.npcs.find(x => x.atl === 'teacher'), s0 = G.shards; Village.talk(t); out.prize = G.shards - s0; Village.talk(t); out.prizeAgain = G.shards - s0 - out.prize; return out; });
  console.log(JSON.stringify(b));
  const s = await ev(() => { const v = Village.active, k = v.npcs.find(x => x.shop === 'stall_plums'), def = Village.shopDef('stall_plums', v), b0 = G.player.count('berry'); G.shards = Math.max(G.shards, 50); const s1 = G.shards; const ok = Village.buy(def, def.stock[0]);
    const talks = {}; for (const kind of ['home', 'archive', 'garden', 'statue', 'clock', 'pupil', 'child']) { const n = v.npcs.find(x => x.atl === kind); try { Village.talk(n); talks[kind] = 'ok'; } catch (e) { talks[kind] = e.message; } } const ind = v.npcs.find(x => x.indoors); try { Village.talk(ind); talks.indoors = 'ok'; } catch (e) { talks.indoors = e.message; }
    return { keeper: k && k.name, title: k && k.shopTitle, ok, paid: s1 - G.shards, berries: G.player.count('berry') - b0, stalls: v.npcs.filter(x => /^stall_/.test(x.shop || '')).map(x => x.name + ':' + x.shopTitle), talks }; });
  console.log(JSON.stringify(s));
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 6).join('\n') : 'none', h.logs.filter(l => !/ReadPixels|TUNNEL/.test(l)).slice(0, 4).join(' | ')); await h.close(); })();
