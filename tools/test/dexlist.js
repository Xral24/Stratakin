const run = require('./kinprobe.js');
console.log(run(`(() => { const out = []; let all = 0; for (const b of ["earth","moon","halo"]) { const d = KIN.dex(b); out.push(b + " dex " + d.length + " natural " + d.filter(x=>!x.fusion).length + " fusion " + d.filter(x=>x.fusion).length);
  let forms = 0; for (const sp of d) { if (sp.fusion) continue; const n = KIN.maxStage(sp); forms += n; const L = KIN.lineOf(sp); out.push("  #" + sp.dex + " " + sp.names.filter((x,i,a)=>a.indexOf(x)===i).slice(0, n).join(">") + " [" + KIN.dominant(sp.elem,1)[0] + " " + sp.shape + " r" + sp.rarity + (sp.steed?" steed":"") + "] " + (L ? L.map(f=>f[2]||f[1]).filter((x,i,a)=>a.indexOf(x)===i).join(">") : "NO LINE") + " @ " + sp.homes.map(h=>h[0]==="Surface"?h[1]:h[0]).join(",")); }
  out.push("  forms " + forms); all += forms; }
 out.push("ALL FORMS " + all); return out.join("\\n"); })()`));
