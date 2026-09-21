// ============================================================================
// CREATURES — rigs (models with animate()) and controllers (AI)
// All rigs face +Z in local space; controllers set group.rotation.y = heading.
// ============================================================================
// ---------------------------------------------------------------- human rig
const SKIN_TONES = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac, 0x6b4423, 0xa9714b, 0xf6d5b8];
const HAIR_COLORS = [0x2b1b12, 0x5a3a1a, 0xd8b06a, 0x1a1a1a, 0xa0522d, 0x777777, 0x3a2418, 0xc97f3a, 0xe8d7a8, 0x4a2c2a];
const HAIR_STYLES = ['short', 'crop', 'bob', 'long', 'pony', 'bun', 'braids', 'curls'];
/** Hair that reads as feminine at a glance — used when picking a look for a woman. */
const LONG_STYLES = ['bob', 'long', 'pony', 'bun', 'braids', 'curls'];
/**
 * The wardrobe. Worlds draw from these through `bag()`, so a street full of people wears a street
 * full of different clothes instead of whatever an unlucky run of the dice hands out.
 */
const SHIRT_COLORS = [0x3f6fd6, 0xe0503c, 0x2e9e6e, 0xf2c744, 0x8a5acf, 0xf7f3ec, 0xff8fab, 0x35b4c4, 0xef7d2f, 0x6b7fd7, 0xb5485f, 0x4c6b3c, 0x9b6b3a, 0x5aa0d8, 0xd9b86a];
const PANTS_COLORS = [0x2c3140, 0x5a4634, 0x8899aa, 0x1e2a44, 0x6b5b4a, 0x3c4a5a, 0x7a6a58, 0x2f3b33];
const SHOE_COLORS = [0x1e1a18, 0x3a2a1e, 0x5a4030, 0xefe7d8, 0x8a2f2f, 0x27354a];
const MOUTH_SHAPES = ['smile', 'smile', 'smile', 'grin', 'small', 'open'];
/** Head radius for every human rig; every face and hat measurement is a multiple of it. */
const HEAD_R = 0.163;

/**
 * A cartoon face on a head group of radius R. Everything is a multiple of R, and the parts that vary
 * from person to person — eye size and spacing, brow angle, the mouth, glasses, freckles, a beard —
 * come in through `o`, because a crowd of identical faces is what makes NPCs read as clones.
 * Returns the parts the rig animates (blinking).
 */
function makeFace(head, R, skinM, hairM, o = {}) {
  const white = basic(0xffffff), iris = mat(o.eye ?? 0x2a1a12, { roughness: 0.3 }), spark = basic(0xffffff);
  const lipM = mat(o.lip ?? 0xc25b62, { roughness: 0.6 }), blushM = mat(skinM.color.clone().lerp(new THREE.Color(0xff8f9e), 0.5).getHex(), { roughness: 1 });
  const eyeR = R * (o.eyeSize ?? 0.25), gap = R * (o.eyeGap ?? 0.36), browTilt = o.brow ?? 0.16;
  const eyes = [];
  for (const side of [1, -1]) {
    const e = group(side * gap, -R * 0.05, R * 0.76, head);
    mesh(G.sphere(eyeR, 12, 10), white, { sz: 0.5, shadow: 'none', parent: e });
    mesh(G.sphere(eyeR * 0.54, 8, 7), iris, { z: eyeR * 0.4, sz: 0.55, shadow: 'none', parent: e });
    mesh(G.sphere(eyeR * 0.19, 6, 5), spark, { x: side * eyeR * 0.24, y: eyeR * 0.28, z: eyeR * 0.56, shadow: 'none', parent: e });
    eyes.push(e);
    mesh(G.box(R * 0.4, R * 0.075, R * 0.06), hairM, { x: side * gap, y: R * 0.24 + eyeR * 0.5, z: R * 0.86, rz: side * browTilt, shadow: 'none', parent: head });   // brow
    mesh(G.sphere(R * 0.2, 8, 6), blushM, { x: side * R * 0.62, y: -R * 0.3, z: R * 0.66, sz: 0.28, shadow: 'none', parent: head });                               // blush
    mesh(G.sphere(R * 0.17, 8, 7), skinM, { x: side * R * 0.93, y: -R * 0.04, sx: 0.5, sz: 0.85, shadow: 'none', parent: head });                                  // ear
  }
  mesh(G.sphere(R * 0.14, 8, 7), skinM, { y: -R * 0.18, z: R * 0.9, sz: 0.9, shadow: 'none', parent: head });                                                      // nose
  switch (o.mouth) {
    case 'grin':
      mesh(G.torus(R * 0.3, R * 0.055, 5, 14, PI), lipM, { y: -R * 0.32, z: R * 0.8, rz: PI, shadow: 'none', parent: head });
      mesh(G.box(R * 0.44, R * 0.08, R * 0.03), basic(0xfffdf8), { y: -R * 0.28, z: R * 0.87, shadow: 'none', parent: head });      // a line of teeth
      break;
    case 'small': mesh(G.sphere(R * 0.1, 8, 6), lipM, { y: -R * 0.37, z: R * 0.87, sz: 0.45, shadow: 'none', parent: head }); break;
    case 'open': mesh(G.sphere(R * 0.14, 10, 8), lipM, { y: -R * 0.37, z: R * 0.84, sy: 0.85, sz: 0.5, shadow: 'none', parent: head }); break;
    default: mesh(G.torus(R * 0.26, R * 0.05, 5, 14, PI), lipM, { y: -R * 0.36, z: R * 0.8, rz: PI, shadow: 'none', parent: head });
  }
  if (o.freckles) {
    const fk = mat(0xb5714a, { roughness: 1 });
    for (const side of [1, -1]) for (let i = 0; i < 3; i++) mesh(G.sphere(R * 0.036, 5, 4), fk, { x: side * (R * 0.42 + i * R * 0.15), y: -R * 0.14 + (i % 2) * R * 0.09, z: R * 0.79, shadow: 'none', parent: head });
  }
  if (o.beard) {
    mesh(G.torus(R * 0.8, R * 0.24, 6, 16, PI), hairM, { y: -R * 0.64, z: R * 0.02, rx: -PI / 2, sy: 0.85, shadow: 'none', parent: head });   // a band round the jaw, under the mouth
    mesh(G.sphere(R * 0.4, 8, 7), hairM, { y: -R * 0.86, z: R * 0.42, sz: 0.8, shadow: 'none', parent: head });                          // chin
    mesh(G.box(R * 0.46, R * 0.1, R * 0.08), hairM, { y: -R * 0.24, z: R * 0.88, shadow: 'none', parent: head });                    // moustache
  } else if (o.moustache) {
    mesh(G.box(R * 0.5, R * 0.11, R * 0.08), hairM, { y: -R * 0.25, z: R * 0.88, shadow: 'none', parent: head });
  }
  if (o.glasses) {
    const fr = mat(o.glassColor ?? 0x33302c, { roughness: 0.4 });
    for (const side of [1, -1]) mesh(G.torus(eyeR * 1.24, R * 0.032, 4, 14), fr, { x: side * gap, y: -R * 0.05, z: R * 0.84, shadow: 'none', parent: head });
    mesh(G.box(gap * 0.7, R * 0.028, R * 0.028), fr, { y: -R * 0.05, z: R * 0.87, shadow: 'none', parent: head });                   // bridge
    for (const side of [1, -1]) mesh(G.box(R * 0.03, R * 0.028, R * 0.4), fr, { x: side * R * 0.72, y: -R * 0.05, z: R * 0.66, shadow: 'none', parent: head });   // temples
  }
  return { eyes };
}

/**
 * Hair for a head of radius R. Everything but the skull cap sits behind z=0 so it can never cover the
 * face; the silhouette is what tells people apart at a distance.
 */
function makeHair(head, R, hairM, style) {
  if (style === 'bald') return;
  mesh(G.dome(R * 1.05, 16, 10), hairM, { y: R * 0.2, sy: 0.95, parent: head });    // skull cap, sits above the brows
  mesh(G.sphere(R * 0.85, 12, 10), hairM, { y: R * 0.1, z: -R * 0.42, sz: 0.85, parent: head });   // back of the head
  mesh(G.sphere(R * 0.62, 12, 9), hairM, { y: R * 0.42, z: R * 0.6, sx: 1.35, sy: 0.6, sz: 0.55, parent: head });   // a fringe, so the hairline is not a bare rim
  if (style === 'crop') return;
  const curtain = (len, drop) => { for (const side of [1, -1]) mesh(G.capsule(R * 0.3, len * R, 8), hairM, { x: side * R * 0.82, y: -drop * R, z: -R * 0.22, sx: 0.8, sz: 0.75, parent: head }); };
  if (style === 'short') { mesh(G.sphere(R * 0.62, 10, 8), hairM, { y: R * 0.32, z: -R * 0.55, parent: head }); return; }
  if (style === 'bob') { curtain(1.1, 0.7); mesh(G.sphere(R * 1.0, 14, 10), hairM, { y: -R * 0.35, z: -R * 0.5, sy: 0.9, sz: 0.8, parent: head }); return; }
  if (style === 'long') { curtain(1.8, 1.1); mesh(G.capsule(R * 0.85, R * 2.4, 12), hairM, { y: -R * 1.5, z: -R * 0.5, sx: 1.05, sz: 0.5, parent: head }); return; }
  if (style === 'pony') { mesh(G.capsule(R * 0.36, R * 1.9, 10), hairM, { y: -R * 0.75, z: -R * 1.15, rx: -0.4, parent: head }); mesh(G.torus(R * 0.3, R * 0.07, 6, 14), mat(0xff6fb5, { roughness: 0.8 }), { y: R * 0.22, z: -R * 0.85, rx: 0.5, shadow: 'none', parent: head }); return; }
  if (style === 'bun') { mesh(G.sphere(R * 0.55, 12, 10), hairM, { y: R * 0.75, z: -R * 0.62, parent: head }); return; }
  if (style === 'braids') { for (const side of [1, -1]) { mesh(G.capsule(R * 0.26, R * 1.4, 8), hairM, { x: side * R * 0.86, y: -R * 0.95, z: -R * 0.3, rz: side * 0.14, parent: head }); mesh(G.sphere(R * 0.2, 8, 6), mat(0xff6fb5, { roughness: 0.8 }), { x: side * R * 1.0, y: -R * 1.75, z: -R * 0.3, shadow: 'none', parent: head }); } return; }
  if (style === 'curls') { for (let i = 0; i < 10; i++) { const a = 0.5 + i / 10 * (TAU - 1.0); mesh(G.sphere(R * 0.4, 8, 7), hairM, { x: sin(a) * R * 0.88, y: R * 0.32 + sin(i * 2.1) * R * 0.22, z: -cos(a) * R * 0.88 - R * 0.06, parent: head }); } }
}

/**
 * A townsperson. Proportions come from `o.height` and `o.build` ('slim' | 'average' | 'stout');
 * anyone much shorter than an adult also gets a child's larger head and shorter limbs, so the
 * kids in a crowd read as kids rather than as small adults.
 *
 * Clothes are layered on the same body: `shirt` always, then optionally `jacket`, `dress`, `skirt`,
 * `shorts`, `apron`, `scarf`, `bag`. Hands are mittens with a thumb — an arm that ends in nothing
 * is what made the old rig look like a paper doll.
 */
