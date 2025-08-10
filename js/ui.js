export function wireUI({ onChooseFile, onClear, onExport }) {
  const file = document.getElementById('file');
  const clearBtn = document.getElementById('clear');
  const exportBtn = document.getElementById('export');
  const bright = document.getElementById('bright');

  if (!file || !clearBtn || !exportBtn || !bright) {
    throw new Error('UI elements missing in DOM.');
  }

  file.addEventListener('change', async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    await onChooseFile(f, !!bright.checked);
    // reset file input so selecting same file again still fires change
    file.value = '';
  });

  clearBtn.addEventListener('click', () => onClear());
  exportBtn.addEventListener('click', () => onExport());
}
