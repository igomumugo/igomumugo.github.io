(() => {
  'use strict';
  const video = document.getElementById('intro-video');
  const buttons = [...document.querySelectorAll('[data-video]')];
  const films = {
    'quick-tour': { key: 'video.quick', language: '한국어', duration: '0:28' },
    'english-intro': { key: 'video.english', language: 'English', duration: '1:23' },
    'motion-guide': { key: 'video.motion', language: '한국어', duration: '0:36' },
    'feature-tour': { key: 'video.features', language: '한국어', duration: '0:50' },
    'short-intro': { key: 'video.short', language: '한국어', duration: '0:30' }
  };
  let active = 'quick-tour';
  let chosen = false;
  function selectFilm(id) {
    if (id !== active) {
      video.pause();
      video.removeAttribute('src');
      video.querySelector('source').src = `assets/videos/${id}.mp4`;
      video.poster = `assets/videos/${id}.jpg`;
      video.load();
      active = id;
    }
    const film = films[active];
    const title = document.getElementById('video-title');
    title.dataset.i18n = film.key;
    title.textContent = document.documentElement.dataset.languageReady
      ? window.FileDeskI18n.t(film.key)
      : buttons.find(button => button.dataset.video === active).querySelector('span').textContent;
    document.getElementById('video-meta').textContent = `${film.language} · ${film.duration}`;
    document.getElementById('video-open').href = `assets/videos/${active}.mp4`;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.video === active)));
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    chosen = true;
    selectFilm(button.dataset.video);
  }));
  video.addEventListener('play', () => { chosen = true; });
  function updateForLanguage() {
    selectFilm(chosen ? active : (window.FileDeskI18n?.language === 'ko' ? 'quick-tour' : 'english-intro'));
  }
  document.addEventListener('filedesk:language', updateForLanguage);
  if (document.documentElement.dataset.languageReady) updateForLanguage();
})();
