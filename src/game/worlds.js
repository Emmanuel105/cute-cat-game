// The four worlds, portal travel, and per-world platform layouts.
import * as THREE from 'three';
import { scene } from './scene.js';
import { state } from './state.js';

export const platforms = [];

// Objects belonging to the current world live in this group so switching is easy.
let worldGroup = new THREE.Group();
scene.add(worldGroup);

let snowPoints = null;

function addPlatform(x, y, z, sx, sz, color = 0x999999) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.2, sz), new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
  top.position.y = y; top.castShadow = true; top.receiveShadow = true; g.add(top);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, y, 6), new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8 }));
  pillar.position.y = y / 2; g.add(pillar);
  g.position.set(x, 0, z);
  worldGroup.add(g);
  platforms.push({ x, z, topY: y + 0.1, halfW: sx / 2, halfD: sz / 2 });
}

function ground(color, roughness = 0.95) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color, roughness }));
  g.rotation.x = -Math.PI / 2;
  g.receiveShadow = true;
  worldGroup.add(g);
}

function scatter(count, minR, maxR, make) {
  for (let i = 0; i < count; i++) {
    const r = minR + Math.random() * (maxR - minR), th = Math.random() * Math.PI * 2;
    make(Math.cos(th) * r, Math.sin(th) * r);
  }
}

// ---------- World builders ----------

function buildMeadow() {
  ground(0x4a7c3f);
  scatter(400, 2, 47, (x, z) => {
    const h = 0.1 + Math.random() * 0.3;
    const g = new THREE.Mesh(new THREE.ConeGeometry(0.04, h, 3), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.25 + Math.random() * 0.08, 0.55, 0.25 + Math.random() * 0.2) }));
    g.position.set(x, h / 2, z);
    worldGroup.add(g);
  });
  scatter(60, 3, 33, (x, z) => {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.75, 0.55) }));
    f.position.set(x, 0.07, z);
    worldGroup.add(f);
  });
  scatter(18, 12, 47, (x, z) => {
    const s = 0.8 + Math.random() * 0.5;
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * s, 0.35 * s, 2 * s, 6), new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 }));
    trunk.position.y = 1 * s; trunk.castShadow = true; g.add(trunk);
    const l1 = new THREE.Mesh(new THREE.ConeGeometry(1.4 * s, 3 * s, 8), new THREE.MeshStandardMaterial({ color: 0x2d5a1e, roughness: 0.8 }));
    l1.position.y = 3 * s; l1.castShadow = true; g.add(l1);
    const l2 = l1.clone(); l2.scale.set(0.75, 0.75, 0.75); l2.position.y = 4.3 * s; g.add(l2);
    g.position.set(x, 0, z); worldGroup.add(g);
  });
  scatter(12, 5, 35, (x, z) => {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.5, 0), new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.9 }));
    rock.position.set(x, 0.2, z); rock.castShadow = true; rock.receiveShadow = true; worldGroup.add(rock);
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(2, 32), new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.05, metalness: 0.8, transparent: true, opacity: 0.7 }));
  water.rotation.x = -Math.PI / 2; water.position.set(6, 0.02, 6); worldGroup.add(water);

  // Little house
  const house = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 5), new THREE.MeshStandardMaterial({ color: 0xf5f5dc, roughness: 0.8 }));
  walls.position.y = 2; walls.castShadow = true; walls.receiveShadow = true; house.add(walls);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.5, 2.5, 4), new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.7 }));
  roof.position.y = 5.25; roof.rotation.y = Math.PI / 4; roof.castShadow = true; house.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.1), new THREE.MeshStandardMaterial({ color: 0x5c3a1e }));
  door.position.set(0, 1.1, 2.51); house.add(door);
  const winMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB, emissive: 0x223344, emissiveIntensity: 0.3, transparent: true, opacity: 0.7 });
  const w1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.1), winMat); w1.position.set(-1.8, 2.5, 2.51); house.add(w1);
  const w2 = w1.clone(); w2.position.set(1.8, 2.5, 2.51); house.add(w2);
  house.position.set(-10, 0, -8); worldGroup.add(house);

  addPlatform(3, 0.5, 3, 2, 2);
  addPlatform(6, 1.0, 5, 1.8, 1.8);
  addPlatform(9, 1.5, 3, 1.6, 1.6);
  addPlatform(11, 1.5, 6, 1.4, 1.4);
}

