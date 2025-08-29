const fs = require("fs");
const path = require("path");

function cleanTranslationHtmlContent(indexPath) {
  let htmlContent = fs.readFileSync(indexPath, "utf8");

  let cleanedContent = htmlContent;

  // Remove text content from elements with data-translate attributes
  // Use a very precise approach that only removes text, not HTML structure
  const dataTranslateRegex =
    /<([^>]+data-translate="[^"]+"[^>]*)>([^<]*(?:<[^>]*>[^<]*<\/[^>]*>[^<]*)*)<\/[^>]*>/g;
  cleanedContent = cleanedContent.replace(
    dataTranslateRegex,
    (match, openingTag, content) => {
      // Extract only the text content (remove HTML tags)
      const textContent = content.replace(/<[^>]*>/g, "").trim();
      if (textContent) {
        // Replace only the text content with empty string, preserve all HTML structure
        return match.replace(textContent, "");
      }
      return match;
    }
  );

  // Handle any remaining simple data-translate elements
  const simpleDataTranslateRegex =
    /<([^>]+data-translate="[^"]+"[^>]*)>[^<]*<\/[^>]*>/g;
  cleanedContent = cleanedContent.replace(
    simpleDataTranslateRegex,
    (match, openingTag) => {
      // Extract text content between tags
      const textMatch = match.match(/>([^<]*)</);
      if (textMatch && textMatch[1].trim()) {
        return match.replace(textMatch[1], "");
      }
      return match;
    }
  );

  // Remove title content
  cleanedContent = cleanedContent.replace(
    /<title>([^<]+)<\/title>/g,
    "<title></title>"
  );

  // Remove meta description content
  cleanedContent = cleanedContent.replace(
    /<meta\s+name="description"\s+content="([^"]+)"/g,
    '<meta name="description" content=""'
  );

  // Remove meta keywords content
  cleanedContent = cleanedContent.replace(
    /<meta\s+name="keywords"\s+content="([^"]+)"/g,
    '<meta name="keywords" content=""'
  );

  // Remove og:title content
  cleanedContent = cleanedContent.replace(
    /<meta\s+property="og:title"\s+content="([^"]+)"/g,
    '<meta property="og:title" content=""'
  );

  // Remove og:description content
  cleanedContent = cleanedContent.replace(
    /<meta\s+property="og:description"\s+content="([^"]+)"/g,
    '<meta property="og:description" content=""'
  );

  // Remove structured data content
  cleanedContent = cleanedContent.replace(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    (match, jsonContent) => {
      try {
        const structuredDataObj = JSON.parse(jsonContent);

        // Clear translatable fields
        if (structuredDataObj.description) {
          structuredDataObj.description = "";
        }
        if (structuredDataObj.keywords) {
          structuredDataObj.keywords = "";
        }

        return `<script type="application/ld+json id="structured-data">${JSON.stringify(
          structuredDataObj,
          null,
          2
        )}</script>`;
      } catch (e) {
        // If JSON parsing fails, return the original match
        return match;
      }
    }
  );
  fs.writeFileSync(indexPath, cleanedContent, "utf8");
  console.log("✅ Removed default translations from index.html");
}

function polishProject(projectPath) {
  try {
    // Validate project path
    if (!projectPath) {
      console.error("❌ Error: Project path is required");
      console.log("Usage: node polish.js <project-path>");
      console.log("Example: node polish.js demo/test");
      process.exit(1);
    }

    // Check if project directory exists
    const fullProjectPath = path.resolve(projectPath);
    if (!fs.existsSync(fullProjectPath)) {
      console.error(
        `❌ Error: Project directory not found: ${fullProjectPath}`
      );
      process.exit(1);
    }

    // Check if index.html exists in the project
    const indexPath = path.join(fullProjectPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      console.error(`❌ Error: index.html not found in: ${fullProjectPath}`);
      process.exit(1);
    }

    // Create the _headers file content
    const headersContent = `/*
  X-Robots-Tag: index, follow

Link: </css/styles.css>; rel=preload; as=style, </js/script.js>; rel=preload; as=script
`;

    // Write the _headers file
    const headersPath = path.join(fullProjectPath, "_headers");
    fs.writeFileSync(headersPath, headersContent, "utf8");

    // Remove redirects from root _redirects file
    removeRedirectsFromRoot(projectPath);

    // Remove business-offering section from index.html
    removeBusinessOfferingSection(indexPath);

    //TODO här så testa att istället ta bort translations_en.js och ersätta med en dynamisk
    //TODO js code som populerar ett object  vid load... och använder det objektet istället för translations_en.js
    //TODO för att sätta tillbaka engelska när man byter språk.
    // // Remove default translations from index.html only if js/translations_en.js exists
    // const translationsEnPath = path.join(
    //   fullProjectPath,
    //   "js",
    //   "translations_en.js"
    // );
    // if (fs.existsSync(translationsEnPath)) {
    //   cleanTranslationHtmlContent(indexPath);
    // } else {
    //   console.log(
    //     "ℹ️  Skipping removal of default translations: js/translations_en.js not found"
    //   );
    // }

    // Remove backup images from images directory
    removeBackupImages(fullProjectPath);

    // Remove listing.json from project directory
    removeListingJson(fullProjectPath);

    console.log("✅ Polish complete!");
    console.log(`📁 Updated: ${headersPath}`);
    console.log("🔍 Added SEO headers: X-Robots-Tag: index, follow");
    console.log(
      "⚡ Added performance headers: preload for hero image, CSS, and JS"
    );
    console.log("🔄 Removed redirects from root _redirects file");
    console.log("💼 Removed business-offering section from index.html");
    console.log("🗑️  Removed backup images from images/ directory");
    console.log("🗑️  Removed listing.json from project directory");
  } catch (error) {
    console.error("❌ Error polishing project:", error.message);
    process.exit(1);
  }
}

