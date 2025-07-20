// fast_fullscreen.js
// Ставит класс .l4y-pre-fs перед переключением, потом ждёт событие fullscreenchange.
// Стили в fast_fullscreen.css реально скрывают тяжёлые блоки. :contentReference[oaicite:9]{index=9}

(function() {
  if (window.__L4Y_FS_LOADED__) return;
  window.__L4Y_FS_LOADED__ = true;

  const HIDE_MS_BEFORE = 0;      // сразу
  const RESTORE_DELAY_MS = 400;  // после входа/выхода, чуть подождём

  // Перехватываем клики по кнопке fullscreen
  const mo = new MutationObserver(attachToButtons);
  mo.observe(document.documentElement, {childList:true, subtree:true});
  attachToButtons();

  // Перехват клавиш (YouTube тоже слушает 'f', но мы хотим успеть спрятать мусор заранее)
  document.addEventListener('keydown', e => {
    if (e.key && e.key.toLowerCase() === 'f') {
      preToggleHide();
      // YouTube сам обработает и войдёт в FS
    }
  }, {capture:true});

  // Реакция на fullscreenchange: убрать наш класс после задержки
  ['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange']
    .forEach(ev => document.addEventListener(ev, onFSChange, {passive:true}));

  function attachToButtons() {
    const btn = document.querySelector('.ytp-fullscreen-button:not([data-l4y-fs])');
    if (!btn) return;
    btn.dataset.l4yFs = '1';
    btn.addEventListener('click', preToggleHide, {capture:true});
    // YT ловит dblclick по видео; тоже перехватим
    const video = document.querySelector('video');
    if (video && !video.dataset.l4yFsDbl) {
      video.dataset.l4yFsDbl = '1';
      video.addEventListener('dblclick', preToggleHide, {capture:true});
    }
  }

  function preToggleHide() {
    document.documentElement.classList.add('l4y-pre-fs');
    if (HIDE_MS_BEFORE) {
      // если нужно задержку
      setTimeout(()=>{}, HIDE_MS_BEFORE);
    }
  }

  function onFSChange() {
    // как только браузер сообщил о входе/выходе
    setTimeout(() => {
      document.documentElement.classList.remove('l4y-pre-fs');
      // вдобавок повесим класс l4y-fs если в полноэкранном
      const isFS = document.fullscreenElement ||
                   document.webkitFullscreenElement ||
                   document.mozFullScreenElement ||
                   document.msFullscreenElement;
      document.documentElement.classList.toggle('l4y-fs', !!isFS);
    }, RESTORE_DELAY_MS);
  }

  console.log('[Lite4YouTube] Fast Fullscreen active.');
})();
