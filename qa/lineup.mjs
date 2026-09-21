// Line up hand-picked people in front of the camera so every feature of the human rig can be
// checked up close: beards, glasses, children, scarves, jackets, stripes, dresses.
//   node qa/lineup.mjs <outdir>
import { chromium } from '/Users/emmanuelmkandawire/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, process.argv[2] || 'lineup'); fs.mkdirSync(out, { recursive: true });
const URL = 'file://' + path.join(here, '..', 'dimension-cat', 'dist', 'dimension_cat.html');
const shot = (page, n) => page.screenshot({ path: path.join(out, n + '.jpg'), type: 'jpeg', quality: 90 });
const settle = (page, s) => page.evaluate(async (s) => { const g = window.DC, t0 = g.time; while (g.time - t0 < s) await new Promise((r) => setTimeout(r, 25)); }, s);
const b = await chromium.launch({ headless: true, executablePath: '/Users/emmanuelmkandawire/Library/Caches/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const page = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(URL); await page.waitForFunction(() => window.DC && !document.getElementById('enter').disabled, null, { timeout: 90000 });
await page.click('#enter'); await settle(page, 1);
await page.evaluate(() => window.DC.setTime('day')); await settle(page, 0.4);

// Each row is one line-up of up to six people. The cat stands at (0, 40) on the park path.
const ROWS = {
  faces: [
    { female: false, beard: true, hair: 0x2b1b12, shirt: 0xf7f3ec, mouth: 'smile' },
    { female: false, moustache: true, glasses: true, hair: 0x777777, shirt: 0x3f6fd6, mouth: 'grin' },
    { female: true, glasses: true, freckles: true, hair: 0xc97f3a, hairStyle: 'braids', shirt: 0xff8fab, mouth: 'open' },
    { female: true, hairStyle: 'bun', hair: 0x1a1a1a, shirt: 0x2e9e6e, skirt: 0xf2c744, mouth: 'small' },
    { female: false, beard: true, glasses: true, hair: 0xa0522d, shirt: 0x8a5acf, build: 'stout', mouth: 'grin' },
    { female: true, hairStyle: 'curls', hair: 0xd8b06a, shirt: 0x35b4c4, build: 'slim', freckles: true },
  ],
  clothes: [
    { female: false, shirt: 0xf7f3ec, jacket: 0x3a4a5e, pants: 0x2c3140, shoes: 0x3a2a1e },
    { female: true, shirt: 0xffffff, stripes: 0x3f6fd6, pants: 0x1e2a44, bag: 0x6b4a2b },
    { female: false, shirt: 0xe0503c, scarf: 0xf2c744, backpack: 0x2f6fd6, pants: 0x5a4634 },
    { female: true, shirt: 0x2e9e6e, apron: 0xf7f3ec, skirt: 0x6b4a2b },
    { female: false, shirt: 0x3f6fd6, belt: 0x3a2a1e, buttons: 0xf2c744, hat: 'cap', hatColor: 0x2e63d8 },
    { female: true, shirt: 0x8a5acf, dress: 0x8a5acf, sash: 0xf2c744, hairStyle: 'long', sleeves: true },
  ],
  children: [
    { child: true, female: false, height: 1.1, shirt: 0xf2c744, backpack: 0xe0503c },
    { child: true, female: true, height: 1.2, shirt: 0xff8fab, skirt: 0x8a5acf, hairStyle: 'pony' },
    { female: false, height: 1.8, shirt: 0x3f6fd6 },
    { child: true, female: true, height: 1.32, shirt: 0x35b4c4, freckles: true, hairStyle: 'braids' },
    { female: true, height: 1.65, shirt: 0x2e9e6e, skirt: 0xd6455c },
    { child: true, female: false, height: 1.05, shirt: 0x2e9e6e, hat: 'cap', hatColor: 0xe0503c },
  ],
  victorian: [
    { female: false, coat: true, hat: 'top', shirt: 0x2f2f3a, pants: 0x1e1e24, buttons: 0xc8b878, cane: true },
    { female: true, dress: 0x6a3f8a, sash: 0xd8c8a8, hat: 'bonnet', hatColor: 0x6a3f8a, sleeves: true },
    { child: true, height: 1.15, hat: 'flatcap', hatColor: 0x4a4036, shirt: 0x3a3327, pants: 0x1e1e24 },
    { female: false, coat: true, hat: 'top', hatBand: 0x2a2a3a, shirt: 0x43303a, moustache: true, glasses: true },
    { female: true, dress: 0x2f4f6f, hat: 'bonnet', hatColor: 0x2f4f6f, sleeves: true, glasses: true },
    { female: false, coat: true, hat: 'helmet', shirt: 0x1e2436, pants: 0x1e2436, buttons: 0xd8d8d8, belt: 0x0c0c0c, hatColor: 0x1e2436, moustache: true, build: 'stout' },
  ],
};
// every other creature, wide and close, so a change to the shared rig code can be checked on all of them
await page.evaluate(() => {
  const g = window.DC, R = window.DC_RIGS;
  if (g.__lineup) for (const grp of g.__lineup) grp.parent?.remove(grp);
  g.__lineup = [];
  const makers = ['makeGingerbread', 'makeRobot', 'makeSquirrel', 'makeCandyCat', 'makeCrab', 'makeSeagull', 'makeTurtle', 'makePenguin', 'makeYeti', 'makeFrog', 'makeOwl', 'makeFairy', 'makeButterfly'];
  const cx = 0, cz = 40;
  makers.forEach((m, i) => {
    const rig = R[m]();
    const x = cx - 6 + i * 1.0, z = cz + 4 + (i % 2) * 1.2;
    rig.group.position.set(x, g.physics.ground0(x, z) + (m === 'makeSeagull' || m === 'makeFairy' || m === 'makeButterfly' ? 1.2 : 0), z); rig.group.rotation.y = Math.PI;
    g.world.add(rig.group); g.__lineup.push(rig.group);
    for (let k = 0; k < 30; k++) rig.animate?.(0, false, 0.05, k * 0.05);
  });
  g.cat.group.position.set(cx, g.physics.ground0(cx, cz), cz); g.cat.vy = 0; g.cat.group.rotation.y = 0;
  g.cam.yaw = 0; g.cam.pitch = 0.05; g.cam.dist = 5.5; g.cam.curDist = 5.5; g.updateCamera(0, true);
});
await settle(page, 0.5); await shot(page, 'creatures');
for (let i = 0; i < 3; i++) {
  await page.evaluate((i) => { const g = window.DC; g.cat.group.position.x = -6 + i * 4.5 + 1.5; g.cam.dist = 2.4; g.cam.curDist = 2.4; g.cam.pitch = -0.02; g.updateCamera(0, true); }, i);
  await settle(page, 0.3); await shot(page, `creatures-close${i}`);
}
for (const [name, specs] of Object.entries(ROWS)) {
  await page.evaluate(([specs]) => {
    const g = window.DC, R = window.DC_RIGS, r = R.seeded(7);
    if (g.__lineup) for (const grp of g.__lineup) grp.parent?.remove(grp);
    g.__lineup = [];
    const cx = 0, cz = 40;
    specs.forEach((spec, i) => {
      const rig = R.makeHuman({ ...R.randomPerson(r, spec), ...spec });
      const x = cx - 3.6 + i * 1.45, z = cz + 4;
      rig.group.position.set(x, g.physics.ground0(x, z), z); rig.group.rotation.y = Math.PI;
      g.world.add(rig.group); g.__lineup.push(rig.group);
      // settle the pose without any gesture
      rig.animate(0, false, 0.5, 0); rig.gesture = null; rig.idleT = 99;
      for (let k = 0; k < 40; k++) rig.animate(0, false, 0.05, k * 0.05);
      rig.head.rotation.y = 0; rig.head.rotation.x = 0;
    });
    g.cat.group.position.set(cx, g.physics.ground0(cx, cz), cz); g.cat.vy = 0; g.cat.group.rotation.y = 0;
    g.cam.yaw = 0; g.cam.pitch = 0.02; g.cam.dist = 3.6; g.cam.curDist = 3.6; g.updateCamera(0, true);
  }, [specs]);
  await settle(page, 0.5); await shot(page, name);
  // and a close pass along the faces
  for (let i = 0; i < 6; i += 2) {
    await page.evaluate((i) => { const g = window.DC; g.cat.group.position.x = -3.6 + i * 1.45 + 0.7; g.cam.dist = 1.6; g.cam.curDist = 1.6; g.cam.pitch = -0.06; g.updateCamera(0, true); }, i);
    await settle(page, 0.3); await shot(page, `${name}-close${i / 2}`);
  }
}
console.log('errors', errs.slice(0, 4));
await b.close();
