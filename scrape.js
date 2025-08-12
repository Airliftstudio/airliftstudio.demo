const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

// List of amenities to exclude from saving to listing.json
//TODO kanske lägg till att exludera alla amenities som är för långa eller innehåller parantes eller radbryt?
//TODO updatera den här löpande...
const EXCLUDED_AMENITIES = [
  "Fire extinguisher",
  "Hot water",
  "Shampoo",
  "Conditioner",
  "Body soap",
  "Bidet",
  "Shower gel",
  "Hair dryer",
  "Cleaning products",
  "Hangers",
  "Bed linens",
  "Extra pillows and blankets",
  "Room-darkening shades",
  "Drying rack for clothing",
  "Clothing storage",
  "Hot water kettle",
  "Trash compactor",
  "Dinning table",
  "Single level home",
  "Wine glasses,",
  "Gas stove",
  "Refrigerator",
  "Dishes and silverware",
  "Freezer",
  "Rice maker",
  "Drying rack for clothing",
  "Clothing storage: closet",
  "Stainless steel gas stove",
  "Toaster",
  "Coffee maker",
  "Coffee machine",
  "Coffee",
  "Tea",
  "Building staff",
  "Carbon monoxide alarm",
  "Smoke alarm",
  "Iron",
  "Ironing board",
  "Essentials",
  "Stove",
  "Blender",
  "Conditioner",
  "Hot water kettle",
  "Mini fridge",
  "First aid kit",
  "Clothing storage: wardrobe",
  "Smoking allowed",
  "Private patio or balcony",
];

// Function to clean up amenities by keeping only the first line
function cleanAmenity(amenity) {
  // Split by newlines and take only the first line
  const lines = amenity.split("\n");
  return lines[0].trim();
}

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

