import { createViewer } from './viewer.js';
import { wireUI } from './ui.js';
import { makeScreenTextureManager } from './screen-texture.js';
import { makeExporter } from './export-viewport.js';

// Adjust to your repo location
const MODEL_PATH = 'iPhone-15-pro-2/iPhone-15.gltf';

const qs = (id) => document.getElementById(id);
const container = qs('viewer');
const msg = qs('msg');

let viewer;

(async () => {
  try {
    viewer = await createViewer(container, {
      modelUrl: MODEL_PATH,
      startYawDeg: 180,        // start spun 180°
      enableControls: true
    });
  } catch (e) {
    console.error(e);
    msg.textContent = `Failed to load model: ${e.message || e}`;
    return;
  }

  const screen = makeScreenTextureManager(viewer.THREE, () => viewer.findMaterialByName('Screen'));
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
      try {
        screen.clear();
        msg.textContent = '';
      } catch (e) {
        console.error(e);
        msg.textContent = 'Nothing to clear.';
      }
    },
    onExport: async () => {
      try {
        const url = await exporter.exportViewerPNG();
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