function makeHuman(o = {}) {
  const g = new THREE.Group(), H = o.height ?? 1.75, k = H / 1.75, female = !!o.female;
  const skinM = mat(o.skin ?? 0xe0ac69, { roughness: 0.8 }), shirtM = mat(o.shirt ?? 0x3f6fd6), pantsM = mat(o.pants ?? 0x2c3140), shoeM = mat(o.shoes ?? 0x1e1a18);
  const hairM = mat(o.hair ?? 0x2b1b12), hatM = mat(o.hatColor ?? 0x111111, { roughness: 0.5 });
  const jacketM = o.jacket ? mat(o.jacket) : null;
  const rig = { group: g, legs: [], arms: [], hands: [], k, look: o };   // `look` is kept for the tests and QA line-ups
  const body = group(0, 0, 0, g); rig.body = body;
  body.scale.setScalar(k);
  // a child is not a scaled-down adult: the head keeps more of its size and the limbs lose some
  const childish = clamp((1.62 - H) / 0.5, 0, 1);
  const build = o.build ?? 'average', stout = build === 'stout' ? 1 : 0, slim = build === 'slim' ? 1 : 0;
  const girth = 1 + stout * 0.28 - slim * 0.12;
  const R = HEAD_R, hipW = (female ? 0.084 : 0.08) * (1 + stout * 0.2), shW = (female ? 0.2 : 0.225) * girth, bare = o.dress || o.skirt;
  // ---- legs: hip 0.90 → knee 0.50 → ankle 0.10, so the soles sit flat on the ground
  for (const side of [1, -1]) {
    const hip = group(side * (o.dress ? 0.075 : hipW), 0.9, 0, body);
    mesh(G.capsule(bare ? 0.068 : 0.088 * girth, 0.24), bare ? skinM : pantsM, { y: -0.2, parent: hip });
    const knee = group(0, -0.4, 0, hip);
    mesh(G.capsule(bare ? 0.057 : 0.072 * girth, 0.26), o.shorts || bare ? skinM : pantsM, { y: -0.2, parent: knee });
    const ankle = group(0, -0.4, 0, knee);
    if (!bare && !o.shorts) mesh(G.capsule(0.072 * girth, 0.03, 8), pantsM, { y: 0.06, sy: 0.9, parent: ankle });     // trouser cuff over the shoe
    mesh(G.box(0.1, 0.055, 0.2), shoeM, { y: -0.072, z: 0.042, parent: ankle });                                      // sole
    mesh(G.sphere(0.052, 10, 8), shoeM, { y: -0.052, z: 0.122, sy: 0.85, sz: 0.9, parent: ankle });                   // rounded toe
    mesh(G.box(0.094, 0.05, 0.075), shoeM, { y: -0.018, z: -0.008, parent: ankle });                                  // heel cup
    rig.legs.push({ hip, knee, ankle });
  }
  // ---- pelvis + torso: a chest that tapers to a waist, not a slab
  const spine = group(0, 0.9, 0, body); rig.spine = spine;   // the upper body pivots here: leaning, stooping, bowing
  mesh(G.capsule(0.13 * girth, 0.1, 12), o.skirt ? mat(o.skirt) : pantsM, { y: 0.97, sz: 0.62, rz: PI / 2, parent: body });
  if (o.dress) {
    mesh(G.cyl(0.23 * girth, 0.44, 0.92, 16), mat(o.dress), { y: 0.56, parent: body });
    mesh(G.cyl(0.455, 0.44, 0.06, 16), mat(o.dress, { roughness: 1 }), { y: 0.12, shadow: 'none', parent: body });      // hem
    if (o.sash) mesh(G.torus(0.2, 0.028, 6, 18), mat(o.sash), { y: 0.12, rx: PI / 2, sz: 0.66, shadow: 'none', parent: spine });
  } else if (o.skirt) mesh(G.cyl(0.18 * girth, 0.31, 0.36, 16), mat(o.skirt), { y: 0.9, parent: body });
  const torsoM = jacketM ?? shirtM;
  mesh(G.capsule(0.152 * girth, o.coat ? 0.34 : 0.2, 14), torsoM, { y: o.coat ? 0.24 : 0.3, sx: female ? 1.02 : 1.16, sz: 0.66, parent: spine });
  mesh(G.capsule(0.125 * girth, 0.1, 12), torsoM, { y: 0.5, sx: 1.55, sz: 0.68, rz: PI / 2, parent: spine });            // shoulder yoke
  if (jacketM) {   // an open jacket: two front panels with the shirt showing between them
    for (const side of [1, -1]) mesh(G.box(0.1, 0.4, 0.04), jacketM, { x: side * 0.1, y: 0.28, z: 0.115 * girth, rz: side * 0.04, parent: spine });
    mesh(G.capsule(0.08, 0.26, 10), shirtM, { y: 0.29, sx: 1.0, sz: 0.45, z: 0.09, shadow: 'none', parent: spine });
  }
  if (o.stripes) {   // a striped top: three bands round the chest
    const bandM = mat(o.stripes, { roughness: 0.9 });
    for (let i = 0; i < 3; i++) mesh(G.capsule(0.153 * girth, 0.028, 12), bandM, { y: 0.18 + i * 0.11, sx: female ? 1.02 : 1.16, sz: 0.665, shadow: 'none', parent: spine });
  }
  if (o.apron) {
    mesh(G.box(0.24, 0.42, 0.03), mat(o.apron), { y: 0.12, z: 0.11 * girth, parent: spine });
    mesh(G.box(0.3, 0.04, 0.03), mat(o.apron), { y: 0.32, z: 0.115 * girth, shadow: 'none', parent: spine });
  }
  if (o.belt) mesh(G.capsule(0.14 * girth, 0.09, 12), mat(o.belt, { roughness: 0.5 }), { y: 0.16, sx: 1.06, sz: 0.68, rz: PI / 2, shadow: 'none', parent: spine });
  if (o.buttons) { const bm = mat(o.buttons, { roughness: 0.4 }); for (let i = 0; i < 3; i++) mesh(G.sphere(0.017, 6, 5), bm, { y: 0.17 + i * 0.12, z: 0.108 * girth, sz: 0.5, shadow: 'none', parent: spine }); }
  // collar, so the shirt does not simply stop at the neck
  mesh(G.torus(0.07, 0.024, 5, 14), torsoM, { y: 0.6, rx: PI / 2, sz: 0.8, shadow: 'none', parent: spine });
  if (o.scarf) {
    const sc = mat(o.scarf, { roughness: 0.95 });
    mesh(G.torus(0.082, 0.04, 6, 16), sc, { y: 0.665, rx: PI / 2, sz: 0.85, parent: spine });
    mesh(G.box(0.07, 0.24, 0.035), sc, { x: 0.05, y: 0.48, z: 0.1, rz: 0.12, parent: spine });
  }
  if (o.bag) {   // a satchel on a strap across the chest
    const bg = mat(o.bag, { roughness: 0.85 });
    mesh(G.box(0.035, 0.4, 0.02), bg, { x: -0.03, y: 0.34, z: 0.1, rz: -0.42, shadow: 'none', parent: spine });
    mesh(G.box(0.2, 0.17, 0.09), bg, { x: 0.19, y: 0.14, z: 0.02, parent: spine });
  }
  if (o.backpack) { const bp = mat(o.backpack, { roughness: 0.9 }); mesh(G.box(0.26, 0.3, 0.14), bp, { y: 0.3, z: -0.15 * girth, parent: spine }); mesh(G.box(0.2, 0.04, 0.03), bp, { y: 0.38, z: -0.225 * girth, shadow: 'none', parent: spine }); }
  // ---- arms: sleeve, forearm, and a mitten hand with a thumb
  const sleeveM = o.dress && !o.coat ? mat(o.dress) : (jacketM ?? shirtM);
  for (const side of [1, -1]) {
    const sh = group(side * shW, 0.51, 0, spine);
    mesh(G.capsule(0.052 * girth, 0.2), sleeveM, { y: -0.14, parent: sh });
    const el = group(0, -0.29, 0, sh);
    mesh(G.capsule(0.046 * girth, 0.18), o.coat || o.sleeves ? sleeveM : skinM, { y: -0.12, parent: el });
    if (o.cuffs) mesh(G.capsule(0.05 * girth, 0.02, 8), mat(o.cuffs), { y: -0.21, shadow: 'none', parent: el });
    const hand = group(0, -0.28, 0, el);
    mesh(G.sphere(0.056, 10, 8), skinM, { sx: 0.82, sz: 0.66, parent: hand });
    mesh(G.capsule(0.019, 0.024, 6), skinM, { x: side * 0.04, y: 0.012, z: 0.016, rz: side * 0.8, shadow: 'none', parent: hand });   // thumb
    rig.hands.push(hand);
    if (o.cane && side === -1) mesh(G.cyl(0.013, 0.013, 0.86, 6), mat(0x3a2718), { y: -0.3, z: 0.08, parent: hand });
    if (o.axe && side === 1) { mesh(G.cyl(0.018, 0.022, 0.8, 6), mat(0x6a4a2a, { roughness: 0.9 }), { y: 0.3, z: 0.02, parent: hand }); mesh(G.box(0.05, 0.22, 0.14), mat(0x9aa3ad, { metalness: 0.7, roughness: 0.35 }), { y: 0.66, z: 0.06, parent: hand }); }   // a woodcutter's axe
    if (o.pole && side === 1) { mesh(G.cyl(0.012, 0.014, 1.7, 6), mat(0x4a3a2a), { y: 0.55, z: 0.03, parent: hand }); mesh(G.sphere(0.035, 8, 6), glowMat(0xffb060, 1.4), { y: 1.42, z: 0.03, shadow: 'none', parent: hand }); }   // a lamplighter's pole, lit at the tip
    rig.arms.push({ sh, el });
  }
  mesh(G.cyl(0.05, 0.058, 0.14, 8), skinM, { y: 0.63, parent: spine });            // neck: 5 cm of it shows between the collar and the chin
  const head = group(0, 0.835, 0, spine); rig.head = head;
  head.scale.setScalar(1 + childish * 0.2);
  mesh(G.sphere(R, 18, 14), skinM, { sy: 1.02, sz: 0.94, parent: head });
  rig.eyes = makeFace(head, R, skinM, hairM, {
    lip: female ? 0xd05a70 : 0xb5544f, eye: o.eyeColor, mouth: o.mouth, eyeSize: o.eyeSize ?? (0.25 + childish * 0.04),
    eyeGap: o.eyeGap, brow: o.brow, freckles: o.freckles, glasses: o.glasses, glassColor: o.glassColor,
    beard: o.beard, moustache: o.moustache,
  }).eyes;
  const style = o.hairStyle ?? (female ? 'long' : 'short');
  if (o.hat === 'bonnet') {
    makeHair(head, R, hairM, style === 'short' ? 'bob' : style);
    mesh(G.dome(R * 1.12, 14, 9), hatM, { y: R * 0.18, z: -R * 0.16, sy: 1.05, parent: head });
    mesh(G.torus(R * 1.16, R * 0.13, 6, 22, PI), hatM, { y: R * 0.14, z: R * 0.04, rx: -0.28, parent: head });
    mesh(G.cyl(R * 0.05, R * 0.05, R * 1.1, 6), hatM, { x: R * 0.92, y: -R * 0.5, rz: 0.26, shadow: 'none', parent: head });
  } else {
    makeHair(head, R, hairM, style);
    if (o.hat === 'top') { const hat = group(0, 0, 0, head); rig.hat = hat; mesh(G.cyl(R * 1.5, R * 1.5, R * 0.14, 16), hatM, { y: R * 0.72, parent: hat }); mesh(G.cyl(R * 0.95, R * 1.02, R * 1.6, 16), hatM, { y: R * 1.52, parent: hat }); mesh(G.torus(R * 0.98, R * 0.09, 6, 20), mat(o.hatBand ?? 0x8b1a1a), { y: R * 0.86, rx: PI / 2, shadow: 'none', parent: hat }); }
    if (o.hat === 'cap') { mesh(G.dome(R * 1.1, 14, 9), hatM, { y: R * 0.14, parent: head }); mesh(G.box(R * 1.2, R * 0.13, R * 0.75), hatM, { y: R * 0.28, z: R * 0.98, rx: -0.12, parent: head }); }
    if (o.hat === 'beanie') { mesh(G.dome(R * 1.12, 14, 9), hatM, { y: R * 0.02, sy: 1.15, parent: head }); mesh(G.torus(R * 1.08, R * 0.16, 6, 18), hatM, { y: R * 0.06, rx: PI / 2, shadow: 'none', parent: head }); mesh(G.sphere(R * 0.3, 8, 6), mat(0xffffff, { roughness: 1 }), { y: R * 1.2, shadow: 'none', parent: head }); }
    if (o.hat === 'sunhat') { mesh(G.dome(R * 1.12, 14, 9), hatM, { y: R * 0.14, parent: head }); mesh(G.cyl(R * 2.1, R * 2.1, R * 0.12, 18), hatM, { y: R * 0.2, parent: head }); mesh(G.torus(R * 1.05, R * 0.13, 6, 18), mat(0xd62839), { y: R * 0.34, rx: PI / 2, shadow: 'none', parent: head }); }
    if (o.hat === 'helmet') { mesh(G.dome(R * 1.1, 14, 10), hatM, { y: R * 0.1, sy: 1.75, parent: head }); mesh(G.torus(R * 1.12, R * 0.08, 6, 18), hatM, { y: R * 0.12, rx: PI / 2, shadow: 'none', parent: head }); mesh(G.sphere(R * 0.16, 8, 6), mat(0xd8d8d8, { roughness: 0.4 }), { y: R * 0.75, z: R * 1.02, shadow: 'none', parent: head }); mesh(G.sphere(R * 0.1, 8, 6), mat(0xd8d8d8, { roughness: 0.4 }), { y: R * 2.0, shadow: 'none', parent: head }); }   // a bobby's helmet: tall dome, badge, a knob on top
    if (o.hat === 'flatcap') { mesh(G.dome(R * 1.12, 14, 9), hatM, { y: R * 0.1, sy: 0.72, parent: head }); mesh(G.box(R * 1.15, R * 0.1, R * 0.62), hatM, { y: R * 0.2, z: R * 0.95, rx: -0.2, parent: head }); }
  }
  // ---- animation. Walk swings the limbs; standing still, people shift their weight, glance
  // around and occasionally wave, which is most of what stops a crowd looking like mannequins.
  const legSwing = (o.dress ? 0.32 : 1) * (o.cane ? 0.7 : 1);
  const restArm = 0.34;      // elbows are never locked straight
  const stoop = o.elder ? 0.17 : 0, skip = o.child ? 1 : 0;   // elders stoop from the hips; children bounce when they walk
  rig.blinkT = rnd.range(1, 5);
  rig.idleT = rnd.range(3, 11);
  rig.gesture = null; rig.gT = 0; rig.sway = rnd.range(0, TAU);
  rig.animate = (ph, moving, dt, t = 0) => {
    // pick something to do while standing around
    if (!moving) {
      rig.idleT -= dt;
      if (rig.idleT <= 0 && !rig.gesture) { rig.gesture = rnd.pick(['wave', 'look', 'nod', 'shift', 'shift']); rig.gT = 0; rig.idleT = rnd.range(5, 14); }
    } else if (rig.gesture !== 'wave') rig.gesture = null;
    let waveArm = 0, nod = 0, turn = 0, lean = 0, throwArm = null, chop = null;
    if (rig.gesture) {
      rig.gT += dt;
      const u = rig.gT / (rig.gesture === 'throw' ? 0.9 : rig.gesture === 'chop' ? 1.1 : 1.6);   // a throw or a chop is quick; every other gesture runs for 1.6s
      const swell = sin(clamp(u, 0, 1) * PI);       // eases in and back out
      if (rig.gesture === 'wave') { waveArm = swell; turn = swell * 0.18; }
      else if (rig.gesture === 'pose') { waveArm = min(1, rig.gT * 3); turn = 0; }   // for a photo: the hand up and held, no time-out
      else if (rig.gesture === 'throw') { throwArm = u < 0.3 ? 1.3 : u < 0.6 ? -2.6 : 0; lean = u < 0.3 ? -0.08 : u < 0.6 ? 0.1 : 0; }
      else if (rig.gesture === 'reach' || rig.gesture === 'post') { waveArm = swell; turn = 0; }
      else if (rig.gesture === 'chop') { chop = u; lean = u < 0.55 ? -0.12 : 0.28; }   // reach: the arm straight up and held there; post: out in front, into a letterbox
      else if (rig.gesture === 'look') turn = sin(rig.gT * 2.2) * swell * 0.7;
      else if (rig.gesture === 'nod') nod = sin(rig.gT * 5.5) * swell * 0.22;
      else if (rig.gesture === 'shift') lean = swell * 0.05;
      if (u >= 1 && rig.gesture !== 'pose') rig.gesture = null;
    }
    for (let i = 0; i < 2; i++) {
      const p = ph + i * PI, L = rig.legs[i], A = rig.arms[i];
      if (moving) {
        L.hip.rotation.x = -sin(p) * 0.5 * legSwing;
        L.knee.rotation.x = max(0, cos(p)) * 0.95 * legSwing;
        L.ankle.rotation.x = -L.knee.rotation.x * 0.45 + sin(p) * 0.12;      // the foot stays level as the knee bends
        if (throwArm !== null && i === 0) { A.sh.rotation.x = damp(A.sh.rotation.x, throwArm, 16, dt); A.el.rotation.x = damp(A.el.rotation.x, throwArm > 0 ? -1.6 : -0.3, 16, dt); }
        else if (o.cane && i === 1) { A.sh.rotation.x = damp(A.sh.rotation.x, -0.5 + sin(p) * 0.08, 10, dt); A.el.rotation.x = damp(A.el.rotation.x, -0.1, 10, dt); }   // the cane hand stays planted ahead
        else { A.sh.rotation.x = sin(p) * (0.42 + skip * 0.25); A.el.rotation.x = -restArm - max(0, sin(p)) * (0.25 + skip * 0.3); }
      } else if (chop !== null) {
        L.hip.rotation.x = damp(L.hip.rotation.x, 0, 8, dt); L.knee.rotation.x = damp(L.knee.rotation.x, 0, 8, dt); L.ankle.rotation.x = damp(L.ankle.rotation.x, 0, 8, dt);
        const up = chop < 0.55;   // both hands: slowly up over the head, then down hard
        A.sh.rotation.x = damp(A.sh.rotation.x, up ? -2.8 : -0.55, up ? 5 : 22, dt); A.el.rotation.x = damp(A.el.rotation.x, up ? -0.5 : -0.1, up ? 5 : 22, dt);
      } else if (throwArm !== null && i === 0) {
        L.hip.rotation.x = damp(L.hip.rotation.x, 0, 8, dt); L.knee.rotation.x = damp(L.knee.rotation.x, 0, 8, dt); L.ankle.rotation.x = damp(L.ankle.rotation.x, 0, 8, dt);
        A.sh.rotation.x = damp(A.sh.rotation.x, throwArm, 16, dt); A.el.rotation.x = damp(A.el.rotation.x, throwArm > 0 ? -1.6 : -0.3, 16, dt);
      } else {
        L.hip.rotation.x = damp(L.hip.rotation.x, 0, 8, dt);
        L.knee.rotation.x = damp(L.knee.rotation.x, 0, 8, dt);
        L.ankle.rotation.x = damp(L.ankle.rotation.x, 0, 8, dt);
        // the raised arm waves; the other one rests
        const waving = waveArm > 0 && i === 0, caning = o.cane && i === 1;
        const reaching = rig.gesture === 'reach', posting = rig.gesture === 'post', posing = rig.gesture === 'pose';
        A.sh.rotation.x = damp(A.sh.rotation.x, waving ? (reaching ? -2.9 : posting ? -1.15 : posing ? -2.2 : -2.5) * waveArm : caning ? -0.5 : 0, 8, dt);
        A.el.rotation.x = damp(A.el.rotation.x, waving ? (reaching ? -0.15 : posting ? -0.2 : posing ? -0.7 : -0.5 - sin(rig.gT * 11) * 0.35) : caning ? -0.1 : -restArm, 10, dt);
      }
      // arms hang a little away from the body, more so on a stouter build
      A.sh.rotation.z = chop !== null ? (i ? -1 : 1) * 0.1 : (i ? -1 : 1) * (0.19 + stout * 0.1 + (waveArm > 0 && i === 0 ? waveArm * (rig.gesture === 'reach' || rig.gesture === 'post' ? 0.05 : 0.5) : 0));
      A.el.rotation.z = (i ? 1 : -1) * 0.1;      // forearms angle back in toward the hips
    }
    // blink: both eyes squash flat for a moment, every few seconds
    rig.blinkT -= dt;
    const shut = rig.blinkT < 0 && rig.blinkT > -0.12 ? 0.08 : 1;
    if (rig.blinkT < -0.12) rig.blinkT = rnd.range(1.8, 6);
    for (const e of rig.eyes) e.scale.y = damp(e.scale.y, shut, 30, dt);
    if (moving) {
      // the bob of a walk; a child's is a skip, with a hop on every step
      body.position.y = (abs(sin(ph)) * 0.035 + skip * abs(sin(ph)) ** 6 * 0.12) * k;
      body.rotation.z = damp(body.rotation.z, o.cane ? sin(ph) * 0.03 : 0, 8, dt);
      spine.rotation.z = damp(spine.rotation.z, 0, 8, dt);
      spine.rotation.x = damp(spine.rotation.x, stoop + (o.cane ? 0.06 : 0), 6, dt);
      head.rotation.y = damp(head.rotation.y, 0, 8, dt);
      head.rotation.x = damp(head.rotation.x, -stoop * 0.7, 8, dt);
      head.rotation.z = sin(ph) * 0.03;
    } else {
      // a slow breathing sway, so nobody is ever perfectly still
      rig.sway += dt * 0.7;
      body.position.y = damp(body.position.y, sin(rig.sway) * 0.006 * k, 6, dt);
      body.rotation.z = damp(body.rotation.z, 0, 6, dt);
      spine.rotation.z = damp(spine.rotation.z, chop !== null ? 0 : lean, 6, dt);
      spine.rotation.x = damp(spine.rotation.x, stoop + (rig.gesture === 'nod' ? nod * 0.3 : 0) + (chop !== null ? lean : 0), chop !== null && chop >= 0.55 ? 18 : 6, dt);
      head.rotation.y = damp(head.rotation.y, turn + sin(rig.sway * 0.35) * 0.3, 5, dt);
      head.rotation.x = damp(head.rotation.x, nod - stoop * 0.7, 12, dt);
      head.rotation.z = damp(head.rotation.z, lean * 0.5, 6, dt);
    }
  };
  bakeRig(g);   // 51 meshes → about 20: every joint's static parts become one vertex-coloured mesh
  return rig;
}

