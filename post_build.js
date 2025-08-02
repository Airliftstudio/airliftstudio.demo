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
          `⚠️  Icon ${iconClass} not found, replacing with fas ${defaultIcon}`
        );
        return `fas ${defaultIcon}`;
      }
      return iconClass;
    }

    // Check amenities section
    const amenitiesIconRegex = /<i class="([^"]*fa-[^"]*)"[^>]*>/g;
    content = content.replace(amenitiesIconRegex, (match, iconClass) => {
      const newIconClass = replaceInvalidIcon(iconClass, "amenities");
      if (newIconClass !== iconClass) {
        modified = true;
        return match.replace(iconClass, newIconClass);
      }
      return match;
    });

    // Check features section
    const featuresIconRegex = /<i class="([^"]*fa-[^"]*)"[^>]*>/g;
    content = content.replace(featuresIconRegex, (match, iconClass) => {
      const newIconClass = replaceInvalidIcon(iconClass, "features");
      if (newIconClass !== iconClass) {
        modified = true;
        return match.replace(iconClass, newIconClass);
      }
      return match;
    });

    // Check location section
    const locationIconRegex = /<i class="([^"]*fa-[^"]*)"[^>]*>/g;
    content = content.replace(locationIconRegex, (match, iconClass) => {
      const newIconClass = replaceInvalidIcon(iconClass, "location");
      if (newIconClass !== iconClass) {
        modified = true;
        return match.replace(iconClass, newIconClass);
      }
      return match;
    });

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

function checkImageAspects(targetFilePath) {
  try {
    console.log(`🖼️  Checking image aspects in listing.json...`);

    // Get the project directory
    const projectDir = path.dirname(targetFilePath);
    const listingJsonPath = path.join(projectDir, "listing.json");

    // Check if listing.json exists
    if (!fs.existsSync(listingJsonPath)) {
      console.log(
        `⚠️  listing.json not found at ${listingJsonPath}, skipping image aspect check`
      );
      return;
    }

    // Read listing.json
    const listingData = JSON.parse(fs.readFileSync(listingJsonPath, "utf8"));

    if (!listingData.images || !Array.isArray(listingData.images)) {
      console.log(
        `⚠️  No images found in listing.json, skipping image aspect check`
      );
      return;
    }

    // Count images by aspect
    const portraitImages = listingData.images.filter(
      (img) => img.aspect === "portrait"
    );
    const landscapeImages = listingData.images.filter(
      (img) => img.aspect === "landscape"
    );

    // Check for warnings
    let hasWarnings = false;

    if (portraitImages.length === 0) {
      console.log(`\n⚠️  WARNING: No portrait images found in listing.json`);
      console.log(
        `   • The website template expects at least one portrait image`
      );
      console.log(`   • Consider selecting a portrait image for better layout`);
      hasWarnings = true;
    }

    if (landscapeImages.length < 3) {
      console.log(
        `\n⚠️  WARNING: Less than 3 landscape images found in listing.json`
      );
      console.log(`   • Found: ${landscapeImages.length} landscape images`);
      console.log(
        `   • Recommended: At least 3 landscape images for optimal layout`
      );
      hasWarnings = true;
    }

    if (!hasWarnings) {
      console.log(`\n✅ Image aspects look good!`);
    }
  } catch (error) {
    console.error(`Error checking image aspects: ${error.message}`);
    // Don't exit process, just log the error and continue
    console.log("Continuing with other operations...");
  }
}

function checkImagesDirectory(targetFilePath) {
  try {
    // Get the project directory
    const projectDir = path.dirname(targetFilePath);
    const imagesDir = path.join(projectDir, "images");

    // Check if images directory exists
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

    // Get all files in the images directory
    const files = fs.readdirSync(imagesDir);

    // Filter for image files (common image extensions)
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    // Define the expected image names
    const expectedImages = [
      "hero-bg.jpg",
      "image-landscape-1.jpg",
      "image-landscape-2.jpg",
      "image-portrait-1.jpg",
      "image-normal-1.jpg",
      "image-normal-2.jpg",
      "image-normal-3.jpg",
      "image-normal-4.jpg",
      "image-normal-5.jpg",
      "image-normal-6.jpg",
      "image-normal-7.jpg",
      "image-normal-8.jpg",
      "image-normal-9.jpg",
      "image-normal-10.jpg",
    ];

    // Check for missing or incorrectly named images
    const missingImages = [];
    const incorrectNames = [];
    const foundImages = [];

    expectedImages.forEach((expectedImage) => {
      if (!imageFiles.includes(expectedImage)) {
        missingImages.push(expectedImage);
      } else {
        foundImages.push(expectedImage);
      }
    });

    // Check for extra images (not in expected list)
    imageFiles.forEach((imageFile) => {
      if (!expectedImages.includes(imageFile)) {
        incorrectNames.push(imageFile);
      }
    });

    // Generate critical warnings
    let hasCriticalIssues = false;

    if (imageFiles.length !== 14) {
      console.log(
        `\n🚨 CRITICAL WARNING: Incorrect number of images in /images directory!`
      );
      console.log(`   • Found: ${imageFiles.length} images`);
      console.log(`   • Expected: 14 images`);
      console.log(`   • Missing: ${14 - imageFiles.length} images`);
      console.log(`   • This will cause the website to display broken images`);
      hasCriticalIssues = true;
    }

    if (missingImages.length > 0) {
      console.log(`\n🚨 CRITICAL WARNING: Missing required images!`);
      console.log(`   • Missing images:`);
      missingImages.forEach((image) => {
        console.log(`     - ${image}`);
      });
      console.log(
        `   • These images are required for the website to function properly`
      );
      hasCriticalIssues = true;
    }

    if (incorrectNames.length > 0) {
      console.log(`\n🚨 CRITICAL WARNING: Images with incorrect names found!`);
      console.log(`   • Incorrectly named images:`);
      incorrectNames.forEach((image) => {
        console.log(`     - ${image}`);
      });
      console.log(`   • These images will not be used by the website`);
      hasCriticalIssues = true;
    }

    if (!hasCriticalIssues) {
      console.log(
        `\n✅ Images directory looks good! All 14 required images found with correct names.`
      );
    }
  } catch (error) {
    console.error(`Error checking images directory: ${error.message}`);
    // Don't exit process, just log the error and continue
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

    console.log(
      `📖 Validating ${translationFiles.length} translation files...`
    );

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
    console.log(`📊 English translations have ${enKeys.length} keys`);

    // Validate each translation file
    let hasErrors = false;

    for (const translationFile of translationFiles) {
      const langCode = translationFile.replace("translations_", "");
      const filePath = path.join(jsDir, `${translationFile}.js`);

      console.log(`🔍 Validating ${translationFile}.js...`);

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
