// Full sweep: every world, day and night, plus a frame-rate reading.
import { chromium } from '/Users/emmanuelmkandawire/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, process.argv[2] || 'sweep'); fs.mkdirSync(out, { recursive: true });
const URL = 'file://' + path.join(here, '..', 'dimension-cat', 'dist', 'dimension_cat.html');
const shot = (page, n) => page.screenshot({ path: path.join(out, n + '.jpg'), type: 'jpeg', quality: 78 });
const settle = (page, s) => page.evaluate(async (s) => { const g = window.DC, t0 = g.time; while (g.time - t0 < s) await new Promise((r) => setTimeout(r, 25)); }, s);
const b = await chromium.launch({ headless: true, executablePath: '/Users/emmanuelmkandawire/Library/Caches/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ["--use-angle=metal","--ignore-gpu-blocklist","--enable-gpu"] });
const page = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
await page.goto(URL); await page.waitForFunction(() => window.DC && !document.getElementById('enter').disabled, null, { timeout: 90000 });
await page.click('#enter'); await settle(page, 1);
const fps = () => page.evaluate(async () => { const t0 = performance.now(); let n = 0; await new Promise(r => { const tick = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else r(); }; requestAnimationFrame(tick); }); return +(n / ((performance.now() - t0) / 1000)).toFixed(0); });
const worlds = [[0,'start','0hood'],[1,'from-hub','1candy'],[2,'from-prev','2robot'],[3,'from-prev','3victorian'],[4,'from-hub','4beach'],[5,'from-hub','5snow'],[6,'from-hub','6forest']];
for (const [i, e, n] of worlds) {
  if (i) { await page.evaluate(([i, e]) => window.DC.travel(i, e), [i, e]); await page.waitForTimeout(2400); await settle(page, 1.2); }
  for (const t of ['day', 'night']) {
    await page.evaluate(t => window.DC.setTime(t), t); await settle(page, 1.0);
    // look around from the spawn
    for (const [k, yaw] of [[0, 0], [1, Math.PI / 2], [2, Math.PI], [3, -Math.PI / 2]]) {
      await page.evaluate(([yaw]) => { const g = window.DC; g.cam.yaw = yaw; g.cam.pitch = 0.22; g.cam.dist = 8; g.cam.curDist = 8; g.updateCamera(0, true); }, [yaw]);
      await settle(page, 0.25); await shot(page, `${n}-${t}-${k}`);
    }
  }
  await page.evaluate(() => window.DC.setTime('auto'));
  console.log(n, 'fps', await fps());
}
console.log('errors', errs.length, errs.slice(0, 6));
await b.close();
