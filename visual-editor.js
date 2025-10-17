class VisualWebsiteEditor {
  constructor() {
    this.projectFiles = new Map();
    this.projectName = "";
    this.editMode = false;
    this.modifiedFiles = new Map();
    this.originalContent = "";
    this.resourceUrls = new Map();
    this.undoStack = [];
    this.maxUndoSteps = 50;
    this.currentEditingIcon = null;
    this.selectedIcon = null;
    this.currentPageIcons = new Set();
    this.currentEditingImage = null;
    this.selectedImageFile = null;
    this.availableLanguages = new Map(); // Map of language codes to translation file paths
    this.translationKeys = new Map(); // Map of data-translate keys to their current values

    // Hardcoded list of useful Airbnb icons
    this.airbnbIcons = [
      // Accommodation & Property
      { class: "fas fa-home", name: "home house property" },
      { class: "fas fa-building", name: "building apartment condo" },
      { class: "fas fa-key", name: "key access checkin" },
      { class: "fas fa-door-open", name: "door entrance private" },
      { class: "fas fa-lock", name: "lock secure safety" },
      { class: "fas fa-vault", name: "safe security valuables" },

      // Pool & Water
      {
        class: "fas fa-swimming-pool",
        name: "pool swimming water private",
      },
      { class: "fas fa-hot-tub", name: "hottub jacuzzi spa" },
      { class: "fas fa-shower", name: "shower bathroom outdoor" },
      { class: "fas fa-bath", name: "bath bathtub bathroom" },
      { class: "fas fa-water", name: "water swimming pool" },

      // Kitchen & Dining
      { class: "fas fa-utensils", name: "kitchen dining utensils food" },
      { class: "fas fa-coffee", name: "coffee breakfast kitchen" },
      { class: "fas fa-wine-glass", name: "wine glass drinks dining" },
      { class: "fas fa-blender", name: "blender kitchen appliance" },
      { class: "fas fa-fire-burner", name: "stove cooking kitchen" },

      // Comfort & Climate
      { class: "fas fa-snowflake", name: "ac air conditioning cool" },
      { class: "fas fa-temperature-low", name: "cold cooling climate" },
      { class: "fas fa-fan", name: "fan cooling air" },
      { class: "fas fa-fire", name: "fireplace heating warm" },

      // Technology & Work
      { class: "fas fa-wifi", name: "wifi internet connection" },
      { class: "fas fa-laptop", name: "laptop work computer desk" },
      { class: "fas fa-tv", name: "tv television entertainment" },
      { class: "fas fa-desktop", name: "computer desktop work" },
      { class: "fas fa-mobile-alt", name: "phone mobile device" },

      // Location & Transport
      { class: "fas fa-map-marker-alt", name: "location marker address" },
      { class: "fas fa-car", name: "car parking transport" },
      { class: "fas fa-motorcycle", name: "scooter motorcycle bike" },
      { class: "fas fa-bicycle", name: "bicycle bike transport" },
      { class: "fas fa-plane", name: "airport flight travel" },
      { class: "fas fa-taxi", name: "taxi transport uber" },

      // Beach & Outdoor
      { class: "fas fa-umbrella-beach", name: "beach umbrella ocean" },
      { class: "fas fa-sun", name: "sun sunny weather lounger" },
      { class: "fas fa-tree", name: "garden nature outdoor" },
      { class: "fas fa-seedling", name: "garden plants nature" },
      { class: "fas fa-leaf", name: "nature eco green" },

      // Activities & Recreation
      { class: "fas fa-dumbbell", name: "gym fitness exercise" },
      { class: "fas fa-running", name: "running fitness sport" },
      { class: "fas fa-bicycle", name: "cycling sport activity" },
      { class: "fas fa-swimmer", name: "swimming pool sport" },
      { class: "fas fa-volleyball-ball", name: "volleyball beach sport" },

      // Services & Amenities
      { class: "fas fa-concierge-bell", name: "service concierge help" },
      { class: "fas fa-broom", name: "cleaning housekeeping" },
      { class: "fas fa-tshirt", name: "laundry washing clothes" },
      { class: "fas fa-baby", name: "baby family kids" },
      { class: "fas fa-dog", name: "pet dog animal friendly" },
      { class: "fas fa-cat", name: "pet cat animal friendly" },

      // Safety & Security
      { class: "fas fa-shield-alt", name: "safety security protection" },
      { class: "fas fa-user-shield", name: "superhost verified trusted" },
      { class: "fas fa-first-aid", name: "first aid safety medical" },
      {
        class: "fas fa-fire-extinguisher",
        name: "fire safety emergency",
      },

      // Communication & Social
      { class: "fas fa-envelope", name: "email contact message" },
      { class: "fas fa-phone", name: "phone contact call" },
      { class: "fas fa-comment", name: "message chat communication" },
      { class: "fab fa-whatsapp", name: "whatsapp message contact" },
      { class: "fab fa-instagram", name: "instagram social media" },
      { class: "fab fa-facebook", name: "facebook social media" },
      { class: "fab fa-airbnb", name: "airbnb platform booking" },

      // Experience & Quality
      { class: "fas fa-star", name: "star rating review quality" },
      { class: "fas fa-heart", name: "heart favorite love guest" },
      { class: "fas fa-thumbs-up", name: "like recommend positive" },
      { class: "fas fa-award", name: "award quality excellence" },
      { class: "fas fa-medal", name: "medal achievement superhost" },

      // Time & Booking
      {
        class: "fas fa-calendar-check",
        name: "calendar booking available",
      },
      { class: "fas fa-clock", name: "time schedule checkin" },
      { class: "fas fa-calendar-alt", name: "calendar dates booking" },

      // Entertainment & Relaxation
      { class: "fas fa-book", name: "books reading relax" },
      { class: "fas fa-music", name: "music entertainment sound" },
      { class: "fas fa-gamepad", name: "games entertainment fun" },
      { class: "fas fa-couch", name: "sofa living room comfort" },

      // Additional Useful Icons
      { class: "fas fa-utensils", name: "restaurant dining nearby" },
      {
        class: "fas fa-shopping-cart",
        name: "shopping groceries nearby",
      },
      { class: "fas fa-hospital", name: "hospital medical nearby" },
      {
        class: "fas fa-graduation-cap",
        name: "education university nearby",
      },
      { class: "fas fa-camera", name: "photography instagram worthy" },
      { class: "fas fa-suitcase", name: "luggage travel vacation" },

      // Weather & Seasonal
      { class: "fas fa-cloud-sun", name: "weather partly cloudy" },
      { class: "fas fa-rainbow", name: "rainbow tropical weather" },
      { class: "fas fa-wind", name: "wind breeze weather" },

      // Brand Icons
      { class: "fab fa-google", name: "google maps location" },
      { class: "fab fa-uber", name: "uber transport taxi" },
      { class: "fab fa-spotify", name: "spotify music entertainment" },
      { class: "fab fa-netflix", name: "netflix entertainment tv" },

      // Location Specific
      { class: "fas fa-mountain", name: "mountain nature hiking" },
      { class: "fas fa-water", name: "ocean sea water beach" },
      { class: "fas fa-city", name: "city urban downtown" },
      { class: "fas fa-map", name: "map navigation location" },

      // Miscellaneous
      { class: "fas fa-gift", name: "gift surprise welcome" },
      { class: "fas fa-magic", name: "special unique experience" },
      { class: "fas fa-infinity", name: "unlimited endless luxury" },
      { class: "fas fa-globe", name: "international global world" },
      { class: "fas fa-compass", name: "compass navigation direction" },
      { class: "fas fa-location-dot", name: "location pin marker" },
    ];

    this.initializeElements();
    this.setupEventListeners();
    this.setupDragAndDrop();
    this.setupKeyboardShortcuts();
    this.setupPageUnloadWarning();
    this.setupIconDialog();
    this.setupImageDialog();
    this.setupFooterDialog();
    this.setupMultilangDialog();
  }

  initializeElements() {
    this.uploadArea = document.getElementById("uploadArea");
    this.zipInput = document.getElementById("zipInput");
    this.folderInput = document.getElementById("folderInput");
    this.zipBtn = document.getElementById("zipBtn");
    this.folderBtn = document.getElementById("folderBtn");
    this.loadDemoBtn = document.getElementById("loadDemoBtn");
    this.projectInfo = document.getElementById("projectInfo");
    this.projectNameEl = document.getElementById("projectName");
    this.projectFilesEl = document.getElementById("projectFiles");
    this.fileList = document.getElementById("fileList");
    this.changesCounter = document.getElementById("changesCounter");
    this.unsavedWarning = document.getElementById("unsavedWarning");
    this.downloadBtn = document.getElementById("downloadBtn");
    this.refreshBtn = document.getElementById("refreshBtn");
    this.undoBtn = document.getElementById("undoBtn");
    this.resetBtn = document.getElementById("resetBtn");
    this.previewUrl = document.getElementById("previewUrl");
    this.editModeToggle = document.getElementById("editModeToggle");
    this.previewFrame = document.getElementById("previewFrame");
    this.loadingOverlay = document.getElementById("loadingOverlay");
    this.loadingText = document.getElementById("loadingText");
    this.statusMessage = document.getElementById("statusMessage");

    // Icon dialog elements
    this.iconDialogOverlay = document.getElementById("iconDialogOverlay");
    this.iconDialogClose = document.getElementById("iconDialogClose");
    this.iconSearch = document.getElementById("iconSearch");
    this.currentIconsSection = document.getElementById("currentIconsSection");
    this.currentIconsGrid = document.getElementById("currentIconsGrid");
    this.recommendedIconsGrid = document.getElementById("recommendedIconsGrid");
    this.noIconsMessage = document.getElementById("noIconsMessage");
    this.iconDialogCancel = document.getElementById("iconDialogCancel");
    this.iconDialogApply = document.getElementById("iconDialogApply");

    // Image dialog elements
    this.imageDialogOverlay = document.getElementById("imageDialogOverlay");
    this.imageDialogClose = document.getElementById("imageDialogClose");
    this.currentImagePreview = document.getElementById("currentImagePreview");
    this.currentImageImg = document.getElementById("currentImageImg");
    this.currentImageInfo = document.getElementById("currentImageInfo");
    this.imageUploadArea = document.getElementById("imageUploadArea");
    this.imageUploadBtn = document.getElementById("imageUploadBtn");
    this.imageFileInput = document.getElementById("imageFileInput");
    this.newImagePreview = document.getElementById("newImagePreview");
    this.newImageImg = document.getElementById("newImageImg");
    this.newImageInfo = document.getElementById("newImageInfo");
    this.imageDialogCancel = document.getElementById("imageDialogCancel");
    this.imageDialogApply = document.getElementById("imageDialogApply");

    // Footer dialog elements
    this.footerDialogOverlay = document.getElementById("footerDialogOverlay");
    this.footerDialogClose = document.getElementById("footerDialogClose");
    this.footerLinksList = document.getElementById("footerLinksList");
    this.footerDialogCancel = document.getElementById("footerDialogCancel");
    this.footerDialogApply = document.getElementById("footerDialogApply");

    // Multi-language dialog elements
    this.multilangDialogOverlay = document.getElementById(
      "multilangDialogOverlay"
    );
    this.multilangDialogClose = document.getElementById("multilangDialogClose");
    this.multilangDialogCancel = document.getElementById(
      "multilangDialogCancel"
    );
    this.multilangDialogApply = document.getElementById("multilangDialogApply");
  }

  setupEventListeners() {
    this.uploadArea.addEventListener("click", () => {
      this.zipBtn.click();
    });

    this.zipBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.zipInput.click();
    });

    this.folderBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.folderInput.click();
    });

    this.zipInput.addEventListener("change", (e) => {
      this.handleFiles(e.target.files, "zip");
    });

    this.folderInput.addEventListener("change", (e) => {
      this.handleFiles(e.target.files, "folder");
    });

    this.loadDemoBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.loadDemoProject();
    });

    this.editModeToggle.addEventListener("click", () => {
      this.toggleEditMode();
    });

    this.downloadBtn.addEventListener("click", () => {
      this.downloadProject();
    });

    this.refreshBtn.addEventListener("click", () => {
      this.refreshPreview();
    });

    this.undoBtn.addEventListener("click", () => {
      this.undoLastChange();
    });

    this.resetBtn.addEventListener("click", () => {
      this.resetChanges();
    });

    // Listen for messages from the preview iframe
    window.addEventListener("message", (e) => {
      this.handleIframeMessage(e);
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        this.undoLastChange();
      }
    });
  }

  setupPageUnloadWarning() {
    window.addEventListener("beforeunload", (e) => {
      // Only show warning if there are unsaved changes
      if (this.modifiedFiles.size > 0) {
        const message =
          "You have unsaved changes that will be lost. Make sure to download your project before leaving!";
        e.preventDefault();
        e.returnValue = message; // For Chrome
        return message; // For other browsers
      }
    });

    // Also warn on F5 specifically (some browsers handle this differently)
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "F5" ||
        (e.ctrlKey && e.key === "r") ||
        (e.metaKey && e.key === "r")
      ) {
        if (this.modifiedFiles.size > 0) {
          const shouldRefresh = confirm(
            "⚠️ You have unsaved changes!\n\n" +
              "Refreshing will lose all your text edits. " +
              "Please download your project first to save your changes.\n\n" +
              "Do you really want to refresh and lose your changes?"
          );

          if (!shouldRefresh) {
            e.preventDefault();
            this.showStatus(
              "💡 Remember to download your project to save changes!",
              "info"
            );
          }
        }
      }
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
      const type = files[0]?.name.endsWith(".zip") ? "zip" : "folder";
      this.handleFiles(files, type);
    });
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  async handleFiles(files, type) {
    this.showLoading("Processing files...");

    try {
      if (files.length === 0) {
        throw new Error("No files selected");
      }

      if (type === "zip") {
        await this.handleZipFile(files[0]);
      } else {
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
    this.showLoading("Extracting ZIP file...");

    const zip = new JSZip();
    const content = await zip.loadAsync(zipFile);

    this.projectFiles.clear();
    this.modifiedFiles.clear();
    this.undoStack = [];
    this.projectName = zipFile.name.replace(".zip", "");

    for (const [path, file] of Object.entries(content.files)) {
      if (!file.dir) {
        let fileContent;
        if (this.isTextFile(path)) {
          fileContent = await file.async("text");
        } else {
          fileContent = await file.async("uint8array");
        }

        this.projectFiles.set(path, {
          content: fileContent,
          type: this.getFileType(path),
          size: file._data ? file._data.uncompressedSize : 0,
        });
      }
    }
  }

  async handleDirectoryUpload(files) {
    this.projectFiles.clear();
    this.modifiedFiles.clear();
    this.undoStack = [];

    if (files.length > 0) {
      const firstPath = files[0].webkitRelativePath;
      this.projectName = firstPath.split("/")[0];
    }

    for (const file of files) {
      const relativePath = file.webkitRelativePath.substring(
        this.projectName.length + 1
      );
      if (relativePath) {
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

  async loadDemoProject() {
    this.showLoading("Loading demo project...");

    try {
      // Load the villa-zori demo project
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/demo/villa-zori/index.html`);
      if (!response.ok) {
        throw new Error(`Failed to load demo project (${response.status})`);
      }

      const htmlContent = await response.text();

      this.projectFiles.clear();
      this.modifiedFiles.clear();
      this.undoStack = [];
      this.projectName = "villa-zori-demo";

      this.projectFiles.set("index.html", {
        content: htmlContent,
        type: "text/html",
        size: htmlContent.length,
      });

      // Load all the assets from the demo project
      const assets = [
        "css/styles.css",
        "css/lang.css",
        "js/script.js",
        "js/lang.js",
        "js/translations_de.js",
        "js/translations_es.js",
        "js/translations_fr.js",
        "js/translations_hi.js",
        "js/translations_id.js",
        "js/translations_it.js",
        "js/translations_ja.js",
        "js/translations_ko.js",
        "js/translations_ru.js",
        "js/translations_zh.js",
      ];

      for (const asset of assets) {
        try {
          const assetResponse = await fetch(
            `${baseUrl}/demo/villa-zori/${asset}`
          );
          if (assetResponse.ok) {
            const content = await assetResponse.text();
            this.projectFiles.set(asset, {
              content: content,
              type: this.getFileType(asset),
              size: content.length,
            });
          }
        } catch (e) {
          console.log(`Asset not found: ${asset}`);
        }
      }

      // Load some sample images
      const images = [
        "images/img-hero-landscape-2560w.jpg",
        "images/img-landscape-1-960w.jpg",
        "images/img-landscape-2-960w.jpg",
      ];

      for (const image of images) {
        try {
          const imageResponse = await fetch(
            `${baseUrl}/demo/villa-zori/${image}`
          );
          if (imageResponse.ok) {
            const arrayBuffer = await imageResponse.arrayBuffer();
            this.projectFiles.set(image, {
              content: new Uint8Array(arrayBuffer),
              type: this.getFileType(image),
              size: arrayBuffer.byteLength,
            });
          }
        } catch (e) {
          console.log(`Image not found: ${image}`);
        }
      }

      await this.processProject();
      this.showStatus("Demo project loaded successfully!", "success");
    } catch (error) {
      console.error("Error loading demo:", error);
      this.showStatus(`Error loading demo: ${error.message}`, "error");
    } finally {
      this.hideLoading();
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
      woff: "font/woff",
      woff2: "font/woff2",
      ttf: "font/ttf",
    };
    return typeMap[ext] || "application/octet-stream";
  }

  async processProject() {
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

    // Detect available languages and translation files
    this.detectAvailableLanguages();

    this.updateUI();
    await this.loadPreview();
  }

  detectAvailableLanguages() {
    this.availableLanguages.clear();
    this.translationKeys.clear();

    // Look for translation files in js folder
    const translationFilePattern = /^js\/translations_([a-z]{2})\.js$/;

    this.projectFiles.forEach((fileData, path) => {
      const match = path.match(translationFilePattern);
      if (match) {
        const langCode = match[1];
        this.availableLanguages.set(langCode, path);
        console.log(
          `Found translation file for language: ${langCode} at ${path}`
        );
      }
    });

    // Always include English as the default language
    this.availableLanguages.set("en", "index.html");

    console.log("🔍 Detecting available languages...");
    console.log("📁 Project files:", Array.from(this.projectFiles.keys()));
    console.log(
      "🌍 Available languages:",
      Array.from(this.availableLanguages.keys())
    );
    console.log(
      "📋 Language mapping:",
      Object.fromEntries(this.availableLanguages)
    );
  }

  updateUI() {
    this.projectNameEl.textContent = this.projectName;
    this.projectFilesEl.innerHTML = `${this.projectFiles.size} files loaded`;
    this.updateChangesCounter();
    this.updateFileList();
    this.updateUndoButton();

    this.projectInfo.classList.add("active");
    this.downloadBtn.disabled = false;
    this.refreshBtn.disabled = false;
    this.editModeToggle.disabled = false;

    // Reset button should be disabled initially (no changes yet)
    this.resetBtn.disabled = true;
  }

  updateFileList() {
    this.fileList.innerHTML = "";

    const sortedFiles = Array.from(this.projectFiles.keys()).sort();
    sortedFiles.forEach((path) => {
      const fileItem = document.createElement("div");
      fileItem.className = "file-item";

      if (this.modifiedFiles.has(path)) {
        fileItem.classList.add("modified");
      }

      const icon = this.getFileIcon(path);
      fileItem.innerHTML = `
                  <span class="file-icon">${icon}</span>
                  <span>${path}</span>
              `;

      this.fileList.appendChild(fileItem);
    });
  }

  getFileIcon(path) {
    if (path.endsWith(".html")) return "🌐";
    if (path.endsWith(".css")) return "🎨";
    if (path.endsWith(".js")) return "⚡";
    if (path.endsWith(".json")) return "📄";
    if (path.match(/\.(jpg|jpeg|png|gif|svg)$/i)) return "🖼️";
    if (path.match(/\.(woff|woff2|ttf)$/i)) return "🔤";
    return "📄";
  }

  updateUndoButton() {
    this.undoBtn.disabled = this.undoStack.length === 0;
    this.undoBtn.textContent = "↶ Revert Last Change";
  }

  updateChangesCounter() {
    const changeCount = this.modifiedFiles.size;
    if (changeCount > 0) {
      this.changesCounter.textContent = changeCount;
      this.changesCounter.style.display = "inline";

      // Show unsaved changes warning
      this.unsavedWarning.classList.add("show");
    } else {
      this.changesCounter.style.display = "none";
      this.downloadBtn.innerHTML = "📦 Download Project";

      // Hide unsaved changes warning
      this.unsavedWarning.classList.remove("show");
    }

    // Enable/disable reset button based on changes
    this.resetBtn.disabled = changeCount === 0;

    this.updateFileList();
  }

  async loadPreview(savedScrollPosition = null) {
    try {
      this.showLoading("Loading preview...");

      // Save current scroll position in the iframe if not provided
      if (!savedScrollPosition) {
        savedScrollPosition = { x: 0, y: 0 };
        try {
          const iframeDoc = this.previewFrame.contentDocument;
          if (iframeDoc && iframeDoc.documentElement) {
            savedScrollPosition = {
              x:
                iframeDoc.documentElement.scrollLeft ||
                iframeDoc.body?.scrollLeft ||
                0,
              y:
                iframeDoc.documentElement.scrollTop ||
                iframeDoc.body?.scrollTop ||
                0,
            };
          }
        } catch (e) {
          // If we can't access the iframe document, that's okay
          console.log("Could not save scroll position:", e);
        }
      }

      // Clean up old URLs
      this.resourceUrls.forEach((url) => URL.revokeObjectURL(url));
      this.resourceUrls.clear();

      const htmlContent = this.getModifiedHtmlContent();
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      this.previewUrl.value = `Preview: ${this.projectName}`;
      this.previewFrame.src = url;

      await new Promise((resolve) => {
        this.previewFrame.onload = resolve;
      });

      // Small delay to ensure iframe is fully loaded, then restore scroll position
      setTimeout(() => {
        this.injectEditingCapabilities();
        this.updateFooterLinkOverlays();
        this.hideLoading();

        // Restore scroll position after everything is loaded and rendered
        try {
          const iframeDoc = this.previewFrame.contentDocument;
          if (iframeDoc && iframeDoc.documentElement) {
            iframeDoc.documentElement.scrollLeft = savedScrollPosition.x;
            iframeDoc.documentElement.scrollTop = savedScrollPosition.y;
          } else if (iframeDoc && iframeDoc.body) {
            iframeDoc.body.scrollLeft = savedScrollPosition.x;
            iframeDoc.body.scrollTop = savedScrollPosition.y;
          }
          console.log("Restored scroll position:", savedScrollPosition);
        } catch (e) {
          console.log("Could not restore scroll position:", e);
        }
      }, 200);
    } catch (error) {
      console.error("Error loading preview:", error);
      this.showStatus("Failed to load preview", "error");
      this.hideLoading();
    }
  }

  refreshPreview() {
    if (!this.projectFiles.size) {
      this.showStatus("No project loaded to refresh", "error");
      return;
    }

    // If edit mode is active, temporarily disable it during refresh
    const wasEditMode = this.editMode;
    if (wasEditMode) {
      this.toggleEditMode(false);
    }

    // Reload the preview to show animations and reset dynamic states
    this.loadPreview()
      .then(() => {
        this.showStatus("🔄 Preview refreshed", "success");

        // Re-enable edit mode if it was active
        if (wasEditMode) {
          setTimeout(() => {
            this.toggleEditMode(true);
          }, 500); // Small delay to let the page load
        }
      })
      .catch((error) => {
        console.error("Error refreshing preview:", error);
        this.showStatus("Failed to refresh preview", "error");
      });
  }

  async downloadProject() {
    try {
      this.showLoading("Preparing download...");

      const zip = new JSZip();

      // Get the list of images that are actually used in the HTML
      const usedImages = this.getUsedImages();
      console.log("Images used on page:", usedImages);

      // Add all files to zip, but filter out unused images
      this.projectFiles.forEach((fileData, path) => {
        // Skip unused image files
        if (this.isImageFile(path) && !usedImages.has(path)) {
          console.log("Skipping unused image:", path);
          return;
        }

        let content = fileData.content;

        // Use modified content if available
        if (this.modifiedFiles.has(path)) {
          content = this.modifiedFiles.get(path);
        }

        zip.file(path, content);
      });

      const blob = await zip.generateAsync({ type: "blob" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${this.projectName}-edited.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      this.showStatus("📦 Project downloaded successfully!", "success");
    } catch (error) {
      console.error("Error downloading project:", error);
      this.showStatus(`❌ Download failed: ${error.message}`, "error");
    } finally {
      this.hideLoading();
    }
  }

  getUsedImages() {
    const usedImages = new Set();

    // Get the main HTML content
    const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
      (path) =>
        path.endsWith(".html") &&
        (path === "index.html" || path.includes("index"))
    );

    if (!mainHtmlPath) return usedImages;

    let htmlContent =
      this.modifiedFiles.get(mainHtmlPath) ||
      this.projectFiles.get(mainHtmlPath).content;

    // Find all image references in the HTML
    // Look for src attributes in img tags, background-image in CSS, etc.
    const imagePatterns = [
      // Standard img src attributes
      /src=["']([^"']*\.(jpg|jpeg|png|gif|webp|svg|bmp|ico))["']/gi,
      // CSS background-image
      /background-image:\s*url\(["']?([^"')]*\.(jpg|jpeg|png|gif|webp|svg|bmp|ico))["']?\)/gi,
      // CSS background shorthand
      /background:\s*[^;]*url\(["']?([^"')]*\.(jpg|jpeg|png|gif|webp|svg|bmp|ico))["']?\)/gi,
    ];

    imagePatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(htmlContent)) !== null) {
        let imagePath = match[1];

        // Normalize the path
        imagePath = this.normalizeImagePath(imagePath);

        if (imagePath) {
          usedImages.add(imagePath);
          console.log("Found used image:", imagePath);
        }
      }
    });

    return usedImages;
  }

  normalizeImagePath(imagePath) {
    // Remove leading slash or protocol
    imagePath = imagePath.replace(/^\/+/, "");
    imagePath = imagePath.replace(/^https?:\/\/[^\/]+/, "");

    // Ensure it starts with the correct path structure
    if (
      !imagePath.startsWith("images/") &&
      !imagePath.startsWith("./images/")
    ) {
      // If it's just a filename, assume it's in images folder
      if (!imagePath.includes("/")) {
        imagePath = "images/" + imagePath;
      }
    }

    return imagePath;
  }

  isImageFile(path) {
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
      ".ico",
    ];
    const lowerPath = path.toLowerCase();
    return imageExtensions.some((ext) => lowerPath.endsWith(ext));
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
    return this.replaceResourcePaths(htmlContent);
  }

  replaceResourcePaths(htmlContent) {
    this.projectFiles.forEach((fileData, path) => {
      if (
        path.endsWith(".css") ||
        path.endsWith(".js") ||
        path.match(/\.(jpg|jpeg|png|gif|svg|woff|woff2|ttf)$/i)
      ) {
        // Check if this file has been modified, use modified content if available
        let content = this.modifiedFiles.has(path)
          ? this.modifiedFiles.get(path)
          : fileData.content;
        let blob;

        if (typeof content === "string") {
          blob = new Blob([content], { type: fileData.type });
        } else {
          blob = new Blob([content], { type: fileData.type });
        }

        const url = URL.createObjectURL(blob);
        this.resourceUrls.set(path, url);

        // Escape special regex characters in path
        const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        // Replace paths in HTML - handle various path formats
        const patterns = [
          new RegExp(`src=["']${escapedPath}["']`, "g"),
          new RegExp(`href=["']${escapedPath}["']`, "g"),
          new RegExp(`src=["']\\.\/${escapedPath}["']`, "g"),
          new RegExp(`href=["']\\.\/${escapedPath}["']`, "g"),
          // Handle paths without quotes (rare but possible)
          new RegExp(`src=${escapedPath}(?=\\s|>)`, "g"),
          new RegExp(`href=${escapedPath}(?=\\s|>)`, "g"),
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
              return match;
            });
          }
        });
      }
    });

    return htmlContent;
  }

  injectEditingCapabilities() {
    if (!this.previewFrame.contentDocument) return;

    const doc = this.previewFrame.contentDocument;

    // Remove any existing editing scripts/styles
    const existingStyle = doc.getElementById("visual-editor-styles");
    const existingScript = doc.getElementById("visual-editor-script");
    if (existingStyle) existingStyle.remove();
    if (existingScript) existingScript.remove();

    // Inject editing styles
    const editingStyles = doc.createElement("style");
    editingStyles.id = "visual-editor-styles";
    editingStyles.textContent = `
              .editable-element {
                  position: relative;
                  cursor: text !important;
                  transition: all 0.2s ease;
                  border-radius: 4px;
              }
              
              /* Icon editing styles */
              .editable-icon {
                  position: relative;
                  cursor: pointer !important;
                  transition: all 0.2s ease;
                  border-radius: 4px;
                  display: inline-block;
                  padding: 4px;
              }
              
              .editable-icon:hover {
                  outline: 2px dashed #ff9500 !important;
                  outline-offset: 2px;
                  background-color: rgba(255, 149, 0, 0.08) !important;
                  box-shadow: 0 0 0 4px rgba(255, 149, 0, 0.1) !important;
                  transform: scale(1.1);
              }
              
              .editable-icon.editing {
                  outline: 2px solid #ff9500 !important;
                  outline-offset: 2px;
                  background-color: rgba(255, 149, 0, 0.15) !important;
                  box-shadow: 0 0 0 4px rgba(255, 149, 0, 0.2) !important;
              }
              
              /* Preserve circular shape for review avatars and mini avatars */
              .editable-element.review-avatar,
              .review-avatar.editable-element,
              .review-avatar .editable-element,
              .editable-element.review-mini-avatar,
              .review-mini-avatar.editable-element,
              .review-mini-avatar .editable-element {
                  border-radius: 50% !important;
              }
              
              /* Preserve button border-radius for CTA buttons */
              .editable-element.cta-button,
              .cta-button.editable-element,
              .cta-button .editable-element {
                  border-radius: 8px !important;
              }
              
              /* Also preserve during hover and editing states */
              .editable-element.review-avatar:hover,
              .review-avatar.editable-element:hover,
              .editable-element.review-avatar.editing,
              .review-avatar.editable-element.editing,
              .editable-element.review-mini-avatar:hover,
              .review-mini-avatar.editable-element:hover,
              .editable-element.review-mini-avatar.editing,
              .review-mini-avatar.editable-element.editing,
              .editable-element.cta-button:hover,
              .cta-button.editable-element:hover,
              .cta-button .editable-element:hover,
              .editable-element.cta-button.editing,
              .cta-button.editable-element.editing,
              .cta-button .editable-element.editing {
                  border-radius: 50% !important;
              }
              
              /* But buttons should keep their button radius */
              .editable-element.cta-button:hover,
              .cta-button.editable-element:hover,
              .cta-button .editable-element:hover,
              .editable-element.cta-button.editing,
              .cta-button.editable-element.editing,
              .cta-button .editable-element.editing {
                  border-radius: 8px !important;
              }
              
              .editable-element:hover {
                  outline: 2px dashed #007aff !important;
                  outline-offset: 1px;
                  background-color: rgba(0, 122, 255, 0.08) !important;
                  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1) !important;
              }
              
              .editable-element.editing {
                  outline: 2px solid #007aff !important;
                  outline-offset: 1px;
                  background-color: rgba(0, 122, 255, 0.12) !important;
                  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.15) !important;
              }
              
              /* Hide outline on elements that contain icons */
              .editable-element:has(i[class*="fa"]):hover,
              .editable-element:has(.fa):hover,
              .editable-element:has([class*="fa-"]):hover,
              .editable-element:has(.star):hover {
                  outline: none !important;
                  background-color: transparent !important;
                  box-shadow: none !important;
              }
              
              /* Visual indicator for links in edit mode */
              body.edit-mode-active a:not([href]) {
                  cursor: text !important;
                  text-decoration: none !important;
              }
              
              body.edit-mode-active a.editable-element:hover {
                  text-decoration: none !important;
              }
              
              .edit-tooltip {
                  position: absolute;
                  top: -35px;
                  left: 0;
                  background: #007aff;
                  color: white;
                  padding: 6px 10px;
                  border-radius: 6px;
                  font-size: 12px;
                  font-weight: 500;
                  white-space: nowrap;
                  z-index: 10000;
                  pointer-events: none;
                  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
                  text-transform: none;
              }
              
              .edit-tooltip::after {
                  content: '';
                  position: absolute;
                  top: 100%;
                  left: 12px;
                  border: 6px solid transparent;
                  border-top-color: #007aff;
              }

              .icon-tooltip {
                  position: absolute;
                  top: -35px;
                  left: 0;
                  background: #007aff;
                  color: white;
                  padding: 6px 10px;
                  border-radius: 6px;
                  font-size: 12px;
                  font-weight: 500;
                  white-space: nowrap;
                  z-index: 10000;
                  pointer-events: none;
                  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
                  text-transform: none;
              }
              
              .icon-tooltip::after {
                  content: '';
                  position: absolute;
                  top: 100%;
                  left: 12px;
                  border: 6px solid transparent;
                  border-top-color: #007aff;
              }

              /* Image editing styles */
              .editable-image {
                  cursor: pointer !important;
                  transition: all 0.2s ease;
                  position: relative;
              }
              
              .editable-image:hover {
                  outline: 2px dashed #34c759 !important;
                  outline-offset: 2px;
                  box-shadow: 0 0 0 4px rgba(52, 199, 89, 0.15) !important;
                  transform: scale(1.02);
              }
              
              .editable-image.editing {
                  outline: 2px solid #34c759 !important;
                  outline-offset: 2px;
                  box-shadow: 0 0 0 4px rgba(52, 199, 89, 0.2) !important;
              }

              .image-tooltip {
                  position: absolute;
                  bottom: 5px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: rgba(52, 199, 89, 0.95);
                  backdrop-filter: blur(4px);
                  color: white;
                  padding: 8px 12px;
                  border-radius: 8px;
                  font-size: 13px;
                  font-weight: 600;
                  white-space: nowrap;
                  z-index: 10001;
                  pointer-events: none;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                  text-transform: none;
                  opacity: 1;
                  border: 1px solid rgba(255, 255, 255, 0.2);
              }
              
              .image-tooltip::after {
                  content: '';
                  position: absolute;
                  bottom: 100%;
                  left: 50%;
                  transform: translateX(-50%);
                  border: 6px solid transparent;
                  border-bottom-color: rgba(52, 199, 89, 0.9);
              }
              
              /* Tooltip arrow when shown above image */
              .image-tooltip[style*="--arrow-direction: top"]::after {
                  bottom: auto;
                  top: 100%;
                  border-bottom-color: transparent;
                  border-top-color: rgba(52, 199, 89, 0.9);
              }
          `;
    doc.head.appendChild(editingStyles);

    // Inject editing script
    const editingScript = doc.createElement("script");
    editingScript.id = "visual-editor-script";
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
                      // Add/remove edit mode class from body
                      if (enabled) {
                          document.body.classList.add('edit-mode-active');
                          // Remove href from all links to prevent navigation
                          document.querySelectorAll('a[href]').forEach(link => {
                              link.setAttribute('data-original-href', link.getAttribute('href'));
                              link.removeAttribute('href');
                          });
                      } else {
                          document.body.classList.remove('edit-mode-active');
                          // Restore href to all links
                          document.querySelectorAll('a[data-original-href]').forEach(link => {
                              link.setAttribute('href', link.getAttribute('data-original-href'));
                              link.removeAttribute('data-original-href');
                          });
                      }
                      
                      const editableElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, span:not(.fa):not([class*="fa-"]):not(.star), a, li');
                      const iconElements = document.querySelectorAll('i[class*="fa"]');
                      const imageElements = document.querySelectorAll('img');
                      
                      // Handle text elements
                      editableElements.forEach(el => {
                          if (enabled) {
                              if (isValidTextElement(el) && !isInNavigation(el) && !hasIconChildren(el)) {
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
                              hideTooltip({ target: el });
                          }
                      });

                      // Handle icon elements
                      iconElements.forEach(icon => {
                          if (enabled) {
                              if (isValidIcon(icon)) {
                                  icon.classList.add('editable-icon');
                                  icon.addEventListener('click', handleIconClick);
                                  icon.addEventListener('mouseenter', showIconTooltip);
                                  icon.addEventListener('mouseleave', hideIconTooltip);
                              }
                          } else {
                              icon.classList.remove('editable-icon');
                              icon.removeEventListener('click', handleIconClick);
                              icon.removeEventListener('mouseenter', showIconTooltip);
                              icon.removeEventListener('mouseleave', hideIconTooltip);
                              hideIconTooltip({ target: icon });
                          }
                      });

                      // Handle image elements
                      imageElements.forEach(image => {
                          if (enabled) {
                              if (isValidImage(image)) {
                                  // Apply editable class to the parent element instead of the image
                                  const parentElement = image.parentElement;
                                  if (parentElement) {
                                      parentElement.classList.add('editable-image');
                                      parentElement.addEventListener('click', handleImageClick);
                                      parentElement.addEventListener('mouseenter', showImageTooltip);
                                      parentElement.addEventListener('mouseleave', hideImageTooltip);
                                      // Store reference to the image element on the parent
                                      parentElement.dataset.imageElement = 'true';
                                  }
                              }
                          } else {
                              // Remove from parent element
                              const parentElement = image.parentElement;
                              if (parentElement && parentElement.classList.contains('editable-image')) {
                                  parentElement.classList.remove('editable-image');
                                  parentElement.removeEventListener('click', handleImageClick);
                                  parentElement.removeEventListener('mouseenter', showImageTooltip);
                                  parentElement.removeEventListener('mouseleave', hideImageTooltip);
                                  hideImageTooltip({ target: parentElement });
                                  delete parentElement.dataset.imageElement;
                              }
                          }
                      });

                      // Re-check images after a delay to catch lazy-loaded images
                      if (enabled) {
                          setTimeout(() => {
                              const newImageElements = document.querySelectorAll('img');
                              newImageElements.forEach(image => {
                                  const parentElement = image.parentElement;
                                  if (parentElement && !parentElement.classList.contains('editable-image') && isValidImage(image)) {
                                      parentElement.classList.add('editable-image');
                                      parentElement.addEventListener('click', handleImageClick);
                                      parentElement.addEventListener('mouseenter', showImageTooltip);
                                      parentElement.addEventListener('mouseleave', hideImageTooltip);
                                      parentElement.dataset.imageElement = 'true';
                                  }
                              });
                          }, 2000);
                      }
                  }

                  function isValidIcon(icon) {
                      // Allow most FontAwesome icons except those in navigation or language switcher
                      if (icon.closest('.language-switcher, .language-dropdown')) {
                          return false;
                      }
                      
                      // Allow icons in features, amenities, location highlights, and footer
                      if (icon.closest('.feature-card, .amenity-item, .location-item, .footer-social')) {
                          return true;
                      }
                      
                      // Allow badge icons
                      if (icon.closest('.badge')) {
                          return true;
                      }
                      
                      // Block navigation chevrons and other UI elements
                      if (icon.classList.contains('fa-chevron-down') || 
                          icon.classList.contains('fa-chevron-up') ||
                          icon.classList.contains('fa-chevron-left') ||
                          icon.classList.contains('fa-chevron-right')) {
                          return false;
                      }
                      
                      return true;
                  }

                  function handleIconClick(e) {
                      if (!editMode) return;
                      
                      e.stopPropagation();
                      e.preventDefault();
                      
                      // Check if this is a footer social link
                      if (e.target.closest('.footer-social')) {
                          // Send message to parent window to open footer dialog
                          window.parent.postMessage({
                              type: 'openFooterDialog',
                              linkElement: getElementPath(e.target.closest('a')),
                              currentHref: e.target.closest('a').href,
                              currentAriaLabel: e.target.closest('a').getAttribute('aria-label')
                          }, '*');
                      } else {
                          // Send message to parent window to open icon dialog
                          window.parent.postMessage({
                              type: 'openIconDialog',
                              iconElement: getElementPath(e.target),
                              currentClass: e.target.className
                          }, '*');
                      }
                  }

                  function showIconTooltip(e) {
                      if (!editMode || currentlyEditing) return;
                      
                      const tooltip = document.createElement('div');
                      tooltip.className = 'icon-tooltip';
                      
                      // Check if this is a footer social link
                      if (e.target.closest('.footer-social')) {
                          tooltip.textContent = '🔗 Click to edit link';
                      } else {
                          tooltip.textContent = '🎨 Click to change icon';
                      }
                      
                      // Append to parent element instead of the <i> tag to avoid FontAwesome CSS inheritance
                      const parentElement = e.target.parentElement;
                      if (parentElement) {
                          parentElement.appendChild(tooltip);
                          
                          // Position the tooltip relative to the icon
                          const iconRect = e.target.getBoundingClientRect();
                          const parentRect = parentElement.getBoundingClientRect();
                          
                          tooltip.style.left = (iconRect.left - parentRect.left) + 'px';
                      } else {
                          // Fallback to appending to the icon itself
                          e.target.appendChild(tooltip);
                      }
                  }
                  
                  function hideIconTooltip(e) {
                      // Look for tooltip in both the target and its parent
                      let tooltip = e.target.querySelector('.icon-tooltip');
                      if (!tooltip && e.target.parentElement) {
                          tooltip = e.target.parentElement.querySelector('.icon-tooltip');
                      }
                      if (tooltip) {
                          tooltip.remove();
                      }
                  }

                  function isValidImage(image) {
                      // Skip images in navigation or UI elements first
                      if (image.closest('.language-switcher, .language-dropdown, nav, .nav, .navigation, .menu, header nav, .navbar')) {
                          return false;
                      }

                      // Always allow these specific image types regardless of current size (they might be lazy loading)
                      if (image.closest('.hero, .gallery, .gallery-grid, .gallery-item, .about, .about-image, .image-content, .feature, .location')) {
                          return true;
                      }

                      // Allow hero background images
                      if (image.classList.contains('hero-bg-image')) {
                          return true;
                      }

                      // For other images, check dimensions if available
                      const hasValidDimensions = image.offsetWidth >= 40 && image.offsetHeight >= 40;
                      const hasValidNaturalDimensions = image.naturalWidth >= 40 && image.naturalHeight >= 40;
                      
                      // If image has valid dimensions (either current or natural), allow it if it's large enough
                      if (hasValidDimensions || hasValidNaturalDimensions) {
                          // Skip very small avatar images, but allow larger ones
                          if (image.closest('.review-avatar, .review-mini-avatar')) {
                              const currentSize = Math.max(image.offsetWidth, image.offsetHeight);
                              const naturalSize = Math.max(image.naturalWidth, image.naturalHeight);
                              return currentSize >= 60 || naturalSize >= 60;
                          }
                          
                          // Allow reasonably large images
                          const currentLarge = image.offsetWidth >= 100 || image.offsetHeight >= 100;
                          const naturalLarge = image.naturalWidth >= 100 || image.naturalHeight >= 100;
                          return currentLarge || naturalLarge;
                      }

                      // Default to false for images without valid dimensions
                      return false;
                  }

                  function handleImageClick(e) {
                      if (!editMode) return;
                      
                      e.stopPropagation();
                      e.preventDefault();
                      
                      // Find the actual image element within the parent
                      const imageElement = e.target.querySelector('img') || e.target;
                      
                      // Send message to parent window to open image dialog
                      window.parent.postMessage({
                          type: 'openImageDialog',
                          imageElement: getElementPath(imageElement),
                          currentSrc: imageElement.src
                      }, '*');
                  }

                  function showImageTooltip(e) {
                      if (!editMode || currentlyEditing) return;
                      
                      const tooltip = document.createElement('div');
                      tooltip.className = 'image-tooltip';
                      tooltip.textContent = '🖼️ Click to change image';
                      
                      // Store original position value and only set relative if needed
                      const originalPosition = window.getComputedStyle(e.target).position;
                      e.target.dataset.originalPosition = originalPosition;
                      
                      // Only set position relative if it's not already positioned
                      if (originalPosition === 'static') {
                          e.target.style.position = 'relative';
                      }
                      
                      e.target.appendChild(tooltip);
                      
                      // Adjust tooltip position if element is near bottom of viewport
                      const elementRect = e.target.getBoundingClientRect();
                      const viewportHeight = window.innerHeight;
                      
                      if (elementRect.bottom > viewportHeight - 50) {
                          // If element is near bottom of screen, show tooltip above
                          tooltip.style.bottom = 'auto';
                          tooltip.style.top = '-35px';
                          
                          // Update arrow direction
                          tooltip.style.setProperty('--arrow-direction', 'top');
                      }
                  }
                  
                  function hideImageTooltip(e) {
                      const tooltip = e.target.querySelector('.image-tooltip');
                      if (tooltip) {
                          tooltip.remove();
                      }
                      
                      // Restore original position if we changed it
                      const originalPosition = e.target.dataset.originalPosition;
                      if (originalPosition && originalPosition === 'static') {
                          e.target.style.position = '';
                      }
                      
                      // Clean up the stored data
                      delete e.target.dataset.originalPosition;
                  }
                  
                  function isValidTextElement(el) {
                      const text = el.textContent.trim();
                      
                      // Must have text content
                      if (!text || text.length === 0 || text.length > 900) {
                          return false;
                      }
                      
                      // Allow specific important elements regardless of other rules - CHECK FIRST
                      if (el.classList.contains('hero-subtitle')) {
                          return true;
                      }
                      
                      if (el.closest('.logo, .brand, .review-avatar, .review-mini-avatar') || 
                          el.closest('.hero-subtitle') ||
                          (el.closest('.badge') && el.tagName === 'SPAN')) {
                          return true;
                      }
                      
                      // Exclude elements with media content (but allow SVG text)
                      if (el.querySelector('img, video, iframe')) {
                          return false;
                      }
                      
                      // Allow single character elements (like review avatars)
                      if (text.length === 1) {
                          return true;
                      }
                      
                      // For div elements, be more restrictive unless they're special
                      if (el.tagName === 'DIV') {
                          // Always allow hero-subtitle divs
                          if (el.classList.contains('hero-subtitle')) {
                              return true;
                          }
                          
                          // Only allow divs that are clearly text containers, not layout containers
                          const childElements = el.children.length;
                          if (childElements === 0) {
                              // Pure text div - allow it
                              return true;
                          }
                          // Has children - likely a container, don't allow unless it's special (handled above)
                          return false;
                      }
                      
                      // Exclude elements that are primarily containers for other elements
                      const childElements = el.children.length;
                      const textLength = text.length;
                      
                      // More lenient container detection - allow elements with few children
                      if (childElements > 3 && textLength / childElements < 5) {
                          return false;
                      }
                      
                      // Exclude elements with only icon/symbol content (but allow single letters/initials)
                      if (text.length > 1 && text.match(/^[\s\u2600-\u26FF\u2700-\u27BF\uE000-\uF8FF\uFE00-\uFEFF]*$/)) {
                          return false;
                      }
                      
                      return true;
                  }
                  
                  function hasIconChildren(el) {
                      // Allow hero subtitle FIRST - most important
                      if (el.classList.contains('hero-subtitle')) {
                          return false;
                      }
                      
                      // Allow badge text elements even if they're in badge containers
                      if (el.closest('.badge') && el.tagName === 'SPAN' && !el.querySelector('i, .fa')) {
                          return false;
                      }
                      
                      // Allow logo/brand text
                      if (el.closest('.logo, .brand')) {
                          return false;
                      }
                      
                      // Allow elements close to hero subtitle
                      if (el.closest('.hero-subtitle')) {
                          return false;
                      }
                      
                      // Allow button text spans
                      if (el.tagName === 'SPAN' && el.closest('.cta-button, .btn, .button')) {
                          return false;
                      }
                      
                      // Allow review avatar text (single letters)
                      if ((el.closest('.review-avatar') || el.closest('.review-mini-avatar')) && el.textContent.trim().length <= 2) {
                          return false;
                      }
                      
                      // Check for Font Awesome icons (but not in the allowed elements above)
                      if (el.querySelector('i[class*="fa"], .fa, [class*="fa-"]')) {
                          return true;
                      }
                      
                      // Check for star elements (rating systems) but allow review content
                      if (el.querySelector('.star, .stars, [class*="star"]') && !el.closest('.review-content, .review-text')) {
                          return true;
                      }
                      
                      // Check for icon patterns but be more specific
                      if (el.querySelector('[class*="icon"]:not(.review-avatar):not(.review-mini-avatar), .emoji') && !el.closest('.logo, .brand')) {
                          return true;
                      }
                      
                      // Check if element contains mostly symbols/emojis (but allow single character avatars)
                      const textContent = el.textContent.trim();
                      if (textContent.length > 1) {
                          const symbolMatch = textContent.match(/[\u2600-\u26FF\u2700-\u27BF\uE000-\uF8FF\uFE00-\uFEFF]/g);
                          if (symbolMatch && symbolMatch.length > textContent.replace(/\s/g, '').length * 0.3) {
                              return true;
                          }
                      }
                      
                      return false;
                  }
                  
                  function isInNavigation(el) {
                      // Allow logo/brand text in navigation
                      if (el.closest('.logo, .brand')) {
                          return false;
                      }
                      
                      // Allow hero subtitle
                      if (el.classList.contains('hero-subtitle') || el.closest('.hero-subtitle')) {
                          return false;
                      }
                      
                      // Allow navigation links but exclude complex navigation containers
                      if (el.tagName === 'A' && el.closest('nav, .nav, .navigation, .menu, header nav, .navbar')) {
                          return false;
                      }
                      
                      // Block CTA button containers but allow their inner span text
                      if (el.classList.contains('cta-button') || el.classList.contains('btn') || el.classList.contains('button')) {
                          return true; // Block the button container itself
                      }
                      
                      // Allow text inside CTA buttons (spans within buttons)
                      if (el.tagName === 'SPAN' && el.closest('.cta-button, .btn, .button')) {
                          return false; // Allow the span inside the button
                      }
                      
                      // Check for language switcher and similar UI elements that should NOT be edited
                      if (el.closest('.language-switcher, .language-dropdown, .dropdown, .modal, .popup')) {
                          return true;
                      }
                      
                      // Check for form elements that shouldn't be edited
                      if (el.closest('button, input, select, textarea')) {
                          return true;
                      }
                      
                      // Allow badge text but not the badge containers
                      if (el.closest('.badge') && el.tagName === 'SPAN' && !el.querySelector('i, .fa')) {
                          return false;
                      }
                      
                      // Exclude star rating interactive elements but allow review text
                      if (el.closest('.stars, .star-rating') && !el.closest('.review-content, .review-text')) {
                          return true;
                      }
                      
                      // Exclude only the footer attribution from editing (airliftstudios.com credit)
                      if (el.closest('.footer-attribution, .attribution, .credit, .powered-by')) {
                          return true;
                      }
                      
                      return false;
                  }
                  
                  function showTooltip(e) {
                      if (!editMode || currentlyEditing) return;
                      
                      const tooltip = document.createElement('div');
                      tooltip.className = 'edit-tooltip';
                      tooltip.textContent = '✏️ Click to edit';
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
                      
                      // Stop event propagation but no need to prevent default since links have no href
                      e.stopPropagation();
                      
                      // Find the most specific editable element
                      const targetElement = findBestEditableElement(e.target);
                      if (!targetElement) return;
                      
                      if (currentlyEditing && currentlyEditing !== targetElement) {
                          finishEditing();
                      }
                      
                      startEditing(targetElement);
                  }
                  
                  function findBestEditableElement(clickedElement) {
                      // If the clicked element is directly editable, use it
                      if (clickedElement.classList.contains('editable-element')) {
                          return clickedElement;
                      }
                      
                      // Look for the closest editable element (walking up the DOM)
                      let current = clickedElement;
                      while (current && current !== document.body) {
                          if (current.classList.contains('editable-element')) {
                              return current;
                          }
                          current = current.parentElement;
                      }
                      
                      return null;
                  }
                  
                  function startEditing(element) {
                      currentlyEditing = element;
                      element.classList.add('editing');
                      hideTooltip({ target: element });
                      
                      // Check if element has data-translate attribute
                      const translateKey = element.getAttribute('data-translate');
                      if (translateKey) {
                          // Show multi-language dialog instead of inline editing
                          window.parent.postMessage({
                              type: 'openMultilangDialog',
                              element: getElementPath(element),
                              translateKey: translateKey,
                              currentText: element.textContent,
                              elementId: element.id || null,
                              elementClasses: element.className || null
                          }, '*');
                          return;
                      }
                      
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
                              window.parent.postMessage({
                                  type: 'textChanged',
                                  element: getElementPath(element),
                                  oldText: originalText,
                                  newText: newText,
                                  elementId: element.id || null,
                                  elementClasses: element.className || null
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
                              const validClasses = current.className.split(' ').filter(c => c && !c.includes('editable'));
                              if (validClasses.length > 0) {
                                  selector += '.' + validClasses.join('.');
                              }
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

                  // Amenity editing functionality
                  function setupAmenityEditing() {
                      if (!editMode) return;
                      
                      // Add delete buttons to existing amenity items
                      const amenityItems = document.querySelectorAll('.amenity-item');
                      amenityItems.forEach(item => {
                          // Remove existing delete button if any
                          const existingDeleteBtn = item.querySelector('.amenity-delete-btn');
                          if (existingDeleteBtn) {
                              existingDeleteBtn.remove();
                          }
                          
                          // Add delete button
                          const deleteBtn = document.createElement('div');
                          deleteBtn.className = 'amenity-delete-btn';
                          deleteBtn.innerHTML = '×';
                          deleteBtn.addEventListener('click', (e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              parent.postMessage({
                                  type: 'deleteAmenity',
                                  amenityElement: item.outerHTML
                              }, '*');
                          });
                          item.appendChild(deleteBtn);
                      });
                      
                      // Add "Add Amenity" button to amenities grid
                      const amenitiesGrid = document.querySelector('.amenities-grid');
                      if (amenitiesGrid) {
                          // Remove existing add button if any
                          const existingAddBtn = amenitiesGrid.querySelector('.amenity-add-btn');
                          if (existingAddBtn) {
                              existingAddBtn.remove();
                          }
                          
                          // Add "Add Amenity" button
                          const addBtn = document.createElement('div');
                          addBtn.className = 'amenity-add-btn';
                          addBtn.innerHTML = '<i class="fas fa-plus"></i><span>Add Amenity</span>';
                          addBtn.addEventListener('click', (e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              parent.postMessage({
                                  type: 'openAmenityDialog'
                              }, '*');
                          });
                          amenitiesGrid.appendChild(addBtn);
                      }
                  }
                  
                  function removeAmenityEditing() {
                      // Remove delete buttons
                      const deleteButtons = document.querySelectorAll('.amenity-delete-btn');
                      deleteButtons.forEach(btn => btn.remove());
                      
                      // Remove add button
                      const addButton = document.querySelector('.amenity-add-btn');
                      if (addButton) {
                          addButton.remove();
                      }
                  }
                  
                  // Call amenity setup when edit mode is toggled
                  const originalToggleEditMode = toggleEditMode;
                  toggleEditMode = function(enabled) {
                      originalToggleEditMode(enabled);
                      if (enabled) {
                          setTimeout(setupAmenityEditing, 100);
                      } else {
                          removeAmenityEditing();
                      }
                  };
              })();
          `;
    doc.head.appendChild(editingScript);
  }

  setupIconDialog() {
    // Close dialog handlers
    this.iconDialogClose.addEventListener("click", () =>
      this.closeIconDialog()
    );
    this.iconDialogCancel.addEventListener("click", () =>
      this.closeIconDialog()
    );
    this.iconDialogOverlay.addEventListener("click", (e) => {
      if (e.target === this.iconDialogOverlay) {
        this.closeIconDialog();
      }
    });

    // Apply selection
    this.iconDialogApply.addEventListener("click", () =>
      this.applyIconSelection()
    );

    // Search functionality
    this.iconSearch.addEventListener("input", (e) =>
      this.filterIcons(e.target.value)
    );

    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        this.iconDialogOverlay.classList.contains("show")
      ) {
        this.closeIconDialog();
      }
    });

    // Populate recommended icons grid
    this.populateRecommendedIcons();
  }

  populateRecommendedIcons() {
    this.recommendedIconsGrid.innerHTML = "";

    this.airbnbIcons.forEach((iconData) => {
      const iconOption = document.createElement("div");
      iconOption.className = "icon-option";
      iconOption.dataset.iconClass = iconData.class;
      iconOption.dataset.searchTerms = iconData.name;
      iconOption.innerHTML = `<i class="${iconData.class}"></i>`;
      iconOption.title = iconData.class;

      iconOption.addEventListener("click", () =>
        this.selectIcon(iconOption, iconData.class)
      );

      this.recommendedIconsGrid.appendChild(iconOption);
    });
  }

  extractCurrentPageIcons() {
    this.currentPageIcons.clear();

    if (!this.previewFrame.contentDocument) return;

    const iconElements =
      this.previewFrame.contentDocument.querySelectorAll('i[class*="fa"]');
    iconElements.forEach((icon) => {
      const iconClass = icon.className;
      if (iconClass && iconClass.includes("fa")) {
        this.currentPageIcons.add(iconClass);
      }
    });

    this.populateCurrentPageIcons();
  }

  populateCurrentPageIcons() {
    this.currentIconsGrid.innerHTML = "";

    if (this.currentPageIcons.size === 0) {
      this.currentIconsSection.style.display = "none";
      return;
    }

    this.currentIconsSection.style.display = "block";

    Array.from(this.currentPageIcons).forEach((iconClass) => {
      const iconOption = document.createElement("div");
      iconOption.className = "icon-option";
      iconOption.dataset.iconClass = iconClass;
      iconOption.dataset.searchTerms = iconClass
        .replace(/fa[sb]?\s+fa-/g, "")
        .replace(/-/g, " ");
      iconOption.innerHTML = `<i class="${iconClass}"></i>`;
      iconOption.title = iconClass;

      iconOption.addEventListener("click", () =>
        this.selectIcon(iconOption, iconClass)
      );

      this.currentIconsGrid.appendChild(iconOption);
    });
  }

  selectIcon(iconElement, iconClass) {
    // Remove previous selection
    document.querySelectorAll(".icon-option.selected").forEach((el) => {
      el.classList.remove("selected");
    });

    // Select new icon
    iconElement.classList.add("selected");
    this.selectedIcon = iconClass;
    this.iconDialogApply.disabled = false;
  }

  filterIcons(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const allIconOptions = document.querySelectorAll(".icon-option");
    let visibleCount = 0;

    allIconOptions.forEach((iconOption) => {
      const searchTerms = iconOption.dataset.searchTerms || "";
      const iconClass = iconOption.dataset.iconClass || "";

      const matches =
        !term ||
        searchTerms.toLowerCase().includes(term) ||
        iconClass.toLowerCase().includes(term);

      iconOption.style.display = matches ? "flex" : "none";
      if (matches) visibleCount++;
    });

    // Show/hide sections based on visibility
    const currentSectionVisible =
      this.currentIconsGrid.querySelectorAll(
        '.icon-option[style*="flex"], .icon-option:not([style*="none"])'
      ).length > 0;
    const recommendedSectionVisible =
      this.recommendedIconsGrid.querySelectorAll(
        '.icon-option[style*="flex"], .icon-option:not([style*="none"])'
      ).length > 0;

    this.currentIconsSection.style.display =
      currentSectionVisible && this.currentPageIcons.size > 0
        ? "block"
        : "none";
    this.noIconsMessage.style.display = visibleCount === 0 ? "block" : "none";
  }

  openIconDialog(iconElement) {
    this.currentEditingIcon = iconElement;
    this.selectedIcon = null;

    // Extract current page icons
    this.extractCurrentPageIcons();

    // Clear search
    this.iconSearch.value = "";
    this.filterIcons("");

    // Reset selection
    document.querySelectorAll(".icon-option.selected").forEach((el) => {
      el.classList.remove("selected");
    });
    this.iconDialogApply.disabled = true;

    // Highlight current icon if it exists in the grid
    const currentIconClass = iconElement.className;
    const currentIconOption = document.querySelector(
      `[data-icon-class="${currentIconClass}"]`
    );
    if (currentIconOption) {
      this.selectIcon(currentIconOption, currentIconClass);
    }

    // Show dialog
    this.iconDialogOverlay.classList.add("show");
    this.iconSearch.focus();
  }

  closeIconDialog() {
    this.iconDialogOverlay.classList.remove("show");
    this.currentEditingIcon = null;
    this.selectedIcon = null;
  }

  applyIconSelection() {
    if (!this.selectedIcon || !this.currentEditingIcon) return;

    const oldIconClass = this.currentEditingIcon.className;
    const newIconClass = this.selectedIcon;

    // Save to undo stack
    this.saveToUndoStack({
      type: "iconChange",
      element: this.getElementPath(this.currentEditingIcon),
      oldIconClass: oldIconClass,
      newIconClass: newIconClass,
      timestamp: Date.now(),
    });

    // Update the icon in the iframe
    this.currentEditingIcon.className = newIconClass;

    // Update the HTML content
    this.updateIconInHTML(oldIconClass, newIconClass);

    this.closeIconDialog();
    this.showStatus(
      `🎨 Icon updated: ${oldIconClass} → ${newIconClass}`,
      "success"
    );
  }

  setupImageDialog() {
    // Close dialog handlers
    this.imageDialogClose.addEventListener("click", () =>
      this.closeImageDialog()
    );
    this.imageDialogCancel.addEventListener("click", () =>
      this.closeImageDialog()
    );
    this.imageDialogOverlay.addEventListener("click", (e) => {
      if (e.target === this.imageDialogOverlay) {
        this.closeImageDialog();
      }
    });

    // Upload button and area click
    this.imageUploadBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      console.log("Upload button clicked");
      this.imageFileInput.click();
    });
    this.imageUploadArea.addEventListener("click", (e) => {
      e.stopPropagation();
      console.log("Upload area clicked");
      this.imageFileInput.click();
    });

    // File input change
    this.imageFileInput.addEventListener("change", (e) =>
      this.handleImageFileSelect(e)
    );

    // Apply selection
    this.imageDialogApply.addEventListener("click", () =>
      this.applyImageSelection()
    );

    // Drag and drop
    this.setupImageDragAndDrop();

    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        this.imageDialogOverlay.classList.contains("show")
      ) {
        this.closeImageDialog();
      }
    });
  }

  setupFooterDialog() {
    // Close dialog handlers
    this.footerDialogClose.addEventListener("click", () =>
      this.closeFooterDialog()
    );
    this.footerDialogCancel.addEventListener("click", () =>
      this.closeFooterDialog()
    );
    this.footerDialogOverlay.addEventListener("click", (e) => {
      if (e.target === this.footerDialogOverlay) {
        this.closeFooterDialog();
      }
    });

    // Apply button
    this.footerDialogApply.addEventListener("click", async () => {
      await this.applyAllFooterChanges();
    });

    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        this.footerDialogOverlay.classList.contains("show")
      ) {
        this.closeFooterDialog();
      }
    });
  }

  setupMultilangDialog() {
    // Close dialog handlers
    this.multilangDialogClose.addEventListener("click", () =>
      this.closeMultilangDialog()
    );
    this.multilangDialogCancel.addEventListener("click", () =>
      this.closeMultilangDialog()
    );
    this.multilangDialogOverlay.addEventListener("click", (e) => {
      if (e.target === this.multilangDialogOverlay) {
        this.closeMultilangDialog();
      }
    });

    // Apply button
    this.multilangDialogApply.addEventListener("click", async () => {
      await this.applyMultilangChanges();
    });

    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        this.multilangDialogOverlay.classList.contains("show")
      ) {
        this.closeMultilangDialog();
      }
    });
  }

  setupImageDragAndDrop() {
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      this.imageUploadArea.addEventListener(eventName, this.preventDefaults);
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      this.imageUploadArea.addEventListener(eventName, () => {
        this.imageUploadArea.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      this.imageUploadArea.addEventListener(eventName, () => {
        this.imageUploadArea.classList.remove("dragover");
      });
    });

    this.imageUploadArea.addEventListener("drop", (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith("image/")) {
        this.handleImageFile(files[0]);
      }
    });
  }

  openImageDialog(imageElement) {
    this.currentEditingImage = imageElement;
    this.selectedImageFile = null;

    // Store the original path for later use - try multiple methods to find it
    this.currentEditingImageOriginalPath =
      this.findOriginalImagePath(imageElement);
    console.log(
      "Found original path:",
      this.currentEditingImageOriginalPath,
      "for src:",
      imageElement.src
    );

    // Show current image
    this.currentImageImg.src = imageElement.src;

    // Reset new image preview
    this.newImagePreview.style.display = "none";
    this.imageDialogApply.disabled = true;

    // Show dialog
    this.imageDialogOverlay.classList.add("show");
  }

  closeImageDialog() {
    this.imageDialogOverlay.classList.remove("show");
    this.currentEditingImage = null;
    this.selectedImageFile = null;
    this.currentEditingImageOriginalPath = null;
    this.newImagePreview.style.display = "none";
    this.imageFileInput.value = "";
  }

  handleImageFileSelect(e) {
    console.log("File input changed, files:", e.target.files);
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      console.log("Valid image file selected:", file.name);
      this.handleImageFile(file);
    } else if (file) {
      console.log("Invalid file type selected:", file.type);
      this.showStatus("Please select a valid image file", "error");
      // Reset the input value only if it's not a valid image
      e.target.value = "";
    } else {
      console.log("No file selected");
    }
  }

  handleImageFile(file) {
    this.selectedImageFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.newImageImg.src = e.target.result;
      this.newImageInfo.textContent = `New: ${file.name} (${this.formatFileSize(
        file.size
      )})`;
      this.newImagePreview.style.display = "block";
      this.imageDialogApply.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  async applyImageSelection() {
    if (!this.selectedImageFile || !this.currentEditingImage) return;

    try {
      // Get the original image path from the stored path or current src
      const originalSrc = this.currentEditingImage.src;
      const originalPath =
        this.currentEditingImageOriginalPath ||
        this.extractImagePath(originalSrc);

      console.log(
        "Applying image change - originalSrc:",
        originalSrc,
        "originalPath:",
        originalPath
      );

      // Create a unique filename with timestamp for the new image
      const pathParts = originalPath.split("/");
      const filename = pathParts[pathParts.length - 1];
      const nameParts = filename.split(".");
      const extension = nameParts.pop();
      const baseName = nameParts.join(".");

      // Generate timestamp in format: yyyymmddhhmmss
      const now = new Date();
      const timestamp =
        now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, "0") +
        now.getDate().toString().padStart(2, "0") +
        now.getHours().toString().padStart(2, "0") +
        now.getMinutes().toString().padStart(2, "0") +
        now.getSeconds().toString().padStart(2, "0");

      const newImagePath =
        pathParts.slice(0, -1).join("/") +
        "/" +
        baseName +
        "_update" +
        timestamp +
        "." +
        extension;

      console.log("Creating new image with path:", newImagePath);

      // Read the new file as array buffer for storage
      const arrayBuffer = await this.readFileAsArrayBuffer(
        this.selectedImageFile
      );
      const uint8Array = new Uint8Array(arrayBuffer);

      // Store the original image data for undo functionality
      let originalImageData = null;
      if (this.projectFiles.has(originalPath)) {
        originalImageData = this.projectFiles.get(originalPath);
      }

      // Add the new image as a separate file (don't replace the original)
      this.projectFiles.set(newImagePath, {
        content: uint8Array,
        type: this.selectedImageFile.type,
        size: this.selectedImageFile.size,
      });

      // Save to undo stack with backup information
      this.saveToUndoStack({
        type: "imageChange",
        element: this.getElementPath(this.currentEditingImage),
        oldSrc: originalSrc,
        newSrc: newImagePath, // Use the new unique path
        originalPath: originalPath, // Keep track of the original path
        originalImageData: originalImageData,
        newImageData: {
          path: newImagePath,
          content: uint8Array,
          type: this.selectedImageFile.type,
          size: this.selectedImageFile.size,
        },
        timestamp: Date.now(),
      });

      // Create a blob URL for the new image so it can be displayed in the iframe
      const newImageBlob = new Blob([uint8Array], {
        type: this.selectedImageFile.type,
      });
      const newImageBlobUrl = URL.createObjectURL(newImageBlob);

      // Update the resource URLs map to track this new blob URL
      this.resourceUrls.set(newImagePath, newImageBlobUrl);

      // Update the image in the iframe with the new blob URL
      this.currentEditingImage.src = newImageBlobUrl;

      // Update the HTML content to use the new path for this specific image only
      this.updateSpecificImageInHTML(
        this.currentEditingImage,
        originalPath,
        newImagePath
      );

      // Update the changes counter
      this.updateChangesCounter();
      this.updateUndoButton();

      this.showStatus(
        `🖼️ Image updated: ${this.getImageFilename(newImagePath)}`,
        "success"
      );
      this.closeImageDialog();
    } catch (error) {
      console.error("Error applying image selection:", error);
      this.showStatus("Failed to update image", "error");
    }
  }

  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsArrayBuffer(file);
    });
  }

  handleOpenFooterDialog(data) {
    this.openFooterDialog();
  }

  openFooterDialog() {
    // Get HTML content to parse all footer links (including commented ones)
    const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
      (path) =>
        path.endsWith(".html") &&
        (path === "index.html" || path.includes("index"))
    );

    if (!mainHtmlPath) {
      this.showStatus("No HTML file found", "error");
      return;
    }

    let currentContent =
      this.modifiedFiles.get(mainHtmlPath) ||
      this.projectFiles.get(mainHtmlPath).content;

    // Find the footer-social section in the HTML
    const footerSocialMatch = currentContent.match(
      /<div[^>]*class="[^"]*footer-social[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    );
    if (!footerSocialMatch) {
      this.showStatus("No footer social links found", "error");
      return;
    }

    const footerSocialContent = footerSocialMatch[1];
    this.footerLinksData = [];

    // Parse all links in the footer-social section (both commented and uncommented)
    const linkPattern =
      /(<!--\s*)?<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>(\s*-->)?/gi;
    let match;
    let linkIndex = 0;

    while ((match = linkPattern.exec(footerSocialContent)) !== null) {
      const fullMatch = match[0];
      const isCommented = !!match[1]; // Check if it starts with <!--
      const href = match[2];
      const linkContent = match[3];

      // Extract icon class from the link content
      const iconMatch = linkContent.match(
        /<i[^>]*class=["']([^"']*)["'][^>]*>/i
      );
      const iconClass = iconMatch ? iconMatch[1] : "";

      // Extract aria-label
      const ariaLabelMatch = fullMatch.match(/aria-label=["']([^"']*)["']/i);
      const ariaLabel = ariaLabelMatch ? ariaLabelMatch[1] : "";

      // Find the corresponding element in the iframe (if it exists and is not commented)
      const iframeDoc = this.previewFrame.contentDocument;
      let element = null;
      if (iframeDoc && !isCommented) {
        const footerSocial = iframeDoc.querySelector(".footer-social");
        if (footerSocial) {
          const links = footerSocial.querySelectorAll("a");
          for (let i = 0; i < links.length; i++) {
            const link = links[i];
            if (
              link.href === href &&
              link.querySelector("i")?.className === iconClass
            ) {
              element = link;
              break;
            }
          }
        }
      }

      this.footerLinksData.push({
        element: element,
        iconClass: iconClass,
        href: href,
        ariaLabel: ariaLabel,
        isVisible: !isCommented,
        originalHref: href,
        originalAriaLabel: ariaLabel,
        originalVisible: !isCommented,
        linkIndex: linkIndex++,
      });
    }

    this.populateFooterLinksList();
    this.footerDialogOverlay.classList.add("show");
  }

  populateFooterLinksList() {
    this.footerLinksList.innerHTML = "";

    this.footerLinksData.forEach((linkData, index) => {
      const linkItem = document.createElement("div");
      linkItem.className = `footer-link-item ${
        !linkData.isVisible ? "hidden" : ""
      }`;
      linkItem.innerHTML = `
        <div class="footer-link-header">
          <div class="footer-link-preview">
            <div class="footer-link-icon">
              <i class="${linkData.iconClass}"></i>
            </div>
            <div class="footer-link-title">${linkData.ariaLabel || "Link"}</div>
          </div>
          <div class="footer-link-visibility">
            <div class="visibility-toggle ${
              linkData.isVisible ? "active" : ""
            }" data-index="${index}"></div>
            <div class="visibility-label">${
              linkData.isVisible ? "Visible" : "Hidden"
            }</div>
          </div>
        </div>
        <div class="footer-link-fields">
          <div class="footer-field-group">
            <label class="footer-field-label">Link URL</label>
            <input type="url" class="footer-field-input" data-field="href" data-index="${index}" 
                   value="${linkData.href}" ${
        !linkData.isVisible ? "disabled" : ""
      } />
          </div>
        </div>
      `;

      // Add event listeners
      const visibilityToggle = linkItem.querySelector(".visibility-toggle");
      const hrefInput = linkItem.querySelector('[data-field="href"]');

      visibilityToggle.addEventListener("click", () => {
        this.toggleLinkVisibility(index);
      });

      hrefInput.addEventListener("input", (e) => {
        this.updateLinkData(index, "href", e.target.value);
      });

      this.footerLinksList.appendChild(linkItem);
    });
  }

  toggleLinkVisibility(index) {
    const linkData = this.footerLinksData[index];
    linkData.isVisible = !linkData.isVisible;

    // Update the UI
    const linkItem = this.footerLinksList.children[index];
    const visibilityToggle = linkItem.querySelector(".visibility-toggle");
    const visibilityLabel = linkItem.querySelector(".visibility-label");
    const inputs = linkItem.querySelectorAll(".footer-field-input");

    if (linkData.isVisible) {
      linkItem.classList.remove("hidden");
      visibilityToggle.classList.add("active");
      visibilityLabel.textContent = "Visible";
      inputs.forEach((input) => (input.disabled = false));
    } else {
      linkItem.classList.add("hidden");
      visibilityToggle.classList.remove("active");
      visibilityLabel.textContent = "Hidden";
      inputs.forEach((input) => (input.disabled = true));
    }
  }

  updateLinkData(index, field, value) {
    this.footerLinksData[index][field] = value;
  }

  closeFooterDialog() {
    this.footerDialogOverlay.classList.remove("show");
    this.footerLinksData = null;
  }

  async applyAllFooterChanges() {
    if (!this.footerLinksData) return;

    // Disable the apply button and show loading state
    this.footerDialogApply.disabled = true;
    this.footerDialogApply.textContent = "Applying...";

    try {
      // Save current scroll position before making any changes
      let savedScrollPosition = { x: 0, y: 0 };
      try {
        const iframeDoc = this.previewFrame.contentDocument;
        if (iframeDoc && iframeDoc.documentElement) {
          savedScrollPosition = {
            x:
              iframeDoc.documentElement.scrollLeft ||
              iframeDoc.body?.scrollLeft ||
              0,
            y:
              iframeDoc.documentElement.scrollTop ||
              iframeDoc.body?.scrollTop ||
              0,
          };
        }
      } catch (e) {
        console.log("Could not save scroll position:", e);
      }

      const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
        (path) =>
          path.endsWith(".html") &&
          (path === "index.html" || path.includes("index"))
      );

      let currentContent =
        this.modifiedFiles.get(mainHtmlPath) ||
        this.projectFiles.get(mainHtmlPath).content;

      // Save original state for undo
      const originalStates = this.footerLinksData.map((linkData) => ({
        element: linkData.element,
        originalHref: linkData.originalHref,
        originalAriaLabel: linkData.originalAriaLabel,
        originalVisible: linkData.originalVisible,
        linkIndex: linkData.linkIndex,
      }));

      // Save to undo stack before making changes
      this.saveToUndoStack({
        type: "footerChange",
        originalStates: originalStates,
        newStates: this.footerLinksData.map((linkData) => ({
          element: linkData.element,
          href: linkData.href,
          ariaLabel: linkData.ariaLabel,
          isVisible: linkData.isVisible,
        })),
      });

      // Apply changes to each link
      this.footerLinksData.forEach((linkData) => {
        // Update the link in the iframe (only if element exists)
        if (linkData.element) {
          linkData.element.href = linkData.href;
          linkData.element.setAttribute("aria-label", linkData.ariaLabel);
        }

        // Update the HTML content
        this.updateFooterLinkInHTML(
          linkData.element,
          linkData.href,
          linkData.ariaLabel,
          linkData.isVisible,
          linkData.linkIndex
        );
      });

      // Update the changes counter
      this.updateChangesCounter();
      this.updateUndoButton();

      // Store current edit mode state
      const wasEditMode = this.editMode;

      // Reload the preview to show the changes immediately, passing the saved scroll position
      await this.loadPreview(savedScrollPosition);

      // Restore edit mode if it was active
      if (wasEditMode) {
        setTimeout(() => {
          this.restoreEditMode();
        }, 600); // Wait for loadPreview to complete (500ms) + extra buffer
      }

      this.showStatus(`🔗 Footer links updated successfully`, "success");
      this.closeFooterDialog();
    } catch (error) {
      console.error("Error applying footer changes:", error);
      this.showStatus("Failed to update footer links", "error");
    } finally {
      // Restore the apply button state
      this.footerDialogApply.disabled = false;
      this.footerDialogApply.textContent = "Apply All Changes";
    }
  }

  updateFooterLinkInHTML(linkElement, newUrl, newLabel, isVisible, linkIndex) {
    const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
      (path) =>
        path.endsWith(".html") &&
        (path === "index.html" || path.includes("index"))
    );

    let currentContent =
      this.modifiedFiles.get(mainHtmlPath) ||
      this.projectFiles.get(mainHtmlPath).content;

    // Find the footer-social section
    const footerSocialMatch = currentContent.match(
      /(<div[^>]*class="[^"]*footer-social[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/i
    );
    if (!footerSocialMatch) return;

    const footerSocialStart = footerSocialMatch[1];
    const footerSocialContent = footerSocialMatch[2];
    const footerSocialEnd = footerSocialMatch[3];

    // Parse all links in the footer-social section
    const linkPattern =
      /(<!--\s*)?<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>(\s*-->)?/gi;
    let match;
    let currentIndex = 0;
    let updatedContent = footerSocialContent;

    // Reset regex lastIndex
    linkPattern.lastIndex = 0;

    while ((match = linkPattern.exec(footerSocialContent)) !== null) {
      if (currentIndex === linkIndex) {
        const fullMatch = match[0];
        const isCurrentlyCommented = !!match[1];
        const currentHref = match[2];
        const linkContent = match[3];

        // Extract current aria-label
        const ariaLabelMatch = fullMatch.match(/aria-label=["']([^"']*)["']/i);
        const currentAriaLabel = ariaLabelMatch ? ariaLabelMatch[1] : "";

        // Create the new link tag
        let newLinkTag = fullMatch;

        // Update href if it changed
        if (currentHref !== newUrl) {
          newLinkTag = newLinkTag.replace(
            /href=["'][^"']*["']/,
            `href="${newUrl}"`
          );
        }

        // Update aria-label if it changed
        if (currentAriaLabel !== newLabel) {
          if (currentAriaLabel) {
            newLinkTag = newLinkTag.replace(
              /aria-label=["'][^"']*["']/,
              `aria-label="${newLabel}"`
            );
          } else {
            // Add aria-label if it doesn't exist
            newLinkTag = newLinkTag.replace(
              /<a([^>]*)>/,
              `<a$1 aria-label="${newLabel}">`
            );
          }
        }

        // Handle visibility (comment/uncomment)
        if (isVisible && isCurrentlyCommented) {
          // Uncomment the link
          newLinkTag = newLinkTag.replace(/<!--\s*/, "").replace(/\s*-->/, "");
        } else if (!isVisible && !isCurrentlyCommented) {
          // Comment the link
          newLinkTag = `<!-- ${newLinkTag} -->`;
        }

        // Replace in the updated content
        updatedContent = updatedContent.replace(fullMatch, newLinkTag);
        break;
      }
      currentIndex++;
    }

    // Reconstruct the full HTML content
    const newContent = currentContent.replace(
      footerSocialMatch[0],
      footerSocialStart + updatedContent + footerSocialEnd
    );

    this.modifiedFiles.set(mainHtmlPath, newContent);
  }

  openMultilangDialog(data) {
    // Store the current editing data
    this.currentMultilangData = data;

    // Get current translations for all languages
    this.loadCurrentTranslations(data.translateKey);

    // Show the dialog
    this.multilangDialogOverlay.classList.add("show");
  }

  loadCurrentTranslations(translateKey) {
    console.log("🔄 Loading current translations for key:", translateKey);
    console.log(
      "🌍 Available languages:",
      Array.from(this.availableLanguages.keys())
    );

    const multilangInputs = document.getElementById("multilangInputs");
    multilangInputs.innerHTML = "";

    // Language flags mapping
    const languageFlags = {
      en: "🇺🇸",
      fr: "🇫🇷",
      de: "🇩🇪",
      es: "🇪🇸",
      ru: "🇷🇺",
      zh: "🇨🇳",
      it: "🇮🇹",
      hi: "🇮🇳",
      id: "🇮🇩",
      ja: "🇯🇵",
      ko: "🇰🇷",
    };

    // Language names mapping
    const languageNames = {
      en: "English",
      fr: "Français",
      de: "Deutsch",
      es: "Español",
      ru: "Русский",
      zh: "中文",
      it: "Italiano",
      hi: "हिन्दी",
      id: "Bahasa Indonesia",
      ja: "日本語",
      ko: "한국어",
    };

    // Get current language from the preview iframe
    let currentPreviewLang = "en";
    try {
      const iframeDoc = this.previewFrame.contentDocument;
      if (iframeDoc?.documentElement) {
        // Get language from the HTML lang attribute
        const htmlLang = iframeDoc.documentElement.getAttribute("lang");
        if (htmlLang && this.availableLanguages.has(htmlLang)) {
          currentPreviewLang = htmlLang;
          console.log("📍 Current preview language:", currentPreviewLang);
        }
      }
    } catch (e) {
      console.log("Could not get current preview language:", e);
    }

    // Convert Map to array and sort it
    // Order: 1. Current preview language, 2. English, 3. Rest alphabetically
    const languagesArray = Array.from(this.availableLanguages.entries());
    languagesArray.sort(([langCodeA], [langCodeB]) => {
      // Current preview language goes first
      if (langCodeA === currentPreviewLang) return -1;
      if (langCodeB === currentPreviewLang) return 1;

      // English goes second (unless it's the current preview language)
      if (langCodeA === "en") return -1;
      if (langCodeB === "en") return 1;

      // Rest alphabetically
      return langCodeA.localeCompare(langCodeB);
    });

    // Create input for each available language in sorted order
    languagesArray.forEach(([langCode, filePath]) => {
      const inputGroup = document.createElement("div");
      inputGroup.className = "multilang-input-group";

      const isEnglish = langCode === "en";
      const isCurrentPreview = langCode === currentPreviewLang;

      const label = document.createElement("label");
      label.className = "multilang-input-label";
      const currentBadge =
        isCurrentPreview && !isEnglish
          ? '<span class="current-badge">Currently Viewing</span>'
          : "";
      label.innerHTML = `
        <span class="flag">${languageFlags[langCode] || "🌐"}</span>
        <span>${languageNames[langCode] || langCode.toUpperCase()}</span>
        <span class="lang-code">${langCode}</span>
        ${currentBadge}
      `;

      const input = document.createElement("textarea");
      input.className = `multilang-input ${isEnglish ? "english" : ""} ${
        isCurrentPreview && !isEnglish ? "current-preview" : ""
      }`.trim();
      input.setAttribute("data-lang", langCode);
      input.setAttribute("data-file-path", filePath);

      // Get current text for this language
      let currentText = "";
      if (langCode === "en") {
        // For English, get the actual English text from the HTML file
        currentText = this.getEnglishTextFromHTML(translateKey);
      } else {
        // For other languages, try to get from translation files
        currentText = this.getTranslationFromFile(filePath, translateKey);
      }

      input.value = currentText;

      inputGroup.appendChild(label);
      inputGroup.appendChild(input);
      multilangInputs.appendChild(inputGroup);
    });
  }

  getEnglishTextFromHTML(translateKey) {
    try {
      const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
        (path) =>
          path.endsWith(".html") &&
          (path === "index.html" || path.includes("index"))
      );

      if (!mainHtmlPath) return "";

      // Check if this file has been modified, use modified content if available
      const content = this.modifiedFiles.has(mainHtmlPath)
        ? this.modifiedFiles.get(mainHtmlPath)
        : this.projectFiles.get(mainHtmlPath).content;

      if (!content) return "";

      // Find the element with the data-translate attribute and extract its text
      const escapedKey = translateKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(
        `data-translate=["']${escapedKey}["'][^>]*>([^<]*)<`,
        "i"
      );

      const match = content.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }

      return "";
    } catch (error) {
      console.warn(
        `Error reading English text from HTML for key ${translateKey}:`,
        error
      );
      return "";
    }
  }

  getTranslationFromFile(filePath, translateKey) {
    try {
      const fileData = this.projectFiles.get(filePath);
      if (!fileData) return "";

      // Check if this file has been modified, use modified content if available
      const content = this.modifiedFiles.has(filePath)
        ? this.modifiedFiles.get(filePath)
        : fileData.content;

      if (!content) return "";

      // Extract the translation object from the file
      const match = content.match(
        /window\.translations_[a-z]{2}\s*=\s*({[\s\S]*?});/
      );
      if (!match) return "";

      const translationObj = eval("(" + match[1] + ")");

      // Navigate to the specific key
      const keys = translateKey.split(".");
      let value = translationObj;

      for (const key of keys) {
        if (value && typeof value === "object" && key in value) {
          value = value[key];
        } else {
          return "";
        }
      }

      return typeof value === "string" ? value : "";
    } catch (error) {
      console.warn(`Error reading translation from ${filePath}:`, error);
      return "";
    }
  }

  closeMultilangDialog() {
    this.multilangDialogOverlay.classList.remove("show");
    this.currentMultilangData = null;
  }

  async applyMultilangChanges() {
    if (!this.currentMultilangData) return;

    // Disable the apply button and show loading state
    this.multilangDialogApply.disabled = true;
    this.multilangDialogApply.textContent = "Applying...";

    try {
      // Save current scroll position before making any changes
      let savedScrollPosition = { x: 0, y: 0 };
      try {
        const iframeDoc = this.previewFrame.contentDocument;
        if (iframeDoc && iframeDoc.documentElement) {
          savedScrollPosition = {
            x:
              iframeDoc.documentElement.scrollLeft ||
              iframeDoc.body?.scrollLeft ||
              0,
            y:
              iframeDoc.documentElement.scrollTop ||
              iframeDoc.body?.scrollTop ||
              0,
          };
        }
      } catch (e) {
        console.log("Could not save scroll position:", e);
      }

      // Collect all the translation changes
      const translationChanges = [];
      const inputs = document.querySelectorAll(".multilang-input");

      inputs.forEach((input) => {
        const langCode = input.getAttribute("data-lang");
        const filePath = input.getAttribute("data-file-path");
        const newText = input.value.trim();

        // Get the old text for undo functionality
        let oldText = "";
        if (langCode === "en") {
          // Get the actual English text from the HTML file
          oldText = this.getEnglishTextFromHTML(
            this.currentMultilangData.translateKey
          );
        } else {
          oldText = this.getTranslationFromFile(
            filePath,
            this.currentMultilangData.translateKey
          );
        }

        translationChanges.push({
          langCode,
          filePath,
          newText,
          oldText,
          translateKey: this.currentMultilangData.translateKey,
        });
      });

      // Save to undo stack before making changes
      this.saveToUndoStack({
        type: "multilangChange",
        translateKey: this.currentMultilangData.translateKey,
        element: this.currentMultilangData.element,
        changes: translationChanges,
        timestamp: Date.now(),
      });

      // Apply changes to each language file
      for (const change of translationChanges) {
        if (change.langCode === "en") {
          // Update the HTML file for English
          this.updateEnglishTextInHTML(change.newText);
        } else {
          // Update the translation file for other languages
          this.updateTranslationFile(
            change.filePath,
            change.translateKey,
            change.newText
          );
        }
      }

      // Update the changes counter
      this.updateChangesCounter();
      this.updateUndoButton();

      // Store current edit mode state
      const wasEditMode = this.editMode;

      // Reload the preview to show the changes immediately
      await this.loadPreview(savedScrollPosition);

      // Restore edit mode if it was active
      if (wasEditMode) {
        setTimeout(() => {
          this.restoreEditMode();
        }, 600);
      }

      // Update the global translation objects in the iframe
      this.updateIframeTranslationObjects(translationChanges);

      this.showStatus(
        `🌍 Text updated in ${translationChanges.length} languages`,
        "success"
      );
      this.closeMultilangDialog();
    } catch (error) {
      console.error("Error applying multi-language changes:", error);
      this.showStatus("Failed to update translations", "error");
    } finally {
      // Restore the apply button state
      this.multilangDialogApply.disabled = false;
      this.multilangDialogApply.textContent = "Apply All Changes";
    }
  }

  updateEnglishTextInHTML(newText) {
    const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
      (path) =>
        path.endsWith(".html") &&
        (path === "index.html" || path.includes("index"))
    );

    if (!mainHtmlPath) return;

    let currentContent =
      this.modifiedFiles.get(mainHtmlPath) ||
      this.projectFiles.get(mainHtmlPath).content;

    // Find the element with the data-translate attribute and update its text
    const translateKey = this.currentMultilangData.translateKey;
    const escapedKey = translateKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `data-translate=["']${escapedKey}["'][^>]*>([^<]*)<`,
      "i"
    );

    const match = currentContent.match(regex);
    if (match) {
      const updatedContent = currentContent.replace(regex, (match, oldText) => {
        return match.replace(oldText, newText);
      });
      this.modifiedFiles.set(mainHtmlPath, updatedContent);
    }
  }

  updateTranslationFile(filePath, translateKey, newText) {
    try {
      const fileData = this.projectFiles.get(filePath);
      if (!fileData) return;

      // Check if this file has been modified, use modified content if available
      let content = this.modifiedFiles.has(filePath)
        ? this.modifiedFiles.get(filePath)
        : fileData.content;

      if (!content) return;

      // Parse the translation object
      const match = content.match(
        /window\.translations_[a-z]{2}\s*=\s*({[\s\S]*?});/
      );
      if (!match) return;

      const translationObj = eval("(" + match[1] + ")");

      // Navigate to the specific key and update it
      const keys = translateKey.split(".");
      let current = translationObj;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      // Update the final key
      current[keys[keys.length - 1]] = newText;

      // Convert back to string and update the file
      const updatedContent = content.replace(
        /window\.translations_[a-z]{2}\s*=\s*{[\s\S]*?};/,
        `window.translations_${
          filePath.match(/translations_([a-z]{2})\.js/)[1]
        } = ${JSON.stringify(translationObj, null, 2)};`
      );

      this.modifiedFiles.set(filePath, updatedContent);
    } catch (error) {
      console.warn(`Error updating translation file ${filePath}:`, error);
    }
  }

  updateIframeTranslationObjects(translationChanges) {
    try {
      const iframeDoc = this.previewFrame.contentDocument;
      if (!iframeDoc || !iframeDoc.defaultView) {
        console.warn("Iframe document not available");
        return;
      }

      const iframeWindow = iframeDoc.defaultView;

      // Update each translation object in the iframe's global scope
      translationChanges.forEach((change) => {
        if (change.langCode === "en") {
          // For English, we need to update the defaultEnglishContent and translations.en
          if (iframeWindow.defaultEnglishContent) {
            this.updateNestedObject(
              iframeWindow.defaultEnglishContent,
              change.translateKey,
              change.newText
            );
          }
          if (iframeWindow.translations && iframeWindow.translations.en) {
            this.updateNestedObject(
              iframeWindow.translations.en,
              change.translateKey,
              change.newText
            );
          }
        } else {
          // For other languages, update the global translation objects
          const globalVarName = `translations_${change.langCode}`;
          if (iframeWindow[globalVarName]) {
            this.updateNestedObject(
              iframeWindow[globalVarName],
              change.translateKey,
              change.newText
            );
          }

          // Also update the translations object if it exists
          if (
            iframeWindow.translations &&
            iframeWindow.translations[change.langCode]
          ) {
            this.updateNestedObject(
              iframeWindow.translations[change.langCode],
              change.translateKey,
              change.newText
            );
          }
        }
      });

      // Force a re-translation if the language system is available
      if (iframeWindow.translatePage && iframeWindow.currentLanguage) {
        iframeWindow.translatePage(iframeWindow.currentLanguage);
      }

      console.log("✅ Updated iframe translation objects");
    } catch (error) {
      console.warn("Error updating iframe translation objects:", error);
    }
  }

  updateNestedObject(obj, keyPath, value) {
    const keys = keyPath.split(".");
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  async addNewAmenity() {
    try {
      // Save current scroll position before making any changes
      let savedScrollPosition = { x: 0, y: 0 };
      try {
        const iframeDoc = this.previewFrame.contentDocument;
        if (iframeDoc && iframeDoc.documentElement) {
          savedScrollPosition = {
            x:
              iframeDoc.documentElement.scrollLeft ||
              iframeDoc.body?.scrollLeft ||
              0,
            y:
              iframeDoc.documentElement.scrollTop ||
              iframeDoc.body?.scrollTop ||
              0,
          };
        }
      } catch (e) {
        console.log("Could not save scroll position:", e);
      }

      // Find the main HTML file
      const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
        (path) =>
          path.endsWith(".html") &&
          (path === "index.html" || path.includes("index"))
      );

      if (!mainHtmlPath) {
        this.showStatus("Could not find main HTML file", "error");
        return;
      }

      let currentContent =
        this.modifiedFiles.get(mainHtmlPath) ||
        this.projectFiles.get(mainHtmlPath).content;

      // Find the last amenity item and add the new amenity after it
      // Look for all amenity items and find the last one
      const amenityItemPattern =
        /<div[^>]*class="[^"]*amenity-item[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
      const amenityMatches = [...currentContent.matchAll(amenityItemPattern)];

      if (amenityMatches.length === 0) {
        this.showStatus("Could not find any amenity items", "error");
        return;
      }

      // Get the last amenity item
      const lastAmenityMatch = amenityMatches[amenityMatches.length - 1];
      const lastAmenityHtml = lastAmenityMatch[0];
      const lastAmenityIndex = lastAmenityMatch.index;

      // Create new default amenity item HTML
      const newAmenityItem = `            <div class="amenity-item">
              <i class="fas fa-edit"></i>
              <span>new amenity</span>
            </div>`;

      // Insert the new amenity after the last amenity item
      const newContent =
        currentContent.substring(0, lastAmenityIndex + lastAmenityHtml.length) +
        newAmenityItem +
        currentContent.substring(lastAmenityIndex + lastAmenityHtml.length);

      // Store the change
      this.modifiedFiles.set(mainHtmlPath, newContent);

      // Add to undo stack
      this.undoStack.push({
        type: "amenity_add",
        element: "amenities-grid",
        amenityText: "new amenity",
        amenityIcon: "fas fa-edit",
        timestamp: Date.now(),
      });

      // Update counters and buttons
      this.updateChangesCounter();
      this.updateUndoButton();

      // Store current edit mode state
      const wasEditMode = this.editMode;

      // Reload the preview to show the changes immediately, passing the saved scroll position
      await this.loadPreview(savedScrollPosition);

      // Restore edit mode if it was active
      if (wasEditMode) {
        setTimeout(() => {
          this.restoreEditMode();
        }, 600);
      }

      this.showStatus(`✨ Added new amenity: new amenity`, "success");
    } catch (error) {
      console.error("Error adding amenity:", error);
      this.showStatus("Failed to add amenity", "error");
    }
  }

  async deleteAmenity(amenityElement) {
    const amenityText = amenityElement.querySelector("span").textContent.trim();
    const amenityIcon = amenityElement.querySelector("i").className;

    // Debug logging
    console.log("Deleting amenity:", { amenityText, amenityIcon });

    if (
      !confirm(`Are you sure you want to delete the amenity "${amenityText}"?`)
    ) {
      return;
    }

    try {
      // Find the main HTML file
      const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
        (path) =>
          path.endsWith(".html") &&
          (path === "index.html" || path.includes("index"))
      );

      if (!mainHtmlPath) {
        this.showStatus("Could not find main HTML file", "error");
        return;
      }

      let currentContent =
        this.modifiedFiles.get(mainHtmlPath) ||
        this.projectFiles.get(mainHtmlPath).content;

      // Use a simpler approach: find the amenity by creating a temporary DOM and matching
      let newContent = currentContent;

      // Create a temporary DOM to parse the HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = currentContent;

      // Find all amenity items
      const amenityItems = tempDiv.querySelectorAll(".amenity-item");
      let amenityToRemove = null;

      // Look for the matching amenity
      for (const item of amenityItems) {
        const itemIcon = item.querySelector("i")?.className;
        const itemText = item.querySelector("span")?.textContent?.trim();

        console.log("Checking amenity:", {
          itemIcon,
          itemText,
          amenityIcon,
          amenityText,
        });

        if (itemText === amenityText) {
          amenityToRemove = item;
          break;
        }
      }

      if (!amenityToRemove) {
        console.log("Could not find matching amenity in DOM");
        this.showStatus("Could not find amenity in HTML", "error");
        return;
      }

      // Get the outer HTML of the amenity to remove
      const amenityHTML = amenityToRemove.outerHTML;
      console.log("Removing amenity HTML:", amenityHTML);

      // Remove it from the content
      newContent = newContent.replace(amenityHTML, "");

      // Store the change
      this.modifiedFiles.set(mainHtmlPath, newContent);

      // Add to undo stack
      this.undoStack.push({
        type: "amenity_delete",
        element: "amenity-item",
        amenityText: amenityText,
        amenityIcon: amenityIcon,
        amenityHtml: amenityElement.outerHTML,
        timestamp: Date.now(),
      });

      // Update counters and buttons
      this.updateChangesCounter();
      this.updateUndoButton();

      // Store current edit mode state
      const wasEditMode = this.editMode;

      // Reload the preview to show the changes immediately
      await this.loadPreview();

      // Restore edit mode if it was active
      if (wasEditMode) {
        setTimeout(() => {
          this.restoreEditMode();
        }, 600);
      }

      this.showStatus(`🗑️ Deleted amenity: ${amenityText}`, "success");
    } catch (error) {
      console.error("Error deleting amenity:", error);
      this.showStatus("Failed to delete amenity", "error");
    }
  }

  findOriginalImagePath(imageElement) {
    const src = imageElement.src;

    // First, try to find the original path from the resource URLs map
    for (const [path, url] of this.resourceUrls.entries()) {
      if (url === src) {
        return path;
      }
    }

    // If not found in resource URLs, try to extract from the HTML content
    const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
      (path) =>
        path.endsWith(".html") &&
        (path === "index.html" || path.includes("index"))
    );

    if (mainHtmlPath) {
      const htmlContent =
        this.modifiedFiles.get(mainHtmlPath) ||
        this.projectFiles.get(mainHtmlPath).content;

      // Look for the blob URL in the HTML and find the original src attribute
      const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const blobUrlMatch = htmlContent.match(
        new RegExp(`src="[^"]*${escapedSrc}[^"]*"`)
      );

      if (blobUrlMatch) {
        // Find the original path by looking at the resource URLs map
        for (const [path, url] of this.resourceUrls.entries()) {
          if (url === src) {
            return path;
          }
        }
      }
    }

    // Fallback to the extractImagePath method
    return this.extractImagePath(src);
  }

  extractImagePath(src) {
    // Extract the relative path from various src formats
    // Handle blob URLs, data URLs, and relative paths
    if (src.startsWith("blob:")) {
      // For blob URLs, try to find the original path from the HTML content
      const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
        (path) =>
          path.endsWith(".html") &&
          (path === "index.html" || path.includes("index"))
      );

      if (mainHtmlPath) {
        const htmlContent =
          this.modifiedFiles.get(mainHtmlPath) ||
          this.projectFiles.get(mainHtmlPath).content;

        // Look for the blob URL in the HTML and find the original src attribute
        const blobUrlMatch = htmlContent.match(
          new RegExp(
            `src="[^"]*${src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^"]*"`
          )
        );
        if (blobUrlMatch) {
          // This is a blob URL that was generated by our system
          // We need to find the original path by looking at the resource URLs map
          for (const [path, url] of this.resourceUrls.entries()) {
            if (url === src) {
              return path;
            }
          }
        }
      }

      // Fallback for blob URLs
      return "images/unknown.jpg";
    }

    if (src.startsWith("data:")) {
      // For data URLs, we can't extract a meaningful path
      return "images/unknown.jpg";
    }

    // Remove query parameters and fragments
    const cleanSrc = src.split("?")[0].split("#")[0];

    // If it's already a relative path, return it
    if (!cleanSrc.startsWith("http") && !cleanSrc.startsWith("/")) {
      return cleanSrc;
    }

    // For absolute URLs, try to extract the path part
    try {
      const url = new URL(cleanSrc);
      return url.pathname.startsWith("/")
        ? url.pathname.substring(1)
        : url.pathname;
    } catch (e) {
      // Fallback for malformed URLs
      return "images/unknown.jpg";
    }
  }

  updateSpecificImageInHTML(imageElement, oldSrc, newSrc) {
    console.log("=== updateSpecificImageInHTML ===");
    console.log("Image element:", imageElement);
    console.log("Old src:", oldSrc);
    console.log("New src:", newSrc);

    const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
      (path) =>
        path.endsWith(".html") &&
        (path === "index.html" || path.includes("index"))
    );

    let currentContent =
      this.modifiedFiles.get(mainHtmlPath) ||
      this.projectFiles.get(mainHtmlPath).content;

    // Try a completely different approach - use the image's unique attributes and surrounding content
    const wasReplaced = this.replaceImageByUniqueSignature(
      currentContent,
      imageElement,
      oldSrc,
      newSrc,
      mainHtmlPath
    );

    if (wasReplaced) {
      console.log("Successfully replaced image using unique signature");
      return;
    }

    // Fallback to the original method
    console.log("Falling back to element path method");
    const elementPath = this.getElementPath(imageElement);
    const wasReplaced2 = this.replaceSpecificImageInHTML(
      currentContent,
      elementPath,
      oldSrc,
      newSrc,
      mainHtmlPath
    );

    if (wasReplaced2) {
      console.log("Specific image reference updated in HTML");
    } else {
      console.log("Could not find specific image reference in HTML");
    }
  }

  replaceImageByUniqueSignature(
    htmlContent,
    imageElement,
    oldSrc,
    newSrc,
    mainHtmlPath
  ) {
    console.log("=== replaceImageByUniqueSignature ===");

    // Get unique identifiers for this specific image
    const alt = imageElement.getAttribute("alt") || "";
    const title = imageElement.getAttribute("title") || "";
    const loading = imageElement.getAttribute("loading") || "";
    const classList = imageElement.className || "";

    console.log(
      "Image attributes - alt:",
      alt,
      "title:",
      title,
      "loading:",
      loading,
      "class:",
      classList
    );

    // Get surrounding text content to create a unique signature
    const parentElement = imageElement.parentElement;
    const surroundingText = this.getSurroundingText(parentElement);
    console.log("Surrounding text:", surroundingText);

    // Find all images with the old src in the HTML
    const oldSrcEscaped = oldSrc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const imagePattern = new RegExp(
      `<img[^>]*src=["']?${oldSrcEscaped}["']?[^>]*>`,
      "gi"
    );
    const matches = [...htmlContent.matchAll(imagePattern)];

    console.log("Found", matches.length, "images with old src in HTML");

    if (matches.length === 0) {
      console.log("No images found with old src");
      return false;
    }

    if (matches.length === 1) {
      // Only one instance, safe to replace
      console.log("Only one instance found, replacing directly");
      const updatedContent = htmlContent.replace(imagePattern, (match) => {
        return match.replace(
          new RegExp(`src=["']?${oldSrcEscaped}["']?`),
          `src="${newSrc}"`
        );
      });

      this.modifiedFiles.set(mainHtmlPath, updatedContent);
      this.updateChangesCounter();
      this.updateUndoButton();
      console.log("Successfully replaced single instance");
      return true;
    }

    // Multiple instances - find the one that matches our unique signature
    for (let i = 0; i < matches.length; i++) {
      const imgTag = matches[i][0];
      console.log(`Checking image ${i}:`, imgTag);

      // Check if this image tag matches our unique signature
      if (
        this.imageTagMatchesSignature(
          imgTag,
          alt,
          title,
          loading,
          classList,
          surroundingText
        )
      ) {
        console.log(`Found matching signature for image ${i}`);

        // Replace this specific image tag
        const updatedImgTag = imgTag.replace(
          new RegExp(`src=["']?${oldSrcEscaped}["']?`),
          `src="${newSrc}"`
        );

        const updatedContent = htmlContent.replace(imgTag, updatedImgTag);
        this.modifiedFiles.set(mainHtmlPath, updatedContent);
        this.updateChangesCounter();
        this.updateUndoButton();
        console.log("Successfully replaced image with matching signature");
        return true;
      }
    }

    console.log("No matching signature found");
    return false;
  }

  getSurroundingText(element) {
    // Get text content from the element and its immediate siblings
    let text = "";

    // Get text from the element itself
    if (element) {
      text += element.textContent || "";
    }

    // Get text from previous sibling
    if (element && element.previousElementSibling) {
      text += " " + (element.previousElementSibling.textContent || "");
    }

    // Get text from next sibling
    if (element && element.nextElementSibling) {
      text += " " + (element.nextElementSibling.textContent || "");
    }

    // Clean up the text
    return text.trim().substring(0, 100); // Limit to first 100 characters
  }

  imageTagMatchesSignature(
    imgTag,
    alt,
    title,
    loading,
    classList,
    surroundingText
  ) {
    // Check if the image tag has matching attributes
    const hasMatchingAlt =
      !alt ||
      imgTag.includes(`alt="${alt}"`) ||
      imgTag.includes(`alt='${alt}'`);
    const hasMatchingTitle =
      !title ||
      imgTag.includes(`title="${title}"`) ||
      imgTag.includes(`title='${title}'`);
    const hasMatchingLoading =
      !loading ||
      imgTag.includes(`loading="${loading}"`) ||
      imgTag.includes(`loading='${loading}'`);

    console.log(
      "Attribute matching - alt:",
      hasMatchingAlt,
      "title:",
      hasMatchingTitle,
      "loading:",
      hasMatchingLoading
    );

    // For now, let's use a simpler approach - just match the alt attribute if it exists
    if (
      alt &&
      (imgTag.includes(`alt="${alt}"`) || imgTag.includes(`alt='${alt}'`))
    ) {
      console.log("Found matching alt attribute");
      return true;
    }

    // If no alt attribute, we'll need to use a different strategy
    // For now, let's just return false and let the fallback handle it
    return false;
  }

  getImageContext(imageElement) {
    const context = [];
    let current = imageElement;

    // Walk up the DOM tree to get context
    while (current && current !== document.body) {
      const tagName = current.tagName.toLowerCase();
      const className = current.className || "";
      const id = current.id || "";

      // Create a context identifier
      let contextId = tagName;

      // Filter out editor-specific classes and IDs
      const filteredId = this.filterEditorClasses(id);
      const filteredClassName = this.filterEditorClasses(className);

      if (filteredId) {
        contextId += `#${filteredId}`;
      } else if (filteredClassName) {
        // Use the first non-editor class name
        const firstClass = filteredClassName.split(" ")[0];
        contextId += `.${firstClass}`;
      }

      context.unshift(contextId);
      current = current.parentElement;
    }

    return context;
  }

  filterEditorClasses(classString) {
    if (!classString) return "";

    // List of editor-specific classes to filter out
    const editorClasses = ["edit-mode-active", "editable-image", "editing"];

    // Split classes and filter out editor-specific ones
    const classes = classString
      .split(" ")
      .filter((cls) => cls && !editorClasses.includes(cls));

    return classes.join(" ");
  }

  replaceImageByContext(
    htmlContent,
    contextElements,
    oldSrc,
    newSrc,
    mainHtmlPath
  ) {
    console.log("=== replaceImageByContext ===");
    console.log("Context elements:", contextElements);
    console.log("Old src:", oldSrc);
    console.log("New src:", newSrc);

    try {
      // Parse the HTML content
      let fullHTML = htmlContent;
      if (!htmlContent.includes("<html") && !htmlContent.includes("<body")) {
        fullHTML = `<html><head></head><body>${htmlContent}</body></html>`;
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(fullHTML, "text/html");

      // Find all images with the old src
      const allImages = doc.querySelectorAll(`img[src="${oldSrc}"]`);
      console.log("Found", allImages.length, "images with old src in HTML");

      if (allImages.length === 0) {
        console.log("No images found with old src");
        return false;
      }

      if (allImages.length === 1) {
        // Only one instance, safe to replace
        console.log("Only one instance found, replacing directly");
        allImages[0].setAttribute("src", newSrc);

        const updatedHTML = doc.documentElement.outerHTML;
        const bodyMatch = updatedHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
          const bodyContent = bodyMatch[1];
          this.modifiedFiles.set(mainHtmlPath, bodyContent);
          this.updateChangesCounter();
          this.updateUndoButton();
          console.log("Successfully replaced single instance");
          return true;
        }
      }

      // Multiple instances - find the one that matches our context
      for (let i = 0; i < allImages.length; i++) {
        const img = allImages[i];
        const imgContext = this.getImageContext(img);
        console.log(`Image ${i} context:`, imgContext);
        console.log(`Target context:`, contextElements);

        // Check if this image's context matches our target context
        if (this.contextMatches(imgContext, contextElements)) {
          console.log(`Found matching context for image ${i}`);
          img.setAttribute("src", newSrc);

          const updatedHTML = doc.documentElement.outerHTML;
          const bodyMatch = updatedHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i);
          if (bodyMatch) {
            const bodyContent = bodyMatch[1];
            this.modifiedFiles.set(mainHtmlPath, bodyContent);
            this.updateChangesCounter();
            this.updateUndoButton();
            console.log("Successfully replaced image with matching context");
            return true;
          }
        }
      }

      console.log("No matching context found");
      return false;
    } catch (error) {
      console.log("Context-based replacement failed:", error);
      return false;
    }
  }

  contextMatches(context1, context2) {
    // Compare contexts - they should match from the end (most specific to least specific)
    if (context1.length !== context2.length) {
      return false;
    }

    for (let i = 0; i < context1.length; i++) {
      if (context1[i] !== context2[i]) {
        return false;
      }
    }

    return true;
  }

  replaceSpecificImageInHTML(
    htmlContent,
    elementPath,
    oldSrc,
    newSrc,
    mainHtmlPath
  ) {
    console.log("=== replaceSpecificImageInHTML ===");
    console.log("Element path:", elementPath);
    console.log("Old src:", oldSrc);
    console.log("New src:", newSrc);

    // Use a more robust approach - find the image by its context and position
    // The elementPath contains information about the element's position in the DOM

    // First, let's try to find the image by looking for the specific src in the HTML
    const oldSrcEscaped = oldSrc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Create a regex that matches the src attribute with the old path
    const srcPattern = new RegExp(`(src=["']?)${oldSrcEscaped}(["']?)`, "g");

    // Find all matches to see how many instances there are
    const matches = [...htmlContent.matchAll(srcPattern)];
    console.log("Found", matches.length, "instances of", oldSrc, "in HTML");

    if (matches.length === 0) {
      console.log("No instances of old src found in HTML");
      return false;
    }

    // If there's only one instance, we can safely replace it
    if (matches.length === 1) {
      const updatedContent = htmlContent.replace(srcPattern, `$1${newSrc}$2`);
      this.modifiedFiles.set(mainHtmlPath, updatedContent);
      this.updateChangesCounter();
      this.updateUndoButton();
      console.log("Replaced single instance successfully");
      return true;
    }

    // If there are multiple instances, we need to be more specific
    // Let's use the element path to find the right one
    console.log("Multiple instances found, using context-based replacement");
    return this.replaceImageByContext(
      htmlContent,
      elementPath,
      oldSrc,
      newSrc,
      mainHtmlPath
    );
  }

  replaceImageByContext(
    htmlContent,
    elementPath,
    oldSrc,
    newSrc,
    mainHtmlPath
  ) {
    console.log("=== replaceImageByContext ===");
    console.log("Element path:", elementPath);
    console.log("Old src:", oldSrc);
    console.log("New src:", newSrc);

    // Use a more sophisticated approach to find the exact image
    // We'll parse the HTML and use the element path to find the specific element

    try {
      // The HTML content might be just the body content, so we need to wrap it properly
      let fullHTML = htmlContent;
      if (!htmlContent.includes("<html") && !htmlContent.includes("<body")) {
        fullHTML = `<html><head></head><body>${htmlContent}</body></html>`;
      }

      console.log("Parsing HTML content...");
      const parser = new DOMParser();
      const doc = parser.parseFromString(fullHTML, "text/html");

      // Find the element using the element path
      console.log("Looking for element with path:", elementPath);
      const targetElement = this.findElementByPath(doc, elementPath);

      if (!targetElement) {
        console.log("Target element not found");
        return false;
      }

      if (targetElement.tagName !== "IMG") {
        console.log(
          "Target element is not an image, tagName:",
          targetElement.tagName
        );
        return false;
      }

      // Check if this element has the correct src
      const currentSrc = targetElement.getAttribute("src");
      console.log("Target element current src:", currentSrc);
      console.log("Expected old src:", oldSrc);

      if (currentSrc === oldSrc) {
        console.log("Src matches, updating to new src:", newSrc);
        // Update the src attribute
        targetElement.setAttribute("src", newSrc);

        // Convert back to HTML string
        const updatedHTML = doc.documentElement.outerHTML;

        // Extract just the body content (remove html, head, body tags)
        const bodyMatch = updatedHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
          const bodyContent = bodyMatch[1];
          this.modifiedFiles.set(mainHtmlPath, bodyContent);
          this.updateChangesCounter();
          this.updateUndoButton();
          console.log("Successfully replaced specific image using DOM parsing");
          return true;
        } else {
          console.log("Could not extract body content from updated HTML");
        }
      } else {
        console.log(
          "Target element src doesn't match oldSrc:",
          currentSrc,
          "vs",
          oldSrc
        );
      }
    } catch (error) {
      console.log("DOM parsing failed, falling back to regex approach:", error);
    }

    // Fallback to the original regex approach if DOM parsing fails
    console.log("Using regex fallback...");
    return this.replaceImageByRegexFallback(
      htmlContent,
      elementPath,
      oldSrc,
      newSrc,
      mainHtmlPath
    );
  }

  replaceImageByRegexFallback(
    htmlContent,
    elementPath,
    oldSrc,
    newSrc,
    mainHtmlPath
  ) {
    console.log("=== replaceImageByRegexFallback ===");
    console.log("Element path:", elementPath);
    console.log("Old src:", oldSrc);
    console.log("New src:", newSrc);

    // Parse the element path to understand the structure
    const pathParts = elementPath.split(" > ");
    console.log("Path parts:", pathParts);

    const oldSrcEscaped = oldSrc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const srcPattern = new RegExp(`(src=["']?)${oldSrcEscaped}(["']?)`, "g");

    // Find the specific occurrence based on the element path
    let occurrenceIndex = 0;

    // Try to determine which occurrence this is based on the path
    if (pathParts.length > 1) {
      const lastPart = pathParts[pathParts.length - 1];
      const nthMatch = lastPart.match(/nth-child\((\d+)\)/);
      if (nthMatch) {
        occurrenceIndex = parseInt(nthMatch[1]) - 1; // Convert to 0-based index
        console.log(
          "Found nth-child in path, occurrence index:",
          occurrenceIndex
        );
      } else {
        console.log("No nth-child found in path, using index 0");
      }
    } else {
      console.log("Path too short, using index 0");
    }

    console.log("Looking for occurrence index:", occurrenceIndex);

    let currentIndex = 0;
    let replacementMade = false;

    const updatedContent = htmlContent.replace(
      srcPattern,
      (match, prefix, suffix) => {
        console.log(
          `Processing occurrence ${currentIndex}, looking for ${occurrenceIndex}`
        );
        if (currentIndex === occurrenceIndex) {
          console.log(
            "Replacing occurrence",
            currentIndex,
            "with new src:",
            newSrc
          );
          replacementMade = true;
          currentIndex++;
          return `${prefix}${newSrc}${suffix}`;
        } else {
          console.log("Keeping occurrence", currentIndex, "as original");
          currentIndex++;
          return match; // Keep the original
        }
      }
    );

    if (replacementMade) {
      this.modifiedFiles.set(mainHtmlPath, updatedContent);
      this.updateChangesCounter();
      this.updateUndoButton();
      console.log("Successfully replaced specific image occurrence with regex");
      return true;
    }

    console.log("No replacement made with regex fallback");
    return false;
  }

  updateImageInHTML(oldSrc, newSrc) {
    console.log("Updating HTML - oldSrc:", oldSrc, "newSrc:", newSrc);

    const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
      (path) =>
        path.endsWith(".html") &&
        (path === "index.html" || path.includes("index"))
    );

    let currentContent =
      this.modifiedFiles.get(mainHtmlPath) ||
      this.projectFiles.get(mainHtmlPath).content;

    // Handle both absolute and relative paths
    const oldSrcEscaped = oldSrc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`src="${oldSrcEscaped}"`, "g"),
      new RegExp(`src='${oldSrcEscaped}'`, "g"),
    ];

    let updatedContent = currentContent;
    let wasReplaced = false;

    for (const pattern of patterns) {
      const beforeReplace = updatedContent;
      updatedContent = updatedContent.replace(pattern, `src="${newSrc}"`);
      if (updatedContent !== beforeReplace) {
        wasReplaced = true;
        console.log("Found and replaced image reference in HTML");
        break;
      }
    }

    if (wasReplaced) {
      this.modifiedFiles.set(mainHtmlPath, updatedContent);
      this.updateChangesCounter();
      this.updateUndoButton();
      console.log("HTML content updated successfully");
    } else {
      console.log("No matching image reference found in HTML");
    }
  }

  getImageFilename(src) {
    return src.split("/").pop() || "image";
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  saveToUndoStack(action) {
    this.undoStack.push(action);

    // Keep only the last maxUndoSteps actions
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
  }

  updateIconInHTML(oldIconClass, newIconClass) {
    const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
      (path) =>
        path.endsWith(".html") &&
        (path === "index.html" || path.includes("index"))
    );

    let currentContent =
      this.modifiedFiles.get(mainHtmlPath) ||
      this.projectFiles.get(mainHtmlPath).content;

    // Handle both exact matches and classes with additional classes
    const escapedOldClass = oldIconClass.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Try multiple patterns to match different class attribute formats
    const patterns = [
      // Exact match: class="fas fa-swimming-pool"
      new RegExp(`class="${escapedOldClass}"`, "g"),
      // With additional classes: class="fas fa-swimming-pool editable-icon"
      new RegExp(`class="${escapedOldClass}([^"]*)"`, "g"),
      // With classes before: class="some-class fas fa-swimming-pool"
      new RegExp(`class="([^"]*\\s+)?${escapedOldClass}(\\s+[^"]*)?"`, "g"),
    ];

    let updatedContent = currentContent;
    let wasReplaced = false;

    // Try each pattern until we find a match
    for (const pattern of patterns) {
      const beforeReplace = updatedContent;
      if (pattern.source.includes('([^"]*\\s+)?')) {
        // Complex pattern with capture groups
        updatedContent = updatedContent.replace(
          pattern,
          (match, prefix, suffix) => {
            wasReplaced = true;
            const prefixPart = prefix || "";
            const suffixPart = suffix || "";
            return `class="${prefixPart}${newIconClass}${suffixPart}"`;
          }
        );
      } else if (pattern.source.includes('([^"]*)')) {
        // Pattern with suffix capture group
        updatedContent = updatedContent.replace(pattern, (match, suffix) => {
          wasReplaced = true;
          return `class="${newIconClass}${suffix}"`;
        });
      } else {
        // Simple exact match
        updatedContent = updatedContent.replace(
          pattern,
          `class="${newIconClass}"`
        );
        wasReplaced = updatedContent !== beforeReplace;
      }

      if (wasReplaced) {
        break;
      }
    }

    if (!wasReplaced) {
      // Fallback: replace any occurrence of the old icon classes
      const oldClasses = oldIconClass.split(" ");
      const newClasses = newIconClass.split(" ");

      updatedContent = currentContent;
      oldClasses.forEach((oldClass, index) => {
        if (newClasses[index]) {
          const escapedClass = oldClass.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const classRegex = new RegExp(escapedClass, "g");
          updatedContent = updatedContent.replace(
            classRegex,
            newClasses[index]
          );
        }
      });
    }

    this.modifiedFiles.set(mainHtmlPath, updatedContent);
    this.updateChangesCounter();
    this.updateUndoButton();
  }

  getElementPath(element) {
    const path = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += "#" + current.id;
      } else if (current.className) {
        selector +=
          "." +
          current.className
            .split(" ")
            .filter((c) => c && !c.includes("editable"))
            .join(".");
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(" > ");
  }

  toggleEditMode() {
    this.editMode = !this.editMode;

    if (this.editMode) {
      this.editModeToggle.textContent = "🚫 Disable Edit Mode";
      this.editModeToggle.classList.add("active");
    } else {
      this.editModeToggle.textContent = "✏️ Enable Edit Mode";
      this.editModeToggle.classList.remove("active");
    }

    if (this.previewFrame.contentWindow) {
      this.previewFrame.contentWindow.postMessage(
        {
          type: "toggleEditMode",
          enabled: this.editMode,
        },
        "*"
      );
    }

    // Handle footer link overlays
    this.updateFooterLinkOverlays();
  }

  restoreEditMode() {
    // Set edit mode to true without toggling
    this.editMode = true;
    this.editModeToggle.textContent = "🚫 Disable Edit Mode";
    this.editModeToggle.classList.add("active");

    if (this.previewFrame.contentWindow) {
      this.previewFrame.contentWindow.postMessage(
        {
          type: "toggleEditMode",
          enabled: true,
        },
        "*"
      );
    }

    // Handle footer link overlays
    this.updateFooterLinkOverlays();

    // Handle badge visibility toggles
    // this.updateBadgeVisibilityToggles();
  }

  updateFooterLinkOverlays() {
    const iframeDoc = this.previewFrame.contentDocument;
    if (!iframeDoc) return;

    const footerSocial = iframeDoc.querySelector(".footer-social");
    if (!footerSocial) return;

    // Get HTML content to check which links are commented
    const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
      (path) =>
        path.endsWith(".html") &&
        (path === "index.html" || path.includes("index"))
    );

    if (!mainHtmlPath) return;

    let currentContent =
      this.modifiedFiles.get(mainHtmlPath) ||
      this.projectFiles.get(mainHtmlPath).content;

    // Find the footer-social section in the HTML
    const footerSocialMatch = currentContent.match(
      /<div[^>]*class="[^"]*footer-social[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    );
    if (!footerSocialMatch) return;

    const footerSocialContent = footerSocialMatch[1];

    // First, remove any previously added commented links and overlay elements
    const existingCommentedLinks =
      footerSocial.querySelectorAll("a.commented-link");
    existingCommentedLinks.forEach((link) => link.remove());

    // Remove any overlay links that were added for commented HTML
    const overlayCommentedLinks = footerSocial.querySelectorAll(
      "a.commented-link-overlay"
    );
    overlayCommentedLinks.forEach((link) => link.remove());

    // Get all links (both visible and commented)
    const linkPattern =
      /(<!--\s*)?<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>(\s*-->)?/gi;
    let match;

    while ((match = linkPattern.exec(footerSocialContent)) !== null) {
      const fullMatch = match[0];
      const isCommented = !!match[1];
      const href = match[2];
      const linkContent = match[3];

      // Extract icon class and aria-label
      const iconMatch = linkContent.match(
        /<i[^>]*class=["']([^"']*)["'][^>]*>/i
      );
      const iconClass = iconMatch ? iconMatch[1] : "";

      const ariaLabelMatch = fullMatch.match(/aria-label=["']([^"']*)["']/i);
      const ariaLabel = ariaLabelMatch ? ariaLabelMatch[1] : "";

      // If this is a commented link and edit mode is active, show it
      if (isCommented && this.editMode) {
        // Create a new link element for the commented link
        const commentedLink = document.createElement("a");
        commentedLink.href = href;
        commentedLink.setAttribute("aria-label", ariaLabel);
        commentedLink.setAttribute("target", "_blank");
        commentedLink.innerHTML = linkContent;
        commentedLink.style.opacity = 0.5;
        commentedLink.classList.add("commented-link-overlay"); // Add specific class for easy removal

        // Add it to the footer social section
        footerSocial.appendChild(commentedLink);
      }
    }

    // Update existing visible links with commented class if needed
    const visibleLinks = footerSocial.querySelectorAll(
      "a:not(.commented-link)"
    );
    visibleLinks.forEach((link) => {
      const iconElement = link.querySelector("i");
      const iconClass = iconElement ? iconElement.className : "";
      const href = link.href;

      // Check if this link is commented out in the HTML
      const linkPattern = new RegExp(
        `(<!--\\s*)?<a[^>]*href=["']?${href.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}["']?[^>]*>.*?</a>(\\s*-->)?`,
        "gi"
      );

      const matches = [...footerSocialContent.matchAll(linkPattern)];
      let isCommented = false;

      if (matches.length > 0) {
        for (let i = 0; i < matches.length; i++) {
          const fullMatch = matches[i][0];
          if (fullMatch.includes(iconClass)) {
            isCommented = fullMatch.includes("<!--");
            break;
          }
        }
      }

      // Add or remove the commented class based on edit mode and comment status
      if (this.editMode && isCommented) {
        link.classList.add("commented");
      } else {
        link.classList.remove("commented");
      }
    });
  }

  handleIframeMessage(e) {
    if (e.data.type === "textChanged") {
      this.handleTextChange(e.data);
    } else if (e.data.type === "openIconDialog") {
      this.handleOpenIconDialog(e.data);
    } else if (e.data.type === "openImageDialog") {
      this.handleOpenImageDialog(e.data);
    } else if (e.data.type === "openFooterDialog") {
      this.handleOpenFooterDialog(e.data);
    } else if (e.data.type === "openAmenityDialog") {
      this.addNewAmenity();
    } else if (e.data.type === "deleteAmenity") {
      this.handleDeleteAmenity(e.data);
    } else if (e.data.type === "openMultilangDialog") {
      this.handleOpenMultilangDialog(e.data);
    }
  }

  handleDeleteAmenity(data) {
    // Find the amenity element in the iframe
    const iframeDoc = this.previewFrame.contentDocument;
    if (!iframeDoc) return;

    // Create a temporary element to parse the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = data.amenityElement;
    const amenityElement = tempDiv.firstElementChild;

    if (amenityElement) {
      this.deleteAmenity(amenityElement);
    }
  }

  handleOpenImageDialog(data) {
    // Find the image element in the iframe
    const iframeDoc = this.previewFrame.contentDocument;
    if (!iframeDoc) return;

    const imageElement = this.findElementByPath(iframeDoc, data.imageElement);
    if (!imageElement) return;

    this.openImageDialog(imageElement);
  }

  handleOpenMultilangDialog(data) {
    this.openMultilangDialog(data);
  }

  handleTextChange(data) {
    const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
      (path) =>
        path.endsWith(".html") &&
        (path === "index.html" || path.includes("index"))
    );

    let currentContent =
      this.modifiedFiles.get(mainHtmlPath) ||
      this.projectFiles.get(mainHtmlPath).content;

    // Save to undo stack before making changes
    this.saveToUndoStack({
      type: "textChange",
      filePath: mainHtmlPath,
      oldText: data.oldText,
      newText: data.newText,
      element: data.element,
      previousContent: currentContent,
      timestamp: Date.now(),
    });

    // Escape special regex characters in the old text
    const escapedOldText = data.oldText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedOldText, "g");
    const updatedContent = currentContent.replace(regex, data.newText);

    this.modifiedFiles.set(mainHtmlPath, updatedContent);
    this.updateChangesCounter();
    this.updateUndoButton();

    this.showStatus(
      `✏️ Updated: "${data.oldText}" → "${data.newText}"`,
      "success"
    );
  }

  handleOpenIconDialog(data) {
    // Find the icon element in the iframe
    const iframeDoc = this.previewFrame.contentDocument;
    if (!iframeDoc) return;

    const iconElement = this.findElementByPath(iframeDoc, data.iconElement);
    if (!iconElement) return;

    this.openIconDialog(iconElement);
  }

  findElementByPath(doc, elementPath, searchText = "") {
    try {
      // Try to find the element using the stored path
      const element = doc.querySelector(elementPath);
      if (element) return element;

      // If direct selector fails, try to find by text content match for text elements
      // For icons, try to find by class name
      if (elementPath.includes("i.fa")) {
        const iconElements = doc.querySelectorAll('i[class*="fa"]');
        for (const el of iconElements) {
          if (elementPath.includes(el.className.split(" ").join("."))) {
            return el;
          }
        }
      }

      // Fallback for text elements
      if (searchText) {
        const allElements = doc.querySelectorAll(
          "h1, h2, h3, h4, h5, h6, p, span, a, li"
        );
        for (const el of allElements) {
          if (el.textContent.includes(searchText)) {
            return el;
          }
        }
      }

      return null;
    } catch (error) {
      console.log("Element path resolution failed:", error);
      return null;
    }
  }

  resetChanges() {
    if (this.modifiedFiles.size === 0 && this.undoStack.length === 0) {
      this.showStatus("No changes to reset", "info");
      return;
    }

    if (this.editMode) {
      this.toggleEditMode();
    }

    const changeCount = this.modifiedFiles.size;
    const undoCount = this.undoStack.length;

    if (
      confirm(
        `Are you sure you want to reset all ${changeCount} changes and clear ${undoCount} undo steps?`
      )
    ) {
      this.modifiedFiles.clear();
      this.undoStack = [];
      this.updateChangesCounter();
      this.updateUndoButton();
      this.loadPreview();
      this.showStatus("🔄 All changes have been reset", "success");
    }
  }

  showLoading(text = "Processing...") {
    this.loadingText.textContent = text;
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

  undoLastChange() {
    if (this.undoStack.length === 0) {
      this.showStatus("No changes to undo", "info");
      return;
    }

    const lastAction = this.undoStack.pop();

    if (lastAction.type === "textChange") {
      // Restore the previous content in memory
      this.modifiedFiles.set(lastAction.filePath, lastAction.previousContent);

      // Try to update the iframe content directly without reload
      if (this.updateIframeContentDirectly(lastAction)) {
        // Direct update successful - no reload needed!
        this.updateChangesCounter();
        this.updateUndoButton();

        this.showStatus(
          `↶ Undid instantly: "${lastAction.newText}" → "${lastAction.oldText}"`,
          "success"
        );
      } else {
        // Fallback to full reload if direct update fails
        this.updateChangesCounter();
        this.updateUndoButton();
        this.loadPreview();

        this.showStatus(
          `↶ Undid: "${lastAction.newText}" → "${lastAction.oldText}"`,
          "success"
        );
      }
    } else if (lastAction.type === "iconChange") {
      // Handle icon change undo
      this.undoIconChange(lastAction);
    } else if (lastAction.type === "imageChange") {
      // Handle image change undo
      this.undoImageChange(lastAction);
    } else if (lastAction.type === "footerChange") {
      // Handle footer change undo
      this.undoFooterChange(lastAction);
    } else if (lastAction.type === "amenity_add") {
      // Handle amenity add undo
      this.undoAmenityAdd(lastAction);
    } else if (lastAction.type === "amenity_delete") {
      // Handle amenity delete undo
      this.undoAmenityDelete(lastAction);
    } else if (lastAction.type === "multilangChange") {
      // Handle multi-language change undo
      this.undoMultilangChange(lastAction);
    }
  }

  undoIconChange(action) {
    const iframeDoc = this.previewFrame.contentDocument;
    if (!iframeDoc) {
      this.loadPreview();
      return;
    }

    const iconElement = this.findElementByPath(iframeDoc, action.element);
    if (iconElement) {
      iconElement.className = action.oldIconClass;
      this.updateIconInHTML(action.newIconClass, action.oldIconClass);
      this.updateChangesCounter();
      this.updateUndoButton();
      this.showStatus(
        `↶ Icon reverted: ${action.newIconClass} → ${action.oldIconClass}`,
        "success"
      );
    } else {
      // Fallback to full reload
      this.updateIconInHTML(action.newIconClass, action.oldIconClass);
      this.updateChangesCounter();
      this.updateUndoButton();
      this.loadPreview();
      this.showStatus(
        `↶ Icon reverted: ${action.newIconClass} → ${action.oldIconClass}`,
        "success"
      );
    }
  }

  undoImageChange(action) {
    // Remove the new image file that was created
    if (action.newImageData) {
      this.projectFiles.delete(action.newImageData.path);
      // Also remove the blob URL from resource URLs map
      this.resourceUrls.delete(action.newImageData.path);
    }

    // Restore the original image file if it was replaced
    if (action.originalImageData) {
      this.projectFiles.set(
        action.originalPath || action.oldSrc,
        action.originalImageData
      );
      // Also restore the blob URL for the original image
      if (action.originalImageData.content) {
        const blob = new Blob([action.originalImageData.content], {
          type: action.originalImageData.type || "image/jpeg",
        });
        const blobUrl = URL.createObjectURL(blob);
        this.resourceUrls.set(action.originalPath || action.oldSrc, blobUrl);
      }
    }

    const iframeDoc = this.previewFrame.contentDocument;
    if (!iframeDoc) {
      this.loadPreview();
      return;
    }

    const imageElement = this.findElementByPath(iframeDoc, action.element);
    if (imageElement) {
      // Restore the original image src - use the blob URL if available, otherwise use the original path
      const originalBlobUrl = this.resourceUrls.get(
        action.originalPath || action.oldSrc
      );
      if (originalBlobUrl) {
        imageElement.src = originalBlobUrl;
      } else {
        imageElement.src = action.oldSrc + "?t=" + Date.now();
      }

      // Update the HTML content to revert to the original path for this specific image
      this.updateSpecificImageInHTML(
        imageElement,
        action.newSrc,
        action.originalPath || action.oldSrc
      );
      this.updateChangesCounter();
      this.updateUndoButton();
      this.showStatus(`↶ Image reverted to original`, "success");
    } else {
      // Fallback to full reload - use the old method since we don't have the element
      this.updateImageInHTML(
        action.newSrc,
        action.originalPath || action.oldSrc
      );
      this.updateChangesCounter();
      this.updateUndoButton();
      this.loadPreview();
      this.showStatus(`↶ Image reverted to original`, "success");
    }
  }

  undoFooterChange(action) {
    const iframeDoc = this.previewFrame.contentDocument;
    if (!iframeDoc) {
      this.loadPreview();
      return;
    }

    // Handle new structure with multiple links
    if (action.originalStates && action.newStates) {
      action.originalStates.forEach((originalState) => {
        const linkElement = originalState.element;
        if (linkElement) {
          // Restore the original values
          linkElement.href = originalState.originalHref;
          linkElement.setAttribute(
            "aria-label",
            originalState.originalAriaLabel
          );

          // Update the HTML content to revert the changes
          this.updateFooterLinkInHTML(
            linkElement,
            originalState.originalHref,
            originalState.originalAriaLabel,
            originalState.originalVisible,
            originalState.linkIndex || 0
          );
        }
      });
      this.updateChangesCounter();
      this.updateUndoButton();
      this.updateFooterLinkOverlays();
      this.showStatus(`↶ Footer links reverted`, "success");
    } else {
      // Handle old structure with single link (backward compatibility)
      const linkElement = this.findElementByPath(iframeDoc, action.element);
      if (linkElement) {
        // Restore the original values
        linkElement.href = action.oldHref;
        linkElement.setAttribute("aria-label", action.oldAriaLabel);

        // Update the HTML content to revert the changes
        this.updateFooterLinkInHTML(
          linkElement,
          action.oldHref,
          action.oldAriaLabel,
          action.oldVisible,
          0
        );
        this.updateChangesCounter();
        this.updateUndoButton();
        this.updateFooterLinkOverlays();
        this.showStatus(`↶ Footer link reverted`, "success");
      } else {
        // Fallback to full reload
        this.loadPreview();
        this.updateChangesCounter();
        this.updateUndoButton();
        this.showStatus(`↶ Footer link reverted`, "success");
      }
    }
  }

  async undoAmenityAdd(action) {
    try {
      // Find the main HTML file
      const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
        (path) =>
          path.endsWith(".html") &&
          (path === "index.html" || path.includes("index"))
      );

      if (!mainHtmlPath) {
        this.showStatus("Could not find main HTML file", "error");
        return;
      }

      let currentContent =
        this.modifiedFiles.get(mainHtmlPath) ||
        this.projectFiles.get(mainHtmlPath).content;

      // Use the same simpler approach for undo
      let newContent = currentContent;

      // Create a temporary DOM to parse the HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = currentContent;

      // Find all amenity items
      const amenityItems = tempDiv.querySelectorAll(".amenity-item");
      let amenityToRemove = null;

      // Look for the matching amenity
      for (const item of amenityItems) {
        const itemIcon = item.querySelector("i")?.className;
        const itemText = item.querySelector("span")?.textContent?.trim();

        if (
          itemIcon === action.amenityIcon &&
          itemText === action.amenityText
        ) {
          amenityToRemove = item;
          break;
        }
      }

      if (amenityToRemove) {
        // Get the outer HTML of the amenity to remove
        const amenityHTML = amenityToRemove.outerHTML;

        // Remove it from the content
        newContent = newContent.replace(amenityHTML, "");
        this.modifiedFiles.set(mainHtmlPath, newContent);
      }

      // Update counters and buttons
      this.updateChangesCounter();
      this.updateUndoButton();

      // Store current edit mode state
      const wasEditMode = this.editMode;

      // Reload the preview to show the changes immediately
      await this.loadPreview();

      // Restore edit mode if it was active
      if (wasEditMode) {
        setTimeout(() => {
          this.restoreEditMode();
        }, 600);
      }

      this.showStatus(
        `↶ Undid amenity addition: ${action.amenityText}`,
        "success"
      );
    } catch (error) {
      console.error("Error undoing amenity add:", error);
      this.showStatus("Failed to undo amenity addition", "error");
    }
  }

  async undoAmenityDelete(action) {
    try {
      // Find the main HTML file
      const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
        (path) =>
          path.endsWith(".html") &&
          (path === "index.html" || path.includes("index"))
      );

      if (!mainHtmlPath) {
        this.showStatus("Could not find main HTML file", "error");
        return;
      }

      let currentContent =
        this.modifiedFiles.get(mainHtmlPath) ||
        this.projectFiles.get(mainHtmlPath).content;

      // Find the amenities grid and add the amenity back
      const amenitiesGridMatch = currentContent.match(
        /(<div[^>]*class="[^"]*amenities-grid[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/i
      );

      if (amenitiesGridMatch) {
        const amenitiesGridStart = amenitiesGridMatch[1];
        const amenitiesGridContent = amenitiesGridMatch[2];
        const amenitiesGridEnd = amenitiesGridMatch[3];

        // Add the amenity back to the grid
        const updatedContent = amenitiesGridContent + action.amenityHtml;

        // Reconstruct the full HTML content
        const newContent = currentContent.replace(
          amenitiesGridMatch[0],
          amenitiesGridStart + updatedContent + amenitiesGridEnd
        );

        this.modifiedFiles.set(mainHtmlPath, newContent);
      }

      // Update counters and buttons
      this.updateChangesCounter();
      this.updateUndoButton();

      // Store current edit mode state
      const wasEditMode = this.editMode;

      // Reload the preview to show the changes immediately
      await this.loadPreview();

      // Restore edit mode if it was active
      if (wasEditMode) {
        setTimeout(() => {
          this.restoreEditMode();
        }, 600);
      }

      this.showStatus(
        `↶ Undid amenity deletion: ${action.amenityText}`,
        "success"
      );
    } catch (error) {
      console.error("Error undoing amenity delete:", error);
      this.showStatus("Failed to undo amenity deletion", "error");
    }
  }

  async undoMultilangChange(action) {
    try {
      // Revert each translation change
      for (const change of action.changes) {
        if (change.langCode === "en") {
          // Revert English text in HTML
          this.revertEnglishTextInHTML(change.oldText);
        } else {
          // Revert translation file
          this.revertTranslationFile(
            change.filePath,
            action.translateKey,
            change.oldText
          );
        }
      }

      // Update counters and buttons
      this.updateChangesCounter();
      this.updateUndoButton();

      // Store current edit mode state
      const wasEditMode = this.editMode;

      // Reload the preview to show the changes immediately
      await this.loadPreview();

      // Restore edit mode if it was active
      if (wasEditMode) {
        setTimeout(() => {
          this.restoreEditMode();
        }, 600);
      }

      // Update the global translation objects in the iframe (revert changes)
      this.updateIframeTranslationObjects(action.changes);

      this.showStatus(
        `↶ Undid multi-language changes for: ${action.translateKey}`,
        "success"
      );
    } catch (error) {
      console.error("Error undoing multi-language change:", error);
      this.showStatus("Failed to undo multi-language changes", "error");
    }
  }

  revertEnglishTextInHTML(oldText) {
    const mainHtmlPath = Array.from(this.projectFiles.keys()).find(
      (path) =>
        path.endsWith(".html") &&
        (path === "index.html" || path.includes("index"))
    );

    if (!mainHtmlPath) return;

    let currentContent =
      this.modifiedFiles.get(mainHtmlPath) ||
      this.projectFiles.get(mainHtmlPath).content;

    // Find and revert the element with the data-translate attribute
    const translateKey = this.currentMultilangData?.translateKey;
    if (!translateKey) return;

    const escapedKey = translateKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `data-translate=["']${escapedKey}["'][^>]*>([^<]*)<`,
      "i"
    );

    const match = currentContent.match(regex);
    if (match) {
      const updatedContent = currentContent.replace(
        regex,
        (match, currentText) => {
          return match.replace(currentText, oldText);
        }
      );
      this.modifiedFiles.set(mainHtmlPath, updatedContent);
    }
  }

  revertTranslationFile(filePath, translateKey, oldText) {
    try {
      const fileData = this.projectFiles.get(filePath);
      if (!fileData || !fileData.content) return;

      let content = fileData.content;

      // Parse the translation object
      const match = content.match(
        /window\.translations_[a-z]{2}\s*=\s*({[\s\S]*?});/
      );
      if (!match) return;

      const translationObj = eval("(" + match[1] + ")");

      // Navigate to the specific key and revert it
      const keys = translateKey.split(".");
      let current = translationObj;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      // Revert the final key
      current[keys[keys.length - 1]] = oldText;

      // Convert back to string and update the file
      const updatedContent = content.replace(
        /window\.translations_[a-z]{2}\s*=\s*{[\s\S]*?};/,
        `window.translations_${
          filePath.match(/translations_([a-z]{2})\.js/)[1]
        } = ${JSON.stringify(translationObj, null, 2)};`
      );

      this.modifiedFiles.set(filePath, updatedContent);
    } catch (error) {
      console.warn(`Error reverting translation file ${filePath}:`, error);
    }
  }

  updateIframeContentDirectly(lastAction) {
    try {
      const iframeDoc = this.previewFrame.contentDocument;
      if (!iframeDoc) return false;

      // Find the element that was changed using the stored element path
      const element = this.findElementByPath(
        iframeDoc,
        lastAction.element,
        lastAction.newText
      );
      if (!element) return false;

      // Restore the original text content
      element.textContent = lastAction.oldText;

      return true;
    } catch (error) {
      console.log("Direct iframe update failed:", error);
      return false;
    }
  }

  findElementByPath(doc, elementPath, newText = "") {
    try {
      // Try to find the element using the stored path
      const element = doc.querySelector(elementPath);
      if (element) return element;

      // If direct selector fails, try to find by text content match
      // This is a fallback for when the DOM structure might have changed
      if (newText) {
        const allElements = doc.querySelectorAll(
          "h1, h2, h3, h4, h5, h6, p, span, a, li"
        );
        for (const el of allElements) {
          // Look for elements that might contain the text we're trying to restore
          if (el.textContent.includes(newText)) {
            return el;
          }
        }
      }

      return null;
    } catch (error) {
      console.log("Element path resolution failed:", error);
      return null;
    }
  }
}

// Initialize the editor when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new VisualWebsiteEditor();
});
