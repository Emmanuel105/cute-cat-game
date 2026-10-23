// ---------------------------------------------------------------- 5. SUNNY SHORE
function buildBeach(game, entry) {
  const W = game.world, P = game.physics, r = seeded(505), U = [];
  P.setLimit(SHORE_LIMIT);
  game.applySky({ top: 0x1f7fe0, horizon: 0xcfefff, bottom: 0x6fc8e8, sun: [0.3, 0.7, -0.4], sunColor: 0xfff6d5, sunSize: 700, halo: 0.5 });
  game.setLighting({ ambient: [0xcfe8ff, 0.45], hemi: [0xbfe8ff, 0xd9c48a, 0.7], sun: [0xfff3dc, 2.8, 30, 70, -40], fog: [0xcfefff, 100, 540], exposure: 1.05 });

  // terrain: dunes in the west, a gentle slope into the sea in the east
  // Terrain has to be smooth in its *second* derivative as well: any kink shows up as an ink line.
  const T = (x, z) => {
    const ridge = smoothstep(-24, -150, x);
    const dune = 0.58 + bumps(x, z, 0.09) * 0.45 + ridge * ridge * 30;
    const shore = smoothstep(14, 31, x);                 // 0 on the sand … 1 in the water
    return lerp(dune, -0.7 - (x - 31) * 0.05, shore);
  };
  const sandM = mat(0xf0dcae, { roughness: 1, map: TEX.sand() });
  makeTerrain(game, T, sandM, 780, 312);
  const sea = makeSea(game, { x: 380, z: 0, w: 740, d: 940, level: 0, color: 0x2fa8dc, deep: 0x1a6aa8 }); U.push(sea.update);
  // shallow shelf tint + a soft foam line where the waves meet the sand
  const foamM = mat(0xffffff, { roughness: 1, transparent: true, opacity: 0.55, emissive: 0xffffff, emissiveIntensity: 0.3 });
  const foam = mesh(G.plane(1.6, 940), foamM, { x: 24.5, y: 0.05, rx: -PI / 2, shadow: 'none', parent: W });
  U.push((dt, t) => { foam.position.x = 24.5 + sin(t * 0.8) * 1.1; foamM.opacity = 0.35 + sin(t * 0.8) * 0.2; });
  P.addBox(33, 0, 0, 1, 12, 940, { walk: false, cam: false });   // you can wade, not swim
  game.zones.addSpan(12, -SHORE_LIMIT, SHORE_LIMIT, SHORE_LIMIT);   // the wet sand and the sea: nothing grows there
  game.zones.addSpan(-52, -14, -44, 14); game.zones.addCircle(12, -46, 9); game.zones.addSpan(2, -26, 20, 6);

  // pier + lighthouse + huts
  const pier = makePier(game, 17, -10, 15, PI / 2);
  // the throne, the fountain, the lighthouse two lines below and Robot City's statue have all had a
  // one-off "walk up and look" toast for rounds now — but Sunny Shore's own pier, the first thing
  // underfoot on the way out to the fisherman, never got a glance of its own. `makePier`'s own return
  // value (otherwise discarded) is handed straight to `game.addInteractable` — no new mesh, no new
  // physics box: the pier's existing deck box already carries the cat out over the water, and the
  // group's own origin sits at the pier's landward end (17, -10), a fixed point regardless of the
  // group's rotation. A 4 m radius reaches comfortably onto the first stretch of planking from the sand
  // behind it, 13 m short of the angler's own 2.1 m greet circle at the far end (30, -10), so standing at
  // the near end never steals his prompt. The line is picked with `rnd.pick()` at the moment of use, never
  // this world's own seeded `r` at build time, so it costs no later wardrobe or colour draw.
  { const pierLines = ['🌊 "Water as far as the eye can go. Somewhere under it, fish."', '🪵 "Salt-bleached boards, creaking the whole way out."', '🎣 "Best seat in the house for watching somebody else not catch anything."'];
    game.addInteractable({ obj: pier, radius: 4, label: () => 'Look out over the pier', onUse: () => { SFX.click(); game.toast(rnd.pick(pierLines), 3000); } }); }
  // the fisherman at the far end has never caught a thing, but the one creature who'd actually beat him
  // to it never showed up. A pelican now perches on the pier's own handrail partway out, between the
  // "look out" spot at the landward end and the angler's own greet circle at the far end, well clear of
  // both. `makePelican()` (new, next to the seagull in `56-npcs-wild.js`) stands on folded legs, scanning
  // the water with a slow head-turn and, every so often, tipping its jaw open and shut as if it's just
  // swallowed something — the fisherman never gets that satisfaction. Added as a child of the pier's own
  // group rather than positioned in world space, so it inherits the pier's rotation for free and sits
  // exactly on the real rail geometry (local x=1.45, the same rail the posts are built on, y=1.56 at the
  // rail's own top) without any trig of its own. No new physics box — perched above head height, the
  // same "perched; only animates" trick the owls and Frosty Peak's seal already use — so it can't block
  // the deck the cat actually walks.
  { const pelican = makePelican(); pelican.group.position.set(1.45, 1.56, 5); pier.add(pelican.group);
    let pt = r() * 10; U.push((dt) => { pt += dt; pelican.animate(0, false, dt, pt); }); }
  const lighthouse = makeLighthouse(game, 12, -46); U.push(lighthouse.userData.update);
  // the Victorian bell tolls, the factory whistle blows, Whisper Woods' owl hoots — but Sunny Shore's
  // own lighthouse, sweeping its beam every second since the world was first built, had never once
  // sounded a horn. It blows a single low blast on a slow loop now, spaced far enough apart to read as
  // a working lighthouse keeping watch over the water rather than a warning. The interval is drawn from
  // the shared `rnd()` inside this `U` tick, read only after every NPC in this build is already placed,
  // so it can't shift any construction-time wardrobe pick, here or in any world built after it.
  let foghornT = rnd.range(35, 60);
  U.push((dt) => { foghornT -= dt; if (foghornT <= 0) { SFX.foghorn(); foghornT = rnd.range(80, 130); } });
  // the throne, the fountain, Robot City's statue, the Neighborhood's signpost, the fairy ring and
  // Victorian's clock tower have all had a one-off "walk up and look" toast for rounds now — but Sunny
  // Shore's own lighthouse, the tallest thing on this whole stretch of coast, never got the same look.
  // `makeLighthouse`'s own return value (already kept, for its beam's `U.push` above) is handed to a
  // second `game.addInteractable` here — no new mesh, no new box. The tower's existing physics box
  // (half-extent 1.5 m in x and z) already keeps the cat from standing closer than about 1.9 m to the
  // centre, so a 5 m radius covers a generous approach from the open north and east without reaching the
  // painter south at (0, -40) (13.4 m off) or the chip stand further south at (4, -54) (11.3 m off). It
  // does overlap the keeper's own 2.1 m greet radius 2 m south of the tower, same as the Candy Queen
  // overlaps her own throne's toast — `game.nearest` always picks whichever interactable centre is
  // closest, so standing right by the keeper still greets the keeper, not the tower. The line is picked
  // with `rnd.pick()` at the moment of use, never this world's own seeded `r` at build time, so it costs
  // no later wardrobe or colour draw.
  { const towerLines = ['💡 "Forty-two steps inside, and the view is just more sea."', '🌊 "Red and white, same as it ever was — ships still find it in the fog."', '🔭 "Tallest thing on this whole stretch of coast. The gulls agree."'];
    game.addInteractable({ obj: lighthouse, radius: 5, label: () => 'Look up at the lighthouse', onUse: () => { SFX.click(); game.toast(rnd.pick(towerLines), 3000); } }); }
  // the lighthouse itself never had anyone tending it, for all its own automatic beam — a keeper kneels
  // at its base, polishing the lowest band with a rag, a tin of polish set down beside them. A headless
  // probe swept a clearance ring around the tower's own 1.5 m half-width physics box: the ring at 2.0 m
  // out comes back clear the whole way round (the scattered rocks only start at 2.6 m), so the keeper
  // sits on the south side, well clear of both the tower and every rock, facing the tower to work on it
  { const kx = 12, kz = -48, ry = 0;
    const keeperWard = makeWardrobe(r, { shirts: [0x4a5a4a, 0x5a4a3a, 0x3a4a5a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018, 0x1e2020] });
    const keeper = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.4), wardrobe: keeperWard }),
      hat: 'cap', hatColor: 0x3a4a4a, coat: true, scarf: null, jacket: null, bag: null, glasses: r.chance(0.25) });
    W.add(keeper.group);
    mesh(G.box(0.14, 0.01, 0.1), mat(0xdcd3b8, { roughness: 0.9 }), { y: 0.02, z: 0.08, rx: -0.3, parent: keeper.hands[1] });   // the rag
    mesh(G.cyl(0.05, 0.05, 0.04, 10), mat(0xc9a227, { metalness: 0.6, roughness: 0.4 }), { x: kx + 0.5, y: 0.02, z: kz - 0.3, parent: W });   // the tin of polish
    game.npcs.push(new Kneeler(game, keeper, { x: kx, z: kz, ry,
      cries: ["Salt air eats the paint faster than I can polish it.", "Careful, puss — don't track grease up the tower.", "Forty-two steps inside, and I still do this bit kneeling."] })); }
  // a fisherman on a stool near the end of the pier, rod out over the open water
  { const pierWard = makeWardrobe(r, { shirts: [0x4a6a7a, 0x5a5a4a, 0x3a5a4a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018, 0x1e2020] });
    const angler = makeHuman({ ...randomPerson(r, { female: false, elder: true, child: false, wardrobe: pierWard }),
      hat: 'cap', hatColor: 0x2e4a3a, coat: true, scarf: null, jacket: null });
    W.add(angler.group);
    game.npcs.push(new IceFisher(game, angler, makeIceStool(), { x: 30, z: -10, ry: PI / 2, seatY: 0.6, holeX: 34, holeZ: -10, holeY: 0.05,
      cries: ['Not a nibble all morning.', "Careful, puss, you'll spook them.", 'Best spot on the whole pier, this.'] })); }
  // a lifeguard up on a raised chair north of the swimming crowd, watching the water
  { game.zones.addCircle(13, 24, 2);
    const guard = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }),
      shirt: 0xd62839, pants: 0xf5f2ea, shorts: true, stripes: null, hat: 'cap', hatColor: 0xf5f2ea, glasses: true, glassColor: 0x203040, jacket: null, scarf: null, bag: null });
    W.add(guard.group);
    placeT(game, U, boxAround(game, makeLifeguardChair(), 13, 24, 1.3, 1.9, 1.1), 13, 24, PI / 2);
    game.npcs.push(new Sitter(game, guard, { x: 13, z: 24, ry: PI / 2, seat: 1.87, cryIcon: '🛟',
      cries: ['Swim between the flags, please!', 'Not a cloud in the sky today.', "Mind that current, puss — respect the sea."] })); }
  // the guard's own flags marking the swim zone, one either side of the chair — she names them, but they never actually stood there before
  let swimFlags = [];
  for (const [fx, fz, ph] of [[13, 18, 0], [13, 30, 2.1]]) { swimFlags.push(placeT(game, U, makeSwimFlag(ph), fx, fz, 0)); boxT(game, fx, fz, 0.3, 2.3, 0.3, { cam: false }); }
  // the Neighborhood's park lamp, a Robot City tower, a Victorian lamp post and a Whisper Woods tree
  // have all carried a stapled notice by now (rounds 462-465) — Sunny Shore, the only world with a
  // ready-made post *and* no notice at all, finally gets one. `makeBeachNotice()` (new, right after
  // `makeForestNotice()` in `60-props.js`) is parented onto the south flag's own pole, the same
  // "child of an existing group" trick every notice before it used: no new mesh, no new physics box —
  // the pole's own 0.3 x 2.3 x 0.3 box two lines up already covers the 0.012 m sheet pinned to it.
  // `game.addInteractable` keys off the flag pole group itself; the north flag is 12 m off and the
  // lifeguard chair's own box (half-extent 0.55 m in z, centred six metres further north at z=24)
  // stays well clear of this radius too.
  { const notice = makeBeachNotice(); notice.position.set(0.14, 1.3, 0); swimFlags[0].add(notice);
    const beachLines = ['🏖️ "LOST: one bucket and spade, bright red. Last seen somewhere under all this sand."',
      '🏖️ "Reward: a seashell, slightly chipped." The cat still isn\'t tempted.',
      '🏖️ Someone has drawn a little crab next to the handwriting, in case the point wasn\'t clear enough.'];
    game.addInteractable({ obj: swimFlags[0], radius: 2.2, label: () => 'Read the notice', onUse: () => { SFX.click(); game.toast(rnd.pick(beachLines), 3000); } }); }
  for (let i = 0; i < 12; i++) { const a = r() * TAU, d = r.range(2.6, 6); placeT(game, U, makeRock(r, 0x8a857a, r.range(0.8, 1.8)), 12 + cos(a) * d, -46 + sin(a) * d, 0); }
  // an artist sets up an easel on the clear sand south of the lighthouse, painting its red-and-white bands — Sunny Shore never had one
  { const px = 0, pz = -40, ry = atan2(12 - px, -46 - pz);
    const paintWard = makeWardrobe(r, { shirts: [0xf5f2ea, 0xffe0ea, 0xdcedf7], pants: [0x2f6fd6, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const painter = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.4), wardrobe: paintWard }),
      hat: 'sunhat', hatColor: 0xd9c9a8, glasses: r.chance(0.3), jacket: null, scarf: null, bag: null });
    W.add(painter.group);
    game.npcs.push(new Painter(game, painter, makeEasel(), { x: px, z: pz, ry,
      cries: ['That red band never sits quite straight, does it.', 'Best light on the coast, this time of day.', "Careful, puss - wet paint, if you can believe it dries out here at all."] })); }
  // the ice-cream seller works the sunbathing crowd, but nobody sold the other half of a day at the
  // seaside — a fish-and-chips stand on the quiet open sand south of the lighthouse, past its rocks.
  // A headless probe swept a grid of candidates across the hand-built heart against every physics box
  // and every NPC's own position sampled over 40 simulated seconds: (4, -54) came back the clearest
  // point in the whole south end — 11.3 m past the lighthouse's own rocks, 18 m from the gem cluster
  // at (16.5, -41) and 21.6 m from the birdwatcher, with nothing else anywhere nearby
  { const cx = 4, cz = -54; game.zones.addCircle(cx, cz, 1.4);
    const chipWard = makeWardrobe(r, { shirts: [0xf5f2ea, 0xe8d9b0], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const fryer = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: chipWard }),
      apron: 0xffffff, hat: 'cap', hatColor: 0x2f6fd6, jacket: null, scarf: null });
    W.add(fryer.group);
    const stand = new Vendor(game, fryer, makeChipsCone(), { x: cx, z: cz, ry: PI / 2, cryIcon: '🍟',
      cries: ['Fish and chips! Hot and vinegared, just how it should be.', 'Mind the gulls, puss — they go for the chips first.', 'Extra salt? Go on then.'] });
    game.npcs.push(stand); greetable(game, stand); }
  // the five huts have stood here bare-roofed since round 13 — a small pennant now flies from each one's
  // own ridge, in the hut's own wall colour. The pole sits at the roof apex (y=3.6, from makeBeachHut's
  // wall top at 2.5 plus its 1.2 m gable) and climbs 0.5 m higher still, well above the hut's own physics
  // box (top at h=2.8, same reasoning round 222's windsock and round 225's castle pennants already relied
  // on), so no new box is needed. The flag sits at local (0,0) on the hut's own ridge line, so it needs no
  // rotation math the way round 223's chimneys did: the hut's own ry (always PI/2 here) turns it in place
  // without moving it off-centre. Only the five hand-placed huts get one — makeBeachHut() itself is shared
  // with 68-regions.js's unbounded dune clusters, and giving every region-filled hut its own animated,
  // unbaked flag would have multiplied draw calls across the whole outer country for no one to notice.
  // The sway uses only the world clock `t` and a fixed phase from the hut's own index, never `r()` or the
  // shared `rnd()`, so it draws nothing from either sequence and can't shift any later pick in this world.
  for (let i = 0; i < 5; i++) {
    const hz = -24 + i * 9, hutColor = r.pick([0xff8a65, 0x4fc3f7, 0xfff176, 0x81c784, 0xf48fb1]);
    const hut = placeT(game, U, boxAround(game, makeBeachHut(hutColor, r), -10, hz, 2.8, 2.8, 2.8), -10, hz, PI / 2);
    addHutFlag(game, U, -10, hz, hutColor, i);
    if (i === 2) {
      // the Neighborhood's porch, Victorian's terrace, Candy Land's cottage and Frosty Peak's cabin all
      // have a napping stray cat tucked behind real window glass by now — these huts never got one, since
      // `makeBeachHut()` (62-props-nature.js) has only painted trim boards on its front wall, no glass to
      // tuck a cat behind. Rather than inventing new window geometry just for this, the third hut (the
      // one with no sandcastle kid, pinwheel or wind chime already claiming it) gets a cat sunning itself
      // flat along its own roof ridge instead — same `makeNapCat()` rig, just asleep in the sun rather
      // than behind glass. The gable roof (`G.gable(2.8, 1.2, 3.0)`, `y: 2.4, ry: PI/2` local to the hut's
      // own group) puts its ridge line, in that same local frame, at y=3.6 (the wall's 2.5 m top plus the
      // 1.2 m gable — the same apex height `addHutFlag`'s pole already climbs from), running along local
      // x in [-1.5, 1.5] once the mesh's own ry/2 rotation is accounted for. x=0.9 sits the cat off-centre,
      // clear of the flagpole at the hut's own local origin. Added as a child of the hut's own group
      // (captured from `placeT`'s return value, never baked — only the procedural outer country runs
      // `bakeDeep()`), so it inherits the hut's world position and rotation for free, same trick every
      // prior napping cat uses. No physics box: the hut's own box tops out at y=2.8 (its full 2.8 m
      // height), 0.8 m below the ridge — the same clearance the flagpole already relies on with no box of
      // its own. Pure set dressing: no greeting, no effect on the friend count, nothing new to collect.
      const napCat = makeNapCat();
      napCat.group.position.set(0.9, 3.6, 0);
      napCat.group.rotation.y = PI / 2 + 0.15;
      hut.add(napCat.group);
      let napT = 8; U.push((dt) => { napT += dt; napCat.animate(0, false, dt, napT); });
    }
  }
  // the Neighborhood's porch, Frosty Peak's first cabin, Whisper Woods' treehouse and Victorian's last
  // terrace door all sway a wind chime of their own by now — every hut here flies a pennant, but none
  // ever got the one sound a beach hut's own eave could make. One now hangs under the back-left corner
  // of the last hut (-10, 12), driftwood disc and sea-worn tubes rather than the others' wood and brass,
  // opposite the front door and stripe (local z=+1.2, x=0.8) so it reads as the quiet side of the hut.
  // localXZ(-10, 12, -1.1, -1.1, PI/2) carries that corner out to world (-11.1, 13.1), clear of the sand-castle
  // kid by the first hut 36 m south and the ice-cream vendor 29 m north. y=2.3 sits just under the wall's
  // own 2.5 m top, below the roof overhang and the flagpole 1.3 m further up — no physics box needed, same
  // as every wind chime before it.
  { const [cx, cz] = localXZ(-10, 12, -1.1, -1.1, PI / 2);
    placeT(game, U, makeWindChime(game, { wood: 0x9a7a52, metal: 0xb8c4c4 }), cx, cz, 0, 2.3); }
  // the Neighborhood's first front yard got a toy pinwheel a few rounds back, spinning on the world
  // clock alone — nobody at the huts here had ever planted one in the sand, for all their own flags
  // and wind chime. One now stands on the quiet side of the second hut (-10, -15), away from the open
  // sand where the sunbathers and vendors are. Local (lx=2.2, lz=0) through the same ry=PI/2 transform
  // as the wind chime above (world_x = x + lz, world_z = z - lx) lands it at (-10, -17.2), 0.8 m clear
  // of that hut's own 2.8x2.8 physics box (z to -16.4) and well past every neighbour checked: 6.3 m
  // from the sand-castle kid at (-6, -22), 13.5 m from the gull-feeder at (3, -13.5), and over 9 m from
  // both the first hut's own box (centred -24 away on z) and the nearest palm at (-28, -14). Spins on
  // the world clock `t` alone, the same trick the Neighborhood's own pinwheel and Robot City's
  // maintenance drone already use, so it draws nothing from this world's own seeded `r` and can't
  // shift any later pick.
  { const px = -10, pz = -17.2, stickH = 0.7, bladeLen = 0.28;
    const y0 = P.ground0(px, pz);
    const pin = group(px, y0, pz, W), stickMat = mat(0xe8dcc0, { roughness: 0.85 }), hubMat = mat(0xffd54a, { metalness: 0.4, roughness: 0.3 });
    mesh(G.cyl(0.018, 0.022, stickH, 8), stickMat, { y: stickH / 2, parent: pin });
    const pivot = group(0, stickH, 0, pin);
    const bladeColors = [0xff7043, 0xf7f3ec, 0x2f6fd6, 0xf7f3ec];
    for (let bi = 0; bi < 4; bi++) { const theta = bi * PI / 2, bx = cos(theta) * bladeLen / 2, by = sin(theta) * bladeLen / 2;
      mesh(G.box(bladeLen, 0.2, 0.02), mat(bladeColors[bi], { roughness: 0.5 }), { x: bx, y: by, rz: theta, parent: pivot }); }
    mesh(G.sphere(0.045, 8, 6), hubMat, { parent: pivot });
    U.push((dt, t) => { pivot.rotation.z = t * 3.6; });
    boxT(game, px, pz, 0.14, stickH, 0.14, { cam: false }); }
  // an ice-cream vendor on the open sand between the huts and the sunbathing crowd
  { const cx = -4, cz = -6; game.zones.addCircle(cx, cz, 1.4);
    const scoopWard = makeWardrobe(r, { shirts: [0xffffff, 0xf7f3ec], pants: [0x2f6fd6, 0x2a2a2a], shoes: [0xefe7d8, 0x8d6e63] });
    const scoopSeller = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: scoopWard }),
      apron: 0xf5f2ea, hat: 'cap', hatColor: 0xff7043, jacket: null, scarf: null });
    W.add(scoopSeller.group);
    const v = new Vendor(game, scoopSeller, makeIceCreamCone(), { x: cx, z: cz, ry: PI / 2, cryIcon: '🍦',
      cries: ['Ice cream! Cold as the sea!', "Melts fast in this sun — best hurry!", 'One scoop or two, puss?'] });
    game.npcs.push(v); greetable(game, v); }
  // the beach's own blurb promises "waves, crabs and coconuts" but not one coconut was ever planted
  // anywhere on the sand — a vendor now sets up in the dune grass north-west of the huts, a stack of
  // whole coconuts at her feet, cracking one open and fitting it with a straw for the cat. A headless
  // probe sampled every NPC's and the squirrel's own position continuously over 30 simulated seconds
  // (so no wandering crab, turtle or sunbather mid-circuit could slip past unnoticed) and swept the dune
  // grass against those samples and every physics box: (-25, -6) came back clear by 8.2 m in every
  // direction, between the musician and the sand-crab boy with nothing else nearby.
  { const cx = -25, cz = -6; game.zones.addCircle(cx, cz, 1.4);
    const cocoWard = makeWardrobe(r, { shirts: [0x2e9e6e, 0xff7043, 0xffd54a], pants: [0x8a6a4a, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const cocoSeller = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: cocoWard }),
      apron: 0xf0dcae, hat: 'sunhat', hatColor: 0xd9c9a8, jacket: null, scarf: null });
    W.add(cocoSeller.group);
    for (const [ox, oz] of [[-0.3, 0.2], [-0.15, 0.4], [-0.4, 0.45]]) mesh(G.sphere(0.1, 8, 6), mat(0x5a3a22, { roughness: 0.95 }), { x: cx + ox, y: P.ground0(cx + ox, cz + oz) + 0.08, z: cz + oz, parent: W });   // whole coconuts piled at her feet
    const v = new Vendor(game, cocoSeller, makeCoconutDrink(), { x: cx, z: cz, ry: atan2(7 - cx, 10 - cz), cryIcon: '🥥',
      cries: ["Fresh coconut! Straw's included.", "Careful, puss — the shell's sharper than it looks.", "Cracked that one myself. Mind the splinters."] });
    game.npcs.push(v); greetable(game, v); }
  // dunes: palms, grass tufts, driftwood
  const palmSpots = [[-20, 6], [-24, 16], [-18, 28], [-30, 30], [-34, -4], [-28, -14], [-38, 12], [-22, -32], [-36, -28], [-44, 2], [-42, 22], [-16, 40], [-30, 44], [-46, -18], [-12, 48], [-6, 34], [-4, -34], [-40, 40]];
  let farPalm = null, duneyPalm = null, northPalm = null, grovePalm = null, eastPalm = null, stormPalm = null, westPalm = null, midDunePalm = null, swPalm = null, innerPalm = null, backPalm = null, hillPalm = null;
  for (const [x, z] of palmSpots) { const p = makePalm(r, r.range(3.8, 5.6)); placeT(game, U, p, x, z, 0); boxT(game, x, z, 0.5, 5, 0.5, { cam: false }); if (x === -40 && z === 40) farPalm = p; if (x === -28 && z === -14) duneyPalm = p; if (x === -12 && z === 48) northPalm = p; if (x === -30 && z === 44) grovePalm = p; if (x === -4 && z === -34) eastPalm = p; if (x === -22 && z === -32) stormPalm = p; if (x === -44 && z === 2) westPalm = p; if (x === -30 && z === 30) midDunePalm = p; if (x === -36 && z === -28) swPalm = p; if (x === -18 && z === 28) innerPalm = p; if (x === -24 && z === 16) backPalm = p; if (x === -38 && z === 12) hillPalm = p; }
  // eighteen palms have stood in these dunes since round 1 and none of them ever got so much as a
  // glance — the one out at (-40, 40), the far north-west corner of the dune field, gets a "look" of
  // its own now. No new mesh, no new physics box: the loop above already calls `makePalm()` for each
  // spot and discards the return, so this just keeps the one matching that coordinate (`farPalm`) and
  // hands it straight to `game.addInteractable`, same trick the barrel and the snowman used. A headless
  // probe (the same stub-three harness `test/run.mjs` itself uses — `game.start('new')`,
  // `game.travel(4, 'from-prev')`, 1800 simulated frames sampling every NPC's own position every 15th
  // frame) found its existing box (half-extent 0.5 m) sits a clear 10.4 m from the nearest other
  // physics box and 9.5 m from the nearest wandering soul; the nearest other interactable (the hollow
  // log over at (-30, 44)) stays 7.4 m off. A 2 m radius clears its own trunk with plenty to spare.
  { const farPalmLines = ['🌴 "Furthest palm on the whole beach, and the only one nobody\'s ever stood under."', '🌴 "Leans a little more than its neighbours. Picked a windier spot and just kept growing."', '🥥 "Not one coconut\'s ever come down off this one. The vendor still has to buy hers."'];
    game.addInteractable({ obj: farPalm, radius: 2, label: () => 'Look at the palm tree', onUse: () => { SFX.click(); game.toast(rnd.pick(farPalmLines), 3000); } }); }
  // seventeen of the eighteen dune palms are still bare after that one. The one at (-28, -14), tucked
  // well back from the sack race's own lane and the chopper's firewood stump, gets the next "look" now.
  // No new mesh, no new physics box: the same loop above already keeps `duneyPalm` off the matching
  // coordinate, same trick `farPalm` used. A headless probe (`game.start('new')`, `game.travel(4,
  // 'from-hub')` waited out through its real portal-fade timer, then 3600 simulated frames sampling
  // every NPC's own position every 6th frame) found this trunk's own box (half-extent 0.5 m) sits a
  // clear 8.8 m from the nearest other physics box and 9.6 m from the nearest wandering soul (the
  // kite-flying flyer, out over the surf) — the widest clearance of any bare palm left on this coast;
  // the nearest other interactable (the chopper's own "Say hello") stays 9.8 m off. A 2 m radius, the
  // same as the far palm's own, clears everything with room to spare.
  { const duneyPalmLines = ['🌴 "No path runs anywhere near this one. It just gets to be a palm tree, quietly."', '🌴 "Every other palm on this beach has somebody walking past it sooner or later. Not this one."', '🥥 "Whatever grows up here, the sand\'s too far from everything for anyone to notice."'];
    game.addInteractable({ obj: duneyPalm, radius: 2, label: () => 'Look at the palm tree', onUse: () => { SFX.click(); game.toast(rnd.pick(duneyPalmLines), 3000); } }); }
  // sixteen of the eighteen dune palms are still bare after those two. The one at (-12, 48), up in the
  // far north corner of the dune field, gets the next "look" now. No new mesh, no new physics box: the
  // same loop above already keeps `northPalm` off the matching coordinate, same trick `farPalm` and
  // `duneyPalm` used. A headless probe (`game.start('new')`, `game.travel(4, 'from-hub')` waited out
  // through its real portal-fade timer, then 3600 simulated frames sampling every NPC's own position
  // every 6th frame) swept all sixteen remaining bare palms against every one of the beach's own
  // physics boxes and every NPC and interactable already on the sand: (-12, 48) came back with the
  // widest overall clearance of the sixteen — 5.98 m from the nearest other box, 6.39 m from the
  // nearest wandering soul, 6.30 m from the nearest other interactable. A 2 m radius, the same as the
  // other two palms' own, clears everything with plenty to spare. Fifteen of the eighteen are now left
  // bare for future rounds.
  { const northPalmLines = ['🌴 "Furthest north of the whole dune field. The wind off the water never really stops up here."', '🌴 "Same curve as every other trunk on this beach. Just a longer walk to see it from this one."', '🥥 "Nobody\'s ever climbed this one for a coconut. They just fall and sit in the sand."'];
    game.addInteractable({ obj: northPalm, radius: 2, label: () => 'Look at the palm tree', onUse: () => { SFX.click(); game.toast(rnd.pick(northPalmLines), 3000); } }); }
  // fifteen of the eighteen dune palms are still bare after those three. The one at (-30, 44), up in
  // the north-east corner of the dune field past the hollow logs, gets the next "look" now. No new
  // mesh and no new physics box: the same loop above already keeps `grovePalm` off the matching
  // coordinate, same trick `farPalm`, `duneyPalm` and `northPalm` used. A headless probe
  // (`game.start('new')`, `game.travel(4, 'from-hub')` waited out through its real portal-fade timer,
  // then 3600 simulated frames sampling every NPC's own position every 6th frame) swept all fifteen
  // remaining bare palms against every one of the beach's own physics boxes, every sample and every
  // interactable already on the sand: (-30, 44) came back with the widest overall clearance of the
  // fifteen — 10.45 m from the nearest other box, 8.25 m from the nearest wandering soul and 8.25 m
  // from the nearest other interactable (the same soul's own "Say hi", sampled at the same spot).
  // Fourteen of the eighteen are now left bare for future rounds.
  { const grovePalmLines = ['🌴 "North-east corner of the dunes, past where the hollow logs lie."', '🌴 "Leans the same lazy way as the rest of them. Nobody up here minds."', '🥥 "A coconut or two in the sand underneath — nobody\'s come looking for them yet."'];
    game.addInteractable({ obj: grovePalm, radius: 2, label: () => 'Look at the palm tree', onUse: () => { SFX.click(); game.toast(rnd.pick(grovePalmLines), 3000); } }); }
  // fourteen of the eighteen dune palms are still bare after those four. The one at (-4, -34), the
  // easternmost of the whole field and the furthest south, gets the next "look" now. No new mesh and
  // no new physics box: the same loop above already keeps `eastPalm` off the matching coordinate,
  // same trick `farPalm`, `duneyPalm`, `northPalm` and `grovePalm` used. A headless probe
  // (`game.start('new')`, `game.travel(4, 'from-hub')` waited out through its real portal-fade timer,
  // then 3600 simulated frames sampling every NPC's own position every 6th frame) swept all fourteen
  // remaining bare palms against every one of the beach's own physics boxes, every sample and every
  // interactable already on the sand: (-4, -34) came back with the widest overall clearance of the
  // fourteen — 8.45 m from the nearest other box, 5.54 m from the nearest wandering soul and 5.61 m
  // from the nearest other interactable. A 2 m radius, the same as the other four palms' own, clears
  // everything with plenty to spare. Thirteen of the eighteen are now left bare for future rounds.
  { const eastPalmLines = ['🌴 "Furthest east of the whole dune field, and the furthest south too."', '🌴 "On its own out here — the rest of the grove is a long walk west."', '🥥 "Nobody\'s ever built so much as a sandcastle under this one."'];
    game.addInteractable({ obj: eastPalm, radius: 2, label: () => 'Look at the palm tree', onUse: () => { SFX.click(); game.toast(rnd.pick(eastPalmLines), 3000); } }); }
  // thirteen of the eighteen dune palms are still bare after those five. The one at (-22, -32), down in
  // the south-west corner of the field past the sack race's own lane, gets the next "look" now. No new
  // mesh and no new physics box: the same loop above already keeps `stormPalm` off the matching
  // coordinate, same trick `farPalm`, `duneyPalm`, `northPalm`, `grovePalm` and `eastPalm` used. A
  // headless probe (`game.start('new')`, `game.travel(4, 'from-hub')` waited out through its real
  // portal-fade timer, then 1200 simulated frames sampling every NPC's own position every 6th frame)
  // swept all thirteen remaining bare palms against every one of the beach's own physics boxes, every
  // sample and every interactable already on the sand: (-22, -32) came back with the widest overall
  // clearance of the thirteen — 9.27 m from the nearest other box, 4.07 m from the nearest wandering
  // soul and 5.29 m from the nearest other interactable, comfortably past the 2 m radius the other five
  // already use. Twelve of the eighteen are now left bare for future rounds.
  { const stormPalmLines = ['🌴 "South-west corner of the dunes, past the sack race\'s own lane."', '🌴 "Leans the same way every trunk on this beach leans. Just further from everything else."', '🥥 "Whatever falls off this one lands in sand nobody\'s ever raked."'];
    game.addInteractable({ obj: stormPalm, radius: 2, label: () => 'Look at the palm tree', onUse: () => { SFX.click(); game.toast(rnd.pick(stormPalmLines), 3000); } }); }
  // twelve of the eighteen dune palms are still bare after those six. The one at (-44, 2), out on the
  // west side of the dune field between the vendor's own hut and the kite-flyer's patch of sand, gets
  // the next "look" now. No new mesh and no new physics box: the same loop above already keeps
  // `westPalm` off the matching coordinate, same trick `farPalm`, `duneyPalm`, `northPalm`, `grovePalm`,
  // `eastPalm` and `stormPalm` used. A headless probe (`game.start('new')`, `game.travel(4, 'from-hub')`
  // waited out through its real portal-fade timer, then 1200 simulated frames sampling every NPC's own
  // position every 6th frame) swept all twelve remaining bare palms against every one of the beach's
  // own physics boxes, every sample and every interactable already on the sand: (-44, 2) came back with
  // the widest overall clearance of the twelve — 3.82 m from the nearest other box, 8.95 m from the
  // nearest wandering soul and 3.92 m from the nearest other interactable, comfortably past the 2 m
  // radius the other six already use. Eleven of the eighteen are now left bare for future rounds.
  { const westPalmLines = ['🌴 "West side of the dunes, between the hut and the kite-flyer\'s own patch of sand."', '🌴 "Same lean, same fronds as the rest of the grove. Just a quieter spot to have them in."', '🥥 "A trunk like any other on this beach. The sand under it just sees fewer footprints."'];
    game.addInteractable({ obj: westPalm, radius: 2, label: () => 'Look at the palm tree', onUse: () => { SFX.click(); game.toast(rnd.pick(westPalmLines), 3000); } }); }
  // eleven of the eighteen dune palms are still bare after those seven. The one at (-30, 30), inland
  // between the west palm and the grove up in the north-east corner, gets the next "look" now. No new
  // mesh and no new physics box: the same loop above already keeps `midDunePalm` off the matching
  // coordinate, same trick `farPalm`, `duneyPalm`, `northPalm`, `grovePalm`, `eastPalm`, `stormPalm` and
  // `westPalm` used. A headless probe (`game.start('new')`, `game.travel(4, 'from-hub')` waited out
  // through its real portal-fade timer, then 1200 simulated frames sampling every NPC's own position
  // every 6th frame) swept all eleven remaining bare palms against every one of the beach's own physics
  // boxes, every sample and every interactable already on the sand: (-30, 30) came back with the widest
  // overall clearance of the eleven — 11.88 m from the nearest other box, 8.49 m from the nearest
  // wandering soul and 8.32 m from the nearest other interactable, comfortably past the 2 m radius the
  // other seven already use. Ten of the eighteen are now left bare for future rounds.
  { const midDunePalmLines = ['🌴 "Not on any edge of the field — this one just grows in the middle of the dunes."', '🌴 "Same curl in the fronds as the rest of the grove. Nobody\'s ever stood under this one to look."', '🥥 "A trunk like any other, planted the same day as its seventeen neighbours."'];
    game.addInteractable({ obj: midDunePalm, radius: 2, label: () => 'Look at the palm tree', onUse: () => { SFX.click(); game.toast(rnd.pick(midDunePalmLines), 3000); } }); }
  // ten of the eighteen dune palms are still bare after those eight. The one at (-36, -28), down past the
  // sack race's own lane in the south-west corner of the field, gets the next "look" now. No new mesh and
  // no new physics box: the same loop above already keeps `swPalm` off the matching coordinate, same
  // trick `farPalm`, `duneyPalm`, `northPalm`, `grovePalm`, `eastPalm`, `stormPalm`, `westPalm` and
  // `midDunePalm` used. A headless probe (`game.start('new')`, `game.travel(4, 'from-hub')` waited out
  // through its real portal-fade timer, then 1200 simulated frames sampling every NPC's own position
  // every 6th frame) swept all ten remaining bare palms against every one of the beach's own physics
  // boxes, every sample and every interactable already on the sand: (-36, -28) came back with the widest
  // overall clearance of the ten — 3.81 m from the nearest other box, 6.75 m from the nearest wandering
  // soul and 4.47 m from the nearest other interactable, comfortably past the 2 m radius the other eight
  // already use. Nine of the eighteen are now left bare for future rounds.
  { const swPalmLines = ['🌴 "South-west corner of the dunes, past the sack race\'s own lane — a different trunk from the storm palm further in."', '🌴 "Same lean, same fronds as the rest of the grove. Just one more nobody\'s ever stood under."', '🥥 "Whatever\'s fallen off this one is still buried somewhere in the sand below it."'];
    game.addInteractable({ obj: swPalm, radius: 2, label: () => 'Look at the palm tree', onUse: () => { SFX.click(); game.toast(rnd.pick(swPalmLines), 3000); } }); }
  // nine of the eighteen dune palms are still bare after those nine. The one at (-18, 28), well inland
  // between the mid-dune palm and the north grove, gets the next "look" now. No new mesh and no new
  // physics box: the same loop above already keeps `innerPalm` off the matching coordinate, same trick
  // every palm before it used. A headless probe (`game.load(4, 'from-hub')`, then 1200 simulated frames
  // sampling every NPC's own position every 6th frame) swept all nine remaining bare palms against
  // every one of the beach's own physics boxes, every sample and every interactable already on the
  // sand: (-18, 28) came back with the widest overall clearance of the nine — 7.93 m from the nearest
  // other box, 8.06 m from the nearest wandering soul and 8.06 m from the nearest other interactable
  // (the same soul's own "Say hi", sampled at the same spot), comfortably past the 2 m radius every
  // other palm already uses. Eight of the eighteen are now left bare for future rounds.
  { const innerPalmLines = ['🌴 "Well inland from the surf, between the mid-dune palm and the north grove."', '🌴 "Same curl, same lean as the rest of the eighteen. Just another quiet spot to grow in."', '🥥 "No footprints under this one, and no coconuts gone missing from it either."'];
    game.addInteractable({ obj: innerPalm, radius: 2, label: () => 'Look at the palm tree', onUse: () => { SFX.click(); game.toast(rnd.pick(innerPalmLines), 3000); } }); }
  // eight of the eighteen dune palms were still bare after those ten. The one at (-24, 16), set back
  // from the surf between the inner palm and the west side of the field, gets the eleventh "look" now.
  // No new mesh and no new physics box: the same loop above already keeps `backPalm` off the matching
  // coordinate, same trick every palm before it used. A headless probe (`game.travel(4, 'from-hub')`
  // waited out through its real portal-fade timer, then 1200 simulated frames sampling every NPC's own
  // position, every physics box and every interactable every 6th frame) swept all eight remaining bare
  // palms: (-24, 16) came back with the widest overall clearance of the eight — 8.49 m from the nearest
  // other box, 8.06 m from the nearest wandering soul and 7.16 m from the nearest other interactable,
  // comfortably past the 2 m radius every other palm already uses. Seven of the eighteen are now left
  // bare for future rounds.
  { const backPalmLines = ['🌴 "Set back from the surf, between the inner palm and the west side of the field."', '🌴 "Same lean, same fronds as its seventeen neighbours. Nobody\'s ever stood under this one either."', '🥥 "Whatever falls here just sits in the sand. No footprints come looking for it."'];
    game.addInteractable({ obj: backPalm, radius: 2, label: () => 'Look at the palm tree', onUse: () => { SFX.click(); game.toast(rnd.pick(backPalmLines), 3000); } }); }
  // Of the eighteen dune palms, eleven had a "look" prompt after round 670; seven were still bare,
  // one of them — (-16, 40) — ruled straight out: a sunbather's own `Wanderer` spawns right on top of
  // that exact coordinate, 0.00 m away every frame, so her own "Say hello" prompt would fight the
  // palm's "Look" for the same patch of sand. The hill palm at (-38, 12) — well back from the surf,
  // between the west palm and the one further back towards the dune field's north side — gets the
  // twelfth instead. A headless probe (`game.travel(4, 'from-hub')` waited out through its real
  // portal-fade timer, then 1800 simulated frames sampling every NPC's own position, every physics
  // box and every interactable every 6th frame) swept the six still-viable bare palms: (-38, 12) came
  // back with the widest overall clearance of the six — 2.75 m from the nearest other box, 9.77 m
  // from the nearest wandering soul and 8.31 m from the nearest other interactable, past the 2 m
  // radius every other palm already uses (two of the six, at (-20, 6) and (-34, -4), cleared barely
  // 1 m from their own nearest box and were ruled out on that alone).
  { const hillPalmLines = ['🌴 "Well back from the surf, between the west palm and the one further towards the north side of the dunes."', '🌴 "Eighteen trunks in this sand, and this one has waited as long as any of them for a look."', '🥥 "No footprints under this one either — just a long, quiet shadow that swings with the sun."'];
    game.addInteractable({ obj: hillPalm, radius: 2, label: () => 'Look at the palm tree', onUse: () => { SFX.click(); game.toast(rnd.pick(hillPalmLines), 3000); } }); }
  makeGrass(game, [[-26, 0, 22, 150], [-14, 30, 12, 70], [-40, -30, 12, 70]], r, { hue: [0.13, 0.21], light: [0.4, 0.56], tall: 1.15, wide: 1.45, pad: 0.2 });
  makeScatter(game, [[10, 0, 12, 60], [6, 28, 10, 40], [8, -26, 10, 40]], G.sphere(0.06, 6, 5), [0xfff1dc, 0xffd9c2, 0xf3e3c8, 0xd9a3a3, 0xe8c9a0], r, [0.6, 1.4], 0.02);  // shells
  for (const [x, z, ry] of [[-14, 36, 0.4], [4, -30, 1.2], [-6, 12, 2.4]]) { const log = makeHollowLog(r); log.scale.setScalar(0.7); placeT(game, U, log, x, z, ry); }
  // the dunes have palms, grass and driftwood, but nowhere to actually lie down — a hammock now hangs
  // between two posts on the open sand south-west of the huts, swaying gently on the sea breeze. Driven
  // only by the world clock `t`, never this world's own seeded `r`, so it costs no later palm height or
  // wardrobe pick. A headless probe swept the fully built world's own physics boxes and zones: (-10, -40)
  // came back clear by just over 15 m on every side, well past the patroller's own loop just below and
  // every palm, hut and vendor already placed, and short of the radius (58, padded to 65) where
  // beachRegion's own fill takes over.
  { const hx = -10, hz = -40, gy = P.ground0(hx, hz), postH = 1.15, half = 1.7;
    const postM = mat(0x6b4a2a, { roughness: 0.9 }), ropeM = mat(0x3a2e20, { roughness: 1 }),
      stripeA = mat(0xe0503c, { roughness: 0.85 }), stripeB = mat(0xf7f0e0, { roughness: 0.85 });
    for (const s of [-1, 1]) mesh(G.cyl(0.07, 0.09, postH, 8), postM, { x: hx + s * half, y: gy + postH / 2, z: hz, parent: W });
    P.addBox(hx, gy + postH / 2, hz, half * 2 + 0.3, postH, 1.0, { cam: false });
    // the woven bed: a shallow sag between the two posts, built from a few chunky striped segments
    // (paper-thin geometry comes out as a solid ink line, same reason grass blades and flower petals
    // are built chunky) rather than one flat plane.
    const swing = group(hx, gy, hz, W);
    const N = 6, pts = [];
    for (let i = 0; i < N; i++) { const u = i / (N - 1); pts.push([lerp(-half + 0.15, half - 0.15, u), postH - 1.4 * u * (1 - u)]); }
    for (let i = 0; i < N - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      const len = sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)), ang = atan2(y1 - y0, x1 - x0);
      mesh(G.box(len, 0.08, 0.85), i % 2 ? stripeA : stripeB, { x: mx, y: my, rz: ang, parent: swing });
    }
    for (const [[px, py], postX] of [[pts[0], -half], [pts[N - 1], half]]) {
      const dx = postX - px, dy = postH - py, len = sqrt(dx * dx + dy * dy), ang = atan2(dy, dx);
      noInk(mesh(G.box(len, 0.03, 0.03), ropeM, { x: (px + postX) / 2, y: (py + postH) / 2, rz: ang, parent: swing })); }
    U.push((dt, t) => { swing.rotation.z = sin(t * 0.55) * 0.03; swing.position.y = gy + sin(t * 1.1) * 0.01; });
    const hammockLines = ['🏖️ "Whoever strung this up clearly had the right idea."', '🏖️ "Empty most of the day — the sand\'s too hot to cross for a nap."', '🏖️ "Rope\'s a bit salt-stiff, but it still swings easy enough."'];
    game.addInteractable({ obj: swing, radius: 2.6, label: () => 'Look at the hammock', onUse: () => { SFX.click(); game.toast(rnd.pick(hammockLines), 3000); } }); }
  // every other world already had its own Patroller walking a beat (the Neighborhood's postie, Candy
  // Land's gate guard, Robot City's sentry, Victorian's bobby, Frosty Peak's ski patroller, Whisper
  // Woods' hiker) — Sunny Shore never had one. A headless probe swept the fully built world's own
  // physics boxes plus every NPC's position sampled continuously over 40 simulated seconds (so no
  // wandering crab, turtle or sunbather mid-leash could slip past unnoticed) and found a quiet dune
  // pocket west of the beach huts clear the whole way round: the loop at x -44..-38, z -12..-4 never
  // came closer than 3.75 m to anything else, mild underfoot (ground height 0.47-0.86 m across the four
  // corners) and well short of the radius (58, padded to 65) where beachRegion's own fill takes over.
  { const patrolWard = makeWardrobe(r, { shirts: [0xc9a15a, 0x5a7a6a, 0x3a5a6a], pants: [0x3a3a3a, 0x2a2a2a], shoes: [0x2a2018] });
    const patroller = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: patrolWard }),
      hat: 'cap', hatColor: 0xc9a15a, glasses: true, glassColor: 0x203040, jacket: null, scarf: null, bag: 0x3a3a3a });
    W.add(patroller.group);
    game.npcs.push(new Patroller(game, patroller, { points: [[-44, -12], [-38, -12], [-38, -4], [-44, -4]], speed: 0.8, pause: [1.5, 3], pauseAll: true, loop: true, cryIcon: '🏖️',
      cries: ['Dunes are holding up fine today.', 'Careful, puss — that grass took years to root.', 'Quietest beat on the whole coast, this one.', 'No rip currents today. Or yesterday. Good record, really.'] })); }
  // sunbathers' corner: umbrellas, towels, sandcastle, beach ball
  const towels = [];
  for (const [x, z, hue, tc] of [[6, 4, 0, 0x2f6fd6], [10, 12, 200, 0xff7043], [4, 18, 50, 0x8e24aa], [9, -20, 320, 0x2e9e6e]]) { placeT(game, U, makeUmbrella(hue), x, z, 0); boxT(game, x, z, 0.2, 2.2, 0.2, { cam: false }); const ry = r() * 0.6; placeT(game, U, makeTowel(tc), x + 1.2, z + 0.6, ry); towels.push([x + 1.2, z + 0.6, ry]); }
  const sandcastle = placeT(game, U, makeSandcastle(), 7, -4, 0.3); boxT(game, 7, -4, 1.6, 1.4, 1.6, { cam: false });
  // the kid a step to the north has been patting this castle since it was first built, but the castle
  // itself never got a "walk up and look" toast of its own, same gap every other hand-built prop in
  // this file has had filled one round at a time. No new mesh, no new physics box: `placeT`'s own return
  // value is handed straight to `game.addInteractable`. The existing box (half-extent 0.8 in x and z,
  // corner at 1.13 m) already keeps the cat about 0.8 m clear on every face, so a 3.0 m radius is
  // reachable from any side. The patting kid sits only 1.3 m north of this same centre, well inside that
  // radius too, but `game.nearest` always resolves to whichever interactable is physically closer to the
  // cat (see the main loop in 80-game.js), so standing near the kid still shows "Say hi", not this toast.
  { const sandcastleLines = ['🏰 "Four towers, one flag, not a drop of moat water left."', '🏰 "Survived two tides and one very curious gull."', '🏰 "Somebody is awfully proud of that little flag."'];
    game.addInteractable({ obj: sandcastle, radius: 3.0, label: () => 'Look at the sandcastle', onUse: () => { SFX.click(); game.toast(rnd.pick(sandcastleLines), 3000); } }); }
  const ball = mesh(G.sphere(0.32, 14, 10), mat(0xffffff, { roughness: 0.5 }), { parent: W }); mesh(G.sphere(0.322, 14, 10), mat(0xd62839, { roughness: 0.5 }), { sx: 0.5, parent: ball }); mesh(G.sphere(0.322, 14, 10), mat(0x2f6fd6, { roughness: 0.5 }), { sz: 0.5, parent: ball });
  const ballY = P.ground0(3, 8); ball.position.set(3, ballY + 0.32, 8);
  // the ball is in play: see BallGame below, once the sunbathers are made
  // sea props: buoys, sailboat
  for (const [x, z, c] of [[38, -26, 0xd62839], [42, 6, 0xffd54a], [36, 30, 0xd62839]]) { const b = makeBuoy(c); b.userData.y0 = 0; place(game, U, b, x, z, 0, 0); }
  const boat = makeBoat(0x3f6fd6); boat.userData.y0 = 0.05; place(game, U, boat, 46, 16, -0.6, 0.05);
  const boat2 = makeBoat(0xd62839); boat2.userData.y0 = 0.05; boat2.scale.setScalar(0.8); place(game, U, boat2, 54, -30, 0.8, 0.05);

  // life: crabs, gulls, turtles, beachgoers, a dog, the squirrel
  // the six-strong crab colony has scuttled this stretch of sand since round 1, pure background the
  // whole time — unlike the dog and the squirrel, not one of them was ever a friend to meet, the exact
  // gap round 672 closed for this beach's own turtles. Rounds 681-686 gave the first five colony crabs a
  // "Say hello" prompt; this round gives the sixth and last, at (17, 36), the same treatment, closing out
  // the whole colony: `makeCrab()`'s rig has none of `.look`/`.robot`/`.cookie`, so `Wanderer`'s own
  // `greetable()` call already quietly no-ops on it, and nothing here is new mesh or a new physics box —
  // just `game.addInteractable` tracking the rig's own group as it wanders its usual 5 m leash, exactly
  // like the first five crabs.
  for (const [i, [x, z]] of [[16, -30], [18, 2], [15, 14], [19, 24], [14, -18], [17, 36]].entries()) {
    const rig = makeCrab(r.pick([0xe8492b, 0xff7043, 0xc62828])); W.add(rig.group);
    game.npcs.push(new Wanderer(game, rig, { x, z, speed: r.range(0.9, 1.4), leash: 5, r: 0.25, height: 0.5, step: 0.25, idle: [0.5, 2], walk: [1, 3] }));
    if (i === 0) {
      const crid = game.namedFriend('crab');
      game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the crab', onUse: () => { game.befriend(crid); SFX.chitter(); game.hearts(rig.group.position.x, 0.5, rig.group.position.z, 3); game.toast('🦀 *waves a claw*'); } });
    } else if (i === 1) {
      const crid2 = game.namedFriend('crab2');
      game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the crab', onUse: () => { game.befriend(crid2); SFX.chitter(); game.hearts(rig.group.position.x, 0.5, rig.group.position.z, 3); game.toast('🦀 *clicks its claws together*'); } });
    } else if (i === 2) {
      const crid3 = game.namedFriend('crab3');
      game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the crab', onUse: () => { game.befriend(crid3); SFX.chitter(); game.hearts(rig.group.position.x, 0.5, rig.group.position.z, 3); game.toast('🦀 *scurries sideways, claw raised*'); } });
    } else if (i === 3) {
      const crid4 = game.namedFriend('crab4');
      game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the crab', onUse: () => { game.befriend(crid4); SFX.chitter(); game.hearts(rig.group.position.x, 0.5, rig.group.position.z, 3); game.toast('🦀 *taps both claws together, twice*'); } });
    } else if (i === 4) {
      const crid5 = game.namedFriend('crab5');
      game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the crab', onUse: () => { game.befriend(crid5); SFX.chitter(); game.hearts(rig.group.position.x, 0.5, rig.group.position.z, 3); game.toast('🦀 *raises one claw high, then the other*'); } });
    } else if (i === 5) {
      const crid6 = game.namedFriend('crab6');
      game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the crab', onUse: () => { game.befriend(crid6); SFX.chitter(); game.hearts(rig.group.position.x, 0.5, rig.group.position.z, 3); game.toast('🦀 *skitters in a tight little circle, claws up*'); } });
    }
  }
  // a bolder crab: it minds its own business until the cat wanders close, then scuttles over for a look.
  // Round 685 already gave this one a "Say hello" prompt, same no-op reasoning as every other crab
  // (`makeCrab()`'s rig carries none of `.look`/`.robot`/`.cookie`), but a plain `game.addInteractable`
  // on its own group works regardless of which controller drives it, `Follower` here rather than
  // `Wanderer` — and `Follower`'s own `keep` distance (1.6 m) means this crab parks itself well inside
  // the 2.1 m radius the moment it closes in on the cat, so the prompt is if anything easier to trigger
  // than the colony crabs' own wandering ones.
  { const rig = makeCrab(0xd84315); W.add(rig.group);
    const fw = new Follower(game, rig, { x: 17, z: -6, r: 0.25, height: 0.5, step: 0.25, idle: [0.5, 2], walk: [1, 3], leash: 5, speed: 1.8, range: 10, keep: 1.6, sfx: () => SFX.click() });
    game.npcs.push(fw);
    const boldId = game.namedFriend('boldcrab');
    game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the crab', onUse: () => { game.befriend(boldId); SFX.chitter(); game.hearts(rig.group.position.x, 0.5, rig.group.position.z, 3); game.toast('🦀 *marches right up and taps a claw on your paw*'); } }); }
  for (let i = 0; i < 7; i++) { const rig = makeSeagull({ phase: i * 1.3 }); game.npcs.push(new Flyer(game, rig, { cx: 14 + r.range(-8, 8), cz: r.range(-30, 30), r: r.range(9, 18), h: r.range(5, 11), speed: r.range(3.5, 5), bob: 1.2, wobble: 3, cw: i % 2 === 0, phase: i })); }
  // both turtles have been pure background since round 1, same as the crabs — unlike the dog and the
  // squirrel, neither was ever a friend to meet. The second one, up at (24, 20), gets a "Pet the
  // turtle" prompt now: `makeTurtle()`'s rig has none of `.look`/`.robot`/`.cookie`, so `Wanderer`'s own
  // `greetable()` call already quietly no-ops on it (same reason the dog needs its own explicit
  // interactable rather than picking one up for free), and nothing here is new mesh or a new physics
  // box — just `game.addInteractable` on the rig's own group, tracking it as it wanders its usual 5 m
  // leash, the same trick the beach dog above and every world's own dog already use.
  for (const [i, [x, z]] of [[22, -2], [24, 20]].entries()) {
    const rig = makeTurtle(); W.add(rig.group);
    game.npcs.push(new Wanderer(game, rig, { x, z, speed: 0.35, leash: 5, r: 0.45, height: 0.5, step: 0.25, idle: [2, 5], walk: [3, 7] }));
    if (i === 1) {
      const tid = game.namedFriend('turtle');
      game.addInteractable({ obj: rig.group, radius: 2.4, label: () => 'Pet the turtle', onUse: () => { game.befriend(tid); SFX.thunk(); game.hearts(rig.group.position.x, 0.5, rig.group.position.z, 4); game.toast('🐢 *slow blink of approval*'); } });
    }
  }
  // the open sea past the wade limit (x=33) has been empty water since round 1 — nothing was ever living
  // out there, only the foam line and the horizon. A pair of dolphins now porpoises on a slow circuit far
  // out past the pier, each one surfacing for a moment every lap or so before sinking back under: the pod
  // copies the park/canal/river/pond ducks' own fixed-phase circular orbit (round 199 onward) rather than
  // a straight-line swim, just with a porpoising height curve layered on top and `group.visible` toggled
  // off while submerged, so nothing is drawn mid-dive. The circuit (centre x=72, 32-36 m radius) sits
  // entirely past the swim flags and the lighthouse's own rocks, inside `SHORE_LIMIT` (196) for the fog
  // and horizon but miles past the wade-blocking physics box at x=33 the cat can never cross, so neither
  // dolphin needs a physics box, a zone or a greetable id of its own.
  { const dcx = 72, dcz = 0, waterY = 0, leapPeriod = 4.2;
    const pod = [
      { rig: makeDolphin({ color: 0x5b6b7c }), orad: 32, ospeed: 0.07, ophase: 0, lphase: 0 },
      { rig: makeDolphin({ color: 0x6b7c8c }), orad: 36, ospeed: 0.07, ophase: 1.3, lphase: 2.1 },
    ];
    for (const d of pod) W.add(d.rig.group);
    U.push((dt, t) => { for (const d of pod) {
      const a = t * d.ospeed + d.ophase, dx = -sin(a), dz = cos(a);
      const lp = ((t + d.lphase) % leapPeriod) / leapPeriod, raw = sin(lp * TAU);
      const arc = raw > 0.5 ? (raw - 0.5) * 2 : 0;
      d.rig.group.visible = arc > 0.02;
      d.rig.group.position.set(dcx + cos(a) * d.orad, waterY + arc * 1.3, dcz + sin(a) * d.orad);
      d.rig.group.rotation.set(arc > 0 ? -cos(lp * TAU) * 0.6 : 0, atan2(dx, dz), 0);
    } }); }
  // sandpipers dart along the tideline on the open sand, well clear of the crabs' own homes, the lighthouse rocks and the swim-flag posts — ambient like the crabs and gulls, no greeting, no effect on the friend count
  for (const [x, z] of [[16, -24], [17, -38], [14, 44]]) { const rig = makeSandpiper(); game.npcs.push(new Hopper(game, rig, { x, z, leash: 1.6, r: 0.08, dist: [0.3, 0.7], dur: 0.28, height: 0.14, idle: [1, 3.5], onHop: () => { if (rnd.chance(0.25)) SFX.chitter(); } })); }
  const beachWard = makeWardrobe(r, {
    shirts: [0xff7043, 0x4fc3f7, 0xfff176, 0xf48fb1, 0xffffff, 0x80deea, 0xaed581],
    pants: [0x2f6fd6, 0xd62839, 0x2e9e6e, 0xff8fab, 0xffb74d],
    shoes: [0xefe7d8, 0xd7a86e, 0x8d6e63],
  });
  const beachPerson = (lady, child) => { const rig = makeHuman({ ...randomPerson(r, { female: lady, child, wardrobe: beachWard }),
      shorts: true, stripes: r.chance(0.35) ? 0xffffff : null,
      glasses: r.chance(0.45), glassColor: 0x203040,
      hat: child ? 'cap' : lady ? 'sunhat' : (r.chance(0.5) ? 'cap' : null), hatColor: lady ? 0xfff3d6 : 0x2f4f4f }); W.add(rig.group); return rig; };
  for (const [i, z] of [[0, -12], [1, 21], [2, 32]]) { const child = i === 2; game.npcs.push(new Wanderer(game, beachPerson(i === 1, child), { x: 0 + r.range(-6, 6), z, speed: child ? r.range(1.2, 1.6) : r.range(0.7, 1.1), leash: 12 })); }
  // two sunbathers flat out on their towels in dark glasses, and a child patting the sandcastle
  for (const i of [0, 3]) { const [tx, tz, ry] = towels[i]; game.npcs.push(new Sunbather(game, beachPerson(i === 0, false), { x: tx, z: tz + 0.55, ry })); }
  // a third sunbather on the spare towel, a paperback going nowhere fast
  { const [tx, tz, ry] = towels[1]; game.npcs.push(new Sunbather(game, beachPerson(r.chance(0.5), false), { x: tx, z: tz + 0.55, ry,
    cries: ["Sunbathing is a science, apparently.", 'Same page as an hour ago.', "Wake me if the tide comes in."] })); }
  // a juggler works the open sand between the towels and the lifeguard chair, three balls in a steady loop over their own head
  { const jx = 3, jz = 16, jugWard = makeWardrobe(r, { shirts: [0xffd54a, 0x2e9e6e, 0xf7f3ec], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const juggler = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: jugWard }),
      glasses: r.chance(0.3), hat: null, jacket: null, scarf: null, bag: null });
    W.add(juggler.group);
    game.npcs.push(new Juggler(game, juggler, [0xffffff, 0xd62839, 0x2f6fd6], { x: jx, z: jz, ry: atan2(8 - jx, 10 - jz),
      cries: ["Three's easy - four's where it gets interesting.", "Careful, puss, I don't want you underfoot.", "Ask nicely and I'll teach you the trick."] })); }
  game.npcs.push(new Kneeler(game, beachPerson(false, true), { x: 7, z: -2.7, ry: PI }));
  { const bucket = mat(0xd62839, { roughness: 0.6 }); mesh(G.cyl(0.16, 0.13, 0.26, 10), bucket, { x: 7.9, y: P.ground0(7.9, -2.4) + 0.13, z: -2.4, parent: W }); mesh(G.torus(0.16, 0.012, 5, 12), mat(0xffd54a), { x: 7.9, y: P.ground0(7.9, -2.4) + 0.27, z: -2.4, rx: PI / 2, shadow: 'none', parent: W }); }
  // a beachcomber crouched further south, sorting shells into a little pile where the shell scatter is thickest
  { const cx = 5, cz = -32;
    game.npcs.push(new Kneeler(game, beachPerson(r.chance(0.5), false), { x: cx, z: cz, ry: 1.9,
      cries: ['Found a whole conch, look!', 'This one still has its shine.', "One more and I'll call it a collection."] })); }
  // a girl kneels at the tideline south of the lighthouse, finishing a message drawn in the wet sand
  { const cx = 21, cz = -36;
    game.npcs.push(new Kneeler(game, beachPerson(true, true), { x: cx, z: cz, ry: 2.0,
      cries: ["Nearly got the last letter right.", "Tide will take it in an hour, but that's alright.", "It says 'MEOW' — for you, if you can read it upside down."] })); }
  // a birdwatcher stands on the open sand south of the huts, binoculars trained on the gulls wheeling over the water
  { const birdWard = makeWardrobe(r, { shirts: [0x5a7a4a, 0x4a6a7a, 0x6a5a4a], pants: [0x3a3a3a, 0x2a2a2a], shoes: [0xefe7d8, 0x8d6e63] });
    const birder = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: birdWard }),
      hat: 'cap', hatColor: 0x2f4f4f, glasses: true, glassColor: 0x203040, jacket: null, scarf: null, bag: null });
    W.add(birder.group);
    game.npcs.push(new Birder(game, birder, { x: -8, z: -36, ry: 1.3,
      cries: ["There's one - no, gone again.", "Fifty-two species this year, if I've counted right.", "Gulls mostly. Still counts."] })); }
  // the birdwatcher above just watches the gulls; Victorian's own crumb-feeder (built for its pigeons)
  // already named Sunny Shore as the gulls' turn to come — a feeder now kneels on the open sand of the
  // sunbathing corner, a paper bag of chips at her side, reusing Forager's own kneel-and-toss exactly as
  // Victorian's crumb-feeder and Whisper Woods' mushroom-picker already do. A headless probe built the
  // real Sunny Shore, sampled every NPC's and the squirrel's own position continuously over 30 simulated
  // seconds (so no wandering sunbather, crab or gull mid-circuit could slip past unnoticed), and swept a
  // grid of the whole sunbathing corner against both those samples and every physics box, staying well
  // inside the hand-built heart (radius < 50, short of beachRegion's own fill at 58): (3, -13.5) came back
  // clear, 8.7 m from the nearest other soul or collider in any direction — between the ice-cream cart and
  // the towels, facing out toward where the gulls wheel over the water.
  { const kx = 3, kz = -13.5, gx = 14, gz = 0, ry = atan2(gx - kx, gz - kz);
    const feedWard = makeWardrobe(r, { shirts: [0x6a5a4a, 0x5a6a5a, 0x4a5a6a], pants: [0x3a3a3a, 0x2a2a2a], shoes: [0xefe7d8, 0x8d6e63] });
    const feeder = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.4), wardrobe: feedWard }),
      hat: 'sunhat', hatColor: 0xd9c9a8, shorts: true, jacket: null, scarf: null, bag: null, glasses: r.chance(0.3) });
    W.add(feeder.group);
    mesh(G.box(0.2, 0.16, 0.12), mat(0xf0dcae, { roughness: 0.9 }), { x: kx + 0.35, y: 0.08, z: kz + 0.12, ry: 0.3, parent: W });   // the paper bag of chips
    boxT(game, kx + 0.35, kz + 0.12, 0.2, 0.16, 0.12, { cam: false });
    game.npcs.push(new Forager(game, feeder, { x: kx, z: kz, ry, cryIcon: '🍟',
      cries: ["Not too close, puss, these are for the gulls.", "They'll take it right out of your hand if you let them.", "One always gets there before the rest."] })); }
  // Whisper Woods has its own jogger catching their breath deep in the trees, but nobody on this whole
  // beach had come for an actual run — every other soul here is either working, playing or lying down.
  // A headless probe built the real Sunny Shore, sampled every NPC's and the squirrel's own position
  // continuously over 30 simulated seconds (so no wandering crab, turtle or sunbather mid-circuit could
  // slip past unnoticed), and swept the dry sand south of the ice-cream cart against both those samples
  // and every physics box: (1, -25) came back clear by 7.6 m in every direction, between the gull-feeder
  // at (3, -13.5) and the beachcomber at (5, -32) — well inside beachRegion's own fill, which only
  // starts past radius 58.
  { const jx = 1, jz = -25, ry = PI / 2;
    const runner = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }),
      shirt: 0xd62839, stripes: 0xf5f2ea, pants: 0x2a2a2a, shoes: 0xf5f2ea, shorts: true, hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(runner.group);
    game.npcs.push(new Charger(game, runner, { x: jx, z: jz, ry, cryIcon: '🏃',
      cries: ["Didn't expect company, out here.", "Sand's twice the work of a proper road.", "One more stretch before the tide's all the way in."] })); }
  // a clam digger kneels in the wet sand north of the pier, working the tideline for shellfish — Sunny Shore's tideline never had anyone digging it, only walking it
  { const digWard = makeWardrobe(r, { shirts: [0x6a8a9a, 0x9a8a6a, 0x7a6a5a], pants: [0x3a4a3a, 0x4a3a2a], shoes: [0x5a4030, 0x3a2a1e] });
    const digger = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: digWard }),
      hat: r.chance(0.5) ? 'cap' : null, hatColor: 0x4a5a4a, shorts: true, bag: 0x5a4a3a, jacket: null, scarf: null, glasses: false });
    W.add(digger.group);
    game.npcs.push(new Forager(game, digger, { x: 20, z: 9, ry: PI / 2, cryIcon: '🦪',
      cries: ["A clam! Bucket's filling up nicely.", "Careful, puss — sharp shells under that sand.", "Low tide's the only time worth digging."] })); }
  // a boy kneels in the dune grass south-west of the beach huts, digging for sand crabs with a toy shovel
  { const kx = -24, kz = -22, hx = kx + 1.6, hz = kz - 0.6;
    game.npcs.push(new Kneeler(game, beachPerson(false, true), { x: kx, z: kz, ry: atan2(hx - kx, hz - kz),
      cries: ['Nearly got one that time!', "They're faster than they look.", "Sh-h, you'll scare them off, puss."] })); }
  // a kid kneels by the yellow beach hut's steps, patting together a lopsided sand copy of the hut itself
  { const kx = -6, kz = -22, hutX = -10, hutZ = -24;
    game.npcs.push(new Kneeler(game, beachPerson(r.chance(0.5), true), { x: kx, z: kz, ry: atan2(hutX - kx, hutZ - kz),
      cries: ['Nearly as tall as the real one!', 'It needs a door - hang on.', "Careful, puss, that's the chimney."] })); }
  // a metal detectorist sweeps the open sand between the ice-cream cart and the sunbathers, coil beeping onto a find every so often
  { const detWard = makeWardrobe(r, { shirts: [0xc9a86a, 0x8a9a6a, 0xa8926a], pants: [0x4a4a3a, 0x3a4a4a], shoes: [0x5a4030, 0x3a2a1e] });
    const hunter = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: detWard }),
      hat: 'cap', hatColor: 0x5a6a4a, shorts: true, bag: 0x8a6a4a, jacket: null, scarf: null, glasses: r.chance(0.4) });
    W.add(hunter.group);
    game.npcs.push(new Detectorist(game, hunter, { x: -6, z: 18, ry: -1.6,
      cries: ['Found a bottle cap. Progress.', "Careful, puss, you'll set it off.", "One day it'll be real treasure."] })); }
  // two friends chatting on the quiet sand at the north end, well clear of the crowd by the huts
  { const talkA = beachPerson(false, false), talkB = beachPerson(true, false);
    game.npcs.push(new Talkers(game, talkA, talkB, { x: 14, z: 34, ry: 1.2,
      lines: ["Best week of the summer, this.", 'You say that every year.', 'And I mean it every year.', "Tide's coming in - we'll want to move those towels."] })); }
  // a boy flying a kite on the dunes, the wind off the sea carrying it inland and up
  game.npcs.push(new KiteFlyer(game, beachPerson(false, true), makeKite(0xd62839, 0xf2c744), { x: -4, z: 40, wind: [-0.55, 0.85], cries: ['Look at it go!', "The wind's just right today.", 'Higher than the lighthouse!'] }));
  // two of them are keeping the beach ball in the air — greetable too, like everyone else on the sand
  { const ballA = beachPerson(false, false), ballB = beachPerson(true, false);
    game.npcs.push(new BallGame(game, ballA, ballB, ball, { cx: 4, cz: 10, gap: 5.5 }));
    greetable(game, { rig: ballA }); greetable(game, { rig: ballB }); }
  // two kids chase each other round the open sand out past the dunes — a game of tag, the one thing the beach's children never had to do together
  { const tagA = beachPerson(false, true), tagB = beachPerson(true, true);
    game.npcs.push(new Playmates(game, tagA, tagB, { cx: -28, cz: 22, leash: 5.5 }));
    greetable(game, { rig: tagA }); greetable(game, { rig: tagB }); }
  // the moored boats never had anyone tending their gear; a net-mender sits on a stool on the quiet north sand, coiling rope in her lap
  { const nx = 25, nz = 48, ry = PI / 2;
    const mendWard = makeWardrobe(r, { shirts: [0x8a6a4a, 0x5a7a6a, 0x4a5a4a], pants: [0x3a3a3a, 0x2a2a2a], shoes: [0x5a4030, 0x3a2a1e] });
    const mender = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.35), wardrobe: mendWard }),
      hat: r.chance(0.4) ? 'cap' : null, hatColor: 0x4a5a4a, jacket: null, scarf: null, bag: null, glasses: false });
    W.add(mender.group);
    const rope = mat(0xc9a96a, { roughness: 0.95 });
    for (let i = 0; i < 3; i++) mesh(G.torus(0.09 - i * 0.015, 0.018, 6, 12), rope, { y: 0.02 + i * 0.01, rx: PI / 2, parent: mender.hands[1] });
    placeT(game, U, makeIceStool(), nx, nz, ry);
    game.npcs.push(new Sitter(game, mender, { x: nx, z: nz, ry, seat: 0.3,
      cries: ["Salt gets in every knot, out here.", 'Careful, puss — this line still has hooks on it.', "Boats won't mend themselves, will they."] })); }
  // nobody at Sunny Shore had ever come to actually surf; one waxes their board on the quiet sand near the net-mender, board planted nose-down beside them
  { const sx = 2, sz = 45, ry = PI / 2, bx = 2, bz = 44;
    const surfWard = makeWardrobe(r, { shirts: [0x2e9e6e, 0xff7043, 0x2f6fd6], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const surfer = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: surfWard }),
      shorts: true, hat: null, jacket: null, scarf: null, bag: null, glasses: r.chance(0.3) });
    W.add(surfer.group);
    mesh(G.box(0.09, 0.05, 0.14), mat(0xf7f3ec, { roughness: 0.95 }), { y: 0.05, z: 0.07, parent: surfer.hands[0] });   // the wax block
    const board = placeT(game, U, makeSurfboard(r.pick([0xff7043, 0x2f6fd6, 0xffd54a, 0x2e9e6e])), bx, bz, ry);
    boxT(game, bx, bz, 0.6, 1.5, 0.4, { cam: false });
    game.npcs.push(new Washer(game, surfer, { x: sx, z: sz, ry,
      cries: ["Wax while it's warm, that's the trick.", 'Careful, puss — sticky hands.', "Flat today, but you never know."] }));
    // the board itself — planted nose-down right beside the waxing above, round 602's and 603's own
    // discarded-return-value trick — never got so much as a glance of its own, for all the time its
    // owner spends working wax into the deck. `placeT()`'s return value, previously discarded like the
    // ice crystal's and the chestnut brazier's own groups before this, is the exact board already built
    // and boxed one metre south of the surfer, handed straight to `game.addInteractable` at a tight
    // 0.9 m radius — comfortably inside the surfer's own 2.1 m `Washer` greet circle, but `addInteractable`
    // picks nearest by distance² (per `80-game.js`), the same coexistence round 604's shine box banked on
    // against the bootblack's own closer-still 0.32 m gap.
    const boardLines = ['🏄 "Fresh wax, nose to tail — not a patch missed."', '🏄 "One fin, dead centre. Older than it looks."', '🏄 "Planted nose-down so the wax doesn\'t melt off in the sun."'];
    game.addInteractable({ obj: board, radius: 0.9, label: () => 'Look at the surfboard', onUse: () => { SFX.click(); game.toast(rnd.pick(boardLines), 3000); } }); }
  // no world had a musician yet; one sits cross-legged in the dune grass west of the towels, strumming a ukulele toward the sunbathers
  { const mx = -34, mz = 0, mry = atan2(5 - mx, 10 - mz);
    const museWard = makeWardrobe(r, { shirts: [0xffd54a, 0xff7043, 0x2f6fd6], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const musician = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.25), wardrobe: museWard }),
      hat: r.chance(0.4) ? 'sunhat' : null, hatColor: 0xd9c9a8, glasses: r.chance(0.3), jacket: null, scarf: null, bag: null });
    W.add(musician.group);
    const uke = makeUkulele(r.pick([0xd9a15a, 0xc9915a, 0xb98a52]));
    uke.position.set(0.03, -0.02, 0.14); uke.rotation.set(-0.25, 0.1, 0.2);
    musician.hands[1].add(uke);
    game.npcs.push(new Sitter(game, musician, { x: mx, z: mz, ry: mry, seat: 0.1,
      cries: ["Three chords is all you need, really.", "Careful, puss — that's out of tune, not broken.", "Sea air's terrible for the strings."] }));
    U.push((dt, t) => { const A = musician.arms[1]; A.el.rotation.x = -1.0 + sin(t * 5.4) * 0.22; A.sh.rotation.z = -0.15; }); }
  // three friends dance a ring on the quiet dune grass west of the huts — Sunny Shore never had a dance circle, only the two ring-dances inland
  { game.zones.addCircle(-42, -22, 2.4);
    const dancers = [false, true, false].map((lady) => beachPerson(lady, false));
    game.npcs.push(new RingDance(game, dancers, { cx: -42, cz: -22, r: 1.8, speed: 0.5, turnEvery: 10, cryIcon: '💃',
      cries: ['Somebody find the beat, we lost it!', "Careful, puss, you'll get trodden on!", 'One more turn before the tide comes in!'] })); }
  // the Neighborhood, Victorian, Frosty Peak and Whisper Woods all have a swing set, but Sunny Shore's
  // children never had anywhere to just sit and swing — a sun-bleached set planted in the dry sand north
  // of the lifeguard chair, well clear of the sunbathers and the dune games
  { const sx = 8, sz = 27;
    const swingSet = makeSwingSet({ color: 0xd9a84a }); place(game, U, swingSet, sx, sz, PI);
    game.zones.add(sx, sz, 3.4, 3.2);
    for (const px of [-1.3, 1.3]) P.addBox(sx + px, 1.4, sz, 0.4, 2.8, 1.3, { cam: false });
    const swingKid = beachPerson(r.chance(0.5), true);
    const sw = new Swinger(game, swingKid, swingSet, { x: sx, z: sz }); game.npcs.push(sw); greetable(game, sw);
    game.addInteractable({ obj: swingSet, radius: 2.8, label: () => 'Push the swing', onUse: () => { sw.boost = 1; SFX.talk(); game.toast('🎠 "Higher! Higher!"', 1800); } }); }
  // the Neighborhood, Candy Land, Robot City and Victorian all paired their swing set with a seesaw —
  // Sunny Shore's swing set (above) never got one. A headless probe swept the dry dune sand north of it
  // against every physics box, NPC circle and wandering rig's own position, sampled over 20 simulated
  // seconds so a Wanderer mid-leash wouldn't be missed: (8, 38) came back clear by at least 6.3 m
  // throughout, 11 m past the swing set itself and well short of the region fill that only starts past
  // 58 m out. Terrain here isn't flat (the dune rises gently inland), so, unlike the swing set's own fixed
  // y, the seesaw is ground-following with `placeT`.
  { const sx = 8, sz = 38;
    const seesaw = makeSeesaw({ color: 0x2e9e6e }); placeT(game, U, seesaw, sx, sz, 0);
    game.zones.add(sx, sz, 2.4, 1.2);
    P.addBox(sx, game.physics.ground0(sx, sz) + 0.35, sz, 2.9, 0.7, 0.6, { cam: false });
    const seeA = beachPerson(false, true), seeB = beachPerson(true, true);
    game.npcs.push(new Seesaw(game, seeA, seeB, seesaw, { x: sx, z: sz })); }
  // the Neighborhood and Candy Land both have a trampoline bouncing a child by now — Sunny Shore, for
  // all its swing set and seesaw just above, never had one. A sea-turquoise trampoline now bounces a
  // beach kid on the dry sand south-west of the dune patroller's own loop. Same `makeTrampoline` prop
  // and `Bouncer` controller the Neighborhood's backyard and Candy Land's sweet-lands already use, just
  // restriped, and `beachPerson(child, true)` for the kid instead of a fresh `makeHuman` call, since
  // every other child on this beach already comes from that one helper. A headless probe (the stub-three
  // harness `test/run.mjs` itself uses, driven by hand with `game.travel(4, 'from-hub')`) sampled every
  // NPC's and the squirrel's own position every quarter second over 300 simulated seconds — long enough
  // for the dune patroller's own rectangle, every wandering sunbather, crab, turtle, seagull and dolphin
  // to clear the spot several times over — then swept a 2 m grid of the dry sand (x < 10, radius 10-50,
  // short of the radius (58) where beachRegion's own fill takes over) against both those samples and all
  // 303 of the beach's physics boxes: (-8, -40) came back clear by 15.1 m of the nearest box and 14.6 m
  // of the nearest other soul, ground flat (height 0) across the whole footprint.
  { const tx = -8, tz = -40;
    const tramp = makeTrampoline({ color: 0x2ec4b6 }); placeT(game, U, tramp, tx, tz, 0);
    P.addBox(tx, game.physics.ground0(tx, tz) + 0.21, tz, 1.1, 0.42, 1.1, { cam: false });
    const bounceKid = beachPerson(r.chance(0.5), true);
    game.npcs.push(new Bouncer(game, bounceKid, tramp, { x: tx, z: tz, ry: PI, height: 0.68, cycle: 1.05 }));
    const bounceLines = ["Higher than the lifeguard's chair, nearly!", "Careful, puss — mind the springs, they're full of sand.", "Bet I could land clean in the sea from up here!"];
    let bounceCryT = r.range(3, 7);
    U.push((dt) => { bounceCryT -= dt; if (bounceCryT <= 0) { bounceCryT = r.range(8, 14); const c = game.cat.group.position; if (dist2(tx, tz, c.x, c.z) < 400) { game.toast('🤸 "' + r.pick(bounceLines) + '"', 2400); SFX.talk(); } } }); }
  // a sand sculptor works alone in the quiet far south-west dune — the sandcastle up north already has
  // its own patter of a kid, but nobody on this whole beach had ever built something properly ambitious.
  // A headless probe built the real game, travelled to Sunny Shore, sampled every NPC's own position
  // (and the squirrel's) continuously over 30 simulated seconds, and swept a grid of candidate points on
  // dry sand (ground height above 0.15 m, to stay off the wet shore) against every physics box in the
  // fully built world, region fill included: (-30, -54) came back the clearest spot on the whole map, at
  // least 22 m from the nearest other soul or collider in any direction — well past the dune patroller's
  // own loop and the birdwatcher further north
  { const sx = -30, sz = -54, kx = sx - 1.4, kz = sz + 0.7;
    const turtle = makeSandTurtle(); placeT(game, U, turtle, sx, sz, 0.4);
    boxT(game, sx, sz, 1.9, 1.1, 2.1, { cam: false });
    const sculptWard = makeWardrobe(r, { shirts: [0xdcd3b8, 0xc9a86a, 0x8a9a6a], pants: [0x3a3a2a, 0x2a2a2a], shoes: [0x5a4530, 0x2a2018] });
    const sculptor = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: sculptWard }),
      hat: r.chance(0.5) ? 'sunhat' : null, hatColor: 0xd9c9a8, shorts: true, jacket: null, scarf: null, bag: null }); W.add(sculptor.group);
    const trowel = group(0, 0.02, 0.1, sculptor.hands[1]); trowel.rotation.x = -0.4;
    mesh(G.box(0.02, 0.1, 0.06), mat(0x8a8a8a, { metalness: 0.4, roughness: 0.5 }), { y: 0.05, parent: trowel });
    game.npcs.push(new Kneeler(game, sculptor, { x: kx, z: kz, ry: atan2(sx - kx, sz - kz), cryIcon: '🐢',
      cries: ['Took all morning, just the shell.', "Careful, puss — one tail flick and it's rubble.", "Tide won't reach this far up. I hope."] })); }
  // the surfer above waxes a board, but nobody on this whole beach had ever actually geared up to go
  // *in* the water themselves — a snorkeler sits on the dry sand near the shore, pulling a fin on, mask
  // pushed up on their forehead, the other fin still waiting on the sand beside them. A headless probe
  // built the real Sunny Shore, sampled every NPC's and the squirrel's own position continuously over 30
  // simulated seconds (so no wandering crab, turtle or sunbather mid-circuit could slip past unnoticed),
  // and swept a grid of the dry sand (ground height 0.35-1.0 m, to stay off both the wet shore and the
  // dune grass) against those samples and every physics box: (21.5, -51.5) came back clear by 8.9 m in
  // every direction, south of the gem cluster at (16.5, -41) and well past the fish-and-chips stand
  // further west — facing east, out toward the water.
  { const kx = 21.5, kz = -51.5, ry = PI / 2;
    const snorkWard = makeWardrobe(r, { shirts: [0x2f6fd6, 0xff7043, 0x2e9e6e], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const snorkeler = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: snorkWard }),
      shorts: true, hat: null, jacket: null, scarf: null, bag: null, glasses: false }); W.add(snorkeler.group);
    // the mask, pushed up on the forehead, snorkel tube curling back from it
    const maskMat = mat(0x2a2a2a, { roughness: 0.6 }), lensMat = mat(0x8fd6ff, { roughness: 0.2, transparent: true, opacity: 0.6 });
    const mask = group(0, 0.16, 0.05, snorkeler.head); mask.rotation.x = -0.3;
    mesh(G.box(0.14, 0.07, 0.03), maskMat, { parent: mask });
    mesh(G.box(0.1, 0.045, 0.01), lensMat, { z: 0.02, shadow: 'none', parent: mask });
    mesh(G.cyl(0.012, 0.012, 0.22, 6), maskMat, { x: 0.08, y: 0.05, rz: 0.4, parent: mask });
    // the spare fin, waiting on the sand beside them
    const finMat = mat(0x2f6fd6, { roughness: 0.6 });
    const fin = group(kx + 0.5, 0.02, kz, W); fin.rotation.y = ry + 0.3;
    mesh(G.box(0.1, 0.03, 0.42), finMat, { z: 0.15, shadow: 'both', parent: fin });
    mesh(G.box(0.14, 0.02, 0.1), finMat, { z: -0.1, shadow: 'both', parent: fin });
    boxT(game, kx + 0.5, kz, 0.3, 0.1, 0.5, { cam: false });
    game.npcs.push(new Kneeler(game, snorkeler, { x: kx, z: kz, ry, cryIcon: '🤿',
      cries: ['Nearly got this fin strap right.', "Careful, puss — mind your tail, these snap.", "Clearest water of the week, out there."] })); }
  // the Neighborhood, Candy Land, Robot City, Victorian, Frosty Peak and Whisper Woods all have a kid
  // working a yo-yo by now, but Sunny Shore — for all its ball game, tag, swing, seesaw and ring dance —
  // never had one. A child now works a yo-yo on the open dry sand south of the lighthouse, well clear of
  // the beachcomber, the birdwatcher and the conch shell. `YoYoer` needs no held prop beyond what it
  // builds itself — the disc and string hang straight off `rig.hands[1]` — so this is a placement, not a
  // build, reusing the same `beachPerson()` wardrobe helper every other beachgoer in this file already
  // draws from. A headless probe built the real Sunny Shore, sampled every NPC's and the squirrel's own
  // position every quarter second over 30 simulated seconds (so no wandering crab, turtle, sandpiper or
  // dolphin mid-leap could slip past unnoticed), then swept a grid of the open dry sand (ground height
  // 0.3-2.0 m, radius ≤ 50, short of the radius (58) where beachRegion's own fill takes over) against
  // both those samples and every one of the beach's own physics boxes: (-14, -48) came back clear by
  // 13.1 m of the nearest box and 13.4 m of the nearest other soul (the conch shell and the birdwatcher,
  // equally distant).
  { const yx = -14, yz = -48;
    game.npcs.push(new YoYoer(game, beachPerson(r.chance(0.5), true), 0x2f6fd6, { x: yx, z: yz, ry: atan2(0 - yx, 0 - yz),
      cries: ["Forty drops, and the gulls still haven't noticed!", 'Careful — it swings wider than it looks, out here.', "Nearly got it to loop that time."] })); }
  // Whisper Woods has a hula hooper by now, but Sunny Shore never had one — and a hoop belongs on a
  // beach at least as much as in a glade. A child now works one on the open dry sand north of the dunes,
  // well clear of the squirrel's own patch and the gem cluster beside it. `HulaHooper` needs no held
  // prop, just a ring parented to the body at waist height, so this is a placement, not a build, reusing
  // the same `beachPerson()` wardrobe helper the yo-yo kid above already draws from. A headless probe
  // built the real Sunny Shore, sampled every NPC's and the squirrel's own position every quarter second
  // over 30 simulated seconds (so no wandering crab, turtle, sandpiper or dolphin mid-leap could slip
  // past unnoticed), then swept a grid of the open dry sand (ground height 0.3-2.0 m, radius ≤ 50, short
  // of the radius (58) where beachRegion's own fill takes over) against both those samples and every one
  // of the beach's own physics boxes: (-24, 36) came back clear by 8.1 m of the nearest box (the gem
  // cluster) and 16.3 m of the nearest other soul.
  { const hx = -24, hz = 36;
    game.npcs.push(new HulaHooper(game, beachPerson(r.chance(0.5), true), r.pick([0xff6fb5, 0xffd54a, 0x7fe0ff]), { x: hx, z: hz, ry: atan2(0 - hx, 0 - hz), cryIcon: '⭕',
      cries: ["A hundred spins and counting!", "Better than swimming for keeping warm.", "The crabs just stare — never join in."] })); }
  // every other world has a jump-roper by now; Sunny Shore had the yo-yo and hula hoop above but never
  // the rope. `JumpRoper` needs no held prop beyond the loose grip at each hand it builds itself, so this
  // is a placement, not a build, reusing the same `beachPerson()` wardrobe helper as the two kids above.
  // A headless probe built the real Sunny Shore, sampled every NPC's and the squirrel's own position
  // every quarter second over 30 simulated seconds (so no wandering crab, turtle, sandpiper or dolphin
  // mid-leap could slip past unnoticed), then swept a grid of the open dry sand (ground height 0.2-2.0 m,
  // radius ≤ 50, short of the radius (58) where beachRegion's own fill takes over, and clear of every
  // hand-reserved zone in this file) against both those samples and every one of the beach's own physics
  // boxes: (-39, 30.5) came back clear by 8.7 m of the nearest box (a dune palm) and 9.6 m of the nearest
  // other soul (the tag game out past the dunes).
  { const jx = -39, jz = 30.5;
    game.npcs.push(new JumpRoper(game, beachPerson(r.chance(0.5), true), 0xa8ff9a, { x: jx, z: jz, ry: atan2(0 - jx, 0 - jz), cryIcon: '➰',
      cries: ["Thirty in a row, watch!", "Careful, puss — don't trip over the rope.", "Sand makes it twice the workout, honest."] })); }
  // the Neighborhood, Robot City, Victorian and Whisper Woods all pair a stroller with a dog on a
  // lead (`DogWalker`), but Sunny Shore's own dog, just below, only ever had its own patch of sand to
  // wander — nobody here had come for an actual walk. `DogWalker`'s own friend key is now configurable
  // (`o.key`, defaulting to `'dog'`) so this one claims `'walked-dog'` instead, leaving the beach dog's
  // own claim on the plain `'dog'` key untouched. A headless probe built the real Sunny Shore
  // (`game.load(4, 'from-prev')`), sampled every NPC's and the squirrel's own position every quarter
  // second over 30 simulated seconds (so no wandering crab, turtle or sunbather mid-circuit could slip
  // past unnoticed), then swept the dry dune sand (ground height 0.25-2.2 m, radius ≤ 48, short of the
  // radius (58) where beachRegion's own fill takes over) against both those samples and every physics
  // box: (-30, -36) came back clear by 8.6 m of the nearest box (the conch shell) and 15.2 m of the
  // nearest other soul (the sand sculptor further south).
  { const dwx = -30, dwz = -36, dwry = atan2(0 - dwx, 0 - dwz);
    const walker = beachPerson(r.chance(0.5), false);
    const strollDog = makeDog(0x4a3a2a);
    game.npcs.push(new DogWalker(game, walker, strollDog, { x: dwx, z: dwz, angle: dwry, speed: 0.85, leash: 4, key: 'walked-dog',
      cries: ["She won't go near the water, bless her.", 'Careful, puss — mind your tail, she only wants a sniff.', "Same walk every morning. She picks the route."] })); }
  // the Neighborhood, Candy Land, Robot City and Victorian all have a kid kneeling by a wobbly scooter
  // (`makeScooter()` + `Kneeler`) by now; Sunny Shore never had one. A boy kneels in the dry dune sand
  // north-west of the squirrel's patch, tightening the back wheel. Same pairing as the other four, no new
  // controller — only the terrain-aware `placeT`/`boxT` helpers in place of the other worlds' flat-floor
  // `place()` + `P.addBox()`, since Sunny Shore's sand has real slope under it. A headless probe built the
  // real Sunny Shore (`game.load(4, 'from-hub')`), sampled every NPC's and the squirrel's own position
  // every quarter second over 30 simulated seconds (so no wandering crab, turtle, sunbather, kite flyer or
  // dolphin mid-circuit could slip past unnoticed), then swept a 1 m grid of the dry dune sand (ground
  // height 0.25-2.2 m, radius ≤ 50, short of the radius (58) where beachRegion's own procedural fill takes
  // over) against both those samples and every one of the beach's own physics boxes: (-48, 12) came back
  // clear by 9.75 m of the nearest box (a dune palm) and 16.6 m of the nearest other soul, at radius 49.5
  // from the origin.
  { const sx = -48, sz = 12, kx = -48.9, kz = 12, ry = atan2(sx - kx, sz - kz);
    const scooter = makeScooter(0x3fc9a8); placeT(game, U, scooter, sx, sz, 0, 0.4);
    boxT(game, sx, sz, 0.3, 0.8, 0.6, { cam: false });
    const scootKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: beachWard }), hat: null, glasses: false });
    W.add(scootKid.group);
    game.npcs.push(new Kneeler(game, scootKid, { x: kx, z: kz, ry,
      cries: ['Sand in the back wheel again — nearly got it.', 'Careful, puss — mind your tail, this spins.', 'Good as new. Right down the boardwalk, no hands, easy.'] })); }
  // the Neighborhood, Robot City, Victorian and Candy Land all have a kid chalking a row of hopscotch
  // squares by now (`Kneeler` + six colour-coded `G.plane` decals); Sunny Shore never had one. A girl
  // kneels in the dry dune sand south-west of the dog walker's own route, drawing straight onto the sand
  // itself rather than paving or grass. `Kneeler` already asks `ground0()` for its own rig's height
  // regardless of world, so only the six decal squares need it explicitly here — each is placed at its
  // own `P.ground0(gx, gz)` rather than the other three worlds' single flat `y`, since the sand underfoot
  // has real slope. A headless probe built the real Sunny Shore (`game.load(4, 'from-hub')`), sampled
  // every NPC's and the squirrel's own
  // position every quarter second over 30 simulated seconds (so no wandering crab, turtle, sunbather,
  // kite flyer or dolphin mid-circuit could slip past unnoticed), then swept a 1 m grid of the open dry
  // sand (ground height 0.2-2.4 m, radius ≤ 50, short of the radius (58) where beachRegion's own
  // procedural fill takes over) against both those samples and every one of the beach's own physics
  // boxes: the six-square run from (-25, -43) to (-22.1, -43) came back clear by 7.0-8.25 m of the
  // nearest box and 8.59-9.88 m of the nearest other soul (the dog walker), at radius 49.7 from the
  // origin.
  { const gz = -43, kx = -25.9, kz = -43, squares = [];
    const squareColors = [0xffb3c6, 0xbde0fe, 0xfff3b0, 0xb9fbc0, 0xcdb4db, 0xffc8dd];
    for (let i = 0; i < 6; i++) { const gx = -25 + i * 0.58; squares.push([gx, gz]);
      mesh(G.plane(0.48, 0.48), mat(squareColors[i], { roughness: 0.95, transparent: true, opacity: 0.85 }), { x: gx, y: P.ground0(gx, gz) + 0.018, z: gz, rx: -PI / 2, shadow: 'none', parent: W }); }
    const chalker = makeHuman({ ...randomPerson(r, { female: true, child: true, wardrobe: beachWard }), hairStyle: 'braids', hat: null, glasses: false });
    W.add(chalker.group);
    const chalk = group(0, 0.02, 0.09, chalker.hands[0]); chalk.rotation.x = -0.5;
    mesh(G.cyl(0.014, 0.014, 0.09, 6), mat(0xf7f3ec, { roughness: 0.9 }), { y: 0.045, parent: chalk });
    game.npcs.push(new Kneeler(game, chalker, { x: kx, z: kz, ry: atan2(squares[0][0] - kx, squares[0][1] - kz),
      cries: ['Six squares, dry before the tide turns.', 'Careful, puss — mind the chalk lines!', "Sand draws better than pavement, honestly — smoother lines."] })); }
  // Robot City, the Neighborhood, Victorian and Candy Land have all had a marbles ring by now — the
  // oldest pavement game of all — but Sunny Shore never had one. A boy kneels in the dry dune sand
  // north of the dog walker's own route, flicking marbles at a chalked ring drawn straight onto the
  // sand. Same `Kneeler` pairing as the other four, no new controller — only the terrain-aware
  // `P.ground0()` lookup in place of the flat-floor worlds' fixed `y`, since the sand underfoot has
  // real slope here. A headless probe built the real Sunny Shore (`game.load(4, 'from-hub')`), stepped
  // the real game loop for 30 simulated seconds (so no wandering crab, turtle, sunbather, kite flyer,
  // dog walker or chalker mid-circuit could slip past unnoticed) sampling every NPC's and the
  // squirrel's own position every quarter second, then swept a 1 m grid of the dry dune sand (x < 12,
  // west of the wet-sand/sea zone; radius ≤ 50, short of the radius (58) where beachRegion's own
  // procedural fill takes over) against both those samples and every one of the beach's 195 physics
  // boxes: (-33, 20) came back clear by 8.9 m of the nearest box and 12.1 m of the nearest other soul,
  // at radius 38.6 from the origin, on a gentle slope (ground height 0.49-0.52 m) well clear of every
  // hand-placed hut, palm and zone on this shore.
  { const mcx = -33, mcz = 20, mkx = mcx - 0.9, mkz = mcz, mry = atan2(mcx - mkx, mcz - mkz);
    mesh(G.torus(0.5, 0.025, 6, 24), mat(0xf7f3ec, { roughness: 0.95, transparent: true, opacity: 0.85 }), { x: mcx, y: P.ground0(mcx, mcz) + 0.02, z: mcz, rx: -PI / 2, shadow: 'none', parent: W });
    const marbleColors = [0xff6fb5, 0x7fe0ff, 0xffd54a, 0xb9fbc0, 0x8a5acf];
    const marblePos = [[-0.22, 0.12], [0.18, -0.16], [0.02, 0.26], [-0.3, -0.1], [0.3, 0.05]];
    for (let i = 0; i < marblePos.length; i++) { const px = mcx + marblePos[i][0], pz = mcz + marblePos[i][1]; mesh(G.sphere(0.035, 8, 6), mat(marbleColors[i], { roughness: 0.2 }), { x: px, y: P.ground0(px, pz) + 0.035, z: pz, shadow: 'none', parent: W }); }
    mesh(G.sphere(0.035, 8, 6), mat(0xffd54a, { roughness: 0.2 }), { x: mkx + 0.35, y: P.ground0(mkx + 0.35, mkz) + 0.035, z: mkz, shadow: 'none', parent: W });   // the shooter, paused mid-flick just outside the ring
    const marbleKid = makeHuman({ ...randomPerson(r, { female: false, child: true, wardrobe: beachWard }), hat: null, glasses: false }); W.add(marbleKid.group);
    game.npcs.push(new Kneeler(game, marbleKid, { x: mkx, z: mkz, ry: mry,
      cries: ["Watch close — I never miss.", "Careful, puss — don't swallow one of these.", "Won every single one, fair and square."] })); }
  // every kind of sea spray and spark has drifted over this coast by now — gull cries, wave foam, sand
  // sparkle off the conch and the chest — but nothing here had ever actually bubbled. A girl blows soap
  // bubbles from a loop-ended wand on the dune grass north of the net-mender and the surfer, two afloat
  // at a time, drifting up and sideways on the sea breeze before each pops into a soft sparkle. The wand
  // sits in `hands[1]` — the resting hand every other held prop in this file already keeps steady, never
  // the one `makeHuman`'s own idle gestures swing — so `wand.getWorldPosition()` only has to be read once,
  // right after `Charger` sets the rig's own fixed position and rotation, to get an exact launch point for
  // both bubbles; no manual trig, and nothing to re-read every frame since this child never moves. Driven
  // only by the world clock `t` off two fixed phases, never this world's own seeded `r`, so it costs no
  // later wardrobe or colour pick. A headless probe (the same stub-three harness `test/run.mjs` uses)
  // built the real Sunny Shore (`game.travel(4, 'from-hub')`, then `game.start('new')` so every crab,
  // turtle, sunbather, dolphin and dog actually moved), sampled every NPC's and the squirrel's own
  // position every quarter second over 30 simulated seconds, then swept the dune grass against both those
  // samples and every one of the beach's 231 physics boxes: (-22, 46) came back clear by 7.9 m of the
  // nearest box (a dune palm) and 7.7 m of the nearest other soul, well inside the radius (58) where
  // beachRegion's own fill takes over.
  { const bkx = -22, bkz = 46, bkry = atan2(-bkx, -bkz);
    const blower = beachPerson(true, true);
    const wand = group(0.02, 0, 0.1, blower.hands[1]); wand.rotation.set(-0.3, 0, 0.3);
    mesh(G.cyl(0.012, 0.012, 0.14, 6), mat(0xffd54a, { roughness: 0.6 }), { y: 0.07, parent: wand });
    mesh(G.torus(0.055, 0.009, 6, 16), mat(0xf7f3ec, { roughness: 0.3, transparent: true, opacity: 0.6 }), { y: 0.16, parent: wand });
    game.npcs.push(new Charger(game, blower, { x: bkx, z: bkz, ry: bkry, cryIcon: '🫧',
      cries: ["Careful, puss — don't pop them with your nose!", 'Lasts longer in this sea air, somehow.', "Watch this one — it's a big one."] }));
    const tip = V3(); wand.getWorldPosition(tip);
    const bubbleM = mat(0xeaffff, { pbr: true, metalness: 0.05, roughness: 0.1, transparent: true, opacity: 0.4 });
    const bubbles = [0, 1].map((i) => ({ m: mesh(G.sphere(0.05, 10, 8), bubbleM, { shadow: 'none', parent: W }), ph: i * 1.8, popped: -1 }));
    const cyc = 3.2;
    U.push((dt, t) => {
      for (const b of bubbles) {
        const k = ((t + b.ph) % cyc) / cyc;
        if (k < 0.92) {
          b.m.visible = true;
          b.m.position.set(tip.x + sin(t * 1.6 + b.ph) * 0.18 * k, tip.y + k * 1.5, tip.z + cos(t * 1.1 + b.ph) * 0.12 * k);
          b.m.scale.setScalar(0.4 + k * 0.7);
        } else {
          b.m.visible = false;
          const cycleNo = floor((t + b.ph) / cyc);
          if (cycleNo !== b.popped) { b.popped = cycleNo;
            const c = game.cat.group.position;
            if (dist2(tip.x, tip.z, c.x, c.z) < 400) { SFX.twinkle(); game.fx.emit(b.m.position.x, b.m.position.y, b.m.position.z, { count: 4, colors: [0xeaffff, 0xffffff, 0xbfe8ff], speed: 0.5, up: 0.6, life: 0.5, gravity: 1.5 }); }
          }
        }
      }
    }); }
  // Victorian's own street photographer (round 396) ducks under a dark cloth to capture its market
  // square, and Robot City's archive-bot files its own tripod shots of Sector 7 — but nobody on this
  // whole coast had ever pointed a camera at the view it is actually famous for. A holidaymaker now
  // stands behind an old box camera on the open sand between the palms and the dune, facing out over
  // the water, bending under the cloth every so often to compose a shot before springing straight as
  // the shutter fires — same beat, same `Photographer` controller and `makeOldCamera()` prop Victorian's
  // own photographer already uses, just a tourist in beach wardrobe rather than a Victorian gentleman.
  // A headless probe (a scratch script built on the same stub-three harness `test/run.mjs` itself uses,
  // since there's no browser here to look at it) built the real Sunny Shore (`game.load(4, 'from-hub')`,
  // then `game.start('new')` so every crab, turtle, sunbather, dolphin and dog actually moved), sampled
  // every NPC's and the squirrel's own position every quarter second over 300 simulated seconds, then
  // swept a 1 m grid of the dry sand (x ≤ 11, short of the wet-sand zone, radius ≤ 50, short of the
  // radius (58) where beachRegion's own fill takes over) against both those samples and every one of
  // the beach's own physics boxes: (-17, 20) came back clear by 7.7 m of the nearest box (a dune palm)
  // and 7.3 m of the nearest other soul (the tag game's own leash, further west), at radius 26.2 from
  // the origin — between the squirrel's patch and the gem cluster, facing due east out over the sea.
  { const phx = -17, phz = 20, phry = PI / 2;   // facing due east, out over the open sea
    const camWard = makeWardrobe(r, { shirts: [0xf5f2ea, 0xffe0ea, 0xdcedf7], pants: [0x2f6fd6, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const snapper = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: camWard }),
      hat: 'sunhat', hatColor: 0xd9c9a8, glasses: r.chance(0.4), shorts: true, jacket: null, scarf: null, bag: null });
    W.add(snapper.group);
    const camera = makeOldCamera();
    game.npcs.push(new Photographer(game, snapper, camera, { x: phx, z: phz, ry: phry, cryIcon: '📷',
      cries: ['Hold still — the plate takes a few seconds!', 'Best light on the coast, this time of day.', "Careful, puss — it's only flash powder, not fire."] })); }
  // Victorian has had a draughts table since round 354, Robot City a checkers drum since round 384,
  // Frosty Peak a card table since round 397, Whisper Woods its own draughts board since round 407 and
  // the Neighborhood a chess set since round 408 — but Sunny Shore, for all its sand, never had the one
  // board game that is actually played with sand's own leftovers. A driftwood mancala board now lies
  // between two beachgoers seated either side on the open dune sand, a mid-game spread of dark pebbles
  // down one row and pale cowrie shells down the other, a scooped hoard of each already banked in the
  // store pit at both ends. **"Six shells to your five pebbles — I'm not losing this one."** *"Careful,
  // puss — one flick of your tail and we start the whole row over."* *"Loser fetches the next round of
  // ice lollies, same as always."*
  // No new controller: both players are a plain `Sitter`, the same pairing every other table game in
  // this file already uses, each on a `makeIceStool()` — the same generic three-legged stool the
  // draughts, card and chess tables all reuse too. Unlike those four, though, a mancala board seats its
  // two players along its long sides rather than its short ends (each player owns the row of six pits
  // nearest their own seat, with a store pit at either end of the board belonging to neither row), so
  // the seats sit offset in *z* here instead of the other tables' *x*, and the two rows of pits run
  // along the board's own x-axis between them. Terrain-aware `placeT`/`boxT` in place of the flat-floor
  // worlds' `place()`/`P.addBox()`, since the sand underfoot has real slope out here too, same reasoning
  // Frosty Peak's own card table already relied on.
  // A headless probe (a scratch script built on the same stub-three harness `test/run.mjs` itself uses,
  // since there's no browser here to look at it) built the real Sunny Shore (`game.travel(4,
  // 'from-hub')`, then `game.start('new')` so every crab, turtle, sunbather, dolphin, dog and dancer
  // actually moved), sampled every NPC's and the squirrel's own position every quarter second over 300
  // simulated seconds, then swept a 1 m grid of the dry dune sand (x ≤ -12, radius 10-50, short of the
  // radius (58) where beachRegion's own fill takes over) against both those samples and all 192 of the
  // beach's physics boxes: (-32, -21) came back clear by 7.72 m of the nearest box and 8.06 m of the
  // nearest other soul (the dune ring-dance at (-42, -22)), at radius 38.3 from the origin, on a gentle
  // slope (ground height 0.50 m).
  { const tx = -32, tz = -21, topY = 0.72, boardLen = 0.92, boardDep = 0.28;
    const seatAx = tx, seatAz = tz - 0.5, seatBx = tx, seatBz = tz + 0.5;
    const ty0 = P.ground0(tx, tz);
    const wood = mat(0x8a6a42, { roughness: 0.85, map: TEX.planks(30, 10) });
    const table = group(tx, ty0, tz, W);
    mesh(G.box(boardLen, 0.04, boardDep), wood, { y: topY, parent: table });
    mesh(G.cyl(0.18, 0.2, 0.04, 12), wood, { y: 0.02, parent: table });
    mesh(G.cyl(0.05, 0.07, topY, 8), wood, { y: topY / 2, parent: table });
    const pitM = mat(0x4a3220, { roughness: 0.9 }), shellM = mat(0xf0e4c8, { roughness: 0.6 }), pebbleM = mat(0x5a5048, { roughness: 0.3 });
    const addCounters = (gx, gz, n, isShell) => { for (let i = 0; i < n; i++) {
      const ang = i * 2.4, rr = Math.min(0.012 + i * 0.006, 0.022), ox = cos(ang) * rr, oz = sin(ang) * rr;
      if (isShell) mesh(G.sphere(0.016, 8, 6), shellM, { x: gx + ox, y: topY + 0.021, z: gz + oz, sy: 0.55, parent: table });
      else mesh(G.sphere(0.015, 8, 6), pebbleM, { x: gx + ox, y: topY + 0.021, z: gz + oz, parent: table });
    } };
    const pitXs = [-0.27, -0.162, -0.054, 0.054, 0.162, 0.27];
    const rowACounts = [4, 1, 3, 0, 2, 4], rowBCounts = [2, 4, 0, 3, 1, 2];   // A's row (pebbles, nearest seatA) / B's row (shells, nearest seatB)
    for (let i = 0; i < 6; i++) {
      mesh(G.cyl(0.042, 0.042, 0.012, 12), pitM, { x: pitXs[i], y: topY + 0.016, z: -0.075, parent: table }); addCounters(pitXs[i], -0.075, rowACounts[i], false);
      mesh(G.cyl(0.042, 0.042, 0.012, 12), pitM, { x: pitXs[i], y: topY + 0.016, z: 0.075, parent: table }); addCounters(pitXs[i], 0.075, rowBCounts[i], true);
    }
    for (const sx of [-0.37, 0.37]) mesh(G.cyl(0.08, 0.08, 0.014, 14), pitM, { x: sx, y: topY + 0.017, parent: table });
    addCounters(-0.37, 0, 6, true); addCounters(0.37, 0, 5, false);
    boxT(game, tx, tz, boardLen + 0.1, topY, boardDep + 0.3, { cam: false });
    placeT(game, U, makeIceStool(), seatAx, seatAz, PI); placeT(game, U, makeIceStool(), seatBx, seatBz, 0);
    const playerA = beachPerson(r.chance(0.5), false), playerB = beachPerson(r.chance(0.5), false);
    game.npcs.push(new Sitter(game, playerA, { x: seatAx, z: seatAz, ry: 0, seat: 0.3,
      cries: ["Six shells to your five pebbles — I'm not losing this one.", "Careful, puss — one flick of your tail and we start the whole row over.", "Loser fetches the next round of ice lollies, same as always."] }));
    game.npcs.push(new Sitter(game, playerB, { x: seatBx, z: seatBz, ry: PI, seat: 0.3,
      cries: ["Pebbles don't lie — I'm two scoops ahead.", "Mind your paws, puss, that store's not finished filling yet.", "Best two out of three, same as every afternoon."] })); }
  // a frisbee belongs on a beach as much as the ball game and the kite already do, and nobody on this
  // whole coast had ever thrown one. A solo player now stands on the open dry sand well south of the
  // mancala table, tossing a disc straight up off the palm — it rises on a spin, hangs a beat at the
  // top, and drops back into the hand for the next throw. New `FrisbeePlayer` controller (`55-npcs.js`,
  // next to `HulaHooper`): the disc is parented to `rig.hands[1]` like the yo-yo's own string, so no
  // held prop and no new build step, just the one eased rise-and-drop curve the yo-yo's own drop-and-
  // hover already uses, run upward instead of down.
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses, since
  // there's no browser here to look at it) built the real Sunny Shore (`game.load(4, 'from-hub')`, then
  // `game.start('new')` so every crab, turtle, sunbather, dolphin and dog actually moved), sampled every
  // NPC's and the squirrel's own position every quarter second over 300 simulated seconds, then swept a
  // 1 m grid of the dry sand (ground height 0.15-2.2 m, radius 8-50, short of the radius (58) where
  // beachRegion's own fill takes over) against both those samples and all 216 of the beach's own physics
  // boxes: (-19, -14) came back clear by 7.60 m of the nearest box and 9.43 m of the nearest other soul,
  // at radius 23.6 from the origin, well south of the mancala table (-32, -21).
  { const fx = -19, fz = -14;
    game.npcs.push(new FrisbeePlayer(game, beachPerson(r.chance(0.5), false), r.pick([0xff6f3c, 0xffd54a, 0x7fe0ff]), { x: fx, z: fz, ry: atan2(0 - fx, 0 - fz), cryIcon: '🥏',
      cries: ["Highest throw yet, that one!", "Careful, puss — mind your head on the way down.", "Wind's just right for this, out here."] })); }
  // the beach dog keeps to its own patch of sand — it does not follow the cat
  const dog = makeDog(0xc8925a); W.add(dog.group); game.npcs.push(new Wanderer(game, dog, { x: -2, z: 28, speed: 1.1, leash: 7, r: 0.35, height: 0.9, step: 0.3, idle: [1.5, 4], walk: [2, 5] }));
  let woofT = rnd.range(6, 12); U.push((dt) => { woofT -= dt; if (woofT <= 0) { SFX.woof(); woofT = rnd.range(10, 20); } });
  { const did = game.namedFriend('dog'); game.addInteractable({ obj: dog.group, radius: 2.4, label: () => 'Pet the dog', onUse: () => { game.befriend(did); SFX.woof(); game.hearts(dog.group.position.x, 0.8, dog.group.position.z, 4); game.toast('🐕 *happy tail wag*'); } }); }
  const sq = new Squirrel(game, -22, 8, 'sq-beach'); game.squirrels.push(sq);
  makeGemCluster(game, U, 16.5, -41, 7, [0x7fe0ff, 0xffd54a, 0xa8ff9a], r, 1.6); makeGemCluster(game, U, -29, 31, 5, [0xff6fb5, 0x7fe0ff, 0xc8a2ff], r, 1.2);
  // gull cries + waves near the shore
  let cryT = 4, waveT = 2;
  U.push((dt) => { cryT -= dt; waveT -= dt; const cx = game.cat.group.position.x; if (cryT <= 0) { SFX.gull(); cryT = rnd.range(6, 14); } if (waveT <= 0 && cx > 4) { SFX.wave(); waveT = rnd.range(4, 7); } });

  // every rock, shell and pebble scattered up and down this coast has been pure background dressing
  // since round 1 — nothing on the whole beach was ever something to stop and listen to. A single big
  // conch, half-buried in the dry sand, lets the cat press an ear to its mouth for a soft wave-wash
  // sound, a scatter of pale, sandy sparks, and one of three dry lines. A headless probe built the real
  // Sunny Shore, sampled every NPC's and the squirrel's own position continuously over 20 simulated
  // seconds (so no wandering crab, turtle or sunbather mid-circuit could slip past unnoticed), and swept
  // a grid of the open dry sand against those samples and every physics box: (-20, -36) came back clear
  // by 4.1 m from the nearest box and 12 m from the nearest soul — between the sand-crab boy, the
  // birdwatcher and the sand sculptor, with nothing else anywhere nearby. A fixed rotation, not a draw
  // from this world's own seeded `r`, so it costs no later wardrobe or colour pick.
  { const cx = -20, cz = -36;
    const shell = makeConch(); placeT(game, U, shell, cx, cz, 2.4);
    boxT(game, cx, cz, 0.5, 0.5, 0.5, { cam: false });
    const shellLines = ['🐚 "You really can hear the sea in it. Mostly because the sea is right there."', '🐚 "Big as your head, nearly. Something must have grown it."', '🐚 "Somebody swears it still remembers the storm that washed it up."'];
    const shellY = P.ground0(cx, cz) + 0.35;
    game.addInteractable({ obj: shell, radius: 2.2, label: () => 'Listen to the shell', onUse: () => { SFX.wave(); game.fx.emit(cx, shellY, cz, { count: 12, colors: [0xf2a6ab, 0xe4d2ab, 0xffffff], speed: 0.8, up: 1.2, life: 0.8, gravity: 1.2 }); game.toast(rnd.pick(shellLines), 3000); } }); }

  // Robot City's archive-bot, Victorian's night watchman and Candy Land's jack-in-the-box all react to
  // the cat on their own, no `E` needed, but that trick had only ever been tried in those three worlds.
  // A half-buried wooden chest now sits closed in the dry sand, lid shut — until the cat wanders within
  // 6 m, when the lid creaks open on its own, a little pile of gold coins and a single pearl rising into
  // view inside, before it creaks shut again once the cat wanders off.
  // A headless probe built the real Sunny Shore (`game.travel(4, 'from-hub')`), sampled every NPC's own
  // position over 500 simulated frames (so no wandering crab, turtle, sunbather, the beach dog or the
  // marble kid mid-turn could slip past unnoticed), then swept the dry sand (radius 5-50, short of the
  // radius (58) where beachRegion's own fill takes over) against both those samples and every one of the
  // beach's 247 physics boxes: (-30, 10) came back clear by 7.95 m of the nearest box and 10.73 m of the
  // nearest other soul.
  { const cx = -30, cz = 10, cry = 0.4, y0 = P.ground0(cx, cz);
    const chest = group(cx, y0, cz, W); chest.rotation.y = cry;
    const wood = mat(0x6b4226, { roughness: 0.85, map: TEX.planks(20, 24) }), band = mat(0x8a6a2a, { roughness: 0.4, metalness: 0.5 }), gold = mat(0xd4af37, { roughness: 0.3, metalness: 0.6 });
    mesh(G.box(0.8, 0.42, 0.5), wood, { y: 0.21, parent: chest });
    for (const by of [0.08, 0.34]) mesh(G.box(0.82, 0.07, 0.52), band, { y: by, shadow: 'none', parent: chest });
    for (const s of [-1, 1]) mesh(G.box(0.05, 0.42, 0.52), band, { x: s * 0.4, y: 0.21, shadow: 'none', parent: chest });
    mesh(G.box(0.1, 0.09, 0.03), gold, { y: 0.32, z: 0.26, shadow: 'none', parent: chest });   // the clasp, front face
    P.addBox(cx, 0.21, cz, 0.8, 0.42, 0.5, { cam: false });
    // the lid hinges off the chest's own back edge, same trick the jack-in-the-box's lid already uses
    const hinge = group(0, 0.42, -0.25, chest);
    mesh(G.box(0.82, 0.1, 0.52), wood, { y: 0.05, z: 0.25, parent: hinge });
    mesh(G.box(0.84, 0.06, 0.02), band, { y: 0.03, z: 0.5, shadow: 'none', parent: hinge });
    // the hoard, tucked down inside the closed chest (below the rim at local y=0.42, fully hidden by
    // the box's own opaque walls) and raised up past it into view as the lid lifts
    const hoard = group(0, 0.08, 0, chest);
    const coinPos = [[-0.18, -0.08], [0.1, -0.12], [0.2, 0.05], [-0.05, 0.14], [-0.22, 0.1]];
    for (const [px, pz] of coinPos) mesh(G.cyl(0.055, 0.055, 0.02, 10), gold, { x: px, y: 0, z: pz, shadow: 'none', parent: hoard });
    noInk(mesh(G.sphere(0.07, 12, 10), mat(0xf2ead8, { roughness: 0.2, metalness: 0.1 }), { y: 0.06, shadow: 'none', parent: hoard }));   // the pearl
    let chestNear = false, chestOpen = 0;
    const chestLines = ['🏴‍☠️ "Buried for who-knows-how-long, and nobody dug it up till now."', '🏴‍☠️ "Careful, puss — that pearl rolls if you so much as breathe on it."', '🏴‍☠️ "Every coin in there is real gold. Or real paint. One of the two."'];
    chest.userData.update = (dt, t) => {
      const c = game.cat.group.position, near = dist2(c.x, c.z, cx, cz) < 36;
      chestOpen = damp(chestOpen, near ? 1 : 0, 6, dt);
      hinge.rotation.x = -chestOpen * 2.0;
      hoard.position.y = 0.08 + chestOpen * 0.4;
      if (near && !chestNear) { chestNear = true; SFX.thunk(); game.toast(rnd.pick(chestLines)); game.fx.emit(cx, y0 + 0.5, cz, { count: 12, colors: [0xd4af37, 0xfff3c0, 0xf2ead8], speed: 1.1, up: 1.1, life: 0.8, gravity: 2 }); }
      if (!near) chestNear = false;
    };
    U.push(chest.userData.update); }

  // every rock, shell and pebble on this coast has been pure dressing or, since round 319, something to
  // stop and listen to — but nothing the tide itself might have carried in ever washed up here. A corked
  // glass bottle now lies half-buried on its side in the dry sand south of the chip stand, a rolled note
  // just visible through the neck. A headless probe built the real Sunny Shore (`game.load(4,
  // 'from-hub')`), sampled every NPC's and the squirrel's own position every frame over 1200 simulated
  // frames (so no wandering crab, turtle, sunbather or dolphin mid-circuit could slip past unnoticed),
  // then swept a 2 m grid of the dry sand (ground height 0.1-3.0 m, radius ≤ 54, short of the radius (58)
  // where beachRegion's own fill takes over) against both those samples and every one of the beach's 249
  // physics boxes: (-6, -52) came back clear by 11.7 m of the nearest box and 8.9 m of the nearest other
  // soul, between the chip stand (4, -54) and the sand sculptor (-30, -54) with nothing else nearby.
  { const bx = -6, bz = -52, bry = 0.6, y0 = P.ground0(bx, bz);
    const bottle = group(bx, y0 + 0.045, bz, W); bottle.rotation.y = bry;
    const glass = mat(0x2e7d5a, { roughness: 0.15, metalness: 0.05, transparent: true, opacity: 0.55 });
    const cork = mat(0x8a6a42, { roughness: 0.9 }), paper = mat(0xe8dcb8, { roughness: 0.9 });
    mesh(G.cyl(0.055, 0.075, 0.26, 12), glass, { x: -0.06, rz: PI / 2, parent: bottle });            // the body, lying on its side
    mesh(G.cyl(0.022, 0.034, 0.1, 10), glass, { x: 0.12, rz: PI / 2, parent: bottle });               // the neck, tapering out
    mesh(G.cyl(0.02, 0.02, 0.05, 10), cork, { x: 0.18, rz: PI / 2, parent: bottle });                 // the cork, stoppering it
    mesh(G.cyl(0.03, 0.03, 0.17, 8), paper, { x: -0.03, rz: PI / 2, parent: bottle });                // the rolled note, glimpsed through the glass
    P.addBox(bx, y0 + 0.08, bz, 0.34, 0.16, 0.2, { cam: false });
    const bottleLines = ['📜 "The ink\'s run, but one word still reads clear: \'HELP\'. Or maybe \'KELP\'."', '📜 "No name, no date — just a wobbly little drawing of a boat."', '📜 "Whoever threw this one in clearly didn\'t expect a cat to find it first."'];
    game.addInteractable({ obj: bottle, radius: 2.2, label: () => 'Read the message in the bottle', onUse: () => { SFX.click(); game.fx.emit(bx, y0 + 0.2, bz, { count: 10, colors: [0x7fd7ff, 0xffffff, 0xe8dcb8], speed: 0.9, up: 1.0, life: 0.7, gravity: 1.6 }); game.toast(rnd.pick(bottleLines), 3000); } }); }

  // the shell, the chest and the bottle above are all things the cat finds and triggers with a look or
  // an `E` — but Whisper Woods' giant flower (round 442) already proved a prop can react on its own, no
  // button needed, just by noticing the cat get close. Nothing on this whole coast ever did that. A
  // shallow tide pool now sits in the dry sand south of the lighthouse: a ring of weathered rocks round
  // a disc of water, a beached starfish and a few shells on the floor, and a small sea anemone standing
  // at the centre with its crown of tentacles splayed open — until the cat wanders within 3 m, when
  // they curl shut and pull in tight, same as a real anemone recoiling from a prodding finger, then
  // uncurl again once the cat wanders off. The opposite reaction to that flower's bloom, on purpose.
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses) built
  // the real Sunny Shore (`game.travel(4, 'from-hub')`), sampled every NPC's and the squirrel's own
  // position every quarter second over 300 simulated seconds (so no wandering crab, turtle, sunbather
  // or dolphin mid-circuit could slip past unnoticed), then swept a 0.5 m grid of the dry sand (x in
  // [1, 11], short of the wet-sand zone that starts at x=12) against both those samples and every one
  // of the beach's 219 physics boxes: (5, -48) came back clear by 5.5 m of the nearest box and 5.2 m of
  // the nearest other soul — south of the lighthouse keeper and the chip stand, on a near-flat stretch
  // of sand (ground height varying only 0.06 m across the whole footprint). No physics box of its own,
  // same as the glowing pond in Whisper Woods: a shallow puddle the cat can walk straight through.
  { const tpx = 5, tpz = -48;
    const pool = makeTidePool(r);
    const poolLines = ['🪸 "Touch the water, and watch it flinch — not you, puss, the anemone."', '⭐ "That starfish hasn\'t moved all week. Starfish don\'t, much."', '🪸 "Pulls in tight the second a shadow crosses it. Give it a minute - it opens right back up."'];
    let poolOpen = 1, poolNear = false;
    pool.group.userData.update = (dt, t) => {
      const c = game.cat.group.position, isNear = dist2(c.x, c.z, tpx, tpz) < 9;
      poolOpen = damp(poolOpen, isNear ? 0 : 1, 5, dt);
      for (const h of pool.tentacles) h.rotation.x = 0.15 + poolOpen * 0.85;
      pool.anemone.scale.setScalar(0.72 + poolOpen * 0.28);
      pool.water.map.offset.x = t * 0.01;
      if (isNear && !poolNear) { poolNear = true; SFX.wave(); game.toast(rnd.pick(poolLines), 3000);
        game.fx.emit(tpx, P.ground0(tpx, tpz) + 0.15, tpz, { count: 8, colors: [0xbfe8ff, 0xffffff], speed: 0.6, up: 0.6, life: 0.6, gravity: 1.5 }); }
      if (!isNear) poolNear = false;
    };
    placeT(game, U, pool.group, tpx, tpz, r() * TAU); }

  // the Neighborhood (395), Robot City (425), Victorian (426) and Candy Land (427) have all had a go at
  // the same back-garden toss game by now — a horseshoe, a coupling ring, a brass quoit, a gummy ring —
  // but nobody on this whole stretch of coast ever thought to toss anything. A coiled length of ship's
  // rope makes the obvious ring here: two beachgoers lob it back and forth at a pair of driftwood posts
  // planted in the dry sand well north of the huts. Same `Horseshoes` class (`55-npcs.js`) as every
  // earlier reskin, unchanged — held a moment, lobbed on an arc, caught, lobbed back, with its own
  // `SFX.clang()` on landing — just a thick rope-coloured torus standing in for the iron horseshoe,
  // brass quoit or gummy ring, and two driftwood stumps in place of stakes.
  // A headless probe (the stub-three harness `test/run.mjs` itself uses, driven by hand with
  // `game.travel(4, 'from-hub')`) sampled every NPC's own position every quarter second over 300
  // simulated seconds, then swept a 1 m grid of the dry sand (x ≤ 8, clear of the wet-sand zone that
  // starts at x=12, radius ≤ 56, short of the radius (58) where beachRegion's own fill takes over)
  // against both those samples and all 194 of the beach's physics boxes: (8, 52) came back clear by
  // 9.7 m of the nearest box and 8.9 m of the nearest soul over the full 300 s window — flat dry sand,
  // past where the dune terrain and the shore slope both flatten out — with both posts themselves,
  // (8, 49) and (8, 55) either side of the 6 m pitch, clear by at least 7.8 m on both counts.
  { const rcx = 8, rcz = 52, rgap = 6;
    const postM = mat(0x8a6a42, { roughness: 0.95 }), capM = mat(0x6b4226, { roughness: 0.95 });
    for (const rz of [rcz - rgap / 2, rcz + rgap / 2]) {
      const py = P.ground0(rcx, rz);
      mesh(G.cyl(0.055, 0.07, 0.42, 10), postM, { x: rcx, y: py + 0.21, z: rz, parent: W });
      mesh(G.cyl(0.07, 0.07, 0.03, 10), capM, { x: rcx, y: py + 0.415, z: rz, shadow: 'none', parent: W });   // weathered, sawn-off top
      P.addBox(rcx, py + 0.21, rz, 0.14, 0.42, 0.14, { cam: false });
    }
    // a couple of spare rope rings coiled by the near post, baked in with everything else — just set dressing
    const spareR = mat(0xc2a878, { roughness: 1 });
    const py0 = P.ground0(rcx, rcz - rgap / 2);
    for (let i = 0; i < 2; i++) mesh(G.torus(0.14, 0.04, 6, 16), spareR, { x: rcx + 0.3, y: py0 + 0.045 + i * 0.07, z: rcz - rgap / 2 + 0.1, rx: PI / 2, ry: i * 0.7, parent: W });
    const ringWardA = makeWardrobe(r, { shirts: [0xff7043], pants: [0x8a6a4a], shoes: [0xefe7d8, 0x8d6e63] });
    const ringWardB = makeWardrobe(r, { shirts: [0x2e9e6e], pants: [0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const ringA = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: r.chance(0.3), wardrobe: ringWardA }), shorts: true, hat: r.chance(0.5) ? 'cap' : null, hatColor: 0xf5f2ea, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) });
    const ringB = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: r.chance(0.3), wardrobe: ringWardB }), shorts: true, hat: r.chance(0.4) ? 'sunhat' : null, hatColor: 0xd9c9a8, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) });
    W.add(ringA.group); W.add(ringB.group);
    const ring = mesh(G.torus(0.15, 0.045, 8, 20), mat(0xc2a878, { roughness: 1 }), { x: rcx, y: py0 + 1, z: rcz - rgap / 2, rx: PI / 2, parent: W });
    const ringLines = ['Right over the post — that\'s a landing!', "Careful, puss — you'll have that rope round your own tail.", "Best of nine, loser buries the loser's feet."];
    game.npcs.push(new Horseshoes(game, ringA, ringB, ring, { cx: rcx, cz: rcz, gap: rgap, cries: ringLines, cryIcon: '🪢' }));
    greetable(game, { rig: ringA }); greetable(game, { rig: ringB }); }

  // the Neighborhood, Victorian, Frosty Peak and Whisper Woods all have a woodcutter splitting logs on
  // a stump by now (`makeStump()` + `Chopper`, round 207 on) — Sunny Shore, Robot City and Candy Land
  // were the only three worlds left without one. A beachcomber now splits driftwood on a sawn stump in
  // the western dunes, well past the hammock and the dolphin's own patch, feeding tonight's beach fire.
  // Same `Chopper` controller (`55-npcs.js`) unchanged — same stump, same axe, same chip burst on every
  // landed blow — just this world's own sun-bleached wardrobe on the cutter in place of flannel or a
  // beanie, and `placeT`/`boxT` in place of the flat-floor worlds' `place`/`P.addBox` to sit the stump
  // on the dune's own slope.
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses) built
  // the real Sunny Shore (`game.start('new')` then `game.travel(4, 'from-hub')`), sampled every NPC's
  // and the squirrel's own position every frame over 300 simulated seconds, then swept a 1 m grid of the
  // dry dune sand (radius 8-56, short of the radius (58) where `beachRegion`'s own fill takes over)
  // against both those samples and every one of the beach's physics boxes: (-44, -34) came back clear
  // by 9.6 m of the nearest box and 10.1 m of the nearest other soul, deep in the western dunes.
  { const sx = -44, sz = -34, cx = -44, cz = -32.7;
    placeT(game, U, makeStump(r), sx, sz, r() * TAU); boxT(game, sx, sz, 1.0, 0.75, 1.0, { cam: false });
    const chopWard = makeWardrobe(r, { shirts: [0xd9622a, 0x2e7d5a, 0x3a5a7a], pants: [0x5a4a3a, 0x3a3a3a], shoes: [0xefe7d8] });
    const cutter = makeHuman({ ...randomPerson(r, { female: r.chance(0.4), child: false, elder: false, wardrobe: chopWard, build: 'stout' }),
      hat: r.chance(0.5) ? 'cap' : null, hatColor: 0x2f4f4f, shorts: true, scarf: null, jacket: null, bag: null, backpack: null, axe: true, beard: r.chance(0.3) }); W.add(cutter.group);
    game.npcs.push(new Chopper(game, cutter, { x: cx, z: cz, ry: atan2(sx - cx, sz - cz),
      cries: ["Dry enough by sundown, with this sun.", 'Careful, puss — mind the chips.', "Tonight's fire won't build itself."] })); }
  // every ball game on this beach so far has been an open toss back and forth — the keep-it-up pair, the
  // frisbee, the catch down by the dunes — but no world in the whole game has ever had an actual net to
  // play over, the one piece of beach-volleyball kit the sand itself is crying out for. **A volleyball
  // net now stands on the open dry sand inland of the dunes, two sun-bleached posts and a low cord net,
  // with two players lobbing a white, blue and yellow ball back and forth over it.**
  //
  // New `makeVolleyballNet()` (`62-props-nature.js`, right after `makeSurfboard`): two posts, a white top
  // tape and six horizontal plus seven vertical cords, all `noInk`'d like the spiderweb's own silk
  // strands so the thin lines don't ink solid. No new controller: the exact same `BallGame`
  // (`55-npcs.js`) the Neighborhood's, Candy Land's, Frosty Peak's and Whisper Woods' own catch games
  // already use, unchanged — its hand-to-hand lob already arcs 2.2 m above the throwing hand at the
  // midpoint of its flight, more than enough clearance over a net barely 1.3 m tall, so the ball
  // visibly clears it on every pass without the controller needing to know the net is even there. The
  // ball itself reuses the same three-material sphere trick Frosty Peak's and Victorian's own catch
  // balls already use (one base sphere plus two scaled overlays for a second and third colour), just
  // white with a blue and a yellow wedge instead of orange and green, for an actual volleyball rather
  // than a beach ball.
  //
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses, with the real beach built
  // via `game.start('new')` then `game.travel(4, 'from-hub')`) sampled every NPC's own position every
  // third of a second over 300 simulated seconds, then swept the dry sand west of the dunes' own inner
  // edge (radius 18-50, short of the radius (58) where `beachRegion`'s own fill takes over) against both
  // those samples and every one of the beach's physics boxes: (-18, -6) came back clear by 4.1 m of the
  // nearest box and 4.5 m of the nearest other soul across the whole footprint the net and its players'
  // own sway need (±2.5 m across, ±3.5 m along the court), with the ground flat to within 0.21 m
  // throughout — comfortably inside the hand-built heart of the world, well clear of the palm grove at
  // (-20, 6) and the hammock further south.
  { const cx = -18, cz = -6, gap = 4.6;
    const net = makeVolleyballNet(); placeT(game, U, net, cx, cz, 0);
    for (const sx of [-1.9, 1.9]) boxT(game, cx + sx, cz, 0.16, 1.35, 0.16, { cam: false });
    const ball = mesh(G.sphere(0.17, 12, 8), mat(0xf5f3ec, { roughness: 0.5 }), { parent: W });
    mesh(G.sphere(0.171, 12, 8), mat(0x1f6fb0, { roughness: 0.5 }), { sx: 0.55, sz: 0.55, parent: ball });
    mesh(G.sphere(0.171, 12, 8), mat(0xffd54a, { roughness: 0.5 }), { sx: 0.55, sz: -0.55, parent: ball });
    ball.position.set(cx, P.ground0(cx, cz) + 0.95, cz);
    const vbA = beachPerson(r.chance(0.5), false), vbB = beachPerson(r.chance(0.5), false);
    const vbGame = new BallGame(game, vbA, vbB, ball, { cx, cz, gap });
    game.npcs.push(vbGame); greetable(game, { rig: vbA }); greetable(game, { rig: vbB });
    const netLines = ['🏐 "Out by a hair. Every single time."', '🏐 "Best two out of three. Again."', '🏐 "Mind the net, puss — it\'s not a hammock."'];
    game.addInteractable({ obj: net, radius: 2.6, label: () => 'Watch the volleyball', onUse: () => { SFX.click(); game.toast(rnd.pick(netLines), 3000); } }); }
  // Victorian has had a hot air balloon drifting over its rooftops since round 438 and Robot City an
  // airship since round 439 — Sunny Shore's own sky, past the gulls and the lighthouse beam, never had
  // anything fly all the way across it. **A canary-yellow biplane now loops a slow circuit above the
  // whole beach, towing a banner that reads the shore's own blurb back at it: "WAVES, CRABS, COCONUTS"**,
  // 55 m up on a 140 m orbit. Purely decorative: nothing to greet, nothing to reach, no dialogue.
  //
  // No new controller, no physics box of its own, same reasoning as the balloon and the airship:
  // flying 43 m above the lighthouse (the tallest thing on the whole shore, 12 m) clears every palm
  // and hut by a wide margin, so it needs no keep-out check against `game.zones` or any of the beach's
  // physics boxes. The fuselage is one `G.capsule()` inside a child group rotated `PI/2` about X — the
  // same trick the airship's own hull uses — so its pole-to-pole axis lands on local Z (nose at +z)
  // before the whole rig is ever moved onto its orbit; the two wing boxes, the struts and the tail sit
  // directly on the outer group, same as the airship's own tail fins. The banner is a cloth box towed
  // on a rope from the tail (`noInk()`, same reasoning as the balloon's ropes and the airship's
  // propeller — thin enough that the ink pass would otherwise draw a solid line), carrying the same
  // double text-plane trick the gondola sign and the Frosty Peak welcome arch already use
  // (`TEX.signText()` on a plane, cloned and turned around) so it reads from either side of the loop.
  //
  // Drifts entirely on the world clock `t` (bob, roll, the propeller's own spin and the banner's own
  // trailing sway all keyed off `t` alone) from one fixed starting angle drawn once off this world's
  // own local `r()`, so it costs no later wardrobe or layout pick — placed last of everything this
  // build adds, after the woodcutter and the volleyball game, so even that one draw disturbs nothing
  // built earlier on the sand.
  { const planeR = 140, planeH = 55, planeSpeed = TAU / 200, planePhase = r() * TAU;
    const biplane = group(0, 0, 0);
    const hullM = mat(0xffd54a, { roughness: 0.55 });
    const hullGroup = group(0, 0, 0, biplane); hullGroup.rotation.x = PI / 2;
    mesh(G.capsule(0.28, 2.0, 8), hullM, { shadow: 'none', parent: hullGroup });
    const wingM = mat(0xf7f3ec, { roughness: 0.6 });
    mesh(G.box(3.6, 0.07, 0.6), wingM, { y: -0.05, shadow: 'none', parent: biplane });
    mesh(G.box(3.2, 0.07, 0.55), wingM, { y: 0.55, shadow: 'none', parent: biplane });
    const strutM = mat(0x8a6a42, { roughness: 0.8 });
    for (const sx of [-1.35, 1.35]) noInk(mesh(G.cyl(0.03, 0.03, 0.6, 6), strutM, { x: sx, y: 0.25, shadow: 'none', parent: biplane }));
    const finM = mat(0xd62839, { roughness: 0.6 });
    mesh(G.box(0.06, 0.6, 0.45), finM, { y: 0.3, z: -1.45, shadow: 'none', parent: biplane });
    mesh(G.box(1.1, 0.06, 0.3), wingM, { z: -1.45, shadow: 'none', parent: biplane });
    const propGroup = group(0, 0, 1.55, biplane);
    mesh(G.cyl(0.07, 0.07, 0.15, 8), strutM, { rx: PI / 2, shadow: 'none', parent: propGroup });
    const bladeM = mat(0x2e2a24, { roughness: 0.6 });
    noInk(mesh(G.box(0.05, 0.9, 0.1), bladeM, { shadow: 'none', parent: propGroup }));
    noInk(mesh(G.box(0.9, 0.05, 0.1), bladeM, { shadow: 'none', parent: propGroup }));
    const towM = mat(0x3a2f24, { roughness: 0.9 });
    noInk(mesh(G.cyl(0.02, 0.02, 2.6, 5), towM, { z: -2.75, rx: PI / 2, shadow: 'none', parent: biplane }));
    const banner = group(0, 0, -4.3, biplane);
    mesh(G.box(4.2, 1.0, 0.04), mat(0xffd54a, { roughness: 0.75 }), { shadow: 'none', parent: banner });
    const bannerTex = TEX.signText('WAVES, CRABS, COCONUTS', '#1d5a7a');
    const btxt = new THREE.Mesh(G.plane(4.0, 0.9), new THREE.MeshBasicMaterial({ map: bannerTex, transparent: true })); worldBag.track(btxt.material); btxt.position.z = 0.03; banner.add(btxt);
    const btxt2 = new THREE.Mesh(G.plane(4.0, 0.9), new THREE.MeshBasicMaterial({ map: bannerTex, transparent: true })); worldBag.track(btxt2.material); btxt2.position.z = -0.03; btxt2.rotation.y = PI; banner.add(btxt2);
    biplane.userData.update = (dt, t) => {
      const a = planePhase + t * planeSpeed;
      biplane.position.set(cos(a) * planeR, planeH + sin(t * 0.21) * 2.5, sin(a) * planeR);
      biplane.rotation.y = -a;
      biplane.rotation.z = sin(t * 0.4) * 0.05;
      propGroup.rotation.z += dt * 14;
      banner.rotation.x = sin(t * 0.9) * 0.05;
      banner.position.y = sin(t * 0.9) * 0.12;
    };
    place(game, U, biplane, cos(planePhase) * planeR, sin(planePhase) * planeR, 0, planeH); }

  // the dry sand well south-west of everything else — past the volleyball court, short of the dune
  // ridge — has sat empty since the beach was first built. A kid now bounces in place on a pogo stick
  // out there, new `PogoHopper` (`55-npcs.js`, right after `FrisbeePlayer`): the same grounded,
  // in-place bounce `Bouncer`'s trampoline already uses, minus the trampoline — the pole is parented
  // straight to the body and hops with it, its own coiled spring squashing at the bottom of each hop
  // and stretching at the top.
  // Placed at (-28, -20): a headless probe (the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` then `game.travel(4, 'from-hub')`) sampled every NPC's own position every
  // quarter second over 300 simulated seconds, then swept the dry sand west of the volleyball court
  // (radius 20-45, short of the radius (58) where `beachRegion`'s own fill takes over) against both
  // those samples and every one of the beach's physics boxes: (-28, -20) came back clear by 12.77 m of
  // the nearest box and 14.07 m of the nearest other soul, with the ground flat to 0.000 m across the
  // kid's own footprint.
  { const pogoKid = beachPerson(r.chance(0.5), true);
    game.npcs.push(new PogoHopper(game, pogoKid, r.pick([0xff6f3c, 0x3fae9a, 0xf2c744]), { x: -28, z: -20, ry: r.range(0, TAU),
      cries: ['Boing! Boing! Boing!', "One thousand bounces. Not stopping to count again.", "Don't look — actually, look, I'm good at this."] })); }
  // Victorian has had a rally over a low net since round 525 — the exact rhythm beach badminton
  // plays at in real life, shuttle and all, just on sand instead of a town green. Sunny Shore had
  // every open-toss ball game (keep-it-up, frisbee, catch, volleyball) but never a net game of its
  // own on dry land. **A badminton net now stands on a quiet stretch of dry sand south of the
  // volleyball court, two players in beach wear knocking a shuttlecock back and forth over it,
  // feet bare in the sand.**
  //
  // No new code at all: the same `Badminton` class (`55-npcs.js`) and `makeVolleyballNet()`
  // (`62-props-nature.js`) Victorian's own rally already uses, just with `placeT`/`boxT` in place
  // of the flat-floor town's `place`/`P.addBox`, since the sand underfoot here has real slope the
  // same way every other hand-placed prop on this beach already accounts for — and a fresh
  // `makeWardrobe` of beach-bright shirts instead of the town's muted ones, `shorts: true` instead
  // of trousers, no hat, jacket or bag, just a `racket` in each hand.
  //
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses, `game.start('new')`
  // then `game.travel(4, 'from-hub')`) sampled every NPC's own position every quarter second over
  // 300 simulated seconds, then swept the net and both players' own footprint (±1.8 m across,
  // ±3.4 m along the court) against both those samples and every one of the beach's 323 physics
  // boxes: (-18, -38) came back clear by 9.18 m of the nearest box and 9.57 m of the nearest other
  // soul across the whole footprint, with the ground flat underfoot — well south of the hammock
  // (-10, -40) and the pogo kid above, short of the radius (58) where `beachRegion`'s own fill
  // takes over.
  { const cx = -18, cz = -38, gap = 5.6, halfW = 1.8;
    const net = makeVolleyballNet(halfW, 0xf0ece4, { postH: 1.6, netH: 0.78 });
    placeT(game, U, net, cx, cz, 0);
    for (const sx of [-halfW, halfW]) boxT(game, cx + sx, cz, 0.16, 1.6, 0.16, { cam: false });
    // the shuttlecock: a pale cork and a flared cone standing in for the feathers, nose staying down
    const shuttle = group(cx, 0, cz, W);
    mesh(G.sphere(0.045, 10, 8), mat(0xf0ead6, { roughness: 0.6 }), { y: 0, parent: shuttle });
    mesh(G.cone(0.075, 0.16, 10), mat(0xfbfaf4, { roughness: 0.8 }), { y: 0.11, rx: PI, parent: shuttle });
    const bmWard = makeWardrobe(r, { shirts: [0xff7043, 0x4fc3f7, 0xfff176], pants: [0x2f6fd6, 0xd62839, 0x2e9e6e], shoes: [0xefe7d8, 0xd7a86e] });
    const bA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: bmWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, shorts: true, glasses: r.chance(0.4), glassColor: 0x203040, racket: true });
    const bB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: bmWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, shorts: true, glasses: r.chance(0.4), glassColor: 0x203040, racket: true });
    W.add(bA.group); W.add(bB.group);
    const beachBadmintonLines = ['🏸 "Careful, the wind off the water adds a wobble."', '🏸 "Sand\'s terrible for footwork, wonderful for falling."', '🏸 "That one nearly went in the sea."'];
    game.npcs.push(new Badminton(game, bA, bB, shuttle, { cx, cz, gap, cries: beachBadmintonLines })); }

  // Frosty Peak, Robot City and Whisper Woods have all had two haulers dig in and heave on a rope by
  // now (`TugOfWar`, 55-npcs.js) — Sunny Shore, for all its net games and open-toss ball games, never
  // had one. **Two beachgoers now heel into the dry sand on the quiet dune north-west of the huts and
  // heave on a length of ship's rope between them, never quite settling either way.** "Heave! Heave!
  // Nobody's budging an inch!" "Careful, puss — mind the rope, it bites worse than a crab." "Dead
  // heat again. Sand's no easier to dig into than snow, turns out."
  //
  // No new class and no new mesh beyond the rope and its little flag: the exact same `TugOfWar`
  // (`55-npcs.js`) Frosty Peak's, Robot City's and Whisper Woods' own tug-of-war already use,
  // unchanged, with the same rope-and-flag dressing those three already build around it — just two
  // `makeHuman` haulers in a fresh beach wardrobe (shorts, no hat or jacket) rather than a snowsuit
  // or factory overalls.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // since there's no browser here to look at it) built the real Sunny Shore (`game.start('new')` then
  // `game.load(4, 'from-hub')`), sampled every NPC's and the squirrel's own position every fifth frame
  // over 900 simulated frames (long enough for every crab, turtle, sunbather, dolphin, dog and dancer
  // on this whole shore to range fully), then swept a grid of the dry dune sand (x ≤ 10, clear of the
  // wet-sand zone that starts at x=12, radius 5-54, short of the radius (58) where `beachRegion`'s own
  // fill takes over) against both those samples and every one of the beach's own physics boxes:
  // (-50, 20) came back clear by 7.92 m of the nearest box and 8.08 m of the nearest other soul at its
  // own centre, with both haulers' own stations 1.3 m either side of it (rope along world X) clear by
  // 6.68 m and 8.32 m of the nearest box and 8.00 m and 8.35 m of the nearest other soul, ground height
  // varying only about 0.1 m across the whole footprint — north-west of the furthest dune palms, well
  // short of every other hand-placed game on this beach.
  { const tugWard = makeWardrobe(r, { shirts: [0x8a3a3a, 0x3a5a6a, 0x4a6a4a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const haulerA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: tugWard }),
      shorts: true, hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) }); W.add(haulerA.group);
    const haulerB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: tugWard }),
      shorts: true, hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) }); W.add(haulerB.group);
    const tug = new TugOfWar(game, haulerA, haulerB, { x: -50, z: 20, ry: PI / 2, gap: 2.6,
      cries: ["Heave! Heave! Nobody's budging an inch!", 'Careful, puss — mind the rope, it bites worse than a crab.', "Dead heat again. Sand's no easier to dig into than snow, turns out."] });
    game.npcs.push(tug);
    const [A, B] = tug.ctls, ropeM = mat(0x8a6a42, { roughness: 0.9 }), ay = P.ground0(A.x, A.z) + 0.75, by = P.ground0(B.x, B.z) + 0.75;
    const ropeGroup = group((A.x + B.x) / 2, (ay + by) / 2, (A.z + B.z) / 2, W);
    ropeGroup.lookAt(B.x, by, B.z);
    noInk(mesh(G.cyl(0.035, 0.035, Math.hypot(B.x - A.x, by - ay, B.z - A.z), 8), ropeM, { rx: PI / 2, parent: ropeGroup }));
    const flag = group(0, 0, 0, W); noInk(mesh(G.box(0.03, 0.14, 0.4), mat(0xd62839, { roughness: 0.7 }), { parent: flag }));
    U.push(() => { const frac = 0.5 + clamp(tug.tension, -1, 1) * 0.12;
      flag.position.set(lerp(A.x, B.x, frac), lerp(ay, by, frac) + 0.03, lerp(A.z, B.z, frac)); flag.rotation.y = ropeGroup.rotation.y; }); }

  // the Neighborhood, Candy Land, Robot City and Victorian have all had a tetherball pole since round
  // 508's own list of playground games (tetherball, badminton, tug-of-war, archery, sack races) went
  // round every world in turn — Sunny Shore, for all its net games and open-toss games, never got the
  // one played standing still, swinging a ball on a rope round and round a post. Two kids now keep a
  // rally going on the dry dune sand well inland of the vendor's stand and the marbles ring.
  //
  // No new class and no new mesh: the exact same `Tetherball` (`55-npcs.js`) the other four worlds
  // already use, unchanged — it already asks `game.physics.ground0()` for its own pole, ball and each
  // player's footing every frame, so the real slope under this dune cost nothing extra. Two
  // `beachPerson(child)` kids stand in for the other worlds' own fresh `makeHuman` pairs, since every
  // other child on this beach already comes from that one helper (which adds each rig to the scene
  // itself, so no separate `W.add()` here).
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.travel(4, 'from-hub')` then 1200 simulated frames, every NPC's and the squirrel's own
  // position sampled every 15th frame) swept a grid of the dry dune sand (x ≤ 10, radius 20-50, short
  // of the radius (58) where `beachRegion`'s own fill takes over) against both those samples and every
  // one of the beach's 217 physics boxes, checking the pole's own spot and both players' footing two
  // metres either side of it: (-26, 2) came back clear by just over 6 m at its tightest point, inland
  // of the balloon vendor at (-25, -6) and well short of the marbles ring at (-33, 20).
  { const boy = beachPerson(false, true);
    const girl = beachPerson(true, true);
    game.npcs.push(new Tetherball(game, boy, girl, { x: -26, z: 2,
      cries: ["Round and round — same as every other game on this coast, just sandier.", 'Watch the rope, puss — mind your tail.', "I'm up to thirty wraps. I think I lost count."] })); }

  // the Neighborhood, Candy Land, Robot City and Victorian all have a SackRace by now (55-npcs.js) —
  // Sunny Shore, for every other game on this coast, never had the one hopped two-footed in a borrowed
  // sack. Two kids now race a short lane on a quiet stretch of dry sand, feet bound ankle to waist in
  // beach towels instead of flour sacks.
  //
  // No new class: the same `SackRace` and `makeHuman`'s own `o.sack` option the other four worlds
  // already use; it calls `game.physics.ground0()` for each racer's own footing every frame, same as
  // this beach's tetherball and tug-of-war above, so the real slope underfoot costs nothing extra.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.travel(4, 'from-hub')` then 2400 simulated frames, every NPC's and the squirrel's own
  // position sampled every 10th frame) swept a grid of the dry sand (radius 4-50, short of the radius
  // (58) where `beachRegion`'s own fill takes over, both lane orientations) against both those samples
  // and every one of the beach's 223 physics boxes: (-37, -13), lane along world Z, came back clearest
  // at 6.53 m from the nearest box or soul at its tightest point — well clear of the mancala table
  // (-30, 10), the ring-dance (-42, -22) and the digger (-6, 18).
  { const sackWard = makeWardrobe(r, { shirts: [0xff8a5c, 0x4fc3f7, 0xf4d35e], pants: [0x2a3a4a, 0x3a2a24] });
    const sackA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, elder: false, wardrobe: sackWard }),
      sack: 0xe8d9b0, hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    const sackB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, elder: false, wardrobe: sackWard }),
      sack: 0xe8d9b0, hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(sackA.group); W.add(sackB.group);
    game.npcs.push(new SackRace(game, sackA, sackB, { x: -37, z: -13, ry: 0,
      cries: ['Sand in the sack already — this is going to chafe.', 'Mind your tail, puss, I can\'t steer in this thing.', "Best of three. I'm not losing to the tide as an excuse."] })); }

  // the Neighborhood, Candy Land, Robot City, Victorian and Whisper Woods have all had a piñata post
  // since rounds 508-odd, 564, 565, 566 and 567 (`PinataSwinger` in `55-npcs.js`, `makePinata` in
  // `60-props.js`) — round 567's own log entry claimed this finished the set across "all seven worlds",
  // but that was wrong: nothing had actually been added to Sunny Shore or Frosty Peak, so two of the
  // seven were still missing one. This closes the first of those two gaps. **A beach-ball-striped
  // piñata now hangs from a driftwood post** on the quiet dune sand south of the sack race's own lane,
  // a kid in swim gear taking a two-handed swing at it. *"Bet there's taffy in there — there's always
  // taffy in there."* *"Mind your tail, puss — plenty of swing room needed here."* *"One more go. I
  // can feel today's the day I actually connect."*
  //
  // No new class and no new mesh: the exact same `PinataSwinger` and `makePinata` the other five worlds
  // already use, just a fresh post, a fresh kid and this coast's own beach-ball colours in place of any
  // street's balloon palette, the castle's candy colours or Robot City's scrap-and-hazard-stripe scheme.
  // `PinataSwinger`'s own constructor already asks `game.physics.ground0()` for the swinger's footing,
  // same as this beach's tetherball and sack race above, so the real slope underfoot costs nothing
  // extra; only the post itself needed `placeT`/`boxT` in place of the flat-floor worlds' `group()` +
  // `P.addBox()`.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses, the
  // real beach built with `game.start('new')` then `game.travel(4, 'from-hub')` — waiting out the
  // portal's own 520 ms fade timer rather than sampling mid-transition, which is what a first pass at
  // this probe got wrong, scoring the Neighborhood it had never actually left — then 2400 simulated
  // frames to let every beachgoer, dog, kite and ball game on this coast actually move) sampled every
  // NPC's and the squirrel's own position every 10th frame, then swept a grid of the dry dune sand
  // (x ≤ 10, west of the wet-sand/sea zone; radius 10-46, short of the radius (58) where
  // `beachRegion`'s own fill takes over) against both those samples and every one of the beach's 225
  // physics boxes: (-14, -31.5) came back clearest at 6.59 m from the nearest box or soul — south of
  // the pogo kid at (-28, -20), east of the beach-badminton net at (-18, -38), and well short of the
  // sack race's own lane at (-37, -13).
  //
  // Built dead last, right after the sack race, for the usual reason: `makeHuman()` (which
  // `beachPerson()` wraps) draws three values off the shared `rnd()` sequence unconditionally, and a
  // fresh rig built any earlier would shift that sequence and desync every other timing-sensitive pick
  // already placed above.
  { const px = -14, pz = -31.5, postH = 2.2, outer = 0.4, ropeLen = 0.45;
    const BEACH_FRINGE = [0xff6f3c, 0xffffff, 0xffd54a, 0x2fc9e0];
    const postM = mat(0x6b4a2a, { roughness: 0.9 });
    const standG = group();
    mesh(G.cyl(0.07, 0.09, postH, 8), postM, { y: postH / 2, parent: standG });
    const pivot = group(0, postH, 0, standG);
    mesh(G.cyl(0.012, 0.012, ropeLen, 5), mat(0xe8d9a0, { roughness: 0.9 }), { y: -ropeLen / 2, parent: pivot });
    const pinata = makePinata(0x2f6fd6, BEACH_FRINGE);
    pinata.position.y = -(ropeLen + outer); pivot.add(pinata);
    let lt = 0;
    standG.userData.update = (dt) => {
      lt += dt;
      const cyc = 2.6, ph = (lt % cyc) / cyc, sinceHit = ph < 0.65 ? (ph + 0.35) * cyc : (ph - 0.65) * cyc;
      pivot.rotation.z = sin(lt * 0.5) * 0.04 + Math.exp(-sinceHit * 2.6) * 0.3;
      pivot.rotation.x = sin(lt * 0.4 + 1) * 0.025;
    };
    placeT(game, U, standG, px, pz, 0);
    boxT(game, px, pz, 0.35, postH, 0.35, { cam: false });
    const sx = px, sz = pz + 1.3, sry = atan2(px - sx, pz - sz);
    const swinger = beachPerson(r.chance(0.5), true);
    game.npcs.push(new PinataSwinger(game, swinger, 0x8a6a44, { x: sx, z: sz, ry: sry,
      cries: ["Bet there's taffy in there — there's always taffy in there.", 'Mind your tail, puss — plenty of swing room needed here.', "One more go. I can feel today's the day I actually connect."] })); }

  // Sunny Shore had every one of round 508's own playground games except the one played standing
  // still and loosing an arrow — archery had already reached the Neighborhood, Frosty Peak, Whisper
  // Woods and Victorian, four of the seven worlds, leaving this beach and two others without a range
  // of their own. **A lone archer now draws and looses at a straw target on a quiet stretch of dry
  // sand**, nothing between her and the tide but sand and a straw boss. *"Steady now — the wind off
  // the water throws every shot wide."* *"Mind your tail, puss — you're no target, but best stand well
  // clear."* *"Every arrow that misses buries itself in the sand. I've lost more than I've found."*
  //
  // No new class and no new prop: the exact same `Archer` and straw-boss-and-rings target
  // (`55-npcs.js`) the other four worlds already build, unchanged — just a plain tank-top-and-shorts
  // beach wardrobe (`shorts: true`, no hat, no coat) in place of any of those worlds' winter coat,
  // woodsman's jacket, bonnet-and-gown or hoodie. `makeHuman`'s `o.bow` hand prop sits at the off hand
  // regardless of what else she wears, and `Archer`'s own constructor already calls
  // `game.physics.ground0()` for her own footing every frame, same as every other hand-placed NPC on
  // this beach, so the real slope underfoot costs nothing extra; only the target itself needed
  // `P.ground0()` once at build time, same as Frosty Peak's and Victorian's own ranges.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` then `game.travel(4, 'from-hub')` — waited out for real with a 700 ms pause
  // rather than looped through, which is what cost a first pass at this probe its result, scoring the
  // Neighborhood it had never actually left — then 2400 simulated frames) sampled every NPC's own
  // position every 10th frame, then swept the dry sand (radius 8-50, short of the radius (58) where
  // `beachRegion`'s own fill takes over, eight firing directions at every grid point) against both
  // those samples and every one of the beach's 215 physics boxes: (-8, -46), facing east, came back
  // clearest at 5.35 m along the whole ten-metre line to the target at (2, -46) — the limiting obstacle
  // a small prop box 5.45 m off and the nearest wandering soul 6 m off, well clear of the dense cluster
  // of games further north and west (the pogo kid at (-28, -20), the piñata at (-14, -31.5), the sack
  // race's own lane at (-37, -13)).
  //
  // Built dead last, right after the piñata, for the usual reason: `makeHuman()` draws three values off
  // the shared `rnd()` sequence unconditionally, and a fresh rig built any earlier on this beach would
  // shift that sequence and desync every other timing-sensitive pick already placed above.
  { const ax = -8, az = -46, ary = PI / 2, adist = 10;
    const tx = ax + sin(ary) * adist, tz = az + cos(ary) * adist, ty0 = P.ground0(tx, tz);
    const target = group(tx, ty0, tz, W);
    mesh(G.cyl(0.46, 0.46, 0.22, 16), mat(0xd9c28a, { roughness: 0.95 }), { y: 1.0, rx: PI / 2, parent: target });   // the straw boss
    const ringSpecs = [[0.42, 0xf3f0e6], [0.33, 0x1c1c1c], [0.24, 0x2d6fd6], [0.15, 0xd62839], [0.065, 0xf2c744]];
    ringSpecs.forEach(([rad, c], i) => mesh(G.cyl(rad, rad, 0.02, 20), mat(c, { roughness: 0.7 }), { y: 1.0, z: 0.1 + i * 0.004, rx: PI / 2, shadow: 'none', parent: target }));
    const standM = mat(0x5b3d24, { roughness: 1 });
    for (const s of [1, -1]) mesh(G.cyl(0.02, 0.025, 1.0, 6), standM, { x: s * 0.36, y: 0.55, z: -0.2, rx: 0.3, rz: s * 0.22, parent: target });
    game.physics.addBox(tx, ty0 + 1.0, tz, 0.95, 1.0, 0.3, { cam: false });
    const bowWard = makeWardrobe(r, { shirts: [0xff7043, 0x4fc3f7, 0xfff176], pants: [0x2a3a4a, 0x3a2a24], shoes: [0xefe7d8] });
    const archer = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: bowWard }),
      hat: null, shorts: true, stripes: null, jacket: null, coat: null, scarf: null, bag: null, backpack: null, glasses: false, bow: true });
    W.add(archer.group);
    const arrow = group(0, 0, 0, W);
    mesh(G.cyl(0.012, 0.012, 0.62, 6), mat(0x8a6a3a, { roughness: 0.8 }), { rx: PI / 2, parent: arrow });   // shaft
    mesh(G.cone(0.022, 0.08, 6), mat(0x9aa3ad, { metalness: 0.6, roughness: 0.35 }), { z: -0.35, rx: -PI / 2, parent: arrow });   // head, at local -Z so lookAt() faces it forward
    const fletchM = mat(0xd62839, { roughness: 0.9 });
    for (let fi = 0; fi < 3; fi++) mesh(G.box(0.1, 0.002, 0.05), fletchM, { z: 0.26, rz: fi / 3 * TAU, shadow: 'none', parent: arrow });   // tail fletching
    game.npcs.push(new Archer(game, archer, arrow, { x: ax, z: az, ry: ary, dist: adist,
      cries: ['Steady now — the wind off the water throws every shot wide.', "Mind your tail, puss — you're no target, but best stand well clear.", "Every arrow that misses buries itself in the sand. I've lost more than I've found."] })); }
  beachRegion(game, U, r, 58, SHORE_LIMIT - 8);
  // the headland behind the dunes: hills and peaks inland only, never out to sea
  makeHorizon(game, r, { clear: SHORE_LIMIT + 8, hill: 0x8c9a58, rock: 0x7a7060, rock2: 0x8a8272, snowLine: 58, peaks: 26, woodCount: 260, woodHue: [0.18, 0.28], woodLight: [0.18, 0.3], keep: (x) => x < -SHORE_LIMIT * 0.15 });
  // portal home (west end, on the dune ridge)
  const back = makeRingPortal(0x37e5a0, { frame: 0xa88a5a, glow: 0.22 }); placeT(game, U, back, -48, 0, PI / 2);
  for (const dz of [-1.4, 1.4]) boxT(game, -48, dz, 0.6, 2.6, 0.5);
  game.addInteractable({ obj: back, radius: 2.4, label: () => 'Return to the Neighborhood', onUse: () => game.travel(0, 'from-beach') });
  const C = game.collectibles;
  C.add('fish', 31, -10, 0.6); C.add('star', 12, -40); C.add('yarn', -18, 30); C.add('mouse', 2, 14); C.add('fish', 20, 30); C.add('star', -36, -26); C.add('yarn', -8, -36); C.add('mouse', -40, 20);
  game.fx.setAmbient({ count: 40, radius: 20, colors: [0xffffff, 0xfff6d5], rise: 0.4, drift: 0.5, life: 3, height: 2.5, yMin: 0.3 });
  makeDayNight(game, U, W);
  // the Neighborhood has a raccoon at a bin, Robot City a scrap-bug, Candy Land a gumdrop toad and
  // Whisper Woods a ladybug — every world had its own small, unregarded floor-level creature except
  // this one and Frosty Peak. A tiger beetle now scuttles the dry dune sand west of the tug-of-war.
  // `makeTigerBeetle()` in `56-npcs-wild.js`, right after `makeLadybug()`, is that same rig's
  // sun-bleached cousin: longer and flatter, an iridescent green-gold shell with a pale diagonal
  // marking per side instead of spots, and longer running legs — real tiger beetles are among the
  // fastest animals alive relative to their own size. Wired to the same `Hopper` controller every
  // other tiny ground creature already uses. Pure ambient wildlife — no greeting, no effect on the
  // friend count, nothing new to collect.
  //
  // A headless probe (`game.start('new')` then `game.load(4, 'from-hub')`, 1200 simulated frames,
  // every NPC's own position sampled every fifth frame) swept the dry dune sand (x ≤ 10, west of the
  // wet-sand zone that starts at x=12, radius ≤ 54, short of the radius (58) where `beachRegion`'s own
  // fill takes over) against both every one of the beach's 217 physics boxes and those samples:
  // (-8, 24) came back clear by 8.8 m of the nearest box and 6.1 m of the nearest wandering soul,
  // comfortably past the 0.1 m leash given here, and well off every hand-placed game and hut on this
  // beach.
  //
  // Built dead last of everything this world adds, after the tug-of-war, so `Hopper`'s own three
  // unconditional draws off the *shared* `rnd()` sequence (idle timer, idle phase, starting heading —
  // the same draws the raccoon's and the scrap-bug's own comments already warned future rounds about)
  // land after every other NPC in this world that times itself off that same sequence, and disturb
  // nothing built earlier on the sand.
  { const rig = makeTigerBeetle();
    game.npcs.push(new Hopper(game, rig, { x: -8, z: 24, leash: 1.0, r: 0.08, dist: [0.15, 0.35], dur: 0.22, height: 0.05, idle: [1, 3],
      onHop: () => { if (rnd.chance(0.25)) SFX.chitter(); } })); }
  // The Neighborhood, Candy Land, Robot City and Victorian all have their own line of marchers
  // (`Marchers` in 55-npcs.js, a `Patroller` lead with followers trailing a fixed gap behind), and so
  // does Frosty Peak — three penguins in a drilled column on the ice. This beach never got one of its
  // own. Three of the beach's own crabs now march in step on wet sand south of the existing crab
  // colony, wheeling back and forth along an 8-crab-length stretch, sideways gait and all.
  //
  // A headless probe (`game.start('new')` then `game.travel(4, 'from-hub')`, 3000 simulated frames to
  // let every wandering crab, gull, turtle and beachgoer settle, then every NPC's own position sampled
  // every 10th frame over another 3000) swept a grid of candidate points and all four axis directions
  // against both those 29,700 samples and all 217 of the beach's own physics boxes, scoring each by
  // its tightest clearance along a short march line from the point. (24, -43) marching east to
  // (26, -43) came back clearest: 7.6 m of headroom at the tightest sampled point — comfortably past
  // the ~2.4 m a trailing crab swings beyond either end when the column turns around — east of the
  // (12, -40) star and south of every hand-placed crab, turtle and buoy on this beach.
  //
  // Built dead last, right after the tiger beetle, for the usual reason: `Patroller`'s own three
  // unconditional draws off the shared `rnd()` sequence (phase, idle clock, cry timer) land after every
  // other timed NPC in this world and disturb no earlier wardrobe or layout pick.
  { const marchers = [0, 1, 2].map(() => { const rig = makeCrab(r.pick([0xe8492b, 0xff7043, 0xc62828])); W.add(rig.group); return rig; });
    game.npcs.push(new Marchers(game, marchers, { points: [[24, -43], [26, -43]], speed: 1.0, pause: [1, 2], r: 0.22, height: 0.5, gap: 0.45,
      cries: ['Sideways, always sideways — try that gait yourself, puss.', 'Column of three. Pincers at the ready.', "Mind the claws, puss — we're only drilling."], cryIcon: '🦀' })); }
  // Every beach, peak, woods and street has run a `Detectorist` sweeping for buried treasure for
  // hundreds of rounds now, and every single one of them has only ever turned up a bottle cap or a
  // button — it's the running joke of the whole series. Nobody had ever actually found anything. **An
  // old wooden chest now lies open on the dry sand inland of the dunes, lid thrown back and a heaped
  // pile of real gold coins spilling over the rim**, a shovel left stuck in the sand beside it and a
  // few loose coins and gems scattered in the sand where they rolled. A boy kneels over it, still
  // catching his breath. *"Everybody else got a bottle cap. I got THIS."* *"Careful, puss — don't you
  // dare knock a single coin back under the sand."* *"Don't tell the detectorist. He'll never forgive
  // himself."*
  //
  // New prop `makeTreasureChest()` in `62-props-nature.js`, right after `makeSandTurtle()` — a wooden
  // trunk (plain toon planks, so `bakeDeep()` folds the box and its dark plank lines into one mesh),
  // iron bands and corner posts, and a lid on its own pivot group hinged at the back top edge and
  // thrown open past vertical. The ten coins heaped on top are fixed positions and tilts, not drawn
  // from any RNG, the same reasoning the dominoes chain's own pip table (round 410) already leans on.
  // A matching `makeShovel()` stands blade-down in the sand alongside. The handful of coins and gems
  // that rolled clear of the chest reuse `makeGemCluster()` exactly as every other beach gem cluster
  // already does — no new code, just a third call with a gold-and-silver palette in place of the usual
  // candy colours.
  //
  // `Kneeler` is the same pairing every other kneeling character in this file already uses, on the
  // beach's own `beachPerson()` wardrobe helper — a placement, not a build, so it draws its three
  // unconditional values off the shared `rnd()` sequence (idle timer, cry timer, wardrobe/hair picks)
  // only once everything above it is already laid out.
  //
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses: `game.start('new')` then
  // `game.travel(4, 'from-hub')`, waited out for real against `game.worldIndex`, then 3000 simulated
  // frames with every NPC's and the squirrel's own position sampled every 10th frame) swept a 2 m grid
  // of the dry sand inland of the dunes (ground height 0.15-2.2 m, radius ≤ 52, short of the radius
  // (58) where `beachRegion`'s own fill takes over) against both those 30,000-odd samples and all 217
  // of the beach's own physics boxes: (-35, 6) came back clearest in the quiet patch west of the
  // squirrel's own stretch, 5.93 m from the nearest box and 6.08 m from the nearest wandering soul, at
  // radius 35.5 from the origin — clear of the keep-out span (`game.zones.addSpan(-52,-14,-44,14)`)
  // guarding the portal approach further west.
  //
  // Built dead last of everything this world adds, after the crab marchers, for the usual reason:
  // `makeHuman()` and `Kneeler` both draw unconditionally off the shared `rnd()` sequence, and anything
  // built earlier on this beach would have its own timing-sensitive pick shifted by it.
  { const tx = -35, tz = 6, kx = tx + 1.3, kz = tz + 0.5, ry = atan2(tx - kx, tz - kz);
    const chest = makeTreasureChest(); placeT(game, U, chest, tx, tz, 0.4);
    boxT(game, tx, tz, 1.0, 0.7, 0.7, { cam: false });
    const shovel = makeShovel(); placeT(game, U, shovel, tx + 0.75, tz - 0.6, 0.6);
    makeGemCluster(game, U, tx + 0.4, tz + 0.9, 4, [0xd4af37, 0xc0c0c0, 0xffd54a], r, 0.9);
    const digger = beachPerson(false, true);
    game.npcs.push(new Kneeler(game, digger, { x: kx, z: kz, ry, cryIcon: '💰',
      cries: ['Everybody else got a bottle cap. I got THIS.', "Careful, puss — don't you dare knock a single coin back under the sand.", "Don't tell the detectorist. He'll never forgive himself."] })); }
  // three fallen hollow logs lie along this coast (the loop above: (-14, 36), (4, -30), (-6, 12)) and
  // all three have sat bare since they were first placed — no kneeler, no creature, nothing like Whisper
  // Woods' own hedgehog hunt (round 91) ever paired up with one. The log out at (-14, 36) gets that
  // pairing now: a kid kneels at its mouth sure there's a hermit crab living inside, and a real one
  // obliges, poking its claws out and ducking straight back.
  // These three logs carry no physics box of their own (unlike the forest's, which get one from
  // `boxT` in the same loop), so the only things a headless probe needs to clear are every other box
  // and NPC trace in the world. A sweep of all three log spots (`game.travel(4, 'from-prev')`, 1200
  // simulated frames sampling every NPC's own position every 15th frame, checked against all 218 of the
  // beach's own physics boxes) found (-14, 36) clearest by far: 4.14 m from the nearest box (a palm at
  // (-16, 40)) and 10 m from the nearest other soul — the other two sit within a few metres of the
  // crab marchers or the sand-crab boy's own kneeling circle.
  // The log itself (`makeHollowLog`, scaled ×0.7 same as the other two) runs its hollow along local
  // +x, rotated by its own `ry`; its true half-length is 1.7 × 0.7 ≈ 1.19 m (the forest's own hollow-log
  // comment already works this out from `L=3.4` in `makeHollowLog`), well short of the kid's 2 m
  // kneeling stand-off and the crab's 1.3 m poke, both measured along the same `(-cos(ry), sin(ry))`
  // bearing the forest's own hedgehog hunt uses for a log's near mouth.
  { const lx = -14, lz = 36, lry = 0.4, dirx = -cos(lry), dirz = sin(lry);
    const kOff = 2.0, kx = lx + kOff * dirx, kz = lz + kOff * dirz, kry = atan2(lx - kx, lz - kz);
    const crabKid = beachPerson(false, true);
    game.npcs.push(new Kneeler(game, crabKid, { x: kx, z: kz, ry: kry,
      cries: ["I saw its claws, I swear it!", "Shh — you'll scare it back in.", "It has to come out sometime. I can wait."] }));
    const hOff = 1.3, hx = lx + hOff * dirx, hz = lz + hOff * dirz;
    const hermit = makeCrab(0xc1662f);
    game.npcs.push(new Hopper(game, hermit, { x: hx, z: hz, leash: 0.2, r: 0.1, dist: [0.1, 0.2], dur: 0.3, height: 0.1, idle: [2, 5],
      onHop: () => { if (rnd.chance(0.25)) SFX.chitter(); } })); }
  const spawn = spawnBySquirrel(game, sq);
  return { update: (dt, t) => { for (const f of U) f(dt, t); }, spawn };
}
/** Adds a ground-following collider for a prop and returns the prop (for chaining into placeT). */
function boxAround(game, obj, x, z, w, h, d, opts = {}) { boxT(game, x, z, w, h, d, opts); return obj; }
/** A small pennant on a short pole at a beach hut's own roof apex (y=3.6 above its own ground), swaying on
 *  the world clock `t` plus a fixed phase from the hut's own index — never `r()` or the shared `rnd()`. */
function addHutFlag(game, U, x, z, color, i) {
  const y0 = game.physics.ground0(x, z) + 3.6, poleM = mat(0xfff5e6, { roughness: 0.6 });
  const pole = group(x, y0, z, game.world);
  mesh(G.cyl(0.018, 0.024, 0.5, 6), poleM, { y: 0.25, shadow: 'none', parent: pole });
  const flag = group(0, 0.5, 0, pole);
  mesh(G.box(0.3, 0.17, 0.012), mat(color, { roughness: 0.6 }), { x: 0.16, shadow: 'none', parent: flag });
  const phase = i * 1.3;
  pole.userData.update = (dt, t) => { flag.rotation.y = 0.5 + sin(t * 2.3 + phase) * 0.25; flag.rotation.z = sin(t * 1.8 + phase) * 0.06; };
  U.push(pole.userData.update);
}
