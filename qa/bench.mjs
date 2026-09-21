// Draw calls, triangles and frame rate per world, plus the mesh cost of one person.
// Run before and after a change to show it did not cost frame rate:  node qa/bench.mjs
import { chromium } from '/Users/emmanuelmkandawire/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const URL = 'file://' + path.join(here, '..', 'dimension-cat', 'dist', 'dimension_cat.html');
const settle = (page, s) => page.evaluate(async (s) => { const g = window.DC, t0 = g.time; while (g.time - t0 < s) await new Promise((r) => setTimeout(r, 25)); }, s);
const b = await chromium.launch({ headless: true, executablePath: '/Users/emmanuelmkandawire/Library/Caches/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const page = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(URL); await page.waitForFunction(() => window.DC && !document.getElementById('enter').disabled, null, { timeout: 90000 });
await page.click('#enter'); await settle(page, 1);

const measure = (name) => page.evaluate(async (name) => {
  const g = window.DC;
  // the outline pass ends with a fullscreen quad, so read the scene pass with it switched off
  g.outline.enabled = false; g.render();
  const info = g.renderer.info.render;
  const calls = info.calls, tris = info.triangles;
  g.outline.enabled = true;
  const t0 = performance.now(); let k = 0;
  await new Promise((r) => { const tick = () => { k++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else r(); }; requestAnimationFrame(tick); });
  const fps = +(k / ((performance.now() - t0) / 1000)).toFixed(0);
  return { name, calls, tris, fps };
}, name);

// one person's mesh cost, measured on a real townsperson
const people = await page.evaluate(() => {
  const g = window.DC;
  const p = g.npcs.filter((n) => n.rig && n.rig.eyes && n.rig.legs && n.rig.legs.length === 2);
  if (!p.length) return null;
  let meshes = 0, tris = 0; const mats = new Set();
  p[0].rig.group.traverse((o) => { if (o.isMesh) { meshes++; mats.add(o.material.uuid); const g2 = o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count; tris += g2 / 3; } });
  return { people: p.length, meshes, tris: Math.round(tris), materials: mats.size };
});
console.log('one person:', JSON.stringify(people));

const rows = [];
// Every reading is taken from the same spot, facing the same way, at noon, so runs are comparable.
const stand = (x, z, yaw) => page.evaluate(([x, z, yaw]) => {
  const g = window.DC; g.setTime('day');
  g.cat.group.position.set(x, g.physics.ground0(x, z), z); g.cat.vy = 0; g.cat.group.rotation.y = yaw;
  g.cam.yaw = yaw; g.cam.pitch = 0.12; g.cam.dist = 7; g.cam.curDist = 7; g.updateCamera(0, true);
}, [x, z, yaw]);
// stand among the neighbours, which is where people cost the most
await stand(0, 40, 0); await settle(page, 0.6); rows.push(await measure('hood-among-people'));
for (const [i, e, n, x, z, yaw] of [[1, 'from-hub', 'candy', 0, 0, 0], [3, 'from-prev', 'victorian', 0, 0, 0], [4, 'from-hub', 'beach', 0, 0, Math.PI / 2], [5, 'from-hub', 'snow', 0, 12, Math.PI], [6, 'from-hub', 'forest', 0, 0, 0]]) {
  await page.evaluate(([i, e]) => window.DC.travel(i, e), [i, e]);
  await page.waitForTimeout(2400); await stand(x, z, yaw); await settle(page, 0.8);
  rows.push(await measure(n));
}
for (const r of rows) console.log(`${r.name.padEnd(20)} calls ${String(r.calls).padStart(5)}  tris ${String(r.tris).padStart(8)}  fps ${r.fps}`);
console.log('errors', errs.length, errs.slice(0, 3));
await b.close();
