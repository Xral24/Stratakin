const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', -1); await page.waitForTimeout(3000);
  console.log(JSON.stringify(await ev(() => { G.world.time = 0.4; const m = First.maren; if (!m) return 'no maren'; if (!Dialogue.active()) { if (m.onTalk) m.onTalk(); else Village.talk(m); } return { dlg: Dialogue.active(), talk: G.talkNpc && G.talkNpc.name, model: !!m.model.bones[10], kind: m.model.bones[10] && m.model.bones[10].kind }; })));
  for (const [v, name] of [[1, 'open'], [0, 'shut']]) { await ev((v) => { const m = G.talkNpc || First.maren; Object.defineProperty(m, 'talkOpen', { configurable: true, get: () => v, set() {} }); }, v); await page.waitForTimeout(13000); await page.screenshot({ path: '/home/claude/scratch/mouth-' + name + '.png', timeout: 150000 }); }
  console.log(JSON.stringify(await ev(() => { const m = G.talkNpc || First.maren; delete m.talkOpen; return 1; })));
  console.log('errors', JSON.stringify(h.errors.slice(0, 4))); await h.close(); })();
