// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const cbH264 = document.getElementById('toggleH264');
  const cbFS   = document.getElementById('toggleFS');
  const btnReload = document.getElementById('reloadBtn');

  // Инициализация значений
  chrome.storage.local.get(['forceH264','fastFS'], data => {
    cbH264.checked = data.forceH264 !== false;
    cbFS.checked   = data.fastFS   !== false;
  });

  // Функция уведомления вкладкам
  function notifyAll(type, value) {
    chrome.tabs.query({ url: '*://*.youtube.com/*' }, tabs => {
      for (const t of tabs) {
        chrome.tabs.sendMessage(t.id, { type, value });
      }
    });
  }

  // Переключатель Force H.264
  cbH264.addEventListener('change', () => {
    const on = cbH264.checked;
    chrome.storage.local.set({ forceH264: on }, () => {
      console.log('[Lite4YouTube] Force H264 →', on);
      notifyAll('L4Y_FORCE_CHANGED', on);
    });
  });

  // Переключатель Fast Fullscreen
  cbFS.addEventListener('change', () => {
    const on = cbFS.checked;
    chrome.storage.local.set({ fastFS: on }, () => {
      console.log('[Lite4YouTube] Fast Fullscreen →', on);
      notifyAll('L4Y_FS_CHANGED', on);
    });
  });

  // Кнопка перезагрузки активной вкладки
  btnReload.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]?.id) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  });
});
