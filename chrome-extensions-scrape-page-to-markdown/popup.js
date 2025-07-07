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
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: "scrapeContent",
          options: options,
          isPreview: isPreview,
        },
        function (response) {
          if (chrome.runtime.lastError) {
            status.textContent = "Error: " + chrome.runtime.lastError.message;
            return;
          }

          if (response && response.success) {
            if (isPreview) {
              // Open preview in a new window
              const previewWindow = window.open(
                "",
                "_blank",
                "width=800,height=600,scrollbars=yes"
              );
              previewWindow.document.write(`
              <!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Markdown Preview</title>
                <style>
                  body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    max-width: 800px; 
                    margin: 0 auto; 
                    padding: 20px; 
                    line-height: 1.6;
                    background: #f5f5f5;
                  }
                  .container {
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  }
                  pre { 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 5px; 
                    overflow-x: auto;
                    border-left: 4px solid #007acc;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                  }
                  h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
                  .actions {
                    margin-bottom: 20px;
                    text-align: center;
                  }
                  button {
                    background: #007acc;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 0 5px;
                  }
                  button:hover { background: #005a9e; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>📝 Markdown Preview</h1>
                  <div class="actions">
                    <button onclick="copyToClipboard()">📋 Copy to Clipboard</button>
                    <button onclick="downloadFile()">💾 Download File</button>
                  </div>
                  <pre id="markdown-content">${response.markdown
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")}</pre>
                </div>
                <script>
                  const markdownContent = ${JSON.stringify(response.markdown)};
                  const filename = ${JSON.stringify(options.filename)};
                  
                  function copyToClipboard() {
                    navigator.clipboard.writeText(markdownContent).then(() => {
                      alert('Markdown copied to clipboard!');
                    });
                  }
                  
                  function downloadFile() {
                    const blob = new Blob([markdownContent], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename + '.md';
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                </script>
              </body>
              </html>
            `);
              status.textContent = "Preview opened!";
            } else {
              // Download the file
              chrome.downloads.download({
                url: response.downloadUrl,
                filename: options.filename + ".md",
                saveAs: true,
              });
              status.textContent = "Download started!";
            }
          } else {
            status.textContent =
              "Error: " + (response?.error || "Failed to scrape content");
          }
        }
      );
    });
  }
});
