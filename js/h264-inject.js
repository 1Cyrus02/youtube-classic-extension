// h264-inject.js  (MAIN world)
//
// Выполняется прямо на странице YouTube.
// Блокирует VP9/AV1, чтобы сайт выбрал H.264 (AVC).
// Основано на принципе расширения h264ify. :contentReference[oaicite:6]{index=6}

(function() {
  if (window.__L4Y_H264_PATCH__) return;
  window.__L4Y_H264_PATCH__ = true;

  var BLOCKED = ['vp09', 'vp9', 'av01', 'av1']; // строки, которые встречаются в типах MIME кодеков

  // MediaSource.isTypeSupported
  if (window.MediaSource && typeof window.MediaSource.isTypeSupported === 'function') {
    var _origIsTypeSupported = window.MediaSource.isTypeSupported.bind(window.MediaSource);
    window.MediaSource.isTypeSupported = function(type) {
      try {
        if (type) {
          var t = type.toLowerCase();
          for (var i=0; i<BLOCKED.length; i++) {
            if (t.indexOf(BLOCKED[i]) !== -1) {
              return false;
            }
          }
        }
      } catch (e) {}
      return _origIsTypeSupported(type);
    };
  }

  // HTMLMediaElement.prototype.canPlayType
  var _videoProto = HTMLMediaElement.prototype;
  var _origCanPlayType = _videoProto.canPlayType;
  _videoProto.canPlayType = function(type) {
    try {
      if (type) {
        var t = type.toLowerCase();
        for (var i=0; i<BLOCKED.length; i++) {
          if (t.indexOf(BLOCKED[i]) !== -1) {
            return '';
          }
        }
      }
    } catch (e) {}
    return _origCanPlayType.call(this, type);
  };

  console.log('[Lite4YouTube][inject] VP9/AV1 blocked; H.264 preferred. (h264ify-style patch)');
})();
