document.addEventListener("DOMContentLoaded", () => {
  const bulkDeleteBtn = document.getElementById("bulk-delete-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  console.log("Popup loaded, buttons:", { bulkDeleteBtn, cancelBtn });

  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener("click", () => {
      console.log("Bulk delete button clicked");
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log("Sending enableBulkDelete message to tab:", tabs[0].id);
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "enableBulkDelete" },
          (response) => {
            console.log("Response from enableBulkDelete:", response);
            // Change to delete mode
            bulkDeleteBtn.textContent = "Delete Selected";
            bulkDeleteBtn.style.background = "#ff5722";
            cancelBtn.classList.add("show");

            bulkDeleteBtn.onclick = () => {
              console.log("Delete Selected button clicked");
              chrome.tabs.sendMessage(
                tabs[0].id,
                { action: "bulkDelete" },
                (resp) => {
                  console.log("Response from bulkDelete:", resp);
                  // Reset to initial state
                  resetToInitialState();
                }
              );
            };
          }
        );
      });
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      console.log("Cancel button clicked");
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "disableBulkDelete" },
          (response) => {
            console.log("Response from disableBulkDelete:", response);
            resetToInitialState();
          }
        );
      });
    });
  }

  function resetToInitialState() {
    bulkDeleteBtn.textContent = "Enable Bulk Delete";
    bulkDeleteBtn.style.background = "#d32f2f";
    cancelBtn.classList.remove("show");
    // Reset the click handler
    bulkDeleteBtn.onclick = null;
    setTimeout(() => {
      location.reload(); // Reload popup to reset state completely
    }, 500);
  }
});
