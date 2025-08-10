// js/export-viewport.js
export function makeExporter(viewer){
  return {
    async exportViewerPNG(){
      // export exactly what you see (720×720)
      return viewer.renderer.domElement.toDataURL('image/png');
    }
  };
}
