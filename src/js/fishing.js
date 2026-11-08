'use strict';
// Fishing: hold a rod, face the water and tap to cast. A bite comes after a while; then a marker runs along a bar and you tap when
// it crosses the glowing zone. Better rods and bait pull rarer, bigger water Kin; the catch joins your party.
const Fishing = (() => {
  let G = null, el = null, state = null;
  const RODS = { rod: 1, rod_iron: 2, rod_void: 3 };
  const BAITS = ['bait_void', 'bait_glow', 'bait_berry'];
  function init(game) { G = game; el = document.getElementById('fishbar'); }
  function rodHeld() { const k = G.player.selected(); return k && RODS[k] ? { key: k, tier: RODS[k] } : null; }
  function cast() {
    const p = G.player; const rod = rodHeld(); if (!rod || state) return false;
    const hit = p.raycast(14, true);
    if (!hit || hit.id !== B.WATER) { UI.toast('Face the water and tap to cast.'); return true; }
    const bait = BAITS.find(b => p.has(b)) || null; if (bait) p.take(bait, 1);
    const w = G.world; const far = Math.hypot(hit.x - (G.lastVillage ? G.lastVillage.x : w.spawn.x), hit.z - (G.lastVillage ? G.lastVillage.z : w.spawn.z));
    const depth = Math.max(1, hit.y - (w.groundY(hit.x, hit.z, hit.y) || hit.y - 1));
    state = { t: 0, bite: 2 + Math.random() * 4.5, phase: 'wait', pos: 0, dir: 1, x: hit.x, y: hit.y, z: hit.z, rod, bait, far, depth };
    UI.sfx('miss'); UI.toast(`Cast${bait ? ' with ' + ITEMS[bait].name : ''}. Wait for the bite.`);
    UI.renderHotbar(); G.player.frozen = true;
    return true;
  }
  function pickSpecies(st) {
    const w = G.world; const rx = Math.floor(U.mod(st.x, WORLD_W) / 256), rz = Math.floor(U.mod(st.z, WORLD_W) / 256);
    const tier = Math.min(9, Math.floor((G.trainerLevel || 1) / 4) + st.rod.tier - 1 + (st.far > 200 ? 1 : 0));
    const list = KIN.roster(w.preset.id, rx, rz, 'Water', 'Ocean', tier);
    const weights = list.map(sp => {
      const r = sp.rarity || 0; let wgt = KIN.RARITY[r].w;
      if (r >= 1) wgt *= 1 + 0.5 * (st.rod.tier - 1) + (st.bait === 'bait_berry' ? 0.3 : 0);
      if (r >= 2) wgt *= 1 + 0.6 * (st.rod.tier - 1) + (st.bait === 'bait_glow' ? 1.2 : 0) + (st.depth > 4 ? 0.5 : 0);
      if (r >= 3) wgt *= 1 + (st.bait === 'bait_void' ? 2.5 : 0) + (st.far > 300 ? 0.8 : 0);
      if (r === 4 && !(st.rod.tier >= 3 || st.bait === 'bait_void') ) wgt = 0;
      if (r === 4 && st.far < 150) wgt = 0;
      return wgt;
    });
    let pick = Math.random() * weights.reduce((a, b) => a + b, 0), idx = 0;
    for (; idx < weights.length - 1; idx++) { pick -= weights[idx]; if (pick <= 0) break; }
    return list[idx];
  }
  function update(dt) {
    if (!state) return;
    state.t += dt;
    if (state.phase === 'wait') {
      if (state.t >= state.bite) {
        state.phase = 'bite'; state.t = 0; state.sp = pickSpecies(state);
        const r = state.sp.rarity || 0;
        state.zone = Math.max(0.06, 0.16 + 0.05 * (state.rod.tier - 1) - 0.035 * r); state.speed = 0.9 + 0.3 * r + 0.1 * (state.rod.tier - 1); state.pos = 0; state.dir = 1; state.center = 0.3 + Math.random() * 0.4;
        UI.sfx('alert'); UI.toast(r >= 3 ? 'Something big has the line!' : 'A bite!', 'good');
        el.classList.remove('hidden'); el.querySelector('.snare-zone').style.left = ((state.center - state.zone / 2) * 100) + '%'; el.querySelector('.snare-zone').style.width = (state.zone * 100) + '%';
      }
      return;
    }
    if (state.phase === 'bite') {
      state.pos += state.dir * state.speed * dt; if (state.pos > 1) { state.pos = 1; state.dir = -1; } if (state.pos < 0) { state.pos = 0; state.dir = 1; }
      el.querySelector('.snare-marker').style.left = (state.pos * 100) + '%';
      if (state.t > 6) { end('It slipped the hook while you waited.'); }
    }
  }
  function tap() {
    if (!state) return false;
    if (state.phase === 'wait') { end('You reel in. Nothing yet.'); return true; }
    const ok = Math.abs(state.pos - state.center) <= state.zone / 2;
    if (!ok) { end(`It got away.${state.bait ? ' The bait is gone.' : ''}`); return true; }
    const sp = state.sp; const r = sp.rarity || 0;
    const level = Math.max(1, (G.trainerLevel || 1) + (state.rod.tier - 1) * 2 + KIN.RARITY[r].lvl + Math.floor(Math.random() * 3) - 1);
    const kin = KIN.create(sp, Math.min(level, KIN.capOf(sp)));
    G.addKin(kin); G.stats.caught++; G.stats.fished = (G.stats.fished || 0) + 1;
    end(null); UI.sfx('caught');
    UI.openPanel('reveal', { kind: 'kin', kin, parents: [], n: 0, caught: `Pulled from the water at Lv ${kin.level}${r > 0 ? ' · ' + KIN.RARITY[r].name : ''}.` });
    return true;
  }
  function end(msg) { state = null; el.classList.add('hidden'); G.player.frozen = false; if (msg) UI.toast(msg); }
  return { init, cast, update, tap, end, rodHeld, get active() { return !!state; }, RODS };
})();
