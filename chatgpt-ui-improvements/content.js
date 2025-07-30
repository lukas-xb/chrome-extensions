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
      
      // Try multiple selectors to find the options button
      const optionsBtn = 
        msg.querySelector('button[data-testid^="history-item-"][data-testid$="-options"]') ||
        msg.querySelector('button[data-testid*="options"]') ||
        msg.querySelector('button[data-testid*="menu"]') ||
        msg.querySelector('button[aria-label*="menu"]') ||
        msg.querySelector('button[aria-label*="options"]') ||
        msg.querySelector('button[title*="menu"]') ||
        msg.querySelector('button[title*="options"]') ||
        msg.querySelector('svg[data-testid*="menu"]')?.closest('button') ||
        msg.querySelector('svg[data-testid*="options"]')?.closest('button') ||
        msg.querySelector('[role="button"][data-testid*="menu"]') ||
        msg.querySelector('[role="button"][data-testid*="options"]');
      
      // Debug: Log all buttons in the message to help identify the correct selector
      if (!optionsBtn) {
        console.log('Options button not found, available buttons in message:', 
          Array.from(msg.querySelectorAll('button, [role="button"]')).map(btn => ({
            tagName: btn.tagName,
            testId: btn.getAttribute('data-testid'),
            ariaLabel: btn.getAttribute('aria-label'),
            title: btn.getAttribute('title'),
            text: btn.textContent?.trim(),
            className: btn.className
          }))
        );
      }
      
      const messageId = optionsBtn
        ? optionsBtn
            .getAttribute("data-testid")
            .match(/history-item-(\d+)-options/)?.[1]
        : "unknown";
      console.log(
        `Deleting message with ID: ${messageId} (array index: ${index})`
      );

      if (optionsBtn) {
        // Scroll message into view and simulate mouse hover
        msg.scrollIntoView({ block: "center", behavior: "instant" });
        
        // Wait a bit for scroll to complete
        setTimeout(() => {
          // Simulate hover events on the message container
          ["pointerover", "mouseenter", "mouseover"].forEach((evtType) => {
            const evt = new MouseEvent(evtType, {
              bubbles: true,
              cancelable: true,
              view: window,
              relatedTarget: null,
            });
            msg.dispatchEvent(evt);
            // Also dispatch on all child elements
            msg.querySelectorAll("*").forEach((child) => {
              child.dispatchEvent(evt);
            });
          });
          
          // Wait for hover effects to take place
          setTimeout(() => {
            // Ensure the button is visible and enabled
            optionsBtn.focus();
            
                         // Try more realistic event simulation
             const simulateRealClick = () => {
               // Method 1: Try to trigger the button's click handler directly
               if (optionsBtn.onclick) {
                 try {
                   optionsBtn.onclick.call(optionsBtn);
                   console.log(`Triggered onclick handler for message ID: ${messageId}`);
                 } catch (error) {
                   console.log(`onclick handler failed:`, error);
                 }
               }
               
               // Method 2: Try to find and trigger React event handlers
               const reactKey = Object.keys(optionsBtn).find(key => key.startsWith('__reactProps$'));
               if (reactKey) {
                 const reactProps = optionsBtn[reactKey];
                 if (reactProps.onClick) {
                   try {
                     reactProps.onClick();
                     console.log(`Triggered React onClick for message ID: ${messageId}`);
                   } catch (error) {
                     console.log(`React onClick failed:`, error);
                   }
                 }
               }
               
                               // Method 3: Try to find and trigger any event listeners (if available in dev tools)
                try {
                  if (typeof getEventListeners === 'function') {
                    const eventListeners = getEventListeners(optionsBtn);
                    if (eventListeners && eventListeners.click) {
                      eventListeners.click.forEach(listener => {
                        try {
                          listener.listener.call(optionsBtn);
                          console.log(`Triggered event listener for message ID: ${messageId}`);
                        } catch (error) {
                          console.log(`Event listener failed:`, error);
                        }
                      });
                    }
                  }
                } catch (error) {
                  console.log(`getEventListeners not available:`, error);
                }
               
                               // Method 4: Try to dispatch events with more realistic properties
                const createRealisticEvent = (type) => {
                  const event = new MouseEvent(type, {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    detail: 1,
                    screenX: 100,
                    screenY: 100,
                    clientX: 100,
                    clientY: 100,
                    ctrlKey: false,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    button: 0,
                    relatedTarget: null
                  });
                  
                  return event;
                };
                
                // Dispatch events in the correct sequence
                const events = ['mouseenter', 'mouseover', 'mousedown', 'mouseup', 'click'];
                events.forEach((eventType, index) => {
                  setTimeout(() => {
                    const event = createRealisticEvent(eventType);
                    optionsBtn.dispatchEvent(event);
                    console.log(`Dispatched ${eventType} for message ID: ${messageId}`);
                  }, index * 10);
                });
                
                // Method 5: Try to access internal event handlers directly
                try {
                  // Look for any internal event handler properties
                  const internalProps = Object.getOwnPropertyNames(optionsBtn);
                  const eventProps = internalProps.filter(prop => 
                    prop.includes('on') || prop.includes('click') || prop.includes('handler')
                  );
                  
                  console.log(`Found ${eventProps.length} potential event properties:`, eventProps);
                  
                  // Try to call any found event handlers
                  eventProps.forEach(prop => {
                    try {
                      const handler = optionsBtn[prop];
                      if (typeof handler === 'function') {
                        handler.call(optionsBtn);
                        console.log(`Called internal handler: ${prop} for message ID: ${messageId}`);
                      }
                    } catch (error) {
                      console.log(`Failed to call ${prop}:`, error);
                    }
                  });
                } catch (error) {
                  console.log(`Failed to access internal properties:`, error);
                }
             };
             
                                        // Try the realistic click simulation
             simulateRealClick();
             
             // NEW: Try simplified menu opening approach
             openMenuSimplified(optionsBtn);
             
             // NEW: Try direct Radix UI trigger
             triggerRadixMenuDirect(optionsBtn);
             
             // NEW: Try direct Radix UI menu component manipulation
             forceRadixMenuComponent(optionsBtn);
             
             // NEW: Wait for menu to open and then find delete button
             waitForMenuAndDelete(optionsBtn, messageId, index, deleteNextMessage);
            }, 100);
         }, 100);
         
         // Increase delay to give menu time to open
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
            // Simulate a real user click, the .click() doesn't work
            ["mousedown", "mouseup", "click"].forEach((evtType) => {
              const evt = new MouseEvent(evtType, {
                bubbles: true,
                cancelable: true,
                view: window,
              });
              deleteBtn.dispatchEvent(evt);
            });
            // Retry loop for confirmation button
            let confirmTries = 0;
            const maxTries = 20; // 20 x 100ms = 2s
            function tryConfirm() {
              const confirmButton = document.querySelector(
                '[data-testid="delete-conversation-confirm-button"]'
              );
              if (confirmButton) {
                confirmButton.click();
                console.log(`Confirmed deletion for message ID: ${messageId}`);
                setTimeout(() => deleteNextMessage(index + 1), 400);
              } else if (confirmTries < maxTries) {
                confirmTries++;
                setTimeout(tryConfirm, 100);
              } else {
                console.log(
                  `Confirmation button not found for message ID: ${messageId} after retrying.`
                );
                setTimeout(() => deleteNextMessage(index + 1), 400);
              }
            }
            tryConfirm();
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
        // Scroll message into view and simulate mouse hover
        msg.scrollIntoView({ block: "center", behavior: "instant" });
        
        // Wait a bit for scroll to complete
        setTimeout(() => {
          // Simulate hover events on the message container
          ["pointerover", "mouseenter", "mouseover"].forEach((evtType) => {
            const evt = new MouseEvent(evtType, {
              bubbles: true,
              cancelable: true,
              view: window,
              relatedTarget: null,
            });
            msg.dispatchEvent(evt);
            // Also dispatch on all child elements
            msg.querySelectorAll("*").forEach((child) => {
              child.dispatchEvent(evt);
            });
          });
          
          // Wait for hover effects to take place
          setTimeout(() => {
                         // Try more realistic event simulation
             const simulateRealClick = () => {
               // Method 1: Try to trigger the button's click handler directly
               if (optionsBtn.onclick) {
                 try {
                   optionsBtn.onclick.call(optionsBtn);
                   console.log(`Page: Triggered onclick handler for message ID: ${messageId}`);
                 } catch (error) {
                   console.log(`Page: onclick handler failed:`, error);
                 }
               }
               
               // Method 2: Try to find and trigger React event handlers
               const reactKey = Object.keys(optionsBtn).find(key => key.startsWith('__reactProps$'));
               if (reactKey) {
                 const reactProps = optionsBtn[reactKey];
                 if (reactProps.onClick) {
                   try {
                     reactProps.onClick();
                     console.log(`Page: Triggered React onClick for message ID: ${messageId}`);
                   } catch (error) {
                     console.log(`Page: React onClick failed:`, error);
                   }
                 }
               }
               
                               // Method 3: Try to find and trigger any event listeners (if available in dev tools)
                try {
                  if (typeof getEventListeners === 'function') {
                    const eventListeners = getEventListeners(optionsBtn);
                    if (eventListeners && eventListeners.click) {
                      eventListeners.click.forEach(listener => {
                        try {
                          listener.listener.call(optionsBtn);
                          console.log(`Page: Triggered event listener for message ID: ${messageId}`);
                        } catch (error) {
                          console.log(`Page: Event listener failed:`, error);
                        }
                      });
                    }
                  }
                } catch (error) {
                  console.log(`Page: getEventListeners not available:`, error);
                }
               
                               // Method 4: Try to dispatch events with more realistic properties
                const createRealisticEvent = (type) => {
                  const event = new MouseEvent(type, {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    detail: 1,
                    screenX: 100,
                    screenY: 100,
                    clientX: 100,
                    clientY: 100,
                    ctrlKey: false,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    button: 0,
                    relatedTarget: null
                  });
                  
                  return event;
                };
                
                // Dispatch events in the correct sequence
                const events = ['mouseenter', 'mouseover', 'mousedown', 'mouseup', 'click'];
                events.forEach((eventType, index) => {
                  setTimeout(() => {
                    const event = createRealisticEvent(eventType);
                    optionsBtn.dispatchEvent(event);
                    console.log(`Page: Dispatched ${eventType} for message ID: ${messageId}`);
                  }, index * 10);
                });
                
                // Method 5: Try to access internal event handlers directly
                try {
                  // Look for any internal event handler properties
                  const internalProps = Object.getOwnPropertyNames(optionsBtn);
                  const eventProps = internalProps.filter(prop => 
                    prop.includes('on') || prop.includes('click') || prop.includes('handler')
                  );
                  
                  console.log(`Page: Found ${eventProps.length} potential event properties:`, eventProps);
                  
                  // Try to call any found event handlers
                  eventProps.forEach(prop => {
                    try {
                      const handler = optionsBtn[prop];
                      if (typeof handler === 'function') {
                        handler.call(optionsBtn);
                        console.log(`Page: Called internal handler: ${prop} for message ID: ${messageId}`);
                      }
                    } catch (error) {
                      console.log(`Page: Failed to call ${prop}:`, error);
                    }
                  });
                } catch (error) {
                  console.log(`Page: Failed to access internal properties:`, error);
                }
             };
             
                                                     // Try the realistic click simulation
              simulateRealClick();
              
              // Try to force the menu open
              // NEW: Try simplified menu opening approach
              openMenuSimplified(optionsBtn);
              
              // NEW: Try direct Radix UI trigger
              triggerRadixMenuDirect(optionsBtn);
              
              // NEW: Try direct Radix UI menu component manipulation
              forceRadixMenuComponent(optionsBtn);
              
              // NEW: Wait for menu to open and then find delete button
              waitForMenuAndDelete(optionsBtn, messageId, index, deleteNextMessage);
            }, 100);
        }, 100);
        
        // Remove the old setTimeout that was looking for delete button immediately
        // setTimeout(() => {
        //   const allMenuButtons = document.querySelectorAll(
        //     '[role="menuitem"], [data-testid*="delete"], button[data-testid*="menu"]'
        //   );
        //   console.log(
        //     "Page: Available menu items:",
        //     Array.from(allMenuButtons).map((btn) => ({
        //       testId: btn.getAttribute("data-testid"),
        //       text: btn.textContent?.trim(),
        //       element: btn,
        //     }))
        //   );

        //   const deleteBtn =
        //     document.querySelector('[data-testid="delete-chat-menu-item"]') ||
        //     document.querySelector(
        //       '[data-testid="delete-conversation-menu-item"]'
        //     ) ||
        //     document.querySelector('[data-testid="delete-menu-item"]') ||
        //     document.querySelector('[role="menuitem"]') ||
        //     Array.from(
        //       document.querySelectorAll('button, [role="menuitem"]')
        //     ).find((btn) => btn.textContent?.toLowerCase().includes("delete"));

        //   console.log(
        //     "Page: Found delete button:",
        //     deleteBtn?.getAttribute("data-testid") || deleteBtn?.textContent
        //   );

        //   if (deleteBtn) {
        //     deleteBtn.click();
        //     setTimeout(() => {
        //       const confirmButton = document.querySelector(
        //         '[data-testid="delete-conversation-confirm-button"]'
        //       );
        //       if (confirmButton) {
        //         confirmButton.click();
        //         console.log(
        //           `Page confirmed deletion for message ID: ${messageId}`
        //         );
        //       } else {
        //         console.log(
        //           `Page: Confirmation button not found for message ID: ${messageId}`
        //         );
        //       }
        //       // Wait for DOM to update before next deletion
        //       setTimeout(() => deleteNextMessage(index + 1), 400);
        //     }, 120);
        //   } else {
        //     console.log(`Delete button not found for message ID: ${messageId}`);
        //     setTimeout(() => deleteNextMessage(index + 1), 400);
        //   }
        // }, 1000);
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

// Debug function to help identify the correct button selectors
function debugButtonSelectors() {
  console.log("=== DEBUG: Analyzing ChatGPT UI Structure ===");
  
  // Find all message containers
  const messageLinks = Array.from(document.querySelectorAll("a.__menu-item"));
  console.log(`Found ${messageLinks.length} message links`);
  
  if (messageLinks.length > 0) {
    const firstMessage = messageLinks[0];
    console.log("First message structure:", firstMessage);
    
    // Find all buttons in the first message
    const buttons = firstMessage.querySelectorAll('button, [role="button"]');
    console.log(`Found ${buttons.length} buttons in first message:`);
    
    buttons.forEach((btn, index) => {
      console.log(`Button ${index + 1}:`, {
        tagName: btn.tagName,
        testId: btn.getAttribute('data-testid'),
        ariaLabel: btn.getAttribute('aria-label'),
        title: btn.getAttribute('title'),
        text: btn.textContent?.trim(),
        className: btn.className,
        innerHTML: btn.innerHTML.substring(0, 100) + '...'
      });
    });
    
    // Try to find options/menu buttons specifically
    const optionsSelectors = [
      'button[data-testid*="options"]',
      'button[data-testid*="menu"]',
      'button[aria-label*="menu"]',
      'button[aria-label*="options"]',
      'svg[data-testid*="menu"]',
      'svg[data-testid*="options"]',
      '[role="button"][data-testid*="menu"]',
      '[role="button"][data-testid*="options"]'
    ];
    
    console.log("Testing options selectors:");
    optionsSelectors.forEach(selector => {
      const elements = firstMessage.querySelectorAll(selector);
      console.log(`  ${selector}: ${elements.length} found`);
      elements.forEach((el, i) => {
        console.log(`    ${i + 1}:`, {
          tagName: el.tagName,
          testId: el.getAttribute('data-testid'),
          ariaLabel: el.getAttribute('aria-label'),
          text: el.textContent?.trim()
        });
      });
    });
  }
  
  console.log("=== END DEBUG ===");
}

// Expose debug function globally for testing
window.debugChatGPTButtons = debugButtonSelectors;

// Function to force menu open by manipulating React state
function forceMenuOpen(optionsBtn) {
  console.log("Attempting to force menu open...");
  
  // Method 1: Try to find React fiber and force state update
  const reactKey = Object.keys(optionsBtn).find(key => key.startsWith('__reactFiber$'));
  if (reactKey) {
    const fiber = optionsBtn[reactKey];
    if (fiber && fiber.stateNode) {
      try {
        // Try to find the component that controls the menu state
        let currentFiber = fiber;
        while (currentFiber) {
          if (currentFiber.stateNode && currentFiber.stateNode.setState) {
            // Try to force the menu to open
            currentFiber.stateNode.setState({ isOpen: true, open: true, visible: true });
            console.log("Forced React state update for menu");
            break;
          }
          currentFiber = currentFiber.return;
        }
      } catch (error) {
        console.log("Failed to force React state:", error);
      }
    }
  }
  
  // Method 2: Try to manipulate DOM attributes that might control menu visibility
  const menuSelectors = [
    '[role="menu"]',
    '[data-testid*="menu"]',
    '.menu',
    '.dropdown',
    '[aria-expanded]'
  ];
  
  menuSelectors.forEach(selector => {
    const menus = document.querySelectorAll(selector);
    menus.forEach(menu => {
      // Try to force menu to be visible
      menu.style.display = 'block';
      menu.style.visibility = 'visible';
      menu.style.opacity = '1';
      menu.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      
      // Remove any classes that might hide the menu
      menu.classList.remove('hidden', 'invisible', 'opacity-0');
      menu.classList.add('visible', 'opacity-100');
    });
  });
  
  // Method 3: Try to trigger any click handlers on parent elements
  let parent = optionsBtn.parentElement;
  while (parent && parent !== document.body) {
    if (parent.onclick) {
      try {
        parent.onclick.call(parent);
        console.log("Triggered parent onclick");
      } catch (error) {
        console.log("Parent onclick failed:", error);
      }
    }
    parent = parent.parentElement;
  }
}

// NEW: Function to directly access and manipulate menu state
function forceMenuStateOpen(optionsBtn, msg) {
  console.log("Attempting to force menu state open...");
  
  // Method 1: Try to find any React components that might control menu state
  const allElements = document.querySelectorAll('*');
  allElements.forEach(element => {
    const reactKeys = Object.keys(element).filter(key => key.startsWith('__react'));
    reactKeys.forEach(key => {
      try {
        const reactData = element[key];
        if (reactData && reactData.stateNode && reactData.stateNode.setState) {
          // Try to set menu-related state
          const stateNames = ['isOpen', 'open', 'visible', 'expanded', 'showMenu'];
          stateNames.forEach(stateName => {
            try {
              reactData.stateNode.setState({ [stateName]: true });
              console.log(`Set ${stateName} to true on React component`);
            } catch (error) {
              // Ignore errors
            }
          });
        }
      } catch (error) {
        // Ignore errors
      }
    });
  });
  
  // Method 2: Try to find and manipulate any global state management
  try {
    // Look for common state management patterns
    if (window.__REDUX_DEVTOOLS_EXTENSION__) {
      console.log("Redux DevTools detected, trying to manipulate state");
    }
    
    // Try to find any global state objects
    const globalStateKeys = Object.keys(window).filter(key => 
      key.includes('state') || key.includes('store') || key.includes('app')
    );
    
    globalStateKeys.forEach(key => {
      try {
        const stateObj = window[key];
        if (stateObj && typeof stateObj === 'object') {
          // Try to set menu state
          if (stateObj.menu) stateObj.menu.isOpen = true;
          if (stateObj.ui) stateObj.ui.menuOpen = true;
          console.log(`Modified global state: ${key}`);
        }
      } catch (error) {
        // Ignore errors
      }
    });
  } catch (error) {
    console.log("Failed to access global state:", error);
  }
  
  // Method 3: Try to create and dispatch custom events that might trigger menu opening
  const customEvents = [
    'menuopen',
    'contextmenu',
    'showmenu',
    'togglemenu',
    'openmenu'
  ];
  
  customEvents.forEach(eventName => {
    try {
      const event = new CustomEvent(eventName, {
        bubbles: true,
        cancelable: true,
        detail: { target: optionsBtn }
      });
      optionsBtn.dispatchEvent(event);
      msg.dispatchEvent(event);
      console.log(`Dispatched custom event: ${eventName}`);
    } catch (error) {
      console.log(`Failed to dispatch ${eventName}:`, error);
    }
  });
}

// NEW: Function specifically for Radix UI components
function forceRadixMenuOpen(optionsBtn) {
  console.log("Attempting to force Radix UI menu open...");
  
  // Method 1: Directly manipulate Radix UI attributes
  if (optionsBtn.id && optionsBtn.id.startsWith('radix-')) {
    console.log("Found Radix UI component, manipulating attributes...");
    
    // Force the button to show as expanded
    optionsBtn.setAttribute('aria-expanded', 'true');
    optionsBtn.setAttribute('data-state', 'open');
    optionsBtn.setAttribute('aria-hidden', 'false');
    
    // Remove any closed state classes
    optionsBtn.classList.remove('closed', 'collapsed');
    optionsBtn.classList.add('open', 'expanded');
    
    // Try to find the associated menu content
    const menuId = optionsBtn.getAttribute('aria-controls') || optionsBtn.id.replace('radix-', 'radix-content-');
    const menuContent = document.getElementById(menuId) || 
                       document.querySelector(`[data-radix-popper-content-wrapper]`) ||
                       document.querySelector(`[role="menu"]`);
    
    if (menuContent) {
      console.log("Found menu content, forcing it open...");
      menuContent.setAttribute('data-state', 'open');
      menuContent.setAttribute('aria-hidden', 'false');
      menuContent.style.display = 'block';
      menuContent.style.visibility = 'visible';
      menuContent.style.opacity = '1';
      menuContent.style.transform = 'scale(1)';
      
      // Remove hiding classes
      menuContent.classList.remove('hidden', 'invisible', 'opacity-0', 'scale-0', 'closed');
      menuContent.classList.add('visible', 'opacity-100', 'scale-100', 'open');
    }
  }
  
  // Method 2: Try to find and trigger Radix UI event handlers
  const radixKeys = Object.keys(optionsBtn).filter(key => 
    key.includes('radix') || key.includes('__reactProps$')
  );
  
  radixKeys.forEach(key => {
    try {
      const radixData = optionsBtn[key];
      if (radixData && typeof radixData === 'object') {
        // Look for common Radix UI event handlers
        const eventHandlers = ['onClick', 'onPointerDown', 'onPointerUp', 'onKeyDown'];
        eventHandlers.forEach(handlerName => {
          if (radixData[handlerName] && typeof radixData[handlerName] === 'function') {
            try {
              radixData[handlerName]({ type: 'click', target: optionsBtn });
              console.log(`Triggered Radix UI ${handlerName}`);
            } catch (error) {
              console.log(`Failed to trigger ${handlerName}:`, error);
            }
          }
        });
      }
    } catch (error) {
      console.log(`Failed to access Radix data for ${key}:`, error);
    }
  });
  
  // Method 3: Try to find Radix UI context and force state
  try {
    // Look for Radix UI context providers
    const radixContexts = document.querySelectorAll('[data-radix-popper-content-wrapper], [role="menu"], [data-state]');
    radixContexts.forEach(context => {
      const reactKeys = Object.keys(context).filter(key => key.startsWith('__react'));
      reactKeys.forEach(key => {
        try {
          const reactData = context[key];
          if (reactData && reactData.stateNode && reactData.stateNode.setState) {
            // Try to force open state
            reactData.stateNode.setState({ open: true, isOpen: true });
            console.log("Forced Radix UI context state open");
          }
        } catch (error) {
          // Ignore errors
        }
      });
    });
  } catch (error) {
    console.log("Failed to access Radix UI contexts:", error);
  }
}

// NEW: More aggressive Radix UI manipulation
function forceRadixMenuOpenAggressive(optionsBtn) {
  console.log("Attempting aggressive Radix UI menu manipulation...");
  
  // Method 1: Try to find the Radix UI root and force all menus open
  try {
    // Look for any element with Radix UI properties
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
      const elementKeys = Object.keys(element);
      const radixKeys = elementKeys.filter(key => 
        key.includes('radix') || key.includes('__reactFiber$') || key.includes('__reactProps$')
      );
      
      radixKeys.forEach(key => {
        try {
          const radixData = element[key];
          if (radixData && typeof radixData === 'object') {
            // If it's a React fiber, try to force state
            if (radixData.stateNode && radixData.stateNode.setState) {
              // Try multiple state combinations
              const stateCombinations = [
                { open: true },
                { isOpen: true },
                { open: true, isOpen: true },
                { visible: true },
                { expanded: true },
                { show: true }
              ];
              
              stateCombinations.forEach(state => {
                try {
                  radixData.stateNode.setState(state);
                  console.log(`Forced Radix state:`, state);
                } catch (error) {
                  // Ignore errors
                }
              });
            }
            
            // If it's React props, try to trigger event handlers
            if (radixData.onClick || radixData.onPointerDown || radixData.onKeyDown) {
              const handlers = ['onClick', 'onPointerDown', 'onKeyDown'];
              handlers.forEach(handlerName => {
                if (radixData[handlerName] && typeof radixData[handlerName] === 'function') {
                  try {
                    radixData[handlerName]({ 
                      type: 'click', 
                      target: optionsBtn,
                      currentTarget: optionsBtn,
                      preventDefault: () => {},
                      stopPropagation: () => {}
                    });
                    console.log(`Triggered ${handlerName} on Radix element`);
                  } catch (error) {
                    // Ignore errors
                  }
                }
              });
            }
          }
        } catch (error) {
          // Ignore errors
        }
      });
    });
  } catch (error) {
    console.log("Failed aggressive Radix manipulation:", error);
  }
  
  // Method 2: Try to find and manipulate any Radix UI portals or overlays
  try {
    const portals = document.querySelectorAll('[data-radix-portal], [data-radix-popper-content-wrapper], [role="menu"], [data-state]');
    portals.forEach(portal => {
      // Force all potential menu containers to be visible
      portal.style.display = 'block';
      portal.style.visibility = 'visible';
      portal.style.opacity = '1';
      portal.style.transform = 'scale(1)';
      portal.setAttribute('data-state', 'open');
      portal.setAttribute('aria-hidden', 'false');
      
      // Remove any hiding classes
      portal.classList.remove('hidden', 'invisible', 'opacity-0', 'scale-0', 'closed', 'collapsed');
      portal.classList.add('visible', 'opacity-100', 'scale-100', 'open', 'expanded');
      
      console.log("Forced portal visibility:", portal);
    });
  } catch (error) {
    console.log("Failed to manipulate portals:", error);
  }
  
  // Method 3: Try to directly create and show the menu content
  try {
    // Look for any existing menu content that might be hidden
    const hiddenMenus = document.querySelectorAll('[role="menu"], [data-testid*="menu"], .menu, .dropdown');
    hiddenMenus.forEach(menu => {
      // Force it to be visible
      menu.style.display = 'block';
      menu.style.visibility = 'visible';
      menu.style.opacity = '1';
      menu.style.transform = 'scale(1)';
      menu.setAttribute('data-state', 'open');
      menu.setAttribute('aria-hidden', 'false');
      
      // Position it near the options button
      const btnRect = optionsBtn.getBoundingClientRect();
      menu.style.position = 'fixed';
      menu.style.top = `${btnRect.bottom + 5}px`;
      menu.style.left = `${btnRect.left}px`;
      menu.style.zIndex = '9999';
      
      console.log("Forced menu visibility and positioning:", menu);
    });
  } catch (error) {
    console.log("Failed to create menu content:", error);
  }
}

