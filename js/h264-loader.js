// h264-loader.js
// Загружает h264-inject.js в контекст страницы как внешний <script src="...">
// Это обход CSP: inline-скрипты YouTube блокирует, а внешние ресурсы из расширения,
// объявленные в web_accessible_resources, допускаются. :contentReference[oaicite:7]{index=7}

(function() {
  const LOAD_KEY = '__L4Y_H264_LOAD_ONCE__';
  if (window[LOAD_KEY]) return;
  window[LOAD_KEY] = true;

  // Если позже добавим настройку - читаем storage и решаем, грузить или нет.
  chrome.storage?.local.get('forceH264', data => {
    const enable = data.forceH264 !== false; // по умолчанию ВКЛ
    if (!enable) {
      console.log('[Lite4YouTube][loader] forceH264 выключен, патч не загружаем.');
      return;
    }
    inject();
  });

  function inject() {
    const url = chrome.runtime.getURL('js/h264-inject.js');
    const s = document.createElement('script');
    s.src = url;
    // после загрузки удаляем тег, чтобы не засорять DOM
    s.onload = () => { s.remove(); };
    (document.head || document.documentElement).appendChild(s);
    console.log('[Lite4YouTube][loader] inject h264-inject.js ->', url);
  }
})();
