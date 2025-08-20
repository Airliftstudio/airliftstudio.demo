const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// Function to get listing ID from URL (same as in modify.js)
function getListingId(url) {
  const match = url.match(/\/rooms\/(\d+)/);
  return match ? match[1] : "listing";
}

// Function to dynamically extract required filenames from index.html
function extractRequiredFilenames(projectPath) {
  try {
    const indexPath = path.join(projectPath, "index.html");

    // Check if index.html exists
    if (!fs.existsSync(indexPath)) {
      console.log("ℹ️  index.html not found, using default required filenames");
      return getDefaultRequiredFilenames();
    }

    // Read the HTML file
    const htmlContent = fs.readFileSync(indexPath, "utf8");

    // Extract all image references using regex - updated for new naming convention
    const imagePatterns = [
      /src="images\/(img-hero(?:-landscape|-portrait)?-\d+w\.jpg)"/g,
      /src="images\/(img-landscape-\d+-\d+w\.jpg)"/g,
      /src="images\/(img-portrait-\d+-\d+w\.jpg)"/g,
      /src="images\/(img-normal-\d+-\d+w\.jpg)"/g,
    ];

    const foundFilenames = new Set();

    // Extract filenames from each pattern
    imagePatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(htmlContent)) !== null) {
        foundFilenames.add(match[1]);
      }
    });

    // Convert to array and sort to maintain consistent order
    const requiredFilenames = Array.from(foundFilenames).sort((a, b) => {
      // Sort hero images first
      if (a.includes("img-hero")) return -1;
      if (b.includes("img-hero")) return 1;

      // Sort by type (landscape, portrait, normal) then by number
      const aType = a.includes("landscape")
        ? 1
        : a.includes("portrait")
        ? 2
        : 3;
      const bType = b.includes("landscape")
        ? 1
        : b.includes("portrait")
        ? 2
        : 3;

      if (aType !== bType) return aType - bType;

      // Extract numbers for sorting
      const aNum = parseInt(a.match(/\d+/)[0]);
      const bNum = parseInt(b.match(/\d+/)[0]);
      return aNum - bNum;
    });

    console.log(
      `📋 Found ${requiredFilenames.length} required image filenames in index.html:`
    );
    requiredFilenames.forEach((filename) => console.log(`   - ${filename}`));

    return requiredFilenames;
  } catch (error) {
    console.error(
      "❌ Error extracting required filenames from index.html:",
      error.message
    );
    console.log("ℹ️  Falling back to default required filenames");
    return getDefaultRequiredFilenames();
  }
}

// Function to extract width from filename
function extractWidthFromFilename(filename) {
  const match = filename.match(/(\d+)w\.jpg$/);
  return match ? parseInt(match[1]) : null;
}

// Function to extract image type and requirements from filename
function extractImageRequirements(filename) {
  const requirements = {
    type: null,
    aspect: null,
    number: null,
    width: null,
  };

  // Extract width
  requirements.width = extractWidthFromFilename(filename);

  // Extract type and aspect
  if (filename.includes("img-hero")) {
    requirements.type = "hero";
    if (filename.includes("hero-landscape")) {
      requirements.aspect = "landscape";
    } else {
      requirements.aspect = "any"; // Default hero can be any aspect
    }
  } else if (filename.includes("img-landscape")) {
    requirements.type = "landscape";
    requirements.aspect = "landscape";
  } else if (filename.includes("img-portrait")) {
    requirements.type = "portrait";
    requirements.aspect = "portrait";
  } else if (filename.includes("img-normal")) {
    requirements.type = "normal";
    requirements.aspect = "any";
  }

  // Extract number (the first number in the filename, before the width)
  if (filename.includes("img-hero")) {
    // Hero images typically don't have a sequence number, just width
    requirements.number = null;
  } else {
    // For other image types, extract the number before the width
    const numberMatch = filename.match(/(\d+)-\d+w/);
    if (numberMatch) {
      requirements.number = parseInt(numberMatch[1]);
    }
  }

  return requirements;
}

// Function to get default required filenames (fallback)
function getDefaultRequiredFilenames() {
  return [
    "img-hero-1920w.jpg",
    "img-landscape-1-1440w.jpg",
    "img-landscape-2-1440w.jpg",
    "img-portrait-1-720w.jpg",
    "img-normal-1-720w.jpg",
    "img-normal-2-720w.jpg",
    "img-normal-3-720w.jpg",
    "img-normal-4-720w.jpg",
    "img-normal-5-720w.jpg",
    "img-normal-6-720w.jpg",
    "img-normal-7-720w.jpg",
    "img-normal-8-720w.jpg",
    "img-normal-9-720w.jpg",
    "img-normal-10-720w.jpg",
  ];
}

