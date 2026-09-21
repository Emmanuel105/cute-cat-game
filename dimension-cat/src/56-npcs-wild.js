// ============================================================================
// WILD CREATURES — crab, seagull, turtle, dog, penguin, yeti, deer, fox, frog,
// owl, fairy, butterfly + Flyer / Hopper controllers.  All rigs face +Z.
// ============================================================================

// ---------------------------------------------------------------- crab (walks sideways: body is turned 90° inside the rig)
function makeCrab(color = 0xe8492b) {
  const g = new THREE.Group(), rig = { group: g, legs: [] };
  const shell = mat(color, { roughness: 0.55 }), dark = mat(0x1a1a1a);
  const body = group(0, 0.16, 0, g); body.rotation.y = PI / 2; rig.body = body;
  mesh(G.sphere(0.2, 14, 10), shell, { sy: 0.55, sz: 0.8, parent: body });
  for (const side of [1, -1]) {
    mesh(G.cyl(0.015, 0.015, 0.09, 5), shell, { x: side * 0.07, y: 0.12, z: 0.13, rx: -0.4, shadow: 'none', parent: body });
    mesh(G.sphere(0.028, 8, 6), dark, { x: side * 0.07, y: 0.17, z: 0.15, shadow: 'none', parent: body });
    const claw = group(side * 0.17, 0.02, 0.16, body); claw.rotation.y = side * 0.5;
    mesh(G.capsule(0.03, 0.08, 6), shell, { z: 0.06, rx: PI / 2, parent: claw });
    const pincer = group(0, 0, 0.13, claw);
    mesh(G.sphere(0.055, 8, 6), shell, { sz: 1.3, parent: pincer });
    const tip = mesh(G.cone(0.03, 0.09, 5), shell, { y: 0.03, z: 0.09, rx: PI / 2 + 0.6, shadow: 'none', parent: pincer });
    tip.userData.keep = true;   // the pincer tip snaps on its own
    rig['claw' + side] = { claw, tip };
    for (let i = 0; i < 4; i++) {
      const leg = group(side * 0.17, 0.0, -0.1 + i * 0.07, body); leg.rotation.z = side * 0.9;
      mesh(G.capsule(0.014, 0.12, 5), shell, { x: side * 0.07, rz: PI / 2, parent: leg });
      mesh(G.capsule(0.011, 0.1, 5), shell, { x: side * 0.16, y: -0.07, rz: PI / 2 - side * 0.9, shadow: 'none', parent: leg });
      rig.legs.push({ leg, side, i });
    }
  }
  rig.animate = (ph, moving, dt, t = 0) => {
    for (const L of rig.legs) L.leg.rotation.x = moving ? sin(ph * 2 + L.i * 1.5 + (L.side > 0 ? 0 : PI)) * 0.35 : damp(L.leg.rotation.x, 0, 8, dt);
    const snap = max(0, sin(t * 2.6)) > 0.92 ? 0.7 : 0;
    for (const side of [1, -1]) { const c = rig['claw' + side]; c.tip.rotation.x = damp(c.tip.rotation.x, PI / 2 + 0.6 - snap, 10, dt); c.claw.rotation.z = side * sin(t * 1.3 + side) * 0.15; }
    body.position.y = 0.16 + (moving ? abs(sin(ph * 2)) * 0.02 : 0);
  };
  bakeRig(g);
  return rig;
}

// ---------------------------------------------------------------- seagull (flyer)
function makeSeagull(o = {}) {
  const g = new THREE.Group(), rig = { group: g, wings: [] };
  const white = mat(o.color ?? 0xf4f4f4, { roughness: 0.8 }), grey = mat(0x9aa4ad, { roughness: 0.8 }), orange = mat(0xffa726, { roughness: 0.6 });
  const body = group(0, 0, 0, g); rig.body = body;
  mesh(G.bodySphere(14, 10), white, { sx: 0.11, sy: 0.1, sz: 0.24, parent: body });
  mesh(G.sphere(0.075, 12, 9), white, { y: 0.06, z: 0.22, parent: body });
  mesh(G.cone(0.025, 0.1, 6), orange, { y: 0.045, z: 0.3, rx: PI / 2, shadow: 'none', parent: body });
  for (const side of [1, -1]) mesh(G.sphere(0.012, 6, 6), mat(0x111111), { x: side * 0.04, y: 0.08, z: 0.26, shadow: 'none', parent: body });
  mesh(G.box(0.1, 0.02, 0.14), grey, { y: 0.02, z: -0.26, parent: body });
  for (const side of [1, -1]) {
    const w = group(side * 0.06, 0.05, 0.02, body);
    mesh(G.box(0.34, 0.02, 0.16), side > 0 ? grey : grey, { x: side * 0.17, parent: w });
    const tipW = group(side * 0.34, 0, 0, w); mesh(G.box(0.26, 0.018, 0.12), white, { x: side * 0.13, z: -0.01, parent: tipW });
    rig.wings.push({ w, tipW, side });
  }
  rig.animate = (ph, moving, dt, t = 0) => {
    const flap = sin(t * 7 + (o.phase ?? 0)), glide = (sin(t * 0.37 + (o.phase ?? 0)) > 0.55) ? 1 : 0;
    for (const W of rig.wings) { const a = glide ? 0.12 : flap * 0.6; W.w.rotation.z = W.side * -a; W.tipW.rotation.z = W.side * -a * 0.8; }
    body.rotation.z = sin(t * 0.8) * 0.15;
  };
  bakeRig(g);
  return rig;
}

