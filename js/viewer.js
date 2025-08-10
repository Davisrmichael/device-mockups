// js/viewer.js
// ESM via CDN — works on GitHub Pages without bundling.
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

/**
 * Create a 720×720 Three.js viewer.
 * @param {HTMLElement} container - Where to append the canvas.
 * @param {{modelUrl: string, startYawDeg?: number, enableControls?: boolean}} opts
 * @returns {Promise<{
 *   scene: THREE.Scene,
 *   camera: THREE.PerspectiveCamera,
 *   renderer: THREE.WebGLRenderer,
 *   controls?: OrbitControls,
 *   model?: THREE.Object3D,
 *   findMaterialByName(name: string): THREE.Material | null,
 *   setSize(w: number, h: number): void,
 *   getCanvas(): HTMLCanvasElement,
 *   render(): void,
 *   dispose(): void
 * }>}
 */
export async function createViewer(container, opts) {
  if (!container) throw new Error('Viewer container element not found');

  const width = 720;
  const height = 720;

  // Scene & renderer
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Camera
  const camera = new THREE.PerspectiveCamera(35, width / height, 0.01, 100);
  camera.position.set(0, 0.1, 2.2);

  // Lights (soft, neutral)
  const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 0.85);
  const dir = new THREE.DirectionalLight(0xffffff, 0.75);
  dir.position.set(3, 4, 5);
  scene.add(hemi, dir);

  // Controls
  let controls;
  if (opts?.enableControls) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 0.8;
    controls.panSpeed = 0.8;
  }

  // Canvas in the container
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Loader
  const loader = new GLTFLoader();
  let model;

  if (opts?.modelUrl) {
    const gltf = await loader.loadAsync(opts.modelUrl);
    model = gltf.scene || gltf.scenes?.[0];
    if (!model) throw new Error('Model has no scene');

    // Initial orientation — rotate 180° around Y
    const yaw = (opts.startYawDeg ?? 180) * Math.PI / 180;
    model.rotation.y = yaw;

    // Fit camera to object
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

    // Recenter controls target / camera look
    if (ctrls) ctrls.target.copy(center);
    cam.lookAt(center);

    // Compute distance from FOV
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cam.fov * (Math.PI / 180);
    let dist = (maxDim / 2) / Math.tan(fov / 2);
    dist *= frame;

    const dir = new THREE.Vector3()
      .subVectors(cam.position, center)
      .normalize();

    // Put camera along its current direction at required distance
    cam.position.copy(center).addScaledVector(dir, dist);
    cam.near = dist / 100;
    cam.far = dist * 100;
    cam.updateProjectionMatrix();
  }

  function render() {
    controls?.update();
    renderer.render(scene, camera);
  }

  // Render loop (simple; you can integrate your own raf elsewhere)
  let rafId = 0;
  const tick = () => {
    render();
    rafId = requestAnimationFrame(tick);
  };
  tick();

  // Public helpers
  function findMaterialByName(name) {
    let found = null;
    if (!model) return null;
    model.traverse((obj) => {
      if (found) return;
      const mat = obj.material;
      if (Array.isArray(mat)) {
        for (const m of mat) {
          if (m?.name === name) { found = m; break; }
        }
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

  function getCanvas() {
    return renderer.domElement;
  }

  function dispose() {
    cancelAnimationFrame(rafId);
    controls?.dispose();
    renderer.dispose();
    // (Optional) traverse and dispose geometry/materials if you reload models often
  }

  // Initial render
  render();

  return {
    scene,
    camera,
    renderer,
    controls,
    model,
    findMaterialByName,
    setSize,
    getCanvas,
    render,
    dispose
  };
}
