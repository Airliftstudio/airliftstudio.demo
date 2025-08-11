// Field validation helper functions
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);

  if (field) {
    field.classList.add("error");
  }

  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add("show");
  }
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);

  if (field) {
    field.classList.remove("error");
  }

  if (errorEl) {
    errorEl.classList.remove("show");
  }
}

function clearAllErrors() {
  const errorFields = ["name", "airbnbUrl", "domain"];
  errorFields.forEach((fieldId) => clearFieldError(fieldId));
}

// Prefill support via query parameters
(function prefillFromQuery() {
  //?name=John%20Smith&airbnb=https%3A//www.airbnb.com/rooms/12345678&domain=villa-paradise-bali.com&languages=en,de&wa=+621234567890&ig=myinsta
  const params = new URLSearchParams(location.search);
  const setVal = (id, keys) => {
    let v = null;
    for (const k of keys) {
      if (params.has(k)) {
        v = params.get(k);
        break;
      }
    }
    if (v !== null) {
      const el = document.getElementById(id);
      if (el) el.value = v;
    }
  };
  setVal("name", ["name"]);
  setVal("airbnbUrl", ["airbnb"]);
  setVal("domain", ["domain"]);
  setVal("whatsapp", ["wa"]);
  setVal("instagram", ["ig"]);
  const langs = new Set();
  if (params.has("languages")) {
    params
      .get("languages")
      .split(",")
      .forEach((c) => {
        const t = c.trim().toLowerCase();
        if (t) langs.add(t);
      });
  }

  langs.forEach((code) => {
    const cb = document.querySelector(`#languages input[value="${code}"]`);
    if (cb) cb.checked = true;
  });
})();

// Add error clearing on input
const errorFields = ["name", "airbnbUrl", "domain"];
errorFields.forEach((fieldId) => {
  const field = document.getElementById(fieldId);
  if (field) {
    field.addEventListener("input", () => clearFieldError(fieldId));
    field.addEventListener("blur", () => clearFieldError(fieldId));
  }
});

const form = document.getElementById("order-form");
const summaryWrap = document.getElementById("order-summary");
const summaryBlock = document.getElementById("summary-block");

function buildOrderText(values) {
  const languages = ["English"].concat(
    values.languages
      .map((c) => LANG_LIST.find((l) => l.code === c)?.name)
      .filter(Boolean)
  );
  return [
    `New demo order`,
    `Name: ${values.name}`,
    `Airbnb: ${values.airbnbUrl}`,
    values.domain ? `Desired domain name: ${values.domain}` : null,
    languages.length > 1 ? `Languages: ${languages.join(", ")}` : null,
    values.instagram || values.whatsapp ? `Contact info to include:` : null,
    values.whatsapp ? `WhatsApp: ${values.whatsapp}` : null,
    values.instagram ? `Instagram: ${values.instagram}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const values = {
    name: document.getElementById("name").value.trim(),
    airbnbUrl: document.getElementById("airbnbUrl").value.trim(),
    domain: document.getElementById("domain").value.trim(),
    languages: Array.from(
      langContainer.querySelectorAll('input[type="checkbox"]:checked')
    ).map((i) => i.value),
    whatsapp: document.getElementById("whatsapp").value.trim(),
    instagram: document.getElementById("instagram").value.trim(),
  };

  // Clear all previous errors
  clearAllErrors();

  // Validate each field individually
  const errors = [];

  if (!values.name) {
    showFieldError("name", "Please enter your name.");
    errors.push("name");
  }

  if (!values.airbnbUrl) {
    showFieldError("airbnbUrl", "Please enter an Airbnb listing URL.");
    errors.push("airbnbUrl");
  } else if (!isValidAirbnb(values.airbnbUrl)) {
    showFieldError("airbnbUrl", "Please enter a valid Airbnb listing URL.");
    errors.push("airbnbUrl");
  }

  if (!values.domain) {
    showFieldError("domain", "Please enter a domain name.");
    errors.push("domain");
  } else if (!isValidDomain(values.domain)) {
    showFieldError(
      "domain",
      "Please enter a valid domain name (e.g., yourvillabali.com)."
    );
    errors.push("domain");
  }

  if (errors.length > 0) {
    // Scroll to first error
    const firstErrorField = document.getElementById(errors[0]);
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      firstErrorField.focus();
    }
    return;
  }

  // Build summary
  const languages = ["English"].concat(
    values.languages
      .map((c) => LANG_LIST.find((l) => l.code === c)?.name)
      .filter(Boolean)
  );
  summaryBlock.innerHTML = `
    <div class="summary-grid">
      <div><b>Name</b><br/>${values.name}</div>
      <div><b>Airbnb</b><br/><a href="${
        values.airbnbUrl
      }" target="_blank" rel="noopener">${values.airbnbUrl}</a></div>
      <div><b>Desired domain</b><br/>${values.domain}</div>
      <div><b>Languages</b><br/>${languages.join(", ")}</div>
      ${
        values.whatsapp
          ? `<div><b>WhatsApp</b><br/>${values.whatsapp}</div>`
          : ""
      }
      ${
        values.instagram
          ? `<div><b>Instagram</b><br/>${values.instagram}</div>`
          : ""
      }
        <div><b>Languages</b><br/>${languages.join(", ")}
         <span class="summary-action-buttons">
          <button id="copy-order" class="btn btn-primary" type="button">Copy order</button>
          <button id="edit-order" class="btn btn-outline" type="button">Edit order</button>
         </span>
        </div>
    </div>
  `;

  // Build links
  const orderText = buildOrderText(values);
  const encoded = encodeURIComponent(orderText);
  const subject = encodeURIComponent(`New demo order - ${values.domain}`);

  // Instagram: deep link + profile fallback (no reliable prefill on web)
  const igUser = "airliftstudios";
  const igDeep = `instagram://user?username=${igUser}`;
  const igProfile = `https://www.instagram.com/${igUser}/`;
  const igBtn = document.getElementById("send-instagram");
  igBtn.href = igProfile;
  igBtn.addEventListener("click", () => {
    try {
      navigator.clipboard.writeText(orderText);
    } catch {}
  });
  igBtn.title = "We'll copy your order so you can paste it in DM";

  // Email
  const mail = `mailto:hello@airliftstudios.com?subject=${subject}&body=${encoded}`;
  const mailBtn = document.getElementById("send-email");
  mailBtn.href = mail;
  mailBtn.setAttribute("target", "_blank");
  mailBtn.setAttribute("rel", "noopener");

  // Copy
  const copyBtn = document.getElementById("copy-order");
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(orderText);
      copyBtn.textContent = "Copied!";
      console.log("copied to clipboard", orderText);
      setTimeout(() => (copyBtn.textContent = "Copy order"), 1500);
    } catch {}
  });

  // Show summary view
  form.style.display = "none";
  summaryWrap.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Hook edit button to go back
  const editBtn = document.getElementById("edit-order");
  if (editBtn) {
    editBtn.onclick = () => {
      summaryWrap.style.display = "none";
      form.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }
});
