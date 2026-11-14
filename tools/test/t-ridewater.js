const { open } = require('./harness'); const fs = require('fs');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('ride-1'); await h.calm();
  const where = await ev(() => { const p = G.player, w = G.world; for (const e of Wild.list.slice()) Wild.remove(e); G.stats.buddyOff = true; G.thirdPerson = true; G.world.time = 0.35; G.repelUntil = performance.now() + 9e6;
    const tc = Avatar.thirdCam; Avatar.thirdCam = (cam, pp, ww, b, l) => tc(Object.assign({}, cam, { yaw: cam.yaw + 1.2, pitch: -0.32 }), pp, ww, 7, l);
const all = Village.markers(p.x, p.z, 8).filter(m => m.kind === 'village' && m.type === 'sea'); all.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z)); const m = all[0]; if (m) { p.x = m.x + 30.5; p.z = m.z + 30.5; p.y = SEA + 3; return { x: Math.floor(p.x), z: Math.floor(p.z), top: SEA + 0.5 }; } return null; });
  console.log('water', JSON.stringify(where)); await page.waitForTimeout(6000); console.log('at', JSON.stringify(await ev(() => ({ y: G.player.y, inWater: G.player.inWater, b: G.world.getBlock(Math.floor(G.player.x), 45, Math.floor(G.player.z)) }))));
  const picks = [['water', 'Tide', 0, 2], ['serpent', 'Tide', 0, 3], ['water', 'Bloom', 0, 3]]; const shots = [];
  for (let i = 0; i < picks.length; i++) {
    const nm = await ev(([pk, i, where]) => { const [fam, el, li, st] = pk; const shapeOf = { serpent: 'serpent', water: 'fish' }; const line = KIN.LINES[fam][el][li]; const sp = KIN.species(U.combine(0x7171, i * 31 + 5), [el], 1, { primary: el, shape: shapeOf[fam], total: 420, rarity: 1 }); Object.defineProperty(sp, '_line', { value: line, writable: true }); sp.fast = true;
      const k = KIN.create(sp, 40); k.stage = st; k.tamed = true; const p = G.player; p.mount = null; p.x = where.x + 0.5; p.z = where.z + 0.5; p.y = where.top; G.kin.length = 1; G.addKin(k); G.activeIdx = G.kin.indexOf(k); G.mountKin(k); p.yaw = 0.9; return KIN.name(k) + ' mounted=' + !!p.mount + ' mode=' + p.mountMode + ' inWater=' + p.inWater; }, [picks[i], i, where]);
    await page.waitForTimeout(2500); await ev(() => { for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } }); const f = `/home/claude/ridew-${i}.png`; await page.screenshot({ path: f, clip: { x: 0, y: 120, width: 390, height: 520 } }); shots.push(f); console.log(nm);
  }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
