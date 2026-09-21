// Walk out from the middle of each world to its edge, shooting as we go.
import { chromium } from '/Users/emmanuelmkandawire/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, process.argv[2] || 'tour'); fs.mkdirSync(out, { recursive: true });
const URL = 'file://' + path.join(here, '..', 'dimension-cat', 'dist', 'dimension_cat.html');
const shot = (page, n) => page.screenshot({ path: path.join(out, n + '.jpg'), type: 'jpeg', quality: 78 });
const settle = (page, s) => page.evaluate(async (s) => { const g = window.DC, t0 = g.time; while (g.time - t0 < s) await new Promise((r) => setTimeout(r, 25)); }, s);
const b = await chromium.launch({ headless: true, executablePath: '/Users/emmanuelmkandawire/Library/Caches/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ["--use-angle=metal","--ignore-gpu-blocklist","--enable-gpu"] });
const page = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push('pageerror: ' + e.message));
await page.goto(URL); await page.waitForFunction(() => window.DC && !document.getElementById('enter').disabled, null, { timeout: 90000 });
await page.click('#enter'); await settle(page, 1);
const worlds = [[1,'from-hub','candy',1],[2,'from-prev','robot',1],[3,'from-prev','victorian',1],[4,'from-hub','beach',-1],[5,'from-hub','snow',1],[6,'from-hub','forest',1]];
for (const [i, e, n, dirX] of worlds) {
  await page.evaluate(([i, e]) => window.DC.travel(i, e), [i, e]); await page.waitForTimeout(2400); await settle(page, 1);
  await page.evaluate(() => window.DC.setTime('day')); await settle(page, 0.6);
  const L = await page.evaluate(() => window.DC.physics.limit);
  for (const f of [0.25, 0.5, 0.75, 0.95]) {
    const d = Math.round(L * f);
    await page.evaluate(([d, dirX]) => { const g = window.DC; const x = d * dirX * 0.7, z = d * 0.7; const y = g.physics.ground0(x, z);
      g.cat.group.position.set(x, y + 0.1, z); g.cat.vy = 0; g.cam.yaw = Math.atan2(-x, -z); g.cam.pitch = 0.16; g.cam.dist = 9; g.cam.curDist = 9; g.updateCamera(0, true); }, [d, dirX]);
    await settle(page, 0.7); await shot(page, `${n}-r${Math.round(f * 100)}`);
  }
  const calls = await page.evaluate(() => { const g = window.DC; g.outline.enabled = false; g.render(); const c = g.renderer.info.render.calls; g.outline.enabled = true; return c; });
  const fps = await page.evaluate(async () => { const t0 = performance.now(); let k = 0; await new Promise(r => { const tick = () => { k++; if (performance.now() - t0 < 2500) requestAnimationFrame(tick); else r(); }; requestAnimationFrame(tick); }); return +(k / ((performance.now() - t0) / 1000)).toFixed(0); });
  console.log(n, 'limit', L, 'calls at the edge', calls, 'fps', fps);
}
console.log('errors', errs.length, errs.slice(0, 4));
await b.close();
