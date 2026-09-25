// Finds the live RoboDog in Robot City, walks the cat right up to it, offers the toy mouse, and shoots before/after.
//   node qa/robodog-friend.mjs <outdir>
import { chromium } from '/Users/emmanuelmkandawire/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, process.argv[2] || 'robodog-friend'); fs.mkdirSync(out, { recursive: true });
const URL = 'file://' + path.join(here, '..', 'dimension-cat', 'dist', 'dimension_cat.html');
const shot = (page, n) => page.screenshot({ path: path.join(out, n + '.jpg'), type: 'jpeg', quality: 88 });
const settle = (page, s) => page.evaluate(async (s) => { const g = window.DC, t0 = g.time; while (g.time - t0 < s) await new Promise((r) => setTimeout(r, 25)); }, s);
const b = await chromium.launch({ headless: true, executablePath: '/Users/emmanuelmkandawire/Library/Caches/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const page = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(URL); await page.waitForFunction(() => window.DC && !document.getElementById('enter').disabled, null, { timeout: 90000 });
await page.click('#enter'); await settle(page, 1);
await page.evaluate(() => window.DC.travel(2, 'from-hub')); await page.waitForTimeout(2400); await settle(page, 0.8);
await page.evaluate(() => window.DC.setTime('day')); await settle(page, 0.4);
const dog = await page.evaluate(() => { const g = window.DC, d = g.npcs.find((n) => n.constructor.name === 'RoboDog'); g.cat.group.position.set(d.x, g.physics.ground0(d.x, d.z), d.z + 1.6); g.cat.vy = 0; g.cam.yaw = 0; g.cam.pitch = 0.1; g.cam.dist = 6; g.cam.curDist = 6; g.updateCamera(0, true); return { x: d.x, z: d.z, mode: d.mode, friend: d.friend }; });
console.log('dog before', JSON.stringify(dog));
await shot(page, 'before');
const r1 = await page.evaluate(() => { const g = window.DC; g.interact(); return g.nearest && g.nearest._label; });
console.log('first interact:', r1);
await settle(page, 0.8); await shot(page, 'after-offer');
const dog2 = await page.evaluate(() => { const d = window.DC.npcs.find((n) => n.constructor.name === 'RoboDog'); return { mode: d.mode, friend: d.friend }; });
console.log('dog after', JSON.stringify(dog2));
await settle(page, 2); await shot(page, 'settled-friend');
console.log('errors', errs.slice(0, 4));
await b.close();
