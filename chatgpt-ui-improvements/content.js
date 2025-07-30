const style = document.createElement("link");
style.rel = "stylesheet";
style.href = chrome.runtime.getURL("styles.css");
document.head.appendChild(style);

console.log("ChatGPT Bulk Delete content script loaded"); // Top-level log

// Listen for messages from popup.js to enable bulk delete and perform deletion
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request.action);
  if (request.action === "enableBulkDelete") {
    addCheckboxes();
    addBulkDeleteButton();
    startObservingForNewMessages();
    sendResponse({ status: "checkboxes-added" });
  }
  if (request.action === "bulkDelete") {
    // Disconnect MutationObserver to prevent infinite loop during bulk delete
    stopObservingForNewMessages();

    // Find all message links with checkboxes and delete selected ones
    const messageLinks = Array.from(document.querySelectorAll("a.__menu-item"));
    const selectedMessages = messageLinks.filter((msg) => {
      const cb = msg.querySelector(".bulk-delete-checkbox");
      return cb && cb.checked;
    });
    console.log(
      "Bulk delete: Found selected messages:",
      selectedMessages.length
    );

    // Sequential deletion helper
    function deleteNextMessage(index) {
      if (index >= selectedMessages.length) {
        // All done, reconnect observer
        startObservingForNewMessages();
        sendResponse({ status: "deleted" });
        return;
      }
      const msg = selectedMessages[index];
      const optionsBtn = msg.querySelector(
        'button[data-testid^="history-item-"][data-testid$="-options"]'
      );
      const messageId = optionsBtn
        ? optionsBtn
            .getAttribute("data-testid")
            .match(/history-item-(\d+)-options/)?.[1]
        : "unknown";
      console.log(
        `Deleting message with ID: ${messageId} (array index: ${index})`
      );

      if (optionsBtn) {
        optionsBtn.click();
        setTimeout(() => {
          const allMenuButtons = document.querySelectorAll(
            '[role="menuitem"], [data-testid*="delete"], button[data-testid*="menu"]'
          );
          console.log(
            "Available menu items:",
            Array.from(allMenuButtons).map((btn) => ({
              testId: btn.getAttribute("data-testid"),
              text: btn.textContent?.trim(),
              element: btn,
            }))
          );

          const deleteBtn =
            document.querySelector('[data-testid="delete-chat-menu-item"]') ||
            document.querySelector(
              '[data-testid="delete-conversation-menu-item"]'
            ) ||
            document.querySelector('[data-testid="delete-menu-item"]') ||
            document.querySelector('[role="menuitem"]') ||
            Array.from(
              document.querySelectorAll('button, [role="menuitem"]')
            ).find((btn) => btn.textContent?.toLowerCase().includes("delete"));

          console.log(
            "Found delete button:",
            deleteBtn?.getAttribute("data-testid") || deleteBtn?.textContent
          );

          if (deleteBtn) {
            deleteBtn.click();
            setTimeout(() => {
              const confirmButton = document.querySelector(
                '[data-testid="delete-conversation-confirm-button"]'
              );
              if (confirmButton) {
                confirmButton.click();
                console.log(`Confirmed deletion for message ID: ${messageId}`);
              } else {
                console.log(
                  `Confirmation button not found for message ID: ${messageId}`
                );
              }
              // Wait for DOM to update before next deletion
              setTimeout(() => deleteNextMessage(index + 1), 400);
            }, 120);
          } else {
            console.log(`Delete button not found for message ID: ${messageId}`);
            setTimeout(() => deleteNextMessage(index + 1), 400);
          }
        }, 220);
      } else {
        console.log(`Options button not found for message at index: ${index}`);
        setTimeout(() => deleteNextMessage(index + 1), 400);
      }
    }

    // Start sequential deletion
    deleteNextMessage(0);
  }
  if (request.action === "disableBulkDelete") {
    console.log("Disabling bulk delete mode");
    removeCheckboxes();
    removeBulkDeleteButton();
    stopObservingForNewMessages();
    sendResponse({ status: "bulk-delete-disabled" });
  }
});

