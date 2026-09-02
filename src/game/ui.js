// HUD, start screen, camera-mode button, and popup messages.
import { state } from './state.js';

export function showMsg(txt) {
  const el = document.getElementById('msg');
  el.textContent = txt; el.style.opacity = '1';
  setTimeout(() => el.style.opacity = '0', 1200);
}

export function startGame() {
  if (state.gameStarted) return;
  state.gameStarted = true;
  document.getElementById('start-screen').style.opacity = '0';
  setTimeout(() => { document.getElementById('start-screen').style.display = 'none'; }, 500);
  document.getElementById('hud').style.display = 'block';
  document.getElementById('hud-right').style.display = 'flex';
  document.getElementById('skin-panel').style.display = 'flex';
  document.getElementById('mode-toggle').style.display = 'block';
}

export function toggleCam() {
  if (state.camMode === 'third') { state.camMode = 'first'; document.getElementById('cam-btn').textContent = '👁️ 1st Person'; document.getElementById('crosshair').style.opacity = '1'; }
  else if (state.camMode === 'first') { state.camMode = 'cinematic'; document.getElementById('cam-btn').textContent = '🎬 Cinematic'; document.getElementById('crosshair').style.opacity = '0'; }
  else { state.camMode = 'third'; document.getElementById('cam-btn').textContent = '🎥 3rd Person'; document.getElementById('crosshair').style.opacity = '0'; }
}

export function updateHUD() {
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem('ccg-highscore', String(state.highScore));
  }
  document.getElementById('highscore-val').textContent = state.highScore;
  document.getElementById('score-val').textContent = state.score;
  document.getElementById('health-bar').style.width = state.health + '%';
  document.getElementById('energy-bar').style.width = Math.min(100, state.energy) + '%';
  const bb = document.getElementById('boost-box');
  if (state.boostTime > 0) { bb.style.opacity = '1'; document.getElementById('boost-bar').style.width = (state.boostTime / 3 * 100) + '%'; }
  else { bb.style.opacity = '0'; }
}

export function setTimeIndicator(text) {
  document.getElementById('time-ind').textContent = text;
}

export function setWorldLabel(text) {
  document.getElementById('world-ind').textContent = text;
}
