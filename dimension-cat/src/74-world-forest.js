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
  // the pond had ducks paddling on it, frogs hopping its rim and an angler working its edge, but nothing
  // ever skimmed low over the water itself. Three dragonflies now dart over the glowing pond, each its
  // own radius between the duck ring (2.3 m) and the reeds that only start past 5.0 m out, its own height,
  // speed and phase — same `Flyer` controller every other flyer in this glade already loops with, so this
  // adds no new orbit or bob logic, just a new rig for it to carry.
  for (let i = 0; i < 3; i++) { const rig = makeDragonfly(r.pick([0x2f6a5a, 0x3a5a8a, 0x5a3a6a])); game.npcs.push(new Flyer(game, rig, { cx: 8, cz: -6, r: r.range(2.6, 4.0), h: r.range(0.3, 0.55), speed: r.range(1.6, 2.4), bob: 0.08, wobble: 0.4, cw: i % 2 === 0, phase: i * 2.4 })); }
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
  let bigMushroom = null, farMushroom = null, violetMushroom = null, southMushroom = null, northMushroom = null, denMushroom = null, blueMushroom = null, pinkMushroom = null;
  for (const [x, z, s, hue] of [[-14, -14, 2.6, 0], [16, 12, 3.2, 200], [-20, 0, 2.2, 300], [14, -20, 2.4, 40], [-2, -22, 2.9, 0], [24, -4, 2.0, 280], [-24, 20, 2.6, 200], [4, 24, 2.3, 0]]) { const m = makeMushroom(s, hue, r, true); placeT(game, U, m, x, z, 0); boxT(game, x, z, 0.5 * s, 1.3 * s, 0.5 * s, { cam: false }); U.push(m.userData.update); if (x === 14 && z === -20) bigMushroom = m; if (x === -24 && z === 20) farMushroom = m; if (x === 24 && z === -4) violetMushroom = m; if (x === -2 && z === -22) southMushroom = m; if (x === 4 && z === 24) northMushroom = m; if (x === -14 && z === -14) denMushroom = m; if (x === 16 && z === 12) blueMushroom = m; if (x === -20 && z === 0) pinkMushroom = m; }
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
  // the mushroom at (14, -20) got its own toast two rounds back, but it was never the only one worth a
  // look — seven more of the glade's eight giant mushrooms still stood mute, and the one furthest out,
  // at (-24, 20) past the deer path, is the loneliest of the lot. Same trick again: `farMushroom`,
  // captured from the very same build loop above, goes straight into `addInteractable` as `obj` — no new
  // mesh, no new physics box, no fresh baking exemption needed (this whole set already carries `glow: true`
  // and its own `userData.update`). A headless probe (`game.load(6, 'from-hub')`, 3000 simulated frames,
  // every NPC's own position sampled every frame) swept this point against every physics box and every
  // sample: the nearest other box stayed 6.0 m clear and the nearest grounded wanderer (a deer on its own
  // leash near the treehouse) never closer than 11.1 m — only a passing fairy or butterfly, flying well
  // overhead, ever came nearer, same as the first mushroom's own case.
  game.addInteractable({ obj: farMushroom, radius: 3.9, label: () => 'Look up at the mushroom', onUse: () => { SFX.click(); game.toast(rnd.pick(['🍄 "Furthest one from the ring. Still glows just as bright out here alone."', '🍄 "The deer give this one a wide berth. Nobody\'s sure why."', '🍄 "Grows a little lopsided, out here with no others to lean on."']), 3000); } });
  // (14, -20) and (-24, 20) got their own toast; six of the glade's eight giant mushrooms still stand
  // mute. The one at (24, -4) is the only one in the set painted hue 280 (violet, against everyone
  // else's reds, pinks and golds) and sits furthest east of the ring, past the fox den. Same trick a
  // third time: `violetMushroom`, captured from the same build loop, goes straight into
  // `addInteractable` — no new mesh, no new physics box. A headless probe (`game.load(6, 'from-hub')`,
  // 3000 simulated frames, every NPC's own position sampled every frame) swept this point against every
  // physics box and every sample: the nearest other box stayed 7.5 m clear and nothing — grounded or
  // flying — ever came nearer than 3.6 m, so the 3.0 m radius (the same 1.5×-scale ratio the first two
  // mushrooms used, off this one's own 2.0 scale) stays clear on every side.
  game.addInteractable({ obj: violetMushroom, radius: 3.0, label: () => 'Look up at the mushroom', onUse: () => { SFX.click(); game.toast(rnd.pick(['🍄 "Only purple one in the whole glade. Wonder why it came out different."', '🍄 "Out here past the fox den, this one never sees the fairy ring at all."', '🍄 "Cap\'s gone a deep violet — not a shade any of its neighbours share."']), 3000); } });
  // three of the eight now answer; five still stand mute. The one at (-2, -22) is the loneliest of the
  // remaining five — well south of the glade, past the hare clearing, with no other mushroom anywhere
  // near it. Same trick again: `southMushroom`, captured from the same build loop, straight into
  // `addInteractable` as `obj` — no new mesh, no new physics box, no fresh baking exemption (this whole
  // set already carries `glow: true` and its own `userData.update`). A headless probe (`game.load(6,
  // 'from-hub')`, 3000 simulated frames, every NPC's own position sampled every frame) swept this point
  // against every physics box and every sample: the nearest other box (a rock at x -8.7..-7.3, z
  // -18.7..-17.3) stayed 6.2 m clear and the nearest grounded soul, a deer wandering off its leash from
  // (-10, -30), never closer than 4.5 m — both well past the 2.9 m radius chosen (the same ratio the
  // others used, off this one's own 2.9 scale) — only a passing butterfly or fairy, flying well
  // overhead, ever came nearer (3.5 m, no obstruction at all).
  game.addInteractable({ obj: southMushroom, radius: 2.9, label: () => 'Look up at the mushroom', onUse: () => { SFX.click(); game.toast(rnd.pick(['🍄 "Furthest south of the whole glade. Nobody comes down this way much."', '🍄 "Grew up alone - no ring, no neighbours, just the hares for company."', '🍄 "Still glows the same, even out here where nobody\'s looking."']), 3000); } });
  // four of the eight now answer; four still stand mute. The one at (4, 24) is the furthest north of
  // the whole set, well past the ring, just shy of the third owl's tree at (12, 32). Same trick a
  // fifth time: `northMushroom`, captured from the same build loop, straight into `addInteractable` as
  // `obj` — no new mesh, no new physics box, no fresh baking exemption (this whole set already carries
  // `glow: true` and its own `userData.update`). A headless probe (`game.load(6, 'from-hub')`, 3000
  // simulated frames, every NPC's own position sampled every frame) swept this point against every
  // physics box and every sample: the nearest other box (a stray scatter-mushroom at x 4.8..5.5, z
  // 19.4..19.9) stayed 4.2 m clear and the nearest soul (the painter at their easel, stationary) never
  // closer than 4.5 m — both well past the 3.45 m radius chosen (the same 1.5×-scale ratio the first
  // three used, off this one's own 2.3 scale).
  game.addInteractable({ obj: northMushroom, radius: 3.45, label: () => 'Look up at the mushroom', onUse: () => { SFX.click(); game.toast(rnd.pick(['🍄 "Furthest north of the ring. Even the owl up the tree keeps half an eye on it."', '🍄 "Stands alone up here - no fairy ring, no company, just the lanterns off in the distance."', '🍄 "Still glowing, same as the others, just with a longer walk to see it."']), 3000); } });
  // five of the eight now answer; three still stand mute. The one at (-14, -14) is the closest of the
  // whole set to the fox's own den at (-26, -14) — 12 m off, just past its wander leash. Same trick a
  // sixth time: `denMushroom`, captured from the same build loop, straight into `addInteractable` as
  // `obj` — no new mesh, no new physics box. A headless probe (`game.load(6, 'from-hub')`, 4000
  // simulated frames, every ground NPC's own position sampled every frame, flyers aside — butterflies
  // and fairies drift everywhere in this glade and are no obstruction) swept this point against every
  // physics box and every sample: the nearest other box stayed 6.2 m clear, the nearest other
  // interactable 7.2 m off, and the fox on its own wander never closer than 3.9 m — all past the 3.5 m
  // radius chosen (a touch tighter than this mushroom's own 1.5×-scale ratio, since the den sits
  // closer here than at any of the other five).
  game.addInteractable({ obj: denMushroom, radius: 3.5, label: () => 'Look up at the mushroom', onUse: () => { SFX.click(); game.toast(rnd.pick(['🍄 "Closest one to the fox\'s den. The fox never pays it any mind."', '🍄 "Grows right where the glade meets the den-side thicket."', '🍄 "No ring out here either, just this one cap glowing on its own."']), 3000); } });
  // seven of the eight now answer; one still stands mute, left for a future round since a headless
  // probe found it tighter than any of the others — a wandering flyer drifts within 2.6 m of it, but
  // that is no obstruction (butterflies and fairies cross everywhere in this glade). The one at (16,
  // 12) is the only teal-hued cap east of the ring, past the whittler's own bench. Same trick a
  // seventh time: `blueMushroom`, captured from the same build loop, straight into `addInteractable`
  // as `obj` — no new mesh, no new physics box. A headless probe (`game.load(6, 'from-hub')`, 4000
  // simulated frames, every NPC's own position sampled every frame) swept this point against every
  // physics box and every sample: the nearest other box stayed 3.5 m clear and the nearest other
  // interactable (a "Say hello" prompt) 4.5 m off — both past the 3.0 m radius chosen, a tighter
  // 0.94×-scale ratio than this set's usual 1.5× since the glade is more crowded out this way.
  game.addInteractable({ obj: blueMushroom, radius: 3.0, label: () => 'Look up at the mushroom', onUse: () => { SFX.click(); game.toast(rnd.pick(['🍄 "Only teal one out this way — the rest of its colour stayed back at the ring."', '🍄 "Grows closest to the whittler\'s bench. He\'s never once looked up at it."', '🍄 "No fairy ring out here either, just this one cap and the quiet."']), 3000); } });
  // the last of the eight, at (-20, 0), was left mute last round over its own tight neighbour — the
  // nearest other interactable, the acorn-feeder's own "Say hello" prompt (she kneels at (-21.8, 3)
  // scattering acorns for the western deer), sits just 3.5 m from this mushroom's own centre.
  // `game.nearest` always resolves to whichever centre is actually closest (`80-game.js`'s own prompt
  // loop checks every interactable's own radius, then picks the smallest distance among the ones that
  // match), so a smaller radius here is about staying tidy rather than avoiding any real conflict:
  // 2.6 m, under this mushroom's own 2.2 scale's usual 1.5x ratio (which would reach 3.3 m, past the
  // midpoint between the two), keeps the mushroom's whole circle on its own side of that midpoint.
  // Same trick an eighth time: `pinkMushroom`, captured from the same build loop above, goes straight
  // into `addInteractable` as `obj` — no new mesh, no new physics box (a headless probe confirmed the
  // nearest OTHER physics box stays 5.5 m clear, well past this radius). All eight of the glade's
  // giant mushrooms answer now.
  game.addInteractable({ obj: pinkMushroom, radius: 2.6, label: () => 'Look up at the mushroom', onUse: () => { SFX.click(); game.toast(rnd.pick(['🍄 "Last one left mute. Grows right by the acorn-feeder\'s own spot."', '🍄 "Pink as the fairy ring\'s own glow, just out here on its own."', '🍄 "Every cap in this glade answers now. Even this one, tucked up against the fringe."']), 3000); } });
  // Frosty Peak has had its aurora since round 283 and the Neighborhood its own telescope more recently,
  // but these woods — the one world actually built around fairies and wishes — never had a sky worth
  // looking up at. `makeRainbowArc()` (new, next to `makeAurora` in `62-props-nature.js`) is seven
  // concentric half-torus bands, the same "flat backdrop far beyond the walkable limit" trick the
  // aurora curtains already use: centred 9 m past `WOODS_LIMIT` (196) itself, so its span crosses no
  // keep-out zone and needs no physics box of its own, the same as the aurora. A small ring of mossy
  // stones, styled after Frosty Peak's own aurora cairn, now sits in a quiet clearing between the
  // treehouse and the hollow-log path, giving the cat somewhere to actually stop and look up. A headless
  // probe (`game.load(6, 'from-hub')`, then 3000 simulated frames sampling every NPC's own position every
  // frame) found (-10, 22) clear by 7.51 m of the nearest physics box and 7.21 m of the nearest soul (a
  // wandering detectorist) throughout — comfortably past this interactable's own 2.8 m radius and the
  // stone ring's own half-metre footprint. Fixed coordinates and colours throughout, no draw from this
  // world's own seeded `r`, so no later mushroom hue or butterfly colour pick anywhere else shifts.
  { const cx = -10, cz = 22, cy = P.ground0(cx, cz);
    const cairn = group(cx, cy, cz, W), stoneM = mat(0x7a8a74, { roughness: 0.95, flatShading: true });
    mesh(G.sphere(0.32, 7, 5), stoneM, { x: -0.3, y: 0.16, ry: 0.6, parent: cairn });
    mesh(G.sphere(0.26, 7, 5), stoneM, { x: 0.28, y: 0.14, ry: 2.1, parent: cairn });
    mesh(G.sphere(0.22, 6, 5), stoneM, { z: 0.3, y: 0.12, ry: 4.0, parent: cairn });
    P.addBox(cx, cy + 0.15, cz, 0.6, 0.35, 0.6, { cam: false });
    const rainbowLines = ['🌈 "Must have rained somewhere, sometime. These woods never quite dry out."',
      '🌈 "The fairies say there\'s a pot of something at the end of it. Nobody\'s ever found the end."',
      '🌈 "Seven bands, same as the fairy ring has mushrooms. Coincidence, probably."'];
    game.addInteractable({ obj: cairn, radius: 2.8, label: () => 'Look up at the rainbow', onUse: () => { SFX.click(); game.fx.emit(cx, cy + 1.4, cz, { count: 14, colors: [0xff6f6f, 0xffd54a, 0x6fdc6f, 0x6fa8ff], speed: 1.0, up: 1.6, life: 1.0, gravity: 1.5 }); game.toast(rnd.pick(rainbowLines), 3000); } }); }
  makeRainbowArc(W, { x: -10, y: 18, z: -205, r: 85 });
  for (let i = 0; i < 30; i++) { const x = r.range(-40, 40), z = r.range(-40, 40); if (dist2(x, z, 8, -6) < 36) continue; placeT(game, U, makeMushroom(r.range(0.25, 0.6), r.pick([0, 20, 200, 300, 40]), r, r.chance(0.4)), x, z, 0); }
  // trees: a ring at the edge and scattered giants
  for (let i = 0; i < 40; i++) { const a = i / 40 * TAU + r.range(-0.06, 0.06), d = r.range(40, 54); treeAt(cos(a) * d, sin(a) * d, { simple: true }); }
  const inner = [[-30, -10], [-28, 12], [-12, 30], [12, 32], [30, 22], [34, -12], [22, -30], [-6, -34], [-34, -30], [26, 4], [-16, -26], [0, 34]];
  let noticeTree = null;
  for (const [x, z] of inner) { const t = treeAt(x, z, { lanterns: r.chance(0.5) }); if (x === 26 && z === 4) noticeTree = t; }
  // the Neighborhood's park lamp (round 462), one of Robot City's towers (round 463) and a Victorian
  // lamp post (round 464) have all carried a stapled notice by now, but nobody had ever nailed anything
  // to one of these woods' own trees. The inner-ring tree at (26, 4) now carries one: a weathered
  // bark-plank backing in place of the frame, a carved pinecone standing in for the cat silhouette,
  // the robot head or the watch case, and four iron nail heads along the bottom instead of tear tabs,
  // hazard tape or a wax seal (`makeForestNotice()`, new, next to the other three in `60-props.js`).
  // Read it and the cat gets one of three lines, same "toast on interact" trick every notice before it
  // used. `noticeTree` is the exact group the `inner` loop above already builds and places, captured
  // without touching that loop's own `r.chance(0.5)` draw per tree, so no later wardrobe or colour pick
  // anywhere else in this world shifts. The notice is mounted dead-centre on the trunk, offset outward
  // along local +z by `treeW / 2.2` (the tree's own base radius `R`, recovered from `userData.col[0] =
  // R * 2.2`) plus 2 cm — since the trunk tapers from `R` at the base to `R * 0.55` at the crown, that
  // offset clears the actual (smaller) radius at the notice's own height everywhere up the taper, so
  // the sheet sits proud of the bark rather than buried inside it. It inherits the tree's own random
  // `r() * TAU` world rotation (set inside `makeBigTree` itself) along with everything else parented to
  // it, so it ends up facing whichever way that one tree happens to be turned — fine, since the physics
  // box `treeAt` already gave this tree (axis-aligned, half-extent `w * 0.7`) doesn't rotate with it,
  // and a flat sheet needs no new box of its own regardless of which face it ends up on. That box's own
  // half-extent (`w * 0.7`, 1.08-1.54 m for a tree this size) sets a 2.18 m worst-case corner diagonal;
  // `game.addInteractable`'s 3.4 m radius clears it by at least a metre on every side.
  { const treeW = noticeTree.userData.col[0], standoff = treeW / 2.2 + 0.02;
    const notice = makeForestNotice(); notice.position.set(0, 1.9, standoff); noticeTree.add(notice);
    const forestNoticeLines = ['🐿️ "LOST: one entire winter\'s stash of acorns. If found, please panic as much as I am. — A Squirrel." The cat reads it twice and still isn\'t sure which squirrel.',
      '🐿️ Scrawled underneath in smaller letters: "Reward: half the stash, once it turns up." The cat does not apply.',
      '🐿️ Someone has already chewed one corner of the notice clean off. The cat decides not to ask who.'];
    game.addInteractable({ obj: noticeTree, radius: 3.4, label: () => 'Read the notice', onUse: () => { SFX.click(); game.toast(rnd.pick(forestNoticeLines), 3000); } }); }
  const treehouse = makeTreehouse(game, -18, 14, r);
  // the Neighborhood's porch, Victorian's terrace, Candy Land's cottage, Frosty Peak's cabin and Sunny
  // Shore's third beach hut all have a napping stray cat tucked somewhere by now — the treehouse never
  // got one, and the campers below keep wondering who lives up there anyway. `makeTreehouse()`'s own
  // roof (`G.gable(3.6, 1.2, 3.6)`, `y: 6.7, z: -0.4, ry: PI/2` local to the treehouse's own group `g`)
  // puts its ridge, once that rotation is worked through, at local y = 6.7 + 1.2 = 7.9 (the room's own
  // 6.7 m wall top plus the 1.2 m gable), local z = -0.4 (the roof mesh's own offset), running along
  // local x across the full d = 3.6 m the gable was given — the same ry = PI/2 trick that put the beach
  // hut's own ridge along local x rather than local z. x = 0.7 sits the cat off-centre on that ridge,
  // clear of the lit window below on the front wall (a different height and face entirely) and well
  // short of the eaves at x = ±1.8. Added as a child of the treehouse's own group (already kept in
  // `treehouse` above), never baked — only the procedural outer country runs `bakeDeep()` — so it
  // inherits the treehouse's world position for free, same trick every prior napping cat relies on. No
  // physics box: the existing trunk/room box above (`P.addBox(x, y0 + 4.5, z, 3.2, 9, 3.2)`) already
  // reaches to y0 + 9, past the ridge's own y0 + 7.9, so nothing below can ever climb high enough to
  // meet it regardless. Pure set dressing: no greeting, no effect on the friend count, nothing to collect.
  { const napCat = makeNapCat();
    napCat.group.position.set(0.7, 7.9, -0.4);
    napCat.group.rotation.y = PI / 2 + 0.12;
    treehouse.add(napCat.group);
    let napT = 3; U.push((dt) => { napT += dt; napCat.animate(0, false, dt, napT); }); }
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
  let cutterStump;
  for (const [x, z] of [[-6, 2], [18, 24], [-26, -22], [4, -16]]) { const s = placeT(game, U, makeStump(r), x, z, r() * TAU); boxT(game, x, z, 1.0, 0.75, 1.0, { cam: false }); if (x === -6 && z === 2) cutterStump = s; }
  for (const [x, z] of [[-24, 30], [32, 8], [-36, 6], [8, -38]]) placeT(game, U, makeRock(r, 0x6b7a6a, r.range(1.2, 2.2)), x, z, 0);
  // stepping stones from the entrance to the glade
  for (let i = 0; i < 14; i++) { const z = 40 - i * 2.6, x = sin(i * 0.7) * 1.6; mesh(G.cyl(0.55, 0.6, 0.12, 9), mat(0x8a8a80, { roughness: 1 }), { x, y: P.ground0(x, z) + 0.05, z, ry: r() * TAU, shadow: 'receive', parent: W }); }

  // life: deer, foxes, hares, frogs, owls, fairies, butterflies, the squirrel
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
  // the jump-roper south of here swears "the rabbits won't try it — too many ears in the way", but no
  // rabbit ever actually lived in these woods to back her up or catch her out. `makeHare()` already
  // exists — Frosty Peak's own hares and Candy Land's mint-green one both use it — and had just never
  // been given a woodland coat. A trio of them now keeps to a small clearing in the south-east corner,
  // well outside the third fox's own 8 m leash from (32, -22): `Hopper`, the same shy-hop controller
  // the frogs above and the hollow log's hedgehog already use, bolts each one a short hop away the
  // instant the cat comes within 2.2 m, same as a real hare would.
  // A headless probe built the real Whisper Woods (`game.load(6, 'from-hub')`), sampled every NPC's
  // and the squirrel's own position every frame over 300 simulated frames (so no wandering deer, fox,
  // hula hooper or sitter mid-leash could slip past unnoticed), then swept a 1 m grid of the open
  // floor against both those samples and every physics box: (30, -32), (32, -34) and (29, -35) came
  // back clear by 5.9-7.6 m of the nearest box and 8.0-10.6 m of the nearest other soul, each only
  // 2.8-3.2 m from the next — a loose huddle, not a line. Placed last in this creature block, after
  // every earlier draw from this world's own seeded `r`, so these fixed coordinates and plain
  // `makeHare()` calls disturb nothing built before them.
  for (const [x, z] of [[30, -32], [32, -34], [29, -35]]) { const rig = makeHare(); game.npcs.push(new Hopper(game, rig, { x, z, leash: 3.5, r: 0.15, dist: [0.3, 0.9], dur: 0.3, height: 0.22, idle: [1, 3.5], onHop: () => { if (rnd.chance(0.2)) SFX.chitter(); } })); }
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
  // a woodcutter at the stump by the glade, splitting logs — rounds 602-608 gave six other worlds a
  // "look" prompt on some prop a working NPC stands beside but never acknowledges; Whisper Woods never
  // got its own. `cutterStump`, captured a few lines up from the same `placeT()` call that already
  // built and boxed it (the three other stumps in that loop sit exactly under their own sitters, so a
  // look radius there would always tie their greet circle — this one alone sits 1.6 m clear of the
  // woodcutter, the same kind of offset the surfboard (round 605) and the brazier (round 603) banked on).
  { const stumpLines = ['🪵 "Sawn flat on top — years of this."', '🪵 "Growth rings right there, if you care to count them."', '🪵 "A scatter of fresh chips at the base — mind your paws."'];
    game.addInteractable({ obj: cutterStump, radius: 0.9, label: () => 'Look at the stump', onUse: () => { SFX.click(); game.toast(rnd.pick(stumpLines), 3000); } }); }
  const cutter = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: false }), shirt: 0xb5485f, stripes: 0x1e1e24, pants: 0x3c4a5a, shoes: 0x3a2a1e, axe: true, beard: true, build: 'stout', hat: null, glasses: false });
  W.add(cutter.group);
  game.npcs.push(new Chopper(game, cutter, { x: -6, z: 3.6, ry: PI, cries: ['Mind the chips, puss.', 'Timber! ...just kidding.', 'Good dry oak, this.'] }));
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

  // Robot City's archive-bot, Victorian's night watchman, Candy Land's jack-in-the-box and Sunny Shore's
  // treasure chest all react to the cat on their own, no `E` needed — but Whisper Woods, the one world
  // built entirely around fairies, never got a version of its own. A giant flower now stands closed in a
  // south-west clearing, its five petals folded shut around a sleeping fairy, until the cat wanders
  // within 6 m: the petals peel open on their own stems and the fairy rises into view, blinking awake
  // and fluttering in place, before the petals fold shut over her again once the cat wanders off.
  // A headless probe (the same stub-three harness `test/run.mjs` uses) built the real Whisper Woods
  // (`game.travel(6, 'from-hub')`), sampled every NPC's and the squirrel's own position every quarter
  // second over 30 simulated seconds (so no wandering deer, fox or flying fairy mid-leash could slip
  // past unnoticed), then swept a 1 m grid of the open floor (radius 14-46, short of the radius (58)
  // where forestRegion's own fill takes over) against both those samples and every one of the wood's 298
  // physics boxes: (-9, -42) came back clear by 15.2 m of the nearest box and 15.3 m of the nearest other
  // soul, with the ground flat (y=0) across the whole footprint. No new SFX: the bloom reuses
  // `SFX.twinkle()`, already heard at the fairy ring and the glowing pond.
  { const flx = -9, flz = -42, fly0 = P.ground0(flx, flz);
    boxT(game, flx, flz, 0.22, 1.3, 0.22, { cam: false });
    const stem = group(flx, fly0, flz, W);
    const stemM = mat(0x3a6b3a, { roughness: 0.85 });
    mesh(G.cyl(0.045, 0.07, 1.3, 7), stemM, { y: 0.65, parent: stem });
    mesh(G.earCone(0.14, 0.4), stemM, { x: 0.1, y: 0.75, ry: 0.6, rz: -1.1, parent: stem });
    mesh(G.earCone(0.12, 0.34), stemM, { x: -0.08, y: 0.42, ry: -0.8, rz: 1.1, parent: stem });
    const bud = group(0, 1.3, 0, stem);
    mesh(G.sphere(0.11, 10, 8), mat(0x4a7a3a, { roughness: 0.8 }), { sy: 0.75, parent: bud });   // the calyx
    const petalM = mat(0xe8a8ff, { roughness: 0.55, side: THREE.DoubleSide });
    const petals = [];
    for (let i = 0; i < 5; i++) { const ang = i / 5 * TAU;
      const hinge = group(sin(ang) * 0.07, 0.05, cos(ang) * 0.07, bud); hinge.rotation.y = ang;
      mesh(G.earCone(0.09, 0.3), petalM, { y: 0.15, parent: hinge });
      petals.push(hinge); }
    const fairy = makeFairy(0xffe0f5); const nest = group(0, 0.02, 0, bud); nest.add(fairy.group); fairy.group.scale.setScalar(0.85);
    pointLight(0xe8a8ff, 2, 3, 0, 0.25, 0, bud);
    let flOpen = 0, flNear = false;
    const flowerLines = ['🧚 "Five more minutes... oh, fine, I am up."', '🧚 "Oh! A visitor. Nobody ever finds this flower."', '🧚 "Mind the pollen, puss — it is for sneezing, not sleeping. I checked."'];
    bud.userData.update = (dt, t) => {
      const c = game.cat.group.position, isNear = dist2(c.x, c.z, flx, flz) < 36;
      flOpen = damp(flOpen, isNear ? 1 : 0, 5, dt);
      for (const h of petals) h.rotation.x = flOpen * 1.3;
      nest.position.y = 0.02 + flOpen * 0.16;
      fairy.animate(0, false, dt, t);
      if (isNear && !flNear) { flNear = true; SFX.twinkle(); game.toast(rnd.pick(flowerLines)); game.fx.emit(flx, fly0 + 1.5, flz, { count: 14, colors: [0xe8a8ff, 0xffe0f5, 0xa8ff9a], speed: 1.0, up: 1.2, life: 0.9, gravity: 1.4 }); }
      if (!isNear) flNear = false;
    };
    U.push(bud.userData.update); }

  // this wood's own ambient particles (`game.fx.setAmbient` below, in the same warm green-gold as a
  // firefly) drift over the whole floor already, but nobody had ever given a soul a reason to chase
  // them. A child now wanders a small clearing south of the frog pond, jam jar held up overhead, three
  // tiny glowing motes circling inside it. A headless probe (the same stub-three harness `test/run.mjs`
  // uses) built the real Whisper Woods (`game.travel(6, 'from-hub')`), sampled every NPC's and the
  // squirrel's own position every frame over 30 simulated seconds (so no wandering deer, fox or flying
  // fairy mid-leash could slip past unnoticed), then checked this spot against every one of the wood's
  // physics boxes: (18, -30) came back clear by 11.6 m of the nearest box (the south rock at (8, -38))
  // and 14.0 m of the nearest other soul (the tracking deer's own leash circle centred on (-10, -30)),
  // at radius 35 from the origin, well short of the radius (58) where forestRegion's own fill takes
  // over. No new controller: a plain `Wanderer` on a short 4 m leash, the same pairing the deer and fox
  // above already use; the jar's glass is `transparent` and its three motes use `glowMat`, so both skip
  // `bakeRig()` on their own, same as every other glowing or see-through held prop in this file. The
  // motes' own circling and the jar light's own pulse run on the world clock `t` alone, never this
  // world's own seeded `r`, so neither can shift any later wardrobe or layout pick in this build.
  { const fx = 18, fz = -30;
    const catcher = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(catcher.group);
    const jar = group(0, 0.26, 0.09, catcher.hands[1]); jar.rotation.x = -0.7;
    const glassM = mat(0xcfe8ff, { roughness: 0.15, transparent: true, opacity: 0.35 });
    mesh(G.cyl(0.07, 0.07, 0.14, 10), glassM, { parent: jar });
    mesh(G.cyl(0.075, 0.075, 0.02, 10), mat(0x8a6a3a, { roughness: 0.8 }), { y: 0.08, parent: jar });   // the lid
    const moteColors = [0xd4ff6a, 0xfff3a0, 0xd4ff6a];
    const motes = moteColors.map((c) => mesh(G.sphere(0.012, 6, 5), glowMat(c, 2), { parent: jar, shadow: 'none' }));
    const jarLight = pointLight(0xd4ff6a, 1.2, 3, 0, 0, 0, jar);
    let mt = r() * TAU;
    U.push((dt, t) => {
      mt += dt * 2.2;
      for (let i = 0; i < motes.length; i++) { const a = mt + i * 2.1; motes[i].position.set(cos(a) * 0.035, sin(a * 1.3) * 0.03, sin(a) * 0.035); }
      jarLight.intensity = 1.0 + sin(t * 6) * 0.4;
    });
    game.npcs.push(new Wanderer(game, catcher, { x: fx, z: fz, speed: 0.7, leash: 4, height: 1.4, idle: [1.5, 4], walk: [1, 3], cryIcon: '🫙',
      cries: ["Three in the jar already - getting faster at this.", "Careful, puss, don't tip it — they're friendly once they're in.", 'Mum says to let them go before bed. I always do. Eventually.'] })); }

  // the Neighborhood, Candy Land, Sunny Shore and Frosty Peak all have a trampoline bouncing a kid by
  // now — Whisper Woods was the last of the seven left without one. A moss-green trampoline now bounces
  // a kid just past the outer tree ring, in the thin band of open ground between where the ring's own
  // 40 trees stop (radius <= 54) and where `forestRegion`'s own automatic fill of the outer country
  // takes over (radius 58). Same `makeTrampoline` prop and `Bouncer` controller the other four worlds
  // already use, just restriped, with the terrain-aware `placeT`/`boxT` helpers in place of flat
  // `place()`/`P.addBox()`, since the forest floor rolls gently underfoot out here too. Placed last of
  // every person this build adds, after the firefly jar catcher, so it draws from the very tail of this
  // world's own local `r` sequence and disturbs nothing built earlier in the wood.
  // A headless probe (the stub-three harness `test/run.mjs` itself uses, driven by hand with
  // `game.load(6, 'from-hub')` then `game.step(dt)` run for 300 simulated seconds so every deer, fox,
  // hare, fairy and wandering child actually moved) sampled every NPC's and the squirrel's own position
  // every quarter second, then swept a 2 m grid of the open floor (radius 15-55, short of the radius
  // (58) where forestRegion's own fill takes over) against both those samples and all 751 of the wood's
  // physics boxes: (54, 7) came back clear by 9.7 m of the nearest box and well past 20 m of the nearest
  // other soul, with ground height rising gently (0.83 m) this far out.
  { const tx = 54, tz = 7;
    const tramp = makeTrampoline({ color: 0x4caf6a }); placeT(game, U, tramp, tx, tz, 0);
    boxT(game, tx, tz, 1.1, 0.42, 1.1, { cam: false });
    const bounceKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5) }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(bounceKid.group);
    game.npcs.push(new Bouncer(game, bounceKid, tramp, { x: tx, z: tz, ry: PI, height: 0.68, cycle: 1.05 }));
    const bounceLines = ["Higher than the treehouse roof, nearly!", "Careful, puss — mind the springs, they're damp with dew.", "The fairies won't try it. Too much bounce for their wings."];
    let bounceCryT = r.range(3, 7);
    U.push((dt) => { bounceCryT -= dt; if (bounceCryT <= 0) { bounceCryT = r.range(8, 14); const c = game.cat.group.position; if (dist2(tx, tz, c.x, c.z) < 400) { game.toast('🤸 "' + r.pick(bounceLines) + '"', 2400); SFX.talk(); } } }); }

  // Sunny Shore, Victorian, Frosty Peak and Robot City all blow or brush at something that drifts and
  // fades by now — these woods, the one world actually built around fairies and wishes (the fairy ring
  // above already grants three), never got one of their own. A child now stands in a clearing north-east
  // of the trampoline holding a dandelion up to blow: three seeds lift off the puff and drift upward on
  // the breeze before fading into a soft green-gold sparkle, the same `SFX.twinkle()` and palette the
  // fairy ring's own wish already uses, so this reads as a small wish of its own rather than a copy of
  // the beach's soap bubbles. No new controller: a plain `Charger`, the same pairing every other standing
  // figure in this file already uses. The dandelion sits in `hands[1]` — the resting hand every other
  // held prop here already keeps steady, never the one `makeHuman`'s own idle gestures swing — so its
  // world position only needs reading once, right after `Charger` fixes the rig's own position and
  // rotation; the seeds themselves ride the world clock `t` off three fixed phases, never this world's
  // own seeded `r`, so nothing later shifts.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real Whisper
  // Woods (`game.travel(6, 'from-hub')`), sampled every NPC's and the squirrel's own position every
  // quarter second over 300 simulated seconds (so the wandering deer, fox, hares and the jam-jar child
  // all actually moved), then swept a 2 m grid of the open floor (radius 15-56, short of the radius (58)
  // where forestRegion's own fill takes over, and clear of every hand-placed landmark by 8 m or more)
  // against both those samples and all 707 of the wood's physics boxes: (40, 38) came back clear by
  // 10.0 m of the nearest box and 11.7 m of the nearest other soul.
  { const ddx = 40, ddz = 38, ddry = atan2(-ddx, -ddz);
    const blower = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(blower.group);
    const stem = group(0.02, 0, 0.08, blower.hands[1]); stem.rotation.set(-0.5, 0, 0.25);
    const stemM = mat(0x5a8a4a, { roughness: 0.8 });
    mesh(G.cyl(0.008, 0.01, 0.22, 6), stemM, { y: 0.11, parent: stem });
    const puff = group(0, 0.24, 0, stem);
    const puffM = mat(0xf2efe6, { roughness: 0.9, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 9; i++) { const a = r() * TAU, el = r() * PI, rr = 0.045;
      mesh(G.sphere(0.012, 5, 4), puffM, { x: sin(el) * cos(a) * rr, y: cos(el) * rr, z: sin(el) * sin(a) * rr, shadow: 'none', parent: puff }); }
    game.npcs.push(new Charger(game, blower, { x: ddx, z: ddz, ry: ddry, cryIcon: '🌼',
      cries: ['Make a wish, puss.', "Careful — don't sneeze on it, you'll ruin the count.", 'One for every secret, they say.'] }));
    const tip = V3(); puff.getWorldPosition(tip);
    const seedM = mat(0xf7f3ec, { roughness: 0.95, transparent: true, opacity: 0.9 });
    const seeds = [0, 1, 2].map((i) => ({ m: mesh(G.sphere(0.02, 6, 5), seedM, { shadow: 'none', parent: W }), ph: i * 1.4, popped: -1 }));
    const cyc = 3.6;
    U.push((dt, t) => {
      for (const s of seeds) {
        const k = ((t + s.ph) % cyc) / cyc;
        if (k < 0.95) {
          s.m.visible = true;
          s.m.position.set(tip.x + sin(t * 0.7 + s.ph) * 0.3 * k, tip.y + k * 1.8, tip.z + cos(t * 0.5 + s.ph) * 0.22 * k);
          s.m.scale.setScalar(1 - k * 0.6);
        } else {
          s.m.visible = false;
          const cycleNo = floor((t + s.ph) / cyc);
          if (cycleNo !== s.popped) { s.popped = cycleNo;
            const c = game.cat.group.position;
            if (dist2(tip.x, tip.z, c.x, c.z) < 400) { SFX.twinkle(); game.fx.emit(s.m.position.x, s.m.position.y, s.m.position.z, { count: 3, colors: [0xf7f3ec, 0xa8ff9a, 0xffe27a], speed: 0.4, up: 0.5, life: 0.5, gravity: 1.2 }); }
          }
        }
      }
    }); }

  // every other world's children have worked through yo-yos, hula hoops, jump ropes and hopscotch by
  // now (the yo-yo kid above is Whisper Woods' own) — but no world yet had the oldest toy of them all,
  // a spinning top. A child kneels on the open ground east of the jogger's own patch, pull-string just
  // yanked free, watching it go. The top itself is a standalone prop rather than anything held — once
  // launched, a real top rides the ground, not a hand — spinning fast on the world clock `t` alone with
  // a slow circular wobble, same as a real one losing its balance, so it draws nothing from this
  // world's own seeded `r` and can't shift any later mushroom hue or butterfly colour pick.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real Whisper
  // Woods (`game.travel(6, 'from-hub')`), sampled every NPC's and the squirrel's own position every
  // frame over 300 simulated seconds (so no wandering deer, fox or flying fairy mid-leash could slip
  // past unnoticed), then swept a 2 m grid of the open floor (radius 15-50, short of the radius (58)
  // where forestRegion's own fill takes over) against both those samples and every one of the wood's
  // 678 physics boxes: (35, 17) came back clear by 6.1 m of the nearest box and 9.0 m of the nearest
  // other soul (the jogger, pausing for breath 9.5 m off).
  { const tx = 35, tz = 17, topY = P.ground0(tx, tz);
    const top = group(tx, topY, tz, W);
    const bodyM = mat(0xff6fb5, { roughness: 0.5 }), rimM = mat(0xffd54a, { roughness: 0.4 }), pegM = mat(0x5a3a28, { roughness: 0.8 });
    mesh(G.cone(0.17, 0.3, 12), bodyM, { y: 0.15, rx: PI, parent: top });
    noInk(mesh(G.torus(0.17, 0.022, 6, 16), rimM, { y: 0.3, rx: PI / 2, shadow: 'none', parent: top }));
    mesh(G.cyl(0.035, 0.035, 0.12, 8), pegM, { y: 0.36, parent: top });
    for (let i = 0; i < 3; i++) { const a = i * TAU / 3; mesh(G.sphere(0.022, 6, 5), rimM, { x: cos(a) * 0.095, y: 0.16, z: sin(a) * 0.095, shadow: 'none', parent: top }); }
    boxT(game, tx, tz, 0.4, 0.42, 0.4, { cam: false });
    top.userData.update = (dt, t) => { top.rotation.y += dt * 16; top.rotation.x = sin(t * 2.3) * 0.06; top.rotation.z = cos(t * 2.3) * 0.06; };
    U.push(top.userData.update);
    const kx = tx - 0.85, kz = tz + 0.25, kry = atan2(tx - kx, tz - kz);
    const spinner = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(spinner.group);
    const cord = group(0, 0.02, 0.08, spinner.hands[0]); cord.rotation.x = -0.4;
    noInk(mesh(G.cyl(0.006, 0.006, 0.16, 5), mat(0xd9c9a8, { roughness: 0.9 }), { y: 0.08, rz: 0.6, parent: cord }));
    game.npcs.push(new Kneeler(game, spinner, { x: kx, z: kz, ry: kry, cryIcon: '🌀',
      cries: ['Fastest spinner in the whole wood, this one.', "Careful, puss — swat it and it'll roll clean into the ferns.", "Wound it myself. Bit wobbly, but it holds."] })); }

  // Victorian, Sunny Shore, Frosty Peak, Candy Land and the Neighborhood all have someone bent under a
  // dark cloth by now — Whisper Woods, with its deer, foxes and fairy rings, never got its own. A
  // photographer sets up an old box camera on the open forest floor south-west of the clearing, framing
  // the deer glade and the mushroom ring beyond. Same `Photographer` controller and `makeOldCamera()`
  // tripod every earlier world's photographer already uses, just woodland colours (moss and bark) in
  // place of a flatcap-and-coat, a sunhat or a beanie.
  // A headless probe (a scratch script built on the same stub-three harness `test/run.mjs` itself uses,
  // since there's no browser here to look at it) walked the real Whisper Woods through the suite's own
  // hub route (`game.travel(6, 'from-hub')`), sampled every NPC's and the squirrel's own position every
  // quarter second over 300 simulated seconds — long enough for every deer, fox, hare and frog to clear
  // any one spot several times over — then swept a 1 m grid of the open forest floor (radius 15-50,
  // short of the radius (58) where forestRegion's own fill takes over) against both those samples and
  // all 722 of the wood's physics boxes: (-16, -36) came back clear by 7.9 m of the nearest box and
  // 8.1 m of the nearest other soul (one of the wandering deer, on its own long leash). Placed last of
  // every person this build adds, after the spinning-top child, so it draws from the very tail of this
  // world's own local `r()` sequence.
  { const px = -16, pz = -36, pry = atan2(0 - px, 0 - pz);   // facing back toward the clearing and the big mushroom ring
    const camWard = makeWardrobe(r, { shirts: [0x4a5a3a, 0x5a4a3a, 0x3a4a4a], pants: [0x3a3a2a, 0x2a2a2a], shoes: [0x2a2018] });
    const snapper = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: camWard }),
      hat: 'flatcap', hatColor: 0x3a3a2a, jacket: 0x3a4a2e, glasses: r.chance(0.3) });
    W.add(snapper.group);
    const camera = makeOldCamera();
    game.npcs.push(new Photographer(game, snapper, camera, { x: px, z: pz, ry: pry, cryIcon: '📷',
      cries: ['Deer glade and the mushroom ring, both in one plate.', "Careful, puss — it's only flash powder, not fire.", "Hold still now — well, you won't, but the deer might."] })); }

  // Victorian's two retired gents have had a draughts board between them since round 354, Robot City's
  // own checkers drum since round 384 and Frosty Peak's card table since round 397 — but no world yet
  // had a game that used what was actually lying on the ground around it. Two foresters now sit on sawn
  // log rounds either side of a low table in a clearing east of the photographer's own spot, a draughts
  // board between them — counters replaced with a scatter of real acorns and chestnuts instead of the
  // usual painted discs. No new controller: both are a plain `Sitter`, the same pairing the whittler and
  // knitter already use on their own stumps, just seated on a smaller sawn log round (built inline here,
  // bark-sided like `makeStump()` but a third its height, matching the exact proportions the Victorian
  // draughts table's `makeIceStool()` seats and Frosty Peak's card table already use) rather than a full
  // stump, with the terrain-aware `placeT`/`boxT` helpers in place of the flat-floor town's
  // `place()`/`P.addBox()`, since the forest floor rolls gently underfoot out here too.
  // A headless probe (a scratch script built on the same stub-three harness `test/run.mjs` itself uses,
  // since there's no browser here to look at it) walked the real Whisper Woods through the suite's own
  // hub route (`game.travel(6, 'from-hub')`), sampled every NPC's and the squirrel's own position every
  // quarter second over 300 simulated seconds — long enough for every deer, fox, hare and frog to clear
  // any one spot several times over — then swept a 1 m grid of the open forest floor (radius 15-50,
  // short of the radius (58) where forestRegion's own fill takes over, and clear of every hand-placed
  // landmark by 5 m or more) against both those samples and all 295 of the wood's physics boxes:
  // (42, -27) came back clear by 11.5 m of the nearest box and 19.0 m of the nearest other soul (one of
  // the wandering deer, on its own long leash), with the ground flat (y=0) across the whole footprint.
  // Placed last of every person this build adds, after the photographer, so it draws from the very tail
  // of this world's own local `r()` sequence.
  { const tx = 42, tz = -27, topY = 0.72, boardW = 0.64, sq2 = boardW / 8;
    const seatAx = tx - 0.72, seatAz = tz, seatBx = tx + 0.72, seatBz = tz;
    const ryA = atan2(seatBx - seatAx, seatBz - seatAz), ryB = atan2(seatAx - seatBx, seatAz - seatBz);
    const ty0 = P.ground0(tx, tz);
    const bark = mat(0x5b3d24, { roughness: 1, map: TEX.bark() });
    const table = group(tx, ty0, tz, W);
    mesh(G.box(boardW, 0.03, boardW), bark, { y: topY, parent: table });
    const lightSq = mat(0xcdbb8e, { roughness: 0.9 }), darkSq = mat(0x3f2a1a, { roughness: 0.9 });
    for (let gx = 0; gx < 8; gx++) for (let gz = 0; gz < 8; gz++) {
      mesh(G.box(sq2 * 0.97, 0.01, sq2 * 0.97), (gx + gz) % 2 ? darkSq : lightSq,
        { x: -boardW / 2 + sq2 * (gx + 0.5), y: topY + 0.021, z: -boardW / 2 + sq2 * (gz + 0.5), parent: table }); }
    for (const [lx, lz] of [[-0.27, -0.27], [0.27, -0.27], [-0.27, 0.27], [0.27, 0.27]]) mesh(G.cyl(0.025, 0.03, topY, 8), bark, { x: lx, y: topY / 2, z: lz, parent: table });
    // acorns and chestnuts standing in for draughts men, a scatter mid-game, dark squares only
    const chestnutM = mat(0x3a2418, { roughness: 0.3 }), acornBodyM = mat(0xcfa15a, { roughness: 0.6 }), acornCapM = mat(0x5a3a20, { roughness: 0.8 });
    const pieceY = topY + 0.036;
    const toXZ = (gx, gz) => [-boardW / 2 + sq2 * (gx + 0.5), -boardW / 2 + sq2 * (gz + 0.5)];
    [[1, 0, 1], [3, 0, 1], [0, 1, 1], [2, 1, 1], [4, 1, 1], [1, 2, 0], [3, 4, 0], [5, 4, 0], [2, 5, 0], [6, 3, 1]].forEach(([gx, gz, isChestnut]) => {
      const [px, pz] = toXZ(gx, gz);
      if (isChestnut) mesh(G.sphere(0.04, 8, 6), chestnutM, { x: px, y: pieceY, z: pz, sy: 0.8, parent: table });
      else { const acorn = group(px, pieceY, pz, table); mesh(G.sphere(0.034, 8, 6), acornBodyM, { y: 0.006, sy: 0.9, parent: acorn }); mesh(G.cyl(0.038, 0.03, 0.026, 8), acornCapM, { y: 0.024, parent: acorn }); } });
    boxT(game, tx, tz, boardW + 0.1, topY, boardW + 0.1, { cam: false });
    const logRound = () => { const g = new THREE.Group(); mesh(G.cyl(0.26, 0.28, 0.32, 12), bark, { y: 0.16, parent: g }); mesh(G.cyl(0.25, 0.25, 0.03, 12), mat(0xd9c29a, { roughness: 1 }), { y: 0.3, shadow: 'none', parent: g }); return g; };
    placeT(game, U, logRound(), seatAx, seatAz, ryA + PI); placeT(game, U, logRound(), seatBx, seatBz, ryB + PI);
    const forestWard = makeWardrobe(r, { shirts: [0x5a6a4a, 0x6b4f3a], pants: [0x3a3a2a, 0x2e3a28], shoes: [0x3a2a1e] });
    const playerA = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: true, wardrobe: forestWard }),
      hat: 'flatcap', hatColor: 0x3a3a28, jacket: 0x4a4030, scarf: null, bag: null, backpack: null, beard: true, glasses: false });
    const playerB = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: true, wardrobe: forestWard }),
      hat: 'bonnet', hatColor: 0x6b4f3a, jacket: null, scarf: 0x8a6a4a, bag: null, backpack: null, glasses: true });
    W.add(playerA.group); W.add(playerB.group);
    game.npcs.push(new Sitter(game, playerA, { x: seatAx, z: seatAz, ry: ryA, seat: 0.3,
      cries: ['Best of three, same as every lunch break.', "Mind the board, puss — that's a hard-won king.", "Lost count of how many games we've played out here."] }));
    game.npcs.push(new Sitter(game, playerB, { x: seatBx, z: seatBz, ry: ryB, seat: 0.3,
      cries: ["He still can't beat me, after all these years.", "Careful, puss — don't scatter the acorns.", "One more game before the light goes."] }));
    let acornMoveT = rnd.range(6, 10);
    U.push((dt) => { acornMoveT -= dt; if (acornMoveT <= 0) { acornMoveT = rnd.range(7, 12); SFX.click(); game.fx.emit(tx, ty0 + topY + 0.1, tz, { count: 4, color: 0xcfa15a, speed: 0.3, up: 0.3, life: 0.6, gravity: 1.2, spread: 0.4 }); } }); }

  // Whisper Woods has a forager, a berry seller and a dandelion wisher living off the woods already, but
  // nobody out here had ever kept anything of their own — every world's vendor and every world's garden
  // (the Neighborhood's vegetable patch, Candy Land's gumdrop patches) has somebody tending it except this
  // one. **A beekeeper now stands beside a three-tier hive on the woods' own quiet western fringe**,
  // smoker in hand, a few real bees (`makeBee`, next to `makeButterfly` in `56-npcs-wild.js`) looping tight
  // circles just above the roof. No new standing controller: `Charger` already does nothing but hold an
  // idle pose and greet, the same job it does for Robot City's own plugged-in robots, so the keeper just
  // stands there calmly the way anyone minding a hive from a safe distance actually would. The smoker
  // itself is a held prop built the same way the chalker's chalk and the spinner's cord already are —
  // parented straight into `rig.hands[1]`, no controller change — and puffs a few pale motes from its
  // spout every several seconds, the same `game.fx.emit` trick the draughts table's own acorn-click
  // already uses, just upward and pale instead of brown and outward.
  // A headless probe (a scratch script built on the same stub-three harness `test/run.mjs` itself uses,
  // since there's no browser here to look at it) built the real Whisper Woods (`game.load(6, 'from-hub')`,
  // then `game.start('new')` so every deer, fox, hare and frog actually moved), sampled every NPC's and
  // the squirrel's own position every quarter second over 300 simulated seconds, then swept a 1 m grid of
  // the open forest floor (radius 15-50, short of the radius (58) where forestRegion's own fill takes
  // over) against both those samples and all 629 of the wood's physics boxes: (-43, 2) came back clear by
  // 8.2 m of the nearest box and 9.1 m of the nearest other soul, well clear of the photographer (-16,-36),
  // the draughts table (42,-27) and the spinning-top child. Placed last of every person this build adds,
  // after the draughts players, so it draws from the very tail of this world's own local `r()` sequence.
  { const hx = -43, hz = 2, hy0 = P.ground0(hx, hz);
    const white = mat(0xe9e4d6, { roughness: 0.85 }), trim = mat(0x6b8a5a, { roughness: 0.8 }), dark = mat(0x241e14, { roughness: 0.9 });
    const hive = group(hx, hy0, hz, W);
    for (let i = 0; i < 3; i++) mesh(G.box(0.46, 0.26, 0.4), i === 2 ? trim : white, { y: 0.1 + i * 0.27, parent: hive });
    mesh(G.box(0.52, 0.03, 0.46), dark, { y: 0.835, shadow: 'both', parent: hive });   // flat roof board
    mesh(G.cyl(0.035, 0.035, 0.05, 8), dark, { y: 0.235, z: 0.21, rx: PI / 2, shadow: 'none', parent: hive });   // entrance
    boxT(game, hx, hz, 0.3, 1.0, 0.25, { cam: false });
    for (let i = 0; i < 3; i++) { const rig = makeBee(); game.npcs.push(new Flyer(game, rig, { cx: hx, cz: hz, r: rnd.range(0.35, 0.55), h: 1.0 + rnd.range(-0.1, 0.15), speed: rnd.range(2.6, 3.6), bob: 0.12, wobble: 0.15, cw: i % 2 === 0, phase: i * 2.1 })); }
    const bx = hx, bz = hz - 1.1, bry = atan2(hx - bx, hz - bz);
    const beeWard = makeWardrobe(r, { shirts: [0xece4d2], pants: [0xece4d2, 0xe3dcc8], shoes: [0x3a3226] });
    const keeper = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: beeWard }),
      hat: 'sunhat', hatColor: 0xe9e4d6, jacket: 0xece4d2, glasses: false, beard: false });
    W.add(keeper.group);
    const smoker = group(0, 0.26, 0.1, keeper.hands[1]); smoker.rotation.x = -0.35;
    mesh(G.cyl(0.028, 0.032, 0.07, 10), mat(0x8a8a86, { metalness: 0.5, roughness: 0.4 }), { parent: smoker });
    const spout = mesh(G.cyl(0.011, 0.015, 0.045, 8), mat(0x6a6a66, { metalness: 0.5, roughness: 0.4 }), { y: 0.055, z: 0.025, rx: -0.3, parent: smoker });
    game.npcs.push(new Charger(game, keeper, { x: bx, z: bz, ry: bry, cryIcon: '🐝',
      cries: ['Calm smoke, calm bees. Works every time.', "Careful, puss — give the hive some room.", "Three jars of honey off this lot, last season."] }));
    let smokeT = rnd.range(5, 9);
    U.push((dt) => { smokeT -= dt; if (smokeT <= 0) { smokeT = rnd.range(7, 12); const p = V3(); spout.getWorldPosition(p); game.fx.emit(p.x, p.y, p.z, { count: 4, color: 0xe8e4da, speed: 0.15, up: 0.3, life: 1.4, gravity: -0.3, spread: 0.2 }); } }); }

  // every creature in this glade moves with some clip or flutter — even the snail above has somewhere to
  // be, slowly — but nothing here had ever just sat and scuttled a few inches at a time. A ladybug now
  // rests on the open forest floor, antennae twitching, taking a short scuttling hop every few seconds
  // and startling a little further off whenever the cat gets close. `Hopper` already does exactly this
  // for the frogs and the fox's quarry elsewhere in these woods, just dialled down to an inch-scale hop
  // instead of a leap, so this is a build (`makeLadybug`, new, next to `makeSnail` in `56-npcs-wild.js`)
  // and a placement, no new controller. Drawn from the shared `rnd()` sequence only (its colour is fixed,
  // not even a pick), never this world's own seeded `r`, so it costs no later wardrobe draw in this build.
  // A headless probe built the real Whisper Woods (`game.travel(6, 'from-hub')`), sampled every NPC's and
  // the squirrel's own position every quarter second over 30 simulated seconds (so nothing wandering,
  // hopping or flying mid-leash could slip past unnoticed), then swept a 2 m grid of the open forest floor
  // (radius <= 55, short of `forestRegion`'s own fill at 58) against both those samples and every one of
  // the wood's physics boxes: (-28, -20) came back clear by 12.8 m of the nearest box and 13.2 m of the
  // nearest other soul, on flat ground, outside every hand-reserved zone in this file.
  { const rig = makeLadybug(); W.add(rig.group);
    game.npcs.push(new Hopper(game, rig, { x: -28, z: -20, leash: 1.0, r: 0.08, dist: [0.12, 0.3], dur: 0.3, height: 0.05, idle: [1.5, 4] })); }

  // the snail above finally gave this wood something that creeps, but nothing had ever been caught
  // actually spinning silk. A knee-high orb web now hangs between two twig stakes in a quiet pocket of
  // undergrowth south-east of the pond, dew beads glinting on it and a small spider sitting dead centre.
  // Placed at (16, -16): well clear of the frog ring at (8, -6) (12.8 m, past the frogs' own 6.7 m
  // furthest hop), the ring-dancers at (21, 0) (16.8 m) and the juggler at (28, -8) (14.4 m). Purely
  // decorative and non-colliding — two thin twigs at ground level, same call the wind chime and the
  // scattered mushrooms already make for anything this slight — so it needs no physics box and no
  // keep-out probe, and changes no walkable-ground percentage.
  //
  // that web sat there for a few rounds with nothing to say for itself — every other finished prop in
  // these woods (the wind chime, the flower) had already earned a look/listen toast, and this one never
  // had. `makeSpiderweb`'s own return value, previously discarded right after `placeT`, is now kept in
  // `web` and handed straight to `game.addInteractable`, the same trick the factory sign and the robot
  // arm already used over in Robot City. No new mesh, no new physics box: the web's own footprint is
  // under a metre across, so a 1.8 m radius stays clear of the frog ring (12.8 m off), the ring-dancers
  // (16.8 m) and the juggler (14.4 m) by the same wide margins the placement comment above already
  // worked out.
  { const wx = 16, wz = -16;
    const web = placeT(game, U, makeSpiderweb(r), wx, wz, atan2(8 - wx, -6 - wz));
    const webLines = ['🕸️ "Dew beads strung on silk, and a spider holding dead centre — not a single strand out of place."', '🐛 "Whatever built this wove it between two twigs and never came back to check it."', '✨ "The morning dew only shows the web off for an hour or two before it dries."'];
    game.addInteractable({ obj: web, radius: 1.8, label: () => 'Look at the web', onUse: () => { SFX.click(); game.toast(rnd.pick(webLines), 3000); } }); }

  // the Neighborhood (395), Robot City (425), Victorian (426), Candy Land (427), Sunny Shore (428) and
  // Frosty Peak (429) have all had their own turn at the same back-garden toss game by now — a horseshoe,
  // a magnetic coupling, a brass quoit, a gummy ring, a coil of rope, a harness ring — and Whisper Woods,
  // with woodland stumps standing all over it already, was the one world left without a pair of stakes
  // to throw at. Two foresters now lob a woven vine ring back and forth, trying to land it over a pair of
  // short sawn stumps planted well out past the tree line south-west of the glade. "Right over the stump
  // — that's a landing!" "Careful, puss — that vine's older than you are." "Best of nine, loser coils the
  // rope."
  // No new controller: the same `Horseshoes` class (`55-npcs.js`) every earlier reskin already uses,
  // unchanged — held a moment, lobbed on an arc, caught, lobbed back, with its own `SFX.clang()` on
  // landing — just two squat sawn stumps (a plain cylinder and a pale cut-top disc, the same two-mesh
  // trick `makeStump` uses nearby, just slimmer so a 0.15 m ring can actually land over one) and a
  // twisted vine-green torus standing in for the iron horseshoe, brass quoit, coupling, rope or harness
  // ring, with a couple of spare rings coiled by the near stump for set dressing.
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses) built
  // the real Whisper Woods (`game.travel(6, 'from-hub')`), sampled every NPC's own position once a second
  // over 300 simulated seconds, then swept a 2 m grid of the open forest floor (radius 10-55, short of
  // the radius (58) where `forestRegion`'s own fill takes over) against both those samples and all 668 of
  // the wood's physics boxes, testing every candidate stump pair at once: (-46, -30) came back clear by
  // 8.7 m of the nearest box and 19.3 m of the nearest other soul over the full 300 s window, with both
  // stumps themselves — (-46, -33) and (-46, -27), either side of the 6 m pitch — clear by at least 8.7 m
  // of the nearest box and 19.3 m of the nearest soul.
  { const vcx = -46, vcz = -30, vgap = 6;
    const stumpM = mat(0x5b3d24, { roughness: 1, map: TEX.bark() }), capM = mat(0xc9a86a, { roughness: 1 });
    for (const vz of [vcz - vgap / 2, vcz + vgap / 2]) {
      const py = P.ground0(vcx, vz);
      mesh(G.cyl(0.09, 0.1, 0.4, 10), stumpM, { x: vcx, y: py + 0.2, z: vz, parent: W });
      mesh(G.cyl(0.085, 0.085, 0.03, 10), capM, { x: vcx, y: py + 0.415, z: vz, shadow: 'none', parent: W });
      boxT(game, vcx, vz, 0.14, 0.4, 0.14, { cam: false }); }
    // a couple of spare vine rings coiled by the near stump, baked in with everything else — just set dressing
    const spareM = mat(0x4a6a3a, { roughness: 0.85 });
    const py0 = P.ground0(vcx, vcz - vgap / 2);
    for (let i = 0; i < 2; i++) mesh(G.torus(0.13, 0.03, 6, 16), spareM, { x: vcx + 0.3, y: py0 + 0.035 + i * 0.06, z: vcz - vgap / 2 + 0.1, rx: PI / 2, ry: i * 0.7, parent: W });
    const vineWardA = makeWardrobe(r, { shirts: [0x4a7a5a], pants: [0x3a4a2e, 0x4a3a2e], shoes: [0x3a2a1e, 0x2a2018] });
    const vineWardB = makeWardrobe(r, { shirts: [0x8a6a44], pants: [0x2e4a3a, 0x3a3a3a], shoes: [0x3a2a1e, 0x2a2018] });
    const tossA = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: r.chance(0.3), wardrobe: vineWardA }), hat: 'cap', hatColor: 0x2e4a3a, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    const tossB = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: r.chance(0.3), wardrobe: vineWardB }), hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(tossA.group); W.add(tossB.group);
    const ring = mesh(G.torus(0.15, 0.04, 8, 20), mat(0x4a6a3a, { roughness: 0.85 }), { x: vcx, y: py0 + 1, z: vcz - vgap / 2, rx: PI / 2, parent: W });
    const vineLines = ["Right over the stump — that's a landing!", "Careful, puss — that vine's older than you are.", 'Best of nine, loser coils the rope.'];
    game.npcs.push(new Horseshoes(game, tossA, tossB, ring, { cx: vcx, cz: vcz, gap: vgap, cries: vineLines, cryIcon: '🌿' }));
    greetable(game, { rig: tossA }); greetable(game, { rig: tossB }); }

  // Round 432 closed out Candy Land's own frisbee thrower and left Whisper Woods as the only world of
  // the seven without one — the Neighborhood, Robot City, Victorian, Candy Land, Sunny Shore and Frosty
  // Peak all have somebody tossing a disc straight up for the fun of it, and these woods, for all their
  // deer, foxes, frogs and fairy rings, never got the one throw that needs nobody on the other end. **A
  // woodland local now stands on a quiet stretch of forest floor north-east of the glade, lobbing a
  // bark-brown disc straight up** — it rises on a spin, hangs a beat at the top, and drops back into the
  // palm for the next throw.
  // No new controller: the same `FrisbeePlayer` class (`55-npcs.js`, next to `HulaHooper`) every other
  // world's reskin already uses, unchanged — just this world's own earthy wardrobe on the thrower in
  // place of beachwear, overalls, a top hat or candy colours.
  // Its own built-in `cries` option was left unused on purpose, same reasoning as Robot City's and
  // Victorian's own reskins: that path draws its idle-chatter timer from the shared global `rnd()`
  // sequence, and `test/run.mjs` rebuilds the Neighborhood again right after this world (`travel(6,
  // 'from-hub')` then `travel(0, 'from-forest')`), so any extra global draw here would shift every
  // `rnd()`-seeded pick in that rebuilt Neighborhood. Dialogue instead rides its own `U.push` timer,
  // seeded off this world's own local `r()`, costing no global draw at all.
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses) built
  // the real Whisper Woods (`game.start('new')` then `game.travel(6, 'from-hub')`, waiting out the real
  // transition timer the same way the test does), sampled every NPC's and the squirrel's own position
  // every half second over 90 simulated seconds — long enough for every deer, fox, frog and fairy to
  // clear any one spot several times over — then swept a 2 m grid of the open forest floor (radius
  // 10-55, short of the radius (58) where `forestRegion`'s own fill takes over) against both those
  // samples and all 694 of the wood's physics boxes: (13, 53) came back clear by 10.1 m of the nearest
  // box and 15.7 m of the nearest other soul, east of the stepping-stone path zone (which only spans
  // x -3..3) and well clear of the hollow oak home.
  { const fx = 13, fz = 53, fry = atan2(-fx, -fz);
    const frisbeeWard = makeWardrobe(r, { shirts: [0x6a8a5a, 0x8a6a44, 0x5a6a44], pants: [0x3a4a2e, 0x4a3a28], shoes: [0x3a2a1e, 0x2a2018] });
    const thrower = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: frisbeeWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.2) });
    W.add(thrower.group);
    game.npcs.push(new FrisbeePlayer(game, thrower, r.pick([0x8a6a44, 0x6a8a4a, 0xc9a86a]), { x: fx, z: fz, ry: fry }));
    const frisbeeLines = ['Highest one yet — nearly caught it in the branches.', 'Careful, puss — mind your tail, this one is coming down fast.', "The owls don't seem to mind."];
    let frisbeeCryT = r.range(3, 7);
    U.push((dt) => { frisbeeCryT -= dt; if (frisbeeCryT <= 0) { frisbeeCryT = r.range(8, 14); const c = game.cat.group.position; if (dist2(fx, fz, c.x, c.z) < 400) { game.toast('🥏 "' + r.pick(frisbeeLines) + '"', 2400); SFX.talk(); } } }); }

  // Sunny Shore's tide-pool anemone (round 453) pulls its tentacles in tight when the cat gets close,
  // and this wood's own giant flower (round 442) opens instead — but nobody had ever grown the plant
  // that gave that whole idea its name in the real world. A sensitive plant (Mimosa pudica, the actual
  // "touch-me-not") now stands in a quiet clearing south-east of the hula hoop kid's own patch: four
  // ferny fronds held open and reaching, a tiny pink puffball flower at one tip, until the cat brushes
  // within 2 m — then every frond folds in tight against the short central stem, the whole plant
  // flinching shut, before it spreads back open a few seconds after the cat moves off. Same yaw-hinge
  // trick as the flower's petals and the anemone's tentacles (`makeSensitivePlant()`, next to
  // `makeTidePool()` in `62-props-nature.js`), just a different shape folding a different way, and a
  // new `SFX.rustle()` (`30-audio.js`) rather than either one's own sound, since neither a twinkle nor
  // a wave fit leaves.
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses, driven
  // through `game.travel(6, 'from-hub')` and its own real ~520 ms portal timer) sampled every NPC's and
  // the squirrel's own position every quarter second over 300 simulated seconds, then swept a 1 m grid
  // of the open floor (radius 12-48, short of the radius (58) where forestRegion's own fill takes over,
  // and clear of the stepping-stone path, the fairy-ring circle and the glowing pond's own keep-out):
  // (15, -42) came back clear by 7.1 m of the nearest box and 9.2 m of the nearest other soul, with
  // ground height varying only 0.06 m across the whole footprint. No physics box of its own: a low
  // ground plant the cat walks straight over, same reasoning as the glowing pond and the tide pool.
  { const spx = 15, spz = -42, spy0 = P.ground0(spx, spz);
    const plant = makeSensitivePlant(r);
    const plantLines = ['🌿 "Watch — brush past it and the whole thing folds up tight."', '🌿 "Touch-me-not, they used to call these. Not far wrong."', '🌿 "Give it a minute once you step back — it opens right back out."'];
    let spread = 1, spNear = false;
    plant.group.userData.update = (dt, t) => {
      const c = game.cat.group.position, isNear = dist2(c.x, c.z, spx, spz) < 4;
      spread = damp(spread, isNear ? 0 : 1, 6, dt);
      for (const f of plant.fronds) f.hinge.rotation.x = 0.05 + spread * (f.spread - 0.05);
      if (isNear && !spNear) { spNear = true; SFX.rustle(); game.toast(rnd.pick(plantLines), 3000);
        game.fx.emit(spx, spy0 + 0.3, spz, { count: 8, colors: [0x6fae4a, 0x8ac96a, 0xff8fc8], speed: 0.6, up: 0.6, life: 0.6, gravity: 1.4 }); }
      if (!isNear) spNear = false;
    };
    placeT(game, U, plant.group, spx, spz, r() * TAU); }

  // Victorian, Robot City, Sunny Shore, Candy Land, the Neighborhood and Frosty Peak have all had
  // something cross their own sky the last six rounds running — a hot air balloon, an airship, two
  // biplanes, a tumbling gumball, a flock of migrating geese — and Whisper Woods was the one world
  // left out, its own canopy the obvious reason nobody had tried (same reasoning the kite flyer's own
  // build note gave two dozen rounds back). **Three hawks now wheel in slow, lazy circles high above
  // the whole canopy**, 42-48 m up, soaring on flat wings rather than flapping. Purely decorative:
  // nothing to greet, nothing to reach, no dialogue and no new sound.
  //
  // No new controller, no physics box of its own. The tallest thing anywhere on this world's own
  // ground is a big tree's own canopy top (`makeBigTree`'s outer leaf sphere sits at `h + 1.4` with a
  // 2.8 m radius, h up to 10 m for the scattered giants — about 14.2 m at the very tallest; the fixed
  // treehouse tree, h = 9, tops out lower still at 13.2 m). Flying at 42 m or above clears that by a
  // comfortable 28 m margin anywhere on the ground, so it needs no keep-out check against `game.zones`
  // or any of this world's physics boxes. Each hawk's own circle sits at a different radius (60-84 m)
  // and height (42-47 m), all comfortably inside the 196 m play limit and nowhere near the 275 m+ ring
  // where this world's own horizon starts raising real mountains (`clear * r.range(1.35, 1.8)`, clear
  // = 204 here).
  //
  // Reuses the same stretched-sphere body every other bird in this file already builds on, with a
  // two-bone wing held mostly flat in a soaring glide — a slow body-roll bank is the only constant wing
  // motion, plus an occasional short flap when a hawk crosses its own circle's windward side. Red-tail
  // colouring: rust-brown back and wings, a cream belly, a dark banded tail. Three birds on three
  // independent circles, same direction so the facing math stays the simple `-a` the geese already use,
  // each at its own radius, height, speed and starting phase drawn once off this world's own local
  // `r()`, so it costs no later mushroom hue or butterfly colour pick.
  //
  // Drifts entirely on the world clock `t` beyond that one draw per hawk, so it costs nothing more —
  // placed last of everything this build adds, after the frisbee thrower, so even those draws disturb
  // nothing built earlier in these woods.
  { const makeHawk = (phase) => {
      const g = new THREE.Group(), rig = { group: g, wings: [] };
      const back = mat(0x6b4028, { roughness: 0.85 }), belly = mat(0xe8dcc0, { roughness: 0.8 }), tailM = mat(0xb5793a, { roughness: 0.8 }), dark = mat(0x241c14, { roughness: 0.6 });
      const body = group(0, 0, 0, g); rig.body = body;
      mesh(G.bodySphere(14, 10), back, { sx: 0.1, sy: 0.1, sz: 0.3, parent: body });
      mesh(G.sphere(0.08, 10, 8), belly, { y: -0.03, sy: 0.7, sz: 1.5, shadow: 'none', parent: body });
      const head = group(0, 0.02, 0.17, body);
      mesh(G.sphere(0.045, 10, 8), back, { parent: head });
      mesh(G.cone(0.016, 0.05, 6), dark, { y: -0.005, z: 0.05, rx: PI / 2, shadow: 'none', parent: head });
      mesh(G.box(0.1, 0.03, 0.14), tailM, { z: -0.19, rx: 0.05, shadow: 'none', parent: body });
      for (const side of [1, -1]) {
        const w = group(side * 0.06, 0.02, 0, body);
        mesh(G.box(0.46, 0.02, 0.2), back, { x: side * 0.23, parent: w });
        const tipW = group(side * 0.46, 0, 0, w); mesh(G.box(0.3, 0.018, 0.16), dark, { x: side * 0.14, parent: tipW });
        rig.wings.push({ w, tipW, side });
      }
      rig.animate = (dt, t) => {
        const flap = sin(t * 0.5 + phase * 1.7) > 0.86 ? sin(t * 6 + phase) * 0.32 : 0;
        for (const Wg of rig.wings) { Wg.w.rotation.z = Wg.side * (-0.07 + flap); Wg.tipW.rotation.z = Wg.side * -0.05; }
        body.rotation.z = sin(t * 0.3 + phase) * 0.22;
      };
      bakeRig(g);
      return rig;
    };
    const hawkDefs = [[68, 44, 0.9], [84, 47, 0.68], [60, 42, 1.08]];
    for (const [rad, h, speedMul] of hawkDefs) {
      const phase = r() * TAU, speed = (TAU / 300) * speedMul, hawk = makeHawk(r() * TAU), hg = hawk.group;
      hg.userData.update = (dt, t) => {
        const a = phase + t * speed;
        hg.position.set(cos(a) * rad, h + sin(t * 0.19 + phase) * 1.6, sin(a) * rad);
        hg.rotation.y = -a;
        hawk.animate(dt, t);
      };
      place(game, U, hg, cos(phase) * rad, sin(phase) * rad, 0, h);
    } }

  // round 508's own list of playground games this whole game had never tried (tetherball, badminton,
  // tug-of-war, archery, sack races) is down to its last entry now — round 520 gave Frosty Peak a
  // tug-of-war, round 521 the Neighborhood a tetherball pole, round 522 Victorian a badminton net, and
  // **this one gives Whisper Woods its own archery range**: a lone archer at a firing line of open
  // ground north of the glade, drawing a longbow and loosing one arrow at a straw target downrange,
  // never pausing to go fetch it back.
  //
  // New `Archer` controller (`55-npcs.js`, right after `Badminton`, its nearest relative among this
  // run's own playground games) and a new `o.bow` hand prop for `makeHuman` — a grip and two tapering
  // limbs strung with a straight cylinder, the same spot on the body `axe`, `pole` and `brush` already
  // use, just on the off hand rather than the side those swing from, since a bow is held steady, not
  // swung. Unlike every earlier toss or rally game here, there is no second player: the arrow is its
  // own free mesh, the same trick Horseshoes' shoe and Badminton's shuttle already use, carried at the
  // bow hand while nocked, loosed on a short, shallow-arced flight, then left standing in the target a
  // couple of seconds before the next one is drawn. `arrow.lookAt()` keeps its own head pointed exactly
  // where it is actually travelling — nocked, in flight and stuck alike — rather than the fixed flutter
  // the shuttlecock settles for.
  //
  // The target is new too: a round straw boss painted in flat rings (white, black, blue, red, gold, the
  // same scheme a real target face uses) on a pair of crossed legs, one physics box over the boss
  // standing in for both.
  //
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses, `game.start('new')` then
  // `game.load(6, 'from-hub')`) swept the firing line and the ten metres downrange to the target
  // against every one of the wood's physics boxes and found it clear by 3.3 m or more along its whole
  // length; every wandering deer's and fox's own leash falls short of the spot by 5.7 m or more (the
  // nearest, the fox denned at (14, 6), by its own 10 m leash alone), the nearest collectible (the
  // mouse at (-30, 26)) sits 14.3 m off, and the treehouse (-18, 14) 10.2 m off.
  { const ax = -16, az = 24, ary = 0, adist = 10;
    const tx = ax + sin(ary) * adist, tz = az + cos(ary) * adist, ty0 = P.ground0(tx, tz);
    const target = group(tx, ty0, tz, W);
    mesh(G.cyl(0.46, 0.46, 0.22, 16), mat(0xd9c28a, { roughness: 0.95 }), { y: 1.0, rx: PI / 2, parent: target });   // the straw boss
    const ringSpecs = [[0.42, 0xf3f0e6], [0.33, 0x1c1c1c], [0.24, 0x2d6fd6], [0.15, 0xd62839], [0.065, 0xf2c744]];
    ringSpecs.forEach(([rad, c], i) => mesh(G.cyl(rad, rad, 0.02, 20), mat(c, { roughness: 0.7 }), { y: 1.0, z: 0.1 + i * 0.004, rx: PI / 2, shadow: 'none', parent: target }));
    const standM = mat(0x5b3d24, { roughness: 1 });
    for (const s of [1, -1]) mesh(G.cyl(0.02, 0.025, 1.0, 6), standM, { x: s * 0.36, y: 0.55, z: -0.2, rx: 0.3, rz: s * 0.22, parent: target });
    game.physics.addBox(tx, ty0 + 1.0, tz, 0.95, 1.0, 0.3, { cam: false });
    const bowWard = makeWardrobe(r, { shirts: [0x4a6a3a], pants: [0x3a3327, 0x2a2a24], shoes: [0x3a2a1e, 0x2a2018] });
    const archer = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.25), wardrobe: bowWard }),
      hat: 'cap', hatColor: 0x3a4a2e, jacket: null, scarf: null, bag: null, backpack: null, glasses: false, bow: true });
    W.add(archer.group);
    const arrow = group(0, 0, 0, W);
    mesh(G.cyl(0.012, 0.012, 0.62, 6), mat(0x8a6a3a, { roughness: 0.8 }), { rx: PI / 2, parent: arrow });   // shaft
    mesh(G.cone(0.022, 0.08, 6), mat(0x9aa3ad, { metalness: 0.6, roughness: 0.35 }), { z: -0.35, rx: -PI / 2, parent: arrow });   // head, at local -Z so lookAt() faces it forward
    const fletchM = mat(0xd62839, { roughness: 0.9 });
    for (let fi = 0; fi < 3; fi++) mesh(G.box(0.1, 0.002, 0.05), fletchM, { z: 0.26, rz: fi / 3 * TAU, shadow: 'none', parent: arrow });   // tail fletching
    game.npcs.push(new Archer(game, archer, arrow, { x: ax, z: az, ry: ary, dist: adist })); }

  // round 520's own round-up of five playground games this whole game had never tried (tetherball,
  // badminton, tug-of-war, archery, sack races) left Whisper Woods with the archery range just above;
  // Frosty Peak's haulers (round 520) and Robot City's factory pair (round 529) have since both
  // pitted two rigs against a rope or cable of their own (`TugOfWar`, 55-npcs.js), but no two souls in
  // these woods had ever heaved against each other. **Two forest kids now dig their heels into the
  // leaf litter and haul on a thick, knotted vine stretched between them**, well south of the glade.
  // *"Heave! Heave! Nobody's budging!"* *"Careful, puss — mind the vine, it's tougher than it looks."*
  // *"Best of... however many we've lost count of."*
  //
  // No new class: the same heave-together, nobody-wins `TugOfWar` the haulers and the factory pair
  // already use, just two plain `makeHuman()` kids and a vine (a mossy-green cylinder with a few leaf
  // tufts, `noInk()`'d like every other thin cable in this game) in place of rope or cable, plus a
  // small drifting glow riding the vine's own tension instead of a flag or indicator lamp — this
  // glade already has fireflies of its own ambient sparkle, so a single `glowMat()` bead reads as one
  // of them rather than a new fixture.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` then `game.travel(6, 'from-hub')`, with the cat teleported right next to the
  // candidate spot so nothing the engine culls by distance could hide anything) sampled every NPC's
  // own position every frame over 4000 simulated frames (66 seconds, long enough for every deer and
  // fox's own wander to range fully), then swept the two kids' own stations and the vine's own
  // midpoint against both those samples and every one of the wood's 323 physics boxes: (-10, -40)
  // came back clear by 14.9 m of the nearest box and 14.1 m of the nearest other soul (a wandering
  // yo-yo kid) — well south of the jump-roper's own clearing at (8, -48) and short of the radius (58)
  // where forestRegion's own procedural fill takes over.
  { const vineWard = makeWardrobe(r, { shirts: [0xff8a3d, 0x6fa8ff], pants: [0x3a3327, 0x2a2a24], shoes: [0x3a2a1e, 0x2a2018] });
    const haulerA = makeHuman({ ...randomPerson(r, { female: false, child: true, wardrobe: vineWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    const haulerB = makeHuman({ ...randomPerson(r, { female: true, child: true, wardrobe: vineWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(haulerA.group); W.add(haulerB.group);
    const tug = new TugOfWar(game, haulerA, haulerB, { x: -10, z: -40, ry: 0, gap: 2.6,
      cries: ["Heave! Heave! Nobody's budging!", "Careful, puss — mind the vine, it's tougher than it looks.", "Best of... however many we've lost count of."] });
    game.npcs.push(tug);
    const [A, B] = tug.ctls, vineM = mat(0x4a6a2e, { roughness: 0.95 }), leafM = mat(0x5a8a3a, { roughness: 0.9 });
    const ay = P.ground0(A.x, A.z) + 0.75, by = P.ground0(B.x, B.z) + 0.75;
    const vineGroup = group((A.x + B.x) / 2, (ay + by) / 2, (A.z + B.z) / 2, W);
    vineGroup.lookAt(B.x, by, B.z);
    noInk(mesh(G.cyl(0.05, 0.05, Math.hypot(B.x - A.x, by - ay, B.z - A.z), 10), vineM, { rx: PI / 2, parent: vineGroup }));
    for (const s of [-0.7, 0, 0.7]) mesh(G.sphere(0.07, 6, 5), leafM, { z: s, x: 0.08, rz: 0.4, shadow: 'none', parent: vineGroup });
    const glow = mesh(G.sphere(0.045, 8, 6), glowMat(0xa8ff9a, 1.2), { parent: W });
    U.push(() => { const frac = 0.5 + clamp(tug.tension, -1, 1) * 0.14;
      glow.position.set(lerp(A.x, B.x, frac), lerp(ay, by, frac) + 0.08, lerp(A.z, B.z, frac));
      glow.material.emissiveIntensity = 1.0 + abs(tug.tension) * 1.5; }); }

  // The Neighborhood, Candy Land, Robot City, Victorian, Sunny Shore and Frosty Peak have all had a
  // tetherball pole since round 508's own list of playground games (tetherball, badminton, tug-of-war,
  // archery, sack races) went round every world in turn — Whisper Woods got its own archery range and
  // tug-of-war out of that same list, but never the one game played standing still, swinging a ball on
  // a rope round and round a post. **Two forest kids now keep a rally going on open ground east of the
  // glade**, well clear of every mushroom, the tug-of-war and the jump-roper's own clearing.
  // *"Round and round — same as every other game in these woods, just leafier."* *"Mind the rope,
  // puss — it doesn't care whose tail is in the way."* *"I'm up to twenty wraps. No, I lost count
  // again."*
  //
  // No new class and no new mesh: the exact same `Tetherball` (`55-npcs.js`) the other six worlds
  // already use, unchanged — it already asks `game.physics.ground0()` for its own pole, ball and each
  // player's footing every frame, so the gentle slope out here costs nothing extra. Two plain
  // `makeHuman()` kids, the same way Robot City's workers and Candy Land's own pair are built, since
  // this world has no single child helper every kid already comes from the way Frosty Peak's `kid()`
  // or the beach's `beachPerson()` do.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` then `game.travel(6, 'from-hub')`) sampled every NPC's own position every 7th
  // frame over 2400 simulated frames, then swept a grid of the open woodland floor (radius 12-56, short
  // of the radius (58) where `forestRegion`'s own procedural fill takes over) against both those
  // samples and every one of the wood's 323 physics boxes: (41, -27) came back clear by 18.3 m at its
  // tightest point — east of every hand-placed mushroom, well short of the tug-of-war vine at (-10,
  // -40) and the jump-roper's own clearing at (8, -48), and inside the radius where the fill takes over.
  { const tA = makeHuman({ ...randomPerson(r, { female: false, child: true }), shirt: 0xd4823a, pants: 0x3a4a3a, shoes: 0x3a2a1e, hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    const tB = makeHuman({ ...randomPerson(r, { female: true, child: true }), shirt: 0x5ac4a0, pants: 0x3a4a3a, shoes: 0x3a2a1e, hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(tA.group); W.add(tB.group);
    game.npcs.push(new Tetherball(game, tA, tB, { x: 41, z: -27,
      cries: ['Round and round — same as every other game in these woods, just leafier.', "Mind the rope, puss — it doesn't care whose tail is in the way.", "I'm up to twenty wraps. No, I lost count again."] })); }

  // The Neighborhood, Candy Land, Robot City, Victorian, Sunny Shore and Frosty Peak have all had a
  // badminton net since round 508's own list of playground games (tetherball, badminton, tug-of-war,
  // archery, sack races) went round every world in turn — Whisper Woods picked up an archery range, a
  // tug-of-war and the tetherball pole above out of that same list, but never the one racket game
  // played standing still, swinging a shuttlecock back and forth over a net. **Two forest-dwellers now
  // keep a rally going on a quiet patch of open ground north-east of the hollow oak**, well clear of
  // the frisbee player and the tetherball pole. *"Shuttlecock's stuffed with real feathers — found
  // half of them already, mind."* *"Mind the net, puss — brambles have nothing on it."* *"Forty-one...
  // forty-two. The owls are judging us, I'm sure."*
  //
  // No new class and no new mesh: the exact same `Badminton` (`55-npcs.js`) and `makeVolleyballNet`
  // (`62-props-nature.js`) the other six worlds already use, with `placeT`/`boxT` in place of a flat
  // floor's `place`/`P.addBox` the same way every other hand-placed prop in these woods already
  // accounts for the terrain, and a fresh woodland wardrobe (earthy shirts, no hats, bags or jackets)
  // in place of a town's muted colours or the beach's bright ones.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` then `game.travel(6, 'from-hub')`, waited out on the real portal-fade timer
  // rather than assumed) sampled every live physics circle — every NPC's and the squirrel's own
  // current position, not just its home spot, which also catches the tetherball and tug-of-war pairs
  // this probe method had missed before — every 3rd frame over 3600 simulated frames (60 s, long
  // enough for every leashed deer, fox and hare to range fully), then swept a grid of the open
  // woodland floor (radius 15-50, short of the radius (58) where `forestRegion`'s own fill takes over)
  // against both those samples and every one of the wood's 682 physics boxes: (9, 47) came back clear
  // by 6.70 m of the nearest box and 6.86 m of the nearest other soul (the frisbee player at (13, 53))
  // at its tightest point, with the ground flat to 0.14 m across the whole footprint — south-east of
  // the hollow oak itself (0, 50) and its own path (the `zones.addSpan` strip runs -3..3 in x, clear by
  // 6 m), and short of the fill radius.
  //
  // Built right after the tetherball pole, the last thing this world adds before the squirrel spawn
  // point, so `makeHuman()`'s own three unconditional draws off the shared `rnd()` sequence land after
  // every other timing-sensitive pick in this wood and disturb nothing built earlier.
  { const cx = 9, cz = 47, gap = 5.6, halfW = 1.8;
    const net = makeVolleyballNet(halfW, 0x8a7050, { postH: 1.6, netH: 0.78 });
    placeT(game, U, net, cx, cz, 0);
    for (const sx of [-halfW, halfW]) boxT(game, cx + sx, cz, 0.16, 1.6, 0.16, { cam: false });
    // the shuttlecock: a pale cork and a flared cone standing in for the feathers, nose staying down
    const shuttle = group(cx, 0, cz, W);
    mesh(G.sphere(0.045, 10, 8), mat(0xf0ead6, { roughness: 0.6 }), { y: 0, parent: shuttle });
    mesh(G.cone(0.075, 0.16, 10), mat(0xfbfaf4, { roughness: 0.8 }), { y: 0.11, rx: PI, parent: shuttle });
    const bmWard = makeWardrobe(r, { shirts: [0x6a8a4a, 0x8a6a3a, 0x4a6a6a], pants: [0x3a3327, 0x2a2a24], shoes: [0x3a2a1e, 0x2a2018] });
    const bA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: bmWard }),
      hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: r.chance(0.3), racket: true });
    const bB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: bmWard }),
      hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: r.chance(0.3), racket: true });
    W.add(bA.group); W.add(bB.group);
    const badmintonLines = ['🏸 "Shuttlecock\'s stuffed with real feathers — found half of them already, mind."', '🏸 "Mind the net, puss — brambles have nothing on it."', '🏸 "Forty-one... forty-two. The owls are judging us, I\'m sure."'];
    game.npcs.push(new Badminton(game, bA, bB, shuttle, { cx, cz, gap, cries: badmintonLines })); }

  // `SackRace`'s own tour of the seven worlds closes out here — the Neighborhood, Candy Land, Robot
  // City, Victorian, Sunny Shore and Frosty Peak all have one by now; Whisper Woods, for all its
  // archery range, tug-of-war, tetherball pole and badminton net, never had the one race run two hops
  // at a time with both ankles tied together. **Two forest kids now hop a short lane on a quiet, open
  // stretch of woodland floor well south of the glade**, past the tug-of-war's own clearing, feet
  // bound ankle to waist in borrowed burlap sacks. *"Mushrooms are softer to land on than this packed
  // dirt, I'll tell you that."* *"Mind your tail, puss, I can't steer in this thing."* *"Best of
  // three. I'm blaming a root if I lose."*
  //
  // No new class and no new mesh: the exact same `SackRace` (`55-npcs.js`) and `makeHuman`'s own
  // `o.sack` option the other six worlds already use. It calls `game.physics.ground0()` for each
  // racer's own footing every frame, the same way this wood's tug-of-war, tetherball and badminton
  // already handle the real slope underfoot, so nothing extra was needed for terrain.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.travel(6, 'from-hub')` then 3600 simulated frames, every NPC's and the squirrel's own
  // position sampled every 10th frame) swept a grid of the open woodland floor (radius 12-55, short
  // of the radius (58) where `forestRegion`'s own fill takes over, both lane orientations) against
  // both those samples and every one of the wood's 720 physics boxes, then refined around the
  // clearest patch found: (-8, -50), lane running along world X (`ry = PI/2`), came back clearest at
  // 5.8 m from the nearest box and 8.1 m from the nearest other soul (the tug-of-war haulers at
  // (-10, -40)) at its tightest point, with the ground sloping about 0.35 m across the whole 5 m
  // lane — short of the fill radius and well clear of the jump-roper's own clearing (8, -48) and the
  // horseshoes pitch (-46, -30).
  //
  // Built dead last, right after the badminton net, for the same reason every other addition at the
  // end of this function already gives: `makeHuman()` draws three values off the shared `rnd()`
  // sequence unconditionally, and a fresh pair of rigs built any earlier in this wood would shift
  // that sequence and desync every other timing-sensitive pick already placed above.
  { const rx = -8, rz = -50, rry = Math.PI / 2;
    const sackWard = makeWardrobe(r, { shirts: [0x4a8a6a, 0x8a4a6a, 0x6a7a44], pants: [0x3a3327, 0x2a2a24], shoes: [0x3a2a1e, 0x2a2018] });
    const sackA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, elder: false, wardrobe: sackWard }),
      sack: 0xa8946a, hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    const sackB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, elder: false, wardrobe: sackWard }),
      sack: 0xa8946a, hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(sackA.group); W.add(sackB.group);
    game.npcs.push(new SackRace(game, sackA, sackB, { x: rx, z: rz, ry: rry,
      cries: ["Mushrooms are softer to land on than this packed dirt, I'll tell you that.", "Mind your tail, puss, I can't steer in this thing.", "Best of three. I'm blaming a root if I lose."] })); }

  // `PogoHopper`'s own tour of the seven worlds was down to its last stop after round 561 — the
  // Neighborhood, Candy Land, Robot City, Frosty Peak, Sunny Shore and Victorian all have one; Whisper
  // Woods, for all its archery range, tug-of-war, tetherball pole, badminton net and sack race, never
  // had the one game played standing still and bouncing in place. **A forest kid now bounces on a pogo
  // stick on a quiet stretch of open woodland floor west of the hollow oak's own path**, well past
  // every other hand-placed spot in these woods. *"Boing! Boing! Boing!"* *"Mind the roots when I come
  // down, puss, I'm not steering this thing."* *"Nine hundred and something. Lost count somewhere past
  // the owls."*
  //
  // No new class and no new mesh: the exact same `PogoHopper` (`55-npcs.js`) the other six worlds
  // already use, unchanged — it asks `game.physics.ground0()` for its own footing every frame, so the
  // gentle woodland floor out here costs nothing extra, the same way the tug-of-war, tetherball,
  // badminton and sack race already handle it. A plain `makeHuman()` kid, since this wood has no single
  // child helper every kid already comes from the way Frosty Peak's `kid()` or the beach's
  // `beachPerson()` do (the same reason the tetherball and badminton pairs above are built the same way).
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses, the
  // real wood built with `game.start('new')` then `game.travel(6, 'from-hub')`, 3600 simulated frames to
  // let every wandering deer, fox and hare range fully) sampled every NPC's and the squirrel's own
  // position every 10th frame, then swept a grid of the open woodland floor (radius 20-55, short of the
  // radius (58) where `forestRegion`'s own fill takes over, and clear of the glowing pond's and the
  // glade's own zones and the stepping-stone path) against both those samples and every one of the
  // wood's 692 physics boxes: (-47, 28) came back clearest, 8.9 m from the nearest box and 14 m from the
  // nearest other soul, at radius 54.7 — west of the hollow oak's own path, with the ground flat to
  // 0.04 m across the whole footprint.
  //
  // Built dead last, right after the sack race, for the same reason every other addition at the end of
  // this function already gives: `makeHuman()` draws three values off the shared `rnd()` sequence
  // unconditionally, and a fresh rig built any earlier in this wood would shift that sequence and
  // desync every other timing-sensitive pick already placed above.
  { const pogoWard = makeWardrobe(r, { shirts: [0xff8a3d, 0x3fae9a, 0xf2c744], pants: [0x3a3327, 0x2a2a24], shoes: [0x3a2a1e, 0x2a2018] });
    const pogoKid = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, elder: false, wardrobe: pogoWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(pogoKid.group);
    game.npcs.push(new PogoHopper(game, pogoKid, r.pick([0xff6f3c, 0x3fae9a, 0xf2c744]), { x: -47, z: 28, ry: r.range(0, TAU),
      cries: ['Boing! Boing! Boing!', "Mind the roots when I come down, puss, I'm not steering this thing.", "Nine hundred and something. Lost count somewhere past the owls."] })); }

  const sq = new Squirrel(game, -14, 20, 'sq-forest'); game.squirrels.push(sq);
  game.addInteractable({ obj: pond, radius: 3.2, label: () => 'Drink from the glowing pond', onUse: () => { SFX.twinkle(); game.fx.emit(game.cat.group.position.x, game.cat.group.position.y + 0.5, game.cat.group.position.z, { count: 30, colors: [0x2ad0d0, 0xa8ff9a, 0xffffff], speed: 1.5, up: 2, life: 1.2, gravity: 1 }); game.toast('✨ Sparkly! The cat feels magical.'); } });

  game.zones.addSpan(-3, 26, 3, 52); game.zones.addCircle(8, -6, 7); game.zones.addCircle(0, 0, 18);
  // Victorian, Robot City, Sunny Shore, Candy Land, the Neighborhood and Frosty Peak have all had
  // something cross their own sky by now (a hot air balloon, an airship, two biplanes, a tumbling
  // gumball, a V of geese) — Whisper Woods' own canopy, past the butterflies and the fairies, never had
  // anything fly above it. **A ragged line of five herons now flies a slow, high circuit over the
  // whole wood**, 38 m up on an 85 m orbit. Purely decorative: nothing to greet, nothing to reach, no
  // dialogue and no new sound.
  //
  // No new controller, no physics box of its own: the tallest things in these woods are the big trees
  // (up to 10 m of trunk plus a leaf canopy that tops out around 11.4 m) and the treehouse's own gable
  // (7.9 m) — 38 m clears both with more than 26 m to spare anywhere on the loop. An 85 m orbit also
  // sits well inside the 120 m radius where this wood's own terrain function `T()` first starts
  // raising its own decorative rim (`smoothstep(120, 250, d)` is still exactly 0 at 85 m), so the loop
  // never climbs and needs no keep-out check against `game.zones` or any of this wood's physics boxes.
  //
  // Each heron is a stretched body sphere in slate-grey plumage, a long pale neck craned forward, a
  // dark cap and a long bill, trailing stick legs streamed out behind rather than tucked under (the
  // one silhouette difference from Frosty Peak's geese), built from the same two-bone flapping-wing rig
  // every flyer in this file already uses. Five of them fly in a loose, ragged line behind a lead bird
  // rather than a tight V — herons don't formation-fly the way geese do — each at its own random flap
  // phase drawn off this wood's own local `r()` so the wingbeats never line up, carried as one rigid
  // group round the circuit so the line costs nothing beyond the lead bird's own transform; only the
  // wings animate per bird, called by hand from the flock's own `userData.update` since there is no
  // per-heron controller.
  //
  // Drifts entirely on the world clock `t` (the orbit and a gentle bob keyed off `t` alone) from one
  // fixed starting angle drawn once off this wood's own local `r()`, so it costs no later wardrobe or
  // layout pick — placed last of everything hand-built in this wood, right before `forestRegion` takes
  // over the fill, so even that one draw disturbs nothing built earlier.
  { const makeHeron = (phase) => {
      const g = new THREE.Group(), rig = { group: g, wings: [] };
      const coat = mat(0x6a7684, { roughness: 0.85 }), pale = mat(0xd8d4c4, { roughness: 0.8 }), dark = mat(0x2a2e34, { roughness: 0.6 }), beakM = mat(0xd9a93a, { roughness: 0.5 }), legM = mat(0x8a7a52, { roughness: 0.7 });
      const body = group(0, 0, 0, g); rig.body = body;
      mesh(G.bodySphere(14, 10), coat, { sx: 0.11, sy: 0.11, sz: 0.4, parent: body });
      const neck = group(0, 0.07, 0.24, body); neck.rotation.x = -0.9;
      mesh(G.capsule(0.03, 0.22, 6), pale, { y: 0.12, rx: PI / 2, parent: neck });
      const head = group(0, 0.26, -0.02, neck); head.rotation.x = 1.1;
      mesh(G.sphere(0.045, 10, 8), dark, { parent: head });
      mesh(G.cone(0.016, 0.1, 6), beakM, { y: 0, z: 0.08, rx: PI / 2, shadow: 'none', parent: head });
      mesh(G.box(0.07, 0.018, 0.12), dark, { y: -0.01, z: -0.18, rx: 0.1, shadow: 'none', parent: body });   // tail
      for (const side of [1, -1]) {
        const w = group(side * 0.08, 0.03, 0.02, body);
        mesh(G.box(0.42, 0.022, 0.18), coat, { x: side * 0.21, parent: w });
        const tipW = group(side * 0.42, 0, 0, w); mesh(G.box(0.34, 0.02, 0.14), dark, { x: side * 0.15, parent: tipW });
        rig.wings.push({ w, tipW, side });
      }
      for (const side of [1, -1]) mesh(G.cyl(0.01, 0.015, 0.5, 5), legM, { x: side * 0.03, y: -0.02, z: -0.3, rx: PI / 2 - 0.15, shadow: 'none', parent: body });   // trailing legs, streamed out behind
      rig.animate = (ph, moving, dt, t = 0) => {
        const flap = sin(t * 4 + phase), glide = (sin(t * 0.18 + phase) > 0.4) ? 1 : 0;
        for (const Wg of rig.wings) { const a = glide ? 0.18 : flap * 0.6; Wg.w.rotation.z = Wg.side * -a; Wg.tipW.rotation.z = Wg.side * -a * 0.8; }
        body.rotation.z = sin(t * 0.5 + phase) * 0.07;
      };
      bakeRig(g);
      return rig;
    };
    const lineOffsets = [[0, 0, 0], [-0.9, -0.05, -1.1], [1.3, -0.1, -2.0], [-1.8, -0.16, -3.3], [0.6, -0.22, -4.4]];
    const heronR = 85, heronH = 38, heronSpeed = TAU / 230, heronPhase = r() * TAU;
    const flock = group(0, 0, 0);
    const herons = lineOffsets.map(([ox, oy, oz]) => { const heron = makeHeron(r() * TAU); heron.group.position.set(ox, oy, oz); flock.add(heron.group); return heron; });
    flock.userData.update = (dt, t) => {
      const a = heronPhase + t * heronSpeed;
      flock.position.set(cos(a) * heronR, heronH + sin(t * 0.15) * 2.5, sin(a) * heronR);
      flock.rotation.y = -a;
      for (const heron of herons) heron.animate(0, true, dt, t);
    };
    place(game, U, flock, cos(heronPhase) * heronR, sin(heronPhase) * heronR, 0, heronH); }

  // the Neighborhood and Candy Land both have a piñata post by now (`PinataSwinger`/`makePinata`,
  // round ~508 and ~564) and the other five worlds never got one — Whisper Woods, with its fairy ring
  // and glowing pond, is as good a spot for somebody's woodland birthday as any of them. **A post
  // stands on a quiet stretch of open floor south-west of the glade**, a forest kid taking a swing at
  // a piñata done out in toadstool red with a spray of woodland colours instead of either street's own
  // palette. *"One more go — I nearly had it that time!"* *"Watch the swing room, puss, this stick's
  // longer than it looks."* *"If it's full of acorns again I'm trading with the squirrel."*
  //
  // No new class and no new mesh: the exact same `PinataSwinger` (`55-npcs.js`) and `makePinata`
  // (`60-props.js`) the other two worlds already use — just a fresh post, a fresh kid, and this wood's
  // own colours standing in for the street parties' pastel and balloon ones.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses, the
  // real wood built with `game.start('new')` then `game.travel(6, 'from-hub')`, 3600 simulated frames
  // to let every wandering deer, fox and hare range fully) sampled every NPC's and the squirrel's own
  // position every 10th frame, then swept a grid of the open woodland floor (radius 20-56) against
  // both those samples, every one of the wood's 326 physics boxes, and `game.zones` itself: (-28, -22)
  // came back clear by 12.4 m of the nearest box and 15.4 m of the nearest other soul, with the ground
  // flat to the metre across the whole footprint — well south-west of the glade, the tug-of-war clearing
  // and both sack-race lanes.
  //
  // Built dead last, right after the herons, for the same reason every other addition at the end of
  // this function already gives: `makeHuman()` draws three values off the shared `rnd()` sequence
  // unconditionally, and a fresh rig built any earlier in this wood would shift that sequence and
  // desync every other timing-sensitive pick already placed above. Unlike the Neighborhood's own
  // second piñata, this one keeps its `cries`: Whisper Woods' build runs exactly once in the whole
  // test (`game.travel(6, ...)` is never revisited), so the one extra `rnd.range()` draw its lines cost
  // at construction has nothing built afterward left to desync — confirmed by running the full suite
  // with the lines in place rather than dropping them pre-emptively.
  { const px = -28, pz = -22, postH = 2.2, outer = 0.4, ropeLen = 0.45;
    const FOREST_FRINGE = [0xf2c744, 0xffffff, 0x8a5acf, 0x5ac8e0, 0xa8ff9a];
    const postM = mat(0x8a5a32, { roughness: 0.9 });
    const standG = group(px, 0, pz, W);
    mesh(G.cyl(0.07, 0.09, postH, 8), postM, { y: postH / 2, parent: standG });
    const pivot = group(0, postH, 0, standG);
    mesh(G.cyl(0.012, 0.012, ropeLen, 5), mat(0xe8d9a0, { roughness: 0.9 }), { y: -ropeLen / 2, parent: pivot });
    const pinata = makePinata(0xd6453f, FOREST_FRINGE);
    pinata.position.y = -(ropeLen + outer); pivot.add(pinata);
    P.addBox(px, postH / 2, pz, 0.35, postH, 0.35, { cam: false });
    let lt = 0;
    standG.userData.update = (dt) => {
      lt += dt;
      const cyc = 2.6, ph = (lt % cyc) / cyc, sinceHit = ph < 0.65 ? (ph + 0.35) * cyc : (ph - 0.65) * cyc;
      pivot.rotation.z = sin(lt * 0.5) * 0.04 + Math.exp(-sinceHit * 2.6) * 0.3;
      pivot.rotation.x = sin(lt * 0.4 + 1) * 0.025;
    };
    U.push(standG.userData.update);
    const sx = px, sz = pz + 1.3, sry = atan2(px - sx, pz - sz);
    const pWard = makeWardrobe(r, { shirts: [0x5ac8e0, 0xffd54a, 0xa8ff9a], pants: [0x3a3327, 0x2a2a24], shoes: [0x3a2a1e, 0x2a2018] });
    const guest = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, elder: false, wardrobe: pWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null });
    W.add(guest.group);
    game.npcs.push(new PinataSwinger(game, guest, 0xc9a86a, { x: sx, z: sz, ry: sry,
      cries: ["One more go — I nearly had it that time!", "Watch the swing room, puss, this stick's longer than it looks.", "If it's full of acorns again I'm trading with the squirrel."] })); }

  // `Marchers` (55-npcs.js: a Patroller lead with followers trailing a fixed gap, wheeling back and
  // forth) has reached gingerbread men, robots, soldiers, penguins and crabs by now — every world
  // except this one. Whisper Woods has hedgehogs already (`makeHedgehog`, 56-npcs-wild.js, used once
  // already for the one living in the eastern hollow log), so three more now drill in a tight column
  // on a quiet stretch of floor west of everything else hand-built here, same trundling walk cycle
  // `makeQuadruped`'s own `rig.animate` already drives for the wandering ones. *"Column of three.
  // Spines in, soldier."* *"Hup, two — hup, two — mind the toadstools, Nigel."* *"Drilling's much
  // harder when your legs are this short, puss."*
  //
  // No new class and no new rig: the exact same `Marchers` and `makeHedgehog` the rest of this file
  // and the other five marching worlds already use, unchanged.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses, the
  // real wood built with `game.start('new')` then `game.travel(6, 'from-hub')` — waiting out the
  // portal's own real-timer fade rather than assuming it's instant, the same trap a first pass at this
  // probe fell into — then 1800 simulated frames to let every wandering deer, fox and hare range fully,
  // sampled every NPC's and the squirrel's own position every 10th frame over another 1800) swept a
  // grid of the open woodland floor (radius 15-56, short of the radius (58) where `forestRegion`'s own
  // fill takes over) against both those samples and every one of the wood's 415 physics boxes, scoring
  // each candidate by its tightest clearance along a short march line from the point. The 2 m line from
  // (-53, -14) to (-53, -16) came back clearest of the low-radius set: 8.4 m of headroom at the tightest
  // sampled point, at radius 54.8-55.4 — west of the piñata post, the fairy ring and every wandering
  // deer and fox, with the ground sloping gently (0.86 to 0.97 m) rather than flat, nowhere steep enough
  // to trip the march.
  //
  // Like the wandering foxes, deer and hares already in these woods, a quadruped rig has no
  // `rig.look`/`robot`/`cookie`, so `greetable()` is a no-op on it (confirmed by Sunny Shore's own
  // marching crabs) — pure ambient wildlife, no new friend, no effect on this wood's friend count or
  // collectible count.
  //
  // Built dead last, right before `forestRegion` takes over the fill, for the usual reason:
  // `Patroller`'s own three unconditional draws off the shared `rnd()` sequence (phase, idle clock, cry
  // timer) land after every other timed NPC in this wood and disturb no earlier wardrobe or layout pick.
  { const marchers = [0, 1, 2].map(() => { const rig = makeHedgehog(); W.add(rig.group); return rig; });
    game.npcs.push(new Marchers(game, marchers, { points: [[-53, -14], [-53, -16]], speed: 0.45, pause: [1, 2], r: 0.18, height: 0.3, gap: 0.4,
      cries: ['Column of three. Spines in, soldier.', 'Hup, two — hup, two — mind the toadstools, Nigel.', "Drilling's much harder when your legs are this short, puss."], cryIcon: '🦔' })); }

  // Sunny Shore (round 591), the Neighborhood (592), Victorian (596), Candy Land (597), Robot City
  // (598) and Frosty Peak (599) have all let somebody digging nearby beat their own long-suffering
  // `Detectorist` to real treasure; Whisper Woods' own searcher, still sweeping the leaf litter off
  // the stepping stones at (-4, 18) for a lost ring and turning up nothing but bottle caps, was the
  // last of the seven worlds left without one. **A kid has struck real gold with nothing but a
  // shovel**, out past the fairy ring on a quiet stretch of woodland floor: an old wooden chest lies
  // open, lid thrown back over a heap of coins, a shovel stuck in the moss beside it and a handful of
  // loose coins and gems scattered where they rolled. *"Everybody else got a bottle cap. I got THIS."*
  // *"Careful, puss — don't you dare knock a single coin back into the leaves."* *"Don't tell the
  // searcher. He'll never forgive himself."*
  //
  // Reuses round 591's `makeTreasureChest()` and `makeShovel()` (`62-props-nature.js`) and
  // `makeGemCluster()` (`60-props.js`) exactly as the other five digs already do — no new prop, no new
  // mesh. `placeT`/`boxT` stand in for the flat-floor worlds' `place()`/`P.addBox()` the same way every
  // other hand-placed prop in this wood already accounts for the gently rolling floor; `makeGemCluster()`
  // and `Kneeler` both call `game.physics.ground0()` for their own footing already, so nothing extra was
  // needed there. The finder is a fresh child rig off this file's own `makeWardrobe()`/`randomPerson()`
  // combination, the same one the ring-dancers and tag pair above already use.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses:
  // `game.start('new')`, `game.travel(6, 'from-hub')` — waiting out the real 520 ms portal-fade timer
  // before sampling — then 1800 simulated frames with every NPC's own position sampled every 8th frame)
  // swept a 1 m grid east of the glade, staying 6-18 m from the searcher's own spot so the joke still
  // reads without either "Say hello" circle (2.1 m each) coming near the other's, against both those
  // 25,650 samples and all 676 of the wood's own physics boxes: (6, 30) came back clearest, 5.6 m from
  // the nearest box (a tree trunk) and 5.46 m from the nearest other soul swept across the run — the
  // hiker who patrols the stepping-stone path, only ever that close for an instant as he passes — 15.6 m
  // from the searcher himself, east of the fairy ring and clear of every hand-placed mushroom, log and
  // stump.
  //
  // Built dead last, right before `forestRegion` takes over the fill, the usual reason: `makeHuman()`
  // and `makeGemCluster()` both draw off the shared per-world `r()` sequence unconditionally, and
  // anything built earlier in this wood would have had its own timing-sensitive pick shifted by it.
  { const tx = 6, tz = 30, kx = tx + 1.3, kz = tz + 0.4, kry = atan2(tx - kx, tz - kz);
    const chest = makeTreasureChest(); placeT(game, U, chest, tx, tz, 0.4);
    boxT(game, tx, tz, 1.0, 0.7, 0.7, { cam: false });
    const shovel = makeShovel(); placeT(game, U, shovel, tx + 0.75, tz - 0.6, 0.6);
    makeGemCluster(game, U, tx + 0.4, tz + 0.9, 4, [0xd4af37, 0xc0c0c0, 0xffd54a], r, 0.9);
    const finderWard = makeWardrobe(r, { shirts: [0xffe0ea, 0xbfe7ff, 0xfff3b0], pants: [0xff9ecf, 0x7fd7ff, 0xffffff] });
    const finder = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: finderWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(finder.group);
    game.npcs.push(new Kneeler(game, finder, { x: kx, z: kz, ry: kry, cryIcon: '💰',
      cries: ["Everybody else got a bottle cap. I got THIS.", "Careful, puss — don't you dare knock a single coin back into the leaves.", "Don't tell the searcher. He'll never forgive himself."] })); }

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
