'use strict';
// Turn-based battle in the 3D scene with a bottom-sheet UI. Capture is a placed Snare Cube with a timing bar, not a thrown ball.
const Battle = (() => {
  let G = null, active = false, busy = false, wildE = null, wild = null, mine = null, ambush = false, mineE = null, turn = 0;
  let camState = null; const fx = []; let stealth = false, focusOn = false;
  const el = {};
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  function q(id) { return document.getElementById(id); }
  function init(game) {
    G = game;
    el.root = q('battle'); el.wild = q('b-wild'); el.mine = q('b-mine'); el.log = q('b-log'); el.actions = q('b-actions'); el.snare = q('b-snare');
    el.snareGo = q('snare-go'); el.zone = el.snare.querySelector('.snare-zone'); el.marker = el.snare.querySelector('.snare-marker');
    el.snare.addEventListener('click', onSnareGo);
    el.snare.addEventListener('touchstart', (e) => { e.preventDefault(); onSnareGo(); }, { passive: false });
  }
  function buffs() { return { guard: false, focus: false, coil: false, dash: false }; }
  function start(e, isAmbush, opts = {}) {
    if (active) return;
    const party = G.healthyKin();
    if (!party.length) { G.toast('All your Kin are down. Revive them at the Voodoo Hut or with a tonic.'); e.alert = 0; e.wait = 4; if (!e.chase) e.cool = 6; return; }
    if (e.chase) { e.chase = null; e.cool = 0; if (Wild.chaser === e) Wild.chaser = null; }
    active = true; busy = true; wildE = e; wild = e.kin; ambush = isAmbush; turn = 0;
    wild.buffs = buffs(); wild.hp = Math.min(wild.hp, KIN.stats(wild).hp); if (G.seenDex) G.seenDex(wild.sp, "seen");
    mine = G.activeKin() || party[0]; mine.buffs = buffs();
    focusOn = typeof Npcs !== 'undefined' && Npcs.active('focus') && Npcs.useCharge('focus');
    G.onBattleStart(e);
    // own Kin stands between the player and the wild
    placeMine();
    el.root.classList.remove('hidden');
    el.snare.classList.add('hidden');
    el.log.innerHTML = '';
    refresh();
    const n = KIN.name(wild);
    log(isAmbush ? `You caught ${n} off guard!` : `${n} noticed you!`, isAmbush ? 'good' : 'bad');
    if (wild.sp.mythic) log('The Heart stirs. This is the Mythic of the Core.', 'bad');
    if (wildE.isBoss) log(`${n} blocks the square.`, 'bad');
    if (wildE.isLegend) log(`${n}, the legend of this world. Lv ${wild.level}.`, 'bad');
    if (wildE.isApex) log(`${n}. Lv ${wild.level}. Run, or be very, very sure.`, 'bad');
    if (wildE.keepBoss) log(`${n}, the warlord of this hold. Lv ${wild.level}.`, 'bad');
    if (wildE.finalBoss) log(`${n}, left behind to hold you. Lv ${wild.level}. Beat it, or cage a legend.`, 'bad');
    camState = null;
    stealth = !!opts.stealth;
    if (stealth) { el.log.innerHTML = ''; log(`${n} has not seen you. Set the snare before it does.`, 'good'); renderActions(); busy = false; beginSnare(); return; }
    renderActions();
    busy = false;
  }
  function placeMine() {
    const m = KIN.model(mine.sp, mine.stage);
    const p = G.player;
    const dx = wildE.x - p.x, dz = wildE.z - p.z, d = Math.hypot(dx, dz) || 1;
    const px = p.x + dx / d * Math.min(2.0, d * 0.4), pz = p.z + dz / d * Math.min(2.0, d * 0.4);
    const gy = G.world.groundY(Math.floor(px), Math.floor(pz), Math.floor(Math.max(wildE.y, p.y)) + 3);
    mineE = { x: px, y: Math.max(gy + 1, wildE.y - 2), z: pz, yaw: Math.atan2(wildE.x - px, wildE.z - pz), model: m, scale: 1, hover: m.hover, mesh: R.entityMesh(KIN.meshKey(mine.sp, mine.stage), (mb) => KIN.buildMesh(mb, m)), skyMul: wildE.skyMul };
    wildE.yaw = Math.atan2(px - wildE.x, pz - wildE.z);
  }
  function elemBadges(k) {
    return KIN.dominant(k.sp.elem, 2).map(e => `<span class="badge" style="background:${ELEM_COLOR[e]}">${e}</span>`).join('');
  }
  function fillCard(card, k, showXp) {
    const st = KIN.stats(k);
    const rar = KIN.RARITY[k.sp.rarity || 0];
    card.querySelector('.nm').innerHTML = KIN.name(k) + (k.sp.mythic ? ' ✦' : '') + ((k.sp.rarity || 0) > 0 ? ` <span class="rar r${k.sp.rarity}">${rar.name}</span>` : '');
    card.querySelector('.lv').textContent = 'Lv ' + k.level;
    const f = card.querySelector('.hpfill'); const frac = Math.max(0, k.hp / st.hp);
    f.style.width = (frac * 100) + '%'; f.style.background = frac > 0.5 ? '#5ad66a' : frac > 0.22 ? '#f0c040' : '#f05040';
    card.querySelector('.elems').innerHTML = elemBadges(k) + `<span class="hpnum">${Math.max(0, Math.round(k.hp))}/${st.hp}</span>`;
    if (showXp) { const xf = card.querySelector('.xpfill'); if (xf) xf.style.width = (100 * k.xp / KIN.xpToNext(k.level)) + '%'; }
  }
  function refresh() { fillCard(el.wild, wild, false); fillCard(el.mine, mine, true); }
  function log(msg, cls) {
    const d = document.createElement('div'); d.textContent = msg; if (cls) d.className = cls; el.log.appendChild(d);
    while (el.log.children.length > 4) el.log.removeChild(el.log.firstChild);
    el.log.scrollTop = el.log.scrollHeight;
  }
  // which snare this Kin takes: the high flyers only a Flight Snare thrown from the air, the water Kin none at all (that is the rod's job)
  function snareRule() {
    const p = G.player;
    if (wildE && (wildE.kinmaster || wildE.keepBoss || wildE.citadelFirst)) return { list: [], why: 'His Kin will never sit in a cage' };
    if (wildE && wildE.aquatic && !wildE.isApex) return { list: [], why: 'Water Kin slip any cage. Fish them with a rod.' };
    if (wildE && wildE.high) { const air = p.gliding || p.mountMode === 'air'; if (!air) return { list: [], why: 'Only from the air' }; return { list: p.has('snare_sky') ? ['snare_sky'] : [], why: 'Needs a Flight Snare' }; }
    return { list: ['snare2', 'snare'].filter(s => p.has(s)), why: 'No snares' };
  }
  function renderActions() {
    const mv = KIN.moves(mine);
    const rule = snareRule(); const snares = rule.list;
    const bagFull = false; // a full party sends new catches to storage
    let html = '';
    mv.forEach((m, i) => {
      const eff = m.kind === 'util' ? null : KIN.effectiveness(m.elem, wild);
      const tag = eff == null ? '' : eff > 1.25 ? '<i class="eff good">strong</i>' : eff < 0.8 ? '<i class="eff bad">weak</i>' : '';
      const col = m.kind === 'util' ? '#8899aa' : ELEM_COLOR[m.elem];
      html += `<button class="act move ${m.tech ? 'tech' : ''}" data-i="${i}" style="--c:${col}"><b>${m.name}${m.tech ? ' ✦' : ''}</b><small>${m.kind === 'util' ? m.desc : m.kind + ' · ' + m.power + (m.desc ? ' · ' + m.desc : '')}</small>${tag}</button>`;
    });
    const snareLabel = snares.length ? `${ITEMS[snares[0]].name} ×${G.player.count(snares[0])}` : rule.why;
    html += `<button class="act snare" data-a="snare" ${(!snares.length || bagFull) ? 'disabled' : ''}><b>Snare</b><small>${bagFull ? 'Bag full (20). Fuse first.' : snareLabel}</small></button>`;
    const th = G.player.count('tonic_heal');
    html += `<button class="act" data-a="tonic" ${th ? '' : 'disabled'}><b>Tonic</b><small>${th ? 'Heal Tonic ×' + th + ' · costs the turn' : 'no Heal Tonic'}</small></button>`;
    html += `<button class="act" data-a="swap"><b>Swap</b><small>${G.healthyKin().length - 1} ready</small></button>`;
    html += `<button class="act" data-a="run"><b>Run</b><small>leave</small></button>`;
    el.actions.innerHTML = html;
    el.actions.querySelectorAll('button').forEach(b => b.addEventListener('click', onAction));
  }
  function onAction(ev) {
    if (busy || !active) return;
    const b = ev.currentTarget;
    if (b.dataset.i != null) doTurn({ type: 'move', move: KIN.moves(mine)[+b.dataset.i] });
    else if (b.dataset.a === 'snare') beginSnare();
    else if (b.dataset.a === 'tonic') doTurn({ type: 'tonic' });
    else if (b.dataset.a === 'swap') showSwap();
    else if (b.dataset.a === 'run') doTurn({ type: 'run' });
  }
  function dodgeChance(att, def) { const sa = KIN.stats(att), sd = KIN.stats(def); let agi = sd.agi * (def.buffs.coil ? 1.4 : 1); return U.clamp(0.04 + (agi - sa.agi) / (agi + sa.agi) * 0.3, 0.02, 0.4); }
  function damage(att, def, move) {
    const sa = KIN.stats(att), sd = KIN.stats(def);
    const A = (move.kind === 'phys' ? sa.atk : sa.pow) * (att.buffs.focus ? 1.25 : 1);
    const D = move.kind === 'phys' ? sd.atk : sd.pow;
    const eff = KIN.effectiveness(move.elem, def);
    let dmg = A * (move.power / 100) * 1.1 * (A / (A + 0.5 * D)) * eff * (0.85 + Math.random() * 0.15);
    if (att === mine && focusOn) dmg *= 1.25; // the Amulet of Focus
    const crit = Math.random() < (move.crit ? 0.3 : 0.06); if (crit) dmg *= 1.6;
    if (def.buffs.guard && !move.pierce) { dmg *= 0.5; if (def.buffs.guard2) def.buffs.guard2 = false; else def.buffs.guard = false; }
    return { dmg: Math.max(1, Math.round(dmg)), eff, crit };
  }
  async function useMove(att, def, move, attIsMine) {
    const an = KIN.name(att), dn = KIN.name(def);
    if (move.kind === 'util') {
      switch (move.name) {
        case 'Guard': att.buffs.guard = true; log(`${an} braces itself.`); break;
        case 'Focus': att.buffs.focus = true; log(`${an} focuses. Attack and Power rise.`); break;
        case 'Coil': att.buffs.coil = true; log(`${an} coils, ready to slip away.`); break;
        case 'Dash': att.buffs.dash = true; log(`${an} dashes. It will strike first.`); break;
        case 'Mend': { const st = KIN.stats(att); const h = Math.round(st.hp * 0.3); att.hp = Math.min(st.hp, att.hp + h); log(`${an} mends ${h} health.`, 'good'); break; }
        case 'Regrowth': { const st = KIN.stats(att); const h = Math.round(st.hp * 0.5); att.hp = Math.min(st.hp, att.hp + h); log(`${an} regrows ${h} health.`, 'good'); break; }
        case 'Bulwark': att.buffs.guard = true; att.buffs.guard2 = true; log(`${an} raises a bulwark: the next two hits are halved.`); break;
        case 'Tailwind': att.buffs.dash = true; att.buffs.coil = true; log(`${an} rides a tailwind.`); break;
      }
      G.sfx('util'); refresh(); await sleep(650); return;
    }
    if (Math.random() > move.acc || Math.random() < dodgeChance(att, def)) { log(`${an} uses ${move.name}… ${dn} slips aside!`); G.sfx('miss'); await sleep(650); return; }
    const r = damage(att, def, move);
    def.hp = Math.max(0, def.hp - r.dmg);
    { const k = attIsMine ? att : def, slot = attIsMine ? 'weapon' : 'armor'; const id = k.equip && k.equip[slot]; if (id && ITEMS[id] && ITEMS[id].relic) Relics.wear(id, (attIsMine ? 0.008 : 0.011) * (wildE && (wildE.isBoss || wildE.isLegend || wildE.isApex) ? 2 : 1)); } // relics wear as they work
    if (move.drain) { const st = KIN.stats(att); const h = Math.round(r.dmg / 3); att.hp = Math.min(st.hp, att.hp + h); }
    const card = attIsMine ? el.wild : el.mine;
    card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 400);
    const target = attIsMine ? wildE : mineE; if (target) target.hitT = 0.35;
    const src = attIsMine ? mineE : wildE; if (src && target) spawnFx(src, target, move.elem);
    log(`${an} uses ${move.name}: ${r.dmg} damage${r.crit ? ', critical!' : ''}${r.eff > 1.25 ? ' It hits hard!' : r.eff < 0.8 ? ' It barely lands.' : ''}`, attIsMine ? 'good' : 'bad');
    G.sfx(r.eff > 1.25 ? 'hit2' : 'hit'); refresh(); await sleep(700);
  }
  function wildChoose() {
    const mv = KIN.moves(wild); const st = KIN.stats(wild);
    if (wild.hp < st.hp * 0.35 && mv[2].name === 'Mend' && Math.random() < 0.5) return mv[2];
    if (Math.random() < 0.15) return mv[2];
    const score = (m) => m.kind === 'util' ? 0 : m.power * KIN.effectiveness(m.elem, mine);
    const atk = [mv[0], mv[1]].sort((a, b) => score(b) - score(a));
    return Math.random() < 0.75 ? atk[0] : atk[1];
  }
  async function doTurn(action) {
    busy = true; turn++;
    el.actions.querySelectorAll('button').forEach(b => b.disabled = true);
    if (action.type === 'run') {
      const sm = KIN.stats(mine), sw = KIN.stats(wild);
      const p = (wild.sp.mythic || wild.sp.legend) ? 0.9 : U.clamp(0.45 + (sm.spd - sw.spd) / 120, 0.2, 0.9);
      if (Math.random() < p) { log('You slip away.'); await sleep(500); end('ran'); return; }
      log(`${KIN.name(wild)} blocks your escape!`, 'bad'); await sleep(500);
      await useMove(wild, mine, wildChoose(), false);
      return afterTurn();
    }
    if (action.type === 'tonic') {
      if (!G.player.take('tonic_heal', 1)) { busy = false; renderActions(); return; }
      const st = KIN.stats(mine); const h = Math.round(st.hp * 0.6); mine.hp = Math.min(st.hp, mine.hp + h);
      log(`${KIN.name(mine)} drinks a Heal Tonic: +${h}.`, 'good'); G.sfx('util'); refresh(); await sleep(600);
      await useMove(wild, mine, wildChoose(), false);
      return afterTurn();
    }
    if (action.type === 'swap') {
      mine = action.kin; mine.buffs = buffs(); placeMine(); refresh(); log(`Go, ${KIN.name(mine)}!`, 'good'); await sleep(500);
      await useMove(wild, mine, wildChoose(), false);
      return afterTurn();
    }
    const myMove = action.move, theirMove = wildChoose();
    const sm = KIN.stats(mine), sw = KIN.stats(wild);
    let meFirst = (turn === 1 && ambush) || mine.buffs.dash || (!wild.buffs.dash && (sm.spd > sw.spd || (sm.spd === sw.spd && Math.random() < 0.5)));
    mine.buffs.dash = false; wild.buffs.dash = false;
    const order = meFirst ? [[mine, wild, myMove, true], [wild, mine, theirMove, false]] : [[wild, mine, theirMove, false], [mine, wild, myMove, true]];
    for (const [a, d, m, isMine] of order) {
      if (a.hp <= 0) continue;
      await useMove(a, d, m, isMine);
      if (d.hp <= 0) break;
    }
    afterTurn();
  }
  async function afterTurn() {
    refresh();
    if (wild.hp <= 0) { log(`${KIN.name(wild)} is defeated!`, 'good'); G.sfx('win'); await sleep(600); return end('won'); }
    if (mine.hp <= 0) {
      log(`${KIN.name(mine)} is down!`, 'bad'); G.sfx('down'); await sleep(700);
      const next = G.healthyKin();
      if (!next.length) { log('All your Kin are down…', 'bad'); await sleep(900); return end('lost'); }
      busy = false; showSwap(true); return;
    }
    busy = false; renderActions();
  }
  function showSwap(forced) {
    const party = G.healthyKin().filter(k => k !== mine);
    if (!party.length) { if (!forced) G.toast('No other Kin ready.'); return; }
    let html = '<div class="swaplist">' + (forced ? '<p>Choose your next Kin</p>' : '<p>Swap to…</p>');
    party.forEach((k, i) => { const st = KIN.stats(k); html += `<button class="act swapk" data-i="${G.kin.indexOf(k)}"><b>${KIN.name(k)}</b><small>Lv ${k.level} · ${Math.round(k.hp)}/${st.hp}</small></button>`; });
    if (!forced) html += '<button class="act" data-a="back"><b>Back</b></button>';
    html += '</div>';
    el.actions.innerHTML = html;
    el.actions.querySelectorAll('button').forEach(b => b.addEventListener('click', (ev) => {
      if (busy) return;
      const bb = ev.currentTarget;
      if (bb.dataset.a === 'back') return renderActions();
      const k = G.kin[+bb.dataset.i];
      if (forced) { mine = k; mine.buffs = buffs(); placeMine(); refresh(); log(`Go, ${KIN.name(mine)}!`, 'good'); renderActions(); }
      else doTurn({ type: 'swap', kin: k });
    }));
  }
  // ---- snare mini-game ----
  let snareState = null;
  function catchChance() {
    const st = KIN.stats(wild); const frac = wild.hp / st.hp;
    const item = snareRule().list[0] || 'snare';
    let c = stealth ? ITEMS[item].snare * (wildE && wildE.alert < 0.5 ? 0.6 : 0.45) : ITEMS[item].snare * (1 - frac * 0.8);
    if (wild.level > mine.level + 3) c *= 0.75;
    // the level gap: a little above you is fair, 20% above is a long shot, twice your level and nothing holds it
    const grip = 2 * Math.max(1, G.trainerLevel || 1); // snare strength: twice your trainer level, not your Kin's level
    const gap = wild.level / grip;
    if (gap >= 2) return { chance: 0, item, gap, grip, hopeless: true };
    if (gap > 1.2) c *= 0.55 * Math.pow((2 - gap) / 0.8, 3);
    else if (gap > 1) c *= 1 - (gap - 1) * 2.25;
    if (ambush && !stealth) c *= 1.25;
    c *= KIN.RARITY[wild.sp.rarity || 0].catch;
    if (wildE && wildE.isBoss) c *= 0.7;
    if (typeof Npcs !== 'undefined' && Npcs.active('hunter')) c *= 1.5; // the Hunter's Amulet
    if (G.buffMul) c *= G.buffMul('luck');
    if (wild.sp.mythic || wild.sp.legend) c = frac < 0.15 ? Math.min(c, 0.5) : Math.min(c, 0.12);
    return { chance: U.clamp(c, gap > 1.2 ? 0.002 : 0.04, 0.9), item, gap, grip };
  }
  function beginSnare() {
    if (!snareRule().list.length) { log(snareRule().why + '.', 'bad'); renderActions(); busy = false; return; }
    const { chance, item, gap, grip, hopeless } = catchChance();
    if (!G.player.take(item, 1)) return;
    if (typeof Npcs !== 'undefined' && Npcs.active('hunter')) Npcs.useCharge('hunter');
    busy = true;
    el.actions.querySelectorAll('button').forEach(b => b.disabled = true);
    const st = KIN.stats(wild);
    const rar = wild.sp.rarity || 0;
    const width = hopeless ? 0.006 : Math.max(gap > 1.2 ? 0.008 : 0.02, chance * 0.9 * [1, 0.9, 0.75, 0.5, 0.5][rar]);
    const left = 0.05 + Math.random() * (0.9 - width);
    let period = U.clamp(2.3 - st.agi / 110, 0.75, 2.3) * [1, 0.95, 0.85, 0.65, 0.45][rar];
    if (gap > 1.2) period *= U.clamp(1 - (gap - 1.2) * 0.9, 0.25, 1); // a strong Kin fights the cage: the marker races
    if (hopeless) period = 0.08;
    snareState = { width, left, period, hopeless, t0: performance.now(), done: false, hits: 0, need: rar >= 4 ? 3 : rar === 3 ? 2 : 1 };
    el.zone.style.left = (left * 100) + '%'; el.zone.style.width = (width * 100) + '%';
    el.snare.classList.remove('hidden'); el.root.classList.add('snaring'); el.root.scrollTop = 0;
    const pct = chance === 0 ? '0%' : chance < 0.01 ? 'under 1%' : Math.round(chance * 100) + '%';
    log(`You set a ${ITEMS[item].name} on the ground${stealth ? ', quietly' : ''}. Catch chance ${pct}.`);
    if (hopeless) log(`${KIN.name(wild)} is more than twice your snare strength (${grip}, twice your trainer level). No snare made will hold it. Beat it, or come back stronger.`, 'bad');
    else if (gap > 1.2) log(`${KIN.name(wild)} is far above your snare strength (${grip}). It will fight the cage hard.`, 'bad');
    G.sfx('snare');
    requestAnimationFrame(snareFrame);
  }
  function snareFrame() {
    if (!snareState || snareState.done) return;
    const t = (performance.now() - snareState.t0) / 1000 / snareState.period;
    const s = t % 1; const pos = s < 0.5 ? s * 2 : 2 - s * 2;
    snareState.pos = pos;
    el.marker.style.left = (pos * 100) + '%';
    requestAnimationFrame(snareFrame);
  }
  async function onSnareGo() {
    if (!snareState || snareState.done) return;
    snareState.done = true;
    const p = snareState.pos, ok = !snareState.hopeless && p >= snareState.left && p <= snareState.left + snareState.width;
    el.marker.classList.add(ok ? 'ok' : 'bad');
    await sleep(500);
    el.marker.classList.remove('ok', 'bad');
    el.snare.classList.add('hidden'); el.root.classList.remove('snaring');
    if (ok) {
      snareState.hits++;
      if (snareState.hits < snareState.need) {
        log(`The cage holds… ${KIN.name(wild)} strains against it! (${snareState.hits}/${snareState.need})`, 'good'); G.sfx('snare');
        snareState.left = 0.05 + Math.random() * (0.9 - snareState.width); snareState.period *= 0.85; snareState.t0 = performance.now(); snareState.done = false;
        el.zone.style.left = (snareState.left * 100) + '%';
        el.snare.classList.remove('hidden'); el.root.classList.add('snaring'); requestAnimationFrame(snareFrame); return;
      }
      log(`The cage snaps shut. ${KIN.name(wild)} is yours!`, 'good'); G.sfx('caught');
      await sleep(900); return end('caught');
    }
    log(stealth ? `${KIN.name(wild)} breaks free and turns on you!` : `${KIN.name(wild)} breaks free!`, 'bad'); G.sfx('miss'); stealth = false;
    await sleep(500);
    await useMove(wild, mine, wildChoose(), false);
    snareState = null;
    afterTurn();
  }
  function end(result) {
    stealth = false;
    if (camState) { G.player.yaw = camState.yaw; G.player.pitch = Math.max(-0.3, Math.min(0.1, camState.pitch)); }
    active = false; busy = false; snareState = null; camState = null; fx.length = 0;
    el.root.classList.add('hidden'); el.root.classList.remove('snaring');
    if (mine && mine.equip && mine.equip.charm && ITEMS[mine.equip.charm] && ITEMS[mine.equip.charm].relic) Relics.wear(mine.equip.charm, 0.01);
    if (result === 'won' && wildE && wildE.high) { G.player.add('feather', 2); UI.toast('Two Sky Feathers drift down.', 'good'); }
    G.onBattleEnd(result, wildE, wild, mine, ambush);
    wildE = null; mineE = null;
  }
  // ---- particles: a burst of small glowing cubes from attacker to defender ----
  function spawnFx(src, dst, elem) {
    const col = U.hexToRgb(ELEM_COLOR[elem] || '#ffffff');
    const sh = (src.model.height || 1) * (src.model.scale || 1) * 0.6, dh = (dst.model.height || 1) * (dst.model.scale || 1) * 0.5;
    for (let i = 0; i < 10; i++) {
      const t0 = Math.random() * 0.12;
      fx.push({ x: src.x + (Math.random() - 0.5) * 0.4, y: src.y + sh + (Math.random() - 0.5) * 0.4, z: src.z + (Math.random() - 0.5) * 0.4, tx: dst.x + (Math.random() - 0.5) * 0.7, ty: dst.y + dh + (Math.random() - 0.5) * 0.6, tz: dst.z + (Math.random() - 0.5) * 0.7, t: -t0, dur: 0.32 + Math.random() * 0.1, col, size: 0.1 + Math.random() * 0.12, burst: null });
    }
  }
  function fxEntities() {
    const out = [];
    for (const f of fx) {
      if (f.t < 0) continue;
      let x, y, z, size = f.size;
      if (f.t < f.dur) { const u = f.t / f.dur; const arc = Math.sin(u * Math.PI) * 0.8; x = U.lerp(f.x, f.tx, u); y = U.lerp(f.y, f.ty, u) + arc; z = U.lerp(f.z, f.tz, u); }
      else { const u = (f.t - f.dur) / 0.3; if (!f.burst) f.burst = [(Math.random() - 0.5) * 2, Math.random() * 1.5, (Math.random() - 0.5) * 2]; x = f.tx + f.burst[0] * u; y = f.ty + f.burst[1] * u - 2 * u * u; z = f.tz + f.burst[2] * u; size = f.size * (1 - u); }
      const key = 'fx:' + f.col.map(c => Math.round(c * 20)).join(',');
      out.push({ x, y, z, yaw: f.t * 6, scale: Math.max(0.01, size * 6), hover: 0, skyMul: 1, isFx: true, mesh: R.entityMesh(key, (mb) => mb.box(-0.08, -0.08, -0.08, 0.08, 0.08, 0.08, f.col, 1, true)) });
    }
    return out;
  }
  // ---- camera: behind your Kin, looking across at the wild one ----
  function camera(dt, mobile) {
    if (!wildE) return null;
    const me = mineE || { x: G.player.x, y: G.player.y, z: G.player.z, model: { height: 1.8, scale: 1 } };
    const dx = wildE.x - me.x, dz = wildE.z - me.z, d = Math.hypot(dx, dz) || 1;
    const bx = -dx / d, bz = -dz / d; // back direction
    const side = [-bz, bx];
    const mh = me.model.height * (me.model.scale || 1), wh = wildE.model.height * (wildE.model.scale || 1);
    let cx = me.x + bx * 1.4 + side[0] * 2.8, cz = me.z + bz * 1.4 + side[1] * 2.8, cy = me.y + Math.max(1.2, mh * 0.7) + 0.6;
    // keep the camera out of blocks
    for (let i = 0; i < 6 && isSolid(G.world.getBlock(Math.floor(cx), Math.floor(cy), Math.floor(cz))); i++) { cx -= bx * 0.4; cz -= bz * 0.4; cy += 0.3; }
    const lx = (me.x + wildE.x) / 2, lz = (me.z + wildE.z) / 2, ly = (me.y + mh * 0.5 + wildE.y + wh * 0.5) / 2;
    const ddx = lx - cx, ddz = lz - cz, ddy = ly - cy;
    const yaw = Math.atan2(-ddx, -ddz), pitch = Math.atan2(ddy, Math.hypot(ddx, ddz)) - (mobile ? 0.26 : 0.06);
    if (!camState) { const e = G.player.eye(); camState = { x: e.x, y: e.y, z: e.z, yaw: G.player.yaw, pitch: G.player.pitch }; }
    const k = Math.min(1, dt * 5);
    camState.x += (cx - camState.x) * k; camState.y += (cy - camState.y) * k; camState.z += (cz - camState.z) * k;
    let dy = yaw - camState.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    camState.yaw += dy * k; camState.pitch += (pitch - camState.pitch) * k;
    return { x: camState.x, y: camState.y, z: camState.z, yaw: camState.yaw, pitch: camState.pitch };
  }
  function tick(dt) {
    for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.t += dt; if (f.t > f.dur + 0.3) fx.splice(i, 1); }
    if (!active) return;
    if (mineE && mineE.hitT > 0) mineE.hitT -= dt;
    if (wildE && wildE.hitT > 0) wildE.hitT -= dt;
  }
  function abort() { if (!active) return; const e = wildE; end('ran'); if (e) e.cool = 60; } // test hook: walk away from a fight
  return { init, start, tick, camera, fxEntities, spawnFx, abort, get active() { return active; }, get mineEntity() { return mineE; }, get wildEntity() { return wildE; } };
})();
