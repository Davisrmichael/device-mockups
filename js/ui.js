export function wireUI({ onChooseFile, onClear, onExport }) {
  const input = document.getElementById('imageInput');
  const brightCheck = document.getElementById('brightCheck');
  const clearBtn = document.getElementById('clearBtn');
  const exportBtn = document.getElementById('exportBtn');

  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;
    onChooseFile(file, brightCheck.checked);
    // don’t clear input so user can re-upload same file repeatedly if needed
  });

  clearBtn.addEventListener('click', () => {
    onClear();
    input.value = '';
  });

  exportBtn.addEventListener('click', () => {
    onExport();
  });

  // If user toggles bright after an image, re-apply by “choosing” the same file
  brightCheck.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (file) onChooseFile(file, brightCheck.checked);
  });
}
