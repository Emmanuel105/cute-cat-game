// Keyboard, mouse, and skin-picker input handling.
import * as THREE from 'three';
import { keys, state } from './state.js';
import { canvas } from './scene.js';
import { cat, setSkin } from './cat.js';
import { emitParticles } from './particles.js';
import { startGame, toggleCam } from './ui.js';

export function setupInput() {
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') keys.w = true;
    if (k === 'a' || k === 'arrowleft') keys.a = true;
    if (k === 's' || k === 'arrowdown') keys.s = true;
    if (k === 'd' || k === 'arrowright') keys.d = true;
    if (e.key === 'Shift') keys.shift = true;
    if (e.code === 'Space') {
      if (!keys.space && !state.isJump && state.onGround && state.gameStarted) {
        state.isJump = true; state.jumpT = 0; state.onGround = false;
        emitParticles(cat.position.clone().add(new THREE.Vector3(0, 0.1, 0)), 0xdddddd, 6, 'jump');
      }
      keys.space = true;
    }
    if (k === 'c' && state.gameStarted) toggleCam();
    if (!state.gameStarted && (k === 'w' || k === 'a' || k === 's' || k === 'd' || k === ' ')) startGame();
  });

  window.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') keys.w = false;
    if (k === 'a' || k === 'arrowleft') keys.a = false;
    if (k === 's' || k === 'arrowdown') keys.s = false;
    if (k === 'd' || k === 'arrowright') keys.d = false;
    if (e.key === 'Shift') keys.shift = false;
    if (e.code === 'Space') keys.space = false;
  });

  canvas.addEventListener('mousedown', e => { state.isDrag = true; state.prevMX = e.clientX; });
  window.addEventListener('mouseup', () => state.isDrag = false);
  window.addEventListener('mousemove', e => {
    if (state.isDrag && state.gameStarted) { state.camAngle -= (e.clientX - state.prevMX) * 0.008; state.prevMX = e.clientX; }
  });
  canvas.addEventListener('wheel', e => { if (state.gameStarted) state.camR = Math.max(3, Math.min(16, state.camR + e.deltaY * 0.01)); });

  document.querySelectorAll('.skin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.skin-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setSkin(btn.dataset.s);
    });
  });

  document.getElementById('cam-btn').addEventListener('click', toggleCam);
  document.getElementById('start-btn').addEventListener('click', startGame);
}
