const UNAUTHORIZED_ICONSET = {
  "16": "/img/droplet_unauthenticated_16.png",
  "24": "/img/droplet_unauthenticated_24.png",
  "32": "/img/droplet_unauthenticated_32.png",
  "64": "/img/droplet_unauthenticated_64.png",
  "128": "/img/droplet_unauthenticated_128.png",
  "256": "/img/droplet_unauthenticated_256.png",
  "512": "/img/droplet_unauthenticated_512.png"
}

const AUTHORIZED_ICONSET = {
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
  const resp =
    await (fetch("http://localhost:4000/auth", {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.json()))

  return resp;
}

function changeAppState({authorized, data}) {
  if (authorized) {
    appState.isAuthenticated = true;
    appState.accountInfo = data;
  }
}
