// Renderer, camera, lights, and sky.
import * as THREE from 'three';

export const canvas = document.getElementById('c');

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 40, 140);

export const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 300);
camera.position.set(0, 5, 10);

export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Lights
export const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

export const sun = new THREE.DirectionalLight(0xfffaed, 1.4);
sun.position.set(15, 25, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
const d = 40;
sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 80;
scene.add(sun);

export const moon = new THREE.DirectionalLight(0x8899ff, 0.3);
moon.position.set(-15, 20, -10);
scene.add(moon);

export const hemi = new THREE.HemisphereLight(0x87CEEB, 0x2d5a1e, 0.5);
scene.add(hemi);

// Sky dome
const skyGeo = new THREE.SphereGeometry(120, 32, 32);
export const skyMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide });
scene.add(new THREE.Mesh(skyGeo, skyMat));

export const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffdd44 }));
sunMesh.position.copy(sun.position).normalize().multiplyScalar(80);
scene.add(sunMesh);

export const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), new THREE.MeshBasicMaterial({ color: 0xddddff }));
moonMesh.position.copy(moon.position).normalize().multiplyScalar(80);
scene.add(moonMesh);

// Stars (visible at night)
const starsGeo = new THREE.BufferGeometry();
const starPos = [];
for (let i = 0; i < 800; i++) {
  const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(90);
  starPos.push(v.x, v.y, v.z);
}
starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
export const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, transparent: true, opacity: 0 });
scene.add(new THREE.Points(starsGeo, starsMat));
