const fs = require("fs");
const path = require("path");

function generateTranslations(projectPath, languageCodes = []) {
  const indexPath = path.join(projectPath, "index.html");
  const translationsPath = path.join(projectPath, "js", "translations.js");

  if (!fs.existsSync(indexPath)) {
    console.error(`Index.html not found at ${indexPath}`);
    return;
  }

  if (!fs.existsSync(translationsPath)) {
    console.error(`Translations.js not found at ${translationsPath}`);
    return;
  }

  // Read the HTML file
  const htmlContent = fs.readFileSync(indexPath, "utf8");

  // Extract all data-translate attributes and their text content
  // Improved regex to handle various HTML structures
  const dataTranslateRegex =
    /data-translate="([^"]+)"[^>]*>([^<]*(?:<[^>]*>[^<]*<\/[^>]*>[^<]*)*)<\/[^>]*>/g;
  const translations = {};

  let match;
  while ((match = dataTranslateRegex.exec(htmlContent)) !== null) {
    const key = match[1];
    let value = match[2].trim();

    // Clean up the value by removing HTML tags but keeping text content
    value = value.replace(/<[^>]*>/g, "").trim();

    // Remove any trailing HTML comments or extra content
    value = value.replace(/-->.*$/, "").trim();

    // Convert multiline text to single line by replacing line breaks with spaces
    value = value
      .replace(/\s*\n\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (value) {
      // Convert key path to nested object
      const keyParts = key.split(".");
      let current = translations;

      for (let i = 0; i < keyParts.length - 1; i++) {
        const part = keyParts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }

      current[keyParts[keyParts.length - 1]] = value;
    }
  }

  // Extract meta data from HTML
  const meta = {};

  // Extract title
  const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/);
  if (titleMatch) {
    meta.title = titleMatch[1].trim();
  }

  // Extract meta description
  const descMatch = htmlContent.match(
    /<meta\s+name="description"\s+content="([^"]+)"/
  );
  if (descMatch) {
    meta.description = descMatch[1];
  }

  // Extract meta keywords
  const keywordsMatch = htmlContent.match(
    /<meta\s+name="keywords"\s+content="([^"]+)"/
  );
  if (keywordsMatch) {
    meta.keywords = keywordsMatch[1];
  }

  // Extract og:title
  const ogTitleMatch = htmlContent.match(
    /<meta\s+property="og:title"\s+content="([^"]+)"/
  );
  if (ogTitleMatch) {
    meta.og_title = ogTitleMatch[1];
  }

  // Extract og:description
  const ogDescMatch = htmlContent.match(
    /<meta\s+property="og:description"\s+content="([^"]+)"/
  );
  if (ogDescMatch) {
    meta.og_description = ogDescMatch[1];
  }

  // Add default meta values
  meta.locale = "en_US";
  meta.language = "English";

  // Extract structured data
  const structuredData = {};

  // Extract structured data JSON
  const structuredDataMatch = htmlContent.match(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/
  );
  if (structuredDataMatch) {
    try {
      const jsonContent = structuredDataMatch[1].trim();
      const structuredDataObj = JSON.parse(jsonContent);

      if (structuredDataObj.description) {
        structuredData.description = structuredDataObj.description;
      }

      if (
        structuredDataObj.address &&
        structuredDataObj.address.addressCountry
      ) {
        structuredData.addressCountry =
          structuredDataObj.address.addressCountry;
      }

      if (structuredDataObj.keywords) {
        structuredData.keywords = structuredDataObj.keywords;
      }

      // Extract amenity names from amenityFeature array
      if (
        structuredDataObj.amenityFeature &&
        Array.isArray(structuredDataObj.amenityFeature)
      ) {
        structuredData.amenityNames = structuredDataObj.amenityFeature.map(
          (feature) => feature.name
        );
      }
    } catch (e) {
      console.warn("Could not parse structured data JSON:", e.message);
    }
  }

  // Create the complete English translation object
  const enTranslation = {
    ...translations,
    meta,
    structuredData,
  };

  // Read existing translations file to extract non-English language objects
  const existingTranslations = fs.readFileSync(translationsPath, "utf8");

  // Ensure 'en' is always included in language codes
  const allLanguageCodes = [
    "en",
    ...languageCodes.filter((lang) => lang !== "en"),
  ];

  // Generate hreflang tags
  const hreflangTags = generateHreflangTags(htmlContent, allLanguageCodes);

  // Update HTML with hreflang tags
  const updatedHtmlContent = updateHtmlWithHreflang(htmlContent, hreflangTags);

  // Update HTML with language dropdown options
  const finalHtmlContent = updateLanguageDropdown(
    updatedHtmlContent,
    allLanguageCodes
  );

  // Create a properly formatted en object string
  const formatObject = (obj, indent = 2) => {
    const spaces = " ".repeat(indent);
    const lines = [];

    for (const [key, value] of Object.entries(obj)) {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        lines.push(`${spaces}${key}: {`);
        lines.push(formatObject(value, indent + 2));
        lines.push(`${spaces}},`);
      } else if (Array.isArray(value)) {
        lines.push(`${spaces}${key}: [`);
        value.forEach((item) => {
          lines.push(`${spaces}  "${item}",`);
        });
        lines.push(`${spaces}],`);
      } else {
        // Properly escape the string value to ensure valid JSON
        const escapedValue =
          typeof value === "string"
            ? `"${value
                .replace(/"/g, '\\"')
                .replace(/\n/g, " ")
                .replace(/\s+/g, " ")}"`
            : value;
        lines.push(`${spaces}${key}: ${escapedValue},`);
      }
    }

    return lines.join("\n");
  };

  // Get English defaults to exclude them
  const LANGUAGE_DEFINITIONS = require("./language_definitions.js");
  const enDefaults = LANGUAGE_DEFINITIONS.en?.defaults || {};

  // Create English object excluding default values
  const createEnglishObject = (obj, indent = 4, parentKey = "") => {
    const spaces = " ".repeat(indent);
    const lines = [];

    for (const [key, value] of Object.entries(obj)) {
      const currentKey = parentKey ? `${parentKey}.${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // Check if all child keys have defaults
        const childKeys = Object.keys(value);
        const allChildrenHaveDefaults = childKeys.every((childKey) => {
          const childCurrentKey = `${currentKey}.${childKey}`;
          return enDefaults[childCurrentKey];
        });

        if (allChildrenHaveDefaults) {
          // Skip this object entirely if all children have defaults
          continue;
        }

        // Create the object with only non-default children
        const childLines = [];
        for (const [childKey, childValue] of Object.entries(value)) {
          const childCurrentKey = `${currentKey}.${childKey}`;

          if (!enDefaults[childCurrentKey]) {
            if (
              typeof childValue === "object" &&
              childValue !== null &&
              !Array.isArray(childValue)
            ) {
              childLines.push(`${spaces}  ${childKey}: {`);
              childLines.push(
                createEnglishObject(childValue, indent + 4, childCurrentKey)
              );
              childLines.push(`${spaces}  },`);
            } else if (Array.isArray(childValue)) {
              childLines.push(`${spaces}  ${childKey}: [`);
              childValue.forEach((item) => {
                childLines.push(`${spaces}    "${item}",`);
              });
              childLines.push(`${spaces}  ],`);
            } else {
              const escapedValue =
                typeof childValue === "string"
                  ? `"${childValue
                      .replace(/"/g, '\\"')
                      .replace(/\n/g, " ")
                      .replace(/\s+/g, " ")}"`
                  : childValue;
              childLines.push(`${spaces}  ${childKey}: ${escapedValue},`);
            }
          }
        }

        if (childLines.length > 0) {
          lines.push(`${spaces}${key}: {`);
          lines.push(childLines.join("\n"));
          lines.push(`${spaces}},`);
        }
      } else if (Array.isArray(value)) {
        lines.push(`${spaces}${key}: [`);
        value.forEach((item) => {
          lines.push(`${spaces}  "${item}",`);
        });
        lines.push(`${spaces}],`);
      } else {
        // Only include keys that don't have default values
        if (!enDefaults[currentKey]) {
          const escapedValue =
            typeof value === "string"
              ? `"${value
                  .replace(/"/g, '\\"')
                  .replace(/\n/g, " ")
                  .replace(/\s+/g, " ")}"`
              : value;
          lines.push(`${spaces}${key}: ${escapedValue},`);
        }
      }
    }

    return lines.join("\n");
  };

  const enObjectString = `\n  en: {\n${createEnglishObject(
    enTranslation,
    4
  )}\n  }`;

  // Create placeholder objects for other languages with default values
  const createPlaceholderObject = (
    obj,
    langCode,
    indent = 4,
    parentKey = ""
  ) => {
    const spaces = " ".repeat(indent);
    const lines = [];
    const LANGUAGE_DEFINITIONS = require("./language_definitions.js");

    const langDefaults = LANGUAGE_DEFINITIONS[langCode]?.defaults || {};

    for (const [key, value] of Object.entries(obj)) {
      const currentKey = parentKey ? `${parentKey}.${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // Check if all child keys have defaults
        const childKeys = Object.keys(value);
        const allChildrenHaveDefaults = childKeys.every((childKey) => {
          const childCurrentKey = `${currentKey}.${childKey}`;
          return langDefaults[childCurrentKey];
        });

        if (allChildrenHaveDefaults) {
          // Skip this object entirely if all children have defaults
          continue;
        }

        // Create the object with only non-default children
        const childLines = [];
        for (const [childKey, childValue] of Object.entries(value)) {
          const childCurrentKey = `${currentKey}.${childKey}`;

          if (!langDefaults[childCurrentKey]) {
            if (
              typeof childValue === "object" &&
              childValue !== null &&
              !Array.isArray(childValue)
            ) {
              childLines.push(`${spaces}  ${childKey}: {`);
              childLines.push(
                createPlaceholderObject(
                  childValue,
                  langCode,
                  indent + 4,
                  childCurrentKey
                )
              );
              childLines.push(`${spaces}  },`);
            } else if (Array.isArray(childValue)) {
              childLines.push(`${spaces}  ${childKey}: [],`);
            } else {
              childLines.push(`${spaces}  ${childKey}: "",`);
            }
          }
        }

        if (childLines.length > 0) {
          lines.push(`${spaces}${key}: {`);
          lines.push(childLines.join("\n"));
          lines.push(`${spaces}},`);
        }
      } else if (Array.isArray(value)) {
        lines.push(`${spaces}${key}: [],`);
      } else {
        // Only include keys that don't have default values
        if (!langDefaults[currentKey]) {
          lines.push(`${spaces}${key}: "",`);
        }
      }
    }

    return lines.join("\n");
  };

  // Build the complete translations object with placeholders for all languages
  let translationsContent = `window.translations = {${enObjectString}`;

  // Add placeholder objects for other languages
  for (const langCode of languageCodes) {
    if (langCode !== "en") {
      const placeholderObject = `\n  ${langCode}: {\n${createPlaceholderObject(
        enTranslation,
        langCode,
        4
      )}\n  }`;
      translationsContent += `,${placeholderObject}`;
    }
  }

  // Close the object
  const completeTranslationsContent = translationsContent + "\n};";

  // Write the completely rewritten translations file
  fs.writeFileSync(translationsPath, completeTranslationsContent);

  // Write the updated HTML file
  fs.writeFileSync(indexPath, finalHtmlContent);

  console.log("✅ English translations generated successfully!");
  console.log(`📁 Updated: ${translationsPath}`);
  console.log(`🌐 Updated: ${indexPath} with hreflang tags`);
  console.log(`🔍 Found ${Object.keys(translations).length} translation keys`);
  console.log(`📊 Meta data extracted: ${Object.keys(meta).length} items`);
  console.log(
    `🏗️  Structured data extracted: ${Object.keys(structuredData).length} items`
  );
  console.log(`🌍 Languages for hreflang: ${allLanguageCodes.join(", ")}`);

  // Add language redirects
  addLanguageRedirects(projectPath, languageCodes);
  addLocalLanguageRedirects(projectPath, languageCodes);

  // Show the extracted translation keys
  console.log("\n📝 Extracted translation keys:");
  const printKeys = (obj, prefix = "") => {
    for (const [key, value] of Object.entries(obj)) {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        printKeys(value, prefix + key + ".");
      } else {
        console.log(`  ${prefix}${key}: "${value}"`);
      }
    }
  };
  printKeys(translations);
}

function extractFolderName(targetFilePath) {
  // Extract folder name from path like "villa-lestari-ubud" or "villa-lestari-ubud/index.html"
  const pathParts = targetFilePath.split("/");
  if (pathParts.length >= 1) {
    // If it's just a folder name, return it
    if (pathParts.length === 1) {
      return pathParts[0];
    }
    // If it's a path with a file, return the folder name
    return pathParts[pathParts.length - 2];
  }
  throw new Error("Could not extract folder name from path: " + targetFilePath);
}

function addLanguageRedirects(projectPath, languages) {
  try {
    const redirectsPath = "_redirects";
    const folderName = extractFolderName(projectPath);

    // Read existing redirects file
    let redirectsContent = "";
    if (fs.existsSync(redirectsPath)) {
      redirectsContent = fs.readFileSync(redirectsPath, "utf8");
    }

    // Check if redirects for this folder already exist
    const folderRedirectPattern = new RegExp(
      `/${folderName}/\\*.*${folderName}/index\\.html`
    );
    if (folderRedirectPattern.test(redirectsContent)) {
      console.log(
        `⚠️  Redirects for ${folderName} already exist in _redirects file`
      );
      return;
    }

    // Create new redirects for this folder
    const newRedirects = [
      `# ${folderName} redirects`,
      `/${folderName}/* /${folderName}/index.html 200`,
      ...languages.map(
        (lang) => `/${folderName}/${lang}/* /${folderName}/:splat 200`
      ),
    ].join("\n");

    // Add to existing content
    const updatedContent = redirectsContent + "\n\n" + newRedirects;

    // Write back to file
    fs.writeFileSync(redirectsPath, updatedContent, "utf8");

    console.log(`✅ Language redirects added to _redirects for ${folderName}:`);
    languages.forEach((lang) => {
      console.log(`   - /${folderName}/${lang}/* → /${folderName}/:splat 200`);
    });
  } catch (error) {
    console.error("Error adding language redirects:", error.message);
  }
}

