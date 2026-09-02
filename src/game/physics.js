// Platform collision and ground-height resolution.
import { cat } from './cat.js';
import { platforms } from './world.js';

export function resolvePlatformCollision(nextX, nextZ) {
  for (const p of platforms) {
    const halfW = p.halfW + 0.2;
    const halfD = p.halfD + 0.2;
    const dx = nextX - p.x;
    const dz = nextZ - p.z;
    if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
      if (cat.position.y + 0.5 < p.topY) {
        const overlapX = halfW - Math.abs(dx);
        const overlapZ = halfD - Math.abs(dz);
        if (overlapX < overlapZ) {
          return { x: nextX + (dx > 0 ? overlapX : -overlapX), z: nextZ };
        } else {
          return { x: nextX, z: nextZ + (dz > 0 ? overlapZ : -overlapZ) };
        }
      }
    }
  }
  return { x: nextX, z: nextZ };
}

export function getGroundHeight() {
  let bestY = 0;
  for (const p of platforms) {
    const dx = Math.abs(cat.position.x - p.x);
    const dz = Math.abs(cat.position.z - p.z);
    if (dx < p.halfW - 0.1 && dz < p.halfD - 0.1) {
      if (cat.position.y >= p.topY - 0.3) {
        bestY = Math.max(bestY, p.topY);
      }
    }
  }
  return bestY;
}
