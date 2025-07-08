# 📝 Page to Markdown Chrome Extension

A powerful Chrome extension that scrapes web page content and converts it to clean, formatted Markdown files. Perfect for researchers, writers, and developers who want to save web content in a readable, portable format.

## ✨ Features

- **Smart Content Extraction**: Automatically identifies and extracts main content from web pages
- **Customizable Options**: Choose what to include (title, URL, images, links, meta information)
- **Clean Markdown Output**: Converts HTML to properly formatted Markdown
- **Live Preview**: Preview the markdown before downloading
- **Context Menu Integration**: Right-click to scrape any page
- **Automatic Filename Generation**: Smart filename creation based on page title and domain

## 🚀 Installation

1. **Download the Extension Files**
   - Clone or download this repository
   - Ensure you have all files in the extension directory

2. **Install in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension directory
   - The extension should now appear in your toolbar

## 📖 Usage

### Basic Usage

1. **Navigate to any webpage** you want to scrape
2. **Click the extension icon** in the toolbar
3. **Configure options**:
   - Set a custom filename (optional)
   - Choose what content to include
4. **Preview or Download**:
   - Click "👁️ Preview Markdown" to see the result
   - Click "💾 Download as Markdown" to save the file

### Advanced Options

- **Include Title**: Adds the page title as an H1 header
- **Include URL**: Adds the page URL for reference
- **Include Images**: Converts images to markdown image syntax
- **Include Links**: Preserves hyperlinks in markdown format
- **Include Meta**: Adds page description, keywords, and author info

### Context Menu

- Right-click anywhere on a page
- Select "Scrape page to Markdown"
- The extension popup will open automatically

## 🛠️ Technical Details

### Files Structure

```
chrome-extensions-scrape-page-to-markdown/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.js             # Popup logic and UI handling
├── content.js           # Content script for page scraping
├── background.js        # Service worker for background tasks
├── scrapepage.js        # Utility functions and helpers
├── icon48.png          # Extension icon
└── README.md           # This file
```

### Key Components

- **MarkdownConverter**: Core class that handles HTML to Markdown conversion
- **Content Script**: Injected into web pages to access DOM and scrape content
- **Popup Interface**: User-friendly interface for configuration and actions
- **Background Service**: Handles context menus and extension lifecycle

### Supported Elements

The extension intelligently converts various HTML elements:

- Headers (H1-H6) → Markdown headers
- Paragraphs → Plain text with proper spacing
- Lists (ordered/unordered) → Markdown lists
- Links → `[text](url)` format
- Images → `![alt](src)` format
- Code blocks → Fenced code blocks
- Tables → Markdown tables
- Blockquotes → `>` prefixed lines
- Bold/Italic → `**bold**` and `*italic*`

## 🎯 Smart Content Detection

The extension uses intelligent content detection to find the main content area:

1. Looks for semantic HTML5 elements (`<main>`, `<article>`)
2. Searches for common content containers by class/ID
3. Falls back to `<body>` if no specific content area is found
4. Automatically removes navigation, ads, and other non-content elements

## 📋 Output Format

### Basic Markdown
```markdown
# Page Title

**URL:** https://example.com/page

## Content

Page content converted to clean markdown...

---
*Scraped on 1/7/2025, 3:30:00 PM*
```

### With Frontmatter
```markdown
---
title: "Page Title"
url: "https://example.com/page"
domain: "example.com"
scraped_date: "2025-01-07T20:30:00.000Z"
description: "Page description from meta tags"
---

# Page Title
...
```

## 🔧 Customization

### Modifying Content Detection

Edit `content.js` to customize which elements are scraped:

```javascript
// Add custom selectors for content areas
const contentSelectors = [
  'main',
  'article',
  '.your-custom-content-class',
  '#your-content-id'
];
```

### Adding New Conversion Rules

Extend the `MarkdownConverter` class in `content.js`:

```javascript
case 'your-element':
  result = '**' + this.getTextContent(element) + '**';
  break;
```

## 🐛 Troubleshooting

### Common Issues

1. **Extension doesn't appear**: Make sure Developer mode is enabled
2. **No content scraped**: Some sites may block content scripts
3. **Formatting issues**: Complex layouts may need manual cleanup
4. **Download doesn't work**: Check if downloads are blocked by browser

### Browser Compatibility

- Chrome 88+
- Edge 88+ (Chromium-based)
- Other Chromium-based browsers

## 📄 License

This project is open source. Feel free to modify and distribute according to your needs.

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- Support for more HTML elements
- Better handling of complex layouts
- Additional export formats (PDF, HTML)
- Batch processing multiple pages
- Integration with note-taking apps

## 📞 Support

If you encounter issues or have suggestions:

1. Check the browser console for error messages
2. Verify the extension has necessary permissions
3. Test on different websites to isolate issues
4. Consider the website's structure and complexity

---

**Happy scraping!** 🎉
