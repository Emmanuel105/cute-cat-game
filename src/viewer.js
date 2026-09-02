import * as THREE from 'three';

document.getElementById('loading').style.display = 'none';

const container = document.getElementById('game-container');
const canvas = document.getElementById('cat-canvas');
const msg = document.getElementById('jump-msg');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 4, 10);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffd700, 1.2);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

const spotLight = new THREE.SpotLight(0xff69b4, 0.8);
spotLight.position.set(-5, 8, -5);
spotLight.lookAt(0, 0, 0);
scene.add(spotLight);

// Ground
const groundGeo = new THREE.PlaneGeometry(50, 50);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x2d2d44, roughness: 0.8 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Grid helper
const grid = new THREE.GridHelper(50, 50, 0x444466, 0x333355);
scene.add(grid);

// Cat group
const cat = new THREE.Group();

const furColor = 0xffa500;
const whiteColor = 0xffffff;
const pinkColor = 0xff69b4;

// Body
const bodyGeo = new THREE.CapsuleGeometry(0.7, 1.2, 4, 8);
const bodyMat = new THREE.MeshStandardMaterial({ color: furColor, roughness: 0.6 });
const body = new THREE.Mesh(bodyGeo, bodyMat);
body.position.y = 1.2;
body.rotation.z = Math.PI / 2;
body.castShadow = true;
cat.add(body);

// Belly (white patch)
const bellyGeo = new THREE.CapsuleGeometry(0.55, 1.0, 4, 8);
const bellyMat = new THREE.MeshStandardMaterial({ color: whiteColor, roughness: 0.6 });
const belly = new THREE.Mesh(bellyGeo, bellyMat);
belly.position.set(0.12, 1.2, 0);
belly.rotation.z = Math.PI / 2;
cat.add(belly);

// Head
const headGeo = new THREE.SphereGeometry(0.65, 16, 16);
const headMat = new THREE.MeshStandardMaterial({ color: furColor, roughness: 0.5 });
const head = new THREE.Mesh(headGeo, headMat);
head.position.set(1.1, 1.8, 0);
head.castShadow = true;
cat.add(head);

// Snout area
const snoutGeo = new THREE.SphereGeometry(0.35, 12, 12);
const snoutMat = new THREE.MeshStandardMaterial({ color: whiteColor, roughness: 0.5 });
const snout = new THREE.Mesh(snoutGeo, snoutMat);
snout.position.set(1.5, 1.7, 0);
snout.scale.set(1, 0.8, 1);
cat.add(snout);

// Nose
const noseGeo = new THREE.SphereGeometry(0.08, 8, 8);
const noseMat = new THREE.MeshStandardMaterial({ color: pinkColor, roughness: 0.3 });
const nose = new THREE.Mesh(noseGeo, noseMat);
nose.position.set(1.75, 1.75, 0);
cat.add(nose);

// Eyes
const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.5 });
const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
eyeL.position.set(1.5, 1.95, 0.25);
cat.add(eyeL);
const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
eyeR.position.set(1.5, 1.95, -0.25);
cat.add(eyeR);

// Eye shine
const shineGeo = new THREE.SphereGeometry(0.03, 6, 6);
const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const shineL = new THREE.Mesh(shineGeo, shineMat);
shineL.position.set(1.55, 2.0, 0.28);
cat.add(shineL);
const shineR = new THREE.Mesh(shineGeo, shineMat);
shineR.position.set(1.55, 2.0, -0.22);
cat.add(shineR);

// Ears
const earGeo = new THREE.ConeGeometry(0.2, 0.5, 4);
const earMat = new THREE.MeshStandardMaterial({ color: furColor, roughness: 0.5 });
const earL = new THREE.Mesh(earGeo, earMat);
earL.position.set(1.0, 2.4, 0.3);
earL.rotation.z = -0.3;
earL.rotation.x = 0.2;
earL.castShadow = true;
cat.add(earL);
const earR = new THREE.Mesh(earGeo, earMat);
earR.position.set(1.0, 2.4, -0.3);
earR.rotation.z = -0.3;
earR.rotation.x = -0.2;
earR.castShadow = true;
cat.add(earR);

