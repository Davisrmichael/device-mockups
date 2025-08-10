import { createViewer } from './viewer.js';
import { wireUI } from './ui.js';
import { makeScreenTextureManager } from './screen-texture.js';
import { makeExporter } from './export-viewport.js';

// Model path (your repo layout)
const MODEL_PATH = 'iPhone-15-pro-2/iPhone-15.gltf';

const container = document.getElementById('viewer');
const msg = document.getElementById('msg');

let viewer;

(async () => {
  try {
    viewer = await createViewer(container, {
      modelUrl: MODEL_PATH,
      startYawDeg: 180,           // start spun 180°
      enableControls: true
    });
  } catch (e) {
    msg.textContent = `Failed to load model: ${e.message || e}`;
    throw e;
  }

  const screen = makeScreenTextureManager(() => viewer.findMaterialByName('Screen'));
  const exporter = makeExporter(viewer);

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
      screen.clear();
      msg.textContent = '';
    },
    onExport: async () => {
      try {
        const url = await exporter.exportViewerPNG(); // exactly the 720×720 viewer canvas
        const a = document.createElement('a');
        a.download = 'mockup-720.png';
        a.href = url;
        a.click();
      } catch (e) {
        console.error(e);
        msg.textContent = 'Export failed.';
      }
    }
  });
})();
