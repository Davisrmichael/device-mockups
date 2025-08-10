export function makeExporter(viewer) {
  // We sized renderer to exactly match the 720×720 viewer; just dump it.
  return {
    async exportViewerPNG() {
      const dataURL = viewer.renderer.domElement.toDataURL('image/png');
      return dataURL;
    }
  };
}
