// Entry point: wires all modules together and runs the game loop.
import * as THREE from 'three';
import { scene, camera, renderer } from './game/scene.js';
import { WORLDS, PORTAL_COST, portal, loadWorld, currentWorld, animatePortal } from './game/worlds.js';
import { cat, parts, getCharacter } from './game/cat.js';
import { items, chaseMouse, chase, layoutItems } from './game/collectibles.js';
import { emitParticles, updateParticles } from './game/particles.js';
import { keys, state } from './game/state.js';
import { setupInput } from './game/input.js';
import { updateDayNight } from './game/daynight.js';
import { resolvePlatformCollision, getGroundHeight } from './game/physics.js';
import { showMsg, updateHUD, setWorldLabel } from './game/ui.js';

scene.add(cat);
setupInput();

function travelTo(index) {
  const w = loadWorld(index);
  layoutItems(w.itemSpots);
  cat.position.set(0, 0, 0);
  cat.rotation.y = 0;
  state.portalCooldown = 2;
  setWorldLabel(`${w.emoji} ${w.name}`);
  showMsg(`${w.emoji} Welcome to ${w.name}!`);
  emitParticles(cat.position.clone().add(new THREE.Vector3(0, 1, 0)), 0x9b5cff, 16, 'sparkle');
}

const firstWorld = loadWorld(0);
layoutItems(firstWorld.itemSpots);
setWorldLabel(`${firstWorld.emoji} ${firstWorld.name}`);

// Small hook for automated testing (harmless in production)
window.__game = { state, travelTo, cat };

