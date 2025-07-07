// background.js - Service worker for the extension

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Page to Markdown extension installed");
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle any background processing if needed
  return true;
});

// Context menu integration (optional)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "scrapeToMarkdown",
    title: "Scrape page to Markdown",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "scrapeToMarkdown") {
    // Open popup or trigger scraping directly
    chrome.action.openPopup();
  }
});
