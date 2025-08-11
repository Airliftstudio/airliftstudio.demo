const LANG_LIST = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "French", flag: "🇫🇷", recommended: true },
  { code: "de", name: "German", flag: "🇩🇪", recommended: true },
  { code: "es", name: "Spanish", flag: "🇪🇸", recommended: true },
  { code: "ru", name: "Russian", flag: "🇷🇺", recommended: true },
  { code: "zh", name: "Chinese (Simplified)", flag: "🇨🇳", recommended: true },
  { code: "it", name: "Italian", flag: "🇮🇹", recommended: true },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "bn", name: "Bengali", flag: "🇧🇩" },
  { code: "bg", name: "Bulgarian", flag: "🇧🇬" },
  { code: "br", name: "Brazilian Portuguese", flag: "🇧🇷" },
  { code: "cs", name: "Czech", flag: "🇨🇿" },
  { code: "da", name: "Danish", flag: "🇩🇰" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "el", name: "Greek", flag: "🇬🇷" },
  { code: "fa", name: "Persian", flag: "🇮🇷" },
  { code: "fil", name: "Filipino", flag: "🇵🇭" },
  { code: "fi", name: "Finnish", flag: "🇫🇮" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "hr", name: "Croatian", flag: "🇭🇷" },
  { code: "hu", name: "Hungarian", flag: "🇭🇺" },
  { code: "id", name: "Indonesian", flag: "🇮🇩" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "ms", name: "Malay", flag: "🇲🇾" },
  { code: "no", name: "Norwegian", flag: "🇳🇴" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ro", name: "Romanian", flag: "🇷🇴" },
  { code: "si", name: "Sinhala", flag: "🇱🇰" },
  { code: "sl", name: "Slovenian", flag: "🇸🇮" },
  { code: "sv", name: "Swedish", flag: "🇸🇪" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "uk", name: "Ukrainian", flag: "🇺🇦" },
  { code: "ur", name: "Urdu", flag: "🇵🇰" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
];

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (href && href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      // Close mobile menu on navigation
      const menu = document.querySelector(".nav-links");
      if (menu && menu.classList.contains("open"))
        menu.classList.remove("open");
    }
  });
});

// Mobile nav toggle
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

// GSAP animations
if (window.gsap) {
  gsap.registerPlugin(ScrollTrigger);

  // Section animations
  gsap.utils
    .toArray(".text-content, .image-content, .journey-step")
    .forEach((section) => {
      gsap.from(section, {
        duration: 0.9,
        y: 40,
        opacity: 0,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 85%",
          end: "bottom 25%",
          toggleActions: "play none none reverse",
        },
      });
    });
}

// Dynamic year in footer
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// FAQ functionality - CSS-only approach using native details/summary
document.addEventListener("DOMContentLoaded", () => {
  // Listen for toggle events on details elements
  document.querySelectorAll(".faq-item").forEach((faqItem) => {
    faqItem.addEventListener("toggle", () => {
      const icon = faqItem.querySelector(".faq-icon");
      if (icon) {
        if (faqItem.hasAttribute("open")) {
          icon.className = "fa-solid fa-minus faq-icon";
        } else {
          icon.className = "fa-solid fa-plus faq-icon";
        }
      }
    });
  });
});
