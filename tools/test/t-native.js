const { open } = require('./harness'); const fs = require('fs');
(async () => { const h = await open(); const { ev } = h; await h.newGame('gal-1'); await h.calm();
  const body = process.env.BODY || 'moon'; const ids = JSON.parse(process.env.IDS || 'null'); const els = JSON.parse(process.env.ELS || '["Stone","Void","Light","Frost","Gale","Spark","Flame"]'); const S = +(process.env.S || 300);
  const out = await ev(([body, ids, els, S]) => { const N = KIN.NATIVE[body]; const list = []; for (const sh in N) for (const id of N[sh]) if (!list.some(x => x[0] === id) && (!ids || ids.includes(id))) list.push([id, sh]);
    const cv0 = document.createElement('canvas'); cv0.width = S * 3; cv0.height = S * list.length; const ctx = cv0.getContext('2d'); ctx.fillStyle = body === 'moon' ? '#2a2f52' : '#d8a860'; ctx.fillRect(0, 0, cv0.width, cv0.height); const errs = [];
    list.forEach(([id, sh], r) => { const el = els[r % els.length]; const sp = KIN.species(U.combine(0x7171, r * 31 + 5), [el], 1, { primary: el, shape: sh, total: 360, rarity: 1, neon: true }); sp.home = { body, layer: 'Surface', biome: 'Mare' }; sp._line = KIN.nativeLine(id, sh); KIN.nativize(sp);
      for (let st = 1; st <= 3; st++) { try { const cv = document.createElement('canvas'); KIN.portrait(cv, sp, st, S); ctx.drawImage(cv, (st - 1) * S, r * S, S, S); } catch (e) { errs.push(id + ' ' + st + ': ' + e.message); } }
      ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.fillText(id + ' / ' + el, 6, r * S + 16); });
    return { png: cv0.toDataURL("image/png"), errs }; }, [body, ids, els, S]);
  fs.writeFileSync(process.env.OUTF || '/home/claude/native.png', Buffer.from(out.png.split(',')[1], 'base64')); console.log('MODEL ERRORS:', out.errs.length ? out.errs.join('\n') : 'none'); console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
