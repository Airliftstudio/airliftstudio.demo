const fs = require("fs");
const path = require("path");

function addDefaultTranslations(projectPath) {
  const translationsPath = path.join(projectPath, "js", "translations.js");

  if (!fs.existsSync(translationsPath)) {
    console.error("❌ Translations file not found:", translationsPath);
    return;
  }

  try {
    // Read the current translations file
    const translationsContent = fs.readFileSync(translationsPath, "utf8");

    // Extract the translations object
    const translationsMatch = translationsContent.match(
      /window\.translations\s*=\s*([\s\S]*?);/
    );

    if (!translationsMatch) {
      console.error("❌ Could not find translations object in file");
      return;
    }

    // Parse the translations object using Function constructor (safer than eval)
    let translationsStr = translationsMatch[1];
    // Fix common syntax issues
    translationsStr = translationsStr.replace(/,\s*};$/, "};");
    translationsStr = translationsStr.replace(/,\s*,\s*};$/, "};");

    // Escape apostrophes and quotes properly
    translationsStr = translationsStr.replace(/'/g, "\\'");
    translationsStr = translationsStr.replace(/"/g, '\\"');

    // Convert back to single quotes for the function constructor
    translationsStr = translationsStr.replace(/\\"/g, "'");

    const translations = new Function("return " + translationsStr)();

    // Add default values to each language
    for (const [langCode, langData] of Object.entries(translations)) {
      const LANGUAGE_DEFINITIONS = require("./language_definitions.js");
      const langDefaults = LANGUAGE_DEFINITIONS[langCode]?.defaults || {};

      // Dynamically apply all default values
      applyDefaultsToObject(langData, langDefaults);
    }

    // Convert back to string
    const updatedTranslationsStr = formatTranslationsObject(translations);
    const updatedContent = translationsContent.replace(
      /window\.translations\s*=\s*{[\s\S]*};/,
      `window.translations = {\n${updatedTranslationsStr}\n};`
    );

    // Write back to file
    fs.writeFileSync(translationsPath, updatedContent);

    console.log("✅ Default translations added successfully!");
    console.log(`📁 Updated: ${translationsPath}`);
  } catch (error) {
    console.error("❌ Error adding default translations:", error.message);
  }
}

function applyDefaultsToObject(obj, defaults) {
  // Process each default key
  for (const [defaultKey, defaultValue] of Object.entries(defaults)) {
    const keys = defaultKey.split(".");
    let current = obj;

    // Navigate to the parent object (all keys except the last one)
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];

      // Create the object if it doesn't exist
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }

      current = current[key];
    }

    // Set the value if the target field is empty or doesn't exist
    const finalKey = keys[keys.length - 1];
    if (!current[finalKey] || current[finalKey] === "") {
      current[finalKey] = defaultValue;
    }
  }
}

function formatTranslationsObject(obj, indent = 2) {
  const spaces = " ".repeat(indent);
  const lines = [];

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      lines.push(`${spaces}${key}: {`);
      lines.push(formatTranslationsObject(value, indent + 2));
      lines.push(`${spaces}},`);
    } else if (Array.isArray(value)) {
      lines.push(`${spaces}${key}: [`);
      value.forEach((item) => {
        lines.push(`${spaces}  "${item}",`);
      });
      lines.push(`${spaces}],`);
    } else {
      const escapedValue =
        typeof value === "string" ? `"${value.replace(/"/g, '\\"')}"` : value;
      lines.push(`${spaces}${key}: ${escapedValue},`);
    }
  }

  return lines.join("\n");
}

// Get project path from command line arguments
const projectPath = process.argv[2];

if (!projectPath) {
  console.error("❌ Please provide a project path");
  console.log("Usage: node add_default_translations.js <project-path>");
  console.log("Example: node add_default_translations.js villa-lestari-ubud");
  process.exit(1);
}

addDefaultTranslations(projectPath);
