#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Default icons for different sections
const DEFAULT_ICONS = {
  amenities: "fa-check",
  features: "fa-star",
  location: "fa-map-marker-alt",
};

function extractCreditsContent(bizSectionPath) {
  try {
    const content = fs.readFileSync(bizSectionPath, "utf8");

    // Find the credits section
    const startComment = "<!-- Credits Copy Start -->";
    const endComment = "<!-- Credits Copy End -->";

    const startIndex = content.indexOf(startComment);
    if (startIndex === -1) {
      throw new Error("Credits Start comment not found in biz_section.html");
    }

    // Find the second occurrence of the comment (which acts as the end)
    const endIndex = content.indexOf(endComment);
    if (endIndex === -1) {
      throw new Error(
        "Second Credits Start comment not found in biz_section.html"
      );
    }

    // Extract the content between the comments (including the comments themselves)
    const creditsContent = content.substring(
      startIndex + startComment.length,
      endIndex
    );

    return creditsContent;
  } catch (error) {
    console.error("Error reading biz_section.html:", error.message);
    process.exit(1);
  }
}

function extractBusinessSection(bizSectionPath) {
  try {
    const content = fs.readFileSync(bizSectionPath, "utf8");

    // Find the business section
    const startTag = '<section id="business-offering" class="biz-section">';
    const endTag = "</section>";

    const startIndex = content.indexOf(startTag);
    if (startIndex === -1) {
      throw new Error("Business section not found in biz_section.html");
    }

    const endIndex = content.indexOf(endTag, startIndex) + endTag.length;
    const businessSection = content.substring(startIndex, endIndex);

    return businessSection;
  } catch (error) {
    console.error("Error reading biz_section.html:", error.message);
    process.exit(1);
  }
}

function insertCreditsContent(targetFilePath, creditsContent) {
  try {
    let content = fs.readFileSync(targetFilePath, "utf8");

    // Check if credits content already exists
    const creditsStartComment = "<!-- Credits Copy Start -->";
    const creditsEndComment = "<!-- Credits Copy End -->";

    // Also check for the actual credits content pattern
    // Look for the credits block pattern (the long line of box-drawing characters)
    const creditsContentPattern = "Built with ❤️ for the Airbnb community";

    const existingCreditsStart = content.indexOf(creditsStartComment);
    const existingCreditsEnd = content.indexOf(creditsEndComment);
    const existingCreditsPattern = content.indexOf(creditsContentPattern);

    // Remove all existing credits content first
    let cleanedContent = content;
    let removedAny = false;

    // Remove content with comment markers
    if (existingCreditsStart !== -1 && existingCreditsEnd !== -1) {
      console.log(
        `🔄 Removing existing credits content from ${targetFilePath}...`
      );
      const beforeCredits = cleanedContent.substring(0, existingCreditsStart);
      const afterCredits = cleanedContent.substring(
        existingCreditsEnd + creditsEndComment.length
      );
      cleanedContent = beforeCredits + afterCredits.replace(/^\s*\n\s*/, "\n");
      removedAny = true;
    }

    // Remove content without comment markers (fallback)
    if (!removedAny && existingCreditsPattern !== -1) {
      console.log(
        `🔄 Removing existing credits content from ${targetFilePath}...`
      );
      const creditsBlockStart = cleanedContent.lastIndexOf(
        "<!--",
        existingCreditsPattern
      );
      const creditsBlockEnd =
        cleanedContent.indexOf("-->", existingCreditsPattern) + 3;

      if (creditsBlockStart !== -1 && creditsBlockEnd !== -1) {
        const beforeCredits = cleanedContent.substring(0, creditsBlockStart);
        const afterCredits = cleanedContent.substring(creditsBlockEnd);
        cleanedContent =
          beforeCredits + afterCredits.replace(/^\s*\n\s*/, "\n");
      }
    }

    content = cleanedContent;

    // Find the head tag
    const headStartTag = "<head>";
    const headIndex = content.indexOf(headStartTag);
    if (headIndex === -1) {
      throw new Error("Head tag not found in target file");
    }

    // Find the end of the head tag
    const headEndIndex = headIndex + headStartTag.length;

    // Insert the credits content at the beginning of the head section
    const beforeHead = content.substring(0, headEndIndex);
    const afterHead = content.substring(headEndIndex);

    // Clean up whitespace and ensure proper formatting
    const trimmedAfterHead = afterHead.replace(/^\s*\n\s*/, "\n");
    const newContent =
      beforeHead + "\n    " + creditsContent + "\n    " + trimmedAfterHead;

    // Write the modified content back to the file
    fs.writeFileSync(targetFilePath, newContent, "utf8");

    console.log(
      `✅ Credits content successfully inserted into ${targetFilePath}`
    );
  } catch (error) {
    console.error("Error modifying target file credits:", error.message);
    process.exit(1);
  }
}

