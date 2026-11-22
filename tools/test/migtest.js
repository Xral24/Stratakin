const run = require('./kinprobe.js');
console.log(run(`(() => { const out = []; KIN.dex("earth"); let n = 0, moved = 0; const tally = {};
 for (const b of ["earth","moon","halo"]) for (const [L, bn] of KIN.HABITATS[b]) { const olds = []; 
   // reach the old generator through migrateSeed: build fake kin from old species found by seed scanning
 }
 // old species: regenerate via migrateSeed on known old seeds is indirect; use keptFor on synthetic old-style species
 const mk = (body, layer, biome, el, shape, extra) => Object.assign(KIN.species(123456 + n++, [el], 0, { primary: el, shape, neon: body !== "earth" }), { home: { body, layer, biome } }, extra || {});
 for (const [body, el, shape, ex] of [["earth","Flame","quadruped"],["earth","Tide","fish"],["earth","Void","serpent"],["earth","Light","floater"],["earth","Stone","longneck",{dino:true}],["earth","Stone","serpent",{dino:true}],["earth","Gale","quadruped",{steed:true}],["moon","Void","bird"],["moon","Tide","quadruped"],["halo","Bloom","blob"],["halo","Frost","fish"]]) {
   const sp = mk(body, "Surface", "Plains", el, shape, ex), k = KIN.create(sp, 33); k.stage = 3; k.hp = 9999; const c = KIN.migrateKin(k); out.push(body + " " + el + " " + shape + (ex ? JSON.stringify(ex) : "") + " -> " + (c ? k.sp.names[0] + " stage " + k.stage + " hp " + k.hp + " [" + KIN.dominant(k.sp.elem,1)[0] + " " + k.sp.shape + "]" : "unchanged")); }
 const st = KIN.create(KIN.starters(1)[0], 5); out.push("starter kin: " + KIN.name(st) + " migrate " + KIN.migrateKin(st));
 const fz = KIN.fuse([KIN.create(KIN.dex("earth")[0], 20), KIN.create(KIN.dex("earth")[10], 22)], ["Flame"]); out.push("free fusion: " + KIN.name(fz) + " shape " + fz.sp.shape + " line " + JSON.stringify(KIN.lineOf(fz.sp)[0]) + " lineRef " + JSON.stringify(fz.sp.lineRef) + " migrate " + KIN.migrateKin(fz));
 const fm = KIN.fuse([KIN.create(KIN.dex("moon")[0], 20), KIN.create(KIN.dex("moon")[8], 22)], []); out.push("moon fusion: " + KIN.name(fm) + " shape " + fm.sp.shape + " line " + JSON.stringify(KIN.lineOf(fm.sp)[0]) + " natPick " + fm.sp.natPick);
 const m = KIN.model(KIN.dex("earth")[8], 3); out.push("horse model parts " + (m.parts ? m.parts.length : "?"));
 for (const b of ["earth","moon","halo"]) for (const sp of KIN.dex(b)) for (let stg = 1; stg <= KIN.maxStage(sp); stg++) { try { const mm = KIN.model(sp, stg); if (!mm || !mm.parts || !mm.parts.length) out.push("EMPTY MODEL " + sp.names[0] + " " + stg); } catch (e) { out.push("MODEL ERR " + sp.names[0] + " " + stg + ": " + e.message); } }
 out.push("models built"); return out.join("\\n"); })()`));
