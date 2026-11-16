const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  const r = await ev(() => { R.render = () => {}; const p = G.player, out = {}; G.stats.buddyOff = false; const toasts = []; const t0 = UI.toast; UI.toast = (m) => { toasts.push(m); }; for (let i = 0; i < 40; i++) Buddy.update(0.05, p);
    const k = G.kin[G.activeIdx || 0]; out.lead = k && KIN.name(k); const e = Buddy.current(); out.has = !!e; if (!e) return out; out.temper = e.model.temper; Buddy.tap(); out.t1 = toasts.pop(); out.bond1 = k.bond; for (let i = 0; i < 10; i++) Buddy.update(0.05, p); out.face = e.face && +e.face.lid.toFixed(2);
    k.bond = 0.95; Buddy.tap(); out.t2 = toasts.pop(); p.vx = p.vz = 0; for (let i = 0; i < 500; i++) Buddy.update(0.05, p); out.afterStill = e.face ? +e.face.lid.toFixed(2) : null; out.emotes = document.querySelectorAll('body > div[style*="900 26px"]').length; UI.toast = t0; return out; });
  console.log(JSON.stringify(r)); console.log('ERRORS:', h.errors.slice(0, 3).join(' | ') || 'none'); await h.close(); })();
