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

    // Check if credits content already exists
    const creditsStartComment = "<!-- Credits Copy Start -->";
    const creditsEndComment = "<!-- Credits Copy End -->";

    // Also check for the actual credits content pattern
    // Look for the credits block pattern (the long line of box-drawing characters)
    const creditsContentPattern = "Built with ❤️ for the Airbnb community";

    const existingCreditsStart = content.indexOf(creditsStartComment);
    const existingCreditsEnd = content.indexOf(creditsEndComment);
    const existingCreditsPattern = content.indexOf(creditsContentPattern);

    // Remove all existing credits content first
    let cleanedContent = content;
    let removedAny = false;

    // Remove content with comment markers
    if (existingCreditsStart !== -1 && existingCreditsEnd !== -1) {
      console.log(
        `🔄 Removing existing credits content from ${targetFilePath}...`
      );
      const beforeCredits = cleanedContent.substring(0, existingCreditsStart);
      const afterCredits = cleanedContent.substring(
        existingCreditsEnd + creditsEndComment.length
      );
      cleanedContent = beforeCredits + afterCredits.replace(/^\s*\n\s*/, "\n");
      removedAny = true;
    }

    // Remove content without comment markers (fallback)
    if (!removedAny && existingCreditsPattern !== -1) {
      console.log(
        `🔄 Removing existing credits content from ${targetFilePath}...`
      );
      const creditsBlockStart = cleanedContent.lastIndexOf(
        "<!--",
        existingCreditsPattern
      );
      const creditsBlockEnd =
        cleanedContent.indexOf("-->", existingCreditsPattern) + 3;

      if (creditsBlockStart !== -1 && creditsBlockEnd !== -1) {
        const beforeCredits = cleanedContent.substring(0, creditsBlockStart);
        const afterCredits = cleanedContent.substring(creditsBlockEnd);
        cleanedContent =
          beforeCredits + afterCredits.replace(/^\s*\n\s*/, "\n");
      }
    }

    content = cleanedContent;

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

    // Clean up whitespace and ensure proper formatting
    const trimmedAfterHead = afterHead.replace(/^\s*\n\s*/, "\n");
    const newContent =
      beforeHead + "\n    " + creditsContent + "\n    " + trimmedAfterHead;

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

    // Check if business section already exists
    const businessSectionStart =
      '<section id="business-offering" class="biz-section">';
    const businessSectionEnd = "</section>";

    const existingBusinessStart = content.indexOf(businessSectionStart);
    const existingBusinessEnd = content.indexOf(
      businessSectionEnd,
      existingBusinessStart
    );

    if (existingBusinessStart !== -1 && existingBusinessEnd !== -1) {
      console.log(
        `🔄 Removing existing business section from ${targetFilePath}...`
      );
      // Remove existing business section
      const beforeBusiness = content.substring(0, existingBusinessStart);
      const afterBusiness = content.substring(
        existingBusinessEnd + businessSectionEnd.length
      );
      // Clean up whitespace after removal
      content = beforeBusiness + afterBusiness.replace(/^\s*\n\s*/, "\n");
    }

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