// NEW: Direct Radix UI context manipulation
function forceRadixContextOpen(optionsBtn) {
  console.log("Attempting direct Radix UI context manipulation...");
  
  // Method 1: Try to find the specific Radix UI context for this button
  try {
    // Look for Radix UI context providers that might control this button
    const contextSelectors = [
      '[data-radix-menu-root]',
      '[data-radix-dropdown-menu-root]',
      '[data-radix-popover-root]',
      '[data-radix-context-menu-root]',
      '[role="menu"]',
      '[data-state]'
    ];
    
    contextSelectors.forEach(selector => {
      const contexts = document.querySelectorAll(selector);
      contexts.forEach(context => {
        const reactKeys = Object.keys(context).filter(key => key.startsWith('__react'));
        reactKeys.forEach(key => {
          try {
            const reactData = context[key];
            if (reactData && reactData.stateNode) {
              // Try to find the context that controls the menu state
              if (reactData.stateNode.setState) {
                // Force the menu to open
                reactData.stateNode.setState({ open: true, isOpen: true });
                console.log("Forced Radix context state open");
              }
              
              // Try to find and call the open method if it exists
              if (reactData.stateNode.open) {
                try {
                  reactData.stateNode.open();
                  console.log("Called Radix context open method");
                } catch (error) {
                  // Ignore errors
                }
              }
            }
          } catch (error) {
            // Ignore errors
          }
        });
      });
    });
  } catch (error) {
    console.log("Failed to manipulate Radix context:", error);
  }
  
  // Method 2: Try to trigger the button's specific Radix UI handlers
  try {
    const buttonKeys = Object.keys(optionsBtn);
    const radixButtonKeys = buttonKeys.filter(key => 
      key.includes('radix') || key.includes('__reactProps$') || key.includes('__reactFiber$')
    );
    
    radixButtonKeys.forEach(key => {
      try {
        const buttonData = optionsBtn[key];
        if (buttonData && typeof buttonData === 'object') {
          // If it's React props, try to trigger the click handler
          if (buttonData.onClick && typeof buttonData.onClick === 'function') {
            try {
              buttonData.onClick({
                type: 'click',
                target: optionsBtn,
                currentTarget: optionsBtn,
                preventDefault: () => {},
                stopPropagation: () => {},
                nativeEvent: { isTrusted: true }
              });
              console.log("Triggered Radix button onClick");
            } catch (error) {
              console.log("Failed to trigger onClick:", error);
            }
          }
          
          // If it's React fiber, try to force state
          if (buttonData.stateNode && buttonData.stateNode.setState) {
            try {
              buttonData.stateNode.setState({ open: true, isOpen: true });
              console.log("Forced Radix button state open");
            } catch (error) {
              console.log("Failed to force button state:", error);
            }
          }
        }
      } catch (error) {
        // Ignore errors
      }
    });
  } catch (error) {
    console.log("Failed to manipulate Radix button:", error);
  }
  
  // Method 3: Try to create a synthetic event that Radix UI will recognize
  try {
    // Create a more realistic synthetic event
    const syntheticEvent = {
      type: 'click',
      target: optionsBtn,
      currentTarget: optionsBtn,
      preventDefault: () => {},
      stopPropagation: () => {},
      nativeEvent: {
        isTrusted: true,
        type: 'click',
        target: optionsBtn,
        currentTarget: optionsBtn,
        preventDefault: () => {},
        stopPropagation: () => {}
      },
      bubbles: true,
      cancelable: true,
      defaultPrevented: false,
      eventPhase: 2,
      isTrusted: true,
      timeStamp: Date.now()
    };
    
    // Try to dispatch this event on the button
    optionsBtn.dispatchEvent(new CustomEvent('click', {
      bubbles: true,
      cancelable: true,
      detail: syntheticEvent
    }));
    
    console.log("Dispatched synthetic Radix event");
  } catch (error) {
    console.log("Failed to create synthetic event:", error);
  }
}