/**
 * A ready-made townsperson: a coherent set of looks, half of them women. `w` is an optional
 * wardrobe of `bag()` draws (see makeWardrobe) — pass one and a crowd is guaranteed to differ,
 * rather than relying on independent dice rolls that happily hand out five red shirts in a row.
 */
function randomPerson(r, o = {}) {
  const female = o.female ?? r.chance(0.5);
  const w = o.wardrobe;
  const child = o.child ?? false;
  const elder = o.elder ?? (!child && r.chance(0.16));   // grey, a little stooped, and more likely in glasses
  return {
    female, child, elder,
    skin: r.pick(SKIN_TONES), hair: elder ? r.pick([0x8a8a8a, 0xd8d8d8, 0xb5b5b5, 0xe8e8e8]) : r.pick(HAIR_COLORS),
    hairStyle: female ? r.pick(elder ? ['bun', 'bob', 'curls'] : LONG_STYLES) : r.pick(elder ? ['crop', 'bald', 'short'] : ['short', 'short', 'crop', 'curls', 'bun']),
    height: child ? r.range(1.05, 1.35) : (female ? r.range(1.58, 1.74) : r.range(1.66, 1.88)) - (elder ? 0.05 : 0),
    build: r.pick(['average', 'average', 'average', 'slim', 'stout']),
    shirt: w ? w.shirt() : r.pick(SHIRT_COLORS),
    pants: w ? w.pants() : r.pick(PANTS_COLORS),
    shoes: w ? w.shoes() : r.pick(SHOE_COLORS),
    mouth: r.pick(MOUTH_SHAPES),
    eyeGap: r.range(0.33, 0.4), eyeSize: r.range(0.23, 0.28), brow: r.range(0.08, 0.24),
    freckles: r.chance(0.22),
    glasses: r.chance(elder ? 0.6 : 0.2),
    beard: !female && !child && r.chance(elder ? 0.3 : 0.16),
    moustache: !female && !child && r.chance(0.12),
    ...o,
  };
}

/** A shuffled wardrobe for one world: consecutive people are guaranteed different clothes. */
function makeWardrobe(r, o = {}) {
  return {
    shirt: bag(r, o.shirts ?? SHIRT_COLORS),
    pants: bag(r, o.pants ?? PANTS_COLORS),
    shoes: bag(r, o.shoes ?? SHOE_COLORS),
  };
}

// ---------------------------------------------------------------- gingerbread rig: a flat cookie with piped icing outlines
function makeGingerbread() {
  const g = new THREE.Group(), rig = { group: g, legs: [], arms: [], cookie: true };
  const dough = mat(0xc27b3a, { roughness: 0.95 }), icing = mat(0xfffdf7, { roughness: 0.35 });
  const gum = (c) => glowMat(c, 0.45, { roughness: 0.3 });
  const body = group(0, 0, 0, g); rig.body = body;
  const TH = 0.48;    // cookie thickness (scale on z)
  // every dough part gets a slightly larger white copy set just behind it: from the front it reads as a piped icing outline
  const piped = (geo, o, parent) => { mesh(geo, dough, { ...o, sz: (o.sz ?? 1) * TH, parent }); mesh(geo, icing, { ...o, sx: (o.sx ?? 1) * 1.14, sy: (o.sy ?? 1) * 1.08, sz: (o.sz ?? 1) * TH * 0.92, z: (o.z ?? 0) - 0.012, shadow: 'none', parent }); };
  piped(G.capsule(0.21, 0.3, 12), { y: 0.66 }, body);
  for (const side of [1, -1]) {
    const leg = group(side * 0.1, 0.42, 0, body); piped(G.capsule(0.085, 0.24, 10), { x: side * 0.035, y: -0.17, rz: side * 0.22 }, leg);
    mesh(G.torus(0.09, 0.016, 6, 16), icing, { x: side * 0.07, y: -0.3, rx: PI / 2, rz: side * 0.22, shadow: 'none', parent: leg }); rig.legs.push(leg);
    const arm = group(side * 0.2, 0.8, 0, body); piped(G.capsule(0.07, 0.24, 10), { x: side * 0.13, y: -0.08, rz: side * 1.05 }, arm);
    mesh(G.torus(0.075, 0.015, 6, 16), icing, { x: side * 0.22, y: -0.19, rx: PI / 2, rz: side * 1.05, shadow: 'none', parent: arm }); rig.arms.push(arm);
  }
  const head = group(0, 1.08, 0, body); rig.head = head;
  piped(G.sphere(0.2, 16, 12), {}, head);
  for (const side of [1, -1]) {
    mesh(G.sphere(0.03, 8, 6), icing, { x: side * 0.07, y: 0.045, z: 0.09, shadow: 'none', parent: head });
    mesh(G.sphere(0.014, 6, 6), mat(0x1a1a1a), { x: side * 0.07, y: 0.045, z: 0.115, shadow: 'none', parent: head });
    mesh(G.sphere(0.035, 8, 6), mat(0xff8fab, { roughness: 0.9 }), { x: side * 0.13, y: -0.02, z: 0.08, sz: 0.4, shadow: 'none', parent: head });   // rosy cheeks
  }
  mesh(G.torus(0.075, 0.013, 6, 16, PI), icing, { y: -0.045, z: 0.095, rz: PI, shadow: 'none', parent: head });            // icing smile
  for (let i = 0; i < 3; i++) mesh(G.sphere(0.03, 8, 6), gum([0xff3355, 0x4ade80, 0x64b5f6][i]), { y: 0.8 - i * 0.15, z: 0.11, shadow: 'none', parent: body });   // gumdrop buttons
  for (const side of [1, -1]) mesh(G.cone(0.05, 0.09, 4), gum(0xff3355), { x: side * 0.06, y: 0.92, z: 0.1, rz: side * PI / 2, shadow: 'none', parent: body });   // bow tie
  mesh(G.sphere(0.022, 6, 6), gum(0xff3355), { y: 0.92, z: 0.11, shadow: 'none', parent: body });
  rig.animate = (ph, moving, dt) => {
    body.rotation.z = moving ? sin(ph) * 0.14 : damp(body.rotation.z, 0, 6, dt);
    body.position.y = moving ? abs(sin(ph)) * 0.05 : 0;
    for (let i = 0; i < 2; i++) { rig.legs[i].rotation.x = moving ? sin(ph + i * PI) * 0.45 : damp(rig.legs[i].rotation.x, 0, 8, dt); rig.arms[i].rotation.x = moving ? sin(ph + i * PI + PI) * 0.3 : damp(rig.arms[i].rotation.x, 0, 6, dt); }
    head.rotation.z = moving ? -sin(ph) * 0.08 : sin(ph * 0.2) * 0.1;
  };
  bakeRig(g);
  return rig;
}

// ---------------------------------------------------------------- robot rig
function makeRobot() {
  const g = new THREE.Group(), rig = { group: g, legs: [], arms: [], robot: true };
  const steel = mat(0x9aa3ad, { metalness: 0.85, roughness: 0.3 }), dark = mat(0x3a3f47, { metalness: 0.8, roughness: 0.4 }), cyan = glowMat(0x00e5ff, 1.6);
  const body = group(0, 0, 0, g); rig.body = body;
  for (const side of [1, -1]) {
    const hip = group(side * 0.14, 0.62, 0, body);
    mesh(G.box(0.14, 0.3, 0.16), dark, { y: -0.16, parent: hip });
    const knee = group(0, -0.32, 0, hip); mesh(G.box(0.12, 0.26, 0.14), steel, { y: -0.14, parent: knee }); mesh(G.box(0.18, 0.06, 0.26), dark, { y: -0.29, z: 0.04, parent: knee });
    rig.legs.push({ hip, knee });
  }
  mesh(G.box(0.5, 0.62, 0.34), steel, { y: 0.95, parent: body });
  mesh(G.box(0.3, 0.16, 0.02), mat(0x111418), { y: 1.02, z: 0.18, shadow: 'none', parent: body });
  rig.light = mesh(G.sphere(0.035, 8, 6), glowMat(0xff4d4d, 2), { x: 0.14, y: 1.15, z: 0.18, shadow: 'none', parent: body });
  for (let i = 0; i < 3; i++) mesh(G.box(0.05, 0.05, 0.02), i === 1 ? cyan : glowMat(0xfff176, 1.2), { x: -0.08 + i * 0.07, y: 1.02, z: 0.19, shadow: 'none', parent: body });
  for (const side of [1, -1]) {
    const sh = group(side * 0.33, 1.2, 0, body); mesh(G.sphere(0.08, 10, 8), dark, { parent: sh });
    mesh(G.box(0.12, 0.34, 0.12), steel, { y: -0.2, parent: sh });
    const el = group(0, -0.38, 0, sh); mesh(G.box(0.1, 0.3, 0.1), dark, { y: -0.15, parent: el });
    mesh(G.box(0.04, 0.12, 0.08), steel, { x: 0.04, y: -0.34, parent: el }); mesh(G.box(0.04, 0.12, 0.08), steel, { x: -0.04, y: -0.34, parent: el });
    rig.arms.push({ sh, el });
  }
  mesh(G.cyl(0.08, 0.1, 0.1, 10), dark, { y: 1.3, parent: body });
  const head = group(0, 1.48, 0, body); rig.head = head;
  mesh(G.cyl(0.2, 0.22, 0.28, 16), steel, { parent: head });
  mesh(G.box(0.3, 0.07, 0.04), cyan, { y: 0.02, z: 0.2, shadow: 'none', parent: head });
  mesh(G.cyl(0.012, 0.012, 0.22, 6), dark, { y: 0.24, parent: head });
  rig.antenna = mesh(G.sphere(0.035, 8, 6), glowMat(0xff4d4d, 2), { y: 0.36, shadow: 'none', parent: head });
  rig.animate = (ph, moving, dt, t = 0) => {
    for (let i = 0; i < 2; i++) { const p = ph + i * PI, L = rig.legs[i], A = rig.arms[i];
      L.hip.rotation.x = moving ? -sin(p) * 0.45 : damp(L.hip.rotation.x, 0, 8, dt); L.knee.rotation.x = moving ? max(0, cos(p)) * 0.7 : damp(L.knee.rotation.x, 0, 8, dt);
      A.sh.rotation.x = moving ? sin(p) * 0.4 : damp(A.sh.rotation.x, 0, 8, dt); A.el.rotation.x = -0.4; }
    body.position.y = moving ? abs(sin(ph)) * 0.05 : 0;
    const blink = (sin(t * 4 + ph * 0.3) > 0.6) ? 2.5 : 0.4;
    rig.antenna.material.emissiveIntensity = blink; rig.light.material.emissiveIntensity = 3 - blink;
    head.rotation.y = moving ? 0 : sin(ph * 0.11) * 0.7;
  };
  bakeRig(g);
  return rig;
}

