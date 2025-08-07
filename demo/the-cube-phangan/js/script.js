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

// Floating CTA visibility
window.addEventListener("scroll", () => {
  const floatingCta = document.querySelector(".floating-cta");
  const heroSection = document.querySelector(".hero");
  const heroHeight = heroSection.offsetHeight;

  if (window.scrollY > heroHeight) {
    floatingCta.classList.add("visible");
  } else {
    floatingCta.classList.remove("visible");
  }
});

gsap.registerPlugin(ScrollTrigger);

// Section animations
gsap.utils
  .toArray(
    ".text-content, .image-content, .hero-content, .reviews-scroll-container, .section-title, .feature-card, .amenity-item, .review-header, .review-card, .location-item"
  )
  .forEach((section) => {
    gsap.from(section, {
      duration: 1,
      y: 50,
      opacity: 0,
      ease: "power2.out",
      scrollTrigger: {
        trigger: section,
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none reverse",
      },
    });
  });

// Gallery items animation
gsap.utils.toArray(".gallery-item").forEach((item, index) => {
  gsap.from(item, {
    duration: 0.8,
    y: 50,
    opacity: 0,
    delay: index * 0.1,
    ease: "power2.out",
    scrollTrigger: {
      trigger: item,
      start: "top 85%",
      toggleActions: "play none none reverse",
    },
  });
});

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
    const delayBetween = 110;
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
    setTimeout(() => requestAnimationFrame(animate), 400);
    // Animate stars wave
    stars.forEach((star, i) => {
      setTimeout(() => {
        star.classList.add("pulsing");
        setTimeout(() => {
          star.textContent = "★";
          star.classList.remove("pulsing");
          star.classList.add("filled");
        }, pulseDuration * 0.55);
      }, 400 + i * delayBetween);
    });
  }
}

// Dynamically populate reviews-scroll-track to always have 16 review-mini
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

document.addEventListener("DOMContentLoaded", function () {
  animateHeroStarsAndRating();
  populateReviews();

  const img = document.querySelector(".hero-bg-image");
  const placeholder = document.querySelector(".placeholder");

  img.addEventListener("load", () => {
    // Animate the image in
    gsap.to(img, {
      opacity: 1,
      scale: 1,
      duration: 1.5,
      ease: "power2.out",
    });

    // Remove the placeholder
    gsap.to(placeholder, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => placeholder.remove(),
    });
  });

  // Optional fallback: in case image is cached and already loaded
  if (img.complete) {
    img.dispatchEvent(new Event("load"));
  }
});