// ---------------------------------------------------------------- sea turtle
function makeTurtle() {
  const g = new THREE.Group(), rig = { group: g, fins: [] };
  const shell = mat(0x3f7a3a, { roughness: 0.7 }), skin = mat(0x8bb86a, { roughness: 0.9 }), dark = mat(0x2a4a24, { roughness: 0.7 });
  const body = group(0, 0, 0, g); rig.body = body;
  mesh(G.dome(0.32, 16, 10), shell, { y: 0.1, sy: 0.55, sz: 1.2, parent: body });
  mesh(G.cyl(0.33, 0.33, 0.08, 16), skin, { y: 0.1, sz: 1.2, shadow: 'none', parent: body });
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; mesh(G.sphere(0.07, 8, 6), dark, { x: cos(a) * 0.17, y: 0.2, z: sin(a) * 0.2, sy: 0.35, shadow: 'none', parent: body }); }
  const head = group(0, 0.12, 0.42, body); rig.head = head;
  mesh(G.sphere(0.08, 12, 9), skin, { sz: 1.3, parent: head });
  for (const side of [1, -1]) mesh(G.sphere(0.014, 6, 6), mat(0x111111), { x: side * 0.045, y: 0.03, z: 0.07, shadow: 'none', parent: head });
  for (const [x, z, front] of [[0.3, 0.22, true], [-0.3, 0.22, true], [0.26, -0.22, false], [-0.26, -0.22, false]]) {
    const f = group(x, 0.08, z, body); mesh(G.box(0.3, 0.04, 0.14), skin, { x: x > 0 ? 0.15 : -0.15, rz: x > 0 ? -0.15 : 0.15, parent: f }); rig.fins.push({ f, front, side: x > 0 ? 1 : -1 });
  }
  rig.animate = (ph, moving, dt, t = 0) => {
    for (const F of rig.fins) F.f.rotation.y = moving ? sin(ph + (F.front ? 0 : PI)) * 0.4 * F.side : damp(F.f.rotation.y, 0, 5, dt);
    head.rotation.y = moving ? 0 : sin(t * 0.6) * 0.3; head.position.z = 0.42 + (moving ? 0 : sin(t * 0.4) * 0.03);
  };
  bakeRig(g);
  return rig;
}