function animate() {
  requestAnimationFrame(animate);
  state.time += 0.016;
  updateDayNight();
  if (!state.gameStarted) { renderer.render(scene, camera); return; }

  const world = currentWorld();
  const character = getCharacter();

  // Tank movement (character affects speed)
  let target = 0;
  let moving = false;
  if (keys.w) { target = (keys.shift && state.energy > 0 ? 7 : 3.5) * character.speedMul; moving = true; }
  if (keys.s) { target = (keys.shift && state.energy > 0 ? -3.5 : -2) * character.speedMul; moving = true; }
  if (keys.shift && moving && state.energy > 0) { state.energy -= 0.2; }
  else if (state.energy < 100) { state.energy += 0.1; }

  state.speed += (target - state.speed) * 0.1;
  if (Math.abs(state.speed) < 0.05) state.speed = 0;

  if (keys.a) cat.rotation.y += 2.0 * 0.016;
  if (keys.d) cat.rotation.y -= 2.0 * 0.016;

  if (state.speed !== 0) {
    const nextX = cat.position.x + Math.sin(cat.rotation.y) * state.speed * 0.016;
    const nextZ = cat.position.z + Math.cos(cat.rotation.y) * state.speed * 0.016;
    const resolved = resolvePlatformCollision(nextX, nextZ);
    cat.position.x = resolved.x;
    cat.position.z = resolved.z;
  }

  cat.position.x = Math.max(-45, Math.min(45, cat.position.x));
  cat.position.z = Math.max(-45, Math.min(45, cat.position.z));

  const groundY = getGroundHeight();

  // Jump height scales with character and world (Moon = low gravity, floaty air time)
  let yOff = 0;
  if (state.isJump) {
    state.jumpT += 0.04 / world.airTime;
    yOff = Math.sin(state.jumpT * Math.PI) * 1.6 * character.jumpMul * world.jumpMul;
    cat.rotation.x = -Math.sin(state.jumpT * Math.PI) * 0.18;
    if (state.jumpT >= 1) { state.isJump = false; cat.rotation.x = 0; }
  }

  cat.position.y = Math.max(groundY, groundY + yOff);

  if (!state.isJump) {
    if (cat.position.y > groundY + 0.05) {
      cat.position.y -= 0.12 / world.airTime;
      if (cat.position.y < groundY) cat.position.y = groundY;
    }
    if (Math.abs(cat.position.y - groundY) < 0.05) {
      cat.position.y = groundY;
      state.onGround = true;
    } else {
      state.onGround = false;
    }
  } else {
    state.onGround = false;
  }

  if (moving && Math.abs(state.speed) > 1.5 && state.onGround && Math.random() < 0.1) {
    emitParticles(cat.position.clone().add(new THREE.Vector3(0, 0.05, 0)), 0x8B4513, 2, 'dust');
  }

  // Body bounce (LOCAL)
  const bounce = moving ? Math.sin(state.time * (keys.shift ? 16 : 9)) * 0.07 : Math.sin(state.time * 2.2) * 0.02;
  if (parts.body) parts.body.position.y = 0.9 + bounce;
  if (parts.headG) parts.headG.position.y = 1.35 + bounce * 0.5;

  // Legs
  const ls = moving ? (keys.shift ? 16 : 9) : 0;
  const la = moving ? (keys.shift ? 0.35 : 0.22) : 0;
  if (parts.legFL) {
    parts.legFL.rotation.x = moving ? Math.sin(state.time * ls) * la : 0;
    parts.legFR.rotation.x = moving ? Math.sin(state.time * ls + Math.PI) * la : 0;
    parts.legBL.rotation.x = moving ? Math.sin(state.time * ls + Math.PI) * la : 0;
    parts.legBR.rotation.x = moving ? Math.sin(state.time * ls) * la : 0;
  }

  // Tail (LOCAL)
  if (parts.tailSegs) {
    parts.tailSegs.forEach((seg, i) => {
      const w = Math.sin(state.time * 3.5 + i * 0.5) * (0.08 + i * 0.03);
      const ex = moving ? Math.sin(state.time * 8 + i * 0.35) * 0.12 : 0;
      seg.position.x = w + ex;
    });
  }

  // Head
  if (parts.headG) { parts.headG.rotation.z = Math.sin(state.time * 1.6) * 0.03; parts.headG.rotation.x = Math.sin(state.time * 0.8) * 0.04; }

  // Blink
  state.blinkT += 0.016;
  if (state.blinkT >= state.nextBlink) {
    const bp = (state.blinkT - state.nextBlink) / 0.15;
    if (bp <= 1) { const s = Math.sin(bp * Math.PI); parts.eyelids.forEach(l => l.scale.y = s); }
    else { parts.eyelids.forEach(l => l.scale.y = 0); state.blinkT = 0; state.nextBlink = 2 + Math.random() * 4; }
  }

  // Ear twitch
  state.earT += 0.016;
  if (state.earT >= state.nextEar) {
    const tp = (state.earT - state.nextEar) / 0.2;
    const earBase = parts.earBaseZ ?? 0.3;
    if (tp <= 1) { const t = Math.sin(tp * Math.PI) * 0.18; if (parts.earL) parts.earL.rotation.z = -earBase + t * (Math.random() > 0.5 ? 1 : -1); if (parts.earR) parts.earR.rotation.z = earBase + t * (Math.random() > 0.5 ? -1 : 1); }
    else { if (parts.earL) parts.earL.rotation.z = -earBase; if (parts.earR) parts.earR.rotation.z = earBase; state.earT = 0; state.nextEar = 0.8 + Math.random() * 3; }
  }

  // Collectibles
  items.forEach(it => {
    if (it.collected) return;
    it.mesh.position.y = it.baseY + Math.sin(state.time * 2.2 + it.mesh.position.x) * 0.18;
    it.mesh.rotation.y = state.time;
    if (cat.position.distanceTo(it.mesh.position) < 1.1) {
      it.collected = true; scene.remove(it.mesh);
      if (it.type === 'boost') { state.boostTime = 3; showMsg('⚡ Speed Boost!'); }
      else { state.score++; showMsg(`+1 ${it.type.charAt(0).toUpperCase() + it.type.slice(1)}! Score: ${state.score}`); }
      emitParticles(it.mesh.position, it.type === 'boost' ? 0xffd700 : 0x44ff88, 10, 'sparkle');
      setTimeout(() => { it.collected = false; scene.add(it.mesh); }, 8000);
    }
  });

  // Boost timer
  if (state.boostTime > 0) {
    state.boostTime -= 0.016;
  }

  // Chase mouse
  const distToMouse = cat.position.distanceTo(chaseMouse.position);
  if (distToMouse < 1.2 && !chase.active) {
    chase.active = true; state.score += 3; showMsg(`🐭 Caught! +3 Score: ${state.score}`);
    emitParticles(chaseMouse.position, 0xff9999, 12, 'sparkle');
    setTimeout(() => { chase.active = false; const r = 8 + Math.random() * 20, th = Math.random() * Math.PI * 2; chaseMouse.position.set(Math.cos(th) * r, 0.12, Math.sin(th) * r); }, 2000);
  }
  if (!chase.active) {
    const runDir = chaseMouse.position.clone().sub(cat.position).normalize().multiplyScalar(0.035);
    chaseMouse.position.add(runDir);
    chaseMouse.position.x = Math.max(-40, Math.min(40, chaseMouse.position.x));
    chaseMouse.position.z = Math.max(-40, Math.min(40, chaseMouse.position.z));
    chaseMouse.rotation.y = Math.atan2(runDir.x, runDir.z);
  } else { chaseMouse.position.y = 0.5 + Math.sin(state.time * 10) * 0.3; chaseMouse.rotation.y += 0.2; }

  // Portal travel
  animatePortal(state.time);
  if (state.portalCooldown > 0) state.portalCooldown -= 0.016;
  if (state.portalMsgT > 0) state.portalMsgT -= 0.016;
  const portalDist = Math.hypot(cat.position.x - portal.position.x, cat.position.z - portal.position.z);
  if (portalDist < 1.6 && state.portalCooldown <= 0) {
    const need = PORTAL_COST * (state.worldIndex + 1);
    if (state.score >= need) {
      travelTo((state.worldIndex + 1) % WORLDS.length);
    } else if (state.portalMsgT <= 0) {
      showMsg(`🔒 Need ${need} score to enter the portal!`);
      state.portalMsgT = 2;
    }
  }

  updateParticles();

  // Health
  if (cat.position.y < -5) { state.health -= 20; cat.position.set(0, 0, 0); showMsg('💔 Ouch! Respawned'); }
  if (state.health <= 0) { state.health = 100; state.score = Math.max(0, state.score - 5); cat.position.set(0, 0, 0); showMsg('💀 Game Over! -5 Score'); }

  updateHUD();

  // Camera
  if (state.camMode === 'first') {
    cat.visible = false;
    camera.position.set(
      cat.position.x + Math.sin(cat.rotation.y) * 0.3,
      cat.position.y + 1.3,
      cat.position.z + Math.cos(cat.rotation.y) * 0.3
    );
    camera.lookAt(
      cat.position.x + Math.sin(cat.rotation.y) * 10,
      cat.position.y + 1.1,
      cat.position.z + Math.cos(cat.rotation.y) * 10
    );
  } else {
    cat.visible = true;
    if (state.camMode === 'third') {
      const cx = cat.position.x - Math.sin(cat.rotation.y + state.camAngle) * state.camR;
      const cz = cat.position.z - Math.cos(cat.rotation.y + state.camAngle) * state.camR;
      camera.position.x += (cx - camera.position.x) * 0.06;
      camera.position.z += (cz - camera.position.z) * 0.06;
      camera.position.y = state.camH + cat.position.y;
      camera.lookAt(cat.position.x, cat.position.y + 1.2, cat.position.z);
    } else {
      const cx = cat.position.x + Math.sin(state.time * 0.25) * 14;
      const cz = cat.position.z + Math.cos(state.time * 0.25) * 14;
      camera.position.x += (cx - camera.position.x) * 0.015;
      camera.position.z += (cz - camera.position.z) * 0.015;
      camera.position.y = 7 + cat.position.y;
      camera.lookAt(cat.position.x, cat.position.y + 1, cat.position.z);
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
animate();
