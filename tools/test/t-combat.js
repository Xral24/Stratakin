const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-1');
  const r = await ev(() => { const out = {}; const G0 = Object.values(Combat.GEAR); out.counts = { swords: G0.filter(g => g.kind === 'sword').length, axes: G0.filter(g => g.kind === 'axe').length, shields: G0.filter(g => g.kind === 'shield').length, arrows: Object.keys(Combat.ARROWS).length };
    out.samples = ['sw_wood_short', 'sw_iron_long', 'sw_diamond_great', 'ax_star_great', 'sh_wood_buckler', 'sh_diamond_tower'].map(id => { const g = Combat.GEAR[id]; return `${g.name}: ${g.dmg || ''}${g.block ? 'block ' + Math.round(g.block * 100) + '%' : ''} ◆${g.price}`; });
    // fight: put a hold's warriors next to the player
    const k = Keeps.sites()[0], p = G.player, w = G.world; G.repelUntil = 0; p.x = k.x + 0.5; p.z = k.z - 6; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 2, 9999);
    G.stats.keeps = G.stats.keeps || {}; G.stats.keeps['stamped_' + k.id] = true; Keeps.update(1, p); Keeps.update(1, p); out.foes = Combat.forHold(k.id).map(f => f.name + ' ' + f.hp).join(', ');
    p.y = k.y + 1.05; p.add('sw_iron_long', 1); p.add('sh_iron_heater', 1); p.sel = p.hotbar().indexOf('sw_iron_long'); out.weapon = Combat.weapon() && Combat.weapon().name; out.shield = Combat.shield() && Combat.shield().name;
    const f = Combat.forHold(k.id)[0]; f.x = p.x; f.z = p.z - 1.5; p.yaw = 0; let swings = 0, hp0 = p.hp;
    for (let i = 0; i < 600 && f.state !== 'down'; i++) { Combat.update(1 / 30, p, { mine: false }); if (Combat.swing()) swings++; }
    out.killSwings = swings; out.hpLost = hp0 - p.hp; out.fstate = f.state; out.focus = Combat.focusText();
    out.trader = Village.SHOPS ? 'n/a' : ''; return out; });
  console.log(JSON.stringify(r, null, 1)); console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
