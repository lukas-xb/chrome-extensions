// preview.js - Handle markdown preview functionality

let markdownContent = "";
let filename = "";

document.addEventListener("DOMContentLoaded", function () {
  const copyBtn = document.getElementById("copyBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const closeBtn = document.getElementById("closeBtn");
  const contentDiv = document.getElementById("content");
  const statusDiv = document.getElementById("status");

  // Load preview data from storage
  loadPreviewData();

  // Event listeners
  copyBtn.addEventListener("click", copyToClipboard);
  downloadBtn.addEventListener("click", downloadFile);
  closeBtn.addEventListener("click", closePreview);

  function loadPreviewData() {
    chrome.storage.local.get(["previewData"], function (result) {
      if (result.previewData) {
        const data = result.previewData;

        // Check if data is not too old (5 minutes)
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          markdownContent = data.markdown;
          filename = data.filename;
          displayPreview();

          // Clear the storage after loading
          chrome.storage.local.remove(["previewData"]);
        } else {
          showError("Preview data has expired. Please generate a new preview.");
        }
      } else {
        showError("No preview data found. Please generate a new preview.");
      }
    });
  }

  function displayPreview() {
    if (!markdownContent) {
      showError("No markdown content available.");
      return;
    }

    // Create metadata section
    const metadata = document.createElement("div");
    metadata.className = "metadata";
    metadata.innerHTML = `
      <strong>Filename:</strong> ${escapeHtml(filename)}.md<br>
      <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
      <strong>Size:</strong> ${formatFileSize(new Blob([markdownContent]).size)}
    `;

    // Create markdown content section
    const markdownContainer = document.createElement("div");
    markdownContainer.className = "markdown-container";

    const markdownPre = document.createElement("pre");
    markdownPre.className = "markdown-content";
    markdownPre.textContent = markdownContent;

    markdownContainer.appendChild(markdownPre);

    // Update content
    contentDiv.innerHTML = "";
    contentDiv.appendChild(metadata);
    contentDiv.appendChild(markdownContainer);
  }

  function copyToClipboard() {
    if (!markdownContent) {
      showStatus("No content to copy!", "error");
      return;
    }

    navigator.clipboard
      .writeText(markdownContent)
      .then(() => {
        showStatus("Markdown copied to clipboard!", "success");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        showStatus("Failed to copy to clipboard", "error");

        // Fallback method
        try {
          const textArea = document.createElement("textarea");
          textArea.value = markdownContent;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand("copy");
          textArea.remove();
          showStatus("Markdown copied to clipboard!", "success");
        } catch (fallbackErr) {
          showStatus("Copy failed - please select and copy manually", "error");
        }
      });
  }

  function downloadFile() {
    if (!markdownContent) {
      showStatus("No content to download!", "error");
      return;
    }

    try {
      const blob = new Blob([markdownContent], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = (filename || "page-content") + ".md";
      a.style.display = "none";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(url), 100);

      showStatus("Download started!", "success");
    } catch (err) {
      console.error("Download failed: ", err);
      showStatus("Download failed", "error");
    }
  }

  function closePreview() {
    // Close the current tab
    chrome.tabs.getCurrent(function (tab) {
      if (tab) {
        chrome.tabs.remove(tab.id);
      } else {
        // Fallback for when getCurrent doesn't work
        window.close();
      }
    });
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.classList.remove("hidden");

    // Hide status after 3 seconds
    setTimeout(() => {
      statusDiv.classList.add("hidden");
    }, 3000);
  }

  function showError(message) {
    contentDiv.innerHTML = `
      <div class="error">
        <h3>⚠️ Error</h3>
        <p>${escapeHtml(message)}</p>
        <button onclick="window.close()" style="margin-top: 15px;">Close</button>
      </div>
    `;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
});
