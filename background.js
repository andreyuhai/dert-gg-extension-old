let buttonName = "derdini sikeyim";

chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.sync.set({ buttonName });
});

var appState = {
    isToggled: false,
    isAuthenticated: false,
    accountInfo: {
        emailConfirmed: true
    }
};

chrome.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(msg) {
    // console.log(msg);
    if (msg.request === "appState")
      port.postMessage({response: "appState", appState: appState});
  });
});

// TODO: Here receive the token and save into the local storage
chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if (request.token)
      chrome.storage.local.set({"token": request.token}, function() {
        checkAuth(request.token)
          .then(data => changeAppState(data))
      });

      chrome.storage.local.get("token", function(obj) {
        console.log(obj);
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