// NEW: Function to wait for the menu to open and then find the delete button
function waitForMenuAndDelete(optionsBtn, messageId, index, deleteNextMessage) {
  console.log(`Waiting for menu to open for message ID: ${messageId}`);
  
  let attempts = 0;
  const maxAttempts = 50; // 5 seconds max (50 * 100ms)
  
  // Try multiple approaches to find the menu
  const checkMenu = () => {
    attempts++;
    
    // Method 1: Look for Radix UI menu content that should be visible
    const radixMenuContent = document.querySelector('[data-radix-popper-content-wrapper][data-state="open"]') ||
                            document.querySelector('[role="menu"][data-state="open"]') ||
                            document.querySelector('[data-radix-menu-content][data-state="open"]');
    
    // Method 2: Look for any visible menu near the options button
    const btnRect = optionsBtn.getBoundingClientRect();
    const allMenus = document.querySelectorAll('[role="menu"], [data-testid*="menu"], .menu, .dropdown');
    const nearbyMenu = Array.from(allMenus).find(menu => {
      const menuRect = menu.getBoundingClientRect();
      const isVisible = menu.style.display !== 'none' && 
                       menu.style.visibility !== 'hidden' && 
                       menu.style.opacity !== '0';
      const isNearby = Math.abs(menuRect.top - btnRect.bottom) < 100 && 
                      Math.abs(menuRect.left - btnRect.left) < 200;
      return isVisible && isNearby;
    });
    
    // Method 3: Look for menu items that are visible
    const visibleMenuItems = document.querySelectorAll('[role="menuitem"], [data-testid*="delete"], button[data-testid*="menu"]');
    const hasVisibleMenuItems = Array.from(visibleMenuItems).some(item => {
      const rect = item.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && 
             item.style.display !== 'none' && 
             item.style.visibility !== 'hidden';
    });
    
    console.log(`Menu check (attempt ${attempts}) - Radix content: ${!!radixMenuContent}, Nearby menu: ${!!nearbyMenu}, Visible items: ${hasVisibleMenuItems}`);
    
    if (radixMenuContent || nearbyMenu || hasVisibleMenuItems) {
      console.log(`Menu appears to be open for message ID: ${messageId}`);
      
      // Look for delete button with multiple selectors
      const deleteBtn = document.querySelector('[data-testid="delete-chat-menu-item"]') ||
                       document.querySelector('[data-testid="delete-conversation-menu-item"]') ||
                       document.querySelector('[data-testid="delete-menu-item"]') ||
                       document.querySelector('[role="menuitem"]') ||
                       Array.from(document.querySelectorAll('button, [role="menuitem"]'))
                         .find(btn => btn.textContent?.toLowerCase().includes("delete"));
      
      console.log(`Found delete button:`, deleteBtn?.getAttribute("data-testid") || deleteBtn?.textContent);
      
      if (deleteBtn) {
        deleteBtn.click();
        setTimeout(() => {
          const confirmButton = document.querySelector('[data-testid="delete-conversation-confirm-button"]');
          if (confirmButton) {
            confirmButton.click();
            console.log(`Confirmed deletion for message ID: ${messageId}`);
            setTimeout(() => deleteNextMessage(index + 1), 400);
          } else {
            console.log(`Confirmation button not found for message ID: ${messageId}`);
            setTimeout(() => deleteNextMessage(index + 1), 400);
          }
        }, 120);
      } else {
        console.log(`Delete button not found for message ID: ${messageId}`);
        setTimeout(() => deleteNextMessage(index + 1), 400);
      }
    } else if (attempts >= maxAttempts) {
      console.log(`Menu failed to open after ${maxAttempts} attempts for message ID: ${messageId}, moving to next message`);
      setTimeout(() => deleteNextMessage(index + 1), 400);
    } else {
      // Menu not open yet, retry
      console.log(`Menu not open yet for message ID: ${messageId}, retrying... (attempt ${attempts}/${maxAttempts})`);
      setTimeout(checkMenu, 100);
    }
  };
  
  // Start checking after a short delay to allow menu to open
  setTimeout(checkMenu, 200);
}

