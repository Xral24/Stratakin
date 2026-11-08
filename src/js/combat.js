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
  const BOWS = { bow: { life: 170, price: 120 }, bow_painted: { life: 90, price: 60 } };
  function lifeOf(id) { const g = GEAR[id], a = ARMOUR[id], b = BOWS[id]; if (b) return b.life; if (a) return 70 + a.tier * 35; if (g) return g.kind === 'shield' ? 60 + g.tier * 30 : 90 + g.tier * 45; return 0; }
  function priceOf(id) { const g = GEAR[id], a = ARMOUR[id], b = BOWS[id]; return (b && b.price) || (g && g.price) || (a && a.price) || 60; }
  const wearMap = () => { if (!G.stats.gwear) G.stats.gwear = {}; return G.stats.gwear; };
  function cond(id) { const L = lifeOf(id); if (!L) return 1; return Math.max(0, 1 - (wearMap()[id] || 0) / L); }
  const broken = (id) => lifeOf(id) > 0 && cond(id) <= 0;
  function use(id, n) {
    const L = lifeOf(id); if (!L || !G.player.has(id)) return; const before = cond(id); const m = wearMap(); m[id] = Math.min(L, (m[id] || 0) + (n || 1)); const after = cond(id); const nm = (ITEMS[id] || {}).name || id;
    if (after <= 0 && before > 0) { UI.toast(`Your ${nm} has broken. Take it to an ${ARMOUR[id] || (GEAR[id] && GEAR[id].kind === 'shield') ? 'armourer' : 'armoury'} to have it mended.`, 'bad'); UI.sfx('hurt'); }
    else if (after <= 0.2 && before > 0.2) UI.toast(`Your ${nm} is wearing thin. Get it mended before it goes.`, 'bad');
    if (UI.renderHotbar) UI.renderHotbar();
  }
  function bow() { const p = G.player; let best = null; for (const k in BOWS) if (p.has(k) && !broken(k) && (!best || BOWS[k].life > BOWS[best].life)) best = k; return best; }
  function anyBow() { return Object.keys(BOWS).some(k => G.player.has(k)); }
  // what the smith wants: cheap while it is only scuffed, steep once it has broken
  function mendList(what) { const p = G.player; const out = []; for (const k of p.inv.keys()) { const L = lifeOf(k); if (!L) continue; const isArm = !!ARMOUR[k] || (GEAR[k] && GEAR[k].kind === 'shield'); if ((what === 'armour') !== isArm) continue; const c = cond(k); if (c >= 0.999) continue; const miss = 1 - c; out.push({ id: k, c, cost: Math.max(5, Math.round((priceOf(k) * 0.5 * Math.pow(miss, 1.3) + (c <= 0 ? priceOf(k) * 0.3 : 0)) / 5) * 5) }); } return out; }
  function mendQuote(what) { return mendList(what).reduce((s, x) => s + x.cost, 0); }
  function mend(what) { const L = mendList(what); if (!L.length) { UI.toast('Nothing of yours needs mending.'); return false; } const cost = L.reduce((s, x) => s + x.cost, 0); if (G.shards < cost) { UI.toast(`Mending all of it comes to ${cost} shards.`, 'bad'); return false; } G.shards -= cost; const m = wearMap(); for (const x of L) delete m[x.id]; UI.sfx('caught'); UI.toast(`Mended: ${L.map(x => (ITEMS[x.id] || {}).name).join(', ')}. Good as new.`, 'good'); if (UI.renderHotbar) UI.renderHotbar(); return true; }
  function init(game) {
    G = game; buildArmoury(); buildArmour();
    GEAR.sp_painted = { id: 'sp_painted', kind: 'spear', name: 'Painted Spear', dmg: 9, cd: 0.7, reach: 3.8, arc: 0.6, crit: 0.08, tier: 1, col: '#b0603a', price: 90 };
    ITEMS.sp_painted = { name: 'Painted Spear', col: '#b0603a', melee: true, keep: true, tier: 1, desc: 'A Painted spear: 9 damage, the longest reach of anything you can hold (3.8). Hits one foe at a time. Plain, and it wears out quicker than forged steel.' };
    ITEMS.bow_painted = { name: 'Painted Bow', col: '#9a6a3a', keep: true, bow: true, desc: 'A plain Painted hunting bow. Shoots like any bow, but it wears out about twice as fast as a good one.' };
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
    const mendE = (what) => { const L = mendList(what); return { service: 'mend', what, name: L.length ? `Mend your ${what === 'armour' ? 'armour and shields' : 'blades, spears and bows'} (${L.length} worn${L.some(x => x.c <= 0) ? ', some broken' : ''})` : `Mending: nothing of yours needs it`, price: mendQuote(what) }; };
    if (kind === 'armoury') return [mendE('arms')].concat(pick(near(Object.values(GEAR).filter(g => g.kind !== 'shield' && g.kind !== 'spear')), size === 'city' ? 8 : 5, 7).map(g => ({ item: g.id, price: g.price })));
    if (kind === 'armourer') return [mendE('armour')].concat(pick(near(Object.values(ARMOUR)), size === 'city' ? 6 : 4, 3).map(a => ({ item: a.id, price: a.price })), pick(near(Object.values(GEAR).filter(g => g.kind === 'shield')), 3, 11).map(g => ({ item: g.id, price: g.price })));
    if (kind === 'trader') return armoury(v);
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
    captain: { name: 'Bound Captain', hp: 90, dmg: 2, speed: 2.5, reach: 2.2, wind: 0.65, rest: 1.0, deco: 'captain', block: 0.5, cols: { body: '#241c30', belly: '#c9b48a', accent: '#b026ff' } },
  };
  function warriorModel(kind, freed) {
    const K = KINDS[kind]; const sp = { shape: 'biped', feat: { crest: false, ears: false, horns: false, spikes: false, tail: false, wings: false, bigEyes: false }, colors: Object.assign({ dark: '#120818', eye: freed ? '#ffe08a' : '#c04cff' }, K.cols), size: 1, gen: 0, names: ['warrior'] };
    const m = KIN.model(sp, 2); const s = m.scale; const add = (x, y, z, w, h, d, c, emis) => m.boxes.push({ x: x * s, y: y * s, z: z * s, w: w * s, h: h * s, d: d * s, c, emis });
    add(-0.34, 1.72, -0.32, 0.68, 0.3, 0.64, '#2a2a34'); add(-0.36, 1.68, 0.28, 0.72, 0.06, 0.06, K.cols.accent); // helmet and band
    add(-0.42, 1.05, -0.26, 0.84, 0.5, 0.06, '#3a3a46'); // breastplate edge
    if (K.deco === 'sword' || K.deco === 'captain') { add(0.46, 0.7, 0.18, 0.08, 1.1, 0.08, '#c8c8d0'); add(0.4, 0.68, 0.14, 0.2, 0.06, 0.16, '#6b4a2b'); }
    if (K.deco === 'axe') { add(0.46, 0.4, 0.18, 0.07, 1.4, 0.07, '#6b4a2b'); add(0.38, 1.55, 0.12, 0.26, 0.34, 0.08, '#b8b8c4'); }
    if (K.deco === 'shield' || K.deco === 'captain') add(-0.6, 0.55, -0.05, 0.1, 0.85, 0.65, K.cols.accent);
    if (K.deco === 'bow') { add(0.44, 0.5, 0.15, 0.06, 1.3, 0.06, '#6b4a2b'); add(-0.3, 1.0, -0.42, 0.18, 0.7, 0.16, '#5a3f22'); }
    if (K.deco === 'captain') { for (let i = 0; i < 3; i++) add(-0.2 + i * 0.15, 2.0, -0.05, 0.08, 0.3, 0.08, '#b026ff', true); add(-0.4, 0.4, -0.38, 0.8, 1.1, 0.05, '#3a1458'); }
    return m;
  }
  function spawn(kind, x, y, z, holdId, level) {
    const K = KINDS[kind]; const m = warriorModel(kind, false); const lv = level || 0;
    const f = { kind, name: K.name, x, y, z, yaw: 0, hx: x, hz: z, model: m, mesh: R.entityMesh('foe:' + kind, (mb) => KIN.buildMesh(mb, m)), scale: 1, hover: 0, skyMul: 1,
      hp: Math.round(K.hp * (1 + lv * 0.45)), max: Math.round(K.hp * (1 + lv * 0.45)), dmg: K.dmg + Math.floor(lv / 2), speed: K.speed, reach: K.reach, wind: K.wind, rest: K.rest, block: K.block || 0, archer: !!K.archer,
      state: 'idle', t: 0, aware: false, holdId, lv, burn: 0, bleed: 0, slowT: 0, stun: 0, hitT: 0, isFoe: true };
    foes.push(f); return f;
  }
  const shots = []; // the archers' arrows
  function down(f, how) {
    f.state = 'down'; f.hp = 0; f.t = 0; f.hover = -0.55; UI.sfx('win');
    const P = G.player; const gold = weapon() && weapon().fx === 'loot' ? 2 : 1; const sh = Math.round((8 + f.lv * 6) * gold * (f.kind === 'captain' ? 3 : 1)); G.shards += sh;
    let msg = `${f.name} drops to his knees, dazed. +${sh} shards.`;
    if (Math.random() < 0.25 + (f.kind === 'captain' ? 0.5 : 0)) { const pool = Object.values(GEAR).filter(g => g.tier >= f.lv && g.tier <= f.lv + 2); const g = pool[Math.floor(Math.random() * pool.length)]; if (g && !P.has(g.id)) { P.add(g.id, 1); msg += ` He drops a ${g.name}.`; } }
    if (Math.random() < 0.18 + (f.kind === 'captain' ? 0.3 : 0)) { const ap = Object.values(ARMOUR).filter(a => a.tier >= f.lv && a.tier <= f.lv + 2); const a = ap[Math.floor(Math.random() * ap.length)]; if (a && !P.has(a.id)) { P.add(a.id, 1); msg += ` And a ${a.name}.`; } }
    if (Math.random() < 0.4) { const a = ['arrow', 'arrow_frost', 'arrow_spark', 'arrow_barbed', 'arrow_heavy'][Math.min(4, Math.floor(Math.random() * (2 + f.lv)))]; P.add(a, 3); }
    UI.toast(msg, 'good'); UI.renderHotbar && UI.renderHotbar();
  }
  function hurt(f, dmg, opts = {}) {
    if (f.state === 'down') return;
    const sh = shield(); void sh;
    let d = dmg; const facing = Math.cos(Math.atan2(G.player.x - f.x, G.player.z - f.z) - f.yaw) > 0.3;
    if (f.block && facing && f.state !== 'stun' && !opts.pierce) { const half = opts.halfPierce ? 0.5 : 1; d = Math.round(d * (1 - f.block * half)); }
    if (!f.aware) { d *= 2; f.aware = true; } // caught unawares: double
    f.hp -= Math.max(1, d); f.hitT = 0.25; f.aware = true;
    if (opts.burn) f.burn = Math.max(f.burn, opts.burn); if (opts.slow) f.slowT = Math.max(f.slowT, opts.slow); if (opts.bleed) f.bleed = Math.max(f.bleed, opts.bleed);
    if (opts.stun) { f.state = 'stun'; f.t = opts.stun; }
    if (opts.knock) { const a = Math.atan2(f.x - G.player.x, f.z - G.player.z); f.x += Math.sin(a) * opts.knock; f.z += Math.cos(a) * opts.knock; }
    if (opts.sleep && f.hp > 0 && !f.wasAware) { f.hp = 0; }
    if (f.hp <= 0) down(f);
    G.foeFocus = f; G.foeFocusT = 4;
  }
  // tap with a weapon in hand: swing it
  let swingCd = 0, blockT = 0, armT = 0;
  function swing() {
    const sk = G.player.selected(); if (sk && GEAR[sk] && broken(sk)) { if (swingCd <= 0) { swingCd = 1; UI.toast(`Your ${GEAR[sk].name} is broken. An armoury will mend it.`, 'bad'); } return true; }
    const w = weapon(); if (!w || swingCd > 0) return false;
    swingCd = w.cd; G.player.swingT = 0.25; UI.sfx('miss');
    const p = G.player; const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw); let hit = false;
    for (const f of foes) {
      if (f.state === 'down') continue; const dx = f.x - p.x, dz = f.z - p.z, d = Math.hypot(dx, dz); if (d > w.reach + 0.4 || Math.abs(f.y - p.y) > 2) continue;
      const ang = Math.acos(U.clamp((dx * fx + dz * fz) / (d || 1), -1, 1)); if (ang > w.arc * 0.5 + 0.25) continue;
      const crit = Math.random() < w.crit; const dmg = Math.round(w.dmg * (0.9 + Math.random() * 0.2) * (crit ? 1.8 : 1) * (G.buffMul ? G.buffMul('blade') : 1));
      f.wasAware = f.aware;
      hurt(f, dmg, { burn: w.fx === 'burn' || w.fx === 'all' ? 3 : 0, slow: w.fx === 'slow' || w.fx === 'all' ? 2.5 : 0, halfPierce: w.fx === 'pierce' || w.fx === 'all' });
      if (crit) UI.toast('Critical!'); hit = true; if (w.kind !== 'axe') break; // a sword hits one, an axe cleaves through all in its arc
    }
    if (hit) { UI.sfx('hit'); use(w.id, 1); }
    return true;
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
  function update(dt, p, input) {
    swingCd = Math.max(0, swingCd - dt); if (p.swingT > 0) p.swingT -= dt;
    armT -= dt; if (armT <= 0) { armT = 1; const hb = G.buffOn ? G.buffOn('hearts') : null; const mx = 10 + (wornPerk('heart', true) ? 2 : 0) + (hb ? hb.amt : 0); if (p.maxHp !== mx) { p.maxHp = mx; if (p.hp > mx) p.hp = mx; } }
    // holding a weapon with a shield in the bag: hold means block, not dig
    const w = weapon(); const sh = shield();
    const wantBlock = !!(w && sh && input && input.mine);
    if (wantBlock && !p.blocking) blockT = 0; p.blocking = wantBlock; if (p.blocking) blockT += dt;
    if (G.foeFocusT > 0) G.foeFocusT -= dt;
    for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.vy -= 6 * dt;
      if (Math.abs(s.x - p.x) < 0.5 && Math.abs(s.z - p.z) < 0.5 && s.y > p.y && s.y < p.y + 1.9) { const fac = Math.cos(Math.atan2(s.x - p.x, s.z - p.z) - (p.yaw + Math.PI)) > 0.2; if (blocking() && fac) { UI.sfx('place'); use(shield().id, 1); } else { p.lastArrow = true; p.damage(s.dmg, 'warrior'); p.lastArrow = false; } shots.splice(i, 1); continue; }
      if (s.t > 3 || isSolid(G.world.getBlock(Math.floor(s.x), Math.floor(s.y), Math.floor(s.z)))) shots.splice(i, 1); }
    for (const f of foes) {
      f.t -= dt; if (f.hitT > 0) f.hitT -= dt;
      if (f.state === 'down') continue;
      if (f.burn > 0) { f.burn -= dt; if (Math.random() < dt * 1.2) { f.hp -= 2; if (f.hp <= 0) { down(f); continue; } } }
      if (f.bleed > 0) { f.bleed -= dt; if (Math.random() < dt * 1.5) { f.hp -= 2; if (f.hp <= 0) { down(f); continue; } } }
      if (f.slowT > 0) f.slowT -= dt;
      const dx = p.x - f.x, dz = p.z - f.z, d = Math.hypot(dx, dz);
      const sneakR = p.sneak ? 5 : 11; if (!f.aware && d < sneakR && Math.abs(p.y - f.y) < 4) f.aware = true;
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
          if (f.archer) { const tt = d / 16; shots.push({ x: f.x, y: f.y + 1.4, z: f.z, vx: dx / tt, vy: (p.y + 1.2 - f.y - 1.4) / tt + 3 * tt, vz: dz / tt, t: 0, dmg: f.dmg }); UI.sfx('miss'); }
          else if (d <= f.reach + 0.5) {
            const fac = Math.cos(Math.atan2(f.x - p.x, f.z - p.z) - (p.yaw + Math.PI)) > 0.2; const sh2 = shield();
            if (p.blocking && sh2 && fac) {
              use(sh2.id, 1); if (blockT < sh2.parry + 0.08) { f.state = 'stun'; f.t = 1.2; UI.sfx('hit'); UI.toast('Parried!'); continue; }
              const left = Math.round(f.dmg * (1 - sh2.block) * 10) / 10; if (left >= 1 || Math.random() < left) p.damage(Math.max(1, Math.round(left)), 'warrior'); UI.sfx('place');
            } else p.damage(f.dmg, 'warrior');
          }
          f.state = 'chase'; f.t = f.rest;
        }
      }
    }
  }
  function entities() { return foes.concat(shots.map(s => ({ x: s.x, y: s.y, z: s.z, yaw: Math.atan2(s.vx, s.vz), scale: 1, hover: 0, skyMul: 1, isFx: true, mesh: R.entityMesh('fx:foearrow', (mb) => mb.box(-0.03, -0.03, -0.35, 0.03, 0.03, 0.35, [0.5, 0.35, 0.2], 1, false)) }))); }
  function forHold(id) { return foes.filter(f => f.holdId === id); }
  function clearHold(id) { for (let i = foes.length - 1; i >= 0; i--) if (foes[i].holdId === id) foes.splice(i, 1); }
  function standingIn(id) { return foes.filter(f => f.holdId === id && f.state !== 'down').length; }
  function focusText() { const f = G.foeFocus; if (!f || !(G.foeFocusT > 0)) return null; return f.state === 'down' ? `${f.name}: down` : `${f.name}: ${Math.max(0, Math.round(f.hp / f.max * 100))}%`; }
  function reset() { foes.length = 0; shots.length = 0; }
  return { cond, broken, use, bow, anyBow, mend, mendQuote, lifeOf, BOWS, rack, ARMOUR, worn, armourPts, armourCut, wornPerk, init, GEAR, ARROWS, armoury, weapon, shield, chopTier, spawn, swing, arrowHit, update, entities, forHold, clearHold, standingIn, focusText, reset, blocking, KINDS };
})();
