export function makeExporter(stackEl, orderedCanvases){
  const out = document.createElement('canvas');
  out.width = 720; out.height = 720;
  const ctx = out.getContext('2d');
  return {
    async exportPNG(){
      ctx.clearRect(0,0,720,720);
      for (const c of orderedCanvases){
        if (!c) continue;
        ctx.drawImage(c, 0, 0, 720, 720);
      }
      return out.toDataURL('image/png');
    }
  };
}
