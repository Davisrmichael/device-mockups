// js/screen-texture.js
import * as THREE from 'https://esm.sh/three@0.160.0';

async function loadImageBitmap(file) {
  // Use createImageBitmap when available; fallback to HTMLImageElement if needed
  if ('createImageBitmap' in window) {
    return await createImageBitmap(file);
  }
  const img = document.createElement('img');
  img.crossOrigin = 'anonymous';
  img.src = URL.createObjectURL(file);
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  c.getContext('2d').drawImage(img, 0, 0);
  const bmp = await createImageBitmap(c);
  URL.revokeObjectURL(img.src);
  return bmp;
}

function makeTextureFromBitmap(bmp) {
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
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
    return mat;
    // Note: mat is a MeshStandardMaterial coming from glTF.
  }

  function applyTextureToMaterial(tex, { bright = true } = {}) {
    const mat = getTargetMaterialOrThrow();
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
      if (lastTexture) { lastTexture.dispose?.(); lastTexture = null; }

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