function insertBusinessSection(targetFilePath, businessSection) {
  try {
    let content = fs.readFileSync(targetFilePath, "utf8");

    // Check if business section already exists
    const businessSectionStart =
      '<section id="business-offering" class="biz-section">';
    const businessSectionEnd = "</section>";

    const existingBusinessStart = content.indexOf(businessSectionStart);
    const existingBusinessEnd = content.indexOf(
      businessSectionEnd,
      existingBusinessStart
    );

    if (existingBusinessStart !== -1 && existingBusinessEnd !== -1) {
      console.log(
        `🔄 Removing existing business section from ${targetFilePath}...`
      );
      // Remove existing business section
      const beforeBusiness = content.substring(0, existingBusinessStart);
      const afterBusiness = content.substring(
        existingBusinessEnd + businessSectionEnd.length
      );
      // Clean up whitespace after removal
      content = beforeBusiness + afterBusiness.replace(/^\s*\n\s*/, "\n");
    }

    // Find the footer tag
    const footerIndex = content.indexOf("<footer>");
    if (footerIndex === -1) {
      throw new Error("Footer tag not found in target file");
    }

    // Insert the business section before the footer
    const beforeFooter = content.substring(0, footerIndex);
    const afterFooter = content.substring(footerIndex);

    const newContent =
      beforeFooter + "\n\n    " + businessSection + "\n\n    " + afterFooter;

    // Write the modified content back to the file
    fs.writeFileSync(targetFilePath, newContent, "utf8");

    console.log(
      `✅ Business section successfully inserted into ${targetFilePath}`
    );
  } catch (error) {
    console.error("Error modifying target file:", error.message);
    process.exit(1);
  }
}

