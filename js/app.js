// js/app.js
import { createViewer } from './viewer.js';
import { wireUI } from './ui.js';
import { makeScreenTextureManager } from './screen-texture.js';
import { makeExporter } from './export-viewport.js';

// Your model path (repo layout)
const MODEL_PATH = 'iPhone-15-pro-2/iPhone-15.gltf';

const container = document.getElementById('viewer');
const msg = document.getElementById('msg');

let viewer;

(async () => {
  try {
    viewer = await createViewer(container, {
      modelUrl: MODEL_PATH,
      startYawDeg: 180,     // start spun around
      enableControls: true,
    });
  } catch (e) {
    console.error(e);
    msg.textContent = `Failed to load model: ${e?.message || e}`;
    return;
  }

  // Material target helper — always look for a material named "Screen"
  const getScreenMaterial = () => viewer.findMaterialByName('Screen');

  // Texture applier
  const screen = makeScreenTextureManager(getScreenMaterial);

  // Exporter (grabs exactly the 720×720 viewer canvas)
  const exporter = makeExporter(viewer);

  // Hook UI
  wireUI({
    onChooseFile: async (file, bright) => {
      try {
        await screen.applyFileToMaterial(file, { bright });
        msg.textContent = '';
      } catch (e) {
        console.error(e);
        msg.textContent = e?.message || 'Failed to apply image. Try another file / refresh.';
      }
    },
    onClear: () => {
      try {
        screen.clear();
        msg.textContent = '';
      } catch (e) {
        console.error(e);
        msg.textContent = 'Failed to clear texture.';
      }
    },
    onExport: async () => {
      try {
        const url = await exporter.exportViewerPNG();
        const a = document.createElement('a');
        a.download = 'mockup-720.png';
        a.href = url;
        a.click();
        // (optional) revoke after a tick
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      } catch (e) {
        console.error(e);
        msg.textContent = 'Export failed.';
      }
    }
  });
})();
