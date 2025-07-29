const { execSync } = require("child_process");
const path = require("path");

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
    console.log("  add-defaults - Add default values after AI translation");
    console.log("");
    console.log("Examples:");
    console.log(
      "  node translation_workflow.js generate villa-lestari-ubud fr,sv,de"
    );
    console.log(
      "  node translation_workflow.js add-defaults villa-lestari-ubud"
    );
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
      case "add-defaults":
        console.log("🔄 Running add_default_translations.js...");
        execSync(`node add_default_translations.js ${projectPath}`, {
          stdio: "inherit",
        });
        break;
      default:
        console.error('❌ Invalid step. Use "generate" or "add-defaults"');
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
