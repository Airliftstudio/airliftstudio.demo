#!/usr/bin/env node

const fs = require("fs");

function extractCreditsContent(bizSectionPath) {
  try {
    const content = fs.readFileSync(bizSectionPath, "utf8");

    // Find the credits section
    const startComment = "<!-- Credits Copy Start -->";
    const endComment = "<!-- Credits Copy End -->";

    const startIndex = content.indexOf(startComment);
    if (startIndex === -1) {
      throw new Error("Credits Start comment not found in biz_section.html");
    }

    // Find the second occurrence of the comment (which acts as the end)
    const endIndex = content.indexOf(endComment);
    if (endIndex === -1) {
      throw new Error(
        "Second Credits Start comment not found in biz_section.html"
      );
    }

    // Extract the content between the comments (including the comments themselves)
    const creditsContent = content.substring(
      startIndex + startComment.length,
      endIndex
    );

    return creditsContent;
  } catch (error) {
    console.error("Error reading biz_section.html:", error.message);
    process.exit(1);
  }
}

function extractBusinessSection(bizSectionPath) {
  try {
    const content = fs.readFileSync(bizSectionPath, "utf8");

    // Find the business section
    const startTag = '<section id="business-offering" class="biz-section">';
    const endTag = "</section>";

    const startIndex = content.indexOf(startTag);
    if (startIndex === -1) {
      throw new Error("Business section not found in biz_section.html");
    }

    const endIndex = content.indexOf(endTag, startIndex) + endTag.length;
    const businessSection = content.substring(startIndex, endIndex);

    return businessSection;
  } catch (error) {
    console.error("Error reading biz_section.html:", error.message);
    process.exit(1);
  }
}

function insertCreditsContent(targetFilePath, creditsContent) {
  try {
    let content = fs.readFileSync(targetFilePath, "utf8");

    // Find the head tag
    const headStartTag = "<head>";
    const headIndex = content.indexOf(headStartTag);
    if (headIndex === -1) {
      throw new Error("Head tag not found in target file");
    }

    // Find the end of the head tag
    const headEndIndex = headIndex + headStartTag.length;

    // Insert the credits content at the beginning of the head section
    const beforeHead = content.substring(0, headEndIndex);
    const afterHead = content.substring(headEndIndex);

    const newContent =
      beforeHead + "\n    " + creditsContent + "\n    " + afterHead;

    // Write the modified content back to the file
    fs.writeFileSync(targetFilePath, newContent, "utf8");

    console.log(
      `✅ Credits content successfully inserted into ${targetFilePath}`
    );
  } catch (error) {
    console.error("Error modifying target file credits:", error.message);
    process.exit(1);
  }
}

function insertBusinessSection(targetFilePath, businessSection) {
  try {
    let content = fs.readFileSync(targetFilePath, "utf8");

    // Find the footer tag
    const footerIndex = content.indexOf("<footer>");
    if (footerIndex === -1) {
      throw new Error("Footer tag not found in target file");
    }

    // Insert the business section before the footer
    const beforeFooter = content.substring(0, footerIndex);
    const afterFooter = content.substring(footerIndex);

    const newContent =
      beforeFooter + "\n\n    " + businessSection + "\n\n    " + afterFooter;

    // Write the modified content back to the file
    fs.writeFileSync(targetFilePath, newContent, "utf8");

    console.log(
      `✅ Business section successfully inserted into ${targetFilePath}`
    );
  } catch (error) {
    console.error("Error modifying target file:", error.message);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log("Usage: node inject_biz.js <target_html_file>");
    console.log("");
    console.log("This script will:");
    console.log("1. Extract the credits content from biz_section.html");
    console.log(
      "2. Insert it at the beginning of the <head> tag in the target HTML file"
    );
    console.log(
      "3. Extract the business offering section from biz_section.html"
    );
    console.log("4. Insert it before the <footer> tag in the target HTML file");
    console.log("");
    console.log("Examples:");
    console.log("  node inject_biz.js villa-lestari-ubud/index.html");
    console.log("  node inject_biz.js villa-zori-bali/index.html");
    console.log("  node inject_biz.js villa-lespoir-bali/index.html");
    process.exit(1);
  }

  const targetFile = args[0];

  // Check if target file exists
  if (!fs.existsSync(targetFile)) {
    console.error(`❌ Target file not found: ${targetFile}`);
    process.exit(1);
  }

  // Check if biz_section.html exists
  const bizSectionPath = "biz_section.html";
  if (!fs.existsSync(bizSectionPath)) {
    console.error(`❌ biz_section.html not found in current directory`);
    process.exit(1);
  }

  console.log(`📖 Extracting credits content from ${bizSectionPath}...`);
  const creditsContent = extractCreditsContent(bizSectionPath);

  console.log(`📝 Inserting credits content into ${targetFile}...`);
  insertCreditsContent(targetFile, creditsContent);

  console.log(`📖 Extracting business section from ${bizSectionPath}...`);
  const businessSection = extractBusinessSection(bizSectionPath);

  console.log(`📝 Inserting business section into ${targetFile}...`);
  insertBusinessSection(targetFile, businessSection);

  console.log(
    "🎉 Done! The credits content and business section have been added."
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  extractCreditsContent,
  extractBusinessSection,
  insertCreditsContent,
  insertBusinessSection,
};
