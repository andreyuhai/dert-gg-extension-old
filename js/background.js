import { Socket } from "./phoenix/index.js"

const UNAUTHENTICATED_ICONSET = {
  "16": "/img/droplet_unauthenticated_16.png",
  "24": "/img/droplet_unauthenticated_24.png",
  "32": "/img/droplet_unauthenticated_32.png",
  "64": "/img/droplet_unauthenticated_64.png",
  "128": "/img/droplet_unauthenticated_128.png",
  "256": "/img/droplet_unauthenticated_256.png",
  "512": "/img/droplet_unauthenticated_512.png"
};

const AUTHENTICATED_ICONSET = {
  "16": "/img/droplet_16.png",
  "24": "/img/droplet_24.png",
  "32": "/img/droplet_32.png",
  "64": "/img/droplet_64.png",
  "128": "/img/droplet_128.png",
  "256": "/img/droplet_256.png",
  "512": "/img/droplet_512.png"
};

let jwt;

// Whenever the JWT changes we assign it to the variable instead of trying to fetch
// if from the storage every time we need it.
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.jwt) {
    console.log("JWT has changed", changes, "in namespace", namespace)
    jwt = changes.jwt.newValue;
  }
});

// This is so that on startup we fetch the JWT and set it.
// Otherwise JWT would be undefined, until we get & set a new one.
chrome.runtime.onStartup.addListener(() => {
  console.log('Setting JWT now');
  chrome.storage.local.get('jwt', (result) => {
    console.log('Old value of JWT', jwt);
    jwt = result.jwt;
    console.log('New value of JWT', jwt);
  });
});

// Once we receive the token from the web application we store it in the local storage
// and try to connect to the socket.
chrome.runtime.onMessageExternal.addListener(
  function(msg, sender, sendResponse) {
    if (msg.jwt) {
      console.log("Got the token biatch", msg.jwt)
      chrome.storage.local.set({jwt: msg.jwt});
    }
  }
);

let socket = new Socket("ws://localhost:4000/socket");
socket.connect();

console.log(socket)
console.log("socket connected")

function changeIcon({isAuthenticated}) {
  if (isAuthenticated) {
    chrome.action.setIcon({path: AUTHENTICATED_ICONSET})
  } else {
    chrome.action.setIcon({path: UNAUTHENTICATED_ICONSET})
  }
}

/******************** CHROME RUNTIME LISTENERS ********************/

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({buttonName: "derdini sikeyim"});
});

chrome.runtime.onMessage.addListener(
   function(request, sender, sendResponse) {
    if (request.type == "getVotes") {

    } else if (request.type == "join") {
      console.log("Got join request for channel: ", request.topic)

      let channel = socket.channel(request.topic, {jwt: jwt})

      channel.join()
	.receive("ok", resp => { console.log("Joined successfully", resp); dispatch_initial_votes_to_tabs(resp, channel); })
	.receive("error", resp => { console.log("Unable to join", resp) })

      channel.on("vote_count_changed", payload => dispatch_event_to_tabs(payload, channel));

    } else if (request.type == "leave") {
      console.log("Got leave request for channel: ", request.topic)

      find_channel(request.topic)?.leave()
	.receive("ok", resp => { console.log("Left successfully", resp) })
	.receive("error", resp => { console.log("Unable to leave", resp) })
    }

    //  If you want to asynchronously use sendResponse,
    //  add return true; to the onMessage event handler,
    // which is what we do above.
    return true;
  }
)

chrome.runtime.onMessage.addListener(
  function (msg, sender, sendResponse) {
    switch (msg.type) {
      case "upvote":
	console.log("Got upvote request with entry_id:", msg.entryId)
	upvote(msg.entryId, msg.topic);
	break;
      case "unvote":
	console.log("Got unvote request with entry_id:", msg.entryId)
	unvote(msg.entryId, msg.topic)
	break;
    }
  }
);

function find_channel(topic) {
  return socket.channels.find(channel => channel.topic == topic);
}

function upvote(entry_id, topic) {
  let found = find_channel(topic);
  console.log("Pushing", found?.push("upvote", {entry_id: entry_id, jwt: jwt}));
}

function unvote(entry_id, topic) {
  let found = find_channel(topic);
  console.log("Pushing", found?.push("unvote", {entry_id: entry_id, jwt: jwt}));
}

// Once we get an event from the web app, we need to push those events
// to the tabs that are related.
function dispatch_event_to_tabs(payload, channel) {
  let topic_id = get_topic_id(channel);

  chrome.tabs.query({url: [`*://eksisozluk2023.com/*${topic_id}*`]}, (tabs) => {
    console.log("Found tabs: ", tabs)
    tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, {...payload, ...{type: 'vote_count_changed'}}));
  });
}

function dispatch_initial_votes_to_tabs(payload, channel) {
  let topic_id = get_topic_id(channel);

  chrome.tabs.query({url: [`*://eksisozluk2023.com/*${topic_id}*`]}, (tabs) => {
    console.log("Found tabs vote counts dispatch: ", tabs)
    tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, {type: 'set_initial_vote_counts', vote_counts: payload}));
  });
}

function get_topic_id(channel) {
  return channel.topic.split(":")[1];
}

/******************** POPUP ONCLICK LISTENER ********************/

chrome.action.onClicked.addListener(() => {
  chrome.storage.local.get("token", ({token}) => {
    if (token)
      chrome.tabs.create({url: "https://dert.gg"})
    else
      chrome.tabs.create({url: "https://dert.gg/login/new"})
  })
})
