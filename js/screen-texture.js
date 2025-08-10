// js/screen-texture.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// Utility: read a File -> ImageBitmap
async function loadImageBitmap(file) {
  // Create ImageBitmap for fast upload; Firefox needs no options; Chrome OK
  return await createImageBitmap(file);
}

// Utility: draw the image onto a canvas 1:1 (no stretch), then turn into a Three texture.
// We keep it simple: we upload the bitmap as-is and rely on the model's UVs to place it.
// If you later want "cover/contain" + offsets, we can add a compositing canvas here.
function makeTextureFromBitmap(bmp) {
  // Create canvas the same size as source
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width;
  canvas.height = bmp.height;

  const ctx = canvas.getContext('2d');
  // Draw normally (no mirroring). For glTF, Three expects user textures with flipY=false.
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;             // sRGB for UI images
  texture.flipY = false;                                 // glTF convention
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;

  return texture;
}

export function makeScreenTextureManager(getMaterial) {
  let lastTexture = null;

  function getTargetMaterialOrThrow() {
    const mat = getMaterial?.();
    if (!mat) throw new Error('Material "Screen" not found in model.');
    if (!('isMaterial' in mat)) throw new Error('Target is not a material.');
    return mat;
  }

  function applyTextureToMaterial(tex, { bright = true } = {}) {
    const mat = getTargetMaterialOrThrow();

    // MeshStandardMaterial expected for glTF (Principled BSDF)
    // Apply as base color (map) and optional emissive (for brightness)
    mat.map = tex;
    mat.needsUpdate = true;

    if (bright) {
      mat.emissive = new THREE.Color(0xffffff);
      mat.emissiveIntensity = 1.0;
      mat.emissiveMap = tex;
    } else {
      mat.emissiveMap = null;
      mat.emissiveIntensity = 0.0;
    }
  }

  return {
    async applyFileToMaterial(file, { bright = true } = {}) {
      if (!file) throw new Error('No file selected.');
      // Clean up previous texture (optional)
      if (lastTexture) {
        lastTexture.dispose?.();
        lastTexture = null;
      }

      const bmp = await loadImageBitmap(file);
      const tex = makeTextureFromBitmap(bmp);
      lastTexture = tex;

      applyTextureToMaterial(tex, { bright });
    },

    clear() {
      const mat = getTargetMaterialOrThrow();
      if (mat.map) { mat.map.dispose?.(); mat.map = null; }
      if (mat.emissiveMap) { mat.emissiveMap.dispose?.(); mat.emissiveMap = null; }
      mat.emissiveIntensity = 0.0;
      mat.needsUpdate = true;
    }
  };
}
