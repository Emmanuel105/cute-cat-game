/* ============================================================================
   DIMENSION CAT — a four-world third-person cat adventure in a single file.
   Engine: three.js r160 (loaded from a CDN with fallbacks). Every texture,
   sound and model is generated procedurally at runtime — no external assets.
   ============================================================================ */
'use strict';

const $ = (id) => document.getElementById(id);
const statusEl = $('status');

// ---------------------------------------------------------------- load three
const THREE_SOURCES = [
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
  'https://unpkg.com/three@0.160.0/build/three.module.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js',
];
let THREE = null;
for (const src of THREE_SOURCES) {
  try { THREE = await import(src); break; }
  catch (err) { console.warn('[DimensionCat] engine source unavailable:', src, err); }
}
if (!THREE) {
  statusEl.textContent = 'Could not load the 3D engine. Check your internet connection and reload.';
  statusEl.classList.add('err');
  throw new Error('three.js failed to load');
}
statusEl.textContent = '';
