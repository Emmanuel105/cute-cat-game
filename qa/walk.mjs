// The walk cycle, frame by frame: one townsperson made to walk past the camera side-on,
// shot at eight points through a stride, plus the cat walking for comparison.
//   node qa/walk.mjs <outdir>
import { chromium } from '/Users/emmanuelmkandawire/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, process.argv[2] || 'walk'); fs.mkdirSync(out, { recursive: true });
const URL = 'file://' + path.join(here, '..', 'dimension-cat', 'dist', 'dimension_cat.html');
const shot = (page, n) => page.screenshot({ path: path.join(out, n + '.jpg'), type: 'jpeg', quality: 88 });
const settle = (page, s) => page.evaluate(async (s) => { const g = window.DC, t0 = g.time; while (g.time - t0 < s) await new Promise((r) => setTimeout(r, 25)); }, s);
const b = await chromium.launch({ headless: true, executablePath: '/Users/emmanuelmkandawire/Library/Caches/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const page = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(URL); await page.waitForFunction(() => window.DC && !document.getElementById('enter').disabled, null, { timeout: 90000 });
await page.click('#enter'); await settle(page, 1);
await page.evaluate(() => window.DC.setTime('day')); await settle(page, 0.4);
// three people side-on at fixed stride phases, so a single frame shows the whole cycle
await page.evaluate(() => {
  const g = window.DC, R = window.DC_RIGS, r = R.seeded(11);
  const cx = 0, cz = 40;
  g.__walk = [];
  const specs = [{ shirt: 0xe0503c }, { female: true, shirt: 0x2e9e6e, skirt: 0xf2c744 }, { child: true, height: 1.15, shirt: 0x3f6fd6, backpack: 0xe0503c }, { elder: true, cane: true, coat: true, hat: 'top', shirt: 0x2f2f3a, pants: 0x1e1e24 }];
  specs.forEach((spec, i) => {
    const rig = R.makeHuman({ ...R.randomPerson(r, spec), ...spec });
    const x = cx - 3.6 + i * 2.4, z = cz + 4;
    rig.group.position.set(x, g.physics.ground0(x, z), z); rig.group.rotation.y = Math.PI / 2;   // side-on, facing +x
    g.world.add(rig.group); g.__walk.push(rig);
  });
  g.cat.group.position.set(cx, g.physics.ground0(cx, cz), cz); g.cat.vy = 0; g.cat.group.rotation.y = 0;
  g.cam.yaw = 0; g.cam.pitch = 0.02; g.cam.dist = 4.2; g.cam.curDist = 4.2; g.updateCamera(0, true);
});
for (let f = 0; f < 8; f++) {
  await page.evaluate((f) => { const g = window.DC; g.__walk.forEach((rig, i) => rig.animate(f / 8 * Math.PI * 2 + i * 0.4, true, 1 / 60, 0)); }, f);
  await settle(page, 0.15); await shot(page, `stride-${f}`);
}
console.log('errors', errs.slice(0, 4));
await b.close();
