// js/viewer.js  — CDN-only, ESM-safe, works on GitHub Pages

import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';

export { THREE }; // let other modules reuse THREE if they want

export function createViewer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(720, 720);

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 2.2);
  scene.add(camera);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.target.set(0, 0, 0);

  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(2, 3, 4);
  scene.add(light, new THREE.AmbientLight(0xffffff, 0.35));

  function render() {
    controls.update();
    renderer.render(scene, camera);
  }

  function resize() {
    const s = 720; // fixed square viewport
    renderer.setSize(s, s, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
    render();
  }
  window.addEventListener('resize', resize);

  function animate() {
    requestAnimationFrame(animate);
    render();
  }
  animate();

  return { THREE, scene, camera, renderer, controls, render, resize };
}

export async function loadGLTF(url, scene) {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => {
      scene.add(gltf.scene);
      resolve(gltf);
    }, undefined, reject);
  });
}
