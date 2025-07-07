// content.js - Content script to scrape page content and convert to markdown

class MarkdownConverter {
  constructor() {
    this.baseUrl = window.location.origin;
  }

  // Convert HTML element to markdown
  htmlToMarkdown(element, options = {}) {
    if (!element) return "";

    const tagName = element.tagName?.toLowerCase();
    let result = "";

    switch (tagName) {
      case "h1":
        result = "# " + this.getTextContent(element) + "\n\n";
        break;
      case "h2":
        result = "## " + this.getTextContent(element) + "\n\n";
        break;
      case "h3":
        result = "### " + this.getTextContent(element) + "\n\n";
        break;
      case "h4":
        result = "#### " + this.getTextContent(element) + "\n\n";
        break;
      case "h5":
        result = "##### " + this.getTextContent(element) + "\n\n";
        break;
      case "h6":
        result = "###### " + this.getTextContent(element) + "\n\n";
        break;
      case "p":
        const pContent = this.processInlineElements(element, options);
        result = pContent.trim() + "\n\n";
        break;
      case "br":
        result = "  \n";
        break;
      case "strong":
      case "b":
        result = "**" + this.getTextContent(element) + "**";
        break;
      case "em":
      case "i":
        result = "*" + this.getTextContent(element) + "*";
        break;
      case "code":
        result = "`" + this.getTextContent(element) + "`";
        break;
      case "pre":
        const codeContent = element.querySelector("code");
        if (codeContent) {
          result = "```\n" + this.getTextContent(codeContent) + "\n```\n\n";
        } else {
          result = "```\n" + this.getTextContent(element) + "\n```\n\n";
        }
        break;
      case "blockquote":
        const lines = this.processChildren(element, options).split("\n");
        result =
          lines.map((line) => (line.trim() ? "> " + line : ">")).join("\n") +
          "\n\n";
        break;
      case "ul":
        result = this.processList(element, options, "-") + "\n";
        break;
      case "ol":
        result = this.processList(element, options, "1.") + "\n";
        break;
      case "li":
        result = this.processInlineElements(element, options) + "\n";
        break;
      case "a":
        if (options.includeLinks) {
          const href = element.href;
          const text = this.getTextContent(element);
          if (href && text && href !== text) {
            result = `[${text}](${href})`;
          } else {
            result = text;
          }
        } else {
          result = this.getTextContent(element);
        }
        break;
      case "img":
        if (options.includeImages) {
          const src = element.src;
          const alt = element.alt || "Image";
          const title = element.title;
          if (src) {
            result = title
              ? `![${alt}](${src} "${title}")`
              : `![${alt}](${src})`;
          }
        }
        break;
      case "hr":
        result = "---\n\n";
        break;
      case "div":
      case "section":
      case "article":
      case "main":
        result = this.processChildren(element, options);
        break;
      case "table":
        result = this.processTable(element) + "\n\n";
        break;
      default:
        // For other elements, process their children
        if (element.children && element.children.length > 0) {
          result = this.processChildren(element, options);
        } else {
          result = this.getTextContent(element);
        }
    }

    return result;
  }

  processChildren(element, options) {
    let result = "";
    for (const child of element.children) {
      result += this.htmlToMarkdown(child, options);
    }
    return result;
  }

  processInlineElements(element, options) {
    let result = "";
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        result += this.htmlToMarkdown(node, options);
      }
    }
    return result;
  }

  processList(element, options, marker) {
    let result = "";
    let counter = 1;
    for (const li of element.children) {
      if (li.tagName.toLowerCase() === "li") {
        const content = this.processInlineElements(li, options).trim();
        const actualMarker = marker === "1." ? `${counter}.` : marker;
        result += `${actualMarker} ${content}\n`;
        counter++;
      }
    }
    return result;
  }

  processTable(table) {
    let result = "";
    const rows = table.querySelectorAll("tr");

    if (rows.length === 0) return "";

    // Process header
    const headerRow = rows[0];
    const headers = Array.from(headerRow.children).map(
      (cell) => this.getTextContent(cell).trim() || "Column"
    );

    result += "| " + headers.join(" | ") + " |\n";
    result += "| " + headers.map(() => "---").join(" | ") + " |\n";

    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      const cells = Array.from(rows[i].children).map((cell) =>
        this.getTextContent(cell).trim()
      );
      result += "| " + cells.join(" | ") + " |\n";
    }

    return result;
  }

  getTextContent(element) {
    return element.textContent?.trim() || "";
  }

  // Main function to scrape and convert page content
  scrapePageContent(options = {}) {
    let markdown = "";

    // Add title
    if (options.includeTitle) {
      const title = document.title || "Untitled Page";
      markdown += `# ${title}\n\n`;
    }

    // Add URL
    if (options.includeUrl) {
      markdown += `**URL:** ${window.location.href}\n\n`;
    }

    // Add meta information
    if (options.includeMeta) {
      const description = document.querySelector(
        'meta[name="description"]'
      )?.content;
      const keywords = document.querySelector('meta[name="keywords"]')?.content;
      const author = document.querySelector('meta[name="author"]')?.content;

      if (description || keywords || author) {
        markdown += "## Meta Information\n\n";
        if (description) markdown += `**Description:** ${description}\n\n`;
        if (keywords) markdown += `**Keywords:** ${keywords}\n\n`;
        if (author) markdown += `**Author:** ${author}\n\n`;
      }
    }

    // Add scraped content
    markdown += "## Content\n\n";

    // Try to find main content area
    const contentSelectors = [
      "main",
      "article",
      '[role="main"]',
      ".main-content",
      "#main-content",
      ".content",
      "#content",
      ".post-content",
      ".entry-content",
      "body",
    ];

    let contentElement = null;
    for (const selector of contentSelectors) {
      contentElement = document.querySelector(selector);
      if (contentElement && this.getTextContent(contentElement).length > 100) {
        break;
      }
    }

    if (!contentElement) {
      contentElement = document.body;
    }

    // Remove unwanted elements
    const unwantedSelectors = [
      "script",
      "style",
      "nav",
      "header",
      "footer",
      ".navigation",
      ".menu",
      ".sidebar",
      ".ads",
      ".advertisement",
      ".social-share",
      ".comments",
    ];

    const clonedElement = contentElement.cloneNode(true);
    unwantedSelectors.forEach((selector) => {
      const elements = clonedElement.querySelectorAll(selector);
      elements.forEach((el) => el.remove());
    });

    // Convert to markdown
    const contentMarkdown = this.htmlToMarkdown(clonedElement, options);
    markdown += contentMarkdown;

    // Clean up extra newlines
    markdown = markdown.replace(/\n{3,}/g, "\n\n").trim();

    // Add timestamp
    markdown += `\n\n---\n*Scraped on ${new Date().toLocaleString()}*`;

    return markdown;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);

  if (request.action === "scrapeContent") {
    try {
      const converter = new MarkdownConverter();
      const markdown = converter.scrapePageContent(request.options);

      if (request.isPreview) {
        sendResponse({
          success: true,
          markdown: markdown,
        });
      } else {
        // For download, just send the markdown content
        sendResponse({
          success: true,
          markdown: markdown,
        });
      }
    } catch (error) {
      console.error("Error in content script:", error);
      sendResponse({
        success: false,
        error: error.message,
      });
    }
  }

  return true; // Keep message channel open for async response
});

// Signal that the content script is ready
if (typeof window !== "undefined") {
  window.markdownScraperReady = true;
  console.log("Markdown scraper content script loaded");
}
