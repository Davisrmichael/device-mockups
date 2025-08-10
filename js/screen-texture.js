// js/screen-texture.js
import * as THREE from 'three';

export function makeScreenTextureManager(findMatByName){
  let lastTex = null;

  function getScreenMat(){
    const m = findMatByName('Screen');
    if(!m) throw new Error('Screen material not found');
    return m;
  }

  function makeTextureFromImage(img){
    const tex = img instanceof HTMLCanvasElement ? new THREE.CanvasTexture(img) : new THREE.Texture(img);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false;        // GLTF expects +Y up, our data is already correct after onload
    tex.needsUpdate = true;
    return tex;
  }

  async function loadImageFromFile(file){
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((ok, err)=>{
        const im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = ()=> ok(im);
        im.onerror = ()=> err(new Error('Could not read image'));
        im.src = url;
      });
      return img;
    } finally {
      // don’t revoke immediately; some browsers upload to GPU lazily
      setTimeout(()=> URL.revokeObjectURL(url), 5000);
    }
  }

  async function applyFileToMaterial(file, {bright=true} = {}){
    const mat = getScreenMat();
    const img = await loadImageFromFile(file);

    // No warp: let the model’s UVs do the mapping 1:1
    const tex = makeTextureFromImage(img);

    // Base color
    mat.map = tex;
    if (mat.color) mat.color.set(0xffffff);

    // Emissive
    if (bright){
      mat.emissiveMap = tex;
      if (mat.emissive) mat.emissive.setRGB(1,1,1);
      mat.emissiveIntensity = 1;
    } else {
      mat.emissiveMap = null;
      if (mat.emissive) mat.emissive.setRGB(0,0,0);
      mat.emissiveIntensity = 0;
    }

    mat.needsUpdate = true;
    lastTex = tex;
  }

  function clear(){
    const mat = getScreenMat();
    mat.map = null;
    mat.emissiveMap = null;
    if (mat.emissive) mat.emissive.setRGB(0,0,0);
    mat.emissiveIntensity = 0;
    mat.needsUpdate = true;
    lastTex = null;
  }

  return { applyFileToMaterial, clear };
}
