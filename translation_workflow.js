const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const { updateLanguageDropdown } = require("./modify.js");

function getExistingLanguages(projectPath) {
  const jsPath = path.join(projectPath, "js");

  if (!fs.existsSync(jsPath)) {
    return [];
  }

  // Get all translation files
  const translationFiles = fs
    .readdirSync(jsPath)
    .filter((file) => file.startsWith("translations_") && file.endsWith(".js"))
    .map((file) => file.replace("translations_", "").replace(".js", ""));

  return translationFiles;
}

function main() {
  const step = process.argv[2];
  const projectPath = process.argv[3];
  const languageCodes = process.argv[4] ? process.argv[4].split(",") : ["en"];

  if (!step || !projectPath) {
    console.error("❌ Please provide step and project path");
    console.log(
      "Usage: node translation_workflow.js <step> <project-path> [language-codes]"
    );
    console.log("");
    console.log("Steps:");
    console.log(
      "  generate  - Generate optimized translations (excludes default values)"
    );
    console.log("  add       - Add new languages to existing translations");
    console.log("  clean - Add default values after AI translation");
    console.log("");
    console.log("Examples:");
    console.log(
      "  node translation_workflow.js generate villa-lestari-ubud fr,sv,de"
    );
    console.log("  node translation_workflow.js add villa-lestari-ubud de");
    console.log("  node translation_workflow.js clean villa-lestari-ubud");
    process.exit(1);
  }

  try {
    switch (step) {
      case "generate":
        console.log("🔄 Running generate_translations.js...");
        execSync(
          `node generate_translations.js ${projectPath} ${languageCodes.join(
            ","
          )}`,
          { stdio: "inherit" }
        );
        break;
      case "add":
        console.log("🔄 Adding new languages to existing translations...");
        const existingLanguages = getExistingLanguages(projectPath);
        const allLanguages = [
          ...new Set([...existingLanguages, ...languageCodes]),
        ];

        console.log(
          `📁 Found existing languages: ${existingLanguages.join(", ")}`
        );
        console.log(`➕ Adding new languages: ${languageCodes.join(", ")}`);
        console.log(`🌍 All languages: ${allLanguages.join(", ")}`);

        execSync(
          `node generate_translations.js ${projectPath} ${allLanguages.join(
            ","
          )}`,
          { stdio: "inherit" }
        );

        execSync(`node add_default_translations.js ${projectPath}`, {
          stdio: "inherit",
        });
        const indexHtmlPath = path.join(projectPath, "index.html");
        let htmlContent = fs.readFileSync(indexHtmlPath, "utf8");
        htmlContent = updateLanguageDropdown(htmlContent, allLanguages);
        fs.writeFileSync(indexHtmlPath, htmlContent, "utf8");

        // After adding new languages, print a prompt for the user to generate translations
        if (languageCodes.length > 0) {
          const promptLangs = languageCodes.join(", ");
          const langFiles = languageCodes
            .map((lang) => `js/translations_${lang}.js`)
            .join(",");
          console.log("\n─────────────────────────────────────────────");
          console.log(
            "📝 To generate translations for the new languages, use this prompt:"
          );
          console.log(
            `\nRead the default english translation in ${projectPath}/js/translations_en.js and generate the missing translations for these language files ${langFiles}.\n`
          );
          console.log("─────────────────────────────────────────────\n");
        }
        break;
      case "clean":
        console.log("🔄 Running add_default_translations.js...");
        execSync(`node add_default_translations.js ${projectPath}`, {
          stdio: "inherit",
        });
        break;
      case "all":
        console.log("🔄 Running generate_translations.js...");
        execSync(
          `node generate_translations.js ${projectPath} ${languageCodes.join(
            ","
          )}`,
          { stdio: "inherit" }
        );
        console.log("🔄 Running add_default_translations.js...");
        execSync(`node add_default_translations.js ${projectPath}`, {
          stdio: "inherit",
        });
        break;
      default:
        console.error('❌ Invalid step. Use "generate", "add", or "clean"');
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error executing script:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
