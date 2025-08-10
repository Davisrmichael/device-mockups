// js/viewer.js
// Use esm.sh so all internal imports are fully-resolved URLs (no bundler needed).
import * as THREE from 'https://esm.sh/three@0.160.0';
import { GLTFLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

/**
 * Create a 720×720 Three.js viewer.
 */
export async function createViewer(container, opts) {
  if (!container) throw new Error('Viewer container element not found');

  const width = 720, height = 720;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const camera = new THREE.PerspectiveCamera(35, width / height, 0.01, 100);
  camera.position.set(0, 0.1, 2.2);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 0.85);
  const dir = new THREE.DirectionalLight(0xffffff, 0.75);
  dir.position.set(3, 4, 5);
  scene.add(hemi, dir);

  let controls;
  if (opts?.enableControls) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
  }

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const loader = new GLTFLoader();
  let model;

  if (opts?.modelUrl) {
    const gltf = await loader.loadAsync(opts.modelUrl);
    model = gltf.scene || gltf.scenes?.[0];
    if (!model) throw new Error('Model has no scene');

    const yaw = (opts.startYawDeg ?? 180) * Math.PI / 180;
    model.rotation.y = yaw;

    fitCameraToObject(camera, model, 1.2, controls);
    scene.add(model);
  }

  function fitCameraToObject(cam, object, frame = 1.2, ctrls) {
    const box = new THREE.Box3().setFromObject(object);
    if (!isFinite(box.min.x) || !isFinite(box.max.x)) return;

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    if (ctrls) ctrls.target.copy(center);
    cam.lookAt(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cam.fov * (Math.PI / 180);
    let dist = (maxDim / 2) / Math.tan(fov / 2);
    dist *= frame;

    const dir = new THREE.Vector3().subVectors(cam.position, center).normalize();
    cam.position.copy(center).addScaledVector(dir, dist);
    cam.near = dist / 100;
    cam.far = dist * 100;
    cam.updateProjectionMatrix();
  }

  function render() {
    controls?.update();
    renderer.render(scene, camera);
  }

  let rafId = 0;
  const tick = () => { render(); rafId = requestAnimationFrame(tick); };
  tick();

  function findMaterialByName(name) {
    let found = null;
    if (!model) return null;
    model.traverse(obj => {
      if (found) return;
      const mat = obj.material;
      if (Array.isArray(mat)) {
        for (const m of mat) { if (m?.name === name) { found = m; break; } }
      } else if (mat?.name === name) {
        found = mat;
      }
    });
    return found;
  }

  function setSize(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  }

  function getCanvas() { return renderer.domElement; }
  function dispose() { cancelAnimationFrame(rafId); controls?.dispose(); renderer.dispose(); }

  render();

  return { scene, camera, renderer, controls, model, findMaterialByName, setSize, getCanvas, render, dispose };
}