function addLocalLanguageRedirects(projectPath, languages) {
  try {
    const folderName = extractFolderName(projectPath);
    const localRedirectsPath = `${folderName}/_redirects`;

    // Read existing local redirects file
    let localRedirectsContent = "";
    if (fs.existsSync(localRedirectsPath)) {
      localRedirectsContent = fs.readFileSync(localRedirectsPath, "utf8");
    }

    // Check if language redirects already exist
    const hasLanguageRedirects = languages.some((lang) => {
      const langRedirectPattern = new RegExp(`/${lang}/\\*.*:splat`);
      return langRedirectPattern.test(localRedirectsContent);
    });

    if (hasLanguageRedirects) {
      console.log(
        `⚠️  Language redirects already exist in ${localRedirectsPath}`
      );
      return;
    }

    // Create new language redirects for local file
    const newLocalRedirects = languages
      .map((lang) => `/${lang}/* /:splat 200`)
      .join("\n");

    // Add to existing content (after the default redirect)
    const defaultRedirect = "/* /index.html 200";
    if (localRedirectsContent.includes(defaultRedirect)) {
      // Insert after the default redirect
      const beforeDefault = localRedirectsContent.substring(
        0,
        localRedirectsContent.indexOf(defaultRedirect) + defaultRedirect.length
      );
      const afterDefault = localRedirectsContent.substring(
        localRedirectsContent.indexOf(defaultRedirect) + defaultRedirect.length
      );
      localRedirectsContent =
        beforeDefault + "\n" + newLocalRedirects + afterDefault;
    } else {
      // If no default redirect, add both
      localRedirectsContent = defaultRedirect + "\n\n" + newLocalRedirects;
    }

    // Write back to file
    fs.writeFileSync(localRedirectsPath, localRedirectsContent, "utf8");

    console.log(`✅ Local language redirects added to ${localRedirectsPath}:`);
    languages.forEach((lang) => {
      console.log(`   - /${lang}/* → /:splat 200`);
    });
  } catch (error) {
    console.error("Error adding local language redirects:", error.message);
  }
}

