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
  const src = `assets/screenshots/theme-${button.dataset.theme}.jpg`;
  document.getElementById('theme-image').src = src;
  document.getElementById('theme-link').href = src;
  updateThemeCaption();
}));
document.addEventListener('filedesk:language', updateThemeCaption);
updateThemeCaption();
function updateProScreenshots() {
  const language = document.documentElement.lang;
  const supported = ['ko', 'en', 'ja', 'de', 'fr', 'zh-Hans', 'zh-Hant'];
  const locale = supported.includes(language) ? language : 'en';
  document.querySelectorAll('[data-pro-shot]').forEach(link => {
    const src = `assets/screenshots/pro/${locale}/${link.dataset.proShot}.png`;
    link.href = src;
    link.querySelector('img').src = src;
  });
  if (dialog.open && opener?.dataset.proShot) {
    dialog.querySelector('img').src = opener.href;
    dialog.querySelector('img').alt = opener.querySelector('img').alt;
  }
}
document.addEventListener('filedesk:language', updateProScreenshots);
updateProScreenshots();