function injectReviewsFromJson(targetFilePath) {
  try {
    // Read the target HTML file first to check for existing review-mini elements
    let content = fs.readFileSync(targetFilePath, "utf8");

    // Check if there are already review-mini elements in the HTML
    if (content.includes('class="review-mini"')) {
      console.log(
        `⚠️  review-mini elements already exist in ${targetFilePath}, skipping review injection`
      );
      return;
    }

    // Determine the directory of the target file
    const targetDir = targetFilePath.substring(
      0,
      targetFilePath.lastIndexOf("/")
    );
    const listingJsonPath = `${targetDir}/listing.json`;

    // Check if listing.json exists
    if (!fs.existsSync(listingJsonPath)) {
      console.log(
        `⚠️  listing.json not found at ${listingJsonPath}, skipping review injection`
      );
      return;
    }

    console.log(`📖 Reading reviews from ${listingJsonPath}...`);
    const listingData = JSON.parse(fs.readFileSync(listingJsonPath, "utf8"));

    if (!listingData.reviews || !Array.isArray(listingData.reviews)) {
      console.log(
        `⚠️  No reviews found in listing.json, skipping review injection`
      );
      return;
    }

    // Extract the two featured reviewers to exclude them
    const featuredReviewers = [];
    // Match reviewer names in <h4> tags inside the featured reviews
    const featuredReviewsMatch = [];
    const featuredReviewH4Regex =
      /<div class="review-card">[\s\S]*?<h4>([^<]+)<\/h4>/g;
    let match;
    while ((match = featuredReviewH4Regex.exec(content)) !== null) {
      featuredReviewsMatch.push(match[1]);
    }
    if (featuredReviewsMatch) {
      featuredReviewers.push(
        ...featuredReviewsMatch.map((match) =>
          match.replace('data-reviewer="', "").replace('"', "")
        )
      );
    }

    console.log(
      `📝 Found ${listingData.reviews.length} total reviews, excluding ${featuredReviewers.length} featured reviewers`
    );

    // Filter out reviews that are already featured
    const availableReviews = listingData.reviews.filter(
      (review) => !featuredReviewers.includes(review.reviewer)
    );

    // Take maximum 16 reviews
    const reviewsToAdd = availableReviews.slice(0, 16);

    if (reviewsToAdd.length === 0) {
      console.log(
        `⚠️  No 5-star reviews available after filtering, skipping review injection`
      );
      return;
    }

    console.log(
      `📝 Found ${availableReviews.length} 5-star reviews, adding ${reviewsToAdd.length} reviews`
    );

    // Generate review HTML elements
    const reviewElements = reviewsToAdd
      .map((review) => {
        const firstLetter = review.reviewer.charAt(0).toUpperCase();
        const stars = "★".repeat(review.rating || 5);

        return `                <div class="review-mini" data-reviewer="${review.reviewer}">
                  <div class="review-mini-header">
                    <div class="review-mini-avatar">${firstLetter}</div>
                    <div>
                      <h5>${review.reviewer}</h5>
                      <div class="review-stars">${stars}</div>
                    </div>
                  </div>
                  <p class="review-mini-text">
                    "${review.text}"
                  </p>
                </div>`;
      })
      .join("\n");

    // Find the reviews-scroll-track div
    const scrollTrackStart = '<div id="reviews-scroll-track">';
    const scrollTrackEnd = "</div>";

    const scrollTrackStartIndex = content.indexOf(scrollTrackStart);
    if (scrollTrackStartIndex === -1) {
      console.log(
        `⚠️  reviews-scroll-track div not found, skipping review injection`
      );
      return;
    }

    const scrollTrackEndIndex = content.indexOf(
      scrollTrackEnd,
      scrollTrackStartIndex
    );
    if (scrollTrackEndIndex === -1) {
      console.log(
        `⚠️  reviews-scroll-track div end not found, skipping review injection`
      );
      return;
    }

    // Check if there are already mini reviews in the scroll track
    const existingContent = content.substring(
      scrollTrackStartIndex + scrollTrackStart.length,
      scrollTrackEndIndex
    );
    const hasExistingReviews = existingContent.includes("review-mini");

    if (hasExistingReviews) {
      console.log(
        `🔄 Removing existing mini reviews from reviews-scroll-track...`
      );
      const beforeScrollTrack = content.substring(
        0,
        scrollTrackStartIndex + scrollTrackStart.length
      );
      const afterScrollTrack = content.substring(scrollTrackEndIndex);
      content =
        beforeScrollTrack +
        "\n" +
        reviewElements +
        "\n              " +
        afterScrollTrack;
    } else {
      // Insert new reviews
      const beforeScrollTrack = content.substring(
        0,
        scrollTrackStartIndex + scrollTrackStart.length
      );
      const afterScrollTrack = content.substring(scrollTrackEndIndex);
      content =
        beforeScrollTrack +
        "\n" +
        reviewElements +
        "\n              " +
        afterScrollTrack;
    }

    // Write the modified content back to the file
    fs.writeFileSync(targetFilePath, content, "utf8");

    console.log(
      `✅ Successfully injected ${reviewsToAdd.length} mini reviews into ${targetFilePath}`
    );
  } catch (error) {
    console.error("Error injecting reviews:", error.message);
    // Don't exit process, just log the error and continue
    console.log("Continuing with other operations...");
  }
}