// Function to download a single image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https:") ? https : http;

    const file = fs.createWriteStream(filepath);

    protocol
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(`Failed to download ${url}: ${response.statusCode}`)
          );
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          resolve();
        });

        file.on("error", (err) => {
          fs.unlink(filepath, () => {}); // Delete the file if there was an error
          reject(err);
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

// Function to select images when there are no categories
function selectImagesNoCategories(images, requiredFilenames) {
  const selectedImages = [];
  const selectedUrls = [];

  // Count required image types
  const requiredCounts = {
    hero: requiredFilenames.filter((name) => name.includes("hero")).length,
    landscape: requiredFilenames.filter((name) => name.includes("landscape"))
      .length,
    portrait: requiredFilenames.filter((name) => name.includes("portrait"))
      .length,
    normal: requiredFilenames.filter((name) => name.includes("normal")).length,
  };

  // Step 1: Select all mustUse images first
  const mustUseImages = images.filter((img) => img.mustUse);

  for (const img of mustUseImages) {
    selectedImages.push(img);
    selectedUrls.push(img.src);
  }

  // Step 2: Select remaining images in index order until we reach the limit
  let remainingNeeded = requiredFilenames.length - selectedImages.length;
  let portraitSelected = selectedImages.filter(
    (img) => img.aspect === "portrait"
  ).length;
  let landscapeSelected = selectedImages.filter(
    (img) => img.aspect === "landscape"
  ).length;

  for (const img of images) {
    if (remainingNeeded <= 0) break;

    // Skip if already selected
    if (selectedUrls.includes(img.src)) continue;

    // Check if we can select this image based on aspect ratio requirements
    let canSelect = false;

    if (img.aspect === "portrait") {
      if (portraitSelected < requiredCounts.portrait) {
        canSelect = true;
        portraitSelected++;
      }
    } else if (img.aspect === "landscape") {
      if (landscapeSelected < requiredCounts.landscape) {
        canSelect = true;
        landscapeSelected++;
      } else if (selectedImages.length < requiredFilenames.length) {
        // Fallback: use landscape as normal if we still need images
        canSelect = true;
      }
    } else {
      // Normal aspect ratio or any other
      canSelect = true;
    }

    if (canSelect) {
      selectedImages.push(img);
      selectedUrls.push(img.src);
      remainingNeeded--;
    }
  }

  if (remainingNeeded <= 0) {
    return selectedImages;
  }

  for (const img of images) {
    if (remainingNeeded <= 0) break;

    // Skip if already selected
    if (selectedUrls.includes(img.src)) continue;

    selectedImages.push(img);
    selectedUrls.push(img.src);
    remainingNeeded--;
  }

  return selectedImages;
}

// Function to select images when there are categories
function selectImagesWithCategories(images, requiredFilenames) {
  const selectedImages = [];
  const selectedUrls = [];

  // Count required image types
  const requiredCounts = {
    hero: requiredFilenames.filter((name) => name.includes("hero")).length,
    landscape: requiredFilenames.filter((name) => name.includes("landscape"))
      .length,
    portrait: requiredFilenames.filter((name) => name.includes("portrait"))
      .length,
    normal: requiredFilenames.filter((name) => name.includes("normal")).length,
  };

  // Hardcoded priority category names
  const priorityCategories = ["Pool", "Living room"];

  // Hardcoded categories where only 1 image maximum should be selected
  const maxOneImageCategories = [
    "Full bathroom 1",
    "Full kitchen",
    "Full bathroom 2",
    "Half bathroom",
  ];

  // Helper function to check if we can select a portrait image
  function canSelectPortrait() {
    const portraitSelected = selectedImages.filter(
      (img) => img.aspect === "portrait" && !img.isHero
    ).length;
    return portraitSelected < requiredCounts.portrait;
  }

  // Helper function to check if image is already selected
  function isImageSelected(img) {
    return selectedUrls.includes(img.src);
  }

  // Helper function to count selected images per category
  function getSelectedCountForCategory(category) {
    return selectedImages.filter((img) => img.category === category).length;
  }

  // Helper function to check if we can select more images from a category
  function canSelectFromCategory(category) {
    const currentCount = getSelectedCountForCategory(category);
    if (maxOneImageCategories.includes(category)) {
      return currentCount < 1;
    }
    return currentCount < 3; // Default max is 3
  }

  // Helper function to select an image if possible
  function trySelectImage(img) {
    if (isImageSelected(img)) return false;

    // Check portrait limit (except in fallback mode)
    if (img.aspect === "portrait" && !canSelectPortrait()) {
      return false;
    }

    selectedImages.push(img);
    selectedUrls.push(img.src);
    return true;
  }

  // Step 1: Select all mustUse images first
  const mustUseImages = images.filter((img) => img.mustUse);

  for (const img of mustUseImages) {
    trySelectImage(img);
  }

  // Step 2: Select the first image from each category
  const categories = [
    ...new Set(images.map((img) => img.category).filter((cat) => cat)),
  ];

  for (const category of categories) {
    const categoryImages = images.filter((img) => img.category === category);
    for (const img of categoryImages) {
      if (trySelectImage(img)) {
        break;
      }
    }
  }

  // Step 3: Select one more image from priority categories (respecting max limits)
  for (const priorityCategory of priorityCategories) {
    if (!canSelectFromCategory(priorityCategory)) continue;

    const categoryImages = images.filter(
      (img) => img.category === priorityCategory
    );
    for (const img of categoryImages) {
      if (trySelectImage(img)) {
        break;
      }
    }
  }

  // Step 4: Select from most common categories (top 3, respecting max limits)
  const categoryCounts = {};
  images.forEach((img) => {
    if (img.category) {
      categoryCounts[img.category] = (categoryCounts[img.category] || 0) + 1;
    }
  });

  const sortedCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category);

  for (const category of sortedCategories) {
    if (!canSelectFromCategory(category)) continue;

    const categoryImages = images.filter((img) => img.category === category);
    for (const img of categoryImages) {
      if (trySelectImage(img)) {
        break;
      }
    }
  }

  // Step 5: Go through each category repeatedly (max 3 loops)
  let loops = 0;
  const maxLoops = 3;

  while (selectedImages.length < requiredFilenames.length && loops < maxLoops) {
    let selectedInThisLoop = 0;

    for (const category of categories) {
      if (selectedImages.length >= requiredFilenames.length) break;
      if (!canSelectFromCategory(category)) continue;

      const categoryImages = images.filter((img) => img.category === category);
      for (const img of categoryImages) {
        if (trySelectImage(img)) {
          selectedInThisLoop++;
          break;
        }
      }
    }

    if (selectedInThisLoop === 0) break; // No more images can be selected
    loops++;
  }

  // Step 6: Fallback - accept more portrait images if needed
  if (selectedImages.length < requiredFilenames.length) {
    // Reset portrait selection tracking for fallback
    const fallbackSelectedImages = [...selectedImages];
    const fallbackSelectedUrls = [...selectedUrls];

    // Go through all images again without portrait restrictions
    for (const img of images) {
      if (fallbackSelectedImages.length >= requiredFilenames.length) break;
      if (fallbackSelectedUrls.includes(img.src)) continue;

      fallbackSelectedImages.push(img);
      fallbackSelectedUrls.push(img.src);
    }

    // Use fallback selection if we got more images
    if (fallbackSelectedImages.length > selectedImages.length) {
      selectedImages.length = 0;
      selectedUrls.length = 0;
      selectedImages.push(...fallbackSelectedImages);
      selectedUrls.push(...fallbackSelectedUrls);
    }
  }

  return selectedImages;
}

// Function to update alt text in index.html
function updateAltTextInHtml(projectPath, selectedImages, requiredFilenames) {
  try {
    const indexPath = path.join(projectPath, "index.html");

    // Check if index.html exists
    if (!fs.existsSync(indexPath)) {
      console.log("ℹ️  index.html not found, skipping alt text update");
      return;
    }

    // Read the HTML file
    let htmlContent = fs.readFileSync(indexPath, "utf8");
    let updatedCount = 0;

    // Create a mapping of filename to selected image
    const filenameToImage = {};
    selectedImages.forEach((img, index) => {
      if (index < requiredFilenames.length) {
        filenameToImage[requiredFilenames[index]] = img;
      }
    });

    // Find and update all img tags
    const imgTagRegex = /<img[^>]*src="([^"]*)"[^>]*>/gi;
    htmlContent = htmlContent.replace(imgTagRegex, (match, src) => {
      // Extract the filename from the src
      const filename = src.split("/").pop();

      // Check if this filename matches one of our selected images
      if (filenameToImage[filename]) {
        const selectedImage = filenameToImage[filename];
        let newAltText = selectedImage.alt || selectedImage.category || "Image";

        // Special handling for hero image
        if (filename.includes("img-hero")) {
          if (
            newAltText.startsWith("Listing image") ||
            newAltText.startsWith("Additional photos image")
          ) {
            newAltText = "hero image";
          }
        }

        // Update the alt attribute
        const updatedMatch = match.replace(
          /alt="[^"]*"/i,
          `alt="${newAltText}"`
        );

        // If there's no alt attribute, add one
        if (!match.includes("alt=")) {
          const updatedMatch = match.replace(
            /<img([^>]*)>/i,
            `<img$1 alt="${newAltText}">`
          );
          updatedCount++;
          return updatedMatch;
        }

        updatedCount++;
        return updatedMatch;
      }

      return match;
    });

    // Write the updated HTML back to the file
    fs.writeFileSync(indexPath, htmlContent, "utf8");

    if (updatedCount > 0) {
      console.log(
        `✅ Updated alt text for ${updatedCount} images in index.html`
      );
    } else {
      console.log("ℹ️  No image alt text updates needed in index.html");
    }
  } catch (error) {
    console.error("❌ Error updating alt text in index.html:", error.message);
  }
}

