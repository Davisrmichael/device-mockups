import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export function makeScreenTextureManager(getMaterial) {
  // Reusable canvas for consistent uploads
  const CANVAS_SIZE = 1024; // square for best mip results
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d');

  function drawCover(img) {
    const cw = CANVAS_SIZE, ch = CANVAS_SIZE;
    ctx.clearRect(0, 0, cw, ch);

    // auto Y-flip so it appears upright in glTF UV space
    ctx.save();
    ctx.translate(0, ch);
    ctx.scale(1, -1);

    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;

    // cover (equal scale)
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  function toTexture() {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.flipY = false; // we already flipped in canvas
    return tex;
  }

  function applyTextureToMaterial(mat, tex, { bright = true } = {}) {
    // Standard material (glTF → MeshStandardMaterial)
    if ('map' in mat) mat.map = tex;

    // Give emissive brightness if requested
    if (bright && 'emissive' in mat) {
      mat.emissiveMap = tex;
      mat.emissive = new THREE.Color(0xffffff);
      mat.emissiveIntensity = 1.0;
    } else if ('emissiveMap' in mat) {
      mat.emissiveMap = null;
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 1.0;
    }

    // Lower metal / raise rough for a soft, matte screen look
    if ('metalness' in mat) mat.metalness = 0.0;
    if ('roughness' in mat) mat.roughness = 0.9;

    mat.needsUpdate = true;
  }

  async function fileToImage(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      return img;
    } finally {
      // let GC collect later; immediate revoke can race on Safari
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  return {
    async applyFileToMaterial(file, { bright = true } = {}) {
      const mat = getMaterial();
      if (!mat) throw new Error('Screen material not found in model.');

      const img = await fileToImage(file);
      drawCover(img);
      const tex = toTexture();
      applyTextureToMaterial(mat, tex, { bright });
    },

    clear() {
      const mat = getMaterial();
      if (!mat) return;
      if ('map' in mat && mat.map) { mat.map.dispose(); mat.map = null; }
      if ('emissiveMap' in mat && mat.emissiveMap) { mat.emissiveMap.dispose(); mat.emissiveMap = null; }
      if ('emissive' in mat) mat.emissive.set(0x000000);
      mat.needsUpdate = true;
    }
  };
}
