let appState;

var port = chrome.runtime.connect({name: "popup"});
port.postMessage({request: "appState"});

port.onMessage.addListener(function(msg) {
	console.log(msg)
	if (msg.response === "appState") {
		appState = msg.appState;
		let body = document.getElementsByTagName('body')[0];
		let a = document.createElement("a");
		a.innerText = JSON.stringify(appState);
		body.append(a);
	}
});
