// js/viewer.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function createViewer(container, {
  modelUrl,
  startYawDeg = 180,
  enableControls = true
} = {}) {
  const canvas = /** @type {HTMLCanvasElement} */(document.getElementById('view'));
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(720, 720, false);

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 2.2);
  scene.add(camera);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.target.set(0, 0, 0);
  controls.enabled = !!enableControls;

  // Light
  scene.add(new THREE.DirectionalLight(0xffffff, 1.0).position.set(2,3,4));
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  function render(){ controls.update(); renderer.render(scene, camera); }
  function resize(){ renderer.setSize(720, 720, false); camera.aspect = 1; camera.updateProjectionMatrix(); render(); }
  window.addEventListener('resize', resize);

  const loader = new GLTFLoader();
  loader.setCrossOrigin('anonymous');

  const gltf = await new Promise((res, rej)=>{
    loader.load(modelUrl, res, undefined, rej);
  });

  scene.add(gltf.scene);
  // spin 180° so front faces camera
  gltf.scene.rotation.y = THREE.MathUtils.degToRad(startYawDeg);

  render();

  return {
    three: THREE,
    renderer, scene, camera, controls, gltf, render,
    findMaterialByName(name){
      let out = null;
      gltf.scene.traverse(obj=>{
        if (out || !obj.isMesh) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        out = mats?.find(m=>m && m.name === name) || out;
      });
      return out;
    }
  };
}
