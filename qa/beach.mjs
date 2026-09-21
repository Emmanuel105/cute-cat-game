// Sunny Shore: the two keeping the beach ball up, shot six times over eight seconds, then the cat
// standing under the catcher to take the ball off its head.
//   node qa/beach.mjs <outdir>
import { chromium } from '/Users/emmanuelmkandawire/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, process.argv[2] || 'beach'); fs.mkdirSync(out, { recursive: true });
const URL = 'file://' + path.join(here, '..', 'dimension-cat', 'dist', 'dimension_cat.html');
const shot = (page, n) => page.screenshot({ path: path.join(out, n + '.jpg'), type: 'jpeg', quality: 88 });
const settle = (page, s) => page.evaluate(async (s) => { const g = window.DC, t0 = g.time; while (g.time - t0 < s) await new Promise((r) => setTimeout(r, 25)); }, s);
const b = await chromium.launch({ headless: true, executablePath: '/Users/emmanuelmkandawire/Library/Caches/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const page = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(URL); await page.waitForFunction(() => window.DC && !document.getElementById('enter').disabled, null, { timeout: 90000 });
await page.click('#enter'); await settle(page, 1);
await page.evaluate(() => window.DC.travel(4, 'from-hub')); await page.waitForTimeout(2400); await settle(page, 0.8);
await page.evaluate(() => window.DC.setTime('day')); await settle(page, 0.4);
const look = (x, z, yaw, dist, pitch) => page.evaluate(([x, z, yaw, dist, pitch]) => {
  const g = window.DC; g.cat.group.position.set(x, g.physics.ground0(x, z), z); g.cat.vy = 0; g.cat.group.rotation.y = yaw;
  g.cam.yaw = yaw; g.cam.pitch = pitch; g.cam.dist = dist; g.cam.curDist = dist; g.updateCamera(0, true);
}, [x, z, yaw, dist, pitch]);
// side on: the cat west of the pair, looking east across them
await look(-2, 10, Math.PI / 2, 6.5, 0.14);
for (let i = 0; i < 6; i++) { await settle(page, i ? 1.3 : 0.6); await shot(page, `ball-${i}`); }
// under the catcher: stand right beside the south player and wait for a ball to come down
await look(4.6, 7.6, 0, 3.2, 0.1);
for (let i = 0; i < 5; i++) { await settle(page, 0.8); await shot(page, `head-${i}`); }
const st = await page.evaluate(() => { const g = window.DC.npcs.find((n) => n.constructor.name === 'BallGame'); return { passes: g.passes, boinged: g.boinged, toast: document.getElementById('msg').textContent, ball: [+g.ball.position.x.toFixed(1), +g.ball.position.y.toFixed(1), +g.ball.position.z.toFixed(1)] }; });
console.log('ball game', JSON.stringify(st));
console.log('errors', errs.slice(0, 4));
await b.close();
