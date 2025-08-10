export function updateOverlay(state, textEl, logoEl){
  // Text
  textEl.textContent = state.text.value || '';
  textEl.style.fontFamily = state.text.font;
  textEl.style.fontSize = state.text.size + 'px';
  textEl.style.lineHeight = state.text.line;
  textEl.style.color = state.text.color;
  textEl.style.textAlign = state.text.align;

  // Logo (DOM preview)
  if(state.logo.enabled && state.logo.image){
    logoEl.style.display = 'block';
    const px = state.logo.pad;
    const perc = state.logo.size; // relative width % cap
    logoEl.src = state.logo.image.src;
    logoEl.style.width = (perc/100*720) + 'px';
    const pos = place(state.logo.pos, px);
    logoEl.style.left = pos.left; logoEl.style.right = pos.right;
    logoEl.style.top = pos.top; logoEl.style.bottom = pos.bottom;
  }else{
    logoEl.style.display = 'none';
    logoEl.removeAttribute('src');
  }
}

export function getOverlayState(textEl, logoEl){
  return {
    text:{
      value: textEl.textContent || '',
      font: textEl.style.fontFamily,
      size: parseFloat(textEl.style.fontSize) || 28,
      line: parseFloat(textEl.style.lineHeight) || 1.2,
      align: textEl.style.textAlign || 'left',
      color: textEl.style.color || '#111111'
    },
    logo:{
      visible: logoEl.style.display !== 'none',
      src: logoEl.src || null,
      x: logoEl.style.left || null,
      y: logoEl.style.top || null,
      right: logoEl.style.right || null,
      bottom: logoEl.style.bottom || null,
      widthPx: parseFloat(logoEl.style.width)||0,
      posCode: logoEl.dataset.pos || null,
      padPx: parseFloat(logoEl.dataset.pad||'24')||24
    }
  };
}

function place(code, pad){
  const px = pad+'px';
  const mid = 'calc(50% - var(--half, 0px))';
  const at = (top,left,bottom,right)=>({top,left,bottom,right});
  let pos;
  switch(code){
    case 'tl': pos=at(px,px,'auto','auto'); break;
    case 'tm': pos=at(px,mid,'auto','auto'); break;
    case 'tr': pos=at(px,'auto','auto',px); break;
    case 'bl': pos=at('auto',px,px,'auto'); break;
    case 'bm': pos=at('auto',mid,px,'auto'); break;
    case 'br': pos=at('auto','auto',px,px); break;
    default: pos=at('auto','auto',px,px);
  }
  return pos;
}
