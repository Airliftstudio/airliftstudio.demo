const langContainer = document.getElementById("languages");
// Render checkboxes excluding English
LANG_LIST.filter((l) => l.code !== "en").forEach((lang) => {
  const id = `lang-${lang.code}`;
  const wrapper = document.createElement("label");
  wrapper.className = "language-item";
  wrapper.innerHTML = `<input type="checkbox" id="${id}" value="${
    lang.code
  }" /> <span>${lang.flag} ${lang.name}</span>${
    lang.recommended
      ? '<span class="language-recommended">Recommended</span>'
      : ""
  }`;
  langContainer.appendChild(wrapper);
});

function isValidDomain(domain) {
  return /^[a-z0-9-]+\.[a-z]{2,}$/i.test(domain.trim());
}
function isValidDemoUrl(url) {
  try {
    const u = new URL(url);
    return (
      u.hostname.endsWith("airliftstudios.com") &&
      u.pathname.startsWith("/demo/") &&
      u.pathname.length > "/demo/".length
    );
  } catch {
    console.log("invalid url", url);
    return false;
  }
}
function isValidEmail(email) {
  console.log("invalid email", email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function sanitizeLocal(local) {
  return local.replace(/[^a-z0-9._+-]/gi, "").toLowerCase();
}

function formatUSD(n) {
  return `$${Number(n).toFixed(2)}`;
}

function isValidAirbnb(url) {
  try {
    const u = new URL(url);
    return /airbnb\.\w+/.test(u.hostname) && /\/rooms\//.test(u.pathname);
  } catch {
    return false;
  }
}
