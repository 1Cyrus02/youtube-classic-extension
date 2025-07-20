// js/fast_fullscreen.js
(function() {
  if (window.top !== window) return; // не в iframe

  let enabled = true;  // по умолчанию

  // Прочитать настройку
  chrome.storage.local.get('fastFS', data => {
    if (data.fastFS === false) enabled = false;
    update(enabled);
  });

  // Обрабатывать переключения из popup
  chrome.runtime.onMessage.addListener((msg, sender, respond) => {
    if (msg.type === 'L4Y_FS_CHANGED') {
      enabled = Boolean(msg.value);
      console.log('[Lite4YouTube] Fast Fullscreen enabled=', enabled);
      update(enabled);
    }
  });

  // Основная логика включения/выключения
  function update(on) {
    if (on) {
      activate();
    } else {
      deactivate();
    }
  }

  // Переменные для наблюдателя и обработчиков
  let mo, keydownHandler, fsChangeHandler;
  const RESTORE_DELAY = 400;
  const PRE_CLASS = 'l4y-pre-fs', FS_CLASS = 'l4y-fs';

  function activate() {
    // Защита от повторного включения
    if (mo) return;

    // Наблюдаем за кнопкой и видео
    mo = new MutationObserver(attachListeners);
    mo.observe(document.documentElement, {childList:true, subtree:true});
    attachListeners();

    // Клавиша F
    keydownHandler = e => { if (e.key.toLowerCase()==='f') preHide(); };
    document.addEventListener('keydown', keydownHandler, {capture:true});

    // Fullscreenchange
    fsChangeHandler = () => {
      setTimeout(() => {
        document.documentElement.classList.remove(PRE_CLASS);
        const isFS = !!document.fullscreenElement;
        document.documentElement.classList.toggle(FS_CLASS, isFS);
      }, RESTORE_DELAY);
    };
    ['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange']
      .forEach(ev => document.addEventListener(ev, fsChangeHandler, {passive:true}));

    console.log('[Lite4YouTube] Fast Fullscreen active.');
  }

  function deactivate() {
    // Убрать классы
    document.documentElement.classList.remove(PRE_CLASS, FS_CLASS);

    // Отключить MutationObserver
    if (mo) {
      mo.disconnect();
      mo = null;
    }

    // Удалить обработчики
    document.removeEventListener('keydown', keydownHandler, {capture:true});
    ['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange']
      .forEach(ev => document.removeEventListener(ev, fsChangeHandler));
    console.log('[Lite4YouTube] Fast Fullscreen deactivated.');
  }

  function attachListeners() {
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
  }

  function preHide() {
    document.documentElement.classList.add(PRE_CLASS);
  }

})();