function getAvailableIcons(fontAwesomePath) {
  try {
    const cssContent = fs.readFileSync(fontAwesomePath, "utf8");
    const iconRegex = /\.fa-[a-zA-Z0-9-]+(?:\s*\{|,)/g;
    const icons = new Set();

    let match;
    while ((match = iconRegex.exec(cssContent)) !== null) {
      const iconName = match[0].replace(/[^\w-]/g, "");
      if (iconName.startsWith("fa-")) {
        icons.add(iconName);
        // Also add the fas fa- version for compatibility
        icons.add("fas " + iconName);
      }
    }

    return icons;
  } catch (error) {
    console.error(`Error reading Font Awesome CSS: ${error.message}`);
    return new Set();
  }
}

function validateAndFixIcons(targetFilePath) {
  try {
    console.log(`🔍 Validating Font Awesome icons in ${targetFilePath}...`);

    // Get the project directory
    const projectDir = path.dirname(targetFilePath);
    const fontAwesomePath = path.join(projectDir, "css", "fontawesome.min.css");

    // Check if Font Awesome CSS exists
    if (!fs.existsSync(fontAwesomePath)) {
      console.log(
        `⚠️  Font Awesome CSS not found at ${fontAwesomePath}, skipping icon validation`
      );
      return;
    }

    // Get available icons
    const availableIcons = getAvailableIcons(fontAwesomePath);
    console.log(`📊 Found ${availableIcons.size} available Font Awesome icons`);

    // Read the HTML file
    let content = fs.readFileSync(targetFilePath, "utf8");
    let modified = false;

    // Function to replace invalid icons
    function replaceInvalidIcon(iconClass, section) {
      // Clean up the icon class to extract just the fa- part
      const cleanIconClass = iconClass.replace(/^(fas|far|fab)\s+/, "");

      if (
        !availableIcons.has(iconClass) &&
        !availableIcons.has(cleanIconClass)
      ) {
        const defaultIcon = DEFAULT_ICONS[section] || "fa-check";
        console.log(
          `⚠️  Icon ${iconClass} not found in ${section} section, replacing with fas ${defaultIcon}`
        );
        return `fas ${defaultIcon}`;
      }
      return iconClass;
    }

    // Function to process icons within a specific section
    function processSectionIcons(
      content,
      sectionStart,
      sectionEnd,
      sectionName
    ) {
      // Find the section boundaries
      const startIndex = content.indexOf(sectionStart);
      if (startIndex === -1) {
        console.log(
          `⚠️  ${sectionName} section not found, skipping icon validation`
        );
        return content;
      }

      const endIndex = content.indexOf(sectionEnd, startIndex);
      if (endIndex === -1) {
        console.log(
          `⚠️  ${sectionName} section end not found, skipping icon validation`
        );
        return content;
      }

      // Extract the section content
      const beforeSection = content.substring(0, startIndex);
      const sectionContent = content.substring(
        startIndex,
        endIndex + sectionEnd.length
      );
      const afterSection = content.substring(endIndex + sectionEnd.length);

      // Process icons only within this section
      const iconRegex = /<i class="([^"]*fa-[^"]*)"[^>]*>/g;
      const processedSectionContent = sectionContent.replace(
        iconRegex,
        (match, iconClass) => {
          const newIconClass = replaceInvalidIcon(iconClass, sectionName);
          if (newIconClass !== iconClass) {
            modified = true;
            return match.replace(iconClass, newIconClass);
          }
          return match;
        }
      );

      // Reconstruct the content
      return beforeSection + processedSectionContent + afterSection;
    }

    // Process amenities section (within the amenities-grid)
    content = processSectionIcons(
      content,
      '<div class="amenities-section">',
      "</div>",
      "amenities"
    );

    // Process features section (within the features-grid)
    content = processSectionIcons(
      content,
      '<div class="features-grid">',
      "</div>",
      "features"
    );

    // Process location section (within the location-highlights)
    content = processSectionIcons(
      content,
      '<section id="location" class="location">',
      "</section>",
      "location"
    );

    //fallback to make sure all icons are valid
    content = processSectionIcons(content, "<body>", "</body>", "default");

    if (modified) {
      fs.writeFileSync(targetFilePath, content, "utf8");
      console.log(
        `✅ Icon validation and fixes completed for ${targetFilePath}`
      );
    } else {
      console.log(`✅ All Font Awesome icons are valid in ${targetFilePath}`);
    }
  } catch (error) {
    console.error(`Error validating icons: ${error.message}`);
    // Don't exit process, just log the error and continue
    console.log("Continuing with other operations...");
  }
}

function verifyAmenities(targetFilePath) {}

function getImageDimensions(imagePath) {
  try {
    const buffer = fs.readFileSync(imagePath);

    // Check for JPEG format
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      let i = 2;
      while (i < buffer.length - 1) {
        if (buffer[i] === 0xff) {
          const marker = buffer[i + 1];
          if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
            // Found SOF marker, dimensions are at offset i + 5
            const height = (buffer[i + 5] << 8) | buffer[i + 6];
            const width = (buffer[i + 7] << 8) | buffer[i + 8];
            return { width, height };
          }
          i += 2;
        } else {
          i++;
        }
      }
    }

    // Check for PNG format
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      const width =
        (buffer[16] << 24) |
        (buffer[17] << 16) |
        (buffer[18] << 8) |
        buffer[19];
      const height =
        (buffer[20] << 24) |
        (buffer[21] << 16) |
        (buffer[22] << 8) |
        buffer[23];
      return { width, height };
    }

    return null;
  } catch (error) {
    return null;
  }
}

