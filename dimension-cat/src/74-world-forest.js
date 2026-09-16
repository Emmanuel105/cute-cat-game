// ---------------------------------------------------------------- 7. WHISPER WOODS
function buildForest(game, entry) {
  const W = game.world, P = game.physics, r = seeded(707), U = [];
  P.setLimit(WOODS_LIMIT);
  game.applySky({ top: 0x0e1e3a, horizon: 0x4a7a5a, bottom: 0x1a2a1a, sun: [-0.6, 0.2, 0.5], sunColor: 0xffc07a, sunSize: 800, halo: 0.5, stars: 0.5 });
  game.setLighting({ ambient: [0x7a9ab0, 0.7], hemi: [0x9ac0b0, 0x2a3a1a, 0.9], sun: [0xffcf8a, 1.5, -50, 45, 35], fog: [0x223826, 45, 310], exposure: 1.05 });

  const T = (x, z) => { const rim = smoothstep(120, 250, sqrt(x * x + z * z));
    return bumps(x, z, 0.07) * 0.6 + bumps(x - 40, z + 20, 0.2) * 0.25 + 1.0 + rim * rim * 46; };
  makeTerrain(game, T, mat(0xffffff, { roughness: 1, map: TEX.forestFloor() }), 780, 312);
  const treeAt = (x, z, o) => { const t = makeBigTree(r, o); placeT(game, U, t, x, z, 0); const [w] = t.userData.col; boxT(game, x, z, w * 0.7, 9, w * 0.7, { cam: false }); return t; };

  // the glade: fairy ring, glowing pond, giant mushrooms, lantern strings
  const pond = makeGlowPond(game, 8, -6, 4.5, r); U.push(pond.userData.update);
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; const m = makeMushroom(0.45, r.pick([0, 300, 200]), r, true); placeT(game, U, m, cos(a) * 6.5 - 6, sin(a) * 6.5 + 8, 0); if (m.userData.update) U.push(m.userData.update); }
  for (const [x, z, s, hue] of [[-14, -14, 2.6, 0], [16, 12, 3.2, 200], [-20, 0, 2.2, 300], [14, -20, 2.4, 40], [-2, -22, 2.9, 0], [24, -4, 2.0, 280], [-24, 20, 2.6, 200], [4, 24, 2.3, 0]]) { const m = makeMushroom(s, hue, r, true); placeT(game, U, m, x, z, 0); boxT(game, x, z, 0.5 * s, 1.3 * s, 0.5 * s, { cam: false }); U.push(m.userData.update); }
  for (let i = 0; i < 30; i++) { const x = r.range(-40, 40), z = r.range(-40, 40); if (dist2(x, z, 8, -6) < 36) continue; placeT(game, U, makeMushroom(r.range(0.25, 0.6), r.pick([0, 20, 200, 300, 40]), r, r.chance(0.4)), x, z, 0); }
  // trees: a ring at the edge and scattered giants
  for (let i = 0; i < 40; i++) { const a = i / 40 * TAU + r.range(-0.06, 0.06), d = r.range(40, 54); treeAt(cos(a) * d, sin(a) * d, { simple: true }); }
  const inner = [[-30, -10], [-28, 12], [-12, 30], [12, 32], [30, 22], [34, -12], [22, -30], [-6, -34], [-34, -30], [26, 4], [-16, -26], [0, 34]];
  for (const [x, z] of inner) treeAt(x, z, { lanterns: r.chance(0.5) });
  const treehouse = makeTreehouse(game, -18, 14, r);
  const lantern1 = makeLanternString(game, -30, -10, -12, -26, 8, 4.0), lantern2 = makeLanternString(game, 12, 32, 30, 22, 7, 4.2), lantern3 = makeLanternString(game, -16, -26, 8, -30, 7, 4.4); U.push(lantern1.update, lantern2.update, lantern3.update);
  makeFerns(game, [[0, 0, 36, 140]], r);
  for (const [x, z, ry] of [[12, 14, 0.6], [-8, -18, 2.2], [22, -14, 1.1], [-22, -6, 0.2], [2, 12, 1.4]]) { placeT(game, U, makeHollowLog(r), x, z, ry); boxT(game, x, z, 1.4, 1.2, 1.4, { cam: false }); }
  makeZipline(game, U, -30, 30, 20, 34, r);
  makeGemCluster(game, U, -6, 8, 7, [0xa8ff9a, 0x7fe0ff, 0xffd54a, 0xff6fb5], r, 1.6); makeGemCluster(game, U, -12, 22.5, 4, [0xc8a2ff, 0xa8ff9a], r, 0.9);
  for (const [x, z] of [[-6, 2], [18, 24], [-26, -22], [4, -16]]) { placeT(game, U, makeStump(r), x, z, r() * TAU); boxT(game, x, z, 1.0, 0.75, 1.0, { cam: false }); }
  for (const [x, z] of [[-24, 30], [32, 8], [-36, 6], [8, -38]]) placeT(game, U, makeRock(r, 0x6b7a6a, r.range(1.2, 2.2)), x, z, 0);
  // stepping stones from the entrance to the glade
  for (let i = 0; i < 14; i++) { const z = 40 - i * 2.6, x = sin(i * 0.7) * 1.6; mesh(G.cyl(0.55, 0.6, 0.12, 9), mat(0x8a8a80, { roughness: 1 }), { x, y: P.ground0(x, z) + 0.05, z, ry: r() * TAU, shadow: 'receive', parent: W }); }

  // life: deer, foxes, frogs, owls, fairies, butterflies, the squirrel
  for (const [x, z] of [[-24, 4], [20, 20], [-10, -30]]) { const rig = makeDeer(); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x, z, speed: 0.6, leash: 9, r: 0.45, height: 1.4, step: 0.3, idle: [3, 7], walk: [2, 5] })); }
  for (const [x, z] of [[14, 6], [-26, -14]]) { const rig = makeFox(); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x, z, speed: 1.3, leash: 10, r: 0.3, height: 0.8, step: 0.3, idle: [1, 3], walk: [2, 5] })); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, x = 8 + cos(a) * 5.6, z = -6 + sin(a) * 5.6; const rig = makeFrog(r.pick([0x4caf50, 0x8bc34a, 0x2e7d32])); game.npcs.push(new Hopper(game, rig, { x, z, leash: 4, r: 0.15, dist: [0.4, 1.1], dur: 0.35, height: 0.35, idle: [1, 4], onHop: () => { if (rnd.chance(0.3)) SFX.ribbit(); } })); }
  for (const [x, z, tree] of [[-30, -10, 0], [30, 22, 0], [12, 32, 0]]) { const owl = makeOwl(); const y = P.ground0(x, z) + 6.6; owl.group.position.set(x + 1.8, y, z); owl.group.rotation.y = atan2(-x, -z); W.add(owl.group); mesh(G.cyl(0.08, 0.1, 1.6, 6), mat(0x4a3323), { x: x + 1.2, y: y - 0.05, z, rz: PI / 2, parent: W }); let ot = r() * 10; U.push((dt) => { ot += dt; owl.animate(0, false, dt, ot); }); }
  let hootT = 6; U.push((dt) => { hootT -= dt; if (hootT <= 0) { SFX.hoot(); hootT = rnd.range(8, 16); } });
  for (let i = 0; i < 5; i++) { const rig = makeFairy(r.pick([0xa8ff9a, 0xffd1ff, 0x9fe8ff, 0xfff3a0])); game.npcs.push(new Flyer(game, rig, { cx: r.range(-16, 16), cz: r.range(-14, 18), r: r.range(2.5, 5), h: r.range(1.2, 2.4), speed: r.range(1.2, 2), bob: 0.5, wobble: 1, cw: i % 2 === 0 })); }
  for (let i = 0; i < 12; i++) { const rig = makeButterfly(r.pick([300, 40, 200, 20, 260])); game.npcs.push(new Flyer(game, rig, { cx: r.range(-30, 30), cz: r.range(-30, 30), r: r.range(1.5, 4), h: r.range(0.7, 2), speed: r.range(0.8, 1.6), bob: 0.3, wobble: 0.8, cw: i % 2 === 0 })); }
  const sq = new Squirrel(game, -14, 20, 'sq-forest'); game.squirrels.push(sq);
  game.addInteractable({ obj: pond, radius: 3.2, label: () => 'Drink from the glowing pond', onUse: () => { SFX.twinkle(); game.fx.emit(game.cat.group.position.x, game.cat.group.position.y + 0.5, game.cat.group.position.z, { count: 30, colors: [0x2ad0d0, 0xa8ff9a, 0xffffff], speed: 1.5, up: 2, life: 1.2, gravity: 1 }); game.toast('✨ Sparkly! The cat feels magical.'); } });

  game.zones.addSpan(-3, 26, 3, 52); game.zones.addCircle(8, -6, 7); game.zones.addCircle(0, 0, 18);
  forestRegion(game, U, r, 58, WOODS_LIMIT - 8);
  makeHorizon(game, r, { clear: WOODS_LIMIT + 8, hills: true, hill: 0x2f4a30, rock: 0x3a4a3a, rock2: 0x44505a, snow: 0xdfe8f0, snowLine: 52, peaks: 28, woodCount: 460, woodBand: 44, woodHue: [0.26, 0.36], woodLight: [0.1, 0.2], trunk: 0x3a2a1c });
  // hollow oak home (north end of the stepping-stone path)
  const oak = makeHollowOak(game, 0, 50, PI, () => game.travel(0, 'from-forest'), 'Crawl back to the Neighborhood');
  oak.position.y = P.ground0(0, 50); U.push(oak.userData.update);
  const C = game.collectibles;
  C.add('star', 8, -6, P.ground0(8, -6) + 0.5); C.add('fish', -18, 8); C.add('yarn', 20, -24); C.add('mouse', -30, 26); C.add('star', 30, 12); C.add('fish', 4, 20); C.add('yarn', -34, -28); C.add('mouse', 24, -2);
  game.fx.setAmbient({ count: 120, radius: 20, colors: [0xd4ff6a, 0xa8ff9a, 0xfff3a0], rise: 0.08, drift: 0.4, life: 5, height: 2.6, yMin: 0.3 });
  makeDayNight(game, U, W);
  const spawn = spawnBySquirrel(game, sq);
  return { update: (dt, t) => { for (const f of U) f(dt, t); }, spawn };
}