// ---------------------------------------------------------------- quadruped (dog / deer / fox / yeti-less generic)
function makeQuadruped(o) {
  const g = new THREE.Group(), rig = { group: g, legs: [] };
  const k = o.scale ?? 1, fur = mat(o.color, { roughness: 0.9, map: o.map ?? null }), fur2 = mat(o.color2 ?? o.color, { roughness: 0.9 }), belly = mat(o.belly ?? o.color2 ?? o.color, { roughness: 0.95 }), dark = mat(0x1a1a1a, { roughness: 0.4 });
  const body = group(0, 0, 0, g); body.scale.setScalar(k); rig.body = body;
  const H = o.bodyY ?? 0.5, L = o.length ?? 0.6;
  mesh(G.bodySphere(), fur, { y: H, sx: 0.22, sy: 0.22, sz: L / 2 + 0.05, parent: body });
  mesh(G.bodySphere(), belly, { y: H - 0.06, z: 0.02, sx: 0.17, sy: 0.15, sz: L / 2 - 0.02, shadow: 'none', parent: body });
  mesh(G.bodySphere(), fur, { y: H + 0.12, z: L / 2 + 0.05, sx: 0.13, sy: 0.12, sz: 0.16, parent: body });   // neck
  const head = group(0, H + 0.26 + (o.neck ?? 0), L / 2 + 0.22, body); rig.head = head;
  mesh(G.sphere(0.16, 16, 12), fur, { sz: 0.95, parent: head });
  mesh(G.sphere(0.09, 12, 9), fur2, { y: -0.05, z: 0.16, sz: 1.3, parent: head });                            // muzzle
  mesh(G.sphere(0.035, 8, 6), dark, { y: -0.02, z: 0.28, sx: 1.2, sy: 0.8, shadow: 'none', parent: head });
  for (const side of [1, -1]) {
    mesh(G.sphere(0.028, 8, 6), dark, { x: side * 0.07, y: 0.04, z: 0.13, shadow: 'none', parent: head });
    mesh(G.sphere(0.008, 6, 6), basic(0xffffff), { x: side * 0.075, y: 0.05, z: 0.155, shadow: 'none', parent: head });
    if (o.ears === 'floppy') mesh(G.box(0.07, 0.2, 0.03), fur2, { x: side * 0.16, y: 0.02, rz: side * 0.35, parent: head });
    else if (o.ears === 'round') mesh(G.sphere(0.06, 10, 8), fur, { x: side * 0.13, y: 0.13, z: -0.02, parent: head });
    else mesh(G.earCone(o.ears === 'big' ? 0.07 : 0.05, o.ears === 'big' ? 0.2 : 0.14), fur, { x: side * 0.1, y: 0.16, z: -0.03, rz: side * -0.3, parent: head });
    if (o.antlers) { const a = group(side * 0.07, 0.15, -0.04, head); const bone = mat(0xd9c9a8, { roughness: 0.8 }); mesh(G.cyl(0.015, 0.02, 0.32, 6), bone, { y: 0.16, rz: side * -0.35, parent: a }); mesh(G.cyl(0.012, 0.015, 0.18, 6), bone, { x: side * 0.06, y: 0.28, rz: side * -1.0, parent: a }); mesh(G.cyl(0.011, 0.014, 0.16, 6), bone, { x: side * 0.02, y: 0.36, rz: side * 0.5, parent: a }); }
  }
  // legs
  for (const [x, z, front] of [[0.13, L / 2 - 0.05, true], [-0.13, L / 2 - 0.05, true], [0.13, -L / 2 + 0.05, false], [-0.13, -L / 2 + 0.05, false]]) {
    const hip = group(x, H - 0.08, z, body); mesh(G.capsule(0.05, H * 0.45 - 0.05), fur, { y: -(H * 0.45) / 2, parent: hip });
    const knee = group(0, -H * 0.45, 0, hip); mesh(G.capsule(0.042, H * 0.45 - 0.05), fur2, { y: -(H * 0.45) / 2, parent: knee });
    mesh(G.sphere(0.05, 8, 6), o.hooves ? dark : fur2, { y: -H * 0.45 - 0.02, z: 0.02, sy: 0.6, sz: 1.3, parent: knee });
    rig.legs.push({ hip, knee, front });
  }
  // tail
  const tail = group(0, H + 0.05, -L / 2 - 0.05, body); rig.tail = tail;
  if (o.tail === 'bushy') { for (let i = 0; i < 4; i++) mesh(G.sphere(0.08 - i * 0.008, 10, 8), i === 3 ? fur2 : fur, { y: 0.05 + i * 0.07, z: -0.08 - i * 0.09, parent: tail }); }
  else if (o.tail === 'stub') mesh(G.sphere(0.05, 8, 6), fur2, { y: 0.04, z: -0.03, parent: tail });
  else mesh(G.capsule(0.025, 0.28, 6), fur, { y: 0.1, z: -0.12, rx: 0.9, parent: tail });
  rig.animate = (ph, moving, dt, t = 0) => {
    for (let i = 0; i < 4; i++) { const Lg = rig.legs[i], p = ph + ((i === 0 || i === 3) ? 0 : PI);
      Lg.hip.rotation.x = moving ? sin(p) * 0.55 : damp(Lg.hip.rotation.x, 0, 8, dt); Lg.knee.rotation.x = moving ? -max(0, cos(p)) * 0.7 : damp(Lg.knee.rotation.x, 0, 8, dt); }
    body.position.y = moving ? abs(sin(ph)) * 0.03 : 0;
    tail.rotation.y = sin(t * (o.wag ?? 4)) * (moving ? 0.35 : 0.5);
    const graze = !moving && o.grazes && sin(t * 0.3) > 0.3 ? 1 : 0;
    head.rotation.x = damp(head.rotation.x, graze ? 0.9 : (moving ? 0.1 : 0), 3, dt);
    head.rotation.y = moving ? 0 : sin(t * 0.7) * 0.25 * (1 - graze);
  };
  bakeRig(g);
  return rig;
}
const makeDog = (color = 0xc8925a) => makeQuadruped({ color, color2: 0xf3e3c8, belly: 0xf3e3c8, ears: 'floppy', tail: 'curl', wag: 7, bodyY: 0.42, length: 0.6, scale: 0.95 });
const makeDeer = () => makeQuadruped({ color: 0xa8763f, color2: 0xe8d7b8, belly: 0xe8d7b8, ears: 'big', tail: 'stub', antlers: true, hooves: true, grazes: true, bodyY: 0.62, length: 0.75, neck: 0.12, scale: 1.05, wag: 2 });
const makeFox = () => makeQuadruped({ color: 0xe8702a, color2: 0xfff1e0, belly: 0xfff1e0, ears: 'big', tail: 'bushy', bodyY: 0.34, length: 0.5, scale: 0.8, wag: 3 });

