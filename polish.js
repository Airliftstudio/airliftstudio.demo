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

    // Remove redirects from root _redirects file
    removeRedirectsFromRoot(projectPath);

    // Remove business-offering section from index.html
    removeBusinessOfferingSection(indexPath);

    console.log("✅ Polish complete!");
    console.log(`📁 Updated: ${headersPath}`);
    console.log("🔍 Added SEO headers: X-Robots-Tag: index, follow");
    console.log(
      "⚡ Added performance headers: preload for hero image, CSS, and JS"
    );
    console.log("🔄 Removed redirects from root _redirects file");
    console.log("💼 Removed business-offering section from index.html");
  } catch (error) {
    console.error("❌ Error polishing project:", error.message);
    process.exit(1);
  }
}

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

// Get project path from command line arguments
const projectPath = process.argv[2];

if (!projectPath) {
  console.error("❌ Error: Project path is required");
  console.log("Usage: node polish.js <project-path>");
  console.log("Example: node polish.js demo/test");
  process.exit(1);
}

polishProject(projectPath);
