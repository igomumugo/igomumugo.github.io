const dialog = document.getElementById('image-view');
let opener;
document.querySelectorAll('[data-image]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  opener = link;
  const image = dialog.querySelector('img');
  image.src = link.href;
  image.alt = link.querySelector('img').alt;
  dialog.showModal();
}));
dialog.querySelector('button').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => opener?.focus());
function updateThemeCaption() {
  const button = document.querySelector('[data-theme][aria-pressed="true"]');
  const values = { theme: button.textContent };
  const t = window.FileDeskI18n?.t;
  if (!t || !document.documentElement.dataset.languageReady) return;
  document.getElementById('theme-image').alt = t('common.themeAlt', values);
  document.getElementById('theme-caption').textContent = t('common.themeCaption', values);
}
document.querySelectorAll('[data-theme]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-theme]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  // Each language has its own Standard 1.25 capture; i18n.js swaps the language via data-local-shot.
  const image = document.getElementById('theme-image');
  image.dataset.localShot = `standard-1.25/guide-theme-${button.dataset.theme}.webp`;
  const locale = window.FileDeskI18n?.language || 'ko';
  const version = new URL(document.querySelector('script[src*="i18n.js"]').src).searchParams.get('v') || '1';
  const src = `assets/screenshots/standard-1.25/${locale}/guide-theme-${button.dataset.theme}.webp?v=${encodeURIComponent(version)}`;
  image.src = src;
  document.getElementById('theme-link').href = src;
  updateThemeCaption();
}));
document.addEventListener('filedesk:language', updateThemeCaption);
updateThemeCaption();
// Keep an open enlarged image in step with the language (i18n.js updates the links).
document.addEventListener('filedesk:language', () => {
  if (dialog.open && opener) {
    dialog.querySelector('img').src = opener.href;
    dialog.querySelector('img').alt = opener.querySelector('img').alt;
  }
});
