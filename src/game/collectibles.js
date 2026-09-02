// Collectible items and the runaway chase mouse.
import * as THREE from 'three';
import { scene } from './scene.js';

export const items = [];

export function spawnItem(type, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0.6, z);
  if (type === 'fish') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), new THREE.MeshStandardMaterial({ color: 0x87ceeb, emissive: 0x0044aa, emissiveIntensity: 0.35 }));
    b.scale.set(0.45, 0.65, 1.4); g.add(b);
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 3), new THREE.MeshStandardMaterial({ color: 0x87ceeb }));
    t.position.set(0, 0, -0.32); t.rotation.x = Math.PI / 2; g.add(t);
  } else if (type === 'yarn') {
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 2), new THREE.MeshStandardMaterial({ color: 0xff3366, wireframe: true })));
  } else if (type === 'mouse') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshStandardMaterial({ color: 0x888888 }));
    b.scale.set(0.88, 0.78, 1.3); g.add(b);
    const e = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 4), new THREE.MeshStandardMaterial({ color: 0xffaaaa }));
    e.position.set(0.06, 0.12, 0.1); g.add(e);
    const e2 = e.clone(); e2.position.set(-0.06, 0.12, 0.1); g.add(e2);
  } else if (type === 'boost') {
    g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 0), new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.6, metalness: 0.8, roughness: 0.2 })));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 8, 16), new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.6 }));
    ring.rotation.x = Math.PI / 2; g.add(ring);
  }
  scene.add(g);
  items.push({ mesh: g, type, baseY: 0.6, collected: false });
}

spawnItem('fish', 5, 4);
spawnItem('yarn', -4, 6);
spawnItem('mouse', 6, -5);
spawnItem('fish', -6, -4);
spawnItem('yarn', 3, 8);
spawnItem('boost', 0, 8);

// Chase mouse
export const chaseMouse = new THREE.Group();
const cmBody = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshStandardMaterial({ color: 0x666666 }));
cmBody.scale.set(0.85, 0.75, 1.3); chaseMouse.add(cmBody);
const cmEar = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 4), new THREE.MeshStandardMaterial({ color: 0xff9999 }));
cmEar.position.set(0.05, 0.12, 0.1); chaseMouse.add(cmEar);
const cmEar2 = cmEar.clone(); cmEar2.position.set(-0.05, 0.12, 0.1); chaseMouse.add(cmEar2);
chaseMouse.position.set(8, 0.12, 8);
scene.add(chaseMouse);

export const chase = { active: false };

// Move the collectibles and chase mouse to a world's item spots.
export function layoutItems(spots) {
  items.forEach((it, i) => {
    const [, x, z] = spots[i % spots.length];
    it.mesh.position.set(x, it.baseY, z);
    it.collected = false;
    if (!it.mesh.parent) scene.add(it.mesh);
  });
  chase.active = false;
  chaseMouse.position.set(8, 0.12, 8);
}
