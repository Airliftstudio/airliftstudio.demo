const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const LANGUAGE_DEFINITIONS = require("./language_definitions.js");

const TARGET_DIR = "target";
const TARGET_DIR_LANG = "target_lang";

function getAspect(width, height) {
  if (width > height) return "landscape";
  if (height > width) return "portrait";
  return "square";
}

function updateImwParam(url, value) {
  try {
    const u = new URL(url);
    u.searchParams.set("im_w", value);
    return u.toString();
  } catch (e) {
    // fallback for non-standard URLs
    if (url.includes("im_w=")) {
      return url.replace(/im_w=\d+/, `im_w=${value}`);
    }
    // if no im_w param, just append
    return url + (url.includes("?") ? "&" : "?") + `im_w=${value}`;
  }
}

async function scrape() {
  if (
    !process.argv[2] ||
    !/^https:\/\/www\.airbnb\.com\/rooms\/\d+/.test(process.argv[2])
  ) {
    throw new Error(
      "You must provide an Airbnb URL in the format: https://www.airbnb.com/rooms/123456789"
    );
  }
  const AIRBNB_URL = process.argv[2];
  const LANGUAGES = process.argv[3] ? process.argv[3].split(",") : null;

  // Validate languages if provided
  if (LANGUAGES) {
    const availableLanguages = Object.keys(LANGUAGE_DEFINITIONS);
    const invalidLanguages = LANGUAGES.filter(
      (lang) => !availableLanguages.includes(lang)
    );

    if (invalidLanguages.length > 0) {
      console.error(
        `Error: Invalid language codes provided: ${invalidLanguages.join(", ")}`
      );
      console.error(`Available languages: ${availableLanguages.join(", ")}`);
      process.exit(1);
    }

    console.log(`Validated languages: ${LANGUAGES.join(", ")}`);
  }

  function getListingId(url) {
    const match = url.match(/\/rooms\/(\d+)/);
    return match ? match[1] : "listing";
  }

  const listingId = getListingId(AIRBNB_URL);

  console.log("Launching browser...");
  const runWithoutOpeningBrowser = true;

  const browser = await chromium.launch({ headless: runWithoutOpeningBrowser });
  const page = await browser.newPage();
  console.log("Navigating to Airbnb listing...");
  await page.goto(AIRBNB_URL, { waitUntil: "domcontentloaded" });

  // Wait for main content
  console.log("Waiting for main content to load...");
  await page.waitForSelector("h1");

  // Close popup dialog if present by clicking the top right corner
  console.log("Checking for 'Translation on' modal...");
  let modalFound = false;
  try {
    await page.waitForSelector('h1:text("Translation on")', {
      timeout: 10000,
    });
    modalFound = true;
    console.log(
      "'Translation on' modal found. Clicking top right corner to close it..."
    );
    const viewport = page.viewportSize() || { width: 1200, height: 800 };
    const x = Math.floor(viewport.width * 0.99);
    const y = Math.floor(viewport.height * 0.01);
    await page.mouse.click(x, y).catch(() => {});
  } catch (e) {
    console.log("'Translation on' modal not found, continuing...");
  }

  // --- Basic Info ---
  console.log("Extracting basic info...");
  const title = await page.textContent("h1");

  // Extract the summary as HTML, then convert <br> to \n and strip other tags
  const summaryHtml = await page.$eval(
    '[data-section-id="DESCRIPTION_DEFAULT"] h2, [data-section-id="DESCRIPTION_DEFAULT"] span',
    (el) => el.innerHTML
  );
  // Replace <br> and <br/> with \n, then strip other HTML tags
  const summary = summaryHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim();

  const overviewSection = await page.$('[data-section-id^="OVERVIEW_DEFAULT"]');
  let capacityText = "";
  if (overviewSection) {
    // Get the first row (property type/location)
    const row1 = await overviewSection.$eval("h2", (el) =>
      el.textContent.trim()
    );
    // Get the second row (capacity details)
    const row2 = await overviewSection.$$eval("ol li", (els) =>
      els.map((li) => li.textContent.trim()).join(" ")
    );
    capacityText = `${row1}\n${row2}`;
  } else {
    capacityText = "N/A";
  }

  console.log(`Title: ${title}`);
  console.log(`Summary: ${summary}`);
  console.log(`Capacity: ${capacityText}`);

  // --- Host Info ---
  console.log("Extracting host info...");
  const hostSection = await page.$('[data-section-id="HOST_OVERVIEW_DEFAULT"]');
  let isSuperhost = false;
  if (hostSection) {
    const hostHtml = await hostSection.innerHTML();
    isSuperhost = hostHtml.includes("Superhost");
  }

  const guestFavoriteSection = await page.$(
    'div[data-section-id="GUEST_FAVORITE_BANNER"]'
  );
  let isGuestFavorite = !!guestFavoriteSection;

  console.log(`Superhost: ${isSuperhost}`);

  // --- Listing Highlights ---
  console.log("Extracting listing highlights...");
  const highlightsSection = await page.$(
    '[data-section-id="HIGHLIGHTS_DEFAULT"]'
  );
  let highlights = [];
  if (highlightsSection) {
    highlights = await highlightsSection.$$eval("div._wlu9uw", (divs) =>
      divs.map((div) => {
        const title = div.querySelector("h3")?.innerText?.trim() || "";
        const description =
          div.querySelector("div._1hwkgn6")?.innerText?.trim() || "";
        return { title, description };
      })
    );
  }
  console.log("Highlights:", highlights);

  // // --- Location TODO denna fungerar inte riktigt... ---
  // console.log("Extracting location...");
  // const locationSection = await page.$('[data-section-id="LOCATION_DEFAULT"]');
  // let fullLocation = "";
  // if (locationSection) {
  //   console.log("Location section found");
  //   fullLocation = await locationSection.$eval("section", (el) => {
  //     // Get all text content, excluding the "Where you'll be" heading
  //     const heading = el.querySelector("h2");
  //     const allText = el.innerText.trim();
  //     if (heading) {
  //       return allText.replace(heading.innerText.trim(), "").trim();
  //     }
  //     return allText;
  //   });
  // }
  // console.log("Full location:", fullLocation);

  // Hero images
  const heroImages = await page.evaluate(() => {
    function removeImwParam(url) {
      try {
        const u = new URL(url);
        u.searchParams.delete("im_w");
        return u.toString();
      } catch (e) {
        // fallback for non-standard URLs
        return url
          .replace(/([&?])im_w=\d+(&)?/, (match, p1, p2) => {
            if (p1 === "?" && !p2) return "";
            if (p2) return p1;
            return "";
          })
          .replace(/[?&]$/, "");
      }
    }
    return Array.from(document.querySelectorAll("picture img")).map((img) => {
      const button = img.closest("button");
      let alt = img.getAttribute("alt") || "";
      if (!alt && button) alt = button.getAttribute("aria-label") || "";
      let width = img.width || img.naturalWidth || img.getAttribute("width");
      let height =
        img.height || img.naturalHeight || img.getAttribute("height");
      let src = removeImwParam(img.src);
      const isHero = img.id === "FMP-target";
      return { src, alt, width, height, isHero, mustUse: true };
    });
  });
  console.log(heroImages);

  // --- Amenities ---
  console.log("Extracting amenities...");
  await page
    .click("text=/Show all \\d+ amenities/", { timeout: 5000 })
    .catch(() => {});
  await page.waitForSelector('section h1:text("What this place offers")', {
    timeout: 5000,
  });
  const amenitiesModalText = await page.$eval(
    'section:has(h1:text("What this place offers"))',
    (el) => el.innerText
  );
  console.log("Amenities modal text:\n", amenitiesModalText);
  const amenitiesStructured = await page.$$eval(
    'section:has(h1:text("What this place offers")) > section > div',
    (divs) =>
      divs.map((div) => {
        const category = div.querySelector("h2")?.innerText || "";
        const items = Array.from(div.querySelectorAll("ul li")).map((li) =>
          li.innerText.trim()
        );
        return { category, items };
      })
  );
  console.log("Amenities structured:", amenitiesStructured);

  // --- Reviews ---
  console.log("Navigating to reviews page...");
  // Vi kan inte lita på att det finns en "Show all x reviews" för om det finns för få så visas inte knappen men länken här fungerar iaf.
  await page.goto(AIRBNB_URL + "/reviews", { waitUntil: "domcontentloaded" });
  console.log("Waiting for reviews modal to be visible...");
  await page.waitForSelector("div[data-review-id]", {
    state: "visible",
    timeout: 20000,
  });
  console.log("Extracting reviews...");

  const reviews = await page.$$eval("div[data-review-id]", (divs) =>
    divs.map((div) => {
      // Reviewer name
      let name = "";
      const nameH2 = div.querySelector('div[id^="review_"][id$="_title"] h2');
      if (nameH2) name = nameH2.innerText.trim();

      // Rating
      let rating = "";
      const ratingSpan = Array.from(div.querySelectorAll("span")).find(
        (span) => span.innerText && span.innerText.startsWith("Rating,")
      );
      if (ratingSpan) {
        const match = ratingSpan.innerText.match(/Rating, (\d+) stars/);
        if (match) rating = match[1];
      }

      // Review text (exclude host replies)
      let reviewText = "";
      const reviewDiv = Array.from(
        div.querySelectorAll('div[style*="line-height: 1.25rem"] span span')
      ).find((span) => span.innerText && span.innerText.length > 20);
      if (reviewDiv) reviewText = reviewDiv.innerText.trim();

      return { name, rating, reviewText };
    })
  );
  console.log(reviews);

  // After waiting for the reviews modal to be visible

  const overallRatingText = await page
    .$eval(
      "div[data-review-id] ~ h1 span, h1 span", // fallback selector for the span
      (el) => el.innerText
    )
    .catch(() => null);

  console.log("Overall rating text:", overallRatingText);

  let overallRating = null;
  if (overallRatingText) {
    // Match both "Rated 4.94 out of 5 stars" and "Rated 4.94 out of 5 from 47 reviews"
    const match = overallRatingText.match(
      /Rated ([0-9.]+) out of 5(?: stars| from \d+ reviews)?/
    );
    if (match) {
      overallRating = parseFloat(match[1]);
    }
  }
  console.log("Overall rating:", overallRating);

  // --- Images ---

  console.log("Navigating to photo tour for images...");
  // Go to photo tour
  await page.goto(AIRBNB_URL + "?modal=PHOTO_TOUR_SCROLLABLE", {
    waitUntil: "domcontentloaded",
  });

  await page.waitForSelector(
    'div[data-plugin-in-point-id="PHOTO_TOUR_SCROLLABLE_MODAL"][data-section-id="PHOTO_TOUR_SCROLLABLE_MODAL"] img',
    { visible: true, timeout: 10000 }
  );
  console.log("Extracting image URLs...");

  let prevImgCount = 0;
  let attempts = 0;
  // Scroll to the bottom of the page to trigger lazy loading of all images
  while (attempts < 20) {
    const imgHandles = await page.$$("img");
    if (imgHandles.length === 0) break;
    if (imgHandles.length === prevImgCount) break; // No new images loaded
    prevImgCount = imgHandles.length;
    const lastImgHandle = imgHandles[imgHandles.length - 1];
    await lastImgHandle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
  }

  // Extract images from the gallery, including category if present
  const images = await page.evaluate(() => {
    function removeImwParam(url) {
      try {
        const u = new URL(url);
        u.searchParams.delete("im_w");
        return u.toString();
      } catch (e) {
        // fallback for non-standard URLs
        return url
          .replace(/([&?])im_w=\d+(&)?/, (match, p1, p2) => {
            if (p1 === "?" && !p2) return "";
            if (p2) return p1;
            return "";
          })
          .replace(/[?&]$/, "");
      }
    }
    // Helper to get width/height
    function getImgSize(img) {
      return {
        width: img.width || img.naturalWidth || img.getAttribute("width") || "",
        height:
          img.height || img.naturalHeight || img.getAttribute("height") || "",
      };
    }

    // Find all category sections in the gallery
    const sections = Array.from(
      document.querySelectorAll('div[data-testid="photo-viewer-section"]')
    );
    let allImages = [];
    if (sections.length > 0) {
      // Gallery with categories
      sections.forEach((section) => {
        const category = section.querySelector("h2")?.innerText?.trim() || "";
        const imgs = Array.from(section.querySelectorAll("img")).map((img) => {
          const button = img.closest("button");
          let alt = img.getAttribute("alt") || "";
          if (!alt && button) alt = button.getAttribute("aria-label") || "";
          const { width, height } = getImgSize(img);
          const src = removeImwParam(img.src);
          return {
            src,
            alt,
            width,
            height,
            category,
            isHero: false,
            mustUse: false,
          };
        });

        allImages.push(...imgs);
      });
    } else {
      // Fallback: no categories, just get all images
      allImages = Array.from(document.querySelectorAll("picture img")).map(
        (img) => {
          const button = img.closest("button");
          let alt = img.getAttribute("alt") || "";
          if (!alt && button) alt = button.getAttribute("aria-label") || "";
          const { width, height } = getImgSize(img);
          const src = removeImwParam(img.src);
          return {
            src,
            alt,
            width,
            height,
            category: "",
            isHero: false,
            mustUse: false,
          };
        }
      );
    }
    return allImages;
  });
  console.log("Extracted images: ", images.length);

  // Combine heroImages and images (allImages), ensuring uniqueness by src
  // Exclude the last image from images (allImages)
  const imagesExclLast = images.slice(0, -1);

  // Create a map of hero images by URL for quick lookup
  const heroImageMap = new Map();
  heroImages.forEach((heroImg) => {
    heroImageMap.set(heroImg.src, heroImg);
  });

  // Process imagesExclLast and update hero properties if they match hero images
  const uniqueImages = imagesExclLast.map((img) => {
    const heroMatch = heroImageMap.get(img.src);
    // This image matches a hero image, update its properties
    return {
      ...img,
      src: updateImwParam(
        img.src,
        !!heroMatch && heroMatch.isHero ? "1920" : "720"
      ),
      isHero: !!heroMatch && heroMatch.isHero,
      mustUse: !!heroMatch && heroMatch.mustUse,
    };
  });

  console.log(uniqueImages);

  // --- Markdown Output ---
  console.log("Writing data to LISTING.md...");
  let md = `# Airbnb Listing Data\n\n`;
  md += `**ID:** ${listingId}\n`;
  md += `**URL:** ${AIRBNB_URL}\n`;
  md += `**Title:** ${title}\n`;
  md += `**Summary:** ${summary}\n`;
  // md += `**Location:** ${fullLocation}\n`;
  md += `**Capacity:** ${capacityText}\n`;
  md += `**badge-superhost:** ${isSuperhost}\n`;
  md += `**badge-guest-favorite:** ${isGuestFavorite}\n`;
  md += `**Overall rating:** ${overallRating}\n`;
  md += `\n## Highlights\n`;
  for (const highlight of highlights) {
    md += `### ${highlight.title}\n`;
    md += `${highlight.description}\n\n`;
  }
  md += `## Amenities\n`;
  for (const category of amenitiesStructured) {
    if (
      category.category &&
      category.category.trim().toLowerCase() === "not included"
    ) {
      continue; // Skip this category
    }
    if (category.category) {
      md += `### ${category.category}\n`;
    }
    for (const item of category.items) {
      md += `- ${item}\n`;
    }
    md += `\n`;
  }
  md += `\n## Images\n`;
  uniqueImages.forEach((img, idx) => {
    md += `### Image ${idx + 1}\n`;
    md += `   Src: ${img.src}\n`;
    md += `   Alt: ${img.alt}\n`;
    md += `   Width: ${img.width}\n`;
    md += `   Height: ${img.height}\n`;
    md += `   Aspect: ${getAspect(img.width, img.height)}\n`;
    md += `   Category: ${img.category || ""}\n`;
    md += `   isHero: ${img.isHero}\n`;
    md += `   mustUse: ${img.mustUse}\n\n`;
  });
  md += `\n## Reviews\n`;
  const fiveStarReviews = reviews.filter((r) => r.rating == 5).slice(0, 18);
  for (const r of fiveStarReviews) {
    md += `- **${r.name}**: ${r.rating} stars\n ${r.reviewText}\n\n`;
  }

  const destDir = path.resolve(listingId);
  if (!fs.existsSync(destDir)) {
    // Create the destination directory
    fs.mkdirSync(destDir, { recursive: true });

    // Copy all files from target directory
    function copyDir(src, dest) {
      const entries = fs.readdirSync(src, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true });
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    copyDir(LANGUAGES ? TARGET_DIR_LANG : TARGET_DIR, destDir);
    console.log(`Copied 'target' folder to '${destDir}'`);
  } else {
    console.log(`Folder '${destDir}' already exists, not copying.`);
  }

  // Write LISTING.md to the new folder
  const imagesDir = path.join(destDir, "images");
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  const listingMdPath = path.join(destDir, "LISTING.md");
  fs.writeFileSync(listingMdPath, md, "utf8");
  console.log(`Scraping complete! Data saved to ${listingMdPath}`);

  // --- Generate JSON file ---
  console.log("Generating structured JSON file...");

  // Extract capacity details
  const capacityMatch = capacityText.match(
    /(\d+)\s+guests?.*?(\d+)\s+bedrooms?.*?(\d+)\s+beds?.*?(\d+)\s+baths?/i
  );
  const capacity = capacityMatch
    ? {
        guests: parseInt(capacityMatch[1]),
        bedrooms: parseInt(capacityMatch[2]),
        beds: parseInt(capacityMatch[3]),
        baths: parseInt(capacityMatch[4]),
      }
    : null;

  // Extract amenities as a flat list
  const allAmenities = [];
  amenitiesStructured.forEach((category) => {
    if (
      category.category &&
      category.category.trim().toLowerCase() !== "not included"
    ) {
      category.items.forEach((item) => {
        allAmenities.push(item.trim());
      });
    }
  });

  // Extract badges
  const badges = [];
  if (isSuperhost) badges.push("superhost");
  if (isGuestFavorite) badges.push("guest_favorite");

  // Process reviews for JSON
  const processedReviews = reviews.map((review) => ({
    reviewer: review.name,
    rating: parseInt(review.rating) || 0,
    text: review.reviewText,
  }));

  // Process images for JSON
  const processedImages = uniqueImages.map((img) => ({
    src: img.src,
    alt: img.alt,
    width: parseInt(img.width) || 0,
    height: parseInt(img.height) || 0,
    aspect: getAspect(img.width, img.height),
    category: img.category || "",
    isHero: img.isHero,
    mustUse: img.mustUse,
  }));

  // Create structured JSON object
  const jsonData = {
    id: listingId,
    url: AIRBNB_URL,
    title: title,
    summary: summary,
    capacity: capacity,
    amenities: allAmenities,
    badges: badges,
    rating: overallRating,
    reviews: processedReviews,
    images: processedImages,
    highlights: highlights,
    scraped_at: new Date().toISOString(),
  };

  // Write JSON file
  const jsonPath = path.join(destDir, "listing.json");
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), "utf8");
  console.log(`JSON data saved to ${jsonPath}`);

  // --- Modify index.html based on listing.json data ---
  console.log("Modifying index.html based on listing data...");

  const indexHtmlPath = path.join(destDir, "index.html");
  if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, "utf8");

    // 1. Update the rating value
    const ratingElement = htmlContent.match(
      /<span[^>]*id="airbnb-rating-value"[^>]*>([^<]*)<\/span>/
    );
    if (ratingElement) {
      htmlContent = htmlContent.replace(
        /<span[^>]*id="airbnb-rating-value"[^>]*>([^<]*)<\/span>/,
        `<span id="airbnb-rating-value">${overallRating}</span>`
      );
      console.log(`✅ Updated rating to ${overallRating}`);
    }

    // 2. Comment out badge elements based on badges array
    const hasSuperhost = badges.includes("superhost");
    const hasGuestFavorite = badges.includes("guest_favorite");

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

  await browser.close();
}

scrape();

//TODO test subjects::: Huge amount of images/categories: https://www.airbnb.com/rooms/25463566
//TODO har bara en hero image: https://www.airbnb.com/rooms/1406839906440286492 och 6 reviews (så ingen knapp för se alla reviews..)
//TODO saknar categorier i image gallery: https://www.airbnb.com/rooms/813012425246439180
