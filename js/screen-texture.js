// js/screen-texture.js

import { THREE } from './viewer.js';

// Finds the material named "Screen" and applies a canvas (or <img>) as both base & emissive.
// cover + equal X/Y scale + auto Y-flip (so it isn’t upside-down).
export async function applyCanvasToScreen(root, source, { bright = true } = {}) {
  const sceneOrModel = root.scene || root; // allow passing gltf or scene
  const screenMat = sceneOrModel?.traverse
    ? findMaterial(sceneOrModel, 'Screen')
    : null;

  if (!screenMat) throw new Error('Screen material not found in model');

  const tex = source instanceof HTMLCanvasElement
    ? new THREE.CanvasTexture(source)
    : new THREE.Texture(source);

  // keep pixels sharp-ish and correct orientation
  tex.flipY = false;
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;

  // Force base to white so image shows true colors
  if (screenMat.pbrMetallicRoughness?.setBaseColorFactor) {
    screenMat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,1]);
  } else if ('color' in screenMat) {
    screenMat.color.set(0xffffff);
  }

  // Base-color slot (KhronosMaterialsExtension)
  const bc = screenMat.pbrMetallicRoughness?.baseColorTexture;
  if (bc?.setTexture) bc.setTexture(tex);
  if (screenMat.setBaseColorTexture) screenMat.setBaseColorTexture(tex);

  // Emissive
  if (bright) {
    if (screenMat.emissiveTexture?.setTexture) screenMat.emissiveTexture.setTexture(tex);
    if (screenMat.setEmissiveTexture) screenMat.setEmissiveTexture(tex);

    if (screenMat.setEmissiveFactor) screenMat.setEmissiveFactor([1,1,1]);
    else if ('emissive' in screenMat) screenMat.emissive.setRGB(1,1,1);
  } else {
    if (screenMat.setEmissiveFactor) screenMat.setEmissiveFactor([0,0,0]);
    else if ('emissive' in screenMat) screenMat.emissive.setRGB(0,0,0);
  }
}

function findMaterial(root, name) {
  let out = null;
  root.traverse((obj) => {
    if (out) return;
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      out = mats.find(m => m.name === name) || out;
    }
  });
  return out;
}