function checkImageAspects(targetFilePath) {
  try {
    console.log(`🖼️  Checking image aspect ratios in images directory...`);

    // Get the project directory
    const projectDir = path.dirname(targetFilePath);
    const imagesDir = path.join(projectDir, "images");

    if (!fs.existsSync(imagesDir)) {
      console.log(
        `⚠️  Images directory not found, skipping aspect ratio check`
      );
      return;
    }

    // Get all files in the images directory
    const files = fs.readdirSync(imagesDir);

    // Filter for image files (common image extensions)
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    // Check each image file for aspect ratio compliance
    let aspectRatioWarnings = false;

    imageFiles.forEach((imageFile) => {
      // Check if filename contains "portrait" or "landscape"
      const isPortrait = imageFile.toLowerCase().includes("portrait");
      const isLandscape = imageFile.toLowerCase().includes("landscape");

      // Skip files that don't specify aspect ratio in filename
      if (!isPortrait && !isLandscape) {
        return;
      }

      const imagePath = path.join(imagesDir, imageFile);
      const dimensions = getImageDimensions(imagePath);

      if (!dimensions) {
        console.log(`⚠️  WARNING: Could not read dimensions for ${imageFile}`);
        aspectRatioWarnings = true;
        return;
      }

      const aspectRatio = dimensions.width / dimensions.height;
      const actualIsLandscape = aspectRatio > 1;
      const actualIsPortrait = aspectRatio < 1;

      let actualAspect = "square";
      if (actualIsLandscape) actualAspect = "landscape";
      else if (actualIsPortrait) actualAspect = "portrait";

      const expectedAspect = isPortrait ? "portrait" : "landscape";

      if (actualAspect !== expectedAspect) {
        console.log(`⚠️  WARNING: ${imageFile}`);
        console.log(
          `   • Expected: ${expectedAspect} aspect ratio (based on filename)`
        );
        console.log(
          `   • Actual: ${actualAspect} aspect ratio (${dimensions.width}x${dimensions.height})`
        );
        console.log(`   • This may affect the website layout`);
        aspectRatioWarnings = true;
      }
    });

    if (!aspectRatioWarnings) {
      console.log(`✅ All image aspect ratios match their filenames!`);
    }
  } catch (error) {
    console.error(`Error checking image aspects: ${error.message}`);
    // Don't exit process, just log the error and continue
    console.log("Continuing with other operations...");
  }
}

