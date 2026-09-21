// The Neighborhood park: the two on the bench and the children playing tag, shot a few times over
// twenty seconds so the chase can be seen happening.
//   node qa/park.mjs <outdir>
import { chromium } from '/Users/emmanuelmkandawire/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, process.argv[2] || 'park'); fs.mkdirSync(out, { recursive: true });
const URL = 'file://' + path.join(here, '..', 'dimension-cat', 'dist', 'dimension_cat.html');
const shot = (page, n) => page.screenshot({ path: path.join(out, n + '.jpg'), type: 'jpeg', quality: 88 });
const settle = (page, s) => page.evaluate(async (s) => { const g = window.DC, t0 = g.time; while (g.time - t0 < s) await new Promise((r) => setTimeout(r, 25)); }, s);
const b = await chromium.launch({ headless: true, executablePath: '/Users/emmanuelmkandawire/Library/Caches/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const page = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(URL); await page.waitForFunction(() => window.DC && !document.getElementById('enter').disabled, null, { timeout: 90000 });
await page.click('#enter'); await settle(page, 1);
await page.evaluate(() => window.DC.setTime('day')); await settle(page, 0.4);
const look = (x, z, yaw, dist, pitch) => page.evaluate(([x, z, yaw, dist, pitch]) => {
  const g = window.DC; g.cat.group.position.set(x, g.physics.ground0(x, z), z); g.cat.vy = 0; g.cat.group.rotation.y = yaw;
  g.cam.yaw = yaw; g.cam.pitch = pitch; g.cam.dist = dist; g.cam.curDist = dist; g.updateCamera(0, true);
}, [x, z, yaw, dist, pitch]);
// the bench (it faces −z): the cat on the path in front of it, camera looking +z at the sitters
await look(6, 38.4, 0, 3.4, 0.06); await settle(page, 0.6); await shot(page, 'bench');
// the lawn: cat on the path looking east across the grass, four frames over twelve seconds
await look(1.5, 46, Math.PI / 2, 6, 0.18);
for (let i = 0; i < 4; i++) { await settle(page, i ? 4 : 0.6); await shot(page, `tag-${i}`); }
const state = await page.evaluate(() => { const p = window.DC.npcs.find((n) => n.constructor.name === 'Playmates'); return p ? { chaser: p.chaser, kids: p.kids.map((k) => [+k.x.toFixed(1), +k.z.toFixed(1)]) } : null; });
console.log('tag', JSON.stringify(state));
console.log('errors', errs.slice(0, 4));
await b.close();
