// The cat: skins, body construction, and animatable parts.
import * as THREE from 'three';

export const SKINS = {
  orange: { fur: 0xffa500, belly: 0xffeebb, nose: 0xff69b4, innerEar: 0xffaaaa, paws: 0xffffff },
  black: { fur: 0x222222, belly: 0x333333, nose: 0xff69b4, innerEar: 0x444444, paws: 0x222222 },
  white: { fur: 0xf5f5f5, belly: 0xffffff, nose: 0xff9999, innerEar: 0xffcccc, paws: 0xffffff },
  brown: { fur: 0x8B4513, belly: 0xcd853f, nose: 0xff69b4, innerEar: 0xd2691e, paws: 0xffffff },
  tuxedo: { fur: 0x222222, belly: 0xffffff, nose: 0xff69b4, innerEar: 0xffaaaa, paws: 0xffffff }
};

let skin = SKINS.orange;
export const cat = new THREE.Group();
export const parts = {};

export function setSkin(name) {
  skin = SKINS[name];
  buildCat();
}

export function buildCat() {
  while (cat.children.length) cat.remove(cat.children[0]);
  parts.eyelids = []; parts.tailSegs = [];
  const furM = new THREE.MeshStandardMaterial({ color: skin.fur, roughness: 0.5 });
  const bellyM = new THREE.MeshStandardMaterial({ color: skin.belly, roughness: 0.5 });
  const noseM = new THREE.MeshStandardMaterial({ color: skin.nose, roughness: 0.3 });
  const innerM = new THREE.MeshStandardMaterial({ color: skin.innerEar, roughness: 0.4 });
  const pawM = new THREE.MeshStandardMaterial({ color: skin.paws, roughness: 0.5 });
  const whiskM = new THREE.LineBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.7 });

  // Body — chubby round capsule
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 1.0, 4, 10), furM);
  body.position.y = 0.9;
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  cat.add(body);
  parts.body = body;

  // Belly patch
  const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.9, 4, 10), bellyM);
  belly.position.set(0, 0.9, 0.06);
  belly.rotation.x = Math.PI / 2;
  cat.add(belly);

  // HEAD — big and round (chibi proportions)
  const headG = new THREE.Group();
  headG.position.set(0, 1.35, 0.75);
  cat.add(headG);
  parts.headG = headG;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 20), furM);
  head.castShadow = true;
  headG.add(head);

  // Snout — small cute bump
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), new THREE.MeshStandardMaterial({ color: skin.belly, roughness: 0.5 }));
  snout.position.set(0, -0.08, 0.48);
  snout.scale.set(1.1, 0.8, 0.9);
  headG.add(snout);

  // Nose — tiny pink triangle
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.05, 3), noseM);
  nose.position.set(0, -0.02, 0.58);
  nose.rotation.x = Math.PI / 2;
  headG.add(nose);

  // Mouth — tiny smile
  const mouthCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.06, -0.1, 0.55),
    new THREE.Vector3(0, -0.13, 0.57),
    new THREE.Vector3(0.06, -0.1, 0.55)
  );
  const mouthPts = mouthCurve.getPoints(10);
  headG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(mouthPts), new THREE.LineBasicMaterial({ color: 0x333333 })));

  // EYES — large, round, cute
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.1, metalness: 0.3 });

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), eyeWhiteMat);
  eyeL.position.set(0.2, 0.1, 0.45);
  eyeL.scale.set(1, 1.15, 0.6); // flatten slightly into face
  headG.add(eyeL);
  const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), pupilMat);
  pupilL.position.set(0.2, 0.1, 0.52);
  headG.add(pupilL);
  const shineL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  shineL.position.set(0.23, 0.14, 0.55);
  headG.add(shineL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), eyeWhiteMat);
  eyeR.position.set(-0.2, 0.1, 0.45);
  eyeR.scale.set(1, 1.15, 0.6);
  headG.add(eyeR);
  const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), pupilMat);
  pupilR.position.set(-0.2, 0.1, 0.52);
  headG.add(pupilR);
  const shineR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  shineR.position.set(-0.17, 0.14, 0.55);
  headG.add(shineR);

  // Eyelids (for blinking)
  const eyelidGeo = new THREE.SphereGeometry(0.15, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const eyelidL = new THREE.Mesh(eyelidGeo, furM);
  eyelidL.position.set(0.2, 0.1, 0.45);
  eyelidL.rotation.x = -Math.PI / 2;
  eyelidL.scale.set(1, 0, 1);
  headG.add(eyelidL);
  parts.eyelids.push(eyelidL);
  const eyelidR = new THREE.Mesh(eyelidGeo, furM);
  eyelidR.position.set(-0.2, 0.1, 0.45);
  eyelidR.rotation.x = -Math.PI / 2;
  eyelidR.scale.set(1, 0, 1);
  headG.add(eyelidR);
  parts.eyelids.push(eyelidR);

  // Ears — round triangles, soft
  const earGeo = new THREE.ConeGeometry(0.18, 0.35, 4);
  const earL = new THREE.Mesh(earGeo, furM);
  earL.position.set(0.28, 0.52, -0.02);
  earL.rotation.z = -0.3;
  earL.rotation.y = 0.1;
  earL.castShadow = true;
  headG.add(earL);
  parts.earL = earL;
  const earR = new THREE.Mesh(earGeo, furM);
  earR.position.set(-0.28, 0.52, -0.02);
  earR.rotation.z = 0.3;
  earR.rotation.y = -0.1;
  earR.castShadow = true;
  headG.add(earR);
  parts.earR = earR;

  // Inner ears
  const iEarGeo = new THREE.ConeGeometry(0.1, 0.22, 4);
  const iEarL = new THREE.Mesh(iEarGeo, innerM);
  iEarL.position.set(0.28, 0.48, 0.02);
  iEarL.rotation.z = -0.3;
  iEarL.rotation.y = 0.1;
  headG.add(iEarL);
  const iEarR = new THREE.Mesh(iEarGeo, innerM);
  iEarR.position.set(-0.28, 0.48, 0.02);
  iEarR.rotation.z = 0.3;
  iEarR.rotation.y = -0.1;
  headG.add(iEarR);

  // Whiskers
  for (let i = -1; i <= 1; i++) {
    const pL = [new THREE.Vector3(0.05 * i, -0.06, 0.5), new THREE.Vector3(0.12 * i + 0.1, -0.02 + i * 0.02, 0.75)];
    headG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pL), whiskM));
    const pR = [new THREE.Vector3(0.05 * i, -0.06, 0.5), new THREE.Vector3(0.12 * i - 0.1, -0.02 + i * 0.02, 0.75)];
    headG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pR), whiskM));
  }

  // Legs — short and stubby (cute)
  function leg(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0.5, z);
    const up = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.3, 4, 8), furM);
    up.position.y = 0.15; up.castShadow = true; g.add(up);
    const low = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.25, 4, 8), furM);
    low.position.y = -0.12; low.castShadow = true; g.add(low);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), pawM);
    paw.position.y = -0.32; paw.scale.set(1.05, 0.65, 1.1); g.add(paw);
    cat.add(g);
    return g;
  }
  parts.legFL = leg(0.24, 0.38);
  parts.legFR = leg(-0.24, 0.38);
  parts.legBL = leg(0.24, -0.38);
  parts.legBR = leg(-0.24, -0.38);

  // Tail — fluffy, curved up
  for (let i = 0; i < 8; i++) {
    const sg = new THREE.SphereGeometry(0.1 - i * 0.008, 8, 8);
    const sm = new THREE.MeshStandardMaterial({ color: i > 6 ? skin.paws : skin.fur, roughness: 0.5 });
    const seg = new THREE.Mesh(sg, sm);
    seg.position.set(Math.sin(i * 0.3) * 0.08, 1.0 + i * 0.15, -0.5 - i * 0.12);
    seg.castShadow = true;
    cat.add(seg);
    parts.tailSegs.push(seg);
  }
}

buildCat();