function getMessages() {
  return Array.from(
    document.querySelectorAll(
      '[data-testid^="history-item-"][data-testid$="-options"]'
    )
  )
    .map(
      (btn) =>
        btn.closest("a.__menu-item") ||
        btn.closest("li, .history-row, .history-item") ||
        btn.parentElement
    )
    .filter(Boolean);
}

function addCheckboxes() {
  const messageLinks = Array.from(
    document.querySelectorAll("a.__menu-item")
  ).filter((msg) => msg.closest("#history"));
  console.log("Found message links:", messageLinks.length);
  messageLinks.forEach((msg, idx) => {
    if (msg.querySelector(".bulk-delete-checkbox")) return;

    // Create a wrapper div for the checkbox
    const checkboxWrapper = document.createElement("div");
    checkboxWrapper.className = "bulk-delete-checkbox-wrapper";
    checkboxWrapper.style.cssText = `
      position: absolute;
      left: 8px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      pointer-events: auto;
    `;

    // Create and insert checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "bulk-delete-checkbox";
    checkbox.style.cssText = `
      width: 16px;
      height: 16px;
      cursor: pointer;
      margin: 0;
      pointer-events: auto;
    `;

    // Add click event to prevent link navigation
    checkbox.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    checkboxWrapper.appendChild(checkbox);

    // Make the message link relatively positioned and add padding for checkbox
    msg.style.position = "relative";
    msg.style.paddingLeft = "32px";

    // Insert the checkbox wrapper
    msg.insertBefore(checkboxWrapper, msg.firstChild);
  });
}

function addBulkDeleteButton() {
  if (document.getElementById("bulk-delete-btn")) return;

  // Create main bulk delete button
  const btn = document.createElement("button");
  btn.id = "bulk-delete-btn";
  btn.textContent = "Bulk Delete";
  btn.className = "bulk-delete-btn";
  btn.onclick = () => {
    // Sequential page bulk delete logic
    const messageLinks = Array.from(document.querySelectorAll("a.__menu-item"));
    const selectedMessages = messageLinks.filter((msg) => {
      const cb = msg.querySelector(".bulk-delete-checkbox");
      return cb && cb.checked;
    });
    console.log(
      "Page Bulk delete: Found selected messages:",
      selectedMessages.length
    );

    function deleteNextMessage(index) {
      if (index >= selectedMessages.length) {
        console.log("Page bulk delete complete.");
        return;
      }
      const msg = selectedMessages[index];
      const optionsBtn = msg.querySelector(
        'button[data-testid^="history-item-"][data-testid$="-options"]'
      );
      const messageId = optionsBtn
        ? optionsBtn
            .getAttribute("data-testid")
            .match(/history-item-(\d+)-options/)?.[1]
        : "unknown";
      console.log(
        `Deleting message with ID: ${messageId} (array index: ${index})`
      );

      if (optionsBtn) {
        optionsBtn.click();
        setTimeout(() => {
          const allMenuButtons = document.querySelectorAll(
            '[role="menuitem"], [data-testid*="delete"], button[data-testid*="menu"]'
          );
          console.log(
            "Page: Available menu items:",
            Array.from(allMenuButtons).map((btn) => ({
              testId: btn.getAttribute("data-testid"),
              text: btn.textContent?.trim(),
              element: btn,
            }))
          );

          const deleteBtn =
            document.querySelector('[data-testid="delete-chat-menu-item"]') ||
            document.querySelector(
              '[data-testid="delete-conversation-menu-item"]'
            ) ||
            document.querySelector('[data-testid="delete-menu-item"]') ||
            document.querySelector('[role="menuitem"]') ||
            Array.from(
              document.querySelectorAll('button, [role="menuitem"]')
            ).find((btn) => btn.textContent?.toLowerCase().includes("delete"));

          console.log(
            "Page: Found delete button:",
            deleteBtn?.getAttribute("data-testid") || deleteBtn?.textContent
          );

          if (deleteBtn) {
            deleteBtn.click();
            setTimeout(() => {
              const confirmButton = document.querySelector(
                '[data-testid="delete-conversation-confirm-button"]'
              );
              if (confirmButton) {
                confirmButton.click();
                console.log(
                  `Page confirmed deletion for message ID: ${messageId}`
                );
              } else {
                console.log(
                  `Page: Confirmation button not found for message ID: ${messageId}`
                );
              }
              // Wait for DOM to update before next deletion
              setTimeout(() => deleteNextMessage(index + 1), 400);
            }, 120);
          } else {
            console.log(`Delete button not found for message ID: ${messageId}`);
            setTimeout(() => deleteNextMessage(index + 1), 400);
          }
        }, 1000);
      } else {
        console.log(`Options button not found for message at index: ${index}`);
        setTimeout(() => deleteNextMessage(index + 1), 400);
      }
    }

    // Start sequential deletion
    deleteNextMessage(0);
  };

  // Create cancel button
  const cancelBtn = document.createElement("button");
  cancelBtn.id = "cancel-bulk-delete-btn";
  cancelBtn.textContent = "Cancel";
  cancelBtn.className = "cancel-bulk-delete-btn";
  cancelBtn.onclick = () => {
    removeCheckboxes();
    removeBulkDeleteButton();
    console.log("Bulk delete mode cancelled via page button");
  };

  // Add both buttons to the page
  document.body.appendChild(btn);
  document.body.appendChild(cancelBtn);
}