// ---------------------------------------------------------------- robot dog rig
function makeRoboDog() {
  const g = new THREE.Group(), rig = { group: g, legs: [] };
  const steel = mat(0x7d8792, { metalness: 0.85, roughness: 0.3 }), dark = mat(0x2f343c, { metalness: 0.8, roughness: 0.4 }), red = glowMat(0xff2d2d, 2.2);
  const body = group(0, 0, 0, g); rig.body = body;
  mesh(G.box(0.5, 0.36, 1.0), steel, { y: 0.58, parent: body });
  mesh(G.box(0.36, 0.1, 0.7), dark, { y: 0.8, parent: body });
  const head = group(0, 0.78, 0.6, body); rig.head = head;
  mesh(G.box(0.4, 0.34, 0.42), steel, { parent: head });
  mesh(G.box(0.24, 0.16, 0.2), dark, { y: -0.06, z: 0.28, parent: head });
  for (const side of [1, -1]) { rig['eye' + side] = mesh(G.sphere(0.055, 10, 8), red, { x: side * 0.12, y: 0.05, z: 0.21, shadow: 'none', parent: head }); mesh(G.box(0.08, 0.16, 0.05), dark, { x: side * 0.15, y: 0.24, parent: head }); }
  mesh(G.cyl(0.012, 0.012, 0.35, 6), dark, { y: 0.32, z: -0.1, parent: head });
  rig.antenna = mesh(G.sphere(0.04, 8, 6), red, { y: 0.5, z: -0.1, shadow: 'none', parent: head });
  for (const [x, z] of [[0.19, 0.36], [-0.19, 0.36], [0.19, -0.36], [-0.19, -0.36]]) {
    const hip = group(x, 0.48, z, body); mesh(G.box(0.12, 0.26, 0.14), dark, { y: -0.12, parent: hip });
    const knee = group(0, -0.25, 0, hip); mesh(G.box(0.1, 0.24, 0.1), steel, { y: -0.12, parent: knee }); mesh(G.box(0.13, 0.05, 0.16), dark, { y: -0.25, parent: knee });
    rig.legs.push({ hip, knee, front: z > 0 });
  }
  mesh(G.box(0.06, 0.06, 0.4), dark, { y: 0.72, z: -0.6, rx: -0.6, parent: body });
  rig.animate = (ph, moving, dt) => {
    for (let i = 0; i < 4; i++) { const L = rig.legs[i], p = ph + ((i === 0 || i === 3) ? 0 : PI);
      L.hip.rotation.x = moving ? sin(p) * 0.55 : damp(L.hip.rotation.x, 0, 8, dt); L.knee.rotation.x = moving ? -max(0, cos(p)) * 0.6 : damp(L.knee.rotation.x, 0, 8, dt); }
    body.position.y = moving ? abs(sin(ph)) * 0.04 : 0;
    head.rotation.x = moving ? sin(ph * 2) * 0.04 : sin(ph * 0.3) * 0.08;
  };
  bakeRig(g);
  return rig;
}

// ---------------------------------------------------------------- squirrel rig
function makeSquirrel() {
  const g = new THREE.Group(), rig = { group: g };
  const fur = mat(0x8b5a2b, { roughness: 0.95 }), light = mat(0xd9a066, { roughness: 0.95 }), dark = mat(0x1a1a1a);
  const body = group(0, 0, 0, g); rig.body = body;
  mesh(G.bodySphere(14, 10), fur, { y: 0.16, z: -0.02, sx: 0.1, sy: 0.12, sz: 0.15, parent: body });
  mesh(G.bodySphere(14, 10), light, { y: 0.14, z: 0.03, sx: 0.075, sy: 0.09, sz: 0.11, shadow: 'none', parent: body });
  const head = group(0, 0.3, 0.1, body); rig.head = head;
  mesh(G.sphere(0.08, 14, 10), fur, { sz: 1.1, parent: head });
  mesh(G.sphere(0.04, 10, 8), light, { y: -0.03, z: 0.065, sx: 1.2, sy: 0.8, parent: head });
  mesh(G.sphere(0.015, 8, 6), mat(0x2a1a1a), { y: -0.012, z: 0.1, shadow: 'none', parent: head });
  for (const side of [1, -1]) {
    mesh(G.sphere(0.017, 8, 6), dark, { x: side * 0.04, y: 0.02, z: 0.065, shadow: 'none', parent: head });
    mesh(G.sphere(0.005, 6, 6), basic(0xffffff), { x: side * 0.045, y: 0.027, z: 0.078, shadow: 'none', parent: head });
    mesh(G.earCone(0.025, 0.06), fur, { x: side * 0.045, y: 0.085, z: -0.01, rz: side * -0.3, parent: head });
    mesh(G.capsule(0.014, 0.05, 6), fur, { x: side * 0.045, y: 0.16, z: 0.1, rx: -0.9, parent: body });   // arms held up
    mesh(G.sphere(0.045, 10, 8), fur, { x: side * 0.07, y: 0.09, z: -0.05, sy: 0.9, sz: 1.3, parent: body }); // haunches
    mesh(G.box(0.03, 0.02, 0.08), light, { x: side * 0.07, y: 0.015, z: 0.0, parent: body });
  }
  // fluffy tail: overlapping spheres along an S-curve
  const tail = group(0, 0.12, -0.13, body); rig.tail = tail;
  const curve = new THREE.CatmullRomCurve3([V3(0, 0, 0), V3(0.02, 0.1, -0.1), V3(-0.01, 0.26, -0.11), V3(0.02, 0.38, -0.03), V3(0, 0.42, 0.06)]);
  for (let i = 0; i <= 11; i++) { const p = curve.getPoint(i / 11), r = 0.03 + sin(i / 11 * PI) * 0.05; mesh(G.sphere(1, 10, 8), i % 2 ? light : fur, { x: p.x, y: p.y, z: p.z, sx: r, sy: r, sz: r * 0.9, parent: tail }); }
  rig.animate = (ph, moving, dt, t = 0) => {
    // nibble: quick head bobs in bursts; twitch: a tail flick now and then; otherwise a slow look-around
    const nibble = sin(t * 0.55) > 0.55 ? 1 : 0, flick = sin(t * 0.37 + 1) > 0.93 ? 1 : 0;
    tail.rotation.z = sin(t * 3.1) * 0.12 + flick * sin(t * 26) * 0.35; tail.rotation.x = moving ? -0.5 : sin(t * 2.3) * 0.08 - nibble * 0.15;
    head.rotation.x = moving ? 0.3 : nibble * (0.25 + sin(t * 14) * 0.12) + sin(t * 6) * 0.03;
    head.rotation.y = moving ? 0 : (nibble ? 0 : sin(t * 0.9) * 0.35);
    body.rotation.x = moving ? -0.35 : nibble * 0.12;
    body.scale.y = 1 + sin(t * 4.2) * 0.012;                       // breathing
  };
  bakeRig(g);
  return rig;
}

// ---------------------------------------------------------------- candy cat (boss) rig
function makeCandyCat() {
  const g = new THREE.Group(), rig = { group: g };
  const pink = mat(0xff2f92, { roughness: 0.45, map: TEX.fur('boss', 330, 90, 55, 'sprinkles') }), plain = mat(0xff2f92, { roughness: 0.45 }), lightPink = mat(0xffc1dc, { roughness: 0.6 });
  const gold = mat(0xffd54a, { metalness: 0.9, roughness: 0.2 }), red = glowMat(0xff1a1a, 1.6);
  const body = group(0, 0, 0, g); rig.body = body;
  rig.torso = mesh(G.bodySphere(), pink, { y: 1.15, sx: 0.85, sy: 0.8, sz: 1.35, parent: body });
  rig.torso.userData.keep = true;   // breathes by scale
  mesh(G.bodySphere(), lightPink, { y: 1.07, z: 0.05, sx: 0.79, sy: 0.74, sz: 1.31, shadow: 'none', parent: body });   // pale tummy, tucked inside the torso so it reads as fur, not a lump
  mesh(G.bodySphere(), pink, { y: 1.3, z: 1.05, sx: 0.5, sy: 0.45, sz: 0.5, parent: body });
  const head = group(0, 1.8, 1.4, body); rig.head = head;
  mesh(G.sphere(0.6, 20, 16), pink, { sy: 0.92, parent: head });
  mesh(G.sphere(0.3, 14, 10), lightPink, { y: -0.2, z: 0.48, sx: 1.2, sy: 0.75, shadow: 'none', parent: head });
  mesh(G.sphere(0.07, 10, 8), mat(0xc2185b), { y: -0.1, z: 0.76, sx: 1.2, sy: 0.8, shadow: 'none', parent: head });
  for (const side of [1, -1]) {
    mesh(G.sphere(0.13, 14, 10), basic(0xfff5f8), { x: side * 0.24, y: 0.12, z: 0.48, sz: 0.5, shadow: 'none', parent: head });
    rig['eye' + side] = mesh(G.sphere(0.075, 12, 10), red, { x: side * 0.24, y: 0.12, z: 0.53, sx: 0.5, shadow: 'none', parent: head });
    rig['brow' + side] = mesh(G.box(0.24, 0.05, 0.05), mat(0xb0005f), { x: side * 0.25, y: 0.3, z: 0.5, rz: side * 0.45, shadow: 'none', parent: head });
    mesh(G.earCone(0.2, 0.42), pink, { x: side * 0.35, y: 0.55, z: -0.05, rz: side * -0.35, parent: head });
    mesh(G.earCone(0.11, 0.26), lightPink, { x: side * 0.35, y: 0.5, z: 0.0, rz: side * -0.35, shadow: 'none', parent: head });
  }
  // tiara: a gold band that actually rests on the skull, five points with jewels, a heart in the middle
  const tiara = group(0, 0.4, 0.02, head);
  mesh(G.torus(0.36, 0.035, 8, 32), gold, { rx: PI / 2, parent: tiara });
  [-0.95, -0.48, 0, 0.48, 0.95].forEach((a, i) => {
    const h = i === 2 ? 0.34 : (i === 1 || i === 3 ? 0.24 : 0.16), x = sin(a) * 0.36, z = cos(a) * 0.36;
    mesh(G.cone(0.05, h, 4), gold, { x, y: h / 2, z, ry: PI / 4, parent: tiara });
    mesh(G.sphere(i === 2 ? 0.06 : 0.04, 8, 6), glowMat(i === 2 ? 0x64b5f6 : (i % 2 ? 0xff6fb5 : 0x9dff6a), 1.4), { x, y: h + 0.02, z, shadow: 'none', parent: tiara });
  });
  mesh(G.heart(0.16, 0.05), glowMat(0xff3d7a, 1.2), { y: 0.02, z: 0.38, shadow: 'none', parent: tiara });
  for (const [x, z] of [[0.45, 0.8], [-0.45, 0.8], [0.45, -0.8], [-0.45, -0.8]]) { mesh(G.capsule(0.17, 0.4, 10), plain, { x, y: 0.45, z, parent: body }); mesh(G.sphere(0.2, 10, 8), lightPink, { x, y: 0.12, z: z + 0.05, sy: 0.6, sz: 1.3, parent: body }); }
  let parent = body, base = V3(0, 1.3, -1.3); rig.tail = [];
  for (let i = 0; i < 6; i++) { const j = group(base.x, base.y, base.z, parent); mesh(G.capsule(0.12 - i * 0.012, 0.3, 8), i % 2 ? plain : lightPink, { z: -0.2, rx: PI / 2, parent: j }); rig.tail.push(j); parent = j; base = V3(0, 0, -0.38); }
  rig.animate = (ph, near, dt, t = 0) => {
    rig.torso.scale.y = 0.8 + sin(t * 1.6) * 0.015;
    for (let i = 0; i < 6; i++) { const j = rig.tail[i]; j.rotation.x = i === 0 ? 0.6 : 0.22; j.rotation.y = sin(t * (near ? 5 : 1.6) + i * 0.6) * 0.16; }
    const angry = near ? 0.75 : 0.45;
    rig.brow1.rotation.z = damp(rig.brow1.rotation.z, angry, 5, dt); rig['brow-1'].rotation.z = -rig.brow1.rotation.z;
    rig.eye1.material.emissiveIntensity = near ? 2.5 + sin(t * 8) : 1.6;
    head.rotation.y = damp(head.rotation.y, near ? 0 : sin(t * 0.5) * 0.3, 4, dt);
    head.rotation.x = near ? -0.12 : 0;
  };
  bakeRig(g);
  return rig;
}

