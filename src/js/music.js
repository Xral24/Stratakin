'use strict';
// Background music. Most moods are generated: oscillators and filtered noise, sequenced ahead of time. Five are recorded tracks (see REC below).
// One mood per situation (open land, night, rain, cold, water, under water, the Mines, fire, battle, sky, Moon, village),
// cross-faded when the situation changes. Toggle from the menu.
const Music = (() => {
  let ctx = null, master = null, enabled = true, want = null, cur = null, timer = null, seq = 0;
  const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11], mixo: [0, 2, 4, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11], whole: [0, 2, 4, 6, 8, 10], penta: [0, 2, 4, 7, 9], mpenta: [0, 3, 5, 7, 10],
  };
  // root: MIDI note of the key; prog: chord roots as scale degrees; rate: melody notes per beat; density: chance a melody slot sounds
  const MOODS = {
    land:    { bpm: 86, root: 60, scale: 'major', prog: [0, 5, 3, 4], pad: 'triangle', lead: 'triangle', rate: 2, density: 0.55, bass: 'half', cutoff: 1600, vol: 0.9, seventh: false },
    village: { bpm: 100, root: 62, scale: 'mixo', prog: [0, 3, 4, 0], pad: 'triangle', lead: 'square', rate: 2, density: 0.7, bass: 'beat', cutoff: 2000, vol: 0.8, seventh: false, pluck: true },
    night:   { bpm: 58, root: 57, scale: 'dorian', prog: [0, 3, 0, 6], pad: 'sine', lead: 'sine', rate: 1, density: 0.35, bass: 'bar', cutoff: 900, vol: 0.75, seventh: true, high: true },
    rain:    { bpm: 72, root: 55, scale: 'minor', prog: [0, 5, 2, 6], pad: 'triangle', lead: 'sine', rate: 3, density: 0.6, bass: 'half', cutoff: 1200, vol: 0.8, seventh: true, noise: 'rain' },
    cold:    { bpm: 60, root: 71, scale: 'minor', prog: [0, 5, 2, 6], pad: 'triangle', lead: 'sine', rate: 2, density: 0.45, bass: 'bar', cutoff: 3400, vol: 1.0, seventh: true, high: true, bell: true, noise: 'wind' },
    water:   { bpm: 88, root: 64, scale: 'mixo', prog: [0, 3, 1, 4], pad: 'triangle', lead: 'triangle', rate: 2, density: 0.6, bass: 'half', cutoff: 2200, vol: 1.0, seventh: true, vibrato: 5, high: true },
    deep:    { bpm: 52, root: 57, scale: 'phrygian', prog: [0, 1, 0, 5], pad: 'sine', lead: 'triangle', rate: 1, density: 0.4, bass: 'bar', cutoff: 1500, vol: 1.0, seventh: false, vibrato: 3, drone: true, bell: true, high: true },
    swim:    { bpm: 104, root: 62, scale: 'major', prog: [0, 4, 5, 3], pad: 'triangle', lead: 'square', rate: 2, density: 0.7, bass: 'beat', cutoff: 2400, vol: 1.0, seventh: false, vibrato: 4, pluck: true, drums: 'low' },
    ride:    { bpm: 124, root: 60, scale: 'mixo', prog: [0, 6, 3, 4], pad: 'sawtooth', lead: 'square', rate: 2, density: 0.75, bass: 'eighth', cutoff: 2000, vol: 1.0, seventh: false, drums: 'gallop', pluck: true },
    fly:     { bpm: 100, root: 69, scale: 'lydian', prog: [0, 1, 4, 3], pad: 'sine', lead: 'sine', rate: 3, density: 0.6, bass: 'half', cutoff: 3200, vol: 1.0, seventh: true, high: true, noise: 'wind', bell: true },
    volcano: { bpm: 80, root: 45, scale: 'phrygian', prog: [0, 1, 0, 6], pad: 'sawtooth', lead: 'sawtooth', rate: 1, density: 0.4, bass: 'beat', cutoff: 900, vol: 0.95, seventh: false, drums: 'low', noise: 'rumble' },
    mines:   { bpm: 64, root: 52, scale: 'minor', prog: [0, 6, 3, 0], pad: 'triangle', lead: 'triangle', rate: 1, density: 0.4, bass: 'bar', cutoff: 800, vol: 0.8, seventh: false, echo: true, pluck: true },
    fire:    { bpm: 96, root: 48, scale: 'phrygian', prog: [0, 1, 0, 3], pad: 'sawtooth', lead: 'sawtooth', rate: 2, density: 0.5, bass: 'eighth', cutoff: 1100, vol: 0.85, seventh: false, drums: 'low', noise: 'rumble' },
    free:    { bpm: 118, root: 62, scale: 'major', prog: [0, 3, 4, 0], pad: 'triangle', lead: 'square', rate: 2, density: 0.9, bass: 'beat', cutoff: 3200, vol: 1.0, seventh: false, pluck: true, bell: true, high: true, drums: 'full' }, /* a place is freed: bells, a marching bass, everything up */
    memory:  { bpm: 54, root: 57, scale: 'dorian', prog: [0, 5, 3, 0], pad: 'sine', lead: 'sine', rate: 1, density: 0.5, bass: 'bar', cutoff: 1100, vol: 0.85, seventh: true, bell: true, echo: true }, /* something that happened long ago */
    dread:   { bpm: 60, root: 45, scale: 'phrygian', prog: [0, 1, 0, 5], pad: 'sawtooth', lead: 'triangle', rate: 1, density: 0.35, bass: 'bar', cutoff: 800, vol: 0.9, seventh: false, drone: true, drums: 'low' }, /* he is speaking */
    battle:  { bpm: 152, root: 57, scale: 'harm', prog: [0, 5, 3, 4], pad: 'sawtooth', lead: 'square', rate: 4, density: 0.8, bass: 'eighth', cutoff: 2400, vol: 1.0, seventh: false, drums: 'full' },
    sky:     { bpm: 82, root: 67, scale: 'lydian', prog: [0, 1, 4, 0], pad: 'triangle', lead: 'sine', rate: 2, density: 0.5, bass: 'half', cutoff: 2800, vol: 0.8, seventh: true, high: true },
    moon:    { bpm: 52, root: 62, scale: 'whole', prog: [0, 2, 4, 1], pad: 'sine', lead: 'sine', rate: 1, density: 0.25, bass: 'bar', cutoff: 1800, vol: 0.8, seventh: false, high: true, vibrato: 2, bell: true },
    halo:    { bpm: 76, root: 59, scale: 'harm', prog: [0, 1, 5, 0], pad: 'sawtooth', lead: 'triangle', rate: 2, density: 0.45, bass: 'half', cutoff: 1400, vol: 0.85, seventh: true, vibrato: 3, noise: 'wind', pluck: true },
    jungle:  { bpm: 112, root: 55, scale: 'dorian', prog: [0, 3, 0, 4], pad: 'triangle', lead: 'square', rate: 3, density: 0.7, bass: 'beat', cutoff: 1800, vol: 0.9, seventh: false, drums: 'full', pluck: true },
    danger:  { bpm: 140, root: 50, scale: 'phrygian', prog: [0, 1, 0, 1], pad: 'sawtooth', lead: 'sawtooth', rate: 4, density: 0.6, bass: 'eighth', cutoff: 1300, vol: 0.9, seventh: false, drums: 'full', noise: 'rumble' },
    alien:   { bpm: 92, root: 66, scale: 'whole', prog: [0, 3, 1, 4], pad: 'square', lead: 'sine', rate: 2, density: 0.6, bass: 'beat', cutoff: 2600, vol: 0.85, seventh: false, high: true, vibrato: 6, pluck: true, bell: true },
  };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function ensure() {
    if (ctx) return true;
    try {
      ctx = UI.audio(); if (!ctx) return false;
      master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination);
      return true;
    } catch (e) { ctx = null; return false; }
  }
  function noiseBuffer() {
    if (ctx._noise) return ctx._noise;
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return (ctx._noise = buf);
  }
  // ---- one voice: an oscillator with an envelope, through the mood's filter ----
  let notes = 0;
  function voice(m, type, freq, t, attack, hold, release, vol, detune = 0) {
    notes++;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq; if (detune) o.detune.value = detune;
    if (m.vib) m.vib.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.setValueAtTime(vol, t + attack + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
    o.connect(g); g.connect(m.filter); o.start(t); o.stop(t + attack + hold + release + 0.05);
  }
  function drum(m, kind, t) {
    if (kind === 'kick') { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25); o.connect(g); g.connect(m.bus); o.start(t); o.stop(t + 0.3); return; }
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(); const f = ctx.createBiquadFilter(); const g = ctx.createGain();
    if (kind === 'snare') { f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8; g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16); }
    else { f.type = 'highpass'; f.frequency.value = 7000; g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05); }
    src.connect(f); f.connect(g); g.connect(m.bus); src.start(t); src.stop(t + 0.2);
  }
  // a steady bed of filtered noise: rain, wind, the rumble of the Core
  function noiseBed(m, kind) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(); src.loop = true;
    const f = ctx.createBiquadFilter(); const g = ctx.createGain();
    if (kind === 'rain') { f.type = 'highpass'; f.frequency.value = 3000; g.gain.value = 0.05; }
    else if (kind === 'wind') { f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 1.2; g.gain.value = 0.08; const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 0.08; lg.gain.value = 320; l.connect(lg); lg.connect(f.frequency); l.start(); m.extra.push(l); }
    else { f.type = 'lowpass'; f.frequency.value = 120; g.gain.value = 0.25; }
    src.connect(f); f.connect(g); g.connect(m.bus); src.start(); m.extra.push(src);
  }
  function makeMood(name) {
    const def = MOODS[name]; const m = { name, def, extra: [], step: 0, next: ctx.currentTime + 0.1, seed: seq++ * 7919 + 17 };
    m.bus = ctx.createGain(); m.bus.gain.value = 0.0001; m.bus.connect(master);
    m.filter = ctx.createBiquadFilter(); m.filter.type = 'lowpass'; m.filter.frequency.value = def.cutoff; m.filter.Q.value = 0.7;
    if (def.echo) { const d = ctx.createDelay(1.0); d.delayTime.value = 60 / def.bpm * 0.75; const fb = ctx.createGain(); fb.gain.value = 0.35; const wet = ctx.createGain(); wet.gain.value = 0.5; m.filter.connect(d); d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(m.bus); m.extra.push(d); }
    m.filter.connect(m.bus);
    if (def.vibrato) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = def.vibrato; lg.gain.value = 3.5; l.connect(lg); l.start(); m.vib = lg; m.extra.push(l); }
    if (def.noise) noiseBed(m, def.noise);
    if (def.drone) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = mtof(def.root - 24); g.gain.value = 0.18; o.connect(g); g.connect(m.bus); o.start(); m.extra.push(o); }
    m.rand = rng(m.seed);
    return m;
  }
  function chordNotes(def, bar) {
    const sc = SCALES[def.scale]; const deg = def.prog[bar % def.prog.length];
    const note = (d, oct = 0) => def.root + sc[((d % sc.length) + sc.length) % sc.length] + 12 * (Math.floor(d / sc.length) + oct);
    const tones = [note(deg), note(deg + 2), note(deg + 4)]; if (def.seventh) tones.push(note(deg + 6));
    return { tones, note, deg };
  }
  function scheduleStep(m, t) {
    const def = m.def; const stepDur = 60 / def.bpm / 4; const step = m.step; const bar = Math.floor(step / 16), beat = Math.floor(step / 4) % 4, sub = step % 4;
    const ch = chordNotes(def, bar);
    const r = m.rand;
    if (step % 16 === 0) { // the pad: a whole bar of chord, two slightly detuned layers
      const len = 16 * stepDur;
      for (const n of ch.tones) { const f = mtof(n + (def.high ? 0 : -12)); voice(m, def.pad, f, t, 0.6, len - 1.2, 1.4, 0.07, -6); voice(m, def.pad, f, t, 0.6, len - 1.2, 1.4, 0.07, 6); }
    }
    const bassOn = def.bass === 'bar' ? step % 16 === 0 : def.bass === 'half' ? step % 8 === 0 : def.bass === 'beat' ? sub === 0 : step % 2 === 0;
    if (bassOn) { const f = mtof(ch.tones[0] - 24 + (def.bass === 'eighth' && (step % 4 === 2) ? 12 : 0)); voice(m, def.bass === 'eighth' ? 'square' : 'triangle', f, t, 0.01, def.bass === 'eighth' ? 0.08 : 0.25, def.bass === 'bar' ? 1.2 : 0.3, 0.14); }
    const slot = 4 / def.rate; // steps between melody slots
    if (step % slot === 0 && r() < def.density) {
      const pool = ch.tones.concat(r() < 0.3 ? [ch.note(ch.deg + 1), ch.note(ch.deg + 3), ch.note(ch.deg + 5)] : []);
      const oct = def.high ? 12 : 0;
      const n = pool[Math.floor(r() * pool.length)] + oct + (r() < 0.25 ? 12 : 0);
      const f = mtof(n);
      if (def.bell) voice(m, 'sine', f, t, 0.01, 0.05, 1.6, 0.12);
      else if (def.pluck) voice(m, def.lead, f, t, 0.005, 0.03, 0.35, 0.1);
      else voice(m, def.lead, f, t, 0.02, stepDur * slot * 0.5, 0.25, 0.08);
    }
    if (def.drums) {
      if (def.drums === 'full') { if (sub === 0 && (beat === 0 || beat === 2)) drum(m, 'kick', t); if (sub === 0 && (beat === 1 || beat === 3)) drum(m, 'snare', t); if (step % 2 === 0) drum(m, 'hat', t); if (beat === 3 && sub === 2 && bar % 2 === 1) drum(m, 'kick', t); }
      else if (def.drums === 'gallop') { if (sub === 0 || sub === 3 || (sub === 2 && beat % 2 === 1)) drum(m, 'kick', t); if (sub === 1) drum(m, 'hat', t); }
      else { if (sub === 0 && beat === 0) drum(m, 'kick', t); if (step % 8 === 4) drum(m, 'hat', t); }
    }
    m.step++;
    return stepDur;
  }
  function tick() {
    if (!cur || !ctx) return;
    if (ctx.state === 'suspended') { ctx.resume().catch(() => {}); return; }
    if (cur.next < ctx.currentTime - 1) cur.next = ctx.currentTime + 0.05; // fell behind (tab asleep): pick up from now
    const horizon = ctx.currentTime + 0.35;
    while (cur.next < horizon) { const d = scheduleStep(cur, cur.next); cur.next += d; }
  }
  function fadeOut(m, secs) {
    const t = ctx.currentTime; m.bus.gain.cancelScheduledValues(t); m.bus.gain.setValueAtTime(Math.max(0.0001, m.bus.gain.value), t); m.bus.gain.exponentialRampToValueAtTime(0.0001, t + secs);
    setTimeout(() => { try { for (const x of m.extra) { if (x.stop) x.stop(); if (x.disconnect) x.disconnect(); } m.bus.disconnect(); } catch (e) { /* already gone */ } }, secs * 1000 + 200);
  }
  function play(name) {
    if (!enabled || !MOODS[name] || !ensure()) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    if (cur && cur.name === name) return;
    if (cur) fadeOut(cur, 1.6);
    cur = makeMood(name);
    const t = ctx.currentTime; cur.bus.gain.setValueAtTime(0.0001, t); cur.bus.gain.exponentialRampToValueAtTime(MOODS[name].vol, t + 1.8);
    if (!timer) timer = setInterval(tick, 90);
  }
  /* ---- recorded music (made on Higgsfield, assets/music_<key>.mp4: AAC in an mp4, because the page's host takes no .mp3) ----
     Five tracks so far: earth, moon, halo (walking about each world), battle, boss. update(mood, key) says which one the moment wants; where there is
     none (the Mines, the Core, the Lost World, a chase, a film) the generated mood plays as before. A track is fetched the first time it is wanted and
     the generated mood covers until it has arrived. Played through an <audio> element fed from a blob (it streams, so it costs almost no memory);
     if the page will not let an element play, the whole track is decoded and looped as a buffer instead, which is how the sound effects already play.
     Either way it goes through `master`, so the menu's ducking and the on/off switch work on it. */
  const REC = {}, RECVOL = 1.3; /* through master (0.22): a finished recording is far quieter than a pile of raw oscillators */ let rec = null, wantRec = null, forceDecode = false;
  function recLoad(key) { let r = REC[key]; if (r) return r; r = REC[key] = { key, state: 'loading', blob: null, el: null, node: null, gain: null, buf: null, src: null, at: 0, t0: 0, mode: null };
    const f = 'assets/music_' + key + '.mp4', url = (typeof window !== 'undefined' && window.STRATAKIN_ASSETS && window.STRATAKIN_ASSETS[f]) || f;
    fetch(url).then(x => { if (!x.ok) throw new Error(x.status); return x.arrayBuffer(); }).then(ab => { r.blob = new Blob([ab], { type: 'audio/mp4' }); r.state = 'ready'; if (wantRec === key && enabled) recPlay(key); }).catch(err => { r.state = 'failed'; console.warn('music ' + key + ': ' + (err && err.message)); });
    return r; }
  function ramp(g, to, secs) { const t = ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(to, t + secs); }
  function recStart(r) { /* r.gain exists and is at 0: bring it up, and let the generated mood go */
    ramp(r.gain, RECVOL, 1.6); if (cur) { fadeOut(cur, 1.6); cur = null; } if (timer) { clearInterval(timer); timer = null; } }
  function recDecoded(r) { const go = () => { if (rec !== r) return; try { r.src = ctx.createBufferSource(); r.src.buffer = r.buf; r.src.loop = true; r.src.connect(r.gain); r.at = r.at % r.buf.duration; r.t0 = ctx.currentTime - r.at; r.src.start(0, r.at); r.mode = 'buffer'; recStart(r); } catch (e) { r.state = 'failed'; } };
    if (r.buf) return go(); r.blob.arrayBuffer().then(ab => ctx.decodeAudioData(ab)).then(buf => { r.buf = buf; for (const k in REC) if (REC[k] !== r && REC[k] !== rec && REC[k].buf && !REC[k].src) REC[k].buf = null; /* keep one spare decoded at most */ go(); }).catch(() => { r.state = 'failed'; }); }
  function recPlay(key) { const r = recLoad(key); if (r.state !== 'ready' || !ensure()) return false; if (rec === r) return true;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    if (rec) recPause(rec, 1.2); rec = r;
    if (!r.gain) { r.gain = ctx.createGain(); r.gain.gain.value = 0; r.gain.connect(master); }
    if (forceDecode || r.mode === 'buffer' || typeof Audio === 'undefined') { recDecoded(r); return true; }
    try { if (!r.el) { r.el = new Audio(); r.el.loop = true; r.el.preload = 'auto'; r.el.src = URL.createObjectURL(r.blob); r.node = ctx.createMediaElementSource(r.el); r.node.connect(r.gain); }
      const pr = r.el.play(); r.mode = 'element';
      if (pr && pr.then) pr.then(() => { if (rec === r) recStart(r); else r.el.pause(); }).catch(() => { r.mode = 'buffer'; if (rec === r) recDecoded(r); }); else recStart(r);
    } catch (e) { r.mode = 'buffer'; recDecoded(r); }
    return true; }
  function recPause(r, secs) { if (!r || !r.gain) return; ramp(r.gain, 0, secs); const el = r.el, src = r.src; if (src) { r.at = ctx.currentTime - r.t0; r.src = null; }
    setTimeout(() => { try { if (src) { src.stop(); src.disconnect(); } if (el && r.mode === 'element' && rec !== r) el.pause(); /* unless it was asked for again meanwhile */ } catch (e) { /* already stopped */ } }, secs * 1000 + 80); if (rec === r) rec = null; }
  function stop() { if (cur) { fadeOut(cur, 0.8); cur = null; } if (timer) { clearInterval(timer); timer = null; } if (rec) recPause(rec, 0.8); }
  function update(name, key) { want = name; wantRec = key || null; if (!enabled) return;
    if (key) { const r = recLoad(key); if (r.state === 'ready') { recPlay(key); return; } if (r.state === 'loading' && rec) return; /* still fetching: the track that is playing carries on */ }
    if (rec) recPause(rec, 1.4);
    if (name && (!cur || cur.name !== name)) play(name); }
  function setEnabled(v) { enabled = !!v; try { localStorage.setItem('stratakin-music', enabled ? '1' : '0'); } catch (e) {} if (!enabled) stop(); else if (want || wantRec) update(want, wantRec); }
  function duck(on) { if (!master) return; const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(on ? 0.1 : 0.22, t + 0.5); }
  try { enabled = localStorage.getItem('stratakin-music') !== '0'; } catch (e) {}
  return { update, play, stop, setEnabled, duck, get enabled() { return enabled; }, get current() { return cur ? cur.name : null; }, get notes() { return notes; }, get state() { return ctx ? ctx.state : 'none'; }, get track() { return rec ? rec.key : null; }, get trackInfo() { return rec ? { key: rec.key, mode: rec.mode, vol: rec.gain ? rec.gain.gain.value : 0, t: rec.el ? rec.el.currentTime : rec.src ? ctx.currentTime - rec.t0 : 0 } : null; }, set forceDecode(v) { forceDecode = !!v; }, REC, MOODS };
})();
