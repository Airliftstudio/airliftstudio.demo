class VisualWebsiteEditor {
  constructor() {
    this.projectFiles = new Map();
    this.projectName = "";
    this.editMode = false;
    this.modifiedFiles = new Map();
    this.originalContent = "";

    this.initializeElements();
    this.setupEventListeners();
    this.setupDragAndDrop();
  }

  initializeElements() {
    this.uploadArea = document.getElementById("uploadArea");
    this.fileInput = document.getElementById("fileInput");
    this.projectInfo = document.getElementById("projectInfo");
    this.projectNameEl = document.getElementById("projectName");
    this.projectFilesEl = document.getElementById("projectFiles");
    this.downloadBtn = document.getElementById("downloadBtn");
    this.previewUrl = document.getElementById("previewUrl");
    this.editModeToggle = document.getElementById("editModeToggle");
    this.previewFrame = document.getElementById("previewFrame");
    this.loadingOverlay = document.getElementById("loadingOverlay");
    this.statusMessage = document.getElementById("statusMessage");
  }

  setupEventListeners() {
    this.uploadArea.addEventListener("click", () => {
      this.fileInput.click();
    });

    this.fileInput.addEventListener("change", (e) => {
      this.handleFiles(e.target.files);
    });

    this.editModeToggle.addEventListener("click", () => {
      this.toggleEditMode();
    });

    this.downloadBtn.addEventListener("click", () => {
      this.downloadProject();
    });

    // Listen for messages from the preview iframe
    window.addEventListener("message", (e) => {
      this.handleIframeMessage(e);
    });
  }

  setupDragAndDrop() {
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      this.uploadArea.addEventListener(eventName, this.preventDefaults);
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      this.uploadArea.addEventListener(eventName, () => {
        this.uploadArea.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      this.uploadArea.addEventListener(eventName, () => {
        this.uploadArea.classList.remove("dragover");
      });
    });

    this.uploadArea.addEventListener("drop", (e) => {
      const files = e.dataTransfer.files;
      this.handleFiles(files);
    });
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  async handleFiles(files) {
    this.showLoading();

    try {
      if (files.length === 0) {
        throw new Error("No files selected");
      }

      // Handle ZIP file
      if (files.length === 1 && files[0].name.endsWith(".zip")) {
        await this.handleZipFile(files[0]);
      }
      // Handle directory upload
      else {
        await this.handleDirectoryUpload(files);
      }

      await this.processProject();
      this.showStatus("Project loaded successfully!", "success");
    } catch (error) {
      console.error("Error handling files:", error);
      this.showStatus(`Error: ${error.message}`, "error");
    } finally {
      this.hideLoading();
    }
  }

  async handleZipFile(zipFile) {
    // For this demo, we'll use JSZip library
    // In a real implementation, you'd include JSZip
    throw new Error(
      "ZIP file support requires JSZip library. Please upload a folder instead."
    );
  }

  async handleDirectoryUpload(files) {
    this.projectFiles.clear();
    this.modifiedFiles.clear();

    // Get project name from the first file's path
    if (files.length > 0) {
      const firstPath = files[0].webkitRelativePath;
      this.projectName = firstPath.split("/")[0];
    }

    // Process all files
    for (const file of files) {
      const relativePath = file.webkitRelativePath.substring(
        this.projectName.length + 1
      );
      if (relativePath) {
        // Skip empty paths
        const content = await this.readFileContent(file);
        this.projectFiles.set(relativePath, {
          content: content,
          type: this.getFileType(file.name),
          size: file.size,
          originalFile: file,
        });
      }
    }
  }

  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      if (this.isTextFile(file.name)) {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
        reader.readAsText(file);
      } else {
        reader.onload = (e) => {
          const arrayBuffer = e.target.result;
          const uint8Array = new Uint8Array(arrayBuffer);
          resolve(uint8Array);
        };
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
        reader.readAsArrayBuffer(file);
      }
    });
  }

  isTextFile(filename) {
    const textExtensions = [
      ".html",
      ".css",
      ".js",
      ".json",
      ".txt",
      ".md",
      ".xml",
      ".svg",
    ];
    return textExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
  }

  getFileType(filename) {
    const ext = filename.toLowerCase().split(".").pop();
    const typeMap = {
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      json: "application/json",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      svg: "image/svg+xml",
      txt: "text/plain",
      md: "text/markdown",
    };
    return typeMap[ext] || "application/octet-stream";
  }

  async processProject() {
    // Find the main HTML file
    const htmlFiles = Array.from(this.projectFiles.keys()).filter(
      (path) =>
        path.endsWith(".html") &&
        (path === "index.html" || path.includes("index"))
    );

    if (htmlFiles.length === 0) {
      throw new Error("No HTML files found in the project");
    }

    const mainHtml = htmlFiles[0];
    this.originalContent = this.projectFiles.get(mainHtml).content;

    // Update UI
    this.projectNameEl.textContent = this.projectName;
    this.projectFilesEl.textContent = `${this.projectFiles.size} files loaded`;
    this.projectInfo.classList.add("active");
    this.downloadBtn.disabled = false;

    // Load preview
    await this.loadPreview();
  }

  async loadPreview() {
    try {
      // Create a blob URL for the main HTML file with all resources
      const htmlContent = this.getModifiedHtmlContent();
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      this.previewUrl.value = `Preview: ${this.projectName}`;
      this.previewFrame.src = url;

      // Wait for iframe to load
      await new Promise((resolve) => {
        this.previewFrame.onload = resolve;
      });

      this.injectEditingCapabilities();
    } catch (error) {
      console.error("Error loading preview:", error);
      throw new Error("Failed to load preview");
    }
  }

  getModifiedHtmlContent() {
    const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
      (path) =>
        path.endsWith(".html") &&
        (path === "index.html" || path.includes("index"))
    );

    let htmlContent =
      this.modifiedFiles.get(mainHtmlPath) ||
      this.projectFiles.get(mainHtmlPath).content;

    // Replace relative paths with blob URLs
    htmlContent = this.replaceResourcePaths(htmlContent);

    return htmlContent;
  }

  replaceResourcePaths(htmlContent) {
    // Create blob URLs for all resources and replace paths
    const resourceMap = new Map();

    // Process CSS files
    this.projectFiles.forEach((fileData, path) => {
      if (
        path.endsWith(".css") ||
        path.endsWith(".js") ||
        path.match(/\.(jpg|jpeg|png|gif|svg|woff|woff2|ttf)$/i)
      ) {
        let content = fileData.content;
        if (typeof content === "string") {
          content = new Blob([content], { type: fileData.type });
        } else {
          content = new Blob([content], { type: fileData.type });
        }

        const url = URL.createObjectURL(content);
        resourceMap.set(path, url);
      }
    });

    // Replace paths in HTML
    resourceMap.forEach((url, path) => {
      const patterns = [
        new RegExp(`src=["']${path}["']`, "g"),
        new RegExp(`href=["']${path}["']`, "g"),
        new RegExp(`url\\(["']?${path}["']?\\)`, "g"),
      ];

      patterns.forEach((pattern) => {
        if (path.endsWith(".css")) {
          htmlContent = htmlContent.replace(pattern, `href="${url}"`);
        } else if (path.endsWith(".js")) {
          htmlContent = htmlContent.replace(pattern, `src="${url}"`);
        } else {
          htmlContent = htmlContent.replace(pattern, (match) => {
            if (match.includes("src=")) return `src="${url}"`;
            if (match.includes("href=")) return `href="${url}"`;
            if (match.includes("url(")) return `url(${url})`;
            return match;
          });
        }
      });
    });

    return htmlContent;
  }

  injectEditingCapabilities() {
    if (!this.previewFrame.contentDocument) return;

    const doc = this.previewFrame.contentDocument;

    // Inject editing styles
    const editingStyles = doc.createElement("style");
    editingStyles.textContent = `
            .editable-element {
                position: relative;
                cursor: pointer !important;
                transition: all 0.2s ease;
            }
            
            .editable-element:hover {
                outline: 2px dashed #007aff !important;
                outline-offset: 2px;
                background-color: rgba(0, 122, 255, 0.1) !important;
            }
            
            .editable-element.editing {
                outline: 2px solid #007aff !important;
                outline-offset: 2px;
                background-color: rgba(0, 122, 255, 0.15) !important;
            }
            
            .edit-tooltip {
                position: absolute;
                top: -30px;
                left: 0;
                background: #007aff;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
                white-space: nowrap;
                z-index: 10000;
                pointer-events: none;
            }
            
            .edit-tooltip::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 10px;
                border: 5px solid transparent;
                border-top-color: #007aff;
            }
        `;
    doc.head.appendChild(editingStyles);

    // Inject editing script
    const editingScript = doc.createElement("script");
    editingScript.textContent = `
            (function() {
                let editMode = false;
                let currentlyEditing = null;
                
                window.addEventListener('message', function(e) {
                    if (e.data.type === 'toggleEditMode') {
                        editMode = e.data.enabled;
                        toggleEditMode(editMode);
                    }
                });
                
                function toggleEditMode(enabled) {
                    const editableElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, div, li');
                    
                    editableElements.forEach(el => {
                        if (enabled) {
                            if (hasTextContent(el)) {
                                el.classList.add('editable-element');
                                el.addEventListener('click', handleElementClick);
                                el.addEventListener('mouseenter', showTooltip);
                                el.addEventListener('mouseleave', hideTooltip);
                            }
                        } else {
                            el.classList.remove('editable-element');
                            el.removeEventListener('click', handleElementClick);
                            el.removeEventListener('mouseenter', showTooltip);
                            el.removeEventListener('mouseleave', hideTooltip);
                        }
                    });
                }
                
                function hasTextContent(el) {
                    const text = el.textContent.trim();
                    return text.length > 0 && !el.querySelector('img, video, iframe');
                }
                
                function showTooltip(e) {
                    if (!editMode || currentlyEditing) return;
                    
                    const tooltip = document.createElement('div');
                    tooltip.className = 'edit-tooltip';
                    tooltip.textContent = 'Click to edit';
                    e.target.appendChild(tooltip);
                }
                
                function hideTooltip(e) {
                    const tooltip = e.target.querySelector('.edit-tooltip');
                    if (tooltip) {
                        tooltip.remove();
                    }
                }
                
                function handleElementClick(e) {
                    if (!editMode) return;
                    
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (currentlyEditing && currentlyEditing !== e.target) {
                        finishEditing();
                    }
                    
                    startEditing(e.target);
                }
                
                function startEditing(element) {
                    currentlyEditing = element;
                    element.classList.add('editing');
                    
                    const originalText = element.textContent;
                    element.contentEditable = true;
                    element.focus();
                    
                    // Select all text
                    const range = document.createRange();
                    range.selectNodeContents(element);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                    
                    function finishEdit() {
                        const newText = element.textContent;
                        element.contentEditable = false;
                        element.classList.remove('editing');
                        currentlyEditing = null;
                        
                        if (newText !== originalText) {
                            // Notify parent window of the change
                            window.parent.postMessage({
                                type: 'textChanged',
                                element: getElementPath(element),
                                oldText: originalText,
                                newText: newText
                            }, '*');
                        }
                    }
                    
                    element.addEventListener('blur', finishEdit, { once: true });
                    element.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            element.blur();
                        }
                        if (e.key === 'Escape') {
                            element.textContent = originalText;
                            element.blur();
                        }
                    });
                }
                
                function getElementPath(element) {
                    const path = [];
                    let current = element;
                    
                    while (current && current !== document.body) {
                        let selector = current.tagName.toLowerCase();
                        
                        if (current.id) {
                            selector += '#' + current.id;
                        } else if (current.className) {
                            selector += '.' + current.className.split(' ').join('.');
                        }
                        
                        path.unshift(selector);
                        current = current.parentElement;
                    }
                    
                    return path.join(' > ');
                }
                
                function finishEditing() {
                    if (currentlyEditing) {
                        currentlyEditing.blur();
                    }
                }
            })();
        `;
    doc.head.appendChild(editingScript);
  }

  toggleEditMode() {
    this.editMode = !this.editMode;

    if (this.editMode) {
      this.editModeToggle.textContent = "Disable Edit Mode";
      this.editModeToggle.classList.add("active");
    } else {
      this.editModeToggle.textContent = "Enable Edit Mode";
      this.editModeToggle.classList.remove("active");
    }

    // Notify iframe
    if (this.previewFrame.contentWindow) {
      this.previewFrame.contentWindow.postMessage(
        {
          type: "toggleEditMode",
          enabled: this.editMode,
        },
        "*"
      );
    }
  }

  handleIframeMessage(e) {
    if (e.data.type === "textChanged") {
      this.handleTextChange(e.data);
    }
  }

  handleTextChange(data) {
    // Find the main HTML file and update it
    const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
      (path) =>
        path.endsWith(".html") &&
        (path === "index.html" || path.includes("index"))
    );

    let currentContent =
      this.modifiedFiles.get(mainHtmlPath) ||
      this.projectFiles.get(mainHtmlPath).content;

    // Simple text replacement - in a production version, you'd want more sophisticated DOM parsing
    const updatedContent = currentContent.replace(data.oldText, data.newText);

    this.modifiedFiles.set(mainHtmlPath, updatedContent);

    this.showStatus(
      `Updated: "${data.oldText}" → "${data.newText}"`,
      "success"
    );
  }

  async downloadProject() {
    try {
      this.showLoading();

      // Create a zip file with all project files including modifications
      const zip = new JSZip(); // This would require including JSZip library

      // For this demo, we'll create a simple download of the modified HTML
      const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
        (path) =>
          path.endsWith(".html") &&
          (path === "index.html" || path.includes("index"))
      );

      const modifiedContent =
        this.modifiedFiles.get(mainHtmlPath) ||
        this.projectFiles.get(mainHtmlPath).content;

      // Create a simple download
      const blob = new Blob([modifiedContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${this.projectName}-modified.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      this.showStatus("Project downloaded successfully!", "success");
    } catch (error) {
      console.error("Error downloading project:", error);
      this.showStatus(`Download failed: ${error.message}`, "error");
    } finally {
      this.hideLoading();
    }
  }

  showLoading() {
    this.loadingOverlay.classList.remove("hidden");
  }

  hideLoading() {
    this.loadingOverlay.classList.add("hidden");
  }

  showStatus(message, type = "info") {
    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message show ${type}`;

    setTimeout(() => {
      this.statusMessage.classList.remove("show");
    }, 5000);
  }
}

// Initialize the editor when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new VisualWebsiteEditor();
});
