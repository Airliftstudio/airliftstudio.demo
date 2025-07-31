const fs = require("fs");
const path = require("path");

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

Link: </images/hero-bg.jpg>; rel=preload; as=image
Link: </css/styles.css>; rel=preload; as=style, </js/script.js>; rel=preload; as=script
`;

    // Write the _headers file
    const headersPath = path.join(fullProjectPath, "_headers");
    fs.writeFileSync(headersPath, headersContent, "utf8");

    console.log("✅ Polish complete!");
    console.log(`📁 Updated: ${headersPath}`);
    console.log("🔍 Added SEO headers: X-Robots-Tag: index, follow");
    console.log(
      "⚡ Added performance headers: preload for hero image, CSS, and JS"
    );
  } catch (error) {
    console.error("❌ Error polishing project:", error.message);
    process.exit(1);
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
