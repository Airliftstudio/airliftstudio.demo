// Translation System
let currentLanguage = "en";
let supportedLanguages = [];
let defaultEnglishContent = {}; // Store default English content from HTML
let translations = {};

// Extract default English content from HTML elements with data-translate attributes
function extractDefaultEnglishContent() {
  const elements = document.querySelectorAll("[data-translate]");

  elements.forEach((element) => {
    const key = element.getAttribute("data-translate");
    const textContent = element.textContent.trim();

    if (textContent) {
      // Convert dot notation to nested object structure
      const keys = key.split(".");
      let current = defaultEnglishContent;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = textContent;
    }
  });

  // Extract meta tags content
  extractMetaContent();

  // Extract structured data content
  extractStructuredDataContent();

  // Validate that we extracted content
  if (Object.keys(defaultEnglishContent).length === 0) {
    console.warn("No default English content extracted from HTML");
  }
}

// Extract meta tags content
function extractMetaContent() {
  if (!defaultEnglishContent.meta) {
    defaultEnglishContent.meta = {};
  }

  // Extract title
  const title = document.title;
  if (title) {
    defaultEnglishContent.meta.title = title;
  }

  // Extract meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    defaultEnglishContent.meta.description =
      metaDesc.getAttribute("content") || "";
  }

  // Extract meta keywords
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    defaultEnglishContent.meta.keywords =
      metaKeywords.getAttribute("content") || "";
  }

  // Extract og:title
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    defaultEnglishContent.meta.og_title = ogTitle.getAttribute("content") || "";
  }

  // Extract og:description
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) {
    defaultEnglishContent.meta.og_description =
      ogDesc.getAttribute("content") || "";
  }

  // Extract language and locale
  const languageMeta = document.querySelector('meta[name="language"]');
  if (languageMeta) {
    defaultEnglishContent.meta.language =
      languageMeta.getAttribute("content") || "English";
  }

  const ogLocale = document.querySelector('meta[property="og:locale"]');
  if (ogLocale) {
    defaultEnglishContent.meta.locale =
      ogLocale.getAttribute("content") || "en_US";
  }
}

// Extract structured data content
function extractStructuredDataContent() {
  if (!defaultEnglishContent.structuredData) {
    defaultEnglishContent.structuredData = {};
  }

  const scriptElement = document.getElementById("structured-data");
  if (scriptElement) {
    try {
      const structuredData = JSON.parse(scriptElement.textContent);

      // Extract description
      if (structuredData.description) {
        defaultEnglishContent.structuredData.description =
          structuredData.description;
      }

      // Extract keywords
      if (structuredData.keywords) {
        defaultEnglishContent.structuredData.keywords = structuredData.keywords;
      }

      // Extract address country
      if (structuredData.address && structuredData.address.addressCountry) {
        defaultEnglishContent.structuredData.addressCountry =
          structuredData.address.addressCountry;
      }
    } catch (error) {
      console.warn("Error parsing structured data:", error);
    }
  }
}

// Load translations from JSON files
function loadTranslations() {
  // Extract default English content from HTML first
  extractDefaultEnglishContent();

  // Set English translations from extracted content
  translations["en"] = defaultEnglishContent;

  // Load other language files
  translations["fr"] = window.translations_fr || {};
  translations["de"] = window.translations_de || {};
  translations["es"] = window.translations_es || {};
  translations["ru"] = window.translations_ru || {};
  translations["zh"] = window.translations_zh || {};
  translations["it"] = window.translations_it || {};
  translations["hi"] = window.translations_hi || {};
  translations["id"] = window.translations_id || {};
  translations["ja"] = window.translations_ja || {};
  translations["ko"] = window.translations_ko || {};

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
  if (!langData) {
    console.warn("No translation data found for language:", lang);
    return;
  }

  const scriptElement = document.getElementById("structured-data");
  if (!scriptElement) {
    console.warn("Structured data script element not found");
    return;
  }

  try {
    // Parse the existing structured data
    const existingData = JSON.parse(scriptElement.textContent);

    // Get structured data from current language
    const structuredData = langData.structuredData || {};

    // Update fields if they exist in the translation
    if (structuredData.description) {
      existingData.description = structuredData.description;
    }

    if (structuredData.keywords) {
      existingData.keywords = structuredData.keywords;
    }

    if (structuredData.addressCountry && existingData.address) {
      existingData.address.addressCountry = structuredData.addressCountry;
    }

    // Update URL to match language
    if (existingData.url) {
      let baseUrl = existingData.url.replace(/\/[a-z]{2}\/?$/, "");
      baseUrl = baseUrl.replace(/\/$/, "");
      existingData.url = lang === "en" ? `${baseUrl}/` : `${baseUrl}/${lang}/`;
    }

    // Update the script content
    scriptElement.textContent = JSON.stringify(existingData, null, 2);
  } catch (error) {
    console.warn("❌ Error updating structured data:", error);
  }
}

function translatePage(lang) {
  currentLanguage = lang;
  const langData = translations[lang];

  if (!langData) {
    console.warn(`No translation data found for language: ${lang}`);
    return;
  }

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

  // Look for language code at the end of the path
  const langMatch = path.match(
    new RegExp(`\/(${supportedLanguages.join("|")})\/?$`)
  );
  const result = langMatch ? langMatch[1] : null;
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
    if (lang) {
      const newPath = `${
        pathWithoutLang === "/" ? "" : pathWithoutLang
      }/${lang}/`;
      window.history.replaceState(
        {},
        "",
        newPath + currentSearch + currentHash
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

  let languageToUse = "en"; // default

  if (urlLanguage && translations[urlLanguage]) {
    languageToUse = urlLanguage;
    // Don't update URL here as it's already correct
  } else if (savedLanguage && translations[savedLanguage]) {
    languageToUse = savedLanguage;
    // Update URL to reflect the saved language preference

    updateURLWithLanguage(savedLanguage);
  }

  translatePage(languageToUse);
}

// Initialize translations when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  loadTranslations();
});