// ---------------------------------------------------------------- penguin
function makePenguin(o = {}) {
  const g = new THREE.Group(), rig = { group: g, flippers: [] }, k = o.scale ?? 1;
  const black = mat(0x1c2230, { roughness: 0.85 }), white = mat(0xf6f6f6, { roughness: 0.9 }), orange = mat(0xff9800, { roughness: 0.6 });
  const body = group(0, 0, 0, g); body.scale.setScalar(k); rig.body = body;
  mesh(G.capsule(0.2, 0.28, 12), black, { y: 0.42, parent: body });
  mesh(G.capsule(0.15, 0.24, 12), white, { y: 0.4, z: 0.08, shadow: 'none', parent: body });
  const head = group(0, 0.74, 0, body); rig.head = head;
  mesh(G.sphere(0.15, 14, 10), black, { parent: head });
  mesh(G.sphere(0.09, 10, 8), white, { y: -0.02, z: 0.09, sy: 0.9, shadow: 'none', parent: head });
  mesh(G.cone(0.035, 0.12, 6), orange, { y: -0.02, z: 0.17, rx: PI / 2, shadow: 'none', parent: head });
  for (const side of [1, -1]) { mesh(G.sphere(0.02, 8, 6), mat(0x111111), { x: side * 0.055, y: 0.03, z: 0.125, shadow: 'none', parent: head }); mesh(G.sphere(0.006, 6, 6), basic(0xffffff), { x: side * 0.06, y: 0.04, z: 0.143, shadow: 'none', parent: head }); }
  for (const side of [1, -1]) { const f = group(side * 0.19, 0.52, 0, body); mesh(G.box(0.06, 0.3, 0.12), black, { x: side * 0.02, y: -0.14, rz: side * -0.15, parent: f }); rig.flippers.push({ f, side }); }
  for (const side of [1, -1]) mesh(G.box(0.12, 0.03, 0.2), orange, { x: side * 0.09, y: 0.015, z: 0.05, parent: body });
  if (o.scarf) mesh(G.torus(0.14, 0.04, 6, 16), mat(o.scarf, { roughness: 1 }), { y: 0.62, rx: PI / 2, shadow: 'none', parent: body });
  rig.animate = (ph, moving, dt, t = 0) => {
    body.rotation.z = moving ? sin(ph) * 0.22 : damp(body.rotation.z, 0, 5, dt);
    body.rotation.x = moving ? 0.08 : 0;
    body.position.y = moving ? abs(sin(ph)) * 0.035 : 0;
    for (const F of rig.flippers) F.f.rotation.z = F.side * (moving ? 0.4 + sin(ph * 2) * 0.25 : 0.1 + sin(t * 1.5) * 0.05);
    head.rotation.y = moving ? 0 : sin(t * 0.8) * 0.4; head.rotation.z = moving ? -body.rotation.z * 0.5 : 0;
  };
  bakeRig(g);
  return rig;
}

// ---------------------------------------------------------------- yeti (friendly biped)
/**
 * The Frosty Peak yeti: a big shaggy softie. Shaggy silhouette (tufts of fur all over the body),
 * a proper cartoon face with brows, tusks and rosy cheeks, heavy hands and feet, and a slow breath.
 */
