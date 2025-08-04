const fs = require("fs");
const path = require("path");

function addDefaultTranslations(projectPath) {
  const jsPath = path.join(projectPath, "js");

  if (!fs.existsSync(jsPath)) {
    console.error("❌ JS directory not found:", jsPath);
    return;
  }

  // Get all translation files
  const translationFiles = fs
    .readdirSync(jsPath)
    .filter((file) => file.startsWith("translations_") && file.endsWith(".js"));

  if (translationFiles.length === 0) {
    console.error("❌ No translation files found in:", jsPath);
    return;
  }

  console.log(`📁 Found ${translationFiles.length} translation files`);

  try {
    // Process each translation file
    for (const fileName of translationFiles) {
      const filePath = path.join(jsPath, fileName);
      const langCode = fileName.replace("translations_", "").replace(".js", "");

      console.log(`🔄 Processing: ${fileName} (${langCode})`);

      // Read the current translation file
      const fileContent = fs.readFileSync(filePath, "utf8");

      // Extract the translations object
      const translationsMatch = fileContent.match(
        new RegExp(`window\\.translations_${langCode}\\s*=\\s*([\\s\\S]*?);`)
      );

      if (!translationsMatch) {
        console.error(`❌ Could not find translations object in ${fileName}`);
        continue;
      }

      // Parse the translations object using a safer approach
      let translationsStr = translationsMatch[1];
      // Fix common syntax issues
      translationsStr = translationsStr.replace(/,\s*};$/, "};");
      translationsStr = translationsStr.replace(/,\s*,\s*};$/, "};");

      // Use a more robust parsing approach
      let translations;

      // Try using eval with proper error handling (safest for this use case)
      try {
        translations = eval(`(${translationsStr})`);
      } catch (evalError) {
        console.error(`❌ Failed to parse ${fileName}:`, evalError.message);
        console.error(
          `❌ Problematic content:`,
          translationsStr.substring(0, 200) + "..."
        );
        translations = {};
      }

      // Add default values for this language
      const SUPPORTED_LANGUAGES = require("./supported_languages.js");
      const langDefaults = SUPPORTED_LANGUAGES[langCode]?.defaults || {};

      // Dynamically apply all default values
      applyDefaultsToObject(translations, langDefaults);

      // Convert back to string
      const updatedTranslationsStr = formatTranslationsObject(translations);
      const updatedContent = fileContent.replace(
        new RegExp(`window\\.translations_${langCode}\\s*=\\s*{[\\s\\S]*};`),
        `window.translations_${langCode} = {\n${updatedTranslationsStr}\n};`
      );

      // Write back to file
      fs.writeFileSync(filePath, updatedContent);

      console.log(`✅ Updated: ${fileName}`);
    }
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
    // if (!current[finalKey] || current[finalKey] === "") {
    current[finalKey] = defaultValue;
    // }
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
