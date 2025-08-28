// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Floating CTA visibility with smooth fade
window.addEventListener("scroll", () => {
  const floatingCta = document.querySelector(".floating-cta");
  const heroSection = document.querySelector(".hero");
  const heroHeight = heroSection.offsetHeight;

  if (window.scrollY > heroHeight * 0.8) {
    floatingCta.classList.add("visible");
  } else {
    floatingCta.classList.remove("visible");
  }
});

gsap.registerPlugin(ScrollTrigger);

// Section animations with enhanced effects
gsap.utils
  .toArray(
    ".text-content, .image-content, .hero-content, .reviews-scroll-container, .section-title, .location-item"
  )
  .forEach((section) => {
    gsap.from(section, {
      duration: 1,
      y: 40,
      opacity: 0,
      ease: "power3.out",
      scrollTrigger: {
        trigger: section,
        start: "top 90%",
        once: true,
      },
    });
  });

// Staggered item animations
[".gallery-item", ".amenity-item", ".feature-card", ".review-card"].forEach(
  (selector) => {
    const items = gsap.utils.toArray(selector);
    items.forEach((item, idx) => {
      gsap.from(item, {
        duration: 0.8,
        y: 30,
        x: 10,
        opacity: 0,
        delay: idx * 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: item,
          start: "top 95%",
          once: true,
        },
      });
    });
  }
);

// Animated star wave fill and rating count-up
function animateHeroStarsAndRating() {
  function formatRating(airbnbRating) {
    let rating = parseFloat(airbnbRating);
    if (rating > 4.9) {
      return 4.9;
    }
    return Math.round(airbnbRating * 10) / 10;
  }
  const ratingEl = document.getElementById("hero-rating-animation-value");
  const starsEl = document.getElementById("hero-stars");
  if (ratingEl && starsEl) {
    const stars = Array.from(starsEl.querySelectorAll(".star"));
    const airbnbRating = parseFloat(
      document.getElementById("airbnb-rating-value").textContent
    );
    const duration = 400;
    const pulseDuration = 320;
    const delayBetween = 120;
    let start = null;
    function animate(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(
        1,
        elapsed / (duration + (stars.length - 1) * delayBetween)
      );
      const val = progress * airbnbRating;
      ratingEl.textContent = val.toFixed(1);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        ratingEl.textContent = formatRating(airbnbRating);
      }
    }
    setTimeout(() => requestAnimationFrame(animate), 600);
    // Animate stars wave
    stars.forEach((star, i) => {
      setTimeout(() => {
        star.classList.add("pulsing");
        setTimeout(() => {
          star.textContent = "★";
          star.classList.remove("pulsing");
          star.classList.add("filled");
        }, pulseDuration * 0.6);
      }, 600 + i * delayBetween);
    });
  }
}

// Dynamically populate reviews-scroll-track
function populateReviews() {
  const track = document.getElementById("reviews-scroll-track");
  if (track) {
    const unique = Array.from(track.querySelectorAll(".review-mini"));
    if (unique.length === 0) return;
    const total = 16;
    // Remove all but the unique reviews
    track.innerHTML = "";
    for (let i = 0; i < total; ++i) {
      const clone = unique[i % unique.length].cloneNode(true);
      track.appendChild(clone);
    }
  }
}

function animateHeroImage() {
  const img = document.querySelector(".hero-bg-image");
  const placeholder = document.querySelector(".hero-placeholder");

  img.addEventListener("load", () => {
    // Animate the image in
    gsap.to(img, {
      opacity: 1,
      scale: 1,
      duration: 2.5,
      ease: "power2.out",
    });

    // Remove the placeholder
    gsap.to(placeholder, {
      opacity: 0,
      duration: 1.2,
      onComplete: () => placeholder.remove(),
    });
  });

  // Optional fallback: in case image is cached and already loaded
  if (img.complete) {
    img.dispatchEvent(new Event("load"));
  }
}

// Add about image hover effect
function setupImageHoverEffects() {
  const aboutImage = document.querySelector(".about-image img");
  if (aboutImage) {
    aboutImage.addEventListener("mouseenter", () => {
      gsap.to(aboutImage, {
        scale: 1.05,
        duration: 0.5,
        ease: "power2.out",
      });
    });

    aboutImage.addEventListener("mouseleave", () => {
      gsap.to(aboutImage, {
        scale: 1,
        duration: 0.5,
        ease: "power2.out",
      });
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  animateHeroImage();
  animateHeroStarsAndRating();
  populateReviews();
  setupImageHoverEffects();
});