function makeYeti() {
  const g = new THREE.Group(), rig = { group: g, legs: [], arms: [] };
  const fur = mat(0xeef2f6, { roughness: 1, map: TEX.fur('yeti', 210, 15, 92, 'plain') });
  const fur2 = mat(0xdbe6f2, { roughness: 1 }), skin = mat(0x8ea0b8, { roughness: 0.8 }), dark = mat(0x1a1a22);
  const white = basic(0xffffff), iris = mat(0x2b4a7a, { roughness: 0.3 }), tooth = mat(0xfbfdff, { roughness: 0.4 });
  const blush = mat(0x8fb6e8, { roughness: 1, transparent: true, opacity: 0.55 });
  const body = group(0, 0, 0, g); rig.body = body;
  /** A ring of fur tufts around a joint — what makes the yeti read as shaggy rather than smooth. */
  const shag = (parent, y, rad, n, size, m = fur2) => { for (let i = 0; i < n; i++) { const a = i / n * TAU; mesh(G.cone(size, size * 1.7, 5), m, { x: cos(a) * rad, y, z: sin(a) * rad, rx: cos(a) * 0.5, rz: -sin(a) * 0.5 + PI * 0.92, parent }); } };
  // legs: short and heavy, with broad feet
  for (const side of [1, -1]) {
    const hip = group(side * 0.26, 0.95, 0, body);
    mesh(G.capsule(0.19, 0.42, 12), fur, { y: -0.32, parent: hip });
    shag(hip, -0.6, 0.18, 6, 0.08);
    mesh(G.capsule(0.15, 0.2, 10), skin, { y: -0.78, z: 0.1, rx: PI / 2, sy: 0.7, parent: hip });
    for (let i = 0; i < 3; i++) mesh(G.sphere(0.055, 8, 6), skin, { x: (i - 1) * 0.09, y: -0.8, z: 0.28, parent: hip });   // toes
    rig.legs.push(hip);
  }
  // torso: a broad barrel with a pale chest, shaggy at the shoulders and the waist
  mesh(G.bodySphere(), fur, { y: 1.5, sx: 0.66, sy: 0.74, sz: 0.54, rx: -PI / 2, parent: body });
  mesh(G.sphere(0.42, 16, 12), fur2, { y: 1.38, z: 0.3, sy: 0.95, sz: 0.5, shadow: 'none', parent: body });
  shag(body, 1.02, 0.55, 10, 0.1);
  shag(body, 1.92, 0.5, 10, 0.11);
  // arms: long, with big open hands
  for (const side of [1, -1]) {
    const sh = group(side * 0.56, 1.92, 0, body);
    mesh(G.sphere(0.25, 12, 10), fur, { x: side * -0.04, parent: sh });
    mesh(G.capsule(0.17, 0.5, 10), fur, { y: -0.36, rz: side * 0.16, parent: sh });
    const el = group(0, -0.7, 0, sh);
    mesh(G.sphere(0.17, 12, 10), fur, { parent: el });
    mesh(G.capsule(0.15, 0.42, 10), fur, { y: -0.28, parent: el });
    shag(el, -0.5, 0.13, 5, 0.07);
    mesh(G.sphere(0.18, 12, 10), skin, { y: -0.62, sz: 0.85, parent: el });
    for (let i = 0; i < 4; i++) mesh(G.capsule(0.045, 0.08, 6), skin, { x: (i - 1.5) * 0.08, y: -0.75, z: 0.04, parent: el });   // fingers
    rig.arms.push({ sh, el });
  }
  // head: big, round, and friendly
  const head = group(0, 2.36, 0.06, body); rig.head = head; const R = 0.44;
  mesh(G.sphere(R, 20, 16), fur, { sy: 0.98, parent: head });
  mesh(G.sphere(R * 0.72, 16, 12), fur2, { y: -R * 0.16, z: R * 0.54, sx: 1.04, sy: 0.82, sz: 0.62, shadow: 'none', parent: head });   // muzzle
  rig.eyes = [];
  for (const side of [1, -1]) {
    const e = group(side * R * 0.34, R * 0.18, R * 0.8, head);
    mesh(G.sphere(R * 0.24, 14, 12), white, { sz: 0.5, shadow: 'none', parent: e });
    mesh(G.sphere(R * 0.13, 10, 8), iris, { z: R * 0.1, sz: 0.55, shadow: 'none', parent: e });
    mesh(G.sphere(R * 0.045, 6, 6), white, { x: side * R * 0.06, y: R * 0.07, z: R * 0.14, shadow: 'none', parent: e });
    rig.eyes.push(e);
    mesh(G.box(R * 0.42, R * 0.1, R * 0.08), mat(0xb9c9de, { roughness: 1 }), { x: side * R * 0.34, y: R * 0.48, z: R * 0.82, rz: side * 0.2, shadow: 'none', parent: head });   // brow
    mesh(G.sphere(R * 0.2, 10, 8), blush, { x: side * R * 0.62, y: -R * 0.16, z: R * 0.62, sz: 0.3, shadow: 'none', parent: head });
    mesh(G.cone(0.075, 0.2, 5), fur, { x: side * R * 0.78, y: R * 0.72, rz: side * -0.45, parent: head });                     // little horn-ears
    mesh(G.cone(R * 0.11, R * 0.2, 5), tooth, { x: side * R * 0.2, y: -R * 0.5, z: R * 0.72, rx: PI, shadow: 'none', parent: head });   // tusks
  }
  mesh(G.sphere(R * 0.17, 10, 8), mat(0x5d7290, { roughness: 0.6 }), { y: -R * 0.02, z: R * 1.06, sx: 1.4, sy: 0.85, shadow: 'none', parent: head });   // nose
  rig.mouth = mesh(G.torus(R * 0.3, R * 0.07, 6, 16, PI), dark, { y: -R * 0.34, z: R * 0.92, rz: PI, shadow: 'none', parent: head });
  shag(head, -R * 0.55, R * 0.86, 9, 0.075);   // a beard of fur under the chin
  rig.blinkT = rnd.range(1, 4);
  rig.animate = (ph, moving, dt, t = 0) => {
    for (let i = 0; i < 2; i++) {
      const p = ph + i * PI;
      rig.legs[i].rotation.x = moving ? -sin(p) * 0.5 : damp(rig.legs[i].rotation.x, 0, 6, dt);
      rig.arms[i].sh.rotation.x = moving ? sin(p) * 0.45 : sin(t * 0.9 + i) * 0.1;
      rig.arms[i].sh.rotation.z = (i ? -1 : 1) * 0.1;
      rig.arms[i].el.rotation.x = -0.35 - (moving ? 0 : sin(t * 0.7 + i) * 0.08);
    }
    body.position.y = moving ? abs(sin(ph)) * 0.06 : sin(t * 1.1) * 0.015;
    body.rotation.z = moving ? sin(ph) * 0.06 : 0;
    body.scale.y = 1 + sin(t * 1.4) * 0.012;                     // breathing
    rig.blinkT -= dt;
    const shut = rig.blinkT < 0 && rig.blinkT > -0.14 ? 0.08 : 1;
    if (rig.blinkT < -0.14) rig.blinkT = rnd.range(2, 6);
    for (const e of rig.eyes) e.scale.y = damp(e.scale.y, shut, 26, dt);
    head.rotation.y = moving ? 0 : sin(t * 0.5) * 0.4;
    head.rotation.x = moving ? 0.05 : sin(t * 0.8) * 0.05;
  };
  bakeRig(g);
  return rig;
}

