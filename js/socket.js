function getRoom() {
  let url = document.URL
  let roomNum = url.match(/--(\d+)/)

  return roomNum ? "room:" + roomNum[1] : "room:lobby"
}

chrome.runtime.sendMessage({type: "join", room: getRoom()})

window.addEventListener("beforeunload", () => {
  chrome.runtime.sendMessage({type: "leave", room: getRoom()})
})
