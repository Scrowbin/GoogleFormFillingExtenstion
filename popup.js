document.addEventListener("DOMContentLoaded", () => {
  const loadingDiv = document.getElementById("loading");
  const controlsDiv = document.getElementById("controls");

  const extractBtn = document.getElementById("extract");
  const fillBtn = document.getElementById("fill");

  function checkContentScript() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;

      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "PING" },
        (response) => {
          if (chrome.runtime.lastError || !response?.ready) {
            loadingDiv.textContent = "You're not on Google Forms";
            return;
          }
          loadingDiv.style.display = "none";
          controlsDiv.style.display = "block";
        }
      );
    });
  }

  checkContentScript();

  function sendToActiveTab(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, message);
    });
  }

  extractBtn.addEventListener("click", () => {
    sendToActiveTab({ action: "extract" });
  });

  fillBtn.addEventListener("click", () => {
    sendToActiveTab({ action: "fill" });
  });
});