//! this will make it inaccessible at airliftstudios.com/demo/x
function removeRedirectsFromRoot(projectPath) {
  const redirectsPath = path.join(__dirname, "_redirects");

  // Check if _redirects file exists
  if (!fs.existsSync(redirectsPath)) {
    console.log("ℹ️  No root _redirects file found, skipping redirect removal");
    return;
  }

  try {
    // Read the current _redirects file
    let redirectsContent = fs.readFileSync(redirectsPath, "utf8");

    // Split content into lines
    const lines = redirectsContent.split("\n");
    const filteredLines = [];
    let skipNextLines = false;
    let removedCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if this line is a comment indicating the start of redirects for this project
      if (
        line.startsWith("#") &&
        line.includes(projectPath) &&
        line.includes("redirects")
      ) {
        skipNextLines = true;
        removedCount++;
        continue;
      }

      // If we're skipping lines and encounter a blank line or a new comment section, stop skipping
      if (
        skipNextLines &&
        (line === "" || (line.startsWith("#") && !line.includes(projectPath)))
      ) {
        skipNextLines = false;
      }

      // Add the line if we're not skipping
      if (!skipNextLines) {
        filteredLines.push(lines[i]);
      } else {
        removedCount++;
      }
    }

    // Write the filtered content back to the file
    const updatedContent = filteredLines.join("\n");
    fs.writeFileSync(redirectsPath, updatedContent, "utf8");

    if (removedCount > 0) {
      console.log(
        `🗑️  Removed ${removedCount} redirect lines for ${projectPath}`
      );
    } else {
      console.log(
        `ℹ️  No redirects found for ${projectPath} in root _redirects file`
      );
    }
  } catch (error) {
    console.error("❌ Error removing redirects:", error.message);
  }
}

function removeBusinessOfferingSection(indexPath) {
  try {
    // Read the index.html file
    let htmlContent = fs.readFileSync(indexPath, "utf8");

    // Find the start of the business-offering section
    const startMarker = '<section id="business-offering"';
    const startIndex = htmlContent.indexOf(startMarker);

    if (startIndex === -1) {
      console.log("ℹ️  No business-offering section found in index.html");
      return;
    }

    // Find the end of the business-offering section
    // Look for the closing </section> tag that corresponds to the business-offering section
    // Since business-offering section doesn't have nested sections, we can just find the next </section> tag
    const endMarker = "</section>";
    const endIndex = htmlContent.indexOf(endMarker, startIndex);

    if (endIndex === -1) {
      console.log(
        "⚠️  Could not find closing tag for business-offering section"
      );
      return;
    }

    // Remove the business-offering section
    const beforeSection = htmlContent.substring(0, startIndex);
    const afterSection = htmlContent.substring(endIndex + endMarker.length);
    const cleanedContent = beforeSection + afterSection;

    // Write the cleaned content back to the file
    fs.writeFileSync(indexPath, cleanedContent, "utf8");

    console.log("🗑️  Removed business-offering section from index.html");
  } catch (error) {
    console.error(
      "❌ Error removing business-offering section:",
      error.message
    );
  }
}

function removeBackupImages(projectPath) {
  try {
    const imagesPath = path.join(projectPath, "images");

    // Check if images directory exists
    if (!fs.existsSync(imagesPath)) {
      console.log(
        "ℹ️  No images directory found, skipping backup image removal"
      );
      return;
    }

    // Read all files in the images directory
    const files = fs.readdirSync(imagesPath);
    let removedCount = 0;

    // Filter and remove files that start with "backup"
    files.forEach((file) => {
      if (file.startsWith("backup")) {
        const filePath = path.join(imagesPath, file);
        try {
          fs.unlinkSync(filePath);
          removedCount++;
          console.log(`🗑️  Removed backup image: ${file}`);
        } catch (error) {
          console.error(
            `❌ Error removing backup image ${file}:`,
            error.message
          );
        }
      }
    });

    if (removedCount > 0) {
      console.log(
        `✅ Removed ${removedCount} backup images from images/ directory`
      );
    } else {
      console.log("ℹ️  No backup images found in images/ directory");
    }
  } catch (error) {
    console.error("❌ Error removing backup images:", error.message);
  }
}

function removeListingJson(projectPath) {
  try {
    const listingJsonPath = path.join(projectPath, "listing.json");

    // Check if listing.json exists
    if (!fs.existsSync(listingJsonPath)) {
      console.log("ℹ️  No listing.json found, skipping removal");
      return;
    }

    // Remove the listing.json file
    fs.unlinkSync(listingJsonPath);
    console.log("🗑️  Removed listing.json from project directory");
  } catch (error) {
    console.error("❌ Error removing listing.json:", error.message);
  }
}

// Get project path from command line arguments
const projectPath = process.argv[2];

if (!projectPath) {
  console.error("❌ Error: Project path is required");
  console.log("Usage: node polish.js <project-path>");
  console.log("Example: node polish.js demo/test");
  process.exit(1);
}

polishProject(projectPath);
