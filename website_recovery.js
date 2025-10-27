/**
 * Website Recovery Utility
 * Shared functionality for downloading website files and generating config files
 */

class WebsiteRecovery {
  constructor() {
    this.zip = null;
    this.baseUrl = null;
    this.htmlText = null;
  }

  /**
   * Extract file references from HTML content
   * @param {string} htmlText - The HTML content to analyze
   * @returns {Array} Array of file paths found in the HTML
   */
  extractFileReferencesFromHTML(htmlText) {
    const files = new Set();

    // Extract from <link> tags (CSS files)
    const linkMatches = htmlText.match(
      /<link[^>]+href\s*=\s*["']([^"']+)["'][^>]*>/g
    );
    if (linkMatches) {
      linkMatches.forEach((match) => {
        const href = match.match(/href\s*=\s*["']([^"']+)["']/)[1];
        if (
          href &&
          !href.startsWith("http") &&
          !href.startsWith("//") &&
          !href.startsWith("#")
        ) {
          files.add(href);
        }
      });
    }

    // Extract from <script> tags (JavaScript files)
    const scriptMatches = htmlText.match(
      /<script[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/g
    );
    if (scriptMatches) {
      scriptMatches.forEach((match) => {
        const src = match.match(/src\s*=\s*["']([^"']+)["']/)[1];
        if (src && !src.startsWith("http") && !src.startsWith("//")) {
          files.add(src);
        }
      });
    }

    // Extract from <img> tags (images)
    const imgMatches = htmlText.match(
      /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/g
    );
    if (imgMatches) {
      imgMatches.forEach((match) => {
        const src = match.match(/src\s*=\s*["']([^"']+)["']/)[1];
        if (
          src &&
          !src.startsWith("http") &&
          !src.startsWith("//") &&
          !src.startsWith("data:")
        ) {
          files.add(src);
        }
      });
    }

    // Extract from CSS url() functions in <style> tags
    const styleMatches = htmlText.match(/<style[^>]*>([\s\S]*?)<\/style>/g);
    if (styleMatches) {
      styleMatches.forEach((styleBlock) => {
        const cssContent = styleBlock.match(
          /<style[^>]*>([\s\S]*?)<\/style>/
        )[1];
        const urlMatches = cssContent.match(
          /url\s*\(\s*["']?([^"')]+)["']?\s*\)/g
        );
        if (urlMatches) {
          urlMatches.forEach((match) => {
            const url = match.match(/url\s*\(\s*["']?([^"')]+)["']?\s*\)/)[1];
            if (
              url &&
              !url.startsWith("http") &&
              !url.startsWith("//") &&
              !url.startsWith("data:")
            ) {
              files.add(url);
            }
          });
        }
      });
    }

    return Array.from(files);
  }

  /**
   * Generate config files based on HTML content
   * @param {string} htmlText - The HTML content to analyze
   * @param {JSZip} zip - JSZip instance to add files to
   * @param {string} baseUrl - Base URL of the website
   */
  async generateConfigFiles(htmlText, zip, baseUrl) {
    // Generate _redirects based on hreflang tags
    const hreflangMatches = htmlText.match(
      /<link[^>]+rel="alternate"[^>]+hreflang="([^"]+)"[^>]+href="([^"]+)"[^>]*>/g
    );

    if (hreflangMatches && hreflangMatches.length > 0) {
      let redirectsContent = "/* /index.html 200\n";

      hreflangMatches.forEach((match) => {
        const hreflangMatch = match.match(/hreflang="([^"]+)"/);
        const hrefMatch = match.match(/href="([^"]+)"/);

        if (hreflangMatch && hrefMatch) {
          const lang = hreflangMatch[1];
          const href = hrefMatch[1];

          // Skip x-default as it's handled by the catch-all rule
          if (lang !== "x-default") {
            // Extract the path from the href (remove domain)
            const url = new URL(href, baseUrl);
            const path = url.pathname;

            // Add redirect rule for this language
            redirectsContent += `/${lang}/* /:splat 200\n`;
          }
        }
      });

      zip.file("_redirects", redirectsContent);
      if (this.onStatusUpdate) {
        this.onStatusUpdate(
          "Generated _redirects file based on hreflang tags",
          "info"
        );
      }
    }

