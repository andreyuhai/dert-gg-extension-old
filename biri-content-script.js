function createDerdiniGGElement() {
	let spanElem = document.createElement("span");
	spanElem.classList.add("derdini-gg");

	let aElem = document.createElement("a");
	chrome.storage.sync.get("buttonName", ({ buttonName }) => {
		aElem.innerText = buttonName;
	});

	spanElem.append(aElem);
	return spanElem;
}

// Select the node that will be observed for mutations
let targetNode = document.getElementById('profile-stats-section-content');

// Options for the observer (which mutations to observe)
let config = { childList: true, subtree: true };

// Callback function to execute when mutations are observed
let callback = function(mutationsList) {
	for(let mutation of mutationsList) {
		let addedNode = mutation.addedNodes[0];
		if (addedNode.localName == 'span' && (addedNode.className == 'favorite-links')) {
			addedNode.append(createDerdiniGGElement());
		}
	}
};

// Create an observer instance linked to the callback function
var observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(targetNode, config);

// Later, you can stop observing
// observer.disconnect();
