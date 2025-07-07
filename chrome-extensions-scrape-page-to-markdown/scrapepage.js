// scrapepage.js - Main utility functions for the Page to Markdown extension

/**
 * Utility functions for markdown conversion and file handling
 */
class MarkdownUtils {
  /**
   * Sanitize filename for safe file system usage
   * @param {string} filename - Original filename
   * @returns {string} - Sanitized filename
   */
  static sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9\-_\s]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .toLowerCase()
      .substring(0, 100); // Limit length
  }

  /**
   * Format current date for filename or metadata
   * @returns {string} - Formatted date string
   */
  static getCurrentDate() {
    const now = new Date();
    return now.toISOString().split("T")[0]; // YYYY-MM-DD format
  }

  /**
   * Extract domain from URL for organizing scraped content
   * @param {string} url - Full URL
   * @returns {string} - Domain name
   */
  static extractDomain(url) {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch (e) {
      return "unknown-site";
    }
  }

  /**
   * Create a comprehensive filename based on page info
   * @param {string} title - Page title
   * @param {string} url - Page URL
   * @returns {string} - Generated filename
   */
  static generateFilename(title, url) {
    const domain = this.extractDomain(url);
    const sanitizedTitle = this.sanitizeFilename(title || "untitled");
    const date = this.getCurrentDate();

    return `${date}-${domain}-${sanitizedTitle}`;
  }

  /**
   * Clean and format markdown content
   * @param {string} markdown - Raw markdown content
   * @returns {string} - Cleaned markdown
   */
  static cleanMarkdown(markdown) {
    return markdown
      .replace(/\n{3,}/g, "\n\n") // Remove excessive line breaks
      .replace(/^\s+|\s+$/g, "") // Trim whitespace
      .replace(/\t/g, "    "); // Convert tabs to spaces
  }

  /**
   * Add frontmatter to markdown for better organization
   * @param {string} markdown - Markdown content
   * @param {Object} metadata - Page metadata
   * @returns {string} - Markdown with frontmatter
   */
  static addFrontmatter(markdown, metadata) {
    const frontmatter = `---
title: "${metadata.title || "Untitled"}"
url: "${metadata.url || ""}"
domain: "${this.extractDomain(metadata.url || "")}"
scraped_date: "${new Date().toISOString()}"
description: "${metadata.description || ""}"
---

`;
    return frontmatter + markdown;
  }
}

/**
 * Export utilities for use in other scripts
 */
if (typeof module !== "undefined" && module.exports) {
  module.exports = MarkdownUtils;
}

// Make available globally for extension context
window.MarkdownUtils = MarkdownUtils;
