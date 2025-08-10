import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export function makeScreenTextureManager(viewer){
  let lastTex=null;

  async function applyImageFile(file, { emissive=true } = {}){
    const imgURL = URL.createObjectURL(file);
    const img = await loadImage(imgURL);

    // Draw to square canvas with "cover" fit and Y flip for GLTF
    const size = 1024;
    const can = document.createElement('canvas'); can.width=can.height=size;
    const ctx = can.getContext('2d');

    // cover fit
    const rImg = img.width/img.height;
    const rCan = 1;
    let dw=size, dh=size, sx=0, sy=0, sw=img.width, sh=img.height;
    if(rImg>rCan){
      // image wider -> crop sides
      sh = img.height;
      sw = sh * rCan;
      sx = (img.width - sw)/2;
    }else{
      // image taller -> crop top/bottom
      sw = img.width;
      sh = sw / rCan;
      sy = (img.height - sh)/2;
    }

    // draw flipped vertically (GLTF UV vs canvas)
    ctx.save();
    ctx.translate(0, size);
    ctx.scale(1,-1);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
    ctx.restore();

    const tex = new THREE.CanvasTexture(can);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false;
    tex.needsUpdate = true;

    const mat = viewer.findMaterialByName('Screen');
    if(!mat) throw new Error('Material "Screen" not found in model.');

    mat.map = tex;
    mat.map.needsUpdate = true;
    if(emissive){
      mat.emissive = new THREE.Color(0xffffff);
      mat.emissiveMap = tex;
      mat.emissiveIntensity = 1.0;
    }
    mat.needsUpdate = true;

    if(lastTex && lastTex.dispose) lastTex.dispose();
    lastTex = tex;
  }

  function clear(){
    const mat = viewer.findMaterialByName('Screen');
    if(!mat) return;
    if(mat.map){ mat.map.dispose(); mat.map = null; }
    mat.emissiveMap = null;
    mat.emissiveIntensity = 0.0;
    mat.needsUpdate = true;
  }

  function loadImage(url){
    return new Promise((res,rej)=>{
      const img=new Image(); img.crossOrigin='anonymous'; img.onload=()=>res(img); img.onerror=rej; img.src=url;
    });
  }

  return { applyImageFile, clear };
}
