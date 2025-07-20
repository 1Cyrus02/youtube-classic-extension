"use strict";

const BASE_URL = "https://www.youtube.com";
const GOOGLEBOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const browserAPI = chrome || browser;

// --- user settings defaults ---
const defaults = {
  enable: true,
  blockAnalytics: true,
  hardBlockVp9Av1: false,    // if true, cancel those requests
  classicMode: false          // if true, spoof UA / disable_polymer
};

let state = {...defaults};

// load state
browserAPI.storage.local.get(defaults, data => { state = {...defaults, ...data}; });

// save helper
function save(k, v) {
  state[k] = v;
  const obj = {}; obj[k] = v;
  browserAPI.storage.local.set(obj);
}

// ----- resource filters -----
const ANALYTICS_PATTERNS = [
  "/pagead/",
  "/doubleclick.",
  "googletagmanager",
  "google-analytics",
  "googlesyndication",
  "/generate_204",
  "/log_event",
  "youtube.com/youtubei/v1/log",
  "youtube.com/api/stats"
];

// itags for VP9/AV1/HDR (subset; keep list small)
const NON_H264_ITAGS = [272,313,315,271,308,303,299,305,266,264,138,394,395,396,397,398,399];

function shouldBlockNonH264(url) {
  const m = /[?&]itag=(\d+)/.exec(url);
  return m && NON_H264_ITAGS.includes(parseInt(m[1],10));
}

// block analytics / heavy logging
browserAPI.webRequest.onBeforeRequest.addListener(
  details => {
    if (!state.enable || !state.blockAnalytics) return;
    const u = details.url;
    if (ANALYTICS_PATTERNS.some(p => u.includes(p))) {
      console.log("[lite4youtube] block analytics:", u);
      return {cancel:true};
    }
  },
  {urls:["*://*.youtube.com/*","*://*.google.com/*","*://*.googletagmanager.com/*"]},
  ["blocking"]
);

// optional hard block VP9/AV1
browserAPI.webRequest.onBeforeRequest.addListener(
  details => {
    if (!state.enable || !state.hardBlockVp9Av1) return;
    if (shouldBlockNonH264(details.url)) {
      console.log("[lite4youtube] cancel non-H264 stream:", details.url);
      return {cancel:true};
    }
  },
  {urls:["*://*.googlevideo.com/*"]},
  ["blocking"]
);

// classic mode: disable_polymer + Googlebot UA + PREF cookie tweak
browserAPI.webRequest.onBeforeRequest.addListener(
  d => {
    if (!state.enable || !state.classicMode) return;
    if (d.type !== "main_frame") return;
    const url = new URL(d.url);
    if (!url.searchParams.has("disable_polymer")) {
      url.searchParams.set("disable_polymer","1");
      return {redirectUrl: url.toString()};
    }
  },
  {urls:[BASE_URL+"/*"], types:["main_frame"]},
  ["blocking"]
);

browserAPI.webRequest.onBeforeSendHeaders.addListener(
  d => {
    if (!state.enable || !state.classicMode) return;
    const headers = d.requestHeaders;
    // spoof UA
    let ua = headers.find(h=>h.name.toLowerCase()==="user-agent");
    if (!ua) { ua = {name:"User-Agent", value: navigator.userAgent}; headers.push(ua); }
    ua.value = GOOGLEBOT_UA;
    // tweak PREF cookie f6 bit similar to youtube-classic
    let ck = headers.find(h=>h.name.toLowerCase()==="cookie");
    if (!ck) { ck = {name:"Cookie", value:""}; headers.push(ck); }
    if (!/PREF=/.test(ck.value)) ck.value += (ck.value?"; ":"")+"PREF=f6=8";
    return {requestHeaders:headers};
  },
  {urls:[BASE_URL+"/*"], types:["main_frame"]},
  ["blocking","requestHeaders","extraHeaders"]
);

// message handling from popup (enable/disable etc.)
browserAPI.runtime.onMessage.addListener((msg, sender, sendResp) => {
  if (msg.type === "SET") {
    save(msg.key, msg.value);
    sendResp({ok:true});
  } else if (msg.type === "GET") {
    sendResp(state);
  }
  return true;
});
