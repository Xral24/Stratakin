const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('ride-1'); await h.calm();
  const info = await ev(() => { const p = G.player;
    for (const e of Wild.list.slice()) Wild.remove(e); G.buddyOff = true;
    const sp = KIN.species(U.combine(0x40CE, 7), ['Gale'], 0, { primary: 'Gale', shape: 'quadruped', total: 420, rarity: 2 }); sp.fast = true; const k = KIN.create(sp, 15); k.tamed = true; G.addKin(k); G.activeIdx = G.kin.indexOf(k); G.mountKin(k); p.yaw = 0;
    G.thirdPerson = true; p.yaw = 0.9; const rr = R.render; R.render = (w, pp, ents, cam, o) => { const a = Math.PI / 2, c = Math.cos(a), s = Math.sin(a); for (const e of ents) if (e.isMount || e._an) { const dx = e.x - pp.x, dz = e.z - pp.z; e.x = pp.x + c * dx + s * dz; e.z = pp.z - s * dx + c * dz; e.yaw += a; } return rr(w, pp, ents, cam, o); }; return 1; });
  await page.waitForTimeout(5000); await page.screenshot({ path: (process.env.OUT || '/tmp/') + 'seat.png' });
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
