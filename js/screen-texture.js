// Needs THREE to build textures; we accept it from the viewer so we don't import bare 'three'.
export function makeScreenTextureManager(THREE, getScreenMaterial) {
  if (!THREE) throw new Error('THREE not provided.');

  let lastTexture = null;

  function setTexture(mat, tex, { bright }) {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = true; // GLTF screens are commonly upside-down UV
    tex.needsUpdate = true;

    // apply to base color and emissive
    mat.map = tex;
    mat.needsUpdate = true;

    if (bright) {
      mat.emissive = new THREE.Color(0xffffff);
      mat.emissiveIntensity = 1.0;
      mat.emissiveMap = tex;
    } else {
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0;
      mat.emissiveMap = null;
    }
  }

  async function applyFileToMaterial(file, { bright = true } = {}) {
    const mat = getScreenMaterial();
    if (!mat) throw new Error('Screen material not found in model.');

    const bmp = await createImageBitmap(file, { colorSpaceConversion: 'default' });
    // Keep aspect by covering a square via canvas drawImage center-crop
    const size = 2048; // large enough for retina results
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    // cover logic
    const iw = bmp.width, ih = bmp.height;
    const s = Math.max(size / iw, size / ih);
    const dw = iw * s, dh = ih * s;
    const dx = (size - dw) / 2;
    const dy = (size - dh) / 2;
    ctx.clearRect(0,0,size,size);
    ctx.drawImage(bmp, dx, dy, dw, dh);

    if (lastTexture) lastTexture.dispose();
    const tex = new THREE.CanvasTexture(c);
    lastTexture = tex;

    setTexture(mat, tex, { bright });
  }

  function clear() {
    const mat = getScreenMaterial();
    if (!mat) return;
    if (lastTexture) { lastTexture.dispose(); lastTexture = null; }
    mat.map = null;
    mat.emissiveMap = null;
    mat.needsUpdate = true;
  }

  return { applyFileToMaterial, clear };
}
