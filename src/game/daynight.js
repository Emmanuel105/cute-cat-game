// Slow day/night cycle: moves sun/moon, fades stars, tints sky and fog.
import * as THREE from 'three';
import { scene, sun, moon, hemi, ambient, skyMat, sunMesh, moonMesh, starsMat } from './scene.js';
import { state } from './state.js';
import { setTimeIndicator } from './ui.js';

export function updateDayNight() {
  state.dayTime = (state.dayTime + 0.000008) % 1;
  const dayTime = state.dayTime;
  const sunAngle = dayTime * Math.PI * 2;
  sun.position.set(Math.cos(sunAngle) * 25, Math.sin(sunAngle) * 25, 10);
  sunMesh.position.copy(sun.position).normalize().multiplyScalar(80);
  moon.position.set(Math.cos(sunAngle + Math.PI) * 25, Math.sin(sunAngle + Math.PI) * 25, 10);
  moonMesh.position.copy(moon.position).normalize().multiplyScalar(80);
  let skyColor, ambientInt, sunInt;
  if (dayTime < 0.2 || dayTime > 0.8) {
    skyColor = new THREE.Color(0x0a0a2e); ambientInt = 0.2; sunInt = 0;
    starsMat.opacity = Math.min(1, (dayTime < 0.2 ? 0.2 - dayTime : dayTime - 0.8) * 10);
    moon.intensity = 0.6; hemi.groundColor.setHex(0x111133);
  } else if (dayTime < 0.25 || dayTime > 0.75) {
    skyColor = new THREE.Color(0xff8844); ambientInt = 0.4; sunInt = 0.6;
    starsMat.opacity = 0; moon.intensity = 0.1; hemi.groundColor.setHex(0x5a3a1e);
  } else {
    skyColor = new THREE.Color(0x87CEEB); ambientInt = 0.55; sunInt = 1.3;
    starsMat.opacity = 0; moon.intensity = 0; hemi.groundColor.setHex(0x2d5a1e);
  }
  scene.background = skyColor; scene.fog.color = skyColor; skyMat.color = skyColor;
  ambient.intensity = ambientInt; sun.intensity = sunInt;
  setTimeIndicator(dayTime < 0.2 || dayTime > 0.8 ? '🌙 Night' : dayTime < 0.25 || dayTime > 0.75 ? '🌅 Twilight' : '☀️ Day');
}
