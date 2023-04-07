// A function that clears the contents of the section element with id
// content-body
function clearContent() {
  let content = document.getElementById("topic");
  content.innerHTML = "";
}

// A function that finds the ul element  with
// id quick-index-nav
function addbutton() {
  let firstButton = document.getElementById("quick-index-nav").firstElementChild;
  let clonedButton = firstButton.cloneNode(true);

  clonedButton.firstElementChild.innerText = "dgg";
  clonedButton.firstElementChild.href = "#";
  clonedButton.firstElementChild.addEventListener("click", clearContent);

  firstButton.insertAdjacentElement("afterend", clonedButton);
};


addbutton();
