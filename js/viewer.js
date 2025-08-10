// js/viewer.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

export async function createViewer(container, {
  modelUrl,
  startYawDeg = 180,
  enableControls = true
} = {}) {
  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true, // so export can read pixels
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const w = container.clientWidth || 720;
  const h = container.clientHeight || 720;
  renderer.setSize(w, h, false);
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Scene + Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
  camera.position.set(0, 0, 2.2);

  // Lights (make sure we add the *light*, not the position!)
  const amb = new THREE.AmbientLight(0xffffff, 0.30);
  scene.add(amb);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 0.40);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(1.5, 2.0, 3.0);
  scene.add(dir);

  // Controls
  let controls = null;
  if (enableControls) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    controls.update();
  }

  // Load model
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(modelUrl);
  const root = gltf.scene || gltf.scenes?.[0];
  if (!root) throw new Error('GLTF has no scene');

  // Spin 180° to match your desired start
  root.rotation.y = THREE.MathUtils.degToRad(startYawDeg);
  scene.add(root);

  // Helpers
  function render() {
    renderer.render(scene, camera);
  }

  function resize() {
    const W = container.clientWidth || w;
    const H = container.clientHeight || h;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    render();
  }
  window.addEventListener('resize', resize);

  // Find a material by name inside the loaded model
  function findMaterialByName(name) {
    let found = null;
    root.traverse(obj => {
      if (found) return;
      if (obj.isMesh && obj.material) {
        if (Array.isArray(obj.material)) {
          found = obj.material.find(m => m && m.name === name) || null;
        } else if (obj.material.name === name) {
          found = obj.material;
        }
      }
    });
    return found;
  }

  // Initial frame
  render();

  return {
    renderer, scene, camera, root, controls,
    render, findMaterialByName,
  };
}
