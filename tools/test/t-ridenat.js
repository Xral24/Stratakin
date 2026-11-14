const { open } = require('./harness'); const fs = require('fs');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('ride-1'); await h.calm();
  const picks = JSON.parse(process.env.PICKS || '[["lost","d_raptor","raptor","Bloom",3],["lost","d_pachy","raptor","Flame",3],["lost","d_trike","horned","Stone",3],["moon","m_ibex","quadruped","Light",3],["halo","h_camel","quadruped","Frost",3],["moon","m_jerboa","quadruped","Gale",3]]');
  await ev(() => { const v = Village.def; const p = G.player; p.x = v.x + 0.5; p.z = v.z + 4.5; p.y = G.world.groundY(Math.floor(p.x), Math.floor(p.z)) + 1; for (const e of Wild.list.slice()) Wild.remove(e); G.buddyOff = true; G.stats.buddyOff = true; G.thirdPerson = true; G.world.time = 0.35;
    const tc = Avatar.thirdCam; Avatar.thirdCam = (cam, pp, w, b, l) => tc(Object.assign({}, cam, { yaw: cam.yaw + 1.2, pitch: -0.32 }), pp, w, 7, l); });
  for (let i = 0; i < picks.length; i++) {
    const nm = await ev(([pk, i]) => { const [body, id, sh, el, st] = pk; const lost = body === 'lost'; const sp = KIN.species(U.combine(0x7171, i * 31 + 5), [el], 1, { primary: el, shape: sh, total: 420, rarity: 1, neon: !lost }); if (lost) sp.dino = true; sp.home = { body: lost ? 'earth' : body, layer: 'Surface', biome: lost ? 'Lost World' : 'Mare' }; sp._line = KIN.nativeLine(id, sh); KIN.nativize(sp); sp.fast = true;
      const k = KIN.create(sp, 40); k.stage = st; k.tamed = true; const p = G.player; if (p.mount) p.mount = null; G.kin.length = 1; G.addKin(k); G.activeIdx = G.kin.indexOf(k); G.mountKin(k); p.yaw = 0.9; p.vx = p.vz = 0; return id + ' ' + p.mountMode + ' mounted=' + !!p.mount; }, [picks[i], i]);
    await page.waitForTimeout(1800); await ev(() => { for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } }); await page.screenshot({ path: `/home/claude/rn-${i}.png`, clip: { x: 0, y: 160, width: 390, height: 440 } }); console.log(nm);
  }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
