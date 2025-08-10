export async function drawExport(viewerCanvas, state, overlay){
  // Compose export on an offscreen 720×720 canvas
  const out = document.createElement('canvas');
  out.width = out.height = 720;
  const ctx = out.getContext('2d');

  // 1) Background
  const bg = state.bg;
  if(bg.type==='solid'){
    ctx.fillStyle = bg.colorA;
    ctx.fillRect(0,0,720,720);
  }else if(bg.type==='gradient-linear'){
    const ang = (bg.angle||0)*Math.PI/180;
    const cx=360, cy=360;
    const r=500;
    const x0 = cx - Math.cos(ang)*r, y0 = cy - Math.sin(ang)*r;
    const x1 = cx + Math.cos(ang)*r, y1 = cy + Math.sin(ang)*r;
    const g = ctx.createLinearGradient(x0,y0,x1,y1);
    g.addColorStop(0, bg.colorA); g.addColorStop(1, bg.colorB);
    ctx.fillStyle=g; ctx.fillRect(0,0,720,720);
  }else if(bg.type==='gradient-radial'){
    const r = Math.max(10, (bg.radius||0.8)*720/2);
    const g = ctx.createRadialGradient(360,360,0, 360,360,r);
    g.addColorStop(0, bg.colorA); g.addColorStop(1, bg.colorB);
    ctx.fillStyle=g; ctx.fillRect(0,0,720,720);
  }else if(bg.type==='image' && bg.image){
    drawCover(ctx, bg.image, 0,0,720,720);
  }else{
    ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,720,720);
  }

  // 2) 3D layer (already 720×720)
  ctx.drawImage(viewerCanvas, 0,0);

  // 3) Overlays
  // text
  if(overlay.text.value){
    ctx.fillStyle = overlay.text.color || '#111';
    ctx.textAlign = overlay.text.align || 'left';
    ctx.textBaseline = 'bottom';
    ctx.font = `${overlay.text.size||28}px ${overlay.text.font||'Inter, system-ui'}`;
    const margin = 40;
    const maxWidth = 720 - margin*2;
    const lines = wrap(ctx, overlay.text.value, maxWidth);
    const lineH = (overlay.text.size||28)*(overlay.text.line||1.2);
    let x = margin, y = 720 - margin;
    if(overlay.text.align==='center') x = 360;
    if(overlay.text.align==='right') x = 720 - margin;
    lines.reverse().forEach((ln,i)=>{
      ctx.fillText(ln, x, y - i*lineH, maxWidth);
    });
  }

  // logo
  if(overlay.logo.visible && overlay.logo.src){
    const img = await loadImage(overlay.logo.src);
    // place relative to chosen corner / center
    const pad = overlay.logo.padPx || 24;
    let x=0,y=0;
    const w = overlay.logo.widthPx || Math.min(288, img.width);
    const h = img.height * (w/img.width);
    const pos = overlay.logo.posCode || 'br';
    if(pos==='tl'){ x=pad; y=pad; }
    if(pos==='tm'){ x=360 - w/2; y=pad; }
    if(pos==='tr'){ x=720 - pad - w; y=pad; }
    if(pos==='bl'){ x=pad; y=720 - pad - h; }
    if(pos==='bm'){ x=360 - w/2; y=720 - pad - h; }
    if(pos==='br'){ x=720 - pad - w; y=720 - pad - h; }
    ctx.drawImage(img, x,y,w,h);
  }

  return out.toDataURL('image/png');

  function wrap(ctx, text, maxWidth){
    const words = (text||'').split(/\s+/);
    const lines=[]; let line='';
    words.forEach(w=>{
      const test = line ? line + ' ' + w : w;
      if(ctx.measureText(test).width > maxWidth){
        if(line) lines.push(line);
        line = w;
      }else{
        line = test;
      }
    });
    if(line) lines.push(line);
    return lines;
  }

  function drawCover(ctx, img, dx,dy,dw,dh){
    const rImg = img.width/img.height;
    const rDst = dw/dh;
    let sx=0,sy=0,sw=img.width,sh=img.height;
    if(rImg>rDst){ // crop sides
      sh = img.height;
      sw = sh*rDst;
      sx = (img.width - sw)/2;
    }else{ // crop top/bottom
      sw = img.width;
      sh = sw/rDst;
      sy = (img.height - sh)/2;
    }
    ctx.drawImage(img, sx,sy,sw,sh, dx,dy,dw,dh);
  }

  function loadImage(url){
    return new Promise((res,rej)=>{
      const img=new Image(); img.crossOrigin='anonymous'; img.onload=()=>res(img); img.onerror=rej; img.src=url;
    });
  }
}
