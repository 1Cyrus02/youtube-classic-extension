// js/fast_fullscreen.js
// Fast Fullscreen: скрываем тяжёлые блоки до/во время fullscreen, возвращаем после.

(function() {
  if (window.__L4Y_FS__) return;
  window.__L4Y_FS__ = true;

  const RESTORE_DELAY = 400;

  // Скрываем перед кликом на fullscreen-кнопку или dblclick по видео
  function preHide() {
    document.documentElement.classList.add('l4y-pre-fs');
  }

  // Вешаем на кнопку и видео
  new MutationObserver(() => {
    const btn = document.querySelector('.ytp-fullscreen-button:not([data-l4y])');
    if (btn) {
      btn.dataset.l4y = '1';
      btn.addEventListener('click', preHide, {capture:true});
    }
    const vid = document.querySelector('video');
    if (vid && !vid.dataset.l4y) {
      vid.dataset.l4y = '1';
      vid.addEventListener('dblclick', preHide, {capture:true});
    }
  }).observe(document.documentElement, {childList:true, subtree:true});

  // Клавиша F
  document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'f') preHide();
  }, {capture:true});

  // После переключения fullscreen убираем класс и ставим .l4y-fs во время FS
  function onFS() {
    setTimeout(() => {
      document.documentElement.classList.remove('l4y-pre-fs');
      const isFS = document.fullscreenElement != null;
      document.documentElement.classList.toggle('l4y-fs', isFS);
    }, RESTORE_DELAY);
  }
  ['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange']
    .forEach(ev => document.addEventListener(ev, onFS, {passive:true}));

  console.log('[Lite4YouTube] Fast Fullscreen active.');
})();
