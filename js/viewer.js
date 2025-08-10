// Import THREE and helpers from esm.sh with explicit URLs.
// IMPORTANT: these URLs **must** be used so no file ever imports 'three' bare.
import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three-stdlib@2.29.6/controls/OrbitControls?external=three';
import { GLTFLoader } from 'https://esm.sh/three-stdlib@2.29.6/loaders/GLTFLoader?external=three';

export async function createViewer(containerEl, {
  modelUrl,
  startYawDeg = 0,
  enableControls = true
} = {}) {
  if (!containerEl) throw new Error('Viewer container element missing.');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.8, 2.1);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(containerEl.clientWidth, containerEl.clientHeight, false);
  containerEl.innerHTML = '';
  containerEl.appendChild(renderer.domElement);

  // Simple, bright light rig
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb0b0b0, 0.7);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(3, 3, 4);
  scene.add(dir);

  let controls = null;
  if (enableControls) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 1.2;
    controls.maxDistance = 5;
    controls.enablePan = false;
  }

  // Resize observer
  const ro = new ResizeObserver(() => {
    const w = containerEl.clientWidth;
    const h = containerEl.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  });
  ro.observe(containerEl);

  // Load model
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(modelUrl);
  const root = gltf.scene || gltf.scenes[0];
  if (!root) throw new Error('GLTF scene missing.');
  scene.add(root);

  // rotate model
  root.rotation.y = THREE.MathUtils.degToRad(startYawDeg);

  // Find material by name helper
  function findMaterialByName(name) {
    let found = null;
    root.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        const mat = obj.material;
        if (Array.isArray(mat)) {
          for (const m of mat) if (m.name === name) { found = m; break; }
        } else {
          if (mat.name === name) found = mat;
        }
      }
    });
    return found;
  }

  // Render loop
  function render() {
    if (controls) controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  render();

  return {
    THREE,
    scene,
    camera,
    renderer,
    controls,
    findMaterialByName
  };
}
