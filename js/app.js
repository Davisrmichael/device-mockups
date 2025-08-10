import { createViewer } from './viewer.js';
import { makeScreenTextureManager } from './screen-texture.js';
import { drawExport } from './export-viewport.js';
import { updateOverlay, getOverlayState } from './overlays.js';

// ----- DOM -----
const el = (id)=>document.getElementById(id);
const msg = el('msg');
const canvas = el('viewerCanvas');
const overlayText = el('textLayer');
const overlayLogo = el('logoLayer');

// Model path in your repo
const MODEL_URL = 'iPhone-15-pro-2/iPhone-15.gltf';

let viewer, screenMgr;
const state = {
  device:{ x:0, y:0, rx:0, ry:180 }, // ry starts at 180°
  bg:{ type:'solid', colorA:'#e9edf3', colorB:'#ffffff', angle:135, radius:0.8, image:null, imageFit:'cover' },
  logo:{ enabled:false, image:null, size:28, pos:'br', pad:24 },
  text:{ value:'', font:'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', size:28, line:1.2, align:'left', color:'#111111' }
};

// Init viewer
(async function init(){
  try{
    viewer = await createViewer(canvas, { modelUrl: MODEL_URL });
  }catch(e){
    console.error(e);
    msg.textContent = 'Failed to load model.';
    return;
  }
  viewer.setYawDeg(state.device.ry); // start spun around

  // screen manager
  screenMgr = makeScreenTextureManager(viewer);

  bindUI();
  renderBGPreview();
  updateOverlay(state, overlayText, overlayLogo);
})();