// ---------------------------------------------------------------- frog (hopper)
function makeFrog(color = 0x4caf50) {
  const g = new THREE.Group(), rig = { group: g };
  const skin = mat(color, { roughness: 0.6 }), light = mat(0xc8e6a0, { roughness: 0.7 }), dark = mat(0x111111);
  const body = group(0, 0, 0, g); rig.body = body;
  mesh(G.bodySphere(14, 10), skin, { y: 0.11, sx: 0.13, sy: 0.1, sz: 0.16, parent: body });
  mesh(G.bodySphere(14, 10), light, { y: 0.08, z: 0.02, sx: 0.1, sy: 0.07, sz: 0.13, shadow: 'none', parent: body });
  for (const side of [1, -1]) {
    mesh(G.sphere(0.05, 10, 8), skin, { x: side * 0.08, y: 0.2, z: 0.08, parent: body });
    mesh(G.sphere(0.03, 8, 6), basic(0xfff2a8), { x: side * 0.08, y: 0.21, z: 0.11, shadow: 'none', parent: body });
    mesh(G.sphere(0.014, 6, 6), dark, { x: side * 0.08, y: 0.21, z: 0.135, shadow: 'none', parent: body });
    const thigh = group(side * 0.12, 0.08, -0.08, body); mesh(G.sphere(0.06, 8, 6), skin, { sz: 1.4, parent: thigh }); mesh(G.box(0.03, 0.02, 0.14), skin, { x: side * 0.02, y: -0.06, z: 0.06, parent: thigh });
    mesh(G.capsule(0.015, 0.06, 5), skin, { x: side * 0.09, y: 0.04, z: 0.12, rx: 1.2, parent: body });
    rig['thigh' + side] = thigh;
  }
  rig.animate = (ph, moving, dt, t = 0) => {
    body.scale.y = moving ? 1.15 : 1 + sin(t * 3) * 0.04;      // throat puff when idle
    body.rotation.x = moving ? -0.4 : 0;
    for (const side of [1, -1]) rig['thigh' + side].rotation.x = moving ? -0.9 : 0;
  };
  bakeRig(g);
  return rig;
}

// ---------------------------------------------------------------- owl (perched; only animates)
function makeOwl() {
  const g = new THREE.Group(), rig = { group: g };
  const brown = mat(0x6d4c2f, { roughness: 1 }), cream = mat(0xe8d4b0, { roughness: 1 }), dark = mat(0x111111), amber = glowMat(0xffb300, 0.9);
  const body = group(0, 0, 0, g); rig.body = body;
  mesh(G.capsule(0.13, 0.16, 12), brown, { y: 0.24, parent: body });
  mesh(G.capsule(0.09, 0.12, 12), cream, { y: 0.21, z: 0.07, shadow: 'none', parent: body });
  const head = group(0, 0.46, 0, body); rig.head = head;
  mesh(G.sphere(0.14, 14, 10), brown, { parent: head });
  for (const side of [1, -1]) {
    mesh(G.sphere(0.07, 10, 8), cream, { x: side * 0.06, y: 0.01, z: 0.09, sz: 0.5, shadow: 'none', parent: head });
    rig['eye' + side] = mesh(G.sphere(0.04, 10, 8), amber, { x: side * 0.06, y: 0.01, z: 0.115, sz: 0.5, shadow: 'none', parent: head });
    rig['eye' + side].userData.keep = true;   // blinks by scale, so it stays its own mesh
    mesh(G.sphere(0.018, 6, 6), dark, { x: side * 0.06, y: 0.01, z: 0.135, shadow: 'none', parent: head });
    mesh(G.earCone(0.035, 0.1), brown, { x: side * 0.09, y: 0.13, rz: side * -0.4, parent: head });
    mesh(G.box(0.05, 0.22, 0.1), brown, { x: side * 0.14, y: 0.25, rz: side * 0.15, parent: body });
  }
  mesh(G.cone(0.025, 0.06, 5), mat(0xffb74d), { y: -0.04, z: 0.14, rx: PI / 2, shadow: 'none', parent: head });
  rig.animate = (ph, moving, dt, t = 0) => {
    const turn = sin(t * 0.35) > 0.6 ? 1.6 : sin(t * 0.35) < -0.6 ? -1.6 : 0;
    head.rotation.y = damp(head.rotation.y, turn, 3, dt);
    const blink = (sin(t * 1.9) > 0.97) ? 0.1 : 1; rig.eye1.scale.y = damp(rig.eye1.scale.y, blink, 20, dt); rig['eye-1'].scale.y = rig.eye1.scale.y;
    body.scale.y = 1 + sin(t * 1.2) * 0.015;
  };
  bakeRig(g);
  return rig;
}

