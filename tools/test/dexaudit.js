const run = require('./kinprobe.js');
console.log(run(`(() => { const out = [], D = (b) => KIN.dex(b), dom = (sp) => KIN.dominant(sp.elem, 1)[0]; const chk = (label, arr) => out.push((arr && arr.length ? "ok   " : "EMPTY ") + label + ": " + (arr || []).length + " " + (arr || []).slice(0, 4).map(x => x.names[0]).join(","));
 chk("earth raptor dino", D("earth").filter(x => x.dino && x.shape === "raptor"));
 chk("earth sky bird/floater r<=1", D("earth").filter(sp => sp.home && sp.home.layer === "Sky" && (sp.shape === "bird" || sp.shape === "floater") && sp.rarity <= 1));
 chk("earth bird", D("earth").filter(sp => sp.shape === "bird"));
 chk("earth water fish r<=1", D("earth").filter(sp => sp.home && sp.home.layer === "Water" && sp.shape === "fish" && sp.rarity <= 1));
 chk("halo !legend", D("halo").filter(sp => !sp.legend && !sp.mythic));
 chk("keeps void r2-3", D("earth").filter(sp => !sp.fusion && sp.home && (sp.rarity || 0) >= 2 && (sp.rarity || 0) <= 3 && dom(sp) === "Void"));
 chk("keeps r2", D("earth").filter(sp => !sp.fusion && sp.home && (sp.rarity || 0) === 2));
 for (const b of ["earth","moon","halo"]) chk(b + " npcs r2 surface", D(b).filter(sp => sp.rarity === 2 && sp.home && sp.home.layer === "Surface"));
 chk("farms r2 surface non serpent/bird", D("earth").filter(sp => !sp.fusion && sp.home && sp.home.layer === "Surface" && (sp.rarity || 0) === 2 && sp.shape !== "serpent" && sp.shape !== "bird"));
 chk("garrison moon r>=2", D("moon").filter(sp => !sp.legend && !sp.mythic && (sp.rarity || 0) >= 2));
 chk("harvest halo quadruped no wings", D("halo").filter(sp => sp.shape === "quadruped" && !sp.legend && !sp.mythic && !(sp.feat && sp.feat.wings)));
 chk("village earth r<=1 not core", D("earth").filter(sp => !sp.fusion && sp.home && sp.home.layer !== "Core" && (sp.rarity || 0) <= 1));
 chk("village earth surface r1 non-serpent", D("earth").filter(sp => !sp.fusion && sp.home && sp.home.layer === "Surface" && (sp.rarity || 0) === 1 && sp.shape !== "serpent"));
 chk("roads halo quadruped", D("halo").filter(sp => sp.shape === "quadruped" && !sp.legend && !sp.mythic));
 chk("sky r>=2 Sky", D("earth").filter(sp => !sp.fusion && sp.home && sp.home.layer === "Sky" && (sp.rarity || 0) >= 2));
 chk("sky r3", D("earth").filter(sp => !sp.fusion && (sp.rarity || 0) === 3));
 chk("sky r>=1 Sky", D("earth").filter(sp => !sp.fusion && sp.home && sp.home.layer === "Sky" && (sp.rarity || 0) >= 1));
 for (const b of ["earth","moon","halo"]) { chk(b + " steeds", D(b).filter(x => x.steed)); for (const [L, bn] of KIN.HABITATS[b]) { const h = KIN.habitat(b, L, bn), ro = KIN.roster(b, 3, 5, L, bn); out.push("   " + b + " " + L + "/" + bn + ": " + h.map(x => x.names[0] + "(" + x.rarity + ")").join(" ") + (ro.length !== h.length ? "  ROSTER " + ro.length : "")); if (!h.some(x => !x.rarity)) out.push("NO COMMON in " + b + " " + L + "/" + bn); } }
 for (const b of ["earth","moon","halo"]) { const rc = KIN.recipes(b), keys = new Set(); let dup = 0, self = 0, nobody = 0; for (const r of rc) { const k = r.parts.map(x => x.seed).sort().join(":"); if (keys.has(k)) dup++; keys.add(k); if (new Set(r.parts).size !== r.parts.length) self++; if (!KIN.lineOf(r.out)) nobody++; if (r.alt && !KIN.lineOf(r.alt.out)) nobody++; }
   out.push(b + " recipes " + rc.length + " dup " + dup + " self " + self + " bodiless " + nobody + " | " + rc.slice(0, 4).map(r => r.parts.map(x => x.names[0]).join("+") + "=" + r.out.names[0] + "[" + (KIN.lineOf(r.out) || [["?","?","?"]])[0][1] + "]").join("  ")); 
   const forks = rc.filter(r => r.alt); out.push("   forks " + forks.map(r => r.out.names[0] + "[" + KIN.lineOf(r.out)[0][1] + "]/" + r.alt.out.names[0] + "[" + KIN.lineOf(r.alt.out)[0][1] + "]").join("  ")); }
 const st = KIN.starters(1); out.push("starters " + st.map(x => x.names[0] + " r" + x.rarity + " dex" + x.dex).join(", "));
 return out.join("\\n"); })()`));
