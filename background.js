const readyTabs = new Set();

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.ready && sender.tab?.id) {
    readyTabs.add(sender.tab.id);
  }

  if (msg.action === "extract" || msg.action === "fill") {
    for (const tabId of readyTabs) {
      chrome.tabs.sendMessage(tabId, msg);
    }
  }
});
