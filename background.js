"use strict";

const BASE_URL = "https://www.youtube.com";
const GOOGLEBOT_USERAGENT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
let browser = window.browser || window.chrome;
let globalState = null;

// ======== ОБНОВЛЕННЫЙ КОД ДЛЯ БЛОКИРОВКИ VP9/AV1 ======== //
const VP9_BLOCKED_ITAGS = [272, 313, 315, 271, 308, 303, 299, 305, 266, 264, 138];
const AV1_BLOCKED_ITAGS = [394, 395, 396, 397, 398, 399];
const HDR_BLOCKED_ITAGS = [330, 331, 332, 333, 334, 335, 336, 337];

function shouldBlockVP9AV1(url) {
  const urlParams = new URL(url).searchParams;
  const itag = urlParams.get('itag');
  
  if (!itag) return false;
  
  const itagNum = parseInt(itag);
  return VP9_BLOCKED_ITAGS.includes(itagNum) || 
         AV1_BLOCKED_ITAGS.includes(itagNum) || 
         HDR_BLOCKED_ITAGS.includes(itagNum);
}

// Блокируем VP9/AV1/HDR видео
browser.webRequest.onBeforeRequest.addListener(
  details => {
    try {
      if (!globalState || globalState.enable !== "true") return;
      if (shouldBlockVP9AV1(details.url)) {
        console.log("[H264ify] Blocking non-H264 format, itag:", getItagFromUrl(details.url));
        return { cancel: true };
      }
    } catch (e) {
      console.error("[H264ify] Error:", e);
    }
  },
  { urls: ["*://*.googlevideo.com/*"] },
  ["blocking"]
);

function getItagFromUrl(url) {
  const match = url.match(/itag=(\d+)/);
  return match ? match[1] : 'unknown';
}

// Блокируем лишние ресурсы для экономии процессора
browser.webRequest.onBeforeRequest.addListener(
  details => {
    try {
      if (!globalState || globalState.enable !== "true") return;
      
      const url = details.url;
      // Блокируем аналитику, рекламу и тяжелые скрипты
      const blockPatterns = [
        '/pagead/',
        '/doubleclick.',
        'googletagmanager',
        'google-analytics',
        'googlesyndication',
        '/generate_204',
        '/log_event',
        'youtube.com/youtubei/v1/log',
        'youtube.com/api/stats'
      ];
      
      if (blockPatterns.some(pattern => url.includes(pattern))) {
        console.log("[WeakPC] Blocking resource:", url.slice(0, 50) + "...");
        return { cancel: true };
      }
    } catch (e) {
      console.error("[WeakPC] Error:", e);
    }
  },
  { urls: ["*://*.youtube.com/*", "*://*.google.com/*", "*://googletagmanager.com/*"] },
  ["blocking"]
);
// ======== КОНЕЦ БЛОКИРОВКИ VP9/AV1 ======== //

// ======== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======== //
function parsePrefs(prefsStr) {
  return prefsStr.split("&").map((pref) => pref.split("="));
}

function joinPrefs(prefs) {
  return prefs.map((pref) => pref.join("=")).join("&");
}

function ensureRequiredPref(prefs) {
  let exists = prefs.reduce((x, pref) => {
    if (pref[0] === "f6") {
      return true;
    } else {
      return x;
    }
  }, false);

  return exists ? prefs : prefs.concat([["f6", ""]]);
}

function extractPrefByKey(prefs, key) {
  return prefs.find((pref) => pref[0] === key);
}

function modifyPrefIfRequired(pref, state) {
  if (state.enable === "true" && !matchLastBit(pref[1], ["8", "9"])) {
    pref[1] = replaceLastBit(pref[1], "8");
  } else if (state.enable !== "true" && !matchLastBit(pref[1], ["0", "1"])) {
    pref[1] = replaceLastBit(pref[1], "0");
  }
}

function matchLastBit(str, chars) {
  if (!str) return false;
  let lastBit = str.substr(-1);
  return chars.includes(lastBit);
}

function replaceLastBit(str, char) {
  return str ? str.slice(0, -1) + char : char;
}

function getStoredState(cb) {
  browser.storage.local.get(["enable", "homepage", "method"], (result) => {
    cb({
      enable: result.enable || "true",
      homepage: result.homepage || "home",
      method: result.method || "useragent",
    });
  });
}

function setState(key, value, cb) {
  browser.storage.local.set({ [key]: value }, () => {
    if (cb) cb();
  });
}

function reloadGlobalState() {
  getStoredState((state) => {
    globalState = state;
  });
}

function detectChromeMajorVersion() {
  let version = /Chrome\/([0-9]+)/.exec(navigator.userAgent);
  return version ? parseInt(version[1]) : -1;
}

function onBeforeSendHeadersOptions() {
  let options = ["blocking", "requestHeaders", "extraHeaders"];
  if (detectChromeMajorVersion() < 71) {
    options.pop(); // Удаляем extraHeaders
  }
  return options;
}

