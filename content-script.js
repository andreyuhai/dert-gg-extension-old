class Entry {

	constructor(entryNode) {
		this.node = entryNode;
		this.attributes = entryNode.attributes;
		this.dertGGButton = new DertGGButton(this.toJSON());
	}

	get author() {
		return this.attributes["data-author"].value;
	}

	get authorId() {
		return this.attributes["data-author-id"].value;
	}

	get contentHTML() {
		return this.#entryContentDiv()
			.innerHTML
			.trim();
	}

	get contentText() {
		return this.#entryContentDiv()
			.textContent
			.trim();
	}

	get entryDate() {
		return document.evaluate(".//a[@class='entry-date permalink']",
			this.node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null)
			.singleNodeValue
			.text
			.trim();
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

	#entryContentDiv() {
		return document.evaluate(".//div[contains(@class, 'content')]",
			this.node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null)
			.singleNodeValue
	}

	appendDertGGButton() {
		document.evaluate(".//div[@class='feedback']",
			this.node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null)
			.singleNodeValue
			.append(this.dertGGButton.span);
	}

	removeDertGGButton() {
		this.dertGGButton.remove();
	}

	toJSON() {
		return {
			"author": this.author,
			"author-id": this.authorId,
			"entry-id": this.entryId,
			"entry-timestamp": this.entryDate,
			"favorite-count": this.favoriteCount,
			"html-content": this.contentHTML,
			"text-content": this.contentText,
			"topic-url": this.topicURL
		}
	}
}

class DertGGButton {

	constructor(reqParams) {
		this.span = this.createSpanElem({className: "dert-gg"});
		this.anchor = this.createAnchorElem(reqParams);
		this.countSpan = this.createSpanElem({className: "dert-gg-count"});

		this.span.append(this.anchor);
		this.span.append(this.countSpan);
	}

	createSpanElem(opts = {}) {
		let span = document.createElement("span");

		if (opts["className"]) {
			span.className = opts["className"];
		}

		return span;
	}

	createAnchorElem(reqParams) {
		let a = document.createElement("a");
		chrome.storage.sync.get("buttonName", ({ buttonName }) => {
			a.innerText = buttonName;
		});

		a.addEventListener("click", (e) => {
			chrome.runtime.sendMessage({type: "upvote", params: reqParams}, response => this.upvoteResponseHandler(this, response));
		});

		return a;
	}

	upvoteResponseHandler(elem, {auth, "vote-count": voteCount}) {
		if(auth) {
			ENTRIES.forEach(entry => entry.removeDertGGButton());
		} else {
			elem.setGGCount(voteCount);
		}
	}

	remove() {
		this.span.remove();
	}

	setGGCount(count) {
		if (count ==  0) {
			this.countSpan.innerText = "";
		} else {
			this.countSpan.innerText = ` (${count})`;
		}
	}
}

const ENTRIES = [];

function run() {
	chrome.runtime.sendMessage({type: "isAuthenticated"}, function({isAuthenticated}) {
		if (isAuthenticated) {
			let nodes = document.evaluate("//ul[@id='entry-item-list']/li", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

			for (let i = 0; i < nodes.snapshotLength; i++) {
				let node = nodes.snapshotItem(i);
				let entry = new Entry(node);
				ENTRIES.push(entry);
				console.log(JSON.stringify(entry))
				entry.appendDertGGButton();
			}
		}

		console.log(ENTRIES);
		console.log(ENTRIES.map(entry => entry.entryId));
	});
}

function getVotes() {
	let entryIds = ENTRIES.map(entry => entry.entryId);

	chrome.runtime.sendMessage({type: "getVotes", entryIds: entryIds}, function(response) {
		console.log("Here's the response", response);
	});
}

run();
