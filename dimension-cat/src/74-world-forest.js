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
  // a woodcutter at the stump by the glade, splitting logs
  { const cutter = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: false }), shirt: 0xb5485f, stripes: 0x1e1e24, pants: 0x3c4a5a, shoes: 0x3a2a1e, axe: true, beard: true, build: 'stout', hat: null, glasses: false });
    W.add(cutter.group);
    game.npcs.push(new Chopper(game, cutter, { x: -6, z: 3.6, ry: PI, cries: ['Mind the chips, puss.', 'Timber! ...just kidding.', 'Good dry oak, this.'] })); }
  // a hiker walks the stepping stones from the hollow oak down to the glade and back
  { const hiker = makeHuman({ ...randomPerson(r, { female: r.chance(0.5) }), shirt: 0xef7d2f, pants: 0x4c6b3c, shoes: 0x5a4030, backpack: 0x2f6fd6, hat: 'cap', hatColor: 0x2e4a3a, scarf: null, jacket: null });
    W.add(hiker.group);
    game.npcs.push(new Patroller(game, hiker, { points: [[0.6, 44], [sin(4 * 0.7) * 1.6, 40 - 4 * 2.6], [sin(9 * 0.7) * 1.6, 40 - 9 * 2.6], [3, 2], [8.5, -2]], speed: 0.85, pause: [2, 5],
      cries: ['What a walk! Have you seen the treehouse?', 'Mind the frogs by the pond.', 'The fairies come out at dusk, you know.'], cryIcon: '\ud83c\udf32' })); }
  // a forager kneels by the mushroom patch, picking chanterelles
  { const forager = makeHuman({ ...randomPerson(r, { female: true, elder: true, child: false, hairStyle: 'bun' }), shirt: 0x6b4f8a, apron: 0xd9c9a8, skirt: 0x4a3a5a, shoes: 0x3a2a1e, hat: 'bonnet', hatColor: 0x6b4f8a, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(forager.group);
    game.npcs.push(new Forager(game, forager, { x: -9, z: -24, ry: 1.1, cries: ['Chanterelles today - lovely with butter.', 'Mind the fairy rings, puss.', 'These woods feed a body well, if you know where to look.'] })); }
  // a birdwatcher stands near the owls' tree, binoculars raised every few seconds
  { const birder = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }), shirt: 0x5a7a4a, jacket: 0x3a4a2e, pants: 0x4a4030, shoes: 0x3a2a1e, hat: 'cap', hatColor: 0x3a4a2e, scarf: null, bag: null, glasses: true });
    W.add(birder.group);
    game.npcs.push(new Birder(game, birder, { x: 35, z: 27, ry: -2.4,
      cries: ["There! ...no, just a leaf.", 'Ssh - a woodpecker, three trees over.', "That owl's been in the same tree all week."] })); }
  // an artist sets up an easel among the giant mushrooms, painting the glade
  { const artist = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: false }), shirt: 0x6b7a5a, pants: 0x4a4030, shoes: 0x3a2a1e, apron: 0xd9c9a8, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(artist.group);
    game.npcs.push(new Painter(game, artist, makeEasel(), { x: 6, z: 20, ry: -2.0,
      cries: ['The light here is far too good to waste.', "I swear that mushroom moved when I wasn't looking.", 'Nearly got the whiskers right, this time.'] })); }
  // a child chases fireflies near the glade with a jam-jar, never quite catching one
  { const chaser = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true }), shirt: 0x3a6a4a, pants: 0x2e4a3a, shoes: 0x3a2a1e, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(chaser.group);
    game.npcs.push(new Wanderer(game, chaser, { x: -10, z: -8, speed: 1.1, leash: 7, height: 1.3, r: 0.3, idle: [1, 3], walk: [1.5, 4],
      cries: ['Nearly caught one!', 'They twinkle if you creep up slow.', "Don't tell my mum I'm still out."], cryIcon: '✨' })); }
  // an old whittler sits on the eastern stump, carving away at a block of wood
  { const whittler = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: true }), shirt: 0x8a6a4a, pants: 0x4a4030, shoes: 0x3a2a1e, apron: 0xc9a86a, hat: 'flatcap', hatColor: 0x4a4030, scarf: null, jacket: null, bag: null, glasses: false, beard: true });
    W.add(whittler.group);
    game.npcs.push(new Sitter(game, whittler, { x: 18, z: 24, ry: -2.5, seat: 0.72,
      cries: ['Carving a mouse, for luck.', "Sit a while - the stump's plenty wide.", 'Whittled worse things than a cat, in my time.'] })); }
  // an angler sits at the glowing pond's edge, rod dipped in, the odd bite
  { const anglerWard = makeWardrobe(r, { shirts: [0x4a6a5a, 0x5a5a4a, 0x3a5a6a], pants: [0x3a3a3a, 0x2a2a2a], shoes: [0x2a2018, 0x1e2020] });
    const angler = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), elder: true, child: false, wardrobe: anglerWard }),
      hat: 'cap', hatColor: 0x3a4a3a, coat: true, scarf: null, jacket: null });
    W.add(angler.group);
    game.npcs.push(new IceFisher(game, angler, makeIceStool(), { x: 8, z: -1, ry: PI, holeX: 8, holeZ: -3, holeY: P.ground0(8, -6) + 0.06,
      cries: ['Something bites in that glow, I swear.', "Careful, puss - don't spook them.", 'Caught one shaped like a star, once.'] })); }
  // an old woman knits on the western stump, a ball of wool in her lap - the "eastern stump" whittler's quiet counterpart
  { const knitter = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: true, hairStyle: 'bun' }), shirt: 0x8a4a5a, apron: 0xd9c9a8, skirt: 0x4a3a5a, shoes: 0x3a2a1e, hat: 'bonnet', hatColor: 0x6b4f8a, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(knitter.group);
    game.npcs.push(new Sitter(game, knitter, { x: -26, z: -22, ry: 0.8, seat: 0.72,
      cries: ['Knit one, purl one - mind your claws.', 'This scarf is nearly done, if the light holds.', 'Sit a spell, if you like; the wool keeps me busy.'] })); }
  // a girl rests on the last of the four stumps, threading a daisy chain, in no hurry to finish it
  { const weaver = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: false }), shirt: 0x5a8a6a, pants: 0x3a4a3a, shoes: 0x3a2a1e, hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(weaver.group);
    game.npcs.push(new Sitter(game, weaver, { x: 4, z: -16, ry: 2.6, seat: 0.72,
      cries: ['One for luck, one for love.', "Sit if you like - there's room enough.", 'Lost count again. No matter.'] })); }
  // two campers rest at the foot of the treehouse's rope ladder, swapping theories about who lives up there
  { const wardA = makeWardrobe(r, { shirts: [0x3a6a8a, 0x4a7a5a], pants: [0x2e3a4a, 0x3a4a3a], shoes: [0x2a2018, 0x1e2020] });
    const a = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: false, wardrobe: wardA }), backpack: 0x2f6fd6, hat: 'cap', hatColor: 0x2a4a3a, scarf: null, jacket: null, bag: null, glasses: false });
    const b = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: false }), backpack: 0xd2691e, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(a.group); W.add(b.group);
    game.npcs.push(new Talkers(game, a, b, { x: -19, z: 8.5, ry: 0,
      lines: ['Wonder who built that treehouse.', "Best view in the woods, I'd wager.", "Careful - you'll wake whoever lives up there.", 'No ladder for us, my knees say.'] })); }

  // three children ring-dance in a clearing east of the glade — everyone knows three turns of the fairy ring earns a wish
  { const ringWard = makeWardrobe(r, { shirts: [0xef7d2f, 0x5a8a6a, 0x2f6fd6], pants: [0x2e4a3a, 0x3a3a3a, 0x4a3a2a], shoes: [0x3a2a1e, 0x2a2018] });
    const dancers = [true, false, true].map((female) => { const rig = makeHuman({ ...randomPerson(r, { female, child: true, wardrobe: ringWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false }); W.add(rig.group); return rig; });
    game.npcs.push(new RingDance(game, dancers, { cx: 21, cz: 0, r: 1.8, speed: 0.6, turnEvery: 8, cryIcon: '🧚',
      cries: ['Round and round, three times for a wish!', "Don't stop 'til the ring says so!", 'Faster - before the fairies notice!'] })); }

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
