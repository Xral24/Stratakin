'use strict';
// On-foot combat: people fight people, Kin fight Kin, never both at once.
// The Kinmaster's warriors hold the courtyards of his Holds. You fight them in real time with a sword or an axe in your hand:
// tap to swing, hold to raise your shield (a block just as the blow lands is a parry and staggers them). Your bow works on them too.
// Downed, they kneel dazed; when the hold's warlord falls, the spell breaks and they are themselves again.
// Inside a hold no wild Kin spawn, and while the warlord's Kin duels yours, his warriors stand back.
const Combat = (() => {
  let G = null;
  const foes = [];
  // ---------------- the armoury ----------------
  // materials, weakest to strongest: what each adds and where it turns up
  const MATS = [
    { k: 'wood', name: 'Wooden', col: '#a07a44', t: 0, m: 1.0 }, { k: 'stone', name: 'Stone', col: '#9a9aa0', t: 1, m: 1.35 }, { k: 'copper', name: 'Copper', col: '#c07a4a', t: 2, m: 1.7 },
    { k: 'iron', name: 'Iron', col: '#d8d0c0', t: 3, m: 2.2 }, { k: 'ember', name: 'Emberforged', col: '#ff7a3a', t: 4, m: 2.8, fx: 'burn' }, { k: 'frost', name: 'Rimesteel', col: '#9fe0ff', t: 4, m: 2.8, fx: 'slow' },
    { k: 'gold', name: 'Gilded', col: '#ffd040', t: 5, m: 3.2, fx: 'loot' }, { k: 'void', name: 'Voidsteel', col: '#7a2aa8', t: 6, m: 3.9, fx: 'pierce' }, { k: 'diamond', name: 'Diamond', col: '#9ff6ff', t: 7, m: 4.8 },
    { k: 'star', name: 'Starmetal', col: '#e8f4ff', t: 8, m: 6.0, fx: 'all' },
  ];
  const FX = { burn: 'burns: a little more damage after each hit', slow: 'chills: the struck foe slows', loot: 'gilded: foes drop more shards', pierce: 'voidsteel: half their shield is ignored', all: 'starmetal: burns, chills and pierces' };
  const SWORD_FORMS = [
    { k: 'short', name: 'Shortsword', dmg: 7, cd: 0.42, reach: 2.4 }, { k: 'long', name: 'Longsword', dmg: 10, cd: 0.6, reach: 2.9 },
    { k: 'sabre', name: 'Sabre', dmg: 8, cd: 0.48, reach: 2.7, crit: 0.15 }, { k: 'great', name: 'Greatsword', dmg: 15, cd: 0.95, reach: 3.2 },
  ];
  const AXE_FORMS = [
    { k: 'hand', name: 'Hand Axe', dmg: 9, cd: 0.6, reach: 2.2, arc: 1.3 }, { k: 'battle', name: 'Battleaxe', dmg: 13, cd: 0.85, reach: 2.6, arc: 1.7 },
    { k: 'bearded', name: 'Bearded Axe', dmg: 11, cd: 0.7, reach: 2.5, arc: 1.5, crit: 0.1 }, { k: 'great', name: 'Greataxe', dmg: 19, cd: 1.15, reach: 2.9, arc: 2.0 },
    { k: 'twin', name: 'Twinblade Axe', dmg: 12, cd: 0.65, reach: 2.4, arc: 2.4 },
  ];
  const SHIELD_FORMS = [
    { k: 'buckler', name: 'Buckler', block: 0.45, parry: 0.32, slow: 0.9 }, { k: 'round', name: 'Round Shield', block: 0.6, parry: 0.25, slow: 0.8 },
    { k: 'heater', name: 'Heater Shield', block: 0.68, parry: 0.22, slow: 0.75 }, { k: 'kite', name: 'Kite Shield', block: 0.76, parry: 0.18, slow: 0.65 },
    { k: 'tower', name: 'Tower Shield', block: 0.86, parry: 0.12, slow: 0.5 },
  ];
  // 7 materials x 4 sword forms = 28 swords; 5 materials x 5 axe forms = 25 axes; 5 materials x 5 shield forms = 25 shields
  const SWORD_MATS = ['wood', 'stone', 'copper', 'iron', 'ember', 'frost', 'diamond'], AXE_MATS = ['stone', 'iron', 'gold', 'void', 'star'], SHIELD_MATS = ['wood', 'copper', 'iron', 'void', 'diamond'];
  const GEAR = {}; // id -> spec
  const price = (base, m) => Math.round(base * Math.pow(m, 2.6) / 5) * 5;
  function buildArmoury() {
    const mat = (k) => MATS.find(x => x.k === k);
    for (const mk of SWORD_MATS) for (const f of SWORD_FORMS) { const M = mat(mk); const id = `sw_${mk}_${f.k}`; GEAR[id] = { id, kind: 'sword', name: `${M.name} ${f.name}`, dmg: Math.round(f.dmg * M.m), cd: f.cd, reach: f.reach, arc: 0.9, crit: f.crit || 0.05, fx: M.fx, tier: M.t, col: M.col, price: price(60, M.m) + (f.k === 'great' ? 40 : 0) }; }
    for (const mk of AXE_MATS) for (const f of AXE_FORMS) { const M = mat(mk); const id = `ax_${mk}_${f.k}`; GEAR[id] = { id, kind: 'axe', name: `${M.name} ${f.name}`, dmg: Math.round(f.dmg * M.m), cd: f.cd, reach: f.reach, arc: f.arc, crit: f.crit || 0.05, fx: M.fx, tier: M.t, col: M.col, price: price(75, M.m), chop: M.t >= 3 ? 2 : 1 }; }
    for (const mk of SHIELD_MATS) for (const f of SHIELD_FORMS) { const M = mat(mk); const id = `sh_${mk}_${f.k}`; const b = Math.min(0.95, f.block + M.t * 0.025); GEAR[id] = { id, kind: 'shield', name: `${M.name} ${f.name}`, block: b, parry: f.parry + M.t * 0.01, slow: f.slow, fx: M.fx, tier: M.t, col: M.col, price: price(50, M.m) }; }
    for (const g of Object.values(GEAR)) {
      const fx = g.fx ? ' ' + FX[g.fx].charAt(0).toUpperCase() + FX[g.fx].slice(1) + '.' : '';
      const desc = g.kind === 'shield' ? `Shield: hold to block ${Math.round(g.block * 100)}% of a blow; raise it just as the blow lands to parry. You move at ${Math.round(g.slow * 100)}% speed behind it.${fx}` : `${g.kind === 'axe' ? 'Axe' : 'Sword'}: ${g.dmg} damage, ${(1 / g.cd).toFixed(1)} swings a second, reach ${g.reach}${g.kind === 'axe' ? ', hits everything in a wide arc' + (g.chop ? ' and chops wood' + (g.chop > 1 ? ' fast' : '') : '') : ''}.${fx} Hold it and tap to swing.`;
      ITEMS[g.id] = { name: g.name, col: g.col, melee: g.kind !== 'shield', shield: g.kind === 'shield', keep: true, tier: g.tier, desc };
    }
  }
  // your armour: four pieces, eight materials. The best piece you own in each slot is worn automatically.
  // Armour points turn into damage taken off: 20 points halves it. Some materials carry a little extra.
  const ARM_MATS = [
    { k: 'padded', name: 'Padded', col: '#b8a47a', t: 0, pts: 1 }, { k: 'copper', name: 'Copper', col: '#c07a4a', t: 2, pts: 2 }, { k: 'iron', name: 'Iron', col: '#d8d0c0', t: 3, pts: 3 },
    { k: 'rime', name: 'Rimesteel', col: '#9fe0ff', t: 4, pts: 4, perk: 'cold', perkTxt: 'keeps the cold off' }, { k: 'ember', name: 'Emberforged', col: '#ff7a3a', t: 4, pts: 4, perk: 'fire', perkTxt: 'shrugs off burns and lava a little longer' },
    { k: 'void', name: 'Voidsteel', col: '#7a2aa8', t: 6, pts: 6, perk: 'arrow', perkTxt: 'turns arrows' }, { k: 'diamond', name: 'Diamond', col: '#9ff6ff', t: 7, pts: 8 }, { k: 'star', name: 'Starmetal', col: '#e8f4ff', t: 8, pts: 10, perk: 'heart', perkTxt: 'the full set gives you two extra hearts' },
  ];
  const ARM_SLOTS = [{ k: 'helm', name: 'Helm', mul: 0.8 }, { k: 'chest', name: 'Breastplate', mul: 1.6 }, { k: 'legs', name: 'Greaves', mul: 1.2 }, { k: 'boots', name: 'Boots', mul: 0.6 }];
  const ARMOUR = {};
  function buildArmour() {
    for (const M of ARM_MATS) for (const S of ARM_SLOTS) {
      const id = `ar_${M.k}_${S.k}`; const pts = Math.max(1, Math.round(M.pts * S.mul * 1.5));
      ARMOUR[id] = { id, slot: S.k, mat: M.k, pts, perk: M.perk, tier: M.t, col: M.col, name: `${M.name} ${S.name}`, price: price(45, 1 + M.t * 0.42) };
      ITEMS[id] = { name: `${M.name} ${S.name}`, col: M.col, keep: true, armour: S.k, tier: M.t, desc: `Your armour (${S.name.toLowerCase()}): ${pts} armour points. The best piece you own in each slot is worn automatically.${M.perkTxt ? ' ' + M.name + ' ' + M.perkTxt + '.' : ''}` };
    }
  }
  function worn() { const out = {}; for (const k of G.player.inv.keys()) { const a = ARMOUR[k]; if (a && !broken(k) && (!out[a.slot] || a.pts > out[a.slot].pts)) out[a.slot] = a; } return out; }
  function armourPts() { const w = worn(); return Object.values(w).reduce((s, a) => s + a.pts, 0); }
  function wornPerk(perk, all) { const w = Object.values(worn()); return all ? w.length === 4 && w.every(a => a.perk === perk) : w.filter(a => a.perk === perk).length; }
  function armourCut(n, cause) {
    if (!['warrior', 'kin', 'fall', 'lava', 'cold', 'spear'].includes(cause)) return n;
    let pts = armourPts() + (G.buffOn && G.buffOn('ward') ? G.buffOn('ward').amt : 0); if (cause === 'warrior' && G.player.lastArrow && wornPerk('arrow')) pts += 4 * wornPerk('arrow');
    if (cause === 'lava') pts = wornPerk('fire') * 6; if (cause === 'cold') pts = wornPerk('cold') * 6;
    if (['warrior', 'kin', 'spear'].includes(cause)) for (const a of Object.values(worn())) use(a.id, 1);
    const keep = 20 / (20 + pts); const r = n * keep; return Math.floor(r) + (Math.random() < r - Math.floor(r) ? 1 : 0);
  }
  // arrows: eight kinds, each with its own trick
  const ARROWS = {
    arrow: { dmg: 10, name: 'Arrow' },
    arrow_ember: { dmg: 13, burn: 6, name: 'Ember Arrow' },
    arrow_frost: { dmg: 10, slow: 4, name: 'Frost Arrow', col: '#9fe0ff', kin: 0.24, desc: 'Chills: a struck warrior slows for four seconds. On a wild Kin, a quarter of its health and it forgets you for a moment.', needs: { wood: 1, snow: 2, frond: 1 }, n: 4 },
    arrow_spark: { dmg: 8, stun: 1.6, name: 'Spark Arrow', col: '#ffe94a', kin: 0.2, desc: 'Stuns a warrior for a second and a half. On a wild Kin, a fifth of its health.', needs: { wood: 1, copper: 1, frond: 1 }, n: 4 },
    arrow_barbed: { dmg: 9, bleed: 8, name: 'Barbed Arrow', col: '#c04040', kin: 0.26, desc: 'Barbed: keeps hurting a warrior for a few seconds. On a wild Kin, a quarter of its health.', needs: { wood: 1, iron: 1, frond: 1 }, n: 5 },
    arrow_heavy: { dmg: 18, knock: 2.5, shieldBreak: true, name: 'Heavy Arrow', col: '#6a6a72', kin: 0.3, desc: 'Heavy: knocks a warrior back and goes through a raised shield. On a wild Kin, nearly a third of its health.', needs: { wood: 1, iron: 2, stone: 1 }, n: 4 },
    arrow_sleep: { dmg: 2, sleep: true, name: 'Sleep Dart', col: '#b0a0ff', kin: 0.05, desc: 'Drops a warrior who has not seen you straight to his knees. On a wild Kin, it does little harm but it forgets you were there.', needs: { wood: 1, berry: 3, glowworm: 1 }, n: 3 },
    arrow_void: { dmg: 22, pierce: true, name: 'Void Arrow', col: '#7a2aa8', kin: 0.4, desc: 'Void-tipped: ignores shields entirely. On a wild Kin, two fifths of its health. Made only at a Dark Fusion Table.', needs: { wood: 1, void: 1, frond: 1 }, n: 3 },
  };
  // ---------------- wear: blades, spears, bows, shields and armour all wear out and need mending ----------------
  const BOWS = { bow: { life: 170, price: 120 }, bow_painted: { life: 90, price: 60 }, raygun: { life: 260, price: 700, ray: true } }; /* the Moon garrison's sidearm: needs no arrows, and is the one you reach for once you have it */
  ARROWS.ray = { dmg: 15, stun: 0.5, name: 'Ray' };
  const TOOLS = { shovel: { life: 400, price: 40 }, hatchet: { life: 260, price: 40 }, axe_iron: { life: 600, price: 140 }, pick_iron: { life: 520, price: 160 }, pick: { life: 1300, price: 650 } }; // the stone pick and the rods never wear
  function lifeOf(id) { const g = GEAR[id], a = ARMOUR[id], b = BOWS[id] || TOOLS[id]; if (b) return b.life; if (a) return 70 + a.tier * 35; if (g) return g.kind === 'shield' ? 60 + g.tier * 30 : 90 + g.tier * 45; return 0; }
  function priceOf(id) { const g = GEAR[id], a = ARMOUR[id], b = BOWS[id] || TOOLS[id]; return (b && b.price) || (g && g.price) || (a && a.price) || 60; }
  const wearMap = () => { if (!G.stats.gwear) G.stats.gwear = {}; return G.stats.gwear; };
  function cond(id) { const L = lifeOf(id); if (!L) return 1; return Math.max(0, 1 - (wearMap()[id] || 0) / L); }
  const broken = (id) => lifeOf(id) > 0 && cond(id) <= 0;
  function use(id, n) {
    const L = lifeOf(id); if (!L || !G.player.has(id)) return; const before = cond(id); const m = wearMap(); m[id] = Math.min(L, (m[id] || 0) + (n || 1)); const after = cond(id); const nm = (ITEMS[id] || {}).name || id;
    if (after <= 0 && before > 0) { UI.toast(`Your ${nm} has broken. Take it to ${ARMOUR[id] || (GEAR[id] && GEAR[id].kind === 'shield') ? 'an armourer' : TOOLS[id] ? 'a trader or an armoury' : 'an armoury'} to have it mended.`, 'bad'); UI.sfx('hurt'); }
    else if (after <= 0.2 && before > 0.2) UI.toast(`Your ${nm} is wearing thin. Get it mended before it goes.`, 'bad');
    if (UI.renderHotbar) UI.renderHotbar();
  }
  function bow() { const p = G.player; let best = null; for (const k in BOWS) if (p.has(k) && !broken(k) && (!best || BOWS[k].life > BOWS[best].life)) best = k; return best; }
  function anyBow() { return Object.keys(BOWS).some(k => G.player.has(k)); }
  // what the smith wants: cheap while it is only scuffed, steep once it has broken
  function mendList(what) { const p = G.player; const out = []; for (const k of p.inv.keys()) { const L = lifeOf(k); if (!L) continue; const isArm = !!(ARMOUR[k] || (GEAR[k] && GEAR[k].kind === 'shield')); if ((what === 'armour') !== isArm) continue; if (what === 'tools' && !TOOLS[k]) continue; const c = cond(k); if (c >= 0.999) continue; const miss = 1 - c; out.push({ id: k, c, cost: Math.max(5, Math.round((priceOf(k) * 0.5 * Math.pow(miss, 1.3) + (c <= 0 ? priceOf(k) * 0.3 : 0)) / 5) * 5) }); } return out; }
  function mendQuote(what) { return mendList(what).reduce((s, x) => s + x.cost, 0); }
  function mend(what) { const L = mendList(what); if (!L.length) { UI.toast('Nothing of yours needs mending.'); return false; } const cost = L.reduce((s, x) => s + x.cost, 0); if (G.shards < cost) { UI.toast(`Mending all of it comes to ${cost} shards.`, 'bad'); return false; } G.shards -= cost; const m = wearMap(); for (const x of L) delete m[x.id]; UI.sfx('caught'); UI.toast(`Mended: ${L.map(x => (ITEMS[x.id] || {}).name).join(', ')}. Good as new.`, 'good'); if (UI.renderHotbar) UI.renderHotbar(); return true; }
  function init(game) {
    G = game; buildArmoury(); buildArmour();
    GEAR.sp_painted = { id: 'sp_painted', kind: 'spear', name: 'Indian Spear', dmg: 9, cd: 0.7, reach: 3.8, arc: 0.6, crit: 0.08, tier: 1, col: '#b0603a', price: 90 };
    ITEMS.sp_painted = { name: 'Indian Spear', col: '#b0603a', melee: true, keep: true, tier: 1, desc: 'An Indian spear: 9 damage, the longest reach of anything you can hold (3.8). Hits one foe at a time. Plain, and it wears out quicker than forged steel.' };
    // Atlantis: tidesteel. The spear has a head of standing lightning; the trident is the Tidewardens' own, the one thing that cuts a Binding
    GEAR.sp_storm = { id: 'sp_storm', kind: 'spear', name: 'Stormtide Spear', dmg: 40, cd: 0.6, reach: 4.2, arc: 0.7, crit: 0.12, fx: 'slow', tier: 6, col: '#3fd4ff', price: 4800 };
    ITEMS.sp_storm = { name: 'Stormtide Spear', col: '#3fd4ff', melee: true, keep: true, tier: 6, desc: 'Atlantean tidesteel with a head of standing lightning: 40 damage, reach 4.2, and quick for a spear. What it strikes is jolted and slows. Hold it and tap to thrust.' };
    GEAR.sp_trident = { id: 'sp_trident', kind: 'spear', name: 'Poseidon\'s Trident', dmg: 62, cd: 0.7, reach: 4.4, arc: 1.3, crit: 0.15, fx: 'all', tier: 8, col: '#7af0ff', price: 20000 };
    ITEMS.sp_trident = { name: 'Poseidon\'s Trident', col: '#7af0ff', melee: true, keep: true, tier: 8, desc: 'Three tines, each tipped with a piece of a different world. 62 damage, reach 4.4, and it takes everything in front of you at once. It burns, chills and goes through shields. It is the one thing that cuts a Binding.' };
    ITEMS.bow_painted = { name: 'Indian Bow', col: '#9a6a3a', keep: true, bow: true, desc: 'A plain Indian hunting bow. Shoots like any bow, but it wears out about twice as fast as a good one.' };
    for (const k in ARROWS) { const a = ARROWS[k]; if (!ITEMS[k]) ITEMS[k] = { name: a.name, col: a.col, arrow: a.kin, crafted: true, desc: a.desc }; if (a.needs && !RECIPES.find(r => r.id === k)) RECIPES.push({ id: k, out: k, n: a.n, needs: a.needs }); }
    // a few simple forge recipes so every early tier can be made, not only bought
    const forge = [['ar_padded_helm', { frond: 4, wood: 1 }], ['ar_padded_chest', { frond: 8, wood: 2 }], ['ar_padded_legs', { frond: 6, wood: 1 }], ['ar_padded_boots', { frond: 3, wood: 1 }], ['ar_iron_helm', { iron: 4 }], ['ar_iron_chest', { iron: 8 }], ['ar_iron_legs', { iron: 6 }], ['ar_iron_boots', { iron: 3 }], ['sw_wood_short', { wood: 4 }], ['sh_wood_buckler', { planks: 4 }], ['sw_stone_short', { wood: 1, stone: 4 }], ['sh_wood_round', { planks: 6, iron: 1 }], ['sw_iron_long', { wood: 1, iron: 5 }], ['ax_iron_hand', { wood: 2, iron: 4 }], ['sh_iron_heater', { iron: 6, planks: 2 }]];
    for (const [id, needs] of forge) if (!RECIPES.find(r => r.id === id)) RECIPES.push({ id, out: id, n: 1, needs, cat: 'arms' });
    if (typeof HOTBAR_ORDER !== 'undefined') { const melee = Object.values(GEAR).filter(g => g.kind !== 'shield').map(g => g.id); const at = Math.max(1, HOTBAR_ORDER.indexOf('torch') + 1); for (const k of melee.reverse()) if (!HOTBAR_ORDER.includes(k)) HOTBAR_ORDER.splice(at, 0, k); if (!HOTBAR_ORDER.includes('bow')) HOTBAR_ORDER.splice(at, 0, 'bow'); if (!HOTBAR_ORDER.includes('bow_painted')) HOTBAR_ORDER.splice(at + 1, 0, 'bow_painted'); }
    if (typeof HOTBAR_ORDER !== 'undefined') for (const k of ['arrow_frost', 'arrow_spark', 'arrow_barbed', 'arrow_heavy', 'arrow_sleep', 'arrow_void']) if (!HOTBAR_ORDER.includes(k)) HOTBAR_ORDER.push(k);
  }
  // what a village trader keeps on the rack: a few pieces, never far above what that village could make
  const pool0 = () => Object.keys(GEAR).length > 0;
  function armoury(v) {
    const tier = Math.min(8, 1 + (v ? v.tier || 0 : 0) * 2); const seed = v ? Math.abs(String(v.id).length * 31 + (v.x | 0)) + 1 : 1; if (!pool0()) return [];
    const pool = Object.values(GEAR).filter(g => g.kind !== 'spear' && g.tier <= tier && g.tier >= tier - 3);
    const out = []; for (let i = 0; i < Math.min(5, pool.length); i++) { const g = pool[U.mod(Math.abs(seed) * (i + 7) * 13, pool.length)]; if (!g) continue; if (!out.some(o => o.item === g.id)) out.push({ item: g.id, price: g.price }); }
    const ap = Object.values(ARMOUR).filter(a => a.tier <= tier && a.tier >= tier - 3); for (let i = 0; i < Math.min(3, ap.length); i++) { const a = ap[U.mod(Math.abs(seed) * (i + 3) * 17, ap.length)]; if (a && !out.some(o => o.item === a.id)) out.push({ item: a.id, price: a.price }); }
    const arrows = ['arrow_frost', 'arrow_spark', 'arrow_barbed', 'arrow_heavy'].slice(0, 1 + Math.min(3, (v && v.tier) || 0));
    for (const a of arrows) out.push({ item: a, price: 6 + ARROWS[a].dmg, n: 4 });
    return out;
  }
  // each shop keeps its own rack: weapons at the armoury, armour and shields at the armourer, arrows at the alchemist; a village trader has a little of everything
  function rack(v, kind) {
    const size = v && v.size; const tier = Math.min(8, 1 + (v ? v.tier || 0 : 0) * 2 + (size === 'city' ? 2 : 0)); const seed = v ? Math.abs(String(v.id).length * 31 + (v.x | 0)) + 1 : 1;
    const pick = (list, n, salt) => { const out = []; for (let i = 0; i < n * 3 && out.length < Math.min(n, list.length); i++) { const g = list[U.mod(seed * (i + salt) * 13 + i, list.length)]; if (g && !out.includes(g)) out.push(g); } return out; };
    const near = (L) => L.filter(g => g.tier <= tier && g.tier >= tier - 3);
    const mendE = (what) => { const L = mendList(what); return { service: 'mend', what, name: L.length ? `Mend your ${what === 'armour' ? 'armour and shields' : what === 'tools' ? 'tools' : 'blades, bows and tools'} (${L.length} worn${L.some(x => x.c <= 0) ? ', some broken' : ''})` : `Mending: nothing of yours needs it`, price: mendQuote(what) }; };
    if (kind === 'armoury') return [mendE('arms')].concat(pick(near(Object.values(GEAR).filter(g => g.kind !== 'shield' && g.kind !== 'spear')), size === 'city' ? 8 : 5, 7).map(g => ({ item: g.id, price: g.price })));
    if (kind === 'armourer') return [mendE('armour')].concat(pick(near(Object.values(ARMOUR)), size === 'city' ? 6 : 4, 3).map(a => ({ item: a.id, price: a.price })), pick(near(Object.values(GEAR).filter(g => g.kind === 'shield')), 3, 11).map(g => ({ item: g.id, price: g.price })));
    if (kind === 'trader') return [mendE('tools')].concat(armoury(v));
    if (kind === 'armoury') return pick(near(Object.values(GEAR).filter(g => g.kind !== 'shield')), size === 'city' ? 8 : 5, 7).map(g => ({ item: g.id, price: g.price }));
    if (kind === 'armourer') return pick(near(Object.values(ARMOUR)), size === 'city' ? 6 : 4, 3).map(a => ({ item: a.id, price: a.price })).concat(pick(near(Object.values(GEAR).filter(g => g.kind === 'shield')), 3, 11).map(g => ({ item: g.id, price: g.price })));
    if (kind === 'alchemist') { const order = ['arrow', 'arrow_frost', 'arrow_spark', 'arrow_barbed', 'arrow_heavy', 'arrow_sleep', 'arrow_ember']; return order.slice(0, 3 + Math.min(4, tier)).map(a => ({ item: a, price: 4 + (ARROWS[a] || ARROWS.arrow).dmg, n: 6 })); }
    return [];
  }
  // ---------------- what you hold ----------------
  const weapon = () => { const k = G.player.selected(); return k && GEAR[k] && GEAR[k].kind !== 'shield' && !broken(k) ? GEAR[k] : null; };
  function shield() { let best = null; for (const k of G.player.inv.keys()) { const g = GEAR[k]; if (g && g.kind === 'shield' && !broken(k) && (!best || g.block > best.block)) best = g; } return best; }
  function chopTier() { let t = 0; for (const k of G.player.inv.keys()) { const g = GEAR[k]; if (g && g.chop) t = Math.max(t, g.chop); } return t; }
  // ---------------- the warriors ----------------
  const KINDS = {
    guard: { name: 'Bound Guard', hp: 40, dmg: 1, speed: 2.6, reach: 1.9, wind: 0.6, rest: 1.1, deco: 'sword', cols: { body: '#3a3448', belly: '#c9b48a', accent: '#7a2aa8' } },
    axeman: { name: 'Bound Axeman', hp: 55, dmg: 2, speed: 2.2, reach: 2.0, wind: 0.85, rest: 1.4, deco: 'axe', cols: { body: '#2e2a3a', belly: '#a8835a', accent: '#5a2a8a' } },
    shield: { name: 'Bound Shieldbearer', hp: 50, dmg: 1, speed: 2.0, reach: 1.8, wind: 0.7, rest: 1.2, deco: 'shield', block: 0.7, cols: { body: '#40384a', belly: '#e0b08a', accent: '#8a3ab8' } },
    archer: { name: 'Bound Archer', hp: 32, dmg: 1, speed: 2.4, reach: 13, wind: 1.0, rest: 1.8, deco: 'bow', archer: true, cols: { body: '#33303e', belly: '#d8b090', accent: '#6a2a9a' } },
    brute: { name: 'Bound Brute', hp: 120, dmg: 3, speed: 1.7, reach: 2.3, wind: 1.15, rest: 1.7, deco: 'maul', big: 1.22, cols: { body: '#2a2434', belly: '#b8926a', accent: '#6a2a9a' } },
    lancer: { name: 'Bound Lancer', hp: 48, dmg: 2, speed: 2.9, reach: 3.0, wind: 0.75, rest: 1.3, deco: 'lance', cols: { body: '#34304a', belly: '#d8b090', accent: '#9a3ac8' } },
    hexer: { name: 'Bound Hexer', hp: 36, dmg: 2, speed: 2.0, reach: 12, wind: 1.3, rest: 2.2, deco: 'staff', archer: true, hex: true, cols: { body: '#2a1640', belly: '#c9b48a', accent: '#b026ff' } },
    trooper: { name: 'Garrison Trooper', hp: 36, dmg: 1, speed: 2.6, reach: 15, wind: 0.85, rest: 1.5, deco: 'raygun', archer: true, ray: true, glow: '#7df0ff', cols: { body: '#c9d0dc', belly: '#8a93a6', accent: '#2a3348' } },
    tshield: { name: 'Garrison Shield', hp: 64, dmg: 1, speed: 2.1, reach: 1.8, wind: 0.7, rest: 1.2, deco: 'shield', block: 0.7, glow: '#7df0ff', cols: { body: '#aab2c2', belly: '#8a93a6', accent: '#2a3348' } },
    captain: { name: 'Bound Captain', hp: 90, dmg: 2, speed: 2.5, reach: 2.2, wind: 0.65, rest: 1.0, deco: 'captain', block: 0.5, cols: { body: '#241c30', belly: '#c9b48a', accent: '#b026ff' } },
  };
  /* The Kinmaster's bound warriors, drawn as soldiers and not as boxes: a helm for each trade, plate at the chest and shoulders, a violet light in the
     eye slit, and the weapon in the hand that swings it (it rides the arm, so a blow is a blow). Seven of them now: the brute, the hexer and the lancer hold the keep's upper floors. */
  function warriorModel(kind, freed) {
    const K = KINDS[kind]; const glow = freed ? '#ffe08a' : (K.glow || '#c04cff'), steel = '#4a4a5a', dsteel = '#2c2c38', lsteel = '#8a8a9c', wood = '#6b4a2b', ac = K.cols.accent;
    const sp = { build: ({ axeman: 'stout', brute: 'stout', archer: 'slim', hexer: 'slim', lancer: 'slim' })[kind] || 'man', hairVar: ({ guard: 1, axeman: 2, archer: 3, captain: 0 })[kind] || 0, hair: '#1a1018', shape: 'human', feat: { crest: false, ears: false, horns: false, spikes: false, tail: false, wings: false, bigEyes: false }, colors: Object.assign({ dark: '#120818', eye: glow }, K.cols), size: 1, gen: 0, names: ['warrior'] };
    const m = KIN.model(sp, 2); const H = KIN.partHelpers(m); const { blob, ball, tube, plate, ring, cone } = H; const G1 = { emis: true };
    const hooded = kind === 'archer' || kind === 'hexer';
    /* head */
    H.bone = 1;
    if (hooded) { blob(-0.31, 1.5, -0.33, 0.31, 1.97, 0.26, 0.9, kind === 'hexer' ? '#2a1640' : '#2c2a34', { n: 4 }); cone([0, 1.9, -0.1], [0, kind === 'hexer' ? 1 : 0.4, -0.8], kind === 'hexer' ? 0.5 : 0.34, 0.2, kind === 'hexer' ? '#2a1640' : '#2c2a34', { segs: 8 }); if (kind === 'hexer') { ball(0, 2.36, -0.42, 0.06, glow, G1); plate([[-0.06, 1.8, 0.262], [0.06, 1.8, 0.262], [0, 1.92, 0.25]], 0.01, glow, G1); } }
    else { blob(-0.32, 1.6, -0.32, 0.32, 1.98, 0.32, kind === 'shield' ? 0.45 : 0.9, steel, { n: 4 }); blob(-0.3, 1.36, -0.3, 0.3, 1.66, -0.02, 0.7, dsteel, { n: 3 }); tube([[0, 1.9, 0.3], [0, 1.6, 0.325], [0, 1.44, 0.3]], [0.04, 0.045, 0.03], lsteel, { segs: 5, cap0: 'round', cap1: 'round' }); ring(0, 1.7, 0, 0.325, 0.325, 0.025, ac);
      if (kind === 'guard') cone([0, 1.96, 0], [0, 1, 0], 0.16, 0.05, lsteel);
      if (kind === 'axeman' || kind === 'brute') for (const sd of [-1, 1]) { const p = []; for (let i = 0; i <= 5; i++) { const a = i / 5 * 1.5; p.push([sd * (0.3 + Math.sin(a) * (kind === 'brute' ? 0.3 : 0.2)), 1.8 + (1 - Math.cos(a)) * (kind === 'brute' ? 0.4 : 0.26), 0]); } tube(p, p.map((_, i) => 0.06 * (1 - i / 6.5)), '#e8dcc0', { segs: 6, cap0: 'flat', cap1: 'round' }); }
      if (kind === 'shield') { blob(-0.33, 1.94, -0.33, 0.33, 2.0, 0.33, 0.3, dsteel, { n: 2 }); for (const x of [-0.1, 0.1]) tube([[x, 1.5, 0.325], [x, 1.62, 0.33]], [0.012, 0.012], '#0a0810', { segs: 3 }); }
      if (kind === 'lancer') for (const sd of [-1, 1]) plate([[sd * 0.3, 1.74, 0.0], [sd * 0.52, 2.08, -0.2], [sd * 0.3, 1.9, -0.16]], 0.02, ac, { edge: lsteel });
      if (kind === 'captain') { for (let i = 0; i < 5; i++) plate([[0, 1.96, 0.2 - i * 0.1], [0, 2.26 + Math.sin(i / 4 * Math.PI) * 0.1, 0.12 - i * 0.12], [0, 1.95, 0.08 - i * 0.1]], 0.03, glow, G1); } }
    tube([[-0.13, 1.6, hooded ? 0.268 : 0.327], [0.13, 1.6, hooded ? 0.268 : 0.327]], [0.03, 0.03], glow, { emis: true, segs: 5, cap0: 'round', cap1: 'round' }); /* the light behind the eyes */
    /* body */
    H.bone = 0;
    if (kind === 'hexer') { tube([[0, 1.3, 0], [0, 0.8, 0], [0, 0.3, 0]], [0.3, 0.33, 0.42], '#2a1640', { cap0: 'none', cap1: 'flat', segs: 10 }); ring(0, 1.0, 0.33, 0.07, 0.07, 0.015, glow, { emis: true }); }
    else { blob(-0.37, 0.92, -0.25, 0.37, 1.42, 0.28, 0.6, kind === 'captain' ? dsteel : steel, { n: 3 }); blob(-0.2, 1.0, 0.2, 0.2, 1.36, 0.3, 0.7, kind === 'captain' ? steel : dsteel, { n: 3 }); ball(0, 1.2, 0.3, 0.05, glow, G1);
      for (let i = -1; i <= 1; i++) blob(i * 0.2 - 0.1, 0.62, 0.14, i * 0.2 + 0.1, 0.92, 0.26, 0.4, i ? dsteel : ac, { n: 2 }); }
    if (kind === 'captain') plate([[-0.34, 1.36, -0.27], [0.34, 1.36, -0.27], [0.44, 0.3, -0.42], [-0.44, 0.3, -0.42]], 0.025, '#3a1458', { edge: ac });
    if (kind === 'archer') { blob(-0.26, 0.9, -0.42, -0.06, 1.5, -0.26, 0.6, wood, { n: 3 }); for (let i = 0; i < 3; i++) tube([[-0.22 + i * 0.05, 1.46, -0.34], [-0.24 + i * 0.06, 1.66, -0.36]], [0.012, 0.012], '#e8e4dc', { segs: 3 }); }
    for (const sd of [-1, 1]) { H.bone = sd < 0 ? 2 : 3; if (kind !== 'hexer') { ball(sd * 0.4, 1.3, 0, kind === 'brute' ? 0.2 : 0.16, kind === 'captain' ? ac : steel, { n: 3 }); if (kind === 'brute' || kind === 'captain') cone([sd * 0.44, 1.4, 0], [sd, 1, 0], 0.16, 0.05, lsteel); blob(sd * 0.45 - 0.1, 0.62, -0.06, sd * 0.45 + 0.1, 0.84, 0.16, 0.6, dsteel, { n: 2 }); } }
    /* in the right hand */
    H.bone = 3; const hx = 0.47, hy = 0.56, hz = 0.1;
    if (K.deco === 'sword' || K.deco === 'captain') { const L = K.deco === 'captain' ? 1.2 : 1.0; tube([[hx, hy - 0.1, hz], [hx, hy + 0.1, hz]], [0.03, 0.03], wood, { segs: 5, cap0: 'round', cap1: 'flat' }); blob(hx - 0.14, hy + 0.09, hz - 0.035, hx + 0.14, hy + 0.14, hz + 0.035, 0.4, K.deco === 'captain' ? ac : lsteel, { n: 2 }); plate([[hx - 0.055, hy + 0.14, hz], [hx - 0.045, hy + L, hz], [hx, hy + L + 0.12, hz], [hx + 0.045, hy + L, hz], [hx + 0.055, hy + 0.14, hz]], 0.018, '#d8dae6', { edge: lsteel }); if (K.deco === 'captain') tube([[hx, hy + 0.2, hz + 0.022], [hx, hy + L, hz + 0.022]], [0.01, 0.006], glow, { emis: true, segs: 3 }); }
    if (K.deco === 'axe') { tube([[hx, hy - 0.3, hz], [hx, hy + 1.1, hz]], [0.03, 0.03], wood, { segs: 5, cap0: 'round', cap1: 'round' }); plate([[hx, hy + 1.06, hz], [hx, hy + 0.7, hz], [hx + 0.3, hy + 0.62, hz], [hx + 0.36, hy + 0.88, hz], [hx + 0.3, hy + 1.14, hz]], 0.03, '#c4c6d2', { edge: lsteel }); }
    if (K.deco === 'maul') { tube([[hx, hy - 0.3, hz], [hx, hy + 1.2, hz]], [0.04, 0.04], wood, { segs: 6, cap0: 'round', cap1: 'round' }); blob(hx - 0.26, hy + 0.96, hz - 0.16, hx + 0.26, hy + 1.36, hz + 0.16, 0.35, '#3a3440', { n: 2 }); for (const sd of [-1, 1]) { cone([hx + sd * 0.26, hy + 1.16, hz], [sd, 0, 0], 0.14, 0.07, lsteel, { segs: 4 }); } ball(hx, hy + 1.16, hz + 0.17, 0.06, glow, G1); }
    if (K.deco === 'lance') { tube([[hx, hy - 0.5, hz], [hx, hy + 1.7, hz]], [0.028, 0.026], wood, { segs: 5, cap0: 'round', cap1: 'flat' }); cone([hx, hy + 1.7, hz], [0, 1, 0], 0.34, 0.06, '#d8dae6', { segs: 4 }); plate([[hx, hy + 1.62, hz], [hx - 0.34, hy + 1.5, hz - 0.02], [hx, hy + 1.38, hz]], 0.012, ac, { edge: glow }); blob(hx - 0.07, hy + 0.1, hz - 0.07, hx + 0.07, hy + 0.2, hz + 0.07, 0.6, lsteel, { n: 2 }); }
    if (K.deco === 'bow') { const p = []; for (let i = 0; i <= 8; i++) { const a = -1.2 + i / 8 * 2.4; p.push([hx, hy + 0.2 + Math.sin(a) * 0.62, hz + Math.cos(a) * 0.3 - 0.1]); } tube(p, p.map((_, i) => 0.012 + 0.02 * Math.sin(i / 8 * Math.PI)), wood, { segs: 5, cap0: 'round', cap1: 'round' }); tube([p[0], p[8]], [0.005, 0.005], '#e8e4dc', { segs: 3 }); }
    if (K.deco === 'raygun') { blob(hx - 0.05, hy + 0.1, hz - 0.1, hx + 0.05, hy + 0.24, hz + 0.34, 0.5, '#3a4052', { n: 2 }); tube([[hx, hy + 0.17, hz + 0.3], [hx, hy + 0.17, hz + 0.62]], [0.035, 0.028], '#8d97aa', { segs: 6, cap0: 'flat', cap1: 'flat' }); ball(hx, hy + 0.17, hz + 0.64, 0.04, glow, G1); blob(hx - 0.035, hy - 0.08, hz - 0.06, hx + 0.035, hy + 0.12, hz + 0.02, 0.4, '#2a2e3a', { n: 2 }); for (const z of [0.38, 0.46, 0.54]) tube([[hx, hy + 0.17, hz + z - 0.01], [hx, hy + 0.17, hz + z + 0.01]], [0.05, 0.05], '#cfd6e2', { segs: 6 }); } /* a ray gun: a grip, a body, a ringed barrel with a light in the mouth */
    if (K.deco === 'staff') { tube([[hx, hy - 0.5, hz], [hx, hy + 1.3, hz]], [0.026, 0.03], '#3a2a1a', { segs: 5, cap0: 'round', cap1: 'round' }); for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283; tube([[hx, hy + 1.2, hz], [hx + Math.cos(a) * 0.12, hy + 1.38, hz + Math.sin(a) * 0.12], [hx + Math.cos(a) * 0.07, hy + 1.56, hz + Math.sin(a) * 0.07]], [0.02, 0.016, 0.006], '#3a2a1a', { segs: 4 }); } ball(hx, hy + 1.44, hz, 0.09, glow, G1); }
    /* on the left arm */
    H.bone = 2;
    if (K.deco === 'shield') { blob(-0.66, 0.42, -0.1, -0.56, 1.36, 0.56, 0.5, ac, { n: 3 }); blob(-0.68, 0.46, -0.06, -0.64, 1.32, 0.52, 0.4, dsteel, { n: 2 }); blob(-0.7, 0.56, 0.04, -0.66, 1.22, 0.42, 0.4, ac, { n: 2 }); ball(-0.71, 0.9, 0.23, 0.07, lsteel, { n: 3 }); }
    if (K.deco === 'captain') { blob(-0.64, 0.56, 0.0, -0.56, 1.16, 0.46, 0.9, ac, { n: 3 }); ball(-0.66, 0.86, 0.23, 0.06, glow, G1); }
    if (K.deco === 'staff') { ball(-0.5, 0.52, 0.2, 0.07, glow, G1); for (let i = 0; i < 3; i++) cone([-0.5 + Math.cos(i * 2.1) * 0.14, 0.52 + Math.sin(i * 2.1) * 0.14, 0.2], [Math.cos(i * 2.1), Math.sin(i * 2.1), 0], 0.08, 0.02, glow, G1); }
    H.bone = 0; return H.done();
  }
  function spawn(kind, x, y, z, holdId, level) {
    const K = KINDS[kind]; const m = warriorModel(kind, false); const lv = level || 0;
    const f = { kind, name: K.name, x, y, z, yaw: 0, hx: x, hz: z, model: m, mesh: R.entityMesh('foe3:' + kind, (mb) => KIN.buildMesh(mb, m)), scale: K.big || 1, hover: 0, hex: !!K.hex, skyMul: 1,
      hp: Math.round(K.hp * (1 + lv * 0.45)), max: Math.round(K.hp * (1 + lv * 0.45)), dmg: K.dmg + Math.floor(lv / 2), speed: K.speed, reach: K.reach, wind: K.wind, rest: K.rest, block: K.block || 0, archer: !!K.archer, ray: !!K.ray,
      state: 'idle', t: 0, aware: false, holdId, lv, burn: 0, bleed: 0, slowT: 0, stun: 0, hitT: 0, isFoe: true };
    foes.push(f); return f;
  }
  const shots = []; // the archers' arrows
  const bolts = []; /* your own ray gun's bolts: light only, the hit is decided the moment you fire */
  function beam(a, b) { const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1, v = 70; for (let k = 0; k < 3; k++) bolts.push({ x: a[0], y: a[1], z: a[2], vx: (b[0] - a[0]) / d * v, vy: (b[1] - a[1]) / d * v, vz: (b[2] - a[2]) / d * v, t: -k * 0.018, life: d / v }); }
  function down(f, how) {
    f.state = 'down'; f.hp = 0; f.t = 0; f.hover = -0.55; UI.sfx('win'); G.knockout(f.x, f.y, f.z);
    const P = G.player; const gold = weapon() && weapon().fx === 'loot' ? 2 : 1; const sh = Math.round((8 + f.lv * 6) * gold * (f.kind === 'captain' ? 3 : 1)); G.shards += sh;
    let msg = `${f.name} drops to his knees, dazed. +${sh} shards.`;
    // what he fought with is yours: his sword, axe, shield or bow, as good as his rank (one you already carry turns into shards)
    const takes = { guard: ['sword'], axeman: ['axe'], brute: ['axe'], lancer: ['sword'], shield: ['shield'], captain: ['sword', 'shield'], archer: ['bow'], trooper: ['raygun'] }[f.kind] || [];
    for (const kind of takes) {
      if (kind === 'raygun') { if (!P.has('raygun')) { P.add('raygun', 1); msg += ' You take his ray gun. It needs no arrows: hold it and tap.'; if (UI.renderHotbar) UI.renderHotbar(); } continue; }
      if (kind === 'bow') { if (!P.has('bow')) { P.add('bow', 1); msg += ' You take his bow.'; } else { P.add('arrow', 4); msg += ' You take his arrows.'; } continue; }
      const pool = Object.values(GEAR).filter(g => g.kind === kind && g.tier <= Math.max(1, f.lv) && g.tier >= Math.max(0, f.lv - 2)); const g = pool[Math.floor(Math.random() * pool.length)]; if (!g) continue;
      if (P.has(g.id)) { const extra = Math.max(6, Math.round(g.price / 4 || 10)); G.shards += extra; msg += ` His ${g.name} is like yours: +${extra} shards for it.`; }
      else { P.add(g.id, 1); msg += ` You take his ${g.name}.`; }
    }
    if (Math.random() < 0.25 + (f.kind === 'captain' ? 0.5 : 0)) { const pool = Object.values(GEAR).filter(g => g.tier >= f.lv && g.tier <= f.lv + 2); const g = pool[Math.floor(Math.random() * pool.length)]; if (g && !P.has(g.id)) { P.add(g.id, 1); msg += ` He drops ${/^[AEIOU]/.test(g.name) ? 'an' : 'a'} ${g.name}.`; } }
    if (Math.random() < 0.18 + (f.kind === 'captain' ? 0.3 : 0)) { const ap = Object.values(ARMOUR).filter(a => a.tier >= f.lv && a.tier <= f.lv + 2); const a = ap[Math.floor(Math.random() * ap.length)]; if (a && !P.has(a.id)) { P.add(a.id, 1); msg += ` And ${/^[AEIOU]/.test(a.name) ? 'an' : 'a'} ${a.name}.`; } }
    if (Math.random() < 0.4) { const a = ['arrow', 'arrow_frost', 'arrow_spark', 'arrow_barbed', 'arrow_heavy'][Math.min(4, Math.floor(Math.random() * (2 + f.lv)))]; P.add(a, 3); }
    UI.toast(msg, 'good'); UI.renderHotbar && UI.renderHotbar();
  }
  function hurt(f, dmg, opts = {}) {
    if (f.state === 'down') return;
    const sh = shield(); void sh;
    let d = dmg; const facing = Math.cos(Math.atan2(G.player.x - f.x, G.player.z - f.z) - f.yaw) > 0.3;
    if (f.block && facing && f.state !== 'stun' && !opts.pierce) { const half = opts.halfPierce ? 0.5 : 1; d = Math.round(d * (1 - f.block * half)); }
    if (!f.aware) { d *= 2; f.aware = true; } // caught unawares: double
    f.hp -= Math.max(1, d); f.hitT = 0.25; f.aware = true; UI.floater(f.x, f.y + 2.1, f.z, String(Math.max(1, Math.round(d))), d < dmg ? 'weak' : d > dmg ? 'crit' : '');
    if (opts.burn) f.burn = Math.max(f.burn, opts.burn); if (opts.slow) f.slowT = Math.max(f.slowT, opts.slow); if (opts.bleed) f.bleed = Math.max(f.bleed, opts.bleed);
    if (opts.stun) { f.state = 'stun'; f.t = opts.stun; }
    if (opts.knock) { const a = Math.atan2(f.x - G.player.x, f.z - G.player.z); f.x += Math.sin(a) * opts.knock; f.z += Math.cos(a) * opts.knock; }
    if (opts.sleep && f.hp > 0 && !f.wasAware) { f.hp = 0; }
    if (f.hp <= 0) down(f);
    G.foeFocus = f; G.foeFocusT = 4;
  }
  // tap with a weapon in hand: swing it
  let swingCd = 0, blockT = 0, armT = 0, swoosh = null;
  function swing() {
    const sk = G.player.selected(); if (sk && GEAR[sk] && broken(sk)) { if (swingCd <= 0) { swingCd = 1; UI.toast(`Your ${GEAR[sk].name} is broken. An armoury will mend it.`, 'bad'); } return true; }
    const w0 = weapon(); if (!w0 || swingCd > 0) return false;
    const p = G.player; const air = !p.onGround && !p.mount && !p.flying && !p.inWater; /* struck from a jump: a somersault and half as much again */
    const w = air ? Object.assign({}, w0, { dmg: w0.dmg * 1.5, reach: w0.reach + 0.3 }) : w0;
    const sk0 = p.selected() || ''; p.swingKind = w.kind === 'axe' || sk0.startsWith('ax_') ? 'chop' : sk0.startsWith('sp_') ? 'thrust' : 'slash'; p.swingDur = p.swingKind === 'chop' ? 0.46 : p.swingKind === 'thrust' ? 0.34 : 0.36; if (air) p.swingDur += 0.14;
    p.swingN = (p.swingN || 0) + 1; p.swingAir = air; if (air) UI.toast('Leaping strike!');
    swingCd = Math.max(w.cd, p.swingDur * 0.8); p.swingT = p.swingDur; UI.sfx('miss'); pendingHit = { t: p.swingDur * 0.48, w }; return true; /* the blow lands when the blade gets there, not when the arm starts */
  }
  let pendingHit = null;
  /* the slash: a crescent of light swept out in front of you as the blade goes through, the colour of what the blade does (fire orange, frost blue,
     a piercing edge violet, all three gold), glowing rather than painted. A sword sweeps across, one way then the other, a little tilted; an axe comes
     down; a spear leaves a straight streak. Each kind is built once in eight stages of its sweep and the swing shows the stage it has reached */
  const SLK = 8; let slashTilt = 0, slashN = -1;
  const slashCol = (w) => { const f = w && w.fx; return f === 'burn' ? [1.0, 0.5, 0.16] : f === 'slow' ? [0.5, 0.84, 1.0] : f === 'pierce' ? [0.78, 0.52, 1.0] : f === 'all' ? [1.0, 0.84, 0.32] : [0.86, 0.94, 1.0]; };
  function slashMesh(kind, k, dir, col) {
    return R.entityMesh('slash:' + kind + ':' + k + ':' + dir + ':' + col.join(','), (mb) => {
      const prog = (k + 1) / SLK, C = (s) => [col[0] * s, col[1] * s, col[2] * s];
      if (kind === 'thrust') { /* a streak straight out along the spear, brightest at its point */
        const z0 = 0.4, z1 = 0.4 + 2.0 * prog, n = 10, rows = [[-0.16, 0], [0, 1], [0.16, 0]]; /* lying flat, so it shows from behind and from your own eyes */
        for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, za = z0 + (z1 - z0) * t0, zb = z0 + (z1 - z0) * t1, ia = t0 * t0, ib = t1 * t1;
          for (let r = 0; r < 2; r++) { const [xa, sa] = rows[r], [xb, sb] = rows[r + 1]; mb.quad([[xa * (1 - t0 * 0.6), 0, za], [xa * (1 - t1 * 0.6), 0, zb], [xb * (1 - t1 * 0.6), 0, zb], [xb * (1 - t0 * 0.6), 0, za]], [C(sa * ia), C(sa * ib), C(sb * ib), C(sb * ia)], [1, 1, 1, 1], true, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]); } }
        return; }
      const chop = kind === 'chop', a0 = chop ? 1.25 : -1.2 * dir, a1 = chop ? -0.55 : 1.2 * dir, head = a0 + (a1 - a0) * prog, tail = a0 + (a1 - a0) * Math.max(0, prog - 0.62), n = 14;
      const rIn = 1.05, rMid = 1.55, rOut = 1.9, P = (ang, r) => chop ? [0, Math.sin(ang) * r, Math.cos(ang) * r] : [Math.sin(ang) * r, 0, Math.cos(ang) * r], NRM = chop ? [1, 0, 0] : [0, 1, 0];
      for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, aa = tail + (head - tail) * t0, ab = tail + (head - tail) * t1, ia = t0 * t0, ib = t1 * t1; /* bright at the blade, dying away behind it */
        const wa = 0.35 + 0.65 * t0, wb = 0.35 + 0.65 * t1, ra = [rMid - (rMid - rIn) * wa, rMid, rMid + (rOut - rMid) * wa], rb = [rMid - (rMid - rIn) * wb, rMid, rMid + (rOut - rMid) * wb], lv = [0, 1, 0.3]; /* soft inner edge, a bright core, a thin bright outer rim */
        for (let r = 0; r < 2; r++) mb.quad([P(aa, ra[r]), P(ab, rb[r]), P(ab, rb[r + 1]), P(aa, ra[r + 1])], [C(lv[r] * ia), C(lv[r] * ib), C(lv[r + 1] * ib), C(lv[r + 1] * ia)], [1, 1, 1, 1], true, [NRM, NRM, NRM, NRM]); }
    }); }
  function slashEntity() {
    const p = G.player; if (!(p.swingT > 0) || !p.swingDur) return null; const w = weapon(); if (!w) return null;
    if (slashN !== p.swingN) { slashN = p.swingN; slashTilt = (Math.random() - 0.5) * 0.5; }
    const kind0 = p.swingKind || 'slash', tilt = kind0 === 'chop' ? ((p.swingN || 0) % 2 ? 0.6 : -0.6) : kind0 === 'slash' ? slashTilt : 0; /* an axe comes down on a slant, so the cut shows from behind as well as from your own eyes */
    const prog = 1 - p.swingT / p.swingDur, k = Math.min(SLK - 1, Math.floor(prog * SLK * 1.25)), kind = p.swingKind || 'slash', dir = (p.swingN || 0) % 2 ? 1 : -1;
    const fade = prog < 0.62 ? 1 : Math.max(0, 1 - (prog - 0.62) / 0.38), col = slashCol(w).map(c => +(c * fade).toFixed(2)); if (fade <= 0.02) return null;
    const y = p.y + (kind === 'chop' ? 1.15 : kind === 'thrust' ? 1.2 : 1.28), yaw = p.yaw + Math.PI, c = Math.cos(yaw), s = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    const M = new Float32Array([c * ct, st, -s * ct, 0, -c * st, ct, s * st, 0, s, 0, c, 0, p.x, y, p.z, 1]); /* turned to face where you face, rolled a little so no two swings cut the same line */
    return { x: p.x, y, z: p.z, yaw, scale: 1, M, mesh: slashMesh(kind, k, dir, col), isFx: true, noShadow: true, noOutline: true, additive: true, skyMul: 1 };
  }
  function land(w) {
    const p = G.player; const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw); let hit = false;
    for (const f of foes) {
      if (f.state === 'down') continue; const dx = f.x - p.x, dz = f.z - p.z, d = Math.hypot(dx, dz); if (d > w.reach + 0.4 || Math.abs(f.y - p.y) > 2) continue;
      const ang = Math.acos(U.clamp((dx * fx + dz * fz) / (d || 1), -1, 1)); if (ang > w.arc * 0.5 + 0.25) continue;
      const crit = Math.random() < w.crit; const dmg = Math.round(w.dmg * (0.9 + Math.random() * 0.2) * (crit ? 1.8 : 1) * (G.buffMul ? G.buffMul('blade') : 1));
      f.wasAware = f.aware;
      hurt(f, dmg, { burn: w.fx === 'burn' || w.fx === 'all' ? 3 : 0, slow: w.fx === 'slow' || w.fx === 'all' ? 2.5 : 0, halfPierce: w.fx === 'pierce' || w.fx === 'all' });
      if (crit) UI.toast('Critical!'); hit = true;
      // the blow lands: sparks where it struck, the man rocks back, a kick in the camera
      const hx = f.x - dx / (d || 1) * 0.35, hz = f.z - dz / (d || 1) * 0.35; Hazards.sparks(hx, f.y + 1.1, hz, crit ? 14 : 8, crit ? [1.0, 0.85, 0.4] : [1.0, 0.95, 0.8]);
      const push = (w.kind === 'axe' ? 0.5 : 0.3) * (crit ? 1.6 : 1); const nx = f.x + dx / (d || 1) * push, nz = f.z + dz / (d || 1) * push; const gy = G.world.groundY(Math.floor(nx), Math.floor(nz), Math.floor(f.y) + 2); if (gy != null && Math.abs(gy + 1 - f.y) < 1.2) { f.x = nx; f.z = nz; } f.rockT = 0.3; f.rockDir = Math.atan2(dx, dz);
      G.shake = Math.max(G.shake || 0, crit ? 0.25 : 0.12);
      if (w.kind !== 'axe') break; // a sword hits one, an axe cleaves through all in its arc
    }
    // wild Kin in the arc: a fraction of their health a blow, the big weapons about a seventh, a wooden sword a twentieth. Your Kin hit far harder.
    if (!hit || w.kind === 'axe') {
      const near = Wild.list.filter(e => !e.high && !e.peaceful && !(e.dazed > 0)).map(e => { const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz); return { e, dx, dz, d }; }).filter(o => o.d <= w.reach + 0.4 + (o.e.model.radius || 0.6) * o.e.scale * 0.6 && Math.abs(o.e.y - p.y) < 2.6).sort((a, b) => a.d - b.d);
      for (const o of near) {
        const { e, dx, dz, d } = o; const ang = Math.acos(U.clamp((dx * fx + dz * fz) / (d || 1), -1, 1)); if (ang > w.arc * 0.5 + 0.3) continue;
        const crit = Math.random() < w.crit; const unaware = !e.chase && (e.alert || 0) < 0.6;
        const frac = (0.025 + 0.12 * (1 - Math.exp(-w.dmg / 25))) * (crit ? 1.6 : 1) * (unaware ? 2 : 1) * (G.buffMul ? G.buffMul('blade') : 1);
        const r = Wild.strike(e, frac, { fromX: p.x, fromZ: p.z, push: w.kind === 'axe' ? 0.5 : 0.35, heavy: w.kind === 'axe' });
        const hx = e.x - dx / (d || 1) * Math.max(0.3, (e.model.radius || 0.6) * e.scale * 0.8), hz = e.z - dz / (d || 1) * Math.max(0.3, (e.model.radius || 0.6) * e.scale * 0.8);
        Hazards.sparks(hx, e.y + (e.hover || 0) + e.model.height * e.scale * 0.6, hz, crit ? 14 : 8, crit ? [1.0, 0.85, 0.4] : [1.0, 0.95, 0.8]);
        G.shake = Math.max(G.shake || 0, crit ? 0.25 : 0.12); hit = true;
        if (crit) UI.toast('Critical!'); else if (unaware) UI.toast('Clean hit!');
        if (w.kind !== 'axe') break;
      }
    }
    swoosh = { t: 0, dur: 0.22, yaw: p.yaw, pitch: p.pitch, wide: w.kind === 'axe' ? 1.9 : 1.3, reach: w.reach };
    if (hit) { UI.sfx('hit'); use(w.id, 1); }
    return true;
  }
  // a blow aimed at you, from a warrior or a Kin: a shield in its way takes most of it, a shield raised or a swing timed as it lands turns it away
  function takeBlow(dmg, fromX, fromZ, cause, src) {
    const p = G.player; const fac = Math.cos(Math.atan2(fromX - p.x, fromZ - p.z) - (p.yaw + Math.PI)) > 0.2; const sh2 = shield(); const w = weapon();
    const spx = p.x + Math.sin(p.yaw + Math.PI) * -0.5, spz = p.z + Math.cos(p.yaw + Math.PI) * -0.5;
    if (p.blocking && sh2 && fac) {
      use(sh2.id, 1);
      if (blockT < sh2.parry + 0.08) { UI.sfx('hit'); UI.toast('Parried!'); Hazards.sparks(spx, p.y + 1.1, spz, 12, [1.0, 0.98, 0.8], 3.5); G.shake = Math.max(G.shake || 0, 0.1); return { result: 'parry', dealt: 0 }; }
      const left = Math.round(dmg * (1 - sh2.block) * 10) / 10; let dealt = 0; if (left >= 1 || Math.random() < left) { dealt = Math.max(1, Math.round(left)); p.damage(dealt, cause); }
      UI.sfx('place'); Hazards.sparks(spx, p.y + 1.1, spz, 6, [0.9, 0.95, 1.0], 2.5); G.shake = Math.max(G.shake || 0, 0.15); return { result: 'block', dealt };
    }
    if (w && fac && p.swingT > 0.1 && p.swingT < 0.24) { UI.sfx('hit'); UI.toast('Parried!'); Hazards.sparks(spx, p.y + 1.1, spz, 12, [1.0, 0.98, 0.8], 3.5); G.shake = Math.max(G.shake || 0, 0.1); use(w.id, 1); return { result: 'parry', dealt: 0 }; }
    p.damage(dmg, cause); G.shake = Math.max(G.shake || 0, 0.35); return { result: 'hit', dealt: dmg };
  }
  // an arrow from your bow: does it hit a warrior before anything else?
  function arrowHit(ammo, maxDist) {
    const p = G.player; const eye = p.eye(); const f0 = U.forwardVec(p.yaw, p.pitch); let best = null, bt = maxDist;
    for (const f of foes) { if (f.state === 'down') continue; const cx = f.x, cy = f.y + 1, cz = f.z; const ox = eye.x - cx, oy = eye.y - cy, oz = eye.z - cz; const b = ox * f0[0] + oy * f0[1] + oz * f0[2], c = ox * ox + oy * oy + oz * oz - 0.8; const disc = b * b - c; if (disc < 0) continue; const t = -b - Math.sqrt(disc); if (t > 0 && t < bt) { bt = t; best = f; } }
    if (!best) return null;
    const A = ARROWS[ammo] || ARROWS.arrow; best.wasAware = best.aware;
    hurt(best, A.dmg, { burn: A.burn || 0, slow: A.slow || 0, stun: A.stun || 0, bleed: A.bleed || 0, knock: A.knock || 0, pierce: !!(A.pierce || A.shieldBreak), sleep: !!A.sleep });
    return { foe: best, dist: bt };
  }
  function blocking() { return !!(G.player.blocking && shield()); }
  // for your buddy: the nearest warrior who is up and has seen you
  function nearestFoe(p, maxD = 10) { let best = null, bd = maxD; for (const f of foes) { if (f.state === 'down' || !f.aware) continue; const d = Math.hypot(f.x - p.x, f.z - p.z); if (d < bd && Math.abs(f.y - p.y) < 3) { bd = d; best = f; } } return best; }
  function hurtFoe(f, dmg, fromX, fromZ) { if (f.state === 'down') return; f.wasAware = f.aware; hurt(f, dmg, {}); const dx = f.x - fromX, dz = f.z - fromZ, d = Math.hypot(dx, dz) || 1; f.rockT = 0.3; f.rockDir = Math.atan2(-dx, -dz); const nx = f.x + dx / d * 0.3, nz = f.z + dz / d * 0.3; const gy = G.world.groundY(Math.floor(nx), Math.floor(nz), Math.floor(f.y) + 2); if (gy != null && Math.abs(gy + 1 - f.y) < 1.2) { f.x = nx; f.z = nz; } }
  function update(dt, p, input) {
    swingCd = Math.max(0, swingCd - dt); if (p.swingT > 0) p.swingT -= dt; if (pendingHit) { pendingHit.t -= dt; if (pendingHit.t <= 0) { const w1 = pendingHit.w; pendingHit = null; land(w1); } } if (G.kinFocusT > 0) G.kinFocusT -= dt;
    armT -= dt; if (armT <= 0) { armT = 1; const hb = G.buffOn ? G.buffOn('hearts') : null; const mx = 10 + (wornPerk('heart', true) ? 2 : 0) + (hb ? hb.amt : 0); if (p.maxHp !== mx) { p.maxHp = mx; if (p.hp > mx) p.hp = mx; } }
    // holding a weapon with a shield in the bag: hold means block, not dig
    const w = weapon(); const sh = shield();
    const wantBlock = !!(sh && ((w && input && input.mine) || G.blockHeld)); // hold the screen with a weapon out, or hold the shield button
    if (wantBlock && !p.blocking) blockT = 0; p.blocking = wantBlock; if (p.blocking) blockT += dt;
    if (G.foeFocusT > 0) G.foeFocusT -= dt;
    for (let i = bolts.length - 1; i >= 0; i--) { const b = bolts[i]; b.t += dt; if (b.t > 0) { b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; } if (b.t > b.life) bolts.splice(i, 1); }
    for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.vy -= 6 * dt;
      if (Math.abs(s.x - p.x) < 0.5 && Math.abs(s.z - p.z) < 0.5 && s.y > p.y && s.y < p.y + 1.9) { const fac = Math.cos(Math.atan2(s.x - p.x, s.z - p.z) - (p.yaw + Math.PI)) > 0.2; if (blocking() && fac) { UI.sfx('place'); use(shield().id, 1); } else { p.lastArrow = true; p.damage(s.dmg, 'warrior'); p.lastArrow = false; } shots.splice(i, 1); continue; }
      if (s.t > 3 || isSolid(G.world.getBlock(Math.floor(s.x), Math.floor(s.y), Math.floor(s.z)))) shots.splice(i, 1); }
    if (swoosh) { swoosh.t += dt; if (swoosh.t > swoosh.dur) swoosh = null; }
    for (const f of foes) {
      f.t -= dt; if (f.hitT > 0) f.hitT -= dt; if (f.rockT > 0) f.rockT -= dt; if (f.strikeT > 0) f.strikeT -= dt;
      // the pose: arm drawn back while he winds up, the blow when it lands, the shield up when he faces you, a stagger when hit
      { const an = f._an || (f._an = Anim.fresh(f, performance.now())); const windK = f.state === 'wind' ? 1 - Math.max(0, f.t) / (f.wind || 1) : 0;
        { const dk = (KINDS[f.kind] && KINDS[f.kind].deco) || ''; an.atkKind = /axe|maul/.test(dk) ? 'chop' : /spear|pike|lance/.test(dk) ? 'thrust' : 'slash'; an.atkN = 0; an.attack = 0; /* they fight the way you do: the arm goes back as he winds up, and the blow comes through when it lands */
          an.atkU = f.strikeT > 0 ? 0.3 + 0.7 * (1 - f.strikeT / 0.22) : windK > 0 ? 0.3 * windK : null; an.atkLean = an.atkU != null ? Math.sin(Math.min(1, Math.max(0, (an.atkU - 0.25) / 0.5)) * Math.PI) * 0.25 : 0; }
        an.block = (f.block && f.state !== 'stun' && f.state !== 'down' && f.aware) ? 1 : 0;
        an.sit = f.state === 'down' ? 1 : 0;
        an.lean = (f.rockT > 0 ? -0.35 * Math.sin(Math.min(1, f.rockT / 0.3) * Math.PI) : 0) + (f.state === 'wind' ? 0.12 * windK : 0) + (f.state === 'stun' ? 0.25 : 0) + (f.state === 'down' ? 0.3 : 0);
        an.nod = f.state === 'stun' ? Math.sin(performance.now() / 90) * 0.15 : (f.state === 'down' ? 0.45 : 0); }
      if (f.state === 'down') continue;
      if (f.burn > 0) { f.burn -= dt; if (Math.random() < dt * 1.2) { f.hp -= 2; if (f.hp <= 0) { down(f); continue; } } }
      if (f.bleed > 0) { f.bleed -= dt; if (Math.random() < dt * 1.5) { f.hp -= 2; if (f.hp <= 0) { down(f); continue; } } }
      if (f.slowT > 0) f.slowT -= dt;
      const dx = p.x - f.x, dz = p.z - f.z, d = Math.hypot(dx, dz) || 0.001; /* never exactly on top of him: a zero here used to send him to nowhere */
      const sneakR = p.wingsOn && p.y - f.y > 2.5 ? 1.5 : p.sneak ? 5 : 11; if (!f.aware && d < sneakR && Math.abs(p.y - f.y) < 4) f.aware = true;
      if (f.state === 'stun') { if (f.t <= 0) f.state = 'idle'; continue; }
      if (Battle.active) { continue; } // a Kin duel is on: his men stand back
      if (!f.aware || p.dead) { f.yaw += Math.sin(performance.now() / 2000 + f.hx) * dt * 0.3; continue; }
      const want = Math.atan2(dx, dz); let dy = want - f.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; f.yaw += dy * Math.min(1, dt * 6);
      const spd = f.speed * (f.slowT > 0 ? 0.45 : 1);
      if (f.state === 'idle' || f.state === 'chase') {
        const keep = f.archer ? 8 : f.reach * 0.8;
        if (d > keep + 0.3 && !(f.archer && d < 12)) { const nx = f.x + dx / d * spd * dt, nz = f.z + dz / d * spd * dt; const gy = G.world.groundY(Math.floor(nx), Math.floor(nz), Math.floor(f.y) + 2); if (gy != null && Math.abs(gy + 1 - f.y) < 1.2) { f.x = nx; f.z = nz; f.y += (gy + 1 - f.y) * Math.min(1, dt * 10); } }
        else if (f.archer && d < 5) { const nx = f.x - dx / d * spd * dt, nz = f.z - dz / d * spd * dt; const gy = G.world.groundY(Math.floor(nx), Math.floor(nz), Math.floor(f.y) + 2); if (gy != null && Math.abs(gy + 1 - f.y) < 1.2) { f.x = nx; f.z = nz; } }
        if (d <= f.reach && f.t <= 0) { f.state = 'wind'; f.t = f.wind; f.hover = 0.12; }
      } else if (f.state === 'wind') {
        if (f.t <= 0) {
          f.hover = 0;
          f.strikeT = 0.22;
          if (f.archer) { const tt = d / (f.ray ? 24 : 16); shots.push({ hex: f.hex, ray: f.ray, x: f.x, y: f.y + 1.4, z: f.z, vx: dx / tt, vy: (p.y + 1.2 - f.y - 1.4) / tt + 3 * tt, vz: dz / tt, t: 0, dmg: f.dmg }); UI.sfx(f.ray ? 'zap' : 'miss'); }
          else if (d <= f.reach + 0.5) {
            const r = takeBlow(f.dmg, f.x, f.z, 'warrior', f);
            if (r.result === 'parry') { f.state = 'stun'; f.t = 1.2; continue; }
          }
          f.state = 'chase'; f.t = f.rest;
        }
      }
    }
  }
  function entities() {
    const out = foes.concat(bolts.filter(b => b.t >= 0).map(b => ({ x: b.x, y: b.y, z: b.z, yaw: 0, scale: 1, hover: 0, skyMul: 1, isFx: true, noOutline: true, mesh: R.entityMesh('fx:raybolt:me', (mb) => { mb.blob(-0.1, -0.1, -0.1, 0.1, 0.1, 0.1, 1, [0.5, 1.0, 1.0], { emis: true, n: 3 }); mb.blob(-0.05, -0.05, -0.05, 0.05, 0.05, 0.05, 1, [1, 1, 1], { emis: true, n: 2 }); }) })), shots.map(s => s.ray ? { x: s.x, y: s.y, z: s.z, yaw: 0, scale: 1, hover: 0, skyMul: 1, isFx: true, noOutline: true, mesh: R.entityMesh('fx:raybolt:foe', (mb) => { mb.blob(-0.12, -0.12, -0.12, 0.12, 0.12, 0.12, 1, [1.0, 0.35, 0.3], { emis: true, n: 3 }); mb.blob(-0.06, -0.06, -0.06, 0.06, 0.06, 0.06, 1, [1, 0.9, 0.8], { emis: true, n: 2 }); }) } : s.hex ? { x: s.x, y: s.y, z: s.z, yaw: 0, scale: 1, hover: 0, skyMul: 1, isFx: true, noOutline: true, mesh: R.entityMesh('fx:hexbolt', (mb) => { mb.blob(-0.14, -0.14, -0.14, 0.14, 0.14, 0.14, 1, [0.75, 0.3, 1.0], { emis: true, n: 3 }); mb.blob(-0.07, -0.07, -0.07, 0.07, 0.07, 0.07, 1, [1, 0.9, 1], { emis: true, n: 2 }); }) } : ({ x: s.x, y: s.y, z: s.z, yaw: Math.atan2(s.vx, s.vz), scale: 1, hover: 0, skyMul: 1, isFx: true, noOutline: true, mesh: R.entityMesh('fx:foearrow2', (mb) => { mb.tube([[0, 0, -0.4], [0, 0, 0.36]], [0.02, 0.02], [0.55, 0.4, 0.22], { segs: 5, cap0: 'none', cap1: 'none' }); mb.plate([[0, 0.0, 0.36], [0.04, 0, 0.3], [0, 0, 0.5], [-0.04, 0, 0.3]], 0.01, [0.6, 0.62, 0.66]); for (const sgn of [-1, 1]) mb.plate([[0, 0, -0.4], [sgn * 0.06, 0.02, -0.3], [0, 0, -0.2]], 0.006, [0.9, 0.9, 0.92]); }) })));
    if (swoosh) { const p = G.player; const u = swoosh.t / swoosh.dur; const f0 = U.forwardVec(swoosh.yaw, 0); out.push({ x: p.x + f0[0] * 0.3, y: p.y + 1.0 + swoosh.pitch * 0.6, z: p.z + f0[2] * 0.3, yaw: swoosh.yaw + (u - 0.5) * swoosh.wide * 0.6, scale: 1, hover: 0, skyMul: 1, isFx: true, noOutline: true, alpha: (1 - u) * 0.55,
      mesh: R.entityMesh('swoosh:' + Math.round(swoosh.wide * 10) + ':' + Math.round(swoosh.reach * 10), (mb) => { const r0 = Math.max(0.3, swoosh.reach - 0.7), r1 = swoosh.reach + 0.2, W = swoosh.wide; const pts = []; const N = 9; for (let i = 0; i <= N; i++) { const a = -W / 2 + W * i / N; pts.push([Math.sin(a) * r1, (i / N - 0.5) * -0.25, -Math.cos(a) * r1]); } for (let i = N; i >= 0; i--) { const a = -W / 2 + W * i / N; pts.push([Math.sin(a) * r0, (i / N - 0.5) * -0.25, -Math.cos(a) * r0]); } mb.plate(pts, 0.01, [1.0, 0.98, 0.9], { emis: true }); }) }); }
    return out; }
  function forHold(id) { return foes.filter(f => f.holdId === id); }
  function clearHold(id) { for (let i = foes.length - 1; i >= 0; i--) if (foes[i].holdId === id) foes.splice(i, 1); }
  function standingIn(id) { return foes.filter(f => f.holdId === id && f.state !== 'down').length; }
  function focusText() { const f = G.foeFocus; if (!f || !(G.foeFocusT > 0)) return Wild.focusText ? Wild.focusText() : null; return f.state === 'down' ? `${f.name}: down` : `${f.name}: ${Math.max(0, Math.round(f.hp / f.max * 100))}%`; }
  // the same, as a target: name, state word and a 0..1 health fraction for the HUD bar
  function focus() {
    const f = G.foeFocus; if (f && G.foeFocusT > 0) return { name: f.name, note: f.state === 'down' ? 'down' : '', frac: Math.max(0, Math.min(1, f.hp / f.max)), kind: 'foe' };
    const e = G.kinFocus; if (e && G.kinFocusT > 0) { const st = KIN.stats(e.kin); return { name: `${KIN.name(e.kin)} Lv ${e.kin.level}`, note: e.dazed > 0 ? 'dazed' : (Wild.unfinishable && Wild.unfinishable(e) ? 'only a Kin can finish it' : ''), frac: Math.max(0, Math.min(1, e.kin.hp / st.hp)), kind: 'kin' }; }
    return null;
  }
  function reset() { foes.length = 0; shots.length = 0; bolts.length = 0; }
  return { slashEntity, cond, broken, use, bow, anyBow, mend, mendQuote, lifeOf, BOWS, rack, ARMOUR, worn, armourPts, armourCut, wornPerk, init, GEAR, ARROWS, armoury, weapon, shield, chopTier, spawn, beam, warriorModel, swing, arrowHit, takeBlow, nearestFoe, hurtFoe, update, entities, forHold, clearHold, standingIn, focusText, focus, reset, blocking, KINDS };
})();
