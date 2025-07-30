## ChatGPT Bulk Delete Extension

This _proof-of-concept_ Chrome extension adds **bulk delete functionality to the ChatGPT web UI**. It injects checkboxes next to each message in your chat history, allowing you to select multiple messages and delete them all at once.

The extension provides a popup and page UI for enabling bulk delete mode, selecting messages, and performing the deletion. It uses advanced DOM automation to interact with the ChatGPT interface, including handling dynamic/lazy-loaded messages and simulating user interactions for deletion.

**Features:**
- Injects checkboxes for message selection in ChatGPT history
- Adds Bulk Delete and Cancel buttons to the page
- Allows selection and bulk deletion of multiple messages
- Handles dynamic/lazy-loaded messages with MutationObserver
- Robust error handling and debug logging
- Popup UI for enabling/disabling bulk delete mode
- Playwright integration for automated testing and workflow

**How it works:**
1. Enable bulk delete mode from the extension popup or page button.
2. Select messages using the checkboxes.
3. Click the Bulk Delete button to delete selected messages sequentially.
4. Cancel bulk delete mode at any time.

**Automated Testing:**
You can use Playwright scripts to automate the extension's workflow, including selecting messages and triggering bulk deletion.

---
