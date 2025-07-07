// popup.js - Handle popup UI interactions

document.addEventListener("DOMContentLoaded", function () {
  const filenameInput = document.getElementById("filename");
  const includeTitle = document.getElementById("includeTitle");
  const includeUrl = document.getElementById("includeUrl");
  const includeImages = document.getElementById("includeImages");
  const includeLinks = document.getElementById("includeLinks");
  const includeMeta = document.getElementById("includeMeta");
  const previewBtn = document.getElementById("previewBtn");
  const scrapeBtn = document.getElementById("scrapeBtn");
  const status = document.getElementById("status");

  // Load saved settings
  chrome.storage.local.get(["scrapeSettings"], function (result) {
    if (result.scrapeSettings) {
      const settings = result.scrapeSettings;
      includeTitle.checked = settings.includeTitle !== false;
      includeUrl.checked = settings.includeUrl !== false;
      includeImages.checked = settings.includeImages !== false;
      includeLinks.checked = settings.includeLinks !== false;
      includeMeta.checked = settings.includeMeta || false;
    }
  });

  // Save settings when changed
  function saveSettings() {
    const settings = {
      includeTitle: includeTitle.checked,
      includeUrl: includeUrl.checked,
      includeImages: includeImages.checked,
      includeLinks: includeLinks.checked,
      includeMeta: includeMeta.checked,
    };
    chrome.storage.local.set({ scrapeSettings: settings });
  }

  [includeTitle, includeUrl, includeImages, includeLinks, includeMeta].forEach(
    (checkbox) => {
      checkbox.addEventListener("change", saveSettings);
    }
  );

  // Get current tab info and set default filename
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) {
      const title = tabs[0].title || "webpage";
      const sanitizedTitle = title
        .replace(/[^a-zA-Z0-9\-_\s]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase();
      filenameInput.value = sanitizedTitle || "page-content";
    }
  });

  // Preview markdown
  previewBtn.addEventListener("click", function () {
    status.textContent = "Generating preview...";
    scrapePageContent(true);
  });

  // Download markdown
  scrapeBtn.addEventListener("click", function () {
    status.textContent = "Scraping page...";
    scrapePageContent(false);
  });

  function scrapePageContent(isPreview) {
    const options = {
      includeTitle: includeTitle.checked,
      includeUrl: includeUrl.checked,
      includeImages: includeImages.checked,
      includeLinks: includeLinks.checked,
      includeMeta: includeMeta.checked,
      filename: filenameInput.value || "page-content",
    };

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) {
        status.textContent = "Error: No active tab found";
        return;
      }

      const tabId = tabs[0].id;

      // Check if we can access the tab (some pages like chrome:// are restricted)
      if (
        tabs[0].url &&
        (tabs[0].url.startsWith("chrome://") ||
          tabs[0].url.startsWith("chrome-extension://") ||
          tabs[0].url.startsWith("edge://") ||
          tabs[0].url.startsWith("about:"))
      ) {
        status.textContent = "Error: Cannot access this type of page";
        return;
      }

      // Function to send message and handle response
      function sendMessage() {
        chrome.tabs.sendMessage(
          tabId,
          {
            action: "scrapeContent",
            options: options,
            isPreview: isPreview,
          },
          function (response) {
            if (chrome.runtime.lastError) {
              console.error("Message error:", chrome.runtime.lastError);
              status.textContent = "Error: " + chrome.runtime.lastError.message;
              return;
            }

            if (response && response.success) {
              if (isPreview) {
                // Store data temporarily and open preview page
                chrome.storage.local.set(
                  {
                    previewData: {
                      markdown: response.markdown,
                      filename: options.filename,
                      timestamp: Date.now(),
                    },
                  },
                  function () {
                    // Open preview page using chrome.tabs.create for better security
                    chrome.tabs.create({
                      url: chrome.runtime.getURL("preview.html"),
                      active: true,
                    });
                  }
                );
                status.textContent = "Preview opened!";
              } else {
                // Use direct download with blob URL
                const blob = new Blob([response.markdown], {
                  type: "text/markdown",
                });
                const url = URL.createObjectURL(blob);

                chrome.downloads.download(
                  {
                    url: url,
                    filename: options.filename + ".md",
                    saveAs: true,
                  },
                  function (downloadId) {
                    if (chrome.runtime.lastError) {
                      status.textContent =
                        "Download error: " + chrome.runtime.lastError.message;
                    } else {
                      status.textContent = "Download started!";
                    }
                    // Clean up the blob URL
                    setTimeout(() => URL.revokeObjectURL(url), 100);
                  }
                );
              }
            } else {
              status.textContent =
                "Error: " + (response?.error || "Failed to scrape content");
            }
          }
        );
      }

      // Try to inject the content script first, then send message
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          files: ["content.js"],
        },
        function (injectionResults) {
          if (chrome.runtime.lastError) {
            console.log(
              "Content script injection note:",
              chrome.runtime.lastError.message
            );
          }

          // Wait a bit for script to initialize, then send message
          setTimeout(sendMessage, 100);
        }
      );
    });
  }
});