function checkImagesDirectory(targetFilePath) {
  try {
    const projectDir = path.dirname(targetFilePath);
    const imagesDir = path.join(projectDir, "images");

    // Ensure images directory exists
    if (!fs.existsSync(imagesDir)) {
      console.log(
        `\n🚨 CRITICAL ERROR: Images directory not found at ${imagesDir}`
      );
      console.log(
        `   • The website requires an 'images' directory with downloaded images`
      );
      console.log(`   • Please run the image download process first`);
      return;
    }

    // Read HTML and collect all img-*.jpg references
    const html = fs.readFileSync(targetFilePath, "utf8");
    const matches = html.match(/img-[^"'\s]+\.jpg/gi) || [];
    const referencedImages = Array.from(new Set(matches));

    console.log(
      `🖼️  Found ${referencedImages.length} image references in index.html`
    );

    // Verify each referenced image exists in images directory
    const missing = [];
    referencedImages.forEach((name) => {
      const filePath = path.join(imagesDir, name);
      if (!fs.existsSync(filePath)) {
        missing.push(name);
      }
    });

    if (missing.length > 0) {
      console.log(
        `\n🚨 CRITICAL WARNING: Missing referenced images in /images`
      );
      console.log(`   • Missing images:`);
      missing.forEach((n) => console.log(`     - ${n}`));
    } else {
      console.log(`✅ All referenced images exist in /images`);
    }

    // Optional: report extra img-*.jpg files in images directory not referenced in HTML
    const dirImages = (fs.readdirSync(imagesDir) || []).filter((f) =>
      /^img-.*\.jpg$/i.test(f)
    );
    const unreferenced = dirImages.filter((f) => !referencedImages.includes(f));
    if (unreferenced.length > 0) {
      console.log(`ℹ️  Unreferenced images present in /images:`);
      unreferenced.forEach((n) => console.log(`     - ${n}`));
    }
  } catch (error) {
    console.error(`Error checking images directory: ${error.message}`);
    console.log("Continuing with other operations...");
  }
}

function validateTranslations(projectDir) {
  try {
    const jsDir = path.join(projectDir, "js");

    if (!fs.existsSync(jsDir)) {
      console.log("⚠️  No js directory found, skipping translation validation");
      return;
    }

    // Find all translation files
    const translationFiles = fs
      .readdirSync(jsDir)
      .filter(
        (file) => file.startsWith("translations_") && file.endsWith(".js")
      )
      .map((file) => file.replace(".js", ""));

    if (translationFiles.length === 0) {
      console.log("⚠️  No translation files found, skipping validation");
      return;
    }

    // Load English translations as the reference
    const enFilePath = path.join(jsDir, "translations_en.js");
    if (!fs.existsSync(enFilePath)) {
      console.error("❌ CRITICAL: translations_en.js not found!");
      return;
    }

    // Load English translations
    const enContent = fs.readFileSync(enFilePath, "utf8");
    let enTranslations;
    try {
      // Execute the content to get the translations object
      const enModule = {};
      const enFunction = new Function("window", enContent);
      enFunction(enModule);
      enTranslations = enModule.translations_en;
    } catch (error) {
      console.error(
        "❌ CRITICAL: Failed to parse translations_en.js:",
        error.message
      );
      return;
    }

    if (!enTranslations) {
      console.error(
        "❌ CRITICAL: translations_en object not found in translations_en.js"
      );
      return;
    }

    // Get all keys from English translations
    const getAllKeys = (obj, prefix = "") => {
      const keys = [];
      for (const [key, value] of Object.entries(obj)) {
        const currentKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "object" && value !== null) {
          keys.push(...getAllKeys(value, currentKey));
        } else {
          keys.push(currentKey);
        }
      }
      return keys;
    };

    const enKeys = getAllKeys(enTranslations);

    // Validate each translation file
    let hasErrors = false;

    for (const translationFile of translationFiles) {
      const langCode = translationFile.replace("translations_", "");
      const filePath = path.join(jsDir, `${translationFile}.js`);

      // Load translation file
      const content = fs.readFileSync(filePath, "utf8");
      let translations;
      try {
        const module = {};
        const function_ = new Function("window", content);
        function_(module);
        translations = module[`translations_${langCode}`];
      } catch (error) {
        console.error(
          `❌ CRITICAL: Failed to parse ${translationFile}.js:`,
          error.message
        );
        hasErrors = true;
        continue;
      }

      if (!translations) {
        console.error(
          `❌ CRITICAL: translations_${langCode} object not found in ${translationFile}.js`
        );
        hasErrors = true;
        continue;
      }

      // Check for missing keys
      const langKeys = getAllKeys(translations);
      const missingKeys = enKeys.filter((key) => !langKeys.includes(key));

      if (missingKeys.length > 0) {
        console.error(
          `❌ CRITICAL: ${translationFile}.js is missing ${missingKeys.length} keys:`
        );
        missingKeys.forEach((key) => console.error(`   - ${key}`));
        hasErrors = true;
      }

      // Check for empty strings
      const findEmptyStrings = (obj, prefix = "") => {
        const emptyStrings = [];
        for (const [key, value] of Object.entries(obj)) {
          const currentKey = prefix ? `${prefix}.${key}` : key;
          if (typeof value === "object" && value !== null) {
            emptyStrings.push(...findEmptyStrings(value, currentKey));
          } else if (value === "") {
            emptyStrings.push(currentKey);
          }
        }
        return emptyStrings;
      };

      const emptyStrings = findEmptyStrings(translations);

      if (emptyStrings.length > 0) {
        console.error(
          `❌ CRITICAL: ${translationFile}.js has ${emptyStrings.length} empty strings:`
        );
        emptyStrings.forEach((key) => console.error(`   - ${key}`));
        hasErrors = true;
      }

      // Check for extra keys (optional warning)
      const extraKeys = langKeys.filter((key) => !enKeys.includes(key));
      if (extraKeys.length > 0) {
        console.log(
          `⚠️  ${translationFile}.js has ${extraKeys.length} extra keys (not critical):`
        );
        extraKeys.forEach((key) => console.log(`   - ${key}`));
      }
    }

    if (hasErrors) {
      console.error("❌ CRITICAL: Translation validation failed!");
    } else {
      console.log("✅ All translation files validated successfully!");
    }
  } catch (error) {
    console.error(
      "❌ CRITICAL: Error during translation validation:",
      error.message
    );
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log("Usage: node post_build.js <project_directory>");
    console.log("");
    console.log("This script will:");
    console.log("1. Validate and fix Font Awesome icons in the HTML file");
    console.log("2. Extract the credits content from biz_section.html");
    console.log(
      "3. Insert it at the beginning of the <head> tag in the target HTML file"
    );
    console.log(
      "4. Extract the business offering section from biz_section.html"
    );
    console.log("5. Insert it before the <footer> tag in the target HTML file");
    console.log(
      "6. Inject reviews from listing.json into the target HTML file"
    );
    console.log("");
    console.log("Examples:");
    console.log("  node post_build.js demo/test");
    console.log("  node post_build.js demo/villa-zori-bali");
    console.log("  node post_build.js demo/villa-lespoir-bali");
    process.exit(1);
  }

  const projectDir = args[0];
  const targetFile = path.join(projectDir, "index.html");

  // Check if project directory exists
  if (!fs.existsSync(projectDir)) {
    console.error(`❌ Project directory not found: ${projectDir}`);
    process.exit(1);
  }

  // Check if target file exists
  if (!fs.existsSync(targetFile)) {
    console.error(`❌ index.html not found in: ${targetFile}`);
    process.exit(1);
  }

  // Check if biz_section.html exists
  const bizSectionPath = "biz_section.html";
  if (!fs.existsSync(bizSectionPath)) {
    console.error(`❌ biz_section.html not found in current directory`);
    process.exit(1);
  }

  // Validate and fix Font Awesome icons first
  validateAndFixIcons(targetFile);

  console.log(`📖 Extracting credits content from ${bizSectionPath}...`);
  const creditsContent = extractCreditsContent(bizSectionPath);

  console.log(`📝 Inserting credits content into ${targetFile}...`);
  insertCreditsContent(targetFile, creditsContent);

  console.log(`📖 Extracting business section from ${bizSectionPath}...`);
  const businessSection = extractBusinessSection(bizSectionPath);

  console.log(`📝 Inserting business section into ${targetFile}...`);
  insertBusinessSection(targetFile, businessSection);

  console.log(`📖 Injecting reviews from listing.json into ${targetFile}...`);
  injectReviewsFromJson(targetFile);

  console.log(
    `📖 Verifying amenities from listing.json against ${targetFile}...`
  );
  verifyAmenities(targetFile);

  console.log(`📖 Checking image aspects in listing.json...`);
  checkImageAspects(targetFile);

  console.log(`📖 Checking images directory...`);
  checkImagesDirectory(targetFile);

  console.log(`📖 Validating translation files...`);
  validateTranslations(projectDir);

  console.log(
    "🎉 Done! The credits content, business section, and reviews have been added."
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  extractCreditsContent,
  extractBusinessSection,
  insertCreditsContent,
  insertBusinessSection,
  validateAndFixIcons,
  verifyAmenities,
  checkImageAspects,
  checkImagesDirectory,
  validateTranslations,
};
