// Pure ES-module CDN imports (works on GitHub Pages)
import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';

export async function createViewer(container, {
  modelUrl,
  startYawDeg = 0,
  enableControls = true
} = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xECEFF2);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0.35, 0.25, 0.9);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // 720×720 viewer
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(container);

  // Lights
  const amb = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(amb);
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(2, 3, 4);
  scene.add(dir);

  // Load model
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(modelUrl);
  const model = gltf.scene;
  model.rotation.y = THREE.MathUtils.degToRad(startYawDeg);
  scene.add(model);

  // Controls
  let controls = null;
  if (enableControls) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.12, 0);
  }

  // Render loop
  function tick() {
    controls?.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  // Helper: find material by name anywhere in model
  function findMaterialByName(name) {
    let hit = null;
    model.traverse(o => {
      if (hit) return;
      if (o.isMesh && o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (m.name === name) { hit = m; break; }
        }
      }
    });
    return hit;
  }

  return {
    scene, camera, renderer, controls, model,
    findMaterialByName
  };
}