// NEW: More targeted Radix UI menu trigger
function triggerRadixMenu(optionsBtn) {
  console.log("Attempting targeted Radix UI menu trigger...");
  
  // Method 1: Try to find the specific Radix UI trigger and force it
  try {
    // Look for the Radix UI trigger element
    const radixTrigger = optionsBtn.closest('[data-radix-trigger]') || optionsBtn;
    
    // Try to find React Fiber and force the trigger state
    const reactKeys = Object.keys(radixTrigger).filter(key => key.startsWith('__react'));
    reactKeys.forEach(key => {
      try {
        const reactData = radixTrigger[key];
        if (reactData && reactData.stateNode) {
          // Try to find the trigger's open method
          if (reactData.stateNode.open) {
            reactData.stateNode.open();
            console.log("Called Radix trigger open method");
          }
          
          // Try to force the trigger state
          if (reactData.stateNode.setState) {
            reactData.stateNode.setState({ open: true, isOpen: true });
            console.log("Forced Radix trigger state open");
          }
          
          // Try to find and call the toggle method
          if (reactData.stateNode.toggle) {
            reactData.stateNode.toggle();
            console.log("Called Radix trigger toggle method");
          }
        }
      } catch (error) {
        // Ignore errors
      }
    });
  } catch (error) {
    console.log("Failed to trigger Radix trigger:", error);
  }
  
  // Method 2: Try to find the Radix UI context and force it open
  try {
    // Look for Radix UI context that might control this button
    const contexts = document.querySelectorAll('[data-radix-menu-root], [data-radix-dropdown-menu-root], [data-radix-popover-root]');
    contexts.forEach(context => {
      const reactKeys = Object.keys(context).filter(key => key.startsWith('__react'));
      reactKeys.forEach(key => {
        try {
          const reactData = context[key];
          if (reactData && reactData.stateNode) {
            // Try to find the context's open method
            if (reactData.stateNode.open) {
              reactData.stateNode.open();
              console.log("Called Radix context open method");
            }
            
            // Try to force the context state
            if (reactData.stateNode.setState) {
              reactData.stateNode.setState({ open: true, isOpen: true });
              console.log("Forced Radix context state open");
            }
          }
        } catch (error) {
          // Ignore errors
        }
      });
    });
  } catch (error) {
    console.log("Failed to trigger Radix context:", error);
  }
  
  // Method 3: Try to create a more realistic click event that Radix UI will recognize
  try {
    // Create a synthetic event that mimics a real user click
    const syntheticEvent = {
      type: 'click',
      target: optionsBtn,
      currentTarget: optionsBtn,
      preventDefault: () => {},
      stopPropagation: () => {},
      nativeEvent: {
        isTrusted: true,
        type: 'click',
        target: optionsBtn,
        currentTarget: optionsBtn,
        preventDefault: () => {},
        stopPropagation: () => {},
        bubbles: true,
        cancelable: true
      },
      bubbles: true,
      cancelable: true,
      defaultPrevented: false,
      eventPhase: 2,
      isTrusted: true,
      timeStamp: Date.now()
    };
    
    // Try to dispatch this event on the button
    optionsBtn.dispatchEvent(new CustomEvent('click', {
      bubbles: true,
      cancelable: true,
      detail: syntheticEvent
    }));
    
    console.log("Dispatched synthetic Radix click event");
  } catch (error) {
    console.log("Failed to create synthetic event:", error);
  }
}