function buildSnow() {
  ground(0xf0f4f8, 0.85);
  // Snowy pines
  scatter(16, 10, 45, (x, z) => {
    const s = 0.8 + Math.random() * 0.6;
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * s, 0.3 * s, 1.8 * s, 6), new THREE.MeshStandardMaterial({ color: 0x4a3220, roughness: 0.9 }));
    trunk.position.y = 0.9 * s; trunk.castShadow = true; g.add(trunk);
    const l1 = new THREE.Mesh(new THREE.ConeGeometry(1.3 * s, 2.8 * s, 8), new THREE.MeshStandardMaterial({ color: 0x1e4a2a, roughness: 0.8 }));
    l1.position.y = 2.8 * s; l1.castShadow = true; g.add(l1);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.9 * s, 1.4 * s, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }));
    cap.position.y = 3.9 * s; g.add(cap);
    g.position.set(x, 0, z); worldGroup.add(g);
  });
  // Snowmen
  scatter(4, 6, 20, (x, z) => {
    const g = new THREE.Group();
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
    const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), white); b1.position.y = 0.5; b1.castShadow = true; g.add(b1);
    const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), white); b2.position.y = 1.25; g.add(b2);
    const b3 = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), white); b3.position.y = 1.78; g.add(b3);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 6), new THREE.MeshStandardMaterial({ color: 0xff7722 }));
    nose.position.set(0, 1.78, 0.3); nose.rotation.x = Math.PI / 2; g.add(nose);
    const eyeM = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), eyeM); e1.position.set(0.09, 1.86, 0.23); g.add(e1);
    const e2 = e1.clone(); e2.position.x = -0.09; g.add(e2);
    g.position.set(x, 0, z); worldGroup.add(g);
  });
  // Ice boulders
  scatter(10, 5, 35, (x, z) => {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.6, 0), new THREE.MeshStandardMaterial({ color: 0xcce4ff, roughness: 0.3, metalness: 0.1 }));
    rock.position.set(x, 0.25, z); rock.castShadow = true; worldGroup.add(rock);
  });
  // Frozen pond
  const pond = new THREE.Mesh(new THREE.CircleGeometry(3, 32), new THREE.MeshStandardMaterial({ color: 0xbfe3ff, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.85 }));
  pond.rotation.x = -Math.PI / 2; pond.position.set(-7, 0.02, 7); worldGroup.add(pond);

  // Falling snow
  const geo = new THREE.BufferGeometry();
  const pos = [];
  for (let i = 0; i < 600; i++) pos.push((Math.random() - 0.5) * 80, Math.random() * 25, (Math.random() - 0.5) * 80);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  snowPoints = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.9 }));
  worldGroup.add(snowPoints);

  addPlatform(3, 0.6, 3, 2, 2, 0xaaddff);
  addPlatform(6, 1.2, 5, 1.8, 1.8, 0xaaddff);
  addPlatform(9, 1.8, 3, 1.6, 1.6, 0xaaddff);
  addPlatform(11, 2.4, 6, 1.5, 1.5, 0xaaddff);
  addPlatform(8, 3.0, 8, 1.4, 1.4, 0xaaddff);
}

