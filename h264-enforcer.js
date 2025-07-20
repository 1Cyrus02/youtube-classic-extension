// h264-enforcer.js
function enforceH264() {
  // 1. Мониторинг новых видео элементов
  const observer = new MutationObserver(() => {
    document.querySelectorAll('video').forEach(video => {
      if (!video.dataset.h264checked) {
        video.dataset.h264checked = 'true';
        monitorVideoSource(video);
      }
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

function monitorVideoSource(video) {
  const originalSrc = video.src;
  let h264Detected = false;
  
  const checkSource = () => {
    if (h264Detected) return;
    
    // Проверяем источники
    const sources = video.querySelectorAll('source');
    for (const source of sources) {
      if (source.type.includes('avc') || source.src.includes('avc1')) {
        h264Detected = true;
        return;
      }
    }
    
    // Если H.264 не найден - переключаем
    if (!h264Detected && video.src) {
      console.warn('[H264 Enforcer] Non-H264 source detected');
      video.src = video.src.replace(/(\/[^/]+)\.googlevideo\.com\//, '$1---forced-h264.googlevideo.com/');
      video.load();
    }
  };
  
  // Проверяем каждые 2 секунды
  setInterval(checkSource, 2000);
  checkSource();
}

// Запускаем при загрузке
if (document.readyState === 'complete') {
  enforceH264();
} else {
  window.addEventListener('load', enforceH264);
}