// NEW: Direct Radix UI menu trigger based on the actual button structure
function triggerRadixMenuDirect(optionsBtn) {
  console.log("Attempting direct Radix UI menu trigger...");
  
  // Based on the user's button structure, we need to:
  // 1. Set aria-expanded to true
  // 2. Set data-state to open
  // 3. Trigger the button's internal handlers
  
  try {
    // Step 1: Directly set the button's state attributes
    optionsBtn.setAttribute('aria-expanded', 'true');
    optionsBtn.setAttribute('data-state', 'open');
    optionsBtn.setAttribute('aria-hidden', 'false');
    
    console.log("Set button attributes:", {
      'aria-expanded': optionsBtn.getAttribute('aria-expanded'),
      'data-state': optionsBtn.getAttribute('data-state'),
      'aria-hidden': optionsBtn.getAttribute('aria-hidden')
    });
    
    // Step 2: Find and trigger React event handlers
    const reactKeys = Object.keys(optionsBtn).filter(key => key.startsWith('__react'));
    console.log("Found React keys:", reactKeys);
    
    reactKeys.forEach(key => {
      try {
        const reactData = optionsBtn[key];
        if (reactData) {
          // Try to find onClick or onPointerDown handlers
          if (reactData.onClick) {
            console.log("Found React onClick, triggering...");
            reactData.onClick();
          }
          if (reactData.onPointerDown) {
            console.log("Found React onPointerDown, triggering...");
            reactData.onPointerDown();
          }
          if (reactData.onMouseDown) {
            console.log("Found React onMouseDown, triggering...");
            reactData.onMouseDown();
          }
          
          // Try to access stateNode if available
          if (reactData.stateNode) {
            console.log("Found stateNode, attempting to manipulate...");
            const stateNode = reactData.stateNode;
            
            // Try to call open method if it exists
            if (typeof stateNode.open === 'function') {
              console.log("Calling stateNode.open()");
              stateNode.open();
            }
            
            // Try to call toggle method if it exists
            if (typeof stateNode.toggle === 'function') {
              console.log("Calling stateNode.toggle()");
              stateNode.toggle();
            }
            
            // Try to set state directly
            if (stateNode.setState) {
              console.log("Setting state to open");
              stateNode.setState({ isOpen: true, open: true });
            }
          }
        }
      } catch (error) {
        console.log(`Error with React key ${key}:`, error);
      }
    });
    
    // Step 3: Dispatch synthetic events that Radix UI expects
    const events = [
      new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
      new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
      new MouseEvent('click', { bubbles: true, cancelable: true })
    ];
    
    events.forEach((event, index) => {
      setTimeout(() => {
        optionsBtn.dispatchEvent(event);
        console.log(`Dispatched ${event.type} event`);
      }, index * 50);
    });
    
    // Step 4: Look for and manipulate the menu content directly
    setTimeout(() => {
      // Look for Radix UI menu content that might be hidden
      const menuContent = document.querySelector('[data-radix-popper-content-wrapper]') ||
                         document.querySelector('[role="menu"]') ||
                         document.querySelector('[data-radix-menu-content]');
      
      if (menuContent) {
        console.log("Found menu content, forcing visibility...");
        menuContent.setAttribute('data-state', 'open');
        menuContent.style.display = 'block';
        menuContent.style.visibility = 'visible';
        menuContent.style.opacity = '1';
        menuContent.style.transform = 'scale(1)';
        menuContent.classList.remove('hidden');
        menuContent.classList.add('visible');
      }
    }, 100);
    
  } catch (error) {
    console.log("Error in direct Radix trigger:", error);
  }
}

