const { open } = require('./harness');
(async () => { const h = await open(); await h.page.waitForTimeout(2500); console.log('ERRORS:', h.errors.slice(0, 3).join('\n') || 'none'); console.log('LOGS:', h.logs.filter(l => !/ReadPixels|TUNNEL/.test(l)).slice(0, 6).join('\n') || 'none'); await h.close(); })();
