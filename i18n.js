(() => {
  'use strict';
  const supported = ['ko', 'en', 'ja', 'de', 'fr', 'zh-Hans', 'zh-Hant'];
  const storageKey = 'filedesk.site.language';
  const version = new URL(document.currentScript.src).searchParams.get('v') || '1';
  const select = document.getElementById('site-language');
  const status = document.createElement('p');
  status.className = 'language-status';
  status.setAttribute('role', 'status');
  select.closest('.header-actions').append(status);
  const cache = new Map();
  let locale = 'ko';
  let catalogue = {};
  let request = 0;
  function normalize(value) {
    if (typeof value !== 'string') return null;
    const tag = value.toLowerCase().replaceAll('_', '-');
    if (/^zh-(hant|tw|hk|mo)(-|$)/.test(tag)) return 'zh-Hant';
    if (/^zh($|-)/.test(tag)) return 'zh-Hans';
    const base = tag.split('-')[0];
    return supported.includes(base) ? base : null;
  }
  function readPreference() {
    try { return normalize(localStorage.getItem(storageKey)); } catch { return null; }
  }
  function translate(key, values = {}) {
    return String(catalogue[key] ?? key).replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
  }
  function updateLinks() {
    document.querySelectorAll('a[href]').forEach(link => {
      const raw = link.getAttribute('href');
      if (!raw || raw.startsWith('#')) return;
      const url = new URL(raw, document.baseURI);
      if (url.origin !== location.origin || !/(\/|\.html)$/.test(url.pathname)) return;
      url.searchParams.set('lang', locale);
      link.href = url.pathname + url.search + url.hash;
    });
  }
  async function setLanguage(next, persist = false) {
    const currentRequest = ++request;
    status.textContent = '';
    select.setAttribute('aria-busy', 'true');
    try {
      if (!cache.has(next)) {
        const response = await fetch(`locales/${next}.json?v=${encodeURIComponent(version)}`);
        if (!response.ok) throw new Error('Language unavailable');
        const data = await response.json();
        if (typeof data['common.language'] !== 'string') throw new Error('Invalid language');
        cache.set(next, data);
      }
      if (currentRequest !== request) return;
      locale = next;
      catalogue = cache.get(next);
      document.documentElement.lang = locale;
      document.querySelectorAll('[data-i18n]').forEach(element => {
        const value = catalogue[element.dataset.i18n];
        if (typeof value === 'string') element.innerHTML = value;
      });
      ['alt', 'aria-label', 'content'].forEach(attribute => {
        document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
          const value = catalogue[element.getAttribute(`data-i18n-${attribute}`)];
          if (typeof value === 'string') element.setAttribute(attribute, value);
        });
      });
      document.querySelectorAll('img[data-local-shot]').forEach(image => {
        const [series, file] = image.dataset.localShot.split('/');
        const src = `assets/screenshots/${series}/${locale}/${file}?v=${encodeURIComponent(version)}`;
        image.setAttribute('src', src);
        const link = image.closest('a[href^="assets/screenshots/"]');
        if (link) link.setAttribute('href', src);
      });
      select.value = locale;
      if (persist) {
        try { localStorage.setItem(storageKey, locale); } catch { /* Storage is optional. */ }
        const url = new URL(location.href);
        url.searchParams.set('lang', locale);
        history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
      updateLinks();
      document.documentElement.dataset.languageReady = locale;
      document.dispatchEvent(new CustomEvent('filedesk:language', { detail: { locale } }));
    } catch {
      if (currentRequest !== request) return;
      select.value = locale;
      status.textContent = catalogue['common.error'] || '언어를 불러오지 못했습니다. 다시 선택해 주세요. / Please select the language again.';
    } finally {
      if (currentRequest === request) select.removeAttribute('aria-busy');
    }
  }
  window.FileDeskI18n = { t: translate, get language() { return locale; } };
  const downloadLink = document.querySelector('header nav a[href="#download"]');
  if (downloadLink) {
    const updateDownloadLink = () => {
      if (location.hash === downloadLink.hash) {
        downloadLink.setAttribute('aria-current', 'location');
      } else {
        downloadLink.removeAttribute('aria-current');
      }
    };
    window.addEventListener('hashchange', updateDownloadLink);
    updateDownloadLink();
  }
  select.addEventListener('change', () => setLanguage(select.value, true));
  // English is the default; only a ?lang= link or the visitor's own saved choice changes it.
  const initial = normalize(new URL(location.href).searchParams.get('lang')) || readPreference() || 'en';
  setLanguage(initial);
})();
