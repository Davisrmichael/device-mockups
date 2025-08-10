// js/ui.js
// Wires the simple UI to callbacks supplied by app.js
export function wireUI({ onChooseFile, onClear, onExport }) {
  const file   = document.getElementById('file');
  const clear  = document.getElementById('clear');
  const exp    = document.getElementById('export');
  const bright = document.getElementById('bright');
  const msg    = document.getElementById('msg');

  if (!file || !clear || !exp || !bright) {
    if (msg) msg.textContent = 'UI not found – check element IDs (file/clear/export/bright).';
    throw new Error('UI elements missing');
  }

  // File choose
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    try {
      await onChooseFile?.(f, !!bright.checked);
      msg.textContent = '';
    } catch (e) {
      console.error(e);
      msg.textContent = e?.message || 'Failed to apply image.';
    }
  });

  // Clear
  clear.addEventListener('click', async () => {
    try {
      await onClear?.();
      file.value = ''; // reset chooser
      msg.textContent = '';
    } catch (e) {
      console.error(e);
      msg.textContent = 'Failed to clear.';
    }
  });

  // Export
  exp.addEventListener('click', async () => {
    try {
      await onExport?.();
      // message handled in app.js on success
    } catch (e) {
      console.error(e);
      msg.textContent = 'Export failed.';
    }
  });
}