function generateHreflangTags(htmlContent, languageCodes) {
  // Extract domain from canonical URL
  const canonicalMatch = htmlContent.match(
    /<link\s+rel="canonical"\s+href="([^"]+)"/
  );
  let domain = "";

  if (canonicalMatch) {
    const canonicalUrl = canonicalMatch[1];
    const urlMatch = canonicalUrl.match(/https?:\/\/([^\/]+)/);
    if (urlMatch) {
      domain = urlMatch[1];
    }
  }

  // If no canonical URL found, use project name as fallback
  if (!domain) {
    const projectName = path.basename(process.argv[2]);
    domain = projectName.replace(/-/g, "") + ".com";
  }

  const tags = [];

  // Add hreflang tags for each language
  languageCodes.forEach((lang) => {
    if (lang === "en") {
      tags.push(
        `    <link rel="alternate" hreflang="en" href="https://${domain}/en/" />`
      );
    } else {
      tags.push(
        `    <link rel="alternate" hreflang="${lang}" href="https://${domain}/${lang}/" />`
      );
    }
  });

  // Add x-default tag
  tags.push(
    `    <link rel="alternate" hreflang="x-default" href="https://${domain}/" />`
  );

  return tags.join("\n");
}

function updateHtmlWithHreflang(htmlContent, hreflangTags) {
  // Check if hreflang section already exists
  const existingHreflangRegex =
    /<!-- Hreflang tags for international SEO -->[\s\S]*?<!-- End Hreflang tags -->/;

  const hreflangSection = `<!-- Hreflang tags for international SEO -->
${hreflangTags}
<!-- End Hreflang tags -->`;

  if (existingHreflangRegex.test(htmlContent)) {
    // Replace existing hreflang section
    return htmlContent.replace(existingHreflangRegex, hreflangSection);
  } else {
    // Find the existing comment and insert hreflang section after it
    const commentRegex = /(<!-- Hreflang tags for international SEO -->)/;
    return htmlContent.replace(
      commentRegex,
      `$1\n${hreflangTags}\n<!-- End Hreflang tags -->`
    );
  }
}

function updateLanguageDropdown(htmlContent, languageCodes) {
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

  // Generate new language options
  const languageOptions = languageCodes
    .map((langCode) => {
      const LANGUAGE_DEFINITIONS = require("./language_definitions.js");

      const langDef = LANGUAGE_DEFINITIONS[langCode];
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

// Get project path and language codes from command line arguments
const projectPath = process.argv[2];
const languageCodesString = process.argv[3];

// Parse language codes from comma-separated string
const languageCodes = languageCodesString
  ? languageCodesString
      .split(",")
      .map((lang) => lang.trim())
      .filter((lang) => lang)
  : [];

if (!projectPath) {
  console.error(
    "Usage: node generate_translations.js <project-path> [language-codes]"
  );
  console.error(
    "Example: node generate_translations.js villa-lestari-ubud fr,sv,de"
  );
  console.error("Example: node generate_translations.js villa-lestari-ubud");
  process.exit(1);
}

generateTranslations(projectPath, languageCodes);
