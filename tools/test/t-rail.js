const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  await ev(() => { R.render = () => {}; setInterval(() => { const v = Village.active; if (v && v.boss) v.boss.fought = true; }, 20); });
  const n = await ev(() => Village.townList().length);
  for (let i = 0; i < Math.min(n, +(process.env.N || 3)); i++) {
    await ev((i) => { const v = Village.townList()[i], p = G.player; p.x = v.x + 0.5; p.z = v.z + 0.5; p.y = v.y + 30; G.world.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 4, 99999); }, i);
    await page.waitForTimeout(2500);
    console.log(JSON.stringify(await ev((i) => { const v = Village.townList()[i]; const rl = Village.layout(v).rail; if (!rl) return v.name + ' no rail'; const w = G.world; const base = rl.ax ? v.x : v.z; let row = '';
      for (let d = -v.R; d <= v.R + 45; d++) { const a = base + rl.sgn * d; let ch = '.'; for (let k = 0; k <= 3 && ch === '.'; k = k > 0 ? -k : -k + 1) { const x = rl.ax ? a : rl.line + k, z = rl.ax ? rl.line + k : a; for (let y = v.y - 12; y <= v.y + 12; y++) { const b = w.getBlock(x, y, z); if (b === B.RAIL) { ch = k ? 'r' : 'R'; break; } if (b === B.TRACK) { ch = k ? 't' : 'T'; break; } } } row += ch; }
      return { name: v.name, R: v.R, wr: Village.wallRadiusOf(v), row }; }, i)));
  }
  console.log(await ev(() => { const v = Village.townList()[0], w = G.world; let out = ''; for (let z = v.z - 150; z <= v.z + 150; z += 3) { let r = ''; for (let x = v.x - 180; x <= v.x + 180; x += 3) { let t = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (w.trackAt(x + a, z + b)) t = 1; r += t ? '#' : (Math.hypot(x - v.x, z - v.z) < v.R ? 'o' : ' '); } out += r.replace(/ +$/, '') + '\n'; } return out; }));
  console.log('errors', JSON.stringify(h.errors.slice(0, 4)));
  await h.close(); })();
