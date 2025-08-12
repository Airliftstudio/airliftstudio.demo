const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// Function to get listing ID from URL (same as in modify.js)
function getListingId(url) {
  const match = url.match(/\/rooms\/(\d+)/);
  return match ? match[1] : "listing";
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
        if (filename === "hero-bg.jpg") {
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
  const requiredFilenames = [
    "hero-bg.jpg",
    "image-landscape-1.jpg",
    "image-landscape-2.jpg",
    "image-portrait-1.jpg",
    "image-normal-1.jpg",
    "image-normal-2.jpg",
    "image-normal-3.jpg",
    "image-normal-4.jpg",
    "image-normal-5.jpg",
    "image-normal-6.jpg",
    "image-normal-7.jpg",
    "image-normal-8.jpg",
    "image-normal-9.jpg",
    "image-normal-10.jpg",
  ];

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

  // Ensure we have the hero image (isHero: true) as hero-bg.jpg
  const heroImage = listingData.images.find((img) => img.isHero);
  if (heroImage) {
    // Find if hero image is already selected
    const heroIndex = selectedImages.findIndex(
      (img) => img.src === heroImage.src
    );
    if (heroIndex === -1) {
      // Replace first image with hero image
      selectedImages[0] = heroImage;
    } else if (heroIndex !== 0) {
      // Move hero image to first position
      const heroImg = selectedImages.splice(heroIndex, 1)[0];
      selectedImages.unshift(heroImg);
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

    if (filename.includes("hero")) {
      // Hero image should already be first
      selectedImage = selectedImages.shift();
    } else if (filename.includes("landscape")) {
      selectedImage = findAndRemoveByAspect("landscape");
    } else if (filename.includes("portrait")) {
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

  // Download images

  const downloadPromises = sortedImages.map((img, index) => {
    const filename = requiredFilenames[index];
    const filepath = path.join(imagesDir, filename);

    return downloadImage(img.src, filepath)
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

  // Download all unselected images as backup
  const unselectedImages = listingData.images.filter(
    (img) => !selectedUrls.includes(img.src)
  );

  const backupPromises = unselectedImages.map((img, index) => {
    let filename;
    if (img.category && img.category !== "") {
      filename = `backup-${img.category.replace(/\s+/g, "-").toLowerCase()}-${
        index + 1
      }-${img.aspect}.jpg`;
    } else {
      filename = `backup-${index + 1}-${img.aspect}.jpg`;
    }
    const filepath = path.join(imagesDir, filename);

    return downloadImage(img.src, filepath)
      .then(() => {})
      .catch((error) => {
        console.error(
          `❌ Failed to download backup ${filename}: ${error.message}`
        );
        throw error;
      });
  });

  // Download mustUse images that are not portrait or isHero with ?im_w=1920
  const mustUseHighRes = listingData.images.filter(
    (img) => img.mustUse && !img.isHero && img.aspect !== "portrait"
  );

  const highResPromises = mustUseHighRes.map((img, index) => {
    const filename = `backup-hero-${index + 1}.jpg`;
    const filepath = path.join(imagesDir, filename);

    // Add ?im_w=1920 to the URL
    const highResUrl = img.src.includes("?")
      ? `${img.src}&im_w=1920`
      : `${img.src}?im_w=1920`;

    return downloadImage(highResUrl, filepath)
      .then(() => {})
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
};
