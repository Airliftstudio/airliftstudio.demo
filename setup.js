const fs = require("fs");
const path = require("path");
const LANGUAGE_DEFINITIONS = require("./language_definitions.js");

function getListingId(url) {
  const match = url.match(/\/rooms\/(\d+)/);
  return match ? match[1] : "listing";
}

function copyDir(src, dest, options = {}) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip files based on language options
    if (options.skipFiles && options.skipFiles.includes(entry.name)) {
      console.log(`⏭️  Skipping ${entry.name} (language-specific file)`);
      continue;
    }

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });

      // Special handling for images folder - copy structure but skip image files
      if (entry.name === "images") {
        console.log(
          `📁 Creating images directory structure (skipping image files)`
        );
        // Don't copy contents of images folder, just create the directory
        continue;
      }

      copyDir(srcPath, destPath, options);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function isLanguageCode(param) {
  if (!param) return false;

  // Check if it contains commas (multiple languages)
  if (param.includes(",")) return true;

  // Check if it's a valid language code
  const availableLanguages = Object.keys(LANGUAGE_DEFINITIONS);
  return availableLanguages.includes(param);
}

function isTemplateName(param) {
  if (!param) return false;

  // Check if it's a valid template directory
  const templateDir = path.resolve("templates", param);
  return fs.existsSync(templateDir);
}

async function setup() {
  if (
    !process.argv[2] ||
    !/^https:\/\/www\.airbnb\.com\/rooms\/\d+/.test(process.argv[2])
  ) {
    throw new Error(
      "You must provide an Airbnb URL in the format: https://www.airbnb.com/rooms/123456789"
    );
  }

  const AIRBNB_URL = process.argv[2];
  const param3 = process.argv[3];
  const param4 = process.argv[4];

  // Determine if param3 is template name or languages
  let TEMPLATE = "v1"; // Default template
  let LANGUAGES = null;

  if (param3) {
    if (isLanguageCode(param3)) {
      // param3 is languages, use default template
      LANGUAGES = param3.split(",");
    } else if (isTemplateName(param3)) {
      // param3 is template name
      TEMPLATE = param3;
      if (param4) {
        LANGUAGES = param4.split(",");
      }
    } else {
      // param3 might be a template name that doesn't exist yet, or invalid
      console.warn(
        `Warning: '${param3}' is not a recognized template or language code`
      );
      TEMPLATE = param3; // Assume it's a template name
      if (param4) {
        LANGUAGES = param4.split(",");
      }
    }
  }

  // Validate languages if provided
  if (LANGUAGES) {
    const availableLanguages = Object.keys(LANGUAGE_DEFINITIONS);
    const invalidLanguages = LANGUAGES.filter(
      (lang) => !availableLanguages.includes(lang)
    );

    if (invalidLanguages.length > 0) {
      console.error(
        `Error: Invalid language codes provided: ${invalidLanguages.join(", ")}`
      );
      console.error(`Available languages: ${availableLanguages.join(", ")}`);
      process.exit(1);
    }

    console.log(`Validated languages: ${LANGUAGES.join(", ")}`);
  }

  const listingId = getListingId(AIRBNB_URL);
  const templateDir = path.resolve("templates", TEMPLATE);
  const destDir = path.resolve("demo", listingId);

  console.log(`Setting up project structure for listing ID: ${listingId}`);
  console.log(`Using template: ${TEMPLATE}`);

  // Check if template directory exists
  if (!fs.existsSync(templateDir)) {
    console.error(`Error: Template directory '${templateDir}' does not exist`);
    console.error(
      `Available templates: ${fs.readdirSync("templates").join(", ")}`
    );
    process.exit(1);
  }

  if (!fs.existsSync(destDir)) {
    // Create the destination directory
    fs.mkdirSync(destDir, { recursive: true });

    // Define files to skip based on language settings
    const skipFiles = LANGUAGES
      ? ["index.html", "js/translations.js"] // Skip regular index.html when languages are specified
      : [
          "index_lang.html",
          "js/translations.js",
          "js/lang.js",
          "css/lang.css",
          "_redirects",
        ]; // Skip language files when no languages

    // Copy all files from template directory
    copyDir(templateDir, destDir, { skipFiles });
    console.log(`✅ Copied template '${TEMPLATE}' to '${destDir}'`);

    // Handle index.html renaming for language support
    if (LANGUAGES) {
      const indexLangPath = path.join(destDir, "index_lang.html");
      const indexPath = path.join(destDir, "index.html");

      if (fs.existsSync(indexLangPath)) {
        fs.renameSync(indexLangPath, indexPath);
        console.log(
          `✅ Renamed index_lang.html to index.html for language support`
        );
      }
    }
  } else {
    console.log(`⚠️  Folder '${destDir}' already exists, not copying.`);
  }

  // Create images directory (this will be empty, ready for downloaded images)
  const imagesDir = path.join(destDir, "images");
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log(`✅ Created images directory: ${imagesDir}`);
  }

  console.log(`✅ Setup complete! Project structure created in: ${destDir}`);
}

setup().catch(console.error);
