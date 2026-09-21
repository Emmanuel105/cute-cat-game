// Logic smoke test: runs the whole game module in Node against stub DOM + stub three.js.
import * as STUB from './stub-three.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, '..', 'src');
let js = fs.readdirSync(src).filter((f) => f.endsWith('.js')).sort().map((f) => fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
// swap the CDN loader for the stub
js = js.replace(/for \(const src of THREE_SOURCES\) \{[\s\S]*?\n\}\n/, 'THREE = globalThis.THREE_STUB;\n');
if (!js.includes('THREE = globalThis.THREE_STUB')) throw new Error('loader patch failed');

// ---- fake DOM -------------------------------------------------------------
const ctxStub = new Proxy({}, { get: (_, k) => (k === 'createLinearGradient' || k === 'createRadialGradient') ? () => ({ addColorStop() {} }) : (k === 'measureText' ? () => ({ width: 10 }) : (typeof k === 'string' ? () => {} : undefined)), set: () => true });
const elements = new Map();
const makeEl = (id) => ({ id, style: {}, textContent: '', disabled: false, offsetWidth: 1, _classes: new Set(), listeners: {},
  classList: { add(c) { this._el._classes.add(c); }, remove(c) { this._el._classes.delete(c); }, toggle(c, f) { f ? this._el._classes.add(c) : this._el._classes.delete(c); }, contains(c) { return this._el._classes.has(c); } },
  addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); }, setPointerCapture() {}, focus() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }) });
globalThis.document = { createElement: (tag) => tag === 'canvas' ? { width: 0, height: 0, getContext: () => ctxStub } : makeEl(tag), getElementById: (id) => { if (!elements.has(id)) { const e = makeEl(id); e.classList._el = e; elements.set(id, e); } return elements.get(id); } };
const winListeners = {};
globalThis.window = { innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, addEventListener: (t, fn) => { (winListeners[t] = winListeners[t] || []).push(fn); }, AudioContext: undefined };
globalThis.requestAnimationFrame = () => 0;
// fake localStorage (newer Node ships a real one that wants --localstorage-file)
const storage = new Map();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (k) => storage.has(k) ? storage.get(k) : null, setItem: (k, v) => storage.set(k, String(v)), removeItem: (k) => storage.delete(k) } });
const saved = () => JSON.parse(localStorage.getItem('dimension-cat-save-v1') || 'null');
globalThis.THREE_STUB = STUB;

const tmp = path.join(here, '_bundle.mjs');
fs.writeFileSync(tmp, js);
const warnings = []; const origWarn = console.warn; console.warn = (...a) => warnings.push(a.join(' '));
await import(tmp);
fs.unlinkSync(tmp);
const game = globalThis.window.DC;
const fire = (type, ev) => (winListeners[type] || []).forEach((fn) => fn(ev));
const key = (k, down = true) => fire(down ? 'keydown' : 'keyup', { key: k, repeat: false, preventDefault() {} });
const frames = (n) => { for (let i = 0; i < n; i++) game.loop(); };
const finite = (v) => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
const check = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; } else console.log('ok  :', msg); };
const pos = () => game.cat.group.position;

check(game.worldIndex === 0, 'neighborhood built');
check(game.physics.boxes.length > 50, `colliders registered (${game.physics.boxes.length})`);
check(game.interactables.length >= 3, `interactables (${game.interactables.length})`);
check(['Sunny Shore', 'Frosty Peak', 'hollow oak'].every((n) => game.interactables.some((i) => (i.label() || '').includes(n))), 'neighborhood has the three hub portals');
check(game.collectibles.items.length === 8, `collectibles placed (${game.collectibles.items.length})`);

