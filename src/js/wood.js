'use strict';
// The dark wood. One old forest on Earth, a good walk from home: giants shoulder to shoulder, the light green and low under them.
// Its creatures live nowhere else. You do not find them, they happen to you: every couple of minutes one is somewhere near, and you
// hear about it before you see it. They are shy, they do not fight, and a rush sends them off. Each one caught is worth having for
// one thing it does, and you can manage without any of them, only with more trouble.
const Wood = (() => {
  let G = null, t = 0, next = 45, told = false, still = 0, gloom = 0;
  const KINDS = ['toad', 'hare', 'stork'];
  const HEAR = { toad: 'A small warm light is moving between the trunks.', hare: 'Snip. Snip. Somewhere close, something is cutting.', stork: 'Something tall and white just sat down in the ferns.' };
  const USE = { toad: 'Lampwart lights your way. With it along you need no torch in your hand.', hare: 'Snipscut cuts for you. Bushes and leaves give three fronds, not one.', stork: 'Stoolbill is a seat. Stand still a moment and your Kin rest and mend.' };
  function init(game) { G = game; t = 0; next = 45; told = false; still = 0; gloom = 0; }
  const site = () => (G.worldId === 'earth' && G.world.woodC ? G.world.woodC() : null);
  const depth = (p) => (G.worldId === 'earth' && G.world.woodK ? G.world.woodK(p.x, p.z) : 0);
  const has = (id) => !!(G.kin && G.kin.some(k => k.sp && k.sp.wood === id && k.hp > 0));
  const out = () => (typeof Wild !== 'undefined' ? Wild.list.filter(e => e.woodKin) : []);
  function spawn(p) { const w = G.world, mine = (G.kin || []).filter(k => k.sp && k.sp.wood).map(k => k.sp.wood), pool = KINDS.filter(k => !mine.includes(k)), id = (pool.length ? pool : KINDS)[Math.floor(Math.random() * (pool.length || KINDS.length))];
    for (let tries = 0; tries < 14; tries++) { const a = Math.random() * 6.283, d = 19 + Math.random() * 8, x = Math.floor(p.x + Math.sin(a) * d), z = Math.floor(p.z + Math.cos(a) * d); if (w.woodK(x, z) < 0.2) continue; let y = w.groundY(x, z, Math.floor(p.y) + 8); while (y > 2 && (isLeaf(w.getBlock(x, y, z)) || isTrunk(w.getBlock(x, y, z)) || w.getBlock(x, y, z) === B.AIR)) y--; if (w.getBlock(x, y, z) === B.WATER || Math.abs(y - p.y) > 7) continue;
      const lvl = Math.max(3, Math.min((G.trainerLevel || 1) + 1, 40)), e = Wild.makeEntity(KIN.woodSpecies(id), lvl, x + 0.5, y + 1, z + 0.5, { plain: true }); e.woodKin = id; e.temper = 'shy'; e.kin.temper = 'shy'; e.woodLife = 75; Wild.list.push(e); UI.sfx('gift'); UI.toast(HEAR[id]); return true; }
    return false; }
  function update(dt, p) { const k = depth(p); gloom += (k - gloom) * Math.min(1, dt * 0.8); if (typeof R !== 'undefined' && R.setGloom) R.setGloom(Math.min(1, gloom * 1.15));
    for (const e of out()) { e.woodLife -= dt; if (e.woodLife <= 0 || Math.hypot(e.x - p.x, e.z - p.z) > 70) Wild.remove(e); }
    if (k > 0.2 && !(typeof Battle !== 'undefined' && Battle.active)) { if (!told) { told = true; UI.toast('The trees close over. This is the dark wood, and things live here that live nowhere else.', 'good'); if (G.stats) G.stats.woodSeen = true; }
      t += dt; if (t >= next && !out().length) { if (spawn(p)) { t = 0; next = 95 + Math.random() * 60; } else t = next - 8; } }
    else if (k <= 0) told = false;
    /* the stool: stand still with a Stoolbill along and your Kin mend, a little every second */
    if (has('stork') && !(typeof Battle !== 'undefined' && Battle.active)) { const mv = Math.hypot(p.vx || 0, p.vz || 0) > 0.2; still = mv ? 0 : still + dt; if (still > 4) { still = 3; let any = false; for (const kn of G.kin) { const mx = KIN.stats(kn).hp; if (kn.hp > 0 && kn.hp < mx) { kn.hp = Math.min(mx, kn.hp + Math.max(1, Math.round(mx * 0.03))); any = true; } } if (any && !update.said) { update.said = true; UI.toast('You sit. Your Kin rest.', 'good'); } } } }
  /* the lantern: light at your shoulder whenever a Lampwart is with you */
  function light(eye) { return has('toad') ? [eye.x, eye.y - 0.2, eye.z, 13] : null; }
  /* the shears: how many fronds a leaf gives */
  const fronds = () => (has('hare') ? 3 : 1);
  function caught(kin) { const id = kin && kin.sp && kin.sp.wood; if (!id) return; UI.toast(USE[id], 'good'); if (G.stats) { G.stats.woodCaught = G.stats.woodCaught || {}; G.stats.woodCaught[id] = true; } }
  return { init, update, light, fronds, caught, site, depth, has, KINDS };
})();