function removeCheckboxes() {
  // Remove all checkboxes and their wrappers
  const checkboxWrappers = document.querySelectorAll(
    ".bulk-delete-checkbox-wrapper"
  );
  checkboxWrappers.forEach((wrapper) => wrapper.remove());

  // Reset padding on message links
  const messageLinks = document.querySelectorAll("a.__menu-item");
  messageLinks.forEach((msg) => {
    msg.style.paddingLeft = "";
    msg.style.position = "";
  });

  console.log("Removed all checkboxes");
}

function removeBulkDeleteButton() {
  const existingBtn = document.getElementById("bulk-delete-btn");
  if (existingBtn) {
    existingBtn.remove();
    console.log("Removed bulk delete button");
  }

  const existingCancelBtn = document.getElementById("cancel-bulk-delete-btn");
  if (existingCancelBtn) {
    existingCancelBtn.remove();
    console.log("Removed cancel button");
  }
}

// Global variable to store the observer
let messageObserver = null;

function startObservingForNewMessages() {
  if (messageObserver) return; // Already observing

  const historyContainer = document.getElementById("history");
  if (!historyContainer) {
    console.log("History container not found, retrying in 1 second");
    setTimeout(startObservingForNewMessages, 1000);
    return;
  }

  messageObserver = new MutationObserver((mutations) => {
    let newMessagesAdded = false;

    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          // Check if the added node contains message links
          if (node.nodeType === Node.ELEMENT_NODE) {
            const newMessageLinks = node.querySelectorAll
              ? node.querySelectorAll("a.__menu-item")
              : [];
            if (
              newMessageLinks.length > 0 ||
              (node.matches && node.matches("a.__menu-item"))
            ) {
              newMessagesAdded = true;
            }
          }
        });
      }
    });

    if (newMessagesAdded) {
      console.log("New messages detected, adding checkboxes");
      addCheckboxes(); // This will only add checkboxes to messages that don't already have them
    }
  });

  // Observe the history container for changes
  messageObserver.observe(historyContainer, {
    childList: true,
    subtree: true,
  });

  console.log("Started observing for new messages");
}

function stopObservingForNewMessages() {
  if (messageObserver) {
    messageObserver.disconnect();
    messageObserver = null;
    console.log("Stopped observing for new messages");
  }
}
