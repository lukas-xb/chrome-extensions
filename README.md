# Chrome extensions

Contains single-purpose extension utilities for Chromium-based browsers.

## Autoclose tabs

Periodically checks for predefined collection of tabs. If the tab was open for an hour, it's closed. Currently set to close tabs with OpenAI or ChatGpt. Extension is intentionally not packaged into .crx file so that everyone can inspect the code and uses a default "hi" icon.

## Page to Markdown

Allows user to scrape website page content into a markdown file and upload the file into RAG application. The extension is intentionally not packaged into .crx file so that everyone can inspect the code and uses a default "hi" icon. (Built with GHCopilot.)

## ChatGPT UI improvements

Enhances the ChatGPT web interface and adds the ability to delete multiple ChatGPT chats in bulk. This extension helps users clean up their ChatGPT conversation history with just a few clicks.

### Installation

1. Download the folder, e.g., `chrome-extensions-autoclose-tab`.
2. Go to `Extensions` tab in Chrome (or other Chromium-based browser).
3. Enable `Developer mode` in the top-right corner.
4. Select `Load unpacked` in the top left corner.
5. Select the folder where you have downloaded the **Autoclose tab** extension.
