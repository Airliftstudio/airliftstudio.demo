const BASE_PRICE = 59.0; // hands-off discounted price
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
  const errorFields = ["name", "demoUrl", "domain", "emailName", "forwardTo"];
  errorFields.forEach((fieldId) => clearFieldError(fieldId));
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
//file:///Users/emilmannfeldt/dev/workspace/other/airliftstudio/order_hands_off.html?name=Jane%20Doe&demo_url=https%3A%2F%2Fwww.airliftstudios.com%2Fdemo%2Fmy-airbnb&domain=myvilla.com&email=hello&forward_to=host%40gmail.com&languages=fr,de&years=3
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
const errorFields = ["name", "demoUrl", "domain", "emailName", "forwardTo"];
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
  return [
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
  ]
    .filter(Boolean)
    .join("\n");
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

  const igUser = "airliftstudios";
  const igBtn = document.getElementById("send-instagram");
  igBtn.href = `https://www.instagram.com/${igUser}/`;
  igBtn.addEventListener("click", () => {
    try {
      navigator.clipboard.writeText(orderText);
    } catch {}
  });
  igBtn.title = "We'll copy your order so you can paste it in DM";

  const mailBtn = document.getElementById("send-email");
  mailBtn.href = `mailto:hello@airliftstudios.com?subject=${subject}&body=${encoded}`;
  mailBtn.target = "_blank";
  mailBtn.rel = "noopener";

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