// NEW: Simplified menu opening function that focuses on the core issue
function openMenuSimplified(optionsBtn) {
  console.log("Attempting simplified menu opening...");
  
  // Method 1: Direct attribute manipulation
  optionsBtn.setAttribute('aria-expanded', 'true');
  optionsBtn.setAttribute('data-state', 'open');
  
  // Method 2: Direct click simulation
  optionsBtn.click();
  
  // Method 3: React handler trigger
  const reactKey = Object.keys(optionsBtn).find(key => key.startsWith('__reactProps$'));
  if (reactKey && optionsBtn[reactKey].onClick) {
    try {
      optionsBtn[reactKey].onClick();
    } catch (error) {
      console.log("React onClick failed:", error);
    }
  }
  
  // Method 4: Event dispatch
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  optionsBtn.dispatchEvent(clickEvent);
}

// Expose the force menu function globally for testing
window.forceMenuOpen = forceMenuOpen;
window.forceMenuStateOpen = forceMenuStateOpen;
window.forceRadixMenuOpen = forceRadixMenuOpen;
window.forceRadixMenuOpenAggressive = forceRadixMenuOpenAggressive;
window.forceRadixContextOpen = forceRadixContextOpen;
window.triggerRadixMenu = triggerRadixMenu;
window.triggerRadixMenuDirect = triggerRadixMenuDirect;
window.openMenuSimplified = openMenuSimplified;
window.forceRadixMenuComponent = forceRadixMenuComponent;
window.debugChatGPTButtons = debugButtonSelectors;