// Inner ears
const innerEarGeo = new THREE.ConeGeometry(0.12, 0.35, 4);
const innerEarMat = new THREE.MeshStandardMaterial({ color: pinkColor, roughness: 0.4 });
const innerEarL = new THREE.Mesh(innerEarGeo, innerEarMat);
innerEarL.position.set(1.05, 2.35, 0.3);
innerEarL.rotation.z = -0.3;
innerEarL.rotation.x = 0.2;
cat.add(innerEarL);
const innerEarR = new THREE.Mesh(innerEarGeo, innerEarMat);
innerEarR.position.set(1.05, 2.35, -0.3);
innerEarR.rotation.z = -0.3;
innerEarR.rotation.x = -0.2;
cat.add(innerEarR);

// Legs
const legGeo = new THREE.CapsuleGeometry(0.15, 0.6, 4, 8);
const legMat = new THREE.MeshStandardMaterial({ color: furColor, roughness: 0.6 });

const legFL = new THREE.Mesh(legGeo, legMat);
legFL.position.set(0.6, 0.4, 0.35);
legFL.castShadow = true;
cat.add(legFL);

const legFR = new THREE.Mesh(legGeo, legMat);
legFR.position.set(0.6, 0.4, -0.35);
legFR.castShadow = true;
cat.add(legFR);

const legBL = new THREE.Mesh(legGeo, legMat);
legBL.position.set(-0.6, 0.4, 0.35);
legBL.castShadow = true;
cat.add(legBL);

const legBR = new THREE.Mesh(legGeo, legMat);
legBR.position.set(-0.6, 0.4, -0.35);
legBR.castShadow = true;
cat.add(legBR);

// Paws (white)
const pawGeo = new THREE.SphereGeometry(0.18, 8, 8);
const pawMat = new THREE.MeshStandardMaterial({ color: whiteColor, roughness: 0.5 });
const pawFL = new THREE.Mesh(pawGeo, pawMat);
pawFL.position.set(0.6, 0.08, 0.35);
cat.add(pawFL);
const pawFR = new THREE.Mesh(pawGeo, pawMat);
pawFR.position.set(0.6, 0.08, -0.35);
cat.add(pawFR);
const pawBL = new THREE.Mesh(pawGeo, pawMat);
pawBL.position.set(-0.6, 0.08, 0.35);
cat.add(pawBL);
const pawBR = new THREE.Mesh(pawGeo, pawMat);
pawBR.position.set(-0.6, 0.08, -0.35);
cat.add(pawBR);

// Tail
const tailCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.7, 1.4, 0),
  new THREE.Vector3(-1.2, 1.8, 0),
  new THREE.Vector3(-1.5, 2.2, 0.2),
  new THREE.Vector3(-1.3, 2.6, 0)
]);
const tailGeo = new THREE.TubeGeometry(tailCurve, 20, 0.12, 8, false);
const tailMat = new THREE.MeshStandardMaterial({ color: furColor, roughness: 0.5 });
const tail = new THREE.Mesh(tailGeo, tailMat);
tail.castShadow = true;
cat.add(tail);

// Tail tip (white)
const tailTipGeo = new THREE.SphereGeometry(0.15, 8, 8);
const tailTipMat = new THREE.MeshStandardMaterial({ color: whiteColor, roughness: 0.5 });
const tailTip = new THREE.Mesh(tailTipGeo, tailTipMat);
tailTip.position.set(-1.3, 2.6, 0);
cat.add(tailTip);

// Whiskers
const whiskerMat = new THREE.LineBasicMaterial({ color: 0xdddddd });
for (let i = -1; i <= 1; i++) {
  const ptsL = [new THREE.Vector3(1.7, 1.7, 0.1 * i), new THREE.Vector3(2.1, 1.75 + i * 0.05, 0.2 * i + 0.15)];
  const geoL = new THREE.BufferGeometry().setFromPoints(ptsL);
  cat.add(new THREE.Line(geoL, whiskerMat));

  const ptsR = [new THREE.Vector3(1.7, 1.7, 0.1 * i), new THREE.Vector3(2.1, 1.75 + i * 0.05, 0.2 * i - 0.15)];
  const geoR = new THREE.BufferGeometry().setFromPoints(ptsR);
  cat.add(new THREE.Line(geoR, whiskerMat));
}

scene.add(cat);

// Floating fish collectible
const fishGroup = new THREE.Group();
const fishBodyGeo = new THREE.SphereGeometry(0.3, 12, 12);
const fishBodyMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb, emissive: 0x0044aa, emissiveIntensity: 0.3 });
const fishBody = new THREE.Mesh(fishBodyGeo, fishBodyMat);
fishBody.scale.set(1.5, 0.8, 0.6);
fishGroup.add(fishBody);