function bindUI(){
  // Device transforms
  el('devX').addEventListener('input', e=>{ state.device.x = +e.target.value; viewer.setDeviceOffset(state.device.x, state.device.y); });
  el('devY').addEventListener('input', e=>{ state.device.y = +e.target.value; viewer.setDeviceOffset(state.device.x, state.device.y); });
  el('rotX').addEventListener('input', e=>{ state.device.rx = +e.target.value; viewer.setDeviceEuler(state.device.rx, state.device.ry); });
  el('rotY').addEventListener('input', e=>{ state.device.ry = +e.target.value + 180; viewer.setDeviceEuler(state.device.rx, state.device.ry); });

  el('centerBtn').addEventListener('click', ()=>{
    state.device.x = 0; state.device.y = 0;
    el('devX').value=0; el('devY').value=0;
    viewer.setDeviceOffset(0,0);
  });
  el('resetBtn').addEventListener('click', ()=>{
    state.device.x=0; state.device.y=0; state.device.rx=0; state.device.ry=180;
    el('devX').value=0; el('devY').value=0; el('rotX').value=0; el('rotY').value=0;
    viewer.setDeviceOffset(0,0); viewer.setDeviceEuler(0,180);
  });
  el('randomBtn').addEventListener('click', ()=>{
    const r = (a,b)=> Math.round(a + Math.random()*(b-a));
    state.device.x = r(-200,200); state.device.y = r(-200,200);
    state.device.rx = r(-20,20); state.device.ry = 180 + r(-20,20);
    el('devX').value=state.device.x; el('devY').value=state.device.y;
    el('rotX').value=state.device.rx; el('rotY').value=state.device.ry-180;
    viewer.setDeviceOffset(state.device.x, state.device.y);
    viewer.setDeviceEuler(state.device.rx, state.device.ry);
  });

  // Screen
  el('screenFile').addEventListener('change', async e=>{
    const f = e.target.files[0]; if(!f) return;
    try{
      await screenMgr.applyImageFile(f, { emissive: el('emissive').checked });
      msg.textContent = 'Screen updated.';
    }catch(err){
      console.error(err);
      msg.textContent = 'Failed to apply image.';
    }
  });
  el('clearScreen').addEventListener('click', ()=>{
    screenMgr.clear();
  });

  // Background
  const bgType = el('bgType');
  const showRows = ()=>{
    const type = bgType.value;
    document.querySelectorAll('[data-bg]').forEach(n=>{
      const ok = n.getAttribute('data-bg').split(' ').includes(type);
      n.style.display = ok ? 'flex' : 'none';
    });
  };
  bgType.addEventListener('change', ()=>{ state.bg.type = bgType.value; showRows(); renderBGPreview(); });
  showRows();

  el('bgColorA').addEventListener('input', e=>{ state.bg.colorA=e.target.value; renderBGPreview(); });
  el('bgColorB').addEventListener('input', e=>{ state.bg.colorB=e.target.value; renderBGPreview(); });
  el('bgAngle').addEventListener('input', e=>{ state.bg.angle=+e.target.value; renderBGPreview(); });
  el('bgRadius').addEventListener('input', e=>{ state.bg.radius=(+e.target.value)/100; renderBGPreview(); });
  el('bgImage').addEventListener('change', async e=>{
    const f = e.target.files[0]; if(!f) return;
    const url = URL.createObjectURL(f);
    state.bg.image = await loadImage(url);
    renderBGPreview();
  });

  // Logo
  el('useLogo').addEventListener('change', e=>{ state.logo.enabled = e.target.checked; updateOverlay(state, overlayText, overlayLogo); });
  el('logoFile').addEventListener('change', async e=>{
    const f = e.target.files[0]; if(!f) return;
    const url = URL.createObjectURL(f);
    state.logo.image = await loadImage(url);
    state.logo.enabled = true; el('useLogo').checked = true;
    updateOverlay(state, overlayText, overlayLogo);
  });
  el('logoSize').addEventListener('input', e=>{ state.logo.size=+e.target.value; updateOverlay(state, overlayText, overlayLogo); });
  el('logoPos').addEventListener('change', e=>{ state.logo.pos=e.target.value; updateOverlay(state, overlayText, overlayLogo); });
  el('logoPad').addEventListener('input', e=>{ state.logo.pad=+e.target.value; updateOverlay(state, overlayText, overlayLogo); });

  // Text
  el('adText').addEventListener('input', e=>{ state.text.value=e.target.value; updateOverlay(state, overlayText, overlayLogo); });
  el('fontFamily').addEventListener('change', e=>{ state.text.font=e.target.value; updateOverlay(state, overlayText, overlayLogo); });
  el('fontSize').addEventListener('input', e=>{ state.text.size=+e.target.value; updateOverlay(state, overlayText, overlayLogo); });
  el('lineHeight').addEventListener('input', e=>{ state.text.line=+e.target.value; updateOverlay(state, overlayText, overlayLogo); });
  el('textAlign').addEventListener('change', e=>{ state.text.align=e.target.value; updateOverlay(state, overlayText, overlayLogo); });
  el('fontColor').addEventListener('input', e=>{ state.text.color=e.target.value; updateOverlay(state, overlayText, overlayLogo); });

  // Export
  el('export').addEventListener('click', async ()=>{
    try{
      const url = await drawExport(canvas, state, getOverlayState(overlayText, overlayLogo));
      const a=document.createElement('a'); a.href=url; a.download='mockup-720.png'; a.click();
    }catch(err){ console.error(err); msg.textContent='Export failed.'; }
  });
}

function renderBGPreview(){
  const wrap = document.getElementById('viewerWrap');
  const {type,colorA,colorB,angle,radius,image} = state.bg;
  if(type==='solid'){
    wrap.style.background = colorA;
  }else if(type==='gradient-linear'){
    wrap.style.background = `linear-gradient(${angle}deg, ${colorA}, ${colorB})`;
  }else if(type==='gradient-radial'){
    wrap.style.background = `radial-gradient(circle at 50% 50%, ${colorA} 0%, ${colorB} ${Math.round(radius*100)}%)`;
  }else if(type==='image'){
    if(image){
      // Use an object URL style by drawing image as background via CSS is tricky; for preview, draw to a CSS canvas fallback:
      wrap.style.background = '#000'; // neutral; final export uses canvas
      // No-op: preview stays neutral; export will include image perfectly.
    }else{
      wrap.style.background = '#ddd';
    }
  }
}

function loadImage(url){
  return new Promise((res,rej)=>{
    const img=new Image(); img.crossOrigin='anonymous';
    img.onload=()=>res(img); img.onerror=rej; img.src=url;
  });
}
