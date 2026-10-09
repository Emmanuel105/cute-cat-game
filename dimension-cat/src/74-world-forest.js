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
  // the Neighborhood's park pond (round 199), the Victorian canal (round 273) and Candy Land's chocolate
  // river (round 275) all got something actually living on the water, but the survey that closed those
  // gaps never checked this glade's own glowing pond — the frogs only ever hop its rim and the angler
  // only ever works its edge, same as the painter and the old fisherman did before round 199. A drake and
  // a hen now paddle slow circles on the pond itself, dipping their heads toward the glow every few
  // seconds with an occasional quack. Fixed phases and speeds throughout, nothing drawn from this world's
  // own seeded `r`, so no later mushroom hue or butterfly colour pick shifts. The 2.3 m swim ring sits
  // well inside the pond's own 4.5 m radius, short of the reeds that only start past 5.0 m out, the same
  // margin the park pond's own ducks kept from its rocks.
  { const pcx = 8, pcz = -6, prad = 2.3, pY0 = P.ground0(pcx, pcz);
    const drake = makeDuck({ drake: true }); W.add(drake.group);
    const hen = makeDuck({ drake: false }); W.add(hen.group);
    const ducks = [[drake, 0, 0.17], [hen, PI, 0.22]];
    U.push((dt, t) => { for (const [d, phase, speed] of ducks) {
      const a = t * speed + phase, dx = -sin(a), dz = cos(a);
      d.group.position.set(pcx + cos(a) * prad, pY0 + 0.07 + sin(t * 2.2 + phase) * 0.012, pcz + sin(a) * prad);
      d.group.rotation.y = atan2(dx, dz);
      d.head.rotation.x = sin(t * 0.6 + phase * 2) > 0.88 ? 0.5 : 0;   // the occasional dip toward the glow
    } });
    let quackT = 7; U.push((dt) => { quackT -= dt; if (quackT <= 0) { SFX.squawk(); quackT = rnd.range(10, 18); } }); }
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; const m = makeMushroom(0.45, r.pick([0, 300, 200]), r, true); placeT(game, U, m, cos(a) * 6.5 - 6, sin(a) * 6.5 + 8, 0); if (m.userData.update) U.push(m.userData.update); }
  // the storyteller and the ring-dance kids both swear three turns of the fairy ring earns a wish, but
  // the ring itself — the 14 mushrooms circling (-6, 8) above — had never actually granted one; nothing
  // ever happened if the cat walked into it. The cat can now step inside for a soft chime, a scatter of
  // fairy-light sparkles, and one of three wishes, picked with `rnd.pick()` at the moment of use (the
  // same trick the Candy Land fountain's own wishes already use) rather than this world's own seeded `r`
  // at build time, so it can't shift any later mushroom hue or butterfly colour pick. No new mesh and no
  // physics box: the ring has stood open ground since round 1 (`placeT` with no `boxT` call, just above),
  // so a bare marker group at its own centre is all `addInteractable` needs — at a 7 m radius, wide enough
  // to catch the cat anywhere inside the ring's own 6.5 m spread, not just right at the rim. Clear of
  // every neighbour checked: 13.4 m from the treehouse, 19.8 m from the glowing pond, well past both.
  { const rcx = -6, rcz = 8, ry0 = P.ground0(rcx, rcz);
    const ringCenter = group(rcx, ry0, rcz, W);
    const ringWishes = ['🧚 Three turns, and the ring felt a little warmer underfoot.', '🧚 Somewhere, a fairy almost noticed.', '🧚 "Wish granted. Terms and conditions may apply."'];
    game.addInteractable({ obj: ringCenter, radius: 7, label: () => 'Turn three times in the fairy ring', onUse: () => {
      SFX.twinkle(); game.fx.emit(rcx, ry0 + 0.3, rcz, { count: 16, colors: [0xa8ff9a, 0xffd1ff, 0x9fe8ff], speed: 1.1, up: 1.4, life: 1.0, gravity: 2 });
      game.toast(rnd.pick(ringWishes)); } }); }
  let bigMushroom = null;
  for (const [x, z, s, hue] of [[-14, -14, 2.6, 0], [16, 12, 3.2, 200], [-20, 0, 2.2, 300], [14, -20, 2.4, 40], [-2, -22, 2.9, 0], [24, -4, 2.0, 280], [-24, 20, 2.6, 200], [4, 24, 2.3, 0]]) { const m = makeMushroom(s, hue, r, true); placeT(game, U, m, x, z, 0); boxT(game, x, z, 0.5 * s, 1.3 * s, 0.5 * s, { cam: false }); U.push(m.userData.update); if (x === 14 && z === -20) bigMushroom = m; }
  // the fairy ring, the zipline tower and the treehouse have all had a one-off "walk up and look" toast
  // for rounds now, but none of the eight giant glowing mushrooms scattered round the glade ever got one
  // — the one real landmark shape unique to these woods, and the cat could only ever walk past it. The
  // one at (14, -20) reuses its own already-built group (`bigMushroom`, captured from the loop above that
  // builds it) straight as `addInteractable`'s `obj` — no new mesh, no new physics box; it already escapes
  // baking since every mushroom in this set is built with `glow: true` and carries its own `userData.update`
  // for the pulsing cap light. A headless probe built the real Whisper Woods (`game.load(6, 'from-hub')`)
  // and swept this point against every physics box and 3000 simulated frames of every NPC's own position:
  // the nearest other box stayed 9.0 m clear and the nearest grounded creature (a wandering hopper) never
  // closer than 8.0 m, well past this interactable's 3.6 m radius — only passing butterflies and fairies,
  // flying well overhead, ever come closer, which is no obstruction at all.
  game.addInteractable({ obj: bigMushroom, radius: 3.6, label: () => 'Look up at the mushroom', onUse: () => { SFX.click(); game.toast(rnd.pick(['🍄 "Taller than the treehouse ladder, nearly. And it just sits there glowing."', "🍄 \"Nobody's ever eaten this one. Nobody's brave enough to find out why it glows.\"", '🍄 "The cap alone could shelter a whole family of frogs."']), 3000); } });
  for (let i = 0; i < 30; i++) { const x = r.range(-40, 40), z = r.range(-40, 40); if (dist2(x, z, 8, -6) < 36) continue; placeT(game, U, makeMushroom(r.range(0.25, 0.6), r.pick([0, 20, 200, 300, 40]), r, r.chance(0.4)), x, z, 0); }
  // trees: a ring at the edge and scattered giants
  for (let i = 0; i < 40; i++) { const a = i / 40 * TAU + r.range(-0.06, 0.06), d = r.range(40, 54); treeAt(cos(a) * d, sin(a) * d, { simple: true }); }
  const inner = [[-30, -10], [-28, 12], [-12, 30], [12, 32], [30, 22], [34, -12], [22, -30], [-6, -34], [-34, -30], [26, 4], [-16, -26], [0, 34]];
  for (const [x, z] of inner) treeAt(x, z, { lanterns: r.chance(0.5) });
  const treehouse = makeTreehouse(game, -18, 14, r);
  // a wind chime under the treehouse's own back eave, away from the ladder and lit window on the front
  // side — reuses the Neighborhood porch's makeWindChime() with a mossier, woodland palette
  { const y0t = P.ground0(-18, 14), chime = makeWindChime(game, { wood: 0x6b4a2a, metal: 0x7a9a7a });
    place(game, U, chime, -16.3, 12.0, 0, y0t + 6.5); }
  // the Neighborhood, Candy Land, Sunny Shore and Robot City all have a toy pinwheel spinning
  // somewhere by now, planted by somebody's own front door — Whisper Woods never had one, past the
  // wind chime hung above. A small toadstool-coloured one now stands in the dirt south of the
  // treehouse, the kid up top's own toy, left out mid-climb. Spins on the world clock `t` alone, the
  // same trick every pinwheel before it uses, so it draws nothing from this world's own seeded `r`
  // and can't shift any later mushroom hue or butterfly colour pick.
  // A real headless probe (travelling the built world and sweeping every physics box, NPC position
  // and physics circle already placed into it) found (-18, 11): 3 m due south of the treehouse's own
  // trunk box (half-width 1.6, so 1.4 m clear of its face), 3 m clear of the nearest other soul and
  // 2.2 m clear of the nearest physics circle — sitting between the treehouse above (z=14) and the
  // two campers and the pot-scrubber further south (z=8.5 and z=8).
  { const px = -18, pz = 11, y0p = P.ground0(px, pz), stickH = 0.6, bladeLen = 0.22;
    const pin = group(px, y0p, pz, W), stickMat = mat(0x6b4a2a, { roughness: 0.9 }), hubMat = mat(0xd9a23a, { metalness: 0.3, roughness: 0.4 });
    mesh(G.cyl(0.016, 0.02, stickH, 8), stickMat, { y: stickH / 2, parent: pin });
    const pivot = group(0, stickH, 0, pin);
    const bladeColors = [0xd0451f, 0xf7f3ec, 0x7a9a7a, 0xf7f3ec];
    for (let bi = 0; bi < 4; bi++) { const theta = bi * PI / 2, bx = cos(theta) * bladeLen / 2, by = sin(theta) * bladeLen / 2;
      mesh(G.box(bladeLen, 0.16, 0.02), mat(bladeColors[bi], { roughness: 0.5 }), { x: bx, y: by, rz: theta, parent: pivot }); }
    mesh(G.sphere(0.035, 8, 6), hubMat, { parent: pivot });
    U.push((dt, t) => { pivot.rotation.z = t * 3.6; });
    P.addBox(px, y0p + stickH / 2, pz, 0.12, stickH, 0.12, { cam: false });
  }
  const lantern1 = makeLanternString(game, -30, -10, -12, -26, 8, 4.0), lantern2 = makeLanternString(game, 12, 32, 30, 22, 7, 4.2), lantern3 = makeLanternString(game, -16, -26, 8, -30, 7, 4.4); U.push(lantern1.update, lantern2.update, lantern3.update);
  makeFerns(game, [[0, 0, 36, 140]], r);
  for (const [x, z, ry] of [[12, 14, 0.6], [-8, -18, 2.2], [22, -14, 1.1], [-22, -6, 0.2], [2, 12, 1.4]]) { placeT(game, U, makeHollowLog(r), x, z, ry); boxT(game, x, z, 1.4, 1.2, 1.4, { cam: false }); }
  // the throne, the fountain, Robot City's statue, the Neighborhood's signpost, the fairy ring,
  // Victorian's clock tower, Sunny Shore's lighthouse and Frosty Peak's own zipline tower have all had
  // a one-off "walk up and look" toast for rounds now — but this zipline, the one `makeZipline` was
  // written for first, never got the same treatment, even after round 283 flagged it as leftover work.
  // Same trick as Frosty Peak's: `makeZipline`'s own return value (previously discarded here) is kept
  // and its `tower` handed straight to a single `game.addInteractable`. No new mesh, no new physics box
  // — the tower's existing base box (full size 2.0 x 4.6 x 2.0, half-extent 1.0 in x and z) already
  // keeps the cat from getting closer than 1.0 m to the centre face-on, so a 4.2 m radius, the same used
  // at Frosty Peak, is reachable from any side without reaching the cable attendant 3.6 m away at
  // (-33, 28) — the same overlap-is-fine case as the lighthouse and its keeper, since `game.nearest`
  // always resolves to whichever interactable centre is actually closest. The line is picked with
  // `rnd.pick()` at the moment of use, never this world's own seeded `r` at build time, so it costs no
  // later mushroom hue or butterfly colour draw.
  const forestZip = makeZipline(game, U, -30, 30, 20, 34, r);
  const forestZipLines = ['🚡 "Same four posts since it went up. The squirrel\'s the only one who trusts them."', '🚡 "Straight down to the glade from here — the fairies never fly this high."', '🚡 "You can see clean over the treehouse roof from up here, when the owls aren\'t glaring."'];
  game.addInteractable({ obj: forestZip.tower, radius: 4.2, label: () => 'Look up at the zipline tower', onUse: () => { SFX.click(); game.toast(rnd.pick(forestZipLines), 3000); } });
  makeGemCluster(game, U, -6, 8, 7, [0xa8ff9a, 0x7fe0ff, 0xffd54a, 0xff6fb5], r, 1.6); makeGemCluster(game, U, -12, 22.5, 4, [0xc8a2ff, 0xa8ff9a], r, 0.9);
  for (const [x, z] of [[-6, 2], [18, 24], [-26, -22], [4, -16]]) { placeT(game, U, makeStump(r), x, z, r() * TAU); boxT(game, x, z, 1.0, 0.75, 1.0, { cam: false }); }
  for (const [x, z] of [[-24, 30], [32, 8], [-36, 6], [8, -38]]) placeT(game, U, makeRock(r, 0x6b7a6a, r.range(1.2, 2.2)), x, z, 0);
  // stepping stones from the entrance to the glade
  for (let i = 0; i < 14; i++) { const z = 40 - i * 2.6, x = sin(i * 0.7) * 1.6; mesh(G.cyl(0.55, 0.6, 0.12, 9), mat(0x8a8a80, { roughness: 1 }), { x, y: P.ground0(x, z) + 0.05, z, ry: r() * TAU, shadow: 'receive', parent: W }); }

  // life: deer, foxes, frogs, owls, fairies, butterflies, the squirrel
  for (const [x, z] of [[-24, 4], [20, 20], [-10, -30]]) { const rig = makeDeer(); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x, z, speed: 0.6, leash: 9, r: 0.45, height: 1.4, step: 0.3, idle: [3, 7], walk: [2, 5] })); }
  // a woman kneels at the fringe of the trees, scattering acorns for the western deer
  { const dx = -24, dz = 4, kx = dx + 2.2, kz = dz - 1.0;
    const feeder = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: false }), shirt: 0x6b8a5a, pants: 0x4a4030, shoes: 0x3a2a1e, bag: 0x8a6a4a, hat: null, scarf: null, jacket: null, backpack: null, glasses: false });
    W.add(feeder.group);
    game.npcs.push(new Kneeler(game, feeder, { x: kx, z: kz, ry: atan2(dx - kx, dz - kz),
      cries: ["Acorns bring them close, if you're quiet.", 'Careful, puss — you\'ll scare them off.', 'That one always comes first.'] })); }
  for (const [x, z] of [[14, 6], [-26, -14]]) { const rig = makeFox(); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x, z, speed: 1.3, leash: 10, r: 0.3, height: 0.8, step: 0.3, idle: [1, 3], walk: [2, 5] })); }
  // a third, bolder fox: it minds its own business until the cat wanders close, then trots over for a look
  { const rig = makeFox(); W.add(rig.group);
    game.npcs.push(new Follower(game, rig, { x: 32, z: -22, r: 0.3, height: 0.8, step: 0.3, idle: [1, 3], walk: [2, 4], leash: 8, speed: 1.6, range: 13, keep: 2.0, sfx: () => SFX.bark() })); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, x = 8 + cos(a) * 5.6, z = -6 + sin(a) * 5.6; const rig = makeFrog(r.pick([0x4caf50, 0x8bc34a, 0x2e7d32])); game.npcs.push(new Hopper(game, rig, { x, z, leash: 4, r: 0.15, dist: [0.4, 1.1], dur: 0.35, height: 0.35, idle: [1, 4], onHop: () => { if (rnd.chance(0.3)) SFX.ribbit(); } })); }
  let friendlyOwl = null, watchedOwl = null, thirdOwl = null;
  for (const [i, [x, z, tree]] of [[-30, -10, 0], [30, 22, 0], [12, 32, 0]].entries()) { const owl = makeOwl(); const y = P.ground0(x, z) + 6.6; owl.group.position.set(x + 1.8, y, z); owl.group.rotation.y = atan2(-x, -z); W.add(owl.group); mesh(G.cyl(0.08, 0.1, 1.6, 6), mat(0x4a3323), { x: x + 1.2, y: y - 0.05, z, rz: PI / 2, parent: W }); let ot = r() * 10; U.push((dt) => { ot += dt; owl.animate(0, false, dt, ot); }); if (i === 0) friendlyOwl = owl; if (i === 1) watchedOwl = owl; if (i === 2) thirdOwl = owl; }
  let hootT = 6; U.push((dt) => { hootT -= dt; if (hootT <= 0) { SFX.hoot(); hootT = rnd.range(8, 16); } });
  // the nearest owl will answer a hello - the one keeping watch over the western trees
  { const oid = game.namedFriend('owl'); game.addInteractable({ obj: friendlyOwl.group, radius: 3.4, label: () => 'Say hello to the owl', onUse: () => { game.befriend(oid); SFX.hoot(); game.hearts(friendlyOwl.group.position.x, friendlyOwl.group.position.y - 0.4, friendlyOwl.group.position.z, 3); game.toast('🦉 "Who? Oh - just you."'); } }); }
  // the owl the birdwatcher keeps mistaking for a woodpecker will say hello too
  { const oid2 = game.namedFriend('owl2'); game.addInteractable({ obj: watchedOwl.group, radius: 3.4, label: () => 'Say hello to the owl', onUse: () => { game.befriend(oid2); SFX.hoot(); game.hearts(watchedOwl.group.position.x, watchedOwl.group.position.y - 0.4, watchedOwl.group.position.z, 3); game.toast('🦉 "Not a woodpecker. Never was."'); } }); }
  // the third owl, over by the treehouse's lantern string, answers too
  { const oid3 = game.namedFriend('owl3'); game.addInteractable({ obj: thirdOwl.group, radius: 3.4, label: () => 'Say hello to the owl', onUse: () => { game.befriend(oid3); SFX.hoot(); game.hearts(thirdOwl.group.position.x, thirdOwl.group.position.y - 0.4, thirdOwl.group.position.z, 3); game.toast('🦉 "Hoo? ...Hoo. That\'s the whole conversation, really."'); } }); }
  // the birdwatcher keeps swearing it's a woodpecker, three trees over, and the second owl gets blamed
  // for the knocking every time — there was never an actual woodpecker in these woods until now. One
  // clings to the very same trunk as that "not a woodpecker" owl, on the trunk's far side from its own
  // branch (the owl sits out at local +x, z unchanged; the woodpecker sits in at local x≈-0.72, z≈+0.3,
  // low on the trunk rather than up at the owl's branch height), hammering away in short bursts every
  // few seconds. No physics box, same as the owls and the branch they perch on — purely decorative and
  // non-colliding, so it changes no walkable-ground percentage and needs no keep-out probe.
  { const tx = 30, tz = 22, dx = -0.72, dz = 0.3, wx = tx + dx, wz = tz + dz, wy = P.ground0(tx, tz) + 2.2;
    const woodpecker = makeWoodpecker(); W.add(woodpecker.group);
    woodpecker.group.position.set(wx, wy, wz); woodpecker.group.rotation.y = atan2(dx, dz);
    let peckT = r.range(2.5, 5), burst = 0;
    U.push((dt) => {
      peckT -= dt;
      if (peckT <= 0) { burst = 0.4; SFX.peck(); peckT = rnd.range(5, 11); }
      if (burst > 0) { burst = max(0, burst - dt); woodpecker.head.rotation.x = -0.5 * abs(sin((0.4 - burst) * 26)); }
      else if (woodpecker.head.rotation.x !== 0) woodpecker.head.rotation.x = 0;
    });
    const wid = game.namedFriend('woodpecker');
    game.addInteractable({ obj: woodpecker.group, radius: 2.6, label: () => 'Say hello to the woodpecker', onUse: () => {
      game.befriend(wid); SFX.peck(); game.hearts(wx, wy + 0.1, wz, 3);
      game.toast('🐦 "The actual woodpecker. The owls get all the credit."'); } }); }
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
  // a child chases fireflies near the glade with a jam-jar, never quite catching one — the dialogue has
  // named the jar since round 127's own build, but nothing was ever actually in the kid's hand. One now
  // hangs from a wire bail handle gripped in the right fist: empty glass, same as the cries keep admitting.
  { const chaser = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true }), shirt: 0x3a6a4a, pants: 0x2e4a3a, shoes: 0x3a2a1e, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(chaser.group);
    const jar = group(0, 0.0, 0.08, chaser.hands[0]); jar.rotation.x = 0.1;
    const glassM = mat(0xdce8d8, { roughness: 0.15, transparent: true, opacity: 0.35 }), lidM = mat(0x8a7a5a, { roughness: 0.6 }), wireM = mat(0x8a8a82, { metalness: 0.6, roughness: 0.4 });
    mesh(G.cyl(0.04, 0.036, 0.09, 10), glassM, { y: -0.05, shadow: 'none', parent: jar });
    mesh(G.cyl(0.042, 0.042, 0.015, 10), lidM, { y: 0.0025, shadow: 'none', parent: jar });
    mesh(G.torus(0.045, 0.006, 5, 12), wireM, { y: 0.03, rx: PI / 2, shadow: 'none', parent: jar });
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

  // the Neighborhood washes a car, Candy Land sweeps a doorstep and Frosty Peak shovels snow — the same
  // `Washer` scrubbing motion, reused each time for a different chore — but Whisper Woods never had one
  // of its own. A third camper gives the breakfast pot a scrub on an old stump pressed into service as a
  // washing-up table, a few steps from the other two still arguing about the treehouse. A headless probe
  // swept a 20 s clearance scan (every physics box and every NPC's own position, including the wandering
  // deer and fox and the two campers' own circles) around the campsite: (-14, 8) came back clear by over
  // 4 m throughout, with the campers themselves the nearest other souls at a little over 5 m.
  { const wx = -14, wz = 8, ry = atan2(-19 - wx, 8.5 - wz);
    const px = wx + sin(ry) * 0.9, pz = wz + cos(ry) * 0.9, py0 = P.ground0(px, pz);
    placeT(game, U, makeStump(r), px, pz, r() * TAU); boxT(game, px, pz, 1.0, 0.75, 1.0, { cam: false });
    const potM = mat(0x6a6a6a, { metalness: 0.5, roughness: 0.4 });
    const pot = group(px, py0 + 0.72, pz, W);
    mesh(G.cyl(0.16, 0.18, 0.2, 14), potM, { y: 0.1, parent: pot });
    for (const s of [-1, 1]) mesh(G.torus(0.02, 0.012, 4, 8), potM, { x: s * 0.18, y: 0.14, rz: PI / 2, parent: pot });
    mesh(G.cyl(0.17, 0.17, 0.02, 14), mat(0xdcecff, { roughness: 0.3, transparent: true, opacity: 0.8 }), { y: 0.21, shadow: 'none', parent: pot });
    const campWard = makeWardrobe(r, { shirts: [0x6a8a5a, 0x5a7a8a, 0x8a6a5a], pants: [0x3a3a3a, 0x2a2a2a], shoes: [0x3a2a1e, 0x2a2018] });
    const scrubber = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: campWard }),
      backpack: r.chance(0.5) ? 0x8a6a4a : null, hat: r.chance(0.4) ? 'cap' : null, hatColor: 0x3a4a3a, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(scrubber.group);
    game.npcs.push(new Washer(game, scrubber, { x: wx, z: wz, ry,
      cries: ["Someone's got to do the pot.", 'Careful, puss — mind the soot.', "Breakfast's half the work. Washing-up's the rest."] })); }

  // the campers below keep guessing who lives up in the treehouse — it's a kid, sitting on the deck's
  // own open front edge (the railings only run along the sides, per makeTreehouse), legs dangling over.
  // No ground-level physics circle: like the owls up in their trees, greeted by horizontal distance alone,
  // so it never blocks the cat from walking under the treehouse.
  { const tkx = -18.9, tkz = 16.15, tkDeckY = P.ground0(tkx, tkz) + 4.4;
    const treeKid = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true }), shirt: 0xd9a23a, pants: 0x3a4a3a, shoes: 0x3a2a1e, hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(treeKid.group); treeKid.group.rotation.y = 0;
    treeKid.group.position.set(tkx, tkDeckY - 0.9 * treeKid.k + 0.02, tkz);
    let tkt = r() * 10, waveT = rnd.range(4, 8);
    U.push((dt) => {
      tkt += dt; treeKid.animate(0, false, dt, tkt);
      for (const L of treeKid.legs) { L.hip.rotation.x = -PI / 2 + 0.12 + sin(tkt * 1.1) * 0.06; L.knee.rotation.x = PI / 2 - 0.2; L.ankle.rotation.x = 0.1; }
      treeKid.spine.rotation.x = damp(treeKid.spine.rotation.x, -0.08, 6, dt); treeKid.body.position.y = 0;
      if (!treeKid.gesture) { waveT -= dt; if (waveT <= 0) { treeKid.gesture = 'wave'; treeKid.gT = 0; waveT = rnd.range(7, 13); } }
    });
    const tkid = game.namedFriend('treehouse-kid');
    game.addInteractable({ obj: treeKid.group, radius: 3.6, label: () => 'Wave up at the treehouse', onUse: () => {
      game.befriend(tkid); SFX.talk(); game.hearts(tkx, tkDeckY + 0.4, tkz, 3);
      game.toast(rnd.pick(['🌳 "Took you long enough to look up!"', '🌳 "Best clubhouse in the whole wood."', '🌳 "Don\'t tell the campers down there — it\'s a secret."'])); } }); }

  // a child kneels at the mouth of the eastern hollow log, sure a hedgehog is still in there — the log itself (22, -14) has stood empty since it was first placed
  { const lx = 22, lz = -14, lry = 1.1, off = 2.5, kx = lx - off * cos(lry), kz = lz + off * sin(lry);
    const hunter = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true }), shirt: 0xd9a23a, pants: 0x3a4a3a, shoes: 0x3a2a1e, hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(hunter.group);
    game.npcs.push(new Kneeler(game, hunter, { x: kx, z: kz, ry: atan2(lx - kx, lz - kz),
      cries: ["It's in there, I heard it snuffle.", 'Shh - you\'ll frighten it further in.', 'There! ...no. Gone again.'] })); }

  // the child above was right all along: a hedgehog really does live in that log, just out of their reach.
  // The log's own box (boxT, unrotated, half 0.7) is only a crude stand-in for the true cylinder, which runs
  // 1.7 m either way along its rotated axis (L=3.4 in makeHollowLog) — so the real mouth nearest the child
  // sits further out, at lx - 1.7*cos(lry), lz + 1.7*sin(lry) ≈ (21.23, -12.49), same bearing the child's own
  // kx/kz formula uses. A headless probe swept that bearing outward from the opening in 0.05 m steps: clear
  // of both the log's box and the child's own 0.35 m kneeling circle out to 0.3 m, blocked from 0.35 m on
  // (the child's circle, their stick almost reaching) — so the hedgehog's leash is kept well inside that,
  // poking its nose out, freezing, and ducking back, never quite within the stick's reach
  { const lx = 22, lz = -14, lry = 1.1, dirx = -cos(lry), dirz = sin(lry), hx = lx + 1.9 * dirx, hz = lz + 1.9 * dirz;
    const rig = makeHedgehog();
    game.npcs.push(new Hopper(game, rig, { x: hx, z: hz, leash: 0.18, r: 0.1, dist: [0.08, 0.16], dur: 0.3, height: 0.12, idle: [1.5, 4],
      onHop: () => { if (rnd.chance(0.25)) SFX.chitter(); } })); }

  // a naturalist kneels by the log up near the stepping stones — the only one of the five hollow logs nobody had stopped at yet — noting the moss along its bark
  { const lx = 12, lz = 14, lry = 0.6, off = 1.5, kx = lx + off * sin(lry), kz = lz + off * cos(lry);
    const naturalist = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3) }), shirt: 0x5a6a4a, pants: 0x4a4030, shoes: 0x3a2a1e, bag: 0x8a6a4a, hat: 'cap', hatColor: 0x3a4a2e, scarf: null, jacket: null, backpack: null, glasses: true });
    W.add(naturalist.group);
    game.npcs.push(new Kneeler(game, naturalist, { x: kx, z: kz, ry: atan2(lx - kx, lz - kz),
      cries: ['This moss only grows on the north side, you know.', 'Careful, puss — mind the notebook.', "Species forty, if I've counted right."] })); }

  // an old woman kneels at the last of the five hollow logs, the one at (2, 12) everyone else has always walked past — she leaves an acorn there, same as always
  { const lx = 2, lz = 12, lry = 1.4, off = 1.5, kx = lx + off * sin(lry), kz = lz + off * cos(lry);
    const keeper = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: true, hairStyle: 'bun' }), shirt: 0x4a5a6a, pants: 0x3a3a4a, shoes: 0x3a2a1e, hat: 'bonnet', hatColor: 0x4a5a6a, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(keeper.group);
    game.npcs.push(new Kneeler(game, keeper, { x: kx, z: kz, ry: atan2(lx - kx, lz - kz),
      cries: ['One acorn, every visit. Old habit.', "Careful, puss — that offering isn't yours.", "Can't say what takes them. Just that they go."] })); }

  // despite that last log's own write-up, two of the wood's five hollow logs had stood empty all along:
  // (-8, -18) and (-22, -6) never got anyone. A girl kneels at the nearer one now, ear almost against the
  // bark, a stick held just inside the opening
  { const lx = -8, lz = -18, lry = 2.2, off = 2.5, kx = lx - off * cos(lry), kz = lz + off * sin(lry);
    const dormouseHunter = makeHuman({ ...randomPerson(r, { female: true, child: true }), shirt: 0x5a8acf, pants: 0x3a4a3a, shoes: 0x3a2a1e, hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(dormouseHunter.group);
    game.npcs.push(new Kneeler(game, dormouseHunter, { x: kx, z: kz, ry: atan2(lx - kx, lz - kz),
      cries: ["I can hear it snoring, I swear.", 'Shh - you\'ll wake the dormouse.', "Nearly got the stick in far enough."] })); }

  // the fifth and last hollow log, at (-22, -6), sat empty through all of that too — a boy now kneels by it, arm shoved in
  // to the shoulder after the ball that rolled inside; placed off to its north-east, the one corner that clears both the
  // fox denned at (-26, -14) and the deer at (-24, 4) and their wander leashes, even if only by a shin's width
  { const lx = -22, lz = -6, kx = -19.67, kz = -5.1;
    const ballHunter = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true }), shirt: 0x7a3a3a, pants: 0x3a3a4a, shoes: 0x3a2a1e, hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(ballHunter.group);
    game.npcs.push(new Kneeler(game, ballHunter, { x: kx, z: kz, ry: atan2(lx - kx, lz - kz),
      cries: ["Nearly got it... nearly—", "If something bites me, I'm blaming the dog.", "Found a conker. Not what I was after, but I'll take it."] })); }

  // three children ring-dance in a clearing east of the glade — everyone knows three turns of the fairy ring earns a wish
  { const ringWard = makeWardrobe(r, { shirts: [0xef7d2f, 0x5a8a6a, 0x2f6fd6], pants: [0x2e4a3a, 0x3a3a3a, 0x4a3a2a], shoes: [0x3a2a1e, 0x2a2018] });
    const dancers = [true, false, true].map((female) => { const rig = makeHuman({ ...randomPerson(r, { female, child: true, wardrobe: ringWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false }); W.add(rig.group); return rig; });
    game.npcs.push(new RingDance(game, dancers, { cx: 21, cz: 0, r: 1.8, speed: 0.6, turnEvery: 8, cryIcon: '🧚',
      cries: ['Round and round, three times for a wish!', "Don't stop 'til the ring says so!", 'Faster - before the fairies notice!'] })); }

  // a reader sits on the grass south of the glade with a book — the clearest ground left in the whole wood by a headless probe (18.9 m from the nearest neighbour)
  { const reader = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.4) }), shirt: 0x6a5a8a, pants: 0x3a3a4a, shoes: 0x3a2a1e, hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: r.chance(0.5) });
    W.add(reader.group);
    const book = group(0, -0.02, 0.14, reader.hands[1]); book.rotation.x = -1.35; book.rotation.z = 0.15;
    mesh(G.box(0.26, 0.02, 0.19), mat(0xe8dcc0, { roughness: 1 }), { parent: book });
    mesh(G.box(0.27, 0.008, 0.2), mat(0x8a4a3a, { roughness: 0.8 }), { y: -0.012, parent: book });
    const flap = group(0.13, 0.011, 0, book); mesh(G.box(0.13, 0.006, 0.19), mat(0xf2ead6, { roughness: 1 }), { x: 0.065, parent: flap });
    let pageT = r() * 6.5; U.push((dt) => { pageT += dt; const ft = pageT % 6.5, a = ft < 0.5 ? smoothstep(0, 0.5, ft) : ft < 1.0 ? 1 - smoothstep(0.5, 1.0, ft) : 0; flap.rotation.y = -a * 2.6; });
    game.npcs.push(new Sitter(game, reader, { x: 14, z: -32, ry: atan2(8 - 14, -6 - (-32)), seat: 0.1,
      cries: ['Just one more chapter.', 'Mind your paws — that page is thin.', "I've lost my place again."] })); }

  // an attendant waits at the foot of the zipline's start tower, checking the cable before sending the next rider off — though the only rider today is the squirrel
  { const attendant = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }), shirt: 0x3a5a6a, pants: 0x3a3a3a, shoes: 0x2a2018, backpack: 0x8a5a2a, hat: 'cap', hatColor: 0x2a3a4a, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(attendant.group);
    game.npcs.push(new Charger(game, attendant, { x: -33, z: 28, ry: atan2(-30 - (-33), 30 - 28), cryIcon: '🪢',
      cries: ["Cable's tight, harness checked - all set.", 'Only ever the squirrel gets a turn, mind.', "Mind the posts, puss - they don't budge."] })); }

  // Whisper Woods had never had a vendor of its own; a berry seller sets up between the big trees east of the glade, basket held up
  { const cx = 34, cz = 8; game.zones.addCircle(cx, cz, 1.2);
    const berryWard = makeWardrobe(r, { shirts: [0x6b4f8a, 0x5a7a4a, 0x8a5a4a], pants: [0x3a3a3a, 0x4a4030], shoes: [0x2a2018, 0x1e2020] });
    const berrySeller = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.4), wardrobe: berryWard }),
      apron: 0xd9c9a8, hat: 'flatcap', hatColor: 0x4a4030, bag: null, jacket: null, scarf: null });
    W.add(berrySeller.group);
    const v = new Vendor(game, berrySeller, makeFruitBasket(), { x: cx, z: cz, ry: atan2(8 - cx, -6 - cz), cryIcon: '🍓',
      cries: ['Wild berries, picked this morning!', 'Careful, puss - these aren\'t for cats.', 'Sweetest ones grow where the moss is thickest.'] });
    game.npcs.push(v); greetable(game, v); }

  // a searcher sweeps a metal detector over the leaf litter just off the stepping stones, hunting a lost ring
  { const dx = -4, dz = 18;
    const searcher = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3) }), shirt: 0x4a6a5a, pants: 0x3a3a3a, shoes: 0x2a2018, bag: null, hat: 'cap', hatColor: 0x3a4a3a, scarf: null, jacket: null, backpack: null, glasses: false });
    W.add(searcher.group);
    game.npcs.push(new Detectorist(game, searcher, { x: dx, z: dz, ry: PI / 2,   // facing east, toward the stepping-stone path
      cries: ["Someone's ring is out here somewhere.", 'Careful, puss - mind the leaf litter, it\'s slippery.', "Every beep's a bottle cap so far."] })); }

  // Whisper Woods had never had a juggler, unlike every other world; one practices in a quiet clearing
  // east of the hollow-log cluster, three balls in the air, an audience of nobody but the butterflies —
  // a headless probe found (28, -8) clear: 5.6 m from the nearest neighbour (a passing butterfly), well
  // outside the pond's and the glade's keep-out circles and clear of every hand-placed tree, rock and stump
  { const jx = 28, jz = -8;
    const juggler = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }),
      shirt: 0x2e6b4a, stripes: 0xffd54a, pants: 0x3a2a1e, shoes: 0x3a2a1e, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(juggler.group);
    game.npcs.push(new Juggler(game, juggler, [0xa8ff9a, 0xffd1ff, 0x9fe8ff], { x: jx, z: jz, ry: atan2(8 - jx, -6 - jz),
      cries: ["Fairies keep stealing my rhythm, I swear.", 'Careful, puss — mind the balls!', "Three's easy. It's the owls that put me off."] })); }

  // two kids chase each other on the clear ground north-west of the treehouse — every other world's children
  // already had a game of tag going (the park, the dunes); Whisper Woods never got round to it. Found with a
  // headless probe that built the world and swept a 4.2 m disk against every physics box and zone: (-18, 32) is
  // clear, with the attendant by the zipline the nearest other soul at 15.5 m
  { const tagWard = makeWardrobe(r, { shirts: [0xd9a23a, 0x4a7a5a], pants: [0x2e4a3a, 0x3a3a3a], shoes: [0x3a2a1e, 0x2a2018] });
    const tagA = makeHuman({ ...randomPerson(r, { female: false, child: true, wardrobe: tagWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    const tagB = makeHuman({ ...randomPerson(r, { female: true, child: true, wardrobe: tagWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(tagA.group); W.add(tagB.group);
    game.npcs.push(new Playmates(game, tagA, tagB, { cx: -18, cz: 32, leash: 4 }));
    greetable(game, { rig: tagA }); greetable(game, { rig: tagB }); }

  // two more kids play catch in a quiet clearing west of the glade — every other world with a `BallGame`
  // was the street or the beach, and Whisper Woods never got one despite already having the tag pair above.
  // A headless probe swept the built world's physics boxes and zones against a grid of candidate centres
  // (accounting for the game's 5.5 m throw gap and 1.2 m side-to-side sway either side) and settled on
  // (-43, -3): clear ground past the western tree ring, 20 m from the nearest other soul (the western deer)
  { const cx = -43, cz = -3;
    const catchBall = mesh(G.sphere(0.18, 12, 8), mat(0xfff5e6, { roughness: 0.5 }), { parent: W });
    mesh(G.sphere(0.181, 12, 8), mat(0xef7d2f, { roughness: 0.5 }), { sx: 0.5, parent: catchBall });
    mesh(G.sphere(0.181, 12, 8), mat(0x2e9e6e, { roughness: 0.5 }), { sz: 0.5, parent: catchBall });
    catchBall.position.set(cx, P.ground0(cx, cz) + 0.18, cz);
    const catchA = makeHuman({ ...randomPerson(r, { child: true, female: true }), shirt: 0x9a6fd4, backpack: null });
    const catchB = makeHuman({ ...randomPerson(r, { child: true, female: false }), shirt: 0x5ac8e0, backpack: null });
    W.add(catchA.group); W.add(catchB.group);
    game.npcs.push(new BallGame(game, catchA, catchB, catchBall, { cx, cz, gap: 5.5 }));
    greetable(game, { rig: catchA }); greetable(game, { rig: catchB }); }

  // one of the treehouse gang has rigged a rope swing in the clearing just west of it, while the two
  // campers below keep arguing about who actually lives up there; every other world with children already
  // had a swing (the Neighborhood's park) or an equivalent perch, and the treehouse itself had no reason
  // for anyone to linger nearby once the campers' own two lines ran out. A headless probe swept a grid
  // against game.physics.blocked and game.zones.blocked and found (-23.5, 14) clear out to 3.5 m in every
  // direction — the nearest obstacle otherwise is the treehouse's own trunk, 1.9 m from the frame at the
  // next spot in (-21.5, 14) — 5.5 m from the treehouse and 6.7 m from the campers, the nearest other soul
  { const cx = -23.5, cz = 14; game.zones.addCircle(cx, cz, 2.4);
    const swingSet = makeSwingSet({ color: 0x7a5a3a });
    placeT(game, U, swingSet, cx, cz, 0.4);
    const swingKid = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    const sw = new Swinger(game, swingKid, swingSet, { x: cx, z: cz });
    game.npcs.push(sw); greetable(game, sw);
    game.addInteractable({ obj: swingSet, radius: 2.8, label: () => 'Push the swing', onUse: () => { sw.boost = 1; SFX.talk(); game.toast('🎠 "Higher! Higher!"', 1800); } }); }

  // every other world had already paired its swing set with a seesaw; Whisper Woods was the last one
  // left with a swing and no seesaw. A headless probe built the real world, swept a grid of candidates
  // against every physics box (the trees, the treehouse, the campers' gear), then re-checked the best
  // ones against every NPC rig's own position — including the wandering deer and the tag/catch pairs —
  // continuously over 20 simulated seconds so nothing mid-leash could slip past unnoticed: (-31.5, 20)
  // came back clear by 6.85 m throughout, north-west of the swing set and the treehouse clearing, with
  // the pettable squirrel at (-14, 20) the nearest other soul at 17.5 m. The ground here isn't flat, so
  // like Sunny Shore's and Frosty Peak's this one is ground-following with `placeT`.
  { const sx = -31.5, sz = 20;
    const seesaw = makeSeesaw({ color: 0x5a8a3a }); placeT(game, U, seesaw, sx, sz, 0);
    game.zones.add(sx, sz, 2.4, 1.2);
    P.addBox(sx, game.physics.ground0(sx, sz) + 0.35, sz, 2.9, 0.7, 0.6, { cam: false });
    const seeWard = makeWardrobe(r, { shirts: [0xd9a23a, 0x5ac8e0], pants: [0x2e4a3a, 0x3a3a3a], shoes: [0x3a2a1e, 0x2a2018] });
    const seeA = makeHuman({ ...randomPerson(r, { female: false, child: true, wardrobe: seeWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    const seeB = makeHuman({ ...randomPerson(r, { female: true, child: true, wardrobe: seeWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    game.npcs.push(new Seesaw(game, seeA, seeB, seesaw, { x: sx, z: sz })); }

  // every other soul in these woods clusters near the glade, the treehouse or the stumps — the deep
  // forest west of the fox's den had nobody in it at all. A hiker sits cross-legged on the forest
  // floor, eyes closed, meditating in the quiet. A headless probe built the real game, travelled to
  // Whisper Woods, and swept a grid against every physics box plus every NPC's own position sampled
  // continuously over 40 simulated seconds (so neither the fox nor the deer, mid-leash, could slip
  // past unnoticed): (-34, 1) came back clear by 9.4 m in every direction, well short of the tree
  // ring that only starts at radius 40.
  { const hx = -34, hz = 1, ry = atan2(8 - hx, -6 - hz);
    const meditator = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3) }),
      shirt: 0x6a7a8a, pants: 0x3a3a4a, shoes: 0x3a2a1e, hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(meditator.group);
    game.npcs.push(new Sitter(game, meditator, { x: hx, z: hz, ry, seat: 0.1,
      cries: ["Didn't hear you coming. Good sign, apparently.", 'Shh — not done finding my centre yet.', 'The woods do half the work, honestly.'] })); }

  // the deep south of the wood, past the forager's own patch, had nobody in it either. An old
  // storyteller sits straight on the ground there, retelling the fairy ring's own legend to no one in
  // particular. A headless probe built the real game, travelled to Whisper Woods, and swept every point
  // of a 1 m grid inside the tree ring (radius <= 38) against every physics box plus every NPC's own
  // position, sampled continuously over several hundred simulated frames so nothing mid-leash (the
  // western deer, the eastern fox) could slip past unnoticed: (-8, -37) came back clear by 12.5 m from
  // the nearest box and 25.9 m from the nearest other soul (the forager, next closest after that).
  { const sx = -8, sz = -37, ry = atan2(8 - sx, -6 - sz);
    const storyteller = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: true, hairStyle: r.chance(0.5) ? 'bun' : null }),
      shirt: 0x6b4f3a, pants: 0x4a3a5a, shoes: 0x3a2a1e, hat: 'flatcap', hatColor: 0x4a3a2a, scarf: null, jacket: null, bag: null, backpack: null, glasses: false, beard: r.chance(0.3) });
    W.add(storyteller.group);
    game.npcs.push(new Sitter(game, storyteller, { x: sx, z: sz, ry, seat: 0.1,
      cries: ['Three turns of the fairy ring, mind, not four.', 'Shh — the owls are listening too, this time of night.', "Every story in these woods is true. Ask the fairies, if you doubt it."] })); }

  // the quiet stretch of forest east of the naturalist's log, between the inner tree ring and the stump
  // cluster, had nobody in it either. A jogger pauses there, hands on hips, getting their breath back.
  // A headless probe built the real game, travelled to Whisper Woods, and sampled every NPC's and the
  // squirrel's own position over 12 real seconds of simulated movement (so no wandering deer, fox or
  // flying fairy mid-leash could slip past unnoticed), then swept a grid of candidates against both the
  // samples and every physics box: (26, 14) came back clear, 8.06 m from the nearest box and 8.49 m from
  // the nearest other soul.
  { const jx = 26, jz = 14, ry = atan2(8 - jx, -6 - jz);
    const runner = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }), shirt: 0x3a6a8a, stripes: 0xffffff, pants: 0x2a2a2a, shoes: 0xf5f2ea, hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(runner.group);
    game.npcs.push(new Charger(game, runner, { x: jx, z: jz, ry, cryIcon: '🏃',
      cries: ["Just... one... more... lap.", "Didn't expect company, out here.", "The hills are the hard part, not the distance."] })); }

  // the Neighborhood, Sunny Shore and Candy Land all have a ukulele player and Victorian its fiddler at
  // the clock tower, but Whisper Woods — for all its owls, fairies and a whole glade of mushrooms — never
  // had anyone actually making music. A woman sits cross-legged on the forest floor south of the glade,
  // not far from the reader, strumming a moss-green ukulele toward nobody in particular. A headless probe
  // built the real Whisper Woods, sampled every NPC's own rig position (and the squirrel's) every quarter
  // second over 20 simulated seconds — so no wandering deer, fox or mid-leash wanderer could slip past
  // unnoticed — and swept a grid of the glade's own clearing (radius <= 36, short of the tree ring that
  // starts at 40) against both those samples and every physics box: (5.5, -32) came back clear by 7.76 m
  // in every direction, the reader eight and a half metres off being the nearest other soul.
  { const mx = 5.5, mz = -32, mry = atan2(8 - mx, -6 - mz);
    const museWard = makeWardrobe(r, { shirts: [0x5a7a4a, 0x6b4f8a, 0x8a6a4a], pants: [0x3a4a2e, 0x2a2a2a], shoes: [0x3a2a1e, 0x1e2020] });
    const musician = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: r.chance(0.3), wardrobe: museWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.25) });
    W.add(musician.group);
    const uke = makeUkulele(0x5a7a3a);
    uke.position.set(0.03, -0.02, 0.14); uke.rotation.set(-0.25, 0.1, 0.2);
    musician.hands[1].add(uke);
    game.npcs.push(new Sitter(game, musician, { x: mx, z: mz, ry: mry, seat: 0.1,
      cries: ["The fairies hum along, if you listen close.", "Careful, puss — that's out of tune, not broken.", "Even the owls go quiet for this one."] }));
    U.push((dt, t) => { const A = musician.arms[1]; A.el.rotation.x = -1.0 + sin(t * 5.4) * 0.22; A.sh.rotation.z = -0.15; }); }

  // the Neighborhood already has `DogWalker` pairing a person with a dog on a lead, but Whisper Woods —
  // for all its deer, foxes and a fairy ring — never had anyone out walking their own dog. A woman strolls
  // a quiet pocket of forest floor south-east of the glade with a scruffy dog on a lead, well clear of
  // both tree ring and stepping stones. A headless probe built the real Whisper Woods, swept a 1.6 m disk
  // through 20 simulated seconds of every NPC's own movement (so no wandering deer or fox mid-leash could
  // slip past unnoticed), then re-checked the survivors' static clearance: (24, -22) came back clear by
  // 7.3 m in every direction — comfortably past the leash given here plus the dog's own trailing distance.
  { const dwx = 24, dwz = -22, dwry = atan2(8 - dwx, -6 - dwz);
    const dwWard = makeWardrobe(r, { shirts: [0x8a6a4a, 0x4a6a5a, 0x6b5a7a], pants: [0x3a3a3a, 0x2a2a2a], shoes: [0x3a2a1e, 0x2a2018] });
    const walker = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: dwWard }),
      hat: r.chance(0.4) ? 'cap' : null, hatColor: 0x3a4a3a, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(walker.group);
    const dog = makeDog(0x6b5a46);
    game.npcs.push(new DogWalker(game, walker, dog, { x: dwx, z: dwz, angle: dwry, speed: 0.9, leash: 4,
      cries: ["He loves a good sniff round these parts.", 'Careful, puss - he only looks fierce.', "Best walk of the day, this one."] })); }

  // the Neighborhood, Candy Land, Victorian, Sunny Shore and Frosty Peak all have a kid flying a kite
  // overhead by now, and Robot City closed the gap two rounds back — Whisper Woods was the one world
  // left without, its own canopy being the obvious reason nobody had tried. KiteFlyer swoops its kite
  // 4.8-9.2 m up in a lazy loop roughly 9 m across, which is exactly the height a big tree's own canopy
  // sits at (makeBigTree's leaf spheres start around h-0.3, h = 7-10 m), so clearance here means headroom,
  // not just floor space. A headless probe built the real Whisper Woods, ran the candidate flight path
  // itself (200 samples over a simulated 20 s loop) against every physics box taller than 5 m — a
  // stand-in for canopy height, since no tree's trunk box is shorter than that — and only afterwards
  // checked the kid's own standing point against everything else: (7, -24) came back clear by 14.8 m of
  // the nearest tree anywhere along the loop, south of the glade between the weaver's stump and the
  // musician's own patch of grass. The wind blows north, carrying the kite out over the fern litter
  // rather than back toward either of them.
  { const kiteWard = makeWardrobe(r, { shirts: [0x6b8a5a, 0xd9a23a, 0x5ac8e0], pants: [0x3a4a2e, 0x2a2a2a] });
    const kiteKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: kiteWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(kiteKid.group);
    game.npcs.push(new KiteFlyer(game, kiteKid, makeKite(0x6b8a5a, 0xffd54a), { x: 7, z: -24, wind: [0.18, 0.98],
      cries: ['Caught a gap in the branches, finally!', 'Mind the string, puss.', "The trees eat more kites than the fairies ever will."] })); }

  // the Neighborhood, Candy Land, Robot City and Victorian all have a kid working a yo-yo by now — the
  // one trick every other world's children picked up, and Whisper Woods, for all its tag, catch, swing
  // and seesaw, never got round to it either. A child works one on the open ground east of the glade,
  // well clear of the tree ring. `YoYoer` needs no held prop beyond what it builds itself (the disc and
  // string hang straight off `rig.hands[1]`), so this was placement, not construction. A headless probe
  // built the real Whisper Woods (`game.travel(6, 'from-hub')`), sampled every NPC's and the squirrel's
  // own position every quarter second over 25 simulated seconds (so no wandering deer, fox or flying
  // fairy mid-leash could slip past unnoticed), then swept a grid of the glade's own clearing (radius
  // <= 36, short of the tree ring that starts at 40) against both those samples and every physics box:
  // (34, 0) came back clear by 8.0 m of the nearest other soul and 8.1 m of the nearest box.
  { const yx = 34, yz = 0, yry = atan2(8 - yx, -6 - yz);
    const yoyoKid = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(yoyoKid.group);
    game.npcs.push(new YoYoer(game, yoyoKid, 0x5ac8e0, { x: yx, z: yz, ry: yry, cryIcon: '🪀',
      cries: ["Forty drops, and the owls still haven't blinked.", 'Careful, puss — it swings wider than it looks.', 'The fairies keep trying to grab it mid-drop.'] })); }

  // no world yet had a hula hoop (every other new trick — yo-yos, kites, ball games — had already done
  // the rounds). A child works one on open ground south of the glade, well clear of the tree ring and
  // the snail's own fern patch. `HulaHooper` needs no held prop, just a ring parented to the body at
  // waist height, so this was placement, same as the yo-yo kid above. A headless probe built the real
  // Whisper Woods (`game.travel(6, 'from-hub')`), sampled every NPC's and the squirrel's own position
  // every quarter second over 30 simulated seconds (so no wandering deer, fox or flying fairy mid-leash
  // could slip past unnoticed), then swept a 1 m grid of the glade's own clearing (radius <= 52, short
  // of `forestRegion`'s own fill at 58) against both those samples and every physics box: (-8, -41) came
  // back clear by 15.5 m of the nearest other soul and 15.8 m of the nearest box.
  { const hx = -8, hz = -41, hry = atan2(0 - hx, 0 - hz);
    const hoopKid = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(hoopKid.group);
    game.npcs.push(new HulaHooper(game, hoopKid, r.pick([0xff6fb5, 0xffd54a, 0x8a5cf6]), { x: hx, z: hz, ry: hry,
      cries: ["Don't tell the fairies — they'd want a turn.", "Fifty spins, and the squirrels still won't join in.", 'Keeps me warmer than standing still, anyway.'] })); }

  // every other creature in these woods moves at a clip — even the frogs hop — and nothing here had ever
  // just crept along. A snail now glides, almost too slowly to notice, through the fern litter at the
  // heart of the glade. A headless probe built the real Whisper Woods, sampled every NPC's and the
  // squirrel's own position every quarter second over 300 simulated frames (so nothing wandering, hopping
  // or flying mid-leash could slip past unnoticed), then swept a grid against both those samples and every
  // physics box: (0, -18) came back clear by 11.97 m in every direction — inside the fern patch, but well
  // past the glowing pond's own 7 m keep-out circle. Placed last, after every other draw this build makes
  // from its own local `r`, so this one extra colour pick disturbs nothing earlier in the wood.
  { const rig = makeSnail(r.pick([0xc9a24a, 0xb08a52, 0x8a9a6a])); W.add(rig.group);
    game.npcs.push(new Wanderer(game, rig, { x: 0, z: -18, speed: 0.05, leash: 1.0, r: 0.08, height: 0.14, step: 0.08, idle: [2, 5], walk: [6, 14] })); }

  // yo-yos and a hula hoop have both done the rounds here, but no world yet had a jump rope. A child
  // works one on open ground deep in the south of these woods: the rope is a single thin rod pivoting
  // through the hips like a propeller blade rather than a literal loop (a loop is radially symmetric
  // about its own spin axis and would show no visible motion at all), so the sweep reads clearly from
  // any camera angle, and the whole body hops clear right as the rod passes underfoot. `JumpRoper`
  // needs no held prop beyond what it builds itself, so this is placement, same as the yo-yo and hula
  // hoop kids above. A headless probe built the real Whisper Woods (`game.travel(6, 'from-hub')`),
  // sampled every NPC's and the squirrel's own position every quarter second over 30 simulated seconds
  // (so no wandering deer, fox or flying fairy mid-leash could slip past unnoticed), then swept a 2 m
  // grid of the wood's own floor (radius <= 50, short of `forestRegion`'s own fill at 58) against both
  // those samples and every physics box: (8, -48) came back clear by 7.1 m of the nearest box and
  // 16.2 m of the nearest other soul. Placed last, after the snail's own colour draw, so this one more
  // pick off the local `r` disturbs nothing built earlier in the wood.
  { const jx = 8, jz = -48, jry = atan2(0 - jx, 0 - jz);
    const roper = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(roper.group);
    game.npcs.push(new JumpRoper(game, roper, r.pick([0xffd54a, 0x5ac8e0, 0xa8ff9a]), { x: jx, z: jz, ry: jry,
      cries: ["Two hundred, and I haven't tripped once.", "The rabbits won't try it — too many ears in the way.", "Mind the vines — I nearly caught one last week."] })); }

  // the Neighborhood, Candy Land, Robot City, Victorian, Sunny Shore and Frosty Peak all have a kid
  // kneeling by a wobbly scooter (`makeScooter()` + `Kneeler`) by now — Whisper Woods was the last of
  // the seven still without one. A girl now kneels on the forest floor west of the swing and seesaw
  // clearing, tightening her scooter's back wheel before trying it again on the packed earth. Same
  // `makeScooter()` + `Kneeler` pairing every other world's scooter kid already uses, built with the
  // terrain-aware `placeT`/`boxT` helpers (like Sunny Shore's and Frosty Peak's) rather than the other
  // four worlds' flat-floor `place()` + `P.addBox()`, since the forest floor rolls gently underfoot
  // here too. A headless probe (written against the same stub-three test harness `test/run.mjs` uses,
  // since this sandbox has no browser) built the real Whisper Woods (`game.travel(6, 'from-hub')`),
  // sampled every NPC's and the squirrel's own position every quarter second over 30 simulated seconds
  // (so no wandering deer, fox or flying fairy mid-leash could slip past unnoticed), then swept a 1 m
  // grid of the forest floor (radius 2-50, short of the tree ring that starts at 40 and clear of every
  // zone circle) against both those samples and every physics box: (-38, 10) came back clear by 9.5 m
  // of the nearest box and 9.85 m of the nearest other soul, with ground height varying only 0.13 m
  // within a metre of it. Placed last, after every other draw this build makes from its own local `r`,
  // so this one extra gender pick disturbs nothing earlier in the wood.
  { const sx = -38, sz = 10, kx = sx + 0.9, kz = sz, ry = atan2(sx - kx, sz - kz);
    const scooter = makeScooter(0x5ac8e0); placeT(game, U, scooter, sx, sz, 0.4);
    boxT(game, sx, sz, 0.3, 0.8, 0.6, { cam: false });
    const scooterKid = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(scooterKid.group);
    game.npcs.push(new Kneeler(game, scooterKid, { x: kx, z: kz, ry,
      cries: ['Wobbly bolt again - nearly got it.', "Careful, puss — mind your tail, this spins.", "Good as new. Straight down the path, no hands."] })); }

  // the Neighborhood, Robot City, Victorian, Candy Land, Sunny Shore and Frosty Peak all have a kid
  // chalking a row of hopscotch squares by now (`Kneeler` + six colour-coded `G.plane` decals) —
  // Whisper Woods was the last of the seven without one. A girl now kneels on the forest floor deep in
  // the south of these woods, chalking six squares straight onto the packed earth, not far from the
  // jump rope kid's own clearing. Built with plain `makeHuman` rather than a local `kid()` wardrobe
  // helper (unlike Frosty Peak's own version), since nothing else in these woods dresses its children
  // against the cold. Like Sunny Shore's and Frosty Peak's own versions, each decal square asks
  // `P.ground0()` for its own height instead of sharing one flat `y`, since the forest floor rolls
  // gently underfoot here too — `Kneeler` already asks `ground0()` for its own rig regardless of
  // world, so that part needed no change. A headless probe (the same stub-three harness `test/run.mjs`
  // uses) built the real Whisper Woods (`game.travel(6, 'from-hub')`), sampled every NPC's and the
  // squirrel's own position every quarter second over 30 simulated seconds (so no wandering deer, fox
  // or flying fairy mid-leash could slip past unnoticed), then swept a 2 m grid of the open floor
  // (radius <= 50, short of the radius (58) where forestRegion's own fill takes over) against both
  // those samples and every physics box: the six-square run from (26, -42) to (28.9, -42) came back
  // clear by 4.17-7.09 m of the nearest box and 14.94-17.94 m of the nearest other soul, with ground
  // height varying only 0.06 m across the whole footprint. Placed last, after every other draw this
  // build makes from its own local `r`, so this one extra gender pick disturbs nothing built earlier.
  { const gz = -42, kx = 25.1, kz = -42, squares = [];
    const squareColors = [0xffb3c6, 0xbde0fe, 0xfff3b0, 0xb9fbc0, 0xcdb4db, 0xffc8dd];
    for (let i = 0; i < 6; i++) { const gx = 26 + i * 0.58; squares.push([gx, gz]);
      mesh(G.plane(0.48, 0.48), mat(squareColors[i], { roughness: 0.95, transparent: true, opacity: 0.85 }), { x: gx, y: P.ground0(gx, gz) + 0.018, z: gz, rx: -PI / 2, shadow: 'none', parent: W }); }
    const chalker = makeHuman({ ...randomPerson(r, { female: true, child: true }), hairStyle: 'braids', hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(chalker.group);
    const chalk = group(0, 0.02, 0.09, chalker.hands[0]); chalk.rotation.x = -0.5;
    mesh(G.cyl(0.014, 0.014, 0.09, 6), mat(0xf7f3ec, { roughness: 0.9 }), { y: 0.045, parent: chalk });
    game.npcs.push(new Kneeler(game, chalker, { x: kx, z: kz, ry: atan2(squares[0][0] - kx, squares[0][1] - kz),
      cries: ['Six squares, dry before the dew comes back.', 'Careful, puss — mind the chalk lines!', "Quietest spot in the whole wood for it."] })); }

  // Robot City, the Neighborhood, Victorian, Candy Land, Sunny Shore and Frosty Peak all have a marbles
  // ring by now — the oldest pavement game of all — and Whisper Woods was the last of the seven left
  // without one. A child now kneels on the forest floor east of the stepping-stone path, flicking
  // marbles at a ring chalked straight onto the packed earth. Same `Kneeler` pairing every other
  // world's version already uses, no new controller, and the terrain-aware `P.ground0()` lookup (like
  // Sunny Shore's and Frosty Peak's own versions) for every mesh here, since the forest floor rolls
  // gently underfoot too. A headless probe (the same stub-three harness `test/run.mjs` uses) built the
  // real Whisper Woods (`game.travel(6, 'from-hub')`), sampled every NPC's and the squirrel's own
  // position every tenth of a second over 30 simulated seconds (so no wandering deer, fox or flying
  // fairy mid-leash could slip past unnoticed), then swept a 1 m grid of the open floor (radius <= 55,
  // short of the radius (58) where forestRegion's own fill takes over) against both those samples and
  // every physics box: (-8, 39) came back clear by 8.53 m of the nearest box and 9.60 m of the nearest
  // other soul, at radius 39.8 from the origin — well off to the side of the stepping-stone path and
  // short of the tree ring that starts at 40 — with ground height varying only 0.06 m across the whole
  // footprint. Placed last, after every other draw this build makes from its own local `r`, so this
  // one extra gender pick disturbs nothing built earlier in the wood.
  { const mcx = -8, mcz = 39, mkx = mcx - 0.9, mkz = mcz, mry = atan2(mcx - mkx, mcz - mkz);
    mesh(G.torus(0.5, 0.025, 6, 24), mat(0xf7f3ec, { roughness: 0.95, transparent: true, opacity: 0.85 }), { x: mcx, y: P.ground0(mcx, mcz) + 0.02, z: mcz, rx: -PI / 2, shadow: 'none', parent: W });
    const marbleColors = [0xff6fb5, 0x7fe0ff, 0xffd54a, 0xb9fbc0, 0x8a5acf];
    const marblePos = [[-0.22, 0.12], [0.18, -0.16], [0.02, 0.26], [-0.3, -0.1], [0.3, 0.05]];
    for (let i = 0; i < marblePos.length; i++) { const px = mcx + marblePos[i][0], pz = mcz + marblePos[i][1]; mesh(G.sphere(0.035, 8, 6), mat(marbleColors[i], { roughness: 0.2 }), { x: px, y: P.ground0(px, pz) + 0.035, z: pz, shadow: 'none', parent: W }); }
    mesh(G.sphere(0.035, 8, 6), mat(0xffd54a, { roughness: 0.2 }), { x: mkx + 0.35, y: P.ground0(mkx + 0.35, mkz) + 0.035, z: mkz, shadow: 'none', parent: W });   // the shooter, paused mid-flick just outside the ring
    const marbleKid = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(marbleKid.group);
    game.npcs.push(new Kneeler(game, marbleKid, { x: mkx, z: mkz, ry: mry,
      cries: ["Watch close — I never miss.", "Careful, puss — don't swallow one of these.", "Won every single one, fair and square."] })); }

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