// ---------------------------------------------------------------- fairy (flyer) + butterfly (flyer)
function makeFairy(color = 0xa8ff9a) {
  const g = new THREE.Group(), rig = { group: g };
  const body = group(0, 0, 0, g); rig.body = body;
  mesh(G.capsule(0.03, 0.06, 6), glowMat(color, 1.2), { shadow: 'none', parent: body });
  mesh(G.sphere(0.035, 8, 6), mat(0xffe0c0, { emissive: 0xffe0c0, emissiveIntensity: 0.6 }), { y: 0.08, shadow: 'none', parent: body });
  const wingM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }); worldBag.track(wingM);
  rig.wings = [1, -1].map((side) => { const w = group(0, 0.04, -0.02, body); mesh(G.plane(0.12, 0.16), wingM, { x: side * 0.07, ry: side * 0.4, shadow: 'none', parent: w }); return { w, side }; });
  glowSprite(color, 0.7, 0.7, body);
  rig.light = pointLight(color, 3, 4, 0, 0, 0, body);
  rig.animate = (ph, moving, dt, t = 0) => { for (const W of rig.wings) W.w.rotation.y = W.side * (0.3 + sin(t * 22) * 0.5); body.position.y = sin(t * 3) * 0.05; rig.light.intensity = 2.5 + sin(t * 9) * 1; };
  bakeRig(g);
  return rig;
}
function makeButterfly(hue = 300) {
  const g = new THREE.Group(), rig = { group: g };
  const body = group(0, 0, 0, g); rig.body = body;
  mesh(G.capsule(0.008, 0.05, 5), mat(0x222222), { rx: PI / 2, shadow: 'none', parent: body });
  for (const side of [1, -1]) mesh(G.cyl(0.002, 0.002, 0.05, 3), mat(0x222222), { x: side * 0.01, y: 0.02, z: 0.05, rx: -0.9, rz: side * 0.4, shadow: 'none', parent: body });   // antennae
  const wingM = new THREE.MeshBasicMaterial({ map: TEX.wing(hue), transparent: true, side: THREE.DoubleSide, depthWrite: false, alphaTest: 0.2 }); worldBag.track(wingM);
  rig.wings = [1, -1].map((side) => { const w = group(0, 0, 0, body); const m = mesh(G.plane(0.12, 0.12), wingM, { x: side * 0.06, rx: -PI / 2, shadow: 'none', parent: w }); if (side < 0) m.scale.x = -1; return { w, side }; });
  rig.animate = (ph, moving, dt, t = 0) => { for (const W of rig.wings) W.w.rotation.z = W.side * sin(t * 14 + (rig.phase ?? 0)) * 0.9; };
  bakeRig(g);
  return rig;
}

// ---------------------------------------------------------------- Flyer controller: loops around a centre in the air
class Flyer {
  /** o: {cx, cz, r, h, speed, bob, wobble, phase, cw} */
  constructor(game, rig, o) {
    this.game = game; this.rig = rig; this.cx = o.cx; this.cz = o.cz; this.r = o.r ?? 8; this.h = o.h ?? 6; this.speed = o.speed ?? 3; this.bob = o.bob ?? 0.6; this.wobble = o.wobble ?? 0;
    this.a = o.phase ?? rnd() * TAU; this.dir = o.cw === false ? -1 : 1; this.t = rnd() * 10; this.rx = o.rx ?? this.r; this.rz = o.rz ?? this.r;
    rig.phase = this.a;
    game.world.add(rig.group);
    this.update(0);
  }
  update(dt) {
    this.t += dt; this.a += this.dir * this.speed / max(1, this.r) * dt;
    const wob = this.wobble ? sin(this.t * 1.7) * this.wobble : 0;
    const x = this.cx + cos(this.a) * (this.rx + wob), z = this.cz + sin(this.a) * (this.rz + wob);
    const ground = this.game.physics.ground0(x, z);
    const y = ground + this.h + sin(this.t * 1.3) * this.bob;
    const g = this.rig.group, dx = x - g.position.x, dz = z - g.position.z;
    if (dx * dx + dz * dz > 1e-6) g.rotation.y = dampAngle(g.rotation.y, atan2(dx, dz), 6, dt || 1);
    g.position.set(x, y, z);
    this.rig.animate(0, true, dt, this.t);
  }
}

// ---------------------------------------------------------------- Hopper controller: random hops (frogs, bunnies, small critters)
class Hopper {
  constructor(game, rig, o) {
    this.game = game; this.rig = rig; this.x = o.x; this.z = o.z; this.hx = o.x; this.hz = o.z; this.leash = o.leash ?? 5; this.r = o.r ?? 0.2;
    this.dist = o.dist ?? [0.4, 1.0]; this.dur = o.dur ?? 0.4; this.height = o.height ?? 0.3; this.idle = o.idle ?? [0.8, 3]; this.shy = o.shy ?? true; this.onHop = o.onHop || null;
    this.state = 'idle'; this.timer = rnd.range(0.2, 2); this.t = rnd() * 10; this.hop = null; this.heading = rnd() * TAU;
    this.circle = game.physics.addCircle(this, o.x, o.z, this.r);
    rig.group.position.set(o.x, game.physics.ground0(o.x, o.z), o.z); rig.group.rotation.y = this.heading; game.world.add(rig.group);
  }
  startHop(dir, dist) {
    let tx = this.x + sin(dir) * dist, tz = this.z + cos(dir) * dist;
    if (dist2(tx, tz, this.hx, this.hz) > this.leash * this.leash) { dir = atan2(this.hx - this.x, this.hz - this.z); tx = this.x + sin(dir) * dist; tz = this.z + cos(dir) * dist; }
    if (this.game.physics.blocked(tx, tz, this.r, this, this.game.physics.ground0(tx, tz), 0.3, 0.6)) return false;
    this.hop = { sx: this.x, sz: this.z, tx, tz, t: 0 }; this.heading = dir; this.state = 'hop'; this.onHop?.(); return true;
  }
  update(dt) {
    this.t += dt; this.timer -= dt; const P = this.game.physics, cat = this.game.cat.group.position;
    if (this.state === 'hop') {
      const h = this.hop; h.t += dt; const k = min(1, h.t / this.dur);
      this.x = lerp(h.sx, h.tx, k); this.z = lerp(h.sz, h.tz, k); this.circle.x = this.x; this.circle.z = this.z;
      this.rig.group.position.set(this.x, P.ground0(this.x, this.z) + sin(k * PI) * this.height, this.z);
      if (k >= 1) { this.state = 'idle'; this.timer = rnd.range(...this.idle); }
      this.rig.animate(0, true, dt, this.t);
    } else {
      const near = this.shy && dist2(this.x, this.z, cat.x, cat.z) < 2.2 * 2.2;
      if (this.timer <= 0 || near) { const dir = near ? atan2(this.x - cat.x, this.z - cat.z) + rnd.range(-0.5, 0.5) : rnd() * TAU; if (!this.startHop(dir, rnd.range(...this.dist))) this.timer = 0.4; }
      this.rig.group.position.y = P.ground0(this.x, this.z);
      this.rig.animate(0, false, dt, this.t);
    }
    this.rig.group.rotation.y = dampAngle(this.rig.group.rotation.y, this.heading, 10, dt);
  }
}