// NEW: Debug function to inspect Radix UI structure
function debugRadixStructure(optionsBtn) {
  console.log("=== Radix UI Structure Debug ===");
  console.log("Options button:", optionsBtn);
  console.log("Button ID:", optionsBtn.id);
  console.log("Button attributes:", {
    'aria-haspopup': optionsBtn.getAttribute('aria-haspopup'),
    'aria-expanded': optionsBtn.getAttribute('aria-expanded'),
    'data-state': optionsBtn.getAttribute('data-state'),
    'aria-hidden': optionsBtn.getAttribute('aria-hidden')
  });
  
  // Look for React properties
  const reactKeys = Object.keys(optionsBtn).filter(key => key.startsWith('__react'));
  console.log("React keys found:", reactKeys);
  
  reactKeys.forEach(key => {
    try {
      const reactData = optionsBtn[key];
      console.log(`React data for ${key}:`, {
        hasStateNode: !!reactData?.stateNode,
        hasSetState: !!reactData?.stateNode?.setState,
        hasOpen: !!reactData?.stateNode?.open,
        hasToggle: !!reactData?.stateNode?.toggle,
        stateNodeType: reactData?.stateNode?.constructor?.name
      });
      
      if (reactData?.stateNode) {
        console.log(`State node methods:`, Object.getOwnPropertyNames(reactData.stateNode));
      }
    } catch (error) {
      console.log(`Error accessing ${key}:`, error);
    }
  });
  
  // Look for Radix UI context
  const contexts = document.querySelectorAll('[data-radix-menu-root], [data-radix-dropdown-menu-root], [data-radix-popover-root]');
  console.log("Radix contexts found:", contexts.length);
  
  contexts.forEach((context, index) => {
    console.log(`Context ${index}:`, {
      tagName: context.tagName,
      id: context.id,
      className: context.className,
      'data-state': context.getAttribute('data-state'),
      'aria-expanded': context.getAttribute('aria-expanded')
    });
    
    const contextReactKeys = Object.keys(context).filter(key => key.startsWith('__react'));
    console.log(`Context ${index} React keys:`, contextReactKeys);
  });
  
  // Look for menu content
  const menuContent = document.querySelectorAll('[role="menu"], [data-radix-popper-content-wrapper], [data-radix-menu-content]');
  console.log("Menu content found:", menuContent.length);
  
  menuContent.forEach((menu, index) => {
    console.log(`Menu ${index}:`, {
      tagName: menu.tagName,
      id: menu.id,
      className: menu.className,
      'data-state': menu.getAttribute('data-state'),
      'aria-hidden': menu.getAttribute('aria-hidden'),
      style: {
        display: menu.style.display,
        visibility: menu.style.visibility,
        opacity: menu.style.opacity
      }
    });
  });
  
  console.log("=== End Radix UI Structure Debug ===");
}

