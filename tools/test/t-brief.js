const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame('Stratakin'); await h.calm();
  const list = await ev(() => { const S = Campaign.sites(), out = []; const p = G.player;
    if (S.fort) out.push({ key: 'thornhold', name: 'Thornhold (the standard to match)', x: S.fort.x, z: S.fort.z });
    const ks = Keeps.sites().filter(k => !k.core).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z)); if (ks[0]) out.push({ key: 'hold', name: ks[0].name + ' (one of the eleven Holds)', x: ks[0].x, z: ks[0].z });
    const ss = Sky.sites(); const sp = ss.find(s => s.id === 'stormspire'); if (sp) out.push({ key: 'stormspire', name: 'Stormspire (sky fortress)', x: sp.x, z: sp.z, y: sp.y });
    try { const c = Citadel.site(); out.push({ key: 'citadel', name: 'The Black Citadel', x: c.x, z: c.z, cit: true }); } catch (e) {}
    const towns = Village.townList(); const sea = towns.find(v => v.type === 'sea'); if (sea) out.push({ key: 'seavillage', name: 'Sea village ' + (sea.name || sea.id), x: sea.x, z: sea.z });
    const city = towns.find(v => v.size === 'city'); if (city) out.push({ key: 'city', name: 'City ' + (city.name || city.id) + ' (four quarters)', x: city.x, z: city.z });
    if (S.mine) out.push({ key: 'mines', name: 'The Mining Camp and shaft', x: S.mine.x, z: S.mine.z });
    return out; });
  for (const s of list) {
    await ev((s) => { const p = G.player, w = G.world; if (s.cit) { try { Citadel.begin(); } catch (e) {} }
      p.x = s.x + 0.5; p.z = s.z + 0.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 9999); p.y = (s.y ? s.y + 6 : w.groundY(Math.floor(p.x), Math.floor(p.z)) + 1);
      for (let i = 0; i < 4; i++) { try { Campaign.update(0.6, p, false); } catch (e) {} try { Keeps.update(0.6, p); } catch (e) {} try { Village.update(0.6, p); } catch (e) {} try { Sky.update(0.6, p); } catch (e) {} try { Citadel.update(0.6, p); } catch (e) {} }
      G.meshPass && G.meshPass(9999);
      // stand back from it and look in, from a little height
      const back = 30; p.x = s.x + 0.5 + back; p.z = s.z + 0.5 + back * 0.6; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 9999);
      p.y = s.y ? s.y + 14 : Math.max(w.groundY(Math.floor(p.x), Math.floor(p.z)) + 1, w.groundY(s.x, s.z) + 1) + 12; p.vy = 0; p.flying = true;
      p.yaw = Math.atan2(p.x - s.x, p.z - s.z); p.pitch = -0.35; G.thirdPerson = false; G.paused = true; }, s);
    await page.waitForTimeout(6000); await page.screenshot({ path: `${process.env.OUT || "/tmp/"}brief/${s.key}.png` });
  }
  console.log(JSON.stringify(list)); console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
