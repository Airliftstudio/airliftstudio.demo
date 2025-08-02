// Translation System
let currentLanguage = "en";
let supportedLanguages = [];

let translations = {};

// Load translations from JSON files
function loadTranslations() {
  // Automatically load all language files
  translations["en"] = window.translations_en || {};

  supportedLanguages = Object.keys(translations);

  // Initialize the language system after translations are loaded
  initLang();
}

// Update meta tags based on language
function updateMetaTags(lang) {
  const langData = translations[lang];
  if (!langData || !langData.meta) return;

  const meta = langData.meta;

  // Update title
  document.title = meta.title;

  // Update meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", meta.description);

  // Update meta keywords
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) metaKeywords.setAttribute("content", meta.keywords);

  // Update og:title
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", meta.og_title);

  // Update og:description
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute("content", meta.og_description);

  // Update og:url with language code
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) {
    let baseUrl = ogUrl.getAttribute("content").replace(/\/[a-z]{2}\/?$/, "");
    baseUrl = baseUrl.replace(/\/$/, "");
    const langUrl = lang === "en" ? `${baseUrl}/` : `${baseUrl}/${lang}/`;
    ogUrl.setAttribute("content", langUrl);
  }
  const languageMeta = document.querySelector('meta[name="language"]');
  if (languageMeta) {
    languageMeta.setAttribute("content", meta.language);
  }
  const ogLocale = document.querySelector('meta[property="og:locale"]');
  if (ogLocale) {
    ogLocale.setAttribute("content", meta.locale);
  }
  const contentLanguage = document.querySelector(
    'meta[http-equiv="Content-Language"]'
  );
  if (contentLanguage) {
    contentLanguage.setAttribute("content", lang);
  }
}

// Update structured data based on language
function updateStructuredData(lang) {
  const langData = translations[lang];
  if (!langData || !langData.structuredData) {
    console.warn("No structured data found for language:", lang);
    return;
  }

  const scriptElement = document.getElementById("structured-data");
  if (!scriptElement) return;

  try {
    // Parse the existing structured data
    const existingData = JSON.parse(scriptElement.textContent);

    // Update only the fields that change
    existingData.description = langData.structuredData.description;
    existingData.address.addressCountry =
      langData.structuredData.addressCountry;
    existingData.keywords = langData.structuredData.keywords;
    existingData.amenityFeature = langData.structuredData.amenityNames.map(
      (name) => ({
        "@type": "LocationFeatureSpecification",
        name: name,
        value: true,
      })
    );

    // Update URL to match language
    let baseUrl = existingData.url.replace(/\/[a-z]{2}\/?$/, "");
    baseUrl = baseUrl.replace(/\/$/, "");
    existingData.url = lang === "en" ? `${baseUrl}/` : `${baseUrl}/${lang}/`;

    // Update the script content
    scriptElement.textContent = JSON.stringify(existingData, null, 2);
    console.log("Structured data updated successfully for language:", lang);
  } catch (error) {
    console.warn("Error updating structured data:", error);
  }
}

function translatePage(lang) {
  currentLanguage = lang;
  const langData = translations[lang];

  if (!langData) return;

  // Update all elements with data-translate attribute
  document.querySelectorAll("[data-translate]").forEach((element) => {
    const key = element.getAttribute("data-translate");
    const keys = key.split(".");
    let value = langData;

    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        value = null;
        break;
      }
    }

    if (value) {
      element.textContent = value;
    }
  });

  // Update language button
  const currentLangSpan = document.getElementById("currentLang");
  if (currentLangSpan) {
    currentLangSpan.textContent = lang.toUpperCase();
  }

  // Update active language option
  document.querySelectorAll(".language-option").forEach((option) => {
    option.classList.remove("active");
  });
  document.querySelector(`[data-lang="${lang}"]`).classList.add("active");

  // Update HTML lang attribute
  document.documentElement.lang = lang;

  // Update meta tags
  updateMetaTags(lang);

  // Update structured data
  updateStructuredData(lang);

  // Save language preference
  localStorage.setItem("preferredLanguage", lang);
}

// Get language from URL path
function getLanguageFromURL() {
  const path = window.location.pathname;
  console.log("Current path:", path);

  // Look for language code at the end of the path
  const langMatch = path.match(
    new RegExp(`\/(${supportedLanguages.join("|")})\/?$`)
  );
  console.log("Language match:", langMatch);
  const result = langMatch ? langMatch[1] : null;
  console.log("Detected language:", result);
  return result;
}

// Update URL with language path
function updateURLWithLanguage(lang) {
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;
  const currentHash = window.location.hash;

  // Remove any existing language suffix and clean up double slashes
  let pathWithoutLang = currentPath;

  // Remove all language codes from the end of the path
  supportedLanguages.forEach((languageCode) => {
    const langRegex = new RegExp(`\/${languageCode}\/?$`);
    pathWithoutLang = pathWithoutLang.replace(langRegex, "");
  });

  // Clean up any double slashes
  pathWithoutLang = pathWithoutLang.replace(/\/+/g, "/");

  // Remove trailing slash except for root
  if (pathWithoutLang !== "/" && pathWithoutLang.endsWith("/")) {
    pathWithoutLang = pathWithoutLang.slice(0, -1);
  }

  try {
    // If we're switching to a language, add the suffix
    if (lang && lang !== "en") {
      const newPath = `${
        pathWithoutLang === "/" ? "" : pathWithoutLang
      }/${lang}/`;
      window.history.replaceState(
        {},
        "",
        newPath + currentSearch + currentHash
      );
    } else {
      // For English (default), remove the language suffix
      // Ensure we don't end up with double slashes
      const cleanPath = pathWithoutLang === "/" ? "/" : pathWithoutLang;
      window.history.replaceState(
        {},
        "",
        cleanPath + "/" + currentSearch + currentHash
      );
    }
  } catch (error) {
    console.error("Error updating URL with language:", error);
  }
}

// Language switcher functionality
function initLanguageSwitcher() {
  const languageBtn = document.getElementById("languageBtn");
  const languageDropdown = document.getElementById("languageDropdown");

  if (languageBtn && languageDropdown) {
    languageBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      languageBtn.classList.toggle("active");
      languageDropdown.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      languageBtn.classList.remove("active");
      languageDropdown.classList.remove("show");
    });

    // Prevent scroll events from bubbling up to the main page
    languageDropdown.addEventListener("wheel", (e) => {
      e.stopPropagation();
    });

    // Language option clicks
    document.querySelectorAll(".language-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        const lang = option.getAttribute("data-lang");
        translatePage(lang);
        languageBtn.classList.remove("active");
        languageDropdown.classList.remove("show");
        updateURLWithLanguage(lang);
      });
    });
  }
}

function initLang() {
  initLanguageSwitcher();

  // Check for language in URL path first, then localStorage
  const urlLanguage = getLanguageFromURL();
  const savedLanguage = localStorage.getItem("preferredLanguage");

  console.log("URL Language:", urlLanguage);
  console.log("Saved Language:", savedLanguage);

  let languageToUse = "en"; // default

  if (urlLanguage && translations[urlLanguage]) {
    languageToUse = urlLanguage;
    console.log("Using URL language:", languageToUse);
    // Don't update URL here as it's already correct
  } else if (savedLanguage && translations[savedLanguage]) {
    languageToUse = savedLanguage;
    console.log("Using saved language:", languageToUse);
    // Update URL to reflect the saved language preference

    updateURLWithLanguage(savedLanguage);
  } else {
    console.log("Using default language:", languageToUse);
  }

  translatePage(languageToUse);
}

// Initialize translations when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  loadTranslations();
});
