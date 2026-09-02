// Simple particle system for dust, sparkles, and jump puffs.
import * as THREE from 'three';
import { scene } from './scene.js';

const particles = [];

export function emitParticles(pos, color, count = 8, type = 'dust') {
  for (let i = 0; i < count; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(type === 'sparkle' ? 0.06 : 0.04, 4, 4), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 }));
    p.position.copy(pos);
    p.userData = { vel: new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() * 2 + 1) * (type === 'jump' ? 2 : 1), (Math.random() - 0.5) * 3), life: 1, type };
    scene.add(p);
    particles.push(p);
  }
}

export function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.position.add(p.userData.vel.clone().multiplyScalar(0.016));
    p.userData.vel.y -= p.userData.type === 'jump' ? 5 : 2;
    p.userData.life -= 0.02;
    p.material.opacity = p.userData.life;
    if (p.userData.life <= 0) { scene.remove(p); particles.splice(i, 1); }
  }
}
