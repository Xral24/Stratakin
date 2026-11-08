'use strict';
// Weather: clear, rain, fog, wind, storm. Changes every few minutes; tints the sky, shortens the view, and shifts which Kin appear.
const Weather = (() => {
  const KINDS = ['clear', 'rain', 'fog', 'wind', 'storm'];
  const state = { kind: 'clear', next: 240, intensity: 0, target: 0, flash: 0 };
  let rng = null, drops = null;
  // element multipliers per weather, applied to spawn weights (never zero: the common Kin still show up, just less)
  const ELEM_MUL = {
    clear: { Flame: 1.3, Light: 1.3, Frost: 0.8 },
    rain: { Tide: 1.9, Bloom: 0.85, Flame: 0.55, Frost: 1.1 },
    fog: { Void: 1.9, Gale: 1.3, Light: 0.7, Spark: 0.8 },
    wind: { Gale: 2.0, Stone: 0.8 },
    storm: { Spark: 2.2, Gale: 1.5, Bloom: 0.7, Flame: 0.6, Light: 0.6 },
  };
  const NIGHT_MUL = { Void: 1.6, Frost: 1.3, Light: 0.6, Bloom: 0.8 };
  function init(seed) { rng = U.rng(seed ^ 0x7e47); state.kind = 'clear'; state.next = 180 + rng() * 120; state.intensity = 0; state.target = 0; }
  function pickNext() {
    const r = rng();
    const k = r < 0.42 ? 'clear' : r < 0.62 ? 'rain' : r < 0.76 ? 'fog' : r < 0.9 ? 'wind' : 'storm';
    state.kind = k; state.target = k === 'clear' ? 0 : 1;
    state.next = k === 'clear' ? 200 + rng() * 240 : 120 + rng() * 180;
  }
  function update(dt) {
    windT += dt;
    if (G.world && !G.world.preset.weather) { state.kind = 'clear'; state.target = 0; state.intensity = 0; state.flash = 0; return; }
    state.next -= dt;
    if (state.next <= 0) pickNext();
    state.intensity += (state.target - state.intensity) * Math.min(1, dt * 0.15);
    if (state.kind === 'storm' && state.intensity > 0.5) { state.flash = Math.max(0, state.flash - dt * 3); if (Math.random() < dt * 0.08) state.flash = 1; } else state.flash = 0;
  }
  function elemMul(elem, isNight) {
    let m = 1;
    const w = ELEM_MUL[state.kind]; if (w && w[elem] && state.intensity > 0.3) m *= 1 + (w[elem] - 1) * state.intensity;
    if (isNight && NIGHT_MUL[elem]) m *= NIGHT_MUL[elem];
    return m;
  }
  // wind: a slow-turning direction and a strength that rises with wind and storm weather, with gusts, and more of it up high
  let windT = 0;
  function wind(x, y, z) {
    const t = windT;
    const ang = Math.sin(t * 0.0021) * 2.2 + Math.sin(t * 0.00053 + 1.7) * 1.6 + (G.world ? G.world.seed % 7 : 0);
    const k = state.intensity > 0.2 ? state.kind : 'clear';
    let str = 0.7 + 0.5 * Math.sin(t * 0.0031 + 0.4);
    if (k === 'wind') str += 2.6 * state.intensity; else if (k === 'storm') str += 3.4 * state.intensity; else if (k === 'rain') str += 0.8 * state.intensity;
    str *= 1 + 0.25 * Math.sin(performance.now() / 1000 * 0.9) * Math.sin(performance.now() / 1000 * 0.37);
    if (y > 64) str *= 1 + Math.min(0.6, (y - 64) / 40);
    if (G.world && !G.world.preset.weather) str *= 0.3;
    str = Math.max(0, str);
    return { x: Math.cos(ang) * str, z: Math.sin(ang) * str, str, ang };
  }
  function label() { return state.intensity > 0.4 ? state.kind : 'clear'; }
  // rain streaks as line segments around the camera, only where the sky is open
  function rainLines(world, cam, time) {
    if (!(state.kind === 'rain' || state.kind === 'storm') || state.intensity < 0.1) return null;
    if (!drops) { drops = []; for (let i = 0; i < 160; i++) drops.push([Math.random() * 18 - 9, Math.random() * 16, Math.random() * 18 - 9]); }
    const n = Math.floor(drops.length * state.intensity);
    const out = new Float32Array(n * 6); let k = 0;
    for (let i = 0; i < n; i++) {
      const d = drops[i];
      const x = Math.floor(cam.x) + d[0], z = Math.floor(cam.z) + d[2];
      const y = cam.y + 7 - ((time * 16 + d[1] * 7) % 16);
      if (world.topAt(Math.floor(x), Math.floor(z)) > y) continue;
      out[k++] = x; out[k++] = y; out[k++] = z; out[k++] = x; out[k++] = y - 0.55; out[k++] = z;
    }
    return { data: out.subarray(0, k), color: [0.75, 0.85, 1.0, 0.45] };
  }
  function serialize() { return { kind: state.kind, next: state.next, intensity: state.intensity, target: state.target }; }
  function load(d) { if (!d) return; Object.assign(state, d); }
  return { init, update, elemMul, label, rainLines, serialize, load, state, KINDS, wind };
})();
