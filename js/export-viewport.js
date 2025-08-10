export function makeExporter(viewer) {
  const { renderer } = viewer;

  async function exportViewerPNG() {
    // Ensure current frame rendered
    renderer.render(viewer.scene, viewer.camera);
    // toDataURL will capture exactly the 720×720 canvas (because we sized it that way)
    return renderer.domElement.toDataURL('image/png');
  }

  return { exportViewerPNG };
}