// ---------------------------------------------------------------- wanderer controller
class Wanderer {
  constructor(game, rig, o) {
    this.game = game; this.rig = rig; this.x = o.x; this.z = o.z; this.hx = o.x; this.hz = o.z;
    this.speed = o.speed ?? 0.9; this.leash = o.leash ?? 10; this.r = o.r ?? 0.35; this.height = o.height ?? 1.8; this.step = o.step ?? 0.22;
    this.idleRange = o.idle ?? [1.5, 4]; this.walkRange = o.walk ?? [3, 8];
    this.avoid = o.avoid ?? null;      // (x, z) => true where this wanderer must not step (the road, say)
    this.cries = o.cries ?? null; this.cryIcon = o.cryIcon ?? '💬'; this.cryT = rnd.range(4, 9);   // lines called out now and then when the cat is within earshot
    this.angle = o.angle ?? rnd() * TAU; this.phase = rnd() * TAU; this.state = 'idle'; this.timer = rnd.range(0, 2); this.t = rnd() * 10;
    this.circle = game.physics.addCircle(this, o.x, o.z, this.r);
    rig.group.position.set(o.x, game.physics.ground0(o.x, o.z), o.z); rig.group.rotation.y = this.angle;
    this.look = 0; this.lookW = 0; this.tipT = 0; this.tipped = false;
    greetable(game, this);
  }
  update(dt) {
    this.move(dt); this.lookAtCat(dt);
    if (this.rig.joy > 0) { this.rig.joy -= dt; this.rig.group.position.y = this.game.physics.ground0(this.x, this.z) + sin(clamp(this.rig.joy / 0.8, 0, 1) * PI) * 0.35; }
    if (this.cries) { this.cryT -= dt; if (this.cryT <= 0) { this.cryT = rnd.range(9, 16); const c = this.game.cat.group.position; if (dist2(this.x, this.z, c.x, c.z) < 400) { this.game.toast(this.cryIcon + ' "' + rnd.pick(this.cries) + '"', 2400); SFX.talk(); } } }
  }
  /** Turn the head toward the cat when it is close and roughly in front. Applied after animate() so it wins. */
  lookAtCat(dt) {
    const head = this.rig.head; if (!head) return;
    const cat = this.game.cat.group.position, dx = cat.x - this.x, dz = cat.z - this.z;
    let target = 0, w = 0;
    // photo mode: anyone within ten metres turns to the camera, stops, and holds a pose until it is over
    const rig = this.rig, cam = this.game.camera.position, posing = this.game.photo && rig.look && dist2(this.x, this.z, cat.x, cat.z) < 100;
    if (posing) {
      if (rig.gesture !== 'pose') { rig.gesture = 'pose'; rig.gT = 0; }
      if (this.state !== undefined && this.state === 'walk') { this.state = 'idle'; this.timer = 1; } if (this.state === 'idle' && this.timer !== undefined) this.timer = max(this.timer, 1);
      if (this.constructor === Wanderer || this.constructor === Patroller) rig.group.rotation.y = dampAngle(rig.group.rotation.y, atan2(cam.x - this.x, cam.z - this.z), 6, dt);
      const a = wrapAngle(atan2(cam.x - this.x, cam.z - this.z) - rig.group.rotation.y); this.lookW = damp(this.lookW, 1, 5, dt); this.look = damp(this.look, clamp(a, -1.2, 1.2), 6, dt); head.rotation.y = lerp(head.rotation.y, this.look, this.lookW); return;
    } else if (rig.gesture === 'pose') rig.gesture = null;
    if (dx * dx + dz * dz < 42) { const a = wrapAngle(atan2(dx, dz) - this.rig.group.rotation.y); if (abs(a) < 1.6) { target = a; w = 1; } }
    this.lookW = damp(this.lookW, w, 5, dt); this.look = damp(this.look, target, 6, dt);
    head.rotation.y = lerp(head.rotation.y, this.look, this.lookW);
    // people give the cat a wave the first time it comes up to them; gentlemen tip their hat instead
    if (this.rig.gesture !== undefined && !this.rig.hat) {
      const d2 = dx * dx + dz * dz;
      if (w && d2 < 12 && !this.waved && this.state === 'idle') { this.waved = true; this.rig.gesture = 'wave'; this.rig.gT = 0; this.timer = max(this.timer, 2); greet(this.game, this.rig); }
      if (d2 > 40) this.waved = false;
    }
    // gentlemen tip their top hat once per approach
    if (this.rig.hat) {
      const d2 = dx * dx + dz * dz;
      if (w && d2 < 14 && !this.tipped) { this.tipped = true; this.tipT = 1.3; }
      if (d2 > 40) this.tipped = false;
      if (this.tipT > 0) { this.tipT -= dt; const k = sin(clamp(1 - this.tipT / 1.3, 0, 1) * PI); this.rig.hat.position.y = k * 0.16; this.rig.hat.rotation.z = k * 0.45; this.rig.hat.position.x = k * 0.08;
        const A = this.rig.arms[0]; A.sh.rotation.x = lerp(A.sh.rotation.x, -2.6, k); A.sh.rotation.z = lerp(A.sh.rotation.z, 0.5, k); A.el.rotation.x = lerp(A.el.rotation.x, -1.4, k); }
    }
  }
  move(dt) {
    this.timer -= dt; this.t += dt;
    const cat = this.game.cat.group.position;
    if (this.state === 'idle') {
      if (this.timer <= 0) { this.state = 'walk'; this.timer = rnd.range(...this.walkRange); this.angle = wrapAngle(this.angle + rnd.range(-1.2, 1.2)); }
      this.rig.animate(this.phase, false, dt, this.t); return;
    }
    const nx = this.x + sin(this.angle) * this.speed * dt, nz = this.z + cos(this.angle) * this.speed * dt;
    const outside = dist2(nx, nz, this.hx, this.hz) > this.leash * this.leash;
    const nearCat = dist2(nx, nz, cat.x, cat.z) < (this.r + CAT_RADIUS + 0.15) ** 2;
    if (outside || nearCat || (this.avoid && this.avoid(nx, nz)) || this.game.physics.blocked(nx, nz, this.r, this, this.game.physics.ground0(nx, nz), this.step, this.height)) {
      this.angle = outside ? wrapAngle(atan2(this.hx - this.x, this.hz - this.z) + rnd.range(-0.5, 0.5)) : wrapAngle(this.angle + rnd.range(PI * 0.5, PI * 1.5));
      this.state = 'idle'; this.timer = nearCat ? rnd.range(0.8, 2) : rnd.range(0.2, 0.6);
      this.rig.animate(this.phase, false, dt, this.t); return;
    }
    this.x = nx; this.z = nz; this.circle.x = nx; this.circle.z = nz; this.phase += dt * this.speed * 4.4;
    this.rig.group.position.set(nx, this.game.physics.ground0(nx, nz), nz);
    this.rig.group.rotation.y = dampAngle(this.rig.group.rotation.y, this.angle, 7, dt);
    if (this.timer <= 0) { this.state = 'idle'; this.timer = rnd.range(...this.idleRange); }
    this.rig.animate(this.phase, true, dt, this.t);
  }
}

/** What people say when the cat comes up to them, by world. Children have their own lines everywhere. */
const GREETINGS = {
  neighborhood: ['Hello, kitty!', "Aww, who's a good cat?", 'Off on an adventure?', 'Lovely day for a wander!', 'Mind the road, puss!', 'Have you seen the squirrel? Cheeky thing.'],
  victorian: ['Good day to you, puss.', 'A cat about town! How very modern.', 'Mind the cobbles, little one.', 'Fine whiskers, sir.', 'Have you come far?'],
  beach: ["Careful, the sand's hot!", 'Fancy a paddle, kitty?', 'Watch out for the crabs!', 'Lovely day for it!', 'The turtles are out today.'],
  snow: ["Brr! Aren't you cold, kitty?", "Have you seen the yeti? He's lovely.", 'Careful on the ice!', 'Come and warm up by the fire!'],
  child: ['Kitty! Kitty!', 'Can we keep it?', 'Hi, cat!', 'Look, a cat!', 'Are you lost, kitty?'],
};
/** Let the cat greet this person on purpose (E): they wave, say their line, and hearts go up. */
function greetable(game, ctl) {
  const rig = ctl.rig; if (!rig || !(rig.look || rig.robot || rig.cookie)) return;
  // a stable id: people are made in the same order every time a world is built
  const id = WORLDS[game.worldIndex].key + ':' + (game.friendSeq++); game.friendTotal++;
  const first = rig.robot ? 'Beep hello' : rig.look && rig.look.child ? 'Say hi' : 'Say hello';
  game.addInteractable({ obj: rig.group, radius: 2.1, label: () => (game.state.friends.has(id) ? first + ' again' : first), onUse: () => {
    if (rig.look) {
      if (rig.hat && ctl.tipT !== undefined) { ctl.tipped = true; ctl.tipT = 1.3; } else { rig.gesture = 'wave'; rig.gT = 0; }
      game.lastGreet = -99; greet(game, rig);
    } else { rig.joy = 0.8; if (rig.robot) { SFX.beep(); game.toast('\ud83e\udd16 "BEEP BOOP. HELLO, SMALL CAT."', 2200); } else { SFX.tag(); game.toast('\ud83c\udf6a "Hee hee! Mind my icing!"', 2200); } }   // robots and cookies hop for joy
    if (ctl.timer !== undefined) ctl.timer = max(ctl.timer ?? 0, 2); if (ctl.state !== undefined) ctl.state = 'idle';
    const p = rig.group.position; game.hearts(p.x, 1.9 * (rig.k ?? 0.8), p.z, 2);
    game.befriend(id);
  } });
}
/** One line of greeting on the HUD, no more often than every few seconds however many people are about. */
function greet(game, rig) {
  if ((game.lastGreet ?? -99) > game.time - 6) return;
  const lines = rig.look?.child ? GREETINGS.child : GREETINGS[WORLDS[game.worldIndex]?.key];
  if (!lines) return;
  game.lastGreet = game.time; game.toast('💬 "' + rnd.pick(lines) + '"', 2600); SFX.talk();
}

// ---------------------------------------------------------------- sitter: parked on a bench, watching the world go by
class Sitter {
  /** `seat` is the bench's seat height; the rig is lowered so its hips land on it and its shins hang down in front. */
  constructor(game, rig, { x, z, ry, seat = 0.48, side = 0 }) {
    this.game = game; this.rig = rig; this.x = x; this.z = z; this.t = rnd() * 10; this.look = 0; this.lookW = 0; this.tipT = 0; this.tipped = false;
    this.state = 'idle'; this.timer = 0; this.side = side;
    rig.group.position.set(x, game.physics.ground0(x, z) + seat - 0.9 * rig.k + 0.02, z); rig.group.rotation.y = ry;
    this.circle = game.physics.addCircle(this, x, z, 0.3);
    greetable(game, this);
  }
  update(dt) {
    this.t += dt; const rig = this.rig;
    rig.animate(0, false, dt, this.t);
    for (const L of rig.legs) { L.hip.rotation.x = -PI / 2 + 0.12; L.knee.rotation.x = PI / 2 - 0.2; L.ankle.rotation.x = 0.1; }
    if (!rig.gesture) for (const A of rig.arms) { A.sh.rotation.x = damp(A.sh.rotation.x, -0.45, 8, dt); A.el.rotation.x = damp(A.el.rotation.x, -1.0, 8, dt); }   // hands in the lap
    rig.body.position.y = 0; rig.spine.rotation.x = damp(rig.spine.rotation.x, -0.1 + (rig.look.elder ? 0.12 : 0), 6, dt);   // settled back into the bench
    // half-turned toward whoever is on the bench beside them
    if (this.side) rig.head.rotation.y += this.side * 0.35 * (1 - this.lookW);
    Wanderer.prototype.lookAtCat.call(this, dt);
  }
}

// ---------------------------------------------------------------- playmates: two children playing tag on a lawn
class Playmates {
  constructor(game, rigA, rigB, { cx, cz, leash = 6, speed = 2.1 }) {
    this.game = game; this.cx = cx; this.cz = cz; this.leash = leash; this.speed = speed;
    this.kids = [rigA, rigB].map((rig, i) => {
      const x = cx + (i ? 2.5 : -2.5), z = cz + (i ? 1 : -1);
      rig.group.position.set(x, game.physics.ground0(x, z), z);
      return { rig, x, z, angle: rnd() * TAU, phase: rnd() * TAU, circle: game.physics.addCircle(this, x, z, 0.25), hop: 0 };
    });
    this.rig = rigA;      // the world's sanity checks look at npc.rig
    this.chaser = 0; this.swapT = 0; this.t = 0; this.pauseT = 0; this.headStart = 0;
  }
  update(dt) {
    this.t += dt; this.swapT += dt;
    const ch = this.kids[this.chaser], run = this.kids[1 - this.chaser], P = this.game.physics;
    if (this.pauseT > 0) { this.pauseT -= dt; for (const k of this.kids) k.rig.animate(k.phase, false, dt, this.t); this.hops(dt); return; }
    // caught: freeze for a beat, swap roles, and the one who was tagged hops off with a head start
    if (Math.hypot(run.x - ch.x, run.z - ch.z) < 0.8 && this.swapT > 3) { this.chaser = 1 - this.chaser; this.swapT = 0; this.pauseT = 0.45; this.headStart = 1.3; run.hop = 0.35; SFX.tag(); return; }
    this.headStart -= dt;
    for (const k of this.kids) {
      const other = k === ch ? run : ch;
      if (k === ch && this.headStart > 0) { k.rig.group.rotation.y = dampAngle(k.rig.group.rotation.y, atan2(other.x - k.x, other.z - k.z), 6, dt); k.rig.animate(k.phase, false, dt, this.t); continue; }   // "it" counts to three
      let want = k === ch ? atan2(other.x - k.x, other.z - k.z) : atan2(k.x - other.x, k.z - other.z) + sin(this.t * 1.7 + (k === ch ? 2 : 0)) * 0.9;
      // keep to the lawn: near the edge, bend the heading back toward the middle
      if (Math.hypot(k.x - this.cx, k.z - this.cz) > this.leash * 0.8) { const back = atan2(this.cx - k.x, this.cz - k.z); want = wrapAngle(back + wrapAngle(want - back) * 0.3); }
      k.angle = dampAngle(k.angle, want, k === ch ? 6 : 4, dt);
      const sp = this.speed * (k === ch ? 1.06 : 1), nx = k.x + sin(k.angle) * sp * dt, nz = k.z + cos(k.angle) * sp * dt;
      if (P.blocked(nx, nz, 0.25, this, P.ground0(nx, nz), 0.25, 1.3) || Math.hypot(nx - this.cx, nz - this.cz) > this.leash) k.angle = wrapAngle(k.angle + PI * 0.6);
      else { k.x = nx; k.z = nz; }
      k.circle.x = k.x; k.circle.z = k.z; k.phase += dt * sp * 4.4;
      k.rig.group.position.set(k.x, P.ground0(k.x, k.z), k.z); k.rig.group.rotation.y = dampAngle(k.rig.group.rotation.y, k.angle, 8, dt);
      k.rig.animate(k.phase, true, dt, this.t);
    }
    this.hops(dt);
  }
  hops(dt) { for (const k of this.kids) if (k.hop > 0) { k.hop = max(0, k.hop - dt); k.rig.group.position.y = this.game.physics.ground0(k.x, k.z) + sin(k.hop / 0.35 * PI) * 0.22; } }
}

