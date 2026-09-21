// Shoot any spot in any world: put the cat there, point the camera, take N frames a few seconds apart.
//   node qa/scene.mjs <outdir> <world 0-6> <x> <z> <yaw> [dist=6] [pitch=0.12] [frames=4] [gap=2] [day|night]
// e.g. node qa/scene.mjs sw 0 -7 38 0 5 0.1 4 1.5      — the park swing, from the path
import { chromium } from '/Users/emmanuelmkandawire/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const [outName, world, x, z, yaw, dist = 6, pitch = 0.12, frames = 4, gap = 2, time = 'day', form = '', action = ''] = process.argv.slice(2);
const out = path.join(here, outName || 'scene'); fs.mkdirSync(out, { recursive: true });
const URL = 'file://' + path.join(here, '..', 'dimension-cat', 'dist', 'dimension_cat.html');
const shot = (page, n) => page.screenshot({ path: path.join(out, n + '.jpg'), type: 'jpeg', quality: 88 });
const settle = (page, s) => page.evaluate(async (s) => { const g = window.DC, t0 = g.time; while (g.time - t0 < s) await new Promise((r) => setTimeout(r, 25)); }, s);
const b = await chromium.launch({ headless: true, executablePath: '/Users/emmanuelmkandawire/Library/Caches/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const page = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(URL); await page.waitForFunction(() => window.DC && !document.getElementById('enter').disabled, null, { timeout: 90000 });
await page.click('#enter'); await settle(page, 1);
const w = +world;
if (w) { await page.evaluate(([i]) => window.DC.travel(i, i === 4 || i === 5 || i === 6 ? 'from-hub' : 'from-prev'), [w]); await page.waitForTimeout(2400); await settle(page, 0.8); }
await page.evaluate((t) => window.DC.setTime(t), time); await settle(page, 0.4);
if (form) { await page.evaluate((f) => window.DC.setForm(f), form); await settle(page, 0.4); }   // e.g. human, frog, squirrel
await page.evaluate(([x, z, yaw, dist, pitch]) => {
  const g = window.DC; g.cat.group.position.set(x, g.physics.ground0(x, z), z); g.cat.vy = 0; g.cat.group.rotation.y = yaw;
  g.cam.yaw = yaw; g.cam.pitch = pitch; g.cam.dist = dist; g.cam.curDist = dist; g.updateCamera(0, true);
}, [+x, +z, +yaw, +dist, +pitch]);
if (action === 'interact') { await settle(page, 0.3); const label = await page.evaluate(() => { const g = window.DC; g.interact(); return g.nearest && g.nearest._label; }); console.log('interacted:', label); }   // press E on whatever is in reach
for (let i = 0; i < +frames; i++) { await settle(page, i ? +gap : 0.6); await shot(page, `f${i}`); }
console.log('errors', errs.slice(0, 4));
await b.close();