function buildMoon() {
  ground(0x8a8a92, 0.98);
  // Craters
  scatter(14, 4, 40, (x, z) => {
    const r = 0.8 + Math.random() * 2;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.15, 8, 24), new THREE.MeshStandardMaterial({ color: 0x77777e, roughness: 0.95 }));
    rim.rotation.x = -Math.PI / 2; rim.position.set(x, 0.05, z); worldGroup.add(rim);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshStandardMaterial({ color: 0x606068, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(x, 0.01, z); worldGroup.add(floor);
  });
  // Glowing crystals
  scatter(12, 5, 35, (x, z) => {
    const h = 0.5 + Math.random() * 1.2;
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, h, 5), new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? 0x66ffee : 0xbb88ff,
      emissive: Math.random() > 0.5 ? 0x0faa99 : 0x6633cc,
      emissiveIntensity: 0.8, roughness: 0.2
    }));
    c.position.set(x, h / 2, z); c.rotation.z = (Math.random() - 0.5) * 0.4; worldGroup.add(c);
  });
  // Earth in the sky
  const earth = new THREE.Mesh(new THREE.SphereGeometry(5, 24, 24), new THREE.MeshBasicMaterial({ color: 0x3377dd }));
  earth.position.set(-40, 45, -60); worldGroup.add(earth);
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(5.1, 24, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
  clouds.position.copy(earth.position); worldGroup.add(clouds);
  // A little lander
  const lander = new THREE.Group();
  const podium = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.7, roughness: 0.3 }));
  podium.position.y = 1; podium.castShadow = true; lander.add(podium);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 }));
  dome.position.y = 1.6; lander.add(dome);
  for (let i = 0; i < 4; i++) {
    const legA = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x888888 }));
    const a = i * Math.PI / 2 + Math.PI / 4;
    legA.position.set(Math.cos(a) * 1.1, 0.5, Math.sin(a) * 1.1);
    legA.rotation.z = Math.cos(a) * 0.5; legA.rotation.x = -Math.sin(a) * 0.5;
    lander.add(legA);
  }
  lander.position.set(-9, 0, -9); worldGroup.add(lander);

  // Low gravity: platforms float high
  addPlatform(3, 0.8, 3, 2, 2, 0x555566);
  addPlatform(6, 1.8, 5, 1.8, 1.8, 0x555566);
  addPlatform(9, 2.8, 3, 1.7, 1.7, 0x555566);
  addPlatform(6, 3.8, 0, 1.6, 1.6, 0x555566);
  addPlatform(2, 4.6, -3, 1.5, 1.5, 0x555566);
}

function buildCandy() {
  ground(0xffb6d9, 0.9);
  // Lollipop trees
  scatter(14, 8, 42, (x, z) => {
    const g = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
    stick.position.y = 1.3; stick.castShadow = true; g.add(stick);
    const pop = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 16), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.85, 0.6), roughness: 0.25 }));
    pop.position.y = 3.2; pop.scale.z = 0.45; pop.castShadow = true; g.add(pop);
    const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 8, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }));
    swirl.position.y = 3.2; swirl.position.z = 0.22; g.add(swirl);
    g.position.set(x, 0, z); g.rotation.y = Math.random() * Math.PI; worldGroup.add(g);
  });
  // Gumdrops
  scatter(20, 3, 35, (x, z) => {
    const gum = new THREE.Mesh(new THREE.SphereGeometry(0.3 + Math.random() * 0.3, 10, 10), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.9, 0.55), roughness: 0.3 }));
    gum.position.set(x, 0.2, z); gum.scale.y = 0.7; gum.castShadow = true; worldGroup.add(gum);
  });
  // Candy canes
  scatter(6, 6, 25, (x, z) => {
    const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0xff3344, roughness: 0.35 }));
    cane.position.set(x, 1.1, z); cane.rotation.z = (Math.random() - 0.5) * 0.2; cane.castShadow = true; worldGroup.add(cane);
  });
  // Chocolate river
  const choc = new THREE.Mesh(new THREE.CircleGeometry(3.5, 32), new THREE.MeshStandardMaterial({ color: 0x5a3018, roughness: 0.2, metalness: 0.3 }));
  choc.rotation.x = -Math.PI / 2; choc.position.set(8, 0.02, 8); worldGroup.add(choc);

  addPlatform(3, 0.6, 3, 2, 2, 0xffe0b3);
  addPlatform(6, 1.2, 5, 1.8, 1.8, 0xffe0b3);
  addPlatform(9, 1.9, 3, 1.6, 1.6, 0xffe0b3);
  addPlatform(11, 2.6, 6, 1.5, 1.5, 0xffe0b3);
}

