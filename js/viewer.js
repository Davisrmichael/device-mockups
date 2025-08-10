import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

export async function createViewer({ modelUrl, canvas }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, preserveDrawingBuffer:true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(720, 720, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 3.2);
  scene.add(camera);

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
  scene.add(light);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.rotateSpeed = 0.6;
  controls.reset();
  controls.update();

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(modelUrl);
  const root = gltf.scene || gltf.scenes[0];
  scene.add(root);

  frameObject(camera, root, controls);

  function frameObject(cam, obj, ctrls){
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    obj.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cam.fov * (Math.PI/180);
    let dist = (maxDim*0.62) / Math.tan(fov/2);
    dist = Math.max(dist, 1.6);
    cam.position.set(0, 0.02, dist);
    cam.lookAt(0,0,0);
    cam.updateProjectionMatrix();
    if (ctrls) { ctrls.target.set(0,0,0); ctrls.update(); }
  }

  function renderOnce(){
    controls.update();
    renderer.render(scene, camera);
  }
  renderOnce();

  function findMaterialByName(name){
    let found = null;
    root.traverse(o => {
      if (o.isMesh && o.material) {
        const m = o.material;
        if (Array.isArray(m)) {
          m.forEach(mm => { if (!found && mm.name === name) found=mm; });
        } else {
          if (m.name === name) found = m;
        }
      }
    });
    return found;
  }

  return { renderer, scene, camera, controls, root, renderOnce, findMaterialByName };
}