// ---------------------------------------------------------------- snowball fight: two children pelting each other across the square
class SnowballFight {
  constructor(game, rigA, rigB, { cx, cz, gap = 5 }) {
    this.game = game; this.cx = cx; this.cz = cz; this.t = 0; this.thrower = 0; this.nextT = 1.5; this.throws = 0; this.catHit = false;
    this.kids = [rigA, rigB].map((rig, i) => {
      const x = cx + (i ? gap / 2 : -gap / 2), z = cz;
      rig.group.position.set(x, game.physics.ground0(x, z), z); rig.group.rotation.y = i ? -PI / 2 : PI / 2;   // facing each other along x
      return { rig, x, z, hz: z, circle: game.physics.addCircle(this, x, z, 0.25), phase: rnd() * TAU, flinch: 0, t: rnd() * 3 };
    });
    this.rig = rigA;
    this.balls = [];
    for (let i = 0; i < 3; i++) { const m = mesh(G.sphere(0.11, 8, 6), mat(0xffffff, { roughness: 1 }), { parent: game.world }); m.visible = false; this.balls.push({ m, t: -1, wait: 0, dur: 0.75, from: V3(), to: V3() }); }
  }
  throwAt(k, tx, ty, tz) {
    const b = this.balls.find((b) => b.t < 0); if (!b) return;
    k.rig.gesture = 'throw'; k.rig.gT = 0; this.throws++;
    b.t = 0; b.wait = 0.28; b.from.set(k.x, 0.95 * k.rig.k + 0.35, k.z); b.to.set(tx, ty, tz); b.m.position.copy(b.from); b.m.visible = true;
  }
  update(dt) {
    this.t += dt; this.nextT -= dt;
    const cat = this.game.cat.group.position, P = this.game.physics;
    for (const k of this.kids) {
      // shuffle sideways, always squared up to the other one
      k.t += dt; const other = this.kids[k === this.kids[0] ? 1 : 0];
      k.z = k.hz + sin(k.t * 0.9) * 1.6; k.circle.z = k.z;
      k.rig.group.position.set(k.x, P.ground0(k.x, k.z), k.z);
      k.rig.group.rotation.y = dampAngle(k.rig.group.rotation.y, atan2(other.x - k.x, other.z - k.z), 6, dt);
      const stepping = abs(cos(k.t * 0.9)) > 0.35; if (stepping) k.phase += dt * 4;
      k.rig.animate(k.phase, stepping, dt, this.t);
      if (k.flinch > 0) { k.flinch -= dt; k.rig.body.rotation.z += sin(k.flinch * 14) * 0.14; k.rig.body.position.y -= 0.07 * k.rig.k * sin(clamp(k.flinch / 0.5, 0, 1) * PI); }
    }
    // take turns; a cat that comes too close gets one thrown at it (once per visit)
    if (this.nextT <= 0) {
      const k = this.kids[this.thrower], o = this.kids[1 - this.thrower];
      if (!this.catHit && dist2(k.x, k.z, cat.x, cat.z) < 20) { this.throwAt(k, cat.x, cat.y + 0.35, cat.z); this.catHit = true; }
      else this.throwAt(k, o.x, 0.9 * o.rig.k, o.z);
      this.thrower = 1 - this.thrower; this.nextT = rnd.range(1.4, 2.6);
    }
    if (this.catHit && this.kids.every((k) => dist2(k.x, k.z, cat.x, cat.z) > 60)) this.catHit = false;
    for (const b of this.balls) {
      if (b.t < 0) continue;
      if (b.wait > 0) { b.wait -= dt; continue; }             // the arm winds up first
      b.t += dt; const u = min(1, b.t / b.dur);
      b.m.position.copy(b.from).lerp(b.to, u); b.m.position.y += sin(u * PI) * 1.3;
      if (u >= 1) {
        b.t = -1; b.m.visible = false;
        this.game.fx.emit(b.to.x, b.to.y, b.to.z, { count: 14, colors: [0xffffff, 0xeaf4ff], speed: 1.6, up: 1.2, life: 0.6, gravity: 3 });
        const hit = this.kids.find((k) => dist2(k.x, k.z, b.to.x, b.to.z) < 1.5);
        if (hit) hit.flinch = 0.5;
        else if (dist2(cat.x, cat.z, b.to.x, b.to.z) < 2.5) { SFX.tag(); this.game.toast('\u2603\ufe0f "Got you, kitty!"'); }
      }
    }
  }
}

// ---------------------------------------------------------------- ball game: two people patting a beach ball back and forth
class BallGame {
  constructor(game, rigA, rigB, ball, { cx, cz, gap = 5.5 }) {
    this.game = game; this.ball = ball; this.t = 0; this.holder = 0; this.holdT = 0.8; this.flight = -1; this.dur = 1.1; this.passes = 0; this.boinged = false;
    this.players = [rigA, rigB].map((rig, i) => {
      const x = cx, z = cz + (i ? gap / 2 : -gap / 2);
      rig.group.position.set(x, game.physics.ground0(x, z), z); rig.group.rotation.y = i ? PI : 0;   // facing each other along z
      return { rig, x, z, hx: x, circle: game.physics.addCircle(this, x, z, 0.3), t: rnd() * 5, phase: 0 };
    });
    this.rig = rigA; this.from = V3(); this.to = V3();
  }
  hands(p, v) { return v.set(p.x, this.game.physics.ground0(p.x, p.z) + 0.95 * p.rig.k + 0.3, p.z); }
  update(dt) {
    this.t += dt; const P = this.game.physics, cat = this.game.cat.group.position;
    for (const p of this.players) {
      p.t += dt; const other = this.players[p === this.players[0] ? 1 : 0];
      p.x = p.hx + sin(p.t * 0.7) * 1.2; p.circle.x = p.x;
      p.rig.group.position.set(p.x, P.ground0(p.x, p.z), p.z);
      p.rig.group.rotation.y = dampAngle(p.rig.group.rotation.y, atan2(other.x - p.x, other.z - p.z), 6, dt);
      const stepping = abs(cos(p.t * 0.7)) > 0.4; if (stepping) p.phase += dt * 3.5;
      p.rig.animate(p.phase, stepping, dt, this.t);
    }
    const h = this.players[this.holder], o = this.players[1 - this.holder];
    if (this.flight < 0) {   // held for a moment, then sent over
      this.holdT -= dt; this.hands(h, this.ball.position); this.ball.position.z += (this.holder ? -1 : 1) * 0.3;
      if (this.holdT <= 0) { this.flight = 0; this.from.copy(this.ball.position); this.hands(o, this.to); this.dur = 1.1; h.rig.gesture = 'throw'; h.rig.gT = 0.22; this.passes++; this.boinged = false; }
      return;
    }
    this.flight += dt; const u = min(1, this.flight / this.dur);
    this.ball.position.copy(this.from).lerp(this.to, u); this.ball.position.y += sin(u * PI) * 2.2;
    this.ball.rotation.x += dt * 3; this.ball.rotation.z += dt * 1.5;
    // a cat standing under the end of its flight gets it off the head, and it hops on to the catcher
    if (!this.boinged && u > 0.5 && dist2(this.ball.position.x, this.ball.position.z, cat.x, cat.z) < 1.6 && this.ball.position.y < cat.y + 1.3) {
      this.boinged = true; SFX.bounce(); this.game.toast("\ud83c\udfd0 Boing! Off the cat's head!");
      this.from.copy(this.ball.position); this.from.y = cat.y + 0.9; this.flight = 0; this.dur = 0.9;
      return;
    }
    if (u >= 1) { this.flight = -1; this.holder = 1 - this.holder; this.holdT = rnd.range(0.5, 1.1); SFX.bounce(); }
  }
}

// ---------------------------------------------------------------- swinger: a child on the park swing, legs kicking at the top of each arc
class Swinger {
  constructor(game, rig, swingSet, { x, z, ry = 0 }) {
    this.game = game; this.rig = rig; this.x = x; this.z = z; this.t = rnd() * 3; this.cryT = rnd.range(4, 8);
    this.pivot = swingSet.userData.pivot; this.boost = 0;   // boost: pushed by the cat, fades over ten seconds or so
    // seated on the seat: hips at seat height, so the rig's origin goes 0.9 k below it
    rig.group.position.set(0, -(swingSet.userData.pivot.position.y - swingSet.userData.seatY) - 0.9 * rig.k + 0.04, 0.02);
    this.pivot.add(rig.group);
    this.circle = game.physics.addCircle(this, x, z, 0.4);
  }
  update(dt) {
    this.t += dt; const rig = this.rig, ph = this.t * 2.1;   // a three-second swing
    this.boost = max(0, this.boost - dt / 12);
    this.pivot.rotation.x = -sin(ph) * (0.62 + this.boost * 0.4);   // positive fwd is the way the child faces
    rig.animate(0, false, dt, this.t);
    const fwd = clamp(sin(ph), -1, 1);      // +1 at the front of the arc
    for (const L of rig.legs) { L.hip.rotation.x = -PI / 2 + 0.15; L.knee.rotation.x = clamp(1.35 - fwd * 1.3, 0.05, 2.6); L.ankle.rotation.x = 0.2; }   // legs kick out going forward, tuck coming back
    if (!rig.gesture) for (const A of rig.arms) { A.sh.rotation.x = damp(A.sh.rotation.x, -1.15, 8, dt); A.el.rotation.x = damp(A.el.rotation.x, -0.9, 8, dt); A.sh.rotation.z = (A === rig.arms[0] ? 1 : -1) * 0.32; }   // holding the ropes
    rig.spine.rotation.x = damp(rig.spine.rotation.x, -fwd * 0.18, 6, dt); rig.body.position.y = 0;
    rig.head.rotation.x = damp(rig.head.rotation.x, fwd * 0.1, 6, dt);
    // "Wheee!" now and then, when the cat is near enough to hear
    this.cryT -= dt; const c = this.game.cat.group.position;
    if (this.cryT <= 0) { this.cryT = rnd.range(7, 14); if (dist2(this.x, this.z, c.x, c.z) < 150) { this.game.toast('\ud83c\udfa0 "Wheee!"', 1800); SFX.talk(); } }
  }
}

// ---------------------------------------------------------------- ring dance: a circle of dancers going round, hand in hand
class RingDance {
  constructor(game, rigs, { cx, cz, r = 2.4, speed = 0.55, turnEvery = 9 }) {
    this.game = game; this.cx = cx; this.cz = cz; this.r = r; this.speed = speed; this.turnEvery = turnEvery; this.t = 0; this.dir = 1; this.turnT = turnEvery; this.a = 0;
    this.dancers = rigs.map((rig, i) => ({ rig, off: i / rigs.length * TAU, phase: rnd() * TAU, circle: game.physics.addCircle(this, cx, cz, 0.3) }));
    this.rig = rigs[0]; this.place(0);
  }
  place(dt) {
    for (const d of this.dancers) {
      const a = this.a + d.off, x = this.cx + cos(a) * this.r, z = this.cz + sin(a) * this.r;
      d.circle.x = x; d.circle.z = z;
      d.rig.group.position.set(x, this.game.physics.ground0(x, z), z);
      // facing along the ring, the way they are going
      d.rig.group.rotation.y = atan2(-sin(a) * this.dir, cos(a) * this.dir);
      d.phase += dt * 3.6;
      d.rig.animate(d.phase, true, dt, this.t);
    }
  }
  update(dt) {
    this.t += dt; this.turnT -= dt;
    if (this.turnT <= 0) { this.dir = -this.dir; this.turnT = this.turnEvery; }
    this.a += this.dir * this.speed * dt;
    this.place(dt);
  }
}

// ---------------------------------------------------------------- patroller: walks a fixed route there and back, pausing at the ends
class Patroller {
  constructor(game, rig, { points, speed = 0.9, pause = [1.5, 4], r = 0.32, height = 1.8, cries = null, cryIcon = '\ud83d\udcac', pauseAll = false, loop = false, onArrive = null }) {
    this.game = game; this.rig = rig; this.points = points; this.speed = speed; this.pauseRange = pause; this.r = r; this.height = height;
    this.pauseAll = pauseAll; this.loop = loop; this.onArrive = onArrive;   // pauseAll: stop at every point, not just the ends; loop: go round rather than back
    this.i = 0; this.dir = 1; this.x = points[0][0]; this.z = points[0][1]; this.phase = rnd() * TAU; this.t = rnd() * 10; this.wait = 0;
    this.look = 0; this.lookW = 0; this.tipT = 0; this.tipped = false; this.state = 'walk'; this.timer = 0;
    this.cries = cries; this.cryIcon = cryIcon; this.cryT = rnd.range(5, 10);
    this.circle = game.physics.addCircle(this, this.x, this.z, r);
    rig.group.position.set(this.x, game.physics.ground0(this.x, this.z), this.z);
    greetable(game, this);
  }
  update(dt) {
    this.t += dt; const P = this.game.physics;
    if (this.wait > 0) { this.wait -= dt; this.state = 'idle'; this.timer = this.wait; this.rig.animate(this.phase, false, dt, this.t); }
    else {
      this.state = 'walk';
      const n = this.points.length, next = this.loop ? (this.i + 1) % n : this.i + this.dir;
      const [tx, tz] = this.points[next], dx = tx - this.x, dz = tz - this.z, d = Math.hypot(dx, dz);
      if (d < 0.25) {
        this.i = next;
        const atEnd = !this.loop && (this.i === 0 || this.i === n - 1);
        if (atEnd) this.dir = -this.dir;
        if (atEnd || this.pauseAll) this.wait = rnd.range(...this.pauseRange);
        if (this.onArrive) this.onArrive(this.i, this);
      }
      else {
        const ang = atan2(dx, dz), step = min(d, this.speed * dt), nx = this.x + sin(ang) * step, nz = this.z + cos(ang) * step;
        const cat = this.game.cat.group.position;
        if (dist2(nx, nz, cat.x, cat.z) < (this.r + CAT_RADIUS + 0.2) ** 2) { this.rig.animate(this.phase, false, dt, this.t); }   // let the cat pass
        else { this.x = nx; this.z = nz; this.circle.x = nx; this.circle.z = nz; this.phase += dt * this.speed * 4.4; this.rig.group.rotation.y = dampAngle(this.rig.group.rotation.y, ang, 7, dt); this.rig.animate(this.phase, true, dt, this.t); }
        this.rig.group.position.set(this.x, P.ground0(this.x, this.z), this.z);
      }
    }
    Wanderer.prototype.lookAtCat.call(this, dt);
    if (this.cries) { this.cryT -= dt; if (this.cryT <= 0) { this.cryT = rnd.range(9, 16); const c = this.game.cat.group.position; if (dist2(this.x, this.z, c.x, c.z) < 400) { this.game.toast(this.cryIcon + ' "' + rnd.pick(this.cries) + '"', 2400); SFX.talk(); } } }
  }
}

