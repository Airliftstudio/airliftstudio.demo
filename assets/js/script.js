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
    .toArray(".text-content, .image-content, .journey-step, .why-card")
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
  const screenshots = document.querySelectorAll(
    ".hero-card:not(:first-child) .website-screenshot"
  );

  // Add scrolling class to trigger CSS animation
  screenshots.forEach((screenshot, index) => {
    setTimeout(() => {
      screenshot.classList.add("scrolling");

      // Add GSAP scroll animation for smoother effect
      const img = screenshot.querySelector("img");
      gsap.to(img, {
        y: "-80%",
        duration: 6,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
        delay: index * 0.5,
        repeatDelay: 2, // 2 second delay at the top before repeating
      });
    }, index * 1000); // Stagger the animations
  });
});
