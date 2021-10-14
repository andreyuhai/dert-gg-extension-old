class Topic {
	constructor(topicNode) {
		this.node = topicNode;
	}

	get topicName() {
		return this.topicNameFromNode();
	}

	get topicURL() {
		return this.topicURLFromNode();
	}

	topicNameFromNode() {
		return document.evaludate(".//h1", this.node, null, XpathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerHTML;
	}
}

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
		return this.node.children[0].innerHTML;
	}

	get entryDate() {
		return this.node.children[1].children[1].children[0].text;
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
			console.log(JSON.stringify(this));
		});

		span.append(a)
		this.node.children[1].children[0].append(span);
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

function createDertGGElement() {
	let spanElem = document.createElement("span");
	spanElem.classList.add("derdini-gg");

	let aElem = document.createElement("a");
	chrome.storage.sync.get("buttonName", ({ buttonName }) => {
		aElem.innerText = buttonName;
	});

	aElem.addEventListener("click", (e) => {
		let entryNode = e.target.closest("li");
		let entry = new Entry(entryNode);

		console.log(JSON.stringify(entry));
	});

	spanElem.append(aElem);
	return spanElem;
}

function appendDertGGElements() {
	let nodes = document.evaluate("//ul[@id='entry-item-list']/li", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

	for (let i = 0; i < nodes.snapshotLength; i++) {
		let node = nodes.snapshotItem(i);
		let footer = node.getElementsByClassName("feedback")[0];
		footer.append(createDertGGElement());
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