function onResponseStartedOptions() {
  let options = ["responseHeaders", "extraHeaders"];
  if (detectChromeMajorVersion() < 71) {
    options.pop(); // Удаляем extraHeaders
  }
  return options;
}
// ======== КОНЕЦ ВСПОМОГАТЕЛЬНЫХ ФУНКЦИЙ ======== //

// ======== ОБРАБОТЧИКИ ЗАПРОСОВ YOUTUBE ======== //
browser.webRequest.onBeforeRequest.addListener(
  function handleOnBeforeRequest(details) {
    if (globalState === null) return;
    if (globalState.enable !== "true") return;
    if (globalState.method !== "redirect") return;

    let [baseUrl, queryString] = details.url.split("?");
    let queryParams = queryString ? queryString.split("&") : [];

    let disablePolymerExists = queryParams.some(param => 
      param.includes("disable_polymer")
    );

    if (!disablePolymerExists) {
      queryParams.push("disable_polymer=1");
      return { redirectUrl: baseUrl + "?" + queryParams.join("&") };
    }
  },
  { urls: [BASE_URL + "/*"], types: ["main_frame"] },
  ["blocking"]
);

browser.webRequest.onBeforeSendHeaders.addListener(
  function handleOnBeforeSendHeaders(details) {
    if (globalState === null) return;
    if (globalState.enable !== "true") return;
    if (globalState.method !== "cookie" && globalState.method !== "useragent") {
      return;
    }

    if (globalState.method === "cookie") {
      let cookieHeader = details.requestHeaders.find(
        (header) => header.name.toLowerCase() === "cookie"
      );

      if (!cookieHeader) {
        cookieHeader = { name: "Cookie", value: "" };
        details.requestHeaders.push(cookieHeader);
      }

      try {
        let cookieStore = new CookieStore(cookieHeader.value);
        let prefs = cookieStore.getItem("PREF", "");
        let parsedPrefs = parsePrefs(prefs);
        parsedPrefs = ensureRequiredPref(parsedPrefs);

        let f6Pref = extractPrefByKey(parsedPrefs, "f6");
        if (f6Pref) {
          modifyPrefIfRequired(f6Pref, globalState);
        } else {
          parsedPrefs.push(["f6", "8"]);
        }

        cookieStore.setItem("PREF", joinPrefs(parsedPrefs));
        cookieHeader.value = cookieStore.stringify();
      } catch (e) {
        console.error("Cookie processing error:", e);
      }
    }

    if (globalState.method === "useragent") {
      let userAgentHeader = details.requestHeaders.find(
        (header) => header.name.toLowerCase() === "user-agent"
      );

      if (!userAgentHeader) {
        userAgentHeader = { name: "User-Agent", value: navigator.userAgent };
        details.requestHeaders.push(userAgentHeader);
      }

      userAgentHeader.value = GOOGLEBOT_USERAGENT;
    }

    return { requestHeaders: details.requestHeaders };
  },
  { urls: [BASE_URL + "/*"], types: ["main_frame"] },
  onBeforeSendHeadersOptions()
);

browser.webRequest.onResponseStarted.addListener(
  function handleOnResponseStarted(details) {
    if (globalState === null) return;
    if (globalState.enable !== "true") return;
    if (globalState.homepage !== "subscriptions") return;

    let setCookieHeader = details.responseHeaders.find(
      (header) => header.name.toLowerCase() === "set-cookie"
    );

    if (setCookieHeader) {
      browser.tabs.update(details.tabId, {
        url: BASE_URL + "/feed/subscriptions",
      });
    }
  },
  { urls: [BASE_URL + "/"], types: ["main_frame"] },
  onResponseStartedOptions()
);
// ======== КОНЕЦ ОБРАБОТЧИКОВ ЗАПРОСОВ ======== //

// ======== ОБРАБОТКА СООБЩЕНИЙ ======== //
browser.runtime.onMessage.addListener(function handleOnMessage(msg, sender, sendResponse) {
  switch (msg.type) {
    case "GET_STATE":
      getStoredState(sendResponse);
      return true; // Асинхронный ответ
      
    case "SET_STATE":
      setState(msg.key, msg.value, () => {
        reloadGlobalState();
        sendResponse({ status: "ok" });
      });
      return true;
      
    case "TOGGLE_FULLSCREEN_OPTIMIZATION":
      browser.tabs.query({active: true, currentWindow: true}, tabs => {
        if (tabs[0] && tabs[0].id && tabs[0].url && tabs[0].url.includes('youtube.com')) {
          browser.tabs.sendMessage(tabs[0].id, {
            action: msg.enabled ? "ENABLE_FULLSCREEN_OPTIM" : "DISABLE_FULLSCREEN_OPTIM"
          }, response => {
            // Игнорируем ошибки, если контент-скрипт еще не загружен
            if (browser.runtime.lastError) {
              console.log("Content script not ready:", browser.runtime.lastError.message);
            }
          });
        }
      });
      return true;
  }
});
// ======== КОНЕЦ ОБРАБОТКИ СООБЩЕНИЙ ======== //

// Инициализация состояния
reloadGlobalState();