// Saves options to chrome.storage
function saveOptions() {
  let buttonName = document.getElementById('buttonName').value;

  chrome.storage.sync.set({
    buttonName: buttonName
  }, showSuccess);
}

function showSuccess() {
  let status = document.getElementById('status');
  status.textContent = 'Buton adı kaydedildi, açık olan Ekşisözlük sayfalarını yenilemeyi unutma!';
  status.style.display = 'block';

  setTimeout(() => {
    status.style.display = 'none';
  }, 2500);
}

function restoreOptions() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    buttonName,
  }, function(items) {
    document.getElementById('buttonName').value = items.buttonName;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveButton').addEventListener('click', saveOptions);
