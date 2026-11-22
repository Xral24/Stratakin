'use strict';
// What the towns off Earth bring in. Nobody grows maize up there.
// The Moon has Starfall: every fourth day the sky sheds dust that glows, and outside every town stand catch bowls the size of a house to take it.
// Halo has the storm: every fourth day it comes over the ring, and outside every town stand scrap masts that draw the lightning down into jars.
// You can ladle a bowl or pull a cell yourself once the town is free, and between falls the keeper pays to have them scrubbed out.
const Harvest = (() => {
  let G = null, tick = 0, live = [], sites = new Map(), keepers = new Map(), toldDay = -1, bolt = null, boltIn = 5, flecks = null;
  const KIT = {
    moon: { off: 2, item: 'stardust', pay: 12, per: 2, fall: 'Starfall', thing: 'Catch bowl', keeper: 'Catcher', names: ['Ilu', 'Vess', 'Onda', 'Tirr', 'Sael', 'Mioo', 'Quen', 'Lath'], push: 1.15, reach: 4.8 },
    halo: { off: 1, item: 'stormcell', pay: 14, per: 1, fall: 'The storm', thing: 'Storm mast', keeper: 'Stormhand', names: ['Rukk', 'Dessa', 'Varn', 'Tooma', 'Jex', 'Brakka', 'Sill', 'Korr'], push: 0.75, reach: 3.4 } };
  const K = () => KIT[G.worldId], on = () => !!(G && KIT[G.worldId]);
  const day = () => (G.dayCount || 0);
  const fallDay = () => on() && (day() % 4) === K().off;
  const lastFall = () => { const d = day(), o = K().off; return d - (((d - o) % 4) + 4) % 4; }; /* the latest fall, today counted. Negative before the first one */
  const nextIn = () => { const d = day(), o = K().off; return (((o - d) % 4) + 4) % 4 || 4; };
  const store = () => (G.stats.harvest = G.stats.harvest || {});
  const freed = (v) => !!(v && G.villageState && G.villageState[v.id] && G.villageState[v.id].freed);
  function init(game) { G = game; carriers = new Map(); tick = 0; live = []; sites = new Map(); keepers = new Map(); toldDay = -1; bolt = null; boltIn = 5; }
  /* what a bowl or a mast holds: three goes after a fall, good through the day after it */
  function stock(s) { const lf = lastFall(); if (lf < 0 || day() - lf > 1) return 0; const r = store()[s.key]; return 3 - (r && r.fall === lf ? r.took : 0); }
  function landIn(v) { const w = G.world, r = (v.R || 16) + 40; for (let x = v.x - r; x <= v.x + r; x += CH) for (let z = v.z - r; z <= v.z + r; z += CH) if (!w.chunks.get(Math.floor(x / CH) + ',' + Math.floor(z / CH))) return false; return true; }
  /* a ring of them outside the wall, each on ground that is level and has nothing built on it */
  function lay(v) { const w = G.world, HT = (x, z) => w.colInfo(x, z).h /* the land as the world makes it, so a town's bowls can be placed before you have walked all the way round it */, out = [], wr = Math.max(v.R || 16, (Village.wallRadiusOf && Village.wallRadiusOf(v)) || 0), want = (v.R || 16) > 30 ? 6 : (v.R || 16) > 20 ? 4 : 3, a0 = U.hash3(Math.round(v.x), 9, Math.round(v.z), w.seed + 77) * 6.283, moon = G.worldId === 'moon', rad = moon ? 4 : 2;
    for (let i = 0; i < 40 && out.length < want; i++) { const a = a0 + i * 0.83, dist = wr + 13 + (i % 4) * 6 + (i >= 20 ? 3 : 0), x = Math.round(v.x + Math.sin(a) * dist), z = Math.round(v.z + Math.cos(a) * dist), g = HT(x, z); let ok = g > 2 && Math.abs(g - (v.y || g)) < 9 && !(w.preset.brine && g < w.preset.brineLevel + 1);
      for (let dx = -rad; dx <= rad && ok; dx += 2) for (let dz = -rad; dz <= rad && ok; dz += 2) { const X = x + dx, Z = z + dz, gg = HT(X, Z); if (Math.abs(gg - g) > (i >= 14 ? 2 : 1) || (w.trackAt && w.trackAt(X, Z)) || (w.trailWear && w.trailWear(X, Z) > 0.3)) ok = false; }
      if (ok) for (const o of [typeof Arena !== 'undefined' && Arena.site && Arena.site(), typeof Garrison !== 'undefined' && Garrison.site && Garrison.site()]) if (o && Math.hypot(o.x - x, o.z - z) < 62) ok = false;
      if (ok && out.some(o => Math.hypot(o.x - x, o.z - z) < 12)) ok = false; if (!ok) continue;
      out.push({ x: x + 0.5, z: z + 0.5, y: g + 1, v, key: G.worldId + ':' + x + ',' + z, yaw: U.hash3(x, 2, z, 5) * 6.283, sc: 0.88 + U.hash3(x, 3, z, 5) * 0.3 }); }
    return out; }
  function keeperTalk(n, v) { const k = K(), moon = G.worldId === 'moon'; G.talkNpc = n;
    if (!freed(v)) return Dialogue.show(n.name, moon ? ['Every ladle goes up to the big dome for him. I am not to sell a drop, and I am not to let you near the bowls.', 'Clear him out of the square and we will talk.'] : ['Every cell off these masts goes to the big house. He counts them. I have the scars to show he counts them.', 'Get him out of the square and they are the town\'s again.']);
    const have = live.some(s => s.v === v && stock(s) > 0);
    if (have) return UI.openPanel('shop', { title: moon ? 'Starfall catch' : 'Storm catch', keeper: n.name, greet: moon ? 'Fresh off the sky. Shake it over your Kin and watch them wake up. Or ladle a bowl yourself, the town owes you that much.' : 'Still warm. Crack one over a ray gun and it shoots like new. Pull one off a mast yourself if you like, you earned it.', stock: moon ? [{ item: 'stardust', price: 26, n: 1 }, { item: 'stardust', price: 120, n: 5 }, { item: 'starsalt', price: 20, n: 2 }] : [{ item: 'stormcell', price: 60, n: 1 }, { item: 'stormcell', price: 160, n: 3 }] });
    const d = nextIn(); Dialogue.show(n.name, moon ? ['The bowls are dry. It falls every fourth day and the next is ' + (d === 1 ? 'tomorrow' : 'in ' + d + ' days') + '.', 'When it comes it comes down slow, like snow that has somewhere to be. We catch it because nothing grows here and it is the one thing that makes a tired Kin get up.', 'The day after a fall I am on the square with the sled, selling. Until then the bowls want scrubbing out. Crust in a bowl sours the whole catch. ' + k.pay + ' shards a bowl, tap one and get to it.'] : ['The jars are empty. The storm walks the ring every fourth day and it is back ' + (d === 1 ? 'tomorrow' : 'in ' + d + ' days') + '.', 'You will know. The sky goes the colour of a bruise and the masts start to sing.', 'The day after it I am on the square with the cart, selling. Until then the coils want the grit knocked off or they will not draw. ' + k.pay + ' shards a mast, tap one.']); }
  function keeperFor(v, s0) { let n = keepers.get(v.id); if (n) return n; const k = K(), nm = k.keeper + ' ' + k.names[Math.abs(U.strHash(v.id + 'hv')) % k.names.length];
    n = Village.makeNpc(710, 'villager', s0.x + k.push + 1.4, s0.z + 0.6, nm, null, s0.y, 'hv:' + v.id, undefined, false); n.wander = false; n.tag = G.worldId === 'moon' ? 'keeps the bowls' : 'keeps the masts'; n.onTalk = () => keeperTalk(n, v); Village.addLoose(n); keepers.set(v.id, n); return n; }
  /* ---- getting the catch to town ----
     On the Moon a sled that floats a hand above the dust goes the round of the bowls; on Halo a two-wheeled scrap cart behind a beast goes the round of the masts.
     The keeper walks with it. The day after a fall it is drawn up on the square, and that is where the catch is sold: the market day of a world with no fields */
  let carriers = new Map();
  const marketDay = () => { if (!on()) return false; const lf = lastFall(); return lf >= 0 && day() - lf === 1; };
  const loaded = () => { const lf = lastFall(); return lf >= 0 && day() - lf <= 1; };
  function carrierFor(v, L) { let c = carriers.get(v.id); if (c) return c; const s = L[0]; c = { v, x: s.x + 3.4, z: s.z + 1.4, y: s.y, yaw: 0, i: 0, wait: 5, mode: 'round', moving: false, beast: null };
    if (G.worldId === 'halo') { try { /* whatever pulls it is one of the three bulkiest four-legged animals on the ring, stood about as high as the wheels */
        const dexQ = KIN.dex('halo').filter(sp => sp.shape === 'quadruped' && !sp.legend && !sp.mythic && !(sp.feat && sp.feat.wings)), h0 = Math.abs(U.strHash(v.id + 'cart')); let pk = null; /* the bulkiest of six looked at, not the whole ring measured: a town coming into view must not cost a stall */
        for (let k = 0; k < Math.min(6, dexQ.length); k++) { const sp = dexQ[(h0 + k * 7) % dexQ.length], m = KIN.model(sp, 3), bulk = (m.radius || 0.5) * (m.radius || 0.5) * (m.height || 1); if (!pk || bulk > pk.bulk) pk = { sp, bulk, h: Math.max(m.height || 1, (m.radius || 0.5) * 1.3) }; }
        const e = Wild.makeEntity(pk.sp, 120, c.x, c.y, c.z, { plain: true }); e.scale = U.clamp(2.8 / pk.h, 0.5, 4); e.sleep = false; e.alert = 0; e.moving = false; c.beast = e; } catch (er) { c.beast = null; } }
    carriers.set(v.id, c); return c; }
  function carrierTick(dt, p) { const w = G.world; for (const [id, c] of carriers) { const L = sites.get(id), n = keepers.get(id); if (!L || !L.length || !n) { carriers.delete(id); continue; }
      const mk = marketDay() && freed(c.v) && typeof Cast !== 'undefined' && Cast.spot;
      if (mk) { if (c.mode !== 'market') { let sp = null; try { sp = Cast.spot(c.v, 3); } catch (e) { sp = null; } if (sp) { c.mode = 'market'; c.x = sp.x + 0.5; c.z = sp.z + 0.5; c.y = sp.y; c.yaw = Math.atan2(c.v.x - c.x, c.v.z - c.z) + 1.57; c.moving = false; } } }
      if (!mk || c.mode !== 'market') { if (c.mode !== 'round') { c.mode = 'round'; const s0 = L[c.i % L.length]; c.x = s0.x + 3.4; c.z = s0.z + 1.4; c.wait = 5; }
        const s = L[c.i % L.length], off = (G.worldId === 'moon' ? 3.5 : 2.6) * (s.sc || 1), tx = s.x + Math.cos(s.yaw) * off, tz = s.z - Math.sin(s.yaw) * off, dx = tx - c.x, dz = tz - c.z, d = Math.hypot(dx, dz);
        if (d > 0.35) { const st = Math.min(d, 2.3 * dt); c.x += dx / d * st; c.z += dz / d * st; c.yaw = Math.atan2(dx, dz); c.moving = true; } else { c.moving = false; c.wait -= dt; if (c.wait <= 0) { c.i = (c.i + 1) % L.length; c.wait = 14; } }
        let gy = c.y; try { gy = w.colInfo(Math.floor(c.x), Math.floor(c.z)).h + 1; } catch (e) { gy = c.y; } c.y += (gy - c.y) * Math.min(1, dt * 6); }
      /* the keeper keeps a hand on it */
      const side = 1.5, kx = c.x + Math.cos(c.yaw) * side, kz = c.z - Math.sin(c.yaw) * side; if (G.talkNpc !== n || !Dialogue.active()) { n.x = kx; n.z = kz; n.y = c.y; n.moving = c.moving; n.yaw = c.moving ? c.yaw : Math.hypot(n.x - p.x, n.z - p.z) < 8 ? Math.atan2(p.x - n.x, p.z - n.z) : c.yaw + 1.57; }
      if (c.beast) { const b = c.beast, f = 3.4; b.x = c.x + Math.sin(c.yaw) * f; b.z = c.z + Math.cos(c.yaw) * f; b.y = c.y; b.yaw = c.yaw; b.moving = c.moving; } } }
  function sledMesh(full) { return R.entityMesh('hv:sled:' + (full ? 1 : 0), (mb) => { const AL = [0.86, 0.88, 0.94], AL2 = [0.6, 0.65, 0.76], CY = [0.45, 0.95, 1.0], DUST = [1.0, 0.92, 0.62];
      /* a shallow pale bed turned up at the nose, a cold light underneath that holds it off the dust, a rail, and six jars standing in it */
      mb.blob(-0.85, 0, -1.7, 0.85, 0.34, 1.5, 0.75, AL, { n: 3 }); mb.tube([[0, 0.14, 1.3], [0, 0.3, 1.9], [0, 0.75, 2.25]], [0.7, 0.5, 0.12], AL, { segs: 8 }); mb.blob(-0.55, -0.16, -1.2, 0.55, 0.02, 1.0, 0.8, CY, { n: 2, emis: true });
      for (const e of [-1, 1]) { mb.tube([[e * 0.82, 0.3, -1.55], [e * 0.86, 0.72, -1.5], [e * 0.86, 0.72, 1.2], [e * 0.8, 0.3, 1.4]], [0.04, 0.04, 0.04, 0.04], AL2, { segs: 5 }); mb.tube([[e * 0.86, 0.3, -0.2], [e * 0.86, 0.72, -0.2]], [0.035, 0.035], AL2, { segs: 4 }); }
      for (let r = 0; r < 3; r++) for (const e of [-1, 1]) { const x = e * 0.36, z = -1.1 + r * 0.82; mb.blob(x - 0.27, 0.32, z - 0.27, x + 0.27, 1.02, z + 0.27, 0.8, full ? DUST : [0.5, 0.56, 0.68], { n: 3, emis: full }); mb.blob(x - 0.17, 1.0, z - 0.17, x + 0.17, 1.14, z + 0.17, 0.7, AL2, { n: 2 }); } }); }
  function cartMesh(full) { return R.entityMesh('hv:cart:' + (full ? 1 : 0), (mb) => { const RU = [0.52, 0.28, 0.16], RU2 = [0.34, 0.2, 0.13], ST = [0.3, 0.3, 0.33], BONE = [0.88, 0.82, 0.68], HOT = [0.8, 0.7, 1.0], GL = [0.3, 0.33, 0.38];
      /* a scrap bed on two big wheels, shafts out to the beast, a rack of jars with the lightning still in them, and a tusk lashed up front for luck */
      const wheel = (x) => { const pts = []; for (let k = 0; k <= 14; k++) { const a = k / 14 * 6.2832; pts.push([x, 0.85 + Math.sin(a) * 0.85, -0.2 + Math.cos(a) * 0.85]); } mb.tube(pts, pts.map(() => 0.1), ST, { segs: 5, cap0: 'none', cap1: 'none' }); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832; mb.tube([[x, 0.85, -0.2], [x, 0.85 + Math.sin(a) * 0.8, -0.2 + Math.cos(a) * 0.8]], [0.045, 0.045], RU2, { segs: 4 }); } mb.blob(x - 0.13, 0.7, -0.35, x + 0.13, 1.0, -0.05, 1, RU, { n: 2 }); };
      wheel(-1.0); wheel(1.0); mb.tube([[-1.0, 0.85, -0.2], [1.0, 0.85, -0.2]], [0.07, 0.07], ST, { segs: 5 });
      mb.blob(-0.8, 0.9, -1.35, 0.8, 1.16, 1.0, 0.45, RU, { n: 2 }); for (const e of [-1, 1]) { mb.blob(e * 0.8 - 0.06, 1.1, -1.3, e * 0.8 + 0.06, 1.62, 0.95, 0.4, e > 0 ? RU2 : [0.2, 0.42, 0.42], { n: 2 }); mb.tube([[e * 0.55, 1.0, 0.9], [e * 0.5, 0.95, 2.9]], [0.06, 0.05], RU2, { segs: 5 }); }
      mb.blob(-0.78, 1.1, -1.38, 0.78, 1.7, -1.26, 0.4, RU2, { n: 2 });
      for (let r = 0; r < 3; r++) for (const e of [-1, 1]) { const x = e * 0.36, z = -0.95 + r * 0.7; mb.blob(x - 0.25, 1.14, z - 0.25, x + 0.25, 1.82, z + 0.25, 0.75, full ? HOT : GL, { n: 3, emis: full }); mb.blob(x - 0.16, 1.8, z - 0.16, x + 0.16, 1.94, z + 0.16, 0.7, RU2, { n: 2 }); }
      mb.tube([[0, 1.15, 0.95], [0.1, 1.9, 1.25], [0, 2.5, 1.1]], [0.16, 0.11, 0.03], BONE, { segs: 6 }); }); }
  const carrierNear = (p) => { for (const c of carriers.values()) if (Math.hypot(c.x - p.x, c.z - p.z) < 3 && Math.abs(c.y - p.y) < 4) return c; return null; };
  function near(p) { let best = null, bd = 1e9; for (const s of live) { const d = Math.hypot(s.x - p.x, s.z - p.z); if (d < bd && Math.abs(s.y - p.y) < 7) { bd = d; best = s; } } return best && bd < K().reach * (best.sc || 1) ? best : null; }
  function label(p) { if (!on()) return null; const cr = carrierNear(p); if (cr) { const nm = G.worldId === 'moon' ? 'Catch sled' : 'Cell cart'; return cr.mode === 'market' ? nm + ' · tap to buy from the catch' : !freed(cr.v) ? nm + ' · bound for the big house' : nm + ' · on its round'; } const s = near(p); if (!s) return null; const k = K(); if (!freed(s.v)) return k.thing + ' · his men count the catch'; const n = stock(s); if (n > 0) return k.thing + ' · tap to ' + (G.worldId === 'moon' ? 'ladle' : 'pull a cell') + ' (' + n + ' left)'; const r = store()[s.key]; return r && r.scrub === day() ? k.thing + ' · clean' : fallDay() ? k.thing : k.thing + ' · tap to scrub it out'; }
  function tap(p) { if (!on()) return false; const cr = carrierNear(p); if (cr) { const n = keepers.get(cr.v.id); if (n) keeperTalk(n, cr.v); return true; } const s = near(p); if (!s) return false; const k = K(), moon = G.worldId === 'moon', st = store(), r = st[s.key] || (st[s.key] = { fall: -9, took: 0, scrub: -9 });
    if (!freed(s.v)) { UI.toast(moon ? 'The bowls belong to whoever sits in the square. Clear the town first.' : 'The masts belong to whoever sits in the square. Clear the town first.', 'bad'); return true; }
    const n = stock(s); if (n > 0) { const lf = lastFall(); if (r.fall !== lf) { r.fall = lf; r.took = 0; } r.took++; G.player.add(k.item, k.per); UI.sfx('place'); UI.renderHotbar(); UI.toast(moon ? 'You dip the long ladle and bring it down brimming. ' + k.per + ' Stardust.' : 'You twist a jar off the foot of the mast. It hums in your hand. A Storm Cell.', 'good'); return true; }
    if (fallDay()) { UI.toast(moon ? 'Taken to the bottom. It is still falling: there will be more tomorrow.' : 'Every jar is gone off this one.'); return true; }
    if (r.scrub === day()) { UI.toast(moon ? 'Scrubbed bright already. The next fall is ' + (nextIn() === 1 ? 'tomorrow' : 'in ' + nextIn() + ' days') + '.' : 'Knocked clean already. The storm is back ' + (nextIn() === 1 ? 'tomorrow' : 'in ' + nextIn() + ' days') + '.'); return true; }
    r.scrub = day(); G.shards += k.pay; G.stats.harvestJobs = (G.stats.harvestJobs || 0) + 1; UI.sfx('place'); UI.toast(moon ? 'You climb the rungs and scrub the crust out of the bowl. ' + k.pay + ' shards from the catcher.' : 'You climb the mast and knock the grit off the coil. ' + k.pay + ' shards from the stormhand.', 'good'); return true; }
  function update(dt, p) { if (!on()) { carriers = new Map(); live = []; if (keepers.size) { for (const n of keepers.values()) Village.dropLoose(n); keepers = new Map(); } return; }
    const k = K();
    for (const s of live) { const dx = p.x - s.x, dz = p.z - s.z, d = Math.hypot(dx, dz), r = k.push * (s.sc || 1); if (d < r && d > 0.01 && p.y < s.y + 5) { p.x = s.x + dx / d * r; p.z = s.z + dz / d * r; } } /* the stem is solid */
    if (fallDay()) { if (toldDay !== day()) { toldDay = day(); if (G.stats.harvestTold !== G.worldId + day()) { G.stats.harvestTold = G.worldId + day(); UI.toast(G.worldId === 'moon' ? 'Starfall. It comes down slow and bright, and every bowl outside every town is filling.' : 'The storm is over the ring. The masts are drawing it down.', 'good'); } }
      if (G.worldId === 'halo') { if (bolt && (bolt.t -= dt) <= 0) bolt = null; boltIn -= dt; if (boltIn <= 0) { boltIn = 3.5 + Math.random() * 6; const c = live.filter(s => Math.hypot(s.x - p.x, s.z - p.z) < 90); if (c.length) { const nr = c.slice().sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0], close = Math.hypot(nr.x - p.x, nr.z - p.z) < 7, s = close && Math.random() < 0.6 ? nr : c[Math.floor(Math.random() * c.length)], top = s.y + 13.3 * s.sc, /* lightning likes company: stand at the foot of a mast and it tends to pick yours */ pts = [[s.x, top, s.z]]; let x = s.x, z = s.z; for (let y = top + 6; y < top + 60; y += 6) { x += (Math.random() - 0.5) * 5; z += (Math.random() - 0.5) * 5; pts.push([x, y, z]); } bolt = { pts, t: 0.26 }; if (Math.hypot(s.x - p.x, s.z - p.z) < 60) UI.sfx('zap'); if (Math.hypot(s.x - p.x, s.z - p.z) < 7 && !Battle.active) { const sd = (G.stats.side = G.stats.side || {}); sd.storm = sd.storm || {}; G.shake = Math.max(G.shake || 0, 0.9); if (!sd.storm[s.key] && Object.keys(sd.storm).length < 3) { sd.storm[s.key] = 1; const n = Object.keys(sd.storm).length; UI.toast(n >= 3 ? 'The third bolt comes down the pole beside you. Your teeth are singing. Old Sela was right about this place.' : 'The bolt comes down the pole an arm\'s length from you and into the jars. Every hair you own is standing up. ' + n + ' of 3 masts.', 'good'); UI.sfx(n >= 3 ? 'quest' : 'gift'); } } } }
        if (bolt && bolt.t > 0.14 && typeof Weather !== 'undefined') Weather.state.flash = 1; } }
    else bolt = null;
    carrierTick(dt, p);
    tick -= dt; if (tick > 0) return; tick = 1.2; live = [];
    for (const v of (Village.townList ? Village.townList() : [])) { const d = Math.hypot(v.x - p.x, v.z - p.z), R = v.R || 16; if (d > R + 110) { const n = keepers.get(v.id); if (n) { Village.dropLoose(n); keepers.delete(v.id); } continue; }
      let L = sites.get(v.id); if (!L) { if (d > R + 80) continue; L = lay(v); sites.set(v.id, L); }
      for (const s of L) live.push(s); if (L.length) { keeperFor(v, L[0]); carrierFor(v, L); } } }
  /* ---- how they look ---- */
  const ring = (mb, y, r, t, col, o) => { const pts = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * 6.2832; pts.push([Math.cos(a) * r, y, Math.sin(a) * r]); } mb.tube(pts, pts.map(() => t), col, Object.assign({ segs: 6, cap0: 'none', cap1: 'none' }, o || {})); };
  function bowlMesh(full) { return R.entityMesh('hv:bowl3:' + (full ? 1 : 0), (mb) => { const AL = [0.84, 0.87, 0.93], AL2 = [0.66, 0.71, 0.82], TRIM = [0.45, 0.9, 1.0], DUST = [1.0, 0.92, 0.62];
      /* a goblet as big as a house: a foot, a thin stem, and a bowl that opens wider than the pods in town */
      mb.tube([[0, 0, 0], [0, 0.35, 0], [0, 0.7, 0], [0, 2.7, 0], [0, 3.3, 0], [0, 3.9, 0], [0, 4.6, 0], [0, 5.1, 0], [0, 5.3, 0]], [1.5, 1.35, 0.5, 0.36, 0.6, 1.9, 3.2, 3.85, 3.95], AL, { segs: 26, cap0: 'flat' });
      if (!full) mb.blob(-3.7, 4.72, -3.7, 3.7, 4.98, 3.7, 1, AL2, { n: 4 }); /* the dry floor of it, for anyone looking down in */
      ring(mb, 5.3, 3.95, 0.11, TRIM, { emis: 0.55 }); ring(mb, 2.9, 0.5, 0.07, TRIM, { emis: 0.4 }); ring(mb, 0.36, 1.36, 0.06, AL2);
      for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5, c = Math.cos(a), s = Math.sin(a); mb.tube([[c * 2.3, 0, s * 2.3], [c * 1.5, 1.6, s * 1.5], [c * 0.42, 3.0, s * 0.42]], [0.16, 0.11, 0.07], AL2, { segs: 6, cap0: 'flat' }); mb.blob(c * 2.3 - 0.3, 0, s * 2.3 - 0.3, c * 2.3 + 0.3, 0.16, s * 2.3 + 0.3, 1, AL2, { n: 2 }); }
      /* rungs up the stem, and the long ladle hung on its hook */
      for (let i = 0; i < 6; i++) mb.blob(0.3, 0.9 + i * 0.36, -0.2, 0.62, 0.96 + i * 0.36, 0.2, 0.6, AL2, { n: 2 });
      mb.tube([[-0.5, 3.0, 0.2], [-0.95, 1.2, 0.3], [-1.0, 0.5, 0.3]], [0.035, 0.035, 0.035], [0.5, 0.52, 0.6], { segs: 5 }); mb.blob(-1.16, 0.3, 0.14, -0.84, 0.54, 0.46, 1, AL, { n: 3 });
      /* the spout and the jar it drips into */
      mb.tube([[1.7, 3.9, 0], [2.5, 3.2, 0], [2.6, 1.3, 0]], [0.1, 0.08, 0.06], AL2, { segs: 6 }); mb.blob(2.25, 0, -0.35, 2.95, 0.95, 0.35, 0.8, full ? DUST : [0.5, 0.56, 0.68], { n: 3, emis: full ? 0.9 : 0 }); mb.blob(2.38, 0.9, -0.22, 2.82, 1.08, 0.22, 0.8, AL2, { n: 2 });
      if (full) { mb.blob(-3.6, 4.6, -3.6, 3.6, 6.7, 3.6, 1, DUST, { n: 5, emis: 1 }); for (let i = 0; i < 6; i++) { const a = i * 1.047 + 0.3, c = Math.cos(a), s = Math.sin(a), l = 0.7 + (i % 3) * 0.45; mb.tube([[c * 3.8, 5.4, s * 3.8], [c * 4.02, 5.25, s * 4.02], [c * (3.95 - l * 0.35), 5.3 - l, s * (3.95 - l * 0.35)]], [0.16, 0.14, 0.05], DUST, { segs: 6, emis: 1 }); } /* heaped over the brim and running down the outside */ for (let i = 0; i < 7; i++) { const a = i * 0.9, r = 1.2 + (i % 3) * 0.8; mb.blob(Math.cos(a) * r - 0.14, 6.6 + (i % 2) * 0.3, Math.sin(a) * r - 0.14, Math.cos(a) * r + 0.14, 6.88 + (i % 2) * 0.3, Math.sin(a) * r + 0.14, 1, [1, 1, 0.9], { n: 2, emis: 1 }); } }
    }); }
  function mastMesh(full) { return R.entityMesh('hv:mast2:' + (full ? 1 : 0), (mb) => { const RU = [0.52, 0.28, 0.16], RU2 = [0.36, 0.2, 0.13], CU = [0.82, 0.5, 0.24], BONE = [0.88, 0.82, 0.68], HOT = [0.8, 0.7, 1.0], GL = [0.3, 0.33, 0.38];
      /* a scrap pole that leans a little, guyed with three legs, with a copper coil at the top and the tusks of something big lashed halfway up */
      mb.tube([[0, 0, 0], [0.12, 4.5, 0.08], [-0.1, 9, 0.02], [0, 11.6, 0], [0, 13.2, 0]], [0.36, 0.27, 0.19, 0.12, 0.05], RU, { segs: 8, cap0: 'flat' });
      for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.3, c = Math.cos(a), s = Math.sin(a); mb.tube([[c * 2.6, 0, s * 2.6], [c * 1.2, 3.6, s * 1.2], [0.08, 6.4, 0.04]], [0.13, 0.1, 0.07], RU2, { segs: 6, cap0: 'flat' }); mb.blob(c * 2.6 - 0.32, 0, s * 2.6 - 0.32, c * 2.6 + 0.32, 0.2, s * 2.6 + 0.32, 0.9, RU2, { n: 2 }); }
      for (const [y, l, ya] of [[7.2, 1.5, 0.4], [9.3, 1.1, 1.9], [10.8, 0.8, 0.9]]) { const c = Math.cos(ya), s = Math.sin(ya); mb.tube([[-c * l, y, -s * l], [c * l, y + 0.1, s * l]], [0.06, 0.06], RU2, { segs: 5, cap0: 'flat', cap1: 'flat' }); for (const e of [-1, 1]) mb.blob(e * c * l - 0.2, y - 0.75, e * s * l - 0.2, e * c * l + 0.2, y - 0.05, e * s * l + 0.2, 0.35, e > 0 ? RU : CU, { n: 2 }); } /* vanes of beaten plate that swing */
      for (const e of [-1, 1]) mb.tube([[e * 0.2, 5.6, 0.1], [e * 0.9, 5.5, 0.5], [e * 1.5, 6.1, 0.7], [e * 1.75, 7.1, 0.6]], [0.17, 0.15, 0.1, 0.03], BONE, { segs: 7 });
      for (let i = 0; i < 4; i++) ring(mb, 11.5 + i * 0.36, 0.55 - i * 0.08, 0.07, full ? HOT : CU, { emis: full ? 0.9 : 0 });
      mb.blob(-0.24, 13.0, -0.24, 0.24, 13.5, 0.24, 1, full ? [1, 1, 1] : CU, { n: 3, emis: full ? 1 : 0 });
      /* the lead down the pole and the three jars at its foot */
      mb.tube([[0.2, 11.4, 0.2], [0.42, 6, 0.3], [0.5, 1.0, 0.5]], [0.04, 0.04, 0.04], [0.15, 0.13, 0.12], { segs: 5 });
      for (let i = 0; i < 3; i++) { const a = i * 2.094 + 1.35, x = Math.cos(a) * 1.25, z = Math.sin(a) * 1.25; mb.blob(x - 0.3, 0, z - 0.3, x + 0.3, 0.78, z + 0.3, 0.75, full ? HOT : GL, { n: 3, emis: full ? 0.95 : 0 }); mb.blob(x - 0.2, 0.74, z - 0.2, x + 0.2, 0.92, z + 0.2, 0.7, RU2, { n: 2 }); mb.tube([[x, 0.9, z], [x * 0.5, 1.3, z * 0.5], [0.3, 1.1, 0.3]], [0.03, 0.03, 0.03], [0.15, 0.13, 0.12], { segs: 4 }); }
    }); }
  function entities() { const out = []; if (!on() || !live.length) return out; const p = G.player, moon = G.worldId === 'moon';
    for (const s of live) { if (Math.hypot(s.x - p.x, s.z - p.z) > 110) continue; const full = stock(s) > 0; out.push({ x: s.x, y: s.y - 0.05, z: s.z, yaw: s.yaw, scale: s.sc, hover: 0, skyMul: 1, isStatue: true, mesh: moon ? bowlMesh(full) : mastMesh(full) }); }
    for (const c of carriers.values()) { if (Math.hypot(c.x - p.x, c.z - p.z) > 110) continue; const full = loaded(); if (moon) out.push({ x: c.x, y: c.y + 0.42 + Math.sin(performance.now() / 520) * 0.05, z: c.z, yaw: c.yaw, scale: 1.15, hover: 0, skyMul: 1, isStatue: true, mesh: sledMesh(full) }); else { out.push({ x: c.x, y: c.y, z: c.z, yaw: c.yaw, scale: 1.1, hover: 0, skyMul: 1, isStatue: true, mesh: cartMesh(full) }); if (c.beast) out.push(c.beast); } }
    return out; }
  /* what is in the air on the day: slow bright dust on the Moon, driven grit and the bolt itself on Halo */
  function lines(cam, time) { if (!fallDay()) return null; const moon = G.worldId === 'moon', res = [];
    if (!flecks) { flecks = []; for (let i = 0; i < 220; i++) flecks.push([Math.random() * 26 - 13, Math.random() * 18, Math.random() * 26 - 13, Math.random()]); }
    const out = new Float32Array(flecks.length * 6); let k = 0;
    for (const d of flecks) { if (moon) { const x = Math.floor(cam.x) + d[0] + Math.sin(time * 0.6 + d[3] * 9) * 0.4, z = Math.floor(cam.z) + d[2], y = cam.y + 8 - ((time * 1.7 + d[1]) % 18); out[k++] = x; out[k++] = y; out[k++] = z; out[k++] = x + 0.04; out[k++] = y - 0.34; out[k++] = z; }
      else { const x = Math.floor(cam.x) - 13 + ((d[0] + 13 + time * 21) % 26), z = Math.floor(cam.z) + d[2], y = cam.y - 4 + (d[1] * 0.6) + Math.sin(time * 2 + d[3] * 9) * 0.3; out[k++] = x; out[k++] = y; out[k++] = z; out[k++] = x + 1.1; out[k++] = y - 0.08; out[k++] = z + 0.2; } }
    res.push({ data: out, color: moon ? [1.0, 0.93, 0.6, 0.9] : [0.8, 0.56, 0.34, 0.5] });
    if (bolt) { const b = new Float32Array((bolt.pts.length - 1) * 12); let j = 0; for (let i = 0; i + 1 < bolt.pts.length; i++) for (const o of [0, 0.12]) { const a = bolt.pts[i], c = bolt.pts[i + 1]; b[j++] = a[0] + o; b[j++] = a[1]; b[j++] = a[2] + o; b[j++] = c[0] + o; b[j++] = c[1]; b[j++] = c[2] + o; } res.push({ data: b, color: [0.9, 0.85, 1.0, 1] }); }
    return res; }
  /* for the photograph: a bolt on the nearest mast that stays long enough to be seen */
  function strike(secs) { const p = G.player, c = live.slice().sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0]; if (!c) return false; const top = c.y + 13.3 * c.sc, pts = [[c.x, top, c.z]]; let x = c.x, z = c.z; for (let y = top + 6; y < top + 60; y += 6) { x += (Math.random() - 0.5) * 5; z += (Math.random() - 0.5) * 5; pts.push([x, y, z]); } bolt = { pts, t: secs || 0.26 }; boltIn = (secs || 0) + 4; return true; }
  return { init, _strike: strike, marketDay, get carriers() { return carriers; }, update, entities, lines, tap, label, fallDay, nextIn, stock, get live() { return live; }, get keepers() { return keepers; }, get bolt() { return bolt; }, KIT };
})();
