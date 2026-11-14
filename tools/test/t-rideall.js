const { open } = require('./harness'); const fs = require('fs');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('ride-1'); await h.calm();
  const picks = JSON.parse(process.env.PICKS || '[["land","Flame",1,2],["land","Stone",0,3],["land","Tide",3,1],["bird","Gale",0,3],["floater","Stone",0,3],["serpent","Tide",0,3]]');
  await ev(() => { const v = Village.def; const p = G.player; p.x = v.x + 0.5; p.z = v.z + 4.5; p.y = G.world.groundY(Math.floor(p.x), Math.floor(p.z)) + 1; for (const e of Wild.list.slice()) Wild.remove(e); G.buddyOff = true; G.stats.buddyOff = true; G.thirdPerson = true; G.world.time = 0.35;
    const tc = Avatar.thirdCam; Avatar.thirdCam = (cam, pp, w, b, l) => tc(Object.assign({}, cam, { yaw: cam.yaw + 1.2, pitch: -0.32 }), pp, w, 7, l); });
  const shots = [];
  for (let i = 0; i < picks.length; i++) {
    const nm = await ev(([pk, i]) => { const [fam, el, li, st] = pk; const shapeOf = { land: 'quadruped', biped: 'biped', bird: 'bird', serpent: 'serpent', floater: 'floater', water: 'fish' }; const line = KIN.LINES[fam][el][li]; const sp = KIN.species(U.combine(0x7171, i * 31 + el.length * 7), [el], 1, { primary: el, shape: line[0][0] === 'blob' && fam === 'land' ? 'quadruped' : shapeOf[fam], total: 420, rarity: 1 }); Object.defineProperty(sp, '_line', { value: line, writable: true }); sp.fast = true;
      const k = KIN.create(sp, 40); k.stage = st; k.tamed = true; const p = G.player; if (p.mount) { p.mount = null; } G.kin.length = 1; G.addKin(k); G.activeIdx = G.kin.indexOf(k); G.mountKin(k); p.yaw = 0.9; p.vx = p.vz = 0; return line[Math.min(st, line.length) - 1][1] + ' ' + p.mountMode; }, [picks[i], i]);
    await page.waitForTimeout(1800); const f = `/home/claude/ride-${i}.png`; await ev(() => { for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } }); await page.screenshot({ path: f, clip: { x: 0, y: 120, width: 390, height: 520 } }); shots.push([f, nm]); console.log(nm);
  }
  fs.writeFileSync('/home/claude/ride-list.json', JSON.stringify(shots));
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
