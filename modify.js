const fs = require("fs");
const path = require("path");

function getListingId(url) {
  const match = url.match(/\/rooms\/(\d+)/);
  return match ? match[1] : "listing";
}

async function modify() {
  if (
    !process.argv[2] ||
    !/^https:\/\/www\.airbnb\.com\/rooms\/\d+/.test(process.argv[2])
  ) {
    throw new Error(
      "You must provide an Airbnb URL in the format: https://www.airbnb.com/rooms/123456789"
    );
  }

  const AIRBNB_URL = process.argv[2];
  const listingId = getListingId(AIRBNB_URL);
  const destDir = path.resolve("demo", listingId);

  // Check if project directory exists
  if (!fs.existsSync(destDir)) {
    console.error(
      `Error: Project directory '${destDir}' does not exist. Run setup first.`
    );
    process.exit(1);
  }

  // Check if listing.json exists
  const jsonPath = path.join(destDir, "listing.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(
      `Error: listing.json not found at ${jsonPath}. Run scrape first.`
    );
    process.exit(1);
  }

  // Read listing.json
  console.log("Reading listing.json...");
  const listingData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  // --- Modify index.html based on listing.json data ---
  console.log("Modifying index.html based on listing data...");

  const indexHtmlPath = path.join(destDir, "index.html");
  if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, "utf8");

    // 1. Update the rating value
    const ratingElement = htmlContent.match(
      /<span[^>]*id="airbnb-rating-value"[^>]*>([^<]*)<\/span>/
    );
    if (ratingElement && listingData.rating) {
      htmlContent = htmlContent.replace(
        /<span[^>]*id="airbnb-rating-value"[^>]*>([^<]*)<\/span>/,
        `<span id="airbnb-rating-value">${listingData.rating}</span>`
      );
      console.log(`✅ Updated rating to ${listingData.rating}`);
    }

    // 2. Comment out badge elements based on badges array
    const hasSuperhost = listingData.badges.includes("superhost");
    const hasGuestFavorite = listingData.badges.includes("guest_favorite");

    // Handle superhost badge
    const superhostBadge = htmlContent.match(
      /<div[^>]*class="[^"]*badge-superhost[^"]*"[^>]*>[\s\S]*?<\/div>/
    );
    if (superhostBadge && !hasSuperhost) {
      htmlContent = htmlContent.replace(
        /(<div[^>]*class="[^"]*badge-superhost[^"]*"[^>]*>[\s\S]*?<\/div>)/,
        `<!-- $1 -->`
      );
      console.log(`✅ Commented out superhost badge (not found in badges)`);
    }

    // Handle guest favorite badge
    const guestFavoriteBadge = htmlContent.match(
      /<div[^>]*class="[^"]*badge-guest-favorite[^"]*"[^>]*>[\s\S]*?<\/div>/
    );
    if (guestFavoriteBadge && !hasGuestFavorite) {
      htmlContent = htmlContent.replace(
        /(<div[^>]*class="[^"]*badge-guest-favorite[^"]*"[^>]*>[\s\S]*?<\/div>)/,
        `<!-- $1 -->`
      );
      console.log(
        `✅ Commented out guest favorite badge (not found in badges)`
      );
    }

    // Update all Airbnb links to use the correct listing ID
    // Replace any occurrence of the old Airbnb room URL with the new one
    // Match all Airbnb room links (with or without trailing slash, with or without /reviews etc)
    // Match any Airbnb room URL with optional trailing path segments (e.g., /reviews, /calendar, etc.)
    const airbnbUrlFlexibleRegex =
      /https:\/\/www\.airbnb\.com\/rooms\/\d+(\/[a-zA-Z0-9_-]+)?\/?/g;
    htmlContent = htmlContent.replace(airbnbUrlFlexibleRegex, (match) => {
      // Extract any trailing path after the room ID (e.g., /reviews, /calendar)
      const trailingPathMatch = match.match(/\/rooms\/\d+(\/[a-zA-Z0-9_-]+)?/);
      let trailingPath = "";
      if (trailingPathMatch && trailingPathMatch[1]) {
        trailingPath = trailingPathMatch[1];
      }
      // Always add trailing slash for base URL, but not for extra path
      if (trailingPath) {
        return `https://www.airbnb.com/rooms/${listingId}${trailingPath}`;
      } else {
        return `https://www.airbnb.com/rooms/${listingId}/`;
      }
    });
    console.log(`✅ Updated all Airbnb links to use ID ${listingId}`);

    // Write the modified HTML back to the file
    fs.writeFileSync(indexHtmlPath, htmlContent, "utf8");
    console.log(`✅ Successfully modified ${indexHtmlPath}`);
  } else {
    console.log(
      `⚠️  index.html not found at ${indexHtmlPath}, skipping modifications`
    );
  }

  console.log(`✅ Modification complete!`);
}

modify().catch(console.error);
