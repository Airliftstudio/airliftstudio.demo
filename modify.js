const fs = require("fs");
const path = require("path");

function updateLanguageDropdown(htmlContent, languageCodes) {
  console.log("Updating language dropdown..." + languageCodes);
  // Always include English as the first option
  const SUPPORTED_LANGUAGES = require("./supported_languages.js");
  const uniqueLangCodes = ["en", ...languageCodes.filter((c) => c !== "en")];

  // Find the language dropdown section
  const dropdownStartRegex = /<div class="language-dropdown"[^>]*>/;
  const dropdownEndRegex = /<\/div>\s*<\/div>\s*<\/li>/;

  if (
    !dropdownStartRegex.test(htmlContent) ||
    !dropdownEndRegex.test(htmlContent)
  ) {
    console.warn("Language dropdown not found in HTML.");
    return htmlContent;
  }

  // Generate new language options, always with English first
  const languageOptions = uniqueLangCodes
    .map((langCode) => {
      const langDef = SUPPORTED_LANGUAGES[langCode];
      const flag = langDef?.flag || "🌐";
      const displayName = langDef?.displayName || langCode.toUpperCase();
      const activeClass = langCode === "en" ? " active" : "";

      return `                <div class="language-option${activeClass}" data-lang="${langCode}">
                  <span class="language-flag">${flag}</span>
                  ${displayName}
                </div>`;
    })
    .join("\n");

  // Replace the entire dropdown content
  const newDropdownContent = `              <div class="language-dropdown" id="languageDropdown">
${languageOptions}
              </div>`;

  // Find and replace the dropdown section
  const dropdownSectionRegex =
    /<div class="language-dropdown"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/li>/;

  return htmlContent.replace(
    dropdownSectionRegex,
    newDropdownContent + "\n            </div>\n          </li>"
  );
}

function getListingId(url) {
  const match = url.match(/\/rooms\/(\d+)/);
  return match ? match[1] : "listing";
}

