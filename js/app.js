// js/app.js
import { createViewer } from './viewer.js';
import { wireUI } from './ui.js';
import { makeScreenTextureManager } from './screen-texture.js';
import { makeExporter } from './export-viewport.js';

const MODEL_PATH = 'iPhone-15-pro-2/iPhone-15.gltf';

const container = document.getElementById('viewer');
const msg = document.getElementById('msg');

function setMsg(t){ if(msg) msg.textContent = t || ''; }

let viewer;

(async () => {
  try {
    viewer = await createViewer(container, {
      modelUrl: MODEL_PATH,
      startYawDeg: 180,
      enableControls: true
    });
  } catch (e) {
    setMsg(`Failed to load model: ${e.message || e}`);
    throw e;
  }

  const screen = makeScreenTextureManager(() => viewer.findMaterialByName('Screen'));
  const exporter = makeExporter(viewer);

  wireUI({
    onChooseFile: async (file, bright) => {
      try {
        await screen.applyFileToMaterial(file, { bright });
        setMsg('Screen updated ✔︎');
        viewer.render();
      } catch (e) {
        console.error(e);
        setMsg(e?.message || 'Failed to apply image. Try another file / refresh.');
      }
    },
    onClear: () => {
      try {
        screen.clear();
        setMsg('Cleared');
        viewer.render();
      } catch (e) {
        console.error(e);
        setMsg('Nothing to clear (no Screen material?)');
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
        setMsg('Export failed.');
      }
    }
  });
})();