function getListingId(url) {
  const match = url.match(/\/rooms\/(\d+)/);
  return match ? match[1] : "listing";
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
  const listingId = getListingId(AIRBNB_URL);
  const destDir = path.resolve("demo", listingId);

  // Check if project directory exists
  if (!fs.existsSync(destDir)) {
    console.error(
      `Error: Project directory '${destDir}' does not exist. Run setup first.`
    );
    process.exit(1);
  }

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

  let summaryHtml;
  try {
    summaryHtml = await page.$eval(
      '[data-section-id="DESCRIPTION_DEFAULT"] h2, [data-section-id="DESCRIPTION_DEFAULT"] span',
      (el) => el.innerHTML
    );
  } catch (e) {
    // If selector not found, try backup modal page
    const backupUrl = `https://www.airbnb.com/rooms/${listingId}/?modal=DESCRIPTION`;
    console.log(
      "Summary selector not found, navigating to backup modal page..."
    );
    await page.goto(backupUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(
      '[data-section-id="DESCRIPTION_DEFAULT"] h2, [data-section-id="DESCRIPTION_DEFAULT"] span',
      { timeout: 15000 }
    );
    summaryHtml = await page.$eval(
      '[data-section-id="DESCRIPTION_DEFAULT"] h2, [data-section-id="DESCRIPTION_DEFAULT"] span',
      (el) => el.innerHTML
    );
    // After getting the summaryHtml, close the modal by clicking the top left corner of the page
    const viewport = page.viewportSize() || { width: 1200, height: 800 };
    const x = Math.floor(viewport.width * 0.01);
    const y = Math.floor(viewport.height * 0.01);
    await page.mouse.click(x, y).catch(() => {});
  }
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

  // --- Reviews ---
  await page.goto(AIRBNB_URL + "/reviews", { waitUntil: "domcontentloaded" });
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
      //TODO att kolla på line-height: 1.25rem är lite knasigt..
      const reviewDiv = Array.from(
        div.querySelectorAll('div[style*="line-height: 1.25rem"] span span')
      ).find((span) => span.innerText && span.innerText.length > 20);
      if (reviewDiv) reviewText = reviewDiv.innerText.trim();

      return { name, rating, reviewText };
    })
  );
  console.log(reviews.length + " reviews found");

  // After waiting for the reviews modal to be visible

  const overallRatingText = await page
    .$eval(
      "div[data-review-id] ~ h1 span, h1 span", // fallback selector for the span
      (el) => el.innerText
    )
    .catch(() => null);

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

  // --- Images ---

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
        const imgNodes = Array.from(section.querySelectorAll("img"));
        // If at least 3 images, exclude the last; otherwise use all
        const nodesToUse =
          imgNodes.length >= 3 ? imgNodes.slice(0, -1) : imgNodes;
        const imgs = nodesToUse.map((img) => {
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

  // --- Generate JSON file ---
  console.log("Generating structured JSON file...");

  // Extract location from capacity text
  const locationMatch = capacityText.match(/^([^•\n]+)/);
  const location = locationMatch ? locationMatch[1].trim() : "";

  // Extract capacity text without location
  const capacityTextWithoutLocation = capacityText
    .replace(/^[^•\n]+\n?/, "")
    .trim();

  // Clean up capacity text to have only one dot between items
  const cleanCapacity = capacityTextWithoutLocation
    .replace(/·\s*·/g, " - ")
    .trim();

  // Extract amenities as a flat list and structured
  const allAmenities = [];
  const amenitiesByCategory = {};
  amenitiesStructured.forEach((category) => {
    if (
      category.category &&
      category.category.trim().toLowerCase() !== "not included"
    ) {
      category.items.forEach((item) => {
        const trimmedItem = item.trim();
        // Check if this amenity should be excluded
        const shouldExclude = EXCLUDED_AMENITIES.some((excluded) =>
          trimmedItem.toLowerCase().includes(excluded.toLowerCase())
        );

        if (!shouldExclude) {
          // Clean the amenity by keeping only the first line
          const cleanedAmenity = cleanAmenity(trimmedItem);
          allAmenities.push(cleanedAmenity);
        }
      });

      // Add to structured amenities (filtered)
      if (category.category.trim()) {
        const filteredItems = category.items
          .filter((item) => {
            const trimmedItem = item.trim();
            const shouldExclude = EXCLUDED_AMENITIES.some((excluded) =>
              trimmedItem.toLowerCase().includes(excluded.toLowerCase())
            );
            return !shouldExclude;
          })
          .map((item) => cleanAmenity(item.trim())); // Clean each amenity

        if (filteredItems.length > 0) {
          amenitiesByCategory[category.category] = filteredItems;
        }
      }
    }
  });

  // Extract badges
  const badges = [];
  if (isSuperhost) badges.push("superhost");
  if (isGuestFavorite) badges.push("guest_favorite");

  // Process reviews for JSON - only include 5-star reviews
  const fiveStarReviews = reviews
    .filter((review) => parseInt(review.rating) === 5)
    .map((review) => ({
      reviewer: review.name,
      text: review.reviewText,
    }));

  // Advanced review filtering
  let filteredReviews = [...fiveStarReviews];

  // Step 1: Remove longest reviews until we have 18 or fewer, but never remove reviews under 600 characters
  if (filteredReviews.length > 18) {
    // Sort by length (longest first) and remove longest ones
    const sortedByLength = filteredReviews.sort(
      (a, b) => b.text.length - a.text.length
    );
    const shortReviews = sortedByLength.filter(
      (review) => review.text.length < 600
    );
    const longReviews = sortedByLength.filter(
      (review) => review.text.length >= 600
    );

    // Keep all short reviews and limit long reviews
    const maxLongReviews = 18 - shortReviews.length;
    const keptLongReviews = longReviews.slice(0, Math.max(0, maxLongReviews));

    filteredReviews = [...shortReviews, ...keptLongReviews];
  }

  // Step 2: If still more than 18, remove shortest reviews but never remove reviews longer than 20 characters
  if (filteredReviews.length > 18) {
    const sortedByLength = filteredReviews.sort(
      (a, b) => a.text.length - b.text.length
    );
    const veryShortReviews = sortedByLength.filter(
      (review) => review.text.length <= 20
    );
    const normalReviews = sortedByLength.filter(
      (review) => review.text.length > 20
    );

    // Keep all normal reviews and limit very short reviews
    const maxVeryShortReviews = 18 - normalReviews.length;
    const keptVeryShortReviews = veryShortReviews.slice(
      0,
      Math.max(0, maxVeryShortReviews)
    );

    filteredReviews = [...normalReviews, ...keptVeryShortReviews];
  }

  // Step 3: Remove outliers (reviews that are 50+ characters longer than the second longest)
  if (filteredReviews.length > 18) {
    let hasOutliers = true;
    while (hasOutliers && filteredReviews.length > 18) {
      const sortedByLength = filteredReviews.sort(
        (a, b) => b.text.length - a.text.length
      );

      if (sortedByLength.length < 2) break;
      const longest = sortedByLength[0];
      const secondLongest = sortedByLength[1];
      const difference = longest.text.length - secondLongest.text.length;

      if (difference > 50) {
        // Remove the longest review
        filteredReviews = filteredReviews.filter(
          (review) => review !== longest
        );
        console.log(
          `Removed outlier review (${longest.text.length} chars vs ${secondLongest.text.length} chars)`
        );
      } else {
        hasOutliers = false;
      }
    }
  }

  // Step 4: If still more than 18, keep them all (as requested)
  if (filteredReviews.length > 18) {
    console.log(`Keeping all ${filteredReviews.length} reviews (more than 18)`);
  }

  console.log(
    `Selected ${filteredReviews.length} reviews out of ${fiveStarReviews.length} 5-star reviews`
  );

  // Process images for JSON
  const processedImages = uniqueImages.map((img) => {
    const imageObj = {
      src: img.src,
      alt: img.alt,
      width: parseInt(img.width) || 0,
      height: parseInt(img.height) || 0,
      aspect: getAspect(img.width, img.height),
      category: img.category || "",
    };
    if (img.isHero) imageObj.isHero = true;
    if (img.mustUse) imageObj.mustUse = true;
    return imageObj;
  });

  // Create structured JSON object with all information
  const jsonData = {
    id: listingId,
    url: AIRBNB_URL,
    title: title,
    summary: summary,
    capacity: cleanCapacity,
    location: location,
    // amenities: allAmenities,
    amenitiesByCategory: amenitiesByCategory, // Structured amenities
    badges: badges,
    reviews: filteredReviews,
    images: processedImages,
    highlights: highlights,
  };

  // Write JSON file
  const jsonPath = path.join(destDir, "listing.json");
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), "utf8");

  await browser.close();
}

scrape().catch(console.error);
