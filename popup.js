(function (context) {
  "use strict";
  if (!context) return;

  const $enableToggler = document.getElementById("enable-toggler");
  const $fsToggle = document.getElementById("fast-fullscreen-toggle");
  const $status = document.getElementById("status");

  function updateStatus() {
    const mainEnabled = $enableToggler.checked;
    const fsEnabled = $fsToggle.checked;
    
    if (mainEnabled) {
      if (fsEnabled) {
        $status.textContent = "✅ Full optimization active";
        $status.className = "status active";
      } else {
        $status.textContent = "⚡ Basic optimization active";
        $status.className = "status active";
      }
    } else {
      $status.textContent = "❌ Extension disabled";
      $status.className = "status";
    }
  }

  // Основной переключатель
  if ($enableToggler) {
    $enableToggler.addEventListener("change", function (event) {
      const enabled = event.target.checked;
      
      context.runtime.sendMessage({
        type: "SET_STATE",
        key: "enable",
        value: enabled ? "true" : "false"
      }, function(response) {
        if (context.runtime.lastError) {
          console.error("Error setting state:", context.runtime.lastError);
        }
      });
      
      // Включаем/отключаем переключатель быстрого полноэкранного режима
      if ($fsToggle) {
        $fsToggle.disabled = !enabled;
        if (!enabled) {
          $fsToggle.checked = false;
          localStorage.setItem('fastFullscreen', 'false');
        } else {
          $fsToggle.checked = localStorage.getItem('fastFullscreen') !== 'false';
        }
      }
      
      updateStatus();
    });
  }

  // Переключатель быстрого полноэкранного режима
  if ($fsToggle) {
    $fsToggle.addEventListener("change", function (event) {
      const enabled = event.target.checked;
      localStorage.setItem('fastFullscreen', enabled.toString());
      
      context.runtime.sendMessage({
        type: "TOGGLE_FULLSCREEN_OPTIMIZATION",
        enabled: enabled
      }, function(response) {
        if (context.runtime.lastError) {
          console.error("Error toggling fullscreen optimization:", context.runtime.lastError);
        }
      });
      
      updateStatus();
    });
  }

  // Загрузка состояния при открытии попапа
  function loadState() {
    context.runtime.sendMessage({ type: "GET_STATE" }, function (state) {
      if (context.runtime.lastError) {
        console.error("Error loading state:", context.runtime.lastError);
        // Устанавливаем значения по умолчанию
        if ($enableToggler) $enableToggler.checked = true;
        if ($fsToggle) {
          $fsToggle.disabled = false;
          $fsToggle.checked = localStorage.getItem('fastFullscreen') !== 'false';
        }
      } else {
        // Устанавливаем состояние основного переключателя
        if ($enableToggler) {
          $enableToggler.checked = state.enable === "true";
        }
        
        // Устанавливаем состояние переключателя быстрого полноэкранного режима
        if ($fsToggle) {
          const mainEnabled = state.enable === "true";
          $fsToggle.disabled = !mainEnabled;
          
          if (mainEnabled) {
            $fsToggle.checked = localStorage.getItem('fastFullscreen') !== 'false';
          } else {
            $fsToggle.checked = false;
          }
        }
      }
      
      updateStatus();
    });
  }

  // Инициализация
  loadState();

})(window.browser || window.chrome);