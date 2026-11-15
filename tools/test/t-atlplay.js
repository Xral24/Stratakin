// Atlantis, played through with the real physics: down the falls from the surface, out of the pool, into a hall, the forge, out up the falls, in and out at a gate, Skerry in the pool
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.world.time = 0.42; G.paused = true; G.thirdPerson = false;
    window.__step = (secs, inp, stop) => { const p = G.player, a = Village.atlantis(); const I = Object.assign({ mx: 0, mz: 0, jump: false, sneak: false, jumpPressed: false, lookDX: 0, lookDY: 0 }, inp || {}); let t = 0, minB = 9, maxY = -9, minY = 999; const n = Math.round(secs / 0.05); for (let i = 0; i < n; i++) { p.update(0.05, I); t += 0.05; minB = Math.min(minB, p.breath); maxY = Math.max(maxY, p.y); minY = Math.min(minY, p.y); if (stop && stop(p, a)) break; }
      return { t: +t.toFixed(2), r: +Math.hypot(p.x - a.x - 0.5, p.z - a.z - 0.5).toFixed(1), y: +p.y.toFixed(2), dy: +(p.y - a.y).toFixed(2), water: p.inWater, under: p.underwater, ground: p.onGround, breath: +p.breath.toFixed(2), minBreath: +minB.toFixed(2), hp: p.hp, maxY: +maxY.toFixed(1), minY: +minY.toFixed(1) }; };
    window.__at = (dx, dz, dy, yaw) => { const p = G.player, a = Village.atlantis(), w = G.world; p.x = a.x + 0.5 + dx; p.z = a.z + 0.5 + dz; p.y = a.y + dy; p.vx = p.vy = p.vz = 0; p.fallStart = null; p.yaw = yaw || 0; p.pitch = 0; p.frozen = false; p.mount = null; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 4, 99999); for (let k = 0; k < 3; k++) Village.update(0.05, p, false); }; });
  const S = (secs, inp, stop) => ev(([secs, inp, stop]) => window.__step(secs, inp, stop ? eval(stop) : null), [secs, inp || null, stop || null]);
  const log = (k, v) => console.log(k, JSON.stringify(v));
  // A. down the falls from the surface, with no bulb
  await ev(() => { const a = Village.atlantis(); window.__at(0, 0, SEA - a.y - 0.4, 0); G.player.breath = 1; G.meshPass(9999); });
  log('A0 at the surface', await S(0.5, {}));
  log('A1 dive', await S(20, { sneak: true }, '(p, a) => p.y <= a.y - 1.5'));
  log('A2 out of the column and up for air', await S(6, { mz: 1, jump: true }, '(p, a) => !p.underwater && Math.hypot(p.x - a.x - 0.5, p.z - a.z - 0.5) > 3.5'));
  log('B climb out of the pool', await S(8, { mz: 1, jump: true }, '(p, a) => p.onGround && Math.hypot(p.x - a.x - 0.5, p.z - a.z - 0.5) > 10.8'));
  // C. into the Tideforge and the shop
  const hall = await ev(() => { const a = Village.atlantis(), L = G.world.atlantis, hh = L.halls[0], dx = -Math.cos(hh.a), dz = -Math.sin(hh.a); window.__at(hh.x + dx * 7.5, hh.z + dz * 7.5, 0.05, Math.atan2(dx, dz)); return { kind: hh.kind, x: hh.x, z: hh.z }; });
  log('C1 walk in', await S(5, { mz: 1 }));
  log('C2 at the counter', await ev((hh) => { const p = G.player, a = Village.atlantis(); const d = Math.hypot(p.x - a.x - 0.5 - hh.x, p.z - a.z - 0.5 - hh.z); for (let k = 0; k < 4; k++) Village.update(0.05, p, false); const n = Village.pick(p); if (n) Village.talk(n); const pn = document.getElementById('panel'); return { toHallCentre: +d.toFixed(1), picked: n ? n.name : null, panel: pn && !pn.classList.contains('hidden') ? (document.getElementById('panel-title') || {}).textContent : null }; }, hall));
  log('C3 buying', await ev(() => { const p = G.player, a = G.stats.atl || (G.stats.atl = { best: 0, rides: 0 }); a.told = true; a.tamed = true; G.shards = 20000; p.add('abysstooth', 1); p.add('selenite', 8); p.add('ringshard', 3); const d = Village.shopDef('armoury', Village.active); const out = {}; for (const e of d.stock) { if (e.service === 'mend') continue; out[e.item || e.name] = Village.buy(d, e); } UI.closePanel(); return { out, has: ['sp_storm', 'sp_trident', 'tidelung'].map(k => k + ':' + p.count(k)), left: { tooth: p.count('abysstooth'), selenite: p.count('selenite'), ring: p.count('ringshard'), shards: G.shards }, stockAfter: Village.shopDef('armoury', Village.active).stock.map(e => e.item || e.service) }; }));
  await ev(() => { const p = G.player; const i = (typeof p.hotbar === 'function' ? p.hotbar() : []).indexOf('sp_trident'); if (i >= 0) p.sel = i; G.paused = false; }); await page.waitForTimeout(9000); await page.screenshot({ path: '/home/claude/play-0.png' }); await ev(() => { G.paused = true; });
  // D. out: into the pool, under the falls, and up
  await ev(() => window.__at(0, 13, 0.05, 0));
  log('D1 into the pool to the middle', await S(9, { mz: 1 }, '(p, a) => Math.hypot(p.x - a.x - 0.5, p.z - a.z - 0.5) < 1.2'));
  log('D2 up the falls', await S(16, { jump: true }, '(p, a) => p.y >= SEA - 0.9'));
  log('D3 at the top', await S(2, { jump: true }));
  // E. a gate: in from the sea, and out again
  await ev(() => { const a = Village.atlantis(); window.__at(a.RH + 5, 0, 1.2, Math.PI / 2); });
  log('E0 outside the east gate', await S(0.2, {}));
  log('E1 in', await S(8, { mz: 1 }, '(p, a) => p.onGround && !p.inWater && Math.hypot(p.x - a.x - 0.5, p.z - a.z - 0.5) < a.RH - 3'));
  await ev(() => { G.player.yaw = -Math.PI / 2; });
  log('E2 out', await S(8, { mz: 1 }, '(p, a) => p.inWater && Math.hypot(p.x - a.x - 0.5, p.z - a.z - 0.5) > a.RH + 2'));
  // F. Skerry: given by the ring, ridden in the pool and down under it with the lung
  log('F riding Skerry', await ev(() => { const p = G.player, a = Village.atlantis(); const before = G.kin.length; const sp = (() => { let s = null; const v = Village.active; return s; })(); window.__at(0, 6.5, -1.0, 0); p.update(0.05, { mx: 0, mz: 0 }); const d = Village.shopDef; return { inWater: p.inWater, kin: G.kin.map(k => KIN.name(k)) }; }));
  // G. the townsfolk after a minute of wandering
  log('G folk', await ev(() => { const a = Village.atlantis(), p = G.player; window.__at(0, 14, 0.05, 0); for (let i = 0; i < 1200; i++) Village.update(0.05, p, false); const v = Village.active; const rs = v.npcs.filter(n => n.role === 'villager').map(n => +Math.hypot(n.x - a.x - 0.5, n.z - a.z - 0.5).toFixed(1)); const ys = v.npcs.map(n => +(n.y - a.y).toFixed(2)); return { villagersR: rs, yMin: Math.min(...ys), yMax: Math.max(...ys), roost: (G.stats.roosts || []).map(r => r.name + (r.tide ? ' (tide)' : '')), respawn: G.respawnPoint ? [+(G.respawnPoint.x - a.x).toFixed(1), +(G.respawnPoint.z - a.z).toFixed(1)] : null }; }));
  // H. the Current, the map, the quests
  log('H current', await ev(() => { const v = Village.active; const n = v.npcs.find(x => x.shop === 'station'); Village.talk(n); const pn = document.getElementById('panel'); const open = pn && !pn.classList.contains('hidden'); const t = (document.getElementById('panel-title') || {}).textContent; UI.closePanel(); return { open, title: t }; }));
  log('I quests', await ev(() => { G.questState.arcs.main = Math.max(G.questState.arcs.main || 0, Quests.arcList('main').findIndex(q => q.id === 'diver') + 1); G.stats.atl.best = 25; const ev = []; for (let i = 0; i < 6; i++) for (const e of Quests.update()) ev.push(e.q ? e.q.id : e.type); return { events: ev, deep: G.questState.arcs.deep, target: (() => { try { const t = Quests.target(); return t ? [Math.round(t.x), Math.round(t.z), t.note] : null; } catch (e) { return 'ERR ' + e.message; } })() }; }));
  log('J map and save', await ev(() => { let m = 'ok'; try { UI.openPanel('map'); UI.closePanel(); } catch (e) { m = 'ERR ' + e.message; } let sv = 'ok'; try { const k = G.kin[G.kin.length - 1]; const s = JSON.parse(JSON.stringify(KIN.serialize(k))); const k2 = KIN.deserialize(s); sv = KIN.name(k2) + ' ' + (KIN.formOf(k2.sp, k2.stage) || {}).plan + ' tidal:' + !!k2.sp.tidal; } catch (e) { sv = 'ERR ' + e.message; } return { map: m, kinRoundTrip: sv }; }));
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 5).join('\n') : 'none'); await h.close(); })();
