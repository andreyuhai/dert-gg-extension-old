class Entry {

	constructor(entryNode) {
		this.node = entryNode;
		this.attributes = entryNode.attributes;
	}

	get author() {
		return this.attributes["data-author"].value;
	}

	get authorId() {
		return this.attributes["data-author-id"].value;
	}

	get content() {
		return document.evaluate(".//div[contains(@class, 'content')]",
			this.node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null)
			.singleNodeValue
			.innerHTML;
	}

	get entryDate() {
		return document.evaluate(".//a[@class='entry-date permalink']",
			this.node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null)
			.singleNodeValue
			.text;
	}

	get entryId() {
		return this.attributes["data-id"].value;
	}

	get favoriteCount() {
		return this.attributes["data-favorite-count"].value;
	}

	get topicURL() {
		return this.attributes["data-id"].baseURI;
	}

	appendDertGGButton() {
		let span = document.createElement("span");
		span.className = "derdini-gg"

		let a = document.createElement("a");
		chrome.storage.sync.get("buttonName", ({ buttonName }) => {
			console.log(buttonName);
			a.innerText = buttonName;
		});

		a.addEventListener("click", (e) => {
			alert(JSON.stringify(this));
		});

		span.append(a)
		document.evaluate(".//div[@class='feedback']",
			this.node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null)
			.singleNodeValue
			.append(span);
	}

	toJSON() {
		return {
			author: this.author,
			authorId: this.authorId,
			content: this.content,
			entryDate: this.entryDate,
			entryId: this.entryId,
			favoriteCount: this.favoriteCount,
			topicURL: this.topicURL
		}
	}
}

function run() {
	let nodes = document.evaluate("//ul[@id='entry-item-list']/li", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

	for (let i = 0; i < nodes.snapshotLength; i++) {
		let node = nodes.snapshotItem(i);
		let entry = new Entry(node);
		console.log(JSON.stringify(entry))
		entry.appendDertGGButton();
	}
}

let appState;

var port = chrome.runtime.connect({name: "content"});
port.postMessage({request: "appState"});

port.onMessage.addListener(function(msg) {
	if (msg.response === "appState") {
		appState = msg.appState;
		// Append elements only if the user is authenticated
		// if (appState.isAuthenticated) {
			// appendDertGGElements();
		  run();
		// }
	}
});
