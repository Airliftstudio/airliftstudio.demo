const fs = require("fs");
const path = require("path");

function cleanHtmlContent(htmlContent) {
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
        if (
          structuredDataObj.amenityFeature &&
          Array.isArray(structuredDataObj.amenityFeature)
        ) {
          structuredDataObj.amenityFeature =
            structuredDataObj.amenityFeature.map((feature) => ({
              ...feature,
              name: "",
            }));
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

  return cleanedContent;
}

function createLanguageFiles(jsPath, enTranslation, languageCodes) {
  // Get English defaults to exclude them
  const SUPPORTED_LANGUAGES = require("./supported_languages.js");
  const enDefaults = SUPPORTED_LANGUAGES.en?.defaults || {};

  // Create English object excluding default values
  const createEnglishObject = (obj, indent = 2, parentKey = "") => {
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
                createEnglishObject(childValue, indent + 2, childCurrentKey)
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

  // Create placeholder objects for other languages with default values
  const createPlaceholderObject = (
    obj,
    langCode,
    indent = 2,
    parentKey = ""
  ) => {
    const spaces = " ".repeat(indent);
    const lines = [];
    const SUPPORTED_LANGUAGES = require("./supported_languages.js");

    const langDefaults = SUPPORTED_LANGUAGES[langCode]?.defaults || {};

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
                  indent + 2,
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

  // Create individual language files with window.translations_[code] format
  for (const langCode of languageCodes) {
    const langFilePath = path.join(jsPath, `translations_${langCode}.js`);

    if (langCode === "en") {
      const enObjectString = `window.translations_${langCode} = {\n${createEnglishObject(
        enTranslation,
        2
      )}\n};`;
      fs.writeFileSync(langFilePath, enObjectString);
    } else {
      const placeholderObject = `window.translations_${langCode} = {\n${createPlaceholderObject(
        enTranslation,
        langCode,
        2
      )}\n};`;
      fs.writeFileSync(langFilePath, placeholderObject);
    }
  }
}

function createTranslationsLoader(jsPath, languageCodes) {
  // Read the existing lang.js template
  const langJsTemplatePath = path.join(
    __dirname,
    "templates",
    "v1",
    "js",
    "lang.js"
  );
  let langJsContent = fs.readFileSync(langJsTemplatePath, "utf8");

  // Generate the translation loading lines
  const translationLines = languageCodes
    .map(
      (langCode) =>
        `  translations["${langCode}"] = window.translations_${langCode} || {};`
    )
    .join("\n");

  // Find and replace only the loadTranslations function content
  const loadTranslationsRegex =
    /translations\["en"\] = window\.translations_en \|\| \{\};/;
  const newLoadFunction = translationLines;

  // Replace only the loadTranslations function
  langJsContent = langJsContent.replace(loadTranslationsRegex, newLoadFunction);

  // Write the updated lang.js file
  fs.writeFileSync(path.join(jsPath, "lang.js"), langJsContent);
}

function extractFolderName(targetFilePath) {
  // Extract the full project path from the target file path
  // For paths like "demo/test" or "demo/test/index.html", we want "demo/test"
  const pathParts = targetFilePath.split("/");

  // If it's just a folder name, return it
  if (pathParts.length === 1) {
    return pathParts[0];
  }

  // If it ends with a file (like index.html), remove the file part
  if (pathParts[pathParts.length - 1].includes(".")) {
    return pathParts.slice(0, -1).join("/");
  }

  // Otherwise, return the full path
  return pathParts.join("/");
}

function addLanguageRedirects(projectPath, languages) {
  try {
    const redirectsPath = "_redirects";
    const fullPath = extractFolderName(projectPath);

    // Read existing redirects file
    let redirectsContent = "";
    if (fs.existsSync(redirectsPath)) {
      redirectsContent = fs.readFileSync(redirectsPath, "utf8");
    }

    // Remove existing redirects for this path
    const pathRedirectPattern = new RegExp(
      `# ${fullPath.replace(/\//g, "\\/")} redirects\\n.*?\\n\\n`,
      "gs"
    );
    if (pathRedirectPattern.test(redirectsContent)) {
      console.log(
        `🔄 Removing existing redirects for ${fullPath} from _redirects file`
      );
      redirectsContent = redirectsContent.replace(pathRedirectPattern, "");
    }

    // Create new redirects for this path
    const newRedirects = [
      `# ${fullPath} redirects`,
      `/${fullPath}/* /${fullPath}/index.html 200`,
      ...languages.map(
        (lang) => `/${fullPath}/${lang}/* /${fullPath}/:splat 200`
      ),
    ].join("\n");

    // Add to existing content
    const updatedContent = redirectsContent + "\n\n" + newRedirects;

    // Write back to file
    fs.writeFileSync(redirectsPath, updatedContent, "utf8");

    console.log(`✅ Language redirects updated in _redirects for ${fullPath}:`);
    languages.forEach((lang) => {
      console.log(`   - /${fullPath}/${lang}/* → /${fullPath}/:splat 200`);
    });
  } catch (error) {
    console.error("Error adding language redirects:", error.message);
  }
}

function addLocalLanguageRedirects(projectPath, languages) {
  try {
    const fullPath = extractFolderName(projectPath);
    const localRedirectsPath = `${fullPath}/_redirects`;

    // Read existing local redirects file
    let localRedirectsContent = "";
    if (fs.existsSync(localRedirectsPath)) {
      localRedirectsContent = fs.readFileSync(localRedirectsPath, "utf8");
    }

    // Remove existing language redirects
    languages.forEach((lang) => {
      const langRedirectPattern = new RegExp(`/${lang}/\\*.*:splat.*\\n?`, "g");
      if (langRedirectPattern.test(localRedirectsContent)) {
        console.log(
          `🔄 Removing existing redirect for /${lang}/* from ${localRedirectsPath}`
        );
        localRedirectsContent = localRedirectsContent.replace(
          langRedirectPattern,
          ""
        );
      }
    });

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

    console.log(
      `✅ Local language redirects updated in ${localRedirectsPath}:`
    );
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
    // Add hreflang section at the end of the <head> tag
    const headEndRegex = /(\s*<\/head>)/;
    return htmlContent.replace(headEndRegex, `\n    ${hreflangSection}\n$1`);
  }
}

function addTranslationScriptsToHtml(htmlContent, languageCodes) {
  // Remove existing translation script tags
  let cleanedHtml = htmlContent.replace(
    /<script src="js\/translations_[a-z]{2}\.js"><\/script>\s*\n?/g,
    ""
  );

  // Generate script tags for all translation files
  const scriptTags = languageCodes
    .map(
      (langCode) => `    <script src="js/translations_${langCode}.js"></script>`
    )
    .join("\n");

  // Add script tags just before the closing body tag
  const updatedHtml = cleanedHtml.replace(
    /(\s*)<\/body>/,
    `\n${scriptTags}\n$1</body>`
  );

  return updatedHtml;
}

function generateTranslations(projectPath, languageCodes = []) {
  const indexPath = path.join(projectPath, "index.html");
  const jsPath = path.join(projectPath, "js");

  if (!fs.existsSync(indexPath)) {
    console.error(`Index.html not found at ${indexPath}`);
    return;
  }

  // Create js directory if it doesn't exist
  if (!fs.existsSync(jsPath)) {
    fs.mkdirSync(jsPath, { recursive: true });
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

  // Ensure 'en' is always included in language codes
  const allLanguageCodes = [
    "en",
    ...languageCodes.filter((lang) => lang !== "en"),
  ];

  // Generate hreflang tags
  const hreflangTags = generateHreflangTags(htmlContent, allLanguageCodes);

  // Clean the HTML content by removing translatable text
  const cleanedHtmlContent = cleanHtmlContent(htmlContent);

  // Update HTML with hreflang tags
  let finalHtmlContent = updateHtmlWithHreflang(
    cleanedHtmlContent,
    hreflangTags
  );

  // Add translation script imports to HTML
  finalHtmlContent = addTranslationScriptsToHtml(
    finalHtmlContent,
    allLanguageCodes
  );

  // Create individual language files
  createLanguageFiles(jsPath, enTranslation, allLanguageCodes);

  // Create the main translations loader
  createTranslationsLoader(jsPath, allLanguageCodes);

  // Write the updated HTML file
  fs.writeFileSync(indexPath, finalHtmlContent);

  console.log("✅ English translations generated successfully!");
  console.log(`📁 Created language files in: ${jsPath}`);
  console.log(
    `🌐 Updated: ${indexPath} with hreflang tags and cleaned translatable content`
  );
  console.log(`🔍 Found ${Object.keys(translations).length} translation keys`);
  console.log(`📊 Meta data extracted: ${Object.keys(meta).length} items`);
  console.log(
    `🏗️  Structured data extracted: ${Object.keys(structuredData).length} items`
  );
  console.log(`🌍 Languages for hreflang: ${allLanguageCodes.join(", ")}`);
  console.log(
    `🧹 Cleaned HTML content: removed translatable text while preserving structure`
  );

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
