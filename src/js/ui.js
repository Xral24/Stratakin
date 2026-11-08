'use strict';
// HUD, panels (Kin, Fusion, Craft, Quests, Menu), start screen, toasts and tiny synth sounds.
const UI = (() => {
  let G = null; const el = {};
  let panelOpen = null, fusionState = null, soundOn = true, audioCtx = null, securePicking = false;
  const q = (id) => document.getElementById(id);
  function init(game) {
    G = game;
    ['hud', 'hearts', 'breath', 'breath-fill', 'trainer-lvl', 'trainer-xp', 'where', 'weather', 'quest-hint', 'mine-bar', 'mine-fill', 'hotbar', 'item-name', 'touch-ui', 'toasts', 'panel', 'panel-title', 'panel-body', 'panel-close', 'start', 'start-buttons', 'starter-pick', 'starters', 'how', 'loading', 'kin-count', 'quest-dot', 'btn-jump', 'btn-sneak', 'vignette', 'hurt', 'crosshair'].forEach(id => el[id] = q(id));
    document.querySelectorAll('.hbtn').forEach(b => b.addEventListener('click', () => openPanel(b.dataset.panel)));
    q('btn-bag').addEventListener('click', () => openPanel('bag'));
    el['panel-close'].addEventListener('click', closePanel);
    el.panel.addEventListener('click', (e) => { if (e.target === el.panel) closePanel(); });
    el.hotbar.addEventListener('click', (e) => { const s = e.target.closest('.slot'); if (s) { G.player.sel = +s.dataset.i; renderHotbar(); } });
    // touch buttons
    const jb = el['btn-jump'], sb = el['btn-sneak'];
    const press = (ev, v) => { ev.preventDefault(); Controls.input.touchJump = v; if (v) Controls.input.jumpPressed = true; };
    jb.addEventListener('touchstart', (e) => press(e, true), { passive: false }); jb.addEventListener('touchend', (e) => press(e, false), { passive: false }); jb.addEventListener('touchcancel', (e) => press(e, false), { passive: false });
    jb.addEventListener('mousedown', (e) => press(e, true)); jb.addEventListener('mouseup', (e) => press(e, false));
    // ▼: hold it to go down (ship, wings, flying mounts, ladders, water); a quick tap on foot locks a sneak, tap again to stand up
    const down = { held: false, locked: false, t0: 0, unlocking: false };
    const syncDown = () => { Controls.input.touchSneak = down.held || down.locked; sb.classList.toggle('on', down.locked); };
    const downStart = (e) => { e.preventDefault(); if (down.locked) { down.locked = false; down.unlocking = true; } else { down.held = true; down.t0 = performance.now(); down.unlocking = false; } syncDown(); };
    const downEnd = (e) => { e.preventDefault(); const p = G.player; const onFoot = p && !p.flying && !p.mount && !p.gliding;
      if (down.held && !down.unlocking && onFoot && performance.now() - down.t0 < 280) down.locked = true;
      down.held = false; syncDown(); };
    sb.addEventListener('touchstart', downStart, { passive: false }); sb.addEventListener('touchend', downEnd, { passive: false }); sb.addEventListener('touchcancel', downEnd, { passive: false });
    sb.addEventListener('mousedown', downStart); sb.addEventListener('mouseup', downEnd);
    const bs = q('btn-snare'), br = q('btn-ride');
    const tap = (el, fn) => { el.addEventListener('touchstart', (e) => { e.preventDefault(); fn(); }, { passive: false }); el.addEventListener('click', fn); };
    tap(bs, () => G.stealthSnare()); tap(br, () => G.toggleRide()); tap(q('btn-ship'), () => G.boardShip());

  }
  // ---------- sounds ----------
  function audio() { try { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {}); return audioCtx; } catch (e) { return null; } }
  function sfx(name) {
    if (!soundOn) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      const t = audioCtx.currentTime;
      const tone = (f0, f1, dur, type = 'square', vol = 0.08, delay = 0) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = type; o.frequency.setValueAtTime(f0, t + delay); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + delay + dur);
        g.gain.setValueAtTime(vol, t + delay); g.gain.exponentialRampToValueAtTime(0.001, t + delay + dur);
        o.connect(g); g.connect(audioCtx.destination); o.start(t + delay); o.stop(t + delay + dur + 0.02);
      };
      switch (name) {
        case 'mine': tone(180, 120, 0.06, 'square', 0.05); break;
        case 'break': tone(300, 80, 0.15, 'sawtooth', 0.08); break;
        case 'place': tone(220, 330, 0.08, 'triangle', 0.08); break;
        case 'hit': tone(240, 90, 0.18, 'sawtooth', 0.1); break;
        case 'hit2': tone(320, 70, 0.25, 'sawtooth', 0.12); tone(600, 200, 0.12, 'square', 0.05, 0.05); break;
        case 'miss': tone(500, 700, 0.12, 'sine', 0.05); break;
        case 'util': tone(440, 660, 0.2, 'triangle', 0.07); break;
        case 'win': tone(440, 440, 0.1, 'square', 0.07); tone(554, 554, 0.1, 'square', 0.07, 0.1); tone(659, 659, 0.25, 'square', 0.08, 0.2); break;
        case 'down': tone(300, 60, 0.4, 'sawtooth', 0.09); break;
        case 'snare': tone(900, 1200, 0.1, 'sine', 0.06); break;
        case 'caught': tone(523, 523, 0.1, 'square', 0.07); tone(659, 659, 0.1, 'square', 0.07, 0.12); tone(784, 784, 0.1, 'square', 0.07, 0.24); tone(1046, 1046, 0.3, 'square', 0.08, 0.36); break;
        case 'level': tone(660, 990, 0.25, 'triangle', 0.08); break;
        case 'quest': tone(520, 780, 0.15, 'triangle', 0.08); tone(780, 1040, 0.25, 'triangle', 0.08, 0.15); break;
        case 'hurt': tone(200, 100, 0.2, 'square', 0.1); break;
        case 'alert': tone(700, 900, 0.08, 'square', 0.05); break;
        case 'fuse': tone(200, 1200, 0.6, 'sawtooth', 0.08); tone(1200, 600, 0.4, 'triangle', 0.08, 0.5); break;
        case 'rumble': tone(70, 38, 0.9, 'sawtooth', 0.12); tone(55, 30, 1.1, 'square', 0.06, 0.2); break;
        case 'whistle': tone(2200, 500, 1.6, 'sine', 0.07); tone(1800, 420, 1.4, 'triangle', 0.03, 0.1); break;
      }
    } catch (e) { /* audio refused */ }
  }
  // ---------- HUD ----------
  function toast(msg, cls) {
    const d = document.createElement('div'); d.className = 'toast' + (cls ? ' ' + cls : ''); d.textContent = msg;
    el.toasts.appendChild(d);
    setTimeout(() => d.classList.add('show'), 10);
    setTimeout(() => { d.classList.remove('show'); setTimeout(() => d.remove(), 400); }, 3800);
    while (el.toasts.children.length > 4) el.toasts.firstChild.remove();
  }
  let lastHotbar = '';
  function renderHotbar() {
    const p = G.player; const hb = p.hotbar(); const sel = p.selected();
    const cw = (k) => (typeof Combat !== 'undefined' && Combat.lifeOf && Combat.lifeOf(k)) ? Combat.cond(k) : null;
    const sig = hb.map(k => k + ':' + p.countKey(k) + ':' + (cw(k) == null ? '' : Math.round(cw(k) * 20))).join('|') + '#' + p.sel;
    if (sig === lastHotbar) return; lastHotbar = sig;
    el.hotbar.innerHTML = hb.map((k, i) => { const inf = p.itemInfo(k); return `<div class="slot ${k === sel ? 'sel' : ''} ${inf.obj ? 'obj' : ''}" data-i="${i}" title="${inf.name}"><div class="ico" style="background:${inf.col}"></div><span>${inf.obj ? '' : p.count(k)}</span>${(() => { const c = cw(k); if (c == null || c >= 0.999) return ''; return `<b class="wearbar"><i style="width:${Math.round(c * 100)}%;background:${c <= 0 ? '#555' : c < 0.25 ? '#e04040' : c < 0.6 ? '#e0b040' : '#60d060'}"></i></b>`; })()}</div>`; }).join('');
    const si = sel ? p.itemInfo(sel) : null;
    el['item-name'].textContent = si ? si.name + (si.block ? ' · tap to place' : si.snare ? ' · use in battle' : '') : '';
    const bi = document.getElementById('bag-ico'), bl = document.getElementById('bag-label');
    if (si) { bi.style.background = si.col; bl.textContent = `${si.name}${si.obj ? '' : ' ×' + p.count(sel)}`; } else { bi.style.background = '#666'; bl.textContent = 'Bag (empty)'; }
    if (sel) { const s = el.hotbar.querySelector('.slot.sel'); if (s) s.scrollIntoView({ inline: 'center', block: 'nearest' }); }
  }
  function renderHud(dt) {
    const p = G.player;
    el.hearts.innerHTML = Array.from({ length: p.maxHp }, (_, i) => `<i class="${i < p.hp ? 'on' : ''}"></i>`).join('');
    if (p.underwater) { el.breath.classList.remove('hidden'); el['breath-fill'].style.width = (p.breath * 100) + '%'; el.breath.classList.toggle('low', p.breath < 0.3); } else el.breath.classList.add('hidden');
    { const ap = Combat.armourPts ? Combat.armourPts() : 0; el['trainer-lvl'].textContent = 'Lv ' + G.trainerLevel + '  ◆ ' + G.shards + (ap ? '  ⛨ ' + ap : ''); }
    el['trainer-xp'].style.width = (100 * G.trainerProgress()) + '%';
    const layer0 = G.world.layerAt(Math.floor(p.y), Math.floor(p.x), Math.floor(p.z));
    const layer = (p.inWater || p.underwater) && (layer0 === 'Surface' || layer0 === 'Water') ? 'Water' : layer0;
    const biome = BIOME_NAME[G.world.biomeAt(Math.floor(p.x), Math.floor(p.z))];
    const va = Village.active; const inV = va && Math.hypot(va.x - p.x, va.z - p.z) < 22;
    const inDome = inV && va.type === 'deep' && Math.hypot(va.x - p.x, va.z - p.z) < 11 && p.y < SEA;
    const zl = Wild.zoneLevel ? Wild.zoneLevel(p.x, p.y, p.z, { layer }, G.trainerLevel) : null;
    el.where.textContent = `${inV ? va.name + ' · ' : ''}${inDome ? 'Dome' : layer} · ${layer === 'Surface' || layer === 'Water' ? biome + ' · ' : ''}y ${Math.floor(p.y)}${zl != null ? ' · wild Lv ~' + zl : ''}`;
    const bt = G.buffText ? G.buffText() : ''; const wl = Weather.label(); el.weather.textContent = (bt ? bt + ' · ' : '') + ((p.chill || 0) > 0.05 ? (p.coldKind === 'space' ? 'FREEZING · no air · ' : 'FREEZING · ') : '') + (layer === 'Surface' || layer === 'Sky' || layer === 'Water' ? (wl === 'clear' ? ((R.state.day || 0) < 0.3 ? 'night' : 'clear') : wl + ((R.state.day || 0) < 0.3 ? ' · night' : '')) : '');
    const pinTxt = (() => { if (!G.pin) return ''; const dx = U.mod(G.pin.x - p.x + WORLD_W / 2, WORLD_W) - WORLD_W / 2, dz = U.mod(G.pin.z - p.z + WORLD_W / 2, WORLD_W) - WORLD_W / 2; const d = Math.round(Math.hypot(dx, dz)); if (d < 6) { G.pin = null; toast('You are at your pin.'); return ''; } const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']; const ang = Math.atan2(dx, -dz); return ` · ◎ pin ${d}m ${dirs[Math.round(((ang / (Math.PI * 2)) + 1) * 8) % 8]}`; })();
    const now = performance.now(); const fx = (G.repelUntil > now ? ` · hush ${Math.ceil((G.repelUntil - now) / 1000)}s` : G.lure && G.lure.until > now ? ` · ${G.lure.elem} lure ${Math.ceil((G.lure.until - now) / 1000)}s` : '') + Npcs.hudText();
    { const ft = Combat.focusText(); el['quest-hint'].textContent = ft ? '⚔ ' + ft : Quests.hintText() + pinTxt + fx; }
    if (p.mineTarget) { el['mine-bar'].classList.remove('hidden'); el['mine-fill'].style.width = (p.mineProgress * 100) + '%'; } else el['mine-bar'].classList.add('hidden');
    el['kin-count'].textContent = `${G.kin.length + G.eggs.length}/${G.MAX_KIN}`;
    el.hurt.style.opacity = p.hurtFlash > 0 ? Math.min(0.6, p.hurtFlash * 1.5) : 0;
    el.vignette.style.opacity = R.state.underwater ? 0.45 : (layer === 'Mines' ? 0.3 : 0.08) + 0.35 * (p.chill || 0);
    el.vignette.style.background = (p.chill || 0) > 0.05 ? `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(${p.coldKind === 'space' ? '120,140,255' : '150,210,255'},${0.5 + 0.5 * p.chill}) 100%)` : '';
    renderHotbar();
    renderCompass(p);
    renderGlide(p);
  }
  function renderGlide(p) {
    const box = document.getElementById('glide-hud'); if (!box) return;
    const on = p.gliding && !p.wingsOn && !(p.mount && (p.mount.level >= 20 || p.mount.tamed));
    box.classList.toggle('hidden', !on); if (!on) return;
    const w = Weather.wind(p.x, p.y, p.z); const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
    const f = w.x * -sy + w.z * -cy, r = w.x * cy + w.z * -sy;
    document.getElementById('glide-arrow').setAttribute('transform', `rotate(${(Math.atan2(r, f) * 180 / Math.PI).toFixed(1)})`);
    const rel = w.str < 0.5 ? 'calm' : f > Math.abs(r) ? 'behind you' : -f > Math.abs(r) ? 'in your face' : 'across';
    document.getElementById('glide-wind').textContent = w.str < 0.5 ? 'calm' : (w.str > 2.6 ? 'strong · ' : w.str > 1.4 ? '' : 'light · ') + rel;
    const gy = G.world.groundY(Math.floor(p.x), Math.floor(p.z), Math.floor(p.y)); const agl = Math.max(0, p.y - gy - 1);
    const sp = p.glideS || 0;
    document.getElementById('glide-stats').textContent = `speed ${sp.toFixed(0)} · ${p.vy >= 0 ? '↑' : '↓'} ${Math.round(agl)}m`;
    box.classList.toggle('flare', agl < 4.5 && sp > 8.5 && p.vy < -1.5);
  }
  // ---------- panels ----------
  function openPanel(name, data) {
    if (name === 'craft' && !G.nearTable()) { toast('Crafting happens at a Fusion Table. There is one at the ruin by your camp, one in every village, and you can set down your own.', 'bad'); return; }
    if (Battle.active) return;
    panelOpen = name; el.panel.classList.remove('hidden'); G.setPaused(true);
    el['panel-body'].scrollTop = 0;
    if (name === 'kin') renderKin();
    else if (name === 'kindex') renderKindex(data);
    else if (name === 'craft') renderCraft();
    else if (name === 'quest') renderQuests();
    else if (name === 'menu') renderMenu();
    else if (name === 'fusion') renderFusion(data);
    else if (name === 'relics') renderRelics(data);
    else if (name === 'runeforge') renderForge(data);
    else if (name === 'train') renderTrain(data);
    else if (name === 'look') renderLook(data);
    else if (name === 'detail') renderDetail(data);
    else if (name === 'shop') renderShop(data);
    else if (name === 'bag') renderBag();
    else if (name === 'village') renderVillage(data);
    else if (name === 'reveal') renderReveal(data);
    else if (name === 'portal') renderPortal(data);
    else if (name === 'map') renderMap();
    else if (name === 'chest') renderChest(data);
    else if (name === 'destination') renderDestination();
    else if (name === 'incubator') renderIncubator();
    else if (name === 'skins') renderSkins();
  }
  // ---------- skins: how you look from outside ----------
  function renderSkins() {
    setTitle('Skins');
    const cur = Avatar.skin();
    el['panel-body'].innerHTML = `<p class="note">How you look in third person (V, or Camera in the menu), when you talk to someone and in a fight. Skins unlock as you go.</p><div class="skins">` + Avatar.SKINS.map(s => { const ok = Avatar.unlocked(s); return `<button class="starter skin ${s.id === cur.id ? 'sel' : ''} ${ok ? '' : 'locked'}" data-skin="${s.id}" ${ok ? '' : 'disabled'}><canvas width="96" height="96" data-skin-cv="${s.id}"></canvas><b>${s.name}</b><small>${ok ? (s.id === cur.id ? 'wearing' : 'tap to wear') : s.how}</small></button>`; }).join('') + `</div><div class="row"><button class="btn ghost" id="sk-close">Close</button></div>`;
    el['panel-body'].querySelectorAll('[data-skin-cv]').forEach(cv => Avatar.portrait(cv, Avatar.SKINS.find(s => s.id === cv.dataset.skinCv), 96));
    el['panel-body'].querySelectorAll('[data-skin]').forEach(b => b.addEventListener('click', () => { G.skin = b.dataset.skin; sfx('place'); renderSkins(); }));
    q('sk-close').addEventListener('click', closePanel);
  }
  // ---------- the incubator: three eggs hatch on play time ----------
  function renderIncubator() {
    setTitle('Incubator');
    const slots = Lab.slots(); const fmt = (sec) => { const m = Math.ceil(sec / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };
    const eggName = (e) => (e.label ? e.label.charAt(0).toUpperCase() + e.label.slice(1) : 'Egg') + (e.from ? ' from ' + e.from : '');
    el['panel-body'].innerHTML = `<p class="note">Eggs only. Three at a time; they hatch on play time while you are anywhere, no walking needed. A common egg takes about 40 minutes, a rare one a couple of hours, the rarest five. Steps you already walked with an egg still count.</p>
      <h4>Warming · ${slots.length}/3</h4>${slots.length ? slots.map((s, i) => `<div class="shop-row"><div class="rinfo"><b>${eggName(s.egg)}</b><div class="condbar"><i style="width:${Math.round(s.pct * 100)}%;background:#ffd27a"></i></div><span class="small">hatches in about ${fmt(s.left)}</span></div><button class="btn ghost" data-out="${i}">Take out</button></div>`).join('') : '<p class="small">Empty and warm.</p>'}
      ${slots.length < 3 && G.eggs.length ? `<h4>Your eggs</h4>${G.eggs.map((e, i) => `<div class="shop-row"><div class="rinfo"><b>${eggName(e)}</b> <span class="small">${Math.ceil(e.need - e.walked)} steps left on foot</span></div><button class="btn" data-in="${i}">Put in</button></div>`).join('')}` : (G.eggs.length ? '' : '<p class="small">You are not carrying any eggs.</p>')}
      <div class="row"><button class="btn ghost" id="inc-close">Close</button></div>`;
    el['panel-body'].querySelectorAll('[data-in]').forEach(b => b.addEventListener('click', () => { const err = Lab.putEgg(G.eggs[+b.dataset.in]); if (err) toast(err, 'bad'); else { sfx('place'); renderIncubator(); } }));
    el['panel-body'].querySelectorAll('[data-out]').forEach(b => b.addEventListener('click', () => { const err = Lab.takeEgg(+b.dataset.out); if (err) toast(err, 'bad'); else { sfx('caught'); renderIncubator(); } }));
    q('inc-close').addEventListener('click', closePanel);
  }
  // ---------- the Starship above the clouds ----------
  function renderDestination() {
    setTitle('Starship · where to?');
    const bodies = [
      { id: 'earth', name: 'Earth', col: '#2f7fe0', desc: 'Home. Green land, the sea, your villages and your camp.' },
      { id: 'moon', name: 'the Moon', col: '#b4b4bc', desc: 'Low gravity, no air (Space Suit). Alien settlements, selenite and tycho in the rock, worms under the Mare. Wild Kin from Lv 30.' },
      { id: 'halo', name: 'Halo', col: '#d9b464', desc: 'The ringed world. No air (Space Suit), brine that burns, stones falling from the ring. Caravan towns, amber and sulfur. Wild Kin from Lv 110.' },
    ];
    el['panel-body'].innerHTML = `<p class="note">The world lets go of the ship. Pick a body and hold on.</p>` + bodies.map(b => `<div class="shop-row"><div class="ico big" style="background:${b.col}"></div><div class="rinfo"><b>${b.name}${b.id === G.worldId ? ' · you are here' : ''}</b><div class="small">${b.desc}</div></div><button class="btn" data-dest="${b.id}" ${b.id === G.worldId ? 'disabled' : ''}>Fly</button></div>`).join('') + `<div class="row"><button class="btn ghost" data-dest="back">Turn back</button></div>`;
    el['panel-body'].querySelectorAll('[data-dest]').forEach(b => b.addEventListener('click', () => G.chooseDestination(b.dataset.dest)));
  }
  // ---------- a chest: your bag on the left, the chest on the right (stacked on a phone) ----------
  function renderChest(pos) {
    const chest = G.chestAt(pos.x, pos.y, pos.z, true); const p = G.player;
    setTitle(chest.treasure ? 'Treasure chest' : 'Chest');
    const bag = [...p.inv.keys()].filter(k => ITEMS[k] && !ITEMS[k].gear && !ITEMS[k].keep).sort((a, b) => p.count(b) - p.count(a));
    const inside = Object.keys(chest.items).sort((a, b) => chest.items[b] - chest.items[a]);
    const row = (k, n, kind) => `<div class="shop-row"><div class="ico big" style="background:${ITEMS[k].col}"></div><div class="rinfo"><b>${ITEMS[k].name} ×${n}</b></div><button class="btn ghost" data-${kind}1="${k}">${kind === 'store' ? 'Store 1' : 'Take 1'}</button><button class="btn" data-${kind}all="${k}">${kind === 'store' ? 'Store all' : 'Take all'}</button></div>`;
    el['panel-body'].innerHTML = `<p class="note">${chest.treasure ? 'Someone else\'s hoard. Take what you can carry.' : 'Whatever you store here stays here: the wild cannot take it from you, and the chest does not fill up. Mine the chest to pick it up with everything inside.'}</p>
      <h4>In the chest</h4>${inside.length ? inside.map(k => row(k, chest.items[k], 'take')).join('') : '<p class="small">Empty.</p>'}
      ${chest.treasure ? '' : `<h4>In your bag</h4>${bag.length ? bag.map(k => row(k, p.count(k), 'store')).join('') : '<p class="small">Nothing to store.</p>'}`}
      <div class="row"><button class="btn ghost" id="ch-close">Close</button></div>`;
    const re = () => { renderChest(pos); renderHotbar(); };
    el['panel-body'].querySelectorAll('[data-store1]').forEach(b => b.addEventListener('click', () => { if (G.chestStore(chest, b.dataset.store1, 1)) { sfx('place'); re(); } }));
    el['panel-body'].querySelectorAll('[data-storeall]').forEach(b => b.addEventListener('click', () => { if (G.chestStore(chest, b.dataset.storeall, 999)) { sfx('place'); re(); } }));
    el['panel-body'].querySelectorAll('[data-take1]').forEach(b => b.addEventListener('click', () => { if (G.chestTake(chest, b.dataset.take1, 1)) { sfx('caught'); re(); } }));
    el['panel-body'].querySelectorAll('[data-takeall]').forEach(b => b.addEventListener('click', () => { if (G.chestTake(chest, b.dataset.takeall, 999)) { sfx('caught'); re(); } }));
    q('ch-close').addEventListener('click', closePanel);
  }
  function closePanel() { const was = panelOpen; panelOpen = null; fusionState = null; securePicking = false; el.panel.classList.add('hidden'); G.setPaused(false); if (was === 'destination' && G.player && !G.player.flying) { G.player.flying = true; G.player.y = WH + 10; G.player.vy = -2; } }
  function setTitle(t) { el['panel-title'].textContent = t; }
  function portraitHtml(k, size = 64) { return `<canvas class="portrait" width="${size}" height="${size}" data-kid="${k.id}" data-size="${size}"></canvas>`; }
  function drawPortraits(root) { root.querySelectorAll('canvas.portrait').forEach(cv => { const k = G.kin.find(x => x.id == cv.dataset.kid) || (fusionState && fusionState.preview && fusionState.preview.kin && fusionState.preview.kin.id == cv.dataset.kid ? fusionState.preview.kin : null); if (k) KIN.portrait(cv, k.sp, k.stage, +cv.dataset.size); }); }
  function kinCard(k, extra = '') {
    const st = KIN.stats(k); const frac = k.hp / st.hp;
    return `<div class="kcard" data-kid="${k.id}">${portraitHtml(k)}<div class="kinfo"><div class="krow"><b>${KIN.name(k)}</b>${(k.sp.rarity || 0) > 0 ? `<span class="rar r${k.sp.rarity}">${KIN.RARITY[k.sp.rarity].name}</span>` : ''}${k === G.activeKin() ? '<span class="tag">active</span>' : ''}${k.sp.mythic ? '<span class="tag myth">mythic</span>' : ''}${k.hp <= 0 ? '<span class="tag down">fainted</span>' : ''}<span class="lv">Lv ${k.level}<span style="opacity:.55">/${KIN.capOf(k.sp)}</span></span>${(k.tamed || k.sp.tame) ? `<span class="tag" title="trust">♞ ${Math.round((k.trust || 0) * 100)}%</span>` : ""}</div><div class="hpbar"><div class="hpfill" style="width:${frac * 100}%;background:${frac > 0.5 ? '#5ad66a' : frac > 0.22 ? '#f0c040' : '#f05040'}"></div></div><div class="krow small">${KIN.dominant(k.sp.elem, 2).map(e => `<span class="badge" style="background:${ELEM_COLOR[e]}">${e}</span>`).join('')}<span>${Math.round(k.hp)}/${st.hp}</span>${(k.sp.gen || 0) > 0 ? `<span class="gen">fusion g${k.sp.gen}</span>` : ''}</div>${extra}</div></div>`;
  }
  function healButton(k) {
    const p = G.player; const st = KIN.stats(k);
    const item = k.hp <= 0 ? 'tonic_revive' : k.hp < st.hp ? 'tonic_heal' : null;
    if (!item) return '';
    const have = p.count(item);
    return `<button class="kheal" data-heal="${item}" ${have ? '' : 'disabled'}>${k.hp <= 0 ? 'Revive' : 'Heal'}${have ? ' ×' + have : ' (none)'}</button>`;
  }
  function renderKin() {
    setTitle(`Your party · ${G.kin.length + G.eggs.length}/${G.MAX_KIN}`);
    const body = el['panel-body'];
    const tonics = ['tonic_revive', 'tonic_heal'].map(t => `${ITEMS[t].name} ×${G.player.count(t)}`).join(' · ');
    const atTable = G.nearTable();
    const eggs = G.eggs.map(e => `<div class="kcard egg"><div class="eggico"></div><div class="kinfo"><b>Egg${e.label ? ': ' + e.label : ''}</b><div class="small">${e.from ? 'From ' + e.from + '. ' : ''}Keep walking with it: about ${Math.max(0, Math.ceil(e.need - e.walked))} steps to go.</div><div class="qbar"><div style="width:${Math.round(100 * Math.min(1, e.walked / e.need))}%"></div></div></div></div>`).join('');
    const box = G.box.length ? `<h4>Storage (${G.box.length})</h4>` + (atTable ? G.box.map((d, i) => `<div class="recipe"><div class="rinfo"><b>${d.nick || d.sp.names[(d.stage || 1) - 1]}</b> <span class="small">Lv ${d.level}</span></div><button class="btn" data-unbox="${i}" ${G.partyFull() ? 'disabled' : ''}>Take</button></div>`).join('') : '<p class="note">Your stored Kin wait at the Fusion Tables. Stand at any table to swap.</p>') : '';
    body.innerHTML = `<p class="note">You carry eight, and an egg takes a slot. Everyone awake learns a little from every win; the one that fights learns most.<br>${tonics}</p><div class="row"><button class="btn" id="k-dex">Kindex</button></div>` + G.kin.map(k => kinCard(k, healButton(k) + (atTable && G.kin.length > 1 ? `<button class="kheal" data-store="${k.id}">Store</button>` : ''))).join('') + eggs + box;
    drawPortraits(body);
    q('k-dex').addEventListener('click', () => openPanel('kindex'));
    body.querySelectorAll('[data-store]').forEach(b => b.addEventListener('click', (ev) => { ev.stopPropagation(); const k = G.kin.find(x => x.id == b.dataset.store); if (!k || G.kin.length <= 1) return; G.returnGear([k]); G.kin = G.kin.filter(x => x !== k); G.box.push(KIN.serialize(k)); G.activeIdx = U.clamp(G.activeIdx, 0, G.kin.length - 1); renderKin(); }));
    body.querySelectorAll('[data-unbox]').forEach(b => b.addEventListener('click', () => { if (G.partyFull()) return; const d = G.box.splice(+b.dataset.unbox, 1)[0]; G.kin.push(KIN.deserialize(d)); renderKin(); }));
    body.querySelectorAll('.kheal').forEach(b => b.addEventListener('click', (ev) => { ev.stopPropagation(); const card = b.closest('.kcard'); const k = G.kin.find(x => x.id == card.dataset.kid); if (G.useTonic(b.dataset.heal, k)) renderKin(); }));
    body.querySelectorAll('.kcard').forEach(c => c.addEventListener('click', () => openPanel('detail', G.kin.find(k => k.id == c.dataset.kid))));
  }
  // the Kindex: every species on this planet, in order; seen ones show their name and home, caught ones their picture
  function renderKindex(data) {
    const body0 = (data && data.body) || G.worldId; const list = KIN.dex(body0); const seen = G.stats.dex || {};
    const nCaught = list.filter(sp => seen[sp.seed] === 'caught').length, nSeen = list.filter(sp => seen[sp.seed]).length;
    setTitle(`Kindex · ${G.world.preset.name ? ({ earth: 'Earth', moon: 'Moon', halo: 'Halo' })[body0] : body0}`);
    const where = (sp) => sp.fusion ? 'fusion recipe' : sp.home.layer === 'Surface' ? sp.home.biome : sp.home.layer === 'Water' ? 'water' : sp.home.layer === 'Sky' ? 'sky islands' : sp.home.layer === 'Mines' ? 'the mines' : 'the core';
    const tabs = ['earth', 'moon', 'halo'].map(b => `<button class="btn ${b === body0 ? '' : 'ghost'}" data-dexb="${b}">${({ earth: 'Earth', moon: 'Moon', halo: 'Halo' })[b]}</button>`).join('');
    el['panel-body'].innerHTML = `<div class="row">${tabs}</div><p class="note">${nCaught} caught, ${nSeen} seen, of ${list.length}. Numbers 201 and up only come from fusion recipes.</p><div class="dexgrid">` + list.map(sp => { const st = seen[sp.seed];
      return `<div class="dexcell ${st || 'unknown'}">${st === 'caught' ? `<canvas class="dexpic" width="48" height="48" data-seed="${sp.seed}"></canvas>` : '<div class="dexq">?</div>'}<div class="dexn">#${sp.dex}</div><div class="dexname">${st ? sp.names[0] : '???'}</div>${st ? `<div class="dexwhere"><span class="rar r${sp.rarity}">${KIN.RARITY[sp.rarity].name}</span> ${where(sp)}${sp.steed ? ' · ♞ steed' : ''}</div>` : ''}</div>`; }).join('') + '</div>';
    el['panel-body'].querySelectorAll('canvas.dexpic').forEach(cv => { const sp = list.find(x => x.seed == cv.dataset.seed); if (sp) KIN.portrait(cv, sp, 1, 48); });
    el['panel-body'].querySelectorAll('[data-dexb]').forEach(b => b.addEventListener('click', () => renderKindex({ body: b.dataset.dexb })));
  }
  let explainQ = [], explainBusy = false;
  function explain(title, text) { explainQ.push([title, text]); if (!explainBusy) nextExplain(); }
  function nextExplain() {
    const it = explainQ.shift(); let b = document.getElementById('explain'); if (!it) { explainBusy = false; if (b) b.classList.add('hidden'); return; }
    explainBusy = true; if (!b) { b = document.createElement('div'); b.id = 'explain'; document.getElementById('hud').appendChild(b); b.addEventListener('click', () => { clearTimeout(b._t); nextExplain(); }); }
    b.innerHTML = `<b>${it[0]}</b><div>${it[1]}</div><span class="x">tap to close</span>`; b.classList.remove('hidden');
    clearTimeout(b._t); b._t = setTimeout(nextExplain, 7000);
  }
  function statBars(k) {
    const st = KIN.stats(k);
    return KIN.STAT_KEYS.map(key => { const v = st[key]; const max = key === 'hp' ? 2200 : 1000; return `<div class="stat"><span>${KIN.STAT_NAMES[key]}</span><div class="sbar"><div style="width:${Math.min(100, 100 * v / Math.max(max * 0.12, v * 1.3))}%"></div></div><b>${v}</b></div>`; }).join('');
  }
  function renderDetail(k) {
    setTitle(KIN.name(k));
    const mv = KIN.moves(k);
    const elems = k.sp.elem.map((w, i) => ({ e: KIN.E[i], w })).filter(x => x.w > 0.04).sort((a, b) => b.w - a.w);
    const next = k.stage < 3 ? `Evolves at Lv ${k.sp.evolveAt[k.stage - 1]}` : 'Final form';
    el['panel-body'].innerHTML = `<div class="detail">${portraitHtml(k, 120)}<div>
      <div class="krow"><b>Lv ${k.level}</b> · stage ${k.stage} · ${next}</div>
      <div class="krow small">XP ${k.xp}/${KIN.xpToNext(k.level)}</div>
      <div class="elemmix">${elems.map(x => `<span class="badge" style="background:${ELEM_COLOR[x.e]};flex:${x.w}">${x.e} ${Math.round(x.w * 100)}%</span>`).join('')}</div>
      ${k.sp.climber ? '<div class="small">Climber: ridden, it leaps two blocks at a time and never minds a fall. Half as cold on its back.</div>' : ''}
      ${(k.sp.gen || 0) > 0 ? `<div class="small">Fusion generation ${k.sp.gen}${k.sp.fusedFrom ? ' (from ' + k.sp.fusedFrom + ' Kin)' : ''}: +${Math.round((Math.pow(1.08, k.sp.gen) - 1) * 100)}% stats</div>` : ''}
      ${(k.sp.traits || []).map(t => `<div class="trait"><b>${t}</b> ${KIN.TRAITS[t]}</div>`).join('')}
    </div></div>
    <div class="stats">${statBars(k)}</div>
    <h4>Moves</h4>${mv.map(m => `<div class="moverow" style="--c:${m.kind === 'util' ? '#8899aa' : ELEM_COLOR[m.elem]}"><b>${m.name}</b><span>${m.kind === 'util' ? m.desc : m.kind + ' · power ' + m.power + ' · ' + Math.round(m.acc * 100) + '% acc'}</span></div>`).join('')}
    <h4>Gear</h4><div class="small">${['weapon', 'armor', 'charm'].map(slot => { const it = k.equip && k.equip[slot]; return `<span class="chip" ${it ? `data-uneq="${slot}" style="background:${ITEMS[it].col}"` : 'style="opacity:.6"'}>${slot}: ${it ? ITEMS[it].name + (ITEMS[it].relic ? ' ' + Math.round(Relics.cond(it) * 100) + '%' : '') + ' ✕' : 'none'}</span>`; }).join(' ')}</div>
    ${(() => { const have = [...G.player.inv.keys()].filter(x => ITEMS[x] && ITEMS[x].kinGear); return have.length ? `<div class="usebar">${have.map(x => `<button class="btn ghost" data-equip="${x}">Put on ${ITEMS[x].name} ×${G.player.count(x)}</button>`).join('')}</div>` : '<div class="small">Craft Kin gear under Craft › Kin gear, then put it on here.</div>'; })()}
    ${['tonic_revive', 'tonic_heal', 'tonic_vigor', 'tonic_might', 'tonic_swift'].some(t => G.player.has(t)) ? `<h4>Tonics</h4><div class="usebar">${['tonic_revive', 'tonic_heal', 'tonic_vigor', 'tonic_might', 'tonic_swift'].filter(t => G.player.has(t)).map(t => `<button class="btn ghost" data-tonic="${t}">${ITEMS[t].name} ×${G.player.count(t)}</button>`).join('')}</div>` : ''}
    <div class="row"><button class="btn" id="d-active" ${k === G.activeKin() || k.hp <= 0 ? 'disabled' : ''}>Set active</button><button class="btn" id="d-rename">Rename</button>${Village.active && G.villageState[Village.active.id] && G.villageState[Village.active.id].freed ? `<button class="btn ghost" id="d-guard" ${k.hp <= 0 ? 'disabled' : ''}>Station as guard</button>` : ''}<button class="btn ghost" id="d-back">Back</button></div>`;
    drawPortraits(el['panel-body']);
    q('d-active').addEventListener('click', () => { G.setActive(k); renderDetail(k); });
    el['panel-body'].querySelectorAll('[data-tonic]').forEach(b => b.addEventListener('click', () => { G.useTonic(b.dataset.tonic, k); renderDetail(k); }));
    el['panel-body'].querySelectorAll('[data-equip]').forEach(b => b.addEventListener('click', () => { if (G.equipKin(k, b.dataset.equip)) renderDetail(k); }));
    el['panel-body'].querySelectorAll('[data-uneq]').forEach(b => b.addEventListener('click', () => { if (G.unequipKin(k, b.dataset.uneq)) renderDetail(k); }));
    q('d-back').addEventListener('click', () => openPanel('kin'));
    const dg = q('d-guard'); if (dg) dg.addEventListener('click', () => { if (G.stationGuard(k)) openPanel('village', Village.active); });
    q('d-rename').addEventListener('click', () => {
      const box = document.createElement('div'); box.className = 'row'; box.innerHTML = `<input id="d-name" maxlength="14" value="${KIN.name(k)}"><button class="btn" id="d-ok">OK</button>`;
      el['panel-body'].appendChild(box); q('d-name').focus();
      q('d-ok').addEventListener('click', () => { const v = q('d-name').value.trim(); k.nick = v || null; renderDetail(k); });
    });
  }
  function secureHtml() {
    const p = G.player; const keys = Object.keys(G.secure);
    const slots = [];
    for (let i = 0; i < 5; i++) { const k = keys[i]; slots.push(k ? `<span class="chip" data-unsec="${k}" style="background:${ITEMS[k].col}">${ITEMS[k].name} ×${Math.min(p.count(k), G.secure[k])} ✕</span>` : `<span class="chip empty" data-sec="${i}">+ secure</span>`); }
    return `<h4>Secure slots</h4><p class="note">If the wild beats you, your bag is lost except gear, rods and these five slots (up to 10 of an item each). Kin and Shards are always safe.</p><div class="ingr">${slots.join('')}</div>`;
  }
  const SW = { hair: ['#1a1410', '#3a2a1a', '#7a4a2a', '#c9955a', '#f0d890', '#e8e8e8', '#c94c4c', '#4a7ad0', '#7a2aa8', '#39ff14'], tone: ['#f6dcc4', '#f1d3b3', '#e0b08a', '#c68642', '#8d5524', '#5a3a22'], col: ['#c94c4c', '#e08a2a', '#ffd040', '#4f7a3a', '#2fb8c8', '#4a7ad0', '#7a2aa8', '#e0509a', '#f0f0f0', '#202028'] };
  const LOOK_COST = { hair: 150, hairCol: 60, tone: 200, height: 300, paint: 250, paintCol: 60, cape: 400, outfit: 300, trim: 150, wear: 200, wearCol: 60 };
  function renderLook(d) {
    const L = G.stats.look || (G.stats.look = {}); const k = d.kind; const opt = (key, val, label, col) => `<button class="btn ${L[key] === val ? '' : 'ghost'} lookopt" data-k="${key}" data-v="${val}" ${col ? `style="background:${col};min-width:34px"` : ''}>${label || ''}</button>`;
    const kin = G.kin[G.activeIdx]; let html = `<p class="note">You have ◆ ${G.shards.toLocaleString()}. Every change costs a little and shows at once (switch to third person in the menu to see yourself).</p><canvas id="look-cv" width="120" height="120" style="display:block;margin:0 auto 8px;background:rgba(0,0,0,.25);border-radius:10px"></canvas>`;
    if (k === 'barber') html += `<h4>Cut · ◆ ${LOOK_COST.hair}</h4>${['short', 'long', 'mohawk', 'bun', 'spiky', 'braids', 'curls', 'bald'].map(h => opt('hair', h, h)).join(' ')}${['laurel', 'plume', 'topknot', 'crownbraid'].filter(h => (G.stats.unlocks || {})['hair_' + h]).map(h => opt('hair', h, '★ ' + h)).join(' ')}<p class="small">★ styles are won at the Kin Shows, never sold.</p><h4>Colour · ◆ ${LOOK_COST.hairCol}</h4>${SW.hair.map(c => opt('hairCol', c, '', c)).join(' ')}`;
    if (k === 'mirror') html += `<h4>Skin tone · ◆ ${LOOK_COST.tone}</h4>${SW.tone.map(c => opt('tone', c, '', c)).join(' ')}<h4>Height · ◆ ${LOOK_COST.height}</h4>${[[0.86, 'short'], [0.94, 'small'], [1, 'average'], [1.08, 'tall'], [1.16, 'very tall']].map(([v, n]) => opt('height', v, n)).join(' ')}`;
    if (k === 'designer') html += `<h4>Face paint · ◆ ${LOOK_COST.paint}</h4>${['none', 'stripes', 'dots', 'mask', 'tribal', 'star'].map(h => opt('paint', h, h)).join(' ')}<h4>Paint colour · ◆ ${LOOK_COST.paintCol}</h4>${SW.col.map(c => opt('paintCol', c, '', c)).join(' ')}<h4>Cape · ◆ ${LOOK_COST.cape}</h4>${opt('cape', '', 'none')} ${SW.col.map(c => opt('cape', c, '', c)).join(' ')}<h4>Outfit colour · ◆ ${LOOK_COST.outfit}</h4>${SW.col.map(c => opt('outfit', c, '', c)).join(' ')}<h4>Trim · ◆ ${LOOK_COST.trim}</h4>${SW.col.map(c => opt('trim', c, '', c)).join(' ')}`;
    if (k === 'kinwear') { if (!kin) html += '<p>No lead Kin.</p>'; else { const W = kin.wear || {}; const o2 = (key, val, label, col) => `<button class="btn ${W[key] === val ? '' : 'ghost'} lookopt" data-kin="1" data-k="${key}" data-v="${val}" ${col ? `style="background:${col};min-width:34px"` : ''}>${label || ''}</button>`;
      html += `<h4>For ${KIN.name(kin)} · ◆ ${LOOK_COST.wear}</h4>${['none', 'scarf', 'coat', 'hat', 'bow', 'crown', 'collar'].map(h => o2('item', h, h)).join(' ')}${['rosette', 'sash', 'laurelk', 'medal'].filter(h => (G.stats.unlocks || {})['wear_' + h]).map(h => o2('item', h, '★ ' + (h === 'laurelk' ? 'laurel' : h))).join(' ')}<h4>Colour · ◆ ${LOOK_COST.wearCol}</h4>${SW.col.map(c => o2('col', c, '', c)).join(' ')}<p class="small">It wears it when it walks beside you.</p>`; } }
    el['panel-body'].innerHTML = html;
    try { Avatar.portrait(document.getElementById('look-cv'), Avatar.skin(), 120); } catch (e) {}
    el['panel-body'].querySelectorAll('.lookopt').forEach(b => b.addEventListener('click', () => {
      const key = b.dataset.k; let val = b.dataset.v; if (key === 'height') val = +val; if (val === 'none') val = '';
      const forKin = !!b.dataset.kin; const cost = forKin ? (key === 'item' ? LOOK_COST.wear : LOOK_COST.wearCol) : LOOK_COST[key];
      const tgt = forKin ? (kin.wear || (kin.wear = {})) : L; if (tgt[key] === val) return; if (G.shards < cost) { toast(`That is ${cost} shards.`, 'bad'); return; }
      G.shards -= cost; tgt[key] = val; sfx('caught'); renderLook(d);
    }));
  }
  function renderTrain() {
    setTitle('Station');
    const rs = (G.stats.roosts || []).filter(r => (r.world || 'earth') === G.worldId); const here = G.roostHere();
    el['panel-body'].innerHTML = `<p class="note">${rs.length < 2 ? 'This is the only open station on the line so far. Free other towns and fix their stations, and the train will run to them.' : 'Where to? The fare goes up with the distance.'} You have ◆ ${G.shards}.</p><div class="roosts">${rs.map(r => { const me = here && here.id === r.id; const c = G.roostCost(r); return `<button class="btn ${me ? 'ghost' : ''}" data-roost="${r.id}" ${!here || me || G.shards < c ? 'disabled' : ''}>${r.name}${me ? ' (here)' : ` · ◆ ${c}`}</button>`; }).join('')}</div>`;
    el['panel-body'].querySelectorAll('[data-roost]').forEach(b => b.addEventListener('click', () => G.flyTo(b.dataset.roost)));
  }
  function renderForge(d) {
    setTitle(d.who || 'Runeforge');
    el['panel-body'].innerHTML = `<p class="note">${d.intro || ''} Relics wear as your Kin fight in them, and their power fades with them. Mend them early: the price climbs steeply the worse they get, and a broken one needs extra materials. You have ◆ ${G.shards.toLocaleString()}.</p>` + Relics.forgeHtml();
    el['panel-body'].querySelectorAll('[data-mend]').forEach(b => b.addEventListener('click', () => { if (Relics.repair(b.dataset.mend)) renderForge(d); }));
  }
  function renderRelics(d) {
    setTitle(d.who || 'Relics');
    const intro = { turncoat: 'From the Kinmaster\'s vault. One of each, and nobody else will ever sell them.', foreman: 'Garrick unwraps an oilcloth on the table.', hermit: 'Wren takes a long box down from the rafters.', diver: 'Marisol opens a sea chest that smells of salt and something older.', merchant: 'Silas lifts a velvet cloth with a showman\'s flourish.', keeper: 'Barnaby unlocks a cabinet behind the ticket booth.' }[d.seller] || '';
    el['panel-body'].innerHTML = `<p class="note">${intro} Relics are Kin gear far beyond anything a table makes. Put one on from a Kin's page. You have ◆ ${G.shards.toLocaleString()}.</p>` + Relics.html(d.seller);
    el['panel-body'].querySelectorAll('[data-relic]').forEach(b => b.addEventListener('click', () => { Relics.buy(b.dataset.relic); }));
  }
  function renderCraft() {
    setTitle('Craft');
    const p = G.player;
    if (securePicking) {
      const opts = [...p.inv.keys()].filter(k => !ITEMS[k].gear && !ITEMS[k].keep && !G.secure[k]);
      el['panel-body'].innerHTML = `<p class="note">Choose what to keep safe.</p><div class="ingr">${opts.map(k => `<span class="chip" data-pick="${k}" style="background:${ITEMS[k].col}">${ITEMS[k].name} ×${p.count(k)}</span>`).join('') || '<span class="small">Nothing in the bag.</span>'}</div><button class="btn ghost" id="sec-cancel">Cancel</button>`;
      el['panel-body'].querySelectorAll('[data-pick]').forEach(c => c.addEventListener('click', () => { G.secure[c.dataset.pick] = 10; securePicking = false; renderCraft(); }));
      q('sec-cancel').addEventListener('click', () => { securePicking = false; renderCraft(); });
      return;
    }
    const CATS = [['arms', 'Weapons and shields'], ['gear', 'Tools and gear'], ['tonics', 'Tonics'], ['blocks', 'Blocks'], ['builds', 'Buildings'], ['kin', 'Kin gear']];
    const catOf = (r) => r.cat || (r.out.startsWith('tonic_') ? 'tonics' : ITEMS[r.out].block ? 'blocks' : 'gear');
    el['panel-body'].innerHTML = secureHtml() + `<p class="note">No table needed for these. Ingredients come from mining, leaves, berries and essences. Kits raise a whole building where you tap; Kin gear is put on from a Kin's page.</p>` + CATS.map(([c, title]) => `<h4>${title}</h4>` + RECIPES.filter(r => catOf(r) === c && !(r.when && !r.when(G))).map(r => {
      const owned = ITEMS[r.out].gear && p.has(r.out);
      const darkOff = G.darkRecipe(r) && !G.nearDarkTable();
      const can = !owned && !darkOff && Object.keys(r.needs).every(k => p.count(k) >= r.needs[k]);
      return `<div class="recipe ${can ? 'can' : ''}"><div class="ico big" style="background:${ITEMS[r.out].col}"></div><div class="rinfo"><b>${ITEMS[r.out].name}${r.n > 1 ? ' ×' + r.n : ''}</b>${G.darkRecipe(r) ? ' <span class="darktag">Dark Table</span>' : ''}<div class="small">${ITEMS[r.out].desc}${p.gearPower[r.out] ? ' Marked by ' + p.gearPower[r.out].mark + ': +' + Math.round((p.gearPower[r.out].power - 1) * 100) + '%.' : ''}</div><div class="needs">${Object.keys(r.needs).map(k => `<span class="${p.count(k) >= r.needs[k] ? 'ok' : 'no'}">${ITEMS[k].name} ${p.count(k)}/${r.needs[k]}</span>`).join('')}</div></div><button class="btn" data-r="${r.id}" ${can ? '' : 'disabled'}>${owned ? 'Owned' : 'Craft'}</button></div>`;
    }).join('')).join('');
    el['panel-body'].querySelectorAll('button[data-r]').forEach(b => b.addEventListener('click', () => { if (!G.craft(b.dataset.r)) renderCraft(); }));
    el['panel-body'].querySelectorAll('[data-sec]').forEach(c => c.addEventListener('click', () => { if (Object.keys(G.secure).length >= 5) return; securePicking = true; renderCraft(); }));
    el['panel-body'].querySelectorAll('[data-unsec]').forEach(c => c.addEventListener('click', () => { delete G.secure[c.dataset.unsec]; renderCraft(); }));
  }
  function renderQuests() {
    setTitle('Quests');
    const idx = G.questState.index, b = G.questState.bounty;
    const cur = Quests.current(); const tg = Quests.target();
    const head = cur ? `<div class="quest current"><b>Now: ${cur.title}</b><div class="small">${cur.desc}</div><div class="small"><b>${Quests.hintText()}</b></div>${tg ? '<div class="row"><button class="btn" id="q-pin">Point me there</button></div>' : ''}</div>` : '';
    const JOBCOL = Object.assign({ fetch: '#9fd36a', hunt: '#ff7060', catch: '#ff7060', dig: '#c8a070', deliver: '#9fd36a', lair: '#ff8040', explore: '#ff8040' }, Builds.COL);
    const JOBTAG = { build: 'BUILD', archery: 'ARCHERY', night: 'NIGHT', lair: 'DEN', explore: 'FIND', hunt: 'HUNT', catch: 'CATCH', dig: 'DIG', fetch: 'FETCH', deliver: 'DELIVER' };
    const jobs = Npcs.takenList(); const jobsHtml = jobs.length ? `<div class="quest bounty"><b>Jobs (${jobs.length})</b>` + jobs.map(([w, q]) => `<div class="small" style="margin-top:4px"><span style="display:inline-block;padding:1px 6px;border-radius:6px;font-size:10px;font-weight:700;background:${JOBCOL[q.kind] || '#888'};color:#111">${JOBTAG[q.kind] || q.kind.toUpperCase()}</span> ${Npcs.questText(q)} <span style="opacity:.7">· for ${q.wname}</span></div>`).join('') + '</div>' : '';
    el['panel-body'].innerHTML = head + jobsHtml + `<div class="quest bounty"><b>Villages</b><div class="small">${Village.summaryHtml()}</div></div><div class="quest bounty"><b>Bounty ${b.round}</b><div class="small">Win ${b.need} battles: ${G.stats.battlesWon - (b.base || 0)}/${b.need}. Reward: Snare Cube and XP. Repeats, bigger each time.</div></div>` +
      Object.keys(Quests.ARCS).map(a => { const A = Quests.ARCS[a]; const L = Quests.arcList(a); const ai = (G.questState.arcs || {})[a] || 0; const cq = Quests.arcCurrent(a); const gate = Quests.gated(cq); const focus = (G.questState.focus || 'main') === a;
        const gateTxt = gate ? `Opens after: ${(QUESTS.find(x => x.id === gate) || {}).title || gate}` : '';
        return `<div class="arc" style="--ac:${A.col}"><div class="archead"><b>${A.name}</b> <span class="small">${Math.min(ai, L.length)}/${L.length}</span>${cq && !gate ? `<button class="btn ghost" data-focus="${a}" ${focus ? 'disabled' : ''}>${focus ? 'Following' : 'Follow'}</button>` : ''}</div>` +
          L.map((qq, i) => { const state = i < ai ? 'done' : i === ai ? 'current' : 'locked'; return `<div class="quest ${state}"><b>${i < ai ? '✓ ' : ''}${qq.title}</b>${state !== 'locked' ? `<div class="small">${state === 'current' && gate ? gateTxt : qq.desc}</div>` : '<div class="small">Locked</div>'}${state === 'current' && !gate ? `<div class="qbar"><div style="width:${Math.round(100 * U.clamp(qq.check(G), 0, 1))}%"></div></div>` : ''}</div>`; }).join('') + '</div>'; }).join('');
    el['panel-body'].querySelectorAll('[data-focus]').forEach(b => b.addEventListener('click', () => { G.questState.focus = b.dataset.focus; renderQuests(); }));
    el['quest-dot'].classList.add('hidden');
    const qp = document.getElementById('q-pin'); if (qp) qp.addEventListener('click', () => { const t = Quests.target(); if (t) { G.pin = { x: Math.round(t.x), z: Math.round(t.z) }; closePanel(); toast('Pinned. Follow ◎ and ★ on the compass.', 'good'); } });
  }
  function renderMenu() {
    setTitle(G.gameName ? `Stratakin · ${G.gameName}` : 'Stratakin');
    el['panel-body'].innerHTML = `<div class="menu">
      <div class="row"><button class="btn" id="m-save">Save game</button><button class="btn ghost" id="m-games">Games</button><button class="btn ghost" id="m-new">New world</button></div>
      <p class="small">Saving happens on its own every minute and whenever you leave. <b>Games</b> saves this one and shows every world you have, so you can play another; <b>New world</b> starts a fresh game alongside this one. Nothing is erased unless you delete a game from the list.</p>
      <button class="btn" id="m-sound">Sound: ${soundOn ? 'on' : 'off'}</button><button class="btn" id="m-music">Music: ${Music.enabled ? 'on' : 'off'}${Music.enabled && Music.current ? ' · ' + Music.current : ''}</button><button class="btn" id="m-map">Minimap: ${MM.on ? 'on' : 'off'}</button>
      <button class="btn" id="m-autojump">Auto-jump: ${G.player.autoJump ? 'on' : 'off'}</button>
      <div class="row"><button class="btn" id="m-camera">Camera: ${G.thirdPerson ? 'third person' : 'first person'}</button><button class="btn" id="m-skins">Skin: ${Avatar.skin().name}</button></div>
      <h4>How to play</h4>
      <p class="small">${Controls.isTouch ? 'Left side of the screen: drag to walk. Right side: drag to look, <b>hold</b> to mine, <b>tap</b> to place a block or talk to a Fusion Table. ▲ jumps, hold ▲ in the air with a Glider to glide.' : 'WASD to move, mouse to look, <b>hold left click</b> to mine, <b>right click</b> to place or use. Space jumps, Shift sneaks, 1-9 or the wheel pick an item. E opens Craft, Q opens Kin, J opens Quests, V switches the camera. Esc releases the mouse.'}</p>
      <p class="small">Chests (Craft › Blocks) keep what you store in them through anything. Amulets come from the people by the fires on the road; nobody sells them. Third person shows your skin: unlock more by playing.</p>
      <p class="small">Wild Kin have a sense ring. Walk into it from the front and they attack first. Sneak up from behind, stay still when the ring flashes, and you can jump them for an ambush: first strike and a better catch chance.</p>
      <p class="small">Layers, top to bottom: Sky islands (Light, Gale), Surface, the Mines (dark, bring a torch), and the Core: lava, Flame and Void, the Mythic. The world wraps after about an hour of walking in one direction; the further you go from camp, the stranger the Kin.</p>
      <p class="small">Shards (◆) are the currency: you earn them by dismantling objects and gear that had a Kin in them. Shops to spend them in come later.</p>
      <p class="small">The Fusion Table has 16 slots. Two Kin make a new one a little above their median level; ten make a much stronger one; six or more grant a trait that works outside battle. Items alone craft gear.</p>
      <p class="small">Every 4 trainer levels a new tier of Kin appears, a couple of levels above you. They keep to the outskirts and the deep water; the beaten paths stay gentler.</p>
      <p class="small">Seed: <code>${G.world.seed}</code></p>
    </div>`;
    q('m-save').addEventListener('click', () => { toast(G.save() ? `Saved${G.gameName ? ' · ' + G.gameName : ''}.` : 'Saving is not available here.'); });
    q('m-games').addEventListener('click', () => G.toGames(false));
    q('m-sound').addEventListener('click', () => { soundOn = !soundOn; if (!soundOn) Music.stop(); renderMenu(); });
    q('m-music').addEventListener('click', () => { Music.setEnabled(!Music.enabled); renderMenu(); });
    q('m-map').addEventListener('click', () => { setMinimap(!MM.on); renderMenu(); });
    q('m-autojump').addEventListener('click', () => { G.player.autoJump = !G.player.autoJump; renderMenu(); });
    q('m-camera').addEventListener('click', () => { G.toggleCamera(); renderMenu(); });
    q('m-skins').addEventListener('click', () => openPanel('skins'));
    q('m-new').addEventListener('click', () => G.newWorldFromMenu());
  }
  function renderBag() {
    setTitle('Bag');
    const p = G.player; const hb = p.hotbar(); const sel = p.selected();
    const groups = [
      ['Tools and food', k => ITEMS[k] && (ITEMS[k].light || ITEMS[k].snare || ITEMS[k].use)],
      ['Kits', k => ITEMS[k] && ITEMS[k].kit],
      ['Kin gear', k => ITEMS[k] && ITEMS[k].kinGear],
      ['Blocks', k => ITEMS[k] && ITEMS[k].block && !ITEMS[k].light && k !== 'fusion' || k === 'fusion'],
      ['Materials', k => ITEMS[k] && !ITEMS[k].block && !ITEMS[k].light && !ITEMS[k].snare && !ITEMS[k].use && !ITEMS[k].kit && !ITEMS[k].kinGear],
      ['Objects', k => k.startsWith('obj:')],
    ];
    const used = new Set();
    const all = [...new Set([...hb, ...[...p.inv.keys()].filter(k => ITEMS[k] && !ITEMS[k].gear)])];
    let html = `<p class="note">Tap <b>Hold</b> to carry an item in hand (then tap the world to place or use it). Gear you own is at the bottom.</p>`;
    for (const [title, test] of groups) {
      const keys = all.filter(k => !used.has(k) && test(k)); keys.forEach(k => used.add(k));
      if (!keys.length) continue;
      html += `<div class="bag-group"><h4>${title}</h4>` + keys.map(k => { const inf = p.itemInfo(k); return `<div class="bag-row ${k === sel ? 'sel' : ''}" data-k="${k}"><div class="ico big" style="background:${inf.col}"></div><div class="rinfo"><b>${inf.name}${inf.obj ? '' : ' ×' + p.count(k)}</b><div class="small">${inf.desc || ''}</div></div><div class="btns">${inf.use ? `<button class="use" data-use="${k}">Use</button>` : inf.kinGear ? `<button class="use" data-equipgo="${k}">Put on</button>` : ''}${hb.includes(k) ? `<button class="${inf.use ? '' : 'use'}" data-sel="${k}">${k === sel ? 'In hand' : 'Hold'}</button>` : ''}${inf.obj ? '' : `<button data-drop1="${k}">Drop 1</button><button data-dropall="${k}">Drop all</button>`}</div></div>`; }).join('') + '</div>';
    }
    const amulets = Npcs.AMULET_KEYS.filter(k => p.has(k));
    if (amulets.length) { const A = G.amulet || {}; const now = performance.now(); const cd = A.cd > now ? Math.ceil((A.cd - now) / 1000) : 0; html += `<div class="bag-group"><h4>Amulets</h4><p class="small">One trick each. Any amulet used puts all of them to sleep for four minutes.${cd ? ' Asleep for ' + cd + 's.' : ''}${Npcs.hudText() ? ' Active:' + Npcs.hudText() : ''}</p>` + amulets.map(k => `<div class="bag-row"><div class="ico big" style="background:${ITEMS[k].col}"></div><div class="rinfo"><b>${ITEMS[k].name}</b><div class="small">${ITEMS[k].desc}</div></div><div class="btns"><button class="use" data-amulet="${k}" ${cd ? 'disabled' : ''}>Activate</button></div></div>`).join('') + '</div>'; }
    const gear = Object.keys(ITEMS).filter(k => ITEMS[k].gear && !ITEMS[k].amulet && p.has(k));
    if (gear.length) html += `<div class="bag-group"><h4>Gear</h4>` + gear.map(k => `<div class="bag-row"><div class="ico big" style="background:${ITEMS[k].col}"></div><div class="rinfo"><b>${ITEMS[k].name}${p.gearPower[k] ? ' · marked by ' + p.gearPower[k].mark : ''}</b><div class="small">${ITEMS[k].desc}</div></div></div>`).join('') + '</div>';
    html += `<p class="small">Shards ◆ ${G.shards}</p>`;
    el['panel-body'].innerHTML = html;
    el['panel-body'].querySelectorAll('[data-sel]').forEach(b => b.addEventListener('click', () => { p.sel = p.hotbar().indexOf(b.dataset.sel); renderHotbar(); closePanel(); toast(`${p.itemInfo(b.dataset.sel).name} in hand. Tap the world to use or place it.`); }));
    el['panel-body'].querySelectorAll('[data-equipgo]').forEach(b => b.addEventListener('click', () => { openPanel('kin'); toast('Pick the Kin, then Put on from its page.'); }));
    el['panel-body'].querySelectorAll('[data-use]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.use; if (ITEMS[k].use === 'kin') { openPanel('kin'); toast('Pick the Kin to use it on.'); return; } if (G.useItem(k)) renderBag(); }));
    el['panel-body'].querySelectorAll('[data-amulet]').forEach(b => b.addEventListener('click', () => { if (Npcs.activate(b.dataset.amulet)) { closePanel(); } }));
    el['panel-body'].querySelectorAll('[data-drop1]').forEach(b => b.addEventListener('click', () => { G.dropItem(b.dataset.drop1, 1); renderBag(); }));
    el['panel-body'].querySelectorAll('[data-dropall]').forEach(b => b.addEventListener('click', () => { G.dropItem(b.dataset.dropall, 999); renderBag(); }));
  }
  // ---- minimap: terrain from the column noise, dots for villages, hermits, Kin and markers; north up, you at the centre ----
  const MM = { cv: null, ctx: null, terrain: null, tx: null, tz: null, t: 0, on: false, bpp: 1.25, size: 192, step: 4 };
  try { MM.on = localStorage.getItem('stratakin-minimap') === '1'; } catch (e) {}
  function terrainColor(info) {
    const h = info.h;
    const pr = G.world.preset; const b = info.biome; let c;
    if (pr.brine) { if (h < pr.brineLevel) return [150, 170, 50]; if (b === BIOME.FLATS) c = [226, 220, 190]; else if (b === BIOME.MESA) c = [150, 110, 70]; else c = [214, 180, 110]; const sh2 = 0.8 + 0.4 * U.clamp((h - 40) / 30, 0, 1); return [c[0] * sh2, c[1] * sh2, c[2] * sh2]; }
    if (pr.water) { if (h < SEA - 6) return [40, 70, 160]; if (h < SEA - 1) return [55, 110, 200]; if (h <= SEA + 1) return [205, 190, 140]; }
    if (b === BIOME.LOSTWORLD) return [30, 110, 40];
    if (b === BIOME.DESERT) c = [214, 196, 130]; else if (b === BIOME.SNOW) c = [232, 238, 245]; else if (b === BIOME.SWAMP) c = [92, 120, 70]; else if (b === BIOME.FOREST) c = [60, 120, 55]; else if (b === BIOME.MOUNTAIN) c = h > 64 ? [235, 238, 245] : [130, 130, 138]; else if (b === BIOME.MARE) c = [120, 118, 125]; else if (b === BIOME.HIGHLANDS) c = [160, 160, 150]; else if (b === BIOME.CRATER) c = [190, 180, 150]; else c = [96, 160, 70];
    const sh = 0.8 + 0.4 * U.clamp((h - 44) / 30, 0, 1); return [c[0] * sh, c[1] * sh, c[2] * sh];
  }
  function renderMinimap(p) {
    if (!MM.cv) { MM.cv = document.getElementById('minimap'); if (!MM.cv) return; MM.ctx = MM.cv.getContext('2d'); }
    MM.cv.classList.toggle('hidden', !MM.on); if (!MM.on) return;
    drawMap(MM, p, false);
  }
  // draws terrain (cached per spot) and markers onto a map holder {cv, ctx, size, bpp, step, terrain...}; big maps get names and a legend
  function drawMap(MM, p, big) {
    const ox = big ? (MM.ox || 0) : 0, oz = big ? (MM.oz || 0) : 0; // the big map can be dragged away from you
    if (ox || oz) p = { x: p.x + ox, y: p.y, z: p.z + oz, yaw: p.yaw, eye: p.eye ? p.eye.bind(p) : null };
    const ctx = MM.ctx, S = MM.size, bpp = MM.bpp, w = G.world; const cx = Math.round(p.x), cz = Math.round(p.z);
    const now = performance.now();
    if (!MM.terrain || Math.abs(cx - MM.tx) >= 6 || Math.abs(cz - MM.tz) >= 6 || now - MM.t > 4000 || MM.dirty) {
      MM.tx = cx; MM.tz = cz; MM.t = now; MM.dirty = false;
      const img = ctx.createImageData(S, S); const d = img.data; const step = MM.step;
      for (let py = 0; py < S; py += step) for (let px = 0; px < S; px += step) {
        const x = cx + (px - S / 2) * bpp, z = cz + (py - S / 2) * bpp;
        const c = terrainColor(w.colInfo(Math.floor(x), Math.floor(z)));
        for (let yy = 0; yy < step; yy++) for (let xx = 0; xx < step; xx++) { const i = ((py + yy) * S + (px + xx)) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; }
      }
      MM.terrain = img;
    }
    ctx.putImageData(MM.terrain, 0, 0);
    const wd = (v) => U.mod(v + WORLD_W / 2, WORLD_W) - WORLD_W / 2;
    const dot = (x, z, r, col, ring) => { const sx = S / 2 + wd(x - p.x) / bpp, sy = S / 2 + wd(z - p.z) / bpp; if (sx < 2 || sy < 2 || sx > S - 2 || sy > S - 2) return; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); if (ring) { ctx.lineWidth = 2; ctx.strokeStyle = ring; ctx.stroke(); } };
    const label = (x, z, t, col, force) => { if (!big || (bpp > 8 && !force)) return; const sx = S / 2 + wd(x - p.x) / bpp, sy = S / 2 + wd(z - p.z) / bpp; if (sx < 4 || sy < 4 || sx > S - 4 || sy > S - 4) return; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.strokeText(t, sx, sy + 7); ctx.fillStyle = col; ctx.fillText(t, sx, sy + 7); };
    // off the edge: pin it to the rim of the map, pointing the way, with the distance
    const edge = (x, z, t, col) => { const dx = wd(x - p.x) / bpp, dz = wd(z - p.z) / bpp; const r = S / 2 - 13; if (Math.abs(dx) < r && Math.abs(dz) < r) return; const k = r / Math.max(Math.abs(dx), Math.abs(dz)); const sx = S / 2 + dx * k, sy = S / 2 + dz * k; const a = Math.atan2(dz, dx);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(3, -6); ctx.lineTo(3, 6); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.restore();
      ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.75)'; const gx = sx - Math.cos(a) * 9, gy = sy - Math.sin(a) * 9; ctx.strokeText(t, gx, gy); ctx.fillStyle = col; ctx.fillText(t, gx, gy);
      const m = Math.round(Math.hypot(wd(x - p.x), wd(z - p.z))); const ds = m >= 1000 ? (m / 1000).toFixed(1) + 'k' : m + 'm'; ctx.font = 'bold 10px sans-serif'; const tx = U.clamp(gx - Math.cos(a) * 14, 14, S - 14), ty = U.clamp(gy - Math.sin(a) * 14, 8, S - 8); ctx.lineWidth = 3; ctx.strokeText(ds, tx, ty); ctx.fillStyle = '#ffffff'; ctx.fillText(ds, tx, ty); };
    const glyph = (x, z, t, col) => { const sx = S / 2 + wd(x - p.x) / bpp, sy = S / 2 + wd(z - p.z) / bpp; if (sx < 4 || sy < 4 || sx > S - 4 || sy > S - 4) return; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(t, sx, sy); ctx.fillStyle = col; ctx.fillText(t, sx, sy); };
    if (G.world.preset.villages) {
      for (const m of Village.markers(p.x, p.z, big ? Math.min(4, Math.ceil(bpp * S / 2 / 256) + 1) : 1)) {
        if (m.kind === 'village') { dot(m.x, m.z, 5, m.freed ? '#5ad66a' : '#ff4040', '#ffffff'); label(m.x, m.z, m.name + (m.type === 'sea' ? ' (stilts)' : m.type === 'deep' ? ' (dome)' : ''), m.freed ? '#bfffc8' : '#ffc0c0'); }
        else if (m.kind === 'hermit') { dot(m.x, m.z, 3, '#d9b36a', '#3a2a10'); label(m.x, m.z, 'hermit', '#f0e0b0'); }
        else if (m.kind === 'fisher') { dot(m.x, m.z, 3, '#5b9fd0', '#ffffff'); label(m.x, m.z, 'Brannock', '#cfe9ff'); }
      }
      if (G.camp && G.worldId === 'earth') glyph(G.camp.x, G.camp.z, '✦', '#7af5ff');
    }
    if (G.world.pad) glyph(G.world.pad.x, G.world.pad.z, '▲', '#c7fbff');
    for (const m of Npcs.mapMarks(p, S / 2 * bpp)) {
      if (m.kind === 'wanderer') { dot(m.x, m.z, 3, m.has ? '#ffd040' : '#b0a060', '#3a2a10'); label(m.x, m.z, m.name, '#ffe9a0'); }
      else if (m.kind === 'camp') { glyph(m.x, m.z, '△', '#ff6a3a'); label(m.x, m.z, 'camp', '#ffb0a0'); }
      else if (m.kind === 'tent') { dot(m.x, m.z, 3, '#7ad7ff', '#ffffff'); label(m.x, m.z, m.name, '#cfe9ff'); }
      else if (m.kind === 'lab') { glyph(m.x, m.z, '⚗', '#7ad7ff'); label(m.x, m.z, m.name, '#cfe9ff'); }
    }
    for (const m of Campaign.mapMarks()) { glyph(m.x, m.z, m.t, '#ffe08a'); label(m.x, m.z, m.name, '#fff0c0'); }
    if (G.stats.mapTowns && Village.townList) for (const v of Village.townList()) { glyph(v.x, v.z, v.size === 'city' ? '♛' : '⌂', '#9fe0ff'); label(v.x, v.z, v.name, '#d8f0ff'); }
    for (const m of Farms.mapMarks()) { glyph(m.x, m.z, m.t, '#b0e070'); label(m.x, m.z, m.name, '#e0f0c0'); }
    for (const m of Sky.mapMarks()) { glyph(m.x, m.z, m.t, m.t === '⛈' ? '#ff6a6a' : '#cfe4ff'); label(m.x, m.z, m.name, '#e8f0ff'); }
    for (const m of Keeps.mapMarks()) { glyph(m.x, m.z, m.t, m.t === '♜' ? '#c9a0ff' : '#ff6a6a'); label(m.x, m.z, m.name, '#e8d8ff'); }
    for (const m of Npcs.marks(p)) if (m.t === '⌖') { glyph(m.x, m.z, '⌖', m.col || '#ff8040'); label(m.x, m.z, m.name, m.col || '#ffd0b0'); edge(m.x, m.z, '⌖', m.col || '#ff8040'); }
    if (G.world.lost && G.stats.lostMap) { const L = G.world.lost; glyph(L.x, L.z, '🦖', '#ffffff'); label(L.x, L.z, 'Lost World', '#c0ffc0', true); const T = G.world.lostTunnel(); if (T) { glyph(T.ax, T.az, '◠', '#ffffff'); if (bpp <= 8) label(T.ax, T.az, 'tunnel', '#e0e0e0'); } }
    if (G.world.lost && G.stats.lostMap) { const ap0 = G.stats.apex || {}, ap = {}; for (const k in ap0) ap[k] = ap0[k] === true || (ap0[k] && (G.dayCount || 0) < ap0[k].back); if (!ap.rex) { glyph(G.world.lost.x, G.world.lost.z + 22, '✶', '#ff5a2a'); label(G.world.lost.x, G.world.lost.z + 22, 'Tyrannorex', '#ffb090'); } const sea = Wild.apexSea(); if (sea && !ap.mosa) { glyph(sea.x, sea.z, '✶', '#3fd1c4'); label(sea.x, sea.z, 'Abyssaurus', '#a8f0ea'); } }
    const lb = (G.stats.legendBack || {})[G.worldId];
    if (G.world.legend && (G.stats.apex || {}).rex === true && lb !== 'caught' && !(typeof lb === 'number' && lb > (G.dayCount || 0))) { glyph(G.world.legend.x, G.world.legend.z, '✶', '#ff2bd6'); label(G.world.legend.x, G.world.legend.z, G.world.preset.legend.name, '#ffc0f0'); edge(G.world.legend.x, G.world.legend.z, '✶', '#ff2bd6'); }
    for (const e of Wild.list) { if (Math.abs(wd(e.x - p.x)) > S / 2 * bpp || Math.abs(wd(e.z - p.z)) > S / 2 * bpp) continue; dot(e.x, e.z, e.isBoss ? 4 : e.lieutenant ? 3.5 : 2, e.isBoss || e.lieutenant || e.raider ? '#ff3030' : (e.kin.sp.rarity || 0) >= 3 ? '#ffd040' : '#ffb0a0'); }
    const qt = Quests.target(); if (qt) { glyph(qt.x, qt.z, '★', '#ffd040'); if (!(G.world.legend && Math.hypot(qt.x - G.world.legend.x, qt.z - G.world.legend.z) < 4)) edge(qt.x, qt.z, '★', '#ffd040'); }
    const ft = G.world.preset.fisher ? Village.questTarget() : null; if (ft) glyph(ft.x, ft.z, '⚑', '#ff6060');
    if (G.pin) { glyph(G.pin.x, G.pin.z, '◎', '#ffffff'); edge(G.pin.x, G.pin.z, '◎', '#ffffff'); }
    // you: a white arrow pointing where you look (the map is north up)
    const ax = S / 2 - ox / MM.bpp, ay = S / 2 - oz / MM.bpp;
    if (ax > -10 && ay > -10 && ax < S + 10 && ay < S + 10) { ctx.save(); ctx.translate(ax, ay); ctx.rotate(-p.yaw); ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(0, 3); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.stroke(); ctx.restore(); }
    if (big && bpp > 8) { const sx = ax, sy = ay; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText('you', sx, sy + 11); ctx.fillStyle = '#ffffff'; ctx.fillText('you', sx, sy + 11); }
    ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText('N', S / 2, 10);
  }
  // the big map: opened from the HUD, you at the centre, zoom in and out
  const BIG = { cv: null, ctx: null, terrain: null, tx: null, tz: null, t: 0, bpp: 2, size: 480, step: 4, dirty: true };
  const MAPSTEP = () => { BIG.step = BIG.bpp > 8 ? 6 : 4; };
  function renderMap() {
    setTitle('Map');
    el['panel-body'].innerHTML = `<div class="maphead"><button class="btn ghost" id="map-out">−</button><span class="small">${Math.round(BIG.bpp * BIG.size)} blocks across · north up · you are the arrow</span><button class="btn ghost" id="map-in">+</button></div><canvas id="bigmap" width="480" height="480"></canvas><p class="small">Drag the map to look around; tap it to drop a pin, and the compass and the hint line guide you to it. <button class="btn ghost" id="map-centre">Back to me</button> ${G.pin ? '<button class="btn ghost" id="pin-clear">Clear pin</button>' : ''}</p><p class="small"><span style="color:#5ad66a">●</span> village you hold · <span style="color:#ff4040">●</span> held by a tyrant · <span style="color:#d9b36a">●</span> hermit · <span style="color:#ffd040">●</span> someone with a job · <span style="color:#5b9fd0">●</span> Brannock · <span style="color:#ff6a3a">△</span> Indian camp · ⚗ lab · ⌖ den · ✶ legendary · ▲ landing pad · ✦ camp fire · ★ quest · ⚑ fisherman's target · <span style="color:#ff6060">●</span> tyrant and guards · <span style="color:#ffb0a0">●</span> wild Kin</p>`;
    { const rs = (G.stats.roosts || []).filter(r => (r.world || 'earth') === G.worldId); if (rs.length) { const here = G.roostHere();
      el['panel-body'].insertAdjacentHTML('beforeend', `<h4>Train stations</h4><p class="small">${here ? `You are at ${here.name} station.` : 'Board at any station whose line you have fixed.'}</p><div class="roosts">${rs.map(r => { const me = here && here.id === r.id; const c = G.roostCost(r); return `<button class="btn ${me ? 'ghost' : ''}" data-roost="${r.id}" ${!here || me || G.shards < c ? 'disabled' : ''}>${r.name}${me ? ' (here)' : ` · ◆ ${c}`}</button>`; }).join('')}</div>`);
      el['panel-body'].querySelectorAll('[data-roost]').forEach(b => b.addEventListener('click', () => G.flyTo(b.dataset.roost))); } }
    BIG.cv = document.getElementById('bigmap'); BIG.ctx = BIG.cv.getContext('2d'); BIG.dirty = true; BIG.ox = 0; BIG.oz = 0;
    drawMap(BIG, G.player, true);
    // drag to scroll, tap to pin
    BIG.cv.style.touchAction = 'none';
    let drag = null;
    BIG.cv.addEventListener('pointerdown', (ev) => { BIG.cv.setPointerCapture(ev.pointerId); drag = { x: ev.clientX, y: ev.clientY, ox: BIG.ox || 0, oz: BIG.oz || 0, moved: false }; });
    BIG.cv.addEventListener('pointermove', (ev) => { if (!drag) return; const r = BIG.cv.getBoundingClientRect(); const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y; if (Math.hypot(dx, dy) > 8) drag.moved = true; if (!drag.moved) return; const k = BIG.size / r.width * BIG.bpp; BIG.ox = drag.ox - dx * k; BIG.oz = drag.oz - dy * k; const now = performance.now(); if (!BIG.lastDraw || now - BIG.lastDraw > 60) { BIG.lastDraw = now; drawMap(BIG, G.player, true); } });
    BIG.cv.addEventListener('pointerup', (ev) => {
      const d = drag; drag = null; if (!d) return;
      if (d.moved) { drawMap(BIG, G.player, true); return; }
      const r = BIG.cv.getBoundingClientRect(); const sx = (ev.clientX - r.left) / r.width * BIG.size, sy = (ev.clientY - r.top) / r.height * BIG.size; const p = G.player;
      G.pin = { x: Math.round(p.x + (BIG.ox || 0) + (sx - BIG.size / 2) * BIG.bpp), z: Math.round(p.z + (BIG.oz || 0) + (sy - BIG.size / 2) * BIG.bpp) }; drawMap(BIG, G.player, true); toast('Pin set. The compass ◎ and the hint line point to it.', 'good');
    });
    BIG.cv.addEventListener('pointercancel', () => { drag = null; });
    const ctr = document.getElementById('map-centre'); if (ctr) ctr.addEventListener('click', () => { BIG.ox = 0; BIG.oz = 0; drawMap(BIG, G.player, true); });
    const pc = document.getElementById('pin-clear'); if (pc) pc.addEventListener('click', () => { G.pin = null; renderMap(); });
    q('map-in').addEventListener('click', () => { BIG.bpp = Math.max(0.5, BIG.bpp / 2); MAPSTEP(); BIG.dirty = true; drawMap(BIG, G.player, true); q('map-in').parentElement.querySelector('span').textContent = `${Math.round(BIG.bpp * BIG.size)} blocks across · north up · you are the arrow`; });
    q('map-out').addEventListener('click', () => { BIG.bpp = Math.min(36, BIG.bpp * 2); MAPSTEP(); BIG.dirty = true; drawMap(BIG, G.player, true); q('map-out').parentElement.querySelector('span').textContent = `${Math.round(BIG.bpp * BIG.size)} blocks across · north up · you are the arrow`; });
  }
  function setMinimap(on) { MM.on = on; try { localStorage.setItem('stratakin-minimap', on ? '1' : '0'); } catch (e) {} if (MM.cv) MM.cv.classList.toggle('hidden', !on); }
  // ---- compass: cardinal points plus markers for the village, the camp, the quest target and the pad ----
  const CARD = [['N', 0, 'n'], ['E', Math.PI / 2, ''], ['S', Math.PI, ''], ['W', Math.PI * 1.5, '']];
  function renderCompass(p) {
    const tape = document.getElementById('compass-tape'); const W = 240;
    const items = [];
    for (const [t, b, c] of CARD) items.push({ t, b, cls: 'card ' + c });
    const marks = [];
    const home = (G.lastVillage && (G.lastVillage.world || 'earth') === G.worldId) ? G.lastVillage : (G.worldId === 'earth' ? G.village : null); if (home) marks.push({ t: '⌂', x: home.x, z: home.z, title: 'village' });
    const ft = G.world.preset.fisher ? Village.questTarget() : null; if (ft) marks.push({ t: '⚑', x: ft.x, z: ft.z });
    if (G.pin) marks.push({ t: '◎', x: G.pin.x, z: G.pin.z });
    if (G.camp && G.worldId === 'earth') marks.push({ t: '✦', x: G.camp.x, z: G.camp.z });
    if (G.world.pad) marks.push({ t: '▲', x: G.world.pad.x, z: G.world.pad.z });
    const qt = Quests.target(); if (qt) marks.push({ t: '★', x: qt.x, z: qt.z });
    for (const m of Npcs.marks(p)) marks.push({ t: m.t, x: m.x, z: m.z, col: m.col });
    if (G.world.lost && G.stats.lostMap && !G.stats.lostFound) marks.push({ t: '🦖', x: G.world.lost.x, z: G.world.lost.z });
    const wrap = (d) => U.mod(d + WORLD_W / 2, WORLD_W) - WORLD_W / 2;
    for (const m of marks) { const dx = wrap(m.x - p.x), dz = wrap(m.z - p.z); if (Math.hypot(dx, dz) < 6) continue; items.push({ t: m.t, b: Math.atan2(dx, -dz), cls: 'mark', col: m.col }); }
    let html = '';
    for (const it of items) {
      let rel = it.b + p.yaw; while (rel > Math.PI) rel -= Math.PI * 2; while (rel < -Math.PI) rel += Math.PI * 2;
      if (Math.abs(rel) > Math.PI / 2) continue;
      html += `<span class="${it.cls}" style="left:${(W / 2 + rel / (Math.PI / 2) * (W / 2)).toFixed(0)}px${it.col ? ';color:' + it.col : ''}">${it.t}</span>`;
    }
    if (tape.innerHTML !== html) tape.innerHTML = html;
  }
  // ---------- the reveal: what the table just made ----------
  const KIT_HOW = 'Select it in the Bag (Hold), stand on open ground, face where you want it and tap the ground a few steps ahead. The building rises with its door toward you.';
  const GEAR_HOW = { amulet_haste: 'Bag › Amulets › Activate. Any amulet used puts all of them to sleep for four minutes.', amulet_skin: 'Bag › Amulets › Activate before you cross something dangerous.', amulet_focus: 'Bag › Amulets › Activate; the next three fights hit harder.', amulet_hunter: 'Bag › Amulets › Activate; the next three snares catch better.', amulet_mender: 'Bag › Amulets › Activate when your Kin are down and the hut is far.', amulet_shadow: 'Bag › Amulets › Activate to walk past wild Kin and camp guards for a minute.', wings: 'Jump, then jump again in the air: the wings open. Hold ▲ to climb, hold ▼ to come down.', reeffins: 'Wear them (gear is always on): you swim nearly twice as fast and breathe twice as long.', pick: 'Wear it: everything mines twice as fast.', kit_dome: 'In a land village you hold: open the headman\'s ledger and Raise the Moon Dome, or tap the ground inside the walls with the kit in hand.', moonlamp: 'Place it like a torch. It lights twelve blocks, air or no air.', selglass: 'See-through blocks that glow a little. Twenty-four of them go into a Moon Dome kit.', chest: 'Place it, tap it, store what you do not want to lose. Mine it to pick it up again with everything inside.', rod: 'Hold it (Bag › Hold), stand by the water, face it and tap. When the toast says a bite, a bar appears: tap when the marker is inside the glow. Rarer fish run faster and the glow is narrower; a better rod widens it. Bait is used up on each cast.', kit_portal: 'Place it like a block inside a village you hold. Tap the arch to pick any other village of yours, or Brannock\'s shore.', door: 'Place it in a wall gap like a block. Tap it to open or shut. Shut, it counts as wall; raiders have to break it down.', kit_house: KIT_HOW, kit_bakery: KIT_HOW, kit_juice: KIT_HOW, kit_trader: KIT_HOW, kit_voodoo: KIT_HOW, kit_post: KIT_HOW, kit_wall: 'Select it, face along the line you want and tap the ground: seven blocks of wall rise across your view, two high.', kit_wall_stone: 'Same as the wood wall, in stone. Raiders need about three seconds a block instead of two.', kit_wall_iron: 'Same as the wood wall, in iron. Raiders need about ten seconds a block.', kit_bridge: 'Stand at the edge, face across the gap and tap the last block of ground: planks run out ahead until they meet ground, twelve blocks at most.', claw: 'Open the Kin, Put on. One weapon, one armour, one charm per Kin. Comes back to your bag if the Kin is fused.', bulb: 'Wear it (gear is always on). Under water your air lasts two minutes instead of twenty seconds.', glider: 'Hold Jump while falling and you glide. Jump off anything tall.', lavasuit: 'Lava no longer burns: you swim in it. The Core is open to you.', frostcloak: 'Snowfields and mountain tops no longer freeze you.', spacesuit: 'Air and warmth off-world. Now the Moon will not kill you.', torch: 'Hold it to light caves, or place it on a block. Holding it, select it in the Bag.', snare: 'Fight a Kin down, then use it: a timing bar appears; tap when the marker is in the green. Or sneak up behind an unaware Kin and press Set snare.', snare2: 'A stronger snare: a wider green zone. Needed for the rarest Kin.', fusion: 'Place it anywhere and tap it to fuse Kin or craft, wherever you are.', planks: 'Building blocks. Forty of them around a table help found a village.', glass: 'Windows. See-through blocks.', ironwall: 'Wall blocks for a village you found: raiders take far longer to break through.', voidwall: 'The strongest wall blocks there are. They glow.', smoothie: 'Use it from the Bag: every Kin recovers half its health.', bread: 'Use it from the Bag: your own health back to full.' };
  function renderReveal(d) {
    const body = el['panel-body'];
    if (d.kind === 'kin') {
      const k = d.kin; const st = KIN.stats(k); const mv = KIN.moves(k);
      const best = {}; for (const key of KIN.STAT_KEYS) best[key] = Math.max(0, ...d.parents.map(p => KIN.stats(p)[key]));
      const parentMoves = new Set(); for (const p of d.parents) for (const m of KIN.moves(p)) parentMoves.add(m.name);
      const bestLv = Math.max(0, ...d.parents.map(p => p.level));
      setTitle(d.caught ? 'Caught!' : 'A new Kin is born');
      body.innerHTML = `<div class="reveal"><div class="reveal-hero">${portraitHtml(k, 170)}</div><h3>${KIN.name(k)}</h3>
        <div class="small">${d.caught ? d.caught : `Fused from ${d.n} Kin (${d.parents.map(p => KIN.name(p)).join(', ')}) · Lv ${k.level}${bestLv ? ' (best parent Lv ' + bestLv + ')' : ''} · generation g${k.sp.gen || 0}${(k.sp.rarity || 0) > 0 ? ' · ' + KIN.RARITY[k.sp.rarity].name : ''}`}</div>
        <div class="elemmix">${KIN.dominant(k.sp.elem, 3).map(e => `<span class="badge" style="background:${ELEM_COLOR[e]}">${e}</span>`).join('')}</div>
        ${d.caught ? '<h4>Stats</h4>' : '<h4>Against the strongest you put in</h4>'}
        ${KIN.STAT_KEYS.map(key => { const dv = d.caught ? 0 : st[key] - best[key]; return `<div class="stat"><span>${KIN.STAT_NAMES[key]}</span><div class="sbar"><div style="width:${Math.min(100, 100 * st[key] / Math.max(1, Math.max(st[key], best[key]) * 1.15))}%"></div></div><b>${st[key]} <span class="${dv >= 0 ? 'ok' : 'no'}">${dv >= 0 ? '+' : ''}${dv}</span></b></div>`; }).join('')}
        <h4>Moves</h4>${mv.map(m => `<div class="moverow" style="--c:${m.kind === 'util' ? '#8899aa' : ELEM_COLOR[m.elem]}"><b>${m.name}${parentMoves.has(m.name) ? '' : ' <span class="tag">new</span>'}</b><span>${m.kind === 'util' ? m.desc : m.kind + ' · power ' + m.power + ' · ' + Math.round(m.acc * 100) + '% acc'}</span></div>`).join('')}
        ${(k.sp.traits || []).length ? '<h4>Traits</h4>' + k.sp.traits.map(t => `<div class="trait"><b>${t}</b> ${KIN.TRAITS[t]}</div>`).join('') : ''}
        ${k.sp.climber ? '<div class="trait"><b>Climber</b> Ridden, it leaps two blocks at a time and never minds a fall.</div>' : ''}
        <div class="row"><button class="btn big" id="rv-ok">Keep going</button><button class="btn ghost" id="rv-detail">Full details</button></div></div>`;
      drawPortraits(body);
      q('rv-ok').addEventListener('click', () => d.caught ? closePanel() : openPanel('fusion', fusionState && fusionState.table ? { table: fusionState.table } : undefined));
      q('rv-detail').addEventListener('click', () => openPanel('detail', k));
      return;
    }
    if (d.kind === 'statue') {
      setTitle('The table made something');
      body.innerHTML = `<div class="reveal"><div class="reveal-hero"><div class="ico huge" style="background:${d.obj.col}"></div></div><h3>${d.obj.name}</h3><p class="note">${d.obj.desc}</p><p class="small">${d.kin ? KIN.name(d.kin) + ' went into it and is gone; the statue carries its look. ' : ''}It is in your Bag: select it and tap a block to set it down. Mine it to pick it up again, and the table can take it apart.</p><div class="row"><button class="btn big" id="rv-ok">Got it</button></div></div>`;
      q('rv-ok').addEventListener('click', () => { closePanel(); toast(`${d.obj.name} is in your bag. Tap a block to place it.`, 'good'); });
      return;
    }
    const it = ITEMS[d.item];
    setTitle(d.distilled ? 'Distilled' : it.gear ? 'New gear' : 'Crafted');
    body.innerHTML = `<div class="reveal"><div class="reveal-hero"><div class="ico huge" style="background:${it.col}"></div></div><h3>${it.name}${d.n > 1 ? ' ×' + d.n : ''}</h3>
      ${d.mark ? `<div class="small">Marked by ${d.mark}: ${it.gear ? 'it works ' + Math.round((d.power - 1) * 100) + '% better' : 'you got ' + Math.round((d.power - 1) * 100) + '% more'}.</div>` : ''}
      <p class="note">${it.desc}</p>${(() => { const how = GEAR_HOW[d.item] || (it.kinGear ? GEAR_HOW.claw : it.rod ? GEAR_HOW.rod : d.item.startsWith('bait_') ? 'Carry it; the next cast uses one. Void bait beats glow bait beats berry bait when you hold several.' : d.item.startsWith('kit_') ? KIT_HOW : ''); return how ? `<h4>What it does</h4><p class="small">${how}</p>` : ''; })()}${it.gear ? '<p class="small">Gear stays with you even if the wild beats you.</p>' : ''}
      <div class="row"><button class="btn big" id="rv-ok">${d.fromCraft ? 'Back to crafting' : 'Back to the table'}</button><button class="btn ghost" id="rv-close">Close</button></div></div>`;
    q('rv-ok').addEventListener('click', () => d.fromCraft ? openPanel('craft') : openPanel('fusion', fusionState && fusionState.table ? { table: fusionState.table } : undefined));
    q('rv-close').addEventListener('click', closePanel);
  }
  // ---------- portals ----------
  function renderPortal(v) {
    setTitle(`Portal · ${v.name}`);
    const list = Village.portalList(v.id);
    const colOf = (d) => d.type === 'shore' ? '#5b7f95' : d.type === 'pad' ? '#c7fbff' : d.type === 'world' ? (d.world === 'earth' ? '#2f7fe0' : d.world === 'moon' ? '#b4b4bc' : '#d9b464') : d.type === 'sea' ? '#2f6fd6' : d.type === 'deep' ? '#1f3f8a' : d.style === 'alien' ? '#39ff14' : d.style === 'halo' ? '#e8d84a' : d.style === 'frontier' ? '#c98a4f' : '#5fae3f';
    const descOf = (d) => d.type === 'shore' ? 'Old Brannock\'s jetty' : d.type === 'pad' ? 'where the Starship set you down' : d.type === 'world' ? 'another world: you land at its pad, or at home' : d.style === 'atlantis' ? 'a city of the sea people' : d.type === 'sea' ? 'a village on stilts' : d.type === 'deep' ? 'a dome on the sea floor' : d.style === 'alien' ? 'an alien settlement' : d.style === 'frontier' ? 'a frontier town' : d.style === 'halo' ? 'a caravan town' : 'a village';
    el['panel-body'].innerHTML = `<p class="note">The arch hums. Every village under your protection has one, and they all know each other. Beat a world's legendary and the arches reach across the sky. Where to?</p>` + (list.length ? list.map((d, i) => `<div class="shop-row"><div class="ico big" style="background:${colOf(d)}"></div><div class="rinfo"><b>${d.name}</b><div class="small">${descOf(d)}</div></div><button class="btn" data-go="${i}">Go</button></div>`).join('') : '<p class="small">Nowhere yet. Free another village and its arch will answer this one.</p>') + `<div class="row"><button class="btn ghost" id="pt-close">Close</button></div>`;
    el['panel-body'].querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => G.portalTo(list[+b.dataset.go])));
    q('pt-close').addEventListener('click', closePanel);
  }
  // ---------- the village ledger ----------
  function plotHtml(v) {
    const pls = Village.plotsOf(v); if (!pls.length) return ''; const own = G.stats.plots || {}; const free = !G.stats.freeDeed; const price = Village.plotPrice(v);
    return `<h4>Building plots · ${pls.length}</h4><p class="small">Empty plots marked with lamps at the corners${v.type === 'sea' ? ': a pier on stilts at the edge of the village, for building in wood' : ''}. Own one and you can build anything on it, and dig it out again; the guards leave you alone there.${free ? ' <b>Your first deed is a gift.</b>' : ''}</p><div class="roosts">${pls.map(pl => { const mine = own[v.id + ':' + pl.i]; return `<button class="btn ${mine ? 'ghost' : ''}" data-plot="${pl.i}" ${mine ? 'disabled' : ''}>${mine ? 'Plot ' + (pl.i + 1) + ': yours' : 'Plot ' + (pl.i + 1) + ' · ' + (free ? 'free' : '◆ ' + price.toLocaleString())}</button>`; }).join('')}</div>`;
  }
  function renderVillage(v) {
    if (!v) { closePanel(); return; }
    const L = Village.ledger(v); const st = L.st;
    setTitle(`${v.name} · level ${L.lvl}`);
    const prog = L.next ? `<div class="qbar"><div style="width:${Math.round(100 * U.clamp(st.earned / L.next, 0, 1))}%"></div></div><div class="small">◆ ${st.earned} earned of ${L.next} for level ${L.lvl + 1}</div>` : '<div class="small">Top level.</div>';
    const defence = L.def >= L.raid ? `<span class="ok">Holds against raids</span>` : `<span class="no">Would fall to a raid (${Math.round(L.def)} of ${Math.round(L.raid)} needed)</span>`;
    const tyr = Village.levelOf(st) && (L.guards.reduce((a, g) => a + g.power, 0) >= L.need) ? `<span class="ok">Guards can turn the tyrant away</span>` : `<span class="no">The tyrant (Lv ${L.tyrant}) would retake it: guards worth ${Math.round(L.need)} needed, you have ${Math.round(L.guards.reduce((a, g) => a + g.power, 0))}</span>`;
    const guardRows = L.guards.map(g => `<div class="shop-row"><div class="rinfo"><b>${KIN.name(g.k)}</b> <span class="small">Lv ${g.k.level} · strength ${g.power.toFixed(1)}${g.k.hp <= 0 ? ' · <span class="no">fainted</span>' : ''}</span></div><button class="btn ghost" data-recall="${g.i}">Recall</button></div>`).join('');
    let wall = '';
    if (L.wall.founded) wall = `<p class="small">Wall: ${L.wall.name}, built by you (+${L.wall.bonus.toFixed(0)} defence). Stone, Iron Wall or Voidsteel Wall blocks around the edge raise it.</p>`;
    else if (v.type !== 'land') wall = `<p class="small">${L.wall.name} keeps most raiders out (+${L.wall.bonus.toFixed(0)} defence).</p>`;
    else if (L.dome) wall = `<p class="small">Wall: ${L.wall.name}, under a <b>Moon Dome</b>. Nothing gets in: no raid, no tyrant.</p>`;
    else wall = `<p class="small">Wall: ${L.wall.name} (+${L.wall.bonus.toFixed(0)} defence)${L.wall.holes ? `, <span class="no">${L.wall.holes} holes</span>` : ''}.${L.canDome ? ` A Moon Dome kit (crafted from the Moon's selenite and tycho) makes it impenetrable.` : ''}</p>${L.canDome && L.hasDomeKit ? `<div class="row"><button class="btn" data-act="dome">Raise the Moon Dome</button></div>` : ''}<div class="row">${L.wall.holes ? `<button class="btn" data-act="repair">Repair · ◆ ${L.wall.repair}</button>` : ''}${L.wall.next ? `<button class="btn" data-act="wall" ${L.lvl >= L.wall.next.level && L.canPay(L.wall.next.cost) ? '' : 'disabled'}>${L.wall.next.name} wall · ${L.costText(L.wall.next.cost)}${L.lvl < L.wall.next.level ? ' · level ' + L.wall.next.level : ''}</button>` : ''}</div>`;
    let build = '';
    if (L.canExpand) build = `<h4>Grow</h4><p class="small">Push the walls out to make room for more shops. Levels the ground out to the new wall.</p><button class="btn" data-act="expand" ${L.lvl >= L.EXPAND.level && L.canPay(L.EXPAND.cost) ? '' : 'disabled'}>Expand · ${L.costText(L.EXPAND.cost)}${L.lvl < L.EXPAND.level ? ' · level ' + L.EXPAND.level : ''}</button>`;
    else if (L.canBuild) build = `<h4>Build · ${L.slotsLeft} sites left</h4><p class="small">Every shop adds ◆ 5 a day. A second bakery is still a bakery.</p>` + Object.keys(L.SHOP_BUILD).map(k => { const d = L.SHOP_BUILD[k]; const ok = L.slotsLeft > 0 && (!d.level || L.lvl >= d.level) && L.canPay(d.cost); return `<button class="btn ghost" data-build="${k}" ${ok ? '' : 'disabled'}>${d.name} · ${L.costText(d.cost)}${d.level && L.lvl < d.level ? ' · level ' + d.level : ''}</button>`; }).join(' ');
    else if (v.founded) build = `<h4>Grow</h4><p class="small">Build more and hang signs: Ember Ore (bakery), Berry bush (juice bar), Copper (trader), Void Crystal (healer), Iron Ore (trading post). Up to three of each; every sign adds ◆ 5 a day.</p>`;
    el['panel-body'].innerHTML = `<p class="note">Under your protection. Pays ◆ ${L.income} at every dawn (${L.amen} shops); collect from the headman. ${L.hasPost ? 'The trading post restocks every two days.' : ''}</p>${prog}
      <h4>Last night</h4><p class="small">${L.report ? L.report.text : 'Nothing to report yet.'}${L.nightsToTyrant != null ? ` The tyrant returns in ${L.nightsToTyrant} night${L.nightsToTyrant === 1 ? '' : 's'}.` : ''}</p>
      <h4>Defence</h4><p class="small">${defence}<br>${tyr}</p>${wall}
      <h4>Guards · ${L.guards.length}/${L.cap}</h4><p class="small">Your own Kin, left here. They fight raiders at night and the tyrant when he returns, and they level up doing it. A guard that falls needs a Revive Tonic or the hut.</p>${guardRows || '<p class="small">Nobody on the walls.</p>'}
      <div class="row">${L.guards.length < L.cap ? '<button class="btn" id="v-station">Station a Kin</button>' : ''}<button class="btn ghost" id="v-close">Close</button></div>${build}${plotHtml(v)}`;
    el['panel-body'].querySelectorAll('[data-plot]').forEach(b => b.addEventListener('click', () => { if (Village.buyPlot(v, +b.dataset.plot)) renderVillage(v); }));
    el['panel-body'].querySelectorAll('[data-recall]').forEach(b => b.addEventListener('click', () => { if (G.recallGuard(+b.dataset.recall)) renderVillage(v); }));
    el['panel-body'].querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => { if (G.villageAction(v, b.dataset.act)) renderVillage(v); }));
    el['panel-body'].querySelectorAll('[data-build]').forEach(b => b.addEventListener('click', () => { if (G.villageAction(v, 'build', b.dataset.build)) renderVillage(v); }));
    const vs = q('v-station'); if (vs) vs.addEventListener('click', () => { toast('Pick a Kin, then Station as guard.'); openPanel('kin'); });
    q('v-close').addEventListener('click', closePanel);
  }
  function renderShop(shop) {
    if (shop.stock) shop.stock = shop.stock.filter(e => !(e.item && Campaign.locked(e.item))); // quest gear never sits on a shelf before someone has given it to you
    setTitle(`${shop.title} · ${shop.keeper}`);
    const barterRow = (e, i) => { const need = Object.keys(e.barter).map(k => `<span class="${G.player.has(k, e.barter[k]) ? 'ok' : 'no'}">${e.barter[k]} ${ITEMS[k].name} (${G.player.count(k)})</span>`).join(''); return `<div class="shop-row"><div class="ico big" style="background:${ITEMS[e.item].col}"></div><div class="rinfo"><b>${ITEMS[e.item].name}${e.n > 1 ? ' ×' + e.n : ''}</b><div class="small">${ITEMS[e.item].desc}</div><div class="needs">${need}</div></div><button class="btn" data-buy="${i}" ${Object.keys(e.barter).every(k => G.player.has(k, e.barter[k])) ? '' : 'disabled'}>Trade</button></div>`; };
    el['panel-body'].innerHTML = `<p class="note">${shop.greet}</p><p class="small">You have ◆ ${G.shards}.</p>` + (shop.stock.length ? '' : '<p class="small">Sold out until the next delivery.</p>') + shop.stock.map((e, i) => e.barter ? barterRow(e, i) : e.service ? `<div class="shop-row"><div class="ico big" style="background:#a65cff"></div><div class="rinfo"><b>${e.name}</b><div class="small">${G.kin.filter(k => k.hp <= 0).length} fainted, ${G.kin.filter(k => k.hp > 0 && k.hp < KIN.stats(k).hp).length} hurt.</div></div><span class="price">◆ ${e.price}</span><button class="btn" data-buy="${i}" ${G.shards < e.price ? 'disabled' : ''}>Pay</button></div>` : `<div class="shop-row"><div class="ico big" style="background:${ITEMS[e.item].col}"></div><div class="rinfo"><b>${ITEMS[e.item].name}${e.n > 1 ? ' ×' + e.n : ''}</b><div class="small">${e.find ? '<i>A find, ' + e.find + '.</i> ' : ''}${ITEMS[e.item].desc}</div></div><span class="price">◆ ${e.price}</span><button class="btn" data-buy="${i}" ${G.shards < e.price ? 'disabled' : ''}>Buy</button></div>`).join('');
    if (shop.sell) {
      const p = G.player; const goods = [...p.inv.keys()].map(k => [k, Village.sellValue(k)]).filter(([k, v]) => v > 0).sort((a, b) => b[1] * p.count(b[0]) - a[1] * p.count(a[0]));
      el['panel-body'].innerHTML += `<h4>Sell</h4><p class="small">${goods.length ? 'What you carry, and what it fetches apiece.' : 'Nothing in your bag I would pay for.'}</p>` + goods.map(([k, v]) => `<div class="shop-row"><div class="ico big" style="background:${ITEMS[k].col}"></div><div class="rinfo"><b>${ITEMS[k].name} ×${p.count(k)}</b><div class="small">◆ ${v} each</div></div><button class="btn ghost" data-sell1="${k}">Sell 1</button><button class="btn" data-sellall="${k}">All · ◆ ${v * p.count(k)}</button></div>`).join('');
      el['panel-body'].querySelectorAll('[data-sell1]').forEach(b => b.addEventListener('click', () => { const got = Village.sell(b.dataset.sell1, 1); if (got) { sfx('caught'); toast(`Sold for ◆ ${got}.`, 'good'); renderShop(shop); renderHotbar(); } }));
      el['panel-body'].querySelectorAll('[data-sellall]').forEach(b => b.addEventListener('click', () => { const got = Village.sell(b.dataset.sellall, 999); if (got) { sfx('caught'); toast(`Sold the lot for ◆ ${got}.`, 'good'); renderShop(shop); renderHotbar(); } }));
    }
    el['panel-body'].querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => { const e = shop.stock[+b.dataset.buy]; if (Village.buy(shop, e)) { if (!e.service) toast(`${e.barter ? 'Traded for' : 'Bought'} ${ITEMS[e.item].name}.`, 'good'); if (panelOpen === 'shop') renderShop(shop); renderHotbar(); } }));
  }
  // ---------- fusion table (4x4 grid: Kin and items in any mix) ----------
  function foundingHtml(fs) {
    const info = fs.table ? Village.foundingInfo(fs.table) : null;
    if (!info) return '';
    if (info.own) return `<p class="note">The table of ${info.own.name}, your village. Hang more signs over doorways and people will come.</p>`;
    const tick = (ok) => ok ? '✓' : '✗';
    if (info.ok) return `<div class="found"><b>This could be a village.</b><div class="small">Forty planks or logs, a bakery sign, a juice sign and a wall: all here. Name it and people will come.</div><div class="row"><input id="found-name" maxlength="18" placeholder="Village name"><button class="btn" id="found-go">Found it</button></div></div>`;
    return `<div class="found small"><b>Village site</b> · wood ${info.wood}/40 ${tick(info.wood >= 40)} · bakery sign (Ember Ore over a doorway) ${tick(info.amen.bakery)} · juice sign (Berry bush over a doorway) ${tick(info.amen.juice)} · wall ${info.wall}/36 blocks around the edge ${tick(info.wall >= 36)}. Void Crystal adds a healer, Copper a trader, Iron Ore a trading post.</div>`;
  }
  function renderFusion(data) {
    setTitle('Fusion Table');
    if (!fusionState) fusionState = { slots: new Array(16).fill(null), picking: null, preview: null };
    if (data && data.table) fusionState.table = data.table;
    const fs = fusionState; const p = G.player;
    const body = el['panel-body'];
    const kinsIn = fs.slots.filter(s => s && s.kin).map(s => s.kin);
    const itemsIn = fs.slots.filter(s => s && s.item).map(s => s.item);
    const usedItem = (k) => itemsIn.filter(x => x === k).length;
    if (fs.picking != null) {
      const elemItems = Object.keys(ITEMS).filter(k => ITEMS[k].elem && p.count(k) - usedItem(k) > 0);
      const craftItems = Object.keys(ITEMS).filter(k => !ITEMS[k].elem && !ITEMS[k].gear && !ITEMS[k].snare && (!ITEMS[k].crafted || k.startsWith('stone_')) && p.count(k) - usedItem(k) > 0);
      body.innerHTML = `<p class="note">Fill slot ${fs.picking + 1}.</p>` +
        `<div class="ingr">${[...elemItems, ...craftItems].map(k => `<span class="chip" data-add="${k}" style="background:${ITEMS[k].col}">${ITEMS[k].name} ×${p.count(k) - usedItem(k)}${ITEMS[k].elem ? ' → ' + ITEMS[k].elem : ''}</span>`).join('') || '<span class="small">No items in your bag.</span>'}</div>` +
        `<h4>Kin</h4>` + G.kin.filter(k => !kinsIn.includes(k)).map(k => kinCard(k)).join('') + `<button class="btn ghost" id="f-cancel">Cancel</button>`;
      drawPortraits(body);
      body.querySelectorAll('.kcard').forEach(c => c.addEventListener('click', () => { fs.slots[fs.picking] = { kin: G.kin.find(k => k.id == c.dataset.kid) }; fs.picking = null; updatePreview(); renderFusion(); }));
      body.querySelectorAll('[data-add]').forEach(c => c.addEventListener('click', () => { fs.slots[fs.picking] = { item: c.dataset.add }; fs.picking = null; updatePreview(); renderFusion(); }));
      q('f-cancel').addEventListener('click', () => { fs.picking = null; renderFusion(); });
      return;
    }
    const cell = (s, i) => {
      if (!s) return `<div class="fcell empty" data-i="${i}">+</div>`;
      if (s.kin) return `<div class="fcell" data-i="${i}">${portraitHtml(s.kin, 56)}<span class="flv">L${s.kin.level}</span></div>`;
      return `<div class="fcell item" data-i="${i}"><div class="ico big" style="background:${ITEMS[s.item].col}"></div><span class="flv">${ITEMS[s.item].name}</span></div>`;
    };
    const pv = fs.preview;
    let resultHtml = '';
    if (pv) {
      if (pv.kind === 'fusion') resultHtml = `<h4>Result: ${pv.kin.sp.names[0]}, Kindex #${pv.kin.sp.dex}</h4>${kinCard(pv.kin)}<div class="stats">${statBars(pv.kin)}</div>${(pv.kin.sp.traits || []).map(t => `<div class="trait"><b>${t}</b> ${KIN.TRAITS[t]}</div>`).join('')}<p class="small">${pv.n < 6 ? 'Six or more Kin in one fusion grant a trait; twelve grant two. ' : ''}${pv.essNote || ''}</p>`;
      else if (pv.kind === 'statue') resultHtml = `<h4>Result: object</h4><div class="recipe can"><div class="ico big" style="background:${pv.obj.col}"></div><div class="rinfo"><b>${pv.obj.name}</b><div class="small">${pv.obj.desc} Place it anywhere. ${KIN.name(pv.kin)} is consumed.</div></div></div>`;
      else if (pv.kind === 'craft') resultHtml = `<h4>Result: craft</h4><div class="recipe can"><div class="ico big" style="background:${ITEMS[pv.out].col}"></div><div class="rinfo"><b>${ITEMS[pv.out].name}${pv.n > 1 ? ' ×' + pv.n : ''}${pv.mark ? ' · marked by ' + pv.mark : ''}</b><div class="small">${ITEMS[pv.out].desc}${pv.mark ? ` The Kin ${pv.kins.length > 1 ? 'are' : 'is'} consumed: ${ITEMS[pv.out].gear ? 'the gear works ' + Math.round((pv.power - 1) * 100) + '% better' : 'you get ' + Math.round((pv.power - 1) * 100) + '% more'}.` : ''}</div></div></div>${pv.leftover ? `<p class="small">Unused: ${pv.leftover}</p>` : ''}<p class="small">Anything the table makes cannot go back in. Only raw materials, essences and Kin.</p>`;
      else if (pv.kind === 'distill') resultHtml = `<h4>Result: distillation</h4><div class="recipe can"><div class="ico big" style="background:${ITEMS[pv.out].col}"></div><div class="rinfo"><b>${ITEMS[pv.out].name}</b><div class="small">No recipe matches, so the table distils the strongest element out of the mix.</div></div></div>`;
      else resultHtml = `<p class="small">${pv.msg}</p>`;
    }
    const recHtml = (() => { const body = G.worldId; const all = KIN.recipes(body); const known = ((G.stats.recipes || {})[body] || []); const have = (sp) => G.kin.some(k => k.sp.seed === sp.seed); const fk = (rc) => rc.alt && ((G.stats.forks || {})[rc.body + ':' + rc.i]); const ok = (rc) => rc.parts.every(have) && (G.player.has('stone_' + rc.stone) || (rc.alt && G.player.has('stone_' + rc.alt.stone)));
      const stoneTxt = (rc) => { const st = (e) => `${e} Stone${G.player.has('stone_' + e) ? ' ✓' : ''}${e === 'Void' ? ' <span class="darktag">Dark Table</span>' : ''}`; if (!rc.alt) return ' + ' + st(rc.stone); const c = fk(rc); if (c) return ' + ' + st(c === 'alt' ? rc.alt.stone : rc.stone) + ' <i class="small">(your path)</i>'; return `<div class="fork">⑂ ${st(rc.stone)} → <b>${rc.out.names[0]}</b> &nbsp;or&nbsp; ${st(rc.alt.stone)} → <b>${rc.alt.out.names[0]}</b><br><span class="small">A fork: the first stone you use decides it, for good.</span></div>`; };
      const outName = (rc) => { const c = fk(rc); return c === 'alt' ? rc.alt.out.names[0] + ' <span class="small">#' + rc.alt.out.dex + '</span>' : rc.out.names[0] + ' <span class="small">#' + rc.out.dex + '</span>' + (rc.alt && !c ? ' <span class="small">or ' + rc.alt.out.names[0] + '</span>' : ''); };
      return `<h4>Fusion recipes on ${G.world.preset.name} (${known.length} of ${all.length} known)</h4>` + all.filter(rc => known.includes(rc.i)).map(rc => `<div class="recipe ${ok(rc) ? 'can' : ''}"><div class="rinfo"><b>${outName(rc)}</b><div class="needs">${rc.parts.map(sp => `${sp.names[0]}${have(sp) ? ' ✓' : ''} <span style="opacity:.6">(${sp.home ? (sp.home.layer === 'Surface' ? sp.home.biome : sp.home.layer) : 'fusion #' + sp.dex})</span>`).join(' + ')}${stoneTxt(rc)}</div></div></div>`).join('') + (known.length < all.length ? '<p class="note">Quest people teach the rest, one at a time, when you finish their jobs.</p>' : ''); })();
    body.innerHTML = foundingHtml(fs) + `<p class="note">Tap a slot to fill it. A fusion is a recipe: the Kin it names (two, or three or four for the great ones) and the right element stone (stones are crafted from 3 essences and an iron). Items alone craft gear, and essences with berries make tonics.</p>
      <div class="fgrid">${fs.slots.map(cell).join('')}</div>
      ${resultHtml}
      <div class="row"><button class="btn big" id="f-go" ${pv && pv.kind !== 'none' ? '' : 'disabled'}>${pv && pv.kind === 'craft' ? 'Craft' : pv && pv.kind === 'statue' ? 'Make' : pv && pv.kind === 'distill' ? 'Distil' : 'Fuse'}</button><button class="btn ghost" id="f-clear">Clear</button></div>
      ${recHtml}
      <h4>Dismantle</h4>
      <p class="note">Take apart anything the table made and get the raw materials back. A Kin that went into it comes back as Shards (◆ ${G.shards}).</p>
      ${(() => { const list = G.dismantleList(); return list.length ? list.map((d, i) => `<div class="recipe"><div class="ico big" style="background:${d.col}"></div><div class="rinfo"><b>${d.name}${d.n > 1 ? ' ×' + d.n : ''}${d.mark ? ' · marked by ' + d.mark : ''}</b><div class="needs">${Object.keys(d.gives).map(k => `<span class="ok">+${d.gives[k]} ${ITEMS[k].name}</span>`).join('')}${d.shards ? `<span class="ok">+${d.shards} ◆</span>` : ''}</div></div><button class="btn ghost" data-dis="${i}">Dismantle</button></div>`).join('') : '<p class="small">Nothing to dismantle. Placed statues must be picked up first (mine them).</p>'; })()}`;
    drawPortraits(body);
    const fg = document.getElementById('found-go'); if (fg) fg.addEventListener('click', () => { const nm = document.getElementById('found-name').value; const v = G.foundVillage(fs.table, nm); if (v) { closePanel(); } });
    body.querySelectorAll('.fcell').forEach(c => c.addEventListener('click', () => { const i = +c.dataset.i; if (fs.slots[i]) { fs.slots[i] = null; updatePreview(); renderFusion(); } else { fs.picking = i; renderFusion(); } }));
    q('f-clear').addEventListener('click', () => { fs.slots.fill(null); updatePreview(); renderFusion(); });
    body.querySelectorAll('[data-dis]').forEach(b => b.addEventListener('click', () => { const d = G.dismantleList()[+b.dataset.dis]; if (d && G.dismantle(d)) { sfx('break'); toast(`${d.name} taken apart${d.shards ? ': +' + d.shards + ' Shards' : ''}.`, 'good'); fs.slots.fill(null); updatePreview(); renderFusion(); } }));
    q('f-go').addEventListener('click', () => {
      if (!fs.preview || fs.preview.kind === 'none') return;
      const parents = fs.slots.filter(sl => sl && sl.kin).map(sl => sl.kin); const table = fs.table;
      const res = G.fuseGrid(fs.slots);
      const keep = fs.slots.map(sl => (sl && sl.item && sl.item.startsWith('ess_') && (res.kind === 'fusion' || res.kind === 'statue')) ? sl : null);
      fusionState = keep.some(x => x) ? { slots: keep, picking: null, preview: null, table } : null;
      if (!G.stats.revealed) G.stats.revealed = {};
      if (res.kind === 'fusion') { sfx('fuse'); openPanel('reveal', { kind: 'kin', kin: res.kin, parents, n: parents.length }); }
      else if (res.kind === 'statue') { sfx('fuse'); G.player.sel = G.player.hotbar().indexOf('obj:' + res.obj.id); renderHotbar(); const seen = G.stats.revealed.statue = (G.stats.revealed.statue || 0) + 1; if (seen <= 2) openPanel('reveal', { kind: 'statue', obj: res.obj, kin: parents[0] }); else { closePanel(); toast(`${res.obj.name} is in your bag. Tap a block to place it.`, 'good'); } }
      else { sfx('place'); const seen = G.stats.revealed[res.out] = (G.stats.revealed[res.out] || 0) + 1; if (seen <= 2) openPanel('reveal', { kind: 'item', item: res.out, n: res.n, mark: res.mark, power: res.power, distilled: res.kind === 'distill' }); else { toast(`Made ${ITEMS[res.out].name}${res.n > 1 ? ' ×' + res.n : ''}${res.mark ? ', marked by ' + res.mark : ''}.`, 'good'); openPanel('fusion', { table }); } }
    });
  }
  function updatePreview() {
    const fs = fusionState;
    fs.preview = G.previewGrid(fs.slots);
    if (fs.preview && fs.preview.kin) fs.preview.kin.id = fs.preview.kin.id || Math.floor(Math.random() * 1e9);
  }
  // ---------- start screen ----------
  // the start screen: every saved game in a list, the newest first; a new world gets a slot of its own
  function showStart(games, onContinue, onNew) {
    el.start.classList.remove('hidden');
    el['starter-pick'].classList.add('hidden');
    el.how.innerHTML = Controls.isTouch ? 'Phone controls: left thumb walks, right thumb looks. Hold to mine, tap to place.' : 'Keyboard: WASD, mouse, hold click to mine, right click to place. Esc frees the mouse.';
    const WORLD_NAME = { earth: '', moon: 'on the Moon', halo: 'on Halo' };
    const drawList = () => {
      games = Saves.list();
      el['start-buttons'].innerHTML = (games.length ? `<div class="games">${games.map(g => `<div class="game-row"><div class="rinfo"><b>${g.name}</b><div class="small">Lv ${g.level || 1} · ${g.kin || 0} Kin · ◆ ${g.shards || 0} · ${g.villages || 0} village${g.villages === 1 ? '' : 's'}${g.place ? ' · ' + g.place : ''}${WORLD_NAME[g.worldId] ? ' · ' + WORLD_NAME[g.worldId] : ''} · ${Saves.when(g.t)}</div></div><button class="btn" data-cont="${g.id}">Play</button><button class="btn ghost" data-del="${g.id}" title="Delete">✕</button></div>`).join('')}</div>` : '') + `<button class="btn ${games.length ? 'ghost' : 'big'}" id="s-new">New world</button>`;
      el['start-buttons'].querySelectorAll('[data-cont]').forEach(b => b.addEventListener('click', () => onContinue(b.dataset.cont)));
      el['start-buttons'].querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => { if (b.dataset.sure) { Saves.remove(b.dataset.del); drawList(); } else { b.textContent = 'Delete?'; b.dataset.sure = '1'; setTimeout(() => { if (b.isConnected) { b.textContent = '✕'; delete b.dataset.sure; } }, 3000); } }));
      q('s-new').addEventListener('click', startNew);
    };
    const startNew = () => {
      el['start-buttons'].innerHTML = `<div class="row"><label class="small">Name <input id="s-name" placeholder="Game ${games.length + 1}" maxlength="24"></label><label class="small">Seed <input id="s-seed" placeholder="random" maxlength="24"></label></div><button class="btn ghost" id="s-back">Back</button>`;
      el['starter-pick'].classList.remove('hidden');
      const seedOf = () => { const v = q('s-seed').value.trim(); return v ? U.strHash(v) : Math.floor(Math.random() * 2 ** 31); };
      let seed = seedOf();
      const draw = () => {
        const sts = KIN.starters(seed);
        el.starters.innerHTML = sts.map((sp, i) => `<button class="starter" data-i="${i}"><canvas width="96" height="96"></canvas><b>${sp.names[0]}</b><span class="badge" style="background:${ELEM_COLOR[KIN.dominant(sp.elem, 1)[0]]}">${KIN.dominant(sp.elem, 1)[0]}</span><small>${sp.shape}</small></button>`).join('');
        el.starters.querySelectorAll('.starter').forEach((b, i) => { KIN.portrait(b.querySelector('canvas'), sts[i], 1, 96); b.addEventListener('click', () => onNew(seed, i, q('s-name').value)); });
      };
      draw();
      q('s-seed').addEventListener('input', () => { seed = seedOf(); draw(); });
      q('s-back').addEventListener('click', () => { el['starter-pick'].classList.add('hidden'); drawList(); });
    };
    drawList();
    let wantNew = false; try { wantNew = sessionStorage.getItem('stratakin-start') === 'new'; sessionStorage.removeItem('stratakin-start'); } catch (e) {}
    if (wantNew) startNew();
  }
  function showTutorial() {
    const t = document.getElementById('tutorial');
    t.innerHTML = Controls.isTouch
      ? `<b>How to move</b><div class="tut-row"><span class="k">◎</span> Left stick: walk</div><div class="tut-row"><span class="k">↔</span> Drag the right side: look around</div><div class="tut-row"><span class="k">▲</span> Jump (also swims up)</div><div class="tut-row"><span class="k">●</span> Hold a finger on a block: mine it</div><div class="tut-row"><span class="k">·</span> Tap: place the selected item, or use a table</div><div class="tut-row"><span class="k">⌁</span> Wild Kin have a ring. Sneak behind them to ambush.</div><div class="tut-row"><span class="k">▼</span> Hold to go down (ship, wings, ladders). Tap to sneak, tap again to stand.</div><button class="btn" id="tut-ok">Got it</button>`
      : `<b>How to move</b><div class="tut-row"><span class="k">WASD</span> walk · <span class="k">mouse</span> look · <span class="k">Space</span> jump · <span class="k">Shift</span> sneak</div><div class="tut-row"><span class="k">hold click</span> mine · <span class="k">right click</span> place or use</div><div class="tut-row"><span class="k">E</span> craft · <span class="k">Q</span> Kin · <span class="k">J</span> quests · <span class="k">Esc</span> free the mouse</div><div class="tut-row">Wild Kin have a ring. Sneak behind them to ambush.</div><button class="btn" id="tut-ok">Got it</button>`;
    t.classList.remove('hidden');
    const close = () => t.classList.add('hidden');
    q('tut-ok').addEventListener('click', close);
    setTimeout(close, 25000);
  }
  let btnState = { snare: false, ride: false, riding: false, ship: false, flying: false };
  function setButtons(st) {
    const b1 = document.getElementById('btn-snare'), b2 = document.getElementById('btn-ride');
    if (st.snare !== undefined && st.snare !== btnState.snare) { b1.classList.toggle('hidden', !st.snare); btnState.snare = st.snare; }
    if (st.ride !== undefined && (st.ride !== btnState.ride || st.riding !== btnState.riding)) { b2.classList.toggle('hidden', !st.ride); b2.textContent = st.riding ? 'Off' : 'Ride'; b2.classList.toggle('on', !!st.riding); btnState.ride = st.ride; btnState.riding = !!st.riding; }
    const b3 = document.getElementById('btn-ship'); b3.classList.toggle('nomap', !MM.on);
    if (st.ship !== undefined) b3.classList.toggle('far', !!st.flying && !st.canLand);
    if (st.ship !== undefined && (st.ship !== btnState.ship || st.flying !== btnState.flying)) { b3.classList.toggle('hidden', !st.ship); b3.innerHTML = st.flying ? '🛬<small>LAND</small>' : '🚀'; b3.classList.toggle('on', !!st.flying); btnState.ship = st.ship; btnState.flying = !!st.flying; }
  }
  // stars and planets as a cheap overlay: fixed directions projected against the camera
  // each body is a stack of CSS gradients: the night side on top, then clouds, land, seas or bands
  const SHADE = 'radial-gradient(circle at 32% 30%, rgba(0,0,0,0) 52%, rgba(2,2,18,.78) 100%)';
  const EARTH_CSS = [SHADE,
    'radial-gradient(ellipse 60% 13% at 50% 5%, #ffffff 40%, transparent 72%)', 'radial-gradient(ellipse 50% 11% at 50% 96%, #f4f8ff 40%, transparent 72%)',
    'radial-gradient(ellipse 42% 9% at 28% 34%, rgba(255,255,255,.9) 20%, transparent 70%)', 'radial-gradient(ellipse 48% 8% at 62% 58%, rgba(255,255,255,.85) 20%, transparent 70%)', 'radial-gradient(ellipse 30% 7% at 44% 78%, rgba(255,255,255,.8) 20%, transparent 70%)', 'radial-gradient(ellipse 22% 6% at 70% 22%, rgba(255,255,255,.7) 20%, transparent 70%)',
    'radial-gradient(ellipse 20% 28% at 36% 44%, #4f9a3f 56%, transparent 61%)', 'radial-gradient(ellipse 12% 16% at 30% 66%, #6d9a3a 56%, transparent 61%)', 'radial-gradient(ellipse 15% 20% at 68% 38%, #8c7a3c 56%, transparent 61%)', 'radial-gradient(ellipse 13% 22% at 64% 72%, #5fae3f 56%, transparent 61%)', 'radial-gradient(ellipse 9% 9% at 52% 24%, #7a9a3f 56%, transparent 61%)',
    'radial-gradient(circle at 35% 35%, #bfe8ff, #2f7fe0 45%, #1b4d9a 70%, #0a2040)'].join(',');
  const MOON_CSS = [SHADE, 'radial-gradient(circle 8% at 60% 38%, #7a7a84 70%, transparent 76%)', 'radial-gradient(circle 6% at 36% 58%, #80808a 70%, transparent 76%)', 'radial-gradient(circle 5% at 66% 68%, #76767f 70%, transparent 76%)', 'radial-gradient(ellipse 18% 12% at 42% 30%, #8d8d96 60%, transparent 70%)', 'radial-gradient(circle at 35% 35%, #f4f4f8, #b4b4bc 55%, #6c6c76)'].join(',');
  const HALO_CSS = [SHADE, 'repeating-linear-gradient(168deg, rgba(0,0,0,0) 0 7%, rgba(150,110,40,.28) 7% 11%, rgba(0,0,0,0) 11% 16%, rgba(255,240,200,.22) 16% 19%)', 'radial-gradient(ellipse 14% 9% at 62% 58%, #e8c070 60%, transparent 70%)', 'radial-gradient(circle at 35% 35%, #fff2c8, #d9b464 55%, #7a5a22)'].join(',');
  const RUST_CSS = [SHADE, 'radial-gradient(ellipse 30% 10% at 50% 8%, #fff 40%, transparent 70%)', 'radial-gradient(circle 7% at 60% 50%, #7a3a18 60%, transparent 70%)', 'radial-gradient(circle at 35% 35%, #ffb088, #c0552a 60%, #5a2210)'].join(',');
  const PLANETS = {
    earth: [{ name: 'Moon', az: 2.0, el: 0.55, size: 64, css: MOON_CSS }, { name: 'Rust', az: 4.3, el: 0.35, size: 34, css: RUST_CSS }, { name: 'Halo', az: 0.9, el: 0.48, size: 46, css: HALO_CSS, ring: true }],
    moon: [{ name: 'Earth', az: 3.6, el: 0.5, size: 150, css: EARTH_CSS }, { name: 'Rust', az: 5.2, el: 0.3, size: 30, css: RUST_CSS }, { name: 'Halo', az: 1.4, el: 0.6, size: 40, css: HALO_CSS, ring: true }],
    halo: [{ name: 'Earth', az: 2.4, el: 0.42, size: 54, css: EARTH_CSS }, { name: 'Moon', az: 2.55, el: 0.36, size: 16, css: MOON_CSS }, { name: 'Rust', az: 5.0, el: 0.5, size: 40, css: RUST_CSS }, { name: 'Ring', az: 0.0, el: 0.0, size: 0, css: '', band: true }],
  };
  let skyBuilt = null;
  function renderSky(cam, world, rs) {
    const root = document.getElementById('sky'); const id = world.preset.id;
    if (skyBuilt !== id) { skyBuilt = id; root.innerHTML = '<div id="stars"></div>' + (PLANETS[id] || []).map((pl, i) => pl.band ? `<div class="skyband" data-i="${i}"></div>` : `<div class="planet ${pl.ring ? 'ring' : ''}" data-i="${i}" style="width:${pl.size}px;height:${pl.size}px;background:${pl.css}"></div>`).join(''); }
    const night = world.preset.flatDay ? 1 : U.clamp(1 - (rs.day || 0) * 1.4, 0, 1);
    const underground = rs.underwater || rs.inCore || (cam.y < world.topAt(Math.floor(cam.x), Math.floor(cam.z)) - 2);
    const hasBand = (PLANETS[id] || []).some(pl => pl.band);
    root.style.opacity = underground ? 0 : (hasBand ? 1 : night);
    if (underground || (night <= 0 && !hasBand)) return;
    const st0 = document.getElementById('stars'); if (st0) st0.style.opacity = (0.8 * night).toFixed(2);
    const fovy = cam.fov, aspect = window.innerWidth / window.innerHeight, fovx = 2 * Math.atan(Math.tan(fovy / 2) * aspect);
    const W = window.innerWidth, H = window.innerHeight;
    // stars only above the horizon line
    const horizon = H * (0.5 + cam.pitch / fovy);
    const st = document.getElementById('stars'); if (st) st.style.clipPath = `inset(0 0 ${Math.max(0, H - horizon)}px 0)`;
    const occluded = (az, elv) => { // terrain in the way?
      const dx = -Math.sin(az) * Math.cos(elv), dy = Math.sin(elv), dz = -Math.cos(az) * Math.cos(elv);
      for (let t = 2; t < 90; t += 2) { const bx = Math.floor(cam.x + dx * t), by = Math.floor(cam.y + dy * t), bz = Math.floor(cam.z + dz * t); if (by >= WH) return false; if (isSolid(world.getBlock(bx, by, bz))) return true; }
      return false;
    };
    // Halo's ring: a pale arc that crosses the whole sky at a fixed height
    root.querySelectorAll('.skyband').forEach(el => {
      // the ring runs right round the sky at one height, so it is a band across the view wherever you face; it rises as you turn toward its far side
      let d = cam.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      const elv = 0.5 + 0.22 * Math.cos(d); const e = elv - cam.pitch; const cy = H * (0.5 - e / fovy);
      if (Math.abs(e) > fovy * 1.3) { el.style.display = 'none'; return; }
      el.style.display = 'block'; el.style.width = W * 1.5 + 'px'; el.style.left = (-W * 0.25) + 'px'; el.style.top = (cy - 9) + 'px';
      el.style.transform = `rotate(${(Math.sin(d) * 0.12).toFixed(3)}rad)`; el.style.opacity = (0.85 + 0.15 * night).toFixed(2);
    });
    root.querySelectorAll('.planet').forEach(el => {
      const pl = PLANETS[id][+el.dataset.i];
      let d = pl.az - cam.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      const e = pl.el - cam.pitch;
      if (night <= 0.02 || Math.abs(d) > fovx * 0.65 || Math.abs(e) > fovy * 0.7 || occluded(pl.az, pl.el)) { el.style.display = 'none'; return; }
      el.style.display = 'block'; el.style.opacity = night.toFixed(2);
      el.style.left = (W * (0.5 - d / fovx)) - pl.size / 2 + 'px'; el.style.top = (H * (0.5 - e / fovy)) - pl.size / 2 + 'px';
    });
  }
  function lookLabel(t) { const e = document.getElementById('look'); if (e.textContent !== t) e.textContent = t; }
  function hideStart() { el.start.classList.add('hidden'); el.hud.classList.remove('hidden'); document.body.classList.toggle('desktop', !Controls.isTouch); }
  function loading(v) { el.loading.classList.toggle('hidden', !v); }
  return { init, sfx, audio, toast, explain, renderHud, renderMinimap, renderHotbar, openPanel, closePanel, showStart, hideStart, showTutorial, lookLabel, setButtons, renderSky, loading, get panelOpen() { return panelOpen; }, get soundOn() { return soundOn; } };
})();
