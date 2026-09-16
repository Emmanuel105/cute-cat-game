// ============================================================================
// TOON OUTLINE — the scene is drawn into an offscreen buffer, then one
// full-screen pass inks every silhouette it can find in the depth buffer.
// Doing it here rather than with a second, inflated copy of every mesh keeps
// the ink line the same price no matter how much world there is to draw.
// ============================================================================
const OUTLINE_VS = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const OUTLINE_FS = `
#include <packing>
uniform sampler2D tDiffuse;
uniform highp sampler2D tDepth;
uniform vec2 uTexel;
uniform float uNear;
uniform float uFar;
uniform float uStrength;
uniform float uBias;
uniform float uFadeNear;
uniform float uFadeFar;
uniform vec3 uColor;
varying vec2 vUv;

/** Distance from the camera in metres for the pixel at uv. */
float viewDepth(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  return -perspectiveDepthToViewZ(d, uNear, uFar);
}
/** Inverse depth. Across any flat surface, however steeply it leans away, this is linear in screen space. */
float invDepth(vec2 uv) { return 1.0 / max(0.02, viewDepth(uv)); }

void main() {
  vec4 base = texture2D(tDiffuse, vUv);
  vec2 o = uTexel;                               // exactly one texel: half-texel offsets alias into stripes
  float c = viewDepth(vUv);
  float wc = invDepth(vUv);
  float wl = invDepth(vUv - vec2(o.x, 0.0)), wr = invDepth(vUv + vec2(o.x, 0.0));
  float wu = invDepth(vUv + vec2(0.0, o.y)), wd = invDepth(vUv - vec2(0.0, o.y));
  // Curvature of inverse depth: exactly zero on a plane at any angle, large at a silhouette.
  // Dividing by the pixel's own inverse depth makes the test the same at every distance.
  float curve = abs(wl + wr - 2.0 * wc) + abs(wu + wd - 2.0 * wc);
  float edge = smoothstep(uBias, uBias * 2.6, curve / max(wc, 1.0 / uFadeFar));
  // The depth buffer gets coarse a long way out; stop inking before the noise there turns into scribble.
  edge *= 1.0 - smoothstep(uFadeNear, uFadeFar, c);
  gl_FragColor = vec4(mix(base.rgb, uColor, edge * uStrength), 1.0);
  #include <colorspace_fragment>
}
`;

class ToonOutline {
  constructor(renderer, o = {}) {
    this.renderer = renderer;
    this.enabled = true;
    this.uniforms = {
      tDiffuse: { value: null }, tDepth: { value: null },
      uTexel: { value: new THREE.Vector2(0.001, 0.001) },
      uNear: { value: 0.2 }, uFar: { value: 700 },
      uColor: { value: new THREE.Color(o.color ?? 0x241a2e) },
      uStrength: { value: o.strength ?? 1.0 },
      uBias: { value: o.bias ?? 0.035 },
      uFadeNear: { value: o.fadeNear ?? 90 },
      uFadeFar: { value: o.fadeFar ?? 170 },
    };
    this.material = new THREE.ShaderMaterial({ uniforms: this.uniforms, vertexShader: OUTLINE_VS, fragmentShader: OUTLINE_FS, depthTest: false, depthWrite: false });
    this.material.toneMapped = false;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    this.scene.add(quad);
    this.target = null;
    this.setSize();
  }
  setSize() {
    const dpr = this.renderer.getPixelRatio ? this.renderer.getPixelRatio() : 1;
    const w = max(2, floor(window.innerWidth * dpr)), h = max(2, floor(window.innerHeight * dpr));
    if (this.target) { this.target.depthTexture?.dispose(); this.target.dispose(); }
    // A 24-bit integer depth buffer quantises badly at this near/far ratio, and the terraces it leaves
    // on smooth ground come out of the edge filter as long straight lines. Float depth has none of that.
    const depth = new THREE.DepthTexture(w, h);
    depth.type = THREE.FloatType; depth.minFilter = depth.magFilter = THREE.NearestFilter;
    this.target = new THREE.WebGLRenderTarget(w, h, { samples: 4, depthBuffer: true, stencilBuffer: false, depthTexture: depth });
    this.uniforms.tDiffuse.value = this.target.texture;
    this.uniforms.tDepth.value = depth;
    this.uniforms.uTexel.value.set(1 / w, 1 / h);
  }
  render(scene, camera) {
    const r = this.renderer;
    if (!this.enabled) { r.setRenderTarget(null); r.render(scene, camera); return; }
    this.uniforms.uNear.value = camera.near;
    this.uniforms.uFar.value = camera.far;
    r.setRenderTarget(this.target);
    r.render(scene, camera);
    r.setRenderTarget(null);
    r.render(this.scene, this.camera);
  }
}
