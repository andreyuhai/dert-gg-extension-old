import { Socket } from "./phoenix/index.js"

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

async function checkAuth(token) {
  const AUTH_URL = await authURL();

  const RESP = await sendAuthReq(AUTH_URL, token);

  if (RESP.ok) {
    return {authenticated: true}
  } else {
    return {authenticated: false}
  }
}

function changeAppState({authenticated}) {
  chrome.storage.local.set({isAuthenticated: authenticated}, function() {
    changeIcon({isAuthenticated: authenticated});
  });
}

function changeIcon({isAuthenticated}) {
  if (isAuthenticated) {
    chrome.action.setIcon({path: AUTHENTICATED_ICONSET})
  } else {
    chrome.action.setIcon({path: UNAUTHENTICATED_ICONSET})
  }
}


/******************** URL FUNCTIONS ********************/

async function votesURL() {
  const BASE_URL = await baseURL();

  return new URL("votes", BASE_URL);
}

async function authURL() {
  const BASE_URL = await baseURL();

  return new URL("auth", BASE_URL);
}

async function baseURL() {
  const EXTENSION_INFO = await chrome.management.getSelf();

  return new URL("https://dert.gg/api/v1/")
}

/******************** CHROME RUNTIME LISTENERS ********************/

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({buttonName: "derdini sikeyim"});
});

let channels = [];

chrome.runtime.onMessage.addListener(
   function(request, sender, sendResponse) {
    if (request.type == "isAuthenticated") {
      chrome.storage.local.get("isAuthenticated", function({isAuthenticated}) {
        sendResponse({isAuthenticated});
      })
    } else if (request.type == "upvote") {
      chrome.storage.local.get(["isAuthenticated", "token"], function({isAuthenticated, token}) {
        if (token) {
          votesURL()
            .then(url => {
              sendUpvoteReq(url, token, request.params)
                .then(response => handleUpvoteResponse(response, sendResponse));
            });
        }
      })

    } else if (request.type == "getVotes") {

    } else if (request.type == "join") {
      console.log("Got join request for channel: ", request.room)

      let channel = socket.channel(request.room, {})

      channel.join()
	.receive("ok", resp => { channels = [...channels, channel] })
	.receive("error", resp => { console.log("Unable to join", resp) })

    } else if (request.type == "leave") {
      console.log("Got leave request for channel: ", request.room)

      channels.find(({topic}) => topic == request.room).leave()
	.receive("ok", resp => { console.log("Left successfully", resp) })
	.receive("error", resp => { console.log("Unable to leave", resp) })
    }

    //  If you want to asynchronously use sendResponse,
    //  add return true; to the onMessage event handler,
    // which is what we do above.
    return true;
  }
)

chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if (request.token)
      chrome.storage.local.set({token: request.token}, function() {
        checkAuth(request.token)
          .then(data => changeAppState(data))
      });
  }
);

/******************** POPUP ONCLICK LISTENER ********************/

chrome.action.onClicked.addListener(() => {
  chrome.storage.local.get("token", ({token}) => {
    if (token)
      chrome.tabs.create({url: "https://dert.gg"})
    else
      chrome.tabs.create({url: "https://dert.gg/login/new"})
  })
})

/******************** ON START UP ********************/

chrome.storage.local.get("token", ({token}) => {
  if (token)
    checkAuth(token)
      .then(data => changeAppState(data))
  else
    changeAppState({authenticated: false})
})


/******************** RESPONSE HANDLER ********************/

async function handleUpvoteResponse(response, sendResponse) {
  const RESP = await response.json();

  if (response.ok) {
    // Do something related to upvote or downvote here
    sendResponse(RESP);
  } else if (response.status == 401) {
    sendResponse({auth: "unauth"});
    changeAppState({authenticated: false});
  }
}


/******************** REQUESTS ********************/

async function sendAuthReq(authURL, token) {
  return fetch(authURL, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

async function sendUpvoteReq(votesURL, token, requestParams) {
  return fetch(votesURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(requestParams)
  });
}

async function sendGetVotesReq(votesURL, token, requestParams) {
  return fetch(votesURL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(requestParams)
  });
}

/******************** WEBSOCKET ********************/

let socket = new Socket("ws://localhost:4000/socket", {params: {token: "foobar"}})

socket.connect()

console.log(socket)
console.log("socket connected")
