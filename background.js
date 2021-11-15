const UNAUTHENTICATED_ICONSET = {
  "16": "/img/droplet_unauthenticated_16.png",
  "24": "/img/droplet_unauthenticated_24.png",
  "32": "/img/droplet_unauthenticated_32.png",
  "64": "/img/droplet_unauthenticated_64.png",
  "128": "/img/droplet_unauthenticated_128.png",
  "256": "/img/droplet_unauthenticated_256.png",
  "512": "/img/droplet_unauthenticated_512.png"
}

const AUTHENTICATED_ICONSET = {
  "16": "/img/droplet_16.png",
  "24": "/img/droplet_24.png",
  "32": "/img/droplet_32.png",
  "64": "/img/droplet_64.png",
  "128": "/img/droplet_128.png",
  "256": "/img/droplet_256.png",
  "512": "/img/droplet_512.png"
}

let buttonName = "derdini sikeyim";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ buttonName });
});

var appState = {
  isAuthenticated: false,
};

chrome.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(msg) {
    // console.log(msg);
    if (msg.request === "appState")
      port.postMessage({response: "appState", appState: appState});
  });
});

chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if (request.token)
      chrome.storage.local.set({"token": request.token}, function() {
        checkAuth(request.token)
          .then(data => changeAppState(data))
          .then(data => changeIcon(data))
      });
  }
);

async function checkAuth(token) {
  const AUTH_URL = await authURL();

  const RESP = await fetch(AUTH_URL, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  const RESP_JSON = RESP.json();

  return RESP_JSON;
}

function changeAppState({authorized, data}) {
  if (authorized) {
    appState.isAuthenticated = true;
    appState.accountInfo = data;
  }

  return {authorized, data}
}

function changeIcon({authorized, data}) {
  if (authorized) {
    chrome.action.setIcon({path: AUTHORIZED_ICONSET})
  } else {
    chrome.action.setIcon({path: UNAUTHORIZED_ICONSET})
  }
}

async function authURL() {
  const BASE_URL = await baseURL();

  return new URL("auth", BASE_URL);
}

async function baseURL() {
  const EXTENSION_INFO = await chrome.management.getSelf();

  if (EXTENSION_INFO.installType == "development") {
    return new URL("http://localhost:4000/api/v1/")
  } else {
    return new URL("https://dert.gg/api/v1/")
  }
}