// Nothing may be planted on a road, pavement, garden path or boardwalk: walk the middle of each one
// and make sure no static collider (a tree trunk, a bush, a lamp post) is standing in the way.
const solidAt = (x, z, r = 0.5) => game.physics.boxes.some((b) => {
  if (b.maxY <= 0.4 || b.minY >= 1.6) return false;           // under foot or overhead: fine
  const cx = Math.max(b.minX, Math.min(x, b.maxX)), cz = Math.max(b.minZ, Math.min(z, b.maxZ));
  return (x - cx) ** 2 + (z - cz) ** 2 < r * r;
});
const walkable = (label, x0, z0, x1, z1, steps = 120) => {
  const blocked = [];
  for (let i = 0; i <= steps; i++) { const k = i / steps, x = x0 + (x1 - x0) * k, z = z0 + (z1 - z0) * k; if (solidAt(x, z)) blocked.push(`${x.toFixed(1)},${z.toFixed(1)}`); }
  check(blocked.length === 0, `${label} is clear end to end${blocked.length ? ' — blocked at ' + blocked.slice(0, 4).join(' / ') : ''}`);
};
walkable('the main street', -92, 14, 92, 14);
walkable('the north pavement', -92, 17.6, 92, 17.6);
walkable('the south pavement', -92, 10.4, 92, 10.4);
walkable('the side road', 44, -60, 44, 60);
walkable('the boardwalk', 46, 22, 74, 22);
walkable('the park path', -12, 36, 12, 36);
walkable('the path to the portal', 0, 36, 0, 48);
const PORTAL_GEMS = globalThis.window.DC_PORTAL_GEMS;
check(PORTAL_GEMS === 7, `the portal carries ${PORTAL_GEMS} gems`);
{
  let gems = 0;
  game.world.traverse((o) => { if (o.userData && o.userData.gem) gems++; });
  check(gems === PORTAL_GEMS, `the neighbourhood hides the same number of gems (${gems})`);
}
check(Array.isArray(game.homeMarker) && game.homeMarker[0] === 0 && game.homeMarker[1] === 0, 'the mini-map knows where home is');
{
  let beacon = null;
  game.world.traverse((o) => { if (o.userData && o.userData.beaconHome) beacon = o; });
  check(!!beacon && beacon.position.y > 12, `a marker floats over the roof (y=${beacon ? beacon.position.y.toFixed(1) : 'none'})`);
}
const start = pos().clone();
elements.get('enter').listeners.click[0]();
check(game.started, 'game started');
frames(30); check(finite(pos()) && finite(game.camera.position), 'positions finite after idle');
check(Math.abs(pos().y - 0.16) < 0.01, `cat rests on the house floor (y=${pos().y.toFixed(3)})`);
// walk forward (toward the door, +Z) — should be blocked by the closed door / wall
key('w'); frames(240); key('w', false);
check(pos().z > start.z + 1, `walked forward (z ${start.z.toFixed(2)} → ${pos().z.toFixed(2)})`);
check(pos().z < 4.0, `stopped by the furniture / front wall (z=${pos().z.toFixed(2)})`);
// strafe: A should move screen-left = -X when camera yaw = 0 … screen right = (-cos yaw, sin yaw) = (-1, 0) so A → +X
const before = pos().x; key('a'); frames(60); key('a', false);
check(pos().x > before + 0.3, `A strafes to screen-left (+X at yaw 0): x ${before.toFixed(2)} → ${pos().x.toFixed(2)}`);
// ← and → swing the camera rather than strafing
{
  const yaw0 = game.cam.yaw, x0 = pos().x, z0 = pos().z;
  key('ArrowLeft'); frames(30); key('ArrowLeft', false);
  check(game.cam.yaw > yaw0 + 0.4, `left arrow swings the camera (yaw ${yaw0.toFixed(2)} → ${game.cam.yaw.toFixed(2)})`);
  check(Math.abs(pos().x - x0) < 0.05 && Math.abs(pos().z - z0) < 0.05, 'left arrow does not move the cat');
  const yaw1 = game.cam.yaw;
  key('ArrowRight'); frames(30); key('ArrowRight', false);
  check(game.cam.yaw < yaw1 - 0.4, `right arrow swings the camera back (yaw ${yaw1.toFixed(2)} → ${game.cam.yaw.toFixed(2)})`);
}

