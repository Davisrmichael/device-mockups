// js/export-viewport.js
// No Three import needed — we export from the viewer's existing canvas.

export function makeExporter(viewer) {
  if (!viewer?.renderer) throw new Error('Viewer missing renderer');

  async function exportViewerPNG() {
    const canvas = viewer.getCanvas ? viewer.getCanvas() : viewer.renderer.domElement;
    if (!canvas) throw new Error('Viewer canvas not found');

    // toBlob is async and preserves full 720×720
    const blob = await new Promise((res, rej) => {
      canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png', 1.0);
    });
    return URL.createObjectURL(blob);
  }

  return { exportViewerPNG };
}
