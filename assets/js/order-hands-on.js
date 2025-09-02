const BASE_PRICE = 38.9; // hands-off discounted price
const ORIGINAL_PRICE = 129.0; // original before discount
const LANG_FIRST = 29.0;
const LANG_ADDITIONAL = 19.0;

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
  const errorFields = ["name", "demoUrl"];
  errorFields.forEach((fieldId) => clearFieldError(fieldId));
}

function buildReceiptLines(values) {
  const lines = [];
  lines.push({
    label: `Hands‑On package`,
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
    monthlyEl.textContent = "";
  }
}

const form = document.getElementById("order-form");
const summaryWrap = document.getElementById("order-summary");
const summaryBlock = document.getElementById("summary-block");

// Add error clearing on input
const errorFields = ["name", "demoUrl"];
errorFields.forEach((fieldId) => {
  const field = document.getElementById(fieldId);
  if (field) {
    field.addEventListener("input", () => clearFieldError(fieldId));
    field.addEventListener("blur", () => clearFieldError(fieldId));
  }
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
  // Special handling: demo_url param is just the last part, build full URL
  if (params.has("demo_url")) {
    const demoPart = params.get("demo_url").replace(/^\/+|\/+$/g, "");
    const fullUrl = `https://airliftstudios.com/demo/${demoPart}`;
    const el = document.getElementById("demoUrl");
    if (el) el.value = fullUrl;
  }
  // Prefill WhatsApp with "+" if missing
  if (params.has("wa")) {
    let waVal = params.get("wa");
    if (waVal && !waVal.startsWith("+")) {
      waVal = "+" + waVal;
    }
    const el = document.getElementById("whatsapp");
    if (el) el.value = waVal;
  }
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

function buildOrderText(values) {
  const languages = ["English"].concat(
    values.languages
      .map((c) => LANG_LIST.find((l) => l.code === c)?.name)
      .filter(Boolean)
  );
  return [
    "Hands‑On package order",
    `Name: ${values.name}`,
    `Demo: ${values.demoUrl}`,
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
    languages: Array.from(
      document.querySelectorAll('#languages input[type="checkbox"]:checked')
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
  const subject = encodeURIComponent(`Hands‑On order`);

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
      form.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }
});
