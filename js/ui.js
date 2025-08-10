export function wireUI({ onChooseFile, onClear, onExport }) {
  const file = document.getElementById('file');
  const clearBtn = document.getElementById('clear');
  const exportBtn = document.getElementById('export');
  const bright = document.getElementById('bright');

  if (!file || !clearBtn || !exportBtn || !bright) {
    console.error("UI elements not found. Check index.html IDs.");
    return;
  }

  file.addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) {
      onChooseFile(f, bright.checked);
    }
  });

  clearBtn.addEventListener('click', () => {
    onClear();
    file.value = ''; // reset file input
  });

  exportBtn.addEventListener('click', () => {
    onExport();
  });
}
