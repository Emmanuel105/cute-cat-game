// Close-up of the townsfolk in each world: face, hair, clothes.
import { chromium } from '/Users/emmanuelmkandawire/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, process.argv[2] || 'portraits'); fs.mkdirSync(out, { recursive: true });
const URL = 'file://' + path.join(here, '..', 'dimension-cat', 'dist', 'dimension_cat.html');
const shot = (page, n) => page.screenshot({ path: path.join(out, n + '.jpg'), type: 'jpeg', quality: 88 });
const settle = (page, s) => page.evaluate(async (s) => { const g = window.DC, t0 = g.time; while (g.time - t0 < s) await new Promise((r) => setTimeout(r, 25)); }, s);
const b = await chromium.launch({ headless: true, executablePath: '/Users/emmanuelmkandawire/Library/Caches/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ["--use-angle=metal","--ignore-gpu-blocklist","--enable-gpu"] });
const page = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(URL); await page.waitForFunction(() => window.DC && !document.getElementById('enter').disabled, null, { timeout: 90000 });
await page.click('#enter'); await settle(page, 1);
const pose = (dist, pitch, at) => page.evaluate(([dist, pitch, at]) => {
  const g = window.DC;
  if (at) { g.cat.group.position.set(at[0], g.physics.ground0(at[0], at[1]), at[1]); g.cat.vy = 0; }
  const p = g.cat.group.position;
  const people = g.npcs.filter(n => n.rig && n.rig.eyes && n.rig.legs && n.rig.legs.length === 2 && n.rig.arms);
  people.slice(0, 6).forEach((n, i) => {
    const x = p.x - 3.5 + i * 1.5, z = p.z + 4;
    n.x = x; n.z = z; n.hx = x; n.hz = z; n.state = 'idle'; n.timer = 999;
    n.rig.group.position.set(x, g.physics.ground0(x, z), z); n.rig.group.rotation.y = Math.PI;
    if (n.circle) { n.circle.x = x; n.circle.z = z; }
    if (n.rig.head) n.rig.head.rotation.y = 0;
  });
  g.cam.yaw = 0; g.cam.pitch = pitch; g.cam.dist = dist; g.cam.curDist = dist; g.cat.group.rotation.y = 0; g.updateCamera(0, true);
  return people.length;
}, [dist, pitch, at]);
const go = async (i, e) => { await page.evaluate(([i, e]) => window.DC.travel(i, e), [i, e]); await page.waitForTimeout(2400); await settle(page, 0.8); };
await page.evaluate(() => window.DC.setTime('day')); await settle(page, 0.5);
console.log('hood people', await pose(3.4, 0.02, [0, 40])); await settle(page, 0.8); await shot(page, 'hood-people');
for (let i = 0; i < 4; i++) {
  await page.evaluate((i) => { const g = window.DC; g.cat.group.position.x = -3.5 + i * 1.5; g.cam.dist = 1.5; g.cam.curDist = 1.5; g.cam.pitch = -0.08; g.updateCamera(0, true); }, i);
  await settle(page, 0.4); await shot(page, 'hood-face' + i);
}
await go(3, 'from-prev'); await page.evaluate(() => window.DC.setTime('day')); console.log('vic people', await pose(3.4, 0.02, [0, 0])); await settle(page, 0.8); await shot(page, 'victorian-people');
await go(4, 'from-hub'); console.log('beach people', await pose(3.4, 0.02, [0, 0])); await settle(page, 0.8); await shot(page, 'beach-people');
await go(5, 'from-hub'); await page.evaluate(() => window.DC.setTime('day')); console.log('snow people', await pose(3.2, 0.02, [0, 12])); await settle(page, 0.8); await shot(page, 'snow-people');
console.log('errors', errs.slice(0, 4));
await b.close();
