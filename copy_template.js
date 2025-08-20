const fs = require("fs");
const path = require("path");

/**
 * Copy Template Script
 * Copies templates/{sourceTemplate} to templates/new_template
 * Excludes language-specific files: index_lang.html, css/lang.css, js/lang.js
 *
 * Usage: node copy_template.js <sourceTemplate>
 * Example: node copy_template.js v1
 */

function showUsage() {
  console.log("📖 Usage: node copy_template.js <sourceTemplate>");
  console.log("📖 Example: node copy_template.js v1");
  console.log("");
  console.log("📋 Available templates:");

  const templatesDir = "templates";
  if (fs.existsSync(templatesDir)) {
    const templates = fs.readdirSync(templatesDir).filter((item) => {
      const itemPath = path.join(templatesDir, item);
      return fs.statSync(itemPath).isDirectory() && !item.startsWith(".");
    });

    if (templates.length > 0) {
      templates.forEach((template) => {
        console.log(`   • ${template}`);
      });
    } else {
      console.log("   No templates found");
    }
  } else {
    console.log("   Templates directory not found");
  }

  console.log("");
  process.exit(1);
}

const sourceTemplate = process.argv[2];
const sourceDir = `templates/${sourceTemplate}`;
const targetDir = "templates/new_template";

// Files to exclude from copying
const excludedFiles = ["index_lang.html", "css/lang.css", "js/lang.js"];

function shouldExcludeFile(sourcePath, targetPath) {
  const relativePath = path.relative(sourceDir, sourcePath);
  return excludedFiles.includes(relativePath);
}

function copyDirectory(source, target) {
  // Create target directory if it doesn't exist
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
    console.log(`✅ Created directory: ${target}`);
  }

  // Read all items in source directory
  const items = fs.readdirSync(source);

  items.forEach((item) => {
    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);

    // Get file stats
    const stats = fs.statSync(sourcePath);

    if (stats.isDirectory()) {
      // Recursively copy directories
      console.log(`📁 Copying directory: ${item}`);
      copyDirectory(sourcePath, targetPath);
    } else {
      // Check if file should be excluded
      if (shouldExcludeFile(sourcePath, targetPath)) {
        console.log(`⏭️  Skipping excluded file: ${item}`);
        return;
      }

      // Copy files
      console.log(`📄 Copying file: ${item}`);
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

function main() {
  // Check if source template parameter is provided
  if (!sourceTemplate) {
    console.log("❌ Error: Source template parameter is required");
    console.log("");
    showUsage();
  }

  console.log("🔄 Starting template copy process...");
  console.log(`📂 Source: ${sourceDir}`);
  console.log(`📂 Target: ${targetDir}`);
  console.log(
    "🚫 Excluding language files: index_lang.html, css/lang.css, js/lang.js"
  );
  console.log("");

  try {
    // Check if source directory exists
    if (!fs.existsSync(sourceDir)) {
      console.log(
        `❌ Error: Source template '${sourceTemplate}' does not exist`
      );
      console.log("");
      showUsage();
    }

    // Check if target directory already exists
    if (fs.existsSync(targetDir)) {
      console.log(`⚠️  Target directory '${targetDir}' already exists`);
      console.log("🗑️  Removing existing directory...");
      fs.rmSync(targetDir, { recursive: true, force: true });
      console.log("✅ Removed existing directory");
    }

    // Copy the template
    copyDirectory(sourceDir, targetDir);

    console.log("");
    console.log("🎉 Template copy completed successfully!");
    console.log(`📁 New template available at: ${targetDir}`);
    console.log(`📋 Copied from: ${sourceTemplate}`);

    // List the copied files
    console.log("");
    console.log("📋 Copied files and directories:");
    const listItems = (dir, prefix = "") => {
      const items = fs.readdirSync(dir);
      items.forEach((item) => {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        const icon = stats.isDirectory() ? "📁" : "📄";
        console.log(`${prefix}${icon} ${item}`);

        if (stats.isDirectory()) {
          listItems(itemPath, prefix + "  ");
        }
      });
    };
    listItems(targetDir);
  } catch (error) {
    console.error("❌ Error copying template:");
    console.error(error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { copyDirectory, main };
