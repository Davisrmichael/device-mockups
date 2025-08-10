// Three.js via ESM CDN (works on GitHub Pages)
import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';

export async function createViewer(canvas, { modelUrl }){
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, preserveDrawingBuffer:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(720,720, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 6);
  scene.add(camera);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.0);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(2, 4, 3);
  scene.add(dir);

  const controls = new OrbitControls(camera, canvas.parentElement);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.rotateSpeed = 0.4;

  const loader = new GLTFLoader();
  const root = new THREE.Group();
  scene.add(root);

  const gltf = await loader.loadAsync(modelUrl);
  const model = gltf.scene;
  root.add(model);

  // Fit model
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3(); const center = new THREE.Vector3();
  box.getSize(size); box.getCenter(center);
  model.position.sub(center);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2.6 / maxDim; // slightly conservative fit
  model.scale.setScalar(scale);

  // Helpers to find Screen material
  const findMaterialByName = (name)=>{
    let hit=null;
    model.traverse(obj=>{
      if(obj.isMesh && obj.material){
        const m = obj.material;
        if(Array.isArray(m)){
          m.forEach(mm=>{ if(mm.name===name) hit=mm; });
        }else if(m.name===name){ hit=m; }
      }
    });
    return hit;
  };

  // Device transforms
  function setDeviceEuler(rxDeg, ryDeg){
    root.rotation.x = THREE.MathUtils.degToRad(rxDeg);
    root.rotation.y = THREE.MathUtils.degToRad(ryDeg);
  }
  function setYawDeg(deg){ setDeviceEuler(root.rotation.x*180/Math.PI, deg); }
  function setDeviceOffset(px, py){
    // move group in camera/view space by shifting camera slightly and target
    camera.position.x = px/120;
    camera.position.y = -py/120;
    controls.target.set(0,0,0);
    camera.lookAt(0,0,0);
  }

  // Render loop
  function tick(){
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  return {
    renderer, scene, camera, model,
    findMaterialByName,
    setDeviceEuler, setYawDeg, setDeviceOffset
  };
}
