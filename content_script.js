// lite4youtube content script (short)
// Runs at document_start so codec patch applies before YT player init.
(() => {
  if (window.__lite4youtube_loaded__) return;
  window.__lite4youtube_loaded__ = true;

  // ---- Force H.264 (adapted from h264ify approach) ----
  const blocked = ['vp09', 'vp8', 'av01'];
  const origCanPlayType = HTMLMediaElement.prototype.canPlayType;
  HTMLMediaElement.prototype.canPlayType = function(type) {
    if (type) {
      for (const c of blocked) {
        if (type.toLowerCase().includes(c)) return '';
      }
    }
    return origCanPlayType.call(this, type);
  };
  const origIsTypeSupported = MediaSource.isTypeSupported;
  MediaSource.isTypeSupported = function(type) {
    if (type) {
      for (const c of blocked) {
        if (type.toLowerCase().includes(c)) return false;
      }
    }
    return origIsTypeSupported.call(this, type);
  };

  // ---- Inject CSS once ----
  const css = `
    /* Hide heavy stuff ONLY while fullscreen class is present */
    html.l4y-fs #secondary,
    html.l4y-fs #comments,
    html.l4y-fs #related,
    html.l4y-fs ytd-watch-next-secondary-results-renderer,
    html.l4y-fs ytd-live-chat-frame,
    html.l4y-fs #chat-container {
      display:none !important;
    }
    /* Lighten player UI a bit */
    .ytp-chrome-bottom { backdrop-filter:none !important; -webkit-backdrop-filter:none !important; }
    .ytp-hover-progress .ytp-thumbnail-overlay-image { display:none !important; }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.documentElement.appendChild(style);

  // ---- Fast fullscreen toggle ----
  function onFSChange() {
    const isFS = document.fullscreenElement ||
                 document.webkitFullscreenElement ||
                 document.mozFullScreenElement ||
                 document.msFullscreenElement;
    document.documentElement.classList.toggle('l4y-fs', !!isFS);
  }
  ['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange']
    .forEach(ev => document.addEventListener(ev, onFSChange, {passive:true}));

  // Also catch click on player fullscreen btn (YT sometimes delays FS event)
  const fsObs = new MutationObserver(() => {
    const btn = document.querySelector('.ytp-fullscreen-button:not([data-l4y])');
    if (!btn) return;
    btn.dataset.l4y = '1';
    btn.addEventListener('click', () => setTimeout(onFSChange, 50), {passive:true});
  });
  fsObs.observe(document.documentElement, {subtree:true, childList:true});

  console.log('[lite4youtube] content script loaded');
})();
