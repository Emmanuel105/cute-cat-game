// Central mutable game state shared across modules.
export const keys = { w: false, a: false, s: false, d: false, shift: false, space: false };

export const state = {
  speed: 0,
  health: 100,
  energy: 100,
  boostTime: 0,
  score: 0,
  isJump: false,
  jumpT: 0,
  onGround: true,
  time: 0,
  blinkT: 0,
  nextBlink: 2 + Math.random() * 4,
  earT: 0,
  nextEar: 1 + Math.random() * 3,
  camMode: 'third',
  camAngle: 0,
  camH: 4,
  camR: 7,
  isDrag: false,
  prevMX: 0,
  dayTime: 0.25,
  gameStarted: false,
};
