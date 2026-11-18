'use strict';
// Life on the roads. A pedlar walks the worn tracks between the towns with a pack on his back: you meet him coming the other way,
// he stops if you stop, and he sells what is hard to come by out here. He also carries news, because that is what pedlars are for.
const Roads = (() => {
  let G = null, ped = null, t = 0, next = 70;
  const NAMES = ['Tam Oddment', 'Old Hask', 'Brindle Fenn', 'Coll the Tinker'];
  function init(game) { G = game; if (ped) Village.dropLoose && Village.dropLoose(ped); ped = null; t = 0; next = 70; }
  const wear = (x, z) => (G.world.trailWear ? G.world.trailWear(Math.floor(x), Math.floor(z)) : 0);
  function gy(x, z, y) { const w = G.world; let g = w.groundY(Math.floor(x), Math.floor(z), Math.floor(y) + 6); while (g > 2 && (isLeaf(w.getBlock(Math.floor(x), g, Math.floor(z))) || isTrunk(w.getBlock(Math.floor(x), g, Math.floor(z))))) g--; return g + 1; }
  function news() { const out = []; try { const p = G.player, held = Village.townList().filter(v => !v.starter && !(G.villageState[v.id] && G.villageState[v.id].freed)).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0]; if (held) out.push(`${held.name} is still shut up tight. Whoever holds it is level ${Village.bossLevel(held)}, the carters say.`); } catch (e) { /* no news from there */ }
    if (typeof Fields !== 'undefined') out.push(Fields.marketDay() ? 'Market day today. The farmers are in the squares with their carts.' : `Market is in ${(3 - ((G.dayCount || 0) % 4) + 4) % 4 || 4} days. Buy your seed then, it is half my price.`);
    if (typeof Wood !== 'undefined' && Wood.site() && !(G.stats && (G.stats.woodKnown || G.stats.woodSeen))) out.push('There is an old wood out past the hills where I do not sleep. Something in there carries a lamp. I have seen it twice and I was sober both times.');
    return out; }
  function talk() { const n = ped; G.talkNpc = n; n.stop = 8; const lines = [n.met ? 'You again. The road is long but it is not wide.' : `${n.name}. I walk the tracks between the towns, so the towns do not have to.`].concat(news().slice(0, 2)); n.met = true;
    Dialogue.show(n.name, lines, () => UI.openPanel('shop', { title: 'Pedlar\'s pack', keeper: n.name, greet: 'Dearer than a shop. The shop is a day\'s walk that way.', stock: [{ item: 'snare', price: 26 }, { item: 'tonic_heal', price: 18 }, { item: 'torch', price: 12, n: 4 }, { item: 'bread', price: 14 }, { item: 'sunseed', price: 18, n: 3 }] })); }
  function spawn(p) { let best = null; for (const r of [30, 34, 26]) for (let k = 0; k < 96; k++) { const a = k * 0.06545, x = p.x + Math.sin(a) * r, z = p.z + Math.cos(a) * r, wv = wear(x, z); if (wv > 0.45 && !(G.world.trackAt && G.world.trackAt(Math.floor(x), Math.floor(z))) && (!best || wv > best.w)) best = { x, z, w: wv }; } if (!best) return false;
    if (Village.active && Math.hypot(Village.active.x - best.x, Village.active.z - best.z) < (Village.active.R || 16) + 10) return false; const y = gy(best.x, best.z, p.y); if (Math.abs(y - p.y) > 10 || G.world.getBlock(Math.floor(best.x), y - 1, Math.floor(best.z)) === B.WATER) return false;
    const n = Village.makeNpc(950, 'explorer', best.x, best.z, NAMES[Math.floor(Math.random() * NAMES.length)], null, y, 'pedlar', 'land', false); n.wander = false; n.tag = 'pedlar'; n.onTalk = talk; n.hd = Math.atan2(p.x - best.x, p.z - best.z); n.life = 150; Village.addLoose(n); ped = n; return true; }
  function update(dt, p) { if (G.worldId !== 'earth') { if (ped) { Village.dropLoose && Village.dropLoose(ped); ped = null; } return; }
    if (!ped) { t += dt; if (t >= next && !(typeof Battle !== 'undefined' && Battle.active) && wear(p.x, p.z) > 0.2) { if (spawn(p)) { t = 0; next = 200 + Math.random() * 120; } else t = next - 10; } return; }
    const n = ped, d = Math.hypot(n.x - p.x, n.z - p.z); n.life -= dt; if (d > 85 || n.life <= 0 && d > 30) { Village.dropLoose && Village.dropLoose(n); ped = null; return; }
    if (n.stop > 0) n.stop -= dt; if (Dialogue.active() || UI.panelOpen || n.stop > 0 || d < 2.4) { n.moving = false; if (d < 6) n.yaw = Math.atan2(p.x - n.x, p.z - n.z); return; }
    /* he keeps to the worn ground: of the ways roughly ahead, the most trodden */
    let bh = n.hd, bw = -1; for (const o of [0, 0.35, -0.35, 0.7, -0.7, 1.1, -1.1]) { const h = n.hd + o, wv = wear(n.x + Math.sin(h) * 3, n.z + Math.cos(h) * 3) - Math.abs(o) * 0.08; if (wv > bw) { bw = wv; bh = h; } }
    if (bw < 0.05) { n.hd += Math.PI; n.stop = 2; return; } /* the track gave out: he turns back */
    n.hd = bh; const sp = 1.7 * dt, nx = n.x + Math.sin(bh) * sp, nz = n.z + Math.cos(bh) * sp, y = gy(nx, nz, n.y); if (Math.abs(y - n.y) > 1.6) { n.hd += Math.PI; n.stop = 1; return; }
    n.x = nx; n.z = nz; n.y += (y - n.y) * Math.min(1, dt * 10); n.yaw = bh; n.moving = true; }
  /* the hold-up. Now and then, a mile short of the station, men in black neckerchiefs flag the train down. In their own neckerchief you are waved through. Otherwise it is their Kin against yours: win and they run, leaving a purse and maybe a neckerchief; lose and they go through your pockets. Either way the train gets in */
  let hold = null;
  function holdup(r, fade, arrive) { const st = G.stats; st.rides = (st.rides || 0) + 1; if (st.rides < 3 || (st.lastHoldRide || 0) > st.rides - 3 || Math.random() > (holdup.force ? 2 : 0.22)) return false; st.lastHoldRide = st.rides;
    if (typeof Fields !== 'undefined' && Fields.masked() === 'ban') { setTimeout(() => UI.toast('Riders in black neckerchiefs flagged the train down, saw yours, and waved it on.', 'good'), 1800); return false; }
    const tv = Village.townList().find(v => v.id === r.id); let rl = null; try { rl = tv && tv.R ? Village.layout(tv).rail : null; } catch (e) { rl = null; } if (!rl || !G.kin.some(k => k.hp > 0)) return false; r = tv;
    const p = G.player, w = G.world, wr = Village.wallRadiusOf(r), al = (rl.ax ? r.x : r.z) + rl.sgn * (wr + 24), x = rl.ax ? al : rl.line + 3, z = rl.ax ? rl.line + 3 : al; w.ensureAround(Math.floor(x / CH), Math.floor(z / CH), 3, 9999); const y = gy(x, z, r.y || 60);
    p.x = x + 0.5; p.z = z + 0.5; p.y = y + 0.05; p.vx = p.vy = p.vz = 0; p.fallStart = null; p.frozen = true; G.meshPass(999);
    const best = Math.max(...G.kin.map(k => k.level || 1)), dex = KIN.dex('earth'), sp = dex[Math.floor(Math.random() * dex.length)], bx = x + (rl.ax ? 0 : 5), bz = z + (rl.ax ? 5 : 0), by = gy(bx, bz, y);
    const e = Wild.makeEntity(sp, Math.max(3, best - 1), bx + 0.5, by, bz + 0.5, { plain: true }); e.bandit = true; e.fought = true; Wild.list.push(e);
    const man = Village.makeNpc(961, 'explorer', bx + 1.6, bz + 1.2, 'Black Neckerchief', null, gy(bx + 1.6, bz + 1.2, y), 'bandit', 'land', false); man.wander = false; man.tag = 'bandit'; man.yaw = Math.atan2(p.x - man.x, p.z - man.z); Village.addLoose(man);
    hold = { e, man, fade, arrive }; G.paused = false; Controls.setEnabled(true); fade.style.opacity = 0; UI.sfx('hurt');
    setTimeout(() => Dialogue.show('Black Neckerchief', [`The train jolts and stops, a mile short of ${r.name}. Riders either side of the line.`, 'Everybody off. Purses out. You, with the Kin: you look like you have something worth carrying.', 'Or you can make this difficult. I do like it when they make it difficult.'], () => { if (hold) Battle.start(e, false); }), 500);
    return true; }
  function holdupEnd(result) { if (!hold) return; const H = hold; hold = null; const p = G.player, won = result === 'won' || result === 'caught';
    if (won) { G.shards += 45; let extra = ''; if (!p.has('bandana')) { p.add('bandana', 1); extra = ' One of them dropped his neckerchief.'; UI.renderHotbar && UI.renderHotbar(); } UI.sfx('quest'); UI.toast(`They scatter. A purse is left on the sleepers: 45 Shards.${extra}`, 'good'); }
    else { const take = Math.min(60, Math.floor(G.shards * 0.3)); G.shards -= take; UI.toast(take ? `They go through your pockets and ride off with ${take} Shards.` : 'They go through your pockets, find nothing, and ride off laughing.', 'bad'); }
    try { Wild.remove(H.e); } catch (e) { /* already gone */ } Village.dropLoose(H.man); setTimeout(() => { UI.toast('The guard blows his whistle. Everybody back on.'); H.arrive(); }, 2200); }
  return { init, update, holdup, holdupEnd, get hold() { return hold; }, get pedlar() { return ped; } };
})();
