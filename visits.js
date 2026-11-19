(() => {
  'use strict';
  const endpoint = 'https://filedesk-visits.imusiro.workers.dev';
  const key = 'filedesk.site.visit.v1';
  const lifetime = 30 * 60 * 1000;
  let counts = null;
  let failed = false;
  function render() {
    const formatter = new Intl.NumberFormat(window.FileDeskI18n?.language || 'ko');
    document.querySelectorAll('[data-visit]').forEach(node => {
      node.textContent = counts ? formatter.format(counts[node.dataset.visit]) : '—';
    });
    const status = document.getElementById('visits-status');
    if (status) status.textContent = failed ? (window.FileDeskI18n?.t('visits.error') || 'Visit counts are temporarily unavailable.') : '';
  }
  function session() {
    if (location.protocol !== 'https:' || !['filedesk.win', 'www.filedesk.win', 'igomumugo.github.io'].includes(location.hostname)) return null;
    try {
      const now = Date.now();
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (saved && typeof saved.id === 'string' && saved.expires > now && saved.expires <= now + lifetime) return saved.id;
      const value = {id: crypto.randomUUID(), expires: now + lifetime};
      localStorage.setItem(key, JSON.stringify(value));
      return value.id;
    } catch { return null; }
  }
  async function load() {
    const id = session();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const result = await fetch(endpoint + (id ? '/visit' : '/count'), {
        method: id ? 'POST' : 'GET', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
        signal: controller.signal,
        ...(id ? {headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id})} : {})
      });
      if (!result.ok) throw new Error('Unavailable');
      const value = await result.json();
      if (!['today', 'total'].every(name => Number.isSafeInteger(value[name]) && value[name] >= 0)) throw new Error('Invalid counts');
      counts = value;
    } catch { failed = true; }
    finally { clearTimeout(timeout); render(); }
  }
  document.addEventListener('filedesk:language', render);
  load();
})();