check(Math.abs(Math.sin(game.cat.group.rotation.y) - 1) < 0.2, `cat faces the strafe direction (rot.y=${game.cat.group.rotation.y.toFixed(2)})`);
// find the door interactable and open it
pos().set(0.9, 0.16, 3.4); frames(5);
check(game.nearest && /door/i.test(game.nearest._label), `door prompt shown: ${game.nearest && game.nearest._label}`);
game.interact(); frames(60);
key('w'); frames(200); key('w', false);
check(pos().z > 4.6, `walked through the opened doorway (z=${pos().z.toFixed(2)})`);
// jump
const y0 = pos().y; game.jump(); frames(15); check(pos().y > y0 + 0.3, `jump lifts the cat (y=${pos().y.toFixed(2)})`); frames(90); check(Math.abs(pos().y - game.physics.groundAt(pos().x, pos().z, pos().y)) < 0.02, 'landed');
// collect the couch yarn by teleporting on top of the couch
pos().set(-3.0, 0.6, 0.1); game.cat.vy = 0; frames(10);
check(game.state.collected.size === 1, `collected the couch yarn (score=${game.state.score})`);
check(saved() && saved().collected.length === 1 && saved().score === game.state.score, `save written on pickup (score=${saved() && saved().score})`);
// squirrel: stays on its spot, can be petted, turns toward the cat
const sq = game.squirrels[0]; pos().set(sq.x + 1, 0, sq.z); frames(3); check(game.nearest && /squirrel/i.test(game.nearest._label), `squirrel prompt: ${game.nearest && game.nearest._label}`);
game.interact(); frames(120); check(finite(sq.rig.group.position), 'squirrel position finite');
check(Math.hypot(sq.rig.group.position.x - sq.x, sq.rig.group.position.z - sq.z) < 0.01, 'squirrel stays on its spot');
check(Math.abs(Math.sin(sq.rig.group.rotation.y) - Math.sin(Math.atan2(pos().x - sq.x, pos().z - sq.z))) < 0.15, 'squirrel faces the cat');
// forms: human walks, frog jumps higher, butterfly flies, worm cannot jump, cat again
{
  const home = pos().clone();
  game.setForm('human'); check(game.form === 'human' && game.cat.forms.human.group.visible && !game.cat.body.visible, 'human form shown, cat body hidden');
  key('w'); frames(60); key('w', false); check(Math.hypot(pos().x - home.x, pos().z - home.z) > 1.5, 'human walks');
  pos().copy(home); game.cat.vy = 0; frames(5);
  game.setForm('cat'); game.jump(); let catPeak = 0; for (let i = 0; i < 60; i++) { game.loop(); catPeak = Math.max(catPeak, pos().y); } frames(60);
  game.setForm('frog'); game.jump(); let frogPeak = 0; for (let i = 0; i < 80; i++) { game.loop(); frogPeak = Math.max(frogPeak, pos().y); } frames(80);
  check(frogPeak > catPeak * 1.3, `frog jumps higher (${frogPeak.toFixed(2)} vs cat ${catPeak.toFixed(2)})`);
  game.setForm('worm'); const wy = pos().y; game.jump(); frames(10); check(Math.abs(pos().y - wy) < 0.01, 'worm cannot jump');
  game.setForm('butterfly'); key(' '); frames(90); check(pos().y > wy + 1.5, `butterfly rises while Space is held (y=${pos().y.toFixed(2)})`); key(' ', false); frames(400);
  check(Math.abs(pos().y - game.physics.groundAt(pos().x, pos().z, pos().y)) < 0.05, 'butterfly drifts back down');
  game.setForm('cat'); check(game.form === 'cat' && game.cat.body.visible, 'back to cat');
}
// skin + time toggles
check(game.cat.skinKey === 'black', 'cat is the black Midnight skin by default');
game.cycleSkin(); check(game.cat.skinKey === 'neighborhood' && game.skinMode === 'world', `skin toggle → world skin (${game.cat.skinKey})`);
game.setSkin('black');
game.setTime('night'); frames(3); const sunNight = game.sun.intensity; game.setTime('day'); frames(3); const sunDay = game.sun.intensity; game.setTime('auto');
check(sunNight < 1 && sunDay > 2, `time toggle drives the sun (night ${sunNight.toFixed(2)}, day ${sunDay.toFixed(2)})`);
// NPCs sane
frames(600);
check(game.npcs.every((n) => finite(n.rig.group.position)), 'all NPC positions finite after 10s');
check(game.npcs.filter((n) => n instanceof Object && n.constructor.name === 'Wanderer').some((n) => Math.hypot(n.x - n.hx, n.z - n.hz) > 0.5), 'wanderers actually wander');
// people: the wardrobe spreads clothes, children are children, and someone waves at the cat
{
  const people = game.npcs.filter((n) => n.rig && n.rig.look && n.rig.legs && n.rig.legs.length === 2);
  check(people.length >= 9, `neighborhood has ${people.length} people`);
  const shirts = people.map((n) => n.rig.look.shirt);
  check(new Set(shirts).size === shirts.length, `no two neighbours wear the same shirt (${new Set(shirts).size} colours for ${shirts.length} people)`);
  check(people.some((n) => n.rig.look.child) && people.filter((n) => n.rig.look.child).every((n) => n.rig.look.height < 1.4), 'the neighbourhood has children, and they are small');
  check(people.every((n) => n.rig.hands.length === 2 && n.rig.legs.every((L) => L.ankle)), 'every person has two hands and ankles');
  // walk the cat right up to an idle neighbour, facing them: they should give a wave
  const p = people.find((n) => !n.rig.hat) || people[0];
  const before = pos().clone();
  p.state = 'idle'; p.timer = 30; p.rig.gesture = null; p.rig.idleT = 99; p.waved = false;
  const a = p.rig.group.rotation.y;
  pos().set(p.x + Math.sin(a) * 1.4, game.physics.ground0(p.x + Math.sin(a) * 1.4, p.z + Math.cos(a) * 1.4), p.z + Math.cos(a) * 1.4);
  let waved = false; for (let i = 0; i < 120 && !waved; i++) { game.loop(); if (p.rig.gesture === 'wave') waved = true; }
  check(waved, 'a neighbour waves when the cat walks up to them');
  const armUp = p.rig.arms[0].sh.rotation.x;
  frames(30); check(p.rig.arms[0].sh.rotation.x < -0.8, `the wave lifts the arm (shoulder ${p.rig.arms[0].sh.rotation.x.toFixed(2)}, was ${armUp.toFixed(2)})`);
  pos().copy(before);
  // nobody strolls onto the asphalt
  const strollers = game.npcs.filter((n) => n.constructor.name === 'Wanderer' && n.avoid);
  check(strollers.length >= 7 && strollers.every((n) => !n.avoid(n.x, n.z)), `${strollers.length} strollers, none standing in the road`);
  // the bench: two sitters with bent hips; the lawn: two children playing tag who swap who is "it"
  const sitters = game.npcs.filter((n) => n.constructor.name === 'Sitter');
  check(sitters.length === 2 && sitters.every((s) => s.rig.legs[0].hip.rotation.x < -1.2 && s.rig.legs[0].knee.rotation.x > 1.2), 'two people sit on the park bench with their knees bent');
  const play = game.npcs.find((n) => n.constructor.name === 'Playmates');
  let swaps = 0, last = play.chaser; for (let i = 0; i < 1200; i++) { game.loop(); if (play.chaser !== last) { swaps++; last = play.chaser; } }
  check(swaps >= 1, `the children tag each other (${swaps} swaps in 20 s)`);
  check(play.kids.every((k) => Math.hypot(k.x - play.cx, k.z - play.cz) <= play.leash + 0.01), 'the children stay on their lawn');
  check(play.kids.every((k) => Number.isFinite(k.rig.group.position.y)), 'the children keep their feet');
  const sw = game.npcs.find((n) => n.constructor.name === 'Swinger');
  const r0 = sw.pivot.rotation.x; frames(45); const r1 = sw.pivot.rotation.x;
  check(sw && Math.abs(r1 - r0) > 0.05 && Math.abs(r1) < 0.7, `a child is swinging in the park (${r0.toFixed(2)} → ${r1.toFixed(2)} rad)`);
}
// travel through all worlds
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const [idx, entry] of [[1, 'from-prev'], [2, 'from-prev'], [3, 'from-prev'], [2, 'from-next'], [1, 'from-next'], [0, 'from-next'], [4, 'from-hub'], [0, 'from-beach'], [5, 'from-hub'], [0, 'from-snow'], [6, 'from-hub'], [0, 'from-forest']]) {
  game.travel(idx, entry); await sleep(560);
  check(game.worldIndex === idx, `travelled to world ${idx} (${entry})`);
  if (idx !== 0) { const q = game.squirrels[0], dq = Math.hypot(pos().x - q.x, pos().z - q.z); check(dq < 2.5, `world ${idx}: spawned next to the squirrel (${dq.toFixed(1)} m)`); }
  frames(300);
  check(finite(pos()) && finite(game.camera.position), `world ${idx}: finite positions after 5s`);
  check(game.npcs.every((n) => finite(n.rig.group.position)), `world ${idx}: NPCs finite`);
  check(game.collectibles.items.length >= 6, `world ${idx}: ${game.collectibles.items.length} collectibles`);
  check(game.squirrels.length === 1, `world ${idx}: has its squirrel`);
  if (idx === 2) { const ld = game.npcs.filter((n) => n.constructor.name === 'Loader'); let lifts = 0; for (let i = 0; i < 900; i++) { game.loop(); if (ld.some((l) => l.lift > 0.8)) lifts++; } check(ld.length === 2 && lifts > 30, `Robot City: two loader robots lift crates off the belts (arms up for ${lifts} frames of 900)`); }
  if (idx === 3 || idx === 6) { const pt = game.npcs.find((n) => n.constructor.name === 'Patroller'); const p0 = [pt.x, pt.z]; frames(240); check(pt && Math.hypot(pt.x - p0[0], pt.z - p0[1]) > 1 && Number.isFinite(pt.rig.group.position.y), `world ${idx}: the patroller is on the move`); }
  if (idx === 1) { const rd = game.npcs.find((n) => n.constructor.name === 'RingDance'); const d0 = rd.dancers.map((d) => [d.circle.x, d.circle.z]); frames(60); check(rd.dancers.every((d, i) => Math.hypot(d.circle.x - d0[i][0], d.circle.z - d0[i][1]) > 0.5 && Math.abs(Math.hypot(d.circle.x - rd.cx, d.circle.z - rd.cz) - rd.r) < 0.01), 'Candy Land: the gingerbread men dance round the lollipop'); }
  if (idx === 4) { const b = game.npcs.find((n) => n.constructor.name === 'BallGame'); check(b && b.passes >= 2 && Number.isFinite(b.ball.position.y) && b.ball.position.y > 0, `Sunny Shore: the beach ball is being passed (${b ? b.passes : 0} passes in 5 s)`); }
  if (idx === 5) { const f = game.npcs.find((n) => n.constructor.name === 'SnowballFight'); check(f && f.throws >= 2 && f.kids.every((k) => Number.isFinite(k.rig.group.position.y)), `Frosty Peak: the children are throwing snowballs (${f ? f.throws : 0} throws in 5 s)`); }
  game.setTime('night'); frames(3); const sN = game.sun.intensity; game.setTime('auto'); frames(3); check(sN < 1.5 && Number.isFinite(sN), `world ${idx}: night toggle dims the sun (${sN.toFixed(2)})`);
  check(Math.abs(pos().y - game.physics.groundAt(pos().x, pos().z, pos().y)) < 0.05, `world ${idx}: cat rests on the ground (y=${pos().y.toFixed(2)})`);
  check(game.interactables.some((i) => /return|home|neighborhood|portal|airlock|door|oak|gondola/i.test(i.label() || '')), `world ${idx}: has a way onward`);
  // walk in each direction for a bit and make sure nothing explodes
  for (const k of ['w', 'a', 's', 'd']) { key(k); frames(90); key(k, false); }
  check(finite(pos()) && Math.abs(pos().x) <= game.physics.limit && Math.abs(pos().z) <= game.physics.limit, `world ${idx}: walked around, still inside the world (limit ${game.physics.limit})`);
  // A big world is only big if you can walk about in it: sample a grid and count the free ground.
  {
    const L = game.physics.limit, step = L / 14;
    let free = 0, total = 0;
    for (let x = -L + step; x < L; x += step) for (let z = -L + step; z < L; z += step) {
      total++;
      const g = game.physics.ground0(x, z);
      if (!game.physics.blocked(x, z, 0.3, null, g, 0.34, 0.7)) free++;
    }
    const pct = Math.round(free / total * 100);
    check(pct >= 80, `world ${idx}: ${pct}% of the ground is walkable`);
  }
  await sleep(520);
}
// save / restore round trip
check(saved() && saved().world === 0 && Array.isArray(saved().pos), `save written on travel (world=${saved() && saved().world})`);
{
  const snap = saved(), scoreBefore = game.state.score;
  game.state.score = 1; game.state.collected.clear();
  check(game.restore({ v: 1, world: 4, score: 4242, collected: snap.collected, completed: false, form: 'frog', skin: 'candy', time: 'auto', pos: [3, 0, 5], yaw: 1.2, camYaw: 1.2 }), 'restore accepts a valid save');
  check(game.form === 'frog' && game.cat.skinKey === 'candy', 'restore brings back form and skin'); game.setForm('cat'); game.setSkin('black');
  check(game.worldIndex === 4 && game.state.score === 4242 && game.state.collected.size === snap.collected.length, `restore rebuilt world 4 with the saved state (score=${game.state.score})`);
  check(Math.abs(pos().x - 3) < 0.01 && Math.abs(pos().z - 5) < 0.01 && Math.abs(game.cat.group.rotation.y - 1.2) < 0.01, `restore put the cat at the saved position (${pos().x.toFixed(1)}, ${pos().z.toFixed(1)})`);
  check(!game.restore({ v: 1, world: 99 }) && !game.restore(null), 'restore rejects bad data');
  check(game.restore(snap), 'restore back to the real save'); game.state.score = scoreBefore; game.updateHud();
}
// the time door is open (no quest yet): the boy chats, the door goes home
game.travel(3, 'from-prev'); await sleep(1100); frames(10);
const child = game.interactables.find((i) => /boy/.test(i.label())); check(!!child, 'child interactable exists');
child.onUse(); frames(20);
const door = game.interactables.find((i) => /time/i.test(i.label()));
check(door && /Step through/.test(door.label()), `time door is open: ${door && door.label()}`);
door.onUse(); await sleep(600); frames(30);
check(game.worldIndex === 0 && game.state.completed, `time door → neighborhood (score=${game.state.score})`);
check(saved() && saved().completed === true && saved().form === 'cat' && saved().skin === 'black', 'save records completion, form and skin');
await sleep(500);
// touch controls: joystick pushed right strafes the cat
{
  const stick = elements.get('stick'), sfire = (t, ev) => (stick.listeners[t] || []).forEach((fn) => fn(ev));
  game.touch.active = true; const x0 = pos().x, z0 = pos().z, yaw = game.cam.yaw;
  sfire('pointerdown', { pointerId: 7, clientX: 640 + 60, clientY: 360, preventDefault() {} });
  check(Math.abs(game.touch.x - 1) < 0.01 && Math.abs(game.touch.y) < 0.01, `joystick reads full right (${game.touch.x.toFixed(2)}, ${game.touch.y.toFixed(2)})`);
  frames(90);
  const dx = pos().x - x0, dz = pos().z - z0, rx = -Math.cos(yaw), rz = Math.sin(yaw);
  check(dx * rx + dz * rz > 0.5, `joystick moved the cat screen-right (${dx.toFixed(2)}, ${dz.toFixed(2)})`);
  sfire('pointerup', { pointerId: 7 }); frames(30);
  check(game.touch.x === 0 && game.touch.y === 0, 'joystick released');
  sfire('pointerdown', { pointerId: 8, clientX: 640, clientY: 360 - 30, preventDefault() {} }); frames(60); const s1 = game.cat.speed; sfire('pointerup', { pointerId: 8 }); frames(30);
  check(s1 > 1 && s1 < 3.3, `half deflection walks slower (speed=${s1.toFixed(2)})`);
  game.touch.active = false;
}
// photo mode: movement blocked, snapshot safe, toggles back
{
  game.togglePhoto(true); check(game.photo, 'photo mode on');
  const x0 = pos().x, z0 = pos().z; key('w'); frames(60); key('w', false);
  check(Math.abs(pos().x - x0) < 0.01 && Math.abs(pos().z - z0) < 0.01, 'photo mode ignores movement keys');
  game.snapshot(); key('p'); check(!game.photo, 'P leaves photo mode');
}
check(warnings.length === 0, `no console warnings (${warnings.length})` + (warnings.length ? ': ' + warnings.slice(0, 3).join(' | ') : ''));
console.log('renders:', game.renderer.renders, '| boxes:', game.physics.boxes.length, '| exit', process.exitCode || 0);