// Main function to download images
async function downloadImages() {
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
  const listingData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  // Check if images directory exists, create if not
  const imagesDir = path.join(destDir, "images");
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // Define required filenames
  const requiredFilenames = extractRequiredFilenames(destDir);

  // Check if images have categories
  const hasCategories = listingData.images.some(
    (img) => img.category && img.category !== ""
  );

  // Select images based on whether they have categories or not
  let selectedImages;
  let selectedUrls = [];
  if (hasCategories) {
    selectedImages = selectImagesWithCategories(
      listingData.images,
      requiredFilenames
    );
    // Get selected URLs from the selection function
    selectedUrls = selectedImages.map((img) => img.src);
  } else {
    selectedImages = selectImagesNoCategories(
      listingData.images,
      requiredFilenames
    );
    // Get selected URLs from the selection function
    selectedUrls = selectedImages.map((img) => img.src);
  }

  // Smart hero image selection based on filename requirements
  const heroFilenames = requiredFilenames.filter((filename) =>
    filename.includes("img-hero")
  );

  for (const heroFilename of heroFilenames) {
    const heroRequirements = extractImageRequirements(heroFilename);

    // Find suitable hero image based on requirements
    let suitableHeroImage = null;

    if (heroRequirements.aspect === "landscape") {
      // If hero requires landscape, prioritize landscape images with mustUse or isHero
      suitableHeroImage =
        listingData.images.find(
          (img) => img.aspect === "landscape" && (img.mustUse || img.isHero)
        ) || listingData.images.find((img) => img.aspect === "landscape");
    } else {
      // Default hero selection - prioritize isHero, then mustUse
      suitableHeroImage =
        listingData.images.find((img) => img.isHero) ||
        listingData.images.find((img) => img.mustUse) ||
        listingData.images[0]; // Fallback to first image
    }

    if (suitableHeroImage) {
      // Find if hero image is already selected
      const heroIndex = selectedImages.findIndex(
        (img) => img.src === suitableHeroImage.src
      );
      if (heroIndex === -1) {
        // Replace first image with hero image
        selectedImages[0] = suitableHeroImage;
      } else if (heroIndex !== 0) {
        // Move hero image to first position
        const heroImg = selectedImages.splice(heroIndex, 1)[0];
        selectedImages.unshift(heroImg);
      }
    }
  }

  // Sort selected images to match filename requirements
  const sortedImages = [];

  // Helper function to find and remove image by aspect ratio
  function findAndRemoveByAspect(aspect) {
    const index = selectedImages.findIndex((img) => img.aspect === aspect);
    if (index !== -1) {
      return selectedImages.splice(index, 1)[0];
    }
    return null;
  }

  // Assign images to filenames based on aspect ratio requirements
  for (const filename of requiredFilenames) {
    let selectedImage = null;

    if (filename.includes("img-hero")) {
      // Hero image should already be first
      selectedImage = selectedImages.shift();
    } else if (filename.includes("img-landscape")) {
      selectedImage = findAndRemoveByAspect("landscape");
    } else if (filename.includes("img-portrait")) {
      selectedImage = findAndRemoveByAspect("portrait");
    } else {
      // Normal images - take any remaining image (randomized)
      if (selectedImages.length > 0) {
        const randomIndex = Math.floor(Math.random() * selectedImages.length);
        selectedImage = selectedImages.splice(randomIndex, 1)[0];
      }
    }

    if (selectedImage) {
      sortedImages.push(selectedImage);
    } else {
      console.warn(`No suitable image found for ${filename}`);
      // Use any remaining image as fallback
      if (selectedImages.length > 0) {
        const fallbackImage = selectedImages.shift();
        sortedImages.push(fallbackImage);
      }
    }
  }

  // Download images with width parameters

  const downloadPromises = sortedImages.map((img, index) => {
    const filename = requiredFilenames[index];
    const filepath = path.join(imagesDir, filename);

    // Extract width from filename and add to URL
    const width = extractWidthFromFilename(filename);
    let downloadUrl = img.src;

    if (width) {
      // Handle existing im_w parameter by replacing it, or add new one
      if (img.src.includes("im_w=")) {
        downloadUrl = img.src.replace(/im_w=\d+/, `im_w=${width}`);
      } else {
        downloadUrl = img.src.includes("?")
          ? `${img.src}&im_w=${width}`
          : `${img.src}?im_w=${width}`;
      }
      console.log(
        `📥 Downloading ${filename} with width ${width}px from: ${downloadUrl}`
      );
    } else {
      console.log(
        `📥 Downloading ${filename} (no width specified) from: ${downloadUrl}`
      );
    }

    return downloadImage(downloadUrl, filepath)
      .then(() => {})
      .catch((error) => {
        console.error(`❌ Failed to download ${filename}: ${error.message}`);
        throw error;
      });
  });

  try {
    await Promise.all(downloadPromises);
    console.log(
      `\n✅ Successfully downloaded all ${sortedImages.length} images to ${imagesDir}`
    );

    // Update alt text in index.html after successful download
    updateAltTextInHtml(destDir, sortedImages, requiredFilenames);
  } catch (error) {
    console.error(`\n❌ Some downloads failed: ${error.message}`);
    process.exit(1);
  }

  // Download all unselected images as backup with matching widths
  const unselectedImages = listingData.images.filter(
    (img) => !selectedUrls.includes(img.src)
  );

  console.log(
    `📥 Found ${unselectedImages.length} unselected images for backup download`
  );

  // Create a mapping of aspect ratios to widths from selected images
  const aspectToWidths = {};
  requiredFilenames.forEach((filename, index) => {
    if (index < sortedImages.length) {
      const image = sortedImages[index];
      const requirements = extractImageRequirements(filename);
      const aspect =
        requirements.aspect === "any" ? image.aspect : requirements.aspect;
      const width = requirements.width;

      // Only add width to aspect mapping if it's not a hero image or if it's a specific hero aspect
      if (requirements.type !== "hero" || requirements.aspect !== "any") {
        if (!aspectToWidths[aspect]) {
          aspectToWidths[aspect] = new Set();
        }
        aspectToWidths[aspect].add(width);
      }
    }
  });

  console.log("📊 Aspect to widths mapping for backup images:");
  Object.entries(aspectToWidths).forEach(([aspect, widths]) => {
    console.log(`  ${aspect}: ${Array.from(widths).join(", ")}px`);
  });

  // Create width distribution counters for each aspect ratio
  const widthDistribution = {};
  Object.keys(aspectToWidths).forEach((aspect) => {
    widthDistribution[aspect] = {};
    Array.from(aspectToWidths[aspect]).forEach((width) => {
      widthDistribution[aspect][width] = 0;
    });
  });

  const backupPromises = unselectedImages.map((img, index) => {
    let filename;
    const aspect = img.aspect;
    const availableWidths = aspectToWidths[aspect] || new Set([720]); // Default to 720w if no matching widths

    // Distribute backup images across available widths for this aspect ratio
    const widthArray = Array.from(availableWidths).sort((a, b) => a - b);
    const widthCounts = widthDistribution[aspect] || {};

    // Find the width with the least downloads for this aspect ratio
    let selectedWidth = 720; // Default fallback
    if (Object.keys(widthCounts).length > 0) {
      const minCount = Math.min(...Object.values(widthCounts));
      const leastUsedWidths = widthArray.filter(
        (width) => widthCounts[width] === minCount
      );
      selectedWidth = leastUsedWidths[0];
    } else {
      selectedWidth = widthArray[0] || 720;
    }

    // Increment the counter for this width
    if (widthDistribution[aspect]) {
      widthDistribution[aspect][selectedWidth] =
        (widthDistribution[aspect][selectedWidth] || 0) + 1;
    }

    if (img.category && img.category !== "") {
      filename = `backup-${aspect}-${selectedWidth}w-${img.category
        .replace(/\s+/g, "-")
        .toLowerCase()}-${index + 1}.jpg`;
    } else {
      filename = `backup-${aspect}-${selectedWidth}w-${index + 1}.jpg`;
    }
    const filepath = path.join(imagesDir, filename);

    // Handle existing im_w parameter by replacing it, or add new one
    let downloadUrl = img.src;
    if (img.src.includes("im_w=")) {
      downloadUrl = img.src.replace(/im_w=\d+/, `im_w=${selectedWidth}`);
    } else {
      downloadUrl = img.src.includes("?")
        ? `${img.src}&im_w=${selectedWidth}`
        : `${img.src}?im_w=${selectedWidth}`;
    }

    return downloadImage(downloadUrl, filepath)
      .then(() => {
        console.log(
          `📥 Downloaded backup ${filename} with width ${selectedWidth}px from: ${downloadUrl}`
        );
      })
      .catch((error) => {
        console.error(
          `❌ Failed to download backup ${filename}: ${error.message}`
        );
        throw error;
      });
  });

  // Download mustUse images that are not portrait or isHero with high resolution
  // BUT exclude any that are already selected as main images
  const mustUseHighRes = listingData.images.filter(
    (img) =>
      img.mustUse &&
      !img.isHero &&
      img.aspect !== "portrait" &&
      !selectedUrls.includes(img.src)
  );

  console.log(
    `📥 Found ${mustUseHighRes.length} mustUse images for high-res backup download`
  );

  const highResPromises = mustUseHighRes.map((img, index) => {
    const aspect = img.aspect;

    // For hero backups, use the hero image width from the selected images
    let width = 1920; // Default fallback
    const heroFilenames = requiredFilenames.filter((filename) =>
      filename.includes("img-hero")
    );
    if (heroFilenames.length > 0) {
      const heroWidth = extractWidthFromFilename(heroFilenames[0]);
      if (heroWidth) {
        width = heroWidth;
      }
    } else {
      // Fallback to aspect-specific width if no hero image found
      const availableWidths = aspectToWidths[aspect] || new Set([1920]);
      width = Array.from(availableWidths)[0] || 1920;
    }

    const filename = `backup-hero-${index + 1}-${aspect}-${width}w.jpg`;
    const filepath = path.join(imagesDir, filename);

    // Handle existing im_w parameter by replacing it, or add new one
    let highResUrl = img.src;
    if (img.src.includes("im_w=")) {
      highResUrl = img.src.replace(/im_w=\d+/, `im_w=${width}`);
    } else {
      highResUrl = img.src.includes("?")
        ? `${img.src}&im_w=${width}`
        : `${img.src}?im_w=${width}`;
    }

    return downloadImage(highResUrl, filepath)
      .then(() => {
        console.log(
          `📥 Downloaded high-res backup ${filename} with width ${width}px`
        );
      })
      .catch((error) => {
        console.error(
          `❌ Failed to download high-res ${filename}: ${error.message}`
        );
        throw error;
      });
  });

  try {
    await Promise.all([...backupPromises, ...highResPromises]);
  } catch (error) {
    console.error(`\n❌ Some backup downloads failed: ${error.message}`);
    process.exit(1);
  }
}

// Only run downloadImages() if this file is executed directly
if (require.main === module) {
  downloadImages().catch(console.error);
}

module.exports = {
  downloadImages,
  selectImagesNoCategories,
  selectImagesWithCategories,
  getListingId,
  updateAltTextInHtml,
  extractRequiredFilenames,
  getDefaultRequiredFilenames,
  extractWidthFromFilename,
  extractImageRequirements,
};
