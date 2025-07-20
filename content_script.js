// content_script.js - Оптимизации для слабых ПК
if (window.weakPCOptimizationsLoaded) return;
window.weakPCOptimizationsLoaded = true;
(function() {
  'use strict';

  let fullscreenOptimizationEnabled = true;
  let performanceOptimizationsActive = false;
  let hiddenElements = new Map();
  let mutationObservers = [];

  // ======== ОПТИМИЗАЦИЯ ПОЛНОЭКРАННОГО РЕЖИМА ======== //
  function initFastFullscreen() {
    const heavyElements = [
      '#secondary',           // Боковая панель
      '#comments',            // Комментарии
      '#related',             // Рекомендации
      'ytd-watch-next-secondary-results-renderer', // Похожие видео
      '.ytd-watch-flexy[role="complementary"]', // Дополнительный контент
      'ytd-live-chat-frame',  // Живой чат
      '#chat-container',      // Контейнер чата
      '.ytp-chrome-top',      // Верхняя панель плеера
      '.ytp-gradient-top'     // Градиент сверху
    ];

    function hideElements() {
      heavyElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element && element.style.display !== 'none') {
            // Сохраняем оригинальные стили
            hiddenElements.set(element, {
              display: element.style.display,
              visibility: element.style.visibility,
              opacity: element.style.opacity
            });
            
            // Скрываем элементы
            element.style.display = 'none';
            element.style.visibility = 'hidden';
            element.style.opacity = '0';
            element.style.pointerEvents = 'none';
          }
        });
      });

      // Отключаем тяжелые анимации CSS
      const style = document.createElement('style');
      style.id = 'fullscreen-optimization-styles';
      style.textContent = `
        * {
          transition: none !important;
          animation: none !important;
          transform: none !important;
        }
        .html5-video-player {
          transition: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    function restoreElements() {
      hiddenElements.forEach((originalStyles, element) => {
        if (element && element.parentNode) {
          element.style.display = originalStyles.display || '';
          element.style.visibility = originalStyles.visibility || '';
          element.style.opacity = originalStyles.opacity || '';
          element.style.pointerEvents = '';
        }
      });
      hiddenElements.clear();

      // Восстанавливаем анимации
      const optimizationStyles = document.getElementById('fullscreen-optimization-styles');
      if (optimizationStyles && optimizationStyles.parentNode) {
        optimizationStyles.remove();
      }
    }

    function handleFullscreenChange() {
      if (!fullscreenOptimizationEnabled) return;

      const isFullscreen = document.fullscreenElement || 
                          document.webkitFullscreenElement || 
                          document.mozFullScreenElement || 
                          document.msFullscreenElement;

      if (isFullscreen) {
        hideElements();
      } else {
        restoreElements();
      }
    }

    // Регистрируем обработчики событий
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ];
    
    events.forEach(event => {
      document.addEventListener(event, handleFullscreenChange);
    });

    // Обработка клика по кнопке полноэкранного режима
    function attachFullscreenButtonListener() {
      const fullscreenButton = document.querySelector('.ytp-fullscreen-button');
      if (fullscreenButton && !fullscreenButton.dataset.listenerAttached) {
        fullscreenButton.dataset.listenerAttached = 'true';
        fullscreenButton.addEventListener('click', () => {
          setTimeout(handleFullscreenChange, 50);
        });
      }
    }

    // Наблюдатель за изменениями DOM для новых кнопок
    const buttonObserver = new MutationObserver(() => {
      attachFullscreenButtonListener();
    });

    buttonObserver.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    mutationObservers.push(buttonObserver);

    attachFullscreenButtonListener();
  }

  // ======== ОБЩИЕ ОПТИМИЗАЦИИ ПРОИЗВОДИТЕЛЬНОСТИ ======== //
  function initPerformanceOptimizations() {
    if (performanceOptimizationsActive) return;
    performanceOptimizationsActive = true;

    // Уменьшаем частоту обновления прогресс-бара
    const style = document.createElement('style');
    style.id = 'performance-optimization-styles';
    style.textContent = `
      /* Отключаем тяжелые анимации */
      .ytp-play-progress, 
      .ytp-load-progress {
        transition: transform 0.1s linear !important;
      }
      
      /* Упрощаем визуальные эффекты */
      .ytp-chrome-bottom {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      
      /* Скрываем миниатюры в прогресс-баре */
      .ytp-hover-progress .ytp-thumbnail-overlay-image {
        display: none !important;
      }
      
      /* Отключаем автозапуск следующего видео для экономии ресурсов */
      .ytp-autonav-endscreen-upnext-button,
      .ytp-autonav-endscreen-upnext-header {
        display: none !important;
      }
      
      /* Упрощаем отображение комментариев */
      ytd-comment-thread-renderer {
        contain: layout !important;
      }
    `;
    document.head.appendChild(style);

    // Ограничиваем частоту вызовов requestAnimationFrame
    const originalRAF = window.requestAnimationFrame;
    let rafThrottle = false;
    window.requestAnimationFrame = function(callback) {
      if (rafThrottle) return;
      rafThrottle = true;
      return originalRAF(() => {
        callback.apply(this, arguments);
        setTimeout(() => { rafThrottle = false; }, 32); // ~30 FPS вместо 60
      });
    };

    console.log('[WeakPC] Performance optimizations enabled');
  }

  // ======== ОПТИМИЗАЦИЯ ЗАГРУЗКИ ВИДЕО ======== //
  function optimizeVideoLoading() {
    const video = document.querySelector('video');
    if (video) {
      // Отключаем preload для экономии трафика и процессора
      video.preload = 'metadata';
    }
  }

  // ======== ДИАГНОСТИКА ПОДДЕРЖКИ КОДЕКОВ ======== //
  function runCodecDiagnostics() {
    const video = document.createElement('video');
    return {
      h264: video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '',
      vp9: video.canPlayType('video/webm; codecs="vp9"') !== '',
      av1: video.canPlayType('video/mp4; codecs="av01.0.05M.08"') !== ''
    };
  }

  // ======== ОБРАБОТКА СООБЩЕНИЙ ОТ РАСШИРЕНИЯ ======== //
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'ENABLE_FULLSCREEN_OPTIM':
        fullscreenOptimizationEnabled = true;
        console.log('[WeakPC] Fullscreen optimization enabled');
        sendResponse({status: 'enabled'});
        break;
        
      case 'DISABLE_FULLSCREEN_OPTIM':
        fullscreenOptimizationEnabled = false;
        console.log('[WeakPC] Fullscreen optimization disabled');
        sendResponse({status: 'disabled'});
        break;
        
      case 'ENABLE_PERFORMANCE_OPTIM':
        initPerformanceOptimizations();
        sendResponse({status: 'enabled'});
        break;
        
      case 'RUN_DIAGNOSTICS':
        sendResponse(runCodecDiagnostics());
        break;
    }
  });

  // ======== ИНИЦИАЛИЗАЦИЯ ======== //
  function initialize() {
    // Очищаем предыдущие наблюдатели
    mutationObservers.forEach(observer => observer.disconnect());
    mutationObservers = [];
    hiddenElements.clear();
    
    // Ждем загрузки YouTube плеера
    const checkPlayer = setInterval(() => {
      if (document.querySelector('.html5-video-player')) {
        clearInterval(checkPlayer);
        
        console.log('[WeakPC] Initializing optimizations for weak PC...');
        
        // Инициализируем все оптимизации
        initFastFullscreen();
        initPerformanceOptimizations();
        optimizeVideoLoading();
        
        console.log('[WeakPC] All optimizations loaded successfully!');
      }
    }, 500);
  }

  // Запуск при загрузке страницы
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Запуск при навигации YouTube (SPA)
  let currentUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      setTimeout(initialize, 1000); // Даем время на загрузку нового контента
    }
  });

  urlObserver.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  mutationObservers.push(urlObserver);

})();