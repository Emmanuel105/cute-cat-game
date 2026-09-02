// Ground, vegetation, rocks, water, house, and jump platforms.
import * as THREE from 'three';
import { scene } from './scene.js';

// Ground
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x4a7c3f, roughness: 0.95 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Grass
for (let i = 0; i < 400; i++) {
  const h = 0.1 + Math.random() * 0.3;
  const g = new THREE.Mesh(new THREE.ConeGeometry(0.04, h, 3), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.25 + Math.random() * 0.08, 0.55, 0.25 + Math.random() * 0.2) }));
  const r = 2 + Math.random() * 45, th = Math.random() * Math.PI * 2;
  g.position.set(Math.cos(th) * r, h / 2, Math.sin(th) * r);
  scene.add(g);
}

// Flowers
for (let i = 0; i < 60; i++) {
  const f = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.75, 0.55) }));
  const r = 3 + Math.random() * 30, th = Math.random() * Math.PI * 2;
  f.position.set(Math.cos(th) * r, 0.07, Math.sin(th) * r);
  scene.add(f);
}

// Trees
function tree(x, z, s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * s, 0.35 * s, 2 * s, 6), new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 }));
  trunk.position.y = 1 * s; trunk.castShadow = true; g.add(trunk);
  const l1 = new THREE.Mesh(new THREE.ConeGeometry(1.4 * s, 3 * s, 8), new THREE.MeshStandardMaterial({ color: 0x2d5a1e, roughness: 0.8 }));
  l1.position.y = 3 * s; l1.castShadow = true; g.add(l1);
  const l2 = l1.clone(); l2.scale.set(0.75, 0.75, 0.75); l2.position.y = 4.3 * s; g.add(l2);
  g.position.set(x, 0, z); scene.add(g);
}
for (let i = 0; i < 18; i++) { const r = 12 + Math.random() * 35, th = Math.random() * Math.PI * 2; tree(Math.cos(th) * r, Math.sin(th) * r, 0.8 + Math.random() * 0.5); }

// Rocks
for (let i = 0; i < 12; i++) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.5, 0), new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.9 }));
  const r = 5 + Math.random() * 30, th = Math.random() * Math.PI * 2;
  rock.position.set(Math.cos(th) * r, 0.2, Math.sin(th) * r); rock.castShadow = true; rock.receiveShadow = true; scene.add(rock);
}

// Water
const water = new THREE.Mesh(new THREE.CircleGeometry(2, 32), new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.05, metalness: 0.8, transparent: true, opacity: 0.7 }));
water.rotation.x = -Math.PI / 2; water.position.set(6, 0.02, 6); scene.add(water);

// House
const house = new THREE.Group();
const walls = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 5), new THREE.MeshStandardMaterial({ color: 0xf5f5dc, roughness: 0.8 }));
walls.position.y = 2; walls.castShadow = true; walls.receiveShadow = true; house.add(walls);
const roof = new THREE.Mesh(new THREE.ConeGeometry(4.5, 2.5, 4), new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.7 }));
roof.position.y = 5.25; roof.rotation.y = Math.PI / 4; roof.castShadow = true; house.add(roof);
const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.1), new THREE.MeshStandardMaterial({ color: 0x5c3a1e }));
door.position.set(0, 1.1, 2.51); house.add(door);
const winMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB, emissive: 0x223344, emissiveIntensity: 0.3, transparent: true, opacity: 0.7 });
const w1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.1), winMat); w1.position.set(-1.8, 2.5, 2.51); house.add(w1);
const w2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.1), winMat); w2.position.set(1.8, 2.5, 2.51); house.add(w2);
house.position.set(-10, 0, -8); scene.add(house);

// Platforms
export const platforms = [];
function platform(x, y, z, sx, sz) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.2, sz), new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.6 }));
  top.position.y = y; top.castShadow = true; top.receiveShadow = true; g.add(top);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, y, 6), new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8 }));
  pillar.position.y = y / 2; g.add(pillar);
  g.position.set(x, 0, z); scene.add(g);
  platforms.push({ x, z, topY: y + 0.1, halfW: sx / 2, halfD: sz / 2 });
}
platform(3, 0.5, 3, 2, 2);
platform(6, 1.0, 5, 1.8, 1.8);
platform(9, 1.5, 3, 1.6, 1.6);
platform(11, 1.5, 6, 1.4, 1.4);
