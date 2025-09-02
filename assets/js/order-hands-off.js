const BASE_PRICE = 59.9; // hands-off discounted price
const ORIGINAL_PRICE = 199.0; // original before discount
const LANG_FIRST = 29.0;
const LANG_ADDITIONAL = 19.0;
const YEAR_EXTRA = 39.0;

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
  const errorFields = [
    "name",
    "demoUrl",
    "domain",
    "emailName",
    "forwardTo",
    "firstName",
    "lastName",
    "regEmail",
    "phone",
    "country",
    "address",
    "city",
    "state",
    "postalCode",
  ];
  errorFields.forEach((fieldId) => clearFieldError(fieldId));
}

function isValidPhone(phone) {
  // Basic phone validation: must start with + and contain only digits, spaces, parentheses, and hyphens
  return /^\+[\d\s\(\)\-]+$/.test(phone.trim()) && phone.trim().length >= 8;
}

function isValidName(name) {
  // Basic name validation: letters, spaces, hyphens, apostrophes
  return /^[a-zA-Z\s\-']+$/.test(name.trim()) && name.trim().length >= 2;
}

function isValidAddress(address) {
  // Basic address validation: letters, numbers, spaces, common punctuation
  return (
    /^[a-zA-Z0-9\s\.,\-'#]+$/.test(address.trim()) && address.trim().length >= 5
  );
}

function isValidPostalCode(postalCode) {
  // Basic postal code validation: letters, numbers, spaces, hyphens
  return (
    /^[a-zA-Z0-9\s\-]+$/.test(postalCode.trim()) &&
    postalCode.trim().length >= 3
  );
}

function buildReceiptLines(values) {
  const lines = [];
  lines.push({
    label: `Hands‑Off package`,
    amount: ORIGINAL_PRICE,
  });
  const savings = Math.max(0, ORIGINAL_PRICE - BASE_PRICE);
  if (savings > 0) lines.push({ label: "Package discount", amount: -savings });
  values.languages.forEach((code, idx) => {
    const lang = LANG_LIST.find((l) => l.code === code);
    const price = idx === 0 ? LANG_FIRST : LANG_ADDITIONAL;
    lines.push({
      label: `Language: ${lang ? lang.name : code}`,
      amount: price,
    });
  });
  const extraYears = Number(values.years);
  if (extraYears > 1)
    lines.push({
      label: `${extraYears}  years secured`,
      amount: extraYears * YEAR_EXTRA,
    });
  const total = lines.reduce((s, l) => s + l.amount, 0);

  return { lines, total };
}

function renderSummaryReceipt(values) {
  const { lines, total } = buildReceiptLines(values);
  const container = document.getElementById("summary-receipt-lines");
  if (container)
    container.innerHTML = lines
      .map(
        (l) =>
          `<div style="display:flex; justify-content:space-between;"><span>${
            l.label
          }</span><span>${l.amount < 0 ? "-" : ""}${formatUSD(
            Math.abs(l.amount)
          )}</span></div>`
      )
      .join("");
  const totalEl = document.getElementById("summary-receipt-total");
  if (totalEl) totalEl.textContent = formatUSD(total);
  const monthlyEl = document.getElementById("summary-monthly");
  if (monthlyEl) {
    const yearsNum = Number(values.years || 1);
    if (yearsNum > 2) {
      const perMonth = total / (yearsNum * 12);
      monthlyEl.textContent = `Works out at only ${formatUSD(
        perMonth
      )} / month`;
    } else {
      monthlyEl.textContent = "";
    }
  }
}
const form = document.getElementById("order-form");
const summaryWrap = document.getElementById("order-summary");
const summaryBlock = document.getElementById("summary-block");
const domainEl = document.getElementById("domain");
const emailNameEl = document.getElementById("emailName");
const emailFullEl = document.getElementById("emailFull");
const yearsEl = document.getElementById("years");

function computeEmail() {
  const domain = (domainEl.value || "").trim();
  const local = sanitizeLocal(emailNameEl.value || "hello") || "hello";
  if (isValidDomain(domain)) {
    emailFullEl.textContent = `${local}@${domain}`;
  } else {
    emailFullEl.textContent = `${local}@yourdomain.com`;
  }
}
emailNameEl.addEventListener("input", computeEmail);
domainEl.addEventListener("input", computeEmail);
computeEmail();

// Add error clearing on input
const errorFields = [
  "name",
  "demoUrl",
  "domain",
  "emailName",
  "forwardTo",
  "firstName",
  "lastName",
  "regEmail",
  "phone",
  "country",
  "address",
  "city",
  "state",
  "postalCode",
];
errorFields.forEach((fieldId) => {
  const field = document.getElementById(fieldId);
  if (field) {
    field.addEventListener("input", () => clearFieldError(fieldId));
    field.addEventListener("blur", () => clearFieldError(fieldId));
  }
});

// Tooltip click toggle and outside click close
document.addEventListener("click", (e) => {
  const triggers = document.querySelectorAll(".biz-info-icon");
  triggers.forEach((t) => {
    if (t.contains(e.target)) {
      const expanded = t.getAttribute("aria-expanded") === "true";
      t.setAttribute("aria-expanded", expanded ? "false" : "true");
    } else {
      t.setAttribute("aria-expanded", "false");
    }
  });
});

// Prefill support via query parameters
(function prefillFromQuery() {
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
  if (params.has("demo_url")) {
    const demoPart = params.get("demo_url").replace(/^\/+|\/+$/g, "");
    const fullUrl = `https://airliftstudios.com/demo/${demoPart}`;
    const el = document.getElementById("demoUrl");
    if (el) el.value = fullUrl;
  }
  setVal("domain", ["domain"]);
  setVal("emailName", ["email"]);
  setVal("forwardTo", ["forward_to"]);
  if (params.has("wa")) {
    let waVal = params.get("wa");
    if (waVal && !waVal.startsWith("+")) {
      waVal = "+" + waVal;
    }
    const el = document.getElementById("whatsapp");
    if (el) el.value = waVal;
  }
  setVal("instagram", ["ig"]);
  setVal("years", ["years"]);
  // Domain registration contact information
  setVal("firstName", ["first_name", "firstName"]);
  setVal("lastName", ["last_name", "lastName"]);
  setVal("regEmail", ["reg_email", "regEmail"]);
  setVal("phone", ["phone"]);
  setVal("country", ["country"]);
  setVal("address", ["address"]);
  setVal("city", ["city"]);
  setVal("state", ["state"]);
  setVal("postalCode", ["postal_code", "postalCode"]);
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
  const pe = params.get("email");
  if (pe && pe.includes("@")) {
    const [local, dom] = pe.split("@");
    if (local && !document.getElementById("email").value)
      document.getElementById("email").value = sanitizeLocal(local);
    if (dom && !document.getElementById("domain").value)
      document.getElementById("domain").value = dom;
  }
  computeEmail();
})();

function buildOrderText(values) {
  const languages = ["English"].concat(
    values.languages
      .map((c) => LANG_LIST.find((l) => l.code === c)?.name)
      .filter(Boolean)
  );

  const orderLines = [
    "Hands‑Off package order",
    `Name: ${values.name}`,
    `Demo: ${values.demoUrl}`,
    `Desired domain: ${values.domain}`,
    `Public email: ${values.publicEmail}`,
    `Forward to: ${values.forwardTo}`,
    `Years secured: ${values.years}`,
    `Languages: ${languages.join(", ")}`,
    values.instagram || values.whatsapp ? `Contact info to include:` : null,
    values.whatsapp ? `WhatsApp: ${values.whatsapp}` : null,
    values.instagram ? `Instagram: ${values.instagram}` : null,
  ];

  // Add domain registration contact information if any field is filled
  const hasDomainInfo =
    values.firstName ||
    values.lastName ||
    values.regEmail ||
    values.phone ||
    values.country ||
    values.address ||
    values.city ||
    values.state ||
    values.postalCode;

  if (hasDomainInfo) {
    orderLines.push("", "\n");
    orderLines.push("", "Domain registration contact information:");
    if (values.firstName) orderLines.push(`First name: ${values.firstName}`);
    if (values.lastName) orderLines.push(`Last name: ${values.lastName}`);
    if (values.regEmail) orderLines.push(`Email: ${values.regEmail}`);
    if (values.phone) orderLines.push(`Phone: ${values.phone}`);
    if (values.country) orderLines.push(`Country: ${values.country}`);
    if (values.address) orderLines.push(`Address: ${values.address}`);
    if (values.city) orderLines.push(`City: ${values.city}`);
    if (values.state) orderLines.push(`State/Province: ${values.state}`);
    if (values.postalCode) orderLines.push(`Postal code: ${values.postalCode}`);
  }

  return orderLines.filter(Boolean).join("\n");
}

function showDomainInfoWarning() {
  // Create modal overlay
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;

  // Create modal content
  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    background: white;
    padding: 24px;
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  `;

  modalContent.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h3 style="margin: 0 0 12px 0; color: #dc3545;">⚠️ Incomplete Contact Information</h3>
      <p style="margin: 0; line-height: 1.5;">
        The domain registration contact information needs to be complete to be valid. 
        If you do not want to share this information with us, you can add it later yourself 
        following our provided guide.
      </p>
    </div>
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button id="clear-contact-info" class="btn btn-outline" style="min-width: 120px;">
        Clear All Contact Info
      </button>
      <button id="close-modal" class="btn btn-primary" style="min-width: 120px;">
        Continue Editing
      </button>
    </div>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Handle clear contact info
  document
    .getElementById("clear-contact-info")
    .addEventListener("click", () => {
      const contactFields = [
        "firstName",
        "lastName",
        "regEmail",
        "phone",
        "country",
        "address",
        "city",
        "state",
        "postalCode",
      ];
      contactFields.forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        if (field) field.value = "";
      });
      document.body.removeChild(modal);
    });

  // Handle close modal
  document.getElementById("close-modal").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const values = {
    name: document.getElementById("name").value.trim(),
    demoUrl: document.getElementById("demoUrl").value.trim(),
    domain: document.getElementById("domain").value.trim(),
    languages: Array.from(
      document.querySelectorAll('#languages input[type="checkbox"]:checked')
    ).map((i) => i.value),
    emailName:
      sanitizeLocal(document.getElementById("emailName").value || "hello") ||
      "hello",
    forwardTo: document.getElementById("forwardTo").value.trim(),
    whatsapp: document.getElementById("whatsapp").value.trim(),
    instagram: document.getElementById("instagram").value.trim(),
    years: document.getElementById("years").value,
    // Domain registration contact information
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    regEmail: document.getElementById("regEmail").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    country: document.getElementById("country").value.trim(),
    address: document.getElementById("address").value.trim(),
    city: document.getElementById("city").value.trim(),
    state: document.getElementById("state").value.trim(),
    postalCode: document.getElementById("postalCode").value.trim(),
  };
  values.publicEmail = `${values.emailName}@${values.domain}`;

  // Clear all previous errors
  clearAllErrors();

  // Validate each field individually
  const errors = [];

  if (!values.name) {
    showFieldError("name", "Please enter your name.");
    errors.push("name");
  }

  if (!values.demoUrl) {
    showFieldError("demoUrl", "Please enter a demo URL.");
    errors.push("demoUrl");
  } else if (!isValidDemoUrl(values.demoUrl)) {
    showFieldError(
      "demoUrl",
      "Please enter a valid demo URL from airliftstudios.com."
    );
    errors.push("demoUrl");
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

  if (!isValidEmail(values.publicEmail)) {
    showFieldError("emailName", "Please enter a valid email name.");
    errors.push("emailName");
  }

  if (!values.forwardTo) {
    showFieldError("forwardTo", "Please enter an email address to forward to.");
    errors.push("forwardTo");
  } else if (!isValidEmail(values.forwardTo)) {
    showFieldError("forwardTo", "Please enter a valid email address.");
    errors.push("forwardTo");
  }

  // Validate domain registration contact information
  const hasDomainInfo =
    values.firstName ||
    values.lastName ||
    values.regEmail ||
    values.phone ||
    values.country ||
    values.address ||
    values.city ||
    values.state ||
    values.postalCode;

  const isDomainInfoComplete =
    values.firstName &&
    values.lastName &&
    values.regEmail &&
    values.phone &&
    values.country &&
    values.address &&
    values.city &&
    values.state &&
    values.postalCode;

  if (hasDomainInfo && !isDomainInfoComplete) {
    // Show warning modal for incomplete domain registration info
    showDomainInfoWarning();
    return;
  }

  // Validate individual domain registration fields if any are filled
  if (hasDomainInfo) {
    if (!isValidName(values.firstName)) {
      showFieldError(
        "firstName",
        "Please enter a valid first name (letters only)."
      );
      errors.push("firstName");
    }

    if (!isValidName(values.lastName)) {
      showFieldError(
        "lastName",
        "Please enter a valid last name (letters only)."
      );
      errors.push("lastName");
    }

    if (!isValidEmail(values.regEmail)) {
      showFieldError("regEmail", "Please enter a valid email address.");
      errors.push("regEmail");
    }

    if (!isValidPhone(values.phone)) {
      showFieldError(
        "phone",
        "Please enter a valid phone number with country code (e.g., +1 555 123 4567)."
      );
      errors.push("phone");
    }

    if (!isValidName(values.country)) {
      showFieldError("country", "Please enter a valid country name.");
      errors.push("country");
    }

    if (!isValidAddress(values.address)) {
      showFieldError("address", "Please enter a valid address.");
      errors.push("address");
    }

    if (!isValidName(values.city)) {
      showFieldError("city", "Please enter a valid city name.");
      errors.push("city");
    }

    if (!isValidName(values.state)) {
      showFieldError("state", "Please enter a valid state or province.");
      errors.push("state");
    }

    if (!isValidPostalCode(values.postalCode)) {
      showFieldError("postalCode", "Please enter a valid postal code.");
      errors.push("postalCode");
    }
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

  // Summary
  const languages = ["English"].concat(
    values.languages
      .map((c) => LANG_LIST.find((l) => l.code === c)?.name)
      .filter(Boolean)
  );
  let domainInfoHtml = "";
  if (hasDomainInfo) {
    domainInfoHtml = `
      <div style="grid-column: 1 / -1; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
        <div style="font-weight: 700; margin-bottom: 12px; color: var(--primary);">Domain registration contact information:</div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          ${
            values.firstName
              ? `<div><b>First name</b><br/>${values.firstName}</div>`
              : ""
          }
          ${
            values.lastName
              ? `<div><b>Last name</b><br/>${values.lastName}</div>`
              : ""
          }
          ${
            values.regEmail
              ? `<div><b>Email</b><br/>${values.regEmail}</div>`
              : ""
          }
          ${values.phone ? `<div><b>Phone</b><br/>${values.phone}</div>` : ""}
          ${
            values.country
              ? `<div><b>Country</b><br/>${values.country}</div>`
              : ""
          }
          ${
            values.address
              ? `<div><b>Address</b><br/>${values.address}</div>`
              : ""
          }
          ${values.city ? `<div><b>City</b><br/>${values.city}</div>` : ""}
          ${
            values.state
              ? `<div><b>State/Province</b><br/>${values.state}</div>`
              : ""
          }
          ${
            values.postalCode
              ? `<div><b>Postal code</b><br/>${values.postalCode}</div>`
              : ""
          }
        </div>
      </div>
    `;
  }

  summaryBlock.innerHTML = `
      <div class="summary-grid">
        <div><b>Name</b><br/>${values.name}</div>
        <div><b>Demo</b><br/><a href="${
          values.demoUrl
        }" target="_blank" rel="noopener">${values.demoUrl}</a></div>
        <div><b>Desired domain</b><br/>${values.domain}</div>
        <div><b>Public email</b><br/>${values.publicEmail}</div>
        <div><b>Forward to</b><br/>${values.forwardTo}</div>
        <div><b>Years secured</b><br/>${values.years}</div>
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
        <div>
         <span class="summary-action-buttons">
          <button id="copy-order" class="btn btn-primary" type="button">Copy order</button>
          <button id="edit-order" class="btn btn-outline" type="button">Edit order</button>
         </span>
        </div>
        ${domainInfoHtml}
      </div>
    `;
  renderSummaryReceipt(values);

  // Share links (include pricing receipt in body)
  const receipt = buildReceiptLines(values);
  const receiptText =
    receipt.lines
      .map(
        (l) =>
          `- ${l.label}: ${l.amount < 0 ? "-" : ""}${formatUSD(
            Math.abs(l.amount)
          )}`
      )
      .join("\n") + `\nTotal: ${formatUSD(receipt.total)}`;
  const orderText = buildOrderText(values) + `\n\nReceipt:\n${receiptText}`;
  const encoded = encodeURIComponent(orderText);
  const subject = encodeURIComponent(`Hands‑Off order - ${values.domain}`);

  const igUser = "airlift.studios";
  const igBtn = document.getElementById("send-instagram");
  const igDmLink = `https://ig.me/m/${igUser}?text=${orderText}`;
  igBtn.href = igDmLink;
  igBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const originalText = igBtn.textContent;

    try {
      await navigator.clipboard.writeText(orderText);
      igBtn.textContent = "Order copied";
      igBtn.style.backgroundColor = "#0ea5e9";
      igBtn.style.color = "white";

      setTimeout(() => {
        igBtn.textContent = originalText;
        igBtn.style.backgroundColor = "";
        igBtn.style.color = "";
        window.open(igBtn.href, "_blank", "noopener");
      }, 800);
    } catch (error) {
      // Fallback if clipboard fails
      window.open(igBtn.href, "_blank", "noopener");
    }
  });
  igBtn.title = "We'll copy your order so you can paste it in DM";

  const mailBtn = document.getElementById("send-email");
  mailBtn.href = `mailto:order@airliftstudios.com?subject=${subject}&body=${encoded}`;
  mailBtn.target = "_blank";
  mailBtn.rel = "noopener";
  mailBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const originalText = mailBtn.textContent;

    try {
      await navigator.clipboard.writeText(orderText);
      mailBtn.textContent = "Order copied";
      mailBtn.style.backgroundColor = "#0ea5e9";
      mailBtn.style.color = "white";

      setTimeout(() => {
        mailBtn.textContent = originalText;
        mailBtn.style.backgroundColor = "";
        mailBtn.style.color = "";
        window.open(mailBtn.href, "_blank", "noopener");
      }, 800);
    } catch (error) {
      // Fallback if clipboard fails
      window.open(mailBtn.href, "_blank", "noopener");
    }
  });

  const copyBtn = document.getElementById("copy-order");
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(orderText);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy order"), 1500);
    } catch {}
  });

  // Toggle view
  form.style.display = "none";
  summaryWrap.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Edit flow
  const editBtn = document.getElementById("edit-order");
  if (editBtn) {
    editBtn.onclick = () => {
      summaryWrap.style.display = "none";
      form.style.display = "";
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }
});
