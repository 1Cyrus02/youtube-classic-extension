// js/h264-inject.js
// MAIN world: блокируем VP9/AV1, заставляем YouTube выбирать H.264.

(function() {
  if (window.__L4Y_H264_PATCHED__) return;
  window.__L4Y_H264_PATCHED__ = true;

  const BLOCKED = ['vp09', 'vp9', 'av01', 'av1'];

  // MediaSource.isTypeSupported
  if (window.MediaSource && typeof window.MediaSource.isTypeSupported === 'function') {
    const origMST = window.MediaSource.isTypeSupported.bind(window.MediaSource);
    window.MediaSource.isTypeSupported = function(type) {
      try {
        const t = (type || '').toLowerCase();
        for (const b of BLOCKED) if (t.includes(b)) return false;
      } catch {}
      return origMST(type);
    };
  }

  // HTMLMediaElement.canPlayType
  const vp = HTMLMediaElement.prototype;
  const origCPT = vp.canPlayType;
  vp.canPlayType = function(type) {
    try {
      const t = (type || '').toLowerCase();
      for (const b of BLOCKED) if (t.includes(b)) return '';
    } catch {}
    return origCPT.call(this, type);
  };

  console.log('[Lite4YouTube][inject] VP9/AV1 blocked → H.264 preferred.');
})();