// ---------------------------------------------------------------- Follower controller: a friendly animal that trots after the cat when close
// ---------------------------------------------------------------- dog walker: a stroller with a dog trotting behind on a lead
class DogWalker {
  constructor(game, person, dog, o) {
    this.game = game; this.rig = person; this.dog = dog; this.x = o.x; this.z = o.z;
    game.world.add(dog.group);
    this.walker = new Wanderer(game, person, { ...o, idle: [1.5, 4], walk: [4, 9] });
    this.follow = new Follower(game, dog, { x: o.x + 1, z: o.z + 0.6, r: 0.3, speed: (o.speed ?? 1) * 1.6, range: 99, keep: 1.2, leash: 99, height: 0.9, step: 0.3,
      target: () => this.walker, sfx: () => { if (rnd.chance(0.3)) SFX.woof(); } });
    // the lead: a unit cylinder along z, stretched from the hand to the collar every frame
    this.lead = group(0, 0, 0, game.world);
    noInk(mesh(G.cyl(0.012, 0.012, 1, 4), mat(0x8a2f2f, { roughness: 0.9 }), { rx: PI / 2, shadow: 'none', parent: this.lead }));
    this.hand = V3(); this.collar = V3();
    game.addInteractable({ obj: dog.group, radius: 2.2, label: () => 'Pet the dog', onUse: () => { SFX.woof(); game.hearts(dog.group.position.x, 0.8, dog.group.position.z, 4); game.toast('\ud83d\udc15 *happy tail wag*'); } });
  }
  update(dt) {
    this.walker.update(dt); this.follow.update(dt);
    this.x = this.walker.x; this.z = this.walker.z;
    this.rig.hands[1].getWorldPosition(this.hand);
    const d = this.dog.group;
    this.collar.set(d.position.x + sin(d.rotation.y) * 0.22, d.position.y + 0.5, d.position.z + cos(d.rotation.y) * 0.22);
    this.lead.position.copy(this.hand).lerp(this.collar, 0.5); this.lead.lookAt(this.collar);
    this.lead.scale.set(1, 1, max(0.01, this.hand.distanceTo(this.collar)));
  }
}

class Follower {
  constructor(game, rig, o) {
    this.game = game; this.rig = rig; this.x = o.x; this.z = o.z; this.r = o.r ?? 0.35; this.speed = o.speed ?? 2.4; this.range = o.range ?? 9; this.keep = o.keep ?? 1.6;
    this.target = o.target ?? null;    // () => {x, z}; the cat when not given
    this.phase = 0; this.t = rnd() * 10; this.wander = new Wanderer(game, rig, { ...o, r: this.r });
    this.circle = this.wander.circle; this.barkT = 0; this.sfx = o.sfx || null; this.happy = false;
  }
  update(dt) {
    this.t += dt; const cat = this.target ? this.target() : this.game.cat.group.position, w = this.wander, d2 = dist2(w.x, w.z, cat.x, cat.z);
    if (d2 > this.range * this.range || d2 < this.keep * this.keep) { if (d2 < this.keep * this.keep) { w.state = 'idle'; w.timer = max(w.timer, 0.3); } this.happy = d2 < this.keep * this.keep; w.update(dt); return; }
    const ang = atan2(cat.x - w.x, cat.z - w.z), nx = w.x + sin(ang) * this.speed * dt, nz = w.z + cos(ang) * this.speed * dt;
    if (!this.game.physics.blocked(nx, nz, this.r, w, this.game.physics.ground0(nx, nz), 0.3, 1.2)) { w.x = nx; w.z = nz; w.circle.x = nx; w.circle.z = nz; w.angle = ang; }
    this.phase += dt * this.speed * 3.2; this.barkT -= dt;
    if (this.barkT <= 0 && this.sfx) { this.sfx(); this.barkT = rnd.range(3, 7); }
    this.rig.group.position.set(w.x, this.game.physics.ground0(w.x, w.z), w.z); this.rig.group.rotation.y = dampAngle(this.rig.group.rotation.y, ang, 8, dt);
    this.rig.animate(this.phase, true, dt, this.t);
  }
}