function injectReviewsFromJson(targetFilePath) {
  try {
    // Determine the directory of the target file
    const targetDir = targetFilePath.substring(
      0,
      targetFilePath.lastIndexOf("/")
    );
    const listingJsonPath = `${targetDir}/listing.json`;

    // Check if listing.json exists
    if (!fs.existsSync(listingJsonPath)) {
      console.log(
        `⚠️  listing.json not found at ${listingJsonPath}, skipping review injection`
      );
      return;
    }

    console.log(`📖 Reading reviews from ${listingJsonPath}...`);
    const listingData = JSON.parse(fs.readFileSync(listingJsonPath, "utf8"));

    if (!listingData.reviews || !Array.isArray(listingData.reviews)) {
      console.log(
        `⚠️  No reviews found in listing.json, skipping review injection`
      );
      return;
    }

    // Read the target HTML file
    let content = fs.readFileSync(targetFilePath, "utf8");

    // Extract the two featured reviewers to exclude them
    const featuredReviewers = [];
    // Match reviewer names in <h4> tags inside the featured reviews
    const featuredReviewsMatch = [];
    const featuredReviewH4Regex =
      /<div class="review-card">[\s\S]*?<h4>([^<]+)<\/h4>/g;
    let match;
    while ((match = featuredReviewH4Regex.exec(content)) !== null) {
      featuredReviewsMatch.push(match[1]);
    }
    if (featuredReviewsMatch) {
      featuredReviewers.push(
        ...featuredReviewsMatch.map((match) =>
          match.replace('data-reviewer="', "").replace('"', "")
        )
      );
    }

    console.log(
      `📝 Found ${listingData.reviews.length} total reviews, excluding ${featuredReviewers.length} featured reviewers`
    );

    // Filter out reviews that are already featured
    const availableReviews = listingData.reviews.filter(
      (review) => !featuredReviewers.includes(review.reviewer)
    );

    // Take maximum 16 reviews
    const reviewsToAdd = availableReviews.slice(0, 16);

    if (reviewsToAdd.length === 0) {
      console.log(
        `⚠️  No 5-star reviews available after filtering, skipping review injection`
      );
      return;
    }

    console.log(
      `📝 Found ${availableReviews.length} 5-star reviews, adding ${reviewsToAdd.length} reviews`
    );

    // Generate review HTML elements
    const reviewElements = reviewsToAdd
      .map((review) => {
        const firstLetter = review.reviewer.charAt(0).toUpperCase();
        const stars = "★".repeat(review.rating || 5);

        return `                <div class="review-mini" data-reviewer="${review.reviewer}">
                  <div class="review-mini-header">
                    <div class="review-mini-avatar">${firstLetter}</div>
                    <div>
                      <h5>${review.reviewer}</h5>
                      <div class="review-stars">${stars}</div>
                    </div>
                  </div>
                  <p class="review-mini-text">
                    "${review.text}"
                  </p>
                </div>`;
      })
      .join("\n");

    // Find the reviews-scroll-track div
    const scrollTrackStart = '<div id="reviews-scroll-track">';
    const scrollTrackEnd = "</div>";

    const scrollTrackStartIndex = content.indexOf(scrollTrackStart);
    if (scrollTrackStartIndex === -1) {
      console.log(
        `⚠️  reviews-scroll-track div not found, skipping review injection`
      );
      return;
    }

    const scrollTrackEndIndex = content.indexOf(
      scrollTrackEnd,
      scrollTrackStartIndex
    );
    if (scrollTrackEndIndex === -1) {
      console.log(
        `⚠️  reviews-scroll-track div end not found, skipping review injection`
      );
      return;
    }

    // Check if there are already mini reviews in the scroll track
    const existingContent = content.substring(
      scrollTrackStartIndex + scrollTrackStart.length,
      scrollTrackEndIndex
    );
    const hasExistingReviews = existingContent.includes("review-mini");

    if (hasExistingReviews) {
      console.log(
        `🔄 Removing existing mini reviews from reviews-scroll-track...`
      );
      const beforeScrollTrack = content.substring(
        0,
        scrollTrackStartIndex + scrollTrackStart.length
      );
      const afterScrollTrack = content.substring(scrollTrackEndIndex);
      content =
        beforeScrollTrack +
        "\n" +
        reviewElements +
        "\n              " +
        afterScrollTrack;
    } else {
      // Insert new reviews
      const beforeScrollTrack = content.substring(
        0,
        scrollTrackStartIndex + scrollTrackStart.length
      );
      const afterScrollTrack = content.substring(scrollTrackEndIndex);
      content =
        beforeScrollTrack +
        "\n" +
        reviewElements +
        "\n              " +
        afterScrollTrack;
    }

    // Write the modified content back to the file
    fs.writeFileSync(targetFilePath, content, "utf8");

    console.log(
      `✅ Successfully injected ${reviewsToAdd.length} mini reviews into ${targetFilePath}`
    );
  } catch (error) {
    console.error("Error injecting reviews:", error.message);
    // Don't exit process, just log the error and continue
    console.log("Continuing with other operations...");
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

  console.log(`📖 Injecting reviews from listing.json into ${targetFile}...`);
  injectReviewsFromJson(targetFile);

  console.log(
    "🎉 Done! The credits content, business section, and reviews have been added."
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
