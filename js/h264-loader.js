// js/h264-loader.js
// loader: инжектит h264-inject.js в MAIN world только 1 раз на вкладку по настройке forceH264.

(function() {
  const KEY = '__L4Y_H264_LOADED__';
  if (window[KEY]) return;
  window[KEY] = true;

  chrome.storage.local.get('forceH264', data => {
    if (data.forceH264 === false) {
      console.log('[Lite4YouTube][loader] forceH264 выключен.');
      return;
    }
    const src = chrome.runtime.getURL('js/h264-inject.js');
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => s.remove();
    (document.head || document.documentElement).appendChild(s);
    console.log('[Lite4YouTube][loader] injected:', src);
  });
})();
