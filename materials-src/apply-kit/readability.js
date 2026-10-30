// Presentation bridge only. No text, question, storage-progress key or scoring changes.
(() => {
  const scales = { small: 0.875, default: 1, large: 1.15, xlarge: 1.3 };
  const apply = () => {
    let key = 'default';
    try {
      key = localStorage.getItem('course-font-scale') || 'default';
    } catch {}
    document.documentElement.style.setProperty('--font-scale', String(scales[key] || 1));
  };
  document.body.classList.add('readability-preview');
  apply();
  addEventListener('storage', (e) => {
    if (e.key === 'course-font-scale' || e.key === null) apply();
  });
})();
// A separate zoom control never consumes the original diagram's teaching interactions.
(() => {
  const install = () => {
    for (const region of document.querySelectorAll('.student-screen .diagram-region')) {
      const graphic = region.querySelector('svg:has(image),img');
      if (!graphic || region.querySelector('[data-readability-zoom]')) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = '🔍';
      button.dataset.readabilityZoom = 'true';
      button.setAttribute('aria-label', '放大圖像');
      button.onclick = () => {
        const dialog = document.createElement('dialog');
        dialog.className = 'readability-zoom';
        const close = document.createElement('button');
        close.type = 'button';
        close.textContent = '×';
        close.setAttribute('aria-label', '關閉放大圖像');
        const pane = document.createElement('div');
        pane.className = 'readability-zoom-pane';
        const copy = graphic.cloneNode(true);
        copy.style.position = 'static';
        copy.style.transform = 'none';
        copy.style.display = 'block';
        if (copy.tagName.toLowerCase() === 'svg') {
          copy.style.width = Math.max(1000, graphic.viewBox?.baseVal.width || 1000) + 'px';
          copy.style.height = 'auto';
          copy.style.maxWidth = 'none';
        } else {
          copy.style.width = Math.max(1000, graphic.naturalWidth || 1000) + 'px';
          copy.style.maxWidth = 'none';
        }
        pane.append(copy);
        dialog.append(close, pane);
        document.body.append(dialog);
        const leave = () => {
          dialog.close();
          dialog.remove();
          button.focus();
        };
        close.onclick = leave;
        dialog.addEventListener('cancel', (e) => {
          e.preventDefault();
          leave();
        });
        dialog.showModal();
        close.focus();
      };
      region.append(button);
    }
  };
  new MutationObserver(install).observe(document.body, { childList: true, subtree: true });
  install();
})();
