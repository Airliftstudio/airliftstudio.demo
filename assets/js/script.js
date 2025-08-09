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
  gsap.utils.toArray(".text-content, .image-content").forEach((section) => {
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
