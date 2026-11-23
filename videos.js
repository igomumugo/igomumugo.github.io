(() => {
  'use strict';
  const video = document.getElementById('intro-video');
  const buttons = [...document.querySelectorAll('[data-video]')];
  const proVideo = document.getElementById('pro-video');
  // A bookmark can point to a feature or player inside a collapsed homepage section.
  function revealBookmark() {
    const target = document.getElementById(location.hash.slice(1));
    const panel = target?.closest('details:not([open])');
    if (panel) {
      panel.open = true;
      target.scrollIntoView({ block: 'start' });
    }
  }
  window.addEventListener('hashchange', revealBookmark);
  revealBookmark();
  const films = {
    'pro-introduction': {
      key: 'pro.introFilm', language: 'English', duration: '1:12',
      src: proVideo.querySelector('source').src, poster: proVideo.poster
    },
    'quick-tour': { key: 'video.quick', language: '한국어', duration: '0:28' },
    'english-intro': { key: 'video.english', language: 'English', duration: '1:23' },
    'motion-guide': { key: 'video.motion', language: '한국어', duration: '0:36' },
    'feature-tour': { key: 'video.features', language: '한국어', duration: '0:50' },
    'short-intro': { key: 'video.short', language: '한국어', duration: '0:30' }
  };
  let active = 'quick-tour';
  let chosen = false;
  function selectFilm(id) {
    const film = films[id];
    const src = film.src || `assets/videos/${id}.mp4`;
    if (id !== active) {
      video.pause();
      video.removeAttribute('src');
      video.querySelector('source').src = src;
      video.poster = film.poster || `assets/videos/${id}.jpg`;
      video.load();
      active = id;
    }
    const title = document.getElementById('video-title');
    title.dataset.i18n = film.key;
    title.textContent = document.documentElement.dataset.languageReady
      ? window.FileDeskI18n.t(film.key)
      : buttons.find(button => button.dataset.video === active).querySelector('span').textContent;
    document.getElementById('video-meta').textContent = `${film.language} · ${film.duration}`;
    document.getElementById('video-open').href = src;
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