// ---------- World definitions ----------

export const WORLDS = [
  {
    name: 'Sunny Meadow', emoji: '🌳', build: buildMeadow,
    jumpMul: 1, airTime: 1, daySky: 0x87CEEB, lockTime: null, fog: [40, 140],
    itemSpots: [['fish', 5, 4], ['yarn', -4, 6], ['mouse', 6, -5], ['fish', -6, -4], ['yarn', 3, 8], ['boost', 0, 8]],
  },
  {
    name: 'Snowy Peaks', emoji: '❄️', build: buildSnow,
    jumpMul: 1, airTime: 1, daySky: 0xcfe4f5, lockTime: null, fog: [30, 110],
    itemSpots: [['fish', 4, 5], ['yarn', -5, 5], ['mouse', 7, -4], ['fish', -7, -6], ['yarn', 2, 9], ['boost', -2, -9]],
  },
  {
    name: 'Moon Base', emoji: '🌙', build: buildMoon,
    jumpMul: 2.1, airTime: 1.7, daySky: 0x0a0a2e, lockTime: 0.0, fog: [50, 180],
    itemSpots: [['fish', 5, 5], ['yarn', -6, 4], ['mouse', 8, -5], ['fish', -5, -7], ['yarn', 4, 9], ['boost', 6, 0]],
  },
  {
    name: 'Candy Kingdom', emoji: '🍭', build: buildCandy,
    jumpMul: 1.25, airTime: 1.1, daySky: 0xffc7e8, lockTime: 0.5, fog: [40, 130],
    itemSpots: [['fish', 5, 4], ['yarn', -4, 6], ['mouse', 6, -5], ['fish', -6, -4], ['yarn', 3, 8], ['boost', 0, -8]],
  },
];

export const PORTAL_COST = 5;

// ---------- Portal ----------

export const portal = new THREE.Group();
const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.12, 12, 40), new THREE.MeshStandardMaterial({ color: 0x9b5cff, emissive: 0x7722ff, emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.2 }));
portal.add(ring);
const swirlDisc = new THREE.Mesh(new THREE.CircleGeometry(0.95, 32), new THREE.MeshBasicMaterial({ color: 0xcfa8ff, transparent: true, opacity: 0.45, side: THREE.DoubleSide }));
portal.add(swirlDisc);
portal.position.set(0, 1.3, -10);
scene.add(portal);

export function animatePortal(time) {
  portal.rotation.y = Math.sin(time * 0.6) * 0.4;
  ring.rotation.z = time * 1.2;
  swirlDisc.material.opacity = 0.35 + Math.sin(time * 3) * 0.12;
  if (snowPoints) {
    const p = snowPoints.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - 0.035;
      if (y < 0) y = 25;
      p.setY(i, y);
    }
    p.needsUpdate = true;
  }
}

// ---------- Loading ----------

function disposeGroup(group) {
  group.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => m.dispose());
    }
  });
}

export function loadWorld(index) {
  scene.remove(worldGroup);
  disposeGroup(worldGroup);
  snowPoints = null;
  worldGroup = new THREE.Group();
  scene.add(worldGroup);
  platforms.length = 0;

  state.worldIndex = index;
  const w = WORLDS[index];
  w.build();
  scene.fog.near = w.fog[0];
  scene.fog.far = w.fog[1];
  if (w.lockTime !== null) state.dayTime = w.lockTime;
  return w;
}

export function currentWorld() {
  return WORLDS[state.worldIndex];
}