// ---------------------------------------------------------------- loader: a robot at the end of a conveyor, lifting each crate off as it arrives
class Loader {
  constructor(game, rig, conveyor) {
    this.game = game; this.rig = rig; this.conv = conveyor; this.t = rnd() * 10; this.lift = 0; this.lifted = new Set();
    const d = conveyor.userData.dir, len = conveyor.userData.len;
    this.x = conveyor.position.x; this.z = conveyor.position.z + d * (len / 2 + 1.1);
    rig.group.position.set(this.x, game.physics.ground0(this.x, this.z), this.z); rig.group.rotation.y = d > 0 ? PI : 0;   // facing back up the belt
    this.circle = game.physics.addCircle(this, this.x, this.z, 0.4);
  }
  update(dt) {
    this.t += dt; const d = this.conv.userData.dir, end = d * this.conv.userData.len / 2;
    // the crate nearest the end of the belt, and how close it is
    let near = 9, nearest = null;
    for (const c of this.conv.userData.crates) { const gap = abs(end - c.position.z); if (gap < near) { near = gap; nearest = c; } }
    const arriving = near < 1.6;
    if (arriving && nearest && !this.lifted.has(nearest)) { this.lifted.add(nearest); SFX.beep(); }
    if (!arriving) this.lifted.clear();
    this.lift = damp(this.lift, arriving ? 1 : 0, 10, dt);
    this.rig.animate(0, false, dt, this.t);
    for (const A of this.rig.arms) { A.sh.rotation.x = -0.25 - this.lift * 1.35; A.el.rotation.x = -0.4 - this.lift * 0.6; }   // arms come up to take the crate
    this.rig.body.rotation.x = this.lift * 0.12;
    if (this.rig.head) this.rig.head.rotation.x = this.lift * 0.35 - 0.1;
  }
}

// ---------------------------------------------------------------- lamplighter: round the gas lamps with a pole, giving each a flare as he passes
class Lamplighter extends Patroller {
  constructor(game, rig, lamps, o = {}) {
    // stand a step in from each lamp, on the pavement side of it
    const pts = lamps.map((l) => [l.position.x + (l.position.z > 0 ? 0 : 0), l.position.z + (l.position.z > 0 ? -1.1 : 1.1)]);
    super(game, rig, { points: pts, speed: o.speed ?? 0.8, pause: [1.8, 2.4], pauseAll: true, loop: false, cries: o.cries ?? null, cryIcon: '\ud83d\udd6f\ufe0f',
      onArrive: (i) => { this.lit++; this.rig.gesture = 'reach'; this.rig.gT = 0; this.flare = lamps[i]; this.flareT = 1.6; } });
    this.lamps = lamps; this.lit = 0; this.flare = null; this.flareT = 0;
  }
  update(dt) {
    super.update(dt);
    if (this.flare) {
      this.flareT -= dt; const k = sin(clamp(1 - this.flareT / 1.6, 0, 1) * PI);   // up and back down over the pause
      const light = this.flare.userData.light; if (light) light.intensity = 42 + k * 60;
      this.flare.traverse((o) => { if (o.material && o.material.emissiveIntensity !== undefined && o.material.emissive && o.material.emissive.getHex && o.material.emissive.getHex() === 0xffc46a) o.material.emissiveIntensity = 1.6 + k * 2.2; });
      if (this.flareT <= 0) { if (light) light.intensity = 42; this.flare = null; }
    }
  }
}

// ---------------------------------------------------------------- sunbather: flat on their back on a towel, hands behind the head
class Sunbather {
  constructor(game, rig, { x, z, ry = 0 }) {
    this.game = game; this.rig = rig; this.x = x; this.z = z; this.t = rnd() * 10;
    rig.group.rotation.order = 'YXZ'; rig.group.rotation.y = ry; rig.group.rotation.x = -PI / 2;   // lying face up, head away from the origin
    rig.group.position.set(x, game.physics.ground0(x, z) + 0.15, z);
    this.circle = game.physics.addCircle(this, x, z, 0.5);
    greetable(game, this);
  }
  update(dt) {
    this.t += dt; const rig = this.rig;
    rig.animate(0, false, dt, this.t);
    rig.head.rotation.y = 0; rig.head.rotation.x = damp(rig.head.rotation.x, 0.1, 6, dt); rig.spine.rotation.x = 0; rig.spine.rotation.z = 0; rig.body.position.y = 0; rig.body.rotation.z = 0;
    for (const L of rig.legs) { L.hip.rotation.x = damp(L.hip.rotation.x, 0.05, 6, dt); L.knee.rotation.x = damp(L.knee.rotation.x, 0.02, 6, dt); L.ankle.rotation.x = -0.4; }
    if (!rig.gesture) for (const A of rig.arms) { A.sh.rotation.x = damp(A.sh.rotation.x, -2.7, 6, dt); A.el.rotation.x = damp(A.el.rotation.x, -1.9, 6, dt); A.sh.rotation.z = (A === rig.arms[0] ? 1 : -1) * 0.45; }   // hands behind the head
  }
}

// ---------------------------------------------------------------- kneeler: a child on their knees, patting a sandcastle
class Kneeler {
  constructor(game, rig, { x, z, ry = 0 }) {
    this.game = game; this.rig = rig; this.x = x; this.z = z; this.t = rnd() * 10;
    rig.group.rotation.y = ry;
    rig.group.position.set(x, game.physics.ground0(x, z) - 0.4 * rig.k + 0.05, z);   // shins flat on the sand, hips a shin's length lower than standing
    this.circle = game.physics.addCircle(this, x, z, 0.35);
    greetable(game, this);
  }
  update(dt) {
    this.t += dt; const rig = this.rig;
    rig.animate(0, false, dt, this.t);
    for (const L of rig.legs) { L.hip.rotation.x = damp(L.hip.rotation.x, -0.05, 6, dt); L.knee.rotation.x = PI / 2 + 0.05; L.ankle.rotation.x = 0.9; }
    rig.spine.rotation.x = damp(rig.spine.rotation.x, 0.45, 6, dt); rig.body.position.y = 0;
    rig.head.rotation.x = damp(rig.head.rotation.x, 0.2, 6, dt);
    if (!rig.gesture) { const pat = max(0, sin(this.t * 4.2)); for (const A of rig.arms) { A.sh.rotation.x = damp(A.sh.rotation.x, -0.55 - pat * 0.35, 14, dt); A.el.rotation.x = damp(A.el.rotation.x, -0.9 + pat * 0.35, 14, dt); A.sh.rotation.z = (A === rig.arms[0] ? 1 : -1) * 0.22; } }   // patting the sand
  }
}

// ---------------------------------------------------------------- vendor: stands on their pitch holding something up in the left hand, and calls their wares
class Vendor {
  constructor(game, rig, held, { x, z, ry = 0, cries = null, cryIcon = '\ud83c\udf88' }) {
    this.game = game; this.rig = rig; this.x = x; this.z = z; this.t = rnd() * 10; this.look = 0; this.lookW = 0; this.tipT = 0; this.tipped = false;
    this.state = 'idle'; this.timer = 0; this.cries = cries; this.cryIcon = cryIcon; this.cryT = rnd.range(3, 7); this.held = held;
    rig.group.position.set(x, game.physics.ground0(x, z), z); rig.group.rotation.y = ry;
    rig.hands[1].add(held);
    this.circle = game.physics.addCircle(this, x, z, 0.35);   // no greetable(): the world gives the vendor its own prompt
  }
  update(dt) {
    this.t += dt; const rig = this.rig;
    rig.animate(0, false, dt, this.t);
    const A = rig.arms[1]; A.sh.rotation.x = damp(A.sh.rotation.x, -0.9, 8, dt); A.el.rotation.x = damp(A.el.rotation.x, -0.5, 8, dt);   // the bunch held up and out
    if (this.held.userData.update) this.held.userData.update(dt, this.t);
    Wanderer.prototype.lookAtCat.call(this, dt);
    if (this.cries) { this.cryT -= dt; if (this.cryT <= 0) { this.cryT = rnd.range(9, 16); const c = this.game.cat.group.position; if (dist2(this.x, this.z, c.x, c.z) < 400) { this.game.toast(this.cryIcon + ' "' + rnd.pick(this.cries) + '"', 2400); SFX.talk(); } } }
  }
}

// ---------------------------------------------------------------- kite flyer: stands with both hands on the line while the kite swoops about overhead
class KiteFlyer {
  constructor(game, rig, kite, { x, z, wind = [0.6, 0.8], cries = null }) {
    this.game = game; this.rig = rig; this.kite = kite; this.x = x; this.z = z; this.t = rnd() * 10; this.look = 0; this.lookW = 0; this.tipT = 0; this.tipped = false;
    this.state = 'idle'; this.timer = 0; this.cries = cries; this.cryIcon = '\ud83e\ude81'; this.cryT = rnd.range(4, 9);
    const wl = Math.hypot(wind[0], wind[1]) || 1; this.wx = wind[0] / wl; this.wz = wind[1] / wl;
    rig.group.position.set(x, game.physics.ground0(x, z), z); rig.group.rotation.y = atan2(this.wx, this.wz);   // facing downwind, where the kite is
    game.world.add(kite);
    this.line = group(0, 0, 0, game.world); noInk(mesh(G.cyl(0.006, 0.006, 1, 4), mat(0xf0ece4, { roughness: 1 }), { rx: PI / 2, shadow: 'none', parent: this.line }));
    this.hand = V3(); this.circle = game.physics.addCircle(this, x, z, 0.35);
    greetable(game, this);
  }
  update(dt) {
    this.t += dt; const rig = this.rig, t = this.t;
    rig.animate(0, false, dt, t);
    if (!rig.gesture) for (const A of rig.arms) { A.sh.rotation.x = damp(A.sh.rotation.x, -1.5, 8, dt); A.el.rotation.x = damp(A.el.rotation.x, -0.5, 8, dt); A.sh.rotation.z = (A === rig.arms[0] ? 1 : -1) * 0.12; }   // both hands up on the line
    rig.head.rotation.x = damp(rig.head.rotation.x, -0.55, 6, dt);   // looking up at it
    // the kite swoops in a lazy figure of eight, high and downwind
    const g = this.game.physics.ground0(this.x, this.z), swing = sin(t * 0.7) * 3.2, lift = sin(t * 1.1) * 1.4 + cos(t * 0.45) * 0.8;
    const side = [-this.wz, this.wx];
    this.kite.position.set(this.x + this.wx * 6 + side[0] * swing, g + 7 + lift, this.z + this.wz * 6 + side[1] * swing);
    this.kite.rotation.set(-0.35 + sin(t * 1.1) * 0.15, atan2(this.wx, this.wz) + PI, sin(t * 0.7) * 0.45);
    this.kite.userData.tail.rotation.z = sin(t * 2.3) * 0.35; this.kite.userData.tail.rotation.x = cos(t * 1.7) * 0.25;
    rig.hands[0].getWorldPosition(this.hand);
    this.line.position.copy(this.hand).lerp(this.kite.position, 0.5); this.line.lookAt(this.kite.position); this.line.scale.set(1, 1, max(0.01, this.hand.distanceTo(this.kite.position)));
    Wanderer.prototype.lookAtCat.call(this, dt);
    if (this.cries) { this.cryT -= dt; if (this.cryT <= 0) { this.cryT = rnd.range(9, 16); const c = this.game.cat.group.position; if (dist2(this.x, this.z, c.x, c.z) < 400) { this.game.toast(this.cryIcon + ' "' + rnd.pick(this.cries) + '"', 2400); SFX.talk(); } } }
  }
}

// ---------------------------------------------------------------- sledder: down the slope on a sled, a moment at the bottom, then back up dragging it
class Sledder {
  constructor(game, rig, sled, { top, bottom, speed = 4.5, climb = 1.0 }) {
    this.game = game; this.rig = rig; this.sled = sled; this.top = top; this.bottom = bottom; this.speed = speed; this.climb = climb;
    this.state = 'ready'; this.k = 0; this.wait = 1; this.t = rnd() * 10; this.phase = 0; this.runs = 0;
    this.look = 0; this.lookW = 0; this.tipT = 0; this.tipped = false; this.timer = 0;
    game.world.add(sled); sled.rotation.order = 'YXZ'; rig.group.rotation.order = 'YXZ';
    this.rope = group(0, 0, 0, game.world); noInk(mesh(G.cyl(0.01, 0.01, 1, 4), mat(0x6a4a2a, { roughness: 1 }), { rx: PI / 2, shadow: 'none', parent: this.rope }));
    this.hand = V3(); this.x = top[0]; this.z = top[1]; this.circle = game.physics.addCircle(this, this.x, this.z, 0.4);
    greetable(game, this);
  }
  update(dt) {
    this.t += dt; const P = this.game.physics, rig = this.rig, [tx, tz] = this.top, [bx, bz] = this.bottom, dx = bx - tx, dz = bz - tz, L = Math.hypot(dx, dz);
    if (this.state === 'ready') { this.wait -= dt; if (this.wait <= 0) { this.state = 'slide'; this.k = 0; SFX.slide(); const c = this.game.cat.group.position; if (dist2(this.x, this.z, c.x, c.z) < 400) this.game.toast('\ud83d\udef7 "Wheeeee!"', 1600); } }
    if (this.state === 'slide') { this.k += dt * (this.speed + this.k * 3) / L; if (this.k >= 1) { this.k = 1; this.state = 'stop'; this.wait = 1.2; this.runs++; this.game.fx.emit(this.x, P.ground0(this.x, this.z) + 0.3, this.z, { count: 16, colors: [0xffffff, 0xeaf4ff], speed: 1.8, up: 1.4, life: 0.7, gravity: 3 }); } }
    else if (this.state === 'stop') { this.wait -= dt; if (this.wait <= 0) this.state = 'climb'; }
    else if (this.state === 'climb') { this.k -= dt * this.climb / L; if (this.k <= 0) { this.k = 0; this.state = 'ready'; this.wait = rnd.range(1.5, 3); } }
    const x = tx + dx * this.k, z = tz + dz * this.k, y = P.ground0(x, z);
    this.x = x; this.z = z; this.circle.x = x; this.circle.z = z;
    const heading = this.state === 'climb' ? atan2(-dx, -dz) : atan2(dx, dz);
    if (this.state !== 'climb') {
      // on the sled: it follows the slope, the rider sits on it, arms up on the way down
      const ahead = P.ground0(x + dx / L * 0.8, z + dz / L * 0.8), behind = P.ground0(x - dx / L * 0.8, z - dz / L * 0.8), tilt = -atan2(ahead - behind, 1.6);
      this.sled.position.set(x, y + 0.02, z); this.sled.rotation.set(tilt, heading, 0);
      rig.group.position.set(x, y + 0.34 - 0.9 * rig.k + 0.04, z); rig.group.rotation.set(tilt, heading, 0);
      rig.animate(0, false, dt, this.t);
      for (const Lg of rig.legs) { Lg.hip.rotation.x = -1.25; Lg.knee.rotation.x = 0.95; Lg.ankle.rotation.x = 0.3; }
      if (!rig.gesture) for (const A of rig.arms) { A.sh.rotation.x = damp(A.sh.rotation.x, this.state === 'slide' ? -2.4 : -0.7, 8, dt); A.el.rotation.x = damp(A.el.rotation.x, -0.5, 8, dt); A.sh.rotation.z = (A === rig.arms[0] ? 1 : -1) * 0.35; }
      rig.spine.rotation.x = damp(rig.spine.rotation.x, this.state === 'slide' ? -0.15 : 0.15, 6, dt); rig.body.position.y = 0;
      this.rope.visible = false;
    } else {
      // walking back up, the sled dragged along behind on a rope
      this.phase += dt * this.climb * 4.4;
      rig.group.position.set(x, y, z); rig.group.rotation.set(0, dampAngle(rig.group.rotation.y, heading, 6, dt), 0);
      rig.animate(this.phase, true, dt, this.t);
      const sx = x + dx / L * 1.5, sz = z + dz / L * 1.5, sy = P.ground0(sx, sz);
      this.sled.position.set(sx, sy + 0.02, sz); this.sled.rotation.set(0, heading, 0);
      rig.hands[1].getWorldPosition(this.hand); this.rope.visible = true;
      this.rope.position.set((this.hand.x + sx) / 2, (this.hand.y + sy + 0.3) / 2, (this.hand.z + sz) / 2); this.rope.lookAt(sx, sy + 0.3, sz);
      this.rope.scale.set(1, 1, max(0.01, Math.hypot(this.hand.x - sx, this.hand.y - sy - 0.3, this.hand.z - sz)));
    }
    Wanderer.prototype.lookAtCat.call(this, dt);
  }
}

