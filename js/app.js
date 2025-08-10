import { createViewer } from './viewer.js';
import { wireUI } from './ui.js';
import { makeScreenTextureManager } from './screen-texture.js';
import { makeExporter } from './export-viewport.js';

// Adjust to your repo path
const MODEL_PATH = 'iPhone-15-pro-2/iPhone-15.gltf';

const els = {
  file: document.getElementById('file'),
  clear: document.getElementById('clear'),
  bright: document.getElementById('bright'),
  exportBtn: document.getElementById('export'),
  msg: document.getElementById('msg'),
  viewer: document.getElementById('viewer'),
  threeCanvas: document.getElementById('threeCanvas'),
  bgCanvas: document.getElementById('bgCanvas'),
  hudCanvas: document.getElementById('hudCanvas'),
};

let viewer;

(async () => {
  try {
    viewer = await createViewer({
      modelUrl: MODEL_PATH,
      canvas: els.threeCanvas,
    });
  } catch (e) {
    els.msg.textContent = 'Failed to load model: ' + (e?.message || e);
    els.msg.setAttribute('data-show', 'true');
    throw e;
  }

  const screen = makeScreenTextureManager(() => viewer.findMaterialByName('Screen'));
  const exporter = makeExporter(els.viewer, [els.bgCanvas, els.threeCanvas, els.hudCanvas]);

  wireUI({
    els,
    onChooseFile: async (file, bright) => {
      try {
        await screen.applyFileToMaterial(file, { bright });
        els.msg.removeAttribute('data-show');
        viewer.renderOnce();
      } catch (e) {
        console.error(e);
        els.msg.textContent = e?.message || 'Failed to apply image. Try another file.';
        els.msg.setAttribute('data-show', 'true');
      }
    },
    onClear: () => {
      screen.clear();
      els.msg.removeAttribute('data-show');
      viewer.renderOnce();
    },
    onExport: async () => {
      try {
        const url = await exporter.exportPNG();
        const a = document.createElement('a');
        a.download = 'mockup-720.png';
        a.href = url; a.click();
      } catch (e) {
        console.error(e);
        els.msg.textContent = 'Export failed.';
        els.msg.setAttribute('data-show', 'true');
      }
    }
  });
})();