window.debugRadixStructure = debugRadixStructure;

// NEW: Direct Radix UI menu component manipulation
function forceRadixMenuComponent(optionsBtn) {
  console.log("Attempting direct Radix UI menu component manipulation...");
  
  try {
    // Step 1: Find the Radix UI menu root component
    const menuRoot = document.querySelector('[data-radix-menu-root]') ||
                    document.querySelector('[data-radix-dropdown-menu-root]') ||
                    document.querySelector('[data-radix-popover-root]') ||
                    optionsBtn.closest('[data-radix-menu-root]') ||
                    optionsBtn.closest('[data-radix-dropdown-menu-root]') ||
                    optionsBtn.closest('[data-radix-popover-root]');
    
    if (menuRoot) {
      console.log("Found Radix UI menu root:", menuRoot);
      
      // Step 2: Try to access React Fiber and force the menu state
      const reactKeys = Object.keys(menuRoot).filter(key => key.startsWith('__react'));
      console.log("Menu root React keys:", reactKeys);
      
      reactKeys.forEach(key => {
        try {
          const reactData = menuRoot[key];
          if (reactData && reactData.stateNode) {
            const stateNode = reactData.stateNode;
            console.log("Menu root stateNode:", stateNode);
            
            // Try to call open method
            if (typeof stateNode.open === 'function') {
              console.log("Calling menu root open()");
              stateNode.open();
            }
            
            // Try to call setOpen method
            if (typeof stateNode.setOpen === 'function') {
              console.log("Calling menu root setOpen(true)");
              stateNode.setOpen(true);
            }
            
            // Try to set state directly
            if (stateNode.setState) {
              console.log("Setting menu root state to open");
              stateNode.setState({ open: true, isOpen: true });
            }
            
            // Try to access internal methods
            const methods = Object.getOwnPropertyNames(stateNode);
            console.log("Menu root methods:", methods);
            
            // Look for any method that might open the menu
            const openMethods = methods.filter(method => 
              method.toLowerCase().includes('open') || 
              method.toLowerCase().includes('show') ||
              method.toLowerCase().includes('toggle')
            );
            
            openMethods.forEach(method => {
              try {
                if (typeof stateNode[method] === 'function') {
                  console.log(`Calling menu root method: ${method}`);
                  stateNode[method]();
                }
              } catch (error) {
                console.log(`Error calling ${method}:`, error);
              }
            });
          }
        } catch (error) {
          console.log(`Error with menu root React key ${key}:`, error);
        }
      });
      
      // Step 3: Set menu root attributes
      menuRoot.setAttribute('data-state', 'open');
      menuRoot.setAttribute('aria-expanded', 'true');
      
      // Step 4: Look for and manipulate the menu content
      const menuContent = document.querySelector('[data-radix-popper-content-wrapper]') ||
                         document.querySelector('[role="menu"]') ||
                         document.querySelector('[data-radix-menu-content]');
      
      if (menuContent) {
        console.log("Found menu content, forcing visibility...");
        menuContent.setAttribute('data-state', 'open');
        menuContent.style.display = 'block';
        menuContent.style.visibility = 'visible';
        menuContent.style.opacity = '1';
        menuContent.style.transform = 'scale(1)';
        menuContent.classList.remove('hidden', 'closed');
        menuContent.classList.add('visible', 'open');
      }
    } else {
      console.log("No Radix UI menu root found");
    }
    
    // Step 5: Try to find the trigger component and force it
    const triggerComponent = optionsBtn.closest('[data-radix-trigger]') || optionsBtn;
    const triggerReactKeys = Object.keys(triggerComponent).filter(key => key.startsWith('__react'));
    
    triggerReactKeys.forEach(key => {
      try {
        const reactData = triggerComponent[key];
        if (reactData && reactData.stateNode) {
          const stateNode = reactData.stateNode;
          
          // Try to call trigger methods
          if (typeof stateNode.open === 'function') {
            console.log("Calling trigger open()");
            stateNode.open();
          }
          if (typeof stateNode.toggle === 'function') {
            console.log("Calling trigger toggle()");
            stateNode.toggle();
          }
          if (typeof stateNode.setOpen === 'function') {
            console.log("Calling trigger setOpen(true)");
            stateNode.setOpen(true);
          }
        }
      } catch (error) {
        console.log(`Error with trigger React key ${key}:`, error);
      }
    });
    
  } catch (error) {
    console.log("Error in direct Radix menu component manipulation:", error);
  }
}