// ---------------------------------------------------------------- chopper: stands over a log with an axe and splits it, again and again
class Chopper {
  constructor(game, rig, { x, z, ry = 0, cries = null }) {
    this.game = game; this.rig = rig; this.x = x; this.z = z; this.t = rnd() * 10; this.look = 0; this.lookW = 0; this.tipT = 0; this.tipped = false;
    this.state = 'idle'; this.timer = 0; this.cries = cries; this.cryIcon = '\ud83e\ude93'; this.cryT = rnd.range(4, 9); this.chopT = rnd.range(1, 2); this.chops = 0; this.struck = false;
    rig.group.position.set(x, game.physics.ground0(x, z), z); rig.group.rotation.y = ry;
    this.circle = game.physics.addCircle(this, x, z, 0.35);
    greetable(game, this);
  }
  update(dt) {
    this.t += dt; const rig = this.rig;
    if (!rig.gesture) { this.chopT -= dt; if (this.chopT <= 0) { rig.gesture = 'chop'; rig.gT = 0; this.struck = false; this.chopT = rnd.range(2.2, 3.6); } }
    if (rig.gesture === 'chop' && !this.struck && rig.gT / 1.1 >= 0.55) {   // the blade lands
      this.struck = true; this.chops++; SFX.thunk();
      const a = rig.group.rotation.y, p = rig.group.position;
      this.game.fx.emit(p.x + sin(a) * 0.7, p.y + 0.5, p.z + cos(a) * 0.7, { count: 7, colors: [0xd9b27a, 0x8a5a32], speed: 1.6, up: 1.8, life: 0.7, gravity: 4 });
    }
    rig.animate(0, false, dt, this.t);
    Wanderer.prototype.lookAtCat.call(this, dt);
    if (this.cries) { this.cryT -= dt; if (this.cryT <= 0) { this.cryT = rnd.range(9, 16); const c = this.game.cat.group.position; if (dist2(this.x, this.z, c.x, c.z) < 400) { this.game.toast(this.cryIcon + ' "' + rnd.pick(this.cries) + '"', 2400); SFX.talk(); } } }
  }
}

// ---------------------------------------------------------------- marchers: a column following a leader, all in step
class Marchers {
  constructor(game, rigs, o) {
    this.game = game; this.rigs = rigs; this.gap = o.gap ?? 1.2;
    this.lead = new Patroller(game, rigs[0], o); this.rig = rigs[0];
    this.circles = rigs.slice(1).map((rig) => game.physics.addCircle(this, this.lead.x, this.lead.z, o.r ?? 0.32));
    this.update(0);
  }
  get x() { return this.lead.x; } get z() { return this.lead.z; }
  update(dt) {
    this.lead.update(dt);
    const L = this.lead, a = L.rig.group.rotation.y, moving = L.state === 'walk', P = this.game.physics;
    this.rigs.slice(1).forEach((rig, i) => {
      const d = (i + 1) * this.gap, x = L.x - sin(a) * d, z = L.z - cos(a) * d;
      rig.group.position.set(x, P.ground0(x, z), z); rig.group.rotation.y = a;
      this.circles[i].x = x; this.circles[i].z = z;
      rig.animate(L.phase, moving, dt, L.t);
    });
  }
}

// ---------------------------------------------------------------- squirrel controller: stays on its spot, fidgets, watches the cat
class Squirrel {
  constructor(game, x, z, id) {
    this.game = game; this.id = id; this.rig = makeSquirrel(); this.x = x; this.z = z;
    this.t = rnd() * 10; this.heading = rnd() * TAU; this.restHeading = this.heading; this.petT = 0;
    this.circle = game.physics.addCircle(this, x, z, 0.18);
    this.rig.group.position.set(x, game.physics.ground0(x, z), z); this.rig.group.rotation.y = this.heading;
    game.world.add(this.rig.group);
    game.addInteractable({ obj: this.rig.group, radius: 2.2, label: () => 'Pet the squirrel', onUse: () => this.pet() });
  }
  pet() {
    const g = this.game;
    g.hearts(this.x, 0.45, this.z, 4); SFX.chitter(); g.toast(rnd.pick(['🐿️ *happy chitter*', '🐿️ The squirrel nuzzles your paw.', '🐿️ *offers you an acorn*']));
    this.petT = 1.6;
  }
  update(dt) {
    this.t += dt; this.petT = max(0, this.petT - dt);
    const cat = this.game.cat.group.position, d2 = dist2(this.x, this.z, cat.x, cat.z);
    // face the cat when it comes close, otherwise drift back to the resting heading
    this.heading = d2 < 16 ? atan2(cat.x - this.x, cat.z - this.z) : this.restHeading;
    this.rig.group.position.y = this.game.physics.ground0(this.x, this.z) + (this.petT > 0 ? abs(sin(this.petT * 12)) * 0.08 : 0);
    this.rig.animate(0, false, dt, this.t);
    this.rig.group.rotation.y = dampAngle(this.rig.group.rotation.y, this.heading, 6, dt);
  }
}

// ---------------------------------------------------------------- robot dog controller
class RoboDog {
  constructor(game, path) {
    this.game = game; this.rig = makeRoboDog(); this.path = path; this.i = 0; this.x = path[0][0]; this.z = path[0][1];
    this.mode = 'patrol'; this.chaseT = 0; this.barkT = 0; this.phase = 0; this.heading = 0; this.t = 0;
    this.circle = game.physics.addCircle(this, this.x, this.z, 0.5);
    this.rig.group.position.set(this.x, 0, this.z); game.world.add(this.rig.group);
  }
  update(dt) {
    this.t += dt; const cat = this.game.cat.group.position, d2 = dist2(this.x, this.z, cat.x, cat.z);
    let tx, tz, speed;
    if (this.mode === 'patrol') {
      if (d2 < 49 && this.game.cat.onGround) { this.mode = 'chase'; this.chaseT = 7; this.barkT = 0; this.game.toast('🤖🐕 WOOF-BEEP! Intruder detected!'); }
      [tx, tz] = this.path[this.i]; speed = 1.6;
      if (dist2(this.x, this.z, tx, tz) < 0.3) this.i = (this.i + 1) % this.path.length;
    } else {
      this.chaseT -= dt; this.barkT -= dt;
      if (this.barkT <= 0) { SFX.bark(); this.barkT = 1.4; }
      if (this.chaseT <= 0 || d2 > 400) { this.mode = 'patrol'; }
      tx = cat.x; tz = cat.z; speed = 3.4;
      if (d2 < 1.1) { speed = 0; if (this.barkT < 1.2) { this.game.toast('🤖🐕 *boop* "Halt, feline!"'); this.barkT = 1.6; } }
    }
    const ang = atan2(tx - this.x, tz - this.z);
    this.heading = dampAngle(this.heading, ang, 5, dt);
    const nx = this.x + sin(this.heading) * speed * dt, nz = this.z + cos(this.heading) * speed * dt;
    const moving = speed > 0 && !this.game.physics.blocked(nx, nz, 0.5, this, 0, 0.3, 1.2);
    if (moving) { this.x = nx; this.z = nz; this.phase += dt * speed * 3.5; } else if (this.mode === 'patrol' && speed > 0) this.i = (this.i + 1) % this.path.length;
    this.circle.x = this.x; this.circle.z = this.z;
    this.rig.group.position.set(this.x, 0, this.z); this.rig.group.rotation.y = this.heading;
    this.rig.animate(this.phase, moving, dt);
    const pulse = this.mode === 'chase' ? 2 + sin(this.t * 14) * 1.5 : 1.2 + sin(this.t * 3) * 0.6;
    this.rig.antenna.material.emissiveIntensity = pulse; this.rig.eye1.material.emissiveIntensity = pulse;
  }
}

// ---------------------------------------------------------------- vehicle controller (cars on a straight road)
class Vehicle {
  constructor(game, rig, { z, dir, speed, x, length = 4, limit = 78, horn = null, laneW = 1.7 }) {
    this.game = game; this.rig = rig; this.z = z; this.dir = dir; this.speed = speed; this.x = x; this.limit = limit; this.length = length; this.laneW = laneW;   // laneW: how far either side of the lane counts as "in the way"
    this.stopped = false; this.honkT = 0; this.v = speed; this.horn = horn ?? (() => SFX.honk());
    this.cf = game.physics.addCircle(this, x, z, 1.0); this.cb = game.physics.addCircle(this, x, z, 1.0);
    rig.group.rotation.y = dir > 0 ? PI / 2 : -PI / 2;
  }
  update(dt) {
    const cat = this.game.cat.group.position;
    let mustStop = false;
    const inLane = (x, z) => { const ahead = (x - this.x) * this.dir; return abs(z - this.z) < this.laneW && ahead > 0 && ahead < 6; };
    if (inLane(cat.x, cat.z)) mustStop = true;
    else for (const c of this.game.physics.circles) { if (c.ref !== this && !c.off && inLane(c.x, c.z)) { mustStop = true; break; } }
    this.honkT -= dt;
    if (mustStop && !this.stopped && this.honkT <= 0) { this.horn(); this.honkT = 3; }
    this.stopped = mustStop;
    this.v = damp(this.v, mustStop ? 0 : this.speed, 3, dt);
    this.x += this.dir * this.v * dt;
    if (this.x * this.dir > this.limit) this.x = -this.dir * this.limit;
    this.rig.group.position.x = this.x; this.rig.group.position.z = this.z;
    this.cf.x = this.x + this.dir * this.length * 0.28; this.cf.z = this.z; this.cb.x = this.x - this.dir * this.length * 0.28; this.cb.z = this.z;
    for (const w of this.rig.wheels) w.rotation.x += this.v * dt * 2.2;
  }
}

// ---------------------------------------------------------------- horse and carriage: clip-clopping along the street, a driver on the box with the reins
class HorseCarriage extends Vehicle {
  constructor(game, driver, o) {
    const carriage = makeCarriageRig(), horse = makeHorse();
    const g = new THREE.Group(); g.add(carriage.group); horse.group.position.set(0, 0, 3.4); g.add(horse.group); game.world.add(g);
    super(game, { group: g, wheels: carriage.wheels }, { ...o, length: 8.5, horn: () => SFX.clop() });
    this.horse = horse; this.driver = driver; this.phase = rnd() * TAU; this.t = rnd() * 10; this.clopT = 0;
    driver.group.position.set(0, 2.05 - 0.9 * driver.k + 0.02, 1.25); g.add(driver.group);
    this.cf.r = 1.2; this.cb.r = 1.1;
  }
  update(dt) {
    super.update(dt);
    this.t += dt; const moving = this.v > 0.3;
    if (moving) { this.phase += dt * this.v * 2.0; this.clopT -= dt * this.v; if (this.clopT <= 0) { SFX.clop(); this.clopT = 0.9; } }
    this.horse.animate(this.phase, moving, dt, this.t);
    const rig = this.driver; rig.animate(0, false, dt, this.t);
    for (const L of rig.legs) { L.hip.rotation.x = -PI / 2 + 0.2; L.knee.rotation.x = PI / 2 - 0.3; L.ankle.rotation.x = 0.2; }
    if (!rig.gesture) for (const A of rig.arms) { A.sh.rotation.x = damp(A.sh.rotation.x, -0.85, 8, dt); A.el.rotation.x = damp(A.el.rotation.x, -0.55, 8, dt); A.sh.rotation.z = (A === rig.arms[0] ? 1 : -1) * 0.2; }   // holding the reins
    rig.spine.rotation.x = damp(rig.spine.rotation.x, 0.1, 6, dt); rig.body.position.y = 0;
  }
}

// ---------------------------------------------------------------- cyclist: a rider on a bike, pedalling along a lane like the cars, ringing a bell for the cat
class Cyclist extends Vehicle {
  constructor(game, rider, bike, o) {
    super(game, bike, { ...o, length: 1.6, horn: () => SFX.bell() });
    this.rider = rider; this.bike = bike; this.t = rnd() * 10;
    // seated: hips on the saddle, leaning forward to the bars
    rider.group.position.set(0, 1.0 - 0.9 * rider.k, -0.2); bike.group.add(rider.group);
    this.cf.r = 0.5; this.cb.r = 0.5;
  }
  update(dt) {
    super.update(dt);
    this.t += dt; const rig = this.rider, ph = this.bike.wheels[0].rotation.x * 1.15;   // the pedals turn with the wheels
    this.bike.crank.rotation.x = ph;
    rig.animate(0, false, dt, this.t);
    rig.legs.forEach((L, i) => { const p = ph + i * PI; L.hip.rotation.x = -1.0 + sin(p) * 0.45; L.knee.rotation.x = 1.0 + cos(p) * 0.5; L.ankle.rotation.x = 0.3; });
    if (!rig.gesture) for (const A of rig.arms) { A.sh.rotation.x = damp(A.sh.rotation.x, -1.05, 8, dt); A.el.rotation.x = damp(A.el.rotation.x, -0.3, 8, dt); A.sh.rotation.z = (A === rig.arms[0] ? 1 : -1) * 0.25; }
    rig.spine.rotation.x = damp(rig.spine.rotation.x, 0.32, 6, dt); rig.head.rotation.x = damp(rig.head.rotation.x, -0.25, 6, dt); rig.body.position.y = 0;
    this.rig.group.rotation.z = damp(this.rig.group.rotation.z, this.v > 0.5 ? sin(ph * 0.5) * 0.02 : 0, 6, dt);
  }
}

