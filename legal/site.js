const preview = document.querySelector('.preview-dialog');
if (preview && typeof preview.showModal === 'function') {
  const photo = preview.querySelector('img');
  const caption = preview.querySelector('.preview-caption');
  document.querySelectorAll('[data-preview]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      photo.src = link.getAttribute('href');
      photo.alt = link.querySelector('img').alt;
      caption.textContent = link.dataset.caption;
      preview.showModal();
    });
  });
  preview.querySelector('.close-preview').addEventListener('click', () => preview.close());
  preview.addEventListener('click', event => {
    if (event.target !== preview) return;
    const box = preview.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) preview.close();
  });
}
document.querySelector('[data-print]')?.addEventListener('click', () => window.print());