// Function to remove console.log calls from JavaScript files
function removeConsoleLogsFromJSFiles(destDir) {
  const jsDir = path.join(destDir, "js");

  if (!fs.existsSync(jsDir)) {
    console.log(
      `⚠️  JS directory not found at ${jsDir}, skipping console.log removal`
    );
    return;
  }

  const jsFiles = fs.readdirSync(jsDir).filter((file) => file.endsWith(".js"));

  if (jsFiles.length === 0) {
    console.log(`⚠️  No JavaScript files found in ${jsDir}`);
    return;
  }

  let totalRemoved = 0;

  jsFiles.forEach((file) => {
    const filePath = path.join(jsDir, file);
    let content = fs.readFileSync(filePath, "utf8");

    // Count console.log statements before removal
    const consoleLogMatches = content.match(/console\.log\([^)]*\);?/g) || [];
    const initialCount = consoleLogMatches.length;

    // Remove console.log calls (including multi-line ones)
    // This regex matches console.log with any content inside parentheses, including nested parentheses
    const consoleLogRegex = /console\.log\([^)]*(?:\([^)]*\)[^)]*)*\);?/g;
    content = content.replace(consoleLogRegex, "");

    // Also remove empty lines that might be left after console.log removal
    content = content.replace(/\n\s*\n\s*\n/g, "\n\n");

    // Count how many were removed
    const finalMatches = content.match(/console\.log\([^)]*\);?/g) || [];
    const removedCount = initialCount - finalMatches.length;

    if (removedCount > 0) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✅ Removed ${removedCount} console.log calls from ${file}`);
      totalRemoved += removedCount;
    }
  });

  if (totalRemoved > 0) {
    console.log(
      `✅ Total: Removed ${totalRemoved} console.log calls from ${jsFiles.length} JavaScript files`
    );
  } else {
    console.log(`ℹ️  No console.log calls found in JavaScript files`);
  }
}

async function modify() {
  if (
    !process.argv[2] ||
    !/^https:\/\/www\.airbnb\.com\/rooms\/\d+/.test(process.argv[2])
  ) {
    throw new Error(
      "You must provide an Airbnb URL in the format: https://www.airbnb.com/rooms/123456789"
    );
  }

  const AIRBNB_URL = process.argv[2];
  const listingId = getListingId(AIRBNB_URL);
  const destDir = path.resolve("demo", listingId);

  // Check if project directory exists
  if (!fs.existsSync(destDir)) {
    console.error(
      `Error: Project directory '${destDir}' does not exist. Run setup first.`
    );
    process.exit(1);
  }

  // Check if listing.json exists
  const jsonPath = path.join(destDir, "listing.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(
      `Error: listing.json not found at ${jsonPath}. Run scrape first.`
    );
    process.exit(1);
  }

  // Read listing.json
  console.log("Reading listing.json...");
  const listingData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  // --- Modify index.html based on listing.json data ---
  console.log("Modifying index.html based on listing data...");

  const indexHtmlPath = path.join(destDir, "index.html");
  if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, "utf8");

    // 1. Update the rating value
    const ratingElement = htmlContent.match(
      /<span[^>]*id="airbnb-rating-value"[^>]*>([^<]*)<\/span>/
    );
    if (ratingElement && listingData.rating) {
      htmlContent = htmlContent.replace(
        /<span[^>]*id="airbnb-rating-value"[^>]*>([^<]*)<\/span>/,
        `<span id="airbnb-rating-value">${listingData.rating}</span>`
      );
      console.log(`✅ Updated rating to ${listingData.rating}`);
    }

    // 2. Comment out badge elements based on badges array
    const hasSuperhost = listingData.badges.includes("superhost");
    const hasGuestFavorite = listingData.badges.includes("guest_favorite");

    // Handle superhost badge
    const superhostBadge = htmlContent.match(
      /<div[^>]*class="[^"]*badge-superhost[^"]*"[^>]*>[\s\S]*?<\/div>/
    );
    if (superhostBadge && !hasSuperhost) {
      htmlContent = htmlContent.replace(
        /(<div[^>]*class="[^"]*badge-superhost[^"]*"[^>]*>[\s\S]*?<\/div>)/,
        `<!-- $1 -->`
      );
      console.log(`✅ Commented out superhost badge (not found in badges)`);
    }

    // Handle guest favorite badge
    const guestFavoriteBadge = htmlContent.match(
      /<div[^>]*class="[^"]*badge-guest-favorite[^"]*"[^>]*>[\s\S]*?<\/div>/
    );
    if (guestFavoriteBadge && !hasGuestFavorite) {
      htmlContent = htmlContent.replace(
        /(<div[^>]*class="[^"]*badge-guest-favorite[^"]*"[^>]*>[\s\S]*?<\/div>)/,
        `<!-- $1 -->`
      );
      console.log(
        `✅ Commented out guest favorite badge (not found in badges)`
      );
    }

    // Update all Airbnb links to use the correct listing ID
    // Replace any occurrence of the old Airbnb room URL with the new one
    // Match all Airbnb room links (with or without trailing slash, with or without /reviews etc)
    // Match any Airbnb room URL with optional trailing path segments (e.g., /reviews, /calendar, etc.)
    const airbnbUrlFlexibleRegex =
      /https:\/\/www\.airbnb\.com\/rooms\/\d+(\/[a-zA-Z0-9_-]+)?\/?/g;
    htmlContent = htmlContent.replace(airbnbUrlFlexibleRegex, (match) => {
      // Extract any trailing path after the room ID (e.g., /reviews, /calendar)
      const trailingPathMatch = match.match(/\/rooms\/\d+(\/[a-zA-Z0-9_-]+)?/);
      let trailingPath = "";
      if (trailingPathMatch && trailingPathMatch[1]) {
        trailingPath = trailingPathMatch[1];
      }
      // Always add trailing slash for base URL, but not for extra path
      if (trailingPath) {
        return `https://www.airbnb.com/rooms/${listingId}${trailingPath}`;
      } else {
        return `https://www.airbnb.com/rooms/${listingId}/`;
      }
    });
    console.log(`✅ Updated all Airbnb links to use ID ${listingId}`);

    // Update language dropdown if language codes are provided
    if (process.argv[3]) {
      const languageCodes = process.argv[3]
        .split(",")
        .map((lang) => lang.trim())
        .filter((lang) => lang);

      if (languageCodes.length > 1) {
        htmlContent = updateLanguageDropdown(htmlContent, languageCodes);
        console.log(
          `✅ Updated language dropdown with: ${languageCodes.join(", ")}`
        );
      }
    }

    // Update hero capacity row with data from listing.json
    if (listingData.capacity) {
      // Parse capacity string (e.g., "4 guests  -  2 bedrooms  -  2 beds  -  2.5 baths")
      const capacityItems = listingData.capacity
        .split(/\s*-\s*/) // Split by dash with optional spaces
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      if (capacityItems.length > 0) {
        // Check if language codes are provided (translation mode)
        const hasLanguageCodes =
          process.argv[3] &&
          process.argv[3].split(",").filter((lang) => lang.trim()).length > 1;

        // Generate the capacity HTML
        let capacityHtml;
        console.log("Translation mode---------------" + process.argv[3]);

        if (hasLanguageCodes) {
          console.log("Translation mode---------------");
          // Translation mode: use data-translate attributes
          capacityHtml = capacityItems
            .map((item, index) => {
              // Generate translation key based on the item content
              // Extract all words from the item (e.g., "parking spaces" from "2 parking spaces")
              const words = item.toLowerCase().split(/\s+/);

              // Filter out numbers and common words, keep only meaningful words
              const meaningfulWords = words.filter((word) => {
                // Remove numbers, articles, and common words
                return (
                  !/^\d+(\.\d+)?$/.test(word) && // Remove numbers like "2", "2.5"
                  !["a", "an", "the", "of", "with"].includes(word)
                ); // Remove common words
              });

              // Handle special cases for common items
              let translateKey = "";
              if (meaningfulWords.includes("guest")) {
                translateKey = "hero.guests";
              } else if (meaningfulWords.includes("bedroom")) {
                translateKey = "hero.bedrooms";
              } else if (meaningfulWords.includes("bed")) {
                translateKey = "hero.beds";
              } else if (meaningfulWords.includes("bath")) {
                translateKey = "hero.baths";
              } else {
                // For custom items, concatenate all meaningful words
                const cleanWords = meaningfulWords.map((word) =>
                  word.replace(/s$/, "")
                ); // Remove trailing 's' for singular
                translateKey = `hero.${cleanWords.join("")}`;
              }

              const itemHtml = `<span class="hero-capacity-item">
              <span data-translate="${translateKey}">${item}</span>
            </span>`;

              // Add dot separator between items (but not after the last item)
              return index < capacityItems.length - 1
                ? itemHtml + '<span class="hero-dot">•</span>'
                : itemHtml;
            })
            .join("");
        } else {
          // Non-translation mode: simple HTML without data-translate
          capacityHtml = capacityItems
            .map((item, index) => {
              const itemHtml = `<span class="hero-capacity-item">${item}</span>`;
              // Add dot separator between items (but not after the last item)
              return index < capacityItems.length - 1
                ? itemHtml + '<span class="hero-dot">•</span>'
                : itemHtml;
            })
            .join("");
        }

        // Replace the hero capacity row content
        const heroCapacityRegex =
          /<div class="hero-capacity-row">[\s\S]*?<\/div>/;
        const newHeroCapacity = `<div class="hero-capacity-row">
          <span class="hero-capacity">
            ${capacityHtml}
          </span>
        </div>`;

        if (heroCapacityRegex.test(htmlContent)) {
          htmlContent = htmlContent.replace(heroCapacityRegex, newHeroCapacity);
          console.log(
            `✅ Updated hero capacity with: ${capacityItems.join(" • ")}${
              hasLanguageCodes ? " (with translation support)" : ""
            }`
          );
        } else {
          console.log(`⚠️  Hero capacity row not found in HTML`);
        }
      }
    }

    // Write the modified HTML back to the file
    fs.writeFileSync(indexHtmlPath, htmlContent, "utf8");
    console.log(`✅ Successfully modified ${indexHtmlPath}`);
  } else {
    console.log(
      `⚠️  index.html not found at ${indexHtmlPath}, skipping modifications`
    );
  }

  // Remove console.log calls from JavaScript files
  console.log("Removing console.log calls from JavaScript files...");
  removeConsoleLogsFromJSFiles(destDir);

  console.log(`✅ Modification complete!`);
}

// Only run modify() if this file is executed directly (not when required as a module)
if (require.main === module) {
  modify().catch(console.error);
}

// Export the updateLanguageDropdown function for use in other modules
module.exports = {
  updateLanguageDropdown,
  getListingId,
  removeConsoleLogsFromJSFiles,
};