    // Generate _headers file based on HTML content
    let headersContent = "/*\n  X-Robots-Tag: index, follow\n\n";

    // Check for specific hardcoded files and add preload links if they exist
    const filesToCheck = [
      { path: "css/styles.css", type: "style" },
      { path: "js/script.js", type: "script" },
      { path: "js/lang.js", type: "script" },
    ];

    filesToCheck.forEach((file) => {
      if (file.type === "style") {
        // Check for CSS file in link tags
        const cssRegex = new RegExp(
          `<link[^>]+href="[^"]*${file.path.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}[^"]*"[^>]*>`,
          "g"
        );
        if (htmlText.match(cssRegex)) {
          headersContent += `  Link: <${file.path}>; rel=preload; as=${file.type}\n`;
        }
      } else if (file.type === "script") {
        // Check for JS file in script tags
        const scriptRegex = new RegExp(
          `<script[^>]+src="[^"]*${file.path.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}[^"]*"[^>]*>`,
          "g"
        );
        if (htmlText.match(scriptRegex)) {
          headersContent += `  Link: <${file.path}>; rel=preload; as=${file.type}\n`;
        }
      }
    });

    zip.file("_headers", headersContent);
    if (this.onStatusUpdate) {
      this.onStatusUpdate(
        "Generated _headers file with preload links based on HTML content",
        "info"
      );
    }
  }

  /**
   * Download website files and return them as a Map
   * @param {string} domain - The domain to download from
   * @param {Function} onProgress - Progress callback function
   * @param {Function} onStatusUpdate - Status update callback function
   * @returns {Promise<Map>} Map of file paths to file contents
   */
  async downloadWebsiteFiles(domain, onProgress = null, onStatusUpdate = null) {
    this.onStatusUpdate = onStatusUpdate;

    // Clean domain (remove protocol, www, trailing slash)
    const cleanDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");
    this.baseUrl = `https://${cleanDomain}`;

    let discoveredFiles = new Set();

    if (onStatusUpdate) {
      onStatusUpdate("Downloading and analyzing index.html...", "info");
    }

    try {
      // Download and analyze index.html
      const htmlResponse = await fetch(`${this.baseUrl}/index.html`);
      if (!htmlResponse.ok) {
        throw new Error(`Failed to fetch index.html: ${htmlResponse.status}`);
      }

      this.htmlText = await htmlResponse.text();
      discoveredFiles.add("index.html");

      // Extract file references from HTML
      const htmlFiles = this.extractFileReferencesFromHTML(this.htmlText);
      htmlFiles.forEach((file) => discoveredFiles.add(file));

      if (onStatusUpdate) {
        onStatusUpdate(`Found ${htmlFiles.length} files in HTML`, "info");
      }

      // Convert Set to Array and filter out unwanted files
      const filesToCheck = Array.from(discoveredFiles).filter((file) => {
        if (file.startsWith("data:image/svg+xml,")) return false;
        if (file.startsWith("/cdn-cgi/")) return false;
        return true;
      });

      if (onStatusUpdate) {
        onStatusUpdate(
          `Found ${filesToCheck.length} files (filtered). Checking which ones exist...`,
          "info"
        );
      }

      const projectFiles = new Map();
      let downloaded = 0;
      let failed = 0;

      // Download each file
      for (let i = 0; i < filesToCheck.length; i++) {
        const file = filesToCheck[i];
        const progress = ((i + 1) / filesToCheck.length) * 100;

        if (onProgress) {
          onProgress(progress, file, i + 1, filesToCheck.length);
        }

        try {
          const url = `${this.baseUrl}/${file}`;
          const response = await fetch(url);

          if (response.ok) {
            const blob = await response.blob();
            projectFiles.set(file, blob);
            downloaded++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
        }

        if (onStatusUpdate) {
          onStatusUpdate(
            `Checked: ${i + 1}/${
              filesToCheck.length
            }, Found: ${downloaded}, Not found: ${failed}`,
            "info"
          );
        }

        // Small delay to prevent overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      return projectFiles;
    } catch (error) {
      if (onStatusUpdate) {
        onStatusUpdate(`Error analyzing HTML: ${error.message}`, "error");
      }
      throw error;
    }
  }

  /**
   * Download website files and create a ZIP file
   * @param {string} domain - The domain to download from
   * @param {Function} onProgress - Progress callback function
   * @param {Function} onStatusUpdate - Status update callback function
   * @returns {Promise<Blob>} ZIP file blob
   */
  async downloadWebsiteAsZip(domain, onProgress = null, onStatusUpdate = null) {
    this.onStatusUpdate = onStatusUpdate;

    // Clean domain (remove protocol, www, trailing slash)
    const cleanDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");
    this.baseUrl = `https://${cleanDomain}`;

    let discoveredFiles = new Set();

    if (onStatusUpdate) {
      onStatusUpdate("Downloading and analyzing index.html...", "info");
    }

    try {
      // Download and analyze index.html
      const htmlResponse = await fetch(`${this.baseUrl}/index.html`);
      if (!htmlResponse.ok) {
        throw new Error(`Failed to fetch index.html: ${htmlResponse.status}`);
      }

      this.htmlText = await htmlResponse.text();
      discoveredFiles.add("index.html");

      // Extract file references from HTML
      const htmlFiles = this.extractFileReferencesFromHTML(this.htmlText);
      htmlFiles.forEach((file) => discoveredFiles.add(file));

      if (onStatusUpdate) {
        onStatusUpdate(`Found ${htmlFiles.length} files in HTML`, "info");
      }

      // Convert Set to Array and filter out unwanted files
      const filesToCheck = Array.from(discoveredFiles).filter((file) => {
        if (file.startsWith("data:image/svg+xml,")) return false;
        if (file.startsWith("/cdn-cgi/")) return false;
        return true;
      });

      if (onStatusUpdate) {
        onStatusUpdate(
          `Found ${filesToCheck.length} files (filtered) + generated config files. Checking which ones exist...`,
          "info"
        );
      }

      // Create ZIP instance
      this.zip = new JSZip();
      let downloaded = 0;
      let failed = 0;

      // Generate config files based on HTML content
      await this.generateConfigFiles(this.htmlText, this.zip, this.baseUrl);

      // Check each file and add to ZIP if it exists
      for (let i = 0; i < filesToCheck.length; i++) {
        const file = filesToCheck[i];
        const progress = ((i + 1) / filesToCheck.length) * 100;

        if (onProgress) {
          onProgress(progress, file, i + 1, filesToCheck.length);
        }

        try {
          const url = `${this.baseUrl}/${file}`;
          const response = await fetch(url);

          if (response.ok) {
            const blob = await response.blob();
            this.zip.file(file, blob);
            downloaded++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
        }

        if (onStatusUpdate) {
          onStatusUpdate(
            `Checked: ${i + 1}/${
              filesToCheck.length
            }, Found: ${downloaded}, Not found: ${failed}`,
            "info"
          );
        }

        // Small delay to prevent overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (downloaded === 0) {
        throw new Error(
          "No files were found. Please check your domain name and try again."
        );
      }

      // Generate and return ZIP
      if (onStatusUpdate) {
        onStatusUpdate(`Creating ZIP file with ${downloaded} files...`, "info");
      }

      const zipBlob = await this.zip.generateAsync({ type: "blob" });

      if (onStatusUpdate) {
        onStatusUpdate(
          `✅ Successfully created ZIP with ${downloaded} files + generated config files! (${failed} files were not found)`,
          "success"
        );
      }

      return zipBlob;
    } catch (error) {
      if (onStatusUpdate) {
        onStatusUpdate(`Error: ${error.message}`, "error");
      }
      throw error;
    }
  }

  /**
   * Download a single file from a URL
   * @param {string} url - The URL to download from
   * @returns {Promise<Blob>} The file content as a blob
   */
  async downloadSingleFile(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ${url}: ${response.status}`);
    }
    return await response.blob();
  }
}

// Export for use in modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = WebsiteRecovery;
}

// Make available globally
if (typeof window !== "undefined") {
  window.WebsiteRecovery = WebsiteRecovery;
}