const tailFinGeo = new THREE.ConeGeometry(0.15, 0.3, 3);
const tailFin = new THREE.Mesh(tailFinGeo, fishBodyMat);
tailFin.position.set(-0.4, 0, 0);
tailFin.rotation.z = Math.PI / 2;
fishGroup.add(tailFin);

fishGroup.position.set(3, 1.5, 2);
scene.add(fishGroup);

// Yarn ball
const yarnGeo = new THREE.IcosahedronGeometry(0.4, 2);
const yarnMat = new THREE.MeshStandardMaterial({ color: 0xff3366, wireframe: true });
const yarn = new THREE.Mesh(yarnGeo, yarnMat);
yarn.position.set(-2, 0.4, 2);
yarn.castShadow = true;
scene.add(yarn);

// Mouse toy
const mouseGeo = new THREE.SphereGeometry(0.2, 8, 8);
const mouseMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
const mouse = new THREE.Mesh(mouseGeo, mouseMat);
mouse.position.set(2, 0.2, -2);
mouse.scale.set(1.2, 0.8, 0.9);
scene.add(mouse);
const mouseEarGeo = new THREE.ConeGeometry(0.08, 0.15, 4);
const mouseEarMat = new THREE.MeshStandardMaterial({ color: 0xffaaaa });
const mouseEarL = new THREE.Mesh(mouseEarGeo, mouseEarMat);
mouseEarL.position.set(0.15, 0.2, 0.08);
mouse.add(mouseEarL);
const mouseEarR = new THREE.Mesh(mouseEarGeo, mouseEarMat);
mouseEarR.position.set(0.15, 0.2, -0.08);
mouse.add(mouseEarR);

// Animation state
let time = 0;
let isJumping = false;
let jumpTime = 0;

// Mouse interaction
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
let cameraAngle = 0;
let cameraHeight = 4;
let cameraRadius = 10;

canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  previousMouseX = e.clientX;
  previousMouseY = e.clientY;

  const rect = canvas.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(cat.children, true);
  if (intersects.length > 0 && !isJumping) {
    isJumping = true;
    jumpTime = 0;
    msg.style.opacity = '1';
    setTimeout(() => { msg.style.opacity = '0'; }, 800);
  }
});

window.addEventListener('mouseup', () => { isDragging = false; });
window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const deltaX = e.clientX - previousMouseX;
    const deltaY = e.clientY - previousMouseY;
    cameraAngle -= deltaX * 0.01;
    cameraHeight = Math.max(2, Math.min(10, cameraHeight - deltaY * 0.02));
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
  }
});

canvas.addEventListener('wheel', (e) => {
  cameraRadius = Math.max(5, Math.min(20, cameraRadius + e.deltaY * 0.01));
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  time += 0.02;

  fishGroup.position.y = 1.5 + Math.sin(time * 2) * 0.3;
  fishGroup.rotation.y = time;

  yarn.rotation.x = time * 0.5;
  yarn.rotation.y = time * 0.3;

  mouse.position.x = 2 + Math.sin(time * 0.7) * 0.3;
  mouse.position.z = -2 + Math.cos(time * 0.5) * 0.3;

  if (!isJumping) {
    cat.position.y = Math.sin(time * 2) * 0.05;
    tail.rotation.z = Math.sin(time * 3) * 0.15;
    tailTip.position.x = -1.3 + Math.sin(time * 3) * 0.1;
    tailTip.position.y = 2.6 + Math.cos(time * 3) * 0.05;
  } else {
    jumpTime += 0.05;
    const jumpHeight = Math.sin(jumpTime * Math.PI) * 1.5;
    cat.position.y = Math.max(0, jumpHeight);
    cat.rotation.x = -Math.sin(jumpTime * Math.PI) * 0.3;
    if (jumpTime >= 1) {
      isJumping = false;
      cat.position.y = 0;
      cat.rotation.x = 0;
    }
  }

  camera.position.x = Math.sin(cameraAngle) * cameraRadius;
  camera.position.z = Math.cos(cameraAngle) * cameraRadius;
  camera.position.y = cameraHeight;
  camera.lookAt(0, 1, 0);

  renderer.render(scene, camera);
}

animate();
