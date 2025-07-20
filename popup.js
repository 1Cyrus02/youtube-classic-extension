// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const cb = document.getElementById('toggleH264');

  // Инициализация
  chrome.storage.local.get('forceH264', data => {
    cb.checked = data.forceH264 !== false;
  });

  // Слушаем смену
  cb.addEventListener('change', () => {
    const on = cb.checked;
    chrome.storage.local.set({ forceH264: on }, () => {
      console.log('[Lite4YouTube] Force H264 →', on);
      // Можно сразу уведомить активные вкладки, но вкладка должна перезагрузиться
    });
  });
});
