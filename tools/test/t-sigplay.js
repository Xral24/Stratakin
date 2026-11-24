// node t-sigplay.js [x_rex | f_e5 | f_m3d ...]
// A legendary (or a fused Kin) of your own in a fight: its signature shows as a ★ button, plays its own picture and sound, then rests two turns before it can be thrown again.
const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await page.setViewportSize({ width: 844, height: 390 }); await h.newGame('gal-1'); await h.calm(); const WHO = process.argv[2] || 'x_rex'; await ev((w) => { window.__who = w; }, WHO);
  await ev(() => { const WHO = window.__who; const fm = /^f_([emh])(\d+)(d?)$/.exec(WHO); const rc = fm ? KIN.recipes({ e: 'earth', m: 'moon', h: 'halo' }[fm[1]])[+fm[2]] : null; const k = KIN.create(fm ? (fm[3] ? rc.alt.out : rc.out) : KIN.apexSpecies('rex'), 12); G.kin[G.activeIdx] = k; const p = G.player; const r = KIN.roster('earth', 0, 0, 'Surface', 'Plains', 0); const e = Wild.makeEntity(r[0], 3, p.x + 3, p.y, p.z + 3); Wild.list.push(e); Battle.start(e, false); e.kin.hp = 999999;
    const F = window.__s = { log: [], used: 0, sprites: 0, snd: false, steps: 0 }; let last = '';
    F.iv = setInterval(() => { if ((Battle.fxSprites() || []).some(x => x.name.indexOf('sig_' + window.__who) === 0)) { F.sprites++; F.snd = F.snd || Battle.fxSound; } const bs = [...document.querySelectorAll('button.act.move')]; if (!bs.length || bs.every(b => b.disabled)) return;
      const sg = bs.find(b => b.classList.contains('sig')); if (!sg) { F.log.push('no sig button'); clearInterval(F.iv); return; }
      const state = (sg.disabled ? 'rest' : 'ready') + ':' + sg.querySelector('small').textContent.slice(0, 28); if (bs.some(b => !b.disabled) && state !== last) { last = state; F.log.push(state); }
      if (F.steps >= 5) { clearInterval(F.iv); F.done = true; return; }
      if (!sg.disabled) { sg.click(); F.used++; F.steps++; last = ''; } else { const o = bs.find(b => !b.disabled && /phys|spec/.test(b.textContent)); if (o) { o.click(); F.steps++; last = ''; } } }, 80); });
  await page.waitForTimeout(3000);
  let st; const t0 = Date.now(); while (Date.now() - t0 < 420000) { st = await ev(() => { const F = window.__s; return { log: F.log, used: F.used, sprites: F.sprites, snd: F.snd, steps: F.steps, done: !!F.done, active: Battle.active }; }); if (st.done || !st.active) break; await page.waitForTimeout(1500); }
  try { await page.screenshot({ path: '/home/claude/scratch/sigplay-bar.png', timeout: 120000 }); } catch (e) { console.log('no shot'); }
  console.log(JSON.stringify(st)); const rest = st.log.filter(x => x.startsWith('rest')).length;
  console.log(st.used >= 2 && rest >= 2 && st.log[0].startsWith('ready') && st.sprites > 0 && st.snd ? 'PASS' : 'FAIL'); console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
