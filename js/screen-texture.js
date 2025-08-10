import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const MAX_EDGE = 2048;

async function fileToImageBitmap(file) {
  const img = await createImageBitmap(file);
  const w = img.width, h = img.height;
  const long = Math.max(w,h);
  if (long <= MAX_EDGE) return img;
  const scale = MAX_EDGE / long;
  const cw = Math.round(w*scale), ch = Math.round(h*scale);
  const c = new OffscreenCanvas(cw, ch);
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0, cw, ch);
  return await createImageBitmap(c);
}

export function makeScreenTextureManager(getMaterial){
  function clearTex(mat){
    if (!mat) return;
    ['map','emissiveMap'].forEach(k => {
      if (mat[k]) { mat[k].dispose(); mat[k] = null; }
    });
    mat.needsUpdate = true;
  }

  return {
    clear(){ clearTex(getMaterial()); },
    async applyFileToMaterial(file, { bright } = { bright:true }){
      const mat = getMaterial();
      if (!mat) throw new Error('Screen material not found in model.');
      clearTex(mat);
      const bmp = await fileToImageBitmap(file);
      const tex = new THREE.Texture(bmp);
      tex.flipY = false;
      tex.needsUpdate = true;
      tex.colorSpace = THREE.SRGBColorSpace;

      mat.map = tex;
      mat.emissive = new THREE.Color(bright ? 0xffffff : 0x000000);
      mat.emissiveMap = bright ? tex : null;
      mat.needsUpdate = true;
    }
  };
}
