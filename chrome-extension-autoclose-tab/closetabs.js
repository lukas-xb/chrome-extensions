// Function to close tabs containing "openai" or "chatgpt" in the URL
function closeMatchingTabs() {
  // Get all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id && tab.url) {
        // Close the tab if it contains "openai" or "chatgpt" in the URL
        if (tab.url.includes("openai") || tab.url.includes("chatgpt")) {
          chrome.tabs.remove(tab.id, () => {
            if (chrome.runtime.lastError) {
              console.error(
                `Error closing tab ${tab.id}:`,
                chrome.runtime.lastError.message
              );
            }
          });
        }
      }
    });
  });
}

// Run the function periodically (e.g., every 5 minutes)
setInterval(closeMatchingTabs, 5 * 60 * 1000);
