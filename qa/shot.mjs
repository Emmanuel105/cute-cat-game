// Reusable screenshot tour. Usage: node qa/shot.mjs <outdir> [preset]
import { chromium } from '/Users/emmanuelmkandawire/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.argv[2] || 'shots';
const preset = process.argv[3] || 'all';
const out = path.join(here, outDir); fs.mkdirSync(out, { recursive: true });
const URL = 'file://' + path.join(here, '..', 'dimension-cat', 'dist', 'dimension_cat.html');
export const shot = (page, name) => page.screenshot({ path: path.join(out, name + '.jpg'), type: 'jpeg', quality: 82 });
const settle = (page, secs) => page.evaluate(async (s) => { const g = window.DC, t0 = g.time; while (g.time - t0 < s) await new Promise((r) => setTimeout(r, 25)); }, secs);
const look = (page, x, y, z, tx, tz, dist = 4, pitch = 0.3) => page.evaluate(([x, y, z, tx, tz, dist, pitch]) => { const g = window.DC; g.cat.group.position.set(x, y, z); g.cat.vy = 0; g.cat.group.rotation.y = Math.atan2(tx - x, tz - z); g.cam.yaw = Math.atan2(tx - x, tz - z); g.cam.pitch = pitch; g.cam.dist = dist; g.cam.curDist = dist; g.updateCamera(0, true); }, [x, y, z, tx, tz, dist, pitch]);
const browser = await chromium.launch({ headless: true, executablePath: '/Users/emmanuelmkandawire/Library/Caches/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ["--use-angle=metal","--ignore-gpu-blocklist","--enable-gpu"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const page = await ctx.newPage(); const errors = [];
page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver Message/.test(m.text())) errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(URL); await page.waitForFunction(() => window.DC && !document.getElementById('enter').disabled, null, { timeout: 90000 });
await page.click('#enter'); await settle(page, 1.2);
const go = async (i, entry) => { await page.evaluate(([i, e]) => window.DC.travel(i, e), [i, entry]); await page.waitForTimeout(1400); await settle(page, 0.6); };
const fps = () => page.evaluate(async () => { const g = window.DC; let n = 0; const t0 = performance.now(); await new Promise((r) => { const tick = () => { n++; if (performance.now() - t0 < 1500) requestAnimationFrame(tick); else r(); }; requestAnimationFrame(tick); }); return Math.round(n / ((performance.now() - t0) / 1000)); });

if (preset === 'all' || preset === 'hood') {
  await look(page, 0, 0, 20, 0, 0, 14, 0.42); await settle(page, 0.4); await shot(page, 'a1-home-beacon');
  await look(page, 0, 0, 30, 0, 14, 10, 0.5); await settle(page, 0.3); await shot(page, 'a2-road');
  await look(page, 44, 0, 10, 44, 40, 9, 0.35); await settle(page, 0.3); await shot(page, 'a3-side-road');
  await look(page, 55, 0, 14, 78, 22, 10, 0.3); await settle(page, 0.3); await shot(page, 'a4-boardwalk');
  await look(page, 0, 0, 44, 0, 50, 5, 0.22); await settle(page, 0.3); await shot(page, 'a5-portal-gems');
  await look(page, 60, 0, 0, 90, -10, 10, 0.2); await settle(page, 0.3); await shot(page, 'a6-horizon-east');
  await look(page, -20, 0, -30, -70, -60, 12, 0.18); await settle(page, 0.3); await shot(page, 'a7-horizon-sw');
  await look(page, 18, 0, 6, 18, 0, 9, 0.3); await settle(page, 0.3); await shot(page, 'a8-neighbour-lot');
  await look(page, 8, 0, 48, 10.8, 48.6, 4, 0.3); await settle(page, 0.3); await shot(page, 'a9-gem');
}
if (preset === 'all' || preset === 'people') {
  await look(page, -20, 0, 8, -20, 10.4, 2.6, 0.12); await settle(page, 0.5); await shot(page, 'p1-person');
  await go(3, 'from-prev'); await look(page, -13, 0, -3, -15, -3, 2.8, 0.12); await settle(page, 0.5); await shot(page, 'p2-victorian');
  await go(5, 'from-hub'); await look(page, 0, 0.5, -46, 0, -53, 4.5, 0.18); await settle(page, 0.5); await shot(page, 'p3-yeti');
}
if (preset === 'all' || preset === 'worlds') {
  for (const [i, entry, name] of [[1, 'from-hub', 'w1-candy'], [2, 'from-prev', 'w2-robot'], [3, 'from-prev', 'w3-victorian'], [4, 'from-hub', 'w4-beach'], [5, 'from-hub', 'w5-snow'], [6, 'from-hub', 'w6-forest']]) {
    await go(i, entry); await page.evaluate(() => { window.DC.cam.pitch = 0.32; window.DC.cam.dist = 9; window.DC.updateCamera(0, true); }); await settle(page, 0.5);
    await shot(page, name); console.log(name, 'fps', await fps());
  }
}
console.log('errors:', errors.length, errors.slice(0, 6));
await browser.close